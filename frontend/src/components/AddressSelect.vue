<script setup>
import { onMounted, ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { useScopedI18n } from '@/i18n/app'
import useClipboard from 'vue-clipboard3'
import { Copy as CopyIcon, Loader2 } from 'lucide-vue-next'
import { toast } from 'vue-sonner'

import { useGlobalState } from '../store'
import { api } from '../api'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const props = defineProps({
  showCopy: {
    type: Boolean,
    default: true,
  },
  size: {
    type: String,
    default: 'sm',
  },
})

const { toClipboard } = useClipboard()

const {
  jwt, settings, userJwt, isTelegram, openSettings, telegramApp
} = useGlobalState()

const { t } = useScopedI18n('components.AddressSelect')

const addressOptions = ref([])
const addressValue = ref("")
const addressLoading = ref(false)
const localAddressCache = useLocalStorage("LocalAddressCache", [])
const optionValueMap = new Map()

const formatAddressLabel = (address) => {
  if (!address) return address;
  const domain = address.split('@')[1]
  const domainLabel = openSettings.value.domains.find(
    d => d.value === domain
  )?.label;
  if (!domainLabel) return address;
  return address.replace('@' + domain, `@${domainLabel}`);
}

const parseJwtAddress = (curJwt) => {
  try {
    const payload = JSON.parse(
      decodeURIComponent(
        atob(curJwt.split(".")[1]
          .replace(/-/g, "+").replace(/_/g, "/")
        )
      )
    );
    return payload.address;
  } catch (e) {
    return null;
  }
}

const getOptionValue = (key, scope, payload, address) => {
  if (optionValueMap.has(key)) {
    const cached = optionValueMap.get(key)
    cached.scope = scope
    cached.payload = payload
    cached.address = address
    return key
  }
  const value = { key, scope, payload, address }
  optionValueMap.set(key, value)
  return key
}

const buildLocalOptions = (excludeAddresses = new Set()) => {
  if (typeof jwt.value === 'string' && jwt.value && !localAddressCache.value.includes(jwt.value)) {
    localAddressCache.value.push(jwt.value)
  }
  const children = localAddressCache.value
    .map((curJwt) => {
      const address = parseJwtAddress(curJwt);
      if (!address) return null;
      if (excludeAddresses.has(address)) return null;
      const label = formatAddressLabel(address);
      const key = `local:${curJwt}`;
      const option = { label, value: getOptionValue(key, 'local', curJwt, address), address };
      if (settings.value.address && address === settings.value.address) {
        addressValue.value = option.value;
      }
      return option;
    })
    .filter(Boolean);
  return children;
}

const buildUserOptions = async () => {
  const children = [];
  try {
    const { results } = await api.fetch(`/user_api/bind_address`);
    for (const row of results || []) {
      const address = row.address || row.name;
      if (!address) continue;
      const label = formatAddressLabel(address);
      const key = `user:${row.id}`;
      const option = { label, value: getOptionValue(key, 'user', String(row.id), address), address };
      if (settings.value.address && address === settings.value.address) {
        addressValue.value = option.value;
      }
      children.push(option);
    }
  } catch (error) {
    toast.error(error.message || "error");
  }
  return children;
}

const buildTelegramOptions = async () => {
  const children = [];
  try {
    const data = await api.fetch(`/telegram/get_bind_address`, {
      method: 'POST',
      body: JSON.stringify({
        initData: telegramApp.value.initData
      })
    });
    for (const row of data || []) {
      if (!row?.address || !row?.jwt) continue;
      const label = formatAddressLabel(row.address);
      const key = `tg:${row.jwt}`;
      const option = { label, value: getOptionValue(key, 'tg', row.jwt, row.address), address: row.address };
      if (settings.value.address && row.address === settings.value.address) {
        addressValue.value = option.value;
      }
      children.push(option);
    }
  } catch (error) {
    toast.error(error.message || "error");
  }
  return children;
}

const refreshAddressOptions = async () => {
  addressLoading.value = true;
  addressValue.value = "";
  try {
    if (isTelegram.value) {
      const telegramChildren = await buildTelegramOptions();
      addressOptions.value = telegramChildren;
      return;
    }
    const groups = [];
    if (userJwt.value) {
      const userChildren = await buildUserOptions();
      if (userChildren.length > 0) {
        groups.push({ type: 'group', label: t('userAddresses'), children: userChildren });
      }
      const userAddressSet = new Set(userChildren.map((item) => item.address));
      const localChildren = buildLocalOptions(userAddressSet);
      if (localChildren.length > 0) {
        groups.push({ type: 'group', label: t('localAddresses'), children: localChildren });
      }
    } else {
      const localChildren = buildLocalOptions();
      if (localChildren.length > 0) {
        groups.push({ type: 'group', label: t('localAddresses'), children: localChildren });
      }
    }
    addressOptions.value = groups;
  } finally {
    addressLoading.value = false;
  }
}

const onAddressChange = async (key) => {
  if (!key) return;
  const value = optionValueMap.get(key);
  if (!value) return;
  
  if (value.scope === 'local' || value.scope === 'tg') {
    jwt.value = value.payload;
    location.reload();
    return;
  }
  if (value.scope === 'user') {
    try {
      const res = await api.fetch(`/user_api/bind_address_jwt/${value.payload}`);
      if (!res?.jwt) {
        toast.error("jwt not found");
        return;
      }
      jwt.value = res.jwt;
      location.reload();
    } catch (error) {
      toast.error(error.message || "error");
    }
  }
}

const copy = async () => {
  try {
    await toClipboard(settings.value.address)
    toast.success(t('copied'));
  } catch (e) {
    toast.error(e.message || "error");
  }
}

onMounted(async () => {
  await refreshAddressOptions();
});

watch([userJwt, isTelegram, () => settings.value.address], async () => {
  await refreshAddressOptions();
});
</script>

<template>
  <div class="flex flex-wrap items-center justify-center gap-3 w-full">
    <!-- Select Wrapper with Loader -->
    <div class="relative w-full min-w-[220px] max-w-[420px] flex-1">
      <Select v-model="addressValue" @update:modelValue="onAddressChange" :disabled="addressLoading">
        <SelectTrigger class="w-full bg-zinc-900 border-zinc-800 text-white focus:ring-1 focus:ring-emerald-500">
          <SelectValue :placeholder="t('address')" />
        </SelectTrigger>
        <SelectContent class="bg-zinc-900 border-zinc-800 text-zinc-300">
          <!-- Loading indicator inside dropdown list if any -->
          <div v-if="addressLoading" class="flex items-center justify-center p-4">
            <Loader2 class="h-4 w-4 animate-spin text-emerald-500" />
          </div>
          
          <template v-else v-for="group in addressOptions" :key="group.label || group.value">
            <template v-if="group.type === 'group'">
              <SelectGroup>
                <SelectLabel class="text-[10px] text-zinc-500 font-bold tracking-wider uppercase px-2 py-1.5">
                  {{ group.label }}
                </SelectLabel>
                <SelectItem 
                  v-for="opt in group.children" 
                  :key="opt.value" 
                  :value="opt.value"
                  class="focus:bg-zinc-800 focus:text-white cursor-pointer"
                >
                  {{ opt.label }}
                </SelectItem>
              </SelectGroup>
            </template>
            <template v-else>
              <SelectItem 
                :key="group.value" 
                :value="group.value"
                class="focus:bg-zinc-800 focus:text-white cursor-pointer"
              >
                {{ group.label }}
              </SelectItem>
            </template>
          </template>
        </SelectContent>
      </Select>
    </div>

    <!-- Actions slot -->
    <slot name="actions" />

    <!-- Copy Button -->
    <Button 
      v-if="showCopy" 
      @click="copy" 
      variant="outline" 
      :size="size"
      class="gap-1.5 border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
    >
      <CopyIcon class="h-4 w-4" />
      <span>{{ t('copy') }}</span>
    </Button>
  </div>
</template>
