# 快速部署指南

## 最简单的部署方式

### 方式一：使用 Vercel（推荐新手）

1. **注册 Vercel 账号**
   - 访问 https://vercel.com
   - 使用 GitHub 账号登录

2. **部署步骤**
   ```bash
   # 安装 Vercel CLI
   npm i -g vercel
   
   # 在 server 目录下
   cd server
   vercel
   
   # 按提示操作
   # - 是否部署到当前目录？ Yes
   # - 项目名称？ pickball-server
   # - 是否覆盖设置？ No
   ```

3. **配置环境变量**
   - 在 Vercel 控制台 -> Settings -> Environment Variables
   - 添加所有 .env 中的变量

4. **获取部署地址**
   - 部署完成后会得到一个地址：`https://xxx.vercel.app`
   - 这就是你的 API 地址

5. **更新小程序配置**
   ```javascript
   // utils/api.js
   const baseURL = 'https://xxx.vercel.app/api'
   ```

### 方式二：使用 Railway（推荐，支持数据库）

1. **注册 Railway 账号**
   - 访问 https://railway.app
   - 使用 GitHub 账号登录

2. **创建项目**
   - New Project -> Deploy from GitHub repo
   - 选择你的仓库

3. **添加 MongoDB**
   - New -> Database -> Add MongoDB
   - 会自动创建数据库并设置 MONGODB_URI

4. **配置环境变量**
   - Variables -> 添加其他环境变量

5. **部署**
   - Railway 会自动部署
   - 会生成一个域名：`https://xxx.up.railway.app`

### 方式三：使用 Render（免费额度）

1. **注册 Render 账号**
   - 访问 https://render.com

2. **创建 Web Service**
   - New -> Web Service
   - 连接 GitHub 仓库
   - 设置：
     - Build Command: `cd server && npm install`
     - Start Command: `cd server && node app.js`

3. **添加 MongoDB**
   - New -> MongoDB
   - 会自动设置 MONGODB_URI

4. **配置环境变量**
   - Environment -> 添加变量

## 国内推荐：腾讯云 Serverless

1. **注册腾讯云账号**
   - 访问 https://cloud.tencent.com

2. **创建云函数**
   - 云开发 -> 云函数
   - 新建云函数

3. **上传代码**
   - 将 server 目录打包上传

4. **配置环境变量**
   - 在函数配置中添加

## 部署检查清单

- [ ] 服务器正常运行
- [ ] 数据库连接成功
- [ ] 环境变量配置正确
- [ ] HTTPS 证书配置（生产环境）
- [ ] 微信公众平台配置服务器域名
- [ ] 小程序 API 地址更新
- [ ] 测试所有接口

## 常见问题

### Q: 本地可以访问，小程序无法访问？
A: 检查服务器域名是否在微信公众平台白名单中

### Q: 提示 HTTPS 错误？
A: 生产环境必须使用 HTTPS，配置 SSL 证书

### Q: 数据库连接失败？
A: 检查 MONGODB_URI 是否正确，检查数据库是否允许远程连接

### Q: 部署后接口 404？
A: 检查路由配置，确保 API 路径正确

