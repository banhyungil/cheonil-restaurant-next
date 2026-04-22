import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { PrimeVueResolver } from '@primevue/auto-import-resolver'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools({
      componentInspector: true,
    }),
    tailwindcss(),
    AutoImport({
      imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
      dirs: ['src/composables', 'src/stores'],
      dts: 'src/auto-imports.d.ts',
      vueTemplate: true,

      eslintrc: {
        enabled: true,
        filepath: './.eslintrc-auto-import.json',
      },
    }),
    Components({
      dirs: ['src/components'],
      extensions: ['vue'],
      deep: true,
      resolvers: [PrimeVueResolver()],
      dts: 'src/components.d.ts',
    }),
  ],
  server: {
    port: 4200,
    /**
     * 요청 경로가 proxy 서버 경로가 됨
     * /api -> http://localhost:8010/api
     * rewrite 기능을 쓰면 요청 경로와 무관하게 다른 경로로도 맵핑 가능
     */
    proxy: {
      '/api': 'http://localhost:8010',
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
