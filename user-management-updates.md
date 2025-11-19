# 用户管理功能更新

## 问题修复

### 1. 用户权限修改问题
- **问题**：修改用户权限没有成功
- **原因**：使用PUT接口而不是PATCH接口
- **解决**：改用PATCH接口进行部分更新

### 2. 左上角权限提示
- **问题**：没有显示当前用户权限
- **解决**：在左上角添加权限标签

## 新增功能

### 1. 用户状态管理
- **新增字段**：`is_active` (用户状态)
- **新增操作**：激活/停用用户
- **界面显示**：状态列和操作按钮

### 2. 权限可视化
- **位置**：左上角面包屑导航前
- **样式**：带图标的标签
- **区分**：管理员(红色) / 普通用户(蓝色)

## 后端接口更新

### 新增接口
- `PATCH /users/{user_id}` - 部分更新用户信息
- `GET /auth/me` - 获取当前用户信息

### 新增字段
- `is_active` - 用户是否激活
- `include_inactive` - 查询参数，是否包含已停用用户

## 前端修改

### 1. 用户列表 (Users.vue)
```javascript
// 新增状态列
<el-table-column prop="is_active" label="状态" width="100">
  <template #default="{ row }">
    <el-tag :type="row.is_active ? 'success' : 'info'">
      {{ row.is_active ? '激活' : '停用' }}
    </el-tag>
  </template>
</el-table-column>

// 新增状态切换按钮
<el-button
  :type="row.is_active ? 'warning' : 'success'"
  size="small"
  @click="toggleUserStatus(row)"
>
  {{ row.is_active ? '停用' : '激活' }}
</el-button>
```

### 2. 用户编辑表单
```javascript
// 新增状态开关
<el-form-item v-if="isEdit" label="用户状态" prop="is_active">
  <el-switch
    v-model="userForm.is_active"
    active-text="激活"
    inactive-text="停用"
  />
</el-form-item>
```

### 3. 权限提示 (MainLayout.vue)
```javascript
// 左上角权限标签
<div class="user-role-badge">
  <el-tag 
    :type="authStore.user?.user_type === 'admin' ? 'danger' : 'primary'"
    size="large"
    effect="dark"
  >
    <el-icon><User /></el-icon>
    {{ authStore.user?.user_type === 'admin' ? '管理员' : '普通用户' }}
  </el-tag>
</div>
```

### 4. Store更新
```javascript
// 使用PATCH接口进行部分更新
const updateUser = async (userId, userData) => {
  const response = await api.patch(`/users/${userId}`, userData)
  // ...
}
```

## 功能特性

### 1. 状态管理
- ✅ 激活/停用用户
- ✅ 状态可视化显示
- ✅ 批量状态操作

### 2. 权限显示
- ✅ 实时权限提示
- ✅ 美观的标签样式
- ✅ 图标增强识别

### 3. 表单增强
- ✅ 编辑时显示状态开关
- ✅ 新建时默认激活状态
- ✅ 表单验证优化

## 样式优化

### 权限标签样式
```css
.user-role-badge .el-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-weight: 600;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

现在用户管理系统功能更完善，权限管理更直观！