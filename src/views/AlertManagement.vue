<template>
  <div class="alert-management">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>告警规则管理</span>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            创建规则
          </el-button>
        </div>
      </template>

      <!-- 筛选条件 -->
      <div class="filter-section">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-select v-model="filters.rule_type" placeholder="规则类型" clearable>
              <el-option label="全局规则" value="global" />
              <el-option label="个例规则" value="specific" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-select v-model="filters.is_active" placeholder="状态" clearable>
              <el-option label="激活" :value="true" />
              <el-option label="未激活" :value="false" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="fetchRules">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button @click="resetFilters">重置</el-button>
          </el-col>
        </el-row>
      </div>

      <!-- 规则列表 -->
      <el-table :data="rules" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="rule_name" label="规则名称" width="150" />
        <el-table-column prop="rule_type" label="规则类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.rule_type === 'global' ? 'success' : 'warning'">
              {{ row.rule_type === 'global' ? '全局' : '个例' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target_ip" label="目标IP" width="120">
          <template #default="{ row }">
            {{ row.target_ip || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="condition_field" label="监控字段" width="120" />
        <el-table-column prop="condition_operator" label="操作符" width="80" />
        <el-table-column prop="condition_value" label="阈值" width="80" />
        <el-table-column prop="alert_level" label="告警级别" width="100">
          <template #default="{ row }">
            <el-tag :type="getAlertLevelType(row.alert_level)" effect="dark" size="small">
              {{ getAlertLevelText(row.alert_level) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_active"
              @change="toggleRuleStatus(row)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatTimestamp(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <div class="action-buttons">
              <el-button type="primary" size="small" @click="editRule(row)">
                编辑
              </el-button>
              <el-button type="info" size="small" @click="viewRule(row)">
                查看
              </el-button>
              <el-button type="danger" size="small" @click="deleteRule(row)">
                删除
              </el-button>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建/编辑规则弹窗 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingRule ? '编辑规则' : '创建规则'"
      width="70%"
      @close="resetForm"
    >
      <!-- 步骤指示器 -->
      <el-steps :active="currentStep" finish-status="success" align-center style="margin-bottom: 30px;">
        <el-step title="基础信息" description="规则名称、类型和目标" />
        <el-step title="监控配置" description="监控指标、阈值和告警设置" />
      </el-steps>

      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
      >
        <!-- 第一步：基础信息 -->
        <div v-show="currentStep === 1">
          <el-form-item label="规则名称" prop="rule_name">
            <el-input v-model="formData.rule_name" placeholder="请输入规则名称（最大100字符）" />
          </el-form-item>
          
          <el-form-item label="规则类型" prop="rule_type">
            <el-radio-group v-model="formData.rule_type" @change="handleRuleTypeChange">
              <el-radio label="global">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <el-icon style="color: #67c23a;"><Setting /></el-icon>
                  <span>全局规则（适用于所有节点）</span>
                </div>
              </el-radio>
              <el-radio label="specific">
                <div style="display: flex; align-items: center; gap: 8px;">
                  <el-icon style="color: #e6a23c;"><Monitor /></el-icon>
                  <span>个例规则（适用于特定节点）</span>
                </div>
              </el-radio>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item 
            v-if="formData.rule_type === 'specific'" 
            label="目标IP" 
            prop="target_ip"
          >
            <el-input v-model="formData.target_ip" placeholder="请输入目标IP地址" />
          </el-form-item>
        </div>

        <!-- 第二步：监控配置 -->
        <div v-show="currentStep === 2">
          <el-form-item label="监控字段" prop="condition_field">
            <el-cascader
              v-model="selectedField"
              :options="fieldOptions"
              :props="{ expandTrigger: 'hover' }"
              placeholder="请选择监控字段分类和具体指标"
              @change="handleFieldChange"
              style="width: 100%"
              clearable
            />
          </el-form-item>
          
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="比较操作符" prop="condition_operator">
                <el-select v-model="formData.condition_operator" placeholder="请选择操作符" style="width: 100%">
                  <el-option label="大于 (&gt;)" value=">" />
                  <el-option label="小于 (&lt;)" value="<" />
                  <el-option label="大于等于 (&gt;=)" value=">=" />
                  <el-option label="小于等于 (&lt;=)" value="<=" />
                  <el-option label="等于 (==)" value="==" />
                  <el-option label="不等于 (!=)" value="!=" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="阈值" prop="condition_value">
                <el-input-number 
                  v-model="formData.condition_value" 
                  :precision="2"
                  :step="0.1"
                  :min="0"
                  placeholder="请输入阈值"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="告警级别" prop="alert_level">
                <el-select v-model="formData.alert_level" placeholder="请选择告警级别" style="width: 100%">
                  <el-option label="信息" value="info">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <el-tag type="info" size="small">信息</el-tag>
                    </div>
                  </el-option>
                  <el-option label="警告" value="warning">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <el-tag type="warning" size="small">警告</el-tag>
                    </div>
                  </el-option>
                  <el-option label="错误" value="error">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <el-tag type="danger" size="small">错误</el-tag>
                    </div>
                  </el-option>
                  <el-option label="严重" value="critical">
                    <div style="display: flex; align-items: center; gap: 6px;">
                      <el-tag type="danger" effect="dark" size="small">严重</el-tag>
                    </div>
                  </el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="告警消息" prop="alert_message">
            <el-input
              v-model="formData.alert_message"
              type="textarea"
              :rows="3"
              placeholder="请输入告警消息模板，支持变量: {ip}, {current_value}, {threshold_value}, {field_name}"
            />
            <div style="font-size: 12px; color: #909399; margin-top: 4px;">
              示例: 节点 {ip} 的 {field_name} 当前值 {current_value} {condition_operator} 阈值 {threshold_value}
            </div>
          </el-form-item>
          
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="生效开始时间">
                <el-date-picker
                  v-model="formData.time_range_start"
                  type="datetime"
                  placeholder="选择开始时间（可选）"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="X"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="生效结束时间">
                <el-date-picker
                  v-model="formData.time_range_end"
                  type="datetime"
                  placeholder="选择结束时间（可选）"
                  format="YYYY-MM-DD HH:mm:ss"
                  value-format="X"
                  style="width: 100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
          
          <el-form-item label="是否激活">
            <el-switch 
              v-model="formData.is_active"
              active-text="激活"
              inactive-text="停用"
            />
          </el-form-item>
        </div>
      </el-form>
      
      <template #footer>
        <div style="display: flex; justify-content: space-between; width: 100%;">
          <div>
            <el-button v-if="currentStep > 1" @click="prevStep">上一步</el-button>
          </div>
          <div>
            <el-button @click="showCreateDialog = false">取消</el-button>
            <el-button 
              v-if="currentStep < 2" 
              type="primary" 
              @click="nextStep"
            >
              下一步
            </el-button>
            <el-button 
              v-if="currentStep === 2" 
              type="primary" 
              @click="submitForm" 
              :loading="submitting"
            >
              {{ editingRule ? '更新' : '创建' }}
            </el-button>
          </div>
        </div>
      </template>
    </el-dialog>

    <!-- 查看规则详情弹窗 -->
    <el-dialog
      v-model="showViewDialog"
      title="规则详情"
      width="50%"
    >
      <el-descriptions :column="2" border v-if="viewingRule">
        <el-descriptions-item label="规则ID">{{ viewingRule.id }}</el-descriptions-item>
        <el-descriptions-item label="规则名称">{{ viewingRule.rule_name }}</el-descriptions-item>
        <el-descriptions-item label="规则类型">
          <el-tag :type="viewingRule.rule_type === 'global' ? 'success' : 'warning'">
            {{ viewingRule.rule_type === 'global' ? '全局' : '个例' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="目标IP">{{ viewingRule.target_ip || '-' }}</el-descriptions-item>
        <el-descriptions-item label="监控字段">{{ viewingRule.condition_field }}</el-descriptions-item>
        <el-descriptions-item label="操作符">{{ viewingRule.condition_operator }}</el-descriptions-item>
        <el-descriptions-item label="阈值">{{ viewingRule.condition_value }}</el-descriptions-item>
        <el-descriptions-item label="告警级别">
          <el-tag :type="getAlertLevelType(viewingRule.alert_level)" effect="dark" size="small">
            {{ getAlertLevelText(viewingRule.alert_level) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="状态" :span="2">
          <el-tag :type="viewingRule.is_active ? 'success' : 'danger'">
            {{ viewingRule.is_active ? '激活' : '未激活' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="告警消息" :span="2">{{ viewingRule.alert_message }}</el-descriptions-item>
        <el-descriptions-item label="生效开始时间">{{ formatTimestamp(viewingRule.time_range_start) }}</el-descriptions-item>
        <el-descriptions-item label="生效结束时间">{{ formatTimestamp(viewingRule.time_range_end) }}</el-descriptions-item>
        <el-descriptions-item label="创建时间">{{ formatTimestamp(viewingRule.created_at) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间">{{ formatTimestamp(viewingRule.updated_at) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Edit, View, Delete, Monitor, Setting } from '@element-plus/icons-vue'
import {
  getAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule
} from '@/utils/alertApi'

// 数据
const rules = ref([])
const loading = ref(false)
const showCreateDialog = ref(false)
const showViewDialog = ref(false)
const editingRule = ref(null)
const viewingRule = ref(null)
const submitting = ref(false)
const selectedField = ref([])

// 监控字段选项配置
const fieldOptions = [
  {
    value: 'derived',
    label: '衍生指标',
    children: [
      { value: 'cpu_usage_rate', label: 'CPU使用率' },
      { value: 'memory_usage_rate', label: '内存使用率' },
      { value: 'swap_usage_rate', label: 'Swap使用率' },
      { value: 'network_rate', label: '网络速率' }
    ]
  },
  {
    value: 'cpu',
    label: 'CPU相关',
    children: [
      { value: 'cpu_usr', label: 'CPU用户空间占用' },
      { value: 'cpu_sys', label: 'CPU系统空间占用' },
      { value: 'cpu_iow', label: 'CPU IO等待' }
    ]
  },
  {
    value: 'memory',
    label: '内存相关',
    children: [
      { value: 'mem_total', label: '总内存' },
      { value: 'mem_free', label: '空闲内存' },
      { value: 'mem_buff', label: '缓冲区内存' },
      { value: 'mem_cache', label: '缓存内存' }
    ]
  },
  {
    value: 'swap',
    label: 'Swap相关',
    children: [
      { value: 'swap_total', label: '总Swap' },
      { value: 'swap_used', label: '已用Swap' },
      { value: 'swap_in', label: 'Swap换入' },
      { value: 'swap_out', label: 'Swap换出' }
    ]
  },
  {
    value: 'disk',
    label: '磁盘相关',
    children: [
      { value: 'disk_used_percent', label: '磁盘使用率' },
      { value: 'disk_iops', label: '磁盘IOPS' },
      { value: 'disk_r', label: '磁盘读取' },
      { value: 'disk_w', label: '磁盘写入' },
      { value: 'disk_total', label: '磁盘总容量' },
      { value: 'disk_used', label: '磁盘已用容量' }
    ]
  },
  {
    value: 'network',
    label: '网络相关',
    children: [
      { value: 'net_rx_kbps', label: '网络接收速率(kbps)' },
      { value: 'net_tx_kbps', label: '网络发送速率(kbps)' },
      { value: 'net_rx_kbytes', label: '网络接收字节数' },
      { value: 'net_tx_kbytes', label: '网络发送字节数' }
    ]
  },
  {
    value: 'system',
    label: '系统相关',
    children: [
      { value: 'system_in', label: '系统中断' },
      { value: 'system_cs', label: '系统上下文切换' }
    ]
  }
]

// 筛选条件
const filters = reactive({
  rule_type: '',
  is_active: null
})

// 表单数据
const formData = reactive({
  rule_name: '',
  rule_type: 'global',
  target_ip: '',
  condition_field: '',
  condition_operator: '>',
  condition_value: 0,
  alert_level: 'warning',
  alert_message: '',
  time_range_start: null,
  time_range_end: null,
  is_active: true
})

// 当前步骤
const currentStep = ref(1)

// 表单验证规则
const formRules = {
  rule_name: [
    { required: true, message: '请输入规则名称', trigger: 'blur' },
    { max: 100, message: '规则名称不能超过100个字符', trigger: 'blur' }
  ],
  rule_type: [
    { required: true, message: '请选择规则类型', trigger: 'change' }
  ],
  target_ip: [
    { 
      validator: (rule, value, callback) => {
        if (formData.rule_type === 'specific' && !value) {
          callback(new Error('个例规则必须指定目标IP'))
        } else if (formData.rule_type === 'global' && value) {
          callback(new Error('全局规则不能指定目标IP'))
        } else {
          callback()
        }
      }, 
      trigger: 'blur' 
    }
  ],
  condition_field: [
    { 
      validator: (rule, value, callback) => {
        if (!selectedField.value || selectedField.value.length === 0) {
          callback(new Error('请选择监控字段'))
        } else {
          callback()
        }
      }, 
      trigger: 'change' 
    }
  ],
  condition_operator: [
    { required: true, message: '请选择操作符', trigger: 'change' }
  ],
  condition_value: [
    { required: true, message: '请输入阈值', trigger: 'blur' },
    { type: 'number', min: 0, message: '阈值必须大于等于0', trigger: 'blur' }
  ],
  alert_level: [
    { required: true, message: '请选择告警级别', trigger: 'change' }
  ]
}

const formRef = ref()

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

// 格式化时间戳
const formatTimestamp = (timestamp) => {
  if (!timestamp) return '-'
  // 处理字符串格式的时间戳
  const ts = typeof timestamp === 'string' ? new Date(timestamp) : new Date(timestamp * 1000)
  if (isNaN(ts.getTime())) return '-'
  return ts.toLocaleString('zh-CN')
}

// 获取规则列表
const fetchRules = async () => {
  loading.value = true
  try {
    const params = {}
    if (filters.rule_type) params.rule_type = filters.rule_type
    if (filters.is_active !== null) params.is_active = filters.is_active
    
    const response = await getAlertRules(params)
    rules.value = response.data || []
  } catch (error) {
    console.error('获取规则列表失败:', error)
    ElMessage.error('获取规则列表失败')
  } finally {
    loading.value = false
  }
}

// 重置筛选条件
const resetFilters = () => {
  filters.rule_type = ''
  filters.is_active = null
  fetchRules()
}

// 处理规则类型变化
const handleRuleTypeChange = () => {
  if (formData.rule_type === 'global') {
    formData.target_ip = ''
  }
}

// 处理字段选择变化
const handleFieldChange = (value) => {
  if (value && value.length > 0) {
    formData.condition_field = value[value.length - 1]
  } else {
    formData.condition_field = ''
  }
}

// 下一步
const nextStep = async () => {
  if (currentStep.value === 1) {
    // 验证第一步的必填项
    try {
      await formRef.value.validateField(['rule_name', 'rule_type', 'target_ip'])
      currentStep.value = 2
    } catch (error) {
      ElMessage.warning('请完善基础信息')
    }
  }
}

// 上一步
const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value -= 1
  }
}



// 重置表单
const resetForm = () => {
  Object.assign(formData, {
    rule_name: '',
    rule_type: 'global',
    target_ip: '',
    condition_field: '',
    condition_operator: '>',
    condition_value: 0,
    alert_level: 'warning',
    alert_message: '',
    time_range_start: null,
    time_range_end: null,
    is_active: true
  })
  editingRule.value = null
  selectedField.value = []
  currentStep.value = 1
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 提交表单
const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
    submitting.value = true
    
    const data = { ...formData }
    
    if (editingRule.value) {
      await updateAlertRule(editingRule.value.id, data)
      ElMessage.success('规则更新成功')
    } else {
      await createAlertRule(data)
      ElMessage.success('规则创建成功')
    }
    
    showCreateDialog.value = false
    fetchRules()
  } catch (error) {
    console.error('提交失败:', error)
    if (error.response?.data?.detail) {
      ElMessage.error(error.response.data.detail)
    } else {
      ElMessage.error('提交失败')
    }
  } finally {
    submitting.value = false
  }
}

// 编辑规则
const editRule = (rule) => {
  editingRule.value = rule
  Object.assign(formData, {
    rule_name: rule.rule_name,
    rule_type: rule.rule_type,
    target_ip: rule.target_ip || '',
    condition_field: rule.condition_field,
    condition_operator: rule.condition_operator,
    condition_value: rule.condition_value,
    alert_level: rule.alert_level,
    alert_message: rule.alert_message,
    time_range_start: rule.time_range_start,
    time_range_end: rule.time_range_end,
    is_active: rule.is_active
  })
  
  // 设置级联选择器的值
  selectedField.value = []
  for (const category of fieldOptions) {
    for (const field of category.children) {
      if (field.value === rule.condition_field) {
        selectedField.value = [category.value, field.value]
        break
      }
    }
    if (selectedField.value.length > 0) break
  }
  
  currentStep.value = 1
  showCreateDialog.value = true
}

// 查看规则
const viewRule = (rule) => {
  viewingRule.value = rule
  showViewDialog.value = true
}

// 删除规则
const deleteRule = async (rule) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除规则 "${rule.rule_name}" 吗？`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    await deleteAlertRule(rule.id)
    ElMessage.success('规则删除成功')
    fetchRules()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

// 切换规则状态
const toggleRuleStatus = async (rule) => {
  try {
    await updateAlertRule(rule.id, { is_active: rule.is_active })
    ElMessage.success(`规则已${rule.is_active ? '激活' : '停用'}`)
  } catch (error) {
    console.error('状态更新失败:', error)
    ElMessage.error('状态更新失败')
    // 恢复原状态
    rule.is_active = !rule.is_active
  }
}

// 初始化
onMounted(() => {
  fetchRules()
})
</script>

<style scoped>
.alert-management {
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

.filter-section {
  margin-bottom: 20px;
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-table th) {
  background-color: #fafafa;
  font-weight: 600;
}

:deep(.el-descriptions__label) {
  font-weight: 600;
  color: #606266;
}

.action-buttons {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
}

.action-buttons .el-button {
  padding: 5px 8px;
  font-size: 12px;
  flex: 1;
  min-width: 0;
}
</style>