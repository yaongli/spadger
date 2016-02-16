define(function (require, exports, module) {
    var $ = require('./jquery');
    var ajax = require('./ajax');
    var list = require("./list");
    var option = require("./option");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var pub = require("./public");
    var workflow = require("./workflow");
    var expense_detail = require("./expense_detail");
    require('bootstrap');
    require('./bootstrap-datepicker');
    var weekMap = {1: "(一)", 2: "(二)", 3: "(三)", 4: "(四)", 5: "(五)", 6: "(六)", 0: "(日)"};
    var reqAsc = true;
    var orderField="";
    var lineNum = 0;


    $(document).ready(function () {
        pub.activeMenu("#ap-plan-menu");

        //init empty table
        list.empty("ap_list", "NoRowsTemplate");
        pub.bindAutoComplete();

        pub.menuCollapseHandler();
        pub.searchCollapseHandler();
        pub.bindDatePicker($("#q-propose-begin-date"));
        pub.bindDatePicker($("#q-propose-end-date"));
        pub.beginDateChange();
        pub.endDateChange();

        $("#request-time-th").bind("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            orderField="RequestTime";
            reqAsc = !reqAsc;
            if (reqAsc) {
                $(this).html("应付时间&#9650;");
            } else {
                $(this).html("应付时间&#9660;");
            }
            $('#search-btn').trigger("click");
        });

        $("#request-expenseno-th").bind("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            orderField="ExpenseNo";
            reqAsc = !reqAsc;
            if (reqAsc) {
                $(this).html("单据号&#9650;");
            } else {
                $(this).html("单据号&#9660;");
            }
            $('#search-btn').trigger("click");
        });

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
            $('#select-all').attr("checked", false);
            if($("#q-propose-begin-date").val()!="" && $("#q-propose-end-date").val()!="" && !pub.verifyQueryDate($("#q-propose-begin-date").val(), $("#q-propose-end-date").val())){
                showMsg($("#msg-container"), "请确认查询申请时间的范围需要在三个月之内！");
                return;
            }
            lineNum = 0;
            var param = getSearchParameter();

            param += "orderField="+orderField+"&";
            param += "asc=" + reqAsc;
            list.init("list_model", "ap_list", "pagination_bar", "", param, "NoRowsTemplate", "search-area", null, 1, function (data) {
                loading.hide();
                if ($(".item-body").length) {
                    lineNum = $(".item-body").length > lineNum ? lineNum : $(".item-body").length - 1;
                    $(".item-body:eq(" + lineNum + ")").trigger("click");
                }

                var recordCount = data.recordCount;
                var totalAmount = data.summaryAmountDisplay;
                $(".recordCount").html(recordCount);
                $(".totalAmount").html(totalAmount);
                $("#result-info").show();

                var paymentStatus = $("#q-paymentStatus").val();
                //初始状态（5）可以提交支付；退票状态（4）,支付失败（3）可以重新提交
                $("#select-all-pageinfo").hide();
                $("#select-cur-pageinfo").hide();
                $("#select-part-pageinfo").hide();
                $("#btn-batch-pay").hide();
                $("#btn-batch-repay").hide();
                $(".select-all-th").hide();
                $(".select-div-td").hide();
                
                if(5 == paymentStatus){
                    $(".select-all-th").show();
                    $(".select-div-td").show();
                    $("#btn-batch-pay").show();
                }else if(4 == paymentStatus || 3 == paymentStatus){
                    $(".select-all-th").show();
                    $(".select-div-td").show();
                    $("#btn-batch-repay").show();
                }
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

        $('.view_expense_detail').live('click', function(e){
            e.stopPropagation();
            var expenseNo = $(this).attr("expenseNo");

            expense_detail.show_expense_detail(expenseNo);
            $(".calendar-btn").hide();
            $("#welfare-history-btn").hide();
            var dialog = $("#expense-detail-dialog");
            dialog.show();
            dialog.css({"position": "fixed"});
            dialog.css({"top": "10px"});
            dialog.css({"left": Math.max(0, (($(window).width() - dialog.width()) / 2) +
            $(window).scrollLeft()) + "px"});
            var maskHtml = '<div class="ex-modal-backdrop"></div>';
            $(maskHtml).prependTo(document.body);
        });

        $("#btn-confirm-expense-detail").live("click", function (e) {
            release($("#expense-detail-dialog"));
        });

        $(".close").live("click", function (e) {
            release($(this).parents(".ex-modal"));
        });

        $('.selected-item').live('click', function (e) {
            e.stopPropagation();
            var selectedNum = 0;
            $.each($('.selected-item'), function (index, el) {
                if ($(el).attr('checked') == 'checked') {
                    selectedNum++;
                }
            });
            if (selectedNum > 0) {
                $('.select-div').show();
                $('.select-info-hightlight').text(selectedNum);
            } else {
                $('.select-div').hide();
            }
        });

        //选择单据
        $('.selected-item').live('click', function (e) {
            $("#hidden-select-all-items").val("false");
            $('#select-all-pageinfo').hide();
            $('#select-cur-pageinfo').hide();
            $('#select-all').attr("checked", false);

            var selectedNum = 0;
            var selectedAmount = 0;
            
            var checked = $('.select-all')[0].checked;
            $.each($('.selected-item:checked'), function (index, el) {
                selectedNum++;
                var payAmount = $(el).attr('payAmount');
                if(payAmount){
                    selectedAmount += parseFloat(payAmount);
                }
            });

            $('.selected-count').text(selectedNum);
            $('.selected-amount').text(selectedAmount.toFixed(2));

            $('#select-part-pageinfo').show();
        });

        //勾选全部
        $('.select-all').live('click', function (e) {
            e.stopPropagation();
            var selectedNum = 0;
            var selectedAmount = 0;
            
            var checked = $('.select-all')[0].checked;
            $.each($('.selected-item'), function (index, el) {
                $(el).attr('checked', checked);
                selectedNum++;
                var payAmount = $(el).attr('payAmount');
                if(payAmount){
                    selectedAmount += parseFloat(payAmount);
                }
            });

            if (checked) {
                $('#select-all-pageinfo').show();
                $('.selected-count').text(selectedNum);
                $('.selected-amount').text(selectedAmount.toFixed(2));
            } else {
                $('#select-all-pageinfo').hide();
                $('#select-part-pageinfo').hide();
                $('#select-cur-pageinfo').hide();
            }
        });

         //勾选全部
        $('#select-all-page').bind('click', function () {
            $("#hidden-select-all-items").val("true");
            $('#select-part-pageinfo').hide();
            $('#select-all-pageinfo').hide();
            $('#select-cur-pageinfo').show();
        });

        //取消勾选
        $('#select-cur-page').bind('click', function () {
            $("#hidden-select-all-items").val("false");
            $('#select-cur-pageinfo').hide();
            $('#select-all-pageinfo').hide();
            $('#select-part-pageinfo').hide();
            $('#select-all').attr('checked', false);
            $.each($('.selected-item'), function (index, el) {
                $(el).attr('checked', false);
            });
        });

        function batch_operation(operation, url){
            var selectedPaymentIdList = [];
            $.each($('.selected-item'), function (index, el) {
                if ($(el).attr('checked') == "checked") {
                    var paymentId = $(el).attr('paymentId');
                    if(paymentId){
                        selectedPaymentIdList.push(paymentId);
                    }
                }
            });

            var paymentIds = selectedPaymentIdList.join(",");
            var selectAllItems = $("#hidden-select-all-items").val();
            if(selectAllItems == "false" && selectedPaymentIdList.length == 0){
                //no selected, do nothing
                return;
            }

            var param = getSearchParameter();
            param += "paymentIds=" + paymentIds + "&selectAllItems=" + selectAllItems + "&";

            $.ajax({
                type: "get",
                dataType: "json",
                url: url,
                data: param,
                success: function (data) {
                    var message="";
                    release($("#batch-action-container"));
                    if(data.code != 200){
                        message = data.message;
                    }else {
                        message = "您已成功批量提交<span style=\"color: #ff8800; font-weight:900;\"> " + data.msg.correctNum + " </span>单，失败<span style=\"color: #ff8800; font-weight:900;\"> " + data.msg.errorNum + " </span>单。";
                    }
                    showDialog($("#msg-container"), "处理结果", message);
                    $("#msg-confirm").unbind("click");
                    $("#msg-confirm").bind("click", function(){
                        release($("#msg-container"));
                        list.curPage();
                    });
                }
            });
        }

        $("#btn-batch-pay").live("click", function () {
            var selectedPaymentIdList = [];
            $.each($('.selected-item'), function (index, el) {
                if ($(el).attr('checked') == "checked") {
                    var paymentId = $(el).attr('paymentId');
                    if(paymentId){
                        selectedPaymentIdList.push(paymentId);
                    }
                }
            });

            var paymentIds = selectedPaymentIdList.join(",");
            var selectAllItems = $("#hidden-select-all-items").val();
            if(selectedPaymentIdList.length == 0){
                var message = "请先选择单据，再批量提交！"
                showDialog($("#msg-container"), "提示", message);
                return;
            }

            var selectedNum = 0;
            var selectedAmount = 0;

            $.each($('.selected-item:checked'), function (index, el) {
                selectedNum++;
                var payAmount = $(el).attr('payAmount');
                if(payAmount){
                    selectedAmount += parseFloat(payAmount);
                }
            });

            var message = "<div style=\"position:relative; margin-top:10px; left:15%;\"><div><img src=\"/expense/img/yellow-warning.png\" style=\"vertical-align: baseline;width:30px; height:30px; position:relative; top:8px;\"><span class=\"tip-title-text\" style=\"margin-left:10px;\">确认批量通过？</span></div>" +
            "<div style=\"margin-top:10px;margin-left: 40px;\" class=\"tip-content-text\">单据总计 " + (selectAllItems=="true"?$(".recordCount").html():selectedNum) +
                " 条<br> 金额总计 " + (selectAllItems=="true"?$(".totalAmount").html():pub.formatMoney(selectedAmount,2)) + " 元</div></div>";

            showDialog($("#batch-action-container"), "提示", message);

            $("#batch-confirm").unbind("click");
            $("#batch-confirm").bind("click", function(){
                batch_operation("pay", "/pc/expense/applanBatchPay");
            });
        });

        $("#btn-batch-repay").live("click", function () {
            var selectedPaymentIdList = [];
            $.each($('.selected-item'), function (index, el) {
                if ($(el).attr('checked') == "checked") {
                    var paymentId = $(el).attr('paymentId');
                    if(paymentId){
                        selectedPaymentIdList.push(paymentId);
                    }
                }
            });

            var paymentIds = selectedPaymentIdList.join(",");
            var selectAllItems = $("#hidden-select-all-items").val();
            if(selectedPaymentIdList.length == 0){
                var message = "请先选择单据，再批量提交！"
                showDialog($("#msg-container"), "提示", message);
                return;
            }

            var selectedNum = 0;
            var selectedAmount = 0;

            $.each($('.selected-item:checked'), function (index, el) {
                selectedNum++;
                var payAmount = $(el).attr('payAmount');
                if(payAmount){
                    selectedAmount += parseFloat(payAmount);
                }
            });

            var message = "<div style=\"position:relative; margin-top:10px; left:15%;\"><div><img src=\"/expense/img/yellow-warning.png\" style=\"vertical-align: baseline;width:30px; height:30px; position:relative; top:8px;\"><span class=\"tip-title-text\" style=\"margin-left:10px;\">确认批量通过？</span></div>" +
                "<div style=\"margin-top:10px;margin-left: 40px;\" class=\"tip-content-text\">单据总计 " + (selectAllItems=="true"?$(".recordCount").html():selectedNum) +
                " 条<br> 金额总计 " + (selectAllItems=="true"?$(".totalAmount").html():pub.formatMoney(selectedAmount,2)) + " 元</div></div>";

            showDialog($("#batch-action-container"), "提示", message);

            $("#batch-confirm").unbind("click");
            $("#batch-confirm").bind("click", function(){
                batch_operation("repay", "/pc/expense/applanBatchRepay");
            });
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
        var maskHtml = '<div class="ex-modal-backdrop"></div>';
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

    function getSearchParameter(){
        var param = "";
        if($("#q-expenseNo").val()){
            param += "searchBean.expenseNo="+$("#q-expenseNo").val()+"&";
        }

        if($("#q-proposerNo").val()){
            var proposerNo = $("#q-proposerNo").val().split("/")[0];
            param += "searchBean.proposerNo="+ proposerNo +"&";
        }
        if($("#q-expenseCatalog").val()){
            param += "searchBean.expenseCatalog="+$("#q-expenseCatalog").val()+"&";
        }
        if($("#q-proposerCity").val()){
            param += "searchBean.proposerCity="+$("#q-proposerCity").val()+"&";
        }
        if($("#q-propose-begin-date").val()){
            param += "searchBean.beginTime="+$("#q-propose-begin-date").val()+"T00:00:00&";
        }
        if($("#q-propose-end-date").val()){
            param += "searchBean.endTime="+$("#q-propose-end-date").val()+"T23:59:59&";
        }
        if($("#q-paymentStatus").val()){
            param += "searchBean.paymentStatus="+$("#q-paymentStatus").val()+"&";
        }
        return param;
    }

});