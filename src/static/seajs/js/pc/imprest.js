define(function (require, exports, module) {
    var $ = require('./jquery');
    var ajax = require('./ajax');
    var list = require("./list");
    var option = require("./option");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var pub = require("./public");

    $(document).ready(function() {
        pub.autoComplete();
        bindGlobalEvents();
        bindModalEvents();
        initBaseInfo(false, "");
    });

    function bindModalEvents() {
        $(".cancel").bind("click", function (e) {
            $("#submit-container").hide();
            $(".modal-backdrop").remove();
        });

        $(".close").bind("click", function (e) {
            $("#msg-container").hide();
            $("#submit-container").hide();
            $(".modal-backdrop").remove();
        });

        $("#confirm-msg").bind("click", function (e) {
            $("#msg-container").hide();
            $(".modal-backdrop").remove();
        });
    }

    function bindGlobalEvents() {
        $("#submit-btn").bind("click", function() {
            var errorMsg =  validate();
            if(errorMsg != undefined && errorMsg != "") {
                showMsg($("#msg-container"), errorMsg);
                return;
            }
            var totalAmount = $("#imprest-amount").val();
            showMsg($("#submit-container"), "本次备用金申请共计<span style=\"color: #ff8400;\">" + totalAmount + "</span>元，是否确认提交？");
            $("#confirm-submit").bind("click", function(e){
                var param = collectInfo();
                $.ajax({
                    type: "post",
                    dataType: "json",
                    url: "/pc/imprest/submit",
                    data: param,
                    success: function (data) {
                        $("#submit-container").hide();
                        $(".modal-backdrop").remove();
                        if(data.code != 200) {
                            showMsg($("#msg-container"), "系统异常，请稍后再试！");
                            return;
                        }
                        //todo 跳转
                        showMsg($("#msg-container"), "备用金提交成功！");
                    }
                });
            })

        });

        $(".ex-amount").live("change", function() {
            if(!validateFloat($(this).val()) || parseFloat($(this).val()) <= 0){
                $(this).addClass("input-warning");
                $(this).removeClass("txt-form");
                return;
            }
            $(this).removeClass("input-warning");
            $(this).addClass("txt-form");
            var totalAmount = 0;
            $(".ex-amount").each(function (index, value) {
                var amount = $(value).val() == "" ? 0 : parseFloat($(value).val());
                totalAmount += amount;
            });
            $("#total-amount").html(totalAmount.toFixed(2));
        })

        $("#workId").bind("resultChange", function(){
            var workId = $(this).attr("result");
            if(workId == undefined || workId == ""){
                $(this).addClass("input-warning");
                $(this).removeClass("txt-form");
            }else {
                $(this).removeClass("input-warning");
                $(this).addClass("txt-form");
                initBaseInfo(true, workId);
            }
        });

        $("#cost-department").bind("resultChange", function(){
            var costDepartmentId = $(this).attr("result");
            if(costDepartmentId == undefined || costDepartmentId == ""){
                $(this).addClass("input-warning");
                $(this).removeClass("txt-form");
            }else {
                $(this).removeClass("input-warning");
                $(this).addClass("txt-form");
            }
        });

        $("#propose-date").bind("change", function(e){
            var proposeDate = $(this).val();
            if(proposeDate == undefined || proposeDate == ""){
                $(this).addClass("input-warning");
                $(this).removeClass("txt-form");
            }else {
                $(this).removeClass("input-warning");
                $(this).addClass("txt-form");
            }
        });

        $("#imprest-usage").bind("change", function(e){
            var imprestUsage = $(this).val();
            if(imprestUsage == undefined || imprestUsage == ""){
                $(this).addClass("input-warning");
                $(this).removeClass("txt-form");
            }else {
                $(this).removeClass("input-warning");
                $(this).addClass("txt-form");
            }
        });
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
    }

    function collectInfo() {
        var param = new Object();
        param.budgetSubjectId = $("#budget-subject option").not(function () {
            return !this.selected
        }).val();
        param.department = $("#cost-department").val();
        param.departmentId = $("#cost-department").attr("result");
        param.proposerId = $("#workId").attr("result");
        var items = new Array();
        $(".item-container .tr").each(function () {
            items.push(collectTR(this));
        });
        param.items = JSON.stringify(items);
        return param;
    }

    function collectTR(tr) {
        var tmp = new Object();
        tmp.usage = $(tr).find(".ex-usage").val();
        tmp.amount = $(tr).find(".ex-amount").val();
        return tmp;
    }

    function initBaseInfo(ignoreWorkId, workId) {
        var url =  "/pc/imprest/init";
        if(workId != undefined && workId != ""){
           url += "?proposerNo=" + workId;
        }

        $.ajax({
            type: "get",
            dataType: "json",
            url: url,
            success: function (data) {
                if(data.code != 200) {
                    return;
                }
                if(ignoreWorkId == false){
                    $("#workId").val(data.proposerInfoBean.workNo + "/" + data.proposerInfoBean.realName);
                    $("#workId").attr("result", data.proposerInfoBean.workNo);
                }
                $("#cost-department").val(data.proposerInfoBean.topDepartmentName);
                $("#cost-department").attr("result", data.proposerInfoBean.topDepartmentId);
            }
        });
    }

    function validate(){
        var errorMsg = "";
        var workId = $("#workId").attr("result");
        if(workId == undefined || workId == ""){
            errorMsg += "申请人信息缺失，请确认是否通过系统提示进行选择！<br>";
            $("#workId").addClass("input-warning");
            $("#workId").removeClass("txt-form");
        }
        var costDepartmentId = $("#cost-department").attr("result");
        if( costDepartmentId == undefined || costDepartmentId == "") {
            errorMsg += "承担部门信息缺失，请确认是否通过系统提示进行选择！<br>";
            $("#cost-department").addClass("input-warning");
            $("#cost-department").removeClass("txt-form");
        }
        var proposeDate = $("#propose-date").val();
        if(proposeDate == undefined || proposeDate == ""){
            errorMsg += "申请时间信息缺失，请选择！<br>";
            $("#propose-date").addClass("input-warning");
            $("#propose-date").removeClass("txt-form");
        }
        var imprestUsage = $("#imprest-usage").val();
        if(imprestUsage == undefined || imprestUsage == ""){
            errorMsg += "备用金用途信息缺失，请输入！<br>";
            $("#imprest-usage").addClass("input-warning");
            $("#imprest-usage").removeClass("txt-form");
        }
        var imprestAmount = $("#imprest-amount").val();
        if(imprestAmount == undefined || imprestAmount == ""){
            errorMsg += "备用金金额信息缺失，请输入！<br>";
            $("#imprest-amount").addClass("input-warning");
            $("#imprest-amount").removeClass("txt-form");
        }
        if(!validateFloat(imprestAmount) || parseFloat(imprestAmount) <= 0){
            errorMsg += "备用金金额格式不对，请确认！<br>";
            $("#imprest-amount").addClass("input-warning");
            $("#imprest-amount").removeClass("txt-form");
        }
        return errorMsg;
    }

    function validateFloat(value) {
        if (value == "") {
            return true;
        }
        var regex = "^\\d{1,10}(?:\\.\\d{0,2})?$";
        if (new RegExp(regex, "g").exec(value) != null) {
            return true;
        }
        return false;
    }

    var suggestTimeout;

    function bindAutoComplete() {
        $('.autocomplete').live('input propertychange', function() {
            clearTimeout(suggestTimeout);
            var that = this;
            var value = $(this).val();
            if(value) {
                suggestTimeout = setTimeout(function() {
                    $(that).removeAttr("result");
                    $.ajax({
                        type: "post",
                        dataType: "json",
                        url: $(that).attr("suggest-url"),
                        data: "q=" + value,
                        success: function (data) {
                            var map = data.msg.suggestion;
                            $(".ac-list").css("width", $(that).width() + 15);
                            var offset = $(that).offset();
                            $(".ac-list").css("left", offset.left);
                            $(".ac-list").css("top", offset.top + $(that).outerHeight(true));
                            var lis = "";
                            if (map && Object.keys(map).length > 0) {

                                for (var key in map) {
                                    lis += "<li><a val='" + map[key] + "'>" + key + "</a></li>";
                                }
                            } else {
                                lis = "<li>无搜索结果</li>";
                            }
                            $(".ac-list").html("<ul>" + lis + "</ul>");
                            $('.ac-list a').unbind();
                            $('.ac-list a').bind("click", function(e) {
                                var text = $(this).html();
                                var value = $(this).attr("val");
                                $(that).val(text);
                                $(that).attr("result", value);
                                $(that).trigger("resultChange");
                                $(".ac-list").hide();
                            });
                            $(".ac-list").show();
                        }
                    });
                },600);
            }
        });

        $(window).bind("click", function(e) {
            $(".ac-list").hide();
        });

    }
});

