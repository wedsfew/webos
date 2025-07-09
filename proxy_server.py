#!/usr/bin/env python3
"""
Web桌面系统 - 代理服务器
用于转发网页请求，解决CORS和iframe限制问题
"""

import http.server
import socketserver
import urllib.request
import urllib.parse
import urllib.error
import json
import re
from urllib.parse import urlparse, urljoin
import ssl
import socket

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # 忽略SSL证书验证（仅用于开发环境）
        ssl._create_default_https_context = ssl._create_unverified_context
        super().__init__(*args, **kwargs)
    
    def do_GET(self):
        """处理GET请求"""
        if self.path.startswith('/proxy?'):
            self.handle_proxy_request()
        elif self.path == '/':
            self.serve_proxy_info()
        else:
            self.send_error(404, "Not Found")
    
    def do_HEAD(self):
        """处理HEAD请求"""
        if self.path == '/':
            self.send_cors_headers()
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
        else:
            self.send_error(404, "Not Found")
    
    def do_POST(self):
        """处理POST请求"""
        if self.path.startswith('/proxy'):
            self.handle_proxy_request()
        else:
            self.send_error(404, "Not Found")
    
    def do_OPTIONS(self):
        """处理OPTIONS请求（CORS预检）"""
        self.send_cors_headers()
        self.send_response(200)
        self.end_headers()
    
    def handle_proxy_request(self):
        """处理代理请求"""
        try:
            # 解析目标URL
            parsed_path = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_path.query)
            
            if 'url' not in query_params:
                self.send_error(400, "Missing 'url' parameter")
                return
            
            target_url = query_params['url'][0]
            
            # 验证URL格式
            if not self.is_valid_url(target_url):
                self.send_error(400, "Invalid URL format")
                return
            
            # 获取目标网页内容
            content, content_type = self.fetch_url(target_url)
            
            if content is None:
                self.send_error(502, "Failed to fetch target URL")
                return
            
            # 处理HTML内容，修复相对路径
            if content_type and 'text/html' in content_type:
                content = self.process_html_content(content, target_url)
            
            # 发送响应
            self.send_cors_headers()
            self.send_response(200)
            self.send_header('Content-Type', content_type or 'text/html; charset=utf-8')
            self.send_header('Content-Length', str(len(content)))
            self.end_headers()
            
            if isinstance(content, str):
                self.wfile.write(content.encode('utf-8'))
            else:
                self.wfile.write(content)
                
        except Exception as e:
            print(f"代理请求处理错误: {e}")
            self.send_error(500, f"Proxy Error: {str(e)}")
    
    def fetch_url(self, url):
        """获取目标URL的内容"""
        try:
            # 创建请求
            request = urllib.request.Request(url)
            
            # 设置用户代理，模拟真实浏览器
            request.add_header('User-Agent', 
                'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
            request.add_header('Accept', 
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
            request.add_header('Accept-Language', 'zh-CN,zh;q=0.9,en;q=0.8')
            request.add_header('Accept-Encoding', 'gzip, deflate')
            request.add_header('DNT', '1')
            request.add_header('Connection', 'keep-alive')
            request.add_header('Upgrade-Insecure-Requests', '1')
            
            # 发送请求
            with urllib.request.urlopen(request, timeout=30) as response:
                content_type = response.getheader('Content-Type', 'text/html')
                content = response.read()
                
                # 如果是文本内容，尝试解码
                if content_type and 'text/' in content_type:
                    try:
                        # 尝试不同的编码
                        for encoding in ['utf-8', 'gbk', 'gb2312', 'big5']:
                            try:
                                decoded_content = content.decode(encoding)
                                return decoded_content, content_type
                            except UnicodeDecodeError:
                                continue
                        # 如果都失败，使用错误处理
                        return content.decode('utf-8', errors='replace'), content_type
                    except:
                        return content.decode('utf-8', errors='replace'), content_type
                
                return content, content_type
                
        except urllib.error.HTTPError as e:
            print(f"HTTP错误 {e.code}: {e.reason}")
            return None, None
        except urllib.error.URLError as e:
            print(f"URL错误: {e.reason}")
            return None, None
        except socket.timeout:
            print("请求超时")
            return None, None
        except Exception as e:
            print(f"获取URL内容失败: {e}")
            return None, None
    
    def process_html_content(self, content, base_url):
        """处理HTML内容，修复相对路径并注入代理功能"""
        try:
            # 修复相对URL为绝对URL
            content = self.fix_relative_urls(content, base_url)
            
            # 注入代理功能的JavaScript
            proxy_script = f"""
            <script>
            // Web桌面系统代理功能
            (function() {{
                const originalOpen = XMLHttpRequest.prototype.open;
                const originalFetch = window.fetch;
                const baseUrl = '{base_url}';
                const proxyUrl = 'http://localhost:9999/proxy?url=';
                
                // 拦截XMLHttpRequest
                XMLHttpRequest.prototype.open = function(method, url, ...args) {{
                    if (url && !url.startsWith('data:') && !url.startsWith('blob:')) {{
                        url = makeAbsoluteUrl(url, baseUrl);
                        if (!url.startsWith('http://localhost:9999')) {{
                            url = proxyUrl + encodeURIComponent(url);
                        }}
                    }}
                    return originalOpen.call(this, method, url, ...args);
                }};
                
                // 拦截fetch
                window.fetch = function(url, ...args) {{
                    if (url && !url.startsWith('data:') && !url.startsWith('blob:')) {{
                        url = makeAbsoluteUrl(url, baseUrl);
                        if (!url.startsWith('http://localhost:9999')) {{
                            url = proxyUrl + encodeURIComponent(url);
                        }}
                    }}
                    return originalFetch.call(this, url, ...args);
                }};
                
                // 工具函数：将相对URL转换为绝对URL
                function makeAbsoluteUrl(url, base) {{
                    if (url.startsWith('http') || url.startsWith('//')) {{
                        return url;
                    }}
                    try {{
                        return new URL(url, base).href;
                    }} catch {{
                        return url;
                    }}
                }}
                
                // 拦截链接点击，通过代理打开
                document.addEventListener('click', function(e) {{
                    const link = e.target.closest('a');
                    if (link && link.href && !link.href.startsWith('javascript:') && !link.href.startsWith('#')) {{
                        e.preventDefault();
                        const absoluteUrl = makeAbsoluteUrl(link.href, baseUrl);
                        if (window.parent && window.parent !== window) {{
                            window.parent.postMessage({{
                                type: 'navigate',
                                url: absoluteUrl
                            }}, '*');
                        }} else {{
                            window.location.href = proxyUrl + encodeURIComponent(absoluteUrl);
                        }}
                    }}
                }}, true);
                
                // 拦截表单提交
                document.addEventListener('submit', function(e) {{
                    const form = e.target;
                    if (form.action && !form.action.startsWith('javascript:')) {{
                        const absoluteUrl = makeAbsoluteUrl(form.action, baseUrl);
                        form.action = proxyUrl + encodeURIComponent(absoluteUrl);
                    }}
                }}, true);
            }})();
            </script>
            """
            
            # 在</head>前插入代理脚本
            if '</head>' in content:
                content = content.replace('</head>', proxy_script + '</head>')
            elif '<html>' in content:
                content = content.replace('<html>', '<html>' + proxy_script)
            else:
                content = proxy_script + content
            
            return content
            
        except Exception as e:
            print(f"处理HTML内容失败: {e}")
            return content
    
    def fix_relative_urls(self, content, base_url):
        """修复HTML中的相对URL"""
        try:
            parsed_base = urlparse(base_url)
            base_domain = f"{parsed_base.scheme}://{parsed_base.netloc}"
            
            # 修复各种资源的相对路径
            patterns = [
                (r'href="(?!http|//|#|javascript:)([^"]*)"', 'href'),
                (r"href='(?!http|//|#|javascript:)([^']*)'", 'href'),
                (r'src="(?!http|//|data:|javascript:)([^"]*)"', 'src'),
                (r"src='(?!http|//|data:|javascript:)([^']*)'", 'src'),
                (r'action="(?!http|//|#|javascript:)([^"]*)"', 'action'),
                (r"action='(?!http|//|#|javascript:)([^']*)'", 'action'),
            ]
            
            for pattern, attr in patterns:
                def replace_func(match):
                    relative_url = match.group(1)
                    if relative_url.startswith('/'):
                        absolute_url = base_domain + relative_url
                    else:
                        absolute_url = urljoin(base_url, relative_url)
                    return f'{attr}="{absolute_url}"'
                
                content = re.sub(pattern, replace_func, content)
            
            return content
            
        except Exception as e:
            print(f"修复相对URL失败: {e}")
            return content
    
    def is_valid_url(self, url):
        """验证URL格式"""
        try:
            result = urlparse(url)
            return all([result.scheme, result.netloc])
        except:
            return False
    
    def send_cors_headers(self):
        """发送CORS头部"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Access-Control-Max-Age', '86400')
    
    def serve_proxy_info(self):
        """提供代理服务器信息页面"""
        info_html = """
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <title>Web桌面系统代理服务器</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 50px; }
                .container { max-width: 600px; margin: 0 auto; }
                .status { color: #28a745; font-weight: bold; }
                code { background: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Web桌面系统代理服务器</h1>
                <p class="status">✅ 代理服务器运行正常</p>
                <h2>使用方法</h2>
                <p>通过以下URL格式访问代理内容：</p>
                <code>http://localhost:9999/proxy?url=目标网址</code>
                <h2>功能特性</h2>
                <ul>
                    <li>✅ 解决CORS跨域问题</li>
                    <li>✅ 修复相对路径链接</li>
                    <li>✅ 支持多种字符编码</li>
                    <li>✅ 自动处理链接跳转</li>
                    <li>✅ 表单提交代理</li>
                </ul>
            </div>
        </body>
        </html>
        """
        
        self.send_cors_headers()
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(info_html.encode('utf-8'))
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        print(f"[代理服务器] {format % args}")

def start_proxy_server(port=9999):
    """启动代理服务器"""
    try:
        with socketserver.TCPServer(("", port), ProxyHandler) as httpd:
            print(f"🚀 Web桌面系统代理服务器启动成功!")
            print(f"📡 监听端口: {port}")
            print(f"🌐 访问地址: http://localhost:{port}")
            print(f"📋 使用方法: http://localhost:{port}/proxy?url=目标网址")
            print("=" * 50)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n代理服务器已停止")
    except Exception as e:
        print(f"启动代理服务器失败: {e}")

if __name__ == "__main__":
    start_proxy_server(9999) 