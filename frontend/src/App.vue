<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watchEffect } from 'vue'
import { useScript } from '@unhead/vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { useGlobalState } from './store'
import { useIsMobile } from './utils/composables'
import Header from './views/Header.vue';
import Footer from './views/Footer.vue';
import { api } from './api'
import { DEFAULT_LOCALE, isSupportedLocale } from './i18n/utils'
import { Loader2, ChevronUp } from 'lucide-vue-next'
import { Toaster } from '@/components/ui/sonner'

const route = useRoute()
// Conditional layout check
const isAdminRoute = computed(() => {
  return route.path.includes('/admin') || route.path.includes('/login')
})

const {
  isDark, loading, useSideMargin, telegramApp, isTelegram
} = useGlobalState()
const adClient = import.meta.env.VITE_GOOGLE_AD_CLIENT;
const adSlot = import.meta.env.VITE_GOOGLE_AD_SLOT;
const { locale } = useI18n({ useScope: 'global' });
const isMobile = useIsMobile()
const showSideMargin = computed(() => !isMobile.value && useSideMargin.value);
const showAd = computed(() => !isMobile.value && adClient && adSlot);

watchEffect(() => {
  if (typeof document === 'undefined') return
  document.documentElement.lang = isSupportedLocale(locale.value) ? locale.value : DEFAULT_LOCALE
})

// Load Google Ad script at top level (not inside onMounted)
if (showAd.value) {
  useScript({
    src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`,
    async: true,
    crossorigin: "anonymous",
  })
}

// Back to top logic
const showBackToTop = ref(false)
const handleScroll = () => {
  showBackToTop.value = window.scrollY > 300
}

onMounted(async () => {
  window.addEventListener('scroll', handleScroll)
  
  try {
    await api.getUserSettings();
  } catch (error) {
    console.error(error);
  }

  const token = import.meta.env.VITE_CF_WEB_ANALY_TOKEN;

  const exist = document.querySelector('script[src="https://static.cloudflareinsights.com/beacon.min.js"]') !== null
  if (token && !exist) {
    const script = document.createElement('script');
    script.defer = true;
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.dataset.cfBeacon = `{ token: ${token} }`;
    document.body.appendChild(script);
  }

  // check if google ad is enabled
  if (showAd.value) {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  }

  // check if telegram is enabled
  const enableTelegram = import.meta.env.VITE_IS_TELEGRAM;
  if (
    (typeof enableTelegram === 'boolean' && enableTelegram === true)
    ||
    (typeof enableTelegram === 'string' && enableTelegram === 'true')
  ) {
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js';
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
    telegramApp.value = window.Telegram?.WebApp || {};
    isTelegram.value = !!window.Telegram?.WebApp?.initData;
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
})

const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <template v-if="isAdminRoute">
    <router-view></router-view>
  </template>
  <template v-else>
    <div class="relative min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <!-- Loading spinner overlay -->
      <div v-if="loading" class="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm">
        <div class="flex flex-col items-center gap-2">
          <Loader2 class="h-8 w-8 animate-spin text-emerald-500" />
          <span class="text-xs text-zinc-400 font-medium">loading...</span>
        </div>
      </div>

      <div class="grid grid-cols-12 gap-6 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex-1">
        <!-- Left Ad -->
        <div v-if="showSideMargin && showAd" class="col-span-2 hidden md:block">
          <div class="sticky top-4">
            <ins class="adsbygoogle" style="display:block" :data-ad-client="adClient" :data-ad-slot="adSlot"
              data-ad-format="auto" data-full-width-responsive="true"></ins>
          </div>
        </div>

        <!-- Main Content -->
        <div :class="[
          showSideMargin && showAd ? 'col-span-12 md:col-span-8' : 
          showSideMargin ? 'col-span-12 md:col-span-10 md:col-start-2' : 
          'col-span-12'
        ]" class="flex flex-col min-h-[85vh]">
          <Header />
          <main class="flex-1 py-4">
            <router-view></router-view>
          </main>
          <Footer />
        </div>

        <!-- Right Ad -->
        <div v-if="showSideMargin && showAd" class="col-span-2 hidden md:block">
          <div class="sticky top-4">
            <ins class="adsbygoogle" style="display:block" :data-ad-client="adClient" :data-ad-slot="adSlot"
              data-ad-format="auto" data-full-width-responsive="true"></ins>
          </div>
        </div>
      </div>

      <!-- Back to top button -->
      <button 
        v-if="showBackToTop" 
        @click="scrollToTop" 
        class="fixed bottom-6 right-6 z-40 p-2.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 shadow-lg cursor-pointer transition-all duration-200"
        aria-label="Back to top"
      >
        <ChevronUp class="h-5 w-5" />
      </button>

      <!-- Sonner Toaster -->
      <Toaster richColors />
    </div>
  </template>
</template>

<style>
/* Global CSS adjustments */
@media (hover: none) and (pointer: coarse) and (max-width: 1024px) {
  :where(input, textarea, select, [contenteditable="true"]) {
    font-size: 16px !important;
  }
}
</style>
