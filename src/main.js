import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { Quasar, Notify, Dialog } from 'quasar'
import lang from 'quasar/lang/es'
import '@quasar/extras/material-icons/material-icons.css'
import 'quasar/dist/quasar.css'
import './style.css'
import App from './App.vue'
import { router } from './routes/routes.js'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)

app.use(Quasar, {
  plugins: { Notify, Dialog },
  lang,
  config: { notify: { position: 'top', timeout: 2500 } }
})
app.use(pinia)
app.use(router)

app.mount('#app')