import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/Register.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      name: 'Layout',
      component: () => import('@/layout/MainLayout.vue'),
      meta: { requiresAuth: true },
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/Dashboard.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'nodes',
          name: 'Nodes',
          component: () => import('@/views/Nodes.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'nodes/:ip',
          name: 'NodeDetail',
          component: () => import('@/views/NodeDetail.vue'),
          meta: { requiresAuth: true }
        },
        {
          path: 'alert-management',
          name: 'AlertManagement',
          component: () => import('@/views/AlertManagement.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'users',
          name: 'Users',
          component: () => import('@/views/Users.vue'),
          meta: { requiresAuth: true, requiresAdmin: true }
        },
        {
          path: 'system-status',
          name: 'SystemStatus',
          component: () => import('@/views/SystemStatus.vue'),
          meta: { requiresAuth: true }
        }
      ]
    }
  ]
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresAdmin && authStore.user?.user_type !== 'admin') {
    next('/dashboard')
  } else if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
    next('/dashboard')
  } else {
    next()
  }
})

export default router