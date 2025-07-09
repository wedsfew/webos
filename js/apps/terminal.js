// 终端模拟器应用
class Terminal extends Application {
    constructor() {
        super('终端', 'fas fa-terminal');
        
        this.currentDirectory = '/';
        this.commandHistory = [];
        this.historyIndex = -1;
        this.fileSystem = null; // 会从文件管理器获取
        this.environment = {
            USER: 'webos',
            HOME: '/',
            PATH: '/bin:/usr/bin:/usr/local/bin',
            SHELL: '/bin/websh',
            TERM: 'xterm-256color'
        };
    }

    render() {
        return `
            <div class="terminal">
                <div class="terminal-output" id="terminal-output">
                    <div class="terminal-line">
                        <span class="terminal-prompt">WebOS Terminal v1.0</span>
                    </div>
                    <div class="terminal-line">
                        <span class="terminal-prompt">输入 'help' 查看可用命令</span>
                    </div>
                    <div class="terminal-line">
                        <span class="terminal-prompt">${this.getPrompt()}</span>
                    </div>
                </div>
                <div class="terminal-input-container">
                    <span class="terminal-prompt">${this.getPrompt()}</span>
                    <input type="text" class="terminal-input" id="terminal-input" placeholder="输入命令..." autocomplete="off">
                </div>
            </div>
        `;
    }

    onMount() {
        this.setupEventListeners();
        this.getFileSystemReference();
        this.focusInput();
    }

    setupEventListeners() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const input = window.querySelector('#terminal-input');
        
        input.addEventListener('keydown', (e) => {
            this.handleKeyDown(e);
        });

        // 点击终端区域时聚焦输入框
        window.addEventListener('click', () => {
            this.focusInput();
        });
    }

    handleKeyDown(e) {
        const input = e.target;
        
        switch (e.key) {
            case 'Enter':
                e.preventDefault();
                this.executeCommand(input.value.trim());
                input.value = '';
                this.historyIndex = -1;
                break;
                
            case 'ArrowUp':
                e.preventDefault();
                this.navigateHistory('up');
                break;
                
            case 'ArrowDown':
                e.preventDefault();
                this.navigateHistory('down');
                break;
                
            case 'Tab':
                e.preventDefault();
                this.autoComplete(input);
                break;
                
            case 'c':
                if (e.ctrlKey) {
                    e.preventDefault();
                    this.addOutput('^C');
                    this.showPrompt();
                    input.value = '';
                }
                break;
        }
    }

    executeCommand(command) {
        if (!command) {
            this.showPrompt();
            return;
        }

        // 添加到输出
        this.addOutput(`${this.getPrompt()}${command}`);
        
        // 添加到历史记录
        if (this.commandHistory[this.commandHistory.length - 1] !== command) {
            this.commandHistory.push(command);
            if (this.commandHistory.length > 100) {
                this.commandHistory.shift();
            }
        }

        // 解析和执行命令
        this.parseAndExecute(command);
    }

    parseAndExecute(command) {
        const parts = command.split(/\s+/);
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);

        try {
            switch (cmd) {
                case 'help':
                    this.showHelp();
                    break;
                case 'ls':
                case 'dir':
                    this.listDirectory(args);
                    break;
                case 'cd':
                    this.changeDirectory(args[0] || '/');
                    break;
                case 'pwd':
                    this.printWorkingDirectory();
                    break;
                case 'mkdir':
                    this.makeDirectory(args[0]);
                    break;
                case 'rmdir':
                    this.removeDirectory(args[0]);
                    break;
                case 'rm':
                    this.removeFile(args[0]);
                    break;
                case 'touch':
                    this.createFile(args[0]);
                    break;
                case 'cat':
                    this.showFileContent(args[0]);
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
                    this.showUser();
                    break;
                case 'env':
                    this.showEnvironment();
                    break;
                case 'history':
                    this.showHistory();
                    break;
                case 'calc':
                    this.openCalculator();
                    break;
                case 'edit':
                    this.openTextEditor(args[0]);
                    break;
                case 'ps':
                    this.showProcesses();
                    break;
                case 'uptime':
                    this.showUptime();
                    break;
                case 'uname':
                    this.showSystemInfo();
                    break;
                default:
                    this.addOutput(`bash: ${cmd}: command not found`);
                    break;
            }
        } catch (error) {
            this.addOutput(`Error: ${error.message}`);
        }

        this.showPrompt();
    }

    showHelp() {
        const helpText = [
            '可用命令:',
            '  help      - 显示此帮助信息',
            '  ls, dir   - 列出目录内容',
            '  cd <dir>  - 切换目录',
            '  pwd       - 显示当前目录',
            '  mkdir <name> - 创建目录',
            '  rmdir <name> - 删除目录',
            '  rm <file> - 删除文件',
            '  touch <file> - 创建文件',
            '  cat <file> - 显示文件内容',
            '  echo <text> - 输出文本',
            '  clear     - 清屏',
            '  date      - 显示日期时间',
            '  whoami    - 显示当前用户',
            '  env       - 显示环境变量',
            '  history   - 显示命令历史',
            '  calc      - 打开计算器',
            '  edit <file> - 编辑文件',
            '  ps        - 显示进程',
            '  uptime    - 显示系统运行时间',
            '  uname     - 显示系统信息',
            '',
            '快捷键:',
            '  Ctrl+C    - 中断当前命令',
            '  ↑/↓       - 浏览命令历史',
            '  Tab       - 自动补全'
        ];
        
        helpText.forEach(line => this.addOutput(line));
    }

    listDirectory(args) {
        const showAll = args.includes('-a') || args.includes('-la');
        const longFormat = args.includes('-l') || args.includes('-la');
        
        const dir = this.getCurrentDirectoryObject();
        if (!dir || !dir.children) {
            this.addOutput(`ls: cannot access '${this.currentDirectory}': No such directory`);
            return;
        }

        const items = Object.entries(dir.children);
        
        if (items.length === 0) {
            return; // 空目录
        }

        if (longFormat) {
            items.forEach(([name, item]) => {
                const type = item.type === 'directory' ? 'd' : '-';
                const permissions = item.type === 'directory' ? 'rwxr-xr-x' : 'rw-r--r--';
                const size = item.size || 0;
                const date = new Date().toLocaleDateString();
                
                this.addOutput(`${type}${permissions} 1 webos webos ${size.toString().padStart(8)} ${date} ${name}`);
            });
        } else {
            const names = items.map(([name, item]) => {
                return item.type === 'directory' ? `${name}/` : name;
            });
            this.addOutput(names.join('  '));
        }
    }

    changeDirectory(path) {
        if (!path || path === '~') {
            path = '/';
        }

        let newPath;
        if (path.startsWith('/')) {
            newPath = path;
        } else if (path === '..') {
            const parts = this.currentDirectory.split('/').filter(p => p);
            parts.pop();
            newPath = '/' + parts.join('/');
            if (newPath !== '/' && newPath.endsWith('/')) {
                newPath = newPath.slice(0, -1);
            }
        } else {
            newPath = this.joinPath(this.currentDirectory, path);
        }

        // 验证目录是否存在
        const dir = this.getDirectoryByPath(newPath);
        if (dir && dir.type === 'directory') {
            this.currentDirectory = newPath;
            this.updatePrompt();
        } else {
            this.addOutput(`cd: ${path}: No such file or directory`);
        }
    }

    printWorkingDirectory() {
        this.addOutput(this.currentDirectory);
    }

    makeDirectory(name) {
        if (!name) {
            this.addOutput('mkdir: missing operand');
            return;
        }

        const currentDir = this.getCurrentDirectoryObject();
        if (!currentDir || !currentDir.children) {
            this.addOutput('mkdir: cannot create directory: Invalid location');
            return;
        }

        if (currentDir.children[name]) {
            this.addOutput(`mkdir: cannot create directory '${name}': File exists`);
            return;
        }

        currentDir.children[name] = {
            type: 'directory',
            children: {}
        };

        this.addOutput(`Directory '${name}' created`);
    }

    removeDirectory(name) {
        if (!name) {
            this.addOutput('rmdir: missing operand');
            return;
        }

        const currentDir = this.getCurrentDirectoryObject();
        if (!currentDir || !currentDir.children || !currentDir.children[name]) {
            this.addOutput(`rmdir: failed to remove '${name}': No such file or directory`);
            return;
        }

        const target = currentDir.children[name];
        if (target.type !== 'directory') {
            this.addOutput(`rmdir: failed to remove '${name}': Not a directory`);
            return;
        }

        if (Object.keys(target.children).length > 0) {
            this.addOutput(`rmdir: failed to remove '${name}': Directory not empty`);
            return;
        }

        delete currentDir.children[name];
        this.addOutput(`Directory '${name}' removed`);
    }

    removeFile(name) {
        if (!name) {
            this.addOutput('rm: missing operand');
            return;
        }

        const currentDir = this.getCurrentDirectoryObject();
        if (!currentDir || !currentDir.children || !currentDir.children[name]) {
            this.addOutput(`rm: cannot remove '${name}': No such file or directory`);
            return;
        }

        const target = currentDir.children[name];
        if (target.type === 'directory') {
            this.addOutput(`rm: cannot remove '${name}': Is a directory`);
            return;
        }

        delete currentDir.children[name];
        this.addOutput(`File '${name}' removed`);
    }

    createFile(name) {
        if (!name) {
            this.addOutput('touch: missing operand');
            return;
        }

        const currentDir = this.getCurrentDirectoryObject();
        if (!currentDir || !currentDir.children) {
            this.addOutput('touch: cannot create file: Invalid location');
            return;
        }

        if (currentDir.children[name]) {
            // 文件已存在，更新时间戳（模拟）
            this.addOutput(`File '${name}' timestamp updated`);
        } else {
            currentDir.children[name] = {
                type: 'file',
                size: 0,
                content: ''
            };
            this.addOutput(`File '${name}' created`);
        }
    }

    showFileContent(name) {
        if (!name) {
            this.addOutput('cat: missing operand');
            return;
        }

        const currentDir = this.getCurrentDirectoryObject();
        if (!currentDir || !currentDir.children || !currentDir.children[name]) {
            this.addOutput(`cat: ${name}: No such file or directory`);
            return;
        }

        const file = currentDir.children[name];
        if (file.type === 'directory') {
            this.addOutput(`cat: ${name}: Is a directory`);
            return;
        }

        const content = file.content || '';
        content.split('\n').forEach(line => {
            this.addOutput(line);
        });
    }

    echo(text) {
        this.addOutput(text);
    }

    clearTerminal() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const output = window.querySelector('#terminal-output');
        output.innerHTML = '';
    }

    showDate() {
        const now = new Date();
        this.addOutput(now.toString());
    }

    showUser() {
        this.addOutput(this.environment.USER);
    }

    showEnvironment() {
        Object.entries(this.environment).forEach(([key, value]) => {
            this.addOutput(`${key}=${value}`);
        });
    }

    showHistory() {
        this.commandHistory.forEach((cmd, index) => {
            this.addOutput(`${(index + 1).toString().padStart(4)} ${cmd}`);
        });
    }

    openCalculator() {
        desktop.openApp('calculator');
        this.addOutput('Calculator opened');
    }

    openTextEditor(fileName) {
        if (fileName) {
            // 尝试打开特定文件
            const file = this.getFileByPath(this.joinPath(this.currentDirectory, fileName));
            if (file && file.type === 'file') {
                desktop.openApp('texteditor');
                this.addOutput(`Opened ${fileName} in text editor`);
                // TODO: 加载文件内容到编辑器
            } else {
                this.addOutput(`edit: ${fileName}: No such file`);
            }
        } else {
            desktop.openApp('texteditor');
            this.addOutput('Text editor opened');
        }
    }

    showProcesses() {
        this.addOutput('PID  CMD');
        this.addOutput('---  ---');
        let pid = 1;
        
        this.addOutput(`${pid++}    kernel`);
        this.addOutput(`${pid++}    desktop`);
        
        for (const [appName, app] of desktop.runningApps) {
            this.addOutput(`${pid++}    ${appName}`);
        }
    }

    showUptime() {
        const uptime = Date.now() - (window.startTime || Date.now());
        const seconds = Math.floor(uptime / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        this.addOutput(`up ${hours}:${minutes % 60}:${seconds % 60}`);
    }

    showSystemInfo() {
        this.addOutput('WebOS 1.0.0 (Web Operating System)');
        this.addOutput(`Browser: ${navigator.userAgent}`);
        this.addOutput(`Platform: ${navigator.platform}`);
    }

    // 辅助方法
    getPrompt() {
        return `${this.environment.USER}@webos:${this.currentDirectory}$ `;
    }

    updatePrompt() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const promptElements = window.querySelectorAll('.terminal-prompt');
        const newPrompt = this.getPrompt();
        
        if (promptElements.length > 0) {
            promptElements[promptElements.length - 1].textContent = newPrompt;
        }
    }

    addOutput(text) {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const output = window.querySelector('#terminal-output');
        
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.textContent = text;
        output.appendChild(line);
        
        // 滚动到底部
        output.scrollTop = output.scrollHeight;
    }

    showPrompt() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const output = window.querySelector('#terminal-output');
        const input = window.querySelector('#terminal-input');
        const promptContainer = window.querySelector('.terminal-input-container .terminal-prompt');
        
        // 添加新的提示行到输出
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = `<span class="terminal-prompt">${this.getPrompt()}</span>`;
        output.appendChild(line);
        
        // 更新输入容器的提示符
        promptContainer.textContent = this.getPrompt();
        
        // 滚动到底部并聚焦输入
        output.scrollTop = output.scrollHeight;
        this.focusInput();
    }

    focusInput() {
        const window = document.querySelector(`[data-window-id="${this.windowId}"]`);
        const input = window.querySelector('#terminal-input');
        if (input) {
            input.focus();
        }
    }

    navigateHistory(direction) {
        const input = document.querySelector(`[data-window-id="${this.windowId}"] #terminal-input`);
        
        if (direction === 'up') {
            if (this.historyIndex < this.commandHistory.length - 1) {
                this.historyIndex++;
                input.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
            }
        } else if (direction === 'down') {
            if (this.historyIndex > 0) {
                this.historyIndex--;
                input.value = this.commandHistory[this.commandHistory.length - 1 - this.historyIndex];
            } else if (this.historyIndex === 0) {
                this.historyIndex = -1;
                input.value = '';
            }
        }
    }

    autoComplete(input) {
        const currentDir = this.getCurrentDirectoryObject();
        if (!currentDir || !currentDir.children) return;

        const value = input.value;
        const lastSpace = value.lastIndexOf(' ');
        const partial = lastSpace >= 0 ? value.substring(lastSpace + 1) : value;

        const matches = Object.keys(currentDir.children).filter(name => 
            name.startsWith(partial)
        );

        if (matches.length === 1) {
            const newValue = lastSpace >= 0 
                ? value.substring(0, lastSpace + 1) + matches[0]
                : matches[0];
            input.value = newValue;
        } else if (matches.length > 1) {
            this.addOutput(matches.join('  '));
            this.showPrompt();
        }
    }

    // 文件系统辅助方法
    getFileSystemReference() {
        // 从文件管理器获取文件系统引用
        for (const [appName, app] of desktop.runningApps) {
            if (app instanceof FileManager) {
                this.fileSystem = app.fileSystem;
                break;
            }
        }
        
        // 如果没有找到，创建临时文件系统
        if (!this.fileSystem) {
            this.fileSystem = {
                '/': {
                    type: 'directory',
                    children: {
                        'home': {
                            type: 'directory',
                            children: {
                                'welcome.txt': {
                                    type: 'file',
                                    size: 256,
                                    content: 'Welcome to WebOS Terminal!\nType "help" for available commands.'
                                }
                            }
                        }
                    }
                }
            };
        }
    }

    getCurrentDirectoryObject() {
        return this.getDirectoryByPath(this.currentDirectory);
    }

    getDirectoryByPath(path) {
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

    getFileByPath(path) {
        return this.getDirectoryByPath(path);
    }

    joinPath(basePath, name) {
        if (basePath === '/') {
            return '/' + name;
        }
        return basePath + '/' + name;
    }
}

// 记录启动时间
if (!window.startTime) {
    window.startTime = Date.now();
} 