"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var BaseSource = (function () {
    function BaseSource() {
        this.onChange = function () { return null; };
    }
    Object.defineProperty(BaseSource.prototype, "url", {
        get: function () {
            return this._url;
        },
        set: function (v) {
            if (v === this._url) {
                this._url = v;
                return;
            }
            this.onChange(v);
        },
        enumerable: true,
        configurable: true
    });
    return BaseSource;
}());
exports.BaseSource = BaseSource;
