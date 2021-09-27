/**
 * Created by simone on 07/05/19.
 */
//var HOST = 'http://localhost:5101'; //Locale
//var HOST = 'http://192.168.4.51:5101'; // Interno Mathema
var HOST = 'http://172.16.4.40:5101'; // OTE
var HOST00 = 'http://172.16.4.40:5000'; // OTE
if(document.location.hostname.match(/193.218.97.142/)){
    HOST = 'http://193.218.97.142:5101';
    HOST00 = 'http://193.218.97.142:5000';
}
if(document.location.hostname.match(/localhost/)){
    HOST = 'http://localhost:5101';
    HOST00 = 'http://localhost:5000';
}
//HOST = 'http://193.218.97.142:5101';