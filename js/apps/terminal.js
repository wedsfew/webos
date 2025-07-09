// 终端应用
class TerminalApp {
    constructor(windowId) {
        this.windowId = windowId;
        this.commandHistory = [];
        this.historyIndex = -1;
        this.currentDirectory = '/';
        this.fileSystem = this.createFileSystem();
        this.init();
    }
    
    init() {
        const content = WindowManager.getWindowContent(this.windowId);
        content.innerHTML = this.getHTML();
        this.setupEvents();
        this.printWelcome();
        this.addInputLine();
    }
    
    getHTML() {
        return `
            <div class="terminal-app">
                <div class="terminal-header">
                    Web终端 - ${this.currentDirectory}
                </div>
                <div class="terminal-content" id="terminal-content">
                    <!-- 终端输出内容 -->
                </div>
            </div>
        `;
    }
    
    setupEvents() {
        const content = WindowManager.getWindowContent(this.windowId);
        const terminalContent = content.querySelector('#terminal-content');
        
        // 点击终端区域聚焦到输入框
        terminalContent.addEventListener('click', () => {
            const input = terminalContent.querySelector('.terminal-input');
            if (input) {
                input.focus();
            }
        });
        
        // 防止右键菜单
        terminalContent.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    createFileSystem() {
        return {
            '/': {
                type: 'directory',
                contents: {
                    'home': {
                        type: 'directory',
                        contents: {
                            'user': {
                                type: 'directory',
                                contents: {
                                    'documents': { type: 'directory', contents: {} },
                                    'downloads': { type: 'directory', contents: {} },
                                    'readme.txt': { type: 'file', content: '欢迎使用Web终端！\n这是一个模拟的终端环境。' }
                                }
                            }
                        }
                    },
                    'etc': {
                        type: 'directory',
                        contents: {
                            'config.conf': { type: 'file', content: 'system_name=WebOS\nversion=1.0' }
                        }
                    },
                    'var': {
                        type: 'directory',
                        contents: {
                            'log': { type: 'directory', contents: {} }
                        }
                    }
                }
            }
        };
    }
    
    printWelcome() {
        const welcomeText = [
            '欢迎使用 Web 终端！',
            '版本: 1.0.0',
            '输入 "help" 查看可用命令',
            ''
        ];
        
        welcomeText.forEach(line => {
            this.addOutputLine(line);
        });
    }
    
    addOutputLine(text, className = '') {
        const content = WindowManager.getWindowContent(this.windowId);
        const terminalContent = content.querySelector('#terminal-content');
        
        const line = document.createElement('div');
        line.className = `terminal-line ${className}`;
        line.textContent = text;
        terminalContent.appendChild(line);
        
        this.scrollToBottom();
    }
    
    addInputLine() {
        const content = WindowManager.getWindowContent(this.windowId);
        const terminalContent = content.querySelector('#terminal-content');
        
        const inputLine = document.createElement('div');
        inputLine.className = 'terminal-input-line';
        inputLine.innerHTML = `
            <span class="terminal-prompt">user@webos:${this.currentDirectory}$</span>
            <input type="text" class="terminal-input" autocomplete="off" spellcheck="false">
        `;
        
        terminalContent.appendChild(inputLine);
        
        const input = inputLine.querySelector('.terminal-input');
        input.focus();
        
        input.addEventListener('keydown', (e) => this.handleInput(e));
        
        this.scrollToBottom();
    }
    
    handleInput(e) {
        const input = e.target;
        
        if (e.key === 'Enter') {
            const command = input.value.trim();
            if (command) {
                this.commandHistory.push(command);
                this.historyIndex = this.commandHistory.length;
            }
            
            // 显示输入的命令
            this.addOutputLine(`user@webos:${this.currentDirectory}$ ${command}`);
            
            // 执行命令
            if (command) {
                this.executeCommand(command);
            }
            
            // 添加新的输入行
            this.addInputLine();
            
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                input.value = this.commandHistory[this.historyIndex];
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
                input.value = this.commandHistory[this.historyIndex];
            } else {
                this.historyIndex = this.commandHistory.length;
                input.value = '';
            }
        } else if (e.key === 'Tab') {
            e.preventDefault();
            this.autoComplete(input);
        }
    }
    
    executeCommand(commandLine) {
        const parts = commandLine.split(' ').filter(part => part.length > 0);
        const command = parts[0];
        const args = parts.slice(1);
        
        switch (command) {
            case 'help':
                this.showHelp();
                break;
            case 'ls':
                this.listDirectory(args);
                break;
            case 'cd':
                this.changeDirectory(args[0] || '/home/user');
                break;
            case 'pwd':
                this.printWorkingDirectory();
                break;
            case 'mkdir':
                this.makeDirectory(args[0]);
                break;
            case 'touch':
                this.touchFile(args[0]);
                break;
            case 'rm':
                this.removeFile(args);
                break;
            case 'cat':
                this.catFile(args[0]);
                break;
            case 'echo':
                this.echo(args.join(' '));
                break;
            case 'clear':
                this.clearTerminal();
                break;
            case 'date':
                this.showDate();
                break;
            case 'whoami':
                this.addOutputLine('user');
                break;
            case 'uname':
                this.addOutputLine('WebOS 1.0.0');
                break;
            case 'history':
                this.showHistory();
                break;
            case 'tree':
                this.showTree(args[0] || this.currentDirectory);
                break;
            default:
                this.addOutputLine(`bash: ${command}: 命令未找到`, 'error');
                this.addOutputLine('输入 "help" 查看可用命令');
        }
    }
    
    showHelp() {
        const commands = [
            'help        - 显示此帮助信息',
            'ls [path]   - 列出目录内容',
            'cd <path>   - 切换目录',
            'pwd         - 显示当前目录',
            'mkdir <dir> - 创建目录',
            'touch <file>- 创建文件',
            'rm <file>   - 删除文件',
            'cat <file>  - 显示文件内容',
            'echo <text> - 输出文本',
            'clear       - 清屏',
            'date        - 显示当前时间',
            'whoami      - 显示当前用户',
            'uname       - 显示系统信息',
            'history     - 显示命令历史',
            'tree [path] - 显示目录树'
        ];
        
        this.addOutputLine('可用命令:');
        commands.forEach(cmd => this.addOutputLine(cmd));
    }
    
    listDirectory(args) {
        const path = args[0] || this.currentDirectory;
        const dir = this.getFileSystemNode(path);
        
        if (!dir) {
            this.addOutputLine(`ls: 无法访问 '${path}': 没有那个文件或目录`, 'error');
            return;
        }
        
        if (dir.type !== 'directory') {
            this.addOutputLine(`ls: '${path}': 不是目录`, 'error');
            return;
        }
        
        const items = Object.keys(dir.contents || {});
        if (items.length === 0) {
            return; // 空目录
        }
        
        items.forEach(item => {
            const itemObj = dir.contents[item];
            const prefix = itemObj.type === 'directory' ? 'd' : '-';
            const color = itemObj.type === 'directory' ? 'color: #4fc3f7;' : '';
            this.addOutputLine(`${prefix}rwxr-xr-x 1 user user 4096 ${new Date().toLocaleDateString()} ${item}`, 'file-list');
        });
    }
    
    changeDirectory(path) {
        if (!path) {
            this.currentDirectory = '/home/user';
            this.updatePrompt();
            return;
        }
        
        const newPath = this.resolvePath(path);
        const dir = this.getFileSystemNode(newPath);
        
        if (!dir) {
            this.addOutputLine(`cd: 无法访问 '${path}': 没有那个文件或目录`, 'error');
            return;
        }
        
        if (dir.type !== 'directory') {
            this.addOutputLine(`cd: '${path}': 不是目录`, 'error');
            return;
        }
        
        this.currentDirectory = newPath;
        this.updatePrompt();
    }
    
    printWorkingDirectory() {
        this.addOutputLine(this.currentDirectory);
    }
    
    makeDirectory(dirName) {
        if (!dirName) {
            this.addOutputLine('mkdir: 缺少操作数', 'error');
            return;
        }
        
        const fullPath = this.resolvePath(dirName);
        const parentPath = fullPath.substring(0, fullPath.lastIndexOf('/')) || '/';
        const name = fullPath.substring(fullPath.lastIndexOf('/') + 1);
        
        const parent = this.getFileSystemNode(parentPath);
        if (!parent || parent.type !== 'directory') {
            this.addOutputLine(`mkdir: 无法创建目录 '${dirName}': 没有那个文件或目录`, 'error');
            return;
        }
        
        if (parent.contents[name]) {
            this.addOutputLine(`mkdir: 无法创建目录 '${dirName}': 文件已存在`, 'error');
            return;
        }
        
        parent.contents[name] = {
            type: 'directory',
            contents: {}
        };
        
        this.addOutputLine(`已创建目录: ${dirName}`);
    }
    
    touchFile(fileName) {
        if (!fileName) {
            this.addOutputLine('touch: 缺少操作数', 'error');
            return;
        }
        
        const fullPath = this.resolvePath(fileName);
        const parentPath = fullPath.substring(0, fullPath.lastIndexOf('/')) || '/';
        const name = fullPath.substring(fullPath.lastIndexOf('/') + 1);
        
        const parent = this.getFileSystemNode(parentPath);
        if (!parent || parent.type !== 'directory') {
            this.addOutputLine(`touch: 无法创建文件 '${fileName}': 没有那个文件或目录`, 'error');
            return;
        }
        
        if (!parent.contents[name]) {
            parent.contents[name] = {
                type: 'file',
                content: ''
            };
            this.addOutputLine(`已创建文件: ${fileName}`);
        }
    }
    
    removeFile(args) {
        const fileName = args[0];
        if (!fileName) {
            this.addOutputLine('rm: 缺少操作数', 'error');
            return;
        }
        
        const fullPath = this.resolvePath(fileName);
        const parentPath = fullPath.substring(0, fullPath.lastIndexOf('/')) || '/';
        const name = fullPath.substring(fullPath.lastIndexOf('/') + 1);
        
        const parent = this.getFileSystemNode(parentPath);
        if (!parent || !parent.contents[name]) {
            this.addOutputLine(`rm: 无法删除 '${fileName}': 没有那个文件或目录`, 'error');
            return;
        }
        
        delete parent.contents[name];
        this.addOutputLine(`已删除: ${fileName}`);
    }
    
    catFile(fileName) {
        if (!fileName) {
            this.addOutputLine('cat: 缺少操作数', 'error');
            return;
        }
        
        const file = this.getFileSystemNode(this.resolvePath(fileName));
        if (!file) {
            this.addOutputLine(`cat: 无法访问 '${fileName}': 没有那个文件或目录`, 'error');
            return;
        }
        
        if (file.type !== 'file') {
            this.addOutputLine(`cat: '${fileName}': 是一个目录`, 'error');
            return;
        }
        
        const content = file.content || '';
        content.split('\n').forEach(line => {
            this.addOutputLine(line);
        });
    }
    
    echo(text) {
        this.addOutputLine(text);
    }
    
    clearTerminal() {
        const content = WindowManager.getWindowContent(this.windowId);
        const terminalContent = content.querySelector('#terminal-content');
        terminalContent.innerHTML = '';
    }
    
    showDate() {
        this.addOutputLine(new Date().toString());
    }
    
    showHistory() {
        this.commandHistory.forEach((cmd, index) => {
            this.addOutputLine(`${index + 1}  ${cmd}`);
        });
    }
    
    showTree(path) {
        const dir = this.getFileSystemNode(this.resolvePath(path));
        if (!dir || dir.type !== 'directory') {
            this.addOutputLine(`tree: '${path}': 不是目录`, 'error');
            return;
        }
        
        this.addOutputLine(path);
        this.printTree(dir, '', true);
    }
    
    printTree(dir, prefix, isLast) {
        const items = Object.keys(dir.contents || {});
        items.forEach((item, index) => {
            const isLastItem = index === items.length - 1;
            const itemObj = dir.contents[item];
            const connector = isLastItem ? '└── ' : '├── ';
            
            this.addOutputLine(prefix + connector + item);
            
            if (itemObj.type === 'directory') {
                const newPrefix = prefix + (isLastItem ? '    ' : '│   ');
                this.printTree(itemObj, newPrefix, isLastItem);
            }
        });
    }
    
    resolvePath(path) {
        if (path.startsWith('/')) {
            return path;
        }
        
        let resolved = this.currentDirectory;
        if (!resolved.endsWith('/')) {
            resolved += '/';
        }
        resolved += path;
        
        // 简单的路径规范化
        const parts = resolved.split('/').filter(p => p);
        const normalized = [];
        
        parts.forEach(part => {
            if (part === '..') {
                normalized.pop();
            } else if (part !== '.') {
                normalized.push(part);
            }
        });
        
        return '/' + normalized.join('/');
    }
    
    getFileSystemNode(path) {
        const parts = path.split('/').filter(p => p);
        let current = this.fileSystem['/'];
        
        for (const part of parts) {
            if (!current || !current.contents || !current.contents[part]) {
                return null;
            }
            current = current.contents[part];
        }
        
        return current;
    }
    
    updatePrompt() {
        // 更新标题栏
        const content = WindowManager.getWindowContent(this.windowId);
        const header = content.querySelector('.terminal-header');
        if (header) {
            header.textContent = `Web终端 - ${this.currentDirectory}`;
        }
    }
    
    autoComplete(input) {
        const value = input.value;
        const lastWord = value.split(' ').pop();
        
        // 简单的命令自动补全
        const commands = ['help', 'ls', 'cd', 'pwd', 'mkdir', 'touch', 'rm', 'cat', 'echo', 'clear', 'date', 'whoami', 'uname', 'history', 'tree'];
        const matches = commands.filter(cmd => cmd.startsWith(lastWord));
        
        if (matches.length === 1) {
            const words = value.split(' ');
            words[words.length - 1] = matches[0];
            input.value = words.join(' ');
        }
    }
    
    scrollToBottom() {
        const content = WindowManager.getWindowContent(this.windowId);
        const terminalContent = content.querySelector('#terminal-content');
        terminalContent.scrollTop = terminalContent.scrollHeight;
    }
    
    destroy() {
        console.log('终端应用已销毁');
    }
} 