<template>
  <div class="card" style="display:flex; gap:12px; align-items:flex-start;">
    <ImgWithLoader :src="item.coverUrl" alt="Portada" class="cover" width="86" height="120" />
    <div style="flex:1;">
      <div style="font-weight:600;">{{ item.title }}</div>
      <div class="helper">{{ (item.authors || []).join(', ') }}</div>
      <div class="helper" v-if="item.year">Año: {{ item.year }}</div>
      <div style="margin-top:10px; display:flex; gap:8px;">
        <button class="button" @click="onSelect">Seleccionar</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * SearchResultCard component
 *
 * Displays a single book search result and emits select when user chooses it.
 */
import type { SearchItem } from '@/stores/search';

const props = defineProps<{
  item: SearchItem;
}>();

const emit = defineEmits<{
  (e: 'select', item: SearchItem): void;
}>();

function onSelect() {
  emit('select', props.item);
}
</script>
