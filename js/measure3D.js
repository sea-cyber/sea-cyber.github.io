//测量
; (function ($) {
    var measure_handler;//三维测量事件
    var billboardCollection;
    var currentpolylinepoints = null;
    var measureLineCollection = null;
    var measureAreaGeometry = null;
    var measureDisplayLabel = null;
    var tempLabelCollection;
    var editmode;
    var addStopButton = null;
    var mouselastmovelocationonScreen;
    var isrightclick = false;
    var aEarth = 6378137;
    var bEarth = 6356752.3142;
    var e1 = Math.sqrt(aEarth * aEarth - bEarth * bEarth) / aEarth;
    var e2 = Math.sqrt(aEarth * aEarth - bEarth * bEarth) / bEarth;
    dev.measure3D = {
        init: function () {
            billboardCollection = new Cesium.BillboardCollection();
            measure_handler = new Cesium.ScreenSpaceEventHandler(dev.App.Map3D.scene.canvas);
            measure_handler.setInputAction(dev.measure3D.rightclick, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);
            tempLabelCollection = new Cesium.LabelCollection();
            measureDisplayLabel = tempLabelCollection.add({ font: '20px sans-serif', fillColor: Cesium.Color.WHITE, outlineColor: Cesium.Color.BLACK, verticalOrigin: Cesium.VerticalOrigin.TOP });
            dev.App.Map3D.scene.primitives.add(tempLabelCollection);
            dev.App.Map3D.scene.primitives.add(billboardCollection);
            measureLineCollection = new Cesium.PolylineCollection();
            dev.App.Map3D.scene.primitives.add(measureLineCollection);
            addStopButton = billboardCollection.add({ position: Cesium.Cartesian3.fromDegrees(100, 30), image: dev.App.Root + 'image/agri/close3dmeasure.png', horizontalOrigin: Cesium.HorizontalOrigin.CENTER, verticalOrigin: Cesium.VerticalOrigin.CENTER, id: -1 });
            addStopButton.show = false;
        },
        mousemove: function (movement) {
            if (!dev.IsNull(mouselastmovelocationonScreen)) {
                var movedis = Math.abs(mouselastmovelocationonScreen.x - movement.endPosition.x) + Math.abs(mouselastmovelocationonScreen.y - movement.endPosition.y);
                mouselastmovelocationonScreen = new Cesium.Cartesian2(movement.endPosition.x, movement.endPosition.y);
                if (movedis < 2) return;
            }
            else mouselastmovelocationonScreen = new Cesium.Cartesian2(movement.endPosition.x, movement.endPosition.y);
            var pickRay = dev.App.Map3D.scene.camera.getPickRay(movement.endPosition);
            var cartesian = dev.App.Map3D.scene.globe.pick(pickRay, dev.App.Map3D.scene);
            if (!cartesian) return;
            if (editmode == 9) {
                if (currentpolylinepoints) {
                    var p = cartesian.clone();
                    p.istemp = true;
                    if (currentpolylinepoints.length >= 2) {
                        if (currentpolylinepoints[currentpolylinepoints.length - 1].istemp) currentpolylinepoints[currentpolylinepoints.length - 1] = p;
                    }
                    if (currentpolylinepoints[currentpolylinepoints.length - 1] != p) currentpolylinepoints.push(p);
                    dev.measure3D.updateLengthMeasureResult(true);
                }
            }
            if (editmode == 10) {
                if (currentpolylinepoints) {
                    var p = cartesian.clone();
                    p.istemp = true;
                    if (currentpolylinepoints.length >= 3) {
                        if (currentpolylinepoints[currentpolylinepoints.length - 1].istemp) currentpolylinepoints[currentpolylinepoints.length - 1] = p;
                    }
                    if (currentpolylinepoints[currentpolylinepoints.length - 1] != p) currentpolylinepoints.push(p);
                    dev.measure3D.updateAreaMeasureResult(true);
                }
            }
        },
        rightclick: function (movement) {
            var pickRay = dev.App.Map3D.scene.camera.getPickRay(movement.position);
            var cartesian = dev.App.Map3D.scene.globe.pick(pickRay, dev.App.Map3D.scene);
            var eve = measure_handler.getInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            if (eve) measure_handler.removeInputAction(Cesium.ScreenSpaceEventType.MOUSE_MOVE);
            isrightclick = true;
            dev.App.MapPanel.MapDOM3D.css("cursor", "url(" + dev.App.Root + "image/hands.cur),auto");
            dev.measureState = false;
            if (editmode == 9) dev.measure3D.updateLengthMeasureResult(false);
            if (editmode == 10) dev.measure3D.updateAreaMeasureResult(false);
        },
        leftclick: function (movement) {
            if (isrightclick) {
                var isstopbtn = dev.measure3D.hasClickStopButton(movement);
                if (isstopbtn) {
                    dev.measure3D.clear();
                    isrightclick = false;
                }
                return;
            }
            var pickRay = dev.App.Map3D.scene.camera.getPickRay(movement.position);
            var cartesian = dev.App.Map3D.scene.globe.pick(pickRay, dev.App.Map3D.scene);
            if (editmode == 9) {
                if (dev.IsNull(currentpolylinepoints)) currentpolylinepoints = [cartesian.clone()];
                else currentpolylinepoints.push(cartesian.clone());
                dev.measure3D.updateLengthMeasureResult(false);
            }
            if (editmode == 10) {
                if (dev.IsNull(currentpolylinepoints)) currentpolylinepoints = [cartesian.clone()];
                else currentpolylinepoints.push(cartesian.clone());
                dev.measure3D.updateAreaMeasureResult(false);
            }
            if (!dev.IsNull(currentpolylinepoints) && currentpolylinepoints.length == 1) measure_handler.setInputAction(dev.measure3D.mousemove, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
        },
        measureLength: function () {
            dev.measure3D.clear();
            isrightclick = false;
            while (billboardCollection.length > 1) billboardCollection.remove(billboardCollection.get(1));
            editmode = 9;
            measure_handler.setInputAction(dev.measure3D.leftclick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        },
        measureArea: function () {
            dev.measure3D.clear();
            isrightclick = false;
            //移除左键点击事件
            var lefteve = measure_handler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            if (!dev.IsNull(lefteve)) measure_handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            editmode = 10;
            measure_handler.setInputAction(dev.measure3D.leftclick, Cesium.ScreenSpaceEventType.LEFT_CLICK);
        },
        hasClickStopButton: function (movement) {
            var isbtn = false;
            if (addStopButton.show) {
                var pickedObjects = dev.App.Map3D.scene.drillPick(movement.position);
                if (Cesium.defined(pickedObjects)) {
                    for (var i = 0; i < pickedObjects.length; i++) {
                        if (pickedObjects[i].primitive == addStopButton) { isbtn = true; break; }
                    }
                }
            }
            return isbtn;
        },
        updateLengthMeasureResult: function (istemp) {
            if (currentpolylinepoints && currentpolylinepoints.length >= 2) {
                var mat = Cesium.Material.fromType('Color')
                mat.uniforms.color = new Cesium.Color(0.93, 0.46, 0.25, 1);
                if (!istemp) {
                    addStopButton.position = currentpolylinepoints[currentpolylinepoints.length - 1];
                    addStopButton.show = true;
                }
                else addStopButton.show = false;
                measureLineCollection.removeAll();
                var temparray = new Array();
                var dis = 0;
                for (var i = 0; i < currentpolylinepoints.length - 1; i++) {
                    var surfarray = dev.measure3D.surfaceLine([currentpolylinepoints[i], currentpolylinepoints[i + 1]]);
                    dis = dis + dev.measure3D.countdisInCartesian3(currentpolylinepoints[i], currentpolylinepoints[i + 1]);
                    temparray = temparray.concat(surfarray);
                }
                var line = measureLineCollection.add({ positions: temparray, material: mat, width: 1 });
                measureDisplayLabel.show = true;
                var label = String(dis);
                label = label.substr(0, label.indexOf(".", 0));
                if (label.length < 3) measureDisplayLabel.text = label + "米";
                else {
                    label = String(label / 1000);
                    label = label.substr(0, label.indexOf(".", 0) + 3);
                    measureDisplayLabel.text = label + "公里"
                }
                measureDisplayLabel.position = currentpolylinepoints[currentpolylinepoints.length - 1]
            }
            else measureDisplayLabel.show = false;
        },
        updateAreaMeasureResult: function (istemp) {
            var temparray = new Array();
            var dis = 0;
            var mat = Cesium.Material.fromType('Color')
            mat.uniforms.color = new Cesium.Color(0.93, 0.46, 0.25, 0.5);
            if (currentpolylinepoints.length == 1) {
                var line = measureLineCollection.add({ positions: currentpolylinepoints, material: mat, width: 1 });
            }
            else if (currentpolylinepoints.length == 2) {
                for (var i = 0; i < currentpolylinepoints.length - 1; i++) {
                    var surfarray = dev.measure3D.surfaceLine([currentpolylinepoints[i], currentpolylinepoints[i + 1]]);
                    dis = dis + dev.measure3D.countdisInCartesian3(currentpolylinepoints[i], currentpolylinepoints[i + 1]);
                    temparray = temparray.concat(surfarray);
                }
                var line = measureLineCollection.add({ positions: temparray, material: mat, width: 1 });
            }
            else if (currentpolylinepoints.length >= 3) {
                for (var i = 0; i < currentpolylinepoints.length - 2; i++) {
                    var surfarray = dev.measure3D.surfaceLine([currentpolylinepoints[i], currentpolylinepoints[i + 1]]);
                    dis = dis + dev.measure3D.countdisInCartesian3(currentpolylinepoints[i], currentpolylinepoints[i + 1]);
                    temparray = temparray.concat(surfarray);
                }
                var line = measureLineCollection.add({ positions: temparray, material: mat, width: 1 });
                if (!istemp) {
                    addStopButton.position = currentpolylinepoints[currentpolylinepoints.length - 1];
                    addStopButton.show = true;
                }
                else addStopButton.show = false;
                var polygon = new Cesium.PolygonGeometry({ polygonHierarchy: { positions: currentpolylinepoints }, perPositionHeight: true });
                var geometrypolygon = new Cesium.GeometryInstance({ geometry: polygon });
                //var mat = Cesium.Material.fromType('Color', { color: new Cesium.Color(0.0, 1.0, 1.0, 0.5) });
                if (!dev.IsNull(measureAreaGeometry)) dev.App.Map3D.scene.primitives.remove(measureAreaGeometry);
                measureAreaGeometry = new Cesium.Primitive({
                    geometryInstances: [geometrypolygon],
                    appearance: new Cesium.EllipsoidSurfaceAppearance({ material: mat })
                });
                dev.App.Map3D.scene.primitives.add(measureAreaGeometry);
                measureDisplayLabel.show = true;
                var label = String(dev.measure3D.countAreaInCartesian3(currentpolylinepoints));
                label = label.substr(0, label.indexOf(".", 0));
                if (label.length < 6) measureDisplayLabel.text = label + "平方米";
                else {
                    label = String(label / 1000000);
                    label = label.substr(0, label.indexOf(".", 0) + 3);
                    measureDisplayLabel.text = label + "平方公里";
                }
                measureDisplayLabel.position = dev.measure3D.countCenter(currentpolylinepoints);
            }
            else measureDisplayLabel.show = false;
        },
        clear: function () {
            if (!dev.IsNull(currentpolylinepoints) && currentpolylinepoints.length > 0) {//清空绘制的线的所有的点记录
                currentpolylinepoints.splice(0, currentpolylinepoints.length);
                currentpolylinepoints = [];
            }
            measureLineCollection.removeAll();//清空绘制过的线图形
            if (!dev.IsNull(measureAreaGeometry)) {//清空绘制过的图形
                dev.App.Map3D.scene.primitives.remove(measureAreaGeometry);
                measureAreaGeometry = null;
            }
            var eve = measure_handler.getInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            if (eve) measure_handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            if (!dev.IsNull(addStopButton)) addStopButton.show = false;;//测量结束点不显示
            if (!dev.IsNull(measureDisplayLabel)) measureDisplayLabel.show = false;//测量距离或面积不显示
            mouselastmovelocationonScreen = null;

        },
        countdisInCartesian3: function (p1, p2) {
            p1 = dev.App.Map3D.scene.globe.ellipsoid.cartesianToCartographic(p1);
            p1 = dev.measure3D.PItoDu(p1);
            p2 = dev.App.Map3D.scene.globe.ellipsoid.cartesianToCartographic(p2);
            p2 = dev.measure3D.PItoDu(p2);
            var center = (p1.longitude + p2.longitude) / 2;
            p1 = dev.measure3D.gauss_to_XY(p1.longitude, p1.latitude, center);
            p2 = dev.measure3D.gauss_to_XY(p2.longitude, p2.latitude, center);
            return dev.measure3D.countdis(p1, p2);
        },
        countAreaInCartesian3: function (pointsold) {
            var points = new Array(pointsold.length);
            for (var i = 0; i < pointsold.length; i++) points[i] = dev.measure3D.PItoDu(dev.App.Map3D.scene.globe.ellipsoid.cartesianToCartographic(pointsold[i]));
            var center = 0;
            for (var i = 0; i < points.length; i++) center += points[i].longitude;
            center = center / points.length;
            for (var i = 0; i < points.length; i++) points[i] = dev.measure3D.gauss_to_XY(points[i].longitude, points[i].latitude, center);
            return Math.abs(dev.measure3D.countArea(points));
        },
        countCenter: function (ps) {
            var x = 0, y = 0, z = 0;
            for (var j = 0; j < ps.length; j++) {
                x += ps[j].x;
                y += ps[j].y;
                z += ps[j].z;
            }
            var center = new Cesium.Cartesian3(x / ps.length, y / ps.length, z / ps.length);
            return center;
        },
        PItoDu: function (location) {
            location.longitude = location.longitude / Math.PI * 180;
            location.latitude = location.latitude / Math.PI * 180;
            return location;
        },
        surfaceLine: function (tagline, celldis) {
            var p1 = tagline[0];
            var p2 = tagline[1];
            var dis = Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y) + (p1.z - p2.z) * (p1.z - p2.z));
            var allps = new Array();
            if (!celldis) celldis = dis / 10;
            allps.push(p1);
            var count = parseInt(dis / celldis);
            if (dis > celldis) {
                for (var i = 1; i < count; i++) {
                    var p = new Cesium.Cartesian3(p1.x + celldis * i * (p2.x - p1.x) / dis, p1.y + celldis * i * (p2.y - p1.y) / dis, p1.z + celldis * i * (p2.z - p1.z) / dis);
                    allps.push(p);
                }
            }
            allps.push(p2);
            var result = new Array();
            var lastheight = dev.measure3D.getheight(dev.App.Map3D.scene.globe.ellipsoid.cartesianToCartographic(p1));
            for (var i = 0; i < allps.length; i++) {
                var cartesian = allps[i];
                var cartographic = dev.App.Map3D.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
                var height = dev.measure3D.getheight(cartographic);
                if (!height) height = lastheight;
                else lastheight = height;
                result.push(Cesium.Cartesian3.fromDegrees(Cesium.Math.toDegrees(cartographic.longitude), Cesium.Math.toDegrees(cartographic.latitude), height));
            }
            return result;
        },
        getheight: function (cartographic) {
            if (dev.IsNull(cartographic)) return null;
            else return dev.App.Map3D.scene.globe.getHeight(cartographic);
        },
        countdis: function (p1, p2) {
            if (p1.z && p2.z) return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y) + (p1.z - p2.z) * (p1.z - p2.z));
            else return Math.sqrt((p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y));
        },
        countArea: function (ps) {
            var s = 0;
            for (var i = 0; i < ps.length; i++) {
                var p1 = ps[i];
                var p2;
                if (i < ps.length - 1) p2 = ps[i + 1];
                else ps = ps[0];
                s += p1.x * p2.y - p2.x * p1.y;
            }
            return s / 2;
        },
        to_Degree: function (radian) { return radian / Math.PI * 180.0; },
        to_Radian: function (degree) { return degree * Math.PI / 180.0; },
        to_N: function (B) { var ans = (aEarth / Math.sqrt(1.00 - e1 * e1 * Math.sin(B) * Math.sin(B))); return ans; },
        to_Sm: function (B) {
            var AA = 1 + (e1 * e1) * 3 / 4 + Math.pow(e1, 4.0) * 45 / 64 + Math.pow(e1, 6) * 175 / 256 + Math.pow(e1, 8) * 11025 / 16384;
            var BB = Math.pow(e1, 2) * 3 / 4 + Math.pow(e1, 4) * 15 / 16 + Math.pow(e1, 6) * 525 / 512 + Math.pow(e1, 8) * 2205 / 2048;
            var CC = Math.pow(e1, 4) * 15 / 64 + Math.pow(e1, 6) * 105 / 256 + Math.pow(e1, 8) * 2205 / 4096;
            var DD = Math.pow(e1, 6) * 35 / 512 + Math.pow(e1, 8) * 315 / 2048;
            var EE = Math.pow(e1, 8) * 315 / 16384;
            return aEarth * (1 - e1 * e1) * (AA * B - BB / 2 * Math.sin(2 * B) + CC / 4 * Math.sin(4 * B) - DD / 6 * Math.sin(6 * B) + EE / 8 * Math.sin(8 * B));
        },
        gauss_to_XY: function (L, B, middleL2) {
            var t = 0, yita = 0;
            var nn = 0; var n = 0;
            var middleL = dev.measure3D.to_Radian(middleL2);
            B = dev.measure3D.to_Radian(B);
            L = dev.measure3D.to_Radian(L);
            var dL = L - middleL;
            var cosB = Math.cos(B);
            n = dev.measure3D.to_N(B);
            nn = n * Math.cos(B);
            t = Math.tan(B);
            yita = e2 * cosB;
            var pow_t2 = Math.pow(t, 2);
            var pow_t4 = Math.pow(t, 4);
            var pow_yita2 = Math.pow(yita, 2);
            var pow_yita4 = Math.pow(yita, 4);
            var pow_cosB3 = Math.pow(cosB, 3);
            var pow_cosB5 = Math.pow(cosB, 5);
            var tY = dev.measure3D.to_Sm(B) + Math.pow(dL, 2) / 2 * nn * cosB * t + Math.pow(dL, 4) / 24 * t * nn * pow_cosB3 * (5.0 - pow_t2 + 9.0 * pow_yita2 + 4 * pow_yita4) + Math.pow(dL, 6) / 720 * t * nn * pow_cosB5 * (61.0 - 58.0 * t * t + pow_t4 + 270 * pow_yita2 - 330 * t * t * pow_yita2);
            var tX = dL * n * cosB + Math.pow(dL, 3) / 6.0 * n * pow_cosB3 * (1 - t * t + yita * yita) + Math.pow(dL, 5) / 120.0 * n * pow_cosB5 * (5 - 18 * t * t + pow_t4 + 14.0 * pow_yita2 - 58.0 * pow_yita2 * pow_t2);
            return new Cesium.Cartesian2(tX, tY);
        }
    };
})(jQuery);