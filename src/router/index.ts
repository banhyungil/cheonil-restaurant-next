import { createRouter, createWebHistory } from 'vue-router'

import { routes } from './routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router

// routes 분해.
// sidebar 에 routes import하여 이용
// routes meta 정보를 이용하여 데이터응집
