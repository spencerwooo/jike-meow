// Google 官方手册访问 https://developer.chrome.com/extensions
// 非官方中文教程访问 https://crxdoc-zh.appspot.com/extensions

'use strict'

new Vue({
  el: '#app',
  data() {
    return {
      ui: false, // 优化 UI 闪烁问题
      url: 'https://app.jike.ruguoapp.com',
      uuid: '',
      token: '',
      access_token: '',
      error: false,
      qr_loading: true,
      qr_scanning: false,
      backgroundIsAllowed: false,
      notifications: [],
      notificationsIsLoading: false,
      lastNotificationId: ''
    }
  },
  created() {
    var _this = this
    _this.qr_loading = false

    // 获取 storage Token 数据
    chrome.storage.local.get(null, function (result) {

      chrome.browserAction.setBadgeText({ text: '' })
      // 判断 Storage 中是否存在 Token 数据
      if (result.token && result['access-token'] && result['refresh-token']) {
        // 刷新 Token
        axios({
          url: _this.url + '/app_auth_tokens.refresh',
          method: 'get',
          headers: {
            'x-jike-refresh-token': result['refresh-token']
          }
        })
          .then(function (response) {
            var res = response.data

            _this.token = result.token
            _this.access_token = res['x-jike-access-token']

            // 在 Storage 中存储 Token
            chrome.storage.local.set({
              'token': result.token,
              'access-token': res['x-jike-access-token'],
              'refresh-token': res['x-jike-refresh-token']
            })
            _this.ui = true
            _this.getNotificationList()
          })
          .catch(function () {
            alert('数据异常')
          })
      } else {
        _this.getUuid()
        _this.ui = true
      }
    })
    // 接收 store-token.js 的判断
    chrome.runtime.onMessage.addListener(function (result) {
      if (!result.access_token) {
        _this.token = ''
        _this.access_token = ''
        chrome.browserAction.setBadgeText({ text: '' })
        _this.getUuid()
      }
    })
  },
  methods: {
    // 生成二维码
    newQRCode(url) {
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
            _this.token = data.token
            _this.access_token = data['x-jike-access-token']
            chrome.storage.local.set({
              'token': data.token,
              'access-token': data['x-jike-access-token'],
              'refresh-token': data['x-jike-refresh-token']
            })
            _this.getNotificationList()
          } else {
            _this.getUuid()
          }
        })
        .catch(function () {
          alert('验证接口请求异常，请手动刷新二维码')
          return false
        })
    },
    // 通知角标
    getNotificationBadge() {
      if (confirm('注意：该功能目前正在实验测试阶段，开启后可能会导致「消息推送失灵」等问题出现，并需要「重新登录」才可关闭，是否确认开启？') === true) {
        chrome.storage.local.get(null, function (result) {
          chrome.runtime.sendMessage({
            token: result.token,
            access_token: result['access-token'],
            refresh_token: result['refresh-token']
          }, null)
        })
      } else {
        return false
      }
    },
    // 获取通知列表
    getNotificationList() {
      var _this = this
      _this.error = false
      _this.notificationsIsLoading = true
      axios({
        method: 'post',
        url: _this.url + '/1.0/notifications/list',
        data: {
          'loadMoreKey': {
            lastNotificationId: _this.lastNotificationId
          }
        },
        headers: {
          'x-jike-app-auth-jwt': _this.token,
          'app-version': '4.8.0'
        }
      })
        .then(function (response) {
          chrome.browserAction.setBadgeText({ text: '' })
          var res = response.data
          for (var i = 0; i < res.data.length; i++) {
            _this.notifications.push(res.data[i])
          }
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
        .catch(function () {
          _this.notificationsIsLoading = false
          _this.error = true
          return false
        })
    },
    // 网页端登录
    logIn() {
      // chrome:// URL 下不执行 Token 部署
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, function (tabs) {
        var url = tabs[0].url
        if (url.indexOf('chrome://') < 0) {
          chrome.tabs.executeScript(null, {
            file: 'scripts/store-token.js'
          })
        }
      })
    },
    // 退出
    logOut() {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, function (tabs) {
        var url = tabs[0].url
        if (url.indexOf('chrome://') < 0) {
          chrome.tabs.executeScript(null, {
            file: 'scripts/log-out.js'
          })
        } else {
          chrome.storage.local.clear()
          chrome.runtime.reload()
        }
      })
    }
  }
})