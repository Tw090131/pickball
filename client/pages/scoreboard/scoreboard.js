// pages/scoreboard/scoreboard.js
const app = getApp();

Page({
  data: {
    eventId: null,
    event: {},
    currentMatch: null,
    matches: [],
    newMatch: {
      teamA: '',
      teamB: ''
    },
    isRotation: false, // 是否是八人转
    gameScoreOptions: [
      { label: '2:0', value: '2:0', gamesWon: 2, gamesLost: 0, points: 2 },
      { label: '1:0', value: '1:0', gamesWon: 1, gamesLost: 0, points: 2 },
      { label: '2:1', value: '2:1', gamesWon: 2, gamesLost: 1, points: 1 },
      { label: '0:2', value: '0:2', gamesWon: 0, gamesLost: 2, points: 0 },
      { label: '0:1', value: '0:1', gamesWon: 0, gamesLost: 1, points: 0 },
      { label: '1:2', value: '1:2', gamesWon: 1, gamesLost: 2, points: 0 }
    ],
    gameScoreAIndex: 0,
    gameScoreBIndex: 0
  },

  onLoad(options) {
    const id = parseInt(options.eventId);
    this.setData({
      eventId: id
    });
    this.loadEvent();
    this.loadMatches();
  },

  // 加载赛事信息
  loadEvent() {
    // 模拟数据
    const mockEvent = {
      id: this.data.eventId,
      title: '周末匹克球友谊赛',
      format: '双打',
      scoringSystem: 11,
      rotationRule: '八人转' // 判断是否是八人转
    };
    this.setData({
      event: mockEvent,
      isRotation: mockEvent.rotationRule === '八人转'
    });
  },

  // 加载比赛列表
  loadMatches() {
    // 模拟数据
    const mockMatches = [
      {
        id: 1,
        teamA: '张三/李四',
        teamB: '王五/赵六',
        scoreA: 11,
        scoreB: 8,
        status: '已完成',
        statusClass: 'tag-default'
      },
      {
        id: 2,
        teamA: '钱七/孙八',
        teamB: '周九/吴十',
        scoreA: 0,
        scoreB: 0,
        status: '进行中',
        statusClass: 'tag-warning'
      }
    ];

    // 找到进行中的比赛作为当前比赛
    const currentMatch = mockMatches.find(m => m.status === '进行中');
    
    this.setData({
      matches: mockMatches,
      currentMatch: currentMatch ? {
        id: currentMatch.id,
        teamA: currentMatch.teamA,
        teamB: currentMatch.teamB,
        scoreA: currentMatch.scoreA,
        scoreB: currentMatch.scoreB
      } : null
    });
  },

  // 队伍输入
  onTeamInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({
      [`newMatch.${field}`]: value
    });
  },

  // 添加比赛
  addMatch() {
    const { newMatch, event } = this.data;
    
    if (!newMatch.teamA.trim() || !newMatch.teamB.trim()) {
      wx.showToast({ title: '请输入队伍名称', icon: 'none' });
      return;
    }

    const match = {
      id: Date.now(),
      teamA: newMatch.teamA,
      teamB: newMatch.teamB,
      scoreA: 0,
      scoreB: 0,
      status: '进行中',
      statusClass: 'tag-warning'
    };

    this.setData({
      matches: [match, ...this.data.matches],
      currentMatch: {
        id: match.id,
        teamA: match.teamA,
        teamB: match.teamB,
        scoreA: 0,
        scoreB: 0
      },
      newMatch: {
        teamA: '',
        teamB: ''
      }
    });

    wx.showToast({
      title: '比赛已添加',
      icon: 'success'
    });
  },

  // 选择比赛
  selectMatch(e) {
    const id = parseInt(e.currentTarget.dataset.id);
    const match = this.data.matches.find(m => m.id === id);
    
    if (match && match.status === '进行中') {
      this.setData({
        currentMatch: {
          id: match.id,
          teamA: match.teamA,
          teamB: match.teamB,
          scoreA: match.scoreA,
          scoreB: match.scoreB
        }
      });
    }
  },

  // 局比分选择（八人转）
  onGameScoreChange(e) {
    const team = e.currentTarget.dataset.team;
    const index = parseInt(e.detail.value);
    const option = this.data.gameScoreOptions[index];
    
    if (team === 'A') {
      this.setData({
        gameScoreAIndex: index,
        'currentMatch.gameScoreA': {
          gamesWon: option.gamesWon,
          gamesLost: option.gamesLost
        },
        'currentMatch.pointsA': option.points
      });
    } else {
      this.setData({
        gameScoreBIndex: index,
        'currentMatch.gameScoreB': {
          gamesWon: option.gamesWon,
          gamesLost: option.gamesLost
        },
        'currentMatch.pointsB': option.points
      });
    }
  },

  // 加分（传统计分）
  addScore(e) {
    try {
      const team = e.currentTarget.dataset.team;
      const { currentMatch, event } = this.data;
      
      if (!currentMatch) {
        wx.showToast({ title: '请先选择或添加比赛', icon: 'none' });
        return;
      }

      if (!event || !event.scoringSystem) {
        wx.showToast({ title: '赛事信息错误', icon: 'none' });
        return;
      }

      const maxScore = event.scoringSystem;
      let newScoreA = parseInt(currentMatch.scoreA) || 0;
      let newScoreB = parseInt(currentMatch.scoreB) || 0;

      if (team === 'A') {
        newScoreA += 1;
      } else if (team === 'B') {
        newScoreB += 1;
      } else {
        return;
      }

      // 检查是否达到获胜分数（需要领先2分）
      const winScore = maxScore;
      const isWin = (team === 'A' && newScoreA >= winScore && newScoreA - newScoreB >= 2) ||
                      (team === 'B' && newScoreB >= winScore && newScoreB - newScoreA >= 2);

      this.setData({
        'currentMatch.scoreA': newScoreA,
        'currentMatch.scoreB': newScoreB
      });

      // 更新比赛列表中的比分
      const matches = this.data.matches.map(m => {
        if (m.id === currentMatch.id) {
          return {
            ...m,
            scoreA: newScoreA,
            scoreB: newScoreB
          };
        }
        return m;
      });
      this.setData({ matches });

      if (isWin) {
        wx.showModal({
          title: '比赛结束',
          content: `${team === 'A' ? currentMatch.teamA : currentMatch.teamB} 获胜！`,
          showCancel: false,
          success: () => {
            this.finishMatch();
          },
          fail: (err) => {
            console.error('显示弹窗失败', err);
            this.finishMatch();
          }
        });
      }
    } catch (err) {
      console.error('加分失败', err);
      wx.showToast({
        title: '操作失败，请重试',
        icon: 'none'
      });
    }
  },

  // 重置比分
  resetScore() {
    if (!this.data.currentMatch) return;

    wx.showModal({
      title: '确认重置',
      content: '确定要重置当前比分吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({
            'currentMatch.scoreA': 0,
            'currentMatch.scoreB': 0
          });

          // 更新比赛列表
          const matches = this.data.matches.map(m => {
            if (m.id === this.data.currentMatch.id) {
              return {
                ...m,
                scoreA: 0,
                scoreB: 0
              };
            }
            return m;
          });
          this.setData({ matches });
        }
      }
    });
  },

  // 完成比赛
  finishMatch() {
    if (!this.data.currentMatch) return;

    // 八人转需要验证局比分
    if (this.data.isRotation) {
      if (!this.data.currentMatch.gameScoreA || !this.data.currentMatch.gameScoreB) {
        wx.showToast({
          title: '请选择双方局比分',
          icon: 'none'
        });
        return;
      }

      // 验证局比分有效性（必须有一方获胜）
      const scoreA = this.data.currentMatch.gameScoreA;
      const scoreB = this.data.currentMatch.gameScoreB;
      
      if (scoreA.gamesWon === scoreB.gamesWon) {
        wx.showToast({
          title: '局比分无效，必须有一方获胜',
          icon: 'none'
        });
        return;
      }
    }

    const matches = this.data.matches.map(m => {
      if (m.id === this.data.currentMatch.id) {
        const updated = {
          ...m,
          status: '已完成',
          statusClass: 'tag-default'
        };

        if (this.data.isRotation) {
          updated.gameScoreA = this.data.currentMatch.gameScoreA;
          updated.gameScoreB = this.data.currentMatch.gameScoreB;
          updated.pointsA = this.data.currentMatch.pointsA;
          updated.pointsB = this.data.currentMatch.pointsB;
        } else {
          updated.scoreA = this.data.currentMatch.scoreA;
          updated.scoreB = this.data.currentMatch.scoreB;
        }

        return updated;
      }
      return m;
    });

    this.setData({
      matches,
      currentMatch: null,
      gameScoreAIndex: 0,
      gameScoreBIndex: 0
    });

    wx.showToast({
      title: '比赛已完成',
      icon: 'success'
    });
  }
});

