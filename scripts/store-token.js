// 在网页 LocalStorage 部署 Storage 传来的 Token
chrome.storage.local.get("token", function (result) {
  localStorage.setItem("auth-token", result.token)
  window.open("https://web.okjike.com/")
  chrome.storage.local.clear()
})