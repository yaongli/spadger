define(function (require, exports, module) {
    var $ = require('./jquery');
    var ajax = require('./ajax');
    var list = require("./list");
    var option = require("./option");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var pub = require("./public");
    var expense_detail = require("./expense_detail");
    var reject_reason = require("./reject_reason.js");
    var reqAsc = true;
    var orderField="";
    var lineNum = 0;
    var singleExpenseNoOrBatch = "batch";
    var INVOICE_STATUS = { "0": "全部", "1": "待收票", "2" : "待寄送", "3" : "寄送中", "4" :  "已签收"};
    var isFinanceAccept = 0;

    $(document).ready(function () {
        pub.activeMenu("#invoice-menu");
        pub.bindAutoComplete();
        pub.menuCollapseHandler();
        pub.searchCollapseHandler();

        bindDatePicker($("#q-invoice-begin-date"));
        bindDatePicker($("#q-invoice-end-date"));
        setDefaultDate();
        showInvoiceDate(isFinanceAccept);

        list.empty("invoice_list", "NoRowsTemplate");
        bindSortColumn("快递单号", "#request-expressno-th", "ExpressNo");
        bindSortColumn("单据号", "#request-expenseno-th", "ExpenseNo");
        bindSortColumn("寄送时间", "#request-express-time-th", "UpdateTime");

        globalEventBinds();

        $('#search-btn').bind('click', function () {
            showExpressTime();
            lineNum = 0;
            var param = getSearchParameter();

            param += "orderField="+orderField+"&";
            param += "asc=" + reqAsc;

            var status = $("#q-invoiceStatus option:selected").val();
            if (status == 0 || status == 3 || status == 4) {
                if (!$("#q-expenseNo").val() && !$("#q-expressNo").val()) {
                    if(!verifyDate()) {
                        return;
                    }
                }
            }

            list.init("list_model", "invoice_list", "pagination_bar", "", param, "NoRowsTemplate", "invoice-search", null, 1, function (data) {
                showExpressTime();
                if($("#q-invoiceStatus").val()==1 || $("#q-invoiceStatus").val()==2 || $("#q-invoiceStatus").val()==3){
                    $("#nodata-tr").attr("colspan",9);
                }
                loading.hide();
                if ($(".item-body").length) {
                    lineNum = $(".item-body").length > lineNum ? lineNum : $(".item-body").length - 1;
                    $(".item-body:eq(" + lineNum + ")").trigger("click");
                }

                var recordCount = data.recordCount ? data.recordCount : 0;
                //var totalAmount = data.summaryAmountDisplay;
                $(".recordCount").html(recordCount);
                //$(".totalAmount").html(totalAmount);
                $("#result-info").show();

                var invoiceStatus = $("#q-invoiceStatus").val();
                var operateFlag = false;
                $.each($('.action-link'), function (index, el) {
                    var itemOperateFlag =$(el).attr('operateFlag');
                    if(itemOperateFlag){
                        operateFlag = true;
                    }
                    return;
                });
                displayOperationByStatus(invoiceStatus, recordCount,operateFlag);

                //if($("#q-invoiceStatus").val()==0 || $("#q-invoiceStatus").val()==4 || !operateFlag){
                //    hideOperation();
                //}else{
                //    displayOperation();
                //}
            });
        });

        function hideOperation(){
            $(".operation").each(function (index, value) {
                $(value).hide()
            });
        }

        function displayOperation(){
            $(".operation").each(function (index, value) {
                $(value).show()
            });
        }

        $("a.single-collect").live("click", function (e) {
            var expenseNo = $(this).attr("expenseno");
            console.log("single-collect: expenseNo=" + expenseNo);
            singleExpenseNoOrBatch = expenseNo;
            single_operation("collect", "/pc/expense/invoiceCollect", expenseNo);
        });

        $("a.single-delivery").live("click", function (e) {
            var expenseNo = $(this).attr("expenseno");
            console.log("single-delivery: expenseNo=" + expenseNo);
            singleExpenseNoOrBatch = expenseNo;
            showDialog($("#batch-delivery-container"));
        });

        $("a.single-receive").live("click", function (e) {
            var expenseNo = $(this).attr("expenseno");
            console.log("single-receive: expenseNo=" + expenseNo);
            singleExpenseNoOrBatch = expenseNo;
            single_operation("receive", "/pc/expense/invoiceReceive", expenseNo);
        });

        $("a.single-reject").live("click", function (e) {
            var expenseNo = $(this).attr("expenseno");
            console.log("single-receive: expenseNo=" + expenseNo);
            $("#confirm-reject").attr("expenseNo", expenseNo);
            var bodyHtml = reject_reason.render();
            showDialog($("#reject-container"), "驳回原因", bodyHtml);
            $("#detail-reason").bind("change", function (e) {
                var rejectReason = reject_reason.collect();
                if (rejectReason == "") {
                    $(this).addClass("input-warning");
                } else {
                    $(this).removeClass("input-warning");
                }
            });
            $("#cancel-reject").unbind();
            $("#cancel-reject").bind("click", function(){
                release($("#reject-container"));
            });
            $("#reject-container .close").unbind();
            $("#reject-container .close").bind("click", function(){
                release($("#reject-container"));
            });
        });

        $("#confirm-reject").bind("click", function () {
            var rejectReason = reject_reason.collect();
            if (rejectReason == "") {
                $("#detail-reason").addClass("input-warning");
                return;
            }

            var param = {};
            param.expenseNo = $(this).attr("expenseNo");
            param.rejectReason = rejectReason;
            $.ajax({
                type: "post",
                dataType: "json",
                url: "/pc/expense/invoiceReject",
                data: param,
                success: function (data) {
                    release($("#reject-container"));
                    if (data.code != 200) {
                        if (data.message != null) {
                            showMsg($("#msg-container"), "驳回失败, 原因：" + data.message);
                        } else {
                            showMsg($("#msg-container"), "系统异常，请稍后再试");
                        }
                        $("#msg-confirm").unbind();
                        $("#msg-confirm").bind("click", function (e) {
                            $("#msg-containe").hide();
                            $(".ex-modal-backdrop").remove();
                        });
                        return;
                    }
                    $("#pass-detail").html("驳回成功");
                    $("#pass-msg").show();
                    var rightWidth = ($(".right-main").width() - 200) / 2;
                    $("#pass-msg").css("right", rightWidth + "px");
                    $("#pass-msg").fadeOut(1000);
                    setTimeout(function () {
                        list.curPage();
                    }, 2000);
                }
            });
        });

        //选择单据
        $('.selected-item').live('click', function (e) {
            $("#hidden-select-all-items").val("false");
            $('#select-part-pageinfo').show();
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
            if (selectedNum > 0) {
                $('.select-div').show();
                $('.selected-count').text(selectedNum);
            } else {
                $('.select-div').hide();
            }
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
                $('#select-part-pageinfo').show();
                $('.selected-count').text(selectedNum);
                $('.selected-amount').text(selectedAmount.toFixed(2));
            } else {
                //$('#select-all-pageinfo').hide();
                $('#select-part-pageinfo').hide();
                //$('#select-cur-pageinfo').hide();
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

        function single_operation(operation, url, expenseNo){
            var selectAllItems = false;
            var param = getSearchParameter();
            param += "expenseNos=" + expenseNo + "&selectAllItems=" + selectAllItems + "&";
            if("delivery" == operation){
                param += "expressCompany=" + $("#delivery-expressCompany").val() + "&";
                param += "expressNo=" + $("#delivery-expressNo").val() + "&";
            }

            ajax_request(url, param);
        }

        function batch_operation(operation, url){
            var selectedExpenseNoList = [];
            $.each($('.selected-item'), function (index, el) {
                if ($(el).attr('checked') == "checked") {
                    var expenseNo = $(el).attr('expenseNo');
                    if(expenseNo){
                        selectedExpenseNoList.push(expenseNo);
                    }
                }
            });

            var expenseNos = selectedExpenseNoList.join(",");
            var selectAllItems = $("#hidden-select-all-items").val();
            if(selectAllItems == "false" && selectedExpenseNoList.length == 0){
                //no selected, do nothing
                return;
            }

            var param = getSearchParameter();
            param += "expenseNos=" + expenseNos + "&selectAllItems=" + selectAllItems + "&";
            if("delivery" == operation){
                param += "expressCompany=" + $("#delivery-expressCompany").val() + "&";
                param += "expressNo=" + $("#delivery-expressNo").val() + "&";
            }

            batch_ajax_request(url, param);
        }

        function ajax_request(url, param){
            $.ajax({
                type: "post",
                dataType: "json",
                url: url,
                data: encodeURI(param),
                success: function (data) {
                    var message = "";
                    if(data.code ==403){
                        message = "您没有执行该操作的权限！";
                    }else {
                        message="本次成功处理<span style=\"color: #ff8800; font-weight:900;\"> " + data.msg.correctNum +" </span>单。"
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

        function batch_ajax_request(url, param){
            $.ajax({
                type: "post",
                dataType: "json",
                url: url,
                data: encodeURI(param),
                success: function (data) {
                    release($("#batch-action-container"));
                    var message="";
                    if(data.code != 200){
                        message = data.message;
                    }else {
                        message = "您已成功批量提交<span style=\"color: #ff8800; font-weight:900;\"> " + data.msg.correctNum + " </span>单，失败<span style=\"color: #ff8800; font-weight:900;\"> " + data.msg.errorNum + " </span>单。";
                    }
                    showDialog($("#msg-container"), "批量提交结果", message);
                    $("#msg-confirm").unbind("click");
                    $("#msg-confirm").bind("click", function(){
                        release($("#msg-container"));
                        list.curPage();
                    });
                }
            });
        }

        $("#batch-delivery-confirm").live("click", function () {
            if(!$("#delivery-expressCompany").val()){
                $("#delivery-expressCompany").addClass("input-warning");
                //showMsg($("#msg-container"), "请填写快递公司");
                return;
            }

            if(!$("#delivery-expressNo").val()){
                $("#delivery-expressNo").addClass("input-warning");
                //showMsg($("#msg-container"), "请填写快递单号");
                return;
            }

            if("batch" == singleExpenseNoOrBatch){
                var selectedNum = 0;
                var selectedAmount = 0;
                var selectedExpenseNoList = [];
                $.each($('.selected-item'), function (index, el) {
                    if ($(el).attr('checked') == "checked") {
                        selectedNum++;
                        var expenseNo = $(el).attr('expenseNo');
                        if(expenseNo){
                            selectedExpenseNoList.push(expenseNo);
                        }
                        var payAmount = $(el).attr('payAmount');
                        if(payAmount){
                            selectedAmount += parseFloat(payAmount);
                        }
                    }
                });

                var expenseNos = selectedExpenseNoList.join(",");
                var selectAllItems = $("#hidden-select-all-items").val();
                if(selectAllItems == "false" && selectedExpenseNoList.length == 0){
                    var message = "请先选择单据，再批量寄送！"
                    showDialog($("#msg-container"), "提示", message);
                    return;
                }
                release($("#batch-delivery-container"));

                var message = "<div style=\"position:relative; margin-top:10px; left:15%;\"><div><img src=\"/expense/img/yellow-warning.png\" style=\"vertical-align: baseline;width:30px; height:30px; position:relative; top:8px;\"><span class=\"tip-title-text\" style=\"margin-left:10px;\">确认批量寄送？</span></div>" +
                    "<div style=\"margin-top:10px;margin-left: 40px;\" class=\"tip-content-text\">单据总计 " + selectedNum +
                    " 条<br> 金额总计 " + pub.formatMoney(selectedAmount,2) + " 元</div></div>";

                showDialog($("#batch-action-container"), "提示", message);

                $("#batch-confirm").unbind("click");
                $("#batch-confirm").bind("click", function(){
                    batch_operation("delivery", "/pc/expense/invoiceDelivery");
                });
            }else{
                var expenseNo = singleExpenseNoOrBatch;
                single_operation("delivery", "/pc/expense/invoiceDelivery", expenseNo);
                release($("#batch-delivery-container"));
            }
        });

        $("#btn-batch-collect").live("click", function () {
            singleExpenseNoOrBatch = "batch";
            var selectedNum = 0;
            var selectedAmount = 0;
            var selectedExpenseNoList = [];
            $.each($('.selected-item'), function (index, el) {
                if ($(el).attr('checked') == "checked") {
                    selectedNum++;
                    var expenseNo = $(el).attr('expenseNo');
                    if(expenseNo){
                        selectedExpenseNoList.push(expenseNo);
                    }
                    var payAmount = $(el).attr('payAmount');
                    if(payAmount){
                        selectedAmount += parseFloat(payAmount);
                    }
                }
            });

            var expenseNos = selectedExpenseNoList.join(",");
            var selectAllItems = $("#hidden-select-all-items").val();
            if(selectAllItems == "false" && selectedExpenseNoList.length == 0){
                var message = "请先选择单据，再批量收票！"
                showDialog($("#msg-container"), "提示", message);
                return;
            }

            var message = "<div style=\"position:relative; margin-top:10px; left:15%;\"><div><img src=\"/expense/img/yellow-warning.png\" style=\"vertical-align: baseline;width:30px; height:30px; position:relative; top:8px;\"><span class=\"tip-title-text\" style=\"margin-left:10px;\">确认批量收票？</span></div>" +
                "<div style=\"margin-top:10px;margin-left: 40px;\" class=\"tip-content-text\">单据总计 " + selectedNum +
                " 条<br> 金额总计 " + pub.formatMoney(selectedAmount,2) + " 元</div></div>";

            showDialog($("#batch-action-container"), "提示", message);

            $("#batch-confirm").unbind("click");
            $("#batch-confirm").bind("click", function(){
                batch_operation("collect", "/pc/expense/invoiceCollect");
            });
        });

        $("#btn-batch-delivery").live("click", function () {
            singleExpenseNoOrBatch = "batch";
            var selectedExpenseNoList = [];
            var message = "";
            $.each($('.selected-item'), function (index, el) {
                if ($(el).attr('checked') == "checked") {
                    if($(el).attr('canOperate') == "false"){
                        if(message=="") {
                            message += "您选择了无权操作的单据,请重新选择！";
                        }
                        return false;
                    }
                    var expenseNo = $(el).attr('expenseNo');
                    if(expenseNo){
                        selectedExpenseNoList.push(expenseNo);
                    }
                }
            });

            if(message!=""){
                showDialog($("#msg-container"), "提示", message);
                return
            }

            var selectAllItems = $("#hidden-select-all-items").val();
            if(selectAllItems == "false" && selectedExpenseNoList.length == 0){
                var message = "请先选择单据，再批量寄送！"
                showDialog($("#msg-container"), "提示", message);
                return;
            }
            showDialog($("#batch-delivery-container"));
        });

        $("#btn-batch-receive").live("click", function () {
            singleExpenseNoOrBatch = "batch";
            var selectedNum = 0;
            var selectedAmount = 0;
            var selectedExpenseNoList = [];
            var message = "";
            $.each($('.selected-item'), function (index, el) {
                if ($(el).attr('checked') == "checked") {
                    if($(el).attr('canOperate') == "false"){
                        if(message=="") {
                            message += "您选择了无权操作的单据,请重新选择！";
                        }
                        return false;
                    }
                    selectedNum++;
                    var expenseNo = $(el).attr('expenseNo');
                    if(expenseNo){
                        selectedExpenseNoList.push(expenseNo);
                    }
                    var payAmount = $(el).attr('payAmount');
                    if(payAmount){
                        selectedAmount += parseFloat(payAmount);
                    }
                }
            });
            if(message!=""){
                showDialog($("#msg-container"), "提示", message);
                return
            }
            var expenseNos = selectedExpenseNoList.join(",");
            var selectAllItems = $("#hidden-select-all-items").val();
            if(selectAllItems == "false" && selectedExpenseNoList.length == 0){
                var message = "请先选择单据，再批量签收！"
                showDialog($("#msg-container"), "提示", message);
                return;
            }

            var message = "<div style=\"position:relative; margin-top:10px; left:15%;\"><div><img src=\"/expense/img/yellow-warning.png\" style=\"vertical-align: baseline;width:30px; height:30px; position:relative; top:8px;\"><span class=\"tip-title-text\" style=\"margin-left:10px;\">确认批量收票？</span></div>" +
                "<div style=\"margin-top:10px;margin-left: 40px;\" class=\"tip-content-text\">单据总计 " + selectedNum +
                " 条<br> 金额总计 " + pub.formatMoney(selectedAmount,2) + " 元</div></div>";

            showDialog($("#batch-action-container"), "提示", message);

            $("#batch-confirm").unbind("click");
            $("#batch-confirm").bind("click", function(){
                batch_operation("receive", "/pc/expense/invoiceReceive");
            });

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

        // ================================================================
        $.ajax({
            type: "get",
            dataType: "json",
            url:  "/pc/expense/initInvoiceStatus",
            async: false,
            success: function (data) {
                if (data.code != 200) {
                    return;
                }
                $("#q-invoiceStatus").val(data.invoiceStatus);
                $("#q-invoiceStatus option[value='"+data.invoiceStatus+"']").attr("selected", "selected");
                isFinanceAccept = data.isFinanceAccept;
                showInvoiceDate(isFinanceAccept);
            }
        });
        $('#search-btn').trigger("click");
        pub.showTodoTaskNumber();


    });

    function getSearchParameter(){
        var param = "";
        if($("#q-expenseNo").val()){
            param += "searchBean.expenseNo="+$("#q-expenseNo").val()+"&";
        }

        if($("#q-expenseCatalog").val()){
            param += "searchBean.expenseCatalog="+$("#q-expenseCatalog").val()+"&";
        }

        if($("#q-expressNo").val()){
            param += "searchBean.expressNo="+$("#q-expressNo").val()+"&";
        }

        if($("#q-invoiceStatus").val()){
            param += "searchBean.status="+$("#q-invoiceStatus").val()+"&";
        }

        return param;
    }


    function displayOperationByStatus(invoiceStatus, recordCount,operateFlag){
        $("#btn-batch-pay").hide();
        $("#btn-batch-repay").hide();
        $(".select-all-th").hide();
        $(".select-div-td").hide();
        $("#btn-batch-collect").hide();
        $("#btn-batch-delivery").hide();
        $("#btn-batch-receive").hide();
        if(!operateFlag){
            return;
        }
        if(INVOICE_STATUS[invoiceStatus] == "待收票"){
            $(".select-all-th").show();
            $(".select-div-td").show();
            if(recordCount > 0){
                $("#btn-batch-collect").show();
            }
        }else if(INVOICE_STATUS[invoiceStatus] == "待寄送"){
            $(".select-all-th").show();
            $(".select-div-td").show();
            if(recordCount > 0){
                $("#btn-batch-delivery").show();
            }
        }else if(INVOICE_STATUS[invoiceStatus] == "寄送中"){
            $(".select-all-th").show();
            $(".select-div-td").show();
            if(recordCount > 0){
                $("#btn-batch-receive").show();
            }
        }else if(INVOICE_STATUS[invoiceStatus] == "已签收"){

        }else if(INVOICE_STATUS[invoiceStatus] == "全部"){

        }

    }

    function globalEventBinds(){
        $("#q-invoiceStatus").change(function() {
            showInvoiceDate(isFinanceAccept);
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

        $(".cancel").bind("click", function (e) {
            $(".ex-modal").hide();
            $(".ex-modal-backdrop").remove();
        });
    }

    function showExpressTime() {
        var status = $("#q-invoiceStatus option:selected").val();
        if (status == 3) {
            $("#request-express-time-th").show();
            $(".express_update_time").show();
        } else {
            $("#request-express-time-th").hide();
            $(".express_update_time").hide();
        }
    }

    function bindSortColumn(columnHeadName, columnHeadObject, sortField){
        $(columnHeadObject).bind("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            orderField=sortField;
            reqAsc = !reqAsc;
            if (reqAsc) {
                $(this).html(columnHeadName + "&#9650;");
            } else {
                $(this).html(columnHeadName + "&#9660;");
            }
            $('#search-btn').trigger("click");
        });
    }

    function release(container) {
        $(".ex-modal-backdrop").remove();
        $(".ex-modal-backdrop-1").remove();
        container.hide();
        container.fadeOut();
    }

    function showDialog(dialog, title, content) {
        if(title){
            dialog.find(".ex-modal-title").text(title);
        }

        if(content){
            dialog.find(".ex-modal-body").html(content);
        }
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
        if (dialog.attr("id") == "msg-container") {
            setTimeout(function () {
                release($("#msg-container"));
            }, 3000);
        }

    }

    function bindDatePicker(datepicker){
        datepicker.datepicker({
            format: "yyyy-mm-dd",
            autoClose: true,
            todayBtn: true,
            language: "zh_CN",
            forceParse: false,
            todayHighlight:true
        }).on('changeDate', function(e){
            $(this).datepicker('hide');
            $("#q-invoice-begin-date").removeClass("input-warning");
            $("#q-invoice-end-date").removeClass("input-warning");
        });

        datepicker.on('click', function(e){
            if($(this).val()!=""){
                $(this).datepicker('update');
                $(this).datepicker('show');
            }
        });
    }

    function compareTwoDate(date1, date2){
        var curDate1 = new Date(date1.replace(/\-/g,"/"));
        var curDate2 = new Date(date2.replace(/\-/g,"/"));
        return (curDate1 >= curDate2);
    }

    function getDateThreeMonthAfter(strDate){
        var curDate = new Date(strDate.replace(/\-/g,"/"));
        var afterDate =new Date(curDate.setMonth(curDate.getMonth() + 4));
        var afterY=afterDate.getFullYear();
        var afterM=afterDate.getMonth();
        var afterD=afterDate.getDate();
        if(afterM==0){
            afterM=1;
        }
        if(afterM.length==1){
            afterM="0"+afterM;
        }
        if(afterD.length==1){
            afterD="0"+afterD;
        }
        afterY+="";
        afterM+="";
        afterD+="";
        if(afterM.length==1){
            afterM="0"+afterM;
        }
        if(afterD.length==1){
            afterD="0"+afterD;
        }
        return afterY + "-" + afterM + "-" + afterD;
    }

    function setDefaultDate() {
        var curDate = new Date();
        var curYear = curDate.getFullYear();
        var curMonth = curDate.getMonth()+1;
        curMonth = curMonth < 10 ? '0' + curMonth : curMonth;
        var curDay = curDate.getDate();
        curDay = curDay < 10 ? '0' + curDay : curDay;
        var invoiceEndDate = curYear + "-" + curMonth + "-" + curDay;
        $("#q-invoice-end-date").val(invoiceEndDate);

        var beforeDate = new Date();
        beforeDate.setMonth(curMonth-4);
        beforeDate.setDate(beforeDate.getDate());
        var beforeYear = beforeDate.getFullYear();
        var beforeMonth = beforeDate.getMonth()+1;
        beforeMonth = beforeMonth < 10 ? '0' + beforeMonth : beforeMonth;
        var beforeDay = beforeDate.getDate();
        beforeDay = beforeDay < 10 ? '0' + beforeDay : beforeDay;
        var invoiceBeginDate = beforeYear + "-" + beforeMonth + "-" + beforeDay;
        $("#q-invoice-begin-date").val(invoiceBeginDate);
    }

    function verifyDate() {
        var invoiceBeginDate = $("#q-invoice-begin-date").val();
        var invoiceEndDate = $("#q-invoice-end-date").val();
        if (invoiceBeginDate == "" || invoiceBeginDate == undefined || invoiceEndDate == "" || invoiceEndDate == undefined) {
            $("#q-invoice-begin-date").addClass("input-warning");
            $("#q-invoice-end-date").addClass("input-warning");
            showMsg($("#msg-container"), "请输入查询时间,并确保查询时间范围在三个月以内!");
            return false;
        }

        var maxEndDate = getDateThreeMonthAfter(invoiceBeginDate);
        if (!compareTwoDate(maxEndDate, invoiceEndDate)) {
            $("#q-invoice-begin-date").addClass("input-warning");
            $("#q-invoice-end-date").addClass("input-warning");
            showMsg($("#msg-container"), "请确保查询时间范围在三个月以内!");
            return false;
        }
        return true;
    }

    function showInvoiceDate(isFinanceAccept){
        $("#hidden-select-all-items").val("false");
        $('#select-cur-pageinfo').hide();
        $('#select-all-pageinfo').hide();
        $('#select-part-pageinfo').hide();
        $('#select-all').attr('checked', false);
        $.each($('.selected-item'), function (index, el) {
            $(el).attr('checked', false);
        });

        var status = $("#q-invoiceStatus option:selected").val();
        if(status == 3 && isFinanceAccept == 1) {
            $("#invoiceDate").hide();
        } else if(status == 0 || status == 3 || status == 4) {
            $("#invoiceDate").show();
        } else {
            $("#invoiceDate").hide();
        }
    }
});