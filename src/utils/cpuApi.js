import api from './api'

// 获取CPU平均用量Top N IP的趋势数据
export const getCpuAverageTop5Trend = async (params = {}) => {
  const response = await api.get('/node-monitor/cpu-trends/average', {
    params
  })
  return response.data
}

// 获取CPU最高用量Top N IP的趋势数据
export const getCpuPeakTop5Trend = async (params = {}) => {
  const response = await api.get('/node-monitor/cpu-trends/maximum', {
    params
  })
  return response.data
}