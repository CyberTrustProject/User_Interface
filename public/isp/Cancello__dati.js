/**
 * Created by simone on 10/09/18.
 */
var tabella =     '<table id = "tabellina" class="table table-hover">' +
    '<thead class="thead">' +
    '<tr>' +
    '<th scope="col">Date</th>' +
    '<th scope="col">Node</th>' +
    '</tr>' +
    '</thead>' +
    '<tbody>' +
    '<tr >' +
    '<th jmTable="id">2019/02/05 19:33</th>' +
    '<td jmTable="mac">192.168.43.122</td>' +
    '</tr>' +
    '<tr >' +
    '<th jmTable="id">2019/02/05 19:33</th>' +
    '<td jmTable="mac">192.168.43.122</td>' +
    '</tr>' +
    '<tr >' +
    '<th jmTable="id">2019/02/05 19:33</th>' +
    '<td jmTable="mac">192.168.43.122</td>' +
    '</tr>' +
    '<tr >' +
    '<th jmTable="id">2019/02/05 19:33</th>' +
    '<td jmTable="mac">192.168.43.122</td>' +
    '</tr>' +
    '<tr >' +
    '<th jmTable="id">2019/02/05 19:33</th>' +
    '<td jmTable="mac">192.168.43.122</td>' +
    '</tr>' +
    '</tbody>' +
    '</table>';

var tabellaDati = '<table class="table "><tbody><tr><td>Total Pages</td><td id="totalPages">182.906</td></tr><tr><td>Relevant Pages</td><td id=relevantPages">178.918</td></tr><tr><td>Irrelevant Pages</td><td id="irrelevantPages">3.988</td></tr><tr><td>Harvest Rate</td><td id="harvestRate">97.820%</td></tr></tbody></table>';
var config = {
    settings:{
        hasHeaders: true,
        constrainDragToContainer: true,
        reorderEnabled: true,
        selectionEnabled: false,
        popoutWholeStack: false,
        blockedPopoutsThrowError: true,
        closePopoutsOnUnload: true,
        showPopoutIcon: true,
        showMaximiseIcon: true,
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
                    componentName: 'widget',
                    cssClass: 'bg-primary',
                    componentState: { text: 'Component 1', id: 'card-chart1', label: 'A'},
                    title: 'Pending Downloads'
                },{
                    type: 'component',
                    componentName: 'widget',
                    cssClass: 'bg-info',
                    componentState: { text: 'Component 2', id: 'card-chart2', label: 'B'},
                    title: 'Running Handlers'
                },{
                    type: 'component',
                    componentName: 'widget',
                    cssClass: 'bg-warning',
                    componentState: { text: 'Component 3', id: 'card-chart3', label: 'C'},
                    title: 'Running Request'
                }
                ]
            },
            {
                type: 'row',
                content:[{
                    type: 'component',
                    componentName: 'widget',
                    //componentState: { text: '<img src="img/net_map.jpg" style="height:auto;width: 100%;"/>', id: 'netmap', label: 'E' },
                    componentState: { text: '<div/>', id: 'pippo', label: 'E' },
                    title: 'Net Map'
                },
                    {
                        type: 'component',
                        componentName: 'widget',
                        cssClass: 'bg',
                        componentState: { text: tabellaDati, id: 'tabellaDati', label: 'F'},
                        title: 'Page Relevance',
                    }]
            },
            {
                type: 'row',
                content:[
                    {
                        type: 'component',
                        componentName: 'widget',
                        cssClass: 'bg',
                        componentState: { text: tabella, id: 'timeline', label: 'F'},
                        title: 'Alerts'
                    },{
                        type: 'component',
                        componentName: 'widget',
                        cssClass: 'bg',
                        componentState: { text: 'Component 3', id: 'number1', label: 'I' },
                        title: 'Successfull Requests'
                    },{
                        type: 'component',
                        componentName: 'widget',
                        cssClass: 'bg',
                        componentState: { text: 'Component 11', id: 'number2', label: 'J' },
                        title: 'Failed Requests'
                    }
                ]
            }
        ]
    }]
};
function nodini(){
    var nodes = new vis.DataSet([
        {id: 1, label: 'node\none',     shape: 'dot', color:'#97C2FC', size:'20'}, //A
        {id: 2, label: 'node\ntwo',     shape: 'dot', color:'#97C2FC', size:'10'}, //B
        {id: 3, label: 'node\nthree',   shape: 'dot', color:'#97C2FC', size:'10'},
        {id: 4, label: 'node\nfour',    shape: 'dot', color:'#97C2FC', size:'10'},
        {id: 5, label: 'node\nfive',    shape: 'dot', color:'#97C2FC', size:'10'},
        {id: 6, label: 'node\nsix',     shape: 'dot', color:'#97C2FC', size:'10'},
        {id: 7, label: 'node\nseven',   shape: 'dot', color:'#97C2FC', size:'10'},
        {id: 8, label: 'node\neight',   shape: 'dot', color:'#97C2FC', size:'10'}
    ]);
// create an array with edges
    var edges = new vis.DataSet([
        {from: 1, to: 8, color:{color:'#ffffff'}},
        {from: 1, to: 3, color:{color:'#ffffff'}},
        {from: 1, to: 2, color:{color:'#ffffff'}},
        {from: 2, to: 4, color:{color:'#ffffff'}},
        {from: 2, to: 5, color:{color:'#ffffff'}},
        {from: 5, to: 6, color:{color:'#ffffff'}},
        {from: 6, to: 7, color:{color:'#ffffff'}},
        {from: 6, to: 8, color:{color:'#ffffff'}},
    ]);
    var data = {
        nodes: nodes,
        edges: edges
    };
    var options = {
        nodes: {
            shape: 'circle'
        }
    };
    // create a network
    var container = document.getElementById('pippo');
    var network = new vis.Network(container, data, options);
}
function magia(){
    mem['dati1'] ={
        type: 'line',
        data: {
            labels: ['-5 sec', '-4 sec', '-3 sec', '-2 sec', '-1 sec', 'Now'],
            datasets: [{
                label: '',
                //backgroundColor: getStyle('--primary'),
                borderColor: 'rgba(255,255,255,.55)',
                data: [0,0,0,0,0,0]
            }]
        },
        options: {
            maintainAspectRatio: false,
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        color: 'transparent',
                        zeroLineColor: 'transparent'
                    },
                    ticks: {
                        fontSize: 2,
                        fontColor: 'transparent'
                    }
                }],
                yAxes: [{
                    display: false,
                    ticks: {
                        //display: false,
                        min: 0,
                        //max: 105
                    }
                }]
            },
            elements: {
                line: {
                    tension: 0.00001,
                    borderWidth: 1
                },
                point: {
                    radius: 4,
                    hitRadius: 10,
                    hoverRadius: 4
                }
            }
        }
    };
    mem['dati2'] ={
        type: 'line',
        data: {
            labels: ['-5 sec', '-4 sec', '-3 sec', '-2 sec', '-1 sec', 'Now'],
            datasets: [{
                label: '',
                borderColor: 'rgba(255,255,255,.55)',
                data: [0,0,0,0,0,0]
            }]
        },
        options: {
            maintainAspectRatio: false,
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        color: 'transparent',
                        zeroLineColor: 'transparent'
                    },
                    ticks: {
                        fontSize: 2,
                        fontColor: 'transparent'
                    }
                }],
                yAxes: [{
                    display: false,
                    ticks: {
                        display: false,
                        min: 0,
                        //max: 10
                    }
                }]
            },
            elements: {
                line: {
                    tension: 0.00001,
                    borderWidth: 1
                },
                point: {
                    radius: 4,
                    hitRadius: 10,
                    hoverRadius: 4
                }
            }
        }
    }; // eslint-disable-next-line no-unused-vars
    mem['dati3'] ={
        type: 'line',
        data: {
            labels: ['-5 sec', '-4 sec', '-3 sec', '-2 sec', '-1 sec', 'Now'],
            datasets: [{
                label: '',
                backgroundColor: 'rgba(255,255,255,.2)',
                borderColor: 'rgba(255,255,255,.55)',
                data: [0,0,0,0,0,0]
            }]
        },
        options: {
            maintainAspectRatio: false,
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    gridLines: {
                        color: 'transparent',
                        zeroLineColor: 'transparent'
                    },
                    ticks: {
                        fontSize: 2,
                        fontColor: 'transparent'
                    }
                }],
                yAxes: [{
                    display: false,
                    ticks: {
                        display: false,
                        min: 0,
                        max: 20
                    }
                }]
            },
            elements: {
                line: {
                    tension: 0.00001,
                    borderWidth: 2
                },
                point: {
                    radius: 0,
                    hitRadius: 10,
                    hoverRadius: 4
                }
            }
        }
    }; // eslint-disable-next-line no-unused-vars

    var cardChart1  = new Chart($('#card-chart1 canvas'), mem['dati1']);

//    var cardChart2  = new Chart($('#card-chart2 canvas'), mem['dati2']);
//    var cardChart3  = new Chart($('#card-chart3 canvas'), mem['dati3']);

    var ev1 = new EventSource('/EM.dataFlowPacket');
    ev1.addEventListener('time', function (result) {
        aggiornaGrafico(1, result.data);
    });
    var ev2 = new EventSource('/EM.dataFlowUser');
    ev2.addEventListener('time', function (result) {
        aggiornaGrafico(2, result.data);
    });
    var ev3 = new EventSource('/EM.dataFlowAccess');
    ev3.addEventListener('time', function (result) {
        aggiornaGrafico(3, result.data);
    });
}
var aggiornaGrafico = function(label, valore){
    mem['dati'+label]['data']['datasets'][0]['data'].shift();
    mem['dati'+label]['data']['datasets'][0]['data'].push(valore);
    var cardChart  = new Chart($('#card-chart'+label+' canvas'), mem['dati'+label]);

};
var rete = function(){
    var nodes = new vis.DataSet([
        {id: 1, label: 'a',     shape: 'diamond', color:'#97C2FC', size:'20'}, //Nodo_primo_livello

        {id: 2, label: 'a',     shape: 'triangle', color:'#97C2FC', size:'20'}, //Nodo_secondo_livello
        {id: 3, label: 'a',     shape: 'triangle', color:'#97C2FC', size:'20'}, //Nodo_secondo_livello

        {id: 4, label: 'a',     shape: 'dot', color:'#97C2FC', size:'20'}, //Nodo_terzo_livello
        {id: 5, label: 'a',     shape: 'dot', color:'#97C2FC', size:'20'}, //Nodo_terzo_livello
        {id: 6, label: 'a',     shape: 'dot', color:'#97C2FC', size:'20'}, //Nodo_terzo_livello
        {id: 7, label: 'a',     shape: 'dot', color:'#97C2FC', size:'20'}, //Nodo_terzo_livello
        {id: 8, label: 'a',     shape: 'dot', color:'#97C2FC', size:'20'}, //Nodo_terzo_livello

        {id: 9, label: 'a',     shape: 'dot', color:'#97C2FC', size:'10'}, //Terminali
        {id: 10, label: 'a',     shape: 'dot', color:'#97C2FC', size:'10'}, //Terminali
        {id: 11, label: 'a',     shape: 'dot', color:'#97C2FC', size:'10'}, //Terminali
        {id: 12, label: 'a',     shape: 'dot', color:'#97C2FC', size:'10'}, //Terminali
        {id: 13, label: 'a',     shape: 'dot', color:'#97C2FC', size:'10'}, //Terminali
        {id: 14, label: 'a',     shape: 'dot', color:'#97C2FC', size:'10'}, //Terminali
        {id: 15, label: 'a',     shape: 'dot', color:'#97C2FC', size:'10'}, //Terminali
        {id: 16, label: 'a',     shape: 'dot', color:'#97C2FC', size:'10'}, //Terminali
        {id: 17, label: 'a',     shape: 'dot', color:'#97C2FC', size:'10'}, //Terminali
        {id: 18, label: 'a',     shape: 'dot', color:'#97C2FC', size:'10'}, //Terminali
        {id: 19, label: 'a',     shape: 'dot', color:'#97C2FC', size:'10'}, //Terminali
        {id: 20, label: 'a',     shape: 'dot', color:'#97C2FC', size:'10'}, //Terminali
        {id: 21, label: 'a',     shape: 'dot', color:'#97C2FC', size:'10'}, //Terminali
        {id: 22, label: 'a',     shape: 'dot', color:'#97C2FC', size:'10'}, //Terminali
        {id: 23, label: 'a',     shape: 'dot', color:'#97C2FC', size:'10'}, //Terminali
        {id: 24, label: 'a',     shape: 'dot', color:'#97C2FC', size:'10'}, //Terminali
    ]);
    var edges = new vis.DataSet([
        {from: 1, to: 2, color:{color:'black'}},
        {from: 1, to: 3, color:{color:'black'}},

        {from: 2, to: 4, color:{color:'black'}},
        {from: 2, to: 5, color:{color:'black'}},
        {from: 2, to: 6, color:{color:'black'}},

        {from: 3, to: 7, color:{color:'black'}},
        {from: 3, to: 8, color:{color:'black'}},

        {from: 4, to: 9, color:{color:'black'}},
        {from: 4, to: 10, color:{color:'black'}},
        {from: 4, to: 11, color:{color:'black'}},

        {from: 5, to: 12, color:{color:'black'}},
        {from: 5, to: 13, color:{color:'black'}},

        {from: 6, to: 14, color:{color:'black'}},
        {from: 6, to: 15, color:{color:'black'}},

        {from: 7, to: 16, color:{color:'black'}},
        {from: 7, to: 17, color:{color:'black'}},

        {from: 8, to: 18, color:{color:'black'}},
        {from: 8, to: 19, color:{color:'black'}},
        {from: 8, to: 20, color:{color:'black'}},
        {from: 8, to: 21, color:{color:'black'}},
        {from: 8, to: 22, color:{color:'black'}},
        {from: 8, to: 23, color:{color:'black'}},
        {from: 8, to: 24, color:{color:'black'}},

    ]);

    var data = {
        nodes: nodes,
        edges: edges
    };
    var options = {
        nodes: {
            shape: 'circle'
        }
    };
    // create a network
    var container = document.getElementById('pippo');
    var network = new vis.Network(container, data, options);
}