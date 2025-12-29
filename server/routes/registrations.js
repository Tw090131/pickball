// server/routes/registrations.js
const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const { authenticate } = require('../middleware/auth');

/**
 * 报名赛事
 * POST /api/registrations
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { eventId, teamMode, partnerId, partnerName } = req.body;

    // 检查赛事是否存在
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: '赛事不存在'
      });
    }

    // 检查是否已报名
    const existingRegistration = await Registration.findOne({
      event: eventId,
      user: req.userId
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: '您已经报名此赛事'
      });
    }

    // 检查是否已满
    if (event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: '报名已满'
      });
    }

    // 检查报名截止时间
    if (new Date() > event.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: '报名已截止'
      });
    }

    // 根据 feeMode 判断是否需要支付
    let needPayment = false;
    let paymentAmount = 0;
    let paymentStatus = 'paid'; // 默认已支付（免费或AA）
    
    if (event.feeMode === 'prepay') {
      // 赛前收款，需要支付
      needPayment = true;
      paymentAmount = event.registrationFee || 0;
      paymentStatus = 'pending'; // 待支付
    } else if (event.feeMode === 'aa') {
      // 赛后AA，不需要支付
      needPayment = false;
      paymentAmount = 0;
      paymentStatus = 'paid'; // 标记为已支付，因为不需要预付款
    } else {
      // 免费参与或旧数据兼容
      needPayment = false;
      paymentAmount = 0;
      paymentStatus = 'paid';
      
      // 兼容旧数据：如果没有 feeMode，根据 registrationFee 判断
      if (!event.feeMode && event.registrationFee > 0) {
        needPayment = true;
        paymentAmount = event.registrationFee;
        paymentStatus = 'pending';
      }
    }

    // 创建报名记录
    const registration = new Registration({
      event: eventId,
      user: req.userId,
      teamMode: teamMode || 'random',
      partnerId: partnerId || null,
      partnerName: partnerName || '',
      paymentAmount: paymentAmount,
      paymentStatus: paymentStatus
    });

    await registration.save();

    // 更新赛事报名人数
    event.currentParticipants += 1;
    await event.save();

    res.status(201).json({
      success: true,
      message: '报名成功',
      data: {
        registration
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 取消报名
 * DELETE /api/registrations/:id
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const registration = await Registration.findById(req.params.id)
      .populate('event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '报名记录不存在'
      });
    }

    // 检查权限
    if (registration.user.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权限取消此报名'
      });
    }

    // 检查是否可以取消（比赛开始前可以取消）
    const event = registration.event;
    if (new Date() >= event.startTime) {
      return res.status(400).json({
        success: false,
        message: '比赛已开始，无法取消报名'
      });
    }

    // 更新赛事报名人数
    event.currentParticipants = Math.max(0, event.currentParticipants - 1);
    await event.save();

    // 删除报名记录
    await registration.deleteOne();

    res.json({
      success: true,
      message: '取消报名成功'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取我的报名列表
 * GET /api/registrations/my
 */
router.get('/my', authenticate, async (req, res, next) => {
  try {
    const { status } = req.query;

    const query = { user: req.userId };
    if (status) {
      query.status = status;
    }

    const registrations = await Registration.find(query)
      .populate('event')
      .populate('partnerId', 'nickName avatarUrl')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        registrations
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取赛事报名列表
 * GET /api/registrations/event/:eventId
 */
router.get('/event/:eventId', async (req, res, next) => {
  try {
    const registrations = await Registration.find({ event: req.params.eventId })
      .populate('user', 'nickName avatarUrl')
      .populate('partnerId', 'nickName avatarUrl')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: {
        registrations
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

