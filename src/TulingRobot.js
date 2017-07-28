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
var TulingRobot = (function () {
    function TulingRobot() {
        //存储图灵机器人的用户ID
        this.uTulingUserId = null;
        this.tulingApiKey = null;
        this.storage = new utils_1.LocalStorage('h5plr');
        this.uTulingUserId = this.storage.getItem("tuling_user_id", null);
        if (this.uTulingUserId == null) {
            this.uTulingUserId = "dyUser" + (Math.random()).toString().substr(2);
            this.storage.setItem("tuling_user_id", this.uTulingUserId);
        }
        this.tulingApiKey = this.storage.getItem("tuling_api_key", null);
        if (this.tulingApiKey) {
            this.tulingApiKey = "be2d2522d3db4d7ea0d6dba06c0bea9e";
            this.storage.setItem("tuling_api_key", this.tulingApiKey);
        }
    }
    TulingRobot.prototype.GetTulingRobotAnswer = function (queryStr) {
        return __awaiter(this, void 0, void 0, function () {
            var res, ans, n, n;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.TulingRobotRequest(queryStr)];
                    case 1:
                        res = _a.sent();
                        ans = null;
                        if (res) {
                            switch (res.code) {
                                case 100000:
                                    ans = res.text;
                                    break;
                                case 200000:
                                    ans = "<a target='_blank' href='" + res.url + "'>" + res.text + "$\uFF08\u70B9\u51FB\u6253\u5F00\uFF09</a>";
                                    break;
                                case 302000:
                                    ans = "<p>" + res.text + "</p><ul>";
                                    for (n = 0; n < res.list.length; n++) {
                                        ans += "<li><a target='_blank' href='" + res.list[n].detailurl + "'>" + res.list[n].article + "（" + res.list[n].source + "，点击打开）</a></li>";
                                    }
                                    ans += "</ul>";
                                    break;
                                case 308000:
                                    ans = "<p>" + res.text + "</p><ul>";
                                    for (n = 0; n < res.list.length; n++) {
                                        ans += "<li><a tooltip='" + res.list[n].info + "' target='_blank' href='" + res.list[n].detailurl + "'>" + res.list[n].name + "（点击打开）</a></li>";
                                    }
                                    ans += "</ul>";
                                    break;
                                case 40001:
                                case 40002:
                                case 40004:
                                case 40007:
                                    ans = "出错啦！错误信息为：" + res.text;
                                    break;
                                default:
                                    ans = "返回代码为：" + res.code + "返回结果为：" + res.text;
                                    break;
                            }
                        }
                        return [2 /*return*/, ans];
                }
            });
        });
    };
    TulingRobot.prototype.TulingRobotRequest = function (queryStr) {
        return __awaiter(this, void 0, void 0, function () {
            var res;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, fetch("http://www.tuling123.com/openapi/api", {
                            method: "POST",
                            headers: {
                                "User-Agent": "Mozilla/5.0",
                                "Accept": "application/json"
                            },
                            body: "{\"key\":\"" + this.tulingApiKey + "\",\"info\":\"" + queryStr + "\",\"loc\":\"" + remote_ip_info.city + "\u5E02\",userid:\"" + this.uTulingUserId + "\"}"
                        })];
                    case 1:
                        res = _a.sent();
                        if (!res) return [3 /*break*/, 3];
                        return [4 /*yield*/, res.json()];
                    case 2: return [2 /*return*/, _a.sent()];
                    case 3: return [2 /*return*/, null];
                }
            });
        });
    };
    return TulingRobot;
}());
exports.TulingRobot = TulingRobot;
