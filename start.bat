@echo off
chcp 65001 >nul 2>&1
title 🎨 作品集网站 - 公网版
setlocal enabledelayedexpansion

echo.
echo   ╔════════════════════════════════════╗
echo   ║     🎨 我的作品集网站              ║
echo   ╚════════════════════════════════════╝
echo.

:: ==========================================
:: 1. Start production server (serves API + frontend on port 3001)
:: ==========================================
echo [1/3] 正在启动服务器...

curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel%==0 (
    echo        ✅ 服务器已在运行
    goto tunnel_start
)

start "作品集服务器" /min cmd /c "cd /d C:\Users\test\portfolio\server && node index.js"

:: Wait for server to be ready
:wait_server
timeout /t 1 /nobreak >nul
curl -s http://localhost:3001/api/health >nul 2>&1
if errorlevel 1 goto wait_server

echo        ✅ 服务器已启动 (端口 3001)

:: ==========================================
:: 2. Start public tunnel
:: ==========================================
:tunnel_start
echo [2/3] 正在建立公网隧道...

:: Kill any existing tunnel
taskkill /fi "WINDOWTITLE eq 作品集隧道*" /f >nul 2>&1

:: Start localtunnel and capture output
start "作品集隧道" /min cmd /c "cd /d C:\Users\test\portfolio && npx localtunnel --port 3001 > tunnel_url.txt 2>&1"

:: Wait for URL to appear in file
if exist tunnel_url.txt del tunnel_url.txt >nul
echo        ⏳ 等待公网地址分配...
:wait_tunnel
timeout /t 2 /nobreak >nul
if not exist tunnel_url.txt goto wait_tunnel

:: Read the URL from the file
set TUNNEL_URL=
:read_url
timeout /t 1 /nobreak >nul
for /f "tokens=3 delims= " %%a in (tunnel_url.txt) do set TUNNEL_URL=%%a
if "!TUNNEL_URL!"=="" goto read_url

echo        ✅ 公网隧道已建立
echo.

:: ==========================================
:: 3. Display info and open browser
:: ==========================================
echo   ╔══════════════════════════════════════════════════╗
echo   ║  🌐 公网访问地址 (手机/任何设备都能打开)         ║
echo   ╠══════════════════════════════════════════════════╣
echo   ║                                                  ║
echo   ║   !TUNNEL_URL!             ║
echo   ║                                                  ║
echo   ╚══════════════════════════════════════════════════╝
echo.
echo   📖 作品展示: !TUNNEL_URL!
echo   🔐 后台管理: !TUNNEL_URL!/login
echo   👤 管理员账号: admin / admin123
echo.
echo   ⚠️  关闭本窗口将断开公网连接
echo   ⚠️  网址每次重启会变化，如需固定网址请告诉我
echo.

:: Open browser
start "" "!TUNNEL_URL!"

echo   按任意键断开连接并退出...
pause >nul

:: Cleanup on exit
taskkill /fi "WINDOWTITLE eq 作品集隧道*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq 作品集服务器*" /f >nul 2>&1
del tunnel_url.txt >nul 2>&1
echo   已关闭所有服务，再见！
timeout /t 2 >nul
