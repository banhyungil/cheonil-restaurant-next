import { mergeConfig } from 'vite'

import base from './vite.config'

/**
 * e2e 전용 dev 서버 — 5174 포트, /api 를 e2e 백엔드(18081)로 프록시.
 *
 * optimizeDeps.entries — 시작 시 모든 페이지를 미리 스캔해 의존성을 한 번에 최적화한다.
 * 안 하면 처음 여는 페이지에서 새 의존성이 발견될 때마다 vite 가 리로드해 테스트가 흔들린다.
 */
export default mergeConfig(base, {
  server: {
    port: 5174,
    strictPort: true,
    proxy: { '/api': 'http://localhost:18081' },
  },
  optimizeDeps: {
    entries: ['index.html', 'src/**/*.vue'],
  },
})
