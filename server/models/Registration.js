// server/models/Registration.js
const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  // 关联信息
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // 组队信息
  teamMode: {
    type: String,
    enum: ['with-partner', 'random'],
    default: 'random'
  },
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  partnerName: {
    type: String,
    default: ''
  },
  
  // 支付信息
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentAmount: {
    type: Number,
    default: 0
  },
  paymentOrderId: {
    type: String,
    default: ''
  },
  paymentTime: {
    type: Date,
    default: null
  },
  
  // 状态
  status: {
    type: String,
    enum: ['registered', 'cancelled', 'completed'],
    default: 'registered'
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

// 复合索引：确保用户不能重复报名同一赛事
registrationSchema.index({ event: 1, user: 1 }, { unique: true });
registrationSchema.index({ user: 1, status: 1 });
registrationSchema.index({ paymentStatus: 1 });

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;



