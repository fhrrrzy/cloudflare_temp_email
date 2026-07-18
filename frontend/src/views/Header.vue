<script setup>
import { ref, computed, onMounted } from 'vue'
import { useScopedI18n } from '@/i18n/app'
import { useHead } from '@unhead/vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useIsMobile } from '../utils/composables'
import { 
  Github, Languages, User, Home, Moon, Sun, Menu, 
  ShieldAlert, Activity, ChevronDown, ExternalLink, X
} from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import { useGlobalState } from '../store'
import { api } from '../api'
import { getRouterPathWithLang, hashPassword } from '../utils'
import { DEFAULT_LOCALE, isSupportedLocale, replaceLocaleInFullPath } from '../i18n/utils'
import { getLocaleLabel, SUPPORTED_LOCALES } from '../i18n/locale-registry'
import Turnstile from '../components/Turnstile.vue'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'

const {
  toggleDark, isDark, isTelegram, showAdminPage,
  showAuth, auth, loading, openSettings, preferredLocale, userSettings
} = useGlobalState()
const route = useRoute()
const router = useRouter()
const isMobile = useIsMobile()

const showMobileMenu = ref(false)
const menuValue = computed(() => {
  if (route.path.includes("user")) return "user";
  if (route.path.includes("admin")) return "admin";
  return "home";
});

const cfToken = ref('')
const turnstileRef = ref(null)

const authFunc = async () => {
  try {
    await api.fetch('/open_api/site_login', {
      method: 'POST',
      body: JSON.stringify({
        password: await hashPassword(auth.value),
        cf_token: cfToken.value
      })
    });
    location.reload()
  } catch (error) {
    toast.error(error.message || "error");
    turnstileRef.value?.refresh?.();
  }
}

const languageOptions = SUPPORTED_LOCALES.map((locale) => ({
  label: getLocaleLabel(locale),
  value: locale,
  key: locale,
}))

const currentLocaleLabel = computed(() => {
  return languageOptions.find(opt => opt.value === locale.value)?.label || locale.value;
});

const { t, locale } = useScopedI18n('views.Header')

const changeLocale = async (lang) => {
  if (!isSupportedLocale(lang)) {
    return;
  }

  const currentFullPath = route.fullPath;
  const targetFullPath = replaceLocaleInFullPath(currentFullPath, lang);

  if (lang === locale.value && targetFullPath === currentFullPath) {
    showMobileMenu.value = false;
    return;
  }

  if (lang === DEFAULT_LOCALE) {
    preferredLocale.value = DEFAULT_LOCALE;
  }

  let localeSwitched = false;
  try {
    await router.push({ path: targetFullPath, force: true });
    localeSwitched = router.currentRoute.value.fullPath === targetFullPath;
    if (!localeSwitched) {
      await router.replace({ path: targetFullPath, force: true });
      localeSwitched = router.currentRoute.value.fullPath === targetFullPath;
    }
  } catch (error) {
    console.error('Failed to switch locale', error);
  } finally {
    showMobileMenu.value = false;
  }

  if (localeSwitched) preferredLocale.value = lang;
}

const version = import.meta.env.PACKAGE_VERSION ? `v${import.meta.env.PACKAGE_VERSION}` : "";
const showGithubForCurrentUser = computed(() => {
  if (!openSettings.value.showGithub) return false;
  if (openSettings.value.showGithubForUser) return true;
  return showAdminPage.value;
});

// Structural menu list
const menuItems = computed(() => {
  const items = [
    {
      label: t('home'),
      key: "home",
      icon: Home,
      action: async () => {
        await router.push(getRouterPathWithLang('/', locale.value));
        showMobileMenu.value = false;
      }
    },
    {
      label: t('user'),
      key: "user",
      icon: User,
      show: !isTelegram.value,
      action: async () => {
        await router.push(getRouterPathWithLang("/user", locale.value));
        showMobileMenu.value = false;
      }
    },
    {
      label: "Admin",
      key: "admin",
      icon: ShieldAlert,
      show: showAdminPage.value,
      action: async () => {
        loading.value = true;
        await router.push(getRouterPathWithLang('/admin', locale.value));
        loading.value = false;
        showMobileMenu.value = false;
      }
    },
    {
      label: isDark.value ? t('light') : t('dark'),
      key: "theme",
      icon: isDark.value ? Sun : Moon,
      action: () => {
        toggleDark();
        showMobileMenu.value = false;
      }
    }
  ]

  if (openSettings.value?.statusUrl) {
    items.push({
      label: t('status'),
      key: "status",
      icon: Activity,
      action: () => {
        window.open(openSettings.value.statusUrl, '_blank')
        showMobileMenu.value = false;
      }
    })
  }

  return items.filter(item => item.show !== false)
})

useHead({
  title: () => openSettings.value.title || t('title'),
  meta: [
    { name: "description", content: openSettings.value.description || t('title') },
  ]
});

const logoClickCount = ref(0);
const logoClick = async () => {
  if (route.path.includes("admin")) {
    logoClickCount.value = 0;
    return;
  }
  if (logoClickCount.value >= 5) {
    logoClickCount.value = 0;
    toast.info("Change to admin Page");
    loading.value = true;
    await router.push(getRouterPathWithLang('/admin', locale.value));
    loading.value = false;
  } else {
    logoClickCount.value++;
  }
  if (logoClickCount.value > 0) {
    toast.info(`Click ${5 - logoClickCount.value + 1} times to enter the admin page`);
  }
}

onMounted(async () => {
  await api.getOpenSettings(null, null); // Pass null as message & notification are no longer used this way
  // make sure user_id is fetched
  if (!userSettings.value.user_id) await api.getUserSettings();
});
</script>

<template>
  <header class="flex items-center justify-between py-4 border-b border-zinc-800 bg-zinc-950/50 backdrop-blur px-4 sm:px-6 rounded-xl mb-6">
    <!-- Brand / Logo -->
    <div class="flex items-center gap-3">
      <div @click="logoClick" class="cursor-pointer transition-transform hover:scale-105 active:scale-95">
        <img class="h-9 w-9 rounded-lg" src="/logo.png" alt="Logo" />
      </div>
      <h3 class="text-base font-bold text-white tracking-tight hidden sm:block">
        {{ openSettings.title || t('title') }}
      </h3>
    </div>

    <!-- Actions / Nav -->
    <div class="flex items-center gap-2">
      <!-- Desktop Nav Menu -->
      <nav class="hidden md:flex items-center gap-1">
        <Button 
          v-for="item in menuItems" 
          :key="item.key" 
          variant="ghost" 
          size="sm" 
          class="gap-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          :class="{ 'text-emerald-500 hover:text-emerald-400 bg-zinc-900/50': menuValue === item.key }"
          @click="item.action"
        >
          <component :is="item.icon" class="h-4 w-4" />
          <span>{{ item.label }}</span>
        </Button>
      </nav>

      <!-- Desktop Language Selector -->
      <div class="hidden md:block">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="sm" class="gap-1 text-zinc-400 hover:text-white hover:bg-zinc-900">
              <Languages class="h-4 w-4" />
              <span>{{ currentLocaleLabel }}</span>
              <ChevronDown class="h-3 w-3 text-zinc-500" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="bg-zinc-900 border-zinc-800 text-zinc-300">
            <DropdownMenuItem 
              v-for="opt in languageOptions" 
              :key="opt.key" 
              class="hover:bg-zinc-800 hover:text-white cursor-pointer n-dropdown-option"
              @select="changeLocale(opt.value)"
            >
              {{ opt.label }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <!-- Desktop Github Version link -->
      <div v-if="!isMobile && showGithubForCurrentUser" class="hidden md:block">
        <Button 
          variant="ghost" 
          size="sm" 
          as-child 
          class="gap-1 text-zinc-400 hover:text-white hover:bg-zinc-900"
        >
          <a href="https://github.com/dreamhunter2333/cloudflare_temp_email" target="_blank" rel="noopener noreferrer">
            <Github class="h-4 w-4" />
            <span>{{ version || 'Github' }}</span>
          </a>
        </Button>
      </div>

      <!-- Mobile Hamburger Trigger -->
      <div class="md:hidden">
        <Sheet v-model:open="showMobileMenu">
          <SheetTrigger as-child>
            <Button variant="ghost" size="icon" class="text-zinc-400 hover:text-white hover:bg-zinc-900">
              <Menu class="h-5 w-5" />
              <span class="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" class="n-drawer bg-zinc-950 border-zinc-800 text-zinc-300 flex flex-col justify-between">
            <SheetHeader class="text-left">
              <SheetTitle class="text-white flex items-center gap-2">
                <img class="h-7 w-7 rounded" src="/logo.png" alt="Logo" />
                <span>{{ t('menu') }}</span>
              </SheetTitle>
            </SheetHeader>

            <!-- Nav list inside sheet -->
            <div class="flex-1 py-8 flex flex-col gap-2">
              <Button 
                v-for="item in menuItems" 
                :key="item.key" 
                variant="ghost" 
                class="justify-start gap-3 w-full h-11 text-zinc-400 hover:text-white hover:bg-zinc-900"
                :class="{ 'text-emerald-500 hover:text-emerald-400 bg-zinc-900/50': menuValue === item.key }"
                @click="item.action"
              >
                <component :is="item.icon" class="h-5 w-5" />
                <span>{{ item.label }}</span>
              </Button>
            </div>

            <!-- Utility options at bottom of sheet -->
            <div class="border-t border-zinc-800 pt-6 flex flex-col gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger as-child>
                  <Button variant="outline" class="w-full justify-between border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800">
                    <span class="flex items-center gap-2">
                      <Languages class="h-4 w-4" />
                      {{ currentLocaleLabel }}
                    </span>
                    <ChevronDown class="h-4 w-4 text-zinc-500" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="bg-zinc-900 border-zinc-800 text-zinc-300 w-56">
                  <DropdownMenuItem 
                    v-for="opt in languageOptions" 
                    :key="opt.key" 
                    class="hover:bg-zinc-800 hover:text-white cursor-pointer n-dropdown-option"
                    @select="changeLocale(opt.value)"
                  >
                    {{ opt.label }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <a
                v-if="showGithubForCurrentUser"
                href="https://github.com/dreamhunter2333/cloudflare_temp_email"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center justify-between h-10 px-4 rounded-md border border-zinc-800 bg-zinc-900 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <span class="flex items-center gap-2">
                  <Github class="h-4 w-4" />
                  {{ version || 'Github' }}
                </span>
                <ExternalLink class="h-3.5 w-3.5 text-zinc-500" />
              </a>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>

    <!-- Global access password modal -->
    <Dialog :open="showAuth">
      <DialogContent class="sm:max-w-md border-zinc-800 bg-zinc-950 text-white" :closable="false">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold text-white">{{ t('accessHeader') }}</DialogTitle>
          <DialogDescription class="text-xs text-zinc-400">
            {{ t('accessTip') }}
          </DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <Input 
            v-model="auth" 
            type="password" 
            placeholder="Enter access password" 
            @keyup.enter="authFunc"
            class="border-zinc-850 bg-zinc-900/60 text-white placeholder-zinc-500 focus:ring-1 focus:ring-emerald-500"
          />
          <div class="mt-4 flex justify-center">
            <Turnstile ref="turnstileRef" v-if="openSettings.enableGlobalTurnstileCheck" v-model:value="cfToken" />
          </div>
        </div>
        <DialogFooter>
          <Button :disabled="loading" @click="authFunc" class="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold w-full">
            <span v-if="loading">Verifying...</span>
            <span v-else>{{ t('ok') }}</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </header>
</template>

<style scoped>
/* Scoped overrides if any */
</style>
