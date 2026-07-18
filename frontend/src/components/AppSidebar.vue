<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useGlobalState } from '../store'
import { accountService } from '../services/accountService'
import { mailService } from '../services/mailService'
import type { SidebarProps } from '@/components/ui/sidebar'
import NavUser from '@/components/NavUser.vue'
import { Label } from '@/components/ui/label'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { 
  Inbox, FileText, Send, AlertTriangle, Trash2, Archive, 
  Users, RefreshCw, MessageSquare, ShoppingBag, Tag, 
  Command, LayoutDashboard, Settings as SettingsIcon, Pencil,
  ChevronDown
} from 'lucide-vue-next'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "icon",
})

const route = useRoute()
const router = useRouter()
const { setOpen } = useSidebar()

const {
  adminMailTabAddress,
  adminMailActiveFolder,
  adminMailIsComposeOpen,
  adminMailActiveMail
} = useGlobalState()

const accounts = ref<any[]>([])
const emails = ref<any[]>([])

const loadMailboxes = () => {
  accounts.value = accountService.getAccounts()
  if (accounts.value.length > 0 && !adminMailTabAddress.value) {
    adminMailTabAddress.value = accounts.value[0].email
  }
  loadEmailsForAddress()
}

const loadEmailsForAddress = () => {
  if (adminMailTabAddress.value) {
    emails.value = mailService.getMails(adminMailTabAddress.value)
  }
}

onMounted(() => {
  loadMailboxes()
})

watch(adminMailTabAddress, () => {
  loadEmailsForAddress()
})

const isWebmail = computed(() => {
  return route.path.startsWith('/admin/webmail')
})

// Automatically expand/open sidebar when switching to Webmail
watch(isWebmail, (val) => {
  if (val) {
    setOpen(true)
  }
})

const mainNavigation = [
  {
    title: "Dashboard",
    url: "/admin/home",
    icon: LayoutDashboard,
  },
  {
    title: "Accounts",
    url: "/admin/accounts",
    icon: Users,
  },
  {
    title: "Webmail",
    url: "/admin/webmail",
    icon: Inbox,
  },
  {
    title: "Settings",
    url: "/admin/settings",
    icon: SettingsIcon,
  },
]

const mainFolders = [
  { id: 'inbox', name: 'Inbox', icon: Inbox },
  { id: 'drafts', name: 'Drafts', icon: FileText },
  { id: 'sent', name: 'Sent', icon: Send },
  { id: 'junk', name: 'Junk', icon: AlertTriangle },
  { id: 'trash', name: 'Trash', icon: Trash2 },
  { id: 'archive', name: 'Archive', icon: Archive }
]

const categoryFolders = [
  { id: 'social', name: 'Social', icon: Users },
  { id: 'updates', name: 'Updates', icon: RefreshCw },
  { id: 'forums', name: 'Forums', icon: MessageSquare },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag },
  { id: 'promotions', name: 'Promotions', icon: Tag }
]

const getFolderCount = (folderId: string) => {
  if (folderId === 'inbox') {
    return emails.value.filter(m => !m.isSent && !m.isRead).length
  }
  if (folderId === 'drafts') return 9
  if (folderId === 'junk') return 23
  if (folderId === 'archive') return 19
  return 0
}

const getCategoryCount = (catId: string) => {
  if (catId === 'social') return 972
  if (catId === 'updates') return 342
  if (catId === 'forums') return 128
  if (catId === 'shopping') return 8
  if (catId === 'promotions') return 21
  return 0
}

const selectFolder = (folderId: string) => {
  adminMailActiveFolder.value = folderId
  adminMailActiveMail.value = null
}

const selectMailbox = (email: string) => {
  adminMailTabAddress.value = email
  adminMailActiveMail.value = null
}

const openCompose = () => {
  adminMailIsComposeOpen.value = true
}

const getAccountDisplayName = (emailStr: string) => {
  if (!emailStr) return ''
  const prefix = emailStr.split('@')[0]
  return prefix.charAt(0).toUpperCase() + prefix.slice(1)
}
</script>

<template>
  <Sidebar
    class="overflow-hidden *:data-[sidebar=sidebar]:flex-row border-r border-border bg-zinc-950"
    v-bind="props"
  >
    <!-- Primary Sidebar: Navigates views -->
    <Sidebar
      collapsible="none"
      class="w-[calc(var(--sidebar-width-icon)+1px)]! border-r border-border bg-zinc-950"
    >
      <SidebarHeader class="border-b border-border h-14 flex items-center justify-center p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" as-child class="md:h-10 md:p-0 flex items-center justify-center hover:bg-transparent">
              <div class="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <Command class="size-4" />
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent class="py-4">
        <SidebarGroup>
          <SidebarGroupContent class="px-1.5 md:px-0">
            <SidebarMenu class="space-y-1">
              <SidebarMenuItem v-for="item in mainNavigation" :key="item.title">
                <SidebarMenuButton
                  :tooltip="item.title"
                  :is-active="route.path.startsWith(item.url)"
                  class="px-2.5 md:px-2 h-10 w-10 flex items-center justify-center rounded-lg mx-auto text-zinc-400 hover:text-white hover:bg-zinc-800 data-[active=true]:bg-primary data-[active=true]:text-primary-foreground transition-all"
                  @click="router.push(item.url)"
                >
                  <component :is="item.icon" class="h-5 w-5 shrink-0" />
                  <span class="sr-only">{{ item.title }}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter class="border-t border-border p-2 bg-zinc-950">
        <NavUser />
      </SidebarFooter>
    </Sidebar>

    <!-- Secondary Sidebar: Mail folders (Visible ONLY on Webmail view) -->
    <Sidebar v-if="isWebmail" collapsible="none" class="hidden flex-1 md:flex bg-zinc-950 border-r border-border">
      <SidebarHeader class="gap-3.5 border-b border-border p-4 bg-zinc-950">
        <div class="flex flex-col gap-3 w-full">
          <div class="text-sm font-semibold text-white">
            Mailboxes
          </div>
          <Select :model-value="adminMailTabAddress" @update:model-value="selectMailbox">
            <SelectTrigger class="w-full h-9 border-border bg-zinc-900 text-white flex items-center justify-between text-xs">
              <SelectValue placeholder="Select mailbox" />
            </SelectTrigger>
            <SelectContent class="border-border bg-zinc-900 text-white text-xs">
              <SelectItem v-for="acc in accounts" :key="acc.email" :value="acc.email">
                {{ getAccountDisplayName(acc.email) }}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </SidebarHeader>
      
      <SidebarContent class="p-3 bg-zinc-950 space-y-4">
        <!-- Folders -->
        <SidebarGroup class="p-0">
          <div class="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2">Folders</div>
          <SidebarGroupContent>
            <SidebarMenu class="space-y-0.5">
              <SidebarMenuItem v-for="folder in mainFolders" :key="folder.id">
                <SidebarMenuButton
                  :is-active="adminMailActiveFolder === folder.id"
                  class="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/40 data-[active=true]:bg-emerald-500/10 data-[active=true]:text-primary data-[active=true]:font-medium transition-all"
                  @click="selectFolder(folder.id)"
                >
                  <div class="flex items-center gap-2.5">
                    <component :is="folder.icon" class="h-4 w-4 shrink-0" />
                    <span>{{ folder.name }}</span>
                  </div>
                  <span 
                    v-if="getFolderCount(folder.id) > 0" 
                    class="px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300"
                  >
                    {{ getFolderCount(folder.id) }}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <!-- Categories -->
        <SidebarGroup class="p-0">
          <div class="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider px-3 mb-2">Categories</div>
          <SidebarGroupContent>
            <SidebarMenu class="space-y-0.5">
              <SidebarMenuItem v-for="cat in categoryFolders" :key="cat.id">
                <SidebarMenuButton
                  :is-active="adminMailActiveFolder === cat.id"
                  class="w-full flex items-center justify-between px-3 py-2 text-xs rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/40 data-[active=true]:bg-emerald-500/10 data-[active=true]:text-primary data-[active=true]:font-medium transition-all"
                  @click="selectFolder(cat.id)"
                >
                  <div class="flex items-center gap-2.5">
                    <component :is="cat.icon" class="h-4 w-4 shrink-0" />
                    <span>{{ cat.name }}</span>
                  </div>
                  <span 
                    v-if="getCategoryCount(cat.id) > 0" 
                    class="px-1.5 py-0.5 rounded text-[10px] bg-zinc-900 border border-zinc-800 text-zinc-300"
                  >
                    {{ getCategoryCount(cat.id) }}
                  </span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter class="p-4 border-t border-border bg-zinc-950">
        <Button 
          class="w-full h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 text-xs" 
          @click="openCompose"
        >
          <Pencil class="h-3.5 w-3.5" />
          Compose Mail
        </Button>
      </SidebarFooter>
    </Sidebar>
  </Sidebar>
</template>
