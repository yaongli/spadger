define(function (require, exports, module) {
    var $ = require('./jquery');
    var ajax = require('./ajax');
    var list = require("./list");
    var option = require("./option");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var pub = require("./public");

    $(document).ready(function () {

        pub.menuCollapseHandler();
        pub.searchCollapseHandler();
        pub.activeMenu("#oracle-map-export");
        pub.bindDatePicker($("#q-submitBeginTime"));
        pub.bindDatePicker($("#q-submitEndTime"));
        pub.bindDatePicker($("#q-payBeginTime"));
        pub.bindDatePicker($("#q-payEndTime"));

        $("#q-expensecatalog").bind("change", function (e) {
            var catalog = $(this).val();
        });

        $("#export").bind("click", function () {
            var url = '/pc/expense/mappingExport?';
            var params = "";
            params += "&expenseCatalog=" + document.getElementById("q-expensecatalog").value;

            if (document.getElementById("q-submitBeginTime").value) {
                params += "&submitBeginTime=" + document.getElementById("q-submitBeginTime").value;
            }

            if (document.getElementById("q-submitEndTime").value) {
                params += "&submitEndTime=" + document.getElementById("q-submitEndTime").value;
            }

            if (document.getElementById("q-payBeginTime").value) {
                params += "&payBeginTime=" + document.getElementById("q-payBeginTime").value;
            }

            if (document.getElementById("q-payEndTime").value) {
                params += "&payEndTime=" + document.getElementById("q-payEndTime").value;
            }

            url+=params;
            window.open(url, '_blank');
        });

        $('#q-payBeginTime').val(pub.getDateThreeMonthBefore(pub.getNowFormatDate()));
        $('#q-payEndTime').val(pub.getNowFormatDate());
        
        $("#q-expensecatalog").trigger("change");

    });

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
});
