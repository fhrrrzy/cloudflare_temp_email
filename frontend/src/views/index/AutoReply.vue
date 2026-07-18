<script setup>
import { useScopedI18n } from '@/i18n/app'
import { onMounted, ref } from 'vue'
import { Save, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const sourcePrefix = ref("")
const enableAutoReply = ref(false)
const autoReplyMessage = ref("")
const subject = ref("")
const name = ref("")
const saving = ref(false)

const { settings } = useGlobalState()
const { t } = useScopedI18n('views.index.AutoReply')

const fetchData = async () => {
  try {
    const res = await api.fetch("/api/auto_reply")
    sourcePrefix.value = res.source_prefix || ""
    enableAutoReply.value = res.enabled || false
    name.value = res.name || ""
    autoReplyMessage.value = res.message || ""
    subject.value = res.subject || ""
  } catch (error) {
    toast.error(error.message || "error");
  }
}

const saveData = async () => {
  saving.value = true
  try {
    await api.fetch("/api/auto_reply", {
      method: "POST",
      body: JSON.stringify({
        auto_reply: {
          enabled: enableAutoReply.value,
          source_prefix: sourcePrefix.value,
          name: name.value,
          message: autoReplyMessage.value,
          subject: subject.value,
        }
      })
    })
    toast.success(t("success"))
  } catch (error) {
    toast.error(error.message || "error");
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await fetchData()
})
</script>

<template>
  <div class="flex justify-center w-full" v-if="settings.address">
    <Card class="w-full max-w-3xl border-zinc-800 bg-card text-white">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-zinc-800">
        <CardTitle class="text-lg font-bold text-white">{{ t("settings") }}</CardTitle>
        <Button 
          @click="saveData" 
          :disabled="saving"
          class="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold gap-1.5"
        >
          <Save class="h-4 w-4" v-if="!saving" />
          <Loader2 class="h-4 w-4 animate-spin" v-else />
          <span>{{ t('save') }}</span>
        </Button>
      </CardHeader>
      
      <CardContent class="p-6">
        <form @submit.prevent class="space-y-6 text-left">
          <!-- Enable Switch -->
          <div class="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
            <div class="space-y-0.5">
              <Label class="text-sm font-semibold text-zinc-200">{{ t('enableAutoReply') }}</Label>
              <p class="text-xs text-zinc-500">Toggle whether emails are auto-responded.</p>
            </div>
            <Switch 
              :checked="enableAutoReply" 
              @update:checked="(val) => enableAutoReply = val" 
            />
          </div>

          <!-- Name -->
          <div class="space-y-2">
            <Label for="auto-reply-name" class="text-xs font-semibold text-zinc-400">{{ t('name') }}</Label>
            <Input 
              id="auto-reply-name" 
              v-model="name" 
              :disabled="!enableAutoReply"
              class="border-zinc-800 bg-zinc-900/50 text-white placeholder-zinc-550 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed" 
            />
          </div>

          <!-- Source Prefix -->
          <div class="space-y-2">
            <Label for="auto-reply-prefix" class="text-xs font-semibold text-zinc-400">{{ t('sourcePrefix') }}</Label>
            <Input 
              id="auto-reply-prefix" 
              v-model="sourcePrefix" 
              :disabled="!enableAutoReply"
              :placeholder="t('sourcePrefixPlaceholder')"
              class="border-zinc-800 bg-zinc-900/50 text-white placeholder-zinc-550 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed" 
            />
          </div>

          <!-- Subject -->
          <div class="space-y-2">
            <Label for="auto-reply-subject" class="text-xs font-semibold text-zinc-400">{{ t('subject') }}</Label>
            <Input 
              id="auto-reply-subject" 
              v-model="subject" 
              :disabled="!enableAutoReply"
              class="border-zinc-800 bg-zinc-900/50 text-white placeholder-zinc-550 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed" 
            />
          </div>

          <!-- Auto Reply Message Content -->
          <div class="space-y-2">
            <Label for="auto-reply-msg" class="text-xs font-semibold text-zinc-400">{{ t('autoReply') }}</Label>
            <textarea 
              id="auto-reply-msg" 
              v-model="autoReplyMessage" 
              :disabled="!enableAutoReply"
              rows="6"
              class="flex min-h-[80px] w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white placeholder:text-zinc-650 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50" 
            />
          </div>
        </form>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
/* Scoped adjustments */
</style>
