// pages/ranking/ranking.js
const app = getApp();

Page({
  data: {
    eventId: null,
    event: {},
    rankingList: [],
    totalMatches: 0,
    completedMatches: 0,
    inProgressMatches: 0
  },

  onLoad(options) {
    const id = parseInt(options.eventId);
    this.setData({
      eventId: id
    });
    this.loadEvent();
    this.loadRanking();
  },

  onShow() {
    // 每次显示时刷新排名
    this.loadRanking();
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

  // 加载排名数据
  loadRanking() {
    // 模拟数据，实际应该从服务器获取
    const mockRanking = [
      { id: 1, name: '张三/李四', wins: 5, losses: 1, netScore: 23, totalScore: 68, againstScore: 45 },
      { id: 2, name: '王五/赵六', wins: 4, losses: 2, netScore: 15, totalScore: 62, againstScore: 47 },
      { id: 3, name: '钱七/孙八', wins: 4, losses: 2, netScore: 12, totalScore: 58, againstScore: 46 },
      { id: 4, name: '周九/吴十', wins: 3, losses: 3, netScore: 5, totalScore: 55, againstScore: 50 },
      { id: 5, name: '郑一/王二', wins: 2, losses: 4, netScore: -8, totalScore: 48, againstScore: 56 },
      { id: 6, name: '冯三/陈四', wins: 1, losses: 5, netScore: -15, totalScore: 42, againstScore: 57 }
    ];

    // 按胜场和净胜分排序
    mockRanking.sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      return b.netScore - a.netScore;
    });

    this.setData({
      rankingList: mockRanking,
      totalMatches: 12,
      completedMatches: 10,
      inProgressMatches: 2
    });
  }
});

