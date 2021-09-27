 var mem = {};
mem['sliderStop'] = 0;
 var colorMap = {
     threat :{
         1 : '#48cf2d',
         2 : '#ed9118',
         3 : '#ed9118',
         4 : '#ed1818',
         5 : '#ed1818',
     },
     labelledThreat :{
         1 : 'success',
         2 : 'warning',
         3 : 'warning',
         4 : 'danger',
         5 : 'danger',
     }
 }
 var palette_01 = [
     "#e3193e",
     "#1eb042",
     "#cedb39",
     "#28e0d4",
     "#de8b1f",
     "#1739e6",
     "#981ce6",
     "#e61ca9"
 ]
if(window.sessionStorage.getItem('userdata')){
    mem['userData'] = JSON.parse(window.sessionStorage.getItem('userdata'));
}
if(window.sessionStorage.getItem('caseData')){
    mem['caseData'] = JSON.parse(window.sessionStorage.getItem('caseData'));
}
$(document).ready(function(){
    arm();
    displayGes();
    navigationAction();
    //Action('tm','tabTM');
    loadTabelle();
});
//Dom elements "Arm" Function
function arm(){
    $("#case_lpsd").datetimepicker({'timepicker':false,  format: "d/m/Y"});
    $("#case_rdd").datetimepicker({'timepicker':false,  format: "d/m/Y"});
    $("[target]").click(function (event){
        navigationAction($(this).attr('target'));
    });
    $("[tm_target]").click(function (event){
        Action('tm',$(this).attr('tm_target'));
    });
    $("[cm_target]").click(function (event){
        Action('cm',$(this).attr('cm_target'));
    });
    $("[jmRefresh]").click(function(){
        loadTabelle($(this).attr("jmRefresh"));
    });
    $("[displayer]").click(function(){
        displayGes($(this).attr('displayLabel'),$(this).attr('displayMode'));
    });
    $("[adder]").click(function(event){
        $("#"+$(this).attr('adder')+"FormSubmit").show();
    });

    $("#case_reference_inputButton").click(function(event){
        if($("#case_reference_input").val()){
            var $obj = mem['liReference_clone'].clone(1,1);
            $obj.empty().append($("#case_reference_input").val());
            $("#referenceList").append($obj);
            updateReference();
            $("#case_reference_input").val('');
        }
    });
    $("#case_accounts_inputButton").click(function(event){
        if($("#case_accounts_input").val()){
            var $obj = mem['liAccount_clone'].clone(1,1);
            $obj.empty().append($("#case_accounts_input").val());
            $("#accountList").append($obj);
            updateAccount();
            $("#case_accounts_input").val('');
        }
    });
    //Form
    $("#addCaseForm").ajaxForm({
        enctype: 'multipart/form-data', type: 'post', dataType: 'json', url: HOST + '/LEA.caseAdd', iframe: false,
        beforeSubmit: function () {
            //$("#loading").show();
        },
        success: function (data) {
            //$("#loading").hide();
            if (data.err) {
                alert("Error during the creating of new Case. Please check the data.");
                location.reload();
            } else {
                window.sessionStorage.setItem('caseId', data['caseId']);
                loadTabelle('cases');
                formShow();
            }
        }
    });
    $("#caseFormSubmit").click(function(event){
        $("#addCaseForm").submit();
    });

    //DatePicker
    var data = new Date();
    $('#from_dt').datetimepicker({
        value: mem['caseData']['lps_date'],
        format:'Y/m/d H:i:00',
        formatDate:'Y/m/d',
        formatTime:'H:i:00',
        onShow:function( ct ){
            this.setOptions({
                minDate:mem['caseData']['lps_date']?mem['caseData']['lps_date']:false
            })
            this.setOptions({
                maxDate:mem['caseData']['rd_date']?mem['caseData']['rd_date']:false
            })
        },
    });
    $('#to_dt').datetimepicker({
        value: mem['caseData']['rd_date'],
        format:'Y/m/d H:i:00',
        formatTime:'H:i:00',
        onShow:function( ct ){
            this.setOptions({
                minDate:mem['caseData']['lps_date']?mem['caseData']['lps_date']:false
            })
            this.setOptions({
                maxDate:mem['caseData']['rd_date']?mem['caseData']['rd_date']:false
            })
        },
    });
    $("#timeZone").timezones();
    $("#timeZone").val("Etc/UCT");


    //Device Selection
    $("#deviceSelection").change(function(event){
        //timemachineGL();
    });
    //OMCP
    $("#omcpSearch").click(function (event) {
        dataManager();
    });
    $("#slider-range").slider();
}
//
//Various//
function dataManager(){
    $("#preloader_tm").hide();

    $("#tmContent").show();
    timemachineGL();
    sliderGenerator();
    getData();
    loadTabelle();
}
function navigationAction(target){
    if(!target){ //Da ora in poi, con 1 si identifica l'userId del singolo utente.
                // è una soluzione provvisoria, appena possibile aggiunger il dato nella login
        if(window.localStorage.getItem('caseTargetData') && JSON.parse(window.localStorage.getItem('caseTargetData'))[1]){
            target = JSON.parse(window.localStorage.getItem('caseTargetData'))[1];
        }else{
            target = 'dashOMCP';
        }
    }
    var obj = {};
        obj[1] = target;
    mem['caseTargetData'] = obj;
    window.localStorage.setItem('caseTargetData', JSON.stringify(obj));
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
    //timemachineGL()
    if(obj[1] == 'dashOMCP'){
        Action('tm','tabTM');
    }else{
        Action('cm','tabDevices');
    }

}
function Action(mode, target){
    var obj = {};
    obj[1] = target;
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
}
function displayGes(label, mode){
    if(!label && !mode){
        $("[mode]").each(function(element){
            if($(this).attr('mode') == 'list'){
                $(this).show();
            }else{
                $(this).hide();
            }
        });
        bcReset('list');
        formReset();
    }else{
        $("[label="+label+"]").each(function(element){
            if($(this).attr('mode') == mode){
                $(this).show();
            }else{
                $(this).hide();
            }
        });
        if(mode == 'form'){
            formAdd();
        }
        bcReset(mode);
        formReset();
    }
    //timemachineGL();
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
    $("[toDisabled]").each(function (element) {
        $(this).prop('disabled',true);
    });
    if(!mem['liAccount_clone']){
        mem['liAccount_clone'] = $("[jmli=account]").clone(1,1);
    }
    $("#accountList").empty();
    if(!mem['liReference_clone']){
        mem['liReference_clone'] = $("[jmli=reference]").clone(1,1);
        $("#referenceList").empty();
    }
    $("#referenceList").empty();
}
function formShow(){
    $("[formShow=toDisable]").each(function(element) {
        $(this).prop('disabled',true);
    });
    $("[formShow=toHide]").each(function(element) {
        $(this).hide();
    });
    $("[formShow=toShow]").each(function(element) {
        $(this).show();
    });
}
function formAdd(){
    $("[formAdd=toDisable]").each(function(element) {
        $(this).prop('disabled',true);
    });
    $("[formAdd=toHide]").each(function(element) {
        $(this).hide();
    });
    $("[formAdd=toShow]").each(function(element) {
        $(this).show();
    });
}
function fillData(target, id){
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
        $("#device_owner_label").val(data["ownerData"]["firstname"]+ " " + data["ownerData"]["lastname"]);
        $("#device_type").val(data['type']).prop('disabled', true);
        $("#device_os").val(data['device_info']['OS']).prop('disabled', true);
        $("#device_version").val(data['device_info']['version']).prop('disabled', true);
        $("#device_sdk").val(data['device_info']['sdk']).prop('disabled', true);
        $("#device_manufacturer").val(data['device_info']['manufacturer']).prop('disabled', true);
        $("#device_model").val(data['device_info']['model']).prop('disabled', true);
        $("#device_hwId").val(data['device_info']['hardware_id']).prop('disabled', true);

        $("#deviceFormSubmit").hide();
    }
    formShow();
}
function updateAccount(){
    var accounts = [];
    $("[jmli=account]").each(function(element){
        accounts.push($(this).html());
    })
    $("#hidden_accounts").val(JSON.stringify(accounts));
}
function updateReference(){
    var reference = [];
    $("[jmli=reference]").each(function(element){
        reference.push($(this).html());
    })
    $("#hidden_references").val(JSON.stringify(reference));
}
//Grafici
function timemachineGL(){
    var config = {
        settings:{
            hasHeaders: false,
            constrainDragToContainer: false,
            showCloseIcon: true
        },
        dimensions: {
            borderWidth: 20,
            minItemHeight: 10,
            minItemWidth: 10,
            headerHeight: 32,
            dragProxyWidth: 300,
            dragProxyHeight: 200

        },
        content: [{
            type: 'column',
            content: [
                {
                    type: 'row',
                    content:[{
                        type: 'component',
                        componentName: 'example',
                        cssClass: 'bg-primary',
                        componentState: { text: 'Request', id: 'request', label: 'Request history'},
                        title: 'Request history'

                    }
                    ]
                },
                {
                    type: 'row',
                    content:[{
                        type: 'component',
                        componentName: 'example',
                        cssClass: 'bg-primary',
                        componentState: { text: 'Device active', id: 'devices', label: 'Device active'},
                        title: 'Device Active'
                    }
                    ]
                }
            ]
        }]
    };
    $("#timemachineGL").empty();
    var myLayout = new GoldenLayout( config, '#timemachineGL' );
    myLayout.registerComponent( 'example', function( container, state ){
        container.getElement().html( '<canvas id="'+ state.id +'"></canvas>');
    });
    myLayout.init();
    myLayout.height = myLayout.height+150;
    //graphStorage();
}
function graphStorage(){
    timeSeries();
    deviceActive()
}
function timeSeries(){
    var dateFormat = 'MMMM DD YYYY';
    var baseDate = moment('September 01 2019', dateFormat);
    var date = baseDate;
    var events = [randomEvent(date, 30)];
    while (events.length < 60) {
        date = date.clone().add(1, 'd');
        if (date.isoWeekday() <= 5) {
            events.push(randomEvent(date, events[events.length - 1].y));
        }
    }
    var color = Chart.helpers.color;
    var cfg = {
        type: 'bar',
        data: {
            datasets: [{
                label: "Event registered",
                backgroundColor: color('blue').alpha(0.5).rgbString(),
                borderColor: 'blue',
                data: events,
                type: 'bar',
                pointRadius: 0,
                fill: false,
                lineTension: 0,
                borderWidth: 2
            }]
        },
        options: {
            "responsive": false,
            "maintainAspectRatio": true,
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
                        labelString: 'Number of events'
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
    //ctx.canvas.width = parseFloat($('#request').parent().height() * 0.8);
    //ctx.canvas.height = parseFloat($('#request').height() * 0.6);
    var chart = new Chart(ctx, cfg);
}
function deviceActive(){
    var dateFormat = 'MMMM DD YYYY';
    var baseDate = moment('September 01 2019', dateFormat);
    var date = baseDate;
    var devices = [randomDevice(date, 30)];
    while (devices.length < 60) {
        date = date.clone().add(1, 'd');
        if (date.isoWeekday() <= 5) {
            devices.push(randomDevice(date, devices[devices.length - 1].y));
        }
    }
    var color = Chart.helpers.color;
    var cfg = {
        type: 'bar',
        data: {
            datasets: [{
                label: "Device active",
                backgroundColor: color('purple').alpha(0.5).rgbString(),
                borderColor: 'purple',
                data: devices,
                type: 'line',
                steppedLine:true,
                pointRadius: 0,
                fill: false,
                lineTension: 0,
                borderWidth: 2
            }]
        },
        options: {
            "responsive": true,
            "maintainAspectRatio": false,
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
                        labelString: 'Number of events'
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
    var ctx = $("#devices")[0].getContext('2d');
    //ctx.canvas.width = parseFloat($('#device').parent().height() * 0.8);
    //ctx.canvas.height = parseFloat($('#devices').height() * 0.6);
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
    ctx.canvas.height = parseFloat($('#downloads').height()*0.6);
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
function randomEvent(date, lastClose) {
    if(lastClose >=2 ){
        return {
            t: date.valueOf(),
            y: 0
        };
    }else{
        var open = randomNumber(0, 5).toFixed(0);
        var close = randomNumber(0, 5).toFixed(0);
        return {
            t: date.valueOf(),
            y: close
        };
    }
}
function randomDevice(date, lastClose) {
    if(lastClose * 1.3 > 230){
        lastClose = 230;
    }
    var close = randomNumber(lastClose * 0.7, lastClose * 1.3).toFixed(0);
    return {
        t: date.valueOf(),
        y: close
    };
}
//TM data
function getData(){
    $.post(HOST + '/LEA.TMData', {case_id : mem['caseData']['case_id'],from:mem['date_from'], to:mem['date_to'], tz :$("#timeZone").val(), dif : mem['dif']}, function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            if(data['allEvents']){
                var d = data['allEvents']['data'];
                var labelChart;
                var datasets = [];
                Object.keys(d).forEach(function(element,pos){
                    if(!labelChart){labelChart = d[element]['label']}
                    var ds = {
                            label: element,
                            backgroundColor: palette_01[pos],
                            borderColor: palette_01[pos],
                            data: d[element]['data'],
                            type: 'bar',
                            pointRadius: 0,
                            fill: false,
                            lineTension: 0,
                            borderWidth: 2
                        };
                    datasets.push(ds);
                })
                var cfg = {
                    type: 'bar',
                    data: {
                        labels : labelChart,
                        datasets: datasets
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            xAxes: [{
                                type: 'time',
                                //distribution: 'series',
                                stacked :true,
                            }],
                            yAxes: [{
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Number of events'
                                },
                                stacked :true
                            }]
                        },
                        tooltips: {
                            intersect: false,
                            mode: 'index',
                        }
                    }
                };
                var ctx = $("#request")[0].getContext('2d');
                if(mem['chart_request']){mem['chart_request'].destroy();}
                mem['chart_request'] = new Chart(ctx, cfg);
            }
            if(data['alerts']){
                var d = data['alerts']['data'];
                var cfg = {
                    type: 'bar',
                    data: {
                        labels : d['label'],
                        datasets: [{
                            label: 'Alerts',
                            backgroundColor: palette_01[0],
                            borderColor: palette_01[0],
                            data: d['data'],
                            type: 'bar',
                            pointRadius: 0,
                            fill: false,
                            lineTension: 0,
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            xAxes: [{
                                type: 'time',
                                //distribution: 'series',
                                stacked :true,
                                /*
                                time: {
                                    parser: 'DD/MM/YYYY HH:mm:ss',
                                    // round: 'day'
                                    tooltipFormat: 'DD/MM/YYYY HH:mm:ss'
                                },
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Date'
                                }
                                */
                            }],
                            yAxes: [{
                                scaleLabel: {
                                    display: true,
                                    labelString: 'Number of events'
                                },
                                //stacked :true
                            }]
                        },
                        tooltips: {
                            intersect: false,
                            mode: 'index',
                        }

                    }
                };
                var ctx = $("#devices")[0].getContext('2d');
                if(mem['chart_devices']){mem['chart_devices'].destroy();}
                mem['chart_devices'] = new Chart(ctx, cfg);
            }
        }
    },'json');
}
function sliderGenerator(){
    mem['date_from'] = $("#from_dt").val() ;mem['date_to'] = $("#to_dt").val();
    var from = $("#from_dt").val();
    var to = $("#to_dt").val();
    //var t1 = new Date(from[0], from[1]-1, from[2], from[3], from[4], from[5]);
    //var t2 = new Date(to[0], to[1]-1, to[2], to[3], to[4], to[5]);
    var t1 = new Date(from); var t2 = new Date(to);
    mem['dt_from'] = t1;mem['dt_to'] = t2;
    var dif = t2.getTime() - t1.getTime();
    mem['dif'] = dif;
    var Seconds_from_T1_to_T2 = dif / 1000;
    var Seconds_Between_Dates = Math.abs(Seconds_from_T1_to_T2);
    $("#from_slider").val(mem['date_from']);
    $("#to_slider").val(mem['date_to']);
    $("#slider-range").slider({
         range: true,
         min: 0,
         max: Seconds_Between_Dates/60,
         values: [0, Seconds_Between_Dates/60],
         slide: slideTime
     });
    //slideTime()
}
function slideTime(event, ui){
    var val0 = $("#slider-range").slider("values", 0),
        val1 = $("#slider-range").slider("values", 1);
    var d0 = new Date(mem['dt_from'].getTime() + val0*60*1000);
    var d1 = new Date(mem['dt_from'].getTime() + val1*60*1000);
    mem['date_from'] = JQDateConverter(d0);mem['date_to'] = JQDateConverter(d1);

    var dif = d1.getTime() - d0.getTime();
    mem['dif'] = dif;
    $("#from_slider").val(JQDateConverter(d0));
    $("#to_slider").val(JQDateConverter(d1));
    mem['sliderStop']++;
    setTimeout(function (event){
        mem['sliderStop']--;
        if(mem['sliderStop'] == 0){
            getData();
            loadTabelle();
        }
    }, 2500);

}
function getTime(hours, minutes) {
    var time = null;
    minutes = minutes + "";
    if (hours < 12) {
        time = "AM";
    }
    else {
        time = "PM";
    }
    if (hours == 0) {
        hours = 12;
    }
    if (hours > 12) {
        hours = hours - 12;
    }
    if (minutes.length == 1) {
        minutes = "0" + minutes;
    }
    return hours + ":" + minutes + " " + time;
}
function getDiff(from, to){
    var from = dateSplitter(from, "/");
    var to = dateSplitter(to, "/");
    var t1 = new Date(from[0], from[1]-1, from[2], from[3], from[4], from[5]);
    var t2 = new Date(to[0], to[1]-1, to[2], to[3], to[4], to[5]);
    var dif = t1.getTime() - t2.getTime();
    return dif;
}
//Tabelle
function loadTabelle(tabella){
    if(tabella == 'evidence'   || !tabella){
        $("#evidenceTable").dataTable().fnDestroy();
        mem['tabEvidence'] = $('#evidenceTable').DataTable( {
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
                url: HOST+"/LEA.evidence",
                type: "POST",
                "dataSrc": function(data) {
                    if (!data['data'] || !data['data'].length) {
                        return [];
                    } else {
                        return data.data;
                    }
                }
            },
            "columns": [
                { "data": "Uuid","defaultContent": "<i>Not set</i>"},
                { "data": "Name","defaultContent": "<i>Not set</i>" },
                { "data": "EvidenceDate","defaultContent": "<i>Not set</i>" },
                { "data": "TargetedVulnerability","defaultContent": "<i>Not set</i>" },
                { "data": "TypeOfAttack","defaultContent": "<i>Not set</i>" },
            ],
            "order":[[1, 'asc']],
            "initComplete": function(data){
                /*$('#usersTable').on('click', 'tbody tr', function () {
                    var row = mem['tabUsers'].row($(this)).data();
                    fillUserData(row['_id']);
                });
                $('#usersTable_wrapper').attr('style','width:100%;')
                */
            }
        });
    }
    if(tabella == 'incidentTrack'   || !tabella){
        $("#incidentTrackTable").dataTable().fnDestroy();
        mem['tabEvidence'] = $('#incidentTrackTable').DataTable( {
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
                url: HOST+"/LEA.incidentTrack",
                type: "POST",
                //"data" : {'token' : mem['userData']['token']},
                "dataSrc": function(data) {
                    if (!data['data'] || !data['data'].length) {
                        return [];
                    } else {
                        return data.data;
                    }
                }
            },
            //"serverSide": true,
            //"sortable"  :false,
            "columns": [
                { "data": "Uuid","defaultContent": "<i>Not set</i>"},
                { "data": "Name","defaultContent": "<i>Not set</i>" },
                { "data": "EvidenceFileDataSourceTitle","defaultContent": "<i>Not set</i>" },
                { "data": "EvidenceFileCreationDate","defaultContent": "<i>Not set</i>" },
                { "data": "AttackStatus","defaultContent": "<i>Not set</i>" },
            ],
            "order":[[1, 'asc']],
            "initComplete": function(data){
                /*$('#usersTable').on('click', 'tbody tr', function () {
                 var row = mem['tabUsers'].row($(this)).data();
                 fillUserData(row['_id']);
                 });
                 $('#usersTable_wrapper').attr('style','width:100%;')
                 */
            }
        });
    }
    if(tabella == 'patch'   || !tabella){
        $("#patchTable").dataTable().fnDestroy();
        mem['tabEvidence'] = $('#patchTable').DataTable( {
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
                url: HOST+"/LEA.patch",
                type: "POST",
                //"data" : {'token' : mem['userData']['token']},
                "dataSrc": function(data) {
                    if (!data['data'] || !data['data'].length) {
                        return [];
                    } else {
                        return data.data;
                    }
                }
            },
            //"serverSide": true,
            //"sortable"  :false,
            "columns": [
                { "data": "Uuid","defaultContent": "<i>Not set</i>"},
                { "data": "Name","defaultContent": "<i>Not set</i>" },
                { "data": "DeviceClassUuid","defaultContent": "<i>Not set</i>" },
                { "data": "ReleaseDate","defaultContent": "<i>Not set</i>" },
                { "data": "Status","defaultContent": "<i>Not set</i>" },
            ],
            "order":[[1, 'asc']],
            "initComplete": function(data){
                /*$('#usersTable').on('click', 'tbody tr', function () {
                 var row = mem['tabUsers'].row($(this)).data();
                 fillUserData(row['_id']);
                 });
                 $('#usersTable_wrapper').attr('style','width:100%;')
                 */
            }
        });
    }
    if(tabella == 'devices' || !tabella){
        $("#preloader_devices").hide();
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
                    $("#preloader_devices").hide();
                    if (!data['data'] || !data['data'].length) {
                        return [];
                    } else {
                        return data.data;
                    }
                }
            },
            "serverSide": true,
            "sortable"  :false,
            "processing": true,
            "columns": [
                { "data": "device_info.manufacturer","defaultContent": "<i>Not set</i>"},
                { "data": "device_info.model","defaultContent": "<i>Not set</i>"},
                { render: function (data, type, row) {
                    if(row['ownerData'] && row['ownerData'][0]) {
                        if (row['ownerData'][0]['firstname']) {
                            return row['ownerData'][0]['firstname'] + " " + row['ownerData'][0]['lastname'];
                        } else if (row['owner']) {
                            return row['owner']['id'];
                        } else {
                            return "No owner specified"
                        }
                    }else{
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
                    if(row['device_info']['os']['name'] != 'n/a'){
                        return row['device_info']['os']['name'] +" "+ row['device_info']['os']['version'];
                    }else{
                        return '';
                    }

                }},
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
                },
            ],
            "initComplete": function(data){
                $('#devicesTable').off().on('click', 'tbody tr', function () {
                    var row = mem['tabDevices'].row($(this)).data();
                    fillDeviceData(row['_id'], 'lea', true);
                });
                $('#devicesTable_wrapper').attr('style','width:100%;')
            }
        });
    }
    if(tabella == 'alerts' || !tabella){
        $("#preloader_alerts").hide();
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
            "ajax": {
                url: HOST+"/PS.getAlertsList",
                type: "POST",
                "dataSrc": function(data) {
                    $("#preloader_alerts").hide();
                    if (!data['data']['data'] || !data['data']['data'].length) {
                        return [];
                    } else {
                        return data['data']['data'];
                    }
                }
            },
            "serverSide": true,
            "sortable"  :false,
            "processing": true,
            "columns": [
                {"data": "alert_type", "name": "alert_type", "defaultContent": "<i>Not set</i>"},
                {"data": "device", "name": "device", "defaultContent": "<i>Not set</i>"},
                {"data": "device_type", "name": "device_type", "defaultContent": "<i>Not set</i>"},
                {
                    "data": "criticality",
                    "name": "criticality",
                    "defaultContent": "<i>Not set</i>",
                    render: function (data, type, row) {
                        var width = 0;
                        var values = 0;
                        var color = colorMap['labelledThreat'][5];
                        if (data) {
                            width = parseFloat(data / 5) * 100;
                            values = data;
                            color = colorMap['labelledThreat'][data];
                        }
                        return '<div class="progress">' +
                            '<div class="progress-bar bg-' + color + '" role="progressbar" style="width: ' + width + '%" aria-valuenow="' + values + '" aria-valuemin="' + values + '" aria-valuemax="5"></div>' +
                            '</div>'
                    }
                },
                {
                    "data": "importance",
                    "name": "importance",
                    "defaultContent": "<i>Not set</i>",
                    render: function (data, type, row) {
                        var width = 0;
                        var values = 0;
                        var color = colorMap['labelledThreat'][5];
                        if (data) {
                            width = parseFloat(data / 5) * 100;
                            values = data;
                            color = colorMap['labelledThreat'][data];
                        }
                        return '<div class="progress">' +
                            '<div class="progress-bar bg-' + color + '" role="progressbar" style="width: ' + width + '%" aria-valuenow="' + values + '" aria-valuemin="' + values + '" aria-valuemax="5"></div>' +
                            '</div>'
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
                $('#alertsTable').unbind('click');
                $('#alertsTable').on('click', 'tbody tr', function () {
                    var row = mem['tabAlerts'].row($(this)).data();
                    fillAlertData(row);
                });
                $('#alertsTable_wrapper').attr('style', 'width:100%;')
            }
        });
    }
    if(tabella == 'notification' || !tabella) {
        $("#notificationTable").dataTable().fnDestroy();
        mem['tabNotifications'] = $('#notificationTable').DataTable({
            "dom": 'Bfrtip',
            "buttons": [
                {
                    extend: 'copy',
                    text: '<i class="far fa-file"></i> Copy data',
                    className: 'btn'
                },
                {
                    extend: 'csv',
                    text: '<i class="far fa-file-alt "></i> .CSV',
                    className: 'btn'
                },
                {
                    extend: 'excel',
                    text: '<i class="far fa-file-excel"></i> .XLS',
                    className: 'btn'
                },
                {
                    extend: 'pdf',
                    text: '<i class="far fa-file-pdf"></i> .PDF',
                    className: 'btn'
                },
                {
                    extend: 'print',
                    text: '<i class="fa fa-print"></i> Print',
                    className: 'btn'
                },
            ],
            "ajax": {
                "url": HOST + "/PS.getNotificationList",
                "type": "POST",
                "data": {'token': mem['userData']['token']}, // 'owner_id': mem['userData']['_id']},
                "dataSrc": function (data) {

                    if (!data['data'] || !data['data'].length) {
                        SingleLoadingScreen('notificationList', false)
                        return [];
                    } else {
                        SingleLoadingScreen('notificationList', false)
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
                {"name": "img", "width":10, render: function (data, type, row) {
                        if (row['data']['img']) {
                            return "<img src='" + row['data']['img'] + "' height='25px'></img>";
                        } else {
                            return '';
                        }
                    }
                },
                {"data": "title", "name": "title", "width":30, "defaultContent": "<i>Not set</i>"},
                {"data": "data.type", "name": "data.type", "width":20, "defaultContent": "<i>Not set</i>"},
                {"data": "data.threat_level", "name": "data.threat_level", "width":10, "defaultContent": "<i>Not set</i>", render: function(data, type, row){
                        var width = 0;
                        var values = 0;
                        var color = colorMap['labelledThreat'][5];
                        if(data){
                            width = parseFloat(data/5)*100;
                            values = data;
                            color = colorMap['labelledThreat'][data];
                        }
                        return '<div class="progress">' +
                            '<div class="progress-bar bg-'+color+'" role="progressbar" style="width: '+width+'%" aria-valuenow="'+values+'" aria-valuemin="'+values+'" aria-valuemax="5"></div>' +
                            '</div>'
                    }
                },
                {
                    "data": "_insertedTimestamp", "name": "_insertedTimestamp", "width":30,
                    "defaultContent": "<i>Not set</i>",
                    render: function (data, type, row) {
                        return timestampConverter(data);
                    }
                },
            ],
            "initComplete": function (data) {
                $('#notificationTable').unbind('click');
                $('#notificationTable').on('click', 'tbody tr', function () {
                    var row = mem['tabNotifications'].row($(this)).data();
                    fillNotificationData(row);
                });
                $('#notificationTable_wrapper').attr('style', 'width:100%;')
            }
        });
    }
}

function fillNotificationData(data) {
     if(data['data']){
         $.each(data['data'], function(key, value){
             $('[name='+key+']', "#notificationForm").val(value).prop('disabled', 'disabled');
             $('[name]', "#notificationForm").prop('disabled', 'disabled');
         });
     }
     if(data['metadata']){
         if(data['metadata']['vulnerability_id']){
             fillVulnNotificationData(data['metadata']['vulnerability_id'])
             $("#mitigationData").show();
         }
     }
     $("#notificationModalTitle").empty().append(data['title']);
     $("#notificationModal").modal();
 }
function fillVulnNotificationData(vulnerability_id) {
     $.post(HOST + '/PS/vulnerabilityList',{"_id": vulnerability_id}, function (data) {
         if (data) {
             $.each(data['data']['data'][0], function(key, value){
                 $('[name='+key+']', "#mitigationData").val(value).prop('disabled', 'disabled');
                 $('[name]', "#mitigationData").prop('disabled', 'disabled');
             });
         }
     }, 'json');
 }
function fillAlertData(data) {
     if(data['metadata']){
         $.each(data['metadata'], function(key, value){
             $('[name='+key+']', "#alertForm").val(value).prop('disabled', 'disabled');
         });
     }
     $('[name]', "#alertForm").prop('disabled', 'disabled');
     $("#alertModalTitle").empty().append("Alert's data");
     $("#alertModal").modal();
 }

function dateConverter(date){
    //date in aaa-mm-dd hh-mm-ss
    var s1 = date.split(" ");
    var dateData = s1[0].split("-");
    var hourData = s1[0].split(":");
    var d = dateData[2]+"/"+dateData[1]+"/"+dateData[0];
    return d
}
function dateConverterT(date){
     //date in aaa-mm-ddThh-mm-ss
     var s1 = date.split("T");
     var dateData = s1[0].split("-");
     var hourData = s1[1].split(":");
     var sec = hourData[2].split(".")
     var d = dateData[2]+"/"+dateData[1]+"/"+dateData[0] + " " + hourData[0]+":"+hourData[1]+":"+sec[0];
     return d
 }
function datesplitter(date){
     //date in aaa-mm-dd hh-mm-ss
    var s1 = date.split(" ");
    var dateData = s1[0].split("-");
    dateData[0] = parseInt(dateData[0]);
    dateData[1] = parseInt(dateData[1]);
    dateData[2] = parseInt(dateData[2]);

    var oggi = new Date().getTime();
    var d = new Date(dateData[0], dateData[1], dateData[2] ).getTime()
    var diff = oggi-d;

     var d2 = new Date(diff)

     var y = d2.getFullYear();
     var m = d2.getMonth() + 2;
     var g = d2.getDate();
     var d3 = y+"/"+m+"/"+g;

     return d3;
}
function timestampConverter(data){
     var v = data.split("T");
     var d = v[0].split("-");
     var h = v[1].split(":");
     return d.reverse().join("/") + " " +h[0]+":"+h[1];
}
function JQDateConverter(d){
    var year = d.getFullYear();
    var month = d.getMonth()+1;
    var day = d.getDate();
    var hours = d.getHours();
    var minutes = d.getMinutes();
    var seconds = d.getSeconds();
    var output =  year+ '/' +
        (month<10 ? '0' : '') + month + '/' +
        (day<10 ? '0' : '') + day +" "+
        (hours<10 ? '0' : '') + hours + ":"+
        (minutes<10 ? '0' : '') + minutes + ":"+
        (seconds<10 ? '0' : '') + seconds;
    return output;
}
