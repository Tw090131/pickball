// pages/profile/profile.js
const app = getApp();

Page({
  data: {
    userInfo: null,
    phoneNumber: '',
    registeredCount: 0,
    createdCount: 0
  },

  onLoad() {
    this.loadUserInfo();
    this.loadStatistics();
  },

  onShow() {
    this.loadUserInfo();
    this.loadStatistics();
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = app.globalData.userInfo;
    this.setData({
      userInfo: userInfo
    });
  },

  // 加载统计数据
  loadStatistics() {
    // 模拟数据，实际应该从服务器获取
    this.setData({
      registeredCount: 3,
      createdCount: 2
    });
  },

  // 获取用户信息
  getUserProfile(e) {
    if (e.detail.userInfo) {
      app.globalData.userInfo = e.detail.userInfo;
      this.setData({
        userInfo: e.detail.userInfo
      });
    }
  },

  // 跳转到我的活动
  goToMyEvents(e) {
    const type = e.currentTarget.dataset.type;
    wx.showToast({
      title: `${type === 'registered' ? '已报名' : type === 'created' ? '我发布的' : '历史记录'}功能开发中`,
      icon: 'none'
    });
  },

  // 显示关于我们
  showAbout() {
    wx.showModal({
      title: '关于匹克球助手',
      content: '匹克球助手是一款专为匹克球爱好者打造的小程序，提供赛事发布、报名、计分、排名等功能。',
      showCancel: false
    });
  },

  // 显示意见反馈
  showFeedback() {
    wx.showToast({
      title: '意见反馈功能开发中',
      icon: 'none'
    });
  }
});

