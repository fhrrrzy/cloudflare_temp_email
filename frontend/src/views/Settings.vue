<template>
  <div class="space-y-6 max-w-4xl">
    <!-- SMTP Configuration Card -->
    <Card class="border-border bg-card text-white">
      <CardHeader class="flex flex-row items-start gap-4 space-y-0 pb-6 border-b border-border bg-zinc-950/20">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-primary border border-emerald-500/20 mt-1">
          <Server class="h-5 w-5" />
        </div>
        <div>
          <CardTitle class="text-lg font-semibold text-white">SMTP Configuration</CardTitle>
          <CardDescription class="text-xs text-zinc-400">Configure SMTP server details for sending emails.</CardDescription>
        </div>
      </CardHeader>
      
      <CardContent class="p-6">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="smtp-host" class="text-xs text-zinc-300">SMTP Host</Label>
            <Input id="smtp-host" v-model="settings.smtp.host" placeholder="smtp.example.com" class="h-10 border-border bg-zinc-900/50 text-white placeholder-zinc-500" />
          </div>
          
          <div class="space-y-2">
            <Label for="smtp-port" class="text-xs text-zinc-300">SMTP Port</Label>
            <Input id="smtp-port" v-model.number="settings.smtp.port" placeholder="587" class="h-10 border-border bg-zinc-900/50 text-white placeholder-zinc-500" />
          </div>
          
          <div class="space-y-2">
            <Label for="smtp-user" class="text-xs text-zinc-300">SMTP Username</Label>
            <Input id="smtp-user" v-model="settings.smtp.username" placeholder="user@example.com" class="h-10 border-border bg-zinc-900/50 text-white placeholder-zinc-500" />
          </div>
          
          <div class="space-y-2">
            <Label for="smtp-pass" class="text-xs text-zinc-300">SMTP Password</Label>
            <Input id="smtp-pass" type="password" v-model="settings.smtp.password" placeholder="••••••••" class="h-10 border-border bg-zinc-900/50 text-white placeholder-zinc-500" />
          </div>

          <div class="space-y-2">
            <Label for="smtp-enc" class="text-xs text-zinc-300">Encryption Type</Label>
            <Select v-model="settings.smtp.encryption">
              <SelectTrigger id="smtp-enc" class="h-10 border-border bg-zinc-900/50 text-white">
                <SelectValue placeholder="Select encryption" />
              </SelectTrigger>
              <SelectContent class="border-border bg-zinc-900 text-white">
                <SelectItem v-for="opt in encryptionOptions" :key="opt" :value="opt">
                  {{ opt }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="smtp-sender-name" class="text-xs text-zinc-300">Sender Display Name</Label>
            <Input id="smtp-sender-name" v-model="settings.smtp.senderName" placeholder="System Notification" class="h-10 border-border bg-zinc-900/50 text-white placeholder-zinc-500" />
          </div>
          
          <div class="space-y-2 sm:col-span-2">
            <Label for="smtp-sender-email" class="text-xs text-zinc-300">Sender Email Address</Label>
            <Input id="smtp-sender-email" v-model="settings.smtp.senderEmail" placeholder="noreply@example.com" class="h-10 border-border bg-zinc-900/50 text-white placeholder-zinc-500" />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Third-Party Integration Card -->
    <Card class="border-border bg-card text-white">
      <CardHeader class="flex flex-row items-start gap-4 space-y-0 pb-6 border-b border-border bg-zinc-950/20">
        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-primary border border-emerald-500/20 mt-1">
          <Cpu class="h-5 w-5" />
        </div>
        <div>
          <CardTitle class="text-lg font-semibold text-white">Third-Party & API Integration</CardTitle>
          <CardDescription class="text-xs text-zinc-400">Manage external endpoints, API tokens, and webhook configurations.</CardDescription>
        </div>
      </CardHeader>
      
      <CardContent class="p-6">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-2">
            <Label for="api-url" class="text-xs text-zinc-300">Integration API URL</Label>
            <Input id="api-url" v-model="settings.thirdParty.apiUrl" placeholder="https://api.example.com/v1" class="h-10 border-border bg-zinc-900/50 text-white placeholder-zinc-500" />
          </div>
          
          <div class="space-y-2">
            <Label for="api-key" class="text-xs text-zinc-300">API Bearer Key</Label>
            <Input id="api-key" type="password" v-model="settings.thirdParty.apiKey" placeholder="••••••••" class="h-10 border-border bg-zinc-900/50 text-white placeholder-zinc-500" />
          </div>

          <div class="space-y-2">
            <Label for="api-provider" class="text-xs text-zinc-300">Service Provider</Label>
            <Input id="api-provider" v-model="settings.thirdParty.provider" placeholder="Resend / Mailgun" class="h-10 border-border bg-zinc-900/50 text-white placeholder-zinc-500" />
          </div>

          <div class="space-y-2">
            <Label for="webhook-url" class="text-xs text-zinc-300">Receiver Webhook URL</Label>
            <Input id="webhook-url" v-model="settings.thirdParty.webhookUrl" placeholder="https://my-app.com/webhooks/emails" class="h-10 border-border bg-zinc-900/50 text-white placeholder-zinc-500" />
          </div>

          <div class="sm:col-span-2 pt-2">
            <label class="flex items-start gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
              <input type="checkbox" v-model="settings.thirdParty.enableWebhook" class="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary mt-0.5" />
              <span>Deliver webhook triggers immediately on new mail events</span>
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
    
    <!-- Save actions -->
    <div class="flex items-center justify-end gap-3 pt-2">
      <Button 
        variant="outline" 
        class="h-10 border-border hover:bg-zinc-800 text-zinc-300 hover:text-white gap-2" 
        @click="resetSettings"
      >
        <RotateCcw class="h-4 w-4" />
        Reset Defaults
      </Button>
      <Button 
        class="h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2" 
        :disabled="isSaving"
        @click="saveSettings"
      >
        <Save class="h-4 w-4" />
        <span v-if="isSaving">Saving...</span>
        <span v-else>Save Settings</span>
      </Button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { settingsService } from '../services/settingsService'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Server, Cpu, RotateCcw, Save } from 'lucide-vue-next'

const settings = ref({
  smtp: { host: '', port: 587, username: '', password: '', encryption: 'STARTTLS', senderName: '', senderEmail: '' },
  thirdParty: { apiUrl: '', apiKey: '', provider: '', webhookUrl: '', enableWebhook: false }
})

const isSaving = ref(false)

const encryptionOptions = ['None', 'SSL/TLS', 'STARTTLS']

onMounted(() => {
  loadSettings()
})

const loadSettings = () => {
  settings.value = settingsService.getSettings()
}

const saveSettings = () => {
  isSaving.value = true
  setTimeout(() => {
    settingsService.saveSettings(settings.value)
    isSaving.value = false
    alert('Settings saved successfully!')
  }, 800)
}

const resetSettings = () => {
  if (confirm('Are you sure you want to reset all SMTP and API parameters to default values?')) {
    settingsService.resetDefaults()
    loadSettings()
    alert('Reset completed successfully.')
  }
}
</script>
