<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useMesasStore } from '../stores/mesas.js'
import { useCuentasStore } from '../stores/cuentas.js'
import { useAhora } from '../composables/useAhora.js'
import { formatoMoneda } from '../utils/format.js'
import { subtotalCuenta } from '../utils/cuentas.js'
import MesaCard from '../components/MesaCard.vue'
import MesaFormDialog from '../components/MesaFormDialog.vue'
import CobroDialog from '../components/CobroDialog.vue'

const $q = useQuasar()
const mesas = useMesasStore()
const cuentas = useCuentasStore()
const ahora = useAhora()

const dialogoAbierto = ref(false)
const mesaEnEdicion = ref(null)

const dialogoCobro = ref(false)
const cuentaEnCobro = ref(null)

const subtotalEnCobro = computed(() =>
  cuentaEnCobro.value ? subtotalCuenta(cuentaEnCobro.value) : 0
)

const libres = () => mesas.ordenadas.filter((mesa) => !cuentas.cuentaAbiertaDe(mesa.id) && mesa.disponibilidad !== 'fuera de servicio')
const ocupadas = () => mesas.ordenadas.filter((mesa) => cuentas.cuentaAbiertaDe(mesa.id))
const fueraDeServicio = () => mesas.ordenadas.filter((mesa) => !cuentas.cuentaAbiertaDe(mesa.id) && mesa.disponibilidad === 'fuera de servicio')

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

function cobrarCuenta(cuenta) {
  cuentaEnCobro.value = cuenta
  dialogoCobro.value = true
}

function confirmarCobro(datos) {
  const cobrado = cuentas.cobrar(cuentaEnCobro.value.id, datos)
  if (cobrado) {
    $q.notify({ type: 'positive', message: `Mesa ${cuentaEnCobro.value.mesaNumero} cobrada` })
    cuentaEnCobro.value = null
  }
}

function cancelarCuenta(cuenta) {
  $q.dialog({
    title: 'Cancelar cuenta',
    message: `La mesa ${cuenta.mesaNumero} tiene ${formatoMoneda(
      subtotalCuenta(cuenta)
    )} en productos. Explica el motivo de la cancelación.`,
    prompt: { model: '', type: 'text', label: 'Motivo', isValid: (v) => v.trim().length > 0 },
    cancel: { flat: true, label: 'Volver', color: 'primary' },
    ok: { flat: true, label: 'Cancelar cuenta', color: 'negative' },
    persistent: true
  }).onOk((motivo) => {
    cuentas.cancelar(cuenta.id, motivo)
    $q.notify({ type: 'warning', message: `Cuenta de la mesa ${cuenta.mesaNumero} cancelada` })
  })
}
</script>

<template>
  <q-page class="pagina">
    <div class="cabecera">
      <div>
        <h1 class="titulo text-h5 q-my-none">Salón</h1>
        <p class="text-body2 texto-suave q-mt-xs q-mb-none">
          {{ ocupadas().length + fueraDeServicio().length }} de {{ mesas.ordenadas.length }} mesas ocupadas
          <span v-if="fueraDeServicio().length">({{ fueraDeServicio().length }} fuera de servicio)</span>
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
        @cobrar="cobrarCuenta"
        @cancelar="cancelarCuenta"
      />
    </div>

    <MesaFormDialog v-model="dialogoAbierto" :mesa="mesaEnEdicion" @guardar="guardarMesa" />

    <CobroDialog
      v-model="dialogoCobro"
      :subtotal="subtotalEnCobro"
      :mesa-numero="cuentaEnCobro?.mesaNumero"
      @confirmar="confirmarCobro"
    />
  </q-page>
</template>