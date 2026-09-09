@echo off
title Hackyon - LM Studio Bridge
cd /d "%~dp0"
echo.
echo ==========================================
echo   Hackyon / Techis - LM Studio Bridge
echo ==========================================
echo.
echo Model: gemma-4-e2b-it-qat
echo LM Studio: http://127.0.0.1:8160
echo Bridge:    http://127.0.0.1:8000
echo.
echo Keep this window open.
echo Then open another CMD and run:
echo   cloudflared tunnel --url http://127.0.0.1:8000
echo.
python server.py
pause
