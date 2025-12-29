// pages/bracket/bracket.js
const app = getApp();

Page({
  data: {
    eventId: null,
    event: {},
    rounds: [],
    showScoreModal: false,
    currentTeam: {
      round: null,
      match: null,
      teamA: '',
      teamB: '',
      scoreA: 0,
      scoreB: 0
    }
  },

  onLoad(options) {
    const id = parseInt(options.eventId);
    this.setData({
      eventId: id
    });
    this.loadEvent();
    this.loadBracket();
  },

  // 加载赛事信息
  loadEvent() {
    // 模拟数据
    const mockEvent = {
      id: this.data.eventId,
      title: '周末匹克球友谊赛',
      format: '双打',
      scoringSystem: 11
    };
    this.setData({
      event: mockEvent
    });
  },

  // 加载晋级图数据
  loadBracket() {
    // 模拟数据：16支队伍，4轮比赛
    const teams = [
      '张三/李四', '王五/赵六', '钱七/孙八', '周九/吴十',
      '郑一/王二', '冯三/陈四', '褚五/卫六', '蒋七/沈八',
      '韩九/杨十', '朱一/秦二', '尤三/许四', '何五/吕六',
      '施七/张八', '孔九/曹十', '严一/华二', '金三/魏四'
    ];

    // 生成第一轮（16进8）
    const round1 = [];
    for (let i = 0; i < 8; i++) {
      round1.push({
        id: i + 1,
        teamA: {
          name: teams[i * 2],
          score: i < 3 ? 11 : 0,
          winner: i < 3
        },
        teamB: {
          name: teams[i * 2 + 1],
          score: i < 3 ? 8 : 0,
          winner: false
        }
      });
    }

    // 生成第二轮（8进4）
    const round2 = [];
    const round1Winners = round1.filter(m => m.teamA.winner || m.teamB.winner)
      .map(m => m.teamA.winner ? m.teamA.name : m.teamB.name);
    
    for (let i = 0; i < 4; i++) {
      round2.push({
        id: i + 1,
        teamA: {
          name: round1Winners[i * 2] || '待定',
          score: i < 2 ? 11 : 0,
          winner: i < 2
        },
        teamB: {
          name: round1Winners[i * 2 + 1] || '待定',
          score: i < 2 ? 9 : 0,
          winner: false
        }
      });
    }

    // 生成半决赛（4进2）
    const round3 = [];
    const round2Winners = round2.filter(m => m.teamA.winner || m.teamB.winner)
      .map(m => m.teamA.winner ? m.teamA.name : m.teamB.name);
    
    for (let i = 0; i < 2; i++) {
      round3.push({
        id: i + 1,
        teamA: {
          name: round2Winners[i * 2] || '待定',
          score: i < 1 ? 11 : 0,
          winner: i < 1
        },
        teamB: {
          name: round2Winners[i * 2 + 1] || '待定',
          score: i < 1 ? 7 : 0,
          winner: false
        }
      });
    }

    // 生成决赛
    const round4 = [];
    const round3Winners = round3.filter(m => m.teamA.winner || m.teamB.winner)
      .map(m => m.teamA.winner ? m.teamA.name : m.teamB.name);
    
    round4.push({
      id: 1,
      teamA: {
        name: round3Winners[0] || '待定',
        score: 0,
        winner: false
      },
      teamB: {
        name: round3Winners[1] || '待定',
        score: 0,
        winner: false
      }
    });

    this.setData({
      rounds: [round1, round2, round3, round4]
    });
  },

  // 选择队伍（录入比分）
  selectTeam(e) {
    const round = parseInt(e.currentTarget.dataset.round);
    const match = parseInt(e.currentTarget.dataset.match);
    const team = e.currentTarget.dataset.team;

    const matchData = this.data.rounds[round][match];
    
    this.setData({
      showScoreModal: true,
      currentTeam: {
        round,
        match,
        teamA: matchData.teamA.name,
        teamB: matchData.teamB.name,
        scoreA: matchData.teamA.score,
        scoreB: matchData.teamB.score
      }
    });
  },

  // 比分输入
  onScoreInput(e) {
    const team = e.currentTarget.dataset.team;
    const value = parseInt(e.detail.value) || 0;
    
    this.setData({
      [`currentTeam.score${team}`]: value
    });
  },

  // 保存比分
  saveScore() {
    try {
      const { currentTeam, rounds, event } = this.data;
      const { round, match, scoreA, scoreB } = currentTeam;

      // 参数验证
      if (round === null || match === null || rounds.length <= round || !rounds[round][match]) {
        wx.showToast({ title: '数据错误', icon: 'none' });
        return;
      }

      const scoreAInt = parseInt(scoreA) || 0;
      const scoreBInt = parseInt(scoreB) || 0;

      if (scoreAInt < 0 || scoreBInt < 0) {
        wx.showToast({ title: '比分不能为负数', icon: 'none' });
        return;
      }

      // 更新比分
      const updatedRounds = [...rounds];
      updatedRounds[round][match].teamA.score = scoreAInt;
      updatedRounds[round][match].teamB.score = scoreBInt;
      
      // 判断获胜方（需要达到指定分数且领先2分）
      const maxScore = event?.scoringSystem || 11;
      if (scoreAInt >= maxScore && scoreAInt - scoreBInt >= 2) {
        updatedRounds[round][match].teamA.winner = true;
        updatedRounds[round][match].teamB.winner = false;
      } else if (scoreBInt >= maxScore && scoreBInt - scoreAInt >= 2) {
        updatedRounds[round][match].teamA.winner = false;
        updatedRounds[round][match].teamB.winner = true;
      } else {
        updatedRounds[round][match].teamA.winner = false;
        updatedRounds[round][match].teamB.winner = false;
      }

      // 如果下一轮存在，更新下一轮的队伍
      if (round < updatedRounds.length - 1) {
        const nextRound = round + 1;
        const nextMatch = Math.floor(match / 2);
        const position = match % 2 === 0 ? 'A' : 'B';
        
        if (updatedRounds[nextRound] && updatedRounds[nextRound][nextMatch]) {
          if (updatedRounds[round][match].teamA.winner) {
            updatedRounds[nextRound][nextMatch][`team${position}`].name = updatedRounds[round][match].teamA.name;
          } else if (updatedRounds[round][match].teamB.winner) {
            updatedRounds[nextRound][nextMatch][`team${position}`].name = updatedRounds[round][match].teamB.name;
          }
        }
      }

      this.setData({
        rounds: updatedRounds,
        showScoreModal: false
      });

      wx.showToast({
        title: '比分已保存',
        icon: 'success'
      });
    } catch (err) {
      console.error('保存比分失败', err);
      wx.showToast({
        title: '保存失败，请重试',
        icon: 'none'
      });
    }
  },

  // 隐藏计分弹窗
  hideScoreModal() {
    this.setData({
      showScoreModal: false
    });
  },

  // 阻止事件冒泡
  stopPropagation() {
    // 空函数，用于阻止点击弹窗内容时关闭弹窗
  }
});

