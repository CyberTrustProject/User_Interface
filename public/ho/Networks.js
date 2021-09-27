/**
 * Created by simone on 07/05/20.
 */
function armNetwork(){
    getNetworkData(function(network){
        setTimeout(function(event){
            network.fit()//;network.redraw();
        }, 1200)
    });
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
function getNetworkData(){
    //$.post(HOST+"/PS.getSmartHomeList", {'owner':mem['userData']['_id']}, function(SOHOdata){
    $.post(HOST+"/PS.getSmartHomeList", {'owner':'5ecd13ef6ec17b063a8f9802'}, function(SOHOdata){
        if(SOHOdata.err){
            alert("We encouter an internal error")
        }else{
            if(SOHOdata['data'][0]){
                var data = SOHOdata['data'][0];
                //Impact analysis
                var dataImpact = data['config']['irg']['hosts'];
                var impact = {};
                var colorMap = {
                    'Negligible'    : '#48cf2d',
                    'Minor'         : '#18eda6',
                    'Normal'        : '#1871ed',
                    'Severe'        : '#ed9118',
                    'Catastrophic'  : '#ed1818'
                }
                dataImpact.forEach(function(host){
                    impact[host['name']] = host['impact']
                })

                //Topology refinement
                var dataTopology = data['json_topology']['machine'];
                var nodes = [];
                var edges = [];

                dataTopology.forEach(function(machine){
                    machineClassifier(machine,function(machine){
                        machine['type'] = "device";
                        if(machine['interfaces']['interface']['ipaddress'] == '192.168.0.1'){
                            machine['type'] = "gateway";
                        }
                        var group = 'host';
                        if(machine['name']) {
                            if (/^pfsense./i.test(machine['name'])) {
                                group = 'pfsense';
                            }
                        }
                        var node = {
                            id      : machine['interfaces']['interface']['ipaddress'],
                            name    : machine['name'],
                            label   : machine['interfaces']['interface']['ipaddress'],
                            impact  : impact[machine['name']],
                            ip      : machine['interfaces']['interface']['ipaddress'],
                            internet: machine['interfaces']['interface']['directly-connected']['internet'],
                            group   : group,
                            color   : colorMap[impact[machine['name']]]
                        }

                        nodes.push(node);
                        if( Object.prototype.toString.call(machine['interfaces']['interface']['directly-connected']['ipaddress']) === '[object Array]' ) {
                            machine['interfaces']['interface']['directly-connected']['ipaddress'].forEach(function(ip){
                                var edge = {
                                    from : machine['interfaces']['interface']['ipaddress'],
                                    to: ip,
                                    length: LENGTH_SUB, width: WIDTH_SCALE
                                }
                                edges.push(edge);
                            })
                        }else{
                            var edge = {
                                from    : machine['interfaces']['interface']['ipaddress'],
                                to      : machine['interfaces']['interface']['directly-connected']['ipaddress'],
                                length: LENGTH_SUB, width: WIDTH_SCALE
                            }
                            edges.push(edge);
                        }
                    })
                })

                mem['network_nodes'] = nodes;
                mem['network_edges'] = edges;
                drawNetwork(function(network){
                    setTimeout(function(event){
                        network.fit()//;network.redraw();
                    }, 1200)
                });
            }
        }
    }, 'json');

}
function drawNetwork(cb) {
    nodes = nodePositioner(mem['network_nodes']);
    edges = mem['network_edges'];
    // create a network
    var container = document.getElementById("mynetwork");
    var data = {
        nodes: nodes,
        edges: edges
    };
    var options = {
        autoResize: true,
        height: '100%',
        width: '100%',
        nodes: {
            shape: 'dot',
            size: 20,
            font: {
                size: 15,
            },
            borderWidth: 2,
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
            barnesHut: { gravitationalConstant: -10 },
            stabilization: { iterations: 0 },
            "enabled": false
        },
        groups: {
            pfsense: {
                shape: "image",
                image: "../images/pfSense.png",
                color: "#2B7CE9" // blue
            },
            gateway: {
                shape: "image",
                image: "../images/pfSense.png",
                color: "#2B7CE9" // blue
            },
            mobile: {
                shape: "image",
                image: "../images/mobile.png",
                color: "#2B7CE9" // blue
            },
            laptop: {
                shape: "image",
                image: "../images/laptop.png",
                color: "#2B7CE9" // blue
            },
            _device: {
                shape: "image",
                image: "../images/.png",
                color: "#2B7CE9" // blue
            }
        }
    };
    var network =  new vis.Network(container, data, options);

    network.on("selectNode", function(params) {
        console.log(params['nodes'][0])
    });
    cb(network);
}
function nodePositioner(nodes){
    var orderedNodes = [];
    var radius = 100+(20*nodes.length);
    var d = 2 * Math.PI / nodes.length;// Angular pitch
    nodes.forEach(function(nodo, i) {
        nodo['x'] = radius * Math.cos(d * i);
        nodo['y'] = radius * Math.sin(d * i);
        orderedNodes.push(nodo);
    })
    return orderedNodes;
}
function machineClassifier(machine, cb){
    var deviceClass = 'device';
    console.log(machine);
    if(machine['interfaces']['interface']['ipAddress']){
        if(machine['interfaces']['interface']['ipAddress'] === '192.168.0.1'){
            deviceClass = 'Router';
        }else if (machine['cpe']){
            deviceClass = machine['cpe'];
        }
    }
    console.log(deviceClass);
    cb(machine)
}