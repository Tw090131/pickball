// app.js
App({
  onLaunch() {
    // 获取用户信息
    this.getUserInfo();
    // 获取位置信息
    this.getLocation();
  },

  // 获取用户信息
  getUserInfo() {
    const that = this;
    try {
      wx.getSetting({
        success: res => {
          if (res.authSetting['scope.userInfo']) {
            wx.getUserInfo({
              success: res => {
                that.globalData.userInfo = res.userInfo;
              },
              fail: err => {
                // 静默失败，不影响应用启动
                console.warn('获取用户信息失败', err);
              }
            });
          }
        },
        fail: err => {
          console.warn('获取设置失败', err);
        }
      });
    } catch (err) {
      console.error('getUserInfo 异常', err);
    }
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
    events: [] // 临时存储，实际应该从服务器获取
  }
});

