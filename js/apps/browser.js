// 浏览器应用
class BrowserApp {
    constructor(windowId) {
        this.windowId = windowId;
        this.currentUrl = 'about:blank';
        this.history = [];
        this.historyIndex = -1;
        this.init();
    }
    
    init() {
        const content = WindowManager.getWindowContent(this.windowId);
        content.innerHTML = this.getHTML();
        this.setupEvents();
        this.loadHomePage();
    }
    
    getHTML() {
        return `
            <div class="browser-app">
                <div class="browser-toolbar">
                    <div class="browser-nav-buttons">
                        <button class="nav-button" id="back-btn" title="后退">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <button class="nav-button" id="forward-btn" title="前进">
                            <i class="fas fa-arrow-right"></i>
                        </button>
                        <button class="nav-button" id="refresh-btn" title="刷新">
                            <i class="fas fa-sync"></i>
                        </button>
                        <button class="nav-button" id="home-btn" title="主页">
                            <i class="fas fa-home"></i>
                        </button>
                    </div>
                    <input type="text" class="url-bar" id="url-bar" placeholder="请输入网址或搜索内容...">
                    <div class="proxy-status" id="proxy-status" title="代理状态">
                        <i class="fas fa-shield-alt"></i>
                        <span id="proxy-indicator">检查中...</span>
                    </div>
                    <button class="nav-button" id="go-btn" title="访问">
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
                <iframe class="browser-iframe" id="browser-iframe" sandbox="allow-same-origin allow-scripts allow-forms allow-popups"></iframe>
            </div>
        `;
    }
    
    setupEvents() {
        const content = WindowManager.getWindowContent(this.windowId);
        
        // 导航按钮
        content.querySelector('#back-btn').addEventListener('click', () => this.goBack());
        content.querySelector('#forward-btn').addEventListener('click', () => this.goForward());
        content.querySelector('#refresh-btn').addEventListener('click', () => this.refresh());
        content.querySelector('#home-btn').addEventListener('click', () => this.goHome());
        content.querySelector('#go-btn').addEventListener('click', () => this.navigate());
        
        // URL栏
        const urlBar = content.querySelector('#url-bar');
        urlBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigate();
            }
        });
        
        // iframe加载事件
        const iframe = content.querySelector('#browser-iframe');
        iframe.addEventListener('load', () => {
            this.updateUI();
        });
        
        // 监听来自iframe的消息（代理页面导航）
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'navigate') {
                this.loadUrl(event.data.url);
            }
        });
        
        // 更新导航按钮状态
        this.updateNavButtons();
        
        // 检查代理服务器状态
        this.updateProxyStatus();
    }
    
    navigate() {
        const content = WindowManager.getWindowContent(this.windowId);
        const urlBar = content.querySelector('#url-bar');
        let url = urlBar.value.trim();
        
        if (!url) return;
        
        // 简单的URL验证和处理
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('about:')) {
            // 如果看起来像域名，添加https
            if (url.includes('.') && !url.includes(' ')) {
                url = 'https://' + url;
            } else {
                // 否则作为搜索
                url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
            }
        }
        
        this.loadUrl(url);
    }
    
    loadUrl(url) {
        const content = WindowManager.getWindowContent(this.windowId);
        const iframe = content.querySelector('#browser-iframe');
        const urlBar = content.querySelector('#url-bar');
        
        try {
            // 添加到历史记录
            if (this.currentUrl !== url) {
                this.historyIndex++;
                this.history = this.history.slice(0, this.historyIndex);
                this.history.push(url);
            }
            
            this.currentUrl = url;
            urlBar.value = url;
            
            // 检查是否需要使用代理
            if (this.shouldUseProxy(url)) {
                const proxyUrl = this.getProxyUrl(url);
                iframe.src = proxyUrl;
            } else {
                iframe.src = url;
            }
            
            this.updateNavButtons();
            this.showLoadingState();
            
        } catch (error) {
            this.showErrorPage(error.message);
        }
    }
    
    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const url = this.history[this.historyIndex];
            this.loadUrlFromHistory(url);
        }
    }
    
    goForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const url = this.history[this.historyIndex];
            this.loadUrlFromHistory(url);
        }
    }
    
    loadUrlFromHistory(url) {
        const content = WindowManager.getWindowContent(this.windowId);
        const iframe = content.querySelector('#browser-iframe');
        const urlBar = content.querySelector('#url-bar');
        
        this.currentUrl = url;
        urlBar.value = url;
        
        // 检查是否需要使用代理
        if (this.shouldUseProxy(url)) {
            const proxyUrl = this.getProxyUrl(url);
            iframe.src = proxyUrl;
        } else {
            iframe.src = url;
        }
        
        this.updateNavButtons();
    }
    
    refresh() {
        const content = WindowManager.getWindowContent(this.windowId);
        const iframe = content.querySelector('#browser-iframe');
        iframe.src = iframe.src;
        this.showLoadingState();
    }
    
    goHome() {
        this.loadHomePage();
    }
    
    loadHomePage() {
        const homePage = this.createHomePage();
        const blob = new Blob([homePage], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        this.loadUrl(url);
    }
    
    createHomePage() {
        return `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Web浏览器主页</title>
                <style>
                    body {
                        font-family: 'Microsoft YaHei', Arial, sans-serif;
                        margin: 0;
                        padding: 40px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        text-align: center;
                    }
                    .container {
                        max-width: 800px;
                        margin: 0 auto;
                    }
                    h1 {
                        font-size: 3em;
                        margin-bottom: 20px;
                        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    }
                    .search-box {
                        margin: 40px 0;
                    }
                    .search-input {
                        width: 100%;
                        max-width: 500px;
                        padding: 15px 20px;
                        font-size: 16px;
                        border: none;
                        border-radius: 25px;
                        outline: none;
                        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    }
                    .quick-links {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-top: 40px;
                    }
                    .link-card {
                        background: rgba(255,255,255,0.1);
                        padding: 20px;
                        border-radius: 10px;
                        text-decoration: none;
                        color: white;
                        transition: transform 0.3s ease;
                        backdrop-filter: blur(10px);
                    }
                    .link-card:hover {
                        transform: translateY(-5px);
                        background: rgba(255,255,255,0.2);
                    }
                    .link-title {
                        font-size: 18px;
                        font-weight: bold;
                        margin-bottom: 10px;
                    }
                    .link-desc {
                        font-size: 14px;
                        opacity: 0.9;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>欢迎使用Web浏览器</h1>
                    <div class="search-box">
                        <input type="text" class="search-input" placeholder="搜索或输入网址..." 
                               onkeypress="if(event.key==='Enter') parent.postMessage({type:'navigate', url:this.value}, '*')">
                    </div>
                    
                    <div class="quick-links">
                        <a href="#" class="link-card" onclick="parent.postMessage({type:'navigate', url:'https://www.baidu.com'}, '*'); return false;">
                            <div class="link-title">百度</div>
                            <div class="link-desc">中文搜索引擎</div>
                        </a>
                        <a href="#" class="link-card" onclick="parent.postMessage({type:'navigate', url:'https://www.google.com'}, '*'); return false;">
                            <div class="link-title">Google</div>
                            <div class="link-desc">全球搜索引擎</div>
                        </a>
                        <a href="#" class="link-card" onclick="parent.postMessage({type:'navigate', url:'https://github.com'}, '*'); return false;">
                            <div class="link-title">GitHub</div>
                            <div class="link-desc">代码托管平台</div>
                        </a>
                        <a href="#" class="link-card" onclick="parent.postMessage({type:'navigate', url:'https://stackoverflow.com'}, '*'); return false;">
                            <div class="link-title">Stack Overflow</div>
                            <div class="link-desc">程序员问答社区</div>
                        </a>
                    </div>
                </div>
                
                <script>
                    // 监听来自父页面的消息
                    window.addEventListener('message', function(event) {
                        if (event.data.type === 'navigate') {
                            // 通知父窗口导航到指定URL
                            parent.postMessage({type:'navigate', url: event.data.url}, '*');
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
    
    showLoadingState() {
        // 这里可以添加加载状态显示
        console.log('加载中...');
    }
    
    showErrorPage(error) {
        const content = WindowManager.getWindowContent(this.windowId);
        const iframe = content.querySelector('#browser-iframe');
        
        const errorPage = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>页面加载失败</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .error { color: #f44336; font-size: 18px; }
                </style>
            </head>
            <body>
                <h1>无法加载页面</h1>
                <p class="error">${error}</p>
                <button onclick="history.back()">返回上一页</button>
            </body>
            </html>
        `;
        
        const blob = new Blob([errorPage], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        iframe.src = url;
    }
    
    updateNavButtons() {
        const content = WindowManager.getWindowContent(this.windowId);
        const backBtn = content.querySelector('#back-btn');
        const forwardBtn = content.querySelector('#forward-btn');
        
        backBtn.disabled = this.historyIndex <= 0;
        forwardBtn.disabled = this.historyIndex >= this.history.length - 1;
    }
    
    updateUI() {
        const content = WindowManager.getWindowContent(this.windowId);
        const iframe = content.querySelector('#browser-iframe');
        const urlBar = content.querySelector('#url-bar');
        
        try {
            if (iframe.contentWindow && iframe.contentWindow.location.href !== 'about:blank') {
                urlBar.value = iframe.contentWindow.location.href;
            }
        } catch (e) {
            // 跨域限制，无法访问iframe内容
        }
    }
    
    shouldUseProxy(url) {
        // 判断是否需要使用代理
        if (url.startsWith('about:') || 
            url.startsWith('data:') || 
            url.startsWith('blob:') ||
            url.startsWith('javascript:') ||
            url.includes('localhost:8080') ||
            url.includes('localhost:9999')) {
            return false;
        }
        
        // 对于外部HTTP/HTTPS链接使用代理
        return url.startsWith('http://') || url.startsWith('https://');
    }
    
    getProxyUrl(url) {
        // 构建代理URL
        const proxyBaseUrl = 'http://localhost:9999/proxy';
        return `${proxyBaseUrl}?url=${encodeURIComponent(url)}`;
    }
    
    async checkProxyStatus() {
        // 检查代理服务器状态
        try {
            const response = await fetch('http://localhost:9999/', { mode: 'no-cors' });
            return true; // 如果没有抛出错误，说明服务器在运行
        } catch {
            return false;
        }
    }
    
    async updateProxyStatus() {
        const content = WindowManager.getWindowContent(this.windowId);
        const proxyIndicator = content.querySelector('#proxy-indicator');
        const proxyStatus = content.querySelector('#proxy-status');
        
        if (!proxyIndicator || !proxyStatus) return;
        
        try {
            proxyIndicator.textContent = '检查中...';
            proxyStatus.className = 'proxy-status checking';
            
            const isOnline = await this.checkProxyStatus();
            
            if (isOnline) {
                proxyIndicator.textContent = '代理已启用';
                proxyStatus.className = 'proxy-status online';
                proxyStatus.title = '代理服务器运行正常，外部网站将通过代理访问';
            } else {
                proxyIndicator.textContent = '代理离线';
                proxyStatus.className = 'proxy-status offline';
                proxyStatus.title = '代理服务器未启动，请先启动代理服务器';
            }
        } catch (error) {
            proxyIndicator.textContent = '代理错误';
            proxyStatus.className = 'proxy-status error';
            proxyStatus.title = '代理状态检查失败';
        }
        
        // 定期检查代理状态
        setTimeout(() => this.updateProxyStatus(), 10000);
    }
    
    destroy() {
        // 清理资源
        console.log('浏览器应用已销毁');
    }
} 