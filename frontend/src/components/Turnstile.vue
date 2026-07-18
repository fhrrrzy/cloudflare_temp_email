<script setup>
import { ref, watch } from "vue";
import { useScopedI18n } from '@/i18n/app'
import { useGlobalState } from '../store'
import { getTurnstileLocale } from '../i18n/locale-registry'
import { DEFAULT_LOCALE, isSupportedLocale } from '../i18n/utils'
import { Loader2, RefreshCw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const { openSettings, isDark } = useGlobalState()

const cfToken = defineModel('value')

const { locale, t } = useScopedI18n('components.Turnstile')

const containerId = `cf-turnstile-${Math.random().toString(36).slice(2, 9)}`
const cfTurnstileId = ref("")
const turnstileLoading = ref(false)
let turnstileRenderQueue = Promise.resolve()

const refresh = () => rerenderTurnstile()
defineExpose({ refresh })

const rerenderTurnstile = () => {
  cfToken.value = "";
  turnstileRenderQueue = turnstileRenderQueue
    .catch(() => { })
    .then(() => checkCfTurnstile(true))
  turnstileRenderQueue.catch(() => { })
  return turnstileRenderQueue
}

const checkCfTurnstile = async (remove) => {
  if (!openSettings.value.cfTurnstileSiteKey) return;
  turnstileLoading.value = true;
  try {
    let container = document.getElementById(containerId);
    let count = 100;
    while (!container && count-- > 0) {
      container = document.getElementById(containerId);
      await new Promise(r => setTimeout(r, 10));
    }
    count = 100;
    while (!window.turnstile && count-- > 0) {
      await new Promise(r => setTimeout(r, 10));
    }
    if (remove && cfTurnstileId.value) {
      window.turnstile.remove(cfTurnstileId.value);
    }
    cfTurnstileId.value = window.turnstile.render(
      `#${containerId}`,
      {
        sitekey: openSettings.value.cfTurnstileSiteKey,
        language: getTurnstileLocale(isSupportedLocale(locale.value) ? locale.value : DEFAULT_LOCALE),
        theme: isDark.value ? 'dark' : 'light',
        callback: function (token) {
          cfToken.value = token;
        },
      }
    );
  } finally {
    turnstileLoading.value = false;
  }
}

watch([isDark, locale, () => openSettings.value.cfTurnstileSiteKey], rerenderTurnstile, { immediate: true })
</script>

<template>
  <div v-if="openSettings.cfTurnstileSiteKey" class="flex flex-col gap-2 p-2 bg-zinc-950/20 border border-zinc-850 rounded-lg max-w-sm">
    <div class="relative flex items-center justify-center min-h-[74px]">
      <!-- Spinner -->
      <div v-if="turnstileLoading" class="absolute inset-0 flex items-center justify-center bg-zinc-950/45 z-10 gap-2 text-xs text-zinc-400">
        <Loader2 class="h-4 w-4 animate-spin text-emerald-400" />
        <span>Loading captcha...</span>
      </div>
      
      <!-- Container -->
      <div :id="containerId" class="mx-auto"></div>
    </div>
    
    <div class="flex justify-end pr-2">
      <Button 
        type="button"
        variant="ghost" 
        size="xs" 
        @click="rerenderTurnstile"
        class="h-6 text-[10px] text-zinc-400 hover:text-white font-medium gap-1 px-2"
      >
        <RefreshCw class="h-3 w-3" />
        <span>{{ t('refresh') }}</span>
      </Button>
    </div>
  </div>
</template>

<style scoped>
/* No styles needed, pure Tailwind */
</style>
