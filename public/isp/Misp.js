/**
 * Created by simone on 05/04/20.
 */
var cvssV2Palette = ['#c12e2a','#ec971f','#E3CC13'];
var cvssV3Palette = ['#000','#c12e2a', '#ec971f','#E3CC13']
function armMisp(){
    getHist({'time':1}, function(data){
        mem['dataVulnHist'] = data;
        updateYearList(data, function(event){
            MispTabManager( null, true);
        });
        $("[misp_target]").click(function (event){
            MispTabManager($(this).attr('misp_target'));
        });
        $("#productList").click(function (event) {
            event.stopPropagation();
            productsGL();
        })
    });
}
function MispTabManager(tab, start){
    if(!tab){
        if(window.localStorage.getItem('ispMispTabData') && JSON.parse(window.localStorage.getItem('ispMispTabData'))){
            tab = JSON.parse(window.localStorage.getItem('ispMispTabData'));
        }else {
            tab = 'tabMispVuln';
        }
    }
    window.localStorage.setItem('ispMispTabData', JSON.stringify(tab));
    mem['MispTabActive'] =tab;
    $("[misp_target]").each(function(element){
        if( $(this).attr('misp_target') == tab){
            $(this).addClass('active');
        }else{
            $(this).removeClass('active');
        }
    })
    $("[misp_landing]").each(function(element){
        if( $(this).attr('misp_landing') == tab){
            $(this).show();
        }else{
            $(this).hide();
        }
    });
    GLManager(tab);
}
function GLManager(tab){
    if(window.localStorage.getItem('ispMispTabData') && JSON.parse(window.localStorage.getItem('ispMispTabData'))){
        tab = JSON.parse(window.localStorage.getItem('ispMispTabData'));
    }else {
        tab = 'tabMispVuln';
    }
    if(tab == 'tabMispVuln'){
        vulnManager();
    }
    if(tab == 'tabMispCVSS'){
        cvssManager();
    }
    if(tab == 'tabMispExploits'){
        exploitsManager();
    }
    if(tab == 'tabMispProducts'){
        productsManager();
    }
}
function vulnManager(){
    var year = $("#vuln_yearDD").html();
    if(year && year != 'All'){
        omcpVuln(year);
    }else{
        omcpGL(mem['dataVulnHist']);
    }
}
function cvssManager(){
    var year = $("#vuln_yearDD").html();
    if(year && year != 'All'){
        cvssGL(year);
    }else{
        cvssGL();
    }
}
function exploitsManager(){
    var year = $("#vuln_yearDD").html();
    if(year && year != 'All'){
        exploitsGL(year);
    }else{
        exploitsGL();
    }
}
function productsManager(){
    productsGL();
}
//Common
function getHist(option, cb){
    if(mem['vunHist'] && mem['vunHist'] == 1){console.log("Stoppato vunHist");return false;}
    mem['vunHist'] = 1;
    $.post(HOST + '/MISP.vulnHist',{option: option}, function(data) {
        mem['vunHist'] = 0;
        if(data['err']){
            alert(data['err']);
        }else{
            cb(data['data']);
        }
    },'json');

}
function updateYearList(data,cb){
    $("#yearContainer").empty();
    var $option = $("<a class='dropdown-item'>All</a>");
    $option.click(function(event){
        yearChange('vuln', $(this).html(), data);
    });
    $("#yearContainer").append($option);

    data.forEach(function(year){
        var $obj = $option.clone(1,1);
        $obj.empty().append(year['time']);
        $obj.val(year['time']);
        $("#yearContainer").append($obj);
    });
    $("#dropdownMenuButton").dropdown('update');
    yearChange('vuln', 'All', data);
    cb(true);
}
function yearChange(graph, year, data){
    $("#"+graph+"_yearDD").html(year);
    //GLManager();
    vulnManager();
}
//Vulnerabilities
function omcpGL(data){
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
            type: 'row',
            height : '30px',
            content: [
                {
                    type: 'component',
                    componentName: 'example',
                    cssClass: 'bg',
                    componentState: { text: 'Vulnerabilities', id: 'vuln', label: 'Vulnerabilities'},
                    title: 'Vulnerabilities'
                },
            ]
        }]
    };
    $("#omcpGL").empty();
    var myLayout = new GoldenLayout( config, '#omcpGL' );
    myLayout.registerComponent( 'example', function( container, state ){
        container.getElement().html( '<canvas id="'+ state.id +'" height="100px" width="300px"></canvas>').height('100px');
        container.getElement().html( '<div id="preloader_'+ state.id +'" class=preloader"><div class=loader></div></div><canvas id="'+ state.id +'"></canvas>');
    });
    myLayout.init();
    myLayout.updateSize(myLayout.width, 500);
    $("#omcpGL").css('height', '510px');
    //Load Histogram
    //$('#vuln').parent().append($("<div id='preloader_omcpVuln' class=preloader><div class=loader></div></div>"));
    years_vuln(data);
    //Load stats
    getLast();
    getStatsVuln();
    getEvdbContains();
}
function omcpVuln(year){
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
        content: [
            {
                type: 'column',
                content: [
                    {
                        type: 'component',
                        componentName: 'example',
                        cssClass: 'bg',
                        componentState: { text: 'Vulnerabilities', id: 'vuln', label: 'Vulnerabilities'},
                        title: 'Vulnerabilities'
                    },
                    {
                        type: 'row',
                        content:[
                            {
                                type: 'component',
                                componentName: 'example',
                                componentState: { text: 'Type', id: 'type_pie', label: 'Type' },
                                title: 'Type'
                            },
                            {
                                type: 'component',
                                componentName: 'example',
                                componentState: { text: 'Product', id: 'product_pie', label: 'Product' },
                                title: 'Product'
                            },
                            {
                                type: 'component',
                                componentName: 'example',
                                componentState: { text: 'Remediation', id: 'reme_pie', label: 'Remediation' },
                                title: 'Remediation'
                            },
                            {
                                type: 'component',
                                componentName: 'example',
                                componentState: { text: 'Exploitability', id: 'explo_pie', label: 'Exploitability' },
                                title: 'Exploitability'
                            }
                        ]
                    }
                ]
            }]
    };
    $("#omcpGL").empty();
    var myLayout = new GoldenLayout( config, '#omcpGL' );
    myLayout.registerComponent( 'example', function( container, state ){
        container.getElement().html( '<canvas id="'+ state.id +'" height="100px" width="300px"></canvas>').height('100px');
    });
    myLayout.init();
    myLayout.updateSize(myLayout.width, 500);
    $('#vuln').parent().append($("<div id='preloader_omcpVuln' class=preloader><div class=loader></div></div>"));
    $('#type_pie').parent().append($("<div id='preloader_omcpTypePie' class=preloader><div class=loader></div></div>"));
    $('#product_pie').parent().append($("<div id='preloader_omcpProductPie' class=preloader><div class=loader></div></div>"));
    $('#reme_pie').parent().append($("<div id='preloader_omcpRemePie' class=preloader><div class=loader></div></div>"));
    $('#explo_pie').parent().append($("<div id='preloader_omcpExploPie' class=preloader><div class=loader></div></div>"));
    //Load stats
    $("#latestCVES").hide();
    getStatsVuln(year)
    getEvdbContains()
    singleY_vuln(year);
    getAggregate(year);
}
function years_vuln(data){
    var labels = [];
    var values = [];
    data.forEach(function(year){
        labels.push(year['time']);
        values.push(year['count']);
    });
    var cfg ={
        "type":"bar",
        "data":{
            "labels": labels,
            //"labels":[2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009,2008,2007,2006,2005,2004,2003,2002,2001,2000],
            "datasets":[
                {
                    "label":null,
                    //"data":["1485","18492","17506","16300","8336","7199","8699","6812","6169","4413","4950","5627","6209","8256","8431","5815","3299","2210","2255","1707","1142"],
                    "data" : values,
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
    var ctx = $("#vuln")[0].getContext('2d');
    SingleLoadingScreen('vuln', false);
    if(mem['vulnChart']){mem['vulnChart'].destroy();}
    mem['vulnChart'] = new Chart(ctx, cfg);
}
function singleY_vuln(year){
    var option = {'time':2, 'year': year};
    getHist(option, function(data){
        var labels = [];
        var values = [];
        data.forEach(function(time){
            labels.push(time['month']);
            values.push(time['count'])
        })
        if(mem['vulnChart']){mem['vulnChart'].destroy();}
        var cfg ={"type":"line","data":{"labels":labels,"datasets":[{"label":"Entries","data":values,"backgroundColor":"rgba(0,51,204,0.4)"}]},"options":{"scaleShowVerticalLines":false,"scaleShowHorizontalLines":"false","customAtZeroYAxes":1,"responsive":true,"maintainAspectRatio":false,"legend":{"display":false},"scales":{"xAxes":[{"ticks":{"maxRotation":0},"gridLines":{"display":false},"display":true}],"yAxes":[{"gridLines":{"display":false},"display":true,"ticks":{"beginAtZero":true,"stepSize":""}}]}}};
        var ctx = $("#vuln")[0].getContext('2d');
        SingleLoadingScreen('omcpVuln', false);
        mem['vulnChart'] = new Chart(ctx, cfg);
    });

}
function type_pie(data){
    var cfg ={
        "type":"pie",
        "data":{
            "datasets":[
                {
                    "data":data['data'],
                    "backgroundColor":[
                        "#637092",
                        "#727e9c",
                        "#828ca7",
                        "#919ab2",
                        "#a1a9bd",
                        "#b1b7c8",
                        "#c0c5d3",
                        "#d0d4de",
                        "#dfe2e9",
                        "#eff0f4",
                        "#f0f1f5",
                        "#f2f3f6",
                        "#f3f4f7",
                        "#f5f6f8",
                        "#f7f7f9",
                        "#f8f9fa",
                        "#fafafb",
                        "#fbfcfc",
                        "#fdfdfd",
                        "#ffffff"

                    ]
                }
            ],
            "labels": data['label']
        },
        "options":{
            "customHideXAxes":"true",
            "customHideYAxes":"true",
            "responsive":true,
            "maintainAspectRatio":false,
            "legend":{
                "display":false

            },
            "scaleShowVerticalLines":false,
            "scales":{
                "xAxes":[
                    {
                        "ticks":{
                            "maxRotation":0
                        },
                        "gridLines":{
                            "display":false
                        },
                        "display":false
                    }
                ],
                "yAxes":[
                    {
                        "gridLines":{
                            "display":false

                        },
                        "display":false,
                        "ticks":{
                            "beginAtZero":false,
                            "stepSize":""

                        }

                    }
                ]

            },
            "title":{
                display : true,
                text : "Attack vector",
                fontStyle :"bold"
            }
        }
    };
    var ctx = $("#type_pie")[0].getContext('2d');
    SingleLoadingScreen('omcpTypePie', false);
    var chart = new Chart(ctx, cfg);
}
function product_pie(data){
    var cfg ={"type":"pie","data":{"datasets":[{"data":data['data'],"backgroundColor":["#638892","#72939c","#829fa7","#91abb2","#a1b7bd","#b1c3c8","#c0cfd3","#d0dbde","#dfe7e9","#eff3f4","#f0f4f5","#f2f5f6","#f3f6f7","#f5f7f8","#f7f9f9","#f8fafa","#fafbfb","#fbfcfc","#fdfdfd","#ffffff"]}],"labels":data['label']},"options":{"customHideXAxes":"true","customHideYAxes":"true","responsive":true,"maintainAspectRatio":false,"legend":{"display":false},"scaleShowVerticalLines":false,"scales":{"xAxes":[{"ticks":{"maxRotation":0},"gridLines":{"display":false},"display":false}],"yAxes":[{"gridLines":{"display":false},"display":false,"ticks":{"beginAtZero":false,"stepSize":""}}]}}};
    cfg['options']['title'] = {
        display : true,
        text : "User interaction",
        fontStyle :"bold"
    };

    var cfg ={
        "type":"pie",
        "data":{
            "datasets":[
                {
                    "data":data['data'],
                    "backgroundColor":["#638892","#72939c","#829fa7","#91abb2","#a1b7bd","#b1c3c8","#c0cfd3","#d0dbde","#dfe7e9","#eff3f4","#f0f4f5","#f2f5f6","#f3f6f7","#f5f7f8","#f7f9f9","#f8fafa","#fafbfb","#fbfcfc","#fdfdfd","#ffffff"]
                }
            ],
            "labels": data['label']
        },
        "options":{
            "customHideXAxes":"true",
            "customHideYAxes":"true",
            "responsive":true,
            "maintainAspectRatio":false,
            "legend":{
                "display":false

            },
            "scaleShowVerticalLines":false,
            "scales":{
                "xAxes":[
                    {
                        "ticks":{
                            "maxRotation":0
                        },
                        "gridLines":{
                            "display":false
                        },
                        "display":false
                    }
                ],
                "yAxes":[
                    {
                        "gridLines":{
                            "display":false

                        },
                        "display":false,
                        "ticks":{
                            "beginAtZero":false,
                            "stepSize":""

                        }

                    }
                ]

            },
            "title":{
                display : true,
                text : "Attack vector",
                fontStyle :"bold"
            }
        }
    };
    var ctx = $("#product_pie")[0].getContext('2d');
    SingleLoadingScreen('omcpProductPie', false);
    var chart = new Chart(ctx, cfg);
}
function reme_pie(data){
    var cfg ={"type":"pie","data":{"datasets":[{"data":data['data'],"backgroundColor":["#008800","#329f32","#66b766","#cce7cc","#e5f3e5"]}],"labels":data['label']},"options":{"customHideXAxes":"true","customHideYAxes":"true","responsive":true,"maintainAspectRatio":false,"legend":{"display":false},"scaleShowVerticalLines":false,"scales":{"xAxes":[{"ticks":{"maxRotation":0},"gridLines":{"display":false},"display":false}],"yAxes":[{"gridLines":{"display":false},"display":false,"ticks":{"beginAtZero":false,"stepSize":""}}]}}};
    cfg['options']['title'] = {
        display : true,
        text : "Availability impact",
        fontStyle :"bold"
    };
    var ctx = $("#reme_pie")[0].getContext('2d');
    SingleLoadingScreen('omcpRemePie', false);
    var chart = new Chart(ctx, cfg);
}
function explo_pie(data){
    var cfg ={"type":"pie","data":{"datasets":[{"data":data['data'],"backgroundColor":["#880000","#9f3232","#b76666","#e7cccc","#f3e5e5"]}],"labels":data['label']},"options":{"customHideXAxes":"true","customHideYAxes":"true","responsive":true,"maintainAspectRatio":false,"legend":{"display":false},"scaleShowVerticalLines":false,"scales":{"xAxes":[{"ticks":{"maxRotation":0},"gridLines":{"display":false},"display":false}],"yAxes":[{"gridLines":{"display":false},"display":false,"ticks":{"beginAtZero":false,"stepSize":""}}]}}};
    cfg['options']['title'] = {
        display : true,
        text : "Exploitation",
        fontStyle :"bold"
    };
    var ctx = $("#explo_pie")[0].getContext('2d');
    SingleLoadingScreen('omcpExploPie', false);
    var chart = new Chart(ctx, cfg);
}
function getAggregate(year){
    $.post(HOST + '/MISP.aggregate',{year: year}, function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            type_pie(data['data']['attack_vector']);
            product_pie(data['data']['user_interaction']);
            reme_pie(data['data']['availability_impact']);
            explo_pie(data['data']['confidentiality_impact']);
        }
    },'json');
}
function getLast(){
    $("#latestCVES").show();
    //if(mem['last'] && mem['last'] == 1){console.log("Stoppato last");return false;}
    mem['last'] = 1;
    $.post(HOST + '/MISP.last',function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            Object.keys(data['data']).forEach(function(key){
                $("[jmData="+key+"]").empty().append(data['data'][key]);
            });
        }
        mem['last'] = 0;
        SingleLoadingScreen('table_RecProc', false);
    },'json');
}
function getStatsVuln(year){
    //if(mem['statVuln'] && mem['statVuln'] == 1){console.log("Stoppato statVuln");return false;}
    mem['statVuln'] = 1;
    $.post(HOST + '/MISP.statsVuln',{'year': year},function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            Object.keys(data['data']).forEach(function(key){
                $("[jmData="+key+"]").empty().append(data['data'][key]);
            });
        }
        mem['statVuln'] = 0;
        SingleLoadingScreen('table_StatusCount', false);
    },'json');
}
function getEvdbContains(){
    $.post(HOST + '/MISP.evdbContains',function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            Object.keys(data['data']).forEach(function(key){
                $("[jmData=evdb_"+key+"]").empty().append(data['data'][key]);
            });
        }
        //SingleLoadingScreen('table_StatusCount', false);
    },'json');
}
//Cvss
function cvssGL(year){
    var config = {
        settings:{
            hasHeaders: true,
            constrainDragToContainer: false,
            showMaximiseIcon: false,
            showPopoutIcon: false,
            showCloseIcon: false
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
            type: 'stack',
            content: [
                {
                    type: 'component',
                    isClosable: false,
                    componentName: 'example',
                    componentState: { text: 'CVSS V2', id: 'cvssV2Hist', label: 'CVSS V2'},
                    title: 'CVSS V2 Score'
                },
                {
                    type: 'component',
                    isClosable: false,
                    componentName: 'example',
                    cssClass: 'bg',
                    componentState: { text: 'CVSS V3', id: 'cvssV3Hist', label: 'CVSS V3'},
                    title: 'CVSS V3 Score'
                }
            ]
        }]
    };
    $("#cvssGL").empty();
    var myLayout = new GoldenLayout( config, '#cvssGL' );
    myLayout.registerComponent( 'example', function( container, state ){
        container.getElement().html( '<canvas id="'+ state.id +'"></canvas>').height('100px');
    });
    myLayout.init();
    myLayout.updateSize(myLayout.width, 500);
    $("#cvssGL").css('height', '510px');
    $('#cvssV2Hist').parent().append($("<div id='preloader_cvssV2Hist' class=preloader><div class=loader></div></div>"));
    $('#cvssV3Hist').parent().append($("<div id='preloader_cvssV3Hist' class=preloader><div class=loader></div></div>"));
    if(year){
        getCvssYear(year);
    }else{
        getCvssHist();
    }
    getSeverityScore(year);
}
function getSeverityScore(year){
    if(mem['severityScore'] && mem['severityScore'] == 1){console.log("Stoppato severityScore");return false;}
    mem['severityScore'] = 1;
    $.post(HOST + '/MISP.severityScore',{year: year}, function(data) {
        mem['severityScore'] = 0;
        if(data['err']){
            alert(data['err']);
        }else{
            drawSeverityPie(data['data']);
        }
    },'json');
}
function drawSeverityPie(data){
    if(data[0]){
        //V2
        var v2 = {
            'data' : [
                data[0]['v2High'],
                data[0]['v2Medium'],
                data[0]['v2Low']
            ],
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
            'data' : [
                data[0]['v3Critical'],
                data[0]['v3High'],
                data[0]['v3Medium'],
                data[0]['v3Low']
            ],
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
    }
}
function getCvssHist(year){
    if(mem['scoreHistory'] && mem['scoreHistory'] == 1){console.log("Stoppato scoreHistory");return false;}
    mem['scoreHistory'] = 1;
    $.post(HOST + '/MISP.scoreHistory',{year: year}, function(data) {
        mem['scoreHistory'] = 0;
        if(data['err']){
            alert(data['err']);
        }else{
            drawCvssHist(data['data']);
        }
    },'json');
}
function getCvssYear(year){
    $.post(HOST + '/MISP.scoreYear',{year: year}, function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            drawCvssYear(data['data']);
        }
    },'json');
}
function drawCvssHist(data){
    if(data){
        //V2
        var v2Data = {
            labels: data['labels'].reverse(),
            datasets: [{
                label: 'Low',
                backgroundColor: cvssV2Palette[2],
                data: data['v2Low'].reverse()
            }, {
                label: 'Medium',
                backgroundColor: cvssV2Palette[1],
                data: data['v2Medium'].reverse()
            }, {
                label: 'High',
                backgroundColor: cvssV2Palette[0],
                data: data['v2High'].reverse()
            }]
        };
        var cfgV2 = {
            "type": "bar",
            "data": v2Data,
            "options": {
                "legend": {
                    "position": "right",
                    "fullWidth" : false
                },
                title: {
                    display: true,
                    text: 'CVSS V2 Score Distribution over the time'
                },
                tooltips: {
                    mode: 'index',
                    intersect: false
                },
                responsive: true,
                scales: {
                    xAxes: [{
                        stacked: true,
                    }],
                    yAxes: [{
                        stacked: true
                    }]
                },
                "responsive": true,
                "maintainAspectRatio": false
            }
        }
        var ctxV2 = $("#cvssV2Hist")[0].getContext('2d');
        if(mem['cvssV2Hist']){mem['cvssV2Hist'].destroy();}
        SingleLoadingScreen('cvssV2Hist', false);
        mem['cvssV2Hist'] = new Chart(ctxV2, cfgV2);

        //V3
        var v3Data = {
            labels: data['labels'].reverse(),
            datasets: [{
                label: 'Low',
                backgroundColor: cvssV3Palette[3],
                data: data['v3Low'].reverse()
            }, {
                label: 'Medium',
                backgroundColor: cvssV3Palette[2],
                data: data['v3Medium'].reverse()
            }, {
                label: 'High',
                backgroundColor: cvssV3Palette[1],
                data: data['v3High'].reverse()
            },{
                label: 'Critical',
                backgroundColor: cvssV3Palette[0],
                data: data['v3Critical'].reverse()
            }]
        };
        var cfgV3 = {
            "type": "bar",
            "data": v3Data,
            "options": {
                "legend": {
                    "position": "right",
                    "fullWidth" : false
                },
                title: {
                    display: true,
                    text: 'CVSS V3 Score Distribution over the time'
                },
                tooltips: {
                    mode: 'index',
                    intersect: false
                },
                responsive: true,
                scales: {
                    xAxes: [{
                        stacked: true,
                    }],
                    yAxes: [{
                        stacked: true
                    }]
                },
                "responsive": true,
                "maintainAspectRatio": false
            }
        }
        var ctxV3 = $("#cvssV3Hist")[0].getContext('2d');
        if(mem['cvssV3Hist']){mem['cvssV3Hist'].destroy();}
        SingleLoadingScreen('cvssV3Hist', false);
        mem['cvssV3Hist'] = new Chart(ctxV3, cfgV3);
    }
}
function drawCvssYear(data){
    if(data){
        //V2
        var v2Data = {
            labels: data['labels'],
            datasets: [{
                label: 'Low',
                backgroundColor: cvssV2Palette[2],
                data: data['v2Low'],
                lineTension: 0,
            }, {
                label: 'Medium',
                backgroundColor: cvssV2Palette[1],
                data: data['v2Medium'],
                lineTension: 0,
            }, {
                label: 'High',
                backgroundColor: cvssV2Palette[0],
                data: data['v2High'],
                lineTension: 0,
            }]
        };
        var cfgV2 = {
            "type": "line",
            "data": v2Data,
            "options": {
                "legend": {
                    "position": "right",
                    "fullWidth" : false
                },
                title: {
                    display: true,
                    text: 'CVSS V2 Score Distribution over the time'
                },
                tooltips: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    xAxes: [{
                        stacked: true
                    }],
                    yAxes: [{
                        stacked: true
                    }]
                },
                "responsive": true,
                "maintainAspectRatio": false
            }
        }
        var ctxV2 = $("#cvssV2Hist")[0].getContext('2d');
        if(mem['cvssV2Hist']){mem['cvssV2Hist'].destroy();}
        SingleLoadingScreen('cvssV2Hist', false);
        mem['cvssV2Hist'] = new Chart(ctxV2, cfgV2);

        //V3
        var v3Data = {
            labels: data['labels'],
            datasets: [{
                label: 'Low',
                backgroundColor: cvssV3Palette[3],
                data: data['v3Low'],
                lineTension: 0
            }, {
                label: 'Medium',
                backgroundColor: cvssV3Palette[2],
                data: data['v3Medium'],
                lineTension: 0
            }, {
                label: 'High',
                backgroundColor: cvssV3Palette[1],
                data: data['v3High'],
                lineTension: 0
            },{
                label: 'Critical',
                backgroundColor: cvssV3Palette[0],
                data: data['v3Critical'],
                lineTension: 0
            }]
        };
        var cfgV3 = {
            "type": "line",
            "data": v3Data,
            "options": {
                "legend": {
                    "position": "right",
                    "fullWidth" : false
                },
                title: {
                    display: true,
                    text: 'CVSS V3 Score Distribution over the time'
                },
                tooltips: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    xAxes: [{
                        stacked: true
                    }],
                    yAxes: [{
                        stacked: true
                    }]
                },
                "responsive": true,
                "maintainAspectRatio": false
            }
        }
        var ctxV3 = $("#cvssV3Hist")[0].getContext('2d');
        if(mem['cvssV3Hist']){mem['cvssV3Hist'].destroy();}
        SingleLoadingScreen('cvssV3Hist', false);
        mem['cvssV3Hist'] = new Chart(ctxV3, cfgV3);
    }
}
//Exploits
function exploitsGL(year){
    var config = {
        settings:{
            hasHeaders: true,
            constrainDragToContainer: false,
            showMaximiseIcon: false,
            showPopoutIcon: false,
            showCloseIcon: false
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
            type: 'row',
            content: [
                {
                    type: 'component',
                    componentName: 'chart',
                    cssClass: 'bg',
                    componentState: { text: 'Exploits', id: 'exploits_timeline', label: 'exploits'},
                    title: 'Exploits'
                },
            ]
        }]
    };
    $("#exploitsGL").empty();
    var myLayout = new GoldenLayout( config, '#exploitsGL' );
    myLayout.registerComponent( 'chart', function( container, state ){
        container.getElement().html( '<div id="preloader_'+ state.id +'" class=preloader style="displ__ay: none;"><div class=loader></div></div><canvas id="'+ state.id +'"></canvas>');
    });
    $("#exploitsGL").css('height', '510px');
    myLayout.init();
    myLayout.updateSize(myLayout.width, 500);
    getExploitsHist(year);
}
function getExploitsHist(year){
    $.post(HOST + '/MISP.exploitsHist', {year: year},function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            var labels = [];
            var values = [];
            data['data'].forEach(function(year){
                labels.push(year['time']);
                values.push(year['count']);
            });
            var cfg;
            if(!year) {
                cfg = {
                    "type": "bar",
                    "data": {
                        "labels": labels,
                        //"labels":[2020,2019,2018,2017,2016,2015,2014,2013,2012,2011,2010,2009,2008,2007,2006,2005,2004,2003,2002,2001,2000],
                        "datasets": [
                            {
                                "label": null,
                                //"data":["1485","18492","17506","16300","8336","7199","8699","6812","6169","4413","4950","5627","6209","8256","8431","5815","3299","2210","2255","1707","1142"],
                                "data": values,
                                "backgroundColor": "rgba(0,51,204,0.4)"
                            }
                        ]
                    },
                    "options": {
                        "scaleShowVerticalLines": false,
                        "scaleShowHorizontalLines": "false",
                        "customAtZeroYAxes": 1,
                        "responsive": true,
                        "maintainAspectRatio": false,
                        "legend": {
                            "display": false
                        },
                        "scales": {
                            "xAxes": [
                                {
                                    "ticks": {"maxRotation": 0},
                                    "gridLines": {
                                        "display": false
                                    },
                                    "display": true
                                }
                            ],
                            "yAxes": [
                                {
                                    "gridLines": {
                                        "display": false
                                    },
                                    "display": true,
                                    "ticks": {
                                        "beginAtZero": true,
                                        "stepSize": ""
                                    }
                                }
                            ]
                        }
                    }
                };
            }else{
                cfg ={"type":"line","data":{"labels":labels,"datasets":[{"label":"Entries","data":values,"backgroundColor":"rgba(0,51,204,0.4)"}]},"options":{"scaleShowVerticalLines":false,"scaleShowHorizontalLines":"false","customAtZeroYAxes":1,"responsive":true,"maintainAspectRatio":false,"legend":{"display":false},"scales":{"xAxes":[{"ticks":{"maxRotation":0},"gridLines":{"display":false},"display":true}],"yAxes":[{"gridLines":{"display":false},"display":true,"ticks":{"beginAtZero":true,"stepSize":""}}]}}};
            }
            var ctx = $("#exploits_timeline")[0].getContext('2d');
            SingleLoadingScreen('exploits_timeline', false);
            if(mem['exploits_timelineChart']){mem['exploits_timelineChart'].destroy();}
            mem['exploits_timelineChart'] = new Chart(ctx, cfg);
        }
    },'json');
}
function getExploitsYear(year){
    $.post(HOST + '/MISP.scoreYear',{year: year}, function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            drawExploitsYear(data['data']);
        }
    },'json');
}
//Products
function productsGL(year){
    $("#productsAll").show();
    $("#productsSingle").hide();
    var config = {
        settings:{
            hasHeaders: true,
            constrainDragToContainer: false,
            showMaximiseIcon: false,
            showPopoutIcon: false,
            showCloseIcon: false
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
            type: 'row',
            content: [
                {
                    type: 'component',
                    componentName: 'chart',
                    cssClass: 'bg',
                    componentState: { text: 'Products', id: 'products_bars', label: 'products_bars'},
                    title: 'Products'
                },
                {
                    type: 'component',
                    componentName: 'chart',
                    cssClass: 'bg',
                    width: 30,
                    componentState: { text: 'Type', id: 'products_part', label: 'products_part'},
                    title: 'Products Type'
                }
            ]
        }]
    };
    $("#productsGL").empty();
    var myLayout = new GoldenLayout( config, '#productsGL' );
    myLayout.registerComponent( 'chart', function( container, state ){
        container.getElement().html( '<div id="preloader_'+ state.id +'" class=preloader style="displ__ay: none;"><div class=loader></div></div><canvas id="'+ state.id +'"></canvas>');
    });
    $("#productsGL").css('height', '510px');
    myLayout.init();
    myLayout.updateSize(myLayout.width, 500);
    getProductsData();
}
function getProductsData(){
    getVendorData();
    getPartData();
    getVendorTable();
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
function getPartData(){
    $.post(HOST + '/MISP.partData', function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            var cfg ={
                "type":"pie",
                "data":{
                    "datasets":[
                        {
                            "data":data['data']['values'],
                            "backgroundColor":[
                                "#637092",
                                "#727e9c",
                                "#828ca7",
                                "#919ab2",
                                "#a1a9bd",
                                "#b1b7c8",
                                "#c0c5d3",
                                "#d0d4de",
                                "#dfe2e9",
                                "#eff0f4",
                                "#f0f1f5",
                                "#f2f3f6",
                                "#f3f4f7",
                                "#f5f6f8",
                                "#f7f7f9",
                                "#f8f9fa",
                                "#fafafb",
                                "#fbfcfc",
                                "#fdfdfd",
                                "#ffffff"

                            ]
                        }
                    ],
                    "labels": data['data']['labels']
                },
                "options":{
                    "customHideXAxes":"true",
                    "customHideYAxes":"true",
                    "responsive":true,
                    "maintainAspectRatio":false,
                    "legend":{
                        "display":false

                    },
                    "scaleShowVerticalLines":false,
                    "scales":{
                        "xAxes":[
                            {
                                "ticks":{
                                    "maxRotation":0
                                },
                                "gridLines":{
                                    "display":false
                                },
                                "display":false
                            }
                        ],
                        "yAxes":[
                            {
                                "gridLines":{
                                    "display":false

                                },
                                "display":false,
                                "ticks":{
                                    "beginAtZero":false,
                                    "stepSize":""

                                }

                            }
                        ]

                    },
                    "title":{
                        display : true,
                        fontStyle :"bold"
                    }
                }
            };
            var ctx = $("#products_part")[0].getContext('2d');
            SingleLoadingScreen('products_part', false);
            if(mem['products_part']){mem['products_part'].destroy();}
            mem['products_part'] = new Chart(ctx, cfg);
        }
    },'json');
}
function getVendorTable(){
    $("#vendorTable").dataTable().fnDestroy();
    mem['tabVendor'] = $('#vendorTable').DataTable( {
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
            url: HOST+"/MISP.vendorTable",
            type: "POST",
            "dataSrc": function(data) {
                if (!data['data'] || !data['data'].length) {
                    return [];
                } else {
                    return data.data;
                }
            }
        },
        //"serverSide": true,
        "sortable"  :false,
        "columns": [
            { "data": "pos","defaultContent": "0"},
            { "data": "vendor","defaultContent": "<i>Not set</i>" },
            { "data": "nprod","defaultContent": "<i>Not set</i>" },
            { "data": "parts","defaultContent": "<i>Not set</i>" },
            { "data": "count","defaultContent": "<i>Not set</i>" }
        ],
        "initComplete": function(data){
            $('#vendorTable').on('click', 'tbody tr', function () {
                var row = mem['tabVendor'].row($(this)).data();
                singleProductsGL(row['vendor']);
            });
            $('#vendorTable_wrapper').attr('style','width:100%;')
        }
    });
}

function singleProductsGL(vendor){
    $("#productsAll").hide();
    $("#productsSingle").show();
    var config = {
        settings:{
            hasHeaders: true,
            constrainDragToContainer: false,
            showMaximiseIcon: false,
            showPopoutIcon: false,
            showCloseIcon: false
        },
        dimensions: {
            borderWidth: 20,
            minItemHeight: 10,
            minItemWidth: 10,
            headerHeight: 32,
            dragProxyWidth: 300,
            dragProxyHeight: 200
        },
        content: [
            {
                type: 'column',
                content: [
                    {
                        type: 'row',
                        content: [
                            {
                                type: 'component',
                                componentName: 'chart',
                                cssClass: 'bg',
                                componentState: {text: 'Products', id: 'singleTime', label: 'singleTime'},
                                title: 'Products'
                            }
                        ]
                    },
                    {
                        type: 'row',
                        content: [
                            {
                                type: 'component',
                                componentName: 'chart',
                                cssClass: 'bg',
                                componentState: {
                                    text: 'CVSS during the time',
                                    id: 'products_cvss',
                                    label: 'products_cvss'
                                },
                                title: 'Severity over time'
                            },
                            {
                                type: 'component',
                                componentName: 'chart',
                                cssClass: 'bg',
                                width: 30,
                                componentState: {text: 'Type', id: 'products_part_single', label: 'products_part_single'},
                                title: 'Products Type'
                            }
                        ]
                    }
                ]
            }
        ]
    };
    $("#singleProductsGL").empty();
    var myLayout = new GoldenLayout( config, '#singleProductsGL' );
    myLayout.registerComponent( 'chart', function( container, state ){
        container.getElement().html( '<div id="preloader_'+ state.id +'" class=preloader style="displ__ay: none;"><div class=loader></div></div><canvas id="'+ state.id +'"></canvas>');
    });
    $("#singleProductsGL").css('height', '510px');
    myLayout.init();
    myLayout.updateSize(myLayout.width, 500);
    getSingleProductsData(vendor);
}
function getSingleProductsData(vendor){
    getProductTime(vendor);
    getProductPart(vendor);
    getProductCvss(vendor);
}
function getProductTime(vendor){
    $.post(HOST + '/MISP.productYear', {vendor:vendor}, function(data) {
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
            var ctx = $("#singleTime")[0].getContext('2d');
            SingleLoadingScreen('singleTime', false);
            if(mem['singleTime']){mem['singleTime'].destroy();}
            mem['singleTime'] = new Chart(ctx, cfg);
        }
    },'json');
}
function getProductPart(vendor){
    $.post(HOST + '/MISP.productPart', {vendor:vendor}, function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            var cfg ={
                "type":"pie",
                "data":{
                    "datasets":[
                        {
                            "data":data['data']['values'],
                            "backgroundColor":[
                                "#637092",
                                "#727e9c",
                                "#828ca7",
                                "#919ab2",
                                "#a1a9bd",
                                "#b1b7c8",
                                "#c0c5d3",
                                "#d0d4de",
                                "#dfe2e9",
                                "#eff0f4",
                                "#f0f1f5",
                                "#f2f3f6",
                                "#f3f4f7",
                                "#f5f6f8",
                                "#f7f7f9",
                                "#f8f9fa",
                                "#fafafb",
                                "#fbfcfc",
                                "#fdfdfd",
                                "#ffffff"

                            ]
                        }
                    ],
                    "labels": data['data']['labels']
                },
                "options":{
                    "customHideXAxes":"true",
                    "customHideYAxes":"true",
                    "responsive":true,
                    "maintainAspectRatio":false,
                    "legend":{
                        "display":false

                    },
                    "scaleShowVerticalLines":false,
                    "scales":{
                        "xAxes":[
                            {
                                "ticks":{
                                    "maxRotation":0
                                },
                                "gridLines":{
                                    "display":false
                                },
                                "display":false
                            }
                        ],
                        "yAxes":[
                            {
                                "gridLines":{
                                    "display":false

                                },
                                "display":false,
                                "ticks":{
                                    "beginAtZero":false,
                                    "stepSize":""

                                }

                            }
                        ]

                    },
                    "title":{
                        display : true,
                        fontStyle :"bold"
                    }
                }
            };
            var ctx = $("#products_part_single")[0].getContext('2d');
            SingleLoadingScreen('products_part_single', false);
            if(mem['products_part_single']){mem['products_part_single'].destroy();}
            mem['products_part_single'] = new Chart(ctx, cfg);
        }
    },'json');
}
function getProductCvss(vendor){
    $.post(HOST + '/MISP.productCvss', {vendor:vendor}, function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            cfg ={"type":"line","data":{"labels":data['data']['labels'],"datasets":[{"label":"Entries","data":data['data']['values'],"backgroundColor":"rgba(0,51,204,0.4)"}]},"options":{"scaleShowVerticalLines":false,"scaleShowHorizontalLines":"false","customAtZeroYAxes":1,"responsive":true,"maintainAspectRatio":false,"legend":{"display":false},"scales":{"xAxes":[{"ticks":{"maxRotation":0},"gridLines":{"display":false},"display":true}],"yAxes":[{"gridLines":{"display":false},"display":true,"ticks":{"beginAtZero":true,"stepSize":""}}]}}};
            var ctx = $("#products_cvss")[0].getContext('2d');
            SingleLoadingScreen('products_cvss', false);
            if(mem['products_cvss']){mem['products_cvss'].destroy();}
            mem['products_cvss'] = new Chart(ctx, cfg);
        }
    },'json');
}