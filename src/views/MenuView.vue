<script setup>
import { computed, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useMenuStore } from '../stores/menu.js'
import { formatoMoneda } from '../utils/format.js'
import ProductoFormDialog from '../components/ProductoFormDialog.vue'

const $q = useQuasar()
const menu = useMenuStore()
const disponibles = computed(() => menu.productos.length - menu.agotados.length)

const busqueda = ref('')
const categoriaActiva = ref('todas')
const dialogoAbierto = ref(false)
const productoEnEdicion = ref(null)

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

const columnas = [
  { name: 'nombre', label: 'Producto', field: 'nombre', align: 'left', sortable: true },
  { name: 'categoria', label: 'Categoría', field: 'categoria', align: 'left', sortable: true },
  {
    name: 'precio',
    label: 'Precio',
    field: 'precio',
    align: 'right',
    sortable: true,
    format: (v) => formatoMoneda(v)
  },
  { name: 'disponible', label: 'Disponibilidad', field: 'disponible', align: 'center' },
  { name: 'acciones', label: '', field: 'acciones', align: 'right' }
]

function nuevoProducto() {
  productoEnEdicion.value = null
  dialogoAbierto.value = true
}

function editarProducto(producto) {
  productoEnEdicion.value = producto
  dialogoAbierto.value = true
}

function guardarProducto(datos) {
  if (productoEnEdicion.value) {
    menu.actualizar(productoEnEdicion.value.id, datos)
    $q.notify({ type: 'positive', message: `${datos.nombre} actualizado` })
  } else {
    menu.agregar(datos)
    $q.notify({ type: 'positive', message: `${datos.nombre} agregado al menú` })
  }
}

function alternarDisponibilidad(producto) {
  menu.alternarDisponibilidad(producto.id)
  $q.notify({
    type: producto.disponible ? 'positive' : 'warning',
    message: producto.disponible
      ? `${producto.nombre} marcado como agotado`
      : `${producto.nombre} disponible de nuevo`
  })
}

function eliminarProducto(producto) {
  $q.dialog({
    title: 'Eliminar producto',
    message: `¿Quitar "${producto.nombre}" del menú? Las cuentas ya cobradas no se ven afectadas.`,
    cancel: { flat: true, label: 'Volver', color: 'primary' },
    ok: { flat: true, label: 'Eliminar', color: 'negative' },
    persistent: true
  }).onOk(() => {
    menu.eliminar(producto.id)
    $q.notify({ type: 'info', message: `${producto.nombre} eliminado del menú` })
  })
}
</script>

<template>
  <q-page class="pagina">
    <div class="cabecera">
      <div>
        <h1 class="titulo text-h5 q-my-none">Menú</h1>
        <p class="text-body2 texto-suave q-mt-xs q-mb-none">
          {{ menu.productos.length }} productos, {{ disponibles }} disponibles, {{ menu.agotados.length }} agotados
        </p>
      </div>
      <q-space />
      <q-btn
        unelevated
        no-caps
        color="primary"
        icon="add"
        label="Nuevo producto"
        @click="nuevoProducto"
      />
    </div>

    <div class="filtros">
      <q-input v-model="busqueda" outlined dense clearable placeholder="Buscar producto" class="buscador">
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
          :label="opcion.label"
        />
      </q-tabs>
    </div>

    <div v-if="!menu.productos.length" class="vacio">
      <q-icon name="restaurant_menu" size="48px" color="grey-6" />
      <p class="text-body1 q-mt-sm q-mb-xs">El menú está vacío</p>
      <p class="text-body2 texto-suave q-mb-md">Agrega el primer producto para empezar a vender.</p>
      <q-btn unelevated no-caps color="primary" label="Nuevo producto" @click="nuevoProducto" />
    </div>

    <q-table
      v-else
      flat
      bordered
      :rows="productosFiltrados"
      :columns="columnas"
      row-key="id"
      :pagination="{ rowsPerPage: 10 }"
      no-data-label="Ningún producto coincide con la búsqueda"
    >
      <template #body-cell-disponible="scope">
        <q-td :props="scope">
          <q-toggle
            :model-value="scope.row.disponible"
            color="primary"
            :aria-label="`Marcar ${scope.row.nombre} como ${scope.row.disponible ? 'agotado' : 'disponible'}`"
            @update:model-value="alternarDisponibilidad(scope.row)"
          />
          <span class="text-caption">{{ scope.row.disponible ? 'Disponible' : 'Agotado' }}</span>
        </q-td>
      </template>

      <template #body-cell-acciones="scope">
        <q-td :props="scope" class="acciones">
          <q-btn
            flat
            round
            dense
            icon="edit"
            :aria-label="`Editar ${scope.row.nombre}`"
            @click="editarProducto(scope.row)"
          />
          <q-btn
            flat
            round
            dense
            icon="delete_outline"
            color="negative"
            :aria-label="`Eliminar ${scope.row.nombre}`"
            @click="eliminarProducto(scope.row)"
          />
        </q-td>
      </template>
    </q-table>

    <ProductoFormDialog
      v-model="dialogoAbierto"
      :producto="productoEnEdicion"
      @guardar="guardarProducto"
    />
  </q-page>
</template>