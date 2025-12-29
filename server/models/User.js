// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // 微信相关
  openid: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  unionid: {
    type: String,
    sparse: true,
    index: true
  },
  
  // 用户信息
  nickName: {
    type: String,
    default: '用户'
  },
  avatarUrl: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  gender: {
    type: Number,
    default: 0 // 0-未知, 1-男, 2-女
  },
  
  // 用户等级和统计
  level: {
    type: Number,
    default: 1
  },
  totalMatches: {
    type: Number,
    default: 0
  },
  totalWins: {
    type: Number,
    default: 0
  },
  
  // 时间戳
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
userSchema.index({ openid: 1 });
userSchema.index({ createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;



