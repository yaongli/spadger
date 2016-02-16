//common function for table and page
define(function(require, exports, module) {

    var $=require("jquery");
    require("./jquery.tmpl");
    var form=require("./form");
    var ajax=require("./ajax");
    var loading=require("./loading");


    var _model;
    var _tableId;
    var _pageId;
    var _context;
    var _param;
    var _searchId;
    var _searchValidator;
    var _page;
    var _callback;
    var _totalPage;
    var _emptyId;
    var _maxShowPages = 3;

    module.exports= {
        // Used to be called list.init, ajax to a certain url and fetch a
        // JSONArray, display it in the form of model

        empty:function(tableId,emptyId){
            $('#'+emptyId).tmpl(null).appendTo('#' + tableId);
        },

        init: function (model, tableId, pageId, context, param,emptyId, searchId,searchValidator, page, callback) {
            cacheVariables(model, tableId, pageId, context, param,emptyId, searchId,searchValidator, page, callback);
            if (param == null) {
                param = "";
            }
            if (searchId == null) {
                searchId = "";
            }
            var params = "";
            var table = document.getElementById(tableId);
            var tableUrl = table.getAttribute("table_url");
            if (page) {
                params += "page=" + page;
            }
            if (searchId && searchId != "") {
                if (!form.validate(searchId,searchValidator)) {
                    return;
                }
                loading.show();
                this.searchInit(searchId);
                var searchParams=this.searchOptions(searchId);
                if(searchParams!=null&&searchParams!="") {
                    params += this.searchOptions(searchId);
                }
                table.setAttribute("search_id", searchId);
            }
            if (table.getAttribute("sort_property") != "" && table.getAttribute("sort_property") != null) {
                params += "&" + table.getAttribute("sort_property") + "=" + table.getAttribute("sort_type");
            }
            if (param != "") {
                params += "&" + param;
            }
            var namespace = "";
            if (table.getAttribute("namespace") != ''
                && table.getAttribute("namespace") != null) {
                namespace = "." + table.getAttribute("namespace");
            }

            var _this=this;
            if(document.getElementById("page_size_select")!=null && table.hasAttribute("page_size")){
                $("#page_size_select").unbind('change');
                $("#page_size_select").bind('change',function(){
                    _this.init(model, tableId, pageId, context, param, emptyId, searchId,searchValidator, page, callback);
                });
                table.setAttribute("page_size",$("#page_size_select").val());
            }
            if (table.hasAttribute("page_size")) {
                params += "&pageSize=" + table.getAttribute("page_size");
            }
            ajax.post(tableUrl, encodeURI(params), function (data) {
                var pageModel = eval("data" + namespace);
                var messageList;
                if(pageModel){
                    messageList = pageModel.records;
                }
                var i = 0;
                table.innerHTML = "";

                if (messageList && messageList.length > 0) {
                    $('#' + model).tmpl(pageModel).appendTo('#' + tableId);
                    if (pageId && pageId != "") {
                        _this.page(model, tableId, context, param, searchId, searchValidator, page, pageId, pageModel);
                    }
                    $(".page_first").click(function(){
                        _this.paging(1);
                    });

                    $(".page_num").click(function(){
                        _this.paging(parseInt(this.innerHTML));
                    });

                    $(".page_jump").click(function(){
                        var pageNum =parseInt($("#q-page").val());
                        if(pageNum > 0 && pageNum <= _totalPage) {
                            _this.paging(pageNum);
                        }
                    });

                    $(".page_pre").click(function(){
                        _this.paging(_page-1);
                    });

                    $(".page_next").click(function(){
                        _this.paging(_page+1);
                    });

                    $(".page_last").click(function(){
                        _this.paging(_totalPage);
                    });
                } else {
                    $('#'+emptyId).tmpl(pageModel).appendTo('#' + tableId);
                    $("#"+pageId).hide();
                }
                loading.hide();
                if (callback) {
                    callback(data);
                }
            },function(){
                loading.hide();
            });
        },

        // Used to be called get_search_options
        searchOptions: function (formId) {
            var form = document.getElementById(formId);
            var values = form.getElementsByClassName("form_value");
            var i = 0;
            var params = "";
            for (i = 0; i < values.length; i++) {
                if (values[i].type == "radio" && !values[i].checked) {
                    continue;
                }
                if (values[i].getAttribute("search_data") != null
                    && values[i].getAttribute("search_data") != "") {
                    params += "&" + values[i].name + "=" + values[i].getAttribute("search_data");
                }
            }
            return params;
        },

        // used to be called search_data_init
        searchInit: function (formId) {
            var form = document.getElementById(formId);
            var values = form.getElementsByClassName("form_value");
            var i = 0;
            for (i = 0; i < values.length; i++) {
                if (values[i].type == "radio" && !values[i].checked) {
                    continue;
                }
                values[i].setAttribute("search_data", values[i].value);
            }
        },

        // Used to be called _list.page
        page: function (model, tableId, context, param, searchId,searchValidator, page, pageId, pageModel) {
            var pageForm = document.getElementById(pageId);
            pageForm.getElementsByClassName("row_count")[0].innerHTML = pageModel.recordCount;
            var totalPage = Math.ceil(pageModel.recordCount / pageModel.pageSize);
            _totalPage=totalPage;
            if(totalPage == 1){
                $(".jump-page").hide();
            }
            pageForm.getElementsByClassName("total_page")[0].innerHTML = totalPage;
            pageForm.getElementsByClassName("start_record")[0].innerHTML = (pageModel.page - 1) * pageModel.pageSize + 1;
            pageForm.getElementsByClassName("end_record")[0].innerHTML = pageModel.page * pageModel.pageSize > pageModel.recordCount ? pageModel.recordCount : pageModel.page * pageModel.pageSize;
            var i;
            var startPage = pageModel.page > (_maxShowPages - 1) ? pageModel.page - (_maxShowPages - 2) : 1;
            var navigationHTML = "";
            if (pageModel.page == 1) {
                navigationHTML += "<li class='page_first'><a>首页</a></li>";
                navigationHTML += this.generateLi(startPage, totalPage, 1);
            } else {
                navigationHTML += "<li><a style='cursor:pointer' class='page_first'>首页</a></li>";
                navigationHTML += "<li><a  style='cursor:pointer' class='page_pre'>«</a>";
                if (pageModel.page < _maxShowPages) {
                    navigationHTML += this.generateLi(startPage, totalPage, pageModel.page);
                } else {
                    //navigationHTML += "<li><a style='cursor:pointer' class='page_num'>1</a></li>";
                    if (pageModel.page != _maxShowPages) {
                        //navigationHTML += "<li><a>...</a></li>"
                    }
                    navigationHTML += this.generateLi(startPage, totalPage, pageModel.page);
                }
            }

            if (totalPage - startPage - _maxShowPages > 0) {
                //navigationHTML += "<li><a>...</a></li>";
            }

            if (pageModel.page != totalPage) {
                navigationHTML += "<li><a style='cursor:pointer' class='page_next'>»</a></li>"
                navigationHTML += "<li><a style='cursor:pointer' class='page_last'>末页</a></li>";
            } else {
                navigationHTML += "<li class='page_last'><a>末页</a></li>";
            }
            pageForm.getElementsByClassName("navigator")[0].innerHTML = navigationHTML;
            pageForm.style.display="block";
        },

        generateLi: function (start, total, now) {
            var html = "";
            for (i = start; i < ((start + _maxShowPages) > total ? (total + 1) : (start + _maxShowPages)); i++) {
                if (i != now) {
                    html += "<li><a style='cursor:pointer' class='page_num'>" + i + "</a></li>";
                } else {
                    html += "<li class='active'><a>" + i + "</a></li>";
                }
            }
            return html;
        },

        paging:function(num){
            this.init(_model, _tableId, _pageId, _context, _param,_emptyId, _searchId,_searchValidator, num, _callback);
        },

        curPage:function(){
            this.init(_model, _tableId, _pageId, _context, _param,_emptyId, _searchId,_searchValidator, _page, _callback);
        }
    }

    function cacheVariables(model, tableId, pageId, context, param,emptyId, searchId,searchValidator, page, callback){
        _model=model;
        _tableId=tableId;
        _pageId=pageId;
        _context=context;
        _param=param;
        _searchId=searchId;
        _searchValidator=searchValidator;
        _page=page;
        _callback=callback;
        _emptyId=emptyId;
    }
});