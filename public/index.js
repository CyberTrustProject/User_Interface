var mem = {};
$(document).ready(function() {
    $("[inputForm]").on('keypress',function(e) {
        if(e.which == 13) {
            loginStatusCheck()
        }
    });
    $("#login").click(function() {
        loginStatusCheck()
    });
    $("#addNewUser").click(function(event){
        event.stopPropagation();
        $("#user_roles").val('ho');
        $("#newUserModal").modal('show');
    });
    arm_profilingServices()
});
function loginStatusCheck(){
    if ($("#inputPassword").val() && $("#inputEmail").val()) {
        loadingScreen(true);
        oAuthLogin($("#inputEmail").val(),$("#inputPassword").val());
    }
}