define(function (require, exports, module) {
    var $ = require('./jquery');
    var loading = require("./loading");
    var orange = "rgba(255, 132, 0, 1)";
    var grey = "rgba(192, 192, 192, 1)";
    var black = "rgba(0, 0, 0, 1)";
    var lradius = 20;
    var sradius = 10;
    var arcwidth = 6;
    var upDist = 40;
    var downDist = 40;
    var y = 70;
    var dist = 100;
    var logDist = 30;
    var logLineHeight = 15;
    var logRadius = 5;
    var logX = 20;
    var weekMap = {1: "(一)", 2: "(二)", 3: "(三)", 4: "(四)", 5: "(五)", 6: "(六)", 0: "(日)"};

    module.exports = {
        bindCommon: function () {
            $("#confirm-msg").live("click", function (e) {
                $("#message-container").hide();
                $(".modal-backdrop").remove();
            });

            $(".close").live("click", function (e) {
                $(this).parent().parent().parent().parent().hide();
                $(".modal-backdrop").remove();
            });
            //log
            $("#audit-log").bind("click", function () {
                if ($("#log-display-div")[0].style.display == "none") {
                    $.ajax({
                        type: "get",
                        dataType: "json",
                        url: "/pc/expense/auditLog",
                        data: "processId=" + $(this).attr("processId") + "&expenseNo=" + $(this).attr("expenseNo") + "&superRight=1",
                        async: false,
                        success: function (data) {
                            if(data.logs && data.logs != undefined){
                                drawLog(data.logs);
                            }
                        }
                    });
                    $("#fold-span").removeClass("fold");
                    $("#fold-span").addClass("unfold");
                    $("#log-display-div").show();
                    //var height = $(window).height();
                    //scroll(height, 1000);
                } else {
                    $("#fold-span").removeClass("unfold");
                    $("#fold-span").addClass("fold");
                    $("#log-display-div").hide();
                }
            });

            $(".cancel").bind("click", function (e) {
                $(".modal").hide();
                $(".modal-backdrop").remove();
            });

            $(".close").bind("click", function (e) {
                $("#reject-container").hide();
                $("#calendar-container").hide();
                $(".modal-backdrop").remove();
            });

            $(".calendar-btn").bind("click", function (e) {
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
                            "<thead><tr><th width=\"25%\">日期</th>" +
                            "<th width=\"25%\">上班时间</th>" +
                            "<th width=\"25%\">下班时间</th>" +
                            "<th width=\"13%\">餐费</th>" +
                            "<th width=\"12%\">车费</th></tr></thead></table></div><div class=\"ui-simple-div\" style='width: 100%;overflow-y: auto;max-height: 450px'><table style='width: 100%'>" +
                            "<tbody id=\"table-body\">" + html + "</tbody></table></div>";
                        showDialog($("#calendar-container"), "考勤记录", calendarHtml);
                    }
                });
                $("#confirm-calendar").bind("click", function (e) {
                    $("#calendar-container").hide();
                    $(".modal-backdrop").remove();
                });

            });
        },

        bindTR : function(data) {
            loading.hide();
            $(".recordCount").html(data.expenseSummaryInfoModel.recordCount);
            $('.select-all').attr('checked', false);
            $('.select-div').hide();

            if (data.expenseSummaryInfoModel.recordCount == 0) {
                $('.selected-todo').hide();
                $('.select-all').hide();
                $("#item-content").hide();
            } else {
                $("#item-content").show();
                $('.select-all').show();
            }

            $(".overtime-tr").bind("click", function () {
                var taskName = $(this).attr("taskName");
                var taskId = $(this).attr("taskId");
                var processId = $(this).attr("processId");
                var assigneeWorkNo = $(this).attr("assigneeWorkNo");
                var assigneeName = $(this).attr("assigneeName");
                var assignee = assigneeName + "(" + assigneeWorkNo + ")";
                if(!assigneeWorkNo || assigneeWorkNo == ""){
                    assignee = "";
                }
                $("#taskName").html("状态 " + taskName + " " + assignee);
                $("#todo_list tr").css("background-color","white");
                $(this).css("background-color", "#8BC2F5");
                $("#audit-log").attr("processId", processId);
                $("#audit-log").attr("expenseNo", $(this).attr("expenseNo"));

                var expenseNo = $(this).attr("expenseNo");
                loading.show();
                if (expenseNo.substring(0, 1) == "A") {
                    $("#audit-log").attr("catalog", 1);
                    $.ajax({
                        type: "get",
                        dataType: "json",
                        url: "/pc/overtime/detail",
                        async: false,
                        data: "processId=" + $(this).attr("processId") + "&expenseNo=" + $(this).attr("expenseNo") + "&history=true&superRight=1",
                        success: function (data) {
                            loading.hide();
                            if (data.code != 200) {
                                $("#detail-container").hide();
                                return;
                            }
                            var expense = data.expense;
                            clearDetail();

                            $("#proposerName").html(expense.proposerName);
                            $("#proposerDepartment").html(expense.proposerDepartment);
                            $("#proposerCity").html(expense.proposerCity);
                            $("#proposerTel").html(expense.proposerTel);
                            $("#expenseCatalog").html(expense.expenseCatalog);
                            $("#expenseNo").html(expense.expenseNo);
                            $("#proposeDate").html(expense.proposeDate);
                            $("#total-amount").html(expense.expenseTotalAmount);
                            insertOvertimeInfo(expense);
                            $("#detail-container").show();

                        }
                    });
                } else if (expenseNo.substring(0, 1) == "T") {
                    $("#audit-log").attr("catalog", 2);
                    var param = new Object();
                    param.processId = $(this).attr("processId") ? $(this).attr("processId") : "";
                    param.expenseNo = expenseNo ? expenseNo : "";
                    param.showLog = true;
                    param.history = true;
                    param.superRight = 1;
                    $.ajax({
                        type: "get",
                        dataType: "json",
                        url: "/pc/travel/detail",
                        data: param,
                        async: false,
                        success: function (data) {
                            loading.hide();
                            if (data.code == 500) {
                                $("#detail-container").hide();
                                return;
                            }
                            var expense = data.expense;
                            clearDetail();
                            $("#proposerName").html(expense.proposerName);
                            $("#proposerDepartment").html(expense.proposerDepartment);
                            $("#proposerCity").html(expense.proposerCity);
                            $("#proposerTel").html(expense.proposerTel);
                            $("#expenseCatalog").html(expense.expenseCatalog);
                            $("#expenseNo").html(expense.expenseNo);
                            $("#proposeDate").html(expense.proposeDate);
                            $("#total-amount").html(expense.totalAmount);
                            $("#month-info").html(insertTravelInfo(expense));
                            if (data.relates != null && data.relates.length > 0) {
                                for (var i = 0; i < data.relates.length; i++) {
                                    $("#supplemental-info").append(insertEntertain(data.relates[i]));
                                }
                            }
                            $("#entertainment-no").show();
                            $("#travel-no").hide();
                            $("#detail-container").show();
                        }
                    });
                }
                else if (expenseNo.substring(0, 1) == "E") {
                    $("#audit-log").attr("catalog", 6);
                    var param = new Object();
                    param.processId = $(this).attr("processId") ? $(this).attr("processId") : "";
                    param.expenseNo = expenseNo ? expenseNo : "";
                    param.history = true;
                    param.superRight = 1;
                    $.ajax({
                        type: "get",
                        dataType: "json",
                        url: "/pc/entertainment/detail",
                        data: param,
                        async: false,
                        success: function (data) {
                            loading.hide();
                            if (data.code == 500) {
                                $("#detail-container").hide();
                                return;
                            }
                            var expense = data.expense;
                            clearDetail();
                            $("#proposerName").html(expense.proposerName);
                            $("#proposerDepartment").html(expense.proposerDepartment);
                            $("#proposerCity").html(expense.proposerCity);
                            $("#proposerTel").html(expense.proposerTel);
                            $("#expenseCatalog").html(expense.expenseCatalog);
                            $("#expenseNo").html(expense.expenseNo);
                            $("#proposeDate").html(expense.proposeDate);
                            $("#total-amount").html(expense.totalAmount);

                            $("#month-info").html(insertEntertain(expense));
                            $("#supplemental-info").html(insertTravelInfo(data.relate));
                            $("#entertainment-no").hide();
                            $("#travel-no").show();
                            $("#detail-container").show();
                        }
                    });
                } else if (expenseNo.substring(0, 1) == "C") {
                    $("#audit-log").attr("catalog", 3);
                    var param = new Object();
                    param.processId = $(this).attr("processId") ? $(this).attr("processId") : "";
                    param.expenseNo = expenseNo ? expenseNo : "";
                    param.history = true;
                    param.superRight = 1;
                    $.ajax({
                        type: "get",
                        dataType: "json",
                        url: "/pc/normal/detail",
                        data: param,
                        async: false,
                        success: function (data) {
                            loading.hide();
                            if (data.code == 500) {
                                $("#detail-container").hide();
                                return;
                            }
                            var expense = data.expense;
                            clearDetail();
                            $("#proposerName").html(expense.proposerName);
                            $("#proposerDepartment").html(expense.proposerDepartment);
                            $("#proposerCity").html(expense.proposerCity);
                            $("#proposerTel").html(expense.proposerTel);
                            $("#expenseCatalog").html(expense.expenseCatalog);
                            $("#expenseNo").html(expense.expenseNo);
                            $("#proposeDate").html(expense.proposeDate);
                            $("#total-amount").html(expense.expenseTotalAmount);

                            $("#month-info").html(insertNormal(expense));
                            $("#entertainment-no").hide();
                            $("#travel-no").show();
                            $("#detail-container").show();
                        }
                    });
                } else if (expenseNo.substring(0, 1) == "W") {
                    $("#audit-log").attr("catalog", 8);
                    $.ajax({
                        type: "get",
                        dataType: "json",
                        url: "/pc/welfare/detail",
                        async: false,
                        data: "processId=" + $(this).attr("processId") + "&expenseNo=" + $(this).attr("expenseNo") + "&history=true&superRight=1",
                        success: function (data) {
                            loading.hide();
                            if (data.code == 500) {
                                $("#detail-container").hide();
                                return;
                            }
                            var expense = data.expense;
                            clearDetail();
                            $("#proposerName").html(expense.proposerName);
                            $("#proposerDepartment").html(expense.proposerDepartment);
                            $("#proposerCity").html(expense.proposerCity);
                            $("#proposerTel").html(expense.proposerTel);
                            $("#expenseCatalog").html(expense.expenseCatalog);
                            $("#expenseNo").html(expense.expenseNo);
                            $("#proposeDate").html(expense.proposeDate);
                            $("#total-amount").html(expense.expenseTotalAmount);

                            $('#month-info').html(insertWelfare(expense));
                            $('#extra-info').html(insertAttachment(expense));
                            $("#entertainment-no").hide();
                            $("#travel-no").hide();
                            $("#detail-container").show();
                        }
                    });
                } else {
                    loading.hide();
                }
                if ($("#fold-span").hasClass("fold")) {
                    $("#fold-span").removeClass("fold");
                    $("#fold-span").addClass("unfold");
                }
                $("#log-display-div").hide();
                $("#audit-log").trigger("click");
            });
            $(".overtime-tr:first").trigger("click");
        }
    }

    function clearDetail() {
        $("#proposerName").html("");
        $("#proposerDepartment").html("");
        $("#proposerCity").html("");
        $("#proposerTel").html("");
        $("#expenseCatalog").html("");
        $("#expenseNo").html("");
        $("#proposeDate").html("");
        $("#total-amount").html("");
        $("#extra-info").empty();
        $("#month-info").empty();
        $("#supplemental-info").empty();
    }

    function Log() {
        this.behave = "";
        this.time = "";
        this.rank = 0;
        this.highlight = false;
    }

    function drawLog(data) {
        var canvas = document.getElementById("log");
        if (canvas == null) {
            return false;
        }
        canvas.width = $("#log-div").width();
        canvas.height = 0;
        var canvasWidth = canvas.width - logX - 50;
        var context = canvas.getContext("2d");
        var list = new Array();
        for (var i = 0; i < data.length; i++) {
            var log = new Log();
            log.highlight = data[i].action == 2;
            if (data[i].name) {
                if (data[i].taskDescription) {
                    log.behave = data[i].name + " " + data[i].taskDescription + " " + data[i].behave;
                } else {
                    log.behave = data[i].name + " " + data[i].behave;
                }
            }  else {
                log.behave = data[i].behave;
            }
            log.time = data[i].time;
            log.rank = i;
            var line = log.time + " " + log.behave;
            context.font = 12 + "px microsoft yahei";
            log.height = wrapCount(context, line, canvasWidth) * logLineHeight + 10;
            canvas.height += log.height;
            list[i] = log;
        }
        context = canvas.getContext("2d");
        context.font = 12 + "px microsoft yahei";
        var logY = 15;
        for (var i = 0; i < list.length; i++) {
            var point = list[i];
            if (point != undefined) {
                context.beginPath();
                context.fillStyle = black;
                context.arc(logX, logY, logRadius, 0, Math.PI * 2, true);
                context.fill();
                context.closePath();
                context.fillStyle = point.highlight ? orange : black;
                context.textBaseline = "middle";
                wrapText(context, point.time + " " + point.behave, logX + 30, logY, canvasWidth, logLineHeight, false);
                var w = context.measureText(point.time + " " + point.behave);
                if (i != 0) {
                    context.beginPath();
                    context.strokeStyle = black;
                    context.moveTo(logX, logY);
                    context.lineTo(logX, logY - list[i-1].height);
                    context.stroke();
                    context.closePath();
                }
                logY = point.height + logY;
            }
        }
    }

    function wrapText(context, text, x, y, maxWidth, lineHeight, middle) {
        var words = text.split("");
        var line = "";
        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + "";
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth) {
                context.fillText(line, x , y);
                line = words[n] + "";
                y += lineHeight;
            } else {
                line = testLine;
            }
        }
        if(line) {
            var start = 0;
            if(middle) {
                start = (maxWidth - context.measureText(line).width)/2;
            }
            context.fillText(line, x + start, y);
        }
    }

    function wrapCount(context, text, maxWidth) {
        var words = text.split("");
        var line = "";
        var count = 0;
        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + "";
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth) {
                count += 1;
                line = words[n] + "";
            } else {
                line = testLine;
            }
        }
        if(line) {
            count += 1;
        }
        return count;
    }

    function insertNormal(expense) {
        if(!expense)return;
        var clone = $("#normal-modal").clone(true, true);
        clone.removeAttr("id");
        $(clone).find(".normalexpenseNo").html(expense.expenseNo);
        $(clone).find(".normalbudgetSubject").html(expense.budgetSubjectName);
        $(clone).find(".normalcostDepartment").html(expense.costDepartment);

        var totalInvoice = 0;
        if(!expense.items){
            return;
        }
        for (var i = 0; i < expense.items.length; i++) {
            var item = expense.items[i];
            var des = item.des ? item.des : "";
            var type = item.type ? item.type : "";
            var amount = item.amount ? parseFloat(item.amount) : 0;
            var itemHtml = "<tr>" + "<td>" + ((i + 1) > 9 ? (i + 1) : "0" + (i + 1)) + "</td><td>" +
                type + "</td><td>" + des +
                "</td><td>" + amount +
                "</td><td>" + item.invoice +
                "</td></tr>";
            $(clone).find(".item-body").append(itemHtml);
            totalInvoice += item.invoice;
        }

        $(clone).find(".normalinvoiceCount").html(totalInvoice + " 张");
        $(clone).show();
        return clone;
    }

    function insertEntertain(entertainment) {
        if(!entertainment)return;
        var supplement = $("#entertainment-info").clone(true, true);
        supplement.removeAttr("id");
        $(supplement).find(".treatexpenseNo").html(entertainment.expenseNo);
        $(supplement).find(".treatbudgetSubject").html(entertainment.budgetSubjectName);
        $(supplement).find(".treatcostDepartment").html(entertainment.costDepartment);
        $(supplement).find(".treatinvoiceCount").html(entertainment.invoiceCount + " 张");
        var totalAmount = 0;
        for (var i = 0; i < entertainment.items.length; i++) {
            var item = entertainment.items[i];
            var date = item.date ? item.date : "";
            var place = item.place ? item.place : "";
            var object = item.object ? item.object : "";
            var person = item.person ? item.person : "";
            var des = item.des ? item.des : "";
            var etype = item.etype ? item.etype : "";
            var amount = item.amount ? parseFloat(item.amount) : 0;
            totalAmount += amount;
            var itemHtml = "<tr>" + "<td>" + date + "</td><td>" +
                place + "</td><td>" + person +
                "</td><td>" + object +
                "</td><td>" + etype +
                "</td><td>" + des +
                "</td><td>" + amount +
                "</td></tr>";
            $(supplement).find(".item-body").append(itemHtml);
        }
        var summaryHtml = "<tr><td colspan=\"6\">金额小计" + "</td><td>" + totalAmount + "</td></tr>";
        $(supplement).find(".item-body").append(summaryHtml);
        $(supplement).show();
        $("#supplemental-info").show();
        return supplement;
    }

    function insertTravelInfo(travel) {
        if(!travel)return;
        $("#travelReason").html(travel.expenseReason);
        $("#travelbudgetSubject").html(travel.budgetSubject);
        $("#travelcostDepartment").html(travel.costDepartment);
        $("#travelinvoiceCount").html(travel.invoiceCount + " 张");
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
        $("#supplemental-info").show();
        return modal;
    }

    function insertOvertimeInfo(expense) {
        if(!expense)return;
        $("#supplemental-info").hide();
        var num = 0;
        for (var i = 0; i < expense.items.length; i++) {
            num++;
            var item = expense.items[i];
            var newItem = $("#month-modal").clone(true, true);
            var newId = newItem.attr("id") + "-" + num;
            newItem.attr("id", newId);
            $("#month-info").append(newItem);
            var calendarButton = newItem.find(".calendar-btn");
            calendarButton.attr("openId", expense.proposerNo);
            calendarButton.attr("year", item.year);
            calendarButton.attr("month", item.month);
            $.ajax({
                type: "get",
                dataType: "json",
                url: "/pc/overtime/calendar",
                data: "year=" + item.year + "&month=" + item.month + "&openId=" + expense.proposerNo,
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
    }

    function insertWelfare(expense) {
        if (!expense)return;
        var clone = $("#welfare-modal").clone(true, true);
        clone.removeAttr("id");
        var item = expense.items[0];
        $(clone).find('#welfareType').html(item.wtype);
        $(clone).find('#welfarebudgetSubject').html(expense.budgetSubjectName);
        $(clone).find('#welfarecostDepartment').html(expense.costDepartment);
        var wtypeId = item.wtypeId;
        var certificateDate;
        if(wtypeId == 1) {
            certificateDate = item.bday;
        } else if(wtypeId == 2) {
            certificateDate = item.wday;
        }

        if (wtypeId == 1) {
            $(clone).find('#welfareDate').html(item.bday);
            $(clone).find('#welfare-date').html("宝贝出生日期："
                + $(clone).find('#welfare-date').html());
            $(clone).find('#welfareinvoiceAmount').html(item.invoiceAmount + "元");
            $(clone).find('#welfare-invoice').show();
            $(clone).find('#welfare-date').show();
            $(clone).find('#welfare-description').hide();
            $(clone).find('#welfare-attachment').show();
        } else if (wtypeId == 2) {
            $(clone).find('#welfareDate').html(item.wday);
            $(clone).find('#welfare-date').html("结婚日期："
                + $(clone).find('#welfare-date').html());
            $(clone).find('#welfareinvoiceAmount').html(item.invoiceAmount + "元");
            $(clone).find('#welfare-invoice').show();
            $(clone).find('#welfare-date').show();
            $(clone).find('#welfare-description').hide();
            $(clone).find('#welfare-attachment').show();
        } else if (wtypeId == 3) {
            $(clone).find('#welfareDescription').html(item.des);
            $(clone).find('#welfare-invoice').hide();
            $(clone).find('#welfare-date').hide();
            $(clone).find('#welfare-description').show();
            $(clone).find('#welfare-attachment').hide();
        }
        var entryDate;
        $.ajax ({
            type : "get",
            dataType: "json",
            url: "/pc/welfare/entrydate",
            data: "openId=" + expense.proposerNo,
            async: false,
            success: function (data) {
                entryDate = data.entryDate;
            }
        });
        $.ajax({
            type : "get",
            url: "/pc/welfare/history",
            data: "openId=" + expense.proposerNo + "&wtype=" + wtypeId + "&proposeDate=" + expense.proposeDate,
            async: false,
            success: function (data) {
                var count = data.count;
                var historySummary = data.summaryBeanList;
                $(clone).find('#welfareCount').html(count);
                $(clone).find('#welfareEntryDate').html(entryDate);
                var validate = true;
                if (wtypeId !=3 && count > 0) {
                    $(clone).find("#welfareCount").css("color", "red");
                    validate = false;
                }
                if (wtypeId !=3 && !validateWelfareDate(entryDate, item, wtypeId)) {
                    $(clone).find("#welfareEntryDate").css("color", "red");
                    validate = false;
                }
                if(!validate) {
                    $(clone).find(".welfare-history-div img").attr("src", "/img/icon-welfare.png");
                    $(clone).find(".welfare-history-div").css("border-color", "#ff8400");
                } else {
                    $(clone).find(".welfare-history-div").css("border-color", "#aaa");
                    $(clone).find(".welfare-history-div img").attr("src", "/img/icon-welfare-grey.png");
                }

                if(count > 0) {
                    var html = "";
                    for (var i = 0; i < historySummary.length; i++) {
                        var history = historySummary[i];
                        html += buildWelfareTR(history, wtypeId);
                    }
                    var detailHtml = buildWelfareDetail(wtypeId, html);
                    $(clone).find("#welfare-history-btn").show();
                    $(clone).find("#welfare-history-btn").unbind();
                    $(clone).find("#welfare-history-btn").bind("click", function () {
                        showDialog($("#calendar-container"), "报销记录", detailHtml);
                    });
                    $("#confirm-calendar").unbind();
                    $("#confirm-calendar").bind("click", function (e) {
                        $("#calendar-container").hide();
                        $(".modal-backdrop").remove();
                    });
                } else {
                    $(clone).find("#welfare-history-btn").hide();
                }
            }
        });
        $(clone).show();
        return clone;
    }

    function insertAttachment(expense) {
        if (!expense)return;
        var clone = $("#attachment-display-div").clone(true, true);
        clone.removeAttr("id");
        var item = expense.items[0];
        var wtypeId = item.wtypeId;
        if(wtypeId == 1 || wtypeId == 2) {
            if(expense.attachmentIdList && expense.attachmentIdList.length > 0){
                var image = "";
                for(var i = 0; i< expense.attachmentIdList.length; i++){
                    var fileId = expense.attachmentIdList[i];
                    $.ajax({
                        type: "GET",
                        url: "/attachment/ajax/fetchAttachmentCode?accessToken=123&fileId=" + fileId,
                        async: false,
                        success: function(data){
                            if(data.code != 200){
                                image += "<p>获取附件失败！</p>";
                                return;
                            }
                            var response = data.base64Code;
                            var fileName = data.fileName;
                            var fileType = fileName.substring(fileName.indexOf(",") + 1, fileName.length);
                            image += "<img style='max-width:100%' src='data:image/" + fileType + ";base64," + response + "'></img>";
                        }
                    });
                }
            }

            $(clone).find("#attachment-div").html(image);
            $(clone).find('#check-chevron-div').unbind();
            $(clone).find('#check-chevron-div').bind("click", function() {
                var chevron = $(clone).find('#check-chevron');
                var attachmentDiv = $(clone).find("#attachment-div");
                if($(chevron).hasClass("fold")) {
                    $(chevron).removeClass("fold");
                    $(chevron).addClass("unfold");
                    $(attachmentDiv).show();
                } else {
                    $(chevron).addClass("fold");
                    $(chevron).removeClass("unfold");
                    $(attachmentDiv).hide();
                }
            });
            $(clone).show();
            return clone;
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

    function release() {
        $(".modal-backdrop").remove();
        $(".modal").hide();
        $("#msg-container").fadeOut();
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
        dialog.find(".modal-title").text(title);
        dialog.find(".modal-body").html(content);
        dialog.show();
        dialog.css({"position": "absolute"});
        dialog.css({"top": Math.max(0, (($(window).height() - dialog.height()) / 2) +
            $(window).scrollTop()) + "px"});
        dialog.css({"left": Math.max(0, (($(window).width() - dialog.width()) / 2) +
            $(window).scrollLeft()) + "px"});
        var maskHtml = '<div class="modal-backdrop"></div>';
        $(maskHtml).prependTo(document.body);
    }

    function block() {
        var maskHtml = '<div class="modal-backdrop"></div>';
        $(maskHtml).prependTo(document.body);
    }

    function showMsg(dialog, content) {
        dialog.find(".modal-body").html(content);
        dialog.show();
        dialog.css({"position": "absolute"});
        dialog.css({"top": Math.max(0, (($(window).height() - dialog.height()) / 2) +
            $(window).scrollTop()) + "px"});
        dialog.css({"left": Math.max(0, (($(window).width() - dialog.width()) / 2) +
            $(window).scrollLeft()) + "px"});
        var maskHtml = '<div class="modal-backdrop"></div>';
        $(maskHtml).prependTo(document.body);
        if(dialog.attr("id")=="msg-container") {
            setTimeout(function() {
                release();
            }, 3000);
        }

    }

    function scroll(scrollTo, time) {
        var scrollFrom = parseInt(document.body.scrollTop),
            i = 0,
            runEvery = 5; // run every 5ms
        scrollTo = parseInt(scrollTo);
        time /= runEvery;
        var interval = setInterval(function () {
            i++;
            document.body.scrollTop = (scrollTo - scrollFrom) / time * i + scrollFrom;
            if (i >= time) {
                clearInterval(interval);
            }
        }, runEvery);
    }
});
