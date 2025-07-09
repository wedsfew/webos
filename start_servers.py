#!/usr/bin/env python3
"""
Web桌面系统启动脚本
同时启动web服务器(8080)和代理服务器(9999)
"""

import subprocess
import time
import sys
import signal
import os
from threading import Thread

def start_web_server():
    """启动Web服务器"""
    try:
        print("🌐 启动Web服务器 (端口8080)...")
        subprocess.run([
            sys.executable, '-m', 'http.server', '8080'
        ], cwd=os.getcwd())
    except KeyboardInterrupt:
        print("\n🌐 Web服务器已停止")
    except Exception as e:
        print(f"❌ Web服务器启动失败: {e}")

def start_proxy_server():
    """启动代理服务器"""
    try:
        print("🛡️  启动代理服务器 (端口9999)...")
        subprocess.run([sys.executable, 'proxy_server.py'])
    except KeyboardInterrupt:
        print("\n🛡️  代理服务器已停止")
    except Exception as e:
        print(f"❌ 代理服务器启动失败: {e}")

def signal_handler(sig, frame):
    """处理Ctrl+C信号"""
    print("\n\n🛑 正在停止所有服务器...")
    print("🌐 停止Web服务器...")
    print("🛡️  停止代理服务器...")
    sys.exit(0)

def main():
    """主函数"""
    # 注册信号处理器
    signal.signal(signal.SIGINT, signal_handler)
    
    print("=" * 50)
    print("🚀 Web桌面系统启动器")
    print("=" * 50)
    print("📋 将启动以下服务:")
    print("   • Web服务器: http://localhost:8080")
    print("   • 代理服务器: http://localhost:9999")
    print("=" * 50)
    print("⚠️  按 Ctrl+C 停止所有服务器")
    print("=" * 50)
    
    # 启动Web服务器线程
    web_thread = Thread(target=start_web_server, daemon=True)
    web_thread.start()
    
    # 等待一秒确保Web服务器启动
    time.sleep(1)
    
    # 启动代理服务器线程
    proxy_thread = Thread(target=start_proxy_server, daemon=True)
    proxy_thread.start()
    
    # 等待一秒确保代理服务器启动
    time.sleep(1)
    
    print("\n✅ 所有服务器启动完成!")
    print(f"🌐 访问桌面系统: http://localhost:8080")
    print(f"🛡️  代理服务器状态: http://localhost:9999")
    print("\n📖 使用说明:")
    print("   1. 打开浏览器访问 http://localhost:8080")
    print("   2. 点击桌面上的浏览器图标")
    print("   3. 输入任意网址，系统会自动使用代理访问")
    print("   4. 代理状态显示在浏览器工具栏右侧")
    print("\n💡 提示: 确保代理服务器状态显示为'代理已启用'")
    print("=" * 50)
    
    try:
        # 保持主线程运行
        while True:
            time.sleep(1)
            # 检查线程是否还在运行
            if not web_thread.is_alive() and not proxy_thread.is_alive():
                break
    except KeyboardInterrupt:
        signal_handler(signal.SIGINT, None)

if __name__ == "__main__":
    main() 