import axios from 'axios'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
      config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore()
      authStore.logout()
      // 只在非登录页面时显示过期消息
      if (!window.location.pathname.includes('/login')) {
        ElMessage.error('登录已过期，请重新登录')
        window.location.href = '/login'
      }
    } else if (error.config?.url?.includes('/auth/login')) {
      // 登录接口的错误不在这里处理，由登录页面自己处理
      return Promise.reject(error)
    } else if (error.response?.data?.detail) {
      ElMessage.error(error.response.data.detail)
    } else {
      ElMessage.error('请求失败')
    }
    return Promise.reject(error)
  }
)

export default api