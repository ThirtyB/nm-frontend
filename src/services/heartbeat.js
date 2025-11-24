import axios from 'axios'

class HeartbeatService {
  constructor() {
    this.intervalId = null
    this.baseUrl = 'http://127.0.0.1:8000/heartbeat/report'
    this.isRunning = false
  }

  // 获取客户端IP地址（获取局域网实际IP）
  async getClientIP() {
    try {
      // 方法1: 尝试通过WebRTC获取本地IP
      const localIP = await this.getLocalIPViaWebRTC()
      if (localIP && localIP !== '127.0.0.1' && !localIP.startsWith('169.254')) {
        return localIP
      }

      // 方法2: 通过多个公共API获取IP，优先获取可能的内网IP
      const publicIP = await this.getPublicIP()
      return publicIP
    } catch (error) {
      // 如果所有方法都失败，返回一个默认的内网IP段
      return '192.168.1.100'
    }
  }

  // 通过WebRTC获取本地IP地址
  async getLocalIPViaWebRTC() {
    return new Promise((resolve) => {
      const rtc = new RTCPeerConnection({ iceServers: [] })
      const localIPs = new Set()
      
      rtc.createDataChannel('')
      
      rtc.onicecandidate = (event) => {
        if (event.candidate) {
          const candidate = event.candidate.candidate
          const ipMatch = candidate.match(/(\d+\.\d+\.\d+\.\d+)/)
          if (ipMatch) {
            const ip = ipMatch[1]
            if (!ip.startsWith('127.') && !ip.startsWith('169.254.') && !ip.startsWith('::1')) {
              localIPs.add(ip)
            }
          }
        }
      }
      
      rtc.createOffer()
        .then(offer => rtc.setLocalDescription(offer))
        .catch(() => {})
      
      setTimeout(() => {
        rtc.close()
        const ips = Array.from(localIPs)
        // 优先返回192.168.x.x或10.x.x.x网段的IP
        const preferredIP = ips.find(ip => 
          ip.startsWith('192.168.') || 
          ip.startsWith('10.') || 
          ip.startsWith('172.')
        )
        resolve(preferredIP || ips[0] || null)
      }, 2000)
    })
  }

  // 通过公共API获取IP地址
  async getPublicIP() {
    const apis = [
      'https://api.ipify.org?format=json',
      'https://httpbin.org/ip',
      'https://api.ip.sb/ip',
      'https://ifconfig.me/ip'
    ]

    for (const api of apis) {
      try {
        const response = await fetch(api, { timeout: 3000 })
        if (response.ok) {
          const data = await response.text()
          const ip = data.includes('"') ? JSON.parse(data).ip : data.trim()
          if (ip && this.isValidIP(ip)) {
            return ip
          }
        }
      } catch (error) {
        continue
      }
    }
    
    // 如果所有API都失败，返回一个默认IP
    return '192.168.1.100'
  }

  // 验证IP地址格式
  isValidIP(ip) {
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    return ipRegex.test(ip.trim())
  }

  // 发送心跳报告
  async sendHeartbeat() {
    try {
      const ip_address = await this.getClientIP()
      
      const payload = {
        ip_address: ip_address,
        service_name: "前端"
      }

      const response = await axios.post(this.baseUrl, payload, {
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })

      return response.data
    } catch (error) {
      // 不抛出错误，避免影响定时任务
    }
  }

  // 启动定时任务
  start() {
    if (this.isRunning) {
      return
    }
    
    // 立即发送一次
    this.sendHeartbeat()
    
    // 设置定时任务，每30秒执行一次
    this.intervalId = setInterval(() => {
      this.sendHeartbeat()
    }, 30000) // 30秒 = 30000毫秒

    this.isRunning = true
  }

  // 停止定时任务
  stop() {
    if (!this.isRunning) {
      return
    }

    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }

    this.isRunning = false
  }

  // 获取当前IP地址
  async getCurrentIP() {
    return await this.getClientIP()
  }

  // 检查服务状态
  getStatus() {
    return {
      isRunning: this.isRunning,
      interval: this.isRunning ? '30秒' : '未启动'
    }
  }
}

// 创建单例实例
const heartbeatService = new HeartbeatService()

export default heartbeatService