/**
 * Created by simone on 26/03/20.
 */
var palette_01 = [
    "#1eb042",
    "#cedb39",
    "#28e0d4",
    "#de8b1f",
    "#e3193e",
    "#1739e6",
    "#981ce6",
    "#e61ca9"
]
function SuricataGLManager(mode){
    if(!mode || mode == 'events'){
        alert("#eccolo")
        EventsGL();
    }
    if(!mode || mode == 'geoMap'){
        GeoMapGL({});
    }
    if(!mode || mode == 'alerts'){
        AlertsGL({});
    }
    if(!mode || mode == 'allEvents'){
        AllEventsGL({});
    }
    if(!mode || mode == 'dns') {
        DNSGL({});
    }
    if(!mode || mode == 'http') {
        HTTPGL({});
    }
}
function armSuricata(){
    $("[jmrefreshdata]").click(function(event){
        event.stopPropagation();
    })
}
//---------------------------------------------Flow---------------------------------------------------------------//
function EventsGL(obj){
    obj['config'] = {
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
                    type: 'column',
                    isClosable: false,
                    componentName: 'chart',
                    title: 'Netflow',
                    content:[
                        {
                            type: 'row',
                            height: 12,
                            content: [
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "Events over time",
                                    componentState: {id: 'event_timeline'}
                                },
                                {
                                    type: 'component',
                                    title: "Bytes",
                                    componentName: 'chart',
                                    componentState: {id: 'event-bytes_timeline'}
                                }
                            ]
                        },
                        {
                            type: 'row',
                            height: 8,
                            content: [
                                {
                                    type: 'component',
                                    title: "Stats",
                                    componentName: 'html',
                                    componentState: {id: 'stats_table'}
                                },
                                {
                                    type: 'component',
                                    title: "Stats for Netflow.Age",
                                    componentName: 'html',
                                    componentState: {id: 'age_table'}
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'column',
                    isClosable: false,
                    componentName: 'chart',
                    title: 'Statistics',
                    content:[
                        {
                            type: 'row',
                            content: [
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "Decoder traffic volume",
                                    componentState: {id: 'decoder_traffic_volume'}
                                }
                            ]
                        },
                        {
                            type: 'row',
                            content: [
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "Memory use",
                                    componentState: {id: 'memory_use'}
                                }
                            ]
                        },
                        {
                            type: 'row',
                            content: [
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "Kernel drops",
                                    componentState: {id: 'kernel_drops'}
                                }
                            ]
                        },
                        {
                            type: 'row',
                            content: [
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "Invalid packets",
                                    componentState: {id: 'invalid_packets'}
                                }
                            ]
                        },
                        {
                            type: 'row',
                            content: [
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "Alerts detected",
                                    componentState: {id: 'alerts_detected'}
                                }
                            ]
                        },
                        {
                            type: 'row',
                            content: [
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "TCP sessions",
                                    componentState: {id: 'tcp_sessions'}
                                }
                            ]
                        },
                        {
                            type: 'row',
                            content: [
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "IP version",
                                    componentState: {id: 'ip_versions'}
                                }
                            ]
                        },
                        {
                            type: 'row',
                            content: [
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "IP protocols",
                                    componentState: {id: 'ip_protocols'}
                                }
                            ]
                        }
                    ]
                }
            ]
        }]
    };
    $("#eventsGL").css('min-height', '1000px' ).empty();
    obj['myLayout'] = new GoldenLayout( obj['config'], '#eventsGL' );
    myLayout.registerComponent( 'chart', function( container, state ){
        container.getElement().html( '<canvas id="'+ state.id +'"></canvas>');
    });
    myLayout.registerComponent( 'html', function( container, state ){
        container.getElement().html( '<div id="'+ state.id +'"></div>');
    });
    myLayout.init();

    $("[title=Statistics]", "#eventsGL").click(function(event){
        suricataFlowRetriever('stats');
    });
    //Start loader
    $('#event_timeline').parent().append($("<div id='preloader_event_timeline' class=preloader style='display: none;'><div class=loader></div></div>"));
    $('#event-bytes_timeline').parent().append($("<div id='preloader_event-bytes_timeline' class=preloader style='display: none;'><div class=loader></div></div>"));
    $('#stats_table').parent().append($("<div id='preloader_stats_table' class=preloader><div class=loader style='display: none;'></div></div>"));
    $('#age_table').parent().append($("<div id='preloader_age_table' class=preloader><div class=loader style='display: none;'></div></div>"));
    //Call the data
    suricataFlowRetriever('netflow');
}
function suricataFlowRetriever(mode){
    if(!mode || mode == 'netflow'){
        SingleLoadingScreen('event_timeline', true);
        SingleLoadingScreen('event-bytes_timeline', true);
        SingleLoadingScreen('stats_table', true);
        SingleLoadingScreen('age_table', true);
        timeLineRetriever();
        flowStatsByte();
        flowStatsAge();
    }
    if(!mode || mode == 'stats') {
        eventsStatRetriever();
    }
}
//TimeLines
function timeLineRetriever(){
    $.get(HOST + '/ISP.timeLineFlow', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            timeLineEvents(data);
        }
    },'json');
}
function timeLineEvents(data){
    var dataObj = {};
    Object.keys(data['data']).forEach(function (mode) {
        dataObj[mode] = {
            "labels": [],
            "datasets": []
        };
        Object.keys(data['data'][mode]).forEach(function (proto, i) {
            dataObj[mode]['labels'] = modDateLabel(data['data'][mode][proto]['label']);
            var dataset = {
                // backgroundColor: utils.transparentize(presets.red),
                borderColor: palette_a[i],
                data: data['data'][mode][proto]['data'],
                label: proto
            }
            dataObj[mode]['datasets'].push(dataset);
        })
    });
    if(mem['eventsTimeline']){mem['eventsTimeline'].destroy();}
    if(mem['eventsBytesTimeline']){mem['eventsBytesTimeline'].destroy();}
    drawEvents_timeline(dataObj['events']);
    drawEvents_bytes(dataObj['bytes']);
    setTimeout(function(){
        timeLineRetriever();
    }, 120000)
}
function drawEvents_timeline(data){
    var cfg = {
        "type": 'line',
        "data": data,
        "options": {
            "legend": {"display": false},
            "title": {
                "display": true,
                "text": 'Events over time'
            },
            "responsive": true,
            "maintainAspectRatio": false,
            scales: {
                xAxes: [{
                    type: 'time'
                }],
                yAxes: [{
                    ticks: {
                        min: 0
                    }
                }]
            },
        }
    };
    var ctx = $("#event_timeline")[0].getContext('2d');
    if(mem['eventsTimeline']){mem['eventsTimeline'].destroy();}
    mem['eventsTimeline'] = new Chart(ctx, cfg);
    SingleLoadingScreen('event_timeline', false);
}
function drawEvents_bytes(data){
    var cfg = {
        "type": 'line',
        "data": data,
        "options": {
            "legend": {"display": false},
            "title": {
                "display": true,
                "text": 'Bytes'
            },
            "responsive": true,
            "maintainAspectRatio": false,
            scales: {
                xAxes: [{
                    type: 'time',

                    /*displayFormats: {
                     //'millisecond': 'HH:II',
                     'second': 'MMM DD',
                     'minute': 'MMM DD',
                     'hour': 'MMM DD',
                     'day': 'MMM DD',
                     'week': 'MMM DD',
                     'month': 'MMM DD',
                     'quarter': 'MMM DD',
                     'year': 'MMM DD',
                     }*/
                }],
                yAxes: [{
                    ticks: {
                        min: 0
                    }
                }]
            },
        }
    };
    var ctx = $("#event-bytes_timeline")[0].getContext('2d');
    if(mem['eventsBytesTimeline']){mem['eventsBytesTimeline'].destroy();}
    mem['eventsBytesTimeline'] = new Chart(ctx, cfg);
    SingleLoadingScreen('event-bytes_timeline', false);
}

function eventsStatRetriever(){
    var box = {};
    decodeTrafficVolume(function(data){
        box['decodeTrafficVolume'] = data;
        memoryUse(function(data){
            box['memoryUse'] = data;
            kernelDrops(function(data){
                box['kernelDrops'] = data;
                invalidPackets(function(data){
                    box['invalidPackets'] = data;
                    alertsDetected(function(data){
                        box['alertsDetected'] = data;
                        tcpSessions(function(data){
                            box['tcpSessions'] = data;
                            IPVersions(function(data){
                                box['IPVersions'] = data;
                                IPProtocol(function(data) {
                                    box['IPProtocol'] = data;
                                    drawStats(box);
                                    setTimeout(function () {
                                        eventsStatRetriever();
                                    }, 60000)
                                });
                            });
                        });
                    });
                });
            });
        });
    })
}
function decodeTrafficVolume(cb){
    $.post(HOST + '/ISP.decodeTrafficVolume', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
        }
    },'json');
}
function memoryUse(cb){
    $.post(HOST + '/ISP.memoryUse', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
        }
    },'json');
}
function kernelDrops(cb){
    $.post(HOST + '/ISP.kernelDrops', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
        }
    },'json');
}
function invalidPackets(cb){
    $.post(HOST + '/ISP.invalidPackets', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
        }
    },'json');
}
function alertsDetected(cb){
    $.post(HOST + '/ISP.alertsDetected', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
        }
    },'json');
}
function tcpSessions(cb){
    $.post(HOST + '/ISP.tcpSessions', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
        }
    },'json');
}
function IPVersions(cb){
    $.post(HOST + '/ISP.IPVersions', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
        }
    },'json');
}
function IPProtocol(cb){
    $.post(HOST + '/ISP.IPProtocol', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
        }
    },'json');
}
function drawStats(data){
    if(data['decodeTrafficVolume']){
        var labels = modDateLabel(data['decodeTrafficVolume']['data']['packets']['label']);
        var cfg = {
            "type": 'line',
            "data": {
                labels : labels,
                datasets :[
                    {
                        borderColor: "#03c6fc",
                        data: data['decodeTrafficVolume']['data']['bytes']['data'],
                        label: 'Bytes'
                    },
                    {
                        borderColor: "#165566",
                        data: data['decodeTrafficVolume']['data']['packets']['data'],
                        label: 'Packets'
                    }
                ]
            },
            "options": {
                "legend": {"display": true, "position": "right"},
                "title": {
                    "display": true,
                    "text": 'Decoder Traffic Value'
                },
                "responsive": true,
                "maintainAspectRatio": false,
                scales: {
                    xAxes: [{
                        type: 'time'
                    }],
                    yAxes: [{
                        ticks: {
                            min: 0
                        }
                    }]
                },
            }
        };
        var ctx = $("#decoder_traffic_volume")[0].getContext('2d');
        if(mem['decoder_traffic_volume']){mem['decoder_traffic_volume'].destroy();}
        mem['decoder_traffic_volume'] = new Chart(ctx, cfg);
        SingleLoadingScreen('decoder_traffic_volume', false);
    }
    if(data['memoryUse']){
        var labels = modDateLabel(data['memoryUse']['data']['flow']['label']);
        var cfg = {
            "type": 'line',
            "data": {
                labels : labels,
                datasets :[
                    {
                        borderColor: "#03c6fc",
                        data: data['memoryUse']['data']['flow']['data'],
                        label: 'Flow'
                    },
                    {
                        borderColor: "#03c6fc",
                        data: data['memoryUse']['data']['ftp']['data'],
                        label: 'FTP'
                    },
                    {
                        borderColor: "#03c6fc",
                        data: data['memoryUse']['data']['http']['data'],
                        label: 'HTTP'
                    },
                    {
                        borderColor: "#03c6fc",
                        data: data['memoryUse']['data']['tcp']['data'],
                        label: 'TCP'
                    },
                ]
            },
            "options": {
                "legend": {"display": true, "position": "right"},
                "title": {
                    "display": true,
                    "text": 'Decoder Traffic Value'
                },
                "responsive": true,
                "maintainAspectRatio": false,
                scales: {
                    xAxes: [{
                        type: 'time'
                    }],
                    yAxes: [{
                        ticks: {
                            min: 0
                        }
                    }]
                },
            }
        };
        var ctx = $("#memory_use")[0].getContext('2d');
        if(mem['memory_use']){mem['memory_use'].destroy();}
        mem['memory_use'] = new Chart(ctx, cfg);
        SingleLoadingScreen('memory_use', false);
    }
    if(data['kernelDrops']){
        var labels = modDateLabel(data['kernelDrops']['data']['label']);
        var cfg = {
            "type": 'bar',
            "data": {
                labels : labels,
                datasets :[
                    {
                        borderColor: "#03c6fc",
                        data: data['kernelDrops']['data']['data'],
                        label: 'Kernel Drops'
                    }
                ]
            },
            "options": {
                "legend": {"display": true, "position": "right"},
                "title": {
                    "display": true,
                    "text": 'Kernel Drops'
                },
                "responsive": true,
                "maintainAspectRatio": false,
                scales: {
                    xAxes: [{
                        type: 'time',
                        barThickness: 5
                    }],
                    yAxes: [{
                        ticks: {
                            min: 0
                        }
                    }]
                },
            }
        };
        var ctx = $("#kernel_drops")[0].getContext('2d');
        if(mem['kernel_drops']){mem['kernel_drops'].destroy();}
        mem['kernel_drops'] = new Chart(ctx, cfg);
        SingleLoadingScreen('kernel_drops', false);
    }
    if(data['invalidPackets']){
        var labels = modDateLabel(data['invalidPackets']['data']['label']);
        var cfg = {
            "type": 'bar',
            "data": {
                labels : labels,
                datasets :[
                    {
                        borderColor: "#03c6fc",
                        data: data['invalidPackets']['data']['data'],
                        label: 'Invalid Packets'
                    }
                ]
            },
            "options": {
                "legend": {"display": true, "position": "right"},
                "title": {
                    "display": true,
                    "text": 'Invalid Packets'
                },
                "responsive": true,
                "maintainAspectRatio": false,
                scales: {
                    xAxes: [{
                        type: 'time',
                        barThickness: 5

                    }],
                    yAxes: [{
                        ticks: {
                            min: 0
                        }
                    }]
                },
            }
        };
        var ctx = $("#invalid_packets")[0].getContext('2d');
        if(mem['invalid_packets']){mem['invalid_packets'].destroy();}
        mem['invalid_packets'] = new Chart(ctx, cfg);
        SingleLoadingScreen('invalid_packets', false);
    }
    if(data['alertsDetected']){
        var labels = modDateLabel(data['alertsDetected']['data']['label']);
        var cfg = {
            "type": 'bar',
            "data": {
                labels : labels,
                datasets :[
                    {
                        borderColor: "#03c6fc",
                        data: data['alertsDetected']['data']['data'],
                        label: 'Alerts detected'
                    }
                ]
            },
            "options": {
                "legend": {"display": true, "position": "right"},
                "title": {
                    "display": true,
                    "text": 'Alerts detected'
                },
                "responsive": true,
                "maintainAspectRatio": false,
                scales: {
                    xAxes: [{
                        type: 'time',
                        barThickness: 5
                    }],
                    yAxes: [{
                        ticks: {
                            min: 0
                        }
                    }]
                },
            }
        };
        var ctx = $("#alerts_detected")[0].getContext('2d');
        if(mem['alerts_detected']){mem['alerts_detected'].destroy();}
        mem['alerts_detected'] = new Chart(ctx, cfg);
        SingleLoadingScreen('alerts_detected', false);
    }
    if(data['tcpSessions']){
        var labels = modDateLabel(data['tcpSessions']['data']['label']);
        var cfg = {
            "type": 'bar',
            "data": {
                labels : labels,
                datasets :[
                    {
                        borderColor: "#03c6fc",
                        data: data['tcpSessions']['data']['data'],
                        label: 'Invalid packets'
                    }
                ]
            },
            "options": {
                "legend": {"display": true, "position": "right"},
                "title": {
                    "display": true,
                    "text": 'TCP Sessions'
                },
                "responsive": true,
                "maintainAspectRatio": false,
                scales: {
                    xAxes: [{
                        type: 'time',
                        barThickness: 5
                    }],
                    yAxes: [{
                        ticks: {
                            min: 0
                        }
                    }]
                },
            }
        };
        var ctx = $("#tcp_sessions")[0].getContext('2d');
        if(mem['tcp_sessions']){mem['tcp_sessions'].destroy();}
        mem['tcp_sessions'] = new Chart(ctx, cfg);
        SingleLoadingScreen('tcp_sessions', false);
    }
    if(data['IPVersions']){
        var labels = modDateLabel(data['IPVersions']['data']['ipv4']['label']);
        var cfg = {
            "type": 'line',
            "data": {
                labels : labels,
                datasets :[
                    {
                        borderColor: "#03c6fc",
                        data: data['IPVersions']['data']['ipv4']['data'],
                        label: 'IPv4'
                    },
                    {
                        borderColor: "#03c6fc",
                        data: data['IPVersions']['data']['ipv4_v6']['data'],
                        label: 'IPv4-in-IPv6'
                    },
                    {
                        borderColor: "#03c6fc",
                        data: data['IPVersions']['data']['ipv6']['data'],
                        label: 'IPv6'
                    },
                    {
                        borderColor: "#03c6fc",
                        data: data['IPVersions']['data']['ipv6_v6']['data'],
                        label: 'IPv6-in-IPv6'
                    },
                    {
                        borderColor: "#03c6fc",
                        data: data['IPVersions']['data']['teredo']['data'],
                        label: 'Teredo'
                    }
                ]
            },
            "options": {
                "legend": {"display": true, "position": "right"},
                "title": {
                    "display": true,
                    "text": 'IP Version'
                },
                "responsive": true,
                "maintainAspectRatio": false,
                scales: {
                    xAxes: [{
                        type: 'time'
                    }],
                    yAxes: [{
                        ticks: {
                            min: 0
                        }
                    }]
                }
            }
        };
        var ctx = $("#ip_versions")[0].getContext('2d');
        if(mem['ip_versions']){mem['ip_versions'].destroy();}
        mem['ip_versions'] = new Chart(ctx, cfg);
        SingleLoadingScreen('ip_versions', false);
    }
    if(data['IPProtocol']){
        var labels = modDateLabel(data['IPProtocol']['data']['tcp']['label']);
        var cfg = {
            "type": 'line',
            "data": {
                labels : labels,
                datasets :[
                    {
                        borderColor: "#03c6fc",
                        data: data['IPProtocol']['data']['tcp']['data'],
                        label: 'TCP'
                    },
                    {
                        borderColor: "#03c6fc",
                        data: data['IPProtocol']['data']['udp']['data'],
                        label: 'UDP'
                    },
                    {
                        borderColor: "#03c6fc",
                        data: data['IPProtocol']['data']['gre']['data'],
                        label: 'GRE'
                    },
                    {
                        borderColor: "#03c6fc",
                        data: data['IPProtocol']['data']['sctp']['data'],
                        label: 'SCTP'
                    }
                ]
            },
            "options": {
                "legend": {"display": true, "position": "right"},
                "title": {
                    "display": true,
                    "text": 'IP Protocols'
                },
                "responsive": true,
                "maintainAspectRatio": false,
                scales: {
                    xAxes: [{
                        type: 'time'
                    }],
                    yAxes: [{
                        ticks: {
                            min: 0
                        }
                    }]
                },
            }
        };
        var ctx = $("#ip_protocols")[0].getContext('2d');
        if(mem['ip_protocols']){mem['ip_protocols'].destroy();}
        mem['ip_protocols'] = new Chart(ctx, cfg);
        SingleLoadingScreen('ip_protocols', false);
    }
}
//Tables
function flowStatsByte(){
    $.post(HOST + '/ISP.statsFlowByte', function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            var $table = $("<table  id='flowStatByteTable' class='tabella display cell-border compact stripe'><thead><tr><th>Query</th><th>count</th><th>min</th><th>max</th><th>mean</th><th>total</th><th>std_deviation</th></tr></thead></table>");
            var $tbody = $("<tbody></tbody>");
            data['data'].forEach(function(row){
                var $tr = $("<tr><td>"+row['proto']+"</td><td>"+formatBytes(row['count'])+"</td><td>"+formatBytes(row['min_byte'])+"</td><td>"+formatBytes(row['max_byte'])+"</td><td>"+formatBytes(row['mean'])+"</td><td>"+formatBytes(row['total'])+"</td><td>"+formatBytes(row['std_dev'])+"</td></tr>");
                $tbody.append($tr);
            });
            $table.append($tbody);
            $("#stats_table").empty().append($table);
            SingleLoadingScreen('stats_table', false);
        }
    },'json');
}
function flowStatsAge(){
    $.post(HOST + '/ISP.statsFlowAge', function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            var $table = $("<table  id='flowStatAgeTable' class='tabella display cell-border compact stripe'><thead><tr><th>Query</th><th>min</th><th>max</th><th>mean</th><th>std_deviation</th></tr></thead></table>");
            var $tbody = $("<tbody></tbody>");
            data['data'].forEach(function(row){
                var $tr = $("<tr><td>"+row['proto']+"</td><td>"+formatSeconds(row['min_age'])+"</td><td>"+formatSeconds(row['max_age'])+"</td><td>"+formatSeconds(row['mean'])+"</td><td>"+formatSeconds(row['std_dev'])+"</td></tr>");
                $tbody.append($tr);
            });
            $table.append($tbody);
            $("#age_table").empty().append($table);
            SingleLoadingScreen('age_table', false);
        }
    },'json');
}
//---------------------------------------------1. AlertsGeoMap--------------------------------------------------------//
function GeoMapGL(obj){
    obj['config'] = {
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
                isClosable: false,
                componentName: 'chart',
                title: 'GeoMap Alerts',
                content:[
                    {
                        type: 'row',
                        content: [
                            {
                                type: 'component',
                                componentName: 'map',
                                title: "Alert-GeoMap",
                                componentState: {id: 'geomap_country'}
                            },
                            {
                                type: 'component',
                                componentName: 'chart',
                                title: "Alert protocols",
                                componentState: {id: 'alerts_protocols'},
                                width: 30
                            }
                        ]
                    },
                    {
                        type: 'row',
                        content: [
                            {
                                type: 'component',
                                componentName: 'html',
                                title: "Alert Count",
                                componentState: {id: 'total_alert_events'},
                                width: 30
                            },
                            {
                                type: 'component',
                                componentName: 'chart',
                                title: "Alerts events timeline",
                                componentState: {id: 'alert_type_timeline'}
                            },
                        ]
                    }
                ]
            }
        ]
    };
    $("#geoMapGL").empty();
    obj['myLayout'] = new GoldenLayout( obj['config'], '#geoMapGL' );
    obj['myLayout'].registerComponent( 'chart', function( container, state ){
        container.getElement().html( '<div id="preloader_'+ state.id +'" class=preloader style="displ__ay: none;"><div class=loader></div></div><canvas id="'+ state.id +'"></canvas>');
    });
    obj['myLayout'].registerComponent( 'html', function( container, state ){
        container.getElement().html( '<div id="preloader_'+ state.id +'" class=preloader style="displ__ay: none;"><div class=loader></div></div><div id="'+ state.id +'"></div>');
    });
    obj['myLayout'].registerComponent( 'map', function( container, state ){
        container.getElement().html( '<div id="'+state.id+'"><div id="preloader_'+ state.id +'" class=preloader style="displ__ay: none;"><div class=loader></div></div>');
    });
    $("#geoMapGL").css("height", '1300px'); //modifico il css per farci entrare corettamente tutti i charts. Da fare prima dell'init
    obj['myLayout'].init();
    obj = null;
    suricataGeoMapRetriever({});
}
function suricataGeoMapRetriever(obj){
    obj['box'] = {};
    alertGeoPos(function(data){
        obj['box']['alertGeoPos'] = data;
        alertsTypeTimeline(function(data){
            obj['box']['alertsTypeTimeline'] = data;
            alertsProtocol(function(data) {
                obj['box']['alertsProtocol'] = data;
                drawGeoMap(obj['box'], {});
                setTimeout(function () {
                    obj= null;
                    suricataGeoMapRetriever({});
                }, 600000)
            });
        });
    });

}
function alertGeoPos(cb){
    $.post(HOST + '/ISP.alertGeoPos', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
            data = null
            return false
        }
    },'json');
}
function alertsTypeTimeline(cb){
    $.post(HOST + '/ISP.alertsTypeTimeline', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
            data = null
            return false
        }
    },'json');
}
function alertsProtocol(cb){
    $.post(HOST + '/ISP.alertsProtocol', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
            data = null
            return false
        }
    },'json');
}
function drawGeoMap(data, obj){
    if(data['alertGeoPos']){
        SingleLoadingScreen('geomap_country', false);
        obj['$mappa'] = $('<div id="leaflet_geomap_country" style="height:600px"></div>');
        $("#geomap_country").empty().append(obj['$mappa']);
        obj['mymap'] = L.map('leaflet_geomap_country').setView([0, 0], 1);
        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 3,
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: 'pk.eyJ1Ijoic2ltb25lbmFsZGluaSIsImEiOiJjazljd3pyODQwMzBxM2xvdHcxb3NjZnRkIn0.3HE9r-ZCQ_Op_1P1d9oZqA'
        }).addTo(obj['mymap']);
        data['alertGeoPos']['data'].forEach(function(country){
            obj['marker'] = L.marker([country['latitude'], country['longitude']]).addTo(obj['mymap']);
        })
    }
    if(data['alertsTypeTimeline']){
        obj['$obj'] = $('<div class="card mb-4 box-shadow" style="text-align: center;"> '+
            '<div class="card-header" > '+
            '    <h4 class="my-0 font-weight-normal">Total Alerts detected</h4> '+
            '</div> '+
            '<div class="card-body"> '+
            '    <h1 class="card-title pricing-card-title"> '+ data['alertsTypeTimeline']['totalAlerts'] +'<small class="text-muted"> </small></h1> '+
            '</div> '+
            '</div>');
        $("#total_alert_events").empty().append(obj['$obj']);

        //var labels = modDateLabel(data['alertsTypeTimeline']['data']['http']['label']);
        obj['labels'] = data['alertsTypeTimeline']['data']['http']['label'];
        obj['cfg_atl'] = {
            "type": 'bar',
            "data": {
                labels : obj['labels'],
                datasets :[
                    {
                        borderColor: "#a83252",
                        backgroundColor : "#a83252",
                        data: data['alertsTypeTimeline']['data']['http']['data'],
                        label: 'HTTP'
                    },
                    {
                        borderColor: "#2f759c",
                        backgroundColor : "#2f759c",
                        data: data['alertsTypeTimeline']['data']['ssh']['data'],
                        label: 'SSH'
                    },
                    {
                        borderColor: "#2bba72",
                        backgroundColor : "#2bba72",
                        data: data['alertsTypeTimeline']['data']['smtp']['data'],
                        label: 'SMTP'
                    },
                    {
                        borderColor: "#b5bf2c",
                        backgroundColor : "#b5bf2c",
                        data: data['alertsTypeTimeline']['data']['tls']['data'],
                        label: 'TLS'
                    }
                ]
            },
            "options": {
                "legend": {"display": true, "position": "top"},
                "title": {
                    "display": true,
                    "text": 'Alerts by type'
                },
                "responsive": true,
                "maintainAspectRatio": false,
                scales: {
                    xAxes: [{
                        type: 'time',
                        //distribution: 'series',
                        stacked :true,
                        barThickness: 5
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Number of events'
                        },
                        stacked :true
                    }]
                }
            }
        };
        obj['ctx_atl'] = $("#alert_type_timeline")[0].getContext('2d');
        if(mem['alert_type_timeline']){mem['alert_type_timeline'].destroy();}
        mem['alert_type_timeline'] = new Chart(obj['ctx_atl'], obj['cfg_atl']);
        SingleLoadingScreen('total_alert_events', false);
        SingleLoadingScreen('alert_type_timeline', false);
    }
    if(data['alertsProtocol']){
        obj['cfg_ap'] ={
            "type":"pie",
            "data":{
                "datasets":[
                    {
                        "data":data['alertsProtocol']['data']['data'],
                        "backgroundColor":[
                            "#a83252",
                            "#2f759c",
                            "#2bba72",
                            "#b5bf2c"
                        ]
                    }
                ],
                "labels": data['alertsProtocol']['data']['label']
            },
            "options":{
                "customHideXAxes":"true",
                "customHideYAxes":"true",
                "responsive":true,
                "maintainAspectRatio":false,
                "legend":{
                    "display":true,
                    "position" : "top"
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
                    //display : true,
                    //text : "Attack vector",
                    //fontStyle :"bold"
                }
            }
        };
        obj['ctx'] = $("#alerts_protocols")[0].getContext('2d');
        if(mem['alerts_protocols']){mem['alerts_protocols'].destroy();}
        mem['alerts_protocols'] = new Chart(obj['ctx'], obj['cfg_ap']);
        SingleLoadingScreen('alerts_protocols', false);
    }
    data = null;
    obj = null;
}
//---------------------------------------------2/3. Alerts -----------------------------------------------------------//
function AlertsGL(obj){
    obj['config'] = {
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
                    type: 'column',
                    isClosable: false,
                    componentName: 'chart',
                    title: 'Stats',
                    content:[
                        {
                            type: 'row',
                            content: [
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "Sev 1",
                                    componentState: {id: 'severity_1_timeline'}
                                },
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "Sev 2",
                                    componentState: {id: 'severity_2_timeline'}
                                },
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "Sev 3",
                                    componentState: {id: 'severity_3_timeline'}
                                }
                            ]
                        },
                        {
                            type: 'row',
                            content: [
                                {
                                    type: 'component',
                                    componentName: 'map',
                                    title: "Alert Heatmap",
                                    componentState: {id: 'alerts_heatmap'}
                                }
                            ]
                        },
                        {
                            type: 'row',
                            content: [
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "Alerts by category",
                                    componentState: {id: 'alerts_category'}
                                },
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "Source addresses",
                                    componentState: {id: 'alerts_source'}
                                },
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "Destination addresses",
                                    componentState: {id: 'alerts_destination'}
                                },
                            ]
                        }
                    ]
                },
                {
                    type: 'column',
                    isClosable: false,
                    componentName: 'chart',
                    title: 'Logs',
                    content:[
                        {
                            type: 'row',
                            content: [
                                {
                                    type: 'component',
                                    componentName: 'html',
                                    title: "Total Alerts events",
                                    componentState: {id: 'total_alerts_severity'},
                                    width:30
                                },
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "Alerts timeline",
                                    componentState: {id: 'alerts_severity_timeline'}
                                }
                            ]
                        },
                        {
                            type: 'row',
                            content: [
                                {
                                    type: 'component',
                                    componentName: 'html',
                                    title: "Alerts events logs",
                                    componentState: {id: 'alerts_events_table'}
                                }
                            ]
                        }
                    ]
                }
            ]
        }]
    };
    $("#alertsGL").empty();
    obj['myLayout'] = new GoldenLayout( obj['config'], '#alertsGL' );
    obj['myLayout'].registerComponent( 'chart', function( container, state ){
        container.getElement().html( '<div id="preloader_'+ state.id +'" class=preloader style="displ__ay: none;"><div class=loader></div></div><canvas id="'+ state.id +'"></canvas>');
    });
    obj['myLayout'].registerComponent( 'html', function( container, state ){
        container.getElement().html( '<div id="preloader_'+ state.id +'" class=preloader style="displ__ay: none;"><div class=loader></div></div><div id="'+ state.id +'"></div>');
    });
    obj['myLayout'].registerComponent( 'map', function( container, state ){
        container.getElement().html( '<div id="'+state.id+'"><div id="preloader_'+ state.id +'" class=preloader style="displ__ay: none;"><div class=loader></div></div>');
    });
    $("#alertsGL").css("height", '1300px'); //modifico il css per farci entrare corettamente tutti i charts. Da fare prima dell'init
    obj['myLayout'].init();
    obj = null;
    suricataAlertsRetriever({});
}
function suricataAlertsRetriever(obj){
    obj['box'] = {};
    alertsSeverityTimeline(function(data){
        obj['box']['alertsSeverityTimeline'] = data;
        alertsCategory(function(data){
            obj['box']['alertsCategory'] = data;
            alertsSource(function(data){
                obj['box']['alertsSource'] = data;
                alertsDestination(function(data){
                    obj['box']['alertsDestination'] = data;
                    alertsHeatMap(function(data) {
                        obj['box']['alertsHeatMap'] = data;
                        drawAlerts(obj['box'], {});
                        obj = null;
                        setTimeout(function () {
                            suricataAlertsRetriever({});
                        }, 15000)
                    })
                })
            })
        })
    })
}
function alertsSeverityTimeline(cb){
    $.post(HOST + '/ISP.alertsSeverityTimeline', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
            data = null;
            return false;
        }
    },'json');
}
function alertsCategory(cb){
    $.post(HOST + '/ISP.alertsCategory', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
            data = null;
            return false;
        }
    },'json');
}
function alertsSource(cb){
    $.post(HOST + '/ISP.alertsSource', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
            data = null;
            return false;
        }
    },'json');
}
function alertsDestination(cb){
    $.post(HOST + '/ISP.alertsDestination', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
            data = null;
            return false;
        }
    },'json');
}
function alertsHeatMap(cb){
    $.post(HOST + '/ISP.alertsHeatMap', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
            data = null;
            return false;
        }
    },'json');
}
function drawAlerts(data, obj){
    if(data['alertsSeverityTimeline']){
        obj['$obj'] = $('<div class="card mb-4 box-shadow" style="text-align: center;"> '+
            '<div class="card-header" > '+
            '    <h4 class="my-0 font-weight-normal">Total Alerts detected</h4> '+
            '</div> '+
            '<div class="card-body"> '+
            '    <h1 class="card-title pricing-card-title"> '+ data['alertsSeverityTimeline']['total'] +'<small class="text-muted"> </small></h1> '+
            '</div> '+
            '</div>');
        $("#total_alerts_severity").empty().append(obj['$obj']);

        //var labels = modDateLabel(data['alertsSeverityTimeline']['data']['alert']['label']);
        obj['labels_ast'] = data['alertsSeverityTimeline']['data']['alert']['label'];
        obj['cfg_ast'] = {
            "type": 'bar',
            "data": {
                labels : obj['labels_ast'],
                datasets :[
                    {
                        borderColor: "#f56231",
                        backgroundColor: "#f56231",
                        data: data['alertsSeverityTimeline']['data']['alert']['data'],
                        label: 'Alert'
                    },
                    {
                        borderColor: "#f0b132",
                        backgroundColor: "#f0b132",
                        data: data['alertsSeverityTimeline']['data']['critical']['data'],
                        label: 'Critical'
                    },
                    {
                        borderColor: "#def03e",
                        backgroundColor: "#def03e",
                        data: data['alertsSeverityTimeline']['data']['warning']['data'],
                        label: 'Warning'
                    }
                ]
            },
            "options": {
                "legend": {"display": true, "position": "top"},
                "title": {
                    "display": true,
                    "text": 'Alert by type'
                },
                "responsive": true,
                "maintainAspectRatio": false,
                scales: {
                    xAxes: [{
                        type: 'time',
                        //distribution: 'series',
                        stacked :true,
                        barThickness: 5
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
        obj['ctx_ast'] = $("#alerts_severity_timeline")[0].getContext('2d');
        if(mem['alerts_severity_timeline']){mem['alerts_severity_timeline'].destroy();}
        mem['alerts_severity_timeline'] = new Chart(obj['ctx_ast'], obj['cfg_ast']);
        SingleLoadingScreen('total_alerts_severity', false);
        SingleLoadingScreen('alerts_severity_timeline', false);

        obj['cfg_1'] = {
            "type": 'bar',
            "data": {
                labels : obj['labels_ast'],
                datasets :[
                    {
                        borderColor: "#f56231",
                        backgroundColor: "#f56231",
                        data: data['alertsSeverityTimeline']['data']['alert']['data'],
                        label: 'Alert'
                    }
                ]
            },
            "options": {
                "legend": {"display": true, "position": "top"},
                "title": {
                    "display": true,
                    "text": 'Alert by type'
                },
                "responsive": true,
                "maintainAspectRatio": false,
                scales: {
                    xAxes: [{
                        type: 'time',
                        barThickness: 5
                    }],
                    yAxes: [{
                        ticks: {
                            min: 0
                        }
                    }]
                }
            }
        };
        obj['ctx_1'] = $("#severity_1_timeline")[0].getContext('2d');
        if(mem['severity_1_timeline']){mem['severity_1_timeline'].destroy();}
        mem['severity_1_timeline'] = new Chart(obj['ctx_1'], obj['cfg_1']);
        SingleLoadingScreen('severity_1_timeline', false);

        obj['cfg_2'] = {
            "type": 'bar',
            "data": {
                labels : obj['labels_ast'],
                datasets :[
                    {
                        borderColor: "#f0b132",
                        backgroundColor: "#f0b132",
                        data: data['alertsSeverityTimeline']['data']['critical']['data'],
                        label: 'Critical'
                    }
                ]
            },
            "options": {
                "legend": {"display": true, "position": "top"},
                "title": {
                    "display": true,
                    "text": 'Alert by type'
                },
                "responsive": true,
                "maintainAspectRatio": false,
                scales: {
                    xAxes: [{
                        type: 'time',
                        barThickness: 5
                    }],
                    yAxes: [{
                        ticks: {
                            min: 0
                        }
                    }]
                }
            }
        };
        obj['ctx_2'] = $("#severity_2_timeline")[0].getContext('2d');
        if(mem['severity_2_timeline']){mem['severity_2_timeline'].destroy();}
        mem['severity_2_timeline'] = new Chart(obj['ctx_2'], obj['cfg_2']);
        SingleLoadingScreen('severity_2_timeline', false);

        obj['cfg_3'] = {
            "type": 'bar',
            "data": {
                labels : obj['labels_ast'],
                datasets :[
                    {
                        borderColor: "#def03e",
                        backgroundColor: "#def03e",
                        data: data['alertsSeverityTimeline']['data']['warning']['data'],
                        label: 'Warning'
                    }
                ]
            },
            "options": {
                "legend": {"display": true, "position": "top"},
                "title": {
                    "display": true,
                    "text": 'Alert by type'
                },
                "responsive": true,
                "maintainAspectRatio": false,
                scales: {
                    xAxes: [{
                        type: 'time',
                        barThickness: 5
                    }],
                    yAxes: [{
                        ticks: {
                            min: 0
                        }
                    }]
                }
            }
        };
        obj['ctx_3'] = $("#severity_3_timeline")[0].getContext('2d');
        if(mem['severity_3_timeline']){mem['severity_3_timeline'].destroy();}
        mem['severity_3_timeline'] = new Chart(obj['ctx_3'], obj['cfg_3']);
        SingleLoadingScreen('severity_3_timeline', false);

        obj['$table'] = $("<table  id='alertTimelineTable' class='tabella display cell-border compact stripe'><thead><tr><th>Time</th><th>client_hostname</th><th>severity</th><th>alert.signature</th><th>alert.signature_id</th></tr></thead></table>");
        obj['$tbody'] = $("<tbody></tbody>");
        obj['$table'].append(obj['$tbody']);
        $("#alerts_events_table").empty().append(obj['$table']);
        $("#alertTimelineTable").dataTable().fnDestroy();
        mem['alertTimelineTable'] = $('#alertTimelineTable').DataTable( {
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
                url: HOST+"/ISP.alertsLogs",
                type: "POST",
                "dataSrc": function(data) {
                    if (!data['data'] || !data['data'].length) {
                        return [];
                    } else {
                        obj['$obj_att'] = $('<div class="card mb-4 box-shadow" style="text-align: center;"> '+
                            '<div class="card-header">'+
                            '    <h4 class="my-0 font-weight-normal">DNS logs</h4> '+
                            '</div> '+
                            '<div class="card-body"> '+
                            '    <h1 class="card-title pricing-card-title"> '+ data['data'].length +'<small class="text-muted"> </small></h1> '+
                            '</div> '+
                            '</div>');
                        $("#total_alert_events").empty().append(obj['$obj_att']);
                        return data.data;
                    }
                }
            },
            "columns": [
                { "data": "time"},
                { "data": "client_hostname" },
                { "data": "severity" },
                { "data": "signature" },
                { "data": "signature_id" }
            ],
            "initComplete": function(data){
                $('#alertTimelineTable_wrapper').attr('style','width:100%;')
                $('#alertTimelineTable').attr('style','width:100%;')
                SingleLoadingScreen('alerts_events_table', false);
            }
        });
    }
    if(data['alertsCategory']){
        obj['cfg_ac'] ={
            "type":"pie",
            "data":{
                "datasets":[
                    {
                        "data":data['alertsCategory']['data']['data'],
                        "backgroundColor":palette_01
                    }
                ],
                "labels": data['alertsCategory']['data']['label']
            },
            "options":{
                "customHideXAxes":"true",
                "customHideYAxes":"true",
                "responsive":true,
                "maintainAspectRatio":false,
                "legend":{
                    "display":true,
                    "position" : "top"

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
                    //display : true,
                    //text : "Attack vector",
                    //fontStyle :"bold"
                }
            }
        };
        obj['ctx_ac']= $("#alerts_category")[0].getContext('2d');
        if(mem['alerts_category']){mem['alerts_category'].destroy();}
        mem['alerts_category'] = new Chart(obj['ctx_ac'], obj['cfg_ac']);
        SingleLoadingScreen('alerts_category', false);
    }
    if(data['alertsSource']){
        obj['cfg_as'] ={
            "type":"pie",
            "data":{
                "datasets":[
                    {
                        "data":data['alertsSource']['data']['data'],
                        "backgroundColor":palette_01
                    }
                ],
                "labels": data['alertsSource']['data']['label']
            },
            "options":{
                "customHideXAxes":"true",
                "customHideYAxes":"true",
                "responsive":true,
                "maintainAspectRatio":false,
                "legend":{
                    "display":true,
                    "position" : "top"

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
                    //display : true,
                    //text : "Attack vector",
                    //fontStyle :"bold"
                }
            }
        };
        obj['ctx_as'] = $("#alerts_source")[0].getContext('2d');
        if(mem['alerts_source']){mem['alerts_source'].destroy();}
        mem['alerts_source'] = new Chart(obj['ctx_as'], obj['cfg_as']);
        SingleLoadingScreen('alerts_source', false);
    }
    if(data['alertsDestination']){
        obj['cfg_ad'] ={
            "type":"pie",
            "data":{
                "datasets":[
                    {
                        "data":data['alertsDestination']['data']['data'],
                        "backgroundColor":palette_01
                    }
                ],
                "labels": data['alertsDestination']['data']['label']
            },
            "options":{
                "customHideXAxes":"true",
                "customHideYAxes":"true",
                "responsive":true,
                "maintainAspectRatio":false,
                "legend":{
                    "display":true,
                    "position" : "top"

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
                    //display : true,
                    //text : "Attack vector",
                    //fontStyle :"bold"
                }
            }
        };
        obj['ctx_ad'] = $("#alerts_destination")[0].getContext('2d');
        if(mem['alerts_destination']){mem['alerts_destination'].destroy();}
        mem['alerts_destination'] = new Chart(obj['ctx_ad'], obj['cfg_ad']);
        SingleLoadingScreen('alerts_destination', false);
    }
    if(data['alertsHeatMap']){
        SingleLoadingScreen('alerts_heatmap', false);
        obj['$mappa'] = $('<div id="leaflet_alerts_heatmap" style="height:600px"></div>');
        $("#alerts_heatmap").empty().append(obj['$mappa']);
        obj['mymap'] = L.map('leaflet_alerts_heatmap').setView([0, 0], 1);
        L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
            attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
            maxZoom: 3,
            id: 'mapbox/streets-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: 'pk.eyJ1Ijoic2ltb25lbmFsZGluaSIsImEiOiJjazljd3pyODQwMzBxM2xvdHcxb3NjZnRkIn0.3HE9r-ZCQ_Op_1P1d9oZqA'
        }).addTo(obj['mymap']);
        L.heatLayer(data['alertsHeatMap']['data'], {radius: 25}).addTo(obj['mymap']);
    }
    data = null;
    obj = null;
}

//---------------------------------------------4/5. All Events--------------------------------------------------------//
function AllEventsGL(obj){
    obj['config'] = {
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
                isClosable: false,
                componentName: 'chart',
                title: 'Logs',
                content:[
                    {
                        type: 'row',
                        content: [
                            {
                                type: 'component',
                                componentName: 'chart',
                                title: "Events over time",
                                componentState: {id: 'all_events_timeline'}
                            }
                        ]
                    },
                    {
                        type: 'row',
                        content: [
                            {
                                type: 'component',
                                componentName: 'chart',
                                title: "Event type",
                                componentState: {id: 'all_events_type'}
                            },
                            {
                                type: 'component',
                                componentName: 'chart',
                                title: "HTTP versions",
                                componentState: {id: 'all_events_httpVersions'}
                            },
                            {
                                type: 'component',
                                componentName: 'chart',
                                title: "HTTP methods",
                                componentState: {id: 'all_events_httpMethods'}
                            }
                        ]
                    },
                    /*{
                        type: 'row',
                        content: [
                            {
                                type: 'component',
                                componentName: 'chart',
                                title: "HTTP status code",
                                componentState: {id: 'all_events_httpStatus'}
                            },
                            {
                                type: 'component',
                                componentName: 'chart',
                                title: "TLS versions",
                                componentState: {id: 'all_events_tlsVersions'}
                            },
                            {
                                type: 'component',
                                componentName: 'chart',
                                title: "DNS type",
                                componentState: {id: 'all_events_dnsTypes'}
                            }
                        ]
                    }*/
                ]
            }
        ]
    };
    $("#allEventsGL").empty();
    obj['myLayout'] = new GoldenLayout( obj['config'], '#allEventsGL' );
    obj['myLayout'].registerComponent( 'chart', function( container, state ){
        container.getElement().html( '<div id="preloader_'+ state.id +'" class=preloader style="displ__ay: none;"><div class=loader></div></div><canvas id="'+ state.id +'"></canvas>');
    });
    obj['myLayout'].registerComponent( 'html', function( container, state ){
        container.getElement().html( '<div id="'+ state.id +'" class=preloader style="displ__ay: none;"><div class=loader></div></div><div id="'+ state.id +'"></div>');
    });
    $("#allEventsGL").css("height", '1300px'); //modifico il css per farci entrare corettamente tutti i charts. Da fare prima dell'init
    obj['myLayout'].init();
    obj = null;
    suricataAllEventsRetriever({});
}
function suricataAllEventsRetriever(obj){
    allEventsTimeline(function(data){
        obj['allEventsTimeline'] = data;
        data = null;
        allEventsType(function(data){
            obj['allEventsType'] = data;
            data = null;
            httpVersions(function(data) {
                obj['allEventsHttpVersions'] = data;
                data = null;
                httpMethods(function (data) {
                    obj['allEventsHttpMethods'] = data;
                    data = null;
                    drawAllEvents(obj);
                    obj = null;
                    setTimeout(function () {
                        suricataAllEventsRetriever({});
                    }, 60000)
                })
            })
        })
    })
}
function allEventsTimeline(cb){
    $.post(HOST + '/ISP.allEventsTimeline', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
            data = null; return false;
        }
    },'json');
}
function allEventsType(cb){
    $.post(HOST + '/ISP.allEventsType', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
            data = null; return false;
        }
    },'json');
}
function drawAllEvents(data){
    if(data['allEventsTimeline']){
        var obj = {};
        //var labels = modDateLabel(data['allEventsTimeline']['data']['alert']['label']);
        obj['labels'] = data['allEventsTimeline']['data']['alert']['label'];
        obj['cfg'] = {
            "type": 'line',
            "data": {
                labels : obj['labels'],
                datasets :[
                    {
                        borderColor: palette_01[0],
                        data: data['allEventsTimeline']['data']['alert']['data'],
                        label: 'Alerts',
                        lineTension: 0
                    },{
                        borderColor: palette_01[1],
                        data: data['allEventsTimeline']['data']['dhcp']['data'],
                        label: 'DHCP',
                        lineTension: 0
                    },{
                        borderColor: palette_01[2],
                        data: data['allEventsTimeline']['data']['dns']['data'],
                        label: 'DNS',
                        lineTension: 0
                    },{
                        borderColor: palette_01[3],
                        data: data['allEventsTimeline']['data']['fileinfo']['data'],
                        label: 'File Info',
                        lineTension: 0
                    },{
                        borderColor: palette_01[4],
                        data: data['allEventsTimeline']['data']['flow']['data'],
                        label: 'Flow',
                        lineTension: 0
                    },{
                        borderColor: palette_01[5],
                        data: data['allEventsTimeline']['data']['http']['data'],
                        label: 'HTTP',
                        lineTension: 0
                    },{
                        borderColor: palette_01[6],
                        data: data['allEventsTimeline']['data']['ssh']['data'],
                        label: 'SSH',
                        lineTension: 0
                    },{
                        borderColor: palette_01[7],
                        data: data['allEventsTimeline']['data']['tls']['data'],
                        label: 'TLS',
                        lineTension: 0
                    }
                ]
            },
            "options": {
                "legend": {"display": true, "position": "top"},
                "title": {
                    //"display": true,
                    //"text": 'Invalid Packets'
                },
                "responsive": true,
                "maintainAspectRatio": false,
                scales: {
                    xAxes: [{
                        type: 'time'
                    }],
                    yAxes: [{
                        ticks: {
                            min: 0
                        }
                    }]
                },
            }
        };
        obj['ctx'] = $("#all_events_timeline")[0].getContext('2d');
        if(mem['all_events_timeline']){mem['all_events_timeline'].destroy();}
        mem['all_events_timeline'] = new Chart(obj['ctx'], obj['cfg']);
        SingleLoadingScreen('all_events_timeline', false);
        obj = null;
    }
    if(data['allEventsType']){
        var obj = {};
        obj['cfg'] ={
            "type":"pie",
            "data":{
                "datasets":[
                    {
                        "data":data['allEventsType']['data']['data'],
                        "backgroundColor":palette_01
                    }
                ],
                "labels": data['allEventsType']['data']['label']
            },
            "options":{
                "customHideXAxes":"true",
                "customHideYAxes":"true",
                "responsive":true,
                "maintainAspectRatio":false,
                "legend":{
                    "display":true,
                    "position" : "top"

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
                    //display : true,
                    //text : "Attack vector",
                    //fontStyle :"bold"
                }
            }
        };
        obj['ctx'] = $("#all_events_type")[0].getContext('2d');
        if(mem['all_events_type']){mem['all_events_type'].destroy();}
        mem['all_events_type'] = new Chart(obj['ctx'], obj['cfg']);
        SingleLoadingScreen('all_events_type', false);
        obj = null;
    }
    if(data['allEventsHttpVersions']){
        var obj = {};
        obj['cfg'] ={
            "type":"pie",
            "data":{
                "datasets":[
                    {
                        "data":data['allEventsHttpVersions']['data']['data'],
                        "backgroundColor":palette_01
                    }
                ],
                "labels": data['allEventsHttpVersions']['data']['label']
            },
            "options":{
                "customHideXAxes":"true",
                "customHideYAxes":"true",
                "responsive":true,
                "maintainAspectRatio":false,
                "legend":{
                    "display":true,
                    "position" : "top"

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
                    //display : true,
                    //text : "Attack vector",
                    //fontStyle :"bold"
                }
            }
        };
        obj['ctx'] = $("#all_events_httpVersions")[0].getContext('2d');
        if(mem['all_events_httpVersions']){mem['all_events_httpVersions'].destroy();}
        mem['all_events_httpVersions'] = new Chart(obj['ctx'], obj['cfg']);
        SingleLoadingScreen('all_events_httpVersions', false);
        obj = null;
    }
    if(data['allEventsHttpMethods']){
        var obj = {};
        obj['cfg'] ={
            "type":"pie",
            "data":{
                "datasets":[
                    {
                        "data":data['allEventsHttpMethods']['data']['data'],
                        "backgroundColor":palette_01
                    }
                ],
                "labels": data['allEventsHttpMethods']['data']['label']
            },
            "options":{
                "customHideXAxes":"true",
                "customHideYAxes":"true",
                "responsive":true,
                "maintainAspectRatio":false,
                "legend":{
                    "display":true,
                    "position" : "top"

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
                    //display : true,
                    //text : "Attack vector",
                    //fontStyle :"bold"
                }
            }
        };
        obj['ctx'] = $("#all_events_httpMethods")[0].getContext('2d');
        if(mem['all_events_httpMethods']){mem['all_events_httpMethods'].destroy();}
        mem['all_events_httpMethods'] = new Chart(obj['ctx'], obj['cfg']);
        SingleLoadingScreen('all_events_httpMethods', false);
        obj = null;
    }
    data = null; return false;
}

// /---------------------------------------------6. DNS Events----------------------------------------------------------//
function DNSGL(obj){
    obj['config'] = {
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
                isClosable: false,
                componentName: 'chart',
                title: 'Logs',
                content:[
                    {
                        type: 'row',
                        content: [
                            {
                                type: 'component',
                                componentName: 'html',
                                title: "Total DNS events",
                                componentState: {id: 'total_dns_events'},
                                width:30
                            },
                            {
                                type: 'component',
                                componentName: 'chart',
                                title: "DNS events timeline",
                                componentState: {id: 'dns_events_timeline'}
                            }
                        ]
                    },
                    {
                        type: 'row',
                        content: [
                            {
                                type: 'component',
                                componentName: 'html',
                                title: "DNS events logs",
                                componentState: {id: 'dns_events_table'}
                            }
                        ]
                    }
                ]
            }
        ]
    };
    $("#dnsGL").empty();
    obj['myLayout'] = new GoldenLayout( obj['config'], '#dnsGL' );
    obj['myLayout'].registerComponent( 'chart', function( container, state ){
        container.getElement().html( '<div id="preloader_'+ state.id +'" class=preloader style="displ__ay: none;"><div class=loader></div></div><canvas id="'+ state.id +'"></canvas>');
    });
    obj['myLayout'].registerComponent( 'html', function( container, state ){
        container.getElement().html( '<div id="'+ state.id +'" class=preloader style="displ__ay: none;"><div class=loader></div></div><div id="'+ state.id +'"></div>');
    });
    obj['myLayout'].init();
    obj = null;
    suricataDNSRetriever({});
}
function suricataDNSRetriever(obj){
    dnsTimeline(function(data){
        obj['dnsTimeline'] = data;
        drawDNSLogs(obj);
        obj = null; data = null;
        setTimeout(function () {
            suricataDNSRetriever({});
        }, 60000)
    });
}
function dnsTimeline(cb){
    $.post(HOST + '/ISP.dnsTimeline', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
            data = null; return false;
        }
    },'json');
}
function drawDNSLogs(data){
    if(data['dnsTimeline']){
        //var labels = modDateLabel(data['dnsTimeline']['data']['label']);
        var obj = {};
        obj['labels'] = data['dnsTimeline']['data']['label'];
        obj['cfg'] = {
            "type": 'bar',
            "data": {
                labels : obj['labels'],
                datasets :[
                    {
                        borderColor: palette_01[7],
                        data: data['dnsTimeline']['data']['data'],
                        label: 'DNS events'
                    }
                ]
            },
            "options": {
                "legend": {"display": true, "position": "right"},
                "title": {
                    //"display": true,
                    //"text": 'Invalid Packets'
                },
                "responsive": true,
                "maintainAspectRatio": false,
                scales: {
                    xAxes: [{
                        type: 'time'
                    }],
                    yAxes: [{
                        ticks: {
                            min: 0
                        }
                    }]
                },
            }
        };
        obj['ctx'] = $("#dns_events_timeline")[0].getContext('2d');
        if(mem['dns_events_timeline']){mem['dns_events_timeline'].destroy();}
        mem['dns_events_timeline'] = new Chart(obj['ctx'], obj['cfg']);
        SingleLoadingScreen('dns_events_timeline', false);
        obj = null;
    }
    var obj = {};
    obj['$table'] = $("<table  id='dnsTimelineTable' class='tabella display cell-border compact stripe'><thead><tr><th>Time</th><th>client_hostname</th><th>dns.type</th><th>dns.rrname</th><th>dns.rrcode</th><th>dns.rrtype</th><th>dns.rdata</th></tr></thead></table>");
    obj['$tbody'] = $("<tbody></tbody>");
    obj['$table'].append(obj['$tbody']);
    $("#dns_events_table").empty().append(obj['$table']);

    $("#dnsTimelineTable").dataTable().fnDestroy();
    mem['dnsTimelineTable'] = $('#dnsTimelineTable').DataTable( {
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
            url: HOST+"/ISP.dnsLogs",
            type: "POST",
            "dataSrc": function(data) {
                if (!data['data'] || !data['data'].length) {
                    return [];
                } else {
                    var $obj = $('<div class="card mb-4 box-shadow" style="text-align: center;"> '+
                    '<div class="card-header">'+
                    '    <h4 class="my-0 font-weight-normal">DNS logs</h4> '+
                    '</div> '+
                    '<div class="card-body"> '+
                    '    <h1 class="card-title pricing-card-title"> '+ data['data'].length +'<small class="text-muted"> </small></h1> '+
                    '</div> '+
                    '</div>');
                    $("#total_dns_events").empty().append($obj);
                    $obj = null;
                    return data.data;
                    data = null;
                }
            }
        },
        "columns": [
            { "data": "time"},
            { "data": "client_hostname" },
            { "data": "type" },
            { "data": "rrname" },
            { "data": "rcode" },
            { "data": "rrtype" },
            { "data": "rdata" }
        ],
        "initComplete": function(data){
            $('#dnsTimelineTable_wrapper').attr('style','width:100%;')
        }
    });
    obj = null;
    data = null;
}
//---------------------------------------------7/8/9.HTTP Events------------------------------------------------------//
function HTTPGL(obj){
    obj['config'] = {
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
                    type: 'column',
                    isClosable: false,
                    componentName: 'chart',
                    title: 'Stats',
                    content:[
                        {
                            type: 'row',

                            content: [
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "HTTP versions",
                                    componentState: {id: 'http_versions'},
                                },
                                {
                                    type: 'component',
                                    title: "Methods",
                                    componentName: 'chart',
                                    componentState: {id: 'http_methods'}
                                }
                            ]
                        },
                        {
                            type: 'row',
                            content: [
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "HTTP User agent",
                                    componentState: {id: 'user_agent'}
                                },
                                {
                                    type: 'component',
                                    title: "HTTP Hostnames",
                                    componentName: 'chart',
                                    componentState: {id: 'http_hostnames'}
                                }
                            ]
                        }
                    ]
                },
                {
                    type: 'column',
                    isClosable: false,
                    componentName: 'chart',
                    title: 'Logs',
                    content:[
                        {
                            type: 'row',
                            content: [
                                {
                                    type: 'component',
                                    componentName: 'html',
                                    title: "Total HTTP events",
                                    componentState: {id: 'total_http_events'},
                                    width:30
                                },
                                {
                                    type: 'component',
                                    componentName: 'chart',
                                    title: "HTTP events timeline",
                                    componentState: {id: 'http_events_timeline'}
                                }
                            ]
                        },
                        {
                            type: 'row',
                            content: [
                                {
                                    type: 'component',
                                    componentName: 'html',
                                    title: "HTTP events logs",
                                    componentState: {id: 'http_events_table'}
                                }
                            ]
                        }
                    ]
                }
            ]
        }]
    };
    $("#httpGL").empty();
    obj['myLayout'] = new GoldenLayout( obj['config'], '#httpGL' );
    obj['myLayout'].registerComponent( 'chart', function( container, state ){
        container.getElement().html( '<div id="preloader_'+ state.id +'" class=preloader style="displ__ay: none;"><div class=loader></div></div><canvas id="'+ state.id +'"></canvas>');
    });
    obj['myLayout'].registerComponent( 'html', function( container, state ){
        container.getElement().html( '<div id="'+ state.id +'" class=preloader style="displ__ay: none;"><div class=loader></div></div><div id="'+ state.id +'"></div>');
    });
    obj['myLayout'].init();

    $("[title=Logs]", "#httpGL").click(function(event){
        suricataHTTPRetriever('logs');
    });
    $("[title=Stats]", "#httpGL").click(function(event){
        suricataHTTPRetriever('stats');
    });

    obj = null;
    suricataHTTPRetriever('stats');
}
function suricataHTTPRetriever(mode){
    if(!mode || mode == 'stats'){
        httpStatRetriever({});
    }
    if(!mode || mode == 'logs'){
        httpLogRetriever({});
    }
}
function httpStatRetriever(obj){
    httpVersions(function(data){
        obj['httpVersions'] = data;
        data = null;
        httpMethods(function(data){
            obj['httpMethods'] = data;
            data = null;
            userAgent(function(data){
                obj['userAgent'] = data;
                data = null;
                httpHostnames(function(data){
                    obj['httpHostnames'] = data;
                    data = null;
                    drawHttpStats(obj);
                    obj = null;
                    setTimeout(function () {
                        httpStatRetriever({});
                    }, 60000)
                });
            });
        });
    });
}
function httpVersions(cb){
    $.post(HOST + '/ISP.httpVersions', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
            data = null; return false;
        }
    },'json');
}
function httpMethods(cb){
    $.post(HOST + '/ISP.httpMethods', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
            data = null; return false;
        }
    },'json');
}
function userAgent(cb){
    $.post(HOST + '/ISP.userAgent', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
            data = null; return false;
        }
    },'json');
}
function httpHostnames(cb){
    $.post(HOST + '/ISP.httpHostnames', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
            data = null; return false;
        }
    },'json');
}
function drawHttpStats(data){
    if(data['httpVersions']){
        let obj = {};
        obj.cfg ={
            "type":"pie",
            "data":{
                "datasets":[
                    {
                        "data":data['httpVersions']['data']['data'],
                        "backgroundColor":palette_01
                    }
                ],
                "labels": data['httpVersions']['data']['label']
            },
            "options":{
                "customHideXAxes":"true",
                "customHideYAxes":"true",
                "responsive":true,
                "maintainAspectRatio":false,
                "legend":{
                    "display":true,
                    "position" : "top"

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
                    //display : true,
                    //text : "Attack vector",
                    //fontStyle :"bold"
                }
            }
        };
        obj.ctx = $("#http_versions")[0].getContext('2d');
        if(mem['http_versions']){mem['http_versions'].destroy();}
        mem['http_versions'] = new Chart(obj.ctx, obj.cfg);
        SingleLoadingScreen('http_versions', false);
        obj = null;
    }
    if(data['httpMethods']){
        let obj = {};
        obj.cfg ={
            "type":"pie",
            "data":{
                "datasets":[
                    {
                        "data":data['httpMethods']['data']['data'],
                        "backgroundColor":palette_01
                    }
                ],
                "labels": data['httpMethods']['data']['label']
            },
            "options":{
                "customHideXAxes":"true",
                "customHideYAxes":"true",
                "responsive":true,
                "maintainAspectRatio":false,
                "legend":{
                    "display":true,
                    "position" : "top"

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
                    //display : true,
                    //text : "Attack vector",
                    //fontStyle :"bold"
                }
            }
        };
        obj.ctx = $("#http_methods")[0].getContext('2d');
        if(mem['http_methods']){mem['http_methods'].destroy();}
        mem['http_methods'] = new Chart(obj.ctx, obj.cfg);
        SingleLoadingScreen('http_methods', false);
        obj=null;
    }
    if(data['userAgent']){
        let obj = {};
        obj.cfg ={
            "type":"pie",
            "data":{
                "datasets":[
                    {
                        "data":data['userAgent']['data']['data'],
                        "backgroundColor":palette_01
                    }
                ],
                "labels": data['userAgent']['data']['label']
            },
            "options":{
                "customHideXAxes":"true",
                "customHideYAxes":"true",
                "responsive":true,
                "maintainAspectRatio":false,
                "legend":{
                    "display":true,
                    "position" : "top"

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
                    //display : true,
                    //text : "Attack vector",
                    //fontStyle :"bold"
                }
            }
        };
        obj.ctx = $("#user_agent")[0].getContext('2d');
        if(mem['user_agent']){mem['user_agent'].destroy();}
        mem['user_agent'] = new Chart(obj.ctx, obj.cfg);
        SingleLoadingScreen('user_agent', false);
        obj = null;
    }
    if(data['httpHostnames']){
        let obj = {};
        obj.cfg ={
            "type":"pie",
            "data":{
                "datasets":[
                    {
                        "data":data['httpHostnames']['data']['data'],
                        "backgroundColor":palette_01
                    }
                ],
                "labels": data['httpHostnames']['data']['label']
            },
            "options":{
                "customHideXAxes":"true",
                "customHideYAxes":"true",
                "responsive":true,
                "maintainAspectRatio":false,
                "legend":{
                    "display":true,
                    "position" : "top"

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
                    //display : true,
                    //text : "Attack vector",
                    //fontStyle :"bold"
                }
            }
        };
        obj.ctx = $("#http_hostnames")[0].getContext('2d');
        if(mem['http_hostnames']){mem['http_hostnames'].destroy();}
        mem['http_hostnames'] = new Chart(obj.ctx, obj.cfg);
        SingleLoadingScreen('http_hostnames', false);
        obj = null;
    }
    data = null; return false;
}
function httpLogRetriever(obj){
    httpTimeline(function(data){
        obj['httpTimeline'] = data;
        drawHttpLogs(obj);
        data = null;
        obj = null;
        setTimeout(function () {
            httpLogRetriever({});
        }, 60000)
    });
}
function httpTimeline(cb){
    $.post(HOST + '/ISP.httpTimeline', function(data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            cb(data);
            data = null; return false
        }
    },'json');
}
function drawHttpLogs(data){
    if(data['httpTimeline']){
        let obj = {};
        //var labels = modDateLabel(data['httpTimeline']['data']['label']);
        obj.labels = data['httpTimeline']['data']['label'];
        obj.cfg = {
            "type": 'bar',
            "data": {
                labels :obj.labels,
                datasets :[
                    {
                        borderColor: palette_01[7],
                        data: data['httpTimeline']['data']['data'],
                        label: 'Http events'
                    }
                ]
            },
            "options": {
                "legend": {"display": true, "position": "top"},
                "title": {
                    //"display": true,
                    //"text": 'Invalid Packets'
                },
                "responsive": true,
                "maintainAspectRatio": false,
                scales: {
                    xAxes: [{
                        type: 'time',
                        stacked :true,
                        barThickness: 5
                    }],
                    yAxes: [{
                        scaleLabel: {
                            display: true,
                            labelString: 'Number of events'
                        },
                        stacked :true
                    }]
                }
                /*scales: {
                    xAxes: [{
                        type: 'time'
                    }],
                    yAxes: [{
                        ticks: {
                            min: 0
                        }
                    }]
                },*/
            }
        };
        obj.ctx = $("#http_events_timeline")[0].getContext('2d');
        if(mem['http_events_timeline']){mem['http_events_timeline'].destroy();}
        mem['http_events_timeline'] = new Chart(obj.ctx, obj.cfg);
        SingleLoadingScreen('http_events_timeline', false);
        obj = null;
    }
    let obj = {};
    obj['$table'] = $("<table  id='httpTimelineTable' class='tabella display cell-border compact stripe'><thead><tr><th>Time</th><th>client_hostname</th><th>http.http_method</th><th>http.hostname</th><th>http.url</th><th>http.status</th></tr></thead></table>");
    obj['$tbody'] = $("<tbody></tbody>");
    obj['$table'].append(obj['$tbody']);
    $("#http_events_table").empty().append(obj['$table']);

    $("#httpTimelineTable").dataTable().fnDestroy();
    mem['httpTimelineTable'] = $('#httpTimelineTable').DataTable( {
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
                url: HOST+"/ISP.httpLogs",
                type: "POST",
                "dataSrc": function(data) {
                    if (!data['data'] || !data['data'].length) {
                        return [];
                    } else {
                        var $obj = $('<div class="card mb-4 box-shadow" style="text-align: center;"> '+
                            '<div class="card-header" > '+
                            '    <h4 class="my-0 font-weight-normal">HTTP logs</h4> '+
                            '</div> '+
                            '<div class="card-body"> '+
                            '    <h1 class="card-title pricing-card-title"> '+ data['data'].length +'<small class="text-muted"> </small></h1> '+
                            '</div> '+
                            '</div>');
                        $("#total_http_events").empty().append($obj);
                        return data.data;
                    }
                }
            },
            "columns": [
                { "data": "time"},
                { "data": "client_hostname" },
                { "data": "http_method" },
                { "data": "hostname" },
                { "data": "url" },
                { "data": "status" }
            ],
            "initComplete": function(data){
                $('#httpTimelineTable_wrapper').attr('style','width:100%;')
            }
        });
    obj = null;
}

function modDateLabel(label) {
    const start = moment();
    const remainder = 5 - (start.minute() % 5);
    var newLabel = [];

    label.forEach(function(slot){
        var dateTime = moment(start).add(remainder, "minutes").add(-slot*5, "minutes");
        newLabel.push(dateTime);
    })
    return newLabel;
}
//Functions
function formatBytes(bytes, decimals) {
    if(!decimals){
        decimals = 2;
    }
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
function formatSeconds(seconds, decimals) {
    if(!decimals){
        decimals = 2;
    }
    if (seconds === 0 || seconds === null || !seconds || seconds === undefined){
        return '0 s';
    }else {
        return parseFloat(seconds).toFixed(decimals) + ' s';
    }
}
// Dumpstand
var config = {
    settings:{
        hasHeaders: false,
        constrainDragToContainer: false,
        showCloseIcon: true,
    },
    dimensions: {
        borderWidth: 1,
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
                content:[
                    {
                        type: 'component',
                        componentName: 'component_flow',
                        componentState: { id: 'event_timeline'}
                    },
                    {
                        type: 'component',
                        componentName: 'component_flow',
                        componentState: { id: 'event-bytes_timeline'}
                    }
                ]
            },
            {
                type: 'row',
                content:[
                    {
                        type: 'column',
                        height: '100px',
                        componentName: 'events_byte_column',
                        content: [
                            {
                                type: 'component',
                                componentName: 'events_byte',
                                componentState: {id: 'events_byte'},
                            }
                        ]
                    }
                ]
            },
            {
                type: 'row',
                content:[
                    {
                        type: 'component',
                        componentName: 'events_age',
                        componentState: {id: 'events_age'}
                    }
                ]
            }
        ]
    }]
};


