<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useMesasStore } from '../stores/mesas.js'
import { useMenuStore } from '../stores/menu.js'
import { useCuentasStore } from '../stores/cuentas.js'
import { crearId } from '../utils/id.js'
import { formatoMoneda } from '../utils/format.js'
import { iconoCategoria } from '../utils/categorias.js'
import ProductoCard from '../components/ProductoCard.vue'
import CuentaPanel from '../components/CuentaPanel.vue'
import CobroDialog from '../components/CobroDialog.vue'

const props = defineProps({ id: { type: String, required: true } })

const router = useRouter()
const $q = useQuasar()
const mesas = useMesasStore()
const menu = useMenuStore()
const cuentas = useCuentasStore()

const mesa = computed(() => mesas.porId(props.id))
const cuenta = computed(() => (mesa.value ? cuentas.cuentaAbiertaDe(mesa.value.id) : null))

// Mesa libre: los productos van a un borrador local que solo se guarda al pedir.
const borrador = ref([])

const esBorrador = computed(() => !!mesa.value && !cuenta.value)
const cuentaVisible = computed(() =>
  cuenta.value ?? (esBorrador.value ? { id: null, items: borrador.value, abiertaAt: null } : null)
)

const busqueda = ref('')
const categoriaActiva = ref('todas')
const dialogoCobro = ref(false)

const opcionesCategoria = computed(() => [
  { label: 'Todas', value: 'todas' },
  ...menu.categorias.map((categoria) => ({ label: categoria, value: categoria }))
])

const productosFiltrados = computed(() => {
  const texto = busqueda.value.trim().toLowerCase()
  return menu.productos.filter((producto) => {
    const coincideCategoria =
      categoriaActiva.value === 'todas' || producto.categoria === categoriaActiva.value
    const coincideTexto = !texto || producto.nombre.toLowerCase().includes(texto)
    return coincideCategoria && coincideTexto
  })
})

const cantidadEnCuenta = (productoId) =>
  cuentaVisible.value?.items.find((item) => item.productoId === productoId)?.cantidad ?? 0

function agregarAlBorrador(producto) {
  const existente = borrador.value.find(
    (item) => item.productoId === producto.id && item.precio === producto.precio
  )
  if (existente) existente.cantidad += 1
  else {
    borrador.value.push({
      id: crearId(),
      productoId: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: 1,
      nota: ''
    })
  }
}

function agregarProducto(producto) {
  if (esBorrador.value) agregarAlBorrador(producto)
  else cuentas.agregarProducto(mesa.value, producto)
}

function cambiarCantidadBorrador(item, delta) {
  const encontrado = borrador.value.find((i) => i.id === item.id)
  if (encontrado) encontrado.cantidad = Math.max(1, encontrado.cantidad + delta)
}

function quitarItemBorrador(item) {
  borrador.value = borrador.value.filter((i) => i.id !== item.id)
}

function guardarNotaBorrador(item, nota) {
  const encontrado = borrador.value.find((i) => i.id === item.id)
  if (encontrado) encontrado.nota = (nota ?? '').trim()
}

function pedir() {
  if (!borrador.value.length) return
  cuentas.guardarCuenta(mesa.value, borrador.value)
  borrador.value = []
  $q.notify({ type: 'positive', message: `Pedido guardado. Mesa ${mesa.value.numero} ocupada` })
  router.push({ name: 'salon' })
}

function abrirCobro() {
  if (!cuenta.value?.items.length) return
  dialogoCobro.value = true
}

function confirmarCobro(datos) {
  const cobrado = cuentas.cobrar(cuenta.value.id, datos)
  if (cobrado) {
    $q.notify({ type: 'positive', message: `Mesa ${mesa.value.numero} cobrada` })
    router.push({ name: 'salon' })
  }
}

function cancelarCuenta() {
  if (!cuenta.value) {
    router.push({ name: 'salon' })
    return
  }

  if (!cuenta.value.items.length) {
    cuentas.cancelar(cuenta.value.id)
    router.push({ name: 'salon' })
    return
  }

  $q.dialog({
    title: 'Cancelar cuenta',
    message: `La mesa ${mesa.value.numero} tiene ${formatoMoneda(
      cuenta.value.items.reduce((s, i) => s + i.precio * i.cantidad, 0)
    )} en productos. Explica el motivo de la cancelación.`,
    prompt: { model: '', type: 'text', label: 'Motivo', isValid: (v) => v.trim().length > 0 },
    cancel: { flat: true, label: 'Volver', color: 'primary' },
    ok: { flat: true, label: 'Cancelar cuenta', color: 'negative' },
    persistent: true
  }).onOk((motivo) => {
    cuentas.cancelar(cuenta.value.id, motivo)
    $q.notify({ type: 'warning', message: `Cuenta de la mesa ${mesa.value.numero} cancelada` })
    router.push({ name: 'salon' })
  })
}
</script>

<template>
  <q-page v-if="mesa && mesa.disponibilidad === 'fuera de servicio' && !cuenta" class="pagina">
    <div class="vacio">
      <q-icon name="block" size="48px" color="grey-6" />
      <p class="text-body1 q-mt-sm q-mb-xs">La mesa {{ mesa.numero }} está fuera de servicio</p>
      <p class="text-body2 texto-suave q-mb-md">No se puede entrar a esta mesa mientras esté bloqueada.</p>
      <q-btn unelevated no-caps color="primary" label="Volver al salón" :to="{ name: 'salon' }" />
    </div>
  </q-page>

  <q-page v-else-if="mesa" class="pagina">
    <div class="cabecera">
      <q-btn
        flat
        round
        dense
        icon="arrow_back"
        aria-label="Volver al salón"
        :to="{ name: 'salon' }"
      />
      <div>
        <h1 class="titulo text-h5 q-my-none">Mesa {{ mesa.numero }}</h1>
        <p class="text-body2 texto-suave q-mt-xs q-mb-none">Capacidad para {{ mesa.capacidad }} personas</p>
      </div>
    </div>

    <div class="contenido">
      <section class="columna-menu">
        <div class="filtros">
          <q-input
            v-model="busqueda"
            outlined
            dense
            clearable
            placeholder="Buscar producto"
            class="buscador"
          >
            <template #prepend>
              <q-icon name="search" />
            </template>
          </q-input>

          <q-tabs
            v-model="categoriaActiva"
            dense
            no-caps
            inline-label
            active-color="primary"
            indicator-color="primary"
            align="left"
            class="categorias"
          >
            <q-tab
              v-for="opcion in opcionesCategoria"
              :key="opcion.value"
              :name="opcion.value"
              :label="`${opcion.value === 'todas' ? '🍴' : iconoCategoria(opcion.value)} ${opcion.label}`"
            />
          </q-tabs>
        </div>

        <div v-if="!productosFiltrados.length" class="vacio">
          <q-icon name="search_off" size="40px" color="grey-6" />
          <p class="text-body2 texto-suave q-mt-sm q-mb-none">
            Ningún producto coincide con la búsqueda.
          </p>
        </div>

        <div v-else class="grilla-productos">
          <ProductoCard
            v-for="producto in productosFiltrados"
            :key="producto.id"
            :producto="producto"
            :cantidad="cantidadEnCuenta(producto.id)"
            @agregar="agregarProducto"
          />
        </div>
      </section>

      <aside class="columna-cuenta">
        <CuentaPanel
          :mesa="mesa"
          :cuenta="cuentaVisible"
          :es-borrador="esBorrador"
          @cobrar="abrirCobro"
          @cancelar="cancelarCuenta"
          @pedir="pedir"
          @cambiar-cantidad="cambiarCantidadBorrador"
          @quitar-item="quitarItemBorrador"
          @guardar-nota="guardarNotaBorrador"
        />
      </aside>
    </div>

    <CobroDialog
      v-model="dialogoCobro"
      :subtotal="cuenta ? cuenta.items.reduce((s, i) => s + i.precio * i.cantidad, 0) : 0"
      :mesa-numero="mesa?.numero"
      @confirmar="confirmarCobro"
    />
  </q-page>

  <q-page v-else class="pagina">
    <div class="vacio">
      <q-icon name="table_restaurant" size="48px" color="grey-6" />
      <p class="text-body1 q-mt-sm q-mb-xs">Esta mesa ya no existe</p>
      <q-btn unelevated no-caps color="primary" label="Volver al salón" :to="{ name: 'salon' }" />
    </div>
  </q-page>
</template>