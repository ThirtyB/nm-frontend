<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <h3>个人信息</h3>
          <p>管理您的个人资料信息</p>
        </div>
      </template>

      <el-form
        ref="profileFormRef"
        :model="profileForm"
        :rules="rules"
        label-width="100px"
        class="profile-form"
      >
        <el-form-item label="用户名">
          <el-input
            v-model="profileForm.username"
            disabled
            :prefix-icon="User"
          />
          <div class="form-tip">用户名不可修改</div>
        </el-form-item>

        <el-form-item label="用户类型">
          <el-input
            v-model="userTypeText"
            disabled
            :prefix-icon="UserFilled"
          />
        </el-form-item>

        <el-form-item label="手机号" prop="phone">
          <div class="phone-input-group">
            <el-input
              v-model="profileForm.phone"
              placeholder="请输入手机号"
              :prefix-icon="Phone"
              clearable
            />
            <div class="phone-actions">
              <el-button
                v-if="profileForm.phone"
                type="danger"
                size="small"
                @click="handleDeletePhone"
              >
                删除
              </el-button>
            </div>
          </div>
          <div class="form-tip">手机号为可选项目，可用于找回密码等功能</div>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="loading"
            @click="handleUpdateProfile"
          >
            保存修改
          </el-button>
          <el-button @click="handleReset">
            重置
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, UserFilled, Phone } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import api from '@/utils/api'

const authStore = useAuthStore()
const profileFormRef = ref()
const loading = ref(false)

const profileForm = reactive({
  username: '',
  phone: ''
})

const userTypeText = computed(() => {
  return authStore.user?.user_type === 'admin' ? '管理员' : '普通用户'
})

const validatePhone = (rule, value, callback) => {
  if (value && !/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的手机号格式'))
  } else {
    callback()
  }
}

const rules = {
  phone: [
    { validator: validatePhone, trigger: 'blur' }
  ]
}

const fetchProfile = async () => {
  try {
    const response = await api.get('/profile/me')
    profileForm.username = response.data.username
    profileForm.phone = response.data.phone || ''
  } catch (error) {
    ElMessage.error('获取个人信息失败')
  }
}

const handleUpdateProfile = async () => {
  if (!profileFormRef.value) return
  
  try {
    await profileFormRef.value.validate()
    loading.value = true
    
    const response = await api.put('/profile/phone', {
      phone: profileForm.phone
    })
    
    ElMessage.success('手机号更新成功')
    // 更新本地用户信息
    await authStore.fetchUserInfo()
  } catch (error) {
    if (error.response?.data?.detail) {
      ElMessage.error(error.response.data.detail)
    } else {
      ElMessage.error('更新失败')
    }
  } finally {
    loading.value = false
  }
}

const handleDeletePhone = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要删除手机号吗？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    loading.value = true
    await api.delete('/profile/phone')
    profileForm.phone = ''
    ElMessage.success('手机号删除成功')
    // 更新本地用户信息
    await authStore.fetchUserInfo()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  } finally {
    loading.value = false
  }
}

const handleReset = () => {
  fetchProfile()
}

onMounted(() => {
  if (authStore.user) {
    profileForm.username = authStore.user.username
    profileForm.phone = authStore.user.phone || ''
  }
  fetchProfile()
})
</script>

<style scoped>
.profile-container {
  max-width: 600px;
  margin: 0 auto;
}

.profile-card {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
}

.card-header {
  text-align: center;
  color: #333;
  margin-bottom: 20px;
}

.card-header h3 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 20px;
  font-weight: 600;
}

.card-header p {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.profile-form {
  padding: 0 20px;
}

.phone-input-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.phone-input-group .el-input {
  flex: 1;
}

.phone-actions {
  display: flex;
  gap: 8px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.4;
}

:deep(.el-form-item__content) {
  flex-wrap: wrap;
}

:deep(.el-input.is-disabled .el-input__inner) {
  background-color: #f5f7fa;
  color: #909399;
}
</style>