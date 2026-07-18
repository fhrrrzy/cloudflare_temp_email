<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
    <div class="w-full max-w-5xl">
      <Card class="overflow-hidden border border-border bg-card shadow-2xl">
        <CardContent class="grid p-0 md:grid-cols-12">
          <!-- Left Column: Ambient Panel (Visible on MD+) -->
          <div class="relative hidden md:flex md:col-span-5 flex-col justify-between bg-zinc-950 p-10 text-white overflow-hidden border-r border-border">
            <!-- Glow background -->
            <div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.08),transparent_70%)]"></div>
            
            <div class="relative z-10 flex items-center gap-2">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">
                T
              </div>
              <span class="text-lg font-semibold tracking-tight">Temp Mail Admin</span>
            </div>

            <div class="relative z-10 my-auto space-y-4">
              <h2 class="text-2xl font-bold tracking-tight text-white leading-snug">
                Where secure mail is managed.
              </h2>
              <p class="text-sm text-zinc-400">
                A professional administrative console for managing temporary email pools, active inboxes, and system utilization.
              </p>
            </div>

            <div class="relative z-10 flex items-center gap-3">
              <div class="flex -space-x-2">
                <img class="inline-block h-8 w-8 rounded-full ring-2 ring-zinc-950 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&facepad=2&w=80&h=80&q=80" alt="Avatar" />
                <img class="inline-block h-8 w-8 rounded-full ring-2 ring-zinc-950 object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&facepad=2&w=80&h=80&q=80" alt="Avatar" />
                <img class="inline-block h-8 w-8 rounded-full ring-2 ring-zinc-950 object-cover" src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&facepad=2&w=80&h=80&q=80" alt="Avatar" />
              </div>
              <span class="text-xs text-zinc-400">Join 40,000+ teams globally</span>
            </div>
          </div>

          <!-- Right Column: Login Credentials Form -->
          <div class="md:col-span-7 flex flex-col justify-center px-6 py-12 sm:px-16">
            <div class="w-full max-w-md mx-auto space-y-6">
              <div class="space-y-2">
                <h1 class="text-2xl font-semibold tracking-tight text-white">Welcome back</h1>
                <p class="text-sm text-muted-foreground">Sign in to your administration workspace.</p>
              </div>

              <form @submit.prevent="handleSignIn" autocomplete="on" class="space-y-4">
                <div class="space-y-2">
                  <Label for="ss-username" class="text-xs font-medium text-zinc-300">Username / Email</Label>
                  <Input 
                    id="ss-username" 
                    v-model="username" 
                    placeholder="admin" 
                    required 
                    autocomplete="username"
                    class="h-10 border-border bg-zinc-900/50 text-white placeholder-zinc-500 focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <Label for="ss-password" class="text-xs font-medium text-zinc-300">Password</Label>
                  </div>
                  <div class="relative">
                    <Input 
                      id="ss-password" 
                      v-model="password" 
                      :type="showPassword ? 'text' : 'password'" 
                      placeholder="••••••••" 
                      required 
                      autocomplete="current-password"
                      class="h-10 pr-10 border-border bg-zinc-900/50 text-white placeholder-zinc-500 focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                    <button 
                      type="button" 
                      class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors" 
                      @click="togglePasswordVisibility"
                      :aria-label="showPassword ? 'Hide password' : 'Show password'"
                    >
                      <Eye v-if="!showPassword" class="h-4 w-4" />
                      <EyeOff v-else class="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <!-- Error state visual alert -->
                <div v-if="error" class="flex items-center gap-2 rounded-lg border border-red-900/30 bg-red-950/20 px-3 py-2.5 text-xs text-red-400">
                  <AlertCircle class="h-4 w-4 shrink-0" />
                  <span>{{ error }}</span>
                </div>

                <Button 
                  type="submit" 
                  class="w-full h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-colors"
                  :disabled="loading"
                >
                  <span v-if="loading">Signing in...</span>
                  <span v-else>Sign in</span>
                </Button>
              </form>

              <p class="text-center text-xs text-muted-foreground">
                Protected instance. Need access? 
                <a href="mailto:admin@temp-mail.codeflai.tech" class="text-white hover:underline ml-1">Contact administrator</a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '../services/authService'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, AlertCircle } from 'lucide-vue-next'

const router = useRouter()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)
const showPassword = ref(false)

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
