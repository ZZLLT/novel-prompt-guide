@echo off
chcp 65001 >nul
setlocal

set "ROOT=%~dp0"
set "APP_URL=http://127.0.0.1:5890/"
cd /d "%ROOT%"
title Novel Prompt Guide

echo.
echo ========================================
echo  Novel Prompt Guide
echo ========================================
echo.

where python >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Python was not found. Install Python 3.10+ or add it to PATH.
  echo.
  pause
  exit /b 1
)

if not exist "web\dist\index.html" (
  echo [SETUP] Building the web interface...
  where npm >nul 2>nul
  if errorlevel 1 (
    echo [ERROR] npm was not found. Install Node.js first.
    echo.
    pause
    exit /b 1
  )

  if not exist "node_modules" (
    echo [SETUP] Installing frontend dependencies...
    call npm install
    if errorlevel 1 (
      echo [ERROR] npm install failed.
      echo.
      pause
      exit /b 1
    )
  )

  call npm run build
  if errorlevel 1 (
    echo [ERROR] Web build failed.
    echo.
    pause
    exit /b 1
  )
)

echo [START] Opening %APP_URL%
echo [INFO] Keep this window open while using the app.
echo.

start "" powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Sleep -Seconds 2; Start-Process '%APP_URL%'"
python server.py

echo.
echo [STOPPED] Server exited.
pause
