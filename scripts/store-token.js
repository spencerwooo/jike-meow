// 在网页 LocalStorage 部署 Storage 传来的 Token
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

chrome.storage.local.get(null, function (result) {
  var date = new Date()
  localStorage.setItem("auth-token", result.token)
  localStorage.setItem("access-token", result["access-token"])
  localStorage.setItem("token-timestamp", date.toIsoString())
  location.href = "https://web.okjike.com/"
  chrome.runtime.sendMessage({
    token: result.token
  }, null)
})