// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  experimental: {
    appManifest: false,
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      title: 'FB Crawler & Analyzer',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'Facebook Group Comments Crawler & Analyzer' },
      ],
      script: [
        { src: 'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js' }
      ]
    }
  },
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL || 'http://localhost:8080',
    },
  },
  // hooks: {
  //   'vite:extendConfig'(config) {
  //     if (
  //       config.build?.rollupOptions?.input &&
  //       typeof config.build.rollupOptions.input === 'object' &&
  //       !Array.isArray(config.build.rollupOptions.input)
  //     ) {
  //       const input = config.build.rollupOptions.input as any;
  //       if (!input.server) {
  //         input.server = input.entry || Object.values(input)[0] || '';
  //       }
  //     }
  //   },
  // },
})
