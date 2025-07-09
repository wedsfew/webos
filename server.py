#!/usr/bin/env python3
"""
WebOS Desktop Server
一个简单的HTTP服务器用于运行WebOS桌面系统
不需要root权限，适用于PSS环境
"""

import http.server
import socketserver
import os
import sys
import webbrowser
import threading
import time
from pathlib import Path

class WebOSRequestHandler(http.server.SimpleHTTPRequestHandler):
    """自定义请求处理器，添加CORS支持和更好的文件类型处理"""
    
    def end_headers(self):
        # 添加CORS头
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()
    
    def guess_type(self, path):
        """改进的MIME类型猜测"""
        # 直接处理已知的文件类型
        if path.endswith('.js'):
            return 'application/javascript'
        elif path.endswith('.css'):
            return 'text/css'
        elif path.endswith('.html'):
            return 'text/html; charset=utf-8'
        elif path.endswith('.json'):
            return 'application/json'
        
        # 对于其他文件类型，使用父类方法并安全处理返回值
        try:
            result = super().guess_type(path)
            if isinstance(result, tuple) and len(result) >= 2:
                return result[0]  # 只返回mimetype
            else:
                return result
        except Exception:
            return 'application/octet-stream'
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

def find_free_port(start_port=8000, max_attempts=100):
    """查找可用端口"""
    import socket
    
    for port in range(start_port, start_port + max_attempts):
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('localhost', port))
                return port
        except OSError:
            continue
    
    raise RuntimeError(f"无法在端口 {start_port}-{start_port + max_attempts} 范围内找到可用端口")

def open_browser(url, delay=1.5):
    """延迟打开浏览器"""
    time.sleep(delay)
    try:
        webbrowser.open(url)
        print(f"✓ 浏览器已打开: {url}")
    except Exception as e:
        print(f"⚠ 无法自动打开浏览器: {e}")
        print(f"请手动访问: {url}")

def print_banner():
    """打印启动横幅"""
    banner = """
╔══════════════════════════════════════════════╗
║            WebOS Desktop Server              ║
║        基于Web的桌面操作系统                 ║
╚══════════════════════════════════════════════╝
    """
    print(banner)

def print_info(port, host="localhost"):
    """打印服务器信息"""
    url = f"http://{host}:{port}"
    
    print(f"""
🚀 服务器已启动！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 地址: {url}
🖥️  桌面: {url}/index.html
📁 目录: {os.getcwd()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 使用说明:
   • 在浏览器中访问上述地址
   • 支持桌面图标、窗口管理、文件系统等功能
   • 包含文件管理器、文本编辑器、计算器、终端等应用
   • 按 Ctrl+C 停止服务器

🔧 功能特性:
   ✓ 现代化桌面环境
   ✓ 多窗口管理
   ✓ 虚拟文件系统
   ✓ 内置应用程序
   ✓ 无需root权限
   ✓ 跨平台兼容

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
""")

def main():
    """主函数"""
    print_banner()
    
    # 检查必要文件
    required_files = ['index.html', 'styles/desktop.css', 'js/desktop.js']
    missing_files = []
    
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print("❌ 错误: 缺少必要文件:")
        for file in missing_files:
            print(f"   - {file}")
        print("\n请确保在WebOS Desktop项目目录中运行此脚本。")
        sys.exit(1)
    
    # 解析命令行参数
    port = 8000
    host = "localhost"
    auto_open = True
    
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ 无效的端口号")
            sys.exit(1)
    
    if len(sys.argv) > 2:
        host = sys.argv[2]
    
    if "--no-browser" in sys.argv:
        auto_open = False
    
    # 查找可用端口
    try:
        if port == 8000:  # 默认端口，查找可用的
            port = find_free_port(port)
        else:  # 指定端口，直接使用
            import socket
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind((host, port))
    except Exception as e:
        print(f"❌ 端口 {port} 不可用: {e}")
        try:
            port = find_free_port(8000)
            print(f"🔄 自动选择可用端口: {port}")
        except Exception:
            print("❌ 无法找到可用端口")
            sys.exit(1)
    
    # 启动服务器
    try:
        with socketserver.TCPServer((host, port), WebOSRequestHandler) as httpd:
            print_info(port, host)
            
            # 在后台线程中打开浏览器
            if auto_open:
                url = f"http://{host}:{port}"
                browser_thread = threading.Thread(target=open_browser, args=(url,))
                browser_thread.daemon = True
                browser_thread.start()
            
            print("⚡ 服务器运行中... (按 Ctrl+C 停止)")
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n🛑 服务器已停止")
        print("👋 感谢使用 WebOS Desktop!")
    except Exception as e:
        print(f"❌ 服务器错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 