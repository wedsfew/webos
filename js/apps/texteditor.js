// 文本编辑器应用
class TextEditor extends Application {
    constructor() {
        super('文本编辑器', 'fas fa-file-text');
        
        this.content = '';
        this.fileName = '未命名文档.txt';
        this.isModified = false;
        this.wordWrap = true;
        this.fontSize = 14;
    }

    render() {
        return `
            <div class="text-editor">
                <div class="text-editor-toolbar">
                    <button id="new-btn" title="新建 (Ctrl+N)">
                        <i class="fas fa-file"></i> 新建
                    </button>
                    <button id="open-btn" title="打开 (Ctrl+O)">
                        <i class="fas fa-folder-open"></i> 打开
                    </button>
                    <button id="save-btn" title="保存 (Ctrl+S)">
                        <i class="fas fa-save"></i> 保存
                    </button>
                    <div class="toolbar-separator"></div>
                    <button id="undo-btn" title="撤销 (Ctrl+Z)">
                        <i class="fas fa-undo"></i>
                    </button>
                    <button id="redo-btn" title="重做 (Ctrl+Y)">
                        <i class="fas fa-redo"></i>
                    </button>
                    <div class="toolbar-separator"></div>
                    <button id="find-btn" title="查找 (Ctrl+F)">
                        <i class="fas fa-search"></i> 查找
                    </button>
                    <button id="replace-btn" title="替换 (Ctrl+H)">
                        <i class="fas fa-exchange-alt"></i> 替换
                    </button>
                    <div class="toolbar-separator"></div>
                    <button id="wordwrap-btn" title="自动换行" class="${this.wordWrap ? 'active' : ''}">
                        <i class="fas fa-align-left"></i>
                    </button>
                    <select id="font-size-select" title="字体大小">
                        <option value="12" ${this.fontSize === 12 ? 'selected' : ''}>12px</option>
                        <option value="14" ${this.fontSize === 14 ? 'selected' : ''}>14px</option>
                        <option value="16" ${this.fontSize === 16 ? 'selected' : ''}>16px</option>
                        <option value="18" ${this.fontSize === 18 ? 'selected' : ''}>18px</option>
                        <option value="20" ${this.fontSize === 20 ? 'selected' : ''}>20px</option>
                    </select>
                </div>
                <textarea 
                    class="text-editor-content" 
                    placeholder="开始输入..." 
                    style="font-size: ${this.fontSize}px; white-space: ${this.wordWrap ? 'pre-wrap' : 'pre'};"
                >${this.content}</textarea>
                <div class="text-editor-status">
                    <span class="status-info">
                        <span id="char-count">字符: 0</span>
                        <span id="line-count">行: 1</span>
                        <span id="cursor-pos">位置: 1:1</span>
                    </span>
                    <span class="file-status">
                        <span id="file-name">${this.fileName}</span>
                        <span id="modified-indicator" class="${this.isModified ? 'visible' : ''}">*</span>
                    </span>
                </div>
            </div>
        `;
    }

    onMount() {
        this.setupEventListeners();
        this.updateTitle();
        this.updateStatus();
    }

    setupEventListeners() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const textarea = window.querySelector('.text-editor-content');

        // 工具栏按钮
        window.querySelector('#new-btn').addEventListener('click', () => this.newFile());
        window.querySelector('#open-btn').addEventListener('click', () => this.openFile());
        window.querySelector('#save-btn').addEventListener('click', () => this.saveFile());
        window.querySelector('#undo-btn').addEventListener('click', () => this.undo());
        window.querySelector('#redo-btn').addEventListener('click', () => this.redo());
        window.querySelector('#find-btn').addEventListener('click', () => this.showFindDialog());
        window.querySelector('#replace-btn').addEventListener('click', () => this.showReplaceDialog());
        window.querySelector('#wordwrap-btn').addEventListener('click', () => this.toggleWordWrap());
        window.querySelector('#font-size-select').addEventListener('change', (e) => this.changeFontSize(e.target.value));

        // 文本区域事件
        textarea.addEventListener('input', () => {
            this.onContentChange();
        });

        textarea.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        textarea.addEventListener('selectionchange', () => {
            this.updateCursorPosition();
        });

        // 更新光标位置
        textarea.addEventListener('click', () => {
            this.updateCursorPosition();
        });

        textarea.addEventListener('keyup', () => {
            this.updateCursorPosition();
        });

        // 拖拽文件支持
        textarea.addEventListener('dragover', (e) => {
            e.preventDefault();
        });

        textarea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.handleFileDrop(e);
        });
    }

    onContentChange() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const textarea = window.querySelector('.text-editor-content');
        
        this.content = textarea.value;
        this.isModified = true;
        
        this.updateTitle();
        this.updateStatus();
    }

    updateTitle() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const titleElement = window.querySelector('.window-title');
        const modifiedIndicator = this.isModified ? '*' : '';
        titleElement.textContent = `${modifiedIndicator}${this.fileName} - 文本编辑器`;
    }

    updateStatus() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const textarea = window.querySelector('.text-editor-content');
        
        const charCount = textarea.value.length;
        const lineCount = textarea.value.split('\n').length;
        
        window.querySelector('#char-count').textContent = `字符: ${charCount}`;
        window.querySelector('#line-count').textContent = `行: ${lineCount}`;
        window.querySelector('#file-name').textContent = this.fileName;
        window.querySelector('#modified-indicator').className = this.isModified ? 'visible' : '';
        
        this.updateCursorPosition();
    }

    updateCursorPosition() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const textarea = window.querySelector('.text-editor-content');
        
        const cursorPos = textarea.selectionStart;
        const textBeforeCursor = textarea.value.substring(0, cursorPos);
        const lines = textBeforeCursor.split('\n');
        const currentLine = lines.length;
        const currentColumn = lines[lines.length - 1].length + 1;
        
        window.querySelector('#cursor-pos').textContent = `位置: ${currentLine}:${currentColumn}`;
    }

    newFile() {
        if (this.isModified) {
            if (!confirm('当前文档尚未保存，确定要创建新文档吗？')) {
                return;
            }
        }
        
        this.content = '';
        this.fileName = '未命名文档.txt';
        this.isModified = false;
        
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const textarea = window.querySelector('.text-editor-content');
        textarea.value = '';
        
        this.updateTitle();
        this.updateStatus();
        textarea.focus();
    }

    openFile() {
        // 创建文件输入元素
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt,.md,.js,.css,.html,.json,.xml,.csv';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                this.content = e.target.result;
                this.fileName = file.name;
                this.isModified = false;
                
                const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
                const textarea = window.querySelector('.text-editor-content');
                textarea.value = this.content;
                
                this.updateTitle();
                this.updateStatus();
            };
            reader.readAsText(file);
        });
        
        fileInput.click();
    }

    saveFile() {
        // 创建下载链接
        const blob = new Blob([this.content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.fileName;
        a.click();
        
        URL.revokeObjectURL(url);
        
        this.isModified = false;
        this.updateTitle();
        this.updateStatus();
    }

    undo() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const textarea = window.querySelector('.text-editor-content');
        document.execCommand('undo');
        this.onContentChange();
    }

    redo() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const textarea = window.querySelector('.text-editor-content');
        document.execCommand('redo');
        this.onContentChange();
    }

    showFindDialog() {
        const searchText = prompt('请输入要查找的内容:');
        if (!searchText) return;
        
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const textarea = window.querySelector('.text-editor-content');
        
        const content = textarea.value;
        const index = content.indexOf(searchText);
        
        if (index !== -1) {
            textarea.focus();
            textarea.setSelectionRange(index, index + searchText.length);
        } else {
            alert('未找到指定内容');
        }
    }

    showReplaceDialog() {
        const searchText = prompt('请输入要查找的内容:');
        if (!searchText) return;
        
        const replaceText = prompt('请输入替换内容:');
        if (replaceText === null) return;
        
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const textarea = window.querySelector('.text-editor-content');
        
        const newContent = textarea.value.replace(new RegExp(searchText, 'g'), replaceText);
        textarea.value = newContent;
        this.onContentChange();
        
        alert('替换完成');
    }

    toggleWordWrap() {
        this.wordWrap = !this.wordWrap;
        
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const textarea = window.querySelector('.text-editor-content');
        const button = window.querySelector('#wordwrap-btn');
        
        textarea.style.whiteSpace = this.wordWrap ? 'pre-wrap' : 'pre';
        button.className = this.wordWrap ? 'active' : '';
    }

    changeFontSize(size) {
        this.fontSize = parseInt(size);
        
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const textarea = window.querySelector('.text-editor-content');
        textarea.style.fontSize = `${this.fontSize}px`;
    }

    handleKeyboardShortcuts(e) {
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
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
                    this.saveFile();
                    break;
                case 'f':
                    e.preventDefault();
                    this.showFindDialog();
                    break;
                case 'h':
                    e.preventDefault();
                    this.showReplaceDialog();
                    break;
                case '=':
                case '+':
                    e.preventDefault();
                    this.changeFontSize(Math.min(this.fontSize + 2, 24));
                    break;
                case '-':
                    e.preventDefault();
                    this.changeFontSize(Math.max(this.fontSize - 2, 10));
                    break;
            }
        }
        
        // Tab键插入制表符
        if (e.key === 'Tab') {
            e.preventDefault();
            const textarea = e.target;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            
            textarea.value = textarea.value.substring(0, start) + '\t' + textarea.value.substring(end);
            textarea.selectionStart = textarea.selectionEnd = start + 1;
            
            this.onContentChange();
        }
    }

    handleFileDrop(e) {
        const files = e.dataTransfer.files;
        if (files.length === 0) return;
        
        const file = files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            this.content = e.target.result;
            this.fileName = file.name;
            this.isModified = false;
            
            const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
            const textarea = window.querySelector('.text-editor-content');
            textarea.value = this.content;
            
            this.updateTitle();
            this.updateStatus();
        };
        
        reader.readAsText(file);
    }

    // 获取选中的文本
    getSelectedText() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const textarea = window.querySelector('.text-editor-content');
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        return textarea.value.substring(start, end);
    }

    // 插入文本
    insertText(text) {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const textarea = window.querySelector('.text-editor-content');
        
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        
        textarea.value = textarea.value.substring(0, start) + text + textarea.value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        
        this.onContentChange();
        textarea.focus();
    }

    onUnmount() {
        if (this.isModified) {
            return confirm('文档尚未保存，确定要关闭吗？');
        }
        return true;
    }
}

// 添加工具栏分隔符样式
const style = document.createElement('style');
style.textContent = `
    .toolbar-separator {
        width: 1px;
        height: 20px;
        background: #ddd;
        margin: 0 8px;
    }
    
    .text-editor-toolbar button.active {
        background: #007bff;
        color: white;
    }
    
    .text-editor-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 12px;
        background: #f8f9fa;
        border-top: 1px solid #e9ecef;
        font-size: 12px;
        color: #666;
    }
    
    .status-info {
        display: flex;
        gap: 16px;
    }
    
    .file-status {
        display: flex;
        align-items: center;
        gap: 4px;
    }
    
    #modified-indicator {
        color: #dc3545;
        font-weight: bold;
        opacity: 0;
        transition: opacity 0.2s ease;
    }
    
    #modified-indicator.visible {
        opacity: 1;
    }
    
    .text-editor .window-content {
        padding: 0;
    }
    
    .text-editor-content {
        height: calc(100% - 80px);
    }
`;
document.head.appendChild(style); 