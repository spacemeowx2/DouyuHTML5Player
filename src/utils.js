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
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
function utf8ToUtf16(utf8_bytes) {
    var unicode_codes = [];
    var unicode_code = 0;
    var num_followed = 0;
    for (var i_1 = 0; i_1 < utf8_bytes.length; ++i_1) {
        var utf8_byte = utf8_bytes[i_1];
        if (utf8_byte >= 0x100) {
            // Malformed utf8 byte ignored.
        }
        else if ((utf8_byte & 0xC0) == 0x80) {
            if (num_followed > 0) {
                unicode_code = (unicode_code << 6) | (utf8_byte & 0x3f);
                num_followed -= 1;
            }
            else {
                // Malformed UTF-8 sequence ignored.
            }
        }
        else {
            if (num_followed == 0) {
                unicode_codes.push(unicode_code);
            }
            else {
                // Malformed UTF-8 sequence ignored.
            }
            if (utf8_byte < 0x80) {
                unicode_code = utf8_byte;
                num_followed = 0;
            }
            else if ((utf8_byte & 0xE0) == 0xC0) {
                unicode_code = utf8_byte & 0x1f;
                num_followed = 1;
            }
            else if ((utf8_byte & 0xF0) == 0xE0) {
                unicode_code = utf8_byte & 0x0f;
                num_followed = 2;
            }
            else if ((utf8_byte & 0xF8) == 0xF0) {
                unicode_code = utf8_byte & 0x07;
                num_followed = 3;
            }
            else {
                // Malformed UTF-8 sequence ignored.
            }
        }
    }
    if (num_followed == 0) {
        unicode_codes.push(unicode_code);
    }
    else {
        // Malformed UTF-8 sequence ignored.
    }
    unicode_codes.shift(); // Trim the first element.
    var utf16_codes = [];
    for (var i = 0; i < unicode_codes.length; ++i) {
        unicode_code = unicode_codes[i];
        if (unicode_code < (1 << 16)) {
            utf16_codes.push(unicode_code);
        }
        else {
            var first = ((unicode_code - (1 << 16)) / (1 << 10)) + 0xD800;
            var second = (unicode_code % (1 << 10)) + 0xDC00;
            utf16_codes.push(first);
            utf16_codes.push(second);
        }
    }
    return utf16_codes;
}
function utf8_to_ascii(str) {
    // return unescape(encodeURIComponent(str))
    var char2bytes = function (unicode_code) {
        var utf8_bytes = [];
        if (unicode_code < 0x80) {
            utf8_bytes.push(unicode_code);
        }
        else if (unicode_code < (1 << 11)) {
            utf8_bytes.push((unicode_code >>> 6) | 0xC0);
            utf8_bytes.push((unicode_code & 0x3F) | 0x80);
        }
        else if (unicode_code < (1 << 16)) {
            utf8_bytes.push((unicode_code >>> 12) | 0xE0);
            utf8_bytes.push(((unicode_code >> 6) & 0x3f) | 0x80);
            utf8_bytes.push((unicode_code & 0x3F) | 0x80);
        }
        else if (unicode_code < (1 << 21)) {
            utf8_bytes.push((unicode_code >>> 18) | 0xF0);
            utf8_bytes.push(((unicode_code >> 12) & 0x3F) | 0x80);
            utf8_bytes.push(((unicode_code >> 6) & 0x3F) | 0x80);
            utf8_bytes.push((unicode_code & 0x3F) | 0x80);
        }
        return utf8_bytes;
    };
    var o = [];
    for (var i = 0; i < str.length; i++) {
        o = o.concat(char2bytes(str.charCodeAt(i)));
    }
    return o.map(function (i) { return String.fromCharCode(i); }).join('');
}
exports.utf8_to_ascii = utf8_to_ascii;
function ascii_to_utf8(str) {
    var bytes = str.split('').map(function (i) { return i.charCodeAt(0); });
    return utf8ToUtf16(bytes).map(function (i) { return String.fromCharCode(i); }).join('');
}
exports.ascii_to_utf8 = ascii_to_utf8;
function requestFullScreen() {
    var de = document.documentElement;
    if (de.requestFullscreen) {
        de.requestFullscreen();
    }
    else if (de.mozRequestFullScreen) {
        de.mozRequestFullScreen();
    }
    else if (de.webkitRequestFullScreen) {
        de.webkitRequestFullScreen();
    }
}
exports.requestFullScreen = requestFullScreen;
function exitFullscreen() {
    var de = document;
    if (de.exitFullscreen) {
        de.exitFullscreen();
    }
    else if (de.mozCancelFullScreen) {
        de.mozCancelFullScreen();
    }
    else if (de.webkitCancelFullScreen) {
        de.webkitCancelFullScreen();
    }
}
exports.exitFullscreen = exitFullscreen;
var LocalStorage = (function () {
    function LocalStorage(domain) {
        this.domain = domain;
    }
    LocalStorage.prototype.getItem = function (key, def) {
        return window.localStorage.getItem(this.domain + "-" + key) || def;
    };
    LocalStorage.prototype.setItem = function (key, data) {
        window.localStorage.setItem(this.domain + "-" + key, data);
    };
    return LocalStorage;
}());
exports.LocalStorage = LocalStorage;
var Timer = (function () {
    function Timer(delay) {
        this.delay = delay;
    }
    Timer.prototype.reset = function () {
        if (this.id) {
            clearTimeout(this.id);
        }
        this.id = window.setTimeout(this.onTimer, this.delay);
    };
    return Timer;
}());
exports.Timer = Timer;
function getURL(src) {
    if (src.substr(0, 5) !== 'blob:') {
        src = chrome.runtime.getURL(src);
    }
    return src;
}
exports.getURL = getURL;
function addScript(src) {
    var script = document.createElement('script');
    // blob:
    script.src = getURL(src);
    document.head.appendChild(script);
}
exports.addScript = addScript;
function addCss(src, rel, type) {
    if (rel === void 0) { rel = 'stylesheet'; }
    if (type === void 0) { type = 'text/css'; }
    var link = document.createElement('link');
    link.rel = rel;
    link.type = type;
    link.href = getURL(src);
    document.head.appendChild(link);
}
exports.addCss = addCss;
function createBlobURL(content, type) {
    var blob = new Blob([content], { type: type });
    return URL.createObjectURL(blob);
}
exports.createBlobURL = createBlobURL;
exports.p32 = function (i) { return [i, i / 256, i / 65536, i / 16777216].map(function (i) { return String.fromCharCode(Math.floor(i) % 256); }).join(''); };
exports.u32 = function (s) { return s.split('').map(function (i) { return i.charCodeAt(0); }).reduce(function (a, b) { return b * 256 + a; }); };
// ---------------------
var messageMap = {};
function onMessage(type, cb) {
    messageMap[type] = cb;
}
exports.onMessage = onMessage;
function postMessage(type, data) {
    window.postMessage({
        type: type,
        data: data
    }, "*");
}
exports.postMessage = postMessage;
var msgCallbacks = [];
var lastCbId = 0;
function sendMessage(type, data) {
    return new Promise(function (res, rej) {
        var curId = lastCbId++;
        var timeoutId = window.setTimeout(function () {
            delete msgCallbacks[curId];
            rej();
        }, 5000);
        msgCallbacks[curId] = function () {
            delete msgCallbacks[curId];
            window.clearTimeout(timeoutId);
            res();
        };
        window.postMessage({
            type: type,
            data: data,
            cbId: curId++
        }, '*');
    });
}
exports.sendMessage = sendMessage;
window.addEventListener('message', function (event) {
    if (event.source != window)
        return;
    var data = event.data;
    if (data.cb) {
        var cb = msgCallbacks[data.cbId];
        if (cb && (typeof cb === 'function')) {
            cb();
        }
    }
    else if (data.type) {
        if (typeof messageMap[data.type] === 'function') {
            messageMap[data.type](data.data);
        }
        if (data.cbId) {
            window.postMessage({
                cb: true,
                cbId: data.cbId
            }, '*');
        }
    }
}, false);
function retry(promise, times) {
    return __awaiter(this, void 0, void 0, function () {
        var err, i, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    err = [];
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < times)) return [3 /*break*/, 6];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    return [4 /*yield*/, promise()];
                case 3: return [2 /*return*/, _a.sent()];
                case 4:
                    e_1 = _a.sent();
                    err.push(e_1);
                    return [3 /*break*/, 5];
                case 5:
                    i++;
                    return [3 /*break*/, 1];
                case 6: throw err;
            }
        });
    });
}
exports.retry = retry;
function getSync() {
    return new Promise(function (res, rej) {
        if (chrome && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.get(function (items) {
                res(items);
            });
        }
        else {
            rej(new Error('不支持的存储方式'));
        }
    });
}
exports.getSync = getSync;
function setSync(item) {
    return new Promise(function (res, rej) {
        if (chrome && chrome.storage && chrome.storage.sync) {
            chrome.storage.sync.set(item, res);
        }
        else {
            rej(new Error('不支持的存储方式'));
        }
    });
}
exports.setSync = setSync;
function getSetting() {
    return __awaiter(this, void 0, void 0, function () {
        var setting;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getSync()];
                case 1:
                    setting = _a.sent();
                    if (!setting.blacklist) {
                        setting.blacklist = [];
                    }
                    return [2 /*return*/, setting];
            }
        });
    });
}
exports.getSetting = getSetting;
function setSetting(setting) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, setSync(setting)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
exports.setSetting = setSetting;
var defaultBgListener = function (request) { return __awaiter(_this, void 0, void 0, function () { return __generator(this, function (_a) {
    return [2 /*return*/, null];
}); }); };
var bgListener = defaultBgListener;
function setBgListener(listener) {
    var _this = this;
    if (bgListener === defaultBgListener) {
        if ((typeof chrome !== 'undefined') && chrome.runtime && chrome.runtime.onMessage) {
            chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) { return __awaiter(_this, void 0, void 0, function () {
                var _a;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            _a = sendResponse;
                            return [4 /*yield*/, bgListener(request)];
                        case 1:
                            _a.apply(void 0, [_b.sent()]);
                            return [2 /*return*/];
                    }
                });
            }); });
        }
    }
    else {
        console.warn('多次设置BgListener');
    }
    bgListener = listener;
}
exports.setBgListener = setBgListener;
