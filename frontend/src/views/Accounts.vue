<template>
  <div class="accounts-page">
    <!-- Header with Actions -->
    <div class="action-bar">
      <div class="search-container">
        <span class="p-input-icon-left">
          <i class="pi pi-search" />
          <input-text v-model="searchQuery" placeholder="Search accounts..." class="p-inputtext-sm search-input" />
        </span>
      </div>

      <div class="btn-group">
        <Button 
          label="Single Account" 
          icon="pi pi-user-plus" 
          class="p-button-outlined p-button-sm" 
          @click="openSingleCreateDialog" 
        />
        <Button 
          label="Bulk Create" 
          icon="pi pi-users" 
          class="p-button-sm brand-btn" 
          @click="openBulkCreateDialog" 
        />
        <Button 
          label="Export All" 
          icon="pi pi-download" 
          class="p-button-outlined p-button-secondary p-button-sm" 
          @click="openExportDialog" 
        />
      </div>
    </div>

    <!-- Accounts Data Table -->
    <div class="table-card">
      <data-table 
        :value="filteredAccounts" 
        paginator 
        :rows="10" 
        responsive-layout="scroll" 
        class="p-datatable-sm"
        v-model:selection="selectedAccounts"
        data-key="id"
      >
        <column selection-mode="multiple" header-style="width: 3rem"></column>
        
        <column field="email" header="Email Address" sortable></column>
        
        <column field="creationDate" header="Created On" sortable>
          <template #body="slotProps">
            {{ formatDateTime(slotProps.data.creationDate) }}
          </template>
        </column>
        
        <column field="mailCount" header="Mailbox" sortable>
          <template #body="slotProps">
            <span class="mailbox-badge">{{ slotProps.data.mailCount }} mails</span>
          </template>
        </column>

        <column field="status" header="Status" sortable>
          <template #body="slotProps">
            <badge 
              :value="slotProps.data.status" 
              :severity="slotProps.data.status === 'Active' ? 'success' : 'danger'" 
            />
          </template>
        </column>

        <column header="Actions" header-style="width: 250px; text-align: center" body-style="text-align: center">
          <template #body="slotProps">
            <div class="action-buttons">
              <!-- Open Webmail -->
              <Button 
                icon="pi pi-envelope" 
                class="p-button-rounded p-button-text p-button-sm" 
                v-tooltip.top="'Open Webmail'"
                @click="openWebmail(slotProps.data.email)"
              />
              <!-- View details -->
              <Button 
                icon="pi pi-eye" 
                class="p-button-rounded p-button-text p-button-info p-button-sm" 
                v-tooltip.top="'View Details'"
                @click="viewDetails(slotProps.data)"
              />
              <!-- Copy credentials -->
              <Button 
                icon="pi pi-copy" 
                class="p-button-rounded p-button-text p-button-warning p-button-sm" 
                v-tooltip.top="'Copy Credentials'"
                @click="copyCredentials(slotProps.data)"
              />
              <!-- Delete account -->
              <Button 
                icon="pi pi-trash" 
                class="p-button-rounded p-button-text p-button-danger p-button-sm" 
                v-tooltip.top="'Delete Account'"
                @click="confirmDelete(slotProps.data)"
              />
            </div>
          </template>
        </column>
      </data-table>

      <!-- Bulk action footer -->
      <div v-if="selectedAccounts.length > 0" class="bulk-footer">
        <span>Selected: <strong>{{ selectedAccounts.length }}</strong> accounts</span>
        <div class="bulk-buttons">
          <Button 
            label="Export Selected" 
            icon="pi pi-download" 
            class="p-button-outlined p-button-secondary p-button-sm"
            @click="exportSelected" 
          />
          <Button 
            label="Delete Selected" 
            icon="pi pi-trash" 
            class="p-button-danger p-button-sm"
            @click="deleteSelected" 
          />
        </div>
      </div>
    </div>

    <!-- Create Single Account Dialog -->
    <p-dialog v-model:visible="isSingleCreateOpen" header="Create Single Account" modal :style="{ width: '400px' }">
      <div class="form-fields">
        <div class="field">
          <label for="new-email">Email Prefix</label>
          <div class="p-inputgroup">
            <input-text id="new-email" v-model="singleAccount.prefix" placeholder="username" />
            <span class="p-inputgroup-addon">@codeflai.tech</span>
          </div>
        </div>
        
        <div class="field">
          <label for="new-password">Password</label>
          <password id="new-password" v-model="singleAccount.password" toggle-mask :feedback="false" class="w-full" input-class="w-full" />
        </div>
      </div>
      
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary" @click="isSingleCreateOpen = false" />
        <Button label="Create" icon="pi pi-check" class="brand-btn" @click="handleCreateSingle" />
      </template>
    </p-dialog>

    <!-- Bulk Create Accounts Dialog -->
    <p-dialog v-model:visible="isBulkCreateOpen" header="Bulk Create Accounts" modal :style="{ width: '600px' }">
      <div class="bulk-container">
        <div class="steps-progress" v-if="bulkStep === 2">
          <h3>Step 2: Preview Generated Accounts</h3>
        </div>
        
        <!-- Step 1: Input details -->
        <div v-if="bulkStep === 1" class="form-fields">
          <div class="field">
            <label for="bulk-names">Email Addresses (one per line, without domain)</label>
            <textarea 
              id="bulk-names" 
              v-model="bulkInput.names" 
              rows="6" 
              placeholder="alex&#10;john&#10;support&#10;developer"
              class="w-full text-area"
            />
            <small class="help-text">Enter usernames only. We will append <strong>@codeflai.tech</strong>.</small>
          </div>

          <div class="field-row">
            <div class="field flex-1">
              <label for="bulk-pass-mode">Password Option</label>
              <dropdown 
                id="bulk-pass-mode" 
                v-model="bulkInput.passwordMode" 
                :options="passwordModes" 
                option-label="label" 
                option-value="value"
                class="w-full"
              />
            </div>
            
            <div class="field flex-1" v-if="bulkInput.passwordMode === 'custom'">
              <label for="bulk-pass">Custom Password</label>
              <password id="bulk-pass" v-model="bulkInput.customPassword" toggle-mask :feedback="false" class="w-full" input-class="w-full" />
            </div>
          </div>
        </div>

        <!-- Step 2: Preview generated profiles -->
        <div v-if="bulkStep === 2" class="preview-container">
          <p class="preview-desc">Review the accounts and auto-generated passwords before final creation.</p>
          <data-table :value="bulkPreviewList" class="p-datatable-sm" scrollable scroll-height="250px">
            <column field="email" header="Email"></column>
            <column field="password" header="Password"></column>
          </data-table>
          
          <div v-if="bulkValidationErrors.length > 0" class="validation-warning">
            <h4>Warnings / Errors found:</h4>
            <ul>
              <li v-for="(err, idx) in bulkValidationErrors" :key="idx">{{ err }}</li>
            </ul>
          </div>
        </div>
      </div>

      <template #footer>
        <!-- Step 1 Actions -->
        <div v-if="bulkStep === 1" class="dialog-foot">
          <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary" @click="isBulkCreateOpen = false" />
          <Button label="Next: Preview" icon="pi pi-angle-right" class="brand-btn" @click="generateBulkPreview" />
        </div>
        <!-- Step 2 Actions -->
        <div v-if="bulkStep === 2" class="dialog-foot">
          <Button label="Back" icon="pi pi-angle-left" class="p-button-text p-button-secondary" @click="bulkStep = 1" />
          <Button label="Confirm & Create" icon="pi pi-check" class="brand-btn" :loading="isBulkSubmitting" @click="handleConfirmBulkCreate" />
        </div>
      </template>
    </p-dialog>

    <!-- Account Details Dialog -->
    <p-dialog v-model:visible="isDetailsOpen" header="Account Details" modal :style="{ width: '450px' }">
      <div v-if="selectedDetailAccount" class="details-list">
        <div class="detail-row">
          <span class="label">Email Address:</span>
          <span class="value font-semibold">{{ selectedDetailAccount.email }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Password:</span>
          <span class="value font-mono bg-light">{{ selectedDetailAccount.password }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Status:</span>
          <badge 
            :value="selectedDetailAccount.status" 
            :severity="selectedDetailAccount.status === 'Active' ? 'success' : 'danger'" 
          />
        </div>
        <div class="detail-row">
          <span class="label">Created Date:</span>
          <span class="value">{{ formatDateTime(selectedDetailAccount.creationDate) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Emails Received:</span>
          <span class="value">{{ selectedDetailAccount.mailCount }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Emails Sent:</span>
          <span class="value">{{ selectedDetailAccount.sendCount }}</span>
        </div>
      </div>
      <template #footer>
        <Button label="Close" icon="pi pi-times" class="p-button-text p-button-secondary" @click="isDetailsOpen = false" />
        <Button label="Login to Webmail" icon="pi pi-envelope" class="brand-btn" @click="openWebmail(selectedDetailAccount?.email)" />
      </template>
    </p-dialog>

    <!-- Export Dialog -->
    <p-dialog v-model:visible="isExportOpen" header="Export Accounts" modal :style="{ width: '400px' }">
      <div class="form-fields">
        <div class="field">
          <label>Choose Export Format</label>
          <div class="radio-group">
            <div class="radio-item">
              <input type="radio" id="fmt-txt" value="txt" v-model="exportFormat" />
              <label for="fmt-txt">Plain Text (email:password)</label>
            </div>
            <div class="radio-item">
              <input type="radio" id="fmt-csv" value="csv" v-model="exportFormat" />
              <label for="fmt-csv">CSV Format (Comma-separated)</label>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" icon="pi pi-times" class="p-button-text p-button-secondary" @click="isExportOpen = false" />
        <Button label="Export" icon="pi pi-download" class="brand-btn" @click="triggerExport" />
      </template>
    </p-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { accountService } from '../services/accountService'

const router = useRouter()

const accounts = ref([])
const selectedAccounts = ref([])
const searchQuery = ref('')

// Dialog visibilities
const isSingleCreateOpen = ref(false)
const isBulkCreateOpen = ref(false)
const isDetailsOpen = ref(false)
const isExportOpen = ref(false)

// Dialog models
const singleAccount = ref({ prefix: '', password: '' })
const bulkStep = ref(1)
const bulkInput = ref({ names: '', passwordMode: 'auto', customPassword: '' })
const bulkPreviewList = ref([])
const bulkValidationErrors = ref([])
const isBulkSubmitting = ref(false)
const selectedDetailAccount = ref(null)
const exportFormat = ref('txt')
const currentExportIds = ref(null) // null means export all

const passwordModes = [
  { label: 'Auto-Generate Passwords', value: 'auto' },
  { label: 'Use Custom Password', value: 'custom' }
]

onMounted(() => {
  loadAccounts()
})

const loadAccounts = () => {
  accounts.value = accountService.getAccounts()
}

const filteredAccounts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return accounts.value
  return accounts.value.filter(acc => acc.email.toLowerCase().includes(query))
})

const formatDateTime = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Action button triggers
const openWebmail = (email) => {
  router.push({ path: '/dashboard/webmail', query: { email } })
}

const viewDetails = (account) => {
  selectedDetailAccount.value = account
  isDetailsOpen.value = true
}

const copyCredentials = (account) => {
  const text = `Email: ${account.email}\nPassword: ${account.password}`
  navigator.clipboard.writeText(text).then(() => {
    alert(`Copied credentials for ${account.email} to clipboard!`)
  })
}

const confirmDelete = (account) => {
  if (confirm(`Are you sure you want to delete ${account.email}?`)) {
    accountService.deleteAccount(account.id)
    loadAccounts()
  }
}

// Single Account Creation
const openSingleCreateDialog = () => {
  singleAccount.value = { prefix: '', password: '' }
  isSingleCreateOpen.value = true
}

const handleCreateSingle = () => {
  const prefix = singleAccount.value.prefix.trim()
  if (!prefix) {
    alert('Please enter a username.')
    return
  }
  const email = `${prefix}@codeflai.tech`
  accountService.createAccount(email, singleAccount.value.password)
  isSingleCreateOpen.value = false
  loadAccounts()
}

// Bulk Account Creation
const openBulkCreateDialog = () => {
  bulkStep.value = 1
  bulkInput.value = { names: '', passwordMode: 'auto', customPassword: '' }
  bulkPreviewList.value = []
  bulkValidationErrors.value = []
  isBulkCreateOpen.value = true
}

const generateBulkPreview = () => {
  const namesText = bulkInput.value.names.trim()
  if (!namesText) {
    alert('Please enter at least one username.')
    return
  }

  const usernames = namesText.split('\n').map(n => n.trim()).filter(n => n.length > 0)
  const previews = []
  const errors = []
  const existingAccounts = accountService.getAccounts()

  usernames.forEach(user => {
    const email = `${user}@codeflai.tech`
    if (!user.match(/^[a-zA-Z0-9._-]+$/)) {
      errors.push(`Invalid characters in username: ${user}`)
    }
    if (existingAccounts.some(acc => acc.email === email)) {
      errors.push(`Account already exists: ${email}`)
    }

    const password = bulkInput.value.passwordMode === 'auto'
      ? Math.random().toString(36).slice(-4) + Math.random().toString(36).slice(-4).toUpperCase()
      : bulkInput.value.customPassword || 'defaultPassword123'

    previews.push({ email, password })
  });

  bulkPreviewList.value = previews
  bulkValidationErrors.value = errors
  bulkStep.value = 2
}

const handleConfirmBulkCreate = () => {
  isBulkSubmitting.value = true
  setTimeout(() => {
    const rawList = bulkPreviewList.value.map(p => p.email.split('@')[0])
    const defaultPass = bulkInput.value.passwordMode === 'custom' ? bulkInput.value.customPassword : ''
    const autoGen = bulkInput.value.passwordMode === 'auto'
    
    // Simulate creation
    const { errors } = accountService.bulkCreateAccounts(
      rawList.map(name => `${name}@codeflai.tech`),
      defaultPass,
      autoGen
    )

    isBulkSubmitting.value = false
    isBulkCreateOpen.value = false
    loadAccounts()

    if (errors.length > 0) {
      alert(`Created accounts with some errors:\n${errors.join('\n')}`)
    } else {
      alert(`Successfully created ${rawList.length} accounts!`)
    }
  }, 1000)
}

// Export Accounts
const openExportDialog = () => {
  currentExportIds.value = null // All
  isExportOpen.value = true
}

const exportSelected = () => {
  currentExportIds.value = selectedAccounts.value.map(acc => acc.id)
  isExportOpen.value = true
}

const triggerExport = () => {
  const result = accountService.exportAccounts(exportFormat.value, currentExportIds.value)
  
  // Trigger browser file download
  const blob = new Blob([result.content], { type: result.mimeType })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = result.filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  window.URL.revokeObjectURL(url)

  isExportOpen.value = false
  selectedAccounts.value = []
}

// Bulk Actions
const deleteSelected = () => {
  if (confirm(`Are you sure you want to delete ${selectedAccounts.value.length} selected accounts?`)) {
    selectedAccounts.value.forEach(acc => {
      accountService.deleteAccount(acc.id)
    })
    loadAccounts()
    selectedAccounts.value = []
  }
}
</script>

<style scoped>
.accounts-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

.search-input {
  width: 280px;
}

.btn-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.brand-btn {
  background-color: #0ea5e9;
  border-color: #0ea5e9;
}
.brand-btn:hover {
  background-color: #0284c7 !important;
  border-color: #0284c7 !important;
}

.table-card {
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}

.mailbox-badge {
  background-color: #f1f5f9;
  color: #475569;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 6px;
}

.bulk-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 12px 20px;
  border-radius: 8px;
  margin-top: 15px;
}

.bulk-buttons {
  display: flex;
  gap: 10px;
}

/* Dialog Styling */
.form-fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 10px 0;
  text-align: left;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.field-row {
  display: flex;
  gap: 15px;
}

.flex-1 {
  flex: 1;
}

.w-full {
  width: 100%;
}

.text-area {
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 10px;
  font-family: inherit;
  resize: vertical;
}

.help-text {
  font-size: 12px;
  color: #64748b;
  text-align: left;
}

/* Bulk Preview styling */
.preview-container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  text-align: left;
}

.preview-desc {
  font-size: 14px;
  color: #475569;
  margin: 0;
}

.validation-warning {
  background-color: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  padding: 12px 16px;
  color: #b45309;
}

.validation-warning h4 {
  margin: 0 0 6px 0;
  font-size: 14px;
  font-weight: 600;
}

.validation-warning ul {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
}

/* Detail list styling */
.details-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 10px 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f1f5f9;
  padding-bottom: 10px;
  font-size: 14px;
}

.detail-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.detail-row .label {
  color: #64748b;
  font-weight: 500;
}

.detail-row .value {
  color: #1e293b;
}

.font-semibold {
  font-weight: 600;
}

.font-mono {
  font-family: monospace;
  font-size: 13px;
}

.bg-light {
  background-color: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
}

.dialog-foot {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  width: 100%;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 5px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 10px;
}

.radio-item label {
  font-weight: 500;
  cursor: pointer;
}

.radio-item input {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
</style>
