/* http://kolber.github.com/audiojs */
(function (h, o, g) {
    g[h] = {
        instanceCount: 0,
        instances: {},
        settings: {
            autoplay: false,
            loop: false,
            preload: true,
            createPlayer: {
                markup: '<div class="play-pause"><p class="play"></p><p class="pause">' +
                    '</p><p class="loading"></p><p class="error"></p></div><div class="scrubber">'
                    + '<div class="progress"></div><div class="loaded"></div></div><div class="time">'
                    + '<em class="played">00:00</em>/<strong class="duration">00:00</strong></div>' +
                    '<div class="error-message"></div>',
                playPauseClass: "play-pause",
                scrubberClass: "scrubber",
                progressClass: "progress",
                loaderClass: "loaded",
                timeClass: "time",
                durationClass: "duration",
                playedClass: "played",
                errorMessageClass: "error-message",
                playingClass: "playing",
                loadingClass: "loading",
                errorClass: "error"
            },
            trackEnded: function () { },
            loadError: function () {
                var b = this.settings.createPlayer;
                var a = j(b.errorMessageClass, this.wrapper);
                g[h].helpers.removeClass(this.wrapper, b.loadingClass);
                g[h].helpers.addClass(this.wrapper, b.errorClass);
                a.innerHTML = 'Error loading: "' + this.mp3 + '"';
            },
            init: function () {
                g[h].helpers.addClass(this.wrapper, this.settings.createPlayer.loadingClass);
            },
            loadStarted: function () {
                var b = this.settings.createPlayer,
                    a = j(b.durationClass, this.wrapper),
                    c = Math.floor(this.duration / 60),
                    d = Math.floor(this.duration % 60);
                g[h].helpers.removeClass(this.wrapper, b.loadingClass);
                a.innerHTML = (c < 10 ? "0" : "") + c + ":" + (d < 10 ? "0" : "") + d;
            },
            loadProgress: function (b) {
                var a = this.settings.createPlayer,
                c = j(a.scrubberClass, this.wrapper);
                j(a.loaderClass, this.wrapper).style.width = c.offsetWidth * b + "px";
            },
            playPause: function () {
                this.playing ? this.settings.play() : this.settings.pause()
            },
            play: function () {
                g[h].helpers.addClass(this.wrapper, this.settings.createPlayer.playingClass)
            },
            pause: function () {
                g[h].helpers.removeClass(this.wrapper, this.settings.createPlayer.playingClass)
            },
            updatePlayhead: function (b) {
                var a = this.settings.createPlayer, c = j(a.scrubberClass, this.wrapper);
                j(a.progressClass, this.wrapper).style.width = c.offsetWidth * b + "px";
                a = j(a.playedClass, this.wrapper);
                c = this.duration * b;
                b = Math.floor(c / 60);
                c = Math.floor(c % 60);
                a.innerHTML = (b < 10 ? "0" : "") + b + ":" + (c < 10 ? "0" : "") + c
            }
        },
        create: function (b, a) {
            a = a || {};
            return b.length ? this.createAll(a, b) : this.newInstance(b, a)
        },
        createAll: function (b, a) {
            var c = a || document.getElementsByTagName("audio"), d = []; b = b || {};
            for (var e = 0, i = c.length; e < i; e++) d.push(this.newInstance(c[e], b));
            return d
        },
        newInstance: function (b, a) {
            var c = this.helpers.clone(this.settings),
                d = "audiojs" + this.instanceCount,
                e = "audiojs_wrapper" + this.instanceCount;
            this.instanceCount++;
            if (b.getAttribute("autoplay") != null) c.autoplay = true;
            if (b.getAttribute("loop") != null) c.loop = true;
            if (b.getAttribute("preload") == "none") c.preload = false;
            a && this.helpers.merge(c, a);
            if (c.createPlayer.markup) b = this.createPlayer(b, c.createPlayer, e);
            else b.parentNode.setAttribute("id", e);
            e = new g[o](b, c);
            this.attachEvents(e.wrapper, e);
            return this.instances[d] = e
        },
        createPlayer: function (b, a, c) {
            var d = document.createElement("div"), e = b.cloneNode(true);
            d.setAttribute("class", "audiojs");
            d.setAttribute("className", "audiojs");
            d.setAttribute("id", c);
            if (e.outerHTML && !document.createElement("audio").canPlayType) {
                e = this.helpers.cloneHtml5Node(b);
                d.innerHTML = a.markup;
                d.appendChild(e);
                b.outerHTML = d.outerHTML;
                d = document.getElementById(c)
            }
            else {
                d.appendChild(e);
                d.innerHTML += a.markup; b.parentNode.replaceChild(d, b)
            }
            return d.getElementsByTagName("audio")[0]
        },
        attachEvents: function (b, a) {
            if (a.settings.createPlayer) {
                var c = a.settings.createPlayer,
                    d = j(c.playPauseClass, b),
                    e = j(c.scrubberClass, b);
                g[h].events.addListener(d, "click", function () {
                    a.playPause.apply(a)
                });
                g[h].events.addListener(e, "click", function (i) {
                    i = i.clientX;
                    var f = this, k = 0;
                    if (f.offsetParent) {
                        do k += f.offsetLeft;
                        while (f = f.offsetParent)
                    }
                    a.skipTo((i - k) / e.offsetWidth)
                });
                g[h].events.trackLoadProgress(a);
                g[h].events.addListener(a.element, "timeupdate", function () {
                    a.updatePlayhead.apply(a)
                });
                g[h].events.addListener(a.element, "ended", function () {
                    a.trackEnded.apply(a)
                });
                g[h].events.addListener(a.source, "error", function () {
                    clearInterval(a.readyTimer);
                    clearInterval(a.loadTimer);
                    a.settings.loadError.apply(a)
                })
            }
        },
        helpers: {
            merge: function (b, a) {
                for (attr in a)
                    if (b.hasOwnProperty(attr) ||
                        a.hasOwnProperty(attr)) b[attr] = a[attr]
            },
            clone: function (b) {
                if (b == null || typeof b !== "object") return b;
                var a = new b.constructor, c;
                for (c in b) a[c] = arguments.callee(b[c]);
                return a
            },
            addClass: function (b, a) {
                RegExp("(\\s|^)" + a + "(\\s|$)").test(b.className) || (b.className += " " + a)
            },
            removeClass: function (b, a) {
                b.className = b.className.replace(RegExp("(\\s|^)" + a + "(\\s|$)"), " ")
            },
            cloneHtml5Node: function (b) {
                var a = document.createDocumentFragment(), c = a.createElement ? a : document;
                c.createElement("audio");
                c = c.createElement("div");
                a.appendChild(c);
                c.innerHTML = b.outerHTML; return c.firstChild
            }
        },
        events: {
            memoryLeaking: false,
            listeners: [],
            addListener: function (b, a, c) {
                if (b.addEventListener) b.addEventListener(a, c, false);
                else if (b.attachEvent) {
                    this.listeners.push(b);
                    if (!this.memoryLeaking) {
                        window.attachEvent("onunload", function () {
                            if (this.listeners)
                                for (var d = 0, e = this.listeners.length; d < e; d++)
                                    g[h].events.purge(this.listeners[d])
                        });
                        this.memoryLeaking = true
                    }
                    b.attachEvent("on" + a, function () { c.call(b, window.event) })
                }
            },
            trackLoadProgress: function (b) {
                if (b.settings.preload) {
                    var a, c; b = b;
                    var d = /(ipod|iphone|ipad)/i.test(navigator.userAgent);
                    a = setInterval(function () {
                        if (b.element.readyState > -1) d || b.init.apply(b);
                        if (b.element.readyState > 1) {
                            b.settings.autoplay && b.play.apply(b);
                            clearInterval(a);
                            c = setInterval(function () {
                                b.loadProgress.apply(b);
                                b.loadedPercent >= 1 && clearInterval(c)
                            })
                        }
                    }, 10);
                    b.readyTimer = a; b.loadTimer = c
                }
            },
            purge: function (b) {
                var a = b.attributes, c;
                if (a) for (c = 0; c < a.length; c += 1)
                    if (typeof b[a[c].name] === "function")
                        b[a[c].name] = null;
                if (a = b.childNodes)
                    for (c = 0; c < a.length; c += 1)
                        purge(b.childNodes[c])
            },
            ready: function () {
                return function (b) {
                    var a = window, c = false, d = true, e = a.document, i = e.documentElement,
                        f = e.addEventListener ? "addEventListener" : "attachEvent",
                        k = e.addEventListener ? "removeEventListener" : "detachEvent",
                        n = e.addEventListener ? "" : "on",
                        m = function (l) {
                            if (!(l.type == "readystatechange" && e.readyState != "complete")) {
                                (l.type == "load" ? a : e)[k](n + l.type, m, false);
                                if (!c && (c = true)) b.call(a, l.type || l)
                            }
                        },
                        q = function () {
                            try { i.doScroll("left") }
                            catch (l) { setTimeout(q, 50); return }
                            m("poll")
                        };
                    if (e.readyState == "complete") b.call(a, "lazy");
                    else {
                        if (e.createEventObject && i.doScroll) {
                            try { d = !a.frameElement } catch (r) { }
                            d && q()
                        }
                        e[f](n + "DOMContentLoaded", m, false);
                        e[f](n + "readystatechange", m, false);
                        a[f](n + "load", m, false)
                    }
                }
            }()
        }
    };
    g[o] = function (b, a) {
        this.element = b;
        this.wrapper = b.parentNode;
        this.source = b.getElementsByTagName("source")[0] || b;
        this.mp3 = function (c) {
            var d = c.getElementsByTagName("source")[0];
            return c.getAttribute("src") || (d ? d.getAttribute("src") : null)
        }(b);
        this.settings = a;
        this.loadStartedCalled = false;
        this.loadedPercent = 0;
        this.duration = 1;
        this.playing = false
    };
    g[o].prototype = {
        updatePlayhead: function () {
            this.settings.updatePlayhead.apply(this, [this.element.currentTime / this.duration])
        },
        skipTo: function (b) {
            if (!(b > this.loadedPercent)) {
                this.element.currentTime = this.duration * b; this.updatePlayhead()
            }
        },
        load: function (b) {
            this.loadStartedCalled = false;
            this.source.setAttribute("src", b);
            this.element.load();
            this.mp3 = b; g[h].events.trackLoadProgress(this)
        },
        loadError: function () {
            this.settings.loadError.apply(this)
        },
        init: function () {
            this.settings.init.apply(this)
        },
        loadStarted: function () {
            if (!this.element.duration) return false;
            this.duration = this.element.duration;
            this.updatePlayhead();
            this.settings.loadStarted.apply(this)
        },
        loadProgress: function () {
            if (this.element.buffered != null && this.element.buffered.length) {
                if (!this.loadStartedCalled) this.loadStartedCalled = this.loadStarted();
                this.loadedPercent = this.element.buffered.end(this.element.buffered.length - 1) / this.duration;
                this.settings.loadProgress.apply(this, [this.loadedPercent])
            }
        },
        playPause: function () { this.playing ? this.pause() : this.play() },
        play: function () {
            /(ipod|iphone|ipad)/i.test(navigator.userAgent) && this.element.readyState == 0 && this.init.apply(this);
            if (!this.settings.preload) {
                this.settings.preload = true;
                this.element.setAttribute("preload", "auto");
                g[h].events.trackLoadProgress(this)
            }
            this.playing = true; this.element.play();
            this.settings.play.apply(this)
        },
        pause: function () {
            this.playing = false;
            this.element.pause();
            this.settings.pause.apply(this)
        },
        setVolume: function (b) {
            this.element.volume = b
        },
        trackEnded: function () {
            this.skipTo.apply(this, [0]);
            this.settings.loop || this.pause.apply(this);
            this.settings.trackEnded.apply(this)
        }
    };
    var j = function (b, a) {
        var c = []; a = a || document;
        if (a.getElementsByClassName) c = a.getElementsByClassName(b);
        else {
            var d, e, i = a.getElementsByTagName("*"),
                f = RegExp("(^|\\s)" + b + "(\\s|$)");
            d = 0;
            for (e = i.length; d < e; d++) f.test(i[d].className) && c.push(i[d])
        }
        return c.length > 1 ? c : c[0]
    };
})("audiojs", "audiojsInstance", this);