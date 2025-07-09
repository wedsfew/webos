# WebOS Desktop

一个现代化的基于Web的桌面操作系统，在浏览器中提供完整的桌面体验。无需安装，无需root权限，适用于PSS环境和任何支持现代浏览器的平台。

![WebOS Desktop](https://img.shields.io/badge/WebOS-Desktop-blue)
![Version](https://img.shields.io/badge/version-1.0.0-green)
![License](https://img.shields.io/badge/license-MIT-yellow)

## ✨ 功能特性

### 🖥️ 桌面环境
- **现代化界面设计** - 采用毛玻璃效果和流畅动画
- **多窗口管理** - 支持窗口拖拽、调整大小、最大化/最小化
- **任务栏** - 实时时钟、系统托盘、应用程序快捷启动
- **开始菜单** - 应用程序导航和系统控制
- **桌面图标** - 双击启动应用程序

### 📁 虚拟文件系统
- **文件管理器** - 完整的文件浏览和管理功能
- **文件操作** - 创建、删除、重命名、复制文件和文件夹
- **多种文件类型支持** - 文本、图片、文档等
- **右键菜单** - 便捷的上下文操作

### 🛠️ 内置应用程序
- **文本编辑器** - 支持多种文件格式，语法高亮，查找替换
- **计算器** - 基础和科学计算功能，计算历史记录
- **终端模拟器** - 命令行界面，支持常用Linux命令
- **系统设置** - 个性化配置，主题切换，系统信息

### 🎨 个性化定制
- **多种主题** - 深色、浅色、默认主题
- **壁纸选择** - 多种渐变和纯色背景
- **界面调节** - 字体大小、图标大小、动画效果
- **设置保存** - 本地存储个人偏好

## 🚀 快速开始

### 系统要求
- 现代浏览器（Chrome 80+, Firefox 75+, Safari 13+, Edge 80+）
- Python 3.6+ 或 Node.js 14+（用于运行服务器）
- 无需root权限
- 支持所有操作系统（Windows, macOS, Linux）

### 方式一：Python服务器（推荐）

1. **下载项目**
```bash
# 克隆仓库或下载ZIP文件
git clone https://github.com/webos-desktop/webos-desktop.git
cd webos-desktop
```

2. **启动服务器**
```bash
# 使用Python启动（推荐）
python3 server.py

# 或者指定端口
python3 server.py 3000

# 或者指定主机和端口
python3 server.py 3000 0.0.0.0

# 不自动打开浏览器
python3 server.py --no-browser
```

3. **访问桌面**
   - 服务器会自动打开浏览器
   - 或手动访问 `http://localhost:8000`

### 方式二：Node.js服务器

1. **安装依赖**
```bash
npm install
```

2. **启动服务器**
```bash
# 使用npm脚本
npm start

# 或直接运行
node server.js

# 指定端口
node server.js --port 3000

# 不自动打开浏览器
node server.js --no-browser

# 查看帮助
node server.js --help
```

### 方式三：静态文件服务

如果你有其他HTTP服务器，可以直接作为静态文件提供：

```bash
# 使用Python内置服务器
python3 -m http.server 8000

# 使用Node.js serve
npx serve

# 使用PHP内置服务器
php -S localhost:8000

# 使用Go
go run -c "package main; import \"net/http\"; func main() { http.ListenAndServe(\":8000\", http.FileServer(http.Dir(\".\"))) }"
```

## 🎯 使用指南

### 基本操作
- **启动应用** - 双击桌面图标或通过开始菜单
- **窗口操作** - 拖拽标题栏移动，拖拽边缘调整大小
- **任务切换** - 点击任务栏按钮切换活动窗口
- **系统菜单** - 点击开始按钮访问应用和设置

### 文件管理
- **浏览文件** - 双击文件夹进入，点击"返回上级"
- **创建文件夹** - 右键空白处或点击工具栏按钮
- **文件操作** - 右键文件/文件夹进行重命名、删除
- **打开文件** - 双击文本文件自动用编辑器打开

### 文本编辑
- **新建文档** - Ctrl+N
- **打开文件** - Ctrl+O
- **保存文档** - Ctrl+S
- **查找文本** - Ctrl+F
- **字体调节** - 工具栏字体大小选择

### 计算器
- **基础运算** - 支持加减乘除、小数、百分比
- **科学模式** - 三角函数、对数、平方根、阶乘
- **键盘支持** - 可以用键盘输入数字和运算符
- **历史记录** - 查看和清除计算历史

### 终端
- **基本命令** - ls, cd, pwd, mkdir, rm, cat, echo等
- **文件操作** - 创建、删除、查看文件
- **系统信息** - whoami, date, uname, ps等
- **命令历史** - 上下箭头浏览历史命令

### 系统设置
- **外观设置** - 切换主题、壁纸、界面选项
- **系统设置** - 语言、时区、行为配置
- **隐私设置** - 数据管理、历史记录
- **关于信息** - 系统版本、浏览器信息

## 🔧 高级配置

### 自定义端口和主机
```bash
# Python服务器
python3 server.py 3000 0.0.0.0

# Node.js服务器
node server.js --port 3000 --host 0.0.0.0
```

### 在PSS环境中部署
```bash
# 使用非特权端口（>1024）
python3 server.py 8080

# 绑定到所有接口（小心安全性）
python3 server.py 8080 0.0.0.0
```

### 作为服务运行
```bash
# 使用systemd（Linux）
sudo systemctl enable webos-desktop.service

# 使用PM2（Node.js）
pm2 start server.js --name webos-desktop

# 使用screen（后台运行）
screen -S webos-desktop python3 server.py
```

## 📁 项目结构

```
webos-desktop/
├── index.html              # 主页面
├── server.py               # Python服务器
├── server.js               # Node.js服务器
├── package.json            # Node.js配置
├── README.md               # 说明文档
├── styles/                 # 样式文件
│   ├── desktop.css         # 桌面环境样式
│   └── apps.css            # 应用程序样式
└── js/                     # JavaScript文件
    ├── desktop.js          # 桌面主控制器
    ├── window-manager.js   # 窗口管理器
    └── apps/               # 应用程序
        ├── filemanager.js  # 文件管理器
        ├── texteditor.js   # 文本编辑器
        ├── calculator.js   # 计算器
        ├── terminal.js     # 终端
        └── settings.js     # 设置
```

## 🌐 浏览器兼容性

| 浏览器 | 最低版本 | 推荐版本 | 状态 |
|--------|----------|----------|------|
| Chrome | 80 | 最新 | ✅ 完全支持 |
| Firefox | 75 | 最新 | ✅ 完全支持 |
| Safari | 13 | 最新 | ✅ 完全支持 |
| Edge | 80 | 最新 | ✅ 完全支持 |
| Opera | 67 | 最新 | ✅ 完全支持 |

## 🛠️ 开发

### 本地开发
```bash
# 克隆仓库
git clone https://github.com/webos-desktop/webos-desktop.git
cd webos-desktop

# 启动开发服务器
python3 server.py

# 或使用Node.js
npm install
npm run dev
```

### 贡献代码
1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 添加新应用
1. 在 `js/apps/` 中创建新的应用文件
2. 继承 `Application` 基类
3. 实现 `render()` 和必要的生命周期方法
4. 在 `desktop.js` 中注册应用
5. 添加桌面图标和开始菜单项

## 🐛 常见问题

### 启动问题
**Q: 提示端口被占用怎么办？**
A: 使用不同端口：`python3 server.py 8080`

**Q: 无法自动打开浏览器？**
A: 手动访问显示的URL地址

**Q: 文件加载失败？**
A: 确保在项目根目录运行服务器

### 功能问题
**Q: 窗口无法拖拽？**
A: 确保浏览器支持现代JavaScript特性

**Q: 文件管理器显示空白？**
A: 刷新页面或检查浏览器控制台错误

**Q: 设置无法保存？**
A: 检查浏览器是否启用了localStorage

## 📜 许可证

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

## 🤝 贡献者

感谢所有为这个项目做出贡献的开发者！

## 📞 联系我们

- 项目主页: https://webos-desktop.github.io
- 问题反馈: https://github.com/webos-desktop/webos-desktop/issues
- 电子邮件: contact@webos-desktop.com

## 🎉 致谢

- Font Awesome - 图标库
- 现代浏览器团队 - 提供强大的Web API
- 开源社区 - 提供灵感和技术支持

---

**享受在浏览器中的桌面体验！** 🎊