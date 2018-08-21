// 本插件使用的都是入门级 Chrome extension API
// Google 官方手册访问 https://developer.chrome.com/extensions
// 非官方中文教程访问 https://crxdoc-zh.appspot.com/extensions

'use strict'

var token
var uuid
var url = "https://app.jike.ruguoapp.com"

// 检测 Token 是否已经存在
chrome.tabs.executeScript(null, {
  file: "scripts/detect-token.js"
})

// 触发 onMessage 回调
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    generateQrCode("https://t.cn/ReMJSA6")
    if (request.token) {
      $("#qrcode-framer").hide()
      $("#logOut").show()
      $("#refreshQR").hide()
    } else {
      $("#logOut").hide()
      $("#refreshQR").show()
      getUuid()
    }
  })

// 二维码过期或失效时，手动刷新
$("#refreshQR").click(function () {
  getUuid()
})

// 退出登录
$("#logOut").click(function () {
  chrome.tabs.executeScript(null, {
    file: "scripts/log-out.js"
  })
})

// 在即刻上粉我
$("#followMe").click(function () {
  window.open("https://web.okjike.com/user/F39BF844-7BF9-4754-8E7C-189CA3A35644/post")
})

// 基于 QRcode.js 生成二维码
function generateQrCode(url) {
  if ($("#qrcode").children().length > 0) {
    $("#qrcode").empty()
  }
  new QRCode(document.getElementById("qrcode"), {
    text: url,
    width: 170,
    height: 170,
    colorDark: "#404040",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  })
}

// 获取 UUID 并生成二维码
function getUuid() {
  $("#qrcode-framer").show()
  $.get(url + "/sessions.create")
    .done(function (res) {
      uuid = res.uuid
      generateQrCode("jike://page.jk/web?url=https%3A%2F%2Fruguoapp.com%2Faccount%2Fscan%3Fuuid%3D" + uuid + "&displayHeader=false&displayFooter=false")
      $("#qrcode-framer").hide()
      waitForLogin(uuid)
    })
    .fail(function () { })
}

// 判断生成的二维码是否被扫描
// 返回 res.logged_in === true 则扫描成功
function waitForLogin(uuid) {
  $.get(url + "/sessions.wait_for_login", {
    uuid: uuid
  })
    .done(function (res) {
      if (res && res.logged_in === true) {
        waitForConfirmation(uuid)
      } else {
        getUuid()
      }
    })
    .fail(function () {
      getUuid()
    })
}

// 判断即刻客户端里是否点击确认登录
// 返回 res.confirmed === true 则获取 Token
function waitForConfirmation(uuid) {
  $.get(url + "/sessions.wait_for_confirmation", {
    uuid: uuid
  })
    .done(function (res) {
      if (res.confirmed === true) {
        // 在 Storage 中存储 Token 传递给 store-token.js
        chrome.storage.local.set({
          "token": res.token,
          "access-token": res["x-jike-access-token"]
        })
        chrome.tabs.executeScript(null, {
          file: "scripts/store-token.js"
        })
      } else {
        getUuid()
      }
    })
    .fail(function () {
      alert("验证接口请求异常，请手动刷新二维码")
      return false
    })
}