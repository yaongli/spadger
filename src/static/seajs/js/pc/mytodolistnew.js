define(function (require, exports, module) {
    var $ = require('./jquery');
    require("./jquery.tmpl");
    //var ajax = require('./ajax');
    var list = require("./list");
    //var option = require("./option");
    var loading = require("./loading");
    //var dialog = require("./dialog");
    var pub = require("./public");
    var workflow = require("./workflow");
    var detail = require("./detailInfo.js");
    var reject_reason = require("./reject_reason.js");
    require('bootstrap');
    require('./bootstrap-datepicker');
    var weekMap = {1: "(一)", 2: "(二)", 3: "(三)", 4: "(四)", 5: "(五)", 6: "(六)", 0: "(日)"};
    var reqAsc = true;
    var orderField=1;
    var lineNum = 0;
    var BUDGETTYPEID_LVYOU = 212;
    var AUDITNODE_BUDGET = 4;
    var AUDITNODE_BUDGET_PRETRIAL = 22;
    var WOT_CATALOG_VALUE = 1;

    $(document).ready(function () {
        pub.activeMenu("#todolistnew-menu");
        pub.bindAutoComplete();
        pub.menuCollapseHandler();
        pub.searchCollapseHandler();
        pub.bindDatePicker($("#q-propose-begin-date"));
        pub.bindDatePicker($("#q-propose-end-date"));
        pub.beginDateChange();
        pub.endDateChange();

        //init empty table
        list.empty("todo_list", "NoRowsTemplate");

        bindSortColumn("申请时间", "#request-time-th", 1);
        bindSortColumn("单据号", "#request-expenseno-th", 2);

        $(".select-batch-audit").hide();
        $("#isBatchCheckbox").attr("checked", false);

        $("#msg-confirm").live("click", function (e) {
            $("#msg-container").hide();
            $(".ex-modal-backdrop").remove();
        });

        $(".close").live("click", function (e) {
            $(this).parent().parent().parent().parent().hide();
            $(".ex-modal-backdrop").remove();
        });

        $(".tab-head-item").live("click", function(e){
            if($(this).hasClass("active")){
                return;
            }
            $(".tab-head-item").removeClass("active");
            $(this).addClass("active");
            var item_index = $(this).attr("data-summary-index");
            $(".budget-summary-item").hide();
            $(".budget-summary-item").removeClass("hidden");
            $("#budget-summary-item-" + item_index).show();
        });

        function buildParameter(){
            var param = "";
            if ($("#q-requestno").attr("result")) {
                param += "requestNo=" + $("#q-requestno").attr("result") + "&";
            }
            if ($("#q-city").val()) {
                param += "city=" + $("#q-city").val() + "&";
            }
            if ($("#q-department").attr("result")) {
                param += "departmentId=" + $("#q-department").attr("result") + "&";
            }
            if ($("#q-budget-subject").attr("result")) {
                param += "budgetSubject=" + $("#q-budget-subject").attr("result") + "&";
            }

            if ($("#q-cost-department").attr("result")) {
                param += "costDepartmentId=" + $("#q-cost-department").attr("result") + "&";
            }

            if($("#invoiceEmpty").attr("checked")){
                param += "invoiceEmpty=" + true + "&";
            }


            param += "orderField="+orderField+"&";
            param += "asc=" + reqAsc;
            return param;
        }

        $(".reject-radio").bind("change", function (e) {
            $(".reject-radio").removeClass("radio-warning");
            var detail_reason = reject_reason.collect();
            if (detail_reason == "") {
                $("#detail-reason").addClass("input-warning");
            } else {
                $("#detail-reason").removeClass("input-warning");
            }
        });


        $("#q-taskdefinitionkey").bind("change", function() {
           if($(this).val()==AUDITNODE_BUDGET || $(this).val()==AUDITNODE_BUDGET_PRETRIAL){
               $("#q-cost-department").val("");
               $("#q-cost-department").removeAttr("result");
               $(".select-batch-audit").show();
           }else{
               $("#q-cost-department").val("");
               $("#q-cost-department").removeAttr("result");
               $(".select-batch-audit").hide();
           }
        });

        $("#q-budget-subject").bind("resultChange", function() {
                $("#q-cost-department").attr("param", "budgetTypeId=" + $("#q-budget-subject").attr("result"));
        });

        //search payplan list
        $('#search-btn').bind('click', function () {
            if(!existsOtherCondition() && $("#q-propose-begin-date").val()!="" && $("#q-propose-end-date").val()!="" && !pub.verifyQueryDate($("#q-propose-begin-date").val(), $("#q-propose-end-date").val())){
                showMsg($("#msg-container"), "请确认查询申请时间的范围需要在三个月之内！");
                return;
            }
            if(!existsOtherCondition() && ($("#q-propose-begin-date").val()!="" &&  $("#q-propose-end-date").val()=="")){
                showMsg($("#msg-container"), "请输入查询申请时间的截止时间，并确认时间范围在三个月之内！");
                return;
            }else if(!existsOtherCondition() && ($("#q-propose-begin-date").val()=="" &&  $("#q-propose-end-date").val()!="")){
                showMsg($("#msg-container"), "请输入查询申请时间的开始时间，并确认时间范围在三个月之内！");
                return;
            }
            lineNum = 0;
            var param = buildParameter();
            var canBatchAudit = false;

            if($("#q-cost-department").attr("result")>0){
                $("#accept-selected").attr("costDepartmentId", $("#q-cost-department").attr("result"));
            }
            if($("#q-budget-subject").attr("result")>0){
                $("#accept-selected").attr("budgetTypeId", $("#q-budget-subject").attr("result"));
            }
            if($("#q-taskdefinitionkey").val()==AUDITNODE_BUDGET || $("#q-taskdefinitionkey").val()==AUDITNODE_BUDGET_PRETRIAL){
                $("#accept-selected").attr("activityId", $("#q-taskdefinitionkey").val());
            }

            list.init("list_model", "todo_list", "pagination_bar", "", param, "NoRowsTemplate", "todo-search", null, 1, function (data) {
                $(".recordCount").html(data.expenseSummaryInfoModel.recordCount);
                loading.hide();
                $("#expense-detail").hide();
                $('.select-all').attr('checked', false);
                $('.select-div').hide();

                if (data.expenseSummaryInfoModel.recordCount == 0) {
                    $('.selected-item').hide();
                    $('.select-all').hide();
                } else {
                    $('.select-all').show();
                }

                if ($("#q-budget-subject").attr("result")>0 && $("#q-cost-department").attr("result")>0 && data.isBudgetClosed==false &&
                    ($("#q-taskdefinitionkey").val() == AUDITNODE_BUDGET_PRETRIAL || $("#q-taskdefinitionkey").val() == AUDITNODE_BUDGET)) {
                    canBatchAudit = true;
                }

                if(data.financeAudit || canBatchAudit){
                    $(".select-all-th").show();
                    $(".select-div-td").show();
                }else{
                    $(".select-all-th").hide();
                    $(".select-div-td").hide();
                }

                $(".item-body").bind("click", function () {
                    $("#empty-detail").hide();
                    $("#expense-detail").hide();
                    $(".expense-block").hide();
                    $("#relate-info").hide();
                    $("#relate-title").hide();
                    $("#relate-block").hide();
                    $("#relate-cost-block").hide();
                    $("#collapse-search-handler-attachment").hide();
                    $(".exceed-budget").hide();
                    $("#collapse-search-handler-relate").hide();
                    $("#attachment-block").hide();
                    $("#attachment-div").html("");
                    $("#attachment-title").hide();
                    $("#attachment-block").css("display","none");
                    $("#expand-search-div-attachment").css("display","");
                    $("#collapse-search-div-attachment").css("display","none");


                    $("#pass-btn").removeAttr("disabled");
                    $("#reject-btn").removeAttr("disabled");

                    $(this).parent().find(".item-body").removeClass("selected-list-row");
                    $(this).addClass("selected-list-row");

                    lineNum = $(this).parent().find("tr").index($(this)[0]);
                    var taskName = $(this).attr("taskName");
                    var taskId = $(this).attr("taskId");
                    var processId = $(this).attr("processId");
                    var expenseNo = $(this).attr("expenseNo");
                    var activity = $(this).attr("activityid");

                    $("#pass-btn").attr("processId", processId);
                    $("#pass-btn").attr("taskId", taskId);
                    $("#reject-btn").attr("processId", processId);
                    $("#reject-btn").attr("taskId", taskId);
                    $("#sign-btn").attr("processId", processId);
                    $("#sign-btn").attr("taskId", taskId);
                    if (taskName != "财务审批" && taskName != "财务一级审批" && taskName != "财务二级审批") {
                        $("#sign-btn").show();
                        $("#sign-btn").unbind("click");
                        $("#sign-btn").bind("click", function () {
                            block();
                            showDialog($("#addAudit-container"), "加签", generateSignHtml());
                            $("#confirm-add").unbind();
                            $("#confirm-add").bind("click", function () {
                                if ($("#new-audit-member").attr("result")) {
                                    var param = new Object();
                                    param.addId = $("#new-audit-member").attr("result");
                                    param.taskId = taskId ? taskId : "";
                                    param.processId = processId ? processId : "";
                                    param.signMemo = $("#sign-memo").val();
                                    block();
                                    $.ajax({
                                        type: "post",
                                        dataType: "json",
                                        url: "/pc/expense/sign",
                                        data: param,
                                        success: function (data) {
                                            release($("#new-audit-member"));
                                            if (data.code == 200) {
                                                if (data.msg.error == undefined || data.msg.error == "") {
                                                    showMsg($("#msg-container"), "该审核已加签成功");
                                                } else {
                                                    showMsg($("#msg-container"), "加签失败，" + data.msg.error);
                                                }
                                            } else {
                                                showMsg($("#msg-container"), "系统异常，请稍后再试");
                                                return;
                                            }
                                        }
                                    });
                                }
                            })
                        });
                    } else {
                        $("#sign-btn").hide();
                    }

                    loading.show();
                    var tasks = new Object();
                    var logs = new Object();
                    
                    if (expenseNo.substring(0, 1) == "A") {
                        $("#pass-btn").attr("catalog", 1);
                        $("#reject-btn").attr("catalog", 1);
                        $("#audit-log").attr("catalog", 1);
                        $.ajax({
                            type: "get",
                            dataType: "json",
                            url: "/pc/overtime/detail",
                            async: false,
                            data: "processId=" + $(this).attr("processId") + "&expenseNo=" + $(this).attr("expenseNo") + "&history=false&superRight=1&activity=" + activity,
                            success: function (data) {
                                loading.hide();
                                if (data.code != 200) {
                                    $(".content-right").hide();
                                    return;
                                }
                                var expense = data.expense;
                                detail.clearDetail();
                                renderExpenseBaseInfo(expense);
                                renderExpenseCostInfo(expense);
                                detail.insertOvertimeInfo(expense, $("#overtime-block"));
                                $(".submit-section").remove();
                                $("#operate_content").prepend(generateSubmitGeneralSummaryInfo(expense.expenseTotalAmount));
                                $(".content-right").show();
                                logs = data.logs;
                                tasks = data.tasks;
                                activity = data.activity;
                                renderBudgetInfo(expense, data.activity, data.budgetPlanClosed);
                            }
                        });
                    } else if (expenseNo.substring(0, 1) == "C") {
                        $("#pass-btn").attr("catalog", 3);
                        $("#reject-btn").attr("catalog", 3);
                        $("#sign-btn").attr("catalog", 3);
                        $.ajax({
                            type: "get",
                            dataType: "json",
                            url: "/pc/normal/detail",
                            data: "processId=" + $(this).attr("processId") + "&expenseNo=" + $(this).attr("expenseNo") + "&history=false&superRight=1&activity=" + activity,
                            async: false,
                            success: function (data) {
                                loading.hide();
                                if (data.code == 500) {
                                    $(".content-right").hide();
                                    return;
                                }
                                var expense = data.expense;
                                detail.clearDetail();
                                renderExpenseBaseInfo(expense);
                                renderExpenseCostInfo(expense);
                                detail.insertNormal(expense, $("#normal-block"));
                                //若是预算项目是旅游，则显示参与人明细
                                if(expense.budgetSubjectId!=BUDGETTYPEID_LVYOU){
                                    $(".expense-des-div").hide();
                                }
                                //$(".expense-des-div").hide();
                                var invoiceCount = 0;
                                for (var i = 0; i < expense.items.length; i++) {
                                    invoiceCount += expense.items[i].invoice;
                                }
                                $(".submit-section").remove();
                                $("#operate_content").prepend(detail.generateGeneralSummaryInfo(invoiceCount, expense.expenseTotalAmount));
                                $(".content-right").show();
                                logs = data.logs;
                                tasks = data.tasks;
                                activity = data.activity;
                                renderBudgetInfo(expense, data.activity, data.budgetPlanClosed);
                            }
                        });
                    } else if (expenseNo.substring(0, 1) == "T") {
                        $("#pass-btn").attr("catalog", 2);
                        $("#reject-btn").attr("catalog", 2);
                        $("#audit-log").attr("catalog", 2);
                        $.ajax({
                            type: "get",
                            dataType: "json",
                            url: "/pc/travel/detail",
                            data: "processId=" + $(this).attr("processId") + "&expenseNo=" + $(this).attr("expenseNo") + "&history=false&superRight=1&activity=" + activity,
                            async: false,
                            success: function (data) {
                                loading.hide();
                                if (data.code == 500) {
                                    $(".content-right").hide();
                                    return;
                                }
                                var expense = data.expense;
                                detail.clearDetail();
                                renderExpenseBaseInfo(expense);
                                renderExpenseCostInfo(expense);
                                detail.insertTravelInfo(expense, $("#travel-block"));
                                var invoiceTotal = parseInt(expense.hotelInvoice) + parseInt(expense.interCityInvoice) + parseInt(expense.localInvoice) + parseInt(expense.mealInvoice);
                                $(".submit-section").remove();
                                $("#operate_content").prepend(detail.generateGeneralSummaryInfo(invoiceTotal, expense.totalAmount));
                                if (data.relates != null && data.relates.length == 1) {
                                    var relate = data.relates[0];
                                    renderRelateBaseInfo(relate);
                                    renderExpenseRelateCostInfo(relate);
                                    detail.insertEntertain(relate, $("#relate-block"));
                                    $("#relate-block").hide();
                                    $("#relate-cost-block").hide();
                                }
                                $(".relate-expense-des-div").hide();
                                $(".content-right").show();
                                logs = data.logs;
                                tasks = data.tasks;
                                activity = data.activity;
                                renderBudgetInfo(expense, data.activity, data.budgetPlanClosed);
                            }
                        });
                    }
                    else if (expenseNo.substring(0, 1) == "E") {
                        $("#pass-btn").attr("catalog", 6);
                        $("#reject-btn").attr("catalog", 6);
                        $("#audit-log").attr("catalog", 6);
                        $.ajax({
                            type: "get",
                            dataType: "json",
                            url: "/pc/entertainment/detail",
                            data: "processId=" + $(this).attr("processId") + "&expenseNo=" + $(this).attr("expenseNo") + "&history=false&superRight=1&activity=" + activity,
                            async: false,
                            success: function (data) {
                                loading.hide();
                                if (data.code == 500) {
                                    $(".content-right").hide();
                                    return;
                                }
                                var expense = data.expense;
                                detail.clearDetail();
                                renderExpenseBaseInfo(expense);
                                renderExpenseCostInfo(expense);
                                detail.insertEntertain(expense, $("#entertainment-block"));
                                $(".submit-section").remove();
                                $("#operate_content").prepend(detail.generateGeneralSummaryInfo(expense.invoiceCount, expense.totalAmount));
                                if (data.relate && data.relate != undefined) {
                                    renderRelateBaseInfo(data.relate);
                                    renderExpenseRelateCostInfo(data.relate);
                                    detail.insertTravelInfo(data.relate, $("#relate-block"));
                                    $("#relate-block").hide();
                                    $("#relate-cost-block").hide();
                                }
                                $(".expense-des-div").hide();
                                $(".content-right").show();
                                logs = data.logs;
                                tasks = data.tasks;
                                activity = data.activity;
                                renderBudgetInfo(expense, data.activity, data.budgetPlanClosed);
                            }
                        });
                    } else if (expenseNo.substring(0, 1) == "W") {
                        $("#pass-btn").attr("catalog", 8);
                        $("#reject-btn").attr("catalog", 8);
                        $("#audit-log").attr("catalog", 8);
                        $.ajax({
                            type: "get",
                            dataType: "json",
                            url: "/pc/welfare/detail",
                            async: false,
                            data: "processId=" + $(this).attr("processId") + "&expenseNo=" + $(this).attr("expenseNo") + "&history=false&superRight=1",
                            success: function (data) {
                                loading.hide();
                                if (data.code == 500) {
                                    $(".content-right").hide();
                                    return;
                                }
                                var expense = data.expense;
                                detail.clearDetail();
                                renderExpenseBaseInfo(expense);
                                renderExpenseCostInfo(expense);
                                detail.insertWelfare(expense, $("#welfare-block"));
                                $(".submit-section").remove();
                                $("#operate_content").prepend(generateSubmitGeneralSummaryInfo(expense.expenseTotalAmount));
                                //$('#extra-info').html(insertAttachment(expense));

                                $(".content-right").show();
                                logs = data.logs;
                                tasks = data.tasks;
                                activity = data.activity;
                                renderBudgetInfo(expense, data.activity, data.budgetPlanClosed);
                            }
                        });
                    } else if (expenseNo.substring(0, 1) == "B") {
                        $("#pass-btn").attr("catalog", 9);
                        $("#reject-btn").attr("catalog", 9);
                        $("#audit-log").attr("catalog", 9);
                        $.ajax({
                            type: "get",
                            dataType: "json",
                            url: "/pc/entertainment/detail",
                            data: "processId=" + $(this).attr("processId") + "&expenseNo=" + $(this).attr("expenseNo") + "&history=false&superRight=1&activity=" + activity,
                            async: false,
                            success: function (data) {
                                loading.hide();
                                if (data.code == 500) {
                                    $(".content-right").hide();
                                    return;
                                }
                                var expense = data.expense;
                                detail.clearDetail();
                                renderExpenseBaseInfo(expense);
                                renderExpenseCostInfo(expense);
                                detail.insertEntertain(expense, $("#entertainment-block"));
                                $(".submit-section").remove();
                                $("#operate_content").prepend(detail.generateGeneralSummaryInfo(expense.invoiceCount, expense.totalAmount));
                                if (data.relate && data.relate != undefined) {
                                    renderRelateBaseInfo(data.relate);
                                    renderExpenseRelateCostInfo(data.relate);
                                    detail.insertTravelInfo(data.relate, $("#relate-block"));
                                    $("#relate-block").hide();
                                    $("#relate-cost-block").hide();
                                }
                                $(".expense-des-div").hide();
                                $(".content-right").show();
                                logs = data.logs;
                                tasks = data.tasks;
                                activity = data.activity;
                                renderBudgetInfo(expense, data.activity, data.budgetPlanClosed);
                            }
                        });
                    } else {
                        loading.hide();
                    }
                    workflow.draw(tasks);
                    workflow.drawLog(logs);

                    $("#expense-detail").show().trigger($.Event('resize'));

                    $.ajax({
                        type: "get",
                        dataType: "json",
                        url: "/pc/expense/exceedBudget",
                        async: false,
                        data: "expenseNo="+ $(this).attr("expenseNo") + "&activity=" + activity,
                        success: function (data) {
                            if(data.code == 200){
                                if(data.exceedBudget && data.exceedBudget == true){
                                    $(".exceed-budget").show();
                                }
                            }
                        }
                    });
                });
                if ($(".item-body").length) {
                    lineNum = $(".item-body").length > lineNum ? lineNum : $(".item-body").length - 1;
                    $(".item-body:eq(" + lineNum + ")").trigger("click");
                }
            });
        });



        $('#q-propose-begin-date').val(pub.getDateThreeMonthBefore(pub.getNowFormatDate()));
        $('#q-propose-end-date').val(pub.getNowFormatDate());

        $('#search-btn').trigger("click");


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
        //勾选全部
        $('.select-all').live('click', function (e) {
            e.stopPropagation();
            var selectedNum = 0;
            var checked = $('.select-all')[0].checked;
            $.each($('.selected-item'), function (index, el) {
                $(el).attr('checked', checked);
                selectedNum++;
            });

            if (checked) {
                $('.select-div').show();
                $('.select-info-hightlight').text(selectedNum);
            } else {
                $('.select-div').hide();
            }
        });

        $("#accept-selected").live("click", function () {
            var acceptIds = "";
            var selectedNum = 0;
            var selectedAmount = 0;
            $.each($('.selected-item'), function (index, el) {
                if ($(el).attr('checked') == "checked") {
                    acceptIds += $(el).attr('taskId') + ","
                    selectedNum++;
                    var payAmount = $(el).attr('payAmount');
                    if(payAmount){
                        payAmount = payAmount.split(",").join("")
                        selectedAmount += parseFloat(payAmount);
                    }
                }
            });
            var actualSelectedAmount = selectedAmount;
            selectedAmount=pub.formatMoney(selectedAmount, 2);
            if(acceptIds==""){
                showDialog($("#msg-container"), "提示", "请先选择单据，再批量审批！");
                return;
            }

            var isExceed = false;
            var exceedAmount = 0;
            if($(this).attr("activityId") == AUDITNODE_BUDGET || $(this).attr("activityId")==AUDITNODE_BUDGET_PRETRIAL){
                $.ajax({
                    type: "get",
                    dataType: "json",
                    url: "/pc/expense/verifyExceedBudget",
                    data: "totalAmount=" + actualSelectedAmount + "&budgetTypeId=" + $(this).attr("budgetTypeId")+ "&costDepartmentId=" + $(this).attr("costDepartmentId"),
                    async: false,
                    success: function (data) {
                        if(data.code != 200){
                            showDialog($("#msg-container"), "错误", data.message);
                        }else {
                            if(data.isExceed){
                                isExceed = true;
                                exceedAmount = data.exceedAmount;
                            }
                        }
                    }
                });
            }

            var message = "<div style=\"position:relative; margin-top:10px; left:15%;\"><div><img src=\"/expense/img/yellow-warning.png\" style=\"vertical-align: baseline;width:30px; height:30px; position:relative; top:8px;\"><span class=\"tip-title-text\" style=\"margin-left:10px;\">确认批量通过？</span></div>" +
                "<div style=\"margin-top:10px;margin-left: 40px;\" class=\"tip-content-text\">单据总计 " + selectedNum +
                " 条<br> 金额总计 " + selectedAmount + " 元</div>" +
                (isExceed ? ("<div style=\"margin-top:10px;color: red;\" class=\"tip-content-text\">此批次审批总金额超出预算，<br>超出金额: " + pub.formatMoney(exceedAmount, 2)) : "") +
                "</div>";

            showDialog($("#batch-action-container"), "", message);

            $("#batch-confirm").unbind("click");
            $("#batch-confirm").removeAttr('disabled');
            $("#batch-confirm").bind("click", function(){
                $(this).attr('disabled',"true");
                $.ajax({
                    type: "get",
                    dataType: "json",
                    url: "/pc/expense/batchAccept",
                    data: "acceptIds=" + acceptIds,
                    success: function (data) {
                        release($("#batch-action-container"));
                        if(data.code != 200){
                            showDialog($("#msg-container"), "错误", data.message);
                        }else {
                            message = "您已成功审批通过<span style=\"color: #ff8800; font-weight:900;\"> " + data.msg.correctNum + " </span>单，失败<span style=\"color: #ff8800; font-weight:900;\"> " + data.msg.errorNum + " </span>单。";
                            showDialog($("#msg-container"), "批量通过结果", message);
                        }
                        list.curPage();
                    }
                });
            });
        });


        //pass
        $("#pass-btn").bind("click", function () {
            var param = {};
            param.processId = $(this).attr("processId");
            param.taskId = $(this).attr("taskId");
            param.action = 1;
            var auditUrl;
            var catalog = $(this).attr("catalog");
            if (catalog == 1) {
                auditUrl = "/pc/overtime/audit";
            } else if (catalog == 2) {
                auditUrl = "/pc/travel/audit";
            } else if (catalog == 3) {
                auditUrl = "/pc/normal/audit";
            } else if (catalog == 6) {
                auditUrl = "/pc/entertainment/audit";
            } else if (catalog == 8) {
                auditUrl = "/pc/welfare/audit";
            } else if (catalog == 9) {
                auditUrl = "/pc/entertainment/audit";
            }
            $("#pass-btn").attr('disabled',"true");
            $("#reject-btn").attr('disabled',"true");
            $.ajax({
                type: "post",
                dataType: "json",
                url: auditUrl,
                data: param,
                success: function (data) {
                    if (data.code != 200) {
                        showDialog($("#msg-container"), "错误", data.message);
                        return;
                    }
                    $("#pass-detail").html("通过成功");
                    $("#pass-msg").show();
                    var rightWidth = ($(".content-right").width() - 200) / 2;
                    $("#pass-msg").css("right", rightWidth + "px");
                    $("#pass-msg").fadeOut(1000);
                    setTimeout(function () {
                        $("#pass-btn").removeAttr("disabled");
                        $("#reject-btn").removeAttr("disabled");
                        list.curPage();
                    }, 2000);
                }
            });
        });

        //reject
        $("#confirm-reject").bind("click", function () {
            $("#pass-btn").attr('disabled',"true");
            $("#reject-btn").attr('disabled',"true");
            var rejectReason = reject_reason.collect();
            if (rejectReason == "") {
                $("#detail-reason").addClass("input-warning");
                return;
            }
            var auditUrl;
            var catalog = $(this).attr("catalog");
            if (catalog == 1) {
                auditUrl = "/pc/overtime/audit";
            } else if (catalog == 2) {
                auditUrl = "/pc/travel/audit";
            } else if (catalog == 3) {
                auditUrl = "/pc/normal/audit";
            } else if (catalog == 6 || catalog == 9) {
                auditUrl = "/pc/entertainment/audit";
            } else if (catalog == 8) {
                auditUrl = "/pc/welfare/audit";
            }
            var param = {};
            param.processId = $(this).attr("processId");
            param.taskId = $(this).attr("taskId");
            param.action = 2;
            param.memo = rejectReason;
            $.ajax({
                type: "post",
                dataType: "json",
                url: auditUrl,
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
                            $("#pass-btn").removeAttr("disabled");
                            $("#reject-btn").removeAttr("disabled");
                        });
                        return;
                    }
                    $("#pass-detail").html("驳回成功");
                    $("#pass-msg").show();
                    var rightWidth = ($(".content-right").width() - 200) / 2;
                    $("#pass-msg").css("right", rightWidth + "px");
                    $("#pass-msg").fadeOut(1000);
                    setTimeout(function () {
                        $("#pass-btn").removeAttr("disabled");
                        $("#reject-btn").removeAttr("disabled");
                        list.curPage();
                    }, 2000);
                }
            });
        });

        $("#reject-btn").bind("click", function (e) {
            $("#confirm-reject").attr("catalog", $(this).attr("catalog"));
            var bodyHtml = reject_reason.render();
            showDialog($("#reject-container"), "驳回原因", bodyHtml);
            $("#confirm-reject").removeAttr("taskId");
            $("#confirm-reject").removeAttr("processId");
            $("#confirm-reject").attr("taskId", $(this).attr("taskId"));
            $("#confirm-reject").attr("processId", $(this).attr("processId"));
            $(".reject-radio").bind("change", function (e) {
                $(".reject-radio").removeClass("radio-warning");
                if (reject_reason.collect() == "") {
                    $("#detail-reason").addClass("input-warning");
                } else {
                    $("#detail-reason").removeClass("input-warning");
                }
            });
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

        $(".cancel").bind("click", function (e) {
            $(".ex-modal").hide();
            $(".ex-modal-backdrop").remove();
            $("#pass-btn").removeAttr("disabled");
            $("#reject-btn").removeAttr("disabled");
        });

        $(".close").bind("click", function (e) {
            $("#reject-container").hide();
            $("#calendar-container").hide();
            $(".ex-modal-backdrop").remove();
            $("#pass-btn").removeAttr("disabled");
            $("#reject-btn").removeAttr("disabled");
        });
        detail.bindCalendar();

        $("#confirm-budget-summary").unbind("click");
        $("#confirm-budget-summary").bind("click", function (e) {
            release($("#budget-summary-container"));
        });


        $("#budget-summary-btn").bind("click", function (e) {
            block();
            var code = $(this).attr("code");
            if(code == 200){
                showDialog($("#budget-summary-container"), "", "");
                return;
            }
            var budgetTypeId = $(this).attr("budgetTypeId");
            var budgetYear = $(this).attr("budgetYear");
            var budgetMonth = $(this).attr("budgetMonth");
            var costDepartmentId = $(this).attr("costDepartmentId");
            var param = new Object();
            param.budgetTypeId = budgetTypeId;
            param.budgetYear = budgetYear;
            param.budgetMonth = budgetMonth;
            param.expenseNo = $(this).attr("expenseNo");
            param.activityId = $(this).attr("activityId");
            $.ajax({
                type: "post",
                dataType: "json",
                url: "/pc/expense/budgetSummary",
                data:  param,
                success: function (data) {
                    if (data.code == 200) {
                        var budgetSummaryHtml = $('#budget-summary-content-template').tmpl(data);
                        showDialog($("#budget-summary-container"), $("#budget-subject-name").text(), budgetSummaryHtml);
                    } else if (data.code == 403) {
                        showMsg($("#msg-container"),  "您没有查看该预算的权限！");
                    } else {
                        showMsg($("#msg-container"),  "系统异常，请稍后再试！");
                    }
                }
            });
        });

        pub.showTodoTaskNumber();

        $("#q-expense-catalog").bind("change", function() {
            if($("#q-expense-catalog").val() == WOT_CATALOG_VALUE){
                $("#invoiceEmpty").attr("checked", false);
                $("#invoice-empty").show();
            }else{
                $("#invoiceEmpty").attr("checked", false);
                $("#invoice-empty").hide();
            }
        });

    });

    function renderBudgetInfo(expense, activityId, budgetPlanClosed){
        try {
            if("一般报销" == expense.expenseCatalog || "业务招待费报销" == expense.expenseCatalog || "差旅费报销" == expense.expenseCatalog || "商企通核销" == expense.expenseCatalog){
                if (budgetPlanClosed) {
                    $("#pass-btn").hide();
                    $("#tip").show();
                } else {
                    $("#pass-btn").show();
                    $("#tip").hide();
                }

                $("#budget-summary-container").find(".ex-modal-body").html("");
                $("#budget-summary-container").find(".ex-modal-title").text("");
                $("#budget-summary-btn").attr("code", "");
                var costDepartmentIds = [];
                $(expense.costItems).each(function(index, item){costDepartmentIds.push(item.costDepartmentId)});
                $("#budget-summary-btn").attr("costDepartmentIds", costDepartmentIds.join(","));
                $("#budget-summary-btn").attr("budgetTypeId", expense.budgetSubjectId);
                var budgetYear = (new Date()).getFullYear();
                var budgetMonth = (new Date()).getMonth() + 1;
                try{
                    var executeDate = expense.proposeDate || expense.items[0].time || expense.items[0].date;
                    if(!!executeDate){
                        budgetYear = executeDate.substring(0,4);
                        budgetMonth = executeDate.substring(5,7);
                    }
                }catch(ignore){
                }

                $("#budget-summary-btn").attr("budgetYear", budgetYear);
                $("#budget-summary-btn").attr("budgetMonth", budgetMonth);
                $("#budget-summary-btn").attr("expenseno", expense.expenseNo);
                $("#budget-summary-btn").attr("activityId", activityId);
                var budgetTypeId = expense.budgetSubjectId;
                $.ajax({
                    type: "get",
                    dataType: "json",
                    url: "/pc/expense/processedSummary",
                    data: "budgetSubject=" + budgetTypeId,
                    success: function (data) {
                        var totalProcessedAmount = data.totalAmount;
                        if(!totalProcessedAmount){
                            totalProcessedAmount = "0";
                        }
                        totalProcessedAmount = pub.formatMoney(totalProcessedAmount,2);
                        $("#pass-num").html(data.totalCount);
                        $("#pass-amount").html(totalProcessedAmount);
                        $("#pass-num-2").html(data.totalCount);
                        $("#pass-amount-2").html(pub.formatMoney(totalProcessedAmount, 2));
                    },
                    error: function (data){
                        console.log(data);
                    }
                });

                var param = new Object();
                param.budgetTypeId = budgetTypeId;
                param.budgetYear = budgetYear;
                param.budgetMonth = budgetMonth;
                param.expenseNo = expense.expenseNo;
                param.activityId = activityId;
                $.ajax({
                    type: "post",
                    dataType: "json",
                    url: "/pc/expense/budgetSummary",
                    data:  param,
                    success: function (data) {
                        if (data.code == 200) {
                            $("#budget-summary-btn").show();
                            var budgetSummaryHtml = $('#budget-summary-content-template').tmpl(data);
                            $("#budget-summary-container").find(".ex-modal-body").html(budgetSummaryHtml);
                            $("#budget-summary-container").find(".ex-modal-title").text($("#budget-subject-name").text());
                            $("#budget-summary-btn").attr("code", 200);

                        } else if (data.code == 403) {
                            $("#budget-summary-btn").hide();
                        }
                    }
                });
            } else{
                $("#budget-summary-btn").hide();
                $("#pass-btn").show();
                $("#tip").hide();
            }
        }catch(e){
            console.log("ERROR:");
            console.log(e);
        }
    }

    function existsOtherCondition() {
        if($("#q-expenseno").val()=="" && $("#q-requestno").val()=="" && $("#q-expense-catalog").val()==0
        && $("#q-budget-subject").val()=="" && $("#q-department").val()=="" && $("#q-city").val()=="")
            return false;
        else
            return true;
    }

    function release(container) {
        $(".ex-modal-backdrop").remove();
        container.hide();
        container.fadeOut();
        $("#pass-btn").removeAttr("disabled");
        $("#reject-btn").removeAttr("disabled");
    }

    function renderExpenseBaseInfo(expense) {
        $("#proposer-name").html(expense.proposerName);
        $("#proposer-department").html(expense.proposerDepartment);
        $("#proposer-city").html(expense.proposerCity);
        $("#proposer-tel").html(expense.proposerTel);
        $("#item-title").html(expense.expenseCatalog + "-" + expense.expenseNo + "&nbsp");
        $("#propose-date").html("(" + expense.proposeDate + ")");
        $("#budget-subject-name").html(expense.budgetSubjectName);
        if(expense.expenseReason && expense.expenseReason != undefined){
            $("#expense-des").html($("#x").text(expense.expenseReason).html().replace(/[\r\n]/g,"<br>"));
        }else{
            $("#expense-des").html("");
        }
    }

    function renderExpenseCostInfo(expense){
        detail.insertCost(expense.costItems, $("#cost-block"));
    }

    function renderExpenseRelateCostInfo(expense){
        detail.insertCost(expense.costItems, $("#relate-cost-block"));
    }

    function generateSignHtml(){
        return  "<div style='margin-bottom: 15px'><div style='display: inline-block;width: 30%;vertical-align: top;text-align: right;box-sizing: border-box;padding-right: 10px;'>加签人员：  </div>" +
            "<input type=\"text\" id=\"new-audit-member\" style=\"width:50%;\" class=\"txt-ex-form autocomplete\" placeholder='请输入名字或工号' suggest-url=\"/expense/realNameSuggest\"></div>" +
            "<div><div style='display: inline-block;width: 30%;vertical-align: top;text-align: right;box-sizing: border-box;padding-right: 10px;'>加签原因：  </div><textarea style='width: 50%;min-height: 100px;box-sizing: border-box' id=\"sign-memo\"></textarea></div>";
    }

    function generateSubmitGeneralSummaryInfo(amount){
        return "<div type=\"text\" class=\"submit-section\" style=\"border-top: 1px solid #eee;\">" +
            "<div style=\"width: 50%; float: right; padding: 10px 0;margin-left: 10px;text-aign:right;\">" +
            "<span class=\"bottominfo-key\">报销金额总计：</span>" +
            "<span class=\"total-amount bottominfo-value\">" + amount + "</span>" +
            "<span class=\"bottominfo-value\">元</span>" + "</div></div>";
    }

    function renderRelateBaseInfo(relate){
        $("#relate-title").html("关联报销 " + relate.expenseNo);
        $("#relate-title").show();
        $("#relate-budget-subject-name").html(relate.budgetSubjectName);
        $("#relate-expense-des").html(relate.expenseReason);
        $("#collapse-search-handler-relate").show();
    }

    function showDialog(dialog, title, content) {
        if (title != "") {
             dialog.find(".ex-modal-title").text(title);
        }
        if(content != ""){
            dialog.find(".ex-modal-body").html(content);
        }
        dialog.show();
        dialog.css({"position": "fixed"});
        dialog.css({"top": "10px"});
        dialog.css({"left": Math.max(0, (($(window).width() - dialog.width()) / 2) +
        $(window).scrollLeft()) + "px"});
        var maskHtml = '<div class="ex-modal-backdrop"></div>';
        $(maskHtml).prependTo(document.body);
        $(function () { $("[data-toggle='tooltip']").tooltip({"html" : true}); });
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

    function bindSortColumn(columnHeadName, columnHeadObject, sortField) {
        $(columnHeadObject).bind("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            orderField = sortField;
            reqAsc = !reqAsc;
            if (reqAsc) {
                $(this).html(columnHeadName + "&#9650;");
            } else {
                $(this).html(columnHeadName + "&#9660;");
            }
            $('#search-btn').trigger("click");
        });
    }
});
