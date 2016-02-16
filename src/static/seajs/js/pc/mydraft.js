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
    var reqAsc = false;
    var orderField=1;
    var lineNum = 0;



    $(document).ready(function () {
        pub.activeMenu("#mydraft-menu");
        //init empty table
        list.empty("draft_list", "NoRowsTemplate");
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
            if ($("#q-department").attr("result")) {
                param += "departmentId=" + $("#q-department").attr("result") + "&";
            }
            if ($("#q-budget-subject").attr("result")) {
                param += "budgetSubject=" + $("#q-budget-subject").attr("result") + "&";
            }
            param += "orderField="+orderField+"&";
            param += "asc=" + reqAsc;
            list.init("list_model", "draft_list", "pagination_bar", "", param, "NoRowsTemplate", "draft-search", null, 1, function (data) {
                loading.hide();

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

        $(".teminate_link").live("click", function (e) {
            var tr_elem = $(this).parent().parent()
            var expenseNo = tr_elem.attr("expenseNo")
            showMsg($("#terminate-container"), "确认删除该单据？");
            $("#confirm-terminate").unbind();
            $("#confirm-terminate").bind("click", function (e) {
                var param = new Object();
                param.expenseNo = expenseNo;
                $.ajax({
                    type: "post",
                    dataType: "json",
                    url: "/pc/expense/removeDraft",
                    data: param,
                    success: function (data) {
                        $("#terminate-container").hide();
                        $(".ex-modal-backdrop").remove();
                        $("#draft_list tr").each(function (){
                            if($(this).attr("expenseNo") == data.expenseNo){
                                $(this).remove();
                            }
                        });
                    }
                });
            });
        });
        $("#search-btn").trigger("click");
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
