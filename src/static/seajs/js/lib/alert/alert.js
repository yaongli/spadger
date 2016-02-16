/* =========================================================
 *  基于bootstrap-alert的提示框组件
 *  huweixuan
 * ========================================================= */
define(function(require) {
    var $ = require('jquery');
    require('bootstrap');

    var Alert = function() {
        //this.init();
    };

    Alert.prototype = {
        constructor: Alert,
        init: function() {
            var self = this;
            $('.app').append(this.getHTML());
            this.$element = $('#_alert');
            this.$element.alert();
            this.$element.bind('closed', function () {
                self.$element.removeClass('alert-success').removeClass('alert-error');
                if(typeof self._callback === 'function') {
                    self._callback.apply();
                }
            });
            $('#_alert_close').bind('click', function () {
                self.$element.alert('close');
            });
        },
        _show: function(msg) {
            $('#_alert_message').html(msg);
        },
        error: function(msg, callback) {
            this.init();
	    this._callback = callback;
            this.$element.addClass('alert-error');
            this._show(msg);
        },
        success: function(msg, callback) {
            this.init();
            this._callback = callback;
            this.$element.addClass('alert-success');
            this._show(msg);
        },
        warn: function(msg) {
            this.init();
            this._show(msg);
        },
        getHTML: function() {
            var html = '<div class="alert alert-block app-alert fade in" id="_alert">' 
                + '<button type="button" class="close" data-dismiss="alert">×</button>' 
                + '<p id="_alert_message" class="alert-message"></p>'
                + '<p><button class="btn" id="_alert_close">确定</button></p>'
                + '</div>';
            return html;
        }
    };

    return new Alert();
});
