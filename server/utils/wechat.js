// server/utils/wechat.js
const axios = require('axios');
const crypto = require('crypto');

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
 * @param {String} encryptedData - 加密数据
 * @param {String} iv - 初始向量
 * @param {String} sessionKey - 会话密钥
 * @returns {Object} 解密后的手机号信息
 */
function decryptPhoneNumber(encryptedData, iv, sessionKey) {
  try {
    // Base64 解码
    const encryptedBuffer = Buffer.from(encryptedData, 'base64');
    const ivBuffer = Buffer.from(iv, 'base64');
    const sessionKeyBuffer = Buffer.from(sessionKey, 'base64');

    // AES-128-CBC 解密
    const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuffer, ivBuffer);
    decipher.setAutoPadding(true);
    
    let decrypted = decipher.update(encryptedBuffer, 'binary', 'utf8');
    decrypted += decipher.final('utf8');
    
    const phoneData = JSON.parse(decrypted);
    
    return {
      phoneNumber: phoneData.phoneNumber || '',
      purePhoneNumber: phoneData.purePhoneNumber || phoneData.phoneNumber || '',
      countryCode: phoneData.countryCode || '86'
    };
  } catch (error) {
    console.error('解密手机号失败:', error);
    throw new Error('解密手机号失败');
  }
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

