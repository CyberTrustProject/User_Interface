/**
 * Created by simone on 08/05/19.
 */
var mem = {};
if(window.sessionStorage.getItem('offlineData')){
    mem['data'] = JSON.parse(window.sessionStorage.getItem('offlineData'));
}
if(window.sessionStorage.getItem('userdata')){
    mem['userData'] = JSON.parse(window.sessionStorage.getItem('userdata'));
}
if(window.sessionStorage.getItem('ownerTab')){
    mem['tab'] = window.sessionStorage.getItem('ownerTab');
}else{
    mem['tab'] = 'devices';
}
$(document).ready(function() {
    loadTabelle();
    tabGes(mem['tab']);

    $("[navtab]").click(function(){
        window.sessionStorage.setItem('ownerTab', $(this).attr('navtab'));
        mem['tab'] = $(this).attr('navtab');
    });
    $("[jmRefresh]").click(function(){
        loadTabelle($(this).attr("jmRefresh"));
    });
});
function tabGes(kind){
    $("[navtab]").each(function(){
        if ($(this).attr('navtab') == kind){
            $(this).attr('class', 'active show');
        }else{
            $(this).attr('class', '');
        }
    });
    $("[bodytab]").each(function(){
        if ($(this).attr('bodytab') == kind){
            $(this).attr('class', 'tab-pane fade in active show');
        }else{
            $(this).attr('class', 'tab-pane fade in');
        }
    });
}
function loadTabelle(tabella){
    if(tabella == 'devices' || !tabella){
        var userId = '';
        if(mem['userData']['_id']){
            userId = mem['userData']['_id'];
        }
        $("#devicesTable").dataTable().fnDestroy()
        $('#devicesTable').DataTable( {
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
            "ajax": HOST+"/EM.getDeviceList",
            "type": "POST",
            "columns": [
                { "data": "description" },
                { "data": "type" },
                { "data": "userid" },
                { "data": "device_info.OS.os_name" },
                { "data": "device_info.manufacturer" },
                { "data": "device_info.model" }
            ],
            "initComplete": function(data){
                $('#devicesTable').on('click', 'tbody tr', function () {
                    var row = $('#devicesTable').DataTable().row($(this)).data();
                    fillData('devices', row);
                    displayGes('devices', 'showData')
                });
            }
        });
    }
    if(tabella == 'alerts' || !tabella) {
        $("#alertsTable").dataTable().fnDestroy()
        $('#alertsTable').DataTable( {
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
            "ajax": HOST+"/EM.getAlertList",
            "data": {
                userId: userId
            },
            "columns": [
                { "data": "deviceID" },
                { "data": "deviceType" },
                { "data": "metadata.cpu_usage" },
                { "data": "metadata.mem_usage" },
                { "data": "_insertedTimestamp" }
            ],
            "initComplete": function(data){
                $('#alertsTable').on('click', 'tbody tr', function () {
                    var row = $('#alertsTable').DataTable().row($(this)).data();
                    fillData('alerts', row);
                    displayGes('alerts', 'showData')
                });
            }
        });
    }
}