// server/utils/wechat.js
const axios = require('axios');
const crypto = require('crypto');

/**
 * 微信登录 - 通过 code 获取 openid
 */
async function getWechatOpenId(code) {
  try {
    // 验证环境变量
    if (!process.env.WECHAT_APPID || !process.env.WECHAT_SECRET) {
      throw new Error('微信配置错误：请检查 WECHAT_APPID 和 WECHAT_SECRET 环境变量');
    }

    // 验证 code
    if (!code || typeof code !== 'string' || code.length === 0) {
      throw new Error('无效的 code：code 不能为空');
    }

    console.log('开始获取微信 openid，AppID:', process.env.WECHAT_APPID);
    console.log('Code 长度:', code.length);

    const response = await axios.get('https://api.weixin.qq.com/sns/jscode2session', {
      params: {
        appid: process.env.WECHAT_APPID,
        secret: process.env.WECHAT_SECRET,
        js_code: code,
        grant_type: 'authorization_code'
      },
      timeout: 10000 // 10秒超时
    });

    // 检查微信 API 返回的错误
    if (response.data.errcode) {
      const errorCode = response.data.errcode;
      const errorMsg = response.data.errmsg;
      
      console.error('微信 API 返回错误:', {
        errcode: errorCode,
        errmsg: errorMsg,
        code: code.substring(0, 10) + '...' // 只显示前10个字符
      });

      // 根据错误码提供更详细的错误信息
      let errorMessage = errorMsg || '微信登录失败';
      switch (errorCode) {
        case 40029:
          errorMessage = 'code 无效或已过期（code 只能使用一次，且5分钟内有效）';
          break;
        case 45011:
          errorMessage = 'API 调用太频繁，请稍后再试';
          break;
        case 40163:
          errorMessage = 'code 已被使用';
          break;
        case 40013:
          errorMessage = 'AppID 无效，请检查配置';
          break;
        case 40125:
          errorMessage = 'AppSecret 无效，请检查配置';
          break;
        default:
          errorMessage = `微信登录失败 (${errorCode}): ${errorMsg}`;
      }

      throw new Error(errorMessage);
    }

    // 验证返回数据
    if (!response.data.openid) {
      throw new Error('微信登录失败：未获取到 openid');
    }

    console.log('成功获取 openid:', response.data.openid);

    return {
      openid: response.data.openid,
      session_key: response.data.session_key,
      unionid: response.data.unionid
    };
  } catch (error) {
    // 如果是 axios 错误，提供更详细的信息
    if (error.response) {
      console.error('微信 API 请求失败:', {
        status: error.response.status,
        data: error.response.data
      });
      throw new Error(`微信 API 请求失败: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('微信 API 请求超时或网络错误');
      throw new Error('网络请求失败，请检查网络连接');
    } else {
      // 其他错误（包括我们抛出的错误）
      console.error('获取微信 openid 失败:', error.message);
      throw error;
    }
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

