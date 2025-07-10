# 🔄 WSL环境导入微信开发者工具指南

## 📍 你的项目路径信息

**WSL Linux路径：**
```
/home/song/projects/15.ball/app
```

**Windows路径（微信开发者工具用）：**
```
\\wsl.localhost\Ubuntu\home\song\projects\15.ball\app
```

## 🚀 一步步导入教程

### 第1步：验证路径可访问

1. **打开Windows文件管理器**
2. **在地址栏粘贴以下路径：**
   ```
   \\wsl.localhost\Ubuntu\home\song\projects\15.ball\app
   ```
3. **按回车**，应该能看到这些文件：
   - app.js
   - app.json
   - pages 文件夹
   - project.config.json
   - sitemap.json

### 第2步：微信开发者工具导入

1. **下载并安装微信开发者工具**
   - 官网：https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html

2. **打开微信开发者工具**
   - 用微信扫码登录

3. **导入项目**
   - 点击 **"导入项目"**
   - **项目目录：** 复制粘贴这个路径
     ```
     \\wsl.localhost\Ubuntu\home\song\projects\15.ball\app
     ```
   - **AppID：** 选择 **"测试号"**
   - **项目名称：** `台球瞄准训练器`
   - 点击 **"导入"**

## 🔧 常见问题解决

### 问题1：路径找不到
**尝试备用路径格式：**
```
\\wsl$\ubuntu\home\song\projects\15.ball\app
```

**或者在WSL中执行：**
```bash
explorer.exe .
```
然后从打开的文件管理器中复制地址栏路径。

### 问题2：权限被拒绝
1. 确保WSL正在运行
2. 重启微信开发者工具
3. 以管理员身份运行微信开发者工具

### 问题3：文件显示不完整
在WSL中检查文件权限：
```bash
# 设置文件权限
chmod -R 755 /home/song/projects/15.ball/app
```

## ✅ 导入成功标志

导入成功后，你会在微信开发者工具中看到：

**左侧文件树：**
- app.js
- app.json
- pages/
  - index/
  - login/
  - stats/
  - settings/
- project.config.json
- sitemap.json

**右侧模拟器：**
- 显示台球桌界面
- 绿色背景
- 白球和红球
- 底部导航栏

## 🎯 快速验证

导入成功后立即测试：
1. **点击"随机生成球位"** - 球的位置应该改变
2. **点击底部"统计"** - 页面应该跳转
3. **点击底部"设置"** - 设置页面加载
4. **Canvas显示正常** - 台球桌绘制清晰

## 📱 下一步

路径导入成功后，按照 `快速测试步骤.md` 继续测试所有功能！

---

## 💡 WSL开发小贴士

1. **保持WSL运行** - 微信开发者工具需要访问WSL文件系统
2. **使用Windows路径** - 在微信开发者工具中始终使用Windows格式路径
3. **文件同步** - WSL和Windows之间文件修改会实时同步
4. **权限问题** - 必要时使用 `chmod` 调整文件权限

成功导入后，你就可以开始测试你的台球瞄准训练器了！🎱🚀 