if (window.jQuery) (function ($) {
    $.toJSON = function (o) {
        if (typeof (JSON) == 'object' && JSON.stringify)
            return JSON.stringify(o); var type = typeof (o); if (o === null)
                return "null"; if (type == "undefined")
                    return undefined; if (type == "number" || type == "boolean")
                        return o + ""; if (type == "string")
                            return $.quoteString(o); if (type == 'object') {
                                if (typeof o.toJSON == "function")
                                    return $.toJSON(o.toJSON()); if (o.constructor === Date) {
                                        var month = o.getUTCMonth() + 1; if (month < 10) month = '0' + month; var day = o.getUTCDate(); if (day < 10) day = '0' + day; var year = o.getUTCFullYear(); var hours = o.getUTCHours(); if (hours < 10) hours = '0' + hours; var minutes = o.getUTCMinutes(); if (minutes < 10) minutes = '0' + minutes; var seconds = o.getUTCSeconds(); if (seconds < 10) seconds = '0' + seconds; var milli = o.getUTCMilliseconds(); if (milli < 100) milli = '0' + milli; if (milli < 10) milli = '0' + milli; return '"' + year + '-' + month + '-' + day + 'T' +
                        hours + ':' + minutes + ':' + seconds + '.' + milli + 'Z"';
                                    }
                                if (o.constructor === Array) {
                                    var ret = []; for (var i = 0; i < o.length; i++)
                                        ret.push($.toJSON(o[i]) || "null"); return "[" + ret.join(",") + "]";
                                }
                                var pairs = []; for (var k in o) {
                                    var name; var type = typeof k; if (type == "number")
                                        name = '"' + k + '"'; else if (type == "string")
                                            name = $.quoteString(k); else
                                            continue; if (typeof o[k] == "function")
                                                continue; var val = $.toJSON(o[k]); pairs.push(name + ":" + val);
                                }
                                return "{" + pairs.join(", ") + "}";
                            }
    };
    $.evalJSON = function (src) {
        if (typeof (JSON) == 'object' && JSON.parse)
            return JSON.parse(src); return eval("(" + src + ")");
    };
    $.secureEvalJSON = function (src) {
        if (typeof (JSON) == 'object' && JSON.parse)
            return JSON.parse(src); var filtered = src; filtered = filtered.replace(/\\["\\\/bfnrtu]/g, '@'); filtered = filtered.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']'); filtered = filtered.replace(/(?:^|:|,)(?:\s*\[)+/g, ''); if (/^[\],:{}\s]*$/.test(filtered))
                return eval("(" + src + ")"); else
                throw new SyntaxError("Error parsing JSON, source is not valid.");
    };
    $.quoteString = function (string) {
        if (string.match(_escapeable)) {
            return '"' + string.replace(_escapeable, function (a)
            { var c = _meta[a]; if (typeof c === 'string') return c; c = a.charCodeAt(); return '\\u00' + Math.floor(c / 16).toString(16) + (c % 16).toString(16); }) + '"';
        }
        return '"' + string + '"';
    };
    var _escapeable = /["\\\x00-\x1f\x7f-\x9f]/g; var _meta = { '\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"': '\\"', '\\': '\\\\' };
})(jQuery);
if (window.jQuery) (function ($) {
    $.extend({
        xml2json: function (xml, extended) {
            if (!xml) return {};
            function parseXML(node, simple) {
                if (!node) return null;
                var txt = '', obj = null, att = null;
                var nt = node.nodeType, nn = jsVar(node.localName || node.nodeName);
                var nv = node.text || node.nodeValue || '';
                if (node.childNodes) {
                    if (node.childNodes.length > 0) {
                        $.each(node.childNodes, function (n, cn) {
                            var cnt = cn.nodeType, cnn = jsVar(cn.localName || cn.nodeName);
                            var cnv = cn.text || cn.nodeValue || '';
                            if (cnt == 8) return;
                            else if (cnt == 3 || cnt == 4 || !cnn) {
                                if (cnv.match(/^\s+$/)) return;
                                txt += cnv.replace(/^\s+/, '').replace(/\s+$/, '');
                            }
                            else {
                                obj = obj || {};
                                if (obj[cnn]) {
                                    if (!obj[cnn].length) obj[cnn] = myArr(obj[cnn]);
                                    obj[cnn] = myArr(obj[cnn]);
                                    obj[cnn][obj[cnn].length] = parseXML(cn, true);
                                    obj[cnn].length = obj[cnn].length;
                                }
                                else obj[cnn] = parseXML(cn);
                            };
                        });
                    };
                };
                if (node.attributes) {
                    if (node.attributes.length > 0) {
                        att = {}; obj = obj || {};
                        $.each(node.attributes, function (a, at) {
                            var atn = jsVar(at.name), atv = at.value;
                            att[atn] = atv;
                            if (obj[atn]) {
                                obj[cnn] = myArr(obj[cnn]);
                                obj[atn][obj[atn].length] = atv;
                                obj[atn].length = obj[atn].length;
                            }
                            else obj[atn] = atv;
                        });
                    };
                };
                if (obj) {
                    obj = $.extend((txt != '' ? new String(txt) : {}),/* {text:txt},*/ obj || {}/*, att || {}*/);
                    txt = (obj.text) ? (typeof (obj.text) == 'object' ? obj.text : [obj.text || '']).concat([txt]) : txt;
                    if (txt) obj.text = txt;
                    txt = '';
                };
                var out = obj || txt;
                if (extended) {
                    if (txt) out = {};
                    txt = out.text || txt || '';
                    if (txt) out.text = txt;
                    if (!simple) out = myArr(out);
                };
                return out;
            };
            var jsVar = function (s) { return String(s || '').replace(/-/g, "_"); };
            function isNum(s) {
                var regexp = /^((-)?([0-9]+)(([\.\,]{0,1})([0-9]+))?$)/
                return (typeof s == "number") || regexp.test(String((s && typeof s == "string") ? jQuery.trim(s) : ''));
            };
            var myArr = function (o) {
                if (!$.isArray(o)) o = [o]; o.length = o.length;
                return o;
            };
            if (typeof xml == 'string') xml = $.text2xml(xml);
            if (!xml.nodeType) return;
            if (xml.nodeType == 3 || xml.nodeType == 4) return xml.nodeValue;
            var root = (xml.nodeType == 9) ? xml.documentElement : xml;
            var out = parseXML(root, true);
            xml = null; root = null;
            return out;
        },
        text2xml: function (str) {
            var out;
            try {
                var xml = ($.browser.msie) ? new ActiveXObject("Microsoft.XMLDOM") : new DOMParser();
                xml.async = false;
            } catch (e) { throw new Error("XML Parser could not be instantiated") };
            try {
                if ($.browser.msie) out = (xml.loadXML(str)) ? xml : false;
                else out = xml.parseFromString(str, "text/xml");
            } catch (e) { throw new Error("Error parsing XML string") };
            return out;
        }
    });
})(jQuery);



// ========================================================================
//  XML.ObjTree -- XML source code from/to JavaScript object like E4X
// ========================================================================

if (typeof (XML) == 'undefined') XML = function () { };
//  constructor
XML.ObjTree = function () {
    return this;
};
//  class variables
XML.ObjTree.VERSION = "0.23";
//  object prototype
XML.ObjTree.prototype.xmlDecl = '<?xml version="1.0" encoding="UTF-8" ?>\n';
XML.ObjTree.prototype.attr_prefix = '-';
XML.ObjTree.prototype.writeXML = function (tree) {
    var xml = this.hash_to_xml(null, tree);
    return this.xmlDecl + xml;
};
//  method: hash_to_xml( tagName, tree )
XML.ObjTree.prototype.hash_to_xml = function (name, tree) {
    var elem = [];
    var attr = [];
    for (var key in tree) {
        if (!tree.hasOwnProperty(key)) continue;
        var val = tree[key];
        if (key.charAt(0) != this.attr_prefix) {
            if (typeof (val) == "undefined" || val == null) {
                elem[elem.length] = "<" + key + " />";
            } else if (typeof (val) == "object" && val.constructor == Array) {
                elem[elem.length] = this.array_to_xml(key, val);
            } else if (typeof (val) == "object") {
                elem[elem.length] = this.hash_to_xml(key, val);
            } else {
                elem[elem.length] = this.scalar_to_xml(key, val);
            }
        } else {
            attr[attr.length] = " " + (key.substring(1)) + '="' + (this.xml_escape(val)) + '"';
        }
    }
    var jattr = attr.join("");
    var jelem = elem.join("");
    if (typeof (name) == "undefined" || name == null) {
        // no tag
    } else if (elem.length > 0) {
        if (jelem.match(/\n/)) {
            jelem = "<" + name + jattr + ">\n" + jelem + "</" + name + ">\n";
        } else {
            jelem = "<" + name + jattr + ">" + jelem + "</" + name + ">\n";
        }
    } else {
        jelem = "<" + name + jattr + " />\n";
    }
    return jelem;
};
//  method: array_to_xml( tagName, array )
XML.ObjTree.prototype.array_to_xml = function (name, array) {
    var out = [];
    for (var i = 0; i < array.length; i++) {
        var val = array[i];
        if (typeof (val) == "undefined" || val == null) {
            out[out.length] = "<" + name + " />";
        } else if (typeof (val) == "object" && val.constructor == Array) {
            out[out.length] = this.array_to_xml(name, val);
        } else if (typeof (val) == "object") {
            out[out.length] = this.hash_to_xml(name, val);
        } else {
            out[out.length] = this.scalar_to_xml(name, val);
        }
    }
    return out.join("");
};
//  method: scalar_to_xml( tagName, text )
XML.ObjTree.prototype.scalar_to_xml = function (name, text) {
    if (name == "#text") {
        return this.xml_escape(text);
    } else {
        return "<" + name + ">" + this.xml_escape(text) + "</" + name + ">\n";
    }
};
//  method: xml_escape( text )
XML.ObjTree.prototype.xml_escape = function (text) {
    return (text + '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
};

////  method: parseXML( xmlsource )
//XML.ObjTree.prototype.parseXML = function (xml) {
//    var root;
//    if (window.DOMParser) {
//        var xmldom = new DOMParser();
//        //      xmldom.async = false;           // DOMParser is always sync-mode
//        var dom = xmldom.parseFromString(xml, "application/xml");
//        if (!dom) return;
//        root = dom.documentElement;
//    } else if (window.ActiveXObject) {
//        xmldom = new ActiveXObject('Microsoft.XMLDOM');
//        xmldom.async = false;
//        xmldom.loadXML(xml);
//        root = xmldom.documentElement;
//    }
//    if (!root) return;
//    return this.parseDOM(root);
//};
////  method: parseHTTP( url, options, callback )
//XML.ObjTree.prototype.parseHTTP = function (url, options, callback) {
//    var myopt = {};
//    for (var key in options) {
//        myopt[key] = options[key];                  // copy object
//    }
//    if (!myopt.method) {
//        if (typeof (myopt.postBody) == "undefined" &&
//             typeof (myopt.postbody) == "undefined" &&
//             typeof (myopt.parameters) == "undefined") {
//            myopt.method = "get";
//        } else {
//            myopt.method = "post";
//        }
//    }
//    if (callback) {
//        myopt.asynchronous = true;                  // async-mode
//        var __this = this;
//        var __func = callback;
//        var __save = myopt.onComplete;
//        myopt.onComplete = function (trans) {
//            var tree;
//            if (trans && trans.responseXML && trans.responseXML.documentElement) {
//                tree = __this.parseDOM(trans.responseXML.documentElement);
//            }
//            __func(tree, trans);
//            if (__save) __save(trans);
//        };
//    } else {
//        myopt.asynchronous = false;                 // sync-mode
//    }
//    var trans;
//    if (typeof (HTTP) != "undefined" && HTTP.Request) {
//        myopt.uri = url;
//        var req = new HTTP.Request(myopt);        // JSAN
//        if (req) trans = req.transport;
//    } else if (typeof (Ajax) != "undefined" && Ajax.Request) {
//        var req = new Ajax.Request(url, myopt);   // ptorotype.js
//        if (req) trans = req.transport;
//    }
//    if (callback) return trans;
//    if (trans && trans.responseXML && trans.responseXML.documentElement) {
//        return this.parseDOM(trans.responseXML.documentElement);
//    }
//}
////  method: parseDOM( documentroot )
//XML.ObjTree.prototype.parseDOM = function (root) {
//    if (!root) return;
//    this.__force_array = {};
//    if (this.force_array) {
//        for (var i = 0; i < this.force_array.length; i++) {
//            this.__force_array[this.force_array[i]] = 1;
//        }
//    }
//    var json = this.parseElement(root);   // parse root node
//    if (this.__force_array[root.nodeName]) {
//        json = [json];
//    }
//    if (root.nodeType != 11) {            // DOCUMENT_FRAGMENT_NODE
//        var tmp = {};
//        tmp[root.nodeName] = json;          // root nodeName
//        json = tmp;
//    }
//    return json;
//};
////  method: parseElement( element )
//XML.ObjTree.prototype.parseElement = function (elem) {
//    //  COMMENT_NODE
//    if (elem.nodeType == 7) {
//        return;
//    }
//    //  TEXT_NODE CDATA_SECTION_NODE
//    if (elem.nodeType == 3 || elem.nodeType == 4) {
//        var bool = elem.nodeValue.match(/[^\x00-\x20]/);
//        if (bool == null) return;     // ignore white spaces
//        return elem.nodeValue;
//    }
//    var retval;
//    var cnt = {};
//    //  parse attributes
//    if (elem.attributes && elem.attributes.length) {
//        retval = {};
//        for (var i = 0; i < elem.attributes.length; i++) {
//            var key = elem.attributes[i].nodeName;
//            if (typeof (key) != "string") continue;
//            var val = elem.attributes[i].nodeValue;
//            if (!val) continue;
//            key = this.attr_prefix + key;
//            if (typeof (cnt[key]) == "undefined") cnt[key] = 0;
//            cnt[key]++;
//            this.addNode(retval, key, cnt[key], val);
//        }
//    }
//    //  parse child nodes (recursive)
//    if (elem.childNodes && elem.childNodes.length) {
//        var textonly = true;
//        if (retval) textonly = false;        // some attributes exists
//        for (var i = 0; i < elem.childNodes.length && textonly; i++) {
//            var ntype = elem.childNodes[i].nodeType;
//            if (ntype == 3 || ntype == 4) continue;
//            textonly = false;
//        }
//        if (textonly) {
//            if (!retval) retval = "";
//            for (var i = 0; i < elem.childNodes.length; i++) {
//                retval += elem.childNodes[i].nodeValue;
//            }
//        } else {
//            if (!retval) retval = {};
//            for (var i = 0; i < elem.childNodes.length; i++) {
//                var key = elem.childNodes[i].nodeName;
//                if (typeof (key) != "string") continue;
//                var val = this.parseElement(elem.childNodes[i]);
//                if (!val) continue;
//                if (typeof (cnt[key]) == "undefined") cnt[key] = 0;
//                cnt[key]++;
//                this.addNode(retval, key, cnt[key], val);
//            }
//        }
//    }
//    return retval;
//};
////  method: addNode( hash, key, count, value )
//XML.ObjTree.prototype.addNode = function (hash, key, cnts, val) {
//    if (this.__force_array[key]) {
//        if (cnts == 1) hash[key] = [];
//        hash[key][hash[key].length] = val;      // push
//    } else if (cnts == 1) {                   // 1st sibling
//        hash[key] = val;
//    } else if (cnts == 2) {                   // 2nd sibling
//        hash[key] = [hash[key], val];
//    } else {                                    // 3rd sibling and more
//        hash[key][hash[key].length] = val;
//    }
//};
////  method: writeXML( tree )