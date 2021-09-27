var express = require('express');
var path = require('path');
var favicon = require('static-favicon');
var bodyParser = require('body-parser');
var http = require('http');
var cors = require('cors');

var multer = require('multer');
var storageLea = multer.diskStorage({              //Creo una variabile STORAGE di Multer, dove imposto le opzioni che mi interessano
    destination: function (req, file, cb) {     //Setto la destinazione dei file:
        cb(null, __dirname+'/public/documents/');     //Nel mio caso una directory con chmod a 777
    },
    filename: function (req, file, cb) {        //Imposto il filename per i file
        //console.log(file); // Per vedere quali sono i parametri che arrivano insieme al file.
        cb(null, Date.now()+'_'+ clean(file.originalname)) ; //salvare il file in modo univoco
    }
});
var uploadDocuCase = multer({ storage:storageLea});
//Storage per Crawler
var tmpStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname+'/tmp/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname) ;
    }
});
var tmpLoader = multer({storage:tmpStorage});
//Storage per Corpus
var storageCorpus = multer.diskStorage({              //Creo una variabile STORAGE di Multer, dove imposto le opzioni che mi interessano
    destination: function (req, file, cb) {     //Setto la destinazione dei file:
        cb(null, __dirname+'/public/corpus/');     //Nel mio caso una directory con chmod a 777
    },
    filename: function (req, file, cb) {        //Imposto il filename per i file
        //console.log(file); // Per vedere quali sono i parametri che arrivano insieme al file.
        cb(null, Date.now()+'_'+ clean(file.originalname)) ; //salvare il file in modo univoco
    }
});
var uploadCorpus = multer({storage:storageCorpus});

var app = express();
app.use(cors());
app.use('/scripts', express.static(__dirname + '/node_modules/'));
// view engine setup-
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(bodyParser.urlencoded({ limit:'100mb', extended: true }));
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
app.use(express.static(path.join(__dirname, 'public')));
//Impostazioni di default*********************
/// catch 404 and forwarding to error handler
/// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
// production error handler
// no stacktraces leaked to user

app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});
module.exports = app;
//********************************************
var DC = require('./routes/DataCommon');
var WS = require('./routes/WebServices');
var EM = require('./routes/Emitter');
var LEA =require('./routes/Lea');
var ADMIN =require('./routes/Admin');
var ISP =require('./routes/ISP');
var MISP =require('./routes/Misp');
var PS =require('./routes/ProfilingService');
//var DEV =require('./routes/Developer');
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
var request = require("request");
test = function(){
    var options = {
        method: 'POST',
        url: 'https://auth.aditask.com/connect/token',
        headers: {'content-type': 'application/x-www-form-urlencoded'},
        form: {
            grant_type: 'password',
            client_id: 'cybertrust.ui',
            scope: 'cybertrust.profile',
            audience: 'YOUR_API_IDENTIFIER',
            username: 'cybertrust_isp',
            password: '_Isp1234'
        }
    };

    request(options, function (error, response, body) {
        if (error) throw new Error(error);
        var datiAuth = JSON.parse(body)
        var access_token = datiAuth['access_token'];
        /*
        var options = {
            token: access_token
        }
        request.get('https://auth.aditask.com/aditess/api/Users',JSON.stringify(options),function(err,res,body){
                console.error(err);
                console.error(res.statusCode );
                //console.error(res);
                console.error(body);

        });
        */

        var options = {
            url: 'https://auth.aditask.com/aditess/api/Users/Test01',
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                //'token':access_token
            }
        };

        request(options, function(err, res, body) {
            /*console.error(err);
            console.error(res.statusCode );
            console.error(body);
            console.error(res);
            */
            //var json = JSON.parse(body);
            //console.log(json);
        });

        var user = {
            "userName": "Test01",
            "password": "Test0!",
            "name": "test01",
            "givenName": "test01",
            "familyName": "test01",
            "email": "simone.naldini@mathema.com"
        }

        /*request.post({
            headers:    {'content-type' : 'application/json'},
            url:        'https://auth.aditask.com/aditess/api/Users',
            token:      access_token,
            body:       JSON.stringify(user)
        }, function(error, response, body){
            console.log(error);
            console.log(response);
            console.log(body);
        });
        */
    });
};
//test();
app.listen(DC.porta,function(){
    console.log("Started on PORT "+DC.porta);
});
app.post('/WS.login', WS.login);
app.post('/WS.deviceList', WS.deviceList);
app.post('/WS.offlineData', WS.offlineData);

//PROFILING-SERVICES
    //Login
app.post('/PS.OAuthLogin',              PS.OAuthLogin);
//Users
app.post('/PS.getUserList',             PS.getUserList);
app.post('/PS.addUser'      ,           PS.addUser);
app.post('/PS.deleteUser'      ,        PS.deleteUser);
app.post('/PS.verifyUsername',          PS.verifyUsername);
app.post('/PS.getHoList'     ,          PS.getHoList);
//Devices
app.post('/PS.getDeviceList',           PS.getDeviceList);
app.post('/PS.getSohoDeviceList',       PS.getSohoDeviceList);
app.post('/PS.addDevice'    ,           PS.addDevice);
app.post('/PS.deleteDevice'      ,      PS.deleteDevice);
app.post('/PS.patchDevice'    ,         PS.patchDevice);
app.post('/PS.patchDeviceImpact'    ,   PS.patchDeviceImpact);
app.post('/PS.patchMonitoring'    ,     PS.patchMonitoring);

//SmartHome
app.post('/PS.getSmartHomeList',        PS.getSmartHomeList);
app.post('/PS.getNotificationList',     PS.getNotificationList);
app.post('/PS.getMitigationList',       PS.getMitigationList);
app.post('/PS.patchMitigation',         PS.patchMitigation);
app.post('/PS.patchSHConfig'    ,       PS.patchSHConfig);
    //Other
app.get('/EM.getAlertList',             PS.getAlertList);
app.post('/PS.getAlertsList',            PS.getAlertsList);
app.get('/EM.getRuleList',              PS.getRuleList);
app.get('/EM.getVulnerabilitiesList',   PS.getVulnerabilitiesList);
app.post('/PS.getVulnerabilitiesList',   PS.getVulnerabilitiesList);
app.post('/PS.getDeviceVulnerabilitiesList',   PS.getDeviceVulnerabilitiesList);
app.post('/PS.smartHomeTopology',       PS.smartHomeTopology);
app.post('/PS.networkTopology',       PS.networkTopology);

//LEA
app.get('/LEA.caseList',            LEA.caseList);
app.post('/LEA.caseList',           LEA.caseList);
app.post('/LEA.caseAdd',            LEA.caseAdd);
app.post('/LEA.documentCaseAdd',    uploadDocuCase.array('file'), LEA.documentCaseAdd);
app.post('/LEA.documentList',       LEA.documentList);
app.post('/LEA.TMData',             LEA.TMData);
//Admin

//app.post('/ADMIN.updateCrawlerData',uploadCrawler.fields([{name: 'bulk', maxCount: 1},{name: 'seed', maxCount: 1},{name: 'urlFilters', maxCount: 1}]), ADMIN.updateCrawlerData);
//app.post('/ADMIN.updateSeeds',  ADMIN.updateSeeds);
//app.get('/ADMIN.loadCrawlerData',   ADMIN.loadCrawlerData);
//CRAWLER
app.get('/ADMIN.crawlersType',      ADMIN.crawlersType);
app.get('/ADMIN.crawlersPorts',     ADMIN.crawlersPorts);
app.get('/ADMIN.crawlers',          ADMIN.crawlers);
app.post('/ADMIN.crawler',          ADMIN.crawler);
app.post('/ADMIN.crawledPages',     ADMIN.crawledPages);
app.post('/ADMIN.addCrawlers',      ADMIN.addCrawlers);
app.post('/ADMIN.statusCrawler',    ADMIN.statusCrawler);
app.post('/ADMIN.crawlerData',      ADMIN.crawlerData);
    //SeedFinder
app.post('/ADMIN.addSeedFinder',    ADMIN.addSeedFinder);
    //Seed
app.post('/ADMIN.seeds',            ADMIN.seeds);
app.post('/ADMIN.addSeeds',         ADMIN.addSeeds);
app.post('/ADMIN.deleteSeeds',      ADMIN.deleteSeeds);
app.post('/ADMIN.addSeedBulk',      tmpLoader.any(), ADMIN.addSeedBulk);
    //Url
app.post('/ADMIN.trainingUrl',      ADMIN.trainingUrl);
app.post('/ADMIN.addTrainingUrl',   ADMIN.addTrainingUrl);
app.post('/ADMIN.deleteTrainingUrl',ADMIN.deleteTrainingUrl);
app.post('/ADMIN.addURLBulk',      tmpLoader.any(), ADMIN.addURLBulk);
    //Metrics
app.post('/ADMIN.crawlerMetrics',    ADMIN.crawlerMetrics);
    //Cookie
app.post('/ADMIN.addCookie',        ADMIN.addCookie);
    //Link Filter
app.post('/ADMIN.addLinkFilters',   tmpLoader.any(), ADMIN.addLinkFilters);
//ISP
app.post('/ISP.aggregateDNS',       ISP.aggregateDNS);
app.post('/ISP.timeLineDNS',        ISP.timeLineDNS);
app.get('/ISP.listDNS',             ISP.listDNS);
    //Suricata Flow
app.get('/ISP.timeLineFlow',        ISP.timeLineFlow);
app.post('/ISP.statsFlowByte',      ISP.statsFlowByte);
app.post('/ISP.statsFlowAge',       ISP.statsFlowAge);
app.post('/ISP.decodeTrafficVolume',ISP.decodeTrafficVolume);
app.post('/ISP.memoryUse',          ISP.memoryUse);
app.post('/ISP.kernelDrops',        ISP.kernelDrops);
app.post('/ISP.invalidPackets',     ISP.invalidPackets);
app.post('/ISP.alertsDetected',     ISP.alertsDetected);
app.post('/ISP.tcpSessions',        ISP.tcpSessions);
app.post('/ISP.IPVersions',         ISP.IPVersions);
app.post('/ISP.IPProtocol',         ISP.IPProtocol);
    //Suricata GeoMap
app.post('/ISP.alertGeoPos',        ISP.alertGeoPos);
app.post('/ISP.alertsTypeTimeline', ISP.alertsTypeTimeline);
app.post('/ISP.alertsProtocol',   ISP.alertsProtocol);
    //Suricata HTTP
app.post('/ISP.httpVersions',       ISP.httpVersions);
app.post('/ISP.httpMethods',        ISP.httpMethods);
app.post('/ISP.userAgent',          ISP.userAgent);
app.post('/ISP.httpHostnames',      ISP.httpHostnames);
app.post('/ISP.httpTimeline',       ISP.httpTimeline);
app.post('/ISP.httpLogs',           ISP.httpLogs);
    //Suricata Alerts
app.post('/ISP.alertsSeverityTimeline',     ISP.alertsSeverityTimeline );
app.post('/ISP.alertsLogs',         ISP.alertsLogs);
app.post('/ISP.alertsCategory',     ISP.alertsCategory);
app.post('/ISP.alertsSource',       ISP.alertsSource);
app.post('/ISP.alertsDestination',  ISP.alertsDestination);
app.post('/ISP.alertsHeatMap',      ISP.alertsHeatMap);
    //Suricata AllEvents
app.post('/ISP.allEventsTimeline',  ISP.allEventsTimeline);
app.post('/ISP.allEventsType',      ISP.allEventsType);
    //Suricata DNS
app.post('/ISP.dnsTimeline',        ISP.dnsTimeline);
app.post('/ISP.dnsLogs',            ISP.dnsLogs);


app.get('/ISP.netfilterSourceIp',   ISP.netfilterSourceIp);
app.get('/ISP.netfilterDestPort',   ISP.netfilterDestPort);


//Misp
app.get('/ADMIN.mispData',          ADMIN.mispData);
app.get('/ADMIN.cves',              ADMIN.cves);
app.post('/ADMIN.cves',              ADMIN.cves);
app.post('/ADMIN.singleEvent',       ADMIN.singleEvent);
app.post('/MISP.severityScore',     MISP.severityScore);
app.post('/MISP.vulnHist',          MISP.vulnHist);
app.post('/MISP.aggregate',         MISP.aggregate);
app.post('/MISP.last',              MISP.last);
app.post('/MISP.statsVuln',         MISP.statsVuln);
app.post('/MISP.evdbContains',      MISP.evdbContains);
app.post('/MISP.scoreHistory',      MISP.scoreHistory);
app.post('/MISP.scoreYear',         MISP.scoreYear);
app.post('/MISP.exploitsHist',      MISP.exploitsHist);
app.post('/MISP.vendorData',        MISP.vendorData);
app.post('/MISP.vendorTable',       MISP.vendorTable);
app.post('/MISP.partData',          MISP.partData);
app.post('/MISP.productYear',       MISP.productYear);
app.post('/MISP.productPart',       MISP.productPart);
app.post('/MISP.productCvss',       MISP.productCvss);

//EVDB
app.get('/ADMIN.evdb',              ADMIN.evdb);

//DLT
app.post('/LEA.evidence',           LEA.evidence);
app.post('/LEA.incidentTrack',      LEA.incidentTrack);
app.post('/LEA.patch',              LEA.patch);
//Utility
//app.post('/UT.csv'          , UT.csv);

app.get('/EM.test',                EM.test);

function clean(str){
    str = str.replace(/\s/g,"_");
    str = str.replace(/\W!(?=[^.]*$)/g,"");
    str = str.replace(/'|’/g,"_");
    return str;
}