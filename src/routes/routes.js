import { createRouter, createWebHashHistory } from 'vue-router'
import SalonView from '../views/SalonView.vue'
import InicioView from '../views/InicioView.vue'

const routes = [
  {
    path: '/',
    name: 'inicio',
    component: InicioView,
    meta: { seccion: 'inicio', titulo: 'Inicio' }
  },
  {
    path: '/salon',
    name: 'salon',
    component: SalonView,
    meta: { seccion: 'salon', titulo: 'Salón' }
  },
  {
    path: '/mesa/:id',
    name: 'mesa',
    component: () => import('../views/MesaView.vue'),
    props: true,
    meta: { seccion: 'salon', titulo: 'Cuenta de mesa' }
  },
  {
    path: '/menu',
    name: 'menu',
    component: () => import('../views/MenuView.vue'),
    meta: { seccion: 'menu', titulo: 'Menú' }
  },
  {
    path: '/cierre',
    name: 'cierre',
    component: () => import('../views/CierreView.vue'),
    meta: { seccion: 'cierre', titulo: 'Cierre del día' }
  },
  { path: '/:pathMatch(.*)*', redirect: { name: 'salon' } }
]

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.afterEach((to) => {
  document.title = `${to.meta.titulo} | Cafetería`
})