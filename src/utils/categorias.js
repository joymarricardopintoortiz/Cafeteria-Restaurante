// Iconos de las categorías originales del menú (clave normalizada).
const ICONOS = {
  'bebidas calientes': '☕',
  'bebidas frias': '🧋',
  'panaderia': '🥐',
  'almuerzos': '🍽️',
  'postres': '🍰'
}

// Sinónimos para categorías nuevas frecuentes (clave normalizada).
const SINONIMOS = {
  'bocados': '🥨',
  'bocado': '🥨',
  'snacks': '🥨',
  'snack': '🥨',
  'aperitivos': '🥨',
  'sandwich': '🥪',
  'sandwiches': '🥪',
  'tortas': '🥪',
  'pizza': '🍕',
  'pizzas': '🍕',
  'ensalada': '🥗',
  'ensaladas': '🥗',
  'sopa': '🍜',
  'sopas': '🍜',
  'caldos': '🍜',
  'tacos': '🌮',
  'burger': '🌮',
  'hamburguesas': '🌮',
  'bebida': '🥤',
  'bebidas': '🥤',
  'jugos': '🥤',
  'refrescos': '🥤',
  'zumos': '🥤',
  'dulces': '🍬',
  'golosinas': '🍬',
  'helados': '🍦',
  'cervezas': '🍺',
  'cerveza': '🍺'
}

// Pool para categorías nuevas sin sinónimo: cada nombre recibe siempre el
// mismo icono estable, distinto del 🍴 de la pestaña "Todas".
const POOL = ['🥨', '🥪', '🍕', '🌮', '🥗', '🍜', '🧁', '🍩', '🍢', '🥟', '🥤', '🍬', '🍦', '🌯']

// Mayúsculas y tildes no deberían cambiar el icono: "Bebidas frías" debe
// resolver igual que "Bebidas frias".
const normalizar = (texto) =>
  (texto ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()

const iconoPorNombre = (clave) => {
  let suma = 0
  for (let i = 0; i < clave.length; i++) suma += clave.charCodeAt(i)
  return POOL[suma % POOL.length]
}

export const iconoCategoria = (categoria) => {
  const clave = normalizar(categoria)
  if (!clave) return '🍴'
  return ICONOS[clave] ?? SINONIMOS[clave] ?? iconoPorNombre(clave)
}
