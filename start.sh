#!/bin/bash
# Web桌面系统一键启动脚本
# 启动前自动清理端口，确保无需root权限

WEB_PORT=8089
PROXY_PORT=9999
WEB_CMD="python3 -m http.server $WEB_PORT"
PROXY_CMD="python3 simple_proxy.py"

# 1. 杀死占用端口的进程
function kill_port() {
  local port=$1
  pid=$(lsof -ti :$port)
  if [ ! -z "$pid" ]; then
    echo "[INFO] 端口 $port 被进程 $pid 占用，正在杀死..."
    kill -9 $pid
  fi
}

echo "=================================================="
echo "🚀 Web桌面系统一键启动器"
echo "=================================================="
echo "[1/4] 检查并清理端口..."
kill_port $WEB_PORT
kill_port $PROXY_PORT
sleep 1

echo "[2/4] 启动Web服务器 ($WEB_PORT)..."
nohup $WEB_CMD > web_server.log 2>&1 &
sleep 1

echo "[3/4] 启动代理服务器 ($PROXY_PORT)..."
nohup $PROXY_CMD > proxy_server.log 2>&1 &
sleep 2

# 检查服务状态
function check_service() {
  local url=$1
  local keyword=$2
  local name=$3
  if curl -s "$url" | grep -q "$keyword"; then
    echo "[OK] $name 启动成功: $url"
  else
    echo "[FAIL] $name 启动失败，请检查日志。"
  fi
}

echo "[4/4] 检查服务状态..."
check_service "http://localhost:$WEB_PORT" "Web桌面系统" "Web服务器"
check_service "http://localhost:$PROXY_PORT" "Web桌面代理服务器" "代理服务器"

echo "=================================================="
echo "🌐 访问桌面系统: http://localhost:$WEB_PORT"
echo "🛡️  代理服务器: http://localhost:$PROXY_PORT"
echo "=================================================="
echo "1. 打开浏览器访问 http://localhost:$WEB_PORT"
echo "2. 点击桌面上的浏览器图标，体验完整代理功能"
echo "3. 关闭服务请手动 kill 进程或关闭终端窗口"
echo "==================================================" 