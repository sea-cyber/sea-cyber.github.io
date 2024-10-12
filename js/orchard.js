//显示冒泡详细信息
(function ($) {
    var OrchardMapTip;
    dev.InitOrchardTip = function (feature, isorchard) {
        //判断
        if (dev.IsNull(feature) || dev.IsNull(isorchard)) return;
        var varietydata;
        var height = 0;
        if (isorchard) {
            height = 100;
            varietydata = getorchardvariety(feature.getProperties().ORCHARDNAME);
            if (!dev.IsNull(varietydata) && varietydata.length > 0) {
                height += 25;
                height += varietydata.length * 31;
            }
        }
        else height = 235;
        if (OrchardMapTip == null) {
            OrchardMapTip = new dev.UCMapTip({
                ID: "orchardcoopTip",
                Title: isorchard ? "果园信息" : "合作社信息",
                Position: feature.getGeometry().getCoordinates(),
                Width: 400
            });
            OrchardMapTip.tipContent.one("onClosed", function () { OrchardMapTip = null; });
        }
        else OrchardMapTip.SetPosition(feature.getGeometry().getCoordinates());
        if (isorchard) getorchardcontent(feature.getProperties(), varietydata);
        else getcoorpertivecontent(feature.getProperties());
        OrchardMapTip.SetHeight(height);
    }
    dev.OrchardTipClose = function () {
        if (dev.IsNull(OrchardMapTip)) return;
        OrchardMapTip.tipContent.unbind("onClosed");
        OrchardMapTip.Clear();
        OrchardMapTip.Close();
        OrchardMapTip = null;
    }
    function getorchardcontent(featuredata, varietydata) {
        OrchardMapTip.Clear();
        var content = $('<div style="width:100%;height:100%;"></div>');
        var row1 = $('<div style="height:34px;width:100%;border-bottom:1px solid #ddd"></div>').appendTo(content);
        var r1cell0 = $('<div style="height:34px;width:196px;border-right:1px solid #ddd;display:inline-block;float:left;"></div>').appendTo(row1);
        var r1cell0title = $('<div style="height:34px;width:72px;display:inline-block;line-height:34px;padding-right:8px;float:left;text-align:right">果园名称</div>').appendTo(r1cell0);
        var r1cell0value = $('<div style="height:34px;width:110px;display:inline-block;line-height:34px;">' + featuredata.ORCHARDNAME + '</div>').appendTo(r1cell0);
        var r1cell1 = $('<div style="height:34px;width:196px;display:inline-block;float:left;"></div>').appendTo(row1);
        var r1cell1title = $('<div style="height:34px;width:72px;display:inline-block;line-height:34px;padding-right:8px;float:left;text-align:right">所在社区</div>').appendTo(r1cell1);
        var r1cell1value = $('<div style="height:34px;width:110px;display:inline-block;line-height:34px;">' + featuredata.VILLAGE + '</div>').appendTo(r1cell1);

        var row2 = $('<div style="height:34px;width:100%;border-bottom:1px solid #ddd"></div>').appendTo(content);
        var r2cell0 = $('<div style="height:34px;width:196px;border-right:1px solid #ddd;display:inline-block;float:left;"></div>').appendTo(row2);
        var r2cell0title = $('<div style="height:34px;width:72px;display:inline-block;line-height:34px;padding-right:8px;float:left;text-align:right">果园类型</div>').appendTo(r2cell0);
        var r2cell0value = $('<div style="height:34px;width:110px;display:inline-block;line-height:34px;">' + featuredata.ORCHARDTYPE + '</div>').appendTo(r2cell0);
        var r2cell1 = $('<div style="height:34px;width:196px;display:inline-block;float:left;"></div>').appendTo(row2);
        var r2cell1title = $('<div style="height:34px;width:72px;display:inline-block;line-height:34px;padding-right:8px;float:left;text-align:right">占地面积</div>').appendTo(r2cell1);
        var r2cell1value = $('<div style="height:34px;width:110px;display:inline-block;line-height:34px;">' + featuredata.COUNTAREA + '</div>').appendTo(r2cell1);
        if (!dev.IsNull(varietydata) && varietydata.length > 0) {
            var row3 = $('<div style="height:24px;line-height:24px;background-color:#fcfcfc;border-bottom:1px solid #ddd;"><span style="margin-left:20px;color:#0099cc;line-height:24px;">果园品种</span></div>').appendTo(content);
            var row4 = $('<div style="height:30px;width:100%;border-bottom:1px solid #ddd;"><div style="width:calc(50% - 1px);height:30px;border-right:1px solid #ddd;display:inline-block;float:left;text-align:center;line-height:30px;">品种</div><div style="line-height:30px;width:50%;height:30px;display:inline-block;float:left;text-align:center;">面积</div></div>').appendTo(content);
            for (var i = 0; i < varietydata.length; i++) {
                var currrow = $('<div style="height:30px;width:100%;border-bottom:1px solid #ddd;"><div style="width:calc(50% - 1px);height:30px;border-right:1px solid #ddd;display:inline-block;float:left;text-align:center;line-height:30px;">' + varietydata[i].fruitType + '</div><div style="line-height:30px;width:50%;height:30px;display:inline-block;float:left;text-align:center;">' + varietydata[i].area + '</div></div>').appendTo(content);
            }
        }
        OrchardMapTip.Add(content);
    }
    function getcoorpertivecontent(featuredata) {
        OrchardMapTip.Clear();
        var content = $('<div style="width:100%;height:100%;"></div>');

        var row0 = $('<div style="height:34px;width:100%;border-bottom:1px solid #ddd"></div>').appendTo(content);
        var r0cell0title = $('<div style="height:34px;width:72px;display:inline-block;line-height:34px;padding-right:8px;float:left;text-align:right">经合组织</div>').appendTo(row0);
        var r0cell0value = $('<div style="height:34px;width:300px;display:inline-block;line-height:34px;">' + featuredata.OECD + '</div>').appendTo(row0);

        var row1 = $('<div style="height:34px;width:100%;border-bottom:1px solid #ddd"></div>').appendTo(content);
        var r1cell0 = $('<div style="height:34px;width:196px;border-right:1px solid #ddd;display:inline-block;float:left;"></div>').appendTo(row1);
        var r1cell0title = $('<div style="height:34px;width:72px;display:inline-block;line-height:34px;padding-right:8px;float:left;text-align:right">乡镇</div>').appendTo(r1cell0);
        var r1cell0value = $('<div style="height:34px;width:110px;display:inline-block;line-height:34px;">' + featuredata.TOWNS + '</div>').appendTo(r1cell0);
        var r1cell1 = $('<div style="height:34px;width:196px;display:inline-block;float:left;"></div>').appendTo(row1);
        var r1cell1title = $('<div style="height:34px;width:72px;display:inline-block;line-height:34px;padding-right:8px;float:left;text-align:right">地点</div>').appendTo(r1cell1);
        var r1cell1value = $('<div style="height:34px;width:110px;display:inline-block;line-height:34px;">' + featuredata.ADDRESS + '</div>').appendTo(r1cell1);

        var row2 = $('<div style="height:34px;width:100%;border-bottom:1px solid #ddd"></div>').appendTo(content);
        var r2cell0 = $('<div style="height:34px;width:196px;border-right:1px solid #ddd;display:inline-block;float:left;"></div>').appendTo(row2);
        var r2cell0title = $('<div style="height:34px;width:72px;display:inline-block;line-height:34px;padding-right:8px;float:left;text-align:right">法人</div>').appendTo(r2cell0);
        var r2cell0value = $('<div style="height:34px;width:110px;display:inline-block;line-height:34px;">' + featuredata.CORPORATIONER + '</div>').appendTo(r2cell0);
        var r2cell1 = $('<div style="height:34px;width:196px;display:inline-block;float:left;"></div>').appendTo(row2);
        var r2cell1title = $('<div style="height:34px;width:72px;display:inline-block;line-height:34px;padding-right:8px;float:left;text-align:right">注册资金</div>').appendTo(r2cell1);
        var r2cell1value = $('<div style="height:34px;width:110px;display:inline-block;line-height:34px;">' + featuredata.REGISTEREDCAPITAL + '</div>').appendTo(r2cell1);

        var row3 = $('<div style="height:34px;width:100%;border-bottom:1px solid #ddd"></div>').appendTo(content);
        var r3cell0 = $('<div style="height:34px;width:196px;border-right:1px solid #ddd;display:inline-block;float:left;"></div>').appendTo(row3);
        var r3cell0title = $('<div style="height:34px;width:72px;display:inline-block;line-height:34px;padding-right:8px;float:left;text-align:right">社员人数</div>').appendTo(r3cell0);
        var r3cell0value = $('<div style="height:34px;width:110px;display:inline-block;line-height:34px;">' + featuredata.ASSOCIATORNUMBERS + '</div>').appendTo(r3cell0);
        var r3cell1 = $('<div style="height:34px;width:196px;display:inline-block;float:left;"></div>').appendTo(row3);
        var r3cell1title = $('<div style="height:34px;width:72px;display:inline-block;line-height:34px;padding-right:8px;float:left;text-align:right">经合范围</div>').appendTo(r3cell1);
        var r3cell1value = $('<div style="height:34px;width:115px;display:inline-block;line-height:34px;">' + featuredata.SCOPEOFOPERATION + '</div>').appendTo(r3cell1);

        var row4 = $('<div style="height:34px;width:100%;border-bottom:1px solid #ddd"></div>').appendTo(content);
        var r4cell0 = $('<div style="height:34px;width:196px;border-right:1px solid #ddd;display:inline-block;float:left;"></div>').appendTo(row4);
        var r4cell0title = $('<div style="height:34px;width:72px;display:inline-block;line-height:34px;padding-right:8px;float:left;text-align:right">基地面积</div>').appendTo(r4cell0);
        var r4cell0value = $('<div style="height:34px;width:110px;display:inline-block;line-height:34px;">' + featuredata.PRODUCTIONBASEAREA + '</div>').appendTo(r4cell0);
        var r4cell1 = $('<div style="height:34px;width:196px;display:inline-block;float:left;"></div>').appendTo(row4);
        var r4cell1title = $('<div style="height:34px;width:72px;display:inline-block;line-height:34px;padding-right:8px;float:left;text-align:right">基地产量</div>').appendTo(r4cell1);
        var r4cell1value = $('<div style="height:34px;width:110px;display:inline-block;line-height:34px;">' + featuredata.BASEPRODUCTION + '</div>').appendTo(r4cell1);

        var row5 = $('<div style="height:34px;width:100%;border-bottom:1px solid #ddd"></div>').appendTo(content);
        var r5cell0 = $('<div style="height:34px;width:196px;border-right:1px solid #ddd;display:inline-block;float:left;"></div>').appendTo(row5);
        var r5cell0title = $('<div style="height:34px;width:72px;display:inline-block;line-height:34px;padding-right:8px;float:left;text-align:right">就业人数</div>').appendTo(r5cell0);
        var r5cell0value = $('<div style="height:34px;width:110px;display:inline-block;line-height:34px;">' + featuredata.EMPLOYMENTNUMBER + '</div>').appendTo(r5cell0);
        var r5cell1 = $('<div style="height:34px;width:196px;display:inline-block;float:left;"></div>').appendTo(row5);
        var r5cell1title = $('<div style="height:34px;width:72px;display:inline-block;line-height:34px;padding-right:8px;float:left;text-align:right">年产值</div>').appendTo(r5cell1);
        var r5cell1value = $('<div style="height:34px;width:110px;display:inline-block;line-height:34px;">' + featuredata.ANNUALPRODUCTION + '</div>').appendTo(r5cell1);

        OrchardMapTip.Add(content);
    }
    function getorchardvariety(orchardname) {
        var varietydata;
        var con = " 1=1 AND \"ORCHARDNAME\"='" + orchardname + "' ";
        var cajax = $.ajax({
            url: dev.GetSystemUrlByRelID("Service") + "orchardVariety/getbyfilter",
            type: "Post",
            async: false,
            contentType: 'application/json',
            dataType: 'json',
            data: con,
            success: function (result) {
                varietydata = result.data;
            }
        });
        return varietydata;
    }
})(jQuery);