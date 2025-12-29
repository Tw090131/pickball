# 部署指南

## 服务器要求

### 软件要求
- **Node.js**: >= 16.6.0 (推荐 18.x LTS 或 20.x LTS)
- **npm**: >= 8.0.0
- **MongoDB**: >= 4.4.0 (推荐 6.0+)

### 硬件要求
- **内存**: 2GB+ RAM (推荐 4GB+)
- **存储**: 10GB+ 存储空间
- **CPU**: 2核+ (推荐 4核+)

### 检查版本
```bash
node -v    # 应该显示 v16.6.0 或更高
npm -v      # 应该显示 8.0.0 或更高
mongod --version  # 检查 MongoDB 版本
```

## 部署步骤

### 1. 服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 MongoDB
# 参考: https://docs.mongodb.com/manual/installation/
```

### 2. 克隆项目

```bash
git clone <your-repo-url>
cd pickball/server
npm install --production
```

### 3. 配置环境变量

```bash
cp .env.example .env
nano .env
```

### 4. 使用 PM2 部署

```bash
# 安装 PM2
npm install -g pm2

# 启动服务
pm2 start app.js --name pickball-server

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
pm2 logs pickball-server
```

### 5. 配置 Nginx（可选）

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
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. 配置 HTTPS（必需，用于微信支付）

使用 Let's Encrypt：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 小程序配置

在小程序的 `utils/api.js` 中修改 API 地址：

```javascript
const baseURL = 'https://your-domain.com/api'
```

在微信公众平台配置服务器域名：
- request 合法域名：`https://your-domain.com`
- uploadFile 合法域名：`https://your-domain.com`
- downloadFile 合法域名：`https://your-domain.com`

## 监控和维护

### 查看日志

```bash
pm2 logs pickball-server
```

### 重启服务

```bash
pm2 restart pickball-server
```

### 数据库备份

```bash
mongodump --uri="mongodb://localhost:27017/pickball" --out=/backup/$(date +%Y%m%d)
```

## 故障排查

1. **服务无法启动**：检查端口是否被占用，检查环境变量配置
2. **数据库连接失败**：检查 MongoDB 服务状态，检查连接字符串
3. **微信登录失败**：检查 AppID 和 Secret 是否正确
4. **支付回调失败**：检查 HTTPS 配置，检查回调 URL

