var token = localStorage["auth-token"]
var access_token = localStorage["access-token"]
chrome.storage.local.get(null, function (result) {
  if (!token || !access_token) {
    if (result.token && result["access-token"]) {
      var date = new Date()
      localStorage.setItem("auth-token", result.token)
      localStorage.setItem("access-token", result["access-token"])
      localStorage.setItem("token-timestamp", date.toISOString())
      location.href = "https://web.okjike.com/"
      chrome.runtime.sendMessage({
        token: result.token
      }, null)
    } else {
      chrome.runtime.sendMessage({
        token: null
      }, null)
    }
  } else {
    chrome.runtime.sendMessage({
      token: result.token
    }, null)
  }
})