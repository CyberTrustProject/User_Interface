var request     = require('request');
var mysql       = require('mysql');
var multer      = require('multer');
const csv       = require('csv-parser');
var SSE = require('sse-nodejs');
var DATACOMMON  = require('./DataCommon');
var mem = {}; //Memoria tampone

var dataPool  = DATACOMMON.dataPoolESearch;
var pool  = mysql.createPool(dataPool);

//Flow
exports.timeLineFlow = function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-aggregateDNS_connection]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT DISTINCT(events.proto) as proto, count(*) as count " +
                "FROM events " +
                "WHERE event_type = 'flow' " +
                "GROUP BY 1 " +
                "ORDER BY 1";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP DNS -timeLineDNS]SQL : ' + select);
                    console.error('[ISP DNS -timeLineDNS]Error : ' + err);
                    //res.end(JSON.stringify({'err': err}));
                    res.end(JSON.stringify({'err': err}));
                } else {
                    if (result.length) {
                        var dataBox = {};
                        result.forEach(function (row) {
                            dataBox[row['proto']] = {
                                'events': {},
                                'bytes': {}
                            }
                        })
                        getTimeLineFlow(connection, Object.keys(dataBox), dataBox, function (dataBox) {
                            getTimeLineByteFlow(connection, Object.keys(dataBox), dataBox, function (dataBox) {
                                var timelineData = {
                                    'events': {},
                                    'bytes': {}
                                };
                                Object.keys(dataBox).forEach(function (proto) {
                                    timelineData['events'][proto] = dataBox[proto]['events'];
                                    timelineData['bytes'][proto] = dataBox[proto]['bytes'];
                                })
                                res.end(JSON.stringify({'data': timelineData}));
                            });
                        });
                    }
                }
            });
        }
    });
}
function getTimeLineFlow(connection, protoList, databox, cb){
    if(!protoList.length){
        cb(databox);
    }else{
        var proto = protoList.shift();
        var select = "SELECT " ;
            select+= "CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300)) - UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 300) AS slot, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 300)*300), '%Y-%m-%d %H:%i:%s') as timestamp, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 300)*300), '%H:%i') as hours, ";
            select+= "unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 300)*300 as label, ";
            select+= "COUNT(event_id) AS count ";
            select+= "FROM events ";
            select+= "WHERE events.event_type = 'flow' AND events.proto = '"+proto+"' AND DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 5 HOUR) AND DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s') <= NOW() ";
            select+= "GROUP BY 1 ORDER BY 1 ASC ";
        connection.query(select, function (err, result) {
            if (err) {
                console.error('[ISP-executeQuery]SQL : ' + select);
                console.error('[ISP-executeQuery]Error : ' + err);
                cb({'err': err});
            } else {
                var obj = {};
                var time = timegiver();
                obj[time['t0']] = 0;obj[time['t1']] = 0;
                result.forEach(function(row){
                    obj[row['timestamp']] = row['count'];
                });
                var label = []; var data = [];
                Object.keys(obj).forEach(function(slot){
                    label.push(slot);
                    data.push(obj[slot]);
                });
                databox[proto]['events']['label'] = label;
                databox[proto]['events']['data'] = data;
                getTimeLineFlow(connection, protoList, databox, cb)
            }
        });
    }
};
function getTimeLineByteFlow(connection, protoList, databox, cb){
    if(!protoList.length){
        cb(databox);
    }else{
        var proto = protoList.shift();
        var select = "SELECT " ;
        select+= "CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300)) - UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 300) AS slot, ";
        select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 300)*300), '%Y-%m-%d %H:%i:%s') as timestamp, ";
        select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 300)*300), '%H:%i') as hours, ";
        select+= "unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 300)*300 as label, ";
        select+= "SUM(flow.bytes_toserver) AS sumBytes ";
        select+= "FROM events LEFT OUTER JOIN  flow ON (flow.event_id = events.event_id) ";
        select+= "WHERE events.event_type = 'flow' AND events.proto = '"+proto+"' AND DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 5 HOUR) AND DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s') <= NOW() ";
        select+= "GROUP BY 1 ORDER BY 1 ASC ";
        connection.query(select, function (err, result) {
            if (err) {
                console.error('[ISP-executeQuery]SQL : ' + select);
                console.error('[ISP-executeQuery]Error : ' + err);
                cb({'err': err});
            } else {
                var obj = {};
                var time = timegiver();
                obj[time['t0']] = 0;obj[time['t1']] = 0;
                result.forEach(function(row){
                    obj[row['timestamp']] = row['sumBytes'];
                });
                var label = []; var data = [];
                Object.keys(obj).forEach(function(slot){
                    label.push(slot);
                    data.push(obj[slot]);
                });
                databox[proto]['bytes']['label'] = label;
                databox[proto]['bytes']['data'] = data;
                getTimeLineByteFlow(connection, protoList, databox, cb)
            }
        });
    }
};
exports.statsFlowByte = function(req, res) {
    var param = req.body;
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-statFlow_connection]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "(" +
                        "   SELECT 'Total' as proto, "+
                        "       SUM(CAST(flow.bytes_toserver AS SIGNED)) as total, "+
                        "       COUNT(CAST(flow.bytes_toserver AS SIGNED)) as count, "+
                        "       MIN(CAST(flow.bytes_toserver AS SIGNED)) as min_byte, "+
                        "       MAX(CAST(flow.bytes_toserver AS SIGNED)) as max_byte, "+
                        "       AVG(CAST(flow.bytes_toserver AS SIGNED)) as mean, "+
                        "       STD(CAST(flow.bytes_toserver AS SIGNED)) as std_dev "+
                        "   FROM "+
                        "       events "+
                        "       left JOIN flow ON flow.event_id = events.event_id "+
                        "   WHERE 1=1 "+
                        "       AND events.event_type = 'flow' "+
                        "   GROUP BY 1 "+
                        "   ORDER BY 1 ASC " +
                        ")"+
                        "UNION "+
                        "   ( "+
                        "       SELECT events.proto, "+
                        "           SUM(CAST(flow.bytes_toserver AS SIGNED)) as total, "+
                        "           COUNT(CAST(flow.bytes_toserver AS SIGNED)) as count, "+
                        "           MIN(CAST(flow.bytes_toserver AS SIGNED)) as min_byte, "+
                        "           MAX(CAST(flow.bytes_toserver AS SIGNED)) as max_byte, "+
                        "           AVG(CAST(flow.bytes_toserver AS SIGNED)) as mean, "+
                        "           STD(CAST(flow.bytes_toserver AS SIGNED)) as std_dev "+
                        "       FROM "+
                        "           events "+
                        "           left JOIN flow ON flow.event_id = events.event_id "+
                        "       WHERE 1=1 "+
                        "           AND events.event_type = 'flow' "+
                        "       GROUP BY 1 "+
                        "       ORDER BY 1 ASC" +
                        ") ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP flow -stats]SQL : ' + select);
                    console.error('[ISP flow -stats]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {

                    res.end(JSON.stringify({'data': result}));
                }
            });
        }
    });
}
exports.statsFlowAge = function(req, res) {
    var param = req.body;
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-statFlow_connection]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select =
                "( "+
                "    SELECT 'Total' as proto, "+
                "        MIN(flow.age) as min_age, "+
                "        MAX(flow.age) as max_age, "+
                "        AVG(flow.age) as mean, "+
                "        STD(flow.age) as std_dev "+
                "    FROM "+
                "        events "+
                "        left JOIN flow ON flow.event_id = events.event_id "+
                "    WHERE 1=1 "+
                "        AND events.event_type = 'flow' "+
                "    GROUP BY 1 "+
                "    ORDER BY 1 ASC "+
                ") "+
                "UNION "+
                "( "+
                "    SELECT events.proto, "+
                "        MIN(flow.age) as min_age, "+
                "        MAX(flow.age) as max_age, "+
                "        AVG(flow.age) as mean, "+
                "        STD(flow.age) as std_dev "+
                "    FROM "+
                "        events "+
                "        left JOIN flow ON flow.event_id = events.event_id "+
                "    WHERE 1=1 "+
                "        AND events.event_type = 'flow' "+
                "    GROUP BY 1 "+
                "    ORDER BY 1 ASC) ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP flow -statsage]SQL : ' + select);
                    console.error('[ISP flow -statsage]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    res.end(JSON.stringify({'data': result}));
                }
            });
        }
    });
}
//EventsFlow
exports.eventsFlow = function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-aggregateDNS_connection]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT " ;
                select+= "CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600) AS slot, ";
                select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%Y-%m-%d %H:%i:%s') as timestamp, ";
                select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%H:%i') as hours, ";
                select+= "unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600 as label, ";
                select+= "COUNT(event_id) AS count ";
                select+= "FROM events ";
                select+= "WHERE 1=1 AND DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 5 HOUR) AND DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s') <= NOW() ";
                select+= "GROUP BY 1 ORDER BY 1 ASC ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP EventsFlow]SQL : ' + select);
                    console.error('[ISP EventsFlow]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var obj = {};
                    var time = timegiver();
                    obj[time['t0']] = 0;obj[time['t1']] = 0;
                    result.forEach(function(row){
                        obj[row['timestamp']] = row['count'];
                    });
                    var label = []; var data = [];
                    Object.keys(obj).forEach(function(slot){
                        label.push(slot);
                        data.push(obj[slot]);
                    });
                    res.end(JSON.stringify({'data': {'label':label, 'data':data}}));
                }
            });
        }
    });
}
exports.decodeTrafficVolume = function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-DecoderTrafficVolume_connection]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT " ;
            select+= "CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600) AS slot, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%Y-%m-%d %H:%i:%s') as timestamp, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%H:%i') as hours, ";
            select+= "unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600 as label, ";
            select+= "SUM(logstash.volume_packets) AS packets, ";
            select+= "SUM(logstash.volume_bytes) AS bytes ";
            select+= "FROM logstash ";
            select+= "WHERE 1=1 AND DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 5 HOUR) AND DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s') <= NOW() ";
            select+= "GROUP BY 1 ORDER BY 1 ASC ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP decodeTrafficVolume]SQL : ' + select);
                    console.error('[ISP decodeTrafficVolume]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var obj = {
                        'packets'  :{},
                        'bytes'  :{}
                    };
                    var time = timegiver();
                    obj[time['t0']] = 0;obj[time['t1']] = 0;
                    result.forEach(function(row){
                        obj['packets'][row['timestamp']] = row['packets'];
                        obj['bytes'][row['timestamp']] = row['bytes'];
                    });
                    var response = {
                        'packets'  :{label :[], data:[]},
                        'bytes'  :{label :[], data:[]}
                    };
                    var label = []; var data = [];
                    Object.keys(obj).forEach(function(attr){
                        Object.keys(obj[attr]).sort().forEach(function(slot) {
                            response[attr]['label'].push(slot);
                            response[attr]['data'].push(obj[attr][slot]);
                        });
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
exports.memoryUse= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-aggregateDNS_connection]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT " ;
            select+= "CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600) AS slot, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%Y-%m-%d %H:%i:%s') as timestamp, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%H:%i') as hours, ";
            select+= "unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600 as label, ";
            select+= "SUM(logstash.memory_use_flow) AS flow, ";
            select+= "SUM(logstash.memory_use_http) AS http, ";
            select+= "SUM(logstash.memory_use_ftp) AS ftp, ";
            select+= "SUM(logstash.memory_use_tcp) AS tcp ";
            select+= "FROM logstash ";
            select+= "WHERE 1=1 AND DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 5 HOUR) AND DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s') <= NOW() ";
            select+= "GROUP BY 1 ORDER BY 1 ASC ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP MemoryUse]SQL : ' + select);
                    console.error('[ISP MemoryUse]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var obj = {
                        'flow'  :{},
                        'http'  :{},
                        'ftp'   :{},
                        'tcp'   :{}
                    };
                    var time = timegiver();
                    obj['flow'][time['t0']] = 0;obj['flow'][time['t1']] = 0;
                    obj['http'][time['t0']] = 0;obj['http'][time['t1']] = 0;
                    obj['ftp'][time['t0']] = 0;obj['ftp'][time['t1']] = 0;
                    obj['tcp'][time['t0']] = 0;obj['tcp'][time['t1']] = 0;

                    result.forEach(function(row){
                        obj['flow'][row['timestamp']] = row['flow'];
                        obj['http'][row['timestamp']] = row['http'];
                        obj['ftp'][row['timestamp']] = row['ftp'];
                        obj['tcp'][row['timestamp']] = row['tcp'];
                    });
                    var response = {
                        'flow'  :{label :[], data:[]},
                        'http'  :{label :[], data:[]},
                        'ftp'   :{label :[], data:[]},
                        'tcp'   :{label :[], data:[]}
                    };
                    var label = []; var data = [];
                    Object.keys(obj).forEach(function(attr){
                        Object.keys(obj[attr]).sort().forEach(function(slot) {
                            response[attr]['label'].push(slot);
                            response[attr]['data'].push(obj[attr][slot]);
                        });
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
exports.kernelDrops= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-kernelDrops]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT " ;
            select+= "CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600) AS slot, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%Y-%m-%d %H:%i:%s') as timestamp, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%H:%i') as hours, ";
            select+= "unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600 as label, ";
            select+= "SUM(logstash.kernel_drops) AS kd ";
            select+= "FROM logstash ";
            select+= "WHERE 1=1 AND DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 5 HOUR) AND DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s') <= NOW() ";
            select+= "GROUP BY 1 ORDER BY 1 ASC ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP KernelDrops]SQL : ' + select);
                    console.error('[ISP KernelDrops]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var obj = {};
                    var time = timegiver();
                    obj[time['t0']] = 0;obj[time['t1']] = 0;
                    result.forEach(function(row){
                        obj[row['timestamp']] = row['kd'];
                    });
                    var response = {label :[], data:[]};
                    Object.keys(obj).forEach(function(attr){
                        Object.keys(obj).forEach(function(slot) {
                            response['label'].push(slot);
                            response['data'].push(obj[slot]);
                        });
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
exports.invalidPackets= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-InvalidPackets]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT " ;
            select+= "CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600) AS slot, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%Y-%m-%d %H:%i:%s') as timestamp, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%H:%i') as hours, ";
            select+= "unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600 as label, ";
            select+= "SUM(logstash.invalid_pkts) AS invalid ";
            select+= "FROM logstash ";
            select+= "WHERE 1=1 AND DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 5 HOUR) AND DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s') <= NOW() ";
            select+= "GROUP BY 1 ORDER BY 1 ASC ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP InvalidPackets]SQL : ' + select);
                    console.error('[ISP InvalidPackets]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var obj = {};
                    var time = timegiver();
                    obj[time['t0']] = 0;obj[time['t1']] = 0;
                    result.forEach(function(row){
                        obj[row['timestamp']] = row['invalid'];
                    });
                    var response = {label :[], data:[]};
                    Object.keys(obj).forEach(function(attr){
                        Object.keys(obj).forEach(function(slot) {
                            response['label'].push(slot);
                            response['data'].push(obj[slot]);
                        });
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
exports.alertsDetected= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-AlertsDetected]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT " ;
            select+= "CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600) AS slot, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%Y-%m-%d %H:%i:%s') as timestamp, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%H:%i') as hours, ";
            select+= "unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600 as label, ";
            select+= "SUM(logstash.alert_detected) AS alerts_detected ";
            select+= "FROM logstash ";
            select+= "WHERE 1=1 AND DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 5 HOUR) AND DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s') <= NOW() ";
            select+= "GROUP BY 1 ORDER BY 1 ASC ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP AlertsDetected]SQL : ' + select);
                    console.error('[ISP AlertsDetected]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var obj = {};
                    var time = timegiver();
                    obj[time['t0']] = 0;obj[time['t1']] = 0;
                    result.forEach(function(row){
                        obj[row['timestamp']] = row['alerts_detected'];
                    });
                    var response = {label :[], data:[]};
                    Object.keys(obj).forEach(function(attr){
                        Object.keys(obj).forEach(function(slot) {
                            response['label'].push(slot);
                            response['data'].push(obj[slot]);
                        });
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
exports.tcpSessions= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-tcpSessions]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT " ;
            select+= "CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600) AS slot, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%Y-%m-%d %H:%i:%s') as timestamp, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%H:%i') as hours, ";
            select+= "unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600 as label, ";
            select+= "SUM(logstash.tcp_sessions) AS tcp_sessions ";
            select+= "FROM logstash ";
            select+= "WHERE 1=1 AND DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 5 HOUR) AND DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s') <= NOW() ";
            select+= "GROUP BY 1 ORDER BY 1 ASC ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP tcpSessions]SQL : ' + select);
                    console.error('[ISP tcpSessions]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var obj = {};
                    var time = timegiver();
                    obj[time['t0']] = 0;obj[time['t1']] = 0;
                    result.forEach(function(row){
                        obj[row['timestamp']] = row['tcp_sessions'];
                    });
                    var response = {label :[], data:[]};
                    Object.keys(obj).forEach(function(attr){
                        Object.keys(obj).forEach(function(slot) {
                            response['label'].push(slot);
                            response['data'].push(obj[slot]);
                        });
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
exports.IPVersions= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-IPVersions]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT " ;
            select+= "CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600) AS slot, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%Y-%m-%d %H:%i:%s') as timestamp, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%H:%i') as hours, ";
            select+= "unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600 as label, ";
            select+= "SUM(logstash.ip_version_ipv4) AS ipv4, ";
            select+= "SUM(logstash.ip_version_ipv4_v6) AS ipv4_v6, ";
            select+= "SUM(logstash.ip_version_ipv6) AS ipv6, ";
            select+= "SUM(logstash.ip_version_ipv6_v6) AS ipv6_v6, ";
            select+= "SUM(logstash.ip_version_teredo) AS teredo ";
            select+= "FROM logstash ";
            select+= "WHERE 1=1 AND DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 5 HOUR) AND DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s') <= NOW() ";
            select+= "GROUP BY 1 ORDER BY 1 ASC ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP IPVersions]SQL : ' + select);
                    console.error('[ISP IPVersions]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var obj = {
                        'ipv4'      :{},
                        'ipv4_v6'   :{},
                        'ipv6'      :{},
                        'ipv6_v6'   :{},
                        'teredo'    :{}
                    };
                    var time = timegiver();
                    obj[time['t0']] = 0;obj[time['t1']] = 0;
                    obj['ipv4'][time['t0']] = 0; obj['ipv4'][time['t1']] = 0;
                    obj['ipv4_v6'][time['t0']] = 0; obj['ipv4_v6'][time['t1']] = 0;
                    obj['ipv6'][time['t0']] = 0; obj['ipv6'][time['t1']] = 0;
                    obj['ipv6_v6'][time['t0']] = 0; obj['ipv6_v6'][time['t1']] = 0;
                    obj['teredo'][time['t0']] = 0; obj['teredo'][time['t1']] = 0;

                    result.forEach(function(row){
                        obj['ipv4'][row['timestamp']] = row['ipv4'];
                        obj['ipv4_v6'][row['timestamp']] = row['ipv4_v6'];
                        obj['ipv6'][row['timestamp']] = row['ipv6p'];
                        obj['ipv6_v6'][row['timestamp']] = row['tipv6_v6'];
                        obj['teredo'][row['timestamp']] = row['tteredo'];
                    });
                    var response = {
                        'ipv4'  :{label :[], data:[]},
                        'ipv4_v6'  :{label :[], data:[]},
                        'ipv6'   :{label :[], data:[]},
                        'ipv6_v6'   :{label :[], data:[]},
                        'teredo'   :{label :[], data:[]}
                    };
                    var label = []; var data = [];
                    Object.keys(obj).forEach(function(attr){
                        Object.keys(obj[attr]).sort().forEach(function(slot) {
                            response[attr]['label'].push(slot);
                            response[attr]['data'].push(obj[attr][slot]);
                        });
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
exports.IPProtocol= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-IpProtocol]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT " ;
            select+= "CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600) AS slot, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%Y-%m-%d %H:%i:%s') as timestamp, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%H:%i') as hours, ";
            select+= "unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600 as label, ";
            select+= "SUM(logstash.ip_protocol_tcp) AS tcp, ";
            select+= "SUM(logstash.ip_protocol_udp) AS udp, ";
            select+= "SUM(logstash.ip_protocol_gre) AS gre, ";
            select+= "SUM(logstash.ip_protocol_sctp) AS sctp ";
            select+= "FROM logstash ";
            select+= "WHERE 1=1 AND DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 5 HOUR) AND DATE_FORMAT(logstash.timestamp, '%Y-%m-%d %H:%i:%s') <= NOW() ";
            select+= "GROUP BY 1 ORDER BY 1 ASC ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP IpProtocol]SQL : ' + select);
                    console.error('[ISP IpProtocol]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var obj = {
                        'tcp'   :{},
                        'udp'   :{},
                        'gre'   :{},
                        'sctp'  :{}
                    };
                    var time = timegiver();
                    obj['tcp'][time['t0']] = 0; obj['tcp'][time['t1']] = 0;
                    obj['udp'][time['t0']] = 0; obj['udp'][time['t1']] = 0;
                    obj['gre'][time['t0']] = 0; obj['gre'][time['t1']] = 0;
                    obj['sctp'][time['t0']] = 0; obj['sctp'][time['t1']] = 0;

                    result.forEach(function(row){
                        obj['udp'][row['timestamp']] = row['udp'];
                        obj['gre'][row['timestamp']] = row['gre'];
                        obj['sctp'][row['timestamp']] = row['sctp'];
                        obj['tcp'][row['timestamp']] = row['tcp'];
                    });
                    var response = {
                        'udp'  :{label :[], data:[]},
                        'gre'  :{label :[], data:[]},
                        'sctp' :{label :[], data:[]},
                        'tcp'  :{label :[], data:[]}
                    };
                    var label = []; var data = [];
                    Object.keys(obj).forEach(function(attr){
                        Object.keys(obj[attr]).sort().forEach(function(slot) {
                            response[attr]['label'].push(slot);
                            response[attr]['data'].push(obj[attr][slot]);
                        });
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
//Http
exports.httpVersions= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-http_versions]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT DISTINCT(http.protocol) as label, COUNT(*) as count ";
                select += "FROM http JOIN events ON (events.event_id = http.event_id) ";
                select += "WHERE 1=1 AND http.protocol IS NOT NULL ";
                //select += "-- 	AND DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 30 minute) ";
                select += "GROUP BY 1";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP http_versions]SQL : ' + select);
                    console.error('[ISP http_versions]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var response = {label :[], data:[]};
                    result.forEach(function(row){
                        response['label'].push(row['label']);
                        response['data'].push(row['count']);
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
exports.httpMethods= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-http_method]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT DISTINCT(http.http_method) as label, COUNT(*) as count ";
            select += "FROM http JOIN events ON (events.event_id = http.event_id) ";
            select += "WHERE 1=1 AND http.http_method IS NOT NULL ";
            //select += "-- 	AND DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 30 minute) ";
            select += "GROUP BY 1";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP http_method]SQL : ' + select);
                    console.error('[ISP http_method]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var response = {label :[], data:[]};
                    result.forEach(function(row){
                        response['label'].push(row['label']);
                        response['data'].push(row['count']);
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
exports.userAgent= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-user_agent]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT DISTINCT(http.http_user_agent) as label, COUNT(*) as count ";
            select += "FROM http JOIN events ON (events.event_id = http.event_id) ";
            select += "WHERE 1=1 AND http.http_user_agent IS NOT NULL ";
            //select += "-- 	AND DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 30 minute) ";
            select += "GROUP BY 1";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP user_agent]SQL : ' + select);
                    console.error('[ISP user_agent]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var response = {label :[], data:[]};
                    result.forEach(function(row){
                        response['label'].push(row['label']);
                        response['data'].push(row['count']);
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
exports.httpHostnames= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-http_hostnames]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT DISTINCT(http.hostname) as label, COUNT(*) as count ";
            select += "FROM http JOIN events ON (events.event_id = http.event_id) ";
            select += "WHERE 1=1 AND http.hostname IS NOT NULL ";
            //select += "-- 	AND DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 30 minute) ";
            select += "GROUP BY 1";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP http_hostnames]SQL : ' + select);
                    console.error('[ISP http_hostnames]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var response = {label :[], data:[]};
                    result.forEach(function(row){
                        response['label'].push(row['label']);
                        response['data'].push(row['count']);
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
exports.httpTimeline= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-tcpSessions]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT " ;
            select+= "CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600) AS slot, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%Y-%m-%d %H:%i:%s') as timestamp, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600), '%H:%i') as hours, ";
            select+= "unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600)*600 as label, ";
            select+= "count(http.http_id) AS count ";
            select+= "FROM events JOIN http ON (http.event_id = events.event_id)";
            select+= "WHERE 1=1 AND DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 5 HOUR) AND DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s') <= NOW() ";
            select+= "GROUP BY 1 ORDER BY 1 ASC ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP tcpSessions]SQL : ' + select);
                    console.error('[ISP tcpSessions]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var obj = {};
                    var time = timegiver();
                    obj[time['t0']] = 0; obj[time['t1']] = 0;

                    result.forEach(function(row){
                        obj[row['timestamp']] = row['count'];
                    });
                    var response = {label :[], data:[]};
                    Object.keys(obj).forEach(function(slot) {
                        response['label'].push(slot);
                        response['data'].push(obj[slot]);
                    });

                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
exports.httpLogs= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-httpLogs]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT "+
                "   DATE_FORMAT(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s') , '%M %d, %Y @ %H:%i:%s.%f') as 'time',    "+
                "   events.src_ip as 'client_hostname', "+
                "   http.http_method as 'http_method', " +
                "   http.hostname as 'hostname', " +
                "   http.url as 'url', " +
                "   http.status as 'status' " +
                "FROM http   "+
                "   LEFT OUTER JOIN events ON (events.event_id = http.event_id) " +
                "ORDER BY 1 DESC";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP httpLogs]SQL : ' + select);
                    console.error('[ISP httpLogs]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var obj = [];
                    result.forEach(function(row){
                        obj.push(row);
                    });
                    res.end(JSON.stringify({'data': obj}));
                }
            });
        }
    });
}
//GeoMap
exports.alertGeoPos= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-alertGeoPos]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT "+
                "geoip.country_code2, "+
                "geoip.country_code3, "+
                "geoip.country_name, "+
                "count(alert.alert_id) as count, "+
                "avg(geoip.latitude) as latitude, "+
                "avg(geoip.longitude) as longitude "+
                "FROM alert LEFT OUTER JOIN geoip ON (geoip.event_id = alert.event_id) "+
                "WHERE 1=1 AND geoip.latitude IS NOT NULL AND geoip.longitude IS NOT NULL "+
                "GROUP BY 1,2,3 ORDER BY 4 DESC";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP alertGeoPos]SQL : ' + select);
                    console.error('[ISP alertGeoPos]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    res.end(JSON.stringify({'data': result}));
                }
            });
        }
    });
}
exports.alertsTypeTimeline = function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-AlertsTypeTimeline]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT ";
            select +="  CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600) AS slot, ";
            select +="  FROM_UNIXTIME((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s'))) / 600) * 600), '%Y-%m-%d %H:%i:%s') AS timestamp, ";
            select +="  FROM_UNIXTIME((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s'))) / 600) * 600), '%H:%i') AS hours, ";
            select +="  UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s'))) / 600) * 600 AS label, ";
            select +="  SUM(CASE WHEN events.app_proto = 'http' THEN 1 ELSE 0 END) as http, ";
            select +="  SUM(CASE WHEN events.app_proto = 'ssh' THEN 1 ELSE 0 END) as ssh, ";
            select +="  SUM(CASE WHEN events.app_proto = 'smtp' THEN 1 ELSE 0 END) as smtp, ";
            select +="  SUM(CASE WHEN events.app_proto = 'tls' THEN 1 ELSE 0 END) as tls, ";
            select +="  (SELECT COUNT(*) FROM alert) as total "
            select +="FROM alert JOIN events ON (events.event_id = alert.event_id) ";
            select +="WHERE 1 = 1 ";
            select +="  AND events.event_type = 'alert' ";
            //select +="  AND DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 5 HOUR) ";
            select +="  AND STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s') <= NOW() ";
            select +="  AND STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s') >= NOW() - INTERVAL 6 HOUR ";
            select +="GROUP BY 1 ";
            select +="ORDER BY 1 ASC ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP alertsTypeTimeline]SQL : ' + select);
                    console.error('[ISP alertsTypeTimeline]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var time = timegiver();
                    var obj = {
                        'http' : {},
                        'ssh': {},
                        'smtp' :{},
                        'tls' : {}
                    };
                    obj['http'][time['t0']] = 0;obj['http'][time['t1']] = 0;
                    obj['ssh'][time['t0']] = 0;obj['ssh'][time['t1']] = 0;
                    obj['smtp'][time['t0']] = 0;obj['smtp'][time['t1']] = 0;
                    obj['tls'][time['t0']] = 0;obj['tls'][time['t1']] = 0;
                    result.forEach(function(row){
                        obj["http"][row['timestamp']]   = row["http"];
                        obj["ssh"][row['timestamp']]    = row["ssh"];
                        obj["smtp"][row['timestamp']]   = row["smtp"];
                        obj["tls"][row['timestamp']]    = row["tls"];
                    });
                    var response = {
                        "http" : {label : [], data : []},
                        "ssh"  : {label : [], data : []},
                        "smtp"   : {label : [], data : []},
                        "tls"   : {label : [], data : []}
                    };
                    Object.keys(obj).forEach(function(attr){
                        Object.keys(obj[attr]).sort().forEach(function(slot) {
                            response[attr]['label'].push(slot);
                            response[attr]['data'].push(obj[attr][slot]);
                        });
                    });
                    var total = 0;
                    if(result.length){
                        total = result[0]['total'];
                    }
                    res.end(JSON.stringify({'data': response, 'totalAlerts': total}));
                }
            });
        }
    });
}
exports.alertsProtocol = function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-alertProtocol]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT "+
                "events.proto as label, "+
                "count(*) as count "+
                "FROM events WHERE events.event_type = 'alert' "+
                "GROUP BY 1 ORDER BY 2 DESC";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP alertProtocol]SQL : ' + select);
                    console.error('[ISP alertProtocol]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var response = {label :[], data:[]};
                    result.forEach(function(row){
                        response['label'].push(row['label']);
                        response['data'].push(row['count']);
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
//Alerts
exports.alertsSeverityTimeline = function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-AlertsTimeline]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT ";
            select +="  CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 600) AS slot, ";
            select +="  FROM_UNIXTIME((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s'))) ) ), '%Y-%m-%d %H:%i:%s') AS timestamp, ";
            select +="  FROM_UNIXTIME((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s'))) ) ), '%H:%i') AS hours, ";
            select +="  UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s'))) )  AS label, ";
            select +="  count(*) as allEvents, ";
            select +="  SUM(CASE WHEN alert.severity = 1 THEN 1 ELSE 0 END) as alert, ";
            select +="  SUM(CASE WHEN alert.severity = 2 THEN 1 ELSE 0 END) as critical, ";
            select +="  SUM(CASE WHEN alert.severity = 3 THEN 1 ELSE 0 END) as warning, ";
            select +="  (SELECT COUNT(*) FROM alert) as total "
            select +="FROM alert JOIN events ON (events.event_id = alert.event_id) ";
            select +="WHERE 1 = 1 ";
            select +="  AND STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 5 HOUR) ";
            select +="  AND STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s') <= NOW() ";
            select +="GROUP BY 1 ";
            select +="ORDER BY 1 ASC ";

            console.log(select)

            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP decodeTrafficVolume]SQL : ' + select);
                    console.error('[ISP decodeTrafficVolume]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var obj = {
                        "alert"     : {},
                        "critical"  : {},
                        "warning"   : {}
                    };
                    var time = timegiver();
                    obj["alert"][time['t0']]   = 0; obj["alert"][time['t1']]   = 0;
                    obj["critical"][time['t0']]   = 0; obj["critical"][time['t1']]   = 0;
                    obj["warning"][time['t0']]   = 0; obj["warning"][time['t1']]   = 0;
                    result.forEach(function(row){
                        obj["alert"][row['timestamp']]   = row["alert"];
                        obj["critical"][row['timestamp']]    = row["critical"];
                        obj["warning"][row['timestamp']]     = row["warning"];
                    });
                    var response = {
                        "alert" : {label : [], data : []},
                        "critical"  : {label : [], data : []},
                        "warning"   : {label : [], data : []}

                    };
                    Object.keys(obj).forEach(function(attr){
                        Object.keys(obj[attr]).sort().forEach(function(slot) {
                            response[attr]['label'].push(slot);
                            response[attr]['data'].push(obj[attr][slot]);
                        });
                    });
                    var total = 0;
                    if(result.length){
                        total = result[0]['total'];
                    }
                    res.end(JSON.stringify({'data': response, 'total':total}));
                }
            });
        }
    });
}
exports.alertsLogs= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-alertLogs]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT "+
                "   DATE_FORMAT(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s'), '%M %d, %Y @ %H:%i:%s.%f') as 'time',    "+
                "   events.src_ip as 'client_hostname', "+
                "   alert.severity as severity, " +
                "   alert.category as category, " +
                "   alert.signature as signature, " +
                "   alert.signature_id as signature_id, " +
                "   alert.category as category " +
                "FROM alert   "+
                "   LEFT OUTER JOIN events ON (events.event_id = alert.event_id) " +
                "ORDER BY 1 DESC";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP alertLogs]SQL : ' + select);
                    console.error('[ISP alertLogs]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var obj = [];
                    result.forEach(function(row){
                        obj.push(row);
                    });
                    res.end(JSON.stringify({'data': obj}));
                }
            });
        }
    });
}
exports.alertsCategory= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-alerts_category]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT DISTINCT(alert.category) as label, COUNT(*) as count ";
            select +="FROM alert LEFT JOIN  events ON (alert.event_id = events.event_id) ";
            select +="GROUP BY 1 ORDER BY 1 LIMIT 10 ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP alerts_category]SQL : ' + select);
                    console.error('[ISP alerts_category]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var response = {label :[], data:[]};
                    result.forEach(function(row){
                        response['label'].push(row['label']);
                        response['data'].push(row['count']);
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
exports.alertsSource= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-alerts_source]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT DISTINCT(events.src_ip) as label, COUNT(*) as count ";
                select +="FROM alert LEFT JOIN  events ON (alert.event_id = events.event_id) ";
                select +="GROUP BY 1 ORDER BY 1 LIMIT 10 ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP alerts_source]SQL : ' + select);
                    console.error('[ISP alerts_source]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var response = {label :[], data:[]};
                    result.forEach(function(row){
                        response['label'].push(row['label']);
                        response['data'].push(row['count']);
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
exports.alertsDestination= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-alerts_destination]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT DISTINCT(events.dest_ip) as label, COUNT(*) as count ";
            select +="FROM alert LEFT JOIN  events ON (alert.event_id = events.event_id) ";
            select +="GROUP BY 1 ORDER BY 1 LIMIT 10 ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP alerts_destination]SQL : ' + select);
                    console.error('[ISP alerts_destination]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var response = {label :[], data:[]};
                    result.forEach(function(row){
                        response['label'].push(row['label']);
                        response['data'].push(row['count']);
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
exports.alertsHeatMap= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-alerts_geomap]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT geoip.latitude, longitude, count(geoip.geoip_id) as magnitude  "//FROM geoip WHERE latitude IS NOT NULL ";
                select +="FROM alert JOIN geoip ON (geoip.event_id = alert.event_id) ";
                select +="WHERE latitude IS NOT NULL ";
                select +="group by 1,2 ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP alerts_geomap]SQL : ' + select);
                    console.error('[ISP alerts_geomap]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var response = [];
                    result.forEach(function(row){
                        response.push([row['latitude'], row['longitude'], row['magnitude']]);
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}

//ALL Events
exports.allEventsTimeline = function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-DecoderTrafficVolume_connection]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT ";
                select +="  CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s'))) / 600) AS slot, ";
                select +="  FROM_UNIXTIME((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s'))) / 600) * 600), '%Y-%m-%d %H:%i:%s') AS timestamp, ";
                select +="  FROM_UNIXTIME((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s'))) / 600) * 600), '%H:%i') AS hours, ";
                select +="  UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s'))) / 600) * 600 AS label, ";
                select +="  count(*) as allEvents, ";
                select +="  SUM(CASE WHEN events.event_type = 'alert' THEN 1 ELSE 0 END) as alert, ";
                select +="  SUM(CASE WHEN events.event_type = 'dhcp' THEN 1 ELSE 0 END) as dhcp, ";
                select +="  SUM(CASE WHEN events.event_type = 'dns' THEN 1 ELSE 0 END) as dns, ";
                select +="  SUM(CASE WHEN events.event_type = 'fileinfo' THEN 1 ELSE 0 END) as fileinfo, ";
                select +="  SUM(CASE WHEN events.event_type = 'flow' THEN 1 ELSE 0 END) as flow, ";
                select +="  SUM(CASE WHEN events.event_type = 'http' THEN 1 ELSE 0 END) as http, ";
                select +="  SUM(CASE WHEN events.event_type = 'ssh' THEN 1 ELSE 0 END) as ssh, ";
                select +="  SUM(CASE WHEN events.event_type = 'tls' THEN 1 ELSE 0 END) as tls ";
                select +="FROM events ";
                select +="WHERE 1 = 1 ";
                select +="  AND STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 5 HOUR) ";
                select +="  AND STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s') <= NOW() ";
                select +="GROUP BY 1 ";
                select +="ORDER BY 1 ASC "
            ;
                console.log(select)
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP decodeTrafficVolume]SQL : ' + select);
                    console.error('[ISP decodeTrafficVolume]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var time = timegiver();
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
                    obj["alert"][time['t0']]=0; obj["alert"][time['t1']]=0;
                    obj["dhcp"][time['t0']]=0; obj["dhcp"][time['t1']]=0;
                    obj["dns"][time['t0']]=0; obj["dns"][time['t1']]=0;
                    obj["fileinfo"][time['t0']]=0; obj["fileinfo"][time['t1']]=0;
                    obj["flow"][time['t0']]=0; obj["flow"][time['t1']]=0;
                    obj["http"][time['t0']]=0; obj["http"][time['t1']]=0;
                    obj["ssh"][time['t0']]=0; obj["ssh"][time['t1']]=0;
                    obj["tls"][time['t0']]=0; obj["tls"][time['t1']]=0;
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
                        Object.keys(obj[attr]).sort().forEach(function(slot) {
                            response[attr]['label'].push(slot);
                            response[attr]['data'].push(obj[attr][slot]);
                        });
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
exports.allEventsType   = function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-allEventsType]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT DISTINCT(events.event_type) as label, COUNT(*) as count ";
            select += "FROM events ";
            select += "WHERE 1=1 ";
            ////select += "-- 	AND DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 30 minute) ";
            select += "GROUP BY 1";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP allEventsType]SQL : ' + select);
                    console.error('[ISP allEventsType]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var response = {label :[], data:[]};
                    result.forEach(function(row){
                        response['label'].push(row['label']);
                        response['data'].push(row['count']);
                    });
                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
//DNS//
exports.dnsTimeline= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-DNSTimeline]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT " ;
            select+= "CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600)) - UNIX_TIMESTAMP(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s'))) / 600) AS slot, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s'))) / 600)*600), '%Y-%m-%d %H:%i:%s') as timestamp, ";
            select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s'))) / 600)*600), '%H:%i') as hours, ";
            select+= "unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 600) * 600))-UNIX_TIMESTAMP(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s'))) / 600)*600 as label, ";
            select+= "count(dns.dns_id) AS count ";
            select+= "FROM events JOIN dns ON (dns.event_id = events.event_id)";
            select+= "WHERE 1=1 AND STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 5 HOUR) AND STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s') <= NOW() ";
            select+= "GROUP BY 1 ORDER BY 1 ASC ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP dnsTimeline]SQL : ' + select);
                    console.error('[ISP dnsTimeline]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var time = timegiver();
                    var obj = {};
                    obj[time['t0']] =0; obj[time['t1']] =0
                    result.forEach(function(row){
                        obj[row['timestamp']] = row['count'];
                    });
                    var response = {label :[], data:[]};

                    Object.keys(obj).forEach(function(slot) {
                        response['label'].push(slot);
                        response['data'].push(obj[slot]);
                    });

                    res.end(JSON.stringify({'data': response}));
                }
            });
        }
    });
}
exports.dnsLogs= function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-dnsLogs]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT "+
                "   DATE_FORMAT(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s'), '%M %d, %Y @ %H:%i:%s.%f') as 'time',    "+
                "   events.src_ip as 'client_hostname', "+
                "   dns.type as type, " +
                "   dns.rrname as rrname, " +
                "   dns.rcode as rcode, " +
                "   dns.rrtype as rrtype, " +
                "   dns.rdata as rdata " +
                "FROM dns   "+
                "   LEFT OUTER JOIN events ON (events.event_id = dns.event_id) " +
                "ORDER BY 1 DESC";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP dnsLogs]SQL : ' + select);
                    console.error('[ISP dnsLogs]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var obj = [];
                    result.forEach(function(row){
                        obj.push(row);
                    });
                    res.end(JSON.stringify({'data': obj}));
                }
            });
        }
    });
}

exports.netfilterSourceIp = function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-aggregateDNS_connection]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "(SELECT DISTINCT(events.src_ip) as label, COUNT(events.event_id) as count "+
                "FROM events "+
                "GROUP BY 1 ORDER BY 2 DESC LIMIT 10 ) "+
                "UNION "+
                "(SELECT 'Total' as label, COUNT(events.event_id) as count "+
                "FROM events ) ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP EventsFlow]SQL : ' + select);
                    console.error('[ISP EventsFlow]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var summer = 0;
                    var label = []; var data = [];
                    result.forEach(function(row){
                        if(row['label'] != 'Total'){
                            summer += row['count'];
                        }else{
                            row['count'] = row['count']-summer;
                        }
                        label.push(row['label']);
                        data.push(row['count']);
                    });
                    res.end(JSON.stringify({'data': {'label':label, 'data':data}}));
                }
            });
        }
    });
}
exports.netfilterDestPort = function(req, res) {
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-aggregateDNS_connection]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT DISTINCT(events.dest_port) as port, COUNT(events.event_id) as count FROM events  WHERE events.dest_port IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 10 ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP DestPort]SQL : ' + select);
                    console.error('[ISP DestPort]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var label = []; var data = [];
                    result.forEach(function(row){
                        label.push(row['port']);
                        data.push(row['count']);
                    });
                    res.end(JSON.stringify({'data': {'label':label, 'data':data}}));
                }
            });
        }
    });
}

function timegiver(){
    var dt = new Date();
    var H1 = new Date(dt.setHours( dt.getHours() + 1, 0, 0));
    var dt = new Date();
    var H0 = new Date(dt.setHours( dt.getHours() - 5, 0, 0));

    var t1 = H1.getFullYear()+"-"+pad(H1.getMonth()+1, 2)+"-"+pad(H1.getDate(), 2) +" "+pad(H1.getHours(),2)+ ":00:00";
    var t0 = H0.getFullYear()+"-"+pad(H0.getMonth()+1, 2)+"-"+pad(H0.getDate(), 2) +" "+pad(H0.getHours(),2)+ ":00:00";

    return {t1: t1, t0:t0}

}
function pad (str, max) {
    str = str.toString();
    return str.length < max ? pad("0" + str, max) : str;
}

//DNS// Da cancellare!!!
exports.aggregateDNS = function(req, res) {
    var param = req.body;
    pool.getConnection(function (err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-aggregateDNS_connection]Error DB: ' + err));
            cb({err: err});
        } else {
            var queryList = [
                {
                    'label': 'client',
                    'select': "SELECT host as type, count(*) as count FROM events WHERE event_type = 'dns' GROUP BY 1 ORDER BY 2 DESC;"
                },
                {
                    'label': 'top_query',
                    'select': "SELECT rrname as type, count(*) as count FROM dns WHERE type = 'query' GROUP BY 1  ORDER BY 2 DESC LIMIT 10;"
                },
                {
                    'label': 'top_answer',
                    'select': "SELECT rrname as type, count(*) as count FROM dns WHERE type = 'answer' GROUP BY 1  ORDER BY 2 DESC LIMIT 10;"
                }
            ];
            var labels = ['rrname', 'type', 'rrtype', 'rcode'];
            labels.forEach(function (label) {
                var select = "SELECT " + label + " as type,  count(*) as count FROM dns GROUP BY 1 HAVING type != 'undefined' ORDER BY 2 DESC LIMIT 5;";
                var obj = {
                    'label': label,
                    'select': select
                }
                queryList.push(obj);
            });
            executeQueryAggregate(connection, queryList, {}, function (data) {
                connection.release();
                if (data.err) {
                    res.end(JSON.stringify({'err': data.err}));
                } else {
                    res.end(JSON.stringify({'data': data}));
                }
            })
        }
    });
};
function executeQueryAggregate(connection, queryList, res, cb){
    if(!queryList.length){
        cb(res);
    }else{
        var query = queryList.shift();
        connection.query(query['select'], function (err, result) {
            if (err) {
                console.error(JSON.stringify('[ISP-executeQuery]SQL : ' + query['select']));
                console.error(JSON.stringify('[ISP-executeQuery]Error : ' + err));
                cb({'err': err});
            } else {
                res[query['label']] = {label :[], data: []};
                result.forEach(function(row){
                    res[query['label']]['label'].push(row['type']);
                    res[query['label']]['data'].push(row['count']);
                });
                executeQueryAggregate(connection, queryList, res, cb);
            }
        });
    }
}
exports.timeLineDNS = function(req, res) {
    var param = req.body;
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-aggregateDNS_connection]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT ";
                select+= "CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300)) - UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 300) AS slot, ";
                select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 300)*300), '%Y-%m-%d %H:%i:%s') as timestamp, ";
                select+= "from_unixtime((unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 300)*300), '%H:%i') as hours, ";
                select+= "unix_timestamp(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-CEILING((UNIX_TIMESTAMP(SEC_TO_TIME((TIME_TO_SEC(NOW()) DIV 300) * 300))-UNIX_TIMESTAMP(DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s'))) / 300)*300 as label, ";
                select+= "COUNT(event_id) AS count ";
                select+= "FROM events ";
                select+= "WHERE events.event_type = 'dns' AND DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s') >= DATE_SUB(NOW(), INTERVAL 5 HOUR) AND DATE_FORMAT(events.timestamp, '%Y-%m-%d %H:%i:%s') <= NOW() ";
                select+= "GROUP BY 1 ORDER BY 1 ASC ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP DNS -timeLineDNS]SQL : ' + select);
                    console.error('[ISP DNS -timeLineDNS]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var obj = {};

                    var time = timegiver();
                    obj[time['0']] = 0; obj[time['t1']] = 0;
                    result.forEach(function(row){
                        obj[row['timestamp']] = row['count'];
                    });
                    var label = []; var data = [];
                    Object.keys(obj).forEach(function(slot){
                        label.push(slot);
                        data.push(obj[slot]);
                    });
                    res.end(JSON.stringify({'data': {label :label, data: data}}));
                }
            });
        }
    });
};
exports.listDNS = function(req, res) {
    var param = req.body;
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[ISP-aggregateDNS_connection]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT "+
            "   DATE_FORMAT(STR_TO_DATE(events.timestamp, '%Y-%m-%dT%H:%i:%s') , '%M %d, %Y @ %H:%i:%s.%f') as 'time',    "+
            "   events.src_ip as 'client_hostname', "+
            "   events.dest_ip as 'server_hostname', " +
            "   dns.type as 'dns_type',    "+
            "   dns.rrname as 'dns_rrname', "+
            "   dns.rcode as 'dns_rcode',  "+
            "   answer.rrtype as 'dns_rrtype', "+
            "   answer.rdata as 'dns_rdata'    "+
            "FROM dns   "+
            "   LEFT OUTER JOIN answer ON (answer.dns_id = dns.dns_id) "+
            "   LEFT OUTER JOIN events ON (events.event_id = dns.event_id) " +
            "ORDER BY 1 DESC";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error('[ISP DNS - listDns]SQL : ' + select);
                    console.error('[ISP DNS - listDns]Error : ' + err);
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var obj = [];
                    result.forEach(function(row){
                        obj.push(row);
                    });
                    res.end(JSON.stringify({'data': obj}));
                }
            });
        }
    });
};


