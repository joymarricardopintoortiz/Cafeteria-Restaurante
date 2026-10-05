<script setup>
import { computed } from 'vue'
import { formatoMoneda, minutosDesde, textoDuracion } from '../utils/format.js'
import { subtotalCuenta, unidadesCuenta } from '../utils/cuentas.js'

const props = defineProps({
  mesa: { type: Object, required: true },
  cuenta: { type: Object, default: null },
  ahora: { type: Number, required: true }
})

const emit = defineEmits(['editar'])

const ocupada = computed(() => props.cuenta !== null)
const fueraDeServicio = computed(() => props.mesa.disponibilidad === 'fuera de servicio' && !ocupada.value)
const total = computed(() => (props.cuenta ? subtotalCuenta(props.cuenta) : 0))
const unidades = computed(() => (props.cuenta ? unidadesCuenta(props.cuenta) : 0))
const tiempo = computed(() =>
  props.cuenta ? textoDuracion(minutosDesde(props.cuenta.abiertaAt, props.ahora)) : ''
)
const descripcion = computed(() =>
  fueraDeServicio.value
    ? `Mesa ${props.mesa.numero}, fuera de servicio, bloqueada`
    : ocupada.value
      ? `Mesa ${props.mesa.numero}, ocupada, ${formatoMoneda(total.value)}`
      : `Mesa ${props.mesa.numero}, libre, para ${props.mesa.capacidad} personas`
)
</script>

<template>
  <router-link
    v-if="!fueraDeServicio || ocupada"
    :to="{ name: 'mesa', params: { id: mesa.id } }"
    class="mesa-link"
    :aria-label="descripcion"
  >
    <article class="mesa" :class="ocupada ? 'mesa--ocupada' : 'mesa--libre'">
      <div class="mesa__cabecera">
        <div>
          <div class="mesa__rotulo">Mesa</div>
          <div class="mesa__numero">{{ mesa.numero }}</div>
        </div>
        <div class="mesa__acciones-cabecera">
          <span class="estado">
            <q-icon :name="ocupada ? 'local_cafe' : 'event_seat'" size="16px" />
            {{ ocupada ? 'Ocupada' : mesa.disponibilidad === 'fuera de servicio' ? 'Fuera de servicio' : 'Libre' }}
          </span>
          <q-btn
            flat
            round
            dense
            icon="edit"
            size="sm"
            color="primary"
            :disable="ocupada"
            :aria-label="`Editar mesa ${mesa.numero}`"
            @click.prevent.stop="emit('editar', mesa)"
          />
        </div>
      </div>

      <div v-if="ocupada" class="mesa__cuerpo">
        <div class="mesa__total">{{ formatoMoneda(total) }}</div>
        <div class="mesa__detalle">
          {{ unidades ? `${unidades} ${unidades === 1 ? 'producto' : 'productos'}` : 'Sin productos aún' }}
        </div>
        <div class="mesa__detalle">Abierta hace {{ tiempo }}</div>
      </div>

      <div v-else class="mesa__cuerpo">
        <div class="mesa__detalle">Para {{ mesa.capacidad }} personas</div>
        <div class="mesa__detalle">Toca para tomar el pedido</div>
      </div>
    </article>
  </router-link>

  <div v-else class="mesa-link mesa-link--bloqueada" :aria-label="descripcion" aria-disabled="true">
    <article class="mesa mesa--fuera">
      <div class="mesa__cabecera">
        <div>
          <div class="mesa__rotulo">Mesa</div>
          <div class="mesa__numero">{{ mesa.numero }}</div>
        </div>
        <div class="mesa__acciones-cabecera">
          <span class="estado">
            <q-icon name="block" size="16px" />
            Fuera de servicio
          </span>
          <q-btn
            flat
            round
            dense
            icon="edit"
            size="sm"
            color="primary"
            :disable="ocupada"
            :aria-label="`Editar mesa ${mesa.numero}`"
            @click.prevent.stop="emit('editar', mesa)"
          />
        </div>
      </div>

      <div class="mesa__cuerpo">
        <div class="mesa__detalle">Mesa bloqueada</div>
        <div class="mesa__detalle">No se puede tomar pedido</div>
      </div>
    </article>
  </div>
</template>