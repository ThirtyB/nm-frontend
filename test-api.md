# 测试API接口

## 1. 测试登录接口
```bash
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "user1", "password": "password123"}'
```

## 2. 测试获取当前用户信息
```bash
# 需要先登录获取token，然后使用token访问
curl -X GET "http://localhost:8000/auth/me" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 3. 测试获取用户列表
```bash
curl -X GET "http://localhost:8000/users/" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 修改说明

### 1. 导航栏修改
- 将"仪表盘"改为"首页"
- 只保留两个导航项：首页和用户管理
- 用户管理仅管理员可见

### 2. 用户信息获取修复
- 添加了 `/auth/me` 接口调用
- 在登录成功后自动获取用户信息
- 在MainLayout组件挂载时检查并获取用户信息
- 如果获取用户信息失败，会自动清除无效token

### 3. 权限控制
- 普通用户只能看到首页
- 管理员可以看到首页和用户管理
- 路由守卫会根据用户权限控制访问

现在前端应用已经正确配置了用户信息获取和权限控制！