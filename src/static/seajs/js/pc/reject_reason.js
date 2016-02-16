/**
 * Created by yangyongli on 10/16/15.
 */

define(function (require, exports, module) {
    var $ = require('./jquery');

    module.exports = {
        render: function(){
            var body = [
                "<div id='reject-reason-container'>",
                "<div><input type='checkbox' value='预算项目错误'/> 预算项目错误</div>",
                "<div><input type='checkbox' value='承担部门或城市错误'/> 承担部门或城市错误</div>",
                "<div><input type='checkbox' value='缺乏报销明细'/> 缺乏报销明细</div>",
                "<div><input type='checkbox' value='费用超过公司标准'/> 费用超过公司标准</div>",
                "<div><input type='checkbox' value='费用科目错误'/> 费用科目错误</div>",
                "<div>其它：</div><div><textarea id='detail-reason'></textarea></div>",
                "</div>"
            ].join("\n");
            return body;
        },
        collect: function(){
            var detail = []
            $("#reject-reason-container").find("input[type=checkbox]:checked").each(function(index, item){
                detail.push($(item).val())
            })
            var other = $("#reject-reason-container").find("#detail-reason").val()
            if(other) {
                detail.push(other)
            }
            return detail.join("; ");
        }
    }
});