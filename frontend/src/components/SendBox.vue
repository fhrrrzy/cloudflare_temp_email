<script setup>
import { watch, onMounted, ref, computed } from "vue";
import { useScopedI18n } from '@/i18n/app'
import { useGlobalState } from '../store'
import { useIsMobile } from '../utils/composables'
import { utcToLocalDate } from '../utils';
import { 
  Send, Trash2, ArrowLeft, ArrowRight, RefreshCw, 
  Code, Eye, EyeOff, ChevronRight, Inbox, Loader2 
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
  showEMailFrom: {
    type: Boolean,
    default: false
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
})

const { isDark, mailboxSplitSize, loading, useUTCDate } = useGlobalState()
const data = ref([])

const count = ref(0)
const page = ref(1)
const pageSize = ref(20)

const curMail = ref(null);
const showCode = ref(false)

const multiActionMode = ref(false)
const showMultiActionDelete = ref(false)
const multiActionDeleteProgress = ref({ percentage: 0, tip: '0/0' })

const { t } = useScopedI18n('components.SendBox')

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
    data.value = results.map((item) => {
      try {
        const dataJson = JSON.parse(item.raw);
        if (dataJson.version == "v2") {
          item.to_mail = dataJson.to_name ? `${dataJson.to_name} <${dataJson.to_mail}>` : dataJson.to_mail;
          item.subject = dataJson.subject;
          item.is_html = dataJson.is_html;
          item.content = dataJson.content;
          item.raw = JSON.stringify(dataJson, null, 2);
        } else {
          item.to_mail = dataJson?.personalizations?.map(
            (p) => p.to?.map((t) => t.email).join(',')
          ).join(';');
          item.subject = dataJson.subject;
          item.is_html = (dataJson.content[0]?.type != 'text/plain');
          item.content = dataJson.content[0]?.value;
          item.raw = JSON.stringify(dataJson, null, 2);
        }
      } catch (error) {
        console.log(error);
      }
      return item;
    });
    if (totalCount > 0) {
      count.value = totalCount;
    }
    if (!isMobile.value && !curMail.value && data.value.length > 0) {
      curMail.value = data.value[0];
    }
  } catch (error) {
    toast.error(error.message || "error");
    console.error(error);
  }
};

const clickRow = async (row) => {
  if (multiActionMode.value) {
    row.checked = !row.checked;
    curMail.value = row;
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

const showMultiActionMode = computed(() => {
  return props.enableUserDeleteEmail;
});

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

const totalPages = computed(() => Math.ceil(count.value / pageSize.value) || 1)

onMounted(async () => {
  await refresh();
});
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
      </div>

      <!-- Left: Normal actions -->
      <div v-else class="flex flex-wrap items-center gap-2">
        <Button v-if="showMultiActionMode" size="sm" variant="outline" @click="multiActionModeClick(true)" class="border-zinc-800 bg-zinc-950">
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

        <Button size="sm" @click="refresh" class="gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
          <span>{{ t('refresh') }}</span>
        </Button>
      </div>
    </div>

    <!-- Main View layout -->
    <div v-if="!isMobile">
      <!-- Desktop View (Split Screen) -->
      <div class="grid grid-cols-12 border border-zinc-800 rounded-xl bg-card overflow-hidden min-h-[60vh] max-h-[75vh]">
        <!-- Left: Sent Mail List (4 columns) -->
        <div role="list" class="col-span-4 border-r border-zinc-800 flex flex-col overflow-y-auto divide-y divide-zinc-800 bg-zinc-950/20">
          <div v-if="data.length === 0" class="flex flex-col items-center justify-center p-12 text-zinc-500 gap-3">
            <Inbox class="h-10 w-10 text-zinc-700" />
            <span class="text-xs">{{ t('emptySent') }}</span>
          </div>

          <div 
            v-else
            v-for="row in data" 
            :key="row.id" 
            role="listitem"
            @click="clickRow(row)"
            class="p-4 cursor-pointer text-left transition-colors relative flex items-start gap-3 border-l-2"
            :class="curMail?.id === row.id ? 'bg-zinc-800/40 border-emerald-500' : 'hover:bg-zinc-900/40 border-transparent'"
          >
            <!-- Multi-action checkbox -->
            <div v-if="multiActionMode" @click.stop class="pt-0.5 shrink-0">
              <Checkbox :checked="row.checked" @update:checked="(val) => row.checked = val" />
            </div>

            <div class="space-y-1 flex-1 min-w-0">
              <div class="flex items-center justify-between text-xs">
                <span class="text-zinc-300 font-semibold truncate">TO: {{ row.to_mail }}</span>
                <span class="text-zinc-500 text-[10px] shrink-0 font-mono">{{ utcToLocalDate(row.created_at, useUTCDate) }}</span>
              </div>
              <h5 class="text-xs text-white truncate">{{ row.subject }}</h5>
              <div class="flex items-center gap-1.5 text-[10px] text-zinc-500">
                <span class="font-mono">ID: {{ row.id }}</span>
                <span v-if="showEMailFrom">•</span>
                <span v-if="showEMailFrom" class="truncate">FROM: {{ row.address }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Active Email display (8 columns) -->
        <div class="col-span-8 flex flex-col overflow-y-auto bg-zinc-950/10 p-6 min-h-[60vh] text-left">
          <div v-if="curMail" class="space-y-4">
            <!-- Headers and actions -->
            <div class="border-b border-zinc-800 pb-4 space-y-4">
              <h3 class="text-lg font-bold text-white">{{ curMail.subject }}</h3>
              
              <div class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex flex-wrap gap-2">
                  <Badge variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-350">ID: {{ curMail.id }}</Badge>
                  <Badge variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-350">{{ utcToLocalDate(curMail.created_at, useUTCDate) }}</Badge>
                  <Badge variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-350">FROM: {{ curMail.address }}</Badge>
                  <Badge variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-350">TO: {{ curMail.to_mail }}</Badge>
                </div>

                <div class="flex items-center gap-2">
                  <Button size="xs" variant="outline" @click="showCode = !showCode" class="border-zinc-800 text-zinc-300">
                    <Code class="h-3.5 w-3.5 mr-1" />
                    <span>{{ t('showCode') }}</span>
                  </Button>
                  
                  <Button 
                    v-if="enableUserDeleteEmail" 
                    size="xs" 
                    variant="destructive" 
                    @click="deleteMail"
                    class="font-semibold"
                  >
                    <Trash2 class="h-3.5 w-3.5 mr-1" />
                    <span>{{ t('delete') }}</span>
                  </Button>
                </div>
              </div>
            </div>

            <!-- Email Body Content -->
            <div class="pt-2">
              <pre v-if="showCode" class="text-xs font-mono text-zinc-350 bg-zinc-950 p-4 rounded-lg border border-zinc-800 overflow-x-auto whitespace-pre-wrap">{{ curMail.raw }}</pre>
              <pre v-else-if="!curMail.is_html" class="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{{ curMail.content }}</pre>
              <div v-else class="bg-zinc-950 p-4 border border-zinc-850 rounded-lg overflow-x-auto">
                <div v-html="curMail.content"></div>
              </div>
            </div>
          </div>

          <div v-else class="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-3 py-16">
            <Inbox class="h-12 w-12 text-zinc-700" />
            <h5 class="text-sm font-semibold text-zinc-350">{{ count === 0 ? t('emptySent') : t('pleaseSelectMail') }}</h5>
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
          <span class="text-xs">{{ t('emptySent') }}</span>
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
            <p class="text-[11px] text-zinc-400 truncate">TO: {{ row.to_mail }}</p>
            <div class="flex items-center gap-1.5 flex-wrap pt-1 text-[10px] text-zinc-500">
              <span class="font-mono">ID: {{ row.id }}</span>
              <span>•</span>
              <span>{{ utcToLocalDate(row.created_at, useUTCDate) }}</span>
            </div>
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
          
          <div v-if="curMail" class="space-y-4 text-left">
            <div class="flex flex-wrap gap-2">
              <Badge variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-350">ID: {{ curMail.id }}</Badge>
              <Badge variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-350">{{ utcToLocalDate(curMail.created_at, useUTCDate) }}</Badge>
              <Badge variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-350">FROM: {{ curMail.address }}</Badge>
              <Badge variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-350">TO: {{ curMail.to_mail }}</Badge>
            </div>
            
            <div class="flex gap-2">
              <Button size="xs" variant="outline" @click="showCode = !showCode" class="border-zinc-800 text-zinc-300">
                <Code class="h-3.5 w-3.5 mr-1" />
                <span>{{ t('showCode') }}</span>
              </Button>
              
              <Button 
                v-if="enableUserDeleteEmail" 
                size="xs" 
                variant="destructive" 
                @click="deleteMail"
                class="font-semibold"
              >
                <Trash2 class="h-3.5 w-3.5 mr-1" />
                <span>{{ t('delete') }}</span>
              </Button>
            </div>

            <div class="pt-2">
              <pre v-if="showCode" class="text-xs font-mono text-zinc-350 bg-zinc-950 p-4 rounded-lg border border-zinc-800 overflow-x-auto whitespace-pre-wrap">{{ curMail.raw }}</pre>
              <pre v-else-if="!curMail.is_html" class="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed">{{ curMail.content }}</pre>
              <div v-else class="bg-zinc-950 p-4 border border-zinc-850 rounded-lg overflow-x-auto">
                <div v-html="curMail.content"></div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>

    <!-- Delete Progress Modal -->
    <Dialog v-model:open="showMultiActionDelete">
      <DialogContent class="sm:max-w-sm border-zinc-800 bg-zinc-950 text-white" :closable="false">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold text-white">{{ t('delete') }} progress</DialogTitle>
        </DialogHeader>
        <div class="py-6 flex flex-col items-center justify-center gap-4">
          <div class="relative flex items-center justify-center">
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
