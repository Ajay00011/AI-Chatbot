@echo off
echo Stopping Hackyon bridge...
taskkill /F /IM cloudflared.exe >nul 2>&1
echo Cloudflare tunnel stopped.
echo.
pause
