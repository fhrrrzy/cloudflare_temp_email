<template>
  <div class="settings-page">
    <!-- Tab view for sections -->
    <div class="settings-container">
      <!-- SMTP Configuration Card -->
      <div class="card settings-card">
        <div class="card-header">
          <i class="pi pi-server text-blue"></i>
          <div>
            <h2>SMTP Configuration</h2>
            <p>Configure SMTP server details for sending emails.</p>
          </div>
        </div>
        
        <div class="form-grid">
          <div class="field col-6">
            <label for="smtp-host">SMTP Host</label>
            <input-text id="smtp-host" v-model="settings.smtp.host" placeholder="smtp.example.com" class="w-full" />
          </div>
          
          <div class="field col-6">
            <label for="smtp-port">SMTP Port</label>
            <input-text id="smtp-port" v-model.number="settings.smtp.port" placeholder="587" class="w-full" />
          </div>
          
          <div class="field col-6">
            <label for="smtp-user">SMTP Username</label>
            <input-text id="smtp-user" v-model="settings.smtp.username" placeholder="user@example.com" class="w-full" />
          </div>
          
          <div class="field col-6">
            <label for="smtp-pass">SMTP Password</label>
            <password id="smtp-pass" v-model="settings.smtp.password" toggle-mask :feedback="false" class="w-full" input-class="w-full" />
          </div>

          <div class="field col-6">
            <label for="smtp-enc">Encryption Type</label>
            <dropdown 
              id="smtp-enc" 
              v-model="settings.smtp.encryption" 
              :options="encryptionOptions" 
              placeholder="Select encryption"
              class="w-full"
            />
          </div>

          <div class="field col-6">
            <label for="smtp-sender-name">Sender Display Name</label>
            <input-text id="smtp-sender-name" v-model="settings.smtp.senderName" placeholder="System Notification" class="w-full" />
          </div>
          
          <div class="field col-6">
            <label for="smtp-sender-email">Sender Email Address</label>
            <input-text id="smtp-sender-email" v-model="settings.smtp.senderEmail" placeholder="noreply@example.com" class="w-full" />
          </div>
        </div>
      </div>

      <!-- Third-Party Integration Card -->
      <div class="card settings-card">
        <div class="card-header">
          <i class="pi pi-sliders-h text-purple"></i>
          <div>
            <h2>Third-Party & API Integration</h2>
            <p>Manage external endpoints, API tokens, and webhook configurations.</p>
          </div>
        </div>
        
        <div class="form-grid">
          <div class="field col-6">
            <label for="api-url">Integration API URL</label>
            <input-text id="api-url" v-model="settings.thirdParty.apiUrl" placeholder="https://api.example.com/v1" class="w-full" />
          </div>
          
          <div class="field col-6">
            <label for="api-key">API Bearer Key</label>
            <password id="api-key" v-model="settings.thirdParty.apiKey" toggle-mask :feedback="false" class="w-full" input-class="w-full" />
          </div>

          <div class="field col-6">
            <label for="api-provider">Service Provider</label>
            <input-text id="api-provider" v-model="settings.thirdParty.provider" placeholder="Resend / Mailgun" class="w-full" />
          </div>

          <div class="field col-6">
            <label for="webhook-url">Receiver Webhook URL</label>
            <input-text id="webhook-url" v-model="settings.thirdParty.webhookUrl" placeholder="https://my-app.com/webhooks/emails" class="w-full" />
          </div>

          <div class="field col-12 checkbox-field">
            <checkbox id="webhook-enable" v-model="settings.thirdParty.enableWebhook" :binary="true" />
            <label for="webhook-enable" class="checkbox-label">Deliver webhook triggers immediately on new mail events</label>
          </div>
        </div>
      </div>
      
      <!-- Save actions -->
      <div class="actions-footer">
        <Button 
          label="Reset defaults" 
          icon="pi pi-refresh" 
          class="p-button-outlined p-button-secondary" 
          @click="resetSettings" 
        />
        <Button 
          label="Save Settings" 
          icon="pi pi-save" 
          class="brand-btn" 
          :loading="isSaving"
          @click="saveSettings" 
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { settingsService } from '../services/settingsService'

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
    alert('Settings successfully updated on the client-side!')
  }, 800)
}

const resetSettings = () => {
  if (confirm('Discard changes and restore default config?')) {
    localStorage.removeItem('temp_mail_mock_settings')
    loadSettings()
  }
}
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 30px;
  width: 100%;
  max-width: 900px;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  padding: 30px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  box-sizing: border-box;
}

.card-header {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 20px;
  margin-bottom: 25px;
  text-align: left;
}

.card-header i {
  font-size: 24px;
  padding: 12px;
  border-radius: 10px;
  background-color: #f8fafc;
}

.card-header i.text-blue {
  color: #0ea5e9;
  background-color: #e0f2fe;
}

.card-header i.text-purple {
  color: #a855f7;
  background-color: #f3e8ff;
}

.card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #0f172a;
}

.card-header p {
  margin: 5px 0 0 0;
  font-size: 13px;
  color: #64748b;
}

/* Form Styles */
.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px 25px;
  text-align: left;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.col-12 {
  grid-column: span 2;
}

@media (max-width: 768px) {
  .col-12 {
    grid-column: span 1;
  }
}

.field label {
  font-size: 14px;
  font-weight: 600;
  color: #475569;
}

.w-full {
  width: 100%;
}

.checkbox-field {
  display: flex;
  flex-direction: row !important;
  align-items: center;
  gap: 12px;
  margin-top: 10px;
}

.checkbox-label {
  font-weight: 500 !important;
  color: #334155;
}

/* Save button styles */
.actions-footer {
  display: flex;
  justify-content: flex-end;
  gap: 15px;
  margin-top: 10px;
}

.brand-btn {
  background-color: #0ea5e9;
  border-color: #0ea5e9;
}
.brand-btn:hover {
  background-color: #0284c7 !important;
  border-color: #0284c7 !important;
}
</style>
