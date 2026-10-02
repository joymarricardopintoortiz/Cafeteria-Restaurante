<script setup>
import { formatoMoneda } from '../utils/format.js'
import { iconoCategoria } from '../utils/categorias.js'

defineProps({
  producto: { type: Object, required: true },
  cantidad: { type: Number, default: 0 }
})

defineEmits(['agregar'])
</script>

<template>
  <button
    type="button"
    class="producto"
    :class="{ 'producto--agotado': !producto.disponible }"
    :disabled="!producto.disponible"
    :aria-label="
      producto.disponible
        ? `Agregar ${producto.nombre}, ${formatoMoneda(producto.precio)}`
        : `${producto.nombre}, agotado`
    "
    @click="$emit('agregar', producto)"
  >
    <span class="producto__cabecera">
      <span class="producto__categoria">{{ iconoCategoria(producto.categoria) }} {{ producto.categoria }}</span>
      <q-badge v-if="cantidad" color="primary" rounded :label="`×${cantidad}`" />
    </span>
    <span class="producto__nombre">{{ producto.nombre }}</span>
    <span class="producto__pie">
      <span class="producto__precio">{{ formatoMoneda(producto.precio) }}</span>
      <span v-if="!producto.disponible" class="producto__agotado">Agotado</span>
      <q-icon v-else name="add_circle" color="primary" size="26px" />
    </span>
  </button>
</template>