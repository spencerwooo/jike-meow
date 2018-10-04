# 即刻喵 🐱 for Microsoft Edge

![Chrome Store](./images/chrome_1@2x.jpg)

[![rating](https://img.shields.io/chrome-web-store/stars/gahlkoaglgmbpjoecaahganpccafojaa.svg)](https://chrome.google.com/webstore/detail/jike-web-qr/gahlkoaglgmbpjoecaahganpccafojaa?hl=zh-CN)
[![vue: 2.5.17](https://img.shields.io/badge/vue-2.5.17-green.svg)](https://cn.vuejs.org/v2/guide/installation.html)
[![License: MIT](https://img.shields.io/github/license/mashape/apistatus.svg)](https://opensource.org/licenses/MIT)

基于 Vue.js 和 Socket.io 开发的第三方即刻通知插件。

## 说明 ❗

**本仓库为原 Chrome 原生拓展插件移植到 Microsoft Edge 浏览器的版本。原仓库地址：[Jike Meow](https://github.com/coder-ysj/jike-meow)，本插件正在 beta 测试中。**

## Microsoft Edge 源码安装方法

1. 将本仓库下载并解压缩到任意文件夹中；
2. 依照微软官方支持文档 [Adding, moving, and removing extensions for Microsoft Edge](https://docs.microsoft.com/en-us/microsoft-edge/extensions/guides/adding-and-removing-extensions) 介绍，开启 Edge 开发者模式，允许未签名插件安装；
3. 选择「更多 > 扩展 > 加载扩展」，然后选择刚刚下载的文件夹；
4. 这样就完成了本插件的安装。

## 主要功能

* 📦 一键登录 - 不仅插件本身可以登录，还能登录网页端
* 📡 未读通知 - 实时显示未读通知数量，摸鱼党的专属功能
* 🚀 消息列表 - 无需即刻 App，直接查看详细的通知内容
* 😉 保护隐私 - 不收集任何个人信息，不对接任何第三方平台

## 项目结构

* **./images** Chrome Store, GitHub, 图标等素材
* **./scripts** 引用的第三方库和 Content Scripts
* **./scripts/store-token.js** 「网页登录」脚本
* **background.js** 「开启消息通知角标」脚本
* **popup.js** 插件主视图的功能

## ~~源代码安装方法~~

> 已失效。请到原仓库安装 Chrome 版本的扩展插件。

1. ~~下载项目的源代码并解压缩到任意文件夹中~~
2. ~~打开 Chrome 浏览器并进入到 More Tools > Extensions 页面~~
3. ~~点击左上角 Load unpacked 选择解压缩后的文件夹~~
4. ~~确认即可完成安装~~


## 逻辑示意图

![逻辑示意图](./images/jike-meow-mindmap.png)

---

🐱 Jike Meow on Microsoft Edge © Spencer Woo. Released under the MIT License. Originally created by [Ⓙcoder-ysj](https://web.okjike.com/user/F39BF844-7BF9-4754-8E7C-189CA3A35644/post).

Transplanted and maintained by Spencer Woo.

[@Blog](https://spencerwoo.com/) · [ⒿJike](https://web.okjike.com/user/4DDA0425-FB41-4188-89E4-952CA15E3C5E/post) · [@GitHub](https://github.com/spencerwoo98)