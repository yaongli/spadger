define(function (require, exports, module) {
    var $ = require('./jquery');
    var ajax = require('./ajax');
    var list = require("./list");
    var option = require("./option");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var pub = require("./public");
    var weekMap = {1: "(一)", 2: "(二)", 3: "(三)", 4: "(四)", 5: "(五)", 6: "(六)", 0: "(日)"};
    var Base64 = {


        _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",


        encode: function(input) {
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;

            input = Base64._utf8_encode(input);

            while (i < input.length) {

                chr1 = input.charCodeAt(i++);
                chr2 = input.charCodeAt(i++);
                chr3 = input.charCodeAt(i++);

                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;

                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                } else if (isNaN(chr3)) {
                    enc4 = 64;
                }

                output = output + this._keyStr.charAt(enc1) + this._keyStr.charAt(enc2) + this._keyStr.charAt(enc3) + this._keyStr.charAt(enc4);

            }

            return output;
        },


        decode: function(input) {
            var output = "";
            var chr1, chr2, chr3;
            var enc1, enc2, enc3, enc4;
            var i = 0;

            input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

            while (i < input.length) {

                enc1 = this._keyStr.indexOf(input.charAt(i++));
                enc2 = this._keyStr.indexOf(input.charAt(i++));
                enc3 = this._keyStr.indexOf(input.charAt(i++));
                enc4 = this._keyStr.indexOf(input.charAt(i++));

                chr1 = (enc1 << 2) | (enc2 >> 4);
                chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
                chr3 = ((enc3 & 3) << 6) | enc4;

                output = output + String.fromCharCode(chr1);

                if (enc3 != 64) {
                    output = output + String.fromCharCode(chr2);
                }
                if (enc4 != 64) {
                    output = output + String.fromCharCode(chr3);
                }

            }

            output = Base64._utf8_decode(output);

            return output;

        },

        _utf8_encode: function(string) {
            string = string.replace(/\r\n/g, "\n");
            var utftext = "";

            for (var n = 0; n < string.length; n++) {

                var c = string.charCodeAt(n);

                if (c < 128) {
                    utftext += String.fromCharCode(c);
                }
                else if ((c > 127) && (c < 2048)) {
                    utftext += String.fromCharCode((c >> 6) | 192);
                    utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                    utftext += String.fromCharCode((c >> 12) | 224);
                    utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                    utftext += String.fromCharCode((c & 63) | 128);
                }

            }

            return utftext;
        },

        _utf8_decode: function(utftext) {
            var string = "";
            var i = 0;
            var c = c1 = c2 = 0;

            while (i < utftext.length) {

                c = utftext.charCodeAt(i);

                if (c < 128) {
                    string += String.fromCharCode(c);
                    i++;
                }
                else if ((c > 191) && (c < 224)) {
                    c2 = utftext.charCodeAt(i + 1);
                    string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
                    i += 2;
                }
                else {
                    c2 = utftext.charCodeAt(i + 1);
                    c3 = utftext.charCodeAt(i + 2);
                    string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
                    i += 3;
                }

            }

            return string;
        }

    };

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
    var reqAsc = true;
    var orderField=1;
    var lineNum = 0;

    $(document).ready(function () {
        $(".nav-tab").removeClass("nav-selected");
        $(".nav-todo").addClass("nav-selected");
        //init empty table
        list.empty("todo_list", "NoRowsTemplate");
        pub.bindAutoComplete();
        $("#request-time-th").bind("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            orderField=1;
            reqAsc = !reqAsc;
            if (reqAsc) {
                $(this).html("申请时间&#9650;");
            } else {
                $(this).html("申请时间&#9660;");
            }
            $('#search').trigger("click");
        });

        $("#request-expenseno-th").bind("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            orderField=2;
            reqAsc = !reqAsc;
            if (reqAsc) {
                $(this).html("编号&#9650;");
            } else {
                $(this).html("编号&#9660;");
            }
            $('#search').trigger("click");
        });

        $("#confirm-msg").live("click", function (e) {
            $("#message-container").hide();
            $(".modal-backdrop").remove();
        });

        $(".close").live("click", function (e) {
            $(this).parent().parent().parent().parent().hide();
            $(".modal-backdrop").remove();
        });

        //消除遮罩
        $('#confirm-msg').bind('click', function () {
            $('.modal-backdrop-1').hide();
        });

        //search payplan list
        $('#search').bind('click', function () {
            lineNum = 0;
            var param = "";
            if ($("#q-requestno").attr("result")) {
                param += "requestNo=" + $("#q-requestno").attr("result") + "&";
            }
            if ($("#q-city").attr("result")) {
                param += "city=" + $("#q-city").val() + "&";
            }
            if ($("#q-department").attr("result")) {
                param += "departmentId=" + $("#q-department").attr("result") + "&";
            }
            param += "orderField="+orderField+"&";
            param += "asc=" + reqAsc;
            list.init("list_model", "todo_list", "pagination_bar", "", param, "NoRowsTemplate", "todo-search", null, 1, function (data) {
                $(".recordCount").html(data.expenseSummaryInfoModel.recordCount);
                loading.hide();

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
                    $("#extra-info").empty();
                    lineNum = $(this).parent().find("tr").index($(this)[0]);
                    var taskName = $(this).attr("taskName");
                    var taskId = $(this).attr("taskId");
                    var processId = $(this).attr("processId");
                    $("#taskName").html("角色 " + taskName);
                    $("#todo_list tr").css("background-color", "white");
                    $(this).css("background-color", "#8BC2F5");
                    $("#pass-btn").attr("processId", processId);
                    $("#pass-btn").attr("taskId", taskId);
                    $("#reject-btn").attr("processId", processId);
                    $("#reject-btn").attr("taskId", taskId);
                    $("#audit-log").attr("processId", processId);
                    $("#audit-log").attr("expenseNo", $(this).attr("expenseNo"));
                    if (taskName != "财务审批" && taskName != "财务一级审批" && taskName != "财务二级审批") {
                        $("#add-audit-btn").show();
                        $("#add-audit-btn").unbind("click");
                        $("#add-audit-btn").bind("click", function () {
                            var bodyHtml = "<div style='margin-bottom: 15px'><div style='display: inline-block;width: 30%;vertical-align: top;text-align: right;box-sizing: border-box;padding-right: 10px;'>加签人员：  </div>" +
                                "<input type=\"text\" id=\"new-audit-member\" style=\"width:50%;\" class=\"txt-ex-flat autocomplete\" placeholder='请输入名字或工号' suggest-url=\"/expense/realNameSuggest\"></div>" +
                                "<div><div style='display: inline-block;width: 30%;vertical-align: top;text-align: right;box-sizing: border-box;padding-right: 10px;'>加签原因：  </div><textarea style='width: 50%;min-height: 50px;box-sizing: border-box' id=\"sign-memo\"></textarea></div>";
                            showDialog($("#addAudit-container"), "加签", bodyHtml);
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
                                            release();
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
                        $("#add-audit-btn").hide();
                    }

                    var expenseNo = $(this).attr("expenseNo");
                    loading.show();
                    if (expenseNo.substring(0, 1) == "A") {
                        $("#pass-btn").attr("catalog", 1);
                        $("#reject-btn").attr("catalog", 1);
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
                                    showMsg($("#msg-container"), "系统异常，请稍后再试");
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
                        $("#pass-btn").attr("catalog", 2);
                        $("#reject-btn").attr("catalog", 2);
                        $("#audit-log").attr("catalog", 2);
                        var param = new Object();
                        param.processId = $(this).attr("processId") ? $(this).attr("processId") : "";
                        param.expenseNo = expenseNo ? expenseNo : "";
                        param.showLog = true;
                        param.history = false;
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
                        $("#pass-btn").attr("catalog", 6);
                        $("#reject-btn").attr("catalog", 6);
                        $("#audit-log").attr("catalog", 6);
                        var param = new Object();
                        param.processId = $(this).attr("processId") ? $(this).attr("processId") : "";
                        param.expenseNo = expenseNo ? expenseNo : "";
                        param.history = false;
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
                        $("#pass-btn").attr("catalog", 3);
                        $("#reject-btn").attr("catalog", 3);
                        $("#audit-log").attr("catalog", 3);
                        var param = new Object();
                        param.processId = $(this).attr("processId") ? $(this).attr("processId") : "";
                        param.expenseNo = expenseNo ? expenseNo : "";
                        param.history = false;
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
                        $("#pass-btn").attr("catalog", 8);
                        $("#reject-btn").attr("catalog", 8);
                        $("#audit-log").attr("catalog", 8);
                        $("#add-audit-btn").hide();
                        $.ajax({
                            type: "get",
                            dataType: "json",
                            url: "/pc/welfare/detail",
                            async: false,
                            data: "processId=" + $(this).attr("processId") + "&expenseNo=" + $(this).attr("expenseNo") + "&history=false&superRight=1",
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
                if ($(".overtime-tr").length) {
                    lineNum = $(".overtime-tr").length > lineNum ? lineNum : $(".overtime-tr").length - 1;
                    $(".overtime-tr:eq(" + lineNum + ")").trigger("click");
                }
            });
        });


        $('.selected-todo').live('click', function () {
            var selectedNum = 0;
            $.each($('.selected-todo'), function (index, el) {
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
        $('.select-all').live('click', function () {
            var selectedNum = 0;
            var checked = $('.select-all')[0].checked;
            $.each($('.selected-todo'), function (index, el) {
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
            $.each($('.selected-todo'), function (index, el) {
                if ($(el).attr('checked') == "checked") {
                    acceptIds += $(el).attr('taskId') + ","
                }
            });
            $.ajax({
                type: "get",
                dataType: "json",
                url: "/pc/expense/batchAccept",
                data: "acceptIds=" + acceptIds,
                success: function (data) {
                    var message = "";
                    if(data.code ==403){
                        message = "您没有执行该操作的权限！";
                    }else {
                        message = "您已成功审批通过<span style=\"color: #ff8800; font-weight:900;\"> " + data.msg.correctNum + " </span>单，失败<span style=\"color: #ff8800; font-weight:900;\"> " + data.msg.errorNum + " </span>单。";
                    }
                    showDialog($("#message-container"), "批量通过结果", message);
                    $("#confirm-msg").unbind("click");
                    $("#confirm-msg").bind("click", function(){
                        release($("#message-container"));
                        list.curPage();
                    });
                }
            });
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
                        if (data.logs && data.logs != undefined) {
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
            }
            $.ajax({
                type: "post",
                dataType: "json",
                url: auditUrl,
                data: param,
                success: function (data) {
                    if (data.code != 200) {
                        return;
                    }
                    list.curPage();
                }
            });
        });

        //reject
        $("#confirm-reject").bind("click", function () {
            var rejectReason = $("#detail-reason").val();
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
            } else if (catalog == 6) {
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
                    if (data.code != 200) {
                        if (data.message != null) {
                            showMsg($("#msg-container"), "驳回失败, 原因：" + data.message);
                        } else {
                            showMsg($("#msg-container"), "系统异常，请稍后再试");
                        }
                        $("#msg-container").unbind();
                        $("#msg-container").bind("click", function (e) {
                            $(this).hide();
                            $(".modal-backdrop-1").remove();
                        });
                        return;
                    }
                    $("#reject-container").hide();
                    $(".modal-backdrop-1").remove();

                    list.curPage();
                }
            });
        });

        $("#reject-btn").bind("click", function (e) {

            $("#confirm-reject").attr("catalog", $(this).attr("catalog"));
            var bodyHtml = "<textarea id=\"detail-reason\"></textarea>";
            $("#confirm-reject").removeAttr("taskId");
            $("#confirm-reject").removeAttr("processId");
            showDialog($("#reject-container"), "驳回原因", bodyHtml);
//            $("#detail-reason").hide();
            $("#confirm-reject").attr("taskId", $(this).attr("taskId"));
            $("#confirm-reject").attr("processId", $(this).attr("processId"));
            $(".reject-radio").bind("change", function (e) {
                $(".reject-radio").removeClass("radio-warning");
                if ($("#detail-reason").val() == "") {
                    $("#detail-reason").addClass("input-warning");
                } else {
                    $("#detail-reason").removeClass("input-warning");
                }
            });
            $("#detail-reason").bind("change", function (e) {
                var rejectReason = $("#detail-reason").val();
                if (rejectReason == "") {
                    $(this).addClass("input-warning");
                } else {
                    $(this).removeClass("input-warning");
                }
            });
            $('#cancel-reject').unbind();
            $('#cancel-reject').bind("click", function(){
                $(".modal-backdrop-1").remove();
                $("#reject-container").hide();
            });
            $('#reject-container .close').unbind();
            $('#reject-container .close').bind("click", function(){
                $(".modal-backdrop-1").remove();
                $("#reject-container").hide();
            });
        });

        $(".cancel").bind("click", function (e) {
            $(".modal").hide();
            $(".modal-backdrop").remove();
            $(".modal-backdrop-1").remove();
        });

        $(".close").bind("click", function (e) {
            $("#reject-container").hide();
            $("#calendar-container").hide();
            $(".modal-backdrop-1").remove();
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
                $(".modal-backdrop-1").remove();
            });

        });


    });

    function release() {
        $(".modal-backdrop").remove();
        $(".modal-backdrop-1").remove();
        $(".modal").hide();
        $("#msg-container").fadeOut();
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
        if (!expense)return;
        var clone = $("#normal-modal").clone(true, true);
        clone.removeAttr("id");
        $(clone).find(".normalexpenseNo").html(expense.expenseNo);
        $(clone).find(".normalbudgetSubject").html(expense.budgetSubjectName);
        $(clone).find(".normalcostDepartment").html(expense.costDepartment);

        var totalInvoice = 0;
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
        if (!entertainment)return;
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
        if (!travel)return;
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
        if (!expense)return;
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

        if (wtypeId == 1) {
            $(clone).find('#welfareDate').html(item.bday);
            $(clone).find('#welfare-date').html("宝贝出生日期："
                + $(clone).find('#welfare-date').html());
            $(clone).find('#welfare-date').show();
            $(clone).find('#welfare-description').hide();
            $(clone).find('#welfare-attachment').show();
        } else if (wtypeId == 2) {
            $(clone).find('#welfareDate').html(item.wday);
            $(clone).find('#welfare-date').html("结婚日期："
                + $(clone).find('#welfare-date').html());
            $(clone).find('#welfare-date').show();
            $(clone).find('#welfare-description').hide();
            $(clone).find('#welfare-attachment').show();
        } else if (wtypeId == 3) {
            $(clone).find('#welfareDescription').html(item.des);
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
                        $(".modal-backdrop-1").remove();
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
                            var fileType = fileName.substring(fileName.indexOf(".") + 1, fileName.length);
                            image += "<img style='max-width:100%' src='data:image/png;base64," + response + "'></img>";
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
        dialog.css({"position": "fixed"});
        dialog.css({"top": "10px"});
        dialog.css({"left": Math.max(0, (($(window).width() - dialog.width()) / 2) +
            $(window).scrollLeft()) + "px"});
        var maskHtml = '<div class="modal-backdrop-1"></div>';
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
        if (dialog.attr("id") == "msg-container") {
            setTimeout(function () {
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