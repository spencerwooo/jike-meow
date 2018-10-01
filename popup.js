// Google 官方手册访问 https://developer.chrome.com/extensions
// 非官方中文教程访问 https://crxdoc-zh.appspot.com/extensions

/*
auth token, 用来获取通知列表
refresh token, 可以换取新的 token
access token, Socket 和其它功能
*/

'use strict'

new Vue({
  el: '#app',
  data() {
    return {
      isUIEnabled: false, // 优化 UI 闪烁问题
      apiURL: 'https://app.jike.ruguoapp.com',
      currentPageURL: '',
      uuid: '',
      authToken: '',
      refreshToken: '',
      accessToken: '',
      isError: false, // 通知列表加载失败
      isQrCodeLoading: true,
      isQrCodeScanning: false,
      notifications: [], // 通知消息列表
      isNotificationLoading: false,
      lastCheckedNotificationId: '', // 通知列表分页显示
      isNotificationCheckingFunctionEnabled: true, // 历史位置记录功能状态
      lastNotificationCheckingTime: '' // 最近一次查看通知的时间
    }
  },
  created() {
    let _this = this;
    _this.isQrCodeLoading = false;

    // 获取当前 tab 页面的 URL
    chrome.tabs.query({
      active: true,
      currentWindow: true
    }, function (tabs) {
      _this.currentPageURL = tabs[0].url;
    });

    // 从本地 storage 获取 token 数据
    chrome.storage.local.get(null, function (result) {
      if (result['auth-token'] && result['refresh-token'] && result['access-token']) {
        _this.authToken = result['auth-token'];
        _this.refreshToken = result['refresh-token'];
        _this.accessToken = result['access-token'];
        _this.isUIEnabled = true;
        _this.getNotificationList();

        // 通知 background.js 开始建立 socket 连接
        axios({
          url: _this.apiURL + '/app_auth_tokens.refresh',
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
            });
            chrome.runtime.sendMessage({
              logged_in: true
            });
          })
          .catch(() => {
            alert('无法获取未读消息数量');
            return;
          });
      } else {
        // 如果 storage 本地没有 token 数据
        // 则重新登录 => 显示二维码供用户扫描
        _this.getUuid();
        _this.isUIEnabled = true;
      }
    });

    // 接收来自 background.js 的 current_url
    // 实时更新 current_url
    chrome.runtime.onMessage.addListener(function (result) {
      if (result.current_url) {
        _this.currentPageURL = result.current_url;
      }
    });
  },
  methods: {
    // 二维码生成
    newQRCode(url) {
      // 清空二维码所在 container #qrcode 的标签内容
      // 以避免重复生成二维码
      // 这一方法并不完美, 将来可以改进
      document.getElementById('qrcode').innerHTML = '';
      let qrcode = new QRCode(document.getElementById('qrcode'), {
        text: url,
        width: 200,
        height: 200,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
    },
    // 获取 Session
    getUuid() {
      let _this = this;
      _this.isQrCodeScanning = false;
      _this.isQrCodeLoading = true;

      axios.get(_this.apiURL + '/sessions.create')
        .then(function (res) {
          _this.isQrCodeLoading = false;
          _this.uuid = res.data.uuid;
          _this.newQRCode('jike://page.jk/web?url=https%3A%2F%2Fruguoapp.com%2Faccount%2Fscan%3Fuuid%3D' + _this.uuid + '&displayHeader=false&displayFooter=false');
          _this.waitForLogin();
        })
        .catch(function () {
          _this.isQrCodeLoading = false;
          alert('二维码生成失败');
          return;
        });
    },
    // 等待客户端确认
    waitForLogin() {
      let _this = this;

      axios.get(_this.apiURL + '/sessions.wait_for_login', {
        params: {
          uuid: _this.uuid
        }
      })
        .then(function (res) {
          const data = res.data;
          if (data && data.logged_in === true) {
            _this.isQrCodeScanning = true;
            _this.isQrCodeLoading = true;
            _this.waitForConfirmation();
          } else {
            _this.getUuid();
          }
        })
        .catch(function () {
          _this.getUuid();
        });
    },
    // 确认登录
    waitForConfirmation() {
      let _this = this;

      axios.get(_this.apiURL + '/sessions.wait_for_confirmation', {
        params: {
          uuid: _this.uuid
        }
      })
        .then(function (res) {
          const data = res.data;
          _this.isQrCodeLoading = false;
          _this.isQrCodeScanning = false;
          if (data.confirmed === true) {

            // 确认登录后将 token 数据存在本地 storage 中
            _this.authToken = data.token;
            _this.refreshToken = data['x-jike-refresh-token'];
            _this.accessToken = data['x-jike-access-token'];
            chrome.storage.local.set({
              'auth-token': data.token,
              'refresh-token': data['x-jike-refresh-token'],
              'access-token': data['x-jike-access-token']
            });

            // 然后直接刷新通知列表
            _this.getNotificationList();

            // 通知 background.js 开始建立 socket 连接
            chrome.runtime.sendMessage({
              logged_in: true
            });
          } else {
            _this.getUuid();
          }
        })
        .catch(function () {
          alert('无法登录，请手动刷新二维码');
          return;
        })
    },
    // 获取通知列表
    getNotificationList(status) {
      let _this = this;
      _this.isError = false;
      _this.lastNotificationCheckingTime = '';
      _this.isNotificationLoading = true;

      // 判断是滚动加载还是刷新
      // 回传 string === "refresh" 时为刷新
      // 没有回传即首次加载或滚动加载
      if (status === 'refresh') {
        _this.notifications = [];
        _this.lastCheckedNotificationId = '';
      }

      axios({
        method: 'post',
        url: _this.apiURL + '/1.0/notifications/list',
        data: {
          'loadMoreKey': {
            lastNotificationId: _this.lastCheckedNotificationId
          }
        },
        headers: {
          'x-jike-app-auth-jwt': _this.authToken,
          'app-version': '4.8.0'
        }
      })
        .then(function (response) {
          const res = response.data;
          chrome.browserAction.setBadgeText({ text: '' });

          // 获取上次刷新动态的时间
          chrome.storage.local.get(null, function (result) {
            if (result['last-check-notifications-time']) _this.lastNotificationCheckingTime = result['last-check-notifications-time'];
            for (var i = 0; i < res.data.length; i++) {
              if ((new Date(res.data[i].updatedAt)).getTime() <= _this.lastNotificationCheckingTime) {
                res.data[i].isViewed = true;
              }
              _this.notifications.push(res.data[i]);
            }

            // 覆盖新的刷动态时间
            var newTime = (new Date(_this.notifications[0].updatedAt)).getTime();
            chrome.storage.local.set({
              'last-check-notifications-time': newTime
            });
            _this.isNotificationLoading = false;

            // 滚动加载
            var notificationDom = document.getElementById('notification');
            notificationDom.addEventListener('scroll', function () {
              var scrollHeight = notificationDom.scrollHeight;
              var scrollTop = notificationDom.scrollTop;
              if (scrollHeight - scrollTop < 700 && _this.isNotificationLoading === false) {
                _this.lastCheckedNotificationId = _this.notifications[_this.notifications.length - 1].id;
                _this.getNotificationList();
                return;
              }
            })
          });
        })
        .catch(function () {
          _this.isNotificationLoading = false;
          _this.isError = true;
          return;
        });
    },
    // 时间格式转换
    reformatTime(updateTime) {
      const oldTimestamp = (new Date(updateTime)).getTime(),
        newTimestamp = (new Date().getTime()),
        lastTime = newTimestamp - oldTimestamp;
      if (lastTime < 0) {
        return '???';
      } else {
        if (lastTime < 60000) {
          return '刚刚'
        } else if (lastTime >= 60000 && lastTime < 3600000) {
          return Math.round(lastTime / 60000) + '分钟前';
        } else if (lastTime >= 3600000 && lastTime < 86400000) {
          return Math.round(lastTime / 3600000) + '小时前';
        } else if (lastTime >= 86400000 && lastTime < 2592000000) {
          return Math.round(lastTime / 86400000) + '天前';
        } else if (lastTime >= 2592000000 && lastTime < 31104000000) {
          return Math.round(lastTime / 2592000000) + '月前';
        } else if (lastTime >= 31104000000) {
          return Math.round(lastTime / 31104000000) + '年前';
        }
      }
    },
    // 网页登录
    logIn() {
      chrome.tabs.query({
        active: true,
        currentWindow: true
      }, function (tabs) {
        // 当前页面为即刻官网时即直接登录
        // 否则, 就打开即刻官网并登录
        if (tabs[0].url.indexOf('web.okjike.com') > -1) {
          chrome.tabs.executeScript(null, {
            file: 'scripts/store-token.js'
          });
        } else {
          window.open('https://web.okjike.com');
          chrome.storage.local.set({
            'new-tab-to-login': true
          });
        }
      });
    },
    // 退出登录
    logOut() {
      if (confirm('确认退出吗？') === true) {
        chrome.storage.local.clear();
        chrome.runtime.reload();
      } else {
        return;
      }
    }
  }
});