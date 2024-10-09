(function (factory) {
    if (typeof define === 'function' && define.amd) define(['jquery'], factory);
    else if (typeof exports === 'object') factory(require('jquery'));
    else factory(jQuery);
}(function ($) {
    //try { dev = ol; }
    //catch (e) { dev = {}; }

    try { if (!dev) dev = {}; }
    catch (e) { dev = {}; }

    var pluses = /\+/g;

    function encode(s) {
        return config.raw ? s : encodeURIComponent(s);
    }

    function decode(s) {
        return config.raw ? s : decodeURIComponent(s);
    }

    function stringifyCookieValue(value) {
        return encode(config.json ? JSON.stringify(value) : String(value));
    }

    function parseCookieValue(s) {
        if (s.indexOf('"') === 0) {
            s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        }

        try {
            s = decodeURIComponent(s.replace(pluses, ' '));
            return config.json ? JSON.parse(s) : s;
        } catch (e) { }
    }

    function read(s, converter) {
        var value = config.raw ? s : parseCookieValue(s);
        return $.isFunction(converter) ? converter(value) : value;
    }

    var config = $.cookie = function (key, value, options) {

        // Write
        if (value !== undefined && !$.isFunction(value)) {
            options = $.extend({}, config.defaults, options);

            if (typeof options.expires === 'number') {
                var days = options.expires, t = options.expires = new Date();
                t.setTime(+t + days * 864e+5);
            }

            return (document.cookie = [
				encode(key), '=', stringifyCookieValue(value),
				options.expires ? '; expires=' + options.expires.toUTCString() : '',
				options.path ? '; path=' + options.path : '',
				options.domain ? '; domain=' + options.domain : '',
				options.secure ? '; secure' : ''
            ].join(''));
        }

        // Read
        var result = key ? undefined : {};

        var cookies = document.cookie ? document.cookie.split('; ') : [];

        for (var i = 0, l = cookies.length; i < l; i++) {
            var parts = cookies[i].split('=');
            var name = decode(parts.shift());
            var cookie = parts.join('=');

            if (key && key === name) {
                result = read(cookie, value);
                break;
            }
            if (!key && (cookie = read(cookie)) !== undefined) {
                result[name] = cookie;
            }
        }
        return result;
    };

    config.defaults = {};

    $.removeCookie = function (key, options) {
        if ($.cookie(key) === undefined) {
            return false;
        }
        $.cookie(key, '', $.extend({}, options, { expires: -1 }));
        return !$.cookie(key);
    };

    $.extend($.fn.validatebox.defaults.rules, {
        number: {
            validator: function (value) {
                return !isNaN(value);
            },
            message: '只能输入0~9之间的数字！'
        },
        chinese: {
            validator: function (value) {
                var rec = /^[a-zA-Z0-9_]{1,}$/;
                return rec.test(value);
            },
            message: '只能输入数字，英文字母及下划线！'
        },
        numEnglish: {
            validator: function (value) {
                var res = value.replace(/[^\w\.\/]/ig, '');
                return res === value ? true : false
            },
            message: '只能输入数字和字母！'
        },
        check: {
            validator: function (value) {
                return value == $("#newcode").textbox("getText") ? true : false;
            },
            message: '请确认密码！'
        },
        deadline: {
            validator: function (value) {
                var input = new Date(value);
                return input > new Date();
            },
            message: '有效期至少为一天！'
        },
        birthday: {
            validator: function (value) {
                var input = new Date(value);
                return input < new Date();
            },
            message: '生日小于当前日期！'
        },
        idCard: {
            validator: function (value) {
                var rec = /^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i;
                if (rec.test(value)) return true;
                else false;
            },
            message: '请输入正确的身份证号！'
        }
    });

    /*定义cookie*/
    dev.cookie = {
        user: null,//用户信息
        perms: null,//权限信息
        messager: null,
        imguri: null,
        rootPath: null
    };
    /*获取网站根目录*/
    dev.cookie.getRootPath = function () {
        var pathName = window.document.location.pathname;
        var localhost = window.location.host;
        var projectName = pathName.substring(0, pathName.substr(1).indexOf('/') + 1);
        return ("http://" + localhost + projectName + "/");
    };
    /*验证cookie*/
    dev.cookie.validateUser = function () {
        if (dev.IsNull(dev.App.Config)) this.init();
        if (dev.IsNull(dev.cookie.baseUri)) this.init();
        if (dev.App) dev.App.Config = this.config;
        var u = $.cookie("usertoken");
        if (dev.IsNull(u)) {
            this.user = null;
            if (dev.IsNull(this.rootPath)) this.rootPath = this.getRootPath();
            location.href = this.rootPath + "login.html";
        }
        else {
            this.user = JSON.parse(u);
            dev.cookie.getPerms();
        }
    };
    /*移除cookie*/
    dev.cookie.removeUser = function () {
        $.removeCookie("usertoken");
        this.user = this.perms = null;
        location.href = this.rootPath + "login.html";
    }
    /*返回到引导页*/
    dev.cookie.returnguid = function () {
        location.href = this.rootPath + "guidpage.html";
    }
    /*获取是否为负责岗位*/
    dev.cookie.getMainPost = function () {
        if (!this.hasPost()) return false;
        for (var i = 0; i < this.user.posts.length; i++) {
            //1是负责岗位，0不是负责岗位
            if (1 == this.user.posts[i].mainpost) return true;
        }
        return false;
    };
    /*获取是否为岗位负责人*/
    dev.cookie.getPostOwner = function () {
        if (!this.hasPost()) return false;
        for (var i = 0; i < this.user.posts.length; i++) {
            //1是岗位负责人，0不是岗位负责人
            if (1 == this.user.posts[i].postowner) return true;
        }
        return false;
    };
    /*判断选择岗位与当前用户岗位是否为同一岗位*/
    dev.cookie.containPost = function (id) {
        if (!this.hasPost()) return false;
        for (var i = 0; i < this.user.posts.length; i++) {
            if (id == this.user.posts[i].id) return true;
        }
        return false;
    };
    /*判断是否有岗位设置*/
    dev.cookie.hasPost = function () {
        return !(dev.IsNull(this.user) || dev.IsNull(this.user.posts)
             || this.user.posts.length == 0);
    }
    /*获取岗位名称*/
    dev.cookie.getPostNames = function () {
        if (!this.hasPost()) return "";
        var names = "";
        for (var i = 0; i < this.user.posts.length; i++) {
            names += this.user.posts[i].name;
            if (i < this.user.posts.length - 1) names += "/";
        }
        return names;
    }
    /*获取权限*/
    dev.cookie.getPerms = function () {
        if (dev.IsNull(this.user) || dev.IsNull(this.user.id)) return;
        var $this = this;
        $.ajax({
            type: "post",
            async: false,
            url: this.baseUri + "user/getperm/" + this.user.id,
            data: { name: this.user.name, password: this.user.password },
            success: function (res) {
                $this.perms = res.data;
            }
        });
    };
    /*获取头像*/
    dev.cookie.getFace = function () {
        var name = this.user.truename, uri = this.user.photouri, th = dev.App.Config.SystemLayout.TopPanel.Height - 20;
      //  var str = '<div id="hostinfo" style="width:90px;height:100%;position:absolute;left:0px;top:0px;border-right:1px solid #0099cc;"><div style="background-image:url(' + this.rootPath + 'image/host.png); display:inline-block;margin-left:10px;background-repeat:no-repeat;background-position:center;width:30px;height:' + (th + 20) + 'px;float:left;"></div><div style="margin-left:5px;color:#fff;font-weight:bold;font-size:14px;line-height:' + (th + 30) + 'px;height:' + (th+20) + 'px;display:inline-block;width:35px;">首页</div></div>';
        var str = '<div id="banner" style="position:absolute;right:0px;top:10px;width:120px;cursor:pointer;height:' + th + 'px;font-size:14px;color:#fff">';
        str += '<div id="name" style="white-space:nowrap;text-overflow:ellipsis;-o-text-overflow:ellipsis;overflow:hidden;line-height:' + th + 'px;width:70px;text-align:center">' + name + '</div>';
        str += '<div id="face" style="right:10px;position:absolute;top:0px"><img id="loginFace" style="border-radius:50%;width:' + th + 'px;height: ' + th + 'px;" src="' + uri + '" /></div></div>';
        return str;
    };

    /*返回首页按钮*/
    //dev.cookie.returnhost = function () {
    //    $("#hostinfo").mouseover(function () {
    //        $(this).css("background-color", "#5e31f3");
    //    }).mouseleave(function () {
    //        $(this).css("background-color", "");
    //    }).click(function () { dev.cookie.returnguid(); });
    //}
    /*获取主页*/
    dev.cookie.getIndex = function () {
        var indextr = '<div id="backhome" style="width:84px; position:absolute; height: 60px;border-right:1px solid #14cdad;cursor:pointer" title="返回首页" onclick="dev.cookie.returnguid()">';
        indextr += '<div style="margin-left:12px;margin-top:18px;float:left;"><img id="homeimg" style="width:23px;height: 26px;" src="image/home.png" /></div>';
        indextr += '<div style="margin-top:27px;margin-left:5px;float:left;font-size:14px;font-weight:bold;color:#fff">首页</div></div>';
        return indextr;
    };
    /*获取详细信息*/
    dev.cookie.getUserDetail = function () {
        $("#backhome").mouseover(function () {
            $(this).css("background", "rgba(231,231,231,0.3)");
        }).mouseleave(function () {
            $(this).css("background", "");
        });
        var faceUri = this.user.photouri;
        var userName = this.user.truename;
        var orgName = this.user.orgname == null ? "" : this.user.orgname;
        var postName = this.getPostNames();
        //详细信息
        var userDetail = '<div id="tips" style="width: 320px; height: 120px;line-height:20px">';
        userDetail += '<div style="float: left; width: 100px; height: 100px; background-color: #FFF;">';
        userDetail += '<div style="width: 60px; height: 70px; margin:10px auto;"><img id="imgdetail" style="border-radius:50%;width: 60px;height: 60px;" src="' + faceUri + '" /></div>';
        userDetail += '<div style="font-size: 12px; color: #999; text-align: center; width: 60px; margin: 0 auto;"><a id="btnFace" class="easyui-linkbutton" onclick="dev.cookie.showEditImgDlg();">编辑头像</a></div>';
        userDetail += '</div>';
        userDetail += '<div style="float: left; width: 180px; height: 100px; background-color: #FFF;">';
        userDetail += '<div style="width: 220px; height: 70px; background-color: #FFF; margin: 20px auto 10px;">';
        userDetail += '<p style="line-height:28px;"><span style="font-size: 14px; font: bold;">' + userName + '</span>';
        userDetail += '<span style="font-size: 12px; padding-left: 10px;"><a id="btnSafe" class="easyui-linkbutton" onclick="dev.cookie.showEditPwdDlg();">账户安全</a></span>';
        if (dev.cookie.config.SimpleMenu == "false") userDetail += '<span><a style="font-size: 12px; padding-left: 10px;" id="btnExit" class="easyui-linkbutton" onclick="dev.cookie.returnguid();">返回主页</a></span>';
        userDetail += '<span><a style="font-size: 12px; padding-left: 10px;" id="btnExit" class="easyui-linkbutton" onclick="dev.cookie.removeUser();">退出</a></span></p>';
        userDetail += '<p style="font-size: 12px;line-height:28px;"><span style="font-size: 12px;">组织机构：</span><span style="font-size: 12px;">' + orgName + '</span></p>';
        userDetail += '<p style="font-size: 12px;line-height:28px;"><span style="font-size: 12px;">岗位：</span><span style="font-size: 12px;">' + postName + '</span></p>';
        userDetail += '</div></div></div>';
        return userDetail;
    };
    
    /*展示详细信息*/
    dev.cookie.getUserTip = function () {
        $('#banner').tooltip({
            position: 'bottom',
            content: this.getUserDetail(),
            onShow: function (e) {
                var t = $(this);
                t.tooltip('tip').unbind().bind('mouseenter',
                    function () { t.tooltip('show'); }).bind('mouseleave',
                    function () { t.tooltip('hide'); });
            }
        });
        dev.cookie.messager = $.messager;
        dev.cookie.messager.defaults.height = 150;
        dev.cookie.messager.defaults.width = 250;
    }
    /*添加密码修改对话框*/
    dev.cookie.addEditDlg = function () {
        return '<div id="dlg" closed="true" class="easyui-dialog" title="修改密码" ' +
            'style="width:300px;height:180px;padding:5px" buttons="#dlg-buttons"></div>';
    }
    /*密码修改标签*/
    dev.cookie.getEditDlg = function () {
        var stringEdit = '<form id="userEdit" method="post" style="position:absolute;top:32px;">';

        stringEdit += '<div style="position:absolute;width:80px;height:32px;line-height:32px;text-align:right;">原密码</div>';
        stringEdit += '<div style="position:absolute;width:150px;height:29px;top:3px;left:90px">';
        stringEdit += '<input id="oldcode" style="width:150px;height:26px;" class="easyui-textbox" type="password" data-options="required:true,validType:[\'numEnglish\',\'length[6,30]\'],missingMessage:\'必填项！\',invalidMessage:[\'请输入6~30个英文或数字！\']"/></div>';

        stringEdit += '<div style="position:absolute;width:80px;height:32px;line-height:32px;text-align:right;top:32px;">新密码</div>';
        stringEdit += '<div style="position:absolute;width:150px;height:29px;top:35px;left:90px">';
        stringEdit += '<input id="newcode" style="width:150px;height:26px;" class="easyui-textbox" type="password" data-options="required:true,validType:[\'numEnglish\',\'length[6,30]\'],missingMessage:\'必填项！\',invalidMessage:[\'请输入6~30个英文或数字！\']"/></div>';

        stringEdit += '<div style="position:absolute;width:80px;height:32px;line-height:32px;text-align:right;top:64px;">确认密码</div>';
        stringEdit += '<div style="position:absolute;width:150px;height:29px;top:67px;left:90px">';
        stringEdit += '<input id="confirmcode" style="width:150px;height:26px;" class="easyui-textbox" type="password" data-options="required:true,validType:[\'check\',\'length[6,30]\'],missingMessage:\'必填项！\',invalidMessage:[\'请确认密码！\']"/></div>';

        stringEdit += '</form>';

        stringEdit += '<div id="dlg-buttons">';
        stringEdit += '<a id="btnsave" class="easyui-linkbutton" iconcls="icon-ok" style="width: 60px;" onclick="dev.cookie.saveEdit();">保存</a>';
        stringEdit += '</div>';
        return stringEdit;
    }
    /*展示修改密码对话框*/
    dev.cookie.showEditPwdDlg = function () {
        $('#dlg').form("clear");
        $('#dlg').dialog('open').dialog('center');
    }
    /*添加头像修改对话框*/
    dev.cookie.getEditImgDialog = function () {
        return '<div id="editImage" closed="true" class="easyui-dialog" title="修改头像"' +
            ' style="width:300px;height:220px;padding:5px;overflow:hidden" buttons="#image-buttons"></div>';
    }
    /*添加头像修改对话框*/
    dev.cookie.getEditImg = function () {
        var uri = this.user.photouri;
        var str = '<form id="userPhoto" method="post" enctype="multipart/form-data">';
        str += '<div style="line-height:20px;">';
        str += '<img id="imgpreview" style="width:106px;height:106px" src="' + uri + '"/>';
        str += '<div style="right:24px;position:absolute;top:50px;">1、支持PNG、GIF、BMP、</div>'
        str += '<div style="right:6px;position:absolute;top:70px;">JPG/JPEG格式，文件小于4M；</div>'
        str += '<div style="right:11px;position:absolute;top:90px;">2、上传的图片会生成小尺寸，</div>'
        str += '<div style="right:6px;position:absolute;top:110px;">请注意小尺寸的头像是否清晰。</div>'
        str += '<div style="width:108px;height:30px;">';
        str += '<div style="width:58px;height:30px;margin-top:2px;margin-left:25px;">';
        str += '<input id="choosefile" name="devfile" type="file" style="width:58px;margin:0 auto;" class="easyui-filebox"/>';
        str += '</div></div></div></form><div id="image-buttons">';
        str += '<a id="btnSave" class="easyui-linkbutton" iconcls="icon-ok" style="width:60px;" onclick="dev.cookie.saveFace();">保存</a></div>'
        return str;
    }
    /*展示修改头像对话框*/
    dev.cookie.showEditImgDlg = function () {
        $('#editImage').dialog('open').dialog('center');
        $('#choosefile').filebox({
            buttonText: '选择照片',
            buttonAlign: 'left',
            onChange: function (newvalue, oldvalue) {
                dev.cookie.changeFace();
            }
        })
    }
    /*保存密码*/
    dev.cookie.saveEdit = function () {
        if (!$("#userEdit").form('enableValidation').form('validate')
            || !$("#userEdit").form('validate')) return;
        var user = {
            id: this.user.id,
            newPassword: hex_md5($("#newcode").textbox("getText")),
            password: hex_md5($("#oldcode").textbox("getText"))
        };
        $.ajax({
            type: "POST",
            data: JSON.stringify(user),
            contentType: "application/json",
            url: this.baseUri + "user/updatepassword",
            success: function (res) {
                if (res.statusCode == 200 && res.data) {
                    $('#dlg').dialog('close');
                    dev.cookie.user.password = user.password;
                    dev.cookie.messager.alert('系统提示', '密码修改成功！', 'info');
                }
                else {
                    dev.cookie.messager.alert('系统提示', '密码修改失败！', 'error');
                }
            },
            error: function (e) {
                dev.cookie.messager.alert('系统提示', '服务请求失败！', 'error');
            }
        });
    }
    /*改变头像*/
    dev.cookie.changeFace = function () {
        $("#userPhoto").serializeArray();
        $("#userPhoto").ajaxSubmit({
            type: "post",
            dataType: "json",
            url: this.baseUri + 'file/upload?reluri=' + this.user.id,
            success: function (res) {
                if (res.statusCode != 200) return;
                dev.cookie.user.imguri = res.data[0].path;
                $("#imgpreview")[0].src = res.data[0].path;
            },
            error: function (error) { }
        });
    }
    /*保存头像*/
    dev.cookie.saveFace = function () {
        $.ajax({
            type: "POST",
            data: this.user.imguri,
            contentType: "application/json",
            url: this.baseUri + "contact/update/" + this.user.id,
            success: function (res) {
                if (res.statusCode == 200) {
                    dev.cookie.messager.alert('系统提示：', '保存成功！', 'info');
                    $("#imgdetail")[0].src = dev.cookie.user.imguri;
                    $("#loginFace")[0].src = dev.cookie.user.imguri;
                    $("#editImage").dialog("close");
                }
                else {
                    dev.cookie.messager.alert('系统提示：', '保存失败！', 'error');
                }
            },
            error: function (e) {
                dev.cookie.messager.alert('系统提示', '服务请求失败！', 'error');
            }
        });
    }
    /*刷新banner*/
    dev.cookie.refershBanner = function (url) {
        $("#imgdetail")[0].src = url;
        $("#loginFace")[0].src = url;
    }
    /*初始化读取配置文件*/
    dev.cookie.init = function () {
        var configer = null;
        $.ajax({
            url: "config/app.xml",
            dataType: 'xml',
            type: 'GET',
            cache: false,
            timeout: 2000,
            async: false,
            error: function () {
                alert("加载XML文件出错！");
            },
            success: function (xml) {
                configer = $.xml2json(xml);
            }
        });
        this.config = configer;
        this.rootPath = this.getRootPath();
        this.baseUri = this.getRelativeUrl("Service");
    };
    /*根据ID获取基础地址*/
    dev.cookie.getBaseUrl = function (basicid) {
        var basicurls = this.config.SystemUri.BasicUris;
        if (dev.IsNull(basicurls) || basicurls.length === 0) return "";
        var basicInfo = Enumerable.From(basicurls).Where('s=>s.ID==="' + basicid + '"').ToArray();
        if (basicInfo.length === 0) return "";
        else return basicInfo[0].Uri;
    };
    /*根据ID获取相对地址*/
    dev.cookie.getRelativeUrl = function (relativeid) {
        var relurls = this.config.SystemUri.RelativeUris;
        if (dev.IsNull(relurls) || relurls.length === 0) return "";
        var relativeInfo = Enumerable.From(relurls).Where('s=>s.ID==="' + relativeid + '"').ToArray();
        if (relativeInfo.length === 0) return "";
        var relativuri = relativeInfo[0].Uri;
        var basicid = relativeInfo[0].BasicID;
        if (dev.IsNull(basicid)) return relativuri;
        var basicuri = dev.cookie.getBaseUrl(basicid);
        return basicuri + relativuri;
    };
    /*功能：验证空值*/
    dev.IsNull = function (item) {
        return item === undefined || item === null || item === "";
    };
}));
