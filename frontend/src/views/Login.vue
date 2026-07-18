<template>
  <div class="login-wrapper">
    <div class="login-panel">
      <!-- Brand Identity Section -->
      <div class="brand-section">
        <div class="logo-box">
          <img src="/logo.png" alt="Logo" class="brand-logo" />
        </div>
        <h1 class="brand-title">Temp Mail Admin</h1>
        <p class="brand-subtitle">Sign in to access your administrative dashboard</p>
      </div>

      <!-- Credentials Form -->
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-field">
          <label for="username">Username</label>
          <div class="input-wrapper">
            <i class="pi pi-user field-icon" />
            <input-text 
              id="username" 
              v-model="username" 
              placeholder="admin" 
              class="w-full text-input"
              :class="{ 'p-invalid': error }"
            />
          </div>
        </div>

        <div class="form-field">
          <label for="password">Password</label>
          <div class="input-wrapper">
            <i class="pi pi-lock field-icon" />
            <password 
              id="password" 
              v-model="password" 
              placeholder="••••••••" 
              :feedback="false" 
              toggle-mask
              class="w-full text-input"
              input-class="w-full"
              :class="{ 'p-invalid': error }"
            />
          </div>
        </div>

        <!-- Alert messages -->
        <div v-if="error" class="login-alert">
          <i class="pi pi-exclamation-circle" />
          <span>{{ error }}</span>
        </div>

        <!-- Submission Trigger -->
        <p-button 
          type="submit" 
          label="Sign In" 
          icon="pi pi-sign-in" 
          :loading="loading" 
          class="w-full sign-in-btn" 
        />
      </form>

      <!-- Credentials Guidance Info -->
      <div class="demo-credentials-box">
        <div class="demo-header">
          <i class="pi pi-info-circle"></i>
          <span>Developer Credentials</span>
        </div>
        <div class="demo-line">Username: <code class="credentials-code">admin</code></div>
        <div class="demo-line">Password: <code class="credentials-code">admin123</code></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/authService'

const router = useRouter()
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

const handleLogin = () => {
  if (!username.value || !password.value) {
    error.value = 'Please enter both username and password.'
    return
  }

  loading.value = true
  error.value = ''

  // Meticulous simulated latency for visual state polish
  setTimeout(() => {
    const success = authService.login(username.value, password.value)
    loading.value = false
    if (success) {
      router.push('/dashboard')
    } else {
      error.value = 'Invalid username or password.'
    }
  }, 500)
}
</script>

<style scoped>
/* Slate-Dark layout structure to express security and administrative trust */
.login-wrapper {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: var(--slate-900); /* Bound to dark slate design token */
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* Polished minimalist container card. No glassmorphism. No soft outer glow. */
.login-panel {
  background-color: #0f172a; /* Solid slate 900 card */
  border: 1px solid var(--slate-800);
  border-radius: 8px; /* Clean boundary, no over-rounding */
  padding: 48px 40px;
  width: 100%;
  max-width: 420px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.brand-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.logo-box {
  background-color: #1e293b;
  padding: 12px;
  border-radius: 8px;
  display: inline-flex;
  margin-bottom: 16px;
  border: 1px solid var(--slate-800);
}

.brand-logo {
  width: 44px;
  height: 44px;
  object-fit: contain;
}

.brand-title {
  color: #ffffff;
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 6px 0;
  letter-spacing: -0.02em; /* Grotesque spacing alignment */
}

.brand-subtitle {
  color: var(--slate-400);
  font-size: 13px;
  margin: 0;
  line-height: 1.4;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.form-field label {
  font-size: 12px;
  font-weight: 600;
  color: var(--slate-300);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.field-icon {
  position: absolute;
  left: 14px;
  color: var(--slate-500);
  font-size: 14px;
  z-index: 10;
}

/* Custom styled inputs bound to slate-green scheme */
:deep(.text-input .p-inputtext) {
  width: 100%;
  background-color: #1e293b !important;
  border: 1px solid var(--slate-800) !important;
  color: #ffffff !important;
  padding: 10px 12px 10px 38px !important;
  border-radius: 6px !important;
  font-size: 14px !important;
  transition: border-color var(--transition-fast) !important;
}

:deep(.text-input .p-inputtext:focus),
:deep(.text-input .p-inputtext:enabled:hover:focus) {
  border-color: var(--primary-color) !important;
  outline: none !important;
}

:deep(.text-input .p-inputtext:hover) {
  border-color: var(--slate-700) !important;
}

/* Override error outline */
:deep(.text-input .p-inputtext.p-invalid) {
  border-color: #ef4444 !important;
}

/* Alert panel */
.login-alert {
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
}

.login-alert i {
  font-size: 14px;
  flex-shrink: 0;
}

/* High contrast primary action button */
.sign-in-btn {
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
  color: #0f172a !important; /* Premium dark text contrast */
  font-weight: 700 !important;
  padding: 10px 16px !important;
  font-size: 14px !important;
  border-radius: 6px !important;
}

.sign-in-btn:hover {
  background-color: var(--primary-hover) !important;
  border-color: var(--primary-hover) !important;
}

/* Credentials info panel */
.demo-credentials-box {
  background-color: #1e293b;
  border: 1px solid var(--slate-800);
  border-radius: 6px;
  padding: 14px 18px;
  font-size: 12px;
  color: var(--slate-300);
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.demo-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: var(--slate-100);
  margin-bottom: 2px;
}

.demo-line {
  display: flex;
  justify-content: space-between;
}

.credentials-code {
  background-color: #0f172a;
  color: var(--primary-color);
  padding: 1px 6px;
  border-radius: 4px;
  font-family: monospace;
}
</style>
