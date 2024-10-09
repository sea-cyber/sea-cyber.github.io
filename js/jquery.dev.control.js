//dataGrid
(function ($) {
    var dev;
    UCDataGrid = function (sender, param) {
        dev = sender;
        if (dev.IsNull(param)) param = {};
        this.Visible = dev.IsBoolean(param.Visible) ? opt.Visible : true;
        param.Target = $('<div style="width:' + param.Width + '; height:' + param.Height + ';"></div>');
        $.extend(this, new dev.Control(param));
        this.ID = param.ID;
        this.TextPrompt = dev.IsNull(param.TextPrompt) ? "" : param.TextPrompt;
        this.PageIndex = parseInt(param.PageIndex);
        this.PageSize = parseInt(param.PageSize);
        this.Columns = param.Columns;
        this.RowNumbers = dev.IsNull(param.RowNumbers) ? true : param.RowNumbers;
        this.IsPage = dev.IsNull(param.IsPage) ? true : param.IsPage;
        this.ShowHeader = dev.IsNull(param.ShowHeader) ? true : param.ShowHeader;
        this.FitColumns = dev.IsNull(param.FitColumns) ? true : param.FitColumns;
        this.IsSizeSelect = dev.IsBoolean(param.IsSizeSelect) ? param.IsSizeSelect : false;
        this.PageList = dev.IsNull(param.PageList) ? [{ id: 0, text: 5 }, { id: 1, text: 10 }, { id: 2, text: 20 }, { id: 3, text: 30 }, { id: 4, text: 40 }, { id: 5, text: 50 }] : param.PageList;
        this.PageListValue = dev.IsNull(param.PageListValue) ? "id" : param.PageListValue;
        this.PageListText = dev.IsNull(param.PageListText) ? "text" : param.PageListText;
        this.View = param.View;
        //var options = $('<div id="buttons"><table style="border-spacing:0"><tr><td><input id="searchFilter" class="easyui-searchbox" style="width:200px;"></td><td>'
        //               + '<span id="lblMsg" style="height: 30px;color:red;"></span></td></tr></table></div>');
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
                    collapsible: false,
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
                    onCheck: function (index, row) {
                        $this.Target.triggerHandler("onCheck", { index: index, Row: row });
                    },
                    onUncheck: function (index, row) {
                        $this.Target.triggerHandler("onUncheck", { index: index, Row: row });
                    },
                    onCheckAll: function (rows) {
                        $this.Target.triggerHandler("onCheckAll", { Rows: rows });
                    },
                    onUncheckAll: function (rows) {
                        $this.Target.triggerHandler("onUncheckAll", { Rows: rows });
                    },
                    onLoadSuccess: function (data) {
                        $this.Target.triggerHandler("onLoadSuccess", data);
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
                    // if (this.pagequery) parampage.buttons = this.buttons;
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
                this.DataGrid.datagrid('loadData', data);
                if (this.IsPage)
                    this.Pager.pagination('refresh', { total: pageInfo.totalCount,pageSize:pageInfo.pageSize,pageNumber: pageInfo.pageIndex, displayMsg: "当前页显示第" + (((pageInfo.pageIndex - 1) * pageInfo.pageSize) + 1) + "-" + (pageInfo.pageIndex * pageInfo.pageSize) + "条记录,共{total}条数据" });
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
//自定义时间轴控件
(function ($) {
    var dev;
    function getsplitlen($this) {
        var parentnodenum = $this.Data.length;
        var tempdata = Enumerable.From($this.Data).Where('s=>s.Children!=undefined && s.Children!=null').ToArray();
        var childnodenum = Enumerable.From(tempdata).Sum('s=>s.Children.length');
        var linenum = parentnodenum + childnodenum - 1;
        var alllength = $this.Target.width();
        if (!$this.IsHorizontal) alllength = $this.Target.height();
        var linelength = alllength - (parentnodenum * ($this.SameLever ? $this.PointSize : $this.ParentLeverSize) + childnodenum * $this.PointSize);
        var temp = linelength % linenum;
        var marginleft = (linelength - temp) / linenum;
        return { marginleft: marginleft, lastmarginleft: marginleft + temp };
    }
    function getnodenum($this) {
        var parentnodenum = $this.Data.length;
        var tempdata = Enumerable.From($this.Data).Where('s=>s.Children!=undefined && s.Children!=null').ToArray();
        var childnodenum = Enumerable.From(tempdata).Sum('s=>s.Children.length');
        return (parentnodenum + childnodenum);
    }
    function getnodehtml($this, splitnum, ischild) {
        var currsize = ($this.SameLever ? $this.PointSize : $this.ParentLeverSize);
        if (ischild) currsize = $this.PointSize;
        var top = ($this.Target.height() - currsize) / 2;
        var haspoint = $(".point", $this.Target);
        var positionleft = 0;
        for (var p = 0; p < haspoint.length; p++) {
            var w = $(haspoint[p]).outerWidth();
            positionleft += (w + splitnum);
        }
        return $('<div class="point" style="left:' + positionleft + 'px;top:' + top + 'px; height:' + (currsize - 4) + 'px;width:' + (currsize - 4) + 'px;border-radius:' + (currsize - 2) + 'px;"></div>');
    }
    function getnodetiphtml($this, currdata, pointnode) {
        if (dev.IsNull(currdata) || dev.IsNull(pointnode)) return;
        var txttips = $(".texttip", $this.Target);
        var curpointsiton = "";
        var defualtPosition = (txttips.length % 2 == 0) ? "Bottom" : "Top";
        var position = dev.IsNull(currdata.Position) ? defualtPosition : currdata.Position;
        var top = parseInt(pointnode.css("top"));
        if (position.toLowerCase() == "top") top -= (($this.PointSize) + 5);
        if (position.toLowerCase() == "bottom") top += pointnode.outerHeight() + 1;
        var tiphtml = $('<div class="texttip" style="left:0px;top:' + top + 'px;">' + (dev.IsNull(currdata.Text) ? "" : currdata.Text) + '</div>').appendTo($this.Target);// + dev.IsNull(currdata.Text) ? "" : currdata.Text + 
        var left = parseInt(pointnode.css("left")) + (pointnode.outerWidth() / 2);
        var tipw = tiphtml.outerWidth() / 2;
        var needleft = txttips.length == 0 ? left : (left - tipw);
        var nodenum = getnodenum($this);
        if (nodenum > 1 && txttips.length == getnodenum($this) - 1) {
            tiphtml.css("left", (left - tiphtml.outerWidth()) + "px");
        }
        else tiphtml.css("left", needleft + "px");
    }
    TimeLineX = function (sender, opt) {
        dev = sender;
        if (dev.IsNull(opt)) opt = {};
        this.SameLever = dev.IsBoolean(opt.SameLever) ? opt.SameLever : true;
        this.Data = dev.IsNull(opt.Data) ? [] : opt.Data;
        this.IsHorizontal = dev.IsBoolean(opt.IsHorizontal) ? opt.IsHorizontal : opt.IsHorizontal != "false";
        this.PointSize = dev.IsNumber(opt.PointSize) ? opt.PointSize : 20;
        this.ParentLeverSize = dev.IsNumber(opt.ParentLeverSize) ? opt.ParentLeverSize : 36;
        this.Left = dev.IsNumber(opt.Left) ? opt.Left : 0;
        this.Top = dev.IsNumber(opt.Top) ? opt.Top : 0;
        this.LastTipWidth = dev.IsNumber(opt.LastTipWidth) ? opt.LastTipWidth : 100;
        if (this.IsHorizontal) opt.Target = $('<div class="timeline" style="width:' + (dev.IsNumber(opt.Width) ? (opt.Width + "px") : "100%") + '; height:' + (dev.IsNumber(opt.Height) ? opt.Height : 40) + 'px;left:' + this.Left + 'px;top:' + this.Top + 'px;">');
        else opt.Target = $('<div class="timeline" style=" width:' + (dev.IsNumber(opt.Width) ? opt.Width : 40) + 'px;height:' + (dev.IsNumber(opt.Height) ? (opt.Height + "px") : "100%") + '; overflow:hidden;left:' + this.Left + 'px;top:' + this.Top + 'px;">');
        $.extend(this, new dev.Control(opt));
        var $this = this;
    }
    $.fn.extend(TimeLineX.prototype, {
        Layout: function () {
            if (this.IsHorizontal) this.Line = $('<div class="line" style="width:100%;height:4px;top:50%;margin-top:-2px;display:none;"></div>').appendTo(this.Target);
            else this.Line = $('<div class="line" style="width:6px;height:100%;left:50%;margin-left:-3px;display:none;"></div>').appendTo(this.Target);
            if (dev.IsNull(this.Data) || this.Data.length == 0) return;
        },
        LoadData: function (data) {
            var $this = this;
            $(".point", this.Target).remove();
            $(".texttip", this.Target).remove();
            if (dev.IsNull(data) || data.length == 0) { $(".line", this.Target).css("display", "none"); return; }
            this.Data = data;
            $(".line", this.Target).css("display", data.length > 1 ? "block" : "none");
            var splitparam = getsplitlen(this);
            var splitnum = splitparam.marginleft;
            var lastsplitnum = splitparam.lastmarginleft;
            for (var i = 0; i < this.Data.length; i++) {
                var point = getnodehtml(this, splitnum).appendTo(this.Target);
                point.prop("$this", this.Data[i]);
                point.click(function () {
                    var ps = $(".point", $this.Target);
                    for (var z = 0; z < ps.length; z++) $(ps[z]).removeClass("selectpoint");
                    $(this).addClass("selectpoint");
                    $this.Target.triggerHandler("onSelectNode", $(this).prop("$this"));
                })
                getnodetiphtml(this, this.Data[i], point);
                if (dev.IsNull(this.Data[i].Children) || this.Data[i].Children.length == 0) continue;
                for (var j = 0; j < this.Data[i].Children.length; j++) {
                    var cpoint = getnodehtml(this, splitnum, true).appendTo(this.Target);
                    cpoint.click(function () {
                        var ps = $(".point", $this.Target);
                        for (var z = 0; z < ps.length; z++) $(ps[z]).removeClass("selectpoint");
                        $(this).addClass("selectpoint");
                        $this.Target.triggerHandler("onSelectNode", $(this).prop("$this"));
                    });
                    cpoint.prop("$this", this.Data[i].Children[j]);
                    getnodetiphtml(this, this.Data[i].Children[j], cpoint);
                }
            }
            //获取最后一个节点的数据
            var lastnode = $(".point:last", this.Target);
            var lastleft = parseInt(lastnode.css("left")) - splitnum + lastsplitnum;
            lastnode.css("left", lastleft);
            var lasttip = $(".texttip:last", this.Target);
            var lastleft = lastleft + (lastnode.outerWidth() / 2) - lasttip.outerWidth();
            lasttip.css("left", lastleft + "px");
        },
        Resize: function () {
            if (dev.IsNull(this.Data) || this.Data.length == 0) return;
            var splitparam = getsplitlen(this);
            var splitnum = splitparam.marginleft;
            var lastsplitnum = splitparam.lastmarginleft;
            var nodes = $('.point', this.Target);
            var tips = $(".texttip", this.Target);
            var positionleft = 0;
            for (var i = 0; i < nodes.length; i++) {
                $(nodes[i]).css("left", positionleft + "px");
                var left = parseInt($(nodes[i]).css("left")) + ($(nodes[i]).outerWidth() / 2);
                var tipw = $(tips[i]).outerWidth() / 2;
                $(tips[i]).css("left", (i == 0 ? left : (left - tipw)) + "px");
                if (i == nodes.length - 1) {
                    var tempw = parseInt($(nodes[i]).css("left")) + ($(nodes[i]).outerWidth() / 2) - this.LastTipWidth;
                    $(tips[i]).css("left", tempw + "px");
                    continue;
                }
                var w = $(nodes[i]).outerWidth();
                positionleft += (w + ((i == nodes.length - 2) ? lastsplitnum : splitnum));
            }
        },
        SetTipFont: function (fontCss) {
            if (dev.IsNull(fontCss)) return;
            $(".texttip", this.Target).css(fontCss);
        },
        SetSelect: function (index) {
            if (!dev.IsNumber(index)) return;
            var ps = $(".point", this.Target);
            for (var z = 0; z < ps.length; z++) {
                if (index == z) $(ps[z]).addClass("selectpoint");
                else $(ps[z]).removeClass("selectpoint");
            }
        },
        GetSelectNode: function () {
            var selectnode = $(".selectpoint", this.Target);
            if (dev.IsNull(selectnode)) return;
            return selectnode.prop("$this");
        },
        GetSelectIndex: function () {
            if (dev.IsNull(this.Data) || this.Data.length == 0) return null;
            var selectnode = this.GetSelectNode();
            var index = Enumerable.From(this.Data).IndexOf(selectnode);
            return index;
        },
        Clear: function () {
            $(".point", this.Target).remove();
            $(".texttip", this.Target).remove();
            $(".line", this.Target).css("display", "none");
        }
    });

})(jQuery);
//绘制温度计
(function ($) {
    var dev;
    UCThermometer = function (sender, param) {
        dev = sender;
        if (dev.IsNull(param)) param = {};
        this.Value = dev.IsNumber(param.Value) ? param.Value : 0;
        param.Height = dev.IsNumber(param.Height) ? param.Height : 170;
        this.Height = param.Height;
        param.Width = dev.IsNumber(param.Width) ? param.Width : 60;
        this.Width = param.Width;
        this.MinValue = dev.IsNumber(param.MinValue) ? param.MinValue : -30;
        this.MaxValue = dev.IsNumber(param.MaxValue) ? param.MaxValue : 60;
        this.ValueInterval = dev.IsNumber(param.ValueInterval) ? param.ValueInterval : 2.5;
        this.Value = dev.IsNumber(param.Value) ? param.Value : 0;
        this.scalelen = dev.IsNumber(param.scalelen) ? param.scalelen : 10;
        this.scalecolor = dev.IsNull(param.scalecolor) ? "#bababa" : param.scalecolor;//0以上刻度颜色
        this.scaleuncolor = dev.IsNull(param.scaleuncolor) ? "#0b86ee" : param.scaleuncolor;//0以下刻度线颜色
        this.scalefontcolor = dev.IsNull(param.scalefontcolor) ? "#bababa" : param.scalefontcolor;//0以上刻度字体颜色
        this.scaleunfontcolor = dev.IsNull(param.scaleunfontcolor) ? "#0b86ee" : param.scaleunfontcolor;//0以下的刻度字体颜色
        this.OuterBg = dev.IsNull(param.OuterBg) ? "#e7ebef" : param.OuterBg;
        this.InnerBg = dev.IsNull(param.InnerBg) ? "#0b86ee" : param.InnerBg;//内部圆的颜色
        this.InnerBodyBG = dev.IsNull(param.InnerBg) ? "linear-gradient(to top, #0b86ee, #e14cf3);" : param.InnerBg;
        this.Border = dev.IsNull(param.Border) ? "1px solid #d5dee8" : param.Border;//温度计外边框
        param.Target = $('<div style="width:' + this.Width + 'px;height:' + this.Height + 'px;position:relative;"></div>');
        $.extend(this, new dev.Control(param));
        this.tempoutbottom = $('<div style="position:absolute;height:28px;width:28px; border-radius: 14px; bottom: 5px; left: 40px; z-index: 2; background-color:' + this.OuterBg + ';border:' + this.Border + '"></div>').appendTo(this.Target);
        this.tempoutbody = $('<div style="position: absolute; height: ' + (this.Height - 28) + 'px; width: 14px; background:' + this.OuterBg + '; bottom: 20px; left: 47px; border-top-right-radius: 6px; border-top-left-radius: 6px;border:' + this.Border + '"></div>').appendTo(this.Target);
        this.tempinnerbottom = $('<div style="position: absolute; height: 20px; width: 20px; background:' + this.InnerBg + '; border-radius: 10px; bottom: 10px; left: 45px; z-index: 4;"></div>').appendTo(this.Target);
        this.tempinnerbody = $('<div style="position: absolute; height: 8px; width: 8px; background:' + this.InnerBodyBG + '; bottom: 20px; left: 51px; border-top-right-radius: 4px; border-top-left-radius: 4px; z-index:3"></div>').appendTo(this.Target);
        this.tempscale = $('<div style="height:' + (this.Height - 28) + 'px; width: 30px; position: absolute; left: 10px; bottom: 28px;"><canvas id="tempcanvas"></canvas></div>').appendTo(this.Target);
        //鼠标滑过展示的气泡
        this.tippointer = $('<div class="tip" style="display:none;background: #F9F9F9;position:absolute;margin-left:70px;width: 50px;height: 30px;border: 1px solid #7CB5EC;border-radius: 5px;"><div class="inner" style="background-color: #F9F9F9;width: 8px;height: 8px;border: 1px solid #7CB5EC;position: relative;left: -5px;top: 11px;transform: rotate(45deg);-ms-transform: rotate(45deg);-moz-transform: rotate(45deg);-webkit-transform: rotate(45deg);-o-transform: rotate(45deg);border-right: 0px;border-top: 0px;"></div><div style="text-align:center;color:#333333;font-weight:bold;line-height:15px;font-size:12px;height:30px;" class="value"><a style="color:#333333;">' + this.Value + '</a></div></div>').appendTo(this.Target);
        FuncEx(this);
    }
    function FuncEx(control) {
        $.fn.extend(control, {
            Layout: function () {
                var $this = this;
                var canvas = $("#tempcanvas", this.tempscale)[0];
                var ctx = canvas.getContext("2d");
                canvas.height = this.Height - 28;
                canvas.width = this.Width - (this.Width / 2);
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                var splitnum = (this.MaxValue - this.MinValue) / this.ValueInterval;
                var splitlen = (this.tempscale.height() - 10) / splitnum;
                for (var i = 0; i < splitnum; i++) {
                    var numtext = (this.MaxValue - (this.ValueInterval * i));
                    var beginx = this.scalelen;
                    if (i == 0 || i % 4 == 0) beginx = this.scalelen;
                    else {
                        if (i % 2 == 0) beginx = this.scalelen + 5;
                        else beginx = this.scalelen + 10;
                    }
                    if (numtext <= 0) ctx.strokeStyle = this.scaleuncolor;
                    else ctx.strokeStyle = this.scalecolor;
                    ctx.beginPath();
                    ctx.moveTo(beginx, (i * splitlen) + 10);
                    ctx.lineTo(30, (i * splitlen) + 10);
                    ctx.stroke();
                    ctx.closePath();
                    if (i % 4 == 0) {
                        if (numtext <= 0) ctx.fillStyle = this.scaleunfontcolor;
                        else ctx.fillStyle = this.scalefontcolor;
                        ctx.fillText(Math.abs((this.MaxValue - this.ValueInterval * i)), 0, (i * splitlen) + 14);
                    }
                }
                if (dev.IsNull(this.Value)) this.SetValue(this.Value);
                //加上鼠标滑过事件
                this.Target.mouseover(function () {
                    var height = (($this.Value - $this.MinValue) / ($this.MaxValue - $this.MinValue)) * ($this.tempscale.height() - 10) + 8;
                    var bottom = height + parseFloat($this.tempinnerbody.css("bottom")) - ($(".tip").height() / 2);
                    $(".tip", this).css("display", "block");
                    $(".tip", this).css("bottom", bottom);
                    $(".value a", this).text($this.Value + "℃");
                }).mouseout(function () {
                    $(".tip", this).css("display", "none");
                    $(".value a", this).text(0 + "℃");
                });
            },
            Resize: function (width, height) {
                if (dev.IsNumber(width)) this.Width = width;
                if (dev.IsNumber(height)) this.Height = height;
                this.tempoutbody.height(this.Height - 28);
                this.tempscale.height(this.Height - 28);
                this.Layout();
            },
            SetValue: function (value) {
                if (dev.IsNull(value) || !dev.IsNumber(value)) return;
                this.Value = value;
                var height = ((value - this.MinValue) / (this.MaxValue - this.MinValue)) * (this.tempscale.height() - 10);
                this.tempinnerbody.height(8 + height);
            },
            Clear: function () {
                this.Target.remove();
            },
            SetOuterBg: function (color) {
                if (dev.IsNull(color)) return;
                this.tempoutbottom.css("background-color", color);
                this.this.tempoutbody.css("background-color", color);
            },
            SetInnerBg: function (color) {
                if (dev.IsNull(color)) return;
                this.tempinnerbottom.css("background-color", color);
                this.tempinnerbody.css("background-color", color);
            },
            SetInterval: function (interval) {
                if (dev.IsNull(interval) || !dev.IsNumber(interval)) return;
                this.ValueInterval = interval;
                this.Layout();
            }
        })
    }
})(jQuery);
//风向仪表盘
(function ($) {
    var dev;
    function drawCentroidGuidewire($this, loc) {
        var angle = (Math.PI * ($this.AngleValue - 90)) / 180, radius, endpt;
        radius = $this.circle.radius + $this.RingOuterRadius;
        if (loc.x >= $this.circle.x) {
            endpt = {
                x: $this.circle.x + radius * Math.cos(angle),
                y: $this.circle.y + radius * Math.sin(angle)
            };
        }
        else {
            endpt = {
                x: $this.circle.x - radius * Math.cos(angle),
                y: $this.circle.y - radius * Math.sin(angle)
            };
        }
        $this.ctx.save();
        $this.ctx.strokeStyle = $this.guidewire_stroke_style;
        $this.ctx.fillStyle = $this.guidewire_fill_style;
        $this.ctx.beginPath();
        $this.ctx.moveTo($this.circle.x, $this.circle.y);
        $this.ctx.lineTo(endpt.x, endpt.y);
        $this.ctx.stroke();
        $this.ctx.beginPath();
        $this.ctx.strokeStyle = $this.tick_long_stroke_style;
        $this.ctx.arc(endpt.x, endpt.y, $this.centroid_radius, 0, Math.PI * 2, false);
        $this.ctx.fill();
        $this.ctx.stroke();
        $this.ctx.restore();
        $this.ctx.closePath();
    }
    function drawRing($this) {
        drawRingOuterCircle($this);
        $this.ctx.strokeStyle = $this.BorderStyle;
        $this.ctx.arc($this.circle.x, $this.circle.y, $this.circle.radius + $this.RingInnerRadius, 0, Math.PI * 2, false);
        $this.ctx.fillStyle = $this.FillStyle;
        $this.ctx.fill();
        $this.ctx.stroke();
    }
    function drawRingOuterCircle($this) {
        $this.ctx.beginPath();
        $this.ctx.strokeStyle = $this.FillStyle;
        $this.ctx.arc($this.circle.x, $this.circle.y, $this.circle.radius + $this.RingOuterRadius, 0, Math.PI * 2, true);
        $this.ctx.stroke();
    }
    function drawTickInnerCircle($this) {
        $this.ctx.save();
        $this.ctx.beginPath();
        $this.ctx.strokeStyle = $this.innerCircleBorder;
        $this.ctx.arc($this.circle.x, $this.circle.y, $this.circle.radius + $this.RingInnerRadius - $this.tick_width, 0, Math.PI * 2, false);
        $this.ctx.stroke();
        $this.ctx.restore();
    }
    function drawTicks($this) {
        var radius = $this.circle.radius + $this.RingInnerRadius,
             angle_max = 2 * Math.PI,
             angle_delta = Math.PI / 64;
        $this.ctx.save();
        for (var angle = 0, cnt = 0; angle < angle_max; angle += angle_delta, cnt++) {
            drawTick($this, angle, radius, cnt++);
        }
        $this.ctx.restore();
    }
    function drawTick($this, angle, radius, cnt) {
        var tickWidth = cnt % 4 === 0 ? $this.tick_width : $this.tick_width / 2;
        if ($this.IsShowallTick) {
            $this.ctx.beginPath();
            $this.ctx.moveTo($this.circle.x + Math.cos(angle) * (radius - tickWidth), $this.circle.y + Math.sin(angle) * (radius - tickWidth));
            $this.ctx.lineTo($this.circle.x + Math.cos(angle) * radius, $this.circle.y + Math.sin(angle) * radius);
            $this.ctx.strokeStyle = $this.BorderStyle;
            $this.ctx.stroke();
            $this.ctx.closePath();
        }
        if (cnt % 32 == 0) {
            $this.ctx.beginPath();
            $this.ctx.moveTo($this.circle.x + Math.cos(angle) *
           (radius - tickWidth - 5), $this.circle.y + Math.sin(angle) *
           (radius - tickWidth - 5));
            $this.ctx.lineTo($this.circle.x + Math.cos(angle) * radius, $this.circle.y + Math.sin(angle) * radius);
            $this.ctx.strokeStyle = $this.innerCircleBorder;
            $this.ctx.stroke();
            $this.ctx.closePath();
            $this.ctx.restore();
        }
    }
    function drawAnnotations($this) {
        var radius = $this.circle.radius + $this.RingInnerRadius;
        $this.ctx.save();
        $this.ctx.fillStyle = $this.annotations_fill_style;
        $this.ctx.font = $this.annotations_text_size + 'px Helvetica';
        for (var angle = 0; angle < 2 * Math.PI; angle += Math.PI / 4) {
            $this.ctx.beginPath();
            var index = angle / (Math.PI / 4);
            $this.ctx.fillText($this.textarr[index],
                $this.circle.x + Math.cos(angle) * (radius - $this.tick_width * 2),
                 $this.circle.y - Math.sin(angle) * (radius - $this.tick_width * 2));
            $this.ctx.fillText($this.numberarr[index],
                $this.circle.x + Math.cos(angle) * (radius + 10),
                $this.circle.y - Math.sin(angle) * (radius + 10));
        }
        $this.ctx.restore();
    }
    UCWindMeter = function (sender, opt) {
        dev = sender;
        if (dev.IsNull(opt)) opt = {};
        opt.Width = dev.IsNumber(opt.Width) ? opt.Width : 200;
        opt.Height = dev.IsNumber(opt.Height) ? opt.Height : 200;
        this.AngleValue = dev.IsNumber(opt.AngleValue) ? opt.AngleValue : 0;
        if (dev.IsNull(opt.Target)) opt.Target = $('<div style="position:relative;width:' + opt.Width + 'px;height:' + opt.Height + 'px;"></div>');
        $.extend(this, new dev.Control(opt));
        this.canvas = $('<canvas width="' + this.Width + '" height="' + this.Height + '"></canvas>').appendTo(this.Target);
        this.circle = { x: 0, y: 0, radius: 0 };
        this.BorderStyle = dev.IsNull(opt.BorderStyle) ? "rgba(100,140,230,0.5)" : opt.BorderStyle;
        this.FillStyle = dev.IsNull(opt.FillStyle) ? "rgba(100, 140, 230, 0.1)" : opt.FillStyle;
        this.RingInnerRadius = dev.IsNumber(opt.RingInnerRadius) ? opt.RingInnerRadius : 35;//内圆半径
        this.RingOuterRadius = dev.IsNumber(opt.RingOuterRadius) ? opt.RingOuterRadius : 55;//外圆半径
        this.guidewire_stroke_style = dev.IsNull(opt.guidewire_stroke_style) ? 'goldenrod' : opt.guidewire_stroke_style;//值指针颜色
        this.guidewire_fill_style = dev.IsNull(opt.guidewire_fill_style) ? "rgba(250,250,0,0.6)" : opt.guidewire_fill_style;//值指针填充色
        this.tick_long_stroke_style = dev.IsNull(opt.tick_long_stroke_style) ? opt.tick_long_stroke_style : "rgba(100,140,230,0.9)";//刻度颜色
        this.centroid_radius = dev.IsNumber(opt.centroid_radius) ? opt.centroid_radius : 5;//值刻度圆半径
        this.tick_width = dev.IsNumber(opt.tick_width) ? opt.tick_width : 10;//刻度长度
        this.annotations_fill_style = dev.IsNull(opt.annotations_fill_style) ? "rgba(0,0,230,0.9)" : opt.annotations_fill_style;//刻度相关提示文字颜色
        this.annotations_text_size = dev.IsNumber(opt.annotations_text_size) ? opt.annotations_text_size : 12;//刻度文字大小
        this.textarr = dev.IsNull(opt.textarr) ? ["东", "东北", "北", "西北", "西", "西南", "南", "东南"] : opt.textarr;
        this.numberarr = dev.IsNull(opt.numberarr) ? ["90°", "45°", "360°", "315°", "270°", "225°", "180°", "135°"] : opt.numberarr;
        this.innerCircleBorder = dev.IsNull(opt.innerCircleBorder) ? "#0b86ee" : opt.innerCircleBorder;//内环和刻度颜色
        this.IsShowallTick = dev.IsBoolean(opt.IsShowallTick) ? opt.IsShowallTick : false;//是否显示全部刻度
        //鼠标滑过展示的提示气泡
        this.tippointer = $('<div class="tip" style="background: #F9F9F9;display:none;position: absolute;margin-left:55px;width: 60px;height: 30px;border: 1px solid #7CB5EC;border-radius: 5px;"><div class="inner" style="background-color: #F9F9F9;width: 8px;height: 8px;border: 1px solid #7CB5EC;position: relative;left: 20px;top: -6px;transform: rotate(45deg);-ms-transform: rotate(45deg);-moz-transform: rotate(45deg);-webkit-transform: rotate(45deg);-o-transform: rotate(45deg);border-right: 0px;border-bottom: 0px;"></div><div style="text-align:center;color:#333333;font-weight:bold;line-height:15px;font-size:12px;height:30px;" class="value"><a style="color:#333333;">' + this.AngleValue + '</a> </div></div>').appendTo(this.Target);
    }
    $.fn.extend(UCWindMeter.prototype, {
        Layout: function () {
            var $this = this;
            var windcanvas = this.canvas[0];
            this.ctx = windcanvas.getContext("2d");
            this.ctx.clearRect(0, 0, windcanvas.width, windcanvas.height);
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.circle.x = windcanvas.width / 2;
            this.circle.y = windcanvas.width / 2;
            this.circle.radius = (windcanvas.width) / 2 - (this.RingOuterRadius + 5);
            this.ctx.beginPath();
            this.ctx.lineWidth = 1;
            this.ctx.strokeStyle = this.BorderStyle;
            this.ctx.arc(this.circle.x, this.circle.y, this.circle.radius, 0, 2 * Math.PI, true);
            this.ctx.stroke();
            this.ctx.fillStyle = this.FillStyle;
            this.ctx.fill();
            this.ctx.restore();
            this.ctx.closePath();
            var loc = { x: this.circle.x, y: this.circle.y };
            drawCentroidGuidewire(this, loc);
            drawRing(this);
            drawTickInnerCircle(this);
            drawTicks(this);
            drawAnnotations(this);
            //鼠标滑过事件
            this.Target.mouseover(function () {
                $(".tip", this).css("display", "block");
                $(".tip", this).css("bottom", $this.Height / 2 - ($(".tip").height() / 2));
                var value = "";
                var angleVlue = parseFloat($this.AngleValue);
                if (angleVlue > 0 && angleVlue < 90) value = "偏东北风";
                if (angleVlue > 90 && angleVlue < 180) value = "偏东南风";
                if (angleVlue > 180 && angleVlue < 270) value = "偏西北风";
                if (angleVlue > 270 && angleVlue < 360) value = "偏西南风";
                if (angleVlue == 0 || angleVlue == 360) value = "北风";
                if (angleVlue == 90) value = "东风";
                if (angleVlue == 180) value = "南风";
                if (angleVlue == 270) value = "西风";
                $(".value a", this).text(value);
            }).mouseout(function () {
                $(".tip", this).css("display", "none");
                $(".value a", this).text(0 + "°");
            });
        },
        SetAngleValue: function (value) {
            if (dev.IsNull(value) || !dev.IsNumber(value)) return;
            this.AngleValue = value;
            this.Layout();
        },
        Clear: function () {
            this.Target.remove();
        }
    });
})(jQuery);
//量筒
(function ($) {
    var dev;
    UCBottle = function (sender, opt) {
        dev = sender;
        if (dev.IsNull(opt)) opt = {};
        opt.Width = dev.IsNumber(opt.Width) ? opt.Width : 60;
        opt.Height = dev.IsNumber(opt.Height) ? opt.Height : 160;
        this.Height = opt.Height;
        this.Width = opt.Width;
        this.watercolor = dev.IsNull(opt.watercolor) ? "lightskyblue" : opt.watercolor;
        if (dev.IsNull(opt.Target)) opt.Target = $('<div style="position:relative;height:' + opt.Height + 'px;width:' + opt.Width + 'px;"></div>');
        $.extend(this, new dev.Control(opt));
        this.outerBorder = dev.IsNull(opt.outerBorder) ? "1px solid #d5dee8" : opt.outerBorder;//外边框
        this.outerBg = dev.IsNull(opt.outerBg) ? "#e7ebef" : opt.outerBg;//外背景
        this.innerBg = dev.IsNull(opt.innerBg) ? "linear-gradient(to top, #0b86ee, #82cbff);" : opt.innerBg;//内背景
        this.outerBody = $('<div style="position:absolute;height:' + (this.Height - 10) + 'px;width:' + parseInt(this.Width / 2) + 'px;bottom:5px;left:' + (this.Width - parseInt(this.Width / 2)) + 'px;border:' + this.outerBorder + ';background:' + this.outerBg + ';"></div>').appendTo(this.Target);
        this.innerBody = $('<div style="position:absolute;height:0px;width:' + (this.Width - parseInt(this.Width / 2)) + 'px; background:' + this.watercolor + '; bottom:0px;background:' + this.innerBg + '"></div>').appendTo(this.outerBody);
        this.canvasContain = $('<div style="height:' + (this.Height - 20) + 'px;width:' + (this.Width - parseInt(this.Width / 2)) + 'px; position: absolute;left: 0px; bottom: 5px;"></div>').appendTo(this.Target);
        this.canvas = $('<canvas class="raincanvas" width="' + (this.Width - parseInt(this.Width / 2)) + '" height="' + (this.Height - 20) + '"></canvas>').appendTo(this.canvasContain);
        this.Value = dev.IsNumber(opt.Value) ? opt.Value : 0;
        this.MaxValue = dev.IsNumber(opt.MaxValue) ? opt.MaxValue : 200;
        this.MinValue = dev.IsNumber(opt.MinValue) ? opt.MinValue : 0;
        this.Step = dev.IsNumber(opt.Step) ? opt.Step : 5;
        this.ScaleWidth = dev.IsNumber(opt.ScaleWidth) ? opt.ScaleWidth : 5;
        this.ValueInteval = dev.IsNumber(opt.ValueInteval) ? opt.ValueInteval : 4;
        this.BorderStyle = dev.IsNull(opt.BorderStyle) ? "#0b86ee" : opt.BorderStyle;//刻度颜色
        this.scalefontcolor = dev.IsNull(opt.scalefontcolor) ? "#0b86ee" : opt.scalefontcolor;//刻度字体颜色
        //鼠标滑过展示的气泡
        this.tippointer = $('<div class="tip" style="display:none;background: #F9F9F9;position: absolute;margin-left:70px;width: 45px;height: 30px;border: 1px solid #7CB5EC;border-radius: 5px;"><div class="inner" style="background-color: #F9F9F9;width: 8px;height: 8px;border: 1px solid #7CB5EC;position: relative;left: -5px;top: 11px;transform: rotate(45deg);-ms-transform: rotate(45deg);-moz-transform: rotate(45deg);-webkit-transform: rotate(45deg);-o-transform: rotate(45deg);border-right: 0px;border-top: 0px;"></div><div style="text-align:center;color:#333333;font-weight:bold;line-height:15px;font-size:12px;height:30px;" class="value"><a style="color:#333333;">' + this.Value + '</a></div></div>').appendTo(this.Target);
        FuncEx(this);
    }
    function FuncEx(control) {
        $.fn.extend(control, {
            Layout: function () {
                var $this = this;
                var bottlecanvars = this.canvas[0];
                var bottlectx = bottlecanvars.getContext("2d");
                bottlectx.clearRect(0, 0, bottlecanvars.width, bottlecanvars.height);
                var scalenum = parseInt((this.MaxValue - this.MinValue) / this.Step);
                var scalelen = bottlecanvars.height / scalenum;
                for (var i = 0; i < scalenum; i++) {
                    bottlectx.beginPath();
                    var beginx = bottlecanvars.width - this.ScaleWidth;
                    if (i % 4 == 0) beginx -= 5;
                    bottlectx.moveTo(beginx, bottlecanvars.height - (i * scalelen));
                    bottlectx.lineTo(bottlecanvars.width, bottlecanvars.height - (i * scalelen));
                    bottlectx.strokeStyle = this.BorderStyle
                    bottlectx.stroke();
                    bottlectx.closePath();
                    if (i % 4 == 0) {
                        var txtx = 0;
                        var currvalue = i * this.Step
                        if (currvalue >= 10 && currvalue < 100) txtx = 5;
                        if (currvalue < 10) txtx = 11;
                        bottlectx.fillStyle = this.scalefontcolor;
                        bottlectx.fillText(currvalue, txtx, bottlecanvars.height - (i * scalelen) + (i == 0 ? 0 : 3));
                    }
                }
                if (dev.IsNumber(this.Value)) this.SetValue(this.Value);
                //加上鼠标滑过事件
                this.Target.mouseover(function () {
                    var height = (($this.Value - $this.MinValue) / ($this.MaxValue - $this.MinValue) * ($this.canvas[0].height));
                    var bottom = (height + parseFloat($this.outerBody.css("bottom"))) - ($(".tip").height() / 2);//计算气泡的位置
                    $(".tip", this).css("display", "block");
                    $(".tip", this).css("bottom", bottom);
                    $(".value a", this).text($this.Value + "mm");
                }).mouseout(function () {
                    $(".tip", this).css("display", "none");
                    $(".value a", this).text(0 + "mm");
                });
            },
            SetValue: function (value) {
                if (dev.IsNull(value) || !dev.IsNumber(value)) return;
                this.Value = value;
                var height = ((value - this.MinValue) / (this.MaxValue - this.MinValue) * (this.canvas[0].height));
                this.innerBody.height(height);
            },
            Reisize: function (width, height) {
                if (dev.IsNumber(width)) this.Width = width;
                if (dev.IsNumber(height)) this.Height = height;
                this.outerBody.css({ "height": (this.Height - 10) + "px", "width": parseInt(this.Width / 2) + "px", "left": (this.Width - parseInt(this.Width / 2)) + "px" });
                this.innerBody.css({ "width": (this.Width - parseInt(this.Width / 2)) + "px" });
                this.canvasContain.css({ "height": (this.Height - 20) + "px", "width": (this.Width - parseInt(this.Width / 2)) + "px" });
                this.canvas[0].width = (this.Width - parseInt(this.Width / 2));
                this.canvas[0].height = (this.Height - 20);
                this.Layout();
            },
            Clear: function () {
                this.Target.remove();
            }
        })
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
