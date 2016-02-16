define(function (require, exports, module) {
    var $ = require('./jquery');
    var suggestTimeout;

    module.exports= {
        block : function() {
            showErrorDialog($("#spinner"), "", "");
        },
        release : function() {
            hideErrorDialog();
        },
        activeMenu: function(menuItem){
            //$(".ex-catagory").removeClass("left-active");
            //$(".ex-catagory").parent().removeClass("left-active");
            //$(".left-sub-active").removeClass("left-sub-active");
            var menu_item = $(menuItem);

            /*
            if(menu_item.hasClass("ex-catagory")){
                menu_item.addClass("left-active");
            }else{
                menu_item.addClass("left-sub-active");
                menu_item.parent().show();
                menu_item.parent().parent().addClass("left-active");
            }*/
            $(".ex-catagory").bind("click", function(){
                $(this).parent().parent().find("ul").hide();
                $(this).parent().parent().find("li").removeClass("left-active");
                $(".ex-catagory").removeClass("left-active");
                $(this).addClass("left-active");
                $(this).parent().addClass("left-active");
                $(this).parent().find("ul").show();
                if($(this).attr("id")=="mytodo"){
                    $("#span-todo").hide();
                    if($("#span-todo-audit").html()!=""){
                        $("#span-todo-audit").show();
                    }
                    if($("#span-todo-resubmit").html()!=""){
                        $("#span-todo-resubmit").show();
                    }
                }else
                {
                    if($("#span-todo").html()!=""){
                        $("#span-todo").show();
                    }
                    $("#span-todo-audit").hide();
                    $("#span-todo-resubmit").hide();
                }
            });
        },
        showTodoTaskNumber : function(){
            setTimeout(function() {
                $.ajax({
                    type: "post",
                    dataType: "json",
                    url: "/pc/expense/allTodoList",
                    async: false,
                    success: function (data) {
                        $("#span-todo").hide().html("");
                        $("#span-todo-audit").hide().html("");
                        $("#span-todo-resubmit").hide().html("");
                        if (data.code == 200) {
                            if ((data.toAuditNumber + data.toSubmitNumber) > 0){
                                $("#span-todo").html(""+(data.toAuditNumber + data.toSubmitNumber)).show();
                            }
                            if (data.toAuditNumber > 0){
                                $("#span-todo-audit").html(""+data.toAuditNumber).show();
                            }
                            if (data.toSubmitNumber > 0){
                                $("#span-todo-resubmit").html(""+data.toSubmitNumber).show();
                            }
                        }
                    }
                });

                if($("#a-audit").css("color")=="rgb(217, 219, 220)" || $("#a-resubmit").css("color")=="rgb(217, 219, 220)"){
                    $("#span-todo").hide();
                    if($("#span-todo-audit").html()!=""){
                        $("#span-todo-audit").show();
                    }
                    if($("#span-todo-resubmit").html()!=""){
                        $("#span-todo-resubmit").show();
                    }
                }

                if(window.location.pathname=="/pc/expense/todolistnew" || window.location.pathname=="/pc/expense/myresubmit"){
                    $("#span-todo").hide();
                    if($("#span-todo-audit").html()!=""){
                        $("#span-todo-audit").show();
                    }
                    if($("#span-todo-resubmit").html()!=""){
                        $("#span-todo-resubmit").show();
                    }
                }
            }, 400);
        },

        menuCollapseHandler : function(){
            $("#expense-detail").resize(function(){
                try {
                    setTimeout(function() {
                        //console.log("resize expense-detail");
                        var detailDiv = $("#expense-detail");
                        var detailDivLeft = detailDiv.offset().left;
                        var detailDivWidth = detailDiv.outerWidth();
                        $(".operate-container").css("left", "" + detailDivLeft + "px").css("width", "" + detailDivWidth + "px");
                      }, 600);
                    
                }catch (e){}
                }
            );
            
            $(".collapse-handler").bind("click", function(){
                if ($(this).find(".icon-chevron-left").css("display") == "none") {
                    $(this).animate({left: "140px"},500);
                    $(".left-main").animate({width: "140px"}, 500);
                    $(".right-main").css("width", "auto");
                    $(".right-main").css("overflow-y", "scroll");
                    $(".operate-container").animate({left: "46.5%"});
                    $(".operate-container").css("width","51.5%");
                    $(this).find(".icon-chevron-left").show();
                    $(this).find(".icon-chevron-right").hide();
                } else {
                    $(this).animate({left: "0"},500);
                    $(".left-main").animate({width: "0"}, 500);
                    $(".right-main").animate({width: "100%"}, 500);
                    $(".right-main").css("overflow-y", "scroll");
                    $(".operate-container").animate({left: "40.7%"});
                    $(".operate-container").css("width","57.5%");
                    $(this).find(".icon-chevron-left").hide();
                    $(this).find(".icon-chevron-right").show();
                }
                $("#expense-detail").trigger($.Event('resize'));
            });
        },
        searchCollapseHandler : function(){
            $('#collapse-search-handler').bind('click', function(){
                var search_area = $(".search-box");
                if(search_area.is(":visible")){
                    search_area.css("display","none");
                    $("#expand-search-div").css("display","");
                    $("#collapse-search-div").css("display","none");
                }else{
                    search_area.css("display","");
                    $("#expand-search-div").css("display","none");
                    $("#collapse-search-div").css("display","");
                }
            });
            $('#collapse-search-handler-relate').bind('click', function(){
                var search_area = $("#relate-info");
                if(search_area.is(":visible")){
                    search_area.css("display","none");
                    $("#expand-search-div-relate").css("display","");
                    $("#collapse-search-div-relate").css("display","none");

                    $("#relate-info").hide();
                    $("#relate-block").hide();
                    $("#relate-cost-block").hide();
                }else{
                    search_area.css("display","");
                    $("#expand-search-div-relate").css("display","none");
                    $("#collapse-search-div-relate").css("display","");

                    $("#relate-info").show();
                    $("#relate-block").show();
                    $("#relate-cost-block").show();
                }
            });

            $('#collapse-search-handler-attachment').bind('click', function(){
                var search_area = $("#attachment-block");
                if(search_area.is(":visible")){
                    search_area.css("display","none");
                    $("#expand-search-div-attachment").css("display","");
                    $("#collapse-search-div-attachment").css("display","none");

                    search_area.hide();
                }else{
                    search_area.css("display","");
                    $("#expand-search-div-attachment").css("display","none");
                    $("#collapse-search-div-attachment").css("display","");

                    search_area.show();
                }
            });
        },
        bindDatePicker: function(datepicker){
            datepicker.datepicker({
                format: "yyyy-mm-dd",
                autoclose: true,
                todayBtn: true,
                language: "zh_CN",
                forceParse: false,
                todayHighlight:true
            }).on('changeDate', function(e){
                $(this).datepicker('hide');
            });

            datepicker.on('click', function(e){
                if($(this).val()!=""){
                    $(this).datepicker('update');
                    $(this).datepicker('show');
                }
            });
        },

        bindAjaxAction: function(){
            $(".ajaxbtn").on('click', function(){
                $(".ajaxbtn").ajaxStart(function() {
                    $(this).attr('disabled',"true");
                });
                $(".ajaxbtn").ajaxStop(function() {
                    $(this).removeAttr("disabled");
                });

            });
        } ,

        bindAutoComplete : function() {
            $('.autocomplete').live('input propertychange', function() {

                clearTimeout(suggestTimeout);
                var that = this;
                var value = $(this).val().trim();
                $(this).removeAttr("result");

                if (value) {
                    var param = $(this).attr("param");
                    var params = "q=" + value;
                    if (param && param != "") {
                        params += "&" + param;
                    }
                    suggestTimeout = setTimeout(function () {
                        $.ajax({
                            type: "post",
                            dataType: "json",
                            url: $(that).attr("suggest-url"),
                            data: params,
                            success: function (data) {
                                var map = data.msg.suggestion;
                                if ($(that).hasClass("long-ac")) {
                                    $(".ac-list").css("min-width", 400);
                                } else {
                                    $(".ac-list").css("min-width", $(that).width() + 15);
                                }

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
                                    var text = $(this).text();
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

        },
        formatMoney : function(s, n) {
            if(n > 0){
                s = parseFloat((s + "").replace(/[^\d\.-]/g, "")).toFixed(n) + "";
            }else{
                s = s + "";
            }
            var l = s.split(".")[0].split("").reverse(), r = s.split(".")[1];
            t = "";
            for (i = 0; i < l.length; i++) {
                t += l[i] + ((i + 1) % 3 == 0 && (i + 1) != l.length ? "," : "");
            }
            if(r==undefined){
                return t.split("").reverse().join("")
            }else {
                return t.split("").reverse().join("") + "." + r;
            }
        },
        beginDateChange : function(){
            $("#q-propose-begin-date").bind("change", function(e){
                if($("#q-propose-begin-date").val()==""){
                    return;
                }
                if($("#q-propose-end-date").val()==""){
                    var dateAfter = getDateThreeMonthAfter($("#q-propose-begin-date").val());
                    var today = getToday();
                    if(compareTwoDate(dateAfter, today)){
                        dateAfter = today;
                    }
                    $("#q-propose-end-date").val(dateAfter);
                }
            });
        },
        endDateChange : function(){
            $("#q-propose-end-date").bind("change", function(e){
                if($("#q-propose-end-date").val()==""){
                    return;
                }
                if($("#q-propose-begin-date").val()==""){
                    var dateAgo = getDateThreeMonthAgo($("#q-propose-end-date").val());
                    $("#q-propose-begin-date").val(dateAgo);
                }
            });
        },
        verifyQueryDate : function(beginDate, endDate){
            if(compareTwoDate(beginDate, endDate)){
                if(beginDate!=endDate){
                    return false;
                }
            }
            var dateAfter = getDateThreeMonthAfter(beginDate);
            return compareTwoDate(dateAfter, endDate)
        },
        addCookie : function(name,value){
            var cookieStr=name+"="+value;
            document.cookie=cookieStr;
        },
        getCookie: function(name){
            var strCookie=document.cookie;
            var arrCookie=strCookie.split("; ");
            for(var i=0;i<arrCookie.length;i++){
                var arr=arrCookie[i].split("=");
                if(arr[0]==name) return arr[1];
            }
            return "";
        },
        getDateThreeMonthBefore: function(today){
            return getDateThreeMonthAgo(today);
        },
        getNowFormatDate: function () {
            var date = new Date();
            var seperator1 = "-";
            var year = date.getFullYear();
            var month = date.getMonth() + 1;
            var strDate = date.getDate();
            if (month >= 1 && month <= 9) {
                month = "0" + month;
            }
            if (strDate >= 0 && strDate <= 9) {
                strDate = "0" + strDate;
            }
            var currentdate = year + seperator1 + month + seperator1 + strDate;
            return currentdate;
        }
    } //end of exports


    function hideErrorDialog() {
        $(".modal").hide();
        $(".modal-backdrop").remove();
        $("#spinner").hide();
    }

    function getToday(){
        var curDate = new Date();
        var curY=curDate.getFullYear();
        var curM=curDate.getMonth()+1;
        var curD=curDate.getDate();
        curY+="";
        curM+="";
        curD+="";
        if(curM.length==1){
            curM="0"+curM;
        }
        if(curD.length==1){
            curD="0"+curD;
        }
        return curY + "-" + curM + "-" + curD;
    }

    function getDateThreeMonthAgo(strDate){
        var curDate = new Date(strDate.replace(/\-/g,"/"));
        var beforeDate =new Date(curDate.setMonth(curDate.getMonth() - 2));
        var beforeY=beforeDate.getFullYear();
        var beforeM=beforeDate.getMonth();
        var beforeD=beforeDate.getDate();
        if(beforeM==0){
            beforeM=12;
            beforeY-=1;
        }
        beforeY+="";
        beforeM+="";
        beforeD+="";
        if(beforeM.length==1){
            beforeM="0"+beforeM;
        }
        if(beforeD.length==1){
            beforeD="0"+beforeD;
        }
        return beforeY + "-" + beforeM + "-" + beforeD;
    }

    function getDateThreeMonthAfter(strDate){
        var curDate = new Date(strDate.replace(/\-/g,"/"));
        var afterDate =new Date(curDate.setMonth(curDate.getMonth() + 4));
        var afterY=afterDate.getFullYear();
        var afterM=afterDate.getMonth();
        var afterD=afterDate.getDate();
        if(afterM==0){
            afterM=1;
        }
        if(afterM.length==1){
            afterM="0"+afterM;
        }
        if(afterD.length==1){
            afterD="0"+afterD;
        }
        afterY+="";
        afterM+="";
        afterD+="";
        if(afterM.length==1){
            afterM="0"+afterM;
        }
        if(afterD.length==1){
            afterD="0"+afterD;
        }
        return afterY + "-" + afterM + "-" + afterD;
    }

    function compareTwoDate(date1, date2){
        var curDate1 = new Date(date1.replace(/\-/g,"/"));
        var curDate2 = new Date(date2.replace(/\-/g,"/"));
        return (curDate1 >= curDate2);
    }

    function showErrorDialog(dialog, title, content) {
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

});