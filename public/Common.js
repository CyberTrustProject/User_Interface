/**
 * Created by simone on 14/03/19.
 */
var mem = {};
    mem['loading'] = 1;
$(document).ready(function() {
    $("#logoutUser").click(function(event){
        location.href = "../index.html";
    })
    $("[data-toggle=tab]").click(function(event){
        displayGes('reset');
    })
    displayTime();
});
function displayTime() {
    var time = moment().format('ddd, MMM Do YYYY, HH:mm:ss');
    $('#clock').html(time);
    setTimeout(displayTime, 1000);
}
function displayGes(tipo, modo){
    if($("[jm"+tipo+"=lista]").is(":visible") || modo == 'showData'){

        $("[jm"+tipo+"=lista]").hide();
        $("[jm"+tipo+"=dati]").show();
        $("[jm"+tipo+"=add]").hide();
    }else{

        $("[jm"+tipo+"=lista]").show();
        $("[jm"+tipo+"=dati]").hide();
        $("[jm"+tipo+"=add]").hide();
    }
    //Se stiamo aggiungendo elementi nuovi
    if(modo == 'add'){
        $("[jm"+tipo+"=lista]").hide();
        $("[jm"+tipo+"=dati]").hide();
        $("[jm"+tipo+"=add]").show();
    }
    if(tipo == 'reset'){
        $("[jmUsers=lista]").show();
        $("[jmDevices=lista]").show();
        $("[jmRules=lista]").show();
        $("[jmAlerts=lista]").show();

        $("[jmUsers=dati]").hide();
        $("[jmDevices=dati]").hide();
        $("[jmRules=dati]").hide();
        $("[jmAlerts=dati]").hide();

        $("[jmUsers=add]").hide();
        $("[jmDevices=add]").hide();
    }
}
function fillData(tipo, data){
    if(tipo == 'users'){
        $("#bc_username").empty().append(data['firstname'] + " " + data['lastname']);
    }else if(tipo == 'devices'){
        $("#bc_device").empty().append(data['device_info']['manufacturer'] + " " + data['device_info']['model']);
    }else if(tipo == 'rules'){
        $("#bc_rule").empty().append(data['id']);
    }else if(tipo == 'alerts'){
        $("#bc_alerts").empty().append(data['_id']);
    }
    $("[jm"+tipo+"=lista]").hide();
    $("[jmDataMod]").hide();
    Object.keys(data).forEach(function(key){
        $("[jmDataShow="+key+"]").empty().append(data[key]);
        $("[jmDataMod="+key+"]").val(data[key]);
    });
    if(tipo == 'devices'){
        Object.keys(data['device_info']).forEach(function(key){
            $("[jmDataShow="+key+"]").empty().append(data['device_info'][key]);
            $("[jmDataMod="+key+"]").val(data['device_info'][key]);
        });
        Object.keys(data['device_info']['OS']).forEach(function(key){
            $("[jmDataShow="+key+"]").empty().append(data['device_info']['OS'][key]);
            $("[jmDataMod="+key+"]").val(data['device_info']['OS'][key]);
        });
    }
    if(tipo == 'rules'){
        $("[jmDataShow=device_types]").empty().append(data['device_type'].join(", "));
        if(!mem['condition_clone']){
            mem['condition_clone'] = $("[jmDataShow=condition]").clone();
        }
        //$("#conditionList").empty();
        data['condition'].forEach(function(condizione){
            var $obj = mem['condition_clone'].clone(1,1);
            var $cond = $("<label>"+condizione['terms'][0]['key']+"<label><i>"+decodeOperator(condizione['terms'][0]['operator'])+"</i>  <label>"+condizione['terms'][0]['value']+"</label> <b>"+condizione['logical_operator']+"</b> <label>"+condizione['terms'][1]['key']+"<label> <i>"+decodeOperator(condizione['terms'][1]['operator'])+"</i>  <label>"+condizione['terms'][1]['value']+"</label>");
            $obj.append($cond);
            $("#conditionList").append($obj);
        });
    }
    if(tipo == 'alerts'){
        Object.keys(data).forEach(function(key){
            $("[jmDataShow="+key+"]").empty().append(data[key]);
            $("[jmDataMod="+key+"]").val(data[key]);
        });
        Object.keys(data['metadata']).forEach(function(key){
            $("[jmDataShow="+key+"]").empty().append(data['metadata'][key].toFixed(2)+ "%");
            $("[jmDataMod="+key+"]").val(data['metadata'][key].toFixed(2)+ "%");
        });
    }
    if(tipo == 'cves'){
        Object.keys(data).forEach(function(key){
            $("[jmDataShow='"+key+"']").empty().append(data[key]);
            $("[jmDataMod='"+key+"']").val(data[key]);
        });
        if(Object.keys(data['VulnerableConfigurations']).length > 0){
            if(!mem['opt_vc']){
                mem['opt_vc'] = $("[jmDataShow=entryVC]").clone(1,1);
            }
            $("#boxVC").empty();
            Object.keys(data['VulnerableConfigurations']).forEach(function(vc){
                var $obj = mem['opt_vc'].clone(1,1);
                $obj.empty().append(vc);
                $("#boxVC").append($obj);
            })
        }
        if(Object.keys(data['References']).length > 0){
            if(!mem['opt_ref']){
                mem['opt_ref'] = $("[jmDataShow=entryRef]").clone(1,1);
            }
            $("#boxRef").empty();
            Object.keys(data['References']).forEach(function(ref){
                var $obj = mem['opt_ref'].clone(1,1);
                $obj.empty().append(ref);
                $("#boxRef").append($obj);
            })
        }
    }
}
function decodeOperator(operator){
    var decode = {
        'greater_than': ">"
    };

    if(decode[operator]){
        return decode[operator];
    }else{
        return operator;
    }
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
