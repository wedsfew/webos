<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Web桌面系统</title>
    <link rel="stylesheet" href="css/desktop.css">
    <link rel="stylesheet" href="css/apps.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <!-- 桌面背景 -->
    <div id="desktop">
        <!-- 桌面图标 -->
        <div class="desktop-icons">
            <div class="icon" data-app="browser">
                <i class="fas fa-globe"></i>
                <span>浏览器</span>
            </div>
            <div class="icon" data-app="filemanager">
                <i class="fas fa-folder"></i>
                <span>文件管理器</span>
            </div>
            <div class="icon" data-app="calculator">
                <i class="fas fa-calculator"></i>
                <span>计算器</span>
            </div>
            <div class="icon" data-app="texteditor">
                <i class="fas fa-edit"></i>
                <span>文本编辑器</span>
            </div>
            <div class="icon" data-app="terminal">
                <i class="fas fa-terminal"></i>
                <span>终端</span>
            </div>
            <div class="icon" data-app="settings">
                <i class="fas fa-cog"></i>
                <span>设置</span>
            </div>
        </div>
    </div>

    <!-- 任务栏 -->
    <div id="taskbar">
        <div class="start-button">
            <i class="fas fa-home"></i>
            <span>开始</span>
        </div>
        <div class="taskbar-apps" id="taskbar-apps">
            <!-- 运行中的应用会显示在这里 -->
        </div>
        <div class="system-tray">
            <div class="time" id="system-time"></div>
        </div>
    </div>

    <!-- 开始菜单 -->
    <div id="start-menu" class="hidden">
        <div class="menu-header">
            <h3>应用程序</h3>
        </div>
        <div class="menu-items">
            <div class="menu-item" data-app="browser">
                <i class="fas fa-globe"></i>
                <span>浏览器</span>
            </div>
            <div class="menu-item" data-app="filemanager">
                <i class="fas fa-folder"></i>
                <span>文件管理器</span>
            </div>
            <div class="menu-item" data-app="calculator">
                <i class="fas fa-calculator"></i>
                <span>计算器</span>
            </div>
            <div class="menu-item" data-app="texteditor">
                <i class="fas fa-edit"></i>
                <span>文本编辑器</span>
            </div>
            <div class="menu-item" data-app="terminal">
                <i class="fas fa-terminal"></i>
                <span>终端</span>
            </div>
            <div class="menu-item" data-app="settings">
                <i class="fas fa-cog"></i>
                <span>设置</span>
            </div>
        </div>
    </div>

    <!-- 窗口容器 -->
    <div id="windows-container">
        <!-- 应用窗口会动态添加到这里 -->
    </div>

    <!-- 右键菜单 -->
    <div id="context-menu" class="hidden">
        <div class="context-item" id="refresh">
            <i class="fas fa-sync"></i>
            <span>刷新</span>
        </div>
        <div class="context-item" id="new-folder">
            <i class="fas fa-folder-plus"></i>
            <span>新建文件夹</span>
        </div>
        <div class="context-item" id="properties">
            <i class="fas fa-info-circle"></i>
            <span>属性</span>
        </div>
    </div>

    <!-- JavaScript文件 -->
    <script src="js/desktop.js"></script>
    <script src="js/window-manager.js"></script>
    <script src="js/apps/browser.js"></script>
    <script src="js/apps/filemanager.js"></script>
    <script src="js/apps/calculator.js"></script>
    <script src="js/apps/texteditor.js"></script>
    <script src="js/apps/terminal.js"></script>
    <script src="js/apps/settings.js"></script>

    <script>
        // 初始化桌面系统
        document.addEventListener('DOMContentLoaded', function() {
            Desktop.init();
            WindowManager.init();
            
            // 更新时间
            function updateTime() {
                const now = new Date();
                const timeString = now.toLocaleTimeString('zh-CN', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                document.getElementById('system-time').textContent = timeString;
            }
            
            updateTime();
            setInterval(updateTime, 1000);
        });
    </script>
</body>
</html> 