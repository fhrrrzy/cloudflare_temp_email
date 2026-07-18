<template>
  <div class="login-container">
    <div class="glass-card">
      <div class="brand">
        <img src="/logo.png" alt="Logo" class="logo" />
        <h2>Temp Mail Admin</h2>
        <p>Sign in to manage the temporary email system</p>
      </div>

      <form @submit.prevent="handleLogin" class="form">
        <div class="field">
          <label for="username">Username</label>
          <span class="p-input-icon-left">
            <i class="pi pi-user" />
            <input-text 
              id="username" 
              v-model="username" 
              placeholder="Enter username" 
              class="w-full"
              :class="{ 'p-invalid': error }"
            />
          </span>
        </div>

        <div class="field">
          <label for="password">Password</label>
          <span class="p-input-icon-left">
            <i class="pi pi-lock" />
            <password 
              id="password" 
              v-model="password" 
              placeholder="Enter password" 
              :feedback="false" 
              toggle-mask
              class="w-full"
              input-class="w-full"
              :class="{ 'p-invalid': error }"
            />
          </span>
        </div>

        <div v-if="error" class="error-msg">
          <i class="pi pi-exclamation-triangle" />
          <span>{{ error }}</span>
        </div>

        <p-button 
          type="submit" 
          label="Sign In" 
          icon="pi pi-sign-in" 
          :loading="loading" 
          class="w-full p-button-lg brand-button" 
        />
      </form>
      
      <div class="demo-info">
        <p>Demo Username: <strong>admin</strong></p>
        <p>Demo Password: <strong>admin123</strong></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/authService'

// PrimeVue auto-imported components (Button, InputText, Password)
// We will register them or let unplugin resolve them.
// Note: buttons in PrimeVue v3 can be resolved via p-button or Button, but prefixing is safer.

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

  setTimeout(() => {
    const success = authService.login(username.value, password.value)
    loading.value = false
    if (success) {
      router.push('/dashboard')
    } else {
      error.value = 'Invalid username or password.'
    }
  }, 600)
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

.login-container {
  font-family: 'Inter', sans-serif;
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at 10% 20%, rgb(59, 149, 237) 0%, rgb(7, 91, 173) 90%);
  margin: 0;
  padding: 0;
}

.glass-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 40px;
  width: 100%;
  max-width: 440px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
  box-sizing: border-box;
}

.brand {
  text-align: center;
  margin-bottom: 30px;
}

.logo {
  width: 70px;
  height: 70px;
  object-fit: contain;
  margin-bottom: 15px;
}

.brand h2 {
  color: #1e293b;
  margin: 0 0 8px 0;
  font-weight: 700;
  font-size: 26px;
}

.brand p {
  color: #64748b;
  margin: 0;
  font-size: 14px;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
  text-align: left;
}

.w-full {
  width: 100%;
}

.error-msg {
  background: #fef2f2;
  border: 1px solid #fee2e2;
  color: #ef4444;
  padding: 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.brand-button {
  background: #0ea5e9;
  border-color: #0ea5e9;
  font-weight: 600;
  transition: all 0.2s ease;
}

.brand-button:hover {
  background: #0284c7 !important;
  border-color: #0284c7 !important;
  transform: translateY(-1px);
}

.demo-info {
  margin-top: 25px;
  padding-top: 20px;
  border-top: 1px solid #e2e8f0;
  font-size: 13px;
  color: #64748b;
  text-align: center;
}

.demo-info p {
  margin: 4px 0;
}
</style>
