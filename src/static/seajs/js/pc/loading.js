//loading effect
define(function(require, exports, module) {
    var $=require("jquery");
    var $mask;
    module.exports={

        show:function(){
            if(!$(".modal-backdrop").length) {
                var maskHtml = '<div class="modal-backdrop">' +
                    '<div class="alert" id="loading">' +
                    '加载中...' +
                    '</div>' +
                    '</div>';
                $mask = $(maskHtml).prependTo(document.body);
            }
            $(".modal-backdrop").show();
        },

        hide:function(){
            $(".modal-backdrop").hide();
        }
    }
});