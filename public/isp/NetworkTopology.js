function armNetwork(){
}
function drawNetwork(topology){
    $.post(HOST + '/PS.networkTopology', function (data) {
    //$.get("./test.json", function (data){
        if (data['err']) {
            alert(data['err']);
        } else {
            SingleLoadingScreen('topology', false);
            mem['topology'] = data;
            var topology = data;
            var nodes = [];
            var edges = [];
            var clusters = [];
            var map = {};
            mem['nodesData'] = {};

            var CT = {
                group: 'nodes',
                data: {
                    id: 'CT',
                    parent: 0,
                    type: 'base',
                    label: 'CyberTrust Platform',
                },
                classes: 'bottom-right'
            }
            nodes.push(CT);
            if(topology['network']) {
                Object.keys(topology['network']).forEach(function (soho, index) {
                    var sohoNode = {
                        group: 'nodes',
                        data: {
                            id: soho,
                            parent: 0,
                            type: 'soho',
                            label: soho,
                            pos : index+1,
                            total : Object.keys(topology['network']).length
                        },
                        classes: 'bottom-right'
                    }
                    nodes.push(sohoNode);
                    map[soho] = [];
                    var edge = {
                        group: 'edges',
                        pannable: true,
                        data: {id: 'ct_'+soho, source: 'CT', target: soho}
                    };
                    edges.push(edge);
                    var sohotopology = topology['network'][soho];
                    var gateway = {};
                    if(sohotopology['machine']) {
                        let machines = sohotopology['machine'];
                        machines.forEach(function(machine){
                            if(machine['routes']){
                                gateway[machine['routes']['route']['gateway']] = 1;
                            }
                        })
                        if(sohotopology['machine'].length){
                            var cluster = []
                            sohotopology['machine'].forEach(function (machine, index) {
                                if (machine['interfaces'] && machine['interfaces']['interface']) {
                                    machineClassifier(machine, function (type) {
                                        var ip = machine['interfaces']['interface']['ipaddress'];
                                        if(gateway[ip]){
                                            type = 'router'
                                            var edge = {
                                                group: 'edges',
                                                pannable: true,
                                                data: {id: machine['name'], source: ip, target: soho}
                                            };
                                            edges.push(edge);
                                        }else{
                                            Object.keys(gateway).forEach(function(gt){
                                                var edge = {
                                                    group: 'edges',
                                                    pannable: true,
                                                    data: {
                                                        id: soho + "-" + ip + "-"+gt,
                                                        source: ip,
                                                        target: gt
                                                    }
                                                };
                                                edges.push(edge);
                                            })
                                        }
                                        var node = {
                                            group: 'nodes',
                                            data: {
                                                id: ip,
                                                parent: ip,
                                                type: type,
                                                label: ip
                                            },
                                            classes: 'bottom-right'
                                        }
                                        nodes.push(node);
                                        map[soho].push(ip);
                                        mem['nodesData'][ip] = machine;
                                        cluster.push(ip);
                                    });
                                }
                            });
                            clusters.push(cluster);
                        }
                    }
                });
            }
            cytoDraw(nodes, edges, clusters, map)
        }
    }, 'json');
}
function cytoDraw(nodes, edges, clusters, map){
    /*cy.layout({
        name: 'cise',
        nodeSeparation: nodeSep,
        allowNodesInsideCircle: allowNodesInCircle,
        maxRatioOfNodesInsideCircle: maxRatio,
        animate: anim,
        clusters: arrayOfClusterArrays,
        refresh: 1,
        idealInterClusterEdgeLengthCoefficient: idealEdgeCoef
    });

     */

    var cy = cytoscape({
        container: $('#networkCanvas'),
        style: [
            {
                selector: 'node',
                style: {
                    'background-color': '#FFFFFF',
                    'border-width': 2,
                    'border-color': '#000000',
                    'label': 'data(id)',
                    'text-valign': 'bottom',
                    'text-halign': 'center',
                    "text-background-opacity": 1,
                    "text-background-color": "lightgray"
                }
            },
            {
                selector: ':parent',
                style: {
                    'background-opacity': 0.333
                }
            },
            {
                selector: 'edge',
                style: {
                    'width': 1,
                    'line-color': '#3277a8'
                }
            },
            {
                selector: '[type= "generalDevice"]',
                style: {
                    'background-image': 'url("../images/networkImg/general.png")',
                    'background-fit' : 'contain'
                }
            },
            {
                selector: '[type = "linux"]',
                style: {
                    'background-image': '../images/networkImg/linux.png',
                    'background-fit' : 'contain'
                }
            },
            {
                selector: '[type = "android"]',
                style: {
                    'background-image': '../images/networkImg/android.png',
                    'background-fit' : 'contain'
                }
            },
            {
                selector: '[type = "apple"]',
                style: {
                    'background-image': '../images/networkImg/apple.webp',
                    'background-fit' : 'contain'
                }
            },
            {
                selector: '[type = "laptop"]',
                style: {
                    'background-image': '../images/networkImg/laptop.png',
                    'background-fit' : 'contain'
                }
            },
            {
                selector: '[type = "mobile"]',
                style: {
                    'background-image': '../images/networkImg/mobile.png',
                    'background-fit' : 'contain'
                }
            },
            {
                selector: '[type = "windows"]',
                style: {
                    'background-image': '../images/networkImg/windows.webp',
                    'background-fit' : 'contain'
                }
            },
            {
                selector: '[type = "router"]',
                style: {
                    'background-image': '../images/networkImg/router.png',
                    'background-fit' : 'contain'
                }
            }
        ],
        layout: {
            name: 'cise',
            nodeSeparation: 12.5,
            allowNodesInsideCircle: 'no',
            maxRatioOfNodesInsideCircle: 0.1,
            animate: 'end',
            clusters: clusters,
            refresh: 1,
            idealInterClusterEdgeLengthCoefficient: 1.4
            },
        elements: $.merge(nodes, edges)
    });
    cy.on('tap', 'node', function(event){
        var node = event.target;
        nodeAction(map, node.id())
    });
    mem['cy'] = cy;
    mem['cy'].fit();
}
function machineClassifier(machine, cb){
    var deviceClass = 'generalDevice';
    if(machine['interfaces']['interface']['ipaddress']){
        /*if(machine['interfaces']['interface']['ipaddress'] === '192.168.0.1'){
            deviceClass = 'router';
        }else*/
        if (machine['cpe'] && machine['cpe'] != "cpe:/"){
            if(machine['cpe'].match(/.linux./gi)){
                deviceClass = 'linux';
            }
            if(machine['cpe'].match(/.android./gi)){
                deviceClass = 'android';
            }
            if(machine['cpe'].match(/microsoft|windows/gi)){
                deviceClass = 'windows';
            }
            if(machine['cpe'].match(/.apple./gi)){
                deviceClass = 'apple';
            }
        }
    }
    cb(deviceClass)
}
function subNet(sohoId){
    var nodePosition = mem['cy'].$("#"+sohoId).position();
    //console.log(mem['cy'].$("#"+sohoId).attr('pos'),"/",mem['cy'].$("#"+sohoId).attr('total'))
    var topology = mem['topology']['network'][sohoId];
    var nodes = []; var edges= [];
    if(topology['machine']) {
        topology['machine'].forEach(function (machine, index) {
            if (machine['interfaces'] && machine['interfaces']['interface']) {
                machineClassifier(machine, function(type) {
                    var ip = machine['interfaces']['interface']['ipaddress'];
                    var node = {
                        group: 'nodes',
                        data: {
                            id: ip,
                            parent: ip,
                            type: type,
                            label: ip
                        },
                        classes: 'bottom-right'
                    }
                    nodes.push(node);
                    var edge = {
                        group: 'edges',
                        pannable: true,
                        data: {id: machine['name'], source: ip, target: sohoId}
                    };
                    edges.push(edge);
                    if (machine['interfaces']['interface']['directly-connected'] && machine['interfaces']['interface']['directly-connected']['ipaddress'].length) {
                        machine['interfaces']['interface']['directly-connected']['ipaddress'].forEach(function (address) {
                            var edge = {
                                group: 'edges',
                                pannable: true,
                                data: {id: sohoId + "-" +edges.length + 1, source: ip, target: address}
                            };
                            edges.push(edge);
                        })
                    }
                });
            }
        });
    }
    mem['cy'].add(nodes);
    mem['cy'].add(edges);
}
function nodeAction(map, nodeId){
    if(map[nodeId]){
        map[nodeId].forEach(function(node){
            if( mem['cy'].filter("node[id='"+node+"']").style("display") == 'element'){
                mem['cy'].filter("node[id='"+node+"']").style("display", "none")
            }else{
                mem['cy'].filter("node[id='"+node+"']").style("display", "element")
            }

            console.log(mem['cy'].filter("node[id='"+node+"']").style("display"))
        })
    }else{
        machineDataFiller(mem['nodesData'][nodeId]);
    }
}
function machineDataFiller(machine){
    if(machine){
        console.log(machine)
        $("[jmField=machine_name]").val(machine['name']);
        $("[jmField=machine_ip]").val(machine['interfaces']['interface']['ipaddress']);
        $("[jmField=machine_cpe]").val(machine['cpe']);
        $("[jmField=machine_firewallIn]").val(machine['input-firewall']['default-policy']);
        $("[jmField=machine_firewallOut]").val(machine['output-firewall']['default-policy']);
        if(!machine['services']){
            machine['services'] = {};
            machine['services']['service'] = [];
        }

        $("#machine_services").dataTable().fnDestroy();
        mem['tabMachineServices'] = $("#machine_services").DataTable({
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
            "data": machine['services']['service'],
            "processing": true,
            "language": {
                "processing": '<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i><span class="sr-only">Loading...</span> '},
            "sortable": true,
            "columns": [
                {"data": "ipaddress", "name": "ipaddress", "defaultContent": "<i>Not set</i>"},
                {"data": "port", "name": "port", "defaultContent": "<i>Not set</i>"},
                {"data": "name", "name": "name", "defaultContent": "<i>Not set</i>"},
                {"data": "protocol", "name": "protocol", "defaultContent": "<i>Not set</i>"}
            ],
            "initComplete": function (data) {
                $('#machine_services_wrapper').attr('style', 'width:100%;')
                $('#machine_services').attr('style', 'width:100%;')
            }
        });

    }
    //$("#nodeModal").modal();
}