// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  css: ['~/assets/styles/main.scss'],
  runtimeConfig: {
    // Private (server-only) runtime config
    apiBase: process.env.NUXT_API_BASE_INTERNAL || 'http://api:3001/api',
    public: {
      // Exposed to the client
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'http://localhost:3001/api',
      basicAuthUser: process.env.NUXT_PUBLIC_BASIC_AUTH_USER || 'demo',
      basicAuthPass: process.env.NUXT_PUBLIC_BASIC_AUTH_PASS || '123456',
    },
  },
  // Set Nitro compatibility date as recommended by Nuxt/Nitro logs
  nitro: {
    compatibilityDate: '2025-08-20',
  },
  devtools: { enabled: false },
});
