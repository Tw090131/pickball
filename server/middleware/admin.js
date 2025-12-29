// server/middleware/admin.js
// 管理员权限中间件

const { authenticate } = require('./auth');
const Event = require('../models/Event');

/**
 * 检查是否为赛事组织者
 */
const isOrganizer = async (req, res, next) => {
  try {
    const eventId = req.params.id || req.body.eventId;
    
    if (!eventId) {
      return res.status(400).json({
        success: false,
        message: '缺少赛事ID'
      });
    }

    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '赛事不存在'
      });
    }

    // 检查是否为组织者
    if (event.organizer.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权限：只有组织者可以执行此操作'
      });
    }

    req.event = event;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 检查是否为组织者或管理员（组合中间件）
 */
const isOrganizerOrAdmin = [
  authenticate,
  isOrganizer
];

module.exports = {
  isOrganizer,
  isOrganizerOrAdmin
};

