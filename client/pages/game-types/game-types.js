// pages/game-types/game-types.js
Page({
  data: {
    currentCategory: 'doubles',
    showDetailModal: false,
    currentGame: {},
    games: [
      {
        id: 'rotation_8',
        name: '八人转',
        category: 'doubles',
        description: '固定轮转搭档，每个人都会和其他参与者搭档一次',
        detailDescription: '八人转是一种灵活的双打轮转玩法，支持4-13人参与。核心特点是"固定轮转搭档"，系统会自动排表，确保每个人都会和其他参与者搭档一次进行双打比赛。虽然是双打，但记录的是个人成绩（胜场数、净胜分），比赛结束后按个人总积分进行排名。',
        playerRange: '4-13人',
        rounds: '自动计算',
        scoring: '个人成绩',
        isHot: true,
        isNew: false,
        rules: [
          '支持4-13人参与，不限于8人',
          '系统自动排表，确保每个人搭档一次',
          '双打比赛，但记录个人成绩',
          '按个人胜场数和净胜分排名',
          '适合不同水平的混合比赛'
        ],
        rotationType: 'eight_rotation',
        minPlayers: 4,
        maxPlayers: 13
      },
      {
        id: 'rotation_5',
        name: '五人转',
        category: 'doubles',
        description: '5人轮转双打，每轮有1人轮空',
        playerRange: '5人',
        rounds: '4轮',
        scoring: '个人成绩',
        isHot: false,
        isNew: false,
        rotationType: 'five_rotation',
        minPlayers: 5,
        maxPlayers: 5
      },
      {
        id: 'elimination',
        name: '淘汰赛',
        category: 'doubles',
        description: '单败淘汰，输一场即出局',
        playerRange: '8/16/32人',
        rounds: '多轮',
        scoring: '胜负',
        isHot: false,
        isNew: false,
        rotationType: 'elimination',
        minPlayers: 4,
        maxPlayers: 32
      },
      {
        id: 'round_robin',
        name: '循环赛',
        category: 'doubles',
        description: '每对组合都要和其他组合比赛',
        playerRange: '4-12人',
        rounds: '多轮',
        scoring: '积分',
        isHot: false,
        isNew: false,
        rotationType: 'round_robin',
        minPlayers: 4,
        maxPlayers: 12
      },
      {
        id: 'singles_tournament',
        name: '单打锦标赛',
        category: 'singles',
        description: '单打比赛，支持多种赛制',
        playerRange: '2-32人',
        rounds: '多轮',
        scoring: '胜负',
        isHot: false,
        isNew: false,
        rotationType: 'singles',
        minPlayers: 2,
        maxPlayers: 32
      }
    ],
    filteredGames: []
  },

  onLoad() {
    this.filterGames();
  },

  // 切换分类
  switchCategory(e) {
    const category = e.currentTarget.dataset.category;
    this.setData({
      currentCategory: category
    }, () => {
      this.filterGames();
    });
  },

  // 筛选玩法
  filterGames() {
    const filtered = this.data.games.filter(game => {
      if (this.data.currentCategory === 'doubles') {
        return game.category === 'doubles';
      } else if (this.data.currentCategory === 'singles') {
        return game.category === 'singles';
      } else if (this.data.currentCategory === 'versus') {
        return game.category === 'versus';
      } else if (this.data.currentCategory === 'team') {
        return game.category === 'team';
      }
      return true;
    });

    this.setData({
      filteredGames: filtered
    });
  },

  // 跳转到创建页面
  goToCreate(e) {
    const game = e.currentTarget.dataset.game;
    wx.navigateTo({
      url: `/pages/create-event/create-event?gameType=${game.id}&rotationType=${game.rotationType}&minPlayers=${game.minPlayers}&maxPlayers=${game.maxPlayers}`
    });
  },

  // 显示详细介绍
  showDetail(e) {
    const game = e.currentTarget.dataset.game;
    this.setData({
      currentGame: game,
      showDetailModal: true
    });
  },

  // 显示示例
  showExample(e) {
    const game = e.currentTarget.dataset.game;
    wx.showModal({
      title: `${game.name} 示例`,
      content: `示例：${game.playerRange}参与，系统会自动排表...`,
      showCancel: false
    });
  },

  // 隐藏详情
  hideDetail() {
    this.setData({
      showDetailModal: false
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止事件冒泡
  }
});

