<template>
  <div class="login-page">
    <div class="glass-card login-card animate-fade-in">
      <div class="card-header">
        <h2 class="logo">📊 FB Crawler</h2>
        <p class="subtitle">{{ isRegisterMode ? 'Đăng ký tài khoản mới' : 'Đăng nhập vào hệ thống' }}</p>
      </div>

      <form @submit.prevent="handleSubmit" class="form-container">
        <div class="form-group animate-slide-up">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            placeholder="example@domain.com"
            class="input"
          />
        </div>

        <div class="form-group animate-slide-up" style="animation-delay: 0.1s;">
          <label for="password">Mật khẩu</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            placeholder="••••••••"
            class="input"
          />
        </div>

        <div v-if="isRegisterMode" class="form-group animate-slide-up" style="animation-delay: 0.2s;">
          <label for="confirmPassword">Xác nhận mật khẩu</label>
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            type="password"
            required
            placeholder="••••••••"
            class="input"
          />
        </div>

        <div v-if="errorMessage" class="error-alert animate-shake">
          ⚠️ {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="success-alert">
          ✅ {{ successMessage }}
        </div>

        <button
          type="submit"
          class="btn btn-primary w-100 animate-slide-up"
          style="animation-delay: 0.3s;"
          :disabled="loading"
        >
          {{ loading ? 'Đang xử lý...' : (isRegisterMode ? 'Đăng ký' : 'Đăng nhập') }}
        </button>
      </form>

      <div class="card-footer animate-fade-in" style="animation-delay: 0.4s;">
        <span v-if="!isRegisterMode">
          Chưa có tài khoản?
          <a href="#" @click.prevent="toggleMode" class="toggle-link">Đăng ký ngay</a>
        </span>
        <span v-else>
          Đã có tài khoản?
          <a href="#" @click.prevent="toggleMode" class="toggle-link">Đăng nhập</a>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useApi } from '~/composables/useApi'

definePageMeta({
  layout: false // Do not use default sidebar layout
})

const router = useRouter()
const api = useApi()

const isRegisterMode = ref(false)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const loading = ref(false)

function toggleMode() {
  isRegisterMode.value = !isRegisterMode.value
  errorMessage.value = ''
  successMessage.value = ''
  password.value = ''
  confirmPassword.value = ''
}

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''
  
  if (isRegisterMode.value && password.value !== confirmPassword.value) {
    errorMessage.value = 'Mật khẩu xác nhận không trùng khớp'
    return
  }

  loading.value = true
  try {
    if (isRegisterMode.value) {
      const { data, error } = await api.register({
        email: email.value,
        password: password.value
      })

      if (error.value) {
        errorMessage.value = (error.value as any).data?.message || 'Đăng ký thất bại. Email có thể đã được sử dụng.'
      } else {
        successMessage.value = 'Đăng ký thành công! Hãy đăng nhập.'
        isRegisterMode.value = false
        password.value = ''
        confirmPassword.value = ''
      }
    } else {
      const { data, error } = await api.login({
        email: email.value,
        password: password.value
      })

      if (error.value) {
        errorMessage.value = (error.value as any).data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.'
      } else if (data.value && data.value.token) {
        localStorage.setItem('token', data.value.token)
        localStorage.setItem('userEmail', data.value.user.email)
        router.push('/')
      }
    }
  } catch (err) {
    errorMessage.value = 'Đã xảy ra lỗi kết nối.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: radial-gradient(circle at top right, rgba(80, 110, 240, 0.15), transparent 60%),
              radial-gradient(circle at bottom left, rgba(240, 80, 180, 0.1), transparent 60%),
              #080810;
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  padding: 40px 30px;
  border-radius: var(--radius-md);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
  animation-duration: 0.6s;
}

.card-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  font-size: 26px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 14px;
  color: var(--text-muted);
}

.form-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation-duration: 0.5s;
  animation-fill-mode: both;
}

.form-group label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-secondary);
}

.error-alert {
  padding: 12px;
  background: rgba(255, 75, 75, 0.15);
  border: 1px solid rgba(255, 75, 75, 0.25);
  color: #ff6b6b;
  border-radius: var(--radius-sm);
  font-size: 13px;
  line-height: 1.4;
}

.success-alert {
  padding: 12px;
  background: rgba(46, 213, 115, 0.15);
  border: 1px solid rgba(46, 213, 115, 0.25);
  color: #2ed573;
  border-radius: var(--radius-sm);
  font-size: 13px;
  line-height: 1.4;
}

.card-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 13px;
  color: var(--text-secondary);
}

.toggle-link {
  color: var(--accent);
  text-decoration: none;
  font-weight: 600;
  margin-left: 4px;
  transition: opacity 0.2s;
}

.toggle-link:hover {
  opacity: 0.8;
}

.w-100 {
  width: 100%;
}

/* Micro-animations */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

.animate-slide-up {
  animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.animate-shake {
  animation: shake 0.2s ease-in-out 2;
}
</style>
