<script setup>
import { reactive, ref, watch } from 'vue'
import { useMenuStore } from '../stores/menu.js'

const abierto = defineModel({ type: Boolean, default: false })

const props = defineProps({
  producto: { type: Object, default: null }
})

const emit = defineEmits(['guardar'])

const menu = useMenuStore()
const opciones = ref([])
const form = reactive({ nombre: '', categoria: '', precio: null, disponible: true })

watch(abierto, (visible) => {
  if (!visible) return
  form.nombre = props.producto?.nombre ?? ''
  form.categoria = props.producto?.categoria ?? ''
  form.precio = props.producto?.precio ?? null
  form.disponible = props.producto?.disponible ?? true
  opciones.value = menu.categorias
})

const filtrarCategorias = (texto, actualizar) => {
  actualizar(() => {
    const buscado = texto.toLowerCase()
    opciones.value = menu.categorias.filter((categoria) =>
      categoria.toLowerCase().includes(buscado)
    )
  })
}

const fijarCategoria = (texto) => {
  form.categoria = texto
}

const reglasNombre = [(v) => !!v?.trim() || 'Escribe el nombre del producto']
const reglasCategoria = [(v) => !!v?.trim() || 'Elige o escribe una categoría']
const reglasPrecio = [(v) => (Number.isInteger(v) && v > 0) || 'Ingresa un precio mayor que 0']

function guardar() {
  emit('guardar', {
    nombre: form.nombre.trim(),
    categoria: form.categoria.trim(),
    precio: form.precio,
    disponible: form.disponible
  })
  abierto.value = false
}
</script>

<template>
  <q-dialog v-model="abierto" persistent>
    <q-card class="dialogo">
      <q-form @submit="guardar">
        <q-card-section>
          <h2 class="titulo text-h6 q-my-none">
            {{ producto ? 'Editar producto' : 'Nuevo producto' }}
          </h2>
        </q-card-section>

        <q-card-section class="q-gutter-y-md">
          <q-input
            v-model="form.nombre"
            outlined
            autofocus
            maxlength="50"
            label="Nombre"
            :rules="reglasNombre"
            lazy-rules
          />
          <q-select
            v-model="form.categoria"
            outlined
            use-input
            hide-selected
            fill-input
            input-debounce="0"
            label="Categoría"
            hint="Elige una existente o escribe una nueva"
            :options="opciones"
            :rules="reglasCategoria"
            lazy-rules
            @filter="filtrarCategorias"
            @input-value="fijarCategoria"
          />
          <q-input
            v-model.number="form.precio"
            type="number"
            outlined
            prefix="$"
            label="Precio"
            :hint="
              producto
                ? 'El nuevo precio aplica a pedidos nuevos. Las cuentas abiertas conservan el anterior.'
                : ''
            "
            :rules="reglasPrecio"
            lazy-rules
          />
          <q-toggle v-model="form.disponible" label="Disponible hoy" />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps label="Cancelar" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="primary"
            type="submit"
            :label="producto ? 'Guardar cambios' : 'Agregar al menú'"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>