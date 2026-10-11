<script setup>
import { computed } from 'vue'
import { useCuentasStore } from '../stores/cuentas.js'
import { useMenuStore } from '../stores/menu.js'
import { formatoHora, formatoMoneda } from '../utils/format.js'
import { rondaDe, subtotalCuenta, unidadesCuenta } from '../utils/cuentas.js'

const props = defineProps({
  mesa: { type: Object, required: true },
  cuenta: { type: Object, default: null },
  esBorrador: { type: Boolean, default: false },
  modoAgregar: { type: Boolean, default: false },
  pendiente: { type: Boolean, default: false },
  // Último pedido ya confirmado de esta mesa (1 si la cuenta es anterior a las rondas).
  pedidosConfirmados: { type: Number, default: 1 }
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

const sumaDe = (lista) => lista.reduce((suma, item) => suma + item.precio * item.cantidad, 0)
const unidadesDe = (lista) => lista.reduce((suma, item) => suma + item.cantidad, 0)

// En modo "Agregar más" lo ya pedido no se lista: queda como resumen plegable
// de solo lectura. La lista principal es únicamente la ronda en curso.
const itemsPrevios = computed(() =>
  props.modoAgregar ? items.value.filter((item) => rondaDe(item) <= props.pedidosConfirmados) : []
)

const itemsVisibles = computed(() =>
  props.modoAgregar
    ? items.value.filter((item) => rondaDe(item) > props.pedidosConfirmados)
    : items.value
)

const subtotalPrevios = computed(() => sumaDe(itemsPrevios.value))
const subtotalNuevos = computed(() => sumaDe(itemsVisibles.value))
const unidadesPrevias = computed(() => unidadesDe(itemsPrevios.value))
const unidadesNuevas = computed(() => unidadesDe(itemsVisibles.value))

// Cuántos pedidos distintos quedan dentro de ese resumen (conteo, no número).
const pedidosPrevios = computed(() => new Set(itemsPrevios.value.map(rondaDe)).size)

// Etiqueta del pie: "Pedido 1 + Pedido 2" cuando es solo uno por delante,
// o "4 pedidos + Pedido 5" cuando ya van varios.
const etiquetaTotal = computed(() => {
  if (!props.modoAgregar || !itemsPrevios.value.length) return ''
  if (pedidosPrevios.value === 1) {
    const unicaRonda = rondaDe(itemsPrevios.value[0])
    return `Pedido ${unicaRonda} + Pedido ${rondaEnCurso.value}`
  }
  return `${pedidosPrevios.value} pedidos + Pedido ${rondaEnCurso.value}`
})

// Ronda que se está tomando ahora (la que aparece como "Este pedido").
const rondaEnCurso = computed(() => props.pedidosConfirmados + 1)

const puedeAumentar = (item) => menu.porId(item.productoId)?.disponible === true

// Lo de este pedido puede bajar hasta 1 unidad o borrarse entero; lo anterior
// ni siquiera se muestra con controles.
const puedeDisminuir = (item) => item.cantidad > 1

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

    <!-- Lo ya pedido: resumen plegable, sin controles (solo en modo "Agregar más") -->
    <q-expansion-item
      v-if="modoAgregar && itemsPrevios.length"
      class="cuenta__resumen"
      dense
      header-class="cuenta__resumen-cabecera"
    >
      <template #header>
        <q-item-section>
          <q-item-label>Lo ya pedido</q-item-label>
          <q-item-label caption>
            {{ unidadesPrevias }} {{ unidadesPrevias === 1 ? 'producto' : 'productos' }} ·
            {{ pedidosPrevios }} {{ pedidosPrevios === 1 ? 'pedido' : 'pedidos' }}
          </q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-item-label class="text-weight-bold">{{ formatoMoneda(subtotalPrevios) }}</q-item-label>
          <q-item-label caption>Ver productos</q-item-label>
        </q-item-section>
      </template>

      <ul class="lineas lineas--solo-lectura">
        <li v-for="item in itemsPrevios" :key="item.id" class="linea">
          <div>
            <div class="text-weight-medium">{{ item.nombre }}</div>
            <div class="text-caption texto-suave">
              {{ item.cantidad }} × {{ formatoMoneda(item.precio) }} · Pedido {{ rondaDe(item) }}
            </div>
            <div v-if="item.nota" class="text-caption texto-suave">
              <q-icon name="edit_note" size="16px" />
              {{ item.nota }}
            </div>
          </div>
          <div class="linea__total">{{ formatoMoneda(item.precio * item.cantidad) }}</div>
        </li>
      </ul>
    </q-expansion-item>

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

    <div v-else-if="!itemsVisibles.length" class="cuenta__vacia">
      <q-icon name="add_shopping_cart" size="48px" color="grey-6" />
      <p class="text-body1 q-mt-sm q-mb-xs">
        Todavía no agregas productos al Pedido {{ rondaEnCurso }}
      </p>
      <p class="text-body2 texto-suave q-mb-none">
        Lo anterior sigue en la cuenta; toca un producto del menú para sumarlo aquí.
      </p>
    </div>

    <ul v-else class="lineas">
      <li v-for="item in itemsVisibles" :key="item.id" class="linea">
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
              :disable="!puedeDisminuir(item)"
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

    <p
      v-if="modoAgregar && itemsVisibles.length"
      class="text-caption texto-suave q-mt-sm q-mb-none"
    >
      Estos productos son del Pedido {{ rondaEnCurso }}: puedes bajar cantidades o descartarlos.
      Lo anterior está resumido arriba.
    </p>

    <footer class="cuenta__pie">
      <!-- Desglose por pedidos: el total sigue sumando todo en la misma mesa -->
      <div v-if="modoAgregar" class="cuenta__desglose">
        <div v-if="itemsPrevios.length" class="cuenta__desglose-fila">
          <span>{{ pedidosPrevios === 1 ? 'Pedido anterior' : 'Pedidos anteriores' }}</span>
          <span>{{ formatoMoneda(subtotalPrevios) }}</span>
        </div>
        <div class="cuenta__desglose-fila">
          <span>Este pedido ({{ unidadesNuevas }}
            {{ unidadesNuevas === 1 ? 'producto' : 'productos' }})</span>
          <span>{{ formatoMoneda(subtotalNuevos) }}</span>
        </div>
      </div>

      <div class="row items-baseline justify-between">
        <span class="text-subtitle1">
          Total
          <span v-if="etiquetaTotal" class="text-caption texto-suave">
            ({{ etiquetaTotal }})
          </span>
          <span v-else-if="unidades" class="text-caption texto-suave">
            ({{ unidades }} {{ unidades === 1 ? 'producto' : 'productos' }})
          </span>
        </span>
        <span class="cuenta__total">{{ formatoMoneda(subtotal) }}</span>
      </div>

      <q-btn
        v-if="esBorrador || modoAgregar"
        unelevated
        no-caps
        size="lg"
        color="primary"
        icon="send"
        label="Pedir"
        class="full-width q-mt-md"
        :disable="esBorrador ? !items.length : !pendiente"
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
