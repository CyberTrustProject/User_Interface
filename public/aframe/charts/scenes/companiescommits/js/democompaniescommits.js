// Example (assuming there is "myscene" in HTML, to place the dashboard)
// Assume "lib" is either THREEDC ot aframdc
window.onload = function () {
    // initialization
    //getJSON call, draw meshes with data
    $.getJSON("../../data/scm-commits.json", function (data) {
        var json_data = data;
        init(json_data);
    });
    var init = function (json_data) {
        var scenediv = document.getElementById("myscene");
        //var scenediv = document.querySelector("a-scene");
        // 1
        myDashboard = aframedc.dashboard(scenediv);
        // 2
        var mypiechart = aframedc.pieChart();
        var mypiechart2 = aframedc.pieChart();
        var mypiechart3 = aframedc.pieChart();

        var line        = aframedc.smoothCurveChart();

        var mybarchart1 = aframedc.barChart();
        var mybarchart2 = aframedc.barChart();
        var mybarchart3 = aframedc.barChart();
        var mybarchart4 = aframedc.barChart();

        // Common
        var parsed_data = [];
        json_data.values.forEach(function (value) {
            var record = {}
            json_data.names.forEach(function (name, index) {
                if (name == "date") {
                    var date = new Date(value[index] * 1000);
                    record[name] = date;
                    record.month = new Date(date.getFullYear(), date.getMonth(), 1);
                    record.hour = date.getUTCHours();
                } else {
                    record[name] = value[index];
                }
            });
            parsed_data.push(record);
        });
        cf = crossfilter(parsed_data);

        //assign orgs with a color.
        var COLORS = [
    "#00876c",
    "#3d9c73",
    "#63b179",
    "#88c580",
    "#aed987",
    "#d6ec91",
    "#ffff9d",
    "#fee17e",
    "#fcc267",
    "#f7a258",
    "#ef8250",
    "#e4604e",
    "#d43d51"
        ]
        var COLORI = [
            "blue",
            "red",
            "pink",
            "green","yellow"
        ]

        //create a dimension by month
        var dimByMonth = cf.dimension(function (p) { return p.month; });
        var groupByMonth = dimByMonth.group();
        var month = groupByMonth.top(Infinity);
        var monthColors = month.map(function (a, index) {
            return { key: a.key, value: COLORS[index % COLORS.length] };
        });
        console.log(month);
        //create a dimension by org
        var dimByOrg = cf.dimension(function (p) { return p.org; });
        var groupByOrg = dimByOrg.group().reduceCount();

        //create a dimension by auth
        var dimByAuth = cf.dimension(function (p) { return p.author; });
        var groupByAuth = dimByAuth.group().reduceCount();

        mypiechart.dimension(dimByOrg).group(groupByOrg).radius(2.5).setTitle("AAAAA").addEventListener("click", function (ev) {
            console.log(ev);
        });
        var coordPieChart = { x: 0, y: -10, z: 0 };
        myDashboard.addChart(mypiechart, coordPieChart);
        mypiechart2.dimension(dimByMonth).group(groupByMonth).radius(2.5).setTitle("BBBB").color(monthColors);
        var coordPieChart2 = { x: 10, y: -10, z: 0 };
        myDashboard.addChart(mypiechart2, coordPieChart2);
        mypiechart3.dimension(dimByAuth).group(groupByAuth).radius(2.5).setTitle("CCCCC");
        var coordPieChart3 = { x: 20, y: -10, z: 0 };
        myDashboard.addChart(mypiechart3, coordPieChart3);
        mybarchart1
            .dimension(dimByMonth)
            .color(COLORI)
            .group(groupByMonth)
            .width(30).height(10)
            .gridsOn(true)
            .setTitle("Data by Month")
            .setAttribute("rotation", { x: 0, y: 30, z: 0 })
            ;
        var coordBarChart1 = { x: -30, y: 0, z: 0 };
        myDashboard.addChart(mybarchart1, coordBarChart1);
        mybarchart2.dimension(dimByAuth).group(groupByAuth).width(30).height(10).gridsOn(true).setTitle("Data by Auth");
        var coordBarChart2 = { x: 5, y: 0, z: 0 };
        myDashboard.addChart(mybarchart2, coordBarChart2);
        mybarchart3.dimension(dimByOrg).group(groupByOrg).width(30).height(10).gridsOn(true).setTitle("Data bt Org").setAttribute("rotation", { x: 0, y: -30, z: 0 });
        var coordBarChart3 = { x: 45, y: 0, z: 0 };
        myDashboard.addChart(mybarchart3, coordBarChart3);

        /*
        $.getJSON("../../data/scm-commits-filtered.json", function (data) {
            line.dimension(data).setTitle("DDDDD");
            console.log(data);
            var coordline = { x: 20, y: 10, z: 0 };
            myDashboard.addChart(line, coordline);
        });
        */
        //mybarchart.dimension(dimByMonth).group(groupByMonth).width(30).gridsOn(true) ;
        //var coordBarChart = { x: 0, y: 0, z: 0 };
        //myDashboard.addChart(mypiechart, coordPieChart);
        //myDashboard.addChart(mybarchart, coordBarChart);

        var camera = document.querySelector("[camera]");
        camera.setAttribute("position", { x: 11.21 , y: 0, z: 16.57});
    }
}