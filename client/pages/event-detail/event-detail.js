// pages/event-detail/event-detail.js
const app = getApp();

Page({
  data: {
    eventId: null,
    event: {},
    participants: [],
    isRegistered: false
  },

  onLoad(options) {
    const id = parseInt(options.id);
    this.setData({
      eventId: id
    });
    this.loadEventDetail();
  },

  // 加载赛事详情
  loadEventDetail() {
    // 模拟数据，实际应该从服务器获取
    const mockEvent = this.getMockEvent(this.data.eventId);
    
    const distance = app.globalData.location 
      ? app.calculateDistance(
          app.globalData.location.latitude,
          app.globalData.location.longitude,
          mockEvent.latitude,
          mockEvent.longitude
        )
      : null;

    const status = app.getEventStatus(mockEvent);
    let statusClass = 'tag-default';
    if (status === '报名中') statusClass = 'tag-primary';
    else if (status === '比赛中') statusClass = 'tag-warning';
    else if (status === '已结束') statusClass = 'tag-danger';

    this.setData({
      event: {
        ...mockEvent,
        distance: distance ? distance.toFixed(1) : null,
        status,
        statusClass
      },
      participants: this.getMockParticipants(),
      isRegistered: false // 实际应该检查当前用户是否已报名
    });
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
  }
});

