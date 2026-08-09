import type { UseFetchOptions } from 'nuxt/app'
import { ref, type Ref } from 'vue'

export interface CrawlerStatus {
  browserOpen: boolean
  isLoggedIn: boolean
  currentTask: 'idle' | 'crawling' | 'login_required'
  crawlingGroup: string | null
}

export interface Group {
  id: number
  name: string
  url: string
  last_crawled_at: string | null
  postCount?: number
  commentCount?: number
}

export interface Comment {
  id: number
  post_id: number
  fb_comment_id: string
  author_name: string
  comment_text: string
  created_at: string
}

export interface Post {
  id: number
  group_id: number
  fb_post_id: string
  author_name: string
  post_text: string
  post_url: string
  crawled_at: string
  comments: Comment[]
}

export interface AnalysisResult {
  id: number
  group_id: number
  analysis_text: string
  created_at: string
}

interface ApiResponse<T> {
  data: Ref<T | null>
  error: Ref<any | null>
  pending: Ref<boolean>
  refresh: () => Promise<void>
}

export function useApi() {
  const config = useRuntimeConfig()
  const getElectronAPI = () => {
    if (process.client && (window as any).electronAPI) {
      return (window as any).electronAPI
    }
    return null
  }

  const electronAPI = getElectronAPI()
  const baseUrl = electronAPI ? electronAPI.apiBaseUrl : config.public.apiBaseUrl

  // Custom fetch wrapper for query requests (GET) that automatically appends JWT Token from localStorage
  function apiFetch<T>(url: string, options: any = {}) {
    const token = process.client ? localStorage.getItem('token') : null
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    }
    const cacheKey = options.key || `${url}-${token || ''}`
    return useFetch<T>(`${baseUrl}${url}`, {
      ...options,
      key: cacheKey,
      headers
    })
  }

  // Custom fetch wrapper for mutation requests (POST/PUT/DELETE) that avoids Nuxt 3 useFetch lifecycle & caching issues
  async function apiSubmit<T>(url: string, options: any = {}): Promise<ApiResponse<T>> {
    const data = ref<T | null>(null)
    const error = ref<any>(null)
    const pending = ref(true)

    try {
      const token = process.client ? localStorage.getItem('token') : null
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
      const res = await $fetch<T>(`${baseUrl}${url}`, {
        ...options,
        headers
      })
      data.value = res
    } catch (err: any) {
      error.value = err
    } finally {
      pending.value = false
    }

    return {
      data,
      error,
      pending,
      refresh: async () => {}
    }
  }

  // Wrapper for Electron IPC to match useFetch return type (with Promise/Thenable support)
  function useElectronIpc<T>(ipcCall: () => Promise<any>): ApiResponse<T> {
    const data = ref<T | null>(null)
    const error = ref<Error | null>(null)
    const pending = ref(true)

    const execute = async () => {
      pending.value = true
      try {
        const res = await ipcCall()
        data.value = res as T
      } catch (err) {
        error.value = err as Error
      } finally {
        pending.value = false
      }
    }

    const promise = (async () => {
      await execute()
      return { data, error, pending, refresh: execute }
    })()

    return {
      data,
      error,
      pending,
      refresh: execute,
      // Thenable interface to support await keyword
      then(onfulfilled?: (value: ApiResponse<T>) => any) {
        return promise.then(onfulfilled)
      },
    } as any
  }

  // Auth endpoints
  const login = (body: any) => {
    return useFetch<any>(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      body,
    })
  }

  const register = (body: any) => {
    return useFetch<any>(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      body,
    })
  }

  // Crawler endpoints
  const launchBrowser = () => {
    const electronAPI = getElectronAPI()
    if (electronAPI) {
      return useElectronIpc<{ success: boolean; message: string; status?: string }>(() =>
        electronAPI.launchBrowser()
      )
    }
    return apiSubmit<{ success: boolean; message: string; status?: string }>('/api/crawler/launch', {
      method: 'POST',
    })
  }

  const getCrawlerStatus = () => {
    const electronAPI = getElectronAPI()
    if (electronAPI) {
      return useElectronIpc<CrawlerStatus>(() => electronAPI.getCrawlerStatus())
    }
    return apiFetch<CrawlerStatus>('/api/crawler/status')
  }

  const runCrawl = (groupUrl: string, limitPosts: number = 10) => {
    const token = process.client ? localStorage.getItem('token') : null
    const electronAPI = getElectronAPI()
    if (electronAPI) {
      return useElectronIpc<{ success: boolean; message: string; groupId?: number }>(() =>
        electronAPI.runCrawl(groupUrl, limitPosts, token)
      )
    }
    return apiSubmit<{ success: boolean; message: string; groupId?: number }>('/api/crawler/run', {
      method: 'POST',
      body: { groupUrl, limitPosts },
    })
  }

  const importCrawlData = (groupUrl: string, items: any[]) => {
    return apiSubmit<{ success: boolean; count: number; groupId?: number }>('/api/crawler/import', {
      method: 'POST',
      body: { groupUrl, items },
    })
  }

  // Group endpoints
  const getGroups = () =>
    apiFetch<Group[]>('/api/groups')

  const getGroup = (id: number) =>
    apiFetch<Group>(`/api/groups/${id}`)

  const createGroup = (name: string, url: string) =>
    apiSubmit<{ success: boolean; group?: Group; message?: string }>('/api/groups', {
      method: 'POST',
      body: { name, url },
    })

  const deleteGroup = (id: number) =>
    apiSubmit<{ success: boolean }>(`/api/groups/${id}`, {
      method: 'DELETE',
    })

  // Posts endpoints
  const getGroupPosts = (groupId: number) =>
    apiFetch<{ groupId: number; posts: Post[] }>(`/api/groups/${groupId}/posts`)

  const getPost = (groupId: number, postId: number) =>
    apiFetch<{ post: Post }>(`/api/groups/${groupId}/posts/${postId}`)

  // Analysis endpoints
  const triggerAnalysis = (groupId: number) =>
    apiSubmit<{ success: boolean; analysis?: Record<string, unknown>; message: string }>(
      `/api/groups/${groupId}/analysis`,
      { method: 'POST' }
    )

  const getAnalysisHistory = (groupId: number) =>
    apiFetch<AnalysisResult[]>(`/api/groups/${groupId}/analysis`)

  const deleteAnalysis = (groupId: number, analysisId: number) =>
    apiSubmit<{ success: boolean; message?: string }>(`/api/groups/${groupId}/analysis/${analysisId}`, {
      method: 'DELETE',
    })

  return {
    login,
    register,
    launchBrowser,
    getCrawlerStatus,
    runCrawl,
    importCrawlData,
    getGroups,
    getGroup,
    createGroup,
    deleteGroup,
    getGroupPosts,
    getPost,
    triggerAnalysis,
    getAnalysisHistory,
    deleteAnalysis,
  }
}

