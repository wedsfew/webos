// 桌面系统主要功能
const Desktop = {
    apps: {},
    runningApps: {},
    
    init() {
        this.setupEventListeners();
        this.initializeApps();
    },
    
    setupEventListeners() {
        // 桌面图标点击事件
        document.querySelectorAll('.icon').forEach(icon => {
            icon.addEventListener('dblclick', (e) => {
                const appName = e.currentTarget.dataset.app;
                this.launchApp(appName);
            });
            
            icon.addEventListener('click', (e) => {
                this.selectIcon(e.currentTarget);
            });
        });
        
        // 开始菜单项点击事件
        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const appName = e.currentTarget.dataset.app;
                this.launchApp(appName);
                this.hideStartMenu();
            });
        });
        
        // 开始按钮点击事件
        document.querySelector('.start-button').addEventListener('click', () => {
            this.toggleStartMenu();
        });
        
        // 桌面右键菜单
        document.getElementById('desktop').addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e.clientX, e.clientY);
        });
        
        // 点击桌面隐藏菜单
        document.addEventListener('click', (e) => {
            if (!e.target.closest('#start-menu') && !e.target.closest('.start-button')) {
                this.hideStartMenu();
            }
            if (!e.target.closest('#context-menu')) {
                this.hideContextMenu();
            }
            
            // 取消选择图标
            if (e.target.closest('#desktop') && !e.target.closest('.icon')) {
                this.clearIconSelection();
            }
        });
        
        // 右键菜单功能
        document.getElementById('refresh').addEventListener('click', () => {
            this.refreshDesktop();
            this.hideContextMenu();
        });
        
        document.getElementById('new-folder').addEventListener('click', () => {
            this.createNewFolder();
            this.hideContextMenu();
        });
        
        document.getElementById('properties').addEventListener('click', () => {
            this.showDesktopProperties();
            this.hideContextMenu();
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch(e.key) {
                    case 'r':
                        e.preventDefault();
                        this.refreshDesktop();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.createNewFolder();
                        break;
                }
            }
        });
    },
    
    initializeApps() {
        // 注册所有应用程序
        this.apps = {
            browser: {
                name: '浏览器',
                icon: 'fas fa-globe',
                component: BrowserApp
            },
            filemanager: {
                name: '文件管理器',
                icon: 'fas fa-folder',
                component: FileManagerApp
            },
            calculator: {
                name: '计算器',
                icon: 'fas fa-calculator',
                component: CalculatorApp
            },
            texteditor: {
                name: '文本编辑器',
                icon: 'fas fa-edit',
                component: TextEditorApp
            },
            terminal: {
                name: '终端',
                icon: 'fas fa-terminal',
                component: TerminalApp
            },
            settings: {
                name: '设置',
                icon: 'fas fa-cog',
                component: SettingsApp
            }
        };
    },
    
    launchApp(appName) {
        if (!this.apps[appName]) {
            console.error(`应用程序 ${appName} 不存在`);
            return;
        }
        
        // 如果应用已经运行，则激活窗口
        if (this.runningApps[appName]) {
            WindowManager.activateWindow(this.runningApps[appName].windowId);
            return;
        }
        
        const app = this.apps[appName];
        const windowId = WindowManager.createWindow({
            title: app.name,
            icon: app.icon,
            width: 800,
            height: 600,
            onClose: () => {
                this.closeApp(appName);
            }
        });
        
        // 初始化应用
        const appInstance = new app.component(windowId);
        this.runningApps[appName] = {
            instance: appInstance,
            windowId: windowId
        };
        
        // 添加到任务栏
        this.addToTaskbar(appName, app.name, app.icon, windowId);
    },
    
    closeApp(appName) {
        if (this.runningApps[appName]) {
            const app = this.runningApps[appName];
            
            // 清理应用实例
            if (app.instance && app.instance.destroy) {
                app.instance.destroy();
            }
            
            // 从任务栏移除
            this.removeFromTaskbar(appName);
            
            // 从运行列表移除
            delete this.runningApps[appName];
        }
    },
    
    addToTaskbar(appName, title, icon, windowId) {
        const taskbarApps = document.getElementById('taskbar-apps');
        const taskbarApp = document.createElement('div');
        taskbarApp.className = 'taskbar-app';
        taskbarApp.dataset.app = appName;
        taskbarApp.innerHTML = `
            <i class="${icon}"></i>
            <span>${title}</span>
        `;
        
        taskbarApp.addEventListener('click', () => {
            WindowManager.activateWindow(windowId);
        });
        
        taskbarApps.appendChild(taskbarApp);
    },
    
    removeFromTaskbar(appName) {
        const taskbarApp = document.querySelector(`.taskbar-app[data-app="${appName}"]`);
        if (taskbarApp) {
            taskbarApp.remove();
        }
    },
    
    selectIcon(iconElement) {
        this.clearIconSelection();
        iconElement.classList.add('selected');
    },
    
    clearIconSelection() {
        document.querySelectorAll('.icon.selected').forEach(icon => {
            icon.classList.remove('selected');
        });
    },
    
    toggleStartMenu() {
        const startMenu = document.getElementById('start-menu');
        startMenu.classList.toggle('hidden');
    },
    
    hideStartMenu() {
        const startMenu = document.getElementById('start-menu');
        startMenu.classList.add('hidden');
    },
    
    showContextMenu(x, y) {
        const contextMenu = document.getElementById('context-menu');
        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;
        contextMenu.classList.remove('hidden');
        
        // 确保菜单不会超出屏幕
        const rect = contextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            contextMenu.style.left = `${x - rect.width}px`;
        }
        if (rect.bottom > window.innerHeight) {
            contextMenu.style.top = `${y - rect.height}px`;
        }
    },
    
    hideContextMenu() {
        const contextMenu = document.getElementById('context-menu');
        contextMenu.classList.add('hidden');
    },
    
    refreshDesktop() {
        // 刷新桌面图标
        console.log('刷新桌面');
        
        // 可以在这里添加刷新逻辑，比如重新加载图标位置等
        this.showNotification('桌面已刷新', 'success');
    },
    
    createNewFolder() {
        // 创建新文件夹的模拟功能
        const folderName = prompt('请输入文件夹名称:', '新建文件夹');
        if (folderName) {
            this.showNotification(`已创建文件夹: ${folderName}`, 'success');
            // 这里可以添加实际创建文件夹的逻辑
        }
    },
    
    showDesktopProperties() {
        // 显示桌面属性
        const modal = this.createModal({
            title: '桌面属性',
            content: `
                <div class="settings-section">
                    <h4>显示设置</h4>
                    <div class="settings-item">
                        <span>壁纸:</span>
                        <select class="settings-select">
                            <option>默认渐变</option>
                            <option>纯色背景</option>
                            <option>自定义图片</option>
                        </select>
                    </div>
                    <div class="settings-item">
                        <span>图标大小:</span>
                        <select class="settings-select">
                            <option>小</option>
                            <option selected>中</option>
                            <option>大</option>
                        </select>
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: '取消',
                    onClick: () => this.closeModal()
                },
                {
                    text: '应用',
                    className: 'primary',
                    onClick: () => {
                        this.showNotification('设置已应用', 'success');
                        this.closeModal();
                    }
                }
            ]
        });
        
        document.body.appendChild(modal);
    },
    
    createModal({ title, content, buttons = [] }) {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-header">
                <div class="modal-title">${title}</div>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-content">${content}</div>
            <div class="modal-actions">
                ${buttons.map(btn => 
                    `<button class="modal-button ${btn.className || ''}">${btn.text}</button>`
                ).join('')}
            </div>
        `;
        
        // 绑定关闭事件
        modal.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });
        
        // 绑定按钮事件
        buttons.forEach((btn, index) => {
            const buttonElement = modal.querySelectorAll('.modal-button')[index];
            if (buttonElement && btn.onClick) {
                buttonElement.addEventListener('click', btn.onClick);
            }
        });
        
        overlay.appendChild(modal);
        return overlay;
    },
    
    closeModal() {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    },
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
            color: white;
            padding: 15px 20px;
            border-radius: 6px;
            z-index: 3000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 3秒后移除
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    },
    
    // 获取应用实例
    getAppInstance(appName) {
        return this.runningApps[appName] ? this.runningApps[appName].instance : null;
    },
    
    // 获取所有运行中的应用
    getRunningApps() {
        return Object.keys(this.runningApps);
    }
}; 