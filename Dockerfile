# syntax=docker/dockerfile:1.6
# =====================================================================
# Multi-stage build — Node 24 (Vite build) + nginx (정적 serve + /api 프록시).
#
# 빌드:   docker build -t ban/cheonil-restaurant-next .
# 실행:   docker run -p 80:80 -e API_BACKEND_URL=http://cheonil-server:8080 ban/cheonil-restaurant-next
# compose: API_BACKEND_URL 환경변수로 백엔드 서비스명 주입 (네트워크 내 DNS).
# =====================================================================

# ─── Stage 1: Build ─────────────────────────────────────────────────
FROM node:24-alpine AS build
WORKDIR /app

# 의존성 먼저 — 소스 변경 시 npm ci 캐시 재사용
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# 소스 복사 + 빌드 (vite 만 — type-check 는 CI/dev 책임)
# `npm run build` 는 type-check + build-only 병렬인데:
#   - `auto-imports.d.ts` / `components.d.ts` 는 git ignored — vite 실행 시 생성됨
#   - 병렬 실행이면 type-check 가 dts 생성 전에 시작해 실패
# 운영 빌드는 vite 만 실행 (이미 dev/CI 에서 type-check 통과 가정).
COPY . .
RUN npm run build-only

# ─── Stage 2: Runtime ───────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# 정적 파일 복사
COPY --from=build /app/dist /usr/share/nginx/html

# nginx config — 컨테이너 시작 시 envsubst 가 ${API_BACKEND_URL} 치환 (기본 nginx:alpine 동작)
COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template

EXPOSE 80
