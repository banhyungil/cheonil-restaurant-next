import { createApp } from "vue";
import { createPinia } from "pinia";
import PrimeVue from "primevue/config";
import ToastService from "primevue/toastservice";
import ConfirmationService from "primevue/confirmationservice";
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

//SECTION - Mount
app.mount("#app");
