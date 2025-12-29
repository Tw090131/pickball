# 匹克球助手 - 后端服务

## 项目简介

这是匹克球助手小程序的 Node.js 后端服务，提供完整的 API 接口支持。

## 技术栈

- **Node.js** + **Express** - Web 框架
- **MongoDB** + **Mongoose** - 数据库
- **JWT** - 用户认证
- **微信小程序 API** - 登录和支付

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

创建 `.env` 文件并填写配置：

**Windows:**
```bash
# 复制示例文件
copy .env.example .env
# 或
copy env.example .env
```

**macOS/Linux:**
```bash
# 复制示例文件
cp .env.example .env
# 或
cp env.example .env
```

**注意**: 
- 项目中有两个示例文件：`.env.example` 和 `env.example`（内容相同）
- 复制任意一个即可
- 详细配置说明请查看 `ENV_SETUP.md`

编辑 `.env` 文件，填写以下配置：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/pickball

# JWT 密钥
JWT_SECRET=your_jwt_secret_key

# 微信小程序配置
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

# 微信支付配置
WECHAT_MCHID=your_merchant_id
WECHAT_KEY=your_merchant_key
WECHAT_NOTIFY_URL=https://your-domain.com/api/payment/notify
```

### 3. 启动 MongoDB

确保 MongoDB 服务正在运行：

```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

### 4. 启动服务

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务将在 `http://localhost:3000` 启动

## API 文档

### 认证相关

#### 微信登录
```
POST /api/auth/login
Body: { code, userInfo }
```

#### 获取当前用户
```
GET /api/auth/me
Headers: { Authorization: Bearer <token> }
```

### 赛事相关

#### 获取赛事列表
```
GET /api/events?category=competition&status=registering&page=1&limit=20
```

#### 获取赛事详情
```
GET /api/events/:id
```

#### 创建赛事
```
POST /api/events
Headers: { Authorization: Bearer <token> }
Body: { title, category, startTime, endTime, ... }
```

### 报名相关

#### 报名赛事
```
POST /api/registrations
Headers: { Authorization: Bearer <token> }
Body: { eventId, teamMode, partnerId }
```

#### 取消报名
```
DELETE /api/registrations/:id
Headers: { Authorization: Bearer <token> }
```

### 比赛相关

#### 获取比赛列表
```
GET /api/matches/event/:eventId
```

#### 更新比分
```
PUT /api/matches/:id/score
Headers: { Authorization: Bearer <token> }
Body: { scoreA, scoreB }
```

### 排名相关

#### 获取排名
```
GET /api/ranking/event/:eventId
```

### 支付相关

#### 创建支付订单
```
POST /api/payment/create
Headers: { Authorization: Bearer <token> }
Body: { registrationId }
```

## 数据库模型

### User（用户）
- openid, unionid
- nickName, avatarUrl, phoneNumber
- level, totalMatches, totalWins

### Event（赛事）
- title, category, description
- startTime, endTime, registrationDeadline
- location, latitude, longitude
- format, rotationRule, scoringSystem
- maxParticipants, currentParticipants
- organizer, status, views

### Registration（报名）
- event, user
- teamMode, partnerId
- paymentStatus, paymentAmount
- status

### Match（比赛）
- event
- teamA, teamB
- round, matchNumber
- status

## 部署

### 使用 PM2

```bash
npm install -g pm2
pm2 start app.js --name pickball-server
pm2 save
pm2 startup
```

### 使用 Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 注意事项

1. **生产环境**：确保修改 `.env` 中的密钥和配置
2. **HTTPS**：微信支付回调需要 HTTPS
3. **数据库备份**：定期备份 MongoDB 数据
4. **日志**：建议使用日志系统（如 winston）

## 开发计划

- [ ] 完善微信支付集成
- [ ] 添加文件上传功能
- [ ] 实现消息推送
- [ ] 添加数据统计
- [ ] 性能优化

## 许可证

MIT License

