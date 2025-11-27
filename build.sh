#!/bin/bash

# 构建和部署脚本

set -e

echo "开始构建Docker镜像..."

# 设置镜像名称和标签
IMAGE_NAME="nodemonitor-frontend"
TAG=${1:-latest}

# 构建镜像
docker build -t ${IMAGE_NAME}:${TAG} .

echo "镜像构建完成: ${IMAGE_NAME}:${TAG}"

# 可选：运行容器进行测试
if [ "$2" = "test" ]; then
    echo "启动测试容器..."
    docker run -d -p 8080:80 --name ${IMAGE_NAME}-test ${IMAGE_NAME}:${TAG}
    
    echo "等待容器启动..."
    sleep 5
    
    echo "测试访问 http://localhost:8080"
    echo "查看容器日志: docker logs ${IMAGE_NAME}-test"
    echo "停止测试容器: docker stop ${IMAGE_NAME}-test && docker rm ${IMAGE_NAME}-test"
fi

echo "构建脚本执行完成！"