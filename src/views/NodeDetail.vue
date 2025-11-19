<template>
  <div class="node-detail">
    <el-card>
      <template #header>
        <div class="card-header">
          <div class="node-info">
            <el-button 
              type="text" 
              @click="goBack"
              style="margin-right: 12px; padding: 0;"
            >
              <el-icon><ArrowLeft /></el-icon>
            </el-button>
            <span>节点详情 - {{ nodeIp }}</span>
          </div>
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
              @click="fetchNodeMetrics"
              :loading="loading"
              style="margin-left: 12px;"
            >
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </div>
        </div>
      </template>

      <!-- 五维数据展示 -->
      <div class="five-dimension-overview" v-if="!loading && metricsData.length > 0">
        <el-row :gutter="20">
          <!-- CPU模块 -->
          <el-col :span="12">
            <el-card class="dimension-card">
              <template #header>
                <div class="dimension-header">
                  <el-icon color="#409EFF"><Cpu /></el-icon>
                  <span>CPU使用情况</span>
                </div>
              </template>
              <div class="dimension-content">
                <el-row :gutter="16">
                  <el-col :span="8">
                    <el-statistic title="用户使用率" :value="latestMetrics.cpu_usr" suffix="%" />
                  </el-col>
                  <el-col :span="8">
                    <el-statistic title="系统使用率" :value="latestMetrics.cpu_sys" suffix="%" />
                  </el-col>
                  <el-col :span="8">
                    <el-statistic title="IO等待率" :value="latestMetrics.cpu_iow" suffix="%" />
                  </el-col>
                </el-row>
                <el-divider />
                <el-row>
                  <el-col :span="12">
                    <el-statistic title="总使用率" :value="latestMetrics.cpu_total" suffix="%" />
                  </el-col>
                  <el-col :span="12">
                    <el-statistic title="中断次数" :value="latestMetrics.system_in" />
                  </el-col>
                </el-row>
              </div>
            </el-card>
          </el-col>

          <!-- 内存模块 -->
          <el-col :span="12">
            <el-card class="dimension-card">
              <template #header>
                <div class="dimension-header">
                  <el-icon color="#67C23A"><DataBoard /></el-icon>
                  <span>内存使用情况</span>
                </div>
              </template>
              <div class="dimension-content">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-statistic title="总内存" :value="latestMetrics.mem_total_mb" suffix="MB" />
                  </el-col>
                  <el-col :span="12">
                    <el-statistic title="空闲内存" :value="latestMetrics.mem_free_mb" suffix="MB" />
                  </el-col>
                </el-row>
                <el-divider />
                <el-row>
                  <el-col :span="8">
                    <el-statistic title="缓冲区" :value="latestMetrics.mem_buff_mb" suffix="MB" />
                  </el-col>
                  <el-col :span="8">
                    <el-statistic title="缓存" :value="latestMetrics.mem_cache_mb" suffix="MB" />
                  </el-col>
                  <el-col :span="8">
                    <el-statistic title="使用率" :value="latestMetrics.memory_usage_rate" suffix="%" />
                  </el-col>
                </el-row>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px;">
          <!-- 磁盘模块 -->
          <el-col :span="12">
            <el-card class="dimension-card">
              <template #header>
                <div class="dimension-header">
                  <el-icon color="#E6A23C"><Coin /></el-icon>
                  <span>磁盘使用情况</span>
                </div>
              </template>
              <div class="dimension-content">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <div class="text-statistic">
                      <div class="text-statistic-title">磁盘名称</div>
                      <div class="text-statistic-value">{{ latestMetrics.disk_name }}</div>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <el-statistic title="总容量" :value="latestMetrics.disk_total_gb" suffix="GB" />
                  </el-col>
                </el-row>
                <el-divider />
                <el-row>
                  <el-col :span="8">
                    <el-statistic title="已使用" :value="latestMetrics.disk_used_gb" suffix="GB" />
                  </el-col>
                  <el-col :span="8">
                    <el-statistic title="使用率" :value="latestMetrics.disk_usage_rate" suffix="%" />
                  </el-col>
                  <el-col :span="8">
                    <el-statistic title="IOPS" :value="latestMetrics.disk_iops" />
                  </el-col>
                </el-row>
              </div>
            </el-card>
          </el-col>

          <!-- 网络模块 -->
          <el-col :span="12">
            <el-card class="dimension-card">
              <template #header>
                <div class="dimension-header">
                  <el-icon color="#F56C6C"><Connection /></el-icon>
                  <span>网络使用情况</span>
                </div>
              </template>
              <div class="dimension-content">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-statistic title="接收速率" :value="latestMetrics.net_rx_kbps" suffix="KB/s" />
                  </el-col>
                  <el-col :span="12">
                    <el-statistic title="发送速率" :value="latestMetrics.net_tx_kbps" suffix="KB/s" />
                  </el-col>
                </el-row>
                <el-divider />
                <el-row>
                  <el-col :span="12">
                    <el-statistic title="总接收量" :value="latestMetrics.net_rx_mb" suffix="MB" />
                  </el-col>
                  <el-col :span="12">
                    <el-statistic title="总发送量" :value="latestMetrics.net_tx_mb" suffix="MB" />
                  </el-col>
                </el-row>
              </div>
            </el-card>
          </el-col>
        </el-row>

        <el-row :gutter="20" style="margin-top: 20px;">
          <!-- Swap模块 -->
          <el-col :span="12">
            <el-card class="dimension-card">
              <template #header>
                <div class="dimension-header">
                  <el-icon color="#909399"><Refresh /></el-icon>
                  <span>Swap使用情况</span>
                </div>
              </template>
              <div class="dimension-content">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <el-statistic title="Swap总量" :value="latestMetrics.swap_total_mb" suffix="MB" />
                  </el-col>
                  <el-col :span="12">
                    <el-statistic title="已使用" :value="latestMetrics.swap_used_mb" suffix="MB" />
                  </el-col>
                </el-row>
                <el-divider />
                <el-row>
                  <el-col :span="8">
                    <el-statistic title="换入量" :value="latestMetrics.swap_in" />
                  </el-col>
                  <el-col :span="8">
                    <el-statistic title="换出量" :value="latestMetrics.swap_out" />
                  </el-col>
                  <el-col :span="8">
                    <el-statistic title="使用率" :value="latestMetrics.swap_usage_rate" suffix="%" />
                  </el-col>
                </el-row>
              </div>
            </el-card>
          </el-col>

          <!-- 系统信息模块 -->
          <el-col :span="12">
            <el-card class="dimension-card">
              <template #header>
                <div class="dimension-header">
                  <el-icon color="#409EFF"><Monitor /></el-icon>
                  <span>系统信息</span>
                </div>
              </template>
              <div class="dimension-content">
                <el-row :gutter="16">
                  <el-col :span="12">
                    <div class="text-statistic">
                      <div class="text-statistic-title">版本信息</div>
                      <div class="text-statistic-value">{{ latestMetrics.version }}</div>
                    </div>
                  </el-col>
                  <el-col :span="12">
                    <div class="text-statistic">
                      <div class="text-statistic-title">数据ID</div>
                      <div class="text-statistic-value">{{ latestMetrics.id }}</div>
                    </div>
                  </el-col>
                </el-row>
                <el-divider />
                <el-row>
                  <el-col :span="12">
                    <el-statistic title="上下文切换" :value="latestMetrics.system_cs" />
                  </el-col>
                  <el-col :span="12">
                    <div class="text-statistic">
                      <div class="text-statistic-title">更新时间</div>
                      <div class="text-statistic-value">{{ formatTimestamp(latestMetrics.ts) }}</div>
                    </div>
                  </el-col>
                </el-row>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 图表展示 -->
      <div class="charts-section" v-if="!loading && metricsData.length > 0">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>CPU使用率趋势</span>
              </template>
              <div ref="cpuChart" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>内存使用率趋势</span>
              </template>
              <div ref="memoryChart" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>磁盘使用率趋势</span>
              </template>
              <div ref="diskChart" class="chart-container"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>网络速率趋势</span>
              </template>
              <div ref="networkChart" class="chart-container"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 详细数据表格 -->
      <div class="data-table" v-if="!loading && metricsData.length > 0">
        <el-card>
          <template #header>
            <div class="table-header">
              <span>详细监控数据</span>
              <el-button 
                type="success" 
                size="small"
                @click="exportData"
              >
                <el-icon><Download /></el-icon>
                导出数据
              </el-button>
            </div>
          </template>
          
          <el-table 
            :data="paginatedData" 
            style="width: 100%"
            height="400"
          >
            <el-table-column prop="ts" label="时间" width="180">
              <template #default="{ row }">
                {{ formatTimestamp(row.ts) }}
              </template>
            </el-table-column>
            <el-table-column prop="cpu_usr" label="CPU用户%" width="100">
              <template #default="{ row }">
                {{ row.cpu_usr?.toFixed(2) || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="cpu_sys" label="CPU系统%" width="100">
              <template #default="{ row }">
                {{ row.cpu_sys?.toFixed(2) || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="cpu_iow" label="CPU等待%" width="100">
              <template #default="{ row }">
                {{ row.cpu_iow?.toFixed(2) || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="mem_total" label="总内存(MB)" width="120">
              <template #default="{ row }">
                {{ row.mem_total ? (row.mem_total / 1024).toFixed(2) : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="mem_free" label="空闲内存(MB)" width="120">
              <template #default="{ row }">
                {{ row.mem_free ? (row.mem_free / 1024).toFixed(2) : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="disk_total" label="总磁盘(GB)" width="120">
              <template #default="{ row }">
                {{ row.disk_total ? (row.disk_total / 1024 / 1024 / 1024).toFixed(2) : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="disk_used" label="已用磁盘(GB)" width="120">
              <template #default="{ row }">
                {{ row.disk_used ? (row.disk_used / 1024 / 1024 / 1024).toFixed(2) : '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="net_rx_kbps" label="网络接收(KB/s)" width="130">
              <template #default="{ row }">
                {{ row.net_rx_kbps?.toFixed(2) || '-' }}
              </template>
            </el-table-column>
            <el-table-column prop="net_tx_kbps" label="网络发送(KB/s)" width="130">
              <template #default="{ row }">
                {{ row.net_tx_kbps?.toFixed(2) || '-' }}
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[20, 50, 100, 200]"
              :total="metricsData.length"
              layout="total, sizes, prev, pager, next, jumper"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>

      <!-- 空状态 -->
      <el-empty v-if="!loading && metricsData.length === 0" description="暂无数据" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  ArrowLeft, Refresh, Cpu, Coin, Connection, Download, DataBoard, Monitor 
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import api from '@/utils/api'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const metricsData = ref([])
const timeRange = ref([])
const currentPage = ref(1)
const pageSize = ref(20)

const nodeIp = ref(route.params.ip)

// 图表实例
const cpuChart = ref(null)
const memoryChart = ref(null)
const diskChart = ref(null)
const networkChart = ref(null)

let cpuChartInstance = null
let memoryChartInstance = null
let diskChartInstance = null
let networkChartInstance = null

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

// 计算最新指标
const latestMetrics = computed(() => {
  if (!metricsData.value.length) return {}
  const latest = metricsData.value[metricsData.value.length - 1]
  
  // CPU相关
  const cpu_usr = (latest.cpu_usr || 0).toFixed(2)
  const cpu_sys = (latest.cpu_sys || 0).toFixed(2)
  const cpu_iow = (latest.cpu_iow || 0).toFixed(2)
  const cpu_total = ((latest.cpu_usr || 0) + (latest.cpu_sys || 0) + (latest.cpu_iow || 0)).toFixed(2)
  
  // 内存相关
  const mem_total_mb = (latest.mem_total / 1024).toFixed(2)
  const mem_free_mb = (latest.mem_free / 1024).toFixed(2)
  const mem_buff_mb = (latest.mem_buff / 1024).toFixed(2)
  const mem_cache_mb = (latest.mem_cache / 1024).toFixed(2)
  let memory_usage_rate = 0
  if (latest.mem_total && latest.mem_free) {
    memory_usage_rate = ((latest.mem_total - latest.mem_free) / latest.mem_total * 100).toFixed(2)
  }
  
  // 磁盘相关
  const disk_name = latest.disk_name || '/'
  const disk_total_gb = (latest.disk_total / 1024 / 1024 / 1024).toFixed(2)
  const disk_used_gb = (latest.disk_used / 1024 / 1024 / 1024).toFixed(2)
  const disk_usage_rate = (latest.disk_used_percent || 0).toFixed(2)
  const disk_iops = latest.disk_iops || 0
  
  // 网络相关
  const net_rx_kbps = (latest.net_rx_kbps || 0).toFixed(2)
  const net_tx_kbps = (latest.net_tx_kbps || 0).toFixed(2)
  const net_rx_mb = Math.abs(latest.net_rx_kbytes / 1024).toFixed(2)
  const net_tx_mb = Math.abs(latest.net_tx_kbytes / 1024).toFixed(2)
  
  // Swap相关
  const swap_total_mb = (latest.swap_total / 1024).toFixed(2)
  const swap_used_mb = (latest.swap_used / 1024).toFixed(2)
  let swap_usage_rate = 0
  if (latest.swap_total && latest.swap_total > 0) {
    swap_usage_rate = (latest.swap_used / latest.swap_total * 100).toFixed(2)
  }
  const swap_in = latest.swap_in || 0
  const swap_out = latest.swap_out || 0
  
  // 系统相关
  const version = latest.version || 'N/A'
  const id = latest.id || 'N/A'
  const system_in = latest.system_in || 0
  const system_cs = latest.system_cs || 0
  const ts = latest.ts || 0
  
  return {
    // CPU
    cpu_usr: parseFloat(cpu_usr),
    cpu_sys: parseFloat(cpu_sys),
    cpu_iow: parseFloat(cpu_iow),
    cpu_total: parseFloat(cpu_total),
    
    // 内存
    mem_total_mb: parseFloat(mem_total_mb),
    mem_free_mb: parseFloat(mem_free_mb),
    mem_buff_mb: parseFloat(mem_buff_mb),
    mem_cache_mb: parseFloat(mem_cache_mb),
    memory_usage_rate: parseFloat(memory_usage_rate),
    
    // 磁盘
    disk_name: disk_name,
    disk_total_gb: parseFloat(disk_total_gb),
    disk_used_gb: parseFloat(disk_used_gb),
    disk_usage_rate: parseFloat(disk_usage_rate),
    disk_iops: disk_iops,
    
    // 网络
    net_rx_kbps: parseFloat(net_rx_kbps),
    net_tx_kbps: parseFloat(net_tx_kbps),
    net_rx_mb: parseFloat(net_rx_mb),
    net_tx_mb: parseFloat(net_tx_mb),
    
    // Swap
    swap_total_mb: parseFloat(swap_total_mb),
    swap_used_mb: parseFloat(swap_used_mb),
    swap_usage_rate: parseFloat(swap_usage_rate),
    swap_in: swap_in,
    swap_out: swap_out,
    
    // 系统
    version: version,
    id: id,
    system_in: system_in,
    system_cs: system_cs,
    ts: ts
  }
})

// 分页数据
const paginatedData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return metricsData.value.slice(start, end)
})

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

// 返回节点列表
const goBack = () => {
  router.push('/nodes')
}

// 处理时间变化
const handleTimeChange = () => {
  if (timeRange.value && timeRange.value.length === 2) {
    fetchNodeMetrics()
  }
}

// 获取节点监控数据
const fetchNodeMetrics = async () => {
  if (!timeRange.value || timeRange.value.length !== 2) {
    ElMessage.warning('请选择时间范围')
    return
  }

  loading.value = true
  try {
    const startTime = Math.floor(new Date(timeRange.value[0]).getTime() / 1000)
    const endTime = Math.floor(new Date(timeRange.value[1]).getTime() / 1000)

    const response = await api.get(`/node-monitor/ip-metrics/${nodeIp.value}`, {
      params: {
        start_time: startTime,
        end_time: endTime
      }
    })

    metricsData.value = response.data || []
    currentPage.value = 1

    if (metricsData.value.length === 0) {
      ElMessage.info('选定时间范围内没有监控数据')
    } else {
      // 渲染图表
      nextTick(() => {
        renderCharts()
      })
    }
  } catch (error) {
    console.error('获取节点监控数据失败:', error)
    ElMessage.error('获取节点数据失败')
  } finally {
    loading.value = false
  }
}

// 渲染图表
const renderCharts = () => {
  const times = metricsData.value.map(item => formatTimestamp(item.ts))
  const cpuData = metricsData.value.map(item => 
    ((item.cpu_usr || 0) + (item.cpu_sys || 0) + (item.cpu_iow || 0)).toFixed(2)
  )
  const memoryData = metricsData.value.map(item => {
    if (!item.mem_total || !item.mem_free) return 0
    return ((item.mem_total - item.mem_free) / item.mem_total * 100).toFixed(2)
  })
  const diskData = metricsData.value.map(item => item.disk_used_percent || 0)
  const networkData = metricsData.value.map(item => 
    ((item.net_rx_kbps || 0) + (item.net_tx_kbps || 0)).toFixed(2)
  )

  // CPU图表
  if (cpuChart.value) {
    cpuChartInstance = echarts.init(cpuChart.value)
    cpuChartInstance.setOption({
      title: { text: '', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: times, axisLabel: { rotate: 45 } },
      yAxis: { type: 'value', name: '使用率(%)', max: 100 },
      series: [{ name: 'CPU使用率', type: 'line', data: cpuData, smooth: true }]
    })
  }

  // 内存图表
  if (memoryChart.value) {
    memoryChartInstance = echarts.init(memoryChart.value)
    memoryChartInstance.setOption({
      title: { text: '', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: times, axisLabel: { rotate: 45 } },
      yAxis: { type: 'value', name: '使用率(%)', max: 100 },
      series: [{ name: '内存使用率', type: 'line', data: memoryData, smooth: true }]
    })
  }

  // 磁盘图表
  if (diskChart.value) {
    diskChartInstance = echarts.init(diskChart.value)
    diskChartInstance.setOption({
      title: { text: '', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: times, axisLabel: { rotate: 45 } },
      yAxis: { type: 'value', name: '使用率(%)', max: 100 },
      series: [{ name: '磁盘使用率', type: 'line', data: diskData, smooth: true }]
    })
  }

  // 网络图表
  if (networkChart.value) {
    networkChartInstance = echarts.init(networkChart.value)
    networkChartInstance.setOption({
      title: { text: '', textStyle: { fontSize: 14 } },
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: times, axisLabel: { rotate: 45 } },
      yAxis: { type: 'value', name: '网络速率(KB/s)' },
      series: [{ name: '网络速率', type: 'line', data: networkData, smooth: true }]
    })
  }
}

// 分页处理
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 导出数据
const exportData = () => {
  const csvContent = [
    ['时间', 'CPU用户%', 'CPU系统%', 'CPU等待%', '总内存(MB)', '空闲内存(MB)', '总磁盘(GB)', '已用磁盘(GB)', '网络接收(KB/s)', '网络发送(KB/s)'],
    ...metricsData.value.map(item => [
      formatTimestamp(item.ts),
      item.cpu_usr?.toFixed(2) || '',
      item.cpu_sys?.toFixed(2) || '',
      item.cpu_iow?.toFixed(2) || '',
      item.mem_total ? (item.mem_total / 1024).toFixed(2) : '',
      item.mem_free ? (item.mem_free / 1024).toFixed(2) : '',
      item.disk_total ? (item.disk_total / 1024 / 1024 / 1024).toFixed(2) : '',
      item.disk_used ? (item.disk_used / 1024 / 1024 / 1024).toFixed(2) : '',
      item.net_rx_kbps?.toFixed(2) || '',
      item.net_tx_kbps?.toFixed(2) || ''
    ])
  ].map(row => row.join(',')).join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `node_${nodeIp.value}_metrics.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  ElMessage.success('数据导出成功')
}

// 初始化
onMounted(() => {
  // 从查询参数获取时间范围
  if (route.query.startTime && route.query.endTime) {
    const startTime = new Date(parseInt(route.query.startTime) * 1000)
    const endTime = new Date(parseInt(route.query.endTime) * 1000)
    timeRange.value = [
      startTime.toISOString().slice(0, 19).replace('T', ' '),
      endTime.toISOString().slice(0, 19).replace('T', ' ')
    ]
  } else {
    // 默认最近24小时
    const end = new Date()
    const start = new Date()
    start.setTime(start.getTime() - 3600 * 1000 * 24)
    timeRange.value = [
      start.toISOString().slice(0, 19).replace('T', ' '),
      end.toISOString().slice(0, 19).replace('T', ' ')
    ]
  }
  
  fetchNodeMetrics()
})
</script>

<style scoped>
.node-detail {
  max-width: 1600px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.node-info {
  display: flex;
  align-items: center;
}

.time-selector {
  display: flex;
  align-items: center;
}

.five-dimension-overview {
  margin-bottom: 20px;
}

.dimension-card {
  height: 100%;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dimension-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.dimension-header .el-icon {
  margin-right: 8px;
  font-size: 18px;
}

.dimension-content {
  padding: 8px 0;
}

.dimension-content :deep(.el-statistic) {
  text-align: center;
}

.dimension-content :deep(.el-statistic__head) {
  color: #909399;
  font-size: 12px;
  margin-bottom: 4px;
}

.dimension-content :deep(.el-statistic__content) {
  color: #303133;
  font-size: 20px;
  font-weight: 600;
}

.text-statistic {
  text-align: center;
  padding: 8px 0;
}

.text-statistic-title {
  color: #909399;
  font-size: 12px;
  margin-bottom: 4px;
}

.text-statistic-value {
  color: #303133;
  font-size: 20px;
  font-weight: 600;
  word-break: break-all;
}

.charts-section {
  margin-bottom: 20px;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.data-table {
  margin-top: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

:deep(.el-card__header) {
  padding: 18px 20px;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-statistic__head) {
  color: #909399;
  font-size: 14px;
}

:deep(.el-statistic__content) {
  color: #303133;
  font-size: 24px;
  font-weight: 600;
}
</style>