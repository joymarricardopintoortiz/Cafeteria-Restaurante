import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { crearId } from '../utils/id.js'
import { useCuentasStore } from './cuentas.js'

export const useCajaStore = defineStore(
  'caja',
  () => {
    const cuentasStore = useCuentasStore()

    const base = ref(0)
    const arqueos = ref([])

    const pagadasEfectivo = computed(() =>
      cuentasStore.cuentas.filter(
        (cuenta) => cuenta.estado === 'pagada' && cuenta.pago?.metodo === 'efectivo'
      )
    )
    const efectivoCobrado = computed(() =>
      pagadasEfectivo.value.reduce((suma, cuenta) => suma + cuenta.pago.total, 0)
    )
    const cambiosEntregados = computed(() =>
      pagadasEfectivo.value.reduce((suma, cuenta) => suma + (cuenta.pago.cambio ?? 0), 0)
    )
    const efectivoEsperado = computed(
      () => base.value + efectivoCobrado.value - cambiosEntregados.value
    )

    function fijarBase(valor) {
      base.value = Math.max(0, Math.round(Number(valor) || 0))
    }

    function arquear(contada) {
      const conteo = Math.max(0, Math.round(Number(contada) || 0))
      const registro = {
        id: crearId(),
        fecha: Date.now(),
        base: base.value,
        efectivoCobrado: efectivoCobrado.value,
        cambiosEntregados: cambiosEntregados.value,
        esperado: efectivoEsperado.value,
        contada: conteo,
        diferencia: conteo - efectivoEsperado.value
      }
      arqueos.value.unshift(registro)
      base.value = 0
      return registro
    }

    function reiniciar() {
      base.value = 0
      arqueos.value = []
    }

    return {
      base,
      arqueos,
      efectivoCobrado,
      cambiosEntregados,
      efectivoEsperado,
      fijarBase,
      arquear,
      reiniciar
    }
  }
)
