var request     = require('request');
var mysql       = require('mysql');
const csv       = require('csv-parser');
var {PythonShell} = require('python-shell');
var DATACOMMON = require('./DataCommon');

var dataPool = DATACOMMON.dataPoolVuln;
var pool  = mysql.createPool(dataPool);

var partsDecoder = {'a' : 'Application', 'h': 'Hardware', 'o': 'Operating System'};

exports.singleEvent = function(event_id, cb){
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-singleEvent_connection]Error DB: ' + err));
            cb({err: err});
        } else {
            singleEventObj(connection, event_id, function(objectIdList){
                var dataList = ["id","published", "cvss-score", "credit", "description","cvss-string", "modified" ];
                singleEventData(connection, event_id, objectIdList, dataList, {}, function(results){
                    var response = {
                        event_id : event_id,
                        PublicationDatetime : results['published'],
                        CVSSID : results['id'],
                        CVSSscore : results['cvss-score'],
                        CreditSource : results['credit'],
                        VulnerableConfigurations : results[''],
                        Description : results['description'],
                        Modified : results['modified'],
                        CVSSstring : results['cvss-string'],
                    }
                    connection.release();
                    cb(response);
                    /*
                    eventListAttributes(connection, ['references', 'vulnerable_configuration'], objectIdList, response, event_id, function(result){
                        connection.release();
                        cb(result);
                    });
                     */
                })
            })
        }
    });
}
exports.vulnHist = function(req, res) {
    var param = req.body;
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-vulnHist_connection]Error DB: ' + err));
            cb({err: err});
        } else {
            var select;
            if(param['option']['time'] == 1){
                select = "SELECT year as 'time', sum(count) as count FROM vulnHist GROUP BY year ORDER BY 1 DESC;";
            }else if(param['option']['time'] ==2){
                select = "SELECT time, month, SUM(count) as count FROM vulnHist WHERE 1=1 AND year = "+param['option']['year']+" group by 1 ORDER BY 1 DESC;";
            }else if(param['option']['time'] ==3) {
                select = "SELECT DATE_FORMAT(attributes.value, '%d') as time, count(*) as count FROM events LEFT JOIN objects ON objects.event_id = events.event_id LEFT OUTER JOIN attributes ON (attributes.object_id = objects.object_id AND attributes.object_relation = 'published' AND attributes.object_relation = 'published' AND DATE_FORMAT(attributes.value, '%Y') >= 2000) WHERE 1 = 1  AND attributes.value IS NOT NULL AND DATE_FORMAT(attributes.value, '%Y') = "+param['option']['year'] +"  AND DATE_FORMAT(attributes.value, '%m') = " + param['option']['month'] +"  GROUP BY 1 ";
            }
            connection.query(select, function (err, result) {
                if (err) {
                    console.error(JSON.stringify('[MISP-vulnHist-select]SQL : ' + select));
                    console.error(JSON.stringify('[MISP-vulnHist-select]Error : ' + err));
                    res.end(JSON.stringify({'err': err}));
                } else {
                    connection.release();
                    res.end(JSON.stringify({'data': result}));
                }
            });
        }
    });
};
exports.aggregate = function(req, res) {
    var param = req.body;
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-aggregate_connection]Error DB: ' + err));
            cb({err: err});
        } else {

            var labels = ['attack_vector', 'attack_complexity', 'privileges_required', 'user_interaction', 'scope', 'confidentiality_impact', 'integrity_impact', 'availability_impact'];
            var select = "SELECT * FROM attrAggregate;"
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error(JSON.stringify('[MISP-attrAggregate]SQL : ' + query['select']));
                    console.error(JSON.stringify('[MISP-attrAggregate]Error : ' + err));
                    res.end(JSON.stringify({'err': data.err}));
                } else {
                    var obj = {};
                    result.forEach(function(row){
                        if(!obj[row['name']]){obj[row['name']]={'label':[],'data':[]}}
                        obj[row['name']]['label'].push(row['type'])
                        obj[row['name']]['data'].push(row['count'])
                    });
                    res.end(JSON.stringify({'data': obj}));
                }
            });
        }
    });
};
exports.last = function(req, res) {
    var param = req.body;
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-last_connection]Error DB: ' + err));
            cb({err: err});
        } else {
            var select = "SELECT * FROM lastVuln";
            connection.query(select, function (err, result) {
                if (err) {
                    console.error(JSON.stringify('[MISP-executeQueryLast]SQL : ' + select));
                    console.error(JSON.stringify('[MISP-executeQueryLast]Error : ' + err));
                    res.end(JSON.stringify({'err': err}));
                } else {
                    var obj = {};
                    result.forEach(function(row){
                        if(!obj[row['name']]){obj[row['name']]=0;}
                        obj[row['name']] = row['count'];
                    })
                    res.end(JSON.stringify({'data': obj}));
                }
            });
        }
    });
};
exports.statsVuln = function(req, res) {
    var param = req.body;
    var where = '';
    if(param['year']){
        where += " AND DATE_FORMAT(value, '%Y') = "+param['year']+ " ";
    }
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-last_connection]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT * FROM statsVuln";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error(JSON.stringify('[MISP-statsVuln]SQL : ' + select));
                    console.error(JSON.stringify('[MISP-statsVuln]Error : ' + err));
                    res.end(JSON.stringify({'err': err}));
                } else {
                    if (result.err) {
                        res.end(JSON.stringify({'err': result.err}));
                    } else {
                        var data = {};
                        result.forEach(function(row){
                            data[row['name']] = row['count'];
                        })
                        res.end(JSON.stringify({'data': data}));
                    }
                }
            });
        }
    });
};
exports.evdbContains = function(req, res) {
    var param = req.body;
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-evdbContains]Error DB: ' + err));
            res.end(JSON.stringify({'err': err}));
        } else {
            var select = "SELECT * FROM evdbContains";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error(JSON.stringify('[MISP-evdbContains]SQL : ' + select));
                    console.error(JSON.stringify('[MISP-evdbContains]Error : ' + err));
                    res.end(JSON.stringify({'err': err}));
                } else {
                    if (result.err) {
                        res.end(JSON.stringify({'err': result.err}));
                    } else {
                        var data = {};
                        result.forEach(function(row){
                            data[row['name']] = row['count'];
                        })
                        res.end(JSON.stringify({'data': data}));
                    }
                }
            });
        }
    });
};
exports.severityScore = function(req, res){
    var param = req.body;
    var where = '';
    if(param['year']){
        where += " AND DATE_FORMAT(pub.value, '%Y') = "+param['year']+" ";
    }
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-last_connection]Error DB: ' + err));
            cb({err: err});
        } else {
            var select =
                "SELECT year,  SUM(v2Low) as v2Low  ,  SUM(v2Medium) as v2Medium ,  sum(v2High) as v2High ,  SUM(v3None) as v3None ,  SUM(v3Low) as v3Low ,  SUM(v3Medium) as v3Medium ,  SUM (v3High) as v3High ,  SUM(v3Critical) as v3Critical FROM severityScore " +
                "WHERE 1 = 1 "+ where + " " +
                "GROUP BY year ";
            connection.query(select, function (err, result) {
                if (err) {
                    console.error(JSON.stringify('[MISP-severity score-select]SQL : ' + select));
                    console.error(JSON.stringify('[MISP-severity score-select]Error : ' + err));
                    res.end(JSON.stringify({'err': err}));
                } else {
                    connection.release();
                    res.end(JSON.stringify({'data': result}));
                }
            });
        }
    });
}
exports.scoreHistory = function(req, res){
    var param = req.body;
    var where = '';
    if(param['year']){
        where += " AND DATE_FORMAT(pub.value, '%Y') = "+param['year']+" ";
    }
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-last_connection]Error DB: ' + err));
            cb({err: err});
        } else {
            var select = "SELECT * FROM severityScore "+
                "WHERE 1 = 1 "+ where + " "+
                "GROUP BY 1 "
            connection.query(select, function (err, result) {
                if (err) {
                    console.error(JSON.stringify('[MISP-ScoreHistory-select]SQL : ' + select));
                    console.error(JSON.stringify('[MISP-ScoreHistory-select]Error : ' + err));
                    res.end(JSON.stringify({'err': err}));
                } else {
                    connection.release();
                    var obj = {
                        labels :    [],
                        v2Low :     [],
                        v2Medium :  [],
                        v2High :    [],
                        v3None :    [],
                        v3Low :     [],
                        v3Medium :  [],
                        v3High :    [],
                        v3Critical :[]
                    }
                    result.forEach(function(row){
                        obj['labels'].push(row['Year']);
                        obj['v2Low'].push(row['v2Low']);
                        obj['v2Medium'].push(row['v2Medium']);
                        obj['v2High'].push(row['v2High']);
                        obj['v3None'].push(row['v3None']);
                        obj['v3Low'].push(row['v3Low']);
                        obj['v3Medium'].push(row['v3Medium']);
                        obj['v3High'].push(row['v3High']);
                        obj['v3Critical'].push(row['v3Critical']);
                    })
                    res.end(JSON.stringify({'data': obj}));
                }
            });
        }
    });
}
exports.scoreYear = function(req, res){
    var param = req.body;
    var where = '';
    if(param['year']){
        where += " AND DATE_FORMAT(pub.value, '%Y') = "+param['year']+" ";
    }
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-last_connection]Error DB: ' + err));
            cb({err: err});
        } else {
            var select = "SELECT MONTH(DATE_FORMAT(pub.value, '%Y-%m-%d')) as date, " +
                "    DATE_FORMAT(pub.value, '%b') as Month, "+
                "    SUM(case when score.value< 4 then 1 else 0 end) as v2Low, "+
                "    SUM(case when score.value>= 4 AND score.value<7 then 1 else 0 end) as v2Medium, "+
                "    SUM(case when score.value>= 7 then 1 else 0 end) as v2High, "+
                "    SUM(case when score.value = 0 then 1 else 0 end) as v3None, "+
                "    SUM(case when score.value> 0 AND score.value< 4 then 1 else 0 end) as v3Low, "+
                "    SUM(case when score.value>= 4 AND score.value< 7 then 1 else 0 end) as v3Medium, "+
                "    SUM(case when score.value>= 7 AND score.value< 9 then 1 else 0 end) as v3High, "+
                "    SUM(case when score.value>= 9 then 1 else 0 end) as v3Critical "+
                "FROM events LEFT JOIN objects ON objects.event_id = events.event_id LEFT OUTER JOIN attributes as pub ON (pub.object_id = objects.object_id and pub.object_relation = 'published')  LEFT OUTER JOIN attributes as score ON (score.object_id = objects.object_id and score.object_relation = 'cvss-score') " +
            "WHERE 1=1 "+ where + " "+
                "GROUP BY 1 " +
                "HAVING Month != 'null' ";
                "ORDER BY 1 ASC " +

            connection.query(select, function (err, result) {
                if (err) {
                    console.error(JSON.stringify('[MISP-ScoreMonth-select]SQL : ' + select));
                    console.error(JSON.stringify('[MISP-ScoreMonth-select]Error : ' + err));
                    res.end(JSON.stringify({'err': err}));
                } else {
                    connection.release();
                    var obj = {
                        labels :    [],
                        v2Low :     [],
                        v2Medium :  [],
                        v2High :    [],
                        v3None :    [],
                        v3Low :     [],
                        v3Medium :  [],
                        v3High :    [],
                        v3Critical :[]
                    }
                    result.forEach(function(row){
                        obj['labels'].push(row['Month']);
                        obj['v2Low'].push(row['v2Low']);
                        obj['v2Medium'].push(row['v2Medium']);
                        obj['v2High'].push(row['v2High']);
                        obj['v3None'].push(row['v3None']);
                        obj['v3Low'].push(row['v3Low']);
                        obj['v3Medium'].push(row['v3Medium']);
                        obj['v3High'].push(row['v3High']);
                        obj['v3Critical'].push(row['v3Critical']);
                    })
                    res.end(JSON.stringify({'data': obj}));
                }
            });
        }
    });
}
exports.vendorData= function(req, res){
    var param = req.body;
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-VendorData_connection]Error DB: ' + err));
            res.end(JSON.stringify({err: err}));
        } else {
            var select = "SELECT * FROM vendor ;";
            connection.query(select, function (err, result) {
                if (err) {
                    console.error(JSON.stringify('[MISP-VendorData-select]SQL : ' + select));
                    console.error(JSON.stringify('[MISP-VendorData-select]Error : ' + err));
                    res.end(JSON.stringify({'err': err}));
                } else {
                    connection.release();
                    var obj = {labels :[], values:[]};
                    result.forEach(function(row){
                        obj['labels'].push(row['label']);
                        obj['values'].push(row['value']);
                    })
                    res.end(JSON.stringify({'data': obj}));
                }
            });
        }
    });
}
exports.vendorTable= function(req, res){
    var param = req.body;
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-VendorTable_connection]Error DB: ' + err));
            res.end(JSON.stringify({err: err}));
        } else {
            var select = "SELECT vendor AS vendor, COUNT(DISTINCT(product)) as nprod, GROUP_CONCAT(DISTINCT(part)) as parts, COUNT(*) AS count FROM cpe GROUP BY 1 ORDER BY 4 DESC";
            connection.query(select, function (err, result) {
                if (err) {
                    console.error(JSON.stringify('[MISP-VendorTable-select]SQL : ' + select));
                    console.error(JSON.stringify('[MISP-VendorTable-select]Error : ' + err));
                    res.end(JSON.stringify({'err': err}));
                } else {
                    connection.release();
                    var obj = [];
                    result.forEach(function(row, pos){
                        row['pos'] = pos+1;
                        var parts = [];
                        row['parts'].split(",").forEach(function(part){
                            parts.push(partsDecoder[part]);
                        })
                        row['parts'] = parts.join(", ");
                        obj.push(row);
                    })
                    res.end(JSON.stringify({'data': obj}));
                }
            });
        }
    });
}
exports.partData= function(req, res){
    var param = req.body;
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-TypeData_connection]Error DB: ' + err));
            res.end(JSON.stringify({err: err}));
        } else {
            var select = "SELECT * FROM partData";
            connection.query(select, function (err, result) {
                if (err) {
                    console.error(JSON.stringify('[MISP-TypeData-select]SQL : ' + select));
                    console.error(JSON.stringify('[MISP-TypeData-select]Error : ' + err));
                    res.end(JSON.stringify({'err': err}));
                } else {
                    connection.release();
                    var obj = {labels :[], values:[]};
                    result.forEach(function(row){
                        var label = row['label']
                        if(partsDecoder[row['label']]){label = partsDecoder[row['label']];}
                        obj['labels'].push(label);
                        obj['values'].push(row['count']);
                    })
                    res.end(JSON.stringify({'data': obj}));
                }
            });
        }
    });
}
exports.productYear= function(req, res){
    var param = req.body;
    var vendor = param['vendor'];
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-productYear_connection]Error DB: ' + err));
            res.end(JSON.stringify({err: err}));
        } else {
            var andVendor = '';
            if(vendor){
                andVendor =  "AND cpe.vendor = '"+vendor+"' ";
            }
            var select = "SELECT YEAR(published.value) as year, count(*) as count FROM objects "+
                        "JOIN attributes AS published ON (published.object_id = objects.object_id AND published.object_relation = 'published') "+
                        "LEFT JOIN attributes AS vuln ON (vuln.object_id = objects.object_id AND vuln.object_relation = 'vulnerable_configuration') "+
                        "JOIN cpe ON cpe.attributes_id = vuln.attributes_id "+ andVendor + " "+
                        "WHERE 1=1 GROUP BY 1 ORDER BY 1 ASC";
            connection.query(select, function (err, result) {
                if (err) {
                    console.error(JSON.stringify('[MISP-productYear-select]SQL : ' + select));
                    console.error(JSON.stringify('[MISP-productYear-select]Error : ' + err));
                    res.end(JSON.stringify({'err': err}));
                } else {
                    connection.release();
                    var obj = {labels :[], values:[]};
                    result.forEach(function(row){
                        obj['labels'].push(row['year']);
                        obj['values'].push(row['count']);
                    })
                    res.end(JSON.stringify({'data': obj}));
                }
            });
        }
    });
}
exports.productPart= function(req, res){
    var param = req.body;
    var vendor = param['vendor'];
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-productYear_connection]Error DB: ' + err));
            res.end(JSON.stringify({err: err}));
        } else {
            var andVendor = '';
            if(vendor){
                andVendor =  "AND cpe.vendor = '"+vendor+"' ";
            }
            var select = "SELECT DISTINCT(part) label, count(*) as count FROM cpe WHERE 1=1 "+ andVendor + " GROUP BY 1 ORDER BY 2 DESC";
            connection.query(select, function (err, result) {
                if (err) {
                    console.error(JSON.stringify('[MISP-productYear-select]SQL : ' + select));
                    console.error(JSON.stringify('[MISP-productYear-select]Error : ' + err));
                    res.end(JSON.stringify({'err': err}));
                } else {
                    connection.release();
                    var obj = {labels :[], values:[]};
                    result.forEach(function(row){
                        obj['labels'].push(partsDecoder[row['label']]);
                        obj['values'].push(row['count']);
                    })
                    res.end(JSON.stringify({'data': obj}));
                }
            });
        }
    });
}
exports.productCvss= function(req, res){
    var param = req.body;
    var vendor = param['vendor'];
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-productcvss_connection]Error DB: ' + err));
            res.end(JSON.stringify({err: err}));
        } else {
            var andVendor = '';
            if(vendor){
                andVendor =  "AND cpe.vendor = '"+vendor+"' ";
            }
            var select = "SELECT YEAR(published.value) as year, avg(cvss_score.value) as avg FROM objects "+
                "JOIN attributes AS published ON (published.object_id = objects.object_id AND published.object_relation = 'published') " +
                "LEFT JOIN attributes AS cvss_score ON (cvss_score.object_id = objects.object_id AND cvss_score.object_relation = 'cvss-score') "+
                "LEFT JOIN attributes AS vuln ON (vuln.object_id = objects.object_id AND vuln.object_relation = 'vulnerable_configuration') "+
                "JOIN cpe ON cpe.attributes_id = vuln.attributes_id "+ andVendor + " "+
                "WHERE 1=1 GROUP BY 1 ORDER BY 1 ASC";
            connection.query(select, function (err, result) {
                if (err) {
                    console.error(JSON.stringify('[MISP-productcvss-select]SQL : ' + select));
                    console.error(JSON.stringify('[MISP-productcvss-select]Error : ' + err));
                    res.end(JSON.stringify({'err': err}));
                } else {
                    connection.release();
                    var obj = {labels :[], values:[]};
                    result.forEach(function(row){
                        obj['labels'].push(row['year']);
                        obj['values'].push(row['avg']);
                    })
                    res.end(JSON.stringify({'data': obj}));
                }
            });
        }
    });
}

exports.cves = function(start, lenght, orderBy, search, cb){
    if(!orderBy){
        orderBy = " ORDER BY event_id DESC ";
    }
    var searchLike = "";
    if(search){
        searchLike = "AND (info LIKE '%"+search+"%' OR cvss_score_value LIKE '%"+search+"%' OR published_value LIKE '%"+search+"%'  OR credit_value LIKE '%"+search+"%' ) ";
    }

    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-cves_connection]Error DB: ' + err));
            cb({err: err});
        } else {
            var select = "SELECT *, (SELECT COUNT(*) FROM synthesys WHERE 1=1 "+searchLike+ " ) as total  FROM synthesys " +
                "WHERE 1=1 " + searchLike + " "+
                orderBy +" "+
                "LIMIT "+start+", "+ lenght + " ";
            connection.query(select, function (err, result) {
                connection.release();
                if (err) {
                    console.error(JSON.stringify('[MISP-cves-select]SQL : ' + select));
                    console.error(JSON.stringify('[MISP-cves-select]Error : ' + err));
                    cb({err: err});
                } else {
                    var res = [];
                    result.forEach(function(row){
                        res.push(row);
                    });
                    cb(res);
                }
            });
        }
    });
}
function executeQueryAggregate(connection, queryList, res, cb){
    if(!queryList.length){
        cb(res);
    }else{
        var query = queryList.shift();
        connection.query(query['select'], function (err, result) {
            if (err) {
                console.error(JSON.stringify('[MISP-executeQuery]SQL : ' + query['select']));
                console.error(JSON.stringify('[MISP-executeQuery]Error : ' + err));
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
function executeQueryLast(connection, queryList, res, cb){
    if(!queryList.length){
        cb(res);
    }else{
        var query = queryList.shift();
        connection.query(res[query], function (err, result) {
            if (err) {
                console.error(JSON.stringify('[MISP-executeQueryLast]SQL : ' + res[query]));
                console.error(JSON.stringify('[MISP-executeQueryLast]Error : ' + err));
                cb({'err': err});
            } else {
                res[query]= result[0]['count'];
                executeQueryLast(connection, queryList, res, cb);
            }
        });
    }
}
function eventListAttributes(connection, attributes, object_id, response, event_id, cb){
    if(!attributes.length){
        cb(response);
    }else{
        var attribute = attributes.shift();
        var select = "SELECT attributes.value as value "+
            "FROM attributes WHERE attributes.object_id IN ("+object_id.join(",")+") AND object_relation = '"+attribute+"' limit 7 ";

        connection.query(select, function (err, result) {
            if (err) {
                console.error(JSON.stringify('[MISP-eventListAttributes]SQL : ' + select));
                console.error(JSON.stringify('[MISP-eventListAttributes]Error : ' + err));
                eventListAttributes(connection, attributes, object_id, response, event_id, cb);
            } else {
                response[attribute] = [];
                result.forEach(function(row){
                    response[attribute].push(row['value']);
                });
                eventListAttributes(connection, attributes, object_id, response, event_id, cb);
            }
        });
    }
}

//Exploits
exports.exploitsHist = function(req, res) {
    var param = req.body;
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-exploitsHist_connection]Error DB: ' + err));
            cb({err: err});
        } else {
            var select;
            if(!param['year']){
                select = "SELECT year as time,  SUM(count) as count  FROM exploits GROUP BY 1 ORDER BY 1 DESC "
            }else{
                select = "SELECT month as time, month_text as month, SUM(count) as count FROM exploits  WHERE 1=1 AND year = "+param['year'] +"  GROUP BY 1,2 ORDER BY 1 DESC";
            }
            connection.query(select, function (err, result) {
                if (err) {
                    console.error(JSON.stringify('[MISP-exploitsHist-select]SQL : ' + select));
                    console.error(JSON.stringify('[MISP-exploitsHist-select]Error : ' + err));
                    res.end(JSON.stringify({'err': err}));
                } else {
                    connection.release();
                    res.end(JSON.stringify({'data': result}));
                }
            });
        }
    });
};

//SingleEventData
function singleEventObj(connection, event_id, cb){
    var select = "SELECT * FROM objects WHERE objects.event_id = "+event_id+"; ";
    connection.query(select, function (err, result) {
        if (err) {
            console.error(JSON.stringify('[MISP-singleEventData-select]SQL : ' + select));
            console.error(JSON.stringify('[MISP-singleEventData-select]Error : ' + err));
            cb({'err': err});
        } else {
            var objId = [];
            result.forEach(function(row){
                objId.push(row['object_id']);
            })
            cb(objId);
        }
    });

}
function singleEventData(connection,event_id, object_id, dataList, response, cb){
    if(!dataList.length){
        cb(response);
    }else{
        var dataEntry = dataList.shift();
        var select = "SELECT attributes.* FROM  attributes WHERE attributes.object_relation = '"+dataEntry+"' AND attributes.object_id IN ("+object_id.join(",")+") LIMIT 1 ;";
        connection.query(select, function (err, result) {
            if (err) {
                console.error(JSON.stringify('[MISP-singleEventData-select]SQL : ' + select));
                console.error(JSON.stringify('[MISP-singleEventData-select]Error : ' + err));
                cb({'err': err});
            } else {
                response[dataEntry] = "";
                if(result.length > 0){
                    response[dataEntry] = result[0]['value'];
                }

                singleEventData(connection, event_id, object_id, dataList, response, cb);
            }
        });

    }
}