<script setup>
import { onMounted, ref } from "vue";
import { useScopedI18n } from '@/i18n/app'
import { Key, AlertTriangle } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import { api } from '../../api';
import { useGlobalState } from '../../store'
import { hashPassword } from '../../utils';
import { startAuthentication } from '@simplewebauthn/browser';

import Turnstile from '../../components/Turnstile.vue';
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const {
  userJwt, userOpenSettings, openSettings,
  userOauth2SessionState, userOauth2SessionClientID
} = useGlobalState()

const { t } = useScopedI18n('views.user.UserLogin')

const tabValue = ref("signin");
const showModal = ref(false);
const user = ref({
  email: "",
  password: "",
  code: ""
});
const signupCfToken = ref("")
const resetCfToken = ref("")
const loginCfToken = ref("")
const signupTurnstileRef = ref(null)
const resetTurnstileRef = ref(null)
const loginTurnstileRef = ref(null)

const emailLogin = async () => {
  if (!user.value.email || !user.value.password) {
    toast.error(t('pleaseInput'));
    return;
  }
  try {
    const res = await api.fetch(`/user_api/login`, {
      method: "POST",
      body: JSON.stringify({
        email: user.value.email,
        password: await hashPassword(user.value.password),
        cf_token: loginCfToken.value
      })
    });
    userJwt.value = res.jwt;
    location.reload();
  } catch (error) {
    toast.error(error.message || "login failed");
    loginTurnstileRef.value?.refresh?.();
  }
};

const verifyCodeExpire = ref(0);
const verifyCodeTimeout = ref(0);

const getVerifyCodeTimeout = () => {
  if (!verifyCodeExpire.value || verifyCodeExpire.value < new Date().getTime()) return 0;
  return Math.round((verifyCodeExpire.value - new Date().getTime()) / 1000);
};

const sendVerificationCode = async () => {
  if (!user.value.email) {
    toast.error(t('pleaseInputEmail'));
    return;
  }
  const currentCfToken = showModal.value ? resetCfToken.value : signupCfToken.value;
  if (openSettings.value.cfTurnstileSiteKey && !currentCfToken && userOpenSettings.value.enableMailVerify) {
    toast.error(t('pleaseCompleteTurnstile'));
    return;
  }
  try {
    const res = await api.fetch(`/user_api/verify_code`, {
      method: "POST",
      body: JSON.stringify({
        email: user.value.email,
        cf_token: currentCfToken
      })
    });
    if (res && res.expirationTtl) {
      toast.success(t('verifyCodeSent', { timeout: res.expirationTtl }));
      verifyCodeExpire.value = new Date().getTime() + res.expirationTtl * 1000;
      const intervalId = setInterval(() => {
        verifyCodeTimeout.value = getVerifyCodeTimeout();
        if (verifyCodeTimeout.value <= 0) {
          clearInterval(intervalId);
          verifyCodeTimeout.value = 0;
        }
      }, 1000);
    }
  } catch (error) {
    toast.error(error.message || "send verification code failed");
  }
  if (showModal.value) {
    resetTurnstileRef.value?.refresh?.();
  } else {
    signupTurnstileRef.value?.refresh?.();
  }
};

const emailSignup = async () => {
  if (!user.value.email || !user.value.password) {
    toast.error(t('pleaseInput'));
    return;
  }
  if (!user.value.code && userOpenSettings.value.enableMailVerify) {
    toast.error(t('pleaseInputCode'));
    return;
  }
  try {
    const res = await api.fetch(`/user_api/register`, {
      method: "POST",
      body: JSON.stringify({
        email: user.value.email,
        password: await hashPassword(user.value.password),
        code: user.value.code,
        cf_token: showModal.value ? resetCfToken.value : signupCfToken.value
      })
    });
    if (res) {
      tabValue.value = "signin";
      toast.success(t('pleaseLogin'));
    }
    showModal.value = false;
  } catch (error) {
    toast.error(error.message || "register failed");
  }
};

const passkeyLogin = async () => {
  try {
    const options = await api.fetch(`/user_api/passkey/authenticate_request`, {
      method: 'POST',
      body: JSON.stringify({
        domain: location.hostname,
      })
    })
    const credential = await startAuthentication({ optionsJSON: options })

    const res = await api.fetch(`/user_api/passkey/authenticate_response`, {
      method: 'POST',
      body: JSON.stringify({
        origin: location.origin,
        domain: location.hostname,
        credential
      })
    })
    userJwt.value = res.jwt;
    location.reload();
  } catch (e) {
    console.error(e)
    toast.error(e.message)
  }
};

const oauth2Login = async (clientID) => {
  try {
    userOauth2SessionClientID.value = clientID;
    userOauth2SessionState.value = Math.random().toString(36).substring(2);
    const res = await api.fetch(`/user_api/oauth2/login_url?clientID=${clientID}&state=${userOauth2SessionState.value}`);
    location.href = res.url;
  } catch (error) {
    toast.error(error.message || "login failed");
  }
};
</script>

<template>
  <div class="flex justify-center w-full">
    <Card class="w-full max-w-lg border-zinc-800 bg-card text-white" v-if="userOpenSettings.fetched">
      <CardContent class="p-6">
        <Tabs v-model="tabValue" class="w-full">
          <div class="border-b border-zinc-800 pb-2 mb-4">
            <TabsList class="grid grid-cols-2 bg-zinc-900 border border-zinc-800 text-zinc-400">
              <TabsTrigger value="signin" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
                {{ t('login') }}
              </TabsTrigger>
              <TabsTrigger 
                v-if="userOpenSettings.enable" 
                value="signup" 
                class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white"
              >
                {{ t('register') }}
              </TabsTrigger>
            </TabsList>
          </div>

          <!-- Signin Tab -->
          <TabsContent value="signin" class="space-y-4 text-left outline-none">
            <form @submit.prevent class="space-y-4">
              <div class="space-y-2">
                <Label for="login-email" class="text-xs font-semibold text-zinc-400">{{ t('email') }}</Label>
                <Input 
                  id="login-email" 
                  v-model="user.email" 
                  type="email"
                  class="border-zinc-800 bg-zinc-900/50 text-white focus:ring-1 focus:ring-emerald-500" 
                />
              </div>

              <div class="space-y-2">
                <Label for="login-password" class="text-xs font-semibold text-zinc-400">{{ t('password') }}</Label>
                <Input 
                  id="login-password" 
                  v-model="user.password" 
                  type="password" 
                  @keyup.enter="emailLogin"
                  class="border-zinc-800 bg-zinc-900/50 text-white focus:ring-1 focus:ring-emerald-500" 
                />
              </div>

              <Turnstile ref="loginTurnstileRef" v-if="openSettings.enableGlobalTurnstileCheck" v-model:value="loginCfToken" />

              <Button @click="emailLogin" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
                {{ t('login') }}
              </Button>

              <div class="text-center">
                <Button @click="showModal = true" variant="link" size="xs" class="text-zinc-400 hover:text-white p-0 h-auto">
                  {{ t('forgotPassword') }}
                </Button>
              </div>

              <hr class="border-zinc-800" />

              <Button 
                @click="passkeyLogin" 
                variant="outline" 
                class="w-full border-zinc-800 text-zinc-300 hover:bg-zinc-900 gap-1.5 font-semibold"
              >
                <Key class="h-4 w-4" />
                <span>{{ t('loginWithPasskey') }}</span>
              </Button>

              <Button 
                v-for="item in userOpenSettings.oauth2ClientIDs"
                :key="item.clientID"
                @click="oauth2Login(item.clientID)" 
                variant="outline" 
                class="w-full border-zinc-800 text-zinc-300 hover:bg-zinc-900 gap-1.5 font-semibold"
              >
                <span v-if="item.icon" class="w-4 h-4 flex items-center justify-center shrink-0" v-html="item.icon"></span>
                <span>{{ t('loginWith', { provider: item.name }) }}</span>
              </Button>
            </form>
          </TabsContent>

          <!-- Signup Tab -->
          <TabsContent value="signup" class="space-y-4 text-left outline-none" v-if="userOpenSettings.enable">
            <form @submit.prevent class="space-y-4">
              <div class="space-y-2">
                <Label for="signup-email" class="text-xs font-semibold text-zinc-400">{{ t('email') }}</Label>
                <Input 
                  id="signup-email" 
                  v-model="user.email" 
                  type="email"
                  class="border-zinc-800 bg-zinc-900/50 text-white focus:ring-1 focus:ring-emerald-500" 
                />
              </div>

              <div class="space-y-2">
                <Label for="signup-password" class="text-xs font-semibold text-zinc-400">{{ t('password') }}</Label>
                <Input 
                  id="signup-password" 
                  v-model="user.password" 
                  type="password" 
                  @keyup.enter="emailSignup"
                  class="border-zinc-800 bg-zinc-900/50 text-white focus:ring-1 focus:ring-emerald-500" 
                />
              </div>

              <Turnstile ref="signupTurnstileRef" v-if="userOpenSettings.enableMailVerify" v-model:value="signupCfToken" />

              <div v-if="userOpenSettings.enableMailVerify" class="space-y-2">
                <Label for="signup-code" class="text-xs font-semibold text-zinc-400">{{ t('verifyCode') }}</Label>
                <div class="flex gap-2">
                  <Input 
                    id="signup-code" 
                    v-model="user.code" 
                    class="border-zinc-800 bg-zinc-900/50 text-white focus:ring-1 focus:ring-emerald-500" 
                  />
                  <Button 
                    type="button"
                    variant="outline"
                    @click="sendVerificationCode" 
                    :disabled="verifyCodeTimeout > 0"
                    class="border-zinc-800 bg-zinc-900 text-zinc-300 shrink-0 font-medium text-xs px-3"
                  >
                    {{ verifyCodeTimeout > 0 ? t('waitforVerifyCode', { timeout: verifyCodeTimeout }) : t('sendVerificationCode') }}
                  </Button>
                </div>
              </div>

              <Turnstile ref="signupTurnstileRef" v-if="!userOpenSettings.enableMailVerify" v-model:value="signupCfToken" />

              <Button @click="emailSignup" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
                {{ t('register') }}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>

    <!-- Forgot Password Dialog -->
    <Dialog v-model:open="showModal">
      <DialogContent class="sm:max-w-md border-zinc-800 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold text-white">{{ t('forgotPassword') }}</DialogTitle>
        </DialogHeader>
        
        <div class="py-4 text-left">
          <form v-if="userOpenSettings.enable && userOpenSettings.enableMailVerify" @submit.prevent class="space-y-4">
            <div class="space-y-2">
              <Label for="reset-email" class="text-xs font-semibold text-zinc-400">{{ t('email') }}</Label>
              <Input 
                id="reset-email" 
                v-model="user.email" 
                type="email"
                class="border-zinc-800 bg-zinc-900/50 text-white focus:ring-1 focus:ring-emerald-500" 
              />
            </div>

            <div class="space-y-2">
              <Label for="reset-password" class="text-xs font-semibold text-zinc-400">{{ t('password') }}</Label>
              <Input 
                id="reset-password" 
                v-model="user.password" 
                type="password" 
                @keyup.enter="emailSignup"
                class="border-zinc-800 bg-zinc-900/50 text-white focus:ring-1 focus:ring-emerald-500" 
              />
            </div>

            <Turnstile ref="resetTurnstileRef" v-model:value="resetCfToken" />

            <div class="space-y-2">
              <Label for="reset-code" class="text-xs font-semibold text-zinc-400">{{ t('verifyCode') }}</Label>
              <div class="flex gap-2">
                <Input 
                  id="reset-code" 
                  v-model="user.code" 
                  class="border-zinc-800 bg-zinc-900/50 text-white focus:ring-1 focus:ring-emerald-500" 
                />
                <Button 
                  type="button"
                  variant="outline"
                  @click="sendVerificationCode" 
                  :disabled="verifyCodeTimeout > 0"
                  class="border-zinc-800 bg-zinc-900 text-zinc-300 shrink-0 font-medium text-xs px-3"
                >
                  {{ verifyCodeTimeout > 0 ? t('waitforVerifyCode', { timeout: verifyCodeTimeout }) : t('sendVerificationCode') }}
                </Button>
              </div>
            </div>

            <Button @click="emailSignup" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
              {{ t('resetPassword') }}
            </Button>
          </form>

          <div v-else class="flex items-center gap-2.5 rounded-xl border border-yellow-950/20 bg-yellow-950/10 p-4 text-xs text-yellow-400">
            <AlertTriangle class="h-4 w-4 shrink-0" />
            <span>{{ t('cannotForgotPassword') }}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
.oauth2-icon :deep(svg) {
  width: 100%;
  height: 100%;
}
</style>
