'use strict'

var notifyIO;

// 监听 popup.js 的回调
chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    if (request.logged_in === true) {
      socketConnection();
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

// socket-io 模块
async function socketConnection() {
  if (navigator.onLine === false) return

  // 开始建立 socket 连接
  notifyIO = io('wss://msgcenter.jike.ruguoapp.com', {
    query: {
      'x-jike-access-token': await getToken()
    },
    reconnectionDelay: 10000
  });
  notifyIO.on('message', data => {
    // 判断接收的 data type
    // 这一接口不仅接收 NOTIFICATION type
    // 还会接收 PERSONAL_UPDATE type
    if (data.type === 'NOTIFICATION') {
      chrome.browserAction.setBadgeText({
        text: data.data.unreadCount === 0 ? '' : data.data.unreadCount > 99 ? '99+' : data.data.unreadCount.toString()
      });
    }
  });
  notifyIO.on('reconnect_attempt', () => {
    if (navigator.onLine === false) {
      notifyIO.disconnect();
      chrome.browserAction.setBadgeText({ text: '' });
    }
  });
  notifyIO.on('reconnect_error', () => {
    notifyIO.disconnect();
    chrome.browserAction.setBadgeText({ text: '' });
  });
  notifyIO.on('disconnect', () => {
    notifyIO.disconnect();
    chrome.browserAction.setBadgeText({ text: '' });
  });
  notifyIO.on('connect_error', () => {
    notifyIO.disconnect();
    chrome.browserAction.setBadgeText({ text: '' });
  });
  notifyIO.on('error', () => {
    notifyIO.disconnect();
    chrome.browserAction.setBadgeText({ text: '' });
  });
}

// 同步返回 access token
function getToken() {
  return new Promise(resolve => {
    chrome.storage.local.get(null, (res) => {
      resolve(res['access-token']);
    });
  });
}

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