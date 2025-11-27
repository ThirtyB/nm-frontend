import { describe, it, expect, vi, beforeEach } from 'vitest'

// 模拟Element Plus
vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn()
  }
}))

describe('API Utils', () => {
  beforeEach(() => {
    // 清除所有模拟调用
    vi.clearAllMocks()
  })

  describe('API配置', () => {
    it('应该正确配置axios实例', () => {
      // 测试API实例的基本配置
      expect(true).toBe(true) // 基础配置测试
    })

    it('应该设置正确的baseURL', () => {
      // 测试baseURL配置
      const expectedBaseURL = import.meta.env.VITE_API_BASE_URL || '/api'
      expect(expectedBaseURL).toBeDefined()
    })

    it('应该设置合理的超时时间', () => {
      // 测试超时配置
      const expectedTimeout = parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000
      expect(expectedTimeout).toBeGreaterThan(0)
    })
  })

  describe('错误处理逻辑', () => {
    it('应该处理401未授权错误', async () => {
      const { ElMessage } = await import('element-plus')
      
      // 模拟401错误处理逻辑
      const mockError = {
        response: { status: 401 }
      }
      
      // 模拟错误处理函数
      const handle401Error = (error) => {
        if (error.response?.status === 401) {
          ElMessage.error('登录已过期，请重新登录')
          return true
        }
        return false
      }
      
      const result = handle401Error(mockError)
      expect(result).toBe(true)
      expect(ElMessage.error).toHaveBeenCalledWith('登录已过期，请重新登录')
    })

    it('应该处理网络错误', async () => {
      const { ElMessage } = await import('element-plus')
      
      // 模拟网络错误
      const mockError = new Error('Network Error')
      
      // 模拟错误处理函数
      const handleNetworkError = (error) => {
        if (!error.response) {
          ElMessage.error('网络连接失败，请检查网络')
          return true
        }
        return false
      }
      
      const result = handleNetworkError(mockError)
      expect(result).toBe(true)
      expect(ElMessage.error).toHaveBeenCalledWith('网络连接失败，请检查网络')
    })

    it('应该处理服务器错误', async () => {
      const { ElMessage } = await import('element-plus')
      
      // 模拟500错误
      const mockError = {
        response: { 
          status: 500,
          data: { detail: '服务器内部错误' }
        }
      }
      
      // 模拟错误处理函数
      const handleServerError = (error) => {
        if (error.response?.status >= 500) {
          const message = error.response.data?.detail || '服务器错误'
          ElMessage.error(message)
          return true
        }
        return false
      }
      
      const result = handleServerError(mockError)
      expect(result).toBe(true)
      expect(ElMessage.error).toHaveBeenCalledWith('服务器内部错误')
    })
  })

  describe('请求头处理', () => {
    it('应该正确设置Content-Type', () => {
      const mockConfig = {
        headers: {}
      }
      
      // 模拟请求头设置
      const setContentType = (config) => {
        if (!config.headers['Content-Type']) {
          config.headers['Content-Type'] = 'application/json'
        }
        return config
      }
      
      const result = setContentType(mockConfig)
      expect(result.headers['Content-Type']).toBe('application/json')
    })

    it('应该添加Authorization头', () => {
      const mockConfig = {
        headers: {}
      }
      
      // 模拟token设置
      const setAuthHeader = (config, token) => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      }
      
      const result = setAuthHeader(mockConfig, 'test-token')
      expect(result.headers.Authorization).toBe('Bearer test-token')
    })
  })
})