function displayTime() {
    var time = moment().format('ddd, MMM Do YYYY, HH:mm:ss');
    $('#clock').html(time);
    setTimeout(displayTime, 1000);
}

$(document).ready(function() {
    displayTime();
    $("#pinned").click(function () {

        var txt = '<div class="card text-white bg-danger pinned"><div class="card-body pb-0"><div class="btn-group float-right"><span class="card-header-action btn-pin" id="pinned"><i class="icon-pin"></i></span><span class="card-header-action btn-eyeglass"><i class="icon-eyeglass"></i></span><span class="card-header-action btn-close"><i class="icon-close"></i></span></div><div class="text-value">55</div><div>Sensors in error</div></div><div class="chart-wrapper mt-3 mx-3" style="height:70px;"><canvas class="chart" id="card-chart4" height="70"></canvas></div></div>';

        $( "body" ).addClass( "aside-menu-lg-show" );
        $("#pin_panel").prepend(txt);


    });
    $("#deleted").click(function () {

        $(".aside-menu .pinned").remove();

    });
    /* Golden Layout */
    // random Numbers
    var random = function random() {
        return Math.round(Math.random() * 100);
    }; // eslint-disable-next-line no-unused-vars
    $(".lm_content#card-chart1").html( '<h5>Packet-Transmission</h5><canvas></canvas>');
    $(".lm_content#card-chart2").html( '<h5>Users Online</h5><canvas></canvas>');
    $(".lm_content#card-chart3").html( '<h5>Access Log</h5><canvas></canvas>');
    $(".lm_content#card-chart4").html( '<h5>Error</h5><canvas></canvas>');
    $(".lm_content#canvas-2").html( '<canvas></canvas>');
    $(".lm_content#canvas-4").html( '<canvas></canvas>');
    $(".lm_content#number1").html( '<div class="number-wrapper"><span class="num">1,2</span> <span class="cifra">miln</span><i class="icon-fre-up"></i></div>');
    $(".lm_content#number2").html( '<div class="number-wrapper"><span class="num">123,23</span><i class="icon-fre-down"></i></div>');
    /*var cardChart1 = new Chart($('#card-chart1 canvas'), {
        type: 'line',
        data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                label: 'My First111111dataset',
                backgroundColor: getStyle('--primary'),
                borderColor: 'rgba(255,255,255,.55)',
                data: [65, 59, 84, 84, 51, 55, 40]
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
                        min: 35,
                        max: 89
                    }
                }]
            },
            elements: {
                line: {
                    borderWidth: 1
                },
                point: {
                    radius: 4,
                    hitRadius: 10,
                    hoverRadius: 4
                }
            }
        }
    }); // eslint-disable-next-line no-unused-vars
    var cardChart2 = new Chart($('#card-chart2 canvas'), {
        type: 'line',
        data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                label: 'My First dataset',
                backgroundColor: getStyle('--info'),
                borderColor: 'rgba(255,255,255,.55)',
                data: [1, 18, 9, 17, 34, 22, 11]
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
                        min: -4,
                        max: 39
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
    }); // eslint-disable-next-line no-unused-vars
    var cardChart3 = new Chart($('#card-chart3 canvas'), {
        type: 'line',
        data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                label: 'My First dataset',
                backgroundColor: 'rgba(255,255,255,.2)',
                borderColor: 'rgba(255,255,255,.55)',
                data: [78, 81, 80, 45, 34, 12, 40]
            }]
        },
        options: {
            maintainAspectRatio: false,
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    display: false
                }],
                yAxes: [{
                    display: false
                }]
            },
            elements: {
                line: {
                    borderWidth: 2
                },
                point: {
                    radius: 0,
                    hitRadius: 10,
                    hoverRadius: 4
                }
            }
        }
    }); // eslint-disable-next-line no-unused-vars
    var cardChart4 = new Chart($('#card-chart4 canvas'), {
        type: 'bar',
        data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April'],
            datasets: [{
                label: 'My First dataset',
                backgroundColor: 'rgba(255,255,255,.2)',
                borderColor: 'rgba(255,255,255,.55)',
                data: [78, 81, 80, 45, 34, 12, 40, 85, 65, 23, 12, 98, 34, 84, 67, 82]
            }]
        },
        options: {
            maintainAspectRatio: false,
            legend: {
                display: false
            },
            scales: {
                xAxes: [{
                    display: false,
                    barPercentage: 0.6
                }],
                yAxes: [{
                    display: false
                }]
            }
        }
    }); // eslint-disable-next-line no-unused-vars
    */
    var barChart = new Chart($('#canvas-2 canvas'), {
        type: 'bar',
        data: {
            labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
            datasets: [{
                backgroundColor: 'rgba(220, 220, 220, 0.5)',
                borderColor: 'rgba(220, 220, 220, 0.8)',
                highlightFill: 'rgba(220, 220, 220, 0.75)',
                highlightStroke: 'rgba(220, 220, 220, 1)',
                data: [random(), random(), random(), random(), random(), random(), random()]
            }, {
                backgroundColor: 'rgba(151, 187, 205, 0.5)',
                borderColor: 'rgba(151, 187, 205, 0.8)',
                highlightFill: 'rgba(151, 187, 205, 0.75)',
                highlightStroke: 'rgba(151, 187, 205, 1)',
                data: [random(), random(), random(), random(), random(), random(), random()]
            }]
        },
        options: {
            responsive: true,
            legend: {
                display:false
            }
        }
    }); // eslint-disable-next-line no-unused-vars
    var radarChart = new Chart($('#canvas-4 canvas'), {
        type: 'radar',
        data: {
            labels: ['Time', 'Effort', 'Persons', 'Hardware', 'Software', 'N Elements', 'Failure'],
            datasets: [{
                label: '',
                backgroundColor: 'rgba(220, 220, 220, 0.2)',
                borderColor: 'rgba(220, 220, 220, 1)',
                pointBackgroundColor: 'rgba(220, 220, 220, 1)',
                pointBorderColor: '#fff',
                pointHighlightFill: '#fff',
                pointHighlightStroke: 'rgba(220, 220, 220, 1)',
                data: [65, 59, 90, 81, 56, 55, 40]
            }, {
                label: '',
                backgroundColor: 'rgba(151, 187, 205, 0.2)',
                borderColor: 'rgba(151, 187, 205, 1)',
                pointBackgroundColor: 'rgba(151, 187, 205, 1)',
                pointBorderColor: '#fff',
                pointHighlightFill: '#fff',
                pointHighlightStroke: 'rgba(151, 187, 205, 1)',
                data: [28, 48, 40, 19, 96, 27, 100]
            }]
        },
        options: {
            responsive: true,
            legend: {
                display:false
            }

        }
    }); // eslint-disable-next-line no-unused-vars
});
