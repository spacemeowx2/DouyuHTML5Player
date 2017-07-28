"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var pageAction = {
    setIcon: function (details) {
        return new Promise(function (res, rej) {
            chrome.pageAction.setIcon(details, res);
        });
    }
};
exports.default = {
    pageAction: pageAction
};
