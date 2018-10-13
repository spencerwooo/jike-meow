(function () {
  var refresh_token = localStorage['auth-token'],
    access_token = localStorage['access-token'],
    time_stamp = localStorage['token-timestamp'];

  chrome.storage.local.get(null, (res) => {
    if (!refresh_token || !access_token || !time_stamp) {
      localStorage.setItem('auth-token', res['refresh-token']);
      localStorage.setItem('access-token', res['access-token']);
      localStorage.setItem('token-timestamp', (new Date()).generateTimestamp());
      location.reload();
    } else {
      return;
    }
  });
})()

Date.prototype.generateTimestamp = function () {
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
