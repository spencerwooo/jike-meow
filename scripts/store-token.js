// 在网页 LocalStorage 部署 Storage 传来的 Token
chrome.storage.local.get(null, function (result) {
  var date = new Date()
  localStorage.setItem("auth-token", result.token)
  localStorage.setItem("access-token", result["access-token"])
  localStorage.setItem("token-timestamp", date.toISOString())
  location.href = "https://web.okjike.com/"
  chrome.runtime.sendMessage({
    token: result.token
  }, null)
})