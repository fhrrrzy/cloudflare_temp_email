<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useScopedI18n } from '@/i18n/app'
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, ChevronDown } from 'lucide-vue-next'

const props = defineProps({
  fetchData: {
    type: Function,
    default: () => { },
    required: true
  },
  saveSettings: {
    type: Function,
    default: (webhookSettings: WebhookSettings) => { },
    required: true
  },
  testSettings: {
    type: Function,
    default: (webhookSettings: WebhookSettings) => { },
    required: true
  },
})

const { t } = useScopedI18n('components.WebhookComponent')

class WebhookSettings {
  enabled: boolean = false
  url: string = ''
  method: string = 'POST'
  headers: string = JSON.stringify({}, null, 2)
  body: string = JSON.stringify({}, null, 2)
}

interface WebhookPreset {
  name: string
  doc: string
  settings: WebhookSettings
}

const presets: WebhookPreset[] = [
  {
    name: 'Message Pusher',
    doc: 'https://github.com/songquanpeng/message-pusher',
    settings: {
      enabled: true,
      url: 'https://msgpusher.com/push/username',
      method: 'POST',
      headers: JSON.stringify({
        'Content-Type': 'application/json',
      }, null, 2),
      body: JSON.stringify({
        "token": "token",
        "title": "${subject}",
        "description": "${subject}",
        "content": "*${subject}*\n\nFrom: ${from}\nTo: ${to}\n\n${parsedText}\n"
      }, null, 2),
    },
  },
  {
    name: 'Bark',
    doc: 'https://github.com/Finb/Bark',
    settings: {
      enabled: true,
      url: 'https://api.day.app/YOUR_KEY',
      method: 'POST',
      headers: JSON.stringify({
        'Content-Type': 'application/json',
      }, null, 2),
      body: JSON.stringify({
        "title": "${subject}",
        "body": "From: ${from}\nTo: ${to}\n\n${parsedText}",
        "group": "email"
      }, null, 2),
    },
  },
  {
    name: 'ntfy',
    doc: 'https://docs.ntfy.sh/publish/',
    settings: {
      enabled: true,
      url: 'https://ntfy.sh/YOUR_TOPIC',
      method: 'POST',
      headers: JSON.stringify({
        'Content-Type': 'application/json',
      }, null, 2),
      body: JSON.stringify({
        "topic": "YOUR_TOPIC",
        "title": "${subject}",
        "message": "From: ${from}\nTo: ${to}\n\n${parsedText}",
        "tags": ["envelope"]
      }, null, 2),
    },
  },
  {
    name: 'Telegram Bot',
    doc: 'https://core.telegram.org/bots/api#sendmessage',
    settings: {
      enabled: true,
      url: 'https://api.telegram.org/botYOUR_BOT_TOKEN/sendMessage',
      method: 'POST',
      headers: JSON.stringify({
        'Content-Type': 'application/json',
      }, null, 2),
      body: JSON.stringify({
        "chat_id": "YOUR_CHAT_ID",
        "text": "New Email\nFrom: ${from}\nTo: ${to}\nSubject: ${subject}\nURL: ${url}"
      }, null, 2),
    },
  },
  {
    name: 'WeChat Work',
    doc: 'https://developer.work.weixin.qq.com/document/path/91770',
    settings: {
      enabled: true,
      url: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY',
      method: 'POST',
      headers: JSON.stringify({
        'Content-Type': 'application/json',
      }, null, 2),
      body: JSON.stringify({
        "msgtype": "text",
        "text": {
          "content": "New Email\nFrom: ${from}\nTo: ${to}\nSubject: ${subject}\nURL: ${url}"
        }
      }, null, 2),
    },
  },
  {
    name: 'Discord',
    doc: 'https://discord.com/developers/docs/resources/webhook',
    settings: {
      enabled: true,
      url: 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN',
      method: 'POST',
      headers: JSON.stringify({
        'Content-Type': 'application/json',
      }, null, 2),
      body: JSON.stringify({
        "content": "**New Email**\nFrom: ${from}\nTo: ${to}\nSubject: ${subject}\nURL: ${url}"
      }, null, 2),
    },
  },
]

const handlePresetSelect = (index: number) => {
  const preset = presets[index]
  if (!preset) {
    toast.error('Invalid preset')
    return
  }
  Object.assign(webhookSettings.value, JSON.parse(JSON.stringify(preset.settings)))
  toast.success(t('fillInDemoTip'))
  window.open(preset.doc, '_blank', 'noopener,noreferrer')
}

const webhookSettings = ref<WebhookSettings>(new WebhookSettings())
const enableWebhook = ref(false)

const fetchData = async () => {
  try {
    const res = await props.fetchData()
    Object.assign(webhookSettings.value, res)
    enableWebhook.value = true
  } catch (error) {
    toast.error((error as Error).message || "error");
  }
}

const saveSettings = async () => {
  if (!webhookSettings.value.url) {
    toast.error(t('urlMissing'))
    return
  }
  try {
    await props.saveSettings(webhookSettings.value)
    toast.success(t('successTip'))
  } catch (error) {
    toast.error((error as Error).message || "error");
  }
}

const testSettings = async () => {
  if (!webhookSettings.value.url) {
    toast.error(t('urlMissing'))
    return
  }
  try {
    await props.testSettings(webhookSettings.value)
    toast.success(t('successTip'))
  } catch (error) {
    toast.error((error as Error).message || "error");
  }
}

onMounted(async () => {
  await fetchData();
})
</script>

<template>
  <div class="flex justify-center w-full">
    <Card v-if="enableWebhook" class="w-full max-w-3xl border-zinc-800 bg-card text-white">
      <CardContent class="p-6 space-y-6">
        <!-- Toolbar actions -->
        <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-zinc-800">
          <div class="flex items-center gap-2">
            <span class="text-sm font-semibold text-zinc-300">{{ t('enable') }}</span>
            <Switch 
              :checked="webhookSettings.enabled" 
              @update:checked="(val: boolean) => webhookSettings.enabled = val" 
            />
          </div>
          
          <div class="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button variant="outline" size="sm" class="gap-1 bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800">
                  <span>{{ t('presets') }}</span>
                  <ChevronDown class="h-3.5 w-3.5 text-zinc-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" class="bg-zinc-900 border-zinc-800 text-zinc-300 w-48">
                <DropdownMenuItem 
                  v-for="(preset, idx) in presets" 
                  :key="idx" 
                  @select="handlePresetSelect(idx)"
                  class="focus:bg-zinc-800 focus:text-white cursor-pointer n-dropdown-option"
                >
                  {{ preset.name }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              v-if="webhookSettings.enabled" 
              @click="testSettings" 
              variant="secondary" 
              size="sm"
              class="bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
            >
              {{ t('test') }}
            </Button>
            
            <Button 
              @click="saveSettings" 
              class="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold"
              size="sm"
            >
              {{ t('save') }}
            </Button>
          </div>
        </div>

        <!-- Form fields -->
        <div v-if="webhookSettings.enabled" class="space-y-4 text-left">
          <div class="space-y-2">
            <Label for="webhook-url" class="text-xs font-semibold text-zinc-400">URL</Label>
            <Input 
              id="webhook-url" 
              v-model="webhookSettings.url" 
              placeholder="https://example.com/webhook"
              class="border-zinc-800 bg-zinc-900/50 text-white placeholder-zinc-600 focus:ring-1 focus:ring-emerald-500" 
            />
          </div>

          <div class="space-y-2">
            <Label for="webhook-method" class="text-xs font-semibold text-zinc-400">METHOD</Label>
            <Select v-model="webhookSettings.method">
              <SelectTrigger id="webhook-method" class="border-zinc-800 bg-zinc-900/50 text-white">
                <SelectValue placeholder="Select Method" />
              </SelectTrigger>
              <SelectContent class="border-zinc-800 bg-zinc-900 text-white">
                <SelectItem value="POST">POST</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label for="webhook-headers" class="text-xs font-semibold text-zinc-400">HEADERS</Label>
            <textarea 
              id="webhook-headers" 
              v-model="webhookSettings.headers" 
              rows="4"
              class="flex min-h-[80px] w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-white font-mono placeholder:text-zinc-650 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50" 
            />
          </div>

          <div class="space-y-2">
            <Label for="webhook-body" class="text-xs font-semibold text-zinc-400">BODY</Label>
            <textarea 
              id="webhook-body" 
              v-model="webhookSettings.body" 
              rows="6"
              class="flex min-h-[80px] w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-xs text-white font-mono placeholder:text-zinc-650 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50" 
            />
          </div>
        </div>
      </CardContent>
    </Card>

    <!-- Error/Not Enabled display -->
    <div 
      v-else 
      class="flex flex-col items-center justify-center p-12 text-center border border-dashed border-zinc-800 rounded-2xl bg-zinc-950/20 max-w-md w-full gap-3"
    >
      <AlertCircle class="h-10 w-10 text-zinc-600" />
      <h3 class="text-lg font-semibold text-zinc-300">404</h3>
      <p class="text-xs text-zinc-500">{{ t('notEnabled') }}</p>
    </div>
  </div>
</template>
