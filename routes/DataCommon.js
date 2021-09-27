/**
 * Created by simone on 14/03/19.
 */

exports.porta = 5101;
exports.dataPool = {
    database : 'cybertrust',
    user     : 'dev',
    password : 'donkey20',
    debug    : false,
    connectionLimit : 10000,
    dateStrings: 'date'
};
exports.dataPoolVuln = {
    database : 'vulnDB',
    user     : 'dev',
    password : 'donkey20',
    debug    : false,
    connectionLimit : 10000,
    dateStrings: 'date'
};
exports.dataPoolESearch = {
    database : 'eSearch',
    user     : 'dev',
    password : 'donkey20',
    debug    : false,
    connectionLimit : 10000,
    dateStrings: 'date'
};
//exports.PyPath = '/usr/bin/python3'; //CNR Vers.
exports.PyPath = '/usr/bin/python3.8'; //CNR Vers.
