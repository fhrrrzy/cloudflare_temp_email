<script setup>
import { onMounted, ref, watch } from 'vue';
import { useScopedI18n } from '@/i18n/app'
import { toast } from 'vue-sonner'

import { api } from '../../api'
import { useGlobalState } from '../../store'
import MailBox from '../../components/MailBox.vue';

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const { openSettings } = useGlobalState()
const { t } = useScopedI18n('views.user.UserMailBox')

const mailBoxKey = ref("")
const addressFilter = ref("")
const addressFilterOptions = ref([])

const queryMail = () => {
  addressFilter.value = addressFilter.value ? addressFilter.value.trim() : addressFilter.value;
  mailBoxKey.value = Date.now();
}

const fetchMailData = async (limit, offset) => {
  return await api.fetch(
    `/user_api/mails`
    + `?limit=${limit}`
    + `&offset=${offset}`
    + (addressFilter.value ? `&address=${addressFilter.value}` : '')
  );
}

const fetchAddressData = async () => {
  try {
    const { results } = await api.fetch(
      `/user_api/bind_address`
    );
    addressFilterOptions.value = results.map((item) => {
      return {
        label: item.name,
        value: item.name
      }
    });
  } catch (error) {
    console.log(error)
    toast.error(error.message || "error");
  }
}

const deleteMail = async (curMailId) => {
  await api.fetch(`/user_api/mails/${curMailId}`, { method: 'DELETE' });
};

watch(addressFilter, async () => {
  queryMail();
});

onMounted(() => {
  fetchAddressData();
});
</script>

<template>
  <div class="mt-4 space-y-4">
    <div class="flex gap-2 max-w-md text-left">
      <Select v-model="addressFilter">
        <SelectTrigger class="w-full bg-zinc-900 border-zinc-800 text-white">
          <SelectValue :placeholder="t('addressQueryTip')" />
        </SelectTrigger>
        <SelectContent class="bg-zinc-900 border-zinc-800 text-zinc-300">
          <SelectItem 
            v-for="opt in addressFilterOptions" 
            :key="opt.value" 
            :value="opt.value"
            class="focus:bg-zinc-800 focus:text-white cursor-pointer"
          >
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
      
      <Button @click="queryMail" class="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold">
        {{ t('query') }}
      </Button>
    </div>
    
    <MailBox 
      :key="mailBoxKey" 
      :enableUserDeleteEmail="openSettings.enableUserDeleteEmail" 
      :fetchMailData="fetchMailData"
      :deleteMail="deleteMail" 
      :showFilterInput="true" 
    />
  </div>
</template>

<style scoped>
/* No styles needed, pure Tailwind */
</style>
