# 测试文档

## 概述

本项目使用 Vitest 作为测试框架，配合 Vue Test Utils 进行组件测试，提供了完整的单元测试、集成测试和端到端测试覆盖。

## 测试结构

```
tests/
├── setup.js                 # 测试环境配置
├── README.md               # 测试文档
├── components/             # 组件测试
│   └── example.test.js     # 组件测试示例
├── stores/                 # 状态管理测试
│   └── auth.test.js        # Auth Store测试
├── utils/                  # 工具函数测试
│   ├── api.test.js         # API工具测试
│   └── timeConfig.test.js  # 时间配置测试
└── integration/            # 集成测试
    └── auth.test.js        # 认证集成测试
```

## 测试命令

```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage

# 运行测试UI界面
pnpm test:ui

# 单次运行测试（用于CI）
pnpm test:run

# 监听模式运行测试
pnpm test --watch
```

## 测试配置

### Vitest 配置 (vitest.config.js)

- **环境**: jsdom (模拟浏览器环境)
- **全局API**: 启用类似Jest的全局测试API
- **覆盖率**: 使用v8提供者，设置70%的覆盖率阈值
- **并发**: 启用多线程测试以提高性能

### 测试环境设置 (tests/setup.js)

- 模拟 Element Plus 组件
- 模拟 axios 请求
- 模拟 localStorage
- 模拟 window 对象
- 配置 Vue Test Utils 全局设置

## 测试类型

### 1. 单元测试

#### 工具函数测试 (`tests/utils/`)
- **api.test.js**: 测试API工具类的请求/响应拦截器
- **timeConfig.test.js**: 测试时间相关的工具函数

#### 状态管理测试 (`tests/stores/`)
- **auth.test.js**: 测试认证状态管理的所有方法

### 2. 组件测试 (`tests/components/`)

#### Login.test.js
- 组件渲染测试
- 表单验证测试
- 登录功能测试
- 用户交互测试
- 加载状态测试

### 3. 集成测试 (`tests/integration/`)

#### auth.test.js
- 完整登录流程测试
- 认证持久化测试
- 登出流程测试
- Token过期处理测试
- 路由守卫测试

## 编写测试的指南

### 1. 测试命名规范

```javascript
describe('功能模块', () => {
  describe('具体功能', () => {
    it('应该做什么', () => {
      // 测试代码
    })
  })
})
```

### 2. 测试结构 (AAA模式)

```javascript
it('应该正确计算用户年龄', () => {
  // Arrange (准备)
  const birthDate = new Date('1990-01-01')
  const expected = 34
  
  // Act (执行)
  const result = calculateAge(birthDate)
  
  // Assert (断言)
  expect(result).toBe(expected)
})
```

### 3. 模拟 (Mock) 使用

```javascript
// 模拟API调用
vi.mock('@/utils/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn()
  }
}))

// 模拟组件
vi.mock('@/components/MyComponent.vue', () => ({
  default: { name: 'MyComponent' }
}))
```

### 4. 异步测试

```javascript
it('应该处理异步操作', async () => {
  const result = await fetchData()
  expect(result).toBeDefined()
})
```

## 覆盖率要求

- **全局覆盖率阈值**: 70%
- **分支覆盖率**: 70%
- **函数覆盖率**: 70%
- **行覆盖率**: 70%
- **语句覆盖率**: 70%

### 覆盖率报告

运行 `pnpm test:coverage` 后，覆盖率报告将生成在 `coverage/` 目录：
- `coverage/index.html`: 可视化覆盖率报告
- `coverage/lcov.info`: LCOV格式数据
- `coverage/coverage-final.json`: JSON格式数据

## 最佳实践

### 1. 测试隔离
- 每个测试应该独立运行
- 使用 `beforeEach` 和 `afterEach` 清理测试状态
- 避免测试之间的依赖关系

### 2. 模拟策略
- 只模拟必要的依赖
- 优先使用真实的实现，必要时才模拟
- 在测试后清理模拟状态

### 3. 断言选择
- 使用最具体的断言方法
- 测试行为而非实现细节
- 提供有意义的错误消息

### 4. 测试数据
- 使用固定的测试数据
- 避免使用随机数据
- 覆盖边界情况

## 持续集成

### GitHub Actions 配置

测试在以下情况下自动运行：
- 推送到 `main` 分支
- 创建 Pull Request
- 推送标签

### 覆盖率上传

测试覆盖率会自动上传到 Codecov：
- 失败不会中断CI流程
- 可以在PR中查看覆盖率变化

## 调试测试

### 1. 使用测试UI
```bash
pnpm test:ui
```

### 2. 调试特定测试
```bash
pnpm test --grep "测试名称"
```

### 3. 在测试中使用debugger
```javascript
it('应该调试这个测试', () => {
  debugger
  // 测试代码
})
```

## 常见问题

### 1. 测试超时
- 检查异步操作是否正确等待
- 增加超时时间配置

### 2. 模拟不生效
- 确保模拟在测试之前设置
- 检查模拟路径是否正确

### 3. 组件渲染失败
- 检查全局组件注册
- 确保所有依赖都被正确模拟

## 扩展测试

### 添加新的测试文件

1. 在相应的目录下创建测试文件
2. 遵循命名规范 `*.test.js`
3. 使用现有的测试模板和配置

### 添加新的模拟

在 `tests/setup.js` 中添加全局模拟：
```javascript
vi.mock('new-package', () => ({
  default: vi.fn()
}))
```

## 性能优化

### 1. 并发测试
- Vitest默认启用多线程测试
- 可以通过配置调整线程数量

### 2. 缓存
- 使用 `--run` 参数避免重复编译
- 启用文件监听模式提高开发效率

### 3. 选择性测试
- 使用 `--grep` 运行特定测试
- 使用 `--exclude` 排除不需要的测试