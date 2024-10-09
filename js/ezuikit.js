/**
 * ezui 1.3
 */
(function (global, factory) {

    "use strict";

    if (typeof module === "object" && typeof module.exports === "object") {
        module.exports = global.document ?
            factory(global, true) :
            function (w) {
                if (!w.document) {
                    throw new Error("EZUIPlayer requires a window with a document");
                }
                return factory(w);
            };
    } else {
        factory(global);
    }

    // Pass this if window is not defined yet
})(typeof window !== "undefined" ? window : this, function (window, noGlobal) {

    /**
     * @preserve HTML5 Shiv 3.7.3 | @afarkas @jdalton @jon_neal @rem | MIT/GPL2 Licensed
     */
    !function (a, b) { function c(a, b) { var c = a.createElement("p"), d = a.getElementsByTagName("head")[0] || a.documentElement; return c.innerHTML = "x<style>" + b + "</style>", d.insertBefore(c.lastChild, d.firstChild) } function d() { var a = t.elements; return "string" == typeof a ? a.split(" ") : a } function e(a, b) { var c = t.elements; "string" != typeof c && (c = c.join(" ")), "string" != typeof a && (a = a.join(" ")), t.elements = c + " " + a, j(b) } function f(a) { var b = s[a[q]]; return b || (b = {}, r++, a[q] = r, s[r] = b), b } function g(a, c, d) { if (c || (c = b), l) return c.createElement(a); d || (d = f(c)); var e; return e = d.cache[a] ? d.cache[a].cloneNode() : p.test(a) ? (d.cache[a] = d.createElem(a)).cloneNode() : d.createElem(a), !e.canHaveChildren || o.test(a) || e.tagUrn ? e : d.frag.appendChild(e) } function h(a, c) { if (a || (a = b), l) return a.createDocumentFragment(); c = c || f(a); for (var e = c.frag.cloneNode(), g = 0, h = d(), i = h.length; i > g; g++) e.createElement(h[g]); return e } function i(a, b) { b.cache || (b.cache = {}, b.createElem = a.createElement, b.createFrag = a.createDocumentFragment, b.frag = b.createFrag()), a.createElement = function (c) { return t.shivMethods ? g(c, a, b) : b.createElem(c) }, a.createDocumentFragment = Function("h,f", "return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&(" + d().join().replace(/[\w\-:]+/g, function (a) { return b.createElem(a), b.frag.createElement(a), 'c("' + a + '")' }) + ");return n}")(t, b.frag) } function j(a) { a || (a = b); var d = f(a); return !t.shivCSS || k || d.hasCSS || (d.hasCSS = !!c(a, "article,aside,dialog,figcaption,figure,footer,header,hgroup,main,nav,section{display:block}mark{background:#FF0;color:#000}template{display:none}")), l || i(a, d), a } var k, l, m = "3.7.3", n = a.html5 || {}, o = /^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i, p = /^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i, q = "_html5shiv", r = 0, s = {}; !function () { try { var a = b.createElement("a"); a.innerHTML = "<xyz></xyz>", k = "hidden" in a, l = 1 == a.childNodes.length || function () { b.createElement("a"); var a = b.createDocumentFragment(); return "undefined" == typeof a.cloneNode || "undefined" == typeof a.createDocumentFragment || "undefined" == typeof a.createElement }() } catch (c) { k = !0, l = !0 } }(); var t = { elements: n.elements || "abbr article aside audio bdi canvas data datalist details dialog figcaption figure footer header hgroup main mark meter nav output picture progress section summary template time video", version: m, shivCSS: n.shivCSS !== !1, supportsUnknownElements: l, shivMethods: n.shivMethods !== !1, type: "default", shivDocument: j, createElement: g, createDocumentFragment: h, addElements: e }; a.html5 = t, j(b), "object" == typeof module && module.exports && (module.exports = t) }("undefined" != typeof window ? window : this, document);

    /*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js */
    if ("document" in self) { if (!("classList" in document.createElement("_"))) { (function (j) { "use strict"; if (!("Element" in j)) { return } var a = "classList", f = "prototype", m = j.Element[f], b = Object, k = String[f].trim || function () { return this.replace(/^\s+|\s+$/g, "") }, c = Array[f].indexOf || function (q) { var p = 0, o = this.length; for (; p < o; p++) { if (p in this && this[p] === q) { return p } } return -1 }, n = function (o, p) { this.name = o; this.code = DOMException[o]; this.message = p }, g = function (p, o) { if (o === "") { throw new n("SYNTAX_ERR", "An invalid or illegal string was specified") } if (/\s/.test(o)) { throw new n("INVALID_CHARACTER_ERR", "String contains an invalid character") } return c.call(p, o) }, d = function (s) { var r = k.call(s.getAttribute("class") || ""), q = r ? r.split(/\s+/) : [], p = 0, o = q.length; for (; p < o; p++) { this.push(q[p]) } this._updateClassName = function () { s.setAttribute("class", this.toString()) } }, e = d[f] = [], i = function () { return new d(this) }; n[f] = Error[f]; e.item = function (o) { return this[o] || null }; e.contains = function (o) { o += ""; return g(this, o) !== -1 }; e.add = function () { var s = arguments, r = 0, p = s.length, q, o = false; do { q = s[r] + ""; if (g(this, q) === -1) { this.push(q); o = true } } while (++r < p); if (o) { this._updateClassName() } }; e.remove = function () { var t = arguments, s = 0, p = t.length, r, o = false, q; do { r = t[s] + ""; q = g(this, r); while (q !== -1) { this.splice(q, 1); o = true; q = g(this, r) } } while (++s < p); if (o) { this._updateClassName() } }; e.toggle = function (p, q) { p += ""; var o = this.contains(p), r = o ? q !== true && "remove" : q !== false && "add"; if (r) { this[r](p) } if (q === true || q === false) { return q } else { return !o } }; e.toString = function () { return this.join(" ") }; if (b.defineProperty) { var l = { get: i, enumerable: true, configurable: true }; try { b.defineProperty(m, a, l) } catch (h) { if (h.number === -2146823252) { l.enumerable = false; b.defineProperty(m, a, l) } } } else { if (b[f].__defineGetter__) { m.__defineGetter__(a, i) } } }(self)) } else { (function () { var b = document.createElement("_"); b.classList.add("c1", "c2"); if (!b.classList.contains("c2")) { var c = function (e) { var d = DOMTokenList.prototype[e]; DOMTokenList.prototype[e] = function (h) { var g, f = arguments.length; for (g = 0; g < f; g++) { h = arguments[g]; d.call(this, h) } } }; c("add"); c("remove") } b.classList.toggle("c3", false); if (b.classList.contains("c3")) { var a = DOMTokenList.prototype.toggle; DOMTokenList.prototype.toggle = function (d, e) { if (1 in arguments && !this.contains(d) === !e) { return e } else { return a.call(this, d) } } } b = null }()) } };


    Date.prototype.Format = function (fmt) { //author: meizz
        var o = {
            "M+": this.getMonth() + 1, //�·�
            "d+": this.getDate(), //��
            "h+": this.getHours(), //Сʱ
            "m+": this.getMinutes(), //��
            "s+": this.getSeconds(), //��
            "q+": Math.floor((this.getMonth() + 3) / 3), //����
            "S": this.getMilliseconds() //����
        };
        if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
        for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        return fmt;
    };


    var Domain = 'https://open.ys7.com';
    var logDomain = 'https://log.ys7.com/statistics.do';

    var ckplayerJS = Domain + '/sdk/js/1.3/ckplayer/ckplayer.js';
    var ckplayerSWF = Domain + '/sdk/js/1.3/ckplayer/ckplayer.swf';
    var m3u8SWF = Domain + '/sdk/js/1.3/ckplayer/m3u8.swf';
    var hlsJS = Domain + '/sdk/js/1.3/hls.min.js';


    // ��ǰҳ���Ƿ���httpsЭ��
    var isHttps = location.protocol === 'https:' ? true : false;
    // �Ƿ�Ϊ�ƶ���
    var isMobile = !!navigator.userAgent.match(/(iPhone|iPod|iPad|Android|ios|SymbianOS)/i);
    var testVideo = document.createElement('video');
    // �Ƿ�֧��video��ǩ��addEventListener��������ҪΪ������ie8��
    var isModernBrowser = !!testVideo.canPlayType && !!window.addEventListener;
    // �Ƿ���ʹ��videoԭ������hls
    var isNativeSupportHls = isModernBrowser && testVideo.canPlayType('application/vnd.apple.mpegURL');
    // �Ƿ���ʹ��hls.js����
    var isSupportHls = false;
    // �Ƿ�ʹ��flash
    var useFlash = false;

    // ������Ϣ�ϱ�
    var LOCALINFO = 'open_netstream_localinfo';
    // Ԥ�������ϱ�
    var PLAY_MAIN = 'open_netstream_play_main';

    function dclog(obj) {
        var logObj = {
            Ver: 'v.1.3.0',
            PlatAddr: 'open.ys7.com',
            ExterVer: 'Ez.1.3.0',
            CltType: 102,
            StartTime: (new Date()).Format('yyyy-MM-dd hh:mm:ss.S'),  // ÿ����־������ǰ��ʱ��
            OS: navigator.platform
        }
        for (var i in obj) {
            logObj[i] = obj[i];
        }

        var tempArray = [];
        for (var j in logObj) {
            tempArray.push(j + '=' + logObj[j]);
        }
        var params = '?' + tempArray.join('&');
        // �ϱ�һ�α���ͳ����Ϣ
        var img = new Image();
        img.src = logDomain + params;
    }

    // �ϱ�һ�α�����Ϣ
    dclog({
        systemName: LOCALINFO
    });

    var RTMP_REG = /^rtmp/;
    var HLS_REG = /\.m3u8/;

    // ��ȡԪ����ʽ
    function getStyle(el) {
        return window.getComputedStyle
            ? window.getComputedStyle(el, null)
            : el.currentStyle;
    }

    // ����js
    function addJs(filename, callback) {
        var oJs = document.createElement("script");
        oJs.setAttribute("src", filename);
        oJs.onload = callback;
        document.getElementsByTagName("head")[0].appendChild(oJs);
    }


    var EZUIPlayer = function (videoId) {
        if (!isModernBrowser) {
            throw new Error('��֧��ie8�ȵͰ汾�����');
            return;
        }
        if (typeof videoId !== 'string') {
            throw new Error('EZUIPlayer requires parameter videoId');
        }
        this.videoId = videoId;
        this.video = document.getElementById(videoId);
        if (!this.video) {
            throw new Error('EZUIPlayer requires parameter videoId');
        }
        this.opt = {};
        this.opt.sources = [];
        var sources = this.video.getElementsByTagName('source');
        // תΪ������󣬲���removeChildӰ��
        sources = Array.prototype.slice.call(sources, 0);

        if (this.video.src) {
            // �ƶ���ɾ��rtmp��ַ
            if (isMobile && RTMP_REG.test(this.video.src)) {
                this.video.removeAttribute('src');
                this.video.load();
            } else {
                this.opt.sources.push(this.video.src);
            }
        }

        var l = sources.length;
        if (l > 0) {
            for (var i = 0; i < l; i++) {
                // �ƶ���ɾ��rtmp��ַ
                if (isMobile && RTMP_REG.test(sources[i].src)) {
                    this.video.removeChild(sources[i]);
                } else {
                    this.opt.sources.push(sources[i].src);
                }
            }
        }
        if (this.opt.sources.length < 1) {
            throw new Error('no source found in video tag.');
        }
        this.opt.cur = 0;


        // �¼��洢
        this.handlers = {};

        this.opt.poster = this.video.poster;
        var videoStyle = getStyle(this.video);
        var width = this.video.width;
        var height = this.video.height;
        if (width) {
            this.opt.width = width;
            if (height) {
                this.opt.height = height;
            } else {
                this.opt.height = 'auto';
            }
            this.log('video width:' + this.opt.width + ' height:' + this.opt.height);
        } else {
            this.opt.width = videoStyle.width;
            this.opt.height = videoStyle.height;
            this.log('videoStyle.width:' + videoStyle.width + ' wideoStyle.height:' + videoStyle.height);
        }
        this.opt.parentId = videoId;
        this.opt.autoplay = this.video.autoplay ? true : false;
        this.log('autoplay:' + this.video.autoplay);

        this.tryPlay();
        this.initTime = (new Date()).getTime();

        this.on('play', function () {
            // �ϱ����ųɹ���Ϣ
            dclog({
                systemName: PLAY_MAIN,
                playurl: this.opt.currentSource,
                Time: (new Date()).Format('yyyy-MM-dd hh:mm:ss.S'),
                Enc: 0,  // 0 ������ 1 ����
                PlTp: 1,  // 1 ֱ�� 2 �ط�
                Via: 2,  // 2 �����ȡ��
                ErrCd: 0,
                Cost: (new Date()).getTime() - this.initTime  // ������
            });
        });
        this.retry = 2;
        this.on('error', function () {
            dclog({
                systemName: PLAY_MAIN,
                playurl: this.opt.currentSource,
                cost: -1,
                ErrCd: -1
            });
        });

    };

    // �¼�����
    EZUIPlayer.prototype.on = function (eventName, callback) {
        if (typeof eventName !== 'string' || typeof callback !== 'function') {
            return;
        }
        if (typeof this.handlers[eventName] === 'undefined') {
            this.handlers[eventName] = [];
        }
        this.handlers[eventName].push(callback);
    };

    // �¼�����
    EZUIPlayer.prototype.emit = function () {
        if (this.handlers[arguments[0]] instanceof Array) {
            var handlers = this.handlers[arguments[0]];
            var l = handlers.length;
            for (var i = 0; i < l; i++) {
                handlers[i].apply(this, Array.prototype.slice.call(arguments, 1));
            }
        }
    };

    // ���Բ���
    EZUIPlayer.prototype.tryPlay = function () {
        this.opt.currentSource = this.opt.sources[this.opt.cur];
        if (!this.opt.currentSource) {
            this.log('δ�ҵ����ʵĲ���URL');
            return;
        }
        var me = this;
        // �����HLS��ַ
        if (/\.m3u8/.test(this.opt.currentSource)) {
            // ������ֻ����������,����ԭ��֧��HLS���ŵ�,ֱ��ʹ��video��ǩ����
            // ������ʹ��hls.js���ţ�
            // ���ʹ��flash
            if (isMobile || isNativeSupportHls) {
                this.log('ʹ��ԭ��video');
                this.video.style.heght = this.opt.height = Number(this.opt.width.replace(/px$/g, '')) * 9 / 16 + 'px';
                this.initVideoEvent();
            } else {
                if (isHttps) {
                    addJs(ckplayerJS, function () {
                        me.initCKPlayer();
                    });
                } else {
                    addJs(hlsJS, function () {
                        isSupportHls = Hls.isSupported();
                        if (isSupportHls) {
                            me.log('ʹ��hls.js');
                            me.initHLS();
                        } else {
                            useFlash = true;
                            me.log('2 ʹ��flash');
                            addJs(ckplayerJS, function () {
                                me.initCKPlayer();
                            });
                        }
                    });
                }
            }
        } else if (/^rtmp:/.test(this.opt.currentSource)) {
            if (isMobile) {
                this.opt.cur++;
                this.tryPlay();
                return;
            } else {
                addJs(ckplayerJS, function () {
                    me.initCKPlayer();
                });
            }
        }
    };

    // ��ʼ��hls.js
    EZUIPlayer.prototype.initHLS = function () {
        var me = this;
        var hls = new Hls({ defaultAudioCodec: 'mp4a.40.2' }); // өʯ�豸Ĭ��ʹ�� AAC LC ��Ƶ����
        hls.loadSource(this.opt.currentSource);
        hls.attachMedia(this.video);
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            if (me.opt.autoplay) {
                me.video.play();
            }
            me.initVideoEvent();
        });
        hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        // try to recover network error
                        console.log("fatal network error encountered, try to recover");
                        hls.startLoad();
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        console.log("fatal media error encountered, try to recover");
                        hls.recoverMediaError();
                        break;
                    default:
                        // cannot recover
                        hls.destroy();
                        break;
                }
            }
        });

        this.hls = hls;
    };

    // ��־
    EZUIPlayer.prototype.log = function (msg) {
        this.emit('log', msg);
    };

    // ��ʼ��ckplayer
    EZUIPlayer.prototype.initCKPlayer = function () {
        this.log('ckplayer��ʼ��');
        var me = this;
        var events = {
            'play': function () { me.emit('play') },
            'pause': function () { me.emit('pause') },
            'error': function () { me.emit('error') }
        };
        window.ckplayer_status = function () {
            me.log(arguments);
            events[arguments[0]] && events[arguments[0]]();
        };

        // ������ͬid��div��ǩ��Ȼ��ɾ��video��ǩ
        this.videoFlash = document.createElement('DIV');
        this.video.parentNode.replaceChild(this.videoFlash, this.video);
        this.video = this.videoFlash;
        this.videoFlash.id = this.opt.parentId;
        var flashvars = null;
        // ���rtmp������������������Ƶ��ͣ��Ͽ�����
        // ��Ҫ�޸�ckplayer.js  setup������30��ֵ
        // �ڲ�����ͣ���������Ƿ�����������ӵķ�ʽ
        if (/^rtmp/.test(this.opt.currentSource)) {
            flashvars = {
                f: this.opt.currentSource,
                c: 0,
                p: this.opt.autoplay ? 1 : 0,
                i: this.opt.poster,
                lv: 1,
                loaded: 'loadHandler'
            };
        } else if (/\.m3u8/.test(this.opt.currentSource)) {
            flashvars = {
                s: 4,  // 4-ʹ��swf��Ƶ���������
                f: m3u8SWF,
                a: this.opt.currentSource,
                c: 0,  // 0-ʹ��ckplayer.js������ 1-ʹ��ckplayer.xml������
                lv: 1, // 1-ֱ�� 0-��ͨ��ʽ
                p: this.opt.autoplay ? 1 : 0,   // 1-Ĭ�ϲ��� 0-Ĭ����ͣ
                i: this.opt.poster,
                loaded: 'loadHandler'
            };
        } else {
            flashvars = {
                f: this.opt.currentSource,
                c: 0,
                p: 1,
                loaded: 'loadHandler'
            };
        }
        var params = { bgcolor: '#FFF', allowFullScreen: true, allowScriptAccess: 'always', wmode: 'transparent' };
        this.flashId = this.opt.parentId + 'flashId';
        CKobject.embedSWF(ckplayerSWF, this.opt.parentId, this.flashId, this.opt.width, this.opt.height, flashvars, params);
    };

    EZUIPlayer.prototype.initVideoEvent = function () {
        var me = this;
        var EVENT = {
            'loadstart': function (e) {
                me.log('loadstart...���������ʼ������Ƶ/��Ƶʱ...');
                me.emit('loadstart', e);
            },
            'durationchange': function (e) {
                me.log('durationchange...����Ƶ/��Ƶ��ʱ���Ѹ���ʱ...');
                me.emit('durationchange', e);
            },
            'loadedmetadata': function (e) {
                me.log('loadedmetadata...��������Ѽ�����Ƶ/��Ƶ��Ԫ����ʱ...');
                me.emit('loadedmetadata', e);
            },
            'loadeddata': function (e) {
                me.log('loadeddata...��������Ѽ�����Ƶ/��Ƶ�ĵ�ǰ֡ʱ...');
                me.emit('loadeddata', e);
            },
            'progress': function (e) {
                me.log('progress...�����������������Ƶ/��Ƶʱ...');
                me.emit('progress', e);
            },
            'canplay': function (e) {
                me.log('canplay...����������Բ�����Ƶ/��Ƶʱ...');
                me.emit('canplay', e);
            },
            'canplaythrough': function (e) {
                me.log('canplaythrough...����������ڲ��򻺳��ͣ�ٵ�����½��в���ʱ...');
                me.emit('canplaythrough', e);
            },
            'abort': function (e) {
                me.log('abort...����Ƶ/��Ƶ�ļ����ѷ���ʱ...');
                me.emit('abort', e);
            },
            'emptied': function (e) {
                me.log('emptied...��Ŀǰ�Ĳ����б�Ϊ��ʱ...');
                me.emit('emptied', e);
            },
            'ended': function (e) {
                me.log('ended...��Ŀǰ�Ĳ����б��ѽ���ʱ...');
                me.emit('ended', e);
            },
            'pause': function (e) {
                me.log('pause...����Ƶ/��Ƶ����ͣʱ...');
                me.emit('pause', e);
            },
            'play': function (e) {
                me.log('play...����Ƶ/��Ƶ�ѿ�ʼ������ͣʱ...');
                me.emit('play', e);
            },
            'playing': function (e) {
                me.log('playing...����Ƶ/��Ƶ�����򻺳����ͣ��ֹͣ���Ѿ���ʱ...');
                me.emit('playing', e);
            },
            'ratechange': function (e) {
                me.log('ratechange...����Ƶ/��Ƶ�Ĳ����ٶ��Ѹ���ʱ...');
                me.emit('ratechange', e);
            },
            'seeked': function (e) {
                me.log('seeked...���û����ƶ�/��Ծ����Ƶ/��Ƶ�е���λ��ʱ...');
                me.emit('seeked', e);
            },
            'seeking': function (e) {
                me.log('seeking...���û���ʼ�ƶ�/��Ծ����Ƶ/��Ƶ�е���λ��ʱ...');
                me.emit('seeking', e);
            },
            'stalled': function (e) {
                me.log('stalled...����������Ի�ȡý�����ݣ������ݲ�����ʱ...');
                me.emit('stalled', e);
            },
            'suspend': function (e) {
                me.log('suspend...����������ⲻ��ȡý������ʱ...');
                me.emit('suspend', e);
                if (me.opt.autoplay) {
                    me.video.play();
                }
            },
            'timeupdate': function (e) {
                //me.log('timeupdate...��Ŀǰ�Ĳ���λ���Ѹ���ʱ...');
                me.emit('timeupdate', e);
            },
            'volumechange': function (e) {
                me.log('volumechange...�������Ѹ���ʱ...');
                me.emit('volumechange', e);
            },
            'waiting': function (e) {
                me.log('waiting...����Ƶ������Ҫ������һ֡��ֹͣ...');
                me.emit('waiting', e);
            },
            'error': function (e) {
                me.log('error...������Ƶ/��Ƶ�����ڼ䷢������ʱ...');
                me.emit('error', e);
            }

        };
        for (var i in EVENT) {
            this.video.addEventListener(i, EVENT[i], false);
        }

        ios11Hack(this.video);

    };


    EZUIPlayer.prototype.play = function () {
        this.opt.autoplay = true;
        if (!!window['CKobject']) {
            CKobject.getObjectById(this.flashId).videoPlay();
        } else if (!!this.video) {
            this.video.play();
        }

    };

    EZUIPlayer.prototype.pause = function () {
        this.opt.autoplay = false;
        if (!!window['CKobject']) {
            CKobject.getObjectById(this.flashId).videoPause();
        } else if (!!this.video) {
            this.video.pause();
        }
    };

    EZUIPlayer.prototype.load = function () {
        if (!!window['CKobject']) {
            // flash load
        } else if (!!this.video) {
            this.video.load();
        }
    };
    //
    // EZUIPlayer.prototype.remove = function(){
    //
    // };
    //
    // EZUIPlayer.prototype.clear = function(){
    //
    // };
    //
    // // �޸Ĳ��ŵ�ַ
    // EZUIPlayer.prototype.changeSource = function(source){
    //
    // };

    // iOS11�ֻ�HLSֱ����m3u8��Ӧʱ������󲻼��������hack
    function ios11Hack(video) {
        var isloadeddata = false;
        var isPlaying = false;
        var stalledCount = 0;
        video.addEventListener('loadeddata', function () {
            isloadeddata = true;
        }, false);
        video.addEventListener('stalled', function () {
            stalledCount++;
            if (!isPlaying) {
                if (stalledCount >= 2 && !isloadeddata) {
                    video.load();
                    video.play();
                    isloadeddata = false;
                    isPlaying = false;
                    stalledCount = 0;
                }
            }
        }, false);
        video.addEventListener('playing', function () {
            isPlaying = true;
        });
    }


    if (!noGlobal) {
        window.EZUIPlayer = EZUIPlayer;
    }
    return EZUIPlayer;
});
