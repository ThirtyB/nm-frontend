import { describe, it, expect, beforeEach } from 'vitest'
import { 
  TIME_SHORTCUTS, 
  DEFAULT_TIME_RANGE, 
  formatLocalTime, 
  getDefaultTimeRangeStrings 
} from '@/utils/timeConfig'

describe('Time Config Utils', () => {
  beforeEach(() => {
    // 固定当前时间用于测试
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T12:00:00'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('TIME_SHORTCUTS', () => {
    it('应该包含正确的时间快捷选项', () => {
      expect(Array.isArray(TIME_SHORTCUTS)).toBe(true)
      expect(TIME_SHORTCUTS.length).toBeGreaterThan(0)
      
      // 检查每个选项的结构
      TIME_SHORTCUTS.forEach(shortcut => {
        expect(shortcut).toHaveProperty('text')
        expect(shortcut).toHaveProperty('value')
        expect(typeof shortcut.value).toBe('function')
      })
    })

    it('应该包含5分钟选项', () => {
      const fiveMinShortcut = TIME_SHORTCUTS.find(s => s.text === '5分钟')
      expect(fiveMinShortcut).toBeDefined()
      
      const [start, end] = fiveMinShortcut.value()
      expect(end).toEqual(new Date('2024-01-15T12:00:00'))
      expect(start.getTime()).toBe(end.getTime() - 5 * 60 * 1000)
    })

    it('应该包含1小时选项', () => {
      const oneHourShortcut = TIME_SHORTCUTS.find(s => s.text === '1小时')
      expect(oneHourShortcut).toBeDefined()
      
      const [start, end] = oneHourShortcut.value()
      expect(end).toEqual(new Date('2024-01-15T12:00:00'))
      expect(start.getTime()).toBe(end.getTime() - 60 * 60 * 1000)
    })

    it('应该包含1天选项', () => {
      const oneDayShortcut = TIME_SHORTCUTS.find(s => s.text === '1天')
      expect(oneDayShortcut).toBeDefined()
      
      const [start, end] = oneDayShortcut.value()
      expect(end).toEqual(new Date('2024-01-15T12:00:00'))
      expect(start.getTime()).toBe(end.getTime() - 24 * 60 * 60 * 1000)
    })
  })

  describe('DEFAULT_TIME_RANGE', () => {
    it('应该返回1小时的时间范围', () => {
      const [start, end] = DEFAULT_TIME_RANGE()
      
      expect(end).toEqual(new Date('2024-01-15T12:00:00'))
      expect(start.getTime()).toBe(end.getTime() - 60 * 60 * 1000)
    })

    it('应该返回有效的Date对象', () => {
      const [start, end] = DEFAULT_TIME_RANGE()
      
      expect(start).toBeInstanceOf(Date)
      expect(end).toBeInstanceOf(Date)
      expect(start < end).toBe(true)
    })
  })

  describe('formatLocalTime', () => {
    it('应该正确格式化日期时间', () => {
      const date = new Date('2024-01-15T10:30:45')
      const result = formatLocalTime(date)
      expect(result).toBe('2024-01-15 10:30:45')
    })

    it('应该处理个位数的月份、日期、小时、分钟、秒', () => {
      const date = new Date('2024-01-05T09:08:07')
      const result = formatLocalTime(date)
      expect(result).toBe('2024-01-05 09:08:07')
    })

    it('应该处理边界情况', () => {
      const date = new Date('2024-12-31T23:59:59')
      const result = formatLocalTime(date)
      expect(result).toBe('2024-12-31 23:59:59')
    })
  })

  describe('getDefaultTimeRangeStrings', () => {
    it('应该返回格式化的时间范围字符串', () => {
      const [startStr, endStr] = getDefaultTimeRangeStrings()
      
      expect(typeof startStr).toBe('string')
      expect(typeof endStr).toBe('string')
      expect(startStr).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
      expect(endStr).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
    })

    it('应该返回正确的时间范围', () => {
      const [startStr, endStr] = getDefaultTimeRangeStrings()
      
      expect(endStr).toBe('2024-01-15 12:00:00')
      expect(startStr).toBe('2024-01-15 11:00:00')
    })

    it('应该与formatLocalTime结果一致', () => {
      const [startStr, endStr] = getDefaultTimeRangeStrings()
      const [start, end] = DEFAULT_TIME_RANGE()
      
      expect(startStr).toBe(formatLocalTime(start))
      expect(endStr).toBe(formatLocalTime(end))
    })
  })
})