define(function (require, exports, module) {
    var $ = require('./jquery');

//canvas start
    var orange = "rgba(255, 102, 31, 1)";
    var grey = "rgba(180, 180, 180, 1)";
    var midGrey = "rgba(151, 151, 151, 1)";
    var green = "rgba(152, 204, 54, 1)";
    var darkGrey = "rgba(48, 48, 48, 1)";
    //var multiple = 2;
    var multiple  = 2.5;
    var divider = 2.5;
    var lradius = 8 * multiple;
    var sradius = 4 * multiple;
    var arcwidth = 2 * multiple;
    var upDist = 30 * multiple;
    var y = 40 * multiple;
    var dist = 56 * multiple;
    var logDist = 40 * multiple;
    var logLineHeight = 15 * multiple;
    var logRadius = 3 * multiple;
    var logX = 10 * multiple;
    //var lradius = 20;
    //var sradius = 10;
    //var arcwidth = 6;
    //var upDist = 40;
    //var y = 70;
    //var dist = 100;
    //var logDist = 30;
    //var logLineHeight = 15;
    //var logRadius = 5;
    //var logX = 20;
    var status = 1;
    var originDetail = null;
    var redirectDetail = Object();
    var redirectData = Object();

    module.exports = {
        draw: function (data) {
            if(!data) {
                return false;
            }
            var canvas = document.getElementById("flow");
            var width = $("#flow-div").width();
            canvas.width = width > dist * data.length ? width : dist * data.length + 13 * multiple;
            //canvas.height = 115 * multiple;
            canvas.height = 131 * multiple;
            canvas.style.width = canvas.width + "px";
            canvas.style.height = canvas.height + "px";
            if (canvas == null) {
                return false;
            }
            var context = canvas.getContext("2d");
            context.translate(0.5, 0.5);
            var list = new Array();
            var assigneeNum = 1;
            for (var i = 0; i < data.length; i++) {
                var point = new Point();
                if (data[i].assignee && data[i].assignee != undefined) {
                    var count = data[i].assignee.split(",").length;
                    if (count > assigneeNum) {
                        assigneeNum = count;
                    }
                }
                point.assignee = data[i].assignee;
                point.taskName = data[i].taskName;
                point.status = data[i].status;
                point.rank = data[i].sequence - 1;
                list[i] = point;
            }

            for (var i = 0; i < list.length; i++) {

                drawWord(context, list[i]);
                drawLine(context, list[i], i > 0);
                drawPoint(context, list[i]);

            }
            canvas.style.width = canvas.width / divider + "px";
            canvas.style.height = canvas.height / divider + "px";
        },

        drawLog: function (data) {
            if(!data) {
                return false;
            }
            var canvas = document.getElementById("log");
            if (canvas == null) {
                return false;
            }
            canvas.width = $("#log-div").width() * multiple;
            //canvas.width = $("#log-div").width();
            canvas.height = 30;
            canvas.style.width = canvas.width + "px";
            var context = canvas.getContext("2d");
            var canvasWidth = canvas.width - logX - 50;
            var list = new Array();
            for (var i = 0; i < data.length; i++) {
                var log = new Log();
                log.highlight = data[i].action == 2;
                if (data[i].name) {
                    if (data[i].taskDescription) {
                        log.behave = data[i].name + " " + data[i].taskDescription + " " + data[i].behave;
                    } else {
                        log.behave = data[i].name + " " + data[i].behave;
                    }
                } else {
                    log.behave = data[i].behave;
                }
                log.time = data[i].time;
                log.rank = i;

                var line = log.time + " " + log.behave;
                context.font = 12 * multiple + "px microsoft yahei";
                log.height = wrapCount(context, line, canvasWidth) * logLineHeight + 15;
                canvas.height += log.height;

                list[i] = log;
            }
            canvas.style.height = canvas.height + "px";
            context = canvas.getContext("2d");
            context.font = 12 * multiple + "px microsoft yahei";
            var logY = 30;
            for (var i = 0; i < list.length; i++) {
                var point = list[i];
                context.beginPath();
                context.fillStyle = midGrey;
                context.arc(logX, logY, logRadius, 0, Math.PI * 2, true);
                context.fill();
                context.closePath();
                context.textBaseline = "middle";
                context.fillStyle = point.highlight ? orange : midGrey;
                wrapText(context, point.time + " " + point.behave, logX + 20 * multiple, logY, canvasWidth, logLineHeight, false);
                if (i != 0) {
                    context.beginPath();
                    context.strokeStyle = midGrey;
                    context.moveTo(logX, logY);
                    context.lineTo(logX, logY - list[i - 1].height);
                    context.stroke();
                    context.closePath();
                }
                logY = point.height + logY;
            }
            canvas.style.width = canvas.width / divider + "px";
            canvas.style.height = canvas.height / divider + "px";
        }
    }

    function Point() {
        this.assignee = "";
        this.taskName = "";
        this.status = 1; //1 is done, 2 is doing, 3 is to do
        this.rank = 0;
    }

    function Log() {
        this.behave = "";
        this.time = "";
        this.rank = 0;
        this.highlight = false;
        this.height = 0;
    }

    function drawPoint(context, point) {
        var color = orange;
        if (point.status == 1 || point.status == 3 || status == 2) {
            color = grey;
        }
        context.beginPath();
        context.arc(point.rank * dist + 20 * multiple, y, lradius, 0, Math.PI * 2, true);
        context.strokeStyle = color;
        context.lineWidth = arcwidth;
        context.stroke();
        context.closePath();
        if (point.status == 2 || point.status == 1) {
            context.beginPath();
            context.arc(point.rank * dist + 20 * multiple, y, sradius, 0, Math.PI * 2, true);
            context.fillStyle = color;
            context.fill();
            context.closePath();
        }
    }

    function drawWord(context, point) {
        context.beginPath();
        var color = orange;
        if (point.status == 1 || point.status == 3 || status == 2) {
            color = grey;
        }
        context.fillStyle = color;
        context.font = 13 * multiple + "px microsoft yahei";
        context.textBaseline = "middle";
        if (point.assignee) {
            var length = context.measureText(point.assignee).width;
            length = length > 39 * multiple ? 39 * multiple : length;
            var assigneeList = point.assignee.split(",");
            var heightPlus = 0;
            //if(assigneeList.length > 1){
            //    heightPlus = 16 * multiple;
            //}
            wrapText(context, point.assignee, point.rank * dist + 20 * multiple - length / 2, y - upDist - heightPlus, length, 16 * multiple, true);
        }
        if (point.taskName) {
            var taskLength = context.measureText(point.taskName).width;
            taskLength = taskLength > 39 * multiple ? 39 * multiple : taskLength;
            wrapText(context, point.taskName, point.rank * dist + 20 * multiple - taskLength / 2, y + upDist , taskLength, 16 * multiple, true);
        }
        context.closePath();
    }

    function wrapText(context, text, x, y, maxWidth, lineHeight, middle) {
        var names = text.split(",");
        for (var i = 0; i < names.length; i++) {
            var words = names[i].split("");
            var line = "";
            if(i > 0){
                y += lineHeight;
            }
            for (var n = 0; n < words.length; n++) {
                var testLine = line + words[n] + "";
                var metrics = context.measureText(testLine);
                var testWidth = metrics.width;
                if (testWidth > maxWidth) {
                    context.fillText(line, x, y);
                    line = words[n] + "";
                    y += lineHeight;
                } else {
                    line = testLine;
                }
            }
            if (line) {
                var start = 0;
                if (middle) {
                    start = (maxWidth - context.measureText(line).width) / 2;
                }
                context.fillText(line, x + start, y);
            }
        }
    }

    function wrapCount(context, text, maxWidth) {
        var words = text.split("");
        var line = "";
        var count = 0;
        for (var n = 0; n < words.length; n++) {
            var testLine = line + words[n] + "";
            var metrics = context.measureText(testLine);
            var testWidth = metrics.width;
            if (testWidth > maxWidth) {
                count += 1;
                line = words[n] + "";
            } else {
                line = testLine;
            }
        }
        if (line) {
            count += 1;
        }
        return count;
    }

    function drawLine(context, point) {
        if (point.rank <= 0) {
            return;
        }
        var color = grey;
        context.beginPath();
        context.strokeStyle = color;
        context.fillStyle = color;
        context.lineWidth = arcwidth / 2;
        context.moveTo(dist * (point.rank - 1) + 20 * multiple + lradius + arcwidth / 2, y);
        context.lineTo(dist * point.rank + 20 * multiple - lradius - arcwidth / 2, y);
        context.stroke();
        context.closePath();
    }

//canvas end

});