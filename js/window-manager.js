// 窗口管理器
class WindowManager {
    constructor() {
        this.windows = new Map();
        this.windowCounter = 0;
        this.zIndexCounter = 100;
        this.activeWindow = null;
        
        this.initEventListeners();
    }

    initEventListeners() {
        // 阻止默认的拖拽行为
        document.addEventListener('dragstart', (e) => e.preventDefault());
    }

    createWindow(app) {
        const windowId = ++this.windowCounter;
        const windowElement = this.createWindowElement(windowId, app);
        
        // 设置窗口位置（级联效果）
        const offsetX = (windowId - 1) * 30;
        const offsetY = (windowId - 1) * 30;
        windowElement.style.left = `${50 + offsetX}px`;
        windowElement.style.top = `${50 + offsetY}px`;
        windowElement.style.zIndex = ++this.zIndexCounter;

        // 渲染应用内容
        const content = windowElement.querySelector('.window-content');
        content.innerHTML = app.render();

        // 添加到DOM
        const container = document.getElementById('windows-container');
        container.appendChild(windowElement);

        // 存储窗口信息
        this.windows.set(windowId, {
            element: windowElement,
            app: app,
            isMaximized: false,
            isMinimized: false,
            originalSize: { width: 400, height: 300 },
            originalPosition: { x: 50 + offsetX, y: 50 + offsetY }
        });

        // 设置事件监听器
        this.setupWindowEvents(windowId);

        // 调用应用的 onMount 回调
        if (app.onMount) {
            app.onMount();
        }

        // 聚焦新窗口
        this.focusWindow(windowId);

        return windowId;
    }

    createWindowElement(windowId, app) {
        const template = document.getElementById('window-template');
        const windowElement = template.content.cloneNode(true).querySelector('.window');
        
        windowElement.dataset.windowId = windowId;
        windowElement.querySelector('.window-title').textContent = app.title;
        
        return windowElement;
    }

    setupWindowEvents(windowId) {
        const window = this.windows.get(windowId);
        const windowElement = window.element;
        const header = windowElement.querySelector('.window-header');
        
        // 窗口聚焦
        windowElement.addEventListener('mousedown', () => {
            this.focusWindow(windowId);
        });

        // 窗口控制按钮
        const minimizeBtn = windowElement.querySelector('.window-minimize');
        const maximizeBtn = windowElement.querySelector('.window-maximize');
        const closeBtn = windowElement.querySelector('.window-close');

        minimizeBtn.addEventListener('click', () => this.minimizeWindow(windowId));
        maximizeBtn.addEventListener('click', () => this.toggleMaximizeWindow(windowId));
        closeBtn.addEventListener('click', () => this.closeWindow(windowId));

        // 拖拽功能
        this.setupDragFunctionality(windowId, header);

        // 调整大小功能
        this.setupResizeFunctionality(windowId);
    }

    setupDragFunctionality(windowId, header) {
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        header.addEventListener('mousedown', (e) => {
            const window = this.windows.get(windowId);
            if (window.isMaximized) return; // 最大化时不允许拖拽

            isDragging = true;
            const rect = window.element.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;

            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);

            e.preventDefault();
        });

        function handleMouseMove(e) {
            if (!isDragging) return;

            const window = this.windows.get(windowId);
            const newX = e.clientX - dragOffset.x;
            const newY = e.clientY - dragOffset.y;

            // 边界检查
            const maxX = window.innerWidth - window.element.offsetWidth;
            const maxY = window.innerHeight - window.element.offsetHeight - 48; // 减去任务栏高度

            const clampedX = Math.max(0, Math.min(newX, maxX));
            const clampedY = Math.max(0, Math.min(newY, maxY));

            window.element.style.left = `${clampedX}px`;
            window.element.style.top = `${clampedY}px`;
        }

        function handleMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }

        // 绑定this上下文
        handleMouseMove = handleMouseMove.bind(this);
    }

    setupResizeFunctionality(windowId) {
        const window = this.windows.get(windowId);
        const windowElement = window.element;

        // 创建调整大小的控制点
        const resizeHandles = ['se', 'sw', 'ne', 'nw', 'n', 's', 'e', 'w'];
        
        resizeHandles.forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${direction}`;
            handle.style.cssText = this.getResizeHandleStyles(direction);
            windowElement.appendChild(handle);

            handle.addEventListener('mousedown', (e) => {
                if (window.isMaximized) return;
                this.startResize(windowId, direction, e);
            });
        });
    }

    getResizeHandleStyles(direction) {
        const baseStyle = 'position: absolute; background: transparent; cursor: ';
        
        switch (direction) {
            case 'se': return baseStyle + 'se-resize; right: 0; bottom: 0; width: 10px; height: 10px;';
            case 'sw': return baseStyle + 'sw-resize; left: 0; bottom: 0; width: 10px; height: 10px;';
            case 'ne': return baseStyle + 'ne-resize; right: 0; top: 0; width: 10px; height: 10px;';
            case 'nw': return baseStyle + 'nw-resize; left: 0; top: 0; width: 10px; height: 10px;';
            case 'n': return baseStyle + 'n-resize; top: 0; left: 10px; right: 10px; height: 5px;';
            case 's': return baseStyle + 's-resize; bottom: 0; left: 10px; right: 10px; height: 5px;';
            case 'e': return baseStyle + 'e-resize; right: 0; top: 10px; bottom: 10px; width: 5px;';
            case 'w': return baseStyle + 'w-resize; left: 0; top: 10px; bottom: 10px; width: 5px;';
        }
    }

    startResize(windowId, direction, e) {
        const window = this.windows.get(windowId);
        const windowElement = window.element;
        const startX = e.clientX;
        const startY = e.clientY;
        const startWidth = parseInt(window.getComputedStyle(windowElement).width);
        const startHeight = parseInt(window.getComputedStyle(windowElement).height);
        const startLeft = parseInt(windowElement.style.left);
        const startTop = parseInt(windowElement.style.top);

        function handleMouseMove(e) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;

            let newWidth = startWidth;
            let newHeight = startHeight;
            let newLeft = startLeft;
            let newTop = startTop;

            // 根据调整方向计算新尺寸和位置
            if (direction.includes('e')) newWidth = startWidth + deltaX;
            if (direction.includes('w')) {
                newWidth = startWidth - deltaX;
                newLeft = startLeft + deltaX;
            }
            if (direction.includes('s')) newHeight = startHeight + deltaY;
            if (direction.includes('n')) {
                newHeight = startHeight - deltaY;
                newTop = startTop + deltaY;
            }

            // 最小尺寸限制
            newWidth = Math.max(300, newWidth);
            newHeight = Math.max(200, newHeight);

            // 应用新尺寸和位置
            windowElement.style.width = `${newWidth}px`;
            windowElement.style.height = `${newHeight}px`;
            if (direction.includes('w')) windowElement.style.left = `${newLeft}px`;
            if (direction.includes('n')) windowElement.style.top = `${newTop}px`;
        }

        function handleMouseUp() {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        }

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        e.preventDefault();
    }

    focusWindow(windowId) {
        if (this.activeWindow) {
            this.activeWindow.style.zIndex = this.zIndexCounter - 50;
        }

        const window = this.windows.get(windowId);
        if (window) {
            window.element.style.zIndex = ++this.zIndexCounter;
            this.activeWindow = window.element;
            
            // 更新任务栏按钮状态
            this.updateTaskbarButtons(windowId);
        }
    }

    minimizeWindow(windowId) {
        const window = this.windows.get(windowId);
        if (window) {
            window.element.classList.add('minimized');
            window.isMinimized = true;
        }
    }

    restoreWindow(windowId) {
        const window = this.windows.get(windowId);
        if (window) {
            window.element.classList.remove('minimized', 'maximized');
            window.isMinimized = false;
            window.isMaximized = false;
            this.focusWindow(windowId);
        }
    }

    toggleMaximizeWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        if (window.isMaximized) {
            // 还原窗口
            window.element.classList.remove('maximized');
            window.element.style.width = `${window.originalSize.width}px`;
            window.element.style.height = `${window.originalSize.height}px`;
            window.element.style.left = `${window.originalPosition.x}px`;
            window.element.style.top = `${window.originalPosition.y}px`;
            window.isMaximized = false;
        } else {
            // 最大化窗口
            window.originalSize.width = parseInt(window.element.style.width) || 400;
            window.originalSize.height = parseInt(window.element.style.height) || 300;
            window.originalPosition.x = parseInt(window.element.style.left) || 50;
            window.originalPosition.y = parseInt(window.element.style.top) || 50;
            
            window.element.classList.add('maximized');
            window.isMaximized = true;
        }
    }

    closeWindow(windowId) {
        const window = this.windows.get(windowId);
        if (!window) return;

        // 调用应用的 onUnmount 回调
        if (window.app.onUnmount) {
            window.app.onUnmount();
        }

        // 从DOM中移除
        window.element.remove();

        // 从管理器中移除
        this.windows.delete(windowId);

        // 从桌面运行应用中移除
        for (const [appName, app] of desktop.runningApps) {
            if (app.windowId === windowId) {
                desktop.closeApp(appName);
                break;
            }
        }

        // 如果是当前活动窗口，重置活动窗口
        if (this.activeWindow === window.element) {
            this.activeWindow = null;
        }
    }

    updateTaskbarButtons(activeWindowId) {
        const taskbarButtons = document.querySelectorAll('.taskbar-app');
        taskbarButtons.forEach(button => {
            const appName = button.dataset.app;
            const app = desktop.runningApps.get(appName);
            
            if (app && app.windowId === activeWindowId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }

    // 获取窗口信息
    getWindow(windowId) {
        return this.windows.get(windowId);
    }

    // 获取所有窗口
    getAllWindows() {
        return Array.from(this.windows.values());
    }

    // 切换到下一个窗口 (Alt+Tab)
    switchToNextWindow() {
        const windows = this.getAllWindows();
        if (windows.length === 0) return;

        const currentIndex = windows.findIndex(w => w.element === this.activeWindow);
        const nextIndex = (currentIndex + 1) % windows.length;
        const nextWindow = windows[nextIndex];
        
        this.focusWindow(parseInt(nextWindow.element.dataset.windowId));
    }
} 