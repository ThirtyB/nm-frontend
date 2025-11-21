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
          <div class="legend-icon database"></div>
          <span>数据库</span>
        </div>
        <div class="legend-arrow">→</div>
        <div class="legend-item">
          <div class="legend-icon redis"></div>
          <span>Redis</span>
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

    // 确保时间戳是UTC时间戳
    const utcStartTime = new Date(startTime.getTime() + (startTime.getTimezoneOffset() * 60000))
    const utcEndTime = new Date(endTime.getTime() + (endTime.getTimezoneOffset() * 60000))
    
    const requestData = {
      start_time: Math.floor(utcStartTime.getTime() / 1000),
      end_time: Math.floor(utcEndTime.getTime() / 1000)
    }
    
    console.log('========== 时间戳处理 ==========')
    console.log('本地 startTime:', startTime, '本地时间戳:', Math.floor(startTime.getTime() / 1000))
    console.log('UTC startTime:', utcStartTime, 'UTC时间戳:', requestData.start_time)
    console.log('本地 endTime:', endTime, '本地时间戳:', Math.floor(endTime.getTime() / 1000))
    console.log('UTC endTime:', utcEndTime, 'UTC时间戳:', requestData.end_time)
    console.log('发送的请求数据:', requestData)
    console.log('================================')
    
    const response = await api.post('/heartbeat/status', requestData)

    console.log('========== 系统状态数据 ==========')
    console.log('完整响应数据:', response.data)
    console.log('服务状态数据:', response.data.service_status)
    console.log('流量状态数据:', response.data.traffic_status)
    
    // 详细日志各服务类型
    if (response.data.service_status) {
      console.log('--- 数据采集服务 ---')
      console.log(response.data.service_status.data_collection)
      console.log('--- Kafka服务 ---')
      console.log(response.data.service_status.kafka_process)
      console.log('--- Redis服务 ---')
      console.log(response.data.service_status.redis)
      console.log('--- 前端服务 ---')
      console.log(response.data.service_status.frontend)
      console.log('--- 后端服务 ---')
      console.log(response.data.service_status.backend)
      console.log('--- 数据库状态 ---')
      console.log(response.data.service_status.database)
    }
    
    // 详细日志流量数据
    if (response.data.traffic_status) {
      console.log('--- 流量数据详情 ---')
      console.log('数据采集到Kafka:', response.data.traffic_status.data_collection_to_kafka)
      console.log('Kafka到数据库:', response.data.traffic_status.kafka_to_database)
      console.log('数据库到后端:', response.data.traffic_status.database_to_backend)
      console.log('Redis到后端:', response.data.traffic_status.redis_to_backend)
      console.log('后端到前端:', response.data.traffic_status.backend_to_frontend)
    }
    console.log('================================')
    
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
  const redisServices = []

  // 处理数据采集服务
  if (serviceData.value.service_status?.data_collection) {
    serviceData.value.service_status.data_collection.forEach(service => {
      dataCollectors.push({
        name: service.service_name || `数据采集${dataCollectors.length + 1}`,
        ip: service.ip_address,
        online: service.is_online,
        lastReport: service.last_report_time
      })
    })
  }

  // 处理kafka服务
  if (serviceData.value.service_status?.kafka_process) {
    serviceData.value.service_status.kafka_process.forEach(service => {
      kafkaServices.push({
        name: service.service_name || `Kafka${kafkaServices.length + 1}`,
        ip: service.ip_address,
        online: service.is_online,
        lastReport: service.last_report_time
      })
    })
  }

  // 处理Redis服务
  if (serviceData.value.service_status?.redis) {
    serviceData.value.service_status.redis.forEach(service => {
      redisServices.push({
        name: service.service_name || `Redis${redisServices.length + 1}`,
        ip: service.ip_address,
        online: service.is_online,
        lastReport: service.last_report_time
      })
    })
  }

  // 处理前端服务
  if (serviceData.value.service_status?.frontend) {
    serviceData.value.service_status.frontend.forEach(service => {
      frontendServices.push({
        name: service.service_name || `前端${frontendServices.length + 1}`,
        ip: service.ip_address,
        online: service.is_online,
        lastReport: service.last_report_time
      })
    })
  }

  // 处理后端服务
  if (serviceData.value.service_status?.backend) {
    serviceData.value.service_status.backend.forEach(service => {
      backendServices.push({
        name: service.service_name || `后端${backendServices.length + 1}`,
        ip: service.ip_address,
        online: service.is_online,
        lastReport: service.last_report_time
      })
    })
  }

  // 处理数据库服务（单独处理，与Redis在同一层）
  let databaseService = null
  if (serviceData.value.service_status?.database) {
    const dbService = serviceData.value.service_status.database
    databaseService = {
      name: '数据库',
      ip: 'database_server',
      online: dbService.is_connected,
      lastReport: dbService.connection_time
    }
  }

  // 格式化UTC时间为本地时间
  const formatUTCTime = (utcTimeString) => {
    if (!utcTimeString) return '未知'
    try {
      const utcDate = new Date(utcTimeString)
      return utcDate.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    } catch (error) {
      console.warn('时间格式化错误:', utcTimeString, error)
      return utcTimeString
    }
  }

  // 获取流量数据用于连接权重
  const trafficData = serviceData.value.traffic_status || {}
  const getTrafficWeight = (sourceType, targetType, sourceIp, targetIp) => {
    // 根据流量数据返回权重
    if (sourceType === 'data_collection' && targetType === 'kafka') {
      const traffic = trafficData.data_collection_to_kafka?.find(
        t => (t.source_ip === sourceIp || t.target_ip === targetIp)
      )
      return traffic ? Math.min(traffic.data_count / 100, 20) : 1
    }
    if (sourceType === 'kafka' && targetType === 'database') {
      const traffic = trafficData.kafka_to_database?.find(
        t => (t.source_ip === sourceIp || t.target_ip === targetIp)
      )
      return traffic ? Math.min(traffic.data_count / 100, 15) : 1
    }
    if (sourceType === 'database' && targetType === 'backend') {
      const traffic = trafficData.database_to_backend?.find(
        t => (t.source_ip === sourceIp || t.target_ip === targetIp)
      )
      return traffic ? Math.min(traffic.data_count / 100, 10) : 1
    }
    if (sourceType === 'redis' && targetType === 'backend') {
      const traffic = trafficData.redis_to_backend?.find(
        t => (t.source_ip === sourceIp || t.target_ip === targetIp)
      )
      return traffic ? Math.min(traffic.data_count / 100, 8) : 1
    }
    if (sourceType === 'backend' && targetType === 'frontend') {
      const traffic = trafficData.backend_to_frontend?.find(
        t => (t.source_ip === sourceIp || t.target_ip === targetIp)
      )
      return traffic ? Math.min(traffic.data_count / 10, 5) : 1
    }
    return 1
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
        color: collector.online ? '#FF0000' : '#CCCCCC'  /* 红色 */
      },
      tooltip: {
        formatter: `${collector.name}<br/>状态: ${collector.online ? '在线' : '离线'}<br/>IP: ${collector.ip}<br/>最后汇报: ${formatUTCTime(collector.lastReport)}`
      }
    })
  })

  // Kafka层节点
  kafkaServices.forEach((kafka, index) => {
    nodes.push({
      name: kafka.name,
      value: kafka.online ? 15 : 8,
      itemStyle: {
        color: kafka.online ? '#FF8C00' : '#CCCCCC'  /* 橙色 */
      },
      tooltip: {
        formatter: `${kafka.name}<br/>状态: ${kafka.online ? '在线' : '离线'}<br/>IP: ${kafka.ip}<br/>最后汇报: ${formatUTCTime(kafka.lastReport)}`
      }
    })
  })

  // 数据库层节点
  if (databaseService) {
    nodes.push({
      name: databaseService.name,
      value: databaseService.online ? 12 : 6,
      itemStyle: {
        color: databaseService.online ? '#FFD700' : '#CCCCCC'  // 黄色
      },
      tooltip: {
        formatter: `${databaseService.name}<br/>状态: ${databaseService.online ? '在线' : '离线'}<br/>IP: ${databaseService.ip}<br/>最后汇报: ${formatUTCTime(databaseService.lastReport)}`
      }
    })
  }

  // Redis层节点
  redisServices.forEach((redis, index) => {
    nodes.push({
      name: redis.name,
      value: redis.online ? 12 : 6,
      itemStyle: {
        color: redis.online ? '#00CED1' : '#CCCCCC'  // 深青色
      },
      tooltip: {
        formatter: `${redis.name}<br/>状态: ${redis.online ? '在线' : '离线'}<br/>IP: ${redis.ip}<br/>最后汇报: ${formatUTCTime(redis.lastReport)}`
      }
    })
  })

  // 后端层节点
  backendServices.forEach((backend, index) => {
    nodes.push({
      name: backend.name,
      value: backend.online ? 12 : 6,
      itemStyle: {
        color: backend.online ? '#00FF00' : '#CCCCCC'  // 绿色
      },
      tooltip: {
        formatter: `${backend.name}<br/>状态: ${backend.online ? '在线' : '离线'}<br/>IP: ${backend.ip}<br/>最后汇报: ${formatUTCTime(backend.lastReport)}`
      }
    })
  })

  // 前端层节点
  frontendServices.forEach((frontend, index) => {
    nodes.push({
      name: frontend.name,
      value: frontend.online ? 12 : 6,
      itemStyle: {
        color: frontend.online ? '#9370DB' : '#CCCCCC'  /* 紫色 */
      },
      tooltip: {
        formatter: `${frontend.name}<br/>状态: ${frontend.online ? '在线' : '离线'}<br/>IP: ${frontend.ip}<br/>最后汇报: ${formatUTCTime(frontend.lastReport)}`
      }
    })
  })

  // 创建连接：数据采集 -> Kafka
  const kafkaStartIndex = dataCollectors.length
  
  dataCollectors.forEach((collector, collectorIndex) => {
    kafkaServices.forEach((kafka, kafkaIndex) => {
      const sourceIndex = collectorIndex
      const targetIndex = kafkaStartIndex + kafkaIndex
      const baseValue = getTrafficWeight('data_collection', 'kafka', collector.ip, kafka.ip)
      const value = (collector.online && kafka.online) ? baseValue : baseValue * 0.2
      
      links.push({
        source: sourceIndex,
        target: targetIndex,
        value: value,
        lineStyle: {
          color: (collector.online && kafka.online) ? '#FF0000' : '#CCCCCC',
          opacity: (collector.online && kafka.online) ? 0.8 : 0.3
        }
      })
    })
  })

  // 数据库层和Redis层分层
  const databaseStartIndex = kafkaStartIndex + kafkaServices.length
  const redisStartIndex = databaseStartIndex + (databaseService ? 1 : 0)
  const backendStartIndex = redisStartIndex + redisServices.length
  
  // 创建连接：Kafka -> 数据库
  kafkaServices.forEach((kafka, kafkaIndex) => {
    if (databaseService) {
      const sourceIndex = kafkaStartIndex + kafkaIndex
      const targetIndex = databaseStartIndex  // 数据库在第三层
      const baseValue = getTrafficWeight('kafka', 'database', kafka.ip, databaseService.ip)
      const value = (kafka.online && databaseService.online) ? baseValue : baseValue * 0.2
      
      links.push({
        source: sourceIndex,
        target: targetIndex,
        value: value,
        lineStyle: {
          color: (kafka.online && databaseService.online) ? '#FF8C00' : '#CCCCCC',
          opacity: (kafka.online && databaseService.online) ? 0.8 : 0.3
        }
      })
    }
  })

  // 创建连接：数据库 -> 后端
  if (databaseService) {
    backendServices.forEach((backend, backendIndex) => {
      const sourceIndex = databaseStartIndex
      const targetIndex = backendStartIndex + backendIndex
      const baseValue = getTrafficWeight('database', 'backend', databaseService.ip, backend.ip)
      const value = (databaseService.online && backend.online) ? baseValue : baseValue * 0.2
      
      links.push({
        source: sourceIndex,
        target: targetIndex,
        value: value,
        lineStyle: {
          color: (databaseService.online && backend.online) ? '#FFD700' : '#CCCCCC',
          opacity: (databaseService.online && backend.online) ? 0.8 : 0.3
        }
      })
    })
  }

  // 创建连接：Redis -> 后端
  redisServices.forEach((redis, redisIndex) => {
    backendServices.forEach((backend, backendIndex) => {
      const sourceIndex = redisStartIndex + redisIndex
      const targetIndex = backendStartIndex + backendIndex
      const baseValue = getTrafficWeight('redis', 'backend', redis.ip, backend.ip)
      const value = (redis.online && backend.online) ? baseValue : baseValue * 0.2
      
      links.push({
        source: sourceIndex,
        target: targetIndex,
        value: value,
        lineStyle: {
          color: (redis.online && backend.online) ? '#00CED1' : '#CCCCCC',
          opacity: (redis.online && backend.online) ? 0.8 : 0.3
        }
      })
    })
  })



  // 创建连接：后端 -> 前端
  const frontendStartIndex = backendStartIndex + backendServices.length
  
  backendServices.forEach((backend, backendIndex) => {
    // 不连接数据库到前端
    if (backend.name !== '数据库') {
      frontendServices.forEach((frontend, frontendIndex) => {
        const sourceIndex = backendStartIndex + backendIndex
        const targetIndex = frontendStartIndex + frontendIndex
        const baseValue = getTrafficWeight('backend', 'frontend', backend.ip, frontend.ip)
        const value = (backend.online && frontend.online) ? baseValue : baseValue * 0.2
        
        links.push({
          source: sourceIndex,
          target: targetIndex,
          value: value,
          lineStyle: {
            color: (backend.online && frontend.online) ? '#9370DB' : '#CCCCCC',
            opacity: (backend.online && frontend.online) ? 0.8 : 0.3
          }
        })
      })
    }
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
            color: '#FF0000'  /* 红色 - 数据采集 */
          },
          lineStyle: {
            color: 'source',
            opacity: 0.6
          }
        }, {
          depth: 1,
          itemStyle: {
            color: '#FF8C00'  /* 橙色 - Kafka */
          },
          lineStyle: {
            color: 'source',
            opacity: 0.6
          }
        }, {
          depth: 2,
          itemStyle: {
            color: '#FFD700'  /* 黄色 - 数据库 */
          },
          lineStyle: {
            color: 'source',
            opacity: 0.6
          }
        }, {
          depth: 3,
          itemStyle: {
            color: '#00CED1'  /* 深青色 - Redis */
          },
          lineStyle: {
            color: 'source',
            opacity: 0.6
          }
        }, {
          depth: 4,
          itemStyle: {
            color: '#00FF00'  /* 绿色 - 后端 */
          },
          lineStyle: {
            color: 'source',
            opacity: 0.6
          }
        }, {
          depth: 5,
          itemStyle: {
            color: '#9370DB'  /* 紫色 - 前端 */
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
  background: #FF0000;  /* 红色 */
}

.legend-icon.kafka {
  background: #FF8C00;  /* 橙色 */
}

.legend-icon.database {
  background: #FFD700;  /* 黄色 */
}

.legend-icon.redis {
  background: #00CED1;  /* 深青色 */
}

.legend-icon.backend {
  background: #00FF00;  /* 绿色 */
}

.legend-icon.frontend {
  background: #9370DB;  /* 紫色 */
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