# 快速开始指南

## 第一步：配置小程序

1. **打开微信开发者工具**
   - 下载并安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

2. **导入项目**
   - 打开微信开发者工具
   - 选择"导入项目"
   - 选择项目目录：`D:\pickball`
   - 填写 AppID（测试可以使用测试号）

3. **配置 AppID**
   - 打开 `project.config.json`
   - 修改 `appid` 字段为你的小程序 AppID
   - 如果没有 AppID，可以在微信公众平台注册

## 第二步：准备图片资源

在 `images` 目录下添加以下图标文件：

- `home.png` / `home-active.png` - 首页图标
- `create.png` / `create-active.png` - 发布图标
- `profile.png` / `profile-active.png` - 个人中心图标
- `default-avatar.png` - 默认头像

## 第三步：运行项目

1. **编译项目**
   - 在微信开发者工具中点击"编译"
   - 项目会自动编译并显示在模拟器中

2. **测试功能**
   - 首页：查看赛事列表
   - 发布：创建新赛事
   - 详情：查看赛事详情
   - 报名：测试报名流程
   - 计分：测试计分功能
   - 排名：查看排名
   - 晋级图：查看淘汰赛对阵

## 第四步：配置后端（可选）

目前项目使用模拟数据，如需连接真实后端：

1. **修改 API 地址**
   - 打开 `utils/api.js`
   - 修改 `baseURL` 为你的后端 API 地址

2. **实现后端接口**
   - 参考 `DEVELOPMENT.md` 中的数据库设计
   - 实现所有 API 接口
   - 配置微信支付

## 常见问题

### Q: 为什么看不到赛事列表？
A: 项目使用模拟数据，数据在 `pages/index/index.js` 的 `getMockEvents()` 方法中。

### Q: 支付功能无法使用？
A: 微信支付需要企业认证的小程序，个人开发者无法使用。目前代码中已预留支付接口。

### Q: 位置信息获取失败？
A: 需要在 `app.json` 中配置位置权限，并在微信开发者工具中授权。

### Q: TabBar 图标不显示？
A: 需要在 `images` 目录下添加对应的图标文件。

## 下一步

- 阅读 `README.md` 了解完整功能
- 阅读 `DEVELOPMENT.md` 了解开发计划
- 开始后端开发或使用现有后端服务

## 技术支持

如有问题，请查看：
- 微信小程序官方文档：https://developers.weixin.qq.com/miniprogram/dev/framework/
- 项目 README.md 文件

