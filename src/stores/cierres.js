import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { crearId } from '../utils/id'
import { construirResumen } from '../utils/cuentas'
import { esMismoDia } from '../utils/format'
import { useCuentasStore } from './cuentas'

// Reloj fuera del store para que no entre en $state ni en la persistencia:
// solo marca la hora actual para detectar el cambio de día calendario.
// Sin esto, el cierre del día quedaría bloqueado hasta recargar la app.
const ahora = ref(Date.now())
if (typeof window !== 'undefined' && typeof window.setInterval === 'function') {
    window.setInterval(() => {
        ahora.value = Date.now()
    }, 30000)
}

export const useCierresStore = defineStore(
    'cierres',
    () => {
        const cuentasStore = useCuentasStore()
        const historial = ref([])
        const jornadaInicio = ref(Date.now())
        const resumenActual = computed(() =>  construirResumen(cuentasStore.cuentas))

        // Cerrar el día es un acto por jornada: si ya hay un cierre registrado
        // en el día de hoy, no se vuelve a cerrar hasta mañana.
        const cerradoHoy = computed(() =>
            historial.value.some((registro) => esMismoDia(registro.cierre, ahora.value))
        )

        // Cerrar exige tener todas las mesas libres y algo registrado hoy:
        // una venta o, al menos, una cuenta cancelada.
        const puedeCerrar = computed(() => {
            if (cerradoHoy.value) return false
            if (cuentasStore.abiertas.length > 0) return false
            const r = resumenActual.value
            return r.cuentasPagadas > 0 || r.cuentasCanceladas > 0
        })

        // El arqueo de la jornada queda guardado en el registro del día para que
        // el cuadre de caja sea auditable después (los días viejos no lo traen).
        function cerrarDia(observaciones = '', caja = null) {
            if (!puedeCerrar.value) return null

            const registro = {
                id: crearId(),
                inicio: jornadaInicio.value,
                cierre: Date.now(),
                observaciones: observaciones.trim(),
                resumen: construirResumen(cuentasStore.cuentas),
                cuentas: JSON.parse(JSON.stringify(cuentasStore.cerradas)),
                caja: caja
                    ? {
                          base: caja.base,
                          efectivoCobrado: caja.efectivoCobrado,
                          cambiosEntregados: caja.cambiosEntregados,
                          esperado: caja.esperado,
                          contada: caja.contada,
                          diferencia: caja.diferencia
                      }
                    : null
            }

            historial.value.unshift(registro)
            cuentasStore.reiniciar()
            jornadaInicio.value = Date.now()
            return registro
        }

        return {
            historial, jornadaInicio, resumenActual, cerradoHoy, puedeCerrar, cerrarDia
        }
    }
)

