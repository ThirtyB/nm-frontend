import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

// 模拟API模块
vi.mock('@/utils/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}))

describe('Auth Store', () => {
  let authStore
  let mockApi

  beforeEach(async () => {
    // 创建新的Pinia实例
    setActivePinia(createPinia())
    
    // 获取store实例
    authStore = useAuthStore()
    
    // 获取模拟的API
    mockApi = await import('@/utils/api')
    
    // 清除localStorage模拟
    localStorage.clear()
    vi.clearAllMocks()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('初始状态', () => {
    it('应该从localStorage初始化token', () => {
      localStorage.setItem('token', 'test-token')
      setActivePinia(createPinia())
      const newAuthStore = useAuthStore()
      
      expect(newAuthStore.token).toBe('test-token')
    })

    it('应该从localStorage初始化用户信息', () => {
      const testUser = { id: 1, username: 'testuser' }
      localStorage.setItem('user', JSON.stringify(testUser))
      setActivePinia(createPinia())
      const newAuthStore = useAuthStore()
      
      expect(newAuthStore.user).toEqual(testUser)
    })

    it('isAuthenticated应该根据token状态返回正确的值', () => {
      expect(authStore.isAuthenticated).toBe(false)
      
      authStore.token = 'some-token'
      expect(authStore.isAuthenticated).toBe(true)
    })
  })

  describe('login方法', () => {
    it('应该在登录成功时设置token并获取用户信息', async () => {
      const mockCredentials = { username: 'test', password: 'password' }
      const mockToken = 'test-token'
      const mockUser = { id: 1, username: 'test' }

      mockApi.default.post.mockResolvedValueOnce({
        data: { access_token: mockToken }
      })
      
      mockApi.default.get.mockResolvedValueOnce({
        data: mockUser
      })

      const result = await authStore.login(mockCredentials)

      expect(result.success).toBe(true)
      expect(authStore.token).toBe(mockToken)
      expect(localStorage.getItem('token')).toBe(mockToken)
      expect(authStore.user).toEqual(mockUser)
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
    })

    it('应该在获取用户信息失败时清除token', async () => {
      const mockCredentials = { username: 'test', password: 'password' }
      const mockToken = 'test-token'

      mockApi.default.post.mockResolvedValueOnce({
        data: { access_token: mockToken }
      })
      
      mockApi.default.get.mockRejectedValueOnce(new Error('User fetch failed'))

      const result = await authStore.login(mockCredentials)

      expect(result.success).toBe(false)
      expect(result.message).toBe('获取用户信息失败')
      expect(authStore.token).toBe('')
      expect(authStore.user).toBeNull()
    })

    it('应该在登录失败时返回错误信息', async () => {
      const mockCredentials = { username: 'test', password: 'wrong' }
      const errorMessage = '用户名或密码错误'

      mockApi.default.post.mockRejectedValueOnce({
        response: { data: { detail: errorMessage } }
      })

      const result = await authStore.login(mockCredentials)

      expect(result.success).toBe(false)
      expect(result.message).toBe(errorMessage)
      expect(authStore.token).toBe('')
    })

    it('应该在网络错误时返回通用错误信息', async () => {
      const mockCredentials = { username: 'test', password: 'password' }

      mockApi.default.post.mockRejectedValueOnce(new Error('Network error'))

      const result = await authStore.login(mockCredentials)

      expect(result.success).toBe(false)
      expect(result.message).toBe('登录失败')
    })
  })

  describe('register方法', () => {
    it('应该在注册成功时返回成功信息', async () => {
      const mockUserData = { username: 'newuser', password: 'password' }
      const mockResponse = { id: 2, username: 'newuser' }

      mockApi.default.post.mockResolvedValueOnce({
        data: mockResponse
      })

      const result = await authStore.register(mockUserData)

      expect(result.success).toBe(true)
      expect(result.data).toEqual(mockResponse)
    })

    it('应该在注册失败时返回错误信息', async () => {
      const mockUserData = { username: 'existinguser', password: 'password' }
      const errorMessage = '用户名已存在'

      mockApi.default.post.mockRejectedValueOnce({
        response: { data: { detail: errorMessage } }
      })

      const result = await authStore.register(mockUserData)

      expect(result.success).toBe(false)
      expect(result.message).toBe(errorMessage)
    })
  })

  describe('logout方法', () => {
    it('应该清除所有认证信息', () => {
      authStore.token = 'some-token'
      authStore.user = { id: 1, username: 'test' }
      localStorage.setItem('token', 'some-token')
      localStorage.setItem('user', JSON.stringify({ id: 1, username: 'test' }))

      authStore.logout()

      expect(authStore.token).toBe('')
      expect(authStore.user).toBeNull()
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })
  })

  describe('fetchUserInfo方法', () => {
    it('应该在成功时更新用户信息', async () => {
      const mockUser = { id: 1, username: 'test', email: 'test@example.com' }

      mockApi.default.get.mockResolvedValueOnce({
        data: mockUser
      })

      const result = await authStore.fetchUserInfo()

      expect(result).toBe(true)
      expect(authStore.user).toEqual(mockUser)
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser))
    })

    it('应该在失败时清除认证信息', async () => {
      authStore.token = 'some-token'
      authStore.user = { id: 1, username: 'test' }
      localStorage.setItem('token', 'some-token')
      localStorage.setItem('user', JSON.stringify({ id: 1, username: 'test' }))

      mockApi.default.get.mockRejectedValueOnce(new Error('Failed to fetch user'))

      const result = await authStore.fetchUserInfo()

      expect(result).toBe(false)
      expect(authStore.token).toBe('')
      expect(authStore.user).toBeNull()
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('user')).toBeNull()
    })
  })
})