var token = localStorage['auth-token'];
var access_token = localStorage['access-token'];
var time_stamp = localStorage['token-timestamp'];

chrome.storage.local.get(null, (res) => {
  var date = new Date();
  localStorage.setItem('auth-token', res.token);
  localStorage.setItem('access-token', res['access-token']);
  localStorage.setItem('token-timestamp', date.toIsoString());
  if (!token || !access_token || !time_stamp) location.reload();
});

// 时间戳生成公式
Date.prototype.toIsoString = function () {
  var tzo = -this.getTimezoneOffset(),
    dif = tzo >= 0 ? '+' : '-',
    pad = function (num) {
      var norm = Math.floor(Math.abs(num));
      return (norm < 10 ? '0' : '') + norm
    }
  return this.getFullYear() +
    '-' + pad(this.getMonth() + 1) +
    '-' + pad(this.getDate()) +
    'T' + pad(this.getHours()) +
    ':' + pad(this.getMinutes()) +
    ':' + pad(this.getSeconds()) +
    dif + pad(tzo / 60) +
    ':' + pad(tzo % 60);
}