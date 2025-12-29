# 后端服务部署方案

## 部署方式选择

后端服务需要单独部署到服务器，有以下几种部署方案：

## 方案一：云服务器部署（推荐）

### 适合场景
- 需要完全控制服务器
- 需要自定义配置
- 预算充足

### 推荐平台
- **阿里云 ECS** - 国内访问快，稳定
- **腾讯云 CVM** - 与微信生态集成好
- **AWS EC2** - 国际服务
- **DigitalOcean** - 性价比高

### 部署步骤

1. **购买云服务器**
   - 配置：2核4G，50G SSD
   - 系统：Ubuntu 20.04 LTS 或 CentOS 7

2. **服务器初始化**
   ```bash
   # 更新系统
   sudo apt update && sudo apt upgrade -y
   
   # 安装 Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # 安装 MongoDB
   wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
   echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
   sudo apt-get update
   sudo apt-get install -y mongodb-org
   sudo systemctl start mongod
   sudo systemctl enable mongod
   
   # 安装 PM2
   sudo npm install -g pm2
   ```

3. **部署代码**
   ```bash
   # 克隆项目
   git clone <your-repo-url>
   cd pickball/server
   
   # 安装依赖
   npm install --production
   
   # 配置环境变量
   cp .env.example .env
   nano .env  # 编辑配置
   
   # 启动服务
   pm2 start app.js --name pickball-server
   pm2 save
   pm2 startup
   ```

4. **配置 Nginx 反向代理**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/pickball
   ```
   
   Nginx 配置：
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   
   ```bash
   sudo ln -s /etc/nginx/sites-available/pickball /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

5. **配置 HTTPS（必需）**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

## 方案二：Serverless 部署

### 适合场景
- 初期用户量小
- 成本敏感
- 不想管理服务器

### 推荐平台
- **Vercel** - 简单易用，自动 HTTPS
- **Railway** - 支持数据库
- **Render** - 免费额度
- **腾讯云 Serverless** - 国内访问快

### Vercel 部署示例

1. **安装 Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **创建 vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "app.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "app.js"
       }
     ]
   }
   ```

3. **部署**
   ```bash
   vercel
   ```

## 方案三：容器化部署

### 适合场景
- 需要快速扩展
- 多环境部署
- 微服务架构

### Docker 部署

1. **创建 Dockerfile**
   ```dockerfile
   FROM node:18-alpine
   
   WORKDIR /app
   
   COPY package*.json ./
   RUN npm install --production
   
   COPY . .
   
   EXPOSE 3000
   
   CMD ["node", "app.js"]
   ```

2. **创建 docker-compose.yml**
   ```yaml
   version: '3.8'
   
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NODE_ENV=production
         - MONGODB_URI=mongodb://mongo:27017/pickball
       depends_on:
         - mongo
       
     mongo:
       image: mongo:6.0
       volumes:
         - mongo-data:/data/db
       ports:
         - "27017:27017"
   
   volumes:
     mongo-data:
   ```

3. **部署**
   ```bash
   docker-compose up -d
   ```

### 容器平台
- **Docker Hub** + 云服务器
- **阿里云容器服务**
- **腾讯云容器服务**

## 方案四：PaaS 平台部署

### 推荐平台
- **Heroku** - 国际平台，简单
- **阿里云函数计算** - Serverless
- **腾讯云云开发** - 与微信集成好

### Heroku 部署示例

1. **安装 Heroku CLI**
   ```bash
   # 下载安装 Heroku CLI
   ```

2. **创建 Procfile**
   ```
   web: node app.js
   ```

3. **部署**
   ```bash
   heroku login
   heroku create pickball-server
   heroku config:set NODE_ENV=production
   heroku config:set MONGODB_URI=your_mongodb_uri
   git push heroku main
   ```

## 成本对比

| 方案 | 月成本 | 适用场景 |
|------|--------|----------|
| 云服务器 | ¥50-200 | 中大型项目 |
| Serverless | ¥0-50 | 小型项目 |
| 容器服务 | ¥100-300 | 大型项目 |
| PaaS | ¥0-100 | 快速上线 |

## 小程序配置

部署完成后，需要在小程序中配置服务器地址：

### 1. 更新 API 地址

在 `utils/api.js` 中：

```javascript
const baseURL = 'https://your-domain.com/api'
```

### 2. 配置服务器域名

在微信公众平台配置：
- 登录微信公众平台
- 开发 -> 开发管理 -> 开发设置
- 服务器域名 -> 修改
- 添加你的域名到 request 合法域名

### 3. 配置 HTTPS

- 必须使用 HTTPS（微信要求）
- 可以使用 Let's Encrypt 免费证书
- 或购买商业 SSL 证书

## 推荐方案

### 初期（用户 < 1000）
- **Vercel** 或 **Render**（免费额度）
- 或 **腾讯云 Serverless**（国内访问快）

### 成长期（用户 1000-10000）
- **阿里云 ECS** 或 **腾讯云 CVM**
- 配置：2核4G，按量付费

### 成熟期（用户 > 10000）
- **云服务器集群**
- **负载均衡**
- **CDN 加速**

## 注意事项

1. **数据库备份**：定期备份 MongoDB
2. **监控告警**：设置服务器监控
3. **日志管理**：使用日志服务
4. **安全防护**：配置防火墙，定期更新

## 快速部署脚本

创建 `deploy.sh`：

```bash
#!/bin/bash
echo "开始部署..."

# 拉取最新代码
git pull

# 安装依赖
npm install --production

# 重启服务
pm2 restart pickball-server

echo "部署完成！"
```

使用方法：
```bash
chmod +x deploy.sh
./deploy.sh
```

