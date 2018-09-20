var token = localStorage['auth-token']
var access_token = localStorage['access-token']

// 在网页 LocalStorage 部署 Storage 传来的 Token
chrome.storage.local.get(null, function (result) {

  // 判断当面页面是否为 "web.okjike.com"
  // 如果是, 这部署相关 token 至 localStorage 中并刷新页面
  if (window.location.host.indexOf('web.okjike.com') > -1) {
    var date = new Date()
    localStorage.setItem('auth-token', result.token)
    localStorage.setItem('access-token', result['access-token'])
    localStorage.setItem('token-timestamp', date.toIsoString())
    location.reload()
  } else {
    alert('请在即刻网页版（https://web.okjike.com）下使用该功能')
  }
})

// 时间戳生成公式
Date.prototype.toIsoString = function () {
  var tzo = -this.getTimezoneOffset(),
    dif = tzo >= 0 ? '+' : '-',
    pad = function (num) {
      var norm = Math.floor(Math.abs(num))
      return (norm < 10 ? '0' : '') + norm
    }
  return this.getFullYear() +
    '-' + pad(this.getMonth() + 1) +
    '-' + pad(this.getDate()) +
    'T' + pad(this.getHours()) +
    ':' + pad(this.getMinutes()) +
    ':' + pad(this.getSeconds()) +
    dif + pad(tzo / 60) +
    ':' + pad(tzo % 60)
}