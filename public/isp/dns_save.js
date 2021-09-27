/**
 * Created by simone on 23/04/20.
 */

function DNSGL(){
    var config = {
        settings:{
            hasHeaders: false,
            constrainDragToContainer: false,
            showCloseIcon: true
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
                            componentName: 'example',
                            componentState: { text: 'client', id: 'client_pie', label: 'Client' },
                            title: 'Client'

                        },
                        {
                            type: 'component',
                            componentName: 'example',
                            componentState: { text: 'DNS Server', id: 'dns_server_pie', label: 'DNS Server' },
                            title: 'DNS Server'
                        },
                        {
                            type: 'component', componentName: 'example'
                        }
                    ]
                },
                {
                    type: 'row',
                    content:[
                        {
                            type: 'component',
                            componentName: 'example',
                            componentState: { text: 'DNS Message Type', id: 'message_pie', label: 'DNS Message Type' },
                            title: 'DNS Message Type'
                        },
                        {
                            type: 'component',
                            componentName: 'example',
                            componentState: { text: 'DNS Record type', id: 'record_pie', label: 'DNS Record type' },
                            title: 'DNS Record type'
                        },
                        {
                            type: 'component',
                            componentName: 'example',
                            componentState: { text: 'DNS Response code', id: 'response_pie', label: 'DNS Response code' },
                            title: 'DNS Response code'
                        }
                    ]
                },
                {type: 'row',content:[
                    {
                        type: 'component',
                        componentName: 'example',
                        componentState: { text: 'client', id: 'top_queries', label: 'Client' },
                        title: 'Client'

                    },
                    {
                        type: 'component',
                        componentName: 'example',
                        componentState: { text: 'DNS Server', id: 'top_answers', label: 'DNS Server' },
                        title: 'DNS Server'
                    }
                ]},
                {type: 'row',content:[
                    {
                        type: 'component',
                        componentName: 'example',
                        componentState: { text: 'client', id: 'dns_timeline', label: 'Client' }
                    }
                ]}
            ]
        }]
    };
    $("#dnsGL").empty();
    var myLayout = new GoldenLayout( config, '#dnsGL' );
    myLayout.registerComponent( 'example', function( container, state ){
        container.getElement().html( '<canvas id="'+ state.id +'" height="100px" width="300px"></canvas>').height('100px');
    });
    myLayout.init();
    var option = {'time':1};
    aggregateDNS();
    timeLineDNS();
    DNSTable();
}
function aggregateDNS(){
    $.post(HOST + '/ISP.aggregateDNS', function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            client_pie(data['data']['client']);
            dns_server_pie(data['data']['rrname']);
            message_pie(data['data']['type']);
            record_pie(data['data']['rrtype']);
            response_pie(data['data']['rcode']);
            topQuery(data['data']['top_query']);
            topAnswer(data['data']['top_answer']);
        }
    },'json');
}
//Ciambelle
function client_pie(data){
    var cfg = {
        "type": "doughnut",
        "data": {
            labels: data['label'],
            datasets: [{
                data: data['data'],
                backgroundColor: palette_a
            }]
        },
        "options": {
            "legend": {
                "position": "right",
                "fullWidth" : false
            },
            title: {
                display: true,
                text: 'Clients'
            },
            "responsive": true,
            "maintainAspectRatio": false
        }
    }
    var ctx = $("#client_pie")[0].getContext('2d');
    var chart = new Chart(ctx, cfg);
}
function dns_server_pie(data){
    var cfg = {
        "type": "doughnut",
        "data": {
            labels: data['label'],
            datasets: [{
                data: data['data'],
                backgroundColor: palette_b
            }]
        },
        "options": {
            "legend": {
                "position": "right",
                "fullWidth" : false
            },
            title: {
                display: true,
                text: 'DNS server'
            },
            "responsive": true,
            "maintainAspectRatio": false
        }
    }
    var ctx = $("#dns_server_pie")[0].getContext('2d');
    var chart = new Chart(ctx, cfg);
}
function message_pie(data){
    var cfg = {
        "type": "doughnut",
        "data": {
            labels: data['label'],
            datasets: [{
                data: data['data'],
                backgroundColor: palette_c
            }]
        },
        "options": {
            "legend": {"position": "right"},
            title: {
                display: true,
                text: 'DNS Message type'
            },
            "responsive": true,
            "maintainAspectRatio": false
        }
    }
    var ctx = $("#message_pie")[0].getContext('2d');
    var chart = new Chart(ctx, cfg);
}
function record_pie(data){
    var cfg = {
        "type": "doughnut",
        "data": {
            labels: data['label'],
            datasets: [{
                data: data['data'],
                backgroundColor: palette_b
            }]
        },
        "options": {
            "legend": {"position": "right"},
            title: {
                display: true,
                text: 'DNS Record type'
            },
            "responsive": true,
            "maintainAspectRatio": false
        }
    }
    var ctx = $("#record_pie")[0].getContext('2d');
    var chart = new Chart(ctx, cfg);
}
function response_pie(data){
    var cfg = {
        "type": "doughnut",
        "data": {
            labels: data['label'],
            datasets: [{
                data: data['data'],
                backgroundColor: palette_a
            }]
        },
        "options": {
            "legend": {"position": "right"},
            title: {
                display: true,
                text: 'DNS Response code'
            },
            "responsive": true,
            "maintainAspectRatio": false
        }
    }
    var ctx = $("#response_pie")[0].getContext('2d');
    var chart = new Chart(ctx, cfg);
}
//Barchart
function topQuery(data){
    var cfg = {
        "type": "horizontalBar",
        "data": {
            labels: data['label'],
            datasets: [{
                data: data['data'],
                backgroundColor: "#77ace0"
            }]
        },

        "options": {
            "legend": {"display": false},
            title: {
                display: true,
                text: 'Top Queries'
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        display:false
                    }
                }],
                yAxes: [{
                    gridLines: {
                        display:false
                    }
                }]
            },
            "responsive": true,
            "maintainAspectRatio": false
        }
    };
    var ctx = $("#top_queries")[0].getContext('2d');
    var chart = new Chart(ctx, cfg);
}
function topAnswer(data){
    var cfg = {
        "type": "horizontalBar",
        "data": {
            labels: data['label'],
            datasets: [{
                data: data['data'],
                backgroundColor: "#77ace0"
            }]
        },

        "options": {
            "legend": {"display": false},
            title: {
                display: true,
                text: 'Top Answers'
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        display:false
                    }
                }],
                yAxes: [{
                    gridLines: {
                        display:false
                    }
                }]
            },
            "responsive": true,
            "maintainAspectRatio": false
        }
    };
    var ctx = $("#top_answers")[0].getContext('2d');
    var chart = new Chart(ctx, cfg);
}
//TimeLine
function timeLineDNS(){
    /*dnsTimeLineGL
     var config = {
     height: 10,
     settings:{
     hasHeaders: false,
     constrainDragToContainer: false,
     showCloseIcon: true
     },
     dimensions: {
     borderWidth: 1,
     minItemHeight: 10,
     maxItemHeight: 100,
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
     height: 12,
     content:[
     {
     type: 'component',
     componentName: 'dns_timeline',
     componentState: { id: 'dns_timeline'},
     title: 'Client'
     }
     ]
     }
     ]
     }]
     };

     $("#dnsTimeLineGL").empty();
     var myLayout = new GoldenLayout( config, '#dnsTimeLineGL' );
     myLayout.registerComponent( 'dns_timeline', function( container, state ){
     container.getElement().html('<canvas id="'+ state.id +'" height="10px" width="300px"></canvas>').height('10px');
     });
     myLayout.init();
     */
    $.post(HOST + '/ISP.timeLineDNS', function(data) {
        if(data['err']){
            alert(data['err']);
        }else{
            drawTimeLineDNS(data['data']);
        }
    },'json');
}
function drawTimeLineDNS(data){
    data['label'] = modDateLabel(data['label']);
    var cfg = {
        "type": "bar",
        "data": {
            labels: data['label'],
            datasets: [{
                label: "Dati DNS",
                data: data['data'],
                backgroundColor: "#77ace0"
            }]
        },
        "options":  {
            "legend": {"display": false},
            title: {
                display: true,
                text: 'DNS Logs'
            },
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
                }]
            },
            "responsive": true,
            "maintainAspectRatio": false
        }
    };
    var ctx = $("#dns_timeline")[0].getContext('2d');
    var chart = new Chart(ctx, cfg);
}
//Data Table
function DNSTable(){
    $("#dnsTable").dataTable().fnDestroy();
    mem['tabAlerts'] = $('#dnsTable').DataTable( {
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
        "ajax": HOST+"/ISP.listDNS",
        "dataSrc": function(data) {
            if (data == "no data") {
                return [];
            } else {
                return data.data;
            }
        },
        "columns": [
            { "data": "time"},
            { "data": "client_hostname" },
            { "data": "server_hostname" },
            { "data": "dns_type" },
            { "data": "dns_rrname" },
            { "data": "dns_rcode" },
            { "data": "dns_rrtype" },
            { "data": "dns_rdata" }
        ],
        "initComplete": function(data){
            $('#dnsTable').on('click', 'tbody tr', function () {
                /*var row = mem['tabCrawlers'].row($(this)).data();
                 if(mem['tabCrawlers'].row( this ).index() != undefined){
                 fillCrawler(row);
                 }*/
            });
            $('#dnsTable_wrapper').attr('style','width:100%;')
        }
    });
}
