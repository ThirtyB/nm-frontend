# 资源监控系统前端

基于 Vue3 + Element Plus 的资源监控系统前端项目。

## 功能特性

- ✅ 用户登录注册
- ✅ 响应式布局设计
- ✅ 用户管理（管理员权限）
- ✅ 简洁美观的界面
- ✅ 路由权限控制

## 技术栈

- Vue 3
- Vue Router 4
- Pinia
- Element Plus
- Axios
- Vite

## 项目结构

```
src/
├── components/          # 公共组件
├── layout/            # 布局组件
│   └── MainLayout.vue # 主布局
├── router/            # 路由配置
│   └── index.js
├── stores/            # 状态管理
│   ├── auth.js        # 认证状态
│   └── user.js        # 用户管理状态
├── utils/             # 工具函数
│   └── api.js         # API 请求封装
├── views/             # 页面组件
│   ├── Login.vue      # 登录页
│   ├── Register.vue   # 注册页
│   ├── Dashboard.vue  # 仪表盘
│   └── Users.vue      # 用户管理
├── App.vue            # 根组件
└── main.js            # 入口文件
```

## 安装运行

### 1. 安装依赖

```bash
pnpm install
```

### 2. 启动开发服务器

```bash
pnpm dev
```

项目将在 http://localhost:3000 启动（如果端口被占用会自动选择其他端口）

### 3. 构建生产版本

```bash
pnpm build
```

## API 配置

项目默认代理后端 API 到 `http://localhost:8000`，如需修改请编辑 `vite.config.js` 中的 proxy 配置。

## 默认账户

系统初始需要通过注册页面创建第一个管理员账户。

## 权限说明

- **普通用户**: 只能访问仪表盘
- **管理员**: 可以访问用户管理功能，进行用户的增删改查

## 浏览器支持

- Chrome
- Firefox
- Safari
- Edge