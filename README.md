# 斗鱼HTML5播放器

基于 [flv.js](https://github.com/Bilibili/flv.js) 的斗鱼HTML5播放器.

使用了 flv.js 内核提供的直播流播放, 用 JavaScript 实现了斗鱼的弹幕协议, 并支持发送弹幕和送礼物.

![screenshot](https://user-images.githubusercontent.com/8019167/33715813-d3f38294-db8e-11e7-95c7-c029d69ebf7e.jpg)

# 使用

**不要**使用 Chrome 直接加载本文件夹, 本扩展程序需要构建后才能使用.

[Chrome 应用商店](https://chrome.google.com/webstore/detail/hbocinidadgpnbcamhjgfbgiebhpnmfj)

[Firefox 附加组件](https://addons.mozilla.org/zh-CN/firefox/addon/douyuhtml5player/)

[Greasy Fork](https://greasyfork.org/scripts/26901) (Firefox)

要求 Chrome 版本大于等于 49 (仅在54+版本测试过)

打开斗鱼的直播间, 如果没有错误, 播放器就已经被自动替换.

注: 如开启了 [chrome://flags/#extension-active-script-permission](chrome://flags/#extension-active-script-permission), 请注意允许扩展程序在所有网址上运行, 否则会没有权限运行.

# 原理

视频播放基于 flv.js, 弹幕发射使用 CSS3, 弹幕使用 WebSocket 连接, 在 JavaScript 中实现斗鱼的弹幕协议.

由于斗鱼使用了 HTTPS, 受到 Mixed Content 限制, 只能在 Background 页面 fetch 视频内容再传到 Content Script 给 flv.js 进行播放.

具体原理请见我的 [blog](http://blog.imspace.cn/2016/10/29/DouyuHTML5Player/)

# 构建

1. `npm install`

2. `npm run build`

3. `npm run pack` 在 versions 文件夹查看 zip 文件

# 重要更新

0.8.4 开始使用 WebSocket 连接弹幕服务器, 完全摆脱 Flash 的依赖.

0.7.0 开始已经使用 [flash-emu](https://github.com/spacemeowx2/flash-emu) 进行签名

# 捐赠

欢迎投食(逃

支付宝

![alipay](https://user-images.githubusercontent.com/8019167/28763218-faff38b6-75ee-11e7-80a0-0ecb031256e2.png)


微信

![wechat](https://user-images.githubusercontent.com/8019167/28763153-7e168bc4-75ee-11e7-8aa6-322a33a4c2de.png)
