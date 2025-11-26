import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '@/utils/api'

export const useUserStore = defineStore('user', () => {
  const users = ref([])
  const loading = ref(false)

  const fetchUsers = async (includeInactive = false) => {
    loading.value = true
    try {
      const params = includeInactive ? { include_inactive: true } : {}
      const response = await api.get('/users/', { params })
      users.value = response.data
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  const createUser = async (userData) => {
    try {
      const response = await api.post('/users/', userData)
      users.value.push(response.data)
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || '创建用户失败' 
      }
    }
  }

  const updateUser = async (userId, userData) => {
    try {
      // 使用PATCH接口进行部分更新
      const response = await api.patch(`/users/${userId}`, userData)
      const index = users.value.findIndex(user => user.id === userId)
      if (index !== -1) {
        users.value[index] = response.data
      }
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || '更新用户失败' 
      }
    }
  }

  const deactivateUser = async (userId) => {
    try {
      await api.post(`/users/${userId}/deactivate`)
      // 更新本地用户状态为停用
      const index = users.value.findIndex(user => user.id === userId)
      if (index !== -1) {
        users.value[index].is_active = false
      }
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || '停用用户失败' 
      }
    }
  }

  const activateUser = async (userId) => {
    try {
      await api.post(`/users/${userId}/activate`)
      // 更新本地用户状态为激活
      const index = users.value.findIndex(user => user.id === userId)
      if (index !== -1) {
        users.value[index].is_active = true
      }
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || '激活用户失败' 
      }
    }
  }

  const deleteUser = async (userId) => {
    try {
      await api.delete(`/users/${userId}`)
      // 从本地用户列表中移除
      const index = users.value.findIndex(user => user.id === userId)
      if (index !== -1) {
        users.value.splice(index, 1)
      }
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || '删除用户失败' 
      }
    }
  }

  const getUserById = async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`)
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.detail || '获取用户信息失败' 
      }
    }
  }

  return {
    users,
    loading,
    fetchUsers,
    createUser,
    updateUser,
    deactivateUser,
    activateUser,
    deleteUser,
    getUserById
  }
})