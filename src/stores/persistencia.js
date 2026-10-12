const CLAVES = {
  mesas: 'cafeteria-mesas',
  menu: 'cafeteria-menu',
  cuentas: 'cafeteria-cuentas',
  cierres: 'cafeteria-cierres',
  caja: 'cafeteria-caja'
}

// Único punto de contacto con localStorage de toda la app: Pinia entra y sale
// por aquí (el localStorage "directo" en componentes o stores está prohibido).

function leer(clave) {
  try {
    return localStorage.getItem(clave)
  } catch (error) {
    console.error(`No se pudo leer "${clave}":`, error)
    return null
  }
}

function guardar(clave, store) {
  let texto
  try {
    texto = JSON.stringify(store.$state)
  } catch (error) {
    console.error(`No se pudo serializar el estado de "${clave}":`, error)
    return
  }

  try {
    // Solo escribe si algo cambió: evita escrituras inútiles y los bucles
    // que se armarían con el evento "storage" entre pestañas.
    if (leer(clave) === texto) return
    localStorage.setItem(clave, texto)
  } catch (error) {
    console.error(`No se pudo guardar "${clave}":`, error)
  }
}

function restaurar(clave, store) {
  const guardado = leer(clave)
  if (!guardado) return

  try {
    store.$patch(JSON.parse(guardado))
  } catch (error) {
    // Nunca se borra sin dejar copia: lo dañado queda en "<clave>.respaldo".
    try {
      localStorage.setItem(`${clave}.respaldo`, guardado)
      localStorage.removeItem(clave)
    } catch (errorInterno) {
      console.error(`No se pudo poner a salvo "${clave}":`, errorInterno)
    }
    console.error(
      `No se pudo restaurar "${clave}"; la copia quedó en "${clave}.respaldo":`,
      error
    )
  }
}

// Mantiene al día todas las pestañas abiertas: si una guarda, las demás se
// actualizan en el acto y no vuelven a pisar lo recién guardado.
function sincronizarEntrePestanas(clave, store) {
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return

  window.addEventListener('storage', (evento) => {
    if (evento.key !== clave || evento.newValue == null) return
    // Si nuestro estado ya coincide con lo que llegó, no hay nada que tocar
    // (así se rompe cualquier bucle de escrituras entre pestañas).
    if (evento.newValue === safeStringify(store)) return

    try {
      store.$patch(JSON.parse(evento.newValue))
    } catch (error) {
      console.error(`No se pudo sincronizar "${clave}" desde otra pestaña:`, error)
    }
  })
}

function safeStringify(store) {
  try {
    return JSON.stringify(store.$state)
  } catch (error) {
    return null
  }
}

export function persistenciaPlugin() {
  return ({ store }) => {
    const clave = CLAVES[store.$id]
    if (!clave) return

    restaurar(clave, store)
    guardar(clave, store)
    sincronizarEntrePestanas(clave, store)

    store.$subscribe(() => guardar(clave, store), { detached: true, flush: 'sync' })
  }
}
