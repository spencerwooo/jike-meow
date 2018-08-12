// 检测 Token 是否已经存在
var token = localStorage["auth-token"]
chrome.runtime.sendMessage({
  token: token ? token : null
}, null)