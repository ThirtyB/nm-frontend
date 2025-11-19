@echo off
echo 正在启动资源监控系统前端...
echo.
echo 项目将在 http://localhost:3000 启动
echo 按 Ctrl+C 停止服务器
echo.

cd /d "%~dp0"

REM 检查是否安装了依赖
if not exist "node_modules" (
    echo 正在安装依赖...
    pnpm install
    if errorlevel 1 (
        echo 依赖安装失败，尝试使用 npm...
        npm install
    )
)

echo 启动开发服务器...
pnpm dev

pause