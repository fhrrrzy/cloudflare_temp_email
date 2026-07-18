<script setup>
import { ref, onMounted } from 'vue';
import { useScopedI18n } from '@/i18n/app'
import { useRouter } from 'vue-router';
import { toast } from 'vue-sonner'
import { ArrowLeftRight, Send, Trash2, ShieldAlert } from 'lucide-vue-next'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import { getRouterPathWithLang } from '../../utils'

import Login from '../common/Login.vue';
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const { jwt, loading } = useGlobalState()
const router = useRouter()

const { locale, t } = useScopedI18n('views.user.AddressManagement')

const data = ref([])
const showTransferAddress = ref(false)
const currentAddress = ref("")
const currentAddressId = ref(0)
const targetUserEmail = ref('')
const tabValue = ref('address')

const changeMailAddress = async (address_id) => {
  if (!confirm(`${t('changeMailAddress')}?`)) return;
  try {
    const res = await api.fetch(`/user_api/bind_address_jwt/${address_id}`);
    toast.success(t('changeMailAddress') + " " + t('success'));
    if (!res.jwt) {
      toast.error("jwt not found");
      return;
    }
    jwt.value = res.jwt;
    await router.push(getRouterPathWithLang("/", locale.value))
    location.reload();
  } catch (error) {
    console.log(error)
    toast.error(error.message || "error");
  }
}

const unbindAddress = async (address_id) => {
  if (!confirm(t('unbindAddressTip'))) return;
  try {
    await api.fetch(`/user_api/unbind_address`, {
      method: 'POST',
      body: JSON.stringify({ address_id })
    });
    toast.success(t('unbindAddress') + " " + t('success'));
    await fetchData();
  } catch (error) {
    console.log(error)
    toast.error(error.message || "error");
  }
}

const transferAddress = async () => {
  if (!targetUserEmail.value) {
    toast.error("targetUserEmail is required");
    return;
  }
  if (!currentAddressId.value) {
    toast.error("currentAddressId is required");
    return;
  }
  try {
    await api.fetch(`/user_api/transfer_address`, {
      method: 'POST',
      body: JSON.stringify({
        address_id: currentAddressId.value,
        target_user_email: targetUserEmail.value
      })
    });
    toast.success(t('transferAddress') + " " + t('success'));
    await fetchData();
    showTransferAddress.value = false;
    currentAddressId.value = 0;
    currentAddress.value = "";
    targetUserEmail.value = "";
  } catch (error) {
    console.log(error)
    toast.error(error.message || "error");
  }
}

const fetchData = async () => {
  try {
    const { results } = await api.fetch(
      `/user_api/bind_address`
    );
    data.value = results || [];
  } catch (error) {
    console.log(error)
    toast.error(error.message || "error");
  }
}

onMounted(async () => {
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
          <TabsTrigger value="create_or_bind" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
            {{ t('create_or_bind') }}
          </TabsTrigger>
        </TabsList>
      </div>

      <!-- Address Tab Content -->
      <TabsContent value="address" class="outline-none">
        <div class="rounded-xl border border-zinc-850 bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow class="hover:bg-transparent">
                <TableHead class="text-zinc-400 font-medium text-xs">{{ t('name') }}</TableHead>
                <TableHead class="text-zinc-400 font-medium text-xs">{{ t('mail_count') }}</TableHead>
                <TableHead class="text-zinc-400 font-medium text-xs">{{ t('send_count') }}</TableHead>
                <TableHead class="text-zinc-400 font-medium text-xs text-right">{{ t('actions') }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="row in data" :key="row.id" class="border-zinc-850 hover:bg-zinc-900/10">
                <TableCell class="text-sm font-mono text-zinc-200">
                  {{ row.name }}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" class="bg-emerald-500/10 border-emerald-500/25 text-emerald-400 font-mono">
                    {{ row.mail_count }}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" class="bg-emerald-500/10 border-emerald-500/25 text-emerald-400 font-mono">
                    {{ row.send_count }}
                  </Badge>
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                    <!-- Change Address -->
                    <Button 
                      size="xs" 
                      variant="outline" 
                      @click="changeMailAddress(row.id)"
                      class="h-7 text-[11px] border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                    >
                      <ArrowLeftRight class="h-3 w-3 mr-1" />
                      {{ t('changeMailAddress') }}
                    </Button>
                    
                    <!-- Transfer Address -->
                    <Button 
                      size="xs" 
                      variant="outline" 
                      @click="() => {
                        currentAddressId.value = row.id;
                        currentAddress.value = row.name;
                        showTransferAddress = true;
                      }"
                      class="h-7 text-[11px] border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                    >
                      <Send class="h-3 w-3 mr-1" />
                      {{ t('transferAddress') }}
                    </Button>

                    <!-- Unbind Address -->
                    <Button 
                      size="xs" 
                      variant="destructive" 
                      @click="unbindAddress(row.id)"
                      class="h-7 text-[11px] font-semibold"
                    >
                      <Trash2 class="h-3 w-3 mr-1" />
                      {{ t('unbindAddress') }}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-if="data.length === 0">
                <TableCell colspan="4" class="text-center text-zinc-500 py-6 text-xs">
                  No addresses binded yet.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      <!-- Create / Bind Tab Content -->
      <TabsContent value="create_or_bind" class="outline-none">
        <div class="bg-zinc-900/10 border border-zinc-850 p-6 rounded-xl">
          <Login />
        </div>
      </TabsContent>
    </Tabs>

    <!-- Transfer Address Dialog -->
    <Dialog v-model:open="showTransferAddress">
      <DialogContent class="sm:max-w-md border-zinc-800 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold text-white">{{ t('transferAddress') }}</DialogTitle>
          <DialogDescription class="text-xs text-zinc-400">
            {{ t("transferAddressTip") }}
          </DialogDescription>
        </DialogHeader>
        <div class="py-4 space-y-4 text-left">
          <div class="bg-zinc-900 border border-zinc-850 px-3 py-2 rounded-lg text-xs">
            <span class="text-zinc-400 font-semibold">{{ t('transferAddress') }}:</span>
            <span class="font-mono text-emerald-400 ml-1.5">{{ currentAddress }}</span>
          </div>

          <div class="space-y-2">
            <Label for="target-user-email" class="text-xs font-semibold text-zinc-400">{{ t('targetUserEmail') }}</Label>
            <Input 
              id="target-user-email" 
              v-model="targetUserEmail" 
              placeholder="target@example.com"
              class="border-zinc-800 bg-zinc-900/50 text-white" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button 
            :disabled="loading" 
            @click="transferAddress" 
            variant="destructive" 
            class="w-full font-semibold"
          >
            {{ t('transferAddress') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
/* No styles needed, pure Tailwind */
</style>
