import api from './api'

// 获取机器评分（所有机器）
export const getMachineScores = (params = {}) => {
  return api.get('/scoring/machines', { params })
}

// 获取特定机器的评分
export const getMachineScore = (ip, params = {}) => {
  return api.get(`/scoring/machines/${ip}`, { params })
}

// 获取评分汇总统计
export const getScoringSummary = (params = {}) => {
  return api.get('/scoring/summary', { params })
}