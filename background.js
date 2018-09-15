'use strict'

chrome.runtime.onMessage.addListener(getNotify)

// 获取未读消息数量
function getNotify(result) {
  if (result.access_token) {
    var access_token = result.access_token
    var notifyIO = io('wss://msgcenter.jike.ruguoapp.com?x-jike-access-token=' + access_token, {
      reconnection: true,
      reconnectionDelay: 10000,
      reconnectionDelayMax: 30000,
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
  } else {
    console.log('无 access token')
    chrome.runtime.reload()
  }
}