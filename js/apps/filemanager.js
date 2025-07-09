// 文件管理器应用
class FileManager extends Application {
    constructor() {
        super('文件管理器', 'fas fa-folder');
        
        this.currentPath = '/';
        this.selectedItems = new Set();
        this.fileSystem = this.createVirtualFileSystem();
    }

    createVirtualFileSystem() {
        return {
            '/': {
                type: 'directory',
                children: {
                    'Documents': {
                        type: 'directory',
                        children: {
                            'README.txt': {
                                type: 'file',
                                size: 1024,
                                content: '欢迎使用 WebOS Desktop！\n\n这是一个基于Web的桌面系统，您可以：\n- 使用文件管理器浏览文件\n- 打开文本编辑器编辑文档\n- 使用计算器进行计算\n- 打开终端执行命令\n- 通过设置自定义系统\n\n所有功能都在浏览器中运行，无需安装任何软件。'
                            },
                            'Notes.md': {
                                type: 'file',
                                size: 512,
                                content: '# 我的笔记\n\n## 待办事项\n- [ ] 学习 WebOS Desktop\n- [ ] 创建新项目\n- [ ] 整理文档\n\n## 想法\n- 这个桌面系统很有趣\n- 可以在浏览器中模拟完整的操作系统体验'
                            }
                        }
                    },
                    'Pictures': {
                        type: 'directory',
                        children: {
                            'wallpaper.jpg': {
                                type: 'file',
                                size: 2048000,
                                content: 'binary'
                            }
                        }
                    },
                    'Downloads': {
                        type: 'directory',
                        children: {}
                    },
                    'Desktop': {
                        type: 'directory',
                        children: {
                            'shortcut.lnk': {
                                type: 'file',
                                size: 256,
                                content: 'link'
                            }
                        }
                    }
                }
            }
        };
    }

    render() {
        return `
            <div class="file-manager">
                <div class="file-manager-toolbar">
                    <button id="back-btn" title="后退">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <button id="forward-btn" title="前进">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                    <button id="up-btn" title="上一级">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <input type="text" class="file-path" id="path-input" value="${this.currentPath}" readonly>
                    <button id="refresh-btn" title="刷新">
                        <i class="fas fa-sync"></i>
                    </button>
                    <button id="new-folder-btn" title="新建文件夹">
                        <i class="fas fa-folder-plus"></i>
                    </button>
                </div>
                <div class="file-list" id="file-list">
                    ${this.renderFileList()}
                </div>
            </div>
        `;
    }

    renderFileList() {
        const currentDir = this.getCurrentDirectory();
        if (!currentDir || !currentDir.children) {
            return '<div class="empty-folder">此文件夹为空</div>';
        }

        let html = '';
        
        // 如果不在根目录，添加"返回上级"项
        if (this.currentPath !== '/') {
            html += `
                <div class="file-item" data-name=".." data-type="directory">
                    <i class="file-icon fas fa-level-up-alt"></i>
                    <span class="file-name">..</span>
                    <span class="file-size"></span>
                </div>
            `;
        }

        // 先显示文件夹
        for (const [name, item] of Object.entries(currentDir.children)) {
            if (item.type === 'directory') {
                html += this.renderFileItem(name, item);
            }
        }

        // 再显示文件
        for (const [name, item] of Object.entries(currentDir.children)) {
            if (item.type === 'file') {
                html += this.renderFileItem(name, item);
            }
        }

        return html || '<div class="empty-folder">此文件夹为空</div>';
    }

    renderFileItem(name, item) {
        const icon = this.getFileIcon(name, item.type);
        const size = item.type === 'file' ? this.formatFileSize(item.size) : '';
        
        return `
            <div class="file-item" data-name="${name}" data-type="${item.type}">
                <i class="file-icon ${icon}"></i>
                <span class="file-name">${name}</span>
                <span class="file-size">${size}</span>
            </div>
        `;
    }

    getFileIcon(name, type) {
        if (type === 'directory') {
            return 'fas fa-folder';
        }

        const ext = name.split('.').pop().toLowerCase();
        const iconMap = {
            'txt': 'fas fa-file-text',
            'md': 'fab fa-markdown',
            'jpg': 'fas fa-file-image',
            'jpeg': 'fas fa-file-image',
            'png': 'fas fa-file-image',
            'gif': 'fas fa-file-image',
            'pdf': 'fas fa-file-pdf',
            'doc': 'fas fa-file-word',
            'docx': 'fas fa-file-word',
            'xls': 'fas fa-file-excel',
            'xlsx': 'fas fa-file-excel',
            'lnk': 'fas fa-link'
        };

        return iconMap[ext] || 'fas fa-file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    getCurrentDirectory() {
        const parts = this.currentPath.split('/').filter(part => part);
        let current = this.fileSystem['/'];
        
        for (const part of parts) {
            if (current.children && current.children[part]) {
                current = current.children[part];
            } else {
                return null;
            }
        }
        
        return current;
    }

    onMount() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        
        // 工具栏按钮
        window.querySelector('#back-btn').addEventListener('click', () => this.goBack());
        window.querySelector('#up-btn').addEventListener('click', () => this.goUp());
        window.querySelector('#refresh-btn').addEventListener('click', () => this.refresh());
        window.querySelector('#new-folder-btn').addEventListener('click', () => this.createNewFolder());

        // 文件列表事件
        const fileList = window.querySelector('#file-list');
        
        fileList.addEventListener('click', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (!fileItem) return;

            this.selectItem(fileItem);
        });

        fileList.addEventListener('dblclick', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (!fileItem) return;

            this.openItem(fileItem);
        });

        // 右键菜单
        fileList.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            const fileItem = e.target.closest('.file-item');
            this.showContextMenu(e.clientX, e.clientY, fileItem);
        });
    }

    selectItem(fileItem) {
        // 清除其他选中状态
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        window.querySelectorAll('.file-item.selected').forEach(item => {
            item.classList.remove('selected');
        });

        // 选中当前项
        fileItem.classList.add('selected');
        this.selectedItems.clear();
        this.selectedItems.add(fileItem.dataset.name);
    }

    openItem(fileItem) {
        const name = fileItem.dataset.name;
        const type = fileItem.dataset.type;

        if (name === '..') {
            this.goUp();
            return;
        }

        if (type === 'directory') {
            this.navigateToPath(this.joinPath(this.currentPath, name));
        } else {
            this.openFile(name);
        }
    }

    openFile(fileName) {
        const file = this.getFileByPath(this.joinPath(this.currentPath, fileName));
        if (!file) return;

        const ext = fileName.split('.').pop().toLowerCase();
        
        if (['txt', 'md'].includes(ext)) {
            // 用文本编辑器打开
            const textEditor = new TextEditor();
            const windowId = desktop.windowManager.createWindow(textEditor);
            textEditor.windowId = windowId;
            desktop.runningApps.set('texteditor-' + Date.now(), textEditor);
            desktop.addToTaskbar('texteditor-' + Date.now(), textEditor);
            
            // 加载文件内容
            setTimeout(() => {
                const editorWindow = document.querySelector(`[data-window-id="${windowId}"]`);
                const textarea = editorWindow.querySelector('.text-editor-content');
                if (textarea) {
                    textarea.value = file.content;
                }
            }, 100);
        } else {
            alert(`无法打开文件: ${fileName}\n文件类型: ${ext}`);
        }
    }

    getFileByPath(path) {
        const parts = path.split('/').filter(part => part);
        let current = this.fileSystem['/'];
        
        for (const part of parts) {
            if (current.children && current.children[part]) {
                current = current.children[part];
            } else {
                return null;
            }
        }
        
        return current;
    }

    navigateToPath(path) {
        const dir = this.getFileByPath(path);
        if (dir && dir.type === 'directory') {
            this.currentPath = path;
            this.refresh();
        }
    }

    goBack() {
        // 简单的后退功能
        this.goUp();
    }

    goUp() {
        if (this.currentPath === '/') return;
        
        const parts = this.currentPath.split('/').filter(part => part);
        parts.pop();
        this.currentPath = '/' + parts.join('/');
        if (this.currentPath !== '/' && this.currentPath.endsWith('/')) {
            this.currentPath = this.currentPath.slice(0, -1);
        }
        this.refresh();
    }

    refresh() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const fileList = window.querySelector('#file-list');
        const pathInput = window.querySelector('#path-input');
        
        pathInput.value = this.currentPath;
        fileList.innerHTML = this.renderFileList();
        
        // 重新绑定事件
        this.setupFileListEvents(fileList);
    }

    setupFileListEvents(fileList) {
        fileList.addEventListener('click', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (!fileItem) return;
            this.selectItem(fileItem);
        });

        fileList.addEventListener('dblclick', (e) => {
            const fileItem = e.target.closest('.file-item');
            if (!fileItem) return;
            this.openItem(fileItem);
        });
    }

    createNewFolder() {
        const name = prompt('请输入文件夹名称:', '新建文件夹');
        if (!name) return;

        const currentDir = this.getCurrentDirectory();
        if (currentDir && currentDir.children) {
            if (currentDir.children[name]) {
                alert('文件夹已存在！');
                return;
            }
            
            currentDir.children[name] = {
                type: 'directory',
                children: {}
            };
            
            this.refresh();
        }
    }

    joinPath(basePath, name) {
        if (basePath === '/') {
            return '/' + name;
        }
        return basePath + '/' + name;
    }

    showContextMenu(x, y, fileItem) {
        const existingMenu = document.querySelector('.file-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const contextMenu = document.createElement('div');
        contextMenu.className = 'file-context-menu';
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

        const menuItems = fileItem ? [
            { text: '打开', action: () => this.openItem(fileItem) },
            { text: '重命名', action: () => this.renameItem(fileItem) },
            { text: '删除', action: () => this.deleteItem(fileItem) }
        ] : [
            { text: '新建文件夹', action: () => this.createNewFolder() },
            { text: '刷新', action: () => this.refresh() }
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

        setTimeout(() => {
            document.addEventListener('click', function closeMenu() {
                contextMenu.remove();
                document.removeEventListener('click', closeMenu);
            });
        }, 100);
    }

    renameItem(fileItem) {
        const oldName = fileItem.dataset.name;
        const newName = prompt('请输入新名称:', oldName);
        if (!newName || newName === oldName) return;

        const currentDir = this.getCurrentDirectory();
        if (currentDir && currentDir.children && currentDir.children[oldName]) {
            currentDir.children[newName] = currentDir.children[oldName];
            delete currentDir.children[oldName];
            this.refresh();
        }
    }

    deleteItem(fileItem) {
        const name = fileItem.dataset.name;
        if (!confirm(`确定要删除 "${name}" 吗？`)) return;

        const currentDir = this.getCurrentDirectory();
        if (currentDir && currentDir.children && currentDir.children[name]) {
            delete currentDir.children[name];
            this.refresh();
        }
    }
} 