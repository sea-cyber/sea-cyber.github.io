/*App(应用程序)*/
(function ($) {
    try { dev = ol; }
    catch (e) { dev = {}; }
    function GetWinIndex(id) {
        for (var i = 0; i < dev.App.PopBoxs.length; i++) {
            if (dev.App.PopBoxs[i].ID === id) return i;
        }
        return -1;
    };
    function GetRootPath() {
        var pathName = window.document.location.pathname;
        var localhost = window.location.host;
        var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
        return ("http://" + localhost + projectName + "/");
    }
    dev.App = {
        Map: null,
        User: null,
        TabPanel: null,
        FillPanel: null,
        CenterPanel: null,
        MapPanel: null,
        MapTool: null,
        PopBoxs: [],
        EventObject: null
    };
    dev.App.Init = function () {
        if (dev.IsNull(this.Config)) {
            var config = null;
            $.ajax({
                url: "config/app.xml",
                dataType: 'xml',
                type: 'GET',
                cache: false,
                timeout: 2000,
                async: false,
                error: function (xml) {
                    alert("加载系统配置文件出错！");
                },
                success: function (xml) {
                    config = $.xml2json(xml);
                }
            });
            this.Config = config;
        }
        this.Layout();
    };
    //初始化布局
    dev.App.Layout = function () {
        dev.NoDrag();
        this.WidgetParent, this.WidgetClear, this.WidgetParam, this.IsWidget = true;
        this.EventObject = $(dev);
        var layoutConfig = this.Config.SystemLayout;
        this.TempStyle = dev.CreateTempStyle();
        this.Root = GetRootPath();
        if (!dev.IsNull(dev.App.XmlType)) {
            var systhemes;
            if (!dev.IsNull(this.Config.SystemTheme) && dev.IsNull(this.Config.SystemTheme.length)) systhemes = [dev.ObjClone(this.Config.SystemTheme)];
            else systhemes = this.Config.SystemTheme.clone();
            var neesysplugin = Enumerable.From(systhemes).Where('s=>s.Type=="' + dev.App.XmlType + '"').FirstOrDefault();
            if (!dev.IsNull(neesysplugin) && !dev.IsNull(neesysplugin.TitleImage)) layoutConfig.TopPanel.LeftImage = neesysplugin.TitleImage;
        }
        this.TopPanel = new dev.TopPanel(layoutConfig.TopPanel);
        this.TopPanel.Target.appendTo(document.body);
        this.NavPanel = new dev.NavPanel(layoutConfig.NavPanel);
        this.NavPanel.Target.appendTo(document.body);
        this.FootPanel = new dev.FootPanel(layoutConfig.FootPanel);
        this.FootPanel.Target.appendTo(document.body);
        this.MainPanel = new dev.MainPanel(layoutConfig.MainPanel);
        this.MainPanel.Target.appendTo(document.body);
        this.MainPanel.Layout();
        this.CenterPanel = this.MainPanel.CenterPanel;
        this.MapPanel = this.CenterPanel.MapPanel;
        this.FillPanel = new dev.FillPanel({ MainPanel: this.MainPanel });
        //this.TabPanel = new $.TabPanel(layoutConfig.TabPanel);
        //$(document.body).append(this.TabPanel);
        //this.TabPanel.Layout();
        for (var i = 0; i < dev.App.Config.SystemMap.LayerInfo.BaseLayers.length; i++) {
            if (dev.IsNull(dev.App.Config.SystemMap.LayerInfo.BaseLayers[i].Url)) continue;
            if (!dev.IsNull(dev.App.Config.SystemMap.LayerInfo.BaseLayers[i].Url3857)) dev.App.Config.SystemMap.LayerInfo.BaseLayers[i].Url3857 = dev.GetSystemUrlByRelID(dev.App.Config.SystemMap.LayerInfo.BaseLayers[i].Url3857);
            dev.App.Config.SystemMap.LayerInfo.BaseLayers[i].Url = dev.GetSystemUrlByRelID(dev.App.Config.SystemMap.LayerInfo.BaseLayers[i].Url);
        }
        this.InitMap();
        this.InitMapMenu();
        //dev.InitMapTool();
        this.InitNavigation();
        this.InitScaleLine();
        //  dev.App.InitOverviewMap();
        dev.App.InitMapSwitch();
        //系统集
        var systemTheme = dev.App.GetPermsByUser();
        this.MenuInit = new dev.MenuInit({ SystemTheme: systemTheme });
        // this.MenuInit = new dev.MenuInit({ SystemTheme: this.Config.SystemTheme });
        this.MenuInit.Init();
        this.MenuInit.Layout();
        this.MenuInit.Target.bind("onWidgetChanged", function () {
            dev.attrQueryClear();
        });
        //显示TopPanel左右滚动条
        this.TopPanel.ShowCenterBox();
        //加载三维页面
        //this.Init3DMap();
        dev.InitMap3D();
    };
    //系统集合 dev.cookie.perms
    dev.App.GetPermsByUser = function () {
        //根据类型获取对应的主题
        var currsystemtheme
        if (!dev.IsNull(this.Config.SystemTheme)) {
            var systhemes;
            if (!dev.IsNull(this.Config.SystemTheme) && dev.IsNull(this.Config.SystemTheme.length)) systhemes = [dev.ObjClone(this.Config.SystemTheme)];
            else systhemes = this.Config.SystemTheme.clone();
            if (dev.IsNull(dev.App.XmlType)) dev.App.XmlType = 0;
            currsystemtheme = Enumerable.From(systhemes).Where('s=>s.Type=="' + dev.App.XmlType + '"').FirstOrDefault();
        }
        var temp = currsystemtheme;
        var sysmenus = [], returnsubsys = [];
        if (dev.IsNull(temp.SubSystems)) return sysmenus;
        if (dev.IsNull(temp.SubSystems.length)) sysmenus = [dev.ObjClone(temp.SubSystems)];
        else sysmenus = temp.SubSystems.clone();
        for (var i = 0; i < sysmenus.length; i++) {
            var menuid = sysmenus[i].ID;
            var subsys = Enumerable.From(dev.cookie.perms).Where('s=>s.bpid=="' + menuid + '"').FirstOrDefault();
            if (dev.IsNull(subsys)) continue;
            subsys = sysmenus[i];
            //menus
            var tempmenus = [];
            var cmenus = subsys.Menus;
            if (dev.IsNull(cmenus)) { returnsubsys.push(subsys); continue; }
            if (dev.IsNull(cmenus.length)) cmenus = [cmenus];
            for (var j = 0; j < cmenus.length; j++) {
                var cm = Enumerable.From(dev.cookie.perms).Where('s=>s.bpid=="' + cmenus[j].ID + '"').FirstOrDefault();
                if (dev.IsNull(cm)) continue;
                cm = cmenus[j];
                if (dev.IsNull(cm.Widgets)) { tempmenus.push(cm); continue; }
                var tempplugins = [];
                if (dev.IsNull(cm.Widgets.length)) { cm.Widgets = [cm.Widgets]; }
                for (var n = 0; n < cm.Widgets.length; n++) {
                    var cw = Enumerable.From(dev.cookie.perms).Where('s=>s.bpid=="' + cm.Widgets[n].ID + '"').FirstOrDefault();
                    if (dev.IsNull(cw)) continue;
                    tempplugins.push(cm.Widgets[n]);
                }
                cm.Widgets = tempplugins;
                //var tempplugins = [];
                //var cplugins=cm.
                //Widgets
                tempmenus.push(cm);
            }
            subsys.Menus = tempmenus;
            returnsubsys.push(subsys);
        }
        temp.SubSystems = returnsubsys;
        return temp;
    }
    //窗口大小变化刷新布局
    dev.App.Resize = function () {
        this.MainPanel.Layout();
        this.MenuInit.Layout();
    };
    //初始化地图工具
    dev.App.InitMapTool = function () {
        var align = this.Config.SystemMap.ToolInfo.Align;
        var parent = align == "Left" ? this.MapToolPanel.LeftBox : align == "Right"
             ? this.MapToolPanel.RightBox : this.MapToolPanel.CenterBox;
        var param = $.extend({
            Map: this.Map,
            Parent: parent
        }, this.Config.SystemMap.ToolInfo);
        this.MapTool = new dev.UCMapTool(param);
        dev.App.MapTool = this.MapTool;
    };
    //初始化地图
    dev.App.InitMap = function () {
        var config = this.Config.SystemMap;
        dev.App.Map = new dev.Map({
            controls: new dev.control.defaults({ zoom: false, rotate: false, attribution: false }),
            interactions: dev.interaction.defaults().extend([new dev.interaction.DragRotateAndZoom()]),
            target: this.MapPanel.MapDOM[0],
            logo: false
        });

        var resolutions;
        if (!dev.IsNull(config.LevelInfo) && !dev.IsNull(config.LevelInfo.IsVisibleLevel)
            && config.LevelInfo.IsVisibleLevel == "true") {
            resolutions = [];
            if (dev.IsNull(config.DisplayEPSG)) config.DisplayEPSG = "EPSG:4326";
            for (var i = 0; i < config.LevelInfo.Levels.length; i++)
                if (dev.IsNull(config.DisplayEPSG) || config.DisplayEPSG == "EPSG:4326") resolutions.push(parseFloat(config.LevelInfo.Levels[i].Resolution));
                else resolutions.push(parseFloat(config.LevelInfo.Levels[i].Resolution3857));
        }
        var minZoom = parseInt(config.LevelInfo.MinZoom);
        var proj = dev.proj.get(dev.App.Config.SystemMap.DisplayEPSG);
        dev.App.Map.setView(new dev.View({
            projection: proj,
            resolutions: resolutions,
            minZoom: minZoom,
            minResolution: resolutions[resolutions.length - 1],
            maxZoom: resolutions.length + minZoom - 1,
            maxResolution: resolutions[0]
        }));
        dev.MapLoad.InitMap($.extend({ Map: dev.App.Map }, config));
        var initExtent = [parseFloat(config.Extent.XMin), parseFloat(config.Extent.YMin), parseFloat(config.Extent.XMax), parseFloat(config.Extent.YMax)];
        if (dev.App.Config.SystemMap.DataEPSG != dev.App.Config.SystemMap.DisplayEPSG) initExtent = dev.proj.transformExtent(initExtent, dev.App.Config.SystemMap.DataEPSG, dev.App.Config.SystemMap.DisplayEPSG);
        dev.App.Map.getView().fit(initExtent, dev.App.Map.getSize());
        dev.App.Map.getView().setZoom(parseInt(config.Zoom));

        //地图鼠标移入事件
        dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "image/hands.cur),auto");
        dev.App.Map.on('pointermove', function (evt) {
            if (dev.measureState || dev.drawstate || dev.queryState || dev.finestate || dev.position) return;
            var normalcur = "url(" + dev.App.Root + "image/hands.cur),auto";
            if (isdrag) normalcur = 'url(' + dev.App.Root + 'image/handm.cur),auto'
            dev.App.Map.getTargetElement().style.cursor = dev.App.Map.hasFeatureAtPixel(evt.pixel) ? 'pointer' : normalcur;
        });
        //点击事件
        var isdrag = false;
        dev.App.Map.on('pointerdrag', function (evt) {
            if (dev.measureState || dev.drawstate || dev.queryState || dev.finestate || dev.position) return;
            isdrag = true;
            dev.App.MapPanel.MapDOM.css("cursor", 'url(' + dev.App.Root + 'image/handm.cur),auto');
        });
        dev.App.Map.on("moveend", function () {
            if (dev.measureState || dev.drawstate || dev.queryState || dev.finestate || dev.position) return;
            isdrag = false;
            dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "image/hands.cur),auto");
        });
        dev.App.defaultAngle = dev.App.Map.getView().getRotation();
    };
    //初始化地图指北针
    dev.App.InitNavigation = function () {
        var param = $.extend({
            Map: dev.App.Map,
            Parent: dev.App.MapPanel.MapDOM,
        }, this.Config.SystemMap.LevelInfo);
        this.Navigation = new $.UCNavigation(param);
    };
    //初始化比例尺
    dev.App.InitScaleLine = function (currmap) {
        if (dev.IsNull(currmap)) currmap = dev.App.Map;
        var scaleLine = new dev.control.ScaleLine();
        $(scaleLine.element).bind("mouseover", function () { $(this).css("opacity", 1); });
        $(scaleLine.element).bind("mouseout", function () { $(this).css("opacity", 0.5); });
        this.Map.on('postrender', function (evt) {
            scaleLine.render(evt);
            var text = $(":first", scaleLine.element);
            text.html(text.html().replace("mm", "毫米").
                replace("km", "千米").replace("m", "米"));
        });
        currmap.addControl(scaleLine);
    };
    //初始化鹰眼地图
    dev.App.InitOverviewMap = function () {
        var oMap = new dev.control.OverviewMap({
            collapsed: true,
            view: new dev.View({ projection: this.Map.getView().getProjection() })
        });
        dev.App.Map.addControl(oMap);
    }
    //初始化地图菜单
    dev.App.InitMapMenu = function () {
        var param = $.extend({
            Map: this.Map,
            LinkDOM: this.MapPanel.Target
        }, this.Config.SystemMap.RightMenuInfo);
        this.MapMeun = new dev.UCMapMenu(param);
        this.MapMeun.bind("onItemClick", function (s, d) {
            //alert(d.id);
            switch (d.id) {
                case "zoomin"://放大
                    var zoom = dev.App.Map.getView().getZoom();
                    dev.App.Map.getView().setZoom(zoom + 1);
                    dev.App.Map.getView().setCenter(dev.App.Map.getView().getCenter());
                    var size = dev.App.Map.getSize();
                    if (size[0] == 0 || size[1] == 0) size = [dev.App.MapPanel.MapDOM.width(), dev.App.MapPanel.MapDOM.height()];
                    var ex = dev.App.Map.getView().calculateExtent(size);
                    if (dev.IsNull(ex) || isNaN(ex[0]) || isNaN(ex[1]) || isNaN(ex[2]) || isNaN(ex[3])) return;
                    dev.Map3DUtils.SetView([ex[0], ex[1]], [ex[2], ex[3]]);
                    break;
                case "zoomout"://缩小
                    //dev.Zoom("OUT");
                    var zoom = dev.App.Map.getView().getZoom();
                    dev.App.Map.getView().setZoom(zoom - 1);
                    var size = dev.App.Map.getSize();
                    if (size[0] == 0 || size[1] == 0) size = [dev.App.MapPanel.MapDOM.width(), dev.App.MapPanel.MapDOM.height()];
                    var ex = dev.App.Map.getView().calculateExtent(size);
                    if (dev.IsNull(ex) || isNaN(ex[0]) || isNaN(ex[1]) || isNaN(ex[2]) || isNaN(ex[3])) return;
                    dev.Map3DUtils.SetView([ex[0], ex[1]], [ex[2], ex[3]]);
                    break;
                case "globe"://全图
                    var configExtent = dev.App.Config.SystemMap.Extent;
                    dev.App.Map3D
                    var initExtent = [parseFloat(configExtent.XMin), parseFloat(configExtent.YMin), parseFloat(configExtent.XMax), parseFloat(configExtent.YMax)];
                    var size = dev.App.Map.getSize();
                    if (size[0] == 0 || size[1] == 0) size = [dev.App.MapPanel.MapDOM.width(), dev.App.MapPanel.MapDOM.height()];
                    var mapproj = dev.App.Map.getView().getProjection();
                    if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) initExtent = ol.proj.transformExtent(initExtent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
                    dev.App.Map.getView().fit(initExtent, size);
                    if (!dev.IsNull(dev.App.Map3D)) dev.Map3DUtils.SetView([initExtent[0], initExtent[1]], [initExtent[2], initExtent[3]]);
                    break;
                case "pan"://漫游
                    //  dev.Clear();
                    break;
                case "print"://打印
                    //var et = new dev.ExportMap();
                    //et.exportMap(dev);
                    //dev.App.MapPanel.MapDOM.jqprint();
                    var width = dev.App.MapPanel.MapDOM.width();
                    var height = dev.App.MapPanel.MapDOM.height();
                    var width3d = dev.App.MapPanel.MapDOM3D.width();
                    var canvas = dev.App.MapPanel.MapDOM;
                    var canvas3d = dev.App.MapPanel.MapDOM3D;
                    if (!dev.IsNull(dev.App.TopPanel)) {
                        var topht = dev.App.TopPanel.Height;
                        var bottoht = dev.App.BottomPanel.Height;
                        var leftw = dev.App.LeftPanel.Width;
                        var visb = dev.App.BottomPanel.Visible;
                        var visl = dev.App.LeftPanel.Visible;
                        dev.App.BottomPanel.SetVisible(false);
                        dev.App.LeftPanel.SetVisible(false);
                        if (dev.App.MapPanel.MapDOM.css('display') == "block" && dev.App.MapPanel.MapDOM3D.css('display') == "none") {
                            var imagmap = $('<div id="mapimg" style="left: 0px; top: 0px; position: absolute;width:' + (width + leftw) + 'px;height:' + (height + topht + bottoht) + 'px;z-index:99"></div>').appendTo($(dev.App.FillPanel.Target[0].parentElement.parentElement));
                            imagmap.html(canvas[0].children[0]);
                            dev.App.Map.updateSize();
                            setTimeout(function () {
                                window.print();
                                canvas.prepend(imagmap[0].children);
                                imagmap.remove();
                                dev.App.BottomPanel.SetVisible(visb);
                                dev.App.LeftPanel.SetVisible(visl);
                            }, 600);

                        }
                        else if (dev.App.MapPanel.MapDOM.css('display') == "none" && dev.App.MapPanel.MapDOM3D.css('display') == "block") {
                            var imagmap = $('<div id="mapimg" style="left: 0px; top: 0px; position: absolute;width:' + (width3d + leftw) + 'px;height:' + (height + topht + bottoht) + 'px;z-index:99"></div>').appendTo($(dev.App.FillPanel.Target[0].parentElement.parentElement));
                            imagmap.html(canvas3d[0].children[0]);
                            dev.App.Map.updateSize();
                            setTimeout(function () {
                                window.print();
                                canvas3d.prepend(imagmap[0].children);
                                imagmap.remove();
                                dev.App.BottomPanel.SetVisible(visb);
                                dev.App.LeftPanel.SetVisible(visl);
                            }, 600);
                        }
                        else if (dev.App.MapPanel.MapDOM.css('display') == "block" && dev.App.MapPanel.MapDOM3D.css('display') == "block") {
                            var imagmap = $('<div id="mapimg" style="left: 0px; top: 0px; position: absolute;width:' + (width + width3d + leftw) + 'px;height:' + (height + topht + bottoht) + 'px;z-index:99"></div>').appendTo($(dev.App.FillPanel.Target[0].parentElement.parentElement));
                            $(canvas[0].children[0]).css({ "width": "50%", "float": "left" });
                            $(canvas3d[0].children[0]).css({ "width": "50%" });
                            imagmap.append(canvas[0].children[0]);
                            imagmap.append(canvas3d[0].children[0]);
                            setTimeout(function () {
                                window.print();
                                canvas.prepend(imagmap[0].children[0]);
                                canvas3d.prepend(imagmap[0].children);
                                $(canvas[0].children[0]).css({ "width": "100%", "float": "none" });
                                $(canvas3d[0].children[0]).css({ "width": "100%" });
                                imagmap.remove();
                                dev.App.BottomPanel.SetVisible(visb);
                                dev.App.LeftPanel.SetVisible(visl);
                            }, 800);
                        }
                    }
                    else {
                        var win = new dev.Window({
                            ID: "printPreview",
                            IconCls: 'icon-statgraph',
                            Title: "打印预览",
                            Width: dev.App.MapPanel.width() - 1,
                            Height: height,
                            BgColor: "#37424F",
                            Modal: false,
                            IsDestroy: true,
                            Parent: dev.App.MapPanel.Target,
                            //Left: dev.App.MapPanel.MapDOM.offset().left,
                            //Top: dev.App.MapPanel.MapDOM.offset().top,
                            Maximizable: false,
                            Draggable: false,
                            Resizable: true,
                            Url: dev.App.Root + "html/printMap.html"
                        });
                        //$(win.Target[0].parentElement).css({ "position": "relative" });
                    }
                    //dev.App.Map.once('postcompose', function (event) {
                    //    //var canvas = event.context.canvas;
                    //    //ctx = canvas.getContext("2d"), //对应的CanvasRenderingContext2D对象(画笔)
                    //    //img = new Image(),//创建新的图片对象
                    //    //base64 = '';//base64 
                    //    //img.src = 'http://www.xxxx.png';
                    //    //img.setAttribute("crossOrigin", 'Anonymous');
                    //    //ctx.drawImage(img, 0, 0);
                    //    //base64 = canvas.toDataURL("image/png");
                    //    //img.onload = function () {//图片加载完，再draw 和 toDataURL
                    //    //    ctx.drawImage(img, 0, 0);
                    //    //    base64 = canvas.toDataURL("image/png");
                    //    //};
                    //    //var data = canvas.toDataURL('image/png');
                    //    //if (navigator.msSaveBlob) {
                    //    //    navigator.msSaveBlob(canvas.msToBlob(), 'map.png');
                    //    //} else {
                    //    //    canvas.toBlob(function (blob) {
                    //    //        saveAs(blob, 'map.png');
                    //    //    });
                    //    //}
                    //});
                    //dev.App.Map.renderSync();
                    break;
                case "clear"://地图清除
                    dev.MapUtils.ClearFeature("tempMeasureLayer");
                    dev.MeasureClear();
                    dev.Clear();
                    dev.measureState = false;
                    dev.queryState = false;
                    if (!dev.IsNull(dev.App.globalquery)) dev.App.globalquery.Clear();
                    dev.App.EventObject.triggerHandler("RightMapClear");
                    dev.measure3D.clear();
                    break;
            }
        });
    };
    //初始化地图切换
    dev.App.InitMapSwitch = function () {
        if (dev.IsNull(this.Config.SystemMap.MapSwitchInfo) || this.Config.SystemMap.MapSwitchInfo.length == 0) return;
        var param = $.extend({
            Parent: dev.App.MapPanel.Target
        }, this.Config.SystemMap.MapSwitchInfo);
        this.MapSwitch = new dev.UCMapSwitch(param);
    };
    //获取窗体
    dev.App.GetWindow = function (id) {
        var index = GetWinIndex(id)
        return dev.App.PopBoxs[index];
    };
    //清楚上一个插件
    dev.App.ClearPreWidget = function () {
        if (dev.IsNull(this.WidgetParent) || dev.IsNull(this.WidgetClear)) return;
        if (this.WidgetParam === dev.WidgetLayout.FloatHTML) {
            this.WidgetParent.frame.triggerHandler("onClosing");
            this.WidgetParent.frame.remove();
        }
        else this.WidgetParent[this.WidgetClear](this.WidgetParam);
        if (!this.IsWidget) { this.MenuInit.currentParent = null; this.MenuInit.currentItem = null; }
        this.WidgetParent = null; this.WidgetClear = null; this.WidgetParam = null; this.IsWidget = true;
    };
    //初始化三维页面
    dev.App.Init3DMap = function () {
        if (dev.IsNull(this.Config.SystemLayout.RightPanel.Widgets) || dev.IsNull(this.Config.SystemLayout.RightPanel.Widgets.DockStyle) || dev.IsNull(this.Config.SystemLayout.RightPanel.Widgets.Url)) return;
        //dev.MenuInit.prototype.WidgetLoad(this.Config.SystemLayout.RightPanel.Widgets, null);
        var item = this.Config.SystemLayout.RightPanel.Widgets;
        dev.App.RightPanel.Add(item.Url, item.Parameters, item.ID);
    };
})(jQuery);
//Control
(function ($) {
    dev.Control = function (opt) {
        this.Target = $(opt.Target);
        if (dev.IsNull(opt.ID)) opt.ID = opt.Target.attr("id");
        this.ID = dev.IsNull(opt.ID) ? "c" + new Date().getTime() : opt.ID;
        this.Target.prop("id", this.ID);
        this.Width = dev.IsNumber(opt.Width) ? opt.Width : parseInt(opt.Width);
        this.Height = dev.IsNumber(opt.Height) ? opt.Height : parseInt(opt.Height);
        if (!dev.IsNull(opt.CSS)) this.Target.css(opt.CSS);
        this.Visible = dev.IsBoolean(opt.Visible) ? opt.Visible : opt.Visible !== "false";
        this.Target.css("display", this.Visible ? "block" : "none");
    };
    $.fn.extend(dev.Control.prototype, {
        GetActualWidth: function () {
            if (!this.Visible || this.Target == null) return 0;
            return this.Target.outerWidth();
        },
        GetActualHeight: function () {
            if (!this.Visible || this.Target == null) return 0;
            return this.Target.outerHeight();
        },
        GetActualSize: function () {
            return {
                Width: this.GetActualWidth(),
                Height: this.GetActualHeight()
            };
        },
        outerWidth: function () {
            return this.Target.outerWidth();
        },
        outerHeight: function () {
            return this.Target.outerHeight();
        },
        SetWidth: function (width) {
            if (!dev.IsNumber(width)) return;
            this.Target.css('width', this.Width = width);
            this.Target.trigger("onResize");//大小变化事件
        },
        SetHeight: function (height) {
            if (!dev.IsNumber(height)) return;
            this.Target.css('height', this.Height = height);
            this.Target.trigger("onResize");//大小变化事件
        },
        SetSize: function (size) {
            if (!dev.IsNumber(size.Width) || !dev.IsNumber(size.Height)) return;
            this.Target.css('width', this.Width = size.Width);
            this.Target.css('height', this.Height = size.Height);
            this.Target.trigger("onResize");//大小变化事件
        },
        SetVisible: function (visible) {
            if (!dev.IsBoolean(visible) || this.Visible == visible) return;
            this.Target.css('display', (this.Visible = visible) ? 'block' : 'none');
            this.Target.trigger("onVisible");//大小变化事件
        },
        SetCSS: function (css) {
            if (!dev.IsNull(css)) this.Target.css(css);
        },
        GetBorder: function (el) { return dev.GetBorder(el); },
        GetPadding: function (el) { return dev.GetPadding(el); },
        bind: function () {
            this.Target.bind(arguments[0], arguments[1], arguments[2]);
        },
        unbind: function (eventName) { this.Target.unbind(eventName); }
    });
})(jQuery);
//Panel
(function ($) {
    dev.Panel = function (opt) {
        $.extend(this, new dev.Control(opt));
        this.Target = opt.Target;
        this.Border = opt.Border;
        this.BorderTop = opt.BorderTop;
        this.BorderRight = opt.BorderRight;
        this.BorderBottom = opt.BorderBottom;
        this.BorderLeft = opt.BorderLeft;
        this.HasBorder = dev.IsBoolean(opt.HasBorder) ? opt.HasBorder : opt.HasBorder == "true";
        this.TargetName = opt.TargetName;
        this.SplitClass = opt.SplitClass;
        this.Split = dev.IsBoolean(opt.Split) ? opt.Split : opt.Split == "true";
        this.MinWidth = dev.IsNumber(opt.MinWidth) ? opt.MinWidth : parseInt(opt.MinWidth);
        this.MinHeight = dev.IsNumber(opt.MinHeight) ? opt.MinHeight : parseInt(opt.MinHeight);
        this.Resizable = dev.IsBoolean(opt.Resizable) ? opt.Resizable : opt.Resizable == "true";
        this.Region = dev.IsNull(opt.Region) ? "NONE" : opt.Region;
        this.SplitElement = $("<div class='" + this.SplitClass + "'></div>").appendTo(this.Target);
        this.mt = $("<div class='Panel-MainTank'></div>").appendTo(this.Target);
        if (!this.HasBorder) this.mt.css("border", "0px");
        else {
            if (dev.IsString(this.Border)) this.mt.css("border", this.Border);
            if (dev.IsString(this.BorderTop)) this.mt.css("border-top", this.BorderTop);
            if (dev.IsString(this.BorderRight)) this.mt.css("border-right", this.BorderRight);
            if (dev.IsString(this.BorderBottom)) this.mt.css("border-bottom", this.BorderBottom);
            if (dev.IsString(this.BorderLeft)) this.mt.css("border-left", this.BorderLeft);
        }
    };
    $.fn.extend(dev.Panel.prototype, {
        DragResize: function (p) {
            var $this = this;
            var el = p.SplitElement[0];
            if (!this.Resizable) {
                p.SplitElement.css("cursor", "default");
                $(el).unbind("mousedown");
            }
            else {
                var x = y = 0, s = p.Target[0].style;
                var div = $("<div style='z-index:10;top:0px;left:0px;width:100%;height:100%;position:absolute;'></div>");
                function mouseDown(e) {
                    if (!$this.Resizable) { return; }
                    $(document.body).append(div);
                    switch (p.Region) {
                        case dev.Region.East: x = e.clientX + p.Target[0].offsetWidth; break;
                        case dev.Region.West: x = e.clientX - p.Target[0].offsetWidth; break;
                        case dev.Region.South: y = e.clientY + p.Target[0].offsetHeight; break;
                        case dev.Region.North: y = e.clientY - p.Target[0].offsetHeight; break;
                    }
                    if (el.setCapture) {
                        el.setCapture();
                        el.onmouseup = mouseUp;
                        el.onmousemove = function (ev) { mouseMove(ev || event); };
                    }
                    else $(document).bind("mousemove", mouseMove).bind("mouseup", mouseUp);
                    e.preventDefault();
                };
                function mouseMove(e) {
                    if (!$this.Resizable) return;
                    switch (p.Region) {
                        case dev.Region.East:
                            div.css("cursor", "e-resize");
                            var dx = x - e.clientX;
                            if (dx < p.MinWidth && p.Width == p.MinWidth) return;
                            var mw = $(window).width() - dev.App.LeftPanel.GetActualWidth();
                            if (dx > mw && p.Width == mw) return;
                            if (p.Width < p.MinWidth) p.Width = p.MinWidth;
                            else if (dx > mw) p.Width = mw;
                            else p.Width = dx;
                            s.width = p.Width + 'px';
                            break;
                        case dev.Region.West:
                            div.css("cursor", "e-resize");
                            var dx = e.clientX - x;
                            if (dx < p.MinWidth && p.Width == p.MinWidth) return;
                            var mw = $(window).width();
                            if (dx > mw && p.Width == mw) return;
                            if (p.Width < p.MinWidth) p.Width = p.MinWidth;
                            else if (dx > mw) p.Width = mw;
                            else p.Width = dx;
                            s.width = p.Width + 'px';
                            break;
                        case dev.Region.South:
                            div.css("cursor", "n-resize");
                            var dy = y - e.clientY;
                            if (dy < p.MinHeight && p.Height == p.MinHeight) return;
                            var mh = 0;
                            if (p.TargetName == "FootPanel") mh = $(window).height() -
                                dev.App.TopPanel.GetActualHeight() - dev.App.NavPanel.GetActualHeight();
                            else if (p.TargetName == "BottomPanel") mh = dev.App.MainPanel.GetActualHeight() -
                                    dev.App.MapToolPanel.GetActualHeight();
                            if (dy > mw && p.Height == mh) return;
                            if (p.Height < p.MinHeight) p.Height = p.MinHeight;
                            else if (dy > mh) p.Height = mh;
                            else p.Height = dy;
                            s.height = p.Height + 'px';
                            break;
                        case dev.Region.North:
                            div.css("cursor", "n-resize");
                            var dy = e.clientY - y;
                            if (dy < p.MinHeight && p.Height == p.MinHeight) return;
                            var mh = 0;
                            if (p.TargetName == "TopPanel") mh = $(window).height();
                            else if (p.TargetName == "NavPanel") mh = $(window).height() - dev.App.TopPanel.GetActualHeight();
                            else if (p.TargetName == "MapToolPanel") mh = dev.App.MainPanel.GetActualHeight();
                            if (dy > mw && p.Height == mh) return;
                            if (p.Height < p.MinHeight) p.Height = p.MinHeight;
                            else if (dy > mh) p.Height = mh;
                            else p.Height = dy;
                            s.height = p.Height + 'px';
                            break;
                    }
                    dev.App.MainPanel.Layout();
                };
                function mouseUp() {
                    div.remove();
                    el.releaseCapture ? (el.releaseCapture(), el.onmousemove = el.onmouseup = null)
                    : ($(document).unbind("mousemove", mouseMove).unbind("mouseup", mouseUp));
                };
                $(el).bind("mousedown", mouseDown);
            }
        },
        SetResizable: function (resizable) {
            this.Resizable = resizable;
        },
        Resize: function () {
            if (!this.Visible) return;
            if (this.Region == dev.Region.West) {
                var w = this.Width - (this.mt.outerWidth() - this.mt.width());
                if (!this.Split) this.mt.css("width", w);
                else this.mt.css("width", w - this.SplitElement.outerWidth() + 2);
                this.Height = this.Target.parent().height();
                this.mt.css("height", this.Height - (this.mt.outerHeight() - this.mt.height()));
                if (this.Region == dev.Region.East && this.Minimize) {
                    this.Width = 0; this.mt.css({ width: "21px" });
                }
            }
            else if (this.Region == dev.Region.East) {
                //获取屏幕宽度，考虑三维
                //this.Width = $(window).width() / 2;
                var w = this.Width - (this.mt.outerWidth() - this.mt.width());
                if (!this.Split) this.mt.css("width", w);
                else this.mt.css("width", w - this.SplitElement.outerWidth() + 2);
                this.Height = this.Target.parent().height();
                this.mt.css("height", this.Height - (this.mt.outerHeight() - this.mt.height()));
                if (this.Region == dev.Region.East && this.Minimize) {
                    this.Width = 0; this.mt.css({ width: "21px" });
                }
            }
            else if (this.Region == dev.Region.South || this.Region == dev.Region.North) {
                var h = this.Height - (this.mt.outerHeight() - this.mt.height());
                if (!this.Split) this.mt.css("height", h);
                else {
                    var sh = this.SplitElement.outerHeight();
                    if (this.Region == dev.Region.South) this.mt.css("top", sh);
                    this.mt.css("height", h - sh);
                }
                this.Width = this.Target.parent().width();
                //  this.Height = this.Target.parent().height();
                //  this.mt.css("height", this.Height - (this.mt.outerHeight() - this.mt.height()));
                this.mt.css("width", this.Width - (this.mt.outerWidth() - this.mt.width()));
            }
            this.Target.trigger("onResize");
        },
        SetHasBorder: function (hasBorder) {
            if (!dev.IsBoolean(hasBorder)) return;
            this.HasBorder = hasBorder;
            this.mt.css("border", hasBorder ? "" : "0px");
            this.Resize();
        },
        SetBorder: function (border) {
            this.mt.css("border", this.Border = border);
            this.Resize();
        },
        SetBorderTop: function (border) {
            this.mt.css("border-top", this.BorderTop = border);
            this.Resize();
        },
        SetBorderRight: function (border) {
            this.mt.css("border-right", this.BorderRight = border);
            this.Resize();
        },
        SetBorderBottom: function (border) {
            this.mt.css("border-bottom", this.BorderBottom = border);
            this.Resize();
        },
        SetBorderLeft: function (border) {
            this.mt.css("border-left", this.BorderLeft = border);
            this.Resize();
        }
    });
})(jQuery);
//DockPanel
(function ($) {
    dev.DockPanel = function (opt) {
        $.extend(this, new dev.Panel(opt));
        this.Title = opt.Title;
        this.Header = $("<div class='Panel-Header'></div>");
        this.Header.append($("<span class='Title'>" + this.Title + "</span>"));
        this.HeaderVisible = dev.IsBoolean(opt.HeaderVisible) ? opt.HeaderVisible : opt.HeaderVisible !== "false";
        this.Icon = $("<div class='Icon " + opt.IconCls + "'></div>");
        this.SetIconVisible(opt.IconVisible);
        this.Header.append(this.Icon);
        this.ButtonPanel = $("<div class='ButtonPanel'></div>");
        this.ButtonPanel.appendTo(this.Header);
        var icon = "Dock-Panel-Button-" + this.Region;
        this.AddTool({ ID: "scalable", IconCls: icon, TipTitle: "" });
        this.mt.append(this.Header);
        this.Content = $("<div class='Panel-DockContent'></div>");
        this.Content.css("height", (opt.Height - 26) + "px");
        this.mt.append(this.Content);
        this.Target.css("display", "block");
    };
    $.fn.extend(dev.DockPanel.prototype, {
        SetTitle: function (title) {
            this.Title = title;
            $(".Title", this.Target).html(title);
        },//设置标题
        SetHeaderVisible: function (visible) {
            var iv = this.HeaderVisible = dev.IsBoolean(visible) ? visible : visible != "false";
            $(".Panel-Header", this.Target).css({ "display": iv ? "block" : "none" });
            if (!iv) this.Content.css({ height: this.Height + "px", top: "0px" });
            else this.Content.css({ height: (this.Height - 26) + "px", top: "26px" });
        },
        AddTool: function (tools) {
            var ts = $(tools), $this = this;
            for (var i = 0; i < ts.length; i++) {
                var a = $("<a class='Button " + ts[i].IconCls + "' title='" + ts[i].TipTitle
                    + "' id='" + ts[i].ID + "'></a>").appendTo(this.ButtonPanel);
                a.prop("toolItem", ts[i]);
                a.bind("click", $this, function (o) {
                    var toolItem = $(this).prop("toolItem");
                    var en = toolItem.ID == "scalable" ? "onScaleClick" : "onToolClick";
                    $(o.data.Target).trigger(en, { Sender: this, ToolItem: toolItem });
                });
            }
            var childCount = this.ButtonPanel.children().length;
            this.ButtonPanel.css("width", (21 * childCount) + "px");
        },
        RemoveTool: function (ids) {
            var btns = $(".Button", this.ButtonPanel);
            for (var i = 0; i < btns.length; i++)
                if ($.inArray(btns[i].id, ids) >= 0 || btns[i].id == ids) $(btns[i]).remove();
            this.ButtonPanel.css("width", (21 * $(".Button", this.ButtonPanel).length) + "px");
        },
        ClearTool: function () {
            //$(".Button", this.ButtonPanel).remove();
            $(".Button:gt(0)", this.ButtonPanel).remove();
            this.ButtonPanel.css("width", "21px");
        },
        SetIconCls: function (iconCls) {
            this.Icon.attr("class", "Icon " + iconCls);
        },
        SetIconVisible: function (visible) {
            var iv = dev.IsBoolean(visible) ? visible : visible != "false";
            this.Icon.css("display", iv ? "block" : "none");
            $(".Title", this.Header).css("left", iv ? "26px" : "5px");
        },
        Add: function (element, parameters) {
            var $this = this;
            if (dev.IsString(element)) {
                this.Target.trigger("onClosing", { element: $this, id: $this.ID });
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
            return $this.Target;
        },
        Remove: function (element) {
            element = dev.IsString(element) ? $('#' + element, this.Content) : (dev.IsObject(element) ? $(element) : null);
            if (element == null || element.length == 0) return;
            element.remove();
        },
        Clear: function () {
            this.Target.trigger("onClosing", { element: this, id: this.ID });
            this.Content.empty();
        }
    });
})(jQuery);
//TopPanel
(function ($) {
    dev.TopPanel = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        opt.Region = dev.Region.North;
        opt.TargetName = "TopPanel"; opt.SplitClass = "Panel-Split-V";
        opt.Target = $("<div class='Panel-Top' id='" + opt.ID
            + "' style='height:" + "px'></div>");
        $.extend(this, new dev.Panel(opt)); this.DragResize(this);
        this.Target.css("display", this.Visible ? "block" : "none");
        this.BackgroundImage = opt.BackgroundImage;
        this.LeftImage = opt.LeftImage;
        this.LeftBoxVisible = opt.LeftBoxVisible == "true";
        this.LeftBoxWidth = parseInt(opt.LeftBoxWidth);
        this.RightImage = opt.RightImage;
        this.RightBoxVisible = opt.RightBoxVisible == "true";
        this.RightBoxWidth = parseInt(opt.RightBoxWidth);
        this.CenterBoxVisible = opt.CenterBoxVisible == "true";
        if (!dev.IsNull(this.BackgroundImage)) this.mt.css("background-image", "url(" + this.BackgroundImage + ")");
        var rb = $('<div tpid="rb" class="RightBackground"></div>').appendTo(this.mt);
        if (!dev.IsNull(this.RightImage)) rb.css("background-image", "url(" + this.RightImage + ")");
        var lb = $('<div tpid="lb" class="LeftBackground"></div>').appendTo(this.mt);
        if (!dev.IsNull(this.LeftImage)) lb.css("background-image", "url(" + this.LeftImage + ")");
        this.mt.append($('<div tpid="ContentBox" class="ContentBox"></div>'));
        this.LeftBox = $('<div tpid="LeftBox" class="LeftBox" style="width:' + this.LeftBoxWidth +
            'px;display:' + (this.LeftBoxVisible ? 'block' : 'none') + '"></div>').appendTo(this.mt);
        this.RightBox = $('<div tpid="RightBox" class="RightBox" style="width:' + this.RightBoxWidth +
            'px;display:' + (this.RightBoxVisible ? 'block' : 'none') + ';"></div>').appendTo(this.mt);
        var cw = $(window).width() - this.RightBoxWidth - this.LeftBoxWidth;
        this.CenterBox = $('<div tpid="CenterBox" class="CenterBox" style="overflow:hidden;min-width:140px; width:' + cw + 'px;left:' + this.LeftBoxWidth
            + 'px;display:' + (this.CenterBoxVisible ? 'block' : 'none') + ';"></div>').appendTo(this.mt);
        this.centerContent = $('<div style="position:absolute;height:100%;right:0px;top:0px;"></div>').appendTo(this.CenterBox);
        this.leftbtn = $('<div class="scrollbtn" style="height:60px;width:20px;background-image:url(' + dev.App.Root + 'image/menuleft.png);background-repeat:no-repeat;background-position:center; position:absolute;left:0px;top:0px;display:none;line-height:60px;text-align:center;font-size:18px;font-weight:bold;"></div>').appendTo(this.CenterBox);
        this.leftbtn.click(function () {
            var curright = parseInt($this.centerContent.css("right"));
            if (curright < 0) $this.centerContent.css("right", ((curright + 97) > 0 ? 0 : (curright + 97)) + "px");
        });
        this.rightbtn = $('<div class="scrollbtn" style="height:60px;width:20px;background-image:url(' + dev.App.Root + 'image/menuright.png);background-repeat:no-repeat;background-position:center;position:absolute;right:0px;top:0px;display:none;line-height:60px;text-align:center;font-size:18px;font-weight:bold;"></div>').appendTo(this.CenterBox);
        this.rightbtn.click(function () {
            var curright = parseInt($this.centerContent.css("right"));
            var childrens = $this.centerContent.children();
            var cw = 0;
            for (var i = 0; i < childrens.length; i++) cw += $(childrens[i]).outerWidth();
            if (curright < -(cw - $this.CenterBox.width())) return;
            var temp = 97;
            if ((curright - 97) < -(cw - $this.CenterBox.width())) temp = (curright + (cw - $this.CenterBox.width()));
            $this.centerContent.css("right", (curright - temp) + "px");
        });
        funExt(this);
        var $this = this;
    };
    function funExt(control) {
        $.fn.extend(control, {
            SetHeight: function (height) {
                if (!dev.IsNumber(height)) return;
                this.Target.css("height", this.Height = height);
                dev.App.MainPanel.Layout();
            },//设置高度
            SetVisible: function (visible) {
                if (!dev.IsBoolean(visible) || this.Visible == visible) return;
                this.Target.css('display', (this.Visible = visible) ? 'block' : 'none');
                dev.App.MainPanel.Layout();
            },//设置是否可见
            SetBackgroundIamge: function (uri) {
                if (!dev.IsString(uri)) return;
                this.BackgroundImage = uri;
                this.Target.css({
                    'background-repeat': 'repeat-x',
                    'background-image': 'url(' + uri + ')'
                });
            },//设置背景图片
            SetLeftImage: function (uri) {
                if (!dev.IsString(uri)) return;
                this.LeftImage = uri;
                this.LeftImage.css({
                    'background-repeat': 'no-repeat',
                    'background-image': 'url(' + uri + ')'
                });
            },//设置左边背景图片
            SetRightImage: function (uri) {
                if (!dev.IsString(uri)) return;
                this.RightImage = uri;
                this.RightImage.css({
                    'background-repeat': 'no-repeat',
                    'background-position': 'right top',
                    'background-image': 'url(' + uri + ')'
                });
            },//设置右边背景图片
            SetLeftBoxVisible: function (visible) {
                if (!dev.IsBoolean(visible)) return;
                this.LeftBoxVisible = visible;
                this.LeftBox.css('display', visible ? 'block' : 'none');
                var l = visible ? this.LeftBox.width() : 0;
                var centerwidth = this.Target.width() - (this.RightBoxVisible ? l + this.RightBox.width() : l);
                this.CenterBox.css({ 'width': centerwidth, 'left': l });
            },//设置左边容器是否可见
            SetLeftBoxWidth: function (width) {
                if (!dev.IsNumber(width)) return;
                this.LeftBox.css('width', this.LeftBoxWidth = width);
                var l = this.LeftBoxVisible ? this.LeftBox.width() : 0;
                var centerwidth = this.Target.width() - (this.RightBoxVisible ? l + this.RightBox.width() : l);
                this.CenterBox.css({ 'width': centerwidth, 'left': l });
                this.LeftBox.trigger("LeftBoxResize");//大小变化事件
            },//设置左边容器的宽度
            SetRightBoxVisible: function (visible) {
                if (!dev.IsBoolean(visible)) return;
                this.RightBoxVisible = visible;
                this.RightBox.css('display', visible ? 'block' : 'none');
                var l = visible ? this.RightBox.width() : 0;
                var centerwidth = this.Target.width() - (this.LeftBoxVisible ? l + this.LeftBox.width() : l);
                this.CenterBox.css({ 'width': centerwidth });
            },//设置右边边容器是否可见
            SetRightBoxWidth: function (width) {
                if (!dev.IsNumber(width)) return;
                this.RightBox.css('width', this.RightBoxWidth = width);
                var centerwidth = this.Target.width() - width - this.LeftBox.width();
                var l = this.RightBoxVisible ? this.RightBox.width() : 0;
                var centerwidth = this.Target.width() - (this.LeftBoxVisible ? l + this.LeftBox.width() : l);
                this.CenterBox.css('width', centerwidth);
                this.RightBox.trigger("RightBoxResize");//大小变化事件
            },//设置右边容器的宽度
            SetCenterBoxVisble: function (visible) {
                if (!dev.IsBoolean(visible)) return;
                this.CenterBoxVisible = visible;
                this.CenterBox.css('display', visible ? 'block' : 'none');
            },//设置中间容器是否可见
            Add: function (element, parent, isScolling, frameId) {
                if (dev.IsNull(element)) return;
                parent = dev.IsNull(parent) ? $(".ContentBox", this.mt) : $(parent);
                var tpid = parent.attr("tpid");
                if (tpid !== undefined && (tpid === "ContentBox" || tpid === "LeftBox"
                                  || tpid === "RightBox" || tpid === "CenterBox")) {
                    if (dev.IsString(element)) parent.html(dev.CreateFrame(url, isScolling, frameId));
                    else if (dev.IsObject(element)) parent.append(element);
                }
                return parent;
            },//添加元素
            Remove: function (element) {
                element = dev.IsString(element) ? $('#' + element)
                    : (dev.IsObject(element) ? $(element) : null);
                if (element == null || element.attr("tpid") !== undefined) return;
                if (element.parent().attr("tpid") !== undefined) element.remove();
            },//移除元素
            Clear: function (parent) {
                if (dev.IsNull(parent)) {
                    var children = this.Target.children()
                    for (var i = 0; i < children.length; i++) {
                        var item = $(children[i]);
                        var isleftBox = this.LeftBox == null ? false : (item.attr('id') == this.LeftBox.attr('id'));
                        var isrightBox = this.RightBox == null ? false : (item.attr('id') == this.RightBox.attr('id'));
                        var iscenterBox = this.CenterBox == null ? false : (item.attr('id') == this.CenterBox.attr('id'));
                        if (item.attr('data') == 'leftbg' || item.attr('data') == 'rightbg' || item.attr('data') == 'content'
                            || isleftBox || isrightBox || iscenterBox) continue;
                        item.remove();
                    }
                    this.LeftBox.empty();
                    this.RightBox.empty();
                    this.CenterBox.empty();
                    this.Target.children('div[data=content]').empty();
                }
                else if ($(parent).attr('id') != this.Target.attr('id')) $(parent).empty();
            },//清楚所有元素
            Layout: function () {
                if (!this.Visible) return;
                this.Resize(); this.ResizeEx();
            },
            ResizeEx: function () {
                var oldwidth = this.CenterBox.width();
                var cright = parseInt(this.centerContent.css("right"));
                var cw = this.mt.width() - this.RightBoxWidth - this.LeftBoxWidth;
                if (cw - oldwidth > 0 && cright < 0) {
                    var newr = 0;
                    var tempw = cw - oldwidth;
                    if (tempw + cright < 0) newr = tempw + cright;
                    this.centerContent.css("right", newr + "px");
                    // if(cright+(cw-oldwidth)
                }
                this.CenterBox.css("width", cw < 0 ? 0 : cw);
                $(this).trigger("onResize");//大小变化事件

                this.ShowCenterBox();
            },
            ShowCenterBox: function () {
                var centerwidth = this.CenterBox.width();
                var needwidth = 0;
                var childrens = this.centerContent.children();
                for (var i = 0; i < childrens.length; i++) needwidth += $(childrens[i]).outerWidth();
                var isscroll = (needwidth > centerwidth);
                this.centerContent.width(needwidth);
                this.leftbtn.css("display", isscroll ? "block" : "none");
                this.rightbtn.css("display", isscroll ? "block" : "none");
                if (!isscroll) this.centerContent.css("right", "0px");
            }
        });
    };
})(jQuery);
//NavPanel
(function ($) {
    function GetTop() {
        if (dev.App.TopPanel == null) return "0px";
        return dev.App.TopPanel.GetActualHeight() + "px";
    }
    dev.NavPanel = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        opt.Region = dev.Region.North;
        opt.TargetName = "NavPanel";
        opt.SplitClass = "Panel-Split-V";
        opt.Target = $("<div class='Panel-Nav' id='" + opt.ID
            + "' style='height:" + this.Height + "px'></div>");
        $.extend(this, new dev.Panel(opt));
        this.Target.css("display", this.Visible ? "block" : "none");
        this.DragResize(this);
        this.Open = dev.IsBoolean(opt.Open) ? opt.Open : opt.Open == "true";
        //this.mt.append(dev.CreateFrame("hp.html"));
    };
    $.fn.extend(dev.NavPanel.prototype, {
        SetTitle: function (title) {

        },//设置标题
        Layout: function () { this.Resize(); },
        UpdateTop: function () {
            if (!this.Visible) return;
            this.Target.css("top", GetTop());
        }
    });
})(jQuery);
//MainPanel
(function ($) {
    function GetTop() {
        var top = 0;
        if (dev.App.TopPanel != null) {
            top += dev.App.TopPanel.GetActualHeight();
        }
        if (dev.App.NavPanel != null) {
            top += dev.App.NavPanel.GetActualHeight();
        }
        return top + "px";
    }
    function GetHeight() {
        var h = $(window).height();
        if (dev.App.TopPanel != null && dev.App.TopPanel.Visible) {
            h -= dev.App.TopPanel.Height;
        }
        if (dev.App.NavPanel != null && dev.App.NavPanel.Visible) {
            h -= dev.App.NavPanel.Height;
        }
        if (dev.App.FootPanel != null && dev.App.FootPanel.Visible) {
            h -= dev.App.FootPanel.Height;
        }
        return h + "px";
    }
    dev.MainPanel = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        opt.Target = $("<div class='Panel-Main' id='" + opt.ID +
            "' style='height:" + GetHeight() + ";top:" + GetTop() + "'></div>");
        $.extend(this, new dev.Control(opt));
        this.Target.css("display", this.Visible ? "block" : "none");
        var layoutConfig = dev.App.Config.SystemLayout;
        dev.App.LeftPanel = this.LeftPanel = new dev.LeftPanel(layoutConfig.LeftPanel);
        this.Target.append(this.LeftPanel.Target);
        dev.App.RightPanel = this.RightPanel = new dev.RightPanel(layoutConfig.RightPanel);
        this.Target.append(this.RightPanel.Target);
        dev.App.CenterPanel = this.CenterPanel = new dev.CenterPanel(layoutConfig.CenterPanel);
        this.Target.append(this.CenterPanel.Target);

        //dev.App.BottomPanel = this.BottomPanel = new dev.BottomPanel(layoutConfig.BottomPanel);
        //this.Target.append(this.BottomPanel.Target);

        funExt(this);
    };
    function funExt(control) {
        $.fn.extend(control, {
            Layout: function () {
                var h = $(window).height(), t = 0;
                if (dev.App.TopPanel != null && dev.App.TopPanel.Visible) {
                    h -= dev.App.TopPanel.Height;
                    t += dev.App.TopPanel.Height;
                    dev.App.TopPanel.Layout();
                }
                if (dev.App.NavPanel != null && dev.App.NavPanel.Visible) {
                    h -= dev.App.NavPanel.Height;
                    dev.App.NavPanel.Target.css("top", t + "px");
                    t += dev.App.NavPanel.Height;
                    dev.App.NavPanel.Layout();
                }
                if (dev.App.FootPanel != null && dev.App.FootPanel.Visible) {
                    h -= dev.App.FootPanel.Height;
                    dev.App.FootPanel.Layout();
                }
                this.Target.css("top", t + "px");
                this.Target.css("height", h < 0 ? 0 : h);
                this.LeftPanel.Layout();
                this.RightPanel.Layout();
                this.CenterPanel.Layout();
                // this.BottomPanel.Layout();
                this.Target.trigger("onResize");
            },
            Resize: function () { this.Layout(); }
        });
    }
})(jQuery);
//FootPanel
(function ($) {
    dev.FootPanel = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        opt.Region = dev.Region.South;
        opt.TargetName = "FootPanel";
        opt.SplitClass = "Panel-Split-V";
        opt.Target = $("<div class='Panel-Foot' id='" + opt.ID
            + "' style='height:" + opt.Height + "px'><div style='color:#fcfcfc;line-height:" + opt.Height + "px;position:relative'><div style='height:22px;width:22px;margin-top:6px;float:left;margin-left:calc(50% - 210px);'></div><div style='float:left;'>Copyright © 2017-2018 &nbsp;&nbsp;北京禾壮慧农科技发展有限公司&nbsp;&nbsp; 版权所有</div></div>");
        $.extend(this, new dev.Panel(opt));
        this.DragResize(this);
    };
    $.fn.extend(dev.FootPanel.prototype, {
        Layout: function () { this.Resize(); }
    });
})(jQuery);
//LeftPanel
(function ($) {
    dev.LeftPanel = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        opt.IconCls = "icon-Maintence";
        opt.Region = dev.Region.West;
        opt.SplitClass = "Panel-Split-H";
        opt.Target = $("<div class='Panel-Left' id='" + opt.ID
            + "' style='width:" + opt.Width + "px'></div>");
        $.extend(this, new dev.DockPanel(opt));
        this.RemoveTool("scalable");
        var $this = this;
        this.IsTab = dev.IsBoolean(opt.Minimize) ? opt.IsTab : opt.IsTab === "true";
        this.Items = opt.Items;
        this.DragResize(this);
        this.Minimize = dev.IsBoolean(opt.Minimize) ? opt.Minimize : opt.Minimize === "true";// 初始化是否折叠起来
        this._Width = this.Width;
        this.Width = this.Minimize ? 0 : this.Width;
        this.Target.css({ "display": (this.Visible ? "block" : "none"), "width": this.Width + "px" });
        this.MinimizeVisible = dev.IsBoolean(opt.MinimizeVisible) ? opt.MinimizeVisible : opt.MinimizeVisible === "true";
        this.MinimizeButton = $("<div class='Panel-Left-MinimizeButton" + (this.Minimize ? " Panel-Left-MinimizeButton-Closed" : "") + "'></div>");
        this.MinimizeButton.appendTo(document.body);
        this.MinimizeButton.css("display", this.MinimizeVisible ? "block" : "none");
        this.MinimizeButton.bind("click", $this, function (lp) {
            lp.data.SetMinimize(!$this.Minimize);
        });
        if (this.IsTab) {
            this.Tab = new dev.Tab({
                Visible: true,
                Width: parseFloat(this.Width),
                Height: 600,
                Items: $(this.Items),
                IsDeletedLastTab: true,
                Position: "bottom"
            });
            this.Content.append(this.Tab.Target);
        }
        funExt(this);
    };
    function funExt(control) {
        $.fn.extend(control, {
            Layout: function () {
                this.Resize();
                this.MinimizeButton.css("left", this.Visible ? this.Width + "px" : "0px");
                this.MinimizeButton.css("visibility", (this.Height <= 47) || !this.Visible ? "hidden" : "visible");
                this.MinimizeButton.css("top", ((this.Height - 47) / 2 + this.Target.offset().top) + "px");
                if (this.IsTab) {
                    var height = this.Height;
                    if (this.HeaderVisible == true) height -= 26;
                    this.Tab.SetSize({ Width: this.Width, Height: height });
                    this.Tab.Layout();
                }
            },
            SetWidth: function (width) {
                if (!dev.IsNumber(width)) return;
                if (this.Width === width) return;
                this._Width = this.Width = width;
                if (!this.Visible || this.Minimize) return;
                this.Target.css({ "width": width + "px" });
                dev.App.MainPanel.Layout();
            },
            SetVisible: function (visible) {
                if (!dev.IsBoolean(visible) || this.Visible === visible) return;
                var $this = this;
                var l = (this.Visible = visible) ? this.Width : 0;
                if (this.Visible) {//显示leftPanel要在动画之前，动画效果会好很多
                    this.Target.css("display", "block");
                    this.Height = this.Target.height();
                    this.MinimizeButton.css("left", "0px");
                    this.MinimizeButton.css("visibility", "visible");
                    this.MinimizeButton.css("top", ((this.Height - 47) / 2 + this.Target.offset().top) + "px");
                }
                this.MinimizeButton.animate({ "left": l }, "fast");
                this.Target.animate({ width: l }, {
                    duration: "fast", queue: false,
                    complete: function () {
                        dev.App.MainPanel.Layout();
                        if (!$this.Visible) {//隐藏leftPanel要在动画做完了以后，动画效果也会好很多
                            $this.Target.css("display", "none");
                            $this.MinimizeButton.css("left", "0px");
                            $this.MinimizeButton.css("visibility", "hidden");
                        }
                        $this.Target.trigger("onVisible", $this.Visible);
                    }
                });
            },//重写SetVisible
            SetMinimize: function (isMinimize) {
                if (!dev.IsBoolean(isMinimize) || !this.Visible || this.Minimize === isMinimize) return;
                var l = 0;
                if ((this.Minimize = isMinimize)) {
                    this._Width = this.Width;
                    this.MinimizeButton.addClass("Panel-Left-MinimizeButton-Closed");
                }
                else {
                    l = this._Width;
                    this.MinimizeButton.removeClass("Panel-Left-MinimizeButton-Closed");
                }
                var $this = this;
                this.MinimizeButton.animate({ "left": l }, "fast");
                this.Target.animate({ width: l }, {
                    duration: "fast", queue: false,
                    complete: function () {
                        $this.Width = l;
                        dev.App.MainPanel.Layout();
                        $this.Target.trigger((isMinimize ? "onCollapse" : "onExpand"));
                    }
                });
            },
            Clear: function () {
                if (this.IsTab) this.Tab.Clear();
                else this.Content.Clear();
            }
        });
    }
})(jQuery);
//RightPanel
(function ($) {
    dev.RightPanel = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        opt.IconCls = "icon-SystemManageMenu";
        opt.Region = dev.Region.East;
        opt.SplitClass = "Panel-Split-H";
        //获取屏幕宽度，考虑三维
        //opt.Width = $(window).width() / 2;
        opt.Target = $("<div class='Panel-Right' id='" + opt.ID
            + "' style='width:" + opt.Width + "px'></div>");
        $.extend(this, new dev.DockPanel(opt));
        var $this = this; this.Title = opt.Title;
        this._Width = this.Width, this._Height = this.Height;

        this.DragResize(this);
        this.Minimize = dev.IsBoolean(opt.Minimize) ? opt.Minimize : opt.Minimize == "true";
        funExt(this);
        if (!this.Visible) this.Target.css("width", (this.Width = 0) + "px");
        else if (this.Minimize) {
            this.Target.css("width", (this.Width = 21) + "px");
            $(".Icon", this.Header).css("display", "none");
            $(".Title", this.Header).css("display", "none");
            var scalable = $("#scalable", this.ButtonPanel);
            scalable.removeClass("Dock-Panel-Button-EAST");
            scalable.addClass("Dock-Panel-Button-WEST");
            $this.SetResizable(false);
        }
        this.bind("onScaleClick", function (a, b) {
            if (b.ToolItem.ID == "scalable") $this.SetMinimize();
        });
        this.animating = false;

    };
    function funExt(control) {
        $.fn.extend(control, {
            Layout: function () {
                this.Resize();
                this.SetHeaderVisible(this.HeaderVisible);
            },
            SetWidth: function (width) {
                if (!dev.IsNumber(width)) return;
                this._Width = this.Width = width;
                if (!this.Visible || this.Minimize) return;
                if (this.Target.is(":animated")) this.Target.stop();
                this.Target.css({ "width": this.Width + "px" });
                dev.App.MainPanel.Layout();
            },
            SetMinimize: function (isMin) {
                this.animating = true; var $this = this;
                if (isMin === undefined) isMin = !this.Minimize;
                if (!this.Minimize) this._Width = this.Width;
                var l = isMin ? 21 : this._Width;
                $this.SetResizable(!isMin);
                this.Target.animate({ width: l }, {
                    duration: "fast", queue: false,
                    complete: function () {
                        $this.Width = l;
                        $this.Minimize = isMin;
                        var scalable = $("#scalable", $this.ButtonPanel);
                        if ($this.Minimize) {
                            $(".Icon", $this.Header).css("display", "none");
                            $(".Title", $this.Header).css("display", "none");
                            scalable.removeClass("Dock-Panel-Button-EAST");
                            scalable.addClass("Dock-Panel-Button-WEST");
                        }
                        else {
                            $(".Icon", $this.Header).css("display", "block");
                            $(".Title", $this.Header).css("display", "block");
                            scalable.removeClass("Dock-Panel-Button-WEST");
                            scalable.addClass("Dock-Panel-Button-EAST");
                        }
                        dev.App.MainPanel.Layout();
                        $this.Header.css("height", ($this.Minimize ? 28 : 26) + "px");//zzy add 2016-11-17
                        $this.animating = false;
                        $this.Target.trigger((isMin ? "onCollapse" : "onExpand"));
                    }
                });
            },
            SetVisible: function (visible) {
                this.animating = true; var $this = this;
                if (visible === undefined) visible = !this.Visible;
                if (this.Visible && !this.Minimize) this._Width = this.Width;
                this.Visible = visible;
                var l = visible ? this._Width : 0;
                this.Target.animate({ width: l }, {
                    duration: "fast", queue: false,
                    complete: function () {
                        $this.Width = l;
                        if (visible) {
                            $this.Minimize = false;
                            $(".Icon", $this.Header).css("display", "block");
                            $(".Title", $this.Header).css("display", "block");
                            var scalable = $("#scalable", $this.ButtonPanel);
                            scalable.removeClass("Dock-Panel-Button-WEST");
                            scalable.addClass("Dock-Panel-Button-EAST");
                        }
                        dev.App.MainPanel.Layout();
                        $this.animating = false;
                        $this.Target.trigger("onVisible", $this.Visible);
                    }
                });
            },
            SetHeaderVisible: function (visible) {
                this.HeaderVisible = dev.IsBoolean(visible) ? visible : visible != "false";
                this.Header.css({ "display": this.HeaderVisible ? "block" : "none" });
                if (!this.HeaderVisible) this.Content.css({ height: this.Height + "px", top: "0px" });
                else this.Content.css({ height: (this.Height - 26) + "px", top: (this.Minimize ? 28 : 26) + "px" });
            },
        });
    }
})(jQuery);
//CenterPanel
(function ($) {
    function GetLeft() {
        if (dev.App.LeftPanel == null) return "0px";
        return dev.App.LeftPanel.GetActualWidth() + "px";
    }
    function GetWidth() {
        var w = $(window).width();
        if (dev.App.LeftPanel != null) {
            w -= dev.App.LeftPanel.GetActualWidth();
        }
        if (dev.App.RightPanel != null) {
            w -= dev.App.RightPanel.GetActualWidth();
        }
        return w + "px";
    }
    dev.CenterPanel = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        opt.Visible = true;
        opt.Target = $("<div class='Panel-Center' id='" + opt.ID +
            "' style='width:" + GetWidth() + ";left:" + GetLeft() + "'></div>");
        $.extend(this, new dev.Control(opt));
        this.Target.css("display", this.Visible ? "block" : "none");
        var lc = dev.App.Config.SystemLayout;
        dev.App.MapToolPanel = this.MapToolPanel = new dev.MapToolPanel(lc.MapToolPanel);
        this.Target.append(this.MapToolPanel.Target);
        dev.App.MapPanel = this.MapPanel = new dev.MapPanel(lc.MapPanel);
        this.Target.append(this.MapPanel.Target);

        dev.App.BottomPanel = this.BottomPanel = new dev.BottomPanel(lc.BottomPanel);
        this.Target.append(this.BottomPanel.Target);
    };
    $.fn.extend(dev.CenterPanel.prototype, {
        Layout: function () {
            this.Target.css("left", GetLeft());
            this.Target.css("width", GetWidth());
            this.MapToolPanel.Layout();
            this.BottomPanel.Layout();
            this.MapPanel.Layout();
            this.Target.trigger("onResize");
        }
    });
})(jQuery);
//MapToolPanel(地图工具栏)
(function ($) {
    dev.MapToolPanel = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        opt.Region = dev.Region.North;
        opt.TargetName = "MapToolPanel";
        opt.SplitClass = "Panel-Split-V";
        opt.Target = $("<div class='Panel-MapTool' id='" + opt.ID
            + "' style='height:" + opt.Height + "px;background-color:#dddddd'></div>");
        $.extend(this, new dev.Panel(opt));
        this.Target.css("display", this.Visible ? "block" : "none");
        this.DragResize(this);
        this.LeftBoxVisible = dev.IsBoolean(opt.LeftBoxVisible) ?
            opt.LeftBoxVisible : opt.LeftBoxVisible == "true";
        this.LeftBoxWidth = dev.IsNumber(opt.LeftBoxWidth) ?
            opt.LeftBoxWidth : parseInt(opt.LeftBoxWidth);
        this.RightBoxVisible = dev.IsBoolean(opt.RightBoxVisible) ?
            opt.RightBoxVisible : opt.RightBoxVisible == "true";
        this.RightBoxWidth = dev.IsNumber(opt.RightBoxWidth) ?
            opt.RightBoxWidth : parseInt(opt.RightBoxWidth);
        this.CenterBoxVisible = dev.IsBoolean(opt.CenterBoxVisible) ?
            opt.CenterBoxVisible : opt.CenterBoxVisible == "true";

        var contentPanel = $('<div data="mapToolContent" tag="maptool" ' +
            'style="position:absolute;left:0px;height:100%;width:100%;display:' + (this.LeftBoxVisible ? 'block' : 'none')
            + ';margin:0px;"></div>');
        this.mt.append(contentPanel);

        this.LeftBox = $('<div id="mapTooLeftBox" tag="maptool" ' +
            'style="position:absolute;left:0px;height:' + (this.Height - 2)
            + 'px;width:' + this.LeftBoxWidth + 'px;display:' +
            (this.LeftBoxVisible ? 'block' : 'none') + ';margin:0px;"></div>');
        this.mt.append(this.LeftBox);

        this.RightBox = $('<div id="mapTooRightBox" tag="maptool" ' +
            'style="position:absolute;right:0px;height:' + (this.Height - 2)
            + 'px;width:' + this.RightBoxWidth + 'px;display:' +
            (this.RightBoxVisible ? 'block' : 'none') + ';margin:0px;"></div>');
        this.mt.append(this.RightBox);

        var centerWidth = this.mt.width() - this.RightBoxWidth - this.LeftBoxWidth;
        this.CenterBox = $('<div id="mapToolCenterBox" tag="maptool" ' +
            'style="position:absolute;left: ' + this.LeftBoxWidth + 'px;height:'
            + (this.Height - 2) + 'px;width:' + centerWidth + 'px;display:' +
            (this.CenterBoxVisible ? 'block' : 'none') + ';margin:0px;"></div>');
        this.mt.append(this.CenterBox);

    };
    $.fn.extend(dev.MapToolPanel.prototype, {
        Layout: function () { this.Resize(); },
        SetHeight: function (height) {
            if (!dev.IsNumber(height)) return;
            this.Target.panel({ height: this.Height = height });
            $("div[tag='maptool']").css('height', (height - 2) + 'px');
            this.Target.trigger("onResize");//大小变化事件
        },//设置高度
        SetVisible: function (visible) {
            if (!dev.IsBoolean(visible)) return;
            if (this.Visible == visible) return;
            this.Target.attr("Visible", visible);
            var v = visible ? 'show' : 'hidden';
            this.Target.parent().parent().layout(v, this.Target.panel('options').region);
            this.Visible = visible;
        },//设置是否可见
        SetLeftBoxVisible: function (visible) {
            if (!dev.IsBoolean(visible)) return;
            this.LeftBox.css('display', visible ? 'block' : 'none');
            var l = visible ? this.LeftBox.width() : 0;
            var centerwidth = this.Target.width() - (this.RightBoxVisible ? l + this.RightBox.width() : l);
            this.CenterBox.css({ 'width': centerwidth, 'left': l });
            this.LeftBoxVisible = visible;
        },//设置左边容器是否可见
        SetLeftBoxWidth: function (width) {
            if (!dev.IsNumber(width)) return;
            this.LeftBox.css('width', this.LeftBoxWidth = width);
            var l = this.LeftBoxVisible ? this.LeftBox.width() : 0;
            var centerwidth = this.Target.width() - (this.RightBoxVisible ? l + this.RightBox.width() : l);
            this.CenterBox.css({ 'width': centerwidth, 'left': l });
            this.LeftBox.Target.trigger("onLeftBoxResize");//大小变化事件
        },//设置左边容器的宽度
        SetRightBoxVisible: function (visible) {
            if (!dev.IsBoolean(visible)) return;
            this.RightBox.css('display', visible ? 'block' : 'none');
            var l = visible ? this.RightBox.width() : 0;
            var centerwidth = this.Target.width() - (this.LeftBoxVisible ? l + this.LeftBox.width() : l);
            this.CenterBox.css({ 'width': centerwidth });
            this.RightBoxVisible = visible;
        },//设置右边边容器是否可见
        SetRightBoxWidth: function (width) {
            if (!dev.IsNumber(width)) return;
            this.RightBox.css('width', this.RightBoxWidth = width);
            var l = this.RightBoxVisible ? this.RightBox.width() : 0;
            var centerwidth = this.Target.width() - (this.LeftBoxVisible ? l + this.LeftBox.width() : l);
            this.CenterBox.css('width', centerwidth);
            this.RightBox.Target.trigger("onRightBoxResize");//大小变化事件
        },//设置右边容器的宽度
        SetCenterBoxVisble: function (visible) {
            if (!dev.IsBoolean(visible)) return;
            this.CenterBox.css('display', visible ? 'block' : 'none');
            this.CenterBoxVisible = visible;
        },//设置中间容器是否可见
        Add: function (element, parent, isScolling, frameId) {
            if (dev.IsNull(element)) return;
            parent = dev.IsNull(parent) ? this.Target.children('div[data=mapToolContent]') : parent;
            var childByID = this.Target.find("#" + parent.attr("id"));
            var childByData = this.Target.find("div[data=" + parent.attr("data") + "]");
            var isChild = (dev.IsNull(childByID) || childByID.length == 0) || (dev.IsNull(childByData) || childByData.length == 0);
            if (!isChild) return;
            if (dev.IsString(element)) parent.html(dev.CreateFrame(url, isScolling, frameId));
            else if (dev.IsObject(element)) parent.append(element);
        },//添加元素
        Remove: function (element) {
            element = dev.IsString(element) ? $('#' + element) : (dev.IsObject(element) ? $(element) : null);
            if (element == null) return;
            var isleftBox = dev.IsNull(this.LeftBox) ? false : element.attr('id') === this.RightBox.attr('id');
            var isrightBox = dev.IsNull(this.RightBox) ? false : element.attr('id') === this.RightBox.attr('id');
            var iscenterBox = dev.IsNull(this.CenterBox) ? false : element.attr('id') == this.CenterBox.attr('id');
            if (element.attr('data') == 'mapToolContent' || isleftBox || isrightBox || iscenterBox || element.attr('id') === this.ID) return;
            if (element.parents('#' + this.ID).length > 0) element.remove();
        },//移除元素
        Clear: function (parent) {
            if (dev.IsNull(parent)) {
                var children = this.Target.children();
                for (var i = 0; i < children.length; i++) {
                    var item = $(children[i]);
                    var isleftBox = this.LeftBox == null ? false : (item.attr('id') == this.LeftBox.attr('id'));
                    var isrightBox = this.RightBox == null ? false : (item.attr('id') == this.RightBox.attr('id'));
                    var iscenterBox = this.CenterBox == null ? false : (item.attr('id') == this.CenterBox.attr('id'));
                    if (item.attr('data') == 'mapToolContent' || isleftBox || isrightBox || iscenterBox) continue;
                    item.remove();
                }
                this.LeftBox.empty();
                this.RightBox.empty();
                this.CenterBox.empty();
                this.Target.children('div[data=mapToolContent]').empty();
            }
            else {
                if ($(parent).attr('id') == this.Target.attr('id')) return;
                var child = this.Target.find("#" + element.attr("id"));
                if (dev.IsNull(child) && child.length > 0) $(parent).empty();
            }
        }//清楚所有元素
    });
})(jQuery);
//MapPanel(地图容器)
(function ($) {
    dev.MapPanel = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        opt.Visible = true;
        opt.Target = $("<div id='" + opt.ID + "' class='Panel-Map'></div>");
        $.extend(this, new dev.Control(opt));
        this.MapMode = dev.IsNull(opt.MapMode) ? dev.MapMode.Map2D : opt.MapMode;
        this.MapDOM = $("<div id='map' style='border:0px;position:absolute;'></div>");
        this.MapDOM3D = $('<div id="map3d" style="border:0px;position:absolute;"></>');
        this.Content = $("<div style='border:0px;display:none;position:absolute;z-index:9997'></div>");
        this.Target.append(this.MapDOM);
        this.Target.append(this.MapDOM3D);
        this.Target.append(this.Content);
    };
    $.fn.extend(dev.MapPanel.prototype, {
        SetContentVisible: function (visible) {
            if (!dev.IsBoolean(visible)) return;
            this.Content.css('display', (visible ? 'block' : 'none'));
        },
        Add: function (element, id) {
            var $this = this;
            if (dev.IsString(element)) {
                this.Target.trigger("onClosing", { element: $this, id: $this.ID });
                var frame = dev.CreateFrame(element, id);
                var waitbox = new dev.UCWaitBox(this.Target);
                frame.bind('load', function () {
                    waitbox.Close(); $this.Target.trigger("onLoaded", $this);
                });
                this.Content.append(frame);
                waitbox.Show();
            }
            else if (dev.IsObject(element)) {
                this.Content.append($(element)); $this.Target.trigger("onLoaded", $this);
            }
            this.Content.css('display', 'block');
        },//添加内容
        Remove: function (element) {
            if (dev.IsString(element)) element = $('#' + element, this.Content);
            else if (dev.IsDOMElement(element)) element = $(element);
            if (element != null && element.length > 0) element.remove();
            if (this.Content.children().length == 0) this.Content.css('display', 'none');
        },
        SetMapModel: function (mapmodel) {
            if (dev.IsNull(mapmodel)) return;
            this.MapMode = mapmodel;
            this.Layout();
        },
        Clear: function () {
            this.Content.empty();
            this.Content.css('display', 'none');
        },//清除
        Layout: function () {
            this.Height = dev.App.MainPanel.GetActualHeight() -
                dev.App.BottomPanel.GetActualHeight() - dev.App.MapToolPanel.GetActualHeight();
            this.Target.css("top", dev.App.MapToolPanel.GetActualHeight());
            this.Target.css("height", this.Height);
            if (this.MapMode == dev.MapMode.Map2D) {
                this.MapDOM.css("display", "block");
                this.MapDOM3D.css("display", "none");
                this.MapDOM.css("height", this.Height - (this.MapDOM.outerHeight() - this.MapDOM.height()));
                this.MapDOM.css("width", this.GetActualWidth() - (this.MapDOM.outerWidth() - this.MapDOM.width()));
            }
            if (this.MapMode == dev.MapMode.Map3D) {
                this.MapDOM.css("display", "none");
                this.MapDOM3D.css("display", "block");
                this.MapDOM3D.css({ "left": "0px", "height": (this.Height - (this.MapDOM3D.outerHeight() - this.MapDOM3D.height())) + "px", "width": (this.GetActualWidth() - (this.MapDOM3D.outerWidth() - this.MapDOM3D.width())) + "px" });
                //this.MapDOM3D.css("height", this.Height - (this.MapDOM3D.outerHeight() - this.MapDOM3D.height()));
                //this.MapDOM3D.css("width", this.GetActualWidth() - (this.MapDOM3D.outerWidth() - this.MapDOM3D.width()));
            }
            if (this.MapMode == dev.MapMode.MapUnit) {
                this.MapDOM.css("display", "block");
                this.MapDOM3D.css("display", "block");
                this.MapDOM.css("height", this.Height - (this.MapDOM.outerHeight() - this.MapDOM.height()));
                this.MapDOM3D.css("height", this.Height - (this.MapDOM3D.outerHeight() - this.MapDOM3D.height()));
                var width = this.GetActualWidth();
                var mapdomw = parseInt(width / 2);
                var mapdomw1 = width - mapdomw;
                this.MapDOM.css({ "width": mapdomw + "px" });
                this.MapDOM3D.css({ "width": (mapdomw1 - 2) + "px", "left": mapdomw + "px", "border-left": "2px solid #0099cc" });
            }
            //    this.MapDOM.css("height", this.Height - (this.MapDOM.outerHeight() - this.MapDOM.height()));
            //   this.MapDOM.css("width", this.GetActualWidth() - (this.MapDOM.outerWidth() - this.MapDOM.width()));
            //this.Content.css({ "height": this.MapDOM.height(), "width": this.MapDOM.width() });  主界面重新布局时不需要更新Content
            if (!dev.IsNull(dev.App.Map)) dev.App.Map.updateSize();
            this.Target.trigger("onResize");
        }//初始布局
    });
})(jQuery);
//BottomPanel
(function ($) {
    dev.BottomPanel = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        opt.IconCls = "icon-ResourceView";
        //opt.IconVisible = false;
        opt.Region = dev.Region.South;
        opt.TargetName = "BottomPanel";
        opt.SplitClass = "Panel-Split-V";
        opt.Target = $("<div class='Panel-Bottom' id='" + opt.ID
            + "' style='height:" + opt.Height + "px'></div>");
        $.extend(this, new dev.DockPanel(opt));
        var $this = this;
        this._Height = this.Height;
        this.Header.css("background-color", "#dddddd");
        this.DragResize(this);
        this.Title = opt.Title;
        this.Minimize = dev.IsBoolean(opt.Minimize) ? opt.Minimize : opt.Minimize == "true";
        funExt(this);
        if (!this.Visible) this.Target.css("height", (this.Height = 0) + "px");
        else if (this.Minimize) {
            this.Target.css("height", (this.Height = 26) + "px");
            var scalable = $("#scalable", this.ButtonPanel);
            scalable.removeClass("Dock-Panel-Button-SOUTH");
            scalable.addClass("Dock-Panel-Button-NORTH");
            $this.SetResizable(false);
        }
        this.bind("onScaleClick", function (a, b) {
            if (b.ToolItem.ID == "scalable") $this.SetMinimize();
        });
        this.animating = false;
    };
    function funExt(control) {
        $.fn.extend(control, {
            Layout: function () {
                this.Resize();
                this.SetHeaderVisible(this.HeaderVisible);
            },
            SetVisible: function (visible) {
                //if (this.animating) return;
                this.animating = true; var $this = this;
                if (visible === undefined) visible = !this.Visible;
                if (this.Visible && !this.Minimize) this._Height = this.Height;
                var h = visible ? this._Height : 0;
                this.Target.animate({ height: h }, {
                    duration: "fast", queue: false,
                    complete: function () {
                        $this.Height = h;
                        $this.Visible = visible;
                        if (visible) {
                            $this.Minimize = false;
                            var scalable = $("#scalable", $this.ButtonPanel);
                            scalable.removeClass("Dock-Panel-Button-NORTH");
                            scalable.addClass("Dock-Panel-Button-SOUTH");
                        }
                        dev.App.CenterPanel.Layout();
                        // dev.App.MainPanel.Layout();
                        $this.animating = false;
                        $this.Target.triggerHandler($this.Visible ? "onVisShow" : "onVisHidden");
                    }
                });
            },
            SetMinimize: function (isMin) {
                if (!this.Visible) return;//this.animating || 
                this.animating = true; var $this = this;
                if (isMin === undefined) isMin = !this.Minimize;
                if (!this.Minimize) this._Height = this.Height;
                var h = isMin ? 26 : this._Height;
                $this.SetResizable(!isMin);
                this.Target.animate({ height: h }, {
                    duration: "fast", queue: false,
                    complete: function () {
                        $this.Height = h;
                        $this.Minimize = isMin;
                        var scalable = $("#scalable", $this.ButtonPanel);
                        if ($this.Minimize) {
                            scalable.removeClass("Dock-Panel-Button-SOUTH");
                            scalable.addClass("Dock-Panel-Button-NORTH");
                        }
                        else {
                            scalable.removeClass("Dock-Panel-Button-NORTH");
                            scalable.addClass("Dock-Panel-Button-SOUTH");
                        }
                        dev.App.CenterPanel.Layout();
                        //dev.App.MainPanel.Layout();
                        $this.animating = false;
                        $this.Target.trigger((isMin ? "onCollapse" : "onExpand"));
                    }
                });
            },
            SetHeight: function (height) {
                if (!dev.IsNumber(height)) return;
                this._Height = this.Height = height;
                if (!this.Visible || this.Minimize) return;
                this.Target.css({ "height": this.Height + "px" });
                dev.App.CenterPanel.Layout();
                //dev.App.MainPanel.Layout();
            }
        });
    }
})(jQuery);
//FillPanel(填充容器[右下])
(function ($) {
    dev.FillPanel = function (opt) {
        if (dev.IsNull(opt) || dev.IsNull(opt.MainPanel)) return;
        $t = this; this.MainPanel = opt.MainPanel;
        this.Target = this.MainPanel.CenterPanel.Target;
    };
    $.fn.extend(dev.FillPanel.prototype, {
        Add: function (element, params, id) {
            var $this = this;
            this.MainPanel.RightPanel.SetVisible(false);
            if (dev.IsString(element)) {
                // this.Target.trigger("onClosing", { element: $this, id: $this.ID });
                var frame = dev.CreateFrame(element, false, id);
                frame.css({ "position": "absolute", "z-index": 4 });
                var waitbox = new dev.UCWaitBox(this.Target);
                frame.bind('load', function () {
                    waitbox.Close();
                    dev.CallWidgetCommunication(frame[0], $this.Target, params);
                    $this.Target.trigger("onLoaded", $this);
                });
                this.Target.append(frame);
                waitbox.Show();
            }
            else if (dev.IsDOMElement(element) || dev.IsjQueryObject(element)) {
                $(element).css({ "position": "absolute", "z-index": 4 });
                this.Target.append(element);
                this.Target.trigger("onLoaded", $this);
            }
            //return this.Target;
        },
        Remove: function (element) {
            element = dev.IsString(element) ? $('#' + element, this.Target) : (dev.IsObject(element) ? $(element) : null);
            if (element == null || element.length == 0) return;
            if (element.hasClass("Panel-MapTool") || element.hasClass("Panel-Map") || element.hasClass("Panel-Bottom")) return;
            //  if (element[0].tagName.toLowerCase() == "iframe") this.Target.trigger("onClosing");
            element.remove();
        },
        Clear: function () {
            this.Target.trigger("onClosing", { element: this, id: this.ID });
            var children = this.Target.children();
            for (var i = 0; i < children.length; i++) {
                var e = $(children[i]);
                if (!e.hasClass("Panel-MapTool") && !e.hasClass("Panel-Map")
                && !e.hasClass("Panel-Bottom")) e.remove();
            }
        },
        bind: function () {
            this.Target.bind(arguments[0], arguments[1], arguments[2]);
        },
        unbind: function (eventName) { this.Target.unbind(eventName); }
    });
})(jQuery);
//Tab
(function ($) {
    var tabItemHeight = 24;
    function layoutTabItem(tabItems, left) {
        for (var i = 0; i < tabItems.length; i++) {
            var item = $(tabItems[i]);
            item.css("left", left + "px");
            left += item.outerWidth();
        }
    };
    dev.Tab = function (opt) {
        function tabItemScroll(obj) {
            if (animating) return;
            animating = true;
            var tabItems = $this.tabPanel.children("[tabIndex]");
            var aw = Enumerable.From(tabItems).Sum("s=>$(s).outerWidth()");
            var left = 19 - parseInt($(tabItems[0]).css("left"));
            var d = 100;
            if (obj.hasClass("LeftScrollButton")) {
                if (left < d) d = left;
            }
            else if (obj.hasClass("RightScrollButton")) {
                if (aw - left - $this.Width + 38 < d) d = aw - left - $this.Width + 38;
            }
            if ($this.Width - 38 < d) d = $this.Width - 38;
            if (d <= 0) { animating = false; return; }
            if (obj.hasClass("LeftScrollButton")) d = -d;
            for (var i = 0; i < tabItems.length; i++) {
                var l = parseInt($(tabItems[i]).css("left"));
                $(tabItems[i]).animate({ left: l - d }, {
                    duration: "fast", queue: false,
                    complete: function () { animating = false; }
                });
            }
        }
        if (dev.IsNull(opt)) opt = { Visible: true, Width: 200, Height: 600, Position: "bottom" };
        if (dev.IsNull(opt.Target))
            opt.Target = $("<div class='dev-tab' style='width:" + opt.Width + "px;height:" +
                         opt.Height + "px;display:" + (opt.Visible ? "block" : "none") + "'></div>");
        else opt.ID = opt.Target.attr("id");
        $.extend(this, new dev.Control(opt));
        var $this = this;
        var animating = false;
        this.SelectedIndex = 0;
        this.TabNormalCls = opt.TabNormalCls;
        this.TabSelectedCls = opt.TabSelectedCls;
        this.Target = opt.Target;
        this.Position = dev.IsNull(opt.Position) ? "top" : opt.Position;
        this.IsDeletedLastTab = dev.IsBoolean(opt.IsDeletedLastTab) ? opt.IsDeletedLastTab : opt.IsDeletedLastTab == "true";
        this.content = $("<div style='width:100%;height:" + (opt.Height - tabItemHeight) + "px;margin-top:" + (this.Position === "bottom" ? "0px" : tabItemHeight + "px") + "'></div>");
        this.content.appendTo(this.Target);
        this.tabPanel = $("<div class='" + (this.Position === "bottom" ? "TabPanelBottom" : "TabPanelTop") + "'></div>");
        this.tabLS = $("<div class='LeftScrollButton'></div>");
        this.tabRS = $("<div class='RightScrollButton'></div>");
        this.tabLS.appendTo(this.tabPanel);
        this.tabRS.appendTo(this.tabPanel);
        this.tabLS.bind("click", function () { tabItemScroll($(this)); });
        this.tabRS.bind("click", function () { tabItemScroll($(this)); });
        this.tabPanel.appendTo(this.Target);
        if (dev.IsNull(opt.Items)) this.Items = [];
        else this.Items = opt.Items;
        funExt(this);
        this.RefreshItem();
        this.bind("onResize", this, function (e) {
            var height = e.data.Height;
            if (e.data.content.children > 1) height -= tabItemHeight;
            e.data.content.css("height", height + "px");
            var tabItem = $this.tabPanel.children("[tabIndex='" + $this.SelectedIndex + "']");
            tabItem.triggerHandler("onResize");
        });
    };
    function funExt(control) {
        $.fn.extend(control, {
            Layout: function () {
                var tabItems = this.tabPanel.children("[tabIndex]");
                for (var i = 0; i < tabItems.length; i++) $(tabItems[i]).first().css("width", "");
                var aw = Enumerable.From(tabItems).Sum("s=>$(s).children(':first').outerWidth()");
                if (aw > this.Width) {
                    this.tabLS.css("display", "block");
                    this.tabRS.css("display", "block");
                    var l0 = parseInt($(tabItems[0]).css("left"));
                    if (l0 == 0 || l0 == 19 || isNaN(l0)) layoutTabItem(tabItems, 19);
                    else {
                        if (l0 + aw < this.Width - 19) layoutTabItem(tabItems, this.Width - 19 - aw);
                        else layoutTabItem(tabItems, (l0 < 0) ? 19 : (19 - l0));
                    }
                    var item = this.tabPanel.children("[tabIndex='" + this.SelectedIndex + "']");
                    var left = parseInt($(item).css("left"));
                    if (left < 19) {
                        var tabItems = this.tabPanel.children("[tabIndex]");
                        for (var i = 0; i < tabItems.length; i++) {
                            var l = parseInt($(tabItems[i]).css("left"));
                            $(tabItems[i]).css("left", (l + 19 - left) + "px");
                        }
                    }
                    else if (left + $(item).outerWidth() > this.Width - 19) {
                        var tabItems = this.tabPanel.children("[tabIndex]");
                        var _l = left - this.Width + 19 + $(item).outerWidth();
                        for (var i = 0; i < tabItems.length; i++) {
                            var l = parseInt($(tabItems[i]).css("left"));
                            $(tabItems[i]).css("left", (l - _l) + "px");
                        }
                    }
                }
                else {
                    this.tabLS.css("display", "none");
                    this.tabRS.css("display", "none");
                    var res = (this.Width - aw) % tabItems.length;//取余
                    var uw = ((this.Width - aw) - res) / tabItems.length;//单位平均值
                    var left = 0;
                    for (var i = 0; i < tabItems.length; i++) {
                        var item = $(tabItems[i]);
                        var w = item.first().outerWidth();
                        if (res == 0) w += uw;
                        else { w += uw + 1; res--; }
                        item.css("left", left + "px");
                        item.css("width", w + "px");
                        left += w;
                    }
                }
            },
            SelectItem: function (item) {
                if (!dev.IsObject(item)) return;
                this.SelectedIndex = parseInt($(item).attr("tabIndex"));
                this.tabPanel.children("[tabIndex]").removeClass("TabItem-Selected" + (dev.IsNull(this.TabSelectedCls) ? "" : " " + this.TabSelectedCls));
                var tabItem = this.tabPanel.children("[tabIndex='" + this.SelectedIndex + "']");
                tabItem.addClass("TabItem-Selected" + (dev.IsNull(this.TabSelectedCls) ? "" : " " + this.TabSelectedCls));
                this.content.children("[tabIndex]").css("display", "none");
                this.content.children("[tabIndex='" + this.SelectedIndex + "']").css("display", "block");
                if (this.tabLS.css("display") == "none") {
                    tabItem.trigger("onSelected", { element: tabItem, index: this.SelectedIndex })
                    return;
                }
                var left = parseInt($(item).css("left"));
                if (left < 19) {
                    var tabItems = this.tabPanel.children("[tabIndex]");
                    for (var i = 0; i < tabItems.length; i++) {
                        var l = parseInt($(tabItems[i]).css("left"));
                        $(tabItems[i]).animate({ left: l + 19 - left }, {
                            duration: "fast", queue: false
                        });
                    }
                }
                else if (left + $(item).outerWidth() > this.Width - 19) {
                    var tabItems = this.tabPanel.children("[tabIndex]");
                    var _l = left - this.Width + 19 + $(item).outerWidth();
                    for (var i = 0; i < tabItems.length; i++) {
                        var l = parseInt($(tabItems[i]).css("left"));
                        $(tabItems[i]).animate({ left: l - _l }, {
                            duration: "fast", queue: false
                        });
                    }
                }
                tabItem.trigger("onSelected", { element: tabItem, index: this.SelectedIndex });//选中事件
            },
            SelectIndex: function (index) {
                if (!dev.IsNumber(index)) return;
                var item = this.tabPanel.children("[tabIndex='" + index + "']");
                this.SelectItem(item);
            },
            SelectID: function (id) {
                if (!dev.IsString(id)) return;
                var item = this.tabPanel.find("div#" + id).parent();
                this.SelectItem(item);
            },
            RefreshItem: function () {
                this.content.empty();
                var $this = this;
                this.tabPanel.children("[tabIndex]").remove();
                for (var i = 0; i < this.Items.length; i++) {
                    if (dev.IsNull(this.Items[i].Content) && dev.IsNull(this.Items[i].Url)) continue;
                    this.Items[i].IsDeleted = dev.IsBoolean(this.Items[i].IsDeleted) ? this.Items[i].IsDeleted : this.Items[i].IsDeleted === "true";
                    this.Items[i].IsSelected = dev.IsBoolean(this.Items[i].IsSelected) ? this.Items[i].IsSelected : this.Items[i].IsSelected === "true";
                    if (this.Items[i].IsSelected) this.SelectedIndex = i;
                    var item = $("<div class='TabItem" + (dev.IsNull($this.TabNormalCls) ? "" : " " + $this.TabNormalCls) + "' tabIndex='" + i + "'></div>");
                    item.bind("click", this, function (obj) {
                        obj.data.SelectItem(this);
                    });
                    var itemContent = $("<div class='ItemContent' id='" + this.Items[i].ID + "'></div>");
                    var title = $("<span class='Title'>" + this.Items[i].Name + "</span>");
                    itemContent.append(title);
                    itemContent.appendTo(item);
                    if (this.Items[i].IsDeleted) {
                        var img = $("<img class='CloseButton' id='img" + this.Items[i].ID + "' src='image/tabitem_close.png'/>");
                        img.bind("click", this, function (obj) {
                            obj.data.RemoveItem($(this).parents("div.TabItem"));
                        });
                        title.append(img);
                    }
                    item.appendTo(this.tabPanel);
                    if (!dev.IsNull(this.Items[i].Content)) {
                        var content = $(this.Items[i].Content);
                        content.css("display", "none");
                        content.attr("tabIndex", "" + i);
                        this.content.append(content);
                        item.trigger("onLoaded", $this);
                    }
                    else if (!dev.IsNull(this.Items[i].Url)) {
                        var frame = dev.CreateFrame(this.Items[i].Url, this.Items[i].IsScrolling, this.Items[i].ID);
                        frame.css("display", "none").attr("tabIndex", "" + i);
                        frame.bind('load', { frame: frame[0], tabItem: item, parameters: this.Items[i].Parameters }, function (s, e) {
                            dev.CallWidgetCommunication(s.data.frame, s.data.tabItem, s.data.parameters);
                            s.data.tabItem.trigger("onLoaded", $this);
                        });
                        this.content.append(frame);

                    }
                }
                if (this.IsDeletedLastTab && this.content.children().length === 1) {
                    if (this.Position.toLowerCase() !== "bottom") this.content.css("margin-top", "0px");
                    this.content.css("height", (this.content.height() + tabItemHeight) + "px");
                    this.tabPanel.css("display", "none");
                }
                this.SelectIndex(this.SelectedIndex);
            },
            Add: function (itemObj, isScrolling, frameId) {
                if (!dev.IsObject(itemObj) || (dev.IsNull(itemObj.Content) && dev.IsNull(itemObj.Url))) return;
                var $this = this;
                itemObj.IsDeleted = dev.IsBoolean(itemObj.IsDeleted) ? itemObj.IsDeleted : itemObj.IsDeleted === "true";
                itemObj.IsSelected = dev.IsBoolean(itemObj.IsSelected) ? itemObj.IsSelected : itemObj.IsSelected === "true";
                var index = parseInt(this.tabPanel.children("div.TabItem:last").attr("tabIndex"));//获取最后一个TabItems的索引值
                if (this.IsDeletedLastTab) {
                    if (index === 0) {//当获取的最后一个索引为0
                        if (this.Position.toLowerCase() !== "bottom") this.content.css("margin-top", tabItemHeight + "px");
                        this.content.css("height", (this.content.height() - tabItemHeight) + "px");
                        this.tabPanel.css("display", "block");
                    }
                    else if (isNaN(index)) {//如果现在加的是第一个tab，那么就是完全填充
                        if (this.Position.toLowerCase() !== "bottom") this.content.css("margin-top", "0px");
                        this.tabPanel.css("display", "none");
                        this.content.css("height", (this.content.height()) + "px");
                    }
                }
                index = isNaN(index) ? 0 : index + 1;
                if (itemObj.IsSelected) this.SelectedIndex = index;
                var tabItem = $("<div class='TabItem " + (dev.IsNull($this.TabNormalCls) ? "" : " " + $this.TabNormalCls) + "' tabIndex='" + index + "'></div>");
                tabItem.bind("click", this, function (obj) { obj.data.SelectItem(this); });
                var itemContent = $("<div class='ItemContent' id='" + itemObj.ID + "'></div>");
                var title = $("<span class='Title'>" + itemObj.Name + "</span>");
                itemContent.append(title);
                itemContent.appendTo(tabItem);
                if (itemObj.IsDeleted) {
                    var img = $("<img class='CloseButton' id='img" + itemObj.ID + "' src='image/tabitem_close.png'/>");
                    img.bind("click", this, function (obj) {
                        obj.data.RemoveItem($(this).parents("div.TabItem"));
                    });
                    title.append(img);
                }
                tabItem.appendTo(this.tabPanel);
                if (!dev.IsNull(itemObj.Content)) {
                    var content = $(itemObj.Content);
                    content.css("display", "none");
                    content.attr("tabIndex", "" + index);
                    this.content.append(content);
                    tabItem.triggerHandler("onLoaded", $this);
                }
                else if (!dev.IsNull(itemObj.Url)) {
                    var frame = dev.CreateFrame(itemObj.Url, isScrolling, frameId);
                    frame.css("display", "none").attr("tabIndex", "" + index);
                    var waitbox = new dev.UCWaitBox({ Parent: this.Target, BackColor: "#fff" });//zzy 2016-10-22
                    frame.bind('load', { frame: frame[0], tabItem: tabItem, parameters: itemObj.Parameters }, function (e) {
                        dev.CallWidgetCommunication(e.data.frame, e.data.tabItem, e.data.parameters);
                        waitbox.Close();
                        e.data.tabItem.triggerHandler("onLoaded", $this);
                    });
                    this.content.append(frame);
                    waitbox.Show();
                }
                this.Items.push(itemObj);
                this.Layout();
                if (itemObj.IsSelected) {
                    this.SelectedIndex = index;
                    this.SelectItem(tabItem);
                }
                return tabItem;
            },
            RemoveItem: function (item) {
                if (!dev.IsObject(item)) return;
                var index = $(item).attr("tabIndex");
                this.RemoveIndex(parseInt(index));
            },
            RemoveID: function (id) {
                if (!dev.IsString(id)) return;
                var item = this.tabPanel.find("#" + id).parent();
                var index = $(item).attr("tabIndex");
                this.RemoveIndex(parseInt(index));
            },
            RemoveIndex: function (index) {
                if (!dev.IsNumber(index)) return;
                var currentContent = this.content.children("[tabIndex='" + index + "']");
                var tabItem = this.tabPanel.children("[tabIndex='" + index + "']");
                tabItem.trigger("onClosing", { element: { Target: tabItem }, id: tabItem.attr("id"), index: index });
                var lastindex = parseInt(this.tabPanel.children("div.TabItem:last").attr("tabIndex"));//获取最后一个TabItems的索引值
                var left = undefined;
                if (index === 0) { left = 19; }
                currentContent.remove();
                tabItem.remove();
                this.Items.splice(index, 1);
                if (this.IsDeletedLastTab && this.content.children().length === 1) {
                    if (this.Position.toLowerCase() !== "bottom") this.content.css("margin-top", "0px");
                    this.content.css("height", (this.content.height() + tabItemHeight) + "px");
                    this.tabPanel.css("display", "none");
                }
                if (index === lastindex)
                    this.SelectedIndex = index === this.SelectedIndex ? (index - 1) : this.SelectedIndex;
                else {
                    var i = index + 1;
                    while (i <= lastindex) {
                        var button = this.tabPanel.children("[tabIndex='" + i + "']");
                        this.content.children("[tabIndex='" + i + "']").attr("tabIndex", "" + (i - 1));
                        button.attr("tabIndex", "" + (i - 1));
                        if (i === (index + 1) && left) button.css("left", left + "px");
                        i++;
                    }
                    if (this.SelectedIndex > index) this.SelectedIndex = this.SelectedIndex - 1;
                    else if (this.SelectedIndex === index) this.SelectedIndex = index;
                }
                this.Layout();
                this.SelectIndex(this.SelectedIndex);
                tabItem.trigger("onClosed", { parent: { Target: tabItem }, id: tabItem.attr("id"), index: index });
            },
            GetTabItemByID: function (id) {
                if (!dev.IsString(id)) return;
                var item = this.tabPanel.find("div#" + id);
                return this.tabPanel.children("[tabIndex='" + item.attr("tabIndex") + "']");
            },
            GetTabItemByIndex: function (index) {
                if (!dev.IsNumber(index)) return;
                return this.tabPanel.children("[tabIndex='" + index + "']");
            },
            GetContentByID: function (id) {
                if (!dev.IsString(id)) return;
                return this.content.children("#" + id);
            },
            GetContentByIndex: function (index) {
                if (!dev.IsString(id)) return;
                return this.content.children("[tabIndex='" + index + "']");
            },
            Clear: function () {
                this.content.children("[tabIndex]").Clear();
                this.tabPanel.children("[tabIndex]").Clear();
            }
        });
    };
})(jQuery);
//NavButton 
(function ($) {
    dev.NavButton = function (opt) {
        if (dev.IsNull(opt)) opt = { IconVisible: true, Text: "按钮" };
        this.IconVisible = dev.IsBoolean(opt.IconVisible) ? opt.IconVisible : opt.IconVisible != "false";
        this.TrigonVisible = dev.IsBoolean(opt.TrigonVisible) ? opt.TrigonVisible : opt.TrigonVisible == "true";
        var title = "<span class='Title'>" + (this.Text = opt.Text) + "</span>";
        var moreIcon = "<div class='Icon-Trigon' style='display:" + (this.TrigonVisible ? "block" : "none") + "'></div>";
        this.Padding = dev.IsNull(opt.Padding) ? "" : "padding:" + opt.Padding;
        this.IconCls = opt.Icon ? dev.InsertIconRule(dev.App.TempStyle, ".icon" + this.ID, opt.Icon) : opt.IconCls;
        var sizeStyle = "";
        opt.Target = $("<a class='Nav-Button' style='" + this.Padding + ";'><div class='Icon " + this.IconCls
            + "' style='display:" + (this.IconVisible ? "block" : "none") + ";'></div>" + title + moreIcon + "</a>");
        $.extend(this, new dev.Control(opt));
        this.Target.prop("Tag", opt.Tag);
        this.Target.bind("mouseenter", this, function (e) {
            e.data.Target.trigger("onMouseenter");
        });
        this.Target.bind("mouseleave", this, function (e) {
            // e.data.Target.css("background-color", "");
            e.data.Target.trigger("onMouseleave");
        });
        this.Target.bind("mousedown", this, function (e) {
            e.data.Target.css("background-color", "rgba(231,231,231,0.3)");
            e.data.Target.trigger("onMousedown");
        });
        this.Target.bind("mouseup", this, function (e) {
            // e.data.Target.css("background-color", "")
            e.data.Target.trigger("onMouseup");
        });
        this.Target.bind("click", this, function (e) {
            var id = e.currentTarget.Tag.ID;
            if (id === dev.prevMenuItemId) return;
            dev.prevMenuItemId = id;
            e.data.Target.trigger("onItemClick", $(this).prop("Tag"));
        });
    };
    $.fn.extend(dev.NavButton.prototype, {
        SetBackgroundColor: function (color) {
            this.Target.css("background-color", color);
        },
        SetPadding: function (padding) {
            this.Target.css("padding", padding);
        },
        SetTitle: function (title) {
            this.Text = title;
            $('.Title', this.Target).html(title);
        }
    });
})(jQuery);
//NavMenu 
(function ($) {
    dev.prevMenuItemId;
    function filter(menus) {
        var ms = [];
        if (dev.IsNull(menus)) return ms;
        menus = $(menus);
        for (var i = 0; i < menus.length; i++) {
            var m = null;
            if (dev.IsNull(menus[i].IsVisible)) ms.push(m = menus[i]);
            else if (menus[i].IsVisible || menus[i].IsVisible == "true") ms.push(m = menus[i]);
            if (m == null || dev.IsNull(m.Widgets) || $(m.Widgets).length == 0) continue;
            m.Widgets = Enumerable.From($(m.Widgets)).Where('s=>s.IsVisible.toString()=="true"').ToArray();
        }
        return ms;
    }
    dev.NavMenu = function (opt) {
        if (dev.IsNull(opt)) opt = { OpState: "hover", Menus: [] };
        $.extend(this, new dev.NavButton(opt));
        var $this = this;
        this.Menus = filter(opt.Menus);
        this.OpState = dev.IsNull(opt.OpState) ? "hover" : opt.OpState;
        this.MenuPanel = $("<div class='NavMenu'></div>");
        this.MenuPanel.appendTo(document.body);
        this.MenuPanel.bind("mouseenter", this, function (e) {
            clearTimeout(e.data.timeout);
            //判断改navbutton是否点中
            if (!e.data.Target.hasClass("Nav-Button-Select")) e.data.SetBackgroundColor("rgba(231,231,231,0.3)");
        });
        this.MenuPanel.bind("mouseleave", this, function (e) {
            e.data.timeout = setTimeout(function () {
                if (!e.data.Target.hasClass("Nav-Button-Select")) e.data.SetBackgroundColor("");
                if (e.data.MenuPanel.is(":animated")) e.data.MenuPanel.stop();
                e.data.MenuPanel.animate({ "height": 0 }, "fast");
                if (e.data.SubMenuPanel.is(":animated")) e.data.SubMenuPanel.stop();
                e.data.SubMenuPanel.animate({ "width": 0, "height": 0 }, "fast");
            }, 50);
        });
        this.SubMenuPanel = $("<div class='SubNavMenu'><div class='Content'></div></div>");
        this.SubMenuPanel.bind("mouseenter", this, function (e) {
            clearTimeout(e.data.timeout);
            clearTimeout(e.data.timeout1);
        });
        this.SubMenuPanel.bind("mouseleave", this, function (e) {
            $("[ItemIndex]", e.data.MenuPanel).removeClass("SelectItem");
            e.data.timeout = setTimeout(function () {
                if (!e.data.Target.hasClass("Nav-Button-Select")) e.data.SetBackgroundColor("");
                if (e.data.MenuPanel.is(":animated")) e.data.MenuPanel.stop();
                e.data.MenuPanel.animate({ "height": 0 }, "fast");
                if (e.data.SubMenuPanel.is(":animated")) e.data.SubMenuPanel.stop();
                e.data.SubMenuPanel.animate({ "width": 0, "height": 0 }, "fast");
            }, 50);
        });
        this.SubMenuPanel.appendTo(document.body);
        this.Target.prop("Tag", opt.Tag);
        for (var i = 0; i < this.Menus.length; i++) {
            this.MenuPanel.append($("<div class='SplitBar'><div class='Left'></div><div class='Center'></div><div class='Right'></div></div>"));
            var item = $("<div ItemIndex='" + i + "' class='Item'><span style='margin-left:20px'>" + this.Menus[i].Title + "</span></div>");
            //if (!dev.IsNull(this.Menus[i].Widgets) && dev.IsNull(this.Menus[i].Widgets.length)) this.Menus[i].Widgets = [this.Menus[i].Widgets];
            if (!dev.IsNull(this.Menus[i].Widgets) && $(this.Menus[i].Widgets).length > 0) item.append($("<div class='Arrow'></div>"));
            item.prop("Tag", this.Menus[i]);
            item.bind("mouseenter", $this, function (e) {
                var _item = $(this), p = _item.offset(),
                    w = e.data.MenuPanel.outerWidth();
                p.left += (w - 5), p.width = w + 6;
                _item.addClass("SelectItem");
                _item.prev().children().css("display", "none");
                _item.next().children().css("display", "none");
                e.data.ShowSubMenu(_item.prop("Tag").Widgets, p, _item.attr("ItemIndex"));
            });
            item.bind("mouseleave", $this, function (e) {
                var _item = $(this);
                e.data.timeout1 = setTimeout(function () {
                    _item.removeClass("SelectItem");
                    _item.prev().children().css("display", "block");
                    _item.next().children().css("display", "block");
                }, 50);
            });
            item.bind("click", $this, function (e) {
                var id = e.currentTarget.Tag.ID;
                if (id === dev.prevMenuItemId) return;
                dev.prevMenuItemId = id;
                e.data.Target.trigger("onItemClick", $(this).prop("Tag"));
            });
            this.MenuPanel.append(item);
        }
        this.Target.bind("onMouseenter", this, function (e) {
            if (e.data.OpState != "hover") return;
            var p = $this.Target.offset();
            $this.MenuPanel.css("top", ($this.Target.outerHeight() + p.top) + "px")
            $this.MenuPanel.css("left", p.left);
            if (!dev.IsNull(e.data.timeout)) clearTimeout(e.data.timeout);
            if (e.data.SubMenuPanel.is(":animated")) e.data.SubMenuPanel.stop();
            e.data.SubMenuPanel.animate({ "width": 0, "height": 0 }, "fast");
            $(".SplitBar", e.data.MenuPanel).children().css("display", "block");
            if (e.data.MenuPanel.is(":animated")) e.data.MenuPanel.stop();
            e.data.MenuPanel.animate({ "height": e.data.Menus.length * 42 }, "fast");
        });
        this.Target.bind("onMouseleave", this, function (e) {
            e.data.timeout = setTimeout(function () {
                if (e.data.MenuPanel.is(":animated")) e.data.MenuPanel.stop();
                e.data.MenuPanel.animate({ "height": 0 }, "fast");
            }, 50);
        });
        this.Target.bind("onMousedown", this, function (e) {
            var a = 1;
        });
        this.Target.bind("onMouseup", this, function (e) {
            if (e.data.OpState != "active") return;
            if (!dev.IsNull(e.data.timeout)) clearTimeout(e.data.timeout);
            if (e.data.SubMenuPanel.is(":animated")) e.data.SubMenuPanel.stop();
            e.data.SubMenuPanel.animate({ "width": 0, "height": 0 }, "fast");
            $(".SplitBar", e.data.MenuPanel).children().css("display", "block");
            if (e.data.MenuPanel.is(":animated")) e.data.MenuPanel.stop();
            e.data.MenuPanel.animate({ "height": e.data.Menus.length * 42 }, "fast");
        });
    };
    $.fn.extend(dev.NavMenu.prototype, {
        Layout: function () {
            var p = this.Target.offset();
            this.MenuPanel.css({ "height": "0px", "left": p.left + "px" });
            this.MenuPanel.css("width", this.Target.outerWidth() + "px");
            this.MenuPanel.css("top", (this.Target.outerHeight() + p.top) + "px")
        },
        ShowSubMenu: function (subMenus, p, parentIndex) {
            if (dev.IsNull(subMenus) || $(subMenus).length == 0) {
                if (this.SubMenuPanel.is(":animated")) this.SubMenuPanel.stop();
                this.SubMenuPanel.animate({ "width": 0, "height": 0 }, "fast");
                return;
            }
            subMenus = $(subMenus);
            p.height = subMenus.length * 42 - 2;
            this.SubMenuPanel.css({
                "top": p.top + "px", "left": p.left + "px",
                "width": p.width + "px", "height": p.height + "px"
            });
            var subMenuPanel = $(".Content", this.SubMenuPanel);
            subMenuPanel.empty();
            subMenuPanel.css("height", p.height + "px");
            subMenuPanel.css("width", (p.width - 6) + "px");
            subMenuPanel.append($("<div class='Arrow'></div>"));
            for (var i = 0; i < subMenus.length; i++) {
                if (i > 0) subMenuPanel.append($("<div class='SplitBar'><div class='Left'></div><div class='Center'></div><div class='Right'></div></div>"));
                var item = $("<div ItemIndex='" + i + "' ParentIndex='" + parentIndex + "' class='Item'><span style='margin-left:20px'>" + subMenus[i].Title + "</span></div>");
                item.prop("Tag", subMenus[i]);
                item.bind("mouseenter", this, function (e) {
                    var _item = $(this);
                    var arrow = $(".Arrow", $(".Content", e.data.SubMenuPanel));
                    if (_item.attr("ItemIndex") == "0") arrow.addClass("SelectArrow");
                    else arrow.removeClass("SelectArrow");
                    _item.addClass("SelectItem");
                    _item.prev().children().css("display", "none");
                    _item.next().children().css("display", "none");
                });
                item.bind("mouseleave", this, function (e) {
                    var _item = $(this);
                    _item.removeClass("SelectItem");
                    _item.prev().children().css("display", "block");
                    _item.next().children().css("display", "block");

                });
                item.bind("click", this, function (e) {
                    var id = e.currentTarget.Tag.ID;
                    if (id === dev.prevMenuItemId) {
                        return;
                    } else {
                        dev.prevMenuItemId = id;
                    }
                    e.data.Target.trigger("onItemClick", $(this).prop("Tag"));
                });
                subMenuPanel.append(item);
            }
            this.SubMenuPanel.css({ width: "0px", height: "0px" });
            if (this.SubMenuPanel.is(":animated")) this.SubMenuPanel.stop();
            this.SubMenuPanel.animate({ "width": p.width, "height": p.height }, "fast");
        },
        ClearCurrItemID: function (id) {
            if (dev.prevMenuItemId == id) dev.prevMenuItemId = null;
        }
    });
})(jQuery);
//NavPopup 
(function ($) {
    function filter(menus) {
        var ms = [];
        if (dev.IsNull(menus)) return ms;
        menus = $(menus);
        for (var i = 0; i < menus.length; i++) {
            var m = null;
            if (dev.IsNull(menus[i].IsVisible)) ms.push(m = menus[i]);
            else if (menus[i].IsVisible || menus[i].IsVisible == "true") ms.push(m = menus[i]);
            if (m == null || dev.IsNull(m.Widgets) || $(m.Widgets).length == 0) continue;
            m.Widgets = Enumerable.From($(m.Widgets)).Where('s=>s.IsVisible.toString()=="true"').ToArray();
        }
        return ms;
    }
    dev.NavPopup = function (opt) {
        function open(np) {
            if (!dev.IsNull(np.timeout)) clearTimeout(np.timeout);
            $this.Layout();
            if (np.PopupPanel.is(":animated")) np.PopupPanel.stop();
            if (np.VerticalAlign == "left") {
                np.PopupPanel.animate({ width: np.PopupWidth, height: np.PopupHeight }, "fast");
            }
            else if (np.VerticalAlign == "right") {
                var p = np.Target.offset();
                var l = p.left + np.Left + np.Target.outerWidth();
                np.PopupPanel.css("left", (l - np.PopupPanel.outerWidth()) + "px");
                np.PopupPanel.animate({ width: np.PopupWidth, height: np.PopupHeight, left: l - np.PopupWidth }, "fast");
            }
            else if (np.VerticalAlign == "center") {
                np.PopupPanel.css("width", np.PopupWidth + "px");
                np.PopupPanel.animate({ height: np.PopupHeight }, "fast");
            }
        }
        function close(np) {
            if (np.PopupPanel.is(":animated")) np.PopupPanel.stop();
            if (np.VerticalAlign == "left") np.PopupPanel.animate({ width: 0, height: 0 }, "fast");
            else if (np.VerticalAlign == "right") {
                var p = np.Target.offset();
                np.PopupPanel.animate({ width: 0, height: 0, left: p.left + np.Left + np.Target.outerWidth() }, "fast");
            }
            else if (np.VerticalAlign == "center") np.PopupPanel.animate({ height: 0 }, "fast");
        }
        if (dev.IsNull(opt)) opt = { OpState: "hover", PopupWidth: 720, PopupHeight: 360 };
        $.extend(this, new dev.NavButton(opt));
        var $this = this; this.Content = opt.Content;
        this.Left = dev.IsNumber(opt.Left) ? opt.Left : 0;
        if (!dev.IsNull(opt.VerticalAlign)) this.VerticalAlign = opt.VerticalAlign.toLowerCase();
        if (this.VerticalAlign != "right" || this.VerticalAlign != "center") this.VerticalAlign = "left";
        this.InitVerticalAlign = this.VerticalAlign;
        this.Menus = filter(opt.Menus);
        this.OpState = dev.IsNull(opt.OpState) ? "hover" : opt.OpState;
        this.PopupWidth = dev.IsNumber(opt.PopupWidth) ? opt.PopupWidth : parseInt(opt.PopupWidth);
        this.PopupHeight = dev.IsNumber(opt.PopupHeight) ? opt.PopupHeight : parseInt(opt.PopupHeight);
        this.PopupPanel = $("<div class='NavPopup' style='width:0px;height:0px'></div>");
        this.PopupPanel.append($(this.Content));
        if (!dev.IsNull(this.Menus) && this.Menus.length > 0) {
            if (this.Menus.length > 4) this.PopupWidth = 720;
            else this.PopupWidth = 180 * this.Menus.length;
            var defIconCls = "icon-Maintence";
            for (var i = 0; i < this.Menus.length; i++) {
                if (i < 4) {
                    var div = $("<div Column='" + i + "' style='position:absolute;top:0px;width:180px;'></div>");
                    var h = (!dev.IsNull(this.Menus[i].Widgets) && !dev.IsNull(this.Menus[i].Widgets.length))
                        ? (this.Menus[i].Widgets.length + 1) * 28 : 28;
                    div.css({ "left": (180 * i) + "px", "height": h + "px" });
                    var titleDiv = $("<div class='Item-Title'>" + this.Menus[i].Title + "</div>")
                    titleDiv.prop("Tag", this.Menus[i]);
                    if (this.Menus[i].Url) {
                        titleDiv.addClass("Item-Active");
                        titleDiv.bind("click", this, function (e) {
                            e.data.Target.trigger("onItemClick", $(this).prop("Tag"));
                        });
                    }
                    var item = $("<div style='width:100%;'></div>").append(titleDiv);
                    for (var j = 0; j < this.Menus[i].Widgets.length; j++) {
                        var iconCls = this.Menus[i].Widgets[j].IconCls ? this.Menus[i].Widgets[j].IconCls : defIconCls;
                        iconCls = this.Menus[i].Widgets[j].Icon ? dev.InsertIconRule(dev.App.TempStyle, ".icon" + this.Menus[i].Widgets[j].ID, this.Menus[i].Widgets[j].Icon) : iconCls;
                        var subItem = $("<a class='Item'><div class='" + iconCls + " Icon'></div>" + this.Menus[i].Widgets[j].Title + "</a>");
                        subItem.prop("Tag", this.Menus[i].Widgets[j]);
                        subItem.bind("click", this, function (e) {
                            e.data.Target.trigger("onItemClick", $(this).prop("Tag"));
                        });
                        item.append(subItem);
                    }
                    div.append(item);
                    this.PopupPanel.append(div);
                }
                else {
                    var ds = $("[Column]", this.PopupPanel);
                    var div = null, h = 0;
                    for (var j = 0; j < ds.length; j++) {
                        var _d = $(ds[j]);
                        if (j == 0 || parseInt(_d.css("height")) < h) {
                            div = _d, h = parseInt(_d.css("height"));
                        }
                    }
                    if (div != null) {
                        var h = (!dev.IsNull(this.Menus[i].Widgets) && !dev.IsNull(this.Menus[i].Widgets.length))
                        ? (this.Menus[i].Widgets.length + 1) * 28 : 28;
                        div.css("height", (div.height() + h + 14) + "px");
                        div.append($("<div class='SplitBar'><div class='Left'></div><div class='Center'></div><div class='Right'></div></div>"));
                        var titleDiv = $("<div class='Item-Title'>" + this.Menus[i].Title + "</div>")
                        titleDiv.prop("Tag", this.Menus[i]);
                        if (this.Menus[i].Url) {
                            titleDiv.addClass("Item-Active");
                            titleDiv.bind("click", this, function (e) {
                                e.data.Target.trigger("onItemClick", $(this).prop("Tag"));
                            });
                        }
                        var item = $("<div style='width:100%;'></div>").append(titleDiv);
                        for (var j = 0; j < this.Menus[i].Widgets.length; j++) {
                            var iconCls = this.Menus[i].Widgets[j].IconCls ? this.Menus[i].Widgets[j].IconCls : defIconCls;
                            iconCls = this.Menus[i].Widgets[j].Icon ? dev.InsertIconRule(dev.App.TempStyle, ".icon" + this.Menus[i].Widgets[j].ID, this.Menus[i].Widgets[j].Icon) : iconCls;
                            var subItem = $("<a class='Item'><div class='" + iconCls + " Icon'></div>" + this.Menus[i].Widgets[j].Title + "</a>");
                            subItem.prop("Tag", this.Menus[i].Widgets[j]);
                            subItem.append(subItem);
                            subItem.bind("click", this, function (e) {
                                e.data.Target.trigger("onItemClick", $(this).prop("Tag"));
                            });
                            item.append(subItem);
                        }
                        div.append(item);
                    }
                }
            }
            var ds = $("[Column]", this.PopupPanel);
            var ph = 0;
            for (var i = 0; i < ds.length; i++) {
                if (i == 0 || $(ds[i]).height() > ph) ph = $(ds[i]).height();
            }
            this.PopupPanel.css("height", (this.PopupHeight = (ph + 6)) + "px");
        }
        this.PopupPanel.appendTo(document.body);
        this.PopupPanel.bind("mouseenter", this, function (e) {
            clearTimeout(e.data.timeout);
            e.data.SetBackgroundColor("#008dbf");
        });
        this.PopupPanel.bind("mouseleave", this, function (e) {
            e.data.timeout = setTimeout(function () { e.data.SetBackgroundColor(""); close(e.data); }, 50);
        });
        this.Target.bind("onMouseenter", this, function (e) {
            if (e.data.OpState == "hover") open(e.data);
        });
        this.Target.bind("onMouseleave", this, function (e) {
            e.data.timeout = setTimeout(function () { close(e.data); }, 50);
        });
        this.Target.bind("onMousedown", this, function (e) {

        });
        this.Target.bind("onMouseup", this, function (e) {
            if (e.data.OpState == "active") open(e.data);
        });
    };
    $.fn.extend(dev.NavPopup.prototype, {
        Layout: function () {
            this.VerticalAlign = this.InitVerticalAlign;
            var p = this.Target.offset();
            this.PopupPanel.css("top", (this.Target.outerHeight() + p.top) + "px");
            if (this.VerticalAlign == "left") {
                if (p.left + this.Left + this.PopupWidth > $(window).width()) {
                    if (p.left + this.Left + this.Target.outerWidth() < this.PopupWidth) {
                        this.VerticalAlign = "center";
                        this.PopupPanel.css("left", (p.left + this.Left - (this.PopupWidth - this.Target.outerWidth()) / 2) + "px");
                    }
                    else {
                        this.VerticalAlign = "right";
                        this.PopupPanel.css("left", (p.left + this.Left + this.Target.outerWidth() - this.PopupWidth) + "px");
                    }
                }
                else this.PopupPanel.css("left", (p.left + this.Left) + "px");
            }
            if (this.VerticalAlign == "right") {
                if (p.left + this.Left + this.Target.outerWidth() < this.PopupWidth) {
                    if (p.left + this.Left + this.PopupWidth > $(window).width()) {
                        this.VerticalAlign = "center";
                        this.PopupPanel.css("left", (p.left + this.Left - (this.PopupWidth - this.Target.outerWidth()) / 2) + "px");
                    }
                    else {
                        this.VerticalAlign = "left";
                        this.PopupPanel.css("left", (p.left + this.Left) + "px");
                    }
                }
                else this.PopupPanel.css("left", (p.left + this.Left + this.Target.outerWidth() - this.PopupWidth) + "px");
            }
            if (this.VerticalAlign == "center")
                this.PopupPanel.css("left", (p.left + this.Left - (this.PopupWidth - this.Target.outerWidth()) / 2) + "px");
        },
        SetContent: function (el) {
            this.Content = el;
            this.PopupPanel.empty();
            this.PopupPanel.append($(this.Content));
        }
    });
})(jQuery);
//NavTip 
(function ($) {
    function open(np) {
        if (!dev.IsNull(np.timeout)) clearTimeout(np.timeout);
        if (np.PopupPanel.is(":animated")) np.PopupPanel.stop();
        np.PopupPanel.animate({ height: np.PopupHeight }, "fast");
    }
    function close(np) {
        if (np.PopupPanel.is(":animated")) np.PopupPanel.stop();
        np.PopupPanel.animate({ height: 0 }, "fast");
    }
    dev.NavTip = function (opt) {
        if (dev.IsNull(opt)) opt = { OpState: "hover", PopupWidth: 720, PopupHeight: 360 };
        $.extend(this, new dev.NavButton(opt));
        var $this = this; this.Content = opt.Content;
        this.OpState = dev.IsNull(opt.OpState) ? "hover" : opt.OpState;
        this.PopupWidth = dev.IsNumber(opt.PopupWidth) ? opt.PopupWidth : parseInt(opt.PopupWidth);
        this.PopupHeight = dev.IsNumber(opt.PopupHeight) ? opt.PopupHeight : parseInt(opt.PopupHeight);
        this.PopupPanel = $("<div class='NavTip' style='width:" + this.PopupWidth + "px;height:0px'></div>");
        this.PopupPanel.append($("<div class='Arrow'></div>"));
        this.ContentPanel = $("<div class='Content'></div>");
        this.ContentPanel.css("width", (this.PopupWidth - 2) + "px");
        this.ContentPanel.css("height", (this.PopupHeight - 7) + "px");
        this.ContentPanel.append($(this.Content));
        this.PopupPanel.append($(this.ContentPanel));
        this.PopupPanel.appendTo(document.body);
        this.PopupPanel.bind("mouseenter", this, function (e) {
            clearTimeout(e.data.timeout);
            e.data.SetBackgroundColor("#008dbf");
        });
        this.PopupPanel.bind("mouseleave", this, function (e) {
            e.data.timeout = setTimeout(function () { e.data.SetBackgroundColor(""); close(e.data); }, 50);
        });
        this.Target.bind("onMouseenter", this, function (e) {
            if (e.data.OpState == "hover") open(e.data);
        });
        this.Target.bind("onMouseleave", this, function (e) {
            e.data.timeout = setTimeout(function () { close(e.data); }, 50);
        });
        this.Target.bind("onMousedown", this, function (e) {

        });
        this.Target.bind("onMouseup", this, function (e) {
            if (e.data.OpState == "active") open(e.data);
        });
    };
    $.fn.extend(dev.NavTip.prototype, {
        Layout: function () {
            var p = this.Target.offset();
            this.PopupPanel.css("top", (this.Target.outerHeight() + p.top - 5) + "px");
            this.PopupPanel.css("left", (p.left - (this.PopupWidth - this.Target.outerWidth()) / 2) + "px");
        },
        SetContent: function (el) {
            this.Content = el;
            this.ContentPanel.empty();
            this.ContentPanel.append($(this.Content));
        },
        Open: function () {
            open(this);
        },
        Close: function () {
            this.SetBackgroundColor("");
            close(this);
        }
    });
})(jQuery);
//NavBox 
(function ($) {
    dev.NavBox = function (opt) {
        function open(np) {
            if (!dev.IsNull(np.timeout)) clearTimeout(np.timeout);
            if (np.PopupPanel.is(":animated")) np.PopupPanel.stop();
            if (np.VerticalAlign == "left") {
                np.PopupPanel.animate({ width: np.PopupWidth, height: np.PopupHeight }, "fast");
            }
            else if (np.VerticalAlign == "right") {
                var p = np.Target.offset();
                var l = p.left + np.Left + np.Target.outerWidth();
                np.PopupPanel.css("left", (l - np.PopupPanel.outerWidth()) + "px");
                np.PopupPanel.animate({ width: np.PopupWidth, height: np.PopupHeight, left: l - np.PopupWidth }, "fast");
            }
            else if (np.VerticalAlign == "center") {
                np.PopupPanel.css("width", np.PopupWidth + "px");
                np.PopupPanel.animate({ height: np.PopupHeight }, "fast");
            }
        }
        function close(np) {
            if (np.PopupPanel.is(":animated")) np.PopupPanel.stop();
            if (np.VerticalAlign == "left") np.PopupPanel.animate({ width: 0, height: 0 }, "fast");
            else if (np.VerticalAlign == "right") {
                var p = np.Target.offset();
                np.PopupPanel.animate({ width: 0, height: 0, left: p.left + np.Left + np.Target.outerWidth() }, "fast");
            }
            else if (np.VerticalAlign == "center") np.PopupPanel.animate({ height: 0 }, "fast");
        }
        if (dev.IsNull(opt)) opt = { OpState: "hover", PopupWidth: 300, PopupHeight: 240 };
        $.extend(this, new dev.NavButton(opt));
        var $this = this; this.Content = opt.Content, this.Fixed = false;
        this.Left = dev.IsNumber(opt.Left) ? opt.Left : 0;
        if (!dev.IsNull(opt.VerticalAlign)) this.VerticalAlign = opt.VerticalAlign.toLowerCase();
        if (this.VerticalAlign != "right" || this.VerticalAlign != "center") this.VerticalAlign = "left";
        this.InitVerticalAlign = this.VerticalAlign;
        this.OpState = dev.IsNull(opt.OpState) ? "hover" : opt.OpState;
        this.PopupWidth = dev.IsNumber(opt.PopupWidth) ? opt.PopupWidth : parseInt(opt.PopupWidth);
        this.PopupHeight = dev.IsNumber(opt.PopupHeight) ? opt.PopupHeight : parseInt(opt.PopupHeight);
        this.PopupPanel = $("<div class='NavPopup' style='width:0px;height:0px'></div>");
        this.Shot = $("<div class='Shot icon-h-shot'></div>").appendTo(this.PopupPanel);
        this.Shot.bind("click", function () { $this.SetFixed(!$this.Fixed); });
        this.PopupPanel.append($(this.Content));
        this.PopupPanel.appendTo(document.body);
        this.PopupPanel.bind("mouseenter", this, function (e) {
            if ($this.Fixed) return;
            clearTimeout(e.data.timeout);
            e.data.SetBackgroundColor("#008dbf");
        });
        this.PopupPanel.bind("mouseleave", this, function (e) {
            if ($this.Fixed) return;
            e.data.timeout = setTimeout(function () { e.data.SetBackgroundColor(""); close(e.data); }, 50);
        });
        this.Target.bind("onMouseenter", this, function (e) {
            if ($this.Fixed) return;
            if (e.data.OpState == "hover") open(e.data);
        });
        this.Target.bind("onMouseleave", this, function (e) {
            if ($this.Fixed) { e.data.SetBackgroundColor("#008dbf"); return; }
            e.data.timeout = setTimeout(function () { close(e.data); }, 50);
        });
        this.Target.bind("onMousedown", this, function (e) {

        });
        this.Target.bind("onMouseup", this, function (e) {
            if ($this.Fixed) return;
            if (e.data.OpState == "active") open(e.data);
        });
    };
    $.fn.extend(dev.NavBox.prototype, {
        Layout: function () {
            this.VerticalAlign = this.InitVerticalAlign;
            var p = this.Target.offset();
            this.PopupPanel.css("top", (this.Target.outerHeight() + p.top) + "px");
            if (this.VerticalAlign == "left") {
                if (p.left + this.Left + this.PopupWidth > $(window).width()) {
                    if (p.left + this.Left + this.Target.outerWidth() < this.PopupWidth) {
                        this.VerticalAlign = "center";
                        this.PopupPanel.css("left", (p.left + this.Left - (this.PopupWidth - this.Target.outerWidth()) / 2) + "px");
                    }
                    else {
                        this.VerticalAlign = "right";
                        this.PopupPanel.css("left", (p.left + this.Left + this.Target.outerWidth() - this.PopupWidth) + "px");
                    }
                }
                else this.PopupPanel.css("left", (p.left + this.Left) + "px");
            }
            if (this.VerticalAlign == "right") {
                if (p.left + this.Left + this.Target.outerWidth() < this.PopupWidth) {
                    if (p.left + this.Left + this.PopupWidth > $(window).width()) {
                        this.VerticalAlign = "center";
                        this.PopupPanel.css("left", (p.left + this.Left - (this.PopupWidth - this.Target.outerWidth()) / 2) + "px");
                    }
                    else {
                        this.VerticalAlign = "left";
                        this.PopupPanel.css("left", (p.left + this.Left) + "px");
                    }
                }
                else this.PopupPanel.css("left", (p.left + this.Left + this.Target.outerWidth() - this.PopupWidth) + "px");
            }
            if (this.VerticalAlign == "center")
                this.PopupPanel.css("left", (p.left + this.Left - (this.PopupWidth - this.Target.outerWidth()) / 2) + "px");
        },
        SetContent: function (el) {
            var c = $(this.Content); c.remove();
            this.PopupPanel.append(this.Content = el);
        },
        Clear: function () {
            this.Target.triggerHandler("onClosing");
        },
        SetPopupWidth: function (width) {
            if (!dev.IsNumber(width)) return;
            this.PopupWidth = width;
            this.PopupPanel.css("width", width + "px");
            this.Layout();
        },
        SetFixed: function (fixed) {
            if (this.Fixed == fixed) return; this.Fixed = fixed;
            this.Shot.removeClass(fixed ? "icon-h-shot" : "icon-v-shot");
            this.Shot.addClass(fixed ? "icon-v-shot" : "icon-h-shot");
        },
        ClosePopup: function () {
            this.SetBackgroundColor("");
            this.PopupPanel.css({ width: 0, height: 0 });
        }
    });
})(jQuery);
//MenuInit 
(function ($) {
    function GetIconCls(iconCls, icon) {
        var ic = iconCls;
        if (!dev.IsString(ic) && dev.IsString(icon)) {
            var e = icon.lastIndexOf('.');
            if (e > 0) {
                var s = icon.lastIndexOf('/');
                if (s < 0) s = 0;
                if (e - s > 0) {
                    ic = "maptool_" + icon.substring(s + 1, e);
                    dev.InsertRule(dev.App.TempStyle, "." + ic,
                        "background: url('" + icon + "') no-repeat center center;");
                }
            }
        }
        return ic;
    };
    function GetMenu(id, items) {
        var menu = $('<div class="easyui-menu" id="' + id + '"></div>');
        var list = dev.GroupBy(items, "Group", "Order");
        $(list).each(function (j, n) {
            $(n.Items).each(function (i, m) {
                var ic = GetIconCls(m.IconCls, m.Icon);
                var item = $("<div id=\"" + m.Name + "\" data-options="
                    + "\"iconCls:'" + ic + "'\">" + m.Title + "</div>");
                item.appendTo(menu);
            });
            $("<div class='menu-sep'></div>").appendTo(menu);
        });
        $(":last", menu).remove();
        return menu;
    };
    function Menu_Simple(subSystems, target) {
        var subs = $.grep($(subSystems), function (n, i) { return n.IsVisible === "true"; });
        var f = dev.IsNull(target.SystemTheme.Align) || target.SystemTheme.Align.toLowerCase() != "right";
        subs = dev.OrderBy(subs, "Order", f ? dev.OrderWay.ASC : dev.OrderWay.DESC, true);
        for (var i = 0; i < subs.length; i++) {
            var iconCls = subs[i].IconCls;
            if (dev.IsNull(iconCls)) iconCls = dev.InsertIconRule(dev.App.TempStyle, ".Icon" + subs[i].ID, subs[i].Icon)
            var navBtn = null;
            if (subs[i].Type === "Popup") {
                navBtn = new dev.NavPopup({
                    ID: subs[i].ID, IconCls: iconCls, Text: subs[i].Title, Left: -1,
                    TrigonVisible: true, VerticalAlign: "left", Menus: subs[i].Menus
                });
            }
            else if (subs[i].Type === "Tip") {
                navBtn = new dev.NavTip({
                    ID: subs[i].ID, IconCls: iconCls, Text: subs[i].Title,
                    PopupWidth: 300, PopupHeight: 240,
                    Content: "<div style='height:100%;width:100%;background-color:#FFFFFF'><div style='height:32px;width:100%;background-color:#00779f'></div></div>"
                });
            }
            else if (subs[i].Type === "Menu") {
                navBtn = new dev.NavMenu({
                    ID: subs[i].ID, IconCls: iconCls, Text: subs[i].Title,
                    TrigonVisible: true, Menus: subs[i].Menus, Tag: subs[i]
                });
            }
            else if (subs[i].Type === "Box") {
                navBtn = new dev.NavBox({
                    ID: subs[i].ID, IconCls: iconCls, Text: subs[i].Title, Tag: subs[i],
                    PopupWidth: subs[i].BoxSize.Width || subs[i].Size.Width, PopupHeight: subs[i].BoxSize.Height || subs[i].Size.Height
                });
            }
            else {
                navBtn = new dev.NavButton({ ID: subs[i].ID, IconCls: iconCls, Text: subs[i].Title, TrigonVisible: false, Tag: subs[i] });
            }
            if (navBtn != null) {
                target.NavButtons.push(navBtn);
                dev.App.TopPanel.centerContent.append(navBtn.Target);
                navBtn.Target.bind("onItemClick", function (e, s) {
                    if (dev.IsNull(s) || dev.IsNull(s.DockStyle) || dev.IsNull(s.Url)) return;
                    //获取对应navBtn
                    for (var i = 0; i < target.NavButtons.length; i++) {
                        target.NavButtons[i].Target.removeClass("Nav-Button-Select");
                        target.NavButtons[i].SetBackgroundColor("");
                    }
                    $(this).addClass("Nav-Button-Select");
                    target.WidgetLoad(s, this);
                });
                if (target.SystemTheme.Align) navBtn.Target.css("float", target.SystemTheme.Align);
                if (subs[i].Type === "Box" && !dev.IsNull(subs[i].BoxUrl) && subs[i].IsBoxLoad === "true")
                    target.SetContent(subs[i].BoxUrl, subs[i].ID);
            }
        }
    };
    function GetParent(item) {
        return (function (item) {
            switch (item.DockParent.toLocaleLowerCase()) {
                case "full": return $(document.body);
                case "main": return dev.App.MainPanel;
                case "fill": return dev.App.FillPanel;
                case "center": return dev.App.CenterPanel;
                case "map": return dev.App.MapPanel;
                default: return dev.App.MainPanel;
            }
        })(item);
    };
    dev.MenuInit = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        this.Target = $(this);
        this.SystemTheme = opt.SystemTheme;
        this.NavButtons = [];
    };
    $.fn.extend(dev.MenuInit.prototype, {
        Init: function () {
            Menu_Simple(this.SystemTheme.SubSystems, this);
        },
        Layout: function () {
            for (var i = 0; i < this.NavButtons.length; i++) {
                if (this.NavButtons[i].Layout === undefined) continue;
                this.NavButtons[i].Layout();
            }
        },
        WidgetLoad: function (item, menuButton) {
            if (!dev.App.IsWidget) dev.App.ClearPreWidget();
            this.IsWidget = true;
            var parent = null, content = item.Url, isTab = false;
            switch (item.DockStyle.toUpperCase()) {
                case dev.WidgetLayout.Left:
                    if (!dev.IsNull(item.Size.Width)) {
                        var w = parseInt(item.Size.Width);
                        if (!isNaN(w)) dev.App.LeftPanel.SetWidth(w);
                    }
                    dev.App.LeftPanel.SetMinimize(false);
                    if (dev.App.LeftPanel.IsTab) {
                        isTab = true;
                        parent = dev.App.LeftPanel.Tab;
                        content = {
                            ID: item.ID,
                            Name: item.Title,
                            IsDeleted: true,
                            IsSelected: true,
                            Url: item.Url,
                            Parameters: item.Parameters
                        };
                        dev.App.WidgetClear = "RemoveID";
                        dev.App.WidgetParam = item.ID;
                    }
                    else parent = dev.App.LeftPanel;
                    break;
                case dev.WidgetLayout.Right:
                    parent = dev.App.RightPanel;
                    dev.App.WidgetClear = "Clear";
                    dev.App.WidgetParam = null;
                    break;
                case dev.WidgetLayout.Bottom:
                    parent = dev.App.BottomPanel;
                    //dev.App.BottomPanel.SetVisible(true);
                    dev.App.WidgetClear = "Clear";
                    dev.App.WidgetParam = null;
                    break;
                case dev.WidgetLayout.Float:
                    parent = dev.App.GetWindow(item.ID);
                    //dev.App.RightPanel.SetVisible(true);
                    var container = dev.IsNull(item.DockParent) ? $(document.body) : GetParent(item);
                    if (dev.IsNull(parent) || parent.length == 0) {
                        parent = new dev.Window({
                            ID: item.ID,
                            TriggerEl: menuButton,
                            Title: item.Title,
                            IconCls: item.IconCls,
                            Parent: container.Target,
                            IsMaximize: dev.IsNull(item.IsMaximize) ? false : item.IsMaximize === "true",
                            Maximizable: dev.IsNull(item.Maximizable) ? true : item.Maximizable === "true",
                            Minimizable: dev.IsNull(item.Minimizable) ? true : item.Minimizable === "true",
                            Modal: dev.IsNull(item.Modal) ? true : item.Modal === "true",
                            Draggable: dev.IsNull(item.Draggable) ? true : item.Draggable === "true",
                            Left: parseFloat(item.Position.X),
                            Top: parseFloat(item.Position.Y),
                            Resizable: dev.IsNull(item.Resizable) ? true : item.Resizable === "true",
                            IsDestroy: dev.IsNull(item.IsDestroy) ? true : item.IsDestroy === "true",
                            Height: parseFloat(item.Size.Height),
                            Width: parseFloat(item.Size.Width),
                            Url: item.Url,
                            Parameters: item.Parameters,
                            Content: item.Content
                        });
                        parent.Target.one("onClosed", function (s, e) {
                            if (parent.IsDestroy) parent.Destroy();
                        });
                        dev.App.WidgetClear = "Close";
                        dev.App.WidgetParam = null;
                    }

                    break;
                case dev.WidgetLayout.Fill:
                    parent = dev.App.FillPanel;
                    dev.App.WidgetClear = 'Clear';
                    dev.App.WidgetParam = null;
                    break;
                    //dev.App.TabPanel.SetVisible(false);dev.App.RightPanel.SetVisible(false);dev.App.BottomPanel.SetVisible(false);
                case dev.WidgetLayout.FloatHTML:
                    if (dev.IsNull(item.DockParent)) return;
                    //dev.App.RightPanel.SetVisible(true);
                    var container = GetParent(item);
                    if (!dev.IsNull(container.Target)) var childfloat = container.Target.find("iframe#" + item.ID);
                    else childfloat = container.find("iframe#" + item.ID);
                    var strStyle = "position:absolute;background-color:transparent;left:"
                                   + item.Position.X + "px;top:" + item.Position.Y + "px;height:" + item.Size.Height + "px" + ";width:" + item.Size.Width + "px;";
                    parent = {};
                    parent.Target = container.Target;
                    parent.WidgetLayout = dev.WidgetLayout.FloatHTML;
                    parent.frame = dev.CreateFrameBase(item.Url, false, item.ID, strStyle);
                    var waitbox = new dev.UCWaitBox(parent.Target);
                    parent.frame.bind('load', { frame: parent.frame[0], parent: parent.frame, parameters: item.Parameters }, function (e) {
                        dev.CallWidgetCommunication(e.data.frame, e.data.parent, e.data.parameters);
                        e.data.parent.css("z-index", '4');
                        e.data.parent.triggerHandler("onLoaded");
                        waitbox.Close();
                    });
                    dev.App.WidgetClear = 'remove';
                    dev.App.WidgetParam = dev.WidgetLayout.FloatHTML;
                    break;
            }
            dev.App.WidgetParent = parent;
            var child = parent.Target.find("iframe#" + item.ID);
            if ((dev.IsNull(child) || child.length === 0)) {
                item.ScrollVisible = dev.IsNull(item.ScrollVisible) ? false : item.ScrollVisible.toString() === "true";
                if (!dev.IsNull(this.Target))
                    this.Target.triggerHandler("onWidgetChanged");
                if (!dev.IsNull(this.currentItem) && this.currentItem.ID !== item.ID) {//当前插件与前一个插件不是同一个
                    if (this.currentItem.DockStyle.toUpperCase() === dev.WidgetLayout.Left && dev.App.LeftPanel.IsTab) {
                        this.currentParent.RemoveID(this.currentItem.ID);
                        dev.App.LeftPanel.SetVisible(false);//
                    }
                    else if (!dev.IsNull(this.currentParent.Clear)) this.currentParent.Clear();
                    else if (!dev.IsNull(this.currentParent.Close)) this.currentParent.Close();
                    else if (!dev.IsNull(this.currentParent.WidgetLayout)) {
                        this.currentParent.frame.triggerHandler("onClosing");
                        this.currentParent.frame.remove();
                    }
                    if (!dev.IsNull(this.currentParent.SetVisible) && this.currentParent !== parent) this.currentParent.SetVisible(false);
                }
                if (isTab) parent.Add(content, item.ScrollVisible, item.ID, item.Parameters);
                else if (parent.Add) parent.Add(content, item.Parameters, item.ID);
                else if (!dev.IsNull(parent.WidgetLayout)) {
                    if (dev.IsNull(childfloat) || childfloat.length === 0) {
                        waitbox.Show();
                        if (parent.Add) parent.Add(parent.frame);
                        else parent.Target.append(parent.frame);
                    }
                }
            }
            else if (isTab) parent.SelectID(item.ID);
            else if (!dev.IsNull(parent.WidgetLayout) && !dev.IsNull(childfloat) && childfloat.length > 0) return;
            if (!dev.IsNull(parent.SetVisible)) parent.SetVisible(true);
            if (!dev.IsNull(parent.SetMinimize)) parent.SetMinimize(false);
            if (!dev.IsNull(parent.SetTitle)) parent.SetTitle(item.Title);
            if (item.DockStyle.toUpperCase() === dev.WidgetLayout.Left && dev.App.LeftPanel.IsTab) {
                dev.App.LeftPanel.SetTitle(item.Title);
                dev.App.LeftPanel.SetVisible(true);
                dev.App.LeftPanel.SetMinimize(false);
            }
            this.currentItem = item;
            this.currentParent = parent;
        },
        CloseCurrentWidget: function () {
            if (!dev.IsNull(this.currentItem)) {
                if (this.currentItem.DockStyle.toUpperCase() === dev.WidgetLayout.Left && dev.App.LeftPanel.IsTab) {
                    this.currentParent.RemoveID(this.currentItem.ID);
                    dev.App.LeftPanel.SetVisible(false);//zzy?
                }
                else if (!dev.IsNull(this.currentParent.Clear)) this.currentParent.Clear();
                else if (!dev.IsNull(this.currentParent.Close)) this.currentParent.Close();
                if (!dev.IsNull(this.currentParent.SetVisible) && this.currentParent !== parent) this.currentParent.SetVisible(false);
                //cwj 关闭当前页清除对应ID
                for (var i = 0; i < this.NavButtons.length; i++) {
                    if (!dev.IsNull(this.NavButtons[i].ClearCurrItemID)) this.NavButtons[i].ClearCurrItemID(this.currentItem.ID);
                }
            }
            this.currentItem = null;
        },
        GetNavButton: function (id) {
            if (this.NavButtons.length <= 0) return;
            var currentButton;
            for (var i = 0; i < this.NavButtons.length; i++) {
                var button = this.NavButtons[i];
                if (button.ID === id) { currentButton = button; break; }
            }
            return currentButton;
        },
        SetContent: function (element, id, parameters) {
            if (dev.IsNull(element) || dev.IsNull(id)) return;
            var currentButton = this.GetNavButton(id);
            if (dev.IsNull(currentButton) || dev.IsNull(currentButton.SetContent)) return;
            if (dev.IsString(element)) {
                var frame = dev.CreateFrame(element, false);
                frame.bind('load', function () {
                    dev.CallWidgetCommunication(frame[0], currentButton, parameters);
                    currentButton.Target.triggerHandler("onLoaded");
                });
                element = frame;
            }
            currentButton.SetContent(element);
        }
    });
})(jQuery);
//Box 
(function ($) {
    function getPadding(box) {
        var ctd = $(".CTD", box.Target);
        var p = {
            l: parseInt(ctd.css("padding-left")),
            t: parseInt(ctd.css("padding-top")),
            r: parseInt(ctd.css("padding-right")),
            b: parseInt(ctd.css("padding-bottom"))
        };
        p.w = p.l + p.r, p.h = p.t + p.b;
        return p;
    }
    function setScrollBar(box, vsv, hsv) {
        var p = getPadding(box), v = vsv == "visible", h = hsv == "visible";
        box.VerScrollVisibility = v, box.HorScrollVisibility = h;
        box.c.css("width", box.Target.width() - p.w - (v ? 9 : 0) + "px");
        $(".scrollVTD", box.Target).css("width", (v ? "" : "0px"));
        box.c.css("height", box.Target.height() - p.h - (h ? 9 : 0) + "px");
        $(".scrollHTD", box.Target).css("height", (h ? "" : "0px"));
    }
    function scrollBarRefresh(box) {
        var w = box.Target.width(), h = box.Target.height(),
            pw = box.c.width(), ph = box.c.height(), p = getPadding(box),
            sw = box.el.outerWidth(), sh = box.el.outerHeight();
        if (box.VerScroll == "hidden" && box.HorScroll == "auto") {
            if (pw < sw) { setScrollBar(box, "hidden", "visible"); _h(); }
            else box.el.css({ "margin-left": 0 });
        }
        else if (box.VerScroll == "auto" && box.HorScroll == "auto") {
            if (pw < sw) {
                setScrollBar(box, "hidden", "visible");
                ph = box.c.height(), sh = box.el.outerHeight();
                if (ph < sh) _vh(); else { box.el.css({ "margin-top": 0 }); _h(); }
            }
            else if (ph < sh) {
                setScrollBar(box, "visible", "hidden");
                pw = box.c.width(), sw = box.el.outerWidth();
                if (pw < sw) _vh(); else { box.el.css({ "margin-left": 0 }); _v(); }
            }
            else { box.el.css({ "margin-left": 0, "margin-top": 0 }); }
        }
        else {
            if (ph < sh) { setScrollBar(box, "visible", "hidden"); _v(); }
            else box.el.css({ "margin-top": 0 });
        }
        function _v() {
            sh = box.el.outerHeight();
            var sch = ph * (h - 16) / sh;
            box.svbtn.css("height", sch + "px");
            var top = parseFloat(box.el.css("margin-top"));
            if (sh + top < ph) top = ph - sh;
            box.el.css("margin-top", top + "px");
            top = top * (h - 16 - sch) / (ph - sh);
            if (top + sch + 16 > ph) top = ph - sch - 16;
            if (top < 0) top = 0;
            box.svbtn.css("top", top + "px");
        }
        function _h() {
            sw = box.el.outerWidth();
            var scw = pw * (w - 16) / sw;
            box.shbtn.css("width", scw + "px");
            var left = parseFloat(box.el.css("margin-left"));
            if (sw + left < pw) left = pw - sw;
            box.el.css("margin-left", left + "px");
            left = left * (w - 16 - scw) / (pw - sw);
            if (left + scw + 16 > pw) left = pw - scw - 16;
            if (left < 0) left = 0;
            box.shbtn.css("left", left + "px");
        }
        function _vh() {
            setScrollBar(box, "visible", "visible");
            pw -= 9, ph -= 9, _v(), _h();
        }
    }
    dev.Box = function (opt) {
        if (dev.IsNull(opt)) opt = {}; var $this = this;
        if (dev.IsNull(opt.Target)) {
            opt.Target = $("<div class='dev-box'></div>");
            opt.Target.appendTo(dev.IsDOMElementEx(opt.Parent) ? opt.Parent : document.body);
        }
        else {
            if (!opt.Target.hasClass("dev-box")) opt.Target.addClass("dev-box");
            if (!opt.Content) {
                var el = $(":first-child", opt.Target);
                if (el.length > 0) opt.Content = el[0];
                else opt.Content = opt.Target.html();
                opt.Target.html("");
            }
            if (!opt.Padding) {
                var p = dev.GetPadding(opt.Target);
                opt.Padding = p.t + "px " + p.r + "px " + p.b + "px " + p.l + "px";
            }
            opt.Target.css("padding", "0px");
        }
        if (!dev.IsNull(opt.Width)) opt.Target.width(opt.Width);
        if (!dev.IsNull(opt.Height)) opt.Target.height(opt.Height);
        var w = opt.Target[0].style.width, h = opt.Target[0].style.height;
        if (!dev.IsNull(w)) w = w.substring(w.length - 1);
        if (!dev.IsNull(h)) h = h.substring(h.length - 1);
        if (w == "%" || h == "%") this.Stretched = true;
        if (dev.IsBoolean(opt.Stretched)) this.Stretched = opt.Stretched;
        else if (opt.Stretched) this.Stretched = opt.Stretched === "true";
        $.extend(this, this.control = new dev.Control(opt)), funExt(this), this.Target.prop("$this", this);
        this.HasBorder = dev.IsBoolean(opt.HasBorder) ? opt.HasBorder : opt.HasBorder !== "false";
        if (opt.HasBorder === false || opt.HasBorder === "false") this.Target.css("border", "0px");
        this.HorScroll = "hidden", this.VerScroll = "auto", this.Speed = 100;//鼠标滚动的速率（px）
        if (!dev.IsNull(opt.HorScroll) && opt.HorScroll.toLowerCase() == "auto") this.HorScroll = "auto";
        if (!dev.IsNull(opt.VerScroll) && opt.VerScroll.toLowerCase() == "hidden") this.VerScroll = "hidden";
        $("<table class='Table B'><tr class='B'><td class='CTD B'><div class='box-content'></div></td>" +
            "<td class='scrollVTD B'><a scrollEl='0' class='upArrow'></a><a scrollEl='1' class='downArrow'>" +
            "</a><div scrollEl='2' class='scrollVButton'></div></td></tr><tr class='B'><td class='scrollHTD B'>" +
            "<a scrollEl='3' class='leftArrow'></a><a scrollEl='4' class='rightArrow'></a><div scrollEl='5' " +
            "class='scrollHButton'></div></td><td class='placeTD B'></td></tr></table>").appendTo(this.Target);
        this.el = null, this.c = $(".box-content", this.Target);//内容盛放的容器
        if (!dev.IsNull(opt.Content)) {
            this.el = $(opt.Content);
            if (this.el.length == 0) this.el = $("<div>" + opt.Content + "</div>");
            this.c.append(this.el); this.el.css("position", "absolute");
        }
        this.svbtn = $(".scrollVButton", this.Target);//垂直滚动按钮
        this.shbtn = $(".scrollHButton", this.Target);//水平滚动按钮
        if (opt.Padding) $(".CTD", this.Target).css("padding", opt.Padding);
        var isMouseDown = false, positionX = 0, positionY = 0, clientLeft = 0,
            clientTop = 0, scrollType = null, $this = this;
        this.Target.bind("mousewheel DOMMouseScroll", this, function (event, delta) {
            if (dev.IsNull($this.el)) return;
            var ph = $this.c.height(), sh = $this.el.outerHeight();
            if (ph >= sh) return;
            var sch = $this.svbtn.height(), p = getPadding($this);
            var top = parseInt($this.el.css("margin-top"));
            var hit = event.originalEvent.wheelDelta / 120;
            if (isNaN(hit)) hit = -event.originalEvent.detail / 3;
            top = top + $this.Speed * hit;
            if (hit > 0 && top > 0) top = 0;
            else if (sh + top < ph) top = ph - sh;
            $this.el.css("margin-top", top + "px");
            top = top * (ph + p.h - 16 - sch) / (ph - sh);
            $this.svbtn.css("top", top + "px");
        });
        $(".scrollVButton,.scrollHButton", this.Target).bind("mousedown", function (e) {
            if ($(this).hasClass("scrollVButton")) {
                scrollType = "V", positionY = e.clientY, clientTop = parseFloat($(this).css("top"));
            } else {
                scrollType = "H", positionX = e.clientX, clientLeft = parseFloat($(this).css("left"));
            }
            $(this).addClass("scrollButton-Down");
            if (this.setCapture) {
                this.setCapture(); this.onmouseup = mouseUp;
                this.onmousemove = function (ev) { scrollBtnMouseMove(ev || event); };
            }
            else if (window.captureEvents) {
                window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP);
                this.onmouseup = mouseUp;
                this.onmousemove = scrollBtnMouseMove;
            }
            $this.Target.addClass("user_unselect");
        });
        $(".downArrow,.upArrow,.leftArrow,.rightArrow", this.Target).bind("mousedown", function (e) {
            isMouseDown = true, currElement = this, scrollType = "H";
            if ($(this).hasClass("downArrow") || $(this).hasClass("upArrow")) scrollType = "V";
            if (currElement.setCapture) { currElement.setCapture(); currElement.onmouseup = mouseUp; }
            else { window.captureEvents(Event.MOUSEUP); this.onmouseup = mouseUp; }
            setTimeout(_scroll), $this.Target.addClass("user_unselect");
        });
        function _scroll() {
            if (!isMouseDown) return;
            var ph = $this.c.height(), pw = $this.c.width(), sh = $this.el.outerHeight(), sw = $this.el.outerWidth(),
                sch = $this.svbtn.height(), scw = $this.shbtn.width(), top = parseInt($this.el.css("margin-top")),
                left = parseInt($this.el.css("margin-left")), p = getPadding($this);
            top = parseFloat($this.el.css("margin-top")), left = parseFloat($this.el.css("margin-left"));
            if ($(currElement).hasClass("upArrow")) { top += 10; if (top > 0) { top = 0; isMouseDown = false; } }
            else if ($(currElement).hasClass("downArrow")) { top -= 10; if (sh + top < ph) { top = ph - sh; isMouseDown = false; } }
            else if ($(currElement).hasClass("leftArrow")) { left += 10; if (left > 0) { left = 0; isMouseDown = false; } }
            else if ($(currElement).hasClass("rightArrow")) { left -= 10; if (sw + left < pw) { left = pw - sw; isMouseDown = false; } }
            if ($(currElement).hasClass("upArrow") || $(currElement).hasClass("downArrow")) {
                $this.el.css("margin-top", top + "px");
                top = top * (ph + p.h - 16 - sch) / (ph - sh);
                $this.svbtn.css("top", top + "px");
            } else {
                $this.el.css("margin-left", left + "px");
                left = left * (pw + p.w - 16 - scw) / (pw - sw);
                $this.shbtn.css("left", left + "px");
            }
            $this.Target.trigger("onScroll", { ScrollType: scrollType }); setTimeout(_scroll, 75);
        }
        function mouseUp() {
            isMouseDown = false, scrollType = null, $this.Target.removeClass("user_unselect");
            $(".scrollVButton,.scrollHButton", this.Target).removeClass("scrollButton-Down");
            if (this.releaseCapture) {
                this.releaseCapture();
                this.onmousemove = this.onmouseup = null;
            } else if (window.releaseEvents) {
                window.releaseEvents(Event.MOUSEMOVE | Event.MOUSEUP);
                document.onmousemove = document.onmouseup = null;
            }
        }
        function scrollBtnMouseMove(e) {
            if (scrollType == "V") {
                var ph = $this.c.height(), sh = $this.el.outerHeight(), p = getPadding($this),
                    sch = $this.svbtn.height(), top = clientTop + (e.clientY - positionY);
                if (top < 0) top = 0;
                else if (top + sch + 16 > ph + p.h) top = ph + p.h - sch - 16;
                $this.svbtn.css("top", top + "px");
                top = top * (ph - sh) / (ph + p.h - sch - 16);
                $this.el.css("margin-top", top + "px");
            }
            else if (scrollType == "H") {
                var pw = $this.c.width(), sw = $this.el.outerWidth(), p = getPadding($this),
                    scw = $this.shbtn.width(), left = clientLeft + (e.clientX - positionX);
                if (left < 0) left = 0;
                else if (left + scw + 16 > pw + p.w) left = pw + p.w - scw - 16;
                $this.shbtn.css("left", left + "px");
                left = left * (pw - sw) / (pw + p.w - scw - 16);
                $this.el.css("margin-left", left + "px");
            }
            $this.Target.trigger("onScroll", { ScrollType: scrollType });
        }
        if ($(document.body).has(this.Target).length > 0) this.Layout();
    };
    function funExt(control) {
        $.fn.extend(control, {
            Layout: function () {
                setScrollBar(this, "hidden", "hidden");
                if (!dev.IsNull(this.el)) scrollBarRefresh(this);
            },
            SetContent: function (el) {
                this.Clear();
                if (dev.IsNull(el)) return;
                this.el = $(el);
                if (this.el.length == 0) this.el = $("<div>" + el + "</div>");
                this.c.append(this.el); this.el.css("position", "absolute");
                this.Layout();
            },
            Clear: function () {
                this.c.empty();
                this.el = null;
            },
            Animate: function (p) {
                var $this = this;
                if (this.Target.is(":animated")) this.Target.stop();
                this.Target.animate(p, {
                    duration: "fast", queue: false,
                    complete: function () {
                        $this.SetSize({ Width: p.width, Height: p.height });
                        $this.Target.triggerHandler("onRefresh");
                    }
                });
            },
            SetWidth: function (width) {
                this.Target.css('width', this.Width = width);
                this.Layout();
                this.Target.trigger("onResize");//大小变化事件
            },
            SetHeight: function (height) {
                this.Target.css('height', this.Height = height);
                this.Layout();
                this.Target.trigger("onResize");//大小变化事件
            },
            SetSize: function (size) {
                this.Target.css('width', this.Width = size.Width);
                this.Target.css('height', this.Height = size.Height);
                this.Layout();
                this.Target.triggerHandler("onResize");//大小变化事件
            },
            SetScrollV: function (scrolltop) {
                //获取当前top
                if (dev.IsNull(scrolltop)) return;
                var ph = this.c.height(), sh = this.el.outerHeight(), p = getPadding(this), sch = this.svbtn.height();
                var top1 = ((ph + p.h - sch - 16) / (sh - ph)) * scrolltop
                this.svbtn.css("top", top1 + "px");
                var top = top1 * (ph - sh) / (ph + p.h - sch - 16);
                this.el.css("margin-top", top + "px");
            },
            GetScrollTop: function (offsety) {
                if (dev.IsNull(offsety)) return 0;
                var stop = this.c.offset().top;
                return offsety - stop;
            },
            Revert: function () {
                this.svbtn.css("top", "0px");
                this.el.css("margin-top", "0px");
            }
        });
    }
})(jQuery);
//Window(弹出窗) 
(function ($) {
    function GetIconCls(icon, id) {
        if (!dev.IsNull(icon))
            return dev.InsertIconRule(dev.App.TempStyle, "." + id + "WinIcon", icon);
        return "icon-add";
    };
    function GetContent(url, con, win, isScrolling) {
        if (!dev.IsNull(url)) {
            var waitbox = new dev.UCWaitBox(win.Target);
            var frame = dev.CreateFrame(url, isScrolling);
            frame.bind('load', function () {
                dev.CallWidgetCommunication(frame[0], win, win.Parameters);
                waitbox.Close();
                win.Target.trigger("onLoaded", win);
            });
            waitbox.Show();
            var iframePanel = $("#iframePanel", win.Win);
            if (iframePanel.length == 0) iframePanel = $("<div id='iframePanel' style='width:" + (win.Width - 2)
                + "px;height:" + (win.Height - 32) + "px;margin:31px 1px 1px 1px;background:#fff;'></div>");
            return iframePanel.html(frame);
        }
        else if (!dev.IsNull(con)) {
            return dev.IsString(con) ? $('<p>' + con + '</p>') : con;
        }
        return null;
    };
    function ResizeBarLayout(win) {
        for (var i = 0; i < win.ResizeBar.length; i++) {
            var el = $(win.ResizeBar[i]);
            if (el.hasClass("S")) {
                el.css("width", (win.Width - 3) + "px");
            }
            else if (el.hasClass("N")) {
                var w = 44;
                if (win.Maximizable) w += 40;
                if (win.Minimizable) w += 40;
                el.css("width", (win.Width - w) + "px");
            }
            else if (el.hasClass("E")) {
                el.css("height", (win.Height - 32) + "px");
            }
            else if (el.hasClass("W")) {
                el.css("height", (win.Height - 3) + "px");
            }
        }
    };
    function GetStartPosition(win) {
        var el = (dev.IsDOMElement(win.TriggerEl) || (dev.IsjQueryObject(win.TriggerEl)
            && dev.IsDOMElement(win.TriggerEl[0]))) ? $(win.TriggerEl) : null;
        if (el != null) {
            var p = el.offset(), p1 = win.Parent.offset();
            var l = p.left - p1.left, t = p.top - p1.top;
            if (l < 0) l = 0;
            else if (l > win.Parent.outerWidth()) l = win.Parent.outerWidth();
            if (t < 0) t = 0;
            else if (t > win.Parent.outerHeight()) t = win.Parent.outerHeight();
            return { top: t, left: l };
        }
        else {
            if (!dev.IsObject(win.StartPoint))
                win.StartPoint = { top: dev.PositionEnum.Center, left: dev.PositionEnum.Center };
            var sp = { top: win.StartPoint.top, left: win.StartPoint.left };
            if (!isNaN(parseInt(sp.top))) sp.top = parseInt(sp.top);
            else {
                var h = win.Parent.outerHeight();
                switch (sp.top.toUpperCase()) {
                    case dev.PositionEnum.Top: sp.top = 0; break;
                    case dev.PositionEnum.Bottom: sp.top = h; break;
                    case dev.PositionEnum.Center: sp.top = parseInt(h / 2); break;
                    default: sp.top = parseInt(h / 2);
                }
            }
            if (!isNaN(parseInt(sp.left))) sp.left = parseInt(sp.left);
            else {
                var w = win.Parent.outerWidth();
                switch (sp.left.toUpperCase()) {
                    case dev.PositionEnum.Left: sp.left = 0; break;
                    case dev.PositionEnum.Right: sp.left = w; break;
                    case dev.PositionEnum.Center: sp.left = parseInt(w / 2); break;
                    default: sp.left = parseInt(w / 2);
                }
            }
            return sp;
        }
    };
    function ButtonsLayout(window) {
        if (window.IsMinimize) {
            window.btnMaximize.css("display", "none");
            if (window.Minimizable) {
                window.btnMinimize.css("display", "block");
                window.btnMinimize.css("right", "40px");
                if (window.IsMaximize) window.btnMinimize.addClass("Minimized-Max");
                else window.btnMinimize.addClass("Minimized-Nor");
            }
            else window.btnMinimize.css("display", "none");
        }
        else {
            if (window.Maximizable) {
                window.btnMaximize.css("display", "block");
                if (window.Minimizable) {
                    window.btnMinimize.css("right", "80px");
                    window.btnMinimize.css("display", "block");
                    window.btnMinimize.removeClass("Minimized-Nor");
                    window.btnMinimize.removeClass("Minimized-Max");
                }
                else window.btnMinimize.css("display", "none");
            }
            else {
                window.btnMaximize.css("display", "none");
                if (window.Minimizable) {
                    window.btnMinimize.css("right", "40px");
                    window.btnMinimize.css("display", "block");
                    window.btnMinimize.removeClass("Minimized-Nor");
                    window.btnMinimize.removeClass("Minimized-Max");
                }
                else window.btnMinimize.css("display", "none");
            }
        }
    };
    function GetAlign(align) {
        if (dev.IsNull(align)) return "absolute";
        align = align.toLowerCase();
        if (align == "left" || align == "right" || align == "top"
            || align == "bottom" || align == "center") return align;
        else if (align == "middle") return "center";
        return "absolute";
    };
    function GetTop(win) {
        if (win.VAlign == "top") return 0;
        if (win.VAlign == "absolute") return win.Top;
        var h = win.WinMask.parent().outerHeight() - win.Height;
        if (win.VAlign == "center") h = h / 2;
        return h < 0 ? 0 : h;
    };
    function GetLeft(win) {
        if (win.HAlign == "left") return 0;
        if (win.HAlign == "absolute") return win.Left;
        var w = win.WinMask.parent().outerWidth() - win.Width;
        if (win.HAlign == "center") w = w / 2;
        return w < 0 ? 0 : w;
    };
    dev.Window = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        this.ID = dev.IsNull(opt.ID) ? "window" + new Date().getTime() : opt.ID;
        this.MinHeight = 32; this.MinWidth = 172;
        this.Visible = dev.IsBoolean(opt.Visible) ? opt.Visible : opt.Visible !== "false";//是否显示
        this.IsMaximize = dev.IsBoolean(opt.IsMaximize) ? opt.IsMaximize : opt.IsMaximize === "true";//是否最大化
        this.IsMinimize = dev.IsBoolean(opt.IsMinimize) ? opt.IsMinimize : opt.IsMinimize === "true";//是否最小化
        this.Parent = (dev.IsDOMElement(opt.Parent) || (dev.IsjQueryObject(opt.Parent)
            && dev.IsDOMElement(opt.Parent[0]))) ? $(opt.Parent) : $(document.body);
        this.TriggerEl = opt.TriggerEl; this.StartPoint = opt.StartPoint;
        this.WinMask = $("<div class='Window-Mask'></div>").appendTo(this.Parent);
        this.Win = this.Target = $("<div class='Window' id='" + this.ID + "'></div>").appendTo(this.WinMask);
        this.Header = $("<div class='Header'></div>").appendTo(this.Win);
        this.IconCls = dev.IsNull(opt.IconCls) ? (!dev.IsNull(opt.Icon) ? GetIconCls(opt.Icon, this.ID) : "") : opt.IconCls;//窗口左上角的图标
        var iconEl = $("<div class='Icon " + this.IconCls + "'></div>").appendTo(this.Header);
        this.Title = dev.IsNull(opt.Title) ? "窗口标题" : opt.Title;//窗口的标题文本
        var titleEl = $("<div class='Title'>" + this.Title + "</div>").appendTo(this.Header);
        this.btnClose = $("<div class='CloseButton'></div>").appendTo(this.Header);
        this.btnMaximize = $("<div class='MaximizeButton' style='display:none;'></div>").appendTo(this.Header);
        this.btnMinimize = $("<div class='MinimizeButton' style='display:none;'></div>").appendTo(this.Header);
        this.Tools = dev.IsNull(opt.Tools) ? [] : opt.Tools;//窗体右上角添加自定义工具
        this.ZIndex = dev.IsNull(opt.ZIndex) ? 9999 : opt.ZIndex;//设置窗体索引
        this.IsDestroy = dev.IsBoolean(opt.IsDestroy) ? opt.IsDestroy : opt.IsDestroy !== "false";//是否关闭就销毁dev.App.PopBoxs
        this.HAlign = GetAlign(opt.HAlign);//窗体的水平停靠位置
        this.VAlign = GetAlign(opt.VAlign);//窗体的垂直停靠位置
        this.Top = dev.IsNumber(opt.Top) ? opt.Top : isNaN(parseInt(opt.Top)) ? 0 : parseInt(opt.Top);//窗体的上边位置
        this.Left = dev.IsNumber(opt.Left) ? opt.Left : isNaN(parseInt(opt.Left)) ? 0 : parseInt(opt.Left);//窗体的左边位置
        this.Width = dev.IsNumber(opt.Width) ? opt.Width : parseInt(opt.Width);//窗体的宽度
        this.Height = dev.IsNumber(opt.Height) ? opt.Height : parseInt(opt.Height);//窗体的高度
        if (isNaN(this.Width)) this.Width = 400;
        if (isNaN(this.Height)) this.Height = 300;
        this.Win.width(this.Width); this.Win.height(this.Height);
        this.Modal = dev.IsBoolean(opt.Modal) ? opt.Modal : opt.Modal === "true";//定义窗口是不是模态窗口
        this.Closeable = dev.IsBoolean(opt.Closeable) ? opt.Closeable : opt.Closeable === "true";//定义是否显示关闭按钮
        this.Maximizable = dev.IsBoolean(opt.Maximizable) ? opt.Maximizable : opt.Maximizable === "true";//定义是否显示最大化按钮
        this.Minimizable = dev.IsBoolean(opt.Minimizable) ? opt.Minimizable : opt.Minimizable === "true";//定义是否显示最小化按钮
        this.Resizable = dev.IsBoolean(opt.Resizable) ? opt.Resizable : opt.Resizable === "true",//定义窗口是否可调整尺寸
        this.Draggable = dev.IsBoolean(opt.Draggable) ? opt.Draggable : opt.Draggable === "true",//定义窗口是否可拖拽
        this.Parameters = opt.Parameters;
        this.Url = opt.Url;//窗体填充内容
        this.Content = opt.Content;//窗体填充内容
        this.Box = new dev.Box({ HasBorder: false, CSS: { "margin": "31px 1px 1px 1px" } });
        this.Win.append(this.Box.Target);
        if (!dev.IsNull(this.Url)) {
            this.Box.SetVisible(false);
            this.Win.append(GetContent(this.Url, null, this));
        }
        else if (!dev.IsNull(this.Content)) {
            this.Box.SetVisible(true);
            this.Box.SetContent(GetContent(null, this.Content, this));
            this.Target.trigger("onLoaded", this);
        }
        this.Win.append($("<div class='ResizeBar S'></div><div class='ResizeBar N'></div>" +
            "<div class='ResizeBar W'></div><div class='ResizeBar E'></div><div class='ResizeBar NW'></div>"
            + "<div class='ResizeBar SE'></div><div class='ResizeBar SW'></div>"));
        this.ResizeBar = $(".ResizeBar", this.Win);
        $.extend(this, this.Win); this.Left = GetLeft(this), this.Top = GetTop(this); var $this = this;
        this.oTop = this.Top, this.oLeft = this.Left, this.oWidth = this.Width, this.oHeight = this.Height;
        funExt(this);
        this.Layout();
        if (this.Visible) {
            if (this.IsMinimize) this.Minimize();
            else this.IsMaximize ? this.Maximize() : this.Normal();
        }
        (function () {
            var tempMask = $("<div style='z-index:9999;top:0;left:0;width:100%;height:100%;position:absolute;'></div>");
            var isMouseDown = false, currElement, elPos, elSize, mousePos;
            $this.Header.bind("mousedown", $this, function (e) {
                if (!e.data.Draggable) return;
                $(document.body).append(tempMask);
                isMouseDown = true, currElement = this;
                tempMask.css("cursor", $(this).css("cursor"));
                mousePos = { x: e.clientX, y: e.clientY };
                if (e.data.IsMinimize) elPos = { l: parseInt(e.data.WinMask.css("left")), t: parseInt(e.data.WinMask.css("top")) };
                else if (e.data.Modal) elPos = { l: parseInt(e.data.Win.css("left")), t: parseInt(e.data.Win.css("top")) };
                else elPos = { l: parseInt(e.data.WinMask.css("left")), t: parseInt(e.data.WinMask.css("top")) };
                if (currElement.setCapture) {
                    currElement.setCapture(); currElement.onmouseup = HeaderMouseUp;
                    currElement.onmousemove = function (ev) { HeaderMouseMove(ev || event); };
                }
                else {
                    if (!dev.IsNull(dev.App.TopPanel) && e.data.ID == "exportWin")
                        mousePos.y = mousePos.y + dev.App.TopPanel.Height;
                    $(document).bind("mouseup", HeaderMouseUp).bind("mousemove", HeaderMouseMove);
                }
                e.preventDefault();
            });
            function HeaderMouseUp() {
                tempMask.remove(); isMouseDown = false;
                if (!$this.IsMaximize || $this.IsMinimize) {
                    $this.oTop = $this.Top, $this.oLeft = $this.Left, $this.oWidth = $this.Width, $this.oHeight = $this.Height;
                }
                currElement.releaseCapture ? (currElement.releaseCapture(), currElement.onmousemove = currElement.onmouseup = null)
                    : ($(document).unbind("mouseup", HeaderMouseUp).unbind("mousemove", HeaderMouseMove));
            }
            function HeaderMouseMove(e) {
                if (!isMouseDown) return;
                $this.VAlign = $this.HAlign = "absolute";
                var top = elPos.t + (e.clientY - mousePos.y);
                var left = elPos.l + (e.clientX - mousePos.x);
                if ($this.IsMinimize) {
                    if (top < 0) top = 0;
                    else if (top + $this.WinMask.outerHeight() > $this.Parent.outerHeight())
                        top = $this.Parent.outerHeight() - $this.WinMask.outerHeight();
                    if (left < 0) left = 0;
                    else if (left + $this.WinMask.outerWidth() > $this.Parent.outerWidth())
                        left = $this.Parent.outerWidth() - $this.WinMask.outerWidth();
                    $this.WinMask.css({ top: ($this.Top = top) + "px", left: ($this.Left = left) + "px" });
                    return;
                }
                if (top < 0) top = 0;
                else if ($this.Modal && top + $this.Win.outerHeight() > $this.WinMask.outerHeight()) {
                    top = $this.WinMask.outerHeight() - $this.Win.outerHeight();
                    if (top < 0) top = 0;
                }
                else if (!$this.Modal && top + $this.WinMask.outerHeight() > $this.Parent.outerHeight()) {
                    top = $this.Parent.outerHeight() - $this.WinMask.outerHeight();
                    if (top < 0) top = 0;
                }
                if (left < 0) left = 0;
                else if ($this.Modal && left + $this.Win.outerWidth() > $this.WinMask.outerWidth()) {
                    left = $this.WinMask.outerWidth() - $this.Win.outerWidth();
                    if (left < 0) left = 0;
                }
                else if (!$this.Modal && left + $this.WinMask.outerWidth() > $this.Parent.outerWidth()) {
                    left = $this.Parent.outerWidth() - $this.WinMask.outerWidth();
                    if (left < 0) left = 0;
                }
                if ($this.Modal) $this.Win.css({ top: ($this.Top = top) + "px", left: ($this.Left = left) + "px" });
                else $this.WinMask.css({ top: ($this.Top = top) + "px", left: ($this.Left = left) + "px" });
            }

            $this.ResizeBar.bind("mousedown", $this, function (e) {
                if (e.data.IsMinimize || !e.data.Resizable) return;
                $(document.body).append(tempMask);
                isMouseDown = true, currElement = this;
                tempMask.css("cursor", $(this).css("cursor"));
                mousePos = { x: e.clientX, y: e.clientY };
                var target = e.data.Modal ? e.data.Win : e.data.WinMask;
                elSize = { h: target.outerHeight(), w: target.outerWidth() };
                elPos = { l: parseInt(target.css("left")), t: parseInt(target.css("top")) };
                if (currElement.setCapture) {
                    currElement.setCapture(); currElement.onmouseup = ResizeBarMouseUp;
                    currElement.onmousemove = function (ev) { ResizeBarMouseMove(ev || event); };
                }
                else $(document).bind("mouseup", ResizeBarMouseUp).bind("mousemove", ResizeBarMouseMove);
                e.preventDefault();
            });
            function ResizeBarMouseUp() {
                tempMask.remove(); isMouseDown = false;
                if (!$this.IsMaximize) {
                    $this.oTop = $this.Top, $this.oLeft = $this.Left, $this.oWidth = $this.Width, $this.oHeight = $this.Height;
                }
                currElement.releaseCapture ? (currElement.releaseCapture(), currElement.onmousemove = currElement.onmouseup = null)
                    : ($(document).unbind("mouseup", ResizeBarMouseUp).unbind("mousemove", ResizeBarMouseMove));
            }
            function ResizeBarMouseMove(e) {
                if (!isMouseDown) return;
                $this.VAlign = $this.HAlign = "absolute";
                var psize = $this.Modal ? { w: $this.WinMask.outerWidth(), h: $this.WinMask.outerHeight() }
                    : { w: $this.Parent.outerWidth(), h: $this.Parent.outerHeight() };
                var dw = e.clientX - mousePos.x, dh = e.clientY - mousePos.y;
                if ($(currElement).hasClass("S")) {
                    $this.Height = elSize.h + dh;
                    if ($this.Height < $this.MinHeight) $this.Height = $this.MinHeight;
                    else if ($this.Height + elPos.t > psize.h) $this.Height = psize.h - elPos.t;
                }
                else if ($(currElement).hasClass("N")) {
                    $this.Height = elSize.h - dh, $this.Top = elPos.t + dh;
                    if ($this.Height <= $this.MinHeight) { $this.Height = $this.MinHeight, $this.Top = elPos.t + elSize.h - $this.MinHeight; }
                    else if (-dh > elPos.t) { $this.Height = elSize.h + elPos.t, $this.Top = 0; }
                }
                else if ($(currElement).hasClass("E")) {
                    $this.Width = elSize.w + dw;
                    if ($this.Width < $this.MinWidth) $this.Width = $this.MinWidth;
                    else if ($this.Width + elPos.l > psize.w) $this.Width = psize.w - elPos.l;
                }
                else if ($(currElement).hasClass("W")) {
                    $this.Width = elSize.w - dw, $this.Left = elPos.l + dw;
                    if ($this.Width <= $this.MinWidth) { $this.Width = $this.MinWidth, $this.Left = elPos.l + elSize.w - $this.MinWidth; }
                    else if (-dw > elPos.l) { $this.Width = elSize.w + elPos.l, $this.Left = 0; }
                }
                else if ($(currElement).hasClass("NW")) {
                    $this.Height = elSize.h - dh, $this.Top = elPos.t + dh;
                    if ($this.Height <= $this.MinHeight) { $this.Height = $this.MinHeight, $this.Top = elPos.t + elSize.h - $this.MinHeight; }
                    else if (-dh > elPos.t) { $this.Height = elSize.h + elPos.t, $this.Top = 0; }

                    $this.Width = elSize.w - dw, $this.Left = elPos.l + dw;
                    if ($this.Width <= $this.MinWidth) { $this.Width = $this.MinWidth, $this.Left = elPos.l + elSize.w - $this.MinWidth; }
                    else if (-dw > elPos.l) { $this.Width = elSize.w + elPos.l, $this.Left = 0; }
                }
                else if ($(currElement).hasClass("SE")) {
                    $this.Height = elSize.h + dh;
                    if ($this.Height < $this.MinHeight) $this.Height = $this.MinHeight;
                    else if ($this.Height + elPos.t > psize.h) $this.Height = psize.h - elPos.t;

                    $this.Width = elSize.w + dw
                    if ($this.Width < $this.MinWidth) $this.Width = $this.MinWidth;
                    else if ($this.Width + elPos.l > psize.w) $this.Width = psize.w - elPos.l;
                }
                else if ($(currElement).hasClass("SW")) {
                    $this.Height = elSize.h + dh;
                    if ($this.Height < $this.MinHeight) $this.Height = $this.MinHeight;
                    else if ($this.Height + elPos.t > psize.h)
                        $this.Height = psize.h - elPos.t;

                    $this.Width = elSize.w - dw, $this.Left = elPos.l + dw;
                    if ($this.Width <= $this.MinWidth) { $this.Width = $this.MinWidth, $this.Left = elPos.l + elSize.w - $this.MinWidth; }
                    else if (-dw > elPos.l) { $this.Width = elSize.w + elPos.l, $this.Left = 0; }
                }
                $this.Layout();
            }
            $(window).resize(function () {
                $this.Layout();
                if ($this.HAlign == "absolute" && $this.VAlign == "absolute") return;
                $this.Left = GetLeft($this), $this.Top = GetTop($this);
                $this.oTop = $this.Top, $this.oLeft = $this.Left; $this.Layout();
            });

            $this.btnMaximize.bind("mousedown", $this, function (e) { e.stopPropagation(); });
            $this.btnMaximize.bind("click", $this, function (e) {
                if (!e.data.IsMaximize) {
                    e.data.oTop = e.data.Top, e.data.oLeft = e.data.Left;
                    e.data.oWidth = e.data.Width, e.data.oHeight = e.data.Height;
                }
                e.data.IsMaximize ? e.data.Normal() : e.data.Maximize();
            });

            $this.btnClose.bind("mousedown", $this, function (e) {
                e.stopPropagation();
            });

            $this.btnClose.bind("click", $this, function (e) {
                e.data.Close();
            });

            $this.btnMinimize.bind("mousedown", $this, function (e) { e.stopPropagation(); });
            $this.btnMinimize.bind("click", $this, function (e) {
                if (!e.data.IsMinimize) e.data.Minimize();
                else e.data.IsMaximize ? e.data.Maximize() : e.data.Normal();
            });
        }());
        dev.App.PopBoxs.push(this);
    };
    function funExt(control) {
        $.fn.extend(control, {
            SetIconCls: function (cls) {
                if (dev.IsNull(cls)) return;
                var iconelement = $(".Icon", this.Header);
                if (dev.IsNull(iconelement)) return;
                if (!dev.IsNull(this.IconCls)) iconelement.removeClass(this.IconCls);
                iconelement.addClass(cls);
                this.IconCls = cls;
            },
            SetHAlign: function (align) {
                this.HAlign = GetAlign(align);
                this.Left = GetLeft(this);
                this.oLeft = this.Left;
            },
            SetVAlign: function (align) {
                this.VAlign = GetAlign(align);
                this.Top = GetTop(this);
                this.oTop = this.Top;
            },
            SetTitle: function (title) {
                $(".Title", this.Header).html(title);
            },
            SetWidth: function (width) {
                if (dev.IsNumber(width)) this.Layout(this.Width = width);
            },//设置窗体宽度
            SetHeight: function (height) {
                if (dev.IsNumber(height)) this.Layout(this.Height = this.oHeight = height);
            },//设置窗体高度
            SetSize: function (width, height) {
                if (dev.IsNumber(height) && dev.IsNumber(width)) {
                    this.Width = width, this.Height = height, this.Layout();
                }
            },//设置窗体大小
            SetTop: function (top) {
                if (dev.IsNumber(top)) this.Layout(this.Top = top);
            },//设置窗体与父容器上边边距
            SetLeft: function (left) {
                if (dev.IsNumber(left)) this.Layout(this.Left = left);
            },//设置窗体与父容器左边边距
            SetPosition: function (top, left) {
                if (dev.IsNumber(top) && dev.IsNumber(left)) {
                    this.Top = top, this.Left = left, this.Layout();
                }
            },//设置窗体相对于父窗体的位置
            SetContent: function (content) {
                this.Url = null;
                this.Box.SetVisible(true);
                this.Box.SetContent(content);
                $("#iframePanel", this.Win).empty();
                $("#iframePanel", this.Win).css("display", "none");
                this.Target.trigger("onLoaded", this);
            },//设置内容
            SetUrl: function (url, isScrolling) {
                if (dev.IsNull(url)) return;
                this.Box.SetVisible(false);
                this.Win.append(GetContent(url, null, this, isScrolling));
            },
            Open: function () {
                if (this.Visible) return;
                this.IsMaximize ? this.Maximize() : this.Normal();
            },//打开窗体
            Close: function () {
                if (!this.Visible) return;
                this.Target.triggerHandler("onClosing", { element: this, id: this.ID });
                var $this = this, sp = GetStartPosition(this);
                if (this.Modal) {
                    if (this.IsMinimize) {
                        this.WinMask.animate({ top: sp.top, left: sp.left }, "fast");
                        this.Win.animate({ width: 0, height: 0 }, {
                            duration: "fast", queue: false,
                            complete: function () {
                                $this.Visible = false; $this.WinMask.css("display", "none");
                                $this.Target.trigger("onClosed", { element: $this, id: $this.ID });
                            }
                        });
                    }
                    else {
                        this.Win.animate({ top: sp.top, left: sp.left, width: 0, height: 0 },
                        {
                            duration: "fast", queue: false,
                            complete: function () {
                                $this.Visible = false;
                                $this.WinMask.css("display", "none");
                                $this.Target.triggerHandler("onClosed", { element: $this, id: $this.ID });
                            }
                        });
                    }
                }
                else {
                    this.Win.animate({ width: 0, height: 0 }, "fast");
                    this.WinMask.animate({ top: sp.top, left: sp.left, width: 0, height: 0 },
                    {
                        duration: "fast", queue: false,
                        complete: function () {
                            $this.Visible = false; $this.WinMask.css("display", "none");
                            $this.Target.triggerHandler("onClosed", { element: $this, id: $this.ID });
                        }
                    });
                }
                this.Header.animate({ width: 0 }, "fast");
                this.Box.Animate({ width: 0, height: 0 });
            },//关闭窗体
            Destroy: function () {
                for (var i = 0; i < dev.App.PopBoxs.length; i++) {
                    if (dev.App.PopBoxs[i].ID === this.ID && dev.App.PopBoxs[i] === this) {
                        dev.App.PopBoxs.splice(i, 1); break;
                    }
                }
                this.WinMask.remove();
            },//销毁窗体
            Layout: function () {
                if (!this.Visible) return;
                var iframePanel = $("#iframePanel", this.Win);
                if (this.IsMinimize) {
                    if (this.oTop + this.MinHeight > this.Parent.outerHeight()) {
                        this.Top = this.oTop = this.Parent.outerHeight() - this.MinHeight;
                        if (this.Top < 0) this.Top = this.oTop = 0;
                    }
                    if (this.oLeft + this.MinWidth > this.Parent.outerWidth()) {
                        this.Left = this.oLeft = this.Parent.outerWidth() - this.MinWidth;
                        if (this.Left < 0) this.Left = this.oLeft = 0;
                    }
                    this.WinMask.css({ top: this.oTop, left: this.oLeft });
                    if (!dev.IsNull(this.Url)) iframePanel.css("display", "none");
                    return;
                }
                if (!dev.IsNull(this.Url)) iframePanel.css("display", "block");
                if (this.IsMaximize) {
                    this.Width = this.Parent.outerWidth();
                    this.Height = this.Parent.outerHeight();
                }
                if (this.Modal) {
                    this.WinMask.css({ width: this.Parent.outerWidth(), height: this.Parent.outerHeight() });
                    if (this.Top < 0) this.Top = this.oTop = 0;
                    else if (this.Top + this.Win.outerHeight() > this.WinMask.outerHeight()) {
                        this.Top = this.oTop = this.WinMask.outerHeight() - this.Win.outerHeight();
                        if (this.Top < 0) this.Top = this.oTop = 0;
                    }
                    if (this.Left < 0) this.Left = this.oLeft = 0;
                    else if (this.Left + this.Win.outerWidth() > this.WinMask.outerWidth()) {
                        this.Left = this.oLeft = this.WinMask.outerWidth() - this.Win.outerWidth();
                        if (this.Left < 0) this.Left = this.oLeft = 0;
                    }
                    this.Win.css({ width: this.Width, height: this.Height, top: this.Top, left: this.Left });
                }
                else {
                    if (this.Top < 0) this.Top = 0;
                    else if (this.Top + this.Height > this.Parent.outerHeight()) {
                        this.Top = this.Parent.outerHeight() - this.Height;
                        if (this.Top < 0) this.Top = 0;
                    }
                    if (this.Left < 0) this.Left = 0;
                    else if (this.Left + this.Width > this.Parent.outerWidth()) {
                        this.Left = this.Parent.outerWidth() - this.Width;
                        if (this.Left < 0) this.Left = 0;
                    }
                    this.WinMask.css({ width: this.Width, height: this.Height, top: this.Top, left: this.Left });
                    this.Win.css({ width: this.Width, height: this.Height, top: 0, left: 0 });
                }
                ResizeBarLayout(this);
                this.Header.css("width", (this.Width - 2) + "px");
                this.Box.SetSize({ Width: this.Width - 2, Height: this.Height - 32 });
                if (!dev.IsNull(this.Url)) iframePanel.css({ width: this.Width - 2, height: this.Height - 32 });
                this.Target.triggerHandler("onResize");//大小变化事件
            },//窗体布局刷新
            Maximize: function () {
                var $this = this, w = this.Parent.outerWidth(), h = this.Parent.outerHeight();
                if (!dev.IsNull(this.Url)) $("#iframePanel", this.Win).css("display", "block");
                this.WinMask.css("display", "block");
                if (this.Modal) {
                    this.WinMask.animate({ top: 0, left: 0, width: w, height: h }, "fast");
                    this.Win.animate({ top: 0, left: 0, width: w, height: h },
                    {
                        duration: "fast", queue: false,
                        complete: function () {
                            $this.Top = $this.Left = 0;
                            $this.Width = w, $this.Height = h;
                            $this.btnMaximize.addClass("Maximized");
                            $this.Visible = $this.IsMaximize = true; $this.IsMinimize = false;
                            ButtonsLayout($this); $this.Layout();
                        }
                    });
                }
                else {
                    this.Win.animate({ width: w, height: h }, "fast");
                    this.WinMask.animate({ top: 0, left: 0, width: w, height: h },
                    {
                        duration: "fast", queue: false,
                        complete: function () {
                            $this.Top = $this.Left = 0;
                            $this.Width = w, $this.Height = h;
                            $this.btnMaximize.addClass("Maximized");
                            $this.Visible = $this.IsMaximize = true; $this.IsMinimize = false;
                            ButtonsLayout($this); $this.Layout();
                        }
                    });
                }
                this.Header.animate({ width: w - 2 }, "fast");
                this.Box.Animate({ width: w - 2, height: h - 32 });
            },//窗体最大状态
            Normal: function () {
                var $this = this, t = this.oTop, l = this.oLeft, w = this.oWidth, h = this.oHeight;
                if (!dev.IsNull(this.Url)) $("#iframePanel", this.Win).css("display", "block");
                this.WinMask.css("display", "block");
                if (this.Modal) {
                    if (this.IsMinimize) {
                        this.WinMask.animate({
                            left: 0, width: this.Parent.outerWidth(),
                            top: 0, height: this.Parent.outerHeight()
                        }, "fast");
                    }
                    this.Win.animate({ top: t, left: l, width: w, height: h },
                    {
                        duration: "fast", queue: false,
                        complete: function () {
                            $this.Top = t, $this.Left = l;
                            $this.Width = w, $this.Height = h;
                            $this.btnMaximize.removeClass("Maximized");
                            $this.Visible = true; $this.IsMaximize = $this.IsMinimize = false;
                            ButtonsLayout($this); $this.Layout();
                        }
                    });
                }
                else {
                    this.Win.animate({ width: w, height: h }, "fast");
                    this.WinMask.animate({ top: t, left: l, width: w, height: h },
                    {
                        duration: "fast", queue: false,
                        complete: function () {
                            $this.Top = t, $this.Left = l;
                            $this.Width = w, $this.Height = h;
                            $this.btnMaximize.removeClass("Maximized");
                            $this.Visible = true; $this.IsMaximize = $this.IsMinimize = false;
                            ButtonsLayout($this); $this.Layout();
                        }
                    });
                }
                this.Header.animate({ width: w - 2 }, "fast");
                this.Box.Animate({ width: w - 2, height: h - 32 });
            },//窗体普通状态
            Minimize: function () {
                if (!this.Visible) return;
                var $this = this;
                if (this.Modal) {
                    this.Win.animate({ width: this.MinWidth, height: this.MinHeight, left: 0, top: 0 }, "fast");
                    this.WinMask.animate({ width: this.MinWidth, height: this.MinHeight, left: this.oLeft, top: this.oTop },
                    {
                        duration: "fast", queue: false,
                        complete: function () {
                            $this.IsMinimize = true;
                            ButtonsLayout($this); $this.Layout();
                        }
                    });
                }
                else {
                    if (this.oLeft + this.MinWidth > this.Parent.outerWidth())
                        this.oLeft = this.Parent.outerWidth() - this.MinWidth;
                    if (this.oTop + this.MinHeight > this.Parent.outerHeight())
                        this.oTop = this.Parent.outerHeight() - this.MinHeight;
                    this.Win.animate({ width: this.MinWidth, height: this.MinHeight, left: 0, top: 0 }, "fast");
                    this.WinMask.animate({ width: this.MinWidth, height: this.MinHeight, left: this.oLeft, top: this.oTop },
                    {
                        duration: "fast", queue: false,
                        complete: function () {
                            $this.IsMinimize = true;
                            ButtonsLayout($this); $this.Layout();
                        }
                    });
                }
                this.Header.animate({ width: this.MinWidth - 2 }, "fast");
                this.Box.Animate({ width: 0, height: 0 });
            },//窗体最小状态
            bind: function () {
                this.Target.bind(arguments[0], arguments[1], arguments[2]);
            },
            unbind: function (eventName) { this.Target.unbind(eventName); }
        });
    }
})(jQuery);
//Messager(消息窗) 
(function ($) {
    function GetCls(type) {
        if (dev.IsNull(type)) return "icon-Messager-info";
        var t = type.toLowerCase();
        if (t == "question" || t == "warn" ||
            t == "error") return "icon-Messager-" + t;
        else return "icon-Messager-info";
    };
    function GetAlign(align) {
        if (dev.IsNull(align)) return "center";
        align = align.toLowerCase();
        if (align == "left" || align == "right" || align == "top"
            || align == "bottom" || align == "center") return align;
        return "center";
    };
    function Show(t, message, callback, opt, f) {
        t.Callback = callback;
        t.WinMask.appendTo(t.Parent);
        if (dev.IsString(opt)) $("#iconDiv", t.Target).attr("class", GetCls(t.Type = opt));
        else if (!dev.IsNull(opt) && !dev.IsNull(opt.Type))
            $("#iconDiv", t.Target).attr("class", GetCls(t.Type = opt.Type));
        if (!dev.IsNull(opt)) {
            if (!dev.IsNull(opt.Width) && (dev.IsNumber(opt.Width) ||
                !isNaN(parseInt(opt.Width)))) t.Width = t.oWidth = parseInt(opt.Width);
            if (!dev.IsNull(opt.Height) && (dev.IsNumber(opt.Height) ||
                !isNaN(parseInt(opt.Height)))) t.Height = t.oHeight = parseInt(opt.Height);
            t.SetVAlign(dev.IsNull(opt.VAlign) ? "center" : opt.VAlign);
            t.SetHAlign(dev.IsNull(opt.HAlign) ? "center" : opt.HAlign);
            if (!dev.IsNull(opt.Title)) t.SetTitle(opt.Title);
        }
        else { t.SetVAlign(t.VAlign); t.SetHAlign(t.HAlign); }
        t.Visible = false; t.Open();
        $("#msgContent", t.Target).width(t.Width - 2);
        $("#msgContent", t.Target).height(t.Height - 32);
        var btnDiv = $("#btnDiv", t.Target);
        if (f && t.AutoVisible) setTimeout(function () { MoveOut(t); }, t.Timeout);
        btnDiv.width(f ? 60 : 132);
        $('#cancel', btnDiv).css("display", f ? "none" : "");
        btnDiv.css("margin-left", -btnDiv.outerWidth() / 2 + "px");
        $("#infoDiv", t.Target).width(t.Width - 64);
        $("#contentDiv", t.Target).width(t.Width - 2);
        t.SetButtonVisible(t.ButtonVisible);
        var infoDiv = $("#infoDiv", t.Target);
        infoDiv.empty();
        if (dev.IsString(message)) {
            var p = $("<p style='line-height:16px'>" + message + "</p>").appendTo(infoDiv);
            if (p.outerHeight() <= 16) p.css("margin-top", "10px");
        }
        else infoDiv.append(message);
    }
    function MoveOut(win) {
        var t = win.WinMask, d = win.Duration, e = win.Effect.toLowerCase();
        if (e === undefined || (e != "down" && e != "up")) { t.fadeOut(d); return; }
        var top = e == "down" ? $(window).height() : -t.outerHeight();
        t.animate({ top: top }, {
            duration: d, queue: false,
            complete: function () { t.remove(); }
        });
    }
    dev.Messager = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        if (dev.IsNull(opt.ID)) opt.ID = "msg" + new Date().getTime();
        opt.Visible = opt.Draggable = true, opt.Url = null;
        if (dev.IsNull(opt.Title)) opt.Title = "信息提示";
        opt.VAlign = GetAlign(opt.VAlign); opt.HAlign = GetAlign(opt.HAlign);
        opt.IsMinimize = opt.IsMaximize = opt.Resizable
            = opt.Minimizable = opt.Maximizable = false;
        opt.Modal = dev.IsBoolean(opt.Modal) ? opt.Modal : opt.Modal !== "false";
        var av = dev.IsBoolean(opt.AutoVisible) ? opt.AutoVisible : opt.AutoVisible === "true";
        if (av) opt.Modal = false;
        opt.Width = dev.IsNumber(opt.Width) ? opt.Width : parseInt(opt.Width);//窗体的宽度
        opt.Height = dev.IsNumber(opt.Height) ? opt.Height : parseInt(opt.Height);//窗体的高度
        if (isNaN(opt.Width)) opt.Width = 250; if (isNaN(opt.Height)) opt.Height = 150;
        var content = $("<div id='msgContent' style='position:relative;overflow:hidden'></div>");
        var contentDiv = $("<div id='contentDiv' style='position:absolute;top:0px;left:0px;'></div>").appendTo(content);
        var iconDiv = $("<div id='iconDiv' style='position:absolute;top:10px;left:10px;height:32px;width:32px'></div>").appendTo(contentDiv);
        var infoDiv = $("<div id='infoDiv' style='position:absolute;top:10px;left:52px;'></div>").appendTo(contentDiv);
        var btnDiv = $("<div id='btnDiv' style='height:36px;position:absolute;bottom:0px;left:50%'></div>").appendTo(content);
        var btnOK = $("<a id='ok' tabindex='0' class='easyui-linkbutton' style='width:60px;height:26px;'></a>").appendTo(btnDiv);
        var btnCancel = $("<a id='cancel' tabindex='1' class='easyui-linkbutton' style='width:60px;height:26px;margin-left:12px'></a>").appendTo(btnDiv);
        opt.Content = content; var win = new dev.Window(opt);
        win.Type = dev.IsNull(opt.Type) ? "info" : opt.Type;
        iconDiv.addClass(GetCls(win.Type)); win.AutoVisible = av;
        win.Timeout = dev.IsNumber(opt.Timeout) ? opt.Timeout : 5000;
        win.Effect = dev.IsNull(opt.Effect) ? undefined : opt.Effect;
        win.Duration = dev.IsNull(opt.Duration) ? "normal" : opt.Duration;
        win.OK = dev.IsNull(opt.OK) ? "确定" : opt.OK; win.Cancel = dev.IsNull(opt.Cancel) ? "取消" : opt.Cancel;
        btnOK.linkbutton({ text: win.OK }); btnCancel.linkbutton({ text: win.Cancel });
        $('#ok', btnDiv).click(function () { win.Close(); if (win.Callback) win.Callback(true); });
        $('#cancel', btnDiv).click(function () { win.Close(); if (win.Callback) win.Callback(false); });
        win.Alert = function (message, opt, callback) { Show(this, message, callback, opt, true); };
        win.Confirm = function (message, callback, opt) { Show(this, message, callback, opt, false); };
        win.SetButtonVisible = function (visible) {
            $("#btnDiv", this.Target).css("display", (this.ButtonVisible = visible) ? "" : "none");
            $("#infoDiv", this.Target).height(this.Height - (this.ButtonVisible ? 88 : 52));
            $("#contentDiv", this.Target).height(this.Height - (this.ButtonVisible ? 78 : 32));
        };
        win.SetButtonVisible(dev.IsBoolean(opt.ButtonVisible) ? opt.ButtonVisible : opt.ButtonVisible !== "false");
        if (opt.AutoShow === false) win.WinMask.css("display", "none");
        return win;
    };
})(jQuery);
//Dialog(对话窗) 
(function ($) {
    function GetAlign(align) {
        if (dev.IsNull(align)) return "center";
        align = align.toLowerCase();
        if (align == "left" || align == "right" || align == "top"
            || align == "bottom" || align == "center") return align;
        return "center";
    };
    function Show(t, callback, opt) {
        if (!dev.IsNull(opt)) {
            if (!dev.IsNull(opt.Callback)) t.Callback = opt.Callback;
            if (!dev.IsNull(opt.Width) && (dev.IsNumber(opt.Width) ||
                !isNaN(parseInt(opt.Width)))) t.Width = t.oWidth = parseInt(opt.Width);
            if (!dev.IsNull(opt.Height) && (dev.IsNumber(opt.Height) ||
                !isNaN(parseInt(opt.Height)))) t.Height = t.oHeight = parseInt(opt.Height);
            t.SetVAlign(dev.IsNull(opt.VAlign) ? "center" : opt.VAlign);
            t.SetHAlign(dev.IsNull(opt.HAlign) ? "center" : opt.HAlign);
            if (!dev.IsNull(opt.Title)) t.SetTitle(opt.Title);
        }
        if (!dev.IsNull(callback)) t.Callback = callback;
        t.Visible = false; t.Open();
        $("#dlgContent", t.Target).width(t.Width - 2);
        $("#dlgContent", t.Target).height(t.Height - 32);
        $("#contentDiv", t.Target).width(t.Width - 2);
        $("#contentDiv", t.Target).height(t.Height - 59);
    }
    dev.Dialog = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        if (dev.IsNull(opt.ID)) opt.ID = "dlg" + new Date().getTime();
        opt.Visible = opt.Modal = opt.Draggable = true;
        if (dev.IsNull(opt.Title)) opt.Title = "对话框";
        opt.VAlign = GetAlign(opt.VAlign); opt.HAlign = GetAlign(opt.HAlign);
        opt.IsMinimize = opt.IsMaximize = opt.Resizable = opt.Minimizable = opt.Maximizable = false;
        var content = $("<div id='dlgContent' style='position:relative;overflow:hidden'></div>");
        var contentDiv = $("<div id='contentDiv' style='position:absolute;top:0px;left:0px;'></div>").appendTo(content); contentDiv.append(opt.Content);
        var bottomDiv = $("<div style='border-top:solid #DDDDDD 1px;height:36px;position:absolute;bottom:0px;width:100%;background-color:#F4F4F4'></div>").appendTo(content);
        var btnDiv = $("<div id='btnDiv' style='position:absolute;right:12px;top:5px'></div>").appendTo(bottomDiv);
        var btnOK = $("<a id='ok' tabindex='0' class='easyui-linkbutton' style='padding:0px 8px'></a>").appendTo(btnDiv);
        var btnCancel = $("<a id='cancel' tabindex='0' class='easyui-linkbutton' style='padding:0px 8px;margin-left:12px'>取消</a>").appendTo(btnDiv);
        opt.Content = content; var win = new dev.Window(opt); if (!dev.IsNull(opt.Callback)) win.Callback = opt.Callback;
        win.OK = dev.IsNull(opt.OK) ? "确定" : opt.OK; win.Cancel = dev.IsNull(opt.Cancel) ? "取消" : opt.Cancel;
        btnOK.linkbutton({ text: win.OK }); btnCancel.linkbutton({ text: win.Cancel });
        $('#ok', btnDiv).click(function () { win.Close(); if (win.Callback) win.Callback(true); });
        $('#cancel', btnDiv).click(function () { win.Close(); if (win.Callback) win.Callback(false); });
        win.Show = function (callback, opt) { Show(this, callback, opt); }; return win;
    };
})(jQuery);
/*UCMapTool*/
(function ($) {
    function GetIconCls(iconCls, icon) {
        var ic = iconCls;
        if (!dev.IsString(ic) && dev.IsString(icon)) {
            var e = icon.lastIndexOf('.');
            if (e > 0) {
                var s = icon.lastIndexOf('/');
                if (s < 0) s = 0;
                if (e - s > 0) {
                    ic = "maptool_" + icon.substring(s + 1, e);
                    dev.InsertRule(dev.App.TempStyle, "." + ic,
                        "background: url('" + icon + "') no-repeat center center;");
                }
            }
        }
        return ic;
    }
    function GetMenu(id, items) {
        var menu = $('<div class="easyui-menu" id="' + id + '"></div>');
        var list = dev.GroupBy(items, "Group", "Order");
        $(list).each(function (j, n) {
            $(n.Items).each(function (i, m) {
                var ic = GetIconCls(m.IconCls, m.Icon);
                var item = $("<div id=\"" + m.Name + "\" data-options="
                    + "\"iconCls:'" + ic + "'\">" + m.Title + "</div>");
                item.appendTo(menu);
            });
            $("<div class='menu-sep'></div>").appendTo(menu);
        });
        $(":last", menu).remove();
        return menu;
    }
    dev.UCMapTool = function (opt) {
        if (dev.IsNull(opt)) opt = { ID: "maptool" + new Date().getTime() };
        if (dev.IsNull(opt.Target)) opt.Target = $("<div class='MapTool'></div>");
        opt.Tools = $.grep(opt.Tools, function (n, i) { return n["IsVisible"] == "true"; });
        $.extend(this, new dev.Control(opt));
        var list = Enumerable.From(opt.Tools).OrderBy("s=>parseInt(s.Order)").ToArray();
        var $this = this;
        this.ClickHandler = function (ops) {
            if (ops === undefined) ops = $(this).linkbutton("options");
            $this.Target.trigger("onItemClick", ops);
            if (dev.IsNull(ops.tool) || ops.tool.Type != "Switch") return;
            $(this).linkbutton({
                id: ops.checked ? ops.id_ : ops.id_switch,
                text: ops.checked ? ops.text_ : ops.text_switch,
                iconCls: ops.checked ? ops.iconCls_ : ops.iconCls_switch
            });
            ops.checked = !ops.checked;
        };
        $(list).each(function (j, n) {
            switch (n.Type) {
                case "Normal":
                    var btn = $('<a id="' + n.Name + '" class="easyui-linkbutton"></a>');
                    var options = {
                        plain: true, tool: n,
                        onClick: $this.ClickHandler,
                        iconCls: GetIconCls(n.IconCls, n.Icon)
                    };
                    if (n.IsText == "true") options.text = n.Title;
                    btn.appendTo($this.Target);
                    btn.linkbutton(options);
                    btn.bind("mouseover", function () {
                        $this.Target.trigger("onItemMouseOver", { Sender: this, Ops: options });
                    });
                    btn.bind("mouseleave", function () { $this.Target.trigger("onItemMouseLeave", { Sender: this, Ops: options }); });
                    break;
                case "Switch":
                    var btn = $('<a id="' + n.Name + '" class="easyui-linkbutton"></a>');
                    var options = {
                        plain: true, checked: false,
                        onClick: $this.ClickHandler, tool: n,
                        id: n.Name,
                        id_: n.Name,
                        id_switch: n.Items.Name,
                        iconCls: GetIconCls(n.IconCls, n.Icon),
                        iconCls_: GetIconCls(n.IconCls, n.Icon),
                        iconCls_switch: GetIconCls(n.Items.IconCls, n.Items.Icon),
                        text: (n.IsText == "true") ? n.Title : "",
                        text_: (n.IsText == "true") ? n.Title : "",
                        text_switch: (n.IsText == "true") ? n.Items.Title : ""
                    };
                    btn.appendTo($this.Target);
                    btn.linkbutton(options);

                    break;
                case "Menu":
                    var btn = $('<a id="' + n.Name + '" class="easyui-menubutton"></a>');
                    var ops = {
                        iconCls: GetIconCls(n.IconCls, n.Icon),
                        menu: GetMenu(n.Name + "Menu", n.Items)
                    };
                    ops.menu.menu({ onClick: $this.ClickHandler });
                    if (n.IsText == "true") ops.text = n.Title;
                    btn.menubutton(ops);
                    btn.appendTo($this.Target);
                    break;
                case "Split":
                    var btn = $('<a id="' + n.Name + '" class="easyui-splitbutton"></a>');
                    var ops = {
                        onClick: $this.ClickHandler, tool: n,
                        iconCls: GetIconCls(n.IconCls, n.Icon),
                        menu: GetMenu(n.Name + "Menu", n.Items)
                    };
                    ops.menu.menu({ onClick: $this.ClickHandler });
                    if (n.IsText == "true") ops.text = n.Title;
                    btn.splitbutton(ops);
                    btn.appendTo($this.Target);
                    break;
            }
        });
        this.Target.appendTo(opt.Parent);
        var width = 0;
        this.Target.children().each(function () {
            width += $(this).outerWidth();
        });
        this.SetWidth(width);
    };
})(jQuery);
/*UCMapMenu*/
(function ($) {
    dev.UCMapMenu = function (opt) {
        if (dev.IsNull(opt)) opt = { ID: "mapmenu" + new Date().getTime() };
        if (dev.IsNull(opt.Target)) opt.Target = $("<div class='easyui-menu'></div>");
        $.extend(this, new dev.Control(opt));
        var $this = this;
        this.ClickHandler = function (ops) {
            $this.Target.trigger("onItemClick", ops);
        };
        var list = dev.GroupBy(opt.Menus, "Group", "Order");
        $(list).each(function (j, n) {
            $(n.Items).each(function (i, m) {
                var ic = m.IconCls;
                if (!dev.IsString(ic) && dev.IsString(m.Icon)) {
                    var e = m.Icon.lastIndexOf('.');
                    if (e > 0) {
                        var s = m.Icon.lastIndexOf('/');
                        if (s < 0) s = 0;
                        if (e - s > 0) {
                            ic = "mapmenu_" + m.Icon.substring(s + 1, e);
                            dev.InsertRule(dev.App.TempStyle, "." + ic,
                                "background: url('" + dev.App.Root + m.Icon + "') no-repeat center center;");
                        }
                    }
                }
                var item = $("<div id=\"" + m.Name + "\" data-options=\"iconCls:'"
                    + ic + "'\">" + m.Title + "</div>");
                item.appendTo($this.Target);
            });
            $("<div class='menu-sep'></div>").appendTo($this.Target);
        });
        $(":last", $this.Target).remove();
        this.Target.appendTo(document.body);
        this.Target.menu({ onClick: this.ClickHandler });
        $(opt.LinkDOM).bind('contextmenu', function (e) {
            e.preventDefault();
            $this.Target.menu('show', { left: e.pageX, top: e.pageY });
        });
    };
})(jQuery);
/*UCMapSwitch*/
(function ($) {
    dev.UCMapSwitch = function (opt) {
        if (dev.IsNull(opt)) opt = { ID: "MapSwitch" + new Date().getTime() };
        if (dev.IsNull(opt.Target)) opt.Target = $('<div class="MapSwitch"></div>');
        this.SwitchWidth = !dev.IsNull(opt.SwitchWidth) ? parseInt(opt.SwitchWidth) : 40;
        this.SwitchHeight = !dev.IsNull(opt.SwitchHeight) ? parseFloat(opt.SwitchHeight) : 40;
        this.SwitchMaps = Enumerable.From(opt.SwitchMaps).Where("s=>s.IsVisible==='true'&&s.IsFloat==='true'").ToArray();
        opt.Width = (this.SwitchMaps.length * (this.SwitchWidth + 15)) - 8;
        this.VerticalAlignment = dev.IsNull(opt.VerticalAlignment) ? "top" : opt.VerticalAlignment;
        this.HorizontalAlignment = dev.IsNull(opt.HorizontalAlignment) ? "right" : opt.HorizontalAlignment;
        this.Top = dev.IsNull(opt.Margin.Top) ? 20 : parseInt(opt.Margin.Top);
        this.Left = dev.IsNull(opt.Margin.Left) ? 20 : parseInt(opt.Margin.Left);
        this.Right = dev.IsNull(opt.Margin.Right) ? 20 : parseInt(opt.Margin.Right);
        this.Bottom = dev.IsNull(opt.Margin.Bottom) ? 20 : parseInt(opt.Margin.Bottom);
        $.extend(this, new dev.Control(opt));
        this.SetWidth(opt.SwitchWidth);
        var $this = this;
        var v = opt.VerticalAlignment;
        var h = opt.HorizontalAlignment;
        this.Target.css({ "top": (this.VerticalAlignment === "top" ? this.Top : this.Bottom) + "px", "right": (this.HorizontalAlignment === "left" ? this.Left : this.Right) + "px" });
        if (v == "bottom") this.Target.css({ "top": "", "bottom": this.Bottom + "px" });
        if (h == "left") this.Target.css({ "right": "", "left": this.Left + "px" });
        var types = [];
        this.SwitchMaps = Enumerable.From(this.SwitchMaps).OrderBy('s=>s.Order').ToArray();
        for (var i = 0; i < this.SwitchMaps.length; i++) {
            types.push(this.SwitchMaps[i].Type);
            var div = $('<div id="' + this.SwitchMaps[i].ID + '" class="MapSwitch-Single" style="width:' + (this.SwitchWidth) + 'px;height:' + (this.SwitchHeight) + 'px;right:' + (i === 0 ? 1 : i * (this.SwitchWidth + 15)) + 'px;display:' + (i === 0 ? "block" : "none") + ';background-image:url(' + this.SwitchMaps[i].BackImg + ');"></div>');
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
    $.fn.extend(dev.UCMapSwitch.prototype, {
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
            var switchdiv = $('.MapSwitch-Single', this.Target);
            var right, firstchild;
            for (var i = 0; i < switchdiv.length; i++) {
                var div_r = parseInt($(switchdiv[i]).css("right").replace("px", ""));
                if (i == 0) {
                    right = div_r;
                    firstchild = $(switchdiv[i]);
                    continue;
                }
                if (div_r > right) { right = div_r; firstchild = $(switchdiv[i]); }
            }
            return firstchild.attr("id");
        },
        SetVisibleByID: function (id) {
            if (dev.IsNull(id)) return;
            this.SetStyleByType(id);

            this.Hidden();
        }
    });
})(jQuery);
/*UCScreenPanel*/
(function ($) {
    dev.UCScreenPanel = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        opt.Target = $('<div class="Panel-Screen"></div>');
        $.extend(this, new dev.Control(opt));
        this.leftBox = $('<div class="Panel-Screen-Left"></div>').appendTo(this.Target);
        this.rightBox = $('<div class="Panel-Screen-Right"></div>').appendTo(this.Target);
        this.SplitBorderWidth = dev.IsNull(opt.SplitBorderWidth) ? 1 : opt.SplitBorderWidth;
        this.SplitBorderColor = dev.IsNull(opt.SplitBorderColor) ? "red" : opt.SplitBorderColor;
        if (this.SplitBorderWidth > 0) {
            this.splitBorder = $("<div style='position:absolute;height:100%;'></div>").appendTo(this.Target);
            this.splitBorder.css({ width: this.SplitBorderWidth + "px", "background-color": this.SplitBorderColor });
        }
    }
    $.fn.extend(dev.UCScreenPanel.prototype, {
        Layout: function () {
            var w = this.Target.outerWidth(), l = 0, r = 0;
            if (this.splitBorder) w -= this.SplitBorderWidth;
            if (w % 2 == 0) l = r = w / 2;
            else { l = (w + 1) / 2; r = w - l; }
            this.leftBox.css("width", l + "px");
            this.rightBox.css("width", r + "px");
            if (this.splitBorder) this.splitBorder.css("left", l + "px");
        },
        AddContent: function (element, isLeft) {
            var $this = this;
            if (dev.IsNull(isLeft)) isLeft = true;
            if (dev.IsString(element)) {
                var frame = dev.CreateFrame(element, false);
                var waitbox = new dev.UCWaitBox(this.Target);
                frame.bind('load', function () { waitbox.Close(); $this.Target.triggerHandler("onLoaded", isLeft); });
                if (isLeft) $this.leftBox.html(frame);
                else $this.rightBox.html(frame);
                waitbox.Show();
            }
            else if (dev.IsObject(element)) {
                if (isLeft) $this.leftBox.append($(element));
                else $this.rightBox.append($(element));
                $this.Target.triggerHandler("onLoaded", isLeft);
            }
        },
        RemoveContent: function (element, isLeft) {
            if (dev.IsNull(isLeft)) isLeft = true;
            element = dev.IsString(element) ? $('#' + element, (isLeft ? this.leftBox : this.rightBox)) : (dev.IsObject(element) ? $(element) : null);
            if (element == null || element.length == 0) return;
            element.remove();
        },
        ClearContent: function (isLeft) {
            if (dev.IsNull(isLeft)) { this.leftBox.empty(); this.rightBox.empty(); }
            if (isLeft) this.leftBox.empty();
            else this.rightBox.empty();
        }
    });
})(jQuery);
/*SplitScreen*/
(function ($) {
    function InitMap(parent, defaultConfig, view) {
        var map = new dev.Map({
            controls: new dev.control.defaults({
                zoom: false,
                rotate: false,
                attribution: false
            }),
            interactions: dev.interaction.defaults().extend([
                new dev.interaction.DragRotateAndZoom()
            ]),
            target: parent[0],
            logo: false,
            view: view
        });
        if (dev.IsNull(defaultConfig)) defaultConfig = dev.App.Config.SystemMap;
        for (var i = 0; i < defaultConfig.LayerInfo.BaseLayers.length; i++) {
            if (defaultConfig.LayerInfo.BaseLayers[i].Type == "TempVector") continue;
            var currlayer = dev.MapUtils.GetCurrentLayer(defaultConfig.LayerInfo.BaseLayers[i].Name, dev.App.Map);
            if (dev.IsNull(currlayer)) continue;
            defaultConfig.LayerInfo.BaseLayers[i].Visible = currlayer.getVisible();
        }
        dev.MapLoad.InitMap($.extend({ Map: map }, defaultConfig));
        var initExtent = [parseFloat(defaultConfig.Extent.XMin), parseFloat(defaultConfig.Extent.YMin), parseFloat(defaultConfig.Extent.XMax), parseFloat(defaultConfig.Extent.YMax)];
        map.getView().fit(initExtent, map.getSize());
        return map;
    }
    function InitNavigation(parent, map, defaultConfig) {
        if (dev.IsNull(defaultConfig)) defaultConfig = dev.App.Config.SystemMap;
        var param = $.extend({
            Map: map,
            Parent: parent,
        }, defaultConfig.LevelInfo);
        var navigation = new $.UCNavigation(param);
        return navigation;
    }
    function InitScaleLine(map) {
        var scaleLine = new dev.control.ScaleLine();
        scaleLine.id = "scaleLine";
        $(scaleLine.element).bind("mouseover", function () { $(this).css("opacity", 1); });
        $(scaleLine.element).bind("mouseout", function () { $(this).css("opacity", 0.2); });
        map.on('postrender', function () {
            var text = $(":first", scaleLine.element);
            text.html(text.html().replace("mm", "毫米").replace("km", "千米").replace("m", "米"));
        });
        map.addControl(scaleLine);
        return scaleLine;
    }
    dev.UCSplitScreen = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        opt.SplitBorderColor = "#0099CC";
        $.extend(this, new dev.UCScreenPanel(opt));
        this.LeftBottomHeight = dev.IsNumber(opt.LeftBottomHeight) ? opt.LeftBottomHeight : 120;
        this.RightBottomHeight = dev.IsNumber(opt.RightBottomHeight) ? opt.RightBottomHeight : 120;
        this.LeftBottomVisible = dev.IsBoolean(opt.LeftBottomVisible) ? opt.LeftBottomVisible : opt.LeftBottomVisible != "false";
        this.RightBottomVisible = dev.IsBoolean(opt.RightBottomVisible) ? opt.RightBottomVisible : opt.RightBottomVisible != "false";
        this.LeftTopContent = $('<div class="Panel-SplitScreenTop"></div>').appendTo(this.leftBox);
        this.LeftBottomContent = $('<div class="Panel-SplitScreenBottom" style="height:' + this.LeftBottomHeight + 'px"></div>').appendTo(this.leftBox);
        if (!this.LeftBottomVisible) this.LeftBottomContent.css("display", "none");
        this.RightTopContent = $('<div id="rigthtop" class="Panel-SplitScreenTop"></div>').appendTo(this.rightBox);
        this.RightBottomContent = $('<div id="rightbottom" class="Panel-SplitScreenBottom" style="height:' + this.RightBottomHeight + 'px"></div>').appendTo(this.rightBox);
        if (!this.RightBottomVisible) this.RightBottomContent.css("display", "none");
        this.LeftMapDom = $("<div id='splitleftmap' class='Panel-SplitScreenMap'></div>").appendTo(this.LeftTopContent);
        this.RightMapDom = $("<div id='splitrightmap' class='Panel-SplitScreenMap'></div>").appendTo(this.RightTopContent);
        this.Isinit = true;//显示地图
        this.NavigationVisible = dev.IsBoolean(opt.NavigationVisible) ? opt.NavigationVisible : opt.NavigationVisible != "false";
        this.ScaleLineVisible = dev.IsBoolean(opt.ScaleLineVisible) ? opt.ScaleLineVisible : opt.ScaleLineVisible != "false";
    }
    $.fn.extend(dev.UCSplitScreen.prototype, {
        LayoutEx: function () {
            this.Layout();
            var height = this.GetActualHeight();
            if (!this.LeftBottomVisible) this.LeftTopContent.css("height", height + "px");
            else {
                var th = height - this.LeftBottomHeight;
                this.LeftTopContent.css("height", (th < 0 ? "0px" : th + "px"));
                this.LeftBottomContent.css("top", (th < 0 ? "0px" : th + "px"));
                this.LeftBottomContent.css("height", this.LeftBottomHeight + "px");
            }
            if (!this.RightBottomVisible) this.RightTopContent.css("height", height + "px");
            else {
                var th = height - this.RightBottomHeight;
                this.RightTopContent.css("height", (th < 0 ? "0px" : th + "px"));
                this.RightBottomContent.css("top", (th < 0 ? "0px" : th + "px"));
                this.RightBottomContent.css("height", this.RightBottomHeight + "px");
            }
            if (this.Isinit) {
                this.Isinit = false;
                var initconfig = dev.App.Config.SystemMap;
                var resolutions;
                if (!dev.IsNull(initconfig.LevelInfo) && !dev.IsNull(initconfig.LevelInfo.IsVisibleLevel)
                    && initconfig.LevelInfo.IsVisibleLevel == "true") {
                    resolutions = [];
                    for (var i = 0; i < initconfig.LevelInfo.Levels.length; i++)
                        resolutions.push(parseFloat(initconfig.LevelInfo.Levels[i].Resolution));
                }
                var mapview = new dev.View({
                    projection: dev.proj.get('EPSG:4326'),
                    resolutions: resolutions,
                    minZoom: 1,
                    maxResolution: initconfig.LevelInfo.MaxResolution,
                    maxZoom: 20,
                    minResolution: initconfig.LevelInfo.MinResolution,
                })
                this.LeftMap = InitMap(this.LeftMapDom, null, mapview);
                this.RightMap = InitMap(this.RightMapDom, null, mapview);
                var $this = this;
                this.leftsingleclick = this.LeftMap.on("singleclick", function (o, e) {

                    $this.Target.triggerHandler("OnMapClick", { data: o, map: $this.LeftMap, isleft: true });
                });
                this.rightsingleclick = this.RightMap.on("singleclick", function (o, e) {

                    $this.Target.triggerHandler("OnMapClick", { data: o, map: $this.RightMap, isleft: false });
                });
                if (this.NavigationVisible) {
                    this.LeftNavigation = InitNavigation(this.LeftTopContent, this.LeftMap);
                    this.RightNavigation = InitNavigation(this.RightTopContent, this.RightMap);
                }
                if (this.ScaleLineVisible) {
                    this.LeftScaleLine = InitScaleLine(this.LeftMap);
                    this.RightScaleLine = InitScaleLine(this.RightMap);
                }
            }
            if (!dev.IsNull(this.LeftMap)) this.LeftMap.updateSize();
            if (!dev.IsNull(this.RightMap)) this.RightMap.updateSize();
        },
        Resize: function () {
            this.LayoutEx();
            this.Target.triggerHandler("onSplitResize");
        },
        SetBottomContentVisible: function (visible, isLeft) {
            if (dev.IsNull(visible) || !dev.IsBoolean(visible)) return;
            isLeft = dev.IsBoolean(isLeft) ? isLeft : isLeft != "false";
            if (isLeft) {
                if (this.LeftBottomVisible == visible) return;
                this.LeftBottomContent.css({ display: visible ? "block" : "none" });
                this.LeftBottomVisible = visible;
            }
            else {
                if (this.RightBottomVisible == visible) return;
                this.RightBottomContent.css({ display: visible ? "block" : "none" });
                this.RightBottomVisible = visible;
            }
            this.LayoutEx();
        },
        SetBottomContentHeight: function (height, isLeft) {
            if (dev.IsNull(height) || !dev.IsNumber(height)) return;
            isLeft = dev.IsBoolean(isLeft) ? isLeft : isLeft != "false";
            if (isLeft) this.LeftBottomHeight = height;
            else this.RightBottomHeight = height;
            this.LayoutEx();
        },
        SetNavigationVisible: function (visible, isLeft) {
            if (dev.IsNull(visible) || !dev.IsBoolean(visible)) return;
            isLeft = dev.IsBoolean(isLeft) ? isLeft : isLeft != "false";
            if (isLeft) $(this.LeftNavigation.Target).css({ display: visible ? "block" : "none" });
            else $(this.RightNavigation.Target).css({ display: visible ? "block" : "none" });
        },
        SetScaleLineVisible: function (visible, isLeft) {
            if (dev.IsNull(visible) || !dev.IsBoolean(visible)) return;
            isLeft = dev.IsBoolean(isLeft) ? isLeft : isLeft != "false";
            if (isLeft) {
                if (!visible) {
                    if (dev.IsNull(this.LeftScaleLine)) return;
                    this.LeftMap.removeControl(this.LeftScaleLine);
                    this.LeftScaleLine = null;
                }
                else this.LeftScaleLine = InitScaleLine(this.LeftMap);
            }
            else {
                if (!visible) {
                    if (dev.IsNull(this.RightScaleLine)) return;
                    this.RightMap.removeControl(this.RightScaleLine);
                    this.RightScaleLine = null;
                }
                else this.RightScaleLine = InitScaleLine(this.RightMap);
            }
        },
        SetSplitBorderStyle: function (style) {
            if (dev.IsNull(style) || !dev.IsString(style)) return;
            this.LeftTopContent.css({ "border-right": style });
            this.LeftBottomContent.css({ "border-right": style });
        },
        SetBottomBorderTop: function (border, isLeft) {
            if (dev.IsNull(border) || !dev.IsString(border)) return;
            isLeft = dev.IsBoolean(isLeft) ? isLeft : isLeft != "false";
            if (isLeft) this.LeftBottomContent.css({ "border-top": border });
            else this.RightBottomContent.css({ "border-top": border });
        },
        Add: function (element, isTop, isLeft) {
            if (dev.IsNull(element)) return;
            isTop = dev.IsBoolean(isTop) ? isTop : isTop != "false";
            isLeft = dev.IsBoolean(isLeft) ? isLeft : isLeft != "false";
            if (dev.IsString(element)) {
                var frame = dev.CreateFrame(element, false);
                var waitbox = new dev.UCWaitBox(this.Target);
                frame.bind('load', function () { waitbox.Close(); $this.Target.triggerHandler("onSplitContentLoaded", { IsTop: isTop, IsLeft: isLeft }); });
                if (isTop) {
                    if (isLeft) this.LeftTopContent.html(frame);
                    else this.RightTopContent.html(frame);
                }
                else {
                    if (isLeft) this.LeftBottomContent.html(frame);
                    else this.RightBottomContent.html(frame);
                }
                waitbox.Show();
            }
            else if (dev.IsObject(element)) {
                if (isTop) {
                    if (isLeft) this.LeftTopContent.append($(element));
                    else this.RightTopContent.append($(element));
                }
                else {
                    if (isLeft) this.LeftBottomContent.append($(element));
                    else this.RightBottomContent.append($(element));
                }
            }
        },
        Remove: function (element, isTop, isLeft) {
            if (dev.IsNull(element)) return;
            isTop = dev.IsBoolean(isTop) ? isTop : isTop != "false";
            isLeft = dev.IsBoolean(isLeft) ? isLeft : isLeft != "false";
            var parent = this.LeftTopContent;
            if (isTop) parent = isLeft ? this.LeftTopContent : this.RightTopContent;
            else parent = isLeft ? this.LeftBottomContent : this.RightBottomContent;
            element = dev.IsString(element) ? $('#' + element, parent) : (dev.IsObject(element) ? $(element) : null);
            if (element == null || element.length == 0) return;
            element.remove();
        },
        Clear: function (isLeft) {
            isLeft = dev.IsBoolean(isLeft) ? isLeft : isLeft != "false";
            if (isLeft) this.LeftBottomContent.empty();
            else this.RightBottomContent.empty();
        },
        Destroy: function () {
            this.Target.unbind("OnMapClick");
            this.Target.unbind("onSplitResize");
            if (!dev.IsNull(this.leftsingleclick)) this.LeftMap.unByKey(this.leftsingleclick);
            if (!dev.IsNull(this.rightsingleclick)) this.RightMap.unByKey(this.rightsingleclick);
        }
    });
})(jQuery);
/*UCTimeLine时间轴*/
(function ($) {
    function PositionChanged(point, offset) {
        var currleft = $(point).css("left");
        if (currleft != null && currleft != "") currleft = parseInt(currleft.substring(0, currleft.length + offset));
        var currtop = $(point).css("top");
        if (currtop != null && currtop != "") currtop = parseInt(currtop.substring(0, currtop.length + offset));
        $(point).css({ "left": (currleft + offset) + "px", "top": (currtop + offset) + "px" });
    }
    dev.UCTimeLine1 = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        this.SameLever = dev.IsBoolean(opt.SameLever) ? opt.SameLever : false;
        this.Data = dev.IsNull(opt.Data) ? [] : opt.Data;
        this.IsHorizontal = dev.IsBoolean(opt.IsHorizontal) ? opt.IsHorizontal : opt.IsHorizontal != "false";
        this.Left = dev.IsNumber(opt.Left) ? opt.Left : 0;
        this.Top = dev.IsNumber(opt.Top) ? opt.Top : 0;
        this.autoIndex = 0;
        this.SelectIndex = dev.IsNumber(opt.SelectIndex) ? opt.SelectIndex : 2;
        this.CircleSelectable = dev.IsBoolean(opt.CircleSelectable) ? opt.CircleSelectable : opt.CircleSelectable != "true";//圈是否可选
        if (this.IsHorizontal) opt.Target = $('<div class="TimeLine" style="width:' + (dev.IsNumber(opt.Width) ? (opt.Width + "px") : "100%") + '; height:' + (dev.IsNumber(opt.Height) ? opt.Height : 50) + 'px;left:' + this.Left + 'px;top:' + this.Top + 'px;">');
        else opt.Target = $('<div class="TimeLine" style="width:' + (dev.IsNumber(opt.Width) ? opt.Width : 50) + 'px;height:' + (dev.IsNumber(opt.Height) ? (opt.Height + "px") : "100%") + '; overflow:hidden;left:' + this.Left + 'px;top:' + this.Top + 'px;">');
        $.extend(this, new dev.Control(opt));
        var $this = this;
        this.playButton = $('<div class="playbutton"><div class="imagestop"></div></div>');
        this.playButton.bind("click", function () {
            if ($("div", this).hasClass("imageplay")) $this.Start();
            else $this.Stop();
        });
        this.playButton.appendTo(opt.Target);
    }
    $.fn.extend(dev.UCTimeLine1.prototype, {
        Layout: function () {
            var $this = this;
            var yearNum = this.Data.length;
            var pointNum = Enumerable.From(this.Data).Sum('s=>s.Children.length');
            var pointsLength = pointNum * 20;
            var yearsLength = (yearNum + 1) * 36;
            var minLength = pointsLength + yearsLength;
            var allLength;
            if (this.IsHorizontal) allLength = dev.IsNumber(this.Width) ? this.Width : (this.Target.width() - this.Left);
            else allLength = dev.IsNumber(this.Height) ? this.Height : (this.Target.height() - this.Top);
            var margin = 5;
            if (allLength == minLength) margin = 0;
            if (allLength > minLength) {
                var splitnum = (yearNum + pointNum);
                margin = Math.round((allLength - minLength - 5) / splitnum);
            }
            var initpoisiton = (36 - 20) / 2;
            var position = 32;
            if ($(".Line", this.Target).length <= 0) {
                var style = "";
                if (this.IsHorizontal) style = "height:4px;top:16px;left:" + position + "px;";
                else style = "width:4px;top:16px;left:" + position + "px;";
                var line = $('<div class="Line" style="' + style + '"></div>');
                this.Target.append(line);
                var selectindex = 1;
                for (var i = 0; i < this.Data.length; i++) {
                    var itemYear = this.Data[i];
                    if (i > 0) {
                        var prePointNum = this.Data[i - 1].Children.length;
                        position = position + 36 + prePointNum * 20 + (prePointNum + 1) * margin;
                    }
                    var circlestyle = this.IsHorizontal ? ("left:" + position + "px") : ("top:" + position + "px");
                    var yearpoint = $('<div class="Circle" selectIndex=' + (selectindex === 1 ? 1 : (selectindex = selectindex + 1)) + ' index=' + i + ' yearTag="' + itemYear.Text + '" style="' + circlestyle + '">' + itemYear.Text + '</div>');//top 和left互换了
                    this.Target.append(yearpoint);
                    yearpoint.mouseover(itemYear, function (o) {
                        // if ($(this).hasClass("SelectCircle")) $this.Target.triggerHandler("onSelectedMouseover", { Point: this, Data: o.data });
                    });
                    yearpoint.mouseleave(itemYear, function (o) {
                        // if ($(this).hasClass("SelectCircle")) $this.Target.triggerHandler("onSelectedMouseleave", { Point: this, Data: o.data });
                    });
                    yearpoint.click(itemYear, function (o) {
                        $this.Stop();
                        var index = $(this).index() - 1;
                        if ($this.CircleSelectable) $this.Select(index);
                        $this.Target.triggerHandler("onTimePointClick", { Year: $(this).html(), State: "YearPoint", Data: o.data, SelectIndex: index });
                    });
                    if (dev.IsNull(itemYear.Children) || itemYear.Children.length === 0) continue;
                    for (var j = 0; j < itemYear.Children.length; j++) {
                        var itemPoint = itemYear.Children[j];
                        var newposition = position + 36 + (j + 1) * margin + j * 20;
                        var point = $('<div class="Point" selectIndex=' + (selectindex = selectindex + 1) + ' style="left:' + (this.IsHorizontal ? newposition : initpoisiton) + 'px;top:' + (this.IsHorizontal ? initpoisiton : newposition) + 'px" index="' + j + '" title="' + itemPoint.Text + '" tag="' + itemYear.Text + '"></div>');//top 和left互换了
                        point.mouseover(itemPoint, function (o) {
                            if ($(this).hasClass("Point")) { $(this).attr("hover", "1"); PositionChanged(this, -2); }
                            else if ($(this).hasClass("SelectPoint")) $this.Target.triggerHandler("onSelectedMouseover", { Point: this, Data: o.data });
                        });
                        point.mouseleave(itemPoint, function (o) {
                            if ($(this).hasClass("Point")) { $(this).attr("hover", "0"); PositionChanged(this, 2); }
                            else if ($(this).hasClass("SelectPoint")) $this.Target.triggerHandler("onSelectedMouseleave", { Point: this, Data: o.data });
                        });
                        point.click(itemPoint, function (o) {
                            $this.Stop();
                            var index = $(this).index() - 1;
                            $this.Select(index);
                            $this.Target.triggerHandler("onTimePointClick", { Year: $(this).attr("tag"), TimePoint: $(this).attr("title"), PointIndex: $(this).attr("index"), State: "Point", Data: o.data, SelectIndex: index });
                        });
                        this.Target.append(point);
                    }
                }
                var endposition = (yearNum + pointNum) * margin + yearNum * 36 + pointNum * 20;
                if (this.IsHorizontal) line.css({ width: (endposition - 48) + "px" });
                else line.css({ height: endposition + "px" });
                var endpoint = $('<div class="Circle" selectIndex=' + (selectindex = selectindex + 1) + ' index=' + yearNum + ' style="left:' + (this.IsHorizontal ? endposition : 0) + 'px;top:' + (this.IsHorizontal ? 0 : endposition) + 'px;">总计</div>');
                endpoint.click(function (o) {
                    $this.Stop();
                    var index = $(this).index() - 1;
                    $this.Target.triggerHandler("onTimePointClick", { State: "End", SelectIndex: index });
                });
                this.Target.append(endpoint);
                this.Select(this.SelectIndex);
                this.Start();
            }
            else {
                var children = this.Target.children();
                var lineLength = (yearNum + pointNum) * margin + yearNum * 36 + pointNum * 20;
                for (var m = 0; m < children.length ; m++) {
                    var o = $(children[m]);
                    if (o.hasClass("Line"))
                        o.css((this.IsHorizontal ? "width" : "height"), lineLength + "px");
                    else if (o.hasClass("Circle") || o.hasClass("SelectCircle")) {
                        var circleIndex = parseInt($(o).attr("index"));
                        if (children.length - 1 === m) position = lineLength;
                        else if (circleIndex > 0) {
                            var prePointNum = this.Data[circleIndex - 1].Children.length;
                            position = position + 36 + prePointNum * 20 + (prePointNum + 1) * margin;
                        }
                        o.css((this.IsHorizontal ? "left" : "top"), position + "px");
                    }
                    else if (o.hasClass("Point") || o.hasClass("SelectPoint")) {
                        var pointIndex = parseInt($(o).attr("index"));
                        var newposition = position + 36 + (pointIndex + 1) * margin + pointIndex * 20;
                        o.css((this.IsHorizontal ? "left" : "top"), newposition + "px");
                    }
                }
            }
        },
        Resize: function () {
            if (this.IsHorizontal) this.Width = this.Target.width();
            else this.Height = this.Target.heightS();
            this.Layout();
        },
        Select: function (index) {
            index = index + 1;//SelectCircle
            var points = this.Target.children();
            if (points.length - 1 <= index) return;
            var currentPoint = $(points[index]);
            var prePoint = $(points[(this.SelectIndex + 1)]);
            var isSelect = false;
            if (prePoint.hasClass("SelectPoint")) { prePoint.removeClass("SelectPoint").addClass("Point"); isSelect = true; }
            else if (prePoint.hasClass("SelectCircle")) { prePoint.removeClass("SelectCircle").addClass("Circle"); isSelect = true; }
            var data = null;
            if (currentPoint.hasClass("Point")) {
                this.autoIndex = $(".Point,.SelectPoint", this.Target).index(currentPoint);
                if (currentPoint.attr("hover") === "1") { PositionChanged(currentPoint[0], 2); currentPoint.attr("hover", "0"); }
                currentPoint.removeClass("Point").addClass("SelectPoint");
                var brotherCircle = currentPoint.prevAll("[yearTag=" + currentPoint.attr("tag") + "]");
                data = { Year: currentPoint.attr("tag"), TimePoint: currentPoint.attr("title"), PointIndex: currentPoint.attr("index"), State: "Point", Data: this.Data[parseInt(brotherCircle.attr("index"))].Children[parseInt(currentPoint.attr("index"))] };
            }
            else if (currentPoint.hasClass("Circle")) {
                currentPoint.removeClass("Circle").addClass("SelectCircle");
                data = { Year: currentPoint.html(), State: "YearPoint", Data: this.Data[parseInt(currentPoint.attr("index"))] }
            }
            this.SelectIndex = index - 1;
            this.Target.triggerHandler("onTimePointSelect", data);//触发index
        },
        Start: function () {
            var $this = this;
            if ($("div", this.playButton).hasClass('imageplay'))
                $("div", this.playButton).removeClass("imageplay").addClass("imagestop");
            var points = $(".Point,.SelectPoint", $this.Target);
            if (!dev.IsNull(this.interval)) { clearInterval(this.interval); this.interval = null; }
            this.interval = setInterval(function () {
                var index = parseInt($(points[$this.autoIndex]).attr("selectIndex"));
                $this.Select(index);
                $this.autoIndex++;
                if ($this.autoIndex === points.length) $this.autoIndex = 0;
            }, 5000);
        },
        Stop: function () {
            if ($("div", this.playButton).hasClass('imageplay')) return;
            if (!dev.IsNull(this.interval)) { clearInterval(this.interval); this.interval = null; }
            if ($("div", this.playButton).hasClass('imagestop'))
                $("div", this.playButton).removeClass("imagestop").addClass("imageplay");
        },
        SetBackGround: function (background) {
            if (dev.IsNull(background) || !dev.IsString(background)) return;
            this.Target.css({ "background": background });
        }
    });
})(jQuery);
/*UCTypeLayerTree专题图层树*/
(function ($) {
    function ConvertToTreeDatas(data) {
        var treeData = [];
        ToTreeData(data, treeData);
        return treeData;
    };
    function ToTreeData(data, treeDatas) {
        data = Enumerable.From($(data)).Where('s=>s.Visible!="false"').OrderBy('a=>parseInt(a.Order)').ToArray();
        $.each(data, function (i, o) {
            var treedata = {};
            treedata.id = o.ID;
            treedata.text = o.AliasName;
            treedata.name = o.Name;
            if (o.IsExpand == undefined || o.IsExpand == "true") treedata.state = "open";
            else treedata.state = "closed";
            if (!dev.IsNull(o.Icon)) {
                dev.InsertIconRule(dev.App.TempStyle,
              ".layertreeIconof" + o.ID, o.Icon);
                treedata.iconCls = "layertreeIconof" + o.ID;
            }
            if (!dev.IsNull(o.IconCls)) treedata.iconCls = o.IconCls;
            treedata.checked = o.IsChecked === "true";
            if (!dev.IsNull($(o.Children)) && $(o.Children).length > 0) {
                if (treedata.checked) {
                    var checkedchilds = Enumerable.From(o.Children).Where('s=>s.IsChecked!="false"').ToArray();
                    if (dev.IsNull(checkedchilds) || checkedchilds.length < o.Children.length) treedata.checked = false;
                }
                treedata.children = [];
                ToTreeData(o.Children, treedata.children);
            }
            treedata.attributes = {};
            $.extend(treedata.attributes, o);
            treeDatas.push(treedata);
        });
    };
    function GetNeedData(node, checked) {
        var needdata = { NodeID: node.id, NodeName: node.name, NodeAttributes: node.attributes, Checked: checked };
        return needdata;
    }
    dev.UCTypeLayerTree = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        this.Width = dev.IsNumber(opt.Width) ? opt.Width + "px" : dev.IsString(opt.Width) ? opt.Width : "100%";
        this.Height = dev.IsNumber(opt.Height) ? opt.Height + "px" : dev.IsString(opt.Height) ? opt.Height : "100%";
        this.Data = dev.IsNull(opt.Data) ? dev.App.Config.TreeLayers : opt.Data;
        opt.Target = $('<div style="width:' + this.Width + ';height:' + this.Height + '"></div>');
        $.extend(this, new dev.Control(opt));
        this.Tree = $('<ul class="easyui-tree" data-options="animate:true,checkbox:true" style="height:100%;;width:100%;"></ul>');
        this.Target.append(this.Tree);
    }
    $.fn.extend(dev.UCTypeLayerTree.prototype, {
        Layout: function () {
            var $this = this;
            var treedata = ConvertToTreeDatas(this.Data);
            this.Tree.tree({
                animate: true,
                checkbox: true,
                data: treedata,
                onCheck: function (node, checked) {
                    var senddata = [];
                    var isLeaf = $this.Tree.tree('isLeaf', node.target);
                    if (isLeaf) senddata.push(GetNeedData(node, checked));
                    else {
                        var children = node.children;
                        for (var i = 0; i < children.length; i++) senddata.push(GetNeedData(children[i], checked));
                    }
                    $this.Target.trigger("onTreeChecked", { Data: senddata, Checked: checked, node: node });
                }
            });
            var checkednode = this.Tree.tree("getChecked");
            var checkedLeafNode = [];
            for (var i = 0; i < checkednode.length; i++) {
                if (this.Target.tree("isLeaf", checkednode[i].target)) checkedLeafNode.push(GetNeedData(checkednode[i], true));
            }
            this.Target.trigger("onTreeLoaded", { Data: checkedLeafNode, Checked: true });
        },
        SetAllCheck: function (checkstate) {
            var checkstate = dev.IsBoolean(checkstate) ? checkstate : checkstate != "false";
            var state = checkstate ? "check" : "uncheck";
            var roots = this.Tree.tree("getRoots");
            if (dev.IsNull(roots) || roots.length == 0) return;
            var senddate = [];
            for (var i = 0; i < roots.length; i++) {
                this.Tree.tree(state, roots[i].target);
                var childs = roots[i].children;
                for (var j = 0; j < childs.length; j++) senddate.push(GetNeedData(childs[j], checkstate));
            }
            $this.Target.trigger("onTreeChecked", { Data: senddate, Checked: checkstate });
        },
        AddNode: function (data, parentTarget) {
            if (dev.IsNull(data)) return;
            var treedata = ConvertToTreeDatas(data);
            if (dev.IsNull(parentTarget)) this.Tree.tree("append", { data: treedata });
            else this.Tree.tree("append", { parent: parentTarget, data: treedata });
            //根据treedata
            var senddate = [];
            for (var i = 0; i < treedata.length; i++) {
                if (dev.IsNull(treedata[i].children) || treedata[i].children.length == 0) {
                    if (treedata[i].checked) senddate.push(GetNeedData(treedata[i], true));
                }
                else {
                    var children = treedata[i].children;
                    for (var j = 0; j < children.length; j++) {
                        if (children.checked) senddate.push(GetNeedData(treedata[i], true));
                    }
                }
            }
            $this.Target.trigger("onTreeChecked", { Data: senddate, Checked: true });
        },
        SetIcon: function (icon, nodeid) {
            if (dev.IsNull(icon) || dev.IsNull(nodeid) || nodeid == "") return;
            dev.InsertIconRule(dev.App.TempStyle, ".layertreeIconof" + nodeid, icon);
            var newnode = this.Tree.tree("find", nodeid);
            this.Tree.tree('update', {
                target: newnode.target,
                iconCls: "layertreeIconof" + nodeid
            });
        },
        SetIconCls: function (iconClsStyle, nodeid) {
            if (dev.IsNull(iconClsStyle) || dev.IsNull(nodeid) || nodeid == "") return;
            var newnode = this.Tree.tree("find", nodeid);
            this.Tree.tree('update', {
                target: newnode.target,
                iconCls: iconClsStyle
            });
        },
        GetNodes: function () {
            return this.Tree.data("tree").data;
        }
    });
})(jQuery);
/*UCLegend地图图例*/
(function ($) {
    function getNewstr(str) {
        var bytesCount = 0;
        var newStr = "";
        if (!dev.IsNull(str)) {
            for (var i = 0; i < str.length; i++) {
                var c = str.charAt(i);//匹配双字节
                newStr += c;
                if (/^[\u0000-\u00ff]$/.test(c)) bytesCount += 1;
                else bytesCount += 2;
                if (bytesCount >= 48) { newStr += "..."; break; }
            }
        }
        return newStr;
    }
    dev.UCLegend = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        this.Right = dev.IsNumber(opt.Right) ? opt.Right : 5;
        this.Bottom = dev.IsNumber(opt.Bottom) ? opt.Bottom : 5;
        this.Left = dev.IsNumber(opt.Left) ? opt.Left : null;
        this.Top = dev.IsNumber(opt.Top) ? opt.Top : null;
        opt.Target = $('<div class="Legend"></div>');
        $.extend(this, new dev.Control(opt));
        if (!dev.IsNull(this.Right)) this.Target.css("right", this.Right + "px");
        if (!dev.IsNull(this.Bottom)) this.Target.css("bottom", this.Bottom + "px");
        if (!dev.IsNull(this.Left)) this.Target.css({ "left": this.Left + "px", "right": "" });
        if (!dev.IsNull(this.Top)) this.Target.css({ "top": this.Top + "px", "bottom": "" });
        this.IsPointStyle = dev.IsBoolean(opt.IsPointStyle) ? opt.IsPointStyle : opt.IsPointStyle == "true";
        this.Data = dev.IsNull(opt.Data) ? [] : opt.Data;
        this.Parent = dev.IsNull(opt.Parent) ? dev.App.MapPanel.MapDOM : $(opt.Parent);
        this.Title = dev.IsNull(opt.Title) ? "图例" : opt.Title;
        this.TitleAlign = dev.IsNull(opt.TitleAlign) ? 'left' : opt.TitleAlign;
        this.TitleSize = dev.IsNull(opt.TitleSize) ? 13 : opt.TitleSize;
        this.TitleColor = dev.IsNull(opt.TitleColor) ? 'black' : opt.TitleColor;
        this.Header = $('<div class="Legend-Title" style="font-size:' + this.TitleSize + 'px;text-align:' + this.TitleAlign + ';color=' + this.TitleColor + ';">' + this.Title + '</div>').appendTo(this.Target);
        $(this.Parent).append(this.Target);
        var contentDiv = $('<div id="legend-contentDiv" style="width:100%;max-height:400px;overflow:auto;min-width:150px;"></div>').appendTo(this.Target);
        //this.LegendRows = $('<div style="width:100%;height:' + (this.Data.length + 1) * 30 + 'px"></div>').appendTo(contentDiv);
        if (!dev.IsNull(this.Data) && this.Data.length > 0) {
            for (var i = 0; i < this.Data.length; i++) {
                var row = $('<div class="Legend-Content-Row"></div>').appendTo(contentDiv);
                var icondiv = $('<div class="Icondiv"></div>').appendTo(row);
                var iconstyle = $('<div style="height:12px;width:12px;margin-top:2px;border-style:solid;"></div>').appendTo(icondiv);
                if (!dev.IsNull(this.Data[i].Fill)) {
                    if (!dev.IsNull(this.Data[i].Fill.Color)) {
                        var color = dev.colorrgb(this.Data[i].Fill.Color);
                        if (color.length == 0) return;
                        if (!dev.IsNull(this.Data[i].Fill.Opacity)) color.push(parseFloat(this.Data[i].Fill.Opacity));
                        var newcolors;
                        if (color.length == 3) newcolors = "rgb(" + color.join(',') + ")";
                        if (color.length == 4) newcolors = "rgba(" + color.join(',') + ")";
                        iconstyle.css({ "background": newcolors });
                    }
                }
                if (!dev.IsNull(this.Data[i].Border)) {
                    if (!dev.IsNull(this.Data[i].Border.Color)) {
                        var color = dev.colorrgb(this.Data[i].Border.Color);
                        if (color.length == 0) return;
                        if (!dev.IsNull(this.Data[i].Border.Opacity)) color.push(parseFloat(this.Data[i].Border.Opacity));
                        var newcolors;
                        if (color.length == 3) newcolors = "rgb(" + color.join(',') + ")";
                        if (color.length == 4) newcolors = "rgba(" + color.join(',') + ")";
                        iconstyle.css({ "border-color": newcolors });
                    }
                    if (!dev.IsNull(this.Data[i].Border.Width)) iconstyle.css("border-width", parseInt(this.Data[i].Border.Width));
                    if (this.IsPointStyle) iconstyle.css("border-radius", parseInt((16 + parseInt(this.Data[i].Border.Width) * 2) / 2));
                }
                var strText = getNewstr(this.Data[i].Text) === this.Data[i].Text ? this.Data[i].Text : getNewstr(this.Data[i].Text);
                var textdiv = $('<div class="Textdiv">' + strText + '</div>').appendTo(row);
                row.prop("rowdata", this.Data[i]);
                row.click(function () {
                    var currdata = $(this).prop("rowdata");
                    $this.Target.triggerHandler("onLegendItemClick", currdata);
                })
            }
        }
    }
    $.fn.extend(dev.UCLegend.prototype, {
        Layout: function () {
            this.Target.css({ bottom: this.Bottom, right: this.Right });
        },
        SetTitle: function (title) {
            this.Header.html(title);
        },
        SetPointStyle: function (yes) {
            if (dev.IsBoolean(yes)) {
                this.IsPointStyle = yes;
                this.SetData(this.Data);
            }
        },
        SetBottom: function (bottom) {
            if (dev.IsNumber(bottom)) this.Layout(this.Bottom = bottom);
        },
        SetRight: function (right) {
            if (dev.IsNumber(right)) this.Layout(this.Right = right);
        },
        SetCss: function (css) {
            if (!dev.IsNull(css)) this.Target.css(css);
            if (!dev.IsNull(css.width)) this.Width = parseFloat(css.width);
            if (!dev.IsNull(css.height)) this.Height = parseFloat(css.height);
            if (!dev.IsNull(css.left)) this.Left = parseFloat(css.left);
            if (!dev.IsNull(css.right)) this.Right = parseFloat(css.right);
            if (!dev.IsNull(css.top)) this.Top = parseFloat(css.top);
            if (!dev.IsNull(css.bottom)) this.Bottom = parseFloat(css.bottom);
        },
        SetParent: function (parent) {
            if (dev.IsDOMElement(parent) || dev.IsjQueryObject(parent)) {
                this.Parent.remove(this.Target);
                $(parent).append(this.Target);
                this.Parent = $(parent);
            }
        },
        SetData: function (newData) {
            this.Data = newData;
            var $this = this;
            var tempcontent = $("#legend-contentDiv", this.Target);
            tempcontent.empty();
            this.Target.hide();
            if (!dev.IsNull(this.Data) && this.Data.length > 0) {
                this.Target.show();
                this.Visible = true;
                for (var i = 0; i < this.Data.length; i++) {
                    var row = $('<div class="Legend-Content-Row"></div>').appendTo(tempcontent);
                    //图标
                    var icondiv = $('<div class="Icondiv"></div>').appendTo(row);
                    var iconstyle = $('<div style="height:12px;width:12px;margin-top:2px;border-style:solid;"></div>').appendTo(icondiv);
                    if (!dev.IsNull(this.Data[i].Fill)) {
                        if (!dev.IsNull(this.Data[i].Fill.Color)) {
                            var color = dev.colorrgb(this.Data[i].Fill.Color);
                            if (color.length == 0) return;
                            if (!dev.IsNull(this.Data[i].Fill.Opacity)) color.push(parseFloat(this.Data[i].Fill.Opacity));
                            var newcolors;
                            if (color.length == 3) newcolors = "rgb(" + color.join(',') + ")";
                            if (color.length == 4) newcolors = "rgba(" + color.join(',') + ")";
                            iconstyle.css({ "background": newcolors });
                        }
                    }
                    if (!dev.IsNull(this.Data[i].Border)) {
                        if (!dev.IsNull(this.Data[i].Border.Color)) {
                            var color = dev.colorrgb(this.Data[i].Border.Color);
                            if (color.length == 0) return;
                            if (!dev.IsNull(this.Data[i].Border.Opacity)) color.push(parseFloat(this.Data[i].Border.Opacity));
                            var newcolors;
                            if (color.length == 3) newcolors = "rgb(" + color.join(',') + ")";
                            if (color.length == 4) newcolors = "rgba(" + color.join(',') + ")";
                            iconstyle.css({ "border-color": newcolors });
                        }
                        if (!dev.IsNull(this.Data[i].Border.Width)) iconstyle.css("border-width", parseInt(this.Data[i].Border.Width));
                        if (this.IsPointStyle) iconstyle.css("border-radius", parseInt((16 + parseInt(this.Data[i].Border.Width) * 2) / 2));
                    }
                    var strText = getNewstr(this.Data[i].Text) === this.Data[i].Text ? this.Data[i].Text : getNewstr(this.Data[i].Text);
                    var textdiv = $('<div class="Textdiv">' + strText + '</div>').appendTo(row);
                    row.prop("rowdata", this.Data[i]);
                    row.click(function () {
                        var currdata = $(this).prop("rowdata");
                        $this.Target.triggerHandler("onLegendItemClick", currdata);
                    })
                }
            }
        }
    });
})(jQuery);
/*UCWaitBox(等待框)*/
(function (window, document, undefined) {
    var width = 'width',
        length = 'length',
        radius = 'radius',
        lines = 'lines',
        trail = 'trail',
        color = 'color',
        opacity = 'opacity',
        speed = 'speed',
        shadow = 'shadow',
        style = 'style',
        height = 'height',
        left = 'left',
        marginleft = "margin-left",
        top = 'top',
        px = 'px',
        childNodes = 'childNodes',
        firstChild = 'firstChild',
        parentNode = 'parentNode',
        position = 'position',
        relative = 'relative',
        absolute = 'absolute',
        animation = 'animation',
        transform = 'transform',
        Origin = 'Origin',
        Timeout = 'Timeout',
        coord = 'coord',
        black = '#000',
        styleSheets = style + 'Sheets',
        prefixes = "webkit0Moz0ms0O".split(0),
        animations = {},
        useCssAnimations;
    function eachPair(args, it) {
        var end = ~~((args[length] - 1) / 2);
        for (var i = 1; i <= end; i++) {
            it(args[i * 2 - 1], args[i * 2]);
        }
    }
    function createEl(tag) {
        var el = document.createElement(tag || 'div');
        eachPair(arguments, function (prop, val) { el[prop] = val; });
        return el;
    }
    function ins(parent, child1, child2) {
        if (child2 && !child2[parentNode]) ins(parent, child2);
        parent.insertBefore(child1, child2 || null);
        return parent;
    }
    ins(document.getElementsByTagName('head')[0], createEl(style));
    var sheet = document[styleSheets][document[styleSheets][length] - 1];
    function addAnimation(to, end) {
        var name = [opacity, end, ~~(to * 100)].join('-'),
            dest = '{' + opacity + ':' + to + '}', i;
        if (!animations[name]) {
            for (i = 0; i < prefixes[length]; i++) {
                try {
                    sheet.insertRule('@' +
                      (prefixes[i] && '-' + prefixes[i].toLowerCase() + '-' || '') +
                      'keyframes ' + name + '{0%{' + opacity + ':1}' +
                      end + '%' + dest + 'to' + dest + '}', sheet.cssRules[length]);
                }
                catch (err) { }
            }
            animations[name] = 1;
        }
        return name;
    }
    function vendor(el, prop) {
        var s = el[style], pp, i;
        if (s[prop] !== undefined) return prop;
        prop = prop.charAt(0).toUpperCase() + prop.slice(1);
        for (i = 0; i < prefixes[length]; i++) {
            pp = prefixes[i] + prop;
            if (s[pp] !== undefined) return pp;
        }
    }
    function css(el) {
        eachPair(arguments, function (n, val) {
            el[style][vendor(el, n) || n] = val;
        });
        return el;
    }
    function defaults(obj) {
        eachPair(arguments, function (prop, val) {
            if (obj[prop] === undefined) obj[prop] = val;
        });
        return obj;
    }
    var Spinner = function Spinner(o) {
        this.opts = defaults(o || {},
          lines, 12, trail, 60, length, 7,
          width, 3, radius, 10, color, black,
          opacity, 1 / 4, speed, 1);
    },
    proto = Spinner.prototype = {
        spin: function (target) {
            var self = this, el = self.el = self[lines](self.opts);
            if (target) {
                var width = target.offsetWidth == 0 ? $(target).parent().width() : target.offsetWidth;
                var height = target.offsetHeight == 0 ? $(target).parent().height() : target.offsetHeight;
                ins(target, css(el,
                  left, ~~(width / 2) + px,
                  top, ~~(height / 2) + px
                ), target[firstChild]);
            }
            if (!useCssAnimations) {
                var o = self.opts, i = 0, f = 20 / o[speed],
                    ostep = (1 - o[opacity]) / (f * o[trail] / 100),
                    astep = f / o[lines];
                (function anim() {
                    i++;
                    for (var s = o[lines]; s; s--) {
                        var alpha = Math.max(1 - (i + s * astep) % f * ostep, o[opacity]);
                        self[opacity](el, o[lines] - s, alpha, o);
                    }
                    self[Timeout] = self.el && window['set' + Timeout](anim, 50);
                })();
            }
            return self;
        },
        stop: function () {
            var self = this, el = self.el;
            window['clear' + Timeout](self[Timeout]);
            if (el && el[parentNode]) el[parentNode].removeChild(el);
            self.el = undefined;
            return self;
        }
    };
    proto[lines] = function (o) {
        var el = css(createEl(), position, relative),
            animationName = addAnimation(o[opacity], o[trail]),
            i = 0, seg;
        function fill(color, shadow) {
            return css(createEl(),
              position, absolute,
              width, (o[length] + o[width]) + px,
              height, o[width] + px,
              'background', color,
              'boxShadow', shadow,
              transform + Origin, left,
              transform, 'rotate(' + ~~(360 / o[lines] * i) + 'deg) translate(' + o[radius] + px + ',0)',
              'borderRadius', '100em'
            );
        }
        for (; i < o[lines]; i++) {
            seg = css(createEl(),
              position, absolute,
              top, 1 + ~(o[width] / 2) + px,
              transform, 'translate3d(0,0,0)',
              animation, animationName + ' ' + 1 / o[speed] + 's linear infinite ' + (1 / o[lines] / o[speed] * i - 1 / o[speed]) + 's'
            );
            if (o[shadow]) ins(seg, css(fill(black, '0 0 4px ' + black), top, 2 + px));
            ins(el, ins(seg, fill(o[color], '0 0 1px rgba(0,0,0,.1)')));
        }
        return el;
    };
    proto[opacity] = function (el, i, val) {
        el[childNodes][i][style][opacity] = val;
    };
    var behavior = 'behavior', URL_VML = 'url(#default#VML)',
        tag = 'group0roundrect0fill0stroke'.split(0);
    (function () {
        var s = css(createEl(tag[0]), behavior, URL_VML), i;
        if (!vendor(s, transform) && s.adj) {
            for (i = 0; i < tag[length]; i++) {
                sheet.addRule(tag[i], behavior + ':' + URL_VML);
            }
            proto[lines] = function () {
                var o = this.opts, r = o[length] + o[width], s = 2 * r;
                function grp() {
                    return css(createEl(tag[0], coord + 'size', s + ' ' + s, coord + Origin, -r + ' ' + -r), width, s, height, s);
                }
                var g = grp(), margin = ~(o[length] + o[radius] + o[width]) + px, i;
                function seg(i, dx, filter) {
                    ins(g,
                      ins(css(grp(), 'rotation', 360 / o[lines] * i + 'deg', left, ~~dx),
                        ins(css(createEl(tag[1], 'arcsize', 1), width, r, height, o[width], left, o[radius], top, -o[width] / 2, 'filter', filter),
                          createEl(tag[2], color, o[color], opacity, o[opacity]),
                          createEl(tag[3], opacity, 0)
                        )
                      )
                    );
                }
                if (o[shadow]) {
                    for (i = 1; i <= o[lines]; i++) {
                        seg(i, -2, 'progid:DXImage' + transform + '.Microsoft.Blur(pixel' + radius + '=2,make' + shadow + '=1,' + shadow + opacity + '=.3)');
                    }
                }
                for (i = 1; i <= o[lines]; i++) {
                    seg(i);
                }
                return ins(css(createEl(),
                  'margin', margin + ' 0 0 ' + margin,
                  position, relative), g);
            };
            proto[opacity] = function (el, i, val, o) {
                o = o[shadow] && o[lines] || 0;
                el[firstChild][childNodes][i + o][firstChild][firstChild][opacity] = val;
            };
        }
        else { useCssAnimations = vendor(s, animation); }
    })();
    window.Spinner = Spinner;
})(window, document);
(function ($) {
    dev.UCWaitBox = function (param) {
        this.Parent = dev.IsjQueryObject(param) || dev.IsDOMElement(param) ? param : param.Parent;
        this.MaskColor = dev.IsNull(param.MaskColor) ? 'black' : param.MaskColor;
        this.SpinnerColor = dev.IsNull(param.SpinnerColor) ? 'black' : param.SpinnerColor;
        this.MaskOpacity = dev.IsNull(param.MaskOpacity) ? 0.1 : param.MaskOpacity;
        this.Width = dev.IsNumber(param.Width) ? param.Width + "px" : "100%";
        this.Height = dev.IsNumber(param.Height) ? param.Height + "px" : "100%";
        this.Options = {
            lines: 12, length: 7, width: 3, radius: 10,
            corners: 1, rotate: 0, color: this.SpinnerColor, speed: 1,
            trail: 60, shadow: false, hwaccel: false,
            className: 'spinner', zIndex: 99999, top: '50%', left: '50%'
        };
        this.Target = $('<div ucWaitBox="" style="position:absolute;left:0px;top:0px;width:' + this.Width + ';height: ' + this.Height + ';z-index:999999;">'
                       + '<div id="modal" style="position:absolute;width:100%;height:100%;left:0px;right:0px; background-color:' + this.MaskColor
                       + '; opacity:' + this.MaskOpacity + ';filter: alpha(opacity=10);">' + '</div></div>');
        if (!dev.IsNull(param.BackColor)) this.Target.css("background-color", param.BackColor);
    };
    $.fn.extend(dev.UCWaitBox.prototype, {
        Show: function (parent) {
            if (!dev.IsNull(parent)) this.Parent = parent;
            this.Parent.append(this.Target);
            var target = this.Target;
            if (dev.IsNull(this.Spinner)) this.Spinner = new Spinner(this.Options).spin(target[0]);
        },
        Close: function () {
            if (this.Spinner) this.Spinner.stop();
            this.Target.remove();
            this.Spinner = null;
        }//关闭等待框
    });
})(jQuery);
//Text(基础文本输入框)
(function ($) {
    function parseBorder(t) {
        if (dev.IsNull(t.Border)) return { t: 0, r: 0, b: 0, l: 0, w: 0, h: 0 };
        var bs = t.Border.split(" "), bl, bt, br, bb;
        if (bs.length == 1) bl = bt = br = bb = isNaN(parseInt(bs[0])) ? 0 : parseInt(bs[0]);
        else if (ps.length == 2) {
            bt = bb = isNaN(parseInt(bs[0])) ? 0 : parseInt(bs[0]),
            bl = br = isNaN(parseInt(bs[1])) ? 0 : parseInt(bs[1]);
        }
        else {
            bt = parseInt(ps[0]), br = parseInt(ps[1]), bb = parseInt(ps[2]), bl = parseInt(ps[3]);
            if (isNaN(bt)) bt = 0; if (isNaN(br)) br = 0; if (isNaN(bb)) bb = 0; if (isNaN(bl)) bl = 0;
        }
        return { t: bt, r: br, b: bb, l: bl, w: bl + br, h: bt + bb };
    }
    function parsePadding(t) {
        if (dev.IsNull(t.Padding)) return { t: 0, r: 0, b: 0, l: 0, w: 0, h: 0 };
        var ps = t.Padding.split(" "), pl, pt, pr, pb;
        if (ps.length == 1) pl = pt = pr = pb = isNaN(parseInt(ps[0])) ? 0 : parseInt(ps[0]);
        else if (ps.length == 2) {
            pt = pb = isNaN(parseInt(ps[0])) ? 0 : parseInt(ps[0]),
            pl = pr = isNaN(parseInt(ps[1])) ? 0 : parseInt(ps[1]);
        }
        else {
            pt = parseInt(ps[0]), pr = parseInt(ps[1]), pb = parseInt(ps[2]), pl = parseInt(ps[3]);
            if (isNaN(pt)) pt = 0; if (isNaN(pr)) pr = 0; if (isNaN(pb)) pb = 0; if (isNaN(pl)) pl = 0;
        }
        return { t: pt, r: pr, b: pb, l: pl, w: pl + pr, h: pt + pb };
    }
    function refreshClearButton(t) {
        if (dev.IsNull(t) || dev.IsNull(t.xButton)) return;
        t.xButton.css("display", t.textBox.val().length > 0 ? "" : "none");
    }
    function refreshRequireDiv(t) {
        if (dev.IsNull(t) || dev.IsNull(t.requireDiv)) return;
        t.requireDiv.css("display", t.textBox.val().length > 0 ? "none" : "block");
    }
    function layout(t) {
        var b = parseBorder(t), p = parsePadding(t), _p = t.GetPadding(t.Target),
            w = t.Target.width() + _p.w, h = t.Target.height() + _p.h;
        if (t.header) { w -= t.header.outerWidth(); if (dev.IsNull(t.HeaderLineHeight)) t.header.css("line-height", h + "px"); }
        t.body.css({ width: (w - b.w) + "px", left: (!!t.header ? t.header.outerWidth() : 0) + "px", height: h - b.h + "px" });
        if (t.xButton) { w -= 12; t.xButton.css("top", (h - b.h) / 2 - 11 + "px"); }
        if (t.requireDiv) { t.requireDiv.css({ right: p.r + "px", "line-height": (h - b.h) + "px" }); refreshRequireDiv(t); }
        t.textBox.css({ top: "0px", left: "0px", width: w - p.w - b.w + "px", height: h - p.h - b.h + "px", padding: t.Padding });
        if (!t.Enable && t.enableEl) t.enableEl.css({ left: t.body.css("left"), width: t.body.width() + t.GetBorder(t.body).w });
        if (t.tipEl) { //提示框布局更新
            var tipInfo = $(".text-tipInfo-" + t.TipAlign, t.tipEl), btw = t.Target.css("borderTopWidth"), blw = t.Target.css("borderLeftWidth");
            if (t.TipAlign == "right" || t.TipAlign == "left") {
                var l = t.TipAlign == "right" ? t.Target.outerWidth() - parseInt(blw) : -tipInfo.outerWidth() - parseInt(blw) - 3;
                t.tipEl.css({ top: "-" + btw, left: l + "px", width: tipInfo.outerWidth() + 3, height: tipInfo.outerHeight() });
            }
            else if (t.TipAlign == "top" || t.TipAlign == "bottom") {
                var _t = t.TipAlign == "top" ? -tipInfo.outerHeight() - parseInt(btw) - 3 : t.Target.outerHeight() - parseInt(btw);
                t.tipEl.css({ top: _t + "px", left: "-" + blw, width: tipInfo.outerWidth(), height: tipInfo.outerHeight() + 3 });
            }
        }
    }
    function showTip(t) {
        var tipEl = t.tipEl = $("<div class='text-tip'></div>").appendTo(t.Target);
        var tipInfo = $("<div class='text-tipInfo-" + t.TipAlign + "'>用户名不能为空，请输入用户名...</div>").appendTo(tipEl);
        var tipArrow = $("<div class='text-tipArrow-" + t.TipAlign + "'></div>").appendTo(tipEl);
        if (t.TipAlign == "right" || t.TipAlign == "left") {
            if (dev.IsNull(t.TipWidth)) {
                tipInfo.css("height", t.Target.outerHeight() - 10 + "px");
                tipInfo.css("line-height", t.Target.outerHeight() - 10 + "px");
            }
            else {
                tipInfo.css("width", t.TipWidth + "px");
                tipInfo.css("line-height", t.LineHeight + "px");
            }
            if (t.TipAlign == "right") tipInfo.css("left", 3 + "px");
            else tipArrow.css("left", tipInfo.outerWidth() - 1 + "px");
            tipArrow.css("top", t.Target.outerHeight() / 2 - 3 + "px");
        }
        else if (t.TipAlign == "top" || t.TipAlign == "bottom") {
            tipInfo.css({ "height": "14px", "line-height": "14px" });
            if (t.TipAlign == "bottom") tipInfo.css("top", "3px");
            else tipArrow.css("top", tipInfo.outerHeight() - 1 + "px");
        }
    }
    dev.Text = function (opt) {
        if (dev.IsNull(opt)) opt = {}; var $this = this;
        if (dev.IsNull(opt.Target)) {
            opt.Target = $("<div class='dev-text'></div>");
            opt.Target.appendTo(dev.IsDOMElementEx(opt.Parent) ? opt.Parent : document.body);
        }
        else if (!opt.Target.hasClass("dev-text")) opt.Target.addClass("dev-text");
        if (!dev.IsNull(opt.Width)) opt.Target.width(opt.Width);
        if (!dev.IsNull(opt.Height)) opt.Target.height(opt.Height);
        else if (dev.IsNull(opt.Target[0].style.height)) opt.Target.height(opt.Height = 24);
        $.extend(this, this.control = new dev.Control(opt)); funExt(this);
        this.TipWidth = opt.TipWidth; this.Target.prop("$this", $this);
        this.Border = dev.IsNull(opt.Border) ? "1px" : opt.Border;
        this.Padding = dev.IsNull(opt.Padding) ? "2px" : opt.Padding;
        this.Readonly = dev.IsNull(opt.Readonly) ? false : opt.Readonly;
        this.MaxLength = dev.IsNumber(opt.MaxLength) ? opt.MaxLength : undefined;
        this.Stretched = dev.IsBoolean(opt.Stretched) ? opt.Stretched : opt.Stretched === "true";
        this.LineHeight = dev.IsNull(opt.LineHeight) ? 18 : opt.LineHeight;
        this.Required = dev.IsBoolean(opt.Required) ? opt.Required : opt.Required === "true";
        this.TipAlign = dev.IsNull(opt.TipAlign) ? "right" : opt.TipAlign.toLocaleLowerCase();
        this.TextAlign = dev.IsNull(opt.TextAlign) ? 'left' : opt.TextAlign;
        this.Disabled = dev.IsBoolean(opt.Disabled) ? opt.Disabled : opt.Disabled === "true"
        this.ShowClearButton = dev.IsBoolean(opt.ShowClearButton) ? opt.ShowClearButton : opt.ShowClearButton == "true";
        if (!dev.IsNull(opt.Title)) {
            this.header = $("<div class='text-header'>" + opt.Title + "</div>").appendTo(this.Target);
            this.header.bind("contextmenu", function (e) { return false; });
            if (!dev.IsNull(opt.HeaderCSS)) this.header.css(opt.HeaderCSS);
            if (!dev.IsNull(opt.HeaderWidth)) this.header.css("width", opt.HeaderWidth);
            if (!dev.IsNull(opt.HeaderAlign)) this.header.css("text-align", opt.HeaderAlign);
            if (!dev.IsNull(opt.HeaderLineHeight)) this.header.css("line-height", this.HeaderLineHeight = opt.HeaderLineHeight);
        }
        this.body = $("<div class='text-text'></div>").css("border-width", this.Border).appendTo(this.Target);
        if (parseInt(this.Border) == 0) this.body.css("box-shadow", "none");
        if (!dev.IsNull(opt.BodyCSS)) this.body.css(opt.BodyCSS);
        this.SetEnable(this.Enable = dev.IsNull(opt.Enable) ? true : opt.Enable, true);
        this.textBox = $("<input type='text'/>").css("text-align", this.TextAlign).appendTo(this.body);
        this.textBox.bind('input propertychange', function () {
            if ($this.ShowClearButton) { refreshClearButton($this); refreshRequireDiv($this); }
            var nvalue = $(this).val();
            if (nvalue.length > $this.MaxLength) { $(this).val($this.oldValue); return; }
            if ($this.textBox.val() == $this.oldValue) return;
            $this.Target.triggerHandler("onChange", { newValue: $(this).val(), oldValue: $this.oldValue });
            $this.oldValue = $this.textBox.val();
        });
        this.textBox.bind("focus", function () {
            $this.body.addClass("focus");
            if ($this.ShowClearButton) refreshClearButton($this);
        });
        this.textBox.bind("blur", function () {
            $this.body.removeClass("focus");
            if ($this.ShowClearButton) { if ($this.xButton) $this.xButton.css("display", "none"); }
        });
        if (this.ShowClearButton) {
            this.xButton = $("<div class='icon-textbox-x text-button-x' style='display:none'></div>").appendTo(this.body);
            this.xButton.bind("mousedown", function () { $this.SetValue(""); refreshClearButton($this); refreshRequireDiv($this); });
        }
        if (this.Required) this.requireDiv = $("<div class='text-required'>*</div>").appendTo(this.body);
        this.readonlyEl = $("<div class='text-readonly'></div>").appendTo(this.body);
        this.readonlyEl.css("display", this.Readonly ? "block" : "");
        if (this.Disabled) { this.readonlyEl.css("background", "rgba(221,221,221,0.2)"); }
        this.textBox[0].placeholder = dev.IsNull(opt.TipInfo) ? "" : opt.TipInfo;
        this.textBox.val(dev.IsNull(opt.Value) ? opt.Text : opt.Value); this.oldValue = this.textBox.val();
        if ($(document.body).has(this.Target).length > 0) this.Layout();//showTip(this);
    }
    function funExt(control) {
        $.fn.extend(control, {
            GetBorder: function (el) {
                if (dev.IsNull(el)) return parseBorder(this);
                else return this.control.GetBorder(el);
            },
            GetPadding: function (el) {
                if (dev.IsNull(el)) return parsePadding(this);
                else return this.control.GetPadding(el);
            },
            SetValue: function (value) {
                if (dev.IsNull(value)) value = "";
                if (this.textBox.val() == value) return;
                this.textBox.val(value);
                this.Target.triggerHandler("onChange", { newValue: this.textBox.val(), oldValue: this.oldValue });
                this.oldValue = this.textBox.val();
            },
            SetWidth: function (width) {
                this.control.SetWidth(width);
                this.Layout();
            },
            SetHeight: function (height) {
                this.control.SetHeight(height);
                this.Layout();
            },
            SetSize: function (size) {
                this.control.SetSize(size)
                this.Layout();
            },
            SetBorder: function (border) {
                if (dev.IsNull(border)) return;
                this.Border = border;
                this.body.css("border-width", border);
            },
            Clear: function () {
                this.SetValue("");
                //后期验证等的隐藏
            },
            GetValue: function () { return this.textBox.val(); },
            Layout: function () { layout(this); },
            SetEnable: function (enable, f) {
                if (dev.IsNull(f) && this.Enable == enable) return;
                this.Enable = enable;
                if (!enable) {
                    if (this.enableEl) this.enableEl.css("display", "block");
                    else {
                        this.body.after(this.enableEl = $("<div class='text-enable'></div>"));
                        this.enableEl.css({ left: this.body.css("left"), width: this.body.width() + this.GetBorder(this.body).w });
                    }
                }
                else if (this.enableEl) this.enableEl.css("display", "none");
            },
            RefreshRequire: function () {
                refreshRequireDiv(this);
            },
            SetReadOnly: function (readonly) {
                if (dev.IsNull(readonly)) return;
                this.Readonly = readonly;
                this.readonlyEl.css("display", this.Readonly ? "block" : "");
            },
            SetDisabled: function (disabled) {
                if (dev.IsNull(disabled)) return;
                this.Disabled = disabled;
                if (this.Disabled) this.readonlyEl.css("background", "rgba(221,221,221,0.6)");
                else this.readonlyEl.css("background", "");
            }
        });
    }
})(jQuery);
//TextBox(文本输入框)
(function ($) {
    function layout(tb) {
        tb.text.Layout();
        if (tb.Type != "multi-text") return;
        var p = tb.GetPadding(), w = tb.body.width() - p.w, h = tb.body.height() - p.h;
        tb.textBox.css({ width: w + "px", height: h + "px", padding: tb.Padding });
    }
    dev.TextBox = function (opt) {
        if (dev.IsNull(opt)) opt = {}; var $this = this;
        if (dev.IsNull(opt.Target)) {
            opt.Target = $("<div class='dev-textbox'></div>");
            opt.Target.appendTo(dev.IsDOMElementEx(opt.Parent) ? opt.Parent : document.body);
        }
        else if (!opt.Target.hasClass("dev-textbox")) opt.Target.addClass("dev-textbox");
        this.Type = dev.IsNull(opt.Type) ? "text" : opt.Type.toLocaleLowerCase();
        // this.MaxLength = dev.IsNumber(opt.MaxLength) ? opt.MaxLength : undefined;
        if (this.Type != "password" && this.Type != "multi-text") this.Type = "text";
        if (this.Type != "multi-text") this.LineHeight = dev.IsNull(opt.LineHeight) ? 18 : opt.LineHeight;
        else { this.LineHeight = dev.IsNull(opt.LineHeight) ? 14 : opt.LineHeight; opt.ShowClearButton = false; }
        $.extend(this, this.text = new dev.Text(opt)), this.Target.prop("$this", $this), funExt(this);
        if (this.Type == "password") this.textBox[0].type = "password";
        else if (this.Type == "multi-text") {
            $(":first-child", this.body).remove();
            this.textBox = $("<textarea style='font-size:12px;'></textarea>").prependTo(this.body);
            if (this.MaxLength) {
                this.maxtip = $('<div style="height:16px;width:100px;color:red;right:15px; position:absolute;font-size:15px;bottom:5px;text-align:right;">(0/' + this.MaxLength + ')</div>').appendTo(this.body);
                this.textBox.bind('input propertychange', function (s, e) {
                    var value = $(this).val();
                    if (value.length > $this.MaxLength) { $(this).val($this.oldValue); return; }
                    $this.maxtip.html("(" + value.length + "/" + $this.MaxLength + ")");
                    $this.oldValue = value;
                });
            }
            this.Layout();
        }
        var $this = this;
    }
    function funExt(control) {
        $.fn.extend(control, {
            Layout: function () { layout(this); },
            SetLengthTip: function (value) {
                if (this.MaxLength) {
                    if (value.length > this.MaxLength) {
                        value = value.substr(0, this.MaxLength);
                        $(this).val(value);
                        this.maxtip.html("(" + value.length + "/" + this.MaxLength + ")");
                        this.oldValue = value;
                    }
                    else {
                        if (dev.IsNull(this.maxtip)) return;
                        this.maxtip.html("(" + value.length + "/" + this.MaxLength + ")");
                        this.oldValue = value;
                    }
                }
            }
        });
    }
})(jQuery);
//NumberBox(数字输入框)
(function ($) {
    function getBorder(tb) {
        if (dev.IsNull(tb.Border)) return { t: 0, r: 0, b: 0, l: 0, w: 0, h: 0 };
        var bs = tb.Border.split(" "), bl, bt, br, bb;
        if (bs.length == 1) bl = bt = br = bb = isNaN(parseInt(bs[0])) ? 0 : parseInt(bs[0]);
        else if (ps.length == 2) {
            bt = bb = isNaN(parseInt(bs[0])) ? 0 : parseInt(bs[0]),
            bl = br = isNaN(parseInt(bs[1])) ? 0 : parseInt(bs[1]);
        }
        else {
            bt = parseInt(ps[0]), br = parseInt(ps[1]), bb = parseInt(ps[2]), bl = parseInt(ps[3]);
            if (isNaN(bt)) bt = 0; if (isNaN(br)) br = 0; if (isNaN(bb)) bb = 0; if (isNaN(bl)) bl = 0;
        }
        return { t: bt, r: br, b: bb, l: bl, w: bl + br, h: bt + bb };
    }
    function getPadding(tb) {
        if (dev.IsNull(tb.Padding)) return { t: 0, r: 0, b: 0, l: 0, w: 0, h: 0 };
        var ps = tb.Padding.split(" "), pl, pt, pr, pb;
        if (ps.length == 1) pl = pt = pr = pb = isNaN(parseInt(ps[0])) ? 0 : parseInt(ps[0]);
        else if (ps.length == 2) {
            pt = pb = isNaN(parseInt(ps[0])) ? 0 : parseInt(ps[0]),
            pl = pr = isNaN(parseInt(ps[1])) ? 0 : parseInt(ps[1]);
        }
        else {
            pt = parseInt(ps[0]), pr = parseInt(ps[1]), pb = parseInt(ps[2]), pl = parseInt(ps[3]);
            if (isNaN(pt)) pt = 0; if (isNaN(pr)) pr = 0; if (isNaN(pb)) pb = 0; if (isNaN(pl)) pl = 0;
        }
        return { t: pt, r: pr, b: pb, l: pl, w: pl + pr, h: pt + pb };
    }
    function refreshClearButton(tb) {
        if (dev.IsNull(tb) || dev.IsNull(tb.xButton)) return;
        tb.xButton.css("display", tb.textBox.val().length > 0 ? "" : "none");
    }
    function refreshRequireDiv(tb) {
        if (dev.IsNull(tb) || dev.IsNull(tb.requireDiv)) return;
        tb.requireDiv.css("display", tb.textBox.val().length > 0 ? "none" : "block");
    }
    function layout(tb) {
        var b = getBorder(tb), w = tb.Target.width() + parseInt(tb.Target.css("padding-left")) + parseInt(tb.Target.css("padding-right")),
            p = getPadding(tb), h = tb.Target.height() + parseInt(tb.Target.css("padding-top")) + parseInt(tb.Target.css("padding-bottom"));
        if (tb.header) { w -= tb.header.outerWidth(); if (dev.IsNull(tb.HeaderLineHeight)) tb.header.css("line-height", h + "px"); }
        tb.body.css({ width: (w - b.w) + "px", left: (!!tb.header ? tb.header.outerWidth() : 0) + "px", height: h - b.h + "px" });
        if (tb.xButton) { w -= 12; tb.xButton.css("top", (h - b.h) / 2 - 11 + "px"); }
        if (tb.requireDiv) { tb.requireDiv.css({ right: p.r + "px", "line-height": h + "px" }); refreshRequireDiv(tb); }
        tb.textBox.css({ top: "0px", left: "0px", width: w - p.w - b.w + "px", height: h - p.h - b.h + "px", padding: tb.Padding });
    }
    function showTip(tb) {
        var tipEl = $("<div class='tip'></div>").appendTo(tb.Target);
        var tipInfo = $("<div class='tipInfo-" + tb.TipAlign + "'>用户名不能为空，请输入用户名...</div>").appendTo(tipEl);
        var tipArrow = $("<div class='tipArrow-" + tb.TipAlign + "'></div>").appendTo(tipEl);
        if (tb.TipAlign == "right" || tb.TipAlign == "left") {
            if (dev.IsNull(tb.TipWidth)) {
                tipInfo.css("height", tb.Target.height() - 8 + "px");
                tipInfo.css("line-height", tb.Target.height() - 8 + "px");
            }
            else {
                tipInfo.css("width", tb.TipWidth + "px");
                tipInfo.css("line-height", tb.LineHeight + "px");
            }
            if (tb.TipAlign == "right") tipInfo.css("left", 3 + "px");
            else tipArrow.css("left", tipInfo.outerWidth() - 1 + "px");
            tipArrow.css("top", tb.Target.outerHeight() / 2 - 3 + "px");
            var btw = tb.Target.css("borderTopWidth"), blw = tb.Target.css("borderLeftWidth");
            var l = tb.TipAlign == "right" ? tb.Target.outerWidth() - parseInt(blw) : -tipInfo.outerWidth() - 4;
            tipEl.css({ top: "-" + btw, left: l + "px", width: tipInfo.outerWidth() + 3, height: tipInfo.outerHeight() });
        }
        else if (tb.TipAlign == "top" || tb.TipAlign == "bottom") {
            tipInfo.css({ "height": "14px", "line-height": "14px" });
            var btw = tb.Target.css("borderTopWidth"), blw = tb.Target.css("borderLeftWidth");
            if (tb.TipAlign == "bottom") tipInfo.css("top", "3px");
            else tipArrow.css("top", tipInfo.outerHeight() - 1 + "px");
            var t = tb.TipAlign == "top" ? -tipInfo.outerHeight() - parseInt(btw) - 3 : tb.Target.outerHeight() - parseInt(btw);
            tipEl.css({ top: t + "px", left: "-" + blw, width: tipInfo.outerWidth(), height: tipInfo.outerHeight() + 3 });
        }
    }
    dev.NumberBox = function (opt) {
        if (dev.IsNull(opt)) opt = {}; var $this = this;
        if (dev.IsNull(opt.Target)) {
            opt.Target = $("<div class='dev-numberbox'></div>");
            opt.Target.appendTo(dev.IsDOMElementEx(opt.Parent) ? opt.Parent : document.body);
        }
        else if (!opt.Target.hasClass("dev-numberbox")) opt.Target.addClass("dev-numberbox");
        $.extend(this, this.text = new dev.Text(opt)), this.Target.prop("$this", $this), funExt(this);
        this.GroupSeparator = dev.IsNull(opt.GroupSeparator) ? "" : opt.GroupSeparator;//使用哪一种字符分割整数组(比如：99,999,999.00中的','就是该分隔符设置)
        this.DecimalSeparator = dev.IsNull(opt.DecimalSeparator) ? "." : opt.DecimalSeparator;//使用哪一种十进制字符分隔数字的整数和小数部分
        this.Step = dev.IsNull(opt.Step) ? null : opt.Step;//以多少位分割整数组(比如：99,999,999.00为3位一组)
        this.Min = dev.IsNull(opt.Min) ? null : opt.Min;//允许的最小值。
        this.Max = dev.IsNull(opt.Max) ? null : opt.Max;//允许的最大值。
        this.Prefix = dev.IsNull(opt.Prefix) ? "" : opt.Prefix;//前缀字符。(比如：金额的$或者￥)
        this.Suffix = dev.IsNull(opt.Suffix) ? "" : opt.Suffix;//后缀字符。(比如：后置的欧元符号€)
        this.Precision = dev.IsNull(opt.Precision) ? 0 : opt.Precision;//在十进制分隔符之后显示的最大精度。（即小数点后的显示精度）
        this.Text = opt.Value;
        this.Value = dev.IsNull(opt.Value) ? "" : this.Parser(opt.Value); //默认值
        this.textBox[0].style.imeMode = 'disabled';   // 禁用输入法,禁止输入中文字符
        this.textBox.bind("blur", function () {
            $this.SetValue($this.textBox[0].value);
        });
        this.textBox.keyup(function (event) {
            this.value = this.value.replace(/[^\x00-\xff]/g, "");
        });
        this.textBox.keydown(function (event) {
            return $this.Filter(event);
        });
        this.textBox.val(dev.IsNull(opt.Value) ? "" : this.Formatter(this.Value));
    }
    function funExt(control) {
        $.fn.extend(control, {
            Options: function () {
                return this.Target[0].$this;
            },
            Destroy: function () {
                this.Target.remove();
            },
            SetValue: function (value) {
                var float = this.Formatter(this.Parser(value));
                this.textBox.val(dev.IsNull(float) ? "" : float);
            },
            SetWidthEx: function (width) {
                if (!dev.IsNumber(width)) return;
                this.Width = width;
                layout(this);
            },
            SetSizeEx: function (width, height) {
                if (!dev.IsNumber(width) || !dev.IsNumber(height)) return;
                this.Width = width;
                this.Height = height;
                layout(this);
            },
            Clear: function () {
                this.textBox.val("");
                //后期验证等的隐藏
            },
            GetValue: function () {
                return this.Fix();
            },
            Layout: function () { layout(this); },
            Filter: function (e) {
                var ispass = false;
                var val = this.textBox.val();
                var k = e.key;
                if (k == "Enter") this.SetValue(val);
                var rightKey = k == "Backspace" || k == "Spacebar" || k == "," || k == "Left" || k == "Right";
                var isNum = /\d/.test(k);
                if (dev.IsNull(val)) {
                    if (isNum || (!isNum && (k == "." || k == "-" || rightKey))) ispass = true;
                }
                else {
                    if (isNum || (!isNum && ((val.indexOf("-") < 0 && k == "-") || (val.indexOf(".") < 0 && k == "."))) || rightKey)
                        ispass = true;
                }
                return ispass;
            },
            Formatter: function (value) {
                var step = this.Step;
                var splitor = this.GroupSeparator;
                if (!dev.IsNull(value)) {
                    value = value.toFixed(this.Precision)
                    var str = value.toString(), str1, str2;
                    var index = str.indexOf(".");
                    if (index != -1) {
                        str1 = str.substring(0, index);
                        str2 = str.substring(index + 1, str.length);
                    } else {
                        str1 = str;
                        str2 = "";
                    }
                    if (step > 0) {
                        var len = str1.length;
                        if (len > step) {
                            var l1 = len % step,
                                l2 = parseInt(len / step),
                                arr = [],
                                first = str1.substr(0, l1);
                            if (first != '') {
                                arr.push(first);
                            };
                            for (var i = 0; i < l2 ; i++) {
                                arr.push(str1.substr(l1 + i * step, step));
                            };
                            str1 = arr.join(splitor);
                        };
                    }
                    return this.Prefix + str1 + ((index == -1) ? "" : this.DecimalSeparator) + str2 + this.Suffix;;
                } else {
                    return "";
                }
            },
            Parser: function (value) {
                value = value.toString().replace(/\s+/g, "").replace(/,/g, "").replace(this.Prefix, "").replace(this.Suffix, "");
                var float = parseFloat(value);
                if (!dev.IsNull(value) && !isNaN(value)) {
                    var min = this.Min;
                    var max = this.Max;
                    if (!dev.IsNull(min) && min > float) float = min;
                    if (!dev.IsNull(max) && max < float) float = max;
                    return float;
                } else {
                    return "";
                }
            },
            Fix: function () {
                var value = this.textBox.val();
                var arr = value.split(this.GroupSeparator);
                value = arr.join("").replace(this.DecimalSeparator, ".").replace(this.Prefix, "").replace(this.Suffix, "");
                return value;
            },
            Disable: function () {
                this.textBox.attr("disabled", true);
            },
            Enable: function () {
                this.textBox.attr("disabled", false);
            },
            Reset: function () {
                var value = this.Formatter(this.Parser(this.Text));
                this.textBox.val(value);
            }
        });
    }
})(jQuery);
//Combo(下拉选择框)
(function ($) {
    function layout(cb) {
        cb.text.Layout();
        var _p = cb.GetPadding(cb.Target), h = cb.Target.height() + _p.h,
            b = cb.GetBorder(), p = cb.GetPadding(), w = cb.textBox.width();
        if (cb.downButton) {
            if (cb.requireDiv) {
                var r = cb.requireDiv.css("right");
                cb.requireDiv.css("right", (parseInt(r) + 12) + "px");
            }
            if (cb.xButton) cb.xButton.css("right", "12px");
            cb.downButton.css({ "height": h - b.h + "px" }); w -= 12;
        }
        cb.textBox.css({ width: w + "px" });
    }
    function enter(cb) {
        cb.body.addClass("text-focus");
        if (cb.downButton) {
            cb.downButton.addClass("combo-down-button-focus");
            cb.downButton.children().addClass("icon-combobox2");
        }
    }
    function leave(cb) {
        cb.body.removeClass("text-focus");
        if (cb.downButton) {
            cb.downButton.removeClass("combo-down-button-focus");
            cb.downButton.removeClass("combo-down-button-down");
            cb.downButton.children().removeClass("icon-combobox2");
            cb.downButton.children().removeClass("icon-combobox3");
        }
    }
    function down(cb) {
        cb.downButton.addClass("combo-down-button-down");
        cb.downButton.children().addClass("icon-combobox3");
    }
    function up(cb) {
        cb.downButton.removeClass("combo-down-button-down");
        cb.downButton.children().removeClass("icon-combobox3");
    }
    function popup(cb, v) {
        if (v && v == "none") { cb.popup.css("display", v); return; }
        cb.popup.css("display", "block");
        if (cb.Target.prop("$this").listBox) cb.Target.prop("$this").listBox.Layout();
        var b = cb.GetBorder(), p = cb.GetPadding(cb.Target), w = cb.body.outerWidth() - 2,
            l = cb.header ? cb.header.outerWidth() : 0, t = cb.Target.height() + p.h - 1;
        if (cb.PopupAlign == "top") t = -cb.popup.outerHeight() + 1;
        cb.popup.css({ "width": w + "px", "left": l + "px", top: t + "px" });
    }
    dev.Combo = function (opt) {
        if (dev.IsNull(opt)) opt = {}; var $this = this;
        if (dev.IsNull(opt.Target)) {
            opt.Target = $("<div class='dev-combo'></div>");
            opt.Target.appendTo(dev.IsDOMElementEx(opt.Parent) ? opt.Parent : document.body);
        }
        else if (!opt.Target.hasClass("dev-combo")) opt.Target.addClass("dev-combo");
        if (dev.IsNull(opt.Readonly)) { opt.Readonly = true; opt.ShowClearButton = false; }
        opt.MultiSelect = dev.IsNull(opt.MultiSelect) ? false : opt.MultiSelect;
        if (opt.MultiSelect) opt.Readonly = true;
        $.extend(this, this.text = new dev.Text(opt)), funExt(this), this.Target.prop("$this", $this);
        if (this.Readonly && this.xButton) this.xButton.remove(), this.xButton = this.text.xButton = null;
        this.PopupAlign = dev.IsNull(opt.PopupAlign) ? "bottom" : opt.PopupAlign;
        this.IsOverShow = dev.IsBoolean(opt.IsOverShow) ? opt.IsOverShow : opt.IsOverShow == "true";
        this.popup = $("<div class='combo-popup'></div>").appendTo(this.Target);
        this.popup.bind("contextmenu", function (e) { return false; });
        if (dev.IsNull(opt.ShowDownButton) || opt.ShowDownButton != false) {
            this.downButton = $("<div class='combo-down-button'><div class='combo-arrow icon-combobox1'></div></div>").appendTo(this.body);
            if (parseInt(this.Border) == 0) this.downButton.css({ "border-left-color": "transparent", "background-color": "transparent" });
            if (!dev.IsNull(opt.DownButtonCSS)) this.downButton.css(opt.DownButtonCSS);
            this.downButton.bind("contextmenu", function (e) { return false; });
            this.downButton.bind("click", function () { up($this); $this.ShowPopup(); });
            this.downButton.mousedown(function () { down($this); });
            this.downButton.mouseenter(function () { $this.over = true; enter($this); });
            this.downButton.mouseleave(function () { $this.over = false; if (!$this.focused) leave($this); });
        }
        this.textBox.mouseenter(function () { enter($this); });
        this.textBox.mouseleave(function () { if (!$this.focused) leave($this); });
        this.textBox.bind("focus", function () { $this.focused = true; enter($this); });
        this.textBox.bind("blur", function () { $this.focused = false; if (!$this.over) leave($this); });
        this.textBox.bind('onChange', function () { $this.RefreshRequire(); });
        this.textBox.mousedown(function () { down($this); });
        this.textBox.mouseup(function () { up($this); });
        this.textBox.click(function () { $this.ShowPopup(); });
        this.readonlyEl.mouseenter(function () { enter($this); if ($this.IsOverShow) $this.ShowPopup(); });
        this.readonlyEl.mouseleave(function () { leave($this); });
        this.readonlyEl.mousedown(function () { down($this); });
        this.readonlyEl.mouseup(function () { up($this); });
        this.readonlyEl.click(function () { $this.ShowPopup(); });
        this.Target.mouseleave(function () { if ($this.ShowPopup) $this.HidePopup(); });
        if (this.header) this.header.mouseenter(function () { if ($this.ShowPopup) $this.HidePopup(); });
        layout(this);
    }
    function funExt(control) {
        $.fn.extend(control, {
            SetText: function (text) { this.text.SetValue(text); },
            ShowPopup: function () { popup(this, "block"); },
            HidePopup: function () { popup(this, "none"); },
            GetText: function () { return this.textBox.val(); },
            Clear: function () { this.text.Clear(); },
            SetWidth: function (width) { this.text.SetWidth(width); this.Layout(); },
            SetHeight: function (height) { this.text.SetHeight(height); this.Layout(); },
            SetSize: function (size) { this.text.SetSize(size); this.Layout(); },
            SetPopueHeight: function (height) { this.popup.height(height); },
            Layout: function () { layout(this); }
        });
    }
})(jQuery);
//Combobox(下拉选择输入框)
(function ($) {
    dev.Combobox = function (opt) {
        if (dev.IsNull(opt)) opt = {}; var $this = this;
        if (dev.IsNull(opt.Target)) {
            opt.Target = $("<div class='dev-combobox'></div>");
            opt.Target.appendTo(dev.IsDOMElementEx(opt.Parent) ? opt.Parent : document.body);
        }
        else if (!opt.Target.hasClass("dev-combobox")) opt.Target.addClass("dev-combobox");
        $.extend(this, this.combo = new dev.Combo(opt)), funExt(this), this.Target.prop("$this", $this);
        this.listBox = new dev.ListBox({
            TextField: opt.TextField, ValueField: opt.ValueField, Height: opt.PopupHeight, Parent: this.popup,
            Data: dev.IsNull(opt.Data) ? [] : opt.Data, MultiSelect: opt.MultiSelect, ShowCheckBox: opt.MultiSelect,
            SelectedItem: opt.SelectedItem, SelectedIndex: opt.SelectedIndex, CSS: { "border": "0px" }
        });
        this.listBox.bind("onSelectChanged", function () {
            $this.text.SetValue($this.listBox.GetText());
            $this.Target.triggerHandler("onSelectChanged", $this.listBox.SelectedItem);
            if (!$this.listBox.MultiSelect) $this.HidePopup();
        });
        this.text.SetValue(this.listBox.GetText());
        this.Layout();
    }
    function funExt(control) {
        $.fn.extend(control, {
            SetValue: function (value) {
                var lb = this.listBox;
                if (dev.IsNull(lb.Data) || dev.IsNull(value)) return lb.SetSelectedIndex(-1);
                for (var i = 0; i < lb.Data.length; i++) {
                    if (value == lb.GetValue(lb.Data[i])) return lb.SetSelectedIndex(i);
                }
                return lb.SetSelectedIndex(-1);
            },
            SetData: function (data) { this.listBox.SetData(data); this.RefreshRequire(); },
            SetSelectedItem: function (item) { this.listBox.SetSelectedItem(item); },
            SetSelectedIndex: function (index) { this.listBox.SetSelectedIndex(index); },
            GetData: function () { return this.listBox.Data; },
            GetValue: function () { return this.listBox.GetValue(); },
            ShowPopup: function () { this.combo.ShowPopup(), this.listBox.Layout(); },
            GetSelectedItem: function () { return this.listBox.SelectedItem; },
            Clear: function () { this.listBox.SetData([]); this.text.Clear(); },
            SetWidth: function (width) { this.text.SetWidth(width); this.Layout(); },
            SetHeight: function (height) { this.text.SetHeight(height); this.Layout(); },
            SetSize: function (size) { this.text.SetSize(size); this.Layout(); },
            SetPopueHeight: function (height) { this.listBox.SetHeight(height); },
            Layout: function () {
                this.combo.Layout();
                this.listBox.SetCSS({ "width": (this.body.outerWidth() - 2) + "px" });
            }
        });
    }
})(jQuery);
//CheckBox
(function ($) {
    function getChecked(checked, threeState) {
        if (threeState && dev.IsNull(checked)) return null;
        return dev.IsBoolean(checked) ? checked : checked == "true";
    }
    dev.CheckBox = function (opt) {
        if (dev.IsNull(opt)) opt = {}; var $this = this, guid = Guid.NewGuid().ToString('N');
        if (dev.IsNull(opt.Target)) opt.Target = $("<div class='dev-checkbox'></div>");
        else if (dev.IsNull(opt.ID)) opt.ID = opt.Target.attr("id");
        $.extend(this, this.control = new dev.Control(opt)), funExt(this), this.Target.prop("$this", this);
        this.Target.css("display", this.Visible ? "inline-block" : "none");
        this.ThreeState = dev.IsBoolean(opt.ThreeState) ? opt.ThreeState : opt.ThreeState == "true";
        this.checkboxPanel = $("<div class='checkboxPanel icon-checkbox-0'></div>").appendTo(this.Target);
        this.checkbox = $("<input id='" + guid + "' type='checkbox' value='" + (dev.IsNull(opt.Value) ? "" : opt.Value) + "'/>").appendTo(this.checkboxPanel);
        this.label = $("<label for='" + guid + "' class='Text'>" + (dev.IsNull(opt.Text) ? "" : opt.Text) + "</label>").appendTo(this.Target);
        this.SetChecked(this.Checked = getChecked(opt.Checked, this.ThreeState), true);
        this.checkbox.change(function () { $this.SetChecked($this.checkbox[0].checked); });
    }
    function funExt(control) {
        $.fn.extend(control, {
            SetChecked: function (checked, flag) {
                checked = getChecked(checked, this.ThreeState);
                if (dev.IsNull(flag) && this.Checked == checked) return;
                this.Checked = checked;
                if (this.Checked != null) {
                    this.checkbox[0].checked = this.Checked;
                    this.checkboxPanel.removeClass("icon-checkbox-2");
                    this.checkboxPanel.removeClass(this.Checked ? "icon-checkbox-0" : "icon-checkbox-1");
                    this.checkboxPanel.addClass(this.Checked ? "icon-checkbox-1" : "icon-checkbox-0");
                }
                else {
                    this.checkbox[0].checked = false;
                    this.checkboxPanel.removeClass("icon-checkbox-0");
                    this.checkboxPanel.removeClass("icon-checkbox-1");
                    this.checkboxPanel.addClass("icon-checkbox-2");
                }
                this.Target.attr("_checked", '' + this.Checked);
                this.Target.trigger("onChange", this.Checked);//选择变化事件
            },
            SetValue: function (value) { this.checkbox.val(dev.IsNull(value) ? "" : value); },
            GetValue: function () { return this.checkbox.val(); }
        });
    }
})(jQuery);
//Radio
(function ($) {
    dev.Radio = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        var $this = this;
        opt.Height = dev.IsNull(opt.Height) ? 16 : opt.Height;
        if (dev.IsNull(opt.Target)) opt.Target = $('<span class="dev-radio"></span>');
        else opt.ID = opt.Target.attr("id");
        $.extend(this, new dev.Control(opt));
        this.Target.css("display", "inline-block");
        this.Checked = dev.IsBoolean(opt.Checked) ? opt.Checked : false;
        this.Parent = opt.Parent;
        this.Value = opt.Value;
        this.Name = opt.Name;
        this.Text = opt.Text;
        var id = Guid.NewGuid().ToString('N');
        this.radio = $('<span class="radio ' + (this.Checked ? 'icon-radio-1' : "icon-radio-0")
                     + '" name="' + this.Name + '"><input id="' + id + '" checked="' + (this.Checked ? "checked" : "")
                     + '" type="radio" name="' + this.Name + '" value="' + this.Value + '"/></span>');
        $("input[type=radio]", this.radio).change(function (s, e) {
            $this.Checked = $(this).prop("checked");
            $("input[name=" + $this.Name + "]").removeAttr("checked");
            $("span[name='" + $(this).attr("name") + "']").removeClass("icon-radio-1").removeClass("icon-radio-0").addClass("icon-radio-0");
            var className = $this.Checked ? 'icon-radio-1' : "icon-radio-0";
            var removeclassName = $this.Checked ? "icon-radio-0" : "icon-radio-1";
            $(this).parent().removeClass(removeclassName).addClass(className);
            $this.Target.attr("_checked", $this.Checked);
            $this.Target.triggerHandler("onChange", $this);
        });
        this.Target.append(this.radio);
        this.Target.append($('<label class="Text" for="' + id + '">' + this.Text + '</label>'));
        $("input[type=radio]", this.radio).prop("checked", this.Checked);
        this.Target.attr("_checked", this.Checked).attr("group", this.Name);
        if (!dev.IsNull(this.Parent) && dev.IsjQueryObject(this.Parent)) this.Parent.append(this.Target);
        funExt(this);
        this.Target.prop("$this", this);
    };
    function funExt(control) {
        $.fn.extend(control, {
            GetLabel: function () { return $(".Text", this.Target); },
            GetValue: function () { return $("input[type = radio]", this.radio).val(); },
            SetValue: function (value) { $("input[type = radio]", this.radio).val(this.Value = value); },
            GetText: function () { return $(".Text", this.Target).text(); },
            SetText: function (text) { $(".Text", this.Target).text(this.Text = text); },
            GetChecked: function () { return $("input[type = radio]", this.radio).prop("checked"); },
            SetChecked: function (checked) {
                if (!dev.IsBoolean(checked) || this.Checked === checked) return;
                this.Checked = checked;
                var radioButton = $("input[type = radio]", this.radio);
                radioButton.prop("checked", this.Checked);
                radioButton.change();
            },
            GetCheckedRadio: function () {
                return $("[name=" + $("[type = radio]", this.radio).attr("name") + "]").find(".icon-radio-1");
            },
            GetGroupCheckValue: function (group) {
                var radio = $("[group=2014]").filter(function (i, o) {
                    return $(o).attr("_checked") === "true";
                });

                return radio.prop("$this").GetValue();
            },
            GetGroupRadio: function () { return $("[name=" + $("[type = radio]", this.radio).attr("name") + "]"); },
            SetCheckState: function (checked) {
                if (!dev.IsBoolean(checked) || this.Checked === checked) return;
                this.Checked = checked;
                var radioButton = $("input[type = radio]", this.radio);
                radioButton.prop("checked", this.Checked);
                $("span[group=" + this.Name + "]").attr("_checked", false);
                var className = this.Checked ? 'icon-radio-1' : "icon-radio-0";
                var removeclassName = this.Checked ? "icon-radio-0" : "icon-radio-1";
                radioButton.parent().removeClass(removeclassName).addClass(className);
                this.Target.attr("_checked", this.Checked);
            }
        });
    }
})(jQuery);
//ListBox
(function ($) {
    function do_selected(cb) {
        function doItem(c, arr) {
            for (var i = 0; i < c.SelectedItem.length; i++) {
                var _i = $.inArray(c.SelectedItem[i], c.Data);
                if (_i >= 0 && $.inArray(_i, arr) < 0) arr.push(_i);
            }
        }
        function doIndex(c, arr) {
            for (var i = 0; i < c.SelectedIndex.length; i++) {
                if (c.SelectedIndex[i] >= 0 && c.SelectedIndex[i] < c.Data.length
                    && $.inArray(c.SelectedIndex[i], arr) < 0) arr.push(c.SelectedIndex[i]);
            }
        }
        function doResult(c, arr) {
            if (arr.length == 0) {
                c.SelectedIndex = $([]);
                c.SelectedItem = $([]);
            } else {
                var item = [];
                for (var i = 0; i < arr.length; i++) {
                    item.push(cb.Data[arr[i]]);
                }
                c.SelectedIndex = $(arr);
                c.SelectedItem = $(item);
            }
        }
        if (cb.Data.length == 0) {
            cb.SelectedItem = $([]);
            cb.SelectedIndex = $([]);
        }
        else {
            var index = [];
            doItem(cb, index);
            doIndex(cb, index);
            doResult(cb, index);
        }
    }
    function select(cb, selection, isIndex) {
        cb.SelectedIndex = [], cb.SelectedItem = [];
        selection = dev.IsBaseType(selection) ? $([selection]) : $(selection);
        if (selection.length > 0 && isIndex) {
            var arrIndex = [], arrItem = [];
            for (var i = 0; i < selection.length; i++) {
                if (selection[i] >= 0 && selection[i] < cb.Data.length) {
                    arrIndex.push(selection[i]), arrItem.push(cb.Data[selection[i]]);
                }
            }
            cb.SelectedIndex = arrIndex, cb.SelectedItem = arrItem;
        }
        else if (selection.length > 0 && !isIndex) {
            var arrIndex = [], arrItem = [];
            for (var i = 0; i < selection.length; i++) {
                var _i = $.inArray(selection[i], cb.Data);
                if (_i >= 0) { arrIndex.push(_i), arrItem.push(cb.Data[_i]) }
            }
            cb.SelectedIndex = arrIndex, cb.SelectedItem = arrItem;
        }
        $(".listbox-item", cb.Target).each(function (i, o) {
            var item = $(o).prop("$this"), sed = $.inArray(item, cb.SelectedItem) >= 0;
            $(o).css("background-color", sed ? "#FFE48D" : "");
            if (cb.ShowCheckBox) {
                if (sed) $(".listbox-text", o).removeClass("icon-checkbox-3").addClass("icon-checkbox-4");
                else $(".listbox-text", o).removeClass("icon-checkbox-4").addClass("icon-checkbox-3");
            }
        });
        cb.Target.triggerHandler("onSelectChanged", cb.SelectedItem);
    }
    dev.ListBox = function (opt) {
        if (dev.IsNull(opt)) opt = {}; var $this = this;
        if (dev.IsNull(opt.Target)) {
            opt.Target = $("<div class='dev-listbox'></div>");
            opt.Target.appendTo(dev.IsDOMElementEx(opt.Parent) ? opt.Parent : document.body);
        }
        else if (!opt.Target.hasClass("dev-listbox")) opt.Target.addClass("dev-listbox");
        if (!dev.IsNull(opt.Width)) opt.Target.width(opt.Width);
        if (!dev.IsNull(opt.Height)) opt.Target.height(opt.Height);
        $.extend(this, this.control = new dev.Control(opt)), funExt(this), this.Target.prop("$this", this);
        this.ShowCheckBox = dev.IsNull(opt.ShowCheckBox) ? false : opt.ShowCheckBox;
        this.MultiSelect = dev.IsNull(opt.MultiSelect) ? false : opt.MultiSelect;
        this.Data = dev.IsNull(opt.Data) ? [] : opt.Data; this.Stretched = false;
        this.TextField = opt.TextField, this.ValueField = opt.ValueField;
        if (dev.IsBaseType(opt.SelectedItem)) opt.SelectedItem = [opt.SelectedItem];
        this.SelectedItem = dev.IsNull(opt.SelectedItem) ? $([]) : $(opt.SelectedItem);
        if (dev.IsNumber(opt.SelectedIndex)) opt.SelectedIndex = [opt.SelectedIndex];
        this.SelectedIndex = dev.IsNull(opt.SelectedIndex) ? $([]) : $(opt.SelectedIndex);
        do_selected(this); this.SetData(this.Data, true);
    }
    function funExt(control) {
        $.fn.extend(control, {
            SetData: function (data, f) {
                if (dev.IsNull(f)) this.SelectedItem = [], this.SelectedIndex = [];
                if (dev.IsNull(data)) data = $([]);
                if (!dev.IsjQueryObject(data)) data = $(data);
                var $this = this; this.Data = data;
                var v = dev.IsNull(this.ValueField), t = dev.IsNull(this.TextField);
                var panel = $("<div class='listbox-panel'></div>");
                if (this.Target[0].style.height != "") {
                    this.Stretched = true;
                    if (this.Box) this.Box.SetContent(panel);
                    else this.Box = new dev.Box({ HasBorder: false, Parent: this.Target, Content: panel, CSS: { "background-color": "rgba(0,0,0,0)" } });
                }
                else this.Target.empty(), panel.appendTo(this.Target), this.Stretched = false;
                for (var i = 0; i < data.length; i++) {
                    var div = $("<div class='listbox-item'></div>").appendTo(panel);
                    div.prop("$this", data[i]);
                    div.click(function () {
                        if ($this.MultiSelect) {
                            var o = $(this).prop("$this"), d = $this.Data, si = $this.SelectedIndex,
                                item = $this.SelectedItem, sed = $.inArray(o, item) == -1;
                            if (sed) { var i = $.inArray(o, d); item.push(o); si.push(i); }
                            else { var i = $.inArray(o, item); item.splice(i, 1); si.splice(i, 1); }
                            $this.SetSelectedItem(item);
                        }
                        else $this.SetSelectedItem($(this).prop("$this"));
                    });
                    if (!v && !dev.IsNull(data[i])) div.prop("value", data[i][this.ValueField]);
                    var text = t ? data[i] : data[i][this.TextField];
                    var hasIcon = data[i].icon || data[i].iconCls;
                    if (hasIcon) {
                        if (data[i].icon) div.append("<img class='listbox-icon' src='" + data[i].icon + "'/>");
                        else div.append("<img src='../image/transparent.png' class='listbox-icon " + data[i].iconCls + "'/>");
                    }
                    var span = $("<span class='listbox-text'>" + text + "</span>").appendTo(div);
                    var sed = $.inArray(i, this.SelectedIndex) >= 0;
                    var padding = "0px", left = "22px";
                    if (this.ShowCheckBox && hasIcon) padding = "36px", left = "20px";
                    else if (!this.ShowCheckBox && hasIcon) padding = "20px", left = "4px";
                    else if (this.ShowCheckBox && !hasIcon) padding = "16px";
                    if (this.ShowCheckBox) span.addClass(sed ? "icon-checkbox-4" : "icon-checkbox-3");
                    if (hasIcon) $(".listbox-icon", div).css("left", left);
                    span.css("padding-left", padding);
                    div.css("background-color", "rgba(0,0,0,0)");
                    // if (sed) div.css("background-color", "#FFE48D");
                }
            },
            SetSelectedItem: function (item) {
                select(this, item, false);
            },
            SetSelectedIndex: function (index) {
                if (index == 0) index = [0];
                select(this, index, true);
            },
            SetHeight: function (height) {
                var f = !dev.IsNull(height) && ("" + height).indexOf('%') > 0;
                if (!f && isNaN(parseInt(height))) {
                    if (this.Target[0].style.height != "") {
                        var panel = $(".listbox-panel", this.Target);
                        panel.css("position", "relative");
                        this.Target[0].style.height = "";
                        this.Target.append(panel);
                        this.Box.Target.remove();
                        this.Box = null; this.Stretched = false;
                    }
                }
                else {
                    if (!this.Box) this.Box = new dev.Box({ HasBorder: false, Parent: this.Target });
                    this.Target.css("height", height); this.Stretched = true;
                    this.Box.SetContent($(".listbox-panel", this.Target));
                }
                this.Target.trigger("onResize");//大小变化事件
            },
            GetText: function (item) {
                if (dev.IsNull(item)) item = this.SelectedItem;
                if (dev.IsNull(item)) return "";
                if (dev.IsBaseType(item)) item = [item];
                var text = "", $this = this;
                $(item).each(function (i, o) {
                    if (!dev.IsNull(o)) {
                        if (!dev.IsNull($this.TextField)) {
                            if (o[$this.TextField])
                                text += o[$this.TextField] + "，";
                        }
                        else text += o + "，";
                    }
                });
                if (text == "") return text;
                return text.substring(0, text.length - 1);
            },
            GetValue: function (item) {
                if (dev.IsNull(item)) item = this.SelectedItem;
                if (dev.IsNull(item)) return "";
                if (dev.IsBaseType(item)) item = [item];
                var vals = [], $this = this;
                $(item).each(function (i, o) {
                    if (!dev.IsNull(o)) {
                        if (!dev.IsNull($this.ValueField)) {
                            vals.push(o[$this.ValueField]);
                        } else vals.push(o);
                    }
                    else vals.push(undefined);
                });
                if (vals.length > 1 || this.MultiSelect) return vals;
                return vals.length == 0 ? undefined : vals[0];
            },
            Layout: function () { if (this.Box) this.Box.Layout(); }
        });
    }
})(jQuery);
//NumberSpinnerBox(数字微调)
(function ($) {
    function enter(target) {
        if (!target._over) return;
        target.Target.addClass("dev-numberspinner-hover");
        target.Target.children("div").addClass("spinnerbutton-hover");
        target.spinupButton.children().addClass("icon-combobox5");
        target.spindownButton.children().addClass("icon-combobox2");
    }

    function leave(target) {
        if (target._focused && target._over) return;
        target.Target.removeClass("dev-numberspinner-hover");
        target.Target.children("div").removeClass("spinnerbutton-hover");
        target.spinupButton.children().removeClass("icon-combobox5");
        target.spindownButton.children().removeClass("icon-combobox2");
    }

    function layout(target) {
        target.Target.outerWidth(target.Target.width());
        target.numberbox.height(target.Target.height() - 2);
        target.numberbox.width(target.Target.width() - target.spinner.outerWidth() - 1);
        target.spinner.height(target.Target.height());
    }

    function resetValue(target) {
        if (dev.IsNull(target.Value)) return;
        var vlstring = "";
        if (!dev.IsNull(target.Prefix)) vlstring += target.Prefix;
        if (!dev.IsNull(target.Value)) vlstring += target.Value.toFixed(target.Precision);
        if (!dev.IsNull(target.Suffix)) vlstring += target.Suffix;
        target.numberbox.val(vlstring);
        if (dev.IsNull(target.oldvalue)) target.oldvalue = null;
        if (target._oldvalue == target.Value) return;
        target.Target.triggerHandler("onChange", { newValue: target.Value, oldValue: target.oldvalue });
    }

    dev.NumberSpinnerBox = function (opt) {
        if (dev.IsNull(opt)) opt = {}; var $this = this;
        opt.Width = dev.IsNull(opt.Width) ? 150 : opt.Width;
        opt.Height = dev.IsNull(opt.Height) ? 22 : opt.Height;
        if (dev.IsNull(opt.Target)) opt.Target = $('<div class="dev-numberspinner"></div>');
        else opt.ID = opt.Target.attr("id");
        opt.Target.css({ "width": opt.Width, "height": opt.Height });
        if (!dev.IsNull(opt.CSS)) opt.Target.css(opt.CSS);
        $.extend(this, new dev.Control(opt));
        this.Precision = dev.IsNumber(opt.Precision) ? opt.Precision : 0;
        this.Value = !dev.IsNumber(opt.Value) ? null : parseFloat(opt.Value.toFixed(this.Precision));
        this.Prefix = dev.IsNull(opt.Prefix) ? "" : opt.Prefix;
        this.Suffix = dev.IsNull(opt.Suffix) ? "" : opt.Suffix;
        this.Min = !dev.IsNumber(opt.Min) ? null : opt.Min;
        this.Max = !dev.IsNumber(opt.Max) ? null : opt.Max;
        this.Increment = !dev.IsNumber(opt.Increment) ? 1 : opt.Increment;
        this.numberbox = $('<input class="numberbox" type="text"/>');
        this.spinner = $('<div class="spinnerbutton"></div>');
        this.spinupButton = $('<div class="btnArrowup"><div class="icon-combobox4" style="width: 5px; height: 3px; position: absolute; left: 3px; top: 4px;"></div></div>');
        this.spindownButton = $('<div class="btnArrowdown"><div class="icon-combobox1" style="width: 5px; height: 3px; position: absolute; left: 3px; top: 4px;"></div></div>');
        this.spinner.append(this.spinupButton).append(this.spindownButton);
        this.Target.append(this.numberbox).append(this.spinner);
        resetValue(this);
        this.Target.bind("focusin", function () { $this._focused = true; });
        this.Target.bind("focusout", function () {
            leave($this); $this._focused = false;
            if ($this._over) return;
            var valString = $this.numberbox.val().replace($this.Prefix, "").replace($this.Suffix, "");
            if (dev.IsNull(valString)) return;
            else if (valString == "." || valString == "-" || valString == ".-" || valString == "-." || isNaN(parseFloat(valString)) || !isFinite(parseFloat(valString))) {
                $this.numberbox.val("");
                return;
            }
            $this._oldvalue = $this.Value;
            var newvalue = parseFloat(parseFloat(valString).toFixed($this.Precision));
            if (!dev.IsNull($this.Max) && newvalue > $this.Max) newvalue = parseFloat($this.Max.toFixed($this.Precision));
            if (!dev.IsNull($this.Min) && newvalue < $this.Min) newvalue = parseFloat($this.Min.toFixed($this.Precision));
            $this.Value = newvalue;
            resetValue($this);

        });
        this.Target.bind("mouseover", function () { $this._over = true; enter($this); });
        this.Target.bind("mouseleave", function () { leave($this); $this._over = false; });
        this.Target.bind("keypress", function (e) {
            var ispass = false;
            var val = $this.numberbox.val();
            var isNum = /\d/.test(e.key);
            if (dev.IsNull(val)) {
                if (isNum || (!isNum && (e.key == "." || e.key == "-"))) ispass = true;
            }
            else {
                if (isNum || (!isNum && ((val.indexOf("-") < 0 && e.key == "-") ||
                    (val.indexOf(".") < 0 && e.key == ".")))) ispass = true;
            }
            return ispass;
        });

        this.spinupButton.mousedown(function () {
            $(this).css("background-color", "#c9def5");
            $(this).children().addClass("icon-combobox6");
        }).mouseup(function () {
            $(this).css("background-color", "");
            $(this).children().removeClass("icon-combobox6");
            if (dev.IsNull($this.Value)) $this.Value = 0;
            var newvalue = $this.Value + $this.Increment;
            if (!dev.IsNull($this.Max)) newvalue = $this.Value + $this.Increment > $this.Max ? $this.Max : $this.Value + $this.Increment;
            newvalue = parseFloat(newvalue.toFixed($this.Precision));
            $this._oldvalue = $this.Value;
            $this.Target.triggerHandler("onSpinUp", { newValue: newvalue, oldValue: $this.Value });
            $this.Value = newvalue;
            resetValue($this);
        });

        this.spindownButton.mousedown(function () {
            $(this).css("background-color", "#c9def5");
            $(this).children().addClass("icon-combobox3");
        }).mouseup(function () {
            $(this).css("background-color", "");
            $(this).children().removeClass("icon-combobox3");
            if (dev.IsNull($this.Value)) $this.Value = 0;
            var newvalue = $this.Value - $this.Increment;
            if (!dev.IsNull($this.Min)) newvalue = $this.Value - $this.Increment < $this.Min ? $this.Min : $this.Value - $this.Increment;
            newvalue = parseFloat(newvalue.toFixed($this.Precision));
            $this._oldvalue = $this.Value;
            $this.Target.triggerHandler("onSpinDown", { newValue: newvalue, oldValue: $this.Value });
            $this.Value = newvalue;
            resetValue($this);
        });

        funExt(this);
        this.Target.prop("$this", this);
    }

    function funExt(control) {
        $.fn.extend(control, {
            Layout: function () { layout(control); }
        });
    }
})(jQuery);
//Tree(级联树)
(function ($) {
    function refNodes(t, d, p, index) {
        var d = $(d), is = 0; if (d.length == 0) return;
        if (p != t.rootNodeEL) is = p.prev().children(".indent").length + 1;
        for (var i = 0; i < d.length; i++) {
            if (dev.IsNull(d[i][t.ValueField])) d[i].id = d[i][t.ValueField] = "node" + new Date.getTime();
            var n = $("<div id='" + d[i][t.ValueField] + "' class='node'></div>");
            if (!dev.IsNull(index) && index >= 0) n.insertBefore($("div .node:nth-child(" + i + ")", p));
            else n.appendTo(p);
            var hasChildren = $(d[i][t.ChildrenField]).length > 0;
            if (!dev.IsNull(d[i][t.ChildrenField]) && !dev.IsNull(d[i][t.ChildrenField].length) && d[i][t.ChildrenField].length == 0 && t.IsShowArrowNoChild) hasChildren = true;
            for (var j = 0; j < is; j++) $('<span class="indent"></span>').appendTo(n);//这个可以判断是第几级节点
            var expandclass = d[i][t.StateField] === 'open' && hasChildren ? "expanded" : (!hasChildren ? "" : "collapsed");
            var arrow = $('<span class="arrow ' + expandclass + '"></span>').appendTo(n);
            if (d[i].iconCls) $('<span class="icon-default ' + d[i].iconCls + '"></span>').appendTo(n);
            else if (d[i].icon) {
                dev.InsertIconRule(t.TempStyle, ".nodeIcon" + d[i][t.ValueField], d[i].icon);
                $('<span class="icon-default ' + "nodeIcon" + d[i][t.ValueField] + '"></span>').appendTo(n);
            }
            if (t.CheckBox && (!t.OnlyLeafCheckBox || (!hasChildren && t.OnlyLeafCheckBox)) && !d[i].noCheckbox) {
                var checkType = "checkbox0";
                if (d[i][t.CheckedField] && d[i][t.CheckedField] === null) checkType = "checkbox2";
                else if (d[i][t.CheckedField] && d[i][t.CheckedField] === true) checkType = "checkbox1";
                $('<span class="checkbox-default ' + checkType + '"></span>').appendTo(n).prop("checked", d[i][t.CheckedField]);
            }
            $('<span class="title">' + d[i][t.TextField] + '</span>').appendTo(n);
            n.prop("$this", $.extend({ Target: n[0] }, d[i]));
            if (hasChildren) {
                if (d[i][t.CheckedField]) d[i][t.ChildrenField] = childChecked(d[i][t.ChildrenField], d[i][t.CheckedField], t.CheckedField);
                refNodes(t, d[i][t.ChildrenField], $('<div style="display:' + (d[i][t.StateField] === 'open' ? "" : "none") + ';"></div>').appendTo(p));
                if (!d[i][t.CheckedField] && $("span.checkbox-default", n).length > 0) d[i][t.CheckedField] = refParent(n, t);
            }
            $(".arrow", n).click(function () {//折叠事件
                var nodes = $(this).parent();
                var state = nodes.next().css("display") == "none" ? "open" : "close";
                doFold(t, nodes, state);
            });//折叠展开按钮点击事件
            $(".checkbox-default", n).click(function (s, e) {//选中框点击事件
                if ($(this).hasClass("checkbox0") || $(this).hasClass("checkbox2")) var checked = true;
                else if ($(this).hasClass("checkbox1")) checked = false;
                doCheck(t, $(this).parent(), checked);
            });//复选框勾选
            n.click(function (s, e) {//节点点击事件
                doSelect(t, $(this));
                t.Target.triggerHandler("click", this);
            }).contextmenu(function (s, e) {//节点菜单右键
                doSelect(t, $(this));
                t.Target.triggerHandler("onContextMenu", { node: this, positionX: s.pageX, positionY: s.pageY });
                return false;
            }).dblclick(function (s, e) {
                t.Target.triggerHandler("onDblClick", this);
            });
            if (d[i][t.SelectedField]) doSelect(t, n);
        }
    }
    function childChecked(children, checked, checkField) {
        if (!children || children.length === 0) return children;
        for (var i = 0; i < children.length; i++) { children[i][checkField] = checked; }
        return children;
    }
    function doCheck(t, node, checked) {
        var nodeData = node.prop("$this");
        var checkbox = $("span.checkbox-default", node);
        t.Target.triggerHandler("onChecking", { node: node, checked: nodeData.checkedqa })
        var checkClass = checked ? "checkbox1" : checked === null ? "checkbox2" : "checkbox0";
        checkbox.removeClass("checkbox0").removeClass("checkbox2").removeClass("checkbox1").addClass(checkClass);
        nodeData[t.CheckedField] = checked;
        refChild(node, checked, t);
        if (node.children(".indent").length > 0) refParent(node.parent().prev(), t);
        t.Target.triggerHandler("onChecked", { node: node, checked: checked });
    }//checkbox选择变换方法
    function refParent(p, t) {
        if (!p.hasClass("node") || p.length === 0) return;
        var checked = true;
        var cl = $("span.checkbox-default", p.next()).length;
        var children = $("span.checkbox1", p.next());
        if (children.length === 0) checked = false;
        else if (children.length < cl) checked = null;
        var checkClass = checked === true ? "checkbox1" : (checked === null ? "checkbox2" : "checkbox0");
        $("span.checkbox-default", p).removeClass("checkbox0").removeClass("checkbox2").removeClass("checkbox1").addClass(checkClass);
        p.prop("$this")[t.CheckedField] = checked;
        if (p.children(".indent").length > 0) refParent(p.parent().prev(), t);
    }//帅新父节点
    function refChild(node, checked, t) {
        if (node.next().hasClass("node") || node.next().length === 0 || checked === null) return;
        var children = $("span.checkbox-default", node.next());//刷新子节点
        for (var i = 0; i <= children.length - 1; i++) {
            var child = $(children[i]);
            var nodeData = $(children[i]).parent().prop("$this");
            var checkClass = checked ? "checkbox1" : "checkbox0";
            child.removeClass("checkbox0").removeClass("checkbox2").removeClass("checkbox1").addClass(checkClass);
            nodeData[t.CheckedField] = checked;
        }
    }//刷新子节点
    function doSelect(t, node) {
        if (dev.IsNull(t.SelectedItem) || t.SelectedItem[0] != node[0]) {
            if (t.SelectedItem) { t.SelectedItem.removeClass("node-selected"); t.SelectedItem.prop("$this")[t.SelectedField] = false; }
            node.addClass("node-selected");
            t.SelectedItem = node;
            t.SelectedItem.prop("$this")[t.SelectedField] = true;
        }
        t.Target.triggerHandler("onSelectChanged", t.SelectedItem);
    }//选择节点
    function clearSelect(t) {
        if (!dev.IsNull(t.SelectItem)) {
            t.SelectedItem.removeClass("node-selected"); t.SelectedItem.prop("$this")[t.SelectedField] = false;
            t.SelectedItem = null;
        }
    }
    function doFold(t, node, state) {
        var arrow = $(".arrow", node);
        var nodeData = node.prop("$this");
        var childNode = node.next();
        if (state == nodeData) return;
        if (childNode.hasClass("node") || childNode.length === 0) return;
        if (state == "open") {
            t.Target.triggerHandler("onExpanding", node);
            arrow.removeClass("collapsed").addClass("expanded");
            var h = childNode.css({ display: "", height: "" }).height();
            childNode.css("height", "0px");
            childNode.animate({ height: h }, {
                duration: "fast", queue: true,
                complete: function () {
                    childNode.css("height", "");
                    nodeData[t.StateField] = "open";
                    t.Target.triggerHandler("onExpanded", node);
                }
            });
        } else {
            t.Target.triggerHandler("onCollapsing");
            arrow.removeClass("expanded").addClass("collapsed");
            childNode.animate({ height: 0 }, {
                duration: "fast", queue: true,
                complete: function () {
                    childNode.css("display", "none");
                    nodeData[t.StateField] = "close";
                    t.Target.triggerHandler("onCollapsed", node);
                }
            });
        }
    }//展开折叠方法
    function domToObj(nodes) {
        var ns = [];
        $.each(nodes, function (i, o) { ns.push($(o).attr("$this")); });
        return ns;
    }//将dom转换成对象
    function getLeafs(t, target, checked, hasCheckBox) {
        if (dev.IsNull(target)) target = t.rootNodeEL;//获取所有的叶子节点
        else target = $(target).next();
        if (target.hasClass("node") || target.length == 0) return target;
        var nodes = $(".node", target);
        return nodes.filter(function (i, o) {
            var data = $(o).prop("$this");
            var isright = dev.IsNull(data[t.ChildrenField]) || data[t.ChildrenField].length === 0;
            if (checked == null || checked == true || checked == false) isright = isright && data[t.CheckedField] === checked;
            return isright;
        });
    }//获取所有的叶子节点
    function getLeafsEx(t, target) {
        if (dev.IsNull(target)) target = t.rootNodeEL;//获取所有的叶子节点
        else target = $(target).next();
        if (target.hasClass("node") || target.length == 0) return target;
        var nodes = $(".node", target);
        return nodes.filter(function (i, o) {
            var data = $(o).prop("$this");
            var isright = dev.IsNull(data[t.ChildrenField]) || data[t.ChildrenField].length === 0;
            return isright;
        });
    }
    function getCheked(t, target, checked) {
        if (dev.IsNull(target)) target = t.rootNodeEL;//获取所有的叶子节点
        else target = $(target).next();
        var selector = checked ? ".checkbox1" : checked == null ? ".checkbox2" : ".checkbox0";
        if (target.hasClass("node") || target.length == 0) return;
        var nodes = $(".node", target);
        return nodes.filter(function (i, o) {
            return $(o).prop("$this")[t.CheckedField] === checked;
        });
    }//获取所有的选中的
    function fold(t, target, isAll, state) {
        var nodes = target;
        if (dev.IsNull(target)) nodes = t.GetRoots();
        flodNode(t, nodes, isAll, state);
    }//折叠展开节点
    function flodNode(t, nodes, isAll, state) {
        $.each($(nodes), function (i, o) {
            var data = $(o).prop("$this");
            if (data[t.StateField] != state && !dev.IsNull(data[t.ChildrenField]) && data[t.ChildrenField].length > 0) doFold(t, $(o), state);
            if (isAll && data[t.ChildrenField] && data[t.ChildrenField].length > 0) {
                var child = $(o).next();
                flodNode(t, $(".node", child), isAll, state);
            }
        });
    }
    function addNode(t, nodes, target) {
        if (dev.IsNull(nodes) || nodes.length == 0 || dev.IsNull(target)) return;
        var c = $(target).next();
        if ($(target).hasClass("node") && (c.hasClass("node") || c.length == 0)) $('<div style="display:block"></div>').insertAfter($(target));
        refNodes(t, nodes, $(target).next());
        $(".arrow", $(target)).addClass("expanded");
    }
    function getText(t, target) {
        if (dev.IsNull(t.Data) || t.Data.length === 0) return;
        var checkedNodes = null, str = [];
        if (t.DisplayPText === false) {
            checkedNodes = getLeafs(t, target, true);
            str = Enumerable.From(checkedNodes).Select('s=>s.$this["' + t.TextField + '"]').ToArray();
        }
        else getChildText(t, target, str);
        return str.toString();
    }
    function getChildText(t, target, str) {
        if (dev.IsNull(str)) str = "";
        if (dev.IsNull(target)) nodes = t.rootNodeEL.children(".node");//获取所有的叶子节点
        else nodes = $(target).next().children(".node");
        nodes.filter(function (i, o) {
            var $this = $(o).prop("$this");
            var isChecked = $this[t.CheckedField] || $this[t.CheckedField] === null;
            if (isChecked) str.push($this[t.TextField]);
            if (!dev.IsNull($this[t.ChildrenField]) && $this[t.ChildrenField].length > 0) getChildText(t, o, str);
            return isChecked;
        });
    }
    dev.Tree = function (opt) {
        if (dev.IsNull(opt)) opt = {}; var t = this;
        if (dev.IsNull(opt.Target)) opt.Target = $("<div class='dev-tree'></div>");
        else {
            if (dev.IsNull(opt.ID)) opt.ID = opt.Target.attr("id");
            if (opt.Target.hasClass("dev-tree")) opt.Target.addClass("dev-tree");
        }
        $.extend(this, new dev.Control(opt));
        this.rootNodeEL = $("<div style='width:100%;'></div>").appendTo(this.Target);
        this.TempStyle = dev.CreateTempStyle();
        this.DisplayPText = dev.IsNull(opt.DisplayPText) ? true : opt.DisplayPText;
        this.CheckBox = dev.IsNull(opt.CheckBox) ? false : opt.CheckBox;
        this.OnlyLeafCheckBox = dev.IsNull(opt.OnlyLeafCheckBox) ? false : opt.OnlyLeafCheckBox;
        this.CascadeCheck = dev.IsNull(opt.CascadeCheck) ? true : opt.CascadeCheck;
        this.ValueField = dev.IsNull(opt.ValueField) ? "id" : opt.ValueField;
        this.TextField = dev.IsNull(opt.TextField) ? "text" : opt.TextField;
        this.ChildrenField = dev.IsNull(opt.ChildrenField) ? "children" : opt.ChildrenField;
        this.CheckedField = dev.IsNull(opt.CheckedField) ? "checked" : opt.CheckedField;
        this.SelectedField = dev.IsNull(opt.SelectedField) ? "selected" : opt.SelectedField;
        this.StateField = dev.IsNull(opt.StateField) ? "state" : opt.StateField;
        this.TagField = dev.IsNull(opt.TagField) ? "tag" : opt.TagField;
        this.IsShowArrowNoChild = dev.IsBoolean(opt.IsShowArrowNoChild) ? opt.IsShowArrowNoChild : (opt.IsShowArrowNoChild == "true");
        if (this.OnlyLeafCheckBox) this.CheckBox = true;
        if (!dev.IsNull(opt.CSS)) this.Target.css(opt.CSS);
        this.Data = dev.IsNull(opt.Data) ? [] : opt.Data;
        funExt(this);
        var $this = this;
        if (!isNaN(this.Width)) this.SetWidth(opt.Width);
        if (!isNaN(this.Height)) this.SetHeight(opt.Height);
        this.LoadData(this.Data);
        this.Target.prop("$this", this);
    }
    function funExt(control) {
        $.fn.extend(control, {
            LoadData: function (data) {
                //this.Target.html();
                this.rootNodeEL.empty();
                this.Data = data;
                refNodes(this, data, this.rootNodeEL);
            },//加载数据
            GetText: function (target, isLeaf) {
                if (this.CheckBox === false) return this.SelectedItem ? this.SelectedItem.prop("$this")[this.TextField] : "";
                else return getText(this, target);
            },
            GetNode: function (target) {
                if (dev.IsNull(target) || !$(target).hasClass("node")) return;
                return $(target).prop("$this");
            },//通过DOM获取当前节点
            GetData: function (target) {
                if (dev.IsNull(target) || !$(target).hasClass("node")) return;
                return dev.ObjCloneExceptAttr($(target).prop("$this"), ["Target"]);
            },//通过DOM获取该节点上的数据
            GetChildren: function (target) {
                if (dev.IsNull(target) || !$(target).hasClass("node")) return;
                if ($(target).next().hasClass("node") || $(target).next().length === 0) return;
                return $(target).next().children(".node");
            },//通过DOM获取该节点的所有子节点
            GetAllChildren: function (target) {
                if (dev.IsNull(target) || !$(target).hasClass("node")) return;
                if ($(target).next().hasClass("node") || $(target).next().length === 0) return;
                return $(".node", $(target).next());
            },//通过DOM获取该节点下所有子孙节点
            GetParent: function (target) {
                if (dev.IsNull(target) || !$(target).hasClass("node")) return;
                return $(target).parent().prev();
            },//通过DOM获取父容器
            GetRoot: function (target) {
                if (dev.IsNull(target) || !$(target).hasClass("node")) return;
                return this.rootNodeEL.children(".node").filter(function (i, o) {
                    return !$(o).next().hasClass("node") && $(o).next().length === 0 && $(o).next().has($(target)).length > 0;
                });
            },//通过DOM获取根节点
            GetRoots: function () {
                return this.rootNodeEL.children(".node");
            },//获取所有根节点
            GetLeafs: function (target, checked) {
                if (dev.IsNull(checked)) return getLeafsEx(this, target);
                return getLeafs(this, target, checked);
            },//通过DOM或者选中状态获取叶子节点
            GetChecked: function (checked, target) {
                return getCheked(this, target, checked);
            },//根据选中状态获取节点
            GetSelectNode: function () {
                return this.SelectedItem;
            },//获取选择项
            SetSelectNode: function (target) {
                if (!dev.IsNull(target)) doSelect(this, $(target));
                else clearSelect(this);
            },//设置选择项
            Check: function (target, checked) {
                if (checked === "" || checked === undefined) return;
                var $this = this;
                if (dev.IsNull(target)) target = this.GetRoots();
                $.each($(target), function (i, o) { doCheck($this, $(o), checked); });
            },//设置当前节点的            
            Expand: function (target, isAll) {
                fold(this, target, isAll, "open");
            },//展开节点
            Collapse: function (target, isAll) {
                fold(this, target, isAll, "close");
            },//折叠节点
            Add: function (nodes, target) {
                addNode(this, nodes, target);
            },
            Insert: function (nodes, target, index) {
                if (dev.IsNull(nodes)) return;
                if (dev.IsNull(target)) target = this.rootNodeEL;
                addNode(this, nodes, target);
            },
            IsLeaf: function (target) {
                var nextNode = $(target).next();
                var isnode = !nextNode.hasClass("node");
                return !(!nextNode.hasClass("node") && ((!dev.IsNull(target.$this) && (!dev.IsNull(target.$this[this.ChildrenField]) && !dev.IsNull(target.$this[this.ChildrenField].length) && target.$this[this.ChildrenField].length > 0)) || (!dev.IsNull(target.$this) && (!dev.IsNull(target.$this[this.ChildrenField])) && dev.IsNull(target.$this[this.ChildrenField].length))));
                //return !(!nextNode.hasClass("node") && (!dev.IsNull(target.$this) && target.$this.children.length > 0));
            },
            SetCSS: function (css) {
                if (!dev.IsNull(css)) this.Target.css(css);
            },
            outerWidth: function () {
                return this.Target.outerWidth();
            },
            outerHeight: function () {
                return this.Target.outerHeight();
            },
            SetWidth: function (width) {
                if (dev.IsNull(width)) return;
                this.Target.css('width', width);
                this.Width = this.Target.width();
                this.Target.trigger("onResize");//大小变化事件
            },
            SetHeight: function (height) {
                if (dev.IsNull(height)) return;
                this.Target.css('height', height);
                this.Height = this.Target.height();
                this.Target.trigger("onResize");//大小变化事件
            },
            Clear: function () {
                this.rootNodeEL.empty();
            }
        });
    }
})(jQuery);
//Combotree(下拉树选择框)
(function ($) {
    function getnodebyValue(value, $this) {
        var selectnode;
        var root_nodes = $this.tree.GetRoots();
        if (dev.IsNull(root_nodes) || root_nodes.length == 0) return;
        for (var i = 0; i < root_nodes.length; i++) {
            var node_data = $this.tree.GetData(root_nodes[i]);
            if (node_data[$this.tree.ValueField] == value) { selectnode = root_nodes[i]; break; }
            selectnode = getnode(value, root_nodes[i], $this);
        }
        return selectnode;
    }
    function getnode(value, node, $this) {
        var selectnode;
        if (dev.IsNull(value) || dev.IsNull(node)) return selectnode;
        var node_children = $this.tree.GetChildren(node);
        if (dev.IsNull(node_children) || node_children.length == 0) return selectnode;
        for (var i = 0; i < node_children.length; i++) {
            var node_data = $this.tree.GetData(node_children[i]);
            if (node_data[$this.tree.ValueField] == value) { selectnode = node_children[i]; break; }
            selectnode = getnode(value, node_children[i], $this);
            if (!dev.IsNull(selectnode)) break;
        }
        return selectnode;
    }
    dev.Combotree = function (opt) {
        if (dev.IsNull(opt)) opt = {}; var $this = this;
        opt.Readonly = true; opt.ShowClearButton = false;
        if (dev.IsNull(opt.Target)) {
            opt.Target = $("<div class='dev-combotree'></div>");
            opt.Target.appendTo(dev.IsDOMElementEx(opt.Parent) ? opt.Parent : document.body);
        }
        else if (!opt.Target.hasClass("dev-combotree")) opt.Target.addClass("dev-combotree");
        $.extend(this, this.combo = new dev.Combo(opt)), funExt(this), this.Target.prop("$this", $this);
        this.Disabled = dev.IsBoolean(opt.Disabled) ? opt.Disabled : opt.Disabled == "true";
        if (dev.IsNull(opt.treeOpt)) opt.treeOpt = {}; opt.treeOpt.CheckBox = opt.MultiSelect;
        this.ChildHide = dev.IsBoolean(opt.ChildHide) ? opt.ChildHide : true;
        opt.treeOpt.Height = opt.PopupHeight;
        if (!dev.IsNull(opt.ValueField)) opt.treeOpt.ValueField = opt.ValueField;
        if (!dev.IsNull(opt.TextField)) opt.treeOpt.TextField = opt.TextField;
        if (!dev.IsNull(opt.ChildrenField)) opt.treeOpt.ChildrenField = opt.ChildrenField;
        if (!dev.IsNull(opt.StateField)) opt.treeOpt.StateField = opt.StateField;
        if (!dev.IsNull(opt.CheckedField)) opt.treeOpt.CheckedField = opt.CheckedField;

        this.tree = new dev.Tree(opt.treeOpt); this.popup.append(this.tree.Target);
        this.tree.bind("onSelectChanged", function (s, e) {
            $this.text.SetValue($this.tree.GetText());
            if ($this.ChildHide) {
                var isleaf = $this.tree.IsLeaf(e);
                if (isleaf) $this.HidePopup();
            }
            else $this.HidePopup();
            $this.Target.triggerHandler("onSelectChanged", $this.tree.SelectedItem);
        });
        this.text.SetValue(this.tree.GetText());
        this.readonlyEl = $("<div style='display:none; top:0px;left:0px;z-index:1;width:" + this.combo.Width + "px;height:" + this.combo.Height + "px;position:absolute;background-color:rgba(221,221,221,0.2)'></div>").appendTo(this.Target);
        if (this.Disabled) this.readonlyEl.css("display", "block");
        this.Layout();
    }
    function funExt(control) {
        $.fn.extend(control, {
            SetData: function (data) {
                this.tree.LoadData(data); this.RefreshRequire();
                this.text.SetValue(this.tree.GetText());
                this.Target.triggerHandler("onSelectChanged", this.tree.SelectedItem);
            },
            SetSelectedItem: function (target, checked) {
                if (!dev.IsNull(target)) target = target.$this.Target;
                if (this.tree.CheckBox) this.tree.Check(target, checked);
                else this.tree.SetSelectNode(target);
                this.text.SetValue(this.tree.GetText());
                this.Target.triggerHandler("onSelectChanged", this.tree.SelectedItem);
            },
            GetData: function () { return this.tree.Data; },
            GetValue: function () {
                var selectnode = this.GetSelectedItem();
                if (dev.IsNull(selectnode) || selectnode.length == 0) return null;
                var nodedata = selectnode[0].$this;
                return nodedata[this.tree.ValueField];
            },
            SetValueEx: function (value) {
                if (dev.IsNull(value)) return;
                var selectnode = getnodebyValue(value, this);
                if (dev.IsNull(selectnode)) return;
                this.tree.SetSelectNode(selectnode);
            },
            ShowPopup: function () { this.combo.ShowPopup(), this.tree.Layout(); },
            HidePopup: function () { this.combo.HidePopup(); },
            GetSelectedItem: function (isLeaf) {
                if (this.tree.CheckBox) {
                    if (isLeaf) return this.tree.GetLeafs("", true);
                    return this.tree.GetChecked(true);
                }
                else return this.tree.SelectedItem;
            },
            Clear: function () {
                this.tree.Clear(); this.text.Clear();
            },
            SetWidth: function (width) { this.text.SetWidth(width); this.Layout(); },
            SetHeight: function (height) { this.text.SetHeight(height); this.Layout(); },
            SetSize: function (size) { this.text.SetSize(size); this.Layout(); },
            SetPopueHeight: function (height) { this.tree.SetHeight(height); },
            Layout: function () {
                this.combo.Layout();
            },
            SetDisabled: function (disabled) {
                this.Disable = disabled;
                if (this.Disable) this.readonlyEl.css("display", "block");
                else this.readonlyEl.css("display", "none");
            }
        });
    }
})(jQuery);
//Pager(分页控件)
(function ($) {
    function getPageNum(total, pagesize) {
        if (dev.IsNull(total) || dev.IsNull(pagesize) || pagesize == 0) return;
        var temp = total % pagesize;
        return temp == 0 ? (total / pagesize) : (((total - temp) / pagesize) + 1);
    }
    function pageBtnState($this) {
        $this.enableElFirst.css("display", ($this.PageIndex > 1 ? "none" : "block"));
        $this.enableElPre.css("display", ($this.PageIndex > 1 ? "none" : "block"));
        $this.enableElNext.css("display", ($this.PageIndex < $this.PageNum ? "none" : "block"));
        $this.enableElLast.css("display", ($this.PageIndex < $this.PageNum ? "none" : "block"));
        //显示数据
        var endlength = ($this.PageIndex * $this.PageSize) > $this.RecordNum ? $this.RecordNum : ($this.PageSize * $this.PageIndex);
        if (dev.IsNull($this.DisPlayMsg)) $this.PageMsg = "显示" + (($this.PageIndex - 1) * $this.PageSize + 1) + "到" + endlength + "条记录,共有" + $this.RecordNum + "条记录";
        $this.RightContent.html(dev.IsNull($this.DisPlayMsg) ? $this.PageMsg : $this.DisPlayMsg);
    }
    function pageclick($this, state) {
        if (state == "first") $this.PageIndex = 1;
        if (state == "previous") {
            if ($this.PageIndex <= 1) return;
            $this.PageIndex -= 1;
        }
        if (state == "next") {
            if ($this.PageIndex == $this.PageNum) return;
            $this.PageIndex += 1;
        }
        if (state == "last") $this.PageIndex = $this.PageNum;
        $this.PageIndexBox.val($this.PageIndex);
        pageBtnState($this);
        $this.Target.triggerHandler("onSelectPage", { pageNumber: $this.PageIndex, pageSize: $this.PageSize });
    }
    dev.Pager = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        this.IsSearcher = dev.IsBoolean(opt.IsSearcher) ? opt.IsSearcher : opt.IsSearcher == "true";
        this.PageSize = dev.IsNumber(opt.PageSize) ? opt.PageSize : 10;
        this.PageIndex = dev.IsNumber(opt.PageIndex) ? opt.PageIndex : 1;
        this.RecordNum = dev.IsNumber(opt.RecordNum) ? opt.RecordNum : 0;
        this.PageNum = dev.IsNumber(opt.PageNum) ? opt.PageNum : getPageNum(this.RecordNum, this.PageSize);
        this.DisplayMsg = opt.DisplayMsg;
        this.PageMsg = "显示" + ((this.PageIndex - 1) * this.PageSize + 1) + "到" + (this.PageIndex * this.PageSize) + "条记录,共有" + this.RecordNum + "条记录";
        this.ContentEx = opt.ContentEx;
        opt.Target = $('<div class="Pagination"></div>');
        $.extend(this, new dev.Control(opt));
        var $this = this;
        this.LeftContent = $('<div class="Left"></div>').appendTo(this.Target);
        this.RightContent = $('<div class="Right">' + (dev.IsNull(this.DisPlayMsg) ? this.PageMsg : this.DisPlayMsg) + '</div>');
        this.RightContent.appendTo(this.Target);
        this.FirstIndexBtn = $('<div class="Btns" style="left:5px;background-position: 0px,0px;"></div>').appendTo(this.LeftContent);
        this.enableElFirst = $('<div class="enable" style="left:5px;display:block"></div>').appendTo(this.LeftContent);
        this.Previousbtn = $('<div class="Btns" style="left:26px;background-position:-16px,0px;"></div>').appendTo(this.LeftContent);
        this.enableElPre = $('<div class="enable" style="left:26px;"></div>').appendTo(this.LeftContent);
        var split1 = $('<div class="Split" style="left:47px;"></div>').appendTo(this.LeftContent);
        this.PageTextDiv = $('<div class="PageText" style="left:53px;"><span style="position:absolute;left:0px;">第</span></div>').appendTo(this.LeftContent);
        this.PageIndexBox = $('<input style="position:absolute;left:15px;height:22px;width:35px;top:3px;text-align:center" type="text"/>').appendTo(this.PageTextDiv);
        this.PageNumber = $('<span style="position:absolute;left:55px;">共' + this.PageNum + '页</span>').appendTo(this.PageTextDiv);
        var split2 = $('<div class="Split" style="left:152px;"></div>').appendTo(this.LeftContent);
        this.NextBtn = $('<div class="Btns" style="left:158px;background-position:-32px,0px;"></div>').appendTo(this.LeftContent);
        this.enableElNext = $('<div class="enable" style="left:158px;"></div>').appendTo(this.LeftContent);
        this.LastBtn = $('<div class="Btns" style="left:179px;background-position:-48px,0px;"></div>').appendTo(this.LeftContent);
        this.enableElLast = $('<div class="enable" style="left:179px;"></div>').appendTo(this.LeftContent);
        if (this.IsSearcher) {
            var split3 = $('<div class="Split" style="left:200px;"></div>').appendTo(this.LeftContent);
            var searcherDiv = $('<div class="Searcher" style="left:206px;top:3px;"></div>').appendTo(this.LeftContent);
            this.SearcherBox = $('<input type="search" class="Box" placeholder="关键查询信息"/>').appendTo(searcherDiv);
            this.Searchbtn = $('<div class="Button"></div>').appendTo(searcherDiv);
            this.Searchbtn.click(function () {
                var searchvalue = this.SearcherBox.val();
                $this.Target.triggerHandler("onSearchChange", { searchValue: searchvalue });
            });
        }
        this.ContenExDiv = $('<div style="position:absolute;height:100%;left:200px;"></div>').appendTo(this.LeftContent);
        if (this.IsSearcher) this.ContenExDiv.css("left", "375px");
        if (!dev.IsNull(this.ContentEx)) this.ContenExDiv.append(this.ContentEx);
        pageBtnState(this);
        this.FirstIndexBtn.click(function () { pageclick($this, "first"); });
        this.Previousbtn.click(function () { pageclick($this, "previous"); });
        this.NextBtn.click(function () { pageclick($this, "next"); });
        this.LastBtn.click(function () { pageclick($this, "last"); });
        this.PageIndexBox.val(this.PageIndex);
        this.PageIndexBox.bind('input propertychange', function () {
            var pageindex = $(this).val();
            if (dev.IsNull(pageindex)) return;
            var reg = /^[0-9]*[1-9][0-9]*$/;
            if (!reg.test(pageindex)) { $(this).val($this.PageIndex); return; }
            var index = parseInt(pageindex);
            if (index > $this.PageNum) {
                $this.PageIndex = $this.PageNum;
                $(this).val($this.PageIndex);
                return;
            }
            $this.PageIndex = index;
        }).bind("keydown", function (event) {
            if (event.keyCode == "13")
                $this.Target.triggerHandler("onSelectPage", { pageNumber: $this.PageIndex, pageSize: $this.PageSize });
        });
        funExt(this);
        this.Target.prop("$this", this);
    }
    function funExt(control) {
        $.fn.extend(control, {
            SetDisplayMsg: function (displayMsg) {
                this.DisPlayMsg = displayMsg;
                this.RightContent.html(displayMsg);
            },
            Refresh: function (opt) {
                this.RecordNum = opt.RecordNum;
                if (!dev.IsNull(opt.PageSize)) this.PageSize = opt.PageSize;
                if (!dev.IsNull(opt.PageIndex)) this.PageIndex = opt.PageIndex;
                this.PageNum = dev.IsNull(opt.PageNum) ? getPageNum(this.RecordNum, this.PageSize) : opt.PageNum;
                this.DisPlayMsg = opt.DisPlayMsg;
                if (dev.IsNull(this.DisPlayMsg)) this.PageMsg = "显示" + ((this.PageIndex - 1) * this.PageSize + 1) + "到" + (this.PageIndex * this.PageSize) + "条记录,共有" + this.RecordNum + "条记录";
                this.SetDisplayMsg(dev.IsNull(this.DisPlayMsg) ? this.PageMsg : this.DisPlayMsg);
                this.PageNumber.html("共" + this.PageNum + "页");
                pageBtnState(this);
                this.Target.triggerHandler("onRefreshed", { pageNumber: this.PageIndex, pageSize: this.PageSize });
            },
            Select: function (pageindex) {
                this.PageIndex = pageindex;
                this.PageIndexBox.val(this.PageIndex);
                pageBtnState($this);
            },
            AddContentEx: function (element) {
                this.ContenExDiv.append(element);
            },
            SetIsSearcher: function (issearch) {
                this.IsSearcher = issearch;
                $('.Searcher', this.LeftContent).css("display", this.IsSearcher ? "block" : "none");
                this.ContenExDiv.css("left", this.IsSearcher ? "375px" : "200px");
            },
            SetPageIndex: function (index) {
                this.PageIndex = index;
                $this.PageIndexBox.val(this.PageIndex);
                pageBtnState(this);
            }
        });
    }
})(jQuery);
//DataGrid(表格控件)
(function ($) {
    function initColumns(dg) {
        var headerTR = $("tr", dg.Header); headerTR.height(dg.HeaderHeight);
        for (var i = 0; i < dg.Columns.length; i++) {
            var td = "<td class='cell' field='" + dg.Columns[i].field + "' index='"
                + i + "'><div class='div' style='height:16px;border-bottom-width:0px;";
            if (i == (dg.Columns.length - 1) && dg.ColumnFilled) td += "border-right-width:0px;";
            td += "'>" + dg.Columns[i].title + "</div></td>";
            $(td).appendTo(headerTR);
        }
        if (!dg.ColumnFilled) headerTR.append("<td></td>");
        dg.Header.append("<div class='scroll' style='display:none'></div>");
    }
    function getColumnWidth(dg, vs) {
        var cs = [], len = dg.Columns.length, w = dg.GetActualWidth() - len + 1;
        if (!dev.IsNull(vs) && vs == true) w = w - 9;
        for (var i = 0; i < len; i++) {
            var _w = dg.Columns[i].width, col = { field: dg.Columns[i].field };
            if (dev.IsNull(_w)) col.width = parseInt(w / len);
            else {
                if (dev.IsNumber(_w)) col.width = parseInt(_w);
                else {
                    var p = _w.substring(_w.length - 1) == "%";
                    col.width = p ? parseInt(w * parseInt(_w) / 100) : parseInt(_w);
                }
            }
            cs.push(col);
        }
        var sum = dev.Sum(cs, "width"), t = (w - sum) % len, avg = parseInt((w - sum) / len);
        for (var i = 0; i < cs.length; i++) {
            if (t == 0) cs[i].width += avg;
            else { cs[i].width += (avg + 1); t--; }
        }
        return cs;
    }
    dev.DataGrid = function (opt) {
        if (dev.IsNull(opt)) opt = {}; var t = this;
        opt.Target = $("<div class='dev-datagrid'></div>");
        $.extend(this, new dev.Control(opt));
        this.Data = dev.IsNull(opt.Data) ? [] : opt.Data;
        this.Columns = dev.IsNull(opt.Columns) ? [] : opt.Columns;
        this.ColumnFilled = dev.IsBoolean(opt.ColumnFilled) ? opt.ColumnFilled : (opt.ColumnFilled != "false");
        this.FrozenColumns = dev.IsBoolean(opt.FrozenColumns) ? opt.FrozenColumns : (opt.FrozenColumns != "false");
        this.HeaderHeight = dev.IsNull(opt.HeaderHeight) ? 26 : opt.HeaderHeight;
        this.Header = $("<div class='header'><table><tr></tr></table></div>").appendTo(this.Target);
        funExt(this); initColumns(this);
        this.Body = $("<div class='body'></div>").appendTo(this.Target);
        this.Table = new dev.Box({
            Width: "100%", Height: "100%", HasBorder: false,
            HorScroll: this.ColumnFilled ? "hidden" : "auto"
        });
        this.DataBind(this.Data, true);
        this.Body.append(this.Table.Target);
        this.Footer = $("<div class='footer'></div>").appendTo(this.Target);
        this.Target.prop("$this", this);
    }
    function funExt(control) {
        $.fn.extend(control, {
            Layout: function () {
                var tds = $("td", $("tr:first", this.Table.el));
                $(".scroll", this.Header).css("display", "none");
                var cs = getColumnWidth(this);
                for (var i = 0; i < cs.length; i++) {
                    var col = $("td[field='" + cs[i].field + "']", this.Header);
                    var index = parseInt(col.attr("index"));
                    $(tds[index]).width(cs[i].width);
                    col.width(cs[i].width);
                }
                $("table", this.Header).width(this.GetActualWidth() - 2);
                this.Table.el.width(this.GetActualWidth() - 2);
                this.Table.Layout();
                if (this.Table.VerScrollVisibility) {
                    $(".scroll", this.Header).css("display", "block");
                    cs = getColumnWidth(this, true);
                    for (var i = 0; i < cs.length; i++) {
                        var col = $("td[field='" + cs[i].field + "']", this.Header);
                        var index = parseInt(col.attr("index"));
                        $(tds[index]).width(cs[i].width);
                        col.width(cs[i].width);
                    }
                    $("table", this.Header).width(this.GetActualWidth() - 11);
                    this.Table.el.width(this.GetActualWidth() - 11);
                    this.Table.Layout();
                }
            },
            DataBind: function (data, inited) {
                if (dev.IsNull(data) || data.length == 0) {
                    this.Table.SetContent(null);
                    this.Data = []; return;
                }
                this.Data = data;
                if (!dev.IsNull(inited) && inited) {
                    var str = "<table class='table'>";
                    for (var i = 0; i < this.Data.length; i++) {
                        str += "<tr class='row' index='" + i + "'>";
                        for (var j = 0; j < this.Columns.length; j++) {
                            var s = (j == this.Columns.length - 1) ? "last-cell" : "";
                            if (i == this.Data.length - 1) s = s == "" ? "last-row" : "last-cell last-row";
                            str += "<td class='cell'>" + "<div class='div " + s + "'>" +
                                this.Data[i][this.Columns[j].field] + "</div>" + "</td>";
                        }
                        str += "</tr>";
                    }
                    str += "</table>";
                    this.Table.SetContent($(str));
                }
            }
        });
    }
})(jQuery);
/*通用方法的封装*/
(function ($) {
    //动态创建Iframe
    dev.CreateFrame = function (url, isScroll, id) {
        if (dev.IsNull(id)) id = "frame" + new Date().getTime();
        return dev.CreateFrameBase(url, isScroll, id, "width:100%;height:100%;");
    };
    //动态创建frame
    dev.CreateFrameBase = function (url, isScroll, id, style) {
        if (dev.IsNull(id)) id = "frame" + new Date().getTime();
        return $('<iframe id="' + id + '" scrolling="' + (dev.IsBoolean(isScroll) && isScroll === true ? "yes" : "no") + '" frameborder="0" src="' + url + '" style="' + style + '"></iframe>');
    };
    //插件通讯传输函数
    dev.CallWidgetCommunication = function (frame, parent, param) {
        if (dev.IsNull(frame) || dev.IsNull(frame.contentWindow)) return;
        try {
            if (frame.contentWindow.WidgetCommunication)
                frame.contentWindow.WidgetCommunication({ parent: parent, param: param });
        } catch (e) {
            console.log("页面加载出错:" + e);
        }
    };
    //动态创建Style
    dev.CreateTempStyle = function () {
        var style = $('<style type="text/css"></style>').appendTo(document.head);
        return style[0].sheet || style[0].styleSheet;
    };
    //获取元素padding
    dev.GetPadding = function (el) {
        if (el) el = el[0] || el;
        var pt = dev.IsNull(el.style.paddingTop) ? 0 : parseInt(el.style.paddingTop),
            pr = dev.IsNull(el.style.paddingRight) ? 0 : parseInt(el.style.paddingRight),
            pb = dev.IsNull(el.style.paddingBottom) ? 0 : parseInt(el.style.paddingBottom),
            pl = dev.IsNull(el.style.paddingLeft) ? 0 : parseInt(el.style.paddingLeft);
        return { t: pt, r: pr, b: pb, l: pl, w: pl + pr, h: pt + pb };
    };
    //获取元素border
    dev.GetBorder = function (el) {
        if (el) el = el[0] || el;
        var bt = dev.IsNull(el.style.borderTopWidth) ? 0 : parseInt(el.style.borderTopWidth),
            br = dev.IsNull(el.style.borderRightWidth) ? 0 : parseInt(el.style.borderRightWidth),
            bb = dev.IsNull(el.style.borderBottomWidth) ? 0 : parseInt(el.style.borderBottomWidth),
            bl = dev.IsNull(el.style.borderLeftWidth) ? 0 : parseInt(el.style.borderLeftWidth);
        return { t: bt, r: br, b: bb, l: bl, w: bl + br, h: bt + bb };
    };
    //动态创建Icon样式
    dev.InsertIconRule = function (sheet, selectorName, imgsrc) {
        if (dev.IsNull(imgsrc) || dev.IsNull(sheet) || dev.IsNull(selectorName)) return;
        if (sheet.insertRule) {
            sheet.insertRule(selectorName + '{top:2px;background:url(' + imgsrc + ') no-repeat center center; background-size:16px 16px;}', 0);
        } else if (sheet.addRule) {
            sheet.addRule(selectorName, 'top:2px;background:url(' + imgsrc + ') no-repeat center center; background-size:16px 16px');
        }
        return selectorName.substring(1, selectorName.length);
    };
    //动态创建Css样式
    dev.InsertRule = function (sheet, selectorName, cssText) {
        if (dev.IsNull(cssText) || dev.IsNull(sheet) || dev.IsNull(selectorName)) return;
        if (sheet.insertRule) {
            sheet.insertRule(selectorName + "{" + cssText + "}", 0);
        } else if (sheet.addRule) {
            sheet.addRule(selectorName, cssText);
        }
        return selectorName.substring(1, selectorName.length);
    };
    //获取元素的位置
    dev.Position = function (domObject, position) {
        if ($(domObject).css(position) && $(domObject).css(position) != "auto")
            return parseFloat($(domObject).css(position).replace("px", ""));
    };
    /** 功能：过滤子系统标题文字部分,如果是五个字以上就显示四个字*/
    dev.FilterTitle = function (text) {
        var arrTitle = text.split("");
        if (arrTitle.length <= 0) return "子系统标题";
        else if (arrTitle.length <= 5) return text;
        else return arrTitle[0] + arrTitle[1] + arrTitle[2] + arrTitle[3] + "..";
    };
    /*功能：根据插件信息动态创建按钮*/
    dev.CreateImgStyle = function (cssText) {
        if (imagestyle == null) imagestyle = $('<style type="text/css"></style>');
        imagestyle.text(cssText);
        imagestyle.appendTo($("head"));
    };
    /*功能：验证空值*/
    dev.IsNull = function (item) {
        return item === undefined || item === null || item === "";
    };
    dev.IsNullAll = function (item) {
        return item === undefined || item === null || item === "" || item == 'undefined' || item == 'null';
    }
    /*功能：去掉首尾空白符*/
    dev.Trim = function (item) {
        if (dev.IsNull(item)) return item;
        else return item.replace(/(^\s*)|(\s*$)/g, "");
    };
    /*功能：验证字符串*/
    dev.IsString = function (item) {
        return !dev.IsNull(item) && typeof item === "string";
    };
    dev.IsInt = function (str) {
        var reg = /^(-|\+)?\d+$/;
        return reg.test(str);
    };
    /*功能：验证数字类型*/
    dev.IsNumber = function (item) {
        return !dev.IsNull(item) &&
           typeof item === "number"
            && !isNaN(item) && isFinite(item);
    };
    /*功能：验证布尔类型*/
    dev.IsBoolean = function (item) {
        return !dev.IsNull(item) && typeof item === "boolean";
    };
    /*功能：是否是对象类型*/
    dev.IsObject = function (item) {
        return !dev.IsNull(item) && typeof item == "object";
    };
    /*功能：是否是数组类型*/
    dev.IsArray = function (obj) {
        return obj && typeof obj === 'object' && typeof obj.length === 'number' && typeof obj.splice === 'function' && !(obj.propertyIsEnumerable('length'));
    }
    /*功能：是否是基本数据类型（非对象）*/
    dev.IsBaseType = function (obj) {
        return (typeof obj == "string" || typeof obj == "boolean" || typeof obj == "number");
    }
    /*功能：是否是DOM元素*/
    dev.IsDOMElement = function (item) {
        return !!(item && item.nodeType);
    };
    /*功能：是否是DOM元素*/
    dev.IsDOMElementEx = function (item) {
        if (dev.IsNull(item)) return false;
        else if (item.nodeType) return true;
        return !!item.jquery && !!item[0] && !!item[0].nodeType;
    };
    /*功能：是否是jQuery对象*/
    dev.IsjQueryObject = function (item) {
        return !dev.IsNull(item) && typeof item == "object" && !!item.jquery;
    };
    /*功能：获取窗体展示的位置*/
    dev.GetPosition = function (position, size, parentPos) {
        var winWidth = $(window).width();
        var winHeight = $(window).height();
        var left = dev.IsNull(parentPos) ? 0 : parentPos.Left;
        var top = dev.IsNull(parentPos) ? 0 : parentPos.Top;
        switch (position.X.toString().toUpperCase()) {
            case dev.PositionEnum.Left: left = left + 0; break;
            case dev.PositionEnum.Right: left = winWidth - size.Width; break;
            case dev.PositionEnum.Center: left = (winWidth - size.Width + left) / 2; break;
            default:
                if (size.Width = winWidth) left = 0;
                else {
                    left = left + parseFloat(position.X);
                    if (left > winWidth) {
                        left = left - parseFloat(position.X);
                        if ((left + size.Width) > winWidth || size.Width > winWidth) left = 0;
                    }
                }
                break;
        }
        switch (position.Y.toString().toUpperCase()) {
            case dev.PositionEnum.Top: top = top + 0; break;
            case dev.PositionEnum.Bottom: top = winHeight - size.Height; break;
            case dev.PositionEnum.Center: top = (winHeight - size.Height + top) / 2; break;
            default:
                if (size.Width = winWidth) top = 0;
                else {
                    top = top + parseFloat(position.Y);
                    if (top > winHeight) {
                        top = top - parseFloat(position.Y);
                        if ((top + size.Height) > winHeight || size.Height > winHeight) top = 0;
                    }
                }
                break;
        }
        return { X: left, Y: top };
    };
    /*功能：获取窗体展示的位置*/
    dev.AddElement = function (element, position, parent) {
        if (dev.IsNull(parent) || dev.IsNull(element)) return;
        if (dev.IsNull(position)) position = {};
        $(parent).append($(element));
        var pw = $(parent).outerWidth();
        var ph = $(parent).outerHeight();
        var left = 0, top = 0;
        var w = $(element).outerWidth();
        var h = $(element).outerHeight();
        if (dev.IsNull(position.X)) position.X = dev.PositionEnum.Left;
        if (dev.IsNull(position.Y)) position.Y = dev.PositionEnum.Top;
        if (w >= pw) left = 0;
        else {
            switch (position.X.toUpperCase()) {
                case dev.PositionEnum.Left: left = left; break;
                case dev.PositionEnum.Right: left = pw - w; break;
                case dev.PositionEnum.Center: left = (pw - w + left) / 2; break;
                default:
                    left = left + parseFloat(position.X);
                    if (left >= pw) {
                        left = left - parseFloat(position.X);
                        if ((left + w) > pw || w >= pw) left = 0;
                    }
                    break;
            }
        }
        if (h >= ph) top = 0;
        else {
            switch (position.Y.toUpperCase()) {
                case dev.PositionEnum.Top: top = top; break;
                case dev.PositionEnum.Bottom: top = ph - h; break;
                case dev.PositionEnum.Center: top = (ph - h + top) / 2; break;
                default:
                    top = top + parseFloat(position.Y);
                    if (top > ph) {
                        top = top - parseFloat(position.Y);
                        if ((top + h) > ph || h > ph) top = 0;
                    }
                    break;
            }
        }
        $(element).css({ 'position': 'absolute', 'top': top, 'left': left });
    };
    /*功能：分组函数
     *参数：groupProp：分组字段，orderProp：排序字段*/
    dev.GroupBy = function (arr, groupProp, orderProp) {
        if (!arr || arr.length < 1) return;
        var groupData = [];
        if (!dev.IsNull(groupProp)) {
            var array = [];
            $.each(arr, function (i, o) {
                if ($.inArray(o[groupProp], array) < 0) array.push(o[groupProp]);
            });
            $.each(array, function (j, o) {
                var item = { Key: o };
                var arry = $.grep(arr, function (n, i) { return n[groupProp] == o; });
                item.Items = dev.IsNull(orderProp) ? arry : dev.OrderBy(arry, orderProp);
                item.Index = dev.IsNull(orderProp) ? 0 : item.Items[0][orderProp];
                item.index = j;
                groupData.push(item);
            });
            return dev.OrderBy(groupData, 'Index');
        }
        return arr;
    };
    /*功能：排序函数
     *参数：orderProp：排序字段，orderway：排序方式*/
    dev.OrderBy = function (arr, orderProp, orderway, IgnoreType) {
        orderway = dev.IsNull(orderway) ? dev.OrderWay.ASC : orderway.toUpperCase();
        return arr.sort(function (a, b) {
            var max = orderway == dev.OrderWay.DESC ? b[orderProp] : a[orderProp];
            var min = orderway == dev.OrderWay.DESC ? a[orderProp] : b[orderProp];
            if (!IgnoreType) {
                if (dev.IsString(max) || dev.IsString(min)) return max.localeCompare(min);
                else if (dev.IsNumber(max) || dev.IsNumber(min)) return (max - min);
            }
            else return (parseFloat(max) - parseFloat(min));
        });
    };
    /*功能：将/Date(...)格式转换为yyyy-MM-dd HH:mm:ss型日期格式
     *参数：Date(...)格式
     *返回值：yyy-MM-dd HH:mm:ss格式的字符串*/
    dev.DateToString = function (str) {
        var d = eval('new ' + str.substr(1, str.length - 2));
        var year = dFormat(d.getFullYear());
        var month = dFormat(d.getMonth() + 1);
        var date = dFormat(d.getDate());
        var hours = dFormat(d.getHours());
        var min = dFormat(d.getMinutes());
        var sed = dFormat(d.getSeconds());
        return year + "-" + month + "-" + date + " " + hours + ":" + min + ":" + sed;
        function dFormat(i) { return i < 10 ? "0" + i.toString() : i; }
    };
    /*功能：将/Date(...)格式转换为yyyy-MM-dd型日期格式
    *参数：Date(...)格式
    *返回值：yyy-MM-dd格式的字符串*/
    dev.ShortDateToString = function (str) {
        var d = eval('new ' + str.substr(1, str.length - 2));
        var year = dFormat(d.getFullYear());
        var month = dFormat(d.getMonth() + 1);
        var date = dFormat(d.getDate());
        return year + "-" + month + "-" + date;
        function dFormat(i) { return i < 10 ? "0" + i.toString() : i; }
    };
    dev.toJSON = function (obj) {
        return $.toJSON(obj);
    };
    dev.evalJSON = function (str) {
        //return $.toJSON(str);
        return $.evalJSON(str);
    };
    /*数组求和*/
    dev.Sum = function (arr, proName) {
        var sum = 0;
        if (dev.IsNull(arr)) return sum;
        if (dev.IsNull(proName)) for (var i = 0; i < arr.length; i++) sum += arr[i];
        else for (var i = 0; i < arr.length; i++) sum += arr[i][proName];
        return sum;
    };
    /*功能:获取系统基址*/
    dev.GetRootUri = function () {
        var pathName = window.document.location.pathname;
        var localhost = window.location.host;
        var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
        return ("http://" + localhost + projectName + "/");
    };
    /*功能:禁止页面元素拖拽*/
    dev.NoDrag = function () {
        $(document).bind("contextmenu", function () { return false; });
        document.ondragstart = function () { return false; };
        document.onselectstart = function () { return false; };
        document.onselect = function () { if (!dev.IsNull(document.selection)) { document.selection.empty(); } };
    };
    /*功能:系统风格*/
    dev.ThemeType = { WebOS: 'WEBOS', Office: 'OFFICE', Simple: 'SIMPLE' };
    /*功能:位置枚举*/
    dev.PositionEnum = { Left: 'LEFT', Right: 'RIGHT', Center: 'CENTER', Top: 'TOP', Bottom: 'BOTTOM' };
    /*功能：插件布局位置*/
    dev.WidgetLayout = { Float: "FLOAT", Left: "LEFT", Right: 'RIGHT', Bottom: "BOTTOM", Fill: "FILL", Tab: "TAB", FloatHTML: "FLOATHTML" };
    /*功能：排序方式*/
    dev.OrderWay = { DESC: 'DESC', ASC: 'ASC' };
    /*功能：日志类型*/
    dev.LogType = { Fatal: "Fatal", Error: "Error", Warn: "Warn", Info: "Info", Debug: "Debug" };
    /*功能：排序方式*/
    dev.DrawType = { Point: "Point", Ployline: "LineString", Ploygon: "Ploygon", Circle: "Circle", Square: "Square", Rectangle: "Box" };
    /*功能：冒泡位置*/
    dev.TrianglePosition = { Left: 'LEFT', Right: 'RIGHT', Top: 'TOP', Bottom: 'BOTTOM' };
    /*功能：冒泡位置*/
    dev.Region = { West: 'WEST', East: 'EAST', South: 'SOUTH', North: 'NORTH' };
    /*功能：文件类型*/
    dev.FileType = { Word: "WORD", PPT: "PPT", Excel: "EXCEL", PDF: "PDF", Image: "IMAGE", Text: "TEXT" };
    /*功能：控件类型*/
    dev.ControlType = {
        "TextBox": ".dev-textbox", "NumberBox": ".dev-numberbox", "Combobox": ".dev-combobox",
        "CheckBox": ".dev-checkbox", "Radio": ".dev-radio", "NumberSpinnerBox": ".dev-numberspinner",
        "Tree": ".dev-tree", "DataGrid": ".dev-datagrid", "Text": ".dev-text", "ListBox": ".dev-listbox",
        "Box": ".dev-box"
    };
    /*功能：控件继承关系*/
    dev.InheritType = { "Text": [".dev-textbox", ".dev-numberbox", ".dev-combobox"] };
    /*设置图层是否显示*/
    dev.SetLayersVisble = function (types, currtype) {
        //首先判断有多少种
        if (dev.IsNull(types) || types.length === 0 || dev.IsNull(currtype)) return;
        var alllayers = dev.App.Config.SystemMap.LayerInfo.BaseLayers;
        var currlayers = Enumerable.From(alllayers).Where('s=>s.TypeEx==="' + currtype + '"').ToArray();
        var otherlayers = [];
        for (var i = 0; i < types.length; i++) {
            if (types[i] === currtype) continue;
            var newdata = Enumerable.From(alllayers).Where('s=>s.TypeEx==="' + types[i] + '"').ToArray();
            for (var j = 0; j < newdata.length; j++) otherlayers.push(newdata[j]);
        }
        var layers = dev.App.Map.getLayers();
        layers.forEach(function (o, i) {
            var tmpLayer;
            var temlayer = Enumerable.From(currlayers).Where('s=>s.Name==="' + o.getProperties().id + '"').ToArray();
            if (!dev.IsNull(temlayer) && temlayer.length > 0) { tmpLayer = o; tmpLayer.setVisible(true); }
            var temlayer1 = Enumerable.From(otherlayers).Where('s=>s.Name==="' + o.getProperties().id + '"').ToArray();
            if (!dev.IsNull(temlayer1) && temlayer1.length > 0) {
                tmpLayer = o;
                tmpLayer.setVisible(false);
            }
        });
    }
    /*根据ID获取基础地址*/
    dev.GetSystemUrlByBasicID = function (basicid) {
        var basicurls = dev.App.Config.SystemUri.BasicUris;
        if (dev.IsNull(basicurls) || basicurls.length === 0) return "";
        var basicInfo = Enumerable.From(basicurls).Where('s=>s.ID==="' + basicid + '"').ToArray();
        if (basicInfo.length === 0) return "";
        else return basicInfo[0].Uri;
    };
    /*根据ID获取相对地址*/
    dev.GetSystemUrlByRelID = function (relativeid) {
        var relurls = dev.App.Config.SystemUri.RelativeUris;
        if (dev.IsNull(relurls) || relurls.length === 0) return "";
        var relativeInfo = Enumerable.From(relurls).Where('s=>s.ID==="' + relativeid + '"').ToArray();
        if (relativeInfo.length === 0) return "";
        var relativuri = relativeInfo[0].Uri;
        var basicid = relativeInfo[0].BasicID;
        if (dev.IsNull(basicid)) return relativuri;
        var basicuri = dev.GetSystemUrlByBasicID(basicid);
        return basicuri + relativuri;
    };
    /*获取URL中参数值*/
    dev.GetQueryString = function (name, url) {
        if (dev.IsNull(url)) url = window.location.search.substr(1);
        var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", 'i');
        var r = url.match(reg);
        return r == null ? null : unescape(r[2]);
    };
    //获取请求地址参数
    dev.GetRequestParams = function (url) {
        if (dev.IsNull(url)) url = window.location.search.substr(1);
        var theRequest = {};
        if (url.indexOf("?") != -1) {
            var urls = url.split("?");
            theRequest["BaseUri"] = urls[0];
            var str = urls[1];
            strs = str.split("&");
            for (var i = 0; i < strs.length; i++) {
                var param = strs[i].split("=");
                theRequest[param[0]] = unescape(param[1]);
            }
        }
        return theRequest;
    };
    /*对象克隆*/
    dev.ObjClone = function (obj) {
        return $.extend(true, {}, obj);
    };
    /*对象克隆去除某些属性*/
    dev.ObjCloneExceptAttr = function (obj, attrArr) {
        var cloneData = $.extend(true, {}, obj);
        $.each($(attrArr), function (i, o) { delete cloneData[o]; });
        return cloneData;
    };
    /*数组相关方法*/
    (function () {
        Array.prototype.each = function (fn) {
            fn = fn || Function.K;
            var a = [];
            var args = Array.prototype.slice.call(arguments, 1);
            for (var i = 0; i < this.length; i++) {
                var res = fn.apply(this, [this[i], i].concat(args));
                if (res != null) a.push(res);
            }
            return a;
        };
        /*数组去重*/
        Array.prototype.uniquelize = function () {
            var ra = new Array();
            for (var i = 0; i < this.length; i++) {
                if (!ra.contains(this[i])) {
                    ra.push(this[i]);
                }
            }
            return ra;
        };
        Array.prototype.contains = function (b) {
            return this.indexOf(b) >= 0;
        }
        /*数组补集*/
        Array.prototype.complement = function (b) {
            return this.union(b).minus(this.intersect(b));
        };
        /*数组交集*/
        Array.prototype.intersect = function (b) {
            return this.uniquelize().each(function (o) { return b.contains(o) ? o : null });
        };
        /*数组差值*/
        Array.prototype.minus = function (b) {
            return this.uniquelize().each(function (o) {
                return b.contains(o) ? null : o
            });
        };
        /*数组并集*/
        Array.prototype.union = function (b) {
            return this.concat(b).uniquelize();
        };
        /*数组克隆*/
        Array.prototype.clone = function () {
            return $.extend(true, {}, { tmp: this }).tmp;
        };
    })();
    //验证数据绑定关键字
    dev.ParseOpt = function (o, obj) {
        if (dev.IsNull(obj)) return { Target: o };
        var reg = /^<\$[a-zA-Z_][a-zA-Z0-9_.\[\]\:]*\$>$/m;
        for (var item in obj) {
            if (!reg.test(obj[item])) continue;
            var key = obj[item].replace(/^<\$|\$>$/g, "");
            obj.Data = convertSource(key, window);
        }
        return $.extend({ Target: o }, obj);
    };
    //初始化界面
    dev.InitControl = function () {
        for (var key in dev.ControlType) {
            var selector = dev.ControlType[key] + getNotSelector(key);
            $.each($(selector), function (i, o) {
                if (dev.IsNull($(o).prop("$this"))) {
                    var opt = $(o).attr("opt");
                    opt = dev.IsNull(opt) ? null : JSON.parse(opt);
                    opt = dev.ParseOpt($(o), opt);
                    new dev[key](opt);
                }
            });
        }
    };
    function convertSource(key, data) {
        var isFun = key.indexOf("fun:") >= 0;
        var arrSource = key.split(/\./g);
        for (var i = 0; i < arrSource.length; i++) {
            var item = arrSource[i].split(/\[/g);
            for (var j = 0; j < item.length; j++) {
                if (item[j].indexOf("]") >= 0) data = data[parseInt(item[j].replace(/\]/g, ""))];
                else if (isFun) {
                    data = data[item[j].replace(/fun\:/g, "")];
                    if ($.isFunction(data)) data = data();
                }
                else data = data[item[j]];
            }
        }
        return data;
    };
    function getNotSelector(key) {
        if (dev.IsNull(dev.InheritType[key])) return "";
        return ":not(" + dev.InheritType[key].toString() + ")";
    };
    //鼠标点击隐藏控件
    function hideControl(doc) {
        //$.each($(dev.ControlType.Combobox, doc.body), function (i, o) {
        //    var $this = $(o).prop("$this");
        //    if ($this && !$this.over1) $this.HidePopup();
        //});
    };
    //窗体大小改变自适应控件大小
    function resizeControl(doc) {
        for (var key in dev.ControlType) {
            var selector = dev.ControlType[key] + getNotSelector(key);
            $.each($(selector, doc.body), function (i, o) {
                var $this = $(o).prop("$this");
                if ($this.Stretched && $this.Layout) $this.Layout();
            });
        }
    };
    $(function () {
        dev.InitControl();
        //$(document).mousedown(function () {
        //    hideControl(this);
        //});
        $(window).resize(function () {
            resizeControl(this.document);
        });
    });
    //十六进制颜色转换为十进制颜色
    dev.colorrgb = function (hexColor) {
        var scolor = hexColor.toLowerCase();
        var reg = /^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/;
        var sColorChange = [];
        if (scolor && reg.test(scolor)) {
            if (scolor.length === 4) {
                var sColorNew = "#";
                for (var i = 1; i < 4; i++) sColorNew += scolor.slice(i, i + 1).concat(scolor.slice(i, i + 1));
                scolor = sColorNew;
            }
            for (var i = 1; i < 7; i += 2) {
                sColorChange.push(parseInt("0x" + scolor.slice(i, i + 2)));
            }
        }
        return sColorChange;
    };

    //刷新地图
    dev.RefreshMap = function (map) {
        if (dev.IsNull(dev.App.Config.SystemMap.OldDisplayEPSG) || dev.IsNull(dev.App.Config.SystemMap.DisplayEPSG)) return;
        if (dev.IsNull(map)) map = dev.App.Map;
        var oldmapcenter = map.getView().getCenter();
        var oldmapzoom = map.getView().getZoom();
        //将地图的view坐标系进行转换
        //获取所有图层
        var layers = map.getLayers();
        var layerparms = [];
        var needfeatures = [];
        layers.forEach(function (o, i) {
            if (!dev.IsNull(o.getProperties().layerparaminfo)) {
                var layer_paraminfo = dev.ObjClone(o.getProperties().layerparaminfo);
                layer_paraminfo.Visible = o.getVisible();
                layerparms.push(layer_paraminfo);
            }
            if (!dev.IsNull(o.getProperties().type) && (o.getProperties().type.toLowerCase() === "tempvector" || o.getProperties().type.toLowerCase() === "vector")) {
                if (dev.IsNull(o.getProperties().layerparaminfo)) {
                    var param = { Type: "TempVector", ID: o.getProperties().id, LayerInfo: { Type: "TempVector" } };
                    if (o.getProperties().id == "HightLightLayer") param.ZIndex = 900;
                    layerparms.push(param);
                }
                var features = o.getSource().getFeatures();
                for (var i = 0; i < features.length; i++) {
                    if (o.getProperties().id == "HightLightLayer") {
                        var f_id = features[i].getId();
                        f_id = f_id.replace("pointkyef", '');
                        if (!dev.IsNull(f_id)) dev.MapUtils.removePointKey(f_id, map);
                    }
                    needfeatures.push({ layerid: o.getProperties().id, feature: features[i] });
                }
            }
        });
        layers.clear();
        var resolutions;
        var config = dev.App.Config.SystemMap;
        if (!dev.IsNull(config.LevelInfo) && !dev.IsNull(config.LevelInfo.IsVisibleLevel) && config.LevelInfo.IsVisibleLevel == "true") {
            config.LevelInfo.Levels = dev.OrderBy(config.LevelInfo.Levels, "Resolution", dev.OrderWay.DESC, true);
            resolutions = [];
            if (dev.IsNull(config.DisplayEPSG)) config.DisplayEPSG = "EPSG:4326";
            for (var i = 0; i < config.LevelInfo.Levels.length; i++)
                if (dev.IsNull(config.DisplayEPSG) || config.DisplayEPSG == "EPSG:4326") resolutions.push(parseFloat(config.LevelInfo.Levels[i].Resolution));
                else resolutions.push(parseFloat(config.LevelInfo.Levels[i].Resolution3857));
        }
        var minZoom = parseInt(config.LevelInfo.MinZoom);
        var proj = dev.proj.get(config.DisplayEPSG);
        map.setView(new dev.View({
            projection: proj,
            resolutions: resolutions,
            minZoom: minZoom,
            minResolution: resolutions[resolutions.length - 1],
            maxZoom: resolutions.length + minZoom - 1,
            maxResolution: resolutions[0]
        }));
        if (!dev.IsNull(dev.App.Navigation)) dev.App.Navigation.mapViewRefresh();
        for (var i = 0; i < layerparms.length; i++) {//添加图层
            var curr_layer = layerparms[i];
            curr_layer.Map = map;
            //加载WMTS
            if (curr_layer.Type == dev.LayerType.Tile) {
                if (!dev.IsNull(curr_layer.EPSG)) curr_layer.EPSG = config.DisplayEPSG;
                if (!dev.IsNull(curr_layer.Extent)) curr_layer.Extent = dev.proj.transformExtent(curr_layer.Extent, dev.App.Config.SystemMap.OldDisplayEPSG, dev.App.Config.SystemMap.DisplayEPSG);
                dev.MapLoad.AddWMTSLayer1(curr_layer);
            }
            if (curr_layer.Type == dev.LayerType.WMS) {
                if (!dev.IsNull(curr_layer.EPSG)) curr_layer.EPSG = config.DisplayEPSG;
                dev.MapLoad.AddWMSLayer(curr_layer);
            }
            if (curr_layer.Type == dev.LayerType.TileXYZ) {
                var mapproj = map.getView().getProjection();
                if (mapproj.getCode() == "EPSG:4326") dev.MapLoad.AddTileXYZLayer2(curr_layer);
                else dev.MapLoad.AddTileXYZLayer3(curr_layer);
            }
            if (curr_layer.Type == dev.LayerType.TempVector) {
                dev.MapLoad.AddVectorLayer(curr_layer);
            }
            //加载heatmap
            if (curr_layer.Type == "HEATMAP") {
                var source;
                if (dev.IsNull(curr_layer.WFSUrl) && dev.IsNull(curr_layer.TypeName)) source = new ol.source.Vector({});
                else source = new ol.source.Vector({
                    url: dev.getheatmapUrl({
                        WFS: dev.GetSystemUrlByRelID(curr_layer.WFSUrl),
                        TypeName: curr_layer.TypeName,
                        SrsName: map.getView().getProjection().getCode(),
                        OutputFormat: curr_layer.OutputFormat,
                        Version: curr_layer.Version
                    }),
                    format: new ol.format.GeoJSON({
                        extractStyles: false
                    })
                });
                var heatmaplayer = new ol.layer.Heatmap({
                    id: curr_layer.ID,
                    source: source,
                    gradient: curr_layer.colors,
                    blur: 0,
                    radius: 10,
                    opacity: 0,
                    layerparaminfo: curr_layer
                });
                if (curr_layer.isevent) {
                    heatmaplayer.getSource().on(curr_layer.eventname, function (event) {
                        event.feature.setId(curr_layer.featurepre + new Date().getTime());
                    });
                }
                map.addLayer(heatmaplayer);
            }
        }
        //设置中心点和范围
        //添加features
        if (needfeatures.length > 0) {
            //高亮图层元素
            var hlight_features = Enumerable.From(needfeatures).Where('s=>s.layerid=="HightLightLayer"').ToArray();
            //添加高亮元素
            for (var i = 0; i < hlight_features.length; i++) {
                var c_f = hlight_features[i].feature;
                c_f.getGeometry().transform(dev.App.Config.SystemMap.OldDisplayEPSG, dev.App.Config.SystemMap.DisplayEPSG);
                var c_fid = c_f.getId();
                c_fid = c_fid.replace("pointkyef", '');
                c_f.setId(c_fid);
                //获取type
                var geom_type = hlight_features[i].feature.getGeometry().getType();
                if (geom_type == "Polygon" || geom_type == "MultiPolygon") dev.MapUtils.LineSymbolStyle(c_f, map, null, false);
                if (geom_type == "Point") {
                    var fillcolor = c_f.getStyle().getImage().getFill().getColor();
                    var bordercolor = c_f.getStyle().getImage().getStroke().getColor();
                    dev.MapUtils.PointSymbolStyle1(c_f, 1, bordercolor, fillcolor, null, map, false);
                }
            }
            var tempfeatures = Enumerable.From(needfeatures).Where('s=>s.layerid!="HightLightLayer"').ToArray();
            var featuresgroup = Enumerable.From(tempfeatures).GroupBy("s=>s.layerid").ToArray();
            for (var i = 0; i < featuresgroup.length; i++) {
                var cf_source = featuresgroup[i].source;
                var c_layerid = cf_source[0].layerid;
                var c_features = [];
                for (var j = 0; j < cf_source.length; j++) {
                    var c_feature = cf_source[j].feature;
                    c_feature.getGeometry().transform(dev.App.Config.SystemMap.OldDisplayEPSG, dev.App.Config.SystemMap.DisplayEPSG);
                    c_features.push(c_feature);
                }
                if (c_features.length == 0) continue;
                dev.MapUtils.AddFeatures(c_features, c_layerid, null, map, false);
            }
        }
        var overlays = map.getOverlays().getArray();
        for (var i = 0; i < overlays.length; i++) {
            var curr_overlay = overlays[i];
            var tempp = curr_overlay.getPosition();
            if (!dev.IsNull(tempp)) {
                var curr_p = tempp.clone();
                var new_position = dev.proj.transform(curr_p, dev.App.Config.SystemMap.OldDisplayEPSG, dev.App.Config.SystemMap.DisplayEPSG);
                curr_overlay.setPosition(new_position);
            }
        }
        var mapproj = map.getView().getProjection();
        if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) map.getView().setZoom(oldmapzoom + 1);
        else map.getView().setZoom(oldmapzoom - 1);
        map.getView().centerOn(dev.proj.transform(oldmapcenter, dev.App.Config.SystemMap.OldDisplayEPSG, map.getView().getProjection().getCode()), map.getSize(), [map.getSize()[0] / 2, map.getSize()[1] / 2]);
        dev.App.MapPanel.Target.triggerHandler("onMapRefresh", { center: oldmapcenter, zoom: oldmapzoom });
    }

})(jQuery);