<template>
  <div class="dashboard">
    <!-- 告警信息模块 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="alert-card">
          <template #header>
            <div class="alert-header">
              <div class="alert-title">
                <el-icon color="#F56C6C" size="20"><Warning /></el-icon>
                <span>告警信息</span>
                <el-tag 
                  :type="getAlertLevelType(alerts.total_critical_count)" 
                  effect="dark"
                  style="margin-left: 12px;"
                >
                  严重: {{ alerts.total_critical_count }}
                </el-tag>
                <el-tag 
                  :type="getAlertLevelType(alerts.total_error_count)" 
                  effect="dark"
                  style="margin-left: 8px;"
                >
                  错误: {{ alerts.total_error_count }}
                </el-tag>
                <el-tag 
                  :type="getAlertLevelType(alerts.total_warning_count)" 
                  effect="dark"
                  style="margin-left: 8px;"
                >
                  警告: {{ alerts.total_warning_count }}
                </el-tag>
              </div>
              <div class="alert-controls">
                <el-date-picker
                  v-model="alertTimeRange"
                  type="datetimerange"
                  range-separator="至"
                  start-placeholder="开始时间"
                  end-placeholder="结束时间"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="YYYY-MM-DD HH:mm:ss"
                  @change="handleAlertTimeChange"
                  :shortcuts="alertTimeShortcuts"
                  style="margin-right: 12px;"
                />
                <el-button 
                  type="primary" 
                  size="small"
                  @click="refreshAlerts"
                  :loading="alertsLoading"
                >
                  <el-icon><Refresh /></el-icon>
                  刷新告警
                </el-button>
              </div>
            </div>
          </template>
          
          <div v-if="alertsLoading" class="alert-loading">
            <el-skeleton :rows="3" animated />
          </div>
          
          <div v-else-if="alerts.alerts && alerts.alerts.length > 0">
            <el-table :data="alerts.alerts.slice(0, 5)" style="width: 100%">
              <el-table-column prop="ip" label="IP地址" width="120" />
              <el-table-column prop="rule_name" label="规则名称" width="150" />
              <el-table-column prop="alert_level" label="告警级别" width="100">
                <template #default="{ row }">
                  <el-tag 
                    :type="getAlertLevelType(row.alert_level)" 
                    effect="dark"
                    size="small"
                  >
                    {{ getAlertLevelText(row.alert_level) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="alert_message" label="告警消息" />
              <el-table-column prop="current_value" label="当前值" width="80">
                <template #default="{ row }">
                  {{ row.current_value?.toFixed(2) || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="threshold_value" label="阈值" width="80">
                <template #default="{ row }">
                  {{ row.threshold_value?.toFixed(2) || '-' }}
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120">
                <template #default="{ row }">
                  <el-button 
                    type="primary" 
                    size="small"
                    @click="goToNodeDetail(row.ip)"
                  >
                    <el-icon><View /></el-icon>
                    查看详情
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            
            <div v-if="alerts.total_count > 5" class="alert-more">
              <el-button 
                type="text" 
                @click="showAllAlerts = true"
              >
                查看全部 {{ alerts.total_count }} 条告警
              </el-button>
            </div>
          </div>
          
          <el-empty v-else description="暂无告警信息" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 欢迎卡片 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="welcome-card">
          <div class="welcome-content">
            <h1>欢迎使用资源监控系统</h1>
            <p>这是一个用于监控系统资源的管理平台</p>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40" color="#409EFF"><House /></el-icon>
            </div>
            <div class="stat-info">
              <h3>系统监控</h3>
              <p>实时监控系统状态</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40" color="#67C23A"><DataAnalysis /></el-icon>
            </div>
            <div class="stat-info">
              <h3>数据分析</h3>
              <p>查看系统数据分析</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40" color="#E6A23C"><Setting /></el-icon>
            </div>
            <div class="stat-info">
              <h3>系统设置</h3>
              <p>配置系统参数</p>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon">
              <el-icon size="40" color="#F56C6C"><Warning /></el-icon>
            </div>
            <div class="stat-info">
              <h3>告警管理</h3>
              <p>配置告警规则</p>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>快速操作</span>
            </div>
          </template>
          
          <div class="quick-actions">
            <el-button 
              v-if="authStore.user?.user_type === 'admin'"
              type="primary" 
              @click="$router.push('/users')"
            >
              <el-icon><User /></el-icon>
              用户管理
            </el-button>
            
            <el-button 
              v-if="authStore.user?.user_type === 'admin'"
              type="warning" 
              @click="$router.push('/alert-management')"
            >
              <el-icon><Warning /></el-icon>
              告警配置
            </el-button>
            
            <el-button type="success" @click="$router.push('/nodes')">
              <el-icon><Monitor /></el-icon>
              节点监控
            </el-button>
            
            <el-button type="info">
              <el-icon><Document /></el-icon>
              查看日志
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 全部告警弹窗 -->
    <el-dialog
      v-model="showAllAlerts"
      title="全部告警信息"
      width="80%"
      top="5vh"
    >
      <el-table :data="alerts.alerts" style="width: 100%" max-height="60vh">
        <el-table-column prop="ip" label="IP地址" width="120" />
        <el-table-column prop="rule_name" label="规则名称" width="150" />
        <el-table-column prop="alert_level" label="告警级别" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getAlertLevelType(row.alert_level)" 
              effect="dark"
              size="small"
            >
              {{ getAlertLevelText(row.alert_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="alert_message" label="告警消息" />
        <el-table-column prop="current_value" label="当前值" width="80">
          <template #default="{ row }">
            {{ row.current_value?.toFixed(2) || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="threshold_value" label="阈值" width="80">
          <template #default="{ row }">
            {{ row.threshold_value?.toFixed(2) || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="condition_field" label="监控字段" width="120" />
        <el-table-column prop="condition_operator" label="操作符" width="80" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small"
              @click="goToNodeDetail(row.ip)"
            >
              <el-icon><View /></el-icon>
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  House, DataAnalysis, Setting, User, Refresh, Document, Warning, Monitor, View 
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { getAlerts } from '@/utils/alertApi'

const router = useRouter()
const authStore = useAuthStore()

// 告警相关数据
const alerts = ref({
  alerts: [],
  total_count: 0,
  total_critical_count: 0,
  total_error_count: 0,
  total_warning_count: 0,
  query_time: null
})
const alertsLoading = ref(false)
const showAllAlerts = ref(false)
const alertTimeRange = ref([])

// 告警时间快捷选项
const alertTimeShortcuts = [
  {
    text: '最近1小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000)
      return [start, end]
    },
  },
  {
    text: '最近6小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 6)
      return [start, end]
    },
  },
  {
    text: '最近24小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24)
      return [start, end]
    },
  },
  {
    text: '最近7天',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
]

// 获取告警级别类型
const getAlertLevelType = (level) => {
  const levelMap = {
    'critical': 'danger',
    'error': 'error',
    'warning': 'warning',
    'info': 'info'
  }
  return levelMap[level] || 'info'
}

// 获取告警级别文本
const getAlertLevelText = (level) => {
  const levelMap = {
    'critical': '严重',
    'error': '错误',
    'warning': '警告',
    'info': '信息'
  }
  return levelMap[level] || level
}

// 获取告警信息
const fetchAlerts = async () => {
  if (!alertTimeRange.value || alertTimeRange.value.length !== 2) {
    ElMessage.warning('请选择告警查询时间范围')
    return
  }

  alertsLoading.value = true
  try {
    const startTime = Math.floor(new Date(alertTimeRange.value[0]).getTime() / 1000)
    const endTime = Math.floor(new Date(alertTimeRange.value[1]).getTime() / 1000)

    const response = await getAlerts({
      start_time: startTime,
      end_time: endTime
    })
    alerts.value = response.data
    
    // 计算各级别告警数量
    if (alerts.value.alerts) {
      alerts.value.total_critical_count = alerts.value.alerts.filter(a => a.alert_level === 'critical').length
      alerts.value.total_error_count = alerts.value.alerts.filter(a => a.alert_level === 'error').length
      alerts.value.total_warning_count = alerts.value.alerts.filter(a => a.alert_level === 'warning').length
    }
  } catch (error) {
    console.error('获取告警信息失败:', error)
    if (error.message && error.message.includes('start_time')) {
      ElMessage.error('请选择告警查询时间范围')
    } else {
      ElMessage.error('获取告警信息失败')
    }
  } finally {
    alertsLoading.value = false
  }
}

// 处理告警时间变化
const handleAlertTimeChange = () => {
  if (alertTimeRange.value && alertTimeRange.value.length === 2) {
    fetchAlerts()
  }
}

// 刷新告警信息
const refreshAlerts = () => {
  fetchAlerts()
}

// 跳转到节点详情
const goToNodeDetail = (ip) => {
  router.push(`/nodes/${ip}`)
  showAllAlerts.value = false
}

// 组件挂载时获取告警信息
onMounted(() => {
  // 设置默认告警时间范围为最近24小时
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 3600 * 1000 * 24)
  alertTimeRange.value = [
    start.toISOString().slice(0, 19).replace('T', ' '),
    end.toISOString().slice(0, 19).replace('T', ' ')
  ]
  
  fetchAlerts()
})
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
  margin: 0 auto;
}

/* 告警卡片样式 */
.alert-card {
  margin-bottom: 20px;
  border: 1px solid #f56c6c;
  box-shadow: 0 2px 12px rgba(245, 108, 108, 0.1);
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
}

.alert-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #303133;
  flex-wrap: wrap;
}

.alert-title .el-icon {
  margin-right: 8px;
}

.alert-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.alert-loading {
  padding: 20px 0;
}

.alert-more {
  margin-top: 12px;
  text-align: center;
}

/* 欢迎卡片样式 */
.welcome-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
}

.welcome-content {
  text-align: center;
  padding: 40px 20px;
}

.welcome-content h1 {
  margin: 0 0 16px 0;
  font-size: 32px;
  font-weight: 600;
}

.welcome-content p {
  margin: 0;
  font-size: 16px;
  opacity: 0.9;
}

/* 统计卡片样式 */
.stat-card {
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  margin-right: 16px;
}

.stat-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.stat-info p {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

/* 通用样式 */
.card-header {
  font-weight: 600;
  color: #303133;
}

.quick-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 告警表格样式 */
:deep(.el-table) {
  font-size: 13px;
}

:deep(.el-table th) {
  background-color: #fafafa;
  font-weight: 600;
}

:deep(.el-table td) {
  padding: 8px 0;
}
</style>