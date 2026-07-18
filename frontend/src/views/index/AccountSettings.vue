<script setup>
import { ref } from 'vue'
import { useScopedI18n } from '@/i18n/app'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import { hashPassword } from '../../utils'
import { getRouterPathWithLang } from '../../utils'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

const {
  jwt, settings, showAddressCredential, loading, openSettings
} = useGlobalState()
const router = useRouter()

const showLogout = ref(false)
const showDeleteAccount = ref(false)
const showClearInbox = ref(false)
const showClearSentItems = ref(false)
const showChangePassword = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const { locale, t } = useScopedI18n('views.index.AccountSettings')

const logout = async () => {
  jwt.value = '';
  await router.push(getRouterPathWithLang("/", locale.value))
  location.reload()
}

const deleteAccount = async () => {
  try {
    await api.fetch(`/api/delete_address`, {
      method: 'DELETE'
    });
    jwt.value = '';
    await router.push(getRouterPathWithLang("/", locale.value))
    location.reload()
  } catch (error) {
    toast.error(error.message || "error");
  }
};

const clearInbox = async () => {
  try {
    await api.fetch(`/api/clear_inbox`, {
      method: 'DELETE'
    });
    toast.success(t("success"));
  } catch (error) {
    toast.error(error.message || "error");
  } finally {
    showClearInbox.value = false;
  }
};

const clearSentItems = async () => {
  try {
    await api.fetch(`/api/clear_sent_items`, {
      method: 'DELETE'
    });
    toast.success(t("success"));
  } catch (error) {
    toast.error(error.message || "error");
  } finally {
    showClearSentItems.value = false;
  }
};

const changePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    toast.error(t("passwordMismatch"));
    return;
  }
  try {
    await api.fetch(`/api/address_change_password`, {
      method: 'POST',
      body: JSON.stringify({
        new_password: await hashPassword(newPassword.value)
      })
    });
    toast.success(t("passwordChanged"));
    newPassword.value = '';
    confirmPassword.value = '';
    showChangePassword.value = false;
  } catch (error) {
    toast.error(error.message || "error");
  }
};
</script>

<template>
  <div class="flex justify-center w-full" v-if="settings.address">
    <Card class="w-full max-w-3xl border-zinc-800 bg-card text-white">
      <CardContent class="p-6 flex flex-col gap-4 text-left">
        <!-- Actions Buttons Group -->
        <Button @click="showAddressCredential = true" class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
          {{ t('showAddressCredential') }}
        </Button>
        
        <Button v-if="openSettings?.enableAddressPassword" @click="showChangePassword = true" variant="secondary" class="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-semibold">
          {{ t('changePassword') }}
        </Button>
        
        <Button v-if="openSettings.enableUserDeleteEmail" @click="showClearInbox = true" variant="outline" class="w-full border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10 font-semibold">
          {{ t('clearInbox') }}
        </Button>
        
        <Button v-if="openSettings.enableUserDeleteEmail" @click="showClearSentItems = true" variant="outline" class="w-full border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10 font-semibold">
          {{ t('clearSentItems') }}
        </Button>
        
        <Button @click="showLogout = true" variant="outline" class="w-full border-zinc-800 text-zinc-300 hover:bg-zinc-900 font-semibold">
          {{ t('logout') }}
        </Button>
        
        <hr v-if="openSettings.enableUserDeleteEmail" class="border-zinc-800 my-2" />
        
        <Button v-if="openSettings.enableUserDeleteEmail" @click="showDeleteAccount = true" variant="destructive" class="w-full font-semibold">
          {{ t('deleteAccount') }}
        </Button>
      </CardContent>
    </Card>

    <!-- Logout Dialog -->
    <Dialog v-model:open="showLogout">
      <DialogContent class="sm:max-w-md border-zinc-800 bg-zinc-950 text-white">
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

    <!-- Delete Account Dialog -->
    <Dialog v-model:open="showDeleteAccount">
      <DialogContent class="sm:max-w-md border-zinc-800 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold text-white">{{ t('deleteAccount') }}</DialogTitle>
          <DialogDescription class="text-xs text-zinc-400">
            {{ t('deleteAccountConfirm') }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button :disabled="loading" @click="deleteAccount" variant="destructive" class="w-full sm:w-auto font-semibold">
            {{ t('deleteAccount') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Clear Inbox Dialog -->
    <Dialog v-model:open="showClearInbox">
      <DialogContent class="sm:max-w-md border-zinc-800 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold text-white">{{ t('clearInbox') }}</DialogTitle>
          <DialogDescription class="text-xs text-zinc-400">
            {{ t('clearInboxConfirm') }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button :disabled="loading" @click="clearInbox" variant="destructive" class="w-full sm:w-auto font-semibold">
            {{ t('clearInbox') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Clear Sent Items Dialog -->
    <Dialog v-model:open="showClearSentItems">
      <DialogContent class="sm:max-w-md border-zinc-800 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold text-white">{{ t('clearSentItems') }}</DialogTitle>
          <DialogDescription class="text-xs text-zinc-400">
            {{ t('clearSentItemsConfirm') }}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button :disabled="loading" @click="clearSentItems" variant="destructive" class="w-full sm:w-auto font-semibold">
            {{ t('clearSentItems') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Change Password Dialog -->
    <Dialog v-model:open="showChangePassword">
      <DialogContent class="sm:max-w-md border-zinc-800 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold text-white">{{ t('changePassword') }}</DialogTitle>
        </DialogHeader>
        
        <div class="py-4 space-y-4 text-left">
          <div class="space-y-2">
            <Label for="settings-new-pass" class="text-xs font-semibold text-zinc-400">{{ t('newPassword') }}</Label>
            <Input 
              id="settings-new-pass" 
              v-model="newPassword" 
              type="password" 
              @keyup.enter="changePassword"
              class="border-zinc-800 bg-zinc-900/50 text-white" 
            />
          </div>
          
          <div class="space-y-2">
            <Label for="settings-confirm-pass" class="text-xs font-semibold text-zinc-400">{{ t('confirmPassword') }}</Label>
            <Input 
              id="settings-confirm-pass" 
              v-model="confirmPassword" 
              type="password" 
              @keyup.enter="changePassword"
              class="border-zinc-800 bg-zinc-900/50 text-white" 
            />
          </div>
        </div>

        <DialogFooter>
          <Button :disabled="loading" @click="changePassword" class="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold w-full">
            {{ t('changePassword') }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
/* No styles needed, pure Tailwind */
</style>
