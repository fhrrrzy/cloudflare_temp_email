import { createApp } from 'vue'
import { createHead } from '@unhead/vue/client'
import PrimeVue from 'primevue/config'

// PrimeVue CSS theme and resources
import 'primevue/resources/themes/lara-dark-green/theme.css'
import 'primevue/resources/primevue.min.css'
import 'primeicons/primeicons.css'
import './index.css'

import App from './App.vue'
import router from './router'
import i18n from './i18n'

const head = createHead()
const app = createApp(App)
app.use(PrimeVue)
app.use(i18n)
app.use(router)
app.use(head)
app.mount('#app')
