define(function (require, exports, module) {
    var $ = require('./jquery');
    require("./jquery.tmpl");
    var ajax = require('./ajax');
    var list = require("./list");
    var option = require("./option");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var pub = require("./public");
    var workflow = require("./workflow");
    var detail = require("./detailInfo");
    require('bootstrap');
    require('./bootstrap-datepicker');
    var weekMap = {1: "(一)", 2: "(二)", 3: "(三)", 4: "(四)", 5: "(五)", 6: "(六)", 0: "(日)"};
    var reqAsc = true;
    var orderField=1;
    var lineNum = 0;
    var BUDGETTYPEID_LVYOU = 212;

    $(document).ready(function () {
        pub.activeMenu("#expensequery-menu");
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

        $("#msg-confirm").live("click", function (e) {
            $("#msg-container").hide();
            $(".ex-modal-backdrop").remove();
        });

        $(".close").live("click", function (e) {
            $(this).parent().parent().parent().parent().hide();
            $(".ex-modal-backdrop").remove();
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
            var param = "";
            if ($("#q-proposerNo").attr("result")) {
                param += "proposerNo=" + $("#q-proposerNo").attr("result") + "&";
            }
            if ($("#q-auditNo").attr("result")) {
                param += "auditNo=" + $("#q-auditNo").attr("result") + "&";
            }
            if ($("#q-department").attr("result")) {
                param += "departmentId=" + $("#q-department").attr("result") + "&";
            }
            if ($("#q-budget-subject").attr("result")) {
                param += "budgetSubject=" + $("#q-budget-subject").attr("result") + "&";
            }
            param += "orderField="+orderField+"&";
            param += "asc=" + reqAsc;
            list.init("list_model", "admin_list", "pagination_bar", "", param, "NoRowsTemplate", "admin-search", null, 1, function (data) {
                $(".recordCount").html(data.expenseSummaryInfoModel.recordCount);
                var expenseAmount = data.expenseAmount;
                $(".expenseAmount").html(expenseAmount);

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

                $(".item-body").bind("click", function () {
                    $("#empty-detail").hide();
                    $("#expense-detail").hide();
                    $(".expense-block").hide();
                    $("#relate-info").hide();
                    $("#relate-title").hide();
                    $("#relate-block").hide();
                    $("#relate-cost-block").hide();
                    $("#collapse-search-handler-relate").hide();
                    $("#attachment-block").hide();
                    $("#attachment-div").html("");
                    $("#attachment-title").hide();
                    $("#collapse-search-handler-attachment").hide();
                    $("#attachment-block").css("display","none");
                    $("#expand-search-div-attachment").css("display","");
                    $("#collapse-search-div-attachment").css("display","none");
                    $(this).parent().find(".item-body").removeClass("selected-list-row");
                    $(this).addClass("selected-list-row");

                    lineNum = $(this).parent().find("tr").index($(this)[0]);
                    var taskName = $(this).attr("taskName");
                    var taskId = $(this).attr("taskId");
                    var processId = $(this).attr("processId");
                    var expenseNo = $(this).attr("expenseNo");

                    loading.show();
                    var tasks = new Object();
                    var logs = new Object();
                    if (expenseNo.substring(0, 1) == "A") {
                        $("#audit-log").attr("catalog", 1);
                        $.ajax({
                            type: "get",
                            dataType: "json",
                            url: "/pc/overtime/detail",
                            async: false,
                            data: "processId=" + $(this).attr("processId") + "&expenseNo=" + $(this).attr("expenseNo") + "&history=false&superRight=1",
                            success: function (data) {
                                loading.hide();
                                if (data.code != 200) {
                                    $(".content-right").hide();
                                    return;
                                }
                                var expense = data.expense;
                                detail.clearDetail();
                                if(!expense){
                                    return;
                                }
                                renderExpenseBaseInfo(expense);
                                renderExpenseCostInfo(expense);
                                detail.insertOvertimeInfo(expense,$("#overtime-block"));
                                $(".content-right").show();
                                logs = data.logs;
                                tasks = data.tasks;
                            }
                        });
                    } else if(expenseNo.substring(0,1) == "C"){
                        $.ajax({
                            type: "get",
                            dataType: "json",
                            url: "/pc/normal/detail",
                            data: "processId=" + $(this).attr("processId") + "&expenseNo=" + $(this).attr("expenseNo") + "&history=false&superRight=1",
                            async: false,
                            success: function (data) {
                                loading.hide();
                                if (data.code == 500) {
                                    $(".content-right").hide();
                                    return;
                                }
                                var expense = data.expense;
                                detail.clearDetail();
                                if(!expense){
                                    return;
                                }
                                renderExpenseBaseInfo(expense);
                                renderExpenseCostInfo(expense);
                                detail.insertNormal(expense, $("#normal-block"));
                                $(".content-right").show();
                                //若是预算项目是旅游，则显示参与人明细
                                if(expense.budgetSubjectId!=BUDGETTYPEID_LVYOU){
                                    $(".expense-des-div").hide();
                                }
                                //$(".expense-des-div").hide();
                                logs = data.logs;
                                tasks = data.tasks;
                            }
                        });
                    }else if (expenseNo.substring(0, 1) == "T") {
                        $.ajax({
                            type: "get",
                            dataType: "json",
                            url: "/pc/travel/detail",
                            data: "processId=" + $(this).attr("processId") + "&expenseNo=" + $(this).attr("expenseNo") + "&history=true",
                            async: false,
                            success: function (data) {
                                loading.hide();
                                if (data.code == 500) {
                                    $(".content-right").hide();
                                    return;
                                }
                                var expense = data.expense;
                                detail.clearDetail();
                                if(!expense){
                                    return;
                                }
                                renderExpenseBaseInfo(expense);
                                renderExpenseCostInfo(expense);
                                detail.insertTravelInfo(expense,$("#travel-block"));
                                if (data.relates != null && data.relates.length == 1) {
                                    var relate = data.relates[0];
                                    renderRelateBaseInfo(relate);
                                    renderExpenseRelateCostInfo(relate);
                                    detail.insertEntertain(relate,$("#relate-block"));
                                    $("#relate-block").hide();
                                    $("#relate-cost-block").hide();
                                    $(".relate-expense-des-div").hide();
                                }
                                $(".expense-des-div").hide();
                                $(".content-right").show();
                                logs = data.logs;
                                tasks = data.tasks;
                            }
                        });
                    }
                    else if (expenseNo.substring(0, 1) == "E" || expenseNo.substring(0, 1) == "B") {
                        $.ajax({
                            type: "get",
                            dataType: "json",
                            url: "/pc/entertainment/detail",
                            data: "processId=" + $(this).attr("processId") + "&expenseNo=" + $(this).attr("expenseNo") + "&history=true",
                            async: false,
                            success: function (data) {
                                loading.hide();
                                if (data.code == 500) {
                                    $(".content-right").hide();
                                    return;
                                }
                                var expense = data.expense;
                                detail.clearDetail();
                                if(!expense){
                                    return;
                                }
                                renderExpenseBaseInfo(expense);
                                renderExpenseCostInfo(expense);
                                detail.insertEntertain(expense,$("#entertainment-block"));
                                if(data.relate && data.relate != undefined) {
                                    renderRelateBaseInfo(data.relate);
                                    renderExpenseRelateCostInfo(data.relate);
                                    detail.insertTravelInfo(data.relate,$("#relate-block"));
                                    $("#relate-block").hide();
                                    $("#relate-cost-block").hide();
                                }
                                $(".expense-des-div").hide();
                                $(".content-right").show();
                                logs = data.logs;
                                tasks = data.tasks;
                            }
                        });
                    } else if (expenseNo.substring(0, 1) == "W") {
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
                                if(!expense){
                                    return;
                                }
                                renderExpenseBaseInfo(expense);
                                renderExpenseCostInfo(expense);
                                detail.insertWelfare(expense,$("#welfare-block"));
                                //  $('#extra-info').html(insertAttachment(expense));

                                $(".content-right").show();
                                logs = data.logs;
                                tasks = data.tasks;
                            }
                        });
                    } else {
                        loading.hide();
                    }
                    workflow.draw(tasks);
                    workflow.drawLog(logs);
                    $("#expense-detail").show();
                });
                if ($(".item-body").length) {
                    lineNum = $(".item-body").length > lineNum ? lineNum : $(".item-body").length - 1;
                    $(".item-body:eq(" + lineNum + ")").trigger("click");
                }
            });
        });

        $(".cancel").bind("click", function (e) {
            $(".ex-modal").hide();
            $(".ex-modal-backdrop").remove();
        });

        $(".close").bind("click", function (e) {
            $("#reject-container").hide();
            $("#calendar-container").hide();
            $(".ex-modal-backdrop").remove();
        });
        detail.bindCalendar();

        $('#q-propose-begin-date').val(pub.getDateThreeMonthBefore(pub.getNowFormatDate()));
        $('#q-propose-end-date').val(pub.getNowFormatDate());

        $('#expand-search-div').trigger("click");

        pub.showTodoTaskNumber();
    });

    function existsOtherCondition() {
        if($("#q-expenseno").val()=="" && $("#q-proposerNo").val()=="" && $("#q-expense-catalog").val()==0
            && $("#q-budget-subject").val()=="" && $("#q-department").val()=="" && $("#q-proposerCity").val()=="" && $("#q-taskdefinitionkey").val()==0 && $("#q-auditNo").val()=="")
            return false;
        else
            return true;
    }

    function release(container) {
        $(".ex-modal-backdrop").remove();
        container.hide();
        container.fadeOut();
    }

    function renderExpenseBaseInfo(expense) {
        if(!expense){
            return;
        }
        $("#proposer-name").html(expense.proposerName);
        $("#proposer-department").html(expense.proposerDepartment);
        $("#proposer-city").html(expense.proposerCity);
        $("#proposer-tel").html(expense.proposerTel);
        $("#item-title").html(expense.expenseCatalog + "-" + expense.expenseNo);
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

    function renderRelateBaseInfo(relate){
        $("#relate-title").html("关联报销 " + relate.expenseNo);
        $("#relate-title").show();
        $("#relate-budget-subject-name").html(relate.budgetSubjectName);
        $("#relate-expense-des").html(relate.expenseReason);
        $("#collapse-search-handler-relate").show();
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
