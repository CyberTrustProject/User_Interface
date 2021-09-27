//Simone Naldini 20200407//
var request = require('request');

var mem = {};
var connection_opt = {
    Auth    : "http://172.16.4.17:5000",
    PS      : "http://172.16.4.43"
}
var impactMap = {
    1 : 'Negligible',
    2 : 'Minor',
    3 : 'Normal',
    4 : 'Severe',
    5 : 'Catastrophic'
}

var $NODE = {
    "name": "CyberTrust",
    "children": []
}
var $PARENT = {
    "name": "CyberTrust",
    "source" : true,
    "children": [
        {
            name : "192.168.0XX.XXX",
            "children" : [
                {
                    name : "192.168.0XX.0XX",
                    "children" : []
                },
                {
                    name : "192.168.0XX.1XX",
                    "children" : []
                },
                {
                    name : "192.168.0XX.2XX",
                    "children" : []
                },
            ]
        },
        {
            name : "192.168.1XX.XXX",
            "children" : [
                {
                    name : "192.168.1XX.0XX",
                    "children" : []
                },
                {
                    name : "192.168.1XX.1XX",
                    "children" : []
                },
                {
                    name : "192.168.1XX.2XX",
                    "children" : []
                },
            ]
        },
        {
            name : "192.168.2XX.XXX",
            "children" : [
                {
                    name : "192.168.2XX.0XX",
                    "children" : []
                },
                {
                    name : "192.168.2XX.1XX",
                    "children" : []
                },
                {
                    name : "192.168.2XX.2XX",
                    "children" : []
                },
            ]
        }
    ]
};


exports.OAuthLogin = function (req, res) {
    var param = req.body;
    if(param['username'] && param['password']){
        tokenRequest(param['username'], param['password'], function(data){
            if(data['err']){
                res.end(JSON.stringify({err: data['err']}));
            }else{
                res.end(JSON.stringify({data: data}));
            }
        })
    }else{
        res.end(JSON.stringify({err: "Missing data"}));
    }
};

function tokenRequest(username, password, cb){
    var dummy = dummyCredentials(username);
    if(dummy){
        cb(dummy);
    }else{
        var options = {
            'method': 'POST',
            'url': connection_opt['Auth']+'/connect/token',
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
                'grant_type'    : 'password',
                'client_id'     : 'ui',
                'client_secret' : 'CtUI1234',
                'scope'         : 'openid profile ct.profile',
                'username'      : username,
                'password'      : password
            }
        };
        request(options, function (error, response) {
            if (error) throw new Error(error);
            if(JSON.parse(response['body'])['error']){
                var errMsg = JSON.parse(response['body'])['error'];
                if(JSON.parse(response['body'])['error'] == "invalid_grant"){
                    errMsg = "Username or password invalid. Please check your credentials"
                }
                cb({err:errMsg});
            }else{
                var token = JSON.parse(response.body)['access_token'];
                userInfoRequest(token, username, function(data){
                    if(data['err']){
                        cb({err:data['err']});
                    }else{
                        data['token'] = token;
                        cb(data);
                    }
                })
            }
        });
    }

}
function userInfoRequest(token, username, cb){
    var filter = {
        "entity": "cybertrust.user",
        "keys": ["username"], "values": [username]
    };
    var options = {
        'method': 'POST',
        'url': connection_opt['PS']+'/search/?',
        'headers': {
            'Content-Type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer '+token
        },
        'body': JSON.stringify(filter)
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200 ) {
            if (JSON.parse(body)['data'][0]) {
                cb((JSON.parse(body)['data'][0]));
            }else{
                cb(JSON.stringify({err: 'User not find'}));
            }
        }else{
            cb(JSON.stringify({err: error}));
        }
    });
}
//Users
exports.getUserList= function(req, res) {
    var param = req.body;
    var start = param['start']/10||0  ;
    var token = param['token'] || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjA4NTMzNmFmZTY0Yzg2ZWQ3NDU5YzE5YzQ4ZjQzNzI3IiwidHlwIjoiSldUIn0.eyJuYmYiOjE1ODYzMzUyNjksImV4cCI6MTU4NjMzODg2OSwiaXNzIjoiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAiLCJhdWQiOlsiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAvcmVzb3VyY2VzIiwicHJvZmlsaW5nIl0sImNsaWVudF9pZCI6InVpIiwic3ViIjoiMTI4IiwiYXV0aF90aW1lIjoxNTg2MzM1MjY5LCJpZHAiOiJsb2NhbCIsInNjb3BlIjpbImN0LnByb2ZpbGUiXSwiYW1yIjpbInB3ZCJdfQ.R2DVON-jTv8ItoDbUnhv35pxfJNjt9XcmMGX2OeB3IRFJ6jq_Jdm1xGOqyt940G4z5W9nae2TROF8CbsoM0Ied_J33uiCSWxHUzAAaNTtzQvdPM4Ns22QlA4qLUSajr8TkLT0l03gl00rsMjaC5Iy-OjJINQw45INSqlE0Z1loBaz8wrLftecWo4l_rbigPlQkXKHjiHL-rAkWzTAmLPGYM6tzNxQ23AVEb_oTSqb0DhKXhlqLEswXQGDB1m1vCnsPEmAyz8TskhHh1ECoxxcw6iWrd3i5bnwfcQmg1C_35vgPWozgggdcoU5RvFjf36rMZ3bMTqaj156wYdEsXDPg';
    var length = 10;
    if(param['search'] && param['search']['value']){
        //To complete
    }
    var filter = {
        "entity": "cybertrust.user",
        "keys": ["roles"], "values": ["ADMIN", "ISP", "LEA"]
        //"keys": ["roles"], "values": ["OWNER"]
    };
    if(param['_id']){
        filter['keys'] =  ["_id"];
        filter['values'] = [param['_id'], param['_id']];
    }
    var options = {
        'method': 'POST',
        'url': connection_opt['PS']+'/search/?page='+start+'&pageSize='+length,
        'headers': {
            'Content-Type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer '+token
        },
        'body': JSON.stringify(filter)
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            var box = {};
            var ret = [];
            data['data'].forEach(function (user, pos){
                box[user['_id']] = user;
                ret.push(user);
            });
            mem['users'] = box;
            var total =data['paging']['total'];
            res.end(JSON.stringify({data: ret, recordsTotal: total, recordsFiltered: total}));
        }else{
            res.end(JSON.stringify({err: error}));
        }
    });
}
exports.getHoList= function(req, res) {
    var param = req.body;
    var start = param['start']/10||0  ;
    var token = param['token'] || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjA4NTMzNmFmZTY0Yzg2ZWQ3NDU5YzE5YzQ4ZjQzNzI3IiwidHlwIjoiSldUIn0.eyJuYmYiOjE1ODYzMzUyNjksImV4cCI6MTU4NjMzODg2OSwiaXNzIjoiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAiLCJhdWQiOlsiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAvcmVzb3VyY2VzIiwicHJvZmlsaW5nIl0sImNsaWVudF9pZCI6InVpIiwic3ViIjoiMTI4IiwiYXV0aF90aW1lIjoxNTg2MzM1MjY5LCJpZHAiOiJsb2NhbCIsInNjb3BlIjpbImN0LnByb2ZpbGUiXSwiYW1yIjpbInB3ZCJdfQ.R2DVON-jTv8ItoDbUnhv35pxfJNjt9XcmMGX2OeB3IRFJ6jq_Jdm1xGOqyt940G4z5W9nae2TROF8CbsoM0Ied_J33uiCSWxHUzAAaNTtzQvdPM4Ns22QlA4qLUSajr8TkLT0l03gl00rsMjaC5Iy-OjJINQw45INSqlE0Z1loBaz8wrLftecWo4l_rbigPlQkXKHjiHL-rAkWzTAmLPGYM6tzNxQ23AVEb_oTSqb0DhKXhlqLEswXQGDB1m1vCnsPEmAyz8TskhHh1ECoxxcw6iWrd3i5bnwfcQmg1C_35vgPWozgggdcoU5RvFjf36rMZ3bMTqaj156wYdEsXDPg';
    var length = 10;
    var filter = {
        "entity": "cybertrust.user",
        "keys": ["roles"], "values": ['OWNER']
    };
    if(param['_id']){
        filter['keys'] =  ["_id"];
        filter['values'] = [param['_id'], param['_id']];
    }
    var options = {
        'method': 'POST',
        'url': connection_opt['PS']+'/search/?page='+start+'&pageSize='+length,
        'headers': {
            'Content-Type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer '+token
        },
        'body': JSON.stringify(filter)
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            var ret = [];
            if(data['data'].length){
                data['data'].forEach(function (user, pos){
                    ret.push(user);
                });
            }
            var total =data['paging']['total'];
            res.end(JSON.stringify({data: ret, recordsTotal: total, recordsFiltered: total}));
        }else{
            res.end(JSON.stringify({err: error}));
        }
    });
}
exports.addUser= function(req, res) {
    var param = req.body;
    var dataSet = {
        "firstname":    param['user_firstname'],
        "lastname":     param['user_lastname'],
        "dateofbirth":  param['user_dateofbirth'],
        "deleted":      false,
        "email":        param['user_email'],
        "gender":       "Male",
        "roles":        [rolesConverter(param['user_roles'])],
        "devices":      [],
        "telephone":    param['user_telephone'],
        //"timestamp":    new Date().toISOString(),
        "username":     param['user_username'],
        "password":     param['user_password']
    };
    request({
        url: connection_opt['PS']+'/user/',
        method: 'POST',
        json: dataSet,
        'headers': {
            'Content-Type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer '+param['token']
        }
    }, function (error, response, body) {
        if (!error && response.statusCode === 201) {
            res.end(JSON.stringify({res: body}));
        }else {
            res.end(JSON.stringify({err: body}));
        }
    });
};
exports.deleteUser= function(req, res) {
    var param = req.body;
    request({
        url: connection_opt['PS']+'/user/'+param['_id'],
        method: 'DELETE',
        'headers': {
            'Content-Type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer '+param['token']
        }
    }, function (error, response, body) {
        if (!error && response.statusCode === 201) {
            res.end(JSON.stringify({res: body}));
        }else {
            res.end(JSON.stringify({response: body}));
        }
    });
};
exports.verifyUsername= function(req, res) {
    var param = req.body;
    var token = param['token'];
    var length = 10;
    var filter = {
        "entity": "cybertrust.user",
        "keys": ["username"], "values": [param['username']]
    };
    var options = {
        'method': 'POST',
        'url': connection_opt['PS']+'/search/?',
        'headers': {
            'Content-Type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer '+token
        },
        'body': JSON.stringify(filter)
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            var total =data['paging']['total'];
            res.end(JSON.stringify({data: total}));
        }else{
            res.end(JSON.stringify({err: error}));
        }
    });
}
//Devices
exports.getDeviceList= function(req, res) {
    var param = req.body;
    var start = param['start']/10  ;
    var token = param['token'] || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjA4NTMzNmFmZTY0Yzg2ZWQ3NDU5YzE5YzQ4ZjQzNzI3IiwidHlwIjoiSldUIn0.eyJuYmYiOjE1ODYzMzUyNjksImV4cCI6MTU4NjMzODg2OSwiaXNzIjoiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAiLCJhdWQiOlsiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAvcmVzb3VyY2VzIiwicHJvZmlsaW5nIl0sImNsaWVudF9pZCI6InVpIiwic3ViIjoiMTI4IiwiYXV0aF90aW1lIjoxNTg2MzM1MjY5LCJpZHAiOiJsb2NhbCIsInNjb3BlIjpbImN0LnByb2ZpbGUiXSwiYW1yIjpbInB3ZCJdfQ.R2DVON-jTv8ItoDbUnhv35pxfJNjt9XcmMGX2OeB3IRFJ6jq_Jdm1xGOqyt940G4z5W9nae2TROF8CbsoM0Ied_J33uiCSWxHUzAAaNTtzQvdPM4Ns22QlA4qLUSajr8TkLT0l03gl00rsMjaC5Iy-OjJINQw45INSqlE0Z1loBaz8wrLftecWo4l_rbigPlQkXKHjiHL-rAkWzTAmLPGYM6tzNxQ23AVEb_oTSqb0DhKXhlqLEswXQGDB1m1vCnsPEmAyz8TskhHh1ECoxxcw6iWrd3i5bnwfcQmg1C_35vgPWozgggdcoU5RvFjf36rMZ3bMTqaj156wYdEsXDPg';
    var length = 10;
    if(param['search'] && param['search']['value']){
        //To complete
    }
    var filter = {
        "entity": "cybertrust.device",
        //"keys": ["roles"], "values": ["Administrator", "ISP"]
        "sort": "owner.id"
    };
    if(param['_id']){
        filter['keys'] =  ["_id"];
        filter['values'] = [param['_id'], param['_id']];
    }
    if(param['owner_id']){
        filter['keys'] =  ["user"];
        filter['values'] = [param['owner_id'], param['owner_id']];
    }


    var options = {
        'method': 'POST',
        'url': connection_opt['PS']+'/search/?page='+start+'&pageSize='+length,
        'headers': {
            'Authorization': 'Bearer ' + token,
            'Content-Type'  : 'application/json',
        },
        'body': JSON.stringify(filter)
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            getDeviceOwner(token, data['data'], [], function(updatedData){
                var ret = [];
                if(updatedData.length){
                    updatedData.forEach(function (user, pos){
                        ret.push(user);
                    });
                }
                var total =data['paging']['total'];
                res.end(JSON.stringify({data: ret, recordsTotal: total, recordsFiltered: total}));
            });
            /*
            var ret = [];
            data['data'].forEach(function (device, pos){
                ret.push(device);
            });
            var total =data['paging']['total'];
            res.end(JSON.stringify({data: ret, recordsTotal: total, recordsFiltered: total}));
            */
        }else{
            res.end(JSON.stringify({err: error}));
        }
    });
}
exports.getSohoDeviceList= function(req, res) {
    var param = req.body;
    var start = param['start']/10  ;
    var token = param['token'] || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjA4NTMzNmFmZTY0Yzg2ZWQ3NDU5YzE5YzQ4ZjQzNzI3IiwidHlwIjoiSldUIn0.eyJuYmYiOjE1ODYzMzUyNjksImV4cCI6MTU4NjMzODg2OSwiaXNzIjoiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAiLCJhdWQiOlsiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAvcmVzb3VyY2VzIiwicHJvZmlsaW5nIl0sImNsaWVudF9pZCI6InVpIiwic3ViIjoiMTI4IiwiYXV0aF90aW1lIjoxNTg2MzM1MjY5LCJpZHAiOiJsb2NhbCIsInNjb3BlIjpbImN0LnByb2ZpbGUiXSwiYW1yIjpbInB3ZCJdfQ.R2DVON-jTv8ItoDbUnhv35pxfJNjt9XcmMGX2OeB3IRFJ6jq_Jdm1xGOqyt940G4z5W9nae2TROF8CbsoM0Ied_J33uiCSWxHUzAAaNTtzQvdPM4Ns22QlA4qLUSajr8TkLT0l03gl00rsMjaC5Iy-OjJINQw45INSqlE0Z1loBaz8wrLftecWo4l_rbigPlQkXKHjiHL-rAkWzTAmLPGYM6tzNxQ23AVEb_oTSqb0DhKXhlqLEswXQGDB1m1vCnsPEmAyz8TskhHh1ECoxxcw6iWrd3i5bnwfcQmg1C_35vgPWozgggdcoU5RvFjf36rMZ3bMTqaj156wYdEsXDPg';
    var length = 10;

    if(!param['soho_id']){
        res.end(JSON.stringify({err: "SmartHome ID not found"}));
    }else{
        var filter = {
            "entity": "cybertrust.device",
            "keys": ["smarthome"],
            "values": [param['soho_id'], param['soho_id']]
        };
        var options = {
            'method': 'POST',
            'url': connection_opt['PS']+'/search/?page='+start+'&pageSize='+length,
            'headers': {
                'Authorization': 'Bearer ' + token,
                'Content-Type'  : 'application/x-www-form-urlencoded',
            },
            'body': JSON.stringify(filter)
        };
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                getDeviceOwner(token, data['data'], [], function(updatedData){
                    var ret = [];
                    if(updatedData.length){
                        updatedData.forEach(function (user, pos){
                            ret.push(user);
                        });
                    }
                    var total =data['paging']['total'];
                    res.end(JSON.stringify({data: ret, recordsTotal: total, recordsFiltered: total}));
                });
            }else{
                res.end(JSON.stringify({err: error}));
            }
        });
    }
}
exports.addDevice= function(req, res) {
    var param = req.body;
    var token = param['token'];
    var smarthome_id = param['smarthome_id'];
    if(!param['device_userId']){param['device_userId'] = '1'} //For dummy credentials
    var dataSet = {
        "description":param['device_description'],
        "type":param['device_type'],
        "user":param['device_userId'],
        "cpe":param['device_cpe'],
        "smarthome_id": smarthome_id,
        "device_info":{
            "hardware_id":param['device_device_info_hardware_id'],
            "model":param['device_device_info_model'],
            "manufacturer":param['device_device_info_manufacturer'],
            "os":{
                "version": param["device_device_info_os_version"],
                "name": param["device_device_info_os_name"],
                "sdk": param["device_device_info_os_sdk"]
            }
        },
        "owner": {
            "id": param["device_userId"],
            "type": param["device_userType"]
        },
        'smarthome' : 1
    };
    //return false;
    /*
    var dataSet = {
        "type": "type",
        "timestamp": "2020-04-10T12:35:47.627492",
        "description": "test_insert_02",
        "user": "userId",
        "cpe": "cpe_string",
        "device_info": {
            "hardware_id": "999233::ffssee",
            "model": "HW-123",
            "manufacturer": "Huawei",
            "os": {
                "version": "1.1.1",
                "name": "Android",
                "sdk": "1"
            }
        },
        "owner": {
            "id": "userOwnerId",
            "type": "isp"
        },
        "smarthome": "smarthome_id",
    }
    */
    request({
        url: connection_opt['PS']+'/device/',
        method: 'POST',
        json: dataSet,
        'headers': {
            'Content-Type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer '+token
        }
    }, function (error, response, body) {
        if (!error && response.statusCode === 201) {
            res.end(JSON.stringify({res: body}));
        }else {
            res.end(JSON.stringify({err: body}));
        }
    });
};
exports.deleteDevice= function(req, res) {
    var param = req.body;
    var token = param['token'];

    request({
        url: connection_opt['PS']+'/device/'+param['_id'],
        method: 'DELETE',
        'headers': {
            'Content-Type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer '+token
        }
    }, function (error, response, body) {
        if (!error && response.statusCode === 201) {
            res.end(JSON.stringify({res: body}));
        }else {
            res.end(JSON.stringify({response: body}));
        }
    });
};
exports.patchDevice= function(req, res) {
    var param = req.body;
    var token = param['token'];
    if(!param['device_userId']){param['device_userId'] = '1'} //For dummy credentials
    var dataSet = {
        "description":param['device_description'],
        "type":param['device_type'],
        "user":param['device_userId'],
        "cpe":param['device_cpe'],
        "smarthome_id": param['smarthome_id'],
        "device_info":{
            "hardware_id":param['device_device_info_hardware_id'],
            "model":param['device_device_info_model'],
            "manufacturer":param['device_device_info_manufacturer'],
            "os":{
                "version": param["device_device_info_os_version"],
                "name": param["device_device_info_os_name"],
                "sdk": param["device_device_info_os_sdk"]
            }
        },
        "owner": {
            "id": param["device_userId"],
            "type": param["device_userType"]
        },
    };
    request({
        url: connection_opt['PS']+'/device/'+param['device_id'],
        method: 'PATCH',
        json: dataSet,
        'headers': {
            'Content-Type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer '+token
        }
    }, function (error, response, body) {
        if (!error && response.statusCode === 201) {
            res.end(JSON.stringify({res: body}));
        }else {
            res.end(JSON.stringify({err: body}));
        }
    });
};
exports.patchDeviceImpact= function(req, res) {
    var param = req.body;
    var token = param['token'];
    var dataSet = {
        "_id" : param['_id'],
        "impact": {
            "value": param['value'],
            "description": impactMap[param['value']]
        }
    };
    request({
        url: connection_opt['PS']+'/device/'+param['_id'],
        method: 'PATCH',
        json: dataSet,
        'headers': {
            'Content-Type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer '+token
        }
    }, function (error, response, body) {
        if (!error && response.statusCode === 201) {
            res.end(JSON.stringify({res: body}));
        }else {
            res.end(JSON.stringify({err: body}));
        }
    });
};
exports.patchMonitoring= function(req, res) {
    var param = req.body;
    var token = param['token'];
    var monitoring = param['monitoring'];
    var dataSet = {
        "_id" : param['_id'],
        "monitoring": true //monitoring
    };
    request({
        url: connection_opt['PS']+'/device/'+param['_id'],
        method: 'PATCH',
        json: dataSet,
        'headers': {
            'Content-Type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer '+token
        }
    }, function (error, response, body) {
        if (!error && response.statusCode === 201) {
            res.end(JSON.stringify({res: body}));
        }else {
            res.end(JSON.stringify({err: body}));
        }
    });
};
//SmartHome
exports.getSmartHomeList= function(req, res) {
    var param = req.body;
    var start = param['start']/10||0  ;
    var token = param['token'] || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjA4NTMzNmFmZTY0Yzg2ZWQ3NDU5YzE5YzQ4ZjQzNzI3IiwidHlwIjoiSldUIn0.eyJuYmYiOjE1ODYzMzUyNjksImV4cCI6MTU4NjMzODg2OSwiaXNzIjoiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAiLCJhdWQiOlsiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAvcmVzb3VyY2VzIiwicHJvZmlsaW5nIl0sImNsaWVudF9pZCI6InVpIiwic3ViIjoiMTI4IiwiYXV0aF90aW1lIjoxNTg2MzM1MjY5LCJpZHAiOiJsb2NhbCIsInNjb3BlIjpbImN0LnByb2ZpbGUiXSwiYW1yIjpbInB3ZCJdfQ.R2DVON-jTv8ItoDbUnhv35pxfJNjt9XcmMGX2OeB3IRFJ6jq_Jdm1xGOqyt940G4z5W9nae2TROF8CbsoM0Ied_J33uiCSWxHUzAAaNTtzQvdPM4Ns22QlA4qLUSajr8TkLT0l03gl00rsMjaC5Iy-OjJINQw45INSqlE0Z1loBaz8wrLftecWo4l_rbigPlQkXKHjiHL-rAkWzTAmLPGYM6tzNxQ23AVEb_oTSqb0DhKXhlqLEswXQGDB1m1vCnsPEmAyz8TskhHh1ECoxxcw6iWrd3i5bnwfcQmg1C_35vgPWozgggdcoU5RvFjf36rMZ3bMTqaj156wYdEsXDPg';
    var length = 10;
    var filter = {
        "entity": "cybertrust.smarthome"
    };
    if(param['_id']){
        filter['keys'] =  ["_id"];
        filter['values'] = [param['_id'], param['_id']];
    }
    if(param['owner']){
        filter['keys'] =  ["owner"];
        filter['values'] = [param['owner'], param['owner']];
    }
    var options = {
        'method': 'POST',
        'url': connection_opt['PS']+'/search/?page='+start+'&pageSize='+length,
        'headers': {
            'Content-Type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer '+token
        },
        'body': JSON.stringify(filter)
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            getSmartHomeOwner(token, data['data'], [], function(updatedData){
                var ret = [];
                if(updatedData.length){
                    updatedData.forEach(function (user, pos){
                        ret.push(user);
                    });
                }
                var total =data['paging']['total'];
                res.end(JSON.stringify({data: ret, recordsTotal: total, recordsFiltered: total}));
            });
        }else{
            res.end(JSON.stringify({err: error}));
        }

    });
}
exports.patchSHConfig= function(req, res) {
    var param = req.body;
    var token = param['token'];
    if(!param['hosts'] || param['hosts'] == ''){
        param['hosts'] = [];
    }
    var dataSet = {
        "config": {
            "irg": {
                "cost": {
                    "firewall": param['firewallCost'],
                    "patch": param['patchCost']
                },
                "hosts": param['hosts']
            },
            "ire": {
                "sp_tradeoff": param['performance'],
                "sa_tradeoff": param['availability'],
                "auto_mode": param['automode']
            }
        },
    };
    console.log({
        url: connection_opt['PS']+'/smarthome/'+param['_id'],
        method: 'PATCH',
        json: dataSet,
        'headers': {
            'Content-Type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer '+token
        }
    })
    request({
        url: connection_opt['PS']+'/smarthome/'+param['_id'],
        method: 'PATCH',
        json: dataSet,
        'headers': {
            'Content-Type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer '+token
        }
    }, function (error, response, body) {
        console.log(response.statusCode);
        if (!error && response.statusCode === 201) {
            res.end(JSON.stringify({res: body}));
        }else {
            res.end(JSON.stringify({err: body}));
        }
    });
};
//Notification
exports.getNotificationList= function(req, res) {
    var param = req.body;
    var start = param['start']/10||0  ;
    var token = param['token'] || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjA4NTMzNmFmZTY0Yzg2ZWQ3NDU5YzE5YzQ4ZjQzNzI3IiwidHlwIjoiSldUIn0.eyJuYmYiOjE1ODYzMzUyNjksImV4cCI6MTU4NjMzODg2OSwiaXNzIjoiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAiLCJhdWQiOlsiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAvcmVzb3VyY2VzIiwicHJvZmlsaW5nIl0sImNsaWVudF9pZCI6InVpIiwic3ViIjoiMTI4IiwiYXV0aF90aW1lIjoxNTg2MzM1MjY5LCJpZHAiOiJsb2NhbCIsInNjb3BlIjpbImN0LnByb2ZpbGUiXSwiYW1yIjpbInB3ZCJdfQ.R2DVON-jTv8ItoDbUnhv35pxfJNjt9XcmMGX2OeB3IRFJ6jq_Jdm1xGOqyt940G4z5W9nae2TROF8CbsoM0Ied_J33uiCSWxHUzAAaNTtzQvdPM4Ns22QlA4qLUSajr8TkLT0l03gl00rsMjaC5Iy-OjJINQw45INSqlE0Z1loBaz8wrLftecWo4l_rbigPlQkXKHjiHL-rAkWzTAmLPGYM6tzNxQ23AVEb_oTSqb0DhKXhlqLEswXQGDB1m1vCnsPEmAyz8TskhHh1ECoxxcw6iWrd3i5bnwfcQmg1C_35vgPWozgggdcoU5RvFjf36rMZ3bMTqaj156wYdEsXDPg';
    var length = 10;
    var filter = {
        "entity": "cybertrust.notification"
    };
    if(param['username']){
        filter['keys'] =  ["to"];
        filter['values'] = ['topics/'+param['username'], 'topics/'+param['username']];
    }
    var options = {
        'method': 'POST',
        'url': connection_opt['PS']+'/search/?page='+start+'&pageSize='+length,
        'headers': {
            'Content-Type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer '+token
        },
        'body': JSON.stringify(filter)
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            data['data'].forEach(function(element){
                element['timestamp']= clearDateStamp(element['_insertedTimestamp']);
            })
            var total =data['paging']['total'];
            res.end(JSON.stringify({data: data['data'], recordsTotal: total, recordsFiltered: total}));
        }else{
            res.end(JSON.stringify({err: error}));
        }

    });
}
//Mitigation
exports.getMitigationList= function(req, res) {
    var param = req.body;
    var start = param['start']/10||0  ;
    var token = param['token'] || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjA4NTMzNmFmZTY0Yzg2ZWQ3NDU5YzE5YzQ4ZjQzNzI3IiwidHlwIjoiSldUIn0.eyJuYmYiOjE1ODYzMzUyNjksImV4cCI6MTU4NjMzODg2OSwiaXNzIjoiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAiLCJhdWQiOlsiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAvcmVzb3VyY2VzIiwicHJvZmlsaW5nIl0sImNsaWVudF9pZCI6InVpIiwic3ViIjoiMTI4IiwiYXV0aF90aW1lIjoxNTg2MzM1MjY5LCJpZHAiOiJsb2NhbCIsInNjb3BlIjpbImN0LnByb2ZpbGUiXSwiYW1yIjpbInB3ZCJdfQ.R2DVON-jTv8ItoDbUnhv35pxfJNjt9XcmMGX2OeB3IRFJ6jq_Jdm1xGOqyt940G4z5W9nae2TROF8CbsoM0Ied_J33uiCSWxHUzAAaNTtzQvdPM4Ns22QlA4qLUSajr8TkLT0l03gl00rsMjaC5Iy-OjJINQw45INSqlE0Z1loBaz8wrLftecWo4l_rbigPlQkXKHjiHL-rAkWzTAmLPGYM6tzNxQ23AVEb_oTSqb0DhKXhlqLEswXQGDB1m1vCnsPEmAyz8TskhHh1ECoxxcw6iWrd3i5bnwfcQmg1C_35vgPWozgggdcoU5RvFjf36rMZ3bMTqaj156wYdEsXDPg';
    var length = 10;
    var filter = {
        "entity": "cybertrust.mitigation"
    };
    if(param['_id']){
        filter['keys'] =  ["_id"];
        filter['values'] = [param['_id'], param['_id']];
    }
    var options = {
        'method': 'POST',
        'url': connection_opt['PS']+'/search/?page='+start+'&pageSize='+length,
        'headers': {
            'Content-Type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer '+token
        },
        'body': JSON.stringify(filter)
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            data['data'].forEach(function(element){
                element['timestamp']= clearDateStamp(element['_insertedTimestamp']);
            })
            var total =data['paging']['total'];
            res.end(JSON.stringify({data: data['data'], recordsTotal: total, recordsFiltered: total}));
        }else{
            res.end(JSON.stringify({err: error}));
        }
    });
}
exports.patchMitigation= function(req, res) {
    var param = req.body;
    var token = param['token'];
    var dataSet = {
        "status": "Accepted"
    };
    request({
        url: connection_opt['PS']+'/mitigation/'+param['_id'],
        method: 'PATCH',
        json: dataSet,
        'headers': {
            'Content-Type'  : 'application/x-www-form-urlencoded',
            'Authorization' : 'Bearer '+token
        }
    }, function (error, response, body) {
        if (!error && response.statusCode === 201) {
            res.end(JSON.stringify({res: body}));
        }else {
            res.end(JSON.stringify({err: body}));
        }
    });
};
//Alerts
exports.getAlertList= function(req, res) {
    //request(connection_opt['PS']+'/monitoring/alert/?page=0&pageSize=100', function (error, response, body) {
    request(connection_opt['PS']+'/monitoring/alert/?page=0&pageSize=100', function (error, response, body) {
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
        }else{
            res.end(JSON.stringify({err: error}));
        }
    });
};
exports.getAlertsList= function(req, res) {
    var param = req.body;
    var start = param['start']/10  ;
    var token = param['token'] || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjA4NTMzNmFmZTY0Yzg2ZWQ3NDU5YzE5YzQ4ZjQzNzI3IiwidHlwIjoiSldUIn0.eyJuYmYiOjE1ODYzMzUyNjksImV4cCI6MTU4NjMzODg2OSwiaXNzIjoiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAiLCJhdWQiOlsiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAvcmVzb3VyY2VzIiwicHJvZmlsaW5nIl0sImNsaWVudF9pZCI6InVpIiwic3ViIjoiMTI4IiwiYXV0aF90aW1lIjoxNTg2MzM1MjY5LCJpZHAiOiJsb2NhbCIsInNjb3BlIjpbImN0LnByb2ZpbGUiXSwiYW1yIjpbInB3ZCJdfQ.R2DVON-jTv8ItoDbUnhv35pxfJNjt9XcmMGX2OeB3IRFJ6jq_Jdm1xGOqyt940G4z5W9nae2TROF8CbsoM0Ied_J33uiCSWxHUzAAaNTtzQvdPM4Ns22QlA4qLUSajr8TkLT0l03gl00rsMjaC5Iy-OjJINQw45INSqlE0Z1loBaz8wrLftecWo4l_rbigPlQkXKHjiHL-rAkWzTAmLPGYM6tzNxQ23AVEb_oTSqb0DhKXhlqLEswXQGDB1m1vCnsPEmAyz8TskhHh1ECoxxcw6iWrd3i5bnwfcQmg1C_35vgPWozgggdcoU5RvFjf36rMZ3bMTqaj156wYdEsXDPg';
    var length = 10;
    if(param['search'] && param['search']['value']){
        //To complete
    }
    var filter = {
        "entity": "cybertrust.alert",
        "sort": "_insertedTimestamp"
    };
    var options = {
        'method': 'POST',
        'url': connection_opt['PS']+'/search/?page='+start+'&pageSize='+length,
        'headers': {
            'Authorization': 'Bearer ' + token,
            'Content-Type'  : 'application/x-www-form-urlencoded',
        },
        'body': JSON.stringify(filter)
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            //getDeviceData(token, data['data'], [], function(updatedData){
            //    var ret = [];
            //    if(updatedData.length){
            //        updatedData.forEach(function (d, pos){
            //            ret.push(d);
            //        });
            //    }

                res.end(JSON.stringify({data: data, recordsTotal: data['paging']['total'], recordsFiltered: data['paging']['total']}));
            //});
        }else{
            res.end(JSON.stringify({err: error}));
        }
    });
};
exports.getRuleList= function(req, res) {
    request(connection_opt['PS']+'/monitoring/rule/?page=0&pageSize=100', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            data['data'].forEach(function(d){
                if(!d['description']){d['description']='None';}
                if(!d['originating_service']){d['originating_service']='None';}
                if(!d['device_type']){d['device_type']='None';}
                if(!d['timestamp']){d['timestamp']='None';}
            });
            res.end(JSON.stringify({data: data['data']}));
        }else {
            res.end(JSON.stringify({err: error}));
        }
    });
};
//Vulnerabilities
exports.getVulnerabilitiesList= function(req, res) {
    var param = req.body;
    var page = param['start']/10||0  ;
    request(connection_opt['PS']+'/vulnerability/?page='+page+'&pageSize=10', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            //res.end(JSON.stringify({data: data}));
            res.end(JSON.stringify({data: data, recordsTotal: data['paging']['total'], recordsFiltered: data['paging']['total']}));
        }else {
            res.end(JSON.stringify({err: error}));
        }
    });
};
exports.getDeviceVulnerabilitiesList= function(req, res) {
    var param = req.body;
    var start = param['start']/10  ;
    var token = param['token'] || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjA4NTMzNmFmZTY0Yzg2ZWQ3NDU5YzE5YzQ4ZjQzNzI3IiwidHlwIjoiSldUIn0.eyJuYmYiOjE1ODYzMzUyNjksImV4cCI6MTU4NjMzODg2OSwiaXNzIjoiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAiLCJhdWQiOlsiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAvcmVzb3VyY2VzIiwicHJvZmlsaW5nIl0sImNsaWVudF9pZCI6InVpIiwic3ViIjoiMTI4IiwiYXV0aF90aW1lIjoxNTg2MzM1MjY5LCJpZHAiOiJsb2NhbCIsInNjb3BlIjpbImN0LnByb2ZpbGUiXSwiYW1yIjpbInB3ZCJdfQ.R2DVON-jTv8ItoDbUnhv35pxfJNjt9XcmMGX2OeB3IRFJ6jq_Jdm1xGOqyt940G4z5W9nae2TROF8CbsoM0Ied_J33uiCSWxHUzAAaNTtzQvdPM4Ns22QlA4qLUSajr8TkLT0l03gl00rsMjaC5Iy-OjJINQw45INSqlE0Z1loBaz8wrLftecWo4l_rbigPlQkXKHjiHL-rAkWzTAmLPGYM6tzNxQ23AVEb_oTSqb0DhKXhlqLEswXQGDB1m1vCnsPEmAyz8TskhHh1ECoxxcw6iWrd3i5bnwfcQmg1C_35vgPWozgggdcoU5RvFjf36rMZ3bMTqaj156wYdEsXDPg';
    var length = 10;

    if(!param['device_id']){
        res.end(JSON.stringify({err: "Device ID not found"}));
    }else{
        var filter = {
            "entity": "cybertrust.vulnerability",
            "keys": ["device_id"],
            "values": [param['device_id']]
        };
        var options = {
            'method': 'POST',
            'url': connection_opt['PS']+'/search/?page='+start+'&pageSize='+length,
            'headers': {
                'Authorization': 'Bearer ' + token,
                'Content-Type'  : 'application/x-www-form-urlencoded',
            },
            'body': JSON.stringify(filter)
        };
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                getDeviceOwner(token, data['data'], [], function(updatedData){
                    var ret = [];
                    if(updatedData.length){
                        updatedData.forEach(function (user, pos){
                            ret.push(user);
                        });
                    }
                    var total =data['paging']['total'];
                    res.end(JSON.stringify({data: ret, recordsTotal: total, recordsFiltered: total}));
                });
            }else{
                res.end(JSON.stringify({err: error}));
            }
        });
    }
};

exports.smartHomeTopology = function(req, res){
    var param = req.body;
    var token = param['token'] || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjA4NTMzNmFmZTY0Yzg2ZWQ3NDU5YzE5YzQ4ZjQzNzI3IiwidHlwIjoiSldUIn0.eyJuYmYiOjE1ODYzMzUyNjksImV4cCI6MTU4NjMzODg2OSwiaXNzIjoiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAiLCJhdWQiOlsiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAvcmVzb3VyY2VzIiwicHJvZmlsaW5nIl0sImNsaWVudF9pZCI6InVpIiwic3ViIjoiMTI4IiwiYXV0aF90aW1lIjoxNTg2MzM1MjY5LCJpZHAiOiJsb2NhbCIsInNjb3BlIjpbImN0LnByb2ZpbGUiXSwiYW1yIjpbInB3ZCJdfQ.R2DVON-jTv8ItoDbUnhv35pxfJNjt9XcmMGX2OeB3IRFJ6jq_Jdm1xGOqyt940G4z5W9nae2TROF8CbsoM0Ied_J33uiCSWxHUzAAaNTtzQvdPM4Ns22QlA4qLUSajr8TkLT0l03gl00rsMjaC5Iy-OjJINQw45INSqlE0Z1loBaz8wrLftecWo4l_rbigPlQkXKHjiHL-rAkWzTAmLPGYM6tzNxQ23AVEb_oTSqb0DhKXhlqLEswXQGDB1m1vCnsPEmAyz8TskhHh1ECoxxcw6iWrd3i5bnwfcQmg1C_35vgPWozgggdcoU5RvFjf36rMZ3bMTqaj156wYdEsXDPg';
    var length = 800;

    getSOHO(0, token, [], function(data){
        console.log(data);
        networkTopologyRetriever(data, function (result) {
            res.end(JSON.stringify({data: result['parent'], network: result['network']}));
        })
    })
}
exports.networkTopology = function(req, res){
    var param = req.body;
    var token = param['token'] || 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjA4NTMzNmFmZTY0Yzg2ZWQ3NDU5YzE5YzQ4ZjQzNzI3IiwidHlwIjoiSldUIn0.eyJuYmYiOjE1ODYzMzUyNjksImV4cCI6MTU4NjMzODg2OSwiaXNzIjoiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAiLCJhdWQiOlsiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAvcmVzb3VyY2VzIiwicHJvZmlsaW5nIl0sImNsaWVudF9pZCI6InVpIiwic3ViIjoiMTI4IiwiYXV0aF90aW1lIjoxNTg2MzM1MjY5LCJpZHAiOiJsb2NhbCIsInNjb3BlIjpbImN0LnByb2ZpbGUiXSwiYW1yIjpbInB3ZCJdfQ.R2DVON-jTv8ItoDbUnhv35pxfJNjt9XcmMGX2OeB3IRFJ6jq_Jdm1xGOqyt940G4z5W9nae2TROF8CbsoM0Ied_J33uiCSWxHUzAAaNTtzQvdPM4Ns22QlA4qLUSajr8TkLT0l03gl00rsMjaC5Iy-OjJINQw45INSqlE0Z1loBaz8wrLftecWo4l_rbigPlQkXKHjiHL-rAkWzTAmLPGYM6tzNxQ23AVEb_oTSqb0DhKXhlqLEswXQGDB1m1vCnsPEmAyz8TskhHh1ECoxxcw6iWrd3i5bnwfcQmg1C_35vgPWozgggdcoU5RvFjf36rMZ3bMTqaj156wYdEsXDPg';
    getTopology(token, function(response){
        if(!response){
            res.end(JSON.stringify({err: "Error during the network topology generation"}));
        }else{
            res.end(JSON.stringify({network: response}));
        }
    })
}
function getTopology(token,cb) {
    var filter = {
        "entity": "cybertrust.topology",
    };
    var options = {
        'method': 'POST',
        'url': connection_opt['PS'] + '/search/?page=0&pageSize=250',
        'headers': {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        'body': JSON.stringify(filter)
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            var soho_id = [];
            data['data'].forEach(function(soho){
                soho_id.push(soho['smarthome_id'])
            })
            getSohoTopology(token, soho_id, function(response){
                if(!response){
                    cb(false);
                }else{
                    cb(response);
                }
            })
        }else{
            cb(false);
        }
    });
}
function getSohoTopology(token, soho_id, cb){
    var filter = {
        "entity": "cybertrust.smarthome",
        "keys": ["_id"],
        "values": soho_id
    };
    var options = {
        'method': 'POST',
        'url': connection_opt['PS'] + '/search/?page=0&pageSize=250',
        'headers': {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        'body': JSON.stringify(filter)
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            var topology = {};
            data['data'].forEach(function(soho){
                topology[soho['name']] = soho['json_topology'];
            })
            cb(topology)
        }else{
            console.error(error);
            cb(false);
        }
    });
}

function getSOHO(page, token, box, cb) {
    var filter = {
        "entity": "cybertrust.smarthome",
    };
    var options = {
        'method': 'POST',
        'url': connection_opt['PS'] + '/search/?page='+page+'&pageSize=250',
        'headers': {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        'body': JSON.stringify(filter)
    };
    request(options, function (error, response, body) {
        console.log(body)
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            data['data'].forEach(function(info,i){
                box.push(info);
            });
            page++;
            if(page >= 5){
                cb(box);
            }else{
                setTimeout(function(event){
                    getSOHO(page, token, box, cb);
                }, 1000);
            }
        }else{
            setTimeout(function(event){
                getSOHO(page, token, box, cb);
            }, 1000);
        }
    });
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
/*
function extractTopology(token, data, i, nodes, edges, parentList, cb){
    if(!data.length) {
        cb({nodes: nodes, edges: edges, parents: parentList});
    }else{
        var sh = data.shift();
        var dest = i+1;
        parentList.push(dest);
        var node = {
            "id"        : dest,
            "label"      : 'sh',
            "_id"        : sh['_id'],
            "name"      : sh['name'],
            "WAN"       : sh['WAN'],
            "LAN"       : sh['LAN'],
            "network"   : sh['network'],
            "gateway"   : sh['gateway'],
            "broadcast" : sh['broadcast']
        }
        nodes.push(node);
        var edge = {
            "from"  : 0,
            "to"    : dest,
            "label" : sh['WAN'],
            "length": 1000
        };
        edges.push(edge);
        deviceSh(token, sh['_id'], dest, dest, nodes, edges, function(addendum){
            extractTopology(token, data, addendum['i'], addendum['nodes'], addendum['edges'], parentList, cb);
        })
    }
}
function deviceSh(token, smarthome_id, parent, i, nodes, edges, cb){
    var filter = {
        "entity": "cybertrust.device",
    };
    if(smarthome_id){
        filter['keys'] =  ["smarthome"];
        filter['values'] = [smarthome_id,smarthome_id];
    }
    var options = {
        'method': 'POST',
        'url': connection_opt['PS']+'/search/?page=0&pageSize=100',
        'headers': {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'text/plain'
        },
        'body': JSON.stringify(filter)
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            if(data['data'].length){
                data['data'].forEach(function(device){
                    i = i+1;
                    var node = {
                        "id"        : i,
                        "label"      : 'device',
                        "parent"    : parent,
                        "_id"       : device['_id'],
                        "IP"        : device['ip'],
                        "deviceType": device['type']
                    };
                    nodes.push(node);
                    var edge = {
                        "from"  : parent,
                        "to"    : i,
                        "label" : "",
                        "length": 1000
                    }
                    edges.push(edge);
                })
                cb({i:i, nodes:nodes, edges:edges})
            }else{
                cb({i:i, nodes:nodes, edges:edges})
            }
        }else{
            cb({i:i, nodes:nodes, edges:edges})
        }
    });
}
*/
function networkTopologyRetriever(data, cb){
    var Parent = JSON.parse(JSON.stringify($PARENT));
    var box ={
        nodes : [{
            id      : "CyberTrust Source",
            IP      : "0.0.0.0",
            owner   : "",
            group   : 0,
            figure  : 0,
        }],
        group : 0,
        links : []
    }
    networkData(data, {}, box, function(result){
        Object.keys(result['node']).forEach(function(node, i){
            if(node < 100) {
                Object.keys(result['node'][node]).forEach(function (ip_3) {
                    if(ip_3 < 100){
                        result['node'][node][ip_3].forEach(function (child) {
                            Parent['children'][0]['children'][0]['children'].push(child);
                        })
                    }else if(ip_3 < 200){
                        result['node'][node][ip_3].forEach(function (child) {
                            Parent['children'][0]['children'][1]['children'].push(child);
                        })
                    }else{
                        result['node'][node][ip_3].forEach(function (child) {
                            Parent['children'][0]['children'][2]['children'].push(child);
                        })
                    }
                })
            }else if(node < 200) {
                Object.keys(result['node'][node]).forEach(function (ip_3) {
                    if(ip_3 < 100){
                        result['node'][node][ip_3].forEach(function (child) {
                            Parent['children'][1]['children'][0]['children'].push(child);
                        })
                    }else if(ip_3 < 200){
                        result['node'][node][ip_3].forEach(function (child) {
                            Parent['children'][1]['children'][1]['children'].push(child);
                        })
                    }else{
                        result['node'][node][ip_3].forEach(function (child) {
                            Parent['children'][1]['children'][2]['children'].push(child);
                        })
                    }
                })
            }else {
                Object.keys(result['node'][node]).forEach(function (ip_3) {
                    if(ip_3 < 100){
                        result['node'][node][ip_3].forEach(function (child) {
                            Parent['children'][2]['children'][0]['children'].push(child);
                        })
                    }else if(ip_3 < 200){
                        result['node'][node][ip_3].forEach(function (child) {
                            Parent['children'][0]['children'][1]['children'].push(child);
                        })
                    }else{
                        result['node'][node][ip_3].forEach(function (child) {
                            Parent['children'][2]['children'][2]['children'].push(child);
                        })
                    }
                })
            }
        })
        pruneTree(Parent, function(Parent){
            cb({parent : Parent['data'], network: Parent['network']});
        })
    })
}
function networkData(data, node, box, cb){
    if(!data.length) {
        cb({node: node, network: box});
    }else{
        var sh = data.shift();
        if(sh['json_topology'] && sh['json_topology']['machine']){
            var machines = sh['json_topology']['machine'];
            var map = {};
            var orderMap = {};
            machines.forEach(function(machine){
                map[machine['interfaces']['interface']['ipaddress']] = {
                    name : machine.name,
                    connected : machine['interfaces']['interface']['directly-connected']['ipaddress']
                };
                var len = 1;
                if( Object.prototype.toString.call(machine['interfaces']['interface']['directly-connected']['ipaddress']) === '[object Array]' ) {
                    len = machine['interfaces']['interface']['directly-connected']['ipaddress'].length;
                    if(!orderMap[len]){
                        orderMap[len] = [];
                    }
                    orderMap[len].push(machine['interfaces']['interface']['ipaddress']);
                }
            })
            Object.keys(orderMap).forEach(function(nodes){
                orderMap[nodes].forEach(function(parent_address){
                    var ip = parent_address.split("\.");
                    var parentData = map[parent_address];
                    var parent = {
                        name    : parentData['name'],
                        IP      : parent_address,
                        owner   : "SOHO "+parentData['name'],
                        children:[]
                    }
                    box['group']++;
                    box['nodes'].push({
                        id      : parentData['name'],
                        IP      : parent_address,
                        owner   : parentData['name'],
                        group   : box['group'],
                        figure  : 1,
                    });
                    box['links'].push({"source": "CyberTrust Source", "target": parentData['name'], "value": 5});
                    parentData['connected'].forEach(function(childAddress){
                        var child = {
                            name    : map[childAddress]['name'],
                            IP      : childAddress,
                            owner   : "Owner of SOHO "+parentData['name']
                        }
                        parent['children'].push(child);
                        box['nodes'].push({
                            id      : map[childAddress]['name'],
                            IP      : childAddress,
                            owner   : parentData['name'],
                            group   : box['group'],
                            figure  : 2,
                        })
                        box['links'].push({"source": parentData['name'], "target": map[childAddress]['name'], "value": 1},)
                    });

                    if(!node[ip[2]]){
                        node[ip[2]] = {};
                    }
                    if(!node[ip[2]][ip[3]]){
                        node[ip[2]][ip[3]] = [];
                    }
                    node[ip[2]][ip[3]].push(parent);
                })
            })
            networkData(data, node, box,cb);
        }else{
            networkData(data, node, box,cb);
        }
    }
}
function pruneTree(data, cb){
    var box ={
        nodes : [],/*{
            id      : "CyberTrust Source",
            IP      : "0.0.0.0",
            owner   : "",
            group   : 0,
            figure  : 0,
        }],*/
        group : 0,
        links : []
    }

    data['children'].forEach(function(first, i){
        var pruned = [];
        first['children'].forEach(function(second, j){
            if(second['children'].length != 0){
                pruned.push(second);
            }
        })
        first['children'] = pruned;
        if(first['children'].length == 0){
            data['children'].splice(i,1);
        }
    })
    data['children'].forEach(function(first, i){
        /*
        box['nodes'].push({
            id      : first['name'],
            IP      : first['ip'],
            group   : 0,
            figure  : 2,
        })
        box['links'].push({"source": 'CyberTrust Source', "target": first['name'], "value": first['children'].length},)
        */
        first['children'].forEach(function(second, j) {
            box['nodes'].push({
                id      : second['name'],
                IP      : second['ip'],
                group   : 0,
                figure  : 2,
            })
            //box['links'].push({"source": first['name'], "target": second['name'], "value": second['children'].length},)
            second['children'].forEach(function (third, j) {
                box['nodes'].push({
                    id      : third['name'],
                    IP      : third['ip'],
                    group   : 0,
                    figure  : 3,
                })
                box['links'].push({"source": second['name'], "target": third['name'], "value": third['children'].length},)
                box['group']++
                third['children'].forEach(function (forth, j) {
                    box['nodes'].push({
                        id      : forth['name'],
                        IP      : forth['ip'],
                        group   : box['group'],
                        figure  : 4,
                    })
                    box['links'].push({"source": third['name'], "target": forth['name'], "value": 1})
                });
            });
        });
    })
    cb({data: data, network: box});
}
function pruneChild(data, out, cb){
    if(!data.length){
        cb(out);
    }else{
        var child = data.shift();
        if(child['children'].length != 0){
            out.push(child);
        }
        pruneChild(data, out, cb);
    }
}
function callUsers(type, userId, cb){
    request(connection_opt['PS']+'/user/?page=0&pageSize=100', function (error, response, body) {
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
function getDeviceData(token, alerts, res, cb){
    if(!alerts.length){
        cb(res);
    }else {
        var al = alerts.shift();
        var deviceId = al['device_id'];
        var filter = {
            "entity": "cybertrust.device",
        };
        filter['keys'] =  ["_id"];
        filter['values'] = [deviceId, deviceId];

        var options = {
            'method': 'POST',
            'url': connection_opt['PS'] + '/search/?',
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Bearer ' + token
            },
            'body': JSON.stringify(filter)
        };
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                al['deviceData'] = data['data'];
                res.push(al);
                getSmartHomeOwner(token, alerts, res, cb);
            }else{
                res.push(al);
                getSmartHomeOwner(token, alerts, res, cb);
            }
        });
    }
}
function getSmartHomeOwner(token, smarthomes, res, cb){
    if(!smarthomes.length){
        cb(res);
    }else {
        var sm = smarthomes.shift();
        var userId = sm['owner'];
        var filter = {
            "entity": "cybertrust.user",
        };
        filter['keys'] =  ["_id"];
        filter['values'] = [userId, userId];

        var options = {
            'method': 'POST',
            'url': connection_opt['PS'] + '/search/?',
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Bearer ' + token
            },
            'body': JSON.stringify(filter)
        };
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                sm['ownerData'] = data['data'];
                res.push(sm);
                getSmartHomeOwner(token, smarthomes, res, cb);
            }
        });
    }
}
function getDeviceOwner(token, devices, res, cb){
    if(!devices.length){
        cb(res);
    }else {
        var sm = devices.shift();
        var userId = '';
        if(sm['owner'] && sm['owner']['id']){
            var userId = sm['owner']['id'];
        }
        if(userId && userId != ''){
            var filter = {
                "entity": "cybertrust.user",
            };
            filter['keys'] =  ["_id"];
            filter['values'] = [userId, userId];

            var options = {
                'method': 'POST',
                'url': connection_opt['PS'] + '/search/?',
                'headers': {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Bearer ' + token
                },
                'body': JSON.stringify(filter)
            };
            request(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    var data = JSON.parse(body);
                    sm['ownerData'] = data['data'];
                    res.push(sm);
                    getDeviceOwner(token, devices, res, cb);
                }else{
                    getDeviceOwner(token, devices, res, cb);
                }
            });
        }else{
            res.push(sm);
            getDeviceOwner(token, devices, res, cb);
        }

    }
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
function dummyCredentials(username){
    var chk = false;
    var dummy = {
        username            : username,
        dateofbirth         : '2020-01-01',
        firstname           : 'CyberTrust Dummy User',
        telephone           : '0000-0000000000',
        token: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjA4NTMzNmFmZTY0Yzg2ZWQ3NDU5YzE5YzQ4ZjQzNzI3IiwidHlwIjoiSldUIn0.eyJuYmYiOjE1ODY4Njg0NTgsImV4cCI6MTU4Njg3MjA1OCwiaXNzIjoiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAiLCJhdWQiOlsiaHR0cDovLzE3Mi4xNi40LjE3OjUwMDAvcmVzb3VyY2VzIiwiY3QucHMiXSwiY2xpZW50X2lkIjoidWkiLCJzdWIiOiIxMjgiLCJhdXRoX3RpbWUiOjE1ODY4Njg0NTgsImlkcCI6ImxvY2FsIiwic2NvcGUiOlsib3BlbmlkIiwicHJvZmlsZSIsImN0LnByb2ZpbGUiXSwiYW1yIjpbInB3ZCJdfQ.TrDX2YU4JfTlAEjBmdPbnDVZkXsgqBG7gHc8v77BQOSzOzqeEx3HT5LPd9ZERnDfRCVOo080gMGWpn2sgN_bIuwZY-BxbesfuL6ZKPU7LQyDj0EhSENtlIdC4W5fJNNR-DgdBH7nlQiNq189nRQ5zjUi5fmHd8ZY6i4IIhpZJRYRSysGoF5jbdc9_BiO82ZYaoqzmkgybhHBmt9Zf6cRAsAcWUkJ7fmZpxiyddpNEmeuDFGi6TijMFDFmcAHxLP-_xtETHQzYpDzipvsARerQdHzjHbQcjaP3rYyYPYERb-pt7CW7Q88jXl6ThXspTAVAa5UGlRmp0-gGn5q3wQx_Q'
    }
    if(username == 'admin@cybertrust.com'){
        chk = true;
        dummy['roles']      = ['ct.admin'];
        dummy['lastname']   = 'Admin';
    }else if(username == 'isp@cybertrust.com'){
        chk = true;
        dummy['roles']      = ['ct.isp'];
        dummy['lastname']   = 'ISP';
    }else if(username == 'lea@cybertrust.com'){
        chk = true;
        dummy['roles']      = ['ct.lea'];
        dummy['lastname']   = 'LEA';
    }else if(username == 'home@cybertrust.com'){
        chk = true;
        dummy['roles']      = ['ct.ho'];
        dummy['lastname']   = 'Home Owner';
    }
    if(chk){
        return dummy;
    }else{
        return null;
    }

}

function convertToStandardDate(date){
    var d = date.split('/');
    var datestamp = d[2]+"-"+d[1]+"-"+d[0];
    return datestamp;
}
function rolesConverter(role){
    if(role == 'Administrator'){
        return 'ADMIN';
    }else if(role == 'ISP'){
        return 'ISP';
    }else if(role == 'LEA'){
        return 'LEA';
    }else if(role == 'ho'){
        return 'OWNER';
    }
}
function getSohoId(token, owner_id, cb){
    var filter = {
        "entity": "cybertrust.smarthome",
        "keys": ["owner"],
        'values': [owner_id, owner_id]
    };
    var options = {
        'method': 'POST',
        'url': connection_opt['PS']+'/search/?',
        'headers': {
            'Authorization': 'Bearer ' + token,
            'Content-Type'  : 'application/x-www-form-urlencoded',
        },
        'body': JSON.stringify(filter)
    };
    request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            var soho_id = data['data'][0]['_id'];
            cb(soho_id);
        }else{
            cb({err: error});
        }
    });
}

function getDeviceName(token, alert, res, cb){
    if(!alert.length){
        cb(res);
    }else {
        var sm = alert.shift();
        var deviceId = sm['device_id'];
        var filter = {
            "entity": "cybertrust.device",
        };
        filter['keys'] =  ["_id"];
        filter['values'] = [deviceId, deviceId];
        var options = {
            'method': 'POST',
            'url': connection_opt['PS'] + '/search/?',
            'headers': {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Bearer ' + token
            },
            'body': JSON.stringify(filter)
        };
        request(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                sm['device'] = deviceId;
                if(data['data'].length > 0){
                    sm['device'] = data['data'][0]['hostname'];
                }
                res.push(sm);
            }
            getDeviceName(token, alert, res, cb);
        });
    }
}
function sohoIdRetriever(ownerId, token, cb){
    var sohoList = [];
    var filter = {
        "entity": "cybertrust.smarthome",
        "keys": ["owner"],
        "values": [ownerId]
    };
    var options = {
        'method': 'POST',
        'url': connection_opt['PS'] + '/search/?page=0&pageSize=150',
        'headers': {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        'body': JSON.stringify(filter)
    };
    request(options, function (error, response, body) {
        if(!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            data['data'].forEach(function(soho){
                sohoList.push(soho['_id']);
            })
            cb(sohoList)
        }else{
            cb({err: error});
        }
    });
}
function sohoDeviceList(sohoId, token, cb){
    var filter = {
        "entity": "cybertrust.device",
        "keys": ["smarthome"],
        "values": sohoId
    };
    var options = {
        'method': 'POST',
        'url': connection_opt['PS'] + '/search/?page=0&pageSize=150',
        'headers': {
            'Authorization': 'Bearer ' + token,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        'body': JSON.stringify(filter)
    };
    var deviceData = {};
    request(options, function (error, response, body) {
        if(!error && response.statusCode == 200) {
            var data = JSON.parse(body);
            data['data'].forEach(function(device){
                deviceData[device['_id']] = device;
            })
            cb(deviceData)
        }else{
            cb({err: error});
        }
    });
}