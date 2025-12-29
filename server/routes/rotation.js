// server/routes/rotation.js
const express = require('express');
const router = express.Router();
const { 
  generateRotationSchedule, 
  isValidRotationCount, 
  getRotationDescription,
  calculateTotalMatches,
  getSixPlayerOptions,
  getSevenPlayerOptions
} = require('../utils/rotation');
const Registration = require('../models/Registration');
const Match = require('../models/Match');
const Event = require('../models/Event');
const { authenticate } = require('../middleware/auth');

/**
 * 生成八人转排表
 * POST /api/rotation/generate
 */
router.post('/generate', authenticate, async (req, res, next) => {
  try {
    const { eventId, sixPlayerMode, sevenPlayerMode, randomize } = req.body;

    // 获取赛事信息
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '赛事不存在'
      });
    }

    // 检查是否是八人转
    if (event.rotationRule !== '八人转') {
      return res.status(400).json({
        success: false,
        message: '此赛事不是八人转类型'
      });
    }

    // 获取所有报名用户
    const registrations = await Registration.find({
      event: eventId,
      status: 'registered'
    }).populate('user', 'nickName avatarUrl');

    if (registrations.length < 4 || registrations.length > 13) {
      return res.status(400).json({
        success: false,
        message: `参与人数 ${registrations.length} 不符合八人转要求（4-13人）`
      });
    }

    // 准备参与者数据
    const participants = registrations.map((reg, index) => ({
      id: reg.user._id.toString(),
      name: reg.user.nickName,
      avatar: reg.user.avatarUrl,
      registrationId: reg._id.toString()
    }));

    // 生成排表（支持6人和7人的特殊模式）
    const schedule = generateRotationSchedule(participants, {
      sixPlayerMode: sixPlayerMode || 'standard',
      sevenPlayerMode: sevenPlayerMode || 'standard',
      randomize: randomize !== false
    });

    // 保存到数据库
    const matches = schedule.map(match => {
      return new Match({
        event: eventId,
        round: match.round,
        matchNumber: match.matchNumber,
        teamA: {
          name: match.teamA.name,
          players: match.teamA.players.map(p => p.id),
          score: 0,
          winner: false
        },
        teamB: {
          name: match.teamB.name,
          players: match.teamB.players.map(p => p.id),
          score: 0,
          winner: false
        },
        status: 'pending'
      });
    });

    // 删除旧的比赛记录
    await Match.deleteMany({ event: eventId });

    // 保存新比赛
    await Match.insertMany(matches);

    const totalRounds = schedule.length > 0 ? Math.max(...schedule.map(m => m.round)) : 0;
    const calculatedTotal = calculateTotalMatches(participants.length);

    res.json({
      success: true,
      message: '排表生成成功',
      data: {
        schedule,
        totalRounds,
        totalMatches: schedule.length,
        calculatedTotal, // 公式计算的总场数
        participants: participants.length,
        participantsList: participants
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取八人转排表
 * GET /api/rotation/schedule/:eventId
 */
router.get('/schedule/:eventId', async (req, res, next) => {
  try {
    const matches = await Match.find({ event: req.params.eventId })
      .populate('teamA.players', 'nickName avatarUrl')
      .populate('teamB.players', 'nickName avatarUrl')
      .sort({ round: 1, matchNumber: 1 });

    // 按轮次分组
    const schedule = {};
    matches.forEach(match => {
      if (!schedule[match.round]) {
        schedule[match.round] = [];
      }
      schedule[match.round].push(match);
    });

    res.json({
      success: true,
      data: {
        schedule,
        totalRounds: Object.keys(schedule).length,
        totalMatches: matches.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取八人转描述
 * GET /api/rotation/description
 */
router.get('/description', async (req, res, next) => {
  try {
    const { count } = req.query;
    const participantCount = parseInt(count);

    if (!isValidRotationCount(participantCount)) {
      return res.status(400).json({
        success: false,
        message: '参与人数必须在 4-13 人之间'
      });
    }

    const description = getRotationDescription(participantCount);
    const totalMatches = calculateTotalMatches(participantCount);
    const rounds = participantCount - 1;

    // 6人和7人的特殊选项
    let specialOptions = null;
    if (participantCount === 6) {
      specialOptions = getSixPlayerOptions();
    } else if (participantCount === 7) {
      specialOptions = getSevenPlayerOptions();
    }

    res.json({
      success: true,
      data: {
        description,
        participantCount,
        totalMatches,
        rounds,
        matchesPerRound: Math.floor(participantCount / 2),
        isValid: true,
        specialOptions
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

