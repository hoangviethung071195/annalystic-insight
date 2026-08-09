<template>
  <div class="container">
    <div class="mb-2">
      <NuxtLink :to="`/groups/${groupId}`" class="back-link">← Back to Group Posts</NuxtLink>
    </div>

    <div class="page-header" v-if="group" style="align-items: flex-start; flex-direction: column; gap: 8px;">
      <h1 class="page-title" style="margin: 0;">Market Insight Report: {{ group.name }}</h1>
      <p class="text-muted" style="margin: 0;">Group URL: <a :href="group.url" target="_blank" class="text-accent">{{ group.url }}</a></p>
      
      <div style="display: flex; gap: 12px; margin-top: 12px;">
        <button
          class="btn btn-primary"
          :disabled="analyzing"
          @click="runAnalysis"
        >
          {{ analyzing ? '⏳ Analyzing dataset with AI...' : '🤖 Generate WNDI Analysis' }}
        </button>
        <button
          class="btn btn-secondary"
          v-if="parsedAnalysis"
          @click="downloadStaticReport"
        >
          📥 Download HTML Report
        </button>
      </div>
    </div>

    <!-- Error message -->
    <div v-if="errorMsg" class="glass-card mb-2" style="border-left: 4px solid var(--danger);">
      <div class="card-body text-danger">{{ errorMsg }}</div>
    </div>

    <!-- History select if multiple runs exist -->
    <div v-if="history.length > 1" class="glass-card mb-3">
      <div class="card-header">
        <h3>Previous Analysis Runs</h3>
      </div>
      <div style="padding: 12px 20px; display: flex; gap: 8px; flex-wrap: wrap;">
        <button
          v-for="item in history"
          :key="item.id"
          class="btn btn-xs"
          :class="selectedAnalysis === item.id ? 'btn-primary' : 'btn-secondary'"
          @click="selectedAnalysis = item.id"
        >
          {{ new Date(item.created_at).toLocaleString() }}
        </button>
      </div>
    </div>

    <div v-if="parsedAnalysis" class="report-dashboard">
      <!-- 1 Minute Executive Summary -->
      <section class="glass-card mb-3" style="border-left: 4px solid var(--accent);">
        <div class="card-header">
          <h3>📋 Tóm tắt điều hành (1 phút)</h3>
        </div>
        <div class="card-body">
          <ul style="margin: 0; padding-left: 20px; font-size: 15px; line-height: 1.6;">
            <li v-for="(sum, i) in parsedAnalysis.oneMinuteSummary" :key="i" style="margin-bottom: 8px;">
              {{ sum }}
            </li>
          </ul>
        </div>
      </section>

      <!-- Topic & Content Type Distributions -->
      <div class="grid-2 mb-3">
        <div class="glass-card">
          <div class="card-header">
            <h3>📊 Phân bố chủ đề</h3>
          </div>
          <div class="card-body" style="height: 300px; position: relative;">
            <canvas id="topicChartCanvas"></canvas>
          </div>
        </div>
        <div class="glass-card">
          <div class="card-header">
            <h3>📑 Loại nội dung</h3>
          </div>
          <div class="card-body" style="height: 300px; position: relative;">
            <canvas id="typeChartCanvas"></canvas>
          </div>
        </div>
      </div>

      <!-- Want - Need - Demand Progress Bars -->
      <div class="grid-3 mb-3">
        <!-- Wants -->
        <div class="glass-card" style="border-top: 4px solid #db2777;">
          <div class="card-header">
            <h3>💖 Top Wants (Mong muốn)</h3>
          </div>
          <div class="card-body">
            <div v-for="(w, idx) in parsedAnalysis.topWants" :key="idx" class="bar-row mb-2">
              <div class="bar-label" style="font-size: 13px; font-weight: 500;">{{ w.label }}</div>
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                <div class="bar-track" style="flex: 1; height: 8px; background: rgba(219, 39, 119, 0.1); border-radius: 4px; overflow: hidden;">
                  <div class="bar-fill" :style="{ width: getPercentage(w.val, parsedAnalysis.topWants) + '%', background: '#db2777', height: '100%' }"></div>
                </div>
                <span style="font-size: 12px; font-weight: 600; color: #db2777;">{{ w.val }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Needs -->
        <div class="glass-card" style="border-top: 4px solid #2563eb;">
          <div class="card-header">
            <h3>🔍 Top Needs (Nhu cầu thực tế)</h3>
          </div>
          <div class="card-body">
            <div v-for="(n, idx) in parsedAnalysis.topNeeds" :key="idx" class="bar-row mb-2">
              <div class="bar-label" style="font-size: 13px; font-weight: 500;">{{ n.label }}</div>
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                <div class="bar-track" style="flex: 1; height: 8px; background: rgba(37, 99, 235, 0.1); border-radius: 4px; overflow: hidden;">
                  <div class="bar-fill" :style="{ width: getPercentage(n.val, parsedAnalysis.topNeeds) + '%', background: '#2563eb', height: '100%' }"></div>
                </div>
                <span style="font-size: 12px; font-weight: 600; color: #2563eb;">{{ n.val }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Demands -->
        <div class="glass-card" style="border-top: 4px solid #059669;">
          <div class="card-header">
            <h3>🛒 Top Demands (Nhu cầu thị trường)</h3>
          </div>
          <div class="card-body">
            <div v-for="(d, idx) in parsedAnalysis.topDemands" :key="idx" class="bar-row mb-2">
              <div class="bar-label" style="font-size: 13px; font-weight: 500;">{{ d.label }}</div>
              <div style="display: flex; align-items: center; gap: 8px; margin-top: 4px;">
                <div class="bar-track" style="flex: 1; height: 8px; background: rgba(5, 150, 105, 0.1); border-radius: 4px; overflow: hidden;">
                  <div class="bar-fill" :style="{ width: getPercentage(d.val, parsedAnalysis.topDemands) + '%', background: '#059669', height: '100%' }"></div>
                </div>
                <span style="font-size: 12px; font-weight: 600; color: #059669;">{{ d.val }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Insights -->
      <section class="mb-3">
        <h3 class="mb-2">💡 Key Insights & Cơ hội</h3>
        <div class="insight-grid">
          <div v-for="(insight, idx) in parsedAnalysis.insights" :key="idx" class="glass-card p-3 mb-2" style="display: flex; gap: 16px; align-items: flex-start;">
            <div class="insight-num" style="background: rgba(225, 29, 72, 0.1); color: var(--accent); padding: 8px 14px; border-radius: 12px; font-weight: 700; font-size: 18px;">
              {{ insight.num }}
            </div>
            <div>
              <h4 style="margin: 0 0 6px; font-size: 15px; font-weight: 600;">{{ insight.title }}</h4>
              <p style="margin: 0; font-size: 14px; color: var(--text-secondary); line-height: 1.5;">{{ insight.content }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Actionable Recommendations -->
      <section class="glass-card mb-3">
        <div class="card-header">
          <h3>🎯 Khuyến nghị hành động</h3>
        </div>
        <div class="card-body" style="padding: 0;">
          <div v-for="(rec, idx) in parsedAnalysis.recommendations" :key="idx" style="padding: 16px 20px; border-bottom: 1px solid var(--glass-border); display: flex; gap: 16px; align-items: center;">
            <span class="badge badge-primary" style="min-width: 90px; text-align: center;">{{ rec.tag }}</span>
            <p style="margin: 0; font-size: 14px; line-height: 1.5;">{{ rec.content }}</p>
          </div>
        </div>
      </section>

      <!-- Representative Posts Table -->
      <section class="glass-card mb-3">
        <div class="card-header">
          <h3>📌 Bài viết tiêu biểu & Phân loại WNDI</h3>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Nội dung bài viết</th>
                <th>Want</th>
                <th>Need</th>
                <th>Demand</th>
                <th>Tương tác</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(p, idx) in parsedAnalysis.representativePosts" :key="idx">
                <td style="max-width: 300px; font-size: 13.5px; line-height: 1.5;">{{ p.content }}</td>
                <td style="font-size: 13px; font-weight: 500; color: #db2777;">{{ p.want }}</td>
                <td style="font-size: 13px; font-weight: 500; color: #2563eb;">{{ p.need }}</td>
                <td style="font-size: 13px; font-weight: 500; color: #059669;">{{ p.demand }}</td>
                <td style="font-weight: 600; text-align: center; color: var(--accent);">{{ p.engScore }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <div v-else class="glass-card">
      <div class="empty-state">
        <p>No analysis yet. Click "Generate WNDI Analysis" to start analyzing the coved Facebook Group data using Gemini/DeepSeek AI.</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useApi } from '~/composables/useApi'

const route = useRoute()
const api = useApi()
const groupId = Number(route.params.id)

const group = ref<any>(null)
const history = ref<any[]>([])
const analyzing = ref(false)
const errorMsg = ref('')
const selectedAnalysis = ref<number | null>(null)

let topicChart: any = null
let typeChart: any = null

const currentAnalysis = computed(() => {
  if (!selectedAnalysis.value && history.value?.length) {
    selectedAnalysis.value = history.value[0].id
  }
  return history.value?.find((a) => a.id === selectedAnalysis.value) || null
})

const parsedAnalysis = computed(() => {
  if (!currentAnalysis.value) return null
  try {
    return JSON.parse(currentAnalysis.value.analysis_text)
  } catch {
    return null
  }
})

// Calculate percentage for bar charts
function getPercentage(val: number, list: any[]) {
  const max = Math.max(...list.map(item => item.val), 1)
  return (val / max) * 100
}

async function fetchData() {
  const { data: groupData } = await api.getGroup(groupId)
  group.value = groupData.value

  const { data: historyData } = await api.getAnalysisHistory(groupId)
  history.value = historyData.value || []
}

async function runAnalysis() {
  analyzing.value = true
  errorMsg.value = ''
  try {
    const { data, error } = await api.triggerAnalysis(groupId)
    if (error.value) {
      errorMsg.value = error.value.data?.message || error.value.message || 'Analysis failed'
      return
    }
    const result = data.value
    if (result?.success) {
      await fetchData()
      if (history.value.length > 0) {
        selectedAnalysis.value = history.value[0].id
      }
    } else {
      errorMsg.value = result?.message || 'Analysis failed'
    }
  } catch (err) {
    errorMsg.value = `Error: ${(err as Error).message}`
  } finally {
    analyzing.value = false
  }
}

// Render the distributions using Chart.js
function renderCharts() {
  if (!parsedAnalysis.value) return

  nextTick(() => {
    // Destruct charts if already exists
    if (topicChart) topicChart.destroy()
    if (typeChart) typeChart.destroy()

    const ChartClass = (window as any).Chart
    if (!ChartClass) {
      console.warn("Chart.js not loaded yet.")
      return
    }

    const topicData = parsedAnalysis.value.topicDistribution || {}
    const topicLabels = Object.keys(topicData)
    const topicValues = Object.values(topicData)

    const typeData = parsedAnalysis.value.contentTypeDistribution || {}
    const typeLabels = Object.keys(typeData)
    const typeValues = Object.values(typeData)

    const palette = ['#e11d48', '#db2777', '#a855f7', '#7c3aed', '#2563eb', '#0891b2', '#059669', '#d97706', '#64748b']

    const topicCtx = document.getElementById('topicChartCanvas') as HTMLCanvasElement
    if (topicCtx) {
      topicChart = new ChartClass(topicCtx, {
        type: 'doughnut',
        data: {
          labels: topicLabels,
          datasets: [{ data: topicValues, backgroundColor: palette, borderWidth: 0 }]
        },
        options: {
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 }, color: '#94a3b8' } }
          },
          maintainAspectRatio: false
        }
      })
    }

    const typeCtx = document.getElementById('typeChartCanvas') as HTMLCanvasElement
    if (typeCtx) {
      typeChart = new ChartClass(typeCtx, {
        type: 'bar',
        data: {
          labels: typeLabels,
          datasets: [{
            data: typeValues,
            backgroundColor: '#db2777',
            borderRadius: 8,
            label: 'Bài viết'
          }]
        },
        options: {
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { precision: 0, color: '#94a3b8' } },
            y: { grid: { display: false }, ticks: { color: '#94a3b8' } }
          },
          maintainAspectRatio: false
        }
      })
    }
  })
}

// Watch selection to redraw charts
watch([currentAnalysis, parsedAnalysis], () => {
  renderCharts()
}, { immediate: true })

onMounted(async () => {
  await fetchData()
  renderCharts()
})

// Generate & download the premium standalone static report HTML
function downloadStaticReport() {
  if (!parsedAnalysis.value || !group.value) return

  const data = parsedAnalysis.value
  const groupName = group.value.name
  const groupUrl = group.value.url
  const createdDate = new Date(currentAnalysis.value.created_at).toLocaleString()

  // Construct bars
  const wantsHtml = data.topWants.map((w: any) => `
    <div class="bar-row">
      <div class="bar-label">${w.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${getPercentage(w.val, data.topWants)}%;background:#db2777"></div></div>
      <div class="bar-val">${w.val}</div>
    </div>
  `).join('')

  const needsHtml = data.topNeeds.map((n: any) => `
    <div class="bar-row">
      <div class="bar-label">${n.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${getPercentage(n.val, data.topNeeds)}%;background:#2563eb"></div></div>
      <div class="bar-val">${n.val}</div>
    </div>
  `).join('')

  const demandsHtml = data.topDemands.map((d: any) => `
    <div class="bar-row">
      <div class="bar-label">${d.label}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${getPercentage(d.val, data.topDemands)}%;background:#059669"></div></div>
      <div class="bar-val">${d.val}</div>
    </div>
  `).join('')

  // Construct insights
  const insightsHtml = data.insights.map((ins: any) => `
    <div class="insight-card">
      <div class="insight-num">${ins.num}</div>
      <div>
        <h3>${ins.title}</h3>
        <p>${ins.content}</p>
      </div>
    </div>
  `).join('')

  // Construct recommendations
  const recsHtml = data.recommendations.map((rec: any) => `
    <div class="rec">
      <span class="rec-tag">${rec.tag}</span>
      <p>${rec.content}</p>
    </div>
  `).join('')

  // Construct table rows
  const tableRowsHtml = data.representativePosts.map((post: any) => `
    <tr>
      <td>${post.content}</td>
      <td>${post.want}</td>
      <td>${post.need}</td>
      <td>${post.demand}</td>
      <td>${post.engScore}</td>
    </tr>
  `).join('')

  const topicLabelsJson = JSON.stringify(Object.keys(data.topicDistribution))
  const topicValuesJson = JSON.stringify(Object.values(data.topicDistribution))
  const typeLabelsJson = JSON.stringify(Object.keys(data.contentTypeDistribution))
  const typeValuesJson = JSON.stringify(Object.values(data.contentTypeDistribution))

  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
` + '<' + 'head' + '>' + `
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Báo cáo Phân tích Thị trường WNDI | ${groupName}</title>
` + '<' + 'script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js">' + '<' + '/script' + '>' + `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,500;700&display=swap" rel="stylesheet">
` + '<' + 'style' + '>' + `
:root {
  --bg: #fff7f9;
  --bg2: #ffffff;
  --ink: #1f1220;
  --muted: #6b5b66;
  --line: #f0d7e0;
  --rose: #e11d48;
  --pink: #db2777;
  --violet: #7c3aed;
  --blue: #2563eb;
  --green: #059669;
  --amber: #d97706;
  --shadow: 0 10px 40px rgba(225,29,72,.08);
  --radius: 18px;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: "Be Vietnam Pro", system-ui, sans-serif;
  color: var(--ink);
  background:
    radial-gradient(1200px 600px at 10% -10%, #ffe4ec 0%, transparent 60%),
    radial-gradient(900px 500px at 100% 0%, #ede9fe 0%, transparent 50%),
    var(--bg);
  line-height: 1.55;
}
.wrap { max-width: 1180px; margin: 0 auto; padding: 28px 20px 80px; }
.hero {
  background: linear-gradient(135deg, #881337 0%, #be123c 40%, #db2777 75%, #a78bfa 100%);
  color: #fff;
  border-radius: 28px;
  padding: 36px 36px 32px;
  box-shadow: var(--shadow);
  position: relative;
  overflow: hidden;
}
.hero::after {
  content: "";
  position: absolute; right: -40px; top: -40px;
  width: 220px; height: 220px; border-radius: 50%;
  background: rgba(255,255,255,.12);
}
.hero .eyebrow {
  display: inline-flex; gap: 8px; align-items: center;
  background: rgba(255,255,255,.15);
  border: 1px solid rgba(255,255,255,.25);
  padding: 6px 12px; border-radius: 999px;
  font-size: 12px; letter-spacing: .04em; text-transform: uppercase;
}
.hero h1 {
  font-family: Fraunces, Georgia, serif;
  font-size: clamp(1.7rem, 3.5vw, 2.5rem);
  margin: 14px 0 8px; line-height: 1.2;
}
.hero p.lead { max-width: 62ch; opacity: .92; margin: 0 0 18px; font-weight: 300; }
.hero-meta { display: flex; flex-wrap: wrap; gap: 10px 18px; font-size: 13px; opacity: .9; }
.hero a { color: #fff; }
section {
  margin-top: 36px;
}
.section-head {
  display: flex; align-items: end; justify-content: space-between;
  gap: 12px; margin-bottom: 14px;
}
.section-head h2 {
  font-family: Fraunces, Georgia, serif;
  font-size: 1.45rem; margin: 0;
}
.section-head p { margin: 0; color: var(--muted); font-size: 14px; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
.card {
  background: var(--bg2);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 20px;
  box-shadow: var(--shadow);
}
.card h3 { margin: 0 0 12px; font-size: 1rem; }
.card.accent-want { border-top: 4px solid var(--pink); }
.card.accent-need { border-top: 4px solid var(--blue); }
.card.accent-demand { border-top: 4px solid var(--green); }
.muted { color: var(--muted); font-size: 13px; }
.bar-row { display: grid; grid-template-columns: 1fr 1.4fr 36px; gap: 8px; align-items: center; margin-bottom: 12px; }
.bar-label { font-size: 12.5px; color: var(--ink); line-height: 1.3; }
.bar-track { height: 8px; background: #fce7f3; border-radius: 99px; overflow: hidden; }
.bar-fill { height: 100%; border-radius: 99px; }
.bar-val { font-size: 12px; font-weight: 600; text-align: right; color: var(--muted); }
.insight-card {
  display: grid; grid-template-columns: 48px 1fr; gap: 14px;
  background: var(--bg2); border: 1px solid var(--line);
  border-radius: var(--radius); padding: 18px; margin-bottom: 10px;
  box-shadow: var(--shadow);
}
.insight-num {
  width: 48px; height: 48px; border-radius: 14px;
  background: #fdf2f8; color: var(--rose);
  display: flex; align-items: center; justify-content: center;
  font-family: Fraunces, Georgia, serif; font-weight: 700; font-size: 1.1rem;
}
.insight-card h3 { margin: 0 0 6px; font-size: 1rem; }
.insight-card p { margin: 0; color: var(--muted); font-size: 14px; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid var(--line); vertical-align: top; }
th { font-size: 11px; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
.rec {
  display: grid; grid-template-columns: 90px 1fr; gap: 12px; align-items: start;
  padding: 12px 0; border-bottom: 1px solid var(--line);
}
.rec:last-child { border-bottom: 0; }
.rec-tag {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  background: #ede9fe; color: #5b21b6; border-radius: 8px;
  padding: 6px 8px; text-align: center;
}
.rec p { margin: 0; font-size: 14px; }
.chart-box { position: relative; height: 280px; }
.footer {
  margin-top: 40px; text-align: center; color: var(--muted); font-size: 12px;
}
@media (max-width: 960px) {
  .kpis { grid-template-columns: repeat(3, 1fr); }
  .grid-2, .grid-3, .pillars { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .kpis { grid-template-columns: repeat(2, 1fr); }
}
.kpis {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  margin-top: -28px;
  position: relative;
  z-index: 2;
  padding: 0 12px;
}
.kpi {
  background: var(--bg2);
  border: 1px solid var(--line);
  border-radius: 16px;
  padding: 16px 14px;
  box-shadow: var(--shadow);
  text-align: center;
}
.kpi .n {
  font-family: Fraunces, Georgia, serif;
  font-size: 1.65rem; font-weight: 700; color: var(--rose);
}
.kpi .l { font-size: 11px; color: var(--muted); text-transform: uppercase; letter-spacing: .04em; margin-top: 4px; }
.pillars {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 16px;
}
.pillar {
  border-radius: 16px; padding: 16px; color: #fff; min-height: 120px;
}
.pillar b { display: block; font-size: 12px; opacity: .85; letter-spacing: .06em; text-transform: uppercase; }
.pillar span { display: block; margin-top: 8px; font-family: Fraunces, Georgia, serif; font-size: 1.05rem; line-height: 1.35; }
.p-want { background: linear-gradient(145deg,#be123c,#db2777); }
.p-need { background: linear-gradient(145deg,#1d4ed8,#2563eb); }
.p-demand { background: linear-gradient(145deg,#047857,#059669); }
.p-insight { background: linear-gradient(145deg,#6d28d9,#7c3aed); }
` + '<' + '/style' + '>' + `
` + '<' + '/head' + '>' + `
` + '<' + 'body' + '>' + `
<div class="wrap">
  <header class="hero">
    <div class="eyebrow">Apify · Facebook Groups Scraper · W–N–D–I Report</div>
    <h1>${groupName} — Want · Need · Demand · Insight</h1>
    <p class="lead">Báo cáo phân tích insight thị trường dựa trên bộ dữ liệu Facebook cào sẵn.</p>
    <div class="hero-meta">
      <span>📁 Nhóm: ${groupName}</span>
      <span>🗓️ Tạo báo cáo: ${createdDate}</span>
      <span>🤖 Nguồn: Apify facebook-groups-scraper</span>
    </div>
  </header>

  <div class="kpis">
    <div class="kpi">
      <div class="n">${group.value.postCount || 0}</div>
      <div class="l">Tổng số bài viết</div>
    </div>
    <div class="kpi">
      <div class="n">${group.value.commentCount || 0}</div>
      <div class="l">Tổng số bình luận</div>
    </div>
    <div class="kpi">
      <div class="n">${Object.keys(data.topicDistribution || {}).length}</div>
      <div class="l">Chủ đề phân tích</div>
    </div>
    <div class="kpi">
      <div class="n">${data.insights.length}</div>
      <div class="l">Đúc kết Insight</div>
    </div>
    <div class="kpi">
      <div class="n">${data.recommendations.length}</div>
      <div class="l">Khuyến nghị</div>
    </div>
    <div class="kpi">
      <div class="n">100%</div>
      <div class="l">Tiến độ AI</div>
    </div>
  </div>

  <section style="margin-top: 48px;">
    <div class="pillars">
      <div class="pillar p-want">
        <b>Want</b>
        <span>Mong muốn cảm xúc và động lực tự thân của khách hàng mục tiêu</span>
      </div>
      <div class="pillar p-need">
        <b>Need</b>
        <span>Nhu cầu giải quyết vấn đề hoặc lỗ hổng giải pháp thực tế</span>
      </div>
      <div class="pillar p-demand">
        <b>Demand</b>
        <span>Thương hiệu, sản phẩm hoặc danh mục cụ thể được chọn mua</span>
      </div>
      <div class="pillar p-insight">
        <b>Insight</b>
        <span>Sự thật ngầm hiểu về hành vi, động cơ thúc đẩy quyết định</span>
      </div>
    </div>
  </section>

  <section>
    <div class="section-head">
      <h2>Tóm tắt điều hành (1 phút)</h2>
    </div>
    <div class="card">
      <ul style="margin: 0; padding-left: 20px; font-size: 15px; line-height: 1.6;">
        ${data.oneMinuteSummary.map((sum: string) => '<li style="margin-bottom:8px">' + sum + '</li>').join('')}
      </ul>
    </div>
  </section>

  <section>
    <div class="section-head">
      <h2>Bức tranh chủ đề & loại bài</h2>
    </div>
    <div class="grid-2">
      <div class="card">
        <h3>Phân bố chủ đề</h3>
        <div class="chart-box"><canvas id="chartTopics"></canvas></div>
      </div>
      <div class="card">
        <h3>Loại nội dung</h3>
        <div class="chart-box"><canvas id="chartTypes"></canvas></div>
      </div>
    </div>
  </section>

  <section>
    <div class="section-head">
      <h2>Want · Need · Demand</h2>
      <p>Số bài chạm tín hiệu phân tích bởi AI</p>
    </div>
    <div class="grid-3">
      <div class="card accent-want">
        <h3>💖 Top Wants</h3>
        ${wantsHtml}
      </div>
      <div class="card accent-need">
        <h3>🔍 Top Needs</h3>
        ${needsHtml}
      </div>
      <div class="card accent-demand">
        <h3>🛒 Top Demands</h3>
        ${demandsHtml}
      </div>
    </div>
  </section>

  <section>
    <div class="section-head">
      <h2>Ý kiến / Insight đúc kết</h2>
    </div>
    ${insightsHtml}
  </section>

  <section>
    <div class="section-head">
      <h2>Khuyến nghị hành động</h2>
    </div>
    <div class="card">
      ${recsHtml}
    </div>
  </section>

  <section>
    <div class="section-head">
      <h2>Danh sách bài viết tiêu biểu</h2>
    </div>
    <div class="card" style="overflow-x:auto;">
      <table>
        <thead>
          <tr>
            <th>Nội dung</th>
            <th>Want</th>
            <th>Need</th>
            <th>Demand</th>
            <th>Tương tác</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
    </div>
  </section>

  <footer class="footer">
    Generated from Apify run · Group "${groupName}" · WNDI Market Analysis
  </footer>
</div>

` + '<' + 'script' + '>' + `
const topicLabels = ${topicLabelsJson};
const topicValues = ${topicValuesJson};
const typeLabels = ${typeLabelsJson};
const typeValues = ${typeValuesJson};

const palette = ['#e11d48','#db2777','#a855f7','#7c3aed','#2563eb','#0891b2','#059669','#d97706','#64748b'];

new Chart(document.getElementById('chartTopics'), {
  type: 'doughnut',
  data: {
    labels: topicLabels,
    datasets: [{ data: topicValues, backgroundColor: palette, borderWidth: 0 }]
  },
  options: {
    plugins: { legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } } },
    maintainAspectRatio: false
  }
});

new Chart(document.getElementById('chartTypes'), {
  type: 'bar',
  data: {
    labels: typeLabels,
    datasets: [{
      data: typeValues,
      backgroundColor: '#f472b6',
      borderRadius: 8,
      label: 'Số bài'
    }]
  },
  options: {
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: '#fce7f3' }, ticks: { precision: 0 } },
      y: { grid: { display: false } }
    },
    maintainAspectRatio: false
  }
});
` + '<' + '/script' + '>' + `
` + '<' + '/body' + '>' + `
` + '<' + '/html' + '>' + ``;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
  const urlLink = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = urlLink
  link.setAttribute('download', `wndi_report_${group.value.name.toLowerCase().replace(/\s+/g, '_')}.html`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<style scoped>
.back-link {
  display: inline-block;
  font-size: 14px;
  color: var(--text-secondary);
  text-decoration: none;
}

.back-link:hover {
  color: var(--accent);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--glass-border);
}

.card-header h3 {
  font-size: 15px;
  font-weight: 600;
  margin: 0;
}

.card-body {
  padding: 20px;
}

.report-dashboard {
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
