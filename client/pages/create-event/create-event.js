// pages/create-event/create-event.js
const app = getApp();

Page({
  data: {
    formData: {
      title: '',
      category: 'competition',
      categoryIndex: 0,
      location: '',
      startTime: '',
      endTime: '',
      registrationDeadline: '',
      format: '双打',
      formatIndex: 1,
      rotationRule: '八人转',
      rotationRuleIndex: 0,
      scoringSystem: 11,
      scoringSystemIndex: 0,
      maxParticipants: '',
      registrationFee: '0',
      description: ''
    },
    submitting: false, // 防止重复提交
    timers: [], // 保存定时器，用于清理
    gameType: '', // 游戏类型
    rotationType: '', // 轮转类型
    minPlayers: 4, // 最小人数
    maxPlayers: 13, // 最大人数
    allowSubstitute: false, // 是否允许替补
    enableHandicap: false, // 是否启用让分
    sixPlayerMode: 'standard', // 6人转模式
    sevenPlayerMode: 'standard', // 7人转模式
    sixPlayerModeIndex: 0,
    sevenPlayerModeIndex: 0,
    sixPlayerModes: [
      { name: '标准模式', value: 'standard', description: '每人4场，共6场' },
      { name: '完整模式', value: 'full', description: '每人6场，共9场' },
      { name: '超完整模式', value: 'super', description: '每人10场，共15场' }
    ],
    sevenPlayerModes: [
      { name: '标准模式', value: 'standard', description: '每人8场，共14场' },
      { name: '完整模式', value: 'full', description: '每人12场，共21场' }
    ],
    handicapTemplates: [
      { name: '无让分', value: 'none', description: '不使用让分' },
      { name: '女选手优势', value: 'female_advantage', description: '女选手获胜时额外获得1分' },
      { name: '男选手让分', value: 'male_penalty', description: '男选手需多赢1球才能获胜' }
    ],
    handicapTemplateIndex: 0,
    categories: [
      { value: 'competition', label: '比赛' },
      { value: 'activity', label: '活动' },
      { value: 'club', label: '俱乐部' }
    ],
    formats: ['单打', '双打', '混双'],
    rotationRules: ['八人转', '五人转', '淘汰赛', '分组循环'],
    scoringSystems: [11, 21, 31],
    startTimeIndex: [0, 0, 0],
    endTimeIndex: [0, 0, 0],
    deadlineIndex: [0, 0, 0],
    timePickerRange: [[], [], []]
  },

  onLoad(options) {
    // 从游戏类型页面传参
    if (options.gameType) {
      this.setData({
        gameType: options.gameType,
        rotationType: options.rotationType,
        minPlayers: parseInt(options.minPlayers) || 4,
        maxPlayers: parseInt(options.maxPlayers) || 13
      });
      
      // 如果是八人转，设置默认值
      if (options.rotationType === 'eight_rotation') {
        this.setData({
          'formData.rotationRule': '八人转',
          'formData.rotationRuleIndex': 0,
          'formData.format': '双打',
          'formData.formatIndex': 1,
          'formData.maxParticipants': options.maxPlayers || '13'
        });
      }
    }
    
    this.initTimePicker();
    this.getLocation(); // 获取当前位置
  },

  // 获取当前位置
  getLocation() {
    const app = getApp();
    if (app.globalData.location) {
      this.setData({
        latitude: app.globalData.location.latitude,
        longitude: app.globalData.location.longitude
      });
    }
  },

  // 选择位置
  chooseLocation() {
    const that = this;
    wx.chooseLocation({
      success: (res) => {
        that.setData({
          'formData.location': res.name || res.address,
          latitude: res.latitude,
          longitude: res.longitude
        });
      },
      fail: (err) => {
        console.error('选择位置失败', err);
        if (err.errMsg.includes('auth deny')) {
          wx.showModal({
            title: '需要位置权限',
            content: '请允许小程序获取位置信息',
            showCancel: false
          });
        }
      }
    });
  },

  // 初始化时间选择器
  initTimePicker() {
    const dates = [];
    const hours = [];
    const minutes = [];

    // 生成未来30天的日期
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
      dates.push(`${date.getMonth() + 1}月${date.getDate()}日`);
    }

    // 生成小时
    for (let i = 0; i < 24; i++) {
      hours.push(`${i.toString().padStart(2, '0')}时`);
    }

    // 生成分钟
    for (let i = 0; i < 60; i += 15) {
      minutes.push(`${i.toString().padStart(2, '0')}分`);
    }

    this.setData({
      timePickerRange: [dates, hours, minutes]
    });
  },

  // 格式化时间
  formatPickerTime(dateIndex, hourIndex, minuteIndex) {
    const dates = this.data.timePickerRange[0];
    const hours = this.data.timePickerRange[1];
    const minutes = this.data.timePickerRange[2];

    const dateStr = dates[dateIndex];
    const hourStr = hours[hourIndex];
    const minuteStr = minutes[minuteIndex];

    // 解析日期
    const today = new Date();
    const dayOffset = dateIndex;
    const date = new Date(today.getTime() + dayOffset * 24 * 60 * 60 * 1000);
    const hour = parseInt(hourStr);
    const minute = parseInt(minuteStr);

    const fullDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute);
    return app.formatTime(fullDate);
  },

  // 输入框变化
  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`formData.${field}`]: value
    });
  },

  // 分类选择
  onCategoryChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'formData.categoryIndex': index,
      'formData.category': this.data.categories[index].value
    });
  },

  // 开始时间选择
  onStartTimeChange(e) {
    const indices = e.detail.value;
    const time = this.formatPickerTime(indices[0], indices[1], indices[2]);
    this.setData({
      startTimeIndex: indices,
      'formData.startTime': time
    });
  },

  // 结束时间选择
  onEndTimeChange(e) {
    const indices = e.detail.value;
    const time = this.formatPickerTime(indices[0], indices[1], indices[2]);
    this.setData({
      endTimeIndex: indices,
      'formData.endTime': time
    });
  },

  // 截止时间选择
  onDeadlineChange(e) {
    const indices = e.detail.value;
    const time = this.formatPickerTime(indices[0], indices[1], indices[2]);
    this.setData({
      deadlineIndex: indices,
      'formData.registrationDeadline': time
    });
  },

  // 比赛形式选择
  onFormatChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'formData.formatIndex': index,
      'formData.format': this.data.formats[index]
    });
  },

  // 轮转规则选择
  onRotationRuleChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'formData.rotationRuleIndex': index,
      'formData.rotationRule': this.data.rotationRules[index]
    });
  },

  // 计分制选择
  onScoringSystemChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      'formData.scoringSystemIndex': index,
      'formData.scoringSystem': this.data.scoringSystems[index]
    });
  },

  // 替补开关
  onSubstituteChange(e) {
    this.setData({
      allowSubstitute: e.detail.value
    });
  },

  // 6人转模式选择
  onSixPlayerModeChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      sixPlayerModeIndex: index,
      sixPlayerMode: this.data.sixPlayerModes[index].value
    });
  },

  // 7人转模式选择
  onSevenPlayerModeChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      sevenPlayerModeIndex: index,
      sevenPlayerMode: this.data.sevenPlayerModes[index].value
    });
  },

  // 让分开关
  onHandicapChange(e) {
    this.setData({
      enableHandicap: e.detail.value
    });
  },

  // 让分模板选择
  onHandicapTemplateChange(e) {
    const index = parseInt(e.detail.value);
    this.setData({
      handicapTemplateIndex: index
    });
  },

  // 验证表单
  validateForm() {
    const { formData } = this.data;
    
    if (!formData.title.trim()) {
      wx.showToast({ title: '请输入活动标题', icon: 'none' });
      return false;
    }
    if (!formData.location.trim()) {
      wx.showToast({ title: '请输入活动地点', icon: 'none' });
      return false;
    }
    if (!formData.startTime) {
      wx.showToast({ title: '请选择开始时间', icon: 'none' });
      return false;
    }
    if (!formData.endTime) {
      wx.showToast({ title: '请选择结束时间', icon: 'none' });
      return false;
    }
    if (!formData.registrationDeadline) {
      wx.showToast({ title: '请选择报名截止时间', icon: 'none' });
      return false;
    }
    // 验证人数范围
    const maxParticipants = parseInt(formData.maxParticipants);
    if (!maxParticipants || maxParticipants <= 0) {
      wx.showToast({ title: '请输入最大参与人数', icon: 'none' });
      return false;
    }
    
    // 八人转人数验证
    if (this.data.rotationType === 'eight_rotation') {
      if (maxParticipants < this.data.minPlayers || maxParticipants > this.data.maxPlayers) {
        wx.showToast({ 
          title: `八人转支持 ${this.data.minPlayers}-${this.data.maxPlayers} 人`, 
          icon: 'none' 
        });
        return false;
      }
    }
    
    // 验证时间逻辑
    if (formData.startTime && formData.endTime) {
      const start = new Date(formData.startTime);
      const end = new Date(formData.endTime);
      if (end <= start) {
        wx.showToast({ title: '结束时间必须晚于开始时间', icon: 'none' });
        return false;
      }
    }
    
    if (formData.registrationDeadline && formData.startTime) {
      const deadline = new Date(formData.registrationDeadline);
      const start = new Date(formData.startTime);
      if (deadline >= start) {
        wx.showToast({ title: '报名截止时间必须早于开始时间', icon: 'none' });
        return false;
      }
    }
    
    if (!formData.maxParticipants || parseInt(formData.maxParticipants) <= 0) {
      wx.showToast({ title: '请输入有效的最大人数', icon: 'none' });
      return false;
    }

    // 八人转人数验证
    if (this.data.rotationType === 'eight_rotation') {
      const maxParticipants = parseInt(formData.maxParticipants);
      if (maxParticipants < this.data.minPlayers || maxParticipants > this.data.maxPlayers) {
        wx.showToast({ 
          title: `八人转支持 ${this.data.minPlayers}-${this.data.maxPlayers} 人`, 
          icon: 'none' 
        });
        return false;
      }
    }

    // 验证时间逻辑
    const startTime = new Date(formData.startTime);
    const endTime = new Date(formData.endTime);
    const deadline = new Date(formData.registrationDeadline);

    if (endTime <= startTime) {
      wx.showToast({ title: '结束时间必须晚于开始时间', icon: 'none' });
      return false;
    }
    if (deadline >= startTime) {
      wx.showToast({ title: '报名截止时间必须早于开始时间', icon: 'none' });
      return false;
    }

    return true;
  },

  // 提交活动
  async submitEvent() {
    // 防止重复提交
    if (this.data.submitting) {
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '发布中...' });

    try {
      // 准备提交数据
      const submitData = {
        title: this.data.formData.title,
        category: this.data.formData.category,
        location: this.data.formData.location,
        latitude: this.data.latitude || 39.9042, // 默认值，实际应该从地图选择获取
        longitude: this.data.longitude || 116.4074,
        startTime: this.data.formData.startTime,
        endTime: this.data.formData.endTime,
        registrationDeadline: this.data.formData.registrationDeadline,
        format: {
          type: this.data.formats[this.data.formData.formatIndex],
          rule: this.data.formData.rotationRule,
          scoreSystem: `${this.data.formData.scoringSystem}分制`
        },
        rotationRule: this.data.formData.rotationRule,
        scoringSystem: this.data.formData.scoringSystem,
        maxParticipants: parseInt(this.data.formData.maxParticipants),
        registrationFee: parseFloat(this.data.formData.registrationFee) || 0,
        description: this.data.formData.description || '',
        // 八人转特殊配置
        rotationConfig: {
          specialMode: this.data.formData.maxParticipants == 6 ? this.data.sixPlayerMode :
                      this.data.formData.maxParticipants == 7 ? this.data.sevenPlayerMode : null,
          enableHandicap: this.data.enableHandicap,
          handicapRules: this.data.enableHandicap ? {
            type: this.data.handicapTemplates[this.data.handicapTemplateIndex].value,
            enabled: true
          } : null
        }
      };

      // 调用 API 创建赛事
      const { createEvent } = require('../../utils/api');
      const res = await createEvent(submitData);
      
      if (res.success) {
        wx.hideLoading();
        wx.showToast({
          title: '发布成功',
          icon: 'success',
          duration: 2000
        });

        // 清空表单
        this.resetForm();

        // 返回首页
        setTimeout(() => {
          wx.switchTab({
            url: '/pages/index/index',
            fail: (err) => {
              console.error('跳转失败', err);
              this.setData({ submitting: false });
            }
          });
        }, 2000);
      } else {
        throw new Error(res.message || '发布失败');
      }
    } catch (err) {
      console.error('提交活动失败', err);
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({
        title: err.message || '发布失败，请重试',
        icon: 'none',
        duration: 3000
      });
    }
  },

  // 重置表单
  resetForm() {
    this.setData({
      formData: {
        title: '',
        category: 'competition',
        categoryIndex: 0,
        location: '',
        startTime: '',
        endTime: '',
        registrationDeadline: '',
        format: '双打',
        formatIndex: 1,
        rotationRule: '八人转',
        rotationRuleIndex: 0,
        scoringSystem: 11,
        scoringSystemIndex: 0,
        maxParticipants: '',
        registrationFee: '0',
        description: ''
      },
      submitting: false,
      allowSubstitute: false,
      enableHandicap: false,
      sixPlayerModeIndex: 0,
      sevenPlayerModeIndex: 0,
      handicapTemplateIndex: 0,
      latitude: null,
      longitude: null
    });
  },

  // 页面卸载时清理定时器
  onUnload() {
    this.data.timers.forEach(timer => {
      if (timer) clearTimeout(timer);
    });
    this.setData({ timers: [] });
  }
});

