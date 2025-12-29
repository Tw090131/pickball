// app.js
const { wechatLogin, getCurrentUser } = require('./utils/api');

App({
  onLaunch() {
    // 检查登录状态
    this.checkLogin();
    // 获取位置信息
    this.getLocation();
  },

  // 检查登录状态
  async checkLogin() {
    try {
      const token = wx.getStorageSync('token');
      if (token) {
        // 验证token是否有效
        try {
          const res = await getCurrentUser();
          if (res.success && res.data.user) {
            const user = res.data.user;
            // 确保用户信息完整
            const fullUserInfo = {
              id: user.id || user._id,
              nickName: user.nickName || '用户',
              avatarUrl: user.avatarUrl || '',
              phoneNumber: user.phoneNumber || '',
              gender: user.gender || 0,
              level: user.level || 1,
              totalMatches: user.totalMatches || 0,
              totalWins: user.totalWins || 0
            };
            this.globalData.userInfo = fullUserInfo;
            this.globalData.isLoggedIn = true;
            this.globalData.token = token;
          } else {
            // token无效，清除
            this.clearLogin();
          }
        } catch (err) {
          console.warn('验证登录状态失败', err);
          this.clearLogin();
        }
      } else {
        this.globalData.isLoggedIn = false;
        this.globalData.userInfo = null;
      }
    } catch (err) {
      console.error('检查登录状态异常', err);
      this.globalData.isLoggedIn = false;
      this.globalData.userInfo = null;
    }
  },

  // 微信登录
  async doLogin(userInfo) {
    try {
      wx.showLoading({ title: '登录中...' });
      
      // 获取微信登录code
      const loginRes = await new Promise((resolve, reject) => {
        wx.login({
          success: resolve,
          fail: reject
        });
      });

      if (!loginRes.code) {
        throw new Error('获取登录凭证失败');
      }

      // 调用后端登录接口
      const res = await wechatLogin(loginRes.code, userInfo);
      
      if (res.success) {
        // 保存token和用户信息
        wx.setStorageSync('token', res.data.token);
        this.globalData.token = res.data.token;
        this.globalData.userInfo = res.data.user;
        this.globalData.isLoggedIn = true;
        
        wx.hideLoading();
        return {
          success: true,
          user: res.data.user
        };
      } else {
        throw new Error(res.message || '登录失败');
      }
    } catch (err) {
      console.error('登录失败', err);
      wx.hideLoading();
      wx.showToast({
        title: err.message || '登录失败，请重试',
        icon: 'none'
      });
      return {
        success: false,
        message: err.message
      };
    }
  },

  // 清除登录状态
  clearLogin() {
    wx.removeStorageSync('token');
    this.globalData.token = null;
    this.globalData.userInfo = null;
    this.globalData.isLoggedIn = false;
  },

  // 检查是否需要登录
  checkAuth() {
    if (!this.globalData.isLoggedIn) {
      wx.showModal({
        title: '需要登录',
        content: '此功能需要登录后使用',
        confirmText: '去登录',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            wx.switchTab({
              url: '/pages/profile/profile'
            });
          }
        }
      });
      return false;
    }
    return true;
  },

  // 获取位置信息
  getLocation() {
    const that = this;
    try {
      wx.getLocation({
        type: 'gcj02',
        success: res => {
          that.globalData.location = {
            latitude: res.latitude,
            longitude: res.longitude
          };
        },
        fail: err => {
          // 位置获取失败不影响应用使用，只记录日志
          console.warn('获取位置失败', err);
          // 可以提示用户手动授权
        }
      });
    } catch (err) {
      console.error('getLocation 异常', err);
    }
  },

  // 计算距离（使用简化的距离计算）
  calculateDistance(lat1, lon1, lat2, lon2) {
    try {
      // 参数验证
      if (!lat1 || !lon1 || !lat2 || !lon2) {
        return null;
      }
      if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
        return null;
      }
      
      const R = 6371; // 地球半径（公里）
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    } catch (err) {
      console.error('calculateDistance 异常', err);
      return null;
    }
  },

  // 格式化时间
  formatTime(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  },

  // 获取事件状态
  getEventStatus(event) {
    try {
      if (!event || !event.startTime || !event.endTime || !event.registrationDeadline) {
        return '未知';
      }
      
      const now = new Date();
      const startTime = new Date(event.startTime);
      const endTime = new Date(event.endTime);
      const deadline = new Date(event.registrationDeadline);

      // 验证日期有效性
      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime()) || isNaN(deadline.getTime())) {
        return '未知';
      }

      if (now < deadline && event.currentParticipants < event.maxParticipants) {
        return '报名中';
      } else if (now >= startTime && now <= endTime) {
        return '比赛中';
      } else if (now > endTime) {
        return '已结束';
      } else {
        return '报名已满';
      }
    } catch (err) {
      console.error('getEventStatus 异常', err);
      return '未知';
    }
  },

  globalData: {
    userInfo: null,
    location: null,
    events: [], // 临时存储，实际应该从服务器获取
    token: null,
    isLoggedIn: false
  }
});

