<script setup>
import { watch, onMounted, ref, onBeforeUnmount, computed } from "vue";
import { useScopedI18n } from '@/i18n/app'
import { useGlobalState } from '../store'
import { 
  Download, ArrowLeft, ArrowRight, Inbox, RefreshCw, Trash2, 
  Check, CheckSquare, Square, Eye, Mail, Search, ChevronRight, Loader2
} from 'lucide-vue-next'
import { useIsMobile } from '../utils/composables'
import { processItem } from '../utils/email-parser'
import { utcToLocalDate } from '../utils';
import { buildReplyModel, buildForwardModel } from '../utils/mail-actions'
import MailContentRenderer from "./MailContentRenderer.vue";
import AiExtractInfo from "./AiExtractInfo.vue";
import { toast } from 'vue-sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'

const isMobile = useIsMobile()

const props = defineProps({
  enableUserDeleteEmail: {
    type: Boolean,
    default: false,
    required: false
  },
  showEMailTo: {
    type: Boolean,
    default: true,
    required: false
  },
  fetchMailData: {
    type: Function,
    default: () => { },
    required: true
  },
  deleteMail: {
    type: Function,
    default: () => { },
    required: false
  },
  showReply: {
    type: Boolean,
    default: false,
    required: false
  },
  showSaveS3: {
    type: Boolean,
    default: false,
    required: false
  },
  saveToS3: {
    type: Function,
    default: (mail_id, filename, blob) => { },
    required: false
  },
  showFilterInput: {
    type: Boolean,
    default: false,
    required: false
  },
})

const localFilterKeyword = ref('')

const {
  isDark, mailboxSplitSize, mailListView, mailListPreviewLineClamp, indexTab, loading, useUTCDate,
  autoRefresh, configAutoRefreshInterval, sendMailModel
} = useGlobalState()
const autoRefreshInterval = ref(configAutoRefreshInterval.value)
const rawData = ref([])
const timer = ref(null)

const count = ref(0)
const page = ref(1)
const pageSize = ref(20)

const mailListPreviewLineClampValue = computed(() => {
  const value = Number(mailListPreviewLineClamp.value)
  if (!Number.isFinite(value)) return 0
  return Math.min(5, Math.max(0, Math.round(value)))
})

// Computed property for filtered data (only filter current page)
const data = computed(() => {
  if (!localFilterKeyword.value || localFilterKeyword.value.trim() === '') {
    return rawData.value;
  }
  const keyword = localFilterKeyword.value.toLowerCase();
  return rawData.value.filter(mail => {
    // Search in subject, text, message fields
    const searchFields = [
      mail.subject || '',
      mail.text || '',
      mail.message || ''
    ].map(field => field.toLowerCase());
    return searchFields.some(field => field.includes(keyword));
  });
})

const canGoPrevMail = computed(() => {
  if (!curMail.value) return false
  const currentIndex = data.value.findIndex(mail => mail.id === curMail.value.id)
  return currentIndex > 0 || page.value > 1
})

const canGoNextMail = computed(() => {
  if (!curMail.value) return false
  const currentIndex = data.value.findIndex(mail => mail.id === curMail.value.id)
  return currentIndex < data.value.length - 1 || count.value > page.value * pageSize.value
})

const prevMail = async () => {
  if (!canGoPrevMail.value) return
  const currentIndex = data.value.findIndex(mail => mail.id === curMail.value.id)

  if (currentIndex > 0) {
    curMail.value = data.value[currentIndex - 1]
  } else if (page.value > 1) {
    page.value--
    await refresh()
    if (data.value.length > 0) {
      curMail.value = data.value[data.value.length - 1]
    }
  }
}

const nextMail = async () => {
  if (!canGoNextMail.value) return
  const currentIndex = data.value.findIndex(mail => mail.id === curMail.value.id)

  if (currentIndex < data.value.length - 1) {
    curMail.value = data.value[currentIndex + 1]
  } else if (count.value > page.value * pageSize.value) {
    page.value++
    await refresh()
    if (data.value.length > 0) {
      curMail.value = data.value[0]
    }
  }
}

const curMail = ref(null);

const multiActionMode = ref(false)
const showMultiActionDownload = ref(false)
const showMultiActionDelete = ref(false)
const multiActionDownloadZip = ref({ url: '', filename: '' })
const multiActionDeleteProgress = ref({ percentage: 0, tip: '0/0' })

const { t } = useScopedI18n('components.MailBox')

const setupAutoRefresh = async (autoRefresh) => {
  autoRefreshInterval.value = configAutoRefreshInterval.value;
  if (autoRefresh) {
    clearInterval(timer.value);
    timer.value = setInterval(async () => {
      if (loading.value) return;
      autoRefreshInterval.value--;
      if (autoRefreshInterval.value <= 0) {
        autoRefreshInterval.value = configAutoRefreshInterval.value;
        await backFirstPageAndRefresh();
      }
    }, 1000)
  } else {
    clearInterval(timer.value)
    timer.value = null
  }
}

watch(autoRefresh, async (autoRefresh) => {
  setupAutoRefresh(autoRefresh)
}, { immediate: true })

watch([page, pageSize], async ([page, pageSize], [oldPage, oldPageSize]) => {
  if (page !== oldPage || pageSize !== oldPageSize) {
    await refresh();
  }
})

const refresh = async () => {
  try {
    const { results, count: totalCount } = await props.fetchMailData(
      pageSize.value, (page.value - 1) * pageSize.value
    );
    loading.value = true;
    rawData.value = await Promise.all(results.map(async (item) => {
      item.checked = false;
      return await processItem(item);
    }));
    if (totalCount > 0) {
      count.value = totalCount;
    }
    curMail.value = null;
    if (!isMobile.value && !mailListView.value && data.value.length > 0) {
      curMail.value = data.value[0];
    }
  } catch (error) {
    toast.error(error.message || "error");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const backFirstPageAndRefresh = async () => {
  page.value = 1;
  await refresh();
}

const clickRow = async (row) => {
  if (multiActionMode.value) {
    row.checked = !row.checked;
    curMail.value = row;
    return;
  }
  if (mailListView.value && curMail.value?.id === row.id) {
    curMail.value = null;
    return;
  }
  curMail.value = row;
};

const deleteMail = async () => {
  try {
    await props.deleteMail(curMail.value.id);
    toast.success(t("success"));
    curMail.value = null;
    await refresh();
  } catch (error) {
    toast.error(error.message || "error");
  }
};

const replyMail = async () => {
  Object.assign(sendMailModel.value, buildReplyModel(curMail.value, t('reply')));
  indexTab.value = 'sendmail';
};

const forwardMail = async () => {
  Object.assign(sendMailModel.value, buildForwardModel(curMail.value, t('forwardMail')));
  indexTab.value = 'sendmail';
};

const saveToS3Proxy = async (filename, blob) => {
  await props.saveToS3(curMail.value.id, filename, blob);
}

const multiActionModeClick = (enableMulti) => {
  if (enableMulti) {
    data.value.forEach((item) => {
      item.checked = false;
    });
    multiActionMode.value = true;
  } else {
    multiActionMode.value = false;
    data.value.forEach((item) => {
      item.checked = false;
    });
  }
}

const multiActionSelectAll = (checked) => {
  data.value.forEach((item) => {
    item.checked = checked;
  });
}

const multiActionDeleteMail = async () => {
  try {
    loading.value = true;
    const selectedMails = data.value.filter((item) => item.checked);
    if (selectedMails.length === 0) {
      toast.error(t('pleaseSelectMail'));
      return;
    }
    multiActionDeleteProgress.value = {
      percentage: 0,
      tip: `0/${selectedMails.length}`
    };
    for (const [index, mail] of selectedMails.entries()) {
      await props.deleteMail(mail.id);
      showMultiActionDelete.value = true;
      multiActionDeleteProgress.value = {
        percentage: Math.floor((index + 1) / selectedMails.length * 100),
        tip: `${index + 1}/${selectedMails.length}`
      };
    }
    toast.success(t("success"));
    await refresh();
  } catch (error) {
    toast.error(error.message || "error");
  } finally {
    loading.value = false;
    showMultiActionDelete.value = false;
  }
}

const multiActionDownload = async () => {
  try {
    loading.value = true;
    const selectedMails = data.value.filter((item) => item.checked);
    if (selectedMails.length === 0) {
      toast.error(t('pleaseSelectMail'));
      return;
    }
    const JSZipModule = await import('jszip');
    const JSZip = JSZipModule.default;
    const zip = new JSZip();
    for (const mail of selectedMails) {
      zip.file(`${mail.id}.eml`, mail.raw);
    }
    multiActionDownloadZip.value = {
      url: URL.createObjectURL(await zip.generateAsync({ type: "blob" })),
      filename: `mails-${new Date().toISOString().replace(/:/g, '-')}.zip`
    }
    showMultiActionDownload.value = true;
  } catch (error) {
    toast.error(error.message || "error");
  } finally {
    loading.value = false;
  }
}

const totalPages = computed(() => Math.ceil(count.value / pageSize.value) || 1)

onMounted(async () => {
  await refresh();
});

onBeforeUnmount(() => {
  clearInterval(timer.value)
})
</script>

<template>
  <div class="space-y-4">
    <!-- Action / Pagination Header -->
    <div class="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/40 p-4 border border-zinc-800 rounded-xl">
      <!-- Left: Bulk actions -->
      <div v-if="multiActionMode" class="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" @click="multiActionModeClick(false)" class="border-zinc-800 bg-zinc-950">
          {{ t('cancelMultiAction') }}
        </Button>
        <Button size="sm" variant="outline" @click="multiActionSelectAll(true)" class="border-zinc-800 bg-zinc-950">
          {{ t('selectAll') }}
        </Button>
        <Button size="sm" variant="outline" @click="multiActionSelectAll(false)" class="border-zinc-800 bg-zinc-950">
          {{ t('unselectAll') }}
        </Button>
        <Button 
          v-if="enableUserDeleteEmail" 
          size="sm" 
          variant="destructive" 
          @click="multiActionDeleteMail"
          class="font-semibold"
        >
          {{ t('delete') }}
        </Button>
        <Button size="sm" variant="secondary" @click="multiActionDownload" class="gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200">
          <Download class="h-4 w-4" />
          <span>{{ t('downloadMail') }}</span>
        </Button>
      </div>

      <!-- Left: Normal actions -->
      <div v-else class="flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" @click="multiActionModeClick(true)" class="border-zinc-800 bg-zinc-950">
          {{ t('multiAction') }}
        </Button>

        <!-- Custom Pagination -->
        <div class="flex items-center gap-2 text-xs">
          <Button 
            size="icon" 
            variant="outline" 
            :disabled="page <= 1" 
            @click="page--"
            class="h-8 w-8 border-zinc-800 bg-zinc-950"
          >
            <ArrowLeft class="h-4.5 w-4.5" />
          </Button>
          <span class="text-zinc-400 font-medium px-1">{{ page }} / {{ totalPages }}</span>
          <Button 
            size="icon" 
            variant="outline" 
            :disabled="page >= totalPages" 
            @click="page++"
            class="h-8 w-8 border-zinc-800 bg-zinc-950"
          >
            <ArrowRight class="h-4.5 w-4.5" />
          </Button>

          <!-- Page size selector -->
          <Select :model-value="String(pageSize)" @update:modelValue="(val) => pageSize = Number(val)">
            <SelectTrigger class="h-8 w-[76px] bg-zinc-950 border-zinc-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent class="bg-zinc-900 border-zinc-800 text-zinc-300">
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <!-- Auto refresh control -->
        <div class="flex items-center gap-2 border border-zinc-800 bg-zinc-950 rounded-lg px-3 py-1 text-xs">
          <span class="text-zinc-400 font-medium select-none">
            {{ autoRefresh ? t('refreshAfter', { msg: autoRefreshInterval }) : t('autoRefresh') }}
          </span>
          <Switch 
            :checked="autoRefresh" 
            @update:checked="(val) => autoRefresh.value = val" 
            class="scale-90"
          />
        </div>

        <Button size="sm" @click="backFirstPageAndRefresh" class="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          <span>{{ t('refresh') }}</span>
        </Button>
      </div>

      <!-- Right: Search Input -->
      <div v-if="showFilterInput" class="relative w-full sm:w-48">
        <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500" />
        <Input 
          v-model="localFilterKeyword" 
          :placeholder="t('keywordQueryTip')" 
          class="h-8 pl-8 border-zinc-800 bg-zinc-950 text-white placeholder-zinc-500 text-xs" 
        />
      </div>
    </div>

    <!-- Main View layout -->
    <div v-if="!isMobile">
      <!-- Desktop View (Split Screen) -->
      <div class="grid grid-cols-12 border border-zinc-800 rounded-xl bg-card overflow-hidden min-h-[60vh] max-h-[75vh]">
        <!-- Left: Mail List (4 columns) -->
        <div role="list" class="col-span-4 border-r border-zinc-800 flex flex-col overflow-y-auto divide-y divide-zinc-800 bg-zinc-950/20">
          <div v-if="data.length === 0" class="flex flex-col items-center justify-center p-12 text-zinc-500 gap-3">
            <Inbox class="h-10 w-10 text-zinc-700" />
            <span class="text-xs">{{ t('emptyInbox') }}</span>
          </div>

          <div 
            v-else
            v-for="row in data" 
            :key="row.id" 
            role="listitem"
            @click="clickRow(row)"
            class="p-4 cursor-pointer text-left transition-colors relative flex items-start gap-3 border-l-2"
            :class="[
              curMail?.id === row.id ? 'bg-zinc-800/40 border-emerald-500' : 'hover:bg-zinc-900/40 border-transparent',
              !row.isRead ? 'font-semibold' : ''
            ]"
          >
            <!-- Multi-action checkbox -->
            <div v-if="multiActionMode" @click.stop class="pt-0.5 shrink-0">
              <Checkbox :checked="row.checked" @update:checked="(val) => row.checked = val" />
            </div>

            <!-- Content preview summary -->
            <div class="space-y-1.5 flex-1 min-w-0">
              <div class="flex items-center justify-between text-xs">
                <span class="text-zinc-300 font-semibold truncate">{{ showEMailTo ? "FROM: " + row.source : row.source }}</span>
                <span class="text-zinc-500 text-[10px] shrink-0 font-mono">{{ utcToLocalDate(row.created_at, useUTCDate) }}</span>
              </div>
              
              <h5 class="text-xs text-white truncate">{{ row.subject }}</h5>
              
              <div v-if="showEMailTo" class="text-[10px] text-zinc-500 truncate">
                TO: {{ row.address }}
              </div>
              
              <!-- AI Extraction mini Badge -->
              <AiExtractInfo :metadata="row.metadata" compact />
            </div>
          </div>
        </div>

        <!-- Right: Active Email display (8 columns) -->
        <div class="col-span-8 flex flex-col overflow-y-auto bg-zinc-950/10 p-6 min-h-[60vh]">
          <div v-if="curMail" class="space-y-4">
            <div class="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div class="flex gap-2">
                <Button size="xs" variant="ghost" :disabled="!canGoPrevMail" @click="prevMail" class="text-zinc-400 hover:text-white">
                  <ArrowLeft class="h-4 w-4 mr-1" /> {{ t('prevMail') }}
                </Button>
                <Button size="xs" variant="ghost" :disabled="!canGoNextMail" @click="nextMail" class="text-zinc-400 hover:text-white">
                  {{ t('nextMail') }} <ArrowRight class="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>

            <MailContentRenderer 
              :mail="curMail" 
              :showEMailTo="showEMailTo"
              :enableUserDeleteEmail="enableUserDeleteEmail" 
              :showReply="showReply" 
              :showSaveS3="showSaveS3"
              :onDelete="deleteMail" 
              :onReply="replyMail" 
              :onForward="forwardMail" 
              :onSaveToS3="saveToS3Proxy" 
            />
          </div>

          <div v-else class="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-3 py-16">
            <Inbox class="h-12 w-12 text-zinc-700" />
            <h5 class="text-sm font-semibold text-zinc-350">{{ count === 0 ? t('emptyInbox') : t('pleaseSelectMail') }}</h5>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile View (Full Screen Toggle or Sheet Drawer) -->
    <div v-else class="space-y-2">
      <!-- List for mobile -->
      <div role="list" class="border border-zinc-800 rounded-xl bg-card overflow-hidden divide-y divide-zinc-800">
        <div v-if="data.length === 0" class="flex flex-col items-center justify-center p-12 text-zinc-500 gap-3">
          <Inbox class="h-10 w-10 text-zinc-700" />
          <span class="text-xs">{{ t('emptyInbox') }}</span>
        </div>

        <div 
          v-else
          v-for="row in data" 
          :key="row.id" 
          role="listitem"
          @click="clickRow(row)"
          class="p-4 cursor-pointer text-left transition-colors flex items-start justify-between gap-3 hover:bg-zinc-900/20"
        >
          <div class="space-y-1 min-w-0 flex-1">
            <h5 class="text-xs text-white font-semibold truncate">{{ row.subject }}</h5>
            <p class="text-[11px] text-zinc-400 truncate">{{ showEMailTo ? "FROM: " + row.source : row.source }}</p>
            <div class="flex items-center gap-1.5 flex-wrap pt-1 text-[10px] text-zinc-500">
              <span class="font-mono">ID: {{ row.id }}</span>
              <span>•</span>
              <span>{{ utcToLocalDate(row.created_at, useUTCDate) }}</span>
            </div>
            <AiExtractInfo :metadata="row.metadata" compact />
          </div>
          <ChevronRight class="h-4 w-4 text-zinc-600 shrink-0 self-center" />
        </div>
      </div>

      <!-- Mobile Mail Detail Sheet -->
      <Sheet :open="!!curMail" @update:open="(val) => { if (!val) curMail = null }">
        <SheetContent side="bottom" class="h-[85vh] bg-zinc-950 border-zinc-850 text-white p-4 overflow-y-auto rounded-t-2xl">
          <SheetHeader class="text-left border-b border-zinc-800 pb-3 mb-4">
            <SheetTitle class="text-white text-sm truncate pr-6">{{ curMail ? curMail.subject : '' }}</SheetTitle>
          </SheetHeader>
          
          <MailContentRenderer 
            v-if="curMail"
            :mail="curMail" 
            :showEMailTo="showEMailTo"
            :enableUserDeleteEmail="enableUserDeleteEmail" 
            :showReply="showReply" 
            :showSaveS3="showSaveS3"
            :useUTCDate="useUTCDate" 
            :onDelete="deleteMail" 
            :onReply="replyMail" 
            :onForward="forwardMail"
            :onSaveToS3="saveToS3Proxy" 
          />
        </SheetContent>
      </Sheet>
    </div>

    <!-- Zip Download Modal -->
    <Dialog v-model:open="showMultiActionDownload">
      <DialogContent class="sm:max-w-md border-zinc-800 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold text-white">{{ t('downloadMail') }}</DialogTitle>
          <DialogDescription class="text-xs text-zinc-400">
            Click download to fetch the generated ZIP archive of your selected emails.
          </DialogDescription>
        </DialogHeader>
        <div class="py-4 space-y-3">
          <div class="bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-lg text-xs font-mono text-zinc-300">
            {{ multiActionDownloadZip.filename }}
          </div>
        </div>
        <DialogFooter>
          <Button as-child class="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold w-full">
            <a 
              :href="multiActionDownloadZip.url" 
              :download="multiActionDownloadZip.filename"
              target="_blank"
            >
              <Download class="h-4 w-4 mr-1.5 inline" />
              {{ t('downloadMail') }} ZIP
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Delete Progress Modal -->
    <Dialog v-model:open="showMultiActionDelete">
      <DialogContent class="sm:max-w-sm border-zinc-800 bg-zinc-950 text-white" :closable="false">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold text-white">{{ t('delete') }} progress</DialogTitle>
        </DialogHeader>
        <div class="py-6 flex flex-col items-center justify-center gap-4">
          <div class="relative flex items-center justify-center">
            <!-- Progress Spinner -->
            <Loader2 class="h-16 w-16 animate-spin text-red-500" />
            <span class="absolute text-xs font-bold text-zinc-300">{{ multiActionDeleteProgress.percentage }}%</span>
          </div>
          <span class="text-xs text-zinc-400">{{ multiActionDeleteProgress.tip }}</span>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
/* Scoped adjustments */
</style>
