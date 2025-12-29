// pages/register/register.js
const app = getApp();
const { getEventDetail } = require('../../utils/api');

Page({
  data: {
    eventId: null,
    event: {},
    userInfo: null,
    teamMode: 'random', // 'with-partner' 或 'random'
    partnerName: '',
    canSubmit: false,
    submitting: false, // 防止重复提交
    loading: true,
    error: null,
    timers: [] // 保存定时器
  },

  onLoad(options) {
    const id = options.eventId; // 使用字符串 ID
    this.setData({
      eventId: id
    });
    this.loadEvent();
    this.loadUserInfo();
  },

  // 加载赛事信息
  async loadEvent() {
    this.setData({ loading: true, error: null });
    
    try {
      const res = await getEventDetail(this.data.eventId);
      
      if (res && res.success && res.data && res.data.event) {
        const eventData = res.data.event;
        
        // 格式化时间
        const formatDateTime = (dateStr) => {
          if (!dateStr) return '';
          const date = new Date(dateStr);
          const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
          const year = date.getFullYear();
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const day = date.getDate().toString().padStart(2, '0');
          const hour = date.getHours().toString().padStart(2, '0');
          const minute = date.getMinutes().toString().padStart(2, '0');
          const weekday = weekdays[date.getDay()];
          return `${year}/${month}/${day} ( ${weekday} ) ${hour}:${minute}`;
        };

        // 处理报名费显示
        let feeText = '免费';
        let feeModeText = '';
        let needPayment = false; // 是否需要支付
        
        if (eventData.feeMode === 'free') {
          feeText = '免费';
          feeModeText = '活动完全免费';
          needPayment = false;
        } else if (eventData.feeMode === 'aa') {
          feeText = '赛后AA';
          feeModeText = '活动结束后AA平摊场地费用';
          needPayment = false;
        } else if (eventData.feeMode === 'prepay') {
          feeText = `¥${eventData.registrationFee || 0}`;
          feeModeText = '报名时需先支付费用';
          needPayment = true;
        } else {
          // 兼容旧数据：如果没有 feeMode，根据 registrationFee 判断
          if (eventData.registrationFee > 0) {
            feeText = `¥${eventData.registrationFee}`;
            feeModeText = '报名时需先支付费用';
            needPayment = true;
          } else {
            feeText = '免费';
            feeModeText = '活动完全免费';
            needPayment = false;
          }
        }

        this.setData({
          event: {
            id: eventData.id || eventData._id,
            title: eventData.title,
            startTime: formatDateTime(eventData.startTime),
            location: eventData.location,
            format: eventData.format?.type || '未知',
            registrationFee: eventData.registrationFee || 0,
            feeMode: eventData.feeMode || 'free',
            feeText: feeText,
            feeModeText: feeModeText,
            needPayment: needPayment
          },
          loading: false
        });
      } else {
        throw new Error(res?.message || '获取活动信息失败');
      }
    } catch (err) {
      console.error('加载活动信息失败', err);
      this.setData({
        loading: false,
        error: err.message || '加载失败，请稍后重试'
      });
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
        duration: 2000
      });
    }
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

    // 如果需要支付（仅赛前收款需要支付）
    if (this.data.event.needPayment) {
      this.payRegistration();
    } else {
      // 免费参与或赛后AA，直接报名
      this.submitRegistrationRequest();
    }
  },

  // 支付报名费
  async payRegistration() {
    if (this.data.submitting) {
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '处理中...' });

    try {
      // 先创建报名记录（状态为待支付）
      const { registerEvent } = require('../../utils/api');
      
      const registrationData = {
        eventId: this.data.eventId,
        teamMode: this.data.teamMode,
        partnerName: this.data.teamMode === 'with-partner' ? this.data.partnerName.trim() : null
      };

      const registerRes = await registerEvent(registrationData);
      
      if (!registerRes || !registerRes.success) {
        throw new Error(registerRes?.message || '创建报名记录失败');
      }

      const registrationId = registerRes.data?.registration?._id || registerRes.data?.registration?.id;
      
      if (!registrationId) {
        throw new Error('获取报名记录ID失败');
      }

      // 创建支付订单
      const { createPayment } = require('../../utils/api');
      const paymentRes = await createPayment({ registrationId });
      
      if (!paymentRes || !paymentRes.success) {
        throw new Error(paymentRes?.message || '创建支付订单失败');
      }

      const paymentParams = paymentRes.data?.paymentParams;
      
      if (!paymentParams) {
        throw new Error('获取支付参数失败');
      }

      wx.hideLoading();

      // 调用微信支付
      wx.requestPayment({
        timeStamp: paymentParams.timeStamp,
        nonceStr: paymentParams.nonceStr,
        package: paymentParams.package,
        signType: paymentParams.signType || 'MD5',
        paySign: paymentParams.paySign,
        success: (res) => {
          wx.showToast({
            title: '支付成功',
            icon: 'success',
            duration: 2000
          });
          
          setTimeout(() => {
            wx.navigateBack();
          }, 2000);
        },
        fail: (err) => {
          console.error('支付失败', err);
          this.setData({ submitting: false });
          wx.showToast({
            title: err.errMsg || '支付失败',
            icon: 'none',
            duration: 2000
          });
        }
      });
    } catch (err) {
      console.error('支付流程异常', err);
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({
        title: err.message || '支付异常，请重试',
        icon: 'none',
        duration: 2000
      });
    }
  },

  // 提交报名请求
  async submitRegistrationRequest() {
    this.setData({ submitting: true });
    wx.showLoading({ title: '报名中...' });

    try {
      const { registerEvent } = require('../../utils/api');
      
      const registrationData = {
        eventId: this.data.eventId,
        teamMode: this.data.teamMode,
        partnerName: this.data.teamMode === 'with-partner' ? this.data.partnerName.trim() : null
      };

      const res = await registerEvent(registrationData);
      
      wx.hideLoading();
      
      if (res && res.success) {
        wx.showToast({
          title: '报名成功',
          icon: 'success',
          duration: 2000
        });

        setTimeout(() => {
          wx.navigateBack({
            fail: (err) => {
              console.error('返回失败', err);
              this.setData({ submitting: false });
            }
          });
        }, 2000);
      } else {
        throw new Error(res?.message || '报名失败');
      }
    } catch (err) {
      console.error('提交报名失败', err);
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({
        title: err.message || '报名失败，请重试',
        icon: 'none',
        duration: 2000
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

