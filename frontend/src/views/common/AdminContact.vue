<script setup>
import { useScopedI18n } from '@/i18n/app'
import { useGlobalState } from '../../store'
import { MessageSquare } from 'lucide-vue-next'

const { openSettings } = useGlobalState()
const { t } = useScopedI18n('views.common.AdminContact')
</script>

<template>
  <div v-if="openSettings.adminContact" class="flex items-start gap-2.5 rounded-xl border border-yellow-950/20 bg-yellow-950/10 p-4 text-xs text-yellow-400 text-left">
    <MessageSquare class="h-4 w-4 shrink-0 mt-0.5" />
    <span>{{ t('adminContact', { msg: openSettings.adminContact }) }}</span>
  </div>
</template>
