var request = require('request');
var mysql = require('mysql');
var multer = require('multer');
var DATACOMMON = require('./DataCommon');
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
var dataPool            = DATACOMMON.dataPool;
var pool = mysql.createPool(dataPool);
var dataPoolESearch     = DATACOMMON.dataPoolESearch;
var poolESearch = mysql.createPool(dataPoolESearch);
//var dltConnection = "http://www.isp2.develop.cyber-trust.neofacto.eu/api";
//var dltConnection = "http://www.isp1.configs.cyber-trust.neofacto.eu/api/";
var dltConnection = "http://www.cybertrust.master.cyber-trust.neofacto.eu/api/";

//mappatura secondi
const secMap = {
    2592000 : 'mese',
    5184000 : 'bimestre',
    7776000 : 'trimestre',
    15552000: 'semestre',
    31104000: 'anno'
}
exports.caseList= function(req, res) {
    var param = req.body;
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[LEA-caseList]Error DB: ' + err));
            return res.status(500).json({success: false, data: err});
        } else {
            var where = "";
            if(param['case_id']){
                where += " AND cases.case_id = "+ param['case_id'];
            }
            var select = "SELECT cases.*, status.status,GROUP_CONCAT(account.account, ',') as accounts " +
                "FROM cases " +
                "   LEFT JOIN status ON status.status_id = cases.status_id " +
                "   LEFT JOIN account ON (account.case_id = cases.case_id and account.date_e IS NULL) " +
                "WHERE 1=1 AND cases.date_e IS NULL " + where + " " +
                " GROUP BY 1,2 ";

            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error(JSON.stringify('[LEA-caseList02]Error : ' + err));
                    res.end(JSON.stringify({err: 'Errore DB'}));
                } else {
                    if(result.length){
                        result.forEach(function(row){

                        });
                        res.end(JSON.stringify({'data': result}));
                    }else{
                        res.end(JSON.stringify({'data': []}));
                    }
                }
            });
        }
    });
};
exports.caseAdd= function(req, res) {
    var param = req.body;
    if(param['case_icrn'] == ''){param['case_icrn'] = 'null'}
    if(param['case_rdd'] == ''){param['case_rdd'] = 'null'}
    if(param['legalProcess'] == ''){param['legalProcess'] = 'null'}
    if(param['nature'] == ''){param['nature'] = 'null'}
    if(param['references'] == ''){param['references'] = '[]'}
    if(param['accounts'] == ''){param['accounts'] = '[]'}

    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[LEA-caseAdd01]Error DB: ' + err));
            return res.status(500).json({success: false, data: err});
        } else {
            if(param['todo'] == 'add'){
                var insert = "INSERT INTO cases (case_number, legal_process, reference, case_nature, lps_date, rd_date) " +
                    "VALUES ("+quote(param['case_icrn'])+","+quote(param['legalProcess'])+","+quote(JSON.parse(param['references']).join(", "))+","+quote(param['nature'])+","+quote(param['case_lpsd'])+", "+ quote(param['case_rdd'])+") ";
                connection.query(insert, function (err, result) {
                    if (err) {
                        console.error(JSON.stringify('[LEA-caseAdd02]Error : ' + err));
                        res.end(JSON.stringify({err: 'Errore DB'}));

                    } else {
                        if(result['insertId']){
                            var case_id = result['insertId'];
                            if(param['accounts'] && JSON.parse(param['accounts']).length ){
                                var insert = "INSERT INTO account (account, case_id) VALUES ";
                                var values = [];
                                JSON.parse(param['accounts']).forEach(function(account){
                                    values.push("("+quote(account)+", "+ case_id+") ");
                                })
                                insert += values.join(",");
                                connection.query(insert, function (err, result) {
                                    if (err) {
                                        console.error(JSON.stringify('[LEA-caseAdd03]Error : ' + err));
                                        res.end(JSON.stringify({err: 'Errore DB'}));
                                    } else {
                                        if (result['insertId']) {
                                            res.end(JSON.stringify({'caseId': case_id}));
                                        }
                                    }
                                });
                            }else{
                                res.end(JSON.stringify({'caseId': case_id}));
                            }
                        }
                    }
                    connection.release();
                });
            }else if(param['todo'] == 'edit'){
                var update = "UPDATE cases SET case_number = "+quote(param['case_icrn'])+" ," +
                    " legal_process = "+quote(param['legalProcess'])+"," +
                    " reference = "+quote(JSON.parse(param['references']).join(", "))+", " +
                    " case_nature ="+quote(param['nature'])+", " +
                    " lps_date = "+quote(param['case_lpsd'])+"," +
                    " rd_date = "+ quote(param['case_rdd'])+" " +
                    "WHERE case_id = "+param['case_id'] + " ";
                connection.query(update, function (err, result) {
                    if (err) {
                        console.error(JSON.stringify('[LEA-caseMod01]Error : ' + err));
                        res.end(JSON.stringify({err: 'Errore DB'}));
                    } else {
                        if(result){
                            var accounts = JSON.parse(param['accounts']);
                            accountsMngm(connection, param['case_id'], accounts, function(response){
                                connection.release();
                                if(!response['err']){
                                    res.end(JSON.stringify({'caseId': param['case_id']}));
                                }
                            })
                        }
                    }
                });
            }
        }
    });
};
function accountsMngm(connection, case_id, accounts, cb){
    clearAccounts(connection, case_id, function(response){
        if(!response['err']){
            var insert = "INSERT INTO account (account, case_id) VALUES ";
            var values = [];
            if(accounts.length > 0){
                accounts.forEach(function(account){
                    values.push("("+quote(account)+", "+ case_id+") ");
                })
                insert += values.join(",");

                connection.query(insert, function (err, result) {
                    if (err) {
                        console.error(JSON.stringify('[LEA-accountMngm]Error : ' + err));
                        cb({err:err})
                    } else {
                        if (result['insertId']) {
                            cb(true);
                        }
                    }
                });
            }else{
                cb(true);
            }

        }else{
            console.error("Error");
        }
    })
}
function clearAccounts(connection, case_id, cb){
    var update = "UPDATE account SET date_e = NOW() WHERE case_id = " +case_id + " ";
    connection.query(update, function (err, result) {
        if (err) {
            console.error(JSON.stringify('[LEA-clearAccounts]Error : ' + err));
            cb({err: 'Errore DB'});
        } else {
            cb(true);
        }
    });
};
exports.documentCaseAdd= function(req, res) {
    var param = req.body;
    var files = req.files;
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[LEA-documentCaseAdd01]Error DB: ' + err));
            return res.status(500).json({success: false, data: err});
        } else {
            var insert = "INSERT INTO documents (case_id, file, orig_file) VALUES ";
            var values = [];
            files.forEach(function(file){
                values.push("("+param['docCaseId']+", " + quote(file['filename'])+", " + quote(file['originalname'])+") ");
            });
            insert += " "+ values.join(",");
            connection.query(insert, function (err, result) {
                if (err) {
                    console.error(JSON.stringify('[LEA-documentCaseAdd02]Error : ' + err));
                    res.end(JSON.stringify({err: 'Errore DB'}));
                } else {
                    if (result['insertId']) {
                        res.end(JSON.stringify({'docCaseIds': result['insertId']}));
                    }
                }
            });
            connection.release();
        }
    });
};
exports.documentList    = function(req, res){
    var param = req.body;
    var case_id = param['case_id'];
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[LEA-documentList]Error DB: ' + err));
            return res.status(500).json({success: false, data: err});
        } else {
            var where = "";
            if (param['case_id']) {
                where += " AND documents.case_id = " + param['case_id'];
            }
            var select = "SELECT documents.* FROM documents WHERE 1=1 AND documents.date_e IS NULL " + where + " ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error(JSON.stringify('[LEA-documentsList02]Error : ' + err));
                    return res.status(500).json({success: false, data: err});
                } else {
                    res.end(JSON.stringify({'data': result}));
                }
            });
        }
    });
};
exports.TMData = function(req, res){
    var param = req.body;
    console.log(param)
    var case_id = param['case_id'];
    var from = DataConverter(param['from'], param['tz']);
    var to = DataConverter(param['to'], param['tz']);
    var tz = param['tz'];
    var dif = param['dif'] || 600;
    //Pool
    poolESearch.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[LEA-PoolConnection-ESearch - Error DB: ' + err));
            res.end(JSON.stringify({'data': data}));
        }else{
            events(connection,case_id, convertToStandardDateTime(from), convertToStandardDateTime(to), dif,function(allEventsData){
                alerts(connection,case_id, convertToStandardDateTime(from), convertToStandardDateTime(to), dif, function(alertsData) {
                    dateVerifier(from, to, allEventsData, alertsData, function(response){
                        connection.release();
                        res.end(JSON.stringify({'allEvents': response['allEventsData'], 'alerts': response['alertsData']}));
                    })
                });
            });
        }
    });

};
//Events
function events(connection, case_id, from, to, dif, cb){
    var difference = Math.ceil(Math.abs(dif)/1000); //differenza in secondi
    var span = 900;
    if(difference <= 2592000){
        span = 86400;
    }else if(difference <=5184000){
        span = 86400;
    }else if(difference <=7776000){
        span = 259200;
    }else if(difference <=15552000){
        span = 604800;
    }else {//if(difference <=31104000){
        span = 1209600;
    }
    var decoder = slotLabelGenerator(from,to,span);

    var select = "SELECT ";
    select += "  CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV "+span+") * "+span+")) - UNIX_TIMESTAMP()) / "+span+") AS slot, ";
    select += "  FROM_UNIXTIME((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV "+span+") * "+span+")) - CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV "+span+") * "+span+")) - UNIX_TIMESTAMP(STR_TO_DATE(events.at_timestamp ,'%Y-%m-%d %H:%i:%s'))) ) ), '%Y-%m-%d %H:%i:%s') AS timestamp, ";
    select += "  FROM_UNIXTIME((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV "+span+") * "+span+")) - CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV "+span+") * "+span+")) - UNIX_TIMESTAMP(STR_TO_DATE(events.at_timestamp ,'%Y-%m-%d %H:%i:%s'))) ) ), '%H:%i') AS hours, ";
    select += "  UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV "+span+") * "+span+")) - CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV "+span+") * "+span+")) - UNIX_TIMESTAMP(STR_TO_DATE(events.at_timestamp ,'%Y-%m-%d %H:%i:%s')))) AS label, ";
    select += "  count(*) as allEvents, ";
    select += "  SUM(CASE WHEN events.event_type = 'alert' THEN 1 ELSE 0 END) as alert, ";
    select += "  SUM(CASE WHEN events.event_type = 'dhcp' THEN 1 ELSE 0 END) as dhcp, ";
    select += "  SUM(CASE WHEN events.event_type = 'dns' THEN 1 ELSE 0 END) as dns, ";
    select += "  SUM(CASE WHEN events.event_type = 'fileinfo' THEN 1 ELSE 0 END) as fileinfo, ";
    select += "  SUM(CASE WHEN events.event_type = 'flow' THEN 1 ELSE 0 END) as flow, ";
    select += "  SUM(CASE WHEN events.event_type = 'http' THEN 1 ELSE 0 END) as http, ";
    select += "  SUM(CASE WHEN events.event_type = 'ssh' THEN 1 ELSE 0 END) as ssh, ";
    select += "  SUM(CASE WHEN events.event_type = 'tls' THEN 1 ELSE 0 END) as tls ";
    select += "FROM events ";
    select += "WHERE 1 = 1 ";
    select += "  AND DATE_FORMAT(SUBSTRING(events.at_timestamp FROM 1 FOR CHAR_LENGTH(events.at_timestamp) - 5), '%Y-%m-%d %H:%i:%s') >= '"+from+"' ";
    select += "  AND DATE_FORMAT(SUBSTRING(events.at_timestamp FROM 1 FOR CHAR_LENGTH(events.at_timestamp) - 5), '%Y-%m-%d %H:%i:%s') <= '"+to+"' ";
    select += "GROUP BY 1 ";
    select += "ORDER BY 1 ASC LIMIT 100";
    connection.query(select, function (err, result) {
        if (err) {
            console.error(JSON.stringify('[LEA-Events]Error : ' + err));
            cb({error:err});
        } else {
            var maxSlot = maxSlotFinder(result);
            var obj = {
                "alert"     : {},
                "dhcp"      : {},
                "dns"       : {},
                "fileinfo"  : {},
                "flow"      : {},
                "http"      : {},
                "ssh"       : {},
                "tls"       : {}
            };
/*
            for (var key = 0; key <= maxSlot; key++) {
                obj["alert"][key]      = 0;
                obj["dhcp"][key]       = 0;
                obj["dns"][key]        = 0;
                obj["fileinfo"][key]   = 0;
                obj["flow"][key]       = 0;
                obj["http"][key]       = 0;
                obj["ssh"][key]        = 0;
                obj["tls"][key]        = 0;
            };

 */
            result.forEach(function(row){
                obj["alert"][row['timestamp']]   = row["alert"];
                obj["dhcp"][row['timestamp']]    = row["dhcp"];
                obj["dns"][row['timestamp']]     = row["dns"];
                obj["fileinfo"][row['timestamp']]= row["fileinfo"];
                obj["flow"][row['timestamp']]    = row["flow"];
                obj["http"][row['timestamp']]    = row["http"];
                obj["ssh"][row['timestamp']]     = row["ssh"];
                obj["tls"][row['timestamp']]     = row["tls"];
            });
            var response = {
                "alert" : {label : [], data : []},
                "dhcp"  : {label : [], data : []},
                "dns"   : {label : [], data : []},
                "fileinfo"  : {label : [], data : []},
                "flow"  : {label : [], data : []},
                "http"  : {label : [], data : []},
                "ssh"   : {label : [], data : []},
                "tls"   : {label : [], data : []}
            };
            Object.keys(obj).forEach(function(attr){
                Object.keys(obj[attr]).forEach(function(slot) {
                    response[attr]['label'].push(slot);
                    response[attr]['data'].push(obj[attr][slot]);
                });
            });
            cb({'data': response});
        }
    });
}
function alerts(connection, case_id, from, to, dif, cb){
    var difference = Math.ceil(Math.abs(dif)/1000); //differenza in secondi
    var span = 900;
    if(difference <= 2592000){
        span = 86400;
    }else if(difference <=5184000){
        span = 86400;
    }else if(difference <=7776000){
        span = 259200;
    }else if(difference <=15552000){
        span = 604800;
    }else {//if(difference <=31104000){
        span = 1209600;
    }
    var decoder = slotLabelGenerator(from,to,span);
    var select = "SELECT ";
    select += "  CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV "+span+") * "+span+")) - UNIX_TIMESTAMP(STR_TO_DATE(events.at_timestamp ,'%Y-%m-%d %H:%i:%s'))) / "+span+") AS slot, ";
    select += "  FROM_UNIXTIME((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV "+span+") * "+span+")) - CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV "+span+") * "+span+")) - UNIX_TIMESTAMP(STR_TO_DATE(events.at_timestamp ,'%Y-%m-%d %H:%i:%s'))) )), '%Y-%m-%d %H:%i:%s') AS timestamp, ";
    select += "  FROM_UNIXTIME((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV "+span+") * "+span+")) - CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV "+span+") * "+span+")) - UNIX_TIMESTAMP(STR_TO_DATE(events.at_timestamp ,'%Y-%m-%d %H:%i:%s'))) )), '%H:%i') AS hours, ";
    select += "  UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV "+span+") * "+span+")) - CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV "+span+") * "+span+")) - UNIX_TIMESTAMP(STR_TO_DATE(events.at_timestamp ,'%Y-%m-%d %H:%i:%s'))))  AS label, ";
    select += "  count(*) as count ";
    select += "FROM events ";
    select += "WHERE 1 = 1 ";
    select += "  AND events.event_type = 'alert' ";
    select += "  AND DATE_FORMAT(SUBSTRING(events.timestamp FROM 1 FOR CHAR_LENGTH(events.timestamp) - 5), '%Y-%m-%d %H:%i:%s') >= '"+from+"' ";
    select += "  AND DATE_FORMAT(SUBSTRING(events.timestamp FROM 1 FOR CHAR_LENGTH(events.timestamp) - 5), '%Y-%m-%d %H:%i:%s') <= '"+to+"' ";
    select += "GROUP BY 1 ";
    select += "ORDER BY 1 ASC ";
    connection.query(select, function (err, result) {
        if (err) {
            console.error('[ISP EventsFlow]SQL : ' + select);
            console.error('[ISP EventsFlow]Error : ' + err);
            cb(JSON.stringify({'err': err}));
        } else {
            if(!result.length){
                result.forEach(function(row){
                    obj[row['slot']] = row['count'];
                });
                var obj = {};
                /*
                Object.keys(decoder).forEach(function(key, slot){
                    obj[key] = 0;
                });
                */
                result.forEach(function(row){
                    obj[row['timestamp']] = row['count'];
                });
                var label = []; var data = [];
                Object.keys(obj).forEach(function(slot){
                    label.push(slot);
                    data.push(obj[slot]);
                });
                cb({'data': {'label':label, 'data':data}});
            }else{
                var label = []; var data = [];
                result.forEach(function(row){
                    label.push(row['timestamp'])
                    data.push(row['count'])
                })
                cb({'data': {'label':label, 'data':data}});
            }

        }
    });
}
//DLT
exports.evidence = function(req, res){ //Retrieve the available ports for crawlers
    try {
        request({
            url: dltConnection + '/allevidence',
            method: 'GET',
        }, function (error, response, body) {
            if (error) {
                console.error("[ERROR]AllEvidence List: ", error);
                res.end(JSON.stringify({err: error}));
            } else {
                evaluateJSON(body, function(body){
                    res.end(JSON.stringify({'data': JSON.parse(body)}));
                })
            }
        });
    }catch (error){
        res.end(JSON.stringify({err: error}));
    }
};
exports.incidentTrack = function(req, res){ //Retrieve the available ports for crawlers
    try{
        request({
            url: dltConnection + '/allincidentTrackingEvidenceFile',
            method: 'GET',
        }, function (error, response, body) {
            if(error){
                console.error("[ERROR]AllEvidence List: ", error);
                res.end(JSON.stringify({err: error}));
            }else{
                evaluateJSON(body, function(body){
                    res.end(JSON.stringify({'data': JSON.parse(body)}));
                })
            }
        });
    }catch (error){
        res.end(JSON.stringify({err: error}));
    }
};
exports.patch = function(req, res){ //Retrieve the available ports for crawlers
    try{
        request({
            url: dltConnection + '/allpatch',
            method: 'GET',
        }, function (error, response, body) {
            if(error){
                console.error("[ERROR]AllEvidence List: ", error);
                res.end(JSON.stringify({err: error}));
            }else{
                evaluateJSON(body, function(body){
                    res.end(JSON.stringify({'data': JSON.parse(body)}));
                })
            }
        });
    }catch (error){
        res.end(JSON.stringify({err: error}));
    }
};
///allsoftwareEvidenceFile
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
function convertToStandardDateTime(date){
    var d = date.split(' ');
    var data = d[0].split('/');
    var time = d[1].split(':');
    var datestamp = data[2]+"-"+data[1]+"-"+data[0] + " " +time[0]+":"+time[1]+":"+time[2];
    return datestamp;
}

function slotLabelGenerator(from,to, span){
    var span = span*1000;
    var start = new Date(from);
    var end = new Date(to);
    var decoder = {};
    decoder[0] = end.toISOString().replace(/T/, ' ').replace(/\..+/, '');
    var i = 1
    while(end >= start){
        end = new Date(end.getTime() - span);
        decoder[i] = end.toISOString().replace(/T/, ' ').replace(/\..+/, '');//start.getTime()/1000;
        i++;
    }
    return decoder;
}
function evaluateJSON(body, cb){
    try{
        var json = JSON.parse(body);
        cb(body);
    }catch (error){
        cb("[]");
    }
}
function dateVerifier(from, to, allEventsData, alertsData, cb){
    //AllEvents
    Object.keys(allEventsData['data']).forEach(function(k){
        if(allEventsData['data'][k]['label'][0] != convertToStandardDateTime(to)){
            allEventsData['data'][k]['label'].unshift(convertToStandardDateTime(to));
            allEventsData['data'][k]['data'].unshift(0);
        }
        if(allEventsData['data'][k]['label'][allEventsData['data'][k]['label'].length -1] != convertToStandardDateTime(from)){
            allEventsData['data'][k]['label'].push(convertToStandardDateTime(from));
            allEventsData['data'][k]['data'].push(0);
        }
        Object.keys(allEventsData['data'][k]['label']).forEach(function (id){
            if(allEventsData['data'][k]['label'][id] == ''){
            }
        })
    })
    //Alerts
    if(alertsData['data']['label'][0] != convertToStandardDateTime(to)){
        alertsData['data']['label'].unshift(convertToStandardDateTime(to));
        alertsData['data']['data'].unshift(0);
    }
    if(alertsData['data']['label'][alertsData['data']['label'].length -1] != convertToStandardDateTime(from)){
        alertsData['data']['label'].push(convertToStandardDateTime(from));
        alertsData['data']['data'].push(0);
    }
    cb({allEventsData:allEventsData, alertsData:alertsData})
}
function maxSlotFinder(results){
    var max = 0;
    results.forEach(function(row) {
        if (row['slot'] > max) {
            max = row['slot'];
        }
    });
    return max;
}
function DataConverter(d, tz){
    if(!tz){
        tz = 'UTC';
    }
    var data = new Date(d);
    var d = data.toLocaleString('en-GB', {timeZone:'Pacific/Apia'});// { timeZone: tz });
    var data = d.split(", ");
    var date = data[0].split("/");
    /*var output =  (date[0]<10 ? '0' : '') + date[0]+ '/' +
        (date[1]<10 ? '0' : '') + date[1] + '/' +
        date[2]+" "+data[1];
    */
    var output =  date[0]+ '/' + date[1] + '/' + date[2]+" "+data[1];
    return output
}