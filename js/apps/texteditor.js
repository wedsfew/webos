// 文本编辑器应用
class TextEditorApp {
    constructor(windowId) {
        this.windowId = windowId;
        this.currentFile = null;
        this.isModified = false;
        this.content = '';
        this.init();
    }
    
    init() {
        const content = WindowManager.getWindowContent(this.windowId);
        content.innerHTML = this.getHTML();
        this.setupEvents();
        this.updateTitle();
    }
    
    getHTML() {
        return `
            <div class="texteditor-app">
                <div class="editor-toolbar">
                    <button class="editor-button" id="new-btn" title="新建文件">
                        <i class="fas fa-file"></i> 新建
                    </button>
                    <button class="editor-button" id="open-btn" title="打开文件">
                        <i class="fas fa-folder-open"></i> 打开
                    </button>
                    <button class="editor-button" id="save-btn" title="保存文件">
                        <i class="fas fa-save"></i> 保存
                    </button>
                    <button class="editor-button" id="save-as-btn" title="另存为">
                        <i class="fas fa-save"></i> 另存为
                    </button>
                    <div style="border-left: 1px solid #ddd; height: 20px; margin: 0 10px;"></div>
                    <button class="editor-button" id="undo-btn" title="撤销">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button class="editor-button" id="redo-btn" title="重做">
                        <i class="fas fa-redo"></i>
                    </button>
                    <div style="border-left: 1px solid #ddd; height: 20px; margin: 0 10px;"></div>
                    <button class="editor-button" id="find-btn" title="查找">
                        <i class="fas fa-search"></i> 查找
                    </button>
                    <button class="editor-button" id="replace-btn" title="替换">
                        <i class="fas fa-exchange-alt"></i> 替换
                    </button>
                    <div style="flex: 1;"></div>
                    <select class="editor-button" id="font-size" title="字体大小">
                        <option value="12">12px</option>
                        <option value="14" selected>14px</option>
                        <option value="16">16px</option>
                        <option value="18">18px</option>
                        <option value="20">20px</option>
                    </select>
                </div>
                <div class="editor-content">
                    <textarea class="editor-textarea" id="editor-textarea" placeholder="在此输入文本内容..."></textarea>
                </div>
            </div>
        `;
    }
    
    setupEvents() {
        const content = WindowManager.getWindowContent(this.windowId);
        const textarea = content.querySelector('#editor-textarea');
        
        // 工具栏按钮事件
        content.querySelector('#new-btn').addEventListener('click', () => this.newFile());
        content.querySelector('#open-btn').addEventListener('click', () => this.openFile());
        content.querySelector('#save-btn').addEventListener('click', () => this.saveFile());
        content.querySelector('#save-as-btn').addEventListener('click', () => this.saveAsFile());
        content.querySelector('#undo-btn').addEventListener('click', () => this.undo());
        content.querySelector('#redo-btn').addEventListener('click', () => this.redo());
        content.querySelector('#find-btn').addEventListener('click', () => this.showFindDialog());
        content.querySelector('#replace-btn').addEventListener('click', () => this.showReplaceDialog());
        
        // 字体大小改变
        content.querySelector('#font-size').addEventListener('change', (e) => {
            textarea.style.fontSize = e.target.value + 'px';
        });
        
        // 文本区域事件
        textarea.addEventListener('input', () => {
            this.content = textarea.value;
            this.setModified(true);
        });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
        
        // 防止窗口关闭时丢失未保存的内容
        this.setupBeforeUnload();
    }
    
    handleKeyboard(e) {
        if (WindowManager.getActiveWindow() !== this.windowId) return;
        
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case 'n':
                    e.preventDefault();
                    this.newFile();
                    break;
                case 'o':
                    e.preventDefault();
                    this.openFile();
                    break;
                case 's':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.saveAsFile();
                    } else {
                        this.saveFile();
                    }
                    break;
                case 'f':
                    e.preventDefault();
                    this.showFindDialog();
                    break;
                case 'h':
                    e.preventDefault();
                    this.showReplaceDialog();
                    break;
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
            }
        }
    }
    
    newFile() {
        if (this.isModified) {
            const save = confirm('当前文件已修改，是否保存？');
            if (save) {
                this.saveFile();
            }
        }
        
        this.currentFile = null;
        this.content = '';
        this.setModified(false);
        
        const content = WindowManager.getWindowContent(this.windowId);
        const textarea = content.querySelector('#editor-textarea');
        textarea.value = '';
        
        this.updateTitle();
        Desktop.showNotification('已创建新文件', 'success');
    }
    
    openFile() {
        // 创建文件选择对话框
        const modal = Desktop.createModal({
            title: '打开文件',
            content: `
                <div style="padding: 20px;">
                    <div style="margin-bottom: 15px;">
                        <label for="file-input">选择文件:</label>
                        <input type="file" id="file-input" accept=".txt,.js,.css,.html,.json,.md" style="width: 100%; margin-top: 5px;">
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        支持的文件格式: .txt, .js, .css, .html, .json, .md
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: '取消',
                    onClick: () => Desktop.closeModal()
                },
                {
                    text: '打开',
                    className: 'primary',
                    onClick: () => {
                        const fileInput = document.querySelector('#file-input');
                        if (fileInput.files.length > 0) {
                            this.loadFile(fileInput.files[0]);
                            Desktop.closeModal();
                        } else {
                            alert('请选择一个文件');
                        }
                    }
                }
            ]
        });
        
        document.body.appendChild(modal);
    }
    
    loadFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentFile = file.name;
            this.content = e.target.result;
            this.setModified(false);
            
            const content = WindowManager.getWindowContent(this.windowId);
            const textarea = content.querySelector('#editor-textarea');
            textarea.value = this.content;
            
            this.updateTitle();
            Desktop.showNotification(`已打开文件: ${file.name}`, 'success');
        };
        
        reader.onerror = () => {
            Desktop.showNotification('文件读取失败', 'error');
        };
        
        reader.readAsText(file);
    }
    
    saveFile() {
        if (!this.currentFile) {
            this.saveAsFile();
            return;
        }
        
        this.downloadFile(this.currentFile, this.content);
        this.setModified(false);
        Desktop.showNotification(`文件已保存: ${this.currentFile}`, 'success');
    }
    
    saveAsFile() {
        const fileName = prompt('请输入文件名:', this.currentFile || '新文件.txt');
        if (fileName) {
            this.currentFile = fileName;
            this.downloadFile(fileName, this.content);
            this.setModified(false);
            this.updateTitle();
            Desktop.showNotification(`文件已保存为: ${fileName}`, 'success');
        }
    }
    
    downloadFile(fileName, content) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    undo() {
        const content = WindowManager.getWindowContent(this.windowId);
        const textarea = content.querySelector('#editor-textarea');
        document.execCommand('undo');
        this.content = textarea.value;
    }
    
    redo() {
        const content = WindowManager.getWindowContent(this.windowId);
        const textarea = content.querySelector('#editor-textarea');
        document.execCommand('redo');
        this.content = textarea.value;
    }
    
    showFindDialog() {
        const modal = Desktop.createModal({
            title: '查找',
            content: `
                <div style="padding: 20px;">
                    <div style="margin-bottom: 15px;">
                        <label for="find-text">查找内容:</label>
                        <input type="text" id="find-text" style="width: 100%; margin-top: 5px; padding: 5px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label>
                            <input type="checkbox" id="case-sensitive"> 区分大小写
                        </label>
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: '取消',
                    onClick: () => Desktop.closeModal()
                },
                {
                    text: '查找',
                    className: 'primary',
                    onClick: () => {
                        const findText = document.querySelector('#find-text').value;
                        const caseSensitive = document.querySelector('#case-sensitive').checked;
                        this.findText(findText, caseSensitive);
                        Desktop.closeModal();
                    }
                }
            ]
        });
        
        document.body.appendChild(modal);
        
        // 聚焦到输入框
        setTimeout(() => {
            document.querySelector('#find-text').focus();
        }, 100);
    }
    
    showReplaceDialog() {
        const modal = Desktop.createModal({
            title: '查找和替换',
            content: `
                <div style="padding: 20px;">
                    <div style="margin-bottom: 15px;">
                        <label for="find-text">查找内容:</label>
                        <input type="text" id="find-text" style="width: 100%; margin-top: 5px; padding: 5px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label for="replace-text">替换为:</label>
                        <input type="text" id="replace-text" style="width: 100%; margin-top: 5px; padding: 5px;">
                    </div>
                    <div style="margin-bottom: 15px;">
                        <label>
                            <input type="checkbox" id="case-sensitive"> 区分大小写
                        </label>
                    </div>
                </div>
            `,
            buttons: [
                {
                    text: '取消',
                    onClick: () => Desktop.closeModal()
                },
                {
                    text: '替换',
                    onClick: () => {
                        const findText = document.querySelector('#find-text').value;
                        const replaceText = document.querySelector('#replace-text').value;
                        const caseSensitive = document.querySelector('#case-sensitive').checked;
                        this.replaceText(findText, replaceText, caseSensitive, false);
                        Desktop.closeModal();
                    }
                },
                {
                    text: '全部替换',
                    className: 'primary',
                    onClick: () => {
                        const findText = document.querySelector('#find-text').value;
                        const replaceText = document.querySelector('#replace-text').value;
                        const caseSensitive = document.querySelector('#case-sensitive').checked;
                        this.replaceText(findText, replaceText, caseSensitive, true);
                        Desktop.closeModal();
                    }
                }
            ]
        });
        
        document.body.appendChild(modal);
    }
    
    findText(searchText, caseSensitive) {
        if (!searchText) return;
        
        const content = WindowManager.getWindowContent(this.windowId);
        const textarea = content.querySelector('#editor-textarea');
        const text = textarea.value;
        
        let index;
        if (caseSensitive) {
            index = text.indexOf(searchText, textarea.selectionEnd);
        } else {
            index = text.toLowerCase().indexOf(searchText.toLowerCase(), textarea.selectionEnd);
        }
        
        if (index === -1) {
            // 从头开始查找
            if (caseSensitive) {
                index = text.indexOf(searchText);
            } else {
                index = text.toLowerCase().indexOf(searchText.toLowerCase());
            }
        }
        
        if (index !== -1) {
            textarea.focus();
            textarea.setSelectionRange(index, index + searchText.length);
            Desktop.showNotification('找到匹配项', 'success');
        } else {
            Desktop.showNotification('未找到匹配项', 'info');
        }
    }
    
    replaceText(findText, replaceText, caseSensitive, replaceAll) {
        if (!findText) return;
        
        const content = WindowManager.getWindowContent(this.windowId);
        const textarea = content.querySelector('#editor-textarea');
        let text = textarea.value;
        
        let count = 0;
        if (replaceAll) {
            if (caseSensitive) {
                const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                text = text.replace(regex, () => {
                    count++;
                    return replaceText;
                });
            } else {
                const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                text = text.replace(regex, () => {
                    count++;
                    return replaceText;
                });
            }
            
            textarea.value = text;
            this.content = text;
            this.setModified(true);
            Desktop.showNotification(`已替换 ${count} 处`, 'success');
        } else {
            // 单次替换
            const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
            const matches = caseSensitive ? 
                selectedText === findText : 
                selectedText.toLowerCase() === findText.toLowerCase();
                
            if (matches) {
                const before = textarea.value.substring(0, textarea.selectionStart);
                const after = textarea.value.substring(textarea.selectionEnd);
                textarea.value = before + replaceText + after;
                
                // 选中替换后的文本
                textarea.setSelectionRange(
                    textarea.selectionStart, 
                    textarea.selectionStart + replaceText.length
                );
                
                this.content = textarea.value;
                this.setModified(true);
                Desktop.showNotification('已替换', 'success');
            } else {
                // 如果当前选择不匹配，则查找下一个
                this.findText(findText, caseSensitive);
            }
        }
    }
    
    setModified(modified) {
        this.isModified = modified;
        this.updateTitle();
    }
    
    updateTitle() {
        const title = this.currentFile || '未命名文档';
        const modified = this.isModified ? ' *' : '';
        WindowManager.setWindowTitle(this.windowId, `文本编辑器 - ${title}${modified}`);
    }
    
    setupBeforeUnload() {
        // 这里可以添加窗口关闭前的检查
    }
    
    destroy() {
        if (this.isModified) {
            const save = confirm('文件已修改但未保存，确定要关闭吗？');
            if (!save) {
                return false; // 取消关闭
            }
        }
        
        console.log('文本编辑器应用已销毁');
        return true;
    }
} 