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

    function bindGlobalEvents() {
        $("#new-item").bind("click", function() {
            $(this).css("border","none");
            var errorMsg = validateItem();
            if(errorMsg == undefined || errorMsg == ""){
                copyModal();
                bindItemEvents();
            }
        });

        $("#submit-btn").bind("click", function() {
            var errorMsg =  validate();
            if(errorMsg != undefined && errorMsg != "") {
                showMsg($("#msg-container"), errorMsg);
                return;
            }
            var totalAmount = $("#total-amount").html();
            showMsg($("#submit-container"), "本次一般报销申请共计<span style=\"color: #ff8400;\">" + totalAmount + "</span>元，是否确认提交？");
            $("#confirm-submit").bind("click", function(e){
                var param = collectInfo();
                $.ajax({
                    type: "post",
                    dataType: "json",
                    url: "/pc/normal/submit",
                    data: param,
                    success: function (data) {
                        $("#submit-container").hide();
                        $(".modal-backdrop").remove();
                        if(data.code != 200) {
                            showMsg($("#msg-container"), "系统异常，请稍后再试！");
                            return;
                        }
                        //todo 跳转
                        showMsg($("#msg-container"), "一般报销提交成功！");
                    }
                });
            });
        });

        $(".ex-amount").live("change", function() {
            var totalAmount = 0;
            $(".ex-amount").each(function (index, value) {
                if(!validateFloat($(this).val())){
                    $(value).addClass("input-warning");
                    $(value).removeClass("txt-form");
                    return;
                }
                $(value).removeClass("input-warning");
                $(value).addClass("txt-form");
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

    function collectTR(tr) {
        var tmp = new Object();
        tmp.type = $(tr).find(".ex-type").val();
        tmp.time = $(tr).find(".date-input").val();
        tmp.desc = $(tr).find(".ex-desc").val();
        tmp.amount = $(tr).find(".ex-amount").val();
        tmp.invoice = $(tr).find(".invoice-count").val();
        return tmp;
    }

    function initBaseInfo(ignoreWorkId, workId) {
        var url =  "/pc/normal/init";
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


    function validate() {
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
        var budgetSubject = $("#budget-subject").val();
        if( budgetSubject == undefined || budgetSubject == "") {
            errorMsg += "预算项目信息缺失，请选择！<br>";
            $("#budget-subject").addClass("input-warning");
            $("#budget-subject").removeClass("txt-form");
        }
        if($(".item-container .item-detail").length == 0){
            errorMsg += "报销明细信息缺失，请点击添加进行填写！<br>";
            $("#new-item").css("border", "1px solid red");
        }
        errorMsg += validateItem();
        return errorMsg;
    }

    function validateItem(){
        var errorMsg = "";
        $(".item-container .ex-type").each(function(index, value){
            var type = $(value);
            if(type.val() == undefined || type.val() == ""){
                errorMsg += "报销明细费用类别信息缺失，请选择！<br>"
                type.addClass("input-warning");
                type.removeClass("txt-form");
            }
        });
        $(".item-container .ex-date").each(function(index, value){
            var date = $(value);
            if(date.val() == undefined || date.val() == ""){
                errorMsg += "报销明细费用日期信息缺失，请选择！<br>"
                date.addClass("input-warning");
                date.removeClass("txt-form");
            }
        });
        $(".item-container .ex-desc").each(function(index, value){
            var desc = $(value);
            if(desc.val() == undefined || desc.val() == ""){
                errorMsg += "报销明细费用说明信息缺失，请确认！<br>"
                desc.addClass("input-warning");
                desc.removeClass("txt-form");
            }
        });
        $(".item-container .ex-amount").each(function(index, value){
            var amount = $(value);
            if(amount.val() == undefined || amount.val() == ""){
                errorMsg += "报销明细费用金额信息缺失，请确认！<br>"
                amount.addClass("input-warning");
                amount.removeClass("txt-form");
            }else if(!validateFloat(amount.val()) || parseFloat(amount.val()) <= 0){
                errorMsg += "报销明细费用金额信息格式不对，请确认！<br>"
                amount.addClass("input-warning");
                amount.removeClass("txt-form");
            }
        });
        $(".item-container .invoice-count").each(function(index, value){
            var invoice = $(value);
            if(invoice.val() == undefined || invoice.val() == ""){
                errorMsg += "报销明细发票张数信息缺失，请确认！<br>"
                invoice.addClass("input-warning");
                invoice.removeClass("txt-form");
            } if(!validateInt(invoice.val()) || parseInt(invoice.val()) <= 0){
                errorMsg += "报销明细发票张数信息格式不对，请确认！<br>"
                invoice.addClass("input-warning");
                invoice.removeClass("txt-form");
            }
        });
        return errorMsg;
    }

    function bindItemEvents(){
        $(".item-container .ex-type").unbind("change");
        $(".item-container .ex-type").bind("change", function(e){
            var type = $(this);
            if(type.val() != undefined && type.val() != ""){
                type.removeClass("input-warning");
                type.addClass("txt-form");
            } else {
                type.addClass("input-warning");
                type.removeClass("txt-form");
            }
        });
        $(".item-container .ex-date").unbind("change");
        $(".item-container .ex-date").bind("change", function(e){
            var date = $(this);
            if(date.val() != undefined && date.val() != ""){
                date.removeClass("input-warning");
                date.addClass("txt-form");
            }else {
                date.addClass("input-warning");
                date.removeClass("txt-form");
            }
        });
        $(".item-container .ex-desc").unbind("change");
        $(".item-container .ex-desc").bind("change", function(e){
            var desc = $(this);
            if(desc.val() != undefined && desc.val() != ""){
                desc.removeClass("input-warning");
                desc.addClass("txt-form");
            } else {
                desc.addClass("input-warning");
                desc.removeClass("txt-form");
            }
        });
        $(".item-container .ex-amount").unbind("change");
        $(".item-container .ex-amount").bind("change", function(e){
            var amount = $(this);
            if(amount.val() != undefined && amount.val() != "" && validateFloat(amount.val()) && parseFloat(amount.val()) > 0){
                amount.removeClass("input-warning");
                amount.addClass("txt-form");
            }  else {
                amount.addClass("input-warning");
                amount.removeClass("txt-form");
            }
        });
        $(".item-container .invoice-count").unbind("change");
        $(".item-container .invoice-count").bind("change", function(e){
            var invoice = $(this);
            if(invoice.val() != undefined && invoice.val() != "" && validateInt(invoice.val()) && parseInt(invoice.val()) > 0){
                invoice.removeClass("input-warning");
                invoice.addClass("txt-form");
            }else {
                invoice.addClass("input-warning");
                invoice.removeClass("txt-form");
            }
        });

        $(".delete-btn").unbind("click");
        $(".delete-btn").bind("click", function(e){
            $(this).parent().parent().remove();
        });
    }

    function copyModal() {
        var clone = $("#normal-modal").clone();
        $(clone).removeAttr("id");
        $(".item-container").append(clone);
    }

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

});

