import { createApp } from "vue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";
import FloatingVue from "floating-vue";
import "floating-vue/dist/style.css";
import { QueryClient, VueQueryPlugin } from "@tanstack/vue-query";
import { CheonilPreset } from "./style/preset";
import "./style/theme.css";

import App from "./App.vue";
import router from "./router";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

const app = createApp(App);

//SECTION - Pinia
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);

//SECTION - PrimeVue
app.use(PrimeVue, {
  theme: {
    preset: CheonilPreset,
    options: {
      darkModeSelector: ".dark",
      cssLayer: {
        name: "primevue",
        order: "theme, base, primevue",
      },
    },
  },
  locale: {
    accept: "확인",
    reject: "취소",
    emptyMessage: "데이터가 없습니다.",
    emptyFilterMessage: "검색 결과가 없습니다.",
  },
});
app.use(ToastService);
app.use(ConfirmationService);

//SECTION - FloatingVue (tooltip / popover)
app.use(FloatingVue, {
  themes: {
    "cheonil-tooltip": {
      $extend: "tooltip",
      placement: "top",
      triggers: ["hover", "focus"],
      delay: { show: 200, hide: 0 },
    },
  },
});

//SECTION - TanStack Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분간 fresh — 이 안에 refetch 요청해도 네트워크 호출 없음
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
app.use(VueQueryPlugin, { queryClient });

//SECTION - Mount
app.mount("#app");
