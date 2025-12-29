// server/routes/handicap.js
// 让分管理接口

const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const { authenticate } = require('../middleware/auth');
const { isOrganizer } = require('../middleware/admin');

/**
 * 设置让分规则
 * PUT /api/handicap/event/:eventId
 */
router.put('/event/:eventId', authenticate, isOrganizer, async (req, res, next) => {
  try {
    const { enabled, rules } = req.body;

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '赛事不存在'
      });
    }

    // 更新让分配置
    if (!event.rotationConfig) {
      event.rotationConfig = {};
    }

    event.rotationConfig.enableHandicap = enabled || false;
    event.rotationConfig.handicapRules = rules || null;

    await event.save();

    res.json({
      success: true,
      message: '让分规则设置成功',
      data: {
        event: {
          id: event._id,
          rotationConfig: event.rotationConfig
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取让分规则
 * GET /api/handicap/event/:eventId
 */
router.get('/event/:eventId', async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id).select('rotationConfig');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '赛事不存在'
      });
    }

    res.json({
      success: true,
      data: {
        enabled: event.rotationConfig?.enableHandicap || false,
        rules: event.rotationConfig?.handicapRules || null
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取预设让分规则模板
 * GET /api/handicap/templates
 */
router.get('/templates', async (req, res, next) => {
  try {
    const templates = [
      {
        id: 'gender_female_advantage',
        name: '女选手优势',
        description: '女选手获胜时额外获得1分',
        type: 'female_advantage',
        points: 1
      },
      {
        id: 'gender_male_penalty',
        name: '男选手让分',
        description: '男选手需多赢1球才能获胜',
        type: 'male_penalty',
        points: 1
      },
      {
        id: 'level_handicap',
        name: '等级让分',
        description: '根据等级差异自动让分',
        type: 'level_based',
        rules: {
          levelDiff: [1, 2, 3],
          points: [1, 2, 3]
        }
      }
    ];

    res.json({
      success: true,
      data: {
        templates
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

