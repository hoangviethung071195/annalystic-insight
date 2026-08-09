<template>
  <div class="container">
    <NuxtLink :to="`/groups/${groupId}`" class="back-link">← Back to Group</NuxtLink>

    <div v-if="post" class="post-detail-wrapper">
      <!-- Post Meta Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">{{ post.author_name || 'Post ' + post.fb_post_id }}</h1>
          <p class="text-muted mt-1">Crawled at: {{ post.crawled_at }}</p>
        </div>
        <div class="flex gap-1" v-if="post.post_url">
          <a :href="post.post_url" target="_blank" class="btn btn-secondary btn-sm">
            🔗 Facebook Link
          </a>
        </div>
      </div>

      <!-- Post Content Section -->
      <div class="glass-card mb-3">
        <div class="card-header">
          <h3>Post Content</h3>
        </div>
        <div class="card-body">
          <div class="crawled-content">
            {{ post.content || 'No post content crawled.' }}
          </div>
        </div>
      </div>

      <!-- Comments Inner Text Section -->
      <!-- <div class="glass-card mb-3">
        <div class="card-header">
          <h3>Comments (Raw Text)</h3>
        </div>
        <div class="card-body">
          <div class="crawled-content">
            {{ post.comment_inner_text || 'No comments text crawled.' }}
          </div>
        </div>
      </div> -->

      <!-- Comments Details Section -->
      <div class="glass-card">
        <div class="card-header">
          <h3>Parsed Comments ({{ post.comments?.length || 0 }})</h3>
        </div>
        <div class="card-body">
          <div class="comments-list" v-if="post.comments && post.comments.length > 0">
            <div v-for="comment in post.comments" :key="comment.id" class="comment-item">
              <div class="comment-header">
                <span class="comment-author">{{ comment.author_name }}</span>
                <span class="comment-date text-muted">{{ comment.created_at }}</span>
              </div>
              <p class="comment-text">{{ comment.comment_text }}</p>
            </div>
          </div>
          <div v-else class="empty-state">
            <p>No parsed comments found for this post.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error state -->
    <div v-else class="glass-card">
      <div class="empty-state">
        <p>Error: Post not found.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useApi } from '~/composables/useApi'

const route = useRoute()
const api = useApi()

const groupId = Number(route.params.id)
const postId = Number(route.params.postId)

import { ref, onMounted } from 'vue'

const postResult = ref<any>(null)
const post = computed(() => postResult.value?.post)

async function fetchPost() {
  try {
    const res = await api.getPost(groupId, postId)
    postResult.value = res.data.value
  } catch (err) {
    console.error('Error fetching post:', err)
  }
}

onMounted(() => {
  fetchPost()
})
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

.card-header {
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

.crawled-content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  white-space: pre-wrap;
  background: rgba(0, 0, 0, 0.2);
  padding: 16px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--glass-border);
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.comment-item {
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.comment-item:last-child {
  padding-bottom: 0;
  border-bottom: none;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.comment-author {
  font-weight: 600;
  font-size: 13px;
  color: var(--accent);
}

.comment-date {
  font-size: 11px;
}

.comment-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
  white-space: pre-wrap;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
}
</style>
