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
}
//Setup NavTarget
mem['save_nav_target'] = 'dashProfiling';
if(window.sessionStorage.getItem('saveNavTarget')){
    mem['save_nav_target'] = window.sessionStorage.getItem('saveNavTarget');
}
//Setup Mode
mem['save_mode'] = 'ps';
if(window.sessionStorage.getItem('saveMode')){
    mem['save_mode'] = window.sessionStorage.getItem('saveMode');
}
//Setup Target
mem['save_target'] = 'tabUsers';
if(window.sessionStorage.getItem('saveTarget')){
    mem['save_target'] = window.sessionStorage.getItem('saveTarget');
}
$(document).ready(function(){
    arm();
    navigationAction();
    //Action('cw','tabDataCrawler');
    displayGes();
    loadTabelle();
    getPorts();
    getTypes();
});
//Dom elements "Arm" Function
function arm(){
    arm_crawlers();
    arm_profilingServices();
    getSeverityScore();
    getVendorData()
    $("[target]").off().click(function (event){
        navigationAction($(this).attr('target'));
    });
    $("[ps_target]").off().click(function (event){
        Action('ps',$(this).attr('ps_target'));
    });
    $("[cw_target]").off().click(function (event){
        Action('cw',$(this).attr('cw_target'));
    });
    $("[jmRefresh]").off().click(function(){
        loadTabelle($(this).attr("jmRefresh"));
        mem[$(this).attr("jmRefresh")].ajax.reload();
    });
    $("[displayer]").off().click(function(){
        displayGes($(this).attr('displayLabel'),$(this).attr('displayMode'));
        $("[modifier]").hide();
    });
    $("[adder]").off().click(function(event){
        formReset();
        $("#"+$(this).attr('adder')+"FormSubmit").resetForm().show();
    });
    $(".graph-fluid").bind('heightChange', function(){
        //crawlerGL();
    });
    $("[modifier]").off().click(function(event){
        $("input").prop('disabled', false);
    })
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
    $("#userFormDelete").off().click(function(event){
        $("#confirmDeleteModal").modal("show");
    });
    $("#userDeleteConfirm").off().click(function(event){
        deleteUser(mem['selectedUser']);
    });

}
function deleteUser(id){
    $.post(HOST + '/PS.deleteUser',{_id: id}, function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            mem['tabUsers'].ajax.reload();
            displayGes('users', 'list');
            $("#confirmDeleteModal").modal("hide");
        }
    },'json');
}
function getSeverityScore(year){
    $.post(HOST + '/MISP.severityScore',{year: year}, function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            drawSeverityPie(data['data']);
        }
    },'json');
}
function drawSeverityPie(data){
    SevDataAggregator(data,function(response){
        //V2
        var v2 = {
            'data' : response[0],
            'label' : ['High', 'Medium', 'Low']
        }
        var cfg = {
            "type": "pie",
            "data": {
                labels: v2['label'],
                datasets: [{
                    data: v2['data'],
                    backgroundColor: ['#c12e2a','#ec971f','#E3CC13']
                }]
            },
            "options": {
                "legend": {
                    "position": "right",
                    "fullWidth" : false
                },
                title: {
                    display: true,
                    text: 'CVSS V2 Score Distribution'
                },
                "responsive": true,
                "maintainAspectRatio": false
            }
        }
        var ctx = $("#v2SeverityScore")[0].getContext('2d');
        if(mem['severityV2']){mem['severityV2'].destroy();}
        mem['severityV2'] = new Chart(ctx, cfg);
        //V3
        var v3 = {
            'data' : response[1],
            'label' : ['Critical', 'High', 'Medium', 'Low']
        }
        var cfg = {
            "type": "pie",
            "data": {
                labels: v3['label'],
                datasets: [{
                    data: v3['data'],
                    backgroundColor: ['#000','#c12e2a', '#ec971f','#E3CC13']
                }]
            },
            "options": {
                "legend": {
                    "position": "right",
                    "fullWidth" : false
                },
                title: {
                    display: true,
                    text: 'CVSS V3 Score Distribution'
                },
                "responsive": true,
                "maintainAspectRatio": false
            }
        }
        var ctx = $("#v3SeverityScore")[0].getContext('2d');
        if(mem['severityV3']){mem['severityV3'].destroy();}
        mem['severityV3'] = new Chart(ctx, cfg);
    });
}
function SevDataAggregator(data, cb){
    var obj = {
        v2: {
            h: 0, m:0, l:0
        },
        v3: {
            c:0, h: 0, m:0, l:0
        }
    }
    data.forEach(function(y){
        obj['v2']['h']+= y['v2High'];
        obj['v2']['m']+= y['v2Medium'];
        obj['v2']['l']+= y['v2Low'];
        obj['v3']['c']+= y['v3Critical'];
        obj['v3']['h']+= y['v3High'];
        obj['v3']['m']+= y['v3Medium'];
        obj['v3']['l']+= y['v3Low'];
    })
    var v2 = [obj['v2']['h'], obj['v2']['m'],obj['v2']['l']];
    var v3 = [obj['v3']['c'],obj['v3']['h'],obj['v3']['m'],obj['v3']['l']];
    cb([v2, v3]);
}
function getVendorData(){
    $.post(HOST + '/MISP.vendorData', function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            var cfg ={
                "type":"bar",
                "data":{
                    "labels": data['data']['labels'],
                    "datasets":[
                        {
                            "label":null,
                            "data" : data['data']['values'],
                            "backgroundColor":"rgba(0,51,204,0.4)"
                        }
                    ]
                },
                "options":{
                    "scaleShowVerticalLines":false,
                    "scaleShowHorizontalLines":"false",
                    "customAtZeroYAxes":1,
                    "responsive":true,
                    "maintainAspectRatio":false,
                    "legend":{
                        "display":false
                    },
                    "scales":{
                        "xAxes":
                            [
                                {"ticks":
                                {"maxRotation":0},
                                    "gridLines":{
                                        "display":false
                                    },
                                    "display":true
                                }
                            ],
                        "yAxes":[
                            {
                                "gridLines":{
                                    "display":false
                                },
                                "display":true,
                                "ticks":{
                                    "beginAtZero":true,
                                    "stepSize":""
                                }
                            }
                        ]
                    }
                }
            };
            var ctx = $("#products_bars")[0].getContext('2d');
            SingleLoadingScreen('products_bars', false);
            if(mem['products_bars']){mem['products_bars'].destroy();}
            mem['products_bars'] = new Chart(ctx, cfg);
        }
    },'json');
}
//
//Various//
function navigationAction(target){
        if(!target || target==='_blank'){
            if(mem['save_nav_target']) {
                target = mem['save_nav_target'];
            }else{
                target = mem['dashProfiling'];
            }
        }
    var obj = {};
        obj[1] = target;
    window.localStorage.setItem('adminTargetData', JSON.stringify(obj));
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
            arm();
        }else{
            $(this).hide();
        }
    })
    Action();
    //crawlerGL();

    mem['save_nav_target'] = target;
    window.sessionStorage.setItem('saveNavTarget', target);
}
function Action(mode, target){
    if(!mode || !target){
        if(mem['save_mode'] && mem['save_target']){
            mode = mem['save_mode'];
            target = mem['save_target'];
        }else{
            mode = 'ps';
            target ='tabUsers';
        }
    }
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
    //crawlerGL();
    mem['save_mode'] = mode;
    window.sessionStorage.setItem('saveMode', mode);
    mem['save_target'] = target;
    window.sessionStorage.setItem('saveTarget', target);
}
function loadTabelle(tabella){
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
                url: HOST+"/PS.getUserList",
                type: "POST",
                "data" : {'token' : mem['userData']['token']},
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
                $('#usersTable').on('click', 'tbody tr', function () {
                    var row = mem['tabUsers'].row($(this)).data();
                    fillUserData(row['_id']);
                });
                $('#usersTable_wrapper').attr('style','width:100%;')
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
                { "data": "info",   "name": "event_id" ,"defaultContent": "<i>Not found</i>"},
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
    if(tabella == 'crawlers' || !tabella){
        $("#crawlersTable").dataTable().fnDestroy();
        mem['tabCrawlers'] = $('#crawlersTable').DataTable( {
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
            "ajax":{
                "url": HOST+"/ADMIN.crawlers",
                "dataSrc": function(data) {
                    if(data.err) {
                        if (data['err']['errno'] == -111 || data['err']['code'] == "ECONNREFUSED") {
                            crawlerConnectionError();
                        }
                    }else{
                        if (data == "no data") {
                            return [];
                        } else {
                            getCrawlers(data['data']);
                            return data.data;
                        }
                    }
                }
            },
            "columns": [
                { "data": "crawler_id"},
                { "data": "crawler_port" },
                { "data": "crawler_type" },
                {render: function (data, type, row) {
                    // row is an object not an  array, change the below to use dot notation like `row.status` not `row[8]`
                    if (row.crawler_status) {
                        return "<span class='badge badge-success'>On</span>";
                    }else{
                        return "<span class='badge badge-danger'>Off</span>";
                    }
                }}
            ],
            "initComplete": function(data){
                $('#crawlersTable').on('click', 'tbody tr', function () {
                    var row = mem['tabCrawlers'].row($(this)).data();
                    if(mem['tabCrawlers'].row( this ).index() != undefined){
                        fillCrawler(row);
                    }
                });
                $('#crawlersTable_wrapper').attr('style','width:100%;')
            }
        });
    }
    if(tabella == 'seeds'   ){//|| !tabella){
        SingleLoadingScreen('crawler_settings', true);
        $("#seedsTable").dataTable().fnDestroy();
        mem['tabSeeds'] = $('#seedsTable').DataTable( {
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
                "url" : HOST+"/ADMIN.seeds",
                "type": 'POST',
                "data" : {'crawler_id' : mem['crawler_data']['crawler_id']},
                "dataSrc": function(data) {
                    if (data == "no data") {
                        return [];
                    } else {
                        return data['data'];
                    }
                }
            },
            'dataType' : 'json',
            "columns": [
                { "data": "seed"}
            ],
            "initComplete": function(data){
                $('#seedsTable').on('click', 'tbody tr', function () {
                    var row = mem['tabSeeds'].row($(this)).data();
                    $("#seedDisplay").val(row['seed']).attr("disabled", true);
                    $("[jmSeed=offset]").val(mem['tabSeeds'].row($(this)).index());
                    $("#deleteSeedModal").modal('show');
                });
                $('#seedsTable_wrapper').attr('style','width:100%;')
                SingleLoadingScreen('crawler_settings', false);
            }
        });
    }
    if(tabella == 'urls'   ){
        SingleLoadingScreen('crawler_settings', true);
        $("#urlsTable").dataTable().fnDestroy();
        mem['tabUrls'] = $('#urlsTable').DataTable({
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
                "url" : HOST+"/ADMIN.trainingUrl",
                "type": 'POST',
                "data" : {'crawler_id' : mem['crawler_data']['crawler_id']},
            },
            'dataType' : 'json',
            "dataSrc": function(data) {
                if (data == "no data") {
                    return [];
                } else {
                    return data;
                }
            },
            "columns": [
                { "data": "url"},
                { render: function (data, type, row) {
                    if (row.type == 'positive') {
                        return "<span class='badge badge-success'>Positive</span>";
                    }else {
                        return "<span class='badge badge-warning'>Negative</span>";
                    }
                }}
            ],
            "columnDefs": [
                { "width": "20%", "targets": 1 }
            ],
            "initComplete": function(data){
                $('#urlsTable').on('click', 'tbody tr', function () {
                    var row = mem['tabUrls'].row($(this)).data();
                    $("#delete_url").val(row['url']).attr('disabled', true);
                    $("#delete_url_type").val(row['type']).attr('disabled', true);
                    $("[jmURL=offset]").val(mem['tabUrls'].row($(this)).index());
                    $("[jmURL=url_type]").val(row['type']);
                    $("#deleteURLModal").modal('show');
                });
                $('#urlsTable_wrapper').attr('style','width:100%;')
                SingleLoadingScreen('crawler_settings', false);
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
    //crawlerGL();
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
function fillData(target,id){
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
}