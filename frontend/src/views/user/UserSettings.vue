<script setup>
import { ref } from 'vue'
import { useScopedI18n } from '@/i18n/app'
import { startRegistration } from '@simplewebauthn/browser';
import { toast } from 'vue-sonner'
import { 
  Key, Plus, LogOut, Info, Edit, Trash2 
} from 'lucide-vue-next'

import { useGlobalState } from '../../store'
import { api } from '../../api'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'

const { userJwt, userSettings, loading } = useGlobalState()

const showLogout = ref(false)
const showCreatePasskey = ref(false)
const passkeyName = ref('')
const showPasskeyList = ref(false)
const showRenamePasskey = ref(false)
const currentPasskeyId = ref(null)
const currentPasskeyName = ref('')
const passkeyData = ref([])

const { t } = useScopedI18n('views.user.UserSettings')

const logout = async () => {
  userJwt.value = '';
  location.reload()
}

const createPasskey = async () => {
  try {
    const options = await api.fetch(`/user_api/passkey/register_request`, {
      method: 'POST',
      body: JSON.stringify({
        domain: location.hostname,
      })
    })
    const credential = await startRegistration({ optionsJSON: options })

    await api.fetch(`/user_api/passkey/register_response`, {
      method: 'POST',
      body: JSON.stringify({
        origin: location.origin,
        passkey_name: passkeyName.value || (
          (window.navigator.userAgentData?.platform || "Unknown")
          + ": " + Math.random().toString(36).substring(7)
        ),
        credential
      })
    })
    toast.success(t('passkeyCreated'));
  } catch (e) {
    console.error(e)
    toast.error(e.message)
  } finally {
    passkeyName.value = ''
    showCreatePasskey.value = false
  }
}

const fetchPasskeyList = async () => {
  try {
    const data = await api.fetch(`/user_api/passkey`)
    passkeyData.value = data || []
  } catch (e) {
    console.error(e)
    toast.error(e.message)
  }
}

const renamePasskey = async () => {
  try {
    await api.fetch(`/user_api/passkey/rename`, {
      method: 'POST',
      body: JSON.stringify({
        passkey_name: currentPasskeyName.value,
        passkey_id: currentPasskeyId.value
      })
    })
    await fetchPasskeyList()
  } catch (e) {
    console.error(e)
    toast.error(e.message)
  } finally {
    currentPasskeyName.value = ''
    showRenamePasskey.value = false
  }
}

const deletePasskey = async (passkey_id) => {
  if (confirm(`${t('deletePasskey')}?`)) {
    try {
      await api.fetch(`/user_api/passkey/${passkey_id}`, {
        method: 'DELETE'
      })
      toast.success(t('success'))
      await fetchPasskeyList()
    } catch (e) {
      console.error(e)
      toast.error(e.message)
    }
  }
}
</script>

<template>
  <div class="flex justify-center w-full" v-if="userSettings.user_email">
    <Card class="w-full max-w-3xl border-zinc-800 bg-card text-white">
      <CardContent class="p-6 flex flex-col gap-4 text-left">
        <!-- Passkeys list trigger -->
        <Button 
          @click="showPasskeyList = true; fetchPasskeyList();" 
          variant="secondary"
          class="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-150 gap-2 font-semibold"
        >
          <Key class="h-4.5 w-4.5" />
          <span>{{ t('showPasskeyList') }}</span>
        </Button>
        
        <!-- Create passkey trigger -->
        <Button 
          @click="showCreatePasskey = true" 
          class="w-full bg-emerald-500 hover:bg-emerald-600 text-white gap-2 font-semibold"
        >
          <Plus class="h-4.5 w-4.5" />
          <span>{{ t('createPasskey') }}</span>
        </Button>

        <!-- Information banner -->
        <div class="flex items-start gap-2.5 rounded-xl border border-zinc-800 bg-zinc-950/40 p-4 text-xs text-zinc-400">
          <Info class="h-4 w-4 text-zinc-500 shrink-0 mt-0.5" />
          <span>{{ t('passordTip') }}</span>
        </div>

        <hr class="border-zinc-850 my-1" />

        <!-- Logout button -->
        <Button 
          @click="showLogout = true" 
          variant="outline" 
          class="w-full border-zinc-800 text-zinc-300 hover:bg-zinc-900 gap-2 font-semibold"
        >
          <LogOut class="h-4.5 w-4.5" />
          <span>{{ t('logout') }}</span>
        </Button>
      </CardContent>
    </Card>

    <!-- Create Passkey Dialog -->
    <Dialog v-model:open="showCreatePasskey">
      <DialogContent class="n-dialog sm:max-w-md border-zinc-800 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold text-white">{{ t('createPasskey') }}</DialogTitle>
          <DialogDescription class="text-xs text-zinc-400">
            Configure WebAuthn/Passkey authentication for this account.
          </DialogDescription>
        </DialogHeader>
        <div class="py-4 space-y-2 text-left">
          <Label for="passkey-name" class="text-xs font-semibold text-zinc-400">Passkey Name</Label>
          <Input 
            id="passkey-name" 
            v-model="passkeyName" 
            :placeholder="t('passkeyNamePlaceholder')" 
            class="border-zinc-800 bg-zinc-900/50 text-white" 
          />
        </div>
        <DialogFooter>
          <Button :disabled="loading" @click="createPasskey" class="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold w-full">
            {{ t('createPasskey') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Rename Passkey Dialog -->
    <Dialog v-model:open="showRenamePasskey">
      <DialogContent class="sm:max-w-md border-zinc-800 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold text-white">{{ t('renamePasskey') }}</DialogTitle>
        </DialogHeader>
        <div class="py-4 space-y-2 text-left">
          <Label for="rename-passkey-name" class="text-xs font-semibold text-zinc-400">New Passkey Name</Label>
          <Input 
            id="rename-passkey-name" 
            v-model="currentPasskeyName" 
            :placeholder="t('renamePasskeyNamePlaceholder')" 
            class="border-zinc-800 bg-zinc-900/50 text-white" 
          />
        </div>
        <DialogFooter>
          <Button :disabled="loading" @click="renamePasskey" class="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold w-full">
            {{ t('renamePasskey') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Passkeys List Dialog -->
    <Dialog v-model:open="showPasskeyList">
      <DialogContent class="sm:max-w-3xl border-zinc-800 bg-zinc-950 text-white max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle class="n-card-header text-lg font-bold text-white">{{ t('showPasskeyList') }}</DialogTitle>
        </DialogHeader>
        
        <div class="py-4 rounded-xl border border-zinc-850 bg-zinc-900/10 overflow-hidden text-left">
          <Table>
            <TableHeader>
              <TableRow class="hover:bg-transparent">
                <TableHead class="text-zinc-400 font-medium text-xs">Passkey ID</TableHead>
                <TableHead class="text-zinc-400 font-medium text-xs">{{ t('passkey_name') }}</TableHead>
                <TableHead class="text-zinc-400 font-medium text-xs">{{ t('created_at') }}</TableHead>
                <TableHead class="text-zinc-400 font-medium text-xs text-right">{{ t('actions') }}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="row in passkeyData" :key="row.passkey_id" class="border-zinc-850 hover:bg-zinc-900/10">
                <TableCell class="text-xs font-mono text-zinc-400 max-w-[120px] truncate">
                  {{ row.passkey_id }}
                </TableCell>
                <TableCell class="text-sm font-semibold text-zinc-200">
                  {{ row.passkey_name }}
                </TableCell>
                <TableCell class="text-xs text-zinc-450 font-mono">
                  {{ row.created_at }}
                </TableCell>
                <TableCell class="text-right">
                  <div class="flex justify-end gap-2">
                    <Button 
                      size="xs" 
                      variant="outline" 
                      @click="() => {
                        showRenamePasskey = true;
                        currentPasskeyId = row.passkey_id;
                      }"
                      class="h-7 text-[11px] border-zinc-800 text-zinc-300 hover:bg-zinc-900"
                    >
                      <Edit class="h-3 w-3 mr-1" />
                      {{ t('renamePasskey') }}
                    </Button>
                    <Button 
                      size="xs" 
                      variant="destructive" 
                      @click="deletePasskey(row.passkey_id)"
                      class="h-7 text-[11px] font-semibold"
                    >
                      <Trash2 class="h-3 w-3 mr-1" />
                      {{ t('deletePasskey') }}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow v-if="passkeyData.length === 0">
                <TableCell colspan="4" class="text-center text-zinc-500 py-6 text-xs">
                  No passkeys registered yet.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>

    <!-- Logout Dialog -->
    <Dialog v-model:open="showLogout">
      <DialogContent class="n-dialog sm:max-w-md border-zinc-800 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold text-white">{{ t('logout') }}</DialogTitle>
          <DialogDescription class="text-xs text-zinc-400">
            {{ t('logoutConfirm') }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button :disabled="loading" @click="logout" variant="destructive" class="w-full sm:w-auto font-semibold">
            {{ t('logout') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
/* No styles needed, pure Tailwind */
</style>
