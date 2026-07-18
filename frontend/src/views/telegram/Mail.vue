<script setup>
import { useRoute } from 'vue-router'
import { ref, onMounted, watch } from 'vue'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import { processItem } from '../../utils/email-parser'
import { utcToLocalDate } from '../../utils'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const { telegramApp, loading, useUTCDate } = useGlobalState()
const route = useRoute()

const curMail = ref({})
const showEMailTo = ref(true)

watch(telegramApp, async () => {
  if (telegramApp.value.initData) {
    curMail.value = await fetchMailData()
  }
})

const fetchMailData = async () => {
  try {
    const res = await api.fetch(`/telegram/get_mail`, {
      method: 'POST',
      body: JSON.stringify({
        initData: telegramApp.value.initData,
        mailId: route.query.mail_id
      })
    })
    loading.value = true
    return await processItem(res)
  } catch (error) {
    console.error(error)
    return {}
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  curMail.value = await fetchMailData()
})
</script>

<template>
  <div class="flex justify-center items-center h-[80vh] w-full text-left">
    <Card v-if="curMail.message" class="w-full max-w-3xl border-zinc-800 bg-card text-white h-full overflow-hidden flex flex-col">
      <CardContent class="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
        <!-- Badges header -->
        <div class="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-300 font-mono">ID: {{ curMail.id }}</Badge>
          <Badge variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-300">{{ utcToLocalDate(curMail.created_at, useUTCDate) }}</Badge>
          <Badge variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-300 truncate max-w-[200px]">FROM: {{ curMail.source }}</Badge>
          <Badge v-if="showEMailTo" variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-300 truncate max-w-[200px]">TO: {{ curMail.address }}</Badge>
        </div>

        <!-- iframe display -->
        <iframe :srcdoc="curMail.message" class="flex-1 w-full min-h-[400px] border-none rounded bg-white mt-2"></iframe>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
/* No styles needed, pure Tailwind */
</style>
