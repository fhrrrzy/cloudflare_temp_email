<script setup>
import { ref, onMounted } from 'vue';
import { useScopedI18n } from '@/i18n/app'
import { useRoute, useRouter } from 'vue-router';
import { Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import { useGlobalState } from '../../store'
import { api } from '../../api';

import { Card, CardContent } from '@/components/ui/card'

const {
  userJwt, userOauth2SessionState, userOauth2SessionClientID
} = useGlobalState()

const route = useRoute()
const router = useRouter()
const errorInfo = ref('')
const { t } = useScopedI18n('views.user.UserOauth2Callback')

onMounted(async () => {
  try {
    const state = route.query.state;
    if (state != userOauth2SessionState.value) {
      console.error('state not match');
      toast.error(t('stateNotMatch'));
      return;
    }
    const code = route.query.code;
    if (!code) {
      console.error('code not found');
      toast.error(t('codeNotFound'));
      return;
    }
    const res = await api.fetch(`/user_api/oauth2/callback`, {
      method: 'POST',
      body: JSON.stringify({
        code: code,
        clientID: userOauth2SessionClientID.value
      })
    });
    userJwt.value = res.jwt;
    router.push('/user');
  } catch (error) {
    console.error(error);
    toast.error(error.message || 'error');
  } finally {
    userOauth2SessionState.value = '';
    userOauth2SessionClientID.value = '';
  }
});
</script>

<template>
  <div class="flex justify-center w-full mt-10">
    <Card class="w-full max-w-md border-zinc-800 bg-card text-white">
      <CardContent class="p-12 flex flex-col items-center justify-center gap-4 text-center">
        <Loader2 class="h-10 w-10 animate-spin text-emerald-400" />
        <h3 class="text-sm font-semibold text-zinc-200">{{ t('logging') }}</h3>
        <p v-if="errorInfo" class="text-xs text-zinc-500 font-mono">{{ errorInfo }}</p>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
/* No styles needed, pure Tailwind */
</style>
