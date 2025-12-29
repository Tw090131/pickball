# 后端服务集成指南

## 概述

已创建完整的 Node.js 后端服务，支持所有小程序功能。

## 项目结构

```
server/
├── app.js                 # 主应用入口
├── package.json           # 依赖配置
├── .env.example          # 环境变量示例
├── models/               # 数据模型
│   ├── User.js          # 用户模型
│   ├── Event.js         # 赛事模型
│   ├── Registration.js  # 报名模型
│   └── Match.js         # 比赛模型
├── routes/               # API 路由
│   ├── auth.js          # 认证相关
│   ├── events.js        # 赛事相关
│   ├── registrations.js # 报名相关
│   ├── matches.js       # 比赛相关
│   ├── ranking.js       # 排名相关
│   ├── payment.js       # 支付相关
│   └── users.js         # 用户相关
├── middleware/           # 中间件
│   └── auth.js          # 认证中间件
└── utils/               # 工具函数
    └── wechat.js        # 微信相关工具
```

## 快速开始

### 1. 安装后端依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填写你的配置：

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/pickball
JWT_SECRET=your_secret_key_here
WECHAT_APPID=your_appid
WECHAT_SECRET=your_secret
```

### 3. 启动 MongoDB

确保 MongoDB 服务正在运行。

### 4. 启动后端服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

### 5. 更新小程序 API 配置

在小程序的 `utils/api.js` 中，API 地址已配置为：
- 开发环境：`http://localhost:3000/api`
- 生产环境：需要修改为你的服务器地址

## API 接口列表

### 认证接口

- `POST /api/auth/login` - 微信登录
- `GET /api/auth/me` - 获取当前用户信息
- `POST /api/auth/bind-phone` - 绑定手机号

### 赛事接口

- `GET /api/events` - 获取赛事列表
- `GET /api/events/:id` - 获取赛事详情
- `POST /api/events` - 创建赛事
- `PUT /api/events/:id` - 更新赛事
- `DELETE /api/events/:id` - 删除赛事

### 报名接口

- `POST /api/registrations` - 报名赛事
- `DELETE /api/registrations/:id` - 取消报名
- `GET /api/registrations/my` - 获取我的报名列表
- `GET /api/registrations/event/:eventId` - 获取赛事报名列表

### 比赛接口

- `GET /api/matches/event/:eventId` - 获取比赛列表
- `POST /api/matches` - 创建比赛
- `PUT /api/matches/:id/score` - 更新比分
- `PUT /api/matches/:id/complete` - 完成比赛

### 排名接口

- `GET /api/ranking/event/:eventId` - 获取排名

### 支付接口

- `POST /api/payment/create` - 创建支付订单
- `POST /api/payment/notify` - 支付回调
- `POST /api/payment/refund` - 申请退款

### 用户接口

- `GET /api/users/:id` - 获取用户信息
- `PUT /api/users/:id` - 更新用户信息
- `GET /api/users/:id/stats` - 获取用户统计

## 小程序集成步骤

### 1. 更新 API 调用

在小程序的各个页面中，将模拟数据替换为真实的 API 调用。

例如，在 `pages/index/index.js` 中：

```javascript
// 之前（模拟数据）
loadEvents(callback) {
  const mockEvents = this.getMockEvents();
  // ...
}

// 之后（真实 API）
async loadEvents(callback) {
  try {
    const { request } = require('../../utils/util');
    const { getEventList } = require('../../utils/api');
    
    const res = await getEventList({
      category: this.data.currentCategory === 'all' ? null : this.data.currentCategory,
      sortBy: this.data.sortBy,
      latitude: app.globalData.location?.latitude,
      longitude: app.globalData.location?.longitude
    });
    
    if (res.success) {
      this.setData({
        events: res.data.events,
        loading: false
      }, () => {
        this.filterAndSort();
        if (callback) callback();
      });
    }
  } catch (err) {
    console.error('加载失败', err);
    // 错误处理
  }
}
```

### 2. 添加认证

在需要登录的页面，添加认证检查：

```javascript
onLoad() {
  // 检查是否登录
  const token = wx.getStorageSync('token');
  if (!token) {
    // 跳转到登录页或提示登录
    wx.navigateTo({
      url: '/pages/login/login'
    });
    return;
  }
  
  // 设置请求头
  // 在 utils/util.js 的 request 函数中自动添加
}
```

### 3. 更新请求工具

确保 `utils/util.js` 中的 `request` 函数会自动添加认证 token：

```javascript
const request = (options) => {
  return new Promise((resolve, reject) => {
    // 获取 token
    const token = wx.getStorageSync('token');
    
    wx.request({
      url: options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.header
      },
      // ...
    });
  });
};
```

## 测试

### 使用 Postman 测试 API

1. 导入 API 集合
2. 设置环境变量（baseURL, token）
3. 测试各个接口

### 小程序测试

1. 启动后端服务
2. 在小程序中测试各个功能
3. 查看后端日志确认请求

## 部署

参考 `server/DEPLOYMENT.md` 进行部署。

## 注意事项

1. **开发环境**：小程序需要配置服务器域名白名单
2. **HTTPS**：生产环境必须使用 HTTPS（微信要求）
3. **支付回调**：需要配置正确的回调 URL
4. **数据库**：定期备份 MongoDB 数据

## 常见问题

### Q: 小程序无法连接服务器？
A: 检查服务器是否启动，检查域名是否在白名单中

### Q: 登录失败？
A: 检查 AppID 和 Secret 是否正确配置

### Q: 支付失败？
A: 检查商户号和密钥是否正确，检查回调 URL 是否可访问

## 下一步

- [ ] 完善微信支付集成
- [ ] 添加文件上传功能
- [ ] 实现消息推送
- [ ] 添加数据统计和分析



