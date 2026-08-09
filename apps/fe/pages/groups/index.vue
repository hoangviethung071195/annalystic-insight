<template>
  <div class="container">
    <div class="page-header">
      <h1 class="page-title">Groups</h1>
      <button class="btn btn-primary btn-sm" @click="showAddForm = !showAddForm">
        + Add Group
      </button>
    </div>

    <!-- Add Group Form -->
    <div v-if="showAddForm" class="glass-card mb-3">
      <div class="card-body">
        <h3 class="mb-2">Add New Group</h3>
        <div class="flex gap-2 flex-wrap">
          <input
            v-model="newGroupName"
            type="text"
            class="input"
            style="flex: 1; min-width: 200px"
            placeholder="Group Name"
          />
          <input
            v-model="newGroupUrl"
            type="text"
            class="input"
            style="flex: 2; min-width: 300px"
            placeholder="Facebook Group URL"
          />
          <button class="btn btn-primary" :disabled="!newGroupName || !newGroupUrl" @click="addGroup">
            Save
          </button>
        </div>
        <p v-if="addMessage" class="mt-1 text-secondary">{{ addMessage }}</p>
      </div>
    </div>

    <!-- Groups List -->
    <div class="glass-card">
      <div class="table-wrapper">
        <table class="data-table" v-if="groups.length > 0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Posts</th>
              <!-- <th>Comments</th> -->
              <th>Last Crawled</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="group in groups" :key="group.id">
              <td>
                <NuxtLink :to="`/groups/${group.id}`" class="text-accent">
                  {{ group.name }}
                </NuxtLink>
              </td>
              <td>{{ group.postCount || 0 }}</td>
              <!-- <td>{{ group.commentCount || 0 }}</td> -->
              <td class="text-muted">{{ group.last_crawled_at || 'Never' }}</td>
              <td>
                <div class="flex gap-1">
                  <NuxtLink
                    :to="`/groups/${group.id}/analysis`"
                    class="btn btn-secondary btn-sm"
                  >
                    📊 Analyze
                  </NuxtLink>
                  <button
                    class="btn btn-danger btn-sm"
                    @click="removeGroup(group.id)"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div v-else class="empty-state">
          <p>No groups yet. Click "Add Group" to get started.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useApi } from '~/composables/useApi'

const api = useApi()
const showAddForm = ref(false)
const newGroupName = ref('')
const newGroupUrl = ref('')
const addMessage = ref('')

const groups = ref<any[]>([])
let refreshGroups: any = null
let groupsDataRef: any = null

onMounted(async () => {
  try {
    console.log("Đang tải danh sách nhóm...")
    const { data, refresh } = await api.getGroups()
    groupsDataRef = data
    groups.value = data.value || []
    refreshGroups = refresh
    console.log("Tải danh sách nhóm thành công.")
  } catch (err) {
    console.error("Lỗi tải danh sách nhóm:", err)
  }
})

async function addGroup() {
  if (!newGroupName.value || !newGroupUrl.value) return
  const { data } = await api.createGroup(newGroupName.value, newGroupUrl.value)
  const result = data.value
  if (result?.success) {
    newGroupName.value = ''
    newGroupUrl.value = ''
    addMessage.value = '✅ Group added successfully'
    await refreshGroups()
    groups.value = groupsDataRef.value || []
  } else {
    addMessage.value = `❌ ${result?.message || 'Failed to add group'}`
  }
}

async function removeGroup(id: number) {
  if (!confirm('Delete this group and all its data?')) return
  const { data } = await api.deleteGroup(id)
  if (data.value?.success) {
    await refreshGroups()
    groups.value = groupsDataRef.value || []
  }
}
</script>

<style scoped>
.card-body {
  padding: 20px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
}
</style>
