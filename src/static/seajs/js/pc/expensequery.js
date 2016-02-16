define(function (require, exports, module) {
    var $ = require('./jquery');
    var ajax = require('./ajax');
    var list = require("./list");
    var option = require("./option");
    var loading = require("./loading");
    var queryCommon = require("./querycommon");
    var dialog = require("./dialog");
    var pub = require("./public");
    var reqAsc=false;
    var orderField=1;

    $(document).ready(function () {
        $(".nav-tab").removeClass("nav-selected");
        $(".nav-query").addClass("nav-selected");
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

        //初始化时隐藏checkbox,隐藏全选全部页面选项，全选全部页面选项为false
        $('#cb-select-all-incur').hide();
        $('#div-select-all-pageinfo').hide();
        $('#cb-select-all-pages').attr('checked',false);

        //调试用的代码
//        $('#cb-select-all-incur').show();
//        $('#div-select-all-pageinfo').show();

        //通过审核按钮添加传出编号事件
        $('#accept-selected').live("click",function(){
            //如果全选了所有页面，传递的参数应当是当前页面的search条件
            if($('#cb-select-all-pages').attr('checked') == 'checked'){
                var para="";
                para+="beginTime="+$('#q-beginTime').val()+"&";
                para+="endTime="+$('#q-endTime').val()+"&";
                para+="proposerCity="+$('#q-city').val()+"&";
                para+="departmentId="+$('#q-department').val()+"&";
                para+="taskDefinitionKey="+$('#q-taskdefinitionkey').val()+"&";
                para+="expenseNo="+$('#q-expenseno').val()+"&";
                para+="proposerNo="+$('#q-requestno').val()+"&";
                para+="budgetSubject="+$('#q-budget-subject').val()+"&";
                para+="expenseCatalog="+$('#q-expensecatalog').val()+"&";
                para+="allRecords=true";

                $.ajax({
                    type:"get",
                    dataType:"json",
                    url:"/pc/expense/repay",
                    data:para,
                    success:function(data){//参数传递成功的返回值
                        showDialog($("#message-container"),"提示",data.message);
                        list.curPage();
                    }
                });

            }
            else{
                var acceptNo="";
                $.each($(".selected-workflow"),function(index,el){
                    if($(el).attr('checked')=='checked'){
                        acceptNo+=$(el).attr("expenseNo")+";";
                    }
                });


                $.ajax({
                    type:"get",
                    dataType:"json",
                    url:"/pc/expense/repay",
                    data:"expenseNos="+acceptNo,
                    success:function(data){//参数传递成功的返回值

                        showDialog($("#message-container"),"提示",data.message);
                        list.curPage();


                    }
                });


            }



            $('#cb-select-all-incur').attr('checked', false);//全选框置成false
            $('.exquery-curpage-select-div').hide();//全选提示信息消失
            $('#div-select-all-pageinfo').hide();//全选全部页面提示隐藏
            $('#cb-select-all-pages').attr('checked', false);//全选全部页面全选框置成false
            $('.selected-workflow').attr('checked', false);//每行的复选框也置成false

        });


        //全选复选框事件添加
        $('#cb-select-all-incur').live('click', function () {
            //将每行的复选框状态置成全选复选框的状态
            var selectedNum = 0;
            var checked = $('#cb-select-all-incur')[0].checked;
            $.each($('.selected-workflow'), function (index, el) {
                $(el).attr('checked', checked);//第二个check就是上面的变量
                selectedNum++;
            });

            //如果点击了全选，就显示所选的条数
            if (checked) {
                $('.exquery-curpage-select-div').show();//当前选择页面出现
                $('.select-info-hightlight').text(selectedNum+"条");//嵌入条数
                $('#div-select-all-pageinfo').show();//全选全部页面提示出现
                $('#cb-select-all-pages').attr('checked', false);
            } else {
                $('.exquery-curpage-select-div').hide();//当前选择页面隐藏
                $('#div-select-all-pageinfo').hide();//全选全部页面提示隐藏
                $('#cb-select-all-pages').attr('checked', false);

            }
        });

        //全选全部页面复选框事件添加
        $('#cb-select-all-pages').live('click',function(){
            if($('#cb-select-all-pages').attr('checked')=='checked'){
                $('.select-info-hightlight').text("每页所有");//嵌入条数
            }
            else{
                $('.select-info-hightlight').text($('.selected-workflow').size()+"条");//嵌入条数
            }

        });


        $('#confirm-msg').bind('click',function(){
            $('.modal-backdrop-1').hide();
        });

        //search payplan list
        $('#search').bind('click', function () {

            //只要查询，div就该消失，checked属性就该是false，全选全部页面提示隐藏，全选全部页面复选框变为false
            //这段代码被挪到list前面了，就是为了防止list出错，后面的代码不执行，结果还有不该看到的东西，果然只要是别人的代码就都要尽量当心啊= =！
            $('#cb-select-all-incur').attr('checked', false);//全选框置成false
            $('#cb-select-all-incur').hide();//全选框消失
            $('.exquery-curpage-select-div').hide();//全选提示信息消失
            $('#div-select-all-pageinfo').hide();//全选全部页面提示隐藏
            $('#cb-select-all-pages').attr('checked', false);//全选全部页面全选框置成false
            $('.selected-workflow').hide();//保险起见每行的复选框消失

            var param="";
            if($("#q-requestno").attr("result")) {
                param += "proposerNo="+$("#q-requestno").attr("result") + "&";
            }
            if($("#q-city").attr("result")) {
                param += "proposerCity="+$("#q-city").val() + "&";
            }
            if($("#q-department").attr("result")) {
                param += "departmentId="+$("#q-department").attr("result") + "&";
            }
            if($("#q-auditer").attr("result")){
                param += "auditNo=" + $("#q-auditer").attr("result") + "&";
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



                //每次查询前先判断是否是退票
                chooseValue = $('#q-taskdefinitionkey').val();
                if(chooseValue != 11 && chooseValue != 12){
                    //如果不是退票，那么和复选框相关的一切全部隐藏
                    $('#cb-select-all-incur').hide();
                    $('.selected-workflow').hide();
                }
                else {//如果是退票,和复选框相关的一起就显示
                    $('#cb-select-all-incur').show();
                    $('.selected-workflow').show();
                    //每行数据复选框加上点击事件
                    $('.selected-workflow').live('click', function () {
                        //暂时先只要点击某行，全选按钮就置为false，全选全部页面复选框变为false,全选全部页面hide
                        $('#cb-select-all-incur').attr('checked', false);
                        $('#cb-select-all-pages').attr('checked', false);
                        $('#div-select-all-pageinfo').hide();//全选全部页面提示隐藏


                        var selectedNum = 0;
                        $.each($('.selected-workflow'), function (index, el) {
                            if ($(el).attr('checked') == 'checked') {
                                selectedNum++;
                            }
                        });
                        if (selectedNum > 0) {
                            $('.exquery-curpage-select-div').show();
                            $('.select-info-hightlight').text(selectedNum+"条");
                        } else {
                            $('.exquery-curpage-select-div').hide();
                        }
                    });
                }

                //旁边显示的细节内容依赖于是否取出了数据
                if (data.expenseSummaryInfoModel.recordCount == 0) {
                    $("#item-content").hide();
                }
                else {
                    $("#item-content").show();
                }
            });
        });

        $("#q-taskdefinitionkey").bind("change",function(e){
             var value = $(this).val();
            if(value == 7 || value == 8 || value == 11 || value == 12 || value == 2){
                $("#auditer-div").hide();
                $("#q-auditer").hide();
            } else {
                $("#auditer-div").show();
                $("#q-auditer").show();
            }

            $('#cb-select-all-incur').attr('checked', false);//全选框置成false
            $('#cb-select-all-incur').hide();//全选框消失
            $('.exquery-curpage-select-div').hide();//全选提示信息消失
            $('#div-select-all-pageinfo').hide();//全选全部页面提示隐藏
            $('#cb-select-all-pages').attr('checked', false);//全选全部页面全选框置成false
            $('.selected-workflow').hide();//保险起见每行的复选框消失
        });


    });





    //自定义的shwoDialog函数
    function showDialog(dialog, title, content) {
        dialog.find(".modal-title").text(title);
        dialog.find(".modal-body").html(content);
        dialog.show();
        dialog.css({"position": "fixed"});
        dialog.css({"top": "10px"});
        dialog.css({"left": Math.max(0, (($(window).width() - dialog.width()) / 2) +
            $(window).scrollLeft()) + "px"});
//        $("#message-container").modal({
//            show: true,
//            keyboard: true
//        });
        var maskHtml = '<div class="modal-backdrop-1"></div>';
        $(maskHtml).prependTo(document.body);
    }
});
