@echo off
chcp 65001 >nul 2>&1
title 🎨 作品集网站
setlocal enabledelayedexpansion

echo.
echo   ╔══════════════════════════════════════════════╗
echo   ║          🎨 我的作品集网站                      ║
echo   ╚══════════════════════════════════════════════╝
echo.

:: ===== 1. Start server =====
echo [1/3] 启动本地服务器...

curl -s http://localhost:3001/api/health >nul 2>&1
if %errorlevel%==0 (
    echo       ✅ 服务器已在运行
) else (
    start "作品集服务器" /min cmd /c "cd /d C:\Users\test\portfolio\server && node index.js"
    :wait_server
    timeout /t 1 /nobreak >nul
    curl -s http://localhost:3001/api/health >nul 2>&1
    if errorlevel 1 goto wait_server
    echo       ✅ 服务器已启动
)

:: ===== 2. Start Cloudflare Tunnel =====
echo [2/3] 建立公网隧道...

:: Kill old tunnel if exists
taskkill /fi "WINDOWTITLE eq 作品集隧道*" /f >nul 2>&1

:: Start cloudflared tunnel
if exist "tunnel_url.txt" del "tunnel_url.txt" >nul 2>&1
start "作品集隧道" /min cmd /c "C:\Users\test\portfolio\cloudflared.exe tunnel --url http://localhost:3001 > C:\Users\test\portfolio\tunnel_log.txt 2>&1"

:: Wait for tunnel URL
echo       ⏳ 等待公网地址...
set CF_URL=
:wait_tunnel
timeout /t 2 /nobreak >nul
for /f "tokens=2 delims= " %%a in ('findstr /c:"https://" C:\Users\test\portfolio\tunnel_log.txt 2^>nul ^| findstr /c:"trycloudflare.com"') do set CF_URL=%%a
if "!CF_URL!"=="" goto wait_tunnel

echo       ✅ 公网隧道已建立

:: ===== 3. Open browser =====
echo [3/3] 启动完成!
echo.
echo   ╔══════════════════════════════════════════════════╗
echo   ║  🌐 公网访问地址 (任意设备都能访问)                ║
echo   ╠══════════════════════════════════════════════════╣
echo   ║                                                  ║
echo   ║   !CF_URL!                  ║
echo   ║                                                  ║
echo   ╚══════════════════════════════════════════════════╝
echo.
echo   📖 作品展示 : !CF_URL!
echo   🔐 后台管理 : !CF_URL!/login
echo   👤 账号密码 : admin / admin123
echo.
echo   ⚠️  关闭本窗口将断开公网连接
echo.

:: Open browser
start "" "!CF_URL!"

echo   按回车键断开连接并退出...
pause >nul

:: Cleanup
taskkill /fi "WINDOWTITLE eq 作品集隧道*" /f >nul 2>&1
taskkill /fi "WINDOWTITLE eq 作品集服务器*" /f >nul 2>&1
del "tunnel_log.txt" >nul 2>&1
echo   已关闭所有服务，再见！
timeout /t 2 >nul
