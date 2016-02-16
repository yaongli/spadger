define(function (require, exports, module) {
    var $ = require('./jquery');
    var ajax = require('./ajax');
    var list = require("./list");
    var option = require("./option");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var pub = require("./public");
    var workflow = require("./workflow");
    require('bootstrap');
    require('./bootstrap-datepicker');
    var weekMap = {1: "(一)", 2: "(二)", 3: "(三)", 4: "(四)", 5: "(五)", 6: "(六)", 0: "(日)"};
    var reqAsc = true;
    var orderField=1;
    var lineNum = 0;


    $(document).ready(function () {
        pub.activeMenu("#myresubmit-menu");
        //init empty table
        list.empty("resubmit_list", "NoRowsTemplate");
        pub.bindAutoComplete();

        pub.menuCollapseHandler();
        pub.searchCollapseHandler();
        pub.bindDatePicker($("#q-propose-begin-date"));
        pub.bindDatePicker($("#q-propose-end-date"));
        pub.beginDateChange();
        pub.endDateChange();

        $("#msg-confirm").live("click", function (e) {
            $("#msg-container").hide();
            $(".ex-modal-backdrop").remove();
            $('.ex-modal-backdrop-1').hide();
        });

        $(".close").live("click", function (e) {
            $(this).parent().parent().parent().parent().hide();
            $(".ex-modal-backdrop").remove();
        });
        
        $('#search-btn').bind('click', function () {
            if($("#q-propose-begin-date").val()!="" && $("#q-propose-end-date").val()!="" && !pub.verifyQueryDate($("#q-propose-begin-date").val(), $("#q-propose-end-date").val())){
                showMsg($("#msg-container"), "请确认查询申请时间的范围需要在三个月之内！");
                return;
            }
            lineNum = 0;
            var param = "";
            if ($("#q-requestno").attr("result")) {
                param += "requestNo=" + $("#q-requestno").attr("result") + "&";
            }
            if ($("#q-budget-subject").attr("result")) {
                param += "budgetSubject=" + $("#q-budget-subject").attr("result") + "&";
            }
            param += "taskDefinitionKey=" + $("#q-taskdefinitionkey").val() + "&";
            param += "orderField="+orderField+"&";
            param += "asc=" + reqAsc;
            list.init("list_model", "resubmit_list", "pagination_bar", "", param, "NoRowsTemplate", "resubmit-search", null, 1, function (data) {
                loading.hide();
                $(".revoke-link").bind("click", function(e){
                    var expenseNo = $(this).attr("expenseNo");
                    var processId = $(this).attr("processId");
                    showMsg($("#submit-container"), "您即将终止单据 <span style=\"font-weight:900; color:#ff8800;\">" + expenseNo + " </span>，终止后此单对应纸质发票上的单据号将无效，是否确认终止该报销？");
                    $("#confirm-submit").unbind("click");
                    $("#confirm-submit").bind("click", function(e){
                        var param = new Object();
                        param.expenseNo = expenseNo;
                        param.processId = processId;
                        param.action = 4;
                        $.ajax({
                            type: "post",
                            dataType: "json",
                            url: "/pc/normal/revoke",
                            data: param,
                            success: function (data) {
                                $("#submit-container").hide();
                                $(".ex-modal-backdrop").remove();
                                if (data.code != 200) {
                                    showMsg($("#msg-container"), "系统异常，终止失败！");
                                    return;
                                }
                                $("#search-btn").trigger("click");
                            }
                        });
                    });
                });
            });
        });

        $(".cancel").bind("click", function (e) {
            $(".ex-modal").hide();
            $(".ex-modal-backdrop").remove();
        });

        $(".close").bind("click", function (e) {
            $("#calendar-container").hide();
            $(".ex-modal-backdrop-1").remove();
        });

        $('#search-btn').trigger("click");
        pub.showTodoTaskNumber();
    });

    function release(container) {
        $(".ex-modal-backdrop").remove();
        $(".ex-modal-backdrop-1").remove();
        container.hide();
        container.fadeOut();
    }

    function showDialog(dialog, title, content) {
        dialog.find(".ex-modal-title").text(title);
        dialog.find(".ex-modal-body").html(content);
        dialog.show();
        dialog.css({"position": "fixed"});
        dialog.css({"top": "10px"});
        dialog.css({"left": Math.max(0, (($(window).width() - dialog.width()) / 2) +
        $(window).scrollLeft()) + "px"});
        var maskHtml = '<div class="ex-modal-backdrop-1"></div>';
        $(maskHtml).prependTo(document.body);
    }

    function block() {
        var maskHtml = '<div class="ex-modal-backdrop"></div>';
        $(maskHtml).prependTo(document.body);
    }

    function showMsg(dialog, content) {
        dialog.find(".ex-modal-body").html(content);
        dialog.show();
        dialog.css({"position": "absolute"});
        dialog.css({"top": Math.max(0, (($(window).height() - dialog.height()) / 2) +
        $(window).scrollTop()) + "px"});
        dialog.css({"left": Math.max(0, (($(window).width() - dialog.width()) / 2) +
        $(window).scrollLeft()) + "px"});
        var maskHtml = '<div class="ex-modal-backdrop"></div>';
        $(maskHtml).prependTo(document.body);
    }

});