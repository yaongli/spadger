define(function (require, exports, module) {
    var $ = require('./jquery');
    var ajax = require('./ajax');
    var list = require("./list");
    var option = require("./option");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var pub = require("./public");
    //var workflow = require("./workflow");
    require('bootstrap');
    require('./bootstrap-datepicker');
    //var weekMap = {1: "(一)", 2: "(二)", 3: "(三)", 4: "(四)", 5: "(五)", 6: "(六)", 0: "(日)"};
    var configs = new Object();
    var fields = new Object();
    var fieldIds = "";
    var fieldNames = "";
    var param = "";
    var lastDiv = 1;
    var flag = 0;

    $(document).ready(function () {
        pub.menuCollapseHandler();
        pub.searchCollapseHandler();
        pub.activeMenu("#report-menu-new");
        list.empty("report_list", "NoRowsTemplate");
        pub.bindDatePicker($("#q-beginTime"));
        pub.bindDatePicker($("#q-endTime"));
        pub.bindDatePicker($("#q-confirmBeginTime"));
        pub.bindDatePicker($("#q-confirmEndTime"));
        $(".nav-tab").removeClass("nav-selected");
        $(".nav-report").addClass("nav-selected");
        $("#report-table").hide();

        $(".close").bind("click", function () {
            $(this).parent().parent().parent().parent().hide();
            $(".ex-modal-backdrop").remove();
        });

        $("#cancel-fields").bind("click", function () {
            $(".close").trigger("click");
        });

        $("#delete-report").bind("click", function () {
            showDialog($("#delete-container"), "确认删除", "是否确认删除？");
        });
        $("#confirm-close").bind("click", function () {
            $(".close").trigger("click");
        });
        $("#global-container-close").bind("click", function () {
            $(".close").trigger("click");
        });
        $("#confirm-delete").bind("click", function (e) {
            ajax.post("/pc/expense/removeConfig", "configId=" + $("#report-name").attr("configId"), function (data) {
                $(".close").trigger("click");
                $("#q-expensecatalog").trigger("change");
            });
        });
        //$("#confirm-close").bind("click", function () {
        //    $(".close").trigger("click");
        //});
        $("#q-expensecatalog").bind("change", function (e) {
            var catalog = $(this).val();
            $("#q-my-report").html("");
            ajax.post("/pc/expense/reportConfigs", "expenseCatalog=" + catalog, function (data) {
                $("#q-my-report").append("<option value='-1'>点击右侧按钮，可自定义报表字段</option>");
                if (data.configList.length) {
                    for (var i = 0; i < data.configList.length; i++) {
                        configs[data.configList[i].id] = data.configList[i];
                        $("#q-my-report").append("<option value='" + data.configList[i].id + "'>" + data.configList[i].reportName + "</option>");
                    }
                }
                if ($("#q-expensecatalog").val() == 1) {
                    $("#q-my-report").append("<option value='0'>发票缺口报表</option>");
                }
                $("#q-my-report").trigger("change");
            });
        });

        $("#edit-report").live("click", function () {
            var config = configs[$(this).attr("configId")];
            buildFieldTable();
            for (var i = 0; i < config.fields.length; i++) {
                $.each($('.select-field'), function (index, el) {
                    if ($(this).attr("field-id") == config.fields[i].id) {
                        $(el).attr("checked", "checked");
                        if (config.fields[i].alias) {
                            $(this).parent().parent().find(".alias-name").val(config.fields[i].alias);
                        }
                    }

                });
            }
        });

        $("#fields-btn").live("click", function () {
            buildFieldTable();
            $("#save-report").removeAttr("configId");
            $("#report-name").html("");
            $("#report-name").removeAttr("configId");
            $(".select-field").each(function () {
                $(this).attr("checked", "checked");
            });
        });

        $("#export").bind("click", function () {
            var url = '/pc/expense/reportExport?' + encodeURI(param);
            var form = document.getElementById("report-search");
            var values = form.getElementsByClassName("form_value");
            var i = 0;
            var params = "";
            for (i = 0; i < values.length; i++) {
                if (values[i].type == "radio" && !values[i].checked) {
                    continue;
                }
                if (values[i].getAttribute("search_data") != null
                    && values[i].getAttribute("search_data") != "") {
                    params += "&" + values[i].name + "=" + values[i].getAttribute("search_data");
                }
            }
            url+=params;
            window.open(url, '_blank');
        });

        $("#save-report").bind("click", function () {
            showDialog($("#add-container"), "保存", "");
            if ($(this).attr("configId")) {
                $("#save-report-name").val(configs[$(this).attr("configId")].reportName);
            }
            var that = this;
            $("#confirm-add").unbind();
            $("#confirm-add").bind("click", function () {
                var param = "reportName=" + $("#save-report-name").val() + "&expenseCatalog=" + $("#q-expensecatalog").val() + "&fieldIds=" + fieldIds + "&fieldNames=" + fieldNames;
                if ($(that).attr("configId")) {
                    param += "&configId=" + $(that).attr("configId");
                }
                ajax.post("/pc/expense/saveConfig", param, function (data) {
                    $(".close").trigger("click");
                    $("#q-expensecatalog").trigger("change");
                    showDialog($("#global-container"), "保存成功", "报表 " + $("#save-report-name").val() + " 已保存成功");
                });
            });
        });

        $("#q-my-report").bind("change", function (e) {
            flag = 1 ;
            if ($(this).val() != 0) {
                $("#select-range-div").show();
                //$("#select-confirm-range-div").show();
                $("#select-year-div").hide();
                $("#expense-report").show();
                $("#gap-report").hide();
                $("#pagination_bar").show();
                if ($(this).val() > 0) {
                    var config = configs[$(this).val()];
                    $("#report-name").html(config.reportName);
                    $("#report-name").attr("configId", config.id);
                    fieldNames = "";
                    fieldIds = "";
                    if (config) {
                        for (var i = 0; i < config.fields.length; i++) {
                            fieldIds += config.fields[i].id + ",";
                            fieldNames += (config.fields[i].alias ? config.fields[i].alias : config.fields[i].fieldName) + ",";
                        }
                    }
                }else{
                    flag = 0;
                }
            } else {
                $("#select-range-div").hide();
                //$("#select-confirm-range-div").hide();
                $("#select-year-div").show();
                $("#expense-report").hide();
                $("#gap-report").show();
                $("#pagination_bar").hide();
                $("#report-table").hide();
            }
        });


        $("#search").live("click", function () {
            param = "";
            if(flag == 0){
                buildFieldTable("hideDialog");
                $("#save-report").removeAttr("configId");
                $("#report-name").html("");
                $("#report-name").removeAttr("configId");
                $(".select-field").each(function () {
                    $(this).attr("checked", "checked");
                });
                $('#confirm-fields').trigger("click");
                //showDialog($("#msg-container"), '提示', "请选择常用报表");
                //return;
            }
            if ($("#q-my-report").val() == 0) {
                $.ajax({
                    type: "post",
                    dataType: "json",
                    url: "/pc/expense/gapReport",
                    data: "year=" + $("#q-year").val(),
                    success: function (data) {
                        $("#gap-tbody").html("");
                        if (!data.invoiceGap) {
                            return;
                        }
                        var html = "";
                        for (var key in data.invoiceGap) {
                            html += "<tr></tr><td>" + key + "</td><td>" + data.invoiceGap[key] + "</td></tr>";
                        }
                        $("#gap-tbody").html(html);
                    }
                });
                return;
            }
            $("#save-report").attr("configId", $("#report-name").attr("configId"));
            $("#delete-report").attr("configId", $("#report-name").attr("configId"));
            $("#edit-report").attr("configId", $("#report-name").attr("configId"));

            var fieldNameList = null;
            if (fieldNames.length > 0) {
                fieldNameList = fieldNames.substring(0, fieldNames.length - 1).split(",");
            }
            $("#report-header").html("");
            for (var i = 0; i < fieldNameList.length; i++) {
                $("#report-header").append("<th>" + fieldNameList[i] + "</th>");
            }
            $("#report-table").show();
            if (fieldIds.length > 0) {
                param += "fieldIds=" + fieldIds.substring(0, fieldIds.length - 1) + "&";
            }
            if (fieldNames.length > 0) {
                param += "fieldNames=" + fieldNames.substring(0, fieldNames.length - 1);
            }
            list.init("list_model", "report_list", "pagination_bar", "", param, "NoRowsTemplate", "report-search", null, 1, function (data) {
                $(".close").trigger("click");
                $("#operate-div").show();
                if ($("#report-name").attr("configId")) {
                    $("#save-report").hide();
                    $("#delete-report").show();
                    $("#edit-report").show();
                } else {
                    $("#save-report").show();
                    $("#delete-report").hide();
                    $("#edit-report").hide();
                }
            });
        });

        $("#q-expensecatalog").trigger("change");
    });

    function buildFieldTable(isHideDialog) {
        var catalog = $("#q-expensecatalog").val();
        if (!fields[catalog]) {
            $.ajax({
                type: "post",
                dataType: "json",
                url: "/pc/expense/reportFields",
                async: false,
                data: "expenseCatalog=" + catalog,
                success: function (data) {
                    fields[catalog] = data.fieldList;
                    if(isHideDialog == "hideDialog"){
                        $("#fields-container").find(".inner-content").html(buildFieldHtml(fields[catalog]));
                    }else{
                        showDialog($("#fields-container"), "字段选择", buildFieldHtml(fields[catalog]));
                        moveDialog("fields-container-header", "fields-container");
                    }
                }
            });
        } else {
            if(isHideDialog == "hideDialog"){
                $("#fields-container").find(".inner-content").html(buildFieldHtml(fields[catalog]));
            }else{
                showDialog($("#fields-container"), "字段选择", buildFieldHtml(fields[catalog]));
                moveDialog("fields-container-header", "fields-container");
            }
        }
        $("#confirm-fields").unbind();
        $("#confirm-fields").bind("click", function () {
            fieldIds = "";
            fieldNames = "";
            param = "";
            flag = 1;
            $(".select-field").each(function (index, el) {
                if ($(this).attr("checked") == "checked") {
                    var $tr = $(".field-tr:eq(" + index + ")");
                    fieldNames += ($tr.find(".alias-name").val() ? $tr.find(".alias-name").val() : $tr.find(".field-name").html()) + ",";
                    fieldIds += $(this).attr("field-id") + ",";
                }
            });
            if ($("#report-name").attr("configId")) {
                var param = "reportName=" + $("#report-name").html() + "&expenseCatalog=" + $("#q-expensecatalog").val() + "&fieldIds=" + fieldIds + "&fieldNames=" + fieldNames;
                param += "&configId=" + $("#report-name").attr("configId");
                ajax.post("/pc/expense/saveConfig", param, function (data) {
                    $("#report-name").attr("configId",data.configId);
                    $(".close").trigger("click");
                    if(isHideDialog != "hideDialog") {
                        $("#search").trigger("click");
                    }
                });
            } else {
                $(".close").trigger("click");
                if(isHideDialog != "hideDialog") {
                    $("#search").trigger("click");
                }
            }
        });
    }

    function buildFieldHtml(fields) {
        var html = "";
        for (var i = 0; i < fields.length; i++) {
            html += "<tr class='field-tr'>";
            html += "<td><input type='checkbox' class='select-field' field-id='" + fields[i].id + "'></td>";
            html += "<td class='field-name'>" + fields[i].fieldName + "</td>";
            html += "<td><input class='alias-name' type='text'></td>"
            html += "</tr>";
        }
        return html;
    }

    function showDialog(dialog, title, content) {
        dialog.find(".ex-modal-title").text(title);
        dialog.find(".inner-content").html(content);
        dialog.show();
        dialog.css({"position": "fixed"});
        dialog.css({"top": "10px"});
        dialog.css({"left": Math.max(0, (($(window).width() - dialog.width()) / 2) +
            $(window).scrollLeft()) + "px"});
        var maskHtml = '<div class="ex-modal-backdrop"></div>';
        $(maskHtml).prependTo(document.body);
    }
    function moveDialog(header, container){
        var isMousedown, LEFT, TOP, dialog;

        document.getElementById(header).onmousedown=function(e) {
            dialog = document.getElementById(container);
            isMousedown = true;
            e = e||event;
            LEFT = e.clientX - parseInt(dialog.style.left);
            TOP = e.clientY - parseInt(dialog.style.top);

            document.onmousemove = function(e) {
                e = e||event;
                if (isMousedown) {
                    dialog.style.left = e.clientX - LEFT + "px";
                    dialog.style.top = e.clientY - TOP + "px";
                }
            }

            document.onmouseup=function(){
                isMousedown=false;
            }
        }
    }

});
