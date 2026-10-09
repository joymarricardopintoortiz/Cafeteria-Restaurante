<script setup>
import { computed } from 'vue'
import { formatoMoneda } from '../utils/format.js'
import { useMesasStore } from '../stores/mesas.js'
import { useCuentasStore } from '../stores/cuentas.js'
import { useMenuStore } from '../stores/menu.js'
import { useCierresStore } from '../stores/cierres.js'

const mesasStore = useMesasStore()
const cuentasStore = useCuentasStore()
const menuStore = useMenuStore()
const cierresStore = useCierresStore()

const mesasOcupadas = computed(() => cuentasStore.abiertas.length)
const mesasFuera = computed(
  () => mesasStore.mesas.filter((m) => m.disponibilidad === 'fuera de servicio').length
)
const mesasLibres = computed(
  () => mesasStore.mesas.length - mesasOcupadas.value - mesasFuera.value
)
const productosDisponibles = computed(
  () => menuStore.productos.filter((p) => p.disponible).length
)
const productosAgotados = computed(() => menuStore.agotados.length)
const ventasHoy = computed(() => cierresStore.resumenActual.cuentasPagadas)

const indicadores = computed(() => [
  { valor: mesasLibres.value, etiqueta: 'Mesas libres', icono: 'event_seat', color: 'positive' },
  { valor: mesasOcupadas.value, etiqueta: 'Mesas ocupadas', icono: 'groups', color: 'warning' },
  { valor: mesasFuera.value, etiqueta: 'Mesas fuera de servicio', icono: 'block', color: 'negative' },
  { valor: productosDisponibles.value, etiqueta: 'Productos disponibles', icono: 'restaurant_menu', color: 'primary' },
  { valor: ventasHoy.value, etiqueta: 'Cuentas cobradas hoy', icono: 'point_of_sale', color: 'secondary' }
])

const secciones = computed(() => [
  {
    nombre: 'Salón',
    icono: 'table_restaurant',
    descripcion:
      'Muestra el estado de cada mesa del local: cuáles están libres y cuáles ocupadas, con el total que lleva consumido cada una y el tiempo que llevan abiertas.',
    detalle: `${mesasOcupadas.value + mesasFuera.value} de ${mesasStore.mesas.length} mesas ocupadas ahora (${mesasFuera.value} fuera de servicio)`
  },
  {
    nombre: 'Menú',
    icono: 'restaurant_menu',
    descripcion:
      'Aquí se administran los productos que ofrece la cafetería: se pueden crear, editar el precio o la categoría, y marcar cada uno como disponible o agotado.',
    detalle: `${productosDisponibles.value} disponibles, ${productosAgotados.value} agotados`
  },
  {
    nombre: 'Cierre del día',
    icono: 'point_of_sale',
    descripcion:
      'Al terminar el turno, esta pantalla muestra cuánto se vendió, por qué método se cobró y qué productos fueron los más pedidos, y permite cerrar la jornada.',
    detalle: `${formatoMoneda(cierresStore.resumenActual.totalCobrado)} cobrados en ${ventasHoy.value} cuentas hoy`
  }
])
</script>

<template>
  <q-page class="pagina">
    <div class="indicadores-inicio">
      <div v-for="ind in indicadores" :key="ind.etiqueta" class="indicador-inicio">
        <q-icon :name="ind.icono" size="28px" :color="ind.color" />
        <div class="indicador-inicio__valor">{{ ind.valor }}</div>
        <div class="indicador-inicio__etiqueta texto-suave">{{ ind.etiqueta }}</div>
      </div>
    </div>

    <div class="columnas">
      <div v-for="seccion in secciones" :key="seccion.nombre" class="bloque bloque--centrado">
        <q-icon :name="seccion.icono" size="32px" color="primary" class="q-mb-sm" />
        <h2 class="titulo text-h6 q-my-none">{{ seccion.nombre }}</h2>
        <p class="text-body2 texto-suave q-mt-sm q-mb-none">{{ seccion.descripcion }}</p>
        <p class="text-body2 q-mt-sm q-mb-none">
          <strong>{{ seccion.detalle }}</strong>
        </p>
      </div>
    </div>
  </q-page>
</template>
