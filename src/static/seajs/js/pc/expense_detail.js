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
    var detail = require("./detailInfo.js");
    var weekMap = {1: "(一)", 2: "(二)", 3: "(三)", 4: "(四)", 5: "(五)", 6: "(六)", 0: "(日)"};
    var reqAsc = true;
    var orderField=1;
    var lineNum = 0;
    var BUDGETTYPEID_LVYOU = 212;

    module.exports= {
        show_expense_detail: function(expenseNo){
            if (!expenseNo) {
                return;
            }
            $("#expense-detail").hide();
            loading.show();

            $("#expense-detail-message").html("");
            //$("#expense-detail-container").html("");
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
            var tasks = new Object();
            var logs = new Object();

            if (expenseNo.substring(0, 1) == "A") {
                $("#audit-log").attr("catalog", 1);
                $.ajax({
                    type: "get",
                    dataType: "json",
                    url: "/pc/overtime/detail",
                    async: false,
                    data: "expenseNo=" + expenseNo + "&history=false&superRight=1",
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
                        logs = data.logs;
                        tasks = data.tasks;
                    }
                });
            } else if(expenseNo.substring(0,1) == "C"){
                $.ajax({
                    type: "get",
                    dataType: "json",
                    url: "/pc/normal/detail",
                    data: "expenseNo=" + expenseNo + "&history=false&superRight=1",
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
                        if(expense.budgetSubjectId!=BUDGETTYPEID_LVYOU){
                            $(".expense-des-div").hide();
                        }
                        logs = data.logs;
                        tasks = data.tasks;
                    }
                });
            }else if (expenseNo.substring(0, 1) == "T") {
                $.ajax({
                    type: "get",
                    dataType: "json",
                    url: "/pc/travel/detail",
                    data: "expenseNo=" + expenseNo + "&history=true",
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
                            //$("#relate-block").hide();
                            //$("#relate-cost-block").hide();
                        }
                        $(".relate-expense-des-div").hide();
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
                    data: "expenseNo=" + expenseNo + "&history=true",
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
                            //$("#relate-block").hide();
                            //$("#relate-cost-block").hide();
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
                    data: "expenseNo=" + expenseNo + "&history=false&superRight=1",
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
        }
    }

    function release(container) {
        $(".ex-modal-backdrop").remove();
        container.hide();
        container.fadeOut();
    }

    function clearDetail() {
        $("#proposer-name").html("");
        $("#proposer-department").html("");
        $("#proposer-city").html("");
        $("#proposer-tel").html("");
        $("#item-title").html("");
        $("#propose-date").html("");
        $("#budget-subject-name").html("");
    }

    function renderExpenseBaseInfo(expense) {
        $("#proposer-name").html(expense.proposerName);
        $("#proposer-department").html(expense.proposerDepartment);
        $("#proposer-city").html(expense.proposerCity);
        $("#proposer-tel").html(expense.proposerTel);
        $("#item-title").html(expense.expenseCatalog + "&nbsp" + expense.expenseNo);
        $("#propose-date").html("(" + expense.proposeDate + ")");
        $("#budget-subject-name").html(expense.budgetSubjectName);
        if(expense.expenseReason && expense.expenseReason != undefined){
            $("#expense-des").html($("#x").text(expense.expenseReason).html().replace(/[\r\n]/g,"<br>"));
        }else{
            $("#expense-des").html("");
        }

        try {
            if("一般报销" == expense.expenseCatalog){
                $("#budget-summary-btn").show();
                $("#budget-summary-btn").attr("costDepartmentId", expense.costItems[0].costDepartmentId);
                var expenseTypeIds = [];
                $(expense.items).each(function(index, item){expenseTypeIds.push(item.expenseTypeId)});
                $("#budget-summary-btn").attr("expenseTypeIds", expenseTypeIds.join(","));
                $("#budget-summary-btn").attr("budgetTypeId", expense.budgetSubjectId);
                var budgetYear = (new Date()).getFullYear();
                var budgetMonth = (new Date()).getMonth();
                try{
                    var executeDate = expense.proposeDate || expense.items[0].time || expense.items[0].date;
                    if(!executeDate){
                        budgetYear = executeDate.substring(0,4);
                        budgetMonth = executeDate.substring(5,7);
                    }
                }catch(ignore){
                }

                $("#budget-summary-btn").attr("budgetYear", budgetYear);
                $("#budget-summary-btn").attr("budgetMonth", budgetMonth);
            }else{
                $("#budget-summary-btn").hide();
            }
        }catch(e){
            console.log("ERROR:");
            console.log(e);
        }
    }

    function renderExpenseCostInfo(expense){
        insertCost(expense.costItems, $("#cost-block"));
    }

    function renderExpenseRelateCostInfo(expense){
        insertCost(expense.costItems, $("#relate-cost-block"));
        $("#relate-cost-block").show();
    }

    function generateNormalTR(item){
        return "<tr class=\"baseinfo-detail-value\">" +
            "<td width=\"15%\">" + item.type + "</td>" +
            "<td width=\"15%\">" + item.date + "</th>" +
            "<td width=\"40%\">" + item.des + "</td>" +
            "<td width=\"15%\">" + item.amount + "</td>" +
            "<td width=\"10%\" style=\"border-right:none;\">" + item.invoice + "</td>" +
            "</tr>";
    }

    function generateSignHtml(){
        return  "<div style='margin-bottom: 15px'><div style='display: inline-block;width: 30%;vertical-align: top;text-align: right;box-sizing: border-box;padding-right: 10px;'>加签人员：  </div>" +
            "<input type=\"text\" id=\"new-audit-member\" style=\"width:50%;\" class=\"txt-ex-form autocomplete\" placeholder='请输入名字或工号' suggest-url=\"/expense/realNameSuggest\"></div>" +
            "<div><div style='display: inline-block;width: 30%;vertical-align: top;text-align: right;box-sizing: border-box;padding-right: 10px;'>加签原因：  </div><textarea style='width: 50%;min-height: 100px;box-sizing: border-box' id=\"sign-memo\"></textarea></div>";
    }

    function generateGeneralSummaryInfo(invoice, amount){
        return "<div type=\"text\" class=\"submit-section\" style=\" height:50px;border-top: 1px solid #eee;\">" +
            "<div style=\"width: 25%; float: right; padding: 10px 0;margin-left: 10px;\">" +
            "<span>发票总张数：</span>" +
            "<span class=\"invoice-count\" style=\"color: #ff8400;\">" + invoice + "</span>" +
            "<span style=\"color: #ff8400;\">张</span>" +
            "</div>" +
            "<div style=\"width: 40%; float: right; padding: 10px 0;margin-left: 10px;\">" +
            "<span>报销金额总计：</span>" +
            "<span class=\"total-amount\" style=\"color: #ff8400;\">" + amount + "</span>" +
            "<span style=\"color: #ff8400;\">元</span>" + "</div></div>";
    }

    function renderRelateBaseInfo(relate){
        $("#relate-title").html("关联报销 " + relate.expenseNo);
        $("#relate-title").show();
        $("#relate-budget-subject-name").html(relate.budgetSubjectName);
        $("#relate-expense-des").html(relate.expenseReason);
        $("#relate-info").show();
    }

    function generateCostTR(item){
        return "<tr class=\"baseinfo-detail-value\">" +
            "<td width=\"35%\">" + item.costDepartment + "</td>" +
            "<td width=\"15%\">" + item.costCity + "</th>" +
            "<td width=\"15%\">" + item.costRate * 100 + "%" + "</td>" +
            "<td width=\"15%\">" + item.costAmount + "</td>" +
            "</tr>";
    }

    function insertCost(costItems, expenseBlock) {
        if (!costItems)return;
        expenseBlock.empty();
        var modal = $("#cost-modal").clone(true, true);
        modal.removeAttr("id");
        var invoiceCount = 0;
        for(var i = 0; i< costItems.length; i++){
            var itemHtml = generateCostTR(costItems[i]);
            $(modal).find(".cost-body").append(itemHtml);
        }
        modal.show();
        expenseBlock.append(modal);
        expenseBlock.show();
    }

    function insertNormal(normal, expenseBlock) {
        if (!normal)return;
        expenseBlock.empty();
        var modal = $("#normal-modal").clone(true, true);
        modal.removeAttr("id");
        $(".expense-des-div").show();
        var invoiceCount = 0;
        for(var i = 0; i< normal.items.length; i++){
            var itemHtml = generateNormalTR(normal.items[i]);
            invoiceCount += normal.items[i].invoice;
            $(modal).find(".normal-body").append(itemHtml);
        }
        modal.show();
        expenseBlock.append(modal);
        expenseBlock.show();
        expenseBlock.append(generateGeneralSummaryInfo(invoiceCount, normal.expenseTotalAmount));
    }

    function insertEntertain(entertainment, expenseBlock) {
        if (!entertainment)return;
        expenseBlock.empty();
        var modal = $("#entertainment-modal").clone(true, true);
        modal.removeAttr("id");
        $(".expense-des-div").show();
        var totalAmount = 0;
        var flag = true;
        var old_flag = false;
        for (var i = 0; i < entertainment.items.length; i++) {
            var item = entertainment.items[i];
            var expenseTypeName = item.expenseTypeName ? item.expenseTypeName : "";
            var date = item.date ? item.date : "";
            var place = item.place ? item.place : "";
            var object = item.object ? item.object : "";
            var person = item.person ? item.person : "";
            var des = item.des ? item.des : "";
            var etype = item.etype ? item.etype : "";
            var amount = item.amount ? parseFloat(item.amount) : 0;
            totalAmount += amount;
            if(object!=""){
                flag=true;
            }
            if(etype!="")
            {
                old_flag=true;
            }
            var itemHtml = "<tr>" + "<td>" + date +
                "</td><td class=\"expense-type\">" + expenseTypeName +
                "</td><td>" + place +
                "</td><td>" + person +
                "</td><td class=\"e-object\">" + object +
                "</td><td class=\"e-type\">" + etype +
                "</td><td>" + des +
                "</td><td>" + amount +
                "</td></tr>";
            $(modal).find(".entertain-body").append(itemHtml);
        }
        if(!flag){
            $(modal).find(".e-object").hide();
        }
        if(old_flag){
            $(modal).find(".expense-type").hide();
            $(modal).find(".e-type").show();
        }else{
            $(modal).find(".expense-type").show();
            $(modal).find(".e-type").hide();
        }
        modal.show();
        expenseBlock.append(modal);
        expenseBlock.show();
        expenseBlock.append(generateGeneralSummaryInfo(entertainment.invoiceCount, entertainment.totalAmount));
    }

    function insertTravelInfo(travel,expenseBlock) {
        if (!travel)return;
        expenseBlock.empty();
        $(".expense-des-div").show();
        var modal = $("#travel-modal").clone(true, true);
        modal.attr("id", "travel-detail");
        modal.find(".travelexpenseNo").html(travel.expenseNo);
        var hotelTotal = 0;
        var interCityTotal = 0;
        var localTotal = 0;
        var mealTotal = 0;
        for (var i = 0; i < travel.items.length; i++) {
            var item = travel.items[i];
            var interCity = item.interCity ? parseFloat(item.interCity) : 0;
            var time = item.time ? item.time : "";
            var city = item.city ? item.city : "";
            var hotel = item.hotel ? parseFloat(item.hotel) : 0;
            var departure = item.departure ? item.departure : "";
            var local = item.local ? parseFloat(item.local) : 0;
            var meal = item.meal ? parseFloat(item.meal) : 0;
            var rowTotal = interCity + hotel + local + meal;
            hotelTotal += hotel;
            interCityTotal += interCity;
            localTotal += local;
            mealTotal += meal;
            var itemHtml = "<tr>" + "<td>" + time + "</td><td>" +
                departure + "</td><td>" + city +
                "</td><td>" + hotel +
                "</td><td>" + interCity +
                "</td><td>" + local +
                "</td><td>" + meal +
                "</td><td>" + rowTotal +
                "</td></tr>";
            $(modal).find(".travel-body").append(itemHtml);
        }
        var summaryHtml = "<tr><td colspan=\"3\">金额小计" + "</td><td>" + hotelTotal +
            "</td><td>" + interCityTotal + "</td><td> " + localTotal + "</td><td>" + mealTotal + "</td><td></td></tr>";
        $(modal).find(".travel-body").append(summaryHtml);
        var invoiceHtml = "<tr><td colspan=\"3\">发票张数" + "</td><td>" + travel.hotelInvoice +
            "</td><td>" + travel.interCityInvoice + "</td><td> " + travel.localInvoice + "</td><td>" + travel.mealInvoice + "</td><td></td></tr>";
        $(modal).find(".travel-body").append(invoiceHtml);
        modal.show();
        expenseBlock.append(modal);
        expenseBlock.show();
        var invoiceTotal = travel.hotelInvoice + travel.interCityInvoice + travel.localInvoice + travel.mealInvoice;
        expenseBlock.append(generateGeneralSummaryInfo(invoiceTotal, travel.totalAmount));
    }

    function insertOvertimeInfo(overtime, expenseBlock){
        if (!overtime)return;
        var num = 0;
        expenseBlock.empty();
        $(".expense-des-div").hide();
        for (var i = 0; i < overtime.items.length; i++) {
            num++;
            var item = overtime.items[i];
            var newItem = $("#overtime-modal").clone(true, true);
            var newId = newItem.attr("id") + "-" + num;
            newItem.attr("id", newId);
            expenseBlock.append(newItem);
            expenseBlock.show();
            var calendarButton = newItem.find(".calendar-btn");
            calendarButton.attr("openId", overtime.proposerNo);
            calendarButton.attr("year", item.year);
            calendarButton.attr("month", item.month);
            $.ajax({
                type: "get",
                dataType: "json",
                url: "/pc/overtime/calendar",
                data: "year=" + item.year + "&month=" + item.month + "&openId=" + overtime.proposerNo,
                async: false,
                success: function (data) {
                    $("#" + newId + " .reimbursedMeal").html(data.info.reimbursedMeal);
                    $("#" + newId + " .totalMeal").html(data.info.totalMeal);
                    $("#" + newId + " .reimbursedTaxi").html(data.info.reimbursedTaxi);
                    $("#" + newId + " .totalTaxi").html(data.info.totalTaxi);
                    if (data.info.reimbursedMeal > data.info.totalMeal) {
                        $("#" + newId + " .reimbursedMeal").css("color", "red");
                        $("#" + newId + " .totalMeal").css("color", "black");
                        $("#" + newId + " .wot-div img").attr("src", "/img/icon_meals.png");
                        $("#" + newId + " .wot-div").css("border-color", "#ff8400");
                    } else {
                        $("#" + newId + " .wot-div").css("border-color", "#aaa");
                        $("#" + newId + " .wot-div img").attr("src", "/img/icon_meals_grey.png");
                    }
                    if (data.info.reimbursedTaxi > data.info.totalTaxi) {
                        $("#" + newId + " .reimbursedTaxi").css("color", "red");
                        $("#" + newId + " .totalTaxi").css("color", "black");
                        $("#" + newId + " .taxi-div img").attr("src", "/img/icon_taxis.png");
                        $("#" + newId + " .taxi-div").css("border-color", "#08c");
                    } else {
                        $("#" + newId + " .taxi-div").css("border-color", "#aaa");
                        $("#" + newId + " .taxi-div img").attr("src", "/img/icon_taxis_grey.png");
                    }
                }
            });
            $("#" + newId + " .item-month").html(item.year + "年" + item.month + "月");
            $("#" + newId + " .regular-meal-times").html(item.regularMealTimes);
            $("#" + newId + " .regular-meal-amount").html(item.regularMealAmount);
            $("#" + newId + " .other-meal-times").html(item.otherMealTimes);
            $("#" + newId + " .other-meal-amount").html(item.otherMealAmount);
            $("#" + newId + " .regular-taxi-times").html(item.regularTaxiTimes);
            $("#" + newId + " .regular-taxi-amount").html(item.regularTrafficAmount);
            $("#" + newId + " .other-taxi-times").html(item.otherTaxiTimes);
            $("#" + newId + " .other-taxi-amount").html(item.otherTrafficAmount);
            $("#" + newId + " .meal-invoice-amount").html(item.mealInvoiceAmount);
            $("#" + newId + " .taxi-invoice-amount").html(item.trafficInvoiceAmount);
            $("#" + newId).show();
        }
        var totalAmountHtml =  "<div type=\"text\" class=\"submit-section\" style=\" height:50px;border-top: 1px solid #eee;\">" +
            "<div style=\"float: right; padding: 10px 0;margin-left: 10px;\">" +
            "<span>报销金额总计：</span>" +
            "<span class=\"total-amount\" style=\"color: #ff8400;\">" + overtime.expenseTotalAmount + "</span>" +
            "<span style=\"color: #ff8400;\">元</span>" + "</div></div>";
        expenseBlock.append(totalAmountHtml);
    }

    function insertWelfare(welfare,expenseBlock) {
        if (!welfare)return;
        expenseBlock.empty();
        $(".expense-des-div").hide();
        var modal = $("#welfare-modal").clone(true, true);
        modal.removeAttr("id");
        var item = welfare.items[0];
        $(modal).find('.welfare-type').html(item.wtype);
        var wtypeId = item.wtypeId;
        if (wtypeId == 1) {
            $(modal).find('.certificate-date').html(item.bday);
            $(modal).find('.certificate-name').html("宝贝出生日期");
            $(modal).find('.death-div').hide();
            $(modal).find(".certificate-div").show();
        } else if (wtypeId == 2) {
            $(modal).find('.certificate-date').html(item.bday);
            $(modal).find('.certificate-name').html("结婚证明");
            $(modal).find('.death-div').hide();
            $(modal).find(".certificate-div").show();
        } else if (wtypeId == 3) {
            $(modal).find('.death-des').html(item.des);
            $(modal).find('.death-div').show();
            $(modal).find(".certificate-div").hide();
        }
        var entryDate;
        $.ajax ({
            type : "get",
            dataType: "json",
            url: "/pc/welfare/entrydate",
            data: "openId=" + welfare.proposerNo,
            async: false,
            success: function (data) {
                entryDate = data.entryDate;
            }
        });
        $.ajax({
            type : "get",
            url: "/pc/welfare/history",
            data: "openId=" + welfare.proposerNo + "&wtype=" + wtypeId + "&proposeDate=" + welfare.proposeDate,
            async: false,
            success: function (data) {
                var count = data.count;
                var historySummary = data.summaryBeanList;
                $(modal).find('#welfareCount').html(count);
                $(modal).find('#welfareEntryDate').html(entryDate);
                var validate = true;
                if (wtypeId !=3 && count > 0) {
                    $(modal).find("#welfareCount").css("color", "red");
                    validate = false;
                }
                if (wtypeId !=3 && !validateWelfareDate(entryDate, item, wtypeId)) {
                    $(modal).find("#welfareEntryDate").css("color", "red");
                    validate = false;
                }
                if(!validate) {
                    $(modal).find(".welfare-history-div img").attr("src", "/img/icon_meals.png");
                    $(modal).find(".welfare-history-div").css("border-color", "#ff8400");
                } else {
                    $(modal).find(".welfare-history-div").css("border-color", "#aaa");
                    $(modal).find(".welfare-history-div img").attr("src", "/img/icon_meals_grey.png");
                }

                if(count > 0) {
                    var html = "";
                    for (var i = 0; i < historySummary.length; i++) {
                        var history = historySummary[i];
                        html += buildWelfareTR(history, wtypeId);
                    }
                    var detailHtml = buildWelfareDetail(wtypeId, html);
                    $(modal).find("#welfare-history-btn").show();
                    $(modal).find("#welfare-history-btn").unbind();
                    $(modal).find("#welfare-history-btn").bind("click", function () {
                        block();
                        showDialog($("#calendar-container"), "报销记录", detailHtml);
                    });
                    $("#confirm-calendar").unbind();
                    $("#confirm-calendar").bind("click", function (e) {
                        release($("#calendar-container"));
                    });
                } else {
                    $(modal).find("#welfare-history-btn").hide();
                }
            }
        });
        modal.show();
        expenseBlock.append(modal);
        expenseBlock.show();
        var attachmentHtml = generateAttachmentHtml(welfare);
        if(attachmentHtml != "") {
            expenseBlock.append(attachmentHtml);
        }
        var totalAmountHtml =  "<div type=\"text\" class=\"submit-section\" style=\" height:50px;border-top: 1px solid #eee;clear:both;\">" +
            "<div style=\"float: right; padding: 10px 0;margin-left: 10px;\">" +
            "<span>报销金额总计：</span>" +
            "<span class=\"total-amount\" style=\"color: #ff8400;\">" + welfare.expenseTotalAmount + "</span>" +
            "<span style=\"color: #ff8400;\">元</span>" + "</div></div>";
        expenseBlock.append(totalAmountHtml);
    }

    function generateAttachmentHtml(expense) {
        if (!expense)return;
        var attachmentHtml = "<div  id=\"attachment-div\" style=\"border-top:1px solid #eee; clear:both;\">";
        var item = expense.items[0];
        var wtypeId = item.wtypeId;
        if ((wtypeId == 1 || wtypeId == 2) && expense.attachmentIdList && expense.attachmentIdList.length > 0) {
            var image = "";
            for (var i = 0; i < expense.attachmentIdList.length; i++) {
                var fileId = expense.attachmentIdList[i];
                $.ajax({
                    type: "GET",
                    url: "/attachment/ajax/fetchAttachmentCode?accessToken=123&fileId=" + fileId,
                    async: false,
                    success: function (data) {
                        if (data.code != 200) {
                            image += "<p style=\"margin-left:10px;\">获取附件失败！</p>";
                            return;
                        }
                        var response = data.base64Code;
                        var fileName = data.fileName;
                        var fileType = fileName.substring(fileName.indexOf(".") + 1, fileName.length);
                        image += "<img style='max-width:100%' src='data:image/png;base64," + response + "'></img>";
                    }
                });
            }
            attachmentHtml += image;
            attachmentHtml += "</div>";
            return attachmentHtml;
        } else {
            return "";
        }
    }


    function buildWelfareTR(history, wtypeId) {
        var proposeDate = history.proposeDate;
        var wtype = "";
        var desc = "";
        if (wtypeId == 1) {
            wtype = "生子";
            desc = history.bday;
        } else if (wtypeId == 2) {
            wtype = "结婚";
            desc = history.wday;
        } else if (wtypeId == 3) {
            wtype = "直系家属离世";
            desc = history.description;
        }
        var html = "<tr><td width=\"25%\">" + proposeDate + "</td>" +
            "<td width=\"35%\">" + wtype + "</td>" +
            "<td width=\"40%\">" + desc + "</td></tr>";
        return html;
    }

    function buildWelfareDetail(wtypeId, html) {
        var detailHtml = "<div class=\"ui-simple-div\" style='background-color: #eee;'>" +
            "<table style=\"width: 100%\" rules=\"rows\">";
        if (wtypeId == 1) {
            detailHtml +=
                "<thead><tr><th width=\"25%\">申请时间</th>" +
                "<th width=\"35%\">报销类别</th>" +
                "<th width=\"40%\">宝贝出生日期</th></tr></thead>";
        } else if (wtypeId == 2) {
            detailHtml +=
                "<thead><tr><th width=\"25%\">申请时间</th>" +
                "<th width=\"35%\">报销类别</th>" +
                "<th width=\"40%\">结婚日期</th></tr></thead>";
        } else if (wtypeId == 3) {
            detailHtml +=
                "<thead><tr><th width=\"25%\">申请时间</th>" +
                "<th width=\"35%\">报销类别</th>" +
                "<th width=\"40%\">说明</th></tr></thead>";
        }

        detailHtml += "</table></div><div class=\"ui-simple-div\" style='width: 100%;overflow-y: auto;max-height: 450px'><table style='width: 100%'>" +
            "<tbody id=\"table-body\">" + html + "</tbody></table></div>";
        return detailHtml;
    }

    function validateWelfareDate(date, item, wtypeId) {
        var entry = new Date(date.replace(/-/g,   "/"));
        var certificate;
        if(wtypeId == 1) {
            certificate = new Date(item.bday.replace(/-/g,   "/"));
        } else if (wtypeId == 2) {
            certificate = new Date(item.wday.replace(/-/g,   "/"));
        }

        if(entry > certificate) {
            return false;
        }
        return true;
    }

    function getDaysInMonth(year, month) {
        var temp = new Date(year, month, 0);
        return temp.getDate();
    }

    function getWeekDay(year, month, day) {
        var temp = new Date(year, month - 1, day);
        return weekMap[temp.getDay()];
    }

    function buildTR(item, year, month, dayOfMonth) {
        var style = "";
        var start = "-";
        var end = "-";
        var meal = "";
        var taxi = "";
        var day = (month >= 10 ? month : "0" + month) + "/" + (dayOfMonth >= 10 ? dayOfMonth : "0" + dayOfMonth) + getWeekDay(year, month, dayOfMonth);
        if (item) {
            start = item.beginTime;
            end = item.offTime;
            meal = item.meal;
            taxi = item.taxi;
            if (item.special) {
                style = "cal-italic-font";
            }
        }
        var html = "<tr class = '" + style + "'><td width='25%'>" + day + "</td><td width='25%'>" + start + "</td><td width='25%'>" + end + "</td>";
        if (meal != "食堂") {
            html += "<td class='cal-orange-font' width='13%'>" + meal + "</td>";
        } else {
            html += "<td width='13%'>食堂</td>";
        }
        html += "<td class='cal-blue-font' width='12%'>" + taxi + "</td>";
        html += "</tr>";
        return html;
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
        if (dialog.attr("id") == "msg-container") {
            setTimeout(function () {
                release($("#msg-container"));
            }, 3000);
        }
    }

    function showMessage(content){
        var dialog = $("#expense-detail-message-dialog");
        showMsg(dialog, content);
    }

});