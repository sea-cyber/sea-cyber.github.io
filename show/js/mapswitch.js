//初始化地图切换
InitQSwitch = function (Config, pestsMap) {
    if (dev.IsNull(Config.SystemMap.MapSwitchInfo) || Config.SystemMap.MapSwitchInfo.length == 0) return;
    var param = $.extend({
        Parent: pestsMap
    }, Config.SystemMap.MapSwitchInfo);
    dev.App.MapSwitch = new UCQSwitch(param);
};
/*UCQSwitch*/
(function ($) {
    UCQSwitch = function (opt) {
        if (dev.IsNull(opt)) opt = { ID: "MapSwitch" + new Date().getTime() };
        if (dev.IsNull(opt.Target)) opt.Target = $('<div class="MapSwitch"></div>');
        this.SwitchWidth = !dev.IsNull(opt.SwitchWidth) ? parseInt(opt.SwitchWidth) : 40;
        this.SwitchHeight = !dev.IsNull(opt.SwitchHeight) ? parseFloat(opt.SwitchHeight) : 40;
        this.SwitchMaps = Enumerable.From(opt.SwitchMaps).Where("s=>s.IsVisible==='true'&&s.IsFloat==='true'").ToArray();
        opt.Width = (this.SwitchMaps.length * (this.SwitchWidth + 15)) - 8;
        $.extend(this, new dev.Control(opt));
        this.SetWidth(opt.SwitchWidth);
        var $this = this;
        this.Target.css({ "bottom": "70px", "right": "40px" });
        var types = [];
        this.SwitchMaps = Enumerable.From(this.SwitchMaps).OrderBy('s=>s.Order').ToArray();
        for (var i = 0; i < this.SwitchMaps.length; i++) {
            types.push(this.SwitchMaps[i].Type);
            var div = $('<div id="' + this.SwitchMaps[i].ID + '" class="MapSwitch-Single" style="width:' + (this.SwitchWidth) + 'px;height:' + (this.SwitchHeight) + 'px;right:' + (i === 0 ? 1 : i * (this.SwitchWidth + 15)) + 'px;display:' + (i === 0 ? "block" : "none") + ';background-image:url(../' + this.SwitchMaps[i].BackImg + ');"></div>');
            div.mouseover(function () {
                var id = $(this).attr("id");
                //判断当前的div是否是最右边的
                if ($this.IsRightNode(id)) {
                    for (var j = 0; j < $(this).parent()[0].children.length; j++) $($(this).parent()[0].children[j]).css({ "display": "block" });
                }
                $("#" + id + "content").css({ "background-color": "#0000FF", "opacity": "0.8", "filter": "alpha(opacity:80)" });
                $(this).css({ "border": "1px solid #979393" });
            }).mouseleave(function () {
                var id = $(this).attr("id");
                $("#" + id + "content").css({ "background-color": "#000000", "opacity": "0.3", "filter": "alpha(opacity:30)" });
                $(this).css({ "border": "1px solid #f3f5f6" });
            }).click(function () {
                $this.SetStyleByType($(this).attr("id"));
                var id = $(this).attr("id");
                var currType = $("#" + id + "text").attr("tag");
                var checkcontrol = $(".dev-checkbox", $(this)).prop("$this");
                var check;
                if (!dev.IsNull(checkcontrol)) {
                    check = true;
                    checkcontrol.Target.attr("_checked") == "true";
                }
                $this.Target.triggerHandler("onSwitchClick", { type: currType, check: check });
            });
            var contentid = this.SwitchMaps[i].ID + "content";
            var divcontent = $('<div id="' + contentid + '" class="MapSwitch-ContentTip" style="margin-top:' + (this.SwitchHeight - 20) + 'px;"></div>');
            divcontent.appendTo(div);
            var textid = this.SwitchMaps[i].ID + "text";
            var divText = $('<span id="' + textid + '" style="font-size:12px;color:#fff;line-height:20px;" tag="' + this.SwitchMaps[i].Type + '">' + this.SwitchMaps[i].Text + '</span>');
            divText.appendTo(divcontent);
            //添加checkbox
            if (this.SwitchMaps[i].IsShowCheck == "true") {
                var checkboxdiv = $('<div id="' + this.SwitchMaps[i].ID + 'check" style="height:20px;width:100%;background:rgba(255,255,255,0.5);" tag="' + this.SwitchMaps[i].ID + '"></div>');
                var checkbox = new dev.CheckBox({ Text: "角度", CSS: { "margin-left": "8px", "margin-top": "2px" } });
                checkboxdiv.appendTo(div);
                checkboxdiv.append(checkbox.Target);
            }
            div.appendTo(this.Target);
        }
        this.MapTypes = types;
        this.Target.mouseleave(function () {
            var childrens = $(this).children();
            $this.Hidden();
            $(this).css({ width: $this.SwitchWidth + "px" });
        });
        this.Target.mouseover(function () {
            $(this).css({ width: opt.Width + "px" });
        });
        this.Target.appendTo(opt.Parent);
    };
    $.fn.extend(UCQSwitch.prototype, {
        SetStyleByType: function (id) {
            //切换
            var switchdiv = $('.MapSwitch-Single', this.Target);
            //获取第一个
            var right, firstchild;
            for (var i = 0; i < switchdiv.length; i++) {
                var div_r = parseInt($(switchdiv[i]).css("right").replace("px", ""));
                if (i == 0) {
                    right = div_r;
                    firstchild = $(switchdiv[i]);
                    continue;
                }
                if (div_r < right) { right = div_r; firstchild = $(switchdiv[i]); }
            }
            var c_r = parseInt($("#" + id).css("right").replace("px", ""));
            firstchild.css("right", c_r + "px");
            $("#" + id).css({ "right": right + "px" });
        },
        IsRightNode: function (id) {
            var switchdiv = $('.MapSwitch-Single', this.Target);
            var right;
            for (var i = 0; i < switchdiv.length; i++) {
                var div_r = parseInt($(switchdiv[i]).css("right").replace("px", ""));
                if (i == 0) right = div_r;
                else if (div_r < right) right = div_r;
            }
            var curr_right = parseInt($("#" + id).css("right").replace("px", ""));
            return curr_right == right;
        },
        Hidden: function () {
            //显示最右的数据，其它隐藏
            var switchdiv = $('.MapSwitch-Single', this.Target);
            var right, childnode;
            for (var i = 0; i < switchdiv.length; i++) {
                var div_r = parseInt($(switchdiv[i]).css("right").replace("px", ""));
                if (i == 0) { right = div_r; childnode = $(switchdiv[i]); }
                else if (div_r < right) { right = div_r; childnode = $(switchdiv[i]); }
                $(switchdiv[i]).css("display", "none");
            }
            childnode.css("display", "block");
        },
        GetPreId: function () {
            var switchdiv = dev.App.FillPanel.Target;
            return switchdiv.attr("class");
        },
        SetVisibleByID: function (id) {
            if (dev.IsNull(id)) return;
            $("." + id).css("display", "none");
        }
    });
})(jQuery);

/*添加城市列表*/
; (function ($) {
    var xzqselectpanel, contentbox, xzqprovincedata, xzqcitydata, xzqcountydata, selectxzq;
    //行政区定位
    //var defaultposition = dev.App.Config.SystemMap.Position;
    showmapcity = function () {
        if (dev.IsNull(xzqselectpanel)) {
            xzqselectpanel = $('<div class="xzqpositionpanel" style="top:120px;z-index:10;background-color:rgba(20, 205, 173,0.6);height:382px"></div>');
            var title = $('<div style="width:100%;height:25px;"><div class="title"><span style="margin-left:10px;line-height:25px;color:#fcfcfc;">城市列表</span></div><div class="CloseButton"></div><div>').appendTo(xzqselectpanel);
            $(".CloseButton", xzqselectpanel).click(function () {
                $(".dev-combobox", xzqselectpanel).prop("$this").unbind("onChange");
                xzqwaitbox.Close();
                dev.MapUtils.ClearFeature("tempTrackLayer");
                contentbox.Target.remove();
                contentbox = null;
                xzqselectpanel.remove();
                xzqselectpanel = null;
            });
            var querycontent = $('<div class="content" style="background-color: rgba(20, 205, 173,0.6)"></div>').appendTo(xzqselectpanel);
            //常见城市
            var commoncity = $('<div class="commoncity"><a tag="000000">全国</a><a>北京</a><a>上海</a><a>广州</a><a>深圳</a><a>成都</a><a>天津</a><a>南京</a><a>杭州</a><a>武汉</a><a>重庆</a><a>澳门</a><a>香港</a></div>').appendTo(querycontent);
            $("a", commoncity).css({ "color": "black" });
            $("a", commoncity).click(function () {
                $("a", commoncity).css({ "font-weight": "normal" });
                $(this).css("font-weight", "bold");
                //定位
                var text = $(this).text();
                if (text == "全国") {
                    dev.MapUtils.ClearFeature("tempTrackLayer");
                    dev.App.Map.getView().centerOn([104.2663955688477, 29.93828272819518], dev.App.Map.getSize(), [dev.App.Map.getSize()[0] / 2, dev.App.Map.getSize()[1] / 2]);
                    dev.App.Map.getView().setZoom(4);
                    selectxzq = text;
                    dev.App.Config.SystemMap.Position.Code = "000000";
                    dev.App.Config.SystemMap.Position.Type = "Country";
                    $("#city-location").html(selectxzq);
                    return;
                }
                if (text != "澳门" && text != "香港") text = text + "市";
                positionbykey(text, "city");
            });
            //分类及关键字查询
            var searchbtns = $('<div class="searchbtns"></div>').appendTo(querycontent);
            var btnsdiv = $('<div class="btns"></div>').appendTo(searchbtns);
            var proinvcebtn = $('<div class="normalbtn select" tag="province">按省份</div>').appendTo(btnsdiv);
            var citybtn = $('<div class="normalbtn" tag="city">按城市</div>').appendTo(btnsdiv);
            var countybtn = $('<div class="normalbtn" style="border:0px" tag="county">按县区</div>').appendTo(btnsdiv);
            $(".normalbtn", xzqselectpanel).click(function () {
                if ($(this).hasClass("select")) return;
                xzqwaitbox.Show();
                $(".normalbtn", xzqselectpanel).removeClass("select");
                $(this).addClass("select");
                //显示字母对应
                $(".chardiv", xzqselectpanel).empty();
                var tag = $(this).attr("tag");
                for (var i = 65; i < 91; i++) {
                    if (tag == "province" && (i == 66 || i == 67 || i == 68 || i == 69 || i == 73 || i == 75 || i == 77 || i == 79 || i == 80 || i == 82 || i == 85 || i == 86 || i == 87)) continue;
                    if (tag == "city" && (i == 73 || i == 79 || i == 85 || i == 86)) continue;
                    var charnode = $('<a>' + String.fromCharCode(i) + ' </a>');
                    charnode.click(function () {
                        var text = $(this).html();
                        $('a', $(".chardiv", xzqselectpanel)).css("font-weight", "normal");
                        $(this).css("font-weight", "bold");
                        //查询结果
                        var c_td = $('td[tag="' + text.trim() + '"]:first', $(".result", xzqselectpanel));
                        if (c_td.length == 0) return;
                        contentbox.Revert();
                        var offsettop = contentbox.GetScrollTop(c_td.offset().top);
                        contentbox.SetScrollV(offsettop);
                    });
                    charnode.css("color", "black");
                    $(".chardiv", xzqselectpanel).append(charnode);
                }
                //查询并显示
                var c_data;
                if (tag == "province") {
                    if (dev.IsNull(xzqprovincedata)) xzqprovincedata = getxzqquerydata(tag);
                    c_data = xzqprovincedata;
                }
                if (tag == "city") {
                    if (dev.IsNull(xzqcitydata)) xzqcitydata = getxzqquerydata(tag);
                    c_data = xzqcitydata;
                }
                if (tag == "county") {
                    if (dev.IsNull(xzqcountydata)) xzqcountydata = getxzqquerydata(tag);
                    c_data = xzqcountydata;
                }
                var height = 395 - ($('.title', xzqselectpanel).outerHeight() + $(".content", xzqselectpanel).outerHeight()) - 15;
                $(".result", xzqselectpanel).height(height);
                contentbox.SetHeight(height);
                if (dev.IsNull(c_data) || c_data.length == 0) return;
                setTimeout(function () {
                    var table;
                    if (tag == "province") table = loadprovincedata(c_data);
                    else table = loadcitydata(c_data, (tag == "city"));
                    contentbox.SetContent(table);
                    xzqwaitbox.Close();
                }, 100);
                //开始查询
                var searchtext = $(".dev-combobox", xzqselectpanel).prop("$this");
                if (dev.IsNull(searchtext)) return;
                var data = getsearchkey(searchtext.GetText(), tag);
                searchtext.SetData(data);
            });
            var searchkey = $('<div class="searchkey"></div>').appendTo(searchbtns);
            var searchtextbox = $('<div style="width:68px;height:22px;display:inline-block;float:left;"></div>').appendTo(searchkey);
            var searchcombo = new dev.Combobox({
                TextField: 'name',
                ValueField: 'gid',
                Width: 68,
                Height: 22,
                Readonly: false,
                Border: "0px"
            });
            searchcombo.Target.bind("onChange", function (s, e) {
                var tag = $(".select", $(".btns", xzqselectpanel)).attr("tag");
                var data = getsearchkey(e.newValue, tag);
                searchcombo.SetData(data);
            });
            searchtextbox.append(searchcombo.Target);
            searchcombo.Layout();
            var searchkeybtn = $('<div class="searchbtn machine-query"></div>').appendTo(searchkey);
            searchkeybtn.click(function () {
                //获取对应的文本内容
                var combocontrol = $(".dev-combobox", xzqselectpanel);
                if (combocontrol.length == 0) return;
                var value = combocontrol.prop("$this").GetText();
                if (dev.IsNull(value)) return;
                var datas = combocontrol.prop("$this").GetData();
                var isok = false, gid;
                for (var i = 0; i < datas.length; i++) {
                    if (datas[i].name == value) {
                        isok = true;
                        gid = datas[i].gid;
                        break;
                    }
                }
                if (isok) {
                    //获取type
                    var tag = $(".select", $(".btns", xzqselectpanel)).attr("tag");
                    positionbykey(gid, tag, true);
                    // selectxzq.html(value);
                }
            });
            //字母
            var charsdiv = $('<div class="chardiv"></div>').appendTo(querycontent);
            var selectnode = "province";
            for (var i = 65; i < 91; i++) {
                if (i == 66 || i == 67 || i == 68 || i == 69 || i == 73 || i == 75 || i == 77 || i == 79 || i == 80 || i == 82 || i == 85 || i == 86 || i == 87) continue;
                var charnode = $('<a>' + String.fromCharCode(i) + '</a>');
                charnode.click(function () {
                    var text = $(this).html();
                    $('a', $(".chardiv", xzqselectpanel)).css({ "font-weight": "normal" });
                    $(this).css("font-weight", "bold");
                    //查询结果
                    //获取对应字母所在行
                    var c_td = $('td[tag="' + text.trim() + '"]:first', $(".result", xzqselectpanel));
                    if (c_td.length == 0) return;
                    contentbox.Revert();
                    var offsettop = contentbox.GetScrollTop(c_td.offset().top);
                    contentbox.SetScrollV(offsettop);
                });
                charnode.css({ "color": "black" });
                charsdiv.append(charnode);
            }
            dev.App.MapPanel.Target.append(xzqselectpanel);
            //显示结果div
            var height = 395 - (title.outerHeight() + querycontent.outerHeight()) - 15;
            var resultdiv = $('<div class="result" style="height:' + height + 'px;width:250px;position:relative;margin-top:0"></div>').appendTo(xzqselectpanel);
            if (dev.IsNull(contentbox)) {
                contentbox = new dev.Box({ Width: 250, Height: height, HasBorder: false });
                contentbox.Target.css({ "background-color": "rgba(20, 205, 173,0.6)", "color": "black" });
                resultdiv.append(contentbox.Target);
            }
            xzqwaitbox = new dev.UCWaitBox({ Parent: contentbox.Target, Width: 250, Height: height });
            (function () {
                var isMouseDown = false, currElement, elPos, mousePos;
                var pdom = dev.App.MapPanel.MapDOM;
                title.bind("mousedown", function (e) {
                    // if (!e.data.Draggable) return;
                    isMouseDown = true, currElement = this;
                    //xzq_zindex = xzqselectpanel.css("z-index");
                    $(".floatPanel", dev.App.Map.MapDOM).css("z-index", 10);
                    xzqselectpanel.css("z-index", 11);
                    mousePos = { x: e.clientX, y: e.clientY };
                    elPos = { l: parseInt(xzqselectpanel[0].offsetLeft), t: parseInt(xzqselectpanel[0].offsetTop) };
                    if (currElement.setCapture) {
                        currElement.setCapture();
                        currElement.onmouseup = HeaderMouseUp;
                        currElement.onmousemove = function (ev) {
                            HeaderMouseMove(ev || event);
                        };
                    }
                    else $(document).bind("mouseup", HeaderMouseUp).bind("mousemove", HeaderMouseMove);
                    e.preventDefault();
                });

                function HeaderMouseUp() {
                    isMouseDown = false;
                    //xzqselectpanel.css("z-index", xzq_zindex);
                    currElement.releaseCapture ? (currElement.releaseCapture(), currElement.onmousemove = currElement.onmouseup = null) : ($(document).unbind("mouseup", HeaderMouseUp).unbind("mousemove", HeaderMouseMove));
                }

                function HeaderMouseMove(e) {
                    if (!isMouseDown) return;
                    var top = elPos.t + (e.clientY - mousePos.y);
                    var left = elPos.l + (e.clientX - mousePos.x);
                    if (top < 0) top = 0;
                    //else if (top + xzqselectpanel.outerHeight() > pdom.outerHeight()) {
                    //    top = pdom.outerHeight() - xzqselectpanel.outerHeight();
                    //    if (top < 0) top = 0;
                    //}
                    if (left < 0) left = 0;
                    //else if (left + xzqselectpanel.outerWidth() > pdom.outerWidth()) {
                    //    left = pdom.outerWidth() - xzqselectpanel.outerWidth();
                    //    if (left < 0) left = 0;
                    //}
                    xzqselectpanel.css({ top: top + "px", left: left + "px" });
                }
            }());
        }
        else {
            if (xzqselectpanel.css("display") == "block") {
                xzqselectpanel.css("display", "none");
            }
            else
                xzqselectpanel.css("display", "block");
        }
        xzqwaitbox.Show();
        if (dev.IsNull(xzqprovincedata)) xzqprovincedata = getxzqquerydata("province");
        if (dev.IsNull(xzqprovincedata) || xzqprovincedata.length == 0) return;
        var tableinfo = loadprovincedata(xzqprovincedata);
        contentbox.SetContent(tableinfo);
        xzqwaitbox.Close();

        //加载省的内容
        function loadprovincedata(tempdata) {
            if (dev.IsNull(tempdata) || tempdata.length == 0) return;
            var provincedata = Enumerable.From(tempdata).Where('s=>s.dtype=="province" && s.name!="北京市" && s.name!="重庆市" && s.name!="天津市" && s.name!="台湾省" && s.name!="上海市" && s.name!="澳门" && s.name!="香港"').ToArray();
            var citydata = Enumerable.From(tempdata).Where('s=>s.dtype=="city"').ToArray();
            var table = $('<table style="width:230px;" cellpadding="0" cellspacing="0"></table>');
            provincedata = Enumerable.From(provincedata).OrderBy('s=>s.key').ToArray();
            var rows = Enumerable.From(provincedata).GroupBy("s=>s.key").ToArray();
            for (var i = 0; i < rows.length; i++) {
                for (var j = 0; j < rows[i].source.length; j++) {
                    var text = rows[i].source[j].name;
                    if (rows[i].source[j].name.length > 4) {
                        if (rows[i].source[j].name == "内蒙古自治区") text = "内蒙古";
                        if (rows[i].source[j].name == "广西壮族自治区") text = "广西省";
                        if (rows[i].source[j].name == "西藏自治区") text = "西藏";
                        if (rows[i].source[j].name == "宁夏回族自治区") text = "宁夏省";
                        if (rows[i].source[j].name == "新疆维吾尔自治区") text = "新疆";
                    }
                    var tr = $('<tr><td style="width:20px;vertical-align: top;padding: 3px; 7px 0 7px;font-size:22px;font-weight:bold;color:#ccc;" tag="' + (rows[i].source[j].key) + '"><div>' + (j == 0 ? rows[i].source[j].key : "") + '</div></td><td style="width:57px;vertical-align: top;padding-top:5px;padding-right:5px;font-weight:bold;"><a dtype="province" tag="' + rows[i].source[j].gid + '">' + text + '</a></td></tr>').appendTo(table);
                    var citytd = $('<td style="160px;vertical-align: top;"></td>').appendTo(tr);
                    var citys = Enumerable.From(citydata).Where('s=>s.province=="' + rows[i].source[j].name + '"').ToArray();
                    for (var n = 0; n < citys.length; n++) {
                        //if (n % 3 == 0) citytd.append($((n == 0 ? "" : "<br/>") + '<a style="line-heihgt:22px;margin-left:0px;"><span>' + citys[n].name + '</span></a>'));
                        //else citytd.append($('<a style="line-height:22px;"><span>' + citys[n].name + '</span></a>'));
                        citytd.append($('<a style="line-height:22px;margin-left:0px;margin-right:5px;" tag="' + citys[n].gid + '" dtype="city"><span>' + citys[n].name + '</span></a>'))
                    }
                    $("td,a", tr).css("color", "black");
                }
            }
            $("a", table).click(function () {
                var gid = $(this).attr("tag");
                var type = $(this).attr("dtype");
                positionbykey(gid, type, true);
                //  selectxzq.html($(this).text());
            });
            return table;
        }

        //加载市的内容
        function loadcitydata(citydata, iscity) {
            if (dev.IsNull(citydata)) return null;
            var table = $('<table style="width:230px;" cellpadding="0" cellspacing="0"></table>');
            citydata = Enumerable.From(citydata).OrderBy('s=>s.key').ToArray();
            var rows = Enumerable.From(citydata).GroupBy("s=>s.key").ToArray();
            for (var i = 0; i < rows.length; i++) {
                var tr = $('<tr><td style="width:20px;vertical-align: top;padding: 3px 7px 0px 14px;font-size:22px;font-weight:bold;color:#ccc;" tag="' + (rows[i].source[0].key) + '"><div>' + rows[i].source[0].key + '</div></td></tr>').appendTo(table);
                var subtd = $('<td style="189px;vertical-align: top;"></td>').appendTo(tr);
                for (var j = 0; j < rows[i].source.length; j++) {
                    subtd.append($('<a style="line-height:22px;margin-left:0px;margin-right:5px;" tag="' + rows[i].source[j].gid + '" dtype="' + (iscity ? "city" : "county") + '">' + rows[i].source[j].name + '</a>'));
                }
                $("td,a", tr).css("color", "black");
            }
            $('a', table).click(function (s, e) {
                var gid = $(this).attr("tag");
                var type = $(this).attr("dtype");
                positionbykey(gid, type, true);
            });
            return table;
        }

        //定位
        function positionbykey(key, type, isgid) {
            //获取图层
            if (dev.IsNull(key) || dev.IsNull(type)) return;
            var tempparent = Enumerable.From(dev.App.Config.Extend.LayerForTree.LayerRoot).Where('s=>s.Value=="XZQ"').FirstOrDefault();
            var xzqs = tempparent.Child;
            var needlayerinfo = Enumerable.From(xzqs).Where('s=>s.Value.toLowerCase()=="' + type + '"').FirstOrDefault();
            if (dev.IsNull(needlayerinfo)) return;
            var con = ""
            if (isgid) con = "\"gid\"='" + key + "'";
            else {
                if (type == "province") con = "NAME='" + key + "'";
                if (type == "city") con = "CITY='" + key + "'";
                if (type == "county") con = "COUNTY='" + key + "'";
            }
            var param = {
                ID: needlayerinfo.Value,
                Url: dev.GetSystemUrlByRelID(needlayerinfo.WFSUrl),
                TypeName: needlayerinfo.TypeName,
                CqlFilter: con
            };
            var query = new dev.SWFS_H();
            query.Target.bind("onQueryCompleted", function (s, e) {
                if (dev.IsNull(e.data) || e.data.length == 0) return;
                e.data[0].setStyle(new ol.style.Style({
                    stroke: new ol.style.Stroke({ width: 2, color: [45, 119, 230, 1], lineDash: [1, 2, 3, 4, 5, 6] }),
                    fill: new ol.style.Fill({ color: [45, 119, 230, 0] })
                }));
                dev.MapUtils.ClearAndAddFeatures(e.data, "tempTrackLayer");
                var extent = e.data[0].getGeometry().getExtent();
                if (type == "province") {
                    dev.App.Map.getView().setZoom(6);
                    selectxzq = e.data[0].getProperties().PROVINCE;
                }
                if (type == "city") {
                    dev.App.Map.getView().setZoom(7);
                    selectxzq = e.data[0].getProperties().CITY;
                }
                if (type == "county") {
                    dev.App.Map.getView().setZoom(8);
                    selectxzq = e.data[0].getProperties().COUNTY;
                }
                dev.App.Config.SystemMap.Position.Code = e.data[0].getProperties().ADCODE;
                dev.App.Config.SystemMap.Position.Type = type;
                $("#city-location").html(selectxzq);
                dev.App.Map.getView().centerOn([((extent[0] + extent[2]) / 2), ((extent[1] + extent[3]) / 2)], dev.App.Map.getSize(), [dev.App.Map.getSize()[0] / 2, dev.App.Map.getSize()[1] / 2]);
            });
            query.Query(param);
        }

        //关键字查询
        function getsearchkey(key, type) {
            if (dev.IsNull(key) || dev.IsNull(type)) return;
            var data;
            $.ajax({
                url: dev.MapLoad.GetUrlByRelID("Service") + "massif/search/" + type + "/" + key + "?" + new Date().getTime(),
                type: "GET",
                dataType: "json",
                async: false,
                success: function (result) {
                    data = result.data;
                }
            });
            return data;
        }
    }
    function getxzqquerydata(type) {
        //根据类型找到对应的图层
        var data;
        if (dev.IsNull(type)) return;
        $.ajax({
            url: dev.MapLoad.GetUrlByRelID("Service") + "massif/cascade/" + type + "?" + new Date().getTime(),
            type: "GET",
            contentType: 'application/json',
            dataType: "json",
            async: false,
            success: function (result) {
                data = result.data;
            }
        });
        return data;
    }
})(jQuery);

/*添加地图工具*/
; (function ($) {
    initmaptool = function (opt) {
        //放置工具箱
        var toolsDiv = $('<div id="tool" style="z-index:12"></div>');
        $(".headqury").append(toolsDiv);
        toolsDiv.mouseenter(function () {
            $("#toolsPanel").css("display", "block");
        }).mouseleave(function () {
            $("#toolsPanel").css("display", "none");
        });
        var toolsPanel = $('<div id="toolsPanel" class="mappanelsymbol" style="height:152px;display:none;top: 55px; left: 16px;border-top:0px;position:relative;z-index: 12"></div>').appendTo(toolsDiv);
        var pointquery = $('<div class="toolsymbol" style="top:0px;border-bottom:1px solid #999;border-top:1px solid #999;" tag="maptool-pointquery" title="点查询"><div class="Icon icon-maptool-pointquery"></div></div>').appendTo(toolsPanel);
        //var screenfull = $('<div class="toolsymbol" style="border-bottom:1px solid #999;top:32px;" tag="maptool-fullscreen" title="全屏"><div class="Icon icon-maptool-fullscreen"></div></div>').appendTo(toolsPanel);
        var fullmap = $('<div class="toolsymbol" style="border-bottom:1px solid #999;top:32px;" tag="maptool-fullmap" title="全图"><div class="Icon icon-maptool-fullmap"></div></div>').appendTo(toolsPanel);
        var measuredistance = $('<div class="toolsymbol" style="top:63px;border-bottom:1px solid #999;" tag="maptool-measuredistance" title="测距"><div class="Icon icon-maptool-measuredistance"></div></div>').appendTo(toolsPanel);
        var measurearea = $('<div class="toolsymbol" style="top:93px;border-bottom:1px solid #999;" tag="maptool-measurearea" title="测面积"><div class="Icon icon-maptool-measurearea"></div></div>').appendTo(toolsPanel);
        var clearmap = $('<div class="toolsymbol" style="top:123px;" tag="maptool-clearmap"  title="删除"><div class="Icon icon-maptool-clearmap"></div></div>').appendTo(toolsPanel);
        $(".toolsymbol").mouseenter(function () {
            var tag = $(this).attr("tag");
            $(".Icon", $(this)).removeClass("icon-" + tag);
            $(".Icon", $(this)).addClass("icon-" + tag + "1");
            //  $(this).css("background", "rgba(0,0,0,0.6)");
            $(this).css("background-color", "#fff");
        }).mouseleave(function () {
            var tag = $(this).attr("tag");
            $(".Icon", $(this)).removeClass("icon-" + tag + "1");
            $(".Icon", $(this)).addClass("icon-" + tag);
            $(this).css("background", "rgba(0,0,0,0.3)");
        }).click(function () {
            var tag = $(this).attr("tag");
            if (tag == "maptool-fullmap") {
                var configExtent = dev.App.Config.SystemMap.Extent;
                var initExtent = [parseFloat(configExtent.XMin), parseFloat(configExtent.YMin), parseFloat(configExtent.XMax), parseFloat(configExtent.YMax)];
                var mapproj = dev.App.Map.getView().getProjection();
                if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) initExtent = ol.proj.transformExtent(initExtent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
                dev.App.Map.getView().fit(initExtent, dev.App.Map.getSize());
                //dev.App.Map.getView().setRotation(dev.App.defaultAngle);
                if (!dev.IsNull(dev.App.Map3D)) dev.Map3DUtils.SetView([initExtent[0], initExtent[1]], [initExtent[2], initExtent[3]]);
            }
            if (tag == "maptool-measuredistance") {
                dev.measureState = true;
                dev.Clear();
                dev.MeasureClear();
                measuregeometry("LineString");
            }
            if (tag == "maptool-measurearea") {
                dev.measureState = true;
                dev.Clear();
                dev.MeasureClear();
                measuregeometry("Polygon");
            }
            if (tag == "maptool-clearmap") {
                dev.MapUtils.ClearFeature("tempMeasureLayer");
                dev.MeasureClear();
                dev.Clear();
                dev.measureState = false;
                dev.queryState = false;
            }
            if (tag == "maptool-pointquery") {
                dev.queryState = true;
                dev.App.MapPanel.MapDOM.css("cursor", "default");
                attrQuery();
            }
        });
    }

    var rightVisible, bottomVisible, leftVisible, topVisible;
    var drawControl = null;
    var measureControl = null;
    var measurelistener = null;
    var querytip;
    dev.measureState;
    var dragBox = null;
    //点查询
    var attrmapclick;
    function attrQuery() {
        //初始化
        //关闭编辑
        var layereditwin = dev.App.GetWindow("edittoolwin");
        if (!dev.IsNull(layereditwin)) layereditwin.Close();
        if (dev.IsNull(attrmapclick)) {
            attrmapclick = dev.App.Map.on("singleclick", function (e) {
                var mapproj = dev.App.Map.getView().getProjection();
                if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) e.coordinate = ol.proj.transform(e.coordinate, mapproj.getCode(), dev.App.Config.SystemMap.DataEPSG);
                var pointf = new ol.Feature(new ol.geom.Point(e.coordinate));
                var templayers = getcheckedlayer(dev.App.treedata);
                if (dev.IsNull(templayers) || templayers.length == 0) return;
                var querylayers = templayers.clone();
                queryPoint(querylayers, pointf);
            });
        }
    }
    function queryPoint(querylayers, feature) {
        //显示点选查询数据
        if (dev.IsNull(feature)) return;
        var wkt = dev.GetWKTByFeature(feature, true);
        var params = [];
        for (var i = 0; i < querylayers.length; i++) {
            var condition = dev.MapUtils.GetCql_INTERSECTS(wkt, querylayers[i].GeomField);
            params.push({
                ID: querylayers[i].Value,
                Url: dev.GetSystemUrlByRelID(querylayers[i].WFSUrl),
                TypeName: querylayers[i].TypeName,
                CqlFilter: condition
            });
        }
        //开始查询
        var querys = new SQuerys();
        querys.Target.bind("onQuerysCompleted", function (s, e) {
            ClearMapTip();
            if (dev.IsNull(e.data) || e.data.length == 0) return;
            var featrues = [];
            var params = [];
            for (var i = 0; i < e.data.length; i++) {
                var currlayer = Enumerable.From(querylayers).Where('s=>s.Value=="' + e.data[i].key + '"').FirstOrDefault();
                if (e.data[i].data.statusCode == 200 && e.data[i].data.data.length > 0) {
                    if (e.data[i].data.data.length == 1) featrues.push(e.data[i].data.data[0]);
                    else featrues.push(e.data[i].data.data);
                    params.push(currlayer);
                }
            }
            if (featrues.length == 0) return;
            if (featrues.length == 1) params = params[0];
            else {
                var tabtitle = [];
                for (var i = 0; i < params.length; i++) {
                    tabtitle.push(params[i].Text);
                }
                params = { TabTitle: tabtitle, LayerInfo: params }
            }
            params.IsShowFeature = true;
            //根据农户编号查询农户名称
            ShowMapTip(featrues, params, feature.getGeometry().getCoordinates());
        });
        querys.Query(params);
    };
    //获取专题图层勾选图层
    function getcheckedlayer(data, checklist) {
        if (dev.IsNull(checklist)) checklist = [];
        if (dev.IsNull(data) || data.length == 0) return checklist;
        for (var i = 0; i < data.length; i++) {
            if (dev.IsNull(data[i].Child) || data[i].Child.length == 0) {
                if (!dev.IsNull(data[i].Checked) && (data[i].Checked == true || data[i].Checked == "true")) checklist.push(data[i]);
            }
            else if (!dev.IsNull(data[i].Child) && data[i].Child.length > 0) checklist = getcheckedlayer(data[i].Child, checklist);
        }
        return checklist;
    }
    dev.attrQueryClear = function () {
        if (!dev.IsNull(attrmapclick)) {
            dev.App.Map.unByKey(attrmapclick);
            attrmapclick = null;
        }
        ClearMapTip();
    };
    //end
    function measuregeometry(measuretype) {
        if (!dev.IsNull(measureControl)) {
            measureControl.Destroy();
            measureControl = null;
        }
        measureControl = new SDraw({
            Map: dev.App.Map,
            Layer: dev.MapUtils.GetTempLayer("tempMeasureLayer"),
            State: "Measure"
        });
        measureControl.Target.unbind("onDrawCompleted");
        measureControl.Target.bind("onDrawCompleted", function (sender, o) {
            measureControl.Destroy();
            measureControl = null;
            //测量完成
            if (o.getGeometry() instanceof ol.geom.LineString) createMeasureTooltip("终点", o.getGeometry().getLastCoordinate(), [5, 25]);
            if (o.getGeometry() instanceof ol.geom.Polygon) createMeasureTooltip("总面积：" + formatArea(o.getGeometry()), o.getGeometry().getInteriorPoint().getCoordinates(), null, true);
            ol.Observable.unByKey(measurelistener);
            measurelistener = null;
            dev.measureState = false;
        });
        measureControl.Target.unbind("onDrawStart");
        measureControl.Target.bind("onDrawStart", function (sender, o) {
            var num = o.getGeometry().getCoordinates().length;
            measurelistener = o.getGeometry().on("change", function (evt) {
                var geom = evt.target;
                if (geom instanceof ol.geom.LineString) {
                    if (geom.getCoordinates().length > num) {
                        num = geom.getCoordinates().length;
                        var pointfeature = new ol.Feature({
                            id: "measure" + new Date().getTime(),
                            geometry: new ol.geom.Point(geom.getLastCoordinate())
                        });
                        dev.MapUtils.AddFeature(pointfeature, "tempMeasureLayer");
                        //获取距离
                        var distance = formatLength(geom);
                        createMeasureTooltip(distance, geom.getLastCoordinate());
                    }
                }
            });
            if (o.getGeometry() instanceof ol.geom.LineString) {
                var pointfeature = new ol.Feature({
                    id: "measure" + new Date().getTime(),
                    geometry: new ol.geom.Point(o.getGeometry().getLastCoordinate())
                });
                dev.MapUtils.AddFeature(pointfeature, "tempMeasureLayer");
                //添加一个标签
                createMeasureTooltip("起点", o.getGeometry().getLastCoordinate());
            }
        });
        var url = dev.App.Root + "image/ameasure_cursor.ico";
        if (measuretype == "LineString") url = dev.App.Root + "image/mdistanc_cursor.ico";
        dev.App.MapPanel.MapDOM.css("cursor", "url(" + url + "),auto");
        measureControl.Start(measuretype);
    };
    dev.MeasureClear = function () {
        dev.MapUtils.ClearFeature("tempMeasureLayer");
        var overlays = dev.App.Map.getOverlays();
        if (!dev.IsNull(overlays)) {
            var newovers = [];
            overlays.forEach(function (o, e) {
                newovers.push(o);
            });
            for (var i = 0; i < newovers.length; i++) dev.App.Map.removeOverlay(newovers[i]);
        }
    };
    dev.Clear = function () {
        //释放放大缩小状态
        if (dragBox != null) dragBox.setActive(false);
        if (drawControl != null) {
            drawControl.Stop();
            drawControl.Destroy();
            drawControl = null;
        }
        if (measureControl != null) {
            measureControl.Stop();
            measureControl.Destroy();
            measureControl = null;
        }
        dev.attrQueryClear();
        dev.MapUtils.ClearFeature("tempTrackLayer");
    };
    /*测量*/
    var formatLength = function (line) {
        var wgs84Sphere = new ol.Sphere(6378137);
        var length = 0;
        var coordinates = line.getCoordinates();
        var sourceProj = dev.App.Map.getView().getProjection();
        for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
            var c1 = ol.proj.transform(coordinates[i], sourceProj, 'EPSG:4326');
            var c2 = ol.proj.transform(coordinates[i + 1], sourceProj, 'EPSG:4326');
            length += wgs84Sphere.haversineDistance(c1, c2);
        }
        if (length < 100) return (Math.round(length * 100) / 100) + ' ' + '米';
        else return (Math.round(length / 1000 * 100) / 100) + ' ' + '公里';
    };
    var formatArea = function (polygon) {
        var wgs84Sphere = new ol.Sphere(6378137);
        var area;
        var sourceProj = dev.App.Map.getView().getProjection();
        var geom = (polygon.clone().transform(sourceProj, 'EPSG:4326'));
        /** @type {ol.geom.Polygon} */
        var coordinates = geom.getLinearRing(0).getCoordinates();
        area = Math.abs(wgs84Sphere.geodesicArea(coordinates));
        //area = polygon.getArea();
        var output;
        if (area > 10000) {
            output = (Math.round(area / 1000000 * 100) / 100) + ' ' + '平方公里';
        } else {
            output = (Math.round(area * 100) / 100) + ' ' + '平方米';
        }
        return output;
    };
    function createMeasureTooltip(text, position, offset, IsArea) {
        var tip = $('<div>' + text + '</div>');
        tip.css({
            "position": "relative",
            "background-color": "rgba(255, 255, 255,1 )",
            "border-radius": "4px",
            "color": "black",
            "padding": "1px 2px",
            "opacity": "0.7",
            "white-space": "nowrap",
            "border": "1px solid red",
            "font-size": (!dev.IsNull(IsArea) && IsArea) ? "20px" : "12px",
            "font-weight": (!dev.IsNull(IsArea) && IsArea) ? "bold" : "normal"
        });
        var measureTooltip = new ol.Overlay({
            id: "measuretip" + new Date().getTime(),
            element: tip[0],
            offset: dev.IsNull(offset) ? [25, -5] : offset,
            positioning: 'bottom-center'
        });
        dev.App.Map.addOverlay(measureTooltip);
        measureTooltip.setPosition(position);
    };
    function Zoom(type) {
        if (dragBox != null) dev.App.Map.removeInteraction(dragBox);
        dragBox = new ol.interaction.DragBox({ className: "ZoomDragBox" });
        dev.App.Map.addInteraction(dragBox);
        dragBox.on('boxend', function () {
            if (type == "IN") {
                var extent = dragBox.getGeometry().getExtent();
                var size = dev.App.Map.getSize();
                dev.App.Map.getView().fit(extent, size);
            }
            if (type == "OUT") {
                var zoom = dev.App.Map.getView().getZoom();
                var extent = dragBox.getGeometry().getExtent();
                var x = (extent[0] + extent[2]) / 2;
                var y = (extent[1] + extent[3]) / 2;
                dev.App.Map.getView().setCenter([x, y]);
                dev.App.Map.getView().setZoom(zoom - 1);
            }
        });
    };
    //查询多个图层
    SQuerys = function (opt) {
        this.Params = opt;
        this.Target = $({ id: "querys" + new Date().getTime() });
        this.Query = function (param) {
            if (!dev.IsNull(param)) this.Params = param;
            if (dev.IsNull(this.Params) || this.Params.length == 0) return;
            var $this = this, result = [], index = 0;
            var wfs = new dev.SWFS_H($this.Params[index]);
            wfs.Target.bind("onQueryCompleted", function (s, e) {
                var key = $this.Params[index].ID
                if (dev.IsNull(key)) key = $this.Params[index].TypeName
                result.push({ key: key, data: e });
                if (index === $this.Params.length - 1) {
                    wfs.Target.unbind("onQueryCompleted")
                    $this.Target.trigger("onQuerysCompleted", { data: result });
                }
                else { index++; wfs.Query($this.Params[index]); }
            });
            wfs.Query($this.Params[index]);
        };
    };
    //点选查询
    SPointerQuery = function (opt) {
        if (dev.measureState) return null;
        opt.Async = false;
        this.IsConvert = dev.IsBoolean(opt.IsConvert) ? opt.IsConvert : true;
        $.extend(this, new dev.SWFS_H(opt));
        var $this = this;
        var features;
        (function (point, map, px) {
            if (dev.IsNull(px)) px = 0;
            var ext = dev.MapUtils.GetExtentByMapClick(point, map, px);
            if (dev.IsNull(ext)) return;
            var mapproj = map.getView().getProjection();
            if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) ext.transform(mapproj.getCode(), dev.App.Config.SystemMap.DataEPSG);
            var condition = dev.IsNull(opt.CqlFilter) ? "" : "(" + opt.CqlFilter + ")" + " AND ";
            var wkt = dev.GetWKTByFeature(new ol.Feature(ext), $this.IsConvert);
            condition += dev.MapUtils.GetCql_INTERSECTS(wkt, opt.GeometryName);
            $this.Target.one("onQueryCompleted", function (s, e) {
                features = e.data;
            });
            $this.Query({ CqlFilter: condition });
        })(opt.Point, opt.Map, opt.PX);
        return features;
    };
})(jQuery);

/*添加专题图层*/
(function ($) {
    var layertreeInfo, tree_control, box;
    var editlayerinfo, mapclickkey, isedit;
    var modifyInteraction;//修改器
    var defualtchecklist = [];
    var tilelegend;
    function convertdata() {
        convertex(layertreeInfo);
    }

    function convertex(layerinfos) {
        if (dev.IsNull(layerinfos) || layerinfos.length == 0) return;
        for (var i = 0; i < layerinfos.length; i++) {
            layerinfos[i].Checked = (layerinfos[i].Checked == "true" || layerinfos[i].Checked == true);
            if (layerinfos[i].Checked) defualtchecklist.push(layerinfos[i]);
            if (!dev.IsNull(layerinfos[i].Child)) {
                if (dev.IsNull(layerinfos[i].Child.length)) layerinfos[i].Child = [layerinfos[i].Child];
            }
            if (!dev.IsNull(layerinfos[i].Child) && layerinfos[i].Child.length > 0) convertex(layerinfos[i].Child);
        }
    }

    function Refresh(nodes, isvisible) {
        for (var i = 0; i < nodes.length; i++) {
            //如果没有图例则隐藏图例
            //判断是否为图层
            var currlayer = dev.MapUtils.GetLayer(nodes[i][tree_control.ValueField], dev.App.Map);
            if (!dev.IsNull(currlayer)) {
                //是否有图例
                if (!dev.IsNull(nodes[i].SldLegend)) {
                    if (nodes[i].LayerType == dev.LayerType.Tile) {
                        dev.Legend.SetVisible(false);
                        tilelegend.SetVisible(isvisible);
                        tilelegend.SetData(nodes[i].SldLegend);
                    }
                    else {
                        tilelegend.SetVisible(false);
                        dev.Legend.SetCss({ "right": "40px", "bottom": "130px" });
                        dev.Legend.SetData(nodes[i].SldLegend);
                        dev.Legend.SetVisible(isvisible);
                    }
                }
                currlayer.setVisible(isvisible);
                dev.Map3DUtils.SetLayerVisibleByID(nodes[i][tree_control.ValueField], isvisible);
            }
            else {
                if (!isvisible) return;
                if (nodes[i].LayerType == dev.LayerType.Tile) {
                    var param = {
                        ID: nodes[i][tree_control.ValueField],
                        Url: dev.GetSystemUrlByRelID(nodes[i].Url),
                        Layers: nodes[i].TypeName,
                        Map: dev.App.Map,
                        Resolution: "0.703125",
                        Level: 20,
                        ZIndex: 900 + parseInt(nodes[i].Order)
                    };
                    if (!dev.IsNull(nodes[i].Envelop)) {
                        var arr = nodes[i].Envelop.split(',');
                        param.Extent = [parseFloat(arr[0]), parseFloat(arr[1]), parseFloat(arr[2]), parseFloat(arr[3])];
                    }
                    if (!dev.IsNull(nodes[i].SldLegend)) {
                        tilelegend.SetVisible(true);
                        tilelegend.SetData(nodes[i].SldLegend);
                    }
                    dev.MapLoad.AddWMTSLayer(param);
                    //添加三维WMTS图层
                    dev.Map3DUtils.AddTileWMSLayer(param);
                }
                else {
                    var param = {
                        ID: nodes[i][tree_control.ValueField],
                        Url: dev.GetSystemUrlByRelID(nodes[i].Url),
                        Layers: nodes[i].TypeName,
                        ServerType: "geoserver",
                        Map: dev.App.Map,
                        ZIndex: 900 + parseInt(nodes[i].Order)
                    }
                    if (!dev.IsNull(nodes[i].Sld)) {
                        var sldbody = dev.MapUtils.LoadSLD(dev.App.Root + nodes[i].Sld);
                        sldbody = sldbody.replace("%NAME%", nodes[i].TypeName);
                        param.Sldbody = sldbody;
                    }
                    if (!dev.IsNull(nodes[i].SldLegend)) {
                        if (dev.IsNull(nodes[i].SldLegend.length)) nodes[i].SldLegend = [nodes[i].SldLegend];
                        dev.Legend.SetCss({ "right": "40px", "bottom": "130px" });
                        dev.Legend.SetData(nodes[i].SldLegend);
                        dev.Legend.SetVisible(true);
                        param.Sldbody = dev.MapLoad.GetSLDString(nodes[i].TypeName, dev.LegendToRule(nodes[i].SldLegend, nodes[i].GeomType))
                    }
                    dev.MapLoad.AddWMSLayer(param);
                    //添加三维图层
                    dev.Map3DUtils.AddWMSLayer(param);
                }
            }
        }
    }

    function updataLayerIndex(target, isup) {
        var checklayers = getcheckedlayer(layertreeInfo);
        if (!dev.IsNull(checklayers) && checklayers.length > 0) {
            for (var i = 0; i < checklayers.length; i++) {
                var currlayer = dev.MapUtils.GetLayer(checklayers[i].Value, dev.App.Map);
                if (!dev.IsNull(currlayer)) currlayer.setZIndex(900 + parseInt(checklayers[i].Order));
            }
        }
        var updatelayer = dev.MapUtils.GetLayer(target.$this.Value, dev.App.Map);
        if (!dev.IsNull(updatelayer)) {
            if (isup) updatelayer.setZIndex(1000 + parseInt(target.$this.Order));
            else updatelayer.setZIndex(800 + parseInt(target.$this.Order));
        }
    }

    function getcheckedlayer(data, checklist) {
        if (dev.IsNull(checklist)) checklist = [];
        if (dev.IsNull(data) || data.length == 0) return checklist;
        for (var i = 0; i < data.length; i++) {
            if (dev.IsNull(data[i].Child) || data[i].Child.length == 0) {
                if (!dev.IsNull(data[i].Checked) && (data[i].Checked == true || data[i].Checked == "true")) checklist.push(data[i]);
            }
            else if (!dev.IsNull(data[i].Child) && data[i].Child.length > 0) checklist = getcheckedlayer(data[i].Child, checklist);
        }
        return checklist;
    }

    function updataconfigCheck(target, checked, isparent) {
        var data = [];
        if (isparent) {
            var tempchilds = tree_control.GetAllChildren(target);
            for (var i = 0; i < tempchilds.length; i++) data.push(tempchilds[i].$this);
        }
        else data = [target.$this];
        if (dev.IsNull(data) || data.length == 0) return;
        for (var i = 0; i < data.length; i++) {
            updatecheck(data[i], checked);
        }
    }

    function updatecheck(data, ischeck) {
        if (dev.IsNull(data)) return;
        var currlayer = getclayerbyid(data.ID);
        if (dev.IsNull(currlayer)) return;
        currlayer.Checked = ischeck;
    }

    function getclayerbyid(id, layers, c_layer) {
        if (dev.IsNull(id)) return null;
        if (dev.IsNull(layers)) layers = layertreeInfo;
        var c = Enumerable.From(layers).Where('s=>s.ID=="' + id + '"').FirstOrDefault();
        if (!dev.IsNull(c)) c_layer = c;
        else {
            for (var i = 0; i < layers.length; i++) {
                if (!dev.IsNull(layers[i].Child) && layers[i].Child.length > 0) c_layer = getclayerbyid(id, layers[i].Child, c_layer);
            }
        }
        return c_layer;
    }

    initshowLayer = function (layer) {
        if (dev.IsNull(dev.Legend)) dev.InitLegend();
        tilelegend = new UCTileLegend(dev, { Right: 10, Bottom: 50 });
        dev.App.MapPanel.MapDOM.append(tilelegend.Target);
        tilelegend.Layout();
        tilelegend.SetVisible(false);
        if (dev.IsNull(layer)) {
            var treeconfig = dev.App.Config.Extend.LayerForTree;
            var temp = dev.ObjClone(treeconfig);
            if (!dev.IsNull(temp.LayerRoot) && dev.IsNull(temp.LayerRoot.length)) temp.LayerRoot = [temp.LayerRoot];
            layertreeInfo = temp.LayerRoot.clone();
            //后去过滤数据
            layertreeInfo = SGetTreeLayers(STreeLayerType.Tipoc);
        }
        else layertreeInfo = layer;
        defualtchecklist = [];
        convertdata();
        var parent = $('.Content', $('#topicPanel', dev.App.MapPanel.MapDOM));
        // parent.css("display", "block");
        box = new dev.Box({
            HasBorder: false, Width: 376, Height: 373,
            Parent: parent
        });
        tree_control = new dev.Tree({
            CheckBox: true,
            ValueField: "Value",
            TextField: "Text",
            ChildrenField: "Child",
            CheckedField: "Checked",
            Data: layertreeInfo,
            StateField: "State"
        });
        tree_control.Target.css("overflow", "hidden");
        box.SetContent(tree_control.Target[0]);
        // parent.css("display", "none");
        tree_control.bind("onChecked", function (e, o) {
            var data = o.node[0].$this;
            var ischeck = o.checked;
            var isparent = false;
            if (dev.IsNull(data[tree_control.ChildrenField]) || data[tree_control.ChildrenField].length == 0) {
                if (data.LayerType == "3D") {
                    //先移除改图层
                    dev.Map3DUtils.Remove3DTileLayer(data.Value);
                    if (ischeck) {
                        var tempdata = dev.ObjClone(data);
                        tempdata.Url = dev.GetSystemUrlByRelID(tempdata.Url);
                        dev.Map3DUtils.Add3DTileLayer(tempdata);
                    }
                    return;
                }
                Refresh([data], ischeck);
            }
            else {
                //获取所有地块
                var childnodes = tree_control.GetAllChildren(o.node);
                var needlayer = [];
                for (var i = 0; i < childnodes.length; i++) {
                    if (childnodes[i].$this.IsLayer == "true") {
                        if (childnodes[i].$this.LayerType == "3D") {
                            dev.Map3DUtils.Remove3DTileLayer(childnodes[i].$this.Value);
                            if (ischeck) {
                                var tempdata = dev.ObjClone(childnodes[i].$this);
                                tempdata.Url = dev.GetSystemUrlByRelID(tempdata.Url);
                                dev.Map3DUtils.Add3DTileLayer(tempdata);
                            }
                        }
                        else needlayer.push(childnodes[i].$this);
                    }
                }
                if (dev.IsNull(needlayer) || needlayer.length == 0) return;
                Refresh(needlayer, ischeck);
                isparent = true;
            }
            updataconfigCheck(o.node[0], ischeck, isparent);
        });
        tree_control.bind("onSelectChanged", function (e, o) {
            ////清除添加的
            var data = o.$this;
            $(".opacityDiv", tree_control.Target).remove();
            $(".btnsDiv", tree_control.Target).remove();
            //判断是子节点还是父节点
            if (!dev.IsNull(data[tree_control.ChildrenField]) && data[tree_control.ChildrenField].length > 0) return;
            else {
                if (!data[tree_control.CheckedField]) return;
                if (!dev.IsNull(data.SldLegend)) {
                    //判断是否为瓦片
                    if (data.LayerType == dev.LayerType.Tile) {
                        dev.Legend.SetVisible(false);
                        tilelegend.SetVisible(true);
                        tilelegend.SetData(data.SldLegend);
                    }
                    else {
                        tilelegend.SetVisible(false);
                        dev.Legend.SetVisible(true);
                        dev.Legend.SetData(data.SldLegend);
                    }
                }
                $(o).css("position", "relative");
                var slideDiv = $('<div class="opacityDiv" style="width:105px;height:25px;position:absolute;right:80px;top:' + o.offsetTop + 'px;"></div>');
                $($(o).parent()).append(slideDiv);
                var slider = $('<input style="height:25px;width:100px;background-color:red;" tag="' + data[tree_control.ValueField] + '"/>').appendTo(slideDiv);
                var currL = dev.MapUtils.GetLayer(data[tree_control.ValueField], dev.App.Map);
                var opacity = dev.IsNull(currL) ? 1 : currL.getOpacity();
                slider.slider({
                    showTip: true,
                    value: parseInt(opacity * 100),
                    onChange: function (value, oldvalue) {
                        //获取当前图层
                        var layerid = slider.attr("tag");
                        var currlayer = dev.MapUtils.GetLayer(layerid, dev.App.Map);
                        if (!dev.IsNull(currlayer)) currlayer.setOpacity(value / 100);
                        dev.Map3DUtils.SetLayerAlphaByID(layerid, (value / 100));
                    }
                });
                var buttonsDiv = $('<div class="btnsDiv" style="width:70px;height:25px;position:absolute;right:0px;top:' + o.offsetTop + 'px;"></div>');
                $($(o).parent()).append(buttonsDiv);
                var locationbtn = $('<div class="icon-location" style="width:16px;height:16px;margin-top:4px;display:inline-block;" title="定位"></div>').appendTo(buttonsDiv);
                locationbtn.prop("target", o);
                locationbtn.click(function () {
                    var currtarget = $(this).prop("target");
                    locationbyselect(currtarget.$this);
                });
                var upbtn = $('<div class="icon-layerup" style="width:16px;height:16px;margin-top:4px;display:inline-block;" title="置顶"></div>').appendTo(buttonsDiv);
                upbtn.prop("target", o);
                upbtn.click(function () {
                    var currtarget = $(this).prop("target");
                    updataLayerIndex(currtarget, true);
                });
                var downbtn = $('<div class="icon-layerdown" style="width:16px;height:16px;margin-top:4px;display:inline-block;margin-left:3px;" title="置底"></div>').appendTo(buttonsDiv);
                downbtn.prop("target", o);
                downbtn.click(function () {
                    var currtarget = $(this).prop("target");
                    updataLayerIndex(currtarget, false);
                });
                //判断是否可以编辑
                if (!dev.IsNull(edittoolwin)) {
                    selectlayerinfo = data;
                    edittoolwin.Close();
                }
                if (o.$this.IsEdit == "true") {
                    var editbtn = $('<div class="machine-trackedit" style="width:16px;height:16px;margin-top:4px;display:inline-block;margin-left:3px;" title="编辑"></div>').appendTo(buttonsDiv);
                    editbtn.prop("target", o);
                    editbtn.click(function () {
                        //屏蔽点选查询
                        dev.attrQueryClear();
                        var currtarget = $(this).prop("target");
                        var c_layerinfo = currtarget.$this;
                        selectlayerinfo = c_layerinfo;
                        if (editbtn.hasClass("machine-trackedit")) {
                            editbtn.removeClass("machine-trackedit").addClass("icon-tip-close");
                            editbtn.attr("title", "取消");
                            showeidtTool();
                            edittoolwin.Target.prop("toglelement", editbtn);
                        }
                        else if (editbtn.hasClass("icon-tip-close")) {
                            editbtn.addClass("machine-trackedit").removeClass("icon-tip-close");
                            editbtn.attr("title", "编辑");
                            if (!dev.IsNull(edittoolwin)) {
                                edittoolwin.Close();
                                edittoolwin.Destroy();
                                edittoolwin = null;
                            }
                        }
                    });
                }
            }
        });
        tree_control.bind("onDblClick", function (e, o) {
            //判断是否为根节点
            var data = o.$this;
            if (!dev.IsNull(data[tree_control.ChildrenField]) && data[tree_control.ChildrenField].length > 0) return;
            if (o.$this.Checked) {
                var envelop = o.$this.Envelop;
                if (dev.IsNull(envelop)) return;
                var envelarry = envelop.split(',');
                if (envelarry.length < 4 || isNaN(envelarry[0]) || isNaN(envelarry[1]) || isNaN(envelarry[2]) || isNaN(envelarry[3])) return;
                dev.App.Map.getView().centerOn([((parseFloat(envelarry[0]) + parseFloat(envelarry[2])) / 2), ((parseFloat(envelarry[1]) + parseFloat(envelarry[3])) / 2)], dev.App.Map.getSize(), [dev.App.Map.getSize()[0] / 2, dev.App.Map.getSize()[1] / 2]);
                if (!dev.IsNull(o.$this.Zoom) && parseFloat(o.$this.Zoom) > 0) dev.App.Map.getView().setZoom(parseFloat(o.$this.Zoom));
                dev.Map3DUtils.SetView([parseFloat(envelarry[0]), parseFloat(envelarry[1])], [parseFloat(envelarry[2]), parseFloat(envelarry[3])]);
                if (dev.IsNull(o.$this.CountyCode)) return;
                //查询数据
                var currdata = QuerySXZQ(o.$this.CountyCode, "county");
                if (dev.IsNull(currdata) || dev.IsNull(currdata.cdata) || currdata.cdata.length == 0) return;
                $(".selecttext", $(".xzqposition", dev.App.MapPanel.MapDOM)).html(currdata.cdata[0].getProperties()[currdata.xzqtype.toUpperCase()]);
                $(".selecttext", $(".xzqposition", dev.App.MapPanel.MapDOM)).attr("tag", currdata.cdata[0].getProperties().ADCODE);
            }
        });
        tree_control.bind("onExpanded", function (e, o) {
            box.Layout();
        });
        tree_control.bind("onCollapsed", function (e, o) {
            box.Layout();
        });
        //初始化默认Check图层
        //获取所有选中check的zi图层
        if (defualtchecklist.length > 0) Refresh(defualtchecklist, true);
    };
    function locationbyselect(selectnode) {
        var envelop = selectnode.Envelop;
        if (dev.IsNull(envelop)) return;
        var envelarry = envelop.split(',');
        if (envelarry.length < 4 || isNaN(envelarry[0]) || isNaN(envelarry[1]) || isNaN(envelarry[2]) || isNaN(envelarry[3])) return;
        var initExtent = [parseFloat(envelarry[0]), parseFloat(envelarry[1]), parseFloat(envelarry[2]), parseFloat(envelarry[3])];
        var mapproj = dev.App.Map.getView().getProjection();
        if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
            initExtent = ol.proj.transformExtent(initExtent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
        }
        dev.App.Map.getView().fit(initExtent, dev.App.Map.getSize());
        dev.Map3DUtils.SetView([parseFloat(envelarry[0]), parseFloat(envelarry[1])], [parseFloat(envelarry[2]), parseFloat(envelarry[3])]);
        if (dev.IsNull(selectnode.CountyCode)) return;
        var currdata = QuerySXZQ(selectnode.CountyCode, "county");
        if (dev.IsNull(currdata) || dev.IsNull(currdata.cdata) || currdata.cdata.length == 0) return;
        $(".selecttext", $(".xzqposition", dev.App.MapPanel.MapDOM)).html(currdata.cdata[0].getProperties()[currdata.xzqtype.toUpperCase()]);
        $(".selecttext", $(".xzqposition", dev.App.MapPanel.MapDOM)).attr("tag", currdata.cdata[0].getProperties().ADCODE);
    }
    var edittoolwin, editwin;
    var layer_draw;
    var isedit, isupdate = false, editfeature;
    var modifyInteraction, selectInteraction, templayer;
    var dialog;
    var selectlayerinfo;
    var farmcontrol, farmeindex = 1, farmesize = 5;
    var isadd = false, addfeature;
    var mapsinlgclick;

    function showeidtTool() {//参数、图层信息
        if (dev.IsNull(selectlayerinfo)) return;
        setlayerposition(selectlayerinfo);
        if (dev.IsNull(edittoolwin)) {
            edittoolwin = new dev.Window({
                ID: "edittoolwin",
                IconCls: 'machine-type',
                Title: "编辑工具",
                Parent: dev.App.CoverBox,
                Maximizable: false,
                Modal: false,
                Draggable: true,
                HAlign: 'center',
                VAlign: 'absolute',
                Resizable: false,
                Height: 70,
                Width: 297,
                Top: 125
            });
            edittoolwin.bind("onClosing", function () {
                //清除绑定
                var editbtn = edittoolwin.Target.prop("toglelement");
                editbtn.addClass("machine-trackedit").removeClass("icon-tip-close");
                editbtn.attr("title", "编辑");
                if (!dev.IsNull(editwin)) editwin.Close();
                clearoparate(selectlayerinfo);
                isedit = false;
                isupdate = false;
                selectlayerinfo = null;
                editfeature = null;
                addfeature = null;
                $("div[tag='delete']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
                $("div[tag='attriupdate']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
                $("div[tag='save']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
                $("div[tag='cancel']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
            });
            //添加内容
            var content = $('<div class="dev-layeredit"></div>');
            //添加按钮
            var addbtn = $('<div class="ebtn Button icon-featureadd" title="新增" tag="add"></div>').appendTo(content);
            var selectbtn = $('<div class="ebtn Button icon-featureselect" title="选择" tag="select"></div>').appendTo(content);
            var updatebtn = $('<div class="ebtn DisableButton icon-featureupdate" title="属性修改" tag="attriupdate"></div>').appendTo(content);
            var deletebtn = $('<div class="ebtn DisableButton icon-maptool-clearmap" title="删除" tag="delete"></div>').appendTo(content);
            var savebtn = $('<div class="ebtn DisableButton icon-featuresave" title="保存" tag="save"></div>').appendTo(content);
            var canclebtn = $('<div class="ebtn DisableButton icon-featurecancel" title="取消" tag="cancel"></div>').appendTo(content);
            edittoolwin.SetContent(content);
            $('.ebtn', edittoolwin.Target).click(function () {
                if ($(this).hasClass("DisableButton")) return;
                var tag = $(this).attr("tag");
                if (tag == "add") {
                    isupdate = false;
                    clear_oparate();
                    editfeature = null;
                    if (!dev.IsNull(addfeature)) dev.MapUtils.RemoveFeature(addfeature, "tempDrawLayer", dev.App.Map);
                    if (!dev.IsNull(layer_draw)) {
                        layer_draw.Target.unbind("onDrawCompleted");
                        layer_draw.Destroy();
                        layer_draw = null;
                    }
                    else {
                        layer_draw = new SDraw({
                            Map: dev.App.Map,
                            Layer: dev.MapUtils.GetTempLayer("tempDrawLayer"),
                            State: "addElement"
                        });
                        layer_draw.Target.bind("onDrawCompleted", function (sender, o) {
                            //判断是否在对应的县
                            layer_draw.Destroy();
                            layer_draw = null;
                            var points = o.getGeometry().getCoordinates();
                            var newfeature = new dev.Feature(new dev.geom.MultiPolygon([points]));
                            var mapproj = dev.App.Map.getView().getProjection();
                            if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
                                newfeature = dev.MapUtils.TransformFeatureCRS(newfeature, mapproj.getCode(), dev.App.Config.SystemMap.DataEPSG);
                            }
                            var iscontain = IsContainCounty(selectlayerinfo.CountyCode, newfeature);
                            if (!iscontain) {
                                if (dev.IsNull(dialog)) dialog = new dev.Messager({ AutoShow: false });
                                dialog.Alert("请在该图层所在行政区划县绘制图形！", "info", function () {
                                    dev.MapUtils.ClearFeature("tempDrawLayer");
                                });
                            }
                            else {
                                //获取所在乡镇
                                var towns = getTownbyFeature(o);
                                if (dev.IsNull(towns) || towns.length == 0) return;
                                addfeature = o;
                                if (towns.length == 1) {
                                    //显示对应的行政区信息
                                    var info = {};
                                    if (!dev.IsNull(towns[0].getProperties().PROVINCE)) info.PROVINCE = towns[0].getProperties().PROVINCE;
                                    if (!dev.IsNull(towns[0].getProperties().CITY)) info.CITY = towns[0].getProperties().CITY;
                                    if (!dev.IsNull(towns[0].getProperties().COUNTY)) info.COUNTY = towns[0].getProperties().COUNTY;
                                    if (!dev.IsNull(towns[0].getProperties().TOWN)) info.TOWN = towns[0].getProperties().TOWN;
                                    if (!dev.IsNull(towns[0].getProperties().VILLAGE)) info.VILLAGE = towns[0].getProperties().VILLAGE;
                                    if (!dev.IsNull(towns[0].getProperties().ADCODE)) info.REGIONSID = towns[0].getProperties().ADCODE;
                                    info.ID = Guid.NewGuid().ToString("N");
                                    addfeature.setProperties(info);
                                }
                                else {
                                    //大于1进行选择行政区区划
                                    var towndatas = [];
                                    for (var n = 0; n < towns.length; n++) towndatas.push(towns[n].getProperties());
                                    //弹出框
                                    var modal = $('<div style="position:absolute; width:' + dev.App.FillPanel.Target.width() + 'px;height:' + dev.App.FillPanel.Target.height() + 'px;background:rgba(255,255,255,0.5);z-index:10;"></div>');
                                    dev.App.FillPanel.Target.append(modal);
                                    var contentleft = parseInt(dev.App.FillPanel.Target.width() / 2) - 147;
                                    var contenttop = parseInt(dev.App.FillPanel.Target.height() / 2) - 76;
                                    var content = $('<div style="height:112px;width:295px;position:absolute;left:' + contentleft + 'px;top:' + contenttop + 'px;z-index:11;border:1px solid #0099cc;"></div>').appendTo(dev.App.FillPanel.Target);
                                    var contenttitle = $('<div style="height:30px;width:295px;background-color:#0099cc;"><div style="width:200px;height:30px;line-height:30px;display:inline-block;float:left;margin-left:15px;color:#fcfcfc;">所属乡镇</div></div>').appendTo(content);
                                    var contentnr = $('<div style="height:82px;width:295px;background-color:#fcfcfc;"></div>').appendTo(content);
                                    var townrow = $('<div style="width:295px;height:35px;border-bottom:1px dashed #ddd;"></div>').appendTo(contentnr);
                                    var towntitle = $('<div style="width:75px;height:35px;line-height:35px;padding-right:5px;display:inline-block;text-align:right;float:left;">乡镇</div>').appendTo(townrow);
                                    var towndiv = $('<div style="width:215px;height:35px;display:inline-block;"></div>').appendTo(townrow);
                                    var towncombo = new dev.Combobox({
                                        ID: "towncombo",
                                        TextField: "TOWN",
                                        ValueField: "ADCODE",
                                        Data: towndatas,
                                        Width: 195,
                                        Height: 24,
                                        PopupHeight: 60,
                                        CSS: { "margin-top": "5px" }
                                    });
                                    towndiv.append(towncombo.Target);
                                    towncombo.SetValue(towndatas[0].ADCODE);
                                    var btnrow = $('<div style="height:45px;width:295px;"></div>').appendTo(contentnr);
                                    var btn = $('<div style="height:26px;width:70px;text-align:center;color:#fff;background-color:#0099cc;line-height:26px;margin-left:112px;margin-top:10px;">确&nbsp;定</div>').appendTo(btnrow);
                                    btn.click(function () {
                                        var selecttown = towncombo.GetSelectedItem();
                                        if (dev.IsNull(selecttown) || selecttown.length == 0) return;
                                        var info = {};
                                        if (!dev.IsNull(selecttown[0].PROVINCE)) info.PROVINCE = selecttown[0].PROVINCE;
                                        if (!dev.IsNull(selecttown[0].CITY)) info.CITY = selecttown[0].CITY;
                                        if (!dev.IsNull(selecttown[0].COUNTY)) info.COUNTY = selecttown[0].COUNTY;
                                        if (!dev.IsNull(selecttown[0].TOWN)) info.TOWN = selecttown[0].TOWN;
                                        if (!dev.IsNull(selecttown[0].VILLAGE)) info.VILLAGE = selecttown[0].VILLAGE;
                                        if (!dev.IsNull(selecttown[0].ADCODE)) info.REGIONSID = selecttown[0].ADCODE;
                                        info.ID = Guid.NewGuid().ToString("N");
                                        addfeature.setProperties(info);
                                        modal.remove();
                                        content.remove();
                                    });
                                }
                                $("div[tag='attriupdate']", edittoolwin.Target).removeClass("DisableButton").addClass("Button");
                                $("div[tag='save']", edittoolwin.Target).removeClass("DisableButton").addClass("Button");
                                $("div[tag='cancel']", edittoolwin.Target).removeClass("DisableButton").addClass("Button");
                            }
                        });
                        layer_draw.Start("Polygon");
                    }
                }
                if (tag == "select") {
                    //初始化地图点击事件
                    clear_oparate();
                    addfeature = null;
                    isupdate = true;
                    if (dev.IsNull(mapsinlgclick)) {
                        mapclickkey = dev.App.Map.on("singleclick", function (e) {
                            if (!isupdate) return;
                            var result = SPointerQuery({
                                Point: e.coordinate,
                                Map: dev.App.Map,
                                PX: 2,
                                GeometryName: selectlayerinfo.GeomField,
                                Url: dev.GetSystemUrlByRelID(selectlayerinfo.WFSUrl),
                                TypeName: selectlayerinfo.TypeName
                            });
                            if (dev.IsNull(result) || result.length == 0) return;
                            var temp = result[0].clone();
                            var geometry = temp.getGeometry();
                            var mapproj = dev.App.Map.getView().getProjection();
                            if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
                                geometry = geometry.transform(dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
                            }
                            var queryfeature = new ol.Feature(new ol.geom.Polygon(temp.getGeometry().getCoordinates()));
                            queryfeature.setProperties(temp.getProperties());
                            var selectSource = new ol.Collection();
                            selectSource.push(queryfeature);
                            loadVectorLayer(selectlayerinfo, selectSource);
                            //初始化modify
                            if (!dev.IsNull(modifyInteraction)) {
                                dev.App.Map.removeInteraction(modifyInteraction);
                                modifyInteraction = null;
                            }
                            modifyInteraction = new ol.interaction.Modify({
                                features: templayer.getSource().getFeaturesCollection()
                            });
                            dev.App.Map.addInteraction(modifyInteraction);
                            $("div[tag='delete']", edittoolwin.Target).removeClass("DisableButton").addClass("Button");
                            $("div[tag='attriupdate']", edittoolwin.Target).removeClass("DisableButton").addClass("Button");
                            $("div[tag='save']", edittoolwin.Target).removeClass("DisableButton").addClass("Button");
                            $("div[tag='cancel']", edittoolwin.Target).removeClass("DisableButton").addClass("Button");
                            editfeature = templayer.getSource().getFeatures()[0];
                        });
                    }
                }
                if (tag == "attriupdate") {
                    //弹出窗体
                    var feature;
                    if (!dev.IsNull(addfeature)) feature = addfeature;
                    if (!dev.IsNull(editfeature)) feature = editfeature;
                    if (dev.IsNull(feature)) return;
                    //添加要素
                    if (!dev.IsNull(addfeature)) {
                        var xzqcode = addfeature.getProperties().REGIONSID;
                        var blockid = getblockidByadcode(xzqcode);
                        if (dev.IsNull(blockid)) return;
                        feature.set("MASSIFID", blockid);
                    }
                    initeditWin(feature, selectlayerinfo);
                }
                if (tag == "delete") {
                    isupdate = false;
                    if (dev.IsNull(editfeature)) return;
                    if (dev.IsNull(dialog)) dialog = new dev.Messager({ AutoShow: false });
                    dialog.Confirm('确定删除所选要素吗？', function (r) {
                        if (!r) {
                            clearoparate(selectlayerinfo);
                            return;
                        }
                        var deletefeture = editfeature;
                        deletefeture.setId(deletefeture.getProperties().gid);
                        var featuretype = selectlayerinfo.TypeName.substr(selectlayerinfo.TypeName.indexOf(':') + 1);
                        var formatwfs = new ol.format.WFS();
                        var node = formatwfs.writeTransaction(null, null, [deletefeture], {
                            featureType: featuretype,
                            featureNS: dev.GetSystemUrlByBasicID("FeatureNS"),
                            srsName: 'EPSG:4326'
                        });
                        var xmls = new XMLSerializer();
                        var str = xmls.serializeToString(node);
                        str = str.replace("geometry", selectlayerinfo.GeomField);
                        $.ajax({
                            type: "POST",
                            url: dev.GetSystemUrlByRelID(selectlayerinfo.WFSUrl) + "?service=wfs",
                            dataType: 'xml',
                            processData: false,
                            contentType: 'text/xml',
                            data: str,
                            success: function (s, e) {
                                if (!dev.IsNull(editwin)) editwin.Close();
                                clearoparate(selectlayerinfo);
                                editfeature = null;
                                addfeature = null;
                                isupdate = false;
                                $("div[tag='delete']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
                                $('div[tag="select"]', edittoolwin.Target).removeClass("DisableButton").addClass("Button");
                                $("div[tag='attriupdate']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
                                $("div[tag='save']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
                                $("div[tag='cancel']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
                            }
                        });
                    }, "question");
                }
                if (tag == "save") {
                    if (dev.IsNull(addfeature) && dev.IsNull(editfeature)) return;
                    var featuretype = selectlayerinfo.TypeName.substr(selectlayerinfo.TypeName.indexOf(':') + 1);
                    var wfsxml;
                    if (!isupdate) {
                        addfeature.set("CDATE", dev.GetNowDateString());
                        var points = addfeature.getGeometry().getCoordinates();
                        //判断是否有地块编号
                        if (dev.IsNull(addfeature.getProperties().MASSIFID)) {
                            var massifid = getblockidByadcode(addfeature.getProperties().REGIONSID);
                            addfeature.set("MASSIFID", massifid);
                        }
                        var newfeature = new ol.Feature(new ol.geom.MultiPolygon([points]));
                        var mapproj = dev.App.Map.getView().getProjection();
                        if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
                            newfeature = dev.MapUtils.TransformFeatureCRS(newfeature, mapproj.getCode(), dev.App.Config.SystemMap.DataEPSG);
                        }
                        var tempp = {};
                        $.each(addfeature.getProperties(), function (s, e) {
                            if (s != "geometry") tempp[s] = e;
                        });
                        newfeature.setProperties(tempp);
                        newfeature.set("CDATE", dev.GetNowDateString());
                        //   newfeature.setProperties(addfeature.getProperties());
                        if (!dev.IsNull(editwin)) {
                            //保存原有属性
                            var newvalue = getInfo();
                            var oldpropeties = addfeature.getProperties();
                            var temp = {}
                            $.each(oldpropeties, function (s, e) { if (s != "geometry") temp[s] = e; });
                            $.each(newvalue, function (s, e) {
                                temp[s] = e;
                            });
                            newfeature.setProperties(temp);
                        }
                        wfsxml = SgetWFSInsetXml(newfeature, {
                            featureNS: dev.GetSystemUrlByBasicID("FeatureNS"),
                            featureType: featuretype,
                            GeomField: selectlayerinfo.GeomField
                        });
                    }
                    if (isupdate) {
                        editfeature.set("UDATE", dev.GetNowDateString());
                        var cdate = new Date(editfeature.get("UDATE").replace(/-/g, "/")).getTime();
                        editfeature.set("UDATE", dev.GetDateString(new Date(cdate + (24 * 3600 * 1000))));
                        var newf = editfeature.clone();
                        newf.setId(newf.getProperties().gid);
                        if (!dev.IsNull(editwin)) newf.setProperties(getInfo());
                        if (dev.IsNull(newf.getProperties().ID)) newf.set("ID", Guid.NewGuid().ToString("N"));
                        var formatwfs = new ol.format.WFS();
                        var newfeature = transformCoor(newf);
                        var nfp = dev.ObjClone(newfeature.getProperties());
                        delete nfp.boundedBy;
                        delete nfp.bbox;
                        var clone = new ol.Feature(nfp);
                        clone.setId(newfeature.getId());
                        var formatwfs = new ol.format.WFS();
                        var node = formatwfs.writeTransaction(null, [clone], null, {
                            featureType: featuretype,
                            featureNS: dev.GetSystemUrlByBasicID("FeatureNS")
                        });
                        var s = new XMLSerializer();
                        var str = s.serializeToString(node);
                        wfsxml = str.replace("geometry", selectlayerinfo.GeomField);
                    }
                    $.ajax({
                        type: "POST",
                        url: dev.GetSystemUrlByRelID(selectlayerinfo.WFSUrl) + "?service=wfs",
                        dataType: 'xml',
                        processData: false,
                        contentType: 'text/xml',
                        data: wfsxml,
                        success: function (s, e) {
                            if (!dev.IsNull(editwin)) editwin.Close();
                            clearoparate(selectlayerinfo);
                            editfeature = null;
                            addfeature = null;
                            isupdate = false;
                            $("div[tag='delete']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
                            $("div[tag='attriupdate']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
                            $("div[tag='save']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
                            $("div[tag='cancel']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
                        }
                    });
                }
                if (tag == "cancel") {
                    isupdate = false;
                    if (!dev.IsNull(editwin)) editwin.Close();
                    clearoparate(selectlayerinfo);
                    $("div[tag='delete']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
                    $('div[tag="select"]', edittoolwin.Target).removeClass("DisableButton").addClass("Button");
                    $("div[tag='attriupdate']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
                    $("div[tag='save']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
                    $("div[tag='cancel']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
                }
            });
        }
        else edittoolwin.Open();
        isedit = true;
    }

    //获取地块编号
    function getblockidByadcode(adcode) {
        if (dev.IsNull(adcode)) return;
        var blockid;
        $.ajax({
            url: dev.GetSystemUrlByRelID("Service") + "massif/getnextid/" + adcode,
            type: "GET",
            contentType: 'application/json',
            dataType: 'json',
            async: false,
            success: function (result) {
                blockid = result.data
            }
        });
        return blockid;
    }

    //判断图形是否包含在某县内
    function IsContainCounty(countycode, feature) {
        if (dev.IsNull(countycode) || dev.IsNull(feature)) return false;
        var layerconfigs = dev.App.Config.Extend.LayerForTree.LayerRoot;
        var templayer;
        if (dev.IsNull(layerconfigs)) return false;
        if (dev.IsNull(layerconfigs.length)) templayer = [dev.ObjClone(layerconfigs)];
        else templayer = layerconfigs.clone();
        var xzqs = Enumerable.From(templayer).Where('s=>s.Type=="xzq"').FirstOrDefault();
        var county = Enumerable.From(xzqs.Child).Where('s=>s.Value=="COUNTY"').FirstOrDefault();
        if (dev.IsNull(county)) return false;
        //获取条件
        var condition = "ADCODE='" + countycode + "'";
        var wkt = dev.GetWKTByFeature(feature, true);
        condition += " AND " + dev.MapUtils.GetCql_CONTAINS(wkt, county.GeomField);
        //获取县的图层信息
        var iscontain = false;
        var param = {
            ID: county.Value,
            Url: dev.GetSystemUrlByRelID(county.WFSUrl),
            TypeName: county.TypeName,
            CqlFilter: condition,
            Async: false
        };
        var query = new dev.SWFS_H();
        query.Target.bind("onQueryCompleted", function (s, e) {
            if (e.statusCode == 200 && !dev.IsNull(e.data) && e.data.length > 0) iscontain = true;
        });
        query.Query(param);
        return iscontain;
    }

    //获取图形所在乡镇
    function getTownbyFeature(feature) {
        if (dev.IsNull(feature)) return null;
        var layerconfigs = dev.App.Config.Extend.LayerForTree.LayerRoot;
        var templayer;
        if (dev.IsNull(layerconfigs)) return null;
        if (dev.IsNull(layerconfigs.length)) templayer = [dev.ObjClone(layerconfigs)];
        else templayer = layerconfigs.clone();
        var xzqs = Enumerable.From(templayer).Where('s=>s.Type=="xzq"').FirstOrDefault();
        var town = Enumerable.From(xzqs.Child).Where('s=>s.Value=="TOWN"').FirstOrDefault();
        if (dev.IsNull(town)) return null;
        var wkt = dev.GetWKTByFeature(feature, true);
        condition = dev.MapUtils.GetCql_INTERSECTS(wkt, town.GeomField);
        var data;
        var param = {
            ID: town.Value,
            Url: dev.GetSystemUrlByRelID(town.WFSUrl),
            TypeName: town.TypeName,
            CqlFilter: condition,
            Async: false
        };
        var query = new dev.SWFS_H();
        query.Target.bind("onQueryCompleted", function (s, e) {
            if (e.statusCode == 200 && !dev.IsNull(e.data) && e.data.length > 0) data = e.data;
        });
        query.Query(param);
        return data;
    }

    //初始化临时图层
    function loadVectorLayer(layerinfo, features) {
        if (!dev.IsNull(templayer)) dev.App.Map.removeLayer(templayer);
        templayer = new ol.layer.Vector({
            source: new ol.source.Vector({ features: features }),
            style: function (feature, resolution) {
                return new ol.style.Style({ stroke: new ol.style.Stroke({ color: 'red', width: 2 }) });
            },
            zIndex: 10010
        });
        dev.App.Map.addLayer(templayer);

    }

    function transformCoor(feature) {
        var newf = feature.clone();
        newf.setId(feature.getId());
        newf.getGeometry().applyTransform(function (flatCoordinates, flatCoordinates2, stride) {
            for (var j = 0; j < flatCoordinates.length; j += stride) {
                var y = flatCoordinates[j];
                var x = flatCoordinates[j + 1];
                flatCoordinates[j] = x;
                flatCoordinates[j + 1] = y;
            }
        });
        return newf;
    }

    function initeditWin(feature, layerinfo) {
        //显示修改编辑框
        if (dev.IsNull(feature) || dev.IsNull(layerinfo)) return;
        var currlayerfield;
        var fieldConfig = dev.App.Config.Extend.DetailFields.FieldInfo;
        if (dev.IsNull(fieldConfig)) return;
        if (dev.IsNull(fieldConfig.length)) currlayerfield = [dev.ObjClone(fieldConfig)];
        else currlayerfield = fieldConfig.clone();
        currlayerfield = Enumerable.From(currlayerfield).Where('s=>s.BelongData.indexOf("' + layerinfo.CompareInfo.DBTableName + '")>=0').ToArray();
        if (dev.IsNull(currlayerfield) || currlayerfield.length == 0) return;
        var ac_length = currlayerfield.length * 30;
        if (ac_length > 368) ac_length = 400;
        else ac_length += 32;
        if (dev.IsNull(editwin)) {
            editwin = new dev.Window({
                ID: "layerupdateWin",
                IconCls: 'machine-type',
                Title: "要素编辑",
                Parent: dev.App.MapPanel.MapDOM,
                Maximizable: false,
                Modal: false,
                Draggable: true,
                HAlign: 'center',
                VAlign: 'center',
                Resizable: false,
                Height: ac_length,
                Width: 260
            });
            editwin.one("onClosing", function () {
                if (!dev.IsNull(farmcontrol)) {
                    farmcontrol.combogrid("hidePanel");
                    farmcontrol = null;
                }
                editwin.Destroy();
                editwin = null;
            });
        }
        else editwin.Open();
        editwin.Target.prop("clayerinfo", layerinfo);
        var win_content = $('<div style="width:100%;height:100%;"></div>');
        for (var i = 0; i < currlayerfield.length; i++) {
            var rowdiv = $('<div style="width:258px;height:29px;border-bottom:1px solid #ddd;"></div>');
            win_content.append(rowdiv);
            var titlediv = $('<div style="width:75px;padding-right:5px;height:29px;border-right:1px solid #ddd;display:inline-block;float:left;text-align:right;line-height:29px;">' + currlayerfield[i].ByName + '</div>').appendTo(rowdiv);
            var controldiv = $('<div style="width:177px;height:29px;display:inline-block;"></div>').appendTo(rowdiv);
            //添加控件
            var type = currlayerfield[i].ValueType;
            var DicName = currlayerfield[i].DicName;//数据字典名
            var editcontrol;
            if (!dev.IsNull(DicName)) {
                //combo
                var dicdatas = dev.GetDicData([DicName]);
                editcontrol = new dev.Combobox({
                    Width: 167,
                    Height: 24,
                    PopupHeight: 60,
                    ValueField: 'id',
                    TextField: 'data',
                    CSS: { "margin-top": "2px", "margin-left": "5px" }
                });
                controldiv.append(editcontrol.Target);
                editcontrol.Target.attr("name", currlayerfield[i].Name);
                editcontrol.SetData(dicdatas);
                if (isupdate) {
                    var value = feature.getProperties()[currlayerfield[i].Name];
                    editcontrol.SetText(value);
                }
            }
            else if (currlayerfield[i].ByName === "农户") {
                //cmobogrid
                editcontrol = $('<div style="left: 5px;top: 2px;" data-options="editable:false">cs</div>');
                var contentcontrol = $('<div style="padding-left: 5px;padding-top: 3px;"></div>');
                contentcontrol.append(editcontrol);
                controldiv.append(contentcontrol);
                farmcontrol = editcontrol.combogrid({
                    idField: 'id',
                    textField: 'name',
                    columns: [[
                        { field: 'id', title: 'id', width: 100, align: 'center', hidden: true },
                        { field: 'name', title: '姓名', width: 100, align: 'center' },
                        { field: 'mobilephone', title: '移动电话', align: 'center', width: 125 },
                        { field: 'cardid', title: '身份证号', align: 'center', width: 140 },
                        { field: 'household', title: '户口性质', align: 'center', width: 70 }
                    ]],
                    width: 167,
                    height: 22,
                    panelWidth: 437,
                    panelHeight: 183,
                    pagination: true
                });
                var farmepage = farmcontrol.combogrid("grid").datagrid("getPager");
                var parampage = {
                    showPageList: false,
                    showRefresh: false,
                    pageNumber: farmeindex,
                    pageSize: farmesize,
                    onSelectPage: function (index, size) {
                        farmeindex = index;
                        getpagedata();
                    }
                };
                farmepage.pagination(parampage);
                var value = "";
                if (isupdate) { value = feature.getProperties()["FARMENAME"]; }
                if (!dev.IsNull(value)) { farmcontrol.combogrid("readonly", true); }
                getpagedata(value);

            }
            else if (type == "string") {
                //text类型
                editcontrol = new dev.TextBox({
                    Width: 167,
                    Height: 24,
                    CSS: { "margin-top": "2px", "margin-left": "5px" }
                });
                controldiv.append(editcontrol.Target);
                editcontrol.Target.attr("name", currlayerfield[i].Name);
                if (currlayerfield[i].Name == "MASSIFID") {
                    editcontrol.SetValue(feature.getProperties()[currlayerfield[i].Name]);
                    editcontrol.SetReadOnly(true);
                }
                else {
                    if (isupdate) editcontrol.SetValue(feature.getProperties()[currlayerfield[i].Name]);
                }
            }

            if (type == "number") {
                //数字类型
                editcontrol = new dev.NumberBox({
                    Width: 167,
                    Height: 24,
                    CSS: { "margin-top": "2px", "margin-left": "5px" },
                    Min: 0,
                    Precision: 2
                });
                controldiv.append(editcontrol.Target);
                editcontrol.Target.attr("name", currlayerfield[i].Name);
                var currarea = SgeomArae(feature.getGeometry());
                if (currlayerfield[i].Name == "FARMAREA") editcontrol.SetValue(currarea);
                if (isupdate) {
                    var value = feature.getProperties()[currlayerfield[i].Name];
                    if (dev.IsNull(value) || isNaN(value)) value = 0;
                    else value = parseFloat(value);
                    editcontrol.SetValue(value);
                    if (currlayerfield[i].Name == "FARMAREA") editcontrol.SetValue(dev.SqrtMetersToMu(value, 3));
                }
            }
            if (type == "datetime") {
                //时间类型
                var editcontrolelement = $('<div class="dev-datebox" style="width:167px;height:24px;margin-top:2px;margin-left:5px;"><input style="width:167px;height:24px;"></input></div>').appendTo(controldiv);
                editcontrol = $("input", editcontrolelement).datebox({ height: 24, width: 167, editable: false });
                editcontrolelement.attr("name", currlayerfield[i].Name);
                if (isupdate) {
                    var value = dev.geoTimeToDate(feature.getProperties()[currlayerfield[i].Name], true);
                    editcontrol.datebox("setValue", value);
                }
            }
        }
        editwin.SetContent(win_content);
    }
    // 绑定farmer 的数据
    function getpagedata(value) {
        if (dev.IsNull(value)) { value = ""; }
        var con = "1=1";
        con += "  ORDER BY \"NAME\" ASC";
        $.ajax({
            url: dev.GetSystemUrlByRelID("Service") + "farmer/getbyfilter/" + farmeindex + "/" + farmesize,
            type: "POST",
            contentType: 'application/json',
            dataType: 'json',
            data: con,
            success: function (result) {
                if (!dev.IsNull(farmcontrol)) {
                    farmcontrol.combogrid("grid").datagrid("loadData", result.data.dataSource);
                    farmcontrol.combogrid("setText", value);
                    var page = farmcontrol.combogrid("grid").datagrid("getPager");
                    page.pagination('refresh', {
                        total: result.data.pageInfo.totalCount,
                        pageNumber: result.data.pageInfo.pageIndex,
                        displayMsg: "当前页显示第" + (((result.data.pageInfo.pageIndex - 1) * result.data.pageInfo.pageSize) + 1) + "-" + (result.data.pageInfo.pageIndex * result.data.pageInfo.pageSize) + "条记录,共{total}条数据"
                    });
                }

            }
        });
    }

    function getInfo() {
        var model = {};
        var textcontrol = $('.dev-textbox', editwin.Target);
        var combocontrol = $('.dev-combobox', editwin.Target);
        var numbercontrol = $('.dev-numberbox', editwin.Target);
        var row = farmcontrol.combogrid("grid").datagrid("getSelected");
        if (!dev.IsNull(row)) {
            model.FARMERID = row.id;
            model.FARMENAME = row.name;
        }
        for (var i = 0; i < textcontrol.length; i++) {
            var editcontrol = $(textcontrol[i]).prop("$this");
            var tag = editcontrol.Target.attr("name");
            model[tag] = editcontrol.GetValue();
        }
        for (var i = 0; i < combocontrol.length; i++) {
            var editcontrol = $(combocontrol[i]).prop("$this");
            var tag = editcontrol.Target.attr("name");
            model[tag] = editcontrol.GetText();
        }
        for (var i = 0; i < numbercontrol.length; i++) {
            var editcontrol = $(numbercontrol[i]).prop("$this");
            var tag = editcontrol.Target.attr("name");
            var value = editcontrol.GetValue();
            if (dev.IsNull(value)) value = 0;
            model[tag] = value;
            if (tag == "FARMAREA") model[tag] = dev.MuToSqrtMeters(value, 3);
        }
        var datecontrol = $(".dev-datebox", editwin.Target);
        for (var i = 0; i < datecontrol.length; i++) {
            var editcontrol = $("input", $(datecontrol[i]))
            var tag = $(datecontrol[i]).attr("name");
            var value = editcontrol.datebox("getValue");
            value = dev.GetDateString(new Date(new Date(value.replace(/-/g, "/")).getTime() + (24 * 3600 * 1000)));
            model[tag] = value;
        }
        return model;
    }

    function clearoparate(layerinfo) {
        if (!dev.IsNull(modifyInteraction)) {
            modifyInteraction.setActive(false);
            dev.App.Map.removeInteraction(modifyInteraction);
            modifyInteraction = null;
        }
        if (!dev.IsNull(mapclickkey)) {
            dev.App.Map.unByKey(mapclickkey);
            mapclickkey = null;
        }
        if (!dev.IsNull(layer_draw)) {
            layer_draw.Target.unbind("onDrawCompleted");
            layer_draw.Stop();
            layer_draw.Destroy();
            layer_draw = null;
        }
        if (!dev.IsNull(templayer)) {
            templayer.getSource().clear();
            dev.App.Map.removeLayer(templayer);
        }
        dev.MapUtils.ClearFeature("tempDrawLayer");
        //先移除改图层
        var value = layerinfo.Value;
        var clayer = dev.MapUtils.GetLayer(value, dev.App.Map);
        if (!dev.IsNull(clayer)) dev.App.Map.removeLayer(clayer);
        //三维移除
        dev.Map3DUtils.RemoveLayer(value);
        Refresh([layerinfo], true);
        setlayerposition(layerinfo);
    }

    function setlayerposition(layerinfo) {
        var envelop = layerinfo.Envelop;
        if (dev.IsNull(envelop)) return;
        var envelarry = envelop.split(',');
        if (envelarry.length < 4 || isNaN(envelarry[0]) || isNaN(envelarry[1]) || isNaN(envelarry[2]) || isNaN(envelarry[3])) return;
        var initExtent = [parseFloat(envelarry[0]), parseFloat(envelarry[1]), parseFloat(envelarry[2]), parseFloat(envelarry[3])];
        var mapproj = dev.App.Map.getView().getProjection();
        if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
            initExtent = ol.proj.transformExtent(initExtent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
        }
        dev.App.Map.getView().fit(initExtent, dev.App.Map.getSize());
        dev.App.Map.getView().setZoom(parseInt(dev.IsNull(layerinfo.Zoom) ? dev.App.Config.SystemMap.Zoom : layerinfo.Zoom));
    }

    function clear_oparate() {
        if (!dev.IsNull(modifyInteraction)) {
            dev.App.Map.removeInteraction(modifyInteraction);
            modifyInteraction = null;
        }
        if (!dev.IsNull(mapclickkey)) {
            dev.App.Map.unByKey(mapclickkey);
            mapclickkey = null;
        }
        if (!dev.IsNull(layer_draw)) {
            layer_draw.Target.unbind("onDrawCompleted");
            layer_draw.Destroy();
            layer_draw = null;
        }
        if (!dev.IsNull(templayer)) {
            templayer.getSource().clear();
            dev.App.Map.removeLayer(templayer);
        }
        dev.MapUtils.ClearFeature("tempDrawLayer");
        $("div[tag='delete']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
        $("div[tag='attriupdate']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
        $("div[tag='save']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
        $("div[tag='cancel']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
        if (!dev.IsNull(editwin)) editwin.Close();
    }

    //查询行政区划
    QuerySXZQ = function (code, type) {
        if (dev.IsNull(code)) return;
        if (dev.IsNull(code)) type = "county";
        var tempxzq = Enumerable.From(dev.App.Config.Extend.LayerForTree.LayerRoot).Where('s=>s.Value=="XZQ"').FirstOrDefault();
        if (dev.IsNull(tempxzq)) return;
        var xzqs = tempxzq.Child;
        var needlayerinfo = Enumerable.From(xzqs).Where('s=>s.Value.toLowerCase()=="' + type + '"').FirstOrDefault();
        if (dev.IsNull(needlayerinfo)) return;
        var con = "ADCODE='" + code + "'";
        var param = {
            ID: "tempquery",
            Url: dev.GetSystemUrlByRelID(needlayerinfo.WFSUrl),
            TypeName: needlayerinfo.TypeName,
            CqlFilter: con,
            Async: false
        };
        var query = new dev.SWFS_H();
        var data;
        query.Target.bind("onQueryCompleted", function (s, e) {
            if (dev.IsNull(e.data) || e.data.length == 0) {
                var cnode = dev.getParentCode(code);
                if (!dev.IsNull(cnode)) data = QuerySXZQ(cnode.ID, cnode.Value.toLowerCase());
            }
            else data = { cdata: e.data, xzqtype: type };
        });
        query.Query(param);
        return data;
    }
})(jQuery);

//瓦片图例
(function ($) {
    var dev;
    function getlegendtree($this) {
        var legenddiv = $('<div style="position:relative;"></div>');
        var soliddiv = $('<div style="height: calc(100% - 20px); width: 1px; background: #ddd; position: absolute; left: 5px; top: 10px;"></div>').appendTo(legenddiv);
        var ul = $('<ul class="legendtree"></ul>');
        for (var i = 0; i < $this.Data.length; i++) {
            var li = $('<li></li>').appendTo(ul);
            var lborder = $('<div style="height: 1px; width: 15px; background-color: #ddd; float: left; display: inline-block; margin-top: 10px;margin-left:4px;"></div)').appendTo(li);
            var legendback = $(' <div style="height: 16px; width: 16px; background-color:' + ($this.Data[i].Color) + '; margin-left: 5px; float: left; display: inline-block;"></div>');
            if (dev.IsNull($this.Data[i].Color)) legendback = $('<div style="height: 14px; width: 14px; border: 1px solid #ddd; margin-left: 5px; float: left;"></div>');
            legendback.appendTo(li);
            var ltext = $(' <span style="margin-left: 5px;">' + $this.Data[i].Text + '</span>').appendTo(li);
            if (dev.IsNull($this.Data) || $this.Data.length == 0) continue;
            var childul = $('<ul></ul>').appendTo(li);
            if (!dev.IsNull($this.Data[i].Child) && dev.IsNull($this.Data[i].Child.length)) $this.Data[i].Child = [$this.Data[i].Child];
            for (var j = 0; j < $this.Data[i].Child.length; j++) {
                var cli = $('<li></li>').appendTo(childul);
                var cliicon = $('<div class="icon" style="background-color:' + $this.Data[i].Child[j].Color + ';"></div>').appendTo(cli);
                var cltext = $(' <span style="line-height: 16px; margin-left: 5px;">' + $this.Data[i].Child[j].Text + '</span>').appendTo(cli);
            }
        }
        ul.appendTo(legenddiv);
        $this.box.SetContent(legenddiv);
    }
    UCTileLegend = function (sender, opt) {
        dev = sender;
        if (dev.IsNull(opt)) opt = {};
        opt.Width = dev.IsNull(opt.Width) ? 175 : opt.Width;
        opt.Height = dev.IsNull(opt.Height) ? 400 : opt.Height;
        if (dev.IsNull(opt.Target)) opt.Target = $('<div class="Tilelegend" style="Width:' + opt.Width + 'px;Height:' + opt.Height + 'px"></div>');
        $.extend(this, new dev.Control(opt));
        if (!dev.IsNull(opt.Left)) this.Target.css("left", opt.Left + "px");
        if (!dev.IsNull(opt.Right)) this.Target.css("right", opt.Right + "px");
        if (!dev.IsNull(opt.Top)) this.Target.css("top", opt.Top + "px");
        if (!dev.IsNull(opt.Bottom)) this.Target.css("bottom", opt.Bottom + "px");
        this.Header = $('<div class="legendheader"><span style="margin-left:10px;">图例<span><div>').appendTo(this.Target);
        this.TreeContianer = $('<div class="legendcontain"></div>').appendTo(this.Target);
        this.Data = opt.Data;
    }
    $.fn.extend(UCTileLegend.prototype, {
        Layout: function () {
            var height = this.TreeContianer.height();
            var width = this.TreeContianer.width();
            this.box = new dev.Box({ HasBorder: false, Height: height, Width: width });
            this.box.Target.appendTo(this.TreeContianer);
            this.box.Layout();
            if (!dev.IsNull(this.Data) && this.Data.length > 0) getlegendtree(this);
        },
        SetData: function (data) {
            if (dev.IsNull(data) || data.length == 0) return;
            this.Data = data;
            getlegendtree(this);
        },
        SetVisible: function (visible) {
            if (dev.IsNull(visible)) return;
            this.Target.css("display", visible ? "block" : "none");
        }
    });
})(jQuery);

/*图形绘制*/
(function ($) {
    function end(o, r) {
        o.Target.triggerHandler("onDrawCompleted", r);
    }
    function drawstart(o, r) {
        o.Target.triggerHandler("onDrawStart", r);
    }
    SDraw = function (options) {
        if (!dev.IsObject(options) || dev.IsNull(options.Map)) return;
        this.Type = dev.IsNull(options.Type) ? dev.DrawType.Ploygon : options.Type;
        this.State = dev.IsNull(options.State) ? "Query" : options.State;
        this.Style = dev.IsNull(options.Style) ? (new ol.style.Style({
            stroke: new ol.style.Stroke({ width: 1, color: 'rgba(237, 117, 65, 1)' }),
            fill: new ol.style.Fill({ color: [236, 179, 73, 0.2] }),
            image: new ol.style.Circle({
                radius: 5,
                fill: new ol.style.Fill({
                    color: [236, 179, 73, 0.5]
                }),
                stroke: new ol.style.Stroke({
                    color: 'red',
                    width: 1
                })
            }),
            zIndex: Infinity
        })) : options.Style;
        this.Map = options.Map;
        if (dev.IsNull(options.Layer)) {
            this.Layer = new dev.layer.Vector();
            this.Source = options.Source;
            if (dev.IsNull(this.Source))
                this.Source = new dev.source.Vector({ wrapX: false });
            this.Layer.setSource(this.Source);
            if (!dev.IsNull(options.Style)) { this.Layer.setStyle(options.Style); }
            else {
                var fill = options.Fill;
                if (dev.IsNull(fill)) { fill = new ol.style.Fill({ color: 'rgba(255, 0, 0, 0.2)' }); }
                var stroke = options.Stroke;
                if (dev.IsNull(stroke)) { stroke = new ol.style.Stroke({ color: '#ff0000', width: 1 }); }
                var image = options.Image;
                if (dev.IsNull(image)) { image = new ol.style.Circle({ radius: 4, fill: new ol.style.Fill({ color: '#ff0000' }) }); }
                this.Layer.setStyle(new ol.style.Style({ fill: fill, stroke: stroke, image: image }));
            }
            this.Map.addLayer(this.Layer);
        }
        else {
            this.Layer = options.Layer;
            this.Source = this.Layer.getSource();
        }
        this.Target = $(this);
    };
    $.fn.extend(SDraw.prototype, {
        Start: function (drawType) {
            var $this = this;
            if (!dev.IsNull(drawType)) this.Type = drawType;
            if (!dev.IsNull(this.Draw)) this.Map.removeInteraction(this.Draw);
            var geoFun, maxPoints, value = this.Type;
            if (this.Type === dev.DrawType.Square) {
                value = dev.DrawType.Circle;
                geoFun = ol.interaction.Draw.createRegularPolygon(4);
            } else if (this.Type === dev.DrawType.Rectangle) {
                maxPoints = 2;
                value = dev.DrawType.Ployline;
                geoFun = function (coordinates, geometry) {
                    if (!geometry) { geometry = new dev.geom.Polygon(null); }
                    var start = coordinates[0], end = coordinates[1];
                    geometry.setCoordinates([[start, [start[0], end[1]], end, [end[0], start[1]], start]]);
                    return geometry;
                };
            }
            this.Draw = new ol.interaction.Draw({
                type: value,
                style: this.Style,
                source: this.Source,
                maxPoints: maxPoints,
                geometryFunction: geoFun
            });
            this.Map.addInteraction(this.Draw);
            this.Draw.on('drawend', function (e) {
                end($this, e.feature);
            }, this);
            this.Draw.on('drawstart', function (e) {
                drawstart($this, e.feature);
            }, this);
        },
        Stop: function () {
            if (!dev.IsNull(this.Draw))
                this.Draw.setActive(false);
        },
        Destroy: function () {
            if (!dev.IsNull(this.Draw)) {
                this.Draw.setActive(false);
                this.Map.removeInteraction(this.Draw);
            }
        }
    });
})(jQuery);

/*公共方法*/
(function ($) {
    //冒泡显示
    var ucMapTip = null;
    var isDetail = false;
    var listenkey;
    var blockpanel;
    var farmerdetailWin, blockdetailWin;
    var detailGrid;
    ShowMapTip = function (features, param, position) {
        if (dev.IsNull(features) || features.length == 0 || dev.IsNull(param)) return;
        //根据feature获取中心点
        var center;
        if (dev.IsNull(position)) {
            var extent;
            if (features.length > 0) extent = features[0].getGeometry().getExtent();
            center = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
        }
        else center = position;
        var mapproj = dev.App.Map.getView().getProjection();
        if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) center = ol.proj.transform(center, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
        if (ucMapTip === null) {
            ucMapTip = new SUCMapTip({
                ID: dev.IsNull(param.ID) ? "mapTip" : param.ID,
                Title: dev.IsNull(param.Title) ? "详细信息" : param.Title,
                IconUri: dev.IsNull(param.IconUri) ? "" : param.IconUri,
                Position: center,
                Width: 280,
                Height: 271
            });
            $(".panel-header", ucMapTip.popup).css("background", "linear-gradient(to right,#745dfd,#0e5fd1)");
            ucMapTip.content.css("background", "rgba(20, 205, 173,0.6)");
            $(ucMapTip).one("onClosed", function () {
                if (!dev.IsNull(param.IsShowFeature) && param.IsShowFeature == true) {
                    if (!dev.IsNull(listenkey)) {
                        dev.App.Map.unByKey(listenkey);
                        listenkey = null
                    }
                }
                if (!dev.IsNull(detailGrid)) {
                    detailGrid.Target.remove();
                    detailGrid = null;
                }
                if (!dev.IsNull(blockpanel)) blockpanel.remove();
                ucMapTip = null;
            });
        }
        else ucMapTip.SetPosition(center);
        SMapTipContent(features, param);
    };
    ClearMapTip = function () {
        if (!dev.IsNull(ucMapTip)) ucMapTip.Close();
        if (!dev.IsNull(detailGrid)) {
            detailGrid.Target.remove();
            detailGrid = null;
        }
        if (!dev.IsNull(blockpanel)) blockpanel.remove();
    }
    function tipdetail(feature, layerinfo) {
        var dDiv = $('<div class="MapTipContent"></div>');
        var tablename = layerinfo.CompareInfo.DBTableName;
        var fieldsconfig = dev.App.Config.Extend.DetailFields.FieldInfo;
        if (dev.IsNull(fieldsconfig)) return;
        var fields;
        if (dev.IsNull(fieldsconfig.length)) fields = [dev.ObjClone(fieldsconfig)];
        fields = fieldsconfig.clone();
        var layerfields = Enumerable.From(fields).Where('s=>s.IsPopupVisible=="true" && s.BelongData.indexOf("' + tablename + '")>=0').ToArray();
        for (var i = 0; i < layerfields.length; i++) {
            //判断是否是地块或种植信息
            var detailrow = $('<div><div class="Title">' + layerfields[i].ByName + '</div></div>').appendTo(dDiv);
            var value = feature.getProperties()[layerfields[i].Name];
            if (layerfields[i].Name == "FARMERID") value = feature.getProperties()["FARMENAME"];
            if (!dev.IsNull(layerfields[i].IsConvert) && layerfields[i].IsConvert.toLowerCase() == "sqrtmeterstomu") value = dev.SqrtMetersToMu(value, 3);
            var detailcontent = $('<div class="Content" title="' + (dev.IsNull(value) ? "-" : value) + '">' + (dev.IsNull(value) ? "-" : value) + '</div>');
            if ((layerinfo.LayerType == "block" || layerinfo.LayerType == "crop") && layerfields[i].Name == layerinfo.CompareInfo.PrimaryKey) {
                detailcontent = $('<div class="Content" title="' + (dev.IsNull(value) ? "-" : value) + '"><a style="color:#ffffff;text-decoration:underline;">' + (dev.IsNull(value) ? "-" : value) + '</a></div>');
                detailcontent.prop("rowdata", feature.getProperties());
                $('a', detailcontent).click(function () {
                    var massifdata = $(this).html();
                    if (dev.IsNull(massifdata)) return;
                    var rowdata = $(this).parent().prop("rowdata");
                    var curr_row = {};
                    $.each(rowdata, function (s, e) {
                        if (s.toLowerCase() == "farmarea") s = "farmlandarea";
                        curr_row[s.toLowerCase()] = e;
                    });
                    SGetMassifDetailinfo(curr_row);
                });
            }
            detailcontent.appendTo(detailrow);
        }
        var isScroll = (layerfields.length * 30 + layerfields.length) > 217;
        var contentWidth = 278 - 80 - (isScroll ? 9 : 0) - 6;
        $(".Content", dDiv).css("width", contentWidth + "px");
        dDiv.css("height", ((layerfields.length * 30) + layerfields.length));
        return dDiv;
    }
    SMapTipContent = function (data, param) {
        ucMapTip.Clear();
        if (dev.IsNull(data.length) || data.length == 1) {
            var tempdata = data;
            if (data.length == 1) tempdata = data[0];
            if (dev.IsNull(tempdata.length)) {
                var detailBox = new dev.Box({ Width: 278, Height: 243, HasBorder: false });
                detailBox.Target.css("background", "transparent");
                ucMapTip.Add(detailBox.Target);
                detailBox.SetContent(tipdetail(tempdata, param));
                detailBox.Layout();
                if (param.IsShowFeature) {
                    var firstf = tempdata;
                    if (!dev.IsNull(listenkey)) {
                        dev.MapUtils.removePointKey("maptipfeature", dev.App.Map);
                        listenkey = null
                    }
                    listenkey = dev.MapUtils.LineSymbolStyle(firstf);
                }
            }
            else {
                ucMapTip.SetHeight(301);
                var detildiv = $('<div style="width:278px;height:275px;position:relative;"></div>');
                ucMapTip.Add(detildiv);
                //添加listbox
                //查找该图层对应的所有field
                var tipdiv = $('<div style="height:30px;width:278px;background:#ddd;border-bottom:1px solid #ddd;line-height:30px;"></div>').appendTo(detildiv);
                tipdiv.mouseenter(function () {
                    listbox.SetBorder("1px");
                    listbox.SetCSS({ "margin-top": "2px", "padding": "0px 5px" });
                }).mouseleave(function () {
                    listbox.SetBorder("0px");
                    listbox.SetCSS({ "margin-top": "3px", "padding": "0px 5px" });
                });
                var title = $('<div style=" width: 80px; height: 30px;line-height: 30px;text-align: center;display: inline-block;float:left;"></div>').appendTo(tipdiv);
                var titleicon = $('<div class="machine-cartype" style="height:16px;width:16px;display:inline-block;float:left;margin-top:7px;margin-left:5px;"></div>').appendTo(title);
                var titletext = $('<div style="height:30px;width:50px;line-height:30px;display:inline-block;">要素列表</div>').appendTo(title);
                var combodiv = $('<div style="width:189px;height:30px;display:inline-block;"></div>').appendTo(tipdiv);
                var listbox = new dev.Combobox({
                    Parent: combodiv,
                    Width: 179,
                    Height: 24,
                    TextField: param.CompareInfo.CompareField,
                    ValueField: param.CompareInfo.PrimaryKey,
                    Border: "0px",
                    CSS: { "margin-top": "3px", "padding": "0px 5px" }
                });
                listbox.Layout();
                var listdata = [];
                for (var i = 0; i < tempdata.length; i++) {
                    var model = tempdata[i].getProperties();
                    model.featrue = tempdata[i];
                    listdata.push(model);
                }
                listbox.SetData(listdata);
                listbox.SetSelectedIndex(0);
                listbox.bind("onSelectChanged", function () {
                    var selectitem = this.$this.GetSelectedItem();
                    if (dev.IsNull(selectitem) || selectitem.length == 0) return;
                    detailBox.SetContent(tipdetail(selectitem[0].featrue, param));
                    //高亮选中元素
                    if (param.IsShowFeature) {
                        if (!dev.IsNull(listenkey)) {
                            dev.MapUtils.removePointKey("maptipfeature", dev.App.Map);
                            listenkey = null
                        }
                        var s_feature = selectitem[0].featrue.clone();
                        s.featrue.setId("maptipfeature");
                        listenkey = dev.MapUtils.LineSymbolStyle(s.featrue);
                    }
                });
                //添加一个标题
                //添加第二个box
                var detailBox = new dev.Box({ Width: 278, Height: 243, HasBorder: false });
                detildiv.append(detailBox.Target);
                //添加内容
                detailBox.SetContent(tipdetail(tempdata[0], param));
                detailBox.Layout();
                //高亮默认元素
                if (param.IsShowFeature) {
                    if (!dev.IsNull(listenkey)) {
                        dev.MapUtils.removePointKey("maptipfeature", dev.App.Map);
                        listenkey = null
                    }
                    var s_f = tempdata[0].clone();
                    s_f.setId("maptipfeature");
                    listenkey = dev.MapUtils.LineSymbolStyle(s_f);
                }
            }
        }
        else {
            var items = [];
            for (var i = 0; i < data.length; i++) items.push({
                ID: "MapTipitem" + i,
                IsSelected: (i == 0),
                Name: (dev.IsNull(param.TabTitle[i]) ? ("选项卡" + i) : param.TabTitle[i]),
                Content: $('<div style="height:100%;width:100%;"></div>'),
                Width: 278
            });
            var tab = new dev.Tab({
                ID: "maptiptab",
                Position: "top",
                Width: 278,
                Height: 239,
                TabNormalCls: "liveNormalTabCls",
                TabSelectedCls: "liveSelectedTabCls",
                Items: items
            });
            //tab变化事件
            tab.Target.bind("onSelected", function (s, e) {
                var index = e.index;
                var currf = data[index];
                var hightf;
                if (dev.IsNull(currf.length) || currf.length == 1) {
                    ucMapTip.SetHeight(271);
                    tab.SetHeight(239);
                }
                else {
                    ucMapTip.SetHeight(301);
                    tab.SetHeight(269);
                }
                if (param.IsShowFeature) {
                    if (dev.IsNull(currf.length)) hightf = currf;
                    else hightf = currf[0];

                    if (!dev.IsNull(listenkey)) {
                        dev.MapUtils.removePointKey("maptipfeature", dev.App.Map);
                        listenkey = null
                    }
                    hightf.setId("maptipfeature");
                    listenkey = dev.MapUtils.LineSymbolStyle(hightf);
                }
            });
            ucMapTip.Add(tab.Target);
            tab.Layout();
            for (var i = 0; i < data.length; i++) {
                //判断当前项目是一条数据还是多条数据
                var tempdata = data[i];
                if (data[i].length == 1) tempdata = data[i][0];
                if (dev.IsNull(tempdata.length)) {
                    var box = new dev.Box({ Width: 278, Height: 217, HasBorder: false });
                    items[i].Content.append(box.Target);
                    box.SetContent(tipdetail(tempdata, param.LayerInfo[i]));
                    box.Layout();
                }
                else {
                    var detildiv = $('<div class="morefeature" style="width:278px;height:247px;position:relative;"></div>');
                    items[i].Content.empty();
                    items[i].Content.append(detildiv);
                    var tipdiv = $('<div style="height:30px;width:278px;background:#ddd;border-bottom:1px solid #ddd;line-height:30px;"></div>').appendTo(detildiv);
                    tipdiv.mouseenter(function () {
                        listbox.SetBorder("1px");
                        listbox.SetCSS({ "margin-top": "2px", "padding": "0px 5px" });
                    }).mouseleave(function () {
                        listbox.SetBorder("0px");
                        listbox.SetCSS({ "margin-top": "3px", "padding": "0px 5px" });
                    });
                    var title = $('<div style=" width: 80px; height: 30px;line-height: 30px;text-align: center;display: inline-block;float:left;"></div>').appendTo(tipdiv);
                    var titleicon = $('<div class="machine-cartype" style="height:16px;width:16px;display:inline-block;float:left;margin-top:7px;margin-left:5px;"></div>').appendTo(title);
                    var titletext = $('<div style="height:30px;width:50px;line-height:30px;display:inline-block;">要素列表</div>').appendTo(title);
                    var combodiv = $('<div style="width:189px;height:30px;display:inline-block;"></div>').appendTo(tipdiv);
                    var listbox = new dev.Combobox({
                        Parent: combodiv,
                        Width: 179,
                        Height: 24,
                        TextField: param.LayerInfo[i].CompareInfo.CompareField,
                        ValueField: param.LayerInfo[i].CompareInfo.PrimaryKey,
                        Border: "0px",
                        CSS: { "margin-top": "3px", "padding": "0px 5px" }
                    });
                    listbox.Layout();
                    var listdata = [];
                    for (var j = 0; j < tempdata.length; j++) {
                        var model = tempdata[j].getProperties();
                        model.featrue = tempdata[j];
                        model.layerinfo = param.LayerInfo[i];
                        listdata.push(model);
                    }
                    listbox.SetData(listdata);
                    listbox.SetSelectedIndex(0);
                    listbox.bind("onSelectChanged", function () {
                        var selectitem = this.$this.GetSelectedItem();
                        if (dev.IsNull(selectitem) || selectitem.length == 0) return;
                        detailBox.SetContent(tipdetail(selectitem[0].featrue, selectitem[0].layerinfo));
                        ////高亮选中元素
                        if (param.IsShowFeature) {
                            if (!dev.IsNull(listenkey)) {
                                dev.MapUtils.removePointKey("maptipfeature", dev.App.Map);
                                listenkey = null
                            }
                            var s_feature = selectitem[0].featrue.clone();
                            s.featrue.setId("maptipfeature");
                            listenkey = dev.MapUtils.LineSymbolStyle(s_feature);
                        }
                    });
                    var detailBox = new dev.Box({ Width: 278, Height: 217, HasBorder: false });
                    detildiv.append(detailBox.Target);
                    //添加内容
                    detailBox.SetContent(tipdetail(tempdata[0], param.LayerInfo[i]));
                    detailBox.Layout();
                }
            }
            //默认高亮
            if (param.IsShowFeature) {
                var firstf = data[0];
                if (data[0].length == 1) firstf = data[0];
                if (data[0].length > 1) firstf = data[0][0];
                if (!dev.IsNull(listenkey)) {
                    dev.MapUtils.removePointKey("maptipfeature", dev.App.Map);
                    listenkey = null
                }
                var s_f = firstf.clone();
                s_f.setId("maptipfeature");
                listenkey = dev.MapUtils.LineSymbolStyle(firstf);
            }
        }
    };
    SGetMassifDetailinfo = function (row, showInspect) {
        $.ajax({
            url: dev.MapLoad.GetUrlByRelID("Service") + "massif/detail/" + row.massifid + "?" + new Date().getTime(),
            type: "GET",
            dataType: "json",
            success: function (result) {
                if (dev.IsNull(result.data) || (dev.IsNull(result.data.farmer) && result.data.crops.length == 0)) return;
                SShowBlockInfo(result.data, row, showInspect);
            }
        });
    };
    //wkt转换成为geom
    SGeomByWKT = function (wkt) {
        if (dev.IsNull(wkt)) return null;
        var geomtype = wkt.substring(0, wkt.indexOf('(')).trim();
        var geomstr = wkt.replace(geomtype, '');
        var geom;
        if (geomtype.toUpperCase() == "MULTIPOLYGON") geom = new ol.geom.MultiPolygon(dev.getGeomArrayByStr(geomstr, geomtype));
        if (geomtype.toUpperCase() == "POLYGON") geom = new ol.geom.Polygon(dev.getGeomArrayByStr(geomstr, geomtype));
        if (geomtype.toUpperCase() == "LINESTRING") geom = new ol.geom.LineString(dev.getGeomArrayByStr(geomstr, geomtype));
        return geom;
    }
    SShowBlockInfo = function (detailinfo, currrow, showInspect) {
        if (!dev.IsNull(blockpanel)) {
            if (!dev.IsNull(detailGrid)) {
                detailGrid.Target.remove();
                detailGrid = null;
            }
            blockpanel.remove();
        }
        blockpanel = $('<div style="width:319px;position:absolute;top:120px;left:50px;z-index:10;"></div>').appendTo(dev.App.MapPanel.Target);
        var detailcontent = $('<div style="width:319px;background-color:rgba(20, 205, 173,0.6);"></div>').appendTo(blockpanel);
        var detailtitle = $('<div style="height:30px;background:#14cdad;width:100%;color:#fff;line-height:30px;font-size:14px;position:relative;"><span style="margin-left:5px;">基本信息</span></div>').appendTo(detailcontent);
        var icon = $('<div style="position:absolute;right:0px;top:0px;height:30px;width:40px;background-color:rgba(20, 205, 173,0.6);background-image: url(' + dev.App.Root + 'image/l1.png);background-position: -390px 0px;"></div>').appendTo(detailtitle);
        icon.mouseover(function () {
            $(this).css("background-color", "#ff0000");
        }).mouseleave(function () {
            $(this).css("background-color", "rgba(20, 205, 173,0.6)");
        }).click(function () {
            if (!dev.IsNull(detailGrid)) {
                detailGrid.Target.remove();
                detailGrid = null;
            }
            blockpanel.remove();
        });
        if (!dev.IsNull(detailinfo.farmer)) {
            var framercontent = $('<div style="height:125px;width:317px;border-left:1px solid #87CEEB;border-right:1px solid #87CEEB;"></div>').appendTo(detailcontent);
            var framerleft = $('<div style="height:95px;width:95px;display:inline-block;float:left;"><div style="height:80px;width:80px;margin-top:15px;margin-left:15px;border-radius:40px;background-image:url(' + (dev.IsNull(detailinfo.farmerImages[0]) ? (dev.App.Root + "image/agri/nopic.png") : (detailinfo.farmerImages[0])) + ');background-repeat: no-repeat; background-position: center; background-size: 80px 80px;"></div></div>').appendTo(framercontent);
            var framername = $('<div style="height:30px;width:80px;text-align:center;color:#ffffff;line-height:30px;text-decoration: underline;margin-left:15px;"><a tag="' + detailinfo.farmer.id + '">' + detailinfo.farmer.name + '</a></div>').appendTo(framerleft);
            $('a', framername).click(function () {
                var tag = $(this).attr("tag");
                if (dev.IsNull(tag)) return;
                farmerdetailWin = new dev.Window({
                    ID: "farmerWin",
                    IconCls: "machine-trackedit",
                    Title: "农户详细信息",
                    Parent: dev.App.MapPanel.MapDOM,
                    Maximizable: false,
                    Modal: false,
                    Draggable: true,
                    HAlign: 'center',
                    VAlign: 'center',
                    Resizable: false,
                    Url: dev.App.Root + "html/rotation/farmerdetail.html",
                    Height: 309,
                    Width: 500,
                    Parameters: { farmerId: tag }
                });
                farmerdetailWin.one("onClosing", function () {
                    farmerdetailWin.Destroy();
                    farmerdetailWin = null;
                });
                farmerdetailWin.Target.css("background", "transparent");
                $("#iframePanel", farmerdetailWin.Target).css("background", "transparent");
                $(".Header", farmerdetailWin.Target).css("background", "linear-gradient(to right,#745dfd,#0e5fd1)");
                $('iframe', farmerdetailWin).load(function () {
                    $("iframe", farmerdetailWin).contents().find("body").css("background", "rgba(20, 205, 173,0.6)");
                    //$(".liveNormalTabCls", $("iframe", farmerdetailWin).contents()).css("background", "rgba(149, 184, 231, 0.8)");
                    $(".TabItem", $("iframe", farmerdetailWin).contents()).css("background", "rgba(20, 205, 173,0.8)");
                })
            });
            var framerright = $('<div style="width:212px;height:70px;margin-top:25px;display:inline-block;margin-left:10px;"></div>').appendTo(framercontent);
            var framecardid = $('<div style="height:35px;width:222px;"><div style="width:55px;text-align:right;padding-right:5px;height:35px;line-height:35px;display:inline-block;">身份证号</div><div style="width;147px;height:35px;line-height:35px;padding-left:5px;display:inline-block;">' + detailinfo.farmer.cardid + '</div></div>').appendTo(framerright);
            var framephone = $('<div style="height:35px;width:222px;"><div style="width:55px;text-align:right;padding-right:5px;height:35px;line-height:35px;display:inline-block;">联系电话</div><div style="width:147px;height:35px;line-height:35px;padding-left:5px;display:inline-block;">' + detailinfo.farmer.mobilephone + '</div></div>').appendTo(framerright);
        }
        var blocktitle = $('<div style="height:27px;width:319px;line-height:27px;background:linear-gradient(to right,#745dfd,#0e5fd1)"><div style="margin-left:3px;height:24px;width:24px;border-radius:12px;background-color:rgba(20, 205, 173,0.6);color:#fff;line-height:24px;text-align:center;display:inline-block;float:left;">地</div><div style="margin-left:10px;display:inline-block;height:24px;line-height:24px;color:#ffffff;">地块信息</div></div>').appendTo(detailcontent);
        var blockcontent = $('<div style="height:150px;border-left:1px solid #87CEEB;border-right:1px solid #87CEEB;width:317px;"></div>').appendTo(detailcontent);
        var tempdiv = $('<div style="height:120px;width:317px;"></div>').appendTo(blockcontent);
        var blockleft = $('<div style="height:120px;width:200px;display:inline-block;float:left;"></div>').appendTo(tempdiv);
        var blockid = $('<div style="height:30px;width:200px;"><div style="height:30px;width:55px;padding-right:5px;display:inline-block;float:left;text-align:right;line-height:30px;">地块编号</div><div style="height:30px;width:135px;padding-left:5px;display:inline-block;line-height:30px;color:#ffffff;text-decoration: underline;"><a>' + currrow.massifid + '</a></div></div>').appendTo(blockleft);
        blockid.prop("blockdata", detailinfo.massifs);
        blockid.prop("blockimgs", detailinfo.images);
        $("a", blockid).click(function () {
            var blockdata = $(this).parent().parent().prop("blockdata");
            var blockimgs = $(this).parent().parent().prop("blockimgs");
            if (dev.IsNull(blockdata)) return;
            if (dev.IsNull(blockdetailWin)) {
                blockdetailWin = new dev.Window({
                    ID: "blockWin",
                    IconCls: 'machine-trackedit',
                    Title: "地块详细信息",
                    Parent: dev.App.MapPanel.MapDOM,
                    Maximizable: false,
                    Modal: false,
                    Draggable: true,
                    HAlign: 'center',
                    VAlign: 'center',
                    Resizable: false,
                    Url: dev.App.Root + "html/rotation/blockdetail.html",
                    Height: 319,
                    Width: 516,
                    Parameters: { massifdata: blockdata, massifimgs: blockimgs }
                });
                blockdetailWin.one("onClosing", function () {
                    blockdetailWin.Destroy();
                    blockdetailWin = null;
                });
                blockdetailWin.Target.css("background", "transparent");
                $("#iframePanel", blockdetailWin.Target).css("background", "transparent");
                $(".Header", blockdetailWin.Target).css("background", "linear-gradient(to right,#745dfd,#0e5fd1)");
                $('iframe', blockdetailWin).load(function () {
                    $("iframe", blockdetailWin).contents().find("body").css("background", "rgba(20, 205, 173,0.6)");
                })
            }
        });
        var blockname = $('<div style="height:30px;width:200px;"><div style="height:30px;width:55px;padding-right:5px;display:inline-block;float:left;text-align:right;line-height:30px;">地类名称</div><div style="height:30px;width:135px;padding-left:5px;display:inline-block;line-height:30px;">' + (dev.IsNullAll(detailinfo.massifs.classname) ? "" : detailinfo.massifs.classname) + '</div></div>').appendTo(blockleft);
        var blocktype = $('<div style="height:30px;width:200px;"><div style="height:30px;width:55px;padding-right:5px;display:inline-block;float:left;text-align:right;line-height:30px;">耕地类型</div><div style="height:30px;width:135px;padding-left:5px;display:inline-block;line-height:30px;">' + (dev.IsNullAll(detailinfo.massifs.landtype) ? "" : detailinfo.massifs.landtype) + '</div></div>').appendTo(blockleft);
        var blockarea = $('<div style="height:30px;width:200px;"><div style="height:30px;width:55px;padding-right:5px;display:inline-block;float:left;text-align:right;line-height:30px;">地块面积</div><div style="height:30px;width:135px;padding-left:5px;display:inline-block;line-height:30px;">' + (dev.IsNullAll(detailinfo.massifs.farmlandarea) ? "" : (dev.SqrtMetersToMu(detailinfo.massifs.farmlandarea, 3) + '(亩)')) + '</div></div>').appendTo(blockleft);
        var blockright = $('<div style="height:120px;width:116px;display:inline-block;"><div style="width:110px;height:115px;margin-top:5px; background-image: url(' + ((dev.IsNull(detailinfo.images) || detailinfo.images.length == 0) ? (dev.App.Root + "image/agri/nopic.png") : detailinfo.images[0]) + '); background-repeat: no-repeat; background-position: center;background-size:100%"></div></div>').appendTo(tempdiv);
        blockright.prop("imgs", detailinfo.images);
        blockright.click(function () {
            var imgs = $(this).prop("imgs");
            dev.PreViewPics(imgs, 0, dev.App.MapPanel.MapDOM);
        });
        var text = "";
        if (!dev.IsNull(currrow.province)) text += currrow.province;
        if (!dev.IsNull(currrow.city)) text += currrow.city;
        if (!dev.IsNull(currrow.county)) text += currrow.county;
        if (!dev.IsNull(currrow.town)) text += currrow.town;
        if (!dev.IsNull(currrow.village)) text += currrow.village;
        var blockaddress = $('<div style="height:30px;width:317px;"><div style="width:55px;padding-right:5px;display:inline-block;float:left;text-align:right;line-height:30px;height:30px;">详细地址</div><div style="height:30px;width:252px;padding-left:5px;display:inline-block;line-height:30px;">' + text + '</div></div>').appendTo(blockcontent);
        var croptitle = $('<div style="height:27px;width:319px;line-height:27px;background: linear-gradient(to right,#745dfd,#0e5fd1)"><div style="margin-left:3px;height:24px;width:24px;border-radius:12px;background-color:rgba(20, 205, 173,0.6);color:#fff;line-height:24px;text-align:center;display:inline-block;float:left;">植</div><div style="margin-left:10px;display:inline-block;height:24px;line-height:24px;color:#ffffff;">历史种植</div></div>').appendTo(detailcontent);
        if (detailinfo.crops.length > 0) {
            var cropcontent = $('<div style="width:317px;border-left:1px solid #87CEEB;border-right:1px solid #87CEEB;border-bottom:1px solid #87CEEB;"></div>').appendTo(detailcontent);
            var height = detailinfo.crops.length * 61;
            if (detailinfo.crops.length * 61 >= 180) height = 180;
            height += 1;
            cropcontent.css("height", height + "px");
            if (dev.IsNull(detailGrid)) {
                var detailgridview = $.extend({}, $.fn.datagrid.defaults.view, {
                    renderRow: function (target, fields, frozen, rowIndex, rowData) {
                        var col = [];
                        if (dev.IsNull(rowData)) return col.join('');
                        col.push('<td>');
                        col.push('<div style="width:317px;height:60px;position:relative;">');
                        col.push('<div style="display:inline-block;float:left;width:120px;height:60px;line-height:60px;text-align:center;">' + dev.GetDateString(rowData.cropdate, true) + '</div>');
                        col.push('<div style="display:inline-block;float:left;width:60px;height:60px;line-height:60px;text-align:center;">' + rowData.croptype + '</div>');
                        col.push('<div class="detailcroppic" tag="' + rowData.id + '" style="display:inline-block;width:50px;height:55px;float:right;margin-right:6px;padding-top:5px;"><div style="background-repeat: no-repeat; background-position: center;width:50px;height:50px;;background-image:url(' + ((dev.IsNull(rowData.images) || rowData.images.length == 0) ? (dev.App.Root + "image/agri/nopic.png") : (rowData.images[0])) + ');background-size:50px;"></div></div>');
                        col.push('</div>');
                        col.push('</td>');
                        return col.join('');
                    }
                });
                detailGrid = new dev.UCDataGrid({
                    ID: "cropdetailGrid",
                    View: detailgridview,
                    RowNumbers: false,
                    FitColumns: false,
                    ShowHeader: false,
                    IsPage: false,
                    pagequery: false
                });
                cropcontent.append(detailGrid.Target);
                detailGrid.Layout([]);
            }
            detailGrid.Resize(317, height);
            detailGrid.Load(detailinfo.crops);
            $(".panel-body", detailGrid.Target).css("background-color", "transparent");
            $(".detailcroppic", detailGrid.Target).click(function () {
                var tag = $(this).attr("tag");
                var cropdatas = detailGrid.DataGrid.datagrid("getData").rows;
                if (dev.IsNull(cropdatas) || cropdatas.length == 0) return;
                var c_row = Enumerable.From(cropdatas).Where('s=>s.id=="' + tag + '"').FirstOrDefault();
                if (dev.IsNull(c_row) || dev.IsNull(c_row.images) || c_row.images.length == 0) return;
                dev.PreViewPics(c_row.images, 0, dev.App.MapPanel.MapDOM);
            });
            //核查信息
            if (!dev.IsNull(showInspect)) {
                var temp = this;
                var inpecttitle = $('<div style="height:27px;width:317px;line-height:27px;border-bottom:1px dashed #eee;border-left:1px solid #ddd;border-right:1px solid #ddd;padding-top:3px;"><div style="margin-left:3px;height:24px;width:24px;border-radius:12px;background-color:#0099cc;color:#fff;line-height:24px;text-align:center;display:inline-block;float:left;">核</div><div style="margin-left:10px;display:inline-block;height:24px;line-height:24px;color:#0099cc;">任务核查</div></div>').appendTo(detailcontent);
                var inspectdetailgrid;
                var detailWin;
                $.ajax({
                    type: "get",
                    url: dev.cookie.baseUri + "inspect/query/" + showInspect,
                    dataType: "json",
                    success: function (response) {
                        if (response == null || response.statusCode != 200) {
                            return;
                        }
                        var data = response.data;
                        if (data.length == 0) {
                            return;
                        }
                        var inspectcontent = $('<div style="width:317px;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom:1px solid #ddd;"></div>').appendTo(detailcontent);
                        var height = data.length * 26;
                        if (data.length * 26 >= 130) height = 130;
                        height += 26;
                        inspectcontent.css("height", height + "px");
                        if (dev.IsNull(inspectdetailgrid)) {
                            var columns = [
                                {
                                    field: "state",
                                    width: 60,
                                    align: 'center',
                                    title: '任务状态',
                                    sortable: false,
                                    formatter: getState
                                },
                                {
                                    field: "completeterm",
                                    width: 60,
                                    align: 'center',
                                    title: '任务完成期限',
                                    sortable: false,
                                    formatter: function (value) {
                                        return dev.GetDateString(value, true);
                                    }
                                },
                                {
                                    field: "_detail",
                                    width: 60,
                                    align: 'center',
                                    title: '操作',
                                    sortable: false,
                                    formatter: function (v, r, i) {
                                        return "<a style='color: blue; text-decoration: underline' href='javascript:void(0)' tag='" + i + "'>查看详情</a>"
                                    }
                                }
                            ];
                            inspectdetailgrid = new dev.UCDataGrid({
                                ID: "inspectdetailGrid",
                                RowNumbers: false,
                                FitColumns: true,
                                IsPage: false,
                                pagequery: false
                            });
                            inspectcontent.append(inspectdetailgrid.Target);
                            inspectdetailgrid.Layout(columns);
                        }
                        inspectdetailgrid.Resize(317, height);
                        inspectdetailgrid.Load(data);
                        $("a", $(".datagrid-row", inspectdetailgrid.Target)).click(function () {
                            temp.inspectDetail($(this).attr("tag"));
                        });
                    }
                });
                var getState = function (code) {
                    if (code == "0") {
                        return "待核查";
                    }
                    else if (code == "1") {
                        return "已核查";
                    }
                    else if (code == "2") {
                        return "已审批";
                    }
                    else if (code == "3") {
                        return "审批不通过";
                    }
                    else {
                        return "未发送";
                    }
                };
                temp.inspectDetail = function (index) {
                    inspectdetailgrid.DataGrid.datagrid("selectRow", index);
                    var row = inspectdetailgrid.DataGrid.datagrid("getSelected");
                    if (dev.IsNull(detailWin)) {
                        detailWin = new dev.Window({
                            ID: "inspectDetailWin",
                            IconCls: 'machine-trackedit',
                            Title: "详细信息",
                            Parent: dev.App.FillPanel.Target,
                            Maximizable: false,
                            Modal: true,
                            Draggable: true,
                            HAlign: 'center',
                            VAlign: 'center',
                            Resizable: false,
                            Url: dev.App.Root + "html/rotation/inspectdetail.html",
                            Height: 380,
                            Width: 602,
                            Parameters: { inspectid: row.id, showdata: row }
                        });
                        detailWin.bind("onClosing", function () {

                        });
                    } else {
                        detailWin.SetUrl(dev.App.Root + "html/rotation/inspectdetail.html");
                        detailWin.Parameters = { inspectid: row.id, showdata: row };
                        detailWin.Open();
                    }
                }
            }
        }
        //拖拽
        (function () {
            var isMouseDown = false, currElement, elPos, mousePos;
            detailtitle.bind("mousedown", function (e) {
                //  if (!e.data.Draggable) return;
                isMouseDown = true;
                currElement = this;
                mousePos = { x: e.clientX, y: e.clientY };
                elPos = { l: parseInt(blockpanel[0].offsetLeft), t: parseInt(blockpanel[0].offsetTop) };
                if (currElement.setCapture) {
                    currElement.setCapture();
                    currElement.onmouseup = HeaderMouseUp;
                    currElement.onmousemove = function (ev) {
                        HeaderMouseMove(ev || event);
                    };
                }
                else $(document).bind("mouseup", HeaderMouseUp).bind("mousemove", HeaderMouseMove);
                e.preventDefault();
            });

            function HeaderMouseUp() {
                isMouseDown = false;
                currElement.releaseCapture ? (currElement.releaseCapture(), currElement.onmousemove = currElement.onmouseup = null) : ($(document).unbind("mouseup", HeaderMouseUp).unbind("mousemove", HeaderMouseMove));
            }

            function HeaderMouseMove(e) {
                if (!isMouseDown) return;
                var top = elPos.t + (e.clientY - mousePos.y);
                var left = elPos.l + (e.clientX - mousePos.x);
                if (top < 0) top = 0;
                //else if (top + blockpanel.outerHeight() > dev.App.FillPanel.Target.outerHeight()) {
                //    top = dev.App.FillPanel.Target.outerHeight() - blockpanel.outerHeight();
                //    if (top < 0) top = 0;
                //}
                if (left < 0) left = 0;
                //else if (left + blockpanel.outerWidth() > dev.App.FillPanel.Target.outerWidth()) {
                //    left = dev.App.FillPanel.Target.outerWidth() - blockpanel.outerWidth();
                //    if (left < 0) left = 0;
                //}
                blockpanel.css({ top: top + "px", left: left + "px" });
            }
        }());
    }
    //获取图层
    STreeLayerType = { Tipoc: "topic", Vector: "vector", Analysis: "analysis", XZQ: "xzq", Potree: "potree" };
    SGetTreeLayers = function (type, layersconfig) {
        var layertree = [];
        if (dev.IsNull(layersconfig)) layersconfig = dev.App.Config.Extend.LayerForTree.LayerRoot;
        if (dev.IsNull(layersconfig.length)) layertree = [dev.ObjClone(layersconfig)];
        else layertree = layersconfig.clone();
        layertree = Enumerable.From(layertree).Where('s=>s.Type.indexOf("' + type + '")>=0').ToArray();
        getnodebytype(layertree, type);
        return layertree;
    }
    function getnodebytype(nodes, type) {
        if (dev.IsNull(nodes) || dev.IsNull(type)) return;
        for (var i = 0; i < nodes.length; i++) {
            if (dev.IsNull(nodes[i].Child)) continue;
            if (dev.IsNull(nodes[i].Child.length)) nodes[i].Child = [nodes[i].Child];
            nodes[i].Child = Enumerable.From(nodes[i].Child).Where('s=>s.Type!=undefined && s.Type!=null && s.Type.indexOf("' + type + '")>=0').ToArray();
            if (!dev.IsNull(nodes[i].Child) && nodes[i].Child.length > 0) getnodebytype(nodes[i].Child, type);
        }
    }
    //图片预览
    dev.SPreViewPics = function (pics, index) {
        if (dev.IsNull(pics) || pics.length == 0) return;
        if (!dev.IsNumber(index) || index >= pics.length) index = 0;
        var imgsdiv = $('<div style="height:100%;width:100%;background:rgba(0,0,0,0.6);position:absolute;left:0px;top:0px;z-index:15;" tag="' + index + '"></div>').appendTo(dev.App.MapPanel.MapDOM);
        imgsdiv.prop("imgs", pics);
        var previewclose = $('<div style="top:0px;width:50px;height: 60px;text-align:center;right: 0px;color:rgb(255, 255, 255);line-height:55px;padding-left:10px;font-size:30px;font-weight:bold;position:absolute;border-bottom-left-radius:60px;background-color:rgba(0, 0, 0, 0.6);">×</div>').appendTo(imgsdiv);
        previewclose.mouseover(function () {
            $(this).css({ "color": "#3385ff", "cursor": "default" })
        }).mouseleave(function () {
            $(this).css("color", "#fff");
        }).click(function () {
            $(this).parent().remove();
        });
        if (pics.length > 1) {
            var previewleft = $('<div style="background:rgba(0,0,0,0.8);width:90px;height:90px;border-radius:45px;position:absolute;left:250px;top:50%;"><div style="height:90px;width:90px; background-image:url(' + dev.App.Root + "image/agri/previewleft.png" + ');background-position:center;background-repeat:no-repeat;"></div></div>').appendTo(imgsdiv);
            previewleft.mouseover(function () {
                $(this).css({ "background": "rgba(0,0,0,0.6" });
                $(this).children().css("background-image", "url(" + dev.App.Root + "image/agri/previewleft1.png)");
            }).mouseleave(function () {
                $(this).css("background", "rgba(0,0,0,0.8");
                $(this).children().css("background-image", "url(" + dev.App.Root + "image/agri/previewleft.png)");
            }).click(function () {
                var index = $(this).parent().attr("tag");
                if (dev.IsNull(index)) return;
                var imgs = $(this).parent().prop("imgs");
                if (dev.IsNull(imgs) || imgs.length == 0) return;
                index = parseInt(index);
                if (index > 0) index -= 1;
                $(this).parent().attr("tag", index);
                $(".previewimg", $(this).parent()).css("background-image", "url(" + imgs[index] + ")");
            });
            var previewright = $('<div style="background:rgba(0,0,0,0.8);width:90px;height:90px;border-radius:45px;position:absolute;right:250px;top:50%;"><div style="height:90px;width:90px;background-image:url(' + dev.App.Root + "image/agri/previewright.png" + ');background-position:center;background-repeat:no-repeat;"></div></div>').appendTo(imgsdiv);
            previewright.mouseover(function () {
                $(this).css({ "background": "rgba(0,0,0,0.6" });
                $(this).children().css("background-image", "url(" + dev.App.Root + "image/agri/previewright1.png)");
            }).mouseleave(function () {
                $(this).css("background", "rgba(0,0,0,0.8");
                $(this).children().css("background-image", "url(" + dev.App.Root + "image/agri/previewright.png)");
            }).click(function () {
                var index = $(this).parent().attr("tag");
                if (dev.IsNull(index)) return;
                var imgs = $(this).parent().prop("imgs");
                if (dev.IsNull(imgs) || imgs.length == 0) return;
                index = parseInt(index);
                if (index < imgs.length - 1) index += 1;
                $(this).parent().attr("tag", index);
                $(".previewimg", $(this).parent()).css("background-image", "url(" + imgs[index] + ")");
            });
        }

        var previewimg = $('<div id="previewimg" class="previewimg" style="height:330px;width:300px;left: 50%;top: 50%;transform: translate(-50%, -50%);position: absolute;float: left;background-image:url(' + pics[index] + ');background-position: center;background-repeat: no-repeat;background-size: contain;z-index: -1"></div>').appendTo(imgsdiv);
        var tipdiv = $('<div id="tips"></div>').appendTo(imgsdiv);
        tipdiv.css({
            "font-size": "12px", "line-height": "20px", "top": "50%", "left": "50%", "width": "50px",
            "height": "20px", "margin-top": "-10px", "margin-left": "-25px", "text-align": "center",
            "color": "#fff", "background-color": "#000", "border-radius": "10px", "position": "absolute", "display": "none"
        });
        imgsdiv.bind("mousewheel", function () {
            var $this = $("#previewimg");
            var zoom = parseInt($this[0].style.zoom, 10) || 100;
            zoom += event.wheelDelta / 2; //可适合修改
            if (zoom >= 520) { zoom = 520; }
            if (zoom > 0) {
                $this[0].style.zoom = zoom + "%";
                $this.next().text(zoom + '%')
            }
            tipdiv.show("fast", function () { tipdiv.stop().fadeOut(3000); })
            return false;
        });
        imgsdiv[0].addEventListener("DOMMouseScroll", function (event) {
            var $this = $("#previewimg");
            var zoom = parseInt($this[0].style.zoom, 10) || 100;
            zoom += event.detail * 40 / 2; //可适合修改
            if (zoom >= 520) { zoom = 520; }
            if (zoom > 0) {
                // $this[0].style.zoom = zoom + "%";
                $this.css({
                    '-moz-transform': 'scale(' + zoom + '%)',
                    'transform-origin': 'center top'
                });
                $this.css('zoom', zoom + "%");
                $this.next().text(zoom + '%')
            }
            tipdiv.show("fast", function () { tipdiv.stop().fadeOut(3000); })
            return false;
        });
    }
    SgeomArae = function (polygon) {
        if (dev.IsNull(polygon)) return null;
        var wgs84Sphere = new ol.Sphere(6378137);
        var sourceProj = dev.App.Map.getView().getProjection();
        var geom = (polygon.clone().transform(sourceProj, 'EPSG:4326'));
        var coordinates = geom.getCoordinates();
        var area = Math.abs(wgs84Sphere.geodesicArea(coordinates));
        area = (Math.round(area * 100) / 100)
        return area;
    }
    /*初始化formatGML*/
    SInitFormatGML = function (opt) {
        var gml = new ol.format.GML({
            featureNS: opt.featureNS,
            featureType: opt.featureType,
            srsName: dev.IsNull(opt.srsName) ? "EPSG:4326" : opt.srsName
        });
        return gml;
    }
    //初始化编辑图层xml
    SgetWFSInsetXml = function (feature, opt) {
        if (dev.IsNull(feature) || dev.IsNull(opt)) return null;
        var formatgml = SInitFormatGML(opt);
        var geomType = feature.getGeometry().getType();
        var geomstr = dev.GetWKTByFeature(feature, false);
        geomstr = geomstr.substring(geomstr.lastIndexOf('(') + 1, geomstr.indexOf(')'));
        geomstr = geomstr.replace(/,/g, ' ');
        var str = '<Transaction xmlns="http://www.opengis.net/wfs" service="WFS" version="1.1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd">';
        str += '<Insert>';
        str += '<' + formatgml.featureType + ' xmlns="' + formatgml.featureNS + '">';
        str += '<' + opt.GeomField + '>';
        if (geomType == "MultiPolygon") {
            str += '<' + geomType + ' xmlns="http://www.opengis.net/gml">';
            str += '<polygonMember><Polygon>';
            str += '<exterior><LinearRing><posList>' + geomstr + '</posList></LinearRing></exterior>';
            str += ' </Polygon></polygonMember>';
            str += '</' + geomType + '>';
        }
        if (geomType == "Polygon") {
            str += '<' + geomType + ' xmlns="http://www.opengis.net/gml">';
            str += '<exterior><LinearRing><posList>' + geomstr + '</posList></LinearRing></exterior>';
            str += '</' + geomType + '>';
        }
        str += '</' + opt.GeomField + '>';
        $.each(feature.getProperties(), function (o, i) {
            if (o != "geometry") str += '<' + o + '>' + (dev.IsNull(i) ? "" : i) + '</' + o + '>';
        });
        str += '</' + formatgml.featureType + '>';
        str += '</Insert>';
        str += '</Transaction>';
        return str;
    }
})(jQuery);

//冒泡控件
/*dev.UCMapTip*/
(function ($) {
    function CreateIconStyle(icon) {
        var className = 'MapTipHeadICon';
        dev.InsertIconRule(dev.App.TempStyle, "." + className, icon);
        return className;
    };

    function GetContent(popup, con, url) {
        var content = null;
        if (!dev.IsNull(url)) {
            var waitbox = new dev.UCWaitBox(popup.popup);
            content = dev.CreateFrame(url, false);
            content.bind('load', function () {
                waitbox.Close();
                $(popup).trigger("onLoaded", { Parent: popup, Data: popup.ID });
            });
            waitbox.Show();
        }
        else if (!dev.IsNull(con)) {
            content = dev.IsString(con) ? $('<p>' + con + '</p>') : con;
            $(popup).trigger("onLoaded", { Parent: popup, Data: popup.ID });
        }
        return content;
    };

    function DeleteRule(name) {
        for (var i = 0; i < dev.App.TempStyle.cssRules.length; i++)
            if (dev.App.TempStyle.cssRules[i]["selectorText"] == name) {
                if (dev.App.TempStyle.removeRule) {
                    dev.App.TempStyle.removeRule(i);
                    if (dev.App.TempStyle.cssRules[i]["selectorText"] == name)
                        dev.App.TempStyle.removeRule(i)
                    break;
                }
                else if (dev.App.TempStyle.deleteRule) {
                    dev.App.TempStyle.deleteRule(i);
                    if (dev.App.TempStyle.cssRules[i]["selectorText"] == name)
                        dev.App.TempStyle.deleteRule(i);
                    break;
                }
            }
    };

    /*根据冒泡的三角形指向的方向生成冒泡窗体*/
    function CreateStyleOfMaptip(maptip) {
        var triangleBottom = 22;
        var triangleHeight = 15;
        var olpopup = "position: absolute;padding: 0px;margin: 0px;min-width:" + maptip.MinWidth + "px;";
        var olpopupafterAndbefore = "content: \" \";height: 0; width: 0;position: absolute;pointer-events: none;";
        var olpopupafter = "";
        var olpopupbefore = "";
        switch (maptip.TrianglePosition) {
            case dev.TrianglePosition.Top:
                olpopup += "top:" + (triangleHeight - 1) + "px;left: " + -(maptip.Width / 2 + 2) + "px;";
                olpopupafterAndbefore += " left:" + (maptip.Width + triangleBottom) / 2 + "px;";
                olpopupafter = "top: " + -(triangleHeight - 1) + "px;margin-left: -20px;"
                    + " border-bottom: " + triangleHeight + "px solid " + maptip.TriangleColor + ";"
                    + "border-left: " + triangleBottom / 2 + "px solid transparent;"
                    + "border-right:  " + triangleBottom / 2 + "px solid transparent;";
                olpopupbefore = "top: " + -(triangleHeight) + "px;margin-left: -22px;"
                    + "border-bottom: " + (triangleHeight + 1) + "px solid rgb(149,184,231);"
                    + "border-left: " + (triangleBottom / 2 + 2) + "px solid transparent;"
                    + " border-right: " + (triangleBottom / 2 + 2) + "px solid transparent;";
                break;
            case dev.TrianglePosition.Bottom:
                olpopup += "bottom:" + (triangleHeight - 1) + "px;left: " + -(maptip.Width / 2 + 2) + "px;";
                olpopupafterAndbefore += " left:" + (maptip.Width + triangleBottom) / 2 + "px;";
                olpopupafter = "bottom: " + -(triangleHeight - 1) + "px;margin-left: -20px;"
                    + " border-top: " + triangleHeight + "px solid " + maptip.TriangleColor + ";"
                    + "border-left: " + triangleBottom / 2 + "px solid transparent;"
                    + "border-right:  " + triangleBottom / 2 + "px solid transparent;";
                olpopupbefore = "bottom: " + -(triangleHeight) + "px;margin-left: -22px;"
                    + "border-top: " + (triangleHeight + 1) + "px solid rgb(149,184,231);"
                    + "border-left: " + (triangleBottom / 2 + 2) + "px solid transparent;"
                    + " border-right: " + (triangleBottom / 2 + 2) + "px solid transparent;";
                break;
            case dev.TrianglePosition.Left:
                olpopup += "left:" + triangleHeight + "px;top: " + -(maptip.Height / 2 + 2) + "px;";
                olpopupafterAndbefore += " top: " + (maptip.Height + triangleBottom) / 2 + "px;";
                olpopupafter = "left: " + -(triangleHeight - 1) + "px;margin-top: -20px;"
                    + " border-right: " + triangleHeight + "px solid " + maptip.TriangleColor + ";"
                    + "border-bottom: " + triangleBottom / 2 + "px solid transparent;"
                    + "border-top:  " + triangleBottom / 2 + "px solid transparent;";
                olpopupbefore = "left: " + -(triangleHeight) + "px;margin-top: -22px;"
                    + "border-right: " + (triangleHeight + 1) + "px solid rgb(149,184,231);"
                    + "border-bottom: " + (triangleBottom / 2 + 2) + "px solid transparent;"
                    + " border-top: " + (triangleBottom / 2 + 2) + "px solid transparent;";
                break;
            case dev.TrianglePosition.Right:
                olpopup += "right:" + (triangleHeight - 1) + "px;top: " + -(maptip.Height / 2 + 2) + "px;";
                olpopupafterAndbefore += " top:" + (maptip.Height + triangleBottom) / 2 + "px;";
                olpopupafter = "right: " + -(triangleHeight - 1) + "px;margin-top: -20px;"
                    + " border-left: " + triangleHeight + "px solid " + maptip.TriangleColor + ";"
                    + "border-bottom: " + triangleBottom / 2 + "px solid transparent;"
                    + "border-top:  " + triangleBottom / 2 + "px solid transparent;";
                olpopupbefore = "right: " + -(triangleHeight) + "px;margin-top: -22px;"
                    + "border-left: " + (triangleHeight + 1) + "px solid rgb(149,184,231);"
                    + "border-bottom: " + (triangleBottom / 2 + 2) + "px solid transparent;"
                    + " border-top: " + (triangleBottom / 2 + 2) + "px solid transparent;";
                break;
        }
        DeleteRule(".ol-popup");
        dev.InsertRule(dev.App.TempStyle, ".ol-popup", olpopup);
        DeleteRule(".ol-popup::after");
        dev.InsertRule(dev.App.TempStyle, ".ol-popup:after", olpopupafterAndbefore + olpopupafter);
        DeleteRule(".ol-popup::before");
        dev.InsertRule(dev.App.TempStyle, ".ol-popup:before", olpopupafterAndbefore + olpopupbefore);
    };

    function LayoutMaptip(sreenPoint, maptipWidth, maptipHeight) {
        var left = sreenPoint[0];
        var top = sreenPoint[1];
        var right = dev.App.MapPanel.MapDOM.width() - left;
        var bottom = dev.App.MapPanel.MapDOM.height() - top;
        var position;
        if (left > maptipWidth + 20 && bottom > maptipHeight / 2 && top > maptipHeight / 2)
            position = dev.TrianglePosition.Right;
        else if (right > maptipWidth + 20 && bottom > maptipHeight / 2 && top > maptipHeight / 2)
            position = dev.TrianglePosition.Left;
        else if (top > maptipWidth + 20 && left > maptipHeight / 2 && right > maptipHeight / 2)
            position = dev.TrianglePosition.Bottom;
        else if (bottom > maptipWidth + 20 && left > maptipHeight / 2 && right > maptipHeight / 2)
            position = dev.TrianglePosition.Top;
        else position = dev.TrianglePosition.Bottom;
        return position;
    };
    SUCMapTip = function (param) {
        this.ID = dev.IsNull(param.ID) ? "maptip" : param.ID;
        this.Title = dev.IsNull(param.Title) ? "信息提示" : param.Title;
        this.IconUri = dev.IsNull(param.IconUri) ? null : param.IconUri;
        this.Content = param.Content;
        this.Url = param.Url;
        this.Offset = dev.IsNull(param.Offset) ? [0, 0] : param.Offset;
        this.Position = dev.IsNull(param.Position) ? undefined : param.Position;
        this.Positioning = dev.IsNull(param.Positioning) ? 'top-left' : param.Positioning;
        this.StopEvent = !dev.IsBoolean(param.StopEvent) ? true : param.StopEvent;
        this.InsertFirst = !dev.IsBoolean(param.InsertFirst) ? true : param.InsertFirst;
        this.AutoPan = !dev.IsBoolean(param.AutoPan) ? true : param.AutoPan;
        this.AutoPanAnimation = dev.IsNull(param.AutoPanAnimation) ? { duration: 250 } : param.AutoPanAnimation;
        this.AutoPanMargin = dev.IsNull(param.AutoPanMargin) ? 20 : param.AutoPanMargin;
        this.MinWidth = !dev.IsNumber(param.MinWidth) ? 50 : param.MinWidth;
        this.Collapsible = !dev.IsBoolean(param.Collapsible) ? false : param.Collapsible;
        this.Maximizable = !dev.IsBoolean(param.Maximizable) ? false : param.Maximizable;
        this.Width = !dev.IsNumber(param.Width) ? 200 : param.Width;
        this.Height = !dev.IsNumber(param.Height) ? 150 : param.Height;
        this.TrianglePosition = dev.IsNull(param.TrianglePosition) ? dev.TrianglePosition.Bottom : param.TrianglePosition;
        this.TriangleColor = dev.IsNull(param.TriangleColor) ? (this.TrianglePosition === dev.TrianglePosition.Top ? "rgb(238,245,255)" : "rgb(255,255,255)") : param.TriangleColor;
        this.Visible = !dev.IsBoolean(param.Visible) ? true : param.Visible;
        var triangleBottom = 22;
        var triangleHeight = 15;
        CreateStyleOfMaptip(this);
        this.popup = $('<div id=' + this.ID + ' class="ol-popup" >'
            + '<div id="tipContent"  class="easyui-panel" title="' + this.Title + '" style="width: ' + this.Width
            + 'px; height: ' + this.Height + 'px;overflow:hidden;" data-options="iconCls:\'' + CreateIconStyle(this.IconUri)
            + '\',closable:true,collapsible:' + this.Collapsible + ',minimizable:false,maximizable:' + this.Maximizable + '">'
            + '</div></div>');

        this.content = this.popup.children('div#tipContent');
        this.Target = new ol.Overlay({
            id: this.ID,
            element: this.popup[0],
            offset: this.Offset,
            positioning: this.Positionings,
            stopEvent: this.StopEvent,
            insertFirst: this.InsertFirst,
            autoPan: this.AutoPan,
            autoPanAnimation: this.AutoPanAnimation,
            autoPanMargin: this.AutoPanMargin
        });
        $.extend(SUCMapTip.prototype, this.Target);
        dev.App.Map.addOverlay(this.Target);
        this.SetPosition(this.Position);
        this.tipContent = this.content.panel({
            onClose: function (sender) {
                $($this).trigger("onClosed");
                $this.tipContent.trigger("onClosed");
                dev.App.Map.removeOverlay($this.Target);
                $this.tipContent.panel("destroy");
            }
        });
        this.content.append(GetContent(this, this.Content, this.Url));
        this.Win = this.popup;
        var $this = this;
        //拖拽
        (function () {
            var isMouseDown = false, currElement, elPos, mousePos;
            $this.popup.bind("mousedown", $this, function (e) {
                isMouseDown = true, currElement = this;
                mousePos = { x: e.clientX, y: e.clientY };
                elPos = { l: parseInt(e.data.Win[0].offsetLeft), t: parseInt(e.data.Win[0].offsetTop) };
                if (currElement.setCapture) {
                    currElement.setCapture();
                    currElement.onmouseup = HeaderMouseUp;
                    currElement.onmousemove = function (ev) {
                        HeaderMouseMove(ev || event);
                    };
                }
                else $(document).bind("mouseup", HeaderMouseUp).bind("mousemove", HeaderMouseMove);
                e.preventDefault();
            });

            function HeaderMouseUp() {
                isMouseDown = false;
                currElement.releaseCapture ? (currElement.releaseCapture(), currElement.onmousemove = currElement.onmouseup = null) : ($(document).unbind("mouseup", HeaderMouseUp).unbind("mousemove", HeaderMouseMove));
            }

            function HeaderMouseMove(e) {
                if (!isMouseDown) return;
                var top = elPos.t + (e.clientY - mousePos.y);
                var left = elPos.l + (e.clientX - mousePos.x);
                $this.Win.css({ top: ($this.Top = top) + "px", left: ($this.Left = left) + "px" });
                DeleteRule(".ol-popup::after");
                DeleteRule(".ol-popup::before");
            }
        }());
    };
    $.fn.extend(SUCMapTip.prototype, {
        SetVisible: function (visible) {
            if (!dev.IsBoolean(visible)) return;
            if (this.Visible == visible) return;
            this.Visible = visible;
            this.Target.setPosition(this.Visible ? this.Position : undefined);
        },
        SetTitle: function (title) {
            if (dev.IsNull(title)) return;
            this.tipContent.panel("setTitle", title);
            this.Title = title;
        },
        SetIcon: function (iconUri) {
            if (!dev.IsString(iconUri)) return;
            this.IconUri = iconUri;
            this.tipContent.panel({ iconCls: CreateIconStyle(iconUri) });
        },
        SetIconcls: function (className) {
            if (!dev.IsString(className)) return;
            this.tipContent.panel({ iconCls: className });
        },
        SetOffset: function (left, top) {
            if (dev.IsNull(left) && dev.IsNull(top)) return;
            this.Target.setOffset(this.Offset = [left, top]);
        },
        SetPosition: function (coordion) {
            if (dev.IsNull(coordion)) return;
            var screenpoint = dev.App.Map.getPixelFromCoordinate(coordion);
            this.TrianglePosition = LayoutMaptip(screenpoint, this.Width, this.Height);
            this.TriangleColor = this.TrianglePosition === dev.TrianglePosition.Top ? "rgb(238,245,255)" : "rgb(255,255,255)";
            CreateStyleOfMaptip(this);
            this.Target.setPosition(coordion);
        },
        SetPositioning: function (positioning) {
            if (!dev.IsString(positioning)) return;
            this.Target.setPositioning(positioning);
        },
        SetCollapse: function (collapse) {
            if (!dev.IsBoolean(collapse)) return;
            this.tipContent.panel(collapse ? "collapse" : "expand");
        },
        Show: function () {
            this.tipContent.panel("open");
        },
        Close: function () {
            this.tipContent.panel("close");
        },
        Add: function (element, url) {
            if (dev.IsNull(element) && dev.IsNull(url)) return;
            var content = GetContent(this, element, url);
            if (!dev.IsNull(element)) this.tipContent.append(content);
            else if (!dev.IsNull(url)) this.tipContent.html(content);
        },
        Remove: function (element) {
            element = dev.IsString(element) ? $('#' + element) : (dev.IsObject(element) ? $(element) : null);
            if (element == null) return;
            var contentID = this.tipContent.attr('id');
            if (element.attr('id') === this.ID && element.attr('id') === contentID) return;
            if (element.parents('#' + contentID).length > 0) element.remove();
        },
        SetHeight: function (height) {
            if (dev.IsNull(height) || !dev.IsNumber(height)) return;
            this.tipContent.panel("resize", { width: this.Width, height: height });
        },
        Clear: function () {
            this.tipContent.panel("clear");
        }
    });
})(jQuery);

//属性查询
(function ($) {
    function HighLight(feature) {
        hightlightlocation(feature.getProperties().massifid);
        if (!dev.IsNull(polyganKey)) {
            dev.App.Map.unByKey(polyganKey);
            polyganKey = null;
        }
        polyganKey = dev.MapUtils.LineSymbolStyle(feature);
        var extent = feature.getGeometry().getExtent();
        dev.App.Map.getView().centerOn([((extent[0] + extent[2]) / 2), ((extent[1] + extent[3]) / 2)], dev.App.Map.getSize(), [dev.App.Map.getSize()[0] / 2, dev.App.Map.getSize()[1] / 2]);
    }

    function hightlightlocation(massifid) {
        isred = false;
        if (dev.IsNull(massifid)) isred = true;
        var currdatas = dataGrid.DataGrid.datagrid("getData").rows;
        for (var i = 0; i < currdatas.length; i++) {
            var fid = "locationf" + currdatas[i].massifid;
            var tempfeature = dev.MapUtils.GetFeatureByID(fid, "globalQueryLayer");
            var iconurl = dev.App.Root + "image/poi_red.png";
            if (!isred && massifid == currdatas[i].massifid) iconurl = dev.App.Root + "image/poi_blue.png";
            tempfeature.setStyle(new ol.style.Style({
                image: new ol.style.Icon({ src: iconurl, anchor: [0.5, 1] }),
                text: new ol.style.Text({
                    text: (i + 1).toString(),
                    font: "15px serif",
                    fill: new ol.style.Fill({ color: [255, 255, 255, 1] }),
                    offsetX: 0,
                    offsetY: -22
                })
            }));
        }
    }
    function InitGrid($this, parent, selectlayerinfo) {
        var gridView = $.extend({}, $.fn.datagrid.defaults.view, {
            renderRow: function (target, fields, frozen, rowIndex, rowData) {
                var col = [];
                if (dev.IsNull(rowData) || dev.IsNull(rowData.massifid)) return col.join('');
                var name = rowData.massifid + "(" + rowData.farmername + ")";
                var address = "";
                if (!dev.IsNull(rowData.province) && rowData.province != "undefined") address += rowData.province;
                if (!dev.IsNull(rowData.city) && rowData.city != "undefined") address += rowData.city;
                if (!dev.IsNull(rowData.county) && rowData.county != "undefined") address += rowData.county;
                if (!dev.IsNull(rowData.town)) address += rowData.town;
                if (!dev.IsNull(rowData.village)) address += rowData.village;
                name = dev.IsNull(name) ? "暂无信息" : name;
                address = dev.IsNull(address) ? "暂无信息" : address;
                col.push('<td>');
                col.push(' <div class="blockrow" tag="' + rowData.massifid + '" style="width:357px; height: 60px; margin: 5px; position: relative;">');
                col.push(' <span style="width: 24px; height: 36px; position: absolute; left: 3px; top: 6px; background-image: url(../image/poi_red.png)">');
                col.push('   <b style="font-size: 15px; color: white; position: absolute; left: 8px; top: 3px;">' + (rowIndex + 1) + '</b></span>');
                col.push(' <span style="position: absolute; left: 35px; top: 10px; color: blue;">' + name + '</span>');
                col.push(' <span style="position: absolute; left: 35px; top: 35px;">' + address + '</span>');
                col.push('</div>');
                col.push('</td>');
                return col.join('');
            }
        });
        dataGrid = new dev.UCDataGrid({
            ID: "resultGrid",
            View: gridView,
            RowNumbers: false,
            FitColumns: false,
            ShowHeader: false,
            PageIndex: $this.PageIndex,
            PageSize: $this.PageSize,
            pagequery: false,
            SimplePageMsg: true
        });
        parent.append(dataGrid.Target);
        dataGrid.Layout([]);
        $(".datagrid-header", dataGrid.Target).css("border", "0px");
        dataGrid.Target.bind("onSelectPage", function (s, e) {
            $this.PageIndex = e.index;
            var clayer = dataGrid.Target.prop("clayer");
            queryData(clayer, $this);
        });
        dataGrid.Target.bind("onClickRow", function (s, e) {
            //高亮并显示详细信息
            var currfeature = new ol.Feature(e.Row.geom);
            currfeature.setProperties(e.Row);
            HighLight(currfeature);
            //查询详细
            queryDetail(e.Row, $this);
        });
        dataGrid.Target.prop("clayer", selectlayerinfo);
    }

    function InitDetailGrid($this, parent) {
        var detailgridview = $.extend({}, $.fn.datagrid.defaults.view, {
            renderRow: function (target, fields, frozen, rowIndex, rowData) {
                var col = [];
                if (dev.IsNull(rowData)) return col.join('');
                col.push('<td>');
                col.push('<div style="width:317px;height:60px;position:relative;">');
                col.push('<div style="display:inline-block;float:left;width:120px;height:60px;line-height:60px;text-align:center;">' + dev.GetDateString(rowData.cropdate, true) + '</div>');
                col.push('<div style="display:inline-block;float:left;width:60px;height:60px;line-height:60px;text-align:center;">' + rowData.croptype + '</div>');
                col.push('<div class="detailcroppic" tag="' + rowData.id + '" style="display:inline-block;width:50px;height:55px;float:right;margin-right:6px;padding-top:5px;"><div style="background-repeat: no-repeat; background-position: center;width:50px;height:50px;;background-image:url(' + ((dev.IsNull(rowData.images) || rowData.images.length == 0) ? (dev.App.Root + "image/agri/nopic.png") : (rowData.images[0])) + ');background-size:50px;"></div></div>');
                col.push('</div>');
                col.push('</td>');
                return col.join('');
            }
        });
        detailGrid = new dev.UCDataGrid({
            ID: "cropdetailGrid",
            View: detailgridview,
            RowNumbers: false,
            FitColumns: false,
            ShowHeader: false,
            IsPage: false,
            pagequery: false
        });
        parent.append(detailGrid.Target);
        detailGrid.Layout([]);
    }
    function getlayers() {
        var code = dev.App.Config.SystemMap.Position.Code;
        var type = dev.App.Config.SystemMap.Position.Type;
        searchlayers = [];
        var layerconfigs = dev.App.Config.Extend.LayerForTree.LayerRoot;
        if (dev.IsNull(layerconfigs)) return;
        var templayers = layerconfigs.clone();
        templayers = Enumerable.From(templayers).Where('s=>s.Type.indexOf("global")>=0').ToArray();
        if (dev.IsNull(templayers) || templayers.length == 0) return;
        getlayer(templayers, code);
    }

    function getlayer(datalayers, code, issub, parentcode) {
        if (dev.IsNull(datalayers)) return;
        if (dev.IsNull(datalayers.length)) datalayers = [datalayers];
        var templayers = Enumerable.From(datalayers).Where('s=>s.Type!=null && s.Type.indexOf("global")>=0').ToArray();
        if (dev.IsNull(templayers) || templayers.length == 0) return;
        for (var i = 0; i < templayers.length; i++) {
            if (!issub) {
                if (templayers[i].ID != code) {
                    if (dev.IsNull(templayers[i].Child) || (!dev.IsNull(templayers[i].length) && templayers[i].Child.length == 0)) continue;
                    getlayer(templayers[i].Child, code, false, templayers[i].ID);
                }
                else {
                    if (!dev.IsNull(templayers[i].IsLayer) && templayers[i].IsLayer == "true") {
                        templayers[i].code = parentcode;
                        searchlayers.push(templayers[i]);
                    }
                    if (dev.IsNull(templayers[i].Child) || (!dev.IsNull(templayers[i].length) && templayers[i].Child.length == 0)) break;
                    getlayer(templayers[i].Child, code, true, templayers[i].ID);
                }
            }
            else {
                if (!dev.IsNull(templayers[i].IsLayer) && templayers[i].IsLayer == "true") {
                    templayers[i].code = parentcode;
                    searchlayers.push(templayers[i]);
                }
                else {
                    if (dev.IsNull(templayers[i].Child) || (!dev.IsNull(templayers[i].length) && templayers[i].Child.length == 0)) continue;
                    getlayer(templayers[i].Child, code, issub, templayers[i].ID);
                }
            }
        }
    }

    function getcontent(layers, $this) {
        if (dev.IsNull(layers) || layers.length == 0) return;
        if (layers.length == 1) {
            if (!dev.IsNull(dataGrid)) {
                dataGrid.Target.remove();
                dataGrid = null;
            }
            InitGrid($this, $this.Content, layers[0]);
            dataGrid.Resize(317, 512);
        }
        else {
            var width = layers.length > 4 ? 308 : 317;
            var height = layers.length > 4 ? 392 : (512 - (layers.length * 30));
            for (var i = 0; i < layers.length; i++) {
                var accordion = $('<div class="resultaccordion" style="width:' + width + 'px;"></div>').appendTo($this.Content);
                var accordiontitle = $('<div class="title" style="background-color: rgba(20, 205, 173,0.6)"><span style="margin-left:10px;line-height:26px;color:#fcfcfc">' + layers[i].Text + '</span><a class="icon-arrow-down"></a></div>').appendTo(accordion);
                accordiontitle.prop("layerinfo", layers[i]);
                $("a", accordiontitle).click(function () {
                    $('.accordioncontent', $this.Content).css("display", "none");
                    if (!dev.IsNull(dataGrid)) {
                        dataGrid.Target.remove();
                        dataGrid = null;
                    }
                    if ($(this).hasClass("icon-arrow-down")) {
                        $("a", $this.Content).removeClass("icon-arrow-up").addClass("icon-arrow-down");
                        $(this).parent().next().css("display", "block");
                        $(this).addClass("icon-arrow-up").removeClass("icon-arrow-down");
                        var c_layer = $(this).parent().prop("layerinfo");
                        InitGrid($this, $(this).parent().next(), c_layer);
                        $(".panel-body", dataGrid.Target).css("background-color", "transparent");
                        $(".datagrid-pager", dataGrid.Target).css("background-color", "#b7d2ff");
                        dataGrid.Resize(width, height);
                        //对该图层进行查询

                        if (!dev.IsNull(c_layer)) queryData(c_layer, $this);
                    }
                    else {
                        $(this).addClass("icon-arrow-down").removeClass("icon-arrow-up");
                        $(this).parent().next().css("display", "none");
                    }
                });
                var accordioncontent = $('<div class="accordioncontent" style="height:' + height + 'px;width:100%;display:none;"></div>').appendTo(accordion);
            }
            $(".accordioncontent:eq(0)", $this.Content).css("display", "block");
            $("a", $(".title:eq(0)", $this.Content)).addClass("icon-arrow-up").removeClass("icon-arrow-down");
            if (!dev.IsNull(dataGrid)) {
                dataGrid.Target.remove();
                dataGrid = null;
            }
            InitGrid($this, $(".accordioncontent:eq(0)", $this.Content), layers[0]);
            dataGrid.Resize(width, height);
        }
        $(".panel-body", dataGrid.Target).css("background-color", "transparent");
        $(".datagrid-pager", dataGrid.Target).css("background-color", "#b7d2ff");
        queryData(layers[0], $this);
    }

    function queryData(layer, $this) {
        var param = { pageIndex: $this.PageIndex, pageSize: $this.PageSize };
        if (!dev.IsNull(drawfeature)) {
            var wkt = dev.GetWKTByFeature(drawfeature, false);
            if (drawfeature.getGeometry().getType() === "Circle") {
                param.geom = wkt[0];
                param.radius = wkt[1];
            }
            else param.geom = wkt;
        }
        //   var searchkey = $this.TextControl.GetValue().trim();
        var searchkey = $this.searchkey;
        param.condition = "";
        if (!dev.IsNull(searchkey)) param.condition = "(\"NAME\" LIKE '%" + searchkey + "%' OR \"CARDID\" LIKE '%" + searchkey + "%' OR \"MOBILEPHONE\" LIKE '%" + searchkey + "%')";
        if (!dev.IsNull($this.orgFilter)) param.condition += (dev.IsNull(param.condition) ? "" : " AND ") + "\"ORGID\" IN (" + $this.orgFilter + ")";
        param.region = layer.code;
        $.ajax({
            url: dev.MapLoad.GetUrlByRelID("Service") + "massif/getbypage",
            type: "POST",
            dataType: "json",
            data: param,
            success: function (result) {
                if (dev.IsNull(result.data)) result.data = { dataSource: [], pageInfo: { total: 0, pageNumber: 1 } };
                data = result.data;
                for (var i = 0; i < data.dataSource.length; i++) data.dataSource[i].geom = SGeomByWKT(data.dataSource[i].geom);
                showpagefeature(data.dataSource, $this);
                dataGrid.Load(data.dataSource, data.pageInfo);
                $(".datagrid-row", dataGrid.Target).mouseover(function () {
                    var tag = $(".blockrow", $(this)).attr("tag");
                    hightlightlocation(tag);
                }).mouseleave(function () {
                    if ($this.resultPanel.css("display") == "block") hightlightlocation();
                });
            }
        });
    }

    function queryDetail(row, $this) {
        $.ajax({
            url: dev.MapLoad.GetUrlByRelID("Service") + "massif/detail/" + row.massifid + "?" + new Date().getTime(),
            type: "GET",
            dataType: "json",
            success: function (result) {
                if (dev.IsNull(result.data) || (dev.IsNull(result.data.farmer) && result.data.crops.length == 0)) return;
                $this.resultPanel.css("display", "none");
                $this.detailPanel.css("display", "block");
                showdetail(result.data, row, $this);
            }
        });
    }

    function showpagefeature(datas, $this) {
        //清空图层
        if (dev.IsNull(globallayer)) {
            globallayer = new ol.layer.Vector({
                id: "globalQueryLayer",
                opacity: 1.0,
                zIndex: 9999,
                type: "TempVector",
                visible: true,
                source: new ol.source.Vector({})
            });
            dev.App.Map.addLayer(globallayer);
        }
        else dev.MapUtils.ClearFeature("globalQueryLayer");
        if (dev.IsNull(datas) || datas.length == 0) {
            //$this.resultPanel.css("display", "none");
            dialog = new dev.Messager({ Height: 95, Width: 200, AutoShow: false, Type: "info", Timeout: 1500, ButtonVisible: false, AutoVisible: true, Effect: "normal" });
            dialog.Alert("没有对应的查询数据!", "info");
            return;
        }
        $this.resultPanel.css("display", "block");
        var features = [];
        var locationfeatures = [];
        for (var i = 0; i < datas.length; i++) {
            var feature = new ol.Feature(datas[i].geom);
            feature.setStyle(new ol.style.Style({
                fill: new ol.style.Fill({ color: [230, 152, 0, 0.5] }),
                stroke: new ol.style.Stroke({ width: 2, color: [230, 152, 0, 1] })
            }));
            feature.setProperties(datas[i]);
            features.push(feature);
            //获取对应的中心点
            var extent = datas[i].geom.getExtent();
            var point = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
            var c_loctionf = new ol.Feature(new ol.geom.Point(point));
            c_loctionf.setProperties(datas[i]);
            c_loctionf.setId("locationf" + datas[i].massifid);
            c_loctionf.setStyle(new ol.style.Style({
                image: new ol.style.Icon({ src: dev.App.Root + "image/poi_red.png", anchor: [0.5, 1] }),
                text: new ol.style.Text({
                    text: (i + 1).toString(),
                    font: "15px serif",
                    fill: new ol.style.Fill({ color: [255, 255, 255, 1] }),
                    offsetX: 0,
                    offsetY: -22
                })
            }));
            locationfeatures.push(c_loctionf);
        }
        if (features.length == 0) return;
        dev.MapUtils.AddFeatures(locationfeatures, "globalQueryLayer");
        dev.MapUtils.AddFeatures(features, "globalQueryLayer");
        //显示范围
        var extent = dev.getExtentByFeatures(features);
        dev.App.Map.getView().centerOn([((extent[0] + extent[2]) / 2), ((extent[1] + extent[3]) / 2)], dev.App.Map.getSize(), [dev.App.Map.getSize()[0] / 2, dev.App.Map.getSize()[1] / 2]);
        dev.App.Map.getView().setZoom(15);
    }

    function showdetail(detailinfo, currrow, $this) {
        $this.detailPanel.empty();
        detailGrid = null;
        var detaildiv = $('<div style="width:317px;"></div>').appendTo($this.detailPanel);
        var backrow = $('<div style="height:30px;width:100%;background-color:rgba(20, 205, 173,0.6);line-height:30px;color:#ffffff;cursor:pointer;border:1px solid #87CEEB;"><span style="margin-left:15px;"><&nbsp;返回</span></div>').appendTo(detaildiv);
        backrow.click(function () {
            $this.resultPanel.css("display", "block");
            $this.detailPanel.css("display", "none");
            $this.detailPanel.empty();
            detailGrid = null;
            dataGrid.DataGrid.datagrid("unselectAll");
            if (!dev.IsNull(polyganKey)) {
                dev.App.Map.unByKey(polyganKey);
                polyganKey = null;
            }
            hightlightlocation();
        });
        var detailcontent = $('<div style="width:319px;margin-top:10px;background-color:rgba(20, 205, 173,0.6);"></div>').appendTo(detaildiv);
        var detailtitle = $('<div style="height:30px;background:#14cdad;width:100%;color:#fff;line-height:30px;font-size:14px;"><span style="margin-left:5px;">基本信息</span></div>').appendTo(detailcontent);
        var framercontent = $('<div style="height:125px;width:317px;border-left:1px solid #87CEEB;border-right:1px solid #87CEEB;"></div>').appendTo(detailcontent);
        var framerleft = $('<div style="height:95px;width:95px;display:inline-block;float:left;"><div style="height:80px;width:80px;margin-top:15px;margin-left:15px;border-radius:40px;background-image:url(' + (dev.IsNull(detailinfo.farmerImages[0]) ? (dev.App.Root + "image/agri/nopic.png") : (detailinfo.farmerImages[0])) + ');background-repeat: no-repeat; background-position: center; background-size: 80px 80px;"></div></div>').appendTo(framercontent);
        var framerright = $('<div style="width:212px;height:90px;margin-top:10px;display:inline-block;margin-left:10px;"></div>').appendTo(framercontent);
        var framername = $('<div style="height:30px;width:222px;"><div style="padding-left:5px; height:30px;line-height:30px;display:inline-block;color:#ffffff;text-decoration: underline;"><a tag="' + detailinfo.farmer.id + '">' + detailinfo.farmer.name + '</a></div></div>').appendTo(framerright);
        $('a', framername).click(function () {
            var tag = $(this).attr("tag");
            if (dev.IsNull(tag)) return;
            farmerdetailWin = new dev.Window({
                ID: "farmerWin",
                IconCls: "icon-detailinfo",
                Title: "农户详细信息",
                Parent: dev.App.MapPanel[0].parentElement,
                Maximizable: false,
                Modal: false,
                Draggable: true,
                HAlign: 'center',
                VAlign: 'center',
                Resizable: false,
                Url: dev.App.Root + "html/rotation/farmerdetail.html",
                Height: 309,
                Width: 500,
                Parameters: { farmerId: tag }
            });
            farmerdetailWin.one("onClosing", function () {
                farmerdetailWin.Destroy();
                farmerdetailWin = null;
            });
            farmerdetailWin.Target.css("background", "transparent");
            $("#iframePanel", farmerdetailWin.Target).css("background", "transparent");
            $(".Header", farmerdetailWin.Target).css("background", "linear-gradient(to right,#745dfd,#0e5fd1)");
            $('iframe', farmerdetailWin).load(function () {
                $("iframe", farmerdetailWin).contents().find("body").css("background", "rgba(20, 205, 173,0.6)");
                //$(".liveNormalTabCls", $("iframe", farmerdetailWin).contents()).css("background", "rgba(149, 184, 231, 0.8)");
                $(".TabItem", $("iframe", farmerdetailWin).contents()).css("background", "rgba(20, 205, 173,0.8)");
            })

        });
        var framecardid = $('<div style="height:35px;width:222px;"><div style="width:55px;text-align:right;padding-right:5px;height:35px;line-height:35px;display:inline-block;">身份证号</div><div style="width;147px;height:35px;line-height:35px;padding-left:5px;display:inline-block;">' + detailinfo.farmer.cardid + '</div></div>').appendTo(framerright);
        var framephone = $('<div style="height:35px;width:222px;"><div style="width:55px;text-align:right;padding-right:5px;height:35px;line-height:35px;display:inline-block;">联系电话</div><div style="width:147px;height:35px;line-height:35px;padding-left:5px;display:inline-block;">' + detailinfo.farmer.mobilephone + '</div></div>').appendTo(framerright);
        var blocktitle = $('<div style="height:27px;width:319px;line-height:27px;background: #14cdad;"><div style="margin-left:3px;height:24px;width:24px;border-radius:12px;background-color:#0099cc;color:#fff;line-height:24px;text-align:center;display:inline-block;float:left;">地</div><div style="margin-left:10px;display:inline-block;height:24px;line-height:24px;color:#FFFFFF;">地块信息</div></div>').appendTo(detailcontent);
        var blockcontent = $('<div style="height:150px;border-left:1px solid #87CEEB;border-right:1px solid #87CEEB;width:317px;"></div>').appendTo(detailcontent);
        var tempdiv = $('<div style="height:120px;width:317px;"></div>').appendTo(blockcontent);
        var blockleft = $('<div style="height:120px;width:200px;display:inline-block;float:left;"></div>').appendTo(tempdiv);
        var blockid = $('<div style="height:30px;width:200px;"><div style="height:30px;width:55px;padding-right:5px;display:inline-block;float:left;text-align:right;line-height:30px;">地块编号</div><div style="height:30px;width:135px;padding-left:5px;display:inline-block;line-height:30px;color:#ffffff;text-decoration: underline;"><a>' + currrow.massifid + '</a></div></div>').appendTo(blockleft);
        blockid.prop("blockdata", currrow);
        blockid.prop("blockimgs", detailinfo.images);
        $("a", blockid).click(function () {
            var blockdata = $(this).parent().parent().prop("blockdata");
            var blockimgs = $(this).parent().parent().prop("blockimgs");
            if (dev.IsNull(blockdata)) return;
            if (dev.IsNull(blockdetailWin)) {
                blockdetailWin = new dev.Window({
                    ID: "blockWin",
                    IconCls: 'icon-detailinfo',
                    Title: "地块详细信息",
                    Parent: dev.App.MapPanel[0].parentElement,
                    Maximizable: false,
                    Modal: false,
                    Draggable: true,
                    HAlign: 'center',
                    VAlign: 'center',
                    Resizable: false,
                    Url: dev.App.Root + "html/rotation/blockdetail.html",
                    Height: 319,
                    Width: 516,
                    Parameters: { massifdata: blockdata, massifimgs: blockimgs }
                });
                blockdetailWin.one("onClosing", function () {
                    blockdetailWin.Destroy();
                    blockdetailWin = null;
                });
                blockdetailWin.Target.css("background", "transparent");
                $("#iframePanel", blockdetailWin.Target).css("background", "transparent");
                $(".Header", blockdetailWin.Target).css("background", "linear-gradient(to right,#745dfd,#0e5fd1)");
                $('iframe', blockdetailWin).load(function () {
                    $("iframe", blockdetailWin).contents().find("body").css("background", "rgba(20, 205, 173,0.6)");
                })
            }
        });
        var blockname = $('<div style="height:30px;width:200px;"><div style="height:30px;width:55px;padding-right:5px;display:inline-block;float:left;text-align:right;line-height:30px;">地类名称</div><div style="height:30px;width:135px;padding-left:5px;display:inline-block;line-height:30px;">' + currrow.classname + '</div></div>').appendTo(blockleft);
        var blocktype = $('<div style="height:30px;width:200px;"><div style="height:30px;width:55px;padding-right:5px;display:inline-block;float:left;text-align:right;line-height:30px;">耕地类型</div><div style="height:30px;width:135px;padding-left:5px;display:inline-block;line-height:30px;">' + currrow.landtype + '</div></div>').appendTo(blockleft);
        var blockarea = $('<div style="height:30px;width:200px;"><div style="height:30px;width:55px;padding-right:5px;display:inline-block;float:left;text-align:right;line-height:30px;">地块面积</div><div style="height:30px;width:135px;padding-left:5px;display:inline-block;line-height:30px;">' + (dev.IsNullAll(currrow.farmlandarea) ? "" : (dev.SqrtMetersToMu(currrow.farmlandarea) + '(亩)')) + '</div></div>').appendTo(blockleft);
        var blockright = $('<div style="height:120px;width:116px;display:inline-block;"><div style="width:110px;height:115px;background-size:110px 115px; margin-top:5px; background-image: url(' + ((dev.IsNull(detailinfo.images) || detailinfo.images.length == 0) ? (dev.App.Root + "image/agri/nopic.png") : detailinfo.images[0]) + '); background-repeat: no-repeat; background-position: center;"></div></div>').appendTo(tempdiv);
        blockright.prop("imgs", detailinfo.images);
        if (detailinfo.images.length > 0) blockright.attr("title", "点击预览");
        blockright.click(function () {
            var imgs = $(this).prop("imgs");
            dev.PreViewPics(imgs, 0, dev.App.MapPanel.MapDOM);
        });
        var text = "";
        if (!dev.IsNull(currrow.province)) text += currrow.province;
        if (!dev.IsNull(currrow.city)) text += currrow.city;
        if (!dev.IsNull(currrow.county)) text += currrow.county;
        if (!dev.IsNull(currrow.town)) text += currrow.town;
        if (!dev.IsNull(currrow.village)) text += currrow.village;
        var blockaddress = $('<div style="height:30px;width:317px;"><div style="width:55px;padding-right:5px;display:inline-block;float:left;text-align:right;line-height:30px;height:30px;">详细地址</div><div style="height:30px;width:252px;padding-left:5px;display:inline-block;line-height:30px;">' + text + '</div></div>').appendTo(blockcontent);
        var croptitle = $('<div style="height:27px;width:319px;line-height:27px;background: #14cdad;"><div style="margin-left:3px;height:24px;width:24px;border-radius:12px;background-color:#0099cc;color:#fff;line-height:24px;text-align:center;display:inline-block;float:left;">植</div><div style="margin-left:10px;display:inline-block;height:24px;line-height:24px;color:#FFFFFF;">历史种植</div></div>').appendTo(detailcontent);
        if (detailinfo.crops.length > 0) {
            var cropcontent = $('<div style="width:317px;border-left:1px solid #87CEEB;border-right:1px solid #87CEEB;border-bottom:1px solid #87CEEB;"></div>').appendTo(detailcontent);
            var height = detailinfo.crops.length * 61;
            if (detailinfo.crops.length * 61 >= 180) height = 180;
            height += 3;
            cropcontent.css({ "height": height + "px" });
            if (dev.IsNull(detailGrid)) InitDetailGrid($this, cropcontent);
            detailGrid.Resize(317, height);
            detailGrid.Load(detailinfo.crops);
            //dataGrid.DataGrid.datagrid("getPanel").css("background-color", "rgba(20, 205, 173,0.6)");
            $(".panel-body", detailGrid.Target).css("background-color", "transparent");
            $(".detailcroppic", detailGrid.Target).click(function () {
                var tag = $(this).attr("tag");
                var cropdatas = detailGrid.DataGrid.datagrid("getData").rows;
                if (dev.IsNull(cropdatas) || cropdatas.length == 0) return;
                var c_row = Enumerable.From(cropdatas).Where('s=>s.id=="' + tag + '"').FirstOrDefault();
                if (dev.IsNull(c_row) || dev.IsNull(c_row.images) || c_row.images.length == 0) return;
                dev.PreViewPics(c_row.images, 0, dev.App.MapPanel.MapDOM);
            });
        }
    }
    var querymapclick;
    var polyganKey;
    var dataGrid, detailGrid;
    var blockdetailWin, farmerdetailWin;
    SClear = function () {
        //清除
        if (!dev.IsNull(this.resultPanel))
            this.resultPanel.css("display", "none");
        if (!dev.IsNull(this.detailPanel))
            this.detailPanel.css("display", "none");
        if (!dev.IsNull(this.detailPanel))
            this.detailPanel.empty();
        if (!dev.IsNull(this.Content))
            this.Content.empty();
        drawfeature = null;
        dev.MapUtils.ClearFeature("tempDrawLayer");
        dev.MapUtils.ClearFeature("globalQueryLayer");
        dev.MapUtils.RemoveLayer("globalQueryLayer");
        globallayer = null;
        if (!dev.IsNull(polyganKey)) {
            dev.App.Map.unByKey(polyganKey);
            polyganKey = null;
        }
        if (!dev.IsNull(dataGrid)) {
            dataGrid.Target.unbind("onSelectPage");
            dataGrid.Target.unbind("onClickRow");
            dataGrid.Target.remove();
            dataGrid = null;
        }
        if (!dev.IsNull(detailGrid)) {
            detailGrid.Target.remove();
            detailGrid = null;
        }
        if (!dev.IsNull(blockdetailWin)) {
            blockdetailWin.Destroy();
            blockdetailWin = null;
        }
        if (!dev.IsNull(farmerdetailWin)) {
            farmerdetailWin.Destroy();
            farmerdetailWin = null;
        }
        if (!dev.IsNull(querymapclick)) {
            dev.App.Map.unByKey(querymapclick);
            querymapclick = null;
        }
    };
    SQuery = function (value) {
        SClear();
        //显示结果
        if ($('.global', dev.App.MapPanel.Target).length > 0) {
            if (!dev.IsNull(this.resultPanel))
                this.resultPanel.css("display", "block");
            if (!dev.IsNull(this.detailPanel))
                this.detailPanel.css("display", "block");
        }
        else {
            this.Target = $('<div class="global" style="position: absolute;top: 110px;left: calc(2% + 150px);z-index:10"></div>').appendTo(dev.App.MapPanel.Target);
            this.resultPanel = $('<div class="resultPanel" style="background-color:rgb(20, 205, 173,0.6);display:none;"></div>').appendTo(this.Target);
            this.detailPanel = $('<div class="detailPanel"></div>').appendTo(this.Target); resultPanel
            var close = $('<div class="closebtn icon-tip-close"></div>').appendTo(this.resultPanel);
            close.click(function () {
                SClear();
            });
            this.Content = $('<div></div>');
            this.Box = new dev.Box({ Width: 317, Height: 512, HasBorder: false });
            this.Box.Target.css("background-color", "transparent");
            this.resultPanel.append(this.Box.Target);
            this.Box.Layout();
            this.Box.SetContent(this.Content);
        }
        var $this = this;

        //获取满足条件的图层
        var searchkey = value;
        if (dev.IsNull(searchkey) && dev.IsNull(drawfeature)) {
            return;
        }
        $this.searchkey = searchkey;
        getlayers();
        if (dev.IsNull(searchlayers) || searchlayers.length == 0) {
            var dialog = new dev.Messager({ Height: 95, Width: 200, AutoShow: false, Type: "info", Timeout: 1500, ButtonVisible: false, AutoVisible: true, Effect: "normal" });
            dialog.Alert($("#city-location").text() + "没有对应的图层!", "info");
            $this.SClear(); return;
        }
        this.PageIndex = 1;
        this.PageSize = 10;
        var querylayers = Enumerable.From(searchlayers).Where('s=>s.LayerType=="block"').ToArray();
        if (dev.IsNull(querymapclick)) {
            querymapclick = dev.App.Map.on("singleclick", function (evt) {
                //进行查询
                //判断数据是否存在
                if (dev.IsNull(dataGrid)) return;
                var griddatas = dataGrid.DataGrid.datagrid("getData").rows;
                if (dev.IsNull(griddatas) || griddatas.length == 0) return;
                var pixel = this.getPixelFromCoordinate(evt.coordinate);
                dev.App.Map.forEachFeatureAtPixel(pixel, function (feature) {
                    if (dev.IsNull(feature)) return;
                    var rowdata = feature.getProperties();
                    var isquery = Enumerable.From(griddatas).Where('s=>s.massifid=="' + rowdata.massifid + '"').ToArray();
                    if (dev.IsNull(isquery) || isquery.length == 0) return;
                    var newfeature = new ol.Feature(rowdata.geom);
                    newfeature.setProperties(rowdata);
                    HighLight(newfeature);
                    queryDetail(rowdata, $this);
                });
            });
        }
        if (dev.IsNull(querylayers) || querylayers.length == 0) return;
        //this.resultPanel.css("display", "none");
        //this.detailPanel.css("display", "none");

        getcontent(querylayers, this);
    }
})(jQuery);

//悬浮框控件
(function () {
    SfloatPanel = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        opt.Width = dev.IsNull(opt.Width) ? 240 : opt.Width;
        opt.Height = dev.IsNull(opt.Height) ? 400 : opt.Height;
        this.Title = dev.IsNull(opt.Title) ? "悬浮框" : opt.Title;
        this.Parent = dev.IsNull(opt.Parent) ? dev.App.MapPanel.MapDOM : opt.Parent;
        this.IsDock = dev.IsBoolean(opt.IsDock) ? opt.IsDock : opt.IsDock != "false";
        this.Draggable = dev.IsBoolean(opt.Draggable) ? opt.Draggable : opt.Draggable === "true",//定义窗口是否可拖拽
            opt.Target = $('<div class="floatPanel" style="width:' + opt.Width + 'px;height:' + opt.Height + 'px"></div>');
        $.extend(this, new dev.Control(opt));
        var $this = this;
        this.Header = $('<div class="Header"></div>').appendTo(this.Target);
        this.Header.append($('<div class="Icon ' + opt.IconCls + '"></div>')).append($('<div class="Text">' + this.Title + '</div>'));
        this.CloseButton = $('<div class="CloseButton"></div>').appendTo(this.Header);
        this.Win = opt.Target;
        this.CloseButton.click(function () {
            $this.Close();
        });
        if (this.IsDock) {
            this.DockButton = $('<div class="DockButton" tag="v"><div class="Icon icon-v-shot"></div></div>').appendTo(this.Header);
            this.DockButton.click(function () {
                var tag = $(this).attr("tag");
                if (tag == "v") {
                    $(this).attr("tag", "h");
                    $(".Icon", $(this)).removeClass("icon-v-shot").addClass("icon-h-shot");
                }
                else {
                    $(this).attr("tag", "v");
                    $(".Icon", $(this)).removeClass("icon-h-shot").addClass("icon-v-shot");
                }
            });
            this.Target.mouseenter(function () {
                $this.SetVisible(true);
            }).mouseleave(function () {
                var tag = $this.DockButton.attr("tag");
                if (tag == "h") $this.SetVisible(false);
            });
        }
        this.Content = $('<div class="Content" style="height:' + (this.Height - 26) + 'px;"></div>').appendTo(this.Target);
        //   this.DockFlag = $('<div class="icon-type" style="height:16px;width:16px;display:none;position:absolute;right:0px;border:1px solid #cdcdcd;"></div>').appendTo(this.Target);
        funExt(this);
        //拖拽
        (function () {
            var isMouseDown = false, currElement, elPos, mousePos;
            $this.Header.bind("mousedown", $this, function (e) {
                if (!e.data.Draggable) return;
                $this.Target.css("z-index", 11);
                isMouseDown = true, currElement = this;
                mousePos = { x: e.clientX, y: e.clientY };
                elPos = { l: parseInt(e.data.Win[0].offsetLeft), t: parseInt(e.data.Win[0].offsetTop) };
                if (currElement.setCapture) {
                    currElement.setCapture();
                    currElement.onmouseup = HeaderMouseUp;
                    currElement.onmousemove = function (ev) {
                        HeaderMouseMove(ev || event);
                    };
                }
                else $(document).bind("mouseup", HeaderMouseUp).bind("mousemove", HeaderMouseMove);
                e.preventDefault();
            });

            function HeaderMouseUp() {
                isMouseDown = false;
                currElement.releaseCapture ? (currElement.releaseCapture(), currElement.onmousemove = currElement.onmouseup = null) : ($(document).unbind("mouseup", HeaderMouseUp).unbind("mousemove", HeaderMouseMove));
            }

            function HeaderMouseMove(e) {
                if (!isMouseDown) return;
                var top = elPos.t + (e.clientY - mousePos.y);
                var left = elPos.l + (e.clientX - mousePos.x);
                //if (top < 0) top = 0;
                //if (left < 0) left = 0;
                $this.Target.css({ top: ($this.Top = top) + "px", left: ($this.Left = left) + "px" });
            }
        }());
        this.Target.appendTo(this.Parent);
    };

    function funExt(control) {
        $.fn.extend(control, {
            SetContent: function (element, parameters) {
                var $this = this;
                if (dev.IsString(element)) {
                    var frame = dev.CreateFrame(element, false);
                    var waitbox = new dev.UCWaitBox(this.Target);
                    frame.bind('load', function () {
                        dev.CallWidgetCommunication(frame[0], $this.Target, parameters);
                        waitbox.Close();
                        $this.Target.trigger("onLoaded", $this);
                    });
                    this.Content.html(frame);
                    waitbox.Show();
                }
                else if (dev.IsDOMElement(element) || dev.IsjQueryObject(element)) {
                    this.Content.append(element);
                    this.Target.trigger("onLoaded", $this);
                }
            },
            RemoveContent: function (element) {
                element = dev.IsString(element) ? $('#' + element, this.Content) : (dev.IsObject(element) ? $(element) : null);
                if (element == null || element.length == 0) return;
                element.remove();
            },
            Close: function () {
                this.Target.triggerHandler("onClosing");
                this.Target.remove();
            },
            SetVisible: function (visible) {
                //this.Header.css("display", (visible ? "block" : "none"));
                //this.Content.css("display", (visible ? "block" : "none"));
                this.Target.css("display", (visible ? "block" : "none"));
                //  this.DockFlag.css("display", (visible ? "none" : "block"));
                //  this.Target.css({ "width": (visible ? (this.Width + "px") : "0px") });
            },
            SetDock: function (isdock) {
                this.DockButton.attr("tag", isdock ? "v" : "h");
                $(".Icon", this.DockButton).removeClass((isdock ? "icon-h-shot" : "icon-v-shot")).addClass(isdock ? "icon-v-shot" : "icon-h-shot");
            }
        });
    }
})(jQuery);
