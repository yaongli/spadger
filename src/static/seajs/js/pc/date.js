//some operation for date

define(function(require,exports,module){

    module.exports= {
        //Used to be called JSONDateToJSDate, format date into suitable form.
        trans : function (jsondate, format) {
            if (jsondate == null)return"";
            var date = new Date(+/\d+/.exec(jsondate)[0]);
            return date.format(format);
        },

        toDate:function(date){
            if(date==null||date==""){
                return new Date().minValue();
            }
            var result = date.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/);
            return new Date(result[1], result[3] - 1, result[4]);
        },

        correct : function (date) {
            var result = date.match(/^(\d{1,4})(-|\/)(\d{1,2})\2(\d{1,2})$/);
            if (result == null)
                return false;
            var d = new Date(result[1], result[3] - 1, result[4]);
            return (d.getFullYear() == result[1] && (d.getMonth() + 1) == result[3] && d.getDate() == result[4]);
        }
    }
});

//Date format....
Date.prototype.format = function(fmt){
    var o = {
        "M+" : this.getMonth()+1,                 //月份
        "d+" : this.getDate(),                    //日
        "h+" : this.getHours(),                   //小时
        "m+" : this.getMinutes(),                 //分
        "s+" : this.getSeconds(),                 //秒
        "q+" : Math.floor((this.getMonth()+3)/3), //季度
        "S"  : this.getMilliseconds()             //毫秒
    };
    if(/(y+)/.test(fmt))
        fmt=fmt.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length));
    for(var k in o)
        if(new RegExp("("+ k +")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
    return fmt;
};

Date.prototype.defaultFormat = function(){
    return this.format("yyyy-MM-dd");
};

Date.prototype.pre = function(day){
    var ODT = 24*60*60*1000;
    var now = new Date();
    var nowTime = now.getTime();
    return new Date(nowTime - day*ODT);
};

Date.prototype.later = function(day){
    var ODT = 24*60*60*1000;
    var now = new Date();
    var nowTime = now.getTime();
    return new Date(nowTime + day*ODT);
};

Date.prototype.minValue=function(){
    return new Date(0);
};

Date.prototype.isValid=function(value,fmt){
    var date=value.replace(/(^\s+|\s+$)/g,'');
    if(date==''){
        return true;
    }
};