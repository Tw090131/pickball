// server/utils/wechat.js
const axios = require('axios');

/**
 * 微信登录 - 通过 code 获取 openid
 */
async function getWechatOpenId(code) {
  try {
    const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WECHAT_APPID,
        secret: process.env.WECHAT_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      }
    });

    if (response.data.errcode) {
      throw new Error(response.data.errmsg || '微信登录失败');
    }

    return {
      openid: response.data.openid,
      session_key: response.data.session_key,
      unionid: response.data.unionid
    };
  } catch (error) {
    console.error('获取微信 openid 失败:', error);
    throw error;
  }
}

/**
 * 解密手机号
 */
function decryptPhoneNumber(encryptedData, iv, sessionKey) {
  // 这里需要使用微信提供的解密算法
  // 实际实现需要使用 crypto 模块
  // 简化版本，实际应该使用正确的解密方法
  return {
    phoneNumber: '',
    purePhoneNumber: '',
    countryCode: '86'
  };
}

/**
 * 生成微信支付签名
 */
function generatePaySign(params, key) {
  // 微信支付签名算法
  // 1. 参数排序
  // 2. 拼接字符串
  // 3. MD5 加密
  // 实际实现需要使用 crypto 模块
  return '';
}

module.exports = {
  getWechatOpenId,
  decryptPhoneNumber,
  generatePaySign
};

