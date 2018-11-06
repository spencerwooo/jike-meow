'use strict'

let socket;

browser.runtime.onInstalled.addListener(function () {
  refreshToken();
  browser.alarms.clearAll();
  browser.alarms.create('refreshToken', {
    delayInMinutes: 10,
    periodInMinutes: 10
  });
  browser.alarms.onAlarm.addListener(function () {
    refreshToken();
  });
  newSocket();
});

browser.runtime.onMessage.addListener(
  function (request) {
    if (request.logged_in === true) {
      refreshToken();
      newSocket();
    }
  });

browser.tabs.onUpdated.addListener(function (tabid, changeinfo, tab) {
  var url = tab.url;
  if (url !== undefined && changeinfo.status === "complete") {

    browser.runtime.sendMessage({
      current_url: url
    });

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

let syncReturnToken = () => {
  return new Promise(resolve => {
    browser.storage.local.get(null, (res) => {
      if (res['access-token']) resolve(res['access-token']); else return;
    });
  });
}

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

let newSocket = async () => {
  if (socket) socket.disconnect();
  socket = io('wss://msgcenter.jike.ruguoapp.com', {
    query: { 'x-jike-access-token': await syncReturnToken() },
    reconnectionDelay: 3e3
  });
  socket.on('message', data => {
    if (data.type === 'NOTIFICATION') {
      browser.browserAction.setBadgeText({
        text: data.data.unreadCount === 0 ? '' : data.data.unreadCount > 99 ? '99+' : data.data.unreadCount.toString()
      });
    }
  });
  socket.on("reconnect_attempt", () => {
    if (socket) socket.disconnect();
  });
  socket.on("error", () => {
    browser.browserAction.setBadgeText({ text: '...' });
  });
  socket.on('disconnect', () => {
    browser.browserAction.setBadgeText({ text: 'X' });
  });
}