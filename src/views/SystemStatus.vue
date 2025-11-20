<template>
  <div class="system-status">
    <div class="page-header">
      <h1>系统存活状态</h1>
      <div class="refresh-controls">
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
          style="margin-right: 12px;"
        />
        <el-button 
          type="primary" 
          @click="refreshStatus"
          :loading="loading"
          icon="Refresh"
        >
          刷新状态
        </el-button>
        <el-tag :type="getStatusTagType(lastUpdateTime)">
          最后更新: {{ formatTime(lastUpdateTime) }}
        </el-tag>
      </div>
    </div>

    <div class="status-chart-container">
      <div ref="chartRef" class="status-chart"></div>
    </div>

    <div class="status-legend">
      <div class="legend-flow">
        <div class="legend-item">
          <div class="legend-icon data-collection"></div>
          <span>数据采集</span>
        </div>
        <div class="legend-arrow">→</div>
        <div class="legend-item">
          <div class="legend-icon kafka"></div>
          <span>Kafka</span>
        </div>
        <div class="legend-arrow">→</div>
        <div class="legend-item">
          <div class="legend-icon backend"></div>
          <span>后端</span>
        </div>
        <div class="legend-arrow">→</div>
        <div class="legend-item">
          <div class="legend-icon frontend"></div>
          <span>前端</span>
        </div>
      </div>
      <div class="legend-status">
        <div class="legend-item">
          <div class="legend-icon online"></div>
          <span>在线</span>
        </div>
        <div class="legend-item">
          <div class="legend-icon offline"></div>
          <span>离线</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'
import api from '@/utils/api'

const chartRef = ref(null)
const chart = ref(null)
const loading = ref(false)
const serviceData = ref([])
const lastUpdateTime = ref(new Date())
const timeRange = ref([])

// 时间快捷选项
const timeShortcuts = [
  {
    text: '最近5分钟',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 5 * 60 * 1000)
      return [start, end]
    },
  },
  {
    text: '最近15分钟',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 15 * 60 * 1000)
      return [start, end]
    },
  },
  {
    text: '最近30分钟',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 30 * 60 * 1000)
      return [start, end]
    },
  },
  {
    text: '最近1小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 60 * 60 * 1000)
      return [start, end]
    },
  },
  {
    text: '最近2小时',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 2 * 60 * 60 * 1000)
      return [start, end]
    },
  }
]

// 处理时间范围变化
const handleTimeChange = (value) => {
  if (value && value.length === 2) {
    fetchSystemStatus()
  }
}

// 获取系统状态
const fetchSystemStatus = async () => {
  try {
    loading.value = true
    
    let startTime, endTime
    
    if (timeRange.value && timeRange.value.length === 2) {
      startTime = new Date(timeRange.value[0])
      endTime = new Date(timeRange.value[1])
    } else {
      endTime = new Date()
      startTime = new Date(endTime.getTime() - 5 * 60 * 1000) // 默认最近5分钟
      timeRange.value = [
        startTime.toISOString().slice(0, 19).replace('T', ' '),
        endTime.toISOString().slice(0, 19).replace('T', ' ')
      ]
    }

    const requestData = {
      start_time: Math.floor(startTime.getTime() / 1000),
      end_time: Math.floor(endTime.getTime() / 1000)
    }
    
    console.log('发送的请求数据:', requestData)
    console.log('startTime:', startTime, '时间戳:', requestData.start_time)
    console.log('endTime:', endTime, '时间戳:', requestData.end_time)
    
    const response = await api.post('/heartbeat/status', requestData)

    console.log('系统状态数据:', response.data)
    serviceData.value = response.data
    lastUpdateTime.value = new Date()
    
    updateChart()
  } catch (error) {
    console.error('获取系统状态失败:', error)
    ElMessage.error('获取系统状态失败')
  } finally {
    loading.value = false
  }
}

// 刷新状态
const refreshStatus = () => {
  fetchSystemStatus()
}

// 格式化时间
const formatTime = (time) => {
  return time.toLocaleTimeString('zh-CN')
}

// 获取状态标签类型
const getStatusTagType = (time) => {
  const diff = Date.now() - time.getTime()
  if (diff < 30000) return 'success'
  if (diff < 60000) return 'warning'
  return 'danger'
}

// 更新图表
const updateChart = () => {
  if (!chart.value) return

  // 处理数据 - 后端返回的是按服务类型分组的对象
  const dataCollectors = []
  const kafkaServices = []
  const backendServices = []
  const frontendServices = []

  // 处理数据采集服务
  if (serviceData.value['数据采集']) {
    serviceData.value['数据采集'].forEach(service => {
      dataCollectors.push({
        name: service.service_name,
        ip: service.ip_address,
        online: service.is_online,
        lastReport: service.last_report_time
      })
    })
  }

  // 处理kafka服务
  if (serviceData.value['kafka进程']) {
    serviceData.value['kafka进程'].forEach(service => {
      kafkaServices.push({
        name: service.service_name,
        ip: service.ip_address,
        online: service.is_online,
        lastReport: service.last_report_time
      })
    })
  }

  // 处理前端服务
  if (serviceData.value['前端']) {
    serviceData.value['前端'].forEach(service => {
      frontendServices.push({
        name: service.service_name,
        ip: service.ip_address,
        online: service.is_online,
        lastReport: service.last_report_time
      })
    })
  }

  // 处理后端服务
  if (serviceData.value['后端']) {
    serviceData.value['后端'].forEach(service => {
      backendServices.push({
        name: service.service_name,
        ip: service.ip_address,
        online: service.is_online,
        lastReport: service.last_report_time
      })
    })
  }

  // 创建桑基图节点和连接
  const nodes = []
  const links = []

  // 数据采集层节点
  dataCollectors.forEach((collector, index) => {
    nodes.push({
      name: collector.name,
      value: collector.online ? 10 : 5,
      itemStyle: {
        color: collector.online ? '#409EFF' : '#CCCCCC'
      },
      tooltip: {
        formatter: `${collector.name}<br/>状态: ${collector.online ? '在线' : '离线'}<br/>IP: ${collector.ip}`
      }
    })
  })

  // Kafka层节点
  kafkaServices.forEach((kafka, index) => {
    nodes.push({
      name: kafka.name,
      value: kafka.online ? 15 : 8,
      itemStyle: {
        color: kafka.online ? '#E6A23C' : '#CCCCCC'
      },
      tooltip: {
        formatter: `${kafka.name}<br/>状态: ${kafka.online ? '在线' : '离线'}<br/>IP: ${kafka.ip}`
      }
    })
  })

  // 后端层节点
  backendServices.forEach((backend, index) => {
    nodes.push({
      name: backend.name,
      value: backend.online ? 12 : 6,
      itemStyle: {
        color: backend.online ? '#67C23A' : '#CCCCCC'
      },
      tooltip: {
        formatter: `${backend.name}<br/>状态: ${backend.online ? '在线' : '离线'}<br/>IP: ${backend.ip}`
      }
    })
  })

  // 前端层节点
  frontendServices.forEach((frontend, index) => {
    nodes.push({
      name: frontend.name,
      value: frontend.online ? 12 : 6,
      itemStyle: {
        color: frontend.online ? '#F56C6C' : '#CCCCCC'
      },
      tooltip: {
        formatter: `${frontend.name}<br/>状态: ${frontend.online ? '在线' : '离线'}<br/>IP: ${frontend.ip}`
      }
    })
  })

  // 创建连接：数据采集 -> Kafka
  const kafkaStartIndex = dataCollectors.length
  
  dataCollectors.forEach((collector, collectorIndex) => {
    kafkaServices.forEach((kafka, kafkaIndex) => {
      const sourceIndex = collectorIndex
      const targetIndex = kafkaStartIndex + kafkaIndex
      const value = (collector.online && kafka.online) ? 8 : 2
      
      links.push({
        source: sourceIndex,
        target: targetIndex,
        value: value,
        lineStyle: {
          color: (collector.online && kafka.online) ? '#67C23A' : '#CCCCCC',
          opacity: (collector.online && kafka.online) ? 0.8 : 0.3
        }
      })
    })
  })

  // 创建连接：Kafka -> 后端
  const backendStartIndex = kafkaStartIndex + kafkaServices.length
  
  kafkaServices.forEach((kafka, kafkaIndex) => {
    backendServices.forEach((backend, backendIndex) => {
      const sourceIndex = kafkaStartIndex + kafkaIndex
      const targetIndex = backendStartIndex + backendIndex
      const value = (kafka.online && backend.online) ? 6 : 1
      
      links.push({
        source: sourceIndex,
        target: targetIndex,
        value: value,
        lineStyle: {
          color: (kafka.online && backend.online) ? '#67C23A' : '#CCCCCC',
          opacity: (kafka.online && backend.online) ? 0.8 : 0.3
        }
      })
    })
  })

  // 创建连接：后端 -> 前端
  const frontendStartIndex = backendStartIndex + backendServices.length
  
  backendServices.forEach((backend, backendIndex) => {
    frontendServices.forEach((frontend, frontendIndex) => {
      const sourceIndex = backendStartIndex + backendIndex
      const targetIndex = frontendStartIndex + frontendIndex
      const value = (backend.online && frontend.online) ? 4 : 0.5
      
      links.push({
        source: sourceIndex,
        target: targetIndex,
        value: value,
        lineStyle: {
          color: (backend.online && frontend.online) ? '#67C23A' : '#CCCCCC',
          opacity: (backend.online && frontend.online) ? 0.8 : 0.3
        }
      })
    })
  })

  const option = {
    title: {
      text: '系统架构存活状态桑基图',
      left: 'center',
      top: 20,
      textStyle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333'
      }
    },
    tooltip: {
      trigger: 'item',
      triggerOn: 'mousemove'
    },
    series: [
      {
        type: 'sankey',
        data: nodes,
        links: links,
        emphasis: {
          focus: 'adjacency'
        },
        levels: [{
          depth: 0,
          itemStyle: {
            color: '#409EFF'
          },
          lineStyle: {
            color: 'source',
            opacity: 0.6
          }
        }, {
          depth: 1,
          itemStyle: {
            color: '#E6A23C'
          },
          lineStyle: {
            color: 'source',
            opacity: 0.6
          }
        }, {
          depth: 2,
          itemStyle: {
            color: '#67C23A'
          },
          lineStyle: {
            color: 'source',
            opacity: 0.6
          }
        }, {
          depth: 3,
          itemStyle: {
            color: '#F56C6C'
          },
          lineStyle: {
            color: 'source',
            opacity: 0.6
          }
        }],
        lineStyle: {
          curveness: 0.5
        },
        label: {
          position: 'right',
          fontSize: 12
        },
        left: '10%',
        right: '20%',
        nodeWidth: 20,
        nodeGap: 8,
        layoutIterations: 32
      }
    ]
  }

  chart.value.setOption(option, true)
}

// 初始化图表
const initChart = () => {
  if (chartRef.value) {
    chart.value = echarts.init(chartRef.value)
    
    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      chart.value?.resize()
    })
  }
}

onMounted(async () => {
  await nextTick()
  initChart()
  
  // 设置默认时间范围（最近5分钟）
  const endTime = new Date()
  const startTime = new Date(endTime.getTime() - 5 * 60 * 1000)
  timeRange.value = [
    startTime.toISOString().slice(0, 19).replace('T', ' '),
    endTime.toISOString().slice(0, 19).replace('T', ' ')
  ]
  
  fetchSystemStatus()
  
  // 设置定时刷新
  setInterval(fetchSystemStatus, 30000) // 30秒刷新一次
})
</script>

<style scoped>
.system-status {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.page-header h1 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.refresh-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.refresh-controls .el-date-picker {
  min-width: 350px;
}

.status-chart-container {
  background: #fafafa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

.status-chart {
  width: 100%;
  height: 600px;
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.status-legend {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.legend-flow {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-bottom: 15px;
  flex-wrap: wrap;
}

.legend-status {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.legend-arrow {
  font-size: 18px;
  color: #999;
  font-weight: bold;
}

.legend-icon {
  width: 16px;
  height: 16px;
  border-radius: 3px;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.legend-icon.data-collection {
  background: #409EFF;
}

.legend-icon.kafka {
  background: #E6A23C;
}

.legend-icon.backend {
  background: #67C23A;
}

.legend-icon.frontend {
  background: #F56C6C;
}

.legend-icon.online {
  background: #67C23A;
  border-radius: 50%;
}

.legend-icon.offline {
  background: #CCCCCC;
  border-radius: 50%;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }
  
  .status-chart {
    height: 400px;
  }
  
  .status-legend {
    flex-direction: column;
    gap: 15px;
    align-items: center;
  }
}
</style>