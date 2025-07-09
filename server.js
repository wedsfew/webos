#!/usr/bin/env node

/**
 * WebOS Desktop Server (Node.js)
 * 基于Express的HTTP服务器，用于运行WebOS桌面系统
 * 不需要root权限，适用于PSS环境
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const open = require('open');

const app = express();

// 配置中间件
app.use(cors());
app.use(express.static('.', {
    setHeaders: (res, path) => {
        // 设置正确的MIME类型
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        } else if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (path.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
    }
}));

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({ error: '内部服务器错误' });
});

// 默认路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// 404处理
app.use((req, res) => {
    res.status(404).json({ error: '页面未找到' });
});

/**
 * 查找可用端口
 */
function findAvailablePort(startPort = 8000) {
    return new Promise((resolve, reject) => {
        const net = require('net');
        const server = net.createServer();
        
        server.listen(startPort, () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
        
        server.on('error', () => {
            findAvailablePort(startPort + 1).then(resolve).catch(reject);
        });
    });
}

/**
 * 检查必要文件
 */
function checkRequiredFiles() {
    const requiredFiles = [
        'index.html',
        'styles/desktop.css',
        'js/desktop.js'
    ];
    
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
    
    if (missingFiles.length > 0) {
        console.error('❌ 错误: 缺少必要文件:');
        missingFiles.forEach(file => console.error(`   - ${file}`));
        console.error('\n请确保在WebOS Desktop项目目录中运行此脚本。');
        process.exit(1);
    }
}

/**
 * 打印启动横幅
 */
function printBanner() {
    const banner = `
╔══════════════════════════════════════════════╗
║            WebOS Desktop Server              ║
║        基于Web的桌面操作系统                 ║
║              (Node.js版本)                   ║
╚══════════════════════════════════════════════╝
    `;
    console.log(banner);
}

/**
 * 打印服务器信息
 */
function printInfo(port, host = 'localhost') {
    const url = `http://${host}:${port}`;
    
    console.log(`
🚀 服务器已启动！
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 地址: ${url}
🖥️  桌面: ${url}/index.html
📁 目录: ${process.cwd()}
🔧 环境: Node.js ${process.version}
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
   ✓ Express.js驱动

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

/**
 * 解析命令行参数
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const config = {
        port: 8000,
        host: 'localhost',
        openBrowser: true,
        dev: false
    };
    
    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        
        switch (arg) {
            case '--port':
            case '-p':
                const port = parseInt(args[i + 1]);
                if (!isNaN(port)) {
                    config.port = port;
                    i++; // 跳过下一个参数
                }
                break;
                
            case '--host':
            case '-h':
                if (args[i + 1]) {
                    config.host = args[i + 1];
                    i++; // 跳过下一个参数
                }
                break;
                
            case '--no-browser':
                config.openBrowser = false;
                break;
                
            case '--dev':
                config.dev = true;
                break;
                
            case '--help':
                printHelp();
                process.exit(0);
                break;
        }
    }
    
    return config;
}

/**
 * 打印帮助信息
 */
function printHelp() {
    console.log(`
WebOS Desktop Server - Node.js版本

用法:
  node server.js [选项]

选项:
  --port, -p <端口>     指定端口 (默认: 8000)
  --host, -h <主机>     指定主机 (默认: localhost)
  --no-browser          不自动打开浏览器
  --dev                 开发模式
  --help                显示此帮助信息

示例:
  node server.js                    # 使用默认设置
  node server.js --port 3000        # 使用端口3000
  node server.js --host 0.0.0.0     # 监听所有网络接口
  node server.js --no-browser       # 不自动打开浏览器
  
NPM脚本:
  npm start                         # 启动服务器
  npm run dev                       # 开发模式
  npm run serve                     # 使用端口3000
`);
}

/**
 * 主函数
 */
async function main() {
    try {
        printBanner();
        checkRequiredFiles();
        
        const config = parseArgs();
        
        // 查找可用端口
        let port;
        try {
            port = await findAvailablePort(config.port);
            if (port !== config.port) {
                console.log(`🔄 端口 ${config.port} 不可用，自动选择端口 ${port}`);
            }
        } catch (error) {
            console.error('❌ 无法找到可用端口');
            process.exit(1);
        }
        
        // 启动服务器
        const server = app.listen(port, config.host, () => {
            printInfo(port, config.host);
            
            // 自动打开浏览器
            if (config.openBrowser) {
                const url = `http://${config.host}:${port}`;
                setTimeout(() => {
                    open(url).then(() => {
                        console.log(`✓ 浏览器已打开: ${url}`);
                    }).catch(err => {
                        console.log(`⚠ 无法自动打开浏览器: ${err.message}`);
                        console.log(`请手动访问: ${url}`);
                    });
                }, 1500);
            }
            
            console.log('⚡ 服务器运行中... (按 Ctrl+C 停止)');
        });
        
        // 优雅关闭
        process.on('SIGINT', () => {
            console.log('\n\n🛑 正在关闭服务器...');
            server.close(() => {
                console.log('🛑 服务器已停止');
                console.log('👋 感谢使用 WebOS Desktop!');
                process.exit(0);
            });
        });
        
        // 错误处理
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`❌ 端口 ${port} 已被占用`);
            } else {
                console.error(`❌ 服务器错误: ${err.message}`);
            }
            process.exit(1);
        });
        
    } catch (error) {
        console.error(`❌ 启动失败: ${error.message}`);
        process.exit(1);
    }
}

// 检查是否有Node.js依赖
if (!fs.existsSync('node_modules')) {
    console.log('📦 检测到缺少依赖，请先运行: npm install');
    console.log('\n或者使用Python服务器: python3 server.py');
}

// 运行服务器
if (require.main === module) {
    main();
}

module.exports = app; 