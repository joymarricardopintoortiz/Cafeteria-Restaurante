const ICONOS = {
  'Bebidas calientes': '☕',
  'Bebidas frias': '🧋',
  'Panaderia': '🥐',
  'Almuerzos': '🍽️',
  'Postres': '🍰'
}

export const iconoCategoria = (categoria) => ICONOS[categoria] ?? '🍴'
