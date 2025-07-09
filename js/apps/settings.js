// 设置应用
class SettingsApp {
    constructor(windowId) {
        this.windowId = windowId;
        this.settings = this.loadSettings();
        this.init();
    }
    
    init() {
        const content = WindowManager.getWindowContent(this.windowId);
        content.innerHTML = this.getHTML();
        this.setupEvents();
        this.updateUI();
    }
    
    getHTML() {
        return `
            <div class="settings-app">
                <h2 style="margin-bottom: 20px;">系统设置</h2>
                
                <div class="settings-section">
                    <div class="settings-title">外观设置</div>
                    <div class="settings-item">
                        <span class="settings-label">主题模式</span>
                        <div class="settings-control">
                            <select class="settings-select" id="theme-mode">
                                <option value="light">浅色</option>
                                <option value="dark">深色</option>
                                <option value="auto">自动</option>
                            </select>
                        </div>
                    </div>
                    <div class="settings-item">
                        <span class="settings-label">启用动画效果</span>
                        <div class="settings-control">
                            <div class="settings-toggle" id="enable-animations"></div>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-title">桌面设置</div>
                    <div class="settings-item">
                        <span class="settings-label">图标大小</span>
                        <div class="settings-control">
                            <select class="settings-select" id="icon-size">
                                <option value="small">小</option>
                                <option value="medium">中</option>
                                <option value="large">大</option>
                            </select>
                        </div>
                    </div>
                    <div class="settings-item">
                        <span class="settings-label">显示桌面网格</span>
                        <div class="settings-control">
                            <div class="settings-toggle" id="show-grid"></div>
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-title">系统设置</div>
                    <div class="settings-item">
                        <span class="settings-label">自动保存文件</span>
                        <div class="settings-control">
                            <div class="settings-toggle" id="auto-save"></div>
                        </div>
                    </div>
                    <div class="settings-item">
                        <span class="settings-label">通知声音</span>
                        <div class="settings-control">
                            <div class="settings-toggle" id="notification-sound"></div>
                        </div>
                    </div>
                    <div class="settings-item">
                        <span class="settings-label">命令历史记录数</span>
                        <div class="settings-control">
                            <input type="number" class="settings-input" id="history-limit" min="10" max="1000" step="10">
                        </div>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-title">关于</div>
                    <div style="padding: 15px; background: #f5f5f5; border-radius: 6px;">
                        <p><strong>Web桌面系统</strong></p>
                        <p>版本: 1.0.0</p>
                        <p>构建日期: ${new Date().toLocaleDateString()}</p>
                        <p>基于现代Web技术构建的桌面环境</p>
                    </div>
                </div>

                <div style="margin-top: 30px; text-align: center;">
                    <button class="modal-button primary" id="save-settings">保存设置</button>
                    <button class="modal-button" id="reset-settings">重置为默认</button>
                    <button class="modal-button" id="export-settings">导出设置</button>
                    <button class="modal-button" id="import-settings">导入设置</button>
                </div>
            </div>
        `;
    }
    
    setupEvents() {
        const content = WindowManager.getWindowContent(this.windowId);
        
        // 保存设置
        content.querySelector('#save-settings').addEventListener('click', () => this.saveSettings());
        
        // 重置设置
        content.querySelector('#reset-settings').addEventListener('click', () => this.resetSettings());
        
        // 导出设置
        content.querySelector('#export-settings').addEventListener('click', () => this.exportSettings());
        
        // 导入设置
        content.querySelector('#import-settings').addEventListener('click', () => this.importSettings());
        
        // 设置项事件
        content.querySelectorAll('.settings-toggle').forEach(toggle => {
            toggle.addEventListener('click', () => this.toggleSetting(toggle));
        });
        
        content.querySelectorAll('.settings-select, .settings-input').forEach(control => {
            control.addEventListener('change', () => this.updateSetting(control));
        });
    }
    
    loadSettings() {
        const defaultSettings = {
            themeMode: 'light',
            enableAnimations: true,
            iconSize: 'medium',
            showGrid: false,
            autoSave: true,
            notificationSound: true,
            historyLimit: 100
        };
        
        try {
            const saved = localStorage.getItem('webos-settings');
            return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
        } catch (e) {
            return defaultSettings;
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('webos-settings', JSON.stringify(this.settings));
            Desktop.showNotification('设置已保存', 'success');
            this.applySettings();
        } catch (e) {
            Desktop.showNotification('保存设置失败', 'error');
        }
    }
    
    resetSettings() {
        const confirm = window.confirm('确定要重置所有设置为默认值吗？');
        if (confirm) {
            this.settings = {
                themeMode: 'light',
                enableAnimations: true,
                iconSize: 'medium',
                showGrid: false,
                autoSave: true,
                notificationSound: true,
                historyLimit: 100
            };
            this.updateUI();
            Desktop.showNotification('设置已重置为默认值', 'success');
        }
    }
    
    exportSettings() {
        const data = JSON.stringify(this.settings, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'webos-settings.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        Desktop.showNotification('设置已导出', 'success');
    }
    
    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const imported = JSON.parse(e.target.result);
                        this.settings = { ...this.settings, ...imported };
                        this.updateUI();
                        Desktop.showNotification('设置已导入', 'success');
                    } catch (err) {
                        Desktop.showNotification('导入设置失败：文件格式错误', 'error');
                    }
                };
                reader.readAsText(file);
            }
        });
        
        input.click();
    }
    
    toggleSetting(toggle) {
        const id = toggle.id;
        const active = toggle.classList.contains('active');
        
        toggle.classList.toggle('active');
        
        switch(id) {
            case 'enable-animations':
                this.settings.enableAnimations = !active;
                break;
            case 'show-grid':
                this.settings.showGrid = !active;
                break;
            case 'auto-save':
                this.settings.autoSave = !active;
                break;
            case 'notification-sound':
                this.settings.notificationSound = !active;
                break;
        }
    }
    
    updateSetting(control) {
        const id = control.id;
        const value = control.value;
        
        switch(id) {
            case 'theme-mode':
                this.settings.themeMode = value;
                break;
            case 'icon-size':
                this.settings.iconSize = value;
                break;
            case 'history-limit':
                this.settings.historyLimit = parseInt(value);
                break;
        }
    }
    
    updateUI() {
        const content = WindowManager.getWindowContent(this.windowId);
        
        // 更新选择框
        content.querySelector('#theme-mode').value = this.settings.themeMode;
        content.querySelector('#icon-size').value = this.settings.iconSize;
        content.querySelector('#history-limit').value = this.settings.historyLimit;
        
        // 更新开关
        content.querySelector('#enable-animations').classList.toggle('active', this.settings.enableAnimations);
        content.querySelector('#show-grid').classList.toggle('active', this.settings.showGrid);
        content.querySelector('#auto-save').classList.toggle('active', this.settings.autoSave);
        content.querySelector('#notification-sound').classList.toggle('active', this.settings.notificationSound);
    }
    
    applySettings() {
        // 应用主题
        if (this.settings.themeMode === 'dark') {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
        
        // 应用图标大小
        const desktop = document.getElementById('desktop');
        desktop.className = desktop.className.replace(/icon-size-\w+/, '');
        desktop.classList.add(`icon-size-${this.settings.iconSize}`);
        
        // 应用网格显示
        if (this.settings.showGrid) {
            desktop.classList.add('show-grid');
        } else {
            desktop.classList.remove('show-grid');
        }
        
        // 应用动画设置
        if (!this.settings.enableAnimations) {
            document.body.classList.add('no-animations');
        } else {
            document.body.classList.remove('no-animations');
        }
    }
    
    getSettings() {
        return this.settings;
    }
    
    getSetting(key) {
        return this.settings[key];
    }
    
    setSetting(key, value) {
        this.settings[key] = value;
    }
    
    destroy() {
        console.log('设置应用已销毁');
    }
} 