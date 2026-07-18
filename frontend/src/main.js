import { createApp } from 'vue'
import { createHead } from '@unhead/vue/client'
import './index.css'

import App from './App.vue'
import router from './router'
import i18n from './i18n'

// Force dark mode class on document element
if (typeof document !== 'undefined') {
  document.documentElement.classList.add('dark')
}

const head = createHead()
const app = createApp(App)
app.use(i18n)
app.use(router)
app.use(head)
app.mount('#app')
