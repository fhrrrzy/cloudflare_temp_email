<script setup>
import { computed, ref } from 'vue'
import { useScopedI18n } from '@/i18n/app'
import { ChevronDown, ExternalLink } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import { useGlobalState } from '../store'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const props = defineProps({
  show: {
    type: Boolean,
    default: false,
  },
  address: {
    type: String,
    default: '',
  },
  jwt: {
    type: String,
    default: '',
  },
  addressPassword: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:show'])

const { openSettings, auth } = useGlobalState()
const { locale, t } = useScopedI18n('components.AddressCredentialModal')

const modalShow = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE || ''
const frontendBaseUrl = computed(() => window.location.origin)
const apiBaseUrl = computed(() => (configuredApiBaseUrl || frontendBaseUrl.value).replace(/\/$/, ''))
const docLocale = computed(() => locale.value === 'zh' ? 'zh' : 'en')
const agentDocUrl = computed(() => `https://temp-mail-docs.awsl.uk/${docLocale.value}/guide/feature/agent-email.html`)
const smtpImapDocUrl = computed(() => `https://temp-mail-docs.awsl.uk/${docLocale.value}/guide/feature/config-smtp-proxy.html`)
const agentSkillUrl = 'https://github.com/dreamhunter2333/cloudflare_temp_email/blob/main/skills/cf-temp-mail-agent-mail/SKILL.md'
const autoLoginUrl = computed(() => `${frontendBaseUrl.value}/?jwt=${encodeURIComponent(props.jwt)}`)
const showAgent = computed(() => !!openSettings.value.enableAgentEmailInfo)
const smtpImapConfig = computed(() => openSettings.value.smtpImapProxyConfig || {})
const smtpConfig = computed(() => smtpImapConfig.value.smtp || {})
const imapConfig = computed(() => smtpImapConfig.value.imap || {})
const showSmtpImap = computed(() => !!smtpConfig.value.host || !!imapConfig.value.host)
const securityLabel = computed(() =>
  smtpConfig.value.starttls || imapConfig.value.starttls ? t('starttls') : t('plainOrProxyTls')
)
const agentConfigJson = computed(() => JSON.stringify({
  base: apiBaseUrl.value,
  jwt: props.jwt,
  site_password: auth.value || '',
}, null, 2))
const agentText = computed(() => [
  `${t('currentAddress')}: ${props.address || '-'}`,
  `${t('apiBase')}: ${apiBaseUrl.value}`,
  `${t('agentSkill')}: ${agentSkillUrl}`,
  `${t('agentConfig')}:`,
  agentConfigJson.value,
].join('\n'))
const smtpImapText = computed(() => [
  `${t('smtpHost')}: ${smtpConfig.value.host || '-'}`,
  `${t('smtpPort')}: ${smtpConfig.value.port || 8025}`,
  `${t('imapHost')}: ${imapConfig.value.host || '-'}`,
  `${t('imapPort')}: ${imapConfig.value.port || 11143}`,
  `${t('security')}: ${securityLabel.value}`,
  `${t('username')}: ${props.address || '-'}`,
  `${t('password')}: ${props.jwt}`,
].join('\n'))

const openItems = ref([])
const toggleItem = (name) => {
  if (openItems.value.includes(name)) {
    openItems.value = openItems.value.filter(item => item !== name)
  } else {
    openItems.value.push(name)
  }
}

const copyText = async (text) => {
  if (!text) return
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      toast.success(t('copySuccess'))
      return
    }

    const textarea = document.createElement('textarea')
    try {
      textarea.value = text
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      if (document.execCommand('copy')) {
        toast.success(t('copySuccess'))
        return
      }
      toast.error(t('copyFailed'))
    } finally {
      textarea.parentNode?.removeChild(textarea)
    }
  } catch (error) {
    console.error(error)
    toast.error(t('copyFailed'))
  }
}
</script>

<template>
  <Dialog v-model:open="modalShow">
    <DialogContent class="sm:max-w-2xl border-zinc-800 bg-zinc-950 text-white max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle class="text-lg font-bold text-white">{{ t('title') }}</DialogTitle>
        <DialogDescription class="text-xs text-zinc-400">
          {{ t('tip') }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6 my-4">
        <!-- Credential Block -->
        <section class="space-y-3">
          <h4 class="text-sm font-semibold text-zinc-200">{{ t('addressCredential') }}</h4>
          <div class="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/20 p-4">
            <div v-if="address" class="space-y-1">
              <span class="text-xs font-semibold text-zinc-400">{{ t('currentAddress') }}</span>
              <div class="flex items-center justify-between gap-3 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                <code class="text-xs font-mono text-emerald-400 break-all select-all">{{ address }}</code>
                <Button size="xs" variant="outline" class="h-7 text-[10px]" @click="copyText(address)">
                  {{ t('copySection') }}
                </Button>
              </div>
            </div>

            <div class="space-y-1">
              <span class="text-xs font-semibold text-zinc-400">{{ t('addressCredentialLabel') }}</span>
              <div class="flex items-center justify-between gap-3 bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                <code class="text-xs font-mono text-zinc-300 break-all select-all">{{ jwt }}</code>
                <Button size="xs" variant="outline" class="h-7 text-[10px]" @click="copyText(jwt)">
                  {{ t('copySection') }}
                </Button>
              </div>
            </div>

            <div v-if="addressPassword" class="space-y-1">
              <span class="text-xs font-semibold text-zinc-400">{{ t('addressPassword') }}</span>
              <div class="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                <code class="text-xs font-mono text-zinc-300 break-all select-all">{{ addressPassword }}</code>
              </div>
            </div>
          </div>
        </section>

        <!-- Collapsible Guides -->
        <div class="space-y-2 border-t border-zinc-800 pt-4">
          <!-- Guide 1: Agent Access -->
          <div v-if="showAgent" class="border border-zinc-850 rounded-xl overflow-hidden bg-zinc-900/10">
            <button 
              @click="toggleItem('agent')" 
              class="w-full flex items-center justify-between p-4 text-left font-semibold text-sm hover:bg-zinc-900 transition-colors"
            >
              <span class="text-zinc-200 text-xs font-bold uppercase tracking-wider">{{ t('agentAccess') }}</span>
              <div class="flex items-center gap-3">
                <Button size="xs" variant="outline" class="h-6 text-[10px] px-2 bg-zinc-950" @click.stop="copyText(agentText)">
                  {{ t('copySection') }}
                </Button>
                <ChevronDown class="h-4 w-4 text-zinc-400 transition-transform duration-200" :class="{ 'transform rotate-180': openItems.includes('agent') }" />
              </div>
            </button>
            <div v-show="openItems.includes('agent')" class="p-4 bg-zinc-950/40 border-t border-zinc-850 space-y-4">
              <p class="text-xs text-zinc-400 leading-relaxed">{{ t('agentAccessTip') }}</p>
              
              <div class="space-y-3">
                <div class="space-y-1">
                  <span class="text-[11px] font-semibold text-zinc-500">{{ t('apiBase') }}</span>
                  <code class="block text-xs font-mono text-zinc-300 bg-zinc-950 p-2 rounded-lg border border-zinc-850">{{ apiBaseUrl }}</code>
                </div>
                
                <div class="space-y-1">
                  <span class="text-[11px] font-semibold text-zinc-500">{{ t('agentSkill') }}</span>
                  <code class="block text-xs font-mono text-zinc-300 bg-zinc-950 p-2 rounded-lg border border-zinc-850">
                    <a :href="agentSkillUrl" target="_blank" rel="noopener noreferrer" class="text-emerald-400 hover:underline flex items-center gap-1">
                      {{ agentSkillUrl }} <ExternalLink class="h-3 w-3" />
                    </a>
                  </code>
                </div>
                
                <div class="space-y-1">
                  <span class="text-[11px] font-semibold text-zinc-500">{{ t('agentConfig') }}</span>
                  <pre class="text-xs font-mono text-zinc-300 bg-zinc-950 p-3 rounded-lg border border-zinc-850 overflow-x-auto whitespace-pre-wrap">{{ agentConfigJson }}</pre>
                </div>
              </div>

              <div class="flex justify-end">
                <Button variant="link" size="sm" as-child class="text-emerald-400 hover:text-emerald-300 p-0 h-auto">
                  <a :href="agentDocUrl" target="_blank" rel="noopener noreferrer" class="gap-1">
                    {{ t('docs') }} <ExternalLink class="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <!-- Guide 2: SMTP / IMAP -->
          <div v-if="showSmtpImap" class="border border-zinc-850 rounded-xl overflow-hidden bg-zinc-900/10">
            <button 
              @click="toggleItem('smtp-imap')" 
              class="w-full flex items-center justify-between p-4 text-left font-semibold text-sm hover:bg-zinc-900 transition-colors"
            >
              <span class="text-zinc-200 text-xs font-bold uppercase tracking-wider">{{ t('smtpImapAccess') }}</span>
              <div class="flex items-center gap-3">
                <Button size="xs" variant="outline" class="h-6 text-[10px] px-2 bg-zinc-950" @click.stop="copyText(smtpImapText)">
                  {{ t('copySection') }}
                </Button>
                <ChevronDown class="h-4 w-4 text-zinc-400 transition-transform duration-200" :class="{ 'transform rotate-180': openItems.includes('smtp-imap') }" />
              </div>
            </button>
            <div v-show="openItems.includes('smtp-imap')" class="p-4 bg-zinc-950/40 border-t border-zinc-850 space-y-4">
              <p class="text-xs text-zinc-400 leading-relaxed">{{ t('smtpImapTip') }}</p>
              
              <div class="grid grid-cols-2 gap-3">
                <div class="space-y-1">
                  <span class="text-[11px] font-semibold text-zinc-500">{{ t('smtpHost') }}</span>
                  <code class="block text-xs font-mono text-zinc-300 bg-zinc-950 p-2 rounded-lg border border-zinc-850">{{ smtpConfig.host || '-' }}</code>
                </div>
                <div class="space-y-1">
                  <span class="text-[11px] font-semibold text-zinc-500">{{ t('smtpPort') }}</span>
                  <code class="block text-xs font-mono text-zinc-300 bg-zinc-950 p-2 rounded-lg border border-zinc-850">{{ smtpConfig.port || 8025 }}</code>
                </div>
                <div class="space-y-1">
                  <span class="text-[11px] font-semibold text-zinc-500">{{ t('imapHost') }}</span>
                  <code class="block text-xs font-mono text-zinc-300 bg-zinc-950 p-2 rounded-lg border border-zinc-850">{{ imapConfig.host || '-' }}</code>
                </div>
                <div class="space-y-1">
                  <span class="text-[11px] font-semibold text-zinc-500">{{ t('imapPort') }}</span>
                  <code class="block text-xs font-mono text-zinc-300 bg-zinc-950 p-2 rounded-lg border border-zinc-850">{{ imapConfig.port || 11143 }}</code>
                </div>
              </div>

              <div class="space-y-3">
                <div class="space-y-1">
                  <span class="text-[11px] font-semibold text-zinc-500">{{ t('security') }}</span>
                  <code class="block text-xs font-mono text-zinc-300 bg-zinc-950 p-2 rounded-lg border border-zinc-850">{{ securityLabel }}</code>
                </div>
                <div class="space-y-1">
                  <span class="text-[11px] font-semibold text-zinc-500">{{ t('username') }}</span>
                  <code class="block text-xs font-mono text-zinc-300 bg-zinc-950 p-2 rounded-lg border border-zinc-850">{{ address }}</code>
                </div>
                <div class="space-y-1">
                  <span class="text-[11px] font-semibold text-zinc-500">{{ t('password') }}</span>
                  <code class="block text-xs font-mono text-zinc-300 bg-zinc-950 p-2 rounded-lg border border-zinc-850 select-all break-all">{{ jwt }}</code>
                </div>
              </div>

              <div class="flex justify-end">
                <Button variant="link" size="sm" as-child class="text-emerald-400 hover:text-emerald-300 p-0 h-auto">
                  <a :href="smtpImapDocUrl" target="_blank" rel="noopener noreferrer" class="gap-1">
                    {{ t('docs') }} <ExternalLink class="h-3.5 w-3.5" />
                  </a>
                </Button>
              </div>
            </div>
          </div>

          <!-- Guide 3: Share Link -->
          <div class="border border-zinc-850 rounded-xl overflow-hidden bg-zinc-900/10">
            <button 
              @click="toggleItem('share-link')" 
              class="w-full flex items-center justify-between p-4 text-left font-semibold text-sm hover:bg-zinc-900 transition-colors"
            >
              <span class="text-zinc-200 text-xs font-bold uppercase tracking-wider">{{ t('autoLoginLink') }}</span>
              <div class="flex items-center gap-3">
                <Button size="xs" variant="outline" class="h-6 text-[10px] px-2 bg-zinc-950" @click.stop="copyText(autoLoginUrl)">
                  {{ t('copySection') }}
                </Button>
                <ChevronDown class="h-4 w-4 text-zinc-400 transition-transform duration-200" :class="{ 'transform rotate-180': openItems.includes('share-link') }" />
              </div>
            </button>
            <div v-show="openItems.includes('share-link')" class="p-4 bg-zinc-950/40 border-t border-zinc-850">
              <code class="block text-xs font-mono text-emerald-400 bg-zinc-950 p-2.5 rounded-lg border border-zinc-850 break-all select-all">{{ autoLoginUrl }}</code>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button @click="modalShow = false" class="bg-zinc-800 hover:bg-zinc-700 text-white font-semibold w-full sm:w-auto">
          Close
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
