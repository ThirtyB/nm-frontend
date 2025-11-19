import api from './api'

// 获取所有告警规则
export const getAlertRules = (params = {}) => {
  return api.get('/alert-management/rules', { params })
}

// 获取特定告警规则
export const getAlertRule = (ruleId) => {
  return api.get(`/alert-management/rules/${ruleId}`)
}

// 创建告警规则
export const createAlertRule = (data) => {
  return api.post('/alert-management/rules', data)
}

// 更新告警规则
export const updateAlertRule = (ruleId, data) => {
  return api.put(`/alert-management/rules/${ruleId}`, data)
}

// 删除告警规则
export const deleteAlertRule = (ruleId) => {
  return api.delete(`/alert-management/rules/${ruleId}`)
}

// 获取告警信息
export const getAlerts = (params = {}) => {
  // 确保必填的时间参数存在
  if (!params.start_time || !params.end_time) {
    throw new Error('start_time和end_time为必填参数')
  }
  return api.get('/alert-management/alerts', { params })
}

// 获取特定IP的告警信息
export const getIpAlerts = (ip, params = {}) => {
  // 确保必填的时间参数存在
  if (!params.start_time || !params.end_time) {
    throw new Error('start_time和end_time为必填参数')
  }
  return api.get(`/alert-management/alerts/${ip}`, { params })
}