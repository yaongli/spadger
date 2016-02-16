define(function (require, exports, module) {
    var $ = require('./jquery');
    var ajax = require('./ajax');
    var list = require("./list");
    var option = require("./option");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var pub = require("./public");
    //require("./bootstrap-submenu");
    require('bootstrap');
    require('./bootstrap-datepicker');
    var selectBudgetTypeId = 0;
    var selectExpenseNo = "";
    var selectProcessId = "";
    var selectTaskId = "";
    var budgetTypeIds = new Array();
    var departments = Object();
    var departTree = Object();
    var isInclude = false;
    var BUDGETTYPEID_LVYOU = 212;
    var isNeedConfirm = false;
    var tips = "";

    $(document).ready(function () {
        window.onbeforeunload = onbeforeunload_handler;

        pub.activeMenu("#normalformnew-menu");
        pub.bindAutoComplete();
        bindGlobalEvents();
        bindModalEvents();

        setMaxDate();

        $("#new-detail-item").trigger("click");
        $("#new-cost-item").trigger("click");
        var init = true;
        if (location.href.indexOf("?") != -1) {
            var paramStr = location.href.substr(location.href.indexOf("?") + 1);
            var params = paramStr.split("&");
            if (params.length == 2 && params[0].substr(0, params[0].indexOf("=")) == "expenseNo") {
                var expenseNo = params[0].substring(params[0].indexOf("=") + 1, params[0].length);
                if (expenseNo && expenseNo != undefined && expenseNo.substring(0, 1) == "C") {
                    selectExpenseNo = expenseNo;
                    init = false;
                }
                var activity = params[1].substring(params[1].indexOf("=") + 1, params[1].length);
                if (!activity || activity == undefined || activity == "") {
                    init = true;
                }
            }
        }
        initBudgetType();
        $("#budget-subject").bind("resultChange", function () {
            var budgetTypeId = $("#budget-subject").val();
            if(budgetTypeId){
                initExpenseType(budgetTypeId);
            }
        });
        if (init) {
            $("#span-save").html("保存草稿");
            initBaseInfo(false, "");
        } else {
            $("#span-save").html("保存草稿");
            initExpense(selectExpenseNo, activity);
        }

        $(function () { $("[data-toggle='tooltip']").tooltip({"html" : true}); });

        pub.showTodoTaskNumber();
        $("#budget-subject-btn").focus();
    });



    function setMaxDate(){
        var now = new Date();
        var month = (now.getMonth() + 1);
        var day = now.getDate();
        if(month < 10)
            month = "0" + month;
        if(day < 10)
            day = "0" + day;
        var today = now.getFullYear() + '-' + month + '-' + day;
        $(".ex-date").attr("max", today);
    }

    function initExpense(expenseNo, activity) {
        $.ajax({
            type: "get",
            dataType: "json",
            url: "/pc/normal/detail",
            data: "expenseNo=" + expenseNo + "&activity=" + activity,
            async: false,
            success: function (data) {
                loading.hide();
                if (data.code == 500) {
                    $("#main-container").html("  <div style=\"top: 30%; margin-left:35%;\">" +
                    "<div style=\"margin-top:10px;font-size: 18px;\">啊哦！服务器打了个盹~</div></div>");
                    $("#main-container").css("min-height", "200px");
                    return;
                } else if (data.code == 403) {
                    $("#main-container").html("  <div style=\"top: 30%; margin-left:35%;\">" +
                    "<div style=\"margin-top:10px;font-size: 18px;\">您没有权限查看此单据！</div></div>");
                    $("#main-container").css("min-height", "200px");
                    return;
                }
                var expense = data.expense;
                var rejectReason = data.rejectReason;
                var activity = data.activity;
                selectProcessId = data.processId;
                selectTaskId = data.taskId;
                initBaseInfo(false, expense.proposerNo);
                fillBaseInfo(expense);
                if (activity && data.processId && data.processId != "") {
                    if(activity == "waitForResubmit"){ //驳回
                        $("#reason-detail").html("&nbsp;&nbsp;<input  type='image' style='width: 20px;vertical-align: top' src='/img/icon-warning.png'/> "+ rejectReason);
                        $("#refuse-message").show();
                        $("#submit-btn span").text("重新提交");
                        $("#save-btn").hide();
                        $("#stop-btn").show();
                    }else if(activity == "expenseRecalled"){//撤销
                        $("#reason-detail").text(rejectReason);
                        $("#refuse-message").hide();
                        $("#submit-btn span").text("重新提交");
                        $("#save-btn").hide();
                        $("#stop-btn").show();
                    }
                }
            }
        });
    }

    function fillBaseInfo(expense) {
        var budgetSubjectID = expense.budgetSubjectId;
        selectBudgetTypeId = expense.budgetSubjectId;
        var budgetSubjectName = expense.budgetSubjectName;
        var costItems = expense.costItems;
        var items = expense.items;
        var expenseReason = expense.expenseReason;
        var total_expense_amount = expense.expenseTotalAmount;
        var amount_value = expense.totalAmountValue;
        var budgetList = $("#budget-subject").find("option");
        for (var i = 0; i< budgetList.length; i++) {
            if (budgetList[i].value == budgetSubjectID) {
                $("#budget-subject").val(budgetSubjectID);
                break;
            }
        }
        if ($("#budget-subject").val() != budgetSubjectID) {
            //$("#budget-subject option[value='-1']").remove();
            //$("#budget-subject").append("<option value=\"" + budgetSubjectID + "\">" + budgetSubjectName + "</option>");
            //$("#budget-subject").append("<option value=\"-1\">更多...</option>");
            $("#budget-subject").val(budgetSubjectID);
            $("#budget-subject-name").text(budgetSubjectName);
            budgetTypeIds.push(budgetSubjectID);
        }

        $("#budget-subject").trigger("resultChange");
        if(budgetSubjectID==BUDGETTYPEID_LVYOU){
            $("#participant-des").val(expenseReason);
            $("#baseinfo-div").css("min-height", "160px");
            $("#participant-div").show();
            $("#warning-travel").show();
        }

        for (var i = 0; i < items.length; i++) {
            if (i != 0) {
                $("#new-detail-item").trigger("click");
            }
            $(".item-detail .ex-type").each(function (index, value) {
                if ($(value).val() == 0) {
                    $(value).val(items[i].expenseTypeId);
                    $(value).trigger("change");
                }
            });
            $(".item-detail .ex-date").each(function (index, value) {
                if ($(value).val() == "") {
                    $(value).val(items[i].date);
                }
            });
            //业务交流+餐费
            var presentNumber = ""
            if($("#budget-subject").val() == 197 && items[i].expenseTypeId == 26 ){
                var desc = items[i].des
                try {
                    if (/参与人数:\d+;/.test(desc)) {
                        var splitIndex = desc.indexOf(";")
                        items[i].des = desc.substring(splitIndex+1)
                        presentNumber = desc.substring(0, splitIndex).split(":")[1]
                        $(".item-detail .people-no").each(function (index, value) {
                            if ($(value).val() == "") {
                                $(value).val(presentNumber);
                            }
                        });
                    }
                }catch(e){
                    console.log(e)
                }
            }

            $(".item-detail .ex-desc").each(function (index, value) {
                if ($(value).val() == "") {
                    $(value).val(items[i].des);
                }
            });
            $(".item-detail .ex-amount").each(function (index, value) {
                if ($(value).val() == "") {
                    $(value).val(parseFloat(items[i].amount).toFixed(2));
                }
            });
            $(".item-detail .invoice-count").each(function (index, value) {
                if ($(value).val() == "") {
                    $(value).val(items[i].invoice);
                }
            });
        }
        var invoice_counts = 0;
        $(".item-detail .invoice-count").each(function (index, value) {
            invoice_counts += parseInt($(value).val());
        });
        $("#total-invoice-count").html(invoice_counts);
        $("#total-amount").html(pub.formatMoney(total_expense_amount, 2));
        $("#total-amount").attr("amount", parseFloat(amount_value).toFixed(2));

        for (var i = 0; i < costItems.length; i++) {
            if (i != 0) {
                $("#new-cost-item").trigger("click");
            }
            $(".cost-detail .cost-department").each(function (index, value) {
                if (index == i) {
                    $(value).val(costItems[i].costDepartment);
                    $(value).attr("result", costItems[i].costDepartmentId);
                    $(value).attr("param", "budgetTypeId=" + budgetSubjectID);
                }
            });
            $(".cost-detail .cost-city").each(function (index, value) {
                if (index == i) {
                    $(value).val(costItems[i].costCity);
                    $(value).attr("result", costItems[i].costCityId);
                }
            });
            $(".cost-detail .cost-rate").each(function (index, value) {
                if (index == i) {
                    $(value).val(parseFloat(costItems[i].costRate * 100).toFixed(0));
                }
            });
            $(".cost-detail .cost-amount").each(function (index, value) {
                if (index == i) {
                    $(value).val(parseFloat(costItems[i].costAmount).toFixed(2));
                }
            });
        }
    }

    function bindGlobalEvents() {
        pub.menuCollapseHandler();
        pub.searchCollapseHandler();

        $("#close-message").bind("click", function () {
            document.getElementById("refuse-message").style.display = "none"
        });

        $("#new-detail-item").bind("click", function () {
            var errorMsg = validateItemDetail();
            copyNormalModal();
            pub.bindDatePicker( $(".ex-date"));
            bindDetailEvents();
        });

        $("#new-cost-item").bind("click", function () {
            $(this).css("border", "none");
            var errorMsg = validateCostDetail(false);
            copyCostModal();
            bindDetailEvents();
        });

        $("#stop-btn").unbind("click");
        $("#stop-btn").bind("click", function (e) {
            showMsg($("#submit-container"), "终止后此单对应纸质发票上的单据号将无效，是否确认终止该报销？");
            $("#confirm-submit").unbind();
            $("#confirm-submit").bind("click", function (e) {
                var param = new Object();
                param.expenseNo = selectExpenseNo;
                if (selectProcessId && selectProcessId != "") {
                    param.processId = selectProcessId;
                }
                if (selectTaskId && selectTaskId != "") {
                    param.taskId = selectTaskId;
                }
                param.action = 4;
                $.ajax({
                    type: "post",
                    dataType: "json",
                    url: "/pc/normal/revoke",
                    data: param,
                    success: function (data) {
                        $("#submit-container").hide();
                        $(".ex-modal-backdrop").remove();
                        $("#refuse-message").remove();
                        $("#main-container").html("  <div style=\"margin-top:50px; margin-left:35%;\"><div><img src=\"/expense/img/success-small.png\" style=\"vertical-align: baseline;width:30px; height:30px; position:relative; top:8px;\"><span class=\"tip-title-text\" style=\"margin-left:10px;\">终止成功！</span></div>" +
                        "<div style=\"margin-top:10px;margin-left: 35px;\" class=\"tip-content-text\">流程已终止，您可从<a href=\"/pc/expense/mypropose\" style=\"color: #72b3e2;\">  我发起的  </a>查看。 <br> 单号：<span id=\"expense-no\" class=\"tip-content-text\">" + selectExpenseNo + " </span>  </div></div>");
                        $("#main-container").css("min-height", "200px");
                    }
                });
            });
        });

        $("#submit-btn").bind("click", function () {
            var errorMsg = validate();
            tips = "";
            if (errorMsg != undefined && errorMsg != "") {
                showMsg($("#msg-container"), errorMsg);
                return;
            }

            needConfirm();
            showMsg($("#submit-container"), "本次一般报销申请共计<span style=\"color: #ff8400;\">" + $("#total-amount").html() + "</span>元;" + tips + "是否确认提交？");

            $("#confirm-submit").removeAttr('disabled');
            $("#confirm-submit").unbind("click");
            $("#confirm-submit").bind("click", function (e) {
                $(this).attr('disabled',"true");
                var param = collectInfo();
                $.ajax({
                    type: "post",
                    dataType: "json",
                    url: "/pc/normal/submit",
                    data: param,
                    success: function (data) {
                        $("#submit-container").hide();
                        $(".ex-modal-backdrop").remove();
                        if (data.code != 200) {
                            showMsg($("#msg-container"), "系统异常，请稍后再试！");
                            return;
                        }
                        $("#main-container").html("  <div style=\"margin-top:50px; margin-left:35%;\"><div><img src=\"/expense/img/success-small.png\" style=\"vertical-align: baseline;width:30px; height:30px; position:relative; top:8px;\"><span class=\"tip-title-text\" style=\"margin-left:10px;\">提交成功！</span></div>" +
                        "<div style=\"margin-top:10px;margin-left: 35px;\" class=\"tip-content-text\">申请已提交，请耐心等待，您可在<a href=\"/pc/expense/mypropose\" style=\"color: #72b3e2;\">  我发起的  </a>查询。 <br> 单号：<span id=\"expense-no\" class=\"tip-content-text\">" + data.expenseNo + " </span> </div></div>");
                        $("#main-container").css("min-height", "200px");
                        $("#refuse-message").hide();
                    }
                });
            });
        });

        $("#save-btn").bind("click", function () {
            var errorMsg = draftValidate();
            if (errorMsg != undefined && errorMsg != "") {
                showMsg($("#msg-container"), errorMsg);
                return;
            }
            showMsg($("#save-container"), "确认保存草稿？");
            $("#confirm-save").removeAttr('disabled');
            $("#confirm-save").unbind("click");
            $("#confirm-save").bind("click", function (e) {
                $(this).attr('disabled',"true");
                $(".item-detail .ex-type").each(function (index, value) {
                    if ($(value).val() == "") {
                        $(value).attr("result", 0);
                    }
                });
                $(".cost-detail .cost-department").each(function (index, value) {
                    if ($(value).val() == "") {
                        $(value).attr("result", 0);
                    }
                });
                $(".cost-detail .cost-city").each(function (index, value) {
                    if ($(value).val() == "") {
                        $(value).attr("result", 0);
                    }
                });
                var param = collectInfo();
                $.ajax({
                    type: "post",
                    dataType: "json",
                    url: "/pc/normal/draft",
                    data: param,
                    success: function (data) {
                        $("#save-container").hide();
                        $(".ex-modal-backdrop").remove();
                        if (data.code != 200) {
                            showMsg($("#msg-container"), "系统异常，请稍后再试！");
                            return;
                        }
                        $("#main-container").html("  <div style=\"margin-top:50px; margin-left:35%;\"><div><img src=\"/expense/img/success-small.png\" style=\"vertical-align: baseline;width:30px; height:30px; position:relative; top:8px;\"><span class=\"tip-title-text\" style=\"margin-left:10px;\">保存成功！</span></div>" +
                        "<div style=\"margin-top:10px;margin-left: 35px;\" class=\"tip-content-text\">草稿已保存，您可在<a href=\"/pc/expense/mydraft\" style=\"color: #72b3e2;\">  草稿箱  </a>查询。 <br> 单号：<span id=\"expense-no\" class=\"tip-content-text\">" + data.draftNo + " </span> </div></div>");

                        $("#main-container").css("min-height", "200px");
                    }
                });
            });
        });


        $("#workId").bind("resultChange", function () {
            var workId = $(this).attr("result");
            if (workId == undefined || workId == "") {
                $(this).addClass("input-warning");
            } else {
                $(this).removeClass("input-warning");
                initBaseInfo(true, workId);

                var budgetTypeId = $("#budget-subject").val();
                if(budgetTypeId!=0 && budgetTypeId!=-1){
                    var proposerNo = $(this).attr("result");
                    validateCostDepartment(budgetTypeId,proposerNo);
                }
            }
        });

        $("#proposer-department").bind("resultChange", function () {
            var proposerDepartmentId = $(this).attr("result");
            if (proposerDepartmentId == undefined || proposerDepartmentId == "") {
                $(this).addClass("input-warning");
            } else {
                $(this).removeClass("input-warning");
            }
        });

        $("#budget-subject-input").bind("resultChange", function () {
            var budgetTypeId = $(this).attr("result");
            selectBudgetTypeId = budgetTypeId;
            $(".cost-department").attr("param", "budgetTypeId=" + budgetTypeId);
            validateCostDepartment(budgetTypeId);
        });

        $("#budget-subject").bind("change", function () {
            var budgetTypeId = $(this).val();
            $(".cost-department").attr("param", "budgetTypeId=" + budgetTypeId);
            selectBudgetTypeId = budgetTypeId;
            if (budgetTypeId == -1) {
               showMsg($("#budget-type-container"), "");
                $(this).val(0);
                $("#confirm-select-budget").unbind("click");
                $("#confirm-select-budget").bind("click", function(){
                    var selectType = $('#select-type input[name="budgetType"]:checked ');
                    var id = selectType.attr("type-id");
                    var name = selectType.val();
                    if($.inArray(id, budgetTypeIds) == -1){
                        $("#budget-subject option[value='-1']").remove();
                        $("#budget-subject").append("<option value=\"" + id + "\">" + name + "</option>");
                        $("#budget-subject").append("<option value=\"-1\">更多...</option>");
                        budgetTypeIds.push(id);
                    }
                    $("#budget-subject").val(id);
                    $("#budget-subject").trigger("change");
                    release($("#budget-type-container"));
                });
            } else if (budgetTypeId == 0) {
                $("#budget-subject-input").attr("result", "");
                $("#budget-subject-input").hide();
            } else {
                $("#budget-subject-input").attr("result", "");
                $("#budget-subject-input").hide();
                var proposerNo = $("#workId").attr("result");
                validateCostDepartment(budgetTypeId,proposerNo);
            }
        });

        $(".ex-type").live("change", function(e) {
            var budgetTypeId = $("#budget-subject").val();
            var hasTend = false;
            var isTend = false;
            $(".tr-item").each(function(index, item) {
                if (budgetTypeId == 197) {
                    if ($(item).find(".ex-type").val() == 26) { //餐费
                        hasTend = true;
                        isTend = true;
                        $(item).find(".d-people-no").show();
                        $(item).find(".d-people-no").css("display", "inline-block");
                        $(item).find(".ex-desc").attr("placeholder", "为**项目，招待嘉宾，地点，请如实填写");
                        $(item).find(".ex-amount").attr("placeholder", "人均标准70哦~");
                        $(item).find(".c-delete").css("width", "6%");
                    } else {
                        $(item).find(".d-people-no").hide();
                        $(item).find(".ex-desc").attr("placeholder", "如：为**项目/事件，做*事。");
                        $(item).find(".c-delete").css("width", "14%");
                    }
                }

                if ($(item).find(".ex-type").val() == 24) {
                    $(item).find(".ex-desc").attr("placeholder", "**城市至**城市，交通工具");
                } else if ($(item).find(".ex-type").val() == 23) {
                    $(item).find(".ex-desc").attr("placeholder", "发生城市");
                } else if ($(item).find(".ex-type").val() == 25) {
                    $(item).find(".ex-desc").attr("placeholder", "发生城市");
                } else {
                    if (isTend)
                        ;
                    else
                        $(item).find(".ex-desc").attr("placeholder", "如：为**项目/事件，做*事。");
                }

            });

            if (hasTend) {
                $("#d-tend").show();
                $("#d-delete").css("width", "5%");
            } else {
                $("#d-tend").css('display', 'none');
                $("#d-delete").css("width", "11%");
            }
        });
    }

    function release(container) {
        $(".ex-modal-backdrop").remove();
        container.hide();
        container.fadeOut();
    }

    function draftValidate() {
        var errorMsg = "";
        var workId = $("#workId").attr("result");
        if (workId == undefined || workId == "") {
            errorMsg += "申请人信息缺失，请确认是否通过系统提示进行选择！<br>";
            $("#workId").addClass("input-warning");
        }
        var proposerDepartmentId = $("#proposer-department").attr("result");
        if (proposerDepartmentId == undefined || proposerDepartmentId == "") {
            errorMsg += "申请人所在部门信息缺失！<br>";
            $("#proposer-department").addClass("input-warning");
        }
        errorMsg += validateDraftItemDetail();
        errorMsg += validateDraftCostDetail();
        return errorMsg;
    }

    function validateCostDepartment(budgetTypeId, proposerNo) {
        if (budgetTypeId == 0) {
            $(".cost-deaprtment").removeClass("input-warning");
            return;
        }
        if ($(".cost-detail").length == 0) {
            $("#new-cost-item").trigger("click");
            autoGenCostInfo(budgetTypeId, proposerNo);
        } else if ($(".cost-detail").length == 1) {
            autoGenCostInfo(budgetTypeId,proposerNo);
        } else {
            $(".cost-detail").each(function (index) {
                var department = $(this).find(".cost-department");
                var costDepartmentId = department.attr("result");
                if (!costDepartmentId || costDepartmentId <= 0) {
                    department.addClass("input-warning");
                    return;
                }
                var costDepartment = getCostDepartment(costDepartmentId, budgetTypeId);
                if (!costDepartment || costDepartment == undefined || costDepartment.departmentId == 0) {
                    department.addClass("input-warning");
                } else {
                    department.removeClass("input-warning");
                }
            });
        }
    }

    function autoGenCostInfo(budgetTypeId,proposerNo) {
        var proposeDepartmentId = $("#proposer-department").attr("result");
        if (!proposeDepartmentId || proposeDepartmentId <= 0) {
            return;
        }
        var costDepartment = getCostDepartment(proposeDepartmentId, budgetTypeId, proposerNo);
        if (costDepartment && costDepartment != undefined && costDepartment.departmentId != 0) {
            $(".cost-detail").find(".cost-department").attr("result", costDepartment.departmentId);
            $(".cost-detail").find(".cost-department").val(costDepartment.departmentName);
            $(".cost-detail").find(".cost-department").removeClass("input-warning");
        } else {
            $(".cost-detail").find(".cost-department").addClass("input-warning");
            $(".cost-detail").find(".cost-department").val("");
            $(".cost-detail").find(".cost-department").attr("result", "");
        }
    }

    function getCostDepartment(proposeDepartmentId, budgetTypeId, proposerNo) {
        var costDepartment;
        $.ajax({
            type: "get",
            dataType: "json",
            url: "/expense/queryBudgetTypeByDepartment?departmentId=" + proposeDepartmentId + "&proposerNo=" + proposerNo + "&budgetTypeId=" + budgetTypeId,
            async: false,
            success: function (data) {
                if (data.code != 200) {
                    return;
                }
                costDepartment = data.costDepartment;
            }
        });
        return costDepartment;
    }

    function collectInfo() {
        var param = new Object();
        if (selectExpenseNo && selectExpenseNo != "") {
            param.expenseNo = selectExpenseNo;
        }
        if (selectProcessId && selectProcessId != "") {
            param.processId = selectProcessId;
        }
        if (selectTaskId && selectTaskId != "") {
            param.taskId = selectTaskId;
        }
        var budgetSubjectId = $("#budget-subject").val();

        param.budgetSubjectId = budgetSubjectId;
        param.proposerId = $("#workId").attr("result");

        if($("#participant-div").css("display") != "none"){
            param.expenseReason = $("#participant-des").val();
        }
        var items = new Array();
        $(".item-detail").each(function () {
            items.push(collectTR(this));
        });
        param.items = JSON.stringify(items);
        var costItems = new Array();
        $(".cost-detail").each(function () {
            costItems.push(collectCostTR(this));
        });
        param.costItems = JSON.stringify(costItems);
        //var payeeItems = new Array();                  //todo use default first
        //param.payeeItems = JSON.stringify(payeeItems);
        return param;
    }

    function collectCostTR(tr) {
        var tmp = new Object();
        tmp.costDepartmentId = $(tr).find(".cost-department").attr("result");
        tmp.costCityId = $(tr).find(".cost-city").attr("result");
        tmp.costAmount = $(tr).find(".cost-amount").val();
        var costRatePercentage = parseFloat($(tr).find(".cost-rate").val());
        tmp.costRate = costRatePercentage / 100;
        return tmp;
    }

    function collectTR(tr) {
        var tmp = new Object();
        tmp.type = $(tr).find(".ex-type").val();
        tmp.time = $(tr).find(".ex-date").val();
        var budgetTypeId = $("#budget-subject").val();
        var expenseTypeId = $(tr).find(".ex-type").val();
        if (budgetTypeId == 197 && expenseTypeId == 26) {
            tmp.desc = "参与人数:" + $(tr).find(".people-no").val() + ";" + $(tr).find(".ex-desc").val();
        } else {
            tmp.desc = $(tr).find(".ex-desc").val();
        }
        tmp.amount = $(tr).find(".ex-amount").val();
        tmp.invoice = $(tr).find(".invoice-count").val();
        if($(tr).find(".invoice-count").val()==""){
            tmp.invoice = 0;
        }else{
            tmp.invoice = $(tr).find(".invoice-count").val();
        }
        return tmp;
    }

    function initBaseInfo(ignoreWorkId, workId) {
        var url = "/pc/normal/init";
        if (workId != undefined && workId != "") {
            url += "?proposerNo=" + workId;
        }
        $.ajax({
            type: "get",
            dataType: "json",
            url: url,
            async: false,
            success: function (data) {
                if (data.code != 200) {
                    return;
                }
                if (ignoreWorkId == false) {
                    $("#workId").val(data.proposerInfoBean.workNo + "/" + data.proposerInfoBean.realName);
                    $("#workId").attr("result", data.proposerInfoBean.workNo);
                }
                if(data.proposerInfoBean == undefined ||data.proposerInfoBean.topDepartmentId == undefined ||data.proposerInfoBean.topDepartmentId == 0 ){
                    $("#proposer-department").addClass("input-warning");
                    $("#proposer-department").val("");
                    $(".cost-department").addClass("input-warning");
                }else{
                    $("#proposer-department").val(data.proposerInfoBean.topDepartmentName);
                    $("#proposer-department").attr("result", data.proposerInfoBean.topDepartmentId);
                }
                $(".cost-detail").find(".cost-city").attr("result", data.proposerInfoBean.cityId);
                $(".cost-detail").find(".cost-city").val(data.proposerInfoBean.city);
                $(".cost-detail").find(".cost-rate").val(100);
                departments = data.departments;
                departTree = data.departTree;
            }
        });
    }

    function initExpenseType(budgetTypeId){
        var param = "budgetTypeId=" + budgetTypeId + "&";
        $.ajax({
            type: "get",
            dataType: "json",
            url: "/expense/availableExpenseType",
            data: encodeURI(param),
            async: false,
            success: function (data) {
                if (data.code != 200) {
                    $(".ex-type").append("<option value=\"" + -2 + "\">没有可以选择的费用类别</option>");
                    $(".ex-type").val(-2);
                    return;
                }
                var beanList = data.expenseTypeBeanList;
                $(".ex-type").find("option").remove();
                if (beanList && beanList.length > 0) {
                    $(".ex-type").append("<option value=\"" + 0 + "\">请选择费用类别</option>");
                    var html = "<div id=\"select-type\">";
                    var hasMore = false;
                    for (var i = 0; i < beanList.length; i++) {
                        var bean = beanList[i];
                        $(".ex-type").append("<option value='" + bean.expenseTypeId + "'>" + bean.expenseName + "</option>");
                    }
                    $(".ex-type").val(0);
                } else {
                    $(".ex-type").append("<option value=\"" + -2 + "\">没有可以选择的费用类别</option>");
                    $(".ex-type").val(-2);
                }
            }
        });
    }

    function initBudgetType(){
        $.ajax({
            type: "get",
            dataType: "json",
            url: "/pc/normal/availableBudgetType",
            async: false,
            success: function (data) {
                if (data.code != 200) {
                    $("#budget-subject").append("<option value=\"" + -2 + "\">没有可以选择的预算项目</option>");
                    $("#budget-subject").val(-2);
                    return;
                }
                var budgetList = data.budgetTypeBeanList;
                $("#budget-subject").find("option").remove();
                if (budgetList && budgetList.length > 0) {
                    $("#budget-subject").append("<option value=\"" + 0 + "\">请选择预算项目</option>");
                    var html = "<div id=\"select-type\">";
                    var hasMore = false;
                    subjectHtml=" <ul class='dropdown-menu' role='menu' aria-labelledby='dLabel' style='left:9.25%;margin-top: 0px;'>"
                    for (var i = 0; i < budgetList.length; i++) {
                        var budget = budgetList[i];
                        if(budget.budgetTypeNo == 'B040102' || budget.budgetTypeNo == 'B081202' || budget.budgetTypeNo == 'B081204'){
                            continue;
                        }
                        if(budget.type == 1){
                            budgetTypeIds.push(budget.id);

                            if(budget.childrenList.length> 0){
                                //subjectHtml +="<li class='dropdown-submenu'><a  href='#'>"+budget.budgetTypeNo + '/' + budget.budgetTypeName+"</a>";
                                var childrenBudgetList =  budget.childrenList;
                                var childrenSubjectHtml ="";
                                subjectHtml +=generateBudgetChildrenHtml(childrenSubjectHtml,childrenBudgetList,0)
                            }else{
                                subjectHtml +="<li class='sub_menu'  value='" + budget.id + "'><a style='font-size: 12px;font-family: microsoft yahei;' href='#'>"+((budget.explain==null || budget.explain=="")?budget.budgetTypeName:(budget.budgetTypeName+"（"+budget.explain+"）"))+"</a>";
                            }
                            subjectHtml += "</li>";
                        }else {
                            hasMore = true;
                            html += generateBudgetOptionHtml(budget);
                        }
                    }
                    subjectHtml +="</ul>";
                    $("#budget-subject-div").append(subjectHtml);
                    html += "</div>";
                    if(hasMore){
                        $("#budget-subject").append("<option value=\"" + -1 + "\">更多...</option>");
                    }
                    $("#budget-type-container .ex-modal-body").html(html);
                } else {
                    $("#budget-type-container .ex-modal-body").html("");
                    $("#budget-subject").append("<option value=\"" + -2 + "\">没有可以选择的预算项目</option>");
                    $("#budget-subject").val(-2);
                }
            }
        });
    }

    function generateBudgetChildrenHtml(childrenSubjectHtml,childrenBudgetList,flag){
        if(flag ==1){
            childrenSubjectHtml +="<ul  class='dropdown-menu'>";
        }
        for (var i = 0; i < childrenBudgetList.length; i++) {
            var childrenBudget = childrenBudgetList[i];
            if(childrenBudget.budgetTypeNo == 'B040102' || childrenBudget.budgetTypeNo == 'B081202' || childrenBudget.budgetTypeNo == 'B081204'){
                continue;
            }
            if(childrenBudget.childrenList.length> 0 ){
                childrenSubjectHtml +=("<li class ='dropdown-submenu' value=\"" + childrenBudget.id + "\"><a  style='font-size: 12px;font-family: microsoft yahei;' href='#'>"+((childrenBudget.explain==null || childrenBudget.explain=="")?childrenBudget.budgetTypeName:(childrenBudget.budgetTypeName+"（"+childrenBudget.explain+"）")))+"</a>";
                childrenSubjectHtml =generateBudgetChildrenHtml(childrenSubjectHtml,childrenBudget.childrenList,1);
            }else{
                childrenSubjectHtml +=("<li class ='sub_menu' value=\"" + childrenBudget.id + "\"><a style='font-size: 12px;font-family: microsoft yahei;' href='#'>"+((childrenBudget.explain==null || childrenBudget.explain=="")?childrenBudget.budgetTypeName:(childrenBudget.budgetTypeName+"（"+childrenBudget.explain+"）")))+"</a>";
            }
            childrenSubjectHtml +="</li>";
        }
        if(flag ==1) {
            childrenSubjectHtml += ("</ul>");
        }
    return childrenSubjectHtml;
    }
    var budget_subject_value ="" ;
    $(document).ready(function() {
        $('.sub_menu').on('click', function(){

            isInclude = false;
            $("#budget-subject-name").text($(this).text());
            $("#budget-subject").val(this.value);
            if(budget_subject_value !=$("#budget-subject").val()){
                $("#budget-subject").val(this.value);
                var budgetTypeId = $("#budget-subject").val();


                if(budgetTypeId == BUDGETTYPEID_LVYOU) {
                    $("#baseinfo-div").css("min-height", "160px");
                    $("#participant-div").show();
                    $("#warning-travel").show();
                }else{
                    $("#warning-travel").css('display','none');
                    $("#participant-div").hide();
                    $("#baseinfo-div").css("min-height", "100px");
                }

                //销售和非销售对外业务招待
                if (budgetTypeId == 48) {
                    $("#48").show();
                } else {
                    $("#48").css('display', 'none');
                }

                //业务管理（原业务交流）
                if (budgetTypeId == 197) {
                    $("#197").show();
                } else {
                    $("#197").css('display', 'none');
                }

                //月会
                if (budgetTypeId == 192) {
                    $("#192").show();
                } else {
                    $("#192").css('display', 'none');
                }
                if (budgetTypeId == 193) {
                    $("#193").show();
                } else {
                    $("#193").css('display', 'none');
                }
                if (budgetTypeId == 194) {
                    $("#194").show();
                } else {
                    $("#194").css('display', 'none');
                }
                if (budgetTypeId == 195) {
                    $("#195").show();
                } else {
                    $("#195").css('display', 'none');
                }
                if (budgetTypeId == 167) {
                    $("#167").show();
                } else {
                    $("#167").css('display', 'none');
                }
                if (budgetTypeId == 168) {
                    $("#168").show();
                } else {
                    $("#168").css('display', 'none');
                }
                if (budgetTypeId == 169) {
                    $("#169").show();
                } else {
                    $("#169").css('display', 'none');
                }
                if (budgetTypeId == 170) {
                    $("#170").show();
                } else {
                    $("#170").css('display', 'none');
                }
                if (budgetTypeId == 162) {
                    $("#162").show();
                } else {
                    $("#162").css('display', 'none');
                }
                if (budgetTypeId == 49) {
                    $("#49").show();
                } else {
                    $("#49").css('display', 'none');
                }
                if (budgetTypeId == 200) {
                    $("#200").show();
                } else {
                    $("#200").css('display', 'none');
                }
                if (budgetTypeId == 213) {
                    $("#213").show();
                } else {
                    $("#213").css('display', 'none');
                }


                if(budgetTypeId == 110 || budgetTypeId == 89 || budgetTypeId == 96) {
                    $("#110").show();
                } else {
                    $("#110").css('display', 'none');
                }
                if(budgetTypeId == 176) {
                    $("#176").show();
                } else {
                    $("#176").css('display', 'none');
                }
                if(budgetTypeId == 113 || budgetTypeId == 98 || budgetTypeId == 91) {
                    $("#113").show();
                } else {
                    $("#113").css('display', 'none');
                }
                if(budgetTypeId == 13) {
                    $("#13").show();
                } else {
                    $("#13").css('display', 'none');
                }

                if(budgetTypeId == 86) {
                    $("#86").show();
                } else {
                    $("#86").css('display', 'none');
                }
                if(budgetTypeId == 216) {
                    $("#216").show();
                } else {
                    $("#216").css('display', 'none');
                }
                if(budgetTypeId == 127) {
                    $("#127").show();
                } else {
                    $("#127").css('display', 'none');
                }
                if(budgetTypeId == 129) {
                    $("#129").show();
                } else {
                    $("#129").css('display', 'none');
                }
                if(budgetTypeId == 126) {
                    $("#126").show();
                } else {
                    $("#126").css('display', 'none');
                }

                if(budgetTypeId == 137) {
                    $("#137").show();
                } else {
                    $("#137").css('display', 'none');
                }
                if(budgetTypeId == 128) {
                    $("#128").show();
                } else {
                    $("#128").css('display', 'none');
                }
                if(budgetTypeId == 123) {
                    $("#123").show();
                } else {
                    $("#123").css('display', 'none');
                }
                if(budgetTypeId == 132) {
                    $("#132").show();
                } else {
                    $("#132").css('display', 'none');
                }
                if(budgetTypeId == 131) {
                    $("#131").show();
                } else {
                    $("#131").css('display', 'none');
                }

                // 文化团建
                if(budgetTypeId == 199) {
                    $("#199").show();
                    $("#expenseExplainId").attr("placeholder", "填写活动名称,参加人员工号姓名,及相关费用说明");
                } else {
                    $("#199").css('display', 'none');
                    $("#expenseExplainId").attr("placeholder", "如：为**项目/事件，做*事。");
                }


                var param = "budgetTypeId=" + budgetTypeId + "&";
                $.ajax({
                    type: "get",
                    dataType: "json",
                    url: "/expense/availableExpenseType",
                    data: encodeURI(param),
                    async: false,
                    success: function (data) {
                        if (data.code != 200) {
                            return;
                        }
                        var beanList = data.expenseTypeBeanList;
                        for (var i = 0; i < beanList.length; i++) {
                            if (beanList[i].expenseTypeId == 24) {
                                isInclude = true;
                                break;
                            }
                        }
                    }
                });

                if(isInclude && budgetTypeId != BUDGETTYPEID_LVYOU && budgetTypeId != 176 && budgetTypeId != 199 && budgetTypeId != 162 &&
                    budgetTypeId != 169 && budgetTypeId != 200 && budgetTypeId != 49 && budgetTypeId != 213 && budgetTypeId != 197 && budgetTypeId != 192
                && budgetTypeId != 193 && budgetTypeId != 194 && budgetTypeId != 195 && budgetTypeId != 167 && budgetTypeId != 168 && budgetTypeId != 170
                && budgetTypeId != 213 && budgetTypeId != 110 && budgetTypeId != 113){
                    $("#warning-urban-traffic").show();
                } else {
                    $("#warning-urban-traffic").css('display','none');
                }

                if(budgetTypeId){
                    initExpenseType(budgetTypeId);
                    selectBudgetTypeId = budgetTypeId;
                    $(".cost-department").attr("param", "budgetTypeId=" + budgetTypeId);
                    validateCostDepartment(budgetTypeId, $("#workId").attr("result"));
                }

            }

        });
    });
    /***********************************************************************************/
    $(document).ready(function () {
       (function(factory) {
            if (typeof define == 'function' && define.amd) {
                // AMD. Register as an anonymous module
                define(['jquery'], factory);
            }
            else if (typeof exports == 'object') {
                // Node/CommonJS
                module.exports = factory(require('jquery'));
            }
            else {
                // Browser globals
                factory(jQuery);
            }
        })(function($) {
            // Or ':not(.disabled):has(a)' or ':not(.disabled):parent';
            var desc = ':not(.disabled, .divider, .dropdown-header)';

            function Submenupicker(element) {
                this.$element = $(element);
                this.$main = this.$element.closest('.dropdown, .dropup, .btn-group');
                this.$menu = this.$element.parent();
                this.$drop = this.$menu.parent().parent();
                this.$menus = this.$menu.siblings('.dropdown-submenu');

                var $children = this.$menu.find('> .dropdown-menu > ' + desc);

                this.$submenus = $children.filter('.dropdown-submenu');
                this.$items = $children.not('.dropdown-submenu');

                this.init();
            }

            Submenupicker.prototype = {
                init: function() {
                    this.$element.on({
                        'click.bs.dropdown': $.proxy(this.click, this),
                        keydown: $.proxy(this.keydown, this)
                    });

                    this.$menu.on('hide.bs.submenu', $.proxy(this.hide, this));
                    this.$items.on('keydown', $.proxy(this.item_keydown, this));
                    // Bootstrap fix
                    this.$menu.nextAll(desc + ':first:not(.dropdown-submenu)').children('a').on('keydown', $.proxy(this.next_keydown, this));
                },
                click: function(event) {
                    event.stopPropagation();
                    if(this.$submenus.prevObject.length == 0){
                        $("#budget-subject").text(this.$menus.text());
                    }

                    this.toggle();
                },
                toggle: function() {
                    if (this.$menu.hasClass('open')) {
                        this.close();
                    }
                    else {
                        this.$menu.addClass('open');
                        this.$menus.trigger('hide.bs.submenu');
                    }
                },
                hide: function(event) {
                    // Stop event bubbling
                    event.stopPropagation();

                    this.close();
                },
                close: function() {
                    this.$menu.removeClass('open');
                    this.$submenus.trigger('hide.bs.submenu');
                },
                keydown: function(event) {
                    // 13: Return, 27: Esc, 32: Spacebar
                    // 38: Arrow up, 40: Arrow down
                    // Off vertical scrolling
                    alert("keydown");
                    if ($.inArray(event.keyCode, [32, 38, 40]) != -1) {
                        event.preventDefault();
                    }

                    if ($.inArray(event.keyCode, [13, 32]) != -1) {
                        this.toggle();
                    }
                    else if ($.inArray(event.keyCode, [27, 38, 40]) != -1) {
                        event.stopPropagation();

                        if (event.keyCode == 27) {
                            if (this.$menu.hasClass('open')) {
                                this.close();
                            }
                            else {
                                this.$menus.trigger('hide.bs.submenu');
                                this.$drop.removeClass('open').children('a').trigger('focus');
                            }
                        }
                        else {
                            var $items = this.$main.find('li:not(.disabled):visible > a');

                            var index = $items.index(event.target);

                            if (event.keyCode == 38 && index !== 0) {
                                index--;
                            }
                            else if (event.keyCode == 40 && index !== $items.length - 1) {
                                index++;
                            }
                            else {
                                return;
                            }

                            $items.eq(index).trigger('focus');
                        }
                    }
                },
                item_keydown: function(event) {
                    // 27: Esc
                    alert("item_keydown");
                    if (event.keyCode != 27) {
                        return;
                    }

                    event.stopPropagation();

                    this.close();
                    this.$element.trigger('focus');
                },
                next_keydown: function(event) {
                    // 38: Arrow up
                    alert("next_keydown");
                    if (event.keyCode != 38) {
                        return;
                    }

                    // Off vertical scrolling
                    event.preventDefault();

                    event.stopPropagation();

                    // Use this.$drop instead this.$main (optimally)
                    var $items = this.$drop.find('li:not(.disabled):visible > a');

                    var index = $items.index(event.target);

                    $items.eq(index - 1).trigger('focus');
                }
            };

            // For AMD/Node/CommonJS used elements (optional)
            // http://learn.jquery.com/jquery-ui/environments/amd/
            return $.fn.submenupicker = function(elements) {
                var $elements = this instanceof $ ? this : $(elements);

                return $elements.each(function() {
                    var data = $.data(this, 'bs.submenu');

                    if (!data) {
                        data = new Submenupicker(this);

                        $.data(this, 'bs.submenu', data);
                    }
                });
            };

        });
        $('.dropdown-submenu > a').submenupicker();
    });
    /**********************************************************************************/
    function generateBudgetOptionHtml(budget){
        var name = budget.budgetTypeName;
        return "<div style=\"padding: 5px;\"><input type=\"radio\" name=\"budgetType\" type-id=\"" + budget.id + "\" value=\"" + name + "\"/>" + name + "</div>";
    }

    function validate() {
        var errorMsg = "";
        var workId = $("#workId").attr("result");
        if (workId == undefined || workId == "") {
            errorMsg += "申请人信息缺失，请确认是否通过系统提示进行选择！<br>";
            $("#workId").addClass("input-warning");
        }
        var proposerDepartmentId = $("#proposer-department").attr("result");
        if (proposerDepartmentId == undefined || proposerDepartmentId == "") {
            errorMsg += "申请人所在部门信息缺失！<br>";
            $("#proposer-department").addClass("input-warning");
        }
        var budgetSubject = $("#budget-subject").val();
        if (budgetSubject == undefined || budgetSubject == "" || budgetSubject == 0) {
            errorMsg += "预算项目信息缺失，请选择！<br>";
            $("#budget-subject").addClass("input-warning");
        } else if (budgetSubject == -1) {
            var inputBudgetSuggest = $("#budget-subject-input").attr("result");
            if (inputBudgetSuggest == undefined || inputBudgetSuggest == "") {
                errorMsg += "预算项目信息缺失，请选择！<br>";
                $("#budget-subject-input").addClass("input-warning");
            }
        }

        if($("#participant-div").css("display") != "none"){
            var participantDes = $("#participant-des").val();
            if (participantDes == undefined || participantDes == "") {
                errorMsg += "参与人明细缺失，请填写！<br>";
                $("#participant-des").addClass("input-warning");
            }
        }

        if ($(".item-detail").length == 0) {
            errorMsg += "报销明细信息缺失，请点击添加进行填写！<br>";
            $("#new-detail-item").css("border", "1px solid red");
        }
        if ($(".cost-detail").length == 0) {
            errorMsg += "分摊明细信息缺失，请点击添加进行填写！<br>";
            $("#new-cost-item").css("border", "1px solid red");
        }

        var totalInvoice = 0;
        $(".item-detail .invoice-count").each(function (index, value) {
            var invoice = $(value);
            if (invoice.val() != "" && !validateInt($(this).val()) || parseInt($(this).val()) < 0) {
                if(errorMsg.indexOf("报销明细发票张数信息格式不对，请确认") < 0){
                    errorMsg += "报销明细发票张数信息格式不对，请确认！<br>";
                }
                invoice.addClass("input-warning");
            }
            var invoice = invoice.val() == "" ? 0 : parseInt($(value).val());
            totalInvoice += invoice;
        });
        if(totalInvoice==0){
            errorMsg += "报销明细发票张数信息缺失，请确认<br>";
            $(".item-detail .invoice-count").each(function (index, value) {
                var invoice = $(value);
                invoice.addClass("input-warning");
            });
        }

        var invoice_total= 0;
        $(".item-detail .invoice-count").each(function (index, value) {
            var invoice = $(value);
            //if (invoice.val() == undefined || invoice.val() == "") {
            //    if(errorMsg.indexOf("报销明细发票张数信息缺失，请确认") < 0){
            //        errorMsg += "报销明细发票张数信息缺失，请确认！<br>";
            //    }
            //    invoice.addClass("input-warning");
            //}else if (!validateInt(invoice.val()) || parseInt(invoice.val()) <= 0) {
            //    if(errorMsg.indexOf("报销明细发票张数信息格式不对，请确认") < 0){
            //        errorMsg += "报销明细发票张数信息格式不对，请确认！<br>";
            //    }
            //    invoice.addClass("input-warning");
            //}

            if (invoice.val() != "" && (!validateInt(invoice.val()) || parseInt(invoice.val()) < 0)){
                if(errorMsg.indexOf("报销明细发票张数信息格式不对，请确认") < 0){
                    errorMsg += "报销明细发票张数信息格式不对，请确认！<br>";
                }
                invoice.addClass("input-warning");
            }
        });

        errorMsg += validateItemDetail();
        errorMsg += validateCostDetail(true);

        errorMsg += validateTend();
        return errorMsg;
    }

    function validateTend() {
        var errorMsg = "";
        var budgetTypeId = $("#budget-subject").val();
        $(".item-detail").each(function (index, item) {
            if (budgetTypeId == 197) {
                if ($(item).find(".ex-type").val() == 26) { //餐费
                    var amount = $(item).find(".ex-amount").val().trim();
                    var peopleNo = $(item).find(".people-no").val().trim();

                    if (peopleNo === "" || (!validateInt($(item).find(".people-no").val()) || parseInt($(item).find(".people-no").val()) < 0)) {
                        errorMsg += "参与人数格式不正确";
                        return errorMsg;
                    }

                    var happenDate = $(item).find(".ex-date").val();
                    var happen = happenDate.replace(/-/g, '/');

                    var expensedate = new Date(Date.parse(happen));
                    var onlineDate = '2015/10/20';
                    var start = new Date(Date.parse(onlineDate));
                    if (amount != undefined && amount != null && amount != "" && peopleNo != undefined && peopleNo != null && peopleNo != "") {
                        if (amount / peopleNo > 70 && expensedate > start) {
                            errorMsg += "10月20日以后，业务管理招待餐费超出公司标准:70元/人，请走线下特批流程。<br>"
                            errorMsg += "具体方式见PC：首页->常见问题->哪些费用通过线下单据申报？";
                        }
                    }
                }
            }
        });

        return errorMsg;
    }

    function validateCostDetail(submit) {
        if ($(".cost-detail").length == 0) {
            return "";
        }
        var errorMsg = "";
        var totalAmount = 0;
        $(".cost-detail .cost-amount").each(function (index, value) {
            var amount = $(value);
            if (amount.val() == undefined || amount.val() == "") {
                if(errorMsg.indexOf("部门承担金额信息缺失，请确认") < 0){
                    errorMsg += "部门承担金额信息缺失，请确认！<br>";
                }
                amount.addClass("input-warning");
            } else if (!validateFloat(amount.val()) || parseFloat(amount.val()) <= 0 || parseFloat(amount.val()) > 99999999) {
                if(errorMsg.indexOf("部门承担金额信息格式不对，请确认") < 0){
                    errorMsg += "部门承担金额信息格式不对，请确认！<br>";
                }
                amount.addClass("input-warning");
            } else {
                amount.removeClass("input-warning");
                totalAmount += parseFloat(amount.val());
            }
        });
        var itemTotalAmount = 0;
        totalAmount = totalAmount.toFixed(2);
        if ($("#total-amount").text() != "") {
            itemTotalAmount = parseFloat($("#total-amount").attr("amount")).toFixed(2);
        }
        if(itemTotalAmount > 99999999) {
            errorMsg += "费用明细总金额必须小于1个亿，请确认！<br>";
        }
        if (submit && totalAmount != itemTotalAmount) {
            if(errorMsg.indexOf("部门承担金额总额不等于费用明细总金额，请确认") < 0){
                errorMsg += "部门承担金额总额不等于费用明细总金额，请确认！<br>";
            }
        }

        var departmentIds = new Array();
        $(".cost-detail .cost-department").each(function (index, value) {
            var department = $(value);
            if (department.val() == undefined || department.val() == "") {
                if(errorMsg.indexOf("承担部门信息缺失，请确认") < 0){
                    errorMsg += "承担部门信息缺失，请确认！<br>";
                }
                department.addClass("input-warning");
            } else if (department.attr("result") == "" || !validateInt(department.attr("result"))) {
                if(errorMsg.indexOf("承担部门信息缺失，请确认") < 0){
                    errorMsg += "承担部门信息缺失，请确认！<br>";
                }
                department.addClass("input-warning");
            } else {
                departmentIds.push(department.attr("result"));
            }
        });

        var citys = new Array();
        $(".cost-detail .cost-city").each(function (index, value) {
            var city = $(value);
            if (city.val() == undefined || city.val() == "") {
                if(errorMsg.indexOf("分摊城市信息缺失，请确认") < 0){
                    errorMsg += "分摊城市信息缺失，请确认！<br>";
                }
                city.addClass("input-warning");
            } else if (city.attr("result") == "" || !validateInt(city.attr("result"))) {
                if(errorMsg.indexOf("分摊城市信息不正确，请确认") < 0){
                    errorMsg += "分摊城市信息不正确，请确认！<br>";
                }
                city.addClass("input-warning");
            } else {
                citys.push(city.attr("result"));
            }
        });
        var departmentDuplicate = duplicateItem(departmentIds);
        var cityDuplicate = duplicateItem(citys);
        if (departmentDuplicate && cityDuplicate) {
            if(errorMsg.indexOf("分摊信息重复，请确认") < 0){
                errorMsg += "分摊信息重复，请确认！<br>";
            }
            $(".cost-detail").addClass("input-warning");
        }

        return errorMsg;
    }

    function validateDraftCostDetail() {
        if ($(".cost-detail").length == 0) {
            return "";
        }
        var errorMsg = "";
        $(".cost-detail .cost-amount").each(function (index, value) {
            var amount = $(value);
            if (amount.val() != "" && !validateFloat(amount.val()) || parseFloat(amount.val()) < 0) {
                if(errorMsg.indexOf("部门承担金额信息格式不对，请确认") < 0){
                    errorMsg += "部门承担金额信息格式不对，请确认！<br>";
                }
                amount.addClass("input-warning");
            }
        });

        $(".cost-detail .cost-department").each(function (index, value) {
            var department = $(value);
            if (department.val() != "" && !validateInt(department.attr("result"))) {
                if(errorMsg.indexOf("承担部门信息不正确，请确认") < 0){
                    errorMsg += "承担部门信息不正确，请确认！<br>";
                }
                department.addClass("input-warning");
            }
        });

        $(".cost-detail .cost-city").each(function (index, value) {
            var city = $(value);
            if (city.val() != "" && !validateInt(city.attr("result"))) {
                if(errorMsg.indexOf("分摊城市信息不正确，请确认") < 0){
                    errorMsg += "分摊城市信息不正确，请确认！<br>";
                }
                city.addClass("input-warning");
            }
        });

        $(".cost-detail .cost-rate").each(function (index, value) {
            var rate = $(value);
            if (rate.val() != "" && !validateFloat(rate.val())) {
                if(errorMsg.indexOf("分摊比例信息格式不正确，请确认") < 0){
                    errorMsg += "分摊比例信息格式不正确，请确认！<br>";
                }
                rate.addClass("input-warning");
            }
        });

        return errorMsg;
    }

    function duplicateItem(arr) {
        if (!arr || arr == undefined || arr.length == 0) {
            return false;
        }
        var sortedArr = arr.sort();
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == arr[i + 1]) {
                return true;
            }
        }
        return false;
    }

    function validateItemDetail() {
        var errorMsg = "";
        $(".item-detail .ex-type").each(function (index, item) {
            var type = $(item);
            var expenseTypeId = type.val();
            if (expenseTypeId == undefined || expenseTypeId == "" || parseInt(expenseTypeId) <= 0) {
                if(errorMsg.indexOf("报销明细费用类别信息缺失，请选择") < 0){
                    errorMsg += "报销明细费用类别信息缺失，请选择！<br>";
                }
                type.addClass("input-warning");
            }
        });

        var today = new Date().toJSON().slice(0,10);
        $(".item-detail .ex-date").each(function (index, value) {
            var date = $(value);
            if (date.val() == undefined || date.val() == "") {
                if(errorMsg.indexOf("报销明细费用日期信息缺失，请选择") < 0){
                    errorMsg += "报销明细费用日期信息缺失，请选择！<br>";
                }
                date.addClass("input-warning");
            }else if (date.val() > today) {
                if(errorMsg.indexOf("报销明细费用日期不能大于今日，请重新选择") < 0){
                    errorMsg += "报销明细费用日期不能大于今日，请重新选择！<br>";
                }
                date.addClass("input-warning");
            }
        });
        $(".item-detail .ex-desc").each(function (index, value) {
            var desc = $(value);
            if (desc.val() == undefined || desc.val() == "") {
                if(errorMsg.indexOf("报销明细费用说明信息缺失，请确认") < 0){
                    errorMsg += "报销明细费用说明信息缺失，请确认！<br>";
                }
                desc.addClass("input-warning");
            }
        });
        $(".item-detail .ex-amount").each(function (index, value) {
            var amount = $(value);
            if (amount.val() == undefined || amount.val() == "") {
                if(errorMsg.indexOf("报销明细费用金额信息缺失，请确认") < 0){
                    errorMsg += "报销明细费用金额信息缺失，请确认！<br>";
                }
                amount.addClass("input-warning");
            } else if (!validateFloat(amount.val()) || parseFloat(amount.val()) <= 0) {
                if(errorMsg.indexOf("报销明细费用金额信息格式不对，请确认") < 0){
                    errorMsg += "报销明细费用金额信息格式不对，请确认！<br>";
                }
                amount.addClass("input-warning");
            }
        });

        $(".item-detail .people-no .active-item").each(function (index, value) {
           var peopleNo = $(value);
            if (peopleNo.val() == undefined || peopleNo.val() == "") {
                if(errorMsg.indexOf("报销明细费用招待人数信息缺失，请确认") < 0){
                    errorMsg += "报销明细费用招待人数信息缺失，请确认！<br>";
                }
                peopleNo.addClass("input-warning");
            } else if (!validateFloat(peopleNo.val()) || parseFloat(peopleNo.val()) <= 0) {
                if(errorMsg.indexOf("报销明细费用招待人数信息格式不对，请确认") < 0){
                    errorMsg += "报销明细费用招待人数信息格式不对，请确认！<br>";
                }
                peopleNo.addClass("input-warning");
            }
        });
        //$(".item-detail .invoice-count").each(function (index, value) {
        //    var invoice = $(value);
        //    if (invoice.val() == undefined || invoice.val() == "") {
        //        if(errorMsg.indexOf("报销明细发票张数信息缺失，请确认") < 0){
        //            errorMsg += "报销明细发票张数信息缺失，请确认！<br>";
        //        }
        //        invoice.addClass("input-warning");
        //    }else if (!validateInt(invoice.val()) || parseInt(invoice.val()) <= 0) {
        //        if(errorMsg.indexOf("报销明细发票张数信息格式不对，请确认") < 0){
        //            errorMsg += "报销明细发票张数信息格式不对，请确认！<br>";
        //        }
        //        invoice.addClass("input-warning");
        //    }
        //
        //    if (invoice.val() != "" && (!validateInt(invoice.val()) || parseInt(invoice.val()) < 0)){
        //        if(errorMsg.indexOf("报销明细发票张数信息格式不对，请确认") < 0){
        //            errorMsg += "报销明细发票张数信息格式不对，请确认！<br>";
        //        }
        //        invoice.addClass("input-warning");
        //    }
        //});
        return errorMsg;
    }

    function validateDraftItemDetail() {
        var errorMsg = "";

        /*$(".item-detail .ex-type").each(function (index, value) {
            var type = $(value);
            if (type.val() <= 0) {
                if(errorMsg.indexOf("费用类别信息不正确，请确认") < 0){
                    errorMsg += "费用类别信息不正确，请确认！<br>";
                }
                type.addClass("input-warning");
            }
        });*/

        $(".item-detail .ex-amount").each(function (index, value) {
            var amount = $(value);
            if (amount.val() != "" && (!validateFloat(amount.val()) || parseFloat(amount.val()) < 0)) {
                if(errorMsg.indexOf("报销明细费用金额信息格式不对，请确认") < 0){
                    errorMsg += "报销明细费用金额信息格式不对，请确认！<br>";
                }
                amount.addClass("input-warning");
            }
        });
        $(".item-detail .invoice-count").each(function (index, value) {
            var invoice = $(value);
            if (invoice.val() != "" && (!validateInt(invoice.val()) || parseInt(invoice.val()) < 0)) {
                if(errorMsg.indexOf("报销明细发票张数信息格式不对，请确认") < 0){
                    errorMsg += "报销明细发票张数信息格式不对，请确认！<br>";
                }
                invoice.addClass("input-warning");
            }
        });
        return errorMsg;
    }

    function getDepartmentName(department){
         if(department!= undefined && department.cost){
             return "<a href=\"javascript:void(0);\" class=\"cost-depart\" departName=\"" + department.departmentName + "\" departId=\"" + department.departmentId + "\">" + department.departmentShortName + "</a>";
         }
         return "<span>" + department.departmentShortName + "</span>";
    }

    /**
    * Calc the total cost rate and amount.
    * 1. Base on amount to calculate 
    */
    function calculateCostAmount(){
        var costAmountCtrlList = $(".cost-detail .cost-amount");
        var costRateCtrlList = $(".cost-detail .cost-rate");
        var rowSize = costAmountCtrlList.size();

        costAmountCtrlList.removeClass("input-warning");
        costRateCtrlList.removeClass("input-warning");

        var totalAmount = parseFloat($("#total-amount").attr("amount"));
        if(!totalAmount || totalAmount <= 0){
            return;
        }

        var totalCostAmount = 0;
        var totalCostPercent = 0;
        costAmountCtrlList.each(function (index, amountItem) {
            if (!validateFloat($(amountItem).val()) || parseFloat($(amountItem).val()) < 0) {
                $(amountItem).addClass("input-warning");
                $(amountItem).val(0.00);
            }

            var costAmount = parseFloat($(amountItem).val());
            totalCostAmount += costAmount;

            var costPercent = parseInt((100 * costAmount / totalAmount).toFixed(0));
            $(costRateCtrlList[index]).val(costPercent);
            totalCostPercent += costPercent;

            if(index == rowSize - 1){
                if((totalCostAmount != totalAmount) && Math.abs((totalCostAmount - totalAmount) * 100 / totalAmount) < 1.00){
                    //Auto fix the margin
                    costAmount += totalAmount - totalCostAmount;
                    totalCostAmount = totalAmount;
                    $(amountItem).val(costAmount.toFixed(2));
                }

                if(totalCostAmount == totalAmount){
                    costPercent += 100 - totalCostPercent;
                    $(costRateCtrlList[index]).val(costPercent);
                    totalCostPercent = 100;
                }
            }
        });

        if(totalCostPercent == 100 && (totalCostAmount != totalAmount)){
            totalCostPercent = (totalCostAmount * 100.00 / totalAmount).toFixed(2);
        }

        if(rowSize < 2){
            showCostTotal(false);
        }else{
            showCostTotal(false, totalCostPercent, totalCostAmount);
        }
    }

    function showCostTotal(isShow, totalCostPercent, totalCostAmount){
        if(isShow){
            $("#cost-total-title").html("总计:");
            $("#cost-total-percent").html("" + totalCostPercent + "%");
            $("#cost-total-amount").html("" + totalCostAmount.toFixed(2));
        }else{
            $("#cost-total-title").html("");
            $("#cost-total-percent").html("");
            $("#cost-total-amount").html("");    
        }
    }


    function bindDetailEvents() {

        $(".cost-detail .cost-department").unbind("change");
        $(".cost-detail .cost-department").bind("change", function () {
            $(".cost-detail").removeClass("input-warning");
        });
        $(".cost-detail .cost-city").unbind("change");
        $(".cost-detail .cost-city").bind("change", function () {
            $(".cost-detail").removeClass("input-warning");
        });
        $(".cost-detail .cost-department").unbind("resultChange");
        $(".cost-detail .cost-department").bind("resultChange", function () {
            var department = $(this);
            if (department.val() != undefined && department.val() != "" && department.attr("result") != "" && validateInt(department.attr("result"))) {
                department.removeClass("input-warning");
            } else {
                department.addClass("input-warning");
            }
        });

        $(".cost-detail .depart-search").unbind("click");
        $(".cost-detail .depart-search").bind("click", function () {
            var costInput = $(this).parent().find(".cost-department");
            var treeHtml = "";
            var budgetTypeId = $("#budget-subject").val();
            if(!budgetTypeId){
                showMsg($("#msg-container"), "请选择预算项目!");
                return;
            }
            $.ajax({
                type: "get",
                dataType: "json",
                url: "/expense/queryCostDeparts?budgetTypeId=" + budgetTypeId,
                success: function (data) {
                    $("#budget-depart-container .ex-modal-body").html("");
                    if(data.code == 404){
                        showMsg($("#msg-container"), "未获取到有效的承担部门信息！请联系fs.ba@dianping.com!");
                    }else if(data.code == 500){
                        showMsg($("#msg-container"), "系统异常，请稍后再试！");
                    }else if(data.code == 200){
                        var costDeparts = data.costDeparts;
                        treeHtml += "<div id=\"depart-tree\">";
                        treeHtml +="</div>";
                        $("#budget-depart-container").find(".ex-modal-body").append(treeHtml);
                        for(var i = 0; i<costDeparts.length; i++){
                            var departList = costDeparts[i];
                            for(var j= 0; j< departList.length; j++){
                                var ele = $("#depart-tree").find("#depart_" + departList[j].departmentId);
                                if(ele && ele.length > 0){
                                    continue;
                                }
                                var html = "";
                                if (j % 2 == 0) {
                                    html += "<ol class=\"depart-item level_" + departList[j].level + "\" id=\"depart_" + departList[j].departmentId + "\" cost=\"" + departList[j].cost + "\">" + getDepartmentName(departList[j]) +
                                    "<i class=\"fa-li fa fa-minus-square\"></i></ol>";
                                } else {
                                    html += "<li class=\"depart-item level_" + departList[j].level + "\" id=\"depart_" + departList[j].departmentId + "\" cost=\"" + departList[j].cost + "\">" + getDepartmentName(departList[j]) +
                                    "<i class=\"fa-li fa fa-minus-square\"></i></li>";
                                }
                                var parent = $("#depart-tree").find("#depart_" + departList[j].parentId);
                                if (parent && parent.length > 0) {
                                    $(parent).append(html);
                                } else {
                                    $("#depart-tree").append(html);
                                }
                            }
                        }
                        $(".depart-item[cost=true]").css("color", "#4CCCF7");
                        $("#depart-tree .depart-item").each(function(index, value){
                             if($(value).find(".depart-item").length == 0){
                                 $(value).find("i:first").removeClass("fa-minus-square");
                                 $(value).find("i:first").addClass("fa-sitemap");
                             }
                        });
                        showMsg($("#budget-depart-container"), "");
                        $("#depart-tree .depart-item").bind("click", function (e) {
                            e.stopPropagation();
                            var icons = $(this).find(".fa");
                            if($(icons[0]).hasClass("fa-plus-square")){
                                $(icons[0]).removeClass("fa-plus-square");
                                $(icons[0]).addClass("fa-minus-square");
                            } else if($(icons[0]).hasClass("fa-minus-square")){
                                $(icons[0]).removeClass("fa-minus-square");
                                $(icons[0]).addClass("fa-plus-square");
                            } else{
                                //do nothing
                            }
                            var children = $(this).find(".depart-item");
                            for(var i = 0; i< children.length; i++){
                                if($(children[i]).css("display") == "none"){
                                    $(children[i]).show();
                                } else{
                                    $(children[i]).hide();
                                }
                            }
                            var cost = $(this).attr("cost");
                            if(cost && cost == "true"){
                                $("#depart-tree .item-selected").css("color", "#4CCCF7");
                                $("#depart-tree .depart-item").removeClass("item-selected");
                                $(this).css("color", "#ff8800");
                                $(this).addClass("item-selected");
                            }
                        });

                        $("#confirm-select-depart").unbind("click");
                        $("#confirm-select-depart").bind("click", function(){
                            var departId = $("#depart-tree .item-selected a").attr("departId");
                            if(departId > 0){
                                var departName = $("#depart-tree .item-selected a").attr("departName");
                                costInput.attr("result", departId);
                                costInput.val(departName);
                                costInput.removeClass("input-warning");
                            }
                            release($("#budget-depart-container"));
                        });
                    }
                }
            });


            $("#cancel-select-depart").unbind("click");
            $("#cancel-select-depart").bind("click", function(){
                  release($("#budget-depart-container"));
            });
        });

        $(".cost-detail .cost-city").unbind("resultChange");
        $(".cost-detail .cost-city").bind("resultChange", function (e) {
            var city = $(this);
            if (city.val() != undefined && city.val() != "" && city.attr("result") != "" && validateInt(city.attr("result"))) {
                city.removeClass("input-warning");
            } else {
                city.addClass("input-warning");
            }
            $(".cost-detail").removeClass("input-warning");
        });

        $(".cost-detail .cost-amount").unbind("change");
        $(".cost-detail .cost-amount").bind("change", function (e) {
            calculateCostAmount();

        });

        $(".cost-detail .cost-rate").unbind("change");
        $(".cost-detail .cost-rate").bind("change", function (e) {
            var totalAmount = parseFloat($("#total-amount").attr("amount"));
            if(totalAmount < 0){
                return;
            }

            if (!validateInt($(this).val()) || parseInt($(this).val()) < 0) {
                $(this).val(0);
            }

            var costPercent = $(this).val();
            var costAmount = (totalAmount * costPercent / 100).toFixed(2);
            $(this).parent().parent().find(".cost-amount").val(costAmount);
            calculateCostAmount();
        });

        $("#participant-des").unbind("change");
        $("#participant-des").bind("change", function (e) {
            var type = $(this);
            if (type.val() != undefined && type.val() != "") {
                type.removeClass("input-warning");
            } else {
                type.addClass("input-warning");
            }
        });

        $(".item-detail .ex-type").unbind("change");
        $(".item-detail .ex-type").bind("change", function (e) {
            var type = $(this);
            if (type.val() != undefined && type.val() != "") {
                type.removeClass("input-warning");
            } else {
                type.addClass("input-warning");
            }
        });
        $(".item-detail .ex-date").unbind("click");
        $(".item-detail .ex-date").bind("click", function (e) {
            var date = $(this);
            if (date.val() != undefined && date.val() != "") {
                date.removeClass("input-warning");
            }
        });
        $(".item-detail .ex-date").unbind("change");
        $(".item-detail .ex-date").bind("change", function (e) {
            var date = $(this);
            if (date.val() != undefined && date.val() != "") {
                date.removeClass("input-warning");
            }
        });
        $(".item-detail .ex-desc").unbind("change");
        $(".item-detail .ex-desc").bind("change", function (e) {
            var desc = $(this);
            if (desc.val() != undefined && desc.val() != "") {
                desc.removeClass("input-warning");
            } else {
                desc.addClass("input-warning");
            }
        });
        $(".item-detail .ex-amount").unbind("change");
        $(".item-detail .ex-amount").bind("change", function (e) {
            var totalAmount = 0;
            $(".item-detail .ex-amount").each(function (index, value) {
                if (!validateFloat($(this).val()) || parseFloat($(this).val()) > 99999999) {
                    $(value).addClass("input-warning");
                    return;
                }
                $(value).removeClass("input-warning");
                var amount = $(value).val() == "" ? 0 : parseFloat($(value).val());
                totalAmount += amount;
            });
            $("#total-amount").html(pub.formatMoney(totalAmount, 2));
            $("#total-amount").attr("amount", totalAmount.toFixed(2));
            if ($(".cost-detail").length == 1) {
                $(".cost-detail").find(".cost-amount").val(totalAmount.toFixed(2));
            } else {
                $(".cost-detail .cost-rate").each(function (index, value) {
                    var cost_amount = $(".cost-detail .cost-rate").eq(index).val() / 100 * (totalAmount.toFixed(2));
                    $(".cost-detail .cost-amount").eq(index).val(cost_amount.toFixed(2));
                });
            }
            $(".cost-amount").trigger("change");
        });
        $(".item-detail .invoice-count").unbind("change");
        $(".item-detail .invoice-count").bind("change", function (e) {
            var totalInvoice = 0;
            $(".item-detail .invoice-count").each(function (index, value) {
                if (!validateInt($(this).val()) || parseInt($(this).val()) < 0) {
                    $(value).addClass("input-warning");
                    return;
                }
                $(value).removeClass("input-warning");
                var invoice = $(value).val() == "" ? 0 : parseInt($(value).val());
                totalInvoice += invoice;
            });
            $("#total-invoice-count").html(totalInvoice);
        });

        $(".delete-btn").unbind("click");
        $(".item-detail .delete-btn").bind("click", function (e) {
            $(this).parent().parent().parent().remove();
            updateExpense();
        });

        $(".cost-detail  .delete-btn").bind("click", function (e) {
            $(this).parent().parent().parent().remove();
            calculateCostAmount();
        });


        $(".item-detail .ex-amount").bind("blur", function () {
            if (validateFloat($(this).val())) {
                $(this).val(parseFloat($(this).val()).toFixed(2));
            }
        });
        $(".cost-detail .cost-rate").bind("blur", function () {
            if (validateFloat($(this).val())) {
                $(this).val(parseFloat($(this).val()).toFixed(0));
            }
        });
        $(".cost-detail .cost-amount").bind("blur", function () {
            if (validateFloat($(this).val())) {
                $(this).val(parseFloat($(this).val()).toFixed(2));
            }
        });
    }

    function updateExpense() {
        var totalAmount = 0;
        $(".item-detail .ex-amount").each(function (index, value) {
            if (!validateFloat($(this).val())) {
                $(value).addClass("input-warning");
                return;
            }
            $(value).removeClass("input-warning");
            var amount = $(value).val() == "" ? 0 : parseFloat($(value).val());
            totalAmount += amount;
        });
        $("#total-amount").html(pub.formatMoney(totalAmount, 2));
        $("#total-amount").attr("amount", totalAmount.toFixed(2));

        var totalInvoice = 0;
        $(".item-detail .invoice-count").each(function (index, value) {
            if (!validateInt($(this).val()) || parseInt($(this).val()) < 0) {
                $(value).addClass("input-warning");
                return;
            }
            $(value).removeClass("input-warning");
            var invoice = $(value).val() == "" ? 0 : parseInt($(value).val());
            totalInvoice += invoice;
        });
        $("#total-invoice-count").html(totalInvoice);

        $(".cost-detail .cost-rate").each(function (index, value) {
            if ($(".cost-detail .cost-rate").eq(index).val() != "") {
                var cost_amount = parseFloat($(".cost-detail .cost-rate").eq(index).val()) / 100 * totalAmount.toFixed(2);
                $(".cost-detail .cost-amount").eq(index).val(cost_amount.toFixed(2));
            }
        });

        calculateCostAmount();
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

    function copyNormalModal() {
        var clone = $("#normal-modal").clone();
        $(clone).removeAttr("id");
        $(clone).css("display", "");
        $(clone).addClass("item-detail");
        $(clone).insertBefore("#new-detail-item");
        $(clone).find(".ex-type").focus();
    }


    function copyCostModal() {
        var totalCostAmount = 0;
        $(".cost-detail .cost-amount").each(function (index, value) {
            $(value).removeClass("input-warning");
            if (!validateFloat($(this).val())) {
                $(value).addClass("input-warning");
                $(value).val("0.00");
            }
            
            var costAmount = parseFloat($(value).val());
            totalCostAmount += costAmount;
        });

        var clone = $("#cost-modal").clone();
        $(clone).removeAttr("id");
        $(clone).css("display", "");
        $(clone).addClass("cost-detail");
        $(clone).appendTo("#costDepartmentContainer");
        var totalAmount = parseFloat($("#total-amount").attr("amount"));
        if(!totalAmount){
            totalAmount = 0;
        }
        var lastCostAmount = totalAmount - totalCostAmount;
        if(lastCostAmount < 0){
            lastCostAmount = 0;
        }
        $(clone).find('.cost-amount').eq(0).val(lastCostAmount.toFixed(2));
        $(clone).find(".cost-city").eq(0).val("上海");
        $(clone).find(".cost-city").eq(0).attr("result", 1);
        $(clone).find(".cost-department").attr("param", "budgetTypeId=" + selectBudgetTypeId).focus();
        calculateCostAmount();
    }

    function bindModalEvents() {
        $(".cancel").bind("click", function (e) {
            $("#submit-container").hide();
            $("#budget-type-container").hide();
            $(".ex-modal-backdrop").remove();
        });

        $(".close").bind("click", function (e) {
            $("#msg-container").hide();
            $("#submit-container").hide();
            $("#budget-type-container").hide();
            $(".ex-modal-backdrop").remove();
        });

        $("#msg-confirm").bind("click", function (e) {
            $("#msg-container").hide();
            $(".ex-modal-backdrop").remove();
        });
    }


    function validateFloat(value) {
        if (value == "") {
            return false;
        }
        var regex = "^\\d{1,10}(?:\\.\\d{0,2})?$";
        if (new RegExp(regex, "g").exec(value) != null) {
            return true;
        }
        return false;
    }

    function validateInt(value) {
        if (value == "") {
            return false;
        }
        var regex = "^\\d{1,10}$";
        if (new RegExp(regex, "g").exec(value) != null) {
            return true;
        }
        return false;
    }

    function onbeforeunload_handler(){
        var isCheck=false;
        $(".autocheck").each(function (index, value) {
            var type = $(value);
            if (type.val() != ""&&type.val() != "0"&&type.val() != "-2") {
                isCheck= true;
                return;
            }
        });
        if ($("#expense-no") == undefined || $("#expense-no") == ""){
            isCheck=false;
        }
        if (isCheck){
            var warning="还没保存单据，确认退出?";
            return warning;
        }
    }

    function needConfirm() {
        $.ajax({
            type: "post",
            dataType: "json",
            url: "/pc/normal/isNeedConfirm",
            async: false,
            success: function (data) {
                if (data.code == 200) {
                    if (data.needConfirm == 1) {
                        isNeedConfirm = true;
                    } else if (data.needConfirm == 0) {
                        isNeedConfirm = false;
                    }
                    if (isNeedConfirm) {
                        generateTips();
                    }
                }
            }
        });
    }

    function generateTips() {
        var param = new Object();
        var costDepartmentIds = new Array();
        var costDepartmentNameStr = "";
        var budgetOwners = new Object();
        var budgetSubjectId = $("#budget-subject").val();

        $(".cost-detail").each(function (index,str) {
            var costDepartmentName = $(str).find(".cost-department").val();
            var costDepartmentId = $(str).find(".cost-department").attr("result");
            costDepartmentIds.push(costDepartmentId);
            costDepartmentNameStr += costDepartmentName + "<br>";
        });

        var totalAmount = parseFloat($("#total-amount").attr("amount"));

        param.costDepartmentIds = JSON.stringify(costDepartmentIds);
        param.budgetSubjectId = budgetSubjectId;
        param.proposerNo = $("#workId").attr("result");
        param.totalAmount = totalAmount;

        $.ajax({
            type: "post",
            dataType: "json",
            url: "/pc/normal/fetchBudgetOwner",
            data: param,
            async: false,
            success: function (data) {
                if (data.code == 200) {
                    budgetOwners = data.budgetOwners;
                }
            }
        });

        if (costDepartmentNameStr != "") {
            tips = "<br>承担部门为:<br> " + "<span style=\"color: #ff8400;\">" + costDepartmentNameStr + "</span>";
        }

        if (budgetOwners.length > 0) {
            tips += "预算Owner为:<br>" + "<span style=\"color: #ff8400;\">" + budgetOwners + "<br></span>";
        }
    }

});
