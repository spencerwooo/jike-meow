// Google 官方手册访问 https://developer.chrome.com/extensions
// 非官方中文教程访问 https://crxdoc-zh.appspot.com/extensions

// auth token, 用来获取通知列表
// refresh token, 可以换取新的 token
// access token, Socket 和其它功能

'use strict'

new Vue({
  el: '#app',
  data() {
    return {
      ui: false, // 优化 UI 闪烁问题
      url: 'https://app.jike.ruguoapp.com', // 接口统一地址
      current_url: '', // 当前页面 URL
      uuid: '', // 生成扫描二维码
      auth_token: '',
      refresh_token: '',
      access_token: '',
      error: false, // 通知列表加载失败
      qr_loading: true, // 二维码正在加载
      qr_scanning: false, // 二维码正在被扫描
      notifications: [], // 通知消息列表
      notificationsIsLoading: false, // 通知列表正在加载
      lastNotificationId: '', // 通知列表分页显示
      lastCheckNotificationsTime: '' // 最近一次查看通知的时间
    }
  },
  created() {
    var _this = this
    _this.qr_loading = false

    // 获取当前 tab 页面的 URL
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function (tabs) {
      var url = tabs[0].url
      _this.current_url = url
    })

    // 从本地 storage 获取 token 数据
    chrome.storage.local.get(null, function (result) {
      if (result['auth-token'] && result['refresh-token'] && result['access-token']) {
        _this.auth_token = result['auth-token']
        _this.refresh_token = result['refresh-token']
        _this.access_token = result['access-token']
        _this.ui = true
        _this.getNotificationList()

        // 通知 background.js 开始建立 socket 连接
        axios({
          url: 'https://app.jike.ruguoapp.com/app_auth_tokens.refresh',
          method: 'get',
          headers: {
            'x-jike-refresh-token': result['refresh-token']
          }
        })
          .then(response => {
            const data = response.data;
            chrome.storage.local.set({
              'refresh-token': data['x-jike-refresh-token'],
              'access-token': data['x-jike-access-token']
            })
            chrome.runtime.sendMessage({
              logged_in: true
            })
          })
          .catch(() => {
            alert('无法获取未读消息数量')
            return
          })
      } else {
        // 如果 storage 本地没有 token 数据
        // 则重新登录 => 显示二维码供用户扫描
        _this.getUuid()
        _this.ui = true
      }
    })

    // 接收来自 background.js 的 current_url
    // 实时更新 current_url
    chrome.runtime.onMessage.addListener(function (result) {
      if (result.current_url) {
        _this.current_url = result.current_url
      }
    })
  },
  methods: {
    // 二维码生成
    newQRCode(url) {

      // 清空二维码所在 container #qrcode 的标签内容
      // 以避免重复生成二维码
      // 这一方法并不完美, 将来可以改进
      document.getElementById('qrcode').innerHTML = ''
      var qrcode = new QRCode(document.getElementById('qrcode'), {
        text: url,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      })
    },
    // 获取 Session
    getUuid() {
      var _this = this
      _this.qr_scanning = false
      _this.qr_loading = true

      axios.get(_this.url + '/sessions.create')
        .then(function (res) {
          var data = res.data
          _this.qr_loading = false
          _this.uuid = data.uuid
          _this.newQRCode('jike://page.jk/web?url=https%3A%2F%2Fruguoapp.com%2Faccount%2Fscan%3Fuuid%3D' + _this.uuid + '&displayHeader=false&displayFooter=false')
          _this.waitForLogin()
        })
        .catch(function () {
          _this.qr_loading = false
          alert('二维码生成失败')
          return false
        })
    },
    // 等待客户端确认
    waitForLogin() {
      var _this = this

      axios.get(_this.url + '/sessions.wait_for_login', {
        params: {
          uuid: _this.uuid
        }
      })
        .then(function (res) {
          var data = res.data
          if (data && data.logged_in === true) {
            _this.qr_scanning = true
            _this.qr_loading = true
            _this.waitForConfirmation()
          } else {
            _this.getUuid()
          }
        })
        .catch(function () {
          _this.getUuid()
        })
    },
    // 确认登录
    waitForConfirmation() {
      var _this = this

      axios.get(_this.url + '/sessions.wait_for_confirmation', {
        params: {
          uuid: _this.uuid
        }
      })
        .then(function (res) {
          var data = res.data
          _this.qr_loading = false
          _this.qr_scanning = false
          if (data.confirmed === true) {

            // 确认登录后将 token 数据存在本地 storage 中
            _this.auth_token = data.token
            _this.refresh_token = data['x-jike-refresh-token']
            _this.access_token = data['x-jike-access-token']
            chrome.storage.local.set({
              'auth-token': data.token,
              'refresh-token': data['x-jike-refresh-token'],
              'access-token': data['x-jike-access-token']
            })

            // 然后直接刷新通知列表
            _this.getNotificationList()

            // 通知 background.js 开始建立 socket 连接
            chrome.runtime.sendMessage({
              logged_in: true
            })
          } else {
            _this.getUuid()
          }
        })
        .catch(function () {
          alert('无法登录，请手动刷新二维码')
          return false
        })
    },
    // 获取通知列表
    getNotificationList(status) {
      var _this = this
      _this.error = false
      _this.lastCheckNotificationsTime = ''
      _this.notificationsIsLoading = true

      // 判断是滚动加载还是刷新
      // 回传 string === "refresh" 时为刷新
      // 没有回传即首次加载或滚动加载
      if (status === 'refresh') {
        _this.notifications = []
        _this.lastNotificationId = ''
      }

      axios({
        method: 'post',
        url: _this.url + '/1.0/notifications/list',
        data: {
          'loadMoreKey': {
            lastNotificationId: _this.lastNotificationId
          }
        },
        headers: {
          'x-jike-app-auth-jwt': _this.auth_token,
          'app-version': '4.8.0'
        }
      })
        .then(function (response) {
          var res = response.data
          chrome.browserAction.setBadgeText({ text: '' })

          // 获取上次刷新动态的时间
          chrome.storage.local.get(null, function (result) {
            if (result['last-check-notifications-time']) _this.lastCheckNotificationsTime = result['last-check-notifications-time']
            for (var i = 0; i < res.data.length; i++) {
              if ((new Date(res.data[i].updatedAt)).getTime() <= _this.lastCheckNotificationsTime) {
                res.data[i].isViewed = true
              }
              _this.notifications.push(res.data[i])
            }

            // 覆盖新的刷动态时间
            var newTime = (new Date(_this.notifications[0].updatedAt)).getTime()
            chrome.storage.local.set({
              'last-check-notifications-time': newTime
            })
            _this.notificationsIsLoading = false

            // 滚动加载
            var notificationDom = document.getElementById('notification')
            notificationDom.addEventListener('scroll', function () {
              var scrollHeight = notificationDom.scrollHeight
              var scrollTop = notificationDom.scrollTop
              if (scrollHeight - scrollTop < 700 && _this.notificationsIsLoading === false) {
                _this.lastNotificationId = _this.notifications[_this.notifications.length - 1].id
                _this.getNotificationList()
                return false
              }
            })
          })
        })
        .catch(function () {
          _this.notificationsIsLoading = false
          _this.error = true
          return false
        })
    },
    // 时间格式转换
    reformatTime(updateTime) {
      var oldTimestamp = (new Date(updateTime)).getTime()
      var newTimestamp = (new Date().getTime())
      var lastTime = newTimestamp - oldTimestamp
      if (lastTime < 0) {
        return '???'
      } else {
        if (lastTime < 60000) {
          return '刚刚'
        } else if (lastTime >= 60000 && lastTime < 3600000) {
          return Math.round(lastTime / 60000) + '分钟前'
        } else if (lastTime >= 3600000 && lastTime < 86400000) {
          return Math.round(lastTime / 3600000) + '小时前'
        } else if (lastTime >= 86400000 && lastTime < 2592000000) {
          return Math.round(lastTime / 86400000) + '天前'
        } else if (lastTime >= 2592000000 && lastTime < 31104000000) {
          return Math.round(lastTime / 2592000000) + '月前'
        } else if (lastTime >= 31104000000) {
          return Math.round(lastTime / 31104000000) + '年前'
        }
      }
    },
    // 网页登录
    logIn() {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, function (tabs) {
        var url = tabs[0].url

        // 当前页面为即刻官网时即直接登录
        // 否则, 就打开即刻官网并登录
        if (url.indexOf('web.okjike.com') > -1) {
          chrome.tabs.executeScript(null, {
            file: 'scripts/store-token.js'
          })
        } else {
          window.open('https://web.okjike.com')
          chrome.storage.local.set({
            'new-tab-to-login': true
          })
        }
      })
    },
    // 退出登录
    logOut() {
      if (confirm('确认退出吗？') === true) {
        chrome.storage.local.clear()
        chrome.runtime.reload()
      } else {
        return
      }
    }
  }
})