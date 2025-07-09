#!/usr/bin/env python3
"""
简化版Web代理服务器
专门为Web桌面系统提供代理功能
支持完整的HTTP方法（GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS）
"""

import http.server
import socketserver
import urllib.request
import urllib.parse
import ssl
import re
import json
from urllib.parse import urlparse

# 忽略SSL证书验证
ssl._create_default_https_context = ssl._create_unverified_context

class SimpleProxyHandler(http.server.BaseHTTPRequestHandler):
    
    def do_GET(self):
        """处理GET请求"""
        if self.path.startswith('/proxy?'):
            self.handle_proxy('GET')
        elif self.path == '/':
            self.serve_info()
        else:
            self.send_error(404, "Not Found")
    
    def do_POST(self):
        """处理POST请求"""
        if self.path.startswith('/proxy?'):
            self.handle_proxy('POST')
        else:
            self.send_error(404, "Not Found")
    
    def do_PUT(self):
        """处理PUT请求"""
        if self.path.startswith('/proxy?'):
            self.handle_proxy('PUT')
        else:
            self.send_error(404, "Not Found")
    
    def do_DELETE(self):
        """处理DELETE请求"""
        if self.path.startswith('/proxy?'):
            self.handle_proxy('DELETE')
        else:
            self.send_error(404, "Not Found")
    
    def do_PATCH(self):
        """处理PATCH请求"""
        if self.path.startswith('/proxy?'):
            self.handle_proxy('PATCH')
        else:
            self.send_error(404, "Not Found")
    
    def do_HEAD(self):
        """处理HEAD请求"""
        if self.path.startswith('/proxy?'):
            self.handle_proxy('HEAD')
        else:
            self.send_response(200)
            self.send_header('Content-Type', 'text/html')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
    
    def do_OPTIONS(self):
        """处理OPTIONS请求（CORS预检）"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        self.send_header('Access-Control-Max-Age', '86400')
        self.end_headers()
    
    def handle_proxy(self, method):
        """处理代理请求"""
        try:
            # 解析URL参数
            query = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(query)
            
            if 'url' not in params:
                self.send_error(400, "Missing URL parameter")
                return
                
            target_url = params['url'][0]
            
            # 获取请求体（如果有）
            request_body = None
            if method in ['POST', 'PUT', 'PATCH']:
                content_length = int(self.headers.get('Content-Length', 0))
                if content_length > 0:
                    request_body = self.rfile.read(content_length)
            
            # 获取内容
            result = self.fetch_content(target_url, method, request_body)
            
            if result:
                content, content_type, status_code = result
                
                # 如果是HTML内容，修复相对链接
                if content_type and 'text/html' in content_type and method == 'GET':
                    content = self.fix_links(content, target_url)
                
                # 发送响应
                self.send_response(status_code)
                self.send_header('Content-Type', content_type or 'text/html; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                if method != 'HEAD' and content:
                    if isinstance(content, str):
                        self.wfile.write(content.encode('utf-8'))
                    else:
                        self.wfile.write(content)
            else:
                self.send_error(502, "Failed to fetch URL")
                
        except Exception as e:
            print(f"代理错误: {e}")
            self.send_error(500, str(e))
    
    def fetch_content(self, url, method='GET', data=None):
        """获取网页内容，支持多种HTTP方法"""
        try:
            # 准备请求头
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': '*/*',
                'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive'
            }
            
            # 复制客户端请求头（排除某些头）
            skip_headers = ['host', 'connection', 'content-length', 'transfer-encoding']
            for header_name, header_value in self.headers.items():
                if header_name.lower() not in skip_headers:
                    headers[header_name] = header_value
            
            # 创建请求
            req = urllib.request.Request(url, data=data, headers=headers, method=method)
            
            # 发送请求
            with urllib.request.urlopen(req, timeout=15) as response:
                content = response.read()
                content_type = response.headers.get('Content-Type', '')
                status_code = response.getcode()
                
                # 处理gzip压缩
                if response.headers.get('Content-Encoding') == 'gzip':
                    import gzip
                    content = gzip.decompress(content)
                
                # 如果是文本内容，尝试解码
                if content_type and any(t in content_type.lower() for t in ['text/', 'application/json', 'application/xml']):
                    try:
                        content = content.decode('utf-8')
                    except:
                        try:
                            content = content.decode('gbk')
                        except:
                            try:
                                content = content.decode('gb2312')
                            except:
                                content = content.decode('utf-8', errors='ignore')
                
                return content, content_type, status_code
                        
        except urllib.error.HTTPError as e:
            print(f"HTTP错误 {e.code}: {e.reason}")
            # 返回错误信息
            error_content = f'<html><body><h1>HTTP错误 {e.code}</h1><p>{e.reason}</p></body></html>'
            return error_content, 'text/html; charset=utf-8', e.code
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
            
            // 拦截表单提交
            document.addEventListener('submit', function(e) {{
                const form = e.target;
                if (form.action && !form.action.includes('localhost')) {{
                    e.preventDefault();
                    
                    try {{
                        // 获取表单数据
                        const formData = new FormData(form);
                        const method = form.method || 'GET';
                        const action = form.action;
                        
                        // 转换表单数据为对象
                        const data = {{}};
                        for (const [key, value] of formData.entries()) {{
                            data[key] = value;
                        }}
                        
                        console.log('表单提交拦截:', {{
                            method: method.toUpperCase(),
                            url: action,
                            data: data
                        }});
                        
                        if (window.parent && window.parent !== window) {{
                            window.parent.postMessage({{
                                type: 'submit-form',
                                method: method.toUpperCase(),
                                url: action,
                                data: data
                            }}, '*');
                        }}
                    }} catch (error) {{
                        console.error('表单提交拦截错误:', error);
                        // 如果拦截失败，允许原始提交
                        return true;
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
                .method { color: blue; font-family: monospace; }
                table { border-collapse: collapse; width: 100%; margin: 20px 0; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
            </style>
        </head>
        <body>
            <h1>Web桌面代理服务器</h1>
            <p class="status">✅ 服务器运行正常</p>
            <p>使用方法: <code>/proxy?url=目标网址</code></p>
            
            <h2>支持的HTTP方法</h2>
            <table>
                <tr><th>方法</th><th>说明</th><th>支持状态</th></tr>
                <tr><td class="method">GET</td><td>获取资源</td><td>✅ 支持</td></tr>
                <tr><td class="method">POST</td><td>提交数据</td><td>✅ 支持</td></tr>
                <tr><td class="method">PUT</td><td>更新资源</td><td>✅ 支持</td></tr>
                <tr><td class="method">DELETE</td><td>删除资源</td><td>✅ 支持</td></tr>
                <tr><td class="method">PATCH</td><td>部分更新</td><td>✅ 支持</td></tr>
                <tr><td class="method">HEAD</td><td>获取头部</td><td>✅ 支持</td></tr>
                <tr><td class="method">OPTIONS</td><td>预检请求</td><td>✅ 支持</td></tr>
            </table>
            
            <h2>功能特性</h2>
            <ul>
                <li>📡 支持所有主要HTTP方法</li>
                <li>🔗 自动修复相对链接</li>
                <li>📝 表单提交拦截</li>
                <li>🌐 多字符编码支持</li>
                <li>⚡ gzip压缩支持</li>
                <li>🛡️ CORS跨域支持</li>
            </ul>
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
            print(f"🛡️  增强代理服务器启动成功!")
            print(f"📡 端口: {port}")
            print(f"🌐 地址: http://localhost:{port}")
            print(f"🔧 支持方法: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS")
            print("=" * 50)
            server.serve_forever()
    except KeyboardInterrupt:
        print("\n代理服务器已停止")
    except Exception as e:
        print(f"启动失败: {e}")

if __name__ == "__main__":
    start_proxy() 