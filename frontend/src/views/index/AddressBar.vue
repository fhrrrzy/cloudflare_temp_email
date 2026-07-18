<script setup>
import { onMounted, ref } from 'vue'
import { useScopedI18n } from '@/i18n/app'
import { useRouter } from 'vue-router'
import { User as UserIcon, ArrowLeftRight, AlertTriangle } from 'lucide-vue-next'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import Login from '../common/Login.vue'
import TelegramAddress from './TelegramAddress.vue'
import LocalAddress from './LocalAddress.vue'
import AddressManagement from '../user/AddressManagement.vue'
import { getRouterPathWithLang } from '../../utils'
import AddressSelect from '../../components/AddressSelect.vue'
import AddressCredentialModal from '../../components/AddressCredentialModal.vue'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const router = useRouter()

const {
  jwt, settings, showAddressCredential, userJwt,
  isTelegram, addressPassword
} = useGlobalState()

const { locale, t } = useScopedI18n('views.index.AddressBar')

const showAddressManage = ref(false)

const onUserLogin = async () => {
  await router.push(getRouterPathWithLang("/user", locale.value))
}

onMounted(async () => {
  await api.getSettings();
});
</script>

<template>
  <div>
    <!-- Loading skeleton -->
    <Card v-if="!settings.fetched" class="border-zinc-800 bg-card">
      <CardContent class="p-6">
        <Skeleton class="h-[30vh] w-full bg-zinc-900 rounded-lg" />
      </CardContent>
    </Card>

    <!-- Address selector bar -->
    <div v-else-if="settings.address" class="w-full">
      <div class="rounded-xl border border-zinc-800 bg-zinc-900/10 p-4 flex items-center justify-between">
        <AddressSelect class="w-full">
          <template #actions>
            <Button 
              size="sm" 
              variant="outline" 
              class="gap-1.5 border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-900 shrink-0"
              @click="showAddressManage = true"
            >
              <ArrowLeftRight class="h-4 w-4 text-zinc-400" />
              <span>{{ t('addressManage') }}</span>
            </Button>
          </template>
        </AddressSelect>
      </div>
    </div>

    <!-- Telegram block -->
    <div v-else-if="isTelegram">
      <TelegramAddress />
    </div>

    <!-- User address management block -->
    <div v-else-if="userJwt" class="flex justify-center py-4">
      <Card class="w-full max-w-4xl border-zinc-800 bg-card">
        <CardContent class="p-6 text-left">
          <AddressManagement />
        </CardContent>
      </Card>
    </div>

    <!-- Login block -->
    <div v-else class="flex justify-center py-4">
      <Card class="w-full max-w-xl border-zinc-800 bg-card">
        <CardContent class="p-6 text-left space-y-6">
          <div v-if="jwt" class="flex items-center gap-2.5 rounded-lg border border-yellow-950/20 bg-yellow-950/10 p-3 text-xs text-yellow-400">
            <AlertTriangle class="h-4 w-4 shrink-0" />
            <span>{{ t('fetchAddressError') }}</span>
          </div>

          <Login />

          <hr class="border-zinc-800" />

          <Button 
            @click="onUserLogin" 
            class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2"
          >
            <UserIcon class="h-4.5 w-4.5" />
            <span>{{ t('userLogin') }}</span>
          </Button>
        </CardContent>
      </Card>
    </div>

    <!-- Address credentials popup -->
    <AddressCredentialModal 
      v-model:show="showAddressCredential" 
      :address="settings.address" 
      :jwt="jwt"
      :address-password="addressPassword" 
    />

    <!-- Address management modal -->
    <Dialog v-model:open="showAddressManage">
      <DialogContent class="sm:max-w-2xl border-zinc-800 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold text-white">{{ t('addressManage') }}</DialogTitle>
        </DialogHeader>
        <div class="py-4">
          <TelegramAddress v-if="isTelegram" />
          <AddressManagement v-else-if="userJwt" />
          <LocalAddress v-else />
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
/* No custom styles needed, pure Tailwind */
</style>
