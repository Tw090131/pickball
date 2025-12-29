// server/models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  // 基本信息
  title: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['competition', 'activity', 'club'],
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  
  // 时间信息
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  registrationDeadline: {
    type: Date,
    required: true
  },
  
  // 地点信息
  location: {
    type: String,
    required: true
  },
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  
  // 赛制信息
  format: {
    type: {
      type: String,
      enum: ['单打', '双打', '混双'],
      required: true
    },
    rule: {
      type: String,
      default: ''
    },
    scoreSystem: {
      type: String,
      default: '11分制'
    }
  },
  rotationRule: {
    type: String,
    enum: ['八人转', '五人转', '淘汰赛', '分组循环'],
    required: true
  },
  scoringSystem: {
    type: Number,
    default: 11
  },
  
  // 报名信息
  maxParticipants: {
    type: Number,
    required: true,
    min: 1
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  registrationFee: {
    type: Number,
    default: 0,
    min: 0
  },
  feeMode: {
    type: String,
    enum: ['free', 'aa', 'prepay'],
    default: 'free'
  },
  
  // 组织者
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizerName: {
    type: String,
    required: true
  },
  organizerAvatar: {
    type: String,
    default: ''
  },
  
  // 状态
  status: {
    type: String,
    enum: ['registering', 'in_progress', 'ended', 'cancelled'],
    default: 'registering'
  },
  
  // 八人转特殊配置
  rotationConfig: {
    // 特殊模式（根据人数和场次确定）
    specialMode: {
      type: String,
      enum: ['standard', 'full', 'super'],
      default: undefined,
      required: false
    },
    // 目标场次数（用于生成排表时参考）
    targetMatchCount: {
      type: Number,
      default: undefined,
      required: false
    },
    // 是否启用让分
    enableHandicap: {
      type: Boolean,
      default: false
    },
    // 让分规则
    handicapRules: {
      type: mongoose.Schema.Types.Mixed,
      default: undefined,
      required: false
    }
  },
  
  // 统计
  views: {
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
eventSchema.index({ category: 1, status: 1 });
eventSchema.index({ startTime: 1 });
eventSchema.index({ latitude: 1, longitude: 1 });
eventSchema.index({ organizer: 1 });
eventSchema.index({ createdAt: -1 });

// 虚拟字段：是否已满
eventSchema.virtual('isFull').get(function() {
  return this.currentParticipants >= this.maxParticipants;
});

// 更新状态的方法
eventSchema.methods.updateStatus = function() {
  const now = new Date();
  if (now < this.registrationDeadline && this.currentParticipants < this.maxParticipants) {
    this.status = 'registering';
  } else if (now >= this.startTime && now <= this.endTime) {
    this.status = 'in_progress';
  } else if (now > this.endTime) {
    this.status = 'ended';
  }
  return this.status;
};

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;

