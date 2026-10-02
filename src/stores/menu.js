import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { crearId } from '../utils/id'

const productosIniciales = [
    { nombre: 'Cafe americano', categoria: 'Bebidas calientes', precio: 4500 },
    { nombre: 'Capuchino', categoria: 'Bebidas calientes', precio: 7500 },
    { nombre: 'Chocolate caliente', categoria: 'Bebidas calientes', precio: 7000},
    { nombre: 'Aromatica', categoria: 'Bebidas calientes', precio: 3500 },
    { nombre: 'Limonada natural', categoria: 'Bebidas frias', precio: 6000 },
    { nombre: 'Jugo de naranja', categoria: 'Bebidas frias', precio: 7000 },
    { nombre: 'Te helado', categoria: 'Bebidas frias', precio: 5500 },
    { nombre: 'Cafe frio', categoria: 'Bebidas frias', precio: 8500 },
    { nombre: 'Croissant', categoria: 'Panaderia', precio: 5500 },
    { nombre: 'Pan de bono', categoria: 'Panaderia', precio: 3000 },
    { nombre: 'Sandwich de jamon y queso', categoria: 'Panaderia', precio: 12000 },
    { nombre: 'Bandeja del dia', categoria: 'Almuerzos', precio: 22000 },
    { nombre: 'Hamburguesa de la casa', categoria: 'Almuerzos', precio: 24000 },
    { nombre: 'Ensalada de pollo', categoria: 'Almuerzos', precio: 18000 },
    { nombre: 'Torta de chocolate', categoria: 'Postres', precio: 18000 },
    { nombre: 'Cheesecake de mora', categoria: 'Postres', precio: 10500 }
]

export const useMenuStore = defineStore(
    'menu',
    () => {
        const productos = ref(
            productosIniciales.map((producto) => ({ id: crearId(), disponible: true, ...producto }))
        )

        const categorias = computed(() => [...new Set(productos.value.map((p) => p.categoria))])
        const agotados = computed(() => productos.value.filter((p) => !p.disponible))

        const porId = (id) => productos.value.find((p) => p.id === id)

        function agregar(datos) {
            productos.value.push({ id: crearId(), ...datos })
        }

        function actualizar(id, datos) {
            const producto = porId(id)
            if (producto) Object.assign(producto, datos)
        }

        function alternarDisponibilidad(id) {
            const producto = porId(id)
            if (producto) producto.disponible = !producto.disponible
        }

        function eliminar(id) {
            productos.value = productos.value.filter((p) => p.id !== id)
        }

        return {
            productos, categorias, agotados, porId, agregar,
            actualizar, alternarDisponibilidad, eliminar
        }
    },
    { persist: true }
)