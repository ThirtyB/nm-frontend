# Docker 部署指南

## 项目概述
这是一个基于Vue 3 + Vite + Element Plus的前端项目，使用Docker进行容器化部署。

## 文件说明

- `Dockerfile`: 多阶段构建配置，使用pnpm构建，nginx alpine作为运行环境
- `nginx.conf`: Nginx配置文件，支持Vue Router的history模式和API代理
- `.dockerignore`: Docker构建忽略文件
- `docker-compose.yml`: Docker Compose配置文件
- `build.sh`: Linux构建脚本
- `build.bat`: Windows构建脚本

## 快速开始

### 1. 构建镜像

#### Linux/Mac:
```bash
chmod +x build.sh
./build.sh
```

#### Windows:
```cmd
build.bat
```

#### 手动构建:
```bash
docker build -t nodemonitor-frontend:latest .
```

### 2. 运行容器

#### 简单运行:
```bash
docker run -d -p 8080:80 --name nodemonitor-frontend nodemonitor-frontend:latest
```

#### 使用Docker Compose:
```bash
docker-compose up -d
```

### 3. 访问应用
打开浏览器访问: http://localhost:8080

## 构建参数

### 指定标签:
```bash
# Linux/Mac
./build.sh v1.0.0

# Windows
build.bat v1.0.0

# 手动
docker build -t nodemonitor-frontend:v1.0.0 .
```

### 测试构建:
```bash
# Linux/Mac
./build.sh latest test

# Windows
build.bat latest test
```

## 配置说明

### Nginx配置
- 支持Vue Router的history模式
- 启用Gzip压缩
- 静态资源缓存优化
- API代理配置（/api路径）
- 安全头设置

### 环境变量
项目支持通过环境变量进行配置，参考`.env.example`文件。

## 生产部署建议

### 1. 使用健康检查
```bash
docker run -d \
  --name nodemonitor-frontend \
  -p 80:80 \
  --health-cmd="curl -f http://localhost/ || exit 1" \
  --health-interval=30s \
  --health-timeout=10s \
  --health-retries=3 \
  nodemonitor-frontend:latest
```

### 2. 使用外部配置
```bash
docker run -d \
  --name nodemonitor-frontend \
  -p 80:80 \
  -v /path/to/custom/nginx.conf:/etc/nginx/nginx.conf:ro \
  nodemonitor-frontend:latest
```

### 3. 使用Docker Compose生产配置
```yaml
version: '3.8'
services:
  frontend:
    image: nodemonitor-frontend:latest
    ports:
      - "80:80"
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
```

## 故障排除

### 1. 查看容器日志
```bash
docker logs nodemonitor-frontend
```

### 2. 进入容器调试
```bash
docker exec -it nodemonitor-frontend sh
```

### 3. 检查构建过程
```bash
docker build --no-cache --progress=plain -t nodemonitor-frontend:latest .
```

## 注意事项

1. 确保Docker版本 >= 20.0
2. 构建前确保项目依赖完整（有pnpm-lock.yaml）
3. 生产环境建议使用具体的版本标签而非latest
4. 如需修改API代理地址，请编辑nginx.conf文件

## 镜像大小优化

- 使用多阶段构建减少最终镜像大小
- 使用alpine基础镜像
- 通过.dockerignore排除不必要的文件
- 启用nginx的gzip压缩

最终镜像大小约为: 50-80MB（取决于依赖大小）