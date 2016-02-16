(function() {
    var getBase = function() {
        return '/js/pc/';
    };

    if (typeof ENV === 'undefined') {
        ENV = {};
    }

    seajs.config({
        debug: ENV.debug
    });

    seajs.config(
        {
            base: getBase(),
            alias: {
                //"datepicker": "../lib/date-picker/js/bootstrap-datepicker.js",
                //"timepicker": "../lib/timepicker/js/bootstrap-timepicker.js",
                "bootstrap": "../lib/bootstrap/js/bootstrap.js"
            }

        }
    );

})()