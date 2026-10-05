<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useMesasStore } from '../stores/mesas.js'
import { useCuentasStore } from '../stores/cuentas.js'
import { useAhora } from '../composables/useAhora.js'
import MesaCard from '../components/MesaCard.vue'
import MesaFormDialog from '../components/MesaFormDialog.vue'

const $q = useQuasar()
const mesas = useMesasStore()
const cuentas = useCuentasStore()
const ahora = useAhora()

const dialogoAbierto = ref(false)
const mesaEnEdicion = ref(null)

const libres = () => mesas.ordenadas.filter((mesa) => !cuentas.cuentaAbiertaDe(mesa.id) && mesa.disponibilidad !== 'fuera de servicio')
const ocupadas = () => mesas.ordenadas.filter((mesa) => cuentas.cuentaAbiertaDe(mesa.id))

function nuevaMesa() {
  mesaEnEdicion.value = null
  dialogoAbierto.value = true
}

function editarMesa(mesa) {
  if (cuentas.cuentaAbiertaDe(mesa.id)) {
    $q.notify({ type: 'warning', message: `La mesa ${mesa.numero} está ocupada; no se puede editar hasta que esté libre` })
    return
  }
  mesaEnEdicion.value = mesa
  dialogoAbierto.value = true
}

function guardarMesa(datos) {
  if (mesaEnEdicion.value) {
    mesas.actualizar(mesaEnEdicion.value.id, datos)
    $q.notify({ type: 'positive', message: `Mesa ${datos.numero} actualizada` })
  } else {
    mesas.agregar(datos)
    $q.notify({ type: 'positive', message: `Mesa ${datos.numero} agregada al salón` })
  }
}
</script>

<template>
  <q-page class="pagina">
    <div class="cabecera">
      <div>
        <h1 class="titulo text-h5 q-my-none">Salón</h1>
        <p class="text-body2 texto-suave q-mt-xs q-mb-none">
          {{ ocupadas().length }} de {{ mesas.ordenadas.length }} mesas ocupadas
        </p>
      </div>
      <q-space />
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="add"
        label="Agregar mesa"
        @click="nuevaMesa"
      />
    </div>

    <div v-if="!mesas.ordenadas.length" class="vacio">
      <q-icon name="table_restaurant" size="48px" color="grey-6" />
      <p class="text-body1 q-mt-sm q-mb-xs">Todavía no hay mesas en el salón</p>
      <p class="text-body2 texto-suave q-mb-md">Agrega la primera mesa para empezar a atender.</p>
      <q-btn unelevated no-caps color="primary" label="Agregar mesa" @click="nuevaMesa" />
    </div>

    <div v-else class="grilla">
      <MesaCard
        v-for="mesa in mesas.ordenadas"
        :key="mesa.id"
        :mesa="mesa"
        :cuenta="cuentas.cuentaAbiertaDe(mesa.id)"
        :ahora="ahora"
        @editar="editarMesa"
      />
    </div>

    <MesaFormDialog v-model="dialogoAbierto" :mesa="mesaEnEdicion" @guardar="guardarMesa" />
  </q-page>
</template>