'use strict'

// 监听 popup.js 的回调
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.logged_in === true) {
      refreshToken();
    }
  });

// 监听 url 更新
chrome.tabs.onUpdated.addListener(function (tabid, changeinfo, tab) {
  var url = tab.url;
  if (url !== undefined && changeinfo.status === "complete") {

    // 实时更新当前用户访问的 URL
    chrome.runtime.sendMessage({
      current_url: url
    });

    // 判断 storage 中 new-tab-to-login 是否为 true
    // 这一步的目的是实现一键打开 + 一键登录功能
    chrome.storage.local.get(null, (res) => {
      if (res['new-tab-to-login'] && url.indexOf('web.okjike.com') > -1) {
        if (res['refresh-token'] && res['access-token']) {
          chrome.tabs.executeScript(null, { file: "scripts/store-token.js" }, () => {
            chrome.storage.local.set({
              'new-tab-to-login': false
            });
          });
        }
      }
    });
  }
});

// 每 10 分钟刷新一次 access token 和 refresh token
function refreshToken() {
  clearInterval(localStorage['timerId']);
  let refreshToken = setInterval(() => {
    chrome.storage.local.get(null, (res) => {
      if (res['refresh-token'] && res['access-token']) {
        axios({
          url: 'https://app.jike.ruguoapp.com/app_auth_tokens.refresh',
          method: 'get',
          headers: {
            'x-jike-refresh-token': res['refresh-token']
          }
        })
          .then(response => {
            const data = response.data;
            chrome.storage.local.set({
              'refresh-token': data['x-jike-refresh-token'],
              'access-token': data['x-jike-access-token']
            });
          });
      }
    })
  }, 6e5);
  localStorage.setItem('timerId', refreshToken);
}