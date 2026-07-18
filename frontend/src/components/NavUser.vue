<script setup lang="ts">
import { useRouter } from 'vue-router'
import { authService } from '../services/authService'
import {
  BadgeCheck,
  Bell,
  ChevronsUpDown,
  CreditCard,
  LogOut,
  Sparkles,
} from "@lucide/vue"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { computed } from 'vue'

const router = useRouter()
const { isMobile } = useSidebar()

const user = computed(() => {
  const cur = authService.getCurrentUser()
  return {
    name: cur?.username || 'Admin',
    email: cur?.role === 'admin' ? 'Administrator' : 'Staff User',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80'
  }
})

const initials = computed(() => {
  return user.value.name.substring(0, 2).toUpperCase()
})

const handleLogout = () => {
  authService.logout()
  router.push('/login')
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground md:h-10 md:p-1 hover:bg-zinc-800 transition-colors"
          >
            <Avatar class="h-8 w-8 rounded-lg">
              <AvatarImage :src="user.avatar" :alt="user.name" />
              <AvatarFallback class="rounded-lg bg-emerald-500/10 text-primary border border-emerald-500/20 text-xs font-bold">
                {{ initials }}
              </AvatarFallback>
            </Avatar>
            <div class="grid flex-1 text-left text-sm leading-tight ml-2">
              <span class="truncate font-semibold text-white text-xs">{{ user.name }}</span>
              <span class="truncate text-[10px] text-zinc-400">{{ user.email }}</span>
            </div>
            <ChevronsUpDown class="ml-auto size-4 text-zinc-400" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg bg-zinc-950 border border-border text-white"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="4"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <Avatar class="h-8 w-8 rounded-lg">
                <AvatarImage :src="user.avatar" :alt="user.name" />
                <AvatarFallback class="rounded-lg bg-emerald-500/10 text-primary border border-emerald-500/20 text-xs font-bold">
                  {{ initials }}
                </AvatarFallback>
              </Avatar>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold text-white">{{ user.name }}</span>
                <span class="truncate text-xs text-zinc-400">{{ user.email }}</span>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator class="bg-border" />
          <DropdownMenuGroup>
            <DropdownMenuItem class="focus:bg-zinc-800 text-zinc-200">
              <Sparkles class="h-4 w-4 mr-2" />
              Upgrade to Pro
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator class="bg-border" />
          <DropdownMenuGroup>
            <DropdownMenuItem class="focus:bg-zinc-800 text-zinc-200">
              <BadgeCheck class="h-4 w-4 mr-2" />
              Account
            </DropdownMenuItem>
            <DropdownMenuItem class="focus:bg-zinc-800 text-zinc-200">
              <CreditCard class="h-4 w-4 mr-2" />
              Billing
            </DropdownMenuItem>
            <DropdownMenuItem class="focus:bg-zinc-800 text-zinc-200">
              <Bell class="h-4 w-4 mr-2" />
              Notifications
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator class="bg-border" />
          <DropdownMenuItem class="focus:bg-red-950/20 focus:text-red-400 text-zinc-200" @click="handleLogout">
            <LogOut class="h-4 w-4 mr-2" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
