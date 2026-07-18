<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useScopedI18n } from '@/i18n/app'
import { toast } from 'vue-sonner'
import { 
  LogOut, Copy, RefreshCw, ChevronLeft, ChevronRight, Settings, Inbox 
} from 'lucide-vue-next'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import Login from '../common/Login.vue'
import AccountSettings from './AccountSettings.vue'
import { processItem } from '../../utils/email-parser'
import MailContentRenderer from '../../components/MailContentRenderer.vue'
import AddressSelect from '../../components/AddressSelect.vue'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const { jwt, settings, useSimpleIndex, showAddressCredential, openSettings, loading } = useGlobalState()

const currentPage = ref(1)
const totalCount = ref(0)
const currentMail = ref(null)
const showAccountSettingsCard = ref(false)
const currentAutoRefreshInterval = ref(60)
const timer = ref(null)

const { t } = useScopedI18n('views.index.SimpleIndex')

const copyAddress = async () => {
  try {
    await navigator.clipboard.writeText(settings.value.address)
    toast.success(t('addressCopied'))
  } catch (error) {
    toast.error('复制失败')
  }
}

const fetchMails = async () => {
  if (!settings.value.address) return
  try {
    const { results, count } = await api.fetch(`/api/mails?limit=1&offset=${currentPage.value - 1}`)
    totalCount.value = count > 0 ? count : totalCount.value;
    const rawMail = results && results.length > 0 ? results[0] : null
    currentMail.value = rawMail ? await processItem(rawMail) : null
  } catch (error) {
    console.error('Failed to fetch mails:', error)
    toast.error('获取邮件失败')
  }
}

const deleteMail = async () => {
  if (!currentMail.value) return;
  try {
    await api.fetch(`/api/mails/${currentMail.value.id}`, { method: 'DELETE' });
    toast.success(t('deleteSuccess'));
    currentMail.value = null;
    await refreshMails();
  } catch (error) {
    console.error('Failed to delete mail:', error);
    toast.error('删除邮件失败');
  }
}

const refreshMails = async () => {
  if (loading.value) return
  currentPage.value = 1
  showAccountSettingsCard.value = false
  currentAutoRefreshInterval.value = 60
  await fetchMails()
  toast.success(t('refreshSuccess'))
}

const currentPageDisplay = computed(() => currentPage.value)
const totalPages = computed(() => Math.max(1, totalCount.value))
const canGoPrev = computed(() => currentPage.value > 1)
const canGoNext = computed(() => currentPage.value < totalPages.value)
const isFirstPage = computed(() => currentPage.value === 1)

const prevPage = async () => {
  if (canGoPrev.value) {
    currentPage.value--
  }
}

const nextPage = async () => {
  if (canGoNext.value) {
    currentPage.value++
  }
}

watch(currentPage, () => {
  fetchMails()
})

onMounted(async () => {
  await api.getSettings()
  await fetchMails()

  timer.value = setInterval(async () => {
    if (!isFirstPage.value) {
      currentAutoRefreshInterval.value = 60
      return
    }

    if (--currentAutoRefreshInterval.value <= 0) {
      await refreshMails()
    }
  }, 1000)
})

onBeforeUnmount(() => {
  clearInterval(timer.value)
})
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-4">
    <!-- Non-logged in state -->
    <div v-if="!settings.address">
      <Card class="border-zinc-800 bg-card">
        <CardContent class="p-6 text-left">
          <Login />
        </CardContent>
      </Card>
    </div>

    <!-- Main Active State -->
    <div v-else class="space-y-4">
      <Card class="border-zinc-800 bg-card">
        <CardContent class="p-6 space-y-6">
          <div class="flex justify-center text-center">
            <AddressSelect :showCopy="false" size="sm" />
          </div>
          
          <div class="flex flex-wrap items-center justify-center gap-2">
            <Button 
              @click="refreshMails" 
              :disabled="loading" 
              variant="outline"
              size="sm"
              class="gap-1.5 border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900"
            >
              <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
              <span>{{ t('refreshMails') }}</span>
            </Button>

            <Button 
              @click="copyAddress" 
              variant="outline"
              size="sm"
              class="gap-1.5 border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900"
            >
              <Copy class="h-4 w-4 text-zinc-400" />
              <span>{{ t('copyAddress') }}</span>
            </Button>

            <Button 
              @click="useSimpleIndex = false" 
              variant="outline"
              size="sm"
              class="gap-1.5 border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900"
            >
              <LogOut class="h-4 w-4 text-zinc-400" />
              <span>{{ t('exitSimpleIndex') }}</span>
            </Button>

            <Button 
              @click="showAccountSettingsCard = true" 
              variant="outline"
              size="sm"
              class="gap-1.5 border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900"
            >
              <Settings class="h-4 w-4 text-zinc-400" />
              <span>{{ t('accountSettings') }}</span>
            </Button>
          </div>

          <div v-if="isFirstPage" class="text-center text-xs text-zinc-500 font-medium">
            {{ t('refreshAfter', { msg: Math.max(0, currentAutoRefreshInterval) }) }}
          </div>
        </CardContent>
      </Card>

      <!-- Account Settings Panel -->
      <Card v-if="showAccountSettingsCard" class="border-zinc-800 bg-card text-left">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-zinc-800">
          <CardTitle class="text-lg font-bold text-white">{{ t('accountSettings') }}</CardTitle>
          <Button variant="ghost" size="sm" @click="showAccountSettingsCard = false" class="text-zinc-400 hover:text-white">
            Close
          </Button>
        </CardHeader>
        <CardContent class="p-6">
          <AccountSettings />
        </CardContent>
      </Card>

      <!-- Mail Content Panel -->
      <Card v-else class="border-zinc-800 bg-card text-left">
        <CardContent class="p-6 space-y-4">
          <!-- Pagination for Mails -->
          <div v-if="totalCount > 1" class="flex items-center justify-between border-b border-zinc-800 pb-3">
            <Button size="xs" variant="ghost" :disabled="!canGoPrev" @click="prevPage" class="text-zinc-400 hover:text-white">
              <ChevronLeft class="h-4 w-4 mr-1" />
              <span>{{ t('prevPage') }}</span>
            </Button>
            
            <span class="text-xs font-semibold text-zinc-400">
              {{ t('mailCount', { current: currentPageDisplay, total: totalCount }) }}
            </span>

            <Button size="xs" variant="ghost" :disabled="!canGoNext" @click="nextPage" class="text-zinc-400 hover:text-white">
              <span>{{ t('nextPage') }}</span>
              <ChevronRight class="h-4 w-4 ml-1" />
            </Button>
          </div>

          <!-- Empty or Mail View -->
          <div v-if="!currentMail" class="flex flex-col items-center justify-center p-12 text-zinc-500 gap-3">
            <Inbox class="h-10 w-10 text-zinc-700" />
            <span class="text-xs">{{ t('noMails') }}</span>
          </div>

          <div v-else class="space-y-4">
            <h3 v-if="currentMail.subject" class="text-base font-bold text-white tracking-tight border-b border-zinc-900 pb-2">{{ currentMail.subject }}</h3>
            <div class="pt-2">
              <MailContentRenderer 
                :mail="currentMail" 
                :showEMailTo="false" 
                :showReply="false"
                :enableUserDeleteEmail="openSettings.enableUserDeleteEmail" 
                :showSaveS3="false"
                :onDelete="deleteMail" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Credentials Modal -->
    <Dialog v-model:open="showAddressCredential">
      <DialogContent class="sm:max-w-md border-zinc-800 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold text-white">{{ t('addressCredential') }}</DialogTitle>
          <DialogDescription class="text-xs text-zinc-400">
            {{ t("addressCredentialTip") }}
          </DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <div class="bg-zinc-900 border border-zinc-800 px-3 py-2.5 rounded-lg text-xs font-mono text-emerald-400 break-all select-all">
            {{ jwt }}
          </div>
        </div>
        <DialogFooter>
          <Button @click="showAddressCredential = false" class="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold w-full sm:w-auto">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
/* No scoped styles needed, pure Tailwind */
</style>
