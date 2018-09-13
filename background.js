'use strict'

// 获取未读消息数量
function getNotify(access_token) {
  var notifyIO = io('wss://msgcenter.jike.ruguoapp.com?x-jike-access-token=' + access_token, {
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
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
    setTimeout(function () {
      getNotify()
    }, 5000)
  })
  notifyIO.on('disconnect', function (response) {
    if (response === 'transport close') {
      notifyIO.disconnect()
      setTimeout(function () {
        getNotify()
      }, 5000)
    }
  })
}