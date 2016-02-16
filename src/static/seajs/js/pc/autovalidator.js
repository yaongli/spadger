//this is a module for common validation
define(function(require,exports,module){
    var errorMsg="";
    var regex="";
    var date=require("./date");
    var $=require("jquery");
    require("./hashmap");
    
    module.exports= {
        validate: function (element) {
            if(element.getAttribute("datatype")=="date"){
                if(element.value!=null&&element.value!=""&&!date.correct(element.value)){
                    errorMsg="日期格式不正确";
                    return false;
                }
            }
            var ruleStr = element.getAttribute("validate");
            if (ruleStr != null) {
                var rules = ruleStr.split(" ");
                var i;
                for (i = 0; i < rules.length; i++) {
                    var rule = rules[i];
                    if (!isCorrect(rule, element)) {
                        return false;
                    }
                }
            }
            return true;
        },

        errorMsg:function(){
            return errorMsg;
        }
    };

    function isCorrect(rule,element){
        var value=element.value;
        errorMsg=getCustomErrorMsg(element,rule);
        if(rule.length>2&&rule.substr(0,2)=="gt"||rule.substr(0,2)=="lt"||rule.substr(0,2)=="ge"||rule.substr(0,2)=="le"||rule.substr(0,2)=="eq"||rule.substr(0,2)=="ne"){
            if(value==null||value==""){
                return true;
            }
            var begin=rule.indexOf('[');
            var end=rule.indexOf(']');
            var compareTo=$('#'+rule.substr(begin+1,end-begin-1))[0];
            var compareValue;
            if(compareTo!=null){
                compareValue=compareTo.value;
            } else {
                compareValue=rule.substr(begin+1,end-begin-1);
            }
            if(element.getAttribute("datatype")=="date"){
                value=date.toDate(value);
                compareValue=date.toDate(compareValue);
            }
            if(!errorMsg) {
                errorMsg = "输入值的大小不符合要求";
            }
            if(rule.substr(0,2)=="gt"){
                return value>compareValue;
            } else if(rule.substr(0,2)=="lt"){
                return value<compareValue;
            } else if(rule.substr(0,2)=="ge"){
                return value>=compareValue;
            } else if(rule.substr(0,2)=="le"){
                return value<=compareValue;
            } else if(rule.substr(0,2)=="eq"){
                return value==compareValue;
            } else if(rule.substr(0,2)=="ne"){
                return value!=compareValue;
            }
        } else if(rule.length>=1){
            getRegex(rule);
            if(new RegExp(regex,"g").exec(value)!=null){
                return true;
            }
        }
        return false;
    }

    function getRegex(rule){
        var msg;
        if(rule.substr(0,1)=="e"){
            regex="^13[0-9]{9}$|14[0-9]{9}|15[0-9]{9}$|18[0-9]{9}$";
            msg="请输入正确的邮箱地址";
        } else if(rule.substr(0,1)=="n"){
            var begin=rule.indexOf('[');
            var end=rule.indexOf(']');
            var mid=rule.indexOf(',');
            if(begin!=-1&&end!=-1){
                var temp=rule.substr(begin+1,end-begin-1);
                if (temp.indexOf('*')!=-1){
                    regex="^\\d{"+rule.substr(begin+1,mid-begin-1)+"}$";
                    msg="请输入至少"+rule.substr(begin+1,mid-begin-1)+"个数字";
                } else {
                    regex = "^\\d{" + rule.substr(begin + 1, end - begin - 1) + "}$";
                    msg="请输入"+rule.substr(begin+1,mid-begin-1)+"至"+rule.substr(mid+1,end-mid-1)+"个数字";
                }
            } else {
                regex="^[0-9]*$";
                msg="请输入数字";
            }
        } else if(rule.substr(0,1)=="f"){
            var begin=rule.indexOf('[');
            var end=rule.indexOf(']');
            var mid=rule.indexOf(',');
            if(begin!=-1&&end!=-1){
                var temp=rule.substr(begin+1,end-begin-1);
                if (temp.indexOf('*')!=-1){
                    regex="^\\d{1,10}(?:\\.\\d{"+rule.substr(begin+1,mid-begin-1)+",})?$";
                    msg="请输入至少"+rule.substr(begin+1,mid-begin-1)+"位小数";
                } else {
                    regex = "^\\d{1,10}(?:\\.\\d{" + rule.substr(begin + 1, end - begin - 1) + "})?$";
                    msg="请输入"+rule.substr(begin+1,mid-begin-1)+"至"+rule.substr(mid+1,end-mid-1)+"位小数";
                }
            } else {
                regex="^\\d{1,10}(?:\\.\\d{0,})?$";
                msg="请输入正确格式的数值";
            }
        } else if(rule.substr(0,1)=="s"){
            var begin=rule.indexOf('[');
            var end=rule.indexOf(']');
            var mid=rule.indexOf(',');
            if(begin!=-1&&end!=-1){
                var temp=rule.substr(begin+1,end-begin-1);
                if (temp.indexOf('*')!=-1){
                    regex="^.{"+rule.substr(begin+1,mid-begin-1)+"}$";
                    msg="请输入至少"+rule.substr(begin+1,mid-begin-1)+"个字符";
                } else {
                    regex = "^.{" + rule.substr(begin + 1, end - begin - 1) + "}$";
                    msg="请输入"+rule.substr(begin+1,mid-begin-2)+"至"+rule.substr(mid+1,end-mid-2)+"个字符";
                }
            } else {
                regex="^.*$";
                msg="请输入字符";
            }
        } else if(rule.substr(0,1)=="+"){
            regex = "^.+$";
            msg="输入不能为空";
        } else if(rule.substr(0,1)=="m"){
            regex = "^(1\\d{10}$";
            msg="请输入正确的手机号码";
        }  else {
            regex=rule;
            msg="输入不符合要求，请修改";
        }
        if(!errorMsg) {
            errorMsg=msg;
        }
    }

    function getCustomErrorMsg(element,rule){
        var msgStr=element.getAttribute("error_msg");
        if(msgStr!=null){
            var msgs=msgStr.split(" ");
            var i;
            for(i=0;i<msgs.length;i++){
                var msg=msgs[i].split(":");
                if(msg.length==2&&msg[0]==rule){
                    return msg[1];
                }
            }
        }
        return null;
    }
});