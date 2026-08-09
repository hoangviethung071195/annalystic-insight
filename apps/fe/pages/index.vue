<template>
  <div class="container">
    <div class="page-header">
      <h1 class="page-title">Market Insight Dashboard</h1>
      <div class="flex gap-1 items-center">
        <span class="badge" :class="processStatusClass">{{ crawlerStatusText }}</span>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid-2 mb-3">
      <div class="glass-card stat-card">
        <div class="stat-label">Facebook Groups Analyzed</div>
        <div class="stat-value">{{ groups?.length || 0 }}</div>
      </div>
      <div class="glass-card stat-card">
        <div class="stat-label">Total Crawled Posts</div>
        <div class="stat-value">{{ totalPosts }}</div>
      </div>
    </div>

    <!-- Crawl & Import Controls -->
    <div class="grid-2 mb-3">
      <!-- Direct JSON Import -->
      <div class="glass-card">
        <div class="card-header">
          <h3>📂 Import Apify JSON Dataset</h3>
        </div>
        <div class="card-body">
          <p class="text-muted mb-2">Upload the coved JSON file from Apify Scraper to analyze immediately.</p>
          <div class="file-uploader" @dragover.prevent @drop.prevent="handleFileDrop" @click="triggerFileSelect">
            <input
              type="file"
              ref="fileInput"
              style="display: none"
              accept=".json"
              @change="handleFileSelect"
            />
            <div class="upload-content">
              <span class="upload-icon">📤</span>
              <span class="upload-text">Drag & drop your JSON file here, or click to browse</span>
            </div>
          </div>
          <div class="flex gap-1 items-center mt-2">
            <input
              v-model="importGroupUrl"
              type="text"
              class="input"
              placeholder="Facebook Group URL for import context"
              :disabled="importing"
            />
          </div>
          <p v-if="importMessage" class="mt-1 text-secondary">{{ importMessage }}</p>
        </div>
      </div>

      <!-- Live Fetch via Apify API -->
      <div class="glass-card">
        <div class="card-header">
          <h3>⚡ Trigger Apify Crawler Run</h3>
        </div>
        <div class="card-body">
          <p class="text-muted mb-2">Provide the Facebook Group URL and trigger Apify Scraper directly via API.</p>
          <div class="crawl-form" style="padding: 0;">
            <input
              v-model="crawlUrl"
              type="text"
              class="input mb-2"
              placeholder="Facebook Group URL (e.g., https://www.facebook.com/groups/xxxxx)"
              :disabled="crawling"
            />
            <div class="flex gap-1 items-center">
              <input
                v-model.number="limitPosts"
                type="number"
                class="input"
                style="width: 120px"
                placeholder="Limit"
                min="1"
                max="100"
                :disabled="crawling"
              />
              <button
                class="btn btn-primary"
                :disabled="crawling || !crawlUrl"
                @click="startCrawl"
              >
                {{ crawling ? '⏳ Running...' : '🚀 Start Crawl' }}
              </button>
            </div>
            <p v-if="crawlMessage" class="mt-1 text-secondary">{{ crawlMessage }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Groups -->
    <div class="glass-card">
      <div class="card-header">
        <h3>Recent Groups & WNDI Reports</h3>
        <NuxtLink to="/groups" class="text-accent">View All →</NuxtLink>
      </div>
      <div class="table-wrapper">
        <table class="data-table" v-if="groups && groups.length > 0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Posts</th>
              <th>Last Crawled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="group in groups.slice(0, 5)" :key="group.id">
              <td>
                <NuxtLink :to="`/groups/${group.id}`" class="text-accent font-semibold">
                  {{ group.name }}
                </NuxtLink>
              </td>
              <td>{{ group.postCount || 0 }}</td>
              <td class="text-muted">{{ group.last_crawled_at || 'Never' }}</td>
              <td>
                <div style="display: flex; gap: 8px;">
                  <NuxtLink :to="`/groups/${group.id}/analysis`" class="btn btn-accent btn-xs" style="padding: 4px 8px; text-decoration: none;">
                    📊 Open Report
                  </NuxtLink>
                  <button class="btn btn-danger btn-xs" style="padding: 4px 8px;" @click="confirmDeleteGroup(group.id)">
                    🗑️ Delete
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <p>No groups yet. Upload a dataset or run a crawl to get started!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useApi } from '~/composables/useApi'

const api = useApi()
const crawlUrl = ref('')
const importGroupUrl = ref('')
const limitPosts = ref(20)

const crawlMessage = ref('')
const importMessage = ref('')
const loading = ref(false)
const crawling = ref(false)
const importing = ref(false)

const fileInput = ref<HTMLInputElement | null>(null)
const crawlerStatus = ref<any>(null)
const groups = ref<any[]>([])

watch(() => crawlerStatus.value?.currentTask, async (newVal, oldVal) => {
  if (oldVal === 'crawling' && newVal === 'idle') {
    // Apify crawl finished, refresh group list and statistics
    await fetchData()
  }
})

onMounted(async () => {
  await fetchData()
  // Poll status periodically
  setInterval(fetchStatus, 5000)
})

async function fetchData() {
  try {
    const [statusRes, groupsRes] = await Promise.all([
      api.getCrawlerStatus(),
      api.getGroups()
    ])
    
    crawlerStatus.value = statusRes.data.value
    groups.value = groupsRes.data.value || []
    
    refreshStatus = statusRes.refresh
    refreshGroups = groupsRes.refresh
  } catch (err) {
    console.error("Error loading dashboard data:", err)
  }
}

const totalPosts = computed(() =>
  groups.value?.reduce((sum, g) => sum + (g.postCount || 0), 0) || 0
)

const crawlerStatusText = computed(() => {
  if (crawlerStatus.value?.currentTask === 'crawling') return '⏳ Apify Job Running'
  if (crawlerStatus.value?.currentTask === 'error') return '❌ Scraper Error'
  return '🟢 System Ready'
})

const processStatusClass = computed(() => {
  if (crawlerStatus.value?.currentTask === 'crawling') return 'badge-secondary'
  if (crawlerStatus.value?.currentTask === 'error') return 'badge-danger'
  return 'badge-success'
})

async function fetchStatus() {
  try {
    const statusRes = await api.getCrawlerStatus()
    crawlerStatus.value = statusRes.data.value
  } catch (err) {
    console.error("Error refresh status:", err)
  }
}

async function fetchGroups() {
  try {
    const groupsRes = await api.getGroups()
    groups.value = groupsRes.data.value || []
  } catch (err) {
    console.error("Error refresh groups:", err)
  }
}

function triggerFileSelect() {
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    processFile(target.files[0])
  }
}

function handleFileDrop(event: DragEvent) {
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    processFile(event.dataTransfer.files[0])
  }
}

function processFile(file: File) {
  if (!importGroupUrl.value) {
    alert('Please enter a Facebook Group URL first so we can associate this dataset.')
    return
  }
  
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const items = JSON.parse(e.target?.result as string)
      if (!Array.isArray(items)) {
        alert('Invalid format. Apify datasets must be a JSON array.')
        return
      }
      
      importing.value = true
      importMessage.value = '⏳ Importing dataset...'
      
      const { data, error } = await api.importCrawlData(importGroupUrl.value, items)
      if (error.value) {
        importMessage.value = `❌ Error: ${error.value.message || error.value}`
      } else if (data.value?.success) {
        importMessage.value = `✅ Successfully imported ${data.value.count} posts!`
        importGroupUrl.value = ''
        await fetchGroups()
      } else {
        importMessage.value = '❌ Import failed.'
      }
    } catch (err) {
      alert(`Error parsing JSON: ${(err as Error).message}`)
    } finally {
      importing.value = false
    }
  }
  reader.readAsText(file)
}

async function startCrawl() {
  if (!crawlUrl.value) return
  crawling.value = true
  crawlMessage.value = ''
  try {
    const { data, error } = await api.runCrawl(crawlUrl.value, limitPosts.value)
    if (error.value) {
      crawlMessage.value = `❌ Error: ${error.value.message || error.value}`
      return
    }
    const result = data.value
    if (result?.success) {
      crawlMessage.value = `✅ ${result.message}`
    } else {
      crawlMessage.value = `❌ ${result?.message || 'Crawl request failed'}`
    }
  } catch (err) {
    crawlMessage.value = `❌ Error: ${(err as Error).message}`
  } finally {
    crawling.value = false
  }
}

async function confirmDeleteGroup(groupId: number) {
  if (!confirm('Are you sure you want to delete this group and all its WNDI analysis?')) return
  await api.deleteGroup(groupId)
  await fetchGroups()
}
</script>

<style scoped>
.stat-card {
  padding: 20px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--glass-border);
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
}

.card-body {
  padding: 20px;
}

.file-uploader {
  border: 2px dashed var(--glass-border);
  border-radius: var(--border-radius);
  padding: 30px;
  text-align: center;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.02);
  transition: all 0.2s ease;
}

.file-uploader:hover {
  border-color: var(--accent);
  background: rgba(255, 255, 255, 0.05);
}

.upload-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  font-size: 32px;
}

.upload-text {
  font-size: 14px;
  color: var(--text-secondary);
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
}
</style>
