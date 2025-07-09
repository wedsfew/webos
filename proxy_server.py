#!/usr/bin/env python3
"""
WebOS Desktop 代理服务器
专门用于绕过X-Frame-Options限制，让浏览器应用能够访问百度等网站
"""

import http.server
import socketserver
import urllib.request
import urllib.parse
import sys
import threading
import time
import gzip
import io
from urllib.error import URLError, HTTPError

class ProxyRequestHandler(http.server.BaseHTTPRequestHandler):
    """代理请求处理器"""
    
    def do_GET(self):
        """处理GET请求"""
        try:
            # 解析代理URL参数
            if self.path.startswith('/proxy?url='):
                # 提取目标URL
                query = self.path[7:]  # 移除 '/proxy?'
                params = urllib.parse.parse_qs(query)
                
                if 'url' not in params:
                    self.send_error(400, "Missing URL parameter")
                    return
                
                target_url = params['url'][0]
                
                # 验证URL
                if not target_url.startswith(('http://', 'https://')):
                    target_url = 'https://' + target_url
                
                self.proxy_request(target_url)
                
            elif self.path == '/':
                # 返回代理服务说明页面
                self.send_proxy_info()
            else:
                self.send_error(404, "Not Found")
                
        except Exception as e:
            self.send_error(500, f"Proxy Error: {str(e)}")
    
    def do_HEAD(self):
        """处理HEAD请求"""
        try:
            if self.path == '/':
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
            else:
                self.send_error(404, "Not Found")
        except Exception as e:
            self.send_error(500, f"HEAD Error: {str(e)}")
    
    def proxy_request(self, target_url):
        """代理请求到目标URL"""
        try:
            # 创建请求
            req = urllib.request.Request(target_url)
            
            # 添加用户代理头，模拟真实浏览器
            req.add_header('User-Agent', 
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            req.add_header('Accept', 
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
            req.add_header('Accept-Language', 'zh-CN,zh;q=0.9,en;q=0.8')
            req.add_header('Accept-Encoding', 'identity')  # 避免压缩
            req.add_header('Connection', 'keep-alive')
            
            # 发送请求
            with urllib.request.urlopen(req, timeout=10) as response:
                # 读取响应内容
                content = response.read()
                
                # 设置响应头
                self.send_response(200)
                
                # 复制重要的响应头，但排除会阻止iframe的头
                excluded_headers = {
                    'x-frame-options',
                    'content-security-policy',
                    'content-encoding',
                    'transfer-encoding',
                    'connection'
                }
                
                for header, value in response.headers.items():
                    if header.lower() not in excluded_headers:
                        self.send_header(header, value)
                
                # 添加CORS头
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', '*')
                
                # 确保可以被iframe嵌入
                self.send_header('X-Frame-Options', 'ALLOWALL')
                
                self.end_headers()
                
                # 如果是HTML内容，注入链接拦截JavaScript
                if 'text/html' in response.headers.get('content-type', '').lower():
                    content = self.inject_link_interception(content)
                
                # 发送内容
                self.wfile.write(content)
                
        except HTTPError as e:
            self.send_error(e.code, f"HTTP Error: {e.reason}")
        except URLError as e:
            self.send_error(500, f"URL Error: {e.reason}")
        except Exception as e:
            self.send_error(500, f"Proxy Error: {str(e)}")
    
    def inject_link_interception(self, content):
        """在HTML内容中注入链接拦截JavaScript"""
        try:
            # 解码内容
            if isinstance(content, bytes):
                html_content = content.decode('utf-8', errors='ignore')
            else:
                html_content = content
            
            # JavaScript代码用于拦截链接点击
            injection_script = """
<script>
(function() {
    'use strict';
    
    // 等待页面加载完成
    function setupLinkInterception() {
        // 拦截所有链接点击
        document.addEventListener('click', function(event) {
            const target = event.target.closest('a');
            if (target && target.href) {
                // 检查是否是外部链接或需要特殊处理的链接
                const href = target.href;
                
                // 排除一些特殊情况
                if (href.startsWith('javascript:') || 
                    href.startsWith('mailto:') || 
                    href.startsWith('tel:') ||
                    href.startsWith('#')) {
                    return; // 让这些链接正常工作
                }
                
                // 阻止默认行为
                event.preventDefault();
                event.stopPropagation();
                
                // 通过postMessage发送给父窗口
                try {
                    window.parent.postMessage({
                        type: 'linkClick',
                        url: href,
                        text: target.textContent || target.innerText || '',
                        timestamp: Date.now()
                    }, '*');
                    
                    console.log('发送链接点击消息:', href);
                } catch (e) {
                    console.error('发送链接点击消息失败:', e);
                    // 如果postMessage失败，尝试直接导航
                    window.location.href = href;
                }
            }
        }, true);
        
        // 拦截表单提交（如搜索表单）
        document.addEventListener('submit', function(event) {
            const form = event.target;
            if (form && form.action) {
                event.preventDefault();
                
                // 构建表单提交URL
                const formData = new FormData(form);
                const params = new URLSearchParams(formData);
                const method = form.method.toLowerCase();
                
                let submitUrl = form.action;
                if (method === 'get' && params.toString()) {
                    submitUrl += (submitUrl.includes('?') ? '&' : '?') + params.toString();
                }
                
                // 发送给父窗口
                try {
                    window.parent.postMessage({
                        type: 'linkClick',
                        url: submitUrl,
                        text: 'Form Submit',
                        timestamp: Date.now()
                    }, '*');
                    
                    console.log('发送表单提交消息:', submitUrl);
                } catch (e) {
                    console.error('发送表单提交消息失败:', e);
                    window.location.href = submitUrl;
                }
            }
        }, true);
    }
    
    // 如果页面已加载完成，立即设置
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupLinkInterception);
    } else {
        setupLinkInterception();
    }
    
    // 监听动态内容变化
    if (window.MutationObserver) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    // 新增节点可能包含链接，重新设置拦截
                    setupLinkInterception();
                }
            });
        });
        
        observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true
        });
    }
})();
</script>
"""
            
            # 尝试在</head>之前插入，如果没有head标签则在<body>之前插入
            if '</head>' in html_content:
                html_content = html_content.replace('</head>', injection_script + '\n</head>')
            elif '<body>' in html_content:
                html_content = html_content.replace('<body>', injection_script + '\n<body>')
            elif '<html>' in html_content:
                html_content = html_content.replace('<html>', '<html>' + injection_script)
            else:
                # 如果都没有，直接在开头添加
                html_content = injection_script + '\n' + html_content
            
            return html_content.encode('utf-8')
            
        except Exception as e:
            print(f"链接拦截脚本注入失败: {e}")
            return content
    
    def send_proxy_info(self):
        """发送代理服务说明页面"""
        html_content = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebOS 代理服务器</title>
    <style>
        body {
            font-family: 'Microsoft YaHei', Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }
        h1 {
            text-align: center;
            margin-bottom: 30px;
            font-size: 2.5em;
        }
        .status {
            background: rgba(40, 167, 69, 0.2);
            border: 2px solid #28a745;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
            text-align: center;
        }
        .usage {
            background: rgba(23, 162, 184, 0.2);
            border: 2px solid #17a2b8;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
        code {
            background: rgba(0, 0, 0, 0.3);
            padding: 4px 8px;
            border-radius: 4px;
            font-family: monospace;
        }
        .test-links {
            text-align: center;
            margin: 30px 0;
        }
        .test-link {
            background: rgba(255, 255, 255, 0.2);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 25px;
            margin: 10px;
            display: inline-block;
            transition: all 0.3s;
        }
        .test-link:hover {
            background: rgba(255, 255, 255, 0.3);
            transform: translateY(-2px);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔄 WebOS 代理服务器</h1>
        
        <div class="status">
            <h2>✅ 代理服务已启动</h2>
            <p>专门用于绕过X-Frame-Options限制，让WebOS浏览器能够访问百度等网站。</p>
        </div>

        <div class="usage">
            <h3>📖 使用说明</h3>
            <p><strong>代理URL格式：</strong></p>
            <p><code>http://localhost:PORT/proxy?url=目标网址</code></p>
            
            <p><strong>示例：</strong></p>
            <ul>
                <li><code>/proxy?url=https://www.baidu.com</code></li>
                <li><code>/proxy?url=https://www.google.com</code></li>
                <li><code>/proxy?url=www.zhihu.com</code></li>
            </ul>
            
            <p><strong>功能特性：</strong></p>
            <ul>
                <li>🔓 移除X-Frame-Options限制</li>
                <li>🌐 支持HTTPS网站代理</li>
                <li>🛡️ 保持网站原始功能</li>
                <li>⚡ 快速响应和加载</li>
            </ul>
        </div>

        <div class="test-links">
            <h3>🧪 测试链接</h3>
            <a href="/proxy?url=https://www.baidu.com" class="test-link" target="_blank">百度首页</a>
            <a href="/proxy?url=https://www.google.com" class="test-link" target="_blank">Google</a>
            <a href="/proxy?url=https://www.zhihu.com" class="test-link" target="_blank">知乎</a>
        </div>

        <p style="text-align: center; margin-top: 40px;">
            🚀 现在可以在WebOS浏览器中使用代理URL访问任何网站！
        </p>
    </div>
</body>
</html>
        """
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(html_content.encode('utf-8'))
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] {format % args}")

def find_free_port(start_port=9000, max_attempts=100):
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

def main():
    """主函数"""
    print("╔══════════════════════════════════════════════╗")
    print("║           WebOS 代理服务器                   ║")
    print("║        绕过X-Frame-Options限制               ║")
    print("╚══════════════════════════════════════════════╝")
    print()
    
    # 解析命令行参数
    port = 9000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("❌ 无效的端口号")
            sys.exit(1)
    
    # 查找可用端口
    try:
        port = find_free_port(port)
    except Exception as e:
        print(f"❌ 无法找到可用端口: {e}")
        sys.exit(1)
    
    # 启动代理服务器
    try:
        with socketserver.TCPServer(("localhost", port), ProxyRequestHandler) as httpd:
            print(f"🚀 代理服务器已启动！")
            print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            print(f"📍 代理地址: http://localhost:{port}")
            print(f"🌐 百度代理: http://localhost:{port}/proxy?url=https://www.baidu.com")
            print(f"📁 目录: {sys.path[0] if sys.path[0] else '当前目录'}")
            print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            print()
            print("💡 使用说明:")
            print("   • 在WebOS浏览器地址栏输入代理URL")
            print("   • 格式: http://localhost:" + str(port) + "/proxy?url=目标网址")
            print("   • 现在可以访问百度、Google等被限制的网站")
            print("   • 按 Ctrl+C 停止服务器")
            print()
            print("⚡ 代理服务运行中...")
            
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n\n🛑 代理服务器已停止")
        print("👋 感谢使用 WebOS 代理服务!")
    except Exception as e:
        print(f"❌ 服务器错误: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 