<template>
  <div class="card" style="margin-bottom:16px;">
    <form @submit.prevent="onApply" style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
      <input :value="q" @input="onInputQ" class="input" placeholder="Buscar por título o autor" />
      <select :value="sortRating" @change="onChangeSort" class="input" style="max-width:200px;">
        <option value="">Ordenar por calificación</option>
        <option value="asc">Calificación ascendente</option>
        <option value="desc">Calificación descendente</option>
      </select>
      <label style="display:flex; align-items:center; gap:8px;">
        <input type="checkbox" :checked="excludeNoReview" @change="onToggleExclude" />
        Excluir sin review
      </label>
      <button class="button" type="submit">Aplicar</button>
      <button class="button secondary" type="button" @click="onReset">Limpiar</button>
    </form>
  </div>
</template>

<script setup lang="ts">
/**
 * LibraryFilters component
 *
 * Controlled filters toolbar for the Library page.
 * Uses explicit props and emits to support multiple v-model bindings.
 */

export type SortRating = 'asc' | 'desc' | '';

const props = defineProps<{
  q: string;
  sortRating: SortRating;
  excludeNoReview: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:q', value: string): void;
  (e: 'update:sortRating', value: SortRating): void;
  (e: 'update:excludeNoReview', value: boolean): void;
  (e: 'apply'): void;
  (e: 'reset'): void;
}>();

function onInputQ(ev: Event) {
  const value = (ev.target as HTMLInputElement).value;
  emit('update:q', value);
}

function onChangeSort(ev: Event) {
  const value = (ev.target as HTMLSelectElement).value as SortRating;
  emit('update:sortRating', value);
}

function onToggleExclude(ev: Event) {
  const checked = (ev.target as HTMLInputElement).checked;
  emit('update:excludeNoReview', checked);
}

function onApply() {
  emit('apply');
}

function onReset() {
  emit('reset');
}
</script>
