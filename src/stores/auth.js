import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)

  const login = async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials)
      token.value = response.data.access_token
      localStorage.setItem('token', token.value)
      
      // 获取用户信息
      const userInfoResult = await fetchUserInfo()
      if (!userInfoResult) {
        // 如果获取用户信息失败，清除token
        logout()
        return { 
          success: false, 
          message: '获取用户信息失败' 
        }
      }
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || '登录失败' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await api.post('/auth/register', userData)
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || '注册失败' 
      }
    }
  }

  const logout = () => {
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const fetchUserInfo = async () => {
    try {
      const response = await api.get('/auth/me')
      user.value = response.data
      localStorage.setItem('user', JSON.stringify(user.value))
      return true
    } catch (error) {
      console.error('获取用户信息失败:', error)
      // 如果获取失败，清除无效的token
      logout()
      return false
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    register,
    logout,
    fetchUserInfo
  }
})