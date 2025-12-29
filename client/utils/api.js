// utils/api.js
// API 接口封装

const { request } = require('./util.js')

// API 基础地址配置
// 开发环境：使用本地服务器（需要在微信开发者工具中配置不校验合法域名）
// 生产环境：使用实际部署的服务器地址（必须 HTTPS）
const baseURL = 'http://localhost:3000/api' // 开发环境 - 本地测试
// const baseURL = 'https://api.your-domain.com/api' // 生产环境 - 部署后使用此地址

// 切换说明：
// 1. 开发时使用 localhost（需要关闭域名校验）
// 2. 部署后改为实际服务器地址
// 3. 生产环境必须使用 HTTPS
// 4. 需要在微信公众平台配置服务器域名白名单

/**
 * 获取赛事列表
 */
const getEventList = (params) => {
  return request({
    url: `${baseURL}/events`,
    method: 'GET',
    data: params
  })
}

/**
 * 获取赛事详情
 */
const getEventDetail = (eventId) => {
  return request({
    url: `${baseURL}/events/${eventId}`,
    method: 'GET'
  })
}

/**
 * 创建赛事
 */
const createEvent = (data) => {
  return request({
    url: `${baseURL}/events`,
    method: 'POST',
    data: data
  })
}

/**
 * 报名赛事
 */
const registerEvent = (data) => {
  return request({
    url: `${baseURL}/registrations`,
    method: 'POST',
    data: data
  })
}

/**
 * 获取比赛列表
 */
const getMatchList = (eventId) => {
  return request({
    url: `${baseURL}/matches/event/${eventId}`,
    method: 'GET'
  })
}

/**
 * 更新比分
 */
const updateScore = (matchId, data) => {
  return request({
    url: `${baseURL}/matches/${matchId}/score`,
    method: 'PUT',
    data: data
  })
}

/**
 * 获取排名
 */
const getRanking = (eventId) => {
  return request({
    url: `${baseURL}/ranking/event/${eventId}`,
    method: 'GET'
  })
}

/**
 * 获取晋级图
 */
const getBracket = (eventId) => {
  return request({
    url: `${baseURL}/events/${eventId}/bracket`,
    method: 'GET'
  })
}

/**
 * 微信登录
 */
const wechatLogin = (code, userInfo) => {
  return request({
    url: `${baseURL}/auth/login`,
    method: 'POST',
    data: { code, userInfo }
  })
}

/**
 * 获取当前用户信息
 */
const getCurrentUser = () => {
  return request({
    url: `${baseURL}/auth/me`,
    method: 'GET'
  })
}

/**
 * 绑定手机号
 */
const bindPhone = (encryptedData, iv, code) => {
  return request({
    url: `${baseURL}/auth/bind-phone`,
    method: 'POST',
    data: { encryptedData, iv, code }
  })
}

/**
 * 获取我的报名列表
 */
const getMyRegistrations = (status) => {
  return request({
    url: `${baseURL}/registrations/my`,
    method: 'GET',
    data: status ? { status } : {}
  })
}

/**
 * 取消报名
 */
const cancelRegistration = (registrationId) => {
  return request({
    url: `${baseURL}/registrations/${registrationId}`,
    method: 'DELETE'
  })
}

/**
 * 创建支付订单
 */
const createPayment = (registrationId) => {
  return request({
    url: `${baseURL}/payment/create`,
    method: 'POST',
    data: { registrationId }
  })
}

/**
 * 申请退款
 */
const requestRefund = (registrationId) => {
  return request({
    url: `${baseURL}/payment/refund`,
    method: 'POST',
    data: { registrationId }
  })
}

/**
 * 获取用户信息
 */
const getUserInfo = (userId) => {
  return request({
    url: `${baseURL}/users/${userId}`,
    method: 'GET'
  })
}

/**
 * 获取用户统计
 */
const getUserStats = (userId) => {
  return request({
    url: `${baseURL}/users/${userId}/stats`,
    method: 'GET'
  })
}

/**
 * 获取用户战绩
 */
const getUserRecord = (userId) => {
  return request({
    url: `${baseURL}/users/${userId}/record`,
    method: 'GET'
  })
}

/**
 * 获取我发布的活动列表
 */
const getMyCreatedEvents = (params) => {
  return request({
    url: `${baseURL}/events`,
    method: 'GET',
    data: params
  })
}

module.exports = {
  baseURL,
  getEventList,
  getEventDetail,
  createEvent,
  registerEvent,
  getMatchList,
  updateScore,
  getRanking,
  getBracket,
  wechatLogin,
  getCurrentUser,
  bindPhone,
  getMyRegistrations,
  cancelRegistration,
  createPayment,
  requestRefund,
  getUserInfo,
  getUserStats,
  getUserRecord,
  getMyCreatedEvents
}

