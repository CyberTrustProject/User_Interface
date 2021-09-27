var request     = require('request');
var mysql       = require('mysql');
const csv       = require('csv-parser');
var {PythonShell} = require('python-shell');
var DATACOMMON = require('./DataCommon');

var dataPool = DATACOMMON.dataPoolVuln;
var pool  = mysql.createPool(dataPool);

var partsDecoder = {'a' : 'Application', 'h': 'Hardware', 'o': 'Operating System'};
exports.cves = function(start, lenght, cb){
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-cves_connection]Error DB: ' + err));
            cb({err: err});
        } else {
            var select = "SELECT events.event_id, objects.object_id, " +
                "   DATE_FORMAT(published.value, '%Y-%m-%d %H:%i') AS PublicationDatetime, "+
                "   cvss_score.value AS CVSSscore, "+
                "   credit.value AS CreditSource, "+
                "   vulnerable_configuration.value AS CreditSource, "+
                "   credit.value AS VulnerableConfigurations, "+
                "   description.value AS Description, "+
                "   modified.value AS Modified, "+
                "   cvss-string.value AS CVSSstring, "+
                "   (SELECT COUNT(*) FROM events JOIN  objects ON (objects.name = 'vulnerability' AND objects.event_id = events.event_id)) as total "+
                "FROM events "+
                "   LEFT JOIN objects ON objects.event_id = events.event_id "+
                "   LEFT OUTER JOIN attributes AS published ON (published.object_id = objects.object_id AND published.object_relation = 'published') "+
                "   LEFT OUTER JOIN attributes AS cvss_score ON (cvss_score.object_id = objects.object_id AND cvss_score.object_relation = 'cvss-score') "+
                "   LEFT OUTER JOIN attributes AS credit ON (credit.object_id = objects.object_id AND credit.object_relation = 'credit') "+
                "   LEFT OUTER JOIN attributes AS vulnerable_configuration ON (vulnerable_configuration.object_id = objects.object_id AND vulnerable_configuration.object_relation = 'vulnerable_configuration') "+
                "   LEFT OUTER JOIN attributes AS description ON (description.object_id = objects.object_id AND description.object_relation = 'description ') "+
                "   LEFT OUTER JOIN attributes AS modified ON (modified.object_id = objects.object_id AND modified.object_relation = 'modified') "+
                "   LEFT OUTER JOIN attributes AS cvss_string ON (cvss_string.object_id = objects.object_id AND cvss_string.object_relation = 'cvss-string') "+
                "WHERE objects.name = 'vulnerability' "+
                "ORDER BY 2 DESC "+
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
exports.singleEvent = function(event_id, cb){
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-singleEvent_connection]Error DB: ' + err));
            cb({err: err});
        } else {
            var select = "SELECT events.event_id, objects.object_id, " +
                "   DATE_FORMAT(published.value, '%Y-%m-%d %H:%i') AS PublicationDatetime, "+
                "   identifier.value AS CVSSID, "+
                "   cvss_score.value AS CVSSscore, "+
                "   credit.value AS CreditSource, "+
                "   vulnerable_configuration.value AS VulnerableConfigurations, "+
                "   description.value AS Description, "+
                "   modified.value AS Modified, "+
                "   cvss_string.value AS CVSSstring "+
                "FROM events "+
                "   LEFT JOIN objects ON objects.event_id = events.event_id "+
                "   LEFT OUTER JOIN attributes AS identifier ON (identifier.object_id = objects.object_id AND identifier.object_relation = 'id') "+
                "   LEFT OUTER JOIN attributes AS published ON (published.object_id = objects.object_id AND published.object_relation = 'published') "+
                "   LEFT OUTER JOIN attributes AS cvss_score ON (cvss_score.object_id = objects.object_id AND cvss_score.object_relation = 'cvss-score') "+
                "   LEFT OUTER JOIN attributes AS credit ON (credit.object_id = objects.object_id AND credit.object_relation = 'credit') "+
                "   LEFT OUTER JOIN attributes AS vulnerable_configuration ON (vulnerable_configuration.object_id = objects.object_id AND vulnerable_configuration.object_relation = 'vulnerable_configuration') "+
                "   LEFT OUTER JOIN attributes AS description ON (description.object_id = objects.object_id AND description.object_relation = 'description ') "+
                "   LEFT OUTER JOIN attributes AS modified ON (modified.object_id = objects.object_id AND modified.object_relation = 'modified') "+
                "   LEFT OUTER JOIN attributes AS cvss_string ON (cvss_string.object_id = objects.object_id AND cvss_string.object_relation = 'cvss-string') "+
                "WHERE 1=1" +
                "   AND events.event_id = " + event_id +" ";
            connection.query(select, function (err, result) {
                if (err) {
                    connection.release();
                    console.error(JSON.stringify('[MISP-cves-select]SQL : ' + select));
                    console.error(JSON.stringify('[MISP-cves-select]Error : ' + err));
                    cb({err: err});
                } else {
                    eventListAttributes(connection, ['references', 'vulnerable_configuration'], result[0], event_id, function(result){
                        connection.release();
                        cb(result);
                    });

                }
            });
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
                select = "SELECT DATE_FORMAT(attributes.value, '%Y') as time, count(*) as count FROM events LEFT JOIN objects ON objects.event_id = events.event_id LEFT OUTER JOIN attributes ON (attributes.object_id = objects.object_id  AND attributes.object_relation = 'published' AND DATE_FORMAT(attributes.value, '%Y') >= 2000) WHERE 1 = 1 AND attributes.value IS NOT NULL GROUP BY 1 ORDER BY 1 DESC";
            }else if(param['option']['time'] ==2){
                select = "SELECT DATE_FORMAT(attributes.value, '%m') as time, DATE_FORMAT(attributes.value, '%b') as month, count(*) as count FROM events LEFT JOIN objects ON objects.event_id = events.event_id LEFT OUTER JOIN attributes ON (attributes.object_id = objects.object_id AND attributes.object_relation = 'published' AND attributes.object_relation = 'published' AND DATE_FORMAT(attributes.value, '%Y') >= 2000) WHERE 1 = 1 AND attributes.value IS NOT NULL AND DATE_FORMAT(attributes.value, '%Y') = "+param['option']['year'] +" GROUP BY 1,2 ";
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
            var queryList = [];
            labels.forEach(function(label){
                var select ="SELECT DISTINCT(metrics."+label+") as type, ";
                    select+="COUNT(metrics.metrics_id) as count ";
                    select+="FROM events LEFT JOIN objects ON objects.event_id = events.event_id LEFT OUTER JOIN attributes as pub ON (pub.object_id = objects.object_id and pub.object_relation = 'published') ";
                    select+="LEFT OUTER JOIN metrics ON (metrics.event_id = events.event_id ) ";
                if(param['year']){
                        select+="WHERE DATE_FORMAT(pub.value, '%Y') = " + param['year'] + " ";
                    }
                    select+="GROUP BY 1 ";
                    select+="HAVING type NOT LIKE 'null' ";
                var obj = {
                    'label': label,
                    'select': select
                }
                queryList.push(obj);
            });
            executeQueryAggregate(connection, queryList, {}, function(data){
                connection.release();
                if(data.err){
                    res.end(JSON.stringify({'err': data.err}));
                }else{
                    res.end(JSON.stringify({'data': data}));
                }
            })
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
            var select = {
                //Published
                "published_day":            "SELECT COUNT(object_id) FROM attributes WHERE object_relation = 'published' AND DATE_FORMAT(value, '%Y-%m-%d') = NOW() ",
                "published_week":           "SELECT COUNT(object_id) FROM attributes WHERE object_relation = 'published' AND DATE_FORMAT(value, '%Y-%m-%d') > (DATE_SUB(CURDATE(), INTERVAL 1 WEEK))",
                "published_month":          "SELECT COUNT(object_id) FROM attributes WHERE object_relation = 'published' AND DATE_FORMAT(value, '%Y-%m-%d') > (DATE_SUB(CURDATE(), INTERVAL 1 MONTH))",
                "published_previous_month": "SELECT COUNT(object_id) FROM attributes WHERE object_relation = 'published' AND DATE_FORMAT(value, '%Y-%m-%d') > (DATE_SUB(CURDATE(), INTERVAL 2 MONTH)) AND DATE_FORMAT(value, '%Y-%m-%d') < (DATE_SUB(CURDATE(), INTERVAL 1 MONTH))",
                "published_year":           "SELECT COUNT(object_id) FROM attributes WHERE object_relation = 'published' AND DATE_FORMAT(value, '%Y') = YEAR(NOW())",
                "published_previous_year":  "SELECT COUNT(object_id) FROM attributes WHERE object_relation = 'published' AND DATE_FORMAT(value, '%Y') = (YEAR(NOW()) -1)",
                //Modified
                "modified_day":             "SELECT COUNT(object_id) FROM attributes WHERE object_relation = 'modified' AND DATE_FORMAT(value, '%Y-%m-%d') = NOW() ",
                "modified_week":            "SELECT COUNT(object_id) FROM attributes WHERE object_relation = 'modified' AND DATE_FORMAT(value, '%Y-%m-%d') > (DATE_SUB(CURDATE(), INTERVAL 1 WEEK))",
                "modified_month":           "SELECT COUNT(object_id) FROM attributes WHERE object_relation = 'modified' AND DATE_FORMAT(value, '%Y-%m-%d') > (DATE_SUB(CURDATE(), INTERVAL 1 MONTH))",
                "modified_previous_month":  "SELECT COUNT(object_id) FROM attributes WHERE object_relation = 'modified' AND DATE_FORMAT(value, '%Y-%m-%d') > (DATE_SUB(CURDATE(), INTERVAL 2 MONTH)) AND DATE_FORMAT(value, '%Y-%m-%d') < (DATE_SUB(CURDATE(), INTERVAL 1 MONTH))",
                "modified_year":            "SELECT COUNT(object_id) FROM attributes WHERE object_relation = 'modified' AND DATE_FORMAT(value, '%Y') = YEAR(NOW())",
                "modified_previous_year":   "SELECT COUNT(object_id) FROM attributes WHERE object_relation = 'modified' AND DATE_FORMAT(value, '%Y') = (YEAR(NOW()) -1)",
            };
            executeQueryLast(connection, Object.keys(select), select, function (data) {
                connection.release();
                if(data.err){
                    res.end(JSON.stringify({'err': data.err}));
                }else{
                    res.end(JSON.stringify({'data': data}));
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
            var select = {
                //Total
                "count_tot":        "SELECT  COUNT(object_id) AS count FROM attributes  WHERE 1=1 "+where + " ",
                "count_modified":   "SELECT  COUNT(object_id) AS count FROM attributes  WHERE 1=1 AND object_relation = 'modified' "+where + " ",
                "count_published":  "SELECT  COUNT(object_id) AS count FROM attributes  WHERE 1=1 AND object_relation = 'published' "+where + " ",
                "count_score":      "SELECT COUNT(*) AS count FROM attributes   WHERE 1=1  AND object_relation = 'cvss-score'  "+where + " ",
                "count_attrs":      "SELECT 1000 " //sum(events.attribute_count) as count FROM events LEFT JOIN objects ON objects.event_id = events.event_id LEFT OUTER JOIN attributes as modified ON (modified.object_id = objects.object_id and modified.object_relation = 'modified'  AND DATE_FORMAT(modified.value, '%Y') >= 2000)  WHERE 1=1 "+where + " "
            };
            executeQueryLast(connection, Object.keys(select), select, function (data) {
                connection.release();
                if(data.err){
                    res.end(JSON.stringify({'err': data.err}));
                }else{
                    res.end(JSON.stringify({'data': data}));
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
                "SELECT DISTINCT "+
                "   YEAR(DATE_FORMAT(pub.value, '%Y-%m-%d')) AS Year, "+
                "   SUM(CASE WHEN score.value < 4 	THEN 1 ELSE 0 END) AS v2Low, "+
                "   SUM(CASE WHEN score.value >= 4 	AND score.value < 7  THEN 1 ELSE 0 END) AS v2Medium, "+
                "   SUM(CASE WHEN score.value >= 7 	THEN 1 ELSE 0 END) AS v2High, "+
                "   SUM(CASE WHEN score.value = 0 	THEN 1 ELSE 0 END) AS v3None, "+
                "   SUM(CASE WHEN score.value > 0 	AND score.value < 4 THEN 1 ELSE 0 END) AS v3Low, "+
                "   SUM(CASE WHEN score.value >= 4 	AND score.value < 7 THEN 1 ELSE 0 END) AS v3Medium, "+
                "   SUM(CASE WHEN score.value >= 7 	AND score.value < 9 THEN 1 ELSE 0 END) AS v3High, "+
                "   SUM(CASE WHEN score.value >= 9 	THEN 1 ELSE 0 END) AS v3Critical "+
                "FROM events "+
                "   LEFT JOIN objects ON objects.event_id = events.event_id "+
                "   LEFT OUTER JOIN attributes as pub ON (pub.object_id = objects.object_id and pub.object_relation = 'published') "+
                "   LEFT OUTER JOIN attributes as score ON (score.object_id = objects.object_id and score.object_relation = 'cvss-score') "+
                "WHERE 1 = 1 "+ where + " "+
                "GROUP BY 1 "+
                "HAVING Year != 'null'";
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
            var select = "SELECT DISTINCT "+
                "   YEAR(DATE_FORMAT(pub.value, '%Y-%m-%d')) AS Year, "+
                "   SUM(CASE WHEN score.value < 4 	THEN 1 ELSE 0 END) AS v2Low, "+
                "   SUM(CASE WHEN score.value >= 4 	AND score.value < 7  THEN 1 ELSE 0 END) AS v2Medium, "+
                "   SUM(CASE WHEN score.value >= 7 	THEN 1 ELSE 0 END) AS v2High, "+
                "   SUM(CASE WHEN score.value = 0 	THEN 1 ELSE 0 END) AS v3None, "+
                "   SUM(CASE WHEN score.value > 0 	AND score.value < 4 THEN 1 ELSE 0 END) AS v3Low, "+
                "   SUM(CASE WHEN score.value >= 4 	AND score.value < 7 THEN 1 ELSE 0 END) AS v3Medium, "+
                "   SUM(CASE WHEN score.value >= 7 	AND score.value < 9 THEN 1 ELSE 0 END) AS v3High, "+
                "   SUM(CASE WHEN score.value >= 9 	THEN 1 ELSE 0 END) AS v3Critical "+
                "FROM events "+
                "   LEFT JOIN objects ON objects.event_id = events.event_id "+
                "   LEFT OUTER JOIN attributes as pub ON (pub.object_id = objects.object_id and pub.object_relation = 'published') "+
                "   LEFT OUTER JOIN attributes as score ON (score.object_id = objects.object_id and score.object_relation = 'cvss-score') "+
                "WHERE 1 = 1 "+ where + " "+
                "GROUP BY 1 "+
                "HAVING Year != 'null'";
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
            var select = "SELECT vendor as label, count(*) as value FROM cpe GROUP BY 1 ORDER BY 2 DESC LIMIT 10;";
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
            var select = "SELECT part as label, count(*) as value FROM cpe GROUP BY 1 ORDER BY 2 DESC LIMIT 10;";
            connection.query(select, function (err, result) {
                if (err) {
                    console.error(JSON.stringify('[MISP-TypeData-select]SQL : ' + select));
                    console.error(JSON.stringify('[MISP-TypeData-select]Error : ' + err));
                    res.end(JSON.stringify({'err': err}));
                } else {
                    connection.release();
                    var obj = {labels :[], values:[]};
                    result.forEach(function(row){
                        obj['labels'].push(partsDecoder[row['label']]);
                        obj['values'].push(row['value']);
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

exports.cves = function(start, lenght, cb){
    pool.getConnection(function(err, connection) {
        if (err) {
            console.error(JSON.stringify('[MISP-cves_connection]Error DB: ' + err));
            cb({err: err});
        } else {
            var select = "SELECT events.event_id, objects.object_id, " +
                "   DATE_FORMAT(published.value, '%Y-%m-%d %H:%i') AS PublicationDatetime, "+
                "   cvss_score.value AS CVSSscore, "+
                "   credit.value AS CreditSource, "+
                "   description.value AS Description, "+
                "   modified.value AS Modified, "+
                "   cvss_string.value AS CVSSstring, "+
                "   (SELECT COUNT(*) FROM events JOIN  objects ON (objects.name = 'vulnerability' AND objects.event_id = events.event_id)) as total "+
                "FROM events "+
                "   LEFT JOIN objects ON objects.event_id = events.event_id "+
                "   LEFT OUTER JOIN attributes AS published ON (published.object_id = objects.object_id AND published.object_relation = 'published') "+
                "   LEFT OUTER JOIN attributes AS cvss_score ON (cvss_score.object_id = objects.object_id AND cvss_score.object_relation = 'cvss-score') "+
                "   LEFT OUTER JOIN attributes AS credit ON (credit.object_id = objects.object_id AND credit.object_relation = 'credit') "+
                "   LEFT OUTER JOIN attributes AS vulnerable_configuration ON (vulnerable_configuration.object_id = objects.object_id AND vulnerable_configuration.object_relation = 'vulnerable_configuration') "+
                "   LEFT OUTER JOIN attributes AS description ON (description.object_id = objects.object_id AND description.object_relation = 'description ') "+
                "   LEFT OUTER JOIN attributes AS modified ON (modified.object_id = objects.object_id AND modified.object_relation = 'modified') "+
                "   LEFT OUTER JOIN attributes AS cvss_string ON (cvss_string.object_id = objects.object_id AND cvss_string.object_relation = 'cvss-string') "+
                "WHERE objects.name = 'vulnerability' "+
                "ORDER BY 2 DESC "+
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
function eventListAttributes(connection, attributes, response, event_id, cb){
    if(!attributes.length){
        cb(response);
    }else{
        var attribute = attributes.shift();
        var select = "SELECT attributes.value as value "+
            "FROM events "+
            "   LEFT JOIN objects ON objects.event_id = events.event_id "+
            "   LEFT OUTER JOIN attributes ON (attributes.object_id = objects.object_id) "+
            "WHERE 1 = 1 AND events.event_id = "+event_id+" AND object_relation = '"+attribute+"' ";
        connection.query(select, function (err, result) {
            if (err) {
                console.error(JSON.stringify('[MISP-eventListAttributes]SQL : ' + select));
                console.error(JSON.stringify('[MISP-eventListAttributes]Error : ' + err));
                eventListAttributes(connection, attributes, response, event_id, cb);
            } else {
                response[attribute] = [];
                result.forEach(function(row){
                    response[attribute].push(row['value']);
                });
                eventListAttributes(connection, attributes, response, event_id, cb);
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
                select = "SELECT DATE_FORMAT(FROM_UNIXTIME(objects.timestamp), '%Y') as time,  count(*) as count  FROM events LEFT JOIN objects ON (objects.event_id = events.event_id AND objects.name = 'expdb-poc') WHERE 1=1 AND objects.timestamp IS NOT NULL  GROUP BY 1 ORDER BY 1 DESC "
            }else{
                select = "SELECT DATE_FORMAT(FROM_UNIXTIME(objects.timestamp), '%m') as time, DATE_FORMAT(FROM_UNIXTIME(objects.timestamp), '%b') as month, count(*) as count FROM events LEFT JOIN objects ON (objects.event_id = events.event_id AND objects.name = 'expdb-poc') WHERE 1=1 AND DATE_FORMAT(FROM_UNIXTIME(objects.timestamp), '%Y') = "+param['year'] +" AND objects.timestamp IS NOT NULL  GROUP BY 1,2 ORDER BY 1 DESC";
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