import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import heartbeatService from './services/heartbeat'

const app = createApp(App)

// 注册所有图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus)

// 启动心跳服务
app.mount('#app')

// 在DOM挂载后启动心跳服务
setTimeout(() => {
  heartbeatService.start()
}, 1000) // 延迟1秒启动，确保应用完全加载

// 在页面关闭时停止心跳服务
window.addEventListener('beforeunload', () => {
  heartbeatService.stop()
})