define(function (require, exports, module) {
    var $ = require('./jquery');
    var pub = require("./public");
    var weekMap = {1: "(一)", 2: "(二)", 3: "(三)", 4: "(四)", 5: "(五)", 6: "(六)", 0: "(日)"};
    var reqAsc = true;

    module.exports = {
        generateGeneralSummaryInfo: function (invoice, amount) {
            return "<div type=\"text\" class=\"submit-section\" style=\"border-top: 1px solid #eee;height:40px;\">" +
                "<div style=\"width: 25%; float: right; padding: 10px 0;margin-left: 10px;text-align:right;margin-right:20px;\">" +
                "<span class=\"bottominfo-key\">发票总张数：</span>" +
                "<span class=\"total-count bottominfo-value\">" + invoice + "</span>" +
                "<span class=\"bottominfo-value\"> 张</span>" +
                "</div>" +
                "<div style=\"width: 45%; float: right; padding: 10px 0;margin-left: 10px;text-aign:right;\">" +
                "<span class=\"bottominfo-key\">报销金额总计：</span>" +
                "<span class=\"total-amount bottominfo-value\">" + amount + "</span>" +
                "<span class=\"bottominfo-value\"> 元</span>" + "</div></div>";

        },
        generateRelateSummaryInfo:function(invoice, amount){
            return "<div type=\"text\" class=\"submit-section\" style=\"border-top: 1px solid #eee;height:40px;\">" +
                "<div style=\"width: 25%; float: right; padding: 10px 0;margin-left: 10px;text-align:right;margin-right:20px;\">" +
                "<span class=\"bottominfo-key\" style=\"font-size:13px;\">发票总张数：</span>" +
                "<span>" + invoice + "</span>" +
                "<span> 张</span>" +
                "</div>" +
                "<div style=\"width: 30%; float: right; padding: 10px 0;margin-left: 10px;text-aign:right;\">" +
                "<span class=\"bottominfo-key\" style=\"font-size:13px;\">报销金额总计：</span>" +
                "<span>" + amount + "</span>" +
                "<span> 元</span>" + "</div></div>";
        },
        insertCost:function(costItems, expenseBlock){
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
        } ,
        insertNormal:function(normal, expenseBlock){
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
            expenseBlock.append(this.generateGeneralSummaryInfo(invoiceCount, normal.expenseTotalAmount));
        },
        insertEntertain:function(entertainment, expenseBlock){
            if (!entertainment)return;
            expenseBlock.empty();
            var modal = $("#entertainment-modal").clone(true, true);
            modal.removeAttr("id");
            $(".expense-des-div").show();
            var totalAmount = 0;
            var flag = false;
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
                var amount = item.amount ? item.amount : 0;
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
            expenseBlock.append(this.generateRelateSummaryInfo(entertainment.invoiceCount, entertainment.totalAmount));
        } ,
        insertOvertimeInfo:function(overtime, expenseBlock){
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
        } ,
        insertTravelInfo:function(travel,expenseBlock){
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
                var interCity = item.interCity ? pub.formatMoney(item.interCity,2) : pub.formatMoney(0,2);
                var time = item.time ? item.time : "";
                var city = item.city ? item.city : "";
                var hotel = item.hotel ? pub.formatMoney(item.hotel,2) : pub.formatMoney(0,2);
                var departure = item.departure ? item.departure : "";
                var local = item.local ? pub.formatMoney(item.local,2) : pub.formatMoney(0,2);
                var meal = item.meal ? pub.formatMoney(item.meal,2) : pub.formatMoney(0,2);
                var rowTotal = parseFloat(item.interCity == undefined ? 0 : item.interCity) + parseFloat(item.hotel == undefined ? 0 : item.hotel) + parseFloat(item.local == undefined ? 0 : item.local) + parseFloat(item.meal == undefined? 0 : item.meal);
                hotelTotal += parseFloat(item.hotel == undefined ? 0 : item.hotel);
                interCityTotal += parseFloat(item.interCity == undefined ? 0 : item.interCity);
                localTotal += parseFloat(item.local == undefined ? 0 : item.local);
                mealTotal += parseFloat(item.meal == undefined ? 0 : item.meal);
                var itemHtml = "<tr>" + "<td>" + time + "</td><td>" +
                    departure + "</td><td>" + city +
                    "</td><td>" + hotel +
                    "</td><td>" + interCity +
                    "</td><td>" + local +
                    "</td><td>" + meal +
                    "</td><td>" + pub.formatMoney(rowTotal,2) +
                    "</td></tr>";
                $(modal).find(".travel-body").append(itemHtml);
            }
            var summaryHtml = "<tr><td colspan=\"3\">金额小计" + "</td><td>" + pub.formatMoney(hotelTotal,2) +
                "</td><td>" + pub.formatMoney(interCityTotal,2) + "</td><td> " + pub.formatMoney(localTotal,2) + "</td><td>" + pub.formatMoney(mealTotal,2) + "</td><td></td></tr>";
            $(modal).find(".travel-body").append(summaryHtml);
            var invoiceHtml = "<tr><td colspan=\"3\">发票张数" + "</td><td>" + travel.hotelInvoice +
                "</td><td>" + travel.interCityInvoice + "</td><td> " + travel.localInvoice + "</td><td>" + travel.mealInvoice + "</td><td></td></tr>";
            $(modal).find(".travel-body").append(invoiceHtml);
            modal.show();
            expenseBlock.append(modal);
            expenseBlock.show();
            var invoiceTotal = parseInt(travel.hotelInvoice) + parseInt(travel.interCityInvoice) + parseInt(travel.localInvoice) + parseInt(travel.mealInvoice);
            expenseBlock.append(this.generateRelateSummaryInfo(invoiceTotal, travel.totalAmount));
        } ,
        insertWelfare:function(welfare,expenseBlock){
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
                $(modal).find('.certificate-date').html(item.wday);
                $(modal).find('.certificate-name').html("结婚日期");
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
                        $(modal).find(".welfare-history-div img").attr("src", "/img/icon-welfare.png");
                        $(modal).find(".welfare-history-div").css("border-color", "#ff8400");
                    } else {
                        $(modal).find(".welfare-history-div").css("border-color", "#aaa");
                        $(modal).find(".welfare-history-div img").attr("src", "/img/icon-welfare-grey.png");
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
                $("#attachment-div").append(attachmentHtml);
                $("#attachment-title").show();
                $("#collapse-search-handler-attachment").show();
            }
            var totalAmountHtml =  "<div type=\"text\" class=\"submit-section\" style=\" height:50px;border-top: 1px solid #eee;clear:both;\">" +
                "<div style=\"float: right; padding: 10px 0;margin-left: 10px;\">" +
                "<span>报销金额总计：</span>" +
                "<span class=\"total-amount\" style=\"color: #ff8400;\">" + welfare.expenseTotalAmount + "</span>" +
                "<span style=\"color: #ff8400;\">元</span>" + "</div></div>";
            expenseBlock.append(totalAmountHtml);
        } ,
        bindCalendar:function(){
            $(".calendar-btn").bind("click", function (e) {
                block();
                var openId = $(this).attr("openId");
                var year = $(this).attr("year");
                var month = $(this).attr("month");
                $.ajax({
                    type: "get",
                    dataType: "json",
                    url: "/pc/overtime/calendar",
                    data: "year=" + year + "&month=" + month + "&openId=" + openId,
                    success: function (data) {
                        var info = data.info;
                        var html = "";
                        for (var i = 1; i <= getDaysInMonth(year, month); i++) {
                            var item = info.items[i];
                            html += buildTR(item, year, month, i);
                        }
                        var calendarHtml = "<div class=\"ui-simple-div\" style='background-color: #eee; padding-right: 15px'>" +
                            "<table style=\"width: 100%\" rules=\"rows\">" +
                            "<thead><tr class=\"item-head\"><th width=\"25%\">日期</th>" +
                            "<th width=\"25%\">上班时间</th>" +
                            "<th width=\"25%\">下班时间</th>" +
                            "<th width=\"13%\">餐费</th>" +
                            "<th width=\"12%\">车费</th></tr></thead></table></div><div class=\"ui-simple-div\" style='width: 100%;overflow-y: auto;max-height: 450px'><table style='width: 100%'>" +
                            "<tbody id=\"table-body\">" + html + "</tbody></table></div>";
                        showDialog($("#calendar-container"), "考勤记录", calendarHtml);
                    }
                });
                $("#confirm-calendar").bind("click", function (e) {
                    release($("#calendar-container"));
                });
            });
        },
        clearDetail:function(){
            $("#proposer-name").html("");
            $("#proposer-department").html("");
            $("#proposer-city").html("");
            $("#proposer-tel").html("");
            $("#item-title").html("");
            $("#propose-date").html("");
            $("#budget-subject-name").html("");
        },
        bindSortColumn: function(columnHeadName, columnHeadObject, sortField) {
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
    } //end of exports


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
    }
    function block() {
        var maskHtml = '<div class="ex-modal-backdrop"></div>';
        $(maskHtml).prependTo(document.body);
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
    function getDaysInMonth(year, month) {
        var temp = new Date(year, month, 0);
        return temp.getDate();
    }
    function accMul(arg1,arg2) {

        var m=0,s1=arg1.toString(),s2=arg2.toString();

        try{m+=s1.split(".")[1].length}catch(e){}

        try{m+=s2.split(".")[1].length}catch(e){}

        return Number(s1.replace(".",""))*Number(s2.replace(".",""))/Math.pow(10,m)
    }

    function generateCostTR(item){
        return "<tr class=\"baseinfo-detail-value\">" +
            "<td width=\"35%\">" + item.costDepartment + "</td>" +
            "<td width=\"15%\">" + item.costCity + "</th>" +
            "<td width=\"15%\">" + accMul(item.costRate,100) + "%" + "</td>" +
            "<td width=\"15%\">" + pub.formatMoney(item.costAmount,2) + "</td>" +
            "</tr>";
    }


    function generateNormalTR(item){
        return "<tr class=\"baseinfo-detail-value\">" +
            "<td width=\"15%\">" + item.type + "</td>" +
            "<td width=\"15%\">" + item.date + "</th>" +
            "<td width=\"40%\">" + item.des + "</td>" +
            "<td width=\"15%\">" + item.amountStr + "</td>" +
            "<td width=\"10%\" style=\"border-right:none;\">" + item.invoice + "</td>" +
            "</tr>";
    }


    function generateAttachmentHtml(expense) {
        if (!expense)return;
        var attachmentHtml = "";
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

    function getWeekDay(year, month, day) {
        var temp = new Date(year, month - 1, day);
        return weekMap[temp.getDay()];
    }

    function release(container) {
        $(".ex-modal-backdrop").remove();
        container.hide();
        container.fadeOut();
    }

});