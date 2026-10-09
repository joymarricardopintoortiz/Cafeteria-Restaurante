<script setup>
import { computed, ref, watch } from 'vue'
import { METODOS_PAGO } from '../utils/cuentas.js'
import { formatoMoneda } from '../utils/format.js'

const abierto = defineModel({ type: Boolean, default: false })

const props = defineProps({
  subtotal: { type: Number, required: true },
  mesaNumero: { type: Number, default: null }
})

const emit = defineEmits(['confirmar'])

const opcionesPropina = [
  { label: 'Sin propina', value: 0 },
  { label: '5%', value: 5 },
  { label: '10%', value: 10 },
  { label: 'Otra', value: -1 }
]

const opcionesMetodo = METODOS_PAGO.map((metodo) => ({
  label: metodo.etiqueta,
  value: metodo.valor,
  icon: metodo.icono
}))

const porcentaje = ref(0)
const propinaOtra = ref(null)
const metodo = ref('efectivo')
const recibido = ref(null)

const propina = computed(() =>
  porcentaje.value === -1
    ? Math.max(0, Math.round(Number(propinaOtra.value) || 0))
    : Math.round((props.subtotal * porcentaje.value) / 100)
)
const total = computed(() => props.subtotal + propina.value)
const entregado = computed(() => Number(recibido.value) || 0)
const cambio = computed(() => Math.max(0, entregado.value - total.value))
const valido = computed(() => metodo.value !== 'efectivo' || entregado.value >= total.value)

const reglasRecibido = [
  (v) => (v !== null && v !== '' && Number.isFinite(v)) || 'Ingresa el efectivo recibido',
  (v) =>
    Number(v) >= total.value ||
    `Faltan ${formatoMoneda(total.value - (Number(v) || 0))} para cubrir la cuenta`
]

const reglasPropina = [
  (v) =>
    v === null ||
    v === '' ||
    (Number.isFinite(v) && v >= 0) ||
    'La propina no puede ser negativa'
]

watch(abierto, (visible) => {
  if (!visible) return
  porcentaje.value = 0
  propinaOtra.value = null
  metodo.value = 'efectivo'
  recibido.value = null
})

function confirmar() {
  if (!valido.value) return
  emit('confirmar', {
    metodo: metodo.value,
    propina: propina.value,
    recibido: metodo.value === 'efectivo' ? entregado.value : total.value
  })
  abierto.value = false
}
</script>

<template>
  <q-dialog v-model="abierto" persistent>
    <q-card class="dialogo">
      <q-form @submit="confirmar">
        <q-card-section>
          <h2 class="titulo text-h6 q-my-none">Cobrar mesa {{ mesaNumero }}</h2>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="fila-monto">
            <span>Consumo</span>
            <span>{{ formatoMoneda(subtotal) }}</span>
          </div>

          <div class="text-subtitle2 q-mt-md q-mb-sm">Propina</div>
          <q-btn-toggle
            v-model="porcentaje"
            :options="opcionesPropina"
            spread
            no-caps
            unelevated
            color="white"
            text-color="primary"
            toggle-color="primary"
            class="selector"
          />
          <q-input
            v-if="porcentaje === -1"
            v-model.number="propinaOtra"
            type="number"
            outlined
            dense
            prefix="$"
            label="Valor de la propina"
            :rules="reglasPropina"
            lazy-rules
            class="q-mt-sm"
          />
          <div v-if="propina > 0" class="fila-monto q-mt-sm">
            <span>Propina</span>
            <span>{{ formatoMoneda(propina) }}</span>
          </div>

          <div class="text-subtitle2 q-mt-md q-mb-sm">Método de pago</div>
          <q-btn-toggle
            v-model="metodo"
            :options="opcionesMetodo"
            spread
            no-caps
            unelevated
            color="white"
            text-color="primary"
            toggle-color="primary"
            class="selector"
          />

          <div v-if="metodo === 'efectivo'" class="q-mt-md">
            <q-input
              v-model.number="recibido"
              type="number"
              outlined
              prefix="$"
              label="Efectivo recibido"
              :rules="reglasRecibido"
              lazy-rules
              :hint="entregado ? '' : 'Escribe cuánto entregó el cliente'"
            >
              <template #append>
                <q-btn flat dense no-caps label="Exacto" @click="recibido = total" />
              </template>
            </q-input>
            <div v-if="valido && entregado" class="fila-monto q-mt-sm">
              <span>Cambio a devolver</span>
              <strong>{{ formatoMoneda(cambio) }}</strong>
            </div>
          </div>
        </q-card-section>

        <q-separator />

        <q-card-section class="fila-total">
          <span class="text-subtitle1">Total a cobrar</span>
          <span class="total">{{ formatoMoneda(total) }}</span>
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md q-pt-none">
          <q-btn flat no-caps label="Volver" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="check"
            label="Confirmar cobro"
            type="submit"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>