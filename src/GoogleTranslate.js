"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var GoogleTranslates = (function () {
    function GoogleTranslates() {
        this.storage = new utils_1.LocalStorage('h5plr');
        //缓存已经翻译过的信息内容
        this.transCache = [];
        this.transLanguageCache = [];
        //国家与语言代码字符串
        //国家
        this.uLanguageNames = ["中文", "中文", "中文", "英语", "英语", "英语", "英语", "英语", "英语", "英语", "英语", "芬兰语", "英语", "丹麦语", "英语", "希伯来语", "英语", "英语", "英语", "英语", "英语", "英语", "英语", "英语", "英语", "英语", "韩文", "日语", "荷兰语", "荷兰语", "葡萄牙语", "葡萄牙语", "法语", "法语", "法语", "法语", "法语", "西班牙语", "西班牙语", "西班牙语", "西班牙语", "西班牙语", "西班牙语", "西班牙语", "德语", "德语", "德语", "俄语", "意大利语", "希腊语", "挪威语", "匈牙利语", "土耳其语", "捷克语", "斯洛文尼亚语", "波兰语", "瑞典语", "西班牙语"];
        //国家所对应的地区
        this.uRegionNames = ["简体", "繁体台湾", "繁体香港", "香港", "美国", "英国", "全球", "加拿大", "澳大利亚", "爱尔兰", "芬兰", "芬兰", "丹麦", "丹麦", "以色列", "以色列", "南非", "印度", "挪威", "新加坡", "新西兰", "印度尼西亚", "菲律宾", "泰国", "马来西亚", "阿拉伯", "韩国", "日本", "荷兰", "比利时", "葡萄牙", "巴西", "法国", "卢森堡", "瑞士", "比利时", "加拿大", "拉丁美洲", "西班牙", "阿根廷", "美国", "墨西哥", "哥伦比亚", "波多黎各", "德国", "奥地利", "瑞士", "俄罗斯", "意大利", "希腊", "挪威", "匈牙利", "土耳其", "捷克共和国", "斯洛文尼亚语", "波兰", "瑞典", "智利"];
        //最终代码
        this.uLanguageCode = ["zh-cn", "zh-tw", "zh-hk", "en-hk", "en-us", "en-gb", "en-ww", "en-ca", "en-au", "en-ie", "en-fi", "fi-fi", "en-dk", "da-dk", "en-il", "he-il", "en-za", "en-in", "en-no", "en-sg", "en-nz", "en-id", "en-ph", "en-th", "en-my", "en-xa", "ko-kr", "ja-jp", "nl-nl", "nl-be", "pt-pt", "pt-br", "fr-fr", "fr-lu", "fr-ch", "fr-be", "fr-ca", "es-la", "es-es", "es-ar", "es-us", "es-mx", "es-co", "es-pr", "de-de", "de-at", "de-ch", "ru-ru", "it-it", "el-gr", "no-no", "hu-hu", "tr-tr", "cs-cz", "sl-sl", "pl-pl", "sv-se", "es-cl"];
        //google翻译api变量
        this.UA = navigator.userAgent;
        this.googleDomain = "translate.google.com";
        this.dictURL = "https://" + this.googleDomain + "/translate_a/single?client=t";
        this.ttsURL = "http://" + this.googleDomain + "/translate_tts?client=t";
    }
    GoogleTranslates.prototype.init_google_value_tk = function () {
        return __awaiter(this, void 0, void 0, function () {
            var url, res, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        url = "https://" + this.googleDomain;
                        return [4 /*yield*/, fetch(url, {
                                method: "GET",
                                headers: {
                                    'Content-Type': 'application/x-www-form-urlencoded'
                                }
                            })];
                    case 1:
                        res = _b.sent();
                        if (!res) return [3 /*break*/, 3];
                        _a = this.init_google_value_tk_parse;
                        return [4 /*yield*/, res.json()];
                    case 2:
                        _a.apply(this, [_b.sent()]);
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GoogleTranslates.prototype.GetGoogleTranslate = function (queryStr, srcLanguage, dstLanguage) {
        var _this = this;
        var ans = this.searchInTranslateCache(dstLanguage, queryStr);
        var bIsGotAnswer = ans == null;
        if (!ans) {
            this.RequestTranslate(queryStr, srcLanguage, dstLanguage, function (arrayTxt, lan) {
                var __this = _this;
                console.log("返回值为：" + arrayTxt);
                if (arrayTxt) {
                    try {
                        ans = eval(arrayTxt);
                        if (ans[0]) {
                            if (ans[0][0]) {
                                if (ans[0][0][0]) {
                                    __this.transCache.push(arrayTxt);
                                    __this.transLanguageCache.push(lan);
                                    __this.ReadText(dstLanguage, ans[0][0][0]);
                                    bIsGotAnswer = true;
                                    //console.log(`翻译缓存长度为：${transCache.length}，语言缓存长度为：${transLanguageCache.length} 当前加入缓存的内容为${transCache[transCache.length-1]}  ${transLanguageCache[transLanguageCache.length-1]}`);
                                }
                            }
                        }
                    }
                    catch (e) {
                        console.log("错误:" + e);
                    }
                }
            });
        }
        return bIsGotAnswer ? { "meaning": ans[0][0][0], "pronounce": ans[0][1] ? ans[0][1][2] ? ans[0][1][2] : null : null } : null;
    };
    GoogleTranslates.prototype.init_google_value_tk_parse = function (responseText) {
        // TKK=eval('((function(){var a\x3d4264492758;var b\x3d-1857761911;return 406375+\x27.\x27+(a+b)})())');
        var res = /;TKK=(.*?\'\));/i.exec(responseText);
        if (res !== null) {
            var res2 = /var a=(.*?);.*?var b=(.*?);.*?return (\d+)/i.exec(res[1].replace(/\\x3d/g, '='));
            if (res2 !== null) {
                var tkk = Number(res2[3]) + '.' + (Number(res2[1]) + Number(res2[2]));
                this.storage.setItem('google_value_tk', tkk);
            }
        }
    };
    GoogleTranslates.prototype.ReadText = function (lang, txt) {
        var nz = lang.split("-");
        for (var n = 0; n < this.responsiveVoice.responsivevoices.length; n++) {
            //console.log(this.responsiveVoice.responsivevoices[n]);
            if (this.responsiveVoice.responsivevoices[n].flag === nz[1]) {
                this.responsiveVoice.speak(txt, this.responsiveVoice.responsivevoices[n].name);
                //console.log("found the sound name:"+responsiveVoice.responsivevoices[n].name);
                return;
            }
        }
    };
    // return token for the new API
    GoogleTranslates.prototype.googleTK = function (text) {
        // view-source:https://translate.google.com/translate/releases/twsfe_w_20151214_RC03/r/js/desktop_module_main.js && TKK from HTML
        var uM = this.storage.getItem('google_value_tk', null);
        if (uM == 'undefined' || uM == null) {
            this.init_google_value_tk();
            uM = this.storage.getItem('google_value_tk', null);
            if (uM == null)
                return null;
        }
        ;
        var cb = "&";
        var k = "";
        var Gf = "=";
        var Vb = "+-a^+6";
        var t = "a";
        var Yb = "+";
        var Zb = "+-3^+b+-f";
        var jd = ".";
        var sM = function (a) {
            return function () {
                return a;
            };
        };
        var tM = function (a, b) {
            for (var c = 0; c < b.length - 2; c += 3) {
                var d = b.charAt(c + 2), d = d >= t ? d.charCodeAt(0) - 87 : Number(d), d = b.charAt(c + 1) == Yb ? a >>> d : a << d;
                a = b.charAt(c) == Yb ? a + d & 4294967295 : a ^ d;
            }
            return a;
        };
        var vM = function (a) {
            var b;
            if (null !== uM) {
                b = uM;
            }
            else {
                b = sM(String.fromCharCode(84));
                var c_1 = sM(String.fromCharCode(75));
                b = [b(), b()];
                b[1] = c_1();
                b = (uM = window[b.join(c_1())] || k) || k;
            }
            var d = sM(String.fromCharCode(116)), c = sM(String.fromCharCode(107)), d = [d(), d()];
            d[1] = c();
            c = cb + d.join(k) + Gf;
            d = b.split(jd);
            b = Number(d[0]) || 0;
            for (var e = [], f = 0, g = 0; g < a.length; g++) {
                var m = a.charCodeAt(g);
                128 > m ? e[f++] = m : (2048 > m ? e[f++] = m >> 6 | 192 : (55296 == (m & 64512) && g + 1 < a.length && 56320 == (a.charCodeAt(g + 1) & 64512) ? (m = 65536 + ((m & 1023) << 10) + (a.charCodeAt(++g) & 1023), e[f++] = m >> 18 | 240, e[f++] = m >> 12 & 63 | 128) : e[f++] = m >> 12 | 224, e[f++] = m >> 6 & 63 | 128), e[f++] = m & 63 | 128);
            }
            a = b || 0;
            for (f = 0; f < e.length; f++) {
                a += e[f], a = tM(a, Vb);
            }
            a = tM(a, Zb);
            a ^= Number(d[1]) || 0;
            0 > a && (a = (a & 2147483647) + 2147483648);
            a %= 1E6;
            return a.toString() + jd + (a ^ b);
        };
        return vM(text);
    };
    // Google Translate Request
    GoogleTranslates.prototype.RequestTranslate = function (txt, sl, tl, parse) {
        return __awaiter(this, void 0, void 0, function () {
            var tk, Url, Hdr, Q, Data, res, _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        tk = this.googleTK(txt);
                        Url = this.dictURL +
                            "&hl=auto" +
                            "&sl=" + sl + "&tl=" + tl +
                            "&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&dt=at&ie=UTF-8&oe=UTF-8&otf=2&trs=1&inputm=1&ssel=0&tsel=0&source=btn&kc=3" +
                            "&tk=" + tk +
                            "&q=" + encodeURI(txt);
                        Hdr = {
                            "User-Agent": this.UA,
                            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
                            "Accept-Encoding": "gzip, deflate"
                        };
                        Q = Url.split('&q=');
                        Url = Q[0];
                        Data = '&q=' + Q[1];
                        Hdr["Content-Length"] = Data.length + '';
                        Hdr["Content-Type"] = "application/x-www-form-urlencoded; charset=UTF-8";
                        return [4 /*yield*/, fetch(Url, {
                                method: 'POST',
                                headers: Hdr,
                                body: Data
                            })];
                    case 1:
                        res = _b.sent();
                        if (!res) return [3 /*break*/, 3];
                        _a = parse;
                        return [4 /*yield*/, res.json()];
                    case 2:
                        _a.apply(void 0, [_b.sent(), tl]);
                        _b.label = 3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    GoogleTranslates.prototype.searchInTranslateCache = function (lan, str) {
        //console.log(`begin search! lan=${lan},str=${str}`);
        for (var n = 0; n < this.transCache.length; n++) {
            if (this.transLanguageCache[n] === lan) {
                var sps = eval(this.transCache[n]);
                if (sps[0][0][1] === str)
                    return sps;
            }
        }
        //console.log("end search!");
        return null;
    };
    return GoogleTranslates;
}());
exports.GoogleTranslates = GoogleTranslates;
