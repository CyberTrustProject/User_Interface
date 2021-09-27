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
var palette_a = ["#11d452", "#00ce85", "#00c4be", "#00b7f7", "#00a8ff", "#0091ff", "#006fff", "#7e2bff"];
var palette_b = ["#2500e0",    "#8156df",    "#b296dd",    "#d7d7d7",    "#dfc9a2",    "#e1bc6b",    "#deaf2c"];
var palette_c = ["#e00404",    "#ea694d",    "#e9a290",    "#d7d7d7",    "#d5a7db",    "#cf74dd","#c32fde"];
if(window.sessionStorage.getItem('userdata')){
    mem['userData'] = JSON.parse(window.sessionStorage.getItem('userdata'));
}
$(document).ready(function(){
    arm();
    armMisp();
    arm_profilingServices();
    armSuricata();
    armNetwork();
});
//Dom elements "Arm" Function
function arm(){
    displayGes();
    navigationAction();
    Action();
    loadTabelle();
    $("[target]").click(function (event){
        navigationAction($(this).attr('target'));
    });
    $("[ps_target]").click(function (event){
        Action('ps',$(this).attr('ps_target'));
    });
    $("[sh_target]").click(function (event){
        Action('sh',$(this).attr('sh_target'));
    });
    $("[device_target]").click(function (event){
        Action('device',$(this).attr('device_target'));
    });
    $("[om_target]").click(function (event){
        Action('om',$(this).attr('om_target'));
    });
    $("[misp_target]").click(function (event){
        //Action('misp',$(this).attr('misp_target'));
    });
    $("[jmRefresh]").click(function(){
        loadTabelle($(this).attr("jmRefresh"));
    });
    $("[jmRefreshData]").click(function(){
        //if($(this).attr('jmRefreshData') == 'dns'){
        SuricataGLManager($(this).attr('jmRefreshData'));
        //}
    });
    $("[jmGraphRefresh]").click(function(){
        //omcpGL();
    });
    $("[displayer]").click(function(){
        displayGes($(this).attr('displayLabel'),$(this).attr('displayMode'));
        $("[modifier]").hide();
    });
    $("[adder]").click(function(event){
        formReset();
        $("#"+$(this).attr('adder')+"FormSubmit").resetForm().show();
    });
    $("[jmRefresh=network]").click(function(event){
        event.stopPropagation();
        drawNetwork();
    })

    $("#userFormDelete").click(function(event){
        formReset();
        deleteUser(mem['selectedUser']);
    });
    $("#deviceFormDelete").click(function(event){
        formReset();
        deleteDevice(mem['selectedDevice']);
    });
    $("#arrow_reference").off().click(function(event){
        if($("#referenceContainer").is(":visible")){
            $(this).attr('src', "../img/arrow-dw2.png");
            $("#referenceContainer").hide('slow');
        }else{
            $(this).attr('src', "../img/arrow-up2.png");
            $("#referenceContainer").show('slow');
        }
    })
    $("#arrow_vuln").off().click(function(event){
        if($("#configContainer").is(":visible")){
            $(this).attr('src', "../img/arrow-dw2.png");
            $("#configContainer").hide('slow');
        }else{
            $(this).attr('src', "../img/arrow-up2.png");
            $("#configContainer").show('slow');
        }
    })
    $("#vulnerabilies_arrow_reference").off().click(function(event){
        if($("#referenceContainerVuln").is(":visible")){
            $(this).attr('src', "../img/arrow-dw2.png");
            $("#referenceContainerVuln").hide('slow');
        }else{
            $(this).attr('src', "../img/arrow-up2.png");
            $("#referenceContainerVuln").show('slow');
        }
    })
    $("#vulnerabilies_arrow_vuln").off().click(function(event){
        if($("#configContainerVuln").is(":visible")){
            $(this).attr('src', "../img/arrow-dw2.png");
            $("#configContainerVuln").hide('slow');
        }else{
            $(this).attr('src', "../img/arrow-up2.png");
            $("#configContainerVuln").show('slow');
        }
    })
}
//
//Various//
function navigationAction(target){
    console.log(target)
    if(!target || target==='_blank'){
        if(mem['dashOMCP']) {
            target = mem['dashOMCP'];
        }else{
            target = mem['dashProfiling'];
        }
    }
    if(!target){ //Da ora in poi, con 1 si identifica l'userId del singolo utente.
                // è una soluzione provvisoria, appena possibile aggiunger il dato nella login
        if(window.localStorage.getItem('ispTargetData') && JSON.parse(window.localStorage.getItem('ispTargetData'))[1]){
            target = JSON.parse(window.localStorage.getItem('ispTargetData'))[1];
        }else{
            target = 'dashProfiling';
        }
    }
    var obj = {};
        obj[1] = target;
    window.localStorage.setItem('ispTargetData', JSON.stringify(obj));
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
}
function Action(mode, target)   {
    if(!mode){
        if(window.localStorage.getItem('ispActionData') && JSON.parse(window.localStorage.getItem('ispActionData'))[1]){
            dati = JSON.parse(window.localStorage.getItem('ispActionData'))[1];
            mode = dati['mode'];
            target = dati['target'];
        }else{
            mode = 'om';
            target ='tabVuln';
        }
    }
    var obj = {1:{mode:mode, target:target}};
    window.localStorage.setItem('ispActionData', JSON.stringify(obj));
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
    if(target =='tabVuln' || !target){
        getHist({'time':1}, function(data){
            mem['dataVulnHist'] = data;
            updateYearList(data, function(event){
                MispTabManager();
            });
            $("[misp_target]").click(function (event){
                MispTabManager($(this).attr('misp_target'));
            });
            $("#productList").click(function (event) {
                event.stopPropagation();
                productsGL();
            })
        });
    }else if(target =='tabEvents'){
        SuricataGLManager('events');
    }else if(target =='tabGeoMap'){
        SuricataGLManager('geoMap');
    }else if(target =='tabAlerts'){
        SuricataGLManager('alerts');
    }else if(target =='tabAllEvents'){
        SuricataGLManager('allEvents');
    }else if(target =='tabDNS'){
        SuricataGLManager('dns');
    }else if(target =='tabHTTP'){
        SuricataGLManager('http');
    }else if(target == 'tabNetwork'){
        //armNetwork();
        drawNetwork();
    }
    SingleLoadingScreen('dashOMCP', false);
}
function loadTabelle(tabella){
    if(tabella == 'smarthomes'   || !tabella){
        $("#smarthomesTable").dataTable().fnDestroy();
        mem['tabSmarthomes'] = $('#smarthomesTable').DataTable( {
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
                url: HOST+"/PS.getSmartHomeList",
                type: "POST",
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
                { "data": "name","defaultContent": "<i>Not set</i>"},
                { "data": "network","defaultContent": "<i>Not set</i>"},
                { "data": "gateway","defaultContent": "<i>Not set</i>"},
                { render: function (data, type, row) {
                        if (row['ownerData'][0]['firstname']) {
                            return row['ownerData'][0]['firstname'] + " " + row['ownerData'][0]['lastname'];
                        }else if(row['owner']) {
                            return row['owner'];
                        }else{
                            return "No owner specified"
                        }
                    }
                },
                { render: function (data, type, row) {
                    if (row['health_status']['status']) {
                        if(row['health_status']['status'] == 'active'){
                            return "<span class='badge badge-success'>Active</span>";
                        }else{
                            return "<span class='badge badge-danger'>Not active</span>";
                        }
                    }else{
                        return "<i>N.A.</i>"
                    }
                }
                },
            ],
            "order":[[1, 'asc']],
            "initComplete": function(data){
                $('#smarthomesTable').unbind('click');
                $('#smarthomesTable').on('click', 'tbody tr', function () {
                    var row = mem['tabSmarthomes'].row($(this)).data();
                    mem['sohoData'] = row;
                    fillSohoData(row['_id']);
                });
                $('#smarthomesTable_wrapper').attr('style','width:100%;')
            }
        });
    }
    if(tabella == 'users'   || !tabella){
        $("#usersTable").dataTable().fnDestroy();
        mem['tabUsers'] = $('#usersTable').DataTable( {
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
                url: HOST+"/PS.getHoList",
                type: "POST",
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
                { "data": "firstname","defaultContent": "<i>Not set</i>"},
                { "data": "lastname","defaultContent": "<i>Not set</i>" },
                { "data": "email","defaultContent": "<i>Not set</i>" },
                { "data": "roles","defaultContent": "<i>Not set</i>" },
                { "data": "telephone","defaultContent": "<i>Not set</i>" }
            ],
            "order":[[1, 'asc']],
            "initComplete": function(data){
                $('#userTable').unbind('click');
                $('#usersTable').on('click', 'tbody tr', function () {
                    var row = mem['tabUsers'].row($(this)).data();
                    fillUserData(row['_id']);
                });
                $('#usersTable_wrapper').attr('style','width:100%;')
            }
        });
    }
    if(tabella == 'devices' || !tabella){
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
                { render: function (data, type, row) {
                    if(row['ownerData'].length > 0){
                        if (row['ownerData'][0]['firstname']) {
                            return row['ownerData'][0]['firstname'] + " " + row['ownerData'][0]['lastname'];
                        }else if(row['owner']) {
                            return row['owner']['id'];
                        }else{
                            return "No owner specified"
                        }
                    } else{
                        return "No owner specified"
                    }
                }},
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
                $('#devicesTable').unbind('click');
                $('#devicesTable').on('click', 'tbody tr', function () {
                    var row = mem['tabDevices'].row($(this)).data();
                    fillDeviceData(row['_id']);
                });
                $('#devicesTable_wrapper').attr('style','width:100%;')
            }
        });
    }
    if(tabella == 'shdevices'){
        $("#shDevicesTable").dataTable().fnDestroy();
        mem['tabShDevices'] = $('#shDevicesTable').DataTable( {
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
                url: HOST+"/PS.getSohoDeviceList",
                type: "POST",
                "data": {'soho_id': mem['sohoData']['_id']},
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
                        if(row){
                            var perc = row['trust_level']['value'] / 5 * 100;
                            if (perc >= 80) {
                                return '<div class="progress"><div class="progress-bar bg-success" role="progressbar" style="width: '+perc+'%" aria-valuenow="'+perc+'" aria-valuemin="0" aria-valuemax="5"></div> </div>';
                            }else if (perc >= 40) {
                                return '<div class="progress"><div class="progress-bar bg-warning" role="progressbar" style="width: '+perc+'%" aria-valuenow="'+row['trust_level']['value']+'" aria-valuemin="0" aria-valuemax="5"></div> </div>'
                            }else {
                                return '<div class="progress"><div class="progress-bar bg-danger" role="progressbar" style="width: '+perc+'%" aria-valuenow="'+row['trust_level']['value']+'" aria-valuemin="0" aria-valuemax="5"></div> </div>'
                            }
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

                    }
                },
                {
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
                }
            ],
            "initComplete": function(data){
                $('#shDevicesTable').unbind('click');
                $('#shDevicesTable').on('click', 'tbody tr', function () {
                    var row = mem['tabShDevices'].row($(this)).data();
                    fillShDeviceData(row);
                });
                $('#shDevicesTable_wrapper').attr('style','width:100%;')
            }
        });
    }
    if(tabella == 'cve'     || !tabella){
        $("#cveTable").dataTable().fnDestroy();
        mem['tabcve'] = $('#cveTable').DataTable( {
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
                url: HOST+"/ADMIN.cves",
                type: "POST",
                "dataSrc": function(data) {
                    if (!data['data'] || !data['data'].length) {
                        return [];
                    } else {
                        return data['data'];
                    }
                }
            },
            "serverSide": true,
            "sortable"  :false,
            "columns": [
                { "data": "info",   "name": "info" ,"defaultContent": "<i>Not found</i>"},
                { "data": "cvss_score_value",  "name": "cvss_score_value" ,"defaultContent": "<i>Not found</i>" },
                { "data": "credit_value", "name": "credit_value" ,"defaultContent": "<i>Not found</i>" },
                { "data": "published_value", "name": "published_value" ,"defaultContent": "<i>Not found</i>"}
            ],
            "initComplete": function(data){
                $('#cveTable').unbind('click').on('click', 'tbody tr', function () {
                    var row = mem['tabcve'].row($(this)).data();
                    fillData('cves', row['event_id']);
                });
                $('#cveTable_wrapper').attr('style','width:100%;')
            }
        });
    }
    if(tabella == 'deviceVulnerabilities'){
        $("#vulnerabilitiesTable").dataTable().fnDestroy();
        mem['tabvulnerabilities'] = $('#vulnerabilitiesTable').DataTable( {
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
                url: HOST+"/PS.getDeviceVulnerabilitiesList",
                type: "POST",
                data: {"device_id": mem['selectedDevice']},
                "dataSrc": function(data) {
                    if (!data['data']['data'] || !data['data']['data'].length) {
                        return [];
                    } else {
                        return data['data']['data'];
                    }
                }
            },
            "serverSide": true,
            "sortable"  :false,
            "columns": [
                { "data": "event_id",   "name": "event_id" ,"defaultContent": "<i>Not found</i>"},
                { "data": "cve",   "name": "cve" ,"defaultContent": "<i>Not found</i>"},
                { "data": "threat_level_id",  "name": "threat_level_id" ,"defaultContent": "<i>Not found</i>" },
                { "data": "mitigation_type", "name": "mitigation_type" ,"defaultContent": "<i>Not found</i>" },
                { "data": "mitigation_reference", "name": "mitigation_reference" ,"defaultContent": "<i>Not found</i>"},
                {
                    "data": "_insertedTimestamp", "name": "_insertedTimestamp",
                    "defaultContent": "<i>Not set</i>",
                    render: function (data, type, row) {
                        return timestampConverter(data);
                    }
                },
            ],
            "initComplete": function(data){
                $('#vulnerabilitiesTable').unbind('click').on('click', 'tbody tr', function () {
                    var row = mem['tabvulnerabilities'].row($(this)).data();
                    fillData('vulnerabilities', row);
                });
                $('#vulnerabilitiesTable_wrapper').attr('style','width:100%;')
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
                "url": HOST + "/PS.getAlertsList",
                "type": "POST",
                "dataSrc": function (data) {
                    if (!data['data']['data'] || !data['data']['data'].length) {
                        //alert('ATTENZIONE: host non raggiungibile !');
                        //SingleLoadingScreen('mitigationList', false)
                        return [];
                    } else {
                        //SingleLoadingScreen('mitigationList', false)
                        return data['data']['data'];
                    }
                }
            },
            "dataSrc": function(data) {
                if (data == "no data") {
                    return [];
                } else {
                    return data.data;
                }
            },
            "columns": [
                { "data": "alert_type"},
                { "data": "device_type" },
                { "data": "device_id" },
                { "data": "reason.rule_id" },
                { "data": "importance" },
                { "data": "_insertedTimestamp"}
            ],
            "initComplete": function(data){
                $('#alertsTable').unbind('click');
                $('#alertsTable').on('click', 'tbody tr', function () {
                    var row = mem['tabAlerts'].row($(this)).data();
                    fillData('alerts', row);
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
            "ajax": {
                "url": HOST + "/PS.getMitigationList",
                "type": "POST",
                "dataSrc": function (data) {
                    if (!data['data'] || !data['data'].length) {
                        //alert('ATTENZIONE: host non raggiungibile !');
                        //SingleLoadingScreen('mitigationList', false)
                        return [];
                    } else {
                        //SingleLoadingScreen('mitigationList', false)
                        return data['data'];
                    }
                }
            },
            "processing": true,
            "language": {
                "processing": '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i><span class="sr-only">Loading...</span> '},
            "serverSide": true,
            "sortable": true,
            "columns": [
                {"data": "status", "name": "status", "defaultContent": "<i>Not set</i>"},
                {
                    "data": "affected_hosts", "name": "affected_hosts",
                    "defaultContent": "<i>Not set</i>",
                    render: function (data, type, row) {
                        return data.length;
                    }
                },
                {
                    "data": "mitigation.rules", "name": "mitigation.rules",
                    "defaultContent": "<i>Not set</i>",
                    render: function (data, type, row) {
                        return data.length;
                    }
                },
                {
                    "data": "_insertedTimestamp", "name": "_insertedTimestamp",
                    "defaultContent": "<i>Not set</i>",
                    render: function (data, type, row) {
                        return timestampConverter(data);
                    }
                },
            ],
            "initComplete": function(data){
                $('#mitigationsTable').unbind('click');
                $('#mitigationsTable').on('click', 'tbody tr', function () {
                    var row = mem['tabMitigations'].row($(this)).data();
                    fillData('mitigations', row);
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
    if(target == 'devices'){
        displayGes('devices', 'form')
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
    if(target == 'mitigations'){
        displayGes('mitigations', 'form')
        var data = id;
        //Add Breadcrumb
        if(!data['timestamp']){data['timestamp'] = "No data retrieved";}
        $("#breadcrumbMitigations").append($('<li bcAppend class="active"><a href="javascript:void(0);">Mitigation of: '+data['timestamp']+'</a></li>'));
        //Fill in mitigation data
        $("#mitigation_timestamp").val(data['timestamp']).prop('disabled', true);
        if(!data['status']){data['status'] = "No data retrieved";}
        $("#mitigation_status").val(data['status']).prop('disabled', true);

        if(data['affected_hosts']){
            affectedHostsTab(data['affected_hosts']);
        }
        if(data['mitigation']){
            if(data['mitigation']['rules']){
                mitigationRules(data['mitigation']['rules'])
            }
        }
    }
    if(target == 'soho'){

    }
    if(target == 'cves'){
        $.post(HOST + '/ADMIN.singleEvent', {event_id : id}, function(data) {
            if (data['err']) {
                alert(data['err']);
            } else {
                displayGes('cves', 'form');
                var data = data['data'];
                //Add Breadcrumb
                $("#breadcrumbCVE").append($('<li bcAppend class="active"><a href="javascript:void(0);">'+data['CVSSID']+'</a></li>'));
                //Clear Data
                $("#cveForm").trigger('reset');
                //Fill in user data
                $("#cve_CVE").val(data['CVSSID']).prop('disabled', true);
                $("#cve_cvss-score").val(data['CVSSscore']).prop('disabled', true);
                $("#cve_cvss-string").val(data['CVSSstring']).prop('disabled', true);
                $("#cve_creditSource").val(data['CreditSource']).prop('disabled', true);
                $("#cve_summary").val(data['Summary']).prop('disabled', true).attr('style','height: '+$("#cve_summary").get(0).scrollHeight+'px');
                $("#cve_description").val(data['Description']).prop('disabled', true).attr('style','height: '+$("#cve_description").get(0).scrollHeight+'px');
                if(data['references'].length > 0){
                    if(!mem["refObj_clone"]){
                        mem["refObj_clone"] = $("[obj_to_clone=reference]").clone(1,1);
                    }
                    $("#referenceContainer").empty();
                    data['references'].forEach(function(reference, pos){
                        var $obj = mem["refObj_clone"].clone(1,1);
                        $("[referencePos]",$obj).empty().append(pos+1);
                        $("[referenceRef]",$obj).val(reference).prop('disabled', true).css('width', reference.length*3);
                        $("#referenceContainer").append($obj);
                    })
                    $("#boxRef").show();
                }else{
                    $("#boxRef").hide();
                }
                if(data['vulnerable_configuration'].length > 0){
                    if(!mem["configObj_clone"]){
                        mem["configObj_clone"] = $("[obj_to_clone=config]").clone(1,1);
                    }
                    $("#configContainer").empty();
                    data['vulnerable_configuration'].forEach(function(reference, pos){
                        var $obj = mem["configObj_clone"].clone(1,1);
                        $("[configPos]",$obj).empty().append(pos+1);
                        $("[configRef]",$obj).val(reference).prop('disabled', true).css('width', reference.length);
                        $("#configContainer").append($obj);
                    })
                    $("#boxConfig").show();
                }else{
                    $("#boxConfig").hide();
                }
                $("#cveFormSubmit").hide();
            }
        },'json');
    }
    if(target == 'vulnerabilities'){
        //$.post(HOST + '/ADMIN.singleEvent', {event_id : id}, function(data) {
            var data = {'data':id};
            if (data['err']) {
                alert(data['err']);
            } else {
                displayGes('vulnerabilities', 'form');
                var data = data['data'];
                //Add Breadcrumb
                $("#breadcrumbVulnerabilities").append($('<li bcAppend class="active"><a href="javascript:void(0);">'+data['cve']+'</a></li>'));
                //Clear Data
                $("#vulnerabilitiesForm").trigger('reset');
                //Fill in user data
                $("#vuln_CVE").val(data['cve']).prop('disabled', true);
                $("#vuln_cvss-score").val(data['CVSSscore']).prop('disabled', true);
                $("#vuln_cvss-string").val(data['CVSSstring']).prop('disabled', true);
                $("#vuln_creditSource").val(data['CreditSource']).prop('disabled', true);
                $("#vuln_summary").val(data['Summary']).prop('disabled', true).attr('style','height: '+$("#vuln_summary").get(0).scrollHeight+'px');
                $("#vuln_description").val(data['Description']).prop('disabled', true).attr('style','height: '+$("#vuln_description").get(0).scrollHeight+'px');
                if(data['references'] && data['references'].length > 0){
                    if(!mem["refObj_clone"]){
                        mem["refObj_clone"] = $("[obj_to_clone=reference]").clone(1,1);
                    }
                    $("#referenceContainerVuln").empty();
                    data['references'].forEach(function(reference, pos){
                        var $obj = mem["refObj_clone"].clone(1,1);
                        $("[referencePos]",$obj).empty().append(pos+1);
                        $("[referenceRef]",$obj).val(reference).prop('disabled', true).css('width', reference.length*3);
                        $("#referenceContainerVuln").append($obj);
                    })
                    $("#boxRefVuln").show();
                }else{
                    $("#boxRefVuln").hide();
                }
                if(data['vulnerable_configuration'] && data['vulnerable_configuration'].length > 0){
                    if(!mem["configObj_clone"]){
                        mem["configObj_clone"] = $("[obj_to_clone=config]").clone(1,1);
                    }
                    $("#configContainerVuln").empty();
                    data['vulnerable_configuration'].forEach(function(reference, pos){
                        var $obj = mem["configObj_clone"].clone(1,1);
                        $("[configPos]",$obj).empty().append(pos+1);
                        $("[configRef]",$obj).val(reference).prop('disabled', true).css('width', reference.length);
                        $("#configContainerVuln").append($obj);
                    })
                    $("#boxConfigVuln").show();
                }else{
                    $("#boxConfigVuln").hide();
                }
            }
        //},'json');
    }
}
function affectedHostsTab(data){
    $("#affectedHostTable").dataTable().fnDestroy();
    mem['tabAffectedHost'] = $('#affectedHostTable').DataTable( {
            "data": data,
            "processing": true,
            "serverSide": false,
            "sortable": true,
            "columns": [
                {"data": "hostname", "name": "hostname", "defaultContent": "<i>Not set</i>"},
                {"data": "ip", "name": "ip", "defaultContent": "<i>Not set</i>"}
            ],
            "initComplete": function(data){
                $('#affectedHostTable_wrapper').attr('style','width:100%;')
            }
        });
}
function mitigationRules(data){
    if(!mem['mitigationRuleBox']){
        mem['mitigationRuleBox'] = $("[jmRule=box]").clone();
    }
    $("#mitigationRulesContainer").empty();
    data.forEach(function(rule){
        var $obj = mem['mitigationRuleBox'].clone();
        $("[jmRule=rule]", $obj).empty().append(rule);
        $("#mitigationRulesContainer").append($obj);
    })
}
function deleteUser(id){
    $.post(HOST + '/PS.deleteUser',{_id: id}, function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            displayGes('users', 'list');
            $("[modifier]").hide();
            loadTabelle('users')
        }
    },'json');
}
function deleteDevice(id){
    $.post(HOST + '/PS.deleteDevice',{_id: id}, function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            displayGes('devices', 'list');
            $("[modifier]").hide();
            loadTabelle('devices')
        }
    },'json');
}
function fillShDeviceData(data) {
    $.each(data, function(key, value){
        $('[name='+key+']', "#form-device-add").val(value).prop('disabled', 'disabled');
    });
    if(data['device_info']){
        $.each(data['device_info'], function(key, value){
            $('[name='+key+']', "#form-device-add").val(value).prop('disabled', 'disabled');
        });
        if(data['device_info']['os']){
            $.each(data['device_info']['os'], function(key, value){
                $('[name='+key+']', "#form-device-add").val(value).prop('disabled', 'disabled');
            });
        }
    }
    displayGes('SH', 'form');
    $("#deviceModalTitle").empty().append(data['device_info']['manufacturer'], " " , data['device_info']['model']);
    $("#deviceModal").modal();
}
function timestampConverter(data){
    var v = data.split("T");
    var d = v[0].split("-");
    var h = v[1].split(":");
    return d.reverse().join("/") + " " +h[0]+":"+h[1];
}

//DA TRASFERIRE
function infoExtractor(vulnerabilities){
    var dataSet  = {
        time : {
            years:{}
        },
        products : {
            years : {}
        }
    };
    vulnerabilities.forEach(function(vuln){
        var obj = {};
        vuln['Event']['Object'][0]['Attribute'].forEach(function(attribute){
            if(attribute['object_relation'] == "summary"){
                obj['summary'] = attribute['value'];
            }
            if(attribute['object_relation'] == "published"){
                obj['published'] = attribute['value'];
            }
            //dataSet.push(obj);
        });
        var data_info = getYM(clearDateStamp(obj['published']));
        var product = extractProduct(obj['summary']);
        //xAnno
        if(!dataSet['time']['years'][data_info['y']]){
            dataSet['time']['years'][data_info['y']] = {};
        }
        if(!dataSet['time']['years'][data_info['y']][data_info['m']]){
            dataSet['time']['years'][data_info['y']][data_info['m']] = 0;
        }
        dataSet['time']['years'][data_info['y']][data_info['m']] += 1;

        //xProdotto
        if(!dataSet['products']['years'][data_info['y']]){
            dataSet['products']['years'][data_info['y']] = {};
        }
        if(!dataSet['products']['years'][data_info['y']][product['product']]){
            dataSet['products']['years'][data_info['y']][product['product']] = 0;
        }
        dataSet['products']['years'][data_info['y']][product['product']] += 1;

    });

}
function clearDateStamp(date){
    var d = date.split('T');
    var date = d[0].replace(/-/g, '/');
    var time = d[1].split('.');
    var datestamp = date+ " " + time[0];
    return datestamp;
}
function getYM(data){
    var d = data.split('/');
    var obj = {
        y : d[0],
        m : d[1]
    };
    return obj;
}
function extractProduct(element){
    var str = element.split('Product\: ');
    var str = str[1].split('\. Versions\: ');
    var obj ={
        product : str[0],
        versions: str[1]
    }
    return obj;
}
