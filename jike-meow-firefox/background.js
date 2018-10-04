'use strict'

let socket;

// 创建 browser 计时器
browser.runtime.onInstalled.addListener(function () {
  refreshToken();
  browser.alarms.clearAll();
  browser.alarms.create('refreshToken', {
    delayInMinutes: 10,
    periodInMinutes: 10
  });
  // 每十分钟刷新一次 token
  browser.alarms.onAlarm.addListener(function () {
    refreshToken();
  });
  // 启动 Socket 连接
  newSocket();
});

// 监听 popup.js 的回调
browser.runtime.onMessage.addListener(
  function (request) {
    if (request.logged_in === true) {
      refreshToken();
      newSocket();
    }
  });

// 监听 url 更新 => 自动登录
browser.tabs.onUpdated.addListener(function (tabid, changeinfo, tab) {
  var url = tab.url;
  if (url !== undefined && changeinfo.status === "complete") {

    // 实时更新当前用户访问的 url
    browser.runtime.sendMessage({
      current_url: url
    });

    // 判断 storage 中 new-tab-to-login 是否为 true
    // 这一步的目的是实现一键打开 + 一键登录功能
    browser.storage.local.get(null, (res) => {
      if (res['new-tab-to-login'] && url.indexOf('web.okjike.com') > -1) {
        if (res['refresh-token'] && res['access-token']) {
          browser.tabs.executeScript(null, { file: "scripts/store-token.js" }, () => {
            browser.storage.local.set({
              'new-tab-to-login': false
            });
          });
        }
      }
    });
  }
});

// 同步返回 access token
let syncReturnToken = () => {
  return new Promise(resolve => {
    browser.storage.local.get(null, (res) => {
      if (res['access-token']) resolve(res['access-token']); else return;
    });
  });
}

// 刷新 token
let refreshToken = () => {
  browser.storage.local.get(null, (res) => {
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
          browser.storage.local.set({
            'refresh-token': data['x-jike-refresh-token'],
            'access-token': data['x-jike-access-token']
          });
        });
    }
  });
}

// 建立 socket 连接
let newSocket = async () => {

  // 断开已有连接
  if (socket) socket.disconnect();
  socket = io('wss://msgcenter.jike.ruguoapp.com', {
    query: { 'x-jike-access-token': await syncReturnToken() }
  });
  socket.on('message', data => {
    if (data.type === 'NOTIFICATION') {
      browser.browserAction.setBadgeText({
        text: data.data.unreadCount === 0 ? '' : data.data.unreadCount > 99 ? '99+' : data.data.unreadCount.toString()
      });
    }
  });
  socket.on('error', () => {
    socket.disconnect();
    browser.browserAction.setBadgeText({ text: 'X' });
  });
  socket.on('disconnect', () => {
    socket.disconnect();
    browser.browserAction.setBadgeText({ text: 'X' });
  });
}