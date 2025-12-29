// pages/my-events/my-events.js
const app = getApp();
const { getMyCreatedEvents, getMyRegistrations, baseURL } = require('../../utils/api');
const { request } = require('../../utils/util');

Page({
  data: {
    type: 'created', // created: 我发布的, registered: 已报名, history: 历史记录
    events: [],
    loading: false,
    error: null,
    emptyText: '暂无数据'
  },

  onLoad(options) {
    const type = options.type || 'created';
    this.setData({ type });
    
    // 设置页面标题
    const titles = {
      'created': '我发布的',
      'registered': '已报名',
      'history': '历史记录'
    };
    wx.setNavigationBarTitle({
      title: titles[type] || '我的活动'
    });

    // 检查登录
    if (!app.globalData.isLoggedIn) {
      wx.showModal({
        title: '需要登录',
        content: '请先登录',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/profile/profile'
          });
        }
      });
      return;
    }

    this.loadEvents();
  },

  onShow() {
    // 每次显示时刷新数据
    if (app.globalData.isLoggedIn) {
      this.loadEvents();
    }
  },

  onPullDownRefresh() {
    this.loadEvents(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载活动列表
  async loadEvents(callback) {
    if (!app.globalData.isLoggedIn) {
      if (callback) callback();
      return;
    }

    if (this.data.loading) {
      if (callback) callback();
      return;
    }

    this.setData({
      loading: true,
      error: null
    });

    try {
      const userId = app.globalData.userInfo.id || app.globalData.userInfo._id;
      if (!userId) {
        throw new Error('用户信息不完整');
      }

      let events = [];

      if (this.data.type === 'created') {
        // 获取我发布的活动
        const res = await getMyCreatedEvents({
          organizer: userId,
          sortBy: 'startTime',
          limit: 100
        });

        if (res.success && res.data && res.data.events) {
          events = res.data.events;
        } else {
          throw new Error(res.message || '获取数据失败');
        }
      } else if (this.data.type === 'registered' || this.data.type === 'history') {
        // 获取已报名或历史记录
        const status = this.data.type === 'registered' ? 'registered' : 'completed';
        const res = await getMyRegistrations(status);

        if (res.success && res.data && res.data.registrations) {
          // 将报名记录转换为活动列表格式
          events = res.data.registrations
            .filter(reg => reg.event) // 过滤掉已删除的活动
            .map(reg => {
              const event = reg.event;
              return {
                id: event._id || event.id,
                title: event.title,
                category: event.category,
                startTime: event.startTime,
                endTime: event.endTime,
                location: event.location,
                format: event.format,
                rotationRule: event.rotationRule,
                scoringSystem: event.scoringSystem,
                maxParticipants: event.maxParticipants,
                currentParticipants: event.currentParticipants,
                registrationFee: event.registrationFee,
                status: event.status,
                registrationStatus: reg.status,
                registrationId: reg._id || reg.id
              };
            });
        } else {
          throw new Error(res.message || '获取数据失败');
        }
      }

      // 处理数据格式
      const processedEvents = events.map(event => {
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

        // 处理状态
        let statusText = '报名中';
        let statusClass = 'tag-primary';
        
        if (event.status === 'registering') {
          statusText = '报名中';
          statusClass = 'tag-primary';
        } else if (event.status === 'in_progress') {
          statusText = '比赛中';
          statusClass = 'tag-warning';
        } else if (event.status === 'ended') {
          statusText = '已结束';
          statusClass = 'tag-danger';
        } else if (event.status === 'cancelled') {
          statusText = '已取消';
          statusClass = 'tag-default';
        }

        // 处理分类
        const categoryMap = {
          'competition': '比赛',
          'activity': '活动',
          'club': '俱乐部'
        };

        return {
          ...event,
          startTimeFormatted: formatDateTime(event.startTime),
          statusText,
          statusClass,
          categoryText: categoryMap[event.category] || '其他',
          formatText: event.format?.type || '未知',
          isFull: event.currentParticipants >= event.maxParticipants
        };
      });

      this.setData({
        events: processedEvents,
        loading: false,
        emptyText: this.getEmptyText()
      });

      if (callback) callback();
    } catch (err) {
      console.error('加载活动列表失败', err);
      this.setData({
        loading: false,
        error: err.message || '加载失败，请重试',
        emptyText: this.getEmptyText()
      });
      
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
        duration: 2000
      });

      if (callback) callback();
    }
  },

  // 获取空状态文本
  getEmptyText() {
    const texts = {
      'created': '还没有发布过活动',
      'registered': '还没有报名任何活动',
      'history': '暂无历史记录'
    };
    return texts[this.data.type] || '暂无数据';
  },

  // 跳转到活动详情
  goToEventDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/event-detail/event-detail?id=${id}`
    });
  },

  // 删除活动（仅我发布的）
  async deleteEvent(e) {
    e.stopPropagation(); // 阻止事件冒泡
    
    const eventId = e.currentTarget.dataset.id;
    const eventTitle = e.currentTarget.dataset.title || '这个活动';

    wx.showModal({
      title: '确认删除',
      content: `确定要删除"${eventTitle}"吗？删除后无法恢复。`,
      confirmText: '删除',
      confirmColor: '#F44336',
      success: async (res) => {
        if (res.confirm) {
          try {
            wx.showLoading({ title: '删除中...' });
            
            // 调用删除接口
            const deleteRes = await request({
              url: `${baseURL}/events/${eventId}`,
              method: 'DELETE',
              showLoading: false
            });

            wx.hideLoading();

            if (deleteRes.success) {
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              });
              
              // 刷新列表
              setTimeout(() => {
                this.loadEvents();
              }, 1000);
            } else {
              throw new Error(deleteRes.message || '删除失败');
            }
          } catch (err) {
            console.error('删除活动失败', err);
            wx.hideLoading();
            wx.showToast({
              title: err.message || '删除失败',
              icon: 'none',
              duration: 2000
            });
          }
        }
      }
    });
  },

  // 跳转到创建活动
  goToCreate() {
    wx.switchTab({
      url: '/pages/game-types/game-types'
    });
  }
});

