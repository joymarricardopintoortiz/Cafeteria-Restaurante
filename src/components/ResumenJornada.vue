<script setup>
import { computed } from 'vue'
import { METODOS_PAGO, etiquetaMetodo, pedidosConfirmados, rondaDe, subtotalCuenta } from '../utils/cuentas.js'
import { formatoHora, formatoMoneda } from '../utils/format.js'

const props = defineProps({
  resumen: { type: Object, required: true },
  cuentas: { type: Array, default: () => [] },
  // Solo la pestaña de historial la pasa: trae el arqueo del día cerrado
  // (efectivo inicial, contado, esperado y diferencia).
  caja: { type: Object, default: null }
})

const LIMITE_PRODUCTOS = 8

const vacio = computed(() => props.cuentas.length === 0)

// Si la mesa tuvo más de un pedido, el detalle lo marca línea por línea.
const variosPedidos = (cuenta) =>
  pedidosConfirmados(cuenta) > 1 || cuenta.items.some((item) => rondaDe(item) > 1)

const indicadores = computed(() => {
  const r = props.resumen
  const datos = [
    {
      etiqueta: 'Total cobrado',
      valor: formatoMoneda(r.totalCobrado),
      nota: `Ventas ${formatoMoneda(r.ventas)} y propinas ${formatoMoneda(r.propinas)}`,
      principal: true
    },
    { etiqueta: 'Cuentas pagadas', valor: String(r.cuentasPagadas), nota: 'Mesas cobradas' },
    {
      etiqueta: 'Ticket promedio',
      valor: formatoMoneda(r.ticketPromedio),
      nota: 'Por cuenta, sin propina'
    },
    {
      etiqueta: 'Canceladas',
      valor: String(r.cuentasCanceladas),
      nota: `${formatoMoneda(r.valorCancelado)} sin cobrar`
    }
  ]

  const cajaDia = props.caja
  if (cajaDia && Number.isFinite(cajaDia.base)) {
    datos.push({
      etiqueta: 'Efectivo inicial',
      valor: formatoMoneda(cajaDia.base),
      nota: 'Base de caja al abrir'
    })
  }
  if (cajaDia && Number.isFinite(cajaDia.contada)) {
    datos.push({
      etiqueta: 'Efectivo contado',
      valor: formatoMoneda(cajaDia.contada),
      nota: 'Conteo real al cerrar'
    })
  }
  return datos
})

// Filas del cuadre de caja del día cerrado. Los días viejos no traen todos
// los campos, así que solo se pinta lo que exista.
const filasCaja = computed(() => {
  const c = props.caja
  if (!c) return []
  const filas = []
  if (Number.isFinite(c.base)) filas.push({ etiqueta: 'Efectivo inicial', valor: formatoMoneda(c.base) })
  if (Number.isFinite(c.efectivoCobrado))
    filas.push({ etiqueta: 'Efectivo cobrado en efectivo', valor: formatoMoneda(c.efectivoCobrado) })
  if (Number.isFinite(c.cambiosEntregados))
    filas.push({ etiqueta: 'Cambios entregados', valor: formatoMoneda(c.cambiosEntregados) })
  if (Number.isFinite(c.esperado))
    filas.push({ etiqueta: 'Efectivo esperado en caja', valor: formatoMoneda(c.esperado) })
  if (Number.isFinite(c.contada))
    filas.push({ etiqueta: 'Efectivo contado en caja', valor: formatoMoneda(c.contada) })
  return filas
})

const diferenciaCaja = computed(() => {
  const c = props.caja
  if (!c || !Number.isFinite(c.diferencia)) return null
  if (c.diferencia === 0) return { texto: 'La caja cuadra', clase: 'text-positive' }
  return c.diferencia > 0
    ? { texto: `Sobraron ${formatoMoneda(c.diferencia)}`, clase: 'text-warning' }
    : { texto: `Faltaron ${formatoMoneda(-c.diferencia)}`, clase: 'text-negative' }
})

const metodos = computed(() =>
  METODOS_PAGO.map((metodo) => {
    const monto = props.resumen.porMetodo[metodo.valor] ?? 0
    const total = props.resumen.totalCobrado
    return { ...metodo, monto, proporcion: total ? monto / total : 0 }
  })
)

const masVendidos = computed(() => props.resumen.productos.slice(0, LIMITE_PRODUCTOS))
const restantes = computed(() => Math.max(0, props.resumen.productos.length - LIMITE_PRODUCTOS))
</script>

<template>
  <div>
    <div v-if="vacio" class="vacio">
      <q-icon name="receipt_long" size="48px" color="grey-6" />
      <p class="text-body1 q-mt-sm q-mb-xs">Todavía no hay cuentas cerradas</p>
      <p class="text-body2 texto-suave q-mb-none">
        Cuando cobres o canceles una mesa, aparecerá aquí.
      </p>
    </div>

    <template v-else>
      <dl class="indicadores">
        <div
          v-for="dato in indicadores"
          :key="dato.etiqueta"
          class="indicador"
          :class="{ 'indicador--principal': dato.principal }"
        >
          <dt>{{ dato.etiqueta }}</dt>
          <dd class="indicador__valor">{{ dato.valor }}</dd>
          <dd class="indicador__nota">{{ dato.nota }}</dd>
        </div>
      </dl>

      <section v-if="filasCaja.length" class="bloque bloque--resumen q-mb-lg">
        <h3 class="titulo text-h6 q-mt-none q-mb-md">Cuadre de caja</h3>
        <dl class="pago">
          <div v-for="fila in filasCaja" :key="fila.etiqueta">
            <dt>{{ fila.etiqueta }}</dt>
            <dd>{{ fila.valor }}</dd>
          </div>
          <div v-if="diferenciaCaja">
            <dt>Diferencia</dt>
            <dd :class="diferenciaCaja.clase">
              <strong>{{ diferenciaCaja.texto }}</strong>
            </dd>
          </div>
        </dl>
      </section>

      <div class="columnas">
        <section class="bloque bloque--resumen">
          <h3 class="titulo text-h6 q-mt-none q-mb-md">Cobrado por método de pago</h3>
          <ul class="metodos">
            <li v-for="metodo in metodos" :key="metodo.valor">
              <div class="row items-center justify-between">
                <span class="row items-center no-wrap">
                  <q-icon :name="metodo.icono" size="20px" class="q-mr-sm" />
                  {{ metodo.etiqueta }}
                </span>
                <strong>{{ formatoMoneda(metodo.monto) }}</strong>
              </div>
              <q-linear-progress
                :value="metodo.proporcion"
                rounded
                size="8px"
                color="primary"
                track-color="grey-3"
                class="q-mt-xs"
                :aria-label="`${metodo.etiqueta}: ${Math.round(metodo.proporcion * 100)}% del total`"
              />
            </li>
          </ul>
        </section>

        <section class="bloque bloque--resumen">
          <h3 class="titulo text-h6 q-mt-none q-mb-md">Productos más vendidos</h3>
          <ul v-if="masVendidos.length" class="vendidos vendidos--scroll">
            <li v-for="producto in masVendidos" :key="producto.productoId">
              <span class="vendidos__nombre">{{ producto.nombre }}</span>
              <span class="texto-suave">{{ producto.cantidad }} und.</span>
              <strong>{{ formatoMoneda(producto.ingresos) }}</strong>
            </li>
          </ul>
          <p v-else class="text-body2 texto-suave q-mb-none">
            Aún no se ha vendido ningún producto.
          </p>
          <p v-if="restantes" class="text-caption texto-suave q-mt-sm q-mb-none">
            Y {{ restantes }} {{ restantes === 1 ? 'producto más' : 'productos más' }}.
          </p>
        </section>
      </div>

      <section class="q-mt-lg">
        <h3 class="titulo text-h6 q-mt-none q-mb-md">Detalle de cuentas</h3>
        <q-list bordered separator class="lista-cuentas">
          <q-expansion-item v-for="cuenta in cuentas" :key="cuenta.id" expand-separator>
            <template #header>
              <q-item-section>
                <q-item-label class="text-weight-medium">Mesa {{ cuenta.mesaNumero }}</q-item-label>
                <q-item-label caption>Cerrada a las {{ formatoHora(cuenta.cerradaAt) }}</q-item-label>
              </q-item-section>
              <q-item-section side class="lado">
                <template v-if="cuenta.estado === 'pagada'">
                  <span class="text-weight-bold text-body1">{{ formatoMoneda(cuenta.pago.total) }}</span>
                  <span class="text-caption">{{ etiquetaMetodo(cuenta.pago.metodo) }}</span>
                </template>
                <q-badge v-else color="negative" label="Cancelada" />
              </q-item-section>
            </template>

            <div class="detalle">
              <ul class="lineas-detalle">
                <li v-for="item in cuenta.items" :key="item.id">
                  <span>
                    {{ item.cantidad }} × {{ item.nombre }}
                    <q-badge
                      v-if="variosPedidos(cuenta)"
                      class="pedido-chip"
                      size="sm"
                      :label="`Pedido ${rondaDe(item)}`"
                    />
                    <em v-if="item.nota" class="texto-suave">({{ item.nota }})</em>
                  </span>
                  <span>{{ formatoMoneda(item.precio * item.cantidad) }}</span>
                </li>
              </ul>

              <dl v-if="cuenta.estado === 'pagada'" class="pago">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{{ formatoMoneda(cuenta.pago.subtotal) }}</dd>
                </div>
                <div>
                  <dt>Propina</dt>
                  <dd>{{ formatoMoneda(cuenta.pago.propina) }}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{{ formatoMoneda(cuenta.pago.total) }}</dd>
                </div>
                <template v-if="cuenta.pago.metodo === 'efectivo'">
                  <div>
                    <dt>Recibido</dt>
                    <dd>{{ formatoMoneda(cuenta.pago.recibido) }}</dd>
                  </div>
                  <div>
                    <dt>Cambio</dt>
                    <dd>{{ formatoMoneda(cuenta.pago.cambio) }}</dd>
                  </div>
                </template>
              </dl>

              <div v-else class="text-body2">
                <p class="q-mb-xs">Valor sin cobrar: {{ formatoMoneda(subtotalCuenta(cuenta)) }}</p>
                <p class="q-mb-none">
                  Motivo: {{ cuenta.motivoCancelacion || 'Sin motivo indicado' }}
                </p>
              </div>
            </div>
          </q-expansion-item>
        </q-list>
      </section>
    </template>
  </div>
</template>