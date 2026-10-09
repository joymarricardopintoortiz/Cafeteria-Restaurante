<script setup>
import { useQuasar } from 'quasar'
import { ref, watch } from 'vue'
import { useCuentasStore } from '../stores/cuentas.js'
import { useCierresStore } from '../stores/cierres.js'
import { useCajaStore } from '../stores/caja.js'
import { formatoFecha, formatoFechaCorta, formatoMoneda } from '../utils/format.js'
import ResumenJornada from '../components/ResumenJornada.vue'

const $q = useQuasar()
const cuentas = useCuentasStore()
const cierres = useCierresStore()
const caja = useCajaStore()

const pestana = ref('hoy')
const dialogoCierre = ref(false)
const observaciones = ref('')
const contada = ref(null)

const baseCaja = ref(caja.base)
watch(
  () => caja.base,
  (valor) => {
    baseCaja.value = valor
  }
)
watch(baseCaja, (valor) => {
  caja.fijarBase(valor)
})

const reglasBase = [
  (v) =>
    (v !== null && v !== '' && Number.isFinite(v) && v >= 0) ||
    'Ingresa una base mayor o igual a 0'
]

const reglasContada = [
  (v) =>
    (v !== null && v !== '' && Number.isFinite(v) && v >= 0) ||
    'Ingresa el efectivo contado en caja'
]

function abrirCierre() {
  observaciones.value = ''
  contada.value = null
  dialogoCierre.value = true
}

function confirmarCierre() {
  const arqueo = caja.arquear(contada.value)
  const registro = cierres.cerrarDia(observaciones.value)
  if (registro) {
    let mensaje = 'Día cerrado.'
    if (arqueo.diferencia === 0) mensaje += ' La caja cuadra.'
    else if (arqueo.diferencia > 0) mensaje += ` Sobran ${formatoMoneda(arqueo.diferencia)} en caja.`
    else mensaje += ` Faltan ${formatoMoneda(-arqueo.diferencia)} en caja.`
    $q.notify({ type: 'positive', message: mensaje })
    dialogoCierre.value = false
    pestana.value = 'hoy'
  }
}
</script>

<template>
  <q-page class="pagina">
    <div class="cabecera">
      <div>
        <h1 class="titulo text-h5 q-my-none">Cierre del día</h1>
        <p class="text-body2 texto-suave q-mt-xs q-mb-none">{{ formatoFecha(cierres.jornadaInicio) }}</p>
      </div>
      <q-space />
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="task_alt"
        label="Cerrar el día"
        :disable="!cierres.puedeCerrar"
        @click="abrirCierre"
      />
    </div>

    <q-banner v-if="!cierres.puedeCerrar" class="aviso q-mb-lg" rounded>
      <template #avatar>
        <q-icon name="info" color="warning" />
      </template>
      <template v-if="cuentas.abiertas.length">
        Todavía hay {{ cuentas.abiertas.length }}
        {{ cuentas.abiertas.length === 1 ? 'mesa abierta' : 'mesas abiertas' }}. Cóbralas o cancélalas
        antes de cerrar el día.
      </template>
      <template v-else>
        Todavía no se ha cobrado ninguna cuenta hoy. Registra al menos una venta antes de cerrar
        el día.
      </template>
    </q-banner>

    <q-tabs
      v-model="pestana"
      no-caps
      inline-label
      active-color="primary"
      indicator-color="primary"
      align="left"
      class="tabs-vista"
    >
      <q-tab name="hoy" icon="today" label="Jornada actual" />
      <q-tab name="historial" icon="history" label="Historial" />
    </q-tabs>

    <q-tab-panels v-model="pestana" animated class="paneles">
      <q-tab-panel name="hoy" class="q-px-none">
        <q-card flat bordered class="bloque q-mb-lg">
          <h3 class="titulo text-h6 q-mt-none q-mb-md">Caja de la jornada</h3>
          <q-input
            v-model.number="baseCaja"
            type="number"
            outlined
            dense
            prefix="$"
            label="Base de caja (efectivo inicial)"
            :rules="reglasBase"
            lazy-rules
            class="q-mb-md"
          />
          <div class="fila-monto q-mt-sm">
            <span>Efectivo cobrado</span>
            <span>{{ formatoMoneda(caja.efectivoCobrado) }}</span>
          </div>
          <div class="fila-monto q-mt-sm">
            <span>Cambios entregados</span>
            <span>{{ formatoMoneda(caja.cambiosEntregados) }}</span>
          </div>
          <q-separator class="q-my-sm" />
          <div class="fila-monto">
            <span class="text-weight-medium">Efectivo esperado en caja</span>
            <strong class="text-h6 q-my-none">{{ formatoMoneda(caja.efectivoEsperado) }}</strong>
          </div>
        </q-card>

        <ResumenJornada :resumen="cierres.resumenActual" :cuentas="cuentas.cerradas" />
      </q-tab-panel>

      <q-tab-panel name="historial" class="q-px-none">
        <div v-if="!cierres.historial.length" class="vacio">
          <q-icon name="history" size="48px" color="grey-6" />
          <p class="text-body1 q-mt-sm q-mb-xs">Aún no hay días cerrados</p>
          <p class="text-body2 texto-suave q-mb-none">
            El historial se llena cada vez que cierras la jornada.
          </p>
        </div>

        <q-list v-else bordered separator class="lista-historial">
          <q-expansion-item v-for="dia in cierres.historial" :key="dia.id" expand-separator>
            <template #header>
              <q-item-section>
                <q-item-label class="text-weight-medium">{{ formatoFechaCorta(dia.cierre) }}</q-item-label>
                <q-item-label caption>
                  {{ dia.resumen.cuentasPagadas }} cuentas cobradas
                  <span v-if="dia.observaciones"> · {{ dia.observaciones }}</span>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <span class="text-weight-bold">{{ new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(dia.resumen.totalCobrado) }}</span>
              </q-item-section>
            </template>

            <div class="q-pa-md">
              <ResumenJornada :resumen="dia.resumen" :cuentas="dia.cuentas" />
            </div>
          </q-expansion-item>
        </q-list>
      </q-tab-panel>
    </q-tab-panels>

    <q-dialog v-model="dialogoCierre" persistent>
      <q-card class="dialogo">
        <q-form @submit="confirmarCierre">
          <q-card-section>
            <h2 class="titulo text-h6 q-my-none">Cerrar el día</h2>
            <p class="text-body2 texto-suave q-mt-sm q-mb-none">
              Esta acción guarda el resumen de hoy en el historial y deja el salón
              listo para mañana. No se puede deshacer.
            </p>
          </q-card-section>

          <q-card-section class="q-pt-none">
            <q-input
              v-model="observaciones"
              outlined
              type="textarea"
              rows="3"
              maxlength="200"
              counter
              label="Observaciones"
              placeholder="Novedades del turno, incidencias, lo que sea útil para mañana"
            />
            <q-input
              v-model.number="contada"
              type="number"
              outlined
              prefix="$"
              label="Efectivo contado en caja"
              :hint="`Esperado en caja: ${formatoMoneda(caja.efectivoEsperado)}`"
              :rules="reglasContada"
              lazy-rules
              class="q-mt-md"
            />
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md q-pt-none">
            <q-btn flat no-caps label="Volver" v-close-popup />
            <q-btn
              unelevated
              no-caps
              color="primary"
              icon="task_alt"
              label="Confirmar cierre"
              type="submit"
            />
          </q-card-actions>
        </q-form>
      </q-card>
    </q-dialog>
  </q-page>
</template>