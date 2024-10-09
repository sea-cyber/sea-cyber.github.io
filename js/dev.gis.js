if (!dev) dev = ol;

/*初始化3D图形*/
; (function ($) {
    var tilt_
    dev.InitMap3D = function () {
        var config3d = dev.App.Config.SystemMap.Map3DInfo;
        dev.App.Map3D = new Cesium.Viewer(dev.App.MapPanel.MapDOM3D[0], {
            homeButton: (dev.IsBoolean(config3d.HomeButton) ? config3d.HomeButton : config3d.HomeButton == "true"),
            animation: (dev.IsBoolean(config3d.Animation) ? config3d.Animation : config3d.Animation == "true"),
            baseLayerPicker: (dev.IsBoolean(config3d.BaseLayerPicker) ? config3d.BaseLayerPicker : config3d.BaseLayerPicker == "true"),
            geocoder: (dev.IsBoolean(config3d.Geocoder) ? config3d.Geocoder : config3d.Geocoder == "true"),
            timeline: (dev.IsBoolean(config3d.TimeLine) ? config3d.TimeLine : config3d.TimeLine == "true"),
            sceneModePicker: (dev.IsBoolean(config3d.SceneModePicker) ? config3d.SceneModePicker : config3d.SceneModePicker == "true"),
            navigationHelpButton: (dev.IsBoolean(config3d.NavigationHelpButton) ? config3d.NavigationHelpButton : config3d.NavigationHelpButton == "true"),
            infoBox: (dev.IsBoolean(config3d.InfoBox) ? config3d.InfoBox : config3d.InfoBox == "true"),
            fullscreenButton: (dev.IsBoolean(config3d.FullscreenButton) ? config3d.FullscreenButton : config3d.FullscreenButton == "true"),
            selectionIndicator: false,//不显示绿色方框
            creditContainer: $('<div></div>')[0]
        });
        dev.App.Map3D.extend(Cesium.viewerCesiumNavigationMixin, {});

        var layers = dev.App.Map3D.scene.globe.imageryLayers;
        layers.removeAll();
        layers.addImageryProvider(Cesium.createTileMapServiceImageryProvider({
            url: dev.GetSystemUrlByRelID("Basic3D"),
            fileExtension: 'png',
            tilingScheme: new Cesium.GeographicTilingScheme({
                ellipsoid: Cesium.Ellipsoid.WGS84,
                rectangle: new Cesium.Rectangle(
                       Cesium.Math.toRadians(-180.0),
                       Cesium.Math.toRadians(-90.0),
                       Cesium.Math.toRadians(180.0),
                       Cesium.Math.toRadians(90.0)),
                numberOfLevelZeroTilesX: 2,
                numberOfLevelZeroTilesY: 1
            })
        }));
        dev.App.Map3D.scene.terrainProvider = new Cesium.CesiumTerrainProvider({
            url: dev.GetSystemUrlByRelID("Terrain3D"),
            requestWaterMask: true,
            requestVertexNormals: true,
            selectionIndicator: false
        });
        var ext = dev.App.Config.SystemMap.Extent;
        var beginpoint = [parseFloat(ext.XMin), parseFloat(ext.YMin)];
        var endpoint = [parseFloat(ext.XMax), parseFloat(ext.YMax)];
        dev.Map3DUtils.SetView(beginpoint, endpoint);
        //加载图层
        var baselayersconfig = dev.App.Config.SystemMap.LayerInfo.BaseLayers;
        var baselayers;
        if (!dev.IsNull(baselayersconfig)) {
            if (dev.IsNull(baselayersconfig.length)) baselayers = [dev.ObjClone(baselayersconfig)];
            else baselayers = baselayersconfig.clone();
            baselayers = Enumerable.From(baselayers).Where('s=>s.Map3D=="true"').ToArray();
            for (var i = 0; i < baselayers.length; i++) {
                switch (baselayers[i].Type) {
                    case dev.LayerType.WMS:
                        dev.Map3DUtils.AddWMSLayer(baselayers[i]);
                        break;
                    case dev.LayerType.Tile:
                        dev.Map3DUtils.AddTileWMSLayer(baselayers[i]);
                        break;
                    case dev.LayerType.Tile3D:
                        dev.Map3DUtils.Add3DTileLayer(baselayers[i]);
                        break;
                }
            }
        }
        if (!dev.IsNull(dev.App.Map)) {
            dev.App.Map.on("moveend", function () {
                dev.App._is2dmove = true;
                if (dev.App._Is3dmove || dev.App._is3dwheel) { dev.App._Is3dmove = false; dev.App._is3dwheel = false; return; }
                var mapproj = dev.App.Map.getView().getProjection();
                var ex = dev.App.Map.getView().calculateExtent(dev.App.Map.getSize());
                if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
                    ex = dev.proj.transformExtent(ex, mapproj.getCode(), dev.App.Config.SystemMap.DataEPSG);
                }
                if (dev.IsNull(ex) || isNaN(ex[0]) || isNaN(ex[1]) || isNaN(ex[2]) || isNaN(ex[3])) return;
                dev.Map3DUtils.SetView([ex[0], ex[1]], [ex[2], ex[3]]);

            });
            dev.App.Map.on("pointerdrag", function () {
                dev.App._is2dmove = true;
                if (dev.App._Is3dmove || dev.App._is3dwheel) { dev.App._Is3dmove = false; dev.App._is3dwheel = false; return; }
                var ex = dev.App.Map.getView().calculateExtent(dev.App.Map.getSize());
                if (dev.IsNull(ex) || isNaN(ex[0]) || isNaN(ex[1]) || isNaN(ex[2]) || isNaN(ex[3])) return;
                dev.Map3DUtils.SetView([ex[0], ex[1]], [ex[2], ex[3]]);
            });
        }
        var handler = new Cesium.ScreenSpaceEventHandler(dev.App.Map3D.scene.canvas);
        dev.App.MapPanel.MapDOM3D.css("cursor", "url(" + dev.App.Root + "image/hands.cur),auto");
        handler.setInputAction(function (movement) {
            dev.App._Is3dmove = true;
            dev.Map3DUtils.UpdateView();
            var c_center = dev.Map3DUtils.Get2DCenterBy2D();
            var mapproj = dev.App.Map.getView().getProjection();
            if (mapproj.getCode() != "EPSG:4326") c_center = dev.proj.transform(c_center, "EPSG:4326", mapproj.getCode());
            dev.App.Map.getView().setCenter(c_center);
        }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        handler.setInputAction(function (mousewheel) {
            dev.App._is3dwheel = true;
            dev.Map3DUtils.UpdateView();
        }, Cesium.ScreenSpaceEventType.WHEEL);
        handler.setInputAction(function () {
            dev.App.MapAngleLink = true;
        }, Cesium.ScreenSpaceEventType.MIDDLE_DOWN);
        handler.setInputAction(function (e) {
            if (dev.measureState || dev.drawstate) return;
            dev.App.MapPanel.MapDOM3D.css("cursor", "url(" + dev.App.Root + "image/handm.cur),auto");
        }, Cesium.ScreenSpaceEventType.LEFT_DOWN);
        handler.setInputAction(function (e) {
            if (dev.measureState || dev.drawstate) return;
            dev.App.MapPanel.MapDOM3D.css("cursor", "url(" + dev.App.Root + "image/hands.cur),auto");
        }, Cesium.ScreenSpaceEventType.LEFT_UP);
        //地图测量
        var tool_3d = $('<div title="测量长度" style="width:30px;height:30px;z-index:10001;position:absolute;right:100px;top:40px;background:rgba(0,0,0,0.4);border:1px solid #999;"><div style="width:16px;height:16px; margin-left: 7px; margin-top: 7px;" class="icon icon-maptool-measuredistance"></div></div>');
        dev.App.MapPanel.MapDOM3D.append(tool_3d);
        tool_3d.click(function () {
            var url = dev.App.Root + "image/mdistanc_cursor.ico";
            dev.App.MapPanel.MapDOM3D.css("cursor", "url(" + url + "),auto");
            dev.measureState = true;
            dev.measure3D.measureLength();
        }).mouseenter(function () {
            $(".icon", $(this)).removeClass("icon-maptool-measuredistance").addClass("icon-maptool-measuredistance1");
            $(this).css({ "background-color": "#fff", "cursor": "pointer" });
        }).mouseleave(function () {
            $(".icon", $(this)).removeClass("icon-maptool-measuredistance1").addClass("icon-maptool-measuredistance");
            $(this).css("background-color", "rgba(0,0,0,0.4)");
        });
        var tool_measureArea = $('<div title="测量面积" style="width:30px;height:30px;z-index:10001;position:absolute;right:138px;top:40px;background:rgba(0,0,0,0.4);border:1px solid #999;"><div style="width:16px;height:16px; margin-left: 7px; margin-top: 7px;" class="icon icon-maptool-measurearea"></div></div>');
        dev.App.MapPanel.MapDOM3D.append(tool_measureArea);
        tool_measureArea.click(function () {
            var url = dev.App.Root + "image/ameasure_cursor.ico";
            dev.App.MapPanel.MapDOM3D.css("cursor", "url(" + url + "),auto");
            dev.measureState = true;
            dev.measure3D.measureArea();
        }).mouseenter(function () {
            $(".icon", $(this)).removeClass("icon-maptool-measurearea").addClass("icon-maptool-measurearea1");
            $(this).css({ "background-color": "#fff", "cursor": "pointer" });
        }).mouseleave(function () {
            $(".icon", $(this)).removeClass("icon-maptool-measurearea1").addClass("icon-maptool-measurearea");
            $(this).css("background-color", "rgba(0,0,0,0.4)");
        });
        //初始化专题图层图标
        var tipic_3dPanel;
        var tool_3dlayer = $('<div title="专题图层" style="width:30px;height:30px;z-index:10001;position:absolute;top:40px;right:180px;background:rgba(0,0,0,0.4);border:1px solid #999;"><div style="width:16px;height:16px; margin-left: 7px; margin-top: 7px;" class="icon icon-maptool-topic"></div></div>');
        dev.App.MapPanel.MapDOM3D.append(tool_3dlayer);
        tool_3dlayer.mouseover(function () {
            $(".icon", $(this)).removeClass("icon-maptool-topic").addClass("icon-maptool-topic1");
            $(this).css({ "background-color": "#fff", "cursor": "pointer" });
        }).mouseleave(function () {
            $(".icon", $(this)).removeClass("icon-maptool-topic1").addClass("icon-maptool-topic");
            $(this).css("background", "rgba(0,0,0,0.3)");
        });
        var layerconfig = dev.App.Config.Extend.LayerForTree;
        var temp = dev.ObjClone(layerconfig);
        if (!dev.IsNull(temp.LayerRoot) && dev.IsNull(temp.LayerRoot.length)) temp.LayerRoot = [temp.LayerRoot];
        dev.App.tree3ddata = temp.LayerRoot.clone();
        dev.App.tree3ddata = dev.GetTreeLayers(dev.TreeLayerType.ThreeD, dev.App.tree3ddata);
        tool_3dlayer.click(function () {
            //显示专题图层
            if (dev.IsNull(tipic_3dPanel)) {
                tipic_3dPanel = new dev.floatPanel({
                    ID: "topicPanel",
                    IconCls: "icon-maptool-topic",
                    CSS: { "top": "80px", "right": "110px" },
                    Title: "专题图层",
                    Width: 376,
                    Draggable: "true",
                    Parent: dev.App.MapPanel.MapDOM3D
                });
                tipic_3dPanel.Target.one("onClosing", function () {
                    tipic_3dPanel = null;
                });
                //添加图层树
                dev.initThreeDTreeLayer();
            }
            else {
                tipic_3dPanel.SetDock(true);
                tipic_3dPanel.SetVisible(true);
            }
        });
        dev.measure3D.init();

        $(".navigation-control-icon-zoom-in").click(function (s, e) {
            dev.App._is3dwheel = true;
            dev.Map3DUtils.UpdateView();
        });
        $(".navigation-control-icon-zoom-out").click(function () {
            dev.App._is3dwheel = true;
            dev.Map3DUtils.UpdateView();
        });
    };
    dev.Map3DUtils = {
        SetView: function (point1, point2) {
            if (dev.IsNull(dev.App.Map3D) || (dev.IsNull(point1) && dev.IsNull(point2))) return;
            if (dev.IsNull(point2)) {//设置中心点
                var ellipsoid = dev.App.Map3D.scene.globe.ellipsoid;
                var height = ellipsoid.cartesianToCartographic(dev.App.Map3D.camera.position).height;
                dev.App.Map3D.camera.setView({
                    destination: Cesium.Cartesian3.fromDegrees(point1[0], point1[1], height),
                    orientation: { heading: 0, pitch: Cesium.Math.toRadians(-90.0), roll: 0.0 }
                });
            }
            else dev.App.Map3D.camera.setView({ destination: Cesium.Rectangle.fromDegrees(point1[0], point1[1], point2[0], point2[1]) });//设置可视范围
        },
        GetLayers: function () {
            return dev.App.Map3D.scene.globe.imageryLayers;
        },
        AddWMSLayer: function (args) {
            if (dev.IsNull(args) || dev.IsNull(args.Url) || dev.IsNull(args.Layers)) return;
            var sld_body;
            if (!dev.IsNull(args.Sldbody)) sld_body = args.Sldbody;
            var wmslayer = new Cesium.WebMapServiceImageryProvider({
                url: args.Url,
                layers: args.Layers,
                version: '1.1.0',
                parameters: {
                    transparent: true,
                    format: 'image/png',
                    SLD_BODY: sld_body,
                },
            });
            var layers = this.GetLayers();
            var currlayer = layers.addImageryProvider(wmslayer);
            currlayer.id = args.ID;
            if (!dev.IsNull(args.Visible)) currlayer.show = args.Visible;
        },
        AddTileWMSLayer: function (args) {
            if (dev.IsNull(args) || dev.IsNull(args.Url) || dev.IsNull(args.Layers)) return;
            var wmtslayer = new Cesium.WebMapTileServiceImageryProvider({
                url: args.Url,
                layer: args.Layers,
                format: "image/png",
                style: "",
                tileMatrixSetID: "EPSG:900913",
                maximumLevel: parseInt(args.Level),
                minimumLevel: 0
            });
            var layers = this.GetLayers();
            var currlayer = layers.addImageryProvider(wmtslayer);
            currlayer.id = args.ID;
            //初始化是否显示
            if (!dev.IsNull(args.Visible)) currlayer.show = args.Visible;
        },
        Add3DTileLayer: function (args) {
            if (dev.IsNull(args) || dev.IsNull(args.Url)) return;
            dev.App.Map3D.scene.globe.depthTestAgainstTerrain = false;
            var tile3dlayer = new Cesium.Cesium3DTileset({
                url: args.Url,
                maximumScreenSpaceError: 1,
                maximumNumberOfLoadedTiles: 1000
            });
            tile3dlayer.id = args.Value;
            dev.App.Map3D.scene.primitives.add(tile3dlayer);
        },
        Remove3DTileLayer: function (layerid) {
            var primitives = dev.App.Map3D.scene.primitives._primitives;
            for (var i = 0; i < primitives.length; i++) {
                if (primitives[i].id == layerid) dev.App.Map3D.scene.primitives.remove(primitives[i]);
            }
        },
        Get2DCenterBy2D: function (args) {
            var scene = dev.App.Map3D.scene;
            var cam = scene.camera;
            var ellipsoid = Cesium.Ellipsoid.WGS84;
            var canvas = scene.canvas;
            var center = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
            var target = this.PickOnTerrainOrEllipsoid(scene, center);
            if (!target) {
                //TODO: how to handle this properly ?
                var globe = scene.globe;
                var carto = cam.positionCartographic.clone();
                var height = globe.getHeight(carto);
                carto.height = height || 0;
                target = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);

            }
            var bestTargetCartographic = ellipsoid.cartesianToCartographic(target);
            var longitude = Cesium.Math.toDegrees(bestTargetCartographic.longitude);
            var latitude = Cesium.Math.toDegrees(bestTargetCartographic.latitude);
            return [longitude, latitude];
        },
        UpdateView: function () {
            var scene = dev.App.Map3D.scene;
            var cam = scene.camera;
            var ellipsoid = Cesium.Ellipsoid.WGS84;
            var canvas = scene.canvas;
            var center = new Cesium.Cartesian2(canvas.clientWidth / 2, canvas.clientHeight / 2);
            var target = this.PickOnTerrainOrEllipsoid(scene, center);
            if (!target) {
                var globe = scene.globe;
                var carto = cam.positionCartographic.clone();
                var height = globe.getHeight(carto);
                carto.height = height || 0;
                target = Cesium.Ellipsoid.WGS84.cartographicToCartesian(carto);
            }
            var distance = Cesium.Cartesian3.distance(target, cam.position);
            var bestTargetCartographic = ellipsoid.cartesianToCartographic(target);
            var longitude = Cesium.Math.toDegrees(bestTargetCartographic.longitude);
            var latitude = Cesium.Math.toDegrees(bestTargetCartographic.latitude);
            var point = [parseFloat(longitude), parseFloat(latitude)];
            var mapproj = dev.App.Map.getView().getProjection();
            if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
                point = dev.proj.transform(point, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
            }
            dev.App.Map.getView().setCenter(point);
            dev.App.Map.getView().setResolution(this.CalcResolutionForDistance(distance, bestTargetCartographic ? bestTargetCartographic.latitude : 0));

            if (target) {
                var pos = cam.position;
                var targetNormal = new Cesium.Cartesian3();
                ellipsoid.geocentricSurfaceNormal(target, targetNormal);
                var targetToCamera = new Cesium.Cartesian3();
                Cesium.Cartesian3.subtract(pos, target, targetToCamera);
                Cesium.Cartesian3.normalize(targetToCamera, targetToCamera);
                var up = cam.up;
                var right = cam.right;
                var normal = new Cesium.Cartesian3(-target.y, target.x, 0);
                var heading = Cesium.Cartesian3.angleBetween(right, normal);
                var cross = Cesium.Cartesian3.cross(target, up, new Cesium.Cartesian3());
                var orientation = cross.z;
                if (dev.App.MapAngleLink) dev.App.Map.getView().setRotation((orientation < 0 ? heading : -heading));
                var tiltAngle = Math.acos(Cesium.Cartesian3.dot(targetNormal, targetToCamera));
                tilt_ = isNaN(tiltAngle) ? 0 : tiltAngle;
            }
            else {
                if (dev.App.MapAngleLink) dev.App.Map.getView().setRotation(cam.heading);
                tilt_ = -cam.pitch + Math.PI / 2;
            }
        },
        GetLayerByID: function (id) {
            var needlayer;
            if (dev.IsNull(id)) return needlayer;
            var layers = this.GetLayers()._layers;
            for (var i = 0; i < layers.length; i++) {
                if (layers[i].id != id) continue;
                needlayer = layers[i];
                break;
            }
            return needlayer;
        },
        GetLayerIndexByID: function (id) {
            var index;
            if (dev.IsNull(id)) return index;
            var layers = this.GetLayers()._layers;
            for (var i = 0; i < layers.length; i++) {
                if (layers[i].id != id) continue;
                index = i;
                break;
            }
            return index;
        },
        SetLayerVisibleByID: function (id, visible) {
            if (dev.IsNull(id)) return;
            if (!dev.IsBoolean(visible)) visible = false;
            var currlayer = this.GetLayerByID(id);
            if (dev.IsNull(currlayer)) return;
            currlayer.show = visible;
        },
        RemoveLayer: function (layerid) {
            if (dev.IsNull(layerid)) return;
            //根据id 获取对应的图层
            var layers = this.GetLayers()._layers;
            for (var i = 0; i < layers.length; i++) {
                if (layers[i].id != layerid) continue;
                else {
                    dev.App.Map3D.scene.globe.imageryLayers.remove(layers[i], true);
                    break;
                }
            }
        },
        SetLayerVisible: function (layer, visible) {
            if (dev.IsNull(layer)) return;
            if (!dev.IsBoolean(visible)) visible = false;
            layer.show = visible;
        },
        SetLayerAlphaByID: function (id, alpha) {
            if (dev.IsNull(id)) return;
            if (!dev.IsNumber(alpha)) alpha = 1;
            var currlayer = this.GetLayerByID(id);
            if (dev.IsNull(currlayer)) return;
            currlayer.alpha = alpha;
        },
        LayerOrderChange: function (index, isup) {
            if (dev.IsNull(index)) return;
            if (dev.IsNull(isup)) isup = true;
            var layers = this.GetLayers()._layers;
            if (isup) {
                //图层往上浮，然后在数组中的位置向下移动
                if (index >= layers.length - 1) return;
                var nclayer = layers[index];//需要交换的图层
                // var oldlayer = layers[index + 1];//被动交换的地方
                var temp = nclayer;
                layers[index] = layers[index + 1];
                layers[index + 1] = temp;
            }
            else {
                //图层往下沉，然后数组中的位置往上走
                if (index <= 1) return;
                var nclayer = layers[index];//需要交换的图层
                //  var oldlayer = layers[index - 1];//被动交换的地方
                var temp = nclayer;
                layers[index] = layers[index - 1];
                layers[index - 1] = temp;
            }
        },
        LayerOrderChangeByID: function (id, isup) {
            if (dev.IsNull(id)) return;
            if (dev.IsNull(isup)) isup = true;
            var index = this.GetLayerIndexByID(id);
            if (dev.IsNull(index)) return;
            this.LayerOrderChange(index, isup);
        },
        PickOnTerrainOrEllipsoid: function (scene, pixel) {
            var ray = scene.camera.getPickRay(pixel);
            var target = scene.globe.pick(ray, scene);
            return target || scene.camera.pickEllipsoid(pixel);
        },
        CalcResolutionForDistance: function (distance, latitude) {
            var canvas = dev.App.Map3D.scene.canvas;
            var fovy = dev.App.Map3D.scene.camera.frustum.fovy;
            var metersPerUnit = dev.App.Map.getView().getProjection().getMetersPerUnit();
            var visibleMeters = 2 * distance * Math.tan(fovy / 2);
            var relativeCircumference = Math.cos(Math.abs(latitude));
            var visibleMapUnits = visibleMeters / metersPerUnit / relativeCircumference;
            var resolution = visibleMapUnits / canvas.clientHeight;
            return resolution;
        },
        SetFeatures: function () {
            var e = 18000000;
            var entity = new Cesium.Entity({
                position: Cesium.Cartesian3.fromDegrees(2 * e * Math.random() - e, 2 * e * Math.random() - e, e * Math.random()),
                point: {
                    color: Cesium.Color.RED, // default: WHITE
                    pixelSize: 30,
                    heightReference: e * Math.random()

                }
            })
            var np = dev.App.Map3D.entities.add(entity);
        },
    };
})(jQuery);

/* 描述：GIS通用方法的封装
 * 日期：2015-11-20 */
; (function ($) {
    dev.MapMode = { Map2D: "2D", Map3D: "3D", MapUnit: "Unit" };
    dev.Platform = { HIGHGIS: 'HighGIS', ArcGIS: 'ArcGIS', MapGIS: 'MapGIS', SuperMap: 'SuperMap' };
    dev.FieldType = { Number: 'Number', Text: 'Text', Date: 'Date' };
    dev.GeometryType = { Point: 'Point', Line: 'Line', Polygon: 'Polygon' };
    dev.LayerType = { Mapping: 'Mapping', TileMapping: 'TileMapping', WMS: 'WMS', TempVector: 'TempVector', Tile: "Tile", TileWMS: "TileWMS", TileXYZ: "TileXYZ", RasteWMTS: "RasteWMTS", Tile3D: "3D" };
    dev.Relations = {
        BBOX: 'BBOX',
        INTERSECTS: 'Intersects',
        DWITHIN: 'DWithin',
        WITHIN: "Within",
        CONTAINS: 'Contains'
    };
    /* 描述：MapLoad(地图加载)
     * 日期：2015-11-16*/
    dev.MapLoad = {
        AddArcGISLayer: function (args) {
            if (!args || !args.Map || !args.Url) return;
            var layer = new dev.layer.Tile({
                id: args.ID,
                opacity: 1.0,
                target: dev.IsNull(args.LayerInfo) ? null : args.LayerInfo,
                extent: args.Exent,
                visible: args.Visible,
                source: new dev.source.TileArcGISRest({
                    url: args.Url
                })
            });
            args.Map.addLayer(layer);
        },
        AddWMSLayer: function (args) {
            if (!args && !args.Map) return;
            var $this;
            var titleCount = 0, tileLoadedCount = 0, layerLoaded;
            var layer = dev.MapUtils.GetLayer(args.ID, args.Map);
            var isgeoserver = args.ServerType === "geoserver";
            if (dev.IsNull(layer)) {
                if (!args.Url) return;
                var layerparam = {
                    VERSION: '1.3.0',
                    FORMAT: isgeoserver ? "image/png" : "image/highpng",
                    LAYERS: args.Layers
                };
                var extent = args.Extent;
                if (!dev.IsNull(args.Extent)) {
                    var mapproj = dev.App.Map.getView().getProjection();
                    if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) extent = dev.proj.transformExtent(extent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
                }
                if (!dev.IsNull(args.Filter)) layerparam.FILTER = args.Filter;
                if (!dev.IsNull(args.CQLFilter)) layerparam.CQL_FILTER = args.CQLFilter.replace(/1=1\s*AND|1=1\s*and|1=1\s*OR|1=1\s*or|1=1\s*/, "");
                if (dev.IsNull(layerparam.CQL_FILTER)) layerparam.CQL_FILTER = undefined;
                if (!dev.IsNull(args.EPSG)) layerparam.CRS = dev.IsNull(args.EPSG) ? args.Map.getView().getProjection() : args.EPSG;
                if (!dev.IsNull(args.Sldbody)) layerparam.SLD_BODY = args.Sldbody;
                else if (!dev.IsNull(args.Sldsrc)) { layerparam.SLD_BODY = dev.MapUtils.LoadSLD(args.Sldsrc); layerparam.SLD_BODY = layerparam.SLD_BODY.replace("%NAME%", args.Layers); }
                else if (!dev.IsNull(args.Styles)) layerparam.STYLES = args.Styles;
                if (!isgeoserver && !dev.IsNull(layerparam.SLD_BODY)) layerparam.SLD_BODY = layerparam.SLD_BODY.replace(/\#/g, "%23");
                if (dev.IsNull(args.Type)) args.Type = dev.LayerType.WMS;
                var layer = new dev.layer.Image({
                    id: args.ID,
                    tag: args.Tag,
                    extent: extent,
                    zIndex: dev.IsNull(args.ZIndex) ? 0 : args.ZIndex,
                    opacity: dev.IsNull(args.Opacity) ? 1.0 : args.Opacity,
                    visible: dev.IsBoolean(args.Visible) ? args.Visible : true,
                    source: new dev.source.ImageWMS({
                        ratio: 1,
                        url: args.Url,
                        params: layerparam,
                        imageLoadFunction: function (image, src) {
                            imagePostFunction(image, src);
                            titleCount++;
                        },
                        projection: args.EPSG
                    }),
                    layerparaminfo: args
                });
                $this = $(layer);
                layerLoaded = layer.getSource().on("imageloadend", function (s, e) {
                    tileLoadedCount++;
                    if (titleCount === tileLoadedCount) {
                        $this.triggerHandler("onWMSLayerLoaded", { layer: layer, id: layer.get("id") });
                        if (!dev.IsNull(layerLoaded)) layer.getSource().unByKey(layerLoaded);
                    }
                }, $this);
                args.Map.addLayer(layer);
            }
            else {
                $this = $(layer);
                var osource = layer.getSource();
                var param = osource.getParams();
                if (!dev.IsNull(args.Sldbody)) {
                    param.SLD_BODY = args.Sldbody
                    param.STYLES = '';
                }
                else if (!dev.IsNull(args.Sldsrc)) {
                    param.SLD_BODY = dev.MapUtils.LoadSLD(args.Sldsrc);
                    param.STYLES = '';
                }
                else if (!dev.IsNull(args.Styles)) {
                    delete layerParam.SLD_BODY;
                    param.STYLES = args.Styles;
                }
                if (!isgeoserver && !dev.IsNull(param.SLD_BODY)) param.SLD_BODY = param.SLD_BODY.replace(/\#/g, "%23");
                if (!dev.IsNull(args.CQLFilter)) param.CQL_FILTER = args.CQLFilter.replace(/1=1\s*AND|1=1\s*and|1=1\s*OR|1=1\s*or|1=1\s*/, "");
                if (dev.IsNull(param.CQL_FILTER)) param.CQL_FILTER = undefined;
                if (args.Filter) param.FILTER = args.Filter;
                osource.imageLoadFunction = function (image, src) {
                    imagePostFunction(image, src);
                    titleCount++;
                };
                layerLoaded = osource.on("imageloadend", function (s, e) {
                    tileLoadedCount++;
                    if (titleCount === tileLoadedCount) {
                        $this.triggerHandler("onWMSLayerLoaded", { layer: layer });
                        if (!dev.IsNull(layerLoaded)) layer.getSource().unByKey(layerLoaded);
                    }
                });
                osource.updateParams(param);
            }
            function imagePostFunction(image, src) {
                var img = image.getImage();
                if (!window.btoa) window.btoa = base64.encode;
                if (!window.atob) window.atob = base64.decode;
                if (typeof window.btoa === 'function') {
                    var xhr = new XMLHttpRequest();
                    var dataEntries = src.split("&");
                    var url, params = "";
                    for (var i = 0 ; i < dataEntries.length ; i++) {
                        if (i === 0) url = dataEntries[i];
                        else params = params + "&" + dataEntries[i];
                    }
                    xhr.open('POST', url, true);
                    xhr.responseType = 'arraybuffer';
                    xhr.onload = function (e) {
                        if (this.status === 200) {
                            var uInt8Array = new Uint8Array(this.response);
                            var i = uInt8Array.length;
                            var binaryString = new Array(i);
                            while (i--) {
                                binaryString[i] = String.fromCharCode(uInt8Array[i]);
                            }
                            var data = binaryString.join('');
                            var type = xhr.getResponseHeader('content-type');
                            if (type.indexOf('image') === 0) {
                                img.src = 'data:' + type + ';base64,' + window.btoa(data);
                            }
                        }
                    };
                    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    xhr.setRequestHeader("Content-length", params.length);
                    xhr.setRequestHeader("Connection", "close");
                    xhr.send(params);
                } else {
                    img.src = src;
                }
            };
            return $this;
        },
        AddTileWMSLayer: function (args) {
            if (!args || !args.Map || !args.Url) return;
            var $this;
            var titleCount = 0, tileLoadedCount = 0, layerLoaded;
            var layer = dev.MapUtils.GetLayer(args.ID, args.Map);
            var isgeoserver = args.ServerType === "geoserver";
            if (dev.IsNull(layer)) {
                var layerparam = {
                    VERSION: '1.3.0',
                    FORMAT: isgeoserver ? "image/png" : "image/highpng",
                    LAYERS: args.Layers
                };
                if (!dev.IsNull(args.Filter)) layerparam.FILTER = args.Filter;
                if (!dev.IsNull(args.CQLFilter)) layerparam.CQL_FILTER = args.CQLFilter.replace(/1=1\s*AND|1=1\s*and|1=1\s*OR|1=1\s*or|1=1\s*/, "");
                if (dev.IsNull(layerparam.CQL_FILTER)) layerparam.CQL_FILTER = undefined;
                if (!dev.IsNull(args.EPSG)) layerparam.CRS = dev.IsNull(args.EPSG) ? "EPSG:4326" : args.EPSG;
                if (!dev.IsNull(args.Sldbody)) layerparam.SLD_BODY = args.Sldbody;
                else if (!dev.IsNull(args.Sldsrc)) { layerparam.SLD_BODY = dev.MapUtils.LoadSLD(args.Sldsrc); layerparam.SLD_BODY = layerparam.SLD_BODY.replace("%NAME%", args.Layers); }
                else if (!dev.IsNull(args.Styles)) layerparam.STYLES = args.Styles;
                if (!isgeoserver && !dev.IsNull(layerparam.SLD_BODY)) layerparam.SLD_BODY = layerparam.SLD_BODY.replace(/\#/g, "%23");
                var layer = new dev.layer.Tile({
                    id: args.ID,
                    tag: args.Tag,
                    extent: args.Extent,
                    zIndex: dev.IsNull(args.ZIndex) ? 0 : args.ZIndex,
                    opacity: dev.IsNull(args.Opacity) ? 1.0 : args.Opacity,
                    visible: dev.IsBoolean(args.Visible) ? args.Visible : true,
                    source: new dev.source.TileWMS({
                        crossOrigin: 'anonymous',
                        ratio: 1,
                        url: args.Url,
                        params: layerparam,
                        tileLoadFunction: function (image, src) {
                            imagePostFunction(image, src);
                            titleCount++;
                        }
                    })
                });
                $this = $(layer);
                layerLoaded = layer.getSource().on("tileloadend", function (s, e) {
                    tileLoadedCount++;
                    if (titleCount === tileLoadedCount) {
                        $this.triggerHandler("onWMSLayerLoaded", { layer: layer, id: layer.get("id") });
                        if (!dev.IsNull(layerLoaded)) layer.getSource().unByKey(layerLoaded);
                    }
                }, $this);
                args.Map.addLayer(layer);
            }
            else {
                $this = $(layer);
                var osource = layer.getSource();
                var param = osource.getParams();
                if (!dev.IsNull(args.Sldbody)) {
                    param.SLD_BODY = args.Sldbody
                    param.STYLES = '';
                }
                else if (!dev.IsNull(args.Sldsrc)) {
                    param.SLD_BODY = dev.MapUtils.LoadSLD(args.Sldsrc);
                    param.STYLES = '';
                }
                else if (!dev.IsNull(args.Styles)) {
                    delete layerParam.SLD_BODY;
                    param.STYLES = args.Styles;
                }
                if (!isgeoserver && !dev.IsNull(param.SLD_BODY)) param.SLD_BODY = param.SLD_BODY.replace(/\#/g, "%23");
                if (!dev.IsNull(args.CQLFilter)) param.CQL_FILTER = args.CQLFilter;
                if (!dev.IsNull(args.Filter)) param.FILTER = args.Filter;
                osource.tileLoadFunction = function (image, src) {
                    imagePostFunction(image, src);
                };
                layerLoaded = osource.on("tileloadend", function (s, e) {
                    tileLoadedCount++;
                    if (titleCount === tileLoadedCount) {
                        $this.triggerHandler("onWMSLayerLoaded", { layer: layer });
                        if (!dev.IsNull(layerLoaded)) layer.getSource().unByKey(layerLoaded);
                    }
                });
                osource.updateParams(param);
            }
            function imagePostFunction(image, src) {
                var img = image.getImage();
                if (!window.btoa) window.btoa = base64.encode;
                if (!window.atob) window.atob = base64.decode;
                if (typeof window.btoa === 'function') {
                    var xhr = new XMLHttpRequest();
                    var dataEntries = src.split("&");
                    var url, params = "";
                    for (var i = 0 ; i < dataEntries.length ; i++) {
                        if (i === 0) url = dataEntries[i];
                        else params = params + "&" + dataEntries[i];
                    }
                    xhr.open('POST', url, true);
                    xhr.responseType = 'arraybuffer';
                    xhr.onload = function (e) {
                        if (this.status === 200) {
                            var uInt8Array = new Uint8Array(this.response);
                            var i = uInt8Array.length;
                            var binaryString = new Array(i);
                            while (i--) {
                                binaryString[i] = String.fromCharCode(uInt8Array[i]);
                            }
                            var data = binaryString.join('');
                            var type = xhr.getResponseHeader('content-type');
                            if (type.indexOf('image') === 0) {
                                img.src = 'data:' + type + ';base64,' + window.btoa(data);
                            }
                        }
                    };
                    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                    xhr.setRequestHeader("Content-length", params.length);
                    xhr.setRequestHeader("Connection", "close");
                    xhr.send(params);
                } else {
                    img.src = src;
                }
            };
            return $this;
        },
        AddWMSLayers: function (args) {//多个WMS出图
            if (!args || args.length === 0) return;
            for (var i = 0; i < args.length; i++) {
                dev.MapLoad.AddWMSLayer(args[i]);
            }
        },
        AddWMTSLayer1: function (args) {
            if (!args || !args.Map || !args.Url || !args.Layers || !args.Level) return;
            args.EPSG = dev.IsNull(args.EPSG) ? args.Map.getView().getProjection().getCode() : args.EPSG;
            args.Level = parseInt(args.Level);
            var projection = dev.proj.get(args.EPSG);
            var projectionExtent = projection.getExtent();
            var size = dev.extent.getWidth(projectionExtent) / 256;
            var resolutions = [];
            if (projection.getCode() == "EPSG:4326") resolutions.push(parseFloat(dev.App.Config.SystemMap.LevelInfo.Levels[0].Resolution));
            if (projection.getCode() == "EPSG:3857") resolutions.push(parseFloat(dev.App.Config.SystemMap.LevelInfo.Levels[0].Resolution3857));
            for (var z = 0; z < args.Level ; z++) resolutions.push(resolutions[z] / 2);
            var matrixIds = new Array(args.Level);
            for (var z = 0; z < args.Level; z++) { matrixIds[z] = args.EPSG + ":" + z; }
            if (dev.IsNull(args.Type)) args.Type = dev.LayerType.Tile;
            var layer = new dev.layer.Tile({
                id: args.ID,
                opacity: dev.IsNull(args.Opacity) ? 1.0 : args.Opacity,
                zIndex: dev.IsNull(args.ZIndex) ? 0 : args.ZIndex,
                extent: args.Extent,
                visible: dev.IsBoolean(args.Visible) ? args.Visible : true,
                source: new dev.source.WMTS({
                    url: args.Url,
                    layer: args.Layers,
                    matrixSet: args.EPSG,
                    format: 'image/png',
                    projection: projection,
                    tileGrid: new ol.tilegrid.WMTS({
                        origin: ol.extent.getTopLeft(projectionExtent),
                        resolutions: resolutions,
                        matrixIds: matrixIds
                    }),
                    style: dev.IsNull(args.Style) ? '' : args.Style,
                    wrapX: false
                }),
                minResolution: dev.IsNull(args.MinResolution) ? resolutions[resolutions.length - 1] : parseFloat(args.MinResolution),
                maxResolution: dev.IsNull(args.MaxResolution) ? resolutions[0] : parseFloat(args.MaxResolution),
                layerparaminfo: args
            });
            args.Map.addLayer(layer);
            if (!dev.IsNull(args.Extent)) args.Map.getView().fit(args.Extent, dev.App.Map.getSize());
        },
        AddTileXYZLayer: function (args) {
            if (!args || !args.Map || !args.Url) return;
            var layer = new dev.layer.Tile({
                id: args.ID,
                tag: args.Tag,
                extent: ol.proj.transformExtent(args.Extent, "EPSG:102100", "EPSG:4326"),
                zIndex: dev.IsNull(args.ZIndex) ? 0 : args.ZIndex,
                opacity: dev.IsNull(args.Opacity) ? 1.0 : args.Opacity,
                visible: dev.IsBoolean(args.Visible) ? args.Visible : true,
                source: new dev.source.XYZ({
                    tilePixelRatio: 1,
                    maxZoom: dev.IsNull(args.MaxZoom) ? 18 : parseInt(args.MaxZoom),
                    minZoom: dev.IsNull(args.MinZoom) ? 0 : parseInt(args.MinZoom),
                    url: args.Url
                })
            });
            args.Map.addLayer(layer);
        },
        AddTileXYZLayer2: function (args) {
            if (!args || !args.Map || !args.Url) return;
            var tileSize = 256;
            var resolutions = new Array(dev.IsNull(args.MaxZoom) ? 22 : parseInt(args.MaxZoom));
            for (var i = 0, ii = resolutions.length; i < ii; ++i) {
                resolutions[i] = 180 / Math.pow(2, i) / tileSize;
            }
            var layer = new dev.layer.Tile({
                id: args.ID,
                tag: args.Tag,
                zIndex: dev.IsNull(args.ZIndex) ? 0 : args.ZIndex,
                opacity: dev.IsNull(args.Opacity) ? 1.0 : args.Opacity,
                visible: dev.IsBoolean(args.Visible) ? args.Visible : true,
                source: new dev.source.XYZ({
                    tileSize: tileSize,
                    tileUrlFunction: function (tileCoord, s, e) {
                        var z = tileCoord[0];
                        var x = tileCoord[1];
                        var y = tileCoord[2];
                        var re = new RegExp('\\{z\\}', 'gm');
                        var re1 = new RegExp('\\{x\\}', 'gm');
                        var re2 = new RegExp('\\{y\\}', 'gm');
                        var str = args.Url.replace(re, z);
                        str = str.replace(re1, x);
                        str = str.replace(re2, y);
                        return str;
                    },
                    projection: 'EPSG:4326',
                    tileGrid: new dev.tilegrid.TileGrid({
                        resolutions: resolutions,
                        tileSize: tileSize,
                        origin: [-180, -90]
                    })
                }),
                layerparaminfo: args
            });
            args.Map.addLayer(layer);
        },//4326坐标系加载google影像
        AddTileXYZLayer3: function (args) {
            if (!args || !args.Map || !args.Url) return;
            var tileSize = 256;
            var resolutions = new Array(dev.IsNull(args.MaxZoom) ? 20 : parseInt(args.MaxZoom));
            var epsg = args.Map.getView().getProjection();
            if (epsg == dev.proj.get("EPSG:4326")) resolutions[0] = parseFloat(dev.App.Config.SystemMap.LevelInfo.Levels[0].Resolution);
            else resolutions[0] = parseFloat(dev.App.Config.SystemMap.LevelInfo.Levels[0].Resolution3857);
            for (var i = 1; i < resolutions.length; i++) resolutions[i] = resolutions[i - 1] / 2;
            var layer = new dev.layer.Tile({
                id: args.ID,
                tag: args.Tag,
                zIndex: dev.IsNull(args.ZIndex) ? 0 : args.ZIndex,
                opacity: dev.IsNull(args.Opacity) ? 1.0 : args.Opacity,
                visible: dev.IsBoolean(args.Visible) ? args.Visible : true,
                source: new dev.source.XYZ({
                    tileSize: [256, 256],
                    url: args.Url3857,
                    projection: 'EPSG:3857',
                    tileGrid: new ol.tilegrid.TileGrid({
                        resolutions: resolutions,
                        tileSize: [256, 256],
                        origin: [-20037508.3427892, 20037507.0671618],
                    })
                }),
                layerparaminfo: args
            });
            args.Map.addLayer(layer);
        },//3857坐标系下加载google影像
        AddWMTSLayer: function (args) {
            if (!args || !args.Map || !args.Url || !args.Layers || !args.Level) return;
            args.EPSG = dev.IsNull(args.EPSG) ? args.Map.getView().getProjection().getCode() : args.EPSG;
            args.Level = parseInt(args.Level);
            if (!dev.IsNull(args.Extent)) {
                var mapproj = dev.App.Map.getView().getProjection();
                if (dev.App.Config.SystemMap.DataEPSG != mapproj.getCode()) args.Extent = dev.proj.transformExtent(args.Extent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
            }
            var projection = dev.proj.get(args.EPSG);
            var projectionExtent = projection.getExtent();
            var size = dev.extent.getWidth(projectionExtent) / 256;
            var resolutions = [];
            if (projection.getCode() == "EPSG:4326") resolutions.push(parseFloat(dev.App.Config.SystemMap.LevelInfo.Levels[0].Resolution));
            if (projection.getCode() == "EPSG:3857") resolutions.push(parseFloat(dev.App.Config.SystemMap.LevelInfo.Levels[0].Resolution3857));
            for (var z = 0; z < args.Level ; z++) resolutions.push(resolutions[z] / 2);
            var matrixIds = new Array(args.Level);
            for (var z = 0; z < args.Level; z++) { matrixIds[z] = args.EPSG + ":" + z; }
            if (dev.IsNull(args.Type)) args.Type = dev.LayerType.Tile;
            var layer = new dev.layer.Tile({
                id: args.ID,
                opacity: dev.IsNull(args.Opacity) ? 1.0 : args.Opacity,
                zIndex: dev.IsNull(args.ZIndex) ? 0 : args.ZIndex,
                extent: args.Extent,
                visible: dev.IsBoolean(args.Visible) ? args.Visible : true,
                source: new dev.source.WMTS({
                    url: args.Url,
                    layer: args.Layers,
                    matrixSet: args.EPSG,
                    format: 'image/png',
                    projection: projection,
                    tileGrid: new ol.tilegrid.WMTS({
                        origin: ol.extent.getTopLeft(projectionExtent),
                        resolutions: resolutions,
                        matrixIds: matrixIds
                    }),
                    style: dev.IsNull(args.Style) ? '' : args.Style,
                    wrapX: false
                }),
                layerparaminfo: args,
                minResolution: dev.IsNull(args.MinResolution) ? resolutions[resolutions.length - 1] : parseFloat(args.MinResolution),
                maxResolution: dev.IsNull(args.MaxResolution) ? resolutions[0] : parseFloat(args.MaxResolution)
            });
            args.Map.addLayer(layer);
            if (!dev.IsNull(args.Extent)) args.Map.getView().fit(args.Extent, dev.App.Map.getSize());
        },//加载WMTS图层（包含4326和3857坐标系）
        AddWMTSRasterLayer: function (args) {
            if (!args || !args.Map || !args.Url || !args.Resolution || !args.Layers || !args.MinLevel || !args.MaxLevel) return;
            args.EPSG = dev.IsNull(args.EPSG) ? "EPSG:4326" : args.EPSG;
            var projection = dev.proj.get(args.EPSG);
            if (dev.IsNull(args.Extent)) {
                var mapproj = param.Map.getView().getProjection();
                if (dev.App.Config.SystemMap.DataEPSG != mapproj.getCode()) args.Extent = dev.proj.transformExtent(args.Extent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
            }
            //projection.setExtent([-180, -85.05112877980659, 180, 85.05112877980659]);
            var projectionExtent = projection.getExtent();
            var size = dev.extent.getWidth(projectionExtent) / 256;
            var resolutions = [parseFloat(args.Resolution)];
            args.MaxLevel = parseInt(args.MaxLevel);
            args.MinLevel = parseInt(args.MinLevel);
            var value = args.MaxLevel - args.MinLevel + 1;
            for (var z = 0; z <= value - 2; z++) resolutions.push(resolutions[z] / 2);
            var matrixIds = [];
            for (var z = args.MinLevel; z <= args.MaxLevel; z++) { matrixIds.push(z); }
            var layer = new dev.layer.Tile({
                id: args.ID,
                opacity: dev.IsNull(args.Opacity) ? 1.0 : args.Opacity,
                zIndex: dev.IsNull(args.ZIndex) ? 0 : args.ZIndex,
                extent: args.Extent,
                visible: dev.IsBoolean(args.Visible) ? args.Visible : true,
                source: new dev.source.WMTS({
                    url: args.Url,
                    layer: args.Layers,
                    projection: projection,
                    tileGrid: new ol.tilegrid.WMTS({
                        origin: ol.extent.getTopLeft(projectionExtent),
                        resolutions: resolutions,
                        matrixIds: matrixIds
                    }),
                    tileLoadFunction: function (s, e) {
                        var params = dev.GetRequestParams(e);
                        var src = params.BaseUri + "?method=getTile";
                        src += "&style=" + params.style + "&imgid=" + params.layer + "&level=" + params.TileMatrix + "&row=" + params.TileRow + "&col=" + params.TileCol;
                        s.getImage().src = src;
                    },
                    style: dev.IsNull(args.Style) ? 'default' : args.Style,
                    wrapX: false
                })
            });
            args.Map.addLayer(layer);
            if (!dev.IsNull(args.Extent)) args.Map.getView().fit(args.Extent, dev.App.Map.getSize());
        },
        AddTDTLayer: function (args) {
            if (!args || !args.Map || !args.Url) return;
            var layer = new dev.layer.Tile({
                source: new dev.source.XYZ({
                    url: args.Url
                }), opacity: 1.0
            });
            args.Map.addLayer(layer);
            var coor = dev.proj.transform([116.40969, 39.89945], 'EPSG:4326', 'EPSG:3857');
            var view = new dev.View({
                center: coor,
                zoom: 13
            });
            args.Map.setView(view);
        },
        AddVectorLayer: function (args) {
            if (!args || !args.Map) return;
            var source = {};
            var style;
            if (!dev.IsNull(args.Style)) style = args.Style;
            else style = new dev.style.Style({
                stroke: new dev.style.Stroke({ width: 1, color: 'rgba(237, 117, 65, 1)' }),
                fill: new dev.style.Fill({ color: [236, 179, 73, 0.2] }),
                image: new dev.style.Circle({
                    radius: 3,
                    fill: new dev.style.Fill({
                        color: [236, 179, 73, 0.5]
                    }),
                    stroke: new dev.style.Stroke({
                        color: [236, 179, 73, 1],
                        width: 1
                    })
                }),
                zIndex: Infinity
            });
            if (!dev.IsNull(args.url)) source.url = args.Url;
            if (!dev.IsNull(args.Features)) source.features = args.Features;
            var layer = new dev.layer.Vector({
                id: args.ID,
                opacity: 1.0,
                zIndex: dev.IsNull(args.ZIndex) ? 9999 : parseFloat(args.ZIndex),
                type: dev.IsNull(args.LayerInfo) ? "vector" : args.LayerInfo.Type,
                extent: args.Extent,
                visible: dev.IsBoolean(args.Visible) ? true : args.Visible,
                source: new dev.source.Vector(source),
                style: style
            });
            args.Map.addLayer(layer);
        },
        AddWMTSLayerFromCapabilities: function (args) {
            if (dev.IsNull(args) || dev.IsNull(args.url) || dev.IsNull(args.layer)) return;
            var option = null;
            var config = { layer: args.layer };
            if (!dev.IsNull(args.matriSet)) config.matriSet = args.matriSet;
            if (!dev.IsNull(args.projection)) config.projection = args.projection;
            if (!dev.IsNull(args.requestEncoding)) config.requestEncoding = args.requestEncoding;
            if (!dev.IsNull(args.style)) config.style = args.style;
            if (!dev.IsNull(args.format)) config.format = args.format;
            dev.Project.DefinedProject(args.EPSG.split(":")[1]);
            $.ajax({
                url: args.url + "?Request=GetCapabilities&t=" + new Date().getTime(),
                dataType: 'text',
                type: 'GET',
                timeout: 2000,
                async: false,
                cache: false,
                success: function (xml) {
                    var result = new dev.format.WMTSCapabilities().read(xml);
                    option = dev.source.WMTS.optionsFromCapabilities(result, config);
                    option.wrapX = false;
                    var layer = new dev.layer.Tile({
                        id: args.id,
                        opacity: 1.0,
                        zIndex: dev.IsNull(args.zIndex) ? 0 : args.zIndex,
                        source: new dev.source.WMTS(option)
                    });
                    dev.App.Map.addLayer(layer);
                    if (dev.App.MapEPSG !== option.projection.getCode()) {
                        var unit = dev.Project.GetUnitByEPSG(option.projection.getCode().split(":")[1]);
                        var projection = new dev.proj.Projection({
                            code: option.projection.getCode(),
                            units: unit,
                            axisOrientation: 'neu'
                        });
                        dev.App.Map.setView(new dev.View({
                            projection: projection,
                            units: unit,
                            axisOrientation: 'neu'
                        }));
                    }
                    dev.App.Map.getView().fit(args.extent, dev.App.Map.getSize());
                },
                error: function () {
                    var a = 1;
                }
            });
        },
        InitMap: function (config) {
            if (dev.IsNull(config) || dev.IsNull(config.Map)
                || dev.IsNull(config.LayerInfo) || dev.IsNull(config.LayerInfo.BaseLayers)) return;
            var baseLayers = config.LayerInfo.BaseLayers;
            if (baseLayers.length == undefined) baseLayers = [config.LayerInfo.BaseLayers];
            else baseLayers = dev.OrderBy(config.LayerInfo.BaseLayers, "Order", dev.OrderWay.ASC, true);
            for (var i = 0; i < baseLayers.length; i++) {
                var param = { Map: config.Map, ID: baseLayers[i].Name, LayerInfo: baseLayers[i] };
                if (dev.IsNull(baseLayers[i].Visible)) param.Visible = false;
                else if (dev.IsBoolean(baseLayers[i].Visible)) param.Visible = baseLayers[i].Visible;
                else param.Visible = baseLayers[i].Visible.toLowerCase() == "true" ? true : false;
                switch (baseLayers[i].Type) {
                    case dev.LayerType.Mapping:
                        param.Url = baseLayers[i].Url;
                        if (!dev.IsNull(baseLayers[i].Envelop)) {
                            var arr = baseLayers[i].Envelop.split(',');
                            param.Extent = [parseFloat(arr[0]), parseFloat(arr[1]), parseFloat(arr[2]), parseFloat(arr[3])];
                        }
                        //   dev.MapLoad.AddArcGISLayer(param);
                        break;
                    case dev.LayerType.Tile:
                        param.Url = baseLayers[i].Url;
                        if (!dev.IsNull(baseLayers[i].ZIndex)) param.ZIndex = parseInt(baseLayers[i].ZIndex);
                        param.Layers = baseLayers[i].Layers;
                        if (!dev.IsNull(baseLayers[i].Envelop)) {
                            var arr = baseLayers[i].Envelop.split(',');
                            param.Extent = [parseFloat(arr[0]), parseFloat(arr[1]), parseFloat(arr[2]), parseFloat(arr[3])];
                        }
                        $.extend(baseLayers[i], param);
                        dev.MapLoad.AddWMTSLayer(baseLayers[i]);
                        break;
                    case dev.LayerType.WMS:
                        param.Url = baseLayers[i].Url;
                        param.Layers = baseLayers[i].Layers;
                        if (!dev.IsNull(baseLayers[1].ServerType)) param.ServerType = baseLayers[1].ServerType;
                        if (!dev.IsNull(baseLayers[i].Envelop)) {
                            var arr = baseLayers[i].Envelop.split(',');
                            param.Extent = [parseFloat(arr[0]), parseFloat(arr[1]), parseFloat(arr[2]), parseFloat(arr[3])];
                        }
                        $.extend(baseLayers[i], param);
                        dev.MapLoad.AddWMSLayer(baseLayers[i]);
                        break;
                    case dev.LayerType.TileWMS:
                        param.Url = baseLayers[i].Url;
                        param.Layers = baseLayers[i].Layers;
                        if (!dev.IsNull(baseLayers[1].ServerType)) param.ServerType = baseLayers[1].ServerType;
                        if (!dev.IsNull(baseLayers[i].Envelop)) {
                            var arr = baseLayers[i].Envelop.split(',');
                            param.Extent = [parseFloat(arr[0]), parseFloat(arr[1]), parseFloat(arr[2]), parseFloat(arr[3])];
                        }
                        $.extend(baseLayers[i], param);
                        // dev.MapLoad.AddTileWMSLayer(baseLayers[i]);
                        break;
                    case dev.LayerType.RasteWMTS:
                        param.Url = baseLayers[i].Url;
                        param.Layers = baseLayers[i].Layers;
                        if (!dev.IsNull(baseLayers[1].ServerType)) param.ServerType = baseLayers[1].ServerType;
                        if (!dev.IsNull(baseLayers[i].Envelop)) {
                            var arr = baseLayers[i].Envelop.split(',');
                            param.Extent = [parseFloat(arr[0]), parseFloat(arr[1]), parseFloat(arr[2]), parseFloat(arr[3])];
                        }
                        $.extend(baseLayers[i], param);
                        dev.MapLoad.AddWMTSRasterLayer(baseLayers[i]);
                        break;
                    case dev.LayerType.TileXYZ:
                        param.Url = baseLayers[i].Url;
                        if (!dev.IsNull(baseLayers[i].Envelop)) {
                            var arr = baseLayers[i].Envelop.split(',');
                            param.Extent = [parseFloat(arr[0]), parseFloat(arr[1]), parseFloat(arr[2]), parseFloat(arr[3])];
                        }
                        $.extend(baseLayers[i], param);
                        if (baseLayers[i].Map.getView().getProjection() == dev.proj.get("EPSG:4326")) dev.MapLoad.AddTileXYZLayer2(baseLayers[i]);
                        else dev.MapLoad.AddTileXYZLayer3(baseLayers[i]);
                        break;
                    case dev.LayerType.TempVector:
                        param.Url = baseLayers[i].Url;
                        if (!dev.IsNull(baseLayers[i].ZIndex)) param.ZIndex = baseLayers[i].ZIndex;
                        if (!dev.IsNull(baseLayers[i].Envelop)) {
                            var arr = baseLayers[i].Envelop.split(',');
                            param.Extent = [parseFloat(arr[0]), parseFloat(arr[1]), parseFloat(arr[2]), parseFloat(arr[3])];
                        }
                        param.Style = new dev.style.Style({
                            stroke: new dev.style.Stroke({ width: 2, color: 'rgba(237, 117, 65, 1)' }),
                            fill: new dev.style.Fill({ color: [236, 179, 73, 0.2] }),
                            image: new dev.style.Circle({
                                radius: 3,
                                stroke: new dev.style.Stroke({
                                    width: 2,
                                    color: 'rgba(237, 117, 65, 1)'
                                }),
                                fill: new dev.style.Fill({
                                    color: 'rgba(255, 255, 255, 0.6)'
                                })
                            })
                        });
                        dev.MapLoad.AddVectorLayer(param);
                        break;
                }
            }


            //var vec = {
            //    Map: dev.App.Map,
            //    Url: "http://t2.tianditu.com/DataServer?T=vec_w&x={x}&y={y}&l={z}"
            //};
            //var cva = {
            //    Map: dev.App.Map,
            //    Url: "http://t2.tianditu.com/DataServer?T=cva_w&x={x}&y={y}&l={z}"
            //};
            //dev.MapLoad.AddTDTLayer(vec);
            //dev.MapLoad.AddTDTLayer(cva);

            //var url = 'http://192.168.1.3:6080/arcgis/rest/services/DLG2000SL/MapServer';
            //var param = { Map: dev.App.Map, Url: url, Exent: [-180, -90, 180, 90] };
            //dev.MapLoad.AddArcGISLayer(param);

            //var url = 'http://192.168.1.3:6080/arcgis/rest/services/DLG2000ZJ/MapServer';
            //var param = { Map: dev.App.Map, Url: url, Exent: [-180, -90, 180, 90] };
            //dev.MapLoad.AddArcGISLayer(param);

            //var url = 'http://192.168.2.171:8081/geoserver/tiger/wms';
            //var param = { Map: config.Map, Url: url, Layers: 'tiger:poly_landmarks' };
            //dev.MapLoad.AddWMSLayer(param);
        }
    };

    /* 描述：MapUtils(GIS常用函数库)
     * 日期：2015-11-16*/
    dev.MapUtils = {
        /**
         * 功能：根据范围获取比例尺
         * 参数：map：地图，extent：地图范围
         * 返回值：比例尺（number）
         */
        GetResolutionByExtent: function (map, extent) {
            var geoPointLB = [parseFloat(extent[0]), parseFloat(extent[1])];    //左下角点地理坐标
            var geoPointRT = [parseFloat(extent[2]), parseFloat(extent[3])];    //右上角点地理坐标
            var resX = (geoPointRT[0] - geoPointLB[0]) / (map.getViewport().clientWidth);    //分辨率 = 经度差 / x差
            var resY = (geoPointRT[1] - geoPointLB[1]) / (map.getViewport().clientHeight);    //分辨率 = 纬度差 / y差
            return Math.sqrt(Math.pow(resX, 2) + Math.pow(resY, 2));
        },
        /**
         * 功能：根据分辨率获取比例尺
         * 参数：resolution分辨率
         * 返回值：比例尺（number）
         */
        GetScaleByResolution: function (resolution) {
            var scale = 0.0;
            var limit = 111194.872221777;//1度约等于 111194.872221777米
            var foot = 0.0254000508;//1英寸约等于0.0254000508米
            var dpi = 96;
            scale = resolution * limit * dpi / foot;
            return scale;
        },
        /**
         * 功能：根据比例尺获取分辨率
         * 参数：scale比例尺
         * 返回值：分辨率（number）
         */
        GetResolutionByScale: function (scale) {
            var resolution = 0.0;
            var limit = 111194.872221777;//1度约等于 111194.872221777米
            var foot = 0.0254000508;//1英寸约等于0.0254000508米
            var dpi = 96;
            resolution = scale * foot / (limit * dpi);
            return resolution;
        },
        /**
         * 功能：获取最近数据
         * 参数：value:当前值,values:集合数组
         * 返回值：分辨率（number）
         */
        GetNearValue: function (value, values) {
            if (!values || values.length == 0) return 0;
            var temp = [];
            for (var i = 0; i < values.length; i++) {
                temp.push(Math.abs(values[i] - value));
            }
            var index = temp.indexOf(Math.min.apply(Math, temp));
            return values[index];
        },
        /**
         * 功能：比较范围
         * 参数：extent1:大范围,extent2:小范围
         * 返回值：是否在范围内（Boolean）
         */
        Contain: function (extent1, extent2) {
            return dev.extent.containsExtent(extent1, extent2);
        },
        GetDpi: function () {
            var sp = new dev.Sphere(6378137);
            var size = dev.App.Map.getSize();
            var map = dev.App.Map.getView().calculateExtent(size);
            var distance = sp.haversineDistance([120.21592590991689, 30.210793016606], [120.21670777384473, 30.211168525868086]);
            var screenDistance = Math.pow(size[0], 2) + Math.pow(size[1], 2);
            return distance / screenDistance;
        },
        GetBufferGeometry: function (geometry, radius) {
            var parser = new jsts.io.OL3Parser();
            var jstsGeom = parser.read(geometry);
            var feature = new dev.Feature();
            feature.setGeometry(parser.write(jstsGeom.buffer(radius)));
            return feature;
        },
        /**
         * 功能：获取范围
         * 参数：features:要素集合
         * 返回值：范围（dev.Extent）
         */
        GetExtent: function (features) {
            if (!features || features.length == 0) return null;
            var extent = [0, 0, 0, 0];
            for (var i = 0; i < features.length; i++) {
                var ext = features[i].getGeometry().getExtent();
                if (ext[0] < extent[0]) extent[0] = ext[0];
                if (ext[1] < extent[1]) extent[1] = ext[1];
                if (ext[2] > extent[2]) extent[2] = ext[2];
                if (ext[3] > extent[3]) extent[3] = ext[3];
            }
            return extent;
        },

        Rad: function (d) {
            return d * Math.PI / 180.0;
        },
        /**
         * 功能：根据两点经纬度坐标获取长度（地理坐标系）
         * 参数：lat1:经度1,lng1:纬度1,lat2:经度2,lng2:纬度2
         * 返回值：距离（number）
         */
        GetDistanceByGeo: function (lat1, lng1, lat2, lng2) {
            var radLat1 = this.Rad(lat1);
            var radLat2 = this.Rad(lat2);
            var a = radLat1 - radLat2;
            var b = this.Rad(lng1) - this.Rad(lng2);
            var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) +
            Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(b / 2), 2)));
            s = s * 6378137.0;
            s = Math.round(s * 10000) / 10000;
            return s;
        },
        /**
         * 功能：根据两点经纬度坐标获取长度（平面坐标系）
         * 参数：lat1:经度1,lng1:纬度1,lat2:经度2,lng2:纬度2
         * 返回值：距离（number）
         */
        GetDistanceByPro: function (lat1, lng1, lat2, lng2) {
            //return Math.round(((Math.sqrt((lat1 - lat2) * (lat1 - lat2) + (lng1 - lng2) * (lng1 - lng2))) / 1000), 5);
            return Math.round((Math.sqrt((lat1 - lat2) * (lat1 - lat2) + (lng1 - lng2) * (lng1 - lng2))), 5);
        },
        /**
        * 功能：获取临时图层
        * 参数：tmpLayerID：图层编号
        * 返回值：临时图层
        */
        GetTempLayer: function (tmpLayerID, map) {
            if (dev.IsNull(tmpLayerID)) tmpLayerID = "tempGraphicLayer";
            if (dev.IsNull(map)) map = dev.App.Map;
            var layers = map.getLayers();
            var tmpLayer = null;
            layers.forEach(function (o, i) {
                if ((o.getProperties().type !== undefined) && o.getProperties().type.toLowerCase() === "tempvector"
                    && o.getProperties().id === tmpLayerID) tmpLayer = o;
            });
            return tmpLayer;
        },
        /**
         * 功能：向临时图层添加单个元素
         * 参数：feature：元素，tmpLayerID：图层编号
         * 返回值：null
         */
        AddFeature: function (feature, tmpLayerID, map, isconvert) {
            if (dev.IsNull(map)) map = dev.App.Map;
            if (dev.IsNull(isconvert)) isconvert = true;
            var mapproj = map.getView().getProjection();
            if (isconvert && mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
                feature = this.TransformFeatureCRS(feature, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
            }
            var tmpLayer = dev.MapUtils.GetTempLayer(tmpLayerID, map);
            var features = tmpLayer.getSource();
            var featureid = feature.getId();
            var tmpFeature = null;
            if (!dev.IsNull(featureid)) tmpFeature = features.getFeatureById(featureid);
            if (dev.IsNull(tmpFeature)) features.addFeature(feature);
            return tmpFeature;
        },
        TransformFeatureCRS: function (feature, crs, targetcrs) {
            if (dev.IsNull(feature) || dev.IsNull(crs) || dev.IsNull(targetcrs)) return null;
            var geom = feature.getGeometry().transform(crs, targetcrs);
            feature.setGeometry(geom);
            return feature;
        },
        /*** 功能：向临时图层添加多个元素
         * 参数：features：元素集合，tmpLayerID：图层编号
         * 返回值：null*/
        AddFeatures: function (features, tmpLayerID, style, map, isconvert) {
            if (dev.IsNull(map)) map = dev.App.Map;
            if (dev.IsNull(isconvert)) isconvert = true;
            var mapproj = map.getView().getProjection();
            if (isconvert && mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
                //feature进行转换
                for (var i = 0; i < features.length; i++) {
                    var new_feature = this.TransformFeatureCRS(features[i], dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
                    if (!dev.IsNull(new_feature)) features[i] = new_feature;
                }
            }
            var tmpLayer = dev.MapUtils.GetTempLayer(tmpLayerID, map);
            if (!dev.IsNull(style)) tmpLayer.setStyle();
            var tmpfeatures = tmpLayer.getSource();
            tmpfeatures.addFeatures(features);
        },
        ClearAndAddFeatures: function (features, tmpLayerID, style, map, isconvert) {
            if (dev.IsNull(features) || dev.IsNull(tmpLayerID)) return;
            if (dev.IsNull(isconvert)) isconvert = true;
            if (dev.IsNull(map)) map = dev.App.Map;
            var tmpLayer = dev.MapUtils.GetTempLayer(tmpLayerID, map);
            var tmpfeatures = tmpLayer.getSource();
            tmpfeatures.clear();
            if (!dev.IsNull(style)) tmpLayer.setStyle(style);
            var mapproj = map.getView().getProjection();
            if (isconvert && mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
                //feature进行转换
                for (var i = 0; i < features.length; i++) {
                    var new_feature = this.TransformFeatureCRS(features[i], dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
                    if (!dev.IsNull(new_feature)) features[i] = new_feature;
                }
            }
            tmpfeatures.addFeatures(features);
            // map.getView().fit(tmpfeatures.getExtent(), map.getSize());
        },
        /*** 功能：向临时图层移除单个元素
         * 参数：feature：元素，tmpLayerID：图层编号
         * 返回值：null */
        RemoveFeature: function (feature, tmpLayerID, map) {
            if (dev.IsNull(feature)) return;
            if (dev.IsNull(map)) map = dev.App.Map;
            var tmpLayer = dev.MapUtils.GetTempLayer(tmpLayerID, map);
            var features = tmpLayer.getSource();
            var tmpFeature = dev.MapUtils.GetFeatureByID(feature.getProperties().id, tmpLayerID, map);//增加map参数 wlf 2017年2月8日14:59:04
            if (!dev.IsNull(tmpFeature)) features.removeFeature(feature);
        },
        GetFeatureByID: function (id, tmpLayerID, map) {
            if (dev.IsNull(map)) map = dev.App.Map;
            var feature = null;
            var tmpLayer = dev.MapUtils.GetTempLayer(tmpLayerID, map);
            var features = tmpLayer.getSource();
            var source = features.getFeatures();
            for (var i = 0; i < source.length; i++) {
                if (source[i].getProperties().id === id || source[i].getId() === id) {
                    feature = source[i]; break;
                }
            }
            return feature;
        },
        RemoveFeatureLikeID: function (likeid, tmpLayerID, map) {
            if (dev.IsNull(likeid)) return;
            if (dev.IsNull(map)) map = dev.App.Map;
            var tmpLayer = dev.MapUtils.GetTempLayer(tmpLayerID, map);
            var features = tmpLayer.getSource();
            var source = features.getFeatures();
            var cf = [];
            for (var i = 0; i < source.length; i++) {
                if (dev.IsNull(source[i].getId())) continue;
                if (source[i].getId().toString().indexOf(likeid) >= 0) cf.push(source[i]);
            }
            for (var i = 0; i < cf.length; i++) features.removeFeature(cf[i]);
        },
        /*** 功能：清除临时图层所有元素
         * 参数：tmpLayerID：图层编号
         * 返回值：null*/
        ClearFeature: function (tmpLayerID, map) {
            if (dev.IsNull(map)) map = dev.App.Map;
            var tmpLayer = dev.MapUtils.GetTempLayer(tmpLayerID, map);
            if (dev.IsNull(tmpLayer)) return;
            var features = tmpLayer.getSource();
            features.clear();
        },
        GetLayer: function (layerID, map) {
            if (dev.IsNull(map)) map = dev.App.Map;
            var layers = map.getLayers();
            var layer = null;
            layers.forEach(function (o, i) {
                if (o.getProperties().id === layerID) layer = o;
            });
            return layer;
        },
        GetCurrentLayer: function (id, map) {//获取当前图层
            if (dev.IsNull(map)) map = dev.App.Map;
            var layers = map.getLayers().getArray();
            var layer = null;
            for (var i = 0; i < layers.length; i++) {
                if (layers[i].getProperties().id === id) {
                    layer = layers[i];
                    break;
                }
            }
            return layer;
        },
        RemoveLayer: function (id, map) { //移除图层
            if (dev.IsNull(map)) map = dev.App.Map;
            var layers = map.getLayers();
            layers.forEach(function (sublayer, i) {
                if (sublayer.getProperties().id === id) layers.removeAt(i);
            });
        },
        SetLayerVisible: function (id, visible, map) {//设置图层是否可见
            if (dev.IsNull(map)) map = dev.App.Map;
            var layers = map.getLayers();
            layers.forEach(function (sublayer, i) {
                if (sublayer.getProperties().id === id)
                    sublayer.setVisible(visible);
            });
        },
        LoadSLD: function (url) {
            var strXml = null;
            $.ajax({
                url: url,
                dataType: 'text',
                type: 'GET',
                timeout: 2000,
                async: false,
                error: function (xml) {
                    alert("加载XML文件出错！");
                },
                success: function (xml) {
                    strXml = xml.replace(/\r\n\s*/g, "");
                }
            });
            return strXml;
        },
        UpdateStyle: function (map, layerID, style, cqlfilter, filter) {
            if (dev.IsNull(map)) return;
            var layer = dev.MapUtils.GetLayer(layerID, map);
            var osource = layer.getSource();
            var param = osource.getParams();
            if (!dev.IsNull(style)) {
                delete layerParam.SLD_BODY;
                param.STYLES = style;
            }
            if (!dev.IsNull(cqlfilter)) param.CQL_FILTER = encodeURI(cqlfilter);
            if (!dev.IsNull(filter)) param.FILTER = filter;
            osource.updateParams(param);
        },
        UpdateSldbody: function (map, layerID, sldbody, sldsrc, cqlfilter, filter) {
            var layer = dev.MapUtils.GetLayer(layerID, map);
            var osource = layers.getSource();
            var param = osource.getParams();
            if (!dev.IsNull(sldbody)) {
                param.SLD_BODY = args.Sldbody
                param.STYLES = '';
            }
            else if (!dev.IsNull(sldsrc)) {
                param.SLD_BODY = dev.MapUtils.LoadSLD(sldsrc);
                param.STYLES = '';
            }
            if (!dev.IsNull(cqlfilter)) param.CQL_FILTER = encodeURI(cqlfilter);
            if (!dev.IsNull(filter)) param.FILTER = filter;
            osource.updateParams(param);
        },
        GetMaxZIndex: function (map) {
            var layers = map.getLayers();
        },
        PointSymbolStyle: function (feature, radius, strRGBA, map) {
            if (dev.IsNull(map)) map = dev.App.Map;
            var mapproj = map.getView().getProjection();
            var new_feature = feature.clone();
            if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
                new_feature = this.TransformFeatureCRS(new_feature, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
            }
            function animate(event) {
                // dev.App._is2dmove = true;
                var vectorContext = event.vectorContext;
                var frameState = event.frameState;
                var flashGeom = new_feature.getGeometry().clone();
                if (radius > 20) radius = 1;
                var style = new dev.style.Style({
                    image: new dev.style.Circle({
                        radius: radius,
                        snapToPixel: false,
                        stroke: new dev.style.Stroke({
                            color: dev.IsNull(strRGBA) ? 'rgba(255, 0, 0, 1)' : strRGBA,
                            width: 2
                        })
                    })
                });
                vectorContext.setStyle(style);
                vectorContext.drawGeometry(flashGeom);
                radius++;
                setTimeout(function () { map.render(); }, (radius < 10 ? 60 : 160));
                //map.render();
            }
            var listenerKey = map.on('postcompose', animate);
            return listenerKey;
        },//点渲染样式
        PointSymbolStyle1: function (feature, radius, borderrgba, fillrgba, maxradius, map, isconver) {
            if (dev.IsNull(map)) map = dev.App.Map;
            if (dev.IsNull(maxradius)) maxradius = 30;
            if (dev.IsNull(isconver)) isconver = true;
            function animate(event) {
                var c_f = feature.clone();
                c_f.setId("pointkyef" + feature.getId());
                if (radius > maxradius) radius = 1;
                var style = new dev.style.Style({
                    image: new dev.style.Circle({
                        radius: radius,
                        snapToPixel: true,
                        stroke: new dev.style.Stroke({
                            color: dev.IsNull(borderrgba) ? 'rgba(255, 0, 0, 1)' : borderrgba,
                            width: 1
                        }),
                        fill: new dev.style.Fill({ color: dev.IsNull(fillrgba) ? 'rgba(255, 0, 0, 0.4)' : fillrgba }),
                    }),
                });
                c_f.setStyle(style);
                //查找对应的pointkey
                var old_f = dev.MapUtils.GetFeatureByID("pointkyef" + feature.getId(), "HightLightLayer", map);
                if (!dev.IsNull(old_f)) dev.MapUtils.RemoveFeature(old_f, "HightLightLayer", map);
                c_f.set("listenerkey", listenerKey);
                dev.MapUtils.AddFeature(c_f, "HightLightLayer", map, isconver);
                radius++;
                map.render();
            }
            var listenerKey = map.on('postcompose', animate);
            map.render();
            return listenerKey;
        },//带背景点渲染
        removePointKey: function (id, map) {
            if (dev.IsNull(id)) return;
            if (dev.IsNull(map)) map = dev.App.Map;
            var clear_feature = dev.MapUtils.GetFeatureByID("pointkyef" + id, "HightLightLayer", map);
            //if (dev.IsNull(clear_feature)) return;
            var listenkey = clear_feature.get("listenerkey");
            if (!dev.IsNull(listenkey)) { map.unByKey(listenkey); listenkey = null; }
            if (!dev.IsNull(clear_feature)) dev.MapUtils.RemoveFeature(clear_feature, "HightLightLayer", map);
        },
        LineSymbolStyle: function (feature, map, colors, isconvert) {
            if (dev.IsNull(map)) map = dev.App.Map;
            if (dev.IsNull(isconvert)) isconvert = true;
            var mapproj = map.getView().getProjection();
            var fillcolors = ["rgba(255,0,0,0.3)", "rgba(255,255,0,0.3)"];
            if (dev.IsNull(colors)) colors = ['red', 'yellow'];
            var lineColorIndex = 0, currentColor, a = 0;
            function animate(event) {
                var new_feature = feature.clone();
                if (!dev.IsNull(lineColorIndex) && lineColorIndex === currentColor) {
                    if (a === 20) { a = 0; lineColorIndex = lineColorIndex === 0 ? 1 : 0; }
                    else lineColorIndex = currentColor;
                }
                var style = new dev.style.Style({
                    stroke: new dev.style.Stroke({ width: 1, color: colors[lineColorIndex] }),
                    //fill: new dev.style.Fill({ color: fillcolors[lineColorIndex] })
                });
                new_feature.setStyle(style);
                new_feature.setId("pointkyef" + feature.getId());
                currentColor = lineColorIndex;
                var old_f = dev.MapUtils.GetFeatureByID("pointkyef" + feature.getId(), "HightLightLayer", map);
                if (!dev.IsNull(old_f)) dev.MapUtils.RemoveFeature(old_f, "HightLightLayer", map);
                new_feature.set("listenerkey", listenerKey);
                dev.MapUtils.AddFeature(new_feature, "HightLightLayer", map, isconvert);
                a++;
                map.render();
            }
            map.render();
            var listenerKey = map.on('postcompose', animate);
            return listenerKey;
        },
        LineSymbolStyle1: function (feature, map, colors, isconvert) {
            if (dev.IsNull(map)) map = dev.App.Map;
            if (dev.IsNull(isconvert)) isconvert = true;
            var mapproj = map.getView().getProjection();
            var new_feature = feature.clone();
            if (isconvert && mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
                new_feature = this.TransformFeatureCRS(new_feature, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
            }
            var fillcolors = ["rgba(255,0,0,0.3)", "rgba(255,255,0,0.3)"];
            if (dev.IsNull(colors)) colors = ['red', 'yellow'];
            var lineColorIndex = 0, currentColor, a = 0;
            function animate(event) {
                var vectorContext = event.vectorContext;
                var frameState = event.frameState;
                var flashGeom = new_feature.getGeometry().clone();
                if (!dev.IsNull(lineColorIndex) && lineColorIndex === currentColor) {
                    if (a === 20) { a = 0; lineColorIndex = lineColorIndex === 0 ? 1 : 0; }
                    else lineColorIndex = currentColor;
                }
                var style = new dev.style.Style({
                    stroke: new dev.style.Stroke({ width: 1, color: colors[lineColorIndex] }),
                    //fill: new dev.style.Fill({ color: fillcolors[lineColorIndex] })
                });
                vectorContext.setStyle(style);
                vectorContext.drawGeometry(flashGeom);
                currentColor = lineColorIndex;

                a++;
                map.render();
            }
            map.render();
            var listenerKey = map.on('postcompose', animate);
            return listenerKey;
        },//线渲染样式
        GetExtentByMapClick: function (point, map, px, isconvert) {
            if (dev.IsNull(point)) return;
            if (dev.IsNull(map)) map = dev.App.Map;
            if (dev.IsNull(isconvert)) isconvert = true;
            var clientSize = map.getSize();
            if (dev.IsNull(px) || !dev.IsNumber(px)) px = 2;
            var extent = map.getView().calculateExtent(clientSize);
            var mapproj = map.getView().getProjection();
            if (isconvert && mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
                point = dev.proj.transform(point, mapproj.getCode(), dev.App.Config.SystemMap.DataEPSG);
                extent = dev.proj.transformExtent(extent, mapproj.getCode(), dev.App.Config.SystemMap.DataEPSG);
            }
            var clientWidth = clientSize[0], clientHeight = clientSize[1];
            var latdistance = extent[2] - extent[0], londistance = extent[3] - extent[1];
            var pixwR = (latdistance / clientWidth) * px, pixhR = (londistance / clientHeight) * px;
            var radius = Math.sqrt(Math.pow(pixwR, 2) + Math.pow(pixhR, 2));
            var xMin = point[0] - radius, yMin = point[1] - radius, xMax = point[0] + radius, yMax = point[1] + radius;
            var n_extent = [xMin, yMin, xMax, yMax];
            if (isconvert && mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) n_extent = dev.proj.transformExtent(n_extent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
            return dev.geom.Polygon.fromExtent(n_extent);
        },
        GetCql_INTERSECTS: function (wkt, field) {
            if (dev.IsNull(field)) return "INTERSECTS(the_geom," + wkt + ")";
            else return "INTERSECTS(" + field + "," + wkt + ")";
        },
        GetCql_CONTAINS: function (wkt, field) {
            if (dev.IsNull(field)) field = "the_geom";
            return "CONTAINS(" + field + "," + wkt + ")";
        },
        GetCql_WITHIN: function (wkt) {
            return "WITHIN(the_geom," + wkt + ")";
        },
        GetCql_DWITHIN: function (wkt, distance, unit, field) {
            if (dev.IsNull(unit)) unit = "meters";
            if (dev.IsNull(field)) field = "the_geom";
            return "DWITHIN(" + field + "," + wkt + "," + distance + "," + unit + ")";
        }
    };
    dev.GetFeaturesForArcGIS = function (graphics, type) {
        if (!graphics) return null;
        var features = [];
        for (var i = 0; i < graphics.length; i++) {
            var feature = new dev.Feature();
            var geo = null;
            switch (type) {
                case dev.GeometryType.Point:
                    geo = new dev.geom.Point([graphics[i].geometry.x, graphics[i].geometry.y]);
                    break;
                case dev.GeometryType.Line:
                    if (graphics[i].geometry.paths.length <= 0) continue;
                    if (graphics[i].geometry.paths.length > 1) {
                        geo = new dev.geom.MultiLineString(graphics[i].geometry.paths);
                    }
                    else {
                        var lines = graphics[i].geometry.paths[0];
                        geo = new dev.geom.LineString([lines]);
                    }
                    break;
                case dev.GeometryType.Polygon:
                    if (graphics[i].geometry.rings.length <= 0) continue;
                    if (graphics[i].geometry.rings.length > 1) {
                        geo = new dev.geom.MultiPolygon(graphics[i].geometry.rings);
                    }
                    else {
                        var polygon = graphics[i].geometry.rings[0];
                        geo = new dev.geom.Polygon([polygon]);
                    }
                    break;
            }
            feature.setGeometry(geo);
            feature.Attributes = graphics[i].attributes;
            features.push(feature);
        }
        return features;
    };
    dev.GetFieldTypeForArcGIS = function (type) {
        if (type == "esriFieldTypeSmallInteger" || type == "esriFieldTypeInteger" || type == "esriFieldTypeOID"
            || type == "esriFieldTypeSingle" || type == "esriFieldTypeDouble") return dev.FieldType.Number;
        else if (type == "esriFieldTypeString") return "Text";
        else if (type == "esriFieldTypeDate") return "Date";
        return null;
    };
    dev.GetGeometryTypeForArcGIS = function (type) {
        if (type == "esriGeometryPoint") return dev.GeometryType.Point;
        else if (type == "esriGeometryPolyline") return dev.GeometryType.Line;
        else if (type == "esriGeometryPolygon") return dev.GeometryType.Polygon;
        return null;
    };
    dev.GetProjectionForArcGIS = function (spatialReference) {
        if (!spatialReference) return null;
        return new dev.proj.Projection({
            code: "EPSG:" + spatialReference.wkid + ""
        });
    };
    //获取范围
    dev.getExtentByFeatures = function (features) {
        if (dev.IsNull(features) || features.length == 0) return;
        var currextent = features[0].getGeometry().getExtent();
        var minX = currextent[0];
        var minY = currextent[1];
        var maxX = currextent[2];
        var maxY = currextent[3];
        for (var i = 1; i < features.length; i++) {
            var newextent = features[i].getGeometry().getExtent();
            if (minX > newextent[0]) minX = newextent[0];
            if (minY > newextent[1]) minY = newextent[1];
            if (maxX < newextent[2]) maxX = newextent[2];
            if (maxY < newextent[3]) maxY = newextent[3];
        }
        return [minX, minY, maxX, maxY];
    };
    dev.getExtentByPoints = function (points) {
        if (dev.IsNull(points) || points.length == 0) return;
        var minX = points[0].x;
        var maxX = points[0].x;
        var minY = points[0].y;
        var maxY = points[0].y;
        for (var i = 0; i < points.length; i++) {
            if (minX > points[i].x) minX = points[i].x;
            if (minY > points[i].y) minY = points[i].y;
            if (maxX < points[i].x) maxX = points[i].x;
            if (maxY < points[i].y) maxY = points[i].y;
        }
        return [minX, minY, maxX, maxY];
    }
    /**
    * 功能：将图形转换成WKT,
    * 参数：feature：图形，isConvert:是否将xy格式转换为yx
    * 返回值：返回WKT字符串
    */
    dev.GetWKTByFeature = function (feature, isConvert) {
        var optFeature = feature;
        var radius;
        if (feature.getGeometry().getType() === "Circle") {
            optFeature = new dev.Feature(new dev.geom.Point(feature.getGeometry().getCenter()));
            radius = feature.getGeometry().getRadius();
        }
        var strwkt = new dev.format.WKT().writeFeature(optFeature);
        if (isConvert === true) strwkt = dev.ConvertWKT(strwkt);
        if (!dev.IsNull(radius) && radius > 0) return [strwkt, radius];
        return strwkt;
    };
    /**
    * 功能：将xy格式转换成yx
    * 参数：strWKT：xy格式的WKT
    * 返回值：返回WKT字符串
    */
    dev.ConvertWKT = function (strWKT) {
        var arrWKT = strWKT.split(",");
        var newWKT = "";
        $.each(arrWKT, function (i, o) {
            var point = o.split(" ");
            var x = point[0].trim();
            var y = point[1].trim();
            var newx;
            var endchars = "";
            if (x.lastIndexOf("(") >= 0) {
                newWKT += x.substr(0, x.lastIndexOf("(") + 1).trim();
                newx = x.substr(x.lastIndexOf("(") + 1, x.length - x.lastIndexOf("(") - 1).trim();
            }
            else newx = x.trim();
            if (y.lastIndexOf(")") >= 0) {
                newWKT += y.substr(0, y.indexOf(")")).trim();
                endchars = y.substr(y.indexOf(")"), y.lastIndexOf(")") + 1 - y.indexOf(")")).trim();
            }
            else newWKT += y.trim();
            newWKT += " " + newx + (endchars === "" ? "," : endchars);
        });
        return newWKT;
    };
    /**
     * 功能：将多边形图形转换成对象字符串
     * 参数：geometry：多边形对象（dev.geom.Polygon）
     * 返回值：对象字符串（string）
     */
    dev.GetPolygonJSON = function (geometry) {
        var coors = geometry.getCoordinates();
        var geo = '{"rings":[';
        for (var i = 0; i < coors.length; i++) {
            geo += '[';
            for (var j = 0; j < coors[i].length; j++) {
                geo += $.toJSON(coors[i][j]);
                if (j !== coors[i].length - 1) geo += ',';
            }
            geo += ']';
            if (i !== coors.length - 1) geo += ',';
        }
        geo += ']}';
        return geo;
    };
    /**
     * 功能：将多线图形转换成对象字符串
     * 参数：geometry：多线对象（dev.geom.MultiLine）
     * 返回值：多对象字符串（string）
     */
    dev.GetMultiLineJSON = function (geometry) {
        var coors = geometry.getCoordinates();
        var geo = '{"paths":[';
        for (var i = 0; i < coors.length; i++) {
            geo += '[';
            for (var j = 0; j < coors[i].length; j++) {
                geo += $.toJSON(coors[i][j]);
                if (j !== coors[i].length - 1) geo += ',';
            }
            geo += ']';
            if (i !== coors.length - 1) geo += ',';
        }
        geo += ']}';
        return geo;
    };
    /**
     * 功能：将线图形转换成对象字符串
     * 参数：geometry：线对象（dev.geom.Line）
     * 返回值：对象字符串（string）
     */
    dev.GetLineJSON = function (geometry) {
        var coors = geometry.getCoordinates();
        var geo = '{"paths":[[';
        for (var i = 0; i < coors.length; i++) {
            geo += '[';
            for (var j = 0; j < coors[i].length; j++) {
                geo += $.toJSON(coors[i][j]);
                if (j !== coors[i].length - 1) geo += ',';
            }
            geo += ']';
            if (i !== coors.length - 1) geo += ',';
        }
        geo += ']]}';
        return geo;
    };
    /**
     * 功能：将点图形转换成对象字符串
     * 参数：geometry：点对象（dev.geom.Point）
     * 返回值：对象字符串（string）
     */
    dev.GetPointJSON = function (geometry) {
        return geometry.getCoordinates().join(',');
    };
    /**
     * 功能：获取最近索引
     * 参数：values：网络分析结果集合，value：值，index：起始索引
     * 返回值：ArcGIS对象字符串（string）
     */
    dev.GetNANearIndex = function (values, value, index) {
        var temp = [];
        for (var i = index; i < values.length; i++) {
            temp.push(Math.abs(values[i][2] - value));
        }
        return temp.indexOf(Math.min.apply(Math, temp));
    };
    /**
     * 功能：将图形序列化成ArcGIS对象字符串
     * 参数：geometrys：图形对象集合（Array<dev.geom>）
     * 返回值：ArcGIS对象字符串（string）
     */
    dev.GetNAFeatureJSON = function (geometrys) {
        if (geometrys.length <= 0) return null;
        var json = '{"features":[';
        var type = geometrys[0].getType();
        switch (type) {
            case "Point":
                for (var i = 0; i < geometrys.length; i++) {
                    json += '{"geometry":';
                    var coor = geometrys[i].getCoordinates();
                    json += '{"x":' + coor[0] + ',"y":' + coor[1] + '}';
                    json += '}';
                    if (i !== geometrys.length - 1) json += ',';
                }
                break;
            case "LineString":
                for (var i = 0; i < geometrys.length; i++) {
                    json += '{"geometry":';
                    json += dev.GetLineJSON(geometrys[i]);
                    json += '}';
                    if (i !== geometrys.length - 1) json += ',';
                }
                break;
            case "MultiLineString":
                for (var i = 0; i < geometrys.length; i++) {
                    json += '{"geometry":';
                    json += dev.GetMultiLineJSON(geometrys[i]);
                    json += '}';
                    if (i !== geometrys.length - 1) json += ',';
                }
                break;
            case "Polygon":
                for (var i = 0; i < geometrys.length; i++) {
                    json += '{"geometry":';
                    json += dev.GetPolygonJSON(geometrys[i]);
                    json += '}';
                    if (i !== geometrys.length - 1) json += ',';
                }
                break;
        }
        json += ']}';
        return json;
    };
    /**
     * 功能：获取ArcGIS位置关系
     * 参数：relation：位置关系（dev.Relations）
     * 返回值：ArcGIS位置关系字符串（string）
     */
    dev.GetRelationToArcGIS = function (relation) {
        if (relation) return 'esriGeometryRelation' + relation;
        else return 'esriGeometryRelationIn';
    };
    /**
     * 功能：将图形序列化成ArcGIS对象字符串
     * 参数：geometrys：图形对象集合（Array<dev.geom>）
     * 返回值：ArcGIS对象字符串（string）
     */
    dev.GetGeometryJSONToArcGIS = function (geometrys) {
        if (geometrys.length <= 0) return null;
        var json = '';
        var type = geometrys[0].getType();
        switch (type) {
            case "Point":
                for (var i = 0; i < geometrys.length; i++) {
                    json += dev.GetPointJSON(geometrys[i]);
                    if (i !== geometrys.length - 1) json += ',';
                }
                break;
            case "LineString":
                json += '{"geometryType":"esriGeometryPolyline",';
                json += '"geometries":[';
                for (var i = 0; i < geometrys.length; i++) {
                    json += dev.GetLineJSON(geometrys[i]);
                    if (i !== geometrys.length - 1) json += ',';
                }
                json += "]}";
                break;
            case "MultiLineString":
                json += '{"geometryType":"esriGeometryPolyline",';
                json += '"geometries":[';
                for (var i = 0; i < geometrys.length; i++) {
                    json += dev.GetMultiLineJSON(geometrys[i]);
                    if (i !== geometrys.length - 1) json += ',';
                }
                json += "]}";
                break;
            case "Polygon":
                json += '{"geometryType":"esriGeometryPolygon",';
                json += '"geometries":[';
                for (var i = 0; i < geometrys.length; i++) {
                    json += dev.GetPolygonJSON(geometrys[i]);
                    if (i !== geometrys.length - 1) json += ',';
                }
                json += "]}";
                break;
        }
        return json;
    };
})(jQuery);

/*QueryLayer(图层查询，包含属性查询和空间查询)*/
; (function ($) {
    dev.QueryLayer = function (options) {
        this.Map = !options ? null : options.Map;
        if (!options || !options.Platform) this.Platform = dev.Platform.HIGHGIS;
        else this.Platform = options.Platform;
        //$.extend(dev.QueryLayer.prototype, $(this));
    };
    $.extend(dev.QueryLayer.prototype, {
        Query: function (args) {
            var obj = this;
            obj.UserState = args.UserState;
            QueryArcGISRest = function (args) {
                if (!args || !args.Url) return;
                var where = !args.Where ? "1=1" : args.Where;
                var text = !args.Text ? "" : args.Text;
                var objectIds = "";
                var time = "";
                var geometry = "";
                var geometryType = "esriGeometryEnvelope";
                if (args.Geometry) {
                    geometryType = "esriGeometryPolygon";
                    geometry = dev.GetPolygonJSON(args.Geometry);
                }
                var inSR = "";
                var spatialRel = "esriSpatialRelIntersects";
                var relationParam = "";
                var outFields = "*";
                var returnGeometry = true;
                var maxAllowableOffset = "";
                var geometryPrecision = "";
                var outSR = "";
                var returnIdsOnly = false;
                var returnCountOnly = false;
                var orderByFields = "";
                var groupByFieldsForStatistics = "";
                var outStatistics = "";
                var returnZ = false;
                var returnM = false;
                var gdbVersion = "";
                var url = [
                    args.Url + "/query?",
                    "where=" + where,
                    "&text=" + text,
                    "&objectIds=" + objectIds,
                    "&time=" + time,
                    "&geometry=" + geometry,
                    "&geometryType=" + geometryType,
                    "&inSR=" + inSR,
                    "&spatialRel=" + spatialRel,
                    "&relationParam=" + relationParam,
                    "&outFields=" + outFields,
                    "&returnGeometry=" + returnGeometry,
                    "&maxAllowableOffset=" + maxAllowableOffset,
                    "&geometryPrecision=" + geometryPrecision,
                    "&outSR=" + outSR,
                    "&returnIdsOnly=" + returnIdsOnly,
                    "&returnCountOnly=" + returnCountOnly,
                    "&orderByFields=" + orderByFields,
                    "&groupByFieldsForStatistics=" + groupByFieldsForStatistics,
                    "&outStatistics=" + outStatistics,
                    "&returnZ=" + returnZ,
                    "&returnM=" + returnM,
                    "&gdbVersion=" + gdbVersion,
                    "&f=json"
                ];
                $.ajax({
                    type: "GET",
                    //contentType: "application/json",
                    url: url.join(''),
                    cache: false,
                    //data: JSON.stringify("1=1"),
                    success: function (json) {
                        var data = { UserState: obj.UserState };
                        var result = $.evalJSON(json);
                        if (!result || result.error) {
                            data.Succeed = false;
                            data.Msg = "提示：查询失败！";
                        }
                        else {
                            data.Succeed = true;
                            data.Result = CreateQueryLayerResult();
                            data.Result.Projection.Type = dev.GetGeometryTypeForArcGIS(result.geometryType);
                            data.Result.Projection.Projection = new dev.GetProjectionForArcGIS(result.spatialReference);
                            for (var i = 0; i < result.fields.length; i++) {
                                data.Result.Fields.push({
                                    Name: result.fields[i].name,
                                    Alias: result.fields[i].alias,
                                    Type: dev.GetFieldTypeForArcGIS(result.fields[i].type)
                                });
                            }
                            data.Result.Features = dev.GetFeaturesForArcGIS(result.features, data.Result.Projection.Type);
                        }
                        $(obj).trigger("QueryCompleted", data);
                    },
                    error: function (info) {
                        var data = {
                            Succeed: false,
                            Msg: info,
                            UserState: obj.UserState
                        };
                        $(obj).trigger("QueryCompleted", data);
                    }
                });
            };
            if (this.Platform === dev.Platform.ArcGIS) QueryArcGISRest(args);
        }
    });
    CreateQueryLayerResult = function () {
        var res = {};
        res.Features = [];
        res.Fields = [];
        res.Projection = { Type: null, Projection: null };
        return res;
    };
})(jQuery);

/*QueryLayers(多图层组合查询)*/
; (function ($) {
    dev.QueryLayers = function (options) {
        this.Map = !options ? null : options.Map;
        if (!options || !options.Platform) this.Platform = dev.Platform.HIGHGIS;
        else this.Platform = options.Platform;
    };
    $.extend(dev.QueryLayers.prototype, {
        Query: function (args) {
            var obj = this;
            obj.UserState = args.UserState;
            QueryArcGISRest = function (args) {
                if (!args || !args.Filters) return;
                var count = args.Filters.length;
                var index = 0; var res = {
                    Results: [],
                    UserState: obj.UserState
                };
                var ql = new dev.QueryLayer({ Map: obj.Map, Platform: obj.Platform });
                $(ql).bind("QueryCompleted", function (sender, data) {
                    res.Results.push({
                        Succeed: data.Succeed,
                        Result: data.Result,
                        Filter: args.Filters[index]
                    });
                    index++;
                    if (index < count) ql.Query(args.Filters[index]);
                    else { $(obj).trigger("QueryCompleted", res); }
                });
                ql.Query(args.Filters[index]);
            };
            if (this.Platform === dev.Platform.ArcGIS) QueryArcGISRest(args);
        }
    });
})(jQuery);

/*Relation(位置关系分析)*/
; (function ($) {
    dev.Relation = function (options) {
        if (!options || !options.Platform) this.Platform = dev.Platform.HIGHGIS;
        else this.Platform = options.Platform;
    };
    $.extend(dev.Relation.prototype, {
        Execute: function (args) {
            var obj = this;
            obj.UserState = args.UserState;
            ExecuteArcGISRest = function (args) {
                if (!args || !args.Url) return;
                var sr = !args.WKID ? "" : args.WKID;
                var relation = dev.GetRelationToArcGIS(args.Relation);// "esriGeometryRelationIn";
                var geometries1 = dev.GetGeometryJSONToArcGIS(args.Geometries1);
                var geometries2 = dev.GetGeometryJSONToArcGIS(args.Geometries2);
                var f = "json";
                var url = [
                    args.Url + "/relation?",
                    "sr=" + sr,
                    "&relation=" + relation,
                    "&geometries1=" + geometries1,
                    "&geometries2=" + geometries2,
                    "&f=" + f
                ];
                $.ajax({
                    type: "GET",
                    url: url.join(''),
                    success: function (json) {
                        var data = { UserState: obj.UserState };
                        var result = $.evalJSON(json);
                        if (!result || result.error) {
                            data.Succeed = false;
                            data.Msg = result.error;
                        }
                        else {
                            data.Succeed = true;
                            data.Result = [];
                            for (var i = 0; i < result.relations.length; i++) {
                                data.Result.push([result.relations[i].geometry1Index, result.relations[i].geometry2Index]);
                            }
                        }
                        $(obj).trigger("RelationCompleted", data);
                    },
                    error: function (info) {
                        var data = {
                            Succeed: false,
                            Msg: info,
                            UserState: obj.UserState
                        };
                        $(obj).trigger("RelationCompleted", data);
                    }
                });
            };
            if (this.Platform === dev.Platform.ArcGIS) ExecuteArcGISRest(args);
        }
    });
})(jQuery);

/*NetworkAnalyst(网络分析)*/
; (function ($) {
    dev.NetworkAnalyst = function (options) {
        if (!options || !options.Platform) this.Platform = dev.Platform.HIGHGIS;
        else this.Platform = options.Platform;
    };
    $.extend(dev.NetworkAnalyst.prototype, {
        Solve: function (args) {
            var obj = this;
            obj.UserState = args.UserState;
            SolveArcGISRest = function (args) {
                if (!args || !args.Url) return;
                var returnBarriers = false;
                var returnPolylineBarriers = false;
                var returnPolygonBarriers = false;
                var outSR = !args.OutWKID ? "" : args.OutWKID;// "4490";
                var stops = dev.GetNAFeatureJSON(args.Stops);
                var barriers = dev.GetNAFeatureJSON(args.Barriers);
                var polylineBarriers = dev.GetNAFeatureJSON(args.PolylineBarriers);
                var polygonBarriers = dev.GetNAFeatureJSON(args.PolygonBarriers);
                var returnDirections = true;
                var returnRoutes = true;
                var returnStops = false;
                var ignoreInvalidLocations = true;
                var preserveFirstStop = true;
                var preserveLastStop = true;
                var useTimeWindows = false;
                var useHierarchy = true;
                var directionsLengthUnits = "esriNAUMeters";
                var f = "json";
                var url = [
                    args.Url + "/solve?",
                    "returnBarriers=" + returnBarriers,
                    "&returnPolylineBarriers=" + returnPolylineBarriers,
                    "&returnPolygonBarriers=" + returnPolygonBarriers,
                    "&outSR=" + outSR,
                    "&stops=" + stops,
                    "&barriers=" + barriers,
                    "&polylineBarriers=" + polylineBarriers,
                    "&polygonBarriers=" + polygonBarriers,
                    "&returnDirections=" + returnDirections,
                    "&returnRoutes=" + returnRoutes,
                    "&returnStops=" + returnStops,
                    "&ignoreInvalidLocations=" + ignoreInvalidLocations,
                    "&preserveFirstStop=" + preserveFirstStop,
                    "&preserveLastStop=" + preserveLastStop,
                    "&useTimeWindows=" + useTimeWindows,
                    "&useHierarchy=" + useHierarchy,
                    "&directionsLengthUnits=" + directionsLengthUnits,
                    "&f=" + f
                ];
                $.ajax({
                    type: "GET",
                    url: url.join(''),
                    success: function (json) {
                        var data = { UserState: obj.UserState };
                        var result = $.evalJSON(json);
                        if (!result || result.error) {
                            data.Succeed = false;
                            data.Msg = result.error;
                        }
                        else {
                            data.Succeed = true;
                            if (result.directions.length > 0 && result.routes.features.length > 0) {
                                data.Result = {
                                    TotalLength: result.directions[0].summary.totalLength,
                                    Direction: []
                                };
                                var len = 0;
                                var index = 0; var path = result.routes.features[0].geometry.paths[0];
                                for (var i = 0; i < result.directions[0].features.length; i++) {
                                    var dir = {
                                        Text: result.directions[0].features[i].attributes.text,
                                        Length: result.directions[0].features[i].attributes.length
                                    };
                                    len += dir.Length;
                                    var temp = dev.GetNANearIndex(path, len, index);
                                    dir.Geometries = path.slice(index, index + temp + 1);
                                    data.Result.Direction.push(dir);
                                    index += temp;
                                }
                            }
                        }
                        $(obj).trigger("NetworkAnalystCompleted", data);
                    },
                    error: function (info) {
                        var data = {
                            Succeed: false,
                            Msg: info,
                            UserState: obj.UserState
                        };
                        $(obj).trigger("NetworkAnalystCompleted", data);
                    }
                });
            };
            if (this.Platform === dev.Platform.ArcGIS) SolveArcGISRest(args);
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
    dev.Draw = function (options) {
        if (!dev.IsObject(options) || dev.IsNull(options.Map)) return;
        this.Type = dev.IsNull(options.Type) ? dev.DrawType.Ploygon : options.Type;
        this.State = dev.IsNull(options.State) ? "Query" : options.State;
        this.Style = dev.IsNull(options.Style) ? (new dev.style.Style({
            stroke: new dev.style.Stroke({ width: 1, color: 'rgba(237, 117, 65, 1)' }),
            fill: new dev.style.Fill({ color: [236, 179, 73, 0.2] }),
            image: new dev.style.Circle({
                radius: 0,
                fill: new dev.style.Fill({
                    color: [236, 179, 73, 0.5]
                }),
                stroke: new dev.style.Stroke({
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
                if (dev.IsNull(fill)) { fill = new dev.style.Fill({ color: 'rgba(255, 0, 0, 0.2)' }); }
                var stroke = options.Stroke;
                if (dev.IsNull(stroke)) { stroke = new dev.style.Stroke({ color: '#ff0000', width: 1 }); }
                var image = options.Image;
                if (dev.IsNull(image)) { image = new dev.style.Circle({ radius: 4, fill: new dev.style.Fill({ color: '#ff0000' }) }); }
                this.Layer.setStyle(new dev.style.Style({ fill: fill, stroke: stroke, image: image }));
            }
            this.Map.addLayer(this.Layer);
        }
        else {
            this.Layer = options.Layer;
            this.Source = this.Layer.getSource();
        }
        this.Target = $(this);
    };
    $.fn.extend(dev.Draw.prototype, {
        Start: function (drawType) {
            var $this = this;
            if (!dev.IsNull(drawType)) this.Type = drawType;
            if (!dev.IsNull(this.Draw)) this.Map.removeInteraction(this.Draw);
            var geoFun, maxPoints, value = this.Type;
            if (this.Type === dev.DrawType.Square) {
                value = dev.DrawType.Circle;
                geoFun = dev.interaction.Draw.createRegularPolygon(4);
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
            //获取对应的source;
            this.Draw = new dev.interaction.Draw({
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
        },
        SetLayer: function (layer) {
            if (dev.IsNull(layer)) return;
            this.Layer = layer;
            this.Source = this.Layer.getSource();
        }
    });
})(jQuery);

/*指北针控件*/
; (function ($) {
    /**
     * 功能：根据分辨率获取地图级别
     * 参数：resolution：分辨率
     * 返回值：地图级别（number）
     */
    function GetLevel(levels, resolution) {
        var temp = [];
        for (var i = 0; i < levels.length; i++) {
            //获取地图坐标系
            var mapproj = dev.App.Map.getView().getProjection();
            var c_resolution = levels[i].Resolution;
            if (mapproj.getCode() == "EPSG:3857") c_resolution = levels[i].Resolution3857;
            temp.push(Math.abs(c_resolution - resolution));
        }
        return temp.indexOf(Math.min.apply(Math, temp));
    };
    function Drag(nav) {
        var dv = nav.drag[0];
        dv.onmousedown = function (e) {
            var d = document;
            var page = {
                event: function (evt) {
                    var ev = evt || window.event;
                    return ev;
                },
                pageY: function (evt) {
                    var e = this.event(evt);
                    return e.pageY || (e.clientY + document.body.scrollTop - document.body.clientTop);
                }
            }
            if (dv.setCapture) {
                dv.setCapture();
            }
            else if (window.captureEvents) {
                window.captureEvents(Event.MOUSEMOVE | Event.MOUSEUP);
            }
            d.onmousemove = function (e) {
                var b = nav.Target.offset().top + nav.Target.outerHeight() - page.pageY(e);
                if (b > 5 * (nav.Levels.length - 1) + 33) b = 5 * (nav.Levels.length - 1) + 33;
                else if (b < 33) b = 33;
                dv.style.bottom = b + "px";
            }
            d.onmouseup = function () {
                var lev = parseInt((dv.style.bottom.replace("px", "") - 33) / 5);
                if (dev.IsNull(nav.Map) || dev.IsNull(nav.Map.getView())) return;
                nav.Map.beforeRender(dev.animation.zoom({
                    duration: 300,
                    resolution: nav.Map.getView().getResolution(),
                    easing: dev.easing.easeOut
                }));
                var c_r = nav.Levels[lev].Resolution;
                var mapproj = dev.App.Map.getView().getProjection();
                if (mapproj.getCode() == "EPSG:3857") c_r = nav.Levels[lev].Resolution3857;
                nav.Map.getView().setResolution(parseFloat(c_r));
                if (dv.releaseCapture) {
                    dv.releaseCapture();
                }
                else if (window.releaseEvents) {
                    window.releaseEvents(Event.MOUSEMOVE | Event.MOUSEUP);
                }
                d.onmousemove = null;
                d.onmouseup = null;
            }
        };
    };
    function Zoom(evt) {
        var nav = evt.data;
        if (dev.IsNull(nav.Map) || dev.IsNull(nav.Map.getView())) return;
        var res = null, curRes = nav.Map.getView().getResolution();
        if (nav.IsVisibleLevel == "false") {
            if (nav.zoomType == -1) res = curRes * 2;
            else if (nav.zoomType == 1) res = curRes / 2;
        }
        else {
            var index = GetLevel(nav.Levels, curRes);
            if (nav.zoomType == -1) index--;
            else if (nav.zoomType == 1) index++;
            if (index < 0 || index >= nav.Levels.length) return;
            var mapproj = dev.App.Map.getView().getProjection();
            var c_r = nav.Levels[index].Resolution;
            if (mapproj.getCode() == "EPSG:3857") c_r = nav.Levels[index].Resolution3857;
            res = parseFloat(c_r);
        }
        if (dev.IsNull(res)) return;
        nav.Map.beforeRender(dev.animation.zoom({
            duration: 300,
            resolution: curRes,
            easing: dev.easing.easeOut
        }));
        nav.Map.getView().setResolution(res);
    };
    function ResolutionChanged(evt) {
        var resolution = evt.target.get('resolution');
        var lev = GetLevel(this.Levels, resolution);
        this.drag.css("bottom", lev * 5 + 33 + "px");
    };
    function RotationChanged(evt) {
        var rota = evt.target.get('rotation');
        var rad = "rotate(" + rota + "rad)";
        this.full.css("transform", rad);
    };
    function MouseEnter(evt) {
        evt.data.Target.css("opacity", "1.0");
    };
    function MouseLeave(evt) {
        evt.data.Target.css("opacity", "0.5");
    };
    function Pan(evt) {
        if (dev.IsNull(evt.data.Map) || dev.IsNull(evt.data.Map.getView())) return;
        var ex = evt.data.Map.getView().calculateExtent(evt.data.Map.getSize());
        var center = evt.data.Map.getView().getCenter();
        var newCenter = null;
        switch (evt.data.PanType) {
            case "North":
                newCenter = [center[0], ex[1]];
                break;
            case "South":
                newCenter = [center[0], ex[3]];
                break;
            case "West":
                newCenter = [ex[2], center[1]];
                break;
            case "East":
                newCenter = [ex[0], center[1]];
                break;
        }
        if (newCenter == null) return;
        var pan = dev.animation.pan({
            duration: 300,
            source: (center)
        });
        evt.data.Map.beforeRender(pan);
        evt.data.Map.getView().setCenter(newCenter);
    };
    function Full(evt) {
        if (dev.IsNull(evt.data.Map) || dev.IsNull(evt.data.Map.getView())) return;
        var rotate = dev.animation.rotate({
            duration: 300,
            rotation: evt.data.Map.getView().getRotation()
        });
        evt.data.Map.beforeRender(rotate);
        evt.data.Map.getView().rotate(0);
    };
    function Jump(evt) {
        var nav = evt.data;
        var lev = parseInt((nav.scaleBar.outerHeight() - evt.offsetY) / 5);
        var newRes = nav.Levels[lev - 1].Resolution;
        if (!newRes) return;
        if (dev.IsNull(nav.Map) || dev.IsNull(nav.Map.getView())) return;
        nav.Map.beforeRender(dev.animation.zoom({
            duration: 300,
            resolution: nav.Map.getView().getResolution(),
            easing: dev.easing.easeOut
        }));
        var mapproj = dev.App.Map.getView().getProjection();
        if (mapproj.getCode() == "EPSG:3857") newRes = nav.Levels[lev - 1].Resolution3857;
        nav.Map.getView().setResolution(parseFloat(newRes));
    };
    $.UCNavigation = function (param) {
        if (dev.IsNull(param) || dev.IsNull(param.IsVisible) || param.IsVisible == "false"
            || dev.IsNull(param.Map) || dev.IsNull(param.Parent)) return;
        this.Map = param.Map;
        this.Parent = param.Parent;
        this.Margin = param.Margin;
        this.Levels = param.Levels;
        this.IsVisibleLevel = param.IsVisibleLevel;
        this.Map.getView().on('change:resolution', ResolutionChanged, this);
        this.Map.getView().on('change:rotation', RotationChanged, this);
        this.Target = $('<div id="navigation" class="navigation"></div>').appendTo(this.Parent);
        var css = { position: "absolute", width: "68px", opacity: "0.5" };
        if (param.HorizontalAlignment == "right") css.right = this.Margin.Right + "px";
        else if (param.HorizontalAlignment == "left") css.left = this.Margin.Left + "px";
        if (param.VerticalAlignment == "bottom") css.bottom = this.Margin.Bottom + "px";
        else if (param.VerticalAlignment == "top") css.top = this.Margin.Top + "px";
        this.Target.css(css);
        this.Target.bind("mouseenter", this, MouseEnter);
        this.Target.bind("mouseleave", this, MouseLeave);
        this.navCircle = $('<div id="navCircle"></div>');
        this.navBar = $('<div id="navBar"></div>');
        this.north = $('<div id="north"></div>');
        this.navCircle.append(this.north);
        this.south = $('<div id="south"></div>');
        this.navCircle.append(this.south);
        this.west = $('<div id="west"></div>');
        this.navCircle.append(this.west);
        this.east = $('<div id="east"></div>');
        this.navCircle.append(this.east);
        this.full = $('<div id="full"></div>');
        this.navCircle.append(this.full);
        this.zoomIn = $('<div id="zoomIn"></div>');
        this.navBar.append(this.zoomIn);
        var count = this.IsVisibleLevel === "false" ? -1 : this.Levels.length;
        this.scaleBar = $('<div id="scaleBar" style="height:' + 5 * (count + 1) + 'px"></div>');
        this.navBar.append(this.scaleBar);
        this.zoomOut = $('<div id="zoomOut"></div>');
        this.navBar.append(this.zoomOut);
        var dis = this.IsVisibleLevel === "false" ? "none" : "block";
        var level = GetLevel(this.Levels, this.Map.getView().getResolution());
        this.drag = $('<div id="drag" style="display:' + dis + ';bottom:' + (level * 5 + 33) + 'px"></div>');
        this.navBar.append(this.drag);
        this.Target.append(this.navCircle);
        this.Target.append(this.navBar);
        this.Target.appendTo(this.Parent);
        var height = this.zoomIn.outerHeight() + parseInt(this.zoomIn.css("top")) + this.scaleBar.outerHeight() + this.zoomOut.outerHeight() + 8;
        this.navBar.css("height", height + "px");
        this.Target.css("height", this.navCircle.outerHeight() + this.navBar.outerHeight() + "px");
        this.north.bind("click", $.extend({ PanType: "North" }, this), Pan);
        this.south.bind("click", $.extend({ PanType: "South" }, this), Pan);
        this.west.bind("click", $.extend({ PanType: "West" }, this), Pan);
        this.east.bind("click", $.extend({ PanType: "East" }, this), Pan);
        this.full.bind("click", this, Full);
        this.scaleBar.bind("click", this, Jump);
        this.zoomIn.bind("click", $.extend({ zoomType: 1 }, this), Zoom);
        this.zoomOut.bind("click", $.extend({ zoomType: -1 }, this), Zoom);
        Drag(this);
        $.extend($.UCNavigation.prototype, this.Target);
    };
    $.fn.extend($.UCNavigation.prototype, {
        GetCurrentLevel: function () {
            return GetLevel(this.Levels, this.Map.getView().getResolution());
        },
        mapViewRefresh: function () {
            this.Map.getView().un('change:resolution');
            this.Map.getView().un('change:rotation');
            this.Map.getView().on('change:resolution', ResolutionChanged, this);
            this.Map.getView().on('change:rotation', RotationChanged, this);
        }
    });
})(jQuery);

/*创建文本style*/
; (function ($) {
    dev.TextStyle = function () {
        this.align = "center";
        this.baseline = "middle";
        this.size = "10px";
        this.offsetX = 0;
        this.offsetY = 0;
        this.weight = "bold";
        this.rotation = 0;
        this.font = this.weight + ' ' + this.size + ' ' + "arial";
        this.fillColor = 'rgba(255, 255, 255, 0.2)';
        this.outlineColor = '#ffcc33';
        this.outlineWidth = 3;
        this.radius = 10;
    };
    //默认样式
    $.extend(dev.TextStyle.prototype, {
        createdefaultTextStyle: function () {
            return new dev.style.Text({
                textAlign: this.align,
                textBaseline: this.baseline,
                font: this.font,
                text: this.text,
                fill: new dev.style.Fill({ color: this.fillColor }),
                stroke: new dev.style.Stroke({ color: this.outlineColor, width: this.outlineWidth }),
                offsetX: this.offsetX,
                offsetY: this.offsetY,
                rotation: this.rotation
            });
        }
    });
    //用户自定义样式
    $.extend(dev.TextStyle.prototype, {
        createTextStyle: function (args) {
            var align = (!args.align) ? args.align : this.alias;
            var baseline = (!args.baseline) ? args.baseline : this.baseline;
            var size = (!args.size) ? args.size : this.size;
            var offsetX = parseInt((!args.offsetX) ? args.offsetX : this.offsetX, 10);
            var offsetY = parseInt((!args.offsetY) ? args.offsetY : this.offsetY, 10);
            var weight = (!args.weight) ? args.weight : this.weight;
            var rotation = parseFloat((!args.rotation) ? args.rotation : this.rotation);
            var font = (!args.font) ? args.font : this.font;
            var fontsize = weight + ' ' + size + ' ' + font;
            var fillColor = (!args.color) ? args.color : this.color;
            var outlineColor = (!args.outline) ? args.outline : this.outline;
            var outlineWidth = parseInt((!args.outlineWidth) ? args.outlineWidth : this.outlineWidth, 10);
            return new dev.style.Text({
                textAlign: align,
                textBaseline: baseline,
                font: fontsize,
                text: args.text,
                fill: new dev.style.Fill({ color: fillColor }),
                stroke: new dev.style.Stroke({ color: outlineColor, width: outlineWidth }),
                offsetX: offsetX,
                offsetY: offsetY,
                rotation: rotation
            });
        }
    });
})(jQuery);
/*创建面style*/
; (function ($) {
    dev.PolygonStyle = function () {
        this.fillColor = 'rgba(255, 255, 255, 0.2)';
        this.outlineColor = '#ffcc33';
        this.outlineWidth = 3;
    };
    //默认样式
    $.extend(dev.PolygonStyle.prototype, {
        createdefaultPolygonStyleFunction: function () {
            var style = new dev.style.Style({
                stroke: new dev.style.Stroke({
                    color: this.outlineColor,
                    width: this.outlineWidth
                }),
                fill: new dev.style.Fill({
                    color: this.fillColor
                })
            });
            return [style];
        }
    });
    //用户自定义样式
    $.extend(dev.PolygonStyle.prototype, {
        createPolygonStyleFunction: function (args) {
            var fillColor = (!args.color) ? args.color : this.color;
            var outlineColor = (!args.outline) ? args.outline : this.outline;
            var outlineWidth = parseInt((!args.outlineWidth) ? args.outlineWidth : this.outlineWidth, 10);
            var style = new dev.style.Style({
                stroke: new dev.style.Stroke({
                    color: outlineColor,
                    width: outlineWidth
                }),
                fill: new dev.style.Fill({
                    color: fillColor
                })
            });
            return [style];
        }
    });
})(jQuery);
/*创建线style*/
; (function ($) {
    dev.LineStyle = function () {
        this.outlineColor = '#ffcc33';
        this.outlineWidth = 3;
    };
    //默认样式
    $.extend(dev.LineStyle.prototype, {
        createdefaultLineStyleFunction: function () {
            var style = new dev.style.Style({
                stroke: new dev.style.Stroke({
                    color: this.outlineColor,
                    width: this.outlineWidth
                })
            });
            return [style];
        }
    });
    //用户自定义样式
    $.extend(dev.LineStyle.prototype, {
        createLineStyleFunction: function (args) {
            if (!args || !args.outlineWidth) return;
            var outlineColor = (!args.outline) ? args.outline : this.outline;
            var outlineWidth = parseInt((!args.outlineWidth) ? args.outlineWidth : this.outlineWidth, 10);
            var style = new dev.style.Style({
                stroke: new dev.style.Stroke({
                    color: outlineColor,
                    width: outlineWidth
                })
            });
            return [style];
        }
    });
})(jQuery);
/*创建点style*/
; (function ($) {
    dev.PointStyle = function () {
        this.fillColor = 'rgba(255, 255, 255,0.2)';
        this.outlineColor = '#ffcc33';
        this.outlineWidth = 3;
        this.radius = 20;
    };
    //默认样式
    $.extend(dev.PointStyle.prototype, {
        createdefaultPointStyleFunction: function () {
            var style = new dev.style.Style({
                image: new dev.style.Circle({
                    radius: this.radius,
                    fill: new dev.style.Fill({ color: this.fillColor }),
                    stroke: new dev.style.Stroke({ color: this.outlineColor, width: this.outlineWidth })
                })
            });
            return [style];
        }
    });
    //用户自定义样式
    $.extend(dev.PointStyle.prototype, {
        createPointStyleFunction: function (args) {

            var radius = (!args.radius) ? args.radius : this.radius;
            var fillColor = (!args.color) ? args.color : this.color;
            var outlineColor = (!args.outline) ? args.outline : this.outline;
            var outlineWidth = parseInt((!args.outlineWidth) ? args.outlineWidth : this.outlineWidth, 10);
            var style = new dev.style.Style({
                image: new dev.style.Circle({
                    radius: radius,
                    fill: new dev.style.Fill({ color: fillColor }),
                    stroke: new dev.style.Stroke({ color: outlineColor, width: outlineWidth })
                })
            });
            return [style];
        }
    });
})(jQuery);
/*创建图标style*/
; (function ($) {
    dev.IconStyle = function () {
        this.anchor = [0, 46];
        this.anchorXUnits = 'fraction';
        this.anchorYUnits = 'pixels';
        this.opacity = 0.65;
        this.src = 'image/marker.png';
        this.fillColor = 'rgba(223, 223,223, 0.5)';
        this.outlineColor = '#FF0000';
        this.outlineWidth = 3;
        this.size = [2, 2];
    };
    //默认样式
    $.extend(dev.IconStyle.prototype, {
        createdefaultIconStyleFunction: function () {
            var style = new dev.style.Style({
                image: new dev.style.Icon(({
                    anchor: this.anchor,
                    anchorXUnits: this.anchorXUnits,
                    anchorYUnits: this.anchorYUnits,
                    opacity: this.opacity,
                    src: this.src
                })),
                stroke: new dev.style.Stroke({
                    width: this.outlineWidth,
                    color: this.outlineColor
                }),
                fill: new dev.style.Fill({
                    color: this.fillColor
                })
            });
            return [style];
        }
    });
    //用户自定义样式
    $.extend(dev.IconStyle.prototype, {
        createIconStyleFunction: function (args) {
            var anchor = (!args.anchor) ? args.anchor : this.anchor;
            var anchorXUnits = (!args.anchorXUnits) ? args.anchorXUnits : this.anchorXUnits;
            var anchorYUnits = (!args.anchorYUnits) ? args.anchorYUnits : this.anchorYUnits; args.anchorYUnits;
            var opacity = (!args.opacity) ? args.opacity : this.opacity;
            var src = (!args.src) ? args.src : this.src;
            var fillColor = (!args.color) ? args.color : this.color;
            var outlineColor = (!args.outline) ? args.outline : this.outline;
            var outlineWidth = parseInt((!args.outlineWidth) ? args.outlineWidth : this.outlineWidth, 10);
            var style = new dev.style.Style({
                image: new dev.style.Icon(({
                    anchor: anchor,
                    anchorXUnits: anchorXUnits,
                    anchorYUnits: anchorYUnits,
                    opacity: opacity,
                    src: src
                })),
                stroke: new dev.style.Stroke({
                    width: outlineWidth,
                    color: outlineColor
                }),
                fill: new dev.style.Fill({
                    color: fillColor
                })
            });
            return [style];
        }
    });
})(jQuery);
/* 描述：StaticLayer(图层查询，包含属性查询和空间查询)
*[
  {
    "statisticType": "<count | sum | min | max | avg | stddev | var>",
    "onStatisticField": "Field1", 
    "outStatisticFieldName": "Out_Field_Name1"
  },
  {
    "statisticType": "<count | sum | min | max | avg | stddev | var>",
    "onStatisticField": "Field2",
    "outStatisticFieldName": "Out_Field_Name2"
  }  
]
 */
dev.statisticType = { "count": 'count', "sum": 'sum', "min": 'min', "max": 'max', "avg": 'avg', "stddev": 'stddev', "var": 'var' };
dev.WMSVersion = { "1.1.1": '1.1.1', "1.3.0": '1.3.0' };
dev.WFSVersion = { "1.0.0": '1.0.0', "1.1.0": '1.1.0', "2.0.0": '2.0.0' };
/*图层统计*/
; (function ($) {
    dev.StatisticLayer = function (options) {
        this.Map = !options ? null : options.Map;
        if (!options || !options.Platform) this.Platform = dev.Platform.HIGHGIS;
        else this.Platform = options.Platform;
    };
    $.extend(dev.StatisticLayer.prototype, {
        Query: function (args) {
            var obj = this;
            obj.UserState = args.UserState;
            QueryArcGISRest = function (args) {
                if (!args || !args.Url) return;
                var where = !args.Where ? "1=1" : args.Where;
                var text = !args.Text ? "" : args.Text;
                var objectIds = "";
                var time = "";
                var geometry = "";
                var geometryType = "esriGeometryEnvelope";
                if (args.Geometry) {
                    geometryType = "esriGeometryPolygon";
                    geometry = dev.GetQueryGeometry(args.Geometry.getCoordinates());
                }
                var inSR = "";
                var spatialRel = "esriSpatialRelIntersects";
                var relationParam = "";
                var outFields = "*";
                var returnGeometry = true;
                var maxAllowableOffset = "";
                var geometryPrecision = "";
                var outSR = "";
                var returnIdsOnly = false;
                var returnCountOnly = false;
                var orderByFields = "";
                var groupByFieldsForStatistics = "";
                var staticStr = !args.outStatistics ? "" : args.outStatistics;
                var outStatistics = array2Str(staticStr);
                var returnZ = false;
                var returnM = false;
                var gdbVersion = "";
                var url = [
                    args.Url + "/query?",
                    "where=" + where,
                    "&text=" + text,
                    "&objectIds=" + objectIds,
                    "&time=" + time,
                    "&geometry=" + geometry,
                    "&geometryType=" + geometryType,
                    "&inSR=" + inSR,
                    "&spatialRel=" + spatialRel,
                    "&relationParam=" + relationParam,
                    "&outFields=" + outFields,
                    "&returnGeometry=" + returnGeometry,
                    "&maxAllowableOffset=" + maxAllowableOffset,
                    "&geometryPrecision=" + geometryPrecision,
                    "&outSR=" + outSR,
                    "&returnIdsOnly=" + returnIdsOnly,
                    "&returnCountOnly=" + returnCountOnly,
                    "&orderByFields=" + orderByFields,
                    "&groupByFieldsForStatistics=" + groupByFieldsForStatistics,
                    "&outStatistics=" + outStatistics,
                    "&returnZ=" + returnZ,
                    "&returnM=" + returnM,
                    "&gdbVersion=" + gdbVersion,
                    "&f=json"
                ];
                $.ajax({
                    type: "GET",
                    //contentType: "application/json",
                    url: encodeURI(url.join('')),
                    //data: JSON.stringify("1=1"),
                    success: function (json) {
                        var data = { UserState: obj.UserState };
                        var result = $.evalJSON(json);
                        if (!result || result.error) {
                            data.Succeed = false;
                            data.Msg = "提示：查询失败！";
                        }
                        else {
                            data.Succeed = true;
                            data.value = result;
                        }
                        $(obj).trigger("StaticCompleted", data);
                    },
                    error: function (info) {
                        var data = {
                            Succeed: false,
                            Msg: info,
                            UserState: obj.UserState
                        };
                        $(obj).trigger("StaticCompleted", data);
                    }
                });
            };
            if (this.Platform === dev.Platform.ArcGIS) QueryArcGISRest(args);
        }
    });
    function array2Str(array) {
        if (array == "") return "";
        var str = "";
        str = str + "[";
        for (var i = 0; i < array.length; i++) {
            str = str + "{";
            str = str + "statisticType:";
            str = str + "'" + array[i].statisticType + "'";
            str = str + ",";
            str = str + "onStatisticField:";
            str = str + "'" + array[i].onStatisticField + "'";
            str = str + ",";
            str = str + "outStatisticFieldName:";
            str = str + "'" + array[i].outStatisticFieldName + "'";
            str = str + "}";
            if (i != array.length - 1) {
                str = str + ",";
            }
        }
        str = str + "]";
        return str;
    }
})(jQuery);

/*缓冲区分析*/
; (function ($) {
    dev.BufferAnalysis = function (args) {
        if (!args || !args.Map) return;
        this.Map = !args.Map ? null : args.Map;
        if (!args || !args.Platform) this.Platform = dev.Platform.HIGHGIS;
        else this.Platform = args.Platform;
    };
    $.extend(dev.BufferAnalysis.prototype, {
        Buffering: function (args) {
            if (!args || !args.Url || !args.Geom) return;
            var obj = this;
            QueryArcGISRest = function (args) {
                var geometries = dev.GetGeometryJSONToArcGIS(args.Geom);
                var inSR = !args.inSR ? 4326 : args.inSR;
                var outSR = !args.outSR ? 4326 : args.outSR;
                var bufferSR = !args.bufferSR ? 102113 : args.bufferSR;
                var distances = !args.distances ? 1000 : args.distances;
                var unit = !args.unit ? "" : args.unit;
                var unionResults = !args.unionResults ? args.unionResults : false;
                var url = [
                    args.Url + "/buffer?",
                    "geometries=" + geometries,
                    "&inSR=" + inSR,
                    "&outSR=" + outSR,
                    "&bufferSR=" + bufferSR,
                    "&distances=" + distances,
                    "&unit=" + unit,
                    "&unionResults=" + unionResults,
                    "&f=json"
                ];
                $.ajax({
                    type: "GET",
                    url: url.join(''),
                    success: function (json) {
                        var data = { UserState: obj.UserState };
                        var result = $.evalJSON(json);
                        if (!result || result.error) {
                            data.Succeed = false;
                            data.Msg = "提示：查询失败！";
                        }
                        else {
                            data.Succeed = true;
                            data.value = points2Feature(result);
                        }
                        $(obj).trigger("BuffingCompleted", data);
                    },
                    error: function (info) {
                        var data = {
                            Succeed: false,
                            Msg: info,
                            UserState: obj.UserState
                        };
                        $(obj).trigger("BuffingCompleted", data);
                    }
                });
            };
            if (this.Platform === dev.Platform.ArcGIS) QueryArcGISRest(args);
        }
    });
    function points2Feature(result) {
        var features = [];
        for (var i = 0; i < result.geometries.length; i++) {
            var feature = new dev.Feature();
            var geo = null;
            if (result.geometries[i].rings.length <= 0) continue;
            if (result.geometries[i].rings.length > 1) {
                geo = new dev.geom.MultiPolygon(result.geometries[i].rings);
            }
            else {
                var polygon = result.geometries[i].rings[0];
                geo = new dev.geom.Polygon([polygon]);
            }
            feature.setGeometry(geo);
            features.push(feature);
        }
        return features;
    }
})(jQuery);
/*返回要素集合*/
dev.GetGeometiesForArcGIS = function (graphics, type) {
    if (!graphics) return null;
    var geoms = [];
    for (var i = 0; i < graphics.length; i++) {
        var geo = null;
        switch (type) {
            case dev.GeometryType.Point:
                geo = new dev.geom.Point([graphics[i].x, graphics[i].y]);
                break;
            case dev.GeometryType.MultiPoint:
                var Points = [];
                for (var k = 0; k < graphics[i].points.length; k++) {
                    Points.push([graphics[i].points[k][0], graphics[i].points[k][1]]);
                }
                geo = new dev.geom.MultiPoint(Points);
                break;
            case dev.GeometryType.Line:
                if (graphics[i].paths.length <= 0) continue;
                if (graphics[i].paths.length > 1) {
                    geo = new dev.geom.MultiLineString(graphics[i].paths);
                }
                else {
                    var lines = graphics[i].geometry.paths[0];
                    geo = new dev.geom.LineString([lines]);
                }
                break;
            case dev.GeometryType.Polygon:
                if (graphics[i].rings.length <= 0) continue;
                if (graphics[i].rings.length > 1) {
                    var rings = [];
                    for (var j = 0; j < graphics[i].rings.length; j++) {
                        rings.push(graphics[i].rings[j]);
                    }
                    var ringarry = [];
                    ringarry.push(rings);
                    geo = new dev.geom.MultiPolygon(ringarry);
                }
                else {
                    var polygon = graphics[i].rings[0];
                    geo = new dev.geom.Polygon([polygon]);
                }
                break;
        }
        geoms.push(geo);
    }
    return geoms;
};
/*投影转换*/
; (function ($) {
    dev.ProjectGeometry = function (args) {
        if (!args || !args.Map) return;
        this.Map = !args.Map ? null : args.Map;
        if (!args || !args.Platform) this.Platform = dev.Platform.HIGHGIS;
        else this.Platform = args.Platform;
    };
    $.extend(dev.ProjectGeometry.prototype, {
        Project: function (args) {
            if (!args || !args.Geom) return;
            var obj = this;
            QueryArcGISRest = function (args) {
                var inSR = !args.inSR ? 4326 : args.inSR;
                var outSR = !args.outSR ? 4326 : args.outSR;
                var Geometries = dev.GetGeometryJSONToArcGIS(args.Geom);
                var url = [
                    args.Url + "/project?",
                    "&inSR=" + inSR,
                    "&outSR=" + outSR,
                    "&geometries=" + Geometries,
                    "&f=json"
                ];
                $.ajax({
                    type: "GET",
                    url: url.join(''),
                    success: function (json) {
                        var data = { UserState: obj.UserState };
                        var result = $.evalJSON(json);
                        data.Result = CreateGeometiesResult();
                        if (!result || result.error) {
                            data.Succeed = false;
                            data.Msg = "提示：查询失败！";
                        } else {
                            data.Succeed = true;
                            //data.value = points2Feature(result);
                            data.Result.Geometies = dev.GetGeometiesForArcGIS(result.geometries, args.Geom.getType());
                        }
                        $(obj).trigger("ProjectCompleted", data);
                    },
                    error: function (info) {
                        var data = {
                            Succeed: false,
                            Msg: info,
                            UserState: obj.UserState
                        };
                        $(obj).trigger("ProjectCompleted", data);
                    }
                });
            }
            if (this.Platform === dev.Platform.ArcGIS) QueryArcGISRest(args);
            CreateGeometiesResult = function () {
                var res = {};
                res.Geometies = [];
                return res;
            };
        }
    });
})(jQuery);
/*比例尺控件*/
(function ($) {
    dev.scaleLineControl = function () {
    };
    $.extend(dev.scaleLineControl.prototype, {
        addControl: function (args) {
            if (!args || !args.Map) return;
            var scaleLineControl = new ol.control.ScaleLine();
            args.Map.addControl(scaleLineControl);
        }
    });
})(jQuery);

/*地图导出*/
; (function ($) {
    dev.ExportMap = function () {

    };
    $.extend(dev.ExportMap.prototype, {
        exportMap: function (args) {
            if (!args || !args.Map || !args.element) return;

            ////html2canvas2
            //var mapElem = dev.App.MapPanel.Map[0]; // the id of your map div here
            //html2canvas(mapElem, {
            //    useCORS: true,
            //    onrendered: function (canvas) {
            //        mapImg = canvas.toDataURL('image/png');
            //        var w = window.open('about:blank', 'image from canvas');
            //        w.document.write("<img src='" + mapImg + "' alt='from canvas'/>");
            //    }
            //});

            //转二进制流方式
            args.Map.once('postcompose', function (event) {
                var canvas = event.context.canvas;
                canvas.toBlob(function (blob) {
                    saveAs(blob, 'map.png');
                });
            });
            args.Map.renderSync();
        }
    });
    /* 功能：canvas转二进制流
   */
    (function (view) {
        "use strict";
        var
              Uint8Array = view.Uint8Array
            , HTMLCanvasElement = view.HTMLCanvasElement
            , canvas_proto = HTMLCanvasElement && HTMLCanvasElement.prototype
            , is_base64_regex = /\s*;\s*base64\s*(?:;|$)/i
            , to_data_url = "toDataURL"
            , base64_ranks
            , decode_base64 = function (base64) {
                var
                      len = base64.length
                    , buffer = new Uint8Array(len / 4 * 3 | 0)
                    , i = 0
                    , outptr = 0
                    , last = [0, 0]
                    , state = 0
                    , save = 0
                    , rank
                    , code
                    , undef
                ;
                while (len--) {
                    code = base64.charCodeAt(i++);
                    rank = base64_ranks[code - 43];
                    if (rank !== 255 && rank !== undef) {
                        last[1] = last[0];
                        last[0] = code;
                        save = (save << 6) | rank;
                        state++;
                        if (state === 4) {
                            buffer[outptr++] = save >>> 16;
                            if (last[1] !== 61 /* padding character */) {
                                buffer[outptr++] = save >>> 8;
                            }
                            if (last[0] !== 61 /* padding character */) {
                                buffer[outptr++] = save;
                            }
                            state = 0;
                        }
                    }
                }
                // 2/3 chance there's going to be some null bytes at the end, but that
                // doesn't really matter with most image formats.
                // If it somehow matters for you, truncate the buffer up outptr.
                return buffer;
            }
        ;
        if (Uint8Array) {
            base64_ranks = new Uint8Array([
                  62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1
                , -1, -1, 0, -1, -1, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
                , 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25
                , -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35
                , 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
            ]);
        }
        if (HTMLCanvasElement && !canvas_proto.toBlob) {
            canvas_proto.toBlob = function (callback, type /*, ...args*/) {
                if (!type) {
                    type = "image/png";
                } if (this.mozGetAsFile) {
                    callback(this.mozGetAsFile("canvas", type));
                    return;
                } if (this.msToBlob && /^\s*image\/png\s*(?:$|;)/i.test(type)) {
                    callback(this.msToBlob());
                    return;
                }

                var
                      args = Array.prototype.slice.call(arguments, 1)
                    , dataURI = this[to_data_url].apply(this, args)
                    , header_end = dataURI.indexOf(",")
                    , data = dataURI.substring(header_end + 1)
                    , is_base64 = is_base64_regex.test(dataURI.substring(0, header_end))
                    , blob
                ;
                if (Blob.fake) {
                    // no reason to decode a data: URI that's just going to become a data URI again
                    blob = new Blob
                    if (is_base64) {
                        blob.encoding = "base64";
                    } else {
                        blob.encoding = "URI";
                    }
                    blob.data = data;
                    blob.size = data.length;
                } else if (Uint8Array) {
                    if (is_base64) {
                        blob = new Blob([decode_base64(data)], { type: type });
                    } else {
                        blob = new Blob([decodeURIComponent(data)], { type: type });
                    }
                }
                callback(blob);
            };

            if (canvas_proto.toDataURLHD) {
                canvas_proto.toBlobHD = function () {
                    to_data_url = "toDataURLHD";
                    var blob = this.toBlob();
                    to_data_url = "toDataURL";
                    return blob;
                }
            } else {
                canvas_proto.toBlobHD = canvas_proto.toBlob;
            }
        }
    }(typeof self !== "undefined" && self || typeof window !== "undefined" && window || this.content || this));
    /* 功能：二进制流存到本地
 */
    var saveAs = saveAs || (function (view) {
        "use strict";
        // IE <10 is explicitly unsupported
        if (typeof navigator !== "undefined" && /MSIE [1-9]\./.test(navigator.userAgent)) {
            return;
        }
        var
              doc = view.document
              // only get URL when necessary in case Blob.js hasn't overridden it yet
            , get_URL = function () {
                return view.URL || view.webkitURL || view;
            }
            , save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
            , can_use_save_link = "download" in save_link
            , click = function (node) {
                var event = new MouseEvent("click");
                node.dispatchEvent(event);
            }
            , is_safari = /Version\/[\d\.]+.*Safari/.test(navigator.userAgent)
            , webkit_req_fs = view.webkitRequestFileSystem
            , req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
            , throw_outside = function (ex) {
                (view.setImmediate || view.setTimeout)(function () {
                    throw ex;
                }, 0);
            }
            , force_saveable_type = "application/octet-stream"
            , fs_min_size = 0
            // See https://code.google.com/p/chromium/issues/detail?id=375297#c7 and
            // https://github.com/eligrey/FileSaver.js/commit/485930a#commitcomment-8768047
            // for the reasoning behind the timeout and revocation flow
            , arbitrary_revoke_timeout = 500 // in ms
            , revoke = function (file) {
                var revoker = function () {
                    if (typeof file === "string") { // file is an object URL
                        get_URL().revokeObjectURL(file);
                    } else { // file is a File
                        file.remove();
                    }
                };
                if (view.chrome) {
                    revoker();
                } else {
                    setTimeout(revoker, arbitrary_revoke_timeout);
                }
            }
            , dispatch = function (filesaver, event_types, event) {
                event_types = [].concat(event_types);
                var i = event_types.length;
                while (i--) {
                    var listener = filesaver["on" + event_types[i]];
                    if (typeof listener === "function") {
                        try {
                            listener.call(filesaver, event || filesaver);
                        } catch (ex) {
                            throw_outside(ex);
                        }
                    }
                }
            }
            , auto_bom = function (blob) {
                // prepend BOM for UTF-8 XML and text/* types (including HTML)
                if (/^\s*(?:text\/\S*|application\/xml|\S*\/\S*\+xml)\s*;.*charset\s*=\s*utf-8/i.test(blob.type)) {
                    return new Blob(["\ufeff", blob], { type: blob.type });
                }
                return blob;
            }
            , FileSaver = function (blob, name, no_auto_bom) {
                if (!no_auto_bom) {
                    blob = auto_bom(blob);
                }
                // First try a.download, then web filesystem, then object URLs
                var
                      filesaver = this
                    , type = blob.type
                    , blob_changed = false
                    , object_url
                    , target_view
                    , dispatch_all = function () {
                        dispatch(filesaver, "writestart progress write writeend".split(" "));
                    }
                    // on any filesys errors revert to saving with object URLs
                    , fs_error = function () {
                        if (target_view && is_safari && typeof FileReader !== "undefined") {
                            // Safari doesn't allow downloading of blob urls
                            var reader = new FileReader();
                            reader.onloadend = function () {
                                var base64Data = reader.result;
                                target_view.location.href = "data:attachment/file" + base64Data.slice(base64Data.search(/[,;]/));
                                filesaver.readyState = filesaver.DONE;
                                dispatch_all();
                            };
                            reader.readAsDataURL(blob);
                            filesaver.readyState = filesaver.INIT;
                            return;
                        }
                        // don't create more object URLs than needed
                        if (blob_changed || !object_url) {
                            object_url = get_URL().createObjectURL(blob);
                        }
                        if (target_view) {
                            target_view.location.href = object_url;
                        } else {
                            var new_tab = view.open(object_url, "_blank");
                            if (new_tab == undefined && is_safari) {
                                //Apple do not allow window.open, see http://bit.ly/1kZffRI
                                view.location.href = object_url
                            }
                        }
                        filesaver.readyState = filesaver.DONE;
                        dispatch_all();
                        revoke(object_url);
                    }
                    , abortable = function (func) {
                        return function () {
                            if (filesaver.readyState !== filesaver.DONE) {
                                return func.apply(this, arguments);
                            }
                        };
                    }
                    , create_if_not_found = { create: true, exclusive: false }
                    , slice
                ;
                filesaver.readyState = filesaver.INIT;
                if (!name) {
                    name = "download";
                }
                if (can_use_save_link) {
                    object_url = get_URL().createObjectURL(blob);
                    save_link.href = object_url;
                    save_link.download = name;
                    setTimeout(function () {
                        click(save_link);
                        dispatch_all();
                        revoke(object_url);
                        filesaver.readyState = filesaver.DONE;
                    });
                    return;
                }
                // Object and web filesystem URLs have a problem saving in Google Chrome when
                // viewed in a tab, so I force save with application/octet-stream
                // http://code.google.com/p/chromium/issues/detail?id=91158
                // Update: Google errantly closed 91158, I submitted it again:
                // https://code.google.com/p/chromium/issues/detail?id=389642
                if (view.chrome && type && type !== force_saveable_type) {
                    slice = blob.slice || blob.webkitSlice;
                    blob = slice.call(blob, 0, blob.size, force_saveable_type);
                    blob_changed = true;
                }
                // Since I can't be sure that the guessed media type will trigger a download
                // in WebKit, I append .download to the filename.
                // https://bugs.webkit.org/show_bug.cgi?id=65440
                if (webkit_req_fs && name !== "download") {
                    name += ".download";
                }
                if (type === force_saveable_type || webkit_req_fs) {
                    target_view = view;
                }
                if (!req_fs) {
                    fs_error();
                    return;
                }
                fs_min_size += blob.size;
                req_fs(view.TEMPORARY, fs_min_size, abortable(function (fs) {
                    fs.root.getDirectory("saved", create_if_not_found, abortable(function (dir) {
                        var save = function () {
                            dir.getFile(name, create_if_not_found, abortable(function (file) {
                                file.createWriter(abortable(function (writer) {
                                    writer.onwriteend = function (event) {
                                        target_view.location.href = file.toURL();
                                        filesaver.readyState = filesaver.DONE;
                                        dispatch(filesaver, "writeend", event);
                                        revoke(file);
                                    };
                                    writer.onerror = function () {
                                        var error = writer.error;
                                        if (error.code !== error.ABORT_ERR) {
                                            fs_error();
                                        }
                                    };
                                    "writestart progress write abort".split(" ").forEach(function (event) {
                                        writer["on" + event] = filesaver["on" + event];
                                    });
                                    writer.write(blob);
                                    filesaver.abort = function () {
                                        writer.abort();
                                        filesaver.readyState = filesaver.DONE;
                                    };
                                    filesaver.readyState = filesaver.WRITING;
                                }), fs_error);
                            }), fs_error);
                        };
                        dir.getFile(name, { create: false }, abortable(function (file) {
                            // delete file if it already exists
                            file.remove();
                            save();
                        }), abortable(function (ex) {
                            if (ex.code === ex.NOT_FOUND_ERR) {
                                save();
                            } else {
                                fs_error();
                            }
                        }));
                    }), fs_error);
                }), fs_error);
            }
            , FS_proto = FileSaver.prototype
            , saveAs = function (blob, name, no_auto_bom) {
                return new FileSaver(blob, name, no_auto_bom);
            }
        ;
        // IE 10+ (native saveAs)
        if (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob) {
            return function (blob, name, no_auto_bom) {
                if (!no_auto_bom) {
                    blob = auto_bom(blob);
                }
                return navigator.msSaveOrOpenBlob(blob, name || "download");
            };
        }

        FS_proto.abort = function () {
            var filesaver = this;
            filesaver.readyState = filesaver.DONE;
            dispatch(filesaver, "abort");
        };
        FS_proto.readyState = FS_proto.INIT = 0;
        FS_proto.WRITING = 1;
        FS_proto.DONE = 2;

        FS_proto.error =
        FS_proto.onwritestart =
        FS_proto.onprogress =
        FS_proto.onwrite =
        FS_proto.onabort =
        FS_proto.onerror =
        FS_proto.onwriteend =
            null;

        return saveAs;
    }(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
    if (typeof module !== "undefined" && module.exports) {
        module.exports.saveAs = saveAs;
    } else if ((typeof define !== "undefined" && define !== null) && (define.amd != null)) {
        define([], function () {
            return saveAs;
        });
    }
})(jQuery);

/*WFS封装 */
; (function ($) {
    function resultformat(result) {
        var features = [];
        $.each(result, function (i, o) {
            var geoJson = new dev.format.GeoJSON();
            var feature = geoJson.readFeature(dev.toJSON(o));
            feature.setId(feature.getProperties().gid);
            features.push(feature);
        });
        return features;
    };
    function propertyformat(result, property) {
        var properties = [];
        var fields = property.split(",");
        $.each(result, function (i, o) {
            var data = {};
            for (var i = 0; i < fields.length; i++) {
                data[fields[i]] = o.properties[fields[i]];
            }
            properties.push(data);
        });
        return properties;
    };
    dev.WFS_H = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        this.Target = $({ id: "wfs" + new Date().getTime() });
        this.Url = opt.Url, this.TypeName = opt.TypeName;
        this.Token = dev.IsNull(opt.Token) ? null : opt.Token;
        this.SrsName = dev.IsNull(opt.SrsName) ? "EPSG:4326" : opt.SrsName;
        this.OutputFormat = dev.IsNull(opt.OutputFormat) ? "json" : opt.OutputFormat;
        this.PageIndex = dev.IsNumber(opt.PageIndex) ? opt.PageIndex : null;
        this.PageSize = dev.IsNumber(opt.PageSize) ? opt.PageSize : null;
        this.SortBy = dev.IsNull(opt.OrderBy) ? null : opt.OrderBy;
        this.CqlFilter = dev.IsNull(opt.CqlFilter) ? null : opt.CqlFilter;
        this.PropertyName = dev.IsNull(opt.PropertyName) ? null : opt.PropertyName;
        this.MaxFeatures = dev.IsNumber(opt.MaxFeatures) ? opt.MaxFeatures : null;
        this.RequestType = dev.IsNull(opt.RequestType) ? "get" : opt.RequestType.toLowerCase();
        this.IsProperty = dev.IsBoolean(opt.IsProperty) ? opt.IsProperty : false;
        this.Version = dev.IsNull(opt.Version) ? "2.0.0" : opt.Version;
        this.Async = dev.IsBoolean(opt.Async) ? opt.Async : true;
        this.Query = function (param) {
            var $this = this;
            if (!dev.IsNull(param)) {
                if (!dev.IsNull(param.Url)) this.Url = param.Url;
                if (!dev.IsNull(param.TypeName)) this.TypeName = param.TypeName;
                if (!dev.IsNull(param.FeatureNS)) this.FeatureNS = param.FeatureNS;
                if (dev.IsNumber(param.PageIndex)) this.PageIndex = param.PageIndex;
                if (dev.IsNumber(param.PageSize)) this.PageSize = param.PageSize;
                if (!dev.IsNull(param.SrsName)) this.SrsName = param.SrsName;
                if (!dev.IsNull(param.CqlFilter)) this.CqlFilter = param.CqlFilter;
                if (!dev.IsNull(param.PropertyName)) this.PropertyName = param.PropertyName;
                if (!dev.IsNull(param.OrderBy)) this.SortBy = param.OrderBy;
                if (!dev.IsNull(param.OutputFormat)) this.OutputFormat = param.OutputFormat;
                if (!dev.IsNull(param.RequestType)) this.RequestType = param.RequestType.toLowerCase();
                if (dev.IsNumber(param.MaxFeatures)) this.MaxFeatures = param.MaxFeatures;
                if (dev.IsBoolean(param.IsProperty)) this.IsProperty = param.IsProperty;
                if (!dev.IsNull(param.Token)) this.Token = param.Token;
                if (!dev.IsNull(param.Version)) this.Version = param.Version;
                if (dev.IsBoolean(param.Async)) this.Async = param.Async;
            }
            var requestParam = {
                cache: false,
                url: this.Url,
                dataType: 'json',
                type: this.RequestType,
                async: this.Async,
                contentType: "application/json;charset=utf-8",
                success: function (result) {//返回状态码，结果集, 分页信息，成功消息
                    var resultdata = $this.IsProperty ? propertyformat(result.features, $this.PropertyName) : resultformat(result.features);
                    var data = { data: resultdata, message: "查询成功！", statusCode: 200 }
                    if (!dev.IsNull($this.Token)) data.Token = $this.Token;
                    if (!dev.IsNull($this.PageIndex)) {
                        if (!dev.IsNull($this.PageIndex) && !dev.IsNull($this.PageSize)) data.pageInfo = { totalCount: result.totalFeatures, pageIndex: $this.PageIndex, pageSize: $this.PageSize };
                        if (!dev.IsNull(data.data) && data.data.length < $this.PageSize) data.pageInfo.totalCount = ($this.PageIndex - 1) * $this.PageSize + data.data.length;
                    }
                    $this.Target.trigger("onQueryCompleted", data);
                },
                error: function (error, status, message) {//返回状态码，结果集, 分页信息，失败消息
                    var data = { data: null, message: message.message, statusCode: 400 }
                    if (!dev.IsNull($this.Token)) data.Token = $this.Token
                    if (!dev.IsNull($this.PageIndex) && !dev.IsNull($this.PageSize)) data.pageInfo = { totalCount: 0, pageIndex: $this.PageIndex, pageSize: $this.PageSize };
                    $this.Target.trigger("onQueryCompleted", data);
                }
            };
            if (dev.IsNull(this.Url) || dev.IsNull(this.TypeName)) {
                var data = { data: null, message: "请检查传入参数！", statusCode: 500 };
                $this.Target.trigger("onQueryCompleted", data); return;
            }
            requestParam.url = this.Url.split("?")[0] + "?service=wfs&request=GetFeature&typename=" + this.TypeName
                + "&srsname=" + this.SrsName + "&outputFormat=" + this.OutputFormat + "&version=" + this.Version;
            if (this.SortBy != null) requestParam.url += "&sortBy=" + this.SortBy;//排序字段
            if (this.PageIndex != null) requestParam.url += "&startIndex=" + ((this.PageIndex - 1) * this.PageSize);
            if (this.PageSize != null) requestParam.url += "&count=" + this.PageSize;//返回最大记录总数
            if (this.PropertyName != null) requestParam.url += "&propertyName=" + this.PropertyName;//返回的属性字段
            if (this.MaxFeatures != null) requestParam.url += "&maxFeatures=" + this.MaxFeatures;//返回最大记录总数
            if (this.CqlFilter != null) {
                this.CqlFilter = this.CqlFilter.replace(/and\s*1=1|AND\s*1=1|1=1\s*AND|1=1\s*and|1=1\s*OR|1=1\s*or|1=1\s*/, "");
                requestParam.url += "&cql_filter=" + encodeURI(this.CqlFilter.trim());
            }//将查询条件进行转码
            $.ajax(requestParam);
        }
    };
    //查询多个图层
    dev.Querys = function (opt) {
        this.Params = opt;
        this.Target = $({ id: "querys" + new Date().getTime() });
        this.Query = function (param) {
            if (!dev.IsNull(param)) this.Params = param;
            if (dev.IsNull(this.Params) || this.Params.length == 0) return;
            var $this = this, result = [], index = 0;
            var wfs = new dev.WFS_H($this.Params[index]);
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
    dev.PointerQuery = function (opt) {
        if (dev.measureState) return null;
        opt.Async = false;
        this.IsConvert = dev.IsBoolean(opt.IsConvert) ? opt.IsConvert : true;
        $.extend(this, new dev.WFS_H(opt));
        var $this = this;
        var features;
        (function (point, map, px) {
            if (dev.IsNull(px)) px = 0;
            var ext = dev.MapUtils.GetExtentByMapClick(point, map, px);
            if (dev.IsNull(ext)) return;
            var mapproj = map.getView().getProjection();
            if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) ext.transform(mapproj.getCode(), dev.App.Config.SystemMap.DataEPSG);
            var condition = dev.IsNull(opt.CqlFilter) ? "" : "(" + opt.CqlFilter + ")" + " AND ";
            var wkt = dev.GetWKTByFeature(new dev.Feature(ext), $this.IsConvert);
            condition += dev.MapUtils.GetCql_INTERSECTS(wkt, opt.GeometryName);
            $this.Target.one("onQueryCompleted", function (s, e) {
                features = e.data;
            });
            $this.Query({ CqlFilter: condition });
        })(opt.Point, opt.Map, opt.PX);
        return features;
    };
})(jQuery);

/* 描述：ExportMap(导出地图) */
; (function ($) {
    dev.ExportM = function (options) {
        if (!dev.IsNull(options) && !dev.IsNull(options.Map)) this.Map = options.Map;
        else this.Map = dev.App.Map
    };
    $.extend(dev.ExportM.prototype, {
        Export: function (userState) {
            var $this = this;
            $this.UserState = userState;
            this.Map.updateSize();
            this.Map.once('postcompose', function (event) {
                var canvas = event.context.canvas;
                var data = canvas.toDataURL('image/png');
                $($this).trigger("ExportMapCompleted", data);
                dev.App.EventObject.trigger("ExportMapCompleted", data);
            });
        }
    });
})(jQuery);

