<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useScopedI18n } from '@/i18n/app'
import { toast } from 'vue-sonner'
import { Trash2, ArrowLeftRight } from 'lucide-vue-next'

// @ts-ignore
import { useGlobalState } from '../../store'
// @ts-ignore
import { api } from '../../api'
// @ts-ignore
import Login from '../common/Login.vue';

import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const { jwt, telegramApp } = useGlobalState()
const { t } = useScopedI18n('views.index.TelegramAddress')

interface TelegramAddressRow {
  address: string
  jwt: string
}

const data = ref<TelegramAddressRow[]>([]);
const tabValue = ref('address')

const fetchData = async () => {
  try {
    data.value = await api.fetch(`/telegram/get_bind_address`, {
      method: 'POST',
      body: JSON.stringify({
        initData: telegramApp.value.initData
      })
    });
  } catch (error) {
    toast.error((error as Error).message || "error");
  }
}

const newAddressPath = async (
  address_name: string,
  domain: string,
  cf_token: string,
  enableRandomSubdomain: boolean
) => {
  return await api.fetch("/telegram/new_address", {
    method: "POST",
    body: JSON.stringify({
      initData: telegramApp.value.initData,
      address: `${address_name}@${domain}`,
      cf_token: cf_token,
      enableRandomSubdomain,
    }),
  });
}

const bindAddress = async () => {
  try {
    await api.fetch(`/telegram/bind_address`, {
      method: 'POST',
      body: JSON.stringify({
        initData: telegramApp.value.initData,
        jwt: jwt.value
      })
    });
    toast.success(t('bindAddressSuccess'));
    await fetchData();
    tabValue.value = 'address';
  } catch (error) {
    toast.error((error as Error).message || "error");
  }
}

const changeMailAddress = (row: TelegramAddressRow) => {
  if (confirm(`${t('changeMailAddress')}?`)) {
    jwt.value = row.jwt
    location.reload()
  }
}

const unbindMailAddress = async (row: TelegramAddressRow) => {
  if (confirm(`${t('unbindMailAddress')}?`)) {
    try {
      await api.fetch(`/telegram/unbind_address`, {
        method: 'POST',
        body: JSON.stringify({
          initData: telegramApp.value.initData,
          address: row.address
        })
      });
      if (jwt.value === row.jwt) {
        jwt.value = ""
      }
      toast.success(t('success'));
      location.reload()
    } catch (error) {
      toast.error((error as Error).message || "error");
    }
  }
}

onMounted(async () => {
  if (!telegramApp.value?.initData || data.value.length > 0) {
    return
  }
  await fetchData()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Tabs -->
    <Tabs v-model="tabValue" class="w-full">
      <div class="border-b border-zinc-800 pb-2 mb-4">
        <TabsList class="bg-zinc-900 border border-zinc-800 text-zinc-400">
          <TabsTrigger value="address" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
            {{ t('address') }}
          </TabsTrigger>
          <TabsTrigger value="bind" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
            {{ t('bind') }}
          </TabsTrigger>
        </TabsList>
      </div>

      <!-- Address tab -->
      <TabsContent value="address" class="outline-none">
        <div class="rounded-xl border border-zinc-850 bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow class="hover:bg-transparent">
                <TableHead class="text-zinc-400 font-medium text-xs">{{ t('address') }}</TableHead>
                <TableHead class="text-zinc-400 font-medium text-xs text-right">{{ t('actions') }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="row in data" :key="row.jwt" class="border-zinc-850 hover:bg-zinc-900/10">
                <TableCell class="text-sm font-mono text-zinc-200">
                  {{ row.address }}
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                    <Button 
                      size="xs" 
                      variant="outline" 
                      @click="changeMailAddress(row)"
                      class="h-7 text-[11px] border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <ArrowLeftRight class="h-3 w-3 mr-1" />
                      {{ t('changeMailAddress') }}
                    </Button>
                    <Button 
                      size="xs" 
                      variant="destructive" 
                      @click="unbindMailAddress(row)"
                      class="h-7 text-[11px] font-semibold"
                    >
                      <Trash2 class="h-3 w-3 mr-1" />
                      {{ t('unbindMailAddress') }}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-if="data.length === 0">
                <TableCell colspan="2" class="text-center text-zinc-500 py-6 text-xs">
                  No addresses found
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <!-- Bind tab -->
      <TabsContent value="bind" class="outline-none">
        <div class="bg-zinc-900/10 border border-zinc-850 p-6 rounded-xl text-left">
          <Login :newAddressPath="newAddressPath" :bindUserAddress="bindAddress" />
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>

<style scoped>
/* No styles needed, pure Tailwind */
</style>
