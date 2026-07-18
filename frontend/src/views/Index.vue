<script setup>
import { defineAsyncComponent, onMounted, watch, ref, computed } from 'vue'
import { useScopedI18n } from '@/i18n/app'
import { useRoute } from 'vue-router'
import { Minimize2, Search, Mail } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import { useGlobalState } from '../store'
import { api } from '../api'
import { useIsMobile } from '../utils/composables'

import AddressBar from './index/AddressBar.vue';
import MailBox from '../components/MailBox.vue';
import SendBox from '../components/SendBox.vue';
import AutoReply from './index/AutoReply.vue';
import AccountSettings from './index/AccountSettings.vue';
import Appearance from './common/Appearance.vue';
import Webhook from './index/Webhook.vue';
import Attachment from './index/Attachment.vue';
import About from './common/About.vue';
import SimpleIndex from './index/SimpleIndex.vue';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const { loading, settings, openSettings, indexTab, globalTabplacement, useSimpleIndex } = useGlobalState()
const activeTab = computed({
  get: () => indexTab.value,
  set: (val) => { indexTab.value = val }
})
const route = useRoute()
const isMobile = useIsMobile()

const SendMail = defineAsyncComponent(() => {
  loading.value = true;
  return import('./index/SendMail.vue')
    .finally(() => loading.value = false);
});

const { t } = useScopedI18n('views.Index')

const fetchMailData = async (limit, offset) => {
  if (mailIdQuery.value > 0) {
    const singleMail = await api.fetch(`/api/mail/${mailIdQuery.value}`);
    if (singleMail) return { results: [singleMail], count: 1 };
    return { results: [], count: 0 };
  }
  return await api.fetch(`/api/mails?limit=${limit}&offset=${offset}`);
};

const deleteMail = async (curMailId) => {
  await api.fetch(`/api/mails/${curMailId}`, { method: 'DELETE' });
};

const deleteSenboxMail = async (curMailId) => {
  await api.fetch(`/api/sendbox/${curMailId}`, { method: 'DELETE' });
};

const fetchSenboxData = async (limit, offset) => {
  return await api.fetch(`/api/sendbox?limit=${limit}&offset=${offset}`);
};

const saveToS3 = async (mail_id, filename, blob) => {
  try {
    const { url } = await api.fetch(`/api/attachment/put_url`, {
      method: 'POST',
      body: JSON.stringify({ key: `${mail_id}/${filename}` })
    });
    // upload to s3 by formdata
    const formData = new FormData();
    formData.append(filename, blob);
    await fetch(url, {
      method: 'PUT',
      body: formData
    });
    toast.success(t('saveToS3Success'));
  } catch (error) {
    console.error(error);
    toast.error(error.message || "save to s3 error");
  }
}

const mailBoxKey = ref("")
const mailIdQuery = ref("")
const showMailIdQuery = ref(false)

const queryMail = () => {
  mailBoxKey.value = Date.now();
}

watch(route, () => {
  if (!route.query.mail_id) {
    showMailIdQuery.value = false;
    mailIdQuery.value = "";
    queryMail();
  }
})

onMounted(() => {
  if (route.query.mail_id) {
    showMailIdQuery.value = true;
    mailIdQuery.value = route.query.mail_id;
    queryMail();
  }
})
</script>

<template>
  <div>
    <div v-if="useSimpleIndex">
      <SimpleIndex />
    </div>
    <div v-else class="space-y-4">
      <AddressBar />
      
      <Tabs v-if="settings.address" v-model="activeTab" class="w-full">
        <div class="flex items-center justify-between border-b border-zinc-800 pb-2 mb-4">
          <TabsList class="bg-zinc-900 border border-zinc-800 text-zinc-400">
            <TabsTrigger value="mailbox" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
              {{ t('mailbox') }}
            </TabsTrigger>
            <TabsTrigger v-if="openSettings.enableSendMail" value="sendbox" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
              {{ t('sendbox') }}
            </TabsTrigger>
            <TabsTrigger v-if="openSettings.enableSendMail" value="sendmail" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
              {{ t('sendmail') }}
            </TabsTrigger>
            <TabsTrigger value="accountSettings" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
              {{ t('accountSettings') }}
            </TabsTrigger>
            <TabsTrigger value="appearance" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
              {{ t('appearance') }}
            </TabsTrigger>
            <TabsTrigger v-if="openSettings.enableAutoReply" value="auto_reply" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
              {{ t('auto_reply') }}
            </TabsTrigger>
            <TabsTrigger v-if="openSettings.enableWebhook" value="webhook" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
              {{ t('webhookSettings') }}
            </TabsTrigger>
            <TabsTrigger v-if="openSettings.isS3Enabled" value="s3_attachment" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
              {{ t('s3Attachment') }}
            </TabsTrigger>
            <TabsTrigger v-if="openSettings.enableIndexAbout" value="about" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
              {{ t('about') }}
            </TabsTrigger>
          </TabsList>
          
          <Button 
            v-if="!isMobile" 
            @click="useSimpleIndex = true" 
            variant="outline" 
            size="sm" 
            class="gap-1.5 bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
          >
            <Minimize2 class="h-3.5 w-3.5" />
            <span>{{ t('enterSimpleMode') }}</span>
          </Button>
        </div>

        <TabsContent value="mailbox" class="outline-none">
          <div v-if="showMailIdQuery" class="flex gap-2 mb-3 max-w-sm">
            <Input v-model="mailIdQuery" class="border-zinc-800 bg-zinc-900/50 text-white placeholder-zinc-500" />
            <Button @click="queryMail" class="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
              {{ t('query') }}
            </Button>
          </div>
          <MailBox 
            :key="mailBoxKey" 
            :showEMailTo="false" 
            :showReply="openSettings.enableSendMail" 
            :showSaveS3="openSettings.isS3Enabled"
            :saveToS3="saveToS3" 
            :enableUserDeleteEmail="openSettings.enableUserDeleteEmail"
            :fetchMailData="fetchMailData" 
            :deleteMail="deleteMail" 
            :showFilterInput="true" 
          />
        </TabsContent>

        <TabsContent value="sendbox" class="outline-none" v-if="openSettings.enableSendMail">
          <SendBox 
            :fetchMailData="fetchSenboxData" 
            :enableUserDeleteEmail="openSettings.enableUserDeleteEmail"
            :deleteMail="deleteSenboxMail" 
          />
        </TabsContent>

        <TabsContent value="sendmail" class="outline-none" v-if="openSettings.enableSendMail">
          <SendMail />
        </TabsContent>

        <TabsContent value="accountSettings" class="outline-none">
          <AccountSettings />
        </TabsContent>

        <TabsContent value="appearance" class="outline-none">
          <Appearance :showUseSimpleIndex="true" />
        </TabsContent>

        <TabsContent value="auto_reply" class="outline-none" v-if="openSettings.enableAutoReply">
          <AutoReply />
        </TabsContent>

        <TabsContent value="webhook" class="outline-none" v-if="openSettings.enableWebhook">
          <Webhook />
        </TabsContent>

        <TabsContent value="s3_attachment" class="outline-none" v-if="openSettings.isS3Enabled">
          <Attachment />
        </TabsContent>

        <TabsContent value="about" class="outline-none" v-if="openSettings.enableIndexAbout">
          <About />
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>
