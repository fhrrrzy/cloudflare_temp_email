<script setup>
import { onMounted } from 'vue'
import { useGlobalState } from '../../store'
import Login from '../common/Login.vue'
import { Card, CardContent } from '@/components/ui/card'

const { userSettings } = useGlobalState()
</script>

<template>
  <div class="flex justify-center w-full" v-if="userSettings.user_email">
    <Card class="w-full max-w-xl border-zinc-800 bg-card text-left">
      <CardContent class="p-6">
        <Login />
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
/* No styles needed, pure Tailwind */
</style>
