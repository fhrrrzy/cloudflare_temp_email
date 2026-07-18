<script setup>
import { useScopedI18n } from '@/i18n/app'
import { useIsMobile } from '../../utils/composables'
import { useGlobalState } from '../../store'

import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

const props = defineProps({
  showUseSimpleIndex: {
    type: Boolean,
    default: false
  }
})

const {
  mailboxSplitSize, mailListView, mailListPreviewLineClamp, useIframeShowMail, preferShowTextMail, configAutoRefreshInterval,
  globalTabplacement, useSideMargin, useUTCDate, useSimpleIndex
} = useGlobalState()
const isMobile = useIsMobile()

const { t } = useScopedI18n('views.common.Appearance')

const placements = [
  { value: 'top', label: 'Top' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
  { value: 'bottom', label: 'Bottom' }
]
</script>

<template>
  <div class="flex justify-center w-full">
    <Card class="w-full max-w-3xl border-zinc-800 bg-card text-white">
      <CardContent class="p-6 space-y-6 text-left">
        
        <!-- Mailbox Split Size slider -->
        <div v-if="!isMobile" class="space-y-2">
          <div class="flex justify-between items-center text-xs">
            <Label class="font-semibold text-zinc-400">{{ t('mailboxSplitSize') }}</Label>
            <span class="font-mono text-emerald-400">{{ mailboxSplitSize }}</span>
          </div>
          <input 
            type="range" 
            v-model.number="mailboxSplitSize" 
            min="0" 
            max="0.75" 
            step="0.01" 
            class="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
          />
        </div>

        <!-- Mail List View Switch -->
        <div v-if="!isMobile" class="flex items-center justify-between py-1 border-b border-zinc-900">
          <div class="space-y-0.5">
            <Label class="text-sm font-semibold text-zinc-200">{{ t('mailListView') }}</Label>
            <p class="text-xs text-zinc-500">Enable compact list layout.</p>
          </div>
          <Switch :checked="mailListView" @update:checked="(val) => mailListView = val" />
        </div>

        <!-- Mail List Preview Line Clamp slider -->
        <div v-if="!isMobile" class="space-y-2">
          <div class="flex justify-between items-center text-xs">
            <Label class="font-semibold text-zinc-400">{{ t('mailListPreviewLineClamp') }}</Label>
            <span class="font-mono text-emerald-400">{{ mailListPreviewLineClamp === 0 ? t('off') : mailListPreviewLineClamp }}</span>
          </div>
          <input 
            type="range" 
            v-model.number="mailListPreviewLineClamp" 
            min="0" 
            max="5" 
            step="1" 
            class="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
          />
        </div>

        <!-- Auto Refresh Interval slider -->
        <div class="space-y-2">
          <div class="flex justify-between items-center text-xs">
            <Label class="font-semibold text-zinc-400">{{ t('autoRefreshInterval') }}</Label>
            <span class="font-mono text-emerald-400">{{ configAutoRefreshInterval }}s</span>
          </div>
          <input 
            type="range" 
            v-model.number="configAutoRefreshInterval" 
            min="30" 
            max="300" 
            step="1" 
            class="w-full h-1.5 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-emerald-500 focus:outline-none"
          />
        </div>

        <!-- Use Simple Index Switch -->
        <div v-if="props.showUseSimpleIndex" class="flex items-center justify-between py-1 border-b border-zinc-900">
          <div class="space-y-0.5">
            <Label class="text-sm font-semibold text-zinc-200">{{ t('useSimpleIndex') }}</Label>
            <p class="text-xs text-zinc-500">Toggle lightweight simplified index layout.</p>
          </div>
          <Switch :checked="useSimpleIndex" @update:checked="(val) => useSimpleIndex = val" />
        </div>

        <!-- Prefer Show Text Mail Switch -->
        <div class="flex items-center justify-between py-1 border-b border-zinc-900">
          <div class="space-y-0.5">
            <Label class="text-sm font-semibold text-zinc-200">{{ t('preferShowTextMail') }}</Label>
            <p class="text-xs text-zinc-500">Load plain text versions of emails by default.</p>
          </div>
          <Switch :checked="preferShowTextMail" @update:checked="(val) => preferShowTextMail = val" />
        </div>

        <!-- Use Iframe Show Mail Switch -->
        <div class="flex items-center justify-between py-1 border-b border-zinc-900">
          <div class="space-y-0.5">
            <Label class="text-sm font-semibold text-zinc-200">{{ t('useIframeShowMail') }}</Label>
            <p class="text-xs text-zinc-500">Isolate HTML email bodies using safe sandbox frames.</p>
          </div>
          <Switch :checked="useIframeShowMail" @update:checked="(val) => useIframeShowMail = val" />
        </div>

        <!-- Use UTC Date Switch -->
        <div class="flex items-center justify-between py-1 border-b border-zinc-900">
          <div class="space-y-0.5">
            <Label class="text-sm font-semibold text-zinc-200">{{ t('useUTCDate') }}</Label>
            <p class="text-xs text-zinc-500">Display dates and times in UTC instead of local timezone.</p>
          </div>
          <Switch :checked="useUTCDate" @update:checked="(val) => useUTCDate = val" />
        </div>

        <!-- Use Side Margin Switch -->
        <div v-if="!isMobile" class="flex items-center justify-between py-1 border-b border-zinc-900">
          <div class="space-y-0.5">
            <Label class="text-sm font-semibold text-zinc-200">{{ t('useSideMargin') }}</Label>
            <p class="text-xs text-zinc-500">Add side paddings/margins in page containers.</p>
          </div>
          <Switch :checked="useSideMargin" @update:checked="(val) => useSideMargin = val" />
        </div>

        <!-- Global Tab Placement buttons -->
        <div class="space-y-2">
          <Label class="text-xs font-semibold text-zinc-400">{{ t('globalTabplacement') }}</Label>
          <div class="flex border border-zinc-800 rounded-lg p-0.5 bg-zinc-950 w-fit">
            <Button 
              v-for="placement in placements" 
              :key="placement.value" 
              size="sm"
              variant="ghost"
              type="button"
              class="h-8 text-xs font-semibold px-4 cursor-pointer transition-colors"
              :class="globalTabplacement === placement.value ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'"
              @click="globalTabplacement = placement.value"
            >
              {{ t(placement.value) || placement.label }}
            </Button>
          </div>
        </div>

      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
/* Custom range track adjustments if needed */
</style>
