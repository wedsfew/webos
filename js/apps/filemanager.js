// 文件管理器应用
class FileManagerApp {
    constructor(windowId) {
        this.windowId = windowId;
        this.currentPath = '/';
        this.files = this.generateSampleFiles();
        this.selectedFiles = new Set();
        this.init();
    }
    
    init() {
        const content = WindowManager.getWindowContent(this.windowId);
        content.innerHTML = this.getHTML();
        this.setupEvents();
        this.updateFileList();
    }
    
    getHTML() {
        return `
            <div class="filemanager-app">
                <div class="fm-toolbar">
                    <button class="fm-button" id="back-btn" title="后退">
                        <i class="fas fa-arrow-left"></i>
                    </button>
                    <button class="fm-button" id="up-btn" title="上级目录">
                        <i class="fas fa-arrow-up"></i>
                    </button>
                    <button class="fm-button" id="refresh-btn" title="刷新">
                        <i class="fas fa-sync"></i>
                    </button>
                    <div class="fm-path" id="current-path">/</div>
                    <button class="fm-button" id="new-folder-btn" title="新建文件夹">
                        <i class="fas fa-folder-plus"></i>
                    </button>
                    <button class="fm-button" id="view-toggle-btn" title="切换视图">
                        <i class="fas fa-th"></i>
                    </button>
                </div>
                <div class="fm-content">
                    <div class="file-list" id="file-list">
                        <!-- 文件列表将在这里动态生成 -->
                    </div>
                </div>
            </div>
        `;
    }
    
    setupEvents() {
        const content = WindowManager.getWindowContent(this.windowId);
        
        // 工具栏按钮事件
        content.querySelector('#back-btn').addEventListener('click', () => this.goBack());
        content.querySelector('#up-btn').addEventListener('click', () => this.goUp());
        content.querySelector('#refresh-btn').addEventListener('click', () => this.refresh());
        content.querySelector('#new-folder-btn').addEventListener('click', () => this.createNewFolder());
        content.querySelector('#view-toggle-btn').addEventListener('click', () => this.toggleView());
        
        // 文件列表事件
        const fileList = content.querySelector('#file-list');
        fileList.addEventListener('click', (e) => this.handleFileClick(e));
        fileList.addEventListener('dblclick', (e) => this.handleFileDoubleClick(e));
        
        // 右键菜单
        fileList.addEventListener('contextmenu', (e) => this.showContextMenu(e));
        
        // 键盘事件
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }
    
    generateSampleFiles() {
        return {
            '/': [
                { name: '文档', type: 'folder', size: null, modified: '2024-01-15' },
                { name: '图片', type: 'folder', size: null, modified: '2024-01-14' },
                { name: '音乐', type: 'folder', size: null, modified: '2024-01-13' },
                { name: '视频', type: 'folder', size: null, modified: '2024-01-12' },
                { name: '下载', type: 'folder', size: null, modified: '2024-01-11' },
                { name: 'readme.txt', type: 'file', size: '1.2 KB', modified: '2024-01-10' },
                { name: 'config.json', type: 'file', size: '856 B', modified: '2024-01-09' }
            ],
            '/文档': [
                { name: '..', type: 'parent', size: null, modified: null },
                { name: '工作文档', type: 'folder', size: null, modified: '2024-01-15' },
                { name: '个人笔记', type: 'folder', size: null, modified: '2024-01-14' },
                { name: '会议记录.docx', type: 'file', size: '245 KB', modified: '2024-01-15' },
                { name: '项目计划.pdf', type: 'file', size: '1.8 MB', modified: '2024-01-14' },
                { name: '演示文稿.pptx', type: 'file', size: '3.2 MB', modified: '2024-01-13' }
            ],
            '/图片': [
                { name: '..', type: 'parent', size: null, modified: null },
                { name: '照片', type: 'folder', size: null, modified: '2024-01-14' },
                { name: '截图', type: 'folder', size: null, modified: '2024-01-13' },
                { name: '头像.jpg', type: 'file', size: '156 KB', modified: '2024-01-14' },
                { name: '壁纸.png', type: 'file', size: '2.3 MB', modified: '2024-01-13' },
                { name: 'logo.svg', type: 'file', size: '45 KB', modified: '2024-01-12' }
            ],
            '/音乐': [
                { name: '..', type: 'parent', size: null, modified: null },
                { name: '流行音乐', type: 'folder', size: null, modified: '2024-01-13' },
                { name: '古典音乐', type: 'folder', size: null, modified: '2024-01-12' },
                { name: '歌曲1.mp3', type: 'file', size: '4.2 MB', modified: '2024-01-13' },
                { name: '歌曲2.flac', type: 'file', size: '28.5 MB', modified: '2024-01-12' }
            ]
        };
    }
    
    updateFileList() {
        const content = WindowManager.getWindowContent(this.windowId);
        const fileList = content.querySelector('#file-list');
        const pathElement = content.querySelector('#current-path');
        
        pathElement.textContent = this.currentPath;
        
        const files = this.files[this.currentPath] || [];
        
        fileList.innerHTML = files.map(file => {
            const selectedClass = this.selectedFiles.has(file.name) ? 'selected' : '';
            const icon = this.getFileIcon(file);
            const sizeText = file.size ? `<div class="file-size">${file.size}</div>` : '';
            const modifiedText = file.modified ? `<div class="file-modified">${file.modified}</div>` : '';
            
            return `
                <div class="file-item ${selectedClass}" data-name="${file.name}" data-type="${file.type}">
                    <div class="file-icon">${icon}</div>
                    <div class="file-name">${file.name}</div>
                    ${sizeText}
                    ${modifiedText}
                </div>
            `;
        }).join('');
    }
    
    getFileIcon(file) {
        const iconMap = {
            'folder': '<i class="fas fa-folder" style="color: #ffc107;"></i>',
            'parent': '<i class="fas fa-level-up-alt" style="color: #6c757d;"></i>',
            'txt': '<i class="fas fa-file-alt" style="color: #17a2b8;"></i>',
            'doc': '<i class="fas fa-file-word" style="color: #2b579a;"></i>',
            'docx': '<i class="fas fa-file-word" style="color: #2b579a;"></i>',
            'pdf': '<i class="fas fa-file-pdf" style="color: #dc3545;"></i>',
            'ppt': '<i class="fas fa-file-powerpoint" style="color: #d04423;"></i>',
            'pptx': '<i class="fas fa-file-powerpoint" style="color: #d04423;"></i>',
            'jpg': '<i class="fas fa-file-image" style="color: #28a745;"></i>',
            'jpeg': '<i class="fas fa-file-image" style="color: #28a745;"></i>',
            'png': '<i class="fas fa-file-image" style="color: #28a745;"></i>',
            'svg': '<i class="fas fa-file-image" style="color: #28a745;"></i>',
            'mp3': '<i class="fas fa-file-audio" style="color: #6f42c1;"></i>',
            'flac': '<i class="fas fa-file-audio" style="color: #6f42c1;"></i>',
            'mp4': '<i class="fas fa-file-video" style="color: #fd7e14;"></i>',
            'json': '<i class="fas fa-file-code" style="color: #20c997;"></i>'
        };
        
        if (file.type === 'folder' || file.type === 'parent') {
            return iconMap[file.type];
        }
        
        const extension = file.name.split('.').pop().toLowerCase();
        return iconMap[extension] || '<i class="fas fa-file" style="color: #6c757d;"></i>';
    }
    
    handleFileClick(e) {
        const fileItem = e.target.closest('.file-item');
        if (!fileItem) return;
        
        const fileName = fileItem.dataset.name;
        
        // 清除其他选择
        this.selectedFiles.clear();
        document.querySelectorAll('.file-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        // 选择当前文件
        this.selectedFiles.add(fileName);
        fileItem.classList.add('selected');
    }
    
    handleFileDoubleClick(e) {
        const fileItem = e.target.closest('.file-item');
        if (!fileItem) return;
        
        const fileName = fileItem.dataset.name;
        const fileType = fileItem.dataset.type;
        
        if (fileType === 'folder') {
            this.openFolder(fileName);
        } else if (fileType === 'parent') {
            this.goUp();
        } else {
            this.openFile(fileName);
        }
    }
    
    openFolder(folderName) {
        const newPath = this.currentPath === '/' ? `/${folderName}` : `${this.currentPath}/${folderName}`;
        
        if (this.files[newPath]) {
            this.currentPath = newPath;
            this.selectedFiles.clear();
            this.updateFileList();
        } else {
            Desktop.showNotification(`文件夹 "${folderName}" 不存在`, 'error');
        }
    }
    
    openFile(fileName) {
        const extension = fileName.split('.').pop().toLowerCase();
        
        if (['txt', 'json', 'js', 'css', 'html'].includes(extension)) {
            // 打开文本编辑器
            Desktop.launchApp('texteditor');
            Desktop.showNotification(`正在打开文件: ${fileName}`, 'info');
        } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(extension)) {
            // 显示图片
            this.showImageViewer(fileName);
        } else {
            Desktop.showNotification(`无法打开文件类型: ${extension}`, 'error');
        }
    }
    
    showImageViewer(fileName) {
        const modal = Desktop.createModal({
            title: `图片查看器 - ${fileName}`,
            content: `
                <div style="text-align: center; padding: 20px;">
                    <div style="background: #f5f5f5; padding: 40px; border-radius: 8px;">
                        <i class="fas fa-image" style="font-size: 64px; color: #ccc;"></i>
                        <p style="margin-top: 20px; color: #666;">图片预览功能</p>
                        <p style="font-size: 12px; color: #999;">文件: ${fileName}</p>
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: '关闭',
                    onClick: () => Desktop.closeModal()
                }
            ]
        });
        
        document.body.appendChild(modal);
    }
    
    goBack() {
        // 简单的后退功能，这里可以实现更复杂的历史记录
        this.goUp();
    }
    
    goUp() {
        if (this.currentPath !== '/') {
            const parentPath = this.currentPath.substring(0, this.currentPath.lastIndexOf('/')) || '/';
            this.currentPath = parentPath;
            this.selectedFiles.clear();
            this.updateFileList();
        }
    }
    
    refresh() {
        this.updateFileList();
        Desktop.showNotification('文件列表已刷新', 'success');
    }
    
    createNewFolder() {
        const folderName = prompt('请输入文件夹名称:', '新建文件夹');
        if (folderName && folderName.trim()) {
            if (!this.files[this.currentPath]) {
                this.files[this.currentPath] = [];
            }
            
            this.files[this.currentPath].push({
                name: folderName.trim(),
                type: 'folder',
                size: null,
                modified: new Date().toISOString().split('T')[0]
            });
            
            this.updateFileList();
            Desktop.showNotification(`已创建文件夹: ${folderName}`, 'success');
        }
    }
    
    toggleView() {
        const content = WindowManager.getWindowContent(this.windowId);
        const fileList = content.querySelector('#file-list');
        const viewButton = content.querySelector('#view-toggle-btn i');
        
        if (fileList.classList.contains('list-view')) {
            fileList.classList.remove('list-view');
            viewButton.className = 'fas fa-list';
        } else {
            fileList.classList.add('list-view');
            viewButton.className = 'fas fa-th';
        }
    }
    
    showContextMenu(e) {
        e.preventDefault();
        // 这里可以实现右键菜单功能
        Desktop.showNotification('右键菜单功能', 'info');
    }
    
    handleKeyboard(e) {
        if (WindowManager.getActiveWindow() !== this.windowId) return;
        
        if (e.key === 'Delete' && this.selectedFiles.size > 0) {
            this.deleteSelectedFiles();
        } else if (e.key === 'F2' && this.selectedFiles.size === 1) {
            this.renameSelectedFile();
        } else if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            this.selectAllFiles();
        }
    }
    
    deleteSelectedFiles() {
        if (this.selectedFiles.size === 0) return;
        
        const files = Array.from(this.selectedFiles);
        const confirm = window.confirm(`确定要删除 ${files.length} 个文件吗？`);
        
        if (confirm) {
            const currentFiles = this.files[this.currentPath] || [];
            this.files[this.currentPath] = currentFiles.filter(file => !this.selectedFiles.has(file.name));
            this.selectedFiles.clear();
            this.updateFileList();
            Desktop.showNotification(`已删除 ${files.length} 个文件`, 'success');
        }
    }
    
    renameSelectedFile() {
        const fileName = Array.from(this.selectedFiles)[0];
        const newName = prompt('请输入新名称:', fileName);
        
        if (newName && newName.trim() && newName !== fileName) {
            const currentFiles = this.files[this.currentPath] || [];
            const fileIndex = currentFiles.findIndex(f => f.name === fileName);
            
            if (fileIndex !== -1) {
                currentFiles[fileIndex].name = newName.trim();
                this.selectedFiles.clear();
                this.selectedFiles.add(newName.trim());
                this.updateFileList();
                Desktop.showNotification(`文件已重命名为: ${newName}`, 'success');
            }
        }
    }
    
    selectAllFiles() {
        const currentFiles = this.files[this.currentPath] || [];
        this.selectedFiles.clear();
        
        currentFiles.forEach(file => {
            if (file.type !== 'parent') {
                this.selectedFiles.add(file.name);
            }
        });
        
        this.updateFileList();
    }
    
    destroy() {
        console.log('文件管理器应用已销毁');
    }
} 