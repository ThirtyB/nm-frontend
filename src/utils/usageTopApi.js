import api from './api'

// 获取使用率top数据
export const getUsageTop = (params = {}) => {
  // 确保必填的时间参数存在
  if (!params.start_time || !params.end_time) {
    throw new Error('start_time和end_time为必填参数')
  }
  return api.post('/node-monitor/usage-top', params)
}