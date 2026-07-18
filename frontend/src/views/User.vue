<script setup>
import { useScopedI18n } from '@/i18n/app'
import { useGlobalState } from '../store'

import AddressMangement from './user/AddressManagement.vue';
import UserSettingsPage from './user/UserSettings.vue';
import UserBar from './user/UserBar.vue';
import BindAddress from './user/BindAddress.vue';
import UserMailBox from './user/UserMailBox.vue';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const {
  userTab, userSettings
} = useGlobalState()

const { t } = useScopedI18n('views.User')
</script>

<template>
  <div>
    <UserBar />
    
    <Tabs v-if="userSettings.user_email" v-model="userTab" class="w-full mt-4">
      <div class="border-b border-zinc-800 pb-2 mb-4">
        <TabsList class="bg-zinc-900 border border-zinc-800 text-zinc-400">
          <TabsTrigger value="address_management" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
            {{ t('address_management') }}
          </TabsTrigger>
          <TabsTrigger value="user_mail_box_tab" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
            {{ t('user_mail_box_tab') }}
          </TabsTrigger>
          <TabsTrigger value="user_settings" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
            {{ t('user_settings') }}
          </TabsTrigger>
          <TabsTrigger value="bind_address" class="data-[state=active]:bg-zinc-850 data-[state=active]:text-white">
            {{ t('bind_address') }}
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="address_management" class="outline-none">
        <AddressMangement />
      </TabsContent>
      
      <TabsContent value="user_mail_box_tab" class="outline-none">
        <UserMailBox />
      </TabsContent>
      
      <TabsContent value="user_settings" class="outline-none">
        <UserSettingsPage />
      </TabsContent>
      
      <TabsContent value="bind_address" class="outline-none">
        <BindAddress />
      </TabsContent>
    </Tabs>
  </div>
</template>
