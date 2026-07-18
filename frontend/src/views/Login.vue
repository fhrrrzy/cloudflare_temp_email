<template>
  <div class="auth-page-wrapper">
    <div class="auth-card-container">
      <div class="auth-card">
        <!-- Left Column: Brand & Visuals (Visible on MD screens) -->
        <div class="brand-visual-panel">
          <!-- Ambient glowing background -->
          <div class="blur-glow-effect"></div>

          <div class="brand-logo-row">
            <div class="logo-accent-box">
              <div class="logo-inner-diamond"></div>
            </div>
            <span class="brand-name-text">Temp Mail Admin</span>
          </div>

          <h2 class="visual-heading">
            Where secure mail is managed.
          </h2>

          <div class="proof-social-row">
            <div class="avatar-stack">
              <div v-for="p in proof" :key="p.initials" class="avatar-item">
                <img :src="p.src" :alt="p.initials" class="avatar-img" />
              </div>
            </div>
            <span class="proof-count-label">
              Join 40,000+ teams globally
            </span>
          </div>
        </div>

        <!-- Right Column: Login Credentials Form -->
        <div class="form-content-panel">
          <div class="panel-header">
            <h1 class="panel-title">Welcome back</h1>
            <p class="panel-subtitle">Sign in to your administration workspace.</p>
          </div>

          <form @submit.prevent="handleSignIn" autocomplete="on" class="panel-form">
            <div class="fields-stack">
              <div class="field-item">
                <label for="ss-username" class="field-label">Username / Email</label>
                <input-text 
                  id="ss-username" 
                  v-model="username" 
                  placeholder="admin" 
                  required 
                  autocomplete="username"
                  class="w-full form-input"
                  :class="{ 'p-invalid': error }"
                />
              </div>

              <div class="field-item">
                <div class="field-label-row">
                  <label for="ss-password" class="field-label">Password</label>
                </div>
                <div class="relative-field-wrapper">
                  <input-text 
                    id="ss-password" 
                    v-model="password" 
                    :type="showPassword ? 'text' : 'password'" 
                    placeholder="••••••••" 
                    required 
                    autocomplete="current-password"
                    class="w-full form-input pe-10"
                    :class="{ 'p-invalid': error }"
                  />
                  <button 
                    type="button" 
                    class="field-visibility-toggle" 
                    @click="togglePasswordVisibility"
                    :aria-label="showPassword ? 'Hide password' : 'Show password'"
                  >
                    <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                  </button>
                </div>
              </div>
            </div>

            <!-- Error state visual alert -->
            <div v-if="error" class="panel-error-alert">
              <i class="pi pi-exclamation-circle" />
              <span>{{ error }}</span>
            </div>

            <p-button 
              type="submit" 
              class="w-full form-submit-btn" 
              :loading="loading"
            >
              <span class="p-button-label">Sign in</span>
            </p-button>
          </form>

          <p class="panel-footer-note">
            Protected instance. Need access? 
            <a href="mailto:admin@temp-mail.codeflai.tech" class="footer-contact-link">Contact administrator</a>
          </p>
        </div>
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
const showPassword = ref(false)

const proof = [
  {
    initials: 'JD',
    src: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&facepad=2&w=80&h=80&q=80',
  },
  {
    initials: 'MK',
    src: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&facepad=2&w=80&h=80&q=80',
  },
  {
    initials: 'AR',
    src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&facepad=2&w=80&h=80&q=80',
  },
]

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const handleSignIn = () => {
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
      router.push('/admin/home')
    } else {
      error.value = 'Invalid username or password.'
    }
  }, 500)
}
</script>

<style scoped>
/* Scoped custom variables mapping to shadcn design specifications */
.auth-page-wrapper {
  --radius: 12px;
  --background: oklch(0.986 0 0);
  --foreground: oklch(0.2435 0 0);
  --card: #ffffff;
  --card-foreground: oklch(0.2435 0 0);
  --primary: var(--primary-color, oklch(0.68 0.17 154)); /* Emerald Green branding */
  --primary-foreground: #09090b; /* High-contrast dark ink */
  --muted: oklch(0.9521 0 0);
  --muted-foreground: oklch(0.5032 0 0);
  --border: oklch(0.932 0 0);
  --input: oklch(0.8822 0 0);

  min-height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--background);
  box-sizing: border-box;
  padding: 24px;
}

/* Outer layout card matching React SignIn6 */
.auth-card-container {
  width: 100%;
  max-width: 800px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  border-radius: var(--radius);
  overflow: hidden;
  border: 1px solid var(--border);
}

.auth-card {
  display: grid;
  grid-template-columns: 1fr;
  background-color: var(--card);
}

@media (min-width: 768px) {
  .auth-card {
    grid-template-columns: 1.1fr 0.9fr;
  }
}

/* Left side visual branding */
.brand-visual-panel {
  display: none;
  position: relative;
  background: linear-gradient(135deg, var(--slate-900) 0%, #0f172a 100%);
  padding: 40px;
  box-sizing: border-box;
  overflow: hidden;
  flex-direction: column;
  justify-content: space-between;
  min-height: 440px;
  text-align: left;
}

@media (min-width: 768px) {
  .brand-visual-panel {
    display: flex;
  }
}

.blur-glow-effect {
  position: absolute;
  top: -96px;
  right: -96px;
  width: 256px;
  height: 256px;
  background-color: rgba(16, 185, 129, 0.15); /* Soft emerald glow */
  border-radius: 50%;
  filter: blur(80px);
  pointer-events: none;
}

.brand-logo-row {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
  z-index: 10;
}

.logo-accent-box {
  display: flex;
  width: 32px;
  height: 32px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background-color: rgba(255, 255, 255, 0.08);
}

.logo-inner-diamond {
  width: 12px;
  height: 12px;
  transform: rotate(45deg);
  background-color: var(--primary-color);
  border-radius: 2px;
}

.brand-name-text {
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: -0.01em;
}

.visual-heading {
  font-size: 26px;
  font-weight: 600;
  line-height: 1.15;
  color: #ffffff;
  max-width: 15ch;
  margin: auto 0 0 0;
  letter-spacing: -0.03em;
  position: relative;
  z-index: 10;
}

.proof-social-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
  position: relative;
  z-index: 10;
}

.avatar-stack {
  display: flex;
  margin-left: 10px;
}

.avatar-item {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--slate-900);
  overflow: hidden;
  margin-left: -10px;
}

.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.proof-count-label {
  font-size: 12px;
  color: var(--slate-400);
}

/* Right side login form */
.form-content-panel {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 20px;
  padding: 40px;
  box-sizing: border-box;
  text-align: left;
}

.panel-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--slate-900);
  margin: 0;
}

.panel-subtitle {
  font-size: 12px;
  color: var(--muted-foreground);
  margin: 0;
}

.panel-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.fields-stack {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--slate-700);
}

.form-input {
  width: 100%;
  height: 40px;
  background-color: var(--card) !important;
  border: 1px solid var(--border) !important;
  border-radius: 6px !important;
  padding: 10px 12px !important;
  font-size: 14px !important;
  color: var(--foreground) !important;
  transition: all var(--transition-fast) !important;
}

.form-input:focus {
  border-color: var(--primary) !important;
  outline: none !important;
  box-shadow: 0 0 0 2px var(--primary-tint) !important;
}

.relative-field-wrapper {
  position: relative;
  width: 100%;
}

.pe-10 {
  padding-right: 38px !important;
}

.field-visibility-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--muted-foreground);
  display: flex;
  align-items: center;
  justify-content: center;
}

.field-visibility-toggle:hover {
  color: var(--foreground);
}

/* Panel Error alert */
.panel-error-alert {
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 6px;
  color: #ef4444;
  padding: 10px 14px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-error-alert i {
  font-size: 14px;
}

/* Form Action Buttons */
.form-submit-btn {
  background-color: var(--primary) !important;
  border-color: var(--primary) !important;
  color: var(--primary-foreground) !important;
  font-weight: 600 !important;
  height: 40px !important;
  border-radius: 6px !important;
}

.form-submit-btn:hover {
  background-color: var(--primary-hover) !important;
  border-color: var(--primary-hover) !important;
}

.panel-footer-note {
  font-size: 12px;
  color: var(--muted-foreground);
  text-align: center;
  margin: 10px 0 0 0;
}

.footer-contact-link {
  color: var(--foreground);
  font-weight: 500;
  text-decoration: none;
}

.footer-contact-link:hover {
  text-decoration: underline;
}
</style>
