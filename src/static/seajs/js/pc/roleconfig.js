define(function (require, exports, module) {
    var $ = require('./jquery');
    require("./jquery.tmpl");
    var ajax = require('./ajax');
    var list = require("./list");
    var option = require("./option");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var pub = require("./public");
    require('bootstrap');
    require('./bootstrap-datepicker');
    var page = 1;
    var pageSize = 20;

    $(document).ready(function () {
        pub.activeMenu("#roleconfig-menu");
        pub.bindAutoComplete();
        pub.menuCollapseHandler();
        pub.searchCollapseHandler();
        bindModalEvents();

        $('#search-btn').bind('click', function () {
            displayRoleList();
        });
        bindAddRole();

        $('body').click(function(){
            $(".ac-list").hide();
        });
        //pub.showTodoTaskNumber();
    });

    function displayRoleList(cur_page){
        if(!cur_page){
            cur_page = 1;
        }
        var roleId = $("#q-role-type").val();
        var cityId = $("#q-city-id").attr("result");
        var workNo = $("#q-work-no").attr("result");
        var param = "";
        if(roleId){
            param += "searchBean.roleId=" + roleId + "&";
        }
        if(cityId){
            param += "searchBean.cityId=" + cityId + "&";
        }
        if(workNo){
            param += "searchBean.workNo=" + workNo + "&";
        }

        list.init("list_model", "role_list", "pagination_bar", "", param, "NoRowsTemplate", "search-div", null, cur_page, function (data) {
            loading.hide();
            if(data.code != 200){
                //No Auth
                return;
            }

            page = data.page;

            bindEditRole();
            bindDeleteRole();
        });
    }

    function bindAddRole(){
        $('#add-btn').click(function(){
            var queryRoleType = $("#q-role-type").val();
            if(queryRoleType) {
                $("#manage-role-type").val(queryRoleType);
            }
            $("#manage-city-id").val("");
            $("#manage-work-no").val("");
            $("#manage-city-id").attr("result", "0");
            $("#manage-work-no").attr("result", "");

            $("#manage-role-type").removeAttr("disabled");
            $("#manage-city-id").removeAttr("readonly");
            $("#manage-role-container-title").html("增加接口人");

            showMsg($("#manage-role-container"));
            $('#manage-role-confirm').unbind('click');
            $('#manage-role-confirm').click(function(){
                var roleId = $("#manage-role-type").val();
                var cityId = $("#manage-city-id").attr("result");
                var workNo = $("#manage-work-no").attr("result");

                $(".input-warning").removeClass("input-warning");
                $("#manage-message").hide();

                if(!cityId || (0 == cityId && $("#manage-city-id").val() != "所有城市")){
                    $("#manage-message").html("请输入城市").show();
                    $("#manage-city-id").addClass("input-warning");
                    return;
                }

                if(!workNo){
                    $("#manage-message").html("请输入接口人").show();
                    $("#manage-work-no").addClass("input-warning");
                    return;
                }


                var roleConfig = {
                    "roleConfig.roleId" : roleId,
                    "roleConfig.cityId" : cityId,
                    "roleConfig.workNo" : workNo
                }

                $.ajax({
                    type: "post",
                    dataType: "json",
                    url: "/pc/expense/addrole",
                    async: false,
                    data: roleConfig,
                    success: function (data) {
                        if(data.code == 403){
                            if(data.msg.message){
                                showErrorMsg(data.msg.message);
                            }else{
                                showErrorMsg("您没有权限执行该操作！");
                            }
                        }else{
                            loading.hide();
                            $(".ex-modal-backdrop").remove();
                            try{
                                $("#q-role-type").val($("#manage-role-type").val());
                                $("#q-city-id").attr("result", $("#manage-city-id").attr("result"));
                                $("#q-city-id").val($("#manage-city-id").val());
                            }catch(e){
                            }

                            displayRoleList();
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        loading.hide();
                    }
                });
                $("#manage-role-container").hide();
            });
        });
    }

    function bindEditRole(){
        $('.edit_role').click(function(){
            var row = $(this).parent().parent();
            var configId = row.attr("recordId");
            var oldWorkNo = row.attr("workNo");
            $("#manage-role-type").val(row.attr("roleId"));
            $("#manage-city-id").val(row.attr("cityName"));
            $("#manage-work-no").val(row.attr("workName"));
            $("#manage-city-id").attr("result", row.attr("cityId"));
            $("#manage-work-no").attr("result", row.attr("workNo"));

            $("#manage-role-type").attr("disabled", "true");
            $("#manage-city-id").attr("readonly", "true");
            $("#manage-role-container-title").html("编辑接口人");


            showMsg($("#manage-role-container"));
            $('#manage-role-confirm').unbind('click');
            $('#manage-role-confirm').click(function(){
                var roleId = $("#manage-role-type").val();
                var cityId = $("#manage-city-id").attr("result");
                var workNo = $("#manage-work-no").attr("result");
                $(".input-warning").removeClass("input-warning");
                $("#manage-message").hide();

                if(!cityId || (0 === cityId && $("#manage-city-id").val() != "所有城市")){
                    $("#manage-message").html("请输入城市").show();
                    $("#manage-city-id").addClass("input-warning");
                    return;
                }

                if(!workNo){
                    $("#manage-message").html("请输入接口人").show();
                    $("#manage-work-no").addClass("input-warning");
                    return;
                }

                var roleConfig = {
                    "roleConfig.id" : configId,
                    "roleConfig.roleId" : roleId,
                    "roleConfig.cityId" : cityId,
                    "roleConfig.workNo" : workNo,
                    "roleConfig.oldWorkNo" : oldWorkNo

                }

                $.ajax({
                    type: "post",
                    dataType: "json",
                    url: "/pc/expense/editrole",
                    async: false,
                    data: roleConfig,
                    success: function (data) {
                        if(data.code == 200){
                            loading.hide();

                            $(".ex-modal-backdrop").remove();
                            displayRoleList(page);
                        }else if(data.code == 403){
                            if(data.msg.message){
                                showErrorMsg(data.msg.message);
                            }else{
                                showErrorMsg("您没有权限执行该操作！");
                            }
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        loading.hide();
                        $(".ex-modal-backdrop").remove();
                    }
                });
                $("#manage-role-container").hide();
            });
        });
    }

    function bindDeleteRole() {
        $('.delete_role').click(function () {
            var row = $(this).parent().parent();
            var configId = row.attr("recordId");
            var roleId = row.attr("roleId");
            var roleConfig = {
                "roleConfig.id" : configId,
                "roleConfig.roleId" : roleId
            }

            var configId = row.attr("recordId");
            $("#delete-role").html(row.attr("roleName"));
            $("#delete-city").html(row.attr("cityName"));
            $("#delete-contact").html("" + row.attr("workNo") + "/" + row.attr("workName"));

            showMsg($("#delete-role-container"));
            $('#delete-role-confirm').unbind('click');
            $('#delete-role-confirm').click(function(){
                $.ajax({
                    type: "post",
                    dataType: "json",
                    url: "/pc/expense/deleterole",
                    async: false,
                    data: roleConfig,
                    success: function (data) {
                        if(data.code == 403){
                            if(data.msg.message){
                                showErrorMsg(data.msg.message);
                            }else{
                                showErrorMsg("您没有权限执行该操作！");
                            }
                        }else{
                            $(".ex-modal-backdrop").remove();
                            displayRoleList(page);
                            loading.hide();
                        }
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        loading.hide();
                        $(".ex-modal-backdrop").remove();
                    }
                });
                $("#delete-role-container").hide();
            })
        });
    }

    function showErrorMsg(content){
        showMsg($("#msg-container"), content);
    }

    function showMsg(dialog, content) {
        if(content && content != ""){
            dialog.find(".ex-modal-body").html(content);
        }
        dialog.show();
        dialog.css({"position": "absolute"});
        dialog.css({
            "top": Math.max(0, (($(window).height() - dialog.height()) / 2) +
            $(window).scrollTop()) + "px"
        });
        dialog.css({
            "left": Math.max(0, (($(window).width() - dialog.width()) / 2) +
            $(window).scrollLeft()) + "px"
        });
        var maskHtml = '<div class="ex-modal-backdrop"></div>';
        $(maskHtml).prependTo(document.body);
        $(dialog).find(".close, .cancel").click(function(){
            dialog.hide();
        });
    }

    function bindModalEvents() {
        $("#msg-confirm").bind("click", function (e) {
            $("#msg-container").hide();
            $(".ex-modal-backdrop").remove();
        });

        $(".close").bind("click", function (e) {
            $("#msg-container").hide();
            $("#submit-container").hide();
            $("#budget-type-container").hide();
            $(".ex-modal-backdrop").remove();
        });
    }
});
