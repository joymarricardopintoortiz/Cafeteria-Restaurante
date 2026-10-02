import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { crearId } from '../utils/id.js'
import { subtotalCuenta } from '../utils/cuentas.js'

export const useCuentasStore = defineStore(
  'cuentas',
  () => {
    const cuentas = ref([])

    const abiertas = computed(() => cuentas.value.filter((c) => c.estado === 'abierta'))
    const cerradas = computed(() =>
      cuentas.value.filter((c) => c.estado !== 'abierta').sort((a, b) => b.cerradaAt - a.cerradaAt)
    )

    const cuentaAbiertaDe = (mesaId) => abiertas.value.find((c) => c.mesaId === mesaId)
    const abiertaPorId = (id) => abiertas.value.find((c) => c.id === id)

    function agregarProducto(mesa, producto) {
      if (!producto.disponible) return false

      let cuenta = cuentaAbiertaDe(mesa.id)
      if (!cuenta) {
        cuentas.value.push({
          id: crearId(),
          mesaId: mesa.id,
          mesaNumero: mesa.numero,
          estado: 'abierta',
          items: [],
          abiertaAt: Date.now(),
          cerradaAt: null,
          pago: null,
          motivoCancelacion: ''
        })
        cuenta = cuentas.value[cuentas.value.length - 1]
      }

      const existente = cuenta.items.find(
        (item) => item.productoId === producto.id && item.precio === producto.precio
      )
      if (existente) {
        existente.cantidad += 1
      } else {
        cuenta.items.push({
          id: crearId(),
          productoId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
          nota: ''
        })
      }
      return true
    }

    function cambiarCantidad(cuentaId, itemId, delta) {
      const item = abiertaPorId(cuentaId)?.items.find((i) => i.id === itemId)
      if (item) item.cantidad = Math.max(1, item.cantidad + delta)
    }

    function quitarItem(cuentaId, itemId) {
      const cuenta = abiertaPorId(cuentaId)
      if (cuenta) cuenta.items = cuenta.items.filter((i) => i.id !== itemId)
    }

    function actualizarNota(cuentaId, itemId, nota) {
      const item = abiertaPorId(cuentaId)?.items.find((i) => i.id === itemId)
      if (item) item.nota = (nota ?? '').trim()
    }

    function cobrar(cuentaId, { metodo, propina = 0, recibido = 0 }) {
      const cuenta = abiertaPorId(cuentaId)
      if (!cuenta || !cuenta.items.length) return false

      const subtotal = subtotalCuenta(cuenta)
      const total = subtotal + propina
      const enEfectivo = metodo === 'efectivo'
      if (enEfectivo && recibido < total) return false

      cuenta.pago = {
        metodo,
        subtotal,
        propina,
        total,
        recibido: enEfectivo ? recibido : total,
        cambio: enEfectivo ? recibido - total : 0
      }
      cuenta.estado = 'pagada'
      cuenta.cerradaAt = Date.now()
      return true
    }

    function cancelar(cuentaId, motivo = '') {
      const cuenta = abiertaPorId(cuentaId)
      if (!cuenta) return false

      if (!cuenta.items.length) {
        cuentas.value = cuentas.value.filter((c) => c.id !== cuentaId)
        return true
      }

      cuenta.estado = 'cancelada'
      cuenta.motivoCancelacion = motivo.trim()
      cuenta.cerradaAt = Date.now()
      return true
    }

    function reiniciar() {
      cuentas.value = []
    }

    return {
      cuentas,
      abiertas,
      cerradas,
      cuentaAbiertaDe,
      agregarProducto,
      cambiarCantidad,
      quitarItem,
      actualizarNota,
      cobrar,
      cancelar,
      reiniciar
    }
  },
  { persist: true }
)