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
      <div class="legend-item">
        <div class="legend-icon online"></div>
        <span>在线服务</span>
      </div>
      <div class="legend-item">
        <div class="legend-icon offline"></div>
        <span>离线服务</span>
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

    const response = await api.post('/heartbeat/status', {
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString()
    })

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

  // 创建节点数据
  const nodes = []
  const links = []

  // 数据收集器节点
  dataCollectors.forEach((collector, index) => {
    nodes.push({
      id: `collector_${index}`,
      name: collector.name,
      category: 0,
      online: collector.online,
      symbolSize: 60,
      x: 100 + (index % 3) * 150,
      y: 100 + Math.floor(index / 3) * 100
    })
  })

  // Kafka节点
  kafkaServices.forEach((kafka, index) => {
    nodes.push({
      id: `kafka_${index}`,
      name: kafka.name,
      category: 1,
      online: kafka.online,
      symbolSize: 80,
      x: 400,
      y: 200 + index * 150
    })

    // 数据收集器连接到Kafka
    dataCollectors.forEach((_, collectorIndex) => {
      links.push({
        source: `collector_${collectorIndex}`,
        target: `kafka_${index}`,
        lineStyle: {
          color: kafka.online ? '#67C23A' : '#F56C6C',
          width: 2
        }
      })
    })
  })

  // 后端节点
  backendServices.forEach((backend, index) => {
    nodes.push({
      id: `backend_${index}`,
      name: backend.name,
      category: 2,
      online: backend.online,
      symbolSize: 60,
      x: 700 + (index % 3) * 150,
      y: 100 + Math.floor(index / 3) * 100
    })

    // Kafka连接到后端
    kafkaServices.forEach((_, kafkaIndex) => {
      links.push({
        source: `kafka_${kafkaIndex}`,
        target: `backend_${index}`,
        lineStyle: {
          color: backend.online ? '#67C23A' : '#F56C6C',
          width: 2
        }
      })
    })
  })

  // 前端节点
  frontendServices.forEach((frontend, index) => {
    nodes.push({
      id: `frontend_${index}`,
      name: frontend.name,
      category: 3,
      online: frontend.online,
      symbolSize: 60,
      x: 700 + (index % 3) * 150,
      y: 300 + Math.floor(index / 3) * 100
    })

    // 后端与前端全连接
    backendServices.forEach((_, backendIndex) => {
      links.push({
        source: `backend_${backendIndex}`,
        target: `frontend_${index}`,
        lineStyle: {
          color: (frontend.online && backendServices[backendIndex].online) ? '#67C23A' : '#F56C6C',
          width: 1,
          type: 'dashed'
        }
      })
    })
  })

  const option = {
    title: {
      text: '系统架构存活状态图',
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
      formatter: function(params) {
        if (params.dataType === 'node') {
          const data = params.data
          return `
            <div style="padding: 10px;">
              <div style="font-weight: bold; margin-bottom: 5px;">${data.name}</div>
              <div style="color: ${data.online ? '#67C23A' : '#F56C6C'}">
                状态: ${data.online ? '在线' : '离线'}
              </div>
              <div style="font-size: 12px; color: #666;">
                IP: ${data.ip || 'N/A'}
              </div>
            </div>
          `
        }
        return ''
      }
    },
    legend: {
      data: ['数据采集', 'Kafka', '后端服务', '前端服务'],
      top: 50,
      textStyle: {
        fontSize: 14
      }
    },
    series: [{
      type: 'graph',
      layout: 'none',
      symbolSize: 60,
      roam: true,
      label: {
        show: true,
        position: 'bottom',
        fontSize: 12,
        formatter: function(params) {
          return params.data.name.length > 8 ? 
            params.data.name.substring(0, 8) + '...' : 
            params.data.name
        }
      },
      edgeSymbol: ['circle', 'arrow'],
      edgeSymbolSize: [4, 10],
      edgeLabel: {
        fontSize: 12
      },
      data: nodes,
      links: links,
      categories: [
        { name: '数据采集', itemStyle: { color: '#409EFF' } },
        { name: 'Kafka', itemStyle: { color: '#E6A23C' } },
        { name: '后端服务', itemStyle: { color: '#67C23A' } },
        { name: '前端服务', itemStyle: { color: '#F56C6C' } }
      ],
      lineStyle: {
        opacity: 0.8,
        curveness: 0.2
      },
      emphasis: {
        focus: 'adjacency',
        lineStyle: {
          width: 4
        }
      }
    }]
  }

  // 设置节点样式
  option.series[0].data.forEach(node => {
    node.itemStyle = {
      color: node.online ? 
        option.series[0].categories[node.category].itemStyle.color : 
        '#CCCCCC',
      borderColor: node.online ? '#ffffff' : '#999999',
      borderWidth: 2
    }
  })

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
  display: flex;
  justify-content: center;
  gap: 40px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #666;
}

.legend-icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.legend-icon.online {
  background: #67C23A;
}

.legend-icon.offline {
  background: #CCCCCC;
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