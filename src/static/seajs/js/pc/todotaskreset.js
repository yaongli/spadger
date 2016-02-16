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

    $(document).ready(function () {
        pub.menuCollapseHandler();
        pub.searchCollapseHandler();
        pub.activeMenu("#todotaskreset-menu");
        pub.bindAutoComplete();
        $("#reset-btn").bind("click", function () {
            var auditorWorkNo = $("#q-auditor-work-no").attr("result");
            if (auditorWorkNo == "" || auditorWorkNo == undefined) {
                showErrorMsg("请输入审批人工号或名字!");
            } else {
                loading.show();
                setTimeout(function(){
                    $.ajax({
                        type: "post",
                        dataType: "json",
                        url: "/pc/expense/todoTaskReset",
                        async: false,
                        data: {"auditorWorkNo": auditorWorkNo},
                        success: function (data) {
                            if (data.code == 403) {
                                showErrorMsg("您没有权限执行该操作！");
                            } else if (data.code == 200) {
                                showErrorMsg(data.msg.message);
                            } else {
                                if (data.msg.message) {
                                    showErrorMsg(data.msg.message);
                                } else {
                                    showErrorMsg("系统错误,请联系管理员!");
                                }
                            }
                            loading.hide();
                        },
                        error: function (jqXHR, textStatus, errorThrown) {
                            showErrorMsg("系统错误,请联系管理员!");
                            loading.hide();
                        }
                    });
                },10);
            }
        });

        $("#msg-confirm").bind("click", function (e) {
            $("#msg-container").hide();
            $(".ex-modal-backdrop").remove();
        });

        $(".close").bind("click", function (e) {
            $("#msg-container").hide();
            $(".ex-modal-backdrop").remove();
        });
    });

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

});