// pages/register/register.js
const app = getApp();

Page({
  data: {
    eventId: null,
    event: {},
    userInfo: null,
    teamMode: 'random', // 'with-partner' 或 'random'
    partnerName: '',
    canSubmit: false,
    submitting: false, // 防止重复提交
    timers: [] // 保存定时器
  },

  onLoad(options) {
    const id = parseInt(options.eventId);
    this.setData({
      eventId: id
    });
    this.loadEvent();
    this.loadUserInfo();
  },

  // 加载赛事信息
  loadEvent() {
    // 模拟数据，实际应该从服务器获取
    const mockEvent = {
      id: this.data.eventId,
      title: '周末匹克球友谊赛',
      startTime: app.formatTime(new Date()),
      location: '市体育馆',
      format: '双打',
      registrationFee: 50
    };
    this.setData({
      event: mockEvent
    });
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = app.globalData.userInfo;
    if (userInfo) {
      this.setData({
        userInfo: userInfo,
        canSubmit: true
      });
    } else {
      // 尝试获取用户信息
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          app.globalData.userInfo = res.userInfo;
          this.setData({
            userInfo: res.userInfo,
            canSubmit: true
          });
        }
      });
    }
  },

  // 获取手机号
  getPhoneNumber(e) {
    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      // 实际应该将 code 发送到服务器换取手机号
      wx.showToast({
        title: '授权成功',
        icon: 'success'
      });
      this.setData({
        canSubmit: true
      });
    } else {
      wx.showToast({
        title: '授权失败',
        icon: 'none'
      });
    }
  },

  // 组队方式变化
  onTeamModeChange(e) {
    this.setData({
      teamMode: e.detail.value,
      partnerName: ''
    });
  },

  // 搭档输入
  onPartnerInput(e) {
    this.setData({
      partnerName: e.detail.value
    });
  },

  // 验证表单
  validateForm() {
    if (!this.data.userInfo) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return false;
    }

    if (this.data.teamMode === 'with-partner' && !this.data.partnerName.trim()) {
      wx.showToast({ title: '请输入搭档信息', icon: 'none' });
      return false;
    }

    return true;
  },

  // 提交报名
  submitRegistration() {
    // 防止重复提交
    if (this.data.submitting) {
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    // 如果需要支付
    if (this.data.event.registrationFee > 0) {
      this.payRegistration();
    } else {
      this.submitRegistrationRequest();
    }
  },

  // 支付报名费
  payRegistration() {
    if (this.data.submitting) {
      return;
    }

    wx.showLoading({ title: '支付中...' });

    try {
      // 模拟支付流程
      // 实际应该调用 wx.requestPayment
      const timer = setTimeout(() => {
        wx.hideLoading();
        // 模拟支付成功
        // 实际应该从服务器获取支付参数
        wx.requestPayment({
          timeStamp: '',
          nonceStr: '',
          package: '',
          signType: 'MD5',
          paySign: '',
          success: (res) => {
            this.submitRegistrationRequest();
          },
          fail: (err) => {
            console.error('支付失败', err);
            this.setData({ submitting: false });
            wx.showToast({
              title: err.errMsg || '支付失败',
              icon: 'none'
            });
          }
        });
      }, 500);
      this.data.timers.push(timer);
    } catch (err) {
      console.error('支付异常', err);
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({
        title: '支付异常，请重试',
        icon: 'none'
      });
    }
  },

  // 提交报名请求
  submitRegistrationRequest() {
    this.setData({ submitting: true });
    wx.showLoading({ title: '报名中...' });

    try {
      const registrationData = {
        eventId: this.data.eventId,
        userId: this.data.userInfo.id || 'user_' + Date.now(),
        teamMode: this.data.teamMode,
        partnerName: this.data.teamMode === 'with-partner' ? this.data.partnerName : null
      };

      // 模拟API调用
      const timer1 = setTimeout(() => {
        wx.hideLoading();
        wx.showToast({
          title: '报名成功',
          icon: 'success',
          duration: 2000
        });

        const timer2 = setTimeout(() => {
          wx.navigateBack({
            fail: (err) => {
              console.error('返回失败', err);
              this.setData({ submitting: false });
            }
          });
        }, 2000);
        this.data.timers.push(timer2);
      }, 1500);
      this.data.timers.push(timer1);
    } catch (err) {
      console.error('提交报名失败', err);
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({
        title: '报名失败，请重试',
        icon: 'none'
      });
    }
  },

  // 页面卸载时清理定时器
  onUnload() {
    this.data.timers.forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    this.setData({ timers: [] });
  }
});

