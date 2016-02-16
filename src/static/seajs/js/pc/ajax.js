//ajax request common function, for post request.
define(function (require, exports, module) {
    var $ = require("jquery");
    module.exports = {
        //Used to be call ajax_pure, send http post request to any url
        post: function (url, params, callback, errorCallback) {
            $.ajax({
                type: "post",
                dataType: "json",
                url: url,
                data: params,
                success: function (data) {
                    if (!data.code || data.code == 0 || data.code == 200) {
                        if (callback) {
                            callback(data);
                        }
                    } else if (data.code == 403) {
                        alert("您没有执行该操作的权限！");
                        cleanScreen();
                    } else if (data.code == 500) {
                        alert("系统错误，请联系系统管理员！");
                        cleanScreen();
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    if (errorCallback) {
                        errorCallback();
                    }
                    alert("error@ajax_post:" + errorThrown);
                }
            });
        },

        get: function (url, callback) {
            $.ajax({
                type: "get",
                url: url,
                success: function (data) {
                    if (!data.code || data.code == 0 || data.code == 200) {
                        if (callback) {
                            data.msg.code = data.code;
                            callback(data.msg);
                        }
                    } else if (data.code == 403) {
                        alert("您没有执行该操作的权限！");
                        cleanScreen();
                    } else if (data.code == 500) {
                        alert("系统错误，请联系系统管理员！");
                        cleanScreen();
                    }
                },
                error: function (jqXHR, textStatus, errorThrown) {
                    alert("error@ajax_get:" + errorThrown);
                }
            });
        }
    };

    function cleanScreen(){
        $(".modal-backdrop").hide();
        $("#loading").hide();
    }
});

