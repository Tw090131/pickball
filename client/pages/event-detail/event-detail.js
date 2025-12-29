// pages/event-detail/event-detail.js
const app = getApp();
const { getEventDetail, startEvent: startEventAPI } = require('../../utils/api');

Page({
  data: {
    eventId: null,
    event: {},
    participants: [],
    isRegistered: false,
    loading: true,
    error: null
  },

  onLoad(options) {
    const id = options.id;
    this.setData({
      eventId: id
    });
    this.loadEventDetail();
  },

  // 加载赛事详情
  async loadEventDetail() {
    this.setData({ loading: true, error: null });
    
    try {
      const res = await getEventDetail(this.data.eventId);
      
      if (res && res.success && res.data && res.data.event) {
        const eventData = res.data.event;
        
        // 计算距离
        const distance = app.globalData.location 
          ? app.calculateDistance(
              app.globalData.location.latitude,
              app.globalData.location.longitude,
              eventData.latitude,
              eventData.longitude
            )
          : null;

        // 处理状态
        let status = '报名中';
        let statusClass = 'tag-primary';
        if (eventData.status === 'registering') {
          status = '报名中';
          statusClass = 'tag-primary';
        } else if (eventData.status === 'in_progress') {
          status = '比赛中';
          statusClass = 'tag-warning';
        } else if (eventData.status === 'ended') {
          status = '已结束';
          statusClass = 'tag-danger';
        } else if (eventData.status === 'cancelled') {
          status = '已取消';
          statusClass = 'tag-default';
        }

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
        if (eventData.feeMode === 'free') {
          feeText = '免费';
          feeModeText = '活动完全免费';
        } else if (eventData.feeMode === 'aa') {
          feeText = '赛后AA';
          feeModeText = '活动结束后AA平摊场地费用';
        } else if (eventData.feeMode === 'prepay') {
          feeText = `¥${eventData.registrationFee || 0}`;
          feeModeText = '报名时需先支付费用';
        } else {
          // 兼容旧数据：如果没有 feeMode，根据 registrationFee 判断
          if (eventData.registrationFee > 0) {
            feeText = `¥${eventData.registrationFee}`;
            feeModeText = '报名时需先支付费用';
          } else {
            feeText = '免费';
            feeModeText = '活动完全免费';
          }
        }

        this.setData({
          event: {
            id: eventData.id || eventData._id,
            title: eventData.title,
            category: eventData.category,
            startTime: formatDateTime(eventData.startTime),
            endTime: formatDateTime(eventData.endTime),
            registrationDeadline: formatDateTime(eventData.registrationDeadline),
            location: eventData.location,
            latitude: eventData.latitude,
            longitude: eventData.longitude,
            distance: distance ? distance.toFixed(1) : null,
            format: eventData.format?.type || '未知',
            scoringSystem: eventData.scoringSystem || 11,
            rotationRule: eventData.rotationRule || '未知',
            maxParticipants: eventData.maxParticipants || 0,
            currentParticipants: eventData.currentParticipants || 0,
            registrationFee: eventData.registrationFee || 0,
            feeMode: eventData.feeMode || 'free',
            feeText: feeText,
            feeModeText: feeModeText,
            organizer: eventData.organizer?.name || eventData.organizerName || '未知组织',
            organizerId: eventData.organizer?._id || eventData.organizer?.id || eventData.organizer,
            organizerAvatar: eventData.organizer?.avatar || eventData.organizerAvatar || '',
            description: eventData.description || '',
            status,
            statusClass,
            isOrganizer: app.globalData.userInfo && (
              (eventData.organizer?._id || eventData.organizer?.id || eventData.organizer)?.toString() === 
              (app.globalData.userInfo.id || app.globalData.userInfo._id)?.toString()
            ),
            canStart: status === '报名中' && 
                     eventData.currentParticipants >= 4 && 
                     app.globalData.userInfo && (
                       (eventData.organizer?._id || eventData.organizer?.id || eventData.organizer)?.toString() === 
                       (app.globalData.userInfo.id || app.globalData.userInfo._id)?.toString()
                     )
          },
          participants: [], // TODO: 从服务器获取报名人员列表
          isRegistered: false, // TODO: 检查当前用户是否已报名
          loading: false
        });
      } else {
        throw new Error(res?.message || '获取活动详情失败');
      }
    } catch (err) {
      console.error('加载活动详情失败', err);
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

  // 模拟赛事数据
  getMockEvent(id) {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return {
      id: id,
      title: '周末匹克球友谊赛',
      category: 'competition',
      startTime: app.formatTime(tomorrow),
      endTime: app.formatTime(new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000)),
      registrationDeadline: app.formatTime(new Date(tomorrow.getTime() - 2 * 60 * 60 * 1000)),
      location: '市体育馆',
      latitude: 39.9042,
      longitude: 116.4074,
      format: '双打',
      scoringSystem: 11,
      rotationRule: '八人转',
      maxParticipants: 8,
      currentParticipants: 5,
      registrationFee: 50,
      organizer: '匹克球俱乐部',
      description: '欢迎所有匹克球爱好者参加！本次比赛采用双打形式，八人轮转制，11分制。请准时到达场地，自备球拍。'
    };
  },

  // 模拟报名人员
  getMockParticipants() {
    return [
      { id: 1, nickName: '张三', avatarUrl: '/images/default-avatar.png', partnerName: '李四' },
      { id: 2, nickName: '李四', avatarUrl: '/images/default-avatar.png', partnerName: '张三' },
      { id: 3, nickName: '王五', avatarUrl: '/images/default-avatar.png', partnerName: null },
      { id: 4, nickName: '赵六', avatarUrl: '/images/default-avatar.png', partnerName: null },
      { id: 5, nickName: '钱七', avatarUrl: '/images/default-avatar.png', partnerName: null }
    ];
  },

  // 跳转到报名页
  goToRegister() {
    wx.navigateTo({
      url: `/pages/register/register?eventId=${this.data.eventId}`
    });
  },

  // 跳转到计分板
  goToScoreboard() {
    wx.navigateTo({
      url: `/pages/scoreboard/scoreboard?eventId=${this.data.eventId}`
    });
  },

  // 跳转到排名
  goToRanking() {
    wx.navigateTo({
      url: `/pages/ranking/ranking?eventId=${this.data.eventId}`
    });
  },

  // 跳转到晋级图
  goToBracket() {
    wx.navigateTo({
      url: `/pages/bracket/bracket?eventId=${this.data.eventId}`
    });
  },

  // 开始比赛
  async startEvent() {
    const event = this.data.event;
    
    if (!event.canStart) {
      wx.showToast({
        title: '无法开始比赛',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.showModal({
      title: '确认开始比赛',
      content: `确定要开始比赛吗？系统将自动生成对战组，比赛将进入进行中状态。`,
      confirmText: '开始',
      confirmColor: '#4CAF50',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '生成对战组中...', mask: true });
            
            const result = await startEventAPI(event.id);
            
            wx.hideLoading();
            
            if (result && result.success) {
              wx.showToast({
                title: '比赛已开始',
                icon: 'success',
                duration: 2000
              });
              
              // 刷新活动详情
              setTimeout(() => {
                this.loadEventDetail();
              }, 1000);
            } else {
              throw new Error(result?.message || '开始比赛失败');
            }
          } catch (err) {
            console.error('开始比赛失败', err);
            wx.hideLoading();
            wx.showModal({
              title: '开始比赛失败',
              content: err.message || '请稍后重试',
              showCancel: false,
              confirmText: '知道了'
            });
          }
        }
      }
    });
  }
});

