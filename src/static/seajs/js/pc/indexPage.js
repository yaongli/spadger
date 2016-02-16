define(function (require, exports, module) {
    var $ = require('./jquery');
    var ajax = require('./ajax');
    var list = require("./list");
    var option = require("./option");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var pub = require("./public");
    var workflow = require("./workflow");
    var weekMap = {1: "(一)", 2: "(二)", 3: "(三)", 4: "(四)", 5: "(五)", 6: "(六)", 0: "(日)"};
    var reqAsc = false;
    var orderField=1;
    var lineNum = 0;


    $(document).ready(function () {

        if(window.location.pathname == "/pc/expense/FAQ") {
            var id = location.hash[1];
            document.getElementById(id).style.background="#F1F0EE";
        }

        pub.activeMenu("#mainpage-menu");
        pub.bindAutoComplete();
        pub.menuCollapseHandler();
        pub.searchCollapseHandler();

        $('#tabContentContainer > div').hide();   // 全部Tab内容不显示
        $('#tabContentContainer > div:first').show();  // 显示第一个Tab内容

        $('#tabContainer > div:first').attr('class', 'tab-dashboard-title');             // 设置第一个Tab为current
        $('#tabContainer > div').each(function(n) {                        // 遍历所有子div控件
            $(this).click(function() {
                $('#tabContainer > div').attr({'class':'tab-dashboard-title-other'});             // 所有Tab都设置为other
                $(this).attr('class','tab-dashboard-title');                                        // 当前Tab设置为current
                $('#tabContentContainer > div').each(function(n) {    // 遍历设置所有的Tab内容不显示
                    $(this).hide();
                });
                $('#'+this.id+'_con').show();                      // 显示当前的Tab对应的内容
            });
        })

        $("#construction-link-imprest").live("click", function (e) {
            $("#container").css('background-color', '#FFFFFF');
            $("#container").css('min-height', '200px');
            $("#container").css('margin-top', '10px');
            $("#container").css('min-width', '1000px');

            $(".navigation").html("首页 > 备用金")

            $("#container").html("  <div style=\"position:relative; top: 50px; margin-left:20%;\">" +
            "<div style=\"font-size: 30px; font-family: 'microsoft yahei'; color: #333333;\"><img src=\"/img/Construction.gif\" style=\"vertical-align: bottom; margin-left: 120px;\"><p style=\"font-size: 13px;\">备用金申请、备用金核销仍然线下进行（除外区行政备用金外）<a class=\"link-style\" href=\"javascript:void(0)\" file-name=\"byjsqb.xls\">点击下载纸质单据</a></p></div></div>");
        });

        $("a.link-style").live("click", function (e) {
            var url = 'downloadFile?'
                + '&fileName=' + $(this).attr("file-name");
            window.open(url, '_blank');
        });

        $("#construction-link-outside").live("click", function (e) {
            $("#container").css('background-color', '#FFFFFF');
            $("#container").css('min-height', '200px');
            $("#container").css('margin-top', '10px');
            $("#container").css('min-width', '1000px');

            $(".navigation").html("首页 > 对公支付")

            $("#container").html("  <div style=\"position:relative; top: 50px; margin-left:20%;\">" +
            "<div style=\"font-size: 30px; font-family: 'microsoft yahei'; color: #333333; \"><img src=\"/img/Construction.gif\" style=\"vertical-align: bottom; margin-left: 120px;\"><a class=\"link-style\" href=\"javascript:void(0)\" file-name=\"fksqd.xls\">点击下载纸质单据</a></div></div>");
        });

        pub.showTodoTaskNumber();
    });

    $("#btn-send-email").bind("click",function(){
        if ($("#emailContent").val() != "") {
            var param = {};
            param.emailContent = $("#emailContent").val().trim();
            $.ajax({
                type: "post",
                dataType: "json",
                url: "/pc/feedBack/emailSend",
                data: param,
                success: function (data) {
                    if (data.code != 200) {
                        $("#emailContent").val("");
                        $("#emailContent").attr("placeholder", "未发送成功，请稍候再试");
                        return;
                    }else {
                        $("#emailContent").val("");
                        $("#emailContent").attr("placeholder", "收到您的反馈了，还有什么想对我们说的吗？");
                        return;
                    }
                }
            });
        }
    });

});
