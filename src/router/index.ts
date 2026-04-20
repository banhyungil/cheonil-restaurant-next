import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/examples/form',
      name: 'example-form',
      component: () => import('@/views/examples/FormExample.vue'),
    },
  ],
})

export default router
