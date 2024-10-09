if (!dev) dev = ol;
/*初始化3D图形*/
; (function ($) {
    var tilt_
    dev.InitSMap3D = function (Config, isdisplay) {
        var config3d = Config.SystemMap.Map3DInfo;
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
            selectionIndicator: false,
            shouldAnimate: true,
            creditContainer: $('<div></div>')[0]
        });
        if (!dev.IsNull(isdisplay) && isdisplay)
            dev.App.Map3D.extend(Cesium.viewerCesiumNavigationMixin, {});

        var layers = dev.App.Map3D.scene.globe.imageryLayers;
        layers.removeAll();
        layers.addImageryProvider(Cesium.createTileMapServiceImageryProvider({
            url: dev.MapLoad.GetUrlByRelID("Basic3D"),
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
            url: dev.MapLoad.GetUrlByRelID("Terrain3D"),
            requestWaterMask: true,
            requestVertexNormals: true
        });
        var ext = Config.SystemMap.Extent;
        var beginpoint = [parseFloat(ext.XMin), parseFloat(ext.YMin)];
        var endpoint = [parseFloat(ext.XMax), parseFloat(ext.YMax)];
        dev.Map3DUtils.SetView(beginpoint, endpoint);
        //加载图层
        var baselayersconfig = Config.SystemMap.LayerInfo.BaseLayers;
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
                    ex = ol.proj.transformExtent(ex, mapproj.getCode(), dev.App.Config.SystemMap.DataEPSG);
                }
                if (dev.IsNull(ex) || isNaN(ex[0]) || isNaN(ex[1]) || isNaN(ex[2]) || isNaN(ex[3])) return;
                dev.Map3DUtils.SetView([ex[0], ex[1]], [ex[2], ex[3]]);
            });
            dev.App.Map.on("pointerdrag", function () {
                dev.App._is2dmove = true;
                if (dev.App._Is3dmove || dev.App._is3dwheel) { dev.App._Is3dmove = false; dev.App._is3dwheel = false; return; }
                var mapproj = dev.App.Map.getView().getProjection();
                var ex = dev.App.Map.getView().calculateExtent(dev.App.Map.getSize());
                if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
                    ex = ol.proj.transformExtent(ex, mapproj.getCode(), dev.App.Config.SystemMap.DataEPSG);
                }
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
            if (mapproj.getCode() != "EPSG:4326") c_center = ol.proj.transform(c_center, "EPSG:4326", mapproj.getCode());
            if (!dev.IsNull(dev.App.Map))
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
        if (!dev.IsNull(isdisplay) && isdisplay) {
            //地图测量
            var tool_3d = $('<div title="测量长度" style="width:30px;height:30px;z-index:2;position:absolute;right:120px;top:125px;background:rgba(0,0,0,0.4);border:1px solid #999;"><div style="width:16px;height:16px; margin-left: 7px; margin-top: 7px;" class="icon icon-maptool-measuredistance"></div></div>');
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
            var tool_measureArea = $('<div title="测量面积" style="width:30px;height:30px;z-index:2;position:absolute;right:158px;top:125px;background:rgba(0,0,0,0.4);border:1px solid #999;"><div style="width:16px;height:16px; margin-left: 7px; margin-top: 7px;" class="icon icon-maptool-measurearea"></div></div>');
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
            var tool_3dlayer = $('<div title="专题图层" style="width:30px;height:30px;z-index:2;position:absolute;top:125px;right:200px;background:rgba(0,0,0,0.4);border:1px solid #999;"><div style="width:16px;height:16px; margin-left: 7px; margin-top: 7px;" class="icon icon-maptool-topic"></div></div>');
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
                        CSS: { "top": "160px", "right": "120px" },
                        Title: "专题图层",
                        Width: 376,
                        Draggable: "false",
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
        }
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
                //url: GetRootPath() + "Scene/Production_3.json",
                maximumScreenSpaceError: 1,
                maximumNumberOfLoadedTiles: 1000
            });
            tile3dlayer.id = args.Value;
            dev.App.Map3D.scene.primitives.add(tile3dlayer);

            //dev.App.Map3D.scene.primitives.lowerToBottom();
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
                point = ol.proj.transform(point, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
            }
            if (!dev.IsNull(dev.App.Map)) {
                dev.App.Map.getView().setCenter(point);
                dev.App.Map.getView().setResolution(this.CalcResolutionForDistance(distance, bestTargetCartographic ? bestTargetCartographic.latitude : 0));
            }
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
                if (dev.App.MapAngleLink && !dev.IsNull(dev.App.Map)) dev.App.Map.getView().setRotation((orientation < 0 ? heading : -heading));
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
            //var points = dev.App.Map3D.scene.primitives.add(new Cesium.PointPrimitiveCollection());
            //points.add({
            //    position: new Cesium.Cartesian3(126.83666471850711, 45.83915515228301, 0),
            //    pixelSize: 30,
            //    scaleByDistance:new Cesium.NearFarScalar(1.5e2, 15, 8.0e6, 0.0),
            //    color: Cesium.Color.RED
            //});


            //points.add({
            //    position: new Cesium.Cartesian3(0, 0, 30000),
            //    show: true,
            //    pixelSize: 30,
            //    color: Cesium.Color.RED
            //});

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
            np.point.height = 30000;
            //var polygonentity = new Cesium.Entity({
            //    id: "point1",
            //    name: "test",
            //    polygon: new Cesium.PolygonGraphics({
            //        hierarchy: Cesium.Cartesian3.fromDegreesArray([
            //            126.83666471850711, 45.83915515228301,
            //            126.8423724592908, 45.84074302001983,
            //            126.84430364978152, 45.836837723694145,
            //            126.84129957568484, 45.83400531097442,
            //            126.83662180316287, 45.834863617859185,
            //            126.83666471850711, 45.83915515228301
            //        ]),
            //        material: Cesium.Color.RED.withAlpha(0.5),
            //        outline: true,
            //        outlineColor:Cesium.Color.Blue
            //    })
            //});
            //dev.App.Map3D.entities.add(polygonentity);
            //var point = entity.point;
            //point.pixelSize = 20;
            //point.color = Cesium.Color.RED.withAlpha(0.33);
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
            var layer = new ol.layer.Tile({
                id: args.ID,
                opacity: 1.0,
                target: dev.IsNull(args.LayerInfo) ? null : args.LayerInfo,
                extent: args.Exent,
                visible: args.Visible,
                source: new ol.source.TileArcGISRest({
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
                    if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) extent = ol.proj.transformExtent(extent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
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
                var layer = new ol.layer.Image({
                    id: args.ID,
                    tag: args.Tag,
                    extent: extent,
                    zIndex: dev.IsNull(args.ZIndex) ? 0 : args.ZIndex,
                    opacity: dev.IsNull(args.Opacity) ? 1.0 : args.Opacity,
                    visible: dev.IsBoolean(args.Visible) ? args.Visible : true,
                    source: new ol.source.ImageWMS({
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
                var layer = new ol.layer.Tile({
                    id: args.ID,
                    tag: args.Tag,
                    extent: args.Extent,
                    zIndex: dev.IsNull(args.ZIndex) ? 0 : args.ZIndex,
                    opacity: dev.IsNull(args.Opacity) ? 1.0 : args.Opacity,
                    visible: dev.IsBoolean(args.Visible) ? args.Visible : true,
                    source: new ol.source.TileWMS({
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
            var projection = ol.proj.get(args.EPSG);
            var projectionExtent = projection.getExtent();
            var size = ol.extent.getWidth(projectionExtent) / 256;
            var resolutions = [];
            if (projection.getCode() == "EPSG:4326") resolutions.push(parseFloat(dev.App.Config.SystemMap.LevelInfo.Levels[0].Resolution));
            if (projection.getCode() == "EPSG:3857") resolutions.push(parseFloat(dev.App.Config.SystemMap.LevelInfo.Levels[0].Resolution3857));
            for (var z = 0; z < args.Level ; z++) resolutions.push(resolutions[z] / 2);
            var matrixIds = new Array(args.Level);
            for (var z = 0; z < args.Level; z++) { matrixIds[z] = args.EPSG + ":" + z; }
            if (dev.IsNull(args.Type)) args.Type = dev.LayerType.Tile;
            var layer = new ol.layer.Tile({
                id: args.ID,
                opacity: dev.IsNull(args.Opacity) ? 1.0 : args.Opacity,
                zIndex: dev.IsNull(args.ZIndex) ? 0 : args.ZIndex,
                extent: args.Extent,
                visible: dev.IsBoolean(args.Visible) ? args.Visible : true,
                source: new ol.source.WMTS({
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
            var layer = new ol.layer.Tile({
                id: args.ID,
                tag: args.Tag,
                extent: ol.proj.transformExtent(args.Extent, "EPSG:102100", "EPSG:4326"),
                zIndex: dev.IsNull(args.ZIndex) ? 0 : args.ZIndex,
                opacity: dev.IsNull(args.Opacity) ? 1.0 : args.Opacity,
                visible: dev.IsBoolean(args.Visible) ? args.Visible : true,
                source: new ol.source.XYZ({
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
            var layer = new ol.layer.Tile({
                id: args.ID,
                tag: args.Tag,
                zIndex: dev.IsNull(args.ZIndex) ? 0 : args.ZIndex,
                opacity: dev.IsNull(args.Opacity) ? 1.0 : args.Opacity,
                visible: dev.IsBoolean(args.Visible) ? args.Visible : true,
                source: new ol.source.XYZ({
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
                    tileGrid: new ol.tilegrid.TileGrid({
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
            if (epsg == ol.proj.get("EPSG:4326")) resolutions[0] = parseFloat(dev.App.Config.SystemMap.LevelInfo.Levels[0].Resolution);
            else resolutions[0] = parseFloat(dev.App.Config.SystemMap.LevelInfo.Levels[0].Resolution3857);
            for (var i = 1; i < resolutions.length; i++) resolutions[i] = resolutions[i - 1] / 2;
            var layer = new ol.layer.Tile({
                id: args.ID,
                tag: args.Tag,
                zIndex: dev.IsNull(args.ZIndex) ? 0 : args.ZIndex,
                opacity: dev.IsNull(args.Opacity) ? 1.0 : args.Opacity,
                visible: dev.IsBoolean(args.Visible) ? args.Visible : true,
                source: new ol.source.XYZ({
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
                if (dev.App.Config.SystemMap.DataEPSG != mapproj.getCode()) args.Extent = ol.proj.transformExtent(args.Extent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
            }
            var projection = ol.proj.get(args.EPSG);
            var projectionExtent = projection.getExtent();
            var size = ol.extent.getWidth(projectionExtent) / 256;
            var resolutions = [];
            if (projection.getCode() == "EPSG:4326") resolutions.push(parseFloat(dev.App.Config.SystemMap.LevelInfo.Levels[0].Resolution));
            if (projection.getCode() == "EPSG:3857") resolutions.push(parseFloat(dev.App.Config.SystemMap.LevelInfo.Levels[0].Resolution3857));
            for (var z = 0; z < args.Level ; z++) resolutions.push(resolutions[z] / 2);
            var matrixIds = new Array(args.Level);
            for (var z = 0; z < args.Level; z++) { matrixIds[z] = args.EPSG + ":" + z; }
            if (dev.IsNull(args.Type)) args.Type = dev.LayerType.Tile;
            var layer = new ol.layer.Tile({
                id: args.ID,
                opacity: dev.IsNull(args.Opacity) ? 1.0 : args.Opacity,
                zIndex: dev.IsNull(args.ZIndex) ? 0 : args.ZIndex,
                extent: args.Extent,
                visible: dev.IsBoolean(args.Visible) ? args.Visible : true,
                source: new ol.source.WMTS({
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
            var projection = ol.proj.get(args.EPSG);
            if (dev.IsNull(args.Extent)) {
                var mapproj = param.Map.getView().getProjection();
                if (dev.App.Config.SystemMap.DataEPSG != mapproj.getCode()) args.Extent = ol.proj.transformExtent(args.Extent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
            }
            //projection.setExtent([-180, -85.05112877980659, 180, 85.05112877980659]);
            var projectionExtent = projection.getExtent();
            var size = ol.extent.getWidth(projectionExtent) / 256;
            var resolutions = [parseFloat(args.Resolution)];
            args.MaxLevel = parseInt(args.MaxLevel);
            args.MinLevel = parseInt(args.MinLevel);
            var value = args.MaxLevel - args.MinLevel + 1;
            for (var z = 0; z <= value - 2; z++) resolutions.push(resolutions[z] / 2);
            var matrixIds = [];
            for (var z = args.MinLevel; z <= args.MaxLevel; z++) { matrixIds.push(z); }
            var layer = new ol.layer.Tile({
                id: args.ID,
                opacity: dev.IsNull(args.Opacity) ? 1.0 : args.Opacity,
                zIndex: dev.IsNull(args.ZIndex) ? 0 : args.ZIndex,
                extent: args.Extent,
                visible: dev.IsBoolean(args.Visible) ? args.Visible : true,
                source: new ol.source.WMTS({
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
            var layer = new ol.layer.Tile({
                source: new ol.source.XYZ({
                    url: args.Url
                }), opacity: 1.0
            });
            args.Map.addLayer(layer);
            var coor = ol.proj.transform([116.40969, 39.89945], 'EPSG:4326', 'EPSG:3857');
            var view = new ol.View({
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
            else style = new ol.style.Style({
                stroke: new ol.style.Stroke({ width: 3, color: [255, 0, 0, 1] }),
                fill: new ol.style.Fill({ color: [0, 0, 255, 0.6] }),
                image: new ol.style.Circle({ radius: 2, fill: new ol.style.Fill({ color: '#f00' }) })
            });
            if (!dev.IsNull(args.url)) source.url = args.Url;
            if (!dev.IsNull(args.Features)) source.features = args.Features;
            var layer = new ol.layer.Vector({
                id: args.ID,
                opacity: 1.0,
                zIndex: 9999,
                type: dev.IsNull(args.LayerInfo) ? "vector" : args.LayerInfo.Type,
                extent: args.Extent,
                visible: dev.IsBoolean(args.Visible) ? true : args.Visible,
                source: new ol.source.Vector(source),
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
            ol.Project.DefinedProject(args.EPSG.split(":")[1]);
            $.ajax({
                url: args.url + "?Request=GetCapabilities&t=" + new Date().getTime(),
                dataType: 'text',
                type: 'GET',
                timeout: 2000,
                async: false,
                cache: false,
                success: function (xml) {
                    var result = new ol.format.WMTSCapabilities().read(xml);
                    option = ol.source.WMTS.optionsFromCapabilities(result, config);
                    option.wrapX = false;
                    var layer = new ol.layer.Tile({
                        id: args.id,
                        opacity: 1.0,
                        zIndex: dev.IsNull(args.zIndex) ? 0 : args.zIndex,
                        source: new ol.source.WMTS(option)
                    });
                    dev.App.Map.addLayer(layer);
                    if (dev.App.MapEPSG !== option.projection.getCode()) {
                        var unit = dev.Project.GetUnitByEPSG(option.projection.getCode().split(":")[1]);
                        var projection = new ol.proj.Projection({
                            code: option.projection.getCode(),
                            units: unit,
                            axisOrientation: 'neu'
                        });
                        dev.App.Map.setView(new ol.View({
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
        InitMap: function (config, iscursor) {
            if (!dev.IsNull(iscursor) && iscursor) {
                dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "image/hands.cur),auto");
                //点击事件
                var isdrag = false;
                dev.App.Map.on('pointerdrag', function (evt) {
                    if (dev.measureState || dev.queryState || dev.drawstate) return;
                    isdrag = true;
                    dev.App.MapPanel.MapDOM.css("cursor", 'url(' + dev.App.Root + 'image/handm.cur),auto');
                });
                dev.App.Map.on("moveend", function () {
                    if (dev.measureState || dev.queryState || dev.drawstate) return;
                    isdrag = false;
                    dev.App.MapPanel.MapDOM.css("cursor", "url(" + dev.App.Root + "image/hands.cur),auto");
                });
            }
            for (var i = 0; i < config.LayerInfo.BaseLayers.length; i++) {
                if (dev.IsNull(config.LayerInfo.BaseLayers[i].Url) || config.LayerInfo.BaseLayers[i].Url.indexOf("http") >= 0) continue;
                if (!dev.IsNull(config.LayerInfo.BaseLayers[i].Url3857)) config.LayerInfo.BaseLayers[i].Url3857 = dev.GetSystemUrlByRelID(config.LayerInfo.BaseLayers[i].Url3857);
                config.LayerInfo.BaseLayers[i].Url = dev.MapLoad.GetUrlByRelID(config.LayerInfo.BaseLayers[i].Url);
            }
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
                        //dev.MapLoad.AddArcGISLayer(param);
                        break;
                    case dev.LayerType.Tile:
                        param.Url = baseLayers[i].Url;
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
                        //dev.MapLoad.AddTileWMSLayer(baseLayers[i]);
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
                        if (baseLayers[i].Map.getView().getProjection() == ol.proj.get("EPSG:4326")) dev.MapLoad.AddTileXYZLayer2(baseLayers[i]);
                        else dev.MapLoad.AddTileXYZLayer3(baseLayers[i]);
                        break;
                    case dev.LayerType.TempVector:
                        param.Url = baseLayers[i].Url;
                        if (!dev.IsNull(baseLayers[i].Envelop)) {
                            var arr = baseLayers[i].Envelop.split(',');
                            param.Extent = [parseFloat(arr[0]), parseFloat(arr[1]), parseFloat(arr[2]), parseFloat(arr[3])];
                        }
                        param.Style = new ol.style.Style({
                            stroke: new ol.style.Stroke({ width: 2, color: 'rgba(237, 117, 65, 1)' }),
                            fill: new ol.style.Fill({ color: [236, 179, 73, 0.2] }),
                            image: new ol.style.Circle({
                                radius: 3,
                                stroke: new ol.style.Stroke({
                                    width: 2,
                                    color: 'rgba(237, 117, 65, 1)'
                                }),
                                fill: new ol.style.Fill({
                                    color: 'rgba(255, 255, 255, 0.6)'
                                })
                            })
                        });
                        dev.MapLoad.AddVectorLayer(param);
                        break;
                }
            }
        },
        /*根据ID获取相对地址*/
        GetUrlByRelID: function (relativeid) {
            var relurls = Config.SystemUri.RelativeUris;
            if (dev.IsNull(relurls) || relurls.length === 0) return "";
            var relativeInfo = Enumerable.From(relurls).Where('s=>s.ID==="' + relativeid + '"').ToArray();
            if (relativeInfo.length === 0) return "";
            var relativuri = relativeInfo[0].Uri;
            var basicid = relativeInfo[0].BasicID;
            if (dev.IsNull(basicid)) return relativuri;
            var basicuri = dev.MapLoad.GetUrlByBasicID(basicid);
            return basicuri + relativuri;
        },
        /*根据ID获取基础地址*/
        GetUrlByBasicID: function (basicid) {
            var basicurls = Config.SystemUri.BasicUris;
            if (dev.IsNull(basicurls) || basicurls.length === 0) return "";
            var basicInfo = Enumerable.From(basicurls).Where('s=>s.ID==="' + basicid + '"').ToArray();
            if (basicInfo.length === 0) return "";
            else return basicInfo[0].Uri;
        },
        //初始化地图切换
        InitMapSwitch: function (Config, pestsMap) {
            if (dev.IsNull(Config.SystemMap.MapSwitchInfo) || Config.SystemMap.MapSwitchInfo.length == 0) return;
            var param = $.extend({
                Parent: pestsMap
            }, Config.SystemMap.MapSwitchInfo);
            dev.App.MapSwitch = new dev.UCMapSwitchshow(param);
        },
        GetSLDString: function (typeName, strrule, IsFeatureStyle) {
            if (dev.IsNull(typeName) || dev.IsNull(strrule)) return "";
            var strsld = dev.MapUtils.LoadSLD("config/templet.sld");
            strsld = strsld.replace("%LayerName%", typeName);
            if (IsFeatureStyle == true) strsld = strsld.replace("%FeatureTypeStyle%", strrule);
            else strsld = strsld.replace("%FeatureTypeStyle%", "<FeatureTypeStyle>" + strrule + "</FeatureTypeStyle>");
            return strsld;
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
                url: "../" + url,
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
                var style = new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: radius,
                        snapToPixel: false,
                        stroke: new ol.style.Stroke({
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
                var style = new ol.style.Style({
                    image: new ol.style.Circle({
                        radius: radius,
                        snapToPixel: true,
                        stroke: new ol.style.Stroke({
                            color: dev.IsNull(borderrgba) ? 'rgba(255, 0, 0, 1)' : borderrgba,
                            width: 1
                        }),
                        fill: new ol.style.Fill({ color: dev.IsNull(fillrgba) ? 'rgba(255, 0, 0, 0.4)' : fillrgba }),
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
            if (dev.IsNull(clear_feature)) return;
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
                var style = new ol.style.Style({
                    stroke: new ol.style.Stroke({ width: 1, color: colors[lineColorIndex] }),
                    fill: new ol.style.Fill({ color: fillcolors[lineColorIndex] })
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
                var style = new ol.style.Style({
                    stroke: new ol.style.Stroke({ width: 1, color: colors[lineColorIndex] }),
                    fill: new ol.style.Fill({ color: fillcolors[lineColorIndex] })
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
        GetExtentByMapClick: function (point, map, px) {
            if (dev.IsNull(point)) return;
            if (dev.IsNull(map)) map = dev.App.Map;
            var clientSize = map.getSize();
            if (dev.IsNull(px) || !dev.IsNumber(px)) px = 2;
            var extent = map.getView().calculateExtent(clientSize);
            var clientWidth = clientSize[0], clientHeight = clientSize[1];
            var latdistance = extent[2] - extent[0], londistance = extent[3] - extent[1];
            var pixwR = (latdistance / clientWidth) * px, pixhR = (londistance / clientHeight) * px;
            var radius = Math.sqrt(Math.pow(pixwR, 2) + Math.pow(pixhR, 2));
            var xMin = point[0] - radius, yMin = point[1] - radius, xMax = point[0] + radius, yMax = point[1] + radius;
            return ol.geom.Polygon.fromExtent([xMin, yMin, xMax, yMax]);
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
        var strwkt = new ol.format.WKT().writeFeature(optFeature);
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
/*UCMapSwitchshow*/
(function ($) {
    dev.UCMapSwitchshow = function (opt) {
        if (dev.IsNull(opt)) opt = { ID: "MapSwitch" + new Date().getTime() };
        if (dev.IsNull(opt.Target)) opt.Target = $('<div class="MapSwitch" style="height: 98%;background: transparent;right:6px;top:2px;width:90px"></div>');
        this.SwitchMaps = Enumerable.From(opt.SwitchMaps).Where("s=>s.IsFloat==='true'").ToArray();
        $.extend(this, new dev.Control(opt));
        this.SwitchMaps = Enumerable.From(this.SwitchMaps).OrderBy('s=>s.Order').ToArray();
        var $this = this;
        var types = [];
        for (var i = 0; i < this.SwitchMaps.length; i++) {
            types.push(this.SwitchMaps[i].Type);
            var div = $('<div id="' + this.SwitchMaps[i].ID + '" class="msh" style="position: absolute; z-Index: 99;top: 1px;border: 1px solid #f3f5f6;width:90px;height:60px;top:calc(70*' + i + 'px);display:block;background-image:url(../' + this.SwitchMaps[i].BackImg + ');"></div>');
            div.mouseover(function () {
                var id = $(this).attr("id");
                $("#" + id + "content").css({ "background-color": "#0000FF", "opacity": "0.8", "filter": "alpha(opacity:80)" });
                $(this).css({ "border": "1px solid #979393" });
            }).mouseleave(function () {
                var id = $(this).attr("id");
                $("#" + id + "content").css({ "background-color": "#000000", "opacity": "0.3", "filter": "alpha(opacity:30)" });
                $(this).css({ "border": "1px solid #f3f5f6" });
            }).click(function () {
                var id = $(this).attr("id");
                var currType = $("#" + id + "text").attr("tag");
                var checkcontrol = $(".dev-checkbox", $(this)).prop("$this");
                var check;
                if (!dev.IsNull(checkcontrol)) {
                    check = true;
                    checkcontrol.Target.attr("_checked") == "true";
                }
                $this.Target.triggerHandler("onSwitchClick", { did: id, type: currType, check: check });
            });
            var contentid = this.SwitchMaps[i].ID + "content";
            var divcontent = $('<div id="' + contentid + '" class="MapSwitch-ContentTip" style="margin-top:40px;"></div>');
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
                $('input[type=checkbox]', checkboxdiv).css("opacity", "1")
            }
            div.appendTo(this.Target);
        }
        this.MapTypes = types;
        this.Target.mouseleave(function () {
            var childrens = $(this).children();
            $(this).css({ width: "90px" });
        });
        this.Target.appendTo(opt.Parent);
    };
    $.fn.extend(dev.UCMapSwitchshow.prototype, {
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
/*投影转换*/
(function ($) {
    dev.projTransf = function (opt) {
        var crstools = $('<div class="crstools"></div>');
        if (!dev.IsNull(opt) && !dev.IsNull(opt.top)) {
            crstools.css({ "top": opt.top });
        }
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
        });
        crstext.mouseover(function () { $(".crstoolspanel", dev.App.MapPanel.MapDOM).css("display", "block"); }).mouseleave(function () { $(".crstoolspanel", dev.App.MapPanel.MapDOM).css("display", "none"); });
        var crstoolpanel = $('<div class="crstoolspanel"></div>');
        if (!dev.IsNull(opt) && !dev.IsNull(opt.crstoolpanel_top)) {
            crstoolpanel.css({ "top": opt.crstoolpanel_top });
        }
        crstoolpanel.mouseover(function () {
            $(".crstoolspanel", dev.App.MapPanel.MapDOM).css("display", "block");
        }).mouseleave(function () {
            $(".crstoolspanel", dev.App.MapPanel.MapDOM).css("display", "none");
        });
        var itemearth = $('<div class="item" tag="EPSG:3857"><div class="selectedimgpanel"></div><div style="height:30px;width:65px;text-align:left;line-height:30px;display:inline-block;">球面墨卡托</div></div>').appendTo(crstoolpanel);
        var itemearth1 = $('<div class="item" tag="EPSG:4326"><div class="selectedimgpanel"></div><div style="height:30px;width:60px;text-align:left;line-height:30px;display:inline-block;">经纬度</div></div>').appendTo(crstoolpanel);
        dev.App.MapPanel.MapDOM.append(crstoolpanel);
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
            dev.proj = ol.proj;
            dev.View = ol.View
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
})(jQuery);
//FillPanel(填充容器[右下])
(function ($) {
    dev.FillPanel = function (opt) {
        if (dev.IsNull(opt)) return;
        this.Target = opt;
    };
    $.fn.extend(dev.FillPanel.prototype, {
        Add: function (element, params, id) {
            var $this = this;
            if (dev.IsString(element)) {
                this.Target.trigger("onClosing", { element: $this, id: $this.ID });
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
            if (element[0].tagName.toLowerCase() == "iframe") this.Target.trigger("onClosing");
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
/*WFS封装 */
; (function ($) {
    function resultformat(result) {
        var features = [];
        $.each(result, function (i, o) {
            var geoJson = new ol.format.GeoJSON();
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
    dev.ShowWFS_H = function (opt) {
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
})(jQuery);
function GetRootPath() {
    var pathName = window.document.location.pathname;
    var localhost = window.location.host;
    var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
    return ("http://" + localhost + projectName + "/");
}
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
        var config = Config.Extend.LayerForTree.LayerRoot.clone();
        var layerinfoparent = Enumerable.From(config).Where('s=>s.ID=="streetlayer"').FirstOrDefault();
        if (!dev.IsNull(layerinfoparent) && !dev.IsNull(layerinfoparent.Child)) {
            if (dev.IsNull(layerinfoparent.Child.length)) layerinfoparent.Child = [layerinfoparent.Child];
        }
        return layerinfoparent.Child;
    }
    dev.ShowStreetView = function (opt) {
        if (dev.IsNull(opt)) opt = {};
        //获取图层信息
        this.ID = dev.IsNull(opt.ID) ? "streeview" + new Date().getTime() : opt.ID;
        this.SrsName = dev.IsNull(opt.SrsName) ? "EPSG:4326" : opt.SrsName;
        this.OutputFormat = dev.IsNull(opt.OutputFormat) ? "json" : opt.OutputFormat;
        this.Version = dev.IsNull(opt.Version) ? "2.0.0" : opt.Version;
        this.CqlFilter = opt.CqlFilter;
        this.IMGUrl = dev.IsNull(opt.IMGUrl) ? dev.MapLoad.GetUrlByRelID("StreetIMGView") : opt.IMGUrl;
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
        var maindiv = $('<div class="main" id="streetControl" style="position:absolute; top: 0px; height: 100%; width: 100%; left: 0px;margin:0;background-color: white;display:none;z-index:10005"><div class="container"></div> </div>');
        maindiv.appendTo(dev.App.MapPanel.MapStreet);
        var advancebtn = $('<div class="btn" btntype="next" tag="0" style="width:103px;height:44px;background-image:url(' + GetRootPath() + "streetview/forward.png" + ');position:absolute;z-index:100;left:' + ((dev.App.MapPanel.MapStreet.width() - 103) / 2) + 'px;top:' + (((dev.App.MapPanel.MapStreet.height() - 44) / 2) - 60) + 'px;"></div>').appendTo(maindiv);
        var recedebnt = $('<div class="btn" btntype="pre" tag="0" style="width:148px;height:90px;background-image:url(' + GetRootPath() + "streetview/back.png" + ');position:absolute;z-index:100;left:' + ((dev.App.MapPanel.MapStreet.width() - 148) / 2) + 'px;top:' + (((dev.App.MapPanel.MapStreet.height() - 90) / 2) + 30) + 'px"></div>').appendTo(maindiv);
        $(".btn", maindiv).click(function () {
            var tag = parseInt($(this).attr("tag"));
            var btntype = $(this).attr("btntype");
            var index = (btntype == "next") ? (tag + 1) : (tag - 1);
            $(".btn", maindiv).attr("tag", index);
            var needata = getneedsource(index, $this.SelectFeature.getProperties().PICKDATE);
            if (dev.IsNull(needata)) return;
            dev.MapUtils.ClearFeature("tempGraphicLayer", $this.miniMap);
            needata.setStyle(new ol.style.Style({
                image: new ol.style.Icon({ src: GetRootPath() + "streetview/camera-small.png", anchor: [0.5, 1] }),
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
        this.mapdiv = $('<div style="position:absolute;left:0px;bottom:0px;height:200px;width:250px;"></div>').appendTo(maindiv);
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
                var c_extend = this.RouteLayerInfo.Envelop.split(',');
                var center = [(parseFloat(c_extend[0]) + parseFloat(c_extend[2])) / 2, (parseFloat(c_extend[1]) + parseFloat(c_extend[3])) / 2];
                var mapproj = dev.App.Map.getView().getProjection();
                if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) center = ol.proj.transform(center, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
                dev.App.Map.getView().setCenter(center, dev.App.Map.getSize());
                dev.App.Map.getView().setZoom(dev.App.Config.SystemMap.Zoom);
                //判断是否存在
                dev.MapUtils.RemoveLayer("streetviewlayer", dev.App.Map);
                heatmaplayer = new ol.layer.Heatmap({
                    id: "streetviewlayer",
                    source: new ol.source.Vector({
                        url: getUrl({
                            WFS: dev.MapLoad.GetUrlByRelID(this.LayerInfo.WFSUrl),
                            TypeName: this.LayerInfo.TypeName,
                            SrsName: this.SrsName,
                            OutputFormat: this.OutputFormat,
                            Version: this.Version
                        }),
                        format: new ol.format.GeoJSON({
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
                })
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
                    //    dev.App.MapPanel.MapDOM.css("cursor", "url(" + GetRootPath() + "streetview/camera-large.ico" + "),auto");
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
                    this.streeimgtip = new ol.Overlay({
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
                    var maindiv = $("#streetControl", dev.App.MapPanel.MapStreet);
                    maindiv.css({ "position": "absolute", "display": "block" });
                    this.miniMap = initmap(this.mapdiv);
                    addwms(this.RouteLayerInfo, this.miniMap);
                    var extent = this.RouteLayerInfo.Envelop.split(',');
                    var initExtent = [parseFloat(extent[0]), parseFloat(extent[1]), parseFloat(extent[2]), parseFloat(extent[3])];
                    this.miniMap.getView().setZoom(17);
                    this.miniMap.getView().setCenter(this.SelectFeature.getGeometry().getCoordinates());
                    //添加点击事件
                    minimapclick = this.miniMap.on("singleclick", function (evt) {
                        var result = dev.SPointerQuery({
                            Map: $this.miniMap,
                            PX: 2,
                            Point: evt.coordinate,
                            GeometryName: $this.LayerInfo.GeomField,
                            Url: dev.MapLoad.GetUrlByRelID($this.LayerInfo.WFSUrl),
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
                    var maindiv = $("#streetControl", dev.App.MapPanel.MapStreet)
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
                $("#streetControl", dev.App.MapPanel.MapStreet).remove();
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
            Url: dev.MapLoad.GetUrlByRelID(layerinfo.WFSUrl),
            Layers: layerinfo.TypeName,
            ServerType: layerinfo.ServerType,
            Map: dev.IsNull(map) ? dev.App.Map : map,
            EPSG: dev.App.Config.SystemMap.DisplayEPSG
        };
        if (!dev.IsNull(layerinfo.SldLegend)) {
            if (dev.IsNull(layerinfo.SldLegend.length)) layerinfo.SldLegend = [layerinfo.SldLegend];
            param.Sldbody = dev.MapLoad.GetSLDString(layerinfo.TypeName, dev.LegendToRule(layerinfo.SldLegend, "line"));
        };
        dev.MapLoad.AddWMSLayer(param);

    }
    function selectfeature($this) {
        var maindiv = $("#streetControl", dev.App.MapPanel.MapStreet);
        maindiv.css({ "position": "absolute", "display": "block" });
        dev.MapUtils.ClearFeature("tempGraphicLayer", $this.miniMap);
        $this.SelectFeature.setStyle(new ol.style.Style({
            image: new ol.style.Icon({ src: dev.App.Root + "streetview/camera-small.png", anchor: [0.5, 1] }),
        }));
        dev.MapUtils.AddFeature($this.SelectFeature, "tempGraphicLayer", $this.miniMap, false);
        var btns = $(".btn", maindiv);
        for (var i = 0; i < btns.length; i++) $(btns[i]).attr("tag", $this.SelectFeature.getProperties().ORDERNUM);
        initimg($this.IMGUrl + $this.SelectFeature.getProperties().IMAGENAME, $this);

    }
    function initimg(imgurl, $this) {
        if ($this.StreeLoading) return;
        $this.StreeLoading = true;
        var div = $(".container", $("#streetControl", dev.App.MapPanel.MapStreet));
        var childnum = div.children().length;
        var newdiv = childnum > 0 ? $('<div class="container" style="display:none;"></div>').appendTo($("#streetControl", dev.App.MapPanel.MapStreet)) : div;
        var opt = {
            container: newdiv[0],
            url: imgurl,
            width: dev.App.MapPanel.MapStreet.width(),
            height: dev.App.MapPanel.MapStreet.height(),
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
        var initconfig = Config.SystemMap;
        var resolutions;
        if (!dev.IsNull(initconfig.LevelInfo) && !dev.IsNull(initconfig.LevelInfo.IsVisibleLevel) && initconfig.LevelInfo.IsVisibleLevel == "true") {
            resolutions = [];
            for (var i = 0; i < initconfig.LevelInfo.Levels.length; i++) {
                if (dev.App.Config.SystemMap.DisplayEPSG == 'EPSG:3857') resolutions.push(parseFloat(initconfig.LevelInfo.Levels[i].Resolution3857));
                else resolutions.push(parseFloat(initconfig.LevelInfo.Levels[i].Resolution));
            }
        }
        var view = new ol.View({
            projection: dev.App.Map.getView().getProjection(),
            resolutions: resolutions,
            minZoom: 1,
            maxResolution: resolutions[resolutions.length - 1],
            maxZoom: 20,
            minResolution: resolutions[0],
        });
        var map = new ol.Map({
            controls: new ol.control.defaults({ zoom: false, rotate: false, attribution: false }),
            interactions: ol.interaction.defaults().extend([new ol.interaction.DragRotateAndZoom()]),
            target: parent[0],
            logo: false,
            view: view
        });
        dev.MapLoad.InitMap($.extend({ Map: map }, initconfig));
        var initExtent = [parseFloat(initconfig.Extent.XMin), parseFloat(initconfig.Extent.YMin), parseFloat(initconfig.Extent.XMax), parseFloat(initconfig.Extent.YMax)];
        var mapproj = dev.App.Map.getView().getProjection();
        if (mapproj.getCode() != dev.App.Config.SystemMap.DataEPSG) {
            initExtent = ol.proj.transformExtent(initExtent, dev.App.Config.SystemMap.DataEPSG, mapproj.getCode());
        }
        map.getView().fit(initExtent, map.getSize());
        return map;
    }

})(jQuery);

/*WFS封装 */
; (function ($) {
    function resultformat(result) {
        var features = [];
        $.each(result, function (i, o) {
            var geoJson = new ol.format.GeoJSON();
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
    dev.SWFS_H = function (opt) {
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
    dev.SQuerys = function (opt) {
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
    dev.SPointerQuery = function (opt) {
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