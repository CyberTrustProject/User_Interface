/**
 * Created by simone on 14/03/19.
 */
var DATA = require('./OfflineData');
var request = require('request');

var connection_opt = {
    address : "http://192.168.50.30:6001/"
}
var $online = false;
exports.login = function(req,res) {
    var dati = DATA.data();
    var param = req.body;
    var check;
    loginUser(param, function(data){
        if(data){
            res.end(JSON.stringify({data: {userdata:data}}));
        }else{
            dati['users'].forEach(function(utente){
                if(utente['username'] == param['username'] && utente['password'] == param['password'] ){
                    check = utente;
                }
            });
            if(check){
                res.end(JSON.stringify({data: {userdata:check}}));
            }else{
                res.end(JSON.stringify({err: 'User not found'}));
            }
        }
    });
};
exports.deviceList = function(req,res) {
    var dati = DATA.data();
    if(dati['device']){
        res.end(JSON.stringify({data: {device:dati['device']}}));
    }else{
        res.end(JSON.stringify({err: 'Device not found'}));
    }
};
exports.offlineData = function(req,res) {
    var dati = DATA.data();
    if(dati){
        res.end(JSON.stringify({data: dati}));
    }else{
        res.end(JSON.stringify({err: 'Data not found'}));
    }
};
var loginUser= function(dati, cb) {
    if($online){
        request(connection_opt['address']+'/user/?page=0&pageSize=100', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var data = JSON.parse(body);
                data['data'].forEach(function(user){
                    if((user['username'] == dati['username'] || user['email'] == dati['username'])){
                        user['role'] = user['roles'][0];
                        cb(user);
                    }
                });
            }
            cb(false);
        });
    }else{
        cb(false);
    }
};

