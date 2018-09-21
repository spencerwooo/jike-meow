'use strict'

var notifyIO

chrome.runtime.onMessage.addListener(messageCallback)

function messageCallback(result) {
  if (result.access_token) {
    var access_token = result.access_token

    // socket-io 后台持续获取未读消息数量
    notifyIO = io('wss://msgcenter.jike.ruguoapp.com?x-jike-access-token=' + access_token)
    notifyIO.on('connect', function () {
      console.log('connected')
    })
    notifyIO.on('message', function (data) {
      if (data.type === 'NOTIFICATION') {
        chrome.browserAction.setBadgeText({ text: data.data.unreadCount === 0 ? '' : data.data.unreadCount.toString() })
      }
    })
    notifyIO.on('connect_error', (error) => {
      console.log('connect failed')
      notifyIO.disconnect()
      chrome.browserAction.setBadgeText({ text: '' })
      setTimeout(messageCallback(result), 5000)
    })
    notifyIO.on('disconnect', function (response) {
      if (response === 'transport close') {
        console.log('connect disconnected')
        notifyIO.disconnect()
        chrome.browserAction.setBadgeText({ text: '' })
        setTimeout(messageCallback(result), 5000)
      }
    })

    // 每 10 分钟刷新一次 access token 和 refresh token
    chrome.storage.local.get(null, function (res) {

      // 优化多线程问题
      clearInterval(localStorage['timerId'])

      var refreshToken = setInterval(function refreshToken() {
        axios({
          url: 'https://app.jike.ruguoapp.com/app_auth_tokens.refresh',
          method: 'get',
          headers: {
            'x-jike-refresh-token': res['refresh-token']
          }
        })
          .then(function (response) {
            var data = response.data

            // 在本地 storage 中存储 token
            chrome.storage.local.set({
              'token': res.token,
              'access-token': data['x-jike-access-token'],
              'refresh-token': data['x-jike-refresh-token']
            })
          })
          .catch(function () {
            // 根据接口分析可知, 这些 token 需要大约两周左右的时间才会过期
            // 所以哪怕接口请求失败, 也不必要采取任何操作
          })
      }, 6e5)

      // 在 localStorage 中存储 timerid 用于 clearInterval 定位
      localStorage.setItem('timerId', refreshToken)
    })
  }
}