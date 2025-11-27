@echo off
REM 构建和部署脚本 - Windows版本

echo 开始构建Docker镜像...

REM 设置镜像名称和标签
set IMAGE_NAME=nodemonitor-frontend
set TAG=%1
if "%TAG%"=="" set TAG=latest

REM 构建镜像
docker build -t %IMAGE_NAME%:%TAG% .

echo 镜像构建完成: %IMAGE_NAME%:%TAG%

REM 可选：运行容器进行测试
if "%2"=="test" (
    echo 启动测试容器...
    docker run -d -p 8080:80 --name %IMAGE_NAME%-test %IMAGE_NAME%:%TAG%
    
    echo 等待容器启动...
    timeout /t 5 /nobreak >nul
    
    echo 测试访问 http://localhost:8080
    echo 查看容器日志: docker logs %IMAGE_NAME%-test
    echo 停止测试容器: docker stop %IMAGE_NAME%-test ^&^& docker rm %IMAGE_NAME%-test
)

echo 构建脚本执行完成！
pause