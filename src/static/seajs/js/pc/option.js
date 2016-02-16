//auto generate option data
define(function(require, exports, module) {

    var $=require("jquery");
    var ajax=require("./ajax");
    module.exports= {

        ajaxWithCallback: function(select, url, params, namespace, value, method,callback){
            if(method==null || method=='post') {
                ajax.post(url, params, function(data){
                    deal(data,select,namespace,value);
                    callback(data);
                });
            } else {
                ajax.get(url,function(data){
                    deal(data,select,namespace,value);
                    callback(data);
                });
            }
        },

        ajax: function (select, url, params, namespace, value, method) {
            if(method==null || method=='post') {
                ajax.post(url, params, function(data){
                    deal(data,select,namespace,value);
                });
            } else {
                ajax.get(url,function(data){
                    deal(data,select,namespace,value);
                });
            }
        },

        empty:function(select){
            $("#" + select).html('');
        }
    };

    function deal(data,select,namespace,value) {
        $("#" + select).empty();
        var i;
        if (namespace != "" && namespace != null) {
            data = eval("data." + namespace);
        }

        for (var key in data) {
            $("#" + select).append('<option value="' + key + '">' + data[key] + '</option>');
        }

        if (value != null) {
            $("#" + select).val(value);
        }
    }
});