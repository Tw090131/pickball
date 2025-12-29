// server/routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { authenticate } = require('../middleware/auth');

/**
 * 获取用户信息
 * GET /api/users/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-openid -unionid');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 更新用户信息
 * PUT /api/users/:id
 */
router.put('/:id', authenticate, async (req, res, next) => {
  try {
    if (req.params.id !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权限修改'
      });
    }

    const user = await User.findById(req.userId);
    Object.assign(user, req.body);
    await user.save();

    res.json({
      success: true,
      message: '更新成功',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取用户统计数据
 * GET /api/users/:id/stats
 */
router.get('/:id/stats', async (req, res, next) => {
  try {
    const userId = req.params.id;

    // 获取报名数量
    const registeredCount = await Registration.countDocuments({
      user: userId,
      status: 'registered'
    });

    // 获取创建的赛事数量
    const createdCount = await Event.countDocuments({
      organizer: userId
    });

    // 获取历史记录
    const historyCount = await Registration.countDocuments({
      user: userId,
      status: 'completed'
    });

    res.json({
      success: true,
      data: {
        stats: {
          registeredCount,
          createdCount,
          historyCount
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

