
var mem = {};
var GaugeOpts = {
    angle: -0.2, // The span of the gauge arc
    lineWidth: 0.2, // The line thickness
    radiusScale: 1, // Relative radius
    pointer: {
        length: 0.6, // // Relative to gauge radius
        strokeWidth: 0.071, // The thickness
        color: '#000000' // Fill color
    },
    limitMax: 100,     // If false, max value increases automatically if value > maxValue
    limitMin: 0,     // If true, the min value of the gauge will be fixed
    //colorStart: '#6F6EA0',   // Colors
    //colorStop: '#C0C0DB',    // just experiment with them
    strokeColor: '#EEEEEE',  // to see which ones work best for you
    generateGradient: true,
    highDpiSupport: true,     // High resolution support
};
if(window.sessionStorage.getItem('userdata')){
    mem['userData'] = JSON.parse(window.sessionStorage.getItem('userdata'));
    console.log(mem['userData'] )
}
$(document).ready(function(){
    arm();
    displayGes();
    navigationAction();Action();
    loadTabelle()
    if(mem['userData']){
        $("#sohoName").empty().append("Home owner ");
        if(mem['userData']['firstname']){
            $("#sohoName").append(" - " + mem['userData']['firstname'] + " ");
        }
        if(mem['userData']['lastname']){
            $("#sohoName").append(mem['userData']['lastname'] + " ");
        }
    }
    fillUserData(mem['userData']['_id']);
    getSOHOUser();
});
//Dom elements "Arm" Function
function arm() {
    arm_profilingServices();
    $("#user_dob").datetimepicker({'timepicker': false, format: "d/m/Y"});
    $("[target]").click(function (event) {
        navigationAction($(this).attr('target'));
    });
    $("[dd_target]").click(function (event) {
        Action('dd', $(this).attr('dd_target'));
    });
    $("[st_target]").click(function (event) {
        Action('st', $(this).attr('st_target'));
    });
    $("[jmRefresh]").click(function () {
        loadTabelle($(this).attr("jmRefresh"));
    });
    $("[jmGraphRefresh]").click(function () {
    });
    $("[displayer]").click(function () {
        displayGes($(this).attr('displayLabel'), $(this).attr('displayMode'));
        $("[modifier]").hide();
        $("input").prop('disabled', true);
        $("[formAdd=false]").each(function (item) {
            $(this).show();
        });
    });
    $("[roleOption]").click(function (event) {
        $("#user_role").val($(this).attr('roleOption'));
    })
    $("[adder]").click(function (event) {
        $("#" + $(this).attr('adder') + "FormSubmit").show();
        $("[onlyShow]").hide();
        $("input").prop('disabled', false);
        $("[formAdd=false]").each(function (item) {
            $(this).hide();
        });
    });
    $("#addUserForm").ajaxForm({
        enctype: 'multipart/form-data', type: 'post', dataType: 'json', url: HOST + '/ADMIN.addUser', iframe: false,
        beforeSubmit: function () {
            //$("#loading").show();
        },
        success: function (data) {
            //$("#loading").hide();
            if (data.err) {
                alert("Error during the update operation.\nSee: " + JSON.stringify(data.err));
                //location.reload();
            } else {
                window.sessionStorage.setItem('userId', data['res']['data']['_id']);
                displayGes('users', 'show');
                loadTabelle('users')
            }
        }
    });
    $("#userFormSubmit").click(function (event) {
        $("#addUserForm").submit();
    });
    $("#userFormMod").click(function (event) {
        $("[toMod]").prop('disabled', false);
        $("#userFormMod").hide();
        $("#userFormSubmit").show();
        $("#userFormBack").show();
    });
    $("#userFormBack").click(function (event) {
        fillUserData(mem['userData']['_id']);
        $("#userFormMod").show();
        $("#userFormSubmit").hide();
        $("#userFormBack").hide();
    });

    /*$("#addDeviceForm").ajaxForm({
        enctype: 'multipart/form-data', type: 'post', dataType: 'json', url: HOST + '/EM.addDevice', iframe: false,

        beforeSubmit: function () {
            //$("#loading").show();
        },
        success: function (data) {
            //$("#loading").hide();
            if (data.err) {
                alert("Error during the update operation.\nSee: " + JSON.stringify(data.err));
                //location.reload();
            } else {
                window.sessionStorage.setItem('userId', data['res']['data']['_id']);
                displayGes('devices', 'list')
                loadTabelle('devices')
            }
        }
    });
    $("#deviceFormSubmit").click(function (event) {
        if (mem['userData']) {
            $("#device_userID").val(mem['userData']['_id']);
        }
        $("#addDeviceForm").submit();
    });
    */
    $(".graph-fluid").bind('heightChange', function () {
        //crawlerGL();
    });
    $("[modifier]").click(function (event) {
        $("input").prop('disabled', false);
    })

    sliderGauges();
    $("#patchSlider").change(function (event) {
        var value = $(this).val();
        if(value > 3){
        }
    });
    $("#changeImpact").click(function(event){
        event.stopPropagation();
        $("#impactModal").modal('show');
    })
    $("#confirmImpact").click(function(event){
        drawImpactGauge($("#impactSelect").val());
        updateImpact($("#impactSelect").val());
        $("#impactModal").modal('hide');
    })
    $("#mitigationApplication").click(function(event){
        applyMitigation();
    })
    $("#refreshNetwork").click(function(event){
        armNetwork();
    })
}
//
//Various//
function updateImpact(value){
    var data = mem['deviceData'][0];
    data['impact'] = {
        "value": value,
        "description": impactMap[value]
    };
    $.post(HOST+"/PS.patchDeviceImpact", {'_id':mem['deviceData']['_id'], value: value, data:data}, function(data){
        if(data.err){
            //alert("We encouter an internal error")
        }else{
            console.log(data);
        }
    }, 'json');
}
function navigationAction(target){
    if(!target){ //Da ora in poi, con 1 si identifica l'userId del singolo utente.
                // è una soluzione provvisoria, appena possibile aggiunger il dato nella login
        if(window.localStorage.getItem('homeTargetData') && JSON.parse(window.localStorage.getItem('homeTargetData'))[1]){
            target = JSON.parse(window.localStorage.getItem('homeTargetData'))[1];
        }else{
            target = 'dashData';
        }
    }
    var obj = {};
        obj[1] = target;
    window.localStorage.setItem('homeTargetData', JSON.stringify(obj));
    //Turn on/off the navigator button

    $("[target]").each(function(element){
        if($(this).attr('target') == target){
            $(this).addClass('active');
        }else{
            $(this).removeClass('active');
        }
    })
    //Show/hide the page
    $("[landing]").each(function(element){
        if($(this).attr('landing') == target){
            $(this).show();
        }else{
            $(this).hide();
        }
    })
    if(target == 'dashData'){
        var obj = {1:{mode:'dd', target:'tabDevices'}};
        window.localStorage.setItem('homeActionData', JSON.stringify(obj));
    }else{
        var obj = {1:{mode:'st', target:'tabNotification'}};
        window.localStorage.setItem('homeActionData', JSON.stringify(obj));
        $("canvas").attr('height', '150').attr('width', 300);
    }
    Action();
}
function Action(mode, target){
    if(!mode){
        if(window.localStorage.getItem('homeActionData') && JSON.parse(window.localStorage.getItem('homeActionData'))[1]){
            var dati = JSON.parse(window.localStorage.getItem('homeActionData'))[1];
            mode = dati['mode'];
            target = dati['target'];
        }else{
            mode = 'dd';
            target ='tabDevices';
        }
    }
    //Update..
    var obj = {1:{mode:mode, target:target}};
    window.localStorage.setItem('homeActionData', JSON.stringify(obj));
    //
    //Turn on/off the navigator button
    $("["+mode+"_target]").each(function(element){
        if($(this).attr(mode+'_target') == target){
            $(this).addClass('active');
        }else{
            $(this).removeClass('active');
        }
    });
    //Show/hide the page
    $("["+mode+"_landing]").each(function(element){
        if($(this).attr(mode+'_landing') == target){
            $(this).show();
        }else{
            $(this).hide();
        }
    });
    if(target == 'tabNetwork'){
        armNetwork();
    }else if(target == 'tabNotification'){
        sliderGauges();
    };
}
function loadTabelle(tabella){
    /*if(tabella == 'devices' || !tabella){
        $("#devicesTable").dataTable().fnDestroy();
        mem['tabDevices'] = $('#devicesTable').DataTable( {
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'copy',
                    text: '<i class="fa fa-file-o"></i> Copy data',
                    className: 'btn'
                },
                {
                    extend: 'csv',
                    text: '<i class="fa fa-file-text-o "></i> .CSV',
                    className: 'btn'
                },
                {
                    extend: 'excel',
                    text: '<i class="fa fa-file-excel-o"></i> .XLS',
                    className: 'btn'
                }          ,
                {
                    extend: 'pdf',
                    text: '<i class="fa fa-file-pdf-o"></i> .PDF',
                    className: 'btn'
                },
                {
                    extend: 'print',
                    text: '<i class="fa fa-print"></i> Print',
                    className: 'btn'
                },
            ],
            "ajax": {
                url: HOST+"/PS.getDeviceList",
                type: "POST",
                data : {'token' : mem['userData']['token'], 'owner_id' : mem['userData']['_id']},
                dataSrc: function(data) {
                    if (!data['data'] || !data['data'].length) {
                        return [];
                    } else {
                        return data.data;
                    }
                }
            },
            "processing" : true,
            "serverSide": true,
            "sortable"  :false,
            "columns": [
                {render: function (data, type, row) {
                    if(row['device_info']['manufacturer']){
                        return row['device_info']['manufacturer'] +" "+ row['device_info']['model'];
                    }else{
                        return '';
                    }
                }},
                { "data": "type","defaultContent": "<i>Not set</i>"},
                { "data": "description","defaultContent": "<i>Not set</i>"},
                {render: function (data, type, row) {
                    if(row['device_info']['os']['name'] != 'n/a'){
                        return row['device_info']['os']['name'] +" "+ row['device_info']['os']['version'];
                    }else{
                        return '';
                    }
                }},
            ],
            "initComplete": function(data){
                $('#devicesTable').on('click', 'tbody tr', function () {
                    var row = mem['tabDevices'].row($(this)).data();
                    fillDeviceData(row['_id'], 'owner');
                });
                $('#devicesTable_wrapper').attr('style','width:100%;')
            }
        });
    }
    */
    if(tabella == 'devices' || !tabella){
        SingleLoadingScreen('deviceList',true);
        $("#deviceList").hide();
        $("#deviceListRow").hide();
        $("#devicesTable").dataTable().fnDestroy();
        mem['tabDevices'] = $('#devicesTable').DataTable( {
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'copy',
                    text: '<i class="fa fa-file-o"></i> Copy data',
                    className: 'btn'
                },
                {
                    extend: 'csv',
                    text: '<i class="fa fa-file-text-o "></i> .CSV',
                    className: 'btn'
                },
                {
                    extend: 'excel',
                    text: '<i class="fa fa-file-excel-o"></i> .XLS',
                    className: 'btn'
                }          ,
                {
                    extend: 'pdf',
                    text: '<i class="fa fa-file-pdf-o"></i> .PDF',
                    className: 'btn'
                },
                {
                    extend: 'print',
                    text: '<i class="fa fa-print"></i> Print',
                    className: 'btn'
                },
            ],
            "ajax": {
                url: HOST+"/PS.getDeviceList",
                type: "POST",
                data : {'token' : mem['userData']['token'], 'owner_id' : mem['userData']['_id']},
                "dataSrc": function(data) {
                    if (!data['data'] || !data['data'].length) {
                        return [];
                    } else {
                        return data.data;
                    }
                }
            },
            "serverSide": true,
            "sortable"  :false,
            "columns": [
                { "data": "device_info.manufacturer","defaultContent": "<i>Not set</i>"},
                { "data": "device_info.model","defaultContent": "<i>Not set</i>"},
                { "data": "description","defaultContent": "<i>Not set</i>"},
                { "data": "type","defaultContent": "<i>Not set</i>"},
                {
                    render: function (data, type, row) {
                        var perc = row['trust_level']['value'] / 5 * 100;
                        if (perc >= 80) {
                            return '<div class="progress"><div class="progress-bar bg-success" role="progressbar" style="width: '+perc+'%" aria-valuenow="'+perc+'" aria-valuemin="0" aria-valuemax="5"></div> </div>';
                        }else if (perc >= 40) {
                            return '<div class="progress"><div class="progress-bar bg-warning" role="progressbar" style="width: '+perc+'%" aria-valuenow="'+row['trust_level']['value']+'" aria-valuemin="0" aria-valuemax="5"></div> </div>'
                        }else {
                            return '<div class="progress"><div class="progress-bar bg-danger" role="progressbar" style="width: '+perc+'%" aria-valuenow="'+row['trust_level']['value']+'" aria-valuemin="0" aria-valuemax="5"></div> </div>'
                        }
                    }
                },
                {
                    render: function (data, type, row) {
                        var perc = row['risk_level']['value'] / 5 * 100;
                        if (perc >= 60) {
                            return '<div class="progress"><div class="progress-bar bg-danger" role="progressbar" style="width: '+perc+'%" aria-valuenow="'+perc+'" aria-valuemin="0" aria-valuemax="5"></div> </div>';
                        }else if (perc >= 20) {
                            return '<div class="progress"><div class="progress-bar bg-warning" role="progressbar" style="width: '+perc+'%" aria-valuenow="'+row['trust_level']['value']+'" aria-valuemin="0" aria-valuemax="5"></div> </div>'
                        }else {
                            return '<div class="progress"><div class="progress-bar bg-success" role="progressbar" style="width: '+perc+'%" aria-valuenow="'+row['trust_level']['value']+'" aria-valuemin="0" aria-valuemax="5"></div> </div>'
                        }
                    }
                },
                {render: function (data, type, row) {
                    if(row['impact']){
                        var $obj = '<span class="badge badge-pill badge-'+row['impact']['description']+'" >'+row['impact']['description']+'</span>';
                        return $obj;
                    }else{
                        return '';
                    }

                }},
                {render: function (data, type, row) {
                    if(row['device_info']['os']['name'] != 'n/a'){
                        return row['device_info']['os']['name'] +" "+ row['device_info']['os']['version'];
                    }else{
                        return '';
                    }

                }},
                /*{
                 render: function (data, type, row) {
                 var perc = row['patch_level']['value'] / 5 * 100;
                 if (perc >= 80) {
                 return '<div class="progress"><div class="progress-bar bg-success" role="progressbar" style="width: '+perc+'%" aria-valuenow="'+perc+'" aria-valuemin="0" aria-valuemax="5"></div> </div>';
                 }else if (perc >= 40) {
                 return '<div class="progress"><div class="progress-bar bg-warning" role="progressbar" style="width: '+perc+'%" aria-valuenow="'+row['trust_level']['value']+'" aria-valuemin="0" aria-valuemax="5"></div> </div>'
                 }else {
                 return '<div class="progress"><div class="progress-bar bg-danger" role="progressbar" style="width: '+perc+'%" aria-valuenow="'+row['trust_level']['value']+'" aria-valuemin="0" aria-valuemax="5"></div> </div>'
                 }
                 }
                 },*/
            ],
            "initComplete": function(data){
                SingleLoadingScreen('deviceList',false);
                $("#deviceList").show();
                $("#deviceListRow").show();
                $('#devicesTable').unbind('click');
                $('#devicesTable').on('click', 'tbody tr', function () {
                    var row = mem['tabDevices'].row($(this)).data();
                    fillDeviceData(row['_id']);
                });
                $('#devicesTable_wrapper').attr('style','width:100%;')
            }
        });
    }
    if(tabella == 'alerts'  || !tabella){
        $("#alertsTable").dataTable().fnDestroy();
        mem['tabAlerts'] = $('#alertsTable').DataTable( {
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'copy',
                    text: '<i class="fa fa-file-o"></i> Copy data',
                    className: 'btn'
                },
                {
                    extend: 'csv',
                    text: '<i class="fa fa-file-text-o "></i> .CSV',
                    className: 'btn'
                },
                {
                    extend: 'excel',
                    text: '<i class="fa fa-file-excel-o"></i> .XLS',
                    className: 'btn'
                }          ,
                {
                    extend: 'pdf',
                    text: '<i class="fa fa-file-pdf-o"></i> .PDF',
                    className: 'btn'
                },
                {
                    extend: 'print',
                    text: '<i class="fa fa-print"></i> Print',
                    className: 'btn'
                },
            ],
            "processing": true,
            "ajax": {
                url: HOST+"/PS.getNotificationList",
                type: "POST",
                data: {username: mem['userData']['username']},
                "dataSrc": function(data) {
                    if (!data['data'] || !data['data'].length) {
                        return [];
                    } else {
                        $("#numberAlert").empty().append(data['recordsTotal']);
                        return data.data;
                    }
                }
            },
            "serverSide": true,
            "sortable"  :false,
            "columns": [
                { "data": "title","defaultContent": "<i>Not set</i>"},
                { "data": "data.threat_level","defaultContent": "<i>0</i>"},
                { "data": "data.type","defaultContent": "<i>Not set</i>"},
                { "data": "timestamp","defaultContent": "<i>Not set</i>"},
            ],
            "initComplete": function(data){
                $('#alertsTable').unbind('click');
                $('#alertsTable').on('click', 'tbody tr', function () {
                    var row = mem['tabAlerts'].row($(this)).data();
                    fillNotificationData(row['_id']);
                });
                $('#alertsTable_wrapper').attr('style','width:100%;')
            }
        });

    }
    if(tabella == 'mitigations'  || !tabella){
        $("#mitigationsTable").dataTable().fnDestroy();
        mem['tabMitigations'] = $('#mitigationsTable').DataTable( {
            dom: 'Bfrtip',
            buttons: [
                {
                    extend: 'copy',
                    text: '<i class="fa fa-file-o"></i> Copy data',
                    className: 'btn'
                },
                {
                    extend: 'csv',
                    text: '<i class="fa fa-file-text-o "></i> .CSV',
                    className: 'btn'
                },
                {
                    extend: 'excel',
                    text: '<i class="fa fa-file-excel-o"></i> .XLS',
                    className: 'btn'
                }          ,
                {
                    extend: 'pdf',
                    text: '<i class="fa fa-file-pdf-o"></i> .PDF',
                    className: 'btn'
                },
                {
                    extend: 'print',
                    text: '<i class="fa fa-print"></i> Print',
                    className: 'btn'
                },
            ],
            "processing": true,
            "ajax": {
                url: HOST+"/PS.getMitigationList",
                type: "POST",
                data: {username: mem['userData']['username']},
                "dataSrc": function(data) {
                    if (!data['data'] || !data['data'].length) {
                        return [];
                    } else {
                        var listaMitigation = [];
                        data['data'].forEach(function(mitigation){
                            mitigation['nhosts'] = mitigation['affected_hosts'].length;
                            mitigation['nrules'] = mitigation['mitigation']['rules'].length;
                          listaMitigation.push(mitigation);
                        })
                        data['data'] = listaMitigation;
                        return data.data;
                    }
                }
            },
            "serverSide": true,
            "sortable"  :false,
            "columns": [
                { "data": "nhosts","defaultContent": "<i>Not set</i>"},
                { "data": "nrules","defaultContent": "<i>0</i>"},
                { "data": "status","defaultContent": "<i>Not set</i>"},
                { "data": "timestamp","defaultContent": "<i>Not set</i>"},
            ],
            "initComplete": function(data){
                $('#mitigationsTable').unbind('click');
                $('#mitigationsTable').on('click', 'tbody tr', function () {
                    var row = mem['tabMitigations'].row($(this)).data();
                    fillMitigationData(row['_id']);
                });
                $('#mitigationsTable_wrapper').attr('style','width:100%;')
            }
        });

    }
}
function displayGes(label, mode){
    if(!label && !mode){
        $("[mode]").each(function(element){
            if($(this).attr('mode') == 'list'){
                $(this).show();
            }else{
                $(this).hide();
            }
        })
        bcReset('list');
        formReset();
    }else{
        $("[label="+label+"]").each(function(element){
            if($(this).attr('mode') == mode){
                $(this).show();
            }else{
                $(this).hide();
            }
        })
        bcReset(mode);
        formReset();
    }
}
function bcReset(mode){
    if(mode == 'list'){
        $("[bcAppend]").each(function(element){
            $(this).remove();
        })
    }
}
function formReset(){
    $("form").each(function(element){
       $(this).resetForm();
    });
    $("[disabled]").each(function(element){
        $(this).prop('disabled', false);
    })
}
function fillData(target, id){
    if(target == 'users'){
        $.post(HOST+"/ADMIN.getUserList", {'_id':id}, function(data){
            if(data.err){
                alert("We encouter an internal error")
            }else{
                displayGes('users', 'form')
                //Add Breadcrumb
                $("#breadcrumbUsers").append($('<li bcAppend class="active"><a href="javascript:void(0);">'+data['data'][0]['firstname']+' '+data['data'][0]['lastname']+'</a></li>'));
                //Clear Data
                $("#addUserForm").trigger('reset');
                //Fill in user data
                $("#user_name").val(data['data'][0]['firstname']).prop('disabled', true);
                $("#user_surname").val(data['data'][0]['lastname']).prop('disabled', true);
                $("#user_dob").val(data['data'][0]['dateofbirth']).prop('disabled', true);
                $("#user_email").val(data['data'][0]['email']).prop('disabled', true);
                $("#user_telephone").val(data['data'][0]['telephone']).prop('disabled', true);
                $("#user_role_button").prop('disabled', true);
                if(data['data'][0]['roles']){
                    $("#user_role").val(data['data'][0]['roles'].join(", ")).prop('disabled', true);
                }
                $("#user_username").val(data['data'][0]['username']).prop('disabled', true);
                $("#user_password").val(data['data'][0]['password'].replace(/[a-z]|[0-9]/gi,"*")).prop('disabled', true);
                $("#userFormSubmit").hide();
            }
        }, 'json');
        $("[modifier][displayLabel=users]").show();
    }
    if(target == 'devices'){
        displayGes('devices', 'form')
        var data = id;
        //Add Breadcrumb
        $("#breadcrumbDevices").append($('<li bcAppend class="active"><a href="javascript:void(0);">'+data['device_info']['manufacturer']+" "+data['device_info']['model']+'</a></li>'));
        //Clear Data
        $("#addDeviceFormForm").trigger('reset');
        //Fill in user data
        $("#device_description").val(data['description']).prop('disabled', true);
        $("#device_CPE").val(data['CPE']).prop('disabled', true);
        $("#device_type").val(data['type']).prop('disabled', true);
        $("#device_os").val(data['device_info']['OS']['os_name']).prop('disabled', true);
        $("#device_version").val(data['device_info']['OS']['version']).prop('disabled', true);
        $("#device_sdk").val(data['device_info']['OS']['sdk']).prop('disabled', true);
        $("#device_manufacturer").val(data['device_info']['manufacturer']).prop('disabled', true);
        $("#device_model").val(data['device_info']['model']).prop('disabled', true);
        $("#device_hwId").val(data['device_info']['hardware_id']).prop('disabled', true);

        if(data['patch']){
            if(data['patch']['patching_status']){
                $("#patchStatus").val('Updated').removeClass('text-warning').addClass('text-success').prop('disabled', true);
            }else{
                $("#patchStatus").val('Outdated').removeClass('text-success').addClass('text-warning').prop('disabled', true);
            }

            $("#patch_version").val(data['patch']['version']).prop('disabled', true);
            $("#update_date").val(data['patch']['timestamp']).prop('disabled', true);

        }

        $("#deviceFormSubmit").hide();
    }
    if(target == 'cves'){
        displayGes('cves', 'form');
        var data = id;
        //Add Breadcrumb
        $("#breadcrumbCVE").append($('<li bcAppend class="active"><a href="javascript:void(0);">'+data['CVE']+'</a></li>'));
        //Clear Data
        $("#cveForm").trigger('reset');
        //Fill in user data
        $("#cve_id").val(data['cveId']).prop('disabled', true);
        $("#cve_CVE").val(data['CVE']).prop('disabled', true);
        $("#cve_cvss-score").val(data['CVSSscore']).prop('disabled', true);
        $("#cve_cvss-string").val(data['CVSSstring']).prop('disabled', true);

        $("#cve_creditSource").val(data['CreditSource']).prop('disabled', true);
        $("#cve_summary").val(data['Summary']).prop('disabled', true).attr('style','height: '+$("#cve_summary").get(0).scrollHeight+'px');
        $("#cve_description").val(data['Description']).prop('disabled', true).attr('style','height: '+$("#cve_description").get(0).scrollHeight+'px');
        if(Object.keys(data['References']) && Object.keys(data['References']).length > 0){
            if(!mem["refObj_clone"]){
                mem["refObj_clone"] = $("[obj_to_clone=reference]").clone(1,1);
            }
            $("#referenceContainer").empty();
            Object.keys(data['References']).forEach(function(reference, pos){
                var $obj = mem["refObj_clone"].clone(1,1);
                $("[referencePos]",$obj).empty().append(pos+1);
                $("[referenceRef]",$obj).val(reference).prop('disabled', true).css('width', reference.length*3);
                $("#referenceContainer").append($obj);
            })
        }
        if(Object.keys(data['VulnerableConfigurations']) && Object.keys(data['VulnerableConfigurations']).length > 0){
            if(!mem["configObj_clone"]){
                mem["configObj_clone"] = $("[obj_to_clone=config]").clone(1,1);
            }
            $("#configContainer").empty();
            Object.keys(data['VulnerableConfigurations']).forEach(function(reference, pos){
                var $obj = mem["configObj_clone"].clone(1,1);
                $("[configPos]",$obj).empty().append(pos+1);
                $("[configRef]",$obj).val(reference).prop('disabled', true).css('width', reference.length);
                $("#configContainer").append($obj);
            })
        }

        $("#cveFormSubmit").hide();
    }
    if(target == 'alerts'){
        displayGes('alerts', 'form');
        var data = id;
        //Add Breadcrumb
        $("#breadcrumbAlerts").append($('<li bcAppend class="active"><a href="javascript:void(0);">'+data['device']+' / '+ data['reason']['rule_id']+'</a></li>'));
        //Clear Data
        $("#alertform").trigger('reset');
        //Fill in user data
        $("#alert_devDescription").val(data['device']).prop('disabled', true);
        $("#alert_devType").val(data['deviceType']).prop('disabled', true);
        $("#alert_devOwner").val(data['user']).prop('disabled', true);
        $("#alert_rule").val(data['reason']['rule_id']).prop('disabled', true);
        $("#alert_timestamp").val(data['timesTamp']).prop('disabled', true);

        if(data['metadata']){
            if(data['metadata']['cpu_usage']){
                var target = document.getElementById('alertCPU'); // your canvas element
                var value = data['metadata']['cpu_usage'].toFixed(2);
                var opt = GaugeOpts;
                opt['staticZones'] =[
                    {strokeStyle: "#F03E3E", min: 0, max: value}, // Red from 100 to 130
                    {strokeStyle: "#30B32D", min: value, max: 100}, // Green
                ];
                var gauge = new Gauge(target).setOptions(opt); // create sexy gauge!
                gauge.maxValue = 100; // set max gauge value
                gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
                gauge.animationSpeed = 32; // set animation speed (32 is default value)
                gauge.set(value); // set actual value
                $("#labelCPU").empty().append('CPU usage:</br> '+ value + '%')
            }
            if(data['metadata']['ext_stor']){
                var target = document.getElementById('alertEXT'); // your canvas element
                var value = data['metadata']['ext_stor'].toFixed(2);
                var opt = GaugeOpts;
                opt['staticZones'] =[
                    {strokeStyle: "#F03E3E", min: 0, max: value}, // Red from 100 to 130
                    {strokeStyle: "#30B32D", min: value, max: 100}, // Green
                ];
                var gauge = new Gauge(target).setOptions(opt); // create sexy gauge!
                gauge.maxValue = 100; // set max gauge value
                gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
                gauge.animationSpeed = 32; // set animation speed (32 is default value)
                gauge.set(value); // set actual value
                $("#labelEXT").empty().append('External storage usage:</br> '+ value + '%')
            }
            if(data['metadata']['int_stor']){
                var target = document.getElementById('alertINT'); // your canvas element
                var value = data['metadata']['int_stor'].toFixed(2);
                var opt = GaugeOpts;
                opt['staticZones'] =[
                    {strokeStyle: "#F03E3E", min: 0, max: value}, // Red from 100 to 130
                    {strokeStyle: "#30B32D", min: value, max: 100}, // Green
                ];
                var gauge = new Gauge(target).setOptions(opt); // create sexy gauge!
                gauge.maxValue = 100; // set max gauge value
                gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
                gauge.animationSpeed = 32; // set animation speed (32 is default value)
                gauge.set(value); // set actual value
                $("#labelINT").empty().append('Internal storage usage:</br> '+ value + '%')
            }
            if(data['metadata']['mem_usage']){
                var target = document.getElementById('alertMEM'); // your canvas element
                var value = data['metadata']['mem_usage'].toFixed(2);
                var opt = GaugeOpts;
                opt['staticZones'] =[
                    {strokeStyle: "#F03E3E", min: 0, max: value}, // Red from 100 to 130
                    {strokeStyle: "#30B32D", min: value, max: 100}, // Green
                ];
                var gauge = new Gauge(target).setOptions(opt); // create sexy gauge!
                gauge.maxValue = 100; // set max gauge value
                gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
                gauge.animationSpeed = 32; // set animation speed (32 is default value)
                gauge.set(value); // set actual value
                $("#labelMEM").empty().append('Memory usage:</br> '+ value + '%')
            }
        }
        $("#alertsFormSubmit").hide();
    }
}
function getSOHOUser(){
    sliderGauges()
    $.post(HOST+"/PS.getSmartHomeList", {'owner':mem['userData']['_id']}, function(data){
        if(data.err){
            alert("We encouter an internal error")
        }else{
            getNetworkData(data['data'][0])
            mem['sohoData'] = data['data'][0];
            $("[name=smarthome_id]").val(data['data'][0]['_id']);
            var cost = data['data'][0]['config']['irg']['cost'];
            $("#patchSlider").slider({'value': cost['patch']}).slider('refresh', { useCurrentValue: false });
            drawGaugeSliderPatch(cost['patch']);
            $("#firewallSlider").slider({'value': cost['firewall']}).slider('refresh', { useCurrentValue: false });
            drawGaugeFirewall(cost['firewall']);
            var ire = data['data'][0]['config']['ire'];
            mem['availability'] =  ire['sa_tradeoff'];
            $("#availabilitySlider").slider({
                'value': ire['sa_tradeoff'],
                min: 0,
                max:1,
                step:0.1,
                ticks_snap_bounds: 10,
                id : 'availabilitySlider',
            })
                .slider('refresh', { useCurrentValue: false })
                .change(function(event){
                    drawGaugeSliderAvailability($(this).val());
                    mem['availability'] =  $(this).val();
                })
            drawGaugeSliderAvailability(ire['sa_tradeoff']);
            $("#performanceSlider").slider({'value': ire['sp_tradeoff']}).slider('refresh', { useCurrentValue: false });
            drawSliderPerformance(ire['sp_tradeoff']);
            mem['automode'] =  ire['auto_mode'];
            if(ire['auto_mode'] == 0){
                $('#automodeTrigger').bootstrapToggle('off')
            }else{
                $('#automodeTrigger').bootstrapToggle('on')
            }
            $('#automodeTrigger').change(function() {
                mem['automode'] =  $(this).prop('checked');
            })
        }
    }, 'json');
}

function graphStorage(){
    pies();
    timeSeries();
    lines();
}
function pies(){
    var pages = {
        type: 'pie',
        data: {
            datasets: [{
                data: [
                    2875,
                    1087
                ],
                backgroundColor: [
                    'red',
                    'green'
                ],
                label: 'Analyzed pages'
            }],
            labels: [
                'non-relevant',
                'relevant'
            ]
        },
        options: {
            responsive: true
        }
    };
    var ctx  = $('#AnalyzedPages')[0].getContext('2d');
    ctx.canvas.width = parseFloat($('#AnalyzedPages').width() * 0.8);
    ctx.canvas.height = parseFloat($('#AnalyzedPages').height()*0.6);
    var chart = new Chart(ctx, pages);
}
function timeSeries(){
    var dateFormat = 'MMMM DD YYYY';
    var baseDate = moment('September 25 2019', dateFormat);
    var date = baseDate;
    var faileddata = [randomBar(date, 30)];
    while (faileddata.length < 60) {
        date = date.clone().add(1, 'd');
        if (date.isoWeekday() <= 5) {
            faileddata.push(randomBar(date, faileddata[faileddata.length - 1].y));
        }
    }
    var date = baseDate;
    var successfuldata = [randomBar(date, 30)];
    while (successfuldata.length < 60) {
        date = date.clone().add(1, 'd');
        if (date.isoWeekday() <= 5) {
            successfuldata.push(randomBar(date, successfuldata[successfuldata.length - 1].y));
        }
    }
    var color = Chart.helpers.color;
    var cfg = {
        type: 'bar',
        data: {
            datasets: [{
                label: "Failed request",
                backgroundColor: color('red').alpha(0.5).rgbString(),
                borderColor: 'red',
                data: faileddata,
                type: 'bar',
                pointRadius: 0,
                fill: false,
                lineTension: 0,
                borderWidth: 2
            },
            {
                label: "Successful request",
                backgroundColor: color('green').alpha(0.5).rgbString(),
                borderColor: 'green',
                data: successfuldata,
                type: 'bar',
                pointRadius: 0,
                fill: false,
                lineTension: 0,
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'time',
                    distribution: 'series',
                    ticks: {
                        source: 'data',
                        autoSkip: true
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Number of request'
                    }
                }]
            },
            tooltips: {
                intersect: false,
                mode: 'index',
                callbacks: {
                    label: function(tooltipItem, myData) {
                        var label = myData.datasets[tooltipItem.datasetIndex].label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += parseFloat(tooltipItem.value).toFixed(2);
                        return label;
                    }
                }
            }
        }
    };
    var ctx = $("#request")[0].getContext('2d');
    //ctx.canvas.width = parseFloat($('#request').height() * 0.8);
    ctx.canvas.height = parseFloat($('#request').height() * 0.5);
    var chart = new Chart(ctx, cfg);
}
function lines(){
    var dateFormat = 'MMMM DD YYYY';
    var baseDate = moment('September 25 2019', dateFormat);
    var date = baseDate;
    var download = [randomBar(date, 30)];
    while (download.length < 60) {
        date = date.clone().add(1, 'd');
        if (date.isoWeekday() <= 5) {
            download.push(randomBar(date, download[download.length - 1].y));
        }
    }

    var color = Chart.helpers.color;
    var cfg = {
        type: 'line',
        data: {
            datasets: [{
                label: "Downloads",
                backgroundColor: color('blue').alpha(0.5).rgbString(),
                borderColor: 'blue',
                data: download,
                type: 'line',
                pointRadius: 0,
                fill: false,
                lineTension: 0,
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'time',
                    distribution: 'series',
                    ticks: {
                        source: 'data',
                        autoSkip: true
                    }
                }],
                yAxes: [{
                    scaleLabel: {
                        display: true,
                        labelString: 'Number of downloads'
                    }
                }]
            },
            tooltips: {
                intersect: false,
                mode: 'index',
                callbacks: {
                    label: function(tooltipItem, myData) {
                        var label = myData.datasets[tooltipItem.datasetIndex].label || '';
                        if (label) {
                            label += ': ';
                        }
                        label += parseFloat(tooltipItem.value).toFixed(2);
                        return label;
                    }
                }
            }
        }
    };
    var ctx = $("#downloads")[0].getContext('2d');
    //ctx.canvas.width = parseFloat($('#downloads').parent().width());
    ctx.canvas.height = parseFloat($('#downloads').height()*0.7);
    var chart = new Chart(ctx, cfg);
}
function randomNumber(min, max) {
    return Math.random() * (max - min) + min;
}
function randomBar(date, lastClose) {
    var open = randomNumber(lastClose * 0.95, lastClose * 1.05).toFixed(2);
    var close = randomNumber(open * 0.95, open * 1.05).toFixed(2);
    return {
        t: date.valueOf(),
        y: close
    };
}
function updateTextInput(value, mode){
    var labels = ['deactivate', 'normal', 'verbose'];
    $("#"+mode+"Bold").empty().append(labels[value]);
}
function sliderGauges(){
    $("#patchSlider").slider({
        tooltip: 'hide',
        ticks: [0, 1, 2, 3, 4, 5],
        ////ticks_labels: [0, 1, 2, 3, 4, 5],
        ticks_snap_bounds: 3
    });
    $("#patchSlider").change(function(event){
        drawGaugeSliderPatch($(this).val());
    })
    $("#firewallSlider").slider({
        tooltip: 'hide',
        ticks: [0, 1, 2, 3, 4, 5],
        //ticks_labels: [0, 1, 2, 3, 4, 5],
        ticks_snap_bounds: 3
    });
    $("#firewallSlider").change(function(event){
        drawGaugeFirewall($(this).val());
    })
    $("#availabilitySlider").slider({
        tooltip: 'hide',
        min: 0,
        max:1,
        step:0.1,
        ticks_snap_bounds: 10,
        id : 'availabilitySlider',
    }).change(function(event){
        drawGaugeSliderAvailability($(this).val());
    })
    $("#performanceSlider").slider({
        tooltip: 'hide',
        ticks: [0, 1, 2, 3, 4, 5],
        //ticks_labels: [0, 1, 2, 3, 4, 5],
        ticks_snap_bounds: 3
    });
    $("#performanceSlider").change(function(event){
        drawSliderPerformance($(this).val());
    })
    drawGaugeSliderPatch(0);
    drawGaugeFirewall(0);
    drawGaugeSliderAvailability(0);
    drawSliderPerformance(0);
}
function drawGaugeSliderPatch(value){
    var opts = {
        angle: 0, // The span of the gauge arc
        lineWidth: 0.12, // The line thickness
        radiusScale: 1, // Relative radius
        pointer: {
            length: 0.51, // // Relative to gauge radius
            strokeWidth: 0.031, // The thickness
            color: '#000000' // Fill color
        },
        limitMax: false,     // If false, max value increases automatically if value > maxValue
        limitMin: false,     // If true, the min value of the gauge will be fixed
        generateGradient: true,
        highDpiSupport: true,     // High resolution support
        // renderTicks is Optional
        renderTicks: {
            divisions: 5,
            divWidth: 2.4,
            divLength: 1,
            //divColor: '#333333',
            subDivisions: 0,
            subLength: 1,
            subWidth: 0.6,
            //subColor: '#666666'
        },
        staticZones: [
            {strokeStyle: "#30B32D", min: 0, max: 1}, // Green from 100 to 130
            {strokeStyle: "#FFDD00", min: 1, max: 3}, // Yellow
            {strokeStyle: "#F03E3E", min: 3, max: 5} // Red
        ],
        staticLabels: {
            font: "10px sans-serif",  // Specifies font
            labels: [1, 2, 3, 4, 5],  // Print labels at these values
            color: "#000000",  // Optional: Label text color
            fractionDigits: 0  // Optional: Numerical precision. 0=round off.
        },


    }
    var target = document.getElementById('gaugeSliderPatch');
    var gauge = new Gauge(target).setOptions(opts);
    gauge.maxValue = 5; // set max gauge value
    gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
    gauge.set(value); // set actual value
}
function drawGaugeFirewall(value){
    var opts = {
        angle: 0, // The span of the gauge arc
        lineWidth: 0.12, // The line thickness
        radiusScale: 1, // Relative radius
        pointer: {
            length: 0.51, // // Relative to gauge radius
            strokeWidth: 0.031, // The thickness
            color: '#000000' // Fill color
        },
        limitMax: false,     // If false, max value increases automatically if value > maxValue
        limitMin: false,     // If true, the min value of the gauge will be fixed
        generateGradient: true,
        highDpiSupport: true,     // High resolution support
        // renderTicks is Optional
        renderTicks: {
            divisions: 5,
            divWidth: 2.4,
            divLength: 1,
            //divColor: '#333333',
            subDivisions: 0,
            subLength: 1,
            subWidth: 0.6,
            //subColor: '#666666'
        },
        staticZones: [
            {strokeStyle: "#30B32D", min: 0, max: 2}, // Green from 100 to 130
            {strokeStyle: "#FFDD00", min: 2, max: 3}, // Yellow
            {strokeStyle: "#F03E3E", min: 3, max: 5} // Red
        ],
        staticLabels: {
            font: "10px sans-serif",  // Specifies font
            labels: [1, 2, 3, 4, 5],  // Print labels at these values
            color: "#000000",  // Optional: Label text color
            fractionDigits: 0  // Optional: Numerical precision. 0=round off.
        },


    }
    var target = document.getElementById('gaugeSliderFirewall');
    var gauge = new Gauge(target).setOptions(opts);
    gauge.maxValue = 5; // set max gauge value
    gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
    gauge.set(value); // set actual value
}
function drawGaugeSliderAvailability(value){
    var opts = {
        angle: 0, // The span of the gauge arc
        lineWidth: 0.12, // The line thickness
        radiusScale: 1, // Relative radius
        pointer: {
            length: 0.51, // // Relative to gauge radius
            strokeWidth: 0.031, // The thickness
            color: '#000000' // Fill color
        },
        limitMax: false,     // If false, max value increases automatically if value > maxValue
        limitMin: false,     // If true, the min value of the gauge will be fixed
        generateGradient: true,
        highDpiSupport: true,     // High resolution support
        // renderTicks is Optional
        renderTicks: {
            divisions: 10,
            divWidth: 2.4,
            divLength: 1,
            //divColor: '#333333',
            subDivisions: 0,
            subLength: 1,
            subWidth: 0.6,
            //subColor: '#666666'
        },
        staticZones: [
            {strokeStyle: "#F03E3E", min: 0, max: 0.4}, // Red from 100 to 130
            {strokeStyle: "#FFDD00", min: 0.4, max: 0.8}, // Yellow
            {strokeStyle: "#30B32D", min: 0.8, max: 1} // Green
        ],
        staticLabels: {
            font: "10px sans-serif",  // Specifies font
            labels: [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1],  // Print labels at these values
            color: "#000000",  // Optional: Label text color
            fractionDigits: 1  // Optional: Numerical precision. 0=round off.
        }
    }
    var target = document.getElementById('gaugeSliderAvailability');
    var gauge = new Gauge(target).setOptions(opts);
    gauge.maxValue = 1; // set max gauge value
    gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
    gauge.set(value); // set actual value
}
function drawSliderPerformance(value){
    var opts = {
        angle: 0, // The span of the gauge arc
        lineWidth: 0.12, // The line thickness
        radiusScale: 1, // Relative radius
        pointer: {
            length: 0.51, // // Relative to gauge radius
            strokeWidth: 0.031, // The thickness
            color: '#000000' // Fill color
        },
        limitMax: false,     // If false, max value increases automatically if value > maxValue
        limitMin: false,     // If true, the min value of the gauge will be fixed
        generateGradient: true,
        highDpiSupport: true,     // High resolution support
        // renderTicks is Optional
        renderTicks: {
            divisions: 5,
            divWidth: 2.4,
            divLength: 1,
            //divColor: '#333333',
            subDivisions: 0,
            subLength: 1,
            subWidth: 0.6,
            //subColor: '#666666'
        },
        staticZones: [
            {strokeStyle: "#F03E3E", min: 0, max: 2}, // Red from 100 to 130
            {strokeStyle: "#FFDD00", min: 2, max: 4}, // Yellow
            {strokeStyle: "#30B32D", min: 4, max: 5} // Green
        ],
        staticLabels: {
            font: "10px sans-serif",  // Specifies font
            labels: [1, 2, 3, 4, 5],  // Print labels at these values
            color: "#000000",  // Optional: Label text color
            fractionDigits: 0  // Optional: Numerical precision. 0=round off.
        },


    }
    var target = document.getElementById('gaugeSliderPerformance');
    var gauge = new Gauge(target).setOptions(opts);
    gauge.maxValue = 5; // set max gauge value
    gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
    gauge.set(value); // set actual value
}