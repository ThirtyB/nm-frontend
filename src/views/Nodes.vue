<template>
  <div class="nodes">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>节点监控</span>
          <div class="time-selector">
            <el-date-picker
              v-model="timeRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
              @change="handleTimeChange"
              :shortcuts="timeShortcuts"
            />
            <el-button 
              type="primary" 
              @click="fetchActiveIPs"
              :loading="loading"
              style="margin-left: 12px;"
            >
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </div>
        </div>
      </template>



      <el-table 
        :data="nodesData" 
        v-loading="loading"
        style="width: 100%; margin-top: 20px;"
        @row-click="handleRowClick"
      >
        <el-table-column prop="ip" label="IP地址" width="150" />
        <el-table-column prop="latest_ts" label="最新时间" width="180">
          <template #default="{ row }">
            {{ formatTimestamp(row.latest_ts) }}
          </template>
        </el-table-column>
        <el-table-column prop="cpu_usage_rate" label="CPU使用率" width="120">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.cpu_usage_rate || 0" 
              :color="getProgressColor(row.cpu_usage_rate)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="memory_usage_rate" label="内存使用率" width="120">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.memory_usage_rate || 0" 
              :color="getProgressColor(row.memory_usage_rate)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="disk_usage_rate" label="磁盘使用率" width="120">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.disk_usage_rate || 0" 
              :color="getProgressColor(row.disk_usage_rate)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="swap_usage_rate" label="Swap使用率" width="120">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.swap_usage_rate || 0" 
              :color="getProgressColor(row.swap_usage_rate)"
              :stroke-width="8"
            />
          </template>
        </el-table-column>
        <el-table-column prop="network_rate" label="网络速率" width="120">
          <template #default="{ row }">
            {{ formatNetworkRate(row.network_rate) }}
          </template>
        </el-table-column>
        <el-table-column label="系统评分" width="120">
          <template #default="{ row }">
            <div v-if="scoresMap[row.ip]">
              <el-tag 
                :type="getScoreTagType(scoresMap[row.ip].total_score)" 
                effect="dark"
                size="small"
              >
                {{ scoresMap[row.ip].total_score.toFixed(1) }}
              </el-tag>
            </div>
            <el-tag v-else type="info" size="small">无数据</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button 
              type="primary" 
              size="small"
              @click.stop="viewNodeDetail(row.ip)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import api from '@/utils/api'
import { getMachineScores } from '@/utils/scoringApi'

const router = useRouter()
const loading = ref(false)
const nodesData = ref([])
const totalNodes = ref(0)
const timeRange = ref([])

// 评分相关数据
const machineScores = ref([])
const scoresMap = ref({}) // IP到评分的映射

// 时间快捷选项
const timeShortcuts = [
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



// 获取进度条颜色
const getProgressColor = (percentage) => {
  if (percentage === null || percentage === undefined) return '#909399'
  if (percentage < 60) return '#67C23A'
  if (percentage < 80) return '#E6A23C'
  return '#F56C6C'
}

// 格式化时间戳
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp * 1000).toLocaleString('zh-CN')
}

// 格式化网络速率
const formatNetworkRate = (rate) => {
  if (rate === null || rate === undefined) return '-'
  if (rate < 1024) return `${rate.toFixed(2)} KB/s`
  return `${(rate / 1024).toFixed(2)} MB/s`
}

// 处理时间变化
const handleTimeChange = () => {
  if (timeRange.value && timeRange.value.length === 2) {
    fetchActiveIPs()
  }
}

// 获取活跃IP列表
const fetchActiveIPs = async () => {
  if (!timeRange.value || timeRange.value.length !== 2) {
    ElMessage.warning('请选择时间范围')
    return
  }

  loading.value = true
  try {
    const startTime = Math.floor(new Date(timeRange.value[0]).getTime() / 1000)
    const endTime = Math.floor(new Date(timeRange.value[1]).getTime() / 1000)

    const response = await api.get('/node-monitor/active-ips', {
      params: {
        start_time: startTime,
        end_time: endTime
      }
    })

    nodesData.value = response.data.active_ips || []
    totalNodes.value = response.data.total_count || 0

    if (nodesData.value.length === 0) {
      ElMessage.info('选定时间范围内没有活跃节点')
    }
  } catch (error) {
    console.error('获取活跃IP列表失败:', error)
    ElMessage.error('获取节点数据失败')
  } finally {
    loading.value = false
  }
  
  // 同时获取评分数据
  fetchScores()
}

// 查看节点详情
const viewNodeDetail = (ip) => {
  try {
    const query = {}
    if (timeRange.value && timeRange.value.length === 2) {
      query.startTime = Math.floor(new Date(timeRange.value[0]).getTime() / 1000)
      query.endTime = Math.floor(new Date(timeRange.value[1]).getTime() / 1000)
    }
    
    router.push({ 
      path: `/nodes/${ip}`,
      query 
    })
  } catch (error) {
    console.error('路由跳转失败:', error)
    ElMessage.error('页面跳转失败')
  }
}

// 行点击事件
const handleRowClick = (row) => {
  viewNodeDetail(row.ip)
}

// 获取评分标签类型
const getScoreTagType = (score) => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'warning'
  if (score >= 40) return 'danger'
  return 'info'
}

// 获取评分数据
const fetchScores = async () => {
  if (!timeRange.value || timeRange.value.length !== 2) {
    console.warn('时间范围未设置，跳过获取评分数据')
    return
  }

  try {
    const startTime = Math.floor(new Date(timeRange.value[0]).getTime() / 1000)
    const endTime = Math.floor(new Date(timeRange.value[1]).getTime() / 1000)

    const response = await getMachineScores({ 
      start_time: startTime, 
      end_time: endTime,
      include_details: false 
    })
    machineScores.value = response.data.scores || []
    
    // 创建IP到评分的映射
    const newScoresMap = {}
    machineScores.value.forEach(score => {
      newScoresMap[score.ip] = score
    })
    scoresMap.value = newScoresMap
  } catch (error) {
    console.error('获取评分数据失败:', error)
  }
}

// 初始化时间范围（默认最近24小时）
onMounted(() => {
  const end = new Date()
  const start = new Date()
  start.setTime(start.getTime() - 3600 * 1000 * 24)
  timeRange.value = [
    start.toISOString().slice(0, 19).replace('T', ' '),
    end.toISOString().slice(0, 19).replace('T', ' ')
  ]
  fetchActiveIPs()
  // fetchScores会在fetchActiveIPs完成后自动调用
})
</script>

<style scoped>
.nodes {
  max-width: 1400px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.time-selector {
  display: flex;
  align-items: center;
}



.el-table {
  cursor: pointer;
}

.el-table :deep(.el-table__row) {
  transition: background-color 0.3s;
}

.el-table :deep(.el-table__row:hover) {
  background-color: #f5f7fa;
}

:deep(.el-progress-bar__outer) {
  background-color: #f0f2f5;
}
</style>