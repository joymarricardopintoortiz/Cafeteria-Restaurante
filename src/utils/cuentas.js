export const METODOS_PAGO = [
    { valor: 'efectivo', etiqueta: 'Efectivo', icono: 'payments' },
    { valor: 'tarjeta', etiqueta: 'Tarjeta', icono: 'credit_card' },
    { valor: 'transferencia', etiqueta: 'Transferencia', icono: 'smartphone'}
]

export const etiquetaMetodo = (valor) =>
    METODOS_PAGO.find((metodo) => metodo.valor === valor)?.etiqueta ?? valor

export const subtotalCuenta = (cuenta) =>
    cuenta.items.reduce((suma, item) => suma + item.precio * item.cantidad, 0)

export const unidadesCuenta = (cuenta) =>
    cuenta.items.reduce((suma, item) => suma + item.cantidad, 0)

// Cada línea pertenece a un "pedido" (ronda) de la misma mesa. Las cuentas
// guardadas antes de existir este campo se tratan como pedido 1.
export const rondaDe = (item) => item.pedido ?? 1

// Último pedido ya confirmado de la cuenta (también con respaldo antiguo).
export const pedidosConfirmados = (cuenta) => cuenta?.pedido ?? 1

// Ronda que se está tomando ahora mismo: la siguiente a la confirmada.
export const rondaEnCurso = (cuenta) => pedidosConfirmados(cuenta) + 1

export const itemsDeRonda = (cuenta, ronda) =>
    (cuenta?.items ?? []).filter((item) => rondaDe(item) === ronda)

export const itemsDeRondasPrevias = (cuenta) =>
    (cuenta?.items ?? []).filter((item) => rondaDe(item) <= pedidosConfirmados(cuenta))

export const subtotalRonda = (cuenta, ronda) =>
    itemsDeRonda(cuenta, ronda).reduce((suma, item) => suma + item.precio * item.cantidad, 0)

export function construirResumen(cuentas) {
    const pagadas = cuentas.filter((cuenta) => cuenta.estado === 'pagada')
    const canceladas = cuentas.filter((cuenta) => cuenta.estado === 'cancelada')

    const ventas = pagadas.reduce((suma, cuenta) => suma + cuenta.pago.subtotal, 0)
    const propinas = pagadas.reduce((suma, cuenta) => suma + cuenta.pago.propina, 0)

    const porMetodo = {}
    METODOS_PAGO.forEach((metodo) => {
        porMetodo[metodo.valor] = 0
    })
    pagadas.forEach((cuenta) => {
        porMetodo[cuenta.pago.metodo] = (porMetodo[cuenta.pago.metodo] ?? 0) + cuenta.pago.total
    })

    const acumulado = new Map()
    pagadas.forEach((cuenta) => {
        cuenta.items.forEach((item) => {
            const actual = acumulado.get(item.productoId) ?? {
                productoId: item.productoId,
                nombre: item.nombre,
                cantidad: 0,
                ingresos:0
            }
            actual.cantidad += item.cantidad
            actual.ingresos += item.cantidad * item.precio
            acumulado.set(item.productoId, actual)
        })
    })

    const productos = [...acumulado.values()].sort(
        (a, b) => b.cantidad - a.cantidad || b.ingresos - a.ingresos
    )

    return {
        cuentasPagadas: pagadas.length,
        ventas,
        propinas,
        totalCobrado: ventas + propinas,
        ticketPromedio: pagadas.length ? Math.round(ventas / pagadas.length) : 0,
        porMetodo,
        productos,
        cuentasCanceladas: canceladas.length,
        valorCancelado: canceladas.reduce((suma, cuenta) => suma + subtotalCuenta(cuenta), 0)
    }
}