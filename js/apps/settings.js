// 系统设置应用
class Settings extends Application {
    constructor() {
        super('设置', 'fas fa-cog');
        
        this.settings = {
            appearance: {
                theme: 'default',
                wallpaper: 'gradient-blue',
                taskbarPosition: 'bottom',
                iconSize: 'medium',
                fontSize: 14,
                animations: true
            },
            system: {
                language: 'zh-CN',
                timezone: 'Asia/Shanghai',
                autoSave: true,
                showNotifications: true,
                soundEnabled: true
            },
            privacy: {
                saveHistory: true,
                autoComplete: true,
                collectAnalytics: false
            }
        };
        
        this.loadSettings();
    }

    render() {
        return `
            <div class="settings">
                <div class="settings-sidebar">
                    <div class="settings-nav">
                        <div class="settings-nav-item active" data-section="appearance">
                            <i class="fas fa-palette"></i>
                            <span>外观</span>
                        </div>
                        <div class="settings-nav-item" data-section="system">
                            <i class="fas fa-cogs"></i>
                            <span>系统</span>
                        </div>
                        <div class="settings-nav-item" data-section="privacy">
                            <i class="fas fa-shield-alt"></i>
                            <span>隐私</span>
                        </div>
                        <div class="settings-nav-item" data-section="about">
                            <i class="fas fa-info-circle"></i>
                            <span>关于</span>
                        </div>
                    </div>
                </div>
                <div class="settings-content">
                    ${this.renderAppearanceSection()}
                </div>
            </div>
        `;
    }

    renderAppearanceSection() {
        return `
            <div class="settings-section" data-section="appearance">
                <div class="settings-section-header">
                    <h2>外观设置</h2>
                    <p>自定义桌面的外观和感觉</p>
                </div>
                <div class="settings-section-content">
                    <div class="settings-group">
                        <h3>主题</h3>
                        <div class="theme-selector">
                            <div class="theme-option ${this.settings.appearance.theme === 'default' ? 'active' : ''}" data-theme="default">
                                <div class="theme-preview default-theme"></div>
                                <span>默认</span>
                            </div>
                            <div class="theme-option ${this.settings.appearance.theme === 'dark' ? 'active' : ''}" data-theme="dark">
                                <div class="theme-preview dark-theme"></div>
                                <span>深色</span>
                            </div>
                            <div class="theme-option ${this.settings.appearance.theme === 'light' ? 'active' : ''}" data-theme="light">
                                <div class="theme-preview light-theme"></div>
                                <span>浅色</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="settings-group">
                        <h3>壁纸</h3>
                        <div class="wallpaper-selector">
                            <div class="wallpaper-option ${this.settings.appearance.wallpaper === 'gradient-blue' ? 'active' : ''}" data-wallpaper="gradient-blue">
                                <div class="wallpaper-preview" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);"></div>
                                <span>蓝色渐变</span>
                            </div>
                            <div class="wallpaper-option ${this.settings.appearance.wallpaper === 'gradient-purple' ? 'active' : ''}" data-wallpaper="gradient-purple">
                                <div class="wallpaper-preview" style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);"></div>
                                <span>紫色渐变</span>
                            </div>
                            <div class="wallpaper-option ${this.settings.appearance.wallpaper === 'gradient-orange' ? 'active' : ''}" data-wallpaper="gradient-orange">
                                <div class="wallpaper-preview" style="background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);"></div>
                                <span>橙色渐变</span>
                            </div>
                            <div class="wallpaper-option ${this.settings.appearance.wallpaper === 'solid-dark' ? 'active' : ''}" data-wallpaper="solid-dark">
                                <div class="wallpaper-preview" style="background: #2c3e50;"></div>
                                <span>深色纯色</span>
                            </div>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3>界面选项</h3>
                        <div class="settings-item">
                            <div class="settings-label">
                                <label for="taskbar-position">任务栏位置</label>
                            </div>
                            <div class="settings-control">
                                <select id="taskbar-position">
                                    <option value="bottom" ${this.settings.appearance.taskbarPosition === 'bottom' ? 'selected' : ''}>底部</option>
                                    <option value="top" ${this.settings.appearance.taskbarPosition === 'top' ? 'selected' : ''}>顶部</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="settings-item">
                            <div class="settings-label">
                                <label for="icon-size">图标大小</label>
                            </div>
                            <div class="settings-control">
                                <select id="icon-size">
                                    <option value="small" ${this.settings.appearance.iconSize === 'small' ? 'selected' : ''}>小</option>
                                    <option value="medium" ${this.settings.appearance.iconSize === 'medium' ? 'selected' : ''}>中</option>
                                    <option value="large" ${this.settings.appearance.iconSize === 'large' ? 'selected' : ''}>大</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="settings-item">
                            <div class="settings-label">
                                <label for="font-size">字体大小</label>
                                <div class="settings-description">调整系统字体大小</div>
                            </div>
                            <div class="settings-control">
                                <input type="range" id="font-size" min="12" max="20" value="${this.settings.appearance.fontSize}">
                                <span class="range-value">${this.settings.appearance.fontSize}px</span>
                            </div>
                        </div>
                        
                        <div class="settings-item">
                            <div class="settings-label">
                                <label for="animations">启用动画效果</label>
                                <div class="settings-description">窗口和界面动画</div>
                            </div>
                            <div class="settings-control">
                                <input type="checkbox" id="animations" ${this.settings.appearance.animations ? 'checked' : ''}>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderSystemSection() {
        return `
            <div class="settings-section" data-section="system">
                <div class="settings-section-header">
                    <h2>系统设置</h2>
                    <p>系统行为和功能配置</p>
                </div>
                <div class="settings-section-content">
                    <div class="settings-group">
                        <h3>区域和语言</h3>
                        <div class="settings-item">
                            <div class="settings-label">
                                <label for="language">系统语言</label>
                            </div>
                            <div class="settings-control">
                                <select id="language">
                                    <option value="zh-CN" ${this.settings.system.language === 'zh-CN' ? 'selected' : ''}>中文（简体）</option>
                                    <option value="en-US" ${this.settings.system.language === 'en-US' ? 'selected' : ''}>English (US)</option>
                                    <option value="ja-JP" ${this.settings.system.language === 'ja-JP' ? 'selected' : ''}>日本語</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="settings-item">
                            <div class="settings-label">
                                <label for="timezone">时区</label>
                            </div>
                            <div class="settings-control">
                                <select id="timezone">
                                    <option value="Asia/Shanghai" ${this.settings.system.timezone === 'Asia/Shanghai' ? 'selected' : ''}>中国标准时间</option>
                                    <option value="America/New_York" ${this.settings.system.timezone === 'America/New_York' ? 'selected' : ''}>美国东部时间</option>
                                    <option value="Europe/London" ${this.settings.system.timezone === 'Europe/London' ? 'selected' : ''}>格林威治时间</option>
                                    <option value="Asia/Tokyo" ${this.settings.system.timezone === 'Asia/Tokyo' ? 'selected' : ''}>日本标准时间</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3>系统行为</h3>
                        <div class="settings-item">
                            <div class="settings-label">
                                <label for="auto-save">自动保存</label>
                                <div class="settings-description">自动保存文档和设置</div>
                            </div>
                            <div class="settings-control">
                                <input type="checkbox" id="auto-save" ${this.settings.system.autoSave ? 'checked' : ''}>
                            </div>
                        </div>
                        
                        <div class="settings-item">
                            <div class="settings-label">
                                <label for="notifications">显示通知</label>
                                <div class="settings-description">系统和应用通知</div>
                            </div>
                            <div class="settings-control">
                                <input type="checkbox" id="notifications" ${this.settings.system.showNotifications ? 'checked' : ''}>
                            </div>
                        </div>
                        
                        <div class="settings-item">
                            <div class="settings-label">
                                <label for="sound">启用声音</label>
                                <div class="settings-description">系统声音和提示音</div>
                            </div>
                            <div class="settings-control">
                                <input type="checkbox" id="sound" ${this.settings.system.soundEnabled ? 'checked' : ''}>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderPrivacySection() {
        return `
            <div class="settings-section" data-section="privacy">
                <div class="settings-section-header">
                    <h2>隐私设置</h2>
                    <p>控制数据收集和隐私选项</p>
                </div>
                <div class="settings-section-content">
                    <div class="settings-group">
                        <h3>数据和历史</h3>
                        <div class="settings-item">
                            <div class="settings-label">
                                <label for="save-history">保存使用历史</label>
                                <div class="settings-description">保存命令历史和文件访问记录</div>
                            </div>
                            <div class="settings-control">
                                <input type="checkbox" id="save-history" ${this.settings.privacy.saveHistory ? 'checked' : ''}>
                            </div>
                        </div>
                        
                        <div class="settings-item">
                            <div class="settings-label">
                                <label for="auto-complete">启用自动完成</label>
                                <div class="settings-description">根据历史记录提供输入建议</div>
                            </div>
                            <div class="settings-control">
                                <input type="checkbox" id="auto-complete" ${this.settings.privacy.autoComplete ? 'checked' : ''}>
                            </div>
                        </div>
                        
                        <div class="settings-item">
                            <div class="settings-label">
                                <label for="analytics">发送使用统计</label>
                                <div class="settings-description">帮助改进 WebOS Desktop</div>
                            </div>
                            <div class="settings-control">
                                <input type="checkbox" id="analytics" ${this.settings.privacy.collectAnalytics ? 'checked' : ''}>
                            </div>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3>数据管理</h3>
                        <div class="settings-item">
                            <div class="settings-label">
                                <label>清除所有数据</label>
                                <div class="settings-description">删除所有本地存储的数据</div>
                            </div>
                            <div class="settings-control">
                                <button id="clear-data" class="danger-button">清除数据</button>
                            </div>
                        </div>
                        
                        <div class="settings-item">
                            <div class="settings-label">
                                <label>导出设置</label>
                                <div class="settings-description">保存当前设置到文件</div>
                            </div>
                            <div class="settings-control">
                                <button id="export-settings">导出</button>
                            </div>
                        </div>
                        
                        <div class="settings-item">
                            <div class="settings-label">
                                <label>导入设置</label>
                                <div class="settings-description">从文件恢复设置</div>
                            </div>
                            <div class="settings-control">
                                <button id="import-settings">导入</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderAboutSection() {
        return `
            <div class="settings-section" data-section="about">
                <div class="settings-section-header">
                    <h2>关于 WebOS Desktop</h2>
                </div>
                <div class="settings-section-content">
                    <div class="about-info">
                        <div class="about-logo">
                            <i class="fas fa-desktop"></i>
                        </div>
                        <div class="about-details">
                            <h3>WebOS Desktop</h3>
                            <p class="version">版本 1.0.0</p>
                            <p class="description">一个现代化的Web桌面操作系统，在浏览器中提供完整的桌面体验。</p>
                            
                            <div class="system-info">
                                <h4>系统信息</h4>
                                <div class="info-grid">
                                    <div class="info-item">
                                        <span class="info-label">浏览器:</span>
                                        <span class="info-value">${navigator.userAgent.split(' ')[0]}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">平台:</span>
                                        <span class="info-value">${navigator.platform}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">语言:</span>
                                        <span class="info-value">${navigator.language}</span>
                                    </div>
                                    <div class="info-item">
                                        <span class="info-label">屏幕分辨率:</span>
                                        <span class="info-value">${screen.width} × ${screen.height}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="about-actions">
                                <button id="check-updates">检查更新</button>
                                <button id="view-license">查看许可证</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    onMount() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        
        // 导航菜单
        window.querySelectorAll('.settings-nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.switchSection(item.dataset.section);
            });
        });

        // 主题选择
        window.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                this.changeTheme(option.dataset.theme);
            });
        });

        // 壁纸选择
        window.querySelectorAll('.wallpaper-option').forEach(option => {
            option.addEventListener('click', () => {
                this.changeWallpaper(option.dataset.wallpaper);
            });
        });

        // 设置控件
        this.setupSettingsControls(window);
    }

    setupSettingsControls(window) {
        // 字体大小滑块
        const fontSizeSlider = window.querySelector('#font-size');
        if (fontSizeSlider) {
            fontSizeSlider.addEventListener('input', (e) => {
                const value = e.target.value;
                window.querySelector('.range-value').textContent = `${value}px`;
                this.updateSetting('appearance.fontSize', parseInt(value));
            });
        }

        // 复选框
        window.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.handleCheckboxChange(checkbox);
            });
        });

        // 下拉选择
        window.querySelectorAll('select').forEach(select => {
            select.addEventListener('change', () => {
                this.handleSelectChange(select);
            });
        });

        // 按钮事件
        const clearDataBtn = window.querySelector('#clear-data');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => this.clearAllData());
        }

        const exportBtn = window.querySelector('#export-settings');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportSettings());
        }

        const importBtn = window.querySelector('#import-settings');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importSettings());
        }

        const checkUpdatesBtn = window.querySelector('#check-updates');
        if (checkUpdatesBtn) {
            checkUpdatesBtn.addEventListener('click', () => this.checkUpdates());
        }

        const viewLicenseBtn = window.querySelector('#view-license');
        if (viewLicenseBtn) {
            viewLicenseBtn.addEventListener('click', () => this.viewLicense());
        }
    }

    switchSection(section) {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        
        // 更新导航状态
        window.querySelectorAll('.settings-nav-item').forEach(item => {
            item.classList.remove('active');
        });
        window.querySelector(`[data-section="${section}"]`).classList.add('active');

        // 更新内容
        const contentContainer = window.querySelector('.settings-content');
        switch (section) {
            case 'appearance':
                contentContainer.innerHTML = this.renderAppearanceSection();
                break;
            case 'system':
                contentContainer.innerHTML = this.renderSystemSection();
                break;
            case 'privacy':
                contentContainer.innerHTML = this.renderPrivacySection();
                break;
            case 'about':
                contentContainer.innerHTML = this.renderAboutSection();
                break;
        }

        // 重新绑定事件
        this.setupSettingsControls(window);
    }

    changeTheme(theme) {
        this.updateSetting('appearance.theme', theme);
        this.applyTheme(theme);
        
        // 更新UI
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        window.querySelectorAll('.theme-option').forEach(option => {
            option.classList.remove('active');
        });
        window.querySelector(`[data-theme="${theme}"]`).classList.add('active');
    }

    changeWallpaper(wallpaper) {
        this.updateSetting('appearance.wallpaper', wallpaper);
        this.applyWallpaper(wallpaper);
        
        // 更新UI
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        window.querySelectorAll('.wallpaper-option').forEach(option => {
            option.classList.remove('active');
        });
        window.querySelector(`[data-wallpaper="${wallpaper}"]`).classList.add('active');
    }

    applyTheme(theme) {
        const desktop = document.getElementById('desktop');
        desktop.className = `theme-${theme}`;
    }

    applyWallpaper(wallpaper) {
        const desktop = document.getElementById('desktop');
        const wallpapers = {
            'gradient-blue': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            'gradient-purple': 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
            'gradient-orange': 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
            'solid-dark': '#2c3e50'
        };
        
        desktop.style.background = wallpapers[wallpaper] || wallpapers['gradient-blue'];
    }

    handleCheckboxChange(checkbox) {
        const id = checkbox.id;
        const checked = checkbox.checked;
        
        const settingMap = {
            'animations': 'appearance.animations',
            'auto-save': 'system.autoSave',
            'notifications': 'system.showNotifications',
            'sound': 'system.soundEnabled',
            'save-history': 'privacy.saveHistory',
            'auto-complete': 'privacy.autoComplete',
            'analytics': 'privacy.collectAnalytics'
        };
        
        if (settingMap[id]) {
            this.updateSetting(settingMap[id], checked);
        }
    }

    handleSelectChange(select) {
        const id = select.id;
        const value = select.value;
        
        const settingMap = {
            'taskbar-position': 'appearance.taskbarPosition',
            'icon-size': 'appearance.iconSize',
            'language': 'system.language',
            'timezone': 'system.timezone'
        };
        
        if (settingMap[id]) {
            this.updateSetting(settingMap[id], value);
        }
    }

    updateSetting(path, value) {
        const parts = path.split('.');
        let current = this.settings;
        
        for (let i = 0; i < parts.length - 1; i++) {
            current = current[parts[i]];
        }
        
        current[parts[parts.length - 1]] = value;
        this.saveSettings();
    }

    loadSettings() {
        try {
            const saved = localStorage.getItem('webos-settings');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = { ...this.settings, ...parsed };
            }
        } catch (error) {
            console.warn('Failed to load settings:', error);
        }
        
        // 应用加载的设置
        this.applyTheme(this.settings.appearance.theme);
        this.applyWallpaper(this.settings.appearance.wallpaper);
    }

    saveSettings() {
        try {
            localStorage.setItem('webos-settings', JSON.stringify(this.settings));
        } catch (error) {
            console.warn('Failed to save settings:', error);
        }
    }

    clearAllData() {
        if (confirm('确定要清除所有数据吗？这将删除所有设置、文件和历史记录。')) {
            localStorage.clear();
            sessionStorage.clear();
            alert('数据已清除。页面将刷新。');
            location.reload();
        }
    }

    exportSettings() {
        const data = JSON.stringify(this.settings, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'webos-settings.json';
        a.click();
        
        URL.revokeObjectURL(url);
    }

    importSettings() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const imported = JSON.parse(e.target.result);
                    this.settings = { ...this.settings, ...imported };
                    this.saveSettings();
                    alert('设置已导入。页面将刷新以应用更改。');
                    location.reload();
                } catch (error) {
                    alert('导入失败：无效的设置文件');
                }
            };
            reader.readAsText(file);
        });
        
        input.click();
    }

    checkUpdates() {
        // 模拟检查更新
        setTimeout(() => {
            alert('您正在使用最新版本的 WebOS Desktop！');
        }, 1000);
    }

    viewLicense() {
        const licenseText = `
WebOS Desktop 许可证

MIT License

Copyright (c) 2024 WebOS Desktop

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
        `;

        const dialog = document.createElement('div');
        dialog.className = 'license-dialog';
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            z-index: 10001;
            max-width: 600px;
            max-height: 500px;
        `;

        dialog.innerHTML = `
            <h3 style="margin-bottom: 12px;">软件许可证</h3>
            <div style="max-height: 400px; overflow-y: auto; border: 1px solid #eee; padding: 10px; font-family: monospace; font-size: 12px; white-space: pre-line;">${licenseText}</div>
            <div style="margin-top: 12px; text-align: right;">
                <button onclick="this.parentElement.parentElement.remove()" style="padding: 8px 16px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: pointer;">关闭</button>
            </div>
        `;

        document.body.appendChild(dialog);
    }
}

// 添加设置应用的样式
const settingsStyle = document.createElement('style');
settingsStyle.textContent = `
    .settings {
        display: flex;
        height: 100%;
        background: white;
    }
    
    .settings-sidebar {
        width: 200px;
        background: #f8f9fa;
        border-right: 1px solid #e9ecef;
    }
    
    .settings-nav {
        padding: 20px 0;
    }
    
    .settings-nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 20px;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #495057;
    }
    
    .settings-nav-item:hover {
        background: #e9ecef;
    }
    
    .settings-nav-item.active {
        background: #007bff;
        color: white;
    }
    
    .settings-nav-item i {
        width: 16px;
        text-align: center;
    }
    
    .settings-content {
        flex: 1;
        overflow-y: auto;
        padding: 0;
    }
    
    .settings-section-header {
        padding: 30px 30px 20px;
        border-bottom: 1px solid #e9ecef;
    }
    
    .settings-section-header h2 {
        margin: 0 0 8px;
        color: #212529;
    }
    
    .settings-section-header p {
        margin: 0;
        color: #6c757d;
        font-size: 14px;
    }
    
    .settings-section-content {
        padding: 30px;
    }
    
    .settings-group {
        margin-bottom: 40px;
    }
    
    .settings-group h3 {
        margin: 0 0 20px;
        color: #495057;
        font-size: 16px;
        font-weight: 600;
    }
    
    .theme-selector,
    .wallpaper-selector {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
    }
    
    .theme-option,
    .wallpaper-option {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 16px;
        border: 2px solid #e9ecef;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .theme-option:hover,
    .wallpaper-option:hover {
        border-color: #007bff;
    }
    
    .theme-option.active,
    .wallpaper-option.active {
        border-color: #007bff;
        background: #f8f9fa;
    }
    
    .theme-preview,
    .wallpaper-preview {
        width: 60px;
        height: 40px;
        border-radius: 4px;
        border: 1px solid #dee2e6;
    }
    
    .default-theme {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    .dark-theme {
        background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
    }
    
    .light-theme {
        background: linear-gradient(135deg, #ecf0f1 0%, #bdc3c7 100%);
    }
    
    .settings-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 16px 0;
        border-bottom: 1px solid #f8f9fa;
    }
    
    .settings-item:last-child {
        border-bottom: none;
    }
    
    .settings-label {
        flex: 1;
    }
    
    .settings-label label {
        font-weight: 500;
        color: #495057;
        cursor: pointer;
    }
    
    .settings-description {
        font-size: 12px;
        color: #6c757d;
        margin-top: 4px;
    }
    
    .settings-control {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .settings-control input[type="range"] {
        width: 120px;
    }
    
    .range-value {
        font-size: 12px;
        color: #6c757d;
        min-width: 40px;
    }
    
    .settings-control select {
        padding: 4px 8px;
        border: 1px solid #dee2e6;
        border-radius: 4px;
        background: white;
    }
    
    .settings-control input[type="checkbox"] {
        width: 18px;
        height: 18px;
        cursor: pointer;
    }
    
    .settings-control button {
        padding: 6px 12px;
        border: 1px solid #dee2e6;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .settings-control button:hover {
        background: #f8f9fa;
    }
    
    .danger-button {
        background: #dc3545 !important;
        color: white !important;
        border-color: #dc3545 !important;
    }
    
    .danger-button:hover {
        background: #c82333 !important;
    }
    
    .about-info {
        display: flex;
        gap: 30px;
        align-items: flex-start;
    }
    
    .about-logo {
        font-size: 64px;
        color: #007bff;
    }
    
    .about-details h3 {
        margin: 0 0 8px;
        font-size: 24px;
        color: #212529;
    }
    
    .version {
        color: #6c757d;
        margin: 0 0 16px;
    }
    
    .description {
        color: #495057;
        line-height: 1.5;
        margin: 0 0 24px;
    }
    
    .system-info h4 {
        margin: 0 0 12px;
        color: #495057;
    }
    
    .info-grid {
        display: grid;
        gap: 8px;
        margin-bottom: 24px;
    }
    
    .info-item {
        display: flex;
        justify-content: space-between;
    }
    
    .info-label {
        color: #6c757d;
        font-size: 14px;
    }
    
    .info-value {
        color: #495057;
        font-size: 14px;
        font-weight: 500;
    }
    
    .about-actions {
        display: flex;
        gap: 12px;
    }
    
    .about-actions button {
        padding: 8px 16px;
        border: 1px solid #dee2e6;
        background: white;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.2s ease;
    }
    
    .about-actions button:hover {
        background: #f8f9fa;
    }
`;
document.head.appendChild(settingsStyle); 