@echo off
REM Novel Prompt Guide - 后端服务器启动脚本

echo ================================
echo Novel Prompt Guide API Server
echo ================================
echo.

REM 检查Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Python，请先安装Python 3.8+
    pause
    exit /b 1
)

REM 检查是否在虚拟环境中
if not defined VIRTUAL_ENV (
    echo [提示] 建议在虚拟环境中运行
    echo.
)

REM 检查依赖
echo [1/3] 检查依赖...
pip show fastapi >nul 2>&1
if errorlevel 1 (
    echo [安装] 正在安装依赖...
    pip install -r server\requirements.txt
    if errorlevel 1 (
        echo [错误] 依赖安装失败
        pause
        exit /b 1
    )
)

REM 检查环境变量
echo [2/3] 检查配置...
if not defined OPENAI_API_KEY (
    echo [警告] 未设置 OPENAI_API_KEY 环境变量
    echo [提示] AI功能将不可用，可以稍后通过Web界面配置
    echo.
)

REM 启动服务器
echo [3/3] 启动服务器...
echo.
echo ====================================
echo 服务器地址: http://127.0.0.1:8000
echo API文档: http://127.0.0.1:8000/docs
echo 前端地址: http://127.0.0.1:5890
echo ====================================
echo.
echo 按 Ctrl+C 停止服务器
echo.

cd server
python main.py

pause
