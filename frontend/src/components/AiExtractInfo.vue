<script setup>
import { computed } from 'vue';
import { useScopedI18n } from '@/i18n/app';
import { Copy, Link, Code, ExternalLink } from 'lucide-vue-next';
import { toast } from 'vue-sonner';
import { useGlobalState } from '../store';
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const { isDark } = useGlobalState();
const { t } = useScopedI18n('components.AiExtractInfo')

const props = defineProps({
  metadata: {
    type: String,
    default: null
  },
  compact: {
    type: Boolean,
    default: false
  }
});

const aiExtract = computed(() => {
  if (!props.metadata) return null;
  try {
    const data = JSON.parse(props.metadata);
    return data.ai_extract || null;
  } catch (e) {
    return null;
  }
});

const typeLabel = computed(() => {
  if (!aiExtract.value) return '';
  const typeMap = {
    auth_code: t('authCode'),
    auth_link: t('authLink'),
    service_link: t('serviceLink'),
    subscription_link: t('subscriptionLink'),
    other_link: t('otherLink'),
  };
  return typeMap[aiExtract.value.type] || '';
});

const typeIcon = computed(() => {
  if (!aiExtract.value) return null;
  return aiExtract.value.type === 'auth_code' ? Code : Link;
});

const isLink = computed(() => {
  return aiExtract.value && aiExtract.value.type !== 'auth_code';
});

const displayText = computed(() => {
  if (!aiExtract.value) return '';
  // For auth_code, always show the raw result (verification code)
  if (aiExtract.value.type === 'auth_code') {
    return aiExtract.value.result;
  }
  // For links, prefer result_text as display label
  return aiExtract.value.result_text || aiExtract.value.result;
});

const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(aiExtract.value.result);
    toast.success(t('copySuccess'));
  } catch (e) {
    toast.error(t('copyFailed'));
  }
};

const openLink = () => {
  if (isLink.value && aiExtract.value.result) {
    window.open(aiExtract.value.result, '_blank');
  }
};
</script>

<template>
  <div v-if="aiExtract && aiExtract.result" class="mb-3">
    <!-- Non-compact mode: Alert block -->
    <div 
      v-if="!compact" 
      class="flex flex-col gap-3 rounded-lg border border-sky-500/20 bg-sky-950/20 p-4 text-sky-200"
    >
      <div class="flex items-center gap-2 font-semibold text-sm">
        <component :is="typeIcon" class="h-4 w-4 text-sky-400" />
        <span>{{ typeLabel }}</span>
      </div>
      
      <div class="flex flex-wrap items-center gap-3">
        <span 
          v-if="aiExtract.type === 'auth_code'" 
          class="text-lg font-mono font-bold tracking-wider text-emerald-400 select-all"
        >
          {{ aiExtract.result }}
        </span>
        <span v-else class="text-xs text-zinc-300 max-w-[320px] truncate">
          {{ displayText }}
        </span>
        
        <div class="flex items-center gap-2">
          <Button 
            size="xs" 
            variant="outline" 
            @click="copyToClipboard" 
            class="h-7 w-7 p-0 border-sky-500/20 text-sky-400 hover:bg-sky-500/10"
            title="Copy"
          >
            <Copy class="h-3.5 w-3.5" />
          </Button>
          
          <Button 
            v-if="isLink" 
            size="xs" 
            @click="openLink" 
            class="h-7 bg-sky-500 hover:bg-sky-600 text-white font-medium"
          >
            {{ t('open') }}
          </Button>
        </div>
      </div>
    </div>

    <!-- Compact mode: Badge -->
    <div 
      v-else 
      @click="copyToClipboard" 
      class="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-950/40 hover:bg-sky-950/60 px-3 py-1 text-xs text-sky-300 font-medium cursor-pointer transition-all active:scale-95 select-none"
    >
      <component :is="typeIcon" class="h-3.5 w-3.5 text-sky-400" />
      <span class="max-w-[150px] truncate">
        {{ typeLabel }}: {{ displayText }}
      </span>
    </div>
  </div>
</template>

<style scoped>
/* Scoped adjustments */
</style>
