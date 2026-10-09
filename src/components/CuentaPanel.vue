<script setup>
import { computed } from 'vue'
import { useCuentasStore } from '../stores/cuentas.js'
import { useMenuStore } from '../stores/menu.js'
import { formatoHora, formatoMoneda } from '../utils/format.js'
import { subtotalCuenta, unidadesCuenta } from '../utils/cuentas.js'

const props = defineProps({
  mesa: { type: Object, required: true },
  cuenta: { type: Object, default: null },
  esBorrador: { type: Boolean, default: false }
})

const emit = defineEmits([
  'cobrar',
  'cancelar',
  'pedir',
  'cambiar-cantidad',
  'quitar-item',
  'guardar-nota'
])

const cuentas = useCuentasStore()
const menu = useMenuStore()

const items = computed(() => props.cuenta?.items ?? [])
const subtotal = computed(() => (props.cuenta ? subtotalCuenta(props.cuenta) : 0))
const unidades = computed(() => (props.cuenta ? unidadesCuenta(props.cuenta) : 0))

const puedeAumentar = (item) => menu.porId(item.productoId)?.disponible === true

function cambiarCantidad(item, delta) {
  if (props.esBorrador) emit('cambiar-cantidad', item, delta)
  else cuentas.cambiarCantidad(props.cuenta.id, item.id, delta)
}

function quitarItem(item) {
  if (props.esBorrador) emit('quitar-item', item)
  else cuentas.quitarItem(props.cuenta.id, item.id)
}

function guardarNota(item, nota) {
  if (props.esBorrador) emit('guardar-nota', item, nota)
  else cuentas.actualizarNota(props.cuenta.id, item.id, nota)
}
</script>

<template>
  <section class="cuenta" aria-labelledby="titulo-cuenta">
    <header class="cuenta__cabecera">
      <h2 id="titulo-cuenta" class="titulo text-h6 q-my-none">
        {{ esBorrador ? 'Pedido de la mesa' : 'Cuenta de la mesa' }} {{ mesa.numero }}
      </h2>
      <div v-if="cuenta && !esBorrador" class="text-caption texto-suave">
        Abierta a las {{ formatoHora(cuenta.abiertaAt) }}
      </div>
      <div v-else-if="esBorrador" class="text-caption texto-suave">
        Sin guardar: la mesa sigue libre hasta pedir
      </div>
    </header>

    <div v-if="!items.length" class="cuenta__vacia">
      <q-icon name="receipt_long" size="48px" color="grey-6" />
      <p class="text-body1 q-mt-sm q-mb-xs">
        {{
          esBorrador
            ? 'Aún no agregas productos'
            : cuenta
              ? 'La cuenta no tiene productos'
              : 'Esta mesa aún no consume'
        }}
      </p>
      <p class="text-body2 texto-suave q-mb-none">Toca un producto del menú para agregarlo.</p>
    </div>

    <ul v-else class="lineas">
      <li v-for="item in items" :key="item.id" class="linea">
        <div>
          <div class="text-weight-medium">{{ item.nombre }}</div>
          <div class="text-caption texto-suave">{{ formatoMoneda(item.precio) }} c/u</div>
          <button type="button" class="nota">
            <q-icon name="edit_note" size="18px" />
            {{ item.nota || 'Agregar nota' }}
            <q-popup-edit
              :model-value="item.nota"
              auto-save
              v-slot="scope"
              @save="(valor) => guardarNota(item, valor)"
            >
              <q-input
                v-model="scope.value"
                dense
                autofocus
                counter
                maxlength="60"
                label="Nota para cocina"
                @keyup.enter="scope.set"
              />
            </q-popup-edit>
          </button>
          <div v-if="!puedeAumentar(item)" class="text-caption text-negative">
            Agotado: ya no se pueden agregar más.
          </div>
        </div>

        <div class="linea__total">{{ formatoMoneda(item.precio * item.cantidad) }}</div>

        <div class="linea__controles">
          <div class="cantidad">
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="remove"
              :disable="item.cantidad <= 1"
              :aria-label="`Quitar una unidad de ${item.nombre}`"
              @click="cambiarCantidad(item, -1)"
            />
            <span class="cantidad__valor">{{ item.cantidad }}</span>
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="add"
              :disable="!puedeAumentar(item)"
              :aria-label="`Agregar una unidad de ${item.nombre}`"
              @click="cambiarCantidad(item, 1)"
            />
          </div>
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="delete_outline"
            color="negative"
            :aria-label="`Quitar ${item.nombre} de la cuenta`"
            @click="quitarItem(item)"
          />
        </div>
      </li>
    </ul>

    <footer class="cuenta__pie">
      <div class="row items-baseline justify-between">
        <span class="text-subtitle1">
          Total
          <span v-if="unidades" class="text-caption texto-suave">
            ({{ unidades }} {{ unidades === 1 ? 'producto' : 'productos' }})
          </span>
        </span>
        <span class="cuenta__total">{{ formatoMoneda(subtotal) }}</span>
      </div>

      <q-btn
        v-if="esBorrador"
        unelevated
        no-caps
        size="lg"
        color="primary"
        icon="send"
        label="Pedir"
        class="full-width q-mt-md"
        :disable="!items.length"
        @click="$emit('pedir')"
      />

      <template v-else>
        <q-btn
          unelevated
          no-caps
          size="lg"
          color="primary"
          icon="payments"
          label="Cobrar cuenta"
          class="full-width q-mt-md"
          :disable="!items.length"
          @click="$emit('cobrar')"
        />
        <q-btn
          v-if="cuenta"
          flat
          no-caps
          color="negative"
          class="full-width q-mt-sm"
          :label="items.length ? 'Cancelar cuenta' : 'Liberar mesa'"
          @click="$emit('cancelar')"
        />
      </template>
    </footer>
  </section>
</template>
