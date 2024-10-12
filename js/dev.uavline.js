var dragfeaturecontrl;
var ltpoint, rtpoint, lbpoint, rbpoint;
var drectW = 200, drectH = 200;
var Padding = 10;
var mSideRate = 100, mRouteNumber = 4;
var paddinglt, paddingrt, paddinglb, paddingrb;
var vMarker, hMarker, dragMarker, markersize = 25;
var DEFAULT_SCALE = 1.0;
var mScale = DEFAULT_SCALE;
var mScaleX = DEFAULT_SCALE;
var mScaleY = DEFAULT_SCALE;
var MAX_SCALE = 1000.0;
var MIN_SCALE = 0.1;
var STATUS_INIT = 0, STATUS_DRAG = 1, STATUS_ROTATE_ZOOM = 2, STATUS_VERTICLA = 3, STATUS_HOTIZONTAL = 4;
var mStatus = STATUS_INIT;
var isMouseDown = false;
var mPreMovePoint;
var DEFAULT_DEGREE = 0;
var mDegree = DEFAULT_DEGREE;
var modifyInteraction;
var dragsource;
var centerpoint;
var lineroutepoints
var mapdommousemove, mapdommouseup, mapdommousedown
function createline() {
    uavlineclear();
    init();
    Dev.App.MapPanel.MapDOM.mousemove(function (event) {
        if (!isMouseDown) return;
        mousemove(event);
    }).mouseup(function () {
        isMouseDown = false;
        mStatus = STATUS_INIT;
        Dev.App.EventObject.triggerHandler("onUAVLineChange", { linepoings: lineroutepoints });
    }).mousedown(function (e) {
        var currpoint = [e.clientX, e.clientY-60];
        mPreMovePoint = currpoint;
        isMouseDown = true;
        var featureids = [];
        Dev.App.Map.forEachFeatureAtPixel(currpoint, function (feature) {
            featureids.push(feature.getId());
        });
        mStatus = STATUS_INIT;
        if (featureids.indexOf("vMarkerf") >= 0) mStatus = STATUS_HOTIZONTAL;
        if (featureids.indexOf("hMarkerf") >= 0) mStatus = STATUS_VERTICLA;
        if (featureids.indexOf("dragMarker") >= 0) mStatus = STATUS_ROTATE_ZOOM;
        if (mStatus != STATUS_INIT) {
            var isv = getinitinfo();
            if (!isv) mStatus = STATUS_INIT;
        }
    });
    dragfeaturecontrl = new Dev.DragFeatures();
    Dev.App.Map.addInteraction(dragfeaturecontrl);
    Dev.App.EventObject.triggerHandler("onUAVLineChange", { linepoings: lineroutepoints });
}
function mousemove(event) {
    var c_x = event.clientX;
    var c_y = event.clientY-60;
    mCurMovePoint = { x: c_x, y: c_y };
    if (mStatus == STATUS_VERTICLA) {
        var disX = mCurMovePoint.x - mPreMovePoint[0];
        var disY = mCurMovePoint.y - mPreMovePoint[1];
        var verticalX = rtpoint[0] - rbpoint[0];
        var verticalY = rtpoint[1] - rbpoint[1];
        var verticalXOne = (verticalX / (Math.sqrt(verticalX * verticalX + verticalY * verticalY)));
        var verticalYOne = (verticalY / (Math.sqrt(verticalX * verticalX + verticalY * verticalY)));
        var moveOnVertical = disX * verticalXOne + disY * verticalYOne;
        var moveOnX = moveOnVertical * verticalXOne;
        var moveOnY = moveOnVertical * verticalYOne;
        mScaleX = 1.0;
        var viewHeight = distance4Point(rbpoint, rtpoint);
        if ((viewHeight - moveOnVertical) != 0) mScaleY = ((viewHeight - moveOnVertical) / (viewHeight));
        centerpoint[0] += moveOnX / 2;
        centerpoint[1] += moveOnY / 2;
        transformDraw();
    }
    if (mStatus == STATUS_HOTIZONTAL) {
        var disX = mCurMovePoint.x - mPreMovePoint[0];
        var disY = mCurMovePoint.y - mPreMovePoint[1];
        var verticalX = rtpoint[0] - ltpoint[0];
        var verticalY = rtpoint[1] - ltpoint[1];
        var verticalXOne = (verticalX / (Math.sqrt(verticalX * verticalX + verticalY * verticalY)));
        var verticalYOne = (verticalY / (Math.sqrt(verticalX * verticalX + verticalY * verticalY)));
        var moveOnHotizontal = disX * verticalXOne;
        var moveOnX = moveOnHotizontal * verticalXOne;
        var moveOnY = moveOnHotizontal * verticalYOne;
        var viewWidth = distance4Point(ltpoint, rtpoint);
        mScaleY = 1.0;
        if ((viewWidth - moveOnHotizontal) != 0) mScaleX = ((viewWidth - moveOnHotizontal) / (viewWidth));
        centerpoint[0] += moveOnX / 2;
        centerpoint[1] += moveOnY / 2;
        transformDraw();
    }
    if (mStatus == STATUS_ROTATE_ZOOM) {
        var scale = 1.0;
        var temppoint = [paddingrt[0] - centerpoint[0], paddingrt[1] - centerpoint[1]];
        var centertodistance = Math.sqrt(temppoint[0] * temppoint[0] + temppoint[1] * temppoint[1]);
        var moveToCenterDistance = distance4Point([mCurMovePoint.x, mCurMovePoint.y], centerpoint);
        if (centertodistance != 0) scale = moveToCenterDistance / centertodistance;
        if (scale <= MIN_SCALE) scale = MIN_SCALE;
        if (scale >= MAX_SCALE) scale = MAX_SCALE;
        var a = distance4Point(centerpoint, mPreMovePoint);
        var b = distance4Point(mPreMovePoint, [mCurMovePoint.x, mCurMovePoint.y]);
        var c = distance4Point(centerpoint, [mCurMovePoint.x, mCurMovePoint.y]);
        if (a * c == 0) return;
        var cosb = (a * a + c * c - b * b) / (2 * a * c);
        if (cosb >= 1) cosb = 1;
        var radian = Math.acos(cosb);
        var newDegree = radianToDegree(radian);
        var centerToProMove = { x: mPreMovePoint[0] - centerpoint[0], y: mPreMovePoint[1] - centerpoint[1] };
        var centerToCurMove = { x: mCurMovePoint.x - centerpoint[0], y: mCurMovePoint.y - centerpoint[1] };
        var result = centerToProMove.x * centerToCurMove.y - centerToProMove.y * centerToCurMove.x;
        if (result > 0) newDegree = -newDegree;
        mDegree = mDegree + newDegree;
        mScale = scale;
        mScaleY = scale;
        mScaleX = scale;
        transformDraw();
    }
    mPreMovePoint[0] = mCurMovePoint.x;
    mPreMovePoint[1] = mCurMovePoint.y;
}
function init() {
    var left, right, top, bottom;
    if (Dev.IsNull(fishnetf)) {
        var width = Dev.App.MapPanel.MapDOM.width();
        var height = Dev.App.MapPanel.MapDOM.height();
        var centerpoint = [width / 2, height / 2];
        left = centerpoint[0] - (drectW / 2);
        right = centerpoint[0] + (drectW / 2);
        top = centerpoint[1] - (drectH / 2);
        bottom = centerpoint[1] + (drectH / 2);
    }
    else {
        var extent = fishnetf.getGeometry().getExtent();
        var pixel = Dev.App.Map.getPixelFromCoordinate([extent[0], extent[1]]);
        var pixel1 = Dev.App.Map.getPixelFromCoordinate([extent[2], extent[3]]);
        var left = pixel[0] + 10;
        var right = pixel1[0] - 10;
        var top = pixel1[1] + 10;
        var bottom = pixel[1] - 10;
    }
    ltpoint = [left, top];
    paddinglt = [left - Padding, top - Padding];
    rtpoint = [right, top];
    paddingrt = [right + Padding, top - Padding];
    lbpoint = [left, bottom];
    paddinglb = [left - Padding, bottom + Padding];
    rbpoint = [right, bottom];
    paddingrb = [right + Padding, bottom + Padding];
    dragsource = new Dev.Collection();
    modifyInteraction = new Dev.interaction.Modify({
        features: dragsource,
        style: new Dev.style.Style({})
    });
    modifyInteraction.on("modifyend", function () { getinitinfo(); });
    Dev.App.Map.addInteraction(modifyInteraction);
    refresh();
}//初始化坐标及元素
function refresh() {
    getrouteNum();
    lineroutepoints = drawRouteWithPoint();
    drawpolyline(lineroutepoints);
    showrect([paddinglt, paddinglb, paddingrb, paddingrt, paddinglt]);
    showmarker();
}//刷新素有元素
function showrect(rectpoints) {
    if (Dev.IsNull(rectpoints) || rectpoints.length == 0) return;
    var c_f = Dev.MapUtils.GetFeatureByID("rectf", "tempGraphicLayer", Dev.App.Map);
    if (!Dev.IsNull(c_f)) Dev.MapUtils.RemoveFeature(c_f, "tempGraphicLayer", Dev.App.Map);
    var newpoints = [];
    for (var i = 0; i < rectpoints.length; i++) newpoints.push(Dev.App.Map.getCoordinateFromPixel(rectpoints[i]));
    var rectfeature = new Dev.Feature(new Dev.geom.Polygon([newpoints]));
    rectfeature.setId("rectf");
    rectfeature.setStyle(new Dev.style.Style({
        fill: new Dev.style.Fill({ color: 'rgba(155, 205, 155, 0.4)' }),
        stroke: new Dev.style.Stroke({ color: 'rgba(155, 205, 155, 1)', width: 1 })
    }));
    Dev.MapUtils.AddFeature(rectfeature, "tempGraphicLayer", Dev.App.Map, false);
}//绘制矩形
function showmarker() {
    var vmarkposition = Dev.App.Map.getCoordinateFromPixel([(paddinglt[0] + paddinglb[0]) / 2, (paddinglt[1] + paddinglb[1]) / 2]);
    var hmarkposition = Dev.App.Map.getCoordinateFromPixel([(paddinglb[0] + paddingrb[0]) / 2, (paddingrb[1] + paddinglb[1]) / 2]);
    var v_f = Dev.MapUtils.GetFeatureByID("vMarkerf", "tempGraphicLayer", Dev.App.Map);
    if (!Dev.IsNull(v_f)) Dev.MapUtils.RemoveFeature(v_f, "tempGraphicLayer", Dev.App.Map);
    vMarker = new Dev.Feature(new Dev.geom.Point(vmarkposition));
    dragsource.push(vMarker);
    vMarker.setId("vMarkerf");
    vMarker.setStyle(new Dev.style.Style({ image: new Dev.style.Icon({ src: Dev.App.Root + "image/uav/control_circle.png" }) }))
    Dev.MapUtils.AddFeature(vMarker, "tempGraphicLayer", Dev.App.Map, false);

    var h_f = Dev.MapUtils.GetFeatureByID("hMarkerf", "tempGraphicLayer", Dev.App.Map);
    if (!Dev.IsNull(h_f)) Dev.MapUtils.RemoveFeature(h_f, "tempGraphicLayer", Dev.App.Map);
    hMarker = new Dev.Feature(new Dev.geom.Point(hmarkposition));
    dragsource.push(hMarker);
    hMarker.setId("hMarkerf");
    hMarker.setStyle(new Dev.style.Style({ image: new Dev.style.Icon({ src: Dev.App.Root + "image/uav/control_circle.png" }) }))
    Dev.MapUtils.AddFeature(hMarker, "tempGraphicLayer", Dev.App.Map, false);

    //添加旋转拖拽marker
    var dragmarkposition = Dev.App.Map.getCoordinateFromPixel(paddingrt);
    var drag_f = Dev.MapUtils.GetFeatureByID("dragMarker", "tempGraphicLayer", Dev.App.Map);
    if (!Dev.IsNull(v_f)) Dev.MapUtils.RemoveFeature(drag_f, "tempGraphicLayer", Dev.App.Map);
    dragMarker = new Dev.Feature(new Dev.geom.Point(dragmarkposition));
    dragsource.push(dragMarker);
    dragMarker.setId("dragMarker");
    dragMarker.setStyle(new Dev.style.Style({ image: new Dev.style.Icon({ src: Dev.App.Root + "image/uav/st_rotate_icon.png", size: [48, 48] }) }))
    Dev.MapUtils.AddFeature(dragMarker, "tempGraphicLayer", Dev.App.Map, false);
}//添加拖拽标记
function drawpolyline(points) {//添加到地图
    var c_f = Dev.MapUtils.GetFeatureByID("lineroutef", "tempGraphicLayer", Dev.App.Map);
    if (!Dev.IsNull(c_f)) Dev.MapUtils.RemoveFeature(c_f, "tempGraphicLayer", Dev.App.Map);
    var linefeature = new Dev.Feature(new Dev.geom.LineString(points));
    linefeature.setId("lineroutef");
    Dev.MapUtils.AddFeature(linefeature, "tempGraphicLayer", Dev.App.Map, false);
    routefeature = linefeature;
}//绘制路线
function getrouteNum() {
    var point1 = Dev.App.Map.getCoordinateFromPixel(ltpoint);
    var point2 = Dev.App.Map.getCoordinateFromPixel(lbpoint);
    var mapproj = Dev.App.Map.getView().getProjection();
    if (mapproj.getCode() != "EPSG4326") {
        point1 = Dev.proj.transform(point1, mapproj.getCode(), "EPSG:4326");
        point2 = Dev.proj.transform(point2, mapproj.getCode(), "EPSG:4326");
    }
    var wgs84Sphere = new Dev.Sphere(6378137);
    var distance = wgs84Sphere.haversineDistance(point1, point2);
    var tempd = distance % mSideRate;
    var newRouteNumber = tempd == 0 ? (distance / mSideRate) : ((distance - tempd) / mSideRate);
    if (newRouteNumber <= 0) newRouteNumber = 4;
    mRouteNumber = newRouteNumber;
}//根据旁向重叠率求一共有多少条线路
function drawRouteWithPoint() {
    var point1 = Dev.App.Map.getCoordinateFromPixel(ltpoint);
    var point2 = Dev.App.Map.getCoordinateFromPixel(lbpoint);
    var point3 = Dev.App.Map.getCoordinateFromPixel(rtpoint);
    var point4 = Dev.App.Map.getCoordinateFromPixel(rbpoint);
    //转换成为3857坐标系
    var convertstart = point1;
    var convertend = point2;
    var convertstart1 = point3;
    var convertend1 = point4;
    var mapproj = Dev.App.Map.getView().getProjection();
    if (mapproj.getCode() != "EPSG:3857") {
        convertstart = Dev.proj.transform(point1, Dev.App.Map.getView().getProjection(), "EPSG:3857");
        convertend = Dev.proj.transform(point2, Dev.App.Map.getView().getProjection(), "EPSG:3857");
        convertstart1 = Dev.proj.transform(point3, Dev.App.Map.getView().getProjection(), "EPSG:3857");
        convertend1 = Dev.proj.transform(point4, Dev.App.Map.getView().getProjection(), "EPSG:3857");
    }
    var seg = { x1: convertstart[0], y1: convertstart[1], x2: convertend[0], y2: convertend[1] };
    var seg1 = { x1: convertstart1[0], y1: convertstart1[1], x2: convertend1[0], y2: convertend1[1] };

    var linelength;
    var wgs84Sphere = new Dev.Sphere(6378137);
    if (mapproj.getCode() != "EPSG:4326") linelength = wgs84Sphere.haversineDistance(Dev.proj.transform(point1.clone(), mapproj.getCode(), "EPSG:4326"), Dev.proj.transform(point2.clone(), mapproj.getCode(), "EPSG:4326"));
    else linelength = wgs84Sphere.haversineDistance(point1, point2);
    linelength = (Math.round(linelength * 100) / 100);
    var diff_x = convertend[0] - convertstart[0];
    var diff_y = convertend[1] - convertstart[1];
    var angle = 360 * Math.atan(diff_y / diff_x) / (2 * Math.PI);
    var unitdx = mSideRate * (seg.x2 - seg.x1) / linelength;
    var unitdy = mSideRate * (seg.y2 - seg.y1) / linelength;
    var pointl = [];
    var pointr = [];
    for (var i = 0; i < mRouteNumber; i++) {
        var pointx = seg.x1 + (i * unitdx) + unitdx;
        var pointy = seg.y1 + (i * unitdy) + unitdy;
        pointl.push([pointx, pointy]);
        var pointx1 = seg1.x1 + (i * unitdx) + unitdx;
        var pointy1 = seg1.y1 + (i * unitdy) + unitdy;
        pointr.push([pointx1, pointy1]);
    }
    var newpoints = [];
    for (var i = 0; i < pointl.length; i++) {
        var point1, point2;
        point1 = (i % 2 == 0) ? pointl[i] : pointr[i];
        point2 = (i % 2 == 0) ? pointr[i] : pointl[i];
        var mapproj = Dev.App.Map.getView().getProjection();
        if (mapproj.getCode() != "EPSG:3857") {
            point1 = Dev.proj.transform(point1, "EPSG:3857", mapproj.getCode());
            point2 = Dev.proj.transform(point2, "EPSG:3857", mapproj.getCode());
        }
        newpoints.push(point1);
        newpoints.push(point2);
    }
    return newpoints;
}//获取路线多有点集合
function radianToDegree(radian) {
    return radian * 180 / Math.PI
}//弧度转换为度
function degreeToRadian(degree) {
    return degree * Math.PI / 180
}//度转换为弧度
function distance4Point(point1, point2) {
    return Math.sqrt((point2[0] - point1[0]) * (point2[0] - point1[0]) + (point2[1] - point1[1]) * (point2[1] - point1[1]));
}//两点之间的距离
function transformDraw(isdrag, tempposition) {
    drectW = drectW * mScaleX;
    drectH = drectH * mScaleY;
    var centerx = centerpoint[0];
    var centery = centerpoint[1];
    var left = centerx - (drectW / 2);
    var right = centerx + (drectW / 2);
    var top = centery - (drectH / 2);
    var bottom = centery + (drectH / 2);
    var templtpoint = [left, top];
    var templbpoint = [left, bottom];
    var temprtpoint = [right, top];
    var temprbpoint = [right, bottom];
    var temppaddinglt = [left - Padding, top - Padding];
    var temppaddingrt = [right + Padding, top - Padding];
    var temppaddinglb = [left - Padding, bottom + Padding];
    var temppaddingrb = [right + Padding, bottom + Padding];
    ltpoint = obtainRoationPoint([centerx, centery], templtpoint, mDegree);
    rtpoint = obtainRoationPoint([centerx, centery], temprtpoint, mDegree);
    lbpoint = obtainRoationPoint([centerx, centery], templbpoint, mDegree);
    rbpoint = obtainRoationPoint([centerx, centery], temprbpoint, mDegree);
    paddinglt = obtainRoationPoint([centerx, centery], temppaddinglt, mDegree);
    paddingrt = obtainRoationPoint([centerx, centery], temppaddingrt, mDegree);
    paddinglb = obtainRoationPoint([centerx, centery], temppaddinglb, mDegree);
    paddingrb = obtainRoationPoint([centerx, centery], temppaddingrb, mDegree);
    refresh();
}//获取拖拽后的点坐标
function obtainRoationPoint(center, source, degree) {
    var dispoint = [source[0] - center[0], source[1] - center[1]];
    var originRadian, resultDegree, resultRadian, resultPoint;
    var distance = Math.sqrt(dispoint[0] * dispoint[0] + dispoint[1] * dispoint[1]);
    if (dispoint[0] == 0 && dispoint[1] == 0) return center;
    else if (dispoint[0] >= 0 && dispoint[1] >= 0) {
        originRadian = Math.asin(dispoint[0] / distance);
        originRadian = originRadian + Math.PI * 3 / 2;
    }
    else if (dispoint[0] < 0 && dispoint[1] >= 0) {
        originRadian = Math.asin(Math.abs(dispoint[1]) / distance);
        originRadian = originRadian + Math.PI
    }
    else if (dispoint[0] < 0 && dispoint[1] < 0) {
        originRadian = Math.asin(Math.abs(dispoint[0]) / distance);
        originRadian = originRadian + Math.PI / 2
    }
    else if (dispoint[0] >= 0 && dispoint[1] < 0) {
        originRadian = Math.asin(Math.abs(dispoint[1]) / distance)
    }
    originDegree = radianToDegree(originRadian);
    resultDegree = originDegree + degree;
    resultRadian = degreeToRadian(resultDegree);
    resultPoint = [Math.round(distance * Math.cos(resultRadian)), -(Math.round(distance * Math.sin(resultRadian)))];
    resultPoint[0] += center[0];
    resultPoint[1] += center[1];
    return resultPoint;
}//上一个函数的辅助
function getmaxorminvalue(values, ismin) {
    if (values == undefined || values == null) return;
    var maxorminvalue = values[0];
    for (var i = 1; i < values.length; i++) {
        if (ismin) {
            if (maxorminvalue > values[i]) maxorminvalue = values[i];
        }
        else {
            if (maxorminvalue < values[i]) maxorminvalue = values[i];
        }
    }
    return maxorminvalue;
}//获取所有值得最大值或最小值
function getinitinfo() {
    var rectf = Dev.MapUtils.GetFeatureByID("rectf", "tempGraphicLayer", Dev.App.Map);
    if (Dev.IsNull(rectf)) return false;
    var rectpoints = rectf.getGeometry().getCoordinates()[0];
    paddinglt = Dev.App.Map.getPixelFromCoordinate(rectpoints[0]);
    paddinglb = Dev.App.Map.getPixelFromCoordinate(rectpoints[1]);
    paddingrt = Dev.App.Map.getPixelFromCoordinate(rectpoints[2]);
    paddingrb = Dev.App.Map.getPixelFromCoordinate(rectpoints[3]);
    var linef = Dev.MapUtils.GetFeatureByID("lineroutef", "tempGraphicLayer", Dev.App.Map);
    if (Dev.IsNull(linef)) return false;
    var linepoints = linef.getGeometry().getCoordinates();
    var linefisrtp = linepoints[0];
    var linesecondp = linepoints[1];
    var linethirdp = linepoints[linepoints.length - 2];
    var linelastp = linepoints[linepoints.length - 1];
    var pixelinefp = Dev.App.Map.getPixelFromCoordinate(linefisrtp);
    var pixelinesp = Dev.App.Map.getPixelFromCoordinate(linesecondp);
    var pixelinetp = Dev.App.Map.getPixelFromCoordinate(linethirdp);
    var pixelinelp = Dev.App.Map.getPixelFromCoordinate(linelastp);
    ltpoint = pixelinefp;
    rtpoint = pixelinesp;
    lbpoint = pixelinetp;
    rbpoint = pixelinelp;
    var minx = getmaxorminvalue([paddinglt[0], paddinglb[0], paddingrt[0], paddingrb[0]], true);
    var maxx = getmaxorminvalue([paddinglt[0], paddinglb[0], paddingrt[0], paddingrb[0]]);
    var miny = getmaxorminvalue([paddinglt[1], paddinglb[1], paddingrt[1], paddingrb[1]], true);
    var maxy = getmaxorminvalue([paddinglt[1], paddinglb[1], paddingrt[1], paddingrb[1]]);
    centerpoint = [(minx + maxx) / 2, (miny + maxy) / 2];
    return true;
}//获取当前所有坐标点
function uavlineclear() {
    lineroutepoints = [];
    if (!Dev.IsNull(modifyInteraction)) {
        modifyInteraction.un("modifyend");
        modifyInteraction.setActive(false);
        Dev.App.Map.removeInteraction(modifyInteraction);
        modifyInteraction = null;
    };
    if (!Dev.IsNull(dragfeaturecontrl)) {
        Dev.App.Map.removeInteraction(dragfeaturecontrl);
        dragfeaturecontrl = null;
    }
    var c_f = Dev.MapUtils.GetFeatureByID("rectf", "tempGraphicLayer", Dev.App.Map);
    if (!Dev.IsNull(c_f)) Dev.MapUtils.RemoveFeature(c_f, "tempGraphicLayer", Dev.App.Map);
    var v_f = Dev.MapUtils.GetFeatureByID("vMarkerf", "tempGraphicLayer", Dev.App.Map);
    if (!Dev.IsNull(v_f)) Dev.MapUtils.RemoveFeature(v_f, "tempGraphicLayer", Dev.App.Map);
    var h_f = Dev.MapUtils.GetFeatureByID("hMarkerf", "tempGraphicLayer", Dev.App.Map);
    if (!Dev.IsNull(h_f)) Dev.MapUtils.RemoveFeature(h_f, "tempGraphicLayer", Dev.App.Map);
    var drag_f = Dev.MapUtils.GetFeatureByID("dragMarker", "tempGraphicLayer", Dev.App.Map);
    if (!Dev.IsNull(v_f)) Dev.MapUtils.RemoveFeature(drag_f, "tempGraphicLayer", Dev.App.Map);
    var line_f = Dev.MapUtils.GetFeatureByID("lineroutef", "tempGraphicLayer", Dev.App.Map);
    if (!Dev.IsNull(line_f)) Dev.MapUtils.RemoveFeature(line_f, "tempGraphicLayer", Dev.App.Map);
    mScale = DEFAULT_SCALE;
    mScaleX = DEFAULT_SCALE;
    mScaleY = DEFAULT_SCALE;
    mDegree = DEFAULT_DEGREE;
    mStatus = STATUS_INIT;
    isMouseDown = false;
    Dev.App.MapPanel.MapDOM.unbind("mousemove");
    Dev.App.MapPanel.MapDOM.unbind("mouseup");
    Dev.App.MapPanel.MapDOM.unbind("mousedown");
}
