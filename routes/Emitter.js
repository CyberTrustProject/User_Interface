var SSE = require('sse-nodejs');
var rn = require('random-number');
var OFFLINE = require('./OfflineData');
var datiOffline = OFFLINE.mock();

var elasticsearch=require('elasticsearch');
var mem = {}; //Memoria tampone
var $test = false;

var connection_opt = {
    address : "http://172.16.4.43"
}

var request = require('request');

exports.test= function(req, res) {
    var app = SSE(res);
    app.sendEvent('data', function () {
        return numeriRandom(35,95);
    },1000);
    app.disconnect(function () {

    });

};

exports.dataFlowPacket= function(req, res) {
    var app = SSE(res);
    app.sendEvent('time', function () {
        var n = numeriRandom(35,95);
        return n;
    },3000);
    app.disconnect(function () {

    });
    //app.removeEvent('time',5001);
};
exports.dataFlowUser= function(req, res) {
    var app = SSE(res);
    app.sendEvent('time', function () {
        var n = numeriRandom(12,21);
        return n;
    },5000);
    app.disconnect(function () {
    });
    //app.removeEvent('time',5001);
};
exports.dataFlowAccess= function(req, res) {
    var app = SSE(res);
    app.sendEvent('time', function () {
        var n = numeriRandom(0,15);
        return n;
    },10000);
    app.disconnect(function () {
    });
    //app.removeEvent('time',5001);
};
exports.dataFlowError= function(req, res) {
    var app = SSE(res);
    app.sendEvent('time', function () {
        var n = numeriRandom(0,20);
        if(n < 12){
            n = 0;
        }
        return n;
    },1000);
    app.disconnect(function () {
    });
    //app.removeEvent('time',5001);
};

function getACHE(app, cb){
    var ndownload =0;
    request('http://iridanos.sdbs.uop.gr:8080/crawls/in-depth-crawl-test/metrics', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var res = JSON.parse(body);
            ndownload = (res['gauges']['downloader.pending_downloads']['value']);
        }
        app.sendEvent('time', function () {
            return 3;
        });
        getACHE(app, cb);
    });
}

exports.getDeviceList= function(req, res) {
    var param = req.body;
    var type = param['type'] || null;
    var userId = param['userId'] || null;
    if($test){
        res.end(JSON.stringify({data: datiOffline['devices']}));
    }else {
        request(connection_opt['address']+'/monitoring/device/?page=0&pageSize=100', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                callUsers(type, userId, function (user) {
                    var ret = [];
                    data['data'].forEach(function (device, index) {
                        if (mem['users'] && mem['users'][device['userid']]) {
                            device['user'] = mem['users'][device['userid']]['firstname'] + " " + mem['users'][device['userid']]['lastname'];
                            device['patch'] = {
                                patching_status : false,
                                version         : 'ND',
                                timestamp       : 'ND'
                            };
                            ret.push(device);
                        }
                    });
                    res.end(JSON.stringify({data: ret}));
                });
            } else {
                res.end(JSON.stringify({err: error}));
            }
        });
    }
}
exports.getUserList= function(req, res) {
    if($test){
        res.end(JSON.stringify({data: datiOffline['users']}));
    }else{
        var param = req.body;
        request(connection_opt['address']+'/user/?page=0&pageSize=100', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                var box = {};
                var ret = [];
                data['data'].forEach(function (user, pos){
                    if(!user['firstname']){
                        return false;
                    }
                    box[user['_id']] = user;
                    if(param['type'] == "ISP"){
                        if (user['roles'][0] =='Owner'){
                            ret.push(user);
                        }
                    }else{
                        if (user['roles'][0] !='Owner'){
                            ret.push(user);
                        }
                    }
                });
                mem['users'] = box;
                res.end(JSON.stringify({data: ret}));
            }
            res.end(JSON.stringify({err: error}));
        });
    }
}
exports.getAlertList= function(req, res) {
    if ($test) {
        res.end(JSON.stringify({data: datiOffline['alerts']}));
    } else {
        request(connection_opt['address']+'/monitoring/alert/?page=0&pageSize=100', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                var device_id = makeid(5);
                var owner_id = makeid(10);
                data['data'].forEach(function (d) {
                    d['device'] = device_id;
                    d['user'] =  owner_id;
                    d['_insertedTimestamp'] = clearDateStamp(d['_insertedTimestamp']);
                });
                res.end(JSON.stringify({data: data['data']}));
            }
            res.end(JSON.stringify({err: error}));
        });
    }
};
exports.getRuleList= function(req, res) {
    request(connection_opt['address']+'/monitoring/rule/?page=0&pageSize=100', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            data['data'].forEach(function(d){
                if(!d['description']){d['description']='None';}
                if(!d['originating_service']){d['originating_service']='None';}
                if(!d['device_type']){d['device_type']='None';}
                if(!d['timestamp']){d['timestamp']='None';}
            });
            res.end(JSON.stringify({data: data['data']}));
        }
        res.end(JSON.stringify({err: error}));
    });
};
exports.getVulnerabilitiesList= function(req, res) {
    request(connection_opt['address']+'/asset/vulnerability/', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            res.end(JSON.stringify({data: data}));
        }
        res.end(JSON.stringify({err: error}));
    });
};
exports.addUser= function(req, res) {
    var param = req.body;
    var dataSet = {
        "firstname": quote(param['user_name']),
        "lastname": quote(param['user_surname']),
        "dateofbirth": quote(convertToStandardDate(param['user_dob'])),
        "deleted": false,
        "email": quote(param['user_email']),
        "gender": "Male",
        "roles": [
            quote(param['user_role'])
        ],
        "devices":[],
        "telephone": quote(param['user_telephone']),
        "timestamp": "2018-12-11T12:35:47.627492",
        "username": quote(param['user_username']),
        "password": quote(param['user_password']),
        "aas_reference" :1
    };//SERVE IL QUOTE
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
exports.addDevice= function(req, res) {
    var param = req.body;
    if(!param['userId']){
        param['userId'] = '5dd798056ec17b05fe62d05b';
    }
    /*
    var dataSet = {
        "type":quote(param['device_type']),
        "timestamp":"2018-12-11T12:35:47.627492",
        "description":quote(param['device_description']),
        "userid":quote(param['userId']),
        "CPE":quote(param['device_CPE']),
        "device_info":{
            "hardware_id":quote(param['device_hwId']),
            "model":quote(param['device_model']),
            "manufacturer":quote(param['device_manufacturer']),
            "OS":{
                "version_release":quote(param['device_version']),
                "os_name":quote(param['device_os']),
                "sdk":quote(param['device_sdk'])
            }
        }
    };*/
    var dataSet = {
        "type":quote(param['device_type']),
        "timestamp":"2018-12-11T12:35:47.627492",
        "description":quote(param['device_description']),
        "userid":quote(param['userId']),
        "CPE":quote(param['device_CPE']),
        "device_info":{
            "hardware_id":quote(param['device_hwId']),
            "model":quote(param['device_model']),
            "manufacturer":quote(param['device_manufacturer']),
            "OS":{
                "version_release": "",
                "os_name": "",
                "sdk": ""
            }
        }
    };
    request({
        url: connection_opt['address']+'/monitoring/device/',
        method: 'POST',
        json: JSON.parse(JSON.stringify(dataSet))
    }, function (error, response, body) {
        if (!error && (response.statusCode === 201 || response.statusCode === 200 || response.statusCode === 400 || response.statusCode === 406)) {
            res.end(JSON.stringify({res: body}));
        }else {
            res.end(JSON.stringify({err: body}));
        }
    });
};
exports.getLogsList= function(req, res) {
    var dati =[
            {
                userId:1865,
                hostname: 'cav1-trxpoi-htpc.mth.net',
                timestamp: '2019-05-17 04:23:05 +0001'
            },{
            userId:762,
            hostname: '192.168.232.32',
            timestamp: '2019-05-16 23:51:45 +0001',
        },{
            userId:892,
            hostname: 'cav33-trxpoi-htpc.ivacy.org',
            timestamp: '2019-05-16 19:44:23 +0001'
        },{
            userId:7612,
            hostname: 'eng11-trxpoi-htpc.ivacy.net',
            timestamp: '2019-05-16 19:33:24 +0001',
        },{
            userId:8136,
            hostname: 'bol3-trxpoi-htpc.pret.net',
            timestamp: '2019-05-16 19:12:48 +0001',
        },{
            userId:441,
            hostname: 'spa9-trxpoi-htpc.ivacy.net',
            timestamp: '2019-05-16 19:03:11 +0001',
        },{
            userId:8654,
            hostname: 'cv1-trxpoi-tp.inet.eu.net',
            timestamp: '2019-05-16 18:57:34 +0001'
        },{
            userId:7432,
            hostname: 'it8-trxpoi-tcp.cat22.net',
            timestamp: '2019-05-16 18:43:21 +0001',
        },{
            userId:65,
            hostname: 'flo-res-tcp.cat22.eu',
            timestamp: '2019-05-16 18:18:05 +0001',
        },{
            userId:9864,
            hostname: 'math.netstat.fr.com',
            timestamp: '2019-05-16 18:17:52 +0001',
        },{
            userId:1326,
            hostname: 'bol54-trxpoi-tcp.saviet.org',
            timestamp: '2019-05-16 18:13:23 +0001'
        },{
            userId:145,
            hostname: 'deu1-trxpoi-tcp.frank.com',
            timestamp: '2019-05-16 18:11:45 +0001'
        },{
                userId:551,
                hostname: 'ru1-trxpoi-tcp.ivacy.net',
                timestamp: '2019-05-16 18:02:23 +0001'
            }
        ];
    res.end(JSON.stringify({data: dati}));
};

var numeriRandom = function(min, max){
    if(!min){min = 0};
    if(!max){max = 100};
    var n = rn({min:min, max:max, integer:true})
    return n;
}
var quote = function (value, simple){
    var  value_new = '"' + value + '"';
    return value;
}
function clearDateStamp(date){
    var d = date.split('T');
    var date = d[0].replace(/-/g, '/');
    var time = d[1].split('.');
    var datestamp = date+ " " + time[0];
    return datestamp;
}

function callUsers(type, userId, cb){
    request(connection_opt['address']+'/user/?page=0&pageSize=100', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            var box = {};
            data['data'].forEach(function (user, pos){
                if(userId){
                    if(user['_id'] == userId) {
                        box[user['_id']] = user;
                    }
                }else{
                    if(type == "ISP"){
                        if (user['roles'][0] =='Owner'){
                            box[user['_id']] = user;
                        }
                    }else{
                        if (user['roles'][0] !='Owner'){
                            box[user['_id']] = user;
                        }
                    }
                }
            });
            mem['users'] = box;
            cb(box);
        }
    });
}
function makeid(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
function convertToStandardDate(date){
    var d = date.split('/');
    var datestamp = d[2]+"-"+d[1]+"-"+d[0];
    return datestamp;
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
    var dateTime = year + "-" + month + "-" + date + "T" + hours + ":" + minutes + ":47.627492";
    return dateTime;

}