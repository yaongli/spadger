define(function (require, exports, module) {
    var $ = require('./jquery');
    var ajax = require('./ajax');
    var list = require("./list");
    var option = require("./option");
    var queryCommon = require("./querycommon");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var pub = require("./public");
    var reqAsc=false;
    var orderField=1;

    $(document).ready(function () {
        $(".nav-tab").removeClass("nav-selected");
        $(".nav-processed").addClass("nav-selected");
        list.empty("todo_list", "NoRowsTemplate");
        pub.bindAutoComplete();
        queryCommon.bindCommon();
        $("#request-time-th").bind("click", function(e) {
            e.preventDefault();
            e.stopPropagation();
            orderField=1;
            reqAsc = !reqAsc;
            if(reqAsc) {
                $(this).html("申请时间&#9660;");
            } else {
                $(this).html("申请时间&#9650;");
            }
            $('#search').trigger("click");
        });

        $("#request-expenseno-th").bind("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            orderField=2;
            reqAsc = !reqAsc;
            if (reqAsc) {
                $(this).html("编号&#9660;");
            } else {
                $(this).html("编号&#9650;");
            }
            $('#search').trigger("click");
        });

        //search payplan list
        $('#search').bind('click', function () {
            var param="";
            if($("#q-requestno").attr("result")) {
                param += "requestNo="+$("#q-requestno").attr("result") + "&";
            }
            if($("#q-city").attr("result")) {
                param += "proposerCity="+$("#q-city").val() + "&";
            }
            if($("#q-department").attr("result")) {
                param += "departmentId="+$("#q-department").attr("result") + "&";
            }
            var monthPick = $("#q-month").val();
            if(monthPick && monthPick.length == 7){
                param += "year=" + monthPick.substring(0, 4) + "&";
                param += "month=" + monthPick.substring(5) + "&";
            }
            param += "orderField="+orderField+"&";
            param += "asc=" + reqAsc + "&";
            list.init("list_model", "todo_list", "pagination_bar", "", param, "NoRowsTemplate", "todo-search", null, 1, function (data) {
                queryCommon.bindTR(data);
            });
        });





    });


});