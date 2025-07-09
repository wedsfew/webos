/**
 * WebOS浏览器应用
 * 提供完整的网页浏览功能
 */

class BrowserApp {
    constructor(windowManager) {
        this.windowManager = windowManager;
        this.appName = 'browser';
        this.displayName = '浏览器';
        this.icon = '🌐';
        this.currentUrl = '';
        this.history = [];
        this.historyIndex = -1;
        this.bookmarks = JSON.parse(localStorage.getItem('webos_browser_bookmarks') || '[]');
        this.homepage = 'https://www.baidu.com';
        
        this.defaultBookmarks = [
            { name: '百度', url: 'https://www.baidu.com' },
            { name: 'Google', url: 'https://www.google.com' },
            { name: 'GitHub', url: 'https://github.com' },
            { name: 'MDN', url: 'https://developer.mozilla.org' },
            { name: '网易', url: 'https://www.163.com' },
            { name: '知乎', url: 'https://www.zhihu.com' }
        ];
        
        if (this.bookmarks.length === 0) {
            this.bookmarks = [...this.defaultBookmarks];
            this.saveBookmarks();
        }
    }

    // 为了兼容现有架构，使用标准的应用接口
    get title() {
        return '浏览器';
    }

    render() {
        return this.createContent();
    }

    onMount() {
        // 获取当前窗口ID（由WindowManager设置）
        setTimeout(() => {
            const windowElements = document.querySelectorAll('.window');
            for (let element of windowElements) {
                if (element.querySelector('.browser-container')) {
                    this.windowElement = element;
                    this.setupEventListeners();
                    this.navigateToHomepage();
                    break;
                }
            }
        }, 10);
    }

    createContent() {
        return `
            <div class="browser-container">
                <div class="browser-toolbar">
                    <div class="nav-buttons">
                        <button class="nav-btn" id="back-btn" title="后退" disabled>
                            <span>←</span>
                        </button>
                        <button class="nav-btn" id="forward-btn" title="前进" disabled>
                            <span>→</span>
                        </button>
                        <button class="nav-btn" id="refresh-btn" title="刷新">
                            <span>⟳</span>
                        </button>
                        <button class="nav-btn" id="home-btn" title="主页">
                            <span>🏠</span>
                        </button>
                    </div>
                    
                    <div class="address-bar-container">
                        <input type="text" class="address-bar" id="address-bar" 
                               placeholder="输入网址或搜索..." value="">
                        <button class="go-btn" id="go-btn">访问</button>
                    </div>
                    
                    <div class="browser-actions">
                        <button class="action-btn" id="bookmark-btn" title="添加书签">⭐</button>
                        <button class="action-btn" id="bookmarks-btn" title="书签管理">📚</button>
                        <button class="action-btn" id="history-btn" title="历史记录">📋</button>
                    </div>
                </div>
                
                <div class="bookmarks-bar" id="bookmarks-bar">
                    ${this.createBookmarksBar()}
                </div>
                
                <div class="browser-content" id="browser-content">
                    <div class="loading-indicator" id="loading-indicator" style="display: none;">
                        <div class="loading-spinner"></div>
                        <span>正在加载...</span>
                    </div>
                    <iframe id="browser-frame" src="" frameborder="0" 
                            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
                            style="width: 100%; height: 100%; border: none;">
                    </iframe>
                </div>
                
                <div class="browser-status" id="browser-status">
                    <span class="status-text">就绪</span>
                    <span class="security-indicator" id="security-indicator"></span>
                </div>
            </div>
            
            <!-- 书签管理对话框 -->
            <div class="bookmark-dialog" id="bookmark-dialog" style="display: none;">
                <div class="dialog-content">
                    <div class="dialog-header">
                        <h3>书签管理</h3>
                        <button class="close-dialog" id="close-bookmark-dialog">×</button>
                    </div>
                    <div class="dialog-body">
                        <div class="bookmark-form">
                            <h4>添加新书签</h4>
                            <input type="text" id="bookmark-name" placeholder="书签名称">
                            <input type="url" id="bookmark-url" placeholder="网址">
                            <button id="add-bookmark">添加</button>
                        </div>
                        <div class="bookmark-list">
                            <h4>现有书签</h4>
                            <div id="bookmark-items"></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- 历史记录对话框 -->
            <div class="history-dialog" id="history-dialog" style="display: none;">
                <div class="dialog-content">
                    <div class="dialog-header">
                        <h3>历史记录</h3>
                        <button class="close-dialog" id="close-history-dialog">×</button>
                    </div>
                    <div class="dialog-body">
                        <div id="history-items"></div>
                    </div>
                </div>
            </div>
        `;
    }

    createBookmarksBar() {
        return this.bookmarks.slice(0, 8).map(bookmark => 
            `<button class="bookmark-item" data-url="${bookmark.url}" title="${bookmark.name}">
                ${bookmark.name}
            </button>`
        ).join('');
    }

    setupEventListeners() {
        if (!this.windowElement) return;

        // 导航按钮
        windowElement.querySelector('#back-btn').addEventListener('click', () => this.goBack());
        windowElement.querySelector('#forward-btn').addEventListener('click', () => this.goForward());
        windowElement.querySelector('#refresh-btn').addEventListener('click', () => this.refresh());
        windowElement.querySelector('#home-btn').addEventListener('click', () => this.goHome());

        // 地址栏
        const addressBar = windowElement.querySelector('#address-bar');
        const goBtn = windowElement.querySelector('#go-btn');
        
        addressBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.navigate(addressBar.value);
            }
        });
        
        goBtn.addEventListener('click', () => {
            this.navigate(addressBar.value);
        });

        // 书签功能
        windowElement.querySelector('#bookmark-btn').addEventListener('click', () => this.addCurrentPageToBookmarks());
        windowElement.querySelector('#bookmarks-btn').addEventListener('click', () => this.showBookmarkDialog());
        windowElement.querySelector('#history-btn').addEventListener('click', () => this.showHistoryDialog());

        // 书签栏点击
        windowElement.querySelectorAll('.bookmark-item').forEach(item => {
            item.addEventListener('click', () => {
                this.navigate(item.dataset.url);
            });
        });

        // iframe加载事件
        const iframe = windowElement.querySelector('#browser-frame');
        iframe.addEventListener('load', () => this.onPageLoad());
        iframe.addEventListener('error', () => this.onPageError());

        // 对话框关闭
        windowElement.querySelector('#close-bookmark-dialog')?.addEventListener('click', () => {
            windowElement.querySelector('#bookmark-dialog').style.display = 'none';
        });
        
        windowElement.querySelector('#close-history-dialog')?.addEventListener('click', () => {
            windowElement.querySelector('#history-dialog').style.display = 'none';
        });

        // 添加书签
        windowElement.querySelector('#add-bookmark')?.addEventListener('click', () => {
            this.addBookmark();
        });

        this.windowElement = windowElement;
    }

    navigate(url) {
        if (!url) return;
        
        // URL处理
        let processedUrl = url.trim();
        
        // 如果不是完整URL，添加协议
        if (!processedUrl.match(/^https?:\/\//)) {
            if (processedUrl.includes('.') || processedUrl.includes('localhost')) {
                processedUrl = 'https://' + processedUrl;
            } else {
                // 当作搜索关键词
                processedUrl = `https://www.baidu.com/s?wd=${encodeURIComponent(processedUrl)}`;
            }
        }

        this.showLoading();
        this.currentUrl = processedUrl;
        
        // 更新地址栏
        const addressBar = this.windowElement.querySelector('#address-bar');
        addressBar.value = processedUrl;
        
        // 添加到历史记录
        this.addToHistory(processedUrl);
        
        // 加载页面
        const iframe = this.windowElement.querySelector('#browser-frame');
        iframe.src = processedUrl;
        
        // 更新窗口标题
        const titleElement = this.windowElement.querySelector('.window-title');
        if (titleElement) titleElement.textContent = '浏览器 - 正在加载...';
        
        this.updateNavButtons();
        this.updateSecurityIndicator(processedUrl);
    }

    navigateToHomepage() {
        this.navigate(this.homepage);
    }

    goBack() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            const url = this.history[this.historyIndex];
            this.loadFromHistory(url);
        }
    }

    goForward() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            const url = this.history[this.historyIndex];
            this.loadFromHistory(url);
        }
    }

    refresh() {
        const iframe = this.windowElement.querySelector('#browser-frame');
        iframe.src = iframe.src;
        this.showLoading();
    }

    goHome() {
        this.navigate(this.homepage);
    }

    loadFromHistory(url) {
        this.currentUrl = url;
        const addressBar = this.windowElement.querySelector('#address-bar');
        addressBar.value = url;
        
        const iframe = this.windowElement.querySelector('#browser-frame');
        iframe.src = url;
        
        this.updateNavButtons();
        this.showLoading();
    }

    addToHistory(url) {
        // 移除当前位置之后的历史记录
        this.history = this.history.slice(0, this.historyIndex + 1);
        // 添加新URL
        this.history.push(url);
        this.historyIndex = this.history.length - 1;
        
        // 限制历史记录数量
        if (this.history.length > 100) {
            this.history = this.history.slice(-100);
            this.historyIndex = this.history.length - 1;
        }
    }

    updateNavButtons() {
        const backBtn = this.windowElement.querySelector('#back-btn');
        const forwardBtn = this.windowElement.querySelector('#forward-btn');
        
        backBtn.disabled = this.historyIndex <= 0;
        forwardBtn.disabled = this.historyIndex >= this.history.length - 1;
    }

    showLoading() {
        const loadingIndicator = this.windowElement.querySelector('#loading-indicator');
        loadingIndicator.style.display = 'flex';
        
        const statusText = this.windowElement.querySelector('.status-text');
        statusText.textContent = '正在加载...';
    }

    hideLoading() {
        const loadingIndicator = this.windowElement.querySelector('#loading-indicator');
        loadingIndicator.style.display = 'none';
        
        const statusText = this.windowElement.querySelector('.status-text');
        statusText.textContent = '就绪';
    }

    onPageLoad() {
        this.hideLoading();
        
        try {
            const iframe = this.windowElement.querySelector('#browser-frame');
            const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
            const title = iframeDocument.title || this.currentUrl;
            
            const titleElement = this.windowElement.querySelector('.window-title');
            if (titleElement) titleElement.textContent = `浏览器 - ${title}`;
        } catch (e) {
            // 跨域限制，无法获取标题
            const titleElement = this.windowElement.querySelector('.window-title');
            if (titleElement) titleElement.textContent = `浏览器 - ${this.currentUrl}`;
        }
        
        const statusText = this.windowElement.querySelector('.status-text');
        statusText.textContent = '页面加载完成';
    }

    onPageError() {
        this.hideLoading();
        
        const statusText = this.windowElement.querySelector('.status-text');
        statusText.textContent = '页面加载失败';
        
        const titleElement = this.windowElement.querySelector('.window-title');
        if (titleElement) titleElement.textContent = '浏览器 - 加载失败';
    }

    updateSecurityIndicator(url) {
        const securityIndicator = this.windowElement.querySelector('#security-indicator');
        
        if (url.startsWith('https://')) {
            securityIndicator.textContent = '🔒';
            securityIndicator.title = '安全连接';
        } else if (url.startsWith('http://')) {
            securityIndicator.textContent = '⚠️';
            securityIndicator.title = '不安全连接';
        } else {
            securityIndicator.textContent = '';
            securityIndicator.title = '';
        }
    }

    addCurrentPageToBookmarks() {
        if (!this.currentUrl) return;
        
        const name = prompt('请输入书签名称:', this.currentUrl);
        if (name) {
            this.bookmarks.push({ name, url: this.currentUrl });
            this.saveBookmarks();
            this.updateBookmarksBar();
        }
    }

    addBookmark() {
        const nameInput = this.windowElement.querySelector('#bookmark-name');
        const urlInput = this.windowElement.querySelector('#bookmark-url');
        
        const name = nameInput.value.trim();
        const url = urlInput.value.trim();
        
        if (name && url) {
            this.bookmarks.push({ name, url });
            this.saveBookmarks();
            this.updateBookmarksBar();
            this.updateBookmarkDialog();
            
            nameInput.value = '';
            urlInput.value = '';
        }
    }

    removeBookmark(index) {
        this.bookmarks.splice(index, 1);
        this.saveBookmarks();
        this.updateBookmarksBar();
        this.updateBookmarkDialog();
    }

    saveBookmarks() {
        localStorage.setItem('webos_browser_bookmarks', JSON.stringify(this.bookmarks));
    }

    updateBookmarksBar() {
        const bookmarksBar = this.windowElement.querySelector('#bookmarks-bar');
        bookmarksBar.innerHTML = this.createBookmarksBar();
        
        // 重新绑定事件
        bookmarksBar.querySelectorAll('.bookmark-item').forEach(item => {
            item.addEventListener('click', () => {
                this.navigate(item.dataset.url);
            });
        });
    }

    showBookmarkDialog() {
        const dialog = this.windowElement.querySelector('#bookmark-dialog');
        dialog.style.display = 'flex';
        this.updateBookmarkDialog();
    }

    updateBookmarkDialog() {
        const bookmarkItems = this.windowElement.querySelector('#bookmark-items');
        bookmarkItems.innerHTML = this.bookmarks.map((bookmark, index) => `
            <div class="bookmark-entry">
                <span class="bookmark-info">
                    <strong>${bookmark.name}</strong><br>
                    <small>${bookmark.url}</small>
                </span>
                <div class="bookmark-actions">
                    <button onclick="window.browserApp.navigate('${bookmark.url}')">访问</button>
                    <button onclick="window.browserApp.removeBookmark(${index})">删除</button>
                </div>
            </div>
        `).join('');
    }

    showHistoryDialog() {
        const dialog = this.windowElement.querySelector('#history-dialog');
        dialog.style.display = 'flex';
        
        const historyItems = this.windowElement.querySelector('#history-items');
        historyItems.innerHTML = this.history.slice(-20).reverse().map(url => `
            <div class="history-entry">
                <span class="history-url">${url}</span>
                <button onclick="window.browserApp.navigate('${url}')">访问</button>
            </div>
        `).join('');
    }
}

// 全局引用，用于对话框中的函数调用
window.browserApp = null;

// 导出应用类
window.BrowserApp = BrowserApp; 