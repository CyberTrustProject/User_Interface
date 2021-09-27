var request     = require('request');
var mysql       = require('mysql');
var multer      = require('multer');
const csv       = require('csv-parser');
var fs          = require('fs');
var {PythonShell} = require('python-shell');
var DATACOMMON  = require('./DataCommon');
var MISP        = require('./Misp');
var mem = {}; //Memoria tampone

//MulterConfiguration
var storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, 'public/uploads');
    },
    filename: function(req, file, cb){
        cb(null, file.fieldname + '-' + Date.now());
    }
});
var upload = multer({storage: storage});
var dataPool  = DATACOMMON.dataPool;

var OFFLINE = require('./OfflineData');
var datiOffline = OFFLINE.mock();
var connection_opt = {
    address : "http://192.168.50.2:8000"
}

var crawlerConnection = {
    "address": "http://172.16.4.20:5000/api",
    "clean_address": "http://172.16.4.20"
};
var $test = false;

//Crawler
//Crawler API
exports.crawlersType = function(req, res){ //Retrieve the type of crawlers
    res.end(JSON.stringify({
        'data': {
            'focused': "Focused Crawl",
            'indepth_clear': "In-Depth Crawl Clear",
            'indepth_dark': "In-Depth Crawl Dark"
        }
    }));
};
exports.crawlersPorts = function(req, res){ //Retrieve the available ports for crawlers
    request({
        url: crawlerConnection['address'] + '/ports?available=true',
        method: 'GET',
    }, function (error, response, body) {
        if(error){
            console.error("[ERROR]Crawler List: ", error);
            res.end(JSON.stringify({err: error}));
        }else{
            res.end(JSON.stringify({'data': JSON.parse(body)}));
        }
    });
};
exports.crawlers = function(req, res){ //Reading the crawler from iridanos
    var param = req.body;
    request(crawlerConnection['address']+'/crawlers', function (error, response, body) {
        if(error){
            console.error("[ERROR]Crawler List: ", error);
            res.end(JSON.stringify({err: error}));
        }else{
            var data = JSON.parse(body);
            crawlersStatus(data, [], function(response){
                res.end(JSON.stringify({'data': response}));
            })
        }
    });
};
exports.crawler = function(req, res){
    var param = req.body;
    if(param['crawler_id']){
        request(crawlerConnection['address']+'/crawlers/'+param['crawler_id'], function (error, response, body) {
            if(error){
                console.error("[ERROR]Crawler List: ", error);
                res.end(JSON.stringify({err: error}));
            }else{
                crawlersStatus([JSON.parse(body)], [], function(response){
                    res.end(JSON.stringify({'data': response[0]}));
                })
            }
        });
    }else{
        console.error("[ERROR]Data Crawler: Missing data");
        res.end(JSON.stringify({err: 'Missing data'}));
    }
};
exports.addCrawlers = function(req, res){ //Add new Crawler
    var param = req.body;
    if(param['crawler_id'] && param['port'] && param['crawler_type']){
        request({
            url: crawlerConnection['address'] + '/crawlers/' + param['crawler_id'],
            method: 'POST',
            json: JSON.parse(JSON.stringify({'crawler_type': param['crawler_type'],  'port': parseInt(param['port'])}))
        }, function (error, response, body) {
            if(error){
                console.error("[ERROR]Add new Seed: ", error);
                res.end(JSON.stringify({err: error}));
            }else{
                res.end(JSON.stringify(body));
            }
        });
    }else{
        console.error("[ERROR]Add Crawler: Missing data");
        res.end(JSON.stringify({err: 'Missing data'}));
    }
};
exports.statusCrawler = function(req, res){ //Change the status of a single crawler (on.off)
    var param = req.body;
    if(param['crawler_id'] && param['status']){
        var status = '';
        if(param['status'] == 'true'){
            status = 'stop';
        }else{
            status = 'start';
        }
        console.info(crawlerConnection['address']+'/crawlers/'+param['crawler_id']+'/'+status+'_crawl');
        request(crawlerConnection['address']+'/crawlers/'+param['crawler_id']+'/'+status+'_crawl', function (error, response, body) {
            if(error){
                console.error("[ERROR]Crawler Status: ", error);
                res.end(JSON.stringify({err: error}));
            }else{
                res.end(JSON.stringify({'data': body}));
            }
        });
    }else{
        console.error("[ERROR]Start/Stop Crawler: Missing data");
        res.end(JSON.stringify({err: 'Missing data'}));
    }
};
exports.crawledPages = function(req, res){ //Reading the crawler data from iridanos
    var param = req.body;
    if(param['crawler_id']){
        var page_type = ['relevant', 'nonrelevant'];
        requestCrawledPages(param['crawler_id'], page_type, {}, function(crawledPages){
            if(crawledPages['error']){
                console.error("[ERROR]CrawledPages List: ", error);
                res.end(JSON.stringify({err: error}));
            }else{
                res.end(JSON.stringify({'data': crawledPages}));
            }
        });
    }else{
        console.error("[ERROR]Data Crawler: Missing data");
        res.end(JSON.stringify({err: 'Missing data'}));
    }
};
exports.crawlerData = function(req, res){ //Reading the crawler data from iridanos
    var param = req.body;

    if(param['crawler_port']){
        request(crawlerConnection['clean_address']+':'+param['crawler_port']+'/crawls/default/metrics', function (error, response, body) {
            if(error){
                console.error("[ERROR]CrawlerData List: ", error);
                res.end(JSON.stringify({err: error}));
            }else{
                crawlerParser(JSON.parse(body), function(data){
                    res.end(JSON.stringify({'data': data}));
                });
            }
        });
    }else{
        console.error("[ERROR]Data Crawler: Missing data");
        res.end(JSON.stringify({err: 'Missing data'}));
    }
};
function crawlerParser(data, cb){
    var obj = {};
    var gauges = data['gauges'];
    var counters = data['counters'];
    obj['downloader'] = {
        dispatch    : gauges['downloader.dispatch_queue.size']['value'],
        download    : gauges['downloader.download_queue.size']['value'],
        pending     : gauges['downloader.pending_downloads']['value']

    }
    obj['handlers'] = {
        handlers    : gauges['downloader.running_handlers']['value'],
        request     : gauges['downloader.running_requests']['value']
    }
    obj['frontierManager'] = {
        available           : gauges['frontier_manager.last_load.available']['value'],
        rejected            : gauges['frontier_manager.last_load.rejected']['value'],
        uncrawled           : gauges['frontier_manager.last_load.uncrawled']['value'],
        empty_domains       : gauges['frontier_manager.scheduler.empty_domains']['value'],
        non_expired_domains : gauges['frontier_manager.scheduler.non_expired_domains']['value'],
        number_of_links     : gauges['frontier_manager.scheduler.number_of_links']['value'],
        harvest_rate        : parseFloat(gauges["target.storage.harvest.rate"]['value']*100).toFixed(2)+ "%"
    }
    obj['fetches']  = {
        successes   : counters['downloader.fetches.successes']['count'],
        aborted     : counters['downloader.fetches.aborted']['count'],
        errors      : counters['downloader.fetches.errors']['count']
    };
    obj['response'] = {
        labels  : ['2xx','301','302','3xx','401','402','403','404','5xx'],
        values  :[
            counters['downloader.http_response.status.2xx']['count'],counters['downloader.http_response.status.301']['count'],counters['downloader.http_response.status.302']['count'],counters['downloader.http_response.status.3xx']['count'],counters['downloader.http_response.status.401']['count'],counters['downloader.http_response.status.402']['count'],counters['downloader.http_response.status.403']['count'],counters['downloader.http_response.status.404']['count'],counters['downloader.http_response.status.5xx']['count']
        ]
    }
    cb(obj);
}
function crawlersStatus (crawlers, data, cb){
    if(!crawlers.length){
        cb(data);
    }else{
        var crawler = crawlers.shift();
        if(crawler['crawler_port']){
            request(crawlerConnection['clean_address']+":"+crawler['crawler_port']+'/crawls/default/metrics', function (error, response, body) {
                if(error){
                    crawler['crawler_status'] = false;
                    data.push(crawler);
                    crawlersStatus(crawlers, data, cb);
                }else{
                    crawler['crawler_status'] = true;
                    data.push(crawler);
                    crawlersStatus(crawlers, data, cb);
                }
            });
        }else{
            crawler['crawler_status'] = false;
            data.push(crawler);
            crawlersStatus(crawlers, data, cb);
        }

    }
}
function requestCrawledPages(crawler_id, page_type, res, cb){
    if(!page_type.length){
        cb(res);
    }else{
        var type = page_type.shift();
        // /crawls/default/metrics
        //request(crawlerConnection['address']+'/crawlers/'+crawler_id+'/crawled_pages?page_type='+type, function (error, response, body) {
        request(crawlerConnection['clean_address']+':8085/crawls/default/metrics', function (error, response, body) {
            if(error){
                console.error("[ERROR]Crawled Page: ", error);
                res[type] = [];
            }else{
                res[type] = JSON.parse(body);
            }
            requestCrawledPages(crawler_id, page_type, res, cb);
        });
    }
}
    //SeedFinder
exports.addSeedFinder = function(req, res){ //Add new Crawler
    var param = req.body;
    if(param['crawler_id'] && param['seedFinder_query']){
        request({
            url: crawlerConnection['address'] + '/crawlers/' + param['crawler_id'] +"/seedFinder",
            method: 'POST',
            json: JSON.parse(JSON.stringify({'seedFinder_query': param['seedFinder_query']}))
        }, function (error, response, body) {
            if(error){
                console.error("[ERROR]Add new SeedFinder Query: ", error);
                res.end(JSON.stringify({err: error}));
            }else{
                res.end(JSON.stringify(body));
            }
        });
    }else{
        console.error("[ERROR]Add SeedFinderQuery: Missing data");
        res.end(JSON.stringify({err: 'Missing data'}));
    }
};
//Seed
exports.seeds = function(req, res){ //Reading the crawler from iridanos
    var param = req.body;
    if(param['crawler_id']){
        request(crawlerConnection['address']+'/crawlers/'+param['crawler_id']+"/seeds", function (error, response, body) {
            if(error){
                console.error("[ERROR]Crawler List: ", error);
                res.end(JSON.stringify({err: error}));
            }else{
                var data = [];
                if(body){
                    var seedsList = JSON.parse(body);
                    if(seedsList && seedsList.length){
                        seedsList.forEach(function(seed){
                            var obj = {'seed':seed};
                            data.push(obj);
                        });
                    }
                }
                res.end(JSON.stringify({'data': data}));
            }
        });
    }else{
        console.error("[ERROR]Seeds List: Missing data");
        res.end(JSON.stringify({err: 'Missing data'}));
    }
};
exports.addSeeds = function(req, res){
    var param = req.body;
    if(param['seed'] && param['crawler_id']){
        request({
            url: crawlerConnection['address'] + '/crawlers/' + param['crawler_id'] + "/seeds/add_single",
            method: 'POST',
            json: JSON.parse(JSON.stringify({'seed_url': param['seed']}))
        }, function (error, response, body) {

            if(error){
                console.error("[ERROR]Add new Seed: ", error);
                res.end(JSON.stringify({err: error}));
            }else{
                res.end(JSON.stringify(body));
            }
        });
    }else{
        console.error("[ERROR]Seeds List: Missing data");
        res.end(JSON.stringify({err: 'Missing data'}));
    }
};
exports.deleteSeeds = function(req, res){
    var param = req.body;
    if(param['offset'] && param['crawler_id']){
        console.log(crawlerConnection['address'] + '/crawlers/' + param['crawler_id'] + "/seeds/remove_single?offset="+param['offset'])
        request.delete({
            url: crawlerConnection['address'] + '/crawlers/' + param['crawler_id'] + "/seeds/remove_single?offset="+param['offset']
        }, function (error, response, body) {
            if(error){
                console.error("[ERROR]Delete Seed: ", error);
                res.end(JSON.stringify({err: error}));
            }else{
                res.end(JSON.stringify(body));
            }
        });
    }else{
        console.error("[ERROR]Delete Seeds: Missing data");
        res.err(JSON.stringify({err: 'Missing data'}));
    }
};
exports.addSeedBulk = function(req, res){ //Add link filter files
    var param = req.body;
    var files = req.files;
    if(param['seedBulk_crawler_id'] && files[0] ){
        var options = {
            'method': 'POST',
            'url': 'http://172.16.4.20:5000/api/crawlers/'+param['seedBulk_crawler_id']+'/seeds/add_file',
            'headers': {
                'Accept': 'text/html'
            },
            formData: {
                'seed_file': {
                    'value': fs.createReadStream(files[0]['path']),
                    'options': {
                        'filename': files[0]['originalname'],
                        'contentType': null
                    }
                }
            }
        };
        request.post(options, function(error, response, body) {
            fs.unlink(files[0]['path'], function(err){
                if (err){
                    console.error("[ERROR]Unlink of SeedBulkFile for crawler: ", err);
                }
            });
            if(error){
                console.error("[ERROR]Add new SeedBulk Query: ", error);
                res.end(JSON.stringify({err: error}));
            }else{
                res.end(JSON.stringify(body));
            }
        });
    }else{
        console.error("[ERROR]Add SeedFinderQuery: Missing data");
        res.end(JSON.stringify({err: 'Missing data'}));
    }
};
    //Training URLS
exports.trainingUrl = function(req, res){
    var param = req.body;
    if(param['crawler_id']){
        trainingUrl(param['crawler_id'], ['positive', 'negative'], [], function(data){
            if(data['err']){
                console.error("[ERROR]URLs list: ", data['err']);
                res.end(JSON.stringify({err: data['err']}));
            }else{
                res.end(JSON.stringify({data: data}));
            }
        })
    }else{
        console.error("[ERROR]Seeds List: Missing data");
        res.end(JSON.stringify({err: 'Missing data'}));
    }
};
exports.addTrainingUrl = function(req, res){
    var param = req.body;
    if(param['url'] && param['type'] && param['crawler_id']){
        request({
            url: crawlerConnection['address'] + '/crawlers/' + param['crawler_id'] + "/training_urls/add_single?url_type="+param['type'],
            method: 'POST',
            json: JSON.parse(JSON.stringify({'training_url': param['url']}))
        }, function (error, response, body) {
            if(error){
                console.error("[ERROR]Add new Seed: ", error);
                res.end(JSON.stringify({err: error}));
            }else{
                res.end(JSON.stringify(body));
            }
        });
    }else{
        console.error("[ERROR]Seeds List: Missing data");
        res.end(JSON.stringify({err: 'Missing data'}));
    }
};
exports.deleteTrainingUrl  = function(req, res){
    var param = req.body;
    if(param['offset'] && param['crawler_id']){
        request.delete({
            url: crawlerConnection['address'] + '/crawlers/' + param['crawler_id'] + "/training_urls/remove_single?offset="+param['offset']+"&url_type="+param['url_type']
        }, function (error, response, body) {
            if(error){
                console.error("[ERROR]Delete URL: ", error);
                res.end(JSON.stringify({err: error}));
            }else{
                res.end(JSON.stringify(body));
            }
        });
    }else{
        console.error("[ERROR]DELETE URL: Missing data");
        res.err(JSON.stringify({err: 'Missing data'}));
    }
};
exports.addURLBulk = function(req, res){ //Add URL bulk file
    var param = req.body;
    var files = req.files;
    if(param['urlBulk_crawler_id'] && param['urlBulk_type']  && files[0] ){
        var options = {
            'method': 'POST',
            'url': 'http://172.16.4.20:5000/api/crawlers/'+param['urlBulk_crawler_id']+'/training_urls/add_file?url_type='+param['urlBulk_type']+'',
            'headers': {
                'Accept': 'text/html'
            },
            formData: {
                'training_file': {
                    'value': fs.createReadStream(files[0]['path']),
                    'options': {
                        'filename': files[0]['originalname'],
                        'contentType': null
                    }
                }
            }
        };
        request.post(options, function(error, response, body) {
            fs.unlink(files[0]['path'], function(err){
                if (err){
                    console.error("[ERROR]Unlink of SeedBulkFile for crawler: ", err);
                }
            });
            if(error){
                console.error("[ERROR]Add new SeedBulk Query: ", error);
                res.end(JSON.stringify({err: error}));
            }else{
                res.end(JSON.stringify(body));
            }
        });
    }else{
        console.error("[ERROR]Add SeedFinderQuery: Missing data");
        res.end(JSON.stringify({err: 'Missing data'}));
    }
};
    //Metrics
exports.crawlerMetrics = function(req, res){
    var param = req.body;
    if(param['port']){
        request({
            url: crawlerConnection['clean_address'] + ':'+param['port']+'/crawls/default/metrics',
            method: 'GET'
        }, function (error, response, body) {
            if(error){
                console.error("[ERROR]Crawler Metrics: ", error);
                res.end(JSON.stringify({err: error}));
            }else{
                res.end(JSON.stringify({'data': JSON.parse(body)}));
            }
        });
    }else{
        console.error("[ERROR]GetMetrics: Missing data");
        res.end(JSON.stringify({err: 'Missing data'}));
    }
};
    //Cookie
exports.addCookie = function(req, res){ //Add new Crawler
        var param = req.body;
        if(param['crawler_id'] && param['domain'] && param['user_agent'] && param['cookie']){
            request({
                url: crawlerConnection['address'] + '/crawlers/' + param['crawler_id'] +"/cookie",
                method: 'POST',
                json: JSON.parse(JSON.stringify({
                    'domain': param['domain'],
                    'cookies': param['cookie'],
                    'user_agent': param['user_agent'],
                }))
            }, function (error, response, body) {
                if(error){
                    console.error("[ERROR]Add new SeedFinder Query: ", error);
                    res.end(JSON.stringify({err: error}));
                }else{
                    res.end(JSON.stringify(body));
                }
            });
        }else{
            console.error("[ERROR]Add SeedFinderQuery: Missing data");
            res.end(JSON.stringify({err: 'Missing data'}));
        }
    };
    //Filters
exports.addLinkFilters = function(req, res){ //Add link filter files
    var param = req.body;
    var files = req.files;
    if(param['linkFilter_crawler_id'] && files[0] ){
        var options = {
            'method': 'POST',
            'url': 'http://172.16.4.20:5000/api/crawlers/'+param['linkFilter_crawler_id']+'/link_filters_file',
            'headers': {
                'Accept': 'text/html'
            },
            formData: {
                'link_filters_file': {
                    'value': fs.createReadStream(files[0]['path']),
                    'options': {
                        'filename': files[0]['originalname'],
                        'contentType': null
                    }
                }
            }
        };
        request.post(options, function(error, response, body) {
            fs.unlink(files[0]['path'], function(err){
                if (err){
                    console.error("[ERROR]Unlink of LinkFilterFile for crawler: ", err);
                }
            });
            if(error){
                console.error("[ERROR]Add new SeedFinder Query: ", error);
                res.end(JSON.stringify({err: error}));
            }else{
                res.end(JSON.stringify(body));
            }
        });
    }else{
        console.error("[ERROR]Add SeedFinderQuery: Missing data");
        res.end(JSON.stringify({err: 'Missing data'}));
    }
};
//Corpus Doc
exports.loadCorpus= function(req, res) {
    var param = req.body;
    var pool  = mysql.createPool(dataPool);
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[ADMIN-CorpusLoad01]Error DB: ' + err));
            return res.status(500).json({success: false, data: err});
        } else {
            var select = "SELECT * FROM corpus LEFT JOIN corpusTags ON corpusTags.corpus_id = corpus.corpus_id AND corpusTags.date_e IS NULL WHERE corpus.date_e IS NULL";
            connection.query(select, function (err, result) {
                if (err) {
                    console.error(JSON.stringify('[ADMIN-CorpusLoad02]Error : ' + err));
                    res.end(JSON.stringify({err: 'Errore DB'}));
                } else {
                    if (result) {
                        res.end(JSON.stringify({'data': result}));
                    }
                }
            });
            connection.release();
        }
    });
};
exports.updateCorpus= function(req, res) {
    var param = req.body;
    console.info(req.files);
};
exports.elevantFiles= function(req, res){
    var files = {
        'nonrelevantpages':'',
        'relevantpages'   : ''
    };
    csvReader(files, {}, function(data){
        //res.end(JSON.stringify({'data': data}));
        Object.keys(data).forEach(function(file){
            files[file] = [];
            data[file].forEach(function(rigo){
                var dati = rigo.split("\t");
                var obj = {
                    url : dati[0],
                    rel : dati[1]
                };
                files[file].push(obj);
            });
        })
        wordExtractor(files['nonrelevantpages'], function(nonRelevant){
            wordExtractor(files['relevantpages'], function(relevant) {
                res.end(JSON.stringify({'words': {nonrelevant: nonRelevant,relevant: relevant}}));
            });
        });
    });
};
//MISP
exports.cves= function(req, res){
    var param = req.body;
    var length = parseInt(param['length'])|| 10;
    var start = parseInt(param['start'])|| 0;
    var orderBy = "";
    if(param['order']){
        orderBy = " ORDER BY "+param['columns'][param['order'][0]['column']]['name']+ " "+param['order'][0]['dir']+ " ";
    }

    var search = "";
    if(param['search']){
        search = ""+param['search']['value']+"";
    }
    MISP.cves(start, length, orderBy, search, function(data){
        if(data['err']){
            console.error("[ERROR]CVES: ", data['err']);
            res.end(JSON.stringify({err: data['err']}));
        }else{
            res.end(JSON.stringify({draw: param['draw'], recordsTotal: data[0]['total'], recordsFiltered: data[0]['total'], data: data}));
        }
    })
};
exports.singleEvent= function(req, res){
    var param = req.body;
    var event_id = param['event_id'];
    MISP.singleEvent(event_id, function(data){
        if(data['err']){
            console.error("[ERROR]SingleEvent: ", data['err']);
            res.end(JSON.stringify({err: data['err']}));
        }else{
            res.end(JSON.stringify({data:data}));
        }
    })
};
exports.mispData= function(req, res){
    if(mem['mispData']){
        res.end(JSON.stringify({data: mem['mispData']}));
    }else{
        if($test){
            res.end(JSON.stringify({data: data}));
        }else {
            var param = req.query;
            var length = param['length']|| 10;
            var start = param['start']|| 0;
            var page = parseInt(parseInt(start)+10)/parseInt(length);

            var options = {
                mode: 'text',
                pythonPath: DATACOMMON.PyPath,
                pythonOptions: ['-u'],
                scriptPath: './mispScript/',
                args: ['-l', '-p '+page, '-m '+length]
                //args: ['-l', '-p 1', '-m 1']
            };
            try {
                PythonShell.run('api.py', options, function (err, results) {
                    if (err) {
                        //throw err;
                        res.end(JSON.stringify({data: []}));
                    }else{
                        var idList = [];
                        results.forEach(function (line) {
                            if (line == 'eventid,cve') {
                                return true;
                            } else {
                                var dati = line.split(',');
                                idList.push(dati[0]);
                            }
                        });
                        loadCVE(idList, [], function (data) {
                            mem['mispData'] = data;
                            res.end(JSON.stringify({data: data}));
                        })
                    }
                });
            }
            catch(err){
                console.error("Errore MispData: ")
                console.error(err);
                res.end(JSON.stringify({data: []}));
            }
        }
    }
};
//User
exports.getUserList= function(req, res) {
    var param = req.body;

    if($test) {
        var data = datiOffline['users'];
        var box = {};
        data.forEach(function (user){
            box[user['_id']] = user;
        });
        if(param['_id']){
            var output = [];
            data.forEach(function(user){
                if(user['_id'] == param['_id']){
                    output.push(user);
                }
            });
            res.end(JSON.stringify({data: output}));
        }else{
            res.end(JSON.stringify({data: data['data']}));
        }
    }else{
        request(connection_opt['address']+'/user/?page=0&pageSize=100', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                var box = {};
                data['data'].forEach(function (user){
                    box[user['_id']] = user;
                });
                if(param['_id']){
                    var output = [];
                    data['data'].forEach(function(user){
                        if(user['_id'] == param['_id']){
                            output.push(user);
                        }
                    });
                    res.end(JSON.stringify({data: output}));
                }else{
                    res.end(JSON.stringify({data: data['data']}));
                }
            }else{
                res.end(JSON.stringify({err: error}));
            }
        });
    }

}
exports.addUser= function(req, res) {
    var param = req.body;
    var dataSet = {
        "firstname": param['user_name'],
        "lastname": param['user_surname'],
        "dateofbirth": convertToStandardDate(param['user_dob']),
        "deleted": false,
        "email": param['user_email'],
        "gender": "Male",
        "roles": [
            param['user_role']
        ],
        "devices": [],
        "telephone": param['user_telephone'],
        "timestamp": getTimeStamp(),
        "username": param['user_username'],
        "password": param['user_password'],
        "aas_reference":1
    };

    request({
        url: connection_opt['address']+'/user/',
        method: 'POST',
        json: JSON.parse(JSON.stringify(dataSet))
    }, function (error, response, body) {
        if (!error && response.statusCode === 201) {
            res.end(JSON.stringify({res: body}));
        }else {
            res.end(JSON.stringify({err: body}));
        }
    });
};
//Alert
exports.getAlertList= function(req, res) {
    if($test) {
        var data = datiOffline['alerts'];
        getDevice(null,function(device){
            mem['deviceList'] = {};
            device['data'].forEach(function (deviceData) {
                mem['deviceList'][deviceData['_id']] = deviceData;
            });
            data.forEach(function(alert, element){
                if(!alert['deviceID']){alert['deviceID'] = '';}
                if(!alert['deviceType']){alert['deviceType'] = '';}
                if(!alert['reason'] || !alert['reason']['rule_id']){alert['reason'] = {};alert['reason']['rule_id'] = '';}
            });
            res.end(JSON.stringify({data: data}));
        });
    }else{
        request('https://profiling.cyber-trust.eu/monitoring/alert/?page=0&pageSize=100', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                data['data'].forEach(function(d){
                    d['_insertedTimestamp'] = clearDateStamp(d['_insertedTimestamp']);
                });
                getDevice(null,function(device){
                    mem['deviceList'] = {};
                    device['data'].forEach(function (deviceData) {
                        mem['deviceList'][deviceData['_id']] = deviceData;
                    });
                    data['data'].forEach(function(alert, element){
                        if(mem['deviceList'] && mem['deviceList'][alert['deviceID']]){
                            alert['device'] =   mem['deviceList'][alert['deviceID']]['description'];
                            alert['user'] =     mem['deviceList'][alert['deviceID']]['user'];
                        }else{
                            alert['device'] =   null;
                            alert['user'] =     null;
                        }
                        if(!alert['deviceID']){alert['deviceID'] = '';}
                        if(!alert['deviceType']){alert['deviceType'] = '';}
                        if(!alert['reason'] || !alert['reason']['rule_id']){alert['reason'] = {};alert['reason']['rule_id'] = '';}
                    });
                    res.end(JSON.stringify({data: data['data']}));
                });
            }else{
                res.end(JSON.stringify({err: error}));
            }
        });
    }
};
//Variuos Functions
function fileCreator(obj, result, cb){
    if(!Object.keys(obj).length){
        cb(result);
    }else{
        var key = Object.keys(obj).shift();
        var value = obj[key];
        fs.writeFile('public/crawler/'+key, value, function (err) {
            if (err){
                result[key] = {'err': err};
                cb(result);
            }else{
                result[key] = true;
                delete obj[key];
                fileCreator(obj, result, cb);
            }
        });
    }
}
function fileReader(obj, result, cb){
    if(!Object.keys(obj).length){
        cb(result);
    }else{
        var file = Object.keys(obj).shift();
        fs.readFile('public/crawler/'+file,'utf8', function read(err, data) {
            if (err) {
                result[key] = {'err': err};
            }else{
                var content = JSON.parse(JSON.stringify(data));
                result[file] = content;
                delete obj[file];
                fileReader(obj, result, cb)
            }
        });
    }
}
function csvReader(obj, result, cb){
    if(!Object.keys(obj).length){
        cb(result);
    }else{
        var file = Object.keys(obj).shift();

        var csv = [];
        fs.readFile('public/crawler/'+file+".csv",'utf8', function read(err, data) {
            if (err) {
                console.error(err);
                cb({'err': err});
            }else{
                var content = data;
                var csv = content.split(/\r|\r?\n/g);
                result[file] = csv;
                delete obj[file];
                csvReader(obj, result, cb)
            }
        });
    }
}
function wordExtractor(list,cb){
    if(list.length > 0){
        var urlbag = {};
        list.forEach(function(entry){
            var url = pulisciUrl(entry['url']);
            if(url == ''){return true;}
            if(urlbag[url]){
                urlbag[url] += 1;
            }else{
                urlbag[url] = 1;
            }
        });
        var wordbag = [];
        Object.keys(urlbag).forEach(function (url) {
            var obj = {
                word : url,
                weight : urlbag[url]
            };
            wordbag.push(obj);
        });
        cb(wordbag)
    }else{
        cb([]);
    }
}
function pulisciUrl(url){
    var cleanUrl = url.replace(/http:\/\/|https:\/\//g,'');
    var cleanUrl = cleanUrl.replace(/www./g,'');
    var cleanUrl = cleanUrl.split("/")[0];
    return cleanUrl;
}
var quote = function (value, simple){
    var  value_new = '"' + value + '"';
    return value_new;
}
function clearDateStamp(date){
    var d = date.split('T');
    var date = d[0].replace(/-/g, '/');
    var time = d[1].split('.');
    var datestamp = date+ " " + time[0];
    return datestamp;
}
function convertToStandardDate(date){
    var d = date.split('/');
    var datestamp = d[2]+"-"+d[1]+"-"+d[0];
    return datestamp;
}
function loadCVE(list, res, cb){
    if(!list.length){
        cb(res);
    }else{
        var id = list.shift();
        var options = {
            mode: 'text',
            pythonPath: DATACOMMON.PyPath,
            pythonOptions: ['-u'],
            scriptPath: './mispScript/',
            args: ['-s', '-d '+id]
        };
        PythonShell.run('api.py', options, function (err, results) {
            if (err) {
                throw err;
            }
            //var data = results[0].replace(/\'/g,'"');
            var data = JSON.parse(results[0]);
            data['cveId'] = id;
            data['PublicationDatetime'] = clearDateStamp(data['PublicationDatetime']);
            data['LastModificationDatetime'] = clearDateStamp(data['LastModificationDatetime']);
            res.push(data);
            loadCVE(list, res, cb);
        });
    }
}
function getTimeStamp(){
    var date_ob = new Date();
    var date = ("0" + date_ob.getDate()).slice(-2);
    var month = ("0" + (date_ob.getMonth() + 1)).slice(-2);
    var year = date_ob.getFullYear();
    var hours = date_ob.getHours();
    var minutes = date_ob.getMinutes();
    var seconds = date_ob.getSeconds();
        if(seconds < 10){
            seconds = "0"+seconds;
        }
    var dateTime = year + "-" + month + "-" + date + "T" + hours + ":" + minutes + ":" + seconds;
    return dateTime;

}
function getUsers(user, cb) {
    if($test){
        var data = datiOffline['users'];
        var box = {};
        data.forEach(function (user) {
            box[user['_id']] = user;
        });
        if (user) {
            var output = [];
            data.forEach(function (user) {
                if (user['_id'] == user) {
                    output.push(user);
                }
            });
            cb({data: output});
        } else {
            cb({data: data});
        }
    }else{
        request('https://profiling.cyber-trust.eu/user/?page=0&pageSize=100', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                var box = {};
                data['data'].forEach(function (user) {
                    box[user['_id']] = user;
                });
                if (user) {
                    var output = [];
                    data['data'].forEach(function (user) {
                        if (user['_id'] == user) {
                            output.push(user);
                        }
                    });
                    cb({data: output});
                } else {
                    cb({data: data['data']});
                }
            } else {
                cb({err: error});
            }
        });
    }

}
function getDevice(user, cb) {
    if($test){
        var data = datiOffline['devices'];
        var obj = {};
        getUsers(null,function(users){
            if(!users['err']) {
                mem['usersList'] = {};
                users['data'].forEach(function (userData) {
                    mem['usersList'][userData['_id']] = userData;
                });
                data.forEach(function(device){
                    if(mem['usersList'] && mem['usersList'][device['userid']]){
                        device['user'] = mem['usersList'][device['userid']]['firstname'] +" "+ mem['usersList'][device['userid']]['lastname'];
                    }else{
                        device['user'] = device['userid'];
                    }
                });
                cb({data: data});
            }else{
                cb({data: data});
            }
        });
    }else {

    }
}
function trainingUrl(crawler_id, list, res, cb){
    if(!list.length){
        cb(res);
    }else{
        var type = list.shift();
        request({
            url: crawlerConnection['address'] + '/crawlers/' + crawler_id + "/training_urls?url_type="+type,
            method: 'GET'
        }, function (error, response, body) {
            if(error){
                console.error("[ERROR]Add new Seed: ", error);
                cb({err: error});
            }else{
                if(JSON.parse(body).length){
                    JSON.parse(body).forEach(function(url) {
                        var obj = {
                            'url': url,
                            'type': type
                        }
                        res.push(obj);
                    })
                }
                trainingUrl(crawler_id, list, res, cb);
            }
        });
    }
}
exports.evdb = function(req, res){
    var dataSet = [];
    if(!mem['evdb'] || mem['evdb'].length == 0){
        request(connection_opt['address']+'asset/vulnerability/?page=0&pageSize=100', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                data['data'].forEach(function(vuln){
                    dataSet.push(vuln);
                })
                mem['evdb'] = dataSet;
                res.end(JSON.stringify({data: mem['evdb']}));
            }else{
                res.end(JSON.stringify({err: body}));
            }
        });
    }else{
        res.end(JSON.stringify({data: mem['evdb']}));
    }
}
var getUrlParameter = function getUrlParameter(sParam, sPageURL) {
    var sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};