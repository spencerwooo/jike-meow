// 退出登录
(function () {
  var token = localStorage["auth-token"]
  if (token) {
    localStorage.clear()
    location.reload()
  }
  chrome.runtime.sendMessage({
    token: null
  }, null)
})()