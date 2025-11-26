<template>
  <div class="login-container">
    <el-card class="login-card">
      <template #header>
        <div class="card-header">
          <h2>资源监控系统</h2>
          <p>用户登录</p>
        </div>
      </template>
      
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        label-width="80px"
        @submit.prevent="handleLogin"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="请输入用户名"
            :prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="请输入密码"
            :prefix-icon="Lock"
            size="large"
            show-password
            @keyup.enter="handleLogin"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button
            type="primary"
            size="large"
            style="width: 100%"
            :loading="loading"
            @click="handleLogin"
          >
            登录
          </el-button>
        </el-form-item>
        
        <el-form-item>
          <div class="login-footer">
            <span>还没有账号？</span>
            <el-link type="primary" @click="$router.push('/register')">
              立即注册
            </el-link>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const loginFormRef = ref()
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' }
  ]
}

const handleLogin = async () => {
  if (!loginFormRef.value) return
  
  try {
    await loginFormRef.value.validate()
    loading.value = true
    
    const result = await authStore.login(loginForm)
    
    if (result.success) {
      ElMessage({
        message: '登录成功',
        type: 'success',
        duration: 2000
      })
      // 延迟跳转，让用户看到成功消息
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } else {
      // 处理特定的错误消息
      let errorMessage = result.message || '登录失败'
      if (result.message === 'Account is disabled') {
        errorMessage = '账户已被禁用，请联系管理员'
      }
      ElMessage({
        message: errorMessage,
        type: 'error',
        duration: 5000, // 延长显示时间到5秒
        showClose: true
      })
    }
  } catch (error) {
    ElMessage({
      message: '请检查输入信息',
      type: 'warning',
      duration: 3000,
      showClose: true
    })
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.card-header {
  text-align: center;
  color: #333;
}

.card-header h2 {
  margin: 0 0 8px 0;
  color: #2c3e50;
  font-size: 24px;
  font-weight: 600;
}

.card-header p {
  margin: 0;
  color: #7f8c8d;
  font-size: 14px;
}

.login-footer {
  text-align: center;
  color: #666;
  font-size: 14px;
}

.login-footer .el-link {
  margin-left: 8px;
}
</style>