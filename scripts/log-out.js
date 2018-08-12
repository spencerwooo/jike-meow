// 退出登录
(function () {
  var token = localStorage["auth-token"]
  if (token) {
    localStorage.removeItem("auth-token")
    location.reload()
  }
  chrome.runtime.sendMessage({
    token: null
  }, null)
})()