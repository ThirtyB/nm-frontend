<template>
  <div class="users-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <span>用户管理</span>
            <el-switch
              v-model="includeInactive"
              active-text="显示所有用户"
              inactive-text="仅显示活跃用户"
              @change="handleIncludeInactiveChange"
              style="margin-left: 20px;"
            />
          </div>
          <el-button type="primary" @click="showCreateDialog">
            <el-icon><Plus /></el-icon>
            新增用户
          </el-button>
        </div>
      </template>
      
      <el-table
        v-loading="userStore.loading"
        :data="userStore.users"
        style="width: 100%"
        stripe
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" min-width="120">
          <template #default="{ row }">
            <span class="username-cell">
              <span :class="{ 'current-username': row.id === currentUserId }">
                {{ row.username }}
              </span>
              <el-tag v-if="row.id === currentUserId" type="warning" size="small" style="margin-left: 8px;">
                自己
              </el-tag>
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" width="130">
          <template #default="{ row }">
            {{ row.phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="user_type" label="用户类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.user_type === 'admin' ? 'danger' : 'primary'">
              {{ row.user_type === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'">
              {{ row.is_active ? '激活' : '停用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column prop="last_login" label="最后登录" width="180">
          <template #default="{ row }">
            {{ formatDate(row.last_login) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="showEditDialog(row)"
              :disabled="row.id === currentUserId"
              :title="row.id === currentUserId ? '不能编辑自己的基本信息' : ''"
            >
              编辑
            </el-button>
            <el-button
              :type="row.is_active ? 'warning' : 'success'"
              size="small"
              @click="toggleUserStatus(row)"
              :disabled="row.id === currentUserId"
              :title="row.id === currentUserId ? '不能停用/激活自己的账户' : ''"
            >
              {{ row.is_active ? '停用' : '激活' }}
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              :disabled="row.id === currentUserId"
              :title="row.id === currentUserId ? '不能删除自己的账户' : ''"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    
    <!-- 创建/编辑用户对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="userForm.username"
            placeholder="请输入用户名"
            :disabled="isEdit"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="userForm.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
          <div class="form-tip" v-if="isEdit">
            留空则不修改密码
          </div>
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="userForm.phone"
            placeholder="请输入手机号（可选）"
            clearable
          />
        </el-form-item>
        
        <el-form-item label="用户类型" prop="user_type">
          <el-select v-model="userForm.user_type" placeholder="请选择用户类型">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        
        <el-form-item v-if="isEdit" label="用户状态" prop="is_active">
          <el-switch
            v-model="userForm.is_active"
            active-text="激活"
            inactive-text="停用"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">
            确定
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { useAuthStore } from '@/stores/auth'

const userStore = useUserStore()
const authStore = useAuthStore()

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const userFormRef = ref()
const includeInactive = ref(true)

// 获取当前登录用户的ID
const currentUserId = computed(() => authStore.user?.id)

const userForm = reactive({
  id: null,
  username: '',
  password: '',
  phone: '',
  user_type: 'user',
  is_active: true
})

const validatePassword = (rule, value, callback) => {
  // 编辑模式下，密码可以为空
  if (isEdit.value && !value) {
    callback()
    return
  }
  
  // 新建模式下，密码不能为空
  if (!isEdit.value && !value) {
    callback(new Error('请输入密码'))
    return
  }
  
  // 密码长度验证
  if (value && value.length < 6) {
    callback(new Error('密码长度至少6位'))
    return
  }
  
  callback()
}

const validatePhone = (rule, value, callback) => {
  // 空值是允许的（手机号是可选字段）
  if (!value || value.trim() === '') {
    callback()
    return
  }
  // 有值时验证格式
  if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的手机号格式'))
  } else {
    callback()
  }
}

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3到20个字符', trigger: 'blur' }
  ],
  password: [
    { validator: validatePassword, trigger: 'blur' }
  ],
  phone: [
    { validator: validatePhone, trigger: 'blur' }
  ],
  user_type: [
    { required: true, message: '请选择用户类型', trigger: 'change' }
  ]
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  return new Date(dateString).toLocaleString('zh-CN')
}

const showCreateDialog = () => {
  isEdit.value = false
  dialogVisible.value = true
  resetForm()
}

const showEditDialog = (user) => {
  isEdit.value = true
  dialogVisible.value = true
  userForm.id = user.id
  userForm.username = user.username
  userForm.password = ''
  // 确保phone字段正确处理，包括null、undefined和空字符串的情况
  userForm.phone = user.phone !== null && user.phone !== undefined ? user.phone : ''
  userForm.user_type = user.user_type || 'user'
  userForm.is_active = user.is_active !== undefined ? user.is_active : true
}

const resetForm = () => {
  userForm.id = null
  userForm.username = ''
  userForm.password = ''
  userForm.phone = ''
  userForm.user_type = 'user'
  userForm.is_active = true
  if (userFormRef.value) {
    userFormRef.value.resetFields()
  }
}

const handleSubmit = async () => {
  if (!userFormRef.value) return
  
  try {
    await userFormRef.value.validate()
    submitting.value = true
    
    let result
    if (isEdit.value) {
      const updateData = {
        username: userForm.username,
        user_type: userForm.user_type,
        is_active: userForm.is_active
      }
      if (userForm.password) {
        updateData.password = userForm.password
      }
      // 明确发送phone字段，包括空字符串，以便后端能正确处理清空电话号码
      // 去除首尾空格，如果为空则发送空字符串
      updateData.phone = userForm.phone ? userForm.phone.trim() : ''
      result = await userStore.updateUser(userForm.id, updateData)
    } else {
      result = await userStore.createUser({
        username: userForm.username,
        password: userForm.password,
        phone: userForm.phone,
        user_type: userForm.user_type
      })
    }
    
    if (result.success) {
      ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
      dialogVisible.value = false
      await userStore.fetchUsers()
    } else {
      ElMessage.error(result.message)
    }
  } catch (error) {
    // 表单验证失败，静默处理
  } finally {
    submitting.value = false
  }
}

const handleIncludeInactiveChange = async () => {
  await userStore.fetchUsers(includeInactive.value)
}

const toggleUserStatus = async (user) => {
  try {
    const action = user.is_active ? '停用' : '激活'
    await ElMessageBox.confirm(
      `确定要${action}用户 "${user.username}" 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    let result
    if (user.is_active) {
      result = await userStore.deactivateUser(user.id)
    } else {
      result = await userStore.activateUser(user.id)
    }
    
    if (result.success) {
      ElMessage.success(`${action}成功`)
      // 刷新用户列表以保持当前筛选状态
      await userStore.fetchUsers(includeInactive.value)
    } else {
      ElMessage.error(result.message)
    }
  } catch {
    // 用户取消
  }
}

const handleDelete = async (user) => {
  try {
    await ElMessageBox.confirm(
      `确定要彻底删除用户 "${user.username}" 吗？此操作不可恢复！`,
      '警告',
      {
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
        type: 'error'
      }
    )
    
    const result = await userStore.deleteUser(user.id)
    if (result.success) {
      ElMessage.success('用户已删除')
      // 刷新用户列表以保持当前筛选状态
      await userStore.fetchUsers(includeInactive.value)
    } else {
      ElMessage.error(result.message)
    }
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  userStore.fetchUsers(includeInactive.value)
})
</script>

<style scoped>
.users-management {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.header-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.username-cell {
  display: flex;
  align-items: center;
}

.current-username {
  color: #ff8c00;
  font-weight: 600;
}
</style>