<script setup>
import { ref, onMounted } from 'vue';
import { useScopedI18n } from '@/i18n/app'
import { toast } from 'vue-sonner'
import { Download, Trash2 } from 'lucide-vue-next'

import { api } from '../../api'
import { Button } from '@/components/ui/button'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'

const { t } = useScopedI18n('views.index.Attachment')
const data = ref([])
const showDownload = ref(false)
const curRow = ref({ key: '' })
const curDownloadUrl = ref('')

const fetchData = async () => {
  try {
    const { results } = await api.fetch(
      `/api/attachment/list`
    );
    data.value = results;
  } catch (error) {
    console.log(error)
    toast.error(error.message || "error");
  }
}

const handleDownloadClick = async (row) => {
  try {
    const { url } = await api.fetch(`/api/attachment/get_url`, {
      method: 'POST',
      body: JSON.stringify({ key: row.key })
    });
    curDownloadUrl.value = url;
    curRow.value = row;
    showDownload.value = true;
  }
  catch (error) {
    console.error(error);
    toast.error(error.message || "error");
  }
}

const handleDeleteClick = async (row) => {
  if (confirm(t('deleteConfirm'))) {
    try {
      await api.fetch(`/api/attachment/delete`, {
        method: 'POST',
        body: JSON.stringify({ key: row.key })
      });
      toast.success(t('deleteSuccess'));
      await fetchData();
    }
    catch (error) {
      console.error(error);
      toast.error(error.message || "error");
    }
  }
}

onMounted(async () => {
  await fetchData()
})
</script>

<template>
  <div class="space-y-4">
    <!-- Attachments Table -->
    <div class="rounded-xl border border-zinc-850 bg-card overflow-hidden text-left">
      <Table>
        <TableHeader>
          <TableRow class="hover:bg-transparent">
            <TableHead class="text-zinc-400 font-medium text-xs">Key</TableHead>
            <TableHead class="text-zinc-400 font-medium text-xs text-right">{{ t('action') }}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-for="row in data" :key="row.key" class="border-zinc-850 hover:bg-zinc-900/10">
            <TableCell class="text-sm font-mono text-zinc-200">
              {{ row.key }}
            </TableCell>
            <TableCell class="text-right">
              <div class="flex justify-end gap-2">
                <Button 
                  size="xs" 
                  variant="outline" 
                  @click="handleDownloadClick(row)"
                  class="h-7 text-[11px] border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <Download class="h-3 w-3 mr-1" />
                  {{ t('download') }}
                </Button>
                <Button 
                  size="xs" 
                  variant="destructive" 
                  @click="handleDeleteClick(row)"
                  class="h-7 text-[11px] font-semibold"
                >
                  <Trash2 class="h-3 w-3 mr-1" />
                  {{ t('delete') }}
                </Button>
              </div>
            </TableCell>
          </TableRow>
          <TableRow v-if="data.length === 0">
            <TableCell colspan="2" class="text-center text-zinc-500 py-6 text-xs">
              No attachments found
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <!-- Download confirmation Dialog -->
    <Dialog v-model:open="showDownload">
      <DialogContent class="sm:max-w-md border-zinc-800 bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle class="text-lg font-bold text-white">{{ t('download') }}</DialogTitle>
          <DialogDescription class="text-xs text-zinc-400">
            Download your attachment from S3 storage pool.
          </DialogDescription>
        </DialogHeader>
        <div class="py-4">
          <Badge variant="outline" class="border-zinc-800 bg-zinc-900 text-zinc-300 font-mono select-all p-2 rounded-lg block text-center">
            {{ curRow.key }}
          </Badge>
        </div>
        <DialogFooter>
          <Button as-child class="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold w-full">
            <a 
              :href="curDownloadUrl" 
              :download="curRow.key.replace('/', '_')"
              target="_blank"
            >
              {{ t('download') }}
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<style scoped>
/* No styles needed, pure Tailwind */
</style>
