<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useScopedI18n } from '@/i18n/app'
import { useRouter } from 'vue-router'
import { Mail, Plus, AlertCircle, Sparkles, Loader2, HelpCircle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import AdminContact from '../common/AdminContact.vue'
import Turnstile from '../../components/Turnstile.vue'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import { getRouterPathWithLang, hashPassword } from '../../utils'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const props = defineProps({
  bindUserAddress: {
    type: Function,
    default: async () => { await api.bindUserAddress(); },
    required: true
  },
  newAddressPath: {
    type: Function,
    default: async (address_name, domain, cf_token, enableRandomSubdomain) => {
      return await api.fetch("/api/new_address", {
        method: "POST",
        body: JSON.stringify({
          name: address_name,
          domain: domain,
          cf_token: cf_token,
          enableRandomSubdomain: enableRandomSubdomain,
        }),
      });
    },
    required: true
  },
})

const router = useRouter()

const {
  jwt, loading, openSettings,
  showAddressCredential, userSettings, addressPassword
} = useGlobalState()

const tabValue = ref('signin')
const credential = ref('')
const emailName = ref("")
const emailDomain = ref("")
const cfToken = ref("")
const enableRandomSubdomain = ref(false)
const loginCfToken = ref("")
const loginTurnstileRef = ref(null)
const loginMethod = ref('credential') // 'credential' or 'password'
const loginAddress = ref('')
const loginPassword = ref('')

const initLoginMethod = () => {
  if (openSettings.value?.enableAddressPassword) {
    loginMethod.value = 'password';
  } else {
    loginMethod.value = 'credential';
  }
}

const login = async () => {
  if (loginMethod.value === 'password') {
    if (!loginAddress.value || !loginPassword.value) {
      toast.error(t('emailPasswordRequired'));
      return;
    }
    try {
      const res = await api.fetch('/api/address_login', {
        method: 'POST',
        body: JSON.stringify({
          email: loginAddress.value,
          password: await hashPassword(loginPassword.value),
          cf_token: loginCfToken.value
        })
      });
      jwt.value = res.jwt;
      await api.getSettings();
      try {
        await props.bindUserAddress();
      } catch (error) {
        toast.error(`${t('bindUserAddressError')}: ${error.message}`);
      }
      await router.push(getRouterPathWithLang("/", locale.value));
    } catch (error) {
      toast.error(error.message || "error");
      loginTurnstileRef.value?.refresh?.();
    }
    return;
  }
  if (!credential.value) {
    toast.error(t('credentialInput'));
    return;
  }
  try {
    await api.fetch('/open_api/credential_login', {
      method: 'POST',
      body: JSON.stringify({
        credential: credential.value,
        cf_token: loginCfToken.value
      })
    });
    jwt.value = credential.value;
    await api.getSettings();
    try {
      await props.bindUserAddress();
    } catch (error) {
      toast.error(`${t('bindUserAddressError')}: ${error.message}`);
    }
    await router.push(getRouterPathWithLang("/", locale.value));
  } catch (error) {
    toast.error(error.message || "error");
    loginTurnstileRef.value?.refresh?.();
  }
}

const { locale, t } = useScopedI18n('views.common.Login')

const loginAndBindTag = computed(() => {
  if (userSettings.value.user_email) {
    return t('loginAndBind')
  }
  return t('login')
})

const addressRegex = computed(() => {
  try {
    if (openSettings.value.addressRegex) {
      return new RegExp(openSettings.value.addressRegex, 'g');
    }
  } catch (error) {
    console.error(error);
    toast.error(`Invalid addressRegex: ${openSettings.value.addressRegex}`);
  }
  return /[^a-z0-9]/g;
});

const generateNameLoading = ref(false);
const generateName = async () => {
  try {
    generateNameLoading.value = true;
    const { faker } = await import('https://esm.sh/@faker-js/faker');
    emailName.value = faker.internet.email()
      .split('@')[0]
      .replace(/\s+/g, '.')
      .replace(/\.{2,}/g, '.')
      .replace(addressRegex.value, '')
      .toLowerCase();
    if (emailName.value.length > openSettings.value.maxAddressLen) {
      emailName.value = emailName.value.slice(0, openSettings.value.maxAddressLen);
    }
  } catch (error) {
    toast.error(error.message || "error");
  } finally {
    generateNameLoading.value = false;
  }
};

const newEmail = async () => {
  try {
    const nameToSend = openSettings.value.disableCustomAddressName ? "" : emailName.value;
    const res = await props.newAddressPath(
      nameToSend,
      emailDomain.value,
      cfToken.value,
      enableRandomSubdomain.value
    );
    jwt.value = res["jwt"];
    addressPassword.value = res["password"] || '';
    await api.getSettings();
    await router.push(getRouterPathWithLang("/", locale.value));
    showAddressCredential.value = true;
    try {
      await props.bindUserAddress();
    } catch (error) {
      toast.error(`${t('bindUserAddressError')}: ${error.message}`);
    }
  } catch (error) {
    toast.error(error.message || "error");
  }
};

const addressPrefix = computed(() => {
  if (userSettings.value?.user_role) {
    return userSettings.value.user_role.prefix || "";
  }
  return openSettings.value.prefix;
});

const canUseRandomSubdomain = computed(() => {
  if (!emailDomain.value) {
    return false;
  }
  return (openSettings.value.randomSubdomainDomains || []).includes(emailDomain.value);
});

watch(canUseRandomSubdomain, (enabled) => {
  if (!enabled) {
    enableRandomSubdomain.value = false;
  }
});

const domainsOptions = computed(() => {
  if (userSettings.value.user_role) {
    const allDomains = userSettings.value.user_role.domains;
    if (!allDomains) return openSettings.value.domains || [];
    return (openSettings.value.domains || []).filter((domain) => {
      return allDomains.includes(domain.value);
    });
  }
  if (!openSettings.value.defaultDomains) {
    return openSettings.value.domains || [];
  }
  return (openSettings.value.domains || []).filter((domain) => {
    return openSettings.value.defaultDomains.includes(domain.value);
  });
});

const showNewAddressTab = computed(() => {
  if (openSettings.value.disableAnonymousUserCreateEmail
    && !userSettings.value.user_email
  ) {
    return false;
  }
  return openSettings.value.enableUserCreateEmail;
});

onMounted(async () => {
  if (!openSettings.value.domains || openSettings.value.domains.length === 0) {
    await api.getOpenSettings();
  }
  emailDomain.value = domainsOptions.value ? domainsOptions.value[0]?.value : "";
  initLoginMethod();
});
</script>

<template>
  <div class="space-y-4">
    <!-- User bind alert info banner -->
    <div v-if="userSettings.user_email" class="flex items-center gap-2.5 rounded-xl border border-emerald-950/25 bg-emerald-950/15 p-4 text-xs text-emerald-400 justify-center">
      <AlertCircle class="h-4 w-4 shrink-0" />
      <span>{{ t('bindUserInfo') }}</span>
    </div>

    <!-- Main Tabs -->
    <Tabs v-if="openSettings.fetched" v-model="tabValue" class="w-full">
      <div class="border-b border-zinc-800 pb-2 mb-4">
        <TabsList class="grid w-full grid-cols-3 bg-zinc-900 border border-zinc-800 text-zinc-400">
          <TabsTrigger value="signin" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
            {{ loginAndBindTag }}
          </TabsTrigger>
          <TabsTrigger 
            v-if="showNewAddressTab" 
            value="register" 
            class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white"
          >
            {{ t('getNewEmail') }}
          </TabsTrigger>
          <TabsTrigger value="help" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
            {{ t('help') }}
          </TabsTrigger>
        </TabsList>
      </div>

      <!-- Tab Content: Signin -->
      <TabsContent value="signin" class="outline-none text-left space-y-4">
        <form @submit.prevent class="space-y-4">
          <!-- Password Login Method -->
          <div v-if="loginMethod === 'password'" class="space-y-4">
            <div class="space-y-2">
              <Label for="login-addr" class="text-xs font-semibold text-zinc-400">{{ t('email') }}</Label>
              <Input 
                id="login-addr" 
                v-model="loginAddress" 
                placeholder="address@domain.com"
                class="border-zinc-800 bg-zinc-900/50 text-white placeholder-zinc-650"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="login-pwd" class="text-xs font-semibold text-zinc-400">{{ t('password') }}</Label>
              <Input 
                id="login-pwd" 
                v-model="loginPassword" 
                type="password" 
                @keyup.enter="login"
                class="border-zinc-800 bg-zinc-900/50 text-white placeholder-zinc-650"
              />
            </div>
          </div>

          <!-- Credential Login Method -->
          <div v-else class="space-y-2">
            <Label for="login-cred" class="text-xs font-semibold text-zinc-400">{{ t('credential') }}</Label>
            <textarea 
              id="login-cred" 
              v-model="credential" 
              rows="3"
              class="flex min-h-[80px] w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-white font-mono placeholder:text-zinc-650 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <!-- Turnstile -->
          <Turnstile ref="loginTurnstileRef" v-if="openSettings.enableGlobalTurnstileCheck" v-model:value="loginCfToken" />

          <!-- Method Switcher Link -->
          <div v-if="openSettings?.enableAddressPassword" class="text-center py-1">
            <Button 
              type="button" 
              variant="link" 
              size="xs" 
              @click="loginMethod === 'password' ? loginMethod = 'credential' : loginMethod = 'password'"
              class="text-emerald-400 hover:text-emerald-300 p-0 h-auto font-semibold"
            >
              {{ loginMethod === 'password' ? t('credentialLogin') : t('passwordLogin') }}
            </Button>
          </div>

          <!-- Login execution buttons -->
          <div class="flex flex-col gap-2 pt-2">
            <Button 
              @click="login" 
              :disabled="loading" 
              class="w-full bg-emerald-500 hover:bg-emerald-600 text-white gap-2 font-semibold"
            >
              <Mail class="h-4.5 w-4.5" />
              <span>{{ loginAndBindTag }}</span>
            </Button>

            <Button 
              v-if="showNewAddressTab" 
              type="button"
              variant="outline"
              @click="tabValue = 'register'" 
              class="w-full border-zinc-850 text-zinc-350 hover:bg-zinc-900 gap-2 font-semibold"
            >
              <Plus class="h-4.5 w-4.5" />
              <span>{{ t('getNewEmail') }}</span>
            </Button>
          </div>
        </form>
      </TabsContent>

      <!-- Tab Content: Register (Create New Address) -->
      <TabsContent value="register" class="outline-none text-left space-y-4">
        <!-- Guidelines text -->
        <div class="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-400 space-y-1.5">
          <p v-if="!openSettings.disableCustomAddressName">
            {{ t("getNewEmailTip1") }} <code class="font-mono text-emerald-400">{{ addressRegex.source }}</code>
          </p>
          <p v-if="!openSettings.disableCustomAddressName">{{ t("getNewEmailTip2") }}</p>
          <p>{{ t("getNewEmailTip3") }}</p>
        </div>

        <div class="flex flex-col gap-4">
          <!-- Generate custom name helper button -->
          <Button 
            v-if="!openSettings.disableCustomAddressName" 
            variant="outline" 
            size="sm"
            @click="generateName" 
            :disabled="generateNameLoading"
            class="w-fit border-zinc-800 text-zinc-350 hover:bg-zinc-900 gap-1.5 font-semibold"
          >
            <Sparkles class="h-4 w-4 text-emerald-400" :class="{ 'animate-pulse': generateNameLoading }" />
            <span>{{ t('generateName') }}</span>
          </Button>

          <!-- Input group for address creation -->
          <div class="space-y-2">
            <Label class="text-xs font-semibold text-zinc-400">Mail Address</Label>
            <div class="flex items-center gap-2 border border-zinc-800 bg-zinc-950/40 rounded-lg p-1.5">
              <!-- Prefix label if set -->
              <span v-if="addressPrefix" class="px-2.5 py-1 text-xs font-semibold text-zinc-400 bg-zinc-900 rounded border border-zinc-850">
                {{ addressPrefix }}
              </span>

              <!-- Custom email name field -->
              <Input 
                v-if="!openSettings.disableCustomAddressName" 
                v-model="emailName" 
                :minlength="openSettings.minAddressLen" 
                :maxlength="openSettings.maxAddressLen"
                placeholder="custom.name"
                class="flex-1 border-transparent bg-transparent text-white focus-visible:ring-0 focus-visible:ring-offset-0 px-2 h-8"
              />
              <Input 
                v-else 
                :value="t('autoGeneratedName')" 
                disabled 
                class="flex-1 border-transparent bg-transparent text-zinc-500 cursor-not-allowed text-xs"
              />

              <!-- Separator -->
              <span class="text-zinc-600 font-semibold text-sm">@</span>

              <!-- Domain selector dropdown -->
              <Select v-model="emailDomain">
                <SelectTrigger class="w-[140px] bg-zinc-900 border-zinc-800 h-8 text-xs text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent class="bg-zinc-900 border-zinc-800 text-zinc-300">
                  <SelectItem 
                    v-for="domain in domainsOptions" 
                    :key="domain.value" 
                    :value="domain.value"
                    class="focus:bg-zinc-800 focus:text-white cursor-pointer text-xs"
                  >
                    {{ domain.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <!-- Enable random subdomain check -->
          <div v-if="canUseRandomSubdomain" class="flex flex-col gap-2 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
            <div class="flex items-center gap-2">
              <Checkbox id="enable-rand-sub" :checked="enableRandomSubdomain" @update:checked="(val) => enableRandomSubdomain = val" />
              <Label for="enable-rand-sub" class="text-xs font-semibold text-zinc-200 cursor-pointer">{{ t('enableRandomSubdomain') }}</Label>
            </div>
            <p class="text-[11px] text-zinc-500 pl-6 leading-relaxed">
              {{ t('randomSubdomainTip') }}
            </p>
          </div>

          <!-- Turnstile widget -->
          <Turnstile v-model:value="cfToken" />

          <!-- Create email execution trigger -->
          <Button 
            @click="newEmail" 
            :disabled="loading" 
            class="w-full bg-emerald-500 hover:bg-emerald-600 text-white gap-2 font-semibold"
          >
            <Plus class="h-4.5 w-4.5" />
            <span>{{ t('getNewEmail') }}</span>
          </Button>
        </div>
      </TabsContent>

      <!-- Tab Content: Help -->
      <TabsContent value="help" class="outline-none text-left space-y-4">
        <div class="flex items-start gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-400">
          <HelpCircle class="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
          <span>{{ t('pleaseGetNewEmail') }}</span>
        </div>
        <AdminContact />
      </TabsContent>
    </Tabs>
  </div>
</template>

<style scoped>
/* No styles needed, pure Tailwind */
</style>
