// 窗口管理器
const WindowManager = {
    windows: {},
    windowsZIndex: 100,
    activeWindow: null,
    nextWindowId: 1,
    
    init() {
        this.setupGlobalEvents();
    },
    
    setupGlobalEvents() {
        // 监听键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.altKey && e.key === 'Tab') {
                e.preventDefault();
                this.switchWindow();
            }
            if (e.altKey && e.key === 'F4') {
                e.preventDefault();
                this.closeActiveWindow();
            }
        });
    },
    
    createWindow({ title, icon, width = 800, height = 600, x, y, onClose, resizable = true, maximizable = true }) {
        const windowId = `window-${this.nextWindowId++}`;
        
        // 默认居中位置
        if (x === undefined) x = (window.innerWidth - width) / 2;
        if (y === undefined) y = (window.innerHeight - height - 40) / 2; // 减去任务栏高度
        
        const windowElement = this.createWindowElement(windowId, title, icon, width, height, x, y);
        
        const windowObj = {
            id: windowId,
            element: windowElement,
            title,
            icon,
            width,
            height,
            x,
            y,
            minimized: false,
            maximized: false,
            resizable,
            maximizable,
            onClose
        };
        
        this.windows[windowId] = windowObj;
        
        // 添加到DOM
        document.getElementById('windows-container').appendChild(windowElement);
        
        // 设置事件监听器
        this.setupWindowEvents(windowObj);
        
        // 激活窗口
        this.activateWindow(windowId);
        
        return windowId;
    },
    
    createWindowElement(windowId, title, icon, width, height, x, y) {
        const windowElement = document.createElement('div');
        windowElement.className = 'window';
        windowElement.id = windowId;
        windowElement.style.cssText = `
            width: ${width}px;
            height: ${height}px;
            left: ${x}px;
            top: ${y}px;
            z-index: ${this.windowsZIndex++};
        `;
        
        windowElement.innerHTML = `
            <div class="window-header">
                <div class="window-title">
                    <i class="${icon}"></i>
                    <span>${title}</span>
                </div>
                <div class="window-controls">
                    <div class="window-control minimize" title="最小化">
                        <i class="fas fa-minus"></i>
                    </div>
                    <div class="window-control maximize" title="最大化">
                        <i class="fas fa-square"></i>
                    </div>
                    <div class="window-control close" title="关闭">
                        <i class="fas fa-times"></i>
                    </div>
                </div>
            </div>
            <div class="window-content">
                <!-- 应用内容将在这里动态添加 -->
            </div>
        `;
        
        return windowElement;
    },
    
    setupWindowEvents(windowObj) {
        const { element, id } = windowObj;
        const header = element.querySelector('.window-header');
        const minimizeBtn = element.querySelector('.minimize');
        const maximizeBtn = element.querySelector('.maximize');
        const closeBtn = element.querySelector('.close');
        
        // 拖拽功能
        this.makeDraggable(element, header);
        
        // 窗口控制按钮
        minimizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.minimizeWindow(id);
        });
        
        maximizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleMaximizeWindow(id);
        });
        
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeWindow(id);
        });
        
        // 点击激活窗口
        element.addEventListener('mousedown', () => {
            this.activateWindow(id);
        });
        
        // 双击标题栏最大化/还原
        header.addEventListener('dblclick', () => {
            if (windowObj.maximizable) {
                this.toggleMaximizeWindow(id);
            }
        });
        
        // 调整大小功能
        if (windowObj.resizable) {
            this.makeResizable(element);
        }
    },
    
    makeDraggable(windowElement, handle) {
        let isDragging = false;
        let startX, startY, initialX, initialY;
        
        handle.addEventListener('mousedown', (e) => {
            if (e.target.closest('.window-control')) return;
            
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialX = windowElement.offsetLeft;
            initialY = windowElement.offsetTop;
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
        
        function onMouseMove(e) {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            const newX = initialX + deltaX;
            const newY = Math.max(0, initialY + deltaY); // 防止拖拽到屏幕上方
            
            windowElement.style.left = `${newX}px`;
            windowElement.style.top = `${newY}px`;
        }
        
        function onMouseUp() {
            isDragging = false;
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        }
    },
    
    makeResizable(windowElement) {
        const resizeHandles = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'];
        
        resizeHandles.forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${direction}`;
            handle.style.cssText = `
                position: absolute;
                background: transparent;
                z-index: 10;
            `;
            
            // 设置手柄位置和大小
            switch(direction) {
                case 'n':
                    handle.style.cssText += 'top: 0; left: 5px; right: 5px; height: 5px; cursor: n-resize;';
                    break;
                case 's':
                    handle.style.cssText += 'bottom: 0; left: 5px; right: 5px; height: 5px; cursor: s-resize;';
                    break;
                case 'w':
                    handle.style.cssText += 'left: 0; top: 5px; bottom: 5px; width: 5px; cursor: w-resize;';
                    break;
                case 'e':
                    handle.style.cssText += 'right: 0; top: 5px; bottom: 5px; width: 5px; cursor: e-resize;';
                    break;
                case 'nw':
                    handle.style.cssText += 'top: 0; left: 0; width: 5px; height: 5px; cursor: nw-resize;';
                    break;
                case 'ne':
                    handle.style.cssText += 'top: 0; right: 0; width: 5px; height: 5px; cursor: ne-resize;';
                    break;
                case 'sw':
                    handle.style.cssText += 'bottom: 0; left: 0; width: 5px; height: 5px; cursor: sw-resize;';
                    break;
                case 'se':
                    handle.style.cssText += 'bottom: 0; right: 0; width: 5px; height: 5px; cursor: se-resize;';
                    break;
            }
            
            windowElement.appendChild(handle);
            
            // 添加调整大小功能
            this.addResizeFunction(handle, windowElement, direction);
        });
    },
    
    addResizeFunction(handle, windowElement, direction) {
        handle.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = windowElement.offsetWidth;
            const startHeight = windowElement.offsetHeight;
            const startLeft = windowElement.offsetLeft;
            const startTop = windowElement.offsetTop;
            
            function onMouseMove(e) {
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;
                
                if (direction.includes('e')) {
                    newWidth = Math.max(400, startWidth + deltaX);
                }
                if (direction.includes('w')) {
                    newWidth = Math.max(400, startWidth - deltaX);
                    newLeft = startLeft + (startWidth - newWidth);
                }
                if (direction.includes('s')) {
                    newHeight = Math.max(300, startHeight + deltaY);
                }
                if (direction.includes('n')) {
                    newHeight = Math.max(300, startHeight - deltaY);
                    newTop = startTop + (startHeight - newHeight);
                }
                
                windowElement.style.width = `${newWidth}px`;
                windowElement.style.height = `${newHeight}px`;
                windowElement.style.left = `${newLeft}px`;
                windowElement.style.top = `${newTop}px`;
            }
            
            function onMouseUp() {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });
    },
    
    activateWindow(windowId) {
        if (!this.windows[windowId]) return;
        
        // 取消当前活动窗口
        if (this.activeWindow) {
            const activeElement = document.getElementById(this.activeWindow);
            if (activeElement) {
                activeElement.style.zIndex = activeElement.style.zIndex || this.windowsZIndex++;
            }
        }
        
        // 激活新窗口
        const windowElement = document.getElementById(windowId);
        if (windowElement) {
            windowElement.style.zIndex = this.windowsZIndex++;
            this.activeWindow = windowId;
            
            // 如果窗口被最小化，则还原
            if (this.windows[windowId].minimized) {
                this.restoreWindow(windowId);
            }
            
            // 更新任务栏状态
            this.updateTaskbarState();
        }
    },
    
    minimizeWindow(windowId) {
        const windowObj = this.windows[windowId];
        if (!windowObj) return;
        
        windowObj.element.classList.add('minimized');
        windowObj.minimized = true;
        
        // 如果这是当前活动窗口，寻找下一个活动窗口
        if (this.activeWindow === windowId) {
            this.findNextActiveWindow();
        }
        
        this.updateTaskbarState();
    },
    
    restoreWindow(windowId) {
        const windowObj = this.windows[windowId];
        if (!windowObj) return;
        
        windowObj.element.classList.remove('minimized');
        windowObj.minimized = false;
        
        this.activateWindow(windowId);
    },
    
    toggleMaximizeWindow(windowId) {
        const windowObj = this.windows[windowId];
        if (!windowObj) return;
        
        if (windowObj.maximized) {
            // 还原窗口
            windowObj.element.classList.remove('maximized');
            windowObj.element.style.width = `${windowObj.width}px`;
            windowObj.element.style.height = `${windowObj.height}px`;
            windowObj.element.style.left = `${windowObj.x}px`;
            windowObj.element.style.top = `${windowObj.y}px`;
            windowObj.maximized = false;
            
            // 更新按钮图标
            const maximizeBtn = windowObj.element.querySelector('.maximize i');
            maximizeBtn.className = 'fas fa-square';
        } else {
            // 保存当前位置和大小
            windowObj.width = windowObj.element.offsetWidth;
            windowObj.height = windowObj.element.offsetHeight;
            windowObj.x = windowObj.element.offsetLeft;
            windowObj.y = windowObj.element.offsetTop;
            
            // 最大化窗口
            windowObj.element.classList.add('maximized');
            windowObj.maximized = true;
            
            // 更新按钮图标
            const maximizeBtn = windowObj.element.querySelector('.maximize i');
            maximizeBtn.className = 'fas fa-window-restore';
        }
    },
    
    closeWindow(windowId) {
        const windowObj = this.windows[windowId];
        if (!windowObj) return;
        
        // 调用关闭回调
        if (windowObj.onClose) {
            windowObj.onClose();
        }
        
        // 移除DOM元素
        windowObj.element.remove();
        
        // 从管理器中移除
        delete this.windows[windowId];
        
        // 如果这是当前活动窗口，寻找下一个活动窗口
        if (this.activeWindow === windowId) {
            this.findNextActiveWindow();
        }
    },
    
    closeActiveWindow() {
        if (this.activeWindow) {
            this.closeWindow(this.activeWindow);
        }
    },
    
    findNextActiveWindow() {
        const visibleWindows = Object.keys(this.windows).filter(id => 
            !this.windows[id].minimized
        );
        
        if (visibleWindows.length > 0) {
            this.activateWindow(visibleWindows[visibleWindows.length - 1]);
        } else {
            this.activeWindow = null;
        }
    },
    
    switchWindow() {
        const windowIds = Object.keys(this.windows);
        if (windowIds.length <= 1) return;
        
        const currentIndex = windowIds.indexOf(this.activeWindow);
        const nextIndex = (currentIndex + 1) % windowIds.length;
        this.activateWindow(windowIds[nextIndex]);
    },
    
    updateTaskbarState() {
        // 更新任务栏中应用的状态
        Object.keys(this.windows).forEach(windowId => {
            const windowObj = this.windows[windowId];
            const taskbarApp = document.querySelector(`.taskbar-app[data-window-id="${windowId}"]`);
            
            if (taskbarApp) {
                taskbarApp.classList.toggle('active', this.activeWindow === windowId);
                taskbarApp.classList.toggle('minimized', windowObj.minimized);
            }
        });
    },
    
    getWindowContent(windowId) {
        const windowObj = this.windows[windowId];
        return windowObj ? windowObj.element.querySelector('.window-content') : null;
    },
    
    setWindowTitle(windowId, title) {
        const windowObj = this.windows[windowId];
        if (windowObj) {
            const titleElement = windowObj.element.querySelector('.window-title span');
            if (titleElement) {
                titleElement.textContent = title;
            }
            windowObj.title = title;
        }
    },
    
    getAllWindows() {
        return this.windows;
    },
    
    getActiveWindow() {
        return this.activeWindow;
    }
}; 