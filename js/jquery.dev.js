/*添加地图工具*/
; (function ($) {
    dev.App.treedata;
    var streetview;
    dev.settoolvisible = function (visible) {
        var tooldiv = $(".toolcontainer", dev.App.MapPanel.MapDOM);
        tooldiv.css("display", visible ? "block" : "none");
        var topicdiv = $(".topiccontainer", dev.App.MapPanel.MapDOM);
        topicdiv.css("display", visible ? "block" : "none");
        var xzqposition = $(".xzqposition", dev.App.MapPanel.MapDOM);
        xzqposition.css("display", visible ? "block" : "none");
    }
    dev.initmaptool = function () {
        //放置工具箱
        var toolsDiv = $('<div class="toolcontainer" style=" position: absolute;top:130px;height:70px;width:70px;right:75px;cursor:pointer;z-index:9999;"></div>');
        dev.App.MapPanel.MapDOM.append(toolsDiv);
        var toolsymbol = $('<div class="mappanelsymbol"><div class="Icon icon-maptool-tool"></div></div>').appendTo(toolsDiv);
        toolsDiv.mouseenter(function () {
            toolsymbol.css({ "border": "1px solid #3399ff", "background-color": "#fff" });
            $(".Icon", toolsymbol).removeClass("icon-maptool-tool");
            $(".Icon", toolsymbol).addClass("icon-maptool-tool1");
            $("#toolsPanel").css("display", "block");
            $(this).css("height", "185px");
            // topic.css("top", "202px");
        }).mouseleave(function () {
            toolsymbol.css({ "border": "1px solid #999", "background": "rgba(0,0,0,0.3)" });
            $(".Icon", toolsymbol).removeClass("icon-maptool-tool1");
            $(".Icon", toolsymbol).addClass("icon-maptool-tool");
            $("#toolsPanel").css("display", "none");
            $(this).css("height", "60px");
            //  topic.css("top", "46px");
        });
        var toolsPanel = $('<div id="toolsPanel" class="mappanelsymbol" style="height:182px;display:none;right:0px;border-top:0px;position:relative;"></div>').appendTo(toolsDiv);
        var pointquery = $('<div class="toolsymbol" style="top:0px;border-bottom:1px solid #999;" tag="maptool-pointquery" title="点查询"><div class="Icon icon-maptool-pointquery"></div></div>').appendTo(toolsPanel);
        var screenfull = $('<div class="toolsymbol" style="border-bottom:1px solid #999;top:32px;" tag="maptool-fullscreen" title="全屏"><div class="Icon icon-maptool-fullscreen"></div></div>').appendTo(toolsPanel);
        var fullmap = $('<div class="toolsymbol" style="border-bottom:1px solid #999;top:63px;" tag="maptool-fullmap" title="全图"><div class="Icon icon-maptool-fullmap"></div></div>').appendTo(toolsPanel);
        var measuredistance = $('<div class="toolsymbol" style="top:93px;" tag="maptool-measuredistance" title="测距"><div class="Icon icon-maptool-measuredistance"></div></div>').appendTo(toolsPanel);
        var measurearea = $('<div class="toolsymbol" style="top:123px;" tag="maptool-measurearea" title="测面积"><div class="Icon icon-maptool-measurearea"></div></div>').appendTo(toolsPanel);
        var clearmap = $('<div class="toolsymbol" style="top:153px;" tag="maptool-clearmap"  title="删除"><div class="Icon icon-maptool-clearmap"></div></div>').appendTo(toolsPanel);
        //  var pointquery = $('<div class="toolsymbol" style="top:152px;" tag="maptool-pointquery" title="点查询"><div class="Icon icon-maptool-pointquery"></div></div>').appendTo(toolsPanel);
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
            if (tag == "maptool-fullscreen" || tag == "maptool-unfullscreen") {
                if (tag == "maptool-fullscreen") {
                    fullscreen();
                    $('.Icon', $(this)).removeClass("icon-" + tag + "1");
                    $(this).attr("tag", "maptool-unfullscreen").attr("title", "还原");
                    $('.Icon', $(this)).addClass("icon-maptool-unfullscreen1");
                }
                else {
                    fullscreen(true);
                    $('.Icon', $(this)).removeClass("icon-" + tag + "1");
                    $(this).attr("tag", "maptool-fullscreen").attr("title", "全屏");
                    $('.Icon', $(this)).addClass("icon-maptool-fullscreen1");
                }
            }
            if (tag == "maptool-fullmap") {
                var configExtent = dev.App.Config.SystemMap.Extent;
                var initExtent = [parseFloat(configExtent.XMin), parseFloat(configExtent.YMin), parseFloat(configExtent.XMax), parseFloat(configExtent.YMax)];
                var mapproj = dev.App.Map.getView().getProjection();
                if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) initExtent = dev.proj.transformExtent(initExtent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
                dev.App.Map.getView().fit(initExtent, dev.App.Map.getSize());
                dev.App.Map.getView().setRotation(dev.App.defaultAngle);
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
                //进行点查询
                //绘制点
                // drawgeometry("Point");
                dev.queryState = true;
                dev.App.MapPanel.MapDOM.css("cursor", "default");
                attrQuery();
            }
        });
        //二三维切换
        dev.App.MapSwitch.Target.bind("onSwitchClick", function (sender, opt) {
            if (dev.IsNull(opt)) return;
            if (!dev.IsNull(streetview)) streetview.Clear();
            if (opt.type == "StreetView") {
                //获取当前地图的中心点
                dev.App.MapPanel.SetMapModel(dev.MapMode.Map2D);
                streetview = new dev.StreetView();
                streetview.LoadStreet();
            }
            if (opt.type == "PotreeMap") {
                dev.App.FillPanel.Add(dev.App.Root + "html/potreeview.html", null, "potreeviewframe");
            }
            else {
                dev.App.MapPanel.SetMapModel(opt.type);
                if (!dev.IsNull(opt.check)) {
                    dev.App.MapAngleLink = opt.check;
                    if (!dev.App.MapAngleLink) dev.App.Map.getView().setRotation(dev.App.defaultAngle);
                }
            }
        });
        //初始化专题图层图标
        var tipicPanel;
        var topic = $('<div class="topiccontainer" style="width:60px;height:60px;position:absolute;top:60px;right:82px;background:rgba(0,0,0,0.4);border:1px solid #999;cursor:pointer;z-index:9999;"><div style="width:60px;height:60px;" class="icon icon-maptool-topic"></div></div>');
        topic.mouseover(function () {
            $(".icon", $(this)).removeClass("icon-maptool-topic").addClass("icon-maptool-topic1");
            $(this).css("background-color", "#fff");
        }).mouseleave(function () {
            $(".icon", $(this)).removeClass("icon-maptool-topic1").addClass("icon-maptool-topic");
            $(this).css("background", "rgba(0,0,0,0.3)");
        });
        //获取图层
        var layerconfig = dev.App.Config.Extend.LayerForTree;
        var temp = dev.ObjClone(layerconfig);
        if (!dev.IsNull(temp.LayerRoot) && dev.IsNull(temp.LayerRoot.length)) temp.LayerRoot = [temp.LayerRoot];
        dev.App.treedata = temp.LayerRoot.clone();
        dev.App.treedata = dev.GetTreeLayers(dev.TreeLayerType.Tipoc, dev.App.treedata);
        topic.click(function () {
            //显示专题图层
            if (dev.IsNull(tipicPanel)) {
                tipicPanel = new dev.floatPanel({
                    ID: "topicPanel",
                    IconCls: "icon-maptool-topic",
                    CSS: { "top": "160px", "right": "160px" },
                    Title: "专题图层",
                    Width: 376,
                    Draggable: "true"
                });
                tipicPanel.Target.one("onClosing", function () {
                    tipicPanel = null;
                });
                //添加图层树
                dev.initTreeLayer(dev.App.treedata);
            }
            else {
                tipicPanel.SetDock(true);
                tipicPanel.SetVisible(true);
            }
        });
        dev.App.MapPanel.MapDOM.append(topic);
        //行政区定位
        var defaultposition = dev.App.Config.SystemMap.Position;
        var xzqprovincedata, xzqcitydata, xzqcountydata;
        var xzqwaitbox;
        var xzqposition = $('<div class="xzqposition" style="cursor:pointer;"></div>');
        var selectxzq = $('<div class="selecttext" tag="' + defaultposition.Code + '" dtype="' + defaultposition.Type + '">' + defaultposition.Name + '</div>');
        xzqposition.append(selectxzq);
        var xzqexpend = $('<div class="xzqexpend"><div class="icon-maptool-arrow" style="height:6px;width:7px;margin-left:4px;margin-top:12px;"></div></div>').appendTo(xzqposition);
        dev.App.MapPanel.MapDOM.append(xzqposition);
        //positionbykey(defaultposition.Name, defaultposition.Type, false);
        //dev.MapUtils.ClearFeature("tempGraphicLayer");
        //dev.App.Map.getView().setZoom(parseFloat(dev.App.Config.SystemMap.Zoom));
        var xzqselectpanel;
        var contentbox;
        var xzq_zindex;
        xzqexpend.click(function () {
            if (dev.IsNull(xzqselectpanel)) {
                xzqselectpanel = $('<div class="xzqpositionpanel" style="cursor:default;"></div>');
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
                var querycontent = $('<div class="content"></div>').appendTo(xzqselectpanel);
                //常见城市
                var commoncity = $('<div class="commoncity"><a tag="000000">全国</a><a>北京</a><a>上海</a><a>广州</a><a>深圳</a><a>成都</a><a>天津</a><a>南京</a><a>杭州</a><a>武汉</a><a>重庆</a><a>澳门</a><a>香港</a></div>').appendTo(querycontent);
                $("a", commoncity).click(function () {
                    $("a", commoncity).css("font-weight", "normal");
                    $(this).css("font-weight", "bold");
                    //定位
                    var text = $(this).text();
                    if (text == "全国") {
                        dev.MapUtils.ClearFeature("tempTrackLayer");
                        dev.App.Map.getView().centerOn([104.2663955688477, 29.93828272819518], dev.App.Map.getSize(), [dev.App.Map.getSize()[0] / 2, dev.App.Map.getSize()[1] / 2]);
                        dev.App.Map.getView().setZoom(4);
                        selectxzq.html(text);
                        selectxzq.attr("tag", $(this).attr("tag"));
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
                var countybtn = $('<div class="normalbtn" style="border:0px" tag="county">按区县</div>').appendTo(btnsdiv);
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
                        $('a', $(".chardiv", xzqselectpanel)).css("font-weight", "normal");
                        $(this).css("font-weight", "bold");
                        //查询结果
                        //获取对应字母所在行
                        var c_td = $('td[tag="' + text.trim() + '"]:first', $(".result", xzqselectpanel));
                        if (c_td.length == 0) return;
                        contentbox.Revert();
                        var offsettop = contentbox.GetScrollTop(c_td.offset().top);
                        contentbox.SetScrollV(offsettop);
                    });
                    charsdiv.append(charnode);
                }
                dev.App.MapPanel.MapDOM.append(xzqselectpanel);
                //显示结果div
                var height = 395 - (title.outerHeight() + querycontent.outerHeight()) - 15;
                var resultdiv = $('<div class="result" style="height:' + height + 'px;width:250px;position:relative;"></div>').appendTo(xzqselectpanel);
                if (dev.IsNull(contentbox)) {
                    contentbox = new dev.Box({ Width: 250, Height: height, HasBorder: false });
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
                        xzqselectpanel.css("z-index", 1000);
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
                        else if (top + xzqselectpanel.outerHeight() > pdom.outerHeight()) {
                            top = pdom.outerHeight() - xzqselectpanel.outerHeight();
                            if (top < 0) top = 0;
                        }
                        if (left < 0) left = 0;
                        else if (left + xzqselectpanel.outerWidth() > pdom.outerWidth()) {
                            left = pdom.outerWidth() - xzqselectpanel.outerWidth();
                            if (left < 0) left = 0;
                        }
                        xzqselectpanel.css({ top: top + "px", left: left + "px" });
                    }
                }());
            }
            else xzqselectpanel.css("display", "block");
            xzqwaitbox.Show();
            if (dev.IsNull(xzqprovincedata)) xzqprovincedata = getxzqquerydata("province");
            if (dev.IsNull(xzqprovincedata) || xzqprovincedata.length == 0) return;
            var tableinfo = loadprovincedata(xzqprovincedata);
            contentbox.SetContent(tableinfo);
            xzqwaitbox.Close();
        });

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
            var query = new dev.WFS_H();
            query.Target.bind("onQueryCompleted", function (s, e) {
                if (dev.IsNull(e.data) || e.data.length == 0) return;
                e.data[0].setStyle(new dev.style.Style({
                    stroke: new ol.style.Stroke({ width: 2, color: [45, 119, 230, 1], lineDash: [1, 2, 3, 4, 5, 6] }),
                    fill: new ol.style.Fill({ color: [45, 119, 230, 0] })
                }));
                dev.MapUtils.ClearAndAddFeatures(e.data, "tempTrackLayer");
                var extent = e.data[0].getGeometry().getExtent();
                if (type == "province") {
                    dev.App.Map.getView().setZoom(6);
                    selectxzq.html(e.data[0].getProperties().PROVINCE);
                    selectxzq.attr("tag", e.data[0].getProperties().ADCODE);
                }
                if (type == "city") {
                    dev.App.Map.getView().setZoom(7);
                    selectxzq.html(e.data[0].getProperties().CITY);
                    selectxzq.attr("tag", e.data[0].getProperties().ADCODE);
                }
                if (type == "county") {
                    e.data[0].setStyle(new dev.style.Style({
                        stroke: new ol.style.Stroke({ width: 2, color: [173, 255, 152, 1], lineDash: [1, 2, 3, 4, 5, 6] }),
                        fill: new ol.style.Fill({ color: [173, 255, 152, 0] })
                    }));
                    dev.App.Map.getView().setZoom(8);
                    selectxzq.html(e.data[0].getProperties().COUNTY);
                    selectxzq.attr("tag", e.data[0].getProperties().ADCODE);
                }
                selectxzq.attr("dtype", type);

                dev.App.Map.getView().centerOn([((extent[0] + extent[2]) / 2), ((extent[1] + extent[3]) / 2)], dev.App.Map.getSize(), [dev.App.Map.getSize()[0] / 2, dev.App.Map.getSize()[1] / 2]);
            });
            query.Query(param);
        }

        //关键字查询
        function getsearchkey(key, type) {
            if (dev.IsNull(key) || dev.IsNull(type)) return;
            var data;
            $.ajax({
                url: dev.cookie.baseUri + "massif/search/" + type + "/" + key + "?" + new Date().getTime(),
                type: "GET",
                dataType: "json",
                async: false,
                success: function (result) {
                    data = result.data;
                }
            });
            return data;
        }


        //坐标系转换
        var crstools = $('<div class="crstools"></div>');
        var crsimg = $('<div class="img"></div>').appendTo(crstools);
        var crstext = $('<div class="text">投影</div>').appendTo(crstools);
        var crsarrow = $('<div class="arrowcontain"><div class="icon-maptool-arrow" style="height:6px;width:7px;margin-left:4px;margin-top:12px;"></div></div>').appendTo(crstools);
        dev.App.MapPanel.MapDOM.append(crstools);
        crstools.mouseover(function () {
            $(".img", $(this)).css("background-image", "url(" + dev.App.Root + "image/agri/projection1.png)");
            $(".text", $(this)).css("color", "#00aaff");
            $(this).css("background", "#fff");
        }).mouseleave(function () {
            $(".img", $(this)).css("background-image", "url(" + dev.App.Root + "image/agri/projection.png)");
            $(".text", $(this)).css("color", "#fcfcfc");
            $(this).css("background", "rgba(0,0,0,0.4)");
        });
        crsarrow.click(function () {
            $(".crstoolspanel", dev.App.MapPanel.MapDOM).css("display", "block");
        }).mouseleave(function () {
            $(".crstoolspanel", dev.App.MapPanel.MapDOM).css("display", "none");
        }).mouseup(function () { return false; });
        crstext.mouseover(function () { $(".crstoolspanel", dev.App.MapPanel.MapDOM).css("display", "block"); }).mouseleave(function () { $(".crstoolspanel", dev.App.MapPanel.MapDOM).css("display", "none"); }).mouseup(function () {
            return false;
        });
        var crstoolpanel = $('<div class="crstoolspanel"></div>');
        crstoolpanel.mouseover(function () {
            $(".crstoolspanel", dev.App.MapPanel.MapDOM).css("display", "block");
        }).mouseleave(function () {
            $(".crstoolspanel", dev.App.MapPanel.MapDOM).css("display", "none");
        });
        var itemearth = $('<div class="item" tag="EPSG:3857"><div class="selectedimgpanel"></div><div style="height:30px;width:65px;text-align:left;line-height:30px;display:inline-block;">球面墨卡托</div></div>').appendTo(crstoolpanel);
        var itemearth1 = $('<div class="item" tag="EPSG:4326"><div class="selectedimgpanel"></div><div style="height:30px;width:60px;text-align:left;line-height:30px;display:inline-block;">经纬度</div></div>').appendTo(crstoolpanel);
        dev.App.MapPanel.MapDOM.append(crstoolpanel);
        $(".item", $(".crstoolspanel", dev.App.MapPanel.MapDOM)).mouseup(function (event) { return false; });
        $(".item", $(".crstoolspanel", dev.App.MapPanel.MapDOM)).click(function () {
            //进行切换
            var tag = $(this).attr("tag");
            if (tag == dev.App.Config.SystemMap.DisplayEPSG) return;
            $(".item", $(".crstoolspanel", dev.App.MapPanel.MapDOM)).removeClass("selectitem");
            $(".selectedimgpanel", $(".item", $(".crstoolspanel", dev.App.MapPanel.MapDOM))).removeClass("selectedimg");
            $(this).addClass("selectitem");
            $(".selectedimgpanel", $(this)).addClass("selectedimg");
            dev.App.Config.SystemMap.OldDisplayEPSG = dev.App.Config.SystemMap.DisplayEPSG;
            dev.App.Config.SystemMap.DisplayEPSG = tag;
            //刷新地图
            dev.RefreshMap();
        });
        //自定义样式
        var sysCrs = dev.App.Config.SystemMap.DisplayEPSG;
        var items = $(".item", $(".crstoolspanel", dev.App.MapPanel.MapDOM));
        for (var i = 0; i < items.length; i++) {
            var tag = $(items[i]).attr("tag");
            if (tag == sysCrs) {
                $(items[i]).addClass("selectitem");
                $(".selectedimgpanel", $(items[i])).addClass("selectedimg");
            }
        }
    }

    function getprovincedata(searchkey) {
        var data = [];
        var tempparent = Enumerable.From(dev.App.Config.Extend.LayerForTree.LayerRoot).Where('s=>s.Value=="XZQ"').FirstOrDefault();
        if (dev.IsNull(tempparent)) return;
        var xzqs = tempparent.Child;
        var needlayerinfo = Enumerable.From(xzqs).Where('s=>s.Value.toLowerCase()=="province" || s.Value.toLowerCase()=="city"').ToArray();
        var params = [];
        var index = 0;
        for (var i = 0; i < needlayerinfo.length; i++) {
            params.push({
                ID: needlayerinfo[i].Value,
                Url: dev.GetSystemUrlByRelID(needlayerinfo[i].WFSUrl),
                TypeName: needlayerinfo[i].TypeName,
                Async: false
            });
        }
        var query = new dev.WFS_H({});
        query.Target.bind("onQueryCompleted", function (s, e) {
            if (!dev.IsNull(e.data) && e.data.length > 0) data.push({ key: params[index].ID, result: e.data });
            if (index < params.length - 1) {
                index++;
                query.Query(params[index]);
            }
        });
        query.Query(params[index]);
        return data;
    }

    function getxzqquerydata(type) {
        //根据类型找到对应的图层
        var data;
        if (dev.IsNull(type)) return;
        $.ajax({
            url: dev.cookie.baseUri + "massif/cascade/" + type + "?" + new Date().getTime(),
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

    var rightVisible, bottomVisible, leftVisible, topVisible;
    var drawControl = null;
    var measureControl = null;
    var measurelistener = null;
    var querytip;
    dev.measureState;
    var dragBox = null;
    function fullscreen(isunfull) {
        if (!isunfull) {
            rightVisible = dev.App.RightPanel.Visible;
            bottomVisible = dev.App.BottomPanel.Visible;
            leftVisible = dev.App.LeftPanel.Visible;
            topVisible = dev.App.TopPanel.Visible;
        }
        dev.App.TopPanel.SetVisible(!isunfull ? false : topVisible);
        dev.App.LeftPanel.SetVisible(!isunfull ? false : leftVisible);
        dev.App.RightPanel.SetVisible(!isunfull ? false : rightVisible);
        dev.App.BottomPanel.SetVisible(!isunfull ? false : bottomVisible);
    }
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
                if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) e.coordinate = dev.proj.transform(e.coordinate, mapproj.getCode(), dev.App.Config.SystemMap.DataEPSG);
                var pointf = new dev.Feature(new dev.geom.Point(e.coordinate));
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
        var querys = new dev.Querys();
        querys.Target.bind("onQuerysCompleted", function (s, e) {
            dev.ClearMapTip();
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
            dev.ShowMapTip(featrues, params, feature.getGeometry().getCoordinates());
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
        dev.ClearMapTip();
    };
    //end
    function measuregeometry(measuretype) {
        if (!dev.IsNull(measureControl)) {
            measureControl.Destroy();
            measureControl = null;
        }
        measureControl = new dev.Draw({
            Map: dev.App.Map,
            Layer: dev.MapUtils.GetTempLayer("tempMeasureLayer"),
            State: "Measure"
        });
        measureControl.Target.unbind("onDrawCompleted");
        measureControl.Target.bind("onDrawCompleted", function (sender, o) {
            measureControl.Destroy();
            measureControl = null;
            //测量完成
            if (o.getGeometry() instanceof dev.geom.LineString) createMeasureTooltip("终点", o.getGeometry().getLastCoordinate(), [5, 25]);
            if (o.getGeometry() instanceof dev.geom.Polygon) createMeasureTooltip("总面积：" + formatArea(o.getGeometry()), o.getGeometry().getInteriorPoint().getCoordinates(), null, true);
            dev.Observable.unByKey(measurelistener);
            measurelistener = null;
            dev.measureState = false;
            //改变样式
            if (dev.finestate)
                dev.App.MapPanel.MapDOM.css("cursor", "default");
            else
                dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "image/hands.cur),auto");
        });
        measureControl.Target.unbind("onDrawStart");
        measureControl.Target.bind("onDrawStart", function (sender, o) {
            //改变样式 
            var num = o.getGeometry().getCoordinates().length;
            measurelistener = o.getGeometry().on("change", function (evt) {
                var geom = evt.target;
                if (geom instanceof dev.geom.LineString) {
                    if (geom.getCoordinates().length > num) {
                        num = geom.getCoordinates().length;
                        var pointfeature = new dev.Feature({
                            id: "measure" + new Date().getTime(),
                            geometry: new dev.geom.Point(geom.getLastCoordinate())
                        });
                        dev.MapUtils.AddFeature(pointfeature, "tempMeasureLayer", dev.App.Map, false);
                        //获取距离
                        var distance = formatLength(geom);
                        createMeasureTooltip(distance, geom.getLastCoordinate());
                    }
                }
            });
            if (o.getGeometry() instanceof dev.geom.LineString) {
                var pointfeature = new dev.Feature({
                    id: "measure" + new Date().getTime(),
                    geometry: new dev.geom.Point(o.getGeometry().getLastCoordinate())
                });
                dev.MapUtils.AddFeature(pointfeature, "tempMeasureLayer", dev.App.Map, false);
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
        //改变样式
        if (dev.finestate)
            dev.App.MapPanel.MapDOM.css("cursor", "default");
        else
            dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "image/hands.cur),auto");
    };
    /*测量*/
    var formatLength = function (line) {
        var wgs84Sphere = new dev.Sphere(6378137);
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
        var wgs84Sphere = new dev.Sphere(6378137);
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
        var measureTooltip = new dev.Overlay({
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
        dragBox = new dev.interaction.DragBox({ className: "ZoomDragBox" });
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

})(jQuery);
/*街景显示*/
(function ($) {
    var heatmaplayer;
    var streetpointmove;
    var mapsingleclick;
    var showfeatures = [];
    var minimapclick;
    function getUrl(o) {
        var url = o.WFS + "?service=wfs&request=GetFeature&typename=" + o.TypeName + "&srsname=" + o.SrsName + "&outputFormat=" + o.OutputFormat + "&version=" + o.Version;
        if (!dev.IsNull(o.CqlFilter)) {
            o.CqlFilter = o.CqlFilter.replace(/and\s*1=1|AND\s*1=1|1=1\s*AND|1=1\s*and|1=1\s*OR|1=1\s*or|1=1\s*/, "");
            if (!Dev.IsNull(o.CqlFilter) && o.CqlFilter.length > 0) url += "&cql_filter=" + encodeURI(o.CqlFilter.trim());
        }
        return url;
    }
    function getdefualtlayers() {
        var config = dev.App.Config.Extend.LayerForTree.LayerRoot.clone();
        var layerinfoparent = Enumerable.From(config).Where('s=>s.ID=="streetlayer"').FirstOrDefault();
        if (!dev.IsNull(layerinfoparent) && !dev.IsNull(layerinfoparent.Child)) {
            if (dev.IsNull(layerinfoparent.Child.length)) layerinfoparent.Child = [layerinfoparent.Child];
        }
        return layerinfoparent.Child;
    }
    dev.StreetView = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        //获取图层信息
        this.ID = dev.IsNull(opt.ID) ? "streeview" + new Date().getTime() : opt.ID;
        this.SrsName = dev.IsNull(opt.SrsName) ? "EPSG:4326" : opt.SrsName;
        this.OutputFormat = dev.IsNull(opt.OutputFormat) ? "json" : opt.OutputFormat;
        this.Version = dev.IsNull(opt.Version) ? "2.0.0" : opt.Version;
        this.CqlFilter = opt.CqlFilter;
        this.IMGUrl = dev.IsNull(opt.IMGUrl) ? dev.GetSystemUrlByRelID("StreetIMGView") : opt.IMGUrl;
        var layerchids;
        if (dev.IsNull(opt.layerInfo)) {
            if (dev.IsNull(layerchids)) layerchids = getdefualtlayers();
            this.LayerInfo = Enumerable.From(layerchids).Where('s=>s.Value="streetview"').FirstOrDefault();
        }
        else this.LayerInfo = opt.layerInfo;
        if (dev.IsNull(opt.routeLayerInfo)) {
            if (dev.IsNull(layerchids)) layerchids = getdefualtlayers();
            this.RouteLayerInfo = Enumerable.From(layerchids).Where('s=>s.Value=="streetRoute"').FirstOrDefault();
        }
        else this.RouteLayerInfo = opt.RouteLayerInfo;
        var $this = this;
        this.CanClick = false;
        var maindiv = $('<div class="main" id="streetControl" style="position:relative; top: 0px; height: 100%; width: 100%; left: 0px; background-color: white;display:block;z-index:10005"><div class="container"></div> </div>');
        maindiv.appendTo(dev.App.MapPanel.MapDOM);
        var advancebtn = $('<div class="btn" btntype="next" tag="0" style="width:103px;height:44px;background-image:url(' + dev.App.Root + "streetview/forward.png" + ');position:absolute;z-index:100;left:' + ((dev.App.MapPanel.MapDOM.width() - 103) / 2) + 'px;top:' + (((dev.App.MapPanel.MapDOM.height() - 44) / 2) - 60) + 'px;"></div>').appendTo(maindiv);
        var recedebnt = $('<div class="btn" btntype="pre" tag="0" style="width:148px;height:90px;background-image:url(' + dev.App.Root + "streetview/back.png" + ');position:absolute;z-index:100;left:' + ((dev.App.MapPanel.MapDOM.width() - 148) / 2) + 'px;top:' + (((dev.App.MapPanel.MapDOM.height() - 90) / 2) + 30) + 'px"></div>').appendTo(maindiv);
        $(".btn", maindiv).click(function () {
            var tag = parseInt($(this).attr("tag"));
            var btntype = $(this).attr("btntype");
            var index = (btntype == "next") ? (tag + 1) : (tag - 1);
            $(".btn", maindiv).attr("tag", index);
            var needata = getneedsource(index, $this.SelectFeature.getProperties().PICKDATE);
            if (dev.IsNull(needata)) return;
            dev.MapUtils.ClearFeature("tempGraphicLayer", $this.miniMap);
            needata.setStyle(new dev.style.Style({
                image: new dev.style.Icon({ src: dev.App.Root + "streetview/camera-small.png", anchor: [0.5, 1] }),
            }));
            var mapproj = dev.App.Map.getView().getProjection();
            var tem_f = needata.clone();
            if (mapproj.getCode() == dev.App.Config.SystemMap.DataEPSG) {
                tem_f.getGeometry().transform(dev.App.Config.SystemMap.OldDisplayEPSG, dev.App.Config.SystemMap.DataEPSG);
                isconvert = true;
            }
            dev.MapUtils.AddFeature(tem_f, "tempGraphicLayer", $this.miniMap, false);
            initimg($this.IMGUrl + needata.getProperties().IMAGENAME, $this);
        })
        this.mapdiv = $('<div style="position:absolute;left:0px;bottom:0px;height:200px;width:250px;background-color:#fff;"></div>').appendTo(maindiv);
        var streetclose = $('<div style="cursor:default; top:0px;width:50px;height: 60px;text-align:center;right: 0px;color:rgb(255, 255, 255);line-height:55px;padding-left:10px;font-size:30px;font-weight:bold;position:absolute;border-bottom-left-radius:60px;background-color:rgba(0, 0, 0, 0.6);">×</div>').appendTo(maindiv);
        streetclose.click(function () {
            $this.SetVisible(false);
        });
        FuncEx(this);
    }
    function FuncEx(control) {
        $.fn.extend(control, {
            LoadStreet: function (opt) {
                var $this = this;
                if (!dev.IsNull(opt)) {
                    if (!dev.IsNull(opt.SrsName)) this.SrsName = opt.SrsName;
                    if (!dev.IsNull(opt.OutputFormat)) this.OutputFormat = opt.OutputFormat;
                    if (!dev.IsNull(opt.Version)) this.Version = opt.Version;
                    if (!dev.IsNull(opt.layerInfo)) this.LayerInfo = opt.LayerInfo;
                    if (!dev.IsNull(opt.CqlFilter)) this.CqlFilter = opt.CqlFilter;
                    if (!dev.IsNull(opt.RouteLayerInfo)) this.RouteLayerInfo = opt.RouteLayerInfo;
                }
                if (dev.IsNull(this.LayerInfo) || dev.IsNull(this.RouteLayerInfo)) return;
                //添加wms
                addwms(this.RouteLayerInfo);
                //显示中心点
                var c_extend = this.RouteLayerInfo.Envelop.split(',');
                var center = [(parseFloat(c_extend[0]) + parseFloat(c_extend[2])) / 2, (parseFloat(c_extend[1]) + parseFloat(c_extend[3])) / 2];
                var mapproj = dev.App.Map.getView().getProjection();
                if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) center = dev.proj.transform(center, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
                dev.App.Map.getView().setCenter(center, dev.App.Map.getSize());
                dev.App.Map.getView().setZoom(dev.App.Config.SystemMap.Zoom);
                //判断是否存在
                dev.MapUtils.RemoveLayer("streetviewlayer", dev.App.Map);
                heatmaplayer = new dev.layer.Heatmap({
                    id: "streetviewlayer",
                    source: new dev.source.Vector({
                        url: getUrl({
                            WFS: dev.GetSystemUrlByRelID(this.LayerInfo.WFSUrl),
                            TypeName: this.LayerInfo.TypeName,
                            SrsName: this.SrsName,
                            OutputFormat: this.OutputFormat,
                            Version: this.Version
                        }),
                        format: new dev.format.GeoJSON({
                            extractStyles: false
                        })
                    }),
                    gradient: ["rgba(0,0,0,0.3)", "rgba(0,0,0,0.3)"],
                    blur: 0,
                    radius: 10,
                    opacity: 0,
                    layerparaminfo: {
                        Type: "HEATMAP",
                        ID: "streetviewlayer",
                        WFSUrl: this.LayerInfo.WFSUrl,
                        TypeName: this.LayerInfo.TypeName,
                        OutputFormat: this.OutputFormat,
                        Version: this.Version,
                        colors: ["rgba(0,0,0,0.3)", "rgba(0,0,0,0.3)"],
                        isevent: true,
                        eventname: "addfeature",
                        featurepre: "streeview"
                    }
                });
                heatmaplayer.getSource().on('addfeature', function (event) {
                    event.feature.setId("streeview" + new Date().getTime());
                    showfeatures.push(event.feature);
                });
                //添加图层
                dev.App.Map.addLayer(heatmaplayer);
                streetpointmove = dev.App.Map.on("pointermove", function (event) {
                    var ishavefeature = false;
                    dev.App.Map.forEachFeatureAtPixel(event.pixel, function (feature) {
                        if (ishavefeature) return;
                        if (!dev.IsNull(feature.getId()) && feature.getId().indexOf("streeview") >= 0) { ishavefeature = true; $this.SelectFeature = feature; }// 
                    });
                    $this.CanClick = ishavefeature;
                    // dev.App.MapPanel.MapDOM.css("cursor", "default");
                    if (!ishavefeature) $this.SelectFeature = null;
                    //else {
                    //    dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "streetview/camera-large.ico" + "),auto");
                    //}
                    $this.ShowTip(event.coordinate);
                });
                mapsingleclick = dev.App.Map.on("singleclick", function (event) {
                    if (!$this.CanClick || dev.IsNull($this.SelectFeature)) return;
                    //dev.App.MapPanel.MapDOM.css("cursor", "default");
                    $this.ShowStreetImg();
                });
            },
            ShowTip: function (point) {
                if (dev.IsNull(this.streeimgtip)) {
                    this.popup = $('<div id=' + this.ID + ' class="ol-default-popup" ><div id="tipImg" style="height:100px;width:130px;"><canvas id="imgcanvas" style="height:100px;width:130px;"><canvas></div></div>');
                    this.content = this.popup.children('div#tipImg');
                    this.streeimgtip = new dev.Overlay({
                        id: this.ID,
                        element: this.popup[0],
                        offset: [-20, 0],
                        autoPan: true,
                        autoPanAnimation: { duration: 250 }
                    });
                    dev.App.Map.addOverlay(this.streeimgtip);
                }
                if (dev.IsNull(this.SelectFeature)) this.streeimgtip.setPosition(undefined);
                else {
                    this.streeimgtip.setPosition(point);
                    //添加canvas 
                    var temcanvas = document.getElementById("imgcanvas");;
                    var context = temcanvas.getContext("2d");
                    var img = new Image();
                    img.onload = function () {
                        context.drawImage(img, 1000, 1000, 690, 490, 0, 0, 690, 490);
                    };
                    img.src = this.IMGUrl + this.SelectFeature.getProperties().IMAGENAME;
                }
            },
            ShowStreetImg: function () {
                var $this = this;
                if (dev.IsNull(this.SelectFeature)) return;
                //显示位置
                if (dev.IsNull(this.miniMap)) {
                    this.miniMap = initmap(this.mapdiv);
                    addwms(this.RouteLayerInfo, this.miniMap);
                    var extent = this.RouteLayerInfo.Envelop.split(',');
                    var initExtent = [parseFloat(extent[0]), parseFloat(extent[1]), parseFloat(extent[2]), parseFloat(extent[3])];
                    // this.miniMap.getView().fit(initExtent, this.miniMap.getSize());
                    this.miniMap.getView().setZoom(17);
                    this.miniMap.getView().setCenter(this.SelectFeature.getGeometry().getCoordinates());
                    //添加点击事件
                    minimapclick = this.miniMap.on("singleclick", function (evt) {
                        var result = dev.PointerQuery({
                            Map: $this.miniMap,
                            PX: 2,
                            Point: evt.coordinate,
                            GeometryName: $this.LayerInfo.GeomField,
                            Url: dev.GetSystemUrlByRelID($this.LayerInfo.WFSUrl),
                            TypeName: $this.LayerInfo.TypeName
                        });
                        if (dev.IsNull(result) || result.length == 0) return;
                        $this.SelectFeature = result[0];
                        var mapproj = $this.miniMap.getView().getProjection();
                        if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) $this.SelectFeature.getGeometry().transform(dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
                        selectfeature($this);
                    });
                }
                else if (dev.App.Map.getView().getProjection().getCode() != $this.miniMap.getView().getProjection().getCode()) $this.UpdateMiniView();
                //添加点
                selectfeature(this);
            },
            SetVisible: function (visible) {
                if (!visible) {
                    var maindiv = $("#streetControl", dev.App.MapPanel.MapDOM)
                    maindiv.css({ "position": "relative", "display": "none" });
                }
            },
            Clear: function () {
                dev.MapUtils.RemoveLayer("streetviewlayer", dev.App.Map);
                dev.MapUtils.RemoveLayer(this.RouteLayerInfo.Value, dev.App.Map);
                if (!dev.IsNull(streetpointmove)) { dev.App.Map.unByKey(streetpointmove); streetpointmove = null; }
                if (!dev.IsNull(mapsingleclick)) { dev.App.Map.unByKey(mapsingleclick); mapsingleclick = null; }
                if (!dev.IsNull(this.PanView)) { this.PanView.clean(); }
                if (!dev.IsNull(this.streeimgtip)) { dev.App.Map.removeOverlay(this.streeimgtip); this.streeimgtip = null; }
                if (!dev.IsNull(this.miniMap)) {
                    if (!dev.IsNull(minimapclick)) { this.miniMap.unByKey(minimapclick); minimapclick = null; }
                    dev.MapUtils.ClearFeature("tempGraphicLayer", this.miniMap);
                    dev.MapUtils.RemoveLayer(this.RouteLayerInfo.Value, this.miniMap);
                    this.mapdiv.empty();
                    this.miniMap = null;
                }
                $("#streetControl", dev.App.MapPanel.MapDOM).remove();
                // dev.App.MapPanel.MapDOM.css("cursor", "default");
            },
            UpdateMiniView: function () {
                dev.RefreshMap(this.miniMap);
            }

        })
    }
    function addwms(layerinfo, map) {
        //根据ID先删除
        if (dev.IsNull(layerinfo)) return;
        dev.MapUtils.RemoveLayer(layerinfo.Value, dev.IsNull(map) ? dev.App.Map : map);
        var param = {
            ID: layerinfo.Value,
            Url: dev.GetSystemUrlByRelID(layerinfo.WFSUrl),
            Layers: layerinfo.TypeName,
            ServerType: layerinfo.ServerType,
            Map: dev.IsNull(map) ? dev.App.Map : map,
            EPSG: dev.App.Config.SystemMap.DisplayEPSG
        };
        if (!dev.IsNull(layerinfo.SldLegend)) {
            if (dev.IsNull(layerinfo.SldLegend.length)) layerinfo.SldLegend = [layerinfo.SldLegend];
            param.Sldbody = dev.GetSLDString(layerinfo.TypeName, dev.LegendToRule(layerinfo.SldLegend, "line"));
        };
        dev.MapLoad.AddWMSLayer(param);

    }
    function selectfeature($this) {
        var maindiv = $("#streetControl", dev.App.MapPanel.MapDOM);
        maindiv.css({ "position": "absolute", "display": "block" });
        dev.MapUtils.ClearFeature("tempGraphicLayer", $this.miniMap);
        $this.SelectFeature.setStyle(new dev.style.Style({
            image: new dev.style.Icon({ src: dev.App.Root + "streetview/camera-small.png", anchor: [0.5, 1] }),
        }));
        dev.MapUtils.AddFeature($this.SelectFeature, "tempGraphicLayer", $this.miniMap,false);
        var btns = $(".btn", maindiv);
        for (var i = 0; i < btns.length; i++) $(btns[i]).attr("tag", $this.SelectFeature.getProperties().ORDERNUM);
        initimg($this.IMGUrl + $this.SelectFeature.getProperties().IMAGENAME, $this);

    }
    function initimg(imgurl, $this) {
        if ($this.StreeLoading) return;
        $this.StreeLoading = true;
        var div = $(".container", $("#streetControl", dev.App.MapPanel.MapDOM));
        var childnum = div.children().length;
        var newdiv = childnum > 0 ? $('<div class="container" style="display:none;"></div>').appendTo($("#streetControl", dev.App.MapPanel.MapDOM)) : div;
        var opt = {
            container: newdiv[0],
            url: imgurl,
            width: dev.App.MapPanel.MapDOM.width(),
            height: dev.App.MapPanel.MapDOM.height(),
            widthSegments: 60,//水平切段数
            heightSegments: 30,
            pRadius: 1000,
            minFocalLength: 6,//镜头最a小拉近距离
            maxFocalLength: 16,//镜头最大拉近距离
            showlable: 'show'
        }
        $this.PanView = new tpanorama(opt);
        $this.PanView.init();
        if (childnum > 0) {
            setTimeout(function () {
                newdiv.css("display", "block");
                div.remove();
                $this.StreeLoading = false;
            }, 300);
        }
        else {
            $this.StreeLoading = false;
        }
    }

    function getneedsource(index, date) {
        var currdata = Enumerable.From(showfeatures).Where('s=>s.getProperties().ORDERNUM=="' + index + '" && s.getProperties().PICKDATE=="' + date + '"').FirstOrDefault();
        return currdata;
    }
    function initmap(parent) {
        var initconfig = dev.App.Config.SystemMap;
        var resolutions;
        if (!dev.IsNull(initconfig.LevelInfo) && !dev.IsNull(initconfig.LevelInfo.IsVisibleLevel) && initconfig.LevelInfo.IsVisibleLevel == "true") {
            resolutions = [];
            for (var i = 0; i < initconfig.LevelInfo.Levels.length; i++) {
                if (dev.App.Config.SystemMap.DisplayEPSG == 'EPSG:3857') resolutions.push(parseFloat(initconfig.LevelInfo.Levels[i].Resolution3857));
                else resolutions.push(parseFloat(initconfig.LevelInfo.Levels[i].Resolution));
            }
        }
        var view = new dev.View({
            projection: dev.App.Config.SystemMap.DisplayEPSG,
            resolutions: resolutions,
            minZoom: 1,
            maxResolution: resolutions[resolutions.length - 1],
            maxZoom: 20,
            minResolution: resolutions[0],
        });
        var map = new dev.Map({
            controls: new dev.control.defaults({ zoom: false, rotate: false, attribution: false }),
            interactions: dev.interaction.defaults().extend([new dev.interaction.DragRotateAndZoom()]),
            target: parent[0],
            logo: false,
            view: view
        });
        dev.MapLoad.InitMap($.extend({ Map: map }, initconfig));
        var initExtent = [parseFloat(initconfig.Extent.XMin), parseFloat(initconfig.Extent.YMin), parseFloat(initconfig.Extent.XMax), parseFloat(initconfig.Extent.YMax)];
        var mapproj = dev.App.Map.getView().getProjection();
        if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
            initExtent = dev.proj.transformExtent(initExtent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
        }
        map.getView().fit(initExtent, map.getSize());
        return map;
    }

})(jQuery);
/*点云显示*/
(function ($) {

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
                        dev.Legend.SetData(nodes[i].SldLegend);
                        dev.Legend.SetVisible(true);
                        param.Sldbody = dev.GetSLDString(nodes[i].TypeName, dev.LegendToRule(nodes[i].SldLegend, nodes[i].GeomType))
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

    dev.initTreeLayer = function () {
        if (dev.IsNull(dev.Legend)) dev.InitLegend();
        tilelegend = new UCTileLegend(dev, { Right: 10, Bottom: 50 });
        dev.App.MapPanel.MapDOM.append(tilelegend.Target);
        tilelegend.Layout();
        tilelegend.SetVisible(false);
        if (dev.IsNull(dev.App.treedata)) {
            var treeconfig = dev.App.Config.Extend.LayerForTree;
            var temp = dev.ObjClone(treeconfig);
            if (!dev.IsNull(temp.LayerRoot) && dev.IsNull(temp.LayerRoot.length)) temp.LayerRoot = [temp.LayerRoot];
            layertreeInfo = temp.LayerRoot.clone();
            //后去过滤数据
            layertreeInfo = dev.GetTreeLayers(dev.TreeLayerType.Tipoc);
        }
        else layertreeInfo = dev.App.treedata;
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
                var envelarry = getlayerextent(o.$this);
                if (dev.IsNull(envelarry) && !dev.IsNull(o.$this.Envelop)) envelarry = o.$this.Envelop.split(',');
                if (dev.IsNull(envelarry)) return;
                if (envelarry.length < 4 || isNaN(envelarry[0]) || isNaN(envelarry[1]) || isNaN(envelarry[2]) || isNaN(envelarry[3])) return;

                //dev.App.Map.getView().centerOn([((parseFloat(envelarry[0]) + parseFloat(envelarry[2])) / 2), ((parseFloat(envelarry[1]) + parseFloat(envelarry[3])) / 2)], dev.App.Map.getSize(), [dev.App.Map.getSize()[0] / 2, dev.App.Map.getSize()[1] / 2]);
                var initExtent = [parseFloat(envelarry[0]), parseFloat(envelarry[1]), parseFloat(envelarry[2]), parseFloat(envelarry[3])];
                var mapproj = dev.App.Map.getView().getProjection();
                if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
                    initExtent = dev.proj.transformExtent(initExtent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
                }
                dev.App.Map.getView().fit(initExtent, dev.App.Map.getSize());
                //  if (!dev.IsNull(o.$this.Zoom) && parseFloat(o.$this.Zoom) > 0) dev.App.Map.getView().setZoom(parseFloat(o.$this.Zoom));
                dev.Map3DUtils.SetView([parseFloat(envelarry[0]), parseFloat(envelarry[1])], [parseFloat(envelarry[2]), parseFloat(envelarry[3])]);
                if (dev.IsNull(o.$this.CountyCode)) return;
                //查询数据
                var currdata = dev.QueryXZQ(o.$this.CountyCode, "county");
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
    //获取图层所需范围
    function getlayerextent(layerinfo) {
        if (dev.IsNull(layerinfo) || dev.IsNull(layerinfo.CompareInfo) || dev.IsNull(layerinfo.CompareInfo.DBTableName)) return null;
        var con = "1=1";
        if (!dev.IsNull(layerinfo.SldLegend) && layerinfo.SldLegend.length > 0) {
            var filter = "";
            for (var i = 0; i < layerinfo.SldLegend.length; i++) {
                if (dev.IsNull(layerinfo.SldLegend[i].Filter)) continue;
                filter += layerinfo.SldLegend[i].Filter + " OR ";
            }
            if (!dev.IsNull(filter) && filter.length > 0) {
                filter = filter.substr(0, filter.length - 4);
                con += " AND (" + filter + ")";
            }
        }
        var extend;
        $.ajax({
            type: "POST",
            contentType: "application/json;charset=UTF-8",
            data: dev.ConvertDBFilter(con),
            url: dev.GetSystemUrlByRelID("Service") + "massif/getBounding/" + layerinfo.CompareInfo.DBTableName,
            async: false,
            success: function (result) {
                if (!dev.IsNull(result.data) && result.data.length > 0 && !dev.IsNull(result.data[0].MINX) && !dev.IsNull(result.data[0].MINY) && !dev.IsNull(result.data[0].MAXX) && !dev.IsNull(result.data[0].MAXY)) {
                    extend = [];
                    extend.push(result.data[0].MINX);
                    extend.push(result.data[0].MINY);
                    extend.push(result.data[0].MAXX);
                    extend.push(result.data[0].MAXY);
                }
            }
        });
        return extend;
    }
    function locationbyselect(selectnode) {
        var envelop = selectnode.Envelop;
        if (dev.IsNull(envelop)) return;
        var envelarry = envelop.split(',');
        if (envelarry.length < 4 || isNaN(envelarry[0]) || isNaN(envelarry[1]) || isNaN(envelarry[2]) || isNaN(envelarry[3])) return;
        //dev.App.Map.getView().centerOn([((parseFloat(envelarry[0]) + parseFloat(envelarry[2])) / 2), ((parseFloat(envelarry[1]) + parseFloat(envelarry[3])) / 2)], dev.App.Map.getSize(), [dev.App.Map.getSize()[0] / 2, dev.App.Map.getSize()[1] / 2]);
        //if (!dev.IsNull(selectnode.Zoom) && parseFloat(selectnode.Zoom) > 0) dev.App.Map.getView().setZoom(parseFloat(selectnode.Zoom));

        var initExtent = [parseFloat(envelarry[0]), parseFloat(envelarry[1]), parseFloat(envelarry[2]), parseFloat(envelarry[3])];
        var mapproj = dev.App.Map.getView().getProjection();
        if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
            initExtent = dev.proj.transformExtent(initExtent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
        }
        dev.App.Map.getView().fit(initExtent, dev.App.Map.getSize());

        dev.Map3DUtils.SetView([parseFloat(envelarry[0]), parseFloat(envelarry[1])], [parseFloat(envelarry[2]), parseFloat(envelarry[3])]);
        if (dev.IsNull(selectnode.CountyCode)) return;
        var currdata = dev.QueryXZQ(selectnode.CountyCode, "county");
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
    var issubmit = false;
 
    function showeidtTool() {//参数、图层信息
        if (dev.IsNull(selectlayerinfo)) return;
        setlayerposition(selectlayerinfo);
        if (dev.IsNull(edittoolwin)) {
            edittoolwin = new dev.Window({
                ID: "edittoolwin",
                IconCls: 'machine-type',
                Title: "编辑工具",
                Parent: dev.App.MapPanel.Target,
                Maximizable: false,
                Modal: false,
                Draggable: true,
                HAlign: 'center',
                VAlign: 'absolute',
                Resizable: false,
                Height: 70,
                Width: 297,
                Top: 20
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
                dev.drawstate = false;
                dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "image/hands.cur),auto");
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
                        layer_draw = new dev.Draw({
                            Map: dev.App.Map,
                            Layer: dev.MapUtils.GetTempLayer("tempDrawLayer"),
                            State: "addElement"
                        });
                        layer_draw.Target.bind("onDrawCompleted", function (sender, o) {
                            dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "image/hands.cur),auto");
                            dev.drawstate = false;
                            //判断是否在对应的县
                            dev.drawstate = false;
                            dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "image/hands.cur),auto");
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
                                //if (dev.IsNull(dialog)) dialog = new dev.Messager({ AutoShow: false });
                                //dialog.Alert("请在该图层所在行政区划县绘制图形！", "info", function () {
                                //    dev.MapUtils.ClearFeature("tempDrawLayer");
                                //});
                                addfeature = o;
                                var info = {};
                                info.PROVINCE = "江苏省";
                                info.CITY = "南京市";
                                info.COUNTY = "浦口区";
                                info.TOWN = "汤泉街道";
                                //info.VILLAGE = "";
                                info.REGIONSID = "320111006";
                                info.ID = Guid.NewGuid().ToString("N");
                                addfeature.setProperties(info);
                            }
                            else {
                                //获取所在乡镇
                                var towns = getTownbyFeature(newfeature);
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
                                    var modal = $('<div style="position:absolute; width:' + dev.App.FillPanel.Target.width() + 'px;height:' + dev.App.FillPanel.Target.height() + 'px;background:rgba(255,255,255,0.5);z-index:10000;"></div>');
                                    dev.App.FillPanel.Target.append(modal);
                                    var contentleft = parseInt(dev.App.FillPanel.Target.width() / 2) - 147;
                                    var contenttop = parseInt(dev.App.FillPanel.Target.height() / 2) - 76;
                                    var content = $('<div style="height:112px;width:295px;position:absolute;left:' + contentleft + 'px;top:' + contenttop + 'px;z-index:10001;border:1px solid #0099cc;"></div>').appendTo(dev.App.FillPanel.Target);
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
                                //$("div[tag='attriupdate']", edittoolwin.Target).removeClass("DisableButton").addClass("Button");
                                //$("div[tag='save']", edittoolwin.Target).removeClass("DisableButton").addClass("Button");
                                //$("div[tag='cancel']", edittoolwin.Target).removeClass("DisableButton").addClass("Button");
                            }
                            $("div[tag='attriupdate']", edittoolwin.Target).removeClass("DisableButton").addClass("Button");
                            $("div[tag='save']", edittoolwin.Target).removeClass("DisableButton").addClass("Button");
                            $("div[tag='cancel']", edittoolwin.Target).removeClass("DisableButton").addClass("Button");
                        });
                        layer_draw.Start("Polygon");
                        dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "image/cursor_draw.cur),auto");
                        dev.drawstate = true;
                    }
                }
                if (tag == "select") {
                    //初始化地图点击事件
                    clear_oparate();
                    addfeature = null;
                    isupdate = true;
                    dev.drawstate = true;
                    dev.App.MapPanel.MapDOM.css("cursor", "");
                    if (dev.IsNull(mapsinlgclick)) {
                        mapclickkey = dev.App.Map.on("singleclick", function (e) {
                            if (!isupdate) return;
                            dev.drawstate = false;
                            dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "image/hands.cur),auto");
                            var result = dev.PointerQuery({
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
                            var queryfeature = new dev.Feature(new dev.geom.Polygon(geometry.getCoordinates()));
                            queryfeature.setProperties(temp.getProperties());
                            var selectSource = new dev.Collection();
                            selectSource.push(queryfeature);
                            loadVectorLayer(selectlayerinfo, selectSource);
                            //初始化modify
                            if (!dev.IsNull(modifyInteraction)) {
                                dev.App.Map.removeInteraction(modifyInteraction);
                                modifyInteraction = null;
                            }
                            modifyInteraction = new dev.interaction.Modify({
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
                        var formatwfs = new dev.format.WFS();
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
                    if (issubmit) return;
                    issubmit = true;
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
                        var newfeature = new dev.Feature(new dev.geom.MultiPolygon([points]));
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
                        wfsxml = dev.getWFSInsetXml(newfeature, {
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
                        var formatwfs = new dev.format.WFS();
                        var mapproj = dev.App.Map.getView().getProjection();
                        if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
                            newf = dev.MapUtils.TransformFeatureCRS(newf, mapproj.getCode(), dev.App.Config.SystemMap.DataEPSG);
                        }
                        var newfeature = transformCoor(newf);
                        var nfp = dev.ObjClone(newfeature.getProperties());
                        delete nfp.boundedBy;
                        delete nfp.bbox;
                        var clone = new dev.Feature(nfp);
                        clone.setId(newfeature.getId());
                        var formatwfs = new dev.format.WFS();
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
                            issubmit = false;
                        },
                        error: function (msg) { issubmit = false; }
                    });
                }
                if (tag == "cancel") {
                    isupdate = false;
                    dev.drawstate = false;
                    dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "image/hands.cur),auto");
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
        var query = new dev.WFS_H();
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
        var query = new dev.WFS_H();
        query.Target.bind("onQueryCompleted", function (s, e) {
            if (e.statusCode == 200 && !dev.IsNull(e.data) && e.data.length > 0) data = e.data;
        });
        query.Query(param);
        return data;
    }

    //初始化临时图层
    function loadVectorLayer(layerinfo, features) {
        if (!dev.IsNull(templayer)) dev.MapUtils.RemoveLayer("eidtlayertemp");;
        templayer = new dev.layer.Vector({
            id: 'eidtlayertemp',
            source: new dev.source.Vector({ features: features }),
            style: function (feature, resolution) {
                return new dev.style.Style({ stroke: new dev.style.Stroke({ color: 'red', width: 2 }) });
            },
            zIndex: 10010,
            type: "TempVector"
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
                Parent: dev.App.FillPanel.Target,
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
                var currarea = dev.geomArae(feature.getGeometry());
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
            initExtent = dev.proj.transformExtent(initExtent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
        }
        dev.App.Map.getView().fit(initExtent, dev.App.Map.getSize());
        dev.App.Map.getView().setZoom(parseInt(dev.IsNull(layerinfo.Zoom) ? dev.App.Config.SystemMap.Zoom : layerinfo.Zoom));
        // dev.App.Map.getView().centerOn([((parseFloat(envelarry[0]) + parseFloat(envelarry[2])) / 2), ((parseFloat(envelarry[1]) + parseFloat(envelarry[3])) / 2)], dev.App.Map.getSize(), [dev.App.Map.getSize()[0] / 2, dev.App.Map.getSize()[1] / 2]);
        //  dev.App.Map.getView().setZoom(parseInt(dev.IsNull(layerinfo.Zoom) ? dev.App.Config.SystemMap.Zoom : layerinfo.Zoom));
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
            dev.MapUtils.RemoveLayer("eidtlayertemp");
        }
        dev.MapUtils.ClearFeature("tempDrawLayer");
        $("div[tag='delete']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
        $("div[tag='attriupdate']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
        $("div[tag='save']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
        $("div[tag='cancel']", edittoolwin.Target).removeClass("Button").addClass("DisableButton");
        if (!dev.IsNull(editwin)) editwin.Close();
    }
})(jQuery);
/*两个图形相交图形wps*/
; (function ($) {
    function getIntersectionXml(t) {
        var wpsstr = '<?xml version="1.0" encoding="UTF-8"?>';
        if (dev.IsNull(t)) return wpsstr;
        if (dev.IsNull(t.Version)) t.version = "1.0.0";
        wpsstr += '<wps:Execute version="' + t.Version + '" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/1.1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">';
        wpsstr += '<ows:Identifier>geo:intersection</ows:Identifier>';
        wpsstr += '<wps:DataInputs>';
        if (!dev.IsNull(t.Features) && t.Features.length > 0) {
            for (var i = 0; i < t.Features.length; i++) {
                wpsstr += '<wps:Input><ows:Identifier>' + (i == 0 ? "a" : "b") + '</ows:Identifier>';
                wpsstr += '<wps:Data>';
                wpsstr += ' <wps:ComplexData mimeType="text/xml; subtype=gml/3.1.1"><![CDATA[' + dev.GetWKTByFeature(t.Features[i], false) + ']]></wps:ComplexData>';
                wpsstr += '</wps:Data></wps:Input>';
            }
        }
        wpsstr += '</wps:DataInputs>';
        if (dev.IsNull(t.Outputformat)) t.Outputformat = "application/json";
        wpsstr += '<wps:ResponseForm>';
        wpsstr += '<wps:RawDataOutput mimeType="' + t.Outputformat + '">';
        wpsstr += '<ows:Identifier>result</ows:Identifier>';
        wpsstr += '</wps:RawDataOutput>';
        wpsstr += '</wps:ResponseForm>';
        wpsstr += '</wps:Execute>';
        return wpsstr;
    }

    dev.WPS_Intersection = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        this.Target = $({ id: "wps" + new Date().getTime() });
        this.Url = dev.IsNull(opt.Url) ? "" : opt.Url;
        this.Version = dev.IsNull(opt.Version) ? "1.0.0" : opt.Version;
        this.Features = dev.IsNull(opt.Features) ? [] : opt.Features;
        this.Outputformat = dev.IsNull(opt.Outputformat) ? "application/json" : opt.Outputformat;
        this.Async = dev.IsBoolean(opt.Async) ? opt.Async : true;
        this.Intersect = function (param) {
            var $this = this;
            if (!dev.IsNull(param)) {
                if (!dev.IsNull(param.Url)) this.Url = param.Url;
                if (!dev.IsNull(param.Version)) this.Version = param.Version;
                if (!dev.IsNull(param.Features) && param.Features.length > 0) this.Features = param.Features;
                if (!dev.IsNull(param.Outputformat)) this.Outputformat = param.Outputformat;
                // if (!dev.IsBoolean(param.Async)) this.Async = param.Async;
            }
            if (dev.IsNull(this.Url) || dev.IsNull(this.Features) || this.Features.length == 0) {
                $this.Target.trigger("onIntersectCompleted", { success: false, msg: '参数不全！' });
                return;
            }
            $.ajax({
                type: "POST",
                url: $this.Url,
                contentType: "application/xml",
                data: getIntersectionXml($this),
                async: $this.Async,
                success: function (o) {
                    var features = [];
                    if ($this.Outputformat == "application/json") {
                        if (dev.IsNull(o.coordinates)) return null;
                        if (o.type == "Polygon") {
                            for (var i = 0; i < o.coordinates.length; i++) {
                                var cgeom = new dev.geom.Polygon([o.coordinates[i]]);
                                features.push(new dev.Feature({ geometry: cgeom }));
                            }
                        }
                        if (o.type == "LineString") {
                            var cgeom = new dev.geom.LineString(o.coordinates);
                            features.push(new dev.Feature(cgeom));
                        }
                        if (o.type == "MultiLineString") {
                            for (var i = 0; i < o.coordinates.length; i++) {
                                var cgeom = new dev.geom.LineString(o.coordinates[i]);
                                features.push(new dev.Feature({ id: new Date().getTime(), geometry: cgeom }));
                            }
                        }
                    }
                    if ($this.Outputformat == "application/wkt") {
                        if (dev.IsNull(o) || o.length == 0) return null;
                        var type = o.substring(0, o.indexOf('('));
                        var coors = o.replace(type, "");
                        if (type.trim() == "MULTILINESTRING") {
                            var lines = coors.split('),');
                            for (var i = 0; i < lines.length; i++) {
                                var linepoints = lines[i].replace(/\(/g, "").split(',');
                                var points = [];
                                for (var j = 0; j < linepoints.length; j++) {
                                    var str = $.trim(linepoints[j]);
                                    points.push([parseFloat(str.split(' ')[0]), parseFloat(str.split(' ')[1])]);
                                }
                                var cgeom = new dev.geom.LineString(points);
                                features.push(new dev.Feature({ id: new Date().getTime(), geometry: cgeom }));
                            }
                        }
                        if (type.trim() == "LINESTRING") {
                            var linepoints = coors.replace(/\(/g, "").split(',');
                            var points = [];
                            for (var i = 0; i < linepoints.length; i++) {
                                var str = $.trim(linepoints[i]);
                                points.push([parseFloat(str.split(' ')[0]), parseFloat(str.split(' ')[1])]);
                            }
                            var cgeom = new dev.geom.LineString(points);
                            features.push(new dev.Feature({ id: new Date().getTime(), geometry: cgeom }));
                        }
                        if (type.trim() == "POINT") {
                            var point = coors.replace(/\(/g, "").split(',');
                            var cgeom = new dev.geom.Point([parseFloat(point[0]), parseFloat(point[1])]);
                            features.push(new dev.Feature({ id: new Date().getTime(), geometry: cgeom }));
                        }
                    }
                    $this.Target.trigger("onIntersectCompleted", { success: true, data: features });
                },
                error: function (s) {
                    $this.Target.trigger("onIntersectCompleted", { success: false, msg: '服务提交失败！' });
                }
            });
        }
    }
})(jQuery);
/*两个图形包含*/
; (function ($) {
    function getContainsXml(t) {
        var wpsstr = '<?xml version="1.0" encoding="UTF-8"?>';
        if (dev.IsNull(t)) return wpsstr;
        if (dev.IsNull(t.Version)) t.version = "1.0.0";
        wpsstr += '<wps:Execute version="' + t.Version + '" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/1.1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">';
        wpsstr += '<ows:Identifier>geo:contains</ows:Identifier>';
        wpsstr += '<wps:DataInputs>';
        if (!dev.IsNull(t.Features) && t.Features.length > 0) {
            for (var i = 0; i < t.Features.length; i++) {
                wpsstr += '<wps:Input><ows:Identifier>' + (i == 0 ? "a" : "b") + '</ows:Identifier>';
                wpsstr += '<wps:Data>';
                wpsstr += ' <wps:ComplexData mimeType="text/xml; subtype=gml/3.1.1"><![CDATA[' + dev.GetWKTByFeature(t.Features[i], false) + ']]></wps:ComplexData>';
                wpsstr += '</wps:Data></wps:Input>';
            }
        }
        wpsstr += '</wps:DataInputs>';
        if (dev.IsNull(t.Outputformat)) t.Outputformat = "application/json";
        wpsstr += '<wps:ResponseForm>';
        wpsstr += '<wps:RawDataOutput mimeType="' + t.Outputformat + '">';
        wpsstr += '<ows:Identifier>result</ows:Identifier>';
        wpsstr += '</wps:RawDataOutput>';
        wpsstr += '</wps:ResponseForm>';
        wpsstr += '</wps:Execute>';
        return wpsstr;
    }
    dev.WPS_Contains = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        this.Target = $({ id: "wps" + new Date().getTime() });
        this.Url = dev.IsNull(opt.Url) ? "" : opt.Url;
        this.Version = dev.IsNull(opt.Version) ? "1.0.0" : opt.Version;
        this.Features = dev.IsNull(opt.Features) ? [] : opt.Features;
        this.Outputformat = dev.IsNull(opt.Outputformat) ? "application/json" : opt.Outputformat;
        this.Async = dev.IsBoolean(opt.Async) ? opt.Async : true;
        this.IsContains = function (param) {
            var $this = this;
            if (!dev.IsNull(param)) {
                if (!dev.IsNull(param.Url)) this.Url = param.Url;
                if (!dev.IsNull(param.Version)) this.Version = param.Version;
                if (!dev.IsNull(param.Features) && param.Features.length > 0) this.Features = param.Features;
                if (!dev.IsNull(param.Outputformat)) this.Outputformat = param.Outputformat;
            }
            if (dev.IsNull(this.Url) || dev.IsNull(this.Features) || this.Features.length == 0) {
                $this.Target.trigger("onIsContainsCompleted", { success: false, msg: '参数不全！' });
                return;
            }
            var iscontian = false;
            $.ajax({
                type: "POST",
                url: $this.Url,
                contentType: "application/xml",
                data: getContainsXml($this),
                async: $this.Async,
                success: function (o) {
                    iscontian = (o == "true");
                }
            });
            return iscontian;
        }

    }
})(jQuery);
/*获取缓冲图形*/
; (function ($) {
    function getbufferxml(t) {
        var wpsstr = '<?xml version="1.0" encoding="UTF-8"?>';
        if (dev.IsNull(t)) return wpsstr;
        if (dev.IsNull(t.Version)) t.Version = '1.0.0';
        wpsstr += '<wps:Execute version="' + t.Version + '" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/1.1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">';
        wpsstr += '<ows:Identifier>geo:buffer</ows:Identifier>';
        wpsstr += '<wps:DataInputs>';
        if (!dev.IsNull(t.Feature)) {
            wpsstr += '<wps:Input><ows:Identifier>geom</ows:Identifier><wps:Data> <wps:ComplexData mimeType="text/xml; subtype=gml/3.1.1"><![CDATA[' + dev.GetWKTByFeature(t.Feature, false) + ']]></wps:ComplexData></wps:Data></wps:Input>';
            var distance;
            if (t.Unit == "m") distance = t.Distance / 111000;
            wpsstr += '<wps:Input><ows:Identifier>distance</ows:Identifier><wps:Data> <wps:LiteralData>' + distance + '</wps:LiteralData></wps:Data></wps:Input>';
        }
        //wpsstr += '<wps:Input><ows:Identifier>quadrantSegments</ows:Identifier><wps:Data><wps:LiteralData>0</wps:LiteralData></wps:Data></wps:Input>';
        wpsstr += ' <wps:Input> <ows:Identifier>capStyle</ows:Identifier> <wps:Data><wps:LiteralData>Flat</wps:LiteralData> </wps:Data></wps:Input>';
        wpsstr += '</wps:DataInputs>';
        wpsstr += '<wps:ResponseForm>';
        wpsstr += '<wps:RawDataOutput mimeType="' + t.Outputformat + '">';
        wpsstr += '<ows:Identifier>result</ows:Identifier></wps:RawDataOutput>';
        wpsstr += '</wps:ResponseForm>';
        wpsstr += '</wps:Execute>';
        return wpsstr;
    }
    dev.WPS_Buffer = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        this.Target = $({ id: "wps" + new Date().getTime() });
        this.Url = dev.IsNull(opt.Url) ? "" : opt.Url;
        this.Version = dev.IsNull(opt.Version) ? "1.0.0" : opt.Version;
        this.Feature = dev.IsNull(opt.Feature) ? null : opt.Feature;
        this.Distance = dev.IsNumber(opt.Distance) ? opt.Distance : 0;//缓冲距离
        this.Outputformat = dev.IsNull(opt.Outputformat) ? "application/json" : opt.Outputformat;
        this.Async = dev.IsBoolean(opt.Async) ? opt.Async : true;
        this.Unit = dev.IsNull(opt.Unit) ? "m" : opt.Unit;//距离单位

        this.Buffer = function (param) {
            var $this = this;
            if (!dev.IsNull(param)) {
                if (!dev.IsNull(param.Url)) this.Url = param.Url;
                if (!dev.IsNull(param.Version)) this.Version = param.Version;
                if (!dev.IsNull(param.Feature)) this.Feature = param.Feature;
                if (!dev.IsNumber(param.Distance)) this.Distance = param.Distance;
                if (!dev.IsNull(param.Outputformat)) this.Outputformat = param.Outputformat;
                if (!dev.IsBoolean(param.Async)) this.Async = param.Async;
                if (!dev.IsNull(opt.Unit)) this.Unit = param.Unit;
            }
            if (dev.IsNull(this.Url) || dev.IsNull(this.Feature) || this.Feature.length == 0) {
                $this.Target.trigger("onBufferCompleted", { success: false, msg: '参数不全！' });
                return;
            }
            $.ajax({
                type: "POST",
                url: $this.Url,
                contentType: "application/xml",
                data: getbufferxml($this),
                async: $this.Async,
                success: function (o) {
                    var features = [];
                    if ($this.Outputformat == "application/json") {
                        if (dev.IsNull(o.coordinates)) return null;
                        for (var i = 0; i < o.coordinates.length; i++) {
                            var cgeom;
                            if (o.type == "Polygon") cgeom = new dev.geom.Polygon([o.coordinates[i]]);
                            features.push(new dev.Feature({ geometry: cgeom }));
                        }
                    }
                    if ($this.Outputformat == "text/xml; subtype=gml/2.1.2") {
                        var temppoints = o.lastChild.textContent.split(' ');
                        var points = [];
                        for (var i = 0; i < temppoints.length; i++) points.push([parseFloat(temppoints[i].split(',')[0]), parseFloat(temppoints[i].split(',')[1])]);
                        var type = o.lastChild.tagName.replace("gml:", "");
                        if (type == "Polygon") cgeom = new dev.geom.Polygon([points]);
                        features.push(new dev.Feature({ geometry: cgeom }));
                    }
                    $this.Target.trigger("onBufferCompleted", { success: true, data: features });
                },
                error: function (s) {
                    $this.Target.trigger("onBufferCompleted", { success: false, msg: '服务提交失败！' });
                }
            });
        }
    };
})(jQuery);
/*两个图形取差值*/
; (function ($) {
    function getdifferencexml(t) {
        var wpsstr = '<?xml version="1.0" encoding="UTF-8"?>';
        if (dev.IsNull(t)) return wpsstr;
        wpsstr += '<wps:Execute version="' + t.Version + '" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/1.1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">';
        wpsstr += '<ows:Identifier>geo:symDifference</ows:Identifier>';
        wpsstr += '<wps:DataInputs>';
        for (var i = 0; i < t.Features.length; i++) {
            wpsstr += '<wps:Input><ows:Identifier>' + (i == 0 ? "a" : "b") + '</ows:Identifier>';
            wpsstr += '<wps:Data>';
            wpsstr += ' <wps:ComplexData mimeType="text/xml; subtype=gml/3.1.1"><![CDATA[' + dev.GetWKTByFeature(t.Features[i], false) + ']]></wps:ComplexData>';
            wpsstr += '</wps:Data></wps:Input>';
        }
        wpsstr += '</wps:DataInputs>';
        if (dev.IsNull(t.Outputformat)) t.Outputformat = "application/wkt";
        wpsstr += '<wps:ResponseForm>';
        wpsstr += '<wps:RawDataOutput mimeType="' + t.Outputformat + '">';
        wpsstr += '<ows:Identifier>result</ows:Identifier>';
        wpsstr += '</wps:RawDataOutput>';
        wpsstr += '</wps:ResponseForm>';
        wpsstr += '</wps:Execute>';
        return wpsstr;
    }
    dev.WPS_Difference = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        this.Target = $({ id: "wps" + new Date().getTime() });
        this.Url = dev.IsNull(opt.Url) ? "" : opt.Url;
        this.Version = dev.IsNull(opt.Version) ? "1.0.0" : opt.Version;
        this.Features = dev.IsNull(opt.Features) ? null : opt.Features;
        this.Outputformat = dev.IsNull(opt.Outputformat) ? "application/wkt" : opt.Outputformat;
        this.Async = dev.IsBoolean(opt.Async) ? opt.Async : true;
        this.Difference = function (param) {
            var $this = this;
            if (!dev.IsNull(param)) {
                if (!dev.IsNull(param.Url)) this.Url = param.Url;
                if (!dev.IsNull(param.Version)) this.Version = param.Version;
                if (!dev.IsNull(param.Features)) this.Feature = param.Features;
                if (!dev.IsNull(param.Outputformat)) this.Outputformat = param.Outputformat;
                if (!dev.IsNull(param.Async)) this.Async = param.Async;
            }
            if (dev.IsNull(this.Url) || dev.IsNull(this.Features) || this.Features.length < 2) {
                $this.Target.trigger("onDifferenceCompleted", { success: false, msg: '参数不全！' });
                return;
            }
            $.ajax({
                type: "POST",
                url: $this.Url,
                contentType: "application/xml",
                data: getdifferencexml($this),
                async: $this.Async,
                success: function (o) {
                    var geompointarrs = [];
                    var geomtypes = [];
                    if ($this.Outputformat == "application/wkt") {
                        var geoms = o;
                        o = o.replace("GEOMETRYCOLLECTION", "").trim();
                        o = o.substring(1, o.length - 1);
                        var geomsstr = o.split('),');
                        for (var i = 0; i < geomsstr.length; i++) {
                            var str = geomsstr[i] + ")";
                            var currgeom = dev.ConvertGeomByWKT(str);
                            var type = currgeom.getType();
                            var geompoints = currgeom.getCoordinates();
                            geompointarrs.push(geompoints);
                            geomtypes.push(type);
                        }
                    }
                    $this.Target.trigger("onDifferenceCompleted", { success: true, data: { geoms: geompointarrs, geomtypes: geomtypes } });
                },
                error: function (s) {
                    $this.Target.trigger("onDifferenceCompleted", { success: false, msg: '服务提交失败！' });
                }
            });
        }
    }

})(jQuery);
/*图形编辑*/
; (function ($) {
    var dirty = {};

    function getWFSInsetXml(feature, $this) {
        var geomType = feature.getGeometry().getType();
        var geomstr = dev.GetWKTByFeature(feature, false);
        geomstr = geomstr.substring(geomstr.lastIndexOf('(') + 1, geomstr.indexOf(')'));
        geomstr = geomstr.replace(/,/g, ' ');
        var str = '<Transaction xmlns="http://www.opengis.net/wfs" service="WFS" version="1.1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd">';
        str += '<Insert>';
        str += '<' + $this.FormatGML.featureType + ' xmlns="' + $this.FormatGML.featureNS + '">';
        str += '<geometry>';
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

        str += '</geometry>';
        $.each(feature.getProperties(), function (o, i) {
            if (o != "geometry") str += '<' + o + '>' + (dev.IsNull(i) ? "" : i) + '</' + o + '>';
        });
        str += '</' + $this.FormatGML.featureType + '>';
        str += '</Insert>';
        str += '</Transaction>';
        return str;
    }

    function getWFSDeleteXml(feature, $this) {
        var featureid = feature.getId();
        var deleteStr = '<Transaction xmlns="http://www.opengis.net/wfs" service="WFS" version="1.1.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.1.0/wfs.xsd">';
        deleteStr += '<Delete typeName="feature:' + $this.FormatGML.featureType + '">';
        deleteStr += '<Filter xmlns="http://www.opengis.net/ogc"><FeatureId fid="' + featureid + '" /></Filter>';
        deleteStr += '</Delete></Transaction>';
        return deleteStr;
    }

    function getWFSUpdateXml(feature, $this) {

    }

    function transactWFS($this, f) {
        var payload;
        var node;
        if ($this.EditType == dev.EditType.Insert) payload = getWFSInsetXml(f, $this);
        if ($this.EditType == dev.EditType.Update) node = $this.FormatWFS.writeTransaction(null, [f], null, $this.FormatGML);//修改后期需要进行修改
        if ($this.EditType == dev.EditType.Delete) payload = getWFSDeleteXml(f, $this);
        $.ajax({
            type: "POST",
            url: $this.EditUrl,
            dataType: 'xml',
            processData: false,
            contentType: 'text/xml',
            data: payload,
            success: function (s, e) {
                $this.Target.triggerHandler("onInputDataCompleted", { success: true, Msg: '操作成功!' });
            },
            error: function (s, e) {
                this.Target.triggerHandler("onInputDataCompleted", { success: false, Msg: '操作成功!' });
            }
        })
    }

    dev.EditWFS = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        this.Map = dev.IsNull(opt.Map) ? dev.App.Map : opt.Map;
        this.FormatWFS = opt.FormatWFS;
        this.FormatGML = opt.FormatGML;
        this.XmlSeries = new XMLSerializer();
        this.Target = $({ id: "edit" + new Date().getTime() });
        this.EditType = dev.IsNull(opt.EditType) ? dev.EditType.Insert : opt.EditType;
        this.EditUrl = opt.EditUrl;
        this.DrawType = dev.IsNull(opt.DrawType) ? dev.DrawType.Polygon : opt.DrawType;
        this.WFSUrl = opt.WFSUrl;
        this.WMSUrl = opt.WMSUrl;
        this.TypeName = opt.TypeName;
        var templayer = dev.MapUtils.GetLayer("tempEditLayer", opt.Map);
        this.templayerSource = templayer.getSource();
        this.templayerSource.clear();
        this.Filter = opt.Filter;
        var $this = this;
        this.EditOperat = function (param) {
            if (!dev.IsNull(param)) {
                if (!dev.IsNull(param.Map)) this.Map = param.Map;
                if (!dev.IsNull(param.FormatWFS)) this.FormatWFS = param.FormatWFS;
                if (!dev.IsNull(param.FormatGML)) this.FormatGML = param.FormatGML;
                if (!dev.IsNull(param.EditType)) this.EditType = param.EditType;
                if (!dev.IsNull(param.DrawType)) this.DrawType = param.DrawType;
                if (!dev.IsNull(param.WFSUrl)) this.WFSUrl = param.WFSUrl;
                if (!dev.IsNull(param.WMSUrl)) this.WMSUrl = param.WMSUrl;
                if (!dev.IsNull(param.TypeName)) this.TypeName = param.TypeName;
                if (!dev.IsNull(param.Filter)) this.Filter = param.Filter;
            }
            if (dev.IsNull(this.TypeName) || dev.IsNull(this.WFSUrl)) {
                this.Target.triggerHandler("onEditCompleted", { success: false, Msg: '参数不全' });
                return;
            }
            if (this.EditType != dev.EditType.Insert) {
                this.querywfs = new dev.WFS_H({
                    Url: opt.WFSUrl,
                    TypeName: this.TypeName,
                    Async: false,
                    CqlFilter: this.Filter
                });
                this.querywfs.Target.bind("onQueryCompleted", function (e, o) {
                    for (var i = 0; i < o.data.length; i++) {
                        if (dev.IsNull(o.data[i].getId())) o.data[i].setId(Guid.NewGuid().ToString("N"));
                    }
                    $this.templayerSource.addFeatures(o.data);
                });
                this.querywfs.Query();
            }
            if (!dev.IsNull(this.Interaction)) this.Map.removeInteraction(this.Interaction);
            if (this.EditType == dev.EditType.Insert) {//新增操作
                if (dev.IsNull(this.DrawType)) this.DrawType = dev.DrawType.Polygon;
                this.Interaction = new dev.interaction.Draw({ type: this.DrawType, source: this.templayerSource });
                this.Interaction.on('drawend', function (e) {
                    $this.Target.triggerHandler("onEditCompleted", {
                        success: true,
                        Msg: '',
                        type: 'insert',
                        data: e.feature
                    });
                });
                this.Map.addInteraction(this.Interaction);
            }
            if (this.EditType == dev.EditType.Update) {//修改操作
                if (!dev.IsNull(this.InteractionSnap)) this.Map.removeInteraction(this.InteractionSnap);
                if (!dev.IsNull(this.InteractionSelect)) this.Map.removeInteraction(this.InteractionSelect);
                this.InteractionSnap = new dev.interaction.Snap({ source: this.templayerSource });
                this.InteractionSelect = new dev.interaction.Select({ style: new dev.style.Style({ stroke: new dev.style.Stroke({ color: 'yellow' }) }) });
                this.Interaction = new dev.interaction.Modify({ features: this.InteractionSelect.getFeatures() });
                this.Map.addInteraction(this.Interaction);
                this.Map.addInteraction(this.InteractionSnap);
                this.Map.addInteraction(this.InteractionSelect);
                this.InteractionSelect.getFeatures().on('add', function (e) {
                    e.element.on('change', function (e) {
                        dirty[e.target.getId()] = true;
                    });
                });
                this.InteractionSelect.getFeatures().on('remove', function (e) {
                    var f = e.element;
                    if (dirty[f.getId()]) {
                        delete dirty[f.getId()];
                        var featureProperties = f.getProperties();
                        delete featureProperties.boundedBy;
                        delete featureProperties.bbox;
                        var clone = new dev.Feature(featureProperties);
                        clone.setId(f.getId());
                        $this.Target.triggerHandler("onEditCompleted", {
                            success: true,
                            Msg: '',
                            type: 'update',
                            data: clone
                        });
                    }
                });
            }
            if (this.EditType == dev.EditType.Delete) {//删除操作
                this.Interaction = new dev.interaction.Select();
                this.Interaction.getFeatures().on('add', function (e) {
                    dev.MapUtils.RemoveFeature(e.target.item(0), "tempEditLayer");
                    $this.Target.triggerHandler("onEditCompleted", {
                        success: true,
                        Msg: '',
                        type: 'delete',
                        data: e.target.item(0)
                    });
                    $this.Interaction.getFeatures().clear();
                });
                this.Map.addInteraction(this.Interaction);
            }
        }
        this.InputDataBase = function (feature) {
            if (dev.IsNull(feature) || dev.IsNull(this.EditUrl)) {
                $this.Target.triggerHandler("onInputDataCompleted", { success: false, Msg: '入库参数不全!' });
                return;
            }
            transactWFS($this, feature);
        }
        this.Clear = function () {
            if (!dev.IsNull(this.Interaction)) {
                this.Map.removeInteraction(this.Interaction);
                this.Interaction = null;
            }
            if (!dev.IsNull(this.InteractionSnap)) {
                this.Map.removeInteraction(this.InteractionSnap);
                this.InteractionSnap = null;
            }
            if (!dev.IsNull(this.InteractionSelect)) {
                this.Map.removeInteraction(this.InteractionSelect);
                this.InteractionSelect = null;
            }
            if (!dev.IsNull(this.querywfs)) this.querywfs.Target.unbind("onQueryCompleted");
            this.templayerSource.clear();
            dev.MapUtils.ClearFeature("tempEditLayer");
        }
        this.IsActive = function () {
            if (this.EditType == dev.EditType.Insert && !dev.IsNull(this.Interaction)) return this.Interaction.getActive();
            return false;
        }
        this.SetActive = function (active) {
            if (this.EditType == dev.EditType.Insert && !dev.IsNull(this.Interaction)) this.Interaction.setActive(active);
        }
    };
})(jQuery);
/*全局查询*/
; (function ($) {
    var draw, dragBox;
    var drawfeature;
    var dataGrid, detailGrid;
    var searchlayers;
    var polyganKey;
    var blockdetailWin, farmerdetailWin;
    var querymapclick;
    var globallayer;
    var userorgid;
    var dialog;
    function Draw(shapetype, $this) {
        dev.MapUtils.ClearFeature("tempDrawLayer");
        dev.drawstate = true;
        dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "image/cursor_draw.cur),auto");
        $this.Drawing = true;
        if (!dev.IsNull(dragBox)) { dev.App.Map.removeInteraction(dragBox); dragBox = null; }
        if (dev.IsNull(draw)) {
            draw = new dev.Draw({ Map: dev.App.Map, Layer: dev.MapUtils.GetTempLayer("tempDrawLayer"), State: "Query" });
            draw.Target.unbind("onDrawCompleted");
            draw.Target.bind("onDrawCompleted", function (sender, o) {
                $this.Drawing = false;
                drawfeature = o;
                draw.Stop();//画画停止
                dev.drawstate = false;
                dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "image/hands.cur),auto");
            });
        }
        draw.Start(shapetype);
    }
    function Drag($this) {
        dev.MapUtils.ClearFeature("tempDrawLayer");
        dev.drawstate = true;
        dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "image/cursor_draw.cur),auto");
        if (!dev.IsNull(draw)) draw.Stop();
        $this.Drawing = true;
        if (!dev.IsNull(dragBox)) dev.App.Map.removeInteraction(dragBox);
        dragBox = new dev.interaction.DragBox({ className: "ZoomDragBox" });
        dev.App.Map.addInteraction(dragBox);
        dragBox.on('boxend', function (s, e) {
            var drag_feature = new dev.Feature(dragBox.getGeometry());
            dev.MapUtils.AddFeature(drag_feature, "tempDrawLayer", dev.App.Map, false);
            drawfeature = drag_feature;
            $this.Drawing = false;
            dev.App.Map.removeInteraction(dragBox);
            dragBox = null;
            dev.drawstate = false;
            dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "image/hands.cur),auto");
        });
    }

    function HighLight(feature) {
        hightlightlocation(feature.getProperties().massifid);
        if (!dev.IsNull(polyganKey)) {
            dev.MapUtils.removePointKey("queryhightlightf", dev.App.Map);
            polyganKey = null;
        }
        var c_f = feature.clone();
        c_f.setId("queryhightlightf");
        polyganKey = dev.MapUtils.LineSymbolStyle(c_f, null, null, false);
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
            tempfeature.setStyle(new dev.style.Style({
                image: new dev.style.Icon({ src: iconurl, anchor: [0.5, 1] }),
                text: new dev.style.Text({
                    text: (i + 1).toString(),
                    font: "15px serif",
                    fill: new dev.style.Fill({ color: [255, 255, 255, 1] }),
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
                col.push(' <span style="width: 24px; height: 36px; position: absolute; left: 3px; top: 6px; background-image: url(image/poi_red.png)">');
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
            var currfeature = new dev.Feature(e.Row.geom);
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
        var code = $(".selecttext", dev.App.MapPanel.MapDOM).attr("tag");
        var type = $(".selecttext", dev.App.MapPanel.MapDOM).attr("dtype");
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
                var accordiontitle = $('<div class="title"><span style="margin-left:10px;line-height:26px;color:#fcfcfc">' + layers[i].Text + '</span><a class="icon-arrow-down"></a></div>').appendTo(accordion);
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
        queryData(layers[0], $this);
    }

    function queryData(layer, $this) {
        var param = { pageIndex: $this.PageIndex, pageSize: $this.PageSize };
        if (!dev.IsNull(drawfeature)) {
            var new_feature = drawfeature.clone();
            var wkt;
            var mapproj = dev.App.Map.getView().getProjection();
            if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
                new_feature = dev.MapUtils.TransformFeatureCRS(drawfeature.clone(), mapproj.getCode(), dev.App.Config.SystemMap.DataEPSG);
            }
            wkt = dev.GetWKTByFeature(new_feature, false);
            if (new_feature.getGeometry().getType() == "Circle") {
                param.geom = wkt[0];
                param.radius = wkt[1];
            }
            else {
                param.geom = wkt;
            }
        }
        //   var searchkey = $this.TextControl.GetValue().trim();
        var searchkey = $this.searchkey;
        param.condition = "";
        if (!dev.IsNull(searchkey)) param.condition = "(\"NAME\" LIKE '%" + searchkey + "%' OR \"CARDID\" LIKE '%" + searchkey + "%' OR \"MOBILEPHONE\" LIKE '%" + searchkey + "%')";
        if (!dev.IsNull($this.orgFilter)) param.condition += (dev.IsNull(param.condition) ? "" : " AND ") + "\"ORGID\" IN (" + $this.orgFilter + ")";
        param.region = layer.code;
        $.ajax({
            url: dev.cookie.baseUri + "massif/getbypage",
            type: "POST",
            dataType: "json",
            data: param,
            success: function (result) {
                if (dev.IsNull(result.data)) result.data = { dataSource: [], pageInfo: { total: 0, pageNumber: 1 } };
                data = result.data;
                for (var i = 0; i < data.dataSource.length; i++) data.dataSource[i].geom = dev.ConvertGeomByWKT(data.dataSource[i].geom);
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
            url: dev.cookie.baseUri + "massif/detail/" + row.massifid + "?" + new Date().getTime(),
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
            globallayer = new dev.layer.Vector({
                id: "globalQueryLayer",
                opacity: 1.0,
                zIndex: 9999,
                type: "TempVector",
                visible: true,
                source: new dev.source.Vector({})
            });
            dev.App.Map.addLayer(globallayer);
        }
        else dev.MapUtils.ClearFeature("globalQueryLayer");
        if (dev.IsNull(datas) || datas.length == 0) {
            $this.resultPanel.css("display", "none");
            dialog.Alert("没有对应的查询数据!", "info");
            return;
        }
        $this.resultPanel.css("display", "block");
        var features = [];
        var locationfeatures = [];
        for (var i = 0; i < datas.length; i++) {
            var feature = new dev.Feature(datas[i].geom);
            feature.setStyle(new dev.style.Style({
                fill: new dev.style.Fill({ color: [230, 152, 0, 0.5] }),
                stroke: new dev.style.Stroke({ width: 2, color: [230, 152, 0, 1] })
            }));
            feature.setProperties(datas[i]);
            features.push(feature);
            //获取对应的中心点
            var extent = datas[i].geom.getExtent();
            var point = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
            var c_loctionf = new dev.Feature(new dev.geom.Point(point));
            c_loctionf.setProperties(datas[i]);
            c_loctionf.setId("locationf" + datas[i].massifid);
            c_loctionf.setStyle(new dev.style.Style({
                image: new dev.style.Icon({ src: dev.App.Root + "image/poi_red.png", anchor: [0.5, 1] }),
                text: new dev.style.Text({
                    text: (i + 1).toString(),
                    font: "15px serif",
                    fill: new dev.style.Fill({ color: [255, 255, 255, 1] }),
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
        var backrow = $('<div style="height:30px;width:100%;background-color:#fff;line-height:30px;color:#3385ff;cursor:pointer;border:1px solid #ddd;"><span style="margin-left:15px;"><&nbsp;返回</span></div>').appendTo(detaildiv);
        backrow.click(function () {
            $this.resultPanel.css("display", "block");
            $this.detailPanel.css("display", "none");
            $this.detailPanel.empty();
            detailGrid = null;
            dataGrid.DataGrid.datagrid("unselectAll");
            if (!dev.IsNull(polyganKey)) {
                dev.MapUtils.removePointKey("queryhightlightf", dev.App.Map)
                polyganKey = null;
            }
            hightlightlocation();
        });
        var detailcontent = $('<div style="width:319px;margin-top:10px;background-color:#fff;"></div>').appendTo(detaildiv);
        var detailtitle = $('<div style="height:30px;background-color:#0099cc;width:100%;color:#fff;line-height:30px;font-size:14px;"><span style="margin-left:5px;">基本信息</span></div>').appendTo(detailcontent);
        var framercontent = $('<div style="height:125px;width:317px;background-color:#fff;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom:1px solid #ddd;"></div>').appendTo(detailcontent);
        var framerleft = $('<div style="height:95px;width:95px;display:inline-block;float:left;"><div style="height:80px;width:80px;margin-top:15px;margin-left:15px;border-radius:40px;background-image:url(' + (dev.IsNull(detailinfo.farmerImages[0]) ? (dev.App.Root + "image/agri/nopic.png") : (detailinfo.farmerImages[0])) + ');background-repeat: no-repeat; background-position: center; background-size: 80px 80px;"></div></div>').appendTo(framercontent);
        var framerright = $('<div style="width:212px;height:70px;margin-top:10px;display:inline-block;margin-left:10px;"></div>').appendTo(framercontent);
        if (dev.cookie.user.posts[0].postowner == 1 && dev.cookie.user.posts[0].mainpost == 1) {
            var framername = $('<div style="height:30px;width:222px;"><div style="padding-left:5px; height:30px;line-height:30px;display:inline-block;color:#3385ff;text-decoration: underline;"><a tag="' + detailinfo.farmer.id + '">' + detailinfo.farmer.name + '</a></div></div>').appendTo(framerright);
        } else {
            var framername = $('<div style="height:30px;width:222px;"><div style="padding-left:5px; height:30px;line-height:30px;display:inline-block;color:#3385ff;text-decoration: underline;"><a tag="' + detailinfo.farmer.id + '">' + dev.simpleencryp(detailinfo.farmer.name, 1, 0) + '</a></div></div>').appendTo(framerright);
        }
        $('a', framername).click(function () {
            var tag = $(this).attr("tag");
            if (dev.IsNull(tag)) return;
            farmerdetailWin = new dev.Window({
                ID: "farmerWin",
                IconCls: "icon-detailinfo",
                Title: "农户详细信息",
                Parent: dev.App.FillPanel.Target,
                Maximizable: false,
                Modal: true,
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
        });
        if (dev.cookie.user.posts[0].postowner == 1 && dev.cookie.user.posts[0].mainpost == 1) {
            var framecardid = $('<div style="height:35px;width:222px;"><div style="width:55px;text-align:right;padding-right:5px;height:35px;line-height:35px;display:inline-block;">身份证号</div><div style="width;147px;height:35px;line-height:35px;padding-left:5px;display:inline-block;">' + detailinfo.farmer.cardid + '</div></div>').appendTo(framerright);
            var framephone = $('<div style="height:35px;width:222px;"><div style="width:55px;text-align:right;padding-right:5px;height:35px;line-height:35px;display:inline-block;">联系电话</div><div style="width:147px;height:35px;line-height:35px;padding-left:5px;display:inline-block;">' + detailinfo.farmer.mobilephone + '</div></div>').appendTo(framerright);
        } else {
            var framecardid = $('<div style="height:35px;width:222px;"><div style="width:55px;text-align:right;padding-right:5px;height:35px;line-height:35px;display:inline-block;">身份证号</div><div style="width;147px;height:35px;line-height:35px;padding-left:5px;display:inline-block;">' + dev.simpleencryp(detailinfo.farmer.cardid, 3, 3) + '</div></div>').appendTo(framerright);
            var framephone = $('<div style="height:35px;width:222px;"><div style="width:55px;text-align:right;padding-right:5px;height:35px;line-height:35px;display:inline-block;">联系电话</div><div style="width:147px;height:35px;line-height:35px;padding-left:5px;display:inline-block;">' + dev.simpleencryp(detailinfo.farmer.mobilephone, 3, 4) + '</div></div>').appendTo(framerright);
        }
        var blocktitle = $('<div style="height:27px;width:317px;line-height:27px;border-bottom:1px dashed #eee;border-left:1px solid #ddd;border-right:1px solid #ddd;padding-top:3px;"><div style="margin-left:3px;height:24px;width:24px;border-radius:12px;background-color:#0099cc;color:#fff;line-height:24px;text-align:center;display:inline-block;float:left;">地</div><div style="margin-left:10px;display:inline-block;height:24px;line-height:24px;color:#0099cc;">地块信息</div></div>').appendTo(detailcontent);
        var blockcontent = $('<div style="height:150px;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom:1px solid #ddd;width:317px;"></div>').appendTo(detailcontent);
        var tempdiv = $('<div style="height:120px;width:317px;"></div>').appendTo(blockcontent);
        var blockleft = $('<div style="height:120px;width:200px;display:inline-block;float:left;"></div>').appendTo(tempdiv);
        var blockid = $('<div style="height:30px;width:200px;"><div style="height:30px;width:55px;padding-right:5px;display:inline-block;float:left;text-align:right;line-height:30px;">地块编号</div><div style="height:30px;width:135px;padding-left:5px;display:inline-block;line-height:30px;color:#3385ff;text-decoration: underline;"><a>' + currrow.massifid + '</a></div></div>').appendTo(blockleft);
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
                    Parent: dev.App.FillPanel.Target,
                    Maximizable: false,
                    Modal: true,
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
            dev.PreViewPics(imgs);
        });
        var text = "";
        if (!dev.IsNull(currrow.province)) text += currrow.province;
        if (!dev.IsNull(currrow.city)) text += currrow.city;
        if (!dev.IsNull(currrow.county)) text += currrow.county;
        if (!dev.IsNull(currrow.town)) text += currrow.town;
        if (!dev.IsNull(currrow.village)) text += currrow.village;
        var blockaddress = $('<div style="height:30px;width:317px;"><div style="width:55px;padding-right:5px;display:inline-block;float:left;text-align:right;line-height:30px;height:30px;">详细地址</div><div style="height:30px;width:252px;padding-left:5px;display:inline-block;line-height:30px;">' + text + '</div></div>').appendTo(blockcontent);
        var croptitle = $('<div style="height:27px;width:317px;line-height:27px;border-bottom:1px dashed #eee;border-left:1px solid #ddd;border-right:1px solid #ddd;padding-top:3px;"><div style="margin-left:3px;height:24px;width:24px;border-radius:12px;background-color:#0099cc;color:#fff;line-height:24px;text-align:center;display:inline-block;float:left;">植</div><div style="margin-left:10px;display:inline-block;height:24px;line-height:24px;color:#0099cc;">历史种植</div></div>').appendTo(detailcontent);
        if (detailinfo.crops.length > 0) {
            var cropcontent = $('<div style="width:317px;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom:1px solid #ddd;"></div>').appendTo(detailcontent);
            var height = detailinfo.crops.length * 61;
            if (detailinfo.crops.length * 61 >= 180) height = 180;
            height += 3;
            cropcontent.css("height", height + "px");
            if (dev.IsNull(detailGrid)) InitDetailGrid($this, cropcontent);
            detailGrid.Resize(317, height);
            detailGrid.Load(detailinfo.crops);
            $(".detailcroppic", detailGrid.Target).click(function () {
                var tag = $(this).attr("tag");
                var cropdatas = detailGrid.DataGrid.datagrid("getData").rows;
                if (dev.IsNull(cropdatas) || cropdatas.length == 0) return;
                var c_row = Enumerable.From(cropdatas).Where('s=>s.id=="' + tag + '"').FirstOrDefault();
                if (dev.IsNull(c_row) || dev.IsNull(c_row.images) || c_row.images.length == 0) return;
                dev.PreViewPics(c_row.images);
            });
        }
    }

    dev.GlobalSearch = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        this.Parent = dev.IsNull(opt.Parent) ? dev.App.MapPanel.MapDOM : opt.Parent;
        this.DrawType = "Polygon";
        this.Drawing = false;
        this.Target = $('<div class="global"></div>');
        this.PageSize = dev.IsNumber(opt.PageSize) ? opt.PageSize : 10;
        this.PageIndex = dev.IsNumber(opt.PageIndex) ? opt.PageIndex : 1;
        this.SearchTool = $('<div class="globalquery"></div>').appendTo(this.Target);
        var searchdiv = $('<div class="searchcontent"></div>').appendTo(this.SearchTool);
        this.KeyDiv = $('<div class="inputTool"></div>').appendTo(searchdiv);
        this.drawbutton = $('<div class="graphicsdiv"></div>').appendTo(searchdiv);
        this.drawbutton.click(function () {
            if ($this.DrawType == "Box") {
                Drag($this);
            }
            else Draw($this.DrawType, $this);
        }).mouseover(function () { $this.arrowpopup.css("display", "block"); }).mouseleave(function () { $this.arrowpopup.css("display", "none"); });
        this.selectgraphic = $('<div class="icon icon-draw-polygon" tag="icon-draw-polygon"></div>').appendTo(this.drawbutton);
        this.arrowbtn = $('<div class="iconSelect"><div class="icon-combobox1" style="width: 5px; height: 3px; margin-top: 15px; margin-left: 2px;"></div></div>').appendTo(searchdiv);
        this.arrowbtn.click(function () { $this.arrowpopup.css("display", "block"); }).mouseleave(function () { $this.arrowpopup.css("display", "none"); });
        this.searchbtn = $('<div class="machine-query" style="height: 35px; width: 65px; background-color: #5e31f3; background-position: center; display: inline-block;"></div>').appendTo(this.SearchTool);
        this.searchbtn.click(function () {
            $this.Query();
        }).mouseover(function () { $(this).css("background-color", "#5227de"); }).mouseleave(function () { $(this).css("background-color", "#5e31f3"); });;
        this.arrowpopup = $('<div class="graphicpopup" style="z-index:11;"></div>').appendTo(this.Target);
        var drawrect = $('<div class="BPanel" tag="icon-draw-rect"><div class="Icon icon-draw-rect"></div></div>').appendTo(this.arrowpopup);
        this.arrowpopup.append('<div class="splitslider"></div>');
        var drawpolygon = $('<div class="BPanel" tag="icon-draw-polygon"><div class="Icon icon-draw-polygon"></div></div>').appendTo(this.arrowpopup);
        this.arrowpopup.append('<div class="splitslider"></div>');
        var drawcircle = $('<div class="BPanel" tag="icon-draw-circle"><div class="Icon icon-draw-circle"></div></div>').appendTo(this.arrowpopup);
        this.arrowpopup.append('<div class="splitslider"></div>');
        var drawclear = $('<div class="BPanel" tag="icon-draw-clear"><div class="Icon icon-maptool-clearmap1"></div></div>').appendTo(this.arrowpopup);
        this.arrowpopup.mouseover(function () {
            $this.arrowpopup.css("display", "block");
        }).mouseleave(function () {
            $this.arrowpopup.css("display", "none");
        });
        $(".BPanel", this.arrowpopup).click(function () {
            var tag = $(this).attr("tag");
            if (tag == "icon-draw-clear") {//清空
                drawfeature = null;
                dev.MapUtils.ClearFeature("tempDrawLayer");
                if (!dev.IsNull(draw)) { draw.Stop(); draw.Destroy(); draw = null; }
                if (!dev.IsNull(dragBox)) { dev.App.Map.removeInteraction(dragBox); dragBox = null; }
                dev.drawstate = false;
                dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "image/hands.cur),auto");
            }
            else {
                var searchtag = $this.selectgraphic.attr("tag");
                $this.selectgraphic.removeClass(searchtag).addClass(tag).attr("tag", tag);
                $this.arrowpopup.css("display", "none");
                if (tag == "icon-draw-rect") {
                    $this.DrawType = "Box";
                    Drag($this);
                }
                else {
                    //开始绘制图形
                    if (tag == "icon-draw-polygon") $this.DrawType = "Polygon";
                    if (tag == "icon-draw-circle") $this.DrawType = "Circle";
                    Draw($this.DrawType, $this);
                }
            }
        });
        //显示结果
        this.resultPanel = $('<div class="resultPanel" style="background-color:#fff;display:none;"></div>').appendTo(this.Target);
        this.detailPanel = $('<div class="detailPanel"></div>').appendTo(this.Target);
        var close = $('<div class="closebtn icon-tip-close"></div>').appendTo(this.resultPanel);
        close.click(function () {
            $this.Clear();
        });
        if (!dev.IsNull(this.Parent)) this.Parent.append(this.Target);
        var $this = this;
        dialog = new dev.Messager({ Height: 95, Width: 200, AutoShow: false, Type: "info", Timeout: 1500, ButtonVisible: false, AutoVisible: true, Effect: "normal" });
        FuncEx(this);
    }

    function FuncEx(control) {
        $.fn.extend(control, {
            Layout: function () {
                var $this = this;
                this.TextControl = new dev.TextBox({
                    Width: 282,
                    Height: 33,
                    TipInfo: "输入姓名、身份证号、电话号码",
                    Border: "0px",
                    Padding: "0 5px", ShowClearButton: true
                });
                this.KeyDiv.append(this.TextControl.Target);
                this.KeyDiv.bind("keydown", function (e) {
                    var key = e.which;
                    if (key == 13) $this.Query();
                });
                this.Content = $('<div></div>');
                this.Box = new dev.Box({ Width: 317, Height: 512, HasBorder: false });
                this.resultPanel.append(this.Box.Target);
                this.Box.Layout();
                this.Box.SetContent(this.Content);
                //获取登录用户orgid
                var userorgid = dev.cookie.user.orgid;
                this.orgFilter = "";
                $.ajax({
                    url: dev.GetSystemUrlByRelID("Service") + "organize/gettreebyid/" + userorgid + "?" + new Date().getTime(),
                    type: "Get",
                    contentType: 'application/json',
                    dataType: 'json',
                    success: function (result) {
                        if (result.statusCode == 200 && !dev.IsNull(result.data) && result.data.length > 0) {
                            for (var i = 0; i < result.data.length; i++) {
                                if (dev.IsNull($this.orgFilter)) $this.orgFilter = "'" + result.data[i].id + "',";
                                else $this.orgFilter += "'" + result.data[i].id + "',";
                            }
                            $this.orgFilter = $this.orgFilter.substr(0, $this.orgFilter.length - 1);
                        }
                    }
                });
                dev.App.MapPanel.Target.bind("onMapRefresh", function () {
                    if (!dev.IsNull(draw)) draw.SetLayer(dev.MapUtils.GetTempLayer("tempDrawLayer"));
                });
            },
            Query: function () {
                //获取满足条件的图层
                var $this = this;
                var searchkey = this.TextControl.GetValue().trim();
                if (dev.IsNull(searchkey) && dev.IsNull(drawfeature)) {
                    //输入查询条件
                    dialog.Alert("请输入关键字或者绘制查询范围!", "info");
                    $this.Clear();
                    return;
                }
                $this.searchkey = searchkey;
                getlayers();
                var selectxzqtext = $(".selecttext", dev.App.MapPanel.MapDOM).html();
                if (dev.IsNull(searchlayers) || searchlayers.length == 0) {
                    dialog.Alert(selectxzqtext + "没有对应的图层!", "info");
                    $this.Clear(); return;
                }
                this.PageIndex = 1;
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
                            var newfeature = new dev.Feature(rowdata.geom);
                            newfeature.setProperties(rowdata);
                            HighLight(newfeature);
                            queryDetail(rowdata, $this);
                        });
                    });
                }
                if (dev.IsNull(querylayers) || querylayers.length == 0) {
                    dialog.Alert(selectxzqtext + "没有对应地块信息!", "info");
                    return;
                }
                this.resultPanel.css("display", "none");
                this.detailPanel.css("display", "none");
                this.detailPanel.empty();
                this.Content.empty();
                getcontent(querylayers, this);
            },
            SetVisible: function (visible) {
                if (visible) this.Target.css("display", "block");
                else {
                    this.Clear();
                    this.Target.css("display", "none");
                }
            },
            Clear: function () {
                //清除
                dev.App.MapPanel.Target.unbind("onMapRefresh");
                this.resultPanel.css("display", "none");
                this.detailPanel.css("display", "none");
                if (!dev.IsNull(draw)) {
                    draw.Stop();
                    draw.Destroy();
                    draw = null;
                }
                drawfeature = null;
                dev.MapUtils.ClearFeature("tempDrawLayer");
                dev.MapUtils.ClearFeature("globalQueryLayer");
                dev.MapUtils.RemoveLayer("globalQueryLayer");
                globallayer = null;
                if (!dev.IsNull(polyganKey)) {
                    dev.MapUtils.removePointKey("queryhightlightf", dev.App.Map)
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
                ;
            }
        });
    }
})(jQuery);
//dataGrid
(function ($) {
    dev.UCDataGrid = function (param) {
        if (dev.IsNull(param)) param = {};
        this.Visible = dev.IsBoolean(param.Visible) ? opt.Visible : true;
        param.Target = $('<div style="width:' + param.Width + '; height:' + param.Height + ';"></div>');
        $.extend(this, new dev.Control(param));
        this.ID = param.ID;
        this.TextPrompt = dev.IsNull(param.TextPrompt) ? "" : param.TextPrompt;
        this.PageIndex = parseInt(param.PageIndex);
        this.PageSize = parseInt(param.PageSize);
        this.Columns = param.Columns;
        this.SimplePageMsg = dev.IsBoolean(param.SimplePageMsg) ? param.SimplePageMsg : false;
        this.RowNumbers = dev.IsNull(param.RowNumbers) ? true : param.RowNumbers;
        this.IsPage = dev.IsNull(param.IsPage) ? true : param.IsPage;
        this.ShowHeader = dev.IsNull(param.ShowHeader) ? true : param.ShowHeader;
        this.FitColumns = dev.IsNull(param.FitColumns) ? true : param.FitColumns;
        this.IsSizeSelect = dev.IsBoolean(param.IsSizeSelect) ? param.IsSizeSelect : true;
        this.PageList = dev.IsNull(param.PageList) ? [{ id: 0, text: 5 }, { id: 1, text: 10 }, { id: 2, text: 20 }, { id: 3, text: 30 }, { id: 4, text: 40 }, { id: 5, text: 50 }] : param.PageList;
        this.PageListValue = dev.IsNull(param.PageListValue) ? "id" : param.PageListValue;
        this.PageListText = dev.IsNull(param.PageListText) ? "text" : param.PageListText;
        this.View = param.View;
        var options = $('<div id="buttons"></div>');
        var table = $('<table style="border-spacing:0"></table>').appendTo(options);
        var tr = $('<tr></tr>').appendTo(table);
        this.buttons = param.buttons;
        if (!dev.IsNull(this.buttons) && this.buttons.length > 0) {
            for (var i = 0; i < this.buttons.length; i++) {
                var td = $('<td style="padding-right:5px;"></td>').appendTo(tr);
                var currbtn = $('<div style="width:16px;height:16px;" class="' + this.buttons[i].iconCls + '"></div>');
                currbtn.click(this.buttons[i].handler);
                td.append(currbtn);
            }
        }
        this.DataGrid = $('<table id="' + this.ID + '" class="easyui-datagrid" style="width: 100%; height: 100%;"></table>');
        this.Target.append(this.DataGrid);
        this.pagequery = dev.IsBoolean(param.pagequery) ? param.pagequery : (param.pagequery != "false");
        if (this.IsSizeSelect) {
            tr.append($('<td><span style="margin-left:5px;">每页</span><input id="selectpagesize" class="easyui-combobox" style="width:60px;" /><span style="margin-left:5px;">条记录</span></td>'));
        }
        if (this.pagequery) tr.append($('<td><input id="searchFilter" class="easyui-searchbox" style="width:200px;"></td>'));
        tr.append($('<td><span id="lblMsg" style="height: 30px;color:red;"></span></td>'));
        this.buttons = options;
        FuncEx(this);
    };
    function FuncEx(control) {
        $.fn.extend(control, {
            Layout: function (columns) {
                var $this = this;
                this.DataGrid.datagrid({
                    border: 0,
                    singleSelect: true,
                    fitColumns: this.FitColumns,
                    animate: true,
                    loadMsg: "请等待...",
                    collapsible: true,
                    checkOnSelect: false,
                    selectOnCheck: false,
                    rownumbers: this.RowNumbers,
                    showHeader: this.ShowHeader,
                    pagination: this.IsPage,
                    columns: [(!dev.IsNull(columns) ? columns : this.Columns)],
                    onClickRow: function (index, row) {
                        $this.Target.triggerHandler("onClickRow", { index: index, Row: row });
                    },
                    onClickCell: function (index, field, value) {
                        $this.Target.triggerHandler("onClickCell", { index: index, field: field, value: value });
                    },
                    onDblClickCell: function (index, field, value) {
                        $this.Target.triggerHandler("onDblClickCell", { index: index, field: field, value: value });
                    },
                    onDblClickRow: function (index, row) {
                        $this.Target.triggerHandler("onDblClickRow", { index: index, Row: row });
                    },
                    view: this.View
                });
                if (this.IsPage) {
                    this.Pager = this.DataGrid.datagrid('getPager');
                    var parampage = {
                        showPageList: false,
                        showRefresh: false,
                        pageNumber: this.PageIndex,
                        pageSize: this.PageSize,
                        onSelectPage: function (index, size) {
                            if (index == 0) index++;
                            $this.Target.triggerHandler("onSelectPage", { index: index, size: size });
                        },
                        buttons: this.buttons
                    }
                    this.Pager.pagination(parampage);
                }
                var searchButton = this.buttons.find("input#searchFilter");
                searchButton.searchbox({
                    prompt: this.TextPrompt,
                    value: "",
                    searcher: function (value, name) {
                        $this.Target.triggerHandler("onSearchClick", { value: value, name: name });
                    }
                });
                if (this.IsSizeSelect) {
                    var selectsize = this.buttons.find("input#selectpagesize");
                    selectsize.combobox({
                        data: this.PageList,
                        valueField: this.PageListValue,
                        textField: this.PageListText,
                        value: 0,
                        panelHeight: "auto",
                        onSelect: function (s) {
                            var pagesize = s.text;
                            $this.Target.triggerHandler("onPageSizeChange", pagesize);
                        }
                    });
                }
            },
            Load: function (data, pageInfo) {
                var $this = this;
                this.DataGrid.datagrid('loadData', data);
                if (this.IsPage)
                    this.Pager.pagination('refresh', {
                        total: pageInfo.totalCount,
                        pageSize: pageInfo.pageSize,
                        pageNumber: pageInfo.pageIndex,
                        displayMsg: ($this.SimplePageMsg) ? "共{total}条记录" : "当前页显示第" + (((pageInfo.pageIndex - 1) * pageInfo.pageSize) + 1) + "-" + (pageInfo.pageIndex * pageInfo.pageSize) + "条记录,共{total}条数据"
                    });
            },
            ShowMessage: function (msg) {
                var lblMsg = this.buttons.find("span#lblMsg");
                lblMsg.text(msg);
            },
            Resize: function (width, height) {
                this.Target.css({ width: width, height: height });
                this.DataGrid.datagrid("resize");
            },
            ClearSearchFilter: function () {
                var searchButton = this.buttons.find("input#searchFilter");
                searchButton.searchbox("clear");
            }
        });
    }
})(jQuery);
/*公共方法*/
(function ($) {
    dev.TreeLayerType = { Tipoc: "topic", Vector: "vector", Analysis: "analysis", XZQ: "xzq", Potree: "potree", ThreeD: "threemodel" };
    dev.DeviceType = { machine: "农机", uav: "无人机" };//设备类型
    dev.ComparisonOps = {
        PropertyIsEqualTo: "=", PropertyIsNotEqualTo: "<>", PropertyIsLessThan: "<", PropertyIsGreaterThan: ">",
        PropertyIsLessThanOrEqualTo: "<=", PropertyIsGreaterThanOrEqualTo: ">=", PropertyIsLike: " LIKE ",
        PropertyIsNull: " IS ", PropertyWithIN: " IN "
    };
    /*初始化图例*/
    dev.InitLegend = function (opt) {
        if (dev.IsNull(opt)) opt = { Bottom: 100 };
        opt.Visible = false;
        if (dev.IsNull(dev.Legend)) dev.Legend = new dev.UCLegend(opt);
        else dev.Legend.SetData(opt.Data);
    };
    dev.GetSLDString = function (typeName, strrule, IsFeatureStyle) {
        if (dev.IsNull(typeName) || dev.IsNull(strrule)) return "";
        var strsld = dev.MapUtils.LoadSLD(dev.App.Root + "config/templet.sld");
        strsld = strsld.replace("%LayerName%", typeName);
        if (IsFeatureStyle == true) strsld = strsld.replace("%FeatureTypeStyle%", strrule);
        else strsld = strsld.replace("%FeatureTypeStyle%", "<FeatureTypeStyle>" + strrule + "</FeatureTypeStyle>");
        return strsld;
    };
    dev.LegendToRule = function (legends, type) {
        var strRules = "";
        $.each($(legends), function (i, o) {
            strRules += "<Rule>";
            if (!dev.IsNull(o.Text)) strRules += "<Name>" + o.Text + "</Name>";
            if (!dev.IsNull(o.Filter)) strRules += dev.Filter(o.Filter, "", "", true);
            if (!dev.IsNull(o.TextSymbol)) {
                strRules += "<TextSymbolizer>";
                if (!dev.IsNull(o.TextSymbol.LabelField)) strRules += "<Label><ogc:PropertyName>" + o.TextSymbol.LabelField + "</ogc:PropertyName></Label>";
                strRules += "<Font><CssParameter name=\"font-family\">微软雅黑</CssParameter>";
                if (!dev.IsNull(o.TextSymbol.FontSize)) strRules += " <CssParameter name=\"font-size\">" + o.TextSymbol.FontSize + "</CssParameter>";
                strRules += "<CssParameter name=\"font-style\">normal</CssParameter>";
                strRules += "</Font>";
                strRules += "<LabelPlacement><PointPlacement><AnchorPoint><AnchorPointX>0.5</AnchorPointX><AnchorPointY>0.5</AnchorPointY></AnchorPoint></PointPlacement></LabelPlacement>";
                if (!dev.IsNull(o.TextSymbol.Fill)) strRules += "<Fill><CssParameter name=\"fill\">" + o.TextSymbol.Fill + "</CssParameter></Fill>";
                strRules += " <VendorOption name=\"followLine\">true</VendorOption>";
                strRules += "</TextSymbolizer>";
            }
            if (dev.IsNull(type)) {
                strRules += "<PolygonSymbolizer>";
                if (!dev.IsNull(o.Fill)) {
                    strRules += "<Fill><CssParameter name=\"fill\">" + o.Fill.Color + "</CssParameter>";
                    strRules += "<CssParameter name=\"fill-opacity\">" + (dev.IsNull(o.Fill.Opacity) ? 1 : o.Fill.Opacity) + "</CssParameter>";
                    strRules += "</Fill>";
                }
                if (!dev.IsNull(o.Border)) {
                    strRules += "<Stroke><CssParameter name=\"stroke\">" + o.Border.Color + "</CssParameter>";
                    strRules += "<CssParameter name=\"stroke-opacity\">" + (dev.IsNull(o.Border.Opacity) ? 1 : o.Border.Opacity) + "</CssParameter>";
                    strRules += "<CssParameter name=\"stroke-width\">" + (dev.IsNull(o.Border.Width) ? 1 : o.Border.Width) + "</CssParameter>";
                    strRules += "</Stroke>";
                }
                strRules += "</PolygonSymbolizer>";
            }
            else {
                if (type == "point") {
                    strRules += "<PointSymbolizer>";
                    strRules += "<Graphic>";
                    strRules += "<Mark>";
                    strRules += "<WellKnownName>square</WellKnownName>";
                    if (!dev.IsNull(o.Fill)) {
                        strRules += "<Fill><CssParameter name=\"fill\">" + o.Fill.Color + "</CssParameter>";
                        strRules += "<CssParameter name=\"fill-opacity\">" + (dev.IsNull(o.Fill.Opacity) ? 1 : o.Fill.Opacity) + "</CssParameter>";
                        strRules += "</Fill>";
                    }
                    if (!dev.IsNull(o.Border)) {
                        strRules += "<Stroke><CssParameter name=\"stroke\">" + o.Border.Color + "</CssParameter>";
                        strRules += "<CssParameter name=\"stroke-opacity\">" + (dev.IsNull(o.Border.Opacity) ? 1 : o.Border.Opacity) + "</CssParameter>";
                        strRules += "<CssParameter name=\"stroke-width\">" + (dev.IsNull(o.Border.Width) ? 1 : o.Border.Width) + "</CssParameter>";
                        strRules += "</Stroke>";
                    }
                    strRules += " </Mark>";
                    strRules += "<Size>6</Size>";
                    strRules += "</Graphic>";
                    strRules += "</PointSymbolizer>";
                }
                if (type == "line") {
                    strRules += " <LineSymbolizer>";
                    if (!dev.IsNull(o.Border)) {
                        strRules += "<Stroke><CssParameter name=\"stroke\">" + o.Border.Color + "</CssParameter>";
                        strRules += "<CssParameter name=\"stroke-opacity\">" + (dev.IsNull(o.Border.Opacity) ? 1 : o.Border.Opacity) + "</CssParameter>";
                        strRules += "<CssParameter name=\"stroke-width\">" + (dev.IsNull(o.Border.Width) ? 1 : o.Border.Width) + "</CssParameter>";
                        strRules += "</Stroke>";
                    }
                    strRules += " </LineSymbolizer>";
                }
            }
            strRules += "</Rule>";
        });
        return strRules;
    };
    dev.Filter = function (strWhere, spatialParam, version, isPR) {
        var strfilter = "";
        var prefix = isPR ? "ogc:" : "";
        var condition = '<' + prefix + 'Filter xmlns:ogc="http://www.opengis.net/ogc">';
        if (!dev.IsNull(spatialParam) && !dev.IsNull(spatialParam.bbox)) {
            if (!dev.IsNull(strWhere)) condition += '<ogc:And>';
            condition += dev.BBOX(spatialParam.bbox, spatialParam.geometryName, version);
        }
        if (!dev.IsNull(spatialParam) && !dev.IsNull(spatialParam.geometry)) {
            if (!dev.IsNull(strWhere)) condition += '<ogc:And>';
            condition += dev.Geometry(spatialParam, version);
        }
        if (!dev.IsNull(strWhere)) {
            strWhere = strWhere.replace(/1=1\s*AND|1=1\s*and|1=1\s*OR|1=1\s*or|1=1\s*/, "");
            var arrCondition = strWhere.split(/\) AND \(|\) AND|AND \(|\)AND\(|\)AND|AND\(/);
            var orCondition = [];
            if (!dev.IsNull(strWhere)) {
                if (arrCondition.length == 1)
                    condition += FilterORQuote(arrCondition[0]);
                else if (arrCondition.length > 1) {
                    var andstr = '<ogc:And>';
                    $.each($(arrCondition), function (i, o) {
                        if (o) andstr += FilterORQuote(o);
                    });
                    andstr += "</ogc:And>";
                    condition += andstr;
                }
            }
        }
        strfilter += condition;
        if (((!dev.IsNull(spatialParam) && !dev.IsNull(spatialParam.bbox)) || (!dev.IsNull(spatialParam) && !dev.IsNull(spatialParam.geometry))) && !dev.IsNull(strWhere))
            strfilter += '</ogc:And>';
        strfilter += '</' + prefix + 'Filter>';
        return strfilter;
    };

    function FilterORQuote(con) {
        var arrCon = con.split(/\) OR \(|\) OR|OR \(|\)OR\(|\)OR|OR\(/);
        var orstr = "";
        if (arrCon.length > 1) {
            var orstr = '<ogc:Or>';
            $.each($(arrCon), function (j, item) {
                orstr += FilterAND(item);
            });
            orstr += '</ogc:Or>';
        }
        else orstr += FilterAND(con);
        return orstr;
    };

    function FilterAND(con) {
        var arrCon = con.split(/ AND /);
        var condition = "", andstr = "";
        if (arrCon.length == 1)
            andstr += FilterOR(arrCon[0]);
        else if (arrCon.length > 1) {
            var andstr = '<ogc:And>';
            $.each($(arrCon), function (i, o) {
                if (o) andstr += FilterOR(o);
            });
            andstr += "</ogc:And>";
        }
        condition = andstr;
        return condition;
    };

    function FilterOR(con) {
        var arrCon = con.split(/ OR /);
        var orstr = "";
        if (arrCon.length > 1) {
            var orstr = '<ogc:Or>'
            $.each($(arrCon), function (j, item) {
                orstr += propertyFilter(item);
            });
            orstr += '</ogc:Or>'
        }
        else orstr += propertyFilter(con);
        return orstr;
    };

    function propertyFilter(arr) {
        var strFilter = "";
        if (!arr) return strFilter;
        arr = arr.replace(/\(/g, "");
        arr = arr.replace(/\)/g, "");
        var arr1 = arr.trim().split(/=|>|<|>=|<=|<>| in | IN | IS | is | LIKE | like /);
        arr1[0] = arr1[0].trim();
        arr1[arr1.length - 1] = arr1[arr1.length - 1].replace(/\'/g, "").trim();
        if (arr1[0] === "1") return "";
        if (arr.toUpperCase().indexOf(dev.ComparisonOps.PropertyIsNotEqualTo) >= 0)
            strFilter = '<ogc:PropertyIsNotEqualTo><ogc:PropertyName>' + arr1[0] + '</ogc:PropertyName><ogc:Literal>' + arr1[arr1.length - 1] + '</ogc:Literal></ogc:PropertyIsNotEqualTo>';
        else if (arr.toUpperCase().indexOf(dev.ComparisonOps.PropertyIsLessThanOrEqualTo) >= 0)
            strFilter = '<ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>' + arr1[0] + '</ogc:PropertyName><ogc:Literal>' + arr1[arr1.length - 1] + '</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo>';
        else if (arr.toUpperCase().indexOf(dev.ComparisonOps.PropertyIsGreaterThanOrEqualTo) >= 0)
            strFilter = '<ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>' + arr1[0] + '</ogc:PropertyName><ogc:Literal>' + arr1[arr1.length - 1] + '</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo>';
        else if (arr.toUpperCase().indexOf(dev.ComparisonOps.PropertyIsLessThan) >= 0)
            strFilter = '<ogc:PropertyIsLessThan><ogc:PropertyName>' + arr1[0] + '</ogc:PropertyName><ogc:Literal>' + arr1[arr1.length - 1] + '</ogc:Literal></ogc:PropertyIsLessThan>';
        else if (arr.toUpperCase().indexOf(dev.ComparisonOps.PropertyIsGreaterThan) >= 0)
            strFilter = '<ogc:PropertyIsGreaterThan><ogc:PropertyName>' + arr1[0] + '</ogc:PropertyName><ogc:Literal>' + arr1[arr1.length - 1] + '</ogc:Literal></ogc:PropertyIsGreaterThan>';
        else if (arr.toUpperCase().indexOf(dev.ComparisonOps.PropertyIsEqualTo) >= 0) {
            if (arr1[arr1.length] === "") strFilter = '<ogc:PropertyIsNull><ogc:PropertyName>' + arr1[0] + '</ogc:PropertyName></ogc:PropertyIsNull>';
            else strFilter = '<ogc:PropertyIsEqualTo><ogc:PropertyName>' + arr1[0] + '</ogc:PropertyName><ogc:Literal>' + arr1[arr1.length - 1] + '</ogc:Literal></ogc:PropertyIsEqualTo>';
        }
        else if (arr.toUpperCase().indexOf(dev.ComparisonOps.PropertyIsLike) >= 0)
            strFilter = '<ogc:PropertyIsLike wildCard="*" singleChar="_" escapeChar="!"><ogc:PropertyName>' + arr1[0] + '</ogc:PropertyName><ogc:Literal>' + arr1[arr1.length - 1].replace(/\%/g, "*") + '</ogc:Literal></ogc:PropertyIsLike>';
        else if (arr.toUpperCase().indexOf(dev.ComparisonOps.PropertyIsNull) >= 0)
            strFilter = '<ogc:PropertyIsNull><ogc:PropertyName>' + arr1[0] + '</ogc:PropertyName></ogc:PropertyIsNull>';
        else if (arr.toUpperCase().indexOf(dev.ComparisonOps.PropertyWithIN) >= 0)
            strFilter = PropertyWithINFilter(arr1);
        return strFilter.trim();
    };

    function PropertyWithINFilter(condition) {
        var values = condition[condition.length - 1].trim();
        values = values.replace(/\(/g, "");
        values = values.replace(/\)/g, "");
        values = values.split(',');
        var orstr = '<ogc:Or>';
        $.each(values, function (i, o) {
            if (o) orstr += '<ogc:PropertyIsEqualTo><ogc:PropertyName>' + condition[0].trim() + '</ogc:PropertyName><ogc:Literal>' + o.replace(/\'/g, "").trim() + '</ogc:Literal></ogc:PropertyIsEqualTo>';
        });
        orstr += '</ogc:Or>';
        return orstr;
    };

    dev.GetFeatureGML = function (opt) {
        var strfilter = "";
        var c = opt.featureNS.substring(opt.featureNS.lastIndexOf('/') + 1);
        if (opt.version === "1.0.0" || opt.version === "1.1.0")//1.1.0支持分页
            strfilter = '<wfs:GetFeature service="WFS" version="' + opt.version + '" outputFormat="json" xmlns:' + c + '="' + opt.featureNS + '"'
                + ' xmlns:wfs="http://www.opengis.net/wfs" xmlns:ogc="http://www.opengis.net/ogc"'
                + ' xmlns:gml="http://www.opengis.net/gml" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
                + ' xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/' + opt.version + '/WFS-basic.xsd"';
        else if (opt.version === "2.0.0")//最新的GML3.2.1,有部分功能不太稳定建议使用1.1.0
            strfilter = '<wfs:GetFeature service="WFS" version="2.0.0" outputFormat="json" xmlns:wfs="http://www.opengis.net/wfs/2.0"'
                + ' xmlns:fes="http://www.opengis.net/fes/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:ogc="http://www.opengis.net/ogc"'
                + ' xmlns:sf="http://www.openplans.org/spearfish" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"'
                + 'xsi:schemaLocation="http://www.opengis.net/wfs/2.0 http://schemas.opengis.net/wfs/2.0/wfs.xsd http://www.opengis.net/gml/3.2 http://schemas.opengis.net/gml/3.2.1/gml.xsd"';
        strfilter += (dev.IsNumber(opt.pageIndex) && dev.IsNumber(opt.pageSize) ? ' startIndex="' + (opt.pageIndex - 1) * opt.pageSize + '" count="' + opt.pageSize + '" ' : "")
            + (dev.IsNull(opt.maxFeatures) ? "" : ' maxFeatures="' + opt.maxFeatures + '" ') + '><wfs:Query typeName="' + opt.layername + '">' + opt.Filter + '</wfs:Query></wfs:GetFeature>';
        return strfilter;
    };
    dev.FilterGML = function (opt) {
        opt.Filter = dev.Filter(opt.condition, opt.spatialParam, opt.version, true);
        var strGML = dev.GetFeatureGML(opt);
        return strGML;
    };
    //四至范围
    dev.BBOX = function (bbox, field, version) {
        if (dev.IsNull(bbox) || dev.IsNull(field)) return "";
        var strbbox = "";
        if (dev.IsNull(version)) version = "1.0.0";
        if (version === "1.0.0")
            strbbox = '<ogc:BBOX><ogc:PropertyName>' + field + '</ogc:PropertyName>'
                + '<gml:Box srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">'
                + '<gml:coordinates decimal="." cs="," ts=" ">' + bbox[0] + ',' + bbox[1] + ' ' + bbox[2] + ',' + bbox[3] + '</gml:coordinates>'
                + '</gml:Box></ogc:BBOX>'
        else if (version === "1.1.0")
            strbbox = '<ogc:BBOX><ogc:PropertyName>' + field + '</ogc:PropertyName>'
                + '<gml:Envelope srsName="http://www.opengis.net/gml/srs/epsg.xml#4326">'
                + '<gml:lowerCorner>' + bbox[0] + ' ' + bbox[1] + '</gml:lowerCorner>'
                + '<gml:upperCorner>' + bbox[2] + ' ' + bbox[3] + '</gml:upperCorner>'
                + '</gml:Envelope></ogc:BBOX>';
        return strbbox;
    };
    //图形
    dev.Geometry = function (param, version) {
        var strgeometry = '<ogc:PropertyName>' + param.geometryName + '</ogc:PropertyName>';
        var type = param.geometry.getType().toLowerCase();
        if (type === "point" || type === "circle") {//点
            var point;
            if (type === "circle") {
                point = param.geometry.getCenter().toString();
                param.distance = param.geometry.getRadius();
                param.relation = dev.Relations.DWITHIN;
            }
            else point = param.geometry.getCoordinates().toString();
            strgeometry += '<gml:Point srsName="http://www.opengis.net/gml/srs/epsg.xml#4326" xmlns:gml="http://www.opengis.net/gml">';
            if (version === "1.1.0")
                strgeometry += '<gml:pos>' + point.replace(/,/g, " ") + '</gml:pos>';
            else if (version === "1.0.0")
                strgeometry += '<gml:coordinates decimal="." cs="," ts=" ">' + point.toString() + '</gml:coordinates>';
            strgeometry += '</gml:Point>';
        }
        else if (type === "polygon") {
            strgeometry += '<gml:Polygon srsName="http://www.opengis.net/gml/srs/epsg.xml#4326" xmlns:gml="http://www.opengis.net/gml">';
            var linearRings = param.geometry.getLinearRings();
            $.each(linearRings, function (i, o) {
                if (version === "1.1.0") {
                    var linearRing = '<gml:LinearRing><gml:posList>' + o.getCoordinates().toString().replace(/,/g, " ") + '</gml:posList></gml:LinearRing>';
                    if (i === 0) strgeometry += '<gml:exterior>' + linearRing + '</gml:exterior>';
                    else strgeometry += linearRing;
                }
                else if (version === "1.0.0") {
                    var linearRing = '<gml:LinearRing><gml:coordinates decimal="." cs="," ts=" ">' + o.getCoordinates().toString().replace(/,/g, " ") + '</gml:coordinates></gml:LinearRing>';
                    if (i === 0) strgeometry += '<gml:outerBoundaryIs>' + linearRing + '</gml:outerBoundaryIs>';
                    else strgeometry += '<gml:innerBoundaryIs>' + linearRing + '</gml:innerBoundaryIs>';
                }
            });
            strgeometry += '</gml:Polygon>';
        }
        else if (type === "linestring") {
            strgeometry += '<gml:LineString srsName="http://www.opengis.net/gml/srs/epsg.xml#4326" xmlns:gml="http://www.opengis.net/gml">'
            if (version === "1.1.0")
                strgeometry += '<gml:posList>' + param.geometry.getCoordinates().toString().replace(/,/g, " ") + '</gml:posList>';
            else if (version === "1.0.0")
                strgeometry += '<gml:coordinates decimal="." cs="," ts=" ">' + param.geometry.getCoordinates().toString() + '</gml:coordinates>';
            strgeometry += '</gml:LineString>';
            param.distance = 0.0006;
            param.relation = dev.Relations.DWITHIN;
        }
        var isbuffer = param.relation.toLowerCase() != dev.Relations.DWITHIN.toLowerCase() || dev.IsNull(param.distance) || param.distance <= 0;
        strgeometry = '<ogc:' + param.relation + '>' + strgeometry
            + (isbuffer ? "" : '<ogc:Distance units="' + (dev.IsNull(param.unit) ? "degrees" : param.unit) + '">' + param.distance + '</ogc:Distance>')
            + '</ogc:' + param.relation + '>';
        return strgeometry;
    };

    //根据类型获取图层树
    dev.GetTreeLayers = function (type, iscontainlayer, layersconfig) {
        var layertree = [];
        if (dev.IsNull(layersconfig)) layersconfig = dev.App.Config.Extend.LayerForTree.LayerRoot;
        if (!dev.IsBoolean(iscontainlayer)) iscontainlayer = true;
        if (dev.IsNull(layersconfig.length)) layertree = [dev.ObjClone(layersconfig)];
        else layertree = layersconfig.clone();
        layertree = Enumerable.From(layertree).Where('s=>s.Type.indexOf("' + type + '")>=0').ToArray();
        getnodebytype(layertree, type, iscontainlayer);
        return layertree;
    }
    function getnodebytype(nodes, type, iscontainlayer) {
        if (dev.IsNull(nodes) || dev.IsNull(type)) return;
        for (var i = 0; i < nodes.length; i++) {
            if (dev.IsNull(nodes[i].Child)) continue;
            if (dev.IsNull(nodes[i].Child.length)) nodes[i].Child = [nodes[i].Child];
            if (iscontainlayer) {
                nodes[i].Child = Enumerable.From(nodes[i].Child).Where('s=>s.Type!=undefined && s.Type!=null && s.Type.indexOf("' + type + '")>=0').ToArray();
            }
            else {
                nodes[i].Child = Enumerable.From(nodes[i].Child).Where('s=>s.Type!=undefined && s.Type!=null && s.Type.indexOf("' + type + '")>=0 && s.IsLayer!="true"').ToArray();
            }
            if (!dev.IsNull(nodes[i].Child) && nodes[i].Child.length > 0) getnodebytype(nodes[i].Child, type, iscontainlayer);
        }
    }

    //将树数据转换成为对应的树结构
    dev.ConvertTreeData = function (data, id) {//id最顶层组织ID
        if (dev.IsNull(data) || data.length == 0) return [];
        var rootdata = Enumerable.From(data).Where('s=>s.id=="' + id + '"').FirstOrDefault();
        if (dev.IsNull(rootdata)) return rootdata
        rootdata.child = dev.ConvertRootTreeData(data, id);
        rootdata.state = "open";
        return [rootdata];
    }
    dev.ConvertRootTreeData = function (data, id) {
        if (dev.IsNull(data) || data.length == 0) return [];
        var rootData = Enumerable.From(data).Where('s=>s.parentid=="' + id + '"').ToArray();
        if (dev.IsNull(rootData) || rootData.length == 0) return rootData;
        for (var i = 0; i < rootData.length; i++) {
            rootData[i].child = dev.ConvertRootTreeData(data, rootData[i].id);
            if (rootData[i].child.length > 0) rootData[i].state = "open";
        }
        return rootData;
    }
    //获取数据字典数据
    dev.GetDicData = function (types) {
        var datas;
        var serviceUrl = dev.GetSystemUrlByRelID("Service");
        if (dev.IsNull(types)) return null;
        $.ajax({
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify(types),
            url: serviceUrl + "dictionary/getdictionarybytypes",
            async: false,
            success: function (json) {
                if (json.statusCode === 200)
                    datas = json.data;
            }
        });
        return datas;
    }
    /*初始化formatGML*/
    dev.InitFormatGML = function (opt) {
        var gml = new dev.format.GML({
            featureNS: opt.featureNS,
            featureType: opt.featureType,
            srsName: dev.IsNull(opt.srsName) ? "EPSG:4326" : opt.srsName
        });
        return gml;
    }
    //初始化编辑图层xml
    dev.getWFSInsetXml = function (feature, opt) {
        if (dev.IsNull(feature) || dev.IsNull(opt)) return null;
        var formatgml = dev.InitFormatGML(opt);
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
    //冒泡显示
    var ucMapTip = null;
    var isDetail = false;
    var listenkey;
    var blockpanel;
    var farmerdetailWin, blockdetailWin;
    var detailGrid;
    dev.ShowMapTip = function (features, param, position) {
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
        if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) center = dev.proj.transform(center, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
        if (ucMapTip === null) {
            ucMapTip = new dev.UCMapTip({
                ID: dev.IsNull(param.ID) ? "mapTip" : param.ID,
                Title: dev.IsNull(param.Title) ? "详细信息" : param.Title,
                IconUri: dev.IsNull(param.IconUri) ? "" : param.IconUri,
                Position: center,
                Width: 280,
                Height: 271
            });
            $(ucMapTip).one("onClosed", function () {
                if (!dev.IsNull(param.IsShowFeature) && param.IsShowFeature == true) {
                    if (!dev.IsNull(listenkey)) {
                        dev.MapUtils.removePointKey("maptipfeature", dev.App.Map);
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
        dev.MapTipContent(features, param);
    };
    dev.ClearMapTip = function () {
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
            if (layerfields[i].ValueType == "datetime" && (!dev.IsNull(layerfields[i].TimeType) && layerfields[i].TimeType == "geo")) value = dev.geoTimeToDate(value, false);
            var detailcontent = $('<div class="Content" title="' + (dev.IsNullAll(value) ? "-" : value) + '">' + (dev.IsNullAll(value) ? "-" : value) + '</div>');
            if ((layerinfo.LayerType == "block" || layerinfo.LayerType == "crop") && layerfields[i].Name == layerinfo.CompareInfo.PrimaryKey) {
                detailcontent = $('<div class="Content" title="' + (dev.IsNullAll(value) ? "-" : value) + '"><a style="color:#0099cc;text-decoration:underline;">' + (dev.IsNull(value) ? "-" : value) + '</a></div>');
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
                    dev.GetMassifDetailinfo(curr_row);
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
    dev.MapTipContent = function (data, param) {
        ucMapTip.Clear();
        if (dev.IsNull(data.length) || data.length == 1) {
            var tempdata = data;
            if (data.length == 1) tempdata = data[0];
            if (dev.IsNull(tempdata.length)) {
                var detailBox = new dev.Box({ Width: 278, Height: 243, HasBorder: false });
                ucMapTip.Add(detailBox.Target);
                detailBox.SetContent(tipdetail(tempdata, param));
                detailBox.Layout();
                if (param.IsShowFeature) {
                    var firstf = tempdata;
                    if (!dev.IsNull(listenkey)) {
                        dev.MapUtils.removePointKey("maptipfeature", dev.App.Map);
                        listenkey = null
                    }
                    var s_f = firstf.clone();
                    s_f.setId("maptipfeature");
                    listenkey = dev.MapUtils.LineSymbolStyle(s_f);
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
                        s_feature.setId("maptipfeature");
                        listenkey = dev.MapUtils.LineSymbolStyle(s_feature);
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
                            s_feature.setId("maptipfeature");
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
                listenkey = dev.MapUtils.LineSymbolStyle(s_f);
            }
        }
    };
    dev.GetMassifDetailinfo = function (row, showInspect) {
        $.ajax({
            url: dev.cookie.baseUri + "massif/detail/" + row.massifid + "?" + new Date().getTime(),
            type: "GET",
            dataType: "json",
            success: function (result) {
                if (dev.IsNull(result.data) || (dev.IsNull(result.data.farmer) && result.data.crops.length == 0)) return;
                dev.ShowBlockInfo(result.data, row, showInspect);
            }
        });
    };
    dev.ShowBlockInfo = function (detailinfo, currrow, showInspect) {
        if (!dev.IsNull(blockpanel)) {
            if (!dev.IsNull(detailGrid)) {
                detailGrid.Target.remove();
                detailGrid = null;
            }
            blockpanel.remove();
        }
        blockpanel = $('<div style="width:317px;position:absolute;top:100px;left:5px;z-index:10001;"></div>').appendTo(dev.App.MapPanel.Target);
        var detailcontent = $('<div style="width:319px;background-color:#fff;"></div>').appendTo(blockpanel);
        var detailtitle = $('<div style="height:30px;background-color:#0099cc;width:100%;color:#fff;line-height:30px;font-size:14px;position:relative;"><span style="margin-left:5px;">基本信息</span></div>').appendTo(detailcontent);
        var icon = $('<div style="position:absolute;right:0px;top:0px;height:30px;width:40px;background-color:#0099cc;background-image: url(' + dev.App.Root + 'image/l1.png);background-position: -390px 0px;"></div>').appendTo(detailtitle);
        icon.mouseover(function () {
            $(this).css("background-color", "#ff0000");
        }).mouseleave(function () {
            $(this).css("background-color", "#0099cc");
        }).click(function () {
            if (!dev.IsNull(detailGrid)) {
                detailGrid.Target.remove();
                detailGrid = null;
            }
            blockpanel.remove();
        });
        if (!dev.IsNull(detailinfo.farmer)) {
            var framercontent = $('<div style="height:125px;width:317px;background-color:#fff;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom:1px solid #ddd;"></div>').appendTo(detailcontent);
            var framerleft = $('<div style="height:95px;width:95px;display:inline-block;float:left;"><div style="height:80px;width:80px;margin-top:15px;margin-left:15px;border-radius:40px;background-image:url(' + (dev.IsNull(detailinfo.farmer.photouri) ? (dev.App.Root + "image/agri/nopic.png") : (detailinfo.farmer.photouri)) + ');background-repeat: no-repeat; background-position: center; background-size: 80px 80px;"></div></div>').appendTo(framercontent);
            var framername = $('<div style="height:30px;width:80px;text-align:center;color:#0099cc;line-height:30px;text-decoration: underline;margin-left:15px;"><a tag="' + detailinfo.farmer.id + '">' + detailinfo.farmer.name + '</a></div>').appendTo(framerleft);
            $('a', framername).click(function () {
                var tag = $(this).attr("tag");
                if (dev.IsNull(tag)) return;
                farmerdetailWin = new dev.Window({
                    ID: "farmerWin",
                    IconCls: "machine-trackedit",
                    Title: "农户详细信息",
                    Parent: dev.App.FillPanel.Target,
                    Maximizable: false,
                    Modal: true,
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
            });
            var framerright = $('<div style="width:212px;height:70px;margin-top:25px;display:inline-block;margin-left:10px;"></div>').appendTo(framercontent);
            var framecardid = $('<div style="height:35px;width:222px;"><div style="width:55px;text-align:right;padding-right:5px;height:35px;line-height:35px;display:inline-block;">身份证号</div><div style="width;147px;height:35px;line-height:35px;padding-left:5px;display:inline-block;">' + detailinfo.farmer.cardid + '</div></div>').appendTo(framerright);
            var framephone = $('<div style="height:35px;width:222px;"><div style="width:55px;text-align:right;padding-right:5px;height:35px;line-height:35px;display:inline-block;">联系电话</div><div style="width:147px;height:35px;line-height:35px;padding-left:5px;display:inline-block;">' + detailinfo.farmer.mobilephone + '</div></div>').appendTo(framerright);
        }
        var blocktitle = $('<div style="height:27px;width:317px;line-height:27px;border-bottom:1px dashed #eee;border-left:1px solid #ddd;border-right:1px solid #ddd;padding-top:3px;"><div style="margin-left:3px;height:24px;width:24px;border-radius:12px;background-color:#0099cc;color:#fff;line-height:24px;text-align:center;display:inline-block;float:left;">地</div><div style="margin-left:10px;display:inline-block;height:24px;line-height:24px;color:#0099cc;">地块信息</div></div>').appendTo(detailcontent);
        var blockcontent = $('<div style="height:150px;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom:1px solid #ddd;width:317px;"></div>').appendTo(detailcontent);
        var tempdiv = $('<div style="height:120px;width:317px;"></div>').appendTo(blockcontent);
        var blockleft = $('<div style="height:120px;width:200px;display:inline-block;float:left;"></div>').appendTo(tempdiv);
        var blockid = $('<div style="height:30px;width:200px;"><div style="height:30px;width:55px;padding-right:5px;display:inline-block;float:left;text-align:right;line-height:30px;">地块编号</div><div style="height:30px;width:135px;padding-left:5px;display:inline-block;line-height:30px;color:#3385ff;text-decoration: underline;"><a>' + currrow.massifid + '</a></div></div>').appendTo(blockleft);
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
                    Parent: dev.App.FillPanel.Target,
                    Maximizable: false,
                    Modal: true,
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
            }
        });
        var blockname = $('<div style="height:30px;width:200px;"><div style="height:30px;width:55px;padding-right:5px;display:inline-block;float:left;text-align:right;line-height:30px;">地类名称</div><div style="height:30px;width:135px;padding-left:5px;display:inline-block;line-height:30px;">' + (dev.IsNullAll(detailinfo.massifs.classname) ? "" : detailinfo.massifs.classname) + '</div></div>').appendTo(blockleft);
        var blocktype = $('<div style="height:30px;width:200px;"><div style="height:30px;width:55px;padding-right:5px;display:inline-block;float:left;text-align:right;line-height:30px;">耕地类型</div><div style="height:30px;width:135px;padding-left:5px;display:inline-block;line-height:30px;">' + (dev.IsNullAll(detailinfo.massifs.landtype) ? "" : detailinfo.massifs.landtype) + '</div></div>').appendTo(blockleft);
        var blockarea = $('<div style="height:30px;width:200px;"><div style="height:30px;width:55px;padding-right:5px;display:inline-block;float:left;text-align:right;line-height:30px;">地块面积</div><div style="height:30px;width:135px;padding-left:5px;display:inline-block;line-height:30px;">' + (dev.IsNullAll(detailinfo.massifs.farmlandarea) ? "" : (dev.SqrtMetersToMu(detailinfo.massifs.farmlandarea, 3) + '(亩)')) + '</div></div>').appendTo(blockleft);
        var blockright = $('<div style="height:120px;width:116px;display:inline-block;"><div style="width:110px;height:115px;margin-top:5px; background-image: url(' + ((dev.IsNull(detailinfo.images) || detailinfo.images.length == 0) ? (dev.App.Root + "image/agri/nopic.png") : detailinfo.images[0]) + '); background-repeat: no-repeat; background-position: center;"></div></div>').appendTo(tempdiv);
        blockright.prop("imgs", detailinfo.images);
        blockright.click(function () {
            var imgs = $(this).prop("imgs");
            dev.PreViewPics(imgs);
        });
        var text = "";
        if (!dev.IsNull(currrow.province)) text += currrow.province;
        if (!dev.IsNull(currrow.city)) text += currrow.city;
        if (!dev.IsNull(currrow.county)) text += currrow.county;
        if (!dev.IsNull(currrow.town)) text += currrow.town;
        if (!dev.IsNull(currrow.village)) text += currrow.village;
        var blockaddress = $('<div style="height:30px;width:317px;"><div style="width:55px;padding-right:5px;display:inline-block;float:left;text-align:right;line-height:30px;height:30px;">详细地址</div><div style="height:30px;width:252px;padding-left:5px;display:inline-block;line-height:30px;">' + text + '</div></div>').appendTo(blockcontent);
        var croptitle = $('<div style="height:27px;width:317px;line-height:27px;border-bottom:1px dashed #eee;border-left:1px solid #ddd;border-right:1px solid #ddd;padding-top:3px;"><div style="margin-left:3px;height:24px;width:24px;border-radius:12px;background-color:#0099cc;color:#fff;line-height:24px;text-align:center;display:inline-block;float:left;">植</div><div style="margin-left:10px;display:inline-block;height:24px;line-height:24px;color:#0099cc;">历史种植</div></div>').appendTo(detailcontent);
        if (detailinfo.crops.length > 0) {
            var cropcontent = $('<div style="width:317px;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom:1px solid #ddd;"></div>').appendTo(detailcontent);
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
            $(".detailcroppic", detailGrid.Target).click(function () {
                var tag = $(this).attr("tag");
                var cropdatas = detailGrid.DataGrid.datagrid("getData").rows;
                if (dev.IsNull(cropdatas) || cropdatas.length == 0) return;
                var c_row = Enumerable.From(cropdatas).Where('s=>s.id=="' + tag + '"').FirstOrDefault();
                if (dev.IsNull(c_row) || dev.IsNull(c_row.images) || c_row.images.length == 0) return;
                dev.PreViewPics(c_row.images);
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
                            Height: 405,
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
                else if (top + blockpanel.outerHeight() > dev.App.FillPanel.Target.outerHeight()) {
                    top = dev.App.FillPanel.Target.outerHeight() - blockpanel.outerHeight();
                    if (top < 0) top = 0;
                }
                if (left < 0) left = 0;
                else if (left + blockpanel.outerWidth() > dev.App.FillPanel.Target.outerWidth()) {
                    left = dev.App.FillPanel.Target.outerWidth() - blockpanel.outerWidth();
                    if (left < 0) left = 0;
                }
                blockpanel.css({ top: top + "px", left: left + "px" });
            }
        }());
    }
    //获取当前时间的String
    dev.GetNowDateString = function (isSimple) {
        var datestr = "";
        var date = new Date();
        date.getYear()
        var year = date.getUTCFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        var hour = date.getHours();
        var mins = date.getMinutes();
        var seconds = date.getSeconds();
        datestr = year + "-" + (month < 10 ? ("0" + month) : month) + "-" + (day < 10 ? ("0" + day) : day);
        if (isSimple) return datestr;
        datestr += " " + (hour < 10 ? ("0" + hour) : hour) + ":" + (mins < 10 ? ("0" + mins) : mins) + ":" + (seconds < 10 ? ("0" + seconds) : seconds);
        return datestr;
    };
    dev.GetDateString = function (times, isSimple) {
        var datestr = "";
        var date = new Date(times);
        var year = date.getUTCFullYear();
        var month = date.getMonth() + 1;
        var day = date.getDate();
        datestr = year + "-" + (month < 10 ? ("0" + month) : month) + "-" + (day < 10 ? ("0" + day) : day);
        if (isSimple) return datestr;
        var hour = date.getHours();
        var mins = date.getMinutes();
        var seconds = date.getSeconds();
        datestr += " " + (hour < 10 ? ("0" + hour) : hour) + ":" + (mins < 10 ? ("0" + mins) : mins) + ":" + (seconds < 10 ? ("0" + seconds) : seconds);
        return datestr;
    };
    dev.GetPointsStrbyGeom = function (feature) {
        var pointsstr = "";
        if (dev.IsNull(feature)) return pointsstr;
        var geom = feature.getGeometry();
        if (dev.IsNull(geom)) return pointsstr;
        var type = geom.getType();
        if (type == "multPolygon") {

        }
        if (type == "polygon") {

        }
        if (type == "Linestring") {
        }
        if (type == "point") {
        }
    };
    //根据类型将Geoserverz属性查询条件转化为DB的条件
    dev.ConvertDBFilter = function (condition) {
        if (dev.IsNull(condition) || condition.trim() == "1=1") return " 1=1 ";
        condition = condition.replace(/1=1\s*AND|1=1\s*OR|1=1\s*/, "");
        var cqlfilter = "";
        var filters = condition.split(/\s+AND\s+|\s+and\s+/);
        for (var i = 0; i < filters.length; i++) {
            if (i > 0) cqlfilter += " AND ";
            var orlist = filters[i].split(/\s+OR\s+|\s+or\s+/);
            for (var j = 0; j < orlist.length; j++) {
                if (j > 0) cqlfilter += " OR ";
                var tempCondition = orlist[j].trim();
                var currfield = tempCondition.split(/\s*=\s*|\s+LIKE\s+|\s+like\s+|\s*>\s*|\s*<\s*|\s*>=\s*|\s*<=\s*|\s+in\s*|\s+IN\s*/)[0];
                var quote = currfield.substring(0, currfield.lastIndexOf("(") + 1);
                var tempField = currfield.substring(currfield.lastIndexOf("(") + 1);
                var fieldvalue = tempCondition.substring(currfield.length);
                cqlfilter += quote + "\"" + tempField.trim() + "\"" + fieldvalue;
            }
        }
        return cqlfilter;
    };
    //根据类型将DB属性查询条件转化为geoserver的条件
    dev.ConvertFilter = function (condition) {
        condition = condition.replace(/1=1\s*AND|1=1\s*OR|1=1\s*/, "");
        condition = condition.replace(/\"/g, "");
        return condition;
    };
    //获取树图层获取子节点
    dev.GetServerInfoByValues = function (values) {
        var configlayers = dev.App.Config.Extend.LayerForTree.LayerRoot;
        var treeserver, serverinfos = [];
        if (dev.IsNull(configlayers) || dev.IsNull(values)) return null;
        if (dev.IsNull(configlayers.length)) treeserver = [dev.ObjClone(configlayers)];
        else treeserver = configlayers.clone();
        for (var i = 0; i < treeserver.length; i++) {
            var childs = treeserver[i].Child;
            if (dev.IsNull(childs)) continue;
            var newchilds;
            if (dev.IsNull(childs.length)) newchilds = [dev.ObjClone(childs)];
            else newchilds = childs.clone();
            var con = "s=>";
            for (var j = 0; j < values.length; j++) con += "s.Value=='" + values[j] + "' || ";
            con = con.substr(0, con.length - 3);
            var server = Enumerable.From(newchilds).Where(con).ToArray();
            if (dev.IsNull(server) || server.length == 0) continue;
            if (server.length == 1) serverinfos.push(server[0]);
            else {
                for (var n = 0; n < server.length; n++) serverinfos.push(server[n]);
            }
        }
        return serverinfos;
    }
    //初始化地图View
    dev.initView = function (mapConfig) {
        if (dev.IsNull(mapConfig)) mapConfig = dev.App.Config.SystemMap;
        var resolutions;
        if (!dev.IsNull(mapConfig.LevelInfo) && !dev.IsNull(mapConfig.LevelInfo.IsVisibleLevel) && mapConfig.LevelInfo.IsVisibleLevel == "true") {
            resolutions = [];
            for (var i = 0; i < mapConfig.LevelInfo.Levels.length; i++) {
                if (mapConfig.DisplayEPSG == "EPSG:4326") resolutions.push(parseFloat(mapConfig.LevelInfo.Levels[i].Resolution));
                else resolutions.push(parseFloat(mapConfig.LevelInfo.Levels[i].Resolution3857));
            }
        }
        var mapview = new dev.View({
            projection: dev.proj.get(mapConfig.DisplayEPSG),
            resolutions: resolutions,
            minZoom: 1,
            maxResolution: mapConfig.LevelInfo.MaxResolution,
            maxZoom: 20,
            minResolution: mapConfig.LevelInfo.MinResolution
        });
        return mapview;
    };
    //根据feature 查询省市县
    dev.getcountybyfeatrue = function (featrue) {
        if (dev.IsNull(featrue)) return null;
        var layerlist = dev.GetTreeLayers(dev.TreeLayerType.XZQ);
        if (dev.IsNull(layerlist) || layerlist.length == 0) return null;
        var querylayers = layerlist[0].Child;
        if (dev.IsNull(querylayers) || querylayers.length == 0) return null;
        querylayers = Enumerable.From(querylayers).Where('s=>s.Value!="TOWN"').ToArray();
        if (dev.IsNull(querylayers) || querylayers.length == 0) return null;
        if (featrue.getGeometry().getType() == "Point") {
            var ext = dev.MapUtils.GetExtentByMapClick(featrue.getGeometry().getCoordinates(), dev.App.Map, 2);
            if (!dev.IsNull(ext)) featrue = new dev.Feature(ext);
        }
        var wkt = dev.GetWKTByFeature(featrue, true);
        var param = [];
        querylayers = Enumerable.From(querylayers).OrderBy('s=>s.Order').ToArray();
        for (var i = querylayers.length - 1; i >= 0; i--) {
            var condition = dev.MapUtils.GetCql_INTERSECTS(wkt, querylayers[i].GeomField);
            param.push({
                ID: querylayers[i].Value,
                Url: dev.GetSystemUrlByRelID(querylayers[i].WFSUrl),
                TypeName: querylayers[i].TypeName,
                Async: false,
                CqlFilter: condition
            });
        }
        var index = 0, data;
        var wfsquery = new dev.WFS_H();
        wfsquery.Target.bind("onQueryCompleted", function (s, e) {
            if (dev.IsNull(e.data) || e.data.length == 0) {
                if (index < param.length - 1) { index++; wfsquery.Query(param[index]); }
            }
            else data = e.data[0];
        });
        wfsquery.Query(param[index]);
        return data;
    }
    //根据feature 查询省市县乡
    dev.getplacedata = function (feature, lever) {
        if (dev.IsNull(feature)) return null;
        var layerlist = dev.GetTreeLayers(dev.TreeLayerType.XZQ);
        if (dev.IsNull(layerlist) || layerlist.length == 0) return null;
        var querylayers = layerlist[0].Child;
        if (dev.IsNull(querylayers) || querylayers.length == 0) return null;
        querylayers = Enumerable.From(querylayers).OrderBy('s=>s.Order').ToArray();
        if (!dev.IsNull(lever)) {
            if (lever == 1) querylayers = [querylayers[0]]; //省级别
            if (lever == 2) querylayers = [querylayers[0], querylayers[1]];//市级别
            if (lever == 3) querylayers = [querylayers[0], querylayers[1], querylayers[2]];//县级别
        }
        if (feature.getGeometry().getType() == "Point") {
            var ext = dev.MapUtils.GetExtentByMapClick(feature.getGeometry().getCoordinates(), dev.App.Map, 2);
            if (!dev.IsNull(ext)) feature = new dev.Feature(ext);
        }
        var wkt = dev.GetWKTByFeature(feature, true);
        var param = [];
        for (var i = querylayers.length - 1; i >= 0; i--) {
            var condition = dev.MapUtils.GetCql_INTERSECTS(wkt, querylayers[i].GeomField);
            param.push({
                ID: querylayers[i].Value,
                Url: dev.GetSystemUrlByRelID(querylayers[i].WFSUrl),
                TypeName: querylayers[i].TypeName,
                Async: false,
                CqlFilter: condition
            });
        }
        var index = 0, data;
        var wfsquery = new dev.WFS_H();
        wfsquery.Target.bind("onQueryCompleted", function (s, e) {
            if (dev.IsNull(e.data) || e.data.length == 0) {
                //重新往下走
                if (index < param.length - 1) {
                    index++;
                    wfsquery.Query(param[index]);
                }
            }
            else {
                var properties = e.data[0].getProperties();
                data = {};
                if (!dev.IsNull(e.data[0].getProperties().COUNTRY)) data.country = e.data[0].getProperties().COUNTRY;
                if (!dev.IsNull(e.data[0].getProperties().PROVINCE)) data.province = e.data[0].getProperties().PROVINCE;
                if (!dev.IsNull(e.data[0].getProperties().CITY)) data.city = e.data[0].getProperties().CITY;
                if (!dev.IsNull(e.data[0].getProperties().COUNTY)) data.county = e.data[0].getProperties().COUNTY;
                if (!dev.IsNull(e.data[0].getProperties().TOWN)) data.town = e.data[0].getProperties().TOWN;
                if (!dev.IsNull(e.data[0].getProperties().ADCODE)) data.adcode = e.data[0].getProperties().ADCODE;
            }
        });
        wfsquery.Query(param[index]);
        return data;
    },
    dev.getfeaturebylever = function (lever, con) {
        if (dev.IsNull(lever)) return;
        var layerlist = dev.GetTreeLayers(dev.TreeLayerType.XZQ);
        if (dev.IsNull(layerlist) || layerlist.length == 0) return;
        var needlayer = Enumerable.From(layerlist[0].Child).Where('s=>s.Value.toLowerCase()=="' + lever.toLowerCase() + '"').FirstOrDefault();
        if (dev.IsNull(needlayer)) return;
        var param = {
            ID: needlayer.Value,
            Url: dev.GetSystemUrlByRelID(needlayer.WFSUrl),
            TypeName: needlayer.TypeName,
            Async: false
        };
        if (!dev.IsNull(con)) param.CqlFilter = con;
        var data;
        var wfsquery = new dev.WFS_H();
        wfsquery.Target.bind("onQueryCompleted", function (s, e) {
            if (dev.IsNull(e.data) || e.data.length == 0) data = null;
            else if (e.data.length == 1) data = e.data[0];
            else data = e.data;
            //  data = e.data[0];
        });
        wfsquery.Query(param);
        return data;
    }
    dev.getpalceCenter = function (isfeature, province, city, county, town) {
        if (dev.IsNull(province) && dev.IsNull(city) && dev.IsNull(county) && dev.IsNull(town)) return null;
        var layerlist = dev.GetTreeLayers(dev.TreeLayerType.XZQ);
        if (dev.IsNull(layerlist) || layerlist.length == 0) return null;
        var querylayers = layerlist[0].Child;
        if (dev.IsNull(querylayers) || querylayers.length == 0) return null;
        querylayers = Enumerable.From(querylayers).OrderBy('s=>s.Order').ToArray();
        var param = [];
        for (var i = querylayers.length - 1; i >= 0; i--) {
            var condition = "";
            if (querylayers[i].Value == "PROVINCE" && !dev.IsNull(province)) condition = "PROVINCE='" + province + "'";
            if (querylayers[i].Value == "CITY" && !dev.IsNull(province) && !dev.IsNull(city)) condition = "PROVINCE='" + province + "' AND CITY='" + city + "'";
            if (querylayers[i].Value == "COUNTY" && !dev.IsNull(province) && !dev.IsNull(city) && !dev.IsNull(county)) condition = "PROVINCE='" + province + "' AND CITY='" + city + "' AND COUNTY='" + county + "'";
            if (querylayers[i].Value == "TOWN" && !dev.IsNull(province) && !dev.IsNull(city) && !dev.IsNull(county) && !dev.IsNull(town)) condition = "PROVINCE='" + province + "' AND CITY='" + city + "' AND COUNTY='" + county + "' AND TOWN='" + town + "'";
            //var condition = dev.MapUtils.GetCql_INTERSECTS(wkt, querylayers[i].GeomField);
            if (!dev.IsNull(condition)) {
                param.push({
                    ID: querylayers[i].Value,
                    Url: dev.GetSystemUrlByRelID(querylayers[i].WFSUrl),
                    TypeName: querylayers[i].TypeName,
                    Async: false,
                    CqlFilter: condition
                });
            }
        }
        var index = 0, data;
        var wfsquery = new dev.WFS_H();
        wfsquery.Target.bind("onQueryCompleted", function (s, e) {
            if (dev.IsNull(e.data) || e.data.length == 0) {
                //重新往下走
                index++;
                wfsquery.Query(param[index]);
            }
            else {
                if (isfeature) data = e.data[0];
                else {
                    var geom = e.data[0].getGeometry();
                    // var center = feature.getGeometry();
                    var extent = geom.getExtent();
                    data = [(extent[0] + extent[2]) / 2, (extent[1] + extent[3]) / 2];
                }
            }
        });
        wfsquery.Query(param[index]);
        return data;
    }
    //查询行政区划
    dev.QueryXZQ = function (code, type) {
        if (dev.IsNull(code)) return;
        if (dev.IsNull(type)) type = "county";
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
        var query = new dev.WFS_H();
        var data;
        query.Target.bind("onQueryCompleted", function (s, e) {
            if (dev.IsNull(e.data) || e.data.length == 0) {
                var cnode = dev.getParentCode(code);
                if (!dev.IsNull(cnode)) data = dev.QueryXZQ(cnode.ID, cnode.Value.toLowerCase());
            }
            else data = { cdata: e.data, xzqtype: type };
        });
        query.Query(param);
        return data;
    }
    dev.getParentCode = function (code) {
        if (dev.IsNull(code)) return;
        var layerconfigs = dev.App.Config.Extend.LayerForTree.LayerRoot;
        if (dev.IsNull(layerconfigs)) return;
        var templayers = layerconfigs.clone();
        var cnode = getparentnode(templayers, code);
        return cnode;
    }

    function getparentnode(nodes, code, parentnode) {
        if (dev.IsNull(nodes)) return;
        if (dev.IsNull(nodes.length)) nodes = [nodes];
        var cnode;
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].ID == code) {
                cnode = parentnode;
                break;
            }
            if (dev.IsNull(nodes[i].Child) || (!dev.IsNull(nodes[i].Child.length) && nodes[i].Child.length == 0)) continue;
            cnode = getparentnode(nodes[i].Child, code, nodes[i]);
            if (!dev.IsNull(cnode)) break;
        }
        return cnode;
    }
    //验证函数
    dev.validation = function (type, value) {
        var responsdata = { isvalid: true, Msg: "" };
        //  判断是否是正确的电话号码格式(中国)。
        if (type == "tel") {
            if (!(/^((\(\d{2,3}\))|(\d{3}\-))?(\(0\d{2,3}\)|0\d{2,3}-)?[1-9]\d{6,7}(\-\d{1,4})?$/i.test(value))) {
                responsdata.isvalid = false;
                responsdata.Msg = "\“电话号码\”无效!";
            }
        }
        //  判断是否是正确的手机号码格式(中国)。
        if (type == "mobilephone") {
            if (!(/^(13|14|15|16|17|18|19)\d{9}$/i.test(value))) {
                responsdata.isvalid = false;
                responsdata.Msg = "\“电话号码\”无效!";
            }
        }

        if (type == "bankcard") {
            var bankno = value;
            if (bankno.length < 16 || bankno.length > 19) {
                responsdata.Msg = "\“银行卡号\”长度必须在16到19之间";
                responsdata.isvalid = false;
            }
            var no = /^\d*$/;//全数字
            if (!no.exec(bankno)) {
                responsdata.Msg = "\“银行卡号\”必须全为数字";
                responsdata.isvalid = false;
            }
            //开头6位
            var strBin = "10,18,30,35,37,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,58,60,62,65,68,69,84,87,88,94,95,98,99";
            if (strBin.indexOf(bankno.substring(0, 2)) == -1) {
                responsdata.Msg = "\“银行卡号\”不符合规范";      //开头六位不符合规范
                responsdata.isvalid = false;
            }
        }

        if (type == "IDcard") {
            var num = value;
            num = num.toUpperCase();
            //身份证号码为15位或者18位，15位时全为数字，18位前17位为数字，最后一位是校验位，可能为数字或字符X。
            if (!(/(^\d{15}$)|(^\d{17}([0-9]|X)$)/.test(num))) {
                responsdata.isvalid = false;
                responsdata.Msg = "输入的身份证号长度不对，或者号码不符合规定！";
                //15位号码应全为数字，18位号码末位可以为数字或X。
            }
            //校验位按照ISO 7064:1983.MOD 11-2的规定生成，X可以认为是数字10。
            //下面分别分析出生日期和校验位
            var len, re;
            len = num.length;
            if (len == 15) {
                re = new RegExp(/^(\d{6})(\d{2})(\d{2})(\d{2})(\d{3})$/);
                var arrSplit = num.match(re);
                //检查生日日期是否正确
                var dtmBirth = new Date('19' + arrSplit[2] + '/' + arrSplit[3] + '/' + arrSplit[4]);
                var bGoodDay;
                bGoodDay = (dtmBirth.getYear() == Number(arrSplit[2])) && ((dtmBirth.getMonth() + 1) == Number(arrSplit[3])) && (dtmBirth.getDate() == Number(arrSplit[4]));
                if (!bGoodDay) {
                    responsdata.isvalid = false;
                    responsdata.Msg = "输入的身份证号里出生日期不对！";
                } else {
                    //将15位身份证转成18位
                    //校验位按照ISO 7064:1983.MOD 11-2的规定生成，X可以认为是数字10。
                    var arrInt = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
                    var arrCh = new Array('1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2');
                    var nTemp = 0, i;
                    num = num.substr(0, 6) + '19' + num.substr(6, num.length - 6);
                    for (i = 0; i < 17; i++) {
                        nTemp += num.substr(i, 1) * arrInt[i];
                    }
                    num += arrCh[nTemp % 11];
                    responsdata.isvalid = true;
                }
            }
            if (len == 18) {
                re = new RegExp(/^(\d{6})(\d{4})(\d{2})(\d{2})(\d{3})([0-9]|X)$/);
                var arrSplit = num.match(re);
                if (arrSplit == null) {
                    responsdata.isvalid = false;
                    responsdata.Msg = "输入的身份证号长度不对，或者号码不符合规定！";
                }
                else {
                    //检查生日日期是否正确
                    var dtmBirth = new Date(arrSplit[2] + "/" + arrSplit[3] + "/" + arrSplit[4]);
                    var bGoodDay;
                    bGoodDay = (dtmBirth.getFullYear() == Number(arrSplit[2])) && ((dtmBirth.getMonth() + 1) == Number(arrSplit[3])) && (dtmBirth.getDate() == Number(arrSplit[4]));
                    if (!bGoodDay) {
                        responsdata.isvalid = false;
                        responsdata.Msg = "输入的身份证号里出生日期不对！";
                    } else {
                        //检验18位身份证的校验码是否正确。
                        //校验位按照ISO 7064:1983.MOD 11-2的规定生成，X可以认为是数字10。
                        var valnum;
                        var arrInt = new Array(7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2);
                        var arrCh = new Array('1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2');
                        var nTemp = 0, i;
                        for (i = 0; i < 17; i++) {
                            nTemp += num.substr(i, 1) * arrInt[i];
                        }
                        valnum = arrCh[nTemp % 11];
                        if (valnum != num.substr(17, 1)) {
                            responsdata.isvalid = false;
                            //responsdata.Msg = "18位身份证的校验码不正确！应该为：" + valnum;
                            responsdata.Msg = "输入的身份证号长度不对，或者号码不符合规定！";
                        }
                    }
                }
            }
        }
        return responsdata;
    }
    //wkt转换成为geom
    dev.ConvertGeomByWKT = function (wkt) {
        if (dev.IsNull(wkt)) return null;
        var geomtype = wkt.substring(0, wkt.indexOf('(')).trim();
        var geomstr = wkt.replace(geomtype, '');
        var geom;
        if (geomtype.toUpperCase() == "MULTIPOLYGON") geom = new dev.geom.MultiPolygon(dev.getGeomArrayByStr(geomstr, geomtype));
        if (geomtype.toUpperCase() == "POLYGON") geom = new dev.geom.Polygon(dev.getGeomArrayByStr(geomstr, geomtype));
        if (geomtype.toUpperCase() == "LINESTRING") geom = new dev.geom.LineString(dev.getGeomArrayByStr(geomstr, geomtype));
        return geom;
    }
    dev.getGeomArrayByStr = function (str, type) {
        var geom = [];
        var geosStr = str.substr(str.indexOf('(') + 1, str.lastIndexOf(')') - 1);
        if (type == "MULTIPOLYGON") {
            var polygonStrs = geosStr.split(')),');
            for (var i = 0; i < polygonStrs.length - 1; i++) polygonStrs[i] = polygonStrs + "))";
            for (var i = 0; i < polygonStrs.length; i++) {
                var currPolygonStr = polygonStrs[i];
                geom.push(dev.getGeomArrayByStr(currPolygonStr, "POLYGON"));
            }
        }
        if (type == "POLYGON") {
            var ringStrs = geosStr.split('),');
            for (var i = 0; i < ringStrs.length - 1; i++) ringStrs[i] = ringStrs[i] + ")";
            for (var i = 0; i < ringStrs.length; i++) {
                var currRingStr = ringStrs[i];
                geom.push(dev.getGeomArrayByStr(currRingStr, "LINESTRING"));
            }
        }
        if (type == "LINESTRING") {
            geosStr = geosStr.replace(")", "");
            var pointStrs = geosStr.split(',');
            for (var i = 0; i < pointStrs.length; i++) {
                var currPointStr = pointStrs[i].trim();
                geom.push([parseFloat(currPointStr.split(' ')[0]), parseFloat(currPointStr.split(' ')[1])]);
            }
        }
        return geom;
    }

    /*start 自定义图片预览 start*/
    dev.PreViewPics1 = function (pics, index, parent) {
        if (dev.IsNull(pics) || pics.length == 0) return;
        if (dev.IsNull(parent)) parent = dev.App.FillPanel.Target;
        if (!dev.IsNumber(index) || index >= pics.length) index = 0;
        var imgsdiv = $('<div style="height:100%;width:100%;background:rgba(0,0,0,0.6);position:absolute;left:0px;top:0px;z-index:10000;" tag="' + index + '"></div>').appendTo(parent);
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
        var previewimg = $('<div id="previewimg" class="previewimg grab" style="height:330px;width:300px;left:50%;top:50%;transform: translate(-50%, -50%);position: absolute;background-image:url(' + pics[index] + ');background-position: center;background-repeat: no-repeat;z-index: -1;"></div>').appendTo(imgsdiv);
        var tipdiv = $('<div id="tips"></div>').appendTo(imgsdiv);
        tipdiv.css({
            "font-size": "12px", "line-height": "20px", "top": "50%", "left": "50%", "width": "50px",
            "height": "20px", "margin-top": "-10px", "margin-left": "-25px", "text-align": "center",
            "color": "#fff", "background-color": "#000", "border-radius": "10px", "position": "absolute", "display": "none"
        });

        dev.mousewheel(imgsdiv, function () {
            var zoomHeight = $("#previewimg").innerHeight() * 1.03;
            var zoomWidth = $("#previewimg").innerWidth() * 1.03;
            var top = parseInt($("#previewimg").css("top"));
            var left = parseInt($("#previewimg").css("left"));
            var transform_h = parseInt($("#previewimg").css("transform").replace("matrix(", "").replace(")", "").split(',')[5]);
            var transform_w = parseInt($("#previewimg").css("transform").replace("matrix(", "").replace(")", "").split(',')[4]);
            if (top + zoomHeight + transform_h < 15) { top = -(zoomHeight + transform_h) + 15; previewimg.css("top", top + "px"); }
            if (left + transform_w + zoomWidth < 30) { left = -(zoomWidth + transform_w) + 30; previewimg.css("left", left + "px"); }
            if (top + transform_h > imgsdiv.outerHeight() - 20) { top = imgsdiv.outerHeight() - transform_h - 20; previewimg.css("top", top + "px"); }
            if (left + transform_w > imgsdiv.outerWidth() - 30) { left = imgsdiv.outerWidth() - transform_w - 30; previewimg.css("left", left + "px"); }
            $("#previewimg").css({
                height: zoomHeight + "px",
                width: zoomWidth + "px",
                "background-size": zoomWidth + "px " + zoomHeight + "px"
            })
        }, function () {
            var zoomHeight = $("#previewimg").innerHeight() / 1.03;
            var zoomWidth = $("#previewimg").innerWidth() / 1.03;
            if (zoomHeight < 220) zoomHeight = 220;
            if (zoomWidth < 200) zoomWidth = 200;
            var top = parseInt($("#previewimg").css("top"));
            var left = parseInt($("#previewimg").css("left"));
            var transform_h = parseInt($("#previewimg").css("transform").replace("matrix(", "").replace(")", "").split(',')[5]);
            var transform_w = parseInt($("#previewimg").css("transform").replace("matrix(", "").replace(")", "").split(',')[4]);
            if (top + zoomHeight + transform_h < 15) { top = -(zoomHeight + transform_h) + 15; previewimg.css("top", top + "px"); }
            if (left + transform_w + zoomWidth < 30) { left = -(zoomWidth + transform_w) + 30; previewimg.css("left", left + "px"); }
            if (top + transform_h > imgsdiv.outerHeight() - 20) { top = imgsdiv.outerHeight() - transform_h - 20; previewimg.css("top", top + "px"); }
            if (left + transform_w > imgsdiv.outerWidth() - 30) { left = imgsdiv.outerWidth() - transform_w - 30; previewimg.css("left", left + "px"); }
            $("#previewimg").css({
                height: zoomHeight + "px",
                width: zoomWidth + "px", "background-size": zoomWidth + "px " + zoomHeight + "px"
            })
        });
        dev.startDrag(previewimg[0], imgsdiv);
    }
    //鼠标滚动事件 //obj -对象 
    dev.mousewheel = function (obj, upfun, downfun) {
        if (document.attachEvent) {
            obj.attachEvent("onmousewheel", scrollFn)
        } else {
            if (document.addEventListener) {
                obj[0].addEventListener("mousewheel", scrollFn, false);
                obj[0].addEventListener("DOMMouseScroll", scrollFn, false)
            }
        }
        function scrollFn(e) {
            var ev = e || window.event;
            var dir = ev.wheelDelta || ev.detail;
            if (ev.preventDefault) {
                ev.preventDefault()
            } else {
                ev.returnValue = false
            }
            if (dir == -3 || dir == 120) {
                upfun()
            } else {
                downfun()
            }
        }
    }
    //获取拖拽的样式
    dev.getCss = function (o, key) {
        return o.currentStyle ? o.currentStyle[key] : document.defaultView.getComputedStyle(o, false)[key];
    };
    //拖拽的实现
    dev.startDrag = function (bar, parent, callback) {
        var target = bar;
        var params = {
            left: 0,
            top: 0,
            currentX: 0,
            currentY: 0,
            flag: false
        };
        //o是移动对象
        bar.onmousedown = function (event) {
            params.flag = true;
            if (!event) {
                event = window.event;
                //防止IE文字选中
                bar.onselectstart = function () {
                    return false;
                }
            }
            var e = event;
            $(target).removeClass("grab").addClass("grabbing");
            params.currentX = e.clientX;
            params.currentY = e.clientY;
            params.left = parseInt($(target).css("left"));
            params.top = parseInt($(target).css("top"));
        };
        bar.onmouseup = function () {
            params.flag = false;
            params.left = parseInt($(target).css("left"));
            params.top = parseInt($(target).css("top"));
            $(target).removeClass("grabbing").addClass("grab");
        };
        bar.onmousemove = function (event) {
            var e = event ? event : window.event;
            if (params.flag) {
                var nowX = e.clientX, nowY = e.clientY;
                var disX = nowX - params.currentX, disY = nowY - params.currentY;
                var left = params.left + disX;
                var top = params.top + disY;
                var transform_h = parseInt($(target).css("transform").replace("matrix(", "").replace(")", "").split(',')[5]);
                var transform_w = parseInt($(target).css("transform").replace("matrix(", "").replace(")", "").split(',')[4]);
                var zoomh = $(target).outerHeight();
                var zoomw = $(target).outerWidth();
                if (top + zoomh + transform_h < 15) top = -(zoomh + transform_h) + 15;
                if (left + transform_w + zoomw < 30) left = -(zoomw + transform_w) + 20;
                if (top + transform_h > parent.outerHeight() - 20) top = parent.outerHeight() - transform_h - 20;
                if (left + transform_w > parent.outerWidth() - 30) left = parent.outerWidth() - transform_w - 30;
                $(target).css({
                    width: zoomw + "px",
                    height: zoomh + "px",
                    "left": left + "px",
                    "top": top + "px"
                });
            }
        }
        //if (!dev.IsNull(parent)) {
        //    parent[0].onmouseup = function () {
        //        params.flag = false;
        //        params.left = parseInt($(target).css("left"));
        //        params.top = parseInt($(target).css("top"));
        //        $(target).removeClass("grabbing").addClass("grab");
        //    };
        //}
    };
    /*end 自定义图片预览 end*/

    /* viewer控件基础上的封装*/
    dev.PreViewPics = function (pics, index, parent) {
        if (dev.IsNull(pics) || pics.length == 0) return;
        if (dev.IsNull(parent)) parent = dev.App.FillPanel.Target;
        if (dev.IsNull(index)) index = 0;
        $(".viewer-container", parent).remove();
        $("#showviewer", parent).remove();
        var showviewer = $("<div id='showviewer' style='width:0px;height:0px;z-index:0'><img id='showimg' src='" + pics[index] + "'/></div>").appendTo(parent);
        var picviewer = showviewer.viewer({ toolbar: false, title: false, navbar: false, container: parent[0], isview: true });
        if (pics.length > 1) {
            var lastbtn = $('<div style="background:rgba(0,0,0,0.8);width:90px;height:90px;border-radius:45px;position:absolute;left:100px;top:50%;"><div style="height:90px;width:90px; background-image:url(' + dev.App.Root + "image/agri/previewleft.png" + ');background-position:center;background-repeat:no-repeat;"></div></div>').appendTo($(".viewer-container", parent));
            lastbtn.click(function () {
                if (index > 0) index = index - 1;
                $("#showimg").attr("src", pics[index]);
                $(".viewer-move", $(".viewer-canvas")).attr("src", pics[index]);
                dev.showClickButton(index, lastbtn, nextbtn, pics);
            });
            var nextbtn = $('<div style="background:rgba(0,0,0,0.8);width:90px;height:90px;border-radius:45px;position:absolute;right:250px;top:50%;"><div style="height:90px;width:90px;background-image:url(' + dev.App.Root + "image/agri/previewright.png" + ');background-position:center;background-repeat:no-repeat;"></div></div>').appendTo($(".viewer-container", parent));
            nextbtn.click(function () {
                if (index < pics.length - 1) index += 1;
                $("#showimg").attr("src", pics[index]);
                $(".viewer-move", $(".viewer-canvas")).attr("src", pics[index]);
                dev.showClickButton(index, lastbtn, nextbtn, pics);
            });
            dev.showClickButton(index, lastbtn, nextbtn, pics);
        }
    }

    //图片为第一张的时候 不展示左边的按钮，图片为最后一张的时候不展示右边的按钮
    dev.showClickButton = function (index, lastbtn, nextbtn, pics) {
        if (index == 0) {
            lastbtn.css("display", "none")
        } else {
            lastbtn.css("display", "block")
        }

        if (index == pics.length - 1) {
            nextbtn.css("display", "none")
        } else {
            nextbtn.css("display", "block")
        }
    }

    //获取图层数据的图层
    var searchlayers = [];
    dev.getLayersByCode = function (code, type) {
        searchlayers = [];
        var layerconfigs = dev.App.Config.Extend.LayerForTree.LayerRoot;
        if (dev.IsNull(layerconfigs)) return;
        var templayers = layerconfigs.clone();
        templayers = Enumerable.From(templayers).Where('s=>s.Type.indexOf("' + type + '")>=0').ToArray();
        if (dev.IsNull(templayers) || templayers.length == 0) return;
        getlayerbycode(templayers, code, type);
        return searchlayers;
    };
    dev.getLayerByType = function (type) {
        var layerconfigs = dev.App.Config.Extend.LayerForTree.LayerRoot;
        if (dev.IsNull(layerconfigs)) return;
        var templayers = layerconfigs.clone();
        templayers = Enumerable.From(templayers).Where('s=>s.Type.indexOf("' + type + '")>=0').ToArray();
        if (dev.IsNull(templayers) || templayers.length == 0) return;
        var tlayers = [];
        getlayers(templayers, type, tlayers);
        return tlayers;
    };
    dev.getLayerbyValue = function (values) {
        var layerconfigs = dev.App.Config.Extend.LayerForTree.LayerRoot;
        if (dev.IsNull(layerconfigs)) return;
        var templayers = layerconfigs.clone();
        if (dev.IsNull(templayers) || templayers.length == 0) return;
        var tlayers = [];
        getlayersbyvalue(templayers, values, tlayers);
        return tlayers;
    }

    function getlayersbyvalue(datalayers, values, tlayers) {
        if (dev.IsNull(datalayers)) return;
        if (dev.IsNull(datalayers.length)) datalayers = [datalayers];
        for (var i = 0; i < datalayers.length; i++) {
            if (!dev.IsNull(datalayers[i].IsLayer) && datalayers[i].IsLayer == "true" && values.indexOf(datalayers[i].Value) >= 0) {
                tlayers.push(datalayers[i]);
                break;
            }
            else {
                if (dev.IsNull(datalayers[i].Child) || (!dev.IsNull(datalayers[i].Child.length) && datalayers[i].Child.length == 0)) continue;
                getlayersbyvalue(datalayers[i].Child, values, tlayers);
            }
        }
    }

    function getlayers(datalayers, type, tlayers, parentcode) {
        if (dev.IsNull(datalayers)) return;
        if (dev.IsNull(datalayers.length)) datalayers = [datalayers];
        var templayers = Enumerable.From(datalayers).Where('s=>s.Type!=null && s.Type.indexOf("' + type + '")>=0').ToArray();
        if (dev.IsNull(templayers) || templayers.length == 0) return;
        for (var i = 0; i < templayers.length; i++) {
            if (!dev.IsNull(templayers[i].IsLayer) && templayers[i].IsLayer == "true") {
                templayers[i].code = parentcode;
                tlayers.push(templayers[i]);
            }
            else {
                if (dev.IsNull(templayers[i].Child) || (!dev.IsNull(templayers[i].Child.length) && templayers[i].Child.length == 0)) continue;
                getlayers(templayers[i].Child, type, tlayers, templayers[i].ID);
            }
        }
    }
    function getlayerbycode(datalayers, code, type, issub, parentcode) {
        if (dev.IsNull(datalayers)) return;
        if (dev.IsNull(datalayers.length)) datalayers = [datalayers];
        var templayers = Enumerable.From(datalayers).Where('s=>s.Type!=null && s.Type.indexOf("' + type + '")>=0').ToArray();
        if (dev.IsNull(templayers) || templayers.length == 0) return;
        for (var i = 0; i < templayers.length; i++) {
            if (!issub) {
                if (templayers[i].ID != code) {
                    if (dev.IsNull(templayers[i].Child) || (!dev.IsNull(templayers[i].length) && templayers[i].Child.length == 0)) continue;
                    getlayerbycode(templayers[i].Child, code, type, false, templayers[i].ID);
                }
                else {
                    if (!dev.IsNull(templayers[i].IsLayer) && templayers[i].IsLayer == "true") {
                        templayers[i].code = parentcode;
                        searchlayers.push(templayers[i]);
                    }
                    if (dev.IsNull(templayers[i].Child) || (!dev.IsNull(templayers[i].length) && templayers[i].Child.length == 0)) break;
                    getlayerbycode(templayers[i].Child, code, type, true, templayers[i].ID);
                }
            }
            else {
                if (!dev.IsNull(templayers[i].IsLayer) && templayers[i].IsLayer == "true") {
                    templayers[i].code = parentcode;
                    searchlayers.push(templayers[i]);
                }
                else {
                    if (dev.IsNull(templayers[i].Child) || (!dev.IsNull(templayers[i].length) && templayers[i].Child.length == 0)) continue;
                    getlayerbycode(templayers[i].Child, code, type, issub, templayers[i].ID);
                }
            }
        }
    }
    //平方米与亩的相互转换
    dev.SqrtMetersToMu = function (area, pos) {
        if (dev.IsNull(area)) return;
        if (dev.IsNull(pos)) pos = 3;
        return (parseFloat(area) * 0.0015).toFixed(pos);
    };
    //将亩转成平方米
    dev.MuToSqrtMeters = function (area, pos) {
        if (dev.IsNull(area)) return;
        if (dev.IsNull(pos)) pos = 3;
        return (parseFloat(area) / 0.0015).toFixed(pos);
    };
    // 导出excel
    dev.exportExcelByUrl = function (url, condition) {
        dev.App.exportform.find("input[name='condition']").val(condition);
        dev.App.exportform.attr("action", url);
        dev.App.exportform.submit();
    };

    dev.geoTimeToDate = function (geotimestr, isSimple) {
        if (dev.IsNull(geotimestr)) return null;
        var geotimestr = geotimestr.replace(/-/g, '/').replace('T', ' ').replace('Z', ' UTC');
        var utcDate = new Date(geotimestr);
        return dev.GetDateString(utcDate, isSimple);
    };

    dev.geomArae = function (polygon) {
        if (dev.IsNull(polygon)) return null;
        var wgs84Sphere = new dev.Sphere(6378137);
        var sourceProj = dev.App.Map.getView().getProjection();
        var geom = (polygon.clone().transform(sourceProj, 'EPSG:4326'));
        var coordinates = geom.getCoordinates();
        var area = Math.abs(wgs84Sphere.geodesicArea(coordinates));
        area = (Math.round(area * 100) / 100)
        return area;
    }

    //姓名、电话号码、身份证、银行卡简易加密
    /*简易加密
    * value 需要简易加密的值
    * slen 头保留多少位(默认保留3位)
    * elen 尾部保留多少位（默认保留3位）
    */
    dev.simpleencryp = function (value, slen, elen) {
        if (dev.IsNull(value)) return value;
        if (!dev.IsNumber(slen)) slen = 3;
        if (!dev.IsNumber(elen)) elen = 3;
        var len = value.length;
        var encryp_len = value.length;
        var encryp_value = value.substr(0, slen);
        for (var i = slen; i < encryp_len - elen; i++) encryp_value += "*";
        encryp_value += value.substr(value.length - elen, elen);
        return encryp_value;
    }

    //获取范围所在县
    dev.setcountyposition = function (feature) {
        if (dev.IsNull(feature)) return;
        var layerlist = dev.GetTreeLayers(dev.TreeLayerType.XZQ);
        if (dev.IsNull(layerlist) || layerlist.length == 0) return;
        var querylayers = layerlist[0].Child;
        if (dev.IsNull(querylayers) || querylayers.length == 0) return;
        var countylayer = Enumerable.From(querylayers).Where('s=>s.Value=="CITY"').FirstOrDefault();
        if (dev.IsNull(countylayer)) return;
        var wfsquery = new dev.WFS_H();
        wfsquery.Target.bind("onQueryCompleted", function (s, e) {
            var seleceposition = $(".selecttext", $(".xzqposition", dev.App.MapPanel.MapDOM));
            if (dev.IsNull(e)) return;
            if (e.data.length > 1) {
                seleceposition.html("全国");
                seleceposition.attr("tag", $(this).attr("000000"));
            }
            if (e.data.length == 1) {
                var currdata = e.data[0];
                $(".selecttext", $(".xzqposition", dev.App.MapPanel.MapDOM)).html(currdata.getProperties()["CITY"]);
                $(".selecttext", $(".xzqposition", dev.App.MapPanel.MapDOM)).attr("tag", currdata.getProperties().ADCODE);
            }
        });
        var wkt = dev.GetWKTByFeature(feature, true);
        var condition = dev.MapUtils.GetCql_INTERSECTS(wkt, countylayer.GeomField);
        var param = {
            ID: countylayer.Value,
            Url: dev.GetSystemUrlByRelID(countylayer.WFSUrl),
            TypeName: countylayer.TypeName,
            MaxFeatures: 2,
            CqlFilter: condition
        };
        wfsquery.Query(param);
    }
    //修改Enumerable.From(querylayers).Where('s=>s.Value!="TOWN"').ToArray();
    //范围调整
    dev.justificationrange = function (type, params) {
        var extend;
        if (type == "points") {
            if (realist.length == 1) {
                var ext = dev.MapUtils.GetExtentByMapClick([parseFloat(params[0].x), parseFloat(params[0].y)], dev.App.Map, 2);
                if (!dev.IsNull(ext)) extend = ext.getExtent();
            }
            else if (realist.length > 1) extend = dev.getExtentByPoints(params);
        }
        if (type == "features") {
            extend = dev.getExtentByFeatures(params);
            if (params.length == 1 && params[0].getGeometry().getType() == "Point")
                extend = (dev.MapUtils.GetExtentByMapClick(params[0].getGeometry().getCoordinates(), dev.App.Map, 2)).getExtent();
        }
        if (!dev.IsNull(extend)) {
            var points = [[extend[0], extend[1]], [extend[0], extend[3]], [extend[2], extend[3]], [extend[2], extend[1]], [extend[0], extend[1]]];
            var extendfeature = new dev.Feature(new dev.geom.Polygon([points]));
            dev.setcountyposition(extendfeature);
            var mapproj = dev.App.Map.getView().getProjection();
            if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) extend = dev.proj.transformExtent(extend, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
            dev.App.Map.getView().fit(extend, dev.App.Map.getSize());
        }
    }

    //根据名字获取对应的行政区划
    dev.getxzqbyname = function (name, type) {
        if (dev.IsNull(name) || dev.IsNull(type)) return null;
        var tempparent = Enumerable.From(dev.App.Config.Extend.LayerForTree.LayerRoot).Where('s=>s.Value=="XZQ"').FirstOrDefault();
        var xzqs = tempparent.Child;
        var needlayerinfo = Enumerable.From(xzqs).Where('s=>s.Value.toLowerCase()=="' + type + '"').FirstOrDefault();
        if (dev.IsNull(needlayerinfo)) return null;
        var con = ""
        if (type == "province") con = "NAME='" + name + "'";
        if (type == "city") con = "CITY='" + name + "'";
        if (type == "county") con = "COUNTY='" + name + "'";
        var param = {
            ID: needlayerinfo.Value,
            Url: dev.GetSystemUrlByRelID(needlayerinfo.WFSUrl),
            TypeName: needlayerinfo.TypeName,
            CqlFilter: con,
            Async: false
        };
        var data;
        var query = new dev.WFS_H();
        query.Target.bind("onQueryCompleted", function (s, e) {
            if (!dev.IsNull(e.data) && e.data.length > 0) data = e.data[0];
        });
        query.Query(param);
        return data;
    }

    //获取heatmap的地址
    dev.getheatmapUrl = function (o) {
        var url = o.WFS + "?service=wfs&request=GetFeature&typename=" + o.TypeName + "&srsname=" + o.SrsName + "&outputFormat=" + o.OutputFormat + "&version=" + o.Version;
        if (!dev.IsNull(o.CqlFilter)) {
            o.CqlFilter = o.CqlFilter.replace(/and\s*1=1|AND\s*1=1|1=1\s*AND|1=1\s*and|1=1\s*OR|1=1\s*or|1=1\s*/, "");
            if (!Dev.IsNull(o.CqlFilter) && o.CqlFilter.length > 0) url += "&cql_filter=" + encodeURI(o.CqlFilter.trim());
        }
        return url;
    }
}
)(jQuery);
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
    dev.UCMapTip = function (param) {
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
        this.Target = new dev.Overlay({
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
        $.extend(dev.UCMapTip.prototype, this.Target);
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
        //   $(".panel-header", this.popup).css("background-color", "red");
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
    $.fn.extend(dev.UCMapTip.prototype, {
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

//悬浮框控件
(function () {
    dev.floatPanel = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        opt.Width = dev.IsNull(opt.Width) ? 240 : opt.Width;
        opt.Height = dev.IsNull(opt.Height) ? 400 : opt.Height;
        this.Title = dev.IsNull(opt.Title) ? "悬浮框" : opt.Title;
        this.Parent = dev.IsNull(opt.Parent) ? dev.App.MapPanel.MapDOM : opt.Parent;
        this.IsDock = dev.IsBoolean(opt.IsDock) ? opt.IsDock : opt.IsDock != "false";
        this.Draggable = dev.IsBoolean(opt.Draggable) ? opt.Draggable : opt.Draggable === "true",//定义窗口是否可拖拽
            opt.Target = $('<div class="floatPanel" style="width:' + opt.Width + 'px;height:' + opt.Height + 'px;cursor:default"></div>');
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
                //$this.zIndex = $this.Target.css("z-index");
                $(".xzqpositionpanel", dev.App.Map.MapDOM).css("z-index", 10);
                $this.Target.css("z-index", 1000);
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
                else $this.Parent.bind("mouseup", HeaderMouseUp).bind("mousemove", HeaderMouseMove);
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
                else if (top + $this.Target.outerHeight() > $this.Parent.outerHeight()) {
                    top = $this.Parent.outerHeight() - $this.Target.outerHeight();
                    if (top < 0) top = 0;
                }
                if (left < 0) left = 0;
                else if (left + $this.Target.outerWidth() > $this.Parent.outerWidth()) {
                    left = $this.Parent.outerWidth() - $this.Target.outerWidth();
                    if (left < 0) left = 0;
                }
                $this.Win.css({ top: ($this.Top = top) + "px", left: ($this.Left = left) + "px" });
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

//WMS聚合显示
/*地图WMS聚合显示*/
(function ($) {
    var $this;
    var currentResolution, maxFeatureCount;

    function getUrl(o) {
        var url = $this.WFS + "?service=wfs&request=GetFeature&typename=" + o.TypeName + "&srsname=" + o.SrsName + "&outputFormat=" + o.OutputFormat + "&version=" + o.Version;
        if (!dev.IsNull($this.CqlFilter)) {
            o.CqlFilter = o.CqlFilter.replace(/and\s*1=1|AND\s*1=1|1=1\s*AND|1=1\s*and|1=1\s*OR|1=1\s*or|1=1\s*/, "");
            if (!dev.IsNull(o.CqlFilter) && o.CqlFilter.length > 0) url += "&cql_filter=" + encodeURI(o.CqlFilter.trim());
        }
        return url;
    }

    function calculateClusterInfo(resolution) {
        maxFeatureCount = 0;
        var currlayer = dev.MapUtils.GetLayer($this.ID);
        if (dev.IsNull(currlayer)) return;
        var features = currlayer.getSource().getFeatures();
        var feature, radius;
        for (var i = features.length - 1; i >= 0; i--) {
            feature = features[i];
            var originalFeatures = feature.get('features');
            var extent = dev.extent.createEmpty();
            for (var j = 0; j < originalFeatures.length; j++) dev.extent.extend(extent, originalFeatures[j].getGeometry().getExtent());
            maxFeatureCount = Math.max(maxFeatureCount, originalFeatures.length);
            feature.set('radius', $this.GroupRadius);
        }
    }

    function styleFunction(feature, resolution) {
        if (resolution != currentResolution) {
            calculateClusterInfo(resolution);
            currentResolution = resolution;
        }
        var style;
        var size = feature.get("features").length;
        if (size > 1) {
            style = new dev.style.Style({
                image: (dev.IsNull($this.DefaultImgStyle) ? (new dev.style.RegularShape({
                    fill: new dev.style.Fill({ color: [255, 153, 0, Math.min(0.8, 0.4 + (size / maxFeatureCount))] }),
                    stroke: new dev.style.Stroke({ color: 'rgba(255, 204, 0, 0.2)', width: 1 }),
                    radius: feature.get('radius'),
                    points: 4
                })) : $this.DefaultImgStyle),
                text: (dev.IsNull($this.DefaultTxtStyle) ? (new dev.style.Text({
                    text: size.toString(),
                    fill: new dev.style.Fill({ color: "#fff" }),
                    stroke: new dev.style.Stroke({ color: 'rgba(0, 0, 0, 0.6)', width: 3 })
                })) : $this.DefaultTxtStyle)
            });
        }
        else {
            var originalFeature = feature.get('features')[0];
            // style = dev.IsNull($this.DefaultSubStyle) ? dev.GetStyleByType(originalFeature.getProperties().TYPE) : $this.DefaultSubStyle;
        }
        return style;
    }

    dev.groupwms = function (args) {
        if (dev.IsNull(args)) args = {};
        currentResolution = undefined;
        maxFeatureCount = undefined;
        if (dev.IsNull(args.Map)) args.Map = dev.App.Map;
        if (dev.IsNull(args.WFS) || dev.IsNull(args.TypeName)) return;
        this.WFS = args.WFS;
        this.TypeName = args.TypeName;
        this.SrsName = dev.IsNull(args.SrsName) ? "EPSG:4326" : args.SrsName;
        this.OutputFormat = dev.IsNull(args.OutputFormat) ? "json" : args.OutputFormat;
        this.Version = dev.IsNull(args.Version) ? "2.0.0" : args.Version;
        this.CqlFilter = args.CqlFilter;
        this.ID = dev.IsNull(args.ID) ? ("groupLayer" + new Date().getTime()) : args.ID;
        this.GroupRadius = dev.IsNumber(args.GroupRadius) ? args.GroupRadius : 15;
        this.DefaultImgStyle = args.DefaultImgStyle;
        this.DefaultTxtStyle = args.DefaultTxtStyle;
        this.DefaultSubStyle = args.DefaultSubStyle;
        $this = this;
        var vector = new dev.layer.Vector({
            id: this.ID,
            source: new dev.source.Cluster({
                distance: 100,
                source: new dev.source.Vector({
                    url: getUrl($this),
                    format: new dev.format.GeoJSON({
                        extractStyles: false
                    })
                })
            }),
            style: styleFunction,
            zIndex: 0
        });
        var currl = dev.MapUtils.GetLayer(this.ID);
        if (!dev.IsNull(currl)) dev.App.Map.removeLayer(currl);
        dev.App.Map.addLayer(vector);
    }
})(jQuery);

//导出地图div
/*dev.UCMapExport*/
(function ($) {
    function layer(data) {
        //添加图层
        if (!dev.IsNull(data.selectlayerinfo)) {
            var selectlayerinfo = data.selectlayerinfo;
            //添加图层
            var param = {
                Map: data.tempmap,
                ID: selectlayerinfo.ID,
                Url: dev.GetSystemUrlByRelID(selectlayerinfo.Url),
                Layers: selectlayerinfo.TypeName,
                ServerType: selectlayerinfo.ServerType,
                EPSG: dev.App.Config.SystemMap.DisplayEPSG
            };
            var temp_filter = "";
            if (!dev.IsNull(selectlayerinfo.Filter)) temp_filter = selectlayerinfo.Filter;
            if (!dev.IsNull(selectlayerinfo.SldLegend)) {
                if (dev.IsNull(selectlayerinfo.SldLegend.length)) selectlayerinfo.SldLegend = [selectlayerinfo.SldLegend];
                param.Sldbody = dev.GetSLDString(selectlayerinfo.TypeName, dev.LegendToRule(selectlayerinfo.SldLegend));
            }
            if (!dev.IsNull(selectlayerinfo.Envelop)) {
                var arry = selectlayerinfo.Envelop.split(',');
                param.Extent = [parseFloat(arry[0]), parseFloat(arry[1]), parseFloat(arry[2]), parseFloat(arry[3])];
            }
            var currlayer = dev.MapLoad.AddWMSLayer(param);
            data.tempmap.getView().fit(param.Extent, data.tempmap.getSize());
            currlayer.one("onWMSLayerLoaded", function () {
                data.Target.triggerHandler("ExportLayerLoaded");
            });
            var mapproj = data.tempmap.getView().getProjection();
            var extent = param.Extent;
            if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) extent = dev.proj.transformExtent(extent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
            data.tempmap.getView().fit(extent, data.tempmap.getSize());
        }
    };
    function addlegend(mapdiv, selectlayerinfo) {
        //添加图例
        legendcontrol = new dev.UCLegend({ Parent: mapdiv[0] });
        legendcontrol.Layout();
        legendcontrol.SetVisible(true);
        legendcontrol.SetData(selectlayerinfo.SldLegend.clone());
        return legendcontrol;
    };
    dev.UCMapExport = function (opt) {
        this.Width = dev.IsNull(opt.width) ? "600px" : opt.width;
        this.Height = dev.IsNull(opt.height) ? "500px" : opt.height;
        this.mapdiv = this.Target = $('<div style="height:' + this.Height + ';width:' + this.Width + ';position:absolute;left:0px;top:0px;background-color:#fff;"></div>').appendTo(dev.App.FillPanel.Target);
        this.selectlayerinfo = opt.selectlayer;
        this.legendcontrol = null;
        var initconfig = dev.App.Config.SystemMap;
        var resolutions;
        if (!dev.IsNull(initconfig.LevelInfo) && !dev.IsNull(initconfig.LevelInfo.IsVisibleLevel) && initconfig.LevelInfo.IsVisibleLevel == "true") {
            resolutions = [];
            for (var i = 0; i < initconfig.LevelInfo.Levels.length; i++) {
                if (dev.App.Config.SystemMap.DisplayEPSG == dev.App.Config.SystemMap.DataEPSG) resolutions.push(parseFloat(initconfig.LevelInfo.Levels[i].Resolution));
                else resolutions.push(parseFloat(initconfig.LevelInfo.Levels[i].Resolution3857));
            }
        }
        var view = new dev.View({
            projection: dev.App.Config.SystemMap.DisplayEPSG,
            resolutions: resolutions,
            minZoom: 1,
            maxResolution: resolutions[resolutions.length - 1],
            maxZoom: 20,
            minResolution: resolutions[0],
        });
        this.tempmap = new dev.Map({
            controls: new dev.control.defaults({ zoom: false, rotate: false, attribution: false }),
            interactions: dev.interaction.defaults().extend([new dev.interaction.DragRotateAndZoom()]),
            target: this.mapdiv[0],
            logo: false,
            view: view
        });
        //添加比例尺
        dev.App.InitScaleLine(this.tempmap);
        $.extend(dev.UCMapExport.prototype, this);
    };
    $.fn.extend(dev.UCMapExport.prototype, {
        SetHeight: function (height) {
            if (dev.IsNull(height) || !dev.IsNumber(height)) return;
            this.mapdiv.css({ "height": height });
        },
        SetWidth: function (width) {
            if (dev.IsNull(width) || !dev.IsNumber(width)) return;
            this.mapdiv.css({ "width": width });
        },
        Cleartempmap: function () { //移除
            this.mapdiv.remove();
            this.mapdiv = null;
        },
        Setlayer: function (selectlayerinfo) {
            this.selectlayerinfo = selectlayerinfo;
            layer(this);
        },
        Setlegend: function () {
            if (dev.IsNull(this.legendcontrol))
                this.legendcontrol = addlegend(this.mapdiv, this.selectlayerinfo);
        },
        Clearleg: function () {
            if (!dev.IsNull(this.legendcontrol))
                this.legendcontrol.Target.remove();
        },
        ClearLayers: function () {
            var layers = this.tempmap.getLayers();
            layers.forEach(function (sublayer, i) {
                layers.removeAt(i);
            });
        }
    });
})(jQuery);

/*添加三维专题图层*/
(function ($) {
    var layertreeInfo, tree_control, box;
    var defualtchecklist = [];
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

    dev.initThreeDTreeLayer = function () {
        if (dev.IsNull(dev.App.tree3ddata))
            return;
        layertreeInfo = dev.App.tree3ddata;
        defualtchecklist = [];
        convertdata();
        var parent = $('.Content', $('#topicPanel', dev.App.MapPanel.MapDOM3D));
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
                    //return;
                }
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
                var currdata = dev.QueryXZQ(o.$this.CountyCode, "county");
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
    };
    function locationbyselect(selectnode) {
        var envelop = selectnode.Envelop;
        if (dev.IsNull(envelop)) return;
        var envelarry = envelop.split(',');
        if (envelarry.length < 4 || isNaN(envelarry[0]) || isNaN(envelarry[1]) || isNaN(envelarry[2]) || isNaN(envelarry[3])) return;
        dev.App.Map.getView().centerOn([((parseFloat(envelarry[0]) + parseFloat(envelarry[2])) / 2), ((parseFloat(envelarry[1]) + parseFloat(envelarry[3])) / 2)], dev.App.Map.getSize(), [dev.App.Map.getSize()[0] / 2, dev.App.Map.getSize()[1] / 2]);
        if (!dev.IsNull(selectnode.Zoom) && parseFloat(selectnode.Zoom) > 0) dev.App.Map.getView().setZoom(parseFloat(selectnode.Zoom));
        dev.Map3DUtils.SetView([parseFloat(envelarry[0]), parseFloat(envelarry[1])], [parseFloat(envelarry[2]), parseFloat(envelarry[3])]);
        if (dev.IsNull(selectnode.CountyCode)) return;
        var currdata = dev.QueryXZQ(selectnode.CountyCode, "county");
        if (dev.IsNull(currdata) || dev.IsNull(currdata.cdata) || currdata.cdata.length == 0) return;
        $(".selecttext", $(".xzqposition", dev.App.MapPanel.MapDOM)).html(currdata.cdata[0].getProperties()[currdata.xzqtype.toUpperCase()]);
        $(".selecttext", $(".xzqposition", dev.App.MapPanel.MapDOM)).attr("tag", currdata.cdata[0].getProperties().ADCODE);
    }
})(jQuery);
