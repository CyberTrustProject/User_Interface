/**
 * Created by simone on 21/10/19.
 */
var mem = {};
mem['loading'] = 1;

$(document).ready(function(){
    setTimeout(function(event){ //Setto un paio di secondi per il loading
        loadingScreen(false); // Chiudi il loader
    }, 2000);
    containerResize();
    $("#logoutUser").click(function(event){
        $("#logoutModal").modal('show');
    })
    $("#execLogout").click(function(event){
       location.href ="../index.html";
    });
    $( window ).resize(function() {
        containerResize()
    });
    $("input").bind("mousewheel", function () {
        return false;
    });
});
function containerResize(){
    $(".container-fluid").attr('style','height:'+$( window ).height()+'px;');
    $(".graph-fluid").attr('style','height:'+$( window ).height()+'px;');
}
function convertToStandardDate(date){
    var d = date.split('/');
    var datestamp = d[2]+"-"+d[1]+"-"+d[0];
    return datestamp;
}
function loadingScreen(mode){
    if(mode){
        mem['loading'] +=1;
    }else if(mem['loading'] > 0){
        mem['loading'] -=1;
    }
    if(mem['loading'] > 0){
        $("#preloader").show();
    }else{
        $("#preloader").hide();
    }
}
function SingleLoadingScreen(domain, mode){
    if(!mem['loading_'+domain]){mem['loading_'+domain] = 0};
    if(mode){
        mem['loading_'+domain] +=1;
    }else if(mem['loading_'+domain] > 0){
        mem['loading_'+domain] -=1;
    }
    if(mem['loading_'+domain] > 0){
        $("#preloader_"+domain).show();
    }else{
        $("#preloader_"+domain).hide();
    }
}
function roleDestination(role){
    if(role.match(/^Administrator$|^Admin$|^ct.admin$/i)){
        return "admin/admin_home.html";
    }else if(role.match(/^isp$|^ct.isp$/i)){
        return "isp/isp.html";
    }else if(role.match(/^lea$|^ct.lea$/i)){
        return HOST00+"/lea/home.html";
        //return "lea/lea_home.html";
    }else if(role.match(/^home_owner$|^homeowner$|^owner$|^ho$|^ct.ho$/i)) {
        //return "http://172.16.4.40:5000/smart_home_owner/home.html";
        return HOST00+"/smart_home_owner/home.html";
        //return "ho/home_owner.html";
    }
}
function dateSplitter(d, separator){
    var step1 = d.split(' ');
    var date = step1[0].split(separator).reverse();
    var time = step1[1].split(':');
    time.forEach(function(t){
        date.push(t);
    })
    date.forEach(function(d, pos){
        date[pos] = parseInt(d);
    });
    return date;
}
function dateFormatter(date){
    var d = new Date(date);
    var day = d.getDate();
    var month = d.getMonth() + 1;
    var year = d.getFullYear();
    if (day < 10) {
        day = "0" + day;
    }
    if (month < 10) {
        month = "0" + month;
    }
    var h = d.getHours();if (h < 10) {h = "0" + h;}
    var m = d.getMinutes();if (m < 10) {m = "0" + m;}
    var s = d.getSeconds();if (s < 10) {s = "0" + s;}
    var ms = d.getMilliseconds();if (ms < 10) {ms = "0" + ms;}
    var date = day + "/" + month + "/" + year + " " +h+":"+m+":"+s+":"+ms;
    return date;
}