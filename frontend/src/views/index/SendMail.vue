<script setup>
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { useScopedI18n } from '@/i18n/app'
import { onMounted, onBeforeUnmount, ref, shallowRef } from 'vue'
import AdminContact from '../common/AdminContact.vue'
import { AlertCircle, AlertTriangle, Send, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

const isPreview = ref(false)
const editorRef = shallowRef()
const sending = ref(false)

const { settings, sendMailModel, indexTab, userSettings } = useGlobalState()
const { t } = useScopedI18n('views.index.SendMail')

const contentTypes = [
  { label: t('text'), value: 'text' },
  { label: t('html'), value: 'html' },
  { label: t('rich text'), value: 'rich' },
]

const normalizeSendMailText = (content) => {
  return content
    .replace(/[\u00AD\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

const hasSendMailContent = (content, contentType) => {
  if (typeof content !== 'string' || !content) {
    return false
  }

  if (contentType === 'text') {
    return normalizeSendMailText(content).length > 0
  }

  const container = document.createElement('div')
  container.innerHTML = content
  container.querySelectorAll('script, style, noscript, template').forEach((node) => node.remove())

  const plainContent = normalizeSendMailText(container.textContent ?? '')
  if (plainContent.length > 0) {
    return true
  }

  return Boolean(container.querySelector('img, audio, video, iframe, svg, canvas, table'))
}

const send = async () => {
  if (sending.value) {
    return
  }

  const subject = `${sendMailModel.value.subject ?? ''}`.trim()
  const toMail = `${sendMailModel.value.toMail ?? ''}`.trim()
  const content = `${sendMailModel.value.content ?? ''}`

  if (!subject) {
    toast.error(t('subjectEmpty'))
    return
  }
  if (!toMail) {
    toast.error(t('toMailEmpty'))
    return
  }
  if (!hasSendMailContent(content, sendMailModel.value.contentType)) {
    toast.error(t('contentEmpty'))
    return
  }

  const payload = {
    from_name: sendMailModel.value.fromName,
    to_name: sendMailModel.value.toName,
    to_mail: toMail,
    subject,
    is_html: sendMailModel.value.contentType != 'text',
    content,
  }

  sending.value = true
  try {
    await api.fetch(`/api/send_mail`, {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    sendMailModel.value = {
      fromName: "",
      toName: "",
      toMail: "",
      subject: "",
      contentType: 'text',
      content: "",
    }
    isPreview.value = false
    toast.success(t("successSend"));
    indexTab.value = 'sendbox'
  } catch (error) {
    toast.error(error.message || "error");
  } finally {
    sending.value = false
  }
}

const requestAccess = async () => {
  try {
    await api.fetch(`/api/request_send_mail_access`, {
      method: 'POST',
      body: JSON.stringify({})
    })
    toast.success(t("success"))
    await api.getSettings();
  } catch (error) {
    toast.error(error.message || "error");
  }
}

const toolbarConfig = {
  excludeKeys: ["uploadVideo"]
}

const editorConfig = {
  MENU_CONF: {
    'uploadImage': {
      async customUpload() {
        toast.error(t('tooLarge'))
      },
      maxFileSize: 1 * 1024 * 1024,
      base64LimitSize: 1 * 1024 * 1024,
    }
  }
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})

const handleCreated = (editor) => {
  editorRef.value = editor;
}

onMounted(async () => {
  if (!userSettings.value.user_id) await api.getUserSettings();
  await api.getSettings();
})
</script>

<template>
  <div class="flex justify-center w-full" v-if="settings.address">
    <Card class="w-full max-w-3xl border-zinc-800 bg-card text-white">
      <CardContent class="p-6 space-y-6">
        <!-- If balance is empty -->
        <div v-if="!settings.send_balance || settings.send_balance <= 0" class="space-y-4">
          <div class="flex flex-col gap-3 rounded-xl border border-yellow-950/20 bg-yellow-950/10 p-4 text-xs text-yellow-400 text-left">
            <div class="flex items-center gap-2">
              <AlertTriangle class="h-4 w-4 shrink-0" />
              <span>{{ t('requestAccessTip') }}</span>
            </div>
            <Button 
              type="button" 
              size="sm" 
              @click="requestAccess" 
              class="w-fit bg-emerald-500 hover:bg-emerald-600 text-white font-semibold mt-1"
            >
              {{ t('requestAccess') }}
            </Button>
          </div>
          <AdminContact />
        </div>

        <!-- Sending allowed -->
        <div v-else class="space-y-6">
          <div class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div class="flex items-center gap-2.5 rounded-lg border border-emerald-950/25 bg-emerald-950/15 px-3 py-2 text-xs text-emerald-400">
              <AlertCircle class="h-4 w-4 shrink-0" />
              <span>{{ t('send_balance') }}: {{ settings.send_balance }}</span>
            </div>

            <Button 
              @click="send" 
              :disabled="sending" 
              class="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold gap-1.5"
            >
              <Send class="h-3.5 w-3.5" v-if="!sending" />
              <Loader2 class="h-3.5 w-3.5 animate-spin" v-else />
              <span>{{ t('send') }}</span>
            </Button>
          </div>

          <form @submit.prevent class="space-y-4 text-left">
            <!-- From Name & Address -->
            <div class="space-y-2">
              <Label class="text-xs font-semibold text-zinc-400">{{ t('fromName') }}</Label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input 
                  v-model="sendMailModel.fromName" 
                  placeholder="Sender Display Name"
                  class="border-zinc-800 bg-zinc-900/50 text-white placeholder-zinc-650"
                />
                <Input 
                  :value="settings.address" 
                  disabled 
                  class="border-zinc-850 bg-zinc-950 text-zinc-500 cursor-not-allowed"
                />
              </div>
            </div>

            <!-- To Name & Address -->
            <div class="space-y-2">
              <Label class="text-xs font-semibold text-zinc-400">{{ t('toName') }} / {{ t('toMailEmpty') }}</Label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Input 
                  v-model="sendMailModel.toName" 
                  placeholder="Recipient Name"
                  class="border-zinc-800 bg-zinc-900/50 text-white placeholder-zinc-650"
                />
                <Input 
                  v-model="sendMailModel.toMail" 
                  placeholder="recipient@example.com"
                  required
                  class="border-zinc-800 bg-zinc-900/50 text-white placeholder-zinc-650"
                />
              </div>
            </div>

            <!-- Subject -->
            <div class="space-y-2">
              <Label for="send-subject" class="text-xs font-semibold text-zinc-400">{{ t('subject') }}</Label>
              <Input 
                id="send-subject" 
                v-model="sendMailModel.subject" 
                required
                class="border-zinc-800 bg-zinc-900/50 text-white focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <!-- Options (Content Type & Preview) -->
            <div class="space-y-2">
              <Label class="text-xs font-semibold text-zinc-400">{{ t('options') }}</Label>
              <div class="flex items-center gap-3">
                <!-- Toggle selector -->
                <div class="flex border border-zinc-800 rounded-lg p-0.5 bg-zinc-950 w-fit shrink-0">
                  <Button 
                    v-for="opt in contentTypes" 
                    :key="opt.value" 
                    size="sm"
                    variant="ghost"
                    type="button"
                    class="h-8 text-xs font-semibold px-4 cursor-pointer transition-colors"
                    :class="sendMailModel.contentType === opt.value ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'"
                    @click="sendMailModel.contentType = opt.value"
                  >
                    {{ opt.label }}
                  </Button>
                </div>

                <Button 
                  v-if="sendMailModel.contentType !== 'text'" 
                  @click="isPreview = !isPreview"
                  variant="outline"
                  size="sm"
                  class="h-9 border-zinc-800 text-zinc-300"
                >
                  {{ isPreview ? t('edit') : t('preview') }}
                </Button>
              </div>
            </div>

            <!-- Content Area -->
            <div class="space-y-2">
              <Label class="text-xs font-semibold text-zinc-400">{{ t('content') }}</Label>
              
              <!-- HTML Preview -->
              <div v-if="isPreview" class="rounded-lg border border-zinc-800 bg-zinc-950 p-4 min-h-[120px] max-h-[500px] overflow-y-auto">
                <div v-html="sendMailModel.content" class="text-sm prose prose-invert max-w-none" />
              </div>

              <!-- Rich Text Editor -->
              <div v-else-if="sendMailModel.contentType === 'rich'" class="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
                <Toolbar 
                  style="border-bottom: 1px solid #27272a" 
                  :defaultConfig="toolbarConfig"
                  :editor="editorRef" 
                  mode="default" 
                />
                <Editor 
                  style="height: 400px; overflow-y: hidden; background: transparent; color: white" 
                  v-model="sendMailModel.content"
                  :defaultConfig="editorConfig" 
                  mode="default" 
                  @onCreated="handleCreated" 
                />
              </div>

              <!-- Standard Textarea -->
              <textarea 
                v-else 
                v-model="sendMailModel.content" 
                rows="8"
                class="flex min-h-[80px] w-full rounded-md border border-zinc-800 bg-zinc-900/50 px-3 py-2 text-sm text-white placeholder:text-zinc-650 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 font-sans" 
              />
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
/* Scoped adjustments */
</style>
