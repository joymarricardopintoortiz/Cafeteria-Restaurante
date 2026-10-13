const moneda = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0
})

export const formatoMoneda = (valor) => moneda.format(valor || 0)

export const formatoHora = (ms) =>
    new Date(ms).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })

export const formatoFecha = (ms) => {
    const texto = new Date(ms).toLocaleDateString('es-CO', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    })
    return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export const formatoFechaCorta = (ms) =>
    new Date(ms).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })

// Compara solo el día calendario en hora local: sirve para reglas como
// "un solo cierre por día" aunque haya pasado la medianoche entre operaciones.
export const esMismoDia = (msA, msB) => {
    const a = new Date(msA)
    const b = new Date(msB)
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    )
}

export const minutosDesde = (ms, ahora = Date.now()) =>
    Math.max(0, Math.floor((ahora - ms) / 60000))

export const textoDuracion = (minutos) => {
    if (minutos < 60) return `${minutos} min`
    const horas = Math.floor(minutos / 60)
    const resto = minutos % 60
    return resto ? `${horas} h ${resto} min` : `${horas} h`
}