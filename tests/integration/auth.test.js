import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// 模拟API
vi.mock('@/utils/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}))

describe('Authentication Integration Tests', () => {
  let authStore

  beforeEach(() => {
    // 创建Pinia
    const pinia = createPinia()
    setActivePinia(pinia)

    // 获取auth store
    authStore = useAuthStore()

    // 清除所有模拟
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('认证状态管理', () => {
    it('应该正确初始化认证状态', () => {
      expect(authStore.isAuthenticated).toBe(false)
      expect(authStore.token).toBe('')
      expect(authStore.user).toBeNull()
    })

    it('应该从localStorage恢复认证状态', () => {
      // 设置localStorage
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify({
        id: 1,
        username: 'testuser'
      }))

      // 重新创建store
      setActivePinia(createPinia())
      const newAuthStore = useAuthStore()

      expect(newAuthStore.token).toBe('test-token')
      expect(newAuthStore.user).toEqual({
        id: 1,
        username: 'testuser'
      })
      expect(newAuthStore.isAuthenticated).toBe(true)
    })
  })

  describe('登录流程', () => {
    it('应该在登录成功时设置认证状态', async () => {
      const { default: api } = await import('@/utils/api')
      
      // 模拟登录API响应
      api.post.mockResolvedValueOnce({
        data: { access_token: 'test-token' }
      })
      
      // 模拟用户信息API响应
      api.get.mockResolvedValueOnce({
        data: { id: 1, username: 'testuser', email: 'test@example.com' }
      })

      const credentials = { username: 'testuser', password: 'password123' }
      const result = await authStore.login(credentials)

      expect(result.success).toBe(true)
      expect(authStore.isAuthenticated).toBe(true)
      expect(authStore.token).toBe('test-token')
      expect(authStore.user).toEqual({
        id: 1,
        username: 'testuser',
        email: 'test@example.com'
      })
    })

    it('应该在登录失败时保持未认证状态', async () => {
      const { default: api } = await import('@/utils/api')
      
      // 模拟登录失败
      api.post.mockRejectedValueOnce({
        response: { data: { detail: '用户名或密码错误' } }
      })

      const credentials = { username: 'wronguser', password: 'wrongpassword' }
      const result = await authStore.login(credentials)

      expect(result.success).toBe(false)
      expect(result.message).toBe('用户名或密码错误')
      expect(authStore.isAuthenticated).toBe(false)
      expect(authStore.token).toBe('')
      expect(authStore.user).toBeNull()
    })
  })

  describe('登出流程', () => {
    it('应该正确清除认证状态', () => {
      // 设置已登录状态
      authStore.token = 'test-token'
      authStore.user = { id: 1, username: 'testuser' }
      localStorage.setItem('token', 'test-token')
      localStorage.setItem('user', JSON.stringify(authStore.user))

      // 执行登出
      authStore.logout()

      // 验证认证状态已清除
      expect(authStore.isAuthenticated).toBe(false)
      expect(authStore.token).toBe('')
      expect(authStore.user).toBeNull()

      // 验证localStorage已清除
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })
  })

  describe('用户信息获取', () => {
    it('应该在成功时更新用户信息', async () => {
      const { default: api } = await import('@/utils/api')
      
      const mockUser = { id: 1, username: 'test', email: 'test@example.com' }

      api.get.mockResolvedValueOnce({
        data: mockUser
      })

      const result = await authStore.fetchUserInfo()

      expect(result).toBe(true)
      expect(authStore.user).toEqual(mockUser)
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
    })

    it('应该在失败时清除认证信息', async () => {
      const { default: api } = await import('@/utils/api')
      
      // 设置已登录状态
      authStore.token = 'some-token'
      authStore.user = { id: 1, username: 'test' }
      localStorage.setItem('token', 'some-token')
      localStorage.setItem('user', JSON.stringify({ id: 1, username: 'test' }))

      api.get.mockRejectedValueOnce(new Error('Failed to fetch user'))

      const result = await authStore.fetchUserInfo()

      expect(result).toBe(false)
      expect(authStore.token).toBe('')
      expect(authStore.user).toBeNull()
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })
  })

  describe('注册功能', () => {
    it('应该在注册成功时返回成功信息', async () => {
      const { default: api } = await import('@/utils/api')
      
      const mockUserData = { username: 'newuser', password: 'password' }
      const mockResponse = { id: 2, username: 'newuser' }

      api.post.mockResolvedValueOnce({
        data: mockResponse
      })

      const result = await authStore.register(mockUserData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
    })

    it('应该在注册失败时返回错误信息', async () => {
      const { default: api } = await import('@/utils/api')
      
      const mockUserData = { username: 'existinguser', password: 'password' }
      const errorMessage = '用户名已存在'

      api.post.mockRejectedValueOnce({
        response: { data: { detail: errorMessage } }
      })

      const result = await authStore.register(mockUserData)

      expect(result.success).toBe(false)
      expect(result.message).toBe(errorMessage)
    })
  })
})