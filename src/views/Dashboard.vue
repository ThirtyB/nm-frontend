<template>
  <div class="dashboard">
    <!-- 欢迎卡片 -->
    <el-row :gutter="20">
      <el-col :span="24">
        <el-card class="welcome-card">
          <div class="welcome-content">
            <h1>欢迎使用资源监控系统</h1>
            <p>这是一个用于监控系统资源的管理平台</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 告警信息模块 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card class="alert-card">
          <template #header>
            <div class="alert-header">
              <div class="alert-title">
                <el-icon color="#F56C6C" size="20"><Warning /></el-icon>
                <span>告警信息</span>
                <el-tag 
                  :type="getAlertLevelType('critical')" 
                  effect="dark"
                  style="margin-left: 12px;"
                >
                  严重: {{ alerts.total_critical_count }}
                </el-tag>
                <el-tag 
                  :type="getAlertLevelType('error')" 
                  effect="dark"
                  style="margin-left: 8px;"
                >
                  错误: {{ alerts.total_error_count }}
                </el-tag>
                <el-tag 
                  :type="getAlertLevelType('warning')" 
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
    
    <!-- 系统评分概览 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <div class="header-title">
                <el-icon color="#409EFF" size="20"><DataAnalysis /></el-icon>
                <span>系统评分概览</span>
              </div>
            </div>
          </template>
          
          <div v-if="scoringLoading">
            <el-skeleton :rows="3" animated />
          </div>
          
          <div v-else-if="machineScores.length > 0">
            <!-- 雷达图和维度分数 -->
            <el-row :gutter="24" style="margin-bottom: 24px;">
              <el-col :span="6">
                <div class="stats-area">
                  <div class="stat-item">
                    <div class="stat-label">平均分</div>
                    <div class="stat-value">{{ scoringSummary.average_score?.toFixed(1) || '0.0' }}</div>
                  </div>
                  <div class="stat-item">
                    <div class="stat-label">机器总数</div>
                    <div class="stat-value">{{ scoringSummary.total_machines || 0 }}</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="radar-chart-container">
                  <canvas ref="radarCanvas"></canvas>
                </div>
              </el-col>
              <el-col :span="10">
                <div class="dimension-scores-list">
                  <div v-for="(value, key) in scoringSummary.dimension_averages" :key="key" class="dimension-score-item">
                    <div class="dimension-info">
                      <span class="dimension-name">{{ getDimensionName(key) }}</span>
                      <span class="dimension-score">{{ value?.toFixed(1) || '0.0' }}</span>
                    </div>
                    <div class="dimension-bar">
                      <div class="bar-background">
                        <div 
                          class="bar-fill" 
                          :style="{ width: (value || 0) + '%', backgroundColor: getNewScoreColor(value || 0) }"
                        ></div>
                      </div>
                      <span class="bar-percentage">{{ (value || 0).toFixed(1) }}%</span>
                    </div>
                  </div>
                </div>
              </el-col>
            </el-row>
            
            <!-- 机器评分卡片列表 -->
            <div class="machine-scores-container">
              <div class="machine-scores-scroll">
                <div v-for="machine in machineScores" :key="machine.ip" class="machine-score-card">
                  <div class="machine-card-header">
                    <span class="machine-ip">{{ machine.ip }}</span>
                    <el-tag 
                      :type="getScoreTagType(machine.total_score)" 
                      effect="dark"
                      size="small"
                    >
                      {{ machine.total_score.toFixed(1) }}
                    </el-tag>
                  </div>
                  <div class="machine-dimensions">
                    <div v-for="(dim, key) in machine.dimensions" :key="key" class="machine-dimension-item">
                      <span class="dim-label">{{ getDimensionName(key) }}</span>
                      <div class="dim-score-bar">
                        <div class="dim-bar-bg">
                          <div 
                            class="dim-bar-fill" 
                            :style="{ width: dim.score + '%', backgroundColor: getNewScoreColor(dim.score) }"
                          ></div>
                        </div>
                        <span class="dim-score-text">{{ dim.score.toFixed(0) }}</span>
                      </div>
                      <el-tag 
                        v-if="dim.alert_count > 0" 
                        type="danger" 
                        size="small"
                        class="dim-alert-tag"
                      >
                        {{ dim.alert_count }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="machine-card-footer">
                    <span class="eval-time">{{ formatTime(machine.evaluation_time) }}</span>
                    <el-button 
                      type="primary" 
                      size="small"
                      @click="goToNodeDetail(machine.ip)"
                    >
                      <el-icon><View /></el-icon>
                      详情
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <el-empty v-else description="暂无评分数据" />
        </el-card>
      </el-col>
    </el-row>

    <!-- 五维使用率TOP折线图 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="usage-top-header">
              <div class="header-title">
                <el-icon color="#67C23C" size="20"><DataAnalysis /></el-icon>
                <span>五维使用率TOP趋势图</span>
              </div>
              <div class="usage-top-controls">
                <span class="control-label">TOP数量：</span>
                <el-input-number 
                  v-model="topCount" 
                  :min="1" 
                  :max="20" 
                  :step="1"
                  size="small"
                  style="width: 120px;"
                  @change="refreshUsageTop"
                />
              </div>
            </div>
          </template>
          
          <div v-if="usageTopLoading">
            <el-skeleton :rows="3" animated />
          </div>
          
          <div v-else-if="usageTopData && Object.keys(usageTopData).length > 0" class="usage-top-charts">
            <el-row :gutter="20">
              <el-col :span="12" v-for="(dimension, index) in usageTopData" :key="dimension.name">
                <div class="chart-card">
                  <div class="chart-header">
                    <h3>{{ dimension.name }}使用率TOP{{ topCount }}</h3>
                    <el-tag type="info" size="small">{{ dimension.unit }}</el-tag>
                  </div>
                  <div :ref="(el) => { usageTopChartRefs[index] = el; }" class="usage-top-chart"></div>
                </div>
              </el-col>
            </el-row>
          </div>
          
          <el-empty v-else description="暂无使用率数据" />
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

    <!-- 全部评分弹窗 -->
    <el-dialog
      v-model="showAllScores"
      title="全部机器评分"
      width="90%"
      top="5vh"
    >
      <el-table :data="machineScores" style="width: 100%" max-height="60vh">
        <el-table-column prop="ip" label="IP地址" width="120" />
        <el-table-column label="总分" width="100">
          <template #default="{ row }">
            <el-tag 
              :type="getScoreTagType(row.total_score)" 
              effect="dark"
              size="small"
            >
              {{ row.total_score.toFixed(1) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="各维度评分">
          <template #default="{ row }">
            <div class="dimension-scores">
              <div v-for="(dim, key) in row.dimensions" :key="key" class="dimension-item">
                <span class="dim-name">{{ getDimensionName(key) }}:</span>
                <el-progress 
                  :percentage="dim.score" 
                  :color="getScoreColor(dim.score)"
                  :show-text="true"
                  :format="() => dim.score.toFixed(0)"
                  :stroke-width="6"
                  style="width: 80px; margin-left: 4px;"
                />
                <el-tag 
                  v-if="dim.alert_count > 0" 
                  type="danger" 
                  size="small"
                  style="margin-left: 4px;"
                >
                  {{ dim.alert_count }}
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="evaluation_time" label="评估时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.evaluation_time) }}
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
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  House, DataAnalysis, Setting, User, Refresh, Document, Warning, Monitor, View 
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { useAuthStore } from '@/stores/auth'
import { getAlerts } from '@/utils/alertApi'
import { getMachineScores, getScoringSummary } from '@/utils/scoringApi'
import { getUsageTop } from '@/utils/usageTopApi'
import { TIME_SHORTCUTS, getDefaultTimeRangeStrings } from '@/utils/timeConfig'

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

// 评分相关数据
const machineScores = ref([])
const scoringSummary = ref({
  total_machines: 0,
  average_score: 0,
  dimension_averages: {}
})
const scoringLoading = ref(false)
const showAllScores = ref(false)

// 雷达图相关
const radarCanvas = ref(null)
const resizeTimer = ref(null)

// 使用率TOP相关数据
const usageTopData = ref([])
const usageTopLoading = ref(false)
const topCount = ref(4)
const usageTopChartRefs = ref([])

// 告警时间快捷选项
const alertTimeShortcuts = TIME_SHORTCUTS

// 获取告警级别类型
const getAlertLevelType = (level) => {
  const levelMap = {
    'critical': 'custom',    // 严重 - 酒红色（自定义）
    'error': 'danger',       // 错误 - 红色
    'warning': 'warning',    // 警告 - 橙黄色
    'info': 'success'        // 信息 - 绿色
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

// 获取维度名称
const getDimensionName = (key) => {
  const nameMap = {
    'CPU': 'CPU',
    '内存': '内存',
    '磁盘': '磁盘',
    '网络': '网络',
    'Swap': 'Swap'
  }
  return nameMap[key] || key
}

// 获取评分颜色
const getScoreColor = (score) => {
  if (score >= 80) return '#67C23A'
  if (score >= 60) return '#E6A23C'
  if (score >= 40) return '#F56C6C'
  return '#909399'
}

// 获取新的评分颜色（满分金色，非满分按10分分段，60分以下统一）
const getNewScoreColor = (score) => {
  if (score >= 100) return '#FFD700' // 金色
  if (score >= 90) return '#67C23A'  // 绿色
  if (score >= 80) return '#95D475'  // 浅绿色
  if (score >= 70) return '#E6A23C'  // 橙色
  if (score >= 60) return '#F56C6C'  // 红色
  return '#909399'  // 灰色（60分以下统一）
}

// 获取评分标签类型
const getScoreTagType = (score) => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  if (score >= 40) return 'danger'
  return 'info'
}

// 格式化时间
const formatTime = (timeStr) => {
  if (!timeStr) return '-'
  return new Date(timeStr).toLocaleString('zh-CN')
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
    if (error.message && error.message.includes('start_time')) {
      ElMessage.error('请选择告警查询时间范围')
    } else {
      ElMessage.error('获取告警信息失败')
    }
  } finally {
    alertsLoading.value = false
  }
  
  // 告警数据获取完成后，获取评分数据
  fetchScoringData()
}

// 处理告警时间变化
const handleAlertTimeChange = () => {
  if (alertTimeRange.value && alertTimeRange.value.length === 2) {
    fetchAlerts()
    // fetchAlerts会自动调用fetchScoringData
  }
}

// 刷新告警信息
const refreshAlerts = () => {
  fetchAlerts()
  // fetchAlerts会自动调用fetchScoringData
}

// 获取评分数据
const fetchScoringData = async () => {
  scoringLoading.value = true
  try {
    // 使用告警时间范围作为评分时间范围
    if (!alertTimeRange.value || alertTimeRange.value.length !== 2) {
      ElMessage.warning('请先选择时间范围')
      scoringLoading.value = false
      return
    }

    const startTime = Math.floor(new Date(alertTimeRange.value[0]).getTime() / 1000)
    const endTime = Math.floor(new Date(alertTimeRange.value[1]).getTime() / 1000)

    // 并行获取机器评分和汇总统计
    const [scoresResponse, summaryResponse] = await Promise.all([
      getMachineScores({ 
        start_time: startTime, 
        end_time: endTime,
        include_details: false 
      }),
      getScoringSummary({ 
        start_time: startTime, 
        end_time: endTime 
      })
    ])
    
    machineScores.value = scoresResponse.data.scores || []
    
    // 处理汇总数据（可能是字符串格式）
    if (typeof summaryResponse.data === 'string') {
      try {
        scoringSummary.value = JSON.parse(summaryResponse.data)
      } catch (e) {
        scoringSummary.value = {
          total_machines: machineScores.value.length,
          average_score: 0,
          dimension_averages: {}
        }
      }
    } else {
      scoringSummary.value = summaryResponse.data || {
        total_machines: machineScores.value.length,
        average_score: 0,
        dimension_averages: {}
      }
    }
    
    // 如果没有汇总数据，根据机器评分计算
    if (!scoringSummary.value.average_score && machineScores.value.length > 0) {
      const totalScore = machineScores.value.reduce((sum, machine) => sum + machine.total_score, 0)
      scoringSummary.value.average_score = totalScore / machineScores.value.length
      scoringSummary.value.total_machines = machineScores.value.length
      
      // 计算各维度平均分
      const dimensionTotals = {}
      machineScores.value.forEach(machine => {
        Object.entries(machine.dimensions).forEach(([key, dim]) => {
          if (!dimensionTotals[key]) {
            dimensionTotals[key] = { total: 0, count: 0 }
          }
          dimensionTotals[key].total += dim.score
          dimensionTotals[key].count += 1
        })
      })
      
      scoringSummary.value.dimension_averages = {}
      Object.entries(dimensionTotals).forEach(([key, data]) => {
        scoringSummary.value.dimension_averages[key] = data.total / data.count
      })
    }
    
    // 绘制雷达图 - 确保DOM完全渲染后再绘制
    nextTick(() => {
      setTimeout(() => {
        drawRadarChart()
      }, 100) // 延迟100ms确保容器尺寸已确定
    })
    
  } catch (error) {
    ElMessage.error('获取评分数据失败')
  } finally {
    scoringLoading.value = false
  }
  
  // 评分数据获取完成后，获取使用率TOP数据
  fetchUsageTopData()
}

// 绘制雷达图
const drawRadarChart = () => {
  if (!radarCanvas.value) return
  
  const canvas = radarCanvas.value
  const ctx = canvas.getContext('2d')
  
  // 检查容器尺寸是否有效
  const container = canvas.parentElement
  if (!container || container.clientWidth === 0 || container.clientHeight === 0) {
    setTimeout(() => drawRadarChart(), 200)
    return
  }
  
  const containerWidth = container.clientWidth
  const containerHeight = container.clientHeight
  const size = Math.min(containerWidth, containerHeight, 350)
  
  // 如果尺寸太小，不绘制
  if (size < 100) {
    return
  }
  
  // 设置Canvas的CSS尺寸
  canvas.style.width = size + 'px'
  canvas.style.height = size + 'px'
  
  // 设置Canvas的实际像素尺寸（支持高清屏）
  const dpr = window.devicePixelRatio || 1
  canvas.width = size * dpr
  canvas.height = size * dpr
  ctx.scale(dpr, dpr)
  
  const centerX = size / 2
  const centerY = size / 2
  const radius = (size / 2) - 50
  
  // 清空画布
  ctx.clearRect(0, 0, size, size)
  
  // 维度数据
  const dimensions = ['CPU', '内存', '磁盘', '网络', 'Swap']
  const dimensionData = dimensions.map(dim => ({
    name: getDimensionName(dim),
    value: scoringSummary.value.dimension_averages[dim] || 0
  }))
  
  // 绘制渐变背景
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
  gradient.addColorStop(0, 'rgba(64, 158, 255, 0.05)')
  gradient.addColorStop(1, 'rgba(64, 158, 255, 0.02)')
  
  // 绘制背景网格（更美观的样式）
  const levels = 5
  for (let i = 1; i <= levels; i++) {
    ctx.beginPath()
    
    // 渐变网格线
    const alpha = 0.3 - (i * 0.05)
    ctx.strokeStyle = `rgba(200, 200, 200, ${alpha})`
    ctx.lineWidth = i === levels ? 2 : 1
    
    for (let j = 0; j < dimensions.length; j++) {
      const angle = (Math.PI * 2 * j) / dimensions.length - Math.PI / 2
      const x = centerX + Math.cos(angle) * (radius * i / levels)
      const y = centerY + Math.sin(angle) * (radius * i / levels)
      
      if (j === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    }
    ctx.closePath()
    ctx.stroke()
    
    // 添加网格填充
    if (i === levels) {
      ctx.fillStyle = gradient
      ctx.fill()
    }
  }
  
  // 绘制轴线（更细腻的样式）
  dimensions.forEach((dim, index) => {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2
    
    // 绘制轴线
    ctx.beginPath()
    ctx.strokeStyle = 'rgba(180, 180, 180, 0.6)'
    ctx.lineWidth = 1
    ctx.setLineDash([5, 3]) // 虚线
    ctx.moveTo(centerX, centerY)
    ctx.lineTo(
      centerX + Math.cos(angle) * radius,
      centerY + Math.sin(angle) * radius
    )
    ctx.stroke()
    ctx.setLineDash([]) // 重置虚线
    
    // 绘制刻度点
    for (let i = 1; i <= 5; i++) {
      const tickRadius = (radius * i) / 5
      const tickX = centerX + Math.cos(angle) * tickRadius
      const tickY = centerY + Math.sin(angle) * tickRadius
      
      ctx.beginPath()
      ctx.fillStyle = 'rgba(150, 150, 150, 0.4)'
      ctx.arc(tickX, tickY, 2, 0, Math.PI * 2)
      ctx.fill()
    }
    
    // 绘制标签（更美观的样式）
    ctx.save()
    ctx.fillStyle = '#2c3e50'
    ctx.font = 'bold 13px "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const labelDistance = radius + 35
    const labelX = centerX + Math.cos(angle) * labelDistance
    const labelY = centerY + Math.sin(angle) * labelDistance
    
    // 添加标签背景
    const textWidth = ctx.measureText(dimensionData[index].name).width
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fillRect(labelX - textWidth/2 - 6, labelY - 10, textWidth + 12, 20)
    
    // 绘制标签文字
    ctx.fillStyle = '#2c3e50'
    ctx.fillText(dimensionData[index].name, labelX, labelY)
    ctx.restore()
  })
  
  // 绘制数据区域（更美观的渐变效果）
  ctx.beginPath()
  
  // 创建渐变填充
  const dataGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius)
  dataGradient.addColorStop(0, 'rgba(102, 126, 234, 0.4)')
  dataGradient.addColorStop(1, 'rgba(102, 126, 234, 0.15)')
  
  ctx.fillStyle = dataGradient
  ctx.strokeStyle = '#667eea'
  ctx.lineWidth = 3
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  
  dimensionData.forEach((data, index) => {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2
    const distance = (data.value / 100) * radius
    const x = centerX + Math.cos(angle) * distance
    const y = centerY + Math.sin(angle) * distance
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })
  
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  
  // 绘制数据点（更美观的样式）
  dimensionData.forEach((data, index) => {
    const angle = (Math.PI * 2 * index) / dimensions.length - Math.PI / 2
    const distance = (data.value / 100) * radius
    const x = centerX + Math.cos(angle) * distance
    const y = centerY + Math.sin(angle) * distance
    
    // 外圈
    ctx.beginPath()
    ctx.fillStyle = '#667eea'
    ctx.arc(x, y, 6, 0, Math.PI * 2)
    ctx.fill()
    
    // 内圈
    ctx.beginPath()
    ctx.fillStyle = '#ffffff'
    ctx.arc(x, y, 3, 0, Math.PI * 2)
    ctx.fill()
    
    // 数值标签
    ctx.save()
    ctx.fillStyle = '#667eea'
    ctx.font = 'bold 11px "Microsoft YaHei", sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'
    ctx.fillText(data.value.toFixed(0), x, y - 10)
    ctx.restore()
  })
}



// 获取使用率TOP数据
const fetchUsageTopData = async () => {
  if (!alertTimeRange.value || alertTimeRange.value.length !== 2) {
    ElMessage.warning('请先选择时间范围')
    return
  }

  usageTopLoading.value = true
  try {
    const startTime = Math.floor(new Date(alertTimeRange.value[0]).getTime() / 1000)
    const endTime = Math.floor(new Date(alertTimeRange.value[1]).getTime() / 1000)

    const response = await getUsageTop({
      start_time: startTime,
      end_time: endTime,
      top_count: topCount.value,
      dimensions: ["CPU", "内存", "磁盘", "网络", "Swap"]
    })

    // 处理数据，转换为数组格式便于遍历
    const dimensions = response.data.dimensions || {}
    usageTopData.value = Object.keys(dimensions).map(key => ({
      name: dimensions[key].name,
      unit: dimensions[key].unit,
      top_items: dimensions[key].top_items || []
    }))

    // 初始化图表引用数组
    usageTopChartRefs.value = new Array(usageTopData.value.length).fill(null)

    // 确保DOM渲染完成后再绘制图表
    nextTick(() => {
      setTimeout(() => {
        drawUsageTopCharts()
      }, 200) // 增加延迟时间确保DOM完全渲染
    })

  } catch (error) {
    ElMessage.error('获取使用率TOP数据失败')
  } finally {
    usageTopLoading.value = false
  }
}

// 刷新使用率TOP数据
const refreshUsageTop = () => {
  fetchUsageTopData()
}

// 绘制使用率TOP折线图
const drawUsageTopCharts = () => {
  // 确保图表引用数组长度正确
  if (usageTopChartRefs.value.length !== usageTopData.value.length) {
    usageTopChartRefs.value = new Array(usageTopData.value.length).fill(null)
  }

  usageTopData.value.forEach((dimension, dimIndex) => {
    // 使用更长的延迟确保DOM元素已渲染
    setTimeout(() => {
      const chartRef = usageTopChartRefs.value[dimIndex]
      
      if (!chartRef) {
        // 尝试重新获取DOM元素
        setTimeout(() => {
          drawSingleChart(dimension, dimIndex)
        }, 500)
        return
      }

      drawSingleChart(dimension, dimIndex)
    }, dimIndex * 200) // 增加延迟时间
  })
}

// 绘制单个图表的函数
const drawSingleChart = (dimension, dimIndex) => {
  const chartRef = usageTopChartRefs.value[dimIndex]
  
  if (!chartRef) {
    return
  }

  // 如果图表已存在，先销毁
  let chart = echarts.getInstanceByDom(chartRef)
  if (chart) {
    chart.dispose()
  }

  chart = echarts.init(chartRef)

  // 准备数据
  const ipColors = [
    '#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de',
    '#3ba272', '#fc8452', '#9a60b4', '#ea7ccc', '#4d6fff',
    '#ff9f7f', '#37c6ab', '#c4ebad', '#96dee8', '#ffa75f'
  ]

  // 收集所有时间点，用于统一对齐
  const allMinuteTimestamps = new Set()
  
  // 为每个IP生成时间序列数据，并将时间戳转换为整数分钟
  const processedData = dimension.top_items.map((item, itemIndex) => {
    const color = ipColors[itemIndex % ipColors.length]
    
    // 将时间戳转换为整数分钟，并按分钟分组取平均值
    const minuteData = new Map()
    
    item.time_series.forEach(point => {
      // 将时间戳转换为整数分钟（去掉秒数）
      const minuteTimestamp = Math.floor(point.timestamp / 60) * 60
      const usageRate = point.usage_rate
      
      if (!minuteData.has(minuteTimestamp)) {
        minuteData.set(minuteTimestamp, {
          sum: 0,
          count: 0,
          values: []
        })
      }
      
      const minuteInfo = minuteData.get(minuteTimestamp)
      minuteInfo.sum += usageRate
      minuteInfo.count += 1
      minuteInfo.values.push(usageRate)
    })
    
    // 计算每分钟的平均值，并收集所有时间点
    const averagedData = []
    minuteData.forEach((info, timestamp) => {
      allMinuteTimestamps.add(timestamp)
      averagedData.push({
        timestamp: timestamp * 1000, // 转换为毫秒
        usageRate: info.sum / info.count // 使用平均值
      })
    })
    
    // 按时间排序
    averagedData.sort((a, b) => a.timestamp - b.timestamp)
    return {
      name: item.ip,
      color: color,
      data: averagedData
    }
  })

  // 将所有时间点排序，用于对齐所有IP的数据
  const sortedTimestamps = Array.from(allMinuteTimestamps).sort((a, b) => a - b)
  
  // 为每个IP生成对齐后的时间序列数据
  const series = processedData.map(item => {
    const dataMap = new Map(item.data.map(d => [d.timestamp, d.usageRate]))
    
    const alignedData = sortedTimestamps.map(timestamp => {
      const timeInMs = timestamp * 1000
      const usageRate = dataMap.get(timeInMs)
      
      return {
        value: [
          timeInMs,
          usageRate !== undefined ? usageRate : null
        ]
      }
    })

    return {
      name: item.name,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      lineStyle: {
        width: 2
      },
      itemStyle: {
        color: item.color
      },
      areaStyle: {
        opacity: 0.1
      },
      data: alignedData,
      connectNulls: true // 连接空值，避免断线
    }
  })

  // 计算时间范围
  const minTime = sortedTimestamps.length > 0 ? sortedTimestamps[0] * 1000 : null
  const maxTime = sortedTimestamps.length > 0 ? sortedTimestamps[sortedTimestamps.length - 1] * 1000 : null

  const option = {
    title: {
      text: '',
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      formatter: function(params) {
        if (!params || params.length === 0) return ''
        
        const timestamp = params[0].value[0]
        const time = new Date(timestamp).toLocaleString('zh-CN')
        let result = `<div style="margin-bottom: 8px; font-weight: bold;">${time}</div>`
        
        params.forEach(param => {
          if (param.value[1] !== null && param.value[1] !== undefined) {
            result += `
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <span style="display: inline-block; width: 10px; height: 2px; background: ${param.color}; margin-right: 8px;"></span>
                <span style="margin-right: 8px;">${param.seriesName}:</span>
                <span style="font-weight: bold;">${param.value[1].toFixed(2)}${dimension.unit}</span>
              </div>
            `
          }
        })
        
        return result
      }
    },
    legend: {
      data: dimension.top_items.map(item => item.ip),
      top: 30,
      type: 'scroll',
      pageIconSize: 12,
      pageTextStyle: {
        color: '#333'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      min: minTime,
      max: maxTime,
      axisLabel: {
        formatter: function(value) {
          return new Date(value).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit'
          })
        }
      }
    },
    yAxis: {
      type: 'value',
      name: dimension.unit,
      axisLabel: {
        formatter: function(value) {
          return value.toFixed(1)
        }
      }
    },
    series: series,
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  }

  chart.setOption(option)

  // 监听窗口大小变化
  const resizeHandler = () => {
    chart?.resize()
  }
  window.addEventListener('resize', resizeHandler)
  
  // 保存resize处理器引用，便于清理
  chart._resizeHandler = resizeHandler
}

// 跳转到节点详情
const goToNodeDetail = (ip) => {
  router.push(`/nodes/${ip}`)
  showAllAlerts.value = false
  showAllScores.value = false
}

// 窗口大小变化处理
const handleResize = () => {
  if (machineScores.value.length > 0 && radarCanvas.value) {
    // 使用防抖避免频繁重绘
    if (resizeTimer.value) {
      clearTimeout(resizeTimer.value)
    }
    resizeTimer.value = setTimeout(() => {
      nextTick(() => {
        drawRadarChart()
      })
    }, 150)
  }
}

// 组件挂载时获取数据
onMounted(() => {
  // 设置默认告警时间范围为1小时
  alertTimeRange.value = getDefaultTimeRangeStrings()
  
  // 并行获取告警、评分和使用率TOP数据
  fetchAlerts()
  // 评分数据会在fetchAlerts完成后通过fetchScoringData获取
  // 使用率TOP数据会在fetchAlerts完成后通过fetchUsageTopData获取
  
  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)
})

// 监听评分数据变化，自动重绘雷达图
watch(() => scoringSummary.value.dimension_averages, () => {
  nextTick(() => {
    setTimeout(() => {
      drawRadarChart()
    }, 100)
  })
}, { deep: true })

// 组件卸载时移除监听
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (resizeTimer.value) {
    clearTimeout(resizeTimer.value)
  }
  
  // 清理使用率TOP图表
  usageTopChartRefs.value.forEach(chartRef => {
    if (chartRef) {
      const chart = echarts.getInstanceByDom(chartRef)
      if (chart) {
        if (chart._resizeHandler) {
          window.removeEventListener('resize', chart._resizeHandler)
        }
        chart.dispose()
      }
    }
  })
  usageTopChartRefs.value = []
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

/* 评分相关样式 */
.header-title {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #303133;
  flex-wrap: wrap;
}

.header-title .el-icon {
  margin-right: 8px;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 统计区域样式 */
.stats-area {
  height: 400px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 32px;
  padding: 24px;
}

.stat-item {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: #409EFF;
  line-height: 1;
}

/* 雷达图样式 */
.radar-chart-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  position: relative;
  overflow: hidden;
}

.radar-chart-container canvas {
  max-width: 100%;
  max-height: 100%;
  display: block;
}

/* 维度分数列表样式 */
.dimension-scores-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
  height: 400px;
}

.dimension-score-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.dimension-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dimension-info .dimension-name {
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.dimension-info .dimension-score {
  font-size: 18px;
  font-weight: 600;
  color: #409EFF;
}

.dimension-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bar-background {
  flex: 1;
  height: 8px;
  background: #e4e7ed;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-percentage {
  font-size: 12px;
  color: #909399;
  min-width: 40px;
  text-align: right;
}

/* 机器评分卡片列表样式 */
.machine-scores-container {
  margin-top: 20px;
}

.machine-scores-scroll {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 8px 0;
  scroll-behavior: smooth;
}

.machine-scores-scroll::-webkit-scrollbar {
  height: 6px;
}

.machine-scores-scroll::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.machine-scores-scroll::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.machine-scores-scroll::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.machine-score-card {
  min-width: 320px;
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.machine-score-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.machine-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.machine-ip {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.machine-dimensions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.machine-dimension-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dim-label {
  min-width: 50px;
  font-size: 12px;
  color: #606266;
  font-weight: 500;
}

.dim-score-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dim-bar-bg {
  flex: 1;
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.dim-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.dim-score-text {
  font-size: 12px;
  color: #303133;
  font-weight: 500;
  min-width: 20px;
}

.dim-alert-tag {
  font-size: 10px;
  padding: 0 4px;
  height: 16px;
  line-height: 16px;
}

.machine-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.eval-time {
  font-size: 11px;
  color: #909399;
}

.score-more {
  margin-top: 12px;
  text-align: center;
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

/* 使用率TOP图表样式 */
.usage-top-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: nowrap;
  gap: 16px;
}

.usage-top-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.control-label {
  color: #606266;
  font-size: 14px;
  white-space: nowrap;
}

.usage-top-charts {
  margin-top: 16px;
}

.chart-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.3s ease;
}

.chart-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.usage-top-chart {
  width: 100%;
  height: 300px;
  background: #fafafa;
  border-radius: 6px;
  padding: 8px;
}
/* 严重级别告警的酒红色样式 */
:deep(.el-tag--custom) {
  background-color: #722f37;
  border-color: #722f37;
  color: #ffffff;
}

:deep(.el-tag--custom.el-tag--dark) {
  background-color: #722f37;
  border-color: #722f37;
  color: #ffffff;
}

:deep(.el-tag--custom.el-tag--light) {
  background-color: #f0e6e8;
  border-color: #d9a7ad;
  color: #722f37;
}
</style>