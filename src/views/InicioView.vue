<script setup>
import { computed } from 'vue'
import { formatoFecha, formatoMoneda } from '../utils/format.js'
import { useMesasStore } from '../stores/mesas.js'
import { useCuentasStore } from '../stores/cuentas.js'
import { useMenuStore } from '../stores/menu.js'
import { useCierresStore } from '../stores/cierres.js'

const mesasStore = useMesasStore()
const cuentasStore = useCuentasStore()
const menuStore = useMenuStore()
const cierresStore = useCierresStore()

const ahora = new Date()

const saludo = computed(() => {
  const hora = ahora.getHours()
  if (hora < 12) return 'Buenos días'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
})

const fechaHoy = formatoFecha(ahora.getTime())

const mesasOcupadas = computed(() => cuentasStore.abiertas.length)
const mesasLibres = computed(() => mesasStore.mesas.length - mesasOcupadas.value)
const productosDisponibles = computed(
  () => menuStore.productos.filter((p) => p.disponible).length
)
const productosAgotados = computed(() => menuStore.agotados.length)
const ventasHoy = computed(() => cierresStore.resumenActual.cuentasPagadas)

const indicadores = computed(() => [
  { valor: mesasLibres.value, etiqueta: 'Mesas libres', icono: 'event_seat', color: 'positive' },
  { valor: mesasOcupadas.value, etiqueta: 'Mesas ocupadas', icono: 'groups', color: 'warning' },
  { valor: productosDisponibles.value, etiqueta: 'Productos disponibles', icono: 'restaurant_menu', color: 'primary' },
  { valor: ventasHoy.value, etiqueta: 'Cuentas cobradas hoy', icono: 'point_of_sale', color: 'secondary' }
])

const secciones = computed(() => [
  {
    nombre: 'Salón',
    icono: 'table_restaurant',
    descripcion:
      'Muestra el estado de cada mesa del local: cuáles están libres y cuáles ocupadas, con el total que lleva consumido cada una y el tiempo que llevan abiertas.',
    detalle: `${mesasOcupadas.value} de ${mesasStore.mesas.length} mesas ocupadas ahora`
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
  <q-page class="pagina pagina-inicio">
    <div class="cabecera-inicio cabecera-inicio--centrada">
      <div class="icono-inicio">
        <q-icon name="local_cafe" size="40px" color="primary" />
      </div>
      <span class="kicker-inicio">Sistema de mesas y cobros</span>
      <h1 class="titulo text-h5 q-my-none">{{ saludo }}</h1>
      <p class="text-body2 texto-suave q-mt-xs q-mb-none">{{ fechaHoy }}</p>
      <div class="regla-inicio" aria-hidden="true"></div>
      <p class="text-body1 q-mt-sm q-mb-none intro-inicio">
        Este sistema reemplaza la libreta de papel de la cafetería: anota los productos de cada
        mesa al momento, lleva el control de lo que lleva consumido y cierra la cuenta indicando
        cómo pagó. Las mesas libres, ocupadas y sus totales se actualizan al instante y desde el
        menú de la izquierda pasas al <strong>Salón</strong>, al <strong>Menú</strong> y al
        <strong>Cierre del día</strong>.
      </p>
      <svg class="decoracion-inicio decoracion-inicio--izquierda decoracion-inicio--arriba" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
        <path d="M23 6c-3 3.2-3 6.3 0 9.5s3 6.3 0 9.5" stroke="#dda24b" stroke-width="2.4" stroke-linecap="round" />
        <path d="M33 4c-3 3.2-3 6.3 0 9.5s3 6.3 0 9.5" stroke="#dda24b" stroke-width="2.4" stroke-linecap="round" />
        <path d="M43 7c-3 3.2-3 6.3 0 9.5s3 6.3 0 9.5" stroke="#dda24b" stroke-width="2.4" stroke-linecap="round" />
        <path d="M10 28h34v11a13 13 0 0 1-13 13H23a13 13 0 0 1-13-13V28z" fill="#fff7e6" stroke="#d18b2c" stroke-width="2.6" stroke-linejoin="round" />
        <path d="M44 32h4.5a6.5 6.5 0 0 1 0 13H44" stroke="#d18b2c" stroke-width="2.6" stroke-linejoin="round" />
        <path d="M6 58h44" stroke="#d18b2c" stroke-width="2.6" stroke-linecap="round" />
      </svg>
      <svg class="decoracion-inicio decoracion-inicio--izquierda decoracion-inicio--centro" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
        <g stroke="#d18b2c" stroke-width="2.4">
          <g transform="translate(20 18) rotate(-25)">
            <ellipse rx="9" ry="13" fill="#fbe9c4" />
            <path d="M0 -10c-3.5 5-3.5 15 0 20" fill="none" />
          </g>
          <g transform="translate(45 30) rotate(35)">
            <ellipse rx="8" ry="11.5" fill="#fbe9c4" />
            <path d="M0 -9c-3 4.5-3 13.5 0 18" fill="none" />
          </g>
          <g transform="translate(24 47) rotate(10)">
            <ellipse rx="8.5" ry="12" fill="#fbe9c4" />
            <path d="M0 -9c-3 4.5-3 13.5 0 18" fill="none" />
          </g>
        </g>
      </svg>
      <svg class="decoracion-inicio decoracion-inicio--izquierda decoracion-inicio--abajo" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
        <circle cx="32" cy="34" r="21" fill="#fbe9c4" stroke="#d18b2c" stroke-width="2.6" />
        <circle cx="32" cy="34" r="7.5" fill="#fff7e6" stroke="#d18b2c" stroke-width="2.6" />
        <g stroke="#d18b2c" stroke-width="2.4" stroke-linecap="round">
          <path d="M18.5 31l4-3" />
          <path d="M25 18l3 3.5" />
          <path d="M35.5 19l3.5 2.5" />
          <path d="M43 32.5l4 1" />
          <path d="M28.5 45.5l2.5 3.5" />
        </g>
      </svg>
      <svg class="decoracion-inicio decoracion-inicio--derecha decoracion-inicio--arriba" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
        <circle cx="32" cy="32" r="21" fill="#fbe9c4" stroke="#d18b2c" stroke-width="2.6" />
        <g fill="#8b5a2b">
          <circle cx="24" cy="24" r="2.8" />
          <circle cx="40" cy="26" r="2.8" />
          <circle cx="30" cy="38" r="2.8" />
          <circle cx="41" cy="40" r="2.6" />
          <circle cx="22" cy="35" r="2.6" />
        </g>
      </svg>
      <svg class="decoracion-inicio decoracion-inicio--derecha decoracion-inicio--centro" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
        <path d="M15 21h34l-4 30a4 4 0 0 1-4 4H23a4 4 0 0 1-4-4z" fill="#fff7e6" stroke="#d18b2c" stroke-width="2.6" stroke-linejoin="round" />
        <path d="M16.7 34h30.6l-1.5 11H18.2z" fill="#fbe9c4" stroke="#d18b2c" stroke-width="2.6" stroke-linejoin="round" />
        <rect x="11" y="11" width="42" height="10" rx="4" fill="#fff7e6" stroke="#d18b2c" stroke-width="2.6" />
      </svg>
      <svg class="decoracion-inicio decoracion-inicio--derecha decoracion-inicio--abajo" viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
        <rect x="16" y="19" width="24" height="37" rx="4" fill="#fff7e6" stroke="#d18b2c" stroke-width="2.6" />
        <path d="M17.5 39h21v11a4 4 0 0 1-4 4h-13a4 4 0 0 1-4-4z" fill="#f0cd99" />
        <path d="M28 19v19" stroke="#d18b2c" stroke-width="2.4" stroke-linecap="round" />
        <path d="M18 38h20" stroke="#d18b2c" stroke-width="2.4" stroke-linecap="round" />
        <rect x="13" y="12" width="30" height="8" rx="3" fill="#fff7e6" stroke="#d18b2c" stroke-width="2.6" />
        <rect x="26" y="4" width="4" height="9" rx="2" fill="#fff7e6" stroke="#d18b2c" stroke-width="2.4" />
        <path d="M40 26h4a7 7 0 0 1 7 7v4a7 7 0 0 1-7 7h-4" stroke="#d18b2c" stroke-width="2.6" stroke-linejoin="round" />
      </svg>
    </div>

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