/**
 * Created by simone on 07/05/20.
 */
var mem = {};
var dx = 50;
var dy = 160;
var width = 1000;
var diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);
var margin ={top: 50, right: 120, bottom: 10, left: 150};

function armNetwork(){
    //draw();
    $("#refreshNetwork").click(function(event){
        event.stopPropagation();
        mem = {};
        getTopology();
    })
    $("#collapseAll").click(function(event){
        event.stopPropagation();
        update(mem['root']);
    });
    $("#3DVersion").click(function(event){
        event.stopPropagation();
        $("#3d-graph").empty().show(function(event){
            treeD();
        });
    });
    $("#2DVersion").click(function(event){
        event.stopPropagation();
        $("#3d-graph").hide();
        $("#chart").show();
        $("#box2d").hide();$("#box3d").show();
    });
    getTopology();
}
function getTopology() {
    SingleLoadingScreen('topology', true);
    $("#chartContainer").hide();
    $.post(HOST + '/PS.networkTopology', function (data) {
        if (data['err']) {
            alert(data['err']);
        } else {
            console.log(data);
            /*
            SingleLoadingScreen('topology', false);
            $("#chartContainer").show();
            createTree(data['data'], function(tree){
                $("#chart").empty().append(tree);
                update(mem['root']);
            });
            mem['networkData'] = data['network'];

             */
        }
    }, 'json');
}
var nodes = null;
var edges = null;
var network = null;
var LENGTH_MAIN = 350,
    LENGTH_SERVER = 150,
    LENGTH_SUB = 50,
    WIDTH_SCALE = 2,
    GREEN = "green",
    RED = "#C5000B",
    ORANGE = "orange",
    //GRAY = '#666666',
    GRAY = "gray",
    BLACK = "#2B1B17";
// Called when the Visualization API is loaded.
function draw() {
    // Create a data table with nodes.
    nodes = [];
    // Create a data table with links.
    edges = [];

    nodes.push({ id: 0, label: "sourceNode",    group: "switch", value: 10 });

    nodes.push({ id: 1, label: "smartHome 1",    group: "smartHome", value: 10 });
    nodes.push({ id: 2, label: "smartHome 2",    group: "smartHome", value: 10 });
    nodes.push({ id: 3, label: "smartHome 3",    group: "smartHome", value: 10 });
    nodes.push({ id: 4, label: "smartHome 4",    group: "smartHome", value: 10 });

    nodes.push({ id: 11, label: "device",    group: "device", value: 10 });
    nodes.push({ id: 12, label: "device",    group: "device", value: 10 });
    nodes.push({ id: 13, label: "laptop",    group: "laptop", value: 10 });
    nodes.push({ id: 14, label: "laptop",    group: "laptop", value: 10 });

    nodes.push({ id: 21, label: "device",    group: "device", value: 10 });
    nodes.push({ id: 22, label: "device",    group: "device", value: 10 });
    nodes.push({ id: 23, label: "laptop",    group: "laptop", value: 10 });
    nodes.push({ id: 24, label: "laptop",    group: "laptop", value: 10 });

    nodes.push({ id: 31, label: "device",    group: "device", value: 10 });
    nodes.push({ id: 32, label: "device",    group: "device", value: 10 });


    nodes.push({ id: 41, label: "device",    group: "device", value: 10 });
    nodes.push({ id: 42, label: "device",    group: "device", value: 10 });
    nodes.push({ id: 43, label: "laptop",    group: "laptop", value: 10 });

    edges.push({
        from: 0,
        to: 1,
        length: LENGTH_MAIN,
        width: WIDTH_SCALE ,
        label: ""
    });
    edges.push({
        from: 0,
        to: 2,
        length: LENGTH_MAIN,
        width: WIDTH_SCALE ,
        label: ""
    });
    edges.push({
        from: 0,
        to: 3,
        length: LENGTH_MAIN,
        width: WIDTH_SCALE ,
        label: ""
    });
    edges.push({
        from: 0,
        to: 4,
        length: LENGTH_MAIN,
        width: WIDTH_SCALE ,
        label: ""
    });

    edges.push({from: 1, to: 11, length: LENGTH_SUB, width: WIDTH_SCALE , label: "" });
    edges.push({from: 1, to: 12, length: LENGTH_SUB, width: WIDTH_SCALE , label: "" });
    edges.push({from: 1, to: 13, length: LENGTH_SUB, width: WIDTH_SCALE , label: "" });
    edges.push({from: 1, to: 14, length: LENGTH_SUB, width: WIDTH_SCALE , label: "" });

    edges.push({from: 2, to: 21, length: LENGTH_SUB, width: WIDTH_SCALE , label: "" });
    edges.push({from: 2, to: 22, length: LENGTH_SUB, width: WIDTH_SCALE , label: "" });
    edges.push({from: 2, to: 23, length: LENGTH_SUB, width: WIDTH_SCALE , label: "" });
    edges.push({from: 2, to: 24, length: LENGTH_SUB, width: WIDTH_SCALE , label: "" });

    edges.push({from: 3, to: 31, length: LENGTH_SUB, width: WIDTH_SCALE , label: "" });
    edges.push({from: 3, to: 32, length: LENGTH_SUB, width: WIDTH_SCALE , label: "" });

    edges.push({from: 4, to: 41, length: LENGTH_SUB, width: WIDTH_SCALE , label: "" });
    edges.push({from: 4, to: 42, length: LENGTH_SUB, width: WIDTH_SCALE , label: "" });
    edges.push({from: 4, to: 43, length: LENGTH_SUB, width: WIDTH_SCALE , label: "" });


    // create a network
    var container = document.getElementById("mynetwork");
    var data = {
        nodes: nodes,
        edges: edges
    };
    var options = {
        nodes: {
            scaling: {
                min: 16,
                max: 32
            }
        },
        edges: {
            color: GRAY,
            smooth: false
        },
        physics: {
            barnesHut: { gravitationalConstant: -30000,
                "springLength":100, "springConstant": 0.04
            },
            stabilization: { iterations: 2500 }
        },
        groups: {
            switch: {
                shape: "dot",
                color: "#2B7CE9" // blue
            },
            smartHome: {
                shape: "image",
                image: "../img/network/homeIcon.png",
                color: "#2B7CE9" // blue
            },
            laptop: {
                shape: "image",
                image: "../img/network/laptopIcon.png",
                color: "#2B7CE9" // blue
            },
            mobile: {
                shape: "image",
                image: "../img/network/smartphoneIcon.png",
                color: "#5A1E5C" // purple
            },
            device: {
                shape: "image",
                image: "../img/network/device.png",
                color: "#C5000B" // red
            }
        }
    };
    network = new vis.Network(container, data, options);
    network.fit();
}
function drawTopology(nodes, edges) {
    // create a network
    $("#mynetwork").empty();
    var container = document.getElementById("mynetwork");
    var data = {
        nodes: nodes,
        edges: edges
    };
    var options = {
        nodes: {
            scaling: {
                min: 16,
                max: 32
            }
        },
        edges: {
            color: GRAY,
            smooth: false
        },
        physics: {
            hierarchicalRepulsion: {
                avoidOverlap: 1
            }
            //barnesHut: { gravitationalConstant: -30000 },
            //stabilization: { iterations: 2500 }
        },
        groups: {
            source: {
                shape: "dot",
                color: "#2B7CE9" // blue
            },
            sh: {
                shape: "image",
                image: "../img/network/homeIcon.png",
                color: "#2B7CE9" // blue
            },
            device: {
                shape: "image",
                image: "../img/network/device.png",
                color: "#C5000B" // red
            }
        },
        layout: {
            hierarchical: {
                direction: 'LR',
                sortMethod: "directed"
            }
        },
    };
    network = new vis.Network(container, data, options);
    network.fit();
}
function drawTopologyCluster(nodes, edges, parents) {
    // create a network
    //$("#mynetworkCluster").empty();
    //var container = document.getElementById("mynetworkCluster");
    $("#mynetwork").empty();
    var container = document.getElementById("mynetwork");
    var data = {
        nodes: nodes,
        edges: edges
    };
    var options = {
        nodes: {
            scaling: {
                min: 16,
                max: 32
            }
        },
        edges: {
            color: GRAY,
            smooth: false
        },
        physics: {
            hierarchicalRepulsion: {
                avoidOverlap: 1
            },
            barnesHut: { gravitationalConstant: -30000 },
            stabilization: { iterations: 2500 }
        },
        groups: {
            source: {
                shape: "dot",
                color: "#2B7CE9" // blue
            },
            sh: {
                shape: "image",
                image: "../img/network/homeIcon.png",
                color: "#2B7CE9" // blue
            },
            device: {
                shape: "image",
                image: "../img/network/device.png",
                color: "#C5000B" // red
            }
        },
        layout: {
            hierarchical: {
                enabled: true
                ,
                levelSeparation: 150,
                nodeSpacing: 100,
                treeSpacing: 200,
                blockShifting: true,
                edgeMinimization: true,
                parentCentralization: true,
                direction: 'UD',        // UD, DU, LR, RL
                sortMethod: 'hubsize',  // hubsize, directed
                shakeTowards: 'leaves'  // roots, leaves
            }
            /*
            hierarchical: {
                direction: 'LR',
                sortMethod: "directed"
            }
            */
        }

    };
    network = new vis.Network(container, data, options);
    network.fit();
    network.on("selectNode", function(params) {
        if (params.nodes.length == 1) {
            if (network.isCluster(params.nodes[0]) == true) {
                network.openCluster(params.nodes[0]);
            }
        }
    });
    function clusterByConnection() {
        network.setData(data);
        var clusterOptionsByData;
        parents.forEach(function(parent){
            clusterOptionsByData = {
                joinCondition: function (childOptions) {
                    return childOptions.parent == parent; // the color is fully defined in the node.
                },
                processProperties: function (clusterOptions, childNodes, childEdges) {
                    var totalMass = 0;
                    for (var i = 0; i < childNodes.length; i++) {
                        totalMass += childNodes[i].mass;
                    }
                    clusterOptions.mass = totalMass;
                    return clusterOptions;
                },
                clusterNodeProperties: {id: 'cluster:' + parent, borderWidth: 3, shape: 'database', label:parent}
            };
            network.cluster(clusterOptionsByData);
        });
    }
    //clusterByConnection();
}

function createData(cb){

    var data = {
        "name": "CyberTrust",
        "children": []
    }
    var sm_id = 0;
    var device_id = 0;
    var node;
    for(node=0; node <= 15; node++){
        var subnet = {
            name    : "192.168."+node+".XXX",
            IP      : "192.168."+node+".XXX",
            owner   : "CyberTrust",
            children :[]
        }
        var i;
        for(i=0; i <= 50; i++){
            sm_id++;
            var obj = {
                name : "SmartHome-"+sm_id,
                IP      : "192.168."+node+"."+i,
                owner   : "Owner of SOHO "+sm_id,
                children :[]
            }
            var j;
            for(j=0; j <= 7; j++){
                device_id++;
                var children = {
                    name : "Deviceg "+j+" of SOHO "+ sm_id,
                    IP      : "192.168."+node+"."+i+j+"",
                }
                obj['children'].push(children);
            }
            subnet['children'].push(obj);
        }
        data['children'].push(subnet);
    }
    cb(data);
}
function createTree(data, cb) {
    mem['tree'] = d3.tree().nodeSize([dx, dy]);
    var div = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

    mem['root'] = d3.hierarchy(data);

    mem['root'].x0 = dy / 2;
    mem['root'].y0 = 0;
    mem['root'].descendants().forEach(function(d, i){
        d.id = i;
        d._children = d.children;
        if (d.depth && d.data.name.length !== 7) d.children = null;
    });
    mem['zero'] =mem['root'];
    const svg = d3.create("svg")
        .attr("viewBox", [-margin.left, -margin.top, width, dx])
        .style("font", "10px sans-serif")
        .style("user-select", "none")
        .on("mouseover", function(d) {
        })
        .on("mouseout", function(d) {
        });

    mem['gLink'] = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5)
        ;

    mem['gNode'] = svg.append("g")
        .attr("cursor", "pointer")
        .attr("pointer-events", "all")
    ;

    mem['svg'] = svg;
    //update(root);
    cb(svg.node());
}
function update(source) {
    const duration = d3.event && d3.event.altKey ? 2500 : 250;
    const nodes = mem['root'].descendants().reverse();
    const links = mem['root'].links();

    // Compute the new tree layout.
    mem['tree'](mem['root']);

    var left = mem['root'];
    var right = mem['root'];
    mem['root'].eachBefore(function(node){
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
    });

    const height = right.x - left.x + margin.top + margin.bottom;

    const transition = mem['svg'].transition()
        .duration(duration)
        .attr("viewBox", [-margin.left, left.x - margin.top, width, height])
        .tween("resize", window.ResizeObserver ? null : () => () => mem['svg'].dispatch("toggle"));

    // Update the nodes…
    const node = mem['gNode'].selectAll("g")
        .data(nodes, d => d.id)
        .on("mouseover", function(d) {
            //console.log(d['data']); //!!!!! HERE
        })
        .on("mouseout", function(d) {
        });

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node.enter().append("g")
        .attr("transform", function(d){`translate(${source.y0},${source.x0})`})
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .on("click", function(d) {
            d.children = d.children ? null : d._children;
            update(d);
        });

    nodeEnter.append("circle")
        .attr("r", 2.5)
        .attr("fill", d => d._children ? "#555" : "#999")
        .attr("stroke-width", 10)

    nodeEnter.append("text")
        .attr("dy", "0.31em")
        //.attr("x", d => d._children ? -6 : 6)
        .attr("x",function(d){
            if(d['parent']){
                return 10
            }else{
                return -10
            }
        })
        //.attr("text-anchor", d => d._children ? "end" : "start")
        .attr("text-anchor",function(d){
            if(d['parent']){
                return "start"
            }else{
                return "end"
            }
        })
        .text(function(d) {
            if (d['_children']) {
                return d.data.name + "[" + d['_children'].length + "]";
            } else {
                return d.data.name;
            }
        })
        .clone(true).lower()
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .attr("stroke", "white");

    // Transition nodes to their new position.
    const nodeUpdate = node.merge(nodeEnter).transition(transition)
            .attr("transform", d => `translate(${d.y},${d.x})`)
            .attr("fill-opacity", 1)
            .attr("stroke-opacity", 1)
        ;

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node.exit().transition(transition).remove()
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);

    // Update the links…
    var link = mem['gLink'].selectAll("path")
        .data(links, d => d.target.id);

    // Enter any new links at the parent's previous position.
    const linkEnter = link.enter().append("path")
        .attr("d", function(d){
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
        });
    // Transition links to their new position.
    link.merge(linkEnter).transition(transition)
        .attr("d", diagonal);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition(transition).remove()
        .attr("d", function(d){
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
        });

    // Stash the old positions for transition.
    mem['root'].eachBefore(function(d){
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

function treeD(){
    //const Graph = ForceGraph3D({ controlType: 'fly' })
    const Graph = ForceGraphVR({ controlType: 'fly' })
        (document.getElementById('3d-graph'))
        .graphData(mem['networkData'])
        .nodeAutoColorBy('group')
        .linkDirectionalParticles("value")
        .linkDirectionalParticleSpeed(d => d.value * 0.001)
        .nodeLabel(function(node){
            if(node.IP){
                return`${node.id}: ${node.IP}`
            }else{
                return`${node.id}`
            }
        })
    ;
}