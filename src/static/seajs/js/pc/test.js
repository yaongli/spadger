define(function(require, exports, module) {
    var $ = require('jquery');
    require('datepicker');
    require('bootstrap');
    require('./jquery.autocomplete')($);

    var ajax = require('./ajax');
    var list=require("./list");
    var option=require("./option");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var autoValidator = require("./autoValidator");

    $(document).ready(function() {

        //init empty table
        list.empty("paymentplan_list", "NoRowsTemplate");

        //init option content
        option.ajax("status", "/settle/ajax/loadPPStatusOption", "", "option", 0);
        option.ajaxWithCallback("businesstype", "/settle/ajax/loadBusinessTypeOption", "", "option", 0,"post",
            function () {
                var type=location.hash;
                if(type.indexOf("businesstype")>-1){
                    $('#businesstype').val(type.split('=')[1]);
                }

            });
        //init date picker
        $('#datebegin').datepicker({format: 'yyyy-mm-dd'});
        $('#dateend').datepicker({format: 'yyyy-mm-dd'});
        $('#addbegindate').datepicker({format: 'yyyy-mm-dd'});
        $('#addenddate').datepicker({format: 'yyyy-mm-dd'});

        $('#businesstype').bind("change", function(){
            $("#customerName").val("");
            $("#customerid").val("");
            if($("#businesstype").val() == 2 || $("#businesstype").val() == 4){
                window.location.href = "/caiwu/paymentplan/paymentplanlist___1_0_____"+$("#businesstype").val()+"_";
            }
        })

        //search payplan list
        $('#search').bind('click', function () {
            var customerName = $("#customerName").val();
            var customerId = $("#customerid").val();
            if (customerName && (!customerId || customerId == "0")) {
                showError("请选择有效的客户名");
                $("#customerName").addClass("error-input");
                return;
            }
            list.init("list_model", "paymentplan_list", "pagination_bar", "", "", "NoRowsTemplate", "paymentplan_search", null, 1,  function(data){
                $(".recordCount").html(data.payPlanModel.recordCount);
                $(".totalAmount").html(data.totalAmount);

                if (data.status == 1) {
                    $('#submit-payplan').show()
                } else {
                    $('#submit-payplan').hide()
                }
                ENV.data._allRecords = false;
                $('#select-all-in-page').attr('checked', false);
                $('#select-all-pageinfo').hide();
                $('#select-cur-pageinfo').hide();
            });
            if ($('#select-all-in-page')[0].checked) {
                $('#select-all-in-page').attr('checked', false);
                $('#select-all-pageinfo').hide();
                $('#select-cur-pageinfo').hide();
            }
        });


        $('#select-all-in-page').bind('click', function () {
            var checked = $('#select-all-in-page')[0].checked;
            $.each($('.selected-payment'), function (index, el) {
                $(el).attr('checked', checked);
            });

            if (checked) {
                $('#select-all-pageinfo').show();
            } else {
                $('#select-all-pageinfo').hide();
            }
            ENV.data._allRecords = false;
        });

        //选择所有
        $('#select-all-records').bind('click', function () {
            ENV.data._allRecords = true;
            $('#select-all-pageinfo').hide();
            $('#select-cur-pageinfo').show();
        });

        //取消勾选
        $('#select-cur-page').bind('click', function () {
            ENV.data._allRecords = false;
            $('#select-cur-pageinfo').hide();
            $('#select-all-pageinfo').hide();
            $('#select-all-in-page').attr('checked', false);
            $.each($('.selected-payment'), function (index, el) {
                $(el).attr('checked', false);
            });
        });

        $('#select-date').bind('change', function () {
            changeDateSelect();
        });

        $('#select-add-date').bind('change', function () {
            changeAddDateSelect();
        });

        $('#submit-payplan').click(function() {
            loading.show();
            var param = {};
            param.allRecords = ENV.data._allRecords;

            var ppIds = [];
            $.each($('.selected-payment'), function (index, el) {
                var recJqObj = $(el)
                if (recJqObj[0].checked) {
                    ppIds.push(recJqObj.attr("pp-id"));
                }
            });
            if (ppIds.length === 0) {
                loading.hide();
                dialog.init("提交付款计划", "请勾选需要提交的记录！");
                return false;
            }

            if (ENV.data._allRecords) {
                param.businessType = $('#businesstype').val();
                param.customerId = $('#customerid').val();
                param.dateBegin = $('#datebegin').val();
                param.dateEnd = $('#dateEnd').val();
                param.status = $('#status').val();
                param.addBeginDate = $('#addbegindate').val();
                param.addEndDate = $('#addenddate').val();
                param.ppIds = $('#ppids').val();
            } else {
                param.ppIds = ppIds.join(',');
            }


            $.ajax({
                type: "POST",
                url: "/settle/ajax/submitPayPlan",
                data: param
            }).done(function (data) {
                loading.hide();
                if (data.code == 200) {
                    dialog.init("提交付款计划", "成功提交" + data.msg.count + "条");
                    $('#status').val(1)
                    $('#search').trigger("click");
                } else {
                    dialog.init("提交结果", "提交失败");
                }
            });

        });

        $("#customerName").autocomplete("../ajax/fetchCustomerNameSuggestion", {
            max: 10, // 查询条数
            autoFill: false, // 是否自动填充输入框
            scroll: false,
            matchContains: true,
            matchCase: true,
            delay: 1000,
            clickFire: false,
            width: $("#customerName").width() + "px",
            extraParams: {
                "businessType": function () {
                    return $("#businesstype").val()
                }
            },
            beforeSearch: function () {
                var businessTypeField = $("#businesstype");
                if (!autoValidator.validate(businessTypeField[0])) {
                    showError(autoValidator.errorMsg());
                    businessTypeField.addClass("error-input");
                    return false;
                }
                return true;
            },
            parse: function (data) {
                var rows = [];
                if (!data.msg || !data.msg.suggestion) {
                    rows.push({
                        data: {
                            "customerId": "0",
                            "customerName": "无搜索结果"
                        },
                        value: "0",
                        result: "无搜索结果"
                    });
                    return rows;
                }
                var suggestions = data.msg.suggestion;
                for (var i = 0; i < suggestions.length; i++) {
                    rows.push({
                        data: suggestions[i],
                        value: suggestions[i].customerId + "",
                        result: suggestions[i].customerName
                    });
                }
                return rows;
            },
            formatItem: function (data, i, n, value) {
                return data.customerName;
            }
        });

        $("#customerName").keydown(function (event) {
            if (event.keyCode == 13) {
                return;
            }
            $("#customerid").val('');
            $("#customerName").flushCache();
        });

        $("#customerName").result(function (event, data, formatted) {
            if (data.customerId == "0") {
                $("#customerName").val('');
                $("#customerid").val('');
                $("#customerName").flushCache();
                return;
            }
            $("#customerName").val(data.customerName);
            $("#customerid").val(data.customerId);
        });
    });

    function showError(error) {
        var errorDiv = $(".tips-container .error:first")[0];
        errorDiv.innerHTML = error;
        errorDiv.style.display = 'block';
        setTimeout(hideError, 10000);
    }

    function hideError() {
        var errorDiv = $(".tips-container .error:first")[0];
        errorDiv.innerHTML = "";
        errorDiv.style.display = 'none';
    }

    //应付日期默认值
    function changeDateSelect(){
        var dateMap = initDateMap();
        var v = $('#select-date').val();
        var s = dateMap[v || '0']['s'];
        var e = dateMap[v || '0']['e'];
        $('#datebegin').val(s);
        $('#dateend').val(e);
    };

    function changeAddDateSelect(){
        var dateMap = initDateMap();
        var v = $('#select-add-date').val();
        var s = dateMap[v || '0']['s'];
        var e = dateMap[v || '0']['e'];
        $('#addbegindate').val(s);
        $('#addenddate').val(e);
    };

    function initDateMap(){
        var now = new Date();
        var dateMap = {
            '99': {
                s: '',
                e: ''
            },
            '0': {
                s: '',
                e: now.defaultFormat()
            },
            '1': {
                s: now.defaultFormat(),
                e: now.defaultFormat()
            },
            '2': {
                s: now.pre(1).defaultFormat(),
                e: now.pre(1).defaultFormat()
            },
            '3': {
                s: now.pre(2).defaultFormat(),
                e: now.pre(2).defaultFormat()
            }
        };
        return dateMap;
    };

});