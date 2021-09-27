var impactMap = {
    1 : 'Negligible',
    2 : 'Minor',
    3 : 'Normal',
    4 : 'Severe',
    5 : 'Catastrophic'
}
function arm_profilingServices(){
    if(!mem['userData']){mem['userData'] = {}}
    $("#user_dateofbirth").datetimepicker({
        'timepicker':false,
        //maxDate: '01/01/2002',
        defaultDate: '1980-01-01',
        format: "Y-m-d"
    });
    $("[roleOption]").click(function(event){
        event.stopPropagation();
        $("#user_roles").val($(this).attr('roleOption'));
    })
    $("#addUser").click(function(event){
        event.stopPropagation();
        $("[formRead=false]").each(function (item) {
            $(this).show();
        });
        $("[formAdd=false]").each(function (item) {
            $(this).hide();
        });
        $("#userFormSubmit").resetForm().show();
        $("#user_dateofbirth").val('01/01/1980');
    })
    $("#addUserForm").off().ajaxForm({
        enctype: 'multipart/form-data', type: 'post', dataType: 'json', url: HOST + '/PS.addUser', data : {token:mem['userData']['token']}, iframe: false,
        beforeSubmit: function () {
            loadingScreen(true);
        },
        success: function (data) {
            if (data.err) {
                $("#loading").hide();
                alert("Error during the update operation.\nSee: "+JSON.stringify(data.err));
                //location.reload();
            } else {
                if($("#addUserForm").attr('new')){
                    oAuthLogin($("#user_username").val(), $("#user_password").val());
                }else {
                    $("#loading").hide();
                    window.sessionStorage.setItem('userId', data['res']['data']['_id']);
                    displayGes('users', 'list');
                    loadTabelle('users')
                }
            }
            loadingScreen(false);
        }
    });
    $("#userFormSubmit").off().click(function(event){
        event.stopPropagation();
        $("[name=token]", "#addUserForm").val(mem['userData']['token']);
        validateForm('addUserForm', function(response){
            if(response){
                //if($("#policy").prop('checked')){
                    $("#addUserForm").submit();
                //}else{
                 //   alert("Please read and accept the 'Data Protection Policy'");
                //}
            }
        })
    })
    $("[toValidate]").on('focusout',  function(event) {
        event.stopPropagation();
        var element = $(this);
        validateElement(element);
    });
    $("[unique]").on('focusout',  function(event) {
        event.stopPropagation();
        if($(this).val()){
            verifyUsername($(this), function(response){});
        }
    });
    //Device
    $("#addDeviceForm").ajaxForm({
        enctype: 'multipart/form-data', type: 'post', dataType: 'json', url: HOST + '/PS.addDevice', iframe: false,
        beforeSubmit: function () {
            loadingScreen(true);
            SingleLoadingScreen('deviceForm',true);
            $("#addDeviceForm").hide();
        },
        success: function (data) {
            //$("#loading").hide();
            if (data.err) {
                alert("Error during the update operation.\nSee: "+JSON.stringify(data.err));
                //location.reload();
            } else {
                displayGes('devices', 'list');
                loadTabelle('devices')
            }
            loadingScreen(false);
            SingleLoadingScreen('deviceForm',false);
            $("#addDeviceForm").show();
        }
    });
    $("#deviceFormSubmit").click(function(event){
        if(mem['sohoData']){
            $("[name=smarthome_id]", "#addDeviceForm").val(mem['sohoData']['_id']);
        }
        $("[name=token]", "#addDeviceForm").val(mem['userData']['token']);
        $("[name=device_userId]", "#addDeviceForm").val(mem['userData']['_id']);
        validateForm('addDeviceForm', function(response){
            if(response){
                $("#addDeviceForm").submit();
            }
        })
    });
    $("#selectOwner").click(function(event){
        event.stopPropagation();
        loadHoModal();
    })
    $("#confirmOwner").click(function(event){
        event.stopPropagation();
        $("#device_owner_id").val(mem['ownerSelected']['_id']);
        $("#device_owner_type").val('ho');
        $("#device_owner_label").val(mem['ownerSelected']['firstname']+" "+mem['ownerSelected']['lastname']);
        $("#ownerModal").modal('hide');
    })

    $("#settingsFormSubmit").click(function(event){
        event.stopPropagation();
        patchConfig();
    })
    $("#devicemonitoringSubmit").click(function(event){
        event.stopPropagation();
        patchMonitoring();
    })
}
//Login
function oAuthLogin(username, password){
    $.post(HOST + '/PS.OAuthLogin', {
        username: username,
        password: password
    }, function (data) {
        if (data) {
            if (data['err']) {
                alert(data['err']);
                loadingScreen(false);
            } else {
                window.sessionStorage.setItem('userdata', JSON.stringify(data['data']));
                window.localStorage.setItem('userdata', JSON.stringify(data['data']));
                var href = roleDestination(data['data']['roles'][0]);
                location.href = href+"?userData="+data['data']['_id']+"&token="+data['data']['token'];
            }
        }
    }, 'json');
}
//User
function fillUserData(id) {
    $.post(HOST + "/PS.getUserList", {'_id': id, token: mem['userData']['token']}, function (data) {
        if (data.err) {
            alert("We encouter an internal error")
        } else {
            displayGes('users', 'form')
            //Add Breadcrumb
            mem['selectedUser'] = id;
            $("#breadcrumbUsers").append($('<li bcAppend class="active"><a href="javascript:void(0);">' + data['data'][0]['firstname'] + ' ' + data['data'][0]['lastname'] + '</a></li>'));
            //Clear Data
            $("#addUserForm").trigger('reset');
            //Fill in user data
            Object.keys(data['data'][0]).forEach(function (field) {
                $("#user_" + field).val(data['data'][0][field]).prop('disabled', true);
            });
            $("#user_roles_button").prop('disabled', true);
            if (data['data'][0]['roles']) {
                //    $("#user_roles").val(data['data'][0]['roles'].join(", ")).prop('disabled', true);
            }
            $(".form-control", "#addUserForm").each(function(element){
                $(this).prop('disabled', true);
            });
            $("[formRead=false]").each(function (item) {
                $(this).hide();
            });
        }
    }, 'json');
}
function validateElement(element){
    var response = {
        valid : true,
        message : []
    };
    var controls = element.attr('toValidate').split(" ");
    controls.forEach(function(control){
        if(control == 'required'){
            if(!element.val()){
                mem['formValid'] = false;
                response['valid'] = false;
                response['message'].push("field required");
            }
        }else if (control == 'length'){
            if(!element.val().length  <= 5){
                mem['formValid'] = false;
                response['valid'] = false;
                response['message'].push("need to be at least 5 characters");
            }
        }else if (control == 'email'){
            if(!mailValidator(element.val())){
                mem['formValid'] = false;
                response['valid'] = false;
                response['message'].push("enter a valid email");
            }
        }else if (control == 'password'){
            if(!passwordValidator(element.val())){
                mem['formValid'] = false;
                response['valid'] = false;
                response['message'].push("enter a valid password");
            }
        }
    })
    if(!response['valid']){
        element.popover('dispose').popover({
            placement:'left',
            trigger:'manual',
            html:true,
            content:'<i class="notValid">'+response['message'].join("</br>")+'</i>'
        });
        element.attr('data-popoverAttached', true);
        element.popover('show');
        setTimeout(function() {
            element.popover('hide');
        }, 1500);
    }else{
        element.popover('hide');
    }
}
function validateForm(form, cb){
    mem['formValid'] = true;
    $("[toValidate]", "#"+form).each(function(element){
        var element = $(this);
        validateElement(element);
    });
    if($("#user_username").val()){
        var element = $("#user_username");
        verifyUsername($("#user_username"), function(response){
            if(!response){
                mem['formValid'] = false;
            }
            cb(mem['formValid']);
        });
    }else{
        cb(mem['formValid']);
    }

}
function mailValidator(emailAddress) {
    var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
    return pattern.test(emailAddress)
}
function passwordValidator(password) {
    var pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/; //one lovercase
                                                                                    //one upercase
                                                                                    //one digit
                                                                                    //one special
                                                                                    //at least 8 char long
    return pattern.test(password);
}
function verifyUsername(element, cb){
    var username = element.val();
    $.post(HOST + "/PS.verifyUsername", {'username': username, 'token': mem['userData']['token']}, function (data) {
        if (data.err) {
            alert("We encouter an internal error")
        } else {
            if(data['data'] > 0){
                element.popover('dispose').popover({
                        placement:'bottom',
                        trigger:'manual',
                        html:true,
                        content:'<i class="notValid">Username already chosen</i>'
                });
                element.attr('data-popoverAttached', true);
                element.popover('show');
                setTimeout(function() {
                    element.popover('hide');
                }, 1500);
                cb(false);
            }else{
                cb(true);
            }
        }
    }, 'json');
}
//Device
function fillDeviceData(id, mode, disabled) {
    $("#preloader_devices").show();
    $.post(HOST + "/PS.getDeviceList", {'_id': id}, function (data) {
        if (data.err) {
            alert("We encounter an internal error")
        } else {
            mem['selectedDevice'] = id;
            loadTabelle('deviceVulnerabilities');
            displayGes('devices', 'form');
            //Add Breadcrumb
            var $bc = $('<li bcAppend class="active"><a href="javascript:void(0);">' + data['data'][0]['description'] +'</a></li>')
            $("#breadcrumbDevices").append($bc);
            //Clear Data
            $("#addDeviceForm").trigger('reset');
            //Fill in device data
            mem['deviceData'] = data['data'][0];
            $("#deviceFormStatus").show();
            if(data['data'][0]['monitoring'] == false){
                $("#device_monitoring_status").val('Inactive');
                $("#devicemonitoringSubmit").val("Activate").removeClass("btn-warning").addClass("btn-success")
            }else {
                $("#device_monitoring_status").val('Active');
                $("#devicemonitoringSubmit").val("Deactivate").removeClass("btn-success").addClass("btn-warning")
            }
            Object.keys(data['data'][0]).forEach(function (field) {
                $("#device_" + field).val(data['data'][0][field]);
                if(disabled ==true){
                    $("#device_" + field).prop('disabled', true);
                }
            });
            if(data['data'][0]['ownerData'][0]){
                var name = [data['data'][0]['ownerData'][0]['firstname'], data['data'][0]['ownerData'][0]['lastname']]
                $("#device_owner").val(name.join(' ')).prop('disabled', true);
            }else{
                $("#device_owner").val(data['data'][0]['owner']).prop('disabled', true);
            }

            if(data['data'][0]['device_info']){
                var deviceInfo = data['data'][0]['device_info'];
                Object.keys(deviceInfo).forEach(function (deviceInfofield) {
                    $("#device_device_info_" + deviceInfofield).val(deviceInfo[deviceInfofield]);
                    if(disabled ==true){
                        $("#device_device_info_" + deviceInfofield).prop('disabled', true);
                    }
                });
                if(deviceInfo['os']){
                    var deviceInfoOs = deviceInfo['os'];
                    Object.keys(deviceInfoOs).forEach(function (deviceInfoOsfield) {
                        $("#device_device_info_os_" + deviceInfoOsfield).val(deviceInfoOs[deviceInfoOsfield]);
                        if(disabled ==true){
                            $("#device_device_info_os_" + deviceInfoOsfield).prop('disabled', true);
                        }
                    });
                }
                if(deviceInfo['monitoring']){
                    if(deviceInfo['monitoring'] == 'true'){
                        $("#device_device_info_monitoring").val("Active").addClass("inputSuccess");
                    }else{
                        $("#device_device_info_monitoring").val("Off").addClass("inputWarning");
                    }
                }
            }
            if(data['data'][0]['owner']){
                var ownerInfo = data['data'][0]['owner'];
                Object.keys(ownerInfo).forEach(function (ownerInfofield) {
                    $("#device_owner_" + ownerInfofield).val(ownerInfo[ownerInfofield]);
                    if(disabled ==true){
                        $("#device_owner_" + ownerInfofield).prop('disabled', true);
                    }
                });
            }

            if(!mode || mode != 'owner'){
                if(!data['data'][0]['patch_level']['value']){data['data'][0]['patch_level']['value'] = 0};
                //drawPatchLvlGauge(data['data'][0]['patch_level']['value']);
                if(!data['data'][0]['risk_level']['value']){data['data'][0]['risk_level']['value'] = 5};
                drawRiskGauge(data['data'][0]['risk_level']['value']);
                if(!data['data'][0]['trust_level']['value']){data['data'][0]['trust_level']['value'] = 0};
                drawTrustGauge(data['data'][0]['trust_level']['value']);
                if(!data['data'][0]['impact'] || !data['data'][0]['impact']['value']){data['data'][0]['impact'] = {};data['data'][0]['impact']['value'] = 1};
                drawImpactGauge(data['data'][0]['impact']['value']);
                $("#impactSelect").val(data['data'][0]['impact']['value']);
            }

            $(".form-control", "#addDeviceForm").each(function(element){
                $(this).prop('disabled', true);
            });
            $("[formRead=false]").each(function (item) {
                $(this).hide();
            });
            $("#preloader_devices").hide();
        }
    }, 'json');
}
function loadHoModal(){
    $("#ownerTable").dataTable().fnDestroy();
    mem['tabOwner'] = $('#ownerTable').DataTable( {
            "ajax": {
                url: HOST+"/PS.getHoList",
                type: "POST",
                "data": {token : mem['userData']['token']},
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
                { "data": "_id","defaultContent": "<i>Not set</i>"},
                { "data": "firstname","defaultContent": "<i>Not set</i>"},
                { "data": "lastname","defaultContent": "<i>Not set</i>"},
                {
                    render: function (data, type, row) {
                        var number = row['devices'].length;
                        return row['devices'].length;
                    }
                }
            ],
            "initComplete": function(data){
                $("#confirmOwner").prop('disabled', true)
                $('#ownerTable').on('click', 'tbody tr', function () {
                    if( $(this).hasClass('rowSelect')){
                        $(this).removeClass('rowSelect');
                        mem['ownerSelected'] = null;
                        $("#confirmOwner").prop('disabled', true)
                    }else{
                        $("td", this).each(function(element){
                            $(this).removeClass('sorting_1');
                        })
                        $(this).addClass('rowSelect');
                        mem['ownerSelected'] = mem['tabOwner'].row($(this)).data();
                        $("#confirmOwner").prop('disabled', false)
                    }

                });
                $('#ownerTable_wrapper').attr('style','width:80%;')
                $("#ownerModal").modal('show');
            }
        });
}
function patchMonitoring(){
    var _id = mem['deviceData']['_id'];
    var status = true;
    if(mem['deviceData']['monitoring'] == true){
        status = false;
    }
    $.post(HOST+"/PS.patchMonitoring", {'_id':_id, 'status':status}, function(data){
        if(data.err){
            //alert("We encouter an internal error")
        }else{
            if(status == false){
                $("#device_monitoring_status").val('Inactive');
                $("devicemonitoringSubmit").val("Activate").removeClass("btn-warning").addClass("btn-success")
            }else{
                $("#device_monitoring_status").val('Active');
                $("devicemonitoringSubmit").val("Deactivate").removeClass("btn-success").addClass("btn-warning")
            }
        }
        $("#settingsFormSubmit").show();
        $("#settingsFormWait").hide();
    }, 'json');
}
//SOHO
function fillSohoData(id) {
    $.post(HOST + "/PS.getSmartHomeList", {'_id': id}, function (data) {
        if (data.err) {
            alert("We encouter an internal error")
        } else {
            mem['selectedSOHO'] = id;
            displayGes('SH', 'form');
            //Add Breadcrumb
            $("#breadcrumbSH").append($('<li bcAppend class="active"><a href="javascript:void(0);">' + data['data'][0]['name'] +'</a></li>'));
            //Clear Data
            $("#sohoForm").trigger('reset');
            //Fill in user data

            $("[soho]").each(function(element){
                if(data['data'][0][$(this).attr('soho')]){
                    $(this).val(data['data'][0][$(this).attr('soho')]);
                }
                $(this).prop('disabled', true);
            });
            if(data['data'][0]['ownerData'][0]){
                var name = [data['data'][0]['ownerData']['firstname'], data['data'][0]['ownerData']['lastname']]
                $("[soho=ownerData]").val(name.join[' ']).prop('disabled', true);
            }else{
                $("[soho=ownerData]").val(data['owner']).prop('disabled', true);
            }
            if(data['data'][0]['health_status']){
                var d = data['data'][0]['health_status'];
                if(d['description']){
                    $("[soho_health=description]").val(d['description']).prop('disabled', true);
                }else{
                    $("[soho_health=description]").val("None").prop('disabled', true);
                }

                if(d['status']){
                    $("[soho_health=status]").val(d['status']).prop('disabled', true);
                }else{
                    $("[soho_health=status]").val('None').prop('disabled', true);
                }
                if(d['status'] == 'active'){
                    $("[soho_health=status]").addClass("inputSuccess");
                }else{
                    $("[soho_health=status]").addClass("inputWarning");
                }
            }
            if(data['data'][0]['config']) {
                var d = data['data'][0]['config'];
                if (d['irg']) {
                    if(d['irg']['cost']){
                        $("#sohoFormIrg").show();
                        drawPatchGauge(d['irg']['cost']['patch']);
                        drawFirewallGauge(d['irg']['cost']['firewall']);
                    }else{
                        $("#sohoFormIrg").hide();
                    }
                    if(d['irg']['hosts'][0]){
                        $("[soho_irg=host_name]").val(d['irg']['hosts'][0]['name']).prop('disabled', true);
                        $("[soho_irg=host_id]").val(d['irg']['hosts'][0]['id']).prop('disabled', true);
                    }else{
                        $("[soho_irg=host_name]").val('None').prop('disabled', true);
                        $("[soho_irg=host_id]").val('None').prop('disabled', true);
                    }
                }
                if (d['ire']) {
                    if(d['ire']['auto_mode'] == 1){
                        $("[soho_ire=automode]").removeClass('inputDanger').addClass("inputSuccess").val('Activated').prop('disabled', true);
                    }else{
                        $("[soho_ire=automode]").removeClass('inputSuccess').addClass("inputDanger").val('Off').prop('disabled', true);
                    }
                    if(!d['ire']['sa_tradeoff']){d['ire']['sa_tradeoff'] = 0};
                    drawSaToGauge(d['ire']['sa_tradeoff']);
                    if(!d['ire']['sp_tradeoff']){d['ire']['sp_tradeoff'] = 0};
                    drawSpToGauge(d['ire']['sp_tradeoff']);
                }
            }
            $("[formRead=false]").each(function (item) {
                $(this).hide();
            });
        }
    }, 'json');
    loadTabelle('shdevices');
}
function patchConfig(){
    var auto = $('#automodeTrigger').prop('checked');
    var automode = 1;
    if(auto == false){
        automode = 0;
    }

    var patchCost = $("#patchSlider").val();
    var firewallCost = $("#firewallSlider").val();
    var availability = mem['availability']; //$("#availabilitySlider").slider('getValue');
    var performance = $("#performanceSlider").val();

    var hosts = mem['sohoData']['config']['irg']['hosts'];
    $("#settingsFormSubmit").hide();
    $("#settingsFormWait").show();
    $.post(HOST+"/PS.patchSHConfig", {'_id':mem['sohoData']['_id'], hosts: hosts, automode : automode, patchCost : patchCost, firewallCost : firewallCost, availability : availability, performance : performance}, function(data){
        if(data.err){
            //alert("We encouter an internal error")
        }else{

        }
        $("#settingsFormSubmit").show();
        $("#settingsFormWait").hide();
    }, 'json');
}
//Gauges
function drawPatchGauge(value){
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
    var target = document.getElementById('gaugePatch');
    var gauge = new Gauge(target).setOptions(opts);
    gauge.maxValue = 5; // set max gauge value
    gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
    gauge.set(value); // set actual value
}
function drawFirewallGauge(value){
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
    var target = document.getElementById('gaugeFirewall');
    var gauge = new Gauge(target).setOptions(opts);
    gauge.maxValue = 5; // set max gauge value
    gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
    gauge.set(value); // set actual value
}
function drawSaToGauge(value){
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
    var target = document.getElementById('gaugeSa');
    var gauge = new Gauge(target).setOptions(opts);
    gauge.maxValue = 1; // set max gauge value
    gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
    gauge.set(value); // set actual value
}
function drawSpToGauge(value){
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
    var target = document.getElementById('gaugeSp');
    var gauge = new Gauge(target).setOptions(opts);
    gauge.maxValue = 5; // set max gauge value
    gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
    gauge.set(value); // set actual value
}
function drawPatchLvlGauge(value){
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
            {strokeStyle: "#F03E3E", min: 0, max: 2},//R
            {strokeStyle: "#FFDD00", min: 2, max: 4},//Y
            {strokeStyle: "#30B32D", min: 4, max: 5} //G
        ],
        staticLabels: {
            font: "10px sans-serif",  // Specifies font
            labels: [1, 2, 3, 4, 5],  // Print labels at these values
            color: "#000000",  // Optional: Label text color
            fractionDigits: 0  // Optional: Numerical precision. 0=round off.
        },
    }
    var target = document.getElementById('gaugePatchLvl');
    var gauge = new Gauge(target).setOptions(opts);
    gauge.maxValue = 5; // set max gauge value
    gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
    gauge.set(value); // set actual value
}
function drawRiskGauge(value){
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
            {strokeStyle: "#30B32D", min: 0, max: 1}, // G
            {strokeStyle: "#FFDD00", min: 1, max: 3}, // Yellow
            {strokeStyle: "#F03E3E", min: 3, max: 5} // R
        ],
        staticLabels: {
            font: "10px sans-serif",  // Specifies font
            labels: [1, 2, 3, 4, 5],  // Print labels at these values
            color: "#000000",  // Optional: Label text color
            fractionDigits: 0  // Optional: Numerical precision. 0=round off.
        },


    }
    var target = document.getElementById('gaugeRisk');
    var gauge = new Gauge(target).setOptions(opts);
    gauge.maxValue = 5; // set max gauge value
    gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
    gauge.set(value); // set actual value
}
function drawTrustGauge(value){
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
    var target = document.getElementById('gaugeTrust');
    var gauge = new Gauge(target).setOptions(opts);
    gauge.maxValue = 5; // set max gauge value
    gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
    gauge.set(value); // set actual value
}
function drawImpactGauge(value){
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
            {strokeStyle: "#48cf2d", min: 0, max: 1}, // Red from 100 to 130
            {strokeStyle: "#18eda6", min: 1, max: 2}, // Yellow
            {strokeStyle: "#1871ed", min: 2, max: 3}, // Green
            {strokeStyle: "#ed9118", min: 3, max: 4}, // Green
            {strokeStyle: "#ed1818", min: 4, max: 5}, // Green
        ],
        staticLabels: {
            font: "10px sans-serif",  // Specifies font
            labels: [1, 2, 3, 4, 5],  // Print labels at these values
            color: "#000000",  // Optional: Label text color
            fractionDigits: 0  // Optional: Numerical precision. 0=round off.
        },


    }
    var target = document.getElementById('gaugeImpact');
    if(target){
        var gauge = new Gauge(target).setOptions(opts);
        gauge.maxValue = 5; // set max gauge value
        gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
        gauge.set(value); // set actual value
    }
}
//Notification
function fillNotificationData(id) {
    $.post(HOST + "/PS.getNotificationList", {'_id': id}, function (data) {
        if (data.err) {
            alert("We encouter an internal error")
        } else {
            displayGes('alerts', 'form');
            //Add Breadcrumb
            $("#breadcrumbNotifications").append($('<li bcAppend class="active"><a href="javascript:void(0);">' + data['data'][0]['title'] +'</a></li>'));
            //Clear Data
            $("#notificationForm").trigger('reset');
            //Fill in user data
            if(data['data'][0]['data']['tip']){
                $("[notification=tip]").val(data['data'][0]['data']['tip']).prop('disabled', true);
            }
            if(data['data'][0]['timestamp']){
                $("[notification=timestamp]").val(data['data'][0]['timestamp']).prop('disabled', true);
            }
            if(data['data'][0]['data']['description']){
                $("[notification=description]").val(data['data'][0]['data']['description']).prop('disabled', true);
            }
            drawThreatGauge(data['data'][0]['data']['threat_level']);
            $("#notification_img").attr('src',data['data'][0]['data']['img'])
            $("[formRead=false]").each(function (item) {
                $(this).hide();
            });
            setTimeout(function(event){
                fillNotificationData(id);
            },60000);
        }
    }, 'json');
}
function drawThreatGauge(value){
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
            {strokeStyle: "#F03E3E", min: 3, max: 5}, // Red
            {strokeStyle: "#FFDD00", min: 1, max: 3}, // Yellow
            {strokeStyle: "#30B32D", min: 0, max: 1}  // Green
        ],
        staticLabels: {
            font: "10px sans-serif",  // Specifies font
            labels: [1, 2, 3, 4, 5],  // Print labels at these values
            color: "#000000",  // Optional: Label text color
            fractionDigits: 0  // Optional: Numerical precision. 0=round off.
        },


    }
    var target = document.getElementById('gaugeThreat');
    var gauge = new Gauge(target).setOptions(opts);
    gauge.maxValue = 5; // set max gauge value
    gauge.setMinValue(0);  // Prefer setter over gauge.minValue = 0
    gauge.set(value); // set actual value
}
function fillMitigationData(id) {
    if(!mem['hostrow']){
        mem['hostrow'] = $("[jmmitigation=hostRow]").clone();
        mem['pfsenserow'] = $("[jmmitigation=pfsenseRow]").clone();
        mem['rulesrow'] = $("[jmmitigation=rulesRow]").clone();
    }
    $("#hostList").empty();
    $("#pfsenseList").empty();
    $("#rulesList").empty();
    $.post(HOST + "/PS.getMitigationList", {'_id': id}, function (data) {
        if (data.err) {
            alert("We encouter an internal error")
        } else {
            displayGes('mitigations', 'form');
            mem['mitigationData']=data['data'][0];
            //Add Breadcrumb
            $("#breadcrumbMitigation").append($('<li bcAppend class="active"><a href="javascript:void(0);">' + data['data'][0]['_id'] +'</a></li>'));
            //Clear Data
            $("#mitigationForm").trigger('reset');
            var mitigation = data['data'][0];
            if(mitigation['affected_hosts'] && mitigation['affected_hosts'].length >0){
                mitigation['affected_hosts'].forEach(function(host){
                    var $obj = mem['hostrow'].clone();
                    $("[jmMitigation=hostname]", $obj).val(host['hostname']).attr('disabled', 'disabled');
                    $("[jmMitigation=ip]", $obj).val(host['ip']).attr('disabled', 'disabled');
                    $("#hostList").append($obj);
                })
            }
            if(mitigation['mitigation']){
                $("[jmMitigation=mode]").empty().append(mitigation['mitigation']['mode']);
                if(mitigation['mitigation']['mode'] == "Enable"){
                    $("#application").hide();
                }
                if(mitigation['mitigation']['pfsense'] && mitigation['mitigation']['pfsense'].length >0){
                    mitigation['mitigation']['pfsense'].forEach(function(pfsense){
                        var $obj = mem['pfsenserow'].clone();
                        $("[jmMitigation=pfsense]", $obj).val(pfsense).attr('disabled', 'disabled');
                        $("#pfsenseList").append($obj);
                    })
                }
                if(mitigation['mitigation']['rules'] && mitigation['mitigation']['rules'].length >0){
                    mitigation['mitigation']['rules'].forEach(function(rule){
                        var $obj = mem['rulesrow'].clone();
                        $("[jmMitigation=rule]", $obj).val(rule).attr('disabled', 'disabled');
                        $("#rulesList").append($obj);
                    })
                }
            }
        }
    }, 'json');
}
function applyMitigation(){
    $.post(HOST+"/PS.patchMitigation", {'_id':mem['mitigationData']['_id']}, function(data){
        if(data.err){
            alert("We encouter an internal error")
        }else{

        }
        $("#settingsFormSubmit").show();
        $("#settingsFormWait").hide();
    }, 'json');
}