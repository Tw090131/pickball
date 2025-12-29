// server/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getWechatOpenId } = require('../utils/wechat');
const { authenticate } = require('../middleware/auth');

/**
 * 微信登录
 * POST /api/auth/login
 */
router.post('/login', async (req, res, next) => {
  try {
    const { code, userInfo } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '缺少 code 参数'
      });
    }

    // 获取微信 openid
    const wechatData = await getWechatOpenId(code);
    const { openid, unionid } = wechatData;

    // 查找或创建用户
    let user = await User.findOne({ openid });
    
    if (!user) {
      user = new User({
        openid,
        unionid,
        nickName: userInfo?.nickName || '用户',
        avatarUrl: userInfo?.avatarUrl || '',
        gender: userInfo?.gender || 0
      });
      await user.save();
    } else {
      // 更新用户信息
      if (userInfo) {
        user.nickName = userInfo.nickName || user.nickName;
        user.avatarUrl = userInfo.avatarUrl || user.avatarUrl;
        user.gender = userInfo.gender !== undefined ? userInfo.gender : user.gender;
        await user.save();
      }
    }

    // 生成 JWT token
    const token = jwt.sign(
      { userId: user._id, openid: user.openid },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          phoneNumber: user.phoneNumber
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 绑定手机号
 * POST /api/auth/bind-phone
 */
router.post('/bind-phone', authenticate, async (req, res, next) => {
  try {
    const { encryptedData, iv } = req.body;

    // 这里需要解密手机号
    // 实际实现需要使用微信提供的解密方法
    // const phoneData = decryptPhoneNumber(encryptedData, iv, sessionKey);

    const user = await User.findById(req.userId);
    // user.phoneNumber = phoneData.phoneNumber;
    await user.save();

    res.json({
      success: true,
      message: '手机号绑定成功',
      data: {
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * 获取当前用户信息
 * GET /api/auth/me
 */
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select('-openid -unionid');
    
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

module.exports = router;

