import { execSync } from 'node:child_process'

/** e2e DB 컨테이너 정리 — 백엔드 / vite 프로세스는 Playwright webServer 가 종료한다. */
export default function globalTeardown() {
  execSync('docker rm -f cheonil-e2e-db', { stdio: 'ignore' })
}
