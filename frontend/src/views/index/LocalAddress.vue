<script setup lang="ts">
import { ref, computed } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import { useScopedI18n } from '@/i18n/app'
import { toast } from 'vue-sonner'
import { AlertCircle, Trash2, ArrowLeftRight } from 'lucide-vue-next'

// @ts-ignore
import { useGlobalState } from '../../store'
// @ts-ignore
import Login from '../common/Login.vue';
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const { jwt } = useGlobalState()
const { t } = useScopedI18n('views.index.LocalAddress')

const tabValue = ref('address')
const localAddressCache = useLocalStorage("LocalAddressCache", []);

interface LocalAddressRow {
  valid: boolean
  address: string
  jwt: string
}

const data = computed<LocalAddressRow[]>(() => {
  // @ts-ignore
  if (jwt.value && !localAddressCache.value.includes(jwt.value)) {
    // @ts-ignore
    localAddressCache.value.push(jwt.value)
  }
  return localAddressCache.value.map((curJwt: string) => {
    try {
      const payload = JSON.parse(
        decodeURIComponent(
          atob(curJwt.split(".")[1]
            .replace(/-/g, "+").replace(/_/g, "/")
          )
        )
      );
      return {
        valid: true,
        address: payload.address,
        jwt: curJwt
      }
    } catch (e) {
      return {
        valid: false,
        address: `invalid jwt [${curJwt}]`,
        jwt: curJwt
      }
    }
  })
})

const bindAddress = async () => {
  try {
    // @ts-ignore
    if (!localAddressCache.value.includes(jwt.value)) {
      // @ts-ignore
      localAddressCache.value.push(jwt.value)
    }
    tabValue.value = 'address'
    toast.success(t('bindAddressSuccess'));
  } catch (error) {
    toast.error((error as Error).message || "error");
  }
}

const changeMailAddress = (row: LocalAddressRow) => {
  if (confirm(`${t('changeMailAddress')}?`)) {
    jwt.value = row.jwt
    location.reload()
  }
}

const unbindMailAddress = (row: LocalAddressRow) => {
  if (jwt.value === row.jwt) return;
  if (confirm(`${t('unbindMailAddress')}?`)) {
    localAddressCache.value = localAddressCache.value.filter(
      (curJwt: string) => curJwt !== row.jwt
    );
    toast.success(t('success'));
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Warning Alert banner -->
    <div class="flex items-center gap-2.5 rounded-xl border border-yellow-950/20 bg-yellow-950/10 p-4 text-xs text-yellow-400">
      <AlertCircle class="h-4 w-4 shrink-0" />
      <span>{{ t('tip') }}</span>
    </div>

    <!-- Tabs -->
    <Tabs v-model="tabValue" class="w-full">
      <div class="border-b border-zinc-800 pb-2 mb-4">
        <TabsList class="bg-zinc-900 border border-zinc-800 text-zinc-400">
          <TabsTrigger value="address" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
            {{ t('address') }}
          </TabsTrigger>
          <TabsTrigger value="create_or_bind" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
            {{ t('create_or_bind') }}
          </TabsTrigger>
        </TabsList>
      </div>

      <!-- Address list tab -->
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
                      :disabled="jwt === row.jwt"
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

      <!-- Create / Bind tab -->
      <TabsContent value="create_or_bind" class="outline-none">
        <div class="bg-zinc-900/10 border border-zinc-850 p-6 rounded-xl text-left">
          <Login :bindUserAddress="bindAddress" />
        </div>
      </TabsContent>
    </Tabs>
  </div>
</template>

<style scoped>
/* No styles needed, pure Tailwind */
</style>
