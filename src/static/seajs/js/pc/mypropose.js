define(function (require, exports, module) {
    var $ = require('./jquery');
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
    var reqAsc = false;
    var orderField=1;
    var lineNum = 0;
    var BUDGETTYPEID_LVYOU = 212;


    $(document).ready(function () {
        pub.activeMenu("#mypropose-menu");
        //init empty table
        list.empty("todo_list", "NoRowsTemplate");
        pub.bindAutoComplete();

        pub.menuCollapseHandler();
        pub.searchCollapseHandler();
        pub.bindDatePicker( $("#q-propose-begin-date"));
        pub.bindDatePicker($("#q-propose-end-date"));
        pub.beginDateChange();
        pub.endDateChange();

        bindSortColumn("申请时间", "#request-time-th", 1);
        bindSortColumn("单据号", "#request-expenseno-th", 2);

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
            if ($("#q-requestno").attr("result")) {
                param += "requestNo=" + $("#q-requestno").attr("result") + "&";
            }
            if ($("#q-budget-subject").attr("result")) {
                param += "budgetSubject=" + $("#q-budget-subject").attr("result") + "&";
            }
            param += "orderField="+orderField+"&";
            param += "asc=" + reqAsc;
            list.init("list_model", "propose_list", "pagination_bar", "", param, "NoRowsTemplate", "propose-search", null, 1, function (data) {
                loading.hide();
                $("#expense-detail").hide();

                $(".item-body").bind("click", function () {
                    $("#empty-detail").hide();
                    $("#expense-detail").hide();
                    $(".expense-block").hide();
                    $("#relate-info").hide();
                    $("#relate-title").hide();
                    $(".operate-container").show();
                    $(this).parent().find(".item-body").removeClass("selected-list-row");
                    $(this).addClass("selected-list-row");

                    lineNum = $(this).parent().find("tr").index($(this)[0]);
                    var taskName = $(this).attr("taskName");
                    var taskId = $(this).attr("taskId");
                    var processId = $(this).attr("processId");
                    var expenseNo = $(this).attr("expenseNo");

                    $("#confirm-cancel").attr("processId", processId);
                    $("#confirm-cancel").attr("taskId", taskId);
                    $("#confirm-cancel").attr("expenseNo", expenseNo);

                    loading.show();
                    var tasks = new Object();
                    var logs = new Object();
                    if (expenseNo.substring(0, 1) == "A") {
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
                                renderExpenseBaseInfo(expense);
                                renderExpenseCostInfo(expense);
                                detail.insertTravelInfo(expense,$("#travel-block"));
                                if (data.relates != null && data.relates.length == 1) {
                                    var relate = data.relates[0];
                                    renderRelateBaseInfo(relate);
                                    renderExpenseRelateCostInfo(relate);
                                    detail.insertEntertain(relate,$("#relate-block"));
                                }
                                $(".relate-expense-des-div").hide();
                                $(".content-right").show();
                                logs = data.logs;
                                tasks = data.tasks;
                            }
                        });
                    }
                    else if (expenseNo.substring(0, 1) == "E") {
                        $.ajax({
                            type: "get",
                            dataType: "json",
                            url: "/pc/entertainment/detail",
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
                                renderExpenseBaseInfo(expense);
                                renderExpenseCostInfo(expense);
                                detail.insertEntertain(expense,$("#entertainment-block"));
                                if(data.relate && data.relate != undefined) {
                                    renderRelateBaseInfo(data.relate);
                                    renderExpenseRelateCostInfo(data.relate);
                                    detail.insertTravelInfo(data.relate,$("#relate-block"));
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

                    //showButton
                    $.ajax({
                        type: "get",
                        dataType: "json",
                        url: "/pc/expense/showRevoke",
                        async: false,
                        data: "processId=" + $(this).attr("processId"),
                        success: function (data) {
                            if (data.code == 200) {
                                $("#revoke-btn").show();
                                $(".operate-container").show();
                            }else{
                                $("#revoke-btn").hide();
                                $(".operate-container").hide();
                            }
                        }
                    });

                    workflow.draw(tasks);
                    workflow.drawLog(logs);
                    $("#expense-detail").show().trigger($.Event('resize'));
                });
                if ($(".item-body").length) {
                    lineNum = $(".item-body").length > lineNum ? lineNum : $(".item-body").length - 1;
                    $(".item-body:eq(" + lineNum + ")").trigger("click");
                }
            });
        });

        $('#q-propose-begin-date').val(pub.getDateThreeMonthBefore(pub.getNowFormatDate()));
        $('#q-propose-end-date').val(pub.getNowFormatDate());

        $("#search-btn").trigger("click");

        $(".cancel").bind("click", function (e) {
            $(".ex-modal").hide();
            $(".ex-modal-backdrop").remove();
        });

        $(".close").bind("click", function (e) {
            $("#calendar-container").hide();
            $(".ex-modal-backdrop-1").remove();
        });

        $("#cancel-cancel").bind("click", function() {
            release($("#cancel-container"));
        });

        $("#revoke-btn").bind("click", function() {
            showDialog($("#cancel-container"), "撤回", "是否确定撤回该单据？");
        });

        $("#confirm-cancel").bind("click", function() {
            var param = {};
            param.processId = $(this).attr("processId");
            param.taskId = $(this).attr("taskId");
            param.expenseNo = $(this).attr("expenseNo");
            $.ajax({
                type: "get",
                dataType: "json",
                url: "/pc/expense/cancelExpense",
                data: param,
                success: function (data) {
                    if (data.code != 200) {
                        showDialog($("#msg-container"), "错误", data.message);
                        return;
                    }
                    release($("#cancel-container"));
                    $(".operate-container").hide();
                    $("#revoke-btn").attr('disabled',"true");
                    $("#main-container").html("<div style=\"margin-top:50px; margin-left:35%;\"><div><img src=\"/expense/img/success-small.png\" style=\"vertical-align: baseline;width:30px; height:30px; position:relative; top:8px;\"><span class=\"tip-title-text\" style=\"margin-left:10px;\">撤销成功！</span></div>" +
                        "<div style=\"margin-top:10px;margin-left: 35px;\" class=\"tip-content-text\">申请已提交，请耐心等待，您可在<a href=\"/pc/expense/myresubmit\" style=\"color: #72b3e2;\">  我的待办>待提交  </a>查询。 <br> 单号：<span id=\"expense-no\" class=\"tip-content-text\">" + param.expenseNo + " </span> </div></div>");

                    $("#main-container").css("min-height", "200px");
                }
            });
        });
        detail.bindCalendar();
        
        pub.showTodoTaskNumber();
    });

    function existsOtherCondition() {
        if($("#q-expenseno").val()=="" && $("#q-requestno").val()==""
            && $("#q-budget-subject").val()=="" && $("#q-taskdefinitionkey").val()==0)
            return false;
        else
            return true;
    }


    function release(container) {
        $(".ex-modal-backdrop").remove();
        $(".ex-modal-backdrop-1").remove();
        container.hide();
        container.fadeOut();
    }

    function renderExpenseBaseInfo(expense){
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
        $("#relate-cost-block").show();
    }

    function renderRelateBaseInfo(relate){
        $("#relate-title").html("关联报销 " + relate.expenseNo);
        $("#relate-title").show();
        $("#relate-budget-subject-name").html(relate.budgetSubjectName);
        $("#relate-expense-des").html(relate.expenseReason);
        $("#relate-info").show();
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