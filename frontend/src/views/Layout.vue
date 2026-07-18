<template>
  <SidebarProvider>
    <div class="flex h-screen w-screen overflow-hidden bg-background">
      <!-- AppSidebar renders the primary icon bar and the secondary list -->
      <AppSidebar />

      <!-- Main viewport area -->
      <SidebarInset class="flex flex-col flex-1 overflow-hidden min-w-0 bg-zinc-950">
        <!-- Site Header -->
        <header class="flex h-14 shrink-0 items-center justify-between border-b border-border px-6 bg-zinc-900/30">
          <div class="flex items-center gap-2">
            <!-- Sidebar trigger to expand / collapse -->
            <SidebarTrigger class="text-zinc-400 hover:text-white" />
            <div class="h-4 w-[1px] bg-border mx-2"></div>
            <span class="text-base font-semibold text-white tracking-tight">{{ currentRouteName }}</span>
          </div>
        </header>

        <!-- Main content view -->
        <main class="flex-1 overflow-y-auto p-6">
          <router-view />
        </main>
      </SidebarInset>
    </div>
  </SidebarProvider>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import AppSidebar from '@/components/AppSidebar.vue'

const route = useRoute()

const currentRouteName = computed(() => {
  switch (route.name) {
    case 'DashboardHome':
      return 'Dashboard Overview'
    case 'Accounts':
      return 'Account Management'
    case 'Webmail':
      return 'Webmail Center'
    case 'Settings':
      return 'System Settings'
    default:
      return 'Dashboard'
  }
})
</script>
