var mem = {};
if(window.sessionStorage.getItem('userdata')){
    mem['userData'] = JSON.parse(window.sessionStorage.getItem('userdata'));
}
$(document).ready(function(){
    arm();
    displayGes();
    navigationAction();
    Action('ca','tabCases');
    loadTabelle();
    ///*crawlerGL();*/
});
//Dom elements "Arm" Function
function arm(){
    $("#case_lpsd").datetimepicker({
        format:'Y/m/d H:i:00',
        formatDate:'Y/m/d',
        formatTime:'H:i:00',
        onShow:function( ct ){
            this.setOptions({
                maxDate:jQuery('#case_rdd').val()?jQuery('#case_rdd').val():false
            })
        },
        timepicker:true,
    });
    $("#case_rdd").datetimepicker({
        format:'Y/m/d H:i:00',
        formatDate:'Y/m/d',
        formatTime:'H:i:00',
        onShow:function( ct ){
            this.setOptions({
                minDate:jQuery('#case_lpsd').val()?jQuery('#case_lpsd').val():false
            })
        },
        timepicker:true
    });
    $("#case_rdd").change(function(e){
        e.stopPropagation();
        console.log($(this).val())
    })

    $("[target]").click(function (event){
        navigationAction($(this).attr('target'));
    });
    $("[ps_target]").click(function (event){
        Action('ps',$(this).attr('ps_target'));
    });
    $("[cw_target]").click(function (event){
        Action('cw',$(this).attr('cw_target'));
    });
    $("[jmRefresh]").click(function(){
        loadTabelle($(this).attr("jmRefresh"));
    });
    $("[displayer]").click(function(){
        displayGes($(this).attr('displayLabel'),$(this).attr('displayMode'));
    });
    $("[natureOption]").click(function(event){
        $("#case_nature").val($(this).attr('natureOption'));
        $("#hidden_nature").val($(this).attr('natureOption'));
    });
    $("[legalProcessOption]").click(function(event){
        $("#case_legalProcess").val($(this).attr('legalProcessOption'));
        $("#hidden_legalProcess").val($(this).attr('legalProcessOption'));
    });
    $("[adder]").click(function(event){
        $("#todo").val("add");
        $("#"+$(this).attr('adder')+"FormSubmit").show();
    });
    $("#caseFormCancel").click(function(){
        loadTabelle('cases');
    });
    $("#case_reference_inputButton").click(function(event){
        if($("#case_reference_input").val()){
            var $obj = mem['liReference_clone'].clone(1,1);
            $obj.empty().append($("#case_reference_input").val());
            $("#referenceList").append($obj);
            updateReference();
            $("#case_reference_input").val('');
        }
    });
    $("#case_accounts_inputButton").click(function(event){
        if($("#case_accounts_input").val()){
            var $obj = mem['liAccount_clone'].clone(1,1);
            $obj.empty().append($("#case_accounts_input").val());
            $("#accountList").append($obj);
            updateAccount();
            $("#case_accounts_input").val('');
        }
    });
    //Form
    $("#addCaseForm").ajaxForm({
        enctype: 'multipart/form-data', type: 'post', dataType: 'json', url: HOST + '/LEA.caseAdd', iframe: false,
        beforeSubmit: function () {
            //$("#loading").show();
        },
        success: function (data) {
            //$("#loading").hide();
            if (data.err) {
                alert("Error during the update operation.\nSee: "+JSON.stringify(data.err));
                location.reload();
            } else {
                window.sessionStorage.setItem('caseId', data['caseId']);
                //displayGes('cases', 'show');
                formShow();
            }
        }
    });
    $("#caseFormSubmit").click(function(event){
        checkStatusField(function(response) {
            if(response) {
                $("#addCaseForm").submit();
            }
        });
    });
    $("#caseFormEdit").click(function(event){
        setToEdit('case');
    });
}
//
//Various//
function navigationAction(target){
    if(!target){ //Da ora in poi, con 1 si identifica l'userId del singolo utente.
                // è una soluzione provvisoria, appena possibile aggiunger il dato nella login
        if(window.localStorage.getItem('leaTargetData') && JSON.parse(window.localStorage.getItem('leaTargetData'))[1]){
            target = JSON.parse(window.localStorage.getItem('leaTargetData'))[1];
        }else{
            target = 'dashCases';
        }
    }
    var obj = {};
        obj[1] = target;
    window.localStorage.setItem('leaTargetData', JSON.stringify(obj));
    //Turn on/off the navigator button
    $("[target]").each(function(element){
        if($(this).attr('target') == target){
            $(this).addClass('active');
        }else{
            $(this).removeClass('active');
        }
    })
    //Show/hide the page
    $("[landing]").each(function(element){
        if($(this).attr('landing') == target){
            $(this).show();
        }else{
            $(this).hide();
        }
    })
    //crawlerGL()
}
function Action(mode, target){
    var obj = {};
    obj[1] = target;
    //Turn on/off the navigator button
    $("["+mode+"_target]").each(function(element){
        if($(this).attr(mode+'_target') == target){
            $(this).addClass('active');
        }else{
            $(this).removeClass('active');
        }
    });
    //Show/hide the page
    $("["+mode+"_landing]").each(function(element){
        if($(this).attr(mode+'_landing') == target){
            $(this).show();
        }else{
            $(this).hide();
        }
    });
    //crawlerGL();
}
function loadTabelle(tabella){
    if(tabella == 'cases' || !tabella){
        $("#casesTable").dataTable().fnDestroy();
        mem['tabCases'] = $('#casesTable').DataTable( {
            dom: 'Btfrtip',
            buttons:  [
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
            "ajax": {
                url: HOST+"/LEA.caseList",
                type: "POST",
                "dataSrc": function(data) {
                    if (!data['data'] || !data['data'].length) {
                        return [];
                    } else {
                        return data.data;
                    }
                },
                processing:true
            },
            "columns": [
                { "data": "case_number" },
                { "data": "case_nature" },
                { "data": "status" },
                { "data": "lps_date" },
                { "data": "rd_date" }
            ],
            "initComplete": function(data){
                $('#casesTable').on('click', 'tbody tr td', function () {
                    if(mem['menuOpened']){delete mem['menuOpened'];}
                    mem['rowSelected'] = mem['tabCases'].row($(this)).data();
                    openMenu(mem['tabCases'].row($(this)).data());
                });
                $('#casesTable_wrapper').attr('style','width:100%;')
            }
        });
    }
}
function displayGes(label, mode){
    if(!label && !mode){
        $("[mode]").each(function(element){
            if($(this).attr('mode') == 'list'){
                $(this).show();
            }else{
                $(this).hide();
            }
        });
        bcReset('list');
        formReset();
    }else{
        $("[label="+label+"]").each(function(element){
            if($(this).attr('mode') == mode){
                $(this).show();
            }else{
                $(this).hide();
            }
        });
        if(mode == 'form'){
            formAdd();
        }
        bcReset(mode);
        formReset();
    }
    //crawlerGL();
}
function bcReset(mode){
    if(mode == 'list'){
        $("[bcAppend]").each(function(element){
            $(this).remove();
        })
    }
}
function formReset(){
    $("form").each(function(element){
       $(this).resetForm();
    });
    $("[disabled]").each(function(element){
        $(this).prop('disabled', false);
    })
    $("[toDisabled]").each(function (element) {
        $(this).prop('disabled',true);
    });
    if(!mem['liAccount_clone']){
        mem['liAccount_clone'] = $("[jmli=account]").clone(1,1);
    }
    $("#accountList").empty();
    if(!mem['liReference_clone']){
        mem['liReference_clone'] = $("[jmli=reference]").clone(1,1);
        $("#referenceList").empty();
    }
    $("#referenceList").empty();
}
function formShow(){
    $("[formShow=toDisable]").each(function(element) {
        $(this).prop('disabled',true);
    });
    $("[formShow=toHide]").each(function(element) {
        $(this).hide();
    });
    $("[formShow=toShow]").each(function(element) {
        $(this).show();
    });
}
function formAdd(){
    $("[formAdd=toDisable]").each(function(element) {
        $(this).prop('disabled',true);
    });
    $("[formAdd=toHide]").each(function(element) {
        $(this).hide();
    });
    $("[formAdd=toShow]").each(function(element) {
        $(this).show();
    });
}
function fillData(target, id){
    if(target == 'cases'){
        displayGes('cases', 'form');
        var data = id;
        //Add Breadcrumb
        $("#breadcrumbCases").append($('<li bcAppend class="active"><a href="javascript:void(0);">'+data['case_number']+' | '+data['legal_process']+'</a></li>'));
        //Clear Data
        $("#addCaseForm").trigger('reset');
        //Fill in user data
        $("#case_icrn").val(data['case_number']).prop('disabled', true);
        $("#case_legalProcess").val(data['legal_process']).prop('disabled', true);
        $("#hidden_legalProcess").val(data['legal_process']);
        $("#case_nature").val(data['case_nature']).prop('disabled', true);
        $("#hidden_nature").val(data['case_nature']);
        $("#case_lpsd").val(data['lps_date']).prop('disabled', true);
        $("#case_rdd").val(data['rd_date']).prop('disabled', true);
        if(data['reference']){
            $("#referenceList").empty();
            var refs = data['reference'].split(", ");
            if(refs.length){
                $("#hidden_references").val(JSON.stringify(refs));
                refs.forEach(function(ref){
                    var $obj = mem['liReference_clone'].clone(1,1);
                    $obj.empty().append(ref);
                    $("#referenceList").append($obj);
                })
            }
        }
        if(data['accounts']){
            $("#accountList").empty();
            var refs = data['accounts'].split(",");
            if(refs.length){
                $("#hidden_accounts").val(JSON.stringify(refs));
                refs.forEach(function(ref){
                    if(ref && ref != ''){
                        var $obj = mem['liAccount_clone'].clone(1,1);
                        $obj.empty().append(ref);
                        $("#accountList").append($obj);
                    }
                })
            }
        }
        $("#caseFormSubmit").hide();
        $("#case_id").val(data['case_id']);
    }
    formShow();
}
function updateAccount(){
    var accounts = [];
    $("[jmli=account]").each(function(element){
        accounts.push($(this).html());
    })
    $("#hidden_accounts").val(JSON.stringify(accounts));
}
function updateReference(){
    var reference = [];
    $("[jmli=reference]").each(function(element){
        reference.push($(this).html());
    })
    $("#hidden_references").val(JSON.stringify(reference));
}
function checkStatusField(cb){
    var text = [];
    var valid = true;
    if(!$("#case_icrn").val()){
        valid = false;
        text.push("- insert a valid Internal case reference number")
    }
    if(!$("#case_legalProcess").val()){
        valid = false;
        text.push("- select a legal process for the case")
    }
    if(!$("#case_nature").val()){
        valid = false;
        text.push("- select the nature of the case ")
    }
    if(!$("#case_lpsd").val() || !$("#case_rdd").val() ){
        valid = false;
        text.push("- chech the date of validity for the case")
    }
    if(!valid){
        alert("Please check the case field: \n\n" + text.join("\n"));
    }
    cb(valid);
}
function openMenu(dati){
    if(dati['case_id']){
        mem['menuOpened'] = $.contextMenu({
            selector: 'td',
            trigger: 'left',
            callback: function(key, options) {
                if(key == 'enter'){
                    window.sessionStorage.setItem('caseData',JSON.stringify(mem['rowSelected']));
                    location.href="./case_home.html";
                }
                if(key == 'show'){
                    $('.contextMenu').hide();
                    fillData('cases', mem['rowSelected']);
                }
            },
            items: {
                "show": {name: "Show/Edit", icon: "edit"},
                "enter": {name: "Go to case", icon: "fa-certificate"}
            },
        });

    }else{
    }
}
function datesplitter(date){
    //date in aaa/mm/dd

    var dateData = date.split("/");
    dateData[0] = parseInt(dateData[0]);
    dateData[1] = parseInt(dateData[1]);
    dateData[2] = parseInt(dateData[2]);

    var oggi = new Date().getTime();
    var d = new Date(dateData[0], dateData[1], dateData[2] ).getTime()
    var diff = oggi-d;
    var d2 = new Date(diff)
    var y = d2.getFullYear();
    var m = d2.getMonth() + 1;
    var g = d2.getDate();
    var d3 = y+"/"+m+"/"+g;
    console.log(d3)
    return d3;
}
function setToEdit(entity){
    if(entity == 'case'){
        $("#todo").val("edit");
        $("#case_icrn").prop('disabled', false);
        $("#case_legalProcess_button").prop('disabled', false);
        $("#case_nature_button").prop('disabled', false);
        $("#case_lpsd").prop('disabled', false);
        $("#case_rdd").prop('disabled', false);
        $("[formAdd=toShow]").show();
        $("#caseFormEdit").hide();
    }
}