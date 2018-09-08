// 本插件使用的都是入门级 Chrome extension API
// Google 官方手册访问 https://developer.chrome.com/extensions
// 非官方中文教程访问 https://crxdoc-zh.appspot.com/extensions

'use strict'

var VueQrcode = window.VueQrcode
Vue.component('qrcode', VueQrcode)

new Vue({
  el: '#app',
  data() {
    return {
      url: 'https://app.jike.ruguoapp.com',
      uuid: '',
      token: '',
      qr: '',
      qr_loading: true
    }
  },
  created() {
    var _this = this
    _this.qr = 'http://t.cn/RsK7PgI'
    _this.qr_loading = false
    chrome.tabs.executeScript(null, {
      file: 'scripts/detect-token.js'
    })
    // script callback
    chrome.runtime.onMessage.addListener(
      function (request, sender, sendResponse) {
        if (request.token) {
          _this.token = request.token
        } else {
          _this.getUuid()
        }
      })
  },
  methods: {
    getUuid() {
      var _this = this
      _this.qr_loading = true
      axios.get(_this.url + '/sessions.create')
        .then(function (res) {
          var data = res.data
          _this.qr_loading = false
          _this.uuid = data.uuid
          _this.qr = 'jike://page.jk/web?url=https%3A%2F%2Fruguoapp.com%2Faccount%2Fscan%3Fuuid%3D' + _this.uuid + '&displayHeader=false&displayFooter=false'
          _this.waitForLogin()
        })
        .catch(function () {
          _this.qr_loading = false
          return false
        })
    },
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
            _this.waitForConfirmation()
          } else {
            _this.getUuid()
          }
        })
        .catch(function () {
          _this.getUuid()
        })
    },
    waitForConfirmation() {
      var _this = this
      axios.get(_this.url + '/sessions.wait_for_confirmation', {
        params: {
          uuid: _this.uuid
        }
      })
        .then(function (res) {
          var data = res.data
          if (data.confirmed === true) {
            _this.qr = 'http://t.cn/RsK7PgI'
            // 在 Storage 中存储 Token 传递给 store-token.js
            chrome.storage.local.set({
              'token': data.token,
              'access-token': data['x-jike-access-token'],
              'refresh-token': data['x-jike-refresh-token']
            })
            chrome.tabs.executeScript(null, {
              file: 'scripts/store-token.js'
            })
          } else {
            _this.getUuid()
          }
        })
        .catch(function () {
          alert('验证接口请求异常，请手动刷新二维码')
          return false
        })
    },
    logOut() {
      chrome.tabs.executeScript(null, {
        file: 'scripts/log-out.js'
      })
    }
  }
})