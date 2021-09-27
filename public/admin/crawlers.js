function crawlerConnectionError(){
    $("#clawlerConnectionError").show();
    $("#clawlersDataClean").hide();
}
function arm_crawlers(){
    $("#data_crawler_list").change(function(event){
        console.log($(this).val());
        crawlerGL($(this).val());
        //getMetrics($(this).val());
    });
    //SeedFinder
    $("#changeSeedFinder").off().click(function(event){
        $("#seedFinder_query").removeAttr("disabled");
        $(this).hide();
        $("#updateSeedFinder").show();
    });
    $("#updateSeedFinder").off().click(function(event){
        addSeedFinder(mem['crawler_data']['crawler_id'],$("#seedFinder_query").val(), function(result){
            console.log(result)
            if(result){
                $("#seedFinder_query").attr("disabled", true);
                $("#updateSeedFinder").hide();
                $("#changeSeedFinder").show();
            }else{
                alert("Error");
            }
        })
    })
    //Cookie
    $("#changeSessionCookie").off().click(function(event){
        $("#sessionCookie_domain").removeAttr("disabled");
        $("#sessionCookie_cookie").removeAttr("disabled");
        $("#sessionCookie_user_agent").removeAttr("disabled");
        $(this).hide();
        $("#updateSessionCookie").show();
    });
    $("#updateSessionCookie").off().click(function(event){
        addSessionCookie(mem['crawler_data']['crawler_id'],$("#sessionCookie_domain").val(),$("#sessionCookie_cookie").val(), $("#sessionCookie_user_agent").val(), function(result){
            $("#sessionCookie_domain").attr("disabled", true);
            $("#sessionCookie_cookie").attr("disabled", true);
            $("#sessionCookie_user_agent").attr("disabled", true);
            $("#updateSessionCookie").hide();
            $("#changeSessionCookie").show();
        })
    })
    //LinkFilters
    $("#changeLinkFilters").off().click(function(event){
        $(this).hide();
        $("#row_updateLinkFilters").show();
    });
    $("#updateLinkFilters").off().click(function(event){
        $("#formLinkFilters").submit();

    })
    $("#formLinkFilters").ajaxForm({
        enctype: 'multipart/form-data', type: 'post', dataType: 'json', url: HOST + '/ADMIN.addLinkFilters', iframe: false,
        beforeSubmit: function () {
            loadingScreen(true);
        },
        success: function (data) {
            if (data.err) {
                alert("Error during the update operation.\nSee: "+JSON.stringify(data.err));
                //location.reload();
            } else {
                console.log(data);
                $("#row_updateLinkFilters").hide();
                $("#changeLinkFilters").show();
            }
            loadingScreen(false);
        }
    });

    //GL
    $("[jmGraphRefresh]").off().click(function(){
        crawlerGL();
    });

    //Crawler management
    $("#addCrawlers").off().click(function(event){
        $("#addCrawlerModal").modal('show');
    });
    $("#addCrawler").off().click(function(event){
        addCrawlers();
    });
    $("#crawlerSwitch").bootstrapToggle();
    //Seeds management
    $("#addSeeds").off().click(function(event){
        $("#addSeedModal").modal('show');
    });
    $("#addSeed").off().click(function(event){
        addSeeds();
    });
    $("#deleteSeed").off().click(function(event){
        deleteSeed();
    })
    $("#openSeedFile").off().click(function(event){
        $("#addSeedBulkModal").modal('show');
    });
    $("#loadSeedBulk").off().click(function(event){
        $("#formSeedBulk").submit();
    });
    $("#formSeedBulk").ajaxForm({
        enctype: 'multipart/form-data', type: 'post', dataType: 'json', url: HOST + '/ADMIN.addSeedBulk', iframe: false,
        beforeSubmit: function () {
            loadingScreen(true);
        },
        success: function (data) {
            if (data.err) {
                alert("Error during the update operation.\nSee: "+JSON.stringify(data.err));
            } else {
                console.log(data);
                $("#addSeedBulkModal").modal('hide');
            }
            loadingScreen(false);
        }
    });
    //URL management
    $("#addUrls").off().click(function(event){
        $("#addURLModal").modal('show');
    });
    $("#addURL").off().click(function(event){
        addURLs();
    });
    $("#deleteUrl").off().click(function(event){
        deleteURL();
    })
    $("#openURLFile").off().click(function(event){
        $("#addURLBulkModal").modal('show');
    });
    $("#loadURLBulk").off().click(function(event){
        $("#formURLBulk").submit();
    });
    $("#formURLBulk").ajaxForm({
        enctype: 'multipart/form-data', type: 'post', dataType: 'json', url: HOST + '/ADMIN.addURLBulk', iframe: false,
        beforeSubmit: function () {
            loadingScreen(true);
        },
        success: function (data) {
            if (data.err) {
                alert("Error during the update operation.\nSee: "+JSON.stringify(data.err));
            } else {
                console.log(data);
                $("#addURLBulkModal").modal('hide');
            }
            loadingScreen(false);
        }
    });
}
function fillCrawler(data){
    SingleLoadingScreen('crawler_settings', true);
    mem['crawler_data'] = data;
    displayGes('crawlers','settings');
    functionalityCheck(data['crawler_type']);
    getCrawler(mem['crawler_data']['crawler_id']);
}
function statusCrawler(crawler_id, status, cb){
    $.post(HOST+"/ADMIN.statusCrawler", {'crawler_id':crawler_id, 'status': status}, function(data){
        if(data.err){
            //alert("We encouter an internal error")
            console.log(data.err);
            cb(false);
        }else{
            console.log(data);
            cb(true);
        }
    }, 'json');
}
function getCrawler(crawler_id){
    $.post(HOST+"/ADMIN.crawler", {'crawler_id': crawler_id}, function(data){
        if(data.err){
            //alert("We encouter an internal error")
        }else{
            var data = data['data'];
            //InfoSetUp
            $("#crawlerId_switch").empty().append(data['crawler_id']);
            $("[name=linkFilter_crawler_id]").val(data['crawler_id']);
            $("[name=seedBulk_crawler_id]").val(data['crawler_id']);
            $("[name=urlBulk_crawler_id]").val(data['crawler_id']);
            //

            if(data['crawler_status']){
                $("#changeStatus").removeClass("btn-success").addClass("btn-danger").empty().append("Stop crawler");
                $("#crawler_status").empty().append("Online");
            }else{
                $("#changeStatus").removeClass("btn-danger").addClass("btn-success").empty().append("Start crawler");
                $("#crawler_status").empty().append("Offline");
            }
            //SeedFinder Query
            if(data['seedFinder_query']){
                $("#seedFinder_query").empty().append(data['seedFinder_query']).attr("disabled", true);
            }
            $("#seedFinder_query").attr("disabled", true);
            //
            //SessionCookie
            if(data['session_cookie']){
                $("#sessionCookie_domain").val(data['session_cookie']['domain']);
                $("#sessionCookie_cookie").val(data['session_cookie']['cookie']);
                $("#sessionCookie_user_agent").empty().append(data['session_cookie']['user_agent']);
            }
            $("#sessionCookie_domain").attr("disabled", true);
            $("#sessionCookie_cookie").attr("disabled", true);
            $("#sessionCookie_user_agent").attr("disabled", true);
            //
            //Link filters
            if(data['link_filters']){
                $("#linkFilter_filename").val(data['link_filters']);
            }
            $("#linkFilter_filename").attr("disabled", true);
            //

            $("#changeStatus").unbind().click(function(event){
                statusCrawler(data['crawler_id'], data['status'], function(response){
                    if(response){
                        if(data['status']){
                            data['status'] = false;
                        }else{
                            data['status'] = true;
                        }
                        fillCrawler(data);
                    }
                });
            });
            $("#seedsTable").dataTable().fnDestroy();
            loadTabelle('seeds');
            if(data['crawler_type'] == 'focused' ){
                $("#urlsTable").dataTable().fnDestroy();
                loadTabelle('urls');
            }
        }
        SingleLoadingScreen('crawler_settings', false);
    }, 'json');
}
function addCrawlers(){
    var id = $("#crawler_id").val();
    var port = $("#crawler_port").val();
    var type = $("#crawler_type").val();
    $.post(HOST+"/ADMIN.addCrawlers", {'crawler_type': type, 'crawler_id':id, 'port': port}, function(data){
        if(data.err){
            //alert("We encouter an internal error")
        }else{
            $("#addCrawlerModal").modal('hide');
            loadTabelle('crawlers');
            refreshData();
        }
    }, 'json');
}
function addSeeds(){
    var seed = $("#newSeed").val();
    $.post(HOST+"/ADMIN.addSeeds", {'seed':seed, 'crawler_id': mem['crawler_data']['crawler_id']}, function(data){
        if(data.err){
            //alert("We encouter an internal error")
        }else{
            $("#addSeedModal").modal('hide');
            loadTabelle('seeds');
        }
    }, 'json');
}
function deleteSeed(){
    var offset = parseInt($("[jmSeed=offset]").val()) +1;
    $.post(HOST+"/ADMIN.deleteSeeds", {'offset':offset, 'crawler_id': mem['crawler_data']['crawler_id']}, function(data){
        if(data.err){
            //alert("We encouter an internal error")
        }else{
            $("#deleteSeedModal").modal('hide');
            loadTabelle('seeds');
        }
    }, 'json');
}
function addURLs(){
    var type = $("#newType").val();
    var url = $("#newURL").val();
    $.post(HOST+"/ADMIN.addTrainingUrl", {'type': type, 'url':url, 'crawler_id':mem['crawler_data']['crawler_id']}, function(data){
        if(data.err){
            //alert("We encouter an internal error")
        }else{
            $("#addURLModal").modal('hide');
            loadTabelle('urls');
        }
    }, 'json');
}
function deleteURL(){
    var offset = parseInt($("[jmURL=offset]").val())+1;
    var url_type = $("[jmURL=url_type]").val();
    $.post(HOST+"/ADMIN.deleteTrainingUrl", {'offset':offset, 'url_type':url_type, 'crawler_id': mem['crawler_data']['crawler_id']}, function(data){
        if(data.err){
            //alert("We encouter an internal error")
        }else{
            $("#deleteURLModal").modal('hide');
            loadTabelle('urls');
        }
    }, 'json');
}
function crawlerGL(){
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
                    content:[
                        {
                            type: 'column',
                            content: [
                                {
                                    type: 'row',
                                    content: [
                                        {
                                    type: 'component',
                                    componentName: 'example',
                                    cssClass: 'bg',
                                    componentState: {text: 'Downloader', id: 'downloader', label: 'Downloader'},
                                    title: 'Downloader'
                                },{
                                        type: 'component',
                                        componentName: 'example',
                                        cssClass: 'bg',
                                        componentState: { text: 'Handlers', id: 'handlers', label: 'Handlers'},
                                        title: 'Handlers'
                                    }
                                    ]
                                },
                            ]
                        },
                        {
                            type: 'component',
                            componentName: 'div',
                            cssClass: 'bg',
                            componentState: { text: 'Frontier manager', id: 'frontier_manager', label: 'Frontier manager'},
                            title: 'Frontier manager'
                        }
                    ]
                },
                {
                    type: 'row',
                    content:[{
                        type: 'component',
                        componentName: 'example',
                        cssClass: 'bg-primary',
                        componentState: { text: 'Response', id: 'response', label: 'Response history'},
                        title: 'Response'
                    }
                    ]
                }
            ]
        }]
    };
    $("#crawlerGL").empty();
    var myLayout = new GoldenLayout( config, '#crawlerGL' );
    myLayout.registerComponent( 'example', function( container, state ){
        container.getElement().html( '<canvas id="'+ state.id +'"></canvas>');
    });
    myLayout.registerComponent( 'div', function( container, state ){
        container.getElement().html( '<div id="'+ state.id +'"></div>');
    });
    myLayout.init();
    //getCrawledPage($( "#data_crawler_list option:selected" ).text());
    getCrawlerData($("#data_crawler_list").val());
    graphStorage();
}
function getCrawlers(data){
    if(!mem['crawlers_option_clone']){
        mem['crawlers_option_clone'] = $("[jmOption=crawlers]").clone();
    }
    var existent = $("#data_crawler_list").val();
    var $opt = mem['crawlers_option_clone'].clone();
    $opt.attr('selected', 'selected');
    $("#data_crawler_list").empty().append($opt);
    data.forEach(function(crawler){
        if(crawler['crawler_status']){
            var $opt = mem['crawlers_option_clone'].clone();
            $opt.val(crawler['crawler_port']).empty().append(crawler['crawler_id']);
            if(crawler['crawler_id'] == existent || !existent){
                $opt.attr('selected','selected');
                existent = crawler['crawler_port'];
            }
            $("#data_crawler_list").append($opt);
        }
    });
}
function getPorts(){
    $.get(HOST+"/ADMIN.crawlersPorts", function(data){
        if(data.err){
            if(data['err']['errno'] == -111 || data['err']['code'] == "ECONNREFUSED"){
                crawlerConnectionError();
            }
        }else{
            if(!mem['port_option_clone']){
                mem['port_option_clone'] = $("[jmOption=port]").clone();
            }
            var $opt = mem['port_option_clone'].clone();
                $opt.attr('selected', 'selected');
            $("#crawler_port").empty().append($opt);
            data['data'].forEach(function(port){
                var $opt = mem['port_option_clone'].clone();
                    $opt.val(port).empty().append(port);
                $("#crawler_port").append($opt);
            });
        }
    }, 'json');
}
function getTypes(){
    $.get(HOST+"/ADMIN.crawlersType", function(data){
        if(data.err){
            //alert("We encouter an internal error")
        }else{
            if(!mem['type_option_clone']){
                mem['type_option_clone'] = $("[jmOption=type]").clone();
            }
            var $opt = mem['type_option_clone'].clone();
            $opt.attr('selected', 'selected');
            $("#crawler_type").empty().append($opt);
            Object.keys(data['data']).forEach(function(type){
                var $opt = mem['type_option_clone'].clone();
                $opt.val(type).empty().append(data['data'][type]);
                $("#crawler_type").append($opt);
            });
        }
    }, 'json');
}
function getMetrics(port){
    $.post(HOST+"/ADMIN.crawlerMetrics", {port:port},function(data){
        if(data.err){
            //alert("We encouter an internal error")
        }else{
        }
    }, 'json');
}
function addSeedFinder(crawler_id, seedFinder_query, cb){
    $.post(HOST+"/ADMIN.addSeedFinder", {crawler_id:crawler_id, seedFinder_query: seedFinder_query},function(data){
        if(data.err || data['status'] == 500){
            console.error(data['detail'])
            alert(data['detail']);
            cb(false)
        }else{
            console.log(data);
            cb(true);
        }
    }, 'json');
}
function addSessionCookie(crawler_id, domain, cookie, user_agent,cb){
    $.post(HOST+"/ADMIN.addCookie", {crawler_id:crawler_id, 'domain': domain,'cookie': cookie,'user_agent': user_agent},function(data){
        if(data.err){
            //alert("We encouter an internal error")
        }else{
            cb(true);
        }
    }, 'json');
}
function getCrawledPage(crawler_id){
    if(crawler_id){
        $('#AnalyzedPages').parent().append($("<div id='preloader_crawler_pagespie'class=preloader><div class=loader></div></div>"));
        $.post(HOST+"/ADMIN.crawledPages", {'crawler_id': crawler_id}, function(data){
            if(data.err){
                //alert("We encouter an internal error")
            }else{
                var count = {
                    'relevant': data['data']['relevant'].length,
                    'nonrelevant': data['data']['nonrelevant'].length
                }
                pies(count);
            }
        },'json');
    }
}
function getCrawlerData(crawler_port){
    if(crawler_port){
        $("#preloader_crawler").show();
        $.post(HOST+"/ADMIN.crawlerData", {'crawler_port': crawler_port}, function(data){
            if(data.err){
                if(data['err']['errno'] == -111 || data['err']['code'] == "ECONNREFUSED"){
                    crawlerConnectionError();
                }
            }else{
                $("#preloader_crawler").hide();
                var data = data['data'];
                if(data['downloader']){
                    downloaderPie(data['downloader']);
                }
                if(data['handlers']){
                    handlersPie(data['handlers']);
                }
                if(data['frontierManager']){
                    frontierManagerTable(data['frontierManager']);
                }
                if(data['response']){
                    responseChart(data['response']);
                }
            }
        },'json');
    }
}

function functionalityCheck(type){
    $("[crawlerTypeFunctionality]").each(function(element){
        if($(this).attr("crawlerTypeFunctionality").match(type)){
            $(this).show();
        }else{
            $(this).hide();
        }
    })
}
function refreshData(){
    getPorts();
    getTypes();
    $("#newCrawlerForm").resetForm();
}
//GL
function graphStorage(){
    //timeSeries();
    //lines();
}
function pies(data){
    var pages = {
        type: 'pie',
        data: {
            datasets: [{
                data: [
                    data['nonrelevant'],
                    data['relevant']
                ],
                backgroundColor: [
                    'red',
                    'green'
                ],
                label: 'Crawled pages'
            }],
            labels:     [
                'non-relevant',
                'relevant'
            ]
        },
        options: {
            "responsive": true,
            "maintainAspectRatio": false
        }
    };
    var ctx  = $('#AnalyzedPages')[0].getContext('2d');
    ctx.canvas.width = parseFloat($('#AnalyzedPages').width() * 0.8);
    ctx.canvas.height = parseFloat($('#AnalyzedPages').height()*0.6);
    SingleLoadingScreen('crawler_pagespie', false);
    var chart = new Chart(ctx, pages);
}
function downloaderPie(data){
    var pages = {
        type: 'pie',
        data: {
            datasets: [{
                data: [
                    data['dispatch'],
                    data['pending'],
                    data['download'],
                ],
                backgroundColor: [
                    'yellow',
                    'blue',
                    'green'
                ],
                label: 'Downloader'
            }],
            labels:     [
                'dispatch',
                'pending',
                'download'
            ]
        },
        options: {
            "responsive": true,
            "maintainAspectRatio": false,
            title: {
                display: true,
                text: 'Download attempt'
            },
            legend: {
                display: true,
                position: 'bottom'
            }
        }
    };
    var ctx  = $('#downloader')[0].getContext('2d');
    ctx.canvas.width = parseFloat($('#downloader').width() * 0.8);
    ctx.canvas.height = parseFloat($('#downloader').height()*0.6);
    if(mem['downloaderPie']){mem['downloaderPie'].destroy();}
    mem['downloaderPie'] = new Chart(ctx, pages);
}
function handlersPie(data){
    var pages = {
        type: 'pie',
        data: {
            datasets: [{
                data: [
                    data['request'],
                    data['handlers']
                ],
                backgroundColor: [
                    'orange',
                    'green'
                ],
                label: 'Downloader'
            }],
            labels:     [
                'Request',
                'Handlers'
            ]
        },
        options: {
            "responsive": true,
            "maintainAspectRatio": false,
            title: {
                display: true,
                text: 'Handlers'
            },
            legend: {
                display: true,
                position: 'bottom'
            }
        }
    };
    var ctx  = $('#handlers')[0].getContext('2d');
    ctx.canvas.width = parseFloat($('#handlers').width() * 0.8);
    ctx.canvas.height = parseFloat($('#handlers').height()*0.6);
    if(mem['handlersPie']){mem['handlersPie'].destroy();}
    mem['handlersPie'] = new Chart(ctx, pages);
}
function frontierManagerTable(data){
    var $table = $("<table class='table table-striped'>" +
        "   <tbody>" +
        "       <tr>" +
        "           <td>Available</td>" +
        "           <td>"+data['available']+"</td>" +
        "       </tr>" +
        "       <tr>" +
        "           <td>Rejected</td>" +
        "           <td>"+data['rejected']+"</td>" +
        "       </tr>" +
        "       <tr>" +
        "           <td>Uncrawled</td>" +
        "           <td>"+data['uncrawled']+"</td>" +
        "       </tr>" +
        "       <tr>" +
        "           <td>Empty domains</td>" +
        "           <td>"+data['empty_domains']+"</td>" +
        "       </tr>" +
        "       <tr>" +
        "           <td>Non expired domains</td>" +
        "           <td>"+data['non_expired_domains']+"</td>" +
        "       </tr>" +
        "       <tr>" +
        "           <td>Number of links</td>" +
        "           <td>"+data['number_of_links']+"</td>" +
        "       </tr>" +
        "       <tr>" +
        "           <td>Harvest rate</td>" +
        "           <td>"+data['harvest_rate']+"</td>" +
        "       </tr>" +
        "   </tbody>" +
        "</table>"
    );
    $("#frontier_manager").empty().append("<h3>Frontier manager data</h3></br>").append($table);

}
function responseChart(data){
    var cfg ={
        "type":"bar",
        "data":{
            "labels": data['labels'],
            "datasets":[
                {
                    "label":null,
                    "data" : data['values'],
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
                "display":false, position : 'bottom'
            },
            "title" : {
                "display" : true,
                text: 'Response'
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
    var ctx = $("#response")[0].getContext('2d');
    if(mem['response']){mem['response'].destroy();}
    mem['response'] = new Chart(ctx, cfg);
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