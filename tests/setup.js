import { vi } from 'vitest'
import { config } from '@vue/test-utils'

// 模拟Element Plus的消息组件
const ElMessage = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn()
}

// 模拟Element Plus的消息框组件
const ElMessageBox = {
  confirm: vi.fn(),
  alert: vi.fn(),
  prompt: vi.fn()
}

// 模拟Element Plus的加载组件
const ElLoading = {
  service: vi.fn(() => ({
    close: vi.fn()
  }))
}

// 全局模拟Element Plus
vi.mock('element-plus', () => ({
  ElMessage,
  ElMessageBox,
  ElLoading
}))

// 模拟axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }))
  }
}))

// 模拟localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
global.localStorage = localStorageMock

// 模拟window.location
delete window.location
window.location = {
  href: 'http://localhost:3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn()
}

// 模拟window.alert
global.alert = vi.fn()

// 配置Vue Test Utils
config.global.mocks = {
  $message: ElMessage,
  $msgbox: ElMessageBox,
  $loading: ElLoading
}

// 全局组件注册
config.global.stubs = {
  'el-button': true,
  'el-input': true,
  'el-form': true,
  'el-form-item': true,
  'el-card': true,
  'el-table': true,
  'el-table-column': true,
  'el-dialog': true,
  'el-message-box': true,
  'el-link': true,
  'router-link': true,
  'router-view': true
}