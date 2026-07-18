<template>
  <div class="space-y-8">
    <!-- Stat Cards Grid -->
    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card class="border-border bg-card">
        <CardContent class="flex items-center gap-4 p-6">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-primary border border-emerald-500/20">
            <Users class="h-5 w-5" />
          </div>
          <div>
            <p class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Total Accounts</p>
            <h3 class="text-2xl font-bold text-white mt-1">{{ totalAccounts }}</h3>
          </div>
        </CardContent>
      </Card>

      <Card class="border-border bg-card">
        <CardContent class="flex items-center gap-4 p-6">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-primary border border-emerald-500/20">
            <CheckCircle2 class="h-5 w-5" />
          </div>
          <div>
            <p class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Active Accounts</p>
            <h3 class="text-2xl font-bold text-white mt-1">{{ activeAccounts }}</h3>
          </div>
        </CardContent>
      </Card>

      <Card class="border-border bg-card">
        <CardContent class="flex items-center gap-4 p-6">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-primary border border-emerald-500/20">
            <Mail class="h-5 w-5" />
          </div>
          <div>
            <p class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Total Received</p>
            <h3 class="text-2xl font-bold text-white mt-1">{{ totalReceivedMails }}</h3>
          </div>
        </CardContent>
      </Card>

      <Card class="border-border bg-card">
        <CardContent class="flex items-center gap-4 p-6">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-500/10 text-primary border border-emerald-500/20">
            <Send class="h-5 w-5" />
          </div>
          <div>
            <p class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Total Sent</p>
            <h3 class="text-2xl font-bold text-white mt-1">{{ totalSentMails }}</h3>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Quick Actions and Progress Overview -->
    <div class="grid gap-6 md:grid-cols-12">
      <!-- Left Panel: Recent Accounts Table -->
      <Card class="border-border bg-card md:col-span-7">
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle class="text-lg font-semibold text-white">Recently Created Accounts</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            class="text-xs text-primary hover:bg-emerald-500/10 hover:text-primary gap-1"
            @click="navigateToAccounts" 
          >
            View All
            <ArrowRight class="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent class="p-0">
          <Table>
            <TableHeader>
              <TableRow class="hover:bg-transparent">
                <TableHead class="text-zinc-400 font-medium text-xs">Email Address</TableHead>
                <TableHead class="text-zinc-400 font-medium text-xs">Created On</TableHead>
                <TableHead class="text-zinc-400 font-medium text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-for="account in recentAccounts" :key="account.id" class="border-border/50 hover:bg-zinc-800/30">
                <TableCell class="text-sm text-zinc-100 py-3">{{ account.email }}</TableCell>
                <TableCell class="text-sm text-zinc-400 py-3">{{ formatDate(account.creationDate) }}</TableCell>
                <TableCell class="py-3">
                  <Badge :variant="account.status === 'Active' ? 'default' : 'destructive'" class="text-xs">
                    {{ account.status }}
                  </Badge>
                </TableCell>
              </TableRow>
              <TableRow v-if="recentAccounts.length === 0">
                <TableCell colspan="3" class="text-center text-zinc-500 py-8">
                  No accounts found
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <!-- Right Panel: System Metrics -->
      <Card class="border-border bg-card md:col-span-5">
        <CardHeader>
          <CardTitle class="text-lg font-semibold text-white">System Utilization</CardTitle>
        </CardHeader>
        <CardContent class="space-y-6">
          <div class="space-y-2">
            <div class="flex justify-between text-xs font-medium">
              <span class="text-zinc-400">SMTP Server Status</span>
              <span class="text-primary">Operational (100%)</span>
            </div>
            <Progress :model-value="100" class="h-1.5 bg-zinc-800" />
          </div>

          <div class="space-y-2">
            <div class="flex justify-between text-xs font-medium">
              <span class="text-zinc-400">D1 Database Storage</span>
              <span class="text-white">4.8 MB of 500 MB (1.2%)</span>
            </div>
            <Progress :model-value="1.2" class="h-1.5 bg-zinc-800" />
          </div>

          <div class="space-y-2">
            <div class="flex justify-between text-xs font-medium">
              <span class="text-zinc-400">Worker Request Limits</span>
              <span class="text-white">14,242 of 100,000 (14.2%)</span>
            </div>
            <Progress :model-value="14.2" class="h-1.5 bg-zinc-800" />
          </div>
          
          <div class="space-y-2">
            <div class="flex justify-between text-xs font-medium">
              <span class="text-zinc-400">Attachment Buffer (S3)</span>
              <span class="text-white">0.5 GB of 10 GB (5.0%)</span>
            </div>
            <Progress :model-value="5.0" class="h-1.5 bg-zinc-800" />
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { accountService } from '../services/accountService'
import { api } from '../api'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Users, CheckCircle2, Mail, Send, ArrowRight } from 'lucide-vue-next'

const router = useRouter()

const accounts = ref([])
const totalAccountsRef = ref(0)
const activeAccountsRef = ref(0)
const totalReceivedMailsRef = ref(0)
const totalSentMailsRef = ref(0)

onMounted(async () => {
  accounts.value = await accountService.getAccounts()
  try {
    const stats = await api.fetch('/admin/statistics')
    totalAccountsRef.value = stats.addressCount || 0
    activeAccountsRef.value = stats.activeAddressCount7days || 0
    totalReceivedMailsRef.value = stats.mailCount || 0
    totalSentMailsRef.value = stats.sendMailCount || 0
  } catch (e) {
    console.error('Failed to load production stats', e)
  }
})

const totalAccounts = computed(() => totalAccountsRef.value)
const activeAccounts = computed(() => activeAccountsRef.value)
const totalReceivedMails = computed(() => totalReceivedMailsRef.value)
const totalSentMails = computed(() => totalSentMailsRef.value)

const recentAccounts = computed(() => {
  return [...accounts.value]
    .sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate))
    .slice(0, 5)
})

const navigateToAccounts = () => {
  router.push('/admin/accounts')
}

const formatDate = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}
</script>
