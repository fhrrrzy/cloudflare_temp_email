<script setup>
import { ref } from "vue";
import { useScopedI18n } from '@/i18n/app'
import { 
  Download, CornerUpLeft, CornerUpRight, Maximize2, Paperclip, 
  Trash2, Eye, EyeOff, Loader2 
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import ShadowHtmlComponent from "./ShadowHtmlComponent.vue";
import AiExtractInfo from "./AiExtractInfo.vue";
import { getDownloadEmlUrl } from '../utils/email-parser';
import { utcToLocalDate } from '../utils';
import { useGlobalState } from '../store';

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'

const { preferShowTextMail, useIframeShowMail, useUTCDate, isDark } = useGlobalState();
const { t } = useScopedI18n('components.MailContentRenderer')

const props = defineProps({
  mail: {
    type: Object,
    required: true
  },
  showEMailTo: {
    type: Boolean,
    default: true
  },
  enableUserDeleteEmail: {
    type: Boolean,
    default: false
  },
  showReply: {
    type: Boolean,
    default: false
  },
  showSaveS3: {
    type: Boolean,
    default: false
  },
  onDelete: {
    type: Function,
    default: () => { }
  },
  onReply: {
    type: Function,
    default: () => { }
  },
  onForward: {
    type: Function,
    default: () => { }
  },
  onSaveToS3: {
    type: Function,
    default: () => { }
  }
});

const showTextMail = ref(preferShowTextMail.value);
const showAttachments = ref(false);
const curAttachments = ref([]);
const attachmentLoading = ref(false);
const showFullscreen = ref(false);

const handleDelete = () => {
  if (confirm(t('deleteMailTip'))) {
    props.onDelete();
  }
};

const handleViewAttachments = () => {
  curAttachments.value = props.mail.attachments;
  showAttachments.value = true;
};

const handleReply = () => {
  props.onReply();
};

const handleForward = () => {
  props.onForward();
};

const handleSaveToS3 = async (filename, blob) => {
  attachmentLoading.value = true;
  try {
    await props.onSaveToS3(filename, blob);
    toast.success(t('success'));
  } catch (error) {
    toast.error(error.message || "error");
  } finally {
    attachmentLoading.value = false;
  }
};
</script>

<template>
  <div class="space-y-4">
    <!-- Email Info Badges & Action Buttons -->
    <div class="flex flex-wrap items-center justify-between gap-3 bg-zinc-950/40 p-4 border border-zinc-800 rounded-xl">
      <!-- Info Badges -->
      <div class="flex flex-wrap gap-2 text-xs">
        <Badge variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-350 font-mono">ID: {{ mail.id }}</Badge>
        <Badge variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-350">{{ utcToLocalDate(mail.created_at, useUTCDate.value) }}</Badge>
        <Badge variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-350 truncate max-w-[200px]">FROM: {{ mail.source }}</Badge>
        <Badge v-if="showEMailTo" variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-350 truncate max-w-[200px]">TO: {{ mail.address }}</Badge>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap items-center gap-2">
        <!-- Text / HTML Toggle -->
        <Button 
          size="xs" 
          variant="outline" 
          @click="showTextMail = !showTextMail"
          class="border-zinc-800 text-zinc-300"
        >
          <component :is="showTextMail ? Eye : EyeOff" class="h-3.5 w-3.5 mr-1" />
          <span>{{ showTextMail ? t('showHtmlMail') : t('showTextMail') }}</span>
        </Button>

        <!-- Fullscreen -->
        <Button 
          size="xs" 
          variant="outline" 
          @click="showFullscreen = true"
          class="border-zinc-800 text-zinc-300"
        >
          <Maximize2 class="h-3.5 w-3.5 mr-1" />
          <span>{{ t('fullscreen') }}</span>
        </Button>

        <!-- EML Download -->
        <Button 
          as-child
          size="xs" 
          variant="outline" 
          class="border-zinc-800 text-zinc-300"
        >
          <a :href="getDownloadEmlUrl(mail.raw)" :download="mail.id + '.eml'">
            <Download class="h-3.5 w-3.5 mr-1" />
            <span>{{ t('downloadMail') }}</span>
          </a>
        </Button>

        <!-- Attachments indicator -->
        <Button 
          v-if="mail.attachments && mail.attachments.length > 0" 
          size="xs" 
          variant="outline" 
          @click="handleViewAttachments"
          class="border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
        >
          <Paperclip class="h-3.5 w-3.5 mr-1" />
          <span>{{ t('attachments') }} ({{ mail.attachments.length }})</span>
        </Button>

        <!-- Reply -->
        <Button 
          v-if="showReply" 
          size="xs" 
          variant="outline" 
          @click="handleReply"
          class="border-zinc-800 text-zinc-300"
        >
          <CornerUpLeft class="h-3.5 w-3.5 mr-1" />
          <span>{{ t('reply') }}</span>
        </Button>

        <!-- Forward -->
        <Button 
          v-if="showReply" 
          size="xs" 
          variant="outline" 
          @click="handleForward"
          class="border-zinc-800 text-zinc-300"
        >
          <CornerUpRight class="h-3.5 w-3.5 mr-1" />
          <span>{{ t('forward') }}</span>
        </Button>

        <!-- Delete -->
        <Button 
          v-if="enableUserDeleteEmail" 
          size="xs" 
          variant="destructive" 
          @click="handleDelete"
          class="font-semibold"
        >
          <Trash2 class="h-3.5 w-3.5 mr-1" />
          <span>{{ t('delete') }}</span>
        </Button>
      </div>
    </div>

    <!-- AI Extracted Metadata -->
    <AiExtractInfo :metadata="mail.metadata" />

    <!-- Email Rendered Body Content -->
    <div class="mail-content border border-zinc-800 rounded-xl overflow-hidden p-6 bg-zinc-950 text-left">
      <pre v-if="showTextMail" class="mail-text text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap font-sans">{{ mail.text }}</pre>
      
      <iframe v-else-if="useIframeShowMail" :srcdoc="mail.message" class="mail-iframe w-full min-h-[450px] border-none rounded bg-white"></iframe>
      
      <ShadowHtmlComponent v-else :key="mail.id" :htmlContent="mail.message" :isDark="isDark" class="mail-html w-full h-full" />
    </div>
  </div>

  <!-- Fullscreen Sheet -->
  <Sheet :open="showFullscreen" @update:open="(val) => showFullscreen = val">
    <SheetContent side="bottom" class="h-screen bg-zinc-950 border-zinc-850 text-white p-6 overflow-y-auto flex flex-col gap-4">
      <SheetHeader class="text-left border-b border-zinc-800 pb-3 flex flex-row items-center justify-between space-y-0">
        <SheetTitle class="text-white text-base truncate max-w-[80vw] pr-6">{{ mail.subject }}</SheetTitle>
        <Button variant="ghost" size="sm" @click="showFullscreen = false" class="text-zinc-400 hover:text-white shrink-0">
          Close
        </Button>
      </SheetHeader>
      
      <div class="flex-1 overflow-y-auto pt-2">
        <pre v-if="showTextMail" class="text-sm leading-relaxed text-zinc-200 whitespace-pre-wrap font-sans">{{ mail.text }}</pre>
        <iframe v-else-if="useIframeShowMail" :srcdoc="mail.message" class="w-full min-h-[75vh] border-none rounded bg-white"></iframe>
        <ShadowHtmlComponent v-else :key="mail.id" :htmlContent="mail.message" :isDark="isDark" class="w-full h-full" />
      </div>
    </SheetContent>
  </Sheet>

  <!-- Attachments Dialog -->
  <Dialog v-model:open="showAttachments">
    <DialogContent class="sm:max-w-xl border-zinc-800 bg-zinc-950 text-white max-h-[85vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="text-lg font-bold text-white">{{ t('attachments') }}</DialogTitle>
      </DialogHeader>

      <div class="py-4 space-y-3">
        <div v-if="attachmentLoading" class="flex flex-col items-center justify-center py-12 gap-3 text-zinc-400 text-xs">
          <Loader2 class="h-8 w-8 animate-spin text-emerald-400" />
          <span>Processing Attachment...</span>
        </div>

        <div v-else class="divide-y divide-zinc-850 border border-zinc-850 rounded-xl bg-zinc-900/10 overflow-hidden">
          <div 
            v-for="row in curAttachments" 
            :key="row.id"
            class="p-4 flex items-center justify-between gap-4 text-left hover:bg-zinc-900/20"
          >
            <div class="space-y-1 min-w-0 flex-1">
              <h5 class="text-xs text-white font-semibold truncate">{{ row.filename }}</h5>
              <Badge variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-450 font-mono text-[10px]">
                Size: {{ row.size }}
              </Badge>
            </div>
            
            <div class="flex items-center gap-2 shrink-0">
              <Button 
                v-if="showSaveS3" 
                size="xs" 
                variant="outline" 
                @click="handleSaveToS3(row.filename, row.blob)"
                class="border-zinc-800 text-zinc-300 font-semibold"
              >
                {{ t('saveToS3') }}
              </Button>
              
              <Button 
                as-child
                size="icon" 
                variant="outline" 
                class="h-8 w-8 border-zinc-800 bg-zinc-950 text-emerald-400 hover:text-emerald-300"
              >
                <a :href="row.url" :download="row.filename" target="_blank">
                  <Download class="h-4.5 w-4.5" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<style scoped>
/* No styles needed, pure Tailwind */
</style>
