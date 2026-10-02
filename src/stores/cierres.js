import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { crearId } from '../utils/id'
import { construirResumen } from '../utils/cuentas'
import { useCuentasStore } from './cuentas'

export const useCierresStore = defineStore(
    'cierres',
    () => {
        const cuentasStore = useCuentasStore()
        const historial = ref([])
        const jornadaInicio = ref(Date.now())
        const resumenActual = computed(() =>  construirResumen(cuentasStore.cuentas))
        const puedeCerrar = computed(
            () => cuentasStore.abiertas.length === 0 && resumenActual.value.cuentasPagadas > 0
        )

        function cerrarDia(observaciones = '') {
            if (!puedeCerrar.value) return null

            const registro = {
                id: crearId(),
                inicio: jornadaInicio.value,
                cierre: Date.now(),
                observaciones: observaciones.trim(),
                resumen: construirResumen(cuentasStore.cuentas),
                cuentas: JSON.parse(JSON.stringify(cuentasStore.cerradas))
            }

            historial.value.unshift(registro)
            cuentasStore.reiniciar()
            jornadaInicio.value = Date.now()
            return registro
        }

        return {
            historial, jornadaInicio, resumenActual, puedeCerrar, cerrarDia
        }
    },
    { persist: { key: 'cafeteria-cierres' } }
)
