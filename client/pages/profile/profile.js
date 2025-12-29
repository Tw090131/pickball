// pages/profile/profile.js
const app = getApp();
const { getCurrentUser, bindPhone, getUserRecord } = require('../../utils/api');

Page({
  data: {
    userInfo: null,
    phoneNumber: '',
    registeredCount: 0,
    createdCount: 0,
    isLoggedIn: false,
    hasPhone: false,
    // 战绩数据
    record: {
      totalMatches: 0,
      totalWins: 0,
      totalLosses: 0,
      winRate: 0,
      totalPoints: 0,
      totalGamesWon: 0,
      totalGamesLost: 0,
      netGames: 0,
      totalScore: 0,
      totalAgainstScore: 0,
      netScore: 0,
      recentMatches: []
    },
    loadingRecord: false
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
    if (app.globalData.isLoggedIn) {
      this.loadUserInfo();
      this.loadStatistics();
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    const isLoggedIn = app.globalData.isLoggedIn;
    const userInfo = app.globalData.userInfo;
    
    this.setData({
      isLoggedIn: isLoggedIn,
      userInfo: userInfo || null
    });
    
    if (isLoggedIn) {
      // 如果已有用户信息，直接使用；否则从服务器加载
      if (userInfo) {
        this.setData({
          phoneNumber: userInfo.phoneNumber || '',
          hasPhone: !!userInfo.phoneNumber
        });
      } else {
        this.loadUserInfo();
      }
      this.loadStatistics();
    }
  },

  // 加载用户信息
  async loadUserInfo() {
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
        
        // 更新全局数据
        app.globalData.userInfo = fullUserInfo;
        
        // 更新页面数据
        this.setData({
          userInfo: fullUserInfo,
          phoneNumber: fullUserInfo.phoneNumber || '',
          hasPhone: !!fullUserInfo.phoneNumber
        });
      }
    } catch (err) {
      console.error('加载用户信息失败', err);
      // 如果加载失败，尝试使用全局数据
      if (app.globalData.userInfo) {
        this.setData({
          userInfo: app.globalData.userInfo,
          phoneNumber: app.globalData.userInfo.phoneNumber || '',
          hasPhone: !!app.globalData.userInfo.phoneNumber
        });
      }
    }
  },

  // 加载统计数据
  async loadStatistics() {
    if (!app.globalData.isLoggedIn || !app.globalData.userInfo) {
      return;
    }

    try {
      const userId = app.globalData.userInfo.id || app.globalData.userInfo._id;
      if (!userId) return;

      // 加载战绩数据
      this.setData({ loadingRecord: true });
      try {
        const recordRes = await getUserRecord(userId);
        
        if (recordRes.success && recordRes.data.record) {
          this.setData({
            record: recordRes.data.record
          });
        }
      } catch (err) {
        console.error('加载战绩失败', err);
      } finally {
        this.setData({ loadingRecord: false });
      }

      // 加载统计数据（报名数、发布数等）
      try {
        const { getUserStats } = require('../../utils/api');
        const statsRes = await getUserStats(userId);
        
        if (statsRes.success && statsRes.data.stats) {
          this.setData({
            registeredCount: statsRes.data.stats.registeredCount || 0,
            createdCount: statsRes.data.stats.createdCount || 0
          });
        }
      } catch (err) {
        console.error('加载统计数据失败', err);
      }
    } catch (err) {
      console.error('加载统计数据失败', err);
      this.setData({ loadingRecord: false });
    }
  },

  // 处理登录按钮点击
  handleLogin() {
    console.log('登录按钮被点击');
    
    // 使用 wx.getUserProfile API 获取用户信息
    wx.getUserProfile({
      desc: '用于完善用户资料', // 声明获取用户个人信息后的用途，不超过30个字符
      success: (res) => {
        console.log('getUserProfile 成功', res);
        this.getUserProfile({ detail: res });
      },
      fail: (err) => {
        console.error('getUserProfile 失败', err);
        if (err.errMsg && err.errMsg.includes('cancel')) {
          wx.showToast({
            title: '已取消授权',
            icon: 'none',
            duration: 2000
          });
        } else {
          wx.showToast({
            title: '授权失败，请重试',
            icon: 'none',
            duration: 2000
          });
        }
      }
    });
  },

  // 微信登录授权（处理授权结果）
  async getUserProfile(e) {
    console.log('getUserProfile 被调用', e);
    
    // 兼容两种调用方式：按钮事件和直接调用
    const detail = e.detail || e;
    console.log('授权详情:', detail);
    
    // 检查是否有错误
    if (detail.errMsg && detail.errMsg !== 'getUserProfile:ok') {
      console.error('授权失败', detail.errMsg);
      wx.showToast({
        title: detail.errMsg.includes('cancel') ? '已取消授权' : '授权失败',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    // 检查用户信息
    const userInfo = detail.userInfo;
    if (!userInfo) {
      console.error('未获取到用户信息', detail);
      wx.showToast({
        title: '授权失败，未获取到用户信息',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    try {
      console.log('开始登录，用户信息:', userInfo);
      
      const result = await app.doLogin(userInfo);
      console.log('登录结果:', result);
      
      if (result && result.success) {
        // 确保用户信息完整
        const user = result.user || {};
        
        // 如果后端返回的用户信息不完整，使用授权时的用户信息补充
        const fullUserInfo = {
          ...user,
          nickName: user.nickName || userInfo.nickName || '用户',
          avatarUrl: user.avatarUrl || userInfo.avatarUrl || '',
          phoneNumber: user.phoneNumber || ''
        };
        
        // 更新全局数据
        app.globalData.userInfo = fullUserInfo;
        
        // 更新页面数据
        this.setData({
          isLoggedIn: true,
          userInfo: fullUserInfo,
          phoneNumber: fullUserInfo.phoneNumber || '',
          hasPhone: !!fullUserInfo.phoneNumber
        });
        
        // 加载统计数据
        this.loadStatistics();
        
        wx.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        });
      } else {
        // 登录失败，但 doLogin 已经显示了错误提示
        console.error('登录失败', result);
      }
    } catch (err) {
      console.error('登录过程异常', err);
      wx.showToast({
        title: err.message || '登录失败，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 获取手机号授权
  async getPhoneNumber(e) {
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '需要登录',
        content: '请先完成登录授权',
        showCancel: false
      });
      return;
    }

    if (e.detail.errMsg === 'getPhoneNumber:ok') {
      try {
        wx.showLoading({ title: '绑定中...' });
        
        // 获取新的 code 用于获取 session_key
        const loginRes = await new Promise((resolve, reject) => {
          wx.login({
            success: resolve,
            fail: reject
          });
        });

        if (!loginRes.code) {
          throw new Error('获取授权失败');
        }

        // 调用绑定接口，传递 encryptedData, iv 和 code
        const res = await bindPhone(e.detail.encryptedData, e.detail.iv, loginRes.code);
        
        if (res.success) {
          this.setData({
            phoneNumber: res.data.phoneNumber,
            hasPhone: true
          });
          wx.hideLoading();
          wx.showToast({
            title: '绑定成功',
            icon: 'success'
          });
        } else {
          throw new Error(res.message || '绑定失败');
        }
      } catch (err) {
        console.error('绑定手机号失败', err);
        wx.hideLoading();
        wx.showToast({
          title: err.message || '绑定失败',
          icon: 'none'
        });
      }
    } else {
      wx.showToast({
        title: '取消授权',
        icon: 'none'
      });
    }
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          app.clearLogin();
          this.setData({
            isLoggedIn: false,
            userInfo: null,
            phoneNumber: '',
            hasPhone: false
          });
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          });
        }
      }
    });
  },

  // 跳转到我的活动
  goToMyEvents(e) {
    const type = e.currentTarget.dataset.type;
    
    if (type === 'created') {
      // 跳转到"我发布的"页面
      wx.navigateTo({
        url: '/pages/my-events/my-events?type=created'
      });
    } else if (type === 'registered') {
      // 跳转到"已报名"页面
      wx.navigateTo({
        url: '/pages/my-events/my-events?type=registered'
      });
    } else if (type === 'history') {
      // 跳转到"历史记录"页面
      wx.navigateTo({
        url: '/pages/my-events/my-events?type=history'
      });
    } else {
      wx.showToast({
        title: '功能开发中',
        icon: 'none'
      });
    }
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
  },

  // 头像加载失败处理
  onAvatarError(e) {
    console.warn('头像加载失败', e);
    // 使用默认头像
    if (this.data.userInfo) {
      this.setData({
        'userInfo.avatarUrl': '/images/userDefault.png'
      });
    }
  }
});

