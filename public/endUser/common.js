/**
 * Created by simone on 15/03/19.
 */

var mem ={};
if(window.sessionStorage.getItem('offlineData')){
    mem['data'] = JSON.parse(window.sessionStorage.getItem('offlineData'));
}
if(window.sessionStorage.getItem('getUtente')){
    mem['datiUtente'] = JSON.parse(window.sessionStorage.getItem('getUtente'));
}
$(document).ready(function() {
    if(mem['datiUtente']){
    }
});

function userList(){
    if(!mem['jmTableRow']){
        mem['jmTableRow'] = $("[jmTable=row]").clone(1,1);
    }
    $("[jmTable=boxRows]").empty();
    $.get(HOST+"/EM.getUserList", function(data){
        if(data['data'] && data['data']['data']){
            data['data']['data'].forEach(function(device){
                var $row = mem['jmTableRow'].clone(1,1);
                $.each(device, function(campo,valore) {
                    $("[jmTable="+campo+"]", $row).empty().append(valore);
                });
                if(device['device_info']){
                    if(device['device_info']['OS']){
                        $("[jmTable=os]", $row).empty().append(device['device_info']['OS']['os_name']+ " "+device['device_info']['OS']['version_release']);
                    }
                    if(device['device_info']['manufactorer']) {
                        $("[jmTable=manufacturer]", $row).empty().append(device['device_info']['manufacturer']);
                    }
                    if(device['device_info']['model']) {
                        $("[jmTable=model]", $row).empty().append(device['device_info']['model']);
                    }
                }

                $row.click(function(){
                    window.sessionStorage.setItem("device_id", device['_id']);
                    location.href='device_profile.html';
                });

                $("[jmTable=boxRows]").append($row);
            })
        }

    },'json');
}