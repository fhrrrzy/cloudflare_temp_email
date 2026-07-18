<template>
  <div class="auth-grid-container">
    <!-- Left Column: Form Container -->
    <div class="auth-form-column">
      <div class="auth-inner-box">
        <!-- Sign In Form -->
        <form v-if="isSignIn" @submit.prevent="handleSignIn" autocomplete="on" class="auth-form-content">
          <div class="form-header">
            <h1 class="auth-title">Sign in to your account</h1>
            <p class="auth-desc">Enter your credentials below to sign in</p>
          </div>

          <div class="fields-group">
            <div class="field">
              <label for="username">Username / Email</label>
              <input-text 
                id="username" 
                v-model="username" 
                placeholder="admin" 
                required 
                autocomplete="username"
                class="w-full text-input-field"
                :class="{ 'p-invalid': error }"
              />
            </div>

            <div class="field">
              <label for="password">Password</label>
              <div class="password-input-wrapper">
                <input-text 
                  id="password" 
                  v-model="password" 
                  :type="showPassword ? 'text' : 'password'" 
                  placeholder="Password" 
                  required 
                  autocomplete="current-password"
                  class="w-full text-input-field pe-10"
                  :class="{ 'p-invalid': error }"
                />
                <button 
                  type="button" 
                  class="password-visibility-toggle" 
                  @click="togglePasswordVisibility"
                  :aria-label="showPassword ? 'Hide password' : 'Show password'"
                >
                  <i :class="showPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Alert message block -->
          <div v-if="error" class="auth-error-alert">
            <i class="pi pi-exclamation-circle" />
            <span>{{ error }}</span>
          </div>

          <p-button 
            type="submit" 
            label="Sign In" 
            class="w-full submit-action-btn" 
            :loading="loading" 
          />
        </form>

        <!-- Sign Up Form (Mock representation) -->
        <form v-else @submit.prevent="handleSignUp" autocomplete="on" class="auth-form-content">
          <div class="form-header">
            <h1 class="auth-title">Create an account</h1>
            <p class="auth-desc">Enter your details below to sign up</p>
          </div>

          <div class="fields-group">
            <div class="field">
              <label for="name">Full Name</label>
              <input-text 
                id="name" 
                v-model="signupName" 
                placeholder="John Doe" 
                required 
                autocomplete="name"
                class="w-full text-input-field"
              />
            </div>

            <div class="field">
              <label for="email">Email</label>
              <input-text 
                id="email" 
                v-model="signupEmail" 
                placeholder="m@example.com" 
                required 
                autocomplete="email"
                class="w-full text-input-field"
              />
            </div>

            <div class="field">
              <label for="signup-password">Password</label>
              <div class="password-input-wrapper">
                <input-text 
                  id="signup-password" 
                  v-model="signupPassword" 
                  :type="showSignupPassword ? 'text' : 'password'" 
                  placeholder="Password" 
                  required 
                  autocomplete="new-password"
                  class="w-full text-input-field pe-10"
                />
                <button 
                  type="button" 
                  class="password-visibility-toggle" 
                  @click="toggleSignupPasswordVisibility"
                  :aria-label="showSignupPassword ? 'Hide password' : 'Show password'"
                >
                  <i :class="showSignupPassword ? 'pi pi-eye-slash' : 'pi pi-eye'"></i>
                </button>
              </div>
            </div>
          </div>

          <p-button 
            type="submit" 
            label="Sign Up" 
            class="w-full submit-action-btn" 
          />
        </form>

        <!-- Toggle Form Switcher -->
        <div class="form-toggle-footer">
          <span>{{ isSignIn ? "Don't have an account?" : "Already have an account?" }}</span>
          <p-button 
            :label="isSignIn ? 'Sign up' : 'Sign in'" 
            class="p-button-link inline-toggle-btn" 
            @click="toggleForm" 
          />
        </div>

      </div>
    </div>

    <!-- Right Column: Visual Layout & Typewriter -->
    <div 
      class="auth-visual-column"
      :style="{ backgroundImage: 'url(' + currentContent.image.src + ')' }"
      :key="currentContent.image.src"
    >
      <!-- Bottom soft visual fade -->
      <div class="visual-gradient-overlay"></div>
      
      <!-- Quote Block -->
      <div class="quote-content-container">
        <blockquote class="brand-blockquote">
          <p class="quote-text-line">
            “<typewriter-text 
              :key="currentContent.quote.text" 
              :text="currentContent.quote.text" 
              :speed="60" 
            />”
          </p>
          <cite class="quote-author-line">
            — {{ currentContent.quote.author }}
          </cite>
        </blockquote>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/authService'
import TypewriterText from '@/components/TypewriterText.vue'

const router = useRouter()

// Sign-in inputs
const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

// Sign-up inputs (mock)
const signupName = ref('')
const signupEmail = ref('')
const signupPassword = ref('')
const showSignupPassword = ref(false)

// Toggle sign-in / sign-up state
const isSignIn = ref(true)

const defaultSignInContent = {
  image: {
    src: "https://i.ibb.co/XrkdGrrv/original-ccdd6d6195fff2386a31b684b7abdd2e-removebg-preview.png",
    alt: "A beautiful interior design for sign-in"
  },
  quote: {
    text: "Welcome Back! The journey continues.",
    author: "EaseMize UI"
  }
}

const defaultSignUpContent = {
  image: {
    src: "https://i.ibb.co/HTZ6DPsS/original-33b8479c324a5448d6145b3cad7c51e7-removebg-preview.png",
    alt: "A vibrant, modern space for new beginnings"
  },
  quote: {
    text: "Create an account. A new chapter awaits.",
    author: "EaseMize UI"
  }
}

const currentContent = computed(() => {
  return isSignIn.value ? defaultSignInContent : defaultSignUpContent
})

const toggleForm = () => {
  isSignIn.value = !isSignIn.value
  error.value = ''
}

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const toggleSignupPasswordVisibility = () => {
  showSignupPassword.value = !showSignupPassword.value
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
      router.push('/dashboard')
    } else {
      error.value = 'Invalid username or password.'
    }
  }, 500)
}

const handleSignUp = () => {
  alert('Sign Up simulated successfully! User registration is restricted to system administrators.')
}

</script>

<style scoped>
/* Responsive Grid Container matching React grid layout */
.auth-grid-container {
  display: grid;
  grid-template-columns: 1fr;
  min-height: 100vh;
  width: 100vw;
  background-color: var(--slate-50);
  box-sizing: border-box;
}

@media (min-width: 768px) {
  .auth-grid-container {
    grid-template-columns: 1fr 1fr;
  }
}

/* Left Form Column */
.auth-form-column {
  display: flex;
  height: 100vh;
  align-items: center;
  justify-content: center;
  padding: 24px;
  box-sizing: border-box;
  background-color: var(--bg-card, #ffffff);
}

.auth-inner-box {
  width: 100%;
  max-width: 350px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.auth-form-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.form-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  text-align: center;
}

.auth-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--slate-700);
  margin: 0;
}

.auth-desc {
  font-size: 14px;
  color: var(--slate-500);
  margin: 0;
}

.fields-group {
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: left;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label {
  font-size: 14px;
  font-weight: 500;
  color: var(--slate-700);
}

/* Input Fields overrides */
.text-input-field {
  width: 100%;
  height: 40px;
  background-color: var(--bg-card, #ffffff) !important;
  border: 1px solid var(--slate-300) !important;
  border-radius: 8px !important;
  padding: 12px !important;
  font-size: 14px !important;
  color: var(--slate-700) !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
  transition: all var(--transition-fast) !important;
}

.text-input-field:focus {
  border-color: var(--primary-color) !important;
  box-shadow: 0 0 0 2px var(--primary-tint) !important;
  outline: none !important;
}

.password-input-wrapper {
  position: relative;
  width: 100%;
}

.pe-10 {
  padding-right: 40px !important;
}

.password-visibility-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--slate-500);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color var(--transition-fast);
}

.password-visibility-toggle:hover {
  color: var(--slate-700);
}

/* Error Banner */
.auth-error-alert {
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 6px;
  color: #ef4444;
  padding: 10px 14px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
}

.auth-error-alert i {
  font-size: 14px;
}

/* Primary buttons */
.submit-action-btn {
  background-color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
  color: #09090b !important; /* Premium dark text on emerald */
  font-weight: 600 !important;
  height: 40px !important;
  border-radius: 8px !important;
}

.submit-action-btn:hover {
  background-color: var(--primary-hover) !important;
  border-color: var(--primary-hover) !important;
}

.form-toggle-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 14px;
  color: var(--slate-500);
}

.inline-toggle-btn {
  padding: 0 !important;
  font-weight: 500 !important;
  color: var(--slate-700) !important;
  text-decoration: none !important;
}

.inline-toggle-btn:hover {
  text-decoration: underline !important;
}


/* Right Column: Visual panel showing images */
.auth-visual-column {
  display: none;
  position: relative;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  transition: all 0.5s ease-in-out;
  background-color: var(--slate-800); /* Dark slate backup */
}

@media (min-width: 768px) {
  .auth-visual-column {
    display: block;
  }
}

.visual-gradient-overlay {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 150px;
  background: linear-gradient(to top, var(--slate-900), transparent);
  z-index: 2;
}

.quote-content-container {
  position: relative;
  z-index: 10;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 32px;
  box-sizing: border-box;
}

.brand-blockquote {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
  color: #ffffff;
  margin: 0;
}

.quote-text-line {
  font-size: 18px;
  font-weight: 500;
  margin: 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
}

.quote-author-line {
  font-size: 14px;
  font-style: normal;
  color: var(--slate-300);
}
</style>
