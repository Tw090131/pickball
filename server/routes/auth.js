// server/routes/auth.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getWechatOpenId, decryptPhoneNumber } = require('../utils/wechat');
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

    // 注意：实际应用中，session_key 应该存储在 Redis 中，key 为 openid
    // 这里简化处理，不存储 session_key（因为每次登录都会获取新的）

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

    if (!encryptedData || !iv) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    // 获取用户的 session_key（需要从登录时保存）
    // 注意：实际应用中，session_key 应该存储在 Redis 或数据库中
    // 这里简化处理，需要从用户登录时保存的 session_key 获取
    const user = await User.findById(req.userId);
    
    if (!user.openid) {
      return res.status(400).json({
        success: false,
        message: '用户未绑定微信'
      });
    }

    // 重新获取 session_key（实际应该从缓存中获取）
    // 这里需要前端传递 code 来获取新的 session_key
    // 或者从登录时保存的 session_key 中获取
    // 简化版本：需要前端在绑定手机号时重新调用 wx.login 获取 code
    // 然后后端通过 code 获取 session_key
    
    // 临时方案：如果前端传递了 code，使用 code 获取 session_key
    const { code } = req.body;
    let sessionKey;
    
    if (code) {
      const wechatData = await getWechatOpenId(code);
      sessionKey = wechatData.session_key;
    } else {
      // 实际应该从缓存中获取，这里返回错误提示前端传递 code
      return res.status(400).json({
        success: false,
        message: '需要重新获取授权，请重试'
      });
    }

    // 解密手机号
    const phoneData = decryptPhoneNumber(encryptedData, iv, sessionKey);
    
    // 更新用户手机号
    user.phoneNumber = phoneData.purePhoneNumber || phoneData.phoneNumber;
    await user.save();

    res.json({
      success: true,
      message: '手机号绑定成功',
      data: {
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    console.error('绑定手机号失败:', error);
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

