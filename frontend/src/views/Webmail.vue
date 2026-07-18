<template>
  <div class="webmail-dark-container">
    <!-- 1. LEFT SIDEBAR: Accounts & Folders/Categories -->
    <div class="webmail-left-sidebar">
      <!-- Account Selection Dropdown -->
      <div class="account-header">
        <dropdown 
          v-model="selectedEmailAddress" 
          :options="accountEmails" 
          placeholder="Select an account" 
          class="account-dropdown w-full"
          @change="onMailboxChange"
        >
          <template #value="slotProps">
            <div class="account-dropdown-value" v-if="slotProps.value">
              <i class="pi pi-user-edit account-avatar-icon"></i>
              <span class="account-name-text">{{ getAccountDisplayName(slotProps.value) }}</span>
            </div>
            <span v-else>{{ slotProps.placeholder }}</span>
          </template>
        </dropdown>
      </div>

      <!-- Main Folders Menu -->
      <div class="menu-section">
        <div 
          v-for="folder in mainFolders" 
          :key="folder.id" 
          class="menu-item" 
          :class="{ 'active': currentFolder === folder.id }"
          @click="selectFolder(folder.id)"
        >
          <div class="item-left">
            <i :class="folder.icon"></i>
            <span>{{ folder.name }}</span>
          </div>
          <span v-if="getFolderCount(folder.id) > 0" class="item-badge">
            {{ getFolderCount(folder.id) }}
          </span>
        </div>
      </div>

      <hr class="menu-divider" />

      <!-- Categories Menu -->
      <div class="menu-section">
        <div 
          v-for="cat in categoryFolders" 
          :key="cat.id" 
          class="menu-item" 
          :class="{ 'active': currentFolder === cat.id }"
          @click="selectFolder(cat.id)"
        >
          <div class="item-left">
            <i :class="cat.icon"></i>
            <span>{{ cat.name }}</span>
          </div>
          <span v-if="getCategoryCount(cat.id) > 0" class="item-badge font-normal">
            {{ getCategoryCount(cat.id) }}
          </span>
        </div>
      </div>

      <!-- Bottom Compose Button -->
      <div class="sidebar-compose-footer">
        <p-button 
          label="Compose Mail" 
          icon="pi pi-pencil" 
          class="w-full p-button-sm compose-action-btn" 
          @click="openComposeDialog"
        />
      </div>
    </div>

    <!-- 2. MIDDLE COLUMN: Emails List -->
    <div class="webmail-middle-column">
      <!-- Title & Mail Filters Header -->
      <div class="middle-column-header">
        <h2 class="folder-title">{{ getFolderTitle() }}</h2>
        <div class="filter-tabs">
          <button 
            class="tab-btn" 
            :class="{ 'active': filterReadState === 'all' }"
            @click="setReadFilter('all')"
          >
            All mail
          </button>
          <button 
            class="tab-btn" 
            :class="{ 'active': filterReadState === 'unread' }"
            @click="setReadFilter('unread')"
          >
            Unread
          </button>
        </div>
      </div>

      <!-- Search Box -->
      <div class="search-box-container">
        <div class="search-input-wrapper">
          <i class="pi pi-search search-icon"></i>
          <input-text 
            v-model="mailSearchQuery" 
            placeholder="Search" 
            class="search-input-field" 
          />
        </div>
      </div>

      <!-- Emails List Container -->
      <div class="emails-scroll-container">
        <div v-if="filteredEmails.length === 0" class="empty-emails-placeholder">
          <i class="pi pi-envelope empty-icon"></i>
          <p>No messages found</p>
        </div>

        <div 
          v-else
          v-for="mail in filteredEmails" 
          :key="mail.id" 
          class="email-card-item"
          :class="{ 'selected': selectedMail?.id === mail.id, 'unread': !mail.isRead }"
          @click="selectMail(mail)"
        >
          <div class="card-header-line">
            <span class="sender">{{ getCleanSender(mail.sender) }}</span>
            <span class="time">{{ relativeTime(mail.date) }}</span>
          </div>

          <div class="card-subject-line">
            {{ mail.subject }}
            <span v-if="!mail.isRead" class="unread-dot-indicator"></span>
          </div>

          <div class="card-snippet-line">
            {{ getSnippet(mail.content) }}
          </div>

          <!-- Email tags/pills -->
          <div v-if="mail.tags && mail.tags.length > 0" class="card-tags-row">
            <span 
              v-for="tag in mail.tags" 
              :key="tag" 
              class="tag-pill"
              :class="getTagClass(tag)"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. RIGHT COLUMN: Email Reading Pane -->
    <div class="webmail-right-column">
      <!-- Active Message State -->
      <div v-if="selectedMail" class="active-reading-layout">
        <!-- Reading Header Actions -->
        <div class="reading-toolbar">
          <div class="toolbar-left">
            <p-button 
              icon="pi pi-archive" 
              class="toolbar-btn" 
              v-tooltip.top="'Archive'" 
              @click="archiveActiveMail"
            />
            <p-button 
              icon="pi pi-trash" 
              class="toolbar-btn text-red-hover" 
              v-tooltip.top="'Move to Trash'" 
              @click="deleteMail"
            />
          </div>

          <div class="toolbar-divider"></div>

          <div class="toolbar-left">
            <p-button 
              icon="pi pi-clock" 
              class="toolbar-btn" 
              v-tooltip.top="'Snooze'" 
              @click="snoozeActiveMail"
            />
          </div>

          <div class="toolbar-right">
            <p-button 
              icon="pi pi-reply" 
              class="toolbar-btn" 
              v-tooltip.top="'Reply'" 
              @click="replyMail"
            />
            <p-button 
              icon="pi pi-reply" 
              class="toolbar-btn pi-flip-h" 
              v-tooltip.top="'Reply All'" 
              @click="replyMail"
            />
            <p-button 
              icon="pi pi-arrow-right" 
              class="toolbar-btn" 
              v-tooltip.top="'Forward'" 
              @click="forwardActiveMail"
            />
            <div class="toolbar-divider inline"></div>
            <p-button 
              icon="pi pi-ellipsis-v" 
              class="toolbar-btn" 
              v-tooltip.top="'More actions'" 
            />
          </div>
        </div>

        <!-- Sender Details Box -->
        <div class="reading-meta-header">
          <div class="meta-left">
            <div class="avatar-initials-circle">
              {{ getInitials(selectedMail.sender) }}
            </div>
            <div class="meta-sender-lines">
              <h3 class="sender-title">{{ getCleanSender(selectedMail.sender) }}</h3>
              <p class="subject-subtitle">{{ selectedMail.subject }}</p>
              <p class="reply-to-line">Reply-To: {{ getEmailAddressFromSender(selectedMail.sender) }}</p>
            </div>
          </div>
          <div class="meta-right">
            <span class="full-timestamp">{{ formatFullDate(selectedMail.date) }}</span>
          </div>
        </div>

        <!-- Attachment Download Banner -->
        <div v-if="selectedMail.attachments && selectedMail.attachments.length > 0" class="attachments-panel">
          <div class="attachments-header">
            <i class="pi pi-paperclip"></i>
            <span>Attachments ({{ selectedMail.attachments.length }})</span>
          </div>
          <div class="attachments-flex-list">
            <div v-for="(att, idx) in selectedMail.attachments" :key="idx" class="att-card" @click="downloadMockAttachment(att)">
              <i class="pi pi-file-pdf"></i>
              <div class="att-meta">
                <span class="att-name">{{ att.filename }}</span>
                <span class="att-size">{{ att.size }}</span>
              </div>
              <i class="pi pi-download download-hover"></i>
            </div>
          </div>
        </div>

        <!-- Sandboxed Iframe Reading Body -->
        <div class="reading-body-scrollable">
          <iframe 
            :srcdoc="selectedMail.content" 
            sandbox="allow-popups" 
            class="mail-display-iframe"
            frameborder="0"
          ></iframe>
        </div>

        <!-- Bottom Quick Reply Text Area -->
        <div class="quick-reply-section">
          <textarea 
            v-model="quickReplyText"
            :placeholder="'Reply ' + getCleanSender(selectedMail.sender) + '...'"
            class="quick-reply-textarea"
            rows="3"
          ></textarea>
          
          <div class="quick-reply-controls">
            <div class="mute-thread-toggle">
              <checkbox id="mute-thread" v-model="isThreadMuted" :binary="true" />
              <label for="mute-thread" class="mute-label">Mute this thread</label>
            </div>
            
            <p-button 
              label="Send" 
              icon="pi pi-send" 
              class="p-button-sm p-button-secondary send-reply-btn" 
              :loading="isSendingReply"
              @click="submitQuickReply"
            />
          </div>
        </div>
      </div>

      <!-- Unselected Message Placeholder State -->
      <div v-else class="unselected-reading-placeholder">
        <i class="pi pi-envelope open-icon"></i>
        <h2>No Message Selected</h2>
        <p>Choose an email from the list to read it here.</p>
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

// State management
const accountEmails = ref([])
const selectedEmailAddress = ref('')
const emails = ref([])
const selectedMail = ref(null)
const currentFolder = ref('inbox')
const filterReadState = ref('all') // 'all' or 'unread'
const mailSearchQuery = ref('')

// Quick Reply States
const quickReplyText = ref('')
const isThreadMuted = ref(false)
const isSendingReply = ref(false)

// Compose States
const isComposeOpen = ref(false)
const composeModel = ref({ to: '', subject: '', body: '' })

// Sidebar folder definitions
const mainFolders = [
  { id: 'inbox', name: 'Inbox', icon: 'pi pi-inbox' },
  { id: 'drafts', name: 'Drafts', icon: 'pi pi-file' },
  { id: 'sent', name: 'Sent', icon: 'pi pi-send' },
  { id: 'junk', name: 'Junk', icon: 'pi pi-exclamation-triangle' },
  { id: 'trash', name: 'Trash', icon: 'pi pi-trash' },
  { id: 'archive', name: 'Archive', icon: 'pi pi-archive' }
]

const categoryFolders = [
  { id: 'social', name: 'Social', icon: 'pi pi-users' },
  { id: 'updates', name: 'Updates', icon: 'pi pi-bell' },
  { id: 'forums', name: 'Forums', icon: 'pi pi-comments' },
  { id: 'shopping', name: 'Shopping', icon: 'pi pi-shopping-bag' },
  { id: 'promotions', name: 'Promotions', icon: 'pi pi-percentage' }
]

// Lifecycles
onMounted(() => {
  loadMailboxes()
})

const loadMailboxes = () => {
  const accounts = accountService.getAccounts()
  accountEmails.value = accounts.map(acc => acc.email)
  
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
    selectedMail.value = null
  }
}

const onMailboxChange = () => {
  loadEmailsForAddress()
}

// Sidebar logic
const selectFolder = (folderId) => {
  currentFolder.value = folderId
  selectedMail.value = null
}

const setReadFilter = (state) => {
  filterReadState.value = state
  selectedMail.value = null
}

const getFolderTitle = () => {
  const all = [...mainFolders, ...categoryFolders]
  const matched = all.find(f => f.id === currentFolder.value)
  return matched ? matched.name : 'Inbox'
}

// Badge counters mock logic
const getFolderCount = (folderId) => {
  if (folderId === 'inbox') {
    return emails.value.filter(m => !m.isSent && !m.isRead).length
  }
  if (folderId === 'drafts') return 9
  if (folderId === 'junk') return 23
  if (folderId === 'archive') return 19
  return 0
}

const getCategoryCount = (catId) => {
  if (catId === 'social') return 972
  if (catId === 'updates') return 342
  if (catId === 'forums') return 128
  if (catId === 'shopping') return 8
  if (catId === 'promotions') return 21
  return 0
}

// Display format helpers
const getAccountDisplayName = (emailStr) => {
  if (!emailStr) return ''
  const prefix = emailStr.split('@')[0]
  return prefix.charAt(0).toUpperCase() + prefix.slice(1)
}

const getCleanSender = (senderStr) => {
  if (!senderStr) return ''
  return senderStr.split('<')[0].trim()
}

const getEmailAddressFromSender = (senderStr) => {
  if (!senderStr) return ''
  const match = senderStr.match(/<([^>]+)>/)
  return match ? match[1] : senderStr
}

const getSnippet = (htmlContent) => {
  if (!htmlContent) return ''
  const doc = new DOMParser().parseFromString(htmlContent, 'text/html')
  const plainText = doc.body.textContent || ''
  return plainText.substring(0, 100) + '...'
}

const getInitials = (senderStr) => {
  const clean = getCleanSender(senderStr)
  const parts = clean.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return clean.substring(0, 2).toUpperCase()
}

// Time Formatting matching the screenshot
const relativeTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHr = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHr / 24)

  if (diffDays > 730) {
    return 'over 2 years ago'
  } else if (diffDays > 365) {
    return 'over 1 year ago'
  } else if (diffDays > 30) {
    return `${Math.floor(diffDays / 30)} months ago`
  } else if (diffDays > 0) {
    return `${diffDays} days ago`
  } else if (diffHr > 0) {
    return `${diffHr} hours ago`
  } else if (diffMin > 0) {
    return `${diffMin} mins ago`
  } else {
    return 'just now'
  }
}

const formatFullDate = (isoString) => {
  if (!isoString) return ''
  return new Date(isoString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// Tags UI color coding
const getTagClass = (tag) => {
  if (tag === 'important' || tag === 'security') return 'tag-important'
  if (tag === 'work' || tag === 'billing') return 'tag-work'
  return 'tag-default'
}

// Email selection logic
const selectMail = (mail) => {
  selectedMail.value = mail
  quickReplyText.value = ''
  if (!mail.isRead) {
    mailService.markAsRead(mail.id, true)
    mail.isRead = true
  }
}

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

// Active folder emails filtration
const filteredEmails = computed(() => {
  let list = [...emails.value]

  // Folder Category logic
  if (currentFolder.value === 'sent') {
    list = list.filter(m => m.isSent)
  } else if (currentFolder.value === 'trash') {
    list = [] // mock empty trash
  } else if (currentFolder.value === 'starred') {
    list = list.filter(m => m.isStarred)
  } else if (categoryFolders.some(f => f.id === currentFolder.value)) {
    // Category tags mapping
    list = list.filter(m => m.tags && m.tags.includes(currentFolder.value))
  } else {
    // Default Inbox
    list = list.filter(m => !m.isSent)
  }

  // Filter by search
  const query = mailSearchQuery.value.trim().toLowerCase()
  if (query) {
    list = list.filter(m => 
      m.subject.toLowerCase().includes(query) ||
      m.sender.toLowerCase().includes(query) ||
      m.content.toLowerCase().includes(query)
    )
  }

  // Unread Toggle filter
  if (filterReadState.value === 'unread') {
    list = list.filter(m => !m.isRead)
  }

  return list.sort((a, b) => new Date(b.date) - new Date(a.date))
})

// Toolbar Actions
const deleteMail = () => {
  if (!selectedMail.value) return
  if (confirm('Move this message to Trash?')) {
    mailService.deleteMail(selectedMail.value.id)
    loadEmailsForAddress()
  }
}

const archiveActiveMail = () => {
  alert(`Message "${selectedMail.value.subject}" moved to Archive.`)
  selectedMail.value = null
}

const snoozeActiveMail = () => {
  alert(`Message "${selectedMail.value.subject}" snoozed.`)
  selectedMail.value = null
}

const forwardActiveMail = () => {
  if (!selectedMail.value) return
  composeModel.value = {
    to: '',
    subject: `Fwd: ${selectedMail.value.subject}`,
    body: `\n\n---------- Forwarded message ---------\nFrom: ${selectedMail.value.sender}\nDate: ${formatFullDate(selectedMail.value.date)}\nSubject: ${selectedMail.value.subject}\n\n` +
      selectedMail.value.content.replace(/<[^>]*>/g, '')
  }
  isComposeOpen.value = true
}

// Quick Reply submit
const submitQuickReply = () => {
  if (!quickReplyText.value.trim()) return
  
  isSendingReply.value = true
  setTimeout(() => {
    const cleanTo = getEmailAddressFromSender(selectedMail.value.sender)
    
    // Simulate sending reply
    mailService.sendMail(
      selectedEmailAddress.value,
      cleanTo,
      `Re: ${selectedMail.value.subject}`,
      quickReplyText.value.trim()
    )

    isSendingReply.value = false
    quickReplyText.value = ''
    loadEmailsForAddress()
    alert('Reply sent successfully!')
  }, 800)
}

// Dialog Compose mail
const openComposeDialog = () => {
  composeModel.value = { to: '', subject: '', body: '' }
  isComposeOpen.value = true
}

const handleSendMail = () => {
  const model = composeModel.value
  if (!model.to.trim()) {
    alert('Please enter a recipient.')
    return
  }

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
  alert(`Downloading attachment: ${att.filename} (${att.size})`)
}

// Watch initialEmail parameter change
watch(() => props.initialEmail, (newEmail) => {
  if (newEmail && accountEmails.value.includes(newEmail)) {
    selectedEmailAddress.value = newEmail
    loadEmailsForAddress()
  }
})
</script>

<style scoped>
/* Dark Slate Theme matching Shadcn-ui exactly */
.webmail-dark-container {
  display: grid;
  grid-template-columns: 260px 360px 1fr;
  height: calc(100vh - 130px);
  background-color: #09090b; /* Zinc 950 */
  color: #fafafa; /* Zinc 50 */
  border: 1px solid #27272a; /* Zinc 800 */
  border-radius: 12px;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
}

@media (max-width: 1200px) {
  .webmail-dark-container {
    grid-template-columns: 220px 300px 1fr;
  }
}

/* 1. LEFT SIDEBAR STYLES */
.webmail-left-sidebar {
  background-color: #09090b;
  border-right: 1px solid #27272a;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.account-header {
  margin-bottom: 20px;
}

/* Custom styled PrimeVue Dropdown for account switcher */
:deep(.account-dropdown) {
  background: #09090b !important;
  border: 1px solid #27272a !important;
  color: #fafafa !important;
  border-radius: 6px !important;
  padding: 2px 4px !important;
}

:deep(.account-dropdown:hover) {
  border-color: #3f3f46 !important;
}

:deep(.account-dropdown .p-dropdown-trigger) {
  color: #a1a1aa !important;
}

:deep(.account-dropdown .p-dropdown-panel) {
  background-color: #09090b !important;
  border: 1px solid #27272a !important;
  color: #fafafa !important;
}

:deep(.account-dropdown .p-dropdown-items-wrapper) {
  background-color: #09090b !important;
}

:deep(.account-dropdown .p-dropdown-item) {
  color: #e4e4e7 !important;
  padding: 8px 12px !important;
}

:deep(.account-dropdown .p-dropdown-item:hover),
:deep(.account-dropdown .p-dropdown-item.p-highlight) {
  background-color: #18181b !important;
  color: #ffffff !important;
}

.account-dropdown-value {
  display: flex;
  align-items: center;
  gap: 8px;
  text-align: left;
}

.account-avatar-icon {
  font-size: 14px;
  color: #a1a1aa;
  background-color: #18181b;
  padding: 6px;
  border-radius: 4px;
}

.account-name-text {
  font-weight: 500;
  font-size: 14px;
  color: #fafafa;
}

.menu-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  color: #a1a1aa; /* Zinc 400 */
  font-size: 14px;
  font-weight: 500;
  transition: all 0.15s ease;
}

.menu-item:hover {
  background-color: #18181b; /* Zinc 900 */
  color: #fafafa;
}

.menu-item.active {
  background-color: #27272a; /* Zinc 800 */
  color: #ffffff;
}

.item-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.item-left i {
  font-size: 15px;
  width: 16px;
  text-align: center;
}

.item-badge {
  background-color: #18181b;
  color: #fafafa;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #27272a;
}

.menu-divider {
  border: 0;
  border-top: 1px solid #27272a;
  margin: 15px 0;
}

.sidebar-compose-footer {
  margin-top: auto;
  padding-top: 15px;
}

.compose-action-btn {
  background-color: #fafafa !important;
  color: #09090b !important;
  border: none !important;
  font-weight: 600 !important;
  border-radius: 6px !important;
}

.compose-action-btn:hover {
  background-color: #e4e4e7 !important;
}

/* 2. MIDDLE COLUMN STYLES */
.webmail-middle-column {
  border-right: 1px solid #27272a;
  background-color: #09090b;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.middle-column-header {
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #27272a;
}

.folder-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  color: #fafafa;
}

.filter-tabs {
  background-color: #18181b;
  border: 1px solid #27272a;
  border-radius: 6px;
  padding: 2px;
  display: flex;
}

.tab-btn {
  background: none;
  border: none;
  color: #a1a1aa;
  font-size: 13px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.tab-btn:hover {
  color: #fafafa;
}

.tab-btn.active {
  background-color: #27272a;
  color: #ffffff;
}

.search-box-container {
  padding: 12px 20px;
  border-bottom: 1px solid #27272a;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: #71717a;
  font-size: 13px;
}

.search-input-field {
  width: 100%;
  background-color: #18181b !important;
  border: 1px solid #27272a !important;
  border-radius: 6px !important;
  padding: 8px 12px 8px 36px !important;
  font-size: 14px !important;
  color: #fafafa !important;
}

.search-input-field:focus {
  border-color: #3f3f46 !important;
}

.emails-scroll-container {
  flex-grow: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-emails-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60px 20px;
  color: #71717a;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

/* Email Card Item */
.email-card-item {
  background-color: #09090b;
  border: 1px solid #27272a;
  border-radius: 8px;
  padding: 14px 16px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  display: flex;
  flex-direction: column;
  gap: 5px;
  position: relative;
}

.email-card-item:hover {
  background-color: #18181b;
}

.email-card-item.selected {
  background-color: #27272a; /* Zinc 800 */
  border-color: #3f3f46;
}

.card-header-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.email-card-item .sender {
  font-size: 14px;
  font-weight: 600;
  color: #fafafa;
}

.email-card-item .time {
  font-size: 12px;
  color: #71717a;
}

.card-subject-line {
  font-size: 13px;
  font-weight: 500;
  color: #fafafa;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 15px;
}

.unread .card-subject-line {
  font-weight: 700;
}

.unread-dot-indicator {
  display: inline-block;
  width: 6px;
  height: 6px;
  background-color: #3b82f6; /* Blue 500 */
  border-radius: 50%;
  margin-left: 6px;
  vertical-align: middle;
}

.card-snippet-line {
  font-size: 12px;
  color: #a1a1aa; /* Zinc 400 */
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags-row {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.tag-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
  text-transform: capitalize;
}

.tag-important {
  background-color: #fafafa;
  color: #09090b;
}

.tag-work {
  background-color: #27272a;
  color: #fafafa;
  border: 1px solid #3f3f46;
}

.tag-default {
  background-color: #18181b;
  color: #a1a1aa;
  border: 1px solid #27272a;
}

/* 3. RIGHT COLUMN STYLES */
.webmail-right-column {
  background-color: #09090b;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  height: 100%;
}

.unselected-reading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  color: #71717a;
  padding: 40px;
}

.unselected-reading-placeholder .open-icon {
  font-size: 40px;
  color: #27272a;
  margin-bottom: 15px;
}

.unselected-reading-placeholder h2 {
  font-size: 18px;
  margin: 0;
  color: #e4e4e7;
}

.unselected-reading-placeholder p {
  font-size: 14px;
  margin: 8px 0 0 0;
}

.active-reading-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Toolbar actions inside message pane */
.reading-toolbar {
  height: 52px;
  border-bottom: 1px solid #27272a;
  padding: 0 16px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 4px;
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  gap: 4px;
}

.toolbar-right {
  margin-left: auto;
  display: flex;
  gap: 4px;
  align-items: center;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background-color: #27272a;
  margin: 0 10px;
}

.toolbar-divider.inline {
  margin: 0 6px;
}

:deep(.toolbar-btn) {
  background: none !important;
  border: none !important;
  color: #a1a1aa !important;
  border-radius: 6px !important;
  width: 32px !important;
  height: 32px !important;
  padding: 0 !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
}

:deep(.toolbar-btn:hover) {
  background-color: #18181b !important;
  color: #fafafa !important;
}

:deep(.toolbar-btn.text-red-hover:hover) {
  color: #ef4444 !important;
}

/* Message Meta block */
.reading-meta-header {
  padding: 20px 24px;
  border-bottom: 1px solid #27272a;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  text-align: left;
  flex-shrink: 0;
}

.meta-left {
  display: flex;
  gap: 16px;
}

.avatar-initials-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #27272a;
  color: #fafafa;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.meta-sender-lines {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sender-title {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}

.subject-subtitle {
  font-size: 13px;
  color: #fafafa;
  margin: 0;
}

.reply-to-line {
  font-size: 12px;
  color: #a1a1aa;
  margin: 0;
}

.meta-right {
  font-size: 12px;
  color: #71717a;
}

/* Attachments Panel */
.attachments-panel {
  padding: 12px 24px;
  background-color: #09090b;
  border-bottom: 1px solid #27272a;
  text-align: left;
  flex-shrink: 0;
}

.attachments-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 600;
  color: #a1a1aa;
  margin-bottom: 8px;
}

.attachments-flex-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.att-card {
  background-color: #18181b;
  border: 1px solid #27272a;
  border-radius: 6px;
  padding: 8px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.att-card:hover {
  border-color: #3f3f46;
}

.att-card i.pi-file-pdf {
  color: #ef4444;
  font-size: 18px;
}

.att-meta {
  display: flex;
  flex-direction: column;
}

.att-name {
  font-size: 12px;
  font-weight: 600;
  color: #fafafa;
}

.att-size {
  font-size: 10px;
  color: #71717a;
}

.download-hover {
  color: #71717a;
  font-size: 12px;
  margin-left: 6px;
}

.att-card:hover .download-hover {
  color: #fafafa;
}

/* Scrollable Iframe Panel */
.reading-body-scrollable {
  flex-grow: 1;
  position: relative;
  background-color: #ffffff; /* White background inside reading body for clean email rendering */
}

.mail-display-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* Quick Reply Section at Bottom */
.quick-reply-section {
  border-top: 1px solid #27272a;
  padding: 16px 24px;
  background-color: #09090b;
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex-shrink: 0;
}

.quick-reply-textarea {
  width: 100%;
  background-color: #09090b;
  border: 1px solid #27272a;
  border-radius: 8px;
  padding: 12px;
  font-size: 13px;
  color: #fafafa;
  font-family: inherit;
  resize: none;
  box-sizing: border-box;
}

.quick-reply-textarea:focus {
  outline: none;
  border-color: #3f3f46;
}

.quick-reply-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.mute-thread-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mute-label {
  font-size: 12px;
  color: #71717a;
  cursor: pointer;
}

.send-reply-btn {
  background-color: #fafafa !important;
  color: #09090b !important;
  border: none !important;
  font-weight: 600 !important;
}

.send-reply-btn:hover {
  background-color: #e4e4e7 !important;
}

/* Compose form fields inside dialog */
.form-fields {
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 10px 0;
  text-align: left;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field label {
  font-size: 13px;
  font-weight: 600;
  color: #e4e4e7;
}

.text-area {
  border: 1px solid #27272a;
  background-color: #18181b;
  color: #fafafa;
  border-radius: 6px;
  padding: 10px;
  font-family: inherit;
  resize: vertical;
}

.text-area:focus {
  outline: none;
  border-color: #3f3f46;
}

:deep(.p-dialog) {
  background-color: #09090b !important;
  border: 1px solid #27272a !important;
  color: #fafafa !important;
}

:deep(.p-dialog-header) {
  background-color: #09090b !important;
  border-bottom: 1px solid #27272a !important;
  color: #fafafa !important;
}

:deep(.p-dialog-content) {
  background-color: #09090b !important;
  color: #fafafa !important;
}

:deep(.p-dialog-footer) {
  background-color: #09090b !important;
  border-top: 1px solid #27272a !important;
}

.brand-btn {
  background-color: #fafafa !important;
  color: #09090b !important;
  border: none !important;
  font-weight: 600 !important;
}

.brand-btn:hover {
  background-color: #e4e4e7 !important;
}
</style>
