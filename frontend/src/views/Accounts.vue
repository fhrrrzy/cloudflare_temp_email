<template>
  <div class="space-y-6">
    <!-- Header with Actions -->
    <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div class="relative max-w-xs flex-1">
        <Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <Input 
          v-model="searchQuery" 
          placeholder="Search accounts..." 
          class="h-10 pl-9 border-border bg-zinc-900/50 text-white placeholder-zinc-500" 
        />
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <Button 
          variant="outline" 
          class="h-10 border-border text-zinc-300 hover:bg-zinc-800 hover:text-white gap-2" 
          @click="openSingleCreateDialog"
        >
          <UserPlus class="h-4 w-4" />
          Single Account
        </Button>
        <Button 
          class="h-10 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2" 
          @click="openBulkCreateDialog"
        >
          <Users class="h-4 w-4" />
          Bulk Create
        </Button>
        <Button 
          variant="outline" 
          class="h-10 border-border text-zinc-300 hover:bg-zinc-800 hover:text-white gap-2" 
          @click="openExportDialog"
        >
          <Download class="h-4 w-4" />
          Export All
        </Button>
      </div>
    </div>

    <!-- Accounts Data Table Card -->
    <Card class="border-border bg-card">
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow class="hover:bg-transparent">
              <TableHead class="w-12 text-center">
                <input 
                  type="checkbox" 
                  :checked="areAllSelected" 
                  @change="toggleSelectAll" 
                  class="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary"
                />
              </TableHead>
              <TableHead class="text-zinc-400 font-medium text-xs">Email Address</TableHead>
              <TableHead class="text-zinc-400 font-medium text-xs">Created On</TableHead>
              <TableHead class="text-zinc-400 font-medium text-xs">Mailbox</TableHead>
              <TableHead class="text-zinc-400 font-medium text-xs">Status</TableHead>
              <TableHead class="text-right text-zinc-400 font-medium text-xs pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="account in filteredAccounts" :key="account.id" class="border-border/50 hover:bg-zinc-800/30">
              <TableCell class="text-center py-3">
                <input 
                  type="checkbox" 
                  :value="account" 
                  v-model="selectedAccounts" 
                  class="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-primary focus:ring-primary"
                />
              </TableCell>
              <TableCell class="text-sm font-medium text-zinc-100 py-3">{{ account.email }}</TableCell>
              <TableCell class="text-sm text-zinc-400 py-3">{{ formatDateTime(account.creationDate) }}</TableCell>
              <TableCell class="py-3">
                <Badge variant="outline" class="text-xs border-zinc-800 text-zinc-300 bg-zinc-900/30">
                  {{ account.mailCount }} mails
                </Badge>
              </TableCell>
              <TableCell class="py-3">
                <Badge :variant="account.status === 'Active' ? 'default' : 'destructive'" class="text-xs">
                  {{ account.status }}
                </Badge>
              </TableCell>
              <TableCell class="text-right py-3 pr-6">
                <div class="inline-flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    @click="openWebmail(account.email)"
                    title="Open Webmail"
                  >
                    <Mail class="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    @click="viewDetails(account)"
                    title="View Details"
                  >
                    <Eye class="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    @click="copyCredentials(account)"
                    title="Copy Credentials"
                  >
                    <Copy class="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    class="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-950/20"
                    @click="confirmDelete(account)"
                    title="Delete Account"
                  >
                    <Trash class="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
            <TableRow v-if="filteredAccounts.length === 0">
              <TableCell colspan="6" class="text-center text-zinc-500 py-12">
                No accounts match the search criteria.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <!-- Bulk Action Actionbar -->
        <div v-if="selectedAccounts.length > 0" class="flex items-center justify-between border-t border-border px-6 py-4 bg-zinc-900/20">
          <span class="text-xs text-zinc-400">Selected <strong class="text-white">{{ selectedAccounts.length }}</strong> accounts</span>
          <div class="flex items-center gap-2">
            <Button 
              variant="outline" 
              class="h-9 text-xs border-border hover:bg-zinc-800 text-zinc-300 gap-1.5" 
              @click="exportSelected"
            >
              <Download class="h-3.5 w-3.5" />
              Export Selected
            </Button>
            <Button 
              variant="destructive" 
              class="h-9 text-xs gap-1.5" 
              @click="deleteSelected"
            >
              <Trash class="h-3.5 w-3.5" />
              Delete Selected
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Create Single Account Dialog -->
    <Dialog v-model:open="isSingleCreateOpen">
      <DialogContent class="sm:max-w-md border-border bg-card text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-semibold text-white">Create Single Account</DialogTitle>
          <DialogDescription class="text-xs text-zinc-400">
            Set a new email username and password.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="new-email" class="text-xs text-zinc-300">Email Address</Label>
            <div class="flex">
              <Input 
                id="new-email" 
                v-model="singleAccount.prefix" 
                placeholder="username" 
                class="rounded-r-none border-r-0 border-border bg-zinc-900/50 text-white placeholder-zinc-500 focus:ring-1 focus:ring-primary focus:border-primary" 
              />
              <span class="inline-flex items-center px-3 border border-border bg-zinc-950 text-xs text-zinc-400 font-medium rounded-r-md select-none border-l-0">
                @codeflai.tech
              </span>
            </div>
          </div>

          <div class="space-y-2">
            <Label for="new-password" class="text-xs text-zinc-300">Password</Label>
            <Input 
              id="new-password" 
              type="password" 
              v-model="singleAccount.password" 
              placeholder="Leave blank to auto-generate" 
              class="border-border bg-zinc-900/50 text-white placeholder-zinc-500 focus:ring-1 focus:ring-primary focus:border-primary" 
            />
          </div>
        </div>

        <DialogFooter class="gap-2 sm:gap-0">
          <Button variant="ghost" class="hover:bg-zinc-800 text-zinc-400 hover:text-white" @click="isSingleCreateOpen = false">
            Cancel
          </Button>
          <Button class="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" @click="handleCreateSingle">
            Create Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Bulk Create Accounts Dialog -->
    <Dialog v-model:open="isBulkCreateOpen">
      <DialogContent class="sm:max-w-lg border-border bg-card text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-semibold text-white">
            Bulk Create Accounts
          </DialogTitle>
          <DialogDescription class="text-xs text-zinc-400">
            Create multiple inboxes simultaneously.
          </DialogDescription>
        </DialogHeader>

        <!-- Step 1: Input details -->
        <div v-if="bulkStep === 1" class="space-y-4 py-4">
          <div class="space-y-2">
            <Label for="bulk-names" class="text-xs text-zinc-300">Usernames (one per line, without domain)</Label>
            <textarea 
              id="bulk-names" 
              v-model="bulkInput.names" 
              rows="6" 
              placeholder="alex&#10;john&#10;support"
              class="flex min-h-[120px] w-full rounded-md border border-border bg-zinc-900/50 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p class="text-[10px] text-zinc-400">Appends <strong>@codeflai.tech</strong> automatically to each line.</p>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="bulk-pass-mode" class="text-xs text-zinc-300">Password Option</Label>
              <Select v-model="bulkInput.passwordMode">
                <SelectTrigger id="bulk-pass-mode" class="border-border bg-zinc-900/50 text-white">
                  <SelectValue placeholder="Select password option" />
                </SelectTrigger>
                <SelectContent class="border-border bg-zinc-900 text-white">
                  <SelectItem value="auto">Auto-Generate Passwords</SelectItem>
                  <SelectItem value="custom">Use Custom Password</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2" v-if="bulkInput.passwordMode === 'custom'">
              <Label for="bulk-pass" class="text-xs text-zinc-300">Custom Password</Label>
              <Input 
                id="bulk-pass" 
                type="password" 
                v-model="bulkInput.customPassword" 
                placeholder="Common password" 
                class="border-border bg-zinc-900/50 text-white placeholder-zinc-500" 
              />
            </div>
          </div>
        </div>

        <!-- Step 2: Preview generated profiles -->
        <div v-if="bulkStep === 2" class="space-y-4 py-4">
          <p class="text-xs text-zinc-400">Review the accounts and auto-generated passwords before confirming.</p>
          <div class="max-h-60 overflow-y-auto border border-border rounded-lg bg-zinc-950">
            <Table>
              <TableHeader>
                <TableRow class="hover:bg-transparent">
                  <TableHead class="text-zinc-400 font-medium text-xs py-2">Email Address</TableHead>
                  <TableHead class="text-zinc-400 font-medium text-xs py-2">Generated Password</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="(preview, idx) in bulkPreviewList" :key="idx" class="border-border/50">
                  <TableCell class="text-xs text-zinc-100 py-2">{{ preview.email }}</TableCell>
                  <TableCell class="text-xs font-mono text-zinc-300 py-2">{{ preview.password }}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div v-if="bulkValidationErrors.length > 0" class="rounded-lg border border-yellow-900/30 bg-yellow-950/20 px-3 py-2 text-[11px] text-yellow-400">
            <p class="font-semibold mb-1">Warnings / Errors:</p>
            <ul class="list-disc pl-4 space-y-0.5">
              <li v-for="(err, idx) in bulkValidationErrors" :key="idx">{{ err }}</li>
            </ul>
          </div>
        </div>

        <DialogFooter class="gap-2 sm:gap-0">
          <div v-if="bulkStep === 1" class="flex w-full justify-end gap-2">
            <Button variant="ghost" class="hover:bg-zinc-800 text-zinc-400 hover:text-white" @click="isBulkCreateOpen = false">
              Cancel
            </Button>
            <Button class="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" @click="generateBulkPreview">
              Preview Accounts
            </Button>
          </div>
          <div v-if="bulkStep === 2" class="flex w-full justify-between gap-2">
            <Button variant="ghost" class="hover:bg-zinc-800 text-zinc-400 hover:text-white" @click="bulkStep = 1">
              Back
            </Button>
            <Button class="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" :disabled="isBulkSubmitting" @click="handleConfirmBulkCreate">
              <span v-if="isBulkSubmitting">Creating...</span>
              <span v-else>Confirm & Create</span>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Account Details Dialog -->
    <Dialog v-model:open="isDetailsOpen">
      <DialogContent class="sm:max-w-md border-border bg-card text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-semibold text-white">Account Details</DialogTitle>
        </DialogHeader>

        <div v-if="selectedDetailAccount" class="divide-y divide-border text-sm">
          <div class="flex justify-between py-2.5">
            <span class="text-zinc-400">Email Address:</span>
            <span class="font-medium text-white">{{ selectedDetailAccount.email }}</span>
          </div>
          <div class="flex justify-between py-2.5">
            <span class="text-zinc-400">Password:</span>
            <span class="font-mono bg-zinc-950 px-2 py-0.5 rounded text-xs text-primary border border-border">{{ selectedDetailAccount.password }}</span>
          </div>
          <div class="flex justify-between py-2.5">
            <span class="text-zinc-400">Status:</span>
            <Badge :variant="selectedDetailAccount.status === 'Active' ? 'default' : 'destructive'" class="text-xs">
              {{ selectedDetailAccount.status }}
            </Badge>
          </div>
          <div class="flex justify-between py-2.5">
            <span class="text-zinc-400">Created Date:</span>
            <span class="text-zinc-300">{{ formatDateTime(selectedDetailAccount.creationDate) }}</span>
          </div>
          <div class="flex justify-between py-2.5">
            <span class="text-zinc-400">Emails Received:</span>
            <span class="text-zinc-300 font-medium">{{ selectedDetailAccount.mailCount }}</span>
          </div>
          <div class="flex justify-between py-2.5">
            <span class="text-zinc-400">Emails Sent:</span>
            <span class="text-zinc-300 font-medium">{{ selectedDetailAccount.sendCount || 0 }}</span>
          </div>
        </div>

        <DialogFooter class="gap-2 sm:gap-0">
          <Button variant="ghost" class="hover:bg-zinc-800 text-zinc-400 hover:text-white" @click="isDetailsOpen = false">
            Close
          </Button>
          <Button class="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" @click="openWebmail(selectedDetailAccount?.email)">
            Login to Webmail
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Export Dialog -->
    <Dialog v-model:open="isExportOpen">
      <DialogContent class="sm:max-w-md border-border bg-card text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-semibold text-white">Export Accounts</DialogTitle>
          <DialogDescription class="text-xs text-zinc-400">
            Choose format to download the accounts.
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-3">
            <Label class="text-xs text-zinc-300">Export Format</Label>
            <div class="space-y-2">
              <label class="flex items-center gap-2 text-sm text-zinc-200 cursor-pointer select-none">
                <input type="radio" value="txt" v-model="exportFormat" class="h-4 w-4 border-zinc-700 bg-zinc-900 text-primary focus:ring-primary" />
                Plain Text (email:password)
              </label>
              <label class="flex items-center gap-2 text-sm text-zinc-200 cursor-pointer select-none">
                <input type="radio" value="csv" v-model="exportFormat" class="h-4 w-4 border-zinc-700 bg-zinc-900 text-primary focus:ring-primary" />
                CSV Format (Comma-separated)
              </label>
            </div>
          </div>
        </div>

        <DialogFooter class="gap-2 sm:gap-0">
          <Button variant="ghost" class="hover:bg-zinc-800 text-zinc-400 hover:text-white" @click="isExportOpen = false">
            Cancel
          </Button>
          <Button class="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold" @click="triggerExport">
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { accountService } from '../services/accountService'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Search, UserPlus, Users, Download, Eye, Copy, Trash, Mail } from 'lucide-vue-next'

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

const loadAccounts = async () => {
  accounts.value = await accountService.getAccounts()
}

onMounted(async () => {
  await loadAccounts()
})

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

const toggleSelectAll = (e) => {
  if (e.target.checked) {
    selectedAccounts.value = [...filteredAccounts.value]
  } else {
    selectedAccounts.value = []
  }
}

const areAllSelected = computed(() => {
  return filteredAccounts.value.length > 0 && selectedAccounts.value.length === filteredAccounts.value.length
})

// Action button triggers
const openWebmail = (email) => {
  router.push({ path: '/admin/webmail', query: { email } })
}

const viewDetails = async (account) => {
  const password = await accountService.showPassword(account.id)
  selectedDetailAccount.value = { ...account, password }
  isDetailsOpen.value = true
}

const copyCredentials = async (account) => {
  const password = await accountService.showPassword(account.id)
  const text = `Email: ${account.email}\nPassword: ${password}`
  navigator.clipboard.writeText(text).then(() => {
    alert(`Copied credentials for ${account.email} to clipboard!`)
  })
}

const confirmDelete = async (account) => {
  if (confirm(`Are you sure you want to delete ${account.email}?`)) {
    await accountService.deleteAccount(account.id)
    await loadAccounts()
  }
}

// Single Account Creation
const openSingleCreateDialog = () => {
  singleAccount.value = { prefix: '', password: '' }
  isSingleCreateOpen.value = true
}

const handleCreateSingle = async () => {
  const prefix = singleAccount.value.prefix.trim()
  if (!prefix) {
    alert('Please enter a username.')
    return
  }
  const email = `${prefix}@codeflai.tech`
  await accountService.createAccount(email, singleAccount.value.password)
  isSingleCreateOpen.value = false
  await loadAccounts()
}

// Bulk Account Creation
const openBulkCreateDialog = () => {
  bulkStep.value = 1
  bulkInput.value = { names: '', passwordMode: 'auto', customPassword: '' }
  bulkPreviewList.value = []
  bulkValidationErrors.value = []
  isBulkCreateOpen.value = true
}

const generateBulkPreview = async () => {
  const namesText = bulkInput.value.names.trim()
  if (!namesText) {
    alert('Please enter at least one username.')
    return
  }

  const usernames = namesText.split('\n').map(n => n.trim()).filter(n => n.length > 0)
  const previews = []
  const errors = []
  const existingAccounts = await accountService.getAccounts()

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
  const rawList = bulkPreviewList.value.map(p => p.email.split('@')[0])
  const defaultPass = bulkInput.value.passwordMode === 'custom' ? bulkInput.value.customPassword : ''
  const autoGen = bulkInput.value.passwordMode === 'auto'
  
  accountService.bulkCreateAccounts(
    rawList.map(name => `${name}@codeflai.tech`),
    defaultPass,
    autoGen
  ).then(({ errors }) => {
    isBulkSubmitting.value = false
    isBulkCreateOpen.value = false
    loadAccounts()

    if (errors.length > 0) {
      alert(`Created accounts with some errors:\n${errors.join('\n')}`)
    } else {
      alert(`Successfully created ${rawList.length} accounts!`)
    }
  })
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

const triggerExport = async () => {
  const result = await accountService.exportAccounts(exportFormat.value, currentExportIds.value)
  
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
const deleteSelected = async () => {
  if (confirm(`Are you sure you want to delete ${selectedAccounts.value.length} selected accounts?`)) {
    for (const acc of selectedAccounts.value) {
      await accountService.deleteAccount(acc.id)
    }
    await loadAccounts()
    selectedAccounts.value = []
  }
}
</script>
