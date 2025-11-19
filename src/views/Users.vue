<template>
  <div class="users-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
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
        <el-table-column prop="username" label="用户名" min-width="120" />
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
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              @click="showEditDialog(row)"
            >
              编辑
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(row)"
              :disabled="!row.is_active"
            >
              删除用户
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
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const userFormRef = ref()

const userForm = reactive({
  id: null,
  username: '',
  password: '',
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

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在3到20个字符', trigger: 'blur' }
  ],
  password: [
    { validator: validatePassword, trigger: 'blur' }
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
  userForm.user_type = user.user_type || 'user'
  userForm.is_active = user.is_active !== undefined ? user.is_active : true
}

const resetForm = () => {
  userForm.id = null
  userForm.username = ''
  userForm.password = ''
  userForm.user_type = 'user'
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
      result = await userStore.updateUser(userForm.id, updateData)
    } else {
      result = await userStore.createUser({
        username: userForm.username,
        password: userForm.password,
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
    console.error('表单验证失败:', error)
  } finally {
    submitting.value = false
  }
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
    
    const result = await userStore.updateUser(user.id, {
      is_active: !user.is_active
    })
    
    if (result.success) {
      ElMessage.success(`${action}成功`)
      await userStore.fetchUsers()
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
      `确定要删除用户 "${user.username}" 吗？删除后用户将被停用。`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await userStore.deleteUser(user.id)
    if (result.success) {
      ElMessage.success('用户已停用')
      await userStore.fetchUsers()
    } else {
      ElMessage.error(result.message)
    }
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  userStore.fetchUsers()
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
</style>