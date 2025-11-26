<template>
  <el-container class="layout-container">
    <el-aside width="250px" class="sidebar">
      <div class="logo">
        <h2>资源监控系统</h2>
      </div>
      
      <el-menu
        :default-active="$route.path"
        class="sidebar-menu"
        router
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><House /></el-icon>
          <span>首页</span>
        </el-menu-item>
        
        <el-menu-item index="/nodes">
          <el-icon><Monitor /></el-icon>
          <span>节点详情</span>
        </el-menu-item>
        
        <el-menu-item
          v-if="authStore.user?.user_type === 'admin'"
          index="/system-status"
        >
          <el-icon><Connection /></el-icon>
          <span>系统存活状态</span>
        </el-menu-item>
        
        <el-menu-item
          v-if="authStore.user?.user_type === 'admin'"
          index="/alert-management"
        >
          <el-icon><Warning /></el-icon>
          <span>告警配置</span>
        </el-menu-item>
        
        <el-menu-item
          v-if="authStore.user?.user_type === 'admin'"
          index="/users"
        >
          <el-icon><UserFilled /></el-icon>
          <span>用户管理</span>
        </el-menu-item>
        
        <el-menu-item index="/profile">
          <el-icon><User /></el-icon>
          <span>个人信息</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="$route.name !== 'Dashboard'">
              {{ getPageTitle() }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        
        <div class="header-right">
          <div class="user-role-badge">
            <el-tag 
              :type="authStore.user?.user_type === 'admin' ? 'warning' : 'success'"
              effect="dark"
            >
              <el-icon><User /></el-icon>
              {{ authStore.user?.user_type === 'admin' ? '管理员' : '普通用户' }}
            </el-tag>
          </div>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-icon><UserFilled /></el-icon>
              {{ authStore.user?.username || '用户' }}
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { House, User, UserFilled, ArrowDown, Monitor, Warning, Connection } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const getPageTitle = () => {
  const routeMap = {
    'Users': '用户管理',
    'Dashboard': '首页',
    'Nodes': '节点详情',
    'NodeDetail': '节点详情',
    'AlertManagement': '告警配置',
    'SystemStatus': '系统存活状态',
    'Profile': '个人信息'
  }
  return routeMap[router.currentRoute.value.name] || ''
}

const handleCommand = async (command) => {
  if (command === 'logout') {
    try {
      await ElMessageBox.confirm(
        '确定要退出登录吗？',
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      
      authStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    } catch {
      // 用户取消
    }
  }
}

// 组件挂载时获取用户信息
onMounted(async () => {
  if (authStore.isAuthenticated && !authStore.user) {
    await authStore.fetchUserInfo()
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background: linear-gradient(180deg, #304156 0%, #263445 100%);
  box-shadow: 2px 0 12px rgba(0, 0, 0, 0.15);
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #2b3a4b 0%, #1a2530 100%);
  color: white;
  margin-bottom: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.logo h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.sidebar-menu {
  border: none;
}

.sidebar-menu .el-menu-item {
  height: 50px;
  line-height: 50px;
  margin: 4px 8px;
  border-radius: 6px;
  transition: all 0.3s ease;
}

.sidebar-menu .el-menu-item:hover {
  background-color: #263445 !important;
  transform: translateX(4px);
}

.sidebar-menu .el-menu-item.is-active {
  background: linear-gradient(135deg, #409EFF 0%, #67C23A 100%) !important;
  color: #ffffff !important;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
  transform: translateX(4px);
}

.sidebar-menu .el-menu-item.is-active .el-icon {
  color: #ffffff !important;
  font-size: 18px;
}

.header {
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-role-badge {
  display: flex;
  align-items: center;
}

.user-role-badge .el-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-weight: 600;
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 管理员金色样式 */
.user-role-badge .el-tag--warning {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  border-color: #FFD700;
  color: #8B4513;
}

/* 普通用户绿色样式 */
.user-role-badge .el-tag--success {
  background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
  border-color: #52C41A;
  color: white;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #606266;
  font-size: 14px;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.user-info .el-icon {
  margin-right: 8px;
}

.main-content {
  background-color: #f5f5f5;
  padding: 20px;
}
</style>