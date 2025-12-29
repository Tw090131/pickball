# 环境变量配置指南

## 快速开始

### 方法一：复制示例文件

**Windows:**
```bash
copy env.example .env
```

**macOS/Linux:**
```bash
cp env.example .env
```

### 方法二：手动创建

在 `server` 目录下创建 `.env` 文件，复制以下内容：

```env
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/pickball

# JWT 密钥
JWT_SECRET=your_jwt_secret_key_change_in_production

# 微信小程序配置
WECHAT_APPID=your_wechat_appid
WECHAT_SECRET=your_wechat_secret

# 微信支付配置（可选）
WECHAT_MCHID=your_merchant_id
WECHAT_KEY=your_merchant_key
WECHAT_NOTIFY_URL=https://your-domain.com/api/payment/notify

# 文件上传配置（可选）
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880

# API 基础地址（可选）
API_BASE_URL=http://localhost:3000/api
```

## 配置说明

### 必需配置

#### 1. PORT（端口）
```env
PORT=3000
```
- 服务器监听端口
- 默认：3000
- 生产环境建议使用 80 或 443（需要 root 权限）

#### 2. NODE_ENV（环境）
```env
NODE_ENV=development  # 开发环境
NODE_ENV=production   # 生产环境
```

#### 3. MONGODB_URI（数据库）
```env
# 本地开发
MONGODB_URI=mongodb://localhost:27017/pickball

# 云数据库（MongoDB Atlas）
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pickball

# 带认证的本地数据库
MONGODB_URI=mongodb://username:password@localhost:27017/pickball
```

#### 4. JWT_SECRET（JWT 密钥）
```env
JWT_SECRET=your_jwt_secret_key_change_in_production
```

**生成强随机密钥：**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OpenSSL
openssl rand -hex 32
```

**⚠️ 重要：生产环境必须使用强随机字符串！**

#### 5. WECHAT_APPID 和 WECHAT_SECRET（微信配置）
```env
WECHAT_APPID=wx1234567890abcdef
WECHAT_SECRET=your_wechat_secret_key
```

**获取方法：**
1. 登录 [微信公众平台](https://mp.weixin.qq.com/)
2. 开发 -> 开发管理 -> 开发设置
3. 查看 AppID 和 AppSecret

### 可选配置

#### 微信支付配置
如果不需要支付功能，可以不配置：

```env
WECHAT_MCHID=1234567890
WECHAT_KEY=your_merchant_key
WECHAT_NOTIFY_URL=https://your-domain.com/api/payment/notify
```

**获取方法：**
1. 登录 [微信支付商户平台](https://pay.weixin.qq.com/)
2. 账户中心 -> API 安全 -> 设置密钥
3. 商户号在账户中心查看

#### 文件上传配置
```env
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=5242880  # 5MB
```

## 配置检查清单

- [ ] `.env` 文件已创建
- [ ] `MONGODB_URI` 已配置（本地或云数据库）
- [ ] `JWT_SECRET` 已设置（生产环境使用强随机字符串）
- [ ] `WECHAT_APPID` 和 `WECHAT_SECRET` 已配置
- [ ] 微信支付配置（如需要）
- [ ] `NODE_ENV` 设置为 `production`（生产环境）

## 安全注意事项

1. **不要提交 `.env` 到 Git**
   - `.env` 文件已在 `.gitignore` 中
   - 只提交 `env.example` 作为模板

2. **生产环境密钥**
   - 使用强随机字符串
   - 定期更换密钥
   - 不要使用默认值

3. **数据库连接**
   - 生产环境使用强密码
   - 限制数据库访问 IP
   - 使用 SSL 连接（云数据库）

4. **HTTPS**
   - 生产环境必须使用 HTTPS
   - 微信支付回调需要 HTTPS

## 验证配置

启动服务后，检查日志：

```bash
npm run dev
```

如果看到：
```
✅ 数据库连接成功
🚀 服务器运行在 http://localhost:3000
```

说明配置正确。

如果看到错误：
- `数据库连接失败` → 检查 `MONGODB_URI`
- `JWT 错误` → 检查 `JWT_SECRET`
- `微信登录失败` → 检查 `WECHAT_APPID` 和 `WECHAT_SECRET`

## 常见问题

### Q: .env 文件不生效？
A: 
1. 确保文件在 `server` 目录下
2. 确保文件名是 `.env`（不是 `env` 或 `.env.txt`）
3. 重启服务

### Q: 如何在不同环境使用不同配置？
A: 可以创建多个文件：
- `.env.development` - 开发环境
- `.env.production` - 生产环境

然后在代码中根据 `NODE_ENV` 加载对应文件。

### Q: Windows 无法创建 .env 文件？
A: 
1. 使用命令行：`type nul > .env`
2. 或使用编辑器创建，保存时文件名输入 `.env.`（注意末尾的点）

