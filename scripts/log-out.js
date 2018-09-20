(function () {
  chrome.storage.local.clear()

  // 判断当面页面是否为 "web.okjike.com"
  // 如果是, 则移除所有项目并刷新
  if (window.location.host.indexOf('web.okjike.com') > -1) {
    var token = localStorage["auth-token"]
    if (token) {
      localStorage.clear()
      location.reload()
    }
  }
  chrome.runtime.reload()
})()