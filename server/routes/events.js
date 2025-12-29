// server/routes/events.js
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { body, validationResult, query } = require('express-validator');

/**
 * 获取赛事列表
 * GET /api/events
 */
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      category,
      status,
      sortBy = 'startTime',
      page = 1,
      limit = 20,
      latitude,
      longitude,
      organizer // 新增：按组织者筛选
    } = req.query;

    // 构建查询条件
    const query = {};
    // 只有当 category 存在、不是 'all'、不是 'undefined' 字符串时才添加
    if (category && category !== 'all' && category !== 'undefined') {
      query.category = category;
    }
    if (status) {
      query.status = status;
    }
    if (organizer) {
      query.organizer = organizer;
    }

    // 分页
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // 查询
    // 注意：如果 sortBy 是 'distance'，需要在计算距离后再排序
    let sortOption = {};
    if (sortBy === 'startTime') {
      sortOption = { startTime: 1 }; // 按开始时间升序
    } else if (sortBy === 'distance') {
      // 距离排序在计算距离后处理
      sortOption = { createdAt: -1 }; // 临时按创建时间降序
    } else {
      sortOption = { createdAt: -1 }; // 默认按创建时间降序
    }
    
    let events = await Event.find(query)
      .populate('organizer', 'nickName avatarUrl')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    // 更新状态
    events = events.map(event => {
      event.updateStatus();
      return event;
    });

    // 计算距离（如果有位置信息）
    if (latitude && longitude) {
      events = events.map(event => {
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          event.latitude,
          event.longitude
        );
        event.distance = distance;
        return event;
      });

      // 如果按距离排序
      if (sortBy === 'distance') {
        events.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
      }
    }

    // 格式化数据
    const formattedEvents = events.map(event => ({
      id: event._id ? event._id.toString() : event._id,
      title: event.title,
      category: event.category,
      startTime: event.startTime,
      endTime: event.endTime,
      registrationDeadline: event.registrationDeadline,
      location: event.location,
      latitude: event.latitude,
      longitude: event.longitude,
      distance: event.distance,
      format: event.format,
      rotationRule: event.rotationRule,
      scoringSystem: event.scoringSystem,
      maxParticipants: event.maxParticipants,
      currentParticipants: event.currentParticipants,
      registrationFee: event.registrationFee,
      organizer: {
        name: event.organizerName,
        avatar: event.organizerAvatar
      },
      status: event.status,
      views: event.views,
      isFull: event.isFull
    }));

    const total = await Event.countDocuments(query);

    console.log('查询条件:', JSON.stringify(query));
    console.log('查询到的活动数量:', events.length);
    console.log('格式化后的活动数量:', formattedEvents.length);
    console.log('活动示例:', formattedEvents.length > 0 ? {
      id: formattedEvents[0].id,
      idType: typeof formattedEvents[0].id,
      title: formattedEvents[0].title,
      category: formattedEvents[0].category,
      status: formattedEvents[0].status
    } : '无数据');
    console.log('所有活动的 ID:', formattedEvents.map(e => ({ id: e.id, idType: typeof e.id, title: e.title })));

    res.json({
      success: true,
      data: {
        events: formattedEvents,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取赛事详情
 * GET /api/events/:id
 */
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'nickName avatarUrl');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: '赛事不存在'
      });
    }

    // 增加浏览量
    event.views += 1;
    await event.save();

    // 更新状态
    event.updateStatus();

    res.json({
      success: true,
      data: {
        event
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 创建赛事
 * POST /api/events
 */
router.post('/', authenticate, [
  body('title').notEmpty().withMessage('标题不能为空'),
  body('category').isIn(['competition', 'activity', 'club']).withMessage('分类无效'),
  body('startTime').isISO8601().withMessage('开始时间格式错误'),
  body('endTime').isISO8601().withMessage('结束时间格式错误'),
  body('location').notEmpty().withMessage('地点不能为空'),
  body('maxParticipants').isInt({ min: 1 }).withMessage('最大人数必须大于0')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    // 确保 category 字段存在
    if (!req.body.category) {
      return res.status(400).json({
        success: false,
        message: '分类不能为空'
      });
    }

    // 验证 category 值
    const validCategories = ['competition', 'activity', 'club'];
    if (!validCategories.includes(req.body.category)) {
      return res.status(400).json({
        success: false,
        message: '分类无效，必须是 competition、activity 或 club'
      });
    }

    const eventData = {
      ...req.body,
      category: req.body.category, // 明确设置 category
      organizer: req.userId,
      organizerName: req.user.nickName,
      organizerAvatar: req.user.avatarUrl,
      currentParticipants: 0,
      status: 'registering'
    };

    console.log('创建事件数据:', {
      title: eventData.title,
      category: eventData.category,
      hasCategory: !!eventData.category
    });

    // 处理八人转特殊配置
    if (req.body.rotationConfig) {
      eventData.rotationConfig = {
        ...req.body.rotationConfig
      };
      
      // 如果 specialMode 是 null 或空字符串，则删除该字段
      if (eventData.rotationConfig.specialMode === null || 
          eventData.rotationConfig.specialMode === '' ||
          eventData.rotationConfig.specialMode === undefined) {
        delete eventData.rotationConfig.specialMode;
      }
      
      // 如果 handicapRules 是 null，则删除该字段
      if (eventData.rotationConfig.handicapRules === null) {
        delete eventData.rotationConfig.handicapRules;
      }
    }

    // 确保 category 字段存在且有效
    if (!eventData.category || !['competition', 'activity', 'club'].includes(eventData.category)) {
      console.error('警告：category 字段无效或缺失', eventData);
      // 如果 category 无效，设置默认值
      eventData.category = eventData.category || 'activity';
    }

    console.log('创建事件数据:', {
      title: eventData.title,
      category: eventData.category,
      hasCategory: !!eventData.category
    });

    const event = new Event(eventData);
    
    // 验证 category 是否被正确设置
    if (!event.category) {
      console.error('错误：category 字段未设置', eventData);
      event.category = 'activity'; // 设置默认值
    }
    
    console.log('保存前的事件数据:', {
      title: event.title,
      category: event.category
    });
    
    await event.save();
    
    console.log('保存后的事件数据:', {
      id: event._id,
      title: event.title,
      category: event.category
    });

    res.status(201).json({
      success: true,
      message: '赛事创建成功',
      data: {
        event
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 更新赛事
 * PUT /api/events/:id
 */
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: '赛事不存在'
      });
    }

    // 检查权限
    if (event.organizer.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权限修改此赛事'
      });
    }

    // 处理更新数据
    const updateData = { ...req.body };
    
    // 处理八人转特殊配置
    if (updateData.rotationConfig) {
      // 如果 specialMode 是 null 或空字符串，则删除该字段
      if (updateData.rotationConfig.specialMode === null || 
          updateData.rotationConfig.specialMode === '' ||
          updateData.rotationConfig.specialMode === undefined) {
        delete updateData.rotationConfig.specialMode;
        // 如果 rotationConfig 对象为空，则设置为 undefined
        if (Object.keys(updateData.rotationConfig).length === 0) {
          delete updateData.rotationConfig;
        }
      }
      
      // 如果 handicapRules 是 null，则删除该字段
      if (updateData.rotationConfig.handicapRules === null) {
        delete updateData.rotationConfig.handicapRules;
      }
    }

    Object.assign(event, updateData);
    await event.save();

    res.json({
      success: true,
      message: '赛事更新成功',
      data: {
        event
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 删除赛事
 * DELETE /api/events/:id
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: '赛事不存在'
      });
    }

    // 检查权限
    if (event.organizer.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权限删除此赛事'
      });
    }

    // 检查是否有报名记录
    const Registration = require('../models/Registration');
    const registrationCount = await Registration.countDocuments({ event: req.params.id });
    
    if (registrationCount > 0) {
      // 如果有报名记录，可以选择：
      // 1. 不允许删除（推荐）
      // 2. 同时删除所有报名记录
      // 这里采用方案1：不允许删除已有报名的活动
      return res.status(400).json({
        success: false,
        message: `该活动已有 ${registrationCount} 人报名，无法删除。如需删除，请先取消所有报名。`
      });
    }

    // 删除活动
    await event.deleteOne();

    res.json({
      success: true,
      message: '赛事删除成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 开始比赛（生成对战组）
 * POST /api/events/:id/start
 */
router.post('/:id/start', authenticate, async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '赛事不存在'
      });
    }

    // 检查权限（只有组织者可以开始比赛）
    if (event.organizer.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权限开始此赛事'
      });
    }

    // 检查活动状态
    if (event.status === 'in_progress') {
      return res.status(400).json({
        success: false,
        message: '比赛已开始'
      });
    }

    if (event.status === 'ended' || event.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: '比赛已结束或已取消，无法开始'
      });
    }

    // 获取所有报名用户
    const Registration = require('../models/Registration');
    const registrations = await Registration.find({
      event: req.params.id,
      status: 'registered',
      paymentStatus: { $in: ['paid', 'pending'] } // 已支付或待支付（免费活动）
    }).populate('user', 'nickName avatarUrl');

    if (registrations.length < 4) {
      return res.status(400).json({
        success: false,
        message: `报名人数不足，当前 ${registrations.length} 人，至少需要 4 人才能开始比赛`
      });
    }

    // 检查是否已经生成过比赛
    const Match = require('../models/Match');
    const existingMatches = await Match.countDocuments({ event: req.params.id });
    
    if (existingMatches > 0) {
      // 如果已有比赛记录，直接更新状态
      event.status = 'in_progress';
      await event.save();
      
      return res.json({
        success: true,
        message: '比赛已开始',
        data: {
          event,
          matchesCount: existingMatches
        }
      });
    }

    // 根据不同的赛制生成对战组
    let matches = [];
    
    if (event.rotationRule === '八人转') {
      // 使用八人转排表生成
      const { generateRotationSchedule } = require('../utils/rotation');
      
      const participants = registrations.map((reg, index) => ({
        id: reg.user._id.toString(),
        name: reg.user.nickName,
        avatar: reg.user.avatarUrl,
        registrationId: reg._id.toString()
      }));

      if (participants.length < 4 || participants.length > 13) {
        return res.status(400).json({
          success: false,
          message: `参与人数 ${participants.length} 不符合八人转要求（4-13人）`
        });
      }

      // 获取特殊模式配置
      const sixPlayerMode = event.rotationConfig?.specialMode || 'standard';
      const sevenPlayerMode = event.rotationConfig?.specialMode || 'standard';
      
      const schedule = generateRotationSchedule(participants, {
        sixPlayerMode: participants.length === 6 ? sixPlayerMode : undefined,
        sevenPlayerMode: participants.length === 7 ? sevenPlayerMode : undefined,
        randomize: true
      });

      // 转换为 Match 格式
      matches = schedule.map(match => ({
        event: req.params.id,
        round: match.round,
        matchNumber: match.matchNumber,
        teamA: {
          name: match.teamA.name,
          players: match.teamA.players.map(p => p.id),
          score: 0
        },
        teamB: {
          name: match.teamB.name,
          players: match.teamB.players.map(p => p.id),
          score: 0
        },
        status: 'pending'
      }));
    } else {
      // 其他赛制（五人转、淘汰赛、分组循环）的简单配对
      // 这里先实现一个简单的配对逻辑，后续可以根据需求完善
      const participants = registrations.map(reg => reg.user._id);
      
      // 简单配对：每4人一组，分成两队
      const teams = [];
      for (let i = 0; i < participants.length; i += 4) {
        const group = participants.slice(i, i + 4);
        if (group.length >= 4) {
          teams.push({
            teamA: group.slice(0, 2),
            teamB: group.slice(2, 4)
          });
        }
      }

      matches = teams.map((team, index) => ({
        event: req.params.id,
        round: 1,
        matchNumber: index + 1,
        teamA: {
          name: `队伍A${index + 1}`,
          players: team.teamA,
          score: 0
        },
        teamB: {
          name: `队伍B${index + 1}`,
          players: team.teamB,
          score: 0
        },
        status: 'pending'
      }));

      if (matches.length === 0) {
        return res.status(400).json({
          success: false,
          message: '无法生成对战组，请确保报名人数足够'
        });
      }
    }

    // 保存比赛记录
    await Match.insertMany(matches);

    // 更新活动状态
    event.status = 'in_progress';
    await event.save();

    res.json({
      success: true,
      message: '比赛已开始，对战组已生成',
      data: {
        event,
        matchesCount: matches.length,
        totalRounds: matches.length > 0 ? Math.max(...matches.map(m => m.round)) : 0
      }
    });
  } catch (error) {
    next(error);
  }
});

// 计算距离的辅助函数
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = router;

