<template>
  <div class="webmail-dark-container border border-border rounded-lg bg-card text-white overflow-hidden shadow-2xl">
    <!-- 1. EMAILS LIST COLUMN -->
    <div class="webmail-middle-column flex flex-col border-r border-border bg-zinc-950/20">
      <!-- Title & Mail Filters Header -->
      <div class="middle-column-header p-4 border-b border-border flex items-center justify-between bg-zinc-950/20">
        <h2 class="folder-title text-sm font-semibold text-white">{{ getFolderTitle() }}</h2>
        <div class="filter-tabs flex bg-zinc-900 border border-border p-0.5 rounded-md">
          <button 
            class="px-2.5 py-1 text-[11px] font-medium rounded-sm transition-colors" 
            :class="filterReadState === 'all' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'"
            @click="setReadFilter('all')"
          >
            All
          </button>
          <button 
            class="px-2.5 py-1 text-[11px] font-medium rounded-sm transition-colors" 
            :class="filterReadState === 'unread' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'"
            @click="setReadFilter('unread')"
          >
            Unread
          </button>
        </div>
      </div>

      <!-- Search Box -->
      <div class="search-box-container p-3 border-b border-border">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
          <Input 
            v-model="mailSearchQuery" 
            placeholder="Search emails..." 
            class="h-9 pl-9 border-border bg-zinc-900/40 text-white placeholder-zinc-500 text-xs" 
          />
        </div>
      </div>

      <!-- Emails List Container -->
      <div class="emails-scroll-container flex-grow overflow-y-auto divide-y divide-border/40">
        <div v-if="filteredEmails.length === 0" class="flex flex-col items-center justify-center py-12 text-zinc-500 gap-3">
          <Mail class="h-8 w-8 text-zinc-600" />
          <p class="text-xs">No messages found</p>
        </div>

        <div 
          v-else
          v-for="mail in filteredEmails" 
          :key="mail.id" 
          class="email-card-item p-4 cursor-pointer transition-colors relative"
          :class="[
            selectedMail?.id === mail.id ? 'bg-zinc-800/40' : 'hover:bg-zinc-800/20',
            !mail.isRead ? 'border-l-2 border-primary' : ''
          ]"
          @click="selectMail(mail)"
        >
          <div class="flex items-center justify-between text-xs mb-1">
            <span class="font-semibold text-zinc-100 truncate pr-2">{{ getCleanSender(mail.sender) }}</span>
            <span class="text-zinc-400 shrink-0">{{ relativeTime(mail.date) }}</span>
          </div>

          <div class="text-xs font-medium text-white truncate mb-1 flex items-center justify-between">
            <span>{{ mail.subject }}</span>
            <span v-if="!mail.isRead" class="h-1.5 w-1.5 rounded-full bg-primary shrink-0 ml-2"></span>
          </div>

          <div class="text-[11px] text-zinc-400 line-clamp-2">
            {{ getSnippet(mail.content) }}
          </div>

          <!-- Email tags/pills -->
          <div v-if="mail.tags && mail.tags.length > 0" class="flex flex-wrap gap-1 mt-2">
            <span 
              v-for="tag in mail.tags" 
              :key="tag" 
              class="px-1.5 py-0.5 rounded text-[9px] font-semibold tracking-wider uppercase border"
              :class="getTagClass(tag)"
            >
              {{ tag }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. EMAIL READING PANE COLUMN -->
    <div class="webmail-right-column flex flex-col bg-zinc-950/10">
      <!-- Active Message State -->
      <div v-if="selectedMail" class="flex flex-col h-full overflow-hidden">
        <!-- Reading Header Actions Toolbar -->
        <div class="reading-toolbar h-14 border-b border-border px-4 flex items-center justify-between bg-zinc-950/20 shrink-0">
          <div class="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              class="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
              @click="archiveActiveMail"
              title="Archive"
            >
              <Archive class="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              class="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-950/20"
              @click="deleteMail"
              title="Delete"
            >
              <Trash2 class="h-4 w-4" />
            </Button>
          </div>

          <div class="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              class="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
              @click="replyMail"
              title="Reply"
            >
              <Reply class="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              class="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
              @click="forwardActiveMail"
              title="Forward"
            >
              <Forward class="h-4 w-4" />
            </Button>
          </div>
        </div>

        <!-- Sender Details Box -->
        <div class="reading-meta-header p-6 border-b border-border flex items-start justify-between bg-zinc-950/10 shrink-0">
          <div class="flex items-start gap-4">
            <div class="h-10 w-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-sm select-none">
              {{ getInitials(selectedMail.sender) }}
            </div>
            <div class="space-y-1">
              <h3 class="text-sm font-semibold text-white leading-none">{{ getCleanSender(selectedMail.sender) }}</h3>
              <p class="text-xs text-zinc-400">{{ selectedMail.subject }}</p>
              <p class="text-[10px] text-zinc-500 font-mono">From: {{ getEmailAddressFromSender(selectedMail.sender) }}</p>
            </div>
          </div>
          <span class="text-xs text-zinc-400">{{ formatFullDate(selectedMail.date) }}</span>
        </div>

        <!-- Attachment Download Banner -->
        <div v-if="selectedMail.attachments && selectedMail.attachments.length > 0" class="attachments-panel p-4 border-b border-border bg-zinc-900/30 shrink-0">
          <div class="flex items-center gap-2 text-xs font-semibold text-zinc-300 mb-2">
            <Paperclip class="h-4 w-4" />
            <span>Attachments ({{ selectedMail.attachments.length }})</span>
          </div>
          <div class="flex flex-wrap gap-2">
            <div 
              v-for="(att, idx) in selectedMail.attachments" 
              :key="idx" 
              class="flex items-center gap-3 bg-zinc-900 border border-border px-3 py-2 rounded-md text-xs cursor-pointer hover:bg-zinc-800 transition-colors"
              @click="downloadMockAttachment(att)"
            >
              <FileText class="h-4 w-4 text-zinc-400" />
              <div class="flex flex-col text-left">
                <span class="text-zinc-220 font-medium max-w-[120px] truncate">{{ att.filename }}</span>
                <span class="text-[10px] text-zinc-500">{{ att.size }}</span>
              </div>
              <Download class="h-3.5 w-3.5 text-zinc-400 hover:text-white" />
            </div>
          </div>
        </div>

        <!-- Sandboxed Iframe Reading Body -->
        <div class="reading-body-scrollable flex-grow p-6 overflow-y-auto">
          <iframe 
            :srcdoc="selectedMail.content" 
            sandbox="allow-popups" 
            class="w-full h-full min-h-[300px] bg-transparent"
            frameborder="0"
          ></iframe>
        </div>

        <!-- Bottom Quick Reply Text Area -->
        <div class="quick-reply-section p-4 border-t border-border bg-zinc-950/20 shrink-0 space-y-3">
          <textarea 
            v-model="quickReplyText"
            :placeholder="'Reply ' + getCleanSender(selectedMail.sender) + '...'"
            class="flex min-h-[60px] w-full rounded-md border border-border bg-zinc-900/40 px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            rows="3"
          ></textarea>
          
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
              <input type="checkbox" v-model="isThreadMuted" class="h-3.5 w-3.5 rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary" />
              Mute thread
            </label>
            
            <Button 
              size="sm" 
              class="h-8 bg-zinc-900 border border-border text-zinc-300 hover:bg-zinc-800 hover:text-white gap-1.5" 
              :disabled="isSendingReply"
              @click="submitQuickReply"
            >
              <Send class="h-3.5 w-3.5" />
              <span v-if="isSendingReply">Sending...</span>
              <span v-else>Send Reply</span>
            </Button>
          </div>
        </div>
      </div>

      <!-- Unselected Message Placeholder State -->
      <div v-else class="flex-grow flex flex-col items-center justify-center text-zinc-500 p-8 gap-3">
        <Mail class="h-10 w-10 text-zinc-700" />
        <h2 class="text-sm font-semibold text-white">No Message Selected</h2>
        <p class="text-xs text-zinc-400">Choose an email from the list to read it here.</p>
      </div>
    </div>

    <!-- Compose Message Dialog -->
    <Dialog v-model:open="isComposeOpen">
      <DialogContent class="sm:max-w-xl border-border bg-card text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-semibold text-white">New Message</DialogTitle>
          <DialogDescription class="text-xs text-zinc-400">
            Send an email from your administration email pool.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label class="text-xs text-zinc-300">From</Label>
              <Input :value="selectedEmailAddress" disabled class="h-9 border-border bg-zinc-950 text-zinc-500" />
            </div>
            
            <div class="space-y-2">
              <Label for="compose-to" class="text-xs text-zinc-300">To</Label>
              <Input 
                id="compose-to" 
                v-model="composeModel.to" 
                placeholder="recipient@example.com" 
                class="h-9 border-border bg-zinc-900/50 text-white placeholder-zinc-500 focus:ring-1 focus:ring-primary focus:border-primary" 
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label for="compose-subject" class="text-xs text-zinc-300">Subject</Label>
            <Input 
              id="compose-subject" 
              v-model="composeModel.subject" 
              placeholder="Enter subject line" 
              class="h-9 border-border bg-zinc-900/50 text-white placeholder-zinc-500 focus:ring-1 focus:ring-primary focus:border-primary" 
            />
          </div>

          <div class="space-y-2">
            <Label for="compose-body" class="text-xs text-zinc-300">Message Body</Label>
            <textarea 
              id="compose-body" 
              v-model="composeModel.body" 
              rows="8" 
              placeholder="Type your message details here..."
              class="flex min-h-[160px] w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        <DialogFooter class="gap-2 sm:gap-0">
          <Button variant="ghost" class="hover:bg-zinc-800 text-zinc-400 hover:text-white" @click="isComposeOpen = false">
            Discard
          </Button>
          <Button class="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" @click="handleSendMail">
            Send Email
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useGlobalState } from '../store'
import { accountService } from '../services/accountService'
import { mailService } from '../services/mailService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { 
  Inbox, FileText, Send, AlertTriangle, Trash2, Archive, 
  Users, RefreshCw, MessageSquare, ShoppingBag, Tag, 
  Search, Pencil, Reply, Forward, Star, Paperclip, Printer, Download, Eye,
  Mail
} from 'lucide-vue-next'

const props = defineProps({
  initialEmail: {
    type: String,
    default: null
  }
})

const route = useRoute()

const {
  adminMailTabAddress: selectedEmailAddress,
  adminMailActiveFolder: currentFolder,
  adminMailActiveMail: selectedMail,
  adminMailIsComposeOpen: isComposeOpen
} = useGlobalState()

const emails = ref([])
const filterReadState = ref('all') // 'all' or 'unread'
const mailSearchQuery = ref('')

// Quick Reply States
const quickReplyText = ref('')
const isThreadMuted = ref(false)
const isSendingReply = ref(false)

// Compose States
const composeModel = ref({ to: '', subject: '', body: '' })

const mainFolders = [
  { id: 'inbox', name: 'Inbox' },
  { id: 'drafts', name: 'Drafts' },
  { id: 'sent', name: 'Sent' },
  { id: 'junk', name: 'Junk' },
  { id: 'trash', name: 'Trash' },
  { id: 'archive', name: 'Archive' }
]

const categoryFolders = [
  { id: 'social', name: 'Social' },
  { id: 'updates', name: 'Updates' },
  { id: 'forums', name: 'Forums' },
  { id: 'shopping', name: 'Shopping' },
  { id: 'promotions', name: 'Promotions' }
]

const loadEmailsForAddress = async () => {
  if (selectedEmailAddress.value) {
    emails.value = await mailService.getMails(selectedEmailAddress.value)
  }
}

onMounted(async () => {
  // If route query params has email, update store
  const emailQuery = props.initialEmail || route.query.email
  if (emailQuery) {
    selectedEmailAddress.value = emailQuery
  }
  await loadEmailsForAddress()
})

watch(selectedEmailAddress, async () => {
  await loadEmailsForAddress()
})

const setReadFilter = (state) => {
  filterReadState.value = state
  selectedMail.value = null
}

const getFolderTitle = () => {
  const all = [...mainFolders, ...categoryFolders]
  const matched = all.find(f => f.id === currentFolder.value)
  return matched ? matched.name : 'Inbox'
}

// Display format helpers
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

// Time Formatting
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
  if (tag === 'important' || tag === 'security') return 'border-red-900/30 bg-red-950/20 text-red-400'
  if (tag === 'work' || tag === 'billing') return 'border-emerald-900/30 bg-emerald-950/20 text-emerald-400'
  return 'border-zinc-800 bg-zinc-900/30 text-zinc-400'
}

// Email selection logic
const selectMail = async (mail) => {
  selectedMail.value = mail
  quickReplyText.value = ''
  if (!mail.isRead) {
    await mailService.markAsRead(mail.id, true)
    mail.isRead = true
  }
}

const toggleStar = async (mail) => {
  await mailService.toggleStar(mail.id)
  mail.isStarred = !mail.isStarred
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
    list = list.filter(m => m.tags && m.tags.includes(currentFolder.value))
  } else {
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
const deleteMail = async () => {
  if (!selectedMail.value) return
  if (confirm('Are you sure you want to delete this message?')) {
    await mailService.deleteMail(selectedMail.value.id)
    selectedMail.value = null
    await loadEmailsForAddress()
  }
}

const archiveActiveMail = () => {
  alert(`Message "${selectedMail.value.subject}" moved to Archive.`)
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
const submitQuickReply = async () => {
  if (!quickReplyText.value.trim()) return
  
  isSendingReply.value = true
  try {
    const cleanTo = getEmailAddressFromSender(selectedMail.value.sender)
    await mailService.sendMail(
      selectedEmailAddress.value,
      cleanTo,
      `Re: ${selectedMail.value.subject}`,
      quickReplyText.value.trim()
    )
    quickReplyText.value = ''
    await loadEmailsForAddress()
    alert('Reply sent successfully!')
  } catch (err) {
    alert('Failed to send reply: ' + err.message)
  } finally {
    isSendingReply.value = false
  }
}

const handleSendMail = async () => {
  const model = composeModel.value
  if (!model.to.trim()) {
    alert('Please enter a recipient.')
    return
  }

  try {
    await mailService.sendMail(
      selectedEmailAddress.value,
      model.to.trim(),
      model.subject.trim(),
      model.body.trim()
    )
    isComposeOpen.value = false
    await loadEmailsForAddress()
    alert('Email sent successfully!')
  } catch (err) {
    alert('Failed to send email: ' + err.message)
  }
}

const downloadMockAttachment = (att) => {
  alert(`Downloading attachment: ${att.filename} (${att.size})`)
}
</script>

<style scoped>
.webmail-dark-container {
  display: grid;
  grid-template-columns: 320px 1fr;
  height: calc(100vh - 140px);
}

.webmail-middle-column {
  height: 100%;
}

.webmail-right-column {
  height: 100%;
}
</style>
