# Jike Web QR
基于 Vue.js 开发的 Web 版即刻登录插件。  
传送门：[Chrome Store](https://chrome.google.com/webstore/detail/jike-web-qr/gahlkoaglgmbpjoecaahganpccafojaa) 👈

 ![Chrome Store 截图](images/demo_2@3x.png)

---

## 前提概要
不同于标准的前端开发，Chrome Extensions 拥有完全不同的 API 和底层设计，但这些并不影响你通过 React 或 Vue 类似的框架，来构建一个完整的 Chrome 应用，甚至还能在 GitHub 上找到一些第三方「脚手架」来达到这一目的。前提是你得了解，或者说至少得熟悉项目的结构和基本规范。

这里提供两个我曾参考过的文档链接，它们对于这个项目的「成型」起到了至关重要的作用。尤其要感谢 [翻译者们](https://plus.google.com/+Crxdoc-zhAppspot) 的辛苦制作！🎉

* Google 官方文档：[传送门](https://developer.chrome.com/extensions)
* 非官方中文文档：[传送门](https://crxdoc-zh.appspot.com/extensions)

## 项目结构
* ./scripts 网页脚本及框架
* ./scripts/log-out.js 登出
* ./scripts/store-token.js 数据部署
* background.js Socket-io
* popup.js 核心功能

## 代码结构
就这个项目来说，它的逻辑可分为三个部分：窗口脚本、后台脚本和网页脚本。

### 窗口脚本（popup.js）

* 生成二维码并获取 Token 数据
* 刷新旧的 Token 数据

### 后台脚本（background.js）

* 通过 Socket-io 来获取未读消息的数量
* 保持后台持续运行

```json
// 修改 manifest.json 配置以实现后台运行
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
log-out.js

* 清空 Chrome 本地 storage 数据
* 清空 Web LocalStorage

```javascript
chrome.storage.local.clear()
localStorage.clear()
```

store-token.js

* 生成时间戳并部署 Token

```javascript
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

---

## 安装方法


1. 下载项目的源代码并解压缩到任意文件夹中
2. 打开 Chrome 浏览器并进入到 More Tools => Extensions 页面
3. 点击左上角「Load unpacked」选择解压缩后的文件夹
4. 确认即可完成安装

## 关于未来
创建这个项目的初衷，一方面是希望自己能借此机会学习 Chrome 插件的开发，另一方面也是为了巩固自己的专业知识，并和社区用户一同进步。从现阶段来说，Jike Web QR 实现了最基本的需求（用户登录）以至于未来发展方向特别多，完全超出了我对它最开始的期望。

似乎这成了一个挑战？哈哈哈或许吧，不过我十分乐意接受这个变化，而且可以很明确地告诉大家，Jike Web QR 很快就会迎来下一个大功能更新，敬请期待！🎉