<template>
  <q-layout view="1Hh Lpr 1Ff">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn
          dense
          flat
          round
          icon="menu"
          aria-label="Abrir o cerrar el menú de navegación"
          @click="alternarDrawer"
        />
        <q-icon name="local_cafe" size="sm" class="q-ml-md q-mr-sm" />
        <q-toolbar-title class="titulo">Cafetería</q-toolbar-title>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawerAbierto" side="left" bordered :width="240">
      <q-list padding>
        <q-item
          v-for="seccion in secciones"
          :key="seccion.nombre"
          clickable
          v-ripple
          :to="seccion.destino"
          :active="seccionActual === seccion.nombre"
          active-class="menu-activo"
          @click="cerrarEnMovil"
        >
          <q-item-section avatar>
            <q-icon :name="seccion.icono" />
          </q-item-section>
          <q-item-section>{{ seccion.etiqueta }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <div v-if="cargando" class="overlay-carga">
      <q-spinner color="primary" size="4em" :thickness="4" />
      <p class="overlay-carga__texto">Cargando...</p>
    </div>
  </q-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const route = useRoute()
const router = useRouter()

const drawerAbierto = ref(false)
const cargando = ref(false)

let inicioCarga = 0
const DURACION_MINIMA = 500

router.beforeEach((to, from, next) => {
  inicioCarga = Date.now()
  cargando.value = true
  next()
})

router.afterEach(() => {
  const transcurrido = Date.now() - inicioCarga
  const restante = Math.max(0, DURACION_MINIMA - transcurrido)
  setTimeout(() => {
    cargando.value = false
  }, restante)
})

router.onError(() => {
  cargando.value = false
})

const secciones = [
  { nombre: 'inicio', etiqueta: 'Bienvenida', icono: 'home', destino: { name: 'inicio' } },
  { nombre: 'salon', etiqueta: 'Salón', icono: 'table_restaurant', destino: { name: 'salon' } },
  { nombre: 'menu', etiqueta: 'Menú', icono: 'restaurant_menu', destino: { name: 'menu' } },
  { nombre: 'cierre', etiqueta: 'Cierre del día', icono: 'point_of_sale', destino: { name: 'cierre' } }
]

const seccionActual = computed(() => route.meta.seccion)

function alternarDrawer() {
  drawerAbierto.value = !drawerAbierto.value
}

function cerrarEnMovil() {
  if ($q.screen.lt.md) drawerAbierto.value = false
}
</script>