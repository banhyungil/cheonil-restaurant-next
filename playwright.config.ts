import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

/**
 * e2e — 실제 백엔드 + 빈 DB 를 띄워 화면 흐름을 검증한다.
 *
 * webServer 가 둘 다 자동 기동/종료:
 * - 백엔드: e2e/scripts/start-backend.sh — postgres 컨테이너(15433) + 백엔드 jar(18081)
 *   백엔드 저장소 경로는 BACKEND_DIR (기본 ../cheonil-restaurant-spring)
 * - 프론트: vite.config.e2e.ts — 5174, /api → 18081
 *
 * 테스트는 같은 DB 를 공유하므로 데이터 이름에 고유 suffix 를 붙이고(e2e/helpers), 순차 실행한다.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  globalTeardown: './e2e/global-teardown.ts',
  use: {
    baseURL: 'http://localhost:5174',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chrome',
      // 번들 chromium 대신 설치된 Chrome 사용 (playwright install 불필요)
      use: { ...devices['Desktop Chrome'], channel: 'chrome', viewport: { width: 1280, height: 800 } },
    },
  ],
  webServer: [
    {
      command: 'bash e2e/scripts/start-backend.sh',
      url: 'http://localhost:18081/api/units',
      timeout: 180 * 1000,
      reuseExistingServer: false,
      stdout: 'ignore',
      stderr: 'pipe',
    },
    {
      command: 'npx vite --config vite.config.e2e.ts',
      url: 'http://localhost:5174',
      timeout: 60 * 1000,
      reuseExistingServer: false,
    },
  ],
})
