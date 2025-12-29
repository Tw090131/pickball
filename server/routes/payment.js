   // server/routes/payment.js
const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const { authenticate } = require('../middleware/auth');
const crypto = require('crypto');
const axios = require('axios');

/**
 * 创建支付订单
 * POST /api/payment/create
 */
router.post('/create', authenticate, async (req, res, next) => {
  try {
    const { registrationId } = req.body;

    const registration = await Registration.findById(registrationId)
      .populate('event')
      .populate('user');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '报名记录不存在'
      });
    }

    // 检查权限
    if (registration.user._id.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: '无权限'
      });
    }

    // 检查是否已支付
    if (registration.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: '已支付'
      });
    }

    // 生成订单号
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 调用微信支付统一下单接口
    // 这里需要实现微信支付统一下单
    const paymentParams = {
      appid: process.env.WECHAT_APPID,
      mch_id: process.env.WECHAT_MCHID,
      nonce_str: Math.random().toString(36).substr(2, 15),
      body: `报名费-${registration.event.title}`,
      out_trade_no: orderId,
      total_fee: registration.paymentAmount * 100, // 转换为分
      spbill_create_ip: req.ip,
      notify_url: process.env.WECHAT_NOTIFY_URL,
      trade_type: 'JSAPI',
      openid: registration.user.openid
    };

    // 生成签名
    const sign = generateSign(paymentParams, process.env.WECHAT_KEY);

    // 调用微信支付接口
    // 实际实现需要使用 xml 格式请求
    // const paymentResult = await callWechatPay(paymentParams, sign);

    // 更新报名记录
    registration.paymentOrderId = orderId;
    await registration.save();

    // 返回支付参数（实际应该返回微信支付返回的参数）
    res.json({
      success: true,
      data: {
        orderId,
        paymentParams: {
          // 这里应该返回微信支付需要的参数
          timeStamp: Math.floor(Date.now() / 1000).toString(),
          nonceStr: paymentParams.nonce_str,
          package: `prepay_id=${orderId}`,
          signType: 'MD5',
          paySign: sign
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 支付回调
 * POST /api/payment/notify
 */
router.post('/notify', async (req, res, next) => {
  try {
    // 验证签名
    // 处理微信支付回调
    // 更新报名记录的支付状态

    res.send('<xml><return_code><![CDATA[SUCCESS]]></return_code></xml>');
  } catch (error) {
    next(error);
  }
});

/**
 * 申请退款
 * POST /api/payment/refund
 */
router.post('/refund', authenticate, async (req, res, next) => {
  try {
    const { registrationId } = req.body;

    const registration = await Registration.findById(registrationId)
      .populate('event');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: '报名记录不存在'
      });
    }

    // 检查是否可以退款（报名截止时间前）
    const now = new Date();
    if (now >= registration.event.registrationDeadline) {
      return res.status(400).json({
        success: false,
        message: '已过退款期限'
      });
    }

    // 调用微信退款接口
    // 实际实现需要调用微信退款 API

    // 更新状态
    registration.paymentStatus = 'refunded';
    await registration.save();

    res.json({
      success: true,
      message: '退款申请成功'
    });
  } catch (error) {
    next(error);
  }
});

// 生成签名
function generateSign(params, key) {
  // 微信支付签名算法
  const sortedKeys = Object.keys(params).sort();
  const stringA = sortedKeys
    .filter(k => params[k] && k !== 'sign')
    .map(k => `${k}=${params[k]}`)
    .join('&');
  const stringSignTemp = `${stringA}&key=${key}`;
  return crypto.createHash('md5').update(stringSignTemp).digest('hex').toUpperCase();
}

module.exports = router;

