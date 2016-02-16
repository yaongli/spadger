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
            displayAuthList();
        });

        $('body').click(function(){
            $(".ac-list").hide();
        });
        //pub.showTodoTaskNumber();
    });

    function displayAuthList(cur_page){
        if(!cur_page){
            cur_page = 1;
        }
        //var roleId = $("#q-role-type").val();
        //var cityId = $("#q-city-id").attr("result");
        //var workNo = $("#q-work-no").attr("result");
        var param = "";
        //if(roleId){
        //    param += "searchBean.roleId=" + roleId + "&";
        //}
        //if(cityId){
        //    param += "searchBean.cityId=" + cityId + "&";
        //}
        //if(workNo){
        //    param += "searchBean.workNo=" + workNo + "&";
        //}

        list.init("list_model", "auth_list", "pagination_bar", "", param, "NoRowsTemplate", "search-div", null, cur_page, function (data) {
            loading.hide();
            if(data.code != 200){
                //No Auth
                return;
            }

            page = data.page;

            //bindEditRole();
            //bindDeleteRole();
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
