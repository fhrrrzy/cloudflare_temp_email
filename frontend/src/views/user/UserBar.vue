<script setup>
import { onMounted } from 'vue'
import { useScopedI18n } from '@/i18n/app'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { AlertCircle, CheckCircle } from 'lucide-vue-next'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import UserLogin from './UserLogin.vue'

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const router = useRouter()

const {
  userSettings, userJwt
} = useGlobalState()

const { t } = useScopedI18n('views.user.UserBar')

onMounted(async () => {
  await api.getUserOpenSettings();
  if (!userSettings.value.user_id) await api.getUserSettings();
});
</script>

<template>
  <div>
    <!-- Loading skeleton -->
    <Card v-if="!userSettings.fetched" class="border-zinc-800 bg-card">
      <CardContent class="p-6">
        <Skeleton class="h-[30vh] w-full bg-zinc-900 rounded-lg" />
      </CardContent>
    </Card>

    <!-- Logged in status alert banner -->
    <div v-else-if="userSettings.user_email" class="w-full mt-4">
      <div class="flex items-center gap-2.5 rounded-xl border border-emerald-950/25 bg-emerald-950/15 p-4 text-sm text-emerald-400 justify-center">
        <CheckCircle class="h-4 w-4 shrink-0" />
        <span>{{ t('currentUser') }} <strong class="text-white ml-1">{{ userSettings.user_email }}</strong></span>
      </div>
    </div>

    <!-- Login block -->
    <div v-else class="flex justify-center py-4">
      <Card class="w-full max-w-xl border-zinc-800 bg-card text-left">
        <CardContent class="p-6 space-y-4">
          <div v-if="userJwt" class="flex items-center gap-2.5 rounded-lg border border-yellow-950/20 bg-yellow-950/10 p-3 text-xs text-yellow-400">
            <AlertCircle class="h-4 w-4 shrink-0" />
            <span>{{ t('fetchUserSettingsError') }}</span>
          </div>
          <UserLogin />
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<style scoped>
/* No styles needed, pure Tailwind */
</style>
