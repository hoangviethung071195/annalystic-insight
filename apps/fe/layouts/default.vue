<template>
  <div class="app-layout">
    <aside class="sidebar glass-card">
      <div class="sidebar-header">
        <h2 class="logo">📊 FB Crawler</h2>
      </div>
      <nav class="sidebar-nav">
        <NuxtLink to="/" class="nav-item" active-class="nav-active">
          <span class="nav-icon">🏠</span>
          <span class="nav-label">Dashboard</span>
        </NuxtLink>
        <NuxtLink to="/groups" class="nav-item" active-class="nav-active">
          <span class="nav-icon">👥</span>
          <span class="nav-label">Groups</span>
        </NuxtLink>
      </nav>
      <div class="sidebar-footer">
        <div v-if="userEmail" class="user-info">
          <span class="user-icon">👤</span>
          <span class="user-email" :title="userEmail">{{ userEmail }}</span>
        </div>
        <button v-if="isLoggedIn" class="btn btn-secondary btn-sm w-100 mt-1" style="margin-top: 8px;" @click="handleLogout">
          🚪 Đăng xuất
        </button>
        <div class="version-text mt-1" style="margin-top: 8px;">v1.0.0</div>
      </div>
    </aside>
    <main class="main-content">
      <slot />

      <!-- Live Debug Console -->
      <!-- <div class="debug-panel glass-card">
        <div class="debug-header">
          <span>📋 LIVE DEBUG CONSOLE (Theo dõi lỗi trực tiếp)</span>
          <button class="btn btn-secondary btn-sm" style="padding: 2px 8px; font-size: 11px;" @click="clearLogs">Clear</button>
        </div>
        <div class="debug-body" ref="logContainer">
          <div v-for="(log, idx) in logs" :key="idx" :class="['log-line', getLogClass(log)]">
            {{ log }}
          </div>
          <div v-if="logs.length === 0" class="log-empty">Chưa có bản ghi log nào...</div>
        </div>
      </div> -->
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoggedIn = ref(false)
const userEmail = ref('')

const checkAuth = () => {
  if (process.client) {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
    } else {
      isLoggedIn.value = true
      userEmail.value = localStorage.getItem('userEmail') || 'User'
    }
  }
}

const handleLogout = () => {
  if (process.client) {
    localStorage.removeItem('token')
    localStorage.removeItem('userEmail')
    router.push('/login')
  }
}

const logs = ref<string[]>([])
const logContainer = ref<HTMLElement | null>(null)

const addLog = (msg: string) => {
  const timestamp = new Date().toLocaleTimeString()
  logs.value.push(`[${timestamp}] ${msg}`)
  if (logs.value.length > 150) logs.value.shift()
  
  nextTick(() => {
    if (logContainer.value) {
      logContainer.value.scrollTop = logContainer.value.scrollHeight
    }
  })
}

const clearLogs = () => {
  logs.value = []
}

const getLogClass = (log: string) => {
  if (log.includes('[ERROR]') || log.includes('[UNCAUGHT') || log.includes('[UNHANDLED')) return 'log-error'
  if (log.includes('[WARN]')) return 'log-warn'
  if (log.includes('[IPC]') || log.includes('[API]')) return 'log-info'
  return ''
}

onMounted(() => {
  checkAuth()
  addLog("🚀 Hệ thống Debug khởi tạo thành công.")
  addLog(`Kiểu ứng dụng: ${process.client ? 'Client/Trình duyệt' : 'Server'}`)
  addLog(`Electron API: ${window && (window as any).electronAPI ? 'Đã kích hoạt (Desktop Mode)' : 'Chưa kích hoạt (Web Mode)'}`)
  
  if (window && (window as any).electronAPI) {
    addLog(`API Endpoint đang dùng: ${(window as any).electronAPI.apiBaseUrl}`)
  }

  // Hook console.log
  const originalLog = console.log
  console.log = (...args) => {
    addLog(`[LOG] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`)
    originalLog(...args)
  }

  // Hook console.error
  const originalError = console.error
  console.error = (...args) => {
    addLog(`[ERROR] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' ')}`)
    originalError(...args)
  }

  // Catch global errors
  window.addEventListener('error', (event) => {
    addLog(`[UNCAUGHT EXCEPTION] ${event.message} tại ${event.filename}:${event.lineno}`)
  })

  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    addLog(`[UNHANDLED REJECTION] ${event.reason}`)
  })
})
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  position: fixed;
  left: 16px;
  top: 16px;
  bottom: 16px;
  width: 220px;
  display: flex;
  flex-direction: column;
  padding: 20px 12px;
  z-index: 100;
}

.sidebar-header {
  padding-bottom: 20px;
  border-bottom: 1px solid var(--glass-border);
  margin-bottom: 16px;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s;
  font-size: 14px;
}

.nav-item:hover {
  background: var(--bg-card-hover);
  color: var(--text-primary);
}

.nav-active {
  background: rgba(100, 140, 255, 0.1);
  color: var(--accent);
  font-weight: 500;
}

.nav-icon {
  font-size: 18px;
}

.sidebar-footer {
  padding-top: 16px;
  border-top: 1px solid var(--glass-border);
}

.version-text {
  font-size: 12px;
  color: var(--text-muted);
  text-align: center;
}

.main-content {
  margin-left: 252px;
  flex: 1;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Debug Panel Styles */
.debug-panel {
  margin-top: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-sm);
  background: rgba(10, 10, 15, 0.85);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.debug-header {
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-family: monospace;
  font-size: 12px;
  font-weight: bold;
  color: var(--text-primary);
}

.debug-body {
  max-height: 180px;
  overflow-y: auto;
  padding: 12px 16px;
  font-family: 'Consolas', 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.5;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.log-line {
  color: #a9b7c6;
  white-space: pre-wrap;
  word-break: break-all;
}

.log-error {
  color: #ff6b6b !important;
  background: rgba(255, 107, 107, 0.05);
  border-left: 3px solid #ff6b6b;
  padding-left: 6px;
}

.log-warn {
  color: #ffb86c !important;
  background: rgba(255, 184, 108, 0.05);
  border-left: 3px solid #ffb86c;
  padding-left: 6px;
}

.log-info {
  color: #50fa7b !important;
}

.log-empty {
  color: var(--text-muted);
  font-style: italic;
  text-align: center;
}

@media (max-width: 768px) {
  .sidebar {
    position: relative;
    left: 0;
    top: 0;
    bottom: auto;
    width: 100%;
    border-radius: 0;
    flex-direction: row;
    align-items: center;
    padding: 12px 16px;
  }

  .sidebar-header {
    padding: 0;
    margin: 0;
    border: none;
  }

  .sidebar-nav {
    flex-direction: row;
    margin-left: 24px;
  }

  .sidebar-footer {
    display: none;
  }

  .main-content {
    margin-left: 0;
    padding: 16px 12px;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: var(--radius-sm);
  margin-bottom: 8px;
  overflow: hidden;
}

.user-icon {
  font-size: 14px;
}

.user-email {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
}

.w-100 {
  width: 100%;
}

.mt-1 {
  margin-top: 4px;
}
</style>
