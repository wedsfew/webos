#!/usr/bin/env python3
"""
简化版Web代理服务器
专门为Web桌面系统提供代理功能
"""

import http.server
import socketserver
import urllib.request
import urllib.parse
import ssl
import re
from urllib.parse import urlparse

# 忽略SSL证书验证
ssl._create_default_https_context = ssl._create_unverified_context

class SimpleProxyHandler(http.server.BaseHTTPRequestHandler):
    
    def do_GET(self):
        """处理GET请求"""
        if self.path.startswith('/proxy?'):
            self.handle_proxy()
        elif self.path == '/':
            self.serve_info()
        else:
            self.send_error(404, "Not Found")
    
    def do_HEAD(self):
        """处理HEAD请求"""
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
    
    def handle_proxy(self):
        """处理代理请求"""
        try:
            # 解析URL参数
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            
            if 'url' not in params:
                self.send_error(400, "Missing URL parameter")
                return
                
            target_url = params['url'][0]
            
            # 获取网页内容
            content = self.fetch_content(target_url)
            
            if content:
                # 修复相对链接
                content = self.fix_links(content, target_url)
                
                # 发送响应
                self.send_response(200)
                self.send_header('Content-Type', 'text/html; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(content.encode('utf-8'))
            else:
                self.send_error(502, "Failed to fetch URL")
                
        except Exception as e:
            print(f"代理错误: {e}")
            self.send_error(500, str(e))
    
    def fetch_content(self, url):
        """获取网页内容"""
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            }
            
            req = urllib.request.Request(url, headers=headers)
            
            with urllib.request.urlopen(req, timeout=10) as response:
                content = response.read()
                
                # 尝试解码
                try:
                    return content.decode('utf-8')
                except:
                    try:
                        return content.decode('gbk')
                    except:
                        return content.decode('utf-8', errors='ignore')
                        
        except Exception as e:
            print(f"获取内容失败: {e}")
            return None
    
    def fix_links(self, content, base_url):
        """修复相对链接"""
        try:
            parsed = urlparse(base_url)
            base_domain = f"{parsed.scheme}://{parsed.netloc}"
            
            # 修复相对路径
            content = re.sub(
                r'href="(/[^"]*)"',
                f'href="{base_domain}\\1"',
                content
            )
            
            content = re.sub(
                r'src="(/[^"]*)"',
                f'src="{base_domain}\\1"',
                content
            )
            
            # 添加代理脚本
            proxy_script = f'''
            <script>
            // 拦截链接点击
            document.addEventListener('click', function(e) {{
                const link = e.target.closest('a');
                if (link && link.href && !link.href.startsWith('#')) {{
                    e.preventDefault();
                    if (window.parent && window.parent !== window) {{
                        window.parent.postMessage({{
                            type: 'navigate',
                            url: link.href
                        }}, '*');
                    }}
                }}
            }});
            </script>
            '''
            
            # 插入脚本
            if '</body>' in content:
                content = content.replace('</body>', proxy_script + '</body>')
            else:
                content += proxy_script
                
            return content
            
        except Exception as e:
            print(f"修复链接失败: {e}")
            return content
    
    def serve_info(self):
        """显示代理信息页面"""
        info_page = '''
        <!DOCTYPE html>
        <html>
        <head>
            <title>Web桌面代理服务器</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 50px; }
                .status { color: green; font-weight: bold; }
            </style>
        </head>
        <body>
            <h1>Web桌面代理服务器</h1>
            <p class="status">✅ 服务器运行正常</p>
            <p>使用方法: <code>/proxy?url=目标网址</code></p>
        </body>
        </html>
        '''
        
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(info_page.encode('utf-8'))
    
    def log_message(self, format, *args):
        """简化日志输出"""
        print(f"[代理] {format % args}")

def start_proxy(port=9999):
    """启动代理服务器"""
    try:
        with socketserver.TCPServer(("", port), SimpleProxyHandler) as server:
            print(f"🛡️  简化代理服务器启动成功!")
            print(f"📡 端口: {port}")
            print(f"🌐 地址: http://localhost:{port}")
            print("=" * 40)
            server.serve_forever()
    except KeyboardInterrupt:
        print("\n代理服务器已停止")
    except Exception as e:
        print(f"启动失败: {e}")

if __name__ == "__main__":
    start_proxy() 