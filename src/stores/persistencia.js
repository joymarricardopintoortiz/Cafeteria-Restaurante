const CLAVES = {
  mesas: 'cafeteria-mesas',
  menu: 'cafeteria-menu',
  cuentas: 'cafeteria-cuentas',
  cierres: 'cafeteria-cierres'
}

export function persistenciaPlugin() {
  return ({ store }) => {
    const clave = CLAVES[store.$id]
    if (!clave) return

    try {
      const guardado = localStorage.getItem(clave)
      if (guardado) store.$patch(JSON.parse(guardado))
    } catch (error) {
      localStorage.removeItem(clave)
      console.warn(`No se pudo restaurar "${clave}":`, error)
    }

    try {
      localStorage.setItem(clave, JSON.stringify(store.$state))
    } catch (error) {
      console.warn(`No se pudo guardar "${clave}":`, error)
    }

    store.$subscribe(
      () => {
        try {
          localStorage.setItem(clave, JSON.stringify(store.$state))
        } catch (error) {
          console.warn(`No se pudo guardar "${clave}":`, error)
        }
      },
      { detached: true, flush: 'sync' }
    )
  }
}
