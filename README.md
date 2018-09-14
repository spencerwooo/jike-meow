# Jike Web QR
基于 Vue.js 开发的 Web 版即刻登录插件。  
传送门：[Chrome Store](https://chrome.google.com/webstore/detail/jike-web-qr/gahlkoaglgmbpjoecaahganpccafojaa) 👈

 ![Chrome Store 截图](images/chrome-store-screenshot.png)

---

## 前提概要
不同于标准的前端开发，Chrome Extensions 拥有完全不同的 API 和底层设计，但这些并不影响你通过 React 或 Vue 类似的框架，来构建一个完整的 Chrome 应用，甚至还能在 GitHub 上找到一些第三方「脚手架」来达到这一目的。前提是你得了解，或者说至少得熟悉项目的结构和基本规范。

这里提供两个我曾参考过的文档链接，它们对于这个项目的「成型」起到了至关重要的作用。尤其要感谢 [翻译者们](https://plus.google.com/+Crxdoc-zhAppspot) 的辛苦制作！🎉

* Google 官方文档：[传送门](https://developer.chrome.com/extensions)
* 非官方中文文档：[传送门](https://crxdoc-zh.appspot.com/extensions)

## 项目结构
* ./images 图片素材文件
* ./scripts Content Scripts 及第三方库
* ./style CSS 样式表文件
* background.js Socket-io 代码
* manifest.json 项目的基本配置
* popup.html 应用 UI
* popup.js 核心功能代码

## 关于逻辑
就这个项目来说，它的逻辑可分为三个部分：窗口脚本、后台脚本和网页脚本。

### 窗口脚本
popup.js

* 生成二维码并获取 Token 数据
* 刷新旧的 Token 数据
* 执行 store-token.js

### 后台脚本
background.js

* 通过 Socket-io 来获取未读消息的数量
* 保持后台持续运行

### 网页脚本
log-out.js

* 清空 Chrome 应用本地 Token 数据
* 清空即刻 Web 端 LocalStorage 继而退出

store-token.js

* 接收 popup.js 发送的数据并部署 Token
* 生成有效的时间戳
* 执行 background.js

在 Chrome 应用中由于脚本的作用域都不同，所以它们之间的通信需要借助「message」实现，发送端示例代码如下：

```
chrome.runtime.sendMessage({
  token: result.token
}, null)
```

接收端示例代码如下：

```
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    console.log(request.token) // result.token
})
```

但这种写法带来的通信机制似乎是「广播」而不是「定向」，也就是说任何一个脚本发送数据，任何一个脚本都能接收，甚至包括本身。目前这一部分原理还没有搞清楚，需要进一步研究……


## 接下来要做的
……