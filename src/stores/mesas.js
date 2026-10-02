import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { crearId } from '../utils/id.js'

export const useMesasStore = defineStore(
  'mesas',
  () => {
    const mesas = ref(
      Array.from({ length: 8 }, (_, i) => ({
        id: crearId(),
        numero: i + 1,
        capacidad: i < 4 ? 2 : 4
      }))
    )

    const ordenadas = computed(() => [...mesas.value].sort((a, b) => a.numero - b.numero))
    const siguienteNumero = computed(
      () => mesas.value.reduce((mayor, mesa) => Math.max(mayor, mesa.numero), 0) + 1
    )

    const porId = (id) => mesas.value.find((mesa) => mesa.id === id)
    const existeNumero = (numero, ignorarId = null) =>
      mesas.value.some((mesa) => mesa.numero === numero && mesa.id !== ignorarId)

    function agregar({ numero, capacidad }) {
      mesas.value.push({ id: crearId(), numero, capacidad })
    }

    function actualizar(id, datos) {
      const mesa = porId(id)
      if (mesa) Object.assign(mesa, datos)
    }

    function eliminar(id) {
      mesas.value = mesas.value.filter((mesa) => mesa.id !== id)
    }

    return { mesas, ordenadas, siguienteNumero, porId, existeNumero, agregar, actualizar, eliminar }
  },
  { persist: true }
)