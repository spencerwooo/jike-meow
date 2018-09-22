// Google 官方手册访问 https://developer.chrome.com/extensions
// 非官方中文教程访问 https://crxdoc-zh.appspot.com/extensions

'use strict'

new Vue({
  el: '#app',
  data() {
    return {
      ui: false, // 优化 UI 闪烁问题
      url: 'https://app.jike.ruguoapp.com', // 接口统一地址
      current_url: '', // 当前页面 URL
      uuid: '', // 用于生成供扫描的二维码
      token: '', // auth-token
      access_token: '', // access-token
      error: false, // 通知列表加载失败
      qr_loading: true, // 二维码是否正在加载
      qr_scanning: false, // 二维码是否正在被扫描
      backgroundIsAllowed: false, // 后台获取未读消息数量
      notifications: [], // 通知消息列表
      notificationsIsLoading: false, // 通知列表正在加载
      lastNotificationId: '' // 通知列表分页显示
    }
  },
  created() {
    var _this = this
    _this.qr_loading = false

    // 优先获取当前 tab 页面的 URL
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function (tabs) {
      var url = tabs[0].url
      _this.current_url = url
    })

    // 再从 extension 本地 storage 获取详细 token 数据
    chrome.storage.local.get(null, function (result) {

      // 判断 Storage 中是否存在 token 数据
      if (result.token && result['access-token'] && result['refresh-token']) {
        // 通过上传旧的 refresh token 来获取新的 access token 和 refresh token
        // 官网的方案是每十分钟刷新一次
        // 这一行为已放在 background.js 中处理
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

            // 在 chrome 本地 storage 中存储 token
            chrome.storage.local.set({
              'token': result.token,
              'access-token': res['x-jike-access-token'],
              'refresh-token': res['x-jike-refresh-token']
            })

            // 加载 UI
            _this.ui = true

            // 异步获取通知列表
            _this.getNotificationList()
          })
          .catch(function () {
            alert('数据异常')
          })
      } else {

        // 如果 storage 本地没有 token 数据
        // 则重新登录 => 显示二维码供用户扫描
        _this.getUuid()
        _this.ui = true
      }
    })

    // 接收 store-token.js 回传
    // 仅用于作登出处理
    chrome.runtime.onMessage.addListener(function (result) {
      if (!result.access_token) {
        chrome.runtime.reload()
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
            _this.token = data.token
            _this.access_token = data['x-jike-access-token']
            chrome.storage.local.set({
              'token': data.token,
              'access-token': data['x-jike-access-token'],
              'refresh-token': data['x-jike-refresh-token']
            })

            // 然后直接刷新通知列表
            _this.getNotificationList()
          } else {
            _this.getUuid()
          }
        })
        .catch(function () {
          alert('无法登录，请手动刷新二维码')
          return false
        })
    },
    // 刷新通知角标
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

          // 获取数据后需将角标归零
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
    // 网页登录
    logIn() {
      // chrome:// 和 file:// URL 下不执行 token 的部署
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, function (tabs) {
        var url = tabs[0].url
        if (url.indexOf('chrome://') < 0 &&
          url.indexOf('file://') < 0) {
          chrome.tabs.executeScript(null, {
            file: 'scripts/store-token.js'
          })
        }
      })
    },
    // 登出
    logOut() {
      // chrome:// 和 file:// URL 下不执行 token 移除
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, function (tabs) {
        var url = tabs[0].url
        if (url.indexOf('chrome://') < 0 ||
          url.indexOf('file://') < 0) {
          chrome.tabs.executeScript(null, {
            file: 'scripts/log-out.js'
          })
        } else {
          // 清空本地 storage token 数据, 并重新加载 extension
          chrome.storage.local.clear()
          chrome.runtime.reload()
        }
      })
    }
  }
})