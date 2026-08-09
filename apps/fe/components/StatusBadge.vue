<template>
  <div class="status-badge" :class="statusClass">
    <span class="status-dot" :class="statusClass"></span>
    <span>{{ label }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CrawlerStatus } from '~/composables/useApi'

const props = defineProps<{
  status: CrawlerStatus | null
}>()

const statusClass = computed(() => {
  if (!props.status) return 'idle'
  if (props.status.currentTask === 'crawling') return 'active'
  if (props.status.currentTask === 'login_required') return 'warning'
  if (props.status.browserOpen) return 'active'
  return 'idle'
})

const label = computed(() => {
  if (!props.status) return 'Unknown'
  if (props.status.currentTask === 'crawling') return 'Crawling...'
  if (props.status.currentTask === 'login_required') return 'Login Required'
  if (props.status.browserOpen && props.status.isLoggedIn) return 'Browser Ready'
  if (props.status.browserOpen) return 'Browser Open'
  return 'Offline'
})
</script>
