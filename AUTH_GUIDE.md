# 登录授权功能说明

## 功能概述

已实现完整的微信小程序登录授权功能，包括：
- 微信用户信息授权
- 手机号授权绑定
- Token 管理和自动刷新
- 登录状态检查
- 自动登录拦截

## 功能特性

### 1. 微信登录授权 ✅

**流程：**
1. 用户点击"微信授权登录"按钮
2. 调用 `wx.getUserProfile` 获取用户信息
3. 调用 `wx.login` 获取 code
4. 将 code 和 userInfo 发送到后端
5. 后端通过 code 获取 openid 和 session_key
6. 创建或更新用户信息
7. 生成 JWT token 返回前端
8. 前端保存 token 到本地存储

**代码位置：**
- `client/app.js` - `doLogin()` 方法
- `client/pages/profile/profile.js` - `getUserProfile()` 方法
- `server/routes/auth.js` - `/api/auth/login` 接口

### 2. 手机号授权绑定 ✅

**流程：**
1. 用户点击"绑定手机号"按钮
2. 调用 `wx.getPhoneNumber` 获取加密的手机号数据
3. 重新调用 `wx.login` 获取新的 code
4. 将 encryptedData、iv 和 code 发送到后端
5. 后端通过 code 获取 session_key
6. 使用 session_key 解密手机号
7. 更新用户手机号信息

**代码位置：**
- `client/pages/profile/profile.js` - `getPhoneNumber()` 方法
- `server/routes/auth.js` - `/api/auth/bind-phone` 接口
- `server/utils/wechat.js` - `decryptPhoneNumber()` 方法

### 3. Token 管理 ✅

**存储：**
- Token 存储在 `wx.getStorageSync('token')`
- 同时保存在 `app.globalData.token`

**自动携带：**
- 所有 API 请求自动在 header 中携带 token
- 格式：`Authorization: Bearer {token}`

**代码位置：**
- `client/utils/util.js` - `request()` 方法
- `client/app.js` - `checkLogin()` 方法

### 4. 登录状态检查 ✅

**启动时检查：**
- 小程序启动时自动检查本地 token
- 调用 `/api/auth/me` 验证 token 有效性
- 如果 token 无效，自动清除登录状态

**代码位置：**
- `client/app.js` - `checkLogin()` 方法

### 5. 自动登录拦截 ✅

**401 错误处理：**
- 当 API 返回 401 状态码时
- 自动清除本地 token
- 提示用户重新登录
- 跳转到个人中心页面

**代码位置：**
- `client/utils/util.js` - `request()` 方法

### 6. 权限检查 ✅

**功能保护：**
- 需要登录的功能可以调用 `app.checkAuth()`
- 如果未登录，自动提示并跳转到登录页

**使用示例：**
```javascript
if (!app.checkAuth()) {
  return; // 未登录，已自动处理
}
// 继续执行需要登录的操作
```

## API 接口

### 1. 微信登录
```
POST /api/auth/login
Body: {
  code: string,        // wx.login 获取的 code
  userInfo: {          // wx.getUserProfile 获取的用户信息
    nickName: string,
    avatarUrl: string,
    gender: number
  }
}
Response: {
  success: true,
  data: {
    token: string,
    user: {
      id: string,
      nickName: string,
      avatarUrl: string,
      phoneNumber: string
    }
  }
}
```

### 2. 绑定手机号
```
POST /api/auth/bind-phone
Headers: {
  Authorization: Bearer {token}
}
Body: {
  encryptedData: string,  // wx.getPhoneNumber 获取的加密数据
  iv: string,            // 初始向量
  code: string           // wx.login 获取的新 code
}
Response: {
  success: true,
  data: {
    phoneNumber: string
  }
}
```

### 3. 获取当前用户信息
```
GET /api/auth/me
Headers: {
  Authorization: Bearer {token}
}
Response: {
  success: true,
  data: {
    user: {
      id: string,
      nickName: string,
      avatarUrl: string,
      phoneNumber: string,
      gender: number,
      level: number,
      totalMatches: number,
      totalWins: number
    }
  }
}
```

## 使用说明

### 用户端

1. **首次使用：**
   - 打开小程序，进入"我的"页面
   - 点击"微信授权登录"按钮
   - 授权用户信息
   - 登录成功

2. **绑定手机号：**
   - 登录后，在"我的"页面
   - 点击"绑定手机号"按钮
   - 授权手机号
   - 绑定成功

3. **退出登录：**
   - 在"我的"页面
   - 点击"退出登录"按钮
   - 确认退出

### 开发者端

1. **检查登录状态：**
   ```javascript
   const app = getApp();
   if (app.globalData.isLoggedIn) {
     // 已登录
   }
   ```

2. **获取用户信息：**
   ```javascript
   const app = getApp();
   const userInfo = app.globalData.userInfo;
   ```

3. **权限检查：**
   ```javascript
   const app = getApp();
   if (!app.checkAuth()) {
     return; // 未登录，已自动处理
   }
   ```

4. **API 调用：**
   - 所有 API 请求自动携带 token
   - 无需手动添加 Authorization header

## 注意事项

1. **Token 有效期：**
   - Token 有效期为 30 天
   - 过期后需要重新登录

2. **Session Key：**
   - Session key 每次登录都会更新
   - 绑定手机号时需要重新获取 code 和 session_key
   - 实际生产环境建议将 session_key 存储在 Redis 中

3. **安全性：**
   - Token 存储在本地，注意保护
   - 生产环境必须使用 HTTPS
   - 建议定期更新 token

4. **错误处理：**
   - 401 错误自动清除登录状态
   - 网络错误自动提示用户
   - 登录失败显示具体错误信息

## 文件结构

```
client/
  ├── app.js                    # 登录逻辑和状态管理
  ├── pages/
  │   └── profile/
  │       ├── profile.js        # 登录授权 UI 逻辑
  │       ├── profile.wxml     # 登录授权 UI
  │       └── profile.wxss      # 登录授权样式
  └── utils/
      ├── api.js                # API 接口封装
      └── util.js               # HTTP 请求封装（含 token）

server/
  ├── routes/
  │   └── auth.js               # 登录授权接口
  ├── utils/
  │   └── wechat.js             # 微信工具函数（解密等）
  └── models/
      └── User.js               # 用户数据模型
```

## 测试建议

1. **登录流程测试：**
   - 测试首次登录
   - 测试已登录用户再次打开小程序
   - 测试 token 过期后的处理

2. **手机号绑定测试：**
   - 测试绑定手机号
   - 测试已绑定手机号的用户
   - 测试取消授权的情况

3. **权限测试：**
   - 测试未登录访问需要权限的功能
   - 测试 401 错误的处理
   - 测试网络错误的处理

