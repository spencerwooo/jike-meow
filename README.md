# 即刻喵 🐱

[![chrome web store](https://img.shields.io/chrome-web-store/v/gahlkoaglgmbpjoecaahganpccafojaa.svg)](https://chrome.google.com/webstore/detail/jike-web-qr/gahlkoaglgmbpjoecaahganpccafojaa?hl=zh-CN)
[![rating](https://img.shields.io/chrome-web-store/stars/gahlkoaglgmbpjoecaahganpccafojaa.svg)](https://chrome.google.com/webstore/detail/jike-web-qr/gahlkoaglgmbpjoecaahganpccafojaa?hl=zh-CN)
[![vue: 2.5.17](https://img.shields.io/badge/vue-2.5.17-green.svg)](https://cn.vuejs.org/v2/guide/installation.html)
[![License: MIT](https://img.shields.io/github/license/mashape/apistatus.svg)](https://opensource.org/licenses/MIT)

基于 Chrome 和 Vue.js 开发的第三方即刻通知插件。

## 功能特点

* **一键登录** - 只需在插件内登录一次，就能永久登录，并为网页端提供同样的功能 📦
* **未读消息通知** - 实时显示你有几条未读通知 📡
* **查看消息列表** - 无需打开即刻 App，直接在浏览器里查看消息的通知内容 🚀

## 安装方法

1. 下载项目的源代码并解压缩到任意文件夹中
2. 打开 Chrome 浏览器并进入到 More Tools > Extensions 页面
3. 点击左上角「Load unpacked」选择解压缩后的文件夹
4. 确认即可完成安装

## 前提概要

不同于标准的前端开发，Chrome Extensions 拥有完全不同的 API 和底层设计，但这些并不影响你通过 React 或 Vue 类似的框架，来构建一个完整的 Chrome 应用，甚至还能在 GitHub 上找到一些第三方「脚手架」来达到这一目的。前提是你得熟悉项目的结构和基本规范。

这里提供两个我用于参考的文档链接，它们对于这个项目起到了至关重要的作用。感谢 [翻译者们](https://plus.google.com/+Crxdoc-zhAppspot) 的辛苦制作。

* Chrome Extensions 官方开发文档：[传送门](https://developer.chrome.com/extensions)
* 非官方中文开发文档：[传送门](https://crxdoc-zh.appspot.com/extensions)

**还要感谢 [@糯米鸡](http://m.okjike.com/user/viko16) 在开发过程中提供的巨大帮助！️**❤️

## 项目结构

* ./scripts 网页脚本及框架
* ./scripts/log-out.js 登出
* ./scripts/store-token.js 数据部署
* background.js socket-io & 定时刷新 access token
* popup.js 核心功能

## 逻辑结构

该项目的逻辑可分为三个部分：窗口脚本、后台脚本和网页脚本。它们的作用域和生命周期都各不相同，如果你有兴趣一起参与开发，请尽量不要跳过这个部分。

### 窗口脚本（popup.js）

* 生成二维码并获取 token
* 获取详细的通知列表

### 后台脚本（background.js）

* socket-io 获取未读消息的数量（实验性功能）
* 定时刷新旧的 access token 和 refresh token

```json
// 修改 manifest.json 配置以实现后台持续运行
"permissions": [
  "activeTab",
  "storage",
  "declarativeContent",
  "background"
],
"background": {
  "scripts": [
    "background.js"
  ],
  "persistent": false
}
```

### 网页脚本

#### ./scripts/log-out.js

* 清空 extension 本地 storage
* 清空 LocalStorage

```javascript
// 同时在插件和网页两端退出登录
// 事实上 token 数据可以通过 sync 方法实现跨浏览器同步
// 但出于安全考虑, 这一实现方式不值得推荐
chrome.storage.local.clear()
localStorage.clear()
```

#### ./scripts/store-token.js

* 生成时间戳并部署 token

```javascript
// 时间戳的生成公式
newTimestamp() => {
  var tzo = -this.getTimezoneOffset(),
    dif = tzo >= 0 ? '+' : '-',
    pad = function (num) {
      var norm = Math.floor(Math.abs(num))
      return (norm < 10 ? '0' : '') + norm
    }
  return this.getFullYear() +
    '-' + pad(this.getMonth() + 1) +
    '-' + pad(this.getDate()) +
    'T' + pad(this.getHours()) +
    ':' + pad(this.getMinutes()) +
    ':' + pad(this.getSeconds()) +
    dif + pad(tzo / 60) +
    ':' + pad(tzo % 60)
}
```

## Q&A

### 问：为什么没有加入点赞、回复这样的功能？

答：这些都是和用户行为有关的特性，需要经过极为严谨的测试才能上线，否则很可能会导致不必要的误会。由于这是个第三方插件，对接流程并不走官方渠道，所以暂时不会考虑上线这样的功能。

### 问：访问不了 Chrome Store 有什么办法解决吗？

这是个开源项目，并且与你的隐私信息有关，因此我希望该插件有一个绝对值得信赖的安装渠道，避免被他人篡改，也为了保护你的隐私，显然 [Chrome Store](https://chrome.google.com/webstore/detail/jike-web-qr/gahlkoaglgmbpjoecaahganpccafojaa?hl=zh-CN) 是「唯一」的选择，所以还请谅解。当然了，作为开发者我可以向你承诺，绝不收集你的任何隐私信息。

### 问：接下来的版本还会更新功能吗？

会，只要版本号小数点后一位有变化，就会加入新特性，例如 1.0.0 > 1.1.0 这样。但 1.0.0 > 1.0.1 通常只是维护性的升级。但无论是何种情况，我都希望每一位用户能及时地更新至最新版本。

## TODO

- [ ] 时间显示
- [ ] 加入对「问答」类型的通知支持

## LICENSE
MIT