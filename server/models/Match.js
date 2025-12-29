// server/models/Match.js
const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  // 关联信息
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  
  // 队伍信息
  teamA: {
    name: {
      type: String,
      required: true
    },
    players: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    score: {
      type: Number,
      default: 0
    },
    // 局比分（用于八人转）
    gameScore: {
      gamesWon: {
        type: Number,
        default: 0
      },
      gamesLost: {
        type: Number,
        default: 0
      }
    },
    // 积分（用于八人转）
    points: {
      type: Number,
      default: 0
    },
    winner: {
      type: Boolean,
      default: false
    }
  },
  teamB: {
    name: {
      type: String,
      required: true
    },
    players: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    score: {
      type: Number,
      default: 0
    },
    // 局比分（用于八人转）
    gameScore: {
      gamesWon: {
        type: Number,
        default: 0
      },
      gamesLost: {
        type: Number,
        default: 0
      }
    },
    // 积分（用于八人转）
    points: {
      type: Number,
      default: 0
    },
    winner: {
      type: Boolean,
      default: false
    }
  },
  
  // 比赛信息
  round: {
    type: Number,
    default: 1
  },
  matchNumber: {
    type: Number,
    default: 1
  },
  
  // 状态
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // 时间戳
  startTime: {
    type: Date,
    default: null
  },
  endTime: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 索引
matchSchema.index({ event: 1, round: 1, matchNumber: 1 });
matchSchema.index({ status: 1 });

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;



