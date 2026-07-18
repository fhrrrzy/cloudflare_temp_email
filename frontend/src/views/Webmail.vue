<template>
  <div class="webmail-view">
    <!-- Sidebar Account and Folder Selector -->
    <div class="webmail-sidebar">
      <div class="mailbox-select-card">
        <h3>Active Mailbox</h3>
        <dropdown 
          v-model="selectedEmailAddress" 
          :options="accountEmails" 
          placeholder="Select an address" 
          class="w-full"
          @change="onMailboxChange"
        />
      </div>

      <div class="folders-menu">
        <div 
          v-for="folder in folders" 
          :key="folder.id" 
          class="folder-item" 
          :class="{ 'active': currentFolder === folder.id }"
          @click="selectFolder(folder.id)"
        >
          <i :class="folder.icon"></i>
          <span>{{ folder.name }}</span>
          <span v-if="folder.id === 'inbox' && unreadCount > 0" class="badge-count">{{ unreadCount }}</span>
        </div>
      </div>

      <p-button 
        label="Compose Mail" 
        icon="pi pi-pencil" 
        class="w-full compose-btn" 
        @click="openComposeDialog"
      />
    </div>

    <!-- Email List Column -->
    <div class="email-list-column">
      <div class="list-header">
        <span class="p-input-icon-left w-full">
          <i class="pi pi-search" />
          <input-text v-model="mailSearchQuery" placeholder="Search mail..." class="p-inputtext-sm w-full search-mail" />
        </span>
      </div>

      <div class="emails-container">
        <div v-if="filteredEmails.length === 0" class="empty-list">
          <i class="pi pi-envelope" style="font-size: 2.5rem; color: #cbd5e1; margin-bottom: 10px;"></i>
          <span>No emails in this folder</span>
        </div>
        
        <div 
          v-for="mail in filteredEmails" 
          :key="mail.id" 
          class="mail-summary-card"
          :class="{ 'active': selectedMail?.id === mail.id, 'unread': !mail.isRead }"
          @click="selectMail(mail)"
        >
          <div class="mail-header-row">
            <span class="sender-name">{{ getCleanSender(mail.sender) }}</span>
            <span class="mail-date">{{ formatShortDate(mail.date) }}</span>
          </div>
          
          <div class="mail-subject-row">
            <span class="subject">{{ mail.subject }}</span>
          </div>
          
          <div class="mail-snippet-row">
            <span class="snippet">{{ getSnippet(mail.content) }}</span>
            <div class="mail-markers">
              <i 
                :class="mail.isStarred ? 'pi pi-star-fill star-active' : 'pi pi-star'"
                @click.stop="toggleStar(mail)"
              ></i>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Email Reading View -->
    <div class="email-reading-column">
      <div v-if="!selectedMail" class="empty-reading-pane">
        <i class="pi pi-envelope" style="font-size: 4rem; color: #e2e8f0; margin-bottom: 15px;"></i>
        <h2>No Message Selected</h2>
        <p>Choose an email from the list to view its contents.</p>
      </div>

      <div v-else class="reading-pane">
        <!-- Message Action Bar -->
        <div class="reading-action-bar">
          <div class="left-actions">
            <p-button 
              icon="pi pi-reply" 
              label="Reply" 
              class="p-button-text p-button-sm" 
              @click="replyMail"
            />
            <p-button 
              :icon="selectedMail.isStarred ? 'pi pi-star-fill' : 'pi pi-star'" 
              :label="selectedMail.isStarred ? 'Unstar' : 'Star'" 
              class="p-button-text p-button-sm"
              :class="{ 'star-active-text': selectedMail.isStarred }"
              @click="toggleStar(selectedMail)"
            />
            <p-button 
              :icon="selectedMail.isRead ? 'pi pi-envelope' : 'pi pi-envelope-open'" 
              :label="selectedMail.isRead ? 'Mark as Unread' : 'Mark as Read'" 
              class="p-button-text p-button-sm"
              @click="toggleReadState"
            />
          </div>
          
          <div class="right-actions">
            <p-button 
              icon="pi pi-trash" 
              class="p-button-text p-button-danger p-button-sm" 
              @click="deleteMail"
            />
          </div>
        </div>

        <!-- Message Details Header -->
        <div class="reading-header">
          <h1 class="subject-title">{{ selectedMail.subject }}</h1>
          
          <div class="sender-info-block">
            <div class="avatar">{{ getInitials(selectedMail.sender) }}</div>
            <div class="sender-details">
              <div class="sender-line">
                <span class="from-label">From:</span>
                <span class="from-val font-semibold">{{ selectedMail.sender }}</span>
              </div>
              <div class="recipient-line">
                <span class="to-label">To:</span>
                <span class="to-val">{{ selectedMail.recipient }}</span>
              </div>
            </div>
            <div class="date-line">
              {{ formatFullDate(selectedMail.date) }}
            </div>
          </div>
        </div>

        <!-- Attachments Box -->
        <div v-if="selectedMail.attachments && selectedMail.attachments.length > 0" class="attachments-section">
          <h3>Attachments ({{ selectedMail.attachments.length }})</h3>
          <div class="attachments-list">
            <div v-for="(att, idx) in selectedMail.attachments" :key="idx" class="attachment-item">
              <i class="pi pi-file-pdf pdf-icon"></i>
              <div class="attachment-meta">
                <span class="filename">{{ att.filename }}</span>
                <span class="filesize">{{ att.size }}</span>
              </div>
              <p-button icon="pi pi-download" class="p-button-rounded p-button-text p-button-secondary p-button-sm" @click="downloadMockAttachment(att)" />
            </div>
          </div>
        </div>

        <!-- Message Body isolation -->
        <div class="reading-body">
          <iframe 
            :srcdoc="selectedMail.content" 
            sandbox="allow-popups" 
            class="mail-iframe"
            frameborder="0"
          ></iframe>
        </div>
      </div>
    </div>

    <!-- Compose Message Dialog -->
    <p-dialog v-model:visible="isComposeOpen" header="New Message" modal :style="{ width: '550px' }">
      <div class="form-fields">
        <div class="field">
          <label for="compose-from">From</label>
          <input-text id="compose-from" :value="selectedEmailAddress" disabled class="w-full" />
        </div>
        
        <div class="field">
          <label for="compose-to">To</label>
          <input-text id="compose-to" v-model="composeModel.to" placeholder="recipient@example.com" class="w-full" />
        </div>
        
        <div class="field">
          <label for="compose-subject">Subject</label>
          <input-text id="compose-subject" v-model="composeModel.subject" placeholder="Enter subject" class="w-full" />
        </div>
        
        <div class="field">
          <label for="compose-body">Message</label>
          <textarea 
            id="compose-body" 
            v-model="composeModel.body" 
            rows="8" 
            placeholder="Type your message here..."
            class="w-full text-area"
          />
        </div>
      </div>
      
      <template #footer>
        <p-button label="Discard" icon="pi pi-times" class="p-button-text p-button-secondary" @click="isComposeOpen = false" />
        <p-button label="Send" icon="pi pi-send" class="brand-btn" @click="handleSendMail" />
      </template>
    </p-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { accountService } from '../services/accountService'
import { mailService } from '../services/mailService'

const props = defineProps({
  initialEmail: {
    type: String,
    default: null
  }
})

const route = useRoute()

const accountEmails = ref([])
const selectedEmailAddress = ref('')
const emails = ref([])
const selectedMail = ref(null)
const currentFolder = ref('inbox')
const mailSearchQuery = ref('')

const isComposeOpen = ref(false)
const composeModel = ref({ to: '', subject: '', body: '' })

const folders = [
  { id: 'inbox', name: 'Inbox', icon: 'pi pi-inbox' },
  { id: 'starred', name: 'Starred', icon: 'pi pi-star' },
  { id: 'sent', name: 'Sent', icon: 'pi pi-send' },
  { id: 'trash', name: 'Trash', icon: 'pi pi-trash' }
]

onMounted(() => {
  loadMailboxes()
})

const loadMailboxes = () => {
  const accounts = accountService.getAccounts()
  accountEmails.value = accounts.map(acc => acc.email)
  
  // Set selected mailbox from query param / props, or fallback to first
  const emailQuery = props.initialEmail || route.query.email
  if (emailQuery && accountEmails.value.includes(emailQuery)) {
    selectedEmailAddress.value = emailQuery
  } else if (accountEmails.value.length > 0) {
    selectedEmailAddress.value = accountEmails.value[0]
  }

  loadEmailsForAddress()
}

const loadEmailsForAddress = () => {
  if (selectedEmailAddress.value) {
    emails.value = mailService.getMails(selectedEmailAddress.value)
    selectedMail.value = null // reset selection
  }
}

const onMailboxChange = () => {
  loadEmailsForAddress()
}

// Folder Selection
const selectFolder = (folderId) => {
  currentFolder.value = folderId
  selectedMail.value = null
}

const filteredEmails = computed(() => {
  let list = [...emails.value]
  
  // Filter by folder
  if (currentFolder.value === 'starred') {
    list = list.filter(m => m.isStarred)
  } else if (currentFolder.value === 'sent') {
    list = list.filter(m => m.isSent)
  } else if (currentFolder.value === 'trash') {
    // We don't have separate deleted list, mock folder by checking isDeleted if added later
    list = [] // empty mock folder
  } else {
    // Inbox (non-sent)
    list = list.filter(m => !m.isSent)
  }

  // Filter by search query
  const query = mailSearchQuery.value.trim().toLowerCase()
  if (query) {
    list = list.filter(m => 
      m.subject.toLowerCase().includes(query) || 
      m.sender.toLowerCase().includes(query) || 
      m.content.toLowerCase().includes(query)
    )
  }

  // Sort by date descending
  return list.sort((a, b) => new Date(b.date) - new Date(a.date))
})

const unreadCount = computed(() => {
  return emails.value.filter(m => !m.isSent && !m.isRead).length
})

const selectMail = (mail) => {
  selectedMail.value = mail
  if (!mail.isRead) {
    mailService.markAsRead(mail.id, true)
    mail.isRead = true
  }
}

const getCleanSender = (senderStr) => {
  if (!senderStr) return ''
  return senderStr.split('<')[0].trim()
}

const getSnippet = (htmlContent) => {
  if (!htmlContent) return ''
  const doc = new DOMParser().parseFromString(htmlContent, 'text/html')
  const plainText = doc.body.textContent || ""
  return plainText.substring(0, 80) + '...'
}

const getInitials = (senderStr) => {
  const clean = getCleanSender(senderStr)
  return clean.substring(0, 2).toUpperCase()
}

const formatShortDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const today = new Date()
  if (date.toDateString() === today.toDateString()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

const formatFullDate = (isoString) => {
  if (!isoString) return ''
  return new Date(isoString).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Mail Actions
const toggleStar = (mail) => {
  mailService.toggleStar(mail.id)
  mail.isStarred = !mail.isStarred
}

const toggleReadState = () => {
  if (!selectedMail.value) return
  const newState = !selectedMail.value.isRead
  mailService.markAsRead(selectedMail.value.id, newState)
  selectedMail.value.isRead = newState
}

const deleteMail = () => {
  if (!selectedMail.value) return
  if (confirm('Delete this message permanently?')) {
    mailService.deleteMail(selectedMail.value.id)
    loadEmailsForAddress()
  }
}

// Compose dialog triggers
const openComposeDialog = () => {
  composeModel.value = { to: '', subject: '', body: '' }
  isComposeOpen.value = true
}

const replyMail = () => {
  if (!selectedMail.value) return
  const originalSender = selectedMail.value.sender
  const match = originalSender.match(/<([^>]+)>/)
  const toAddress = match ? match[1] : originalSender

  composeModel.value = {
    to: toAddress,
    subject: `Re: ${selectedMail.value.subject}`,
    body: `\n\nOn ${formatFullDate(selectedMail.value.date)}, ${selectedMail.value.sender} wrote:\n> ` + 
      selectedMail.value.content.replace(/<[^>]*>/g, '').split('\n').join('\n> ')
  }
  isComposeOpen.value = true
}

const handleSendMail = () => {
  const model = composeModel.value
  if (!model.to.trim()) {
    alert('Please enter a recipient.')
    return
  }

  // Simulate sending mail
  mailService.sendMail(
    selectedEmailAddress.value,
    model.to.trim(),
    model.subject.trim(),
    model.body.trim()
  )

  isComposeOpen.value = false
  loadEmailsForAddress()
  alert('Email sent successfully!')
}

const downloadMockAttachment = (att) => {
  alert(`Triggered download for mock attachment: ${att.filename} (${att.size})`)
}

// Watch initialEmail parameter change (e.g. navigation from accounts page)
watch(() => props.initialEmail, (newEmail) => {
  if (newEmail && accountEmails.value.includes(newEmail)) {
    selectedEmailAddress.value = newEmail
    loadEmailsForAddress()
  }
})
</script>

<style scoped>
.webmail-view {
  display: grid;
  grid-template-columns: 240px 320px 1fr;
  height: calc(100vh - 130px);
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  overflow: hidden;
}

@media (max-width: 1200px) {
  .webmail-view {
    grid-template-columns: 200px 280px 1fr;
  }
}

/* Sidebar Columns styles */
.webmail-sidebar {
  border-right: 1px solid #e2e8f0;
  background-color: #f8fafc;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  box-sizing: border-box;
}

.mailbox-select-card h3 {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #64748b;
  font-weight: 600;
  text-transform: uppercase;
  text-align: left;
  letter-spacing: 0.5px;
}

.folders-menu {
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex-grow: 1;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 15px;
  border-radius: 8px;
  cursor: pointer;
  color: #475569;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
  position: relative;
}

.folder-item i {
  font-size: 16px;
  color: #64748b;
}

.folder-item:hover {
  background-color: #f1f5f9;
  color: #0f172a;
}

.folder-item.active {
  background-color: #e0f2fe;
  color: #0369a1;
}

.folder-item.active i {
  color: #0369a1;
}

.badge-count {
  position: absolute;
  right: 15px;
  background-color: #0ea5e9;
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 10px;
}

.compose-btn {
  background-color: #0ea5e9;
  border-color: #0ea5e9;
  font-weight: 600;
}
.compose-btn:hover {
  background-color: #0284c7 !important;
  border-color: #0284c7 !important;
}

/* Email List Column styles */
.email-list-column {
  border-right: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.list-header {
  padding: 15px;
  border-bottom: 1px solid #e2e8f0;
}

.search-mail {
  background-color: #f8fafc;
}

.emails-container {
  flex-grow: 1;
  overflow-y: auto;
}

.empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50px 20px;
  color: #64748b;
  font-size: 14px;
}

.mail-summary-card {
  padding: 15px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: left;
}

.mail-summary-card:hover {
  background-color: #f8fafc;
}

.mail-summary-card.active {
  background-color: #f0f9ff;
}

.mail-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.sender-name {
  font-size: 14px;
  font-weight: 500;
  color: #475569;
}

.unread .sender-name {
  font-weight: 700;
  color: #0f172a;
}

.mail-date {
  font-size: 12px;
  color: #94a3b8;
}

.mail-subject-row {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.subject {
  font-size: 14px;
  font-weight: 500;
  color: #334155;
}

.unread .subject {
  font-weight: 700;
  color: #0f172a;
}

.mail-snippet-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.snippet {
  font-size: 13px;
  color: #64748b;
  line-height: 1.3;
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mail-markers {
  margin-left: 10px;
  flex-shrink: 0;
}

.mail-markers i {
  font-size: 14px;
  color: #cbd5e1;
  cursor: pointer;
  transition: color 0.15s;
}

.mail-markers i:hover, .star-active {
  color: #eab308 !important;
}

/* Email Reading Pane Styles */
.email-reading-column {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #f8fafc;
}

.empty-reading-pane {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  padding: 50px;
  color: #94a3b8;
}

.empty-reading-pane h2 {
  font-size: 20px;
  color: #475569;
  margin: 0 0 8px 0;
}

.empty-reading-pane p {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

.reading-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  background-color: #ffffff;
}

.reading-action-bar {
  height: 50px;
  border-bottom: 1px solid #e2e8f0;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #f8fafc;
  flex-shrink: 0;
}

.left-actions {
  display: flex;
  gap: 10px;
}

.star-active-text {
  color: #eab308 !important;
}

.reading-header {
  padding: 25px 25px 15px 25px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  flex-shrink: 0;
}

.subject-title {
  font-size: 20px;
  font-weight: 700;
  color: #0f172a;
  margin: 0 0 15px 0;
}

.sender-info-block {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sender-info-block .avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background-color: #e0f2fe;
  color: #0369a1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 15px;
}

.sender-details {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.sender-line, .recipient-line {
  font-size: 13px;
  line-height: 1.4;
}

.from-label, .to-label {
  color: #64748b;
  margin-right: 5px;
}

.from-val {
  color: #1e293b;
}

.to-val {
  color: #64748b;
}

.date-line {
  font-size: 13px;
  color: #64748b;
}

/* Attachments styles */
.attachments-section {
  padding: 15px 25px;
  background-color: #f8fafc;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
  flex-shrink: 0;
}

.attachments-section h3 {
  margin: 0 0 10px 0;
  font-size: 13px;
  color: #475569;
  font-weight: 600;
}

.attachments-list {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.attachment-item {
  background: white;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.pdf-icon {
  color: #ef4444;
  font-size: 20px;
}

.attachment-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.filename {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
}

.filesize {
  font-size: 11px;
  color: #64748b;
}

/* Isolated Iframe Content */
.reading-body {
  flex-grow: 1;
  position: relative;
  overflow: hidden;
}

.mail-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  background-color: #ffffff;
}

/* Form layouts */
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

.brand-btn {
  background-color: #0ea5e9;
  border-color: #0ea5e9;
}
.brand-btn:hover {
  background-color: #0284c7 !important;
  border-color: #0284c7 !important;
}
</style>
