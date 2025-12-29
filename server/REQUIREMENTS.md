# 服务端环境要求

## Node.js 版本要求

### 最低要求
- **Node.js**: >= 16.6.0
- **npm**: >= 8.0.0

### 推荐版本
- **Node.js**: 18.x LTS 或 20.x LTS
- **npm**: 8.x 或 9.x

## 为什么需要这个版本？

### 1. Mongoose 7.5.0 要求
- Mongoose 7.x 需要 Node.js 16.6.0+
- 使用了新的  特性（如可选链、JavaScript空值合并等）

### 2. Express 4.18.2
- 支持 Node.js 16+
- 使用现代 ES6+ 语法

### 3. 其他依赖
- `jsonwebtoken@9.0.2` - 需要 Node.js 16+
- `dotenv@16.3.1` - 需要 Node.js 12+

## 检查当前版本

### 检查 Node.js 版本
```bash
node -v
```

**输出示例**：
- ✅ `v18.17.0` (推荐)
- ✅ `v20.5.0` (推荐)
- ✅ `v16.20.0` (最低要求)
- ❌ `v14.21.0` (版本过低，需要升级)

### 检查 npm 版本
```bash
npm -v
```

**输出示例**：
- ✅ `9.6.7` (推荐)
- ✅ `8.19.2` (最低要求)
- ❌ `6.14.0` (版本过低，需要升级)

## 安装/升级 Node.js

### Windows

#### 方法一：官网下载（推荐）
1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 LTS 版本（18.x 或 20.x）
3. 运行安装程序
4. 重启命令行工具

#### 方法二：使用 Chocolatey
```bash
choco install nodejs-lts
```

### macOS

#### 方法一：使用 Homebrew（推荐）
```bash
# 安装 Homebrew（如果还没有）
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装 Node.js
brew install node@18

# 或安装最新 LTS
brew install node
```

#### 方法二：使用 nvm（推荐开发使用）
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 安装 Node.js 18
nvm install 18
nvm use 18
nvm alias default 18
```

#### 方法三：官网下载
1. 访问 [Node.js 官网](https://nodejs.org/)
2. 下载 macOS 安装包
3. 运行安装

### Linux (Ubuntu/Debian)

#### 使用 NodeSource（推荐）
```bash
# Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 或 Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 使用 nvm
```bash
# 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新加载 shell
source ~/.bashrc

# 安装 Node.js
nvm install 18
nvm use 18
```

## 验证安装

安装完成后，验证版本：

```bash
# 检查 Node.js 版本
node -v
# 应该显示 v18.x.x 或 v20.x.x

# 检查 npm 版本
npm -v
# 应该显示 8.x.x 或 9.x.x

# 检查安装位置
which node
which npm
```

## 常见问题

### Q: 安装后还是显示旧版本？
A: 
1. 关闭所有命令行窗口
2. 重新打开命令行
3. 检查 PATH 环境变量
4. Windows: 可能需要重启电脑

### Q: 多个 Node.js 版本如何管理？
A: 使用 nvm (Node Version Manager)
- Windows: [nvm-windows](https://github.com/coreybutler/nvm-windows)
- macOS/Linux: [nvm](https://github.com/nvm-sh/nvm)

### Q: 服务器上如何安装？
A: 参考 `DEPLOYMENT.md` 中的服务器部署步骤

## 版本兼容性

| Node.js 版本 | 状态 | 说明 |
|-------------|------|------|
| 20.x LTS | ✅ 推荐 | 最新 LTS，性能最好 |
| 18.x LTS | ✅ 推荐 | 稳定 LTS，长期支持 |
| 16.x | ✅ 支持 | 最低要求，可正常使用 |
| 14.x | ❌ 不支持 | 版本过低 |
| 12.x | ❌ 不支持 | 版本过低 |

## 下一步

安装完 Node.js 后，继续：

1. 安装项目依赖：`npm install`
2. 配置环境变量：复制 `.env.example` 为 `.env`
3. 启动服务：`npm run dev`

参考 `README.md` 了解详细步骤。

