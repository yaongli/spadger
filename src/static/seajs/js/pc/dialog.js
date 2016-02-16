//common use for module dialog
define(function(require,exports,module){

    var diaCallback=null;
    var $=require("jquery");
    var initHTML = "<button class=\"btn\" data-dismiss=\"modal\" aria-hidden=\"true\">关闭</button>";

    module.exports= {
        init: function (title, body, button, callback) {
            $("#modalDialog_title").html(title);
            $("#modalDialog_body").html(body);
            if (button != null) {
                diaCallback = callback;
                var buttonHTML = "<button class=\"btn btn-primary dialog-callback\">" + button + "</button>"
                $("#modalDialog_footer").html(buttonHTML + initHTML);
                $(".dialog-callback").bind('click',diaCallback);
            }
            $("#modalDialog").modal('show');
        },

        hide: function () {
            $("#modalDialog_title").html('');
            $("#modalDialog_body").html('');

            $("#modalDialog_footer").html(initHTML);
            $("#modalDialog").modal('hide');
        }
    }

});