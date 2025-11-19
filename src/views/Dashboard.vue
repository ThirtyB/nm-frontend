<template>
  <div class="dashboard">
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
    
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="8">
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
      
      <el-col :span="8">
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
      
      <el-col :span="8">
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
            
            <el-button type="success">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
            
            <el-button type="info">
              <el-icon><Document /></el-icon>
              查看日志
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { House, DataAnalysis, Setting, User, Refresh, Document } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

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
</style>