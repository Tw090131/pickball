# 故障排查指南

## 微信登录问题排查

### 错误：invalid code (40029)

这个错误表示微信返回的 code 无效。常见原因和解决方法：

#### 1. Code 已过期或被使用
- **原因**：微信的 code 只能使用一次，且有效期只有 5 分钟
- **解决方法**：
  - 确保每次登录都调用 `wx.login()` 获取新的 code
  - 不要重复使用同一个 code
  - 如果登录失败，需要重新获取 code 再试

#### 2. AppID 或 AppSecret 配置错误
- **检查步骤**：
  1. 确认 `server/.env` 文件中配置了正确的 `WECHAT_APPID` 和 `WECHAT_SECRET`
  2. 在微信公众平台（https://mp.weixin.qq.com）检查：
     - AppID 是否正确
     - AppSecret 是否正确（如果忘记了，可以重置）
  3. 确认环境变量已正确加载（重启服务器）

#### 3. 环境变量未加载
- **检查**：
  ```bash
  # 在 server 目录下检查
  node -e "console.log('APPID:', process.env.WECHAT_APPID)"
  ```
- **解决方法**：
  - 确保 `.env` 文件在 `server` 目录下
  - 确保服务器启动时加载了环境变量（使用 `dotenv` 包）

#### 4. 网络问题
- **检查**：服务器是否能访问 `https://api.weixin.qq.com`
- **解决方法**：
  - 检查服务器网络连接
  - 检查防火墙设置
  - 如果是云服务器，检查安全组设置

### 常见错误码

| 错误码 | 说明 | 解决方法 |
|--------|------|----------|
| 40029 | code 无效或已过期 | 重新获取 code |
| 45011 | API 调用太频繁 | 稍后再试 |
| 40163 | code 已被使用 | 重新获取 code |
| 40013 | AppID 无效 | 检查 AppID 配置 |
| 40125 | AppSecret 无效 | 检查 AppSecret 配置 |

### 调试步骤

1. **检查环境变量**：
   ```bash
   cd server
   node -e "require('dotenv').config(); console.log('APPID:', process.env.WECHAT_APPID); console.log('SECRET:', process.env.WECHAT_SECRET ? '已配置' : '未配置');"
   ```

2. **检查日志**：
   - 查看服务器控制台输出
   - 查看微信开发者工具控制台
   - 确认 code 是否正确传递

3. **测试微信 API**：
   ```bash
   # 使用 curl 测试（替换 YOUR_APPID, YOUR_SECRET, YOUR_CODE）
   curl "https://api.weixin.qq.com/sns/jscode2session?appid=YOUR_APPID&secret=YOUR_SECRET&js_code=YOUR_CODE&grant_type=authorization_code"
   ```

4. **检查前端**：
   - 确认每次登录都调用 `wx.login()` 获取新 code
   - 确认 code 在 5 分钟内使用
   - 确认 code 只使用一次

### 快速修复

如果遇到 "invalid code" 错误：

1. **立即重试**：点击登录按钮，系统会自动获取新的 code
2. **检查配置**：确认 `.env` 文件中的 AppID 和 Secret 正确
3. **重启服务**：确保环境变量已加载
4. **查看日志**：检查服务器日志获取详细错误信息

