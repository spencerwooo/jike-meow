var url = "https://app.jike.ruguoapp.com"
var token = localStorage["auth-token"]
var access_token = localStorage["access-token"]

chrome.storage.local.get(null, function (result) {
  if (!token || !access_token) {
    if (result.token && result["access-token"] && result["refresh-token"]) {
      axios({
        url: url + "/app_auth_tokens.refresh",
        method: "get",
        headers: {
          "x-jike-refresh-token": result["refresh-token"]
        }
      })
        .then(function (response) {
          var res = response.data
          var date = new Date()
          localStorage.setItem("auth-token", result.token)
          localStorage.setItem("access-token", res["x-jike-access-token"])
          localStorage.setItem("token-timestamp", date.toIsoString())
          location.href = "https://web.okjike.com/"
          // 在 Storage 中存储 Token
          chrome.storage.local.set({
            "token": result.token,
            "access-token": res["x-jike-access-token"],
            "refresh-token": res["x-jike-refresh-token"]
          })
          // Popup.js 回传
          chrome.runtime.sendMessage({
            token: result.token
          }, null)
        })
        .catch(function () {
          alert("数据异常")
          return false
        })
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

// 时间戳生成公式
Date.prototype.toIsoString = function () {
  var tzo = -this.getTimezoneOffset(),
    dif = tzo >= 0 ? '+' : '-',
    pad = function (num) {
      var norm = Math.floor(Math.abs(num));
      return (norm < 10 ? '0' : '') + norm;
    };
  return this.getFullYear() +
    '-' + pad(this.getMonth() + 1) +
    '-' + pad(this.getDate()) +
    'T' + pad(this.getHours()) +
    ':' + pad(this.getMinutes()) +
    ':' + pad(this.getSeconds()) +
    dif + pad(tzo / 60) +
    ':' + pad(tzo % 60);
}