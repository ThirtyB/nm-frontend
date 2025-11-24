// 统一时间选择配置
export const TIME_SHORTCUTS = [
  {
    text: '5分钟',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 5 * 60 * 1000)
      return [start, end]
    },
  },
  {
    text: '10分钟',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 10 * 60 * 1000)
      return [start, end]
    },
  },
  {
    text: '30分钟',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 30 * 60 * 1000)
      return [start, end]
    },
  },
  {
    text: '1小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 60 * 60 * 1000)
      return [start, end]
    },
  },
  {
    text: '2小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 2 * 60 * 60 * 1000)
      return [start, end]
    },
  },
  {
    text: '5小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 5 * 60 * 60 * 1000)
      return [start, end]
    },
  },
  {
    text: '12小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 12 * 60 * 60 * 1000)
      return [start, end]
    },
  },
  {
    text: '1天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 24 * 60 * 60 * 1000)
      return [start, end]
    },
  },
  {
    text: '2天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 2 * 24 * 60 * 60 * 1000)
      return [start, end]
    },
  }
]

// 默认时间范围（1小时）
export const DEFAULT_TIME_RANGE = () => {
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 60 * 60 * 1000) // 1小时前
  return [start, end]
}

// 格式化时间为本地时间字符串
export const formatLocalTime = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 获取默认时间范围字符串数组
export const getDefaultTimeRangeStrings = () => {
  const [start, end] = DEFAULT_TIME_RANGE()
  return [
    formatLocalTime(start),
    formatLocalTime(end)
  ]
}