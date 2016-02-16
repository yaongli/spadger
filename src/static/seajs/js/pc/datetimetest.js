define(function (require, exports, module) {
    var $ = require('./jquery');
    require("./jquery.tmpl");
    var ajax = require('./ajax');
    var list = require("./list");
    var option = require("./option");
    var loading = require("./loading");
    var dialog = require("./dialog");
    var pub = require("./public");
    var workflow = require("./workflow");
    require('datepicker');
    require('bootstrap');
    require('./bootstrap-datetimepicker')($);

    $(document).ready(function () {
        
        $(".form_datetime").datetimepicker({format: 'yyyy-mm-dd hh:ii'});

    });

});
