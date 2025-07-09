// 桌面系统主控制器
class Desktop {
    constructor() {
        this.apps = new Map();
        this.runningApps = new Map();
        this.windowManager = null;
        this.isStartMenuOpen = false;
        
        this.init();
    }

    init() {
        this.initEventListeners();
        this.updateClock();
        this.initSystemTray();
        
        // 每秒更新时钟
        setInterval(() => this.updateClock(), 1000);
        
        console.log('WebOS Desktop 已启动');
    }

    initEventListeners() {
        // 开始按钮事件
        const startButton = document.getElementById('start-button');
        startButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleStartMenu();
        });

        // 桌面图标事件
        document.querySelectorAll('.desktop-icon').forEach(icon => {
            icon.addEventListener('dblclick', () => {
                const appName = icon.dataset.app;
                this.openApp(appName);
            });
        });

        // 开始菜单项事件
        document.querySelectorAll('.start-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const appName = item.dataset.app;
                this.openApp(appName);
                this.hideStartMenu();
            });
        });

        // 点击桌面隐藏开始菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#start-menu') && !e.target.closest('#start-button')) {
                this.hideStartMenu();
            }
        });

        // 右键菜单（桌面）
        document.getElementById('desktop').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e.clientX, e.clientY);
        });

        // 关机按钮
        document.querySelector('.power-button').addEventListener('click', () => {
            this.showShutdownDialog();
        });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });
    }

    toggleStartMenu() {
        const startMenu = document.getElementById('start-menu');
        if (this.isStartMenuOpen) {
            this.hideStartMenu();
        } else {
            this.showStartMenu();
        }
    }

    showStartMenu() {
        const startMenu = document.getElementById('start-menu');
        startMenu.classList.remove('hidden');
        this.isStartMenuOpen = true;
    }

    hideStartMenu() {
        const startMenu = document.getElementById('start-menu');
        startMenu.classList.add('hidden');
        this.isStartMenuOpen = false;
    }

    openApp(appName) {
        // 如果应用已经在运行，聚焦到现有窗口
        if (this.runningApps.has(appName)) {
            const app = this.runningApps.get(appName);
            this.windowManager.focusWindow(app.windowId);
            return;
        }

        // 创建新的应用实例
        let app;
        switch (appName) {
            case 'filemanager':
                app = new FileManager();
                break;
            case 'texteditor':
                app = new TextEditor();
                break;
            case 'calculator':
                app = new Calculator();
                break;
            case 'terminal':
                app = new Terminal();
                break;
            case 'browser':
                app = new BrowserApp(this.windowManager);
                window.browserApp = app; // 设置全局引用
                break;
            case 'settings':
                app = new Settings();
                break;
            default:
                console.warn(`未知应用: ${appName}`);
                return;
        }

        if (app) {
            const windowId = this.windowManager.createWindow(app);
            app.windowId = windowId;
            this.runningApps.set(appName, app);
            
            // 添加到任务栏
            this.addToTaskbar(appName, app);
        }
    }

    closeApp(appName) {
        if (this.runningApps.has(appName)) {
            const app = this.runningApps.get(appName);
            this.windowManager.closeWindow(app.windowId);
            this.runningApps.delete(appName);
            this.removeFromTaskbar(appName);
        }
    }

    addToTaskbar(appName, app) {
        const taskbarApps = document.getElementById('taskbar-apps');
        const taskbarButton = document.createElement('button');
        taskbarButton.className = 'taskbar-app';
        taskbarButton.textContent = app.title;
        taskbarButton.dataset.app = appName;
        
        taskbarButton.addEventListener('click', () => {
            this.windowManager.focusWindow(app.windowId);
        });

        taskbarApps.appendChild(taskbarButton);
    }

    removeFromTaskbar(appName) {
        const taskbarButton = document.querySelector(`[data-app="${appName}"]`);
        if (taskbarButton && taskbarButton.classList.contains('taskbar-app')) {
            taskbarButton.remove();
        }
    }

    updateClock() {
        const clock = document.getElementById('clock');
        const now = new Date();
        const timeString = now.toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        const dateString = now.toLocaleDateString('zh-CN', {
            month: 'short',
            day: 'numeric'
        });
        clock.innerHTML = `${dateString}<br>${timeString}`;
    }

    initSystemTray() {
        // 网络图标点击事件
        document.querySelector('[title="网络"]').addEventListener('click', () => {
            this.showNetworkStatus();
        });

        // 音量图标点击事件
        document.querySelector('[title="音量"]').addEventListener('click', () => {
            this.showVolumeControl();
        });
    }

    showContextMenu(x, y) {
        // 创建右键菜单
        const existingMenu = document.querySelector('.context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const contextMenu = document.createElement('div');
        contextMenu.className = 'context-menu';
        contextMenu.style.cssText = `
            position: fixed;
            top: ${y}px;
            left: ${x}px;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            padding: 8px 0;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            min-width: 150px;
        `;

        const menuItems = [
            { text: '刷新', action: () => location.reload() },
            { text: '个性化', action: () => this.openApp('settings') },
            { text: '显示设置', action: () => this.showDisplaySettings() }
        ];

        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.textContent = item.text;
            menuItem.style.cssText = `
                padding: 8px 16px;
                cursor: pointer;
                transition: background 0.2s ease;
            `;
            menuItem.addEventListener('mouseover', () => {
                menuItem.style.background = 'rgba(0, 123, 255, 0.1)';
            });
            menuItem.addEventListener('mouseout', () => {
                menuItem.style.background = 'transparent';
            });
            menuItem.addEventListener('click', () => {
                item.action();
                contextMenu.remove();
            });
            contextMenu.appendChild(menuItem);
        });

        document.body.appendChild(contextMenu);

        // 点击其他地方关闭菜单
        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                contextMenu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 100);
    }

    showShutdownDialog() {
        const dialog = document.createElement('div');
        dialog.className = 'shutdown-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 0, 0, 0.1);
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            z-index: 10001;
            text-align: center;
        `;

        dialog.innerHTML = `
            <h3 style="margin-bottom: 16px; color: #333;">关闭 WebOS Desktop？</h3>
            <p style="margin-bottom: 24px; color: #666;">这将关闭所有正在运行的应用程序。</p>
            <div style="display: flex; gap: 12px; justify-content: center;">
                <button class="dialog-button cancel" style="padding: 8px 20px; border: 1px solid #ddd; background: white; border-radius: 6px; cursor: pointer;">取消</button>
                <button class="dialog-button shutdown" style="padding: 8px 20px; border: none; background: #dc3545; color: white; border-radius: 6px; cursor: pointer;">关闭</button>
            </div>
        `;

        document.body.appendChild(dialog);

        dialog.querySelector('.cancel').addEventListener('click', () => {
            dialog.remove();
        });

        dialog.querySelector('.shutdown').addEventListener('click', () => {
            window.close();
        });
    }

    handleKeyboardShortcuts(e) {
        // Ctrl + Alt + T - 打开终端
        if (e.ctrlKey && e.altKey && e.key === 't') {
            e.preventDefault();
            this.openApp('terminal');
        }

        // Windows键 - 打开开始菜单
        if (e.key === 'Meta') {
            e.preventDefault();
            this.toggleStartMenu();
        }

        // Alt + F4 - 关闭当前窗口
        if (e.altKey && e.key === 'F4') {
            e.preventDefault();
            const activeWindow = document.querySelector('.window:focus-within');
            if (activeWindow) {
                this.windowManager.closeWindow(activeWindow.dataset.windowId);
            }
        }
    }

    showNetworkStatus() {
        alert('网络状态：已连接\n连接类型：以太网\n速度：1000 Mbps');
    }

    showVolumeControl() {
        alert('音量控制：100%\n设备：内置扬声器');
    }

    showDisplaySettings() {
        alert('显示设置功能尚未实现');
    }
}

// 应用基类
class Application {
    constructor(title, icon) {
        this.title = title;
        this.icon = icon;
        this.windowId = null;
    }

    render() {
        // 子类需要实现此方法
        return '<div>应用内容</div>';
    }

    onMount() {
        // 应用挂载后的回调
    }

    onUnmount() {
        // 应用卸载前的回调
    }
}

// 页面加载完成后初始化桌面
document.addEventListener('DOMContentLoaded', () => {
    // 初始化窗口管理器
    window.desktop = new Desktop();
    window.desktop.windowManager = new WindowManager();
}); 