'use strict'

chrome.runtime.onMessage.addListener(getNotify)

// Socket-io 获取未读消息数量
function getNotify(result) {
  if (result.access_token) {
    var access_token = result.access_token
    var notifyIO = io('wss://msgcenter.jike.ruguoapp.com?x-jike-access-token=' + access_token, {
      reconnection: true,
      reconnectionDelay: 3e5,
      reconnectionAttempts: Infinity
    })
    notifyIO.on('connect', function () {
      console.log('connected')
    })
    notifyIO.on('message', function (data) {
      if (data.type === 'NOTIFICATION') {
        chrome.browserAction.setBadgeText({ text: data.data.unreadCount.toString() })
      }
    })
    notifyIO.on('connect_error', (error) => {
      console.log('connect failed')
      notifyIO.disconnect()
      chrome.browserAction.setBadgeText({ text: '0' })
    })
    notifyIO.on('disconnect', function (response) {
      chrome.browserAction.setBadgeText({ text: '0' })
      if (response === 'transport close') {
        notifyIO.disconnect()
        notifyIO.close()
      }
    })

    chrome.storage.local.get(null, function (res) {

      // 优化多线程问题
      for (var i = 1; i < 9999; i++) {
        window.clearInterval(i);
      }

      // 每 10 分钟 刷新 Token
      setInterval(function refreshToken() {
        axios({
          url: 'https://app.jike.ruguoapp.com/app_auth_tokens.refresh',
          method: 'get',
          headers: {
            'x-jike-refresh-token': res['refresh-token']
          }
        })
          .then(function (response) {
            var data = response.data

            // 在 Storage 中存储 Token
            chrome.storage.local.set({
              'token': res.token,
              'access-token': data['x-jike-access-token'],
              'refresh-token': data['x-jike-refresh-token']
            })
          })
          .catch(function () { })
      }, 6e5)
    })
  }
}