// pages/index/index.js
const app = getApp();
const { getEventList } = require('../../utils/api');

Page({
  data: {
    events: [],
    filteredEvents: [],
    currentCategory: 'all',
    sortBy: 'time',
    loading: false,
    error: null
  },

  onLoad() {
    this.loadEvents();
  },

  onShow() {
    // 每次显示页面时刷新数据
    this.loadEvents();
  },

  onPullDownRefresh() {
    this.loadEvents(() => {
      wx.stopPullDownRefresh();
    });
  },

  // 加载赛事列表
  async loadEvents(callback) {
    // 防止重复加载
    if (this.data.loading) {
      if (callback) callback();
      return;
    }

    this.setData({
      loading: true,
      error: null
    });

    try {
      // 从服务器获取数据
      const location = app.globalData.location;
      const params = {
        sortBy: this.data.sortBy === 'distance' ? 'distance' : 'startTime',
        page: 1,
        limit: 50
      };
      
      // 只有当分类不是 'all' 时才添加 category 参数
      if (this.data.currentCategory && this.data.currentCategory !== 'all') {
        params.category = this.data.currentCategory;
      }

      // 如果有位置信息，传递位置参数用于计算距离
      if (location) {
        params.latitude = location.latitude;
        params.longitude = location.longitude;
      }

      console.log('准备获取活动列表，参数:', params);
      const res = await getEventList(params);
      console.log('=== 获取活动列表响应 ===');
      console.log('响应类型:', typeof res);
      console.log('响应是否为对象:', res instanceof Object);
      console.log('响应完整内容:', res);
      console.log('响应 JSON:', JSON.stringify(res, null, 2));
      console.log('响应数据结构:', {
        success: res?.success,
        hasData: !!res?.data,
        hasEvents: !!res?.data?.events,
        eventsLength: res?.data?.events?.length || 0,
        firstEvent: res?.data?.events?.[0] ? {
          id: res.data.events[0].id,
          title: res.data.events[0].title,
          category: res.data.events[0].category
        } : null
      });
      console.log('=== 响应分析结束 ===');
      
      // 检查响应结构
      if (!res) {
        console.error('响应为空！');
        throw new Error('响应为空');
      }
      
      if (!res.success) {
        console.error('响应 success 为 false:', res);
        throw new Error(res?.message || '获取数据失败');
      }
      
      if (!res.data) {
        console.error('响应中没有 data 字段:', res);
        throw new Error('响应数据格式错误：缺少 data 字段');
      }
      
      if (!res.data.events) {
        console.error('响应中没有 events 字段:', res.data);
        throw new Error('响应数据格式错误：缺少 events 字段');
      }
      
      const serverEvents = res.data.events;
      console.log('获取到活动数量:', serverEvents.length);
      console.log('活动列表:', serverEvents.map(e => ({ id: e.id, title: e.title, category: e.category })));
      
      if (res && res.success && res.data && res.data.events) {
      
        // 处理服务器返回的数据
        const events = serverEvents.map(event => {
          try {
            // 使用服务器返回的距离（如果已计算）或本地计算
            const distance = event.distance !== undefined 
              ? event.distance 
              : (app.globalData.location 
                  ? app.calculateDistance(
                      app.globalData.location.latitude,
                      app.globalData.location.longitude,
                      event.latitude,
                      event.longitude
                    )
                  : null);
            
            // 处理状态
            let status = '报名中';
            let statusClass = 'tag-primary';
            
            if (event.status === 'registering') {
              status = '报名中';
              statusClass = 'tag-primary';
            } else if (event.status === 'in_progress') {
              status = '比赛中';
              statusClass = 'tag-warning';
            } else if (event.status === 'ended') {
              status = '已结束';
              statusClass = 'tag-danger';
            } else if (event.status === 'cancelled') {
              status = '已取消';
              statusClass = 'tag-default';
            }

            // 处理格式信息
            const formatText = event.format?.type || '未知';
            const scoringSystem = event.scoringSystem || 11;
            const currentParticipants = event.currentParticipants || 0;
            const maxParticipants = event.maxParticipants || 0;
            const isFull = currentParticipants >= maxParticipants;

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

            return {
              id: event.id || event._id,
              title: event.title,
              category: event.category,
              startTime: formatDateTime(event.startTime),
              startTimeISO: event.startTime, // 保存原始 ISO 时间用于排序
              endTime: event.endTime,
              registrationDeadline: event.registrationDeadline,
              location: event.location,
              latitude: event.latitude,
              longitude: event.longitude,
              distance: distance ? parseFloat(distance).toFixed(1) : null,
              status,
              statusClass,
              categoryText: this.getCategoryText(event.category),
              formatText,
              scoringSystem,
              currentParticipants,
              maxParticipants,
              isFull,
              organizerName: event.organizer?.name || event.organizerName || '未知组织',
              organizerAvatar: event.organizer?.avatar || event.organizerAvatar || '',
              rotationRule: event.rotationRule || '未知',
              registrationFee: event.registrationFee || 0,
              views: event.views || 0,
              // 兼容字段
              registration: {
                current: currentParticipants,
                total: maxParticipants,
                isFull: isFull
              },
              stats: {
                views: event.views || 0
              }
            };
          } catch (err) {
            console.error('处理事件数据失败', err, event);
            return {
              id: event.id || event._id,
              title: event.title || '未知赛事',
              category: event.category || 'activity',
              distance: null,
              status: '未知',
              statusClass: 'tag-default',
              categoryText: this.getCategoryText(event.category || 'activity'),
              formatText: event.format?.type || '未知',
              scoringSystem: event.scoringSystem || 11,
              currentParticipants: event.currentParticipants || 0,
              maxParticipants: event.maxParticipants || 0,
              organizerName: event.organizer?.name || event.organizerName || '未知组织',
              rotationRule: event.rotationRule || '未知',
              registrationFee: event.registrationFee || 0
            };
          }
        });

        console.log('处理后的活动数量:', events.length);
        console.log('处理后的活动示例:', events.length > 0 ? events[0] : '无数据');
        
        this.setData({
          events,
          loading: false
        }, () => {
          this.filterAndSort();
          console.log('筛选后的活动数量:', this.data.filteredEvents.length);
          console.log('当前分类:', this.data.currentCategory);
          if (callback) callback();
        });
      } else {
        console.error('获取数据失败，响应:', res);
        throw new Error(res?.message || '获取数据失败');
      }
    } catch (err) {
      console.error('加载赛事列表失败', err);
      this.setData({
        loading: false,
        error: err.message || '加载失败，请稍后重试'
      });
      wx.showToast({
        title: err.message || '加载失败',
        icon: 'none',
        duration: 2000
      });
      if (callback) callback();
    }
  },

  // 模拟数据
  getMockEvents() {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 格式化日期为 "2025/11/29 ( 星期六 ) 20:17" 格式
    const formatDateTime = (date) => {
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hour = date.getHours().toString().padStart(2, '0');
      const minute = date.getMinutes().toString().padStart(2, '0');
      const weekday = weekdays[date.getDay()];
      return `${year}/${month}/${day} ( ${weekday} ) ${hour}:${minute}`;
    };

    return [
      {
        id: 'match_001',
        title: '匹克球5人转',
        status: 'in_progress',
        statusLabel: '比赛中',
        tag: '比赛中',
        category: 'competition',
        startTime: formatDateTime(new Date(now.getTime() + 1 * 60 * 60 * 1000)),
        endTime: app.formatTime(new Date(now.getTime() + 3 * 60 * 60 * 1000)),
        registrationDeadline: app.formatTime(new Date(now.getTime() - 1 * 60 * 60 * 1000)),
        location: '市体育馆',
        latitude: 39.9042,
        longitude: 116.4074,
        format: {
          type: '八人转',
          rule: '一局定胜负',
          scoreSystem: '21分制'
        },
        organizer: {
          name: '木木枭组织',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=org1'
        },
        registration: {
          current: 5,
          total: 5,
          isFull: true
        },
        stats: {
          views: 36
        },
        participants: [
          { id: 'u1', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
          { id: 'u2', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
          { id: 'u3', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3' },
          { id: 'u4', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4' },
          { id: 'u5', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=5' }
        ],
        // 兼容旧字段
        scoringSystem: 21,
        rotationRule: '八人转',
        maxParticipants: 5,
        currentParticipants: 5,
        registrationFee: 0
      },
      {
        id: 'match_002',
        title: '周末匹克球友谊赛',
        status: 'registering',
        statusLabel: '报名中',
        tag: '报名中',
        category: 'competition',
        startTime: formatDateTime(tomorrow),
        endTime: app.formatTime(new Date(tomorrow.getTime() + 3 * 60 * 60 * 1000)),
        registrationDeadline: app.formatTime(new Date(tomorrow.getTime() - 2 * 60 * 60 * 1000)),
        location: '社区活动中心',
        latitude: 39.9142,
        longitude: 116.4174,
        format: {
          type: '双打',
          rule: '三局两胜',
          scoreSystem: '11分制'
        },
        organizer: {
          name: '匹克球俱乐部',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=org2'
        },
        registration: {
          current: 6,
          total: 8,
          isFull: false
        },
        stats: {
          views: 128
        },
        participants: [
          { id: 'u6', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=6' },
          { id: 'u7', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=7' },
          { id: 'u8', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=8' },
          { id: 'u9', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=9' },
          { id: 'u10', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=10' },
          { id: 'u11', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=11' }
        ],
        scoringSystem: 11,
        rotationRule: '八人转',
        maxParticipants: 8,
        currentParticipants: 6,
        registrationFee: 50
      },
      {
        id: 'match_003',
        title: '日常练球活动',
        status: 'registering',
        statusLabel: '报名中',
        tag: '报名中',
        category: 'activity',
        startTime: formatDateTime(new Date(now.getTime() + 2 * 60 * 60 * 1000)),
        endTime: app.formatTime(new Date(now.getTime() + 4 * 60 * 60 * 1000)),
        registrationDeadline: app.formatTime(new Date(now.getTime() + 1 * 60 * 60 * 1000)),
        location: '体育公园',
        latitude: 39.8942,
        longitude: 116.3974,
        format: {
          type: '混双',
          rule: '自由练习',
          scoreSystem: '21分制'
        },
        organizer: {
          name: '社区俱乐部',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=org3'
        },
        registration: {
          current: 8,
          total: 10,
          isFull: false
        },
        stats: {
          views: 89
        },
        participants: [
          { id: 'u12', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=12' },
          { id: 'u13', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=13' },
          { id: 'u14', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=14' },
          { id: 'u15', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=15' },
          { id: 'u16', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=16' },
          { id: 'u17', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=17' },
          { id: 'u18', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=18' },
          { id: 'u19', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=19' }
        ],
        scoringSystem: 21,
        rotationRule: '五人转',
        maxParticipants: 10,
        currentParticipants: 8,
        registrationFee: 0
      },
      {
        id: 'match_004',
        title: '匹克球俱乐部招新',
        status: 'registering',
        statusLabel: '报名中',
        tag: '报名中',
        category: 'club',
        startTime: formatDateTime(nextWeek),
        endTime: app.formatTime(new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000)),
        registrationDeadline: app.formatTime(new Date(nextWeek.getTime() - 24 * 60 * 60 * 1000)),
        location: '专业训练馆',
        latitude: 39.8842,
        longitude: 116.3874,
        format: {
          type: '单打',
          rule: '淘汰赛',
          scoreSystem: '11分制'
        },
        organizer: {
          name: '专业俱乐部',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=org4'
        },
        registration: {
          current: 12,
          total: 16,
          isFull: false
        },
        stats: {
          views: 256
        },
        participants: [
          { id: 'u20', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=20' },
          { id: 'u21', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=21' },
          { id: 'u22', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=22' },
          { id: 'u23', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=23' },
          { id: 'u24', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=24' },
          { id: 'u25', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=25' },
          { id: 'u26', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=26' },
          { id: 'u27', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=27' },
          { id: 'u28', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=28' },
          { id: 'u29', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=29' },
          { id: 'u30', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=30' },
          { id: 'u31', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=31' }
        ],
        scoringSystem: 11,
        rotationRule: '淘汰赛',
        maxParticipants: 16,
        currentParticipants: 12,
        registrationFee: 100
      }
    ];
  },

  // 获取分类文本
  getCategoryText(category) {
    const map = {
      'competition': '比赛',
      'activity': '活动',
      'club': '俱乐部'
    };
    return map[category] || '其他';
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category
    }, () => {
      this.filterAndSort();
    });
  },

  // 排序
  sortEvents(e) {
    const sortBy = e.currentTarget.dataset.sort;
    this.setData({
      sortBy
    }, () => {
      this.filterAndSort();
    });
  },

  // 筛选和排序
  filterAndSort() {
    let filtered = [...this.data.events];
    console.log('开始筛选，原始数据:', filtered.length, '当前分类:', this.data.currentCategory);

    // 按分类筛选
    if (this.data.currentCategory !== 'all') {
      filtered = filtered.filter(event => {
        const match = event.category === this.data.currentCategory;
        if (!match) {
          console.log('活动被过滤:', event.title, '分类:', event.category, '期望:', this.data.currentCategory);
        }
        return match;
      });
      console.log('分类筛选后:', filtered.length);
    }

    // 排序
    if (this.data.sortBy === 'time') {
      // 使用 startTimeISO 或解析格式化后的时间字符串
      filtered.sort((a, b) => {
        try {
          // 优先使用 ISO 格式时间
          if (a.startTimeISO && b.startTimeISO) {
            return new Date(a.startTimeISO) - new Date(b.startTimeISO);
          }
          // 否则尝试解析格式化后的时间字符串
          const timeA = new Date(a.startTime.replace(/[年月日()]/g, '').replace(/\s+/g, ' '));
          const timeB = new Date(b.startTime.replace(/[年月日()]/g, '').replace(/\s+/g, ' '));
          return timeA - timeB;
        } catch (err) {
          console.error('时间排序失败', err, a.startTime, b.startTime);
          return 0;
        }
      });
    } else if (this.data.sortBy === 'distance') {
      filtered.sort((a, b) => {
        const distA = a.distance ? parseFloat(a.distance) : 9999;
        const distB = b.distance ? parseFloat(b.distance) : 9999;
        return distA - distB;
      });
    }

    console.log('最终筛选结果:', filtered.length);
    this.setData({
      filteredEvents: filtered
    });
  },

  // 显示搜索
  showSearch() {
    wx.showToast({
      title: '搜索功能开发中',
      icon: 'none'
    });
  },

  // 跳转到赛事详情
  goToEventDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/event-detail/event-detail?id=${id}`
    });
  }
});

