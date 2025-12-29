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
    if (category && category !== 'all') {
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
    let events = await Event.find(query)
      .populate('organizer', 'nickName avatarUrl')
      .sort({ [sortBy]: sortBy === 'startTime' ? 1 : -1 })
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
      id: event._id,
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

    const eventData = {
      ...req.body,
      organizer: req.userId,
      organizerName: req.user.nickName,
      organizerAvatar: req.user.avatarUrl,
      currentParticipants: 0,
      status: 'registering'
    };

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

    const event = new Event(eventData);
    await event.save();

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

    await event.deleteOne();

    res.json({
      success: true,
      message: '赛事删除成功'
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

