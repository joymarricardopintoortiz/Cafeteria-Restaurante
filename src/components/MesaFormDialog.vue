<script setup>
import { ref, watch } from 'vue'
import { useMesasStore } from '../stores/mesas.js'

const abierto = defineModel({ type: Boolean, default: false })

const props = defineProps({
  mesa: { type: Object, default: null }
})

const emit = defineEmits(['guardar'])

const mesas = useMesasStore()
const numero = ref(1)
const capacidad = ref(4)
const disponibilidad = ref('disponible')

watch(abierto, (visible) => {
  if (!visible) return
  numero.value = props.mesa?.numero ?? mesas.siguienteNumero
  capacidad.value = props.mesa?.capacidad ?? 4
  disponibilidad.value = props.mesa?.disponibilidad ?? 'disponible'
})

const reglasNumero = [
  (v) => (Number.isInteger(v) && v > 0) || 'Escribe un número entero mayor que 0',
  (v) => !mesas.existeNumero(v, props.mesa?.id ?? null) || 'Ya existe una mesa con ese número'
]

const reglasCapacidad = [
  (v) => (Number.isInteger(v) && v >= 1 && v <= 20) || 'Ingresa entre 1 y 20 personas'
]

function guardar() {
  emit('guardar', { numero: numero.value, capacidad: capacidad.value, disponibilidad: disponibilidad.value })
  abierto.value = false
}
</script>

<template>
  <q-dialog v-model="abierto" persistent>
    <q-card class="dialogo">
      <q-form @submit="guardar">
        <q-card-section>
          <h2 class="titulo text-h6 q-my-none">{{ mesa ? 'Editar mesa' : 'Nueva mesa' }}</h2>
        </q-card-section>

        <q-card-section class="q-gutter-y-md">
          <q-input
            v-model.number="numero"
            type="number"
            outlined
            autofocus
            label="Número de mesa"
            :rules="reglasNumero"
            lazy-rules
          />
          <q-input
            v-model.number="capacidad"
            type="number"
            outlined
            label="Capacidad (personas)"
            :rules="reglasCapacidad"
            lazy-rules
          />
          <q-select
            v-model="disponibilidad"
            outlined
            emit-value
            map-options
            :options="[
              { label: 'Disponible', value: 'disponible' },
              { label: 'Fuera de servicio', value: 'fuera de servicio' }
            ]"
            label="Disponibilidad"
          />
        </q-card-section>

        <q-card-actions align="right" class="q-pa-md">
          <q-btn flat no-caps label="Cancelar" v-close-popup />
          <q-btn
            unelevated
            no-caps
            color="primary"
            type="submit"
            :label="mesa ? 'Guardar cambios' : 'Agregar mesa'"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>