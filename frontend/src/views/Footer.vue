<script setup>
import { useScopedI18n } from '@/i18n/app'
import { useGlobalState } from '../store'
import DOMPurify from 'dompurify'

const { openSettings } = useGlobalState()
const { t } = useScopedI18n('views.Footer')
</script>

<template>
  <div class="mt-auto py-6">
    <hr class="border-zinc-800" />
    <div class="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4 text-xs text-zinc-500">
      <span>{{ t('copyright') }} © 2023-{{ new Date().getFullYear() }}</span>
      <span v-if="openSettings.copyright" class="hidden sm:inline text-zinc-700">|</span>
      <div v-if="openSettings.copyright" v-html="DOMPurify.sanitize(openSettings.copyright)"></div>
    </div>
  </div>
</template>

<style scoped>
/* No styles needed, pure Tailwind */
</style>
