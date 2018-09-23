'use strict'

let notifyIO;

// 监听 onMessage
chrome.runtime.onMessage.addListener(messageCallback);
async function messageCallback(result) {
  if (result.access_token) {

    // 建立 socket 连接
    notifyIO = io('wss://msgcenter.jike.ruguoapp.com', {
      query: {
        'x-jike-access-token': await getToken()
      },
      reconnectionDelay: 3e3
    });

    // 监听 socket 的 message 事件
    notifyIO.on('message', data => {

      // 判断接收的 data type
      // 这一接口不仅接收 NOTIFICATION type
      // 还会接收 PERSONAL_UPDATE type
      if (data.type === 'NOTIFICATION') {
        chrome.browserAction.setBadgeText({
          text: data.data.unreadCount === 0 ? '' : data.data.unreadCount.toString()
        });
      }
    });

    // 每 10 分钟刷新一次 access token 和 refresh token
    chrome.storage.local.get(null, res => {

      // 避免 setInterval 多线程
      clearInterval(localStorage['timerId']);

      // 创建一个 Interval
      let refreshToken = setInterval(() => {
        axios({
          url: 'https://app.jike.ruguoapp.com/app_auth_tokens.refresh',
          method: 'get',
          headers: {
            'x-jike-refresh-token': res['refresh-token']
          }
        })
          .then(response => {
            const data = response.data;

            // 刷新本地 token
            chrome.storage.local.set({
              'token': res.token,
              'access-token': data['x-jike-access-token'],
              'refresh-token': data['x-jike-refresh-token']
            });

            // 要求 store-token.js 在网页端覆盖新的 token
            chrome.tabs.executeScript(null, { file: "scripts/store-token.js" });
          })
          .catch(() => {
            // 即刻官网对于刷新 token 的时间控制为十四天
            // 所以这里不作严格处理
          });
      }, 6e5);

      // 在 localStorage 中存储 timerId 用于 clearInterval 定位
      localStorage.setItem('timerId', refreshToken);
    });
  }
}

// 实时更新当前用户访问的 URL
chrome.tabs.onUpdated.addListener(function (tabid, changeinfo, tab) {
  var url = tab.url;
  if (url !== undefined && changeinfo.status === "loading") {
    chrome.runtime.sendMessage({
      current_url: url
    });

    // popup.js 的 logIn 方法点击直接登录
    chrome.storage.local.get(null, (res) => {
      if (res['new-tab-to-login'] && url.indexOf('web.okjike.com') > -1) {
        if (res.token && res['access-token'] && res['refresh-token']) {
          chrome.tabs.executeScript(null, { file: "scripts/store-token.js" });
        }
        chrome.storage.local.set({
          'new-tab-to-login': false
        });
      }
    });
  }
});

// 获取本地 token
const getToken = () => {
  return new Promise(resolve => {
    chrome.storage.local.get(null, (res) => {
      resolve(res['access-token']);
    });
  });
}
