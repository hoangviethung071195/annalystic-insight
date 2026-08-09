<template>
  <div class="container">
    <NuxtLink to="/groups" class="back-link">← Back to Groups</NuxtLink>

    <div class="page-header" v-if="group">
      <h1 class="page-title">{{ group.name }}</h1>
      <div class="flex gap-1">
        <NuxtLink :to="`/groups/${groupId}/analysis`" class="btn btn-primary btn-sm">
          📊 Analyze
        </NuxtLink>
        <button
          class="btn btn-secondary btn-sm"
          :disabled="!crawlerStatus?.browserOpen || crawling"
          @click="crawlThisGroup"
        >
          {{ crawling ? '⏳ Crawling...' : '▶️ Crawl' }}
        </button>
      </div>
    </div>

    <div v-if="crawlMessage" class="glass-card mb-2">
      <div class="card-body">{{ crawlMessage }}</div>
    </div>

    <!-- Posts List -->
    <div class="glass-card" v-if="posts.length > 0">
      <div class="card-header">
        <h3>Posts ({{ posts.length }})</h3>
      </div>
      <div class="posts-list">
        <div v-for="post in posts" :key="post.id" class="post-item">
          <div class="post-header">
            <span class="post-author">{{ post.author_name || 'Post ' + post.fb_post_id }}</span>
            <span class="post-date text-muted">{{ post.crawled_at }}</span>
          </div>
          <!-- Show post.content summary -->
          <p class="post-text">
            {{ post.content ? (post.content.length > 250 ? post.content.substring(0, 250) + '...' : post.content) : 'No content' }}
          </p>
          <div class="post-actions flex gap-1 items-center mt-2">
            <NuxtLink :to="`/groups/${groupId}/posts/${post.id}`" class="btn btn-primary btn-sm">
              📄 View Full Details
            </NuxtLink>
            <!-- Temporarily hidden: <span class="text-muted text-sm ml-2">💬 {{ post.comments?.length || 0 }} Comments</span> -->
          </div>
        </div>
      </div>
    </div>

    <div v-else class="glass-card">
      <div class="empty-state">
        <p>No posts found. Run a crawl to collect data.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'
import type { CrawlerStatus } from '~/composables/useApi'

const route = useRoute()
const api = useApi()
const groupId = Number(route.params.id)

const crawlMessage = ref('')
const crawling = ref(false)
const expandedPosts = ref<Record<number, boolean>>({})

const group = ref<any>(null)
const posts = ref<any[]>([])
const crawlerStatus = ref<any>(null)

let refreshPosts: any = null
let postsDataRef: any = null

onMounted(async () => {
  try {
    console.log(`Đang tải dữ liệu chi tiết cho nhóm ID: ${groupId}...`)
    const [groupRes, postsRes, statusRes] = await Promise.all([
      api.getGroup(groupId),
      api.getGroupPosts(groupId),
      api.getCrawlerStatus()
    ])
    
    group.value = groupRes.data.value
    postsDataRef = postsRes.data
    posts.value = postsRes.data.value?.posts || []
    crawlerStatus.value = statusRes.data.value
    refreshPosts = postsRes.refresh
    console.log("Tải dữ liệu chi tiết nhóm thành công.")
  } catch (err) {
    console.error("Lỗi khi tải dữ liệu chi tiết nhóm:", err)
  }
})

async function crawlThisGroup() {
  if (!group.value) return
  crawling.value = true
  crawlMessage.value = ''
  try {
    const { data } = await api.runCrawl(group.value.url, 10)
    const result = data.value
    if (result?.success) {
      crawlMessage.value = `✅ ${result.message}`
      await refreshPosts()
      posts.value = postsDataRef.value?.posts || []
    } else {
      crawlMessage.value = `❌ ${result?.message || 'Crawl failed'}`
    }
  } catch (err) {
    crawlMessage.value = `❌ Error: ${(err as Error).message}`
  } finally {
    crawling.value = false
  }
}

function toggleComments(postId: number) {
  expandedPosts.value[postId] = !expandedPosts.value[postId]
}
</script>

<style scoped>
.back-link {
  display: inline-block;
  margin-bottom: 16px;
  font-size: 14px;
  color: var(--text-secondary);
}

.back-link:hover {
  color: var(--accent);
}

.card-body {
  padding: 16px 20px;
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

.posts-list {
  padding: 0;
}

.post-item {
  padding: 20px;
  border-bottom: 1px solid var(--glass-border);
}

.post-item:last-child {
  border-bottom: none;
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.post-author {
  font-weight: 600;
  font-size: 14px;
}

.post-date {
  font-size: 12px;
}

.post-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: 12px;
  white-space: pre-wrap;
}

.post-comments {
  margin-top: 12px;
}

.comments-section {
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: var(--radius-sm);
}

.comment-item {
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-author {
  font-size: 13px;
  color: var(--accent);
}

.comment-text {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 4px 0;
  line-height: 1.5;
}

.comment-date {
  font-size: 11px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
}
</style>
