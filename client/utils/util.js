// utils/util.js

/**
 * 格式化时间
 */
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('/')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

/**
 * 格式化日期
 */
const formatDate = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()

  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
}

/**
 * 补零
 */
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

/**
 * 计算距离（公里）
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371 // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * 防抖函数
 */
const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * 节流函数
 */
const throttle = (func, limit) => {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

/**
 * 显示加载提示
 */
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title: title,
    mask: true
  })
}

/**
 * 隐藏加载提示
 */
const hideLoading = () => {
  wx.hideLoading()
}

/**
 * 显示成功提示
 */
const showSuccess = (title, duration = 2000) => {
  wx.showToast({
    title: title,
    icon: 'success',
    duration: duration
  })
}

/**
 * 显示错误提示
 */
const showError = (title, duration = 2000) => {
  wx.showToast({
    title: title,
    icon: 'none',
    duration: duration
  })
}

/**
 * HTTP请求封装
 */
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 参数验证
    if (!options || !options.url) {
      reject(new Error('请求参数错误：缺少 url'));
      return;
    }

    // 获取 token
    const token = wx.getStorageSync('token');

    // 显示加载提示（可选）
    if (options.showLoading !== false) {
      showLoading(options.loadingText || '加载中...');
    }

    wx.request({
      url: options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      timeout: options.timeout || 10000, // 默认10秒超时
      success: (res) => {
        if (options.showLoading !== false) {
          hideLoading();
        }

        // 处理不同的状态码
        if (res.statusCode === 200) {
          // 可以根据业务需求检查 res.data 中的 code
          if (res.data && res.data.code !== undefined) {
            if (res.data.code === 0 || res.data.code === 200) {
              resolve(res.data);
            } else {
              reject({
                code: res.data.code,
                message: res.data.message || '请求失败',
                data: res.data
              });
            }
          } else {
            resolve(res.data);
          }
        } else if (res.statusCode === 401) {
          // 未授权，可以跳转到登录页
          reject({
            code: 401,
            message: '未授权，请重新登录',
            data: res.data
          });
        } else if (res.statusCode >= 500) {
          reject({
            code: res.statusCode,
            message: '服务器错误，请稍后重试',
            data: res.data
          });
        } else {
          reject({
            code: res.statusCode,
            message: res.data?.message || '请求失败',
            data: res.data
          });
        }
      },
      fail: (err) => {
        if (options.showLoading !== false) {
          hideLoading();
        }

        // 网络错误处理
        let errorMessage = '网络错误，请检查网络连接';
        if (err.errMsg) {
          if (err.errMsg.includes('timeout')) {
            errorMessage = '请求超时，请稍后重试';
          } else if (err.errMsg.includes('fail')) {
            errorMessage = '网络连接失败，请检查网络';
          }
        }

        reject({
          code: -1,
          message: errorMessage,
          error: err
        });
      }
    });
  });
}

module.exports = {
  formatTime,
  formatDate,
  formatNumber,
  calculateDistance,
  debounce,
  throttle,
  showLoading,
  hideLoading,
  showSuccess,
  showError,
  request
}

