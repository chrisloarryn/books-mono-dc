<template>
  <div class="card" style="display:flex; gap:12px; align-items:flex-start;">
    <ImgWithLoader :src="item.coverUrl" alt="Portada" class="cover" width="86" height="120" />
    <div style="flex:1;">
      <div style="font-weight:600;">{{ item.title }}</div>
      <div class="helper">{{ item.authors.join(', ') }}</div>
      <div class="helper" v-if="item.year">Año: {{ item.year }}</div>
      <div class="helper" v-if="item.rating">Calificación: {{ item.rating }}</div>
      <div class="helper" v-if="item.review">"{{ item.review }}"</div>

      <div v-if="editId !== item.id" style="margin-top:10px; display:flex; gap:8px;">
        <button class="button" @click="onStartEdit">Editar</button>
        <button class="button danger" @click="onRemove">Eliminar</button>
      </div>

      <div v-else class="card" style="margin-top:10px;">
        <label>Editar review</label>
        <textarea :value="editReview" @input="onEditReview" class="input" rows="4" :maxlength="maxReviewChars" />
        <label style="margin-top:8px;">Calificación: {{ editRating }}</label>
        <input type="range" min="1" max="5" step="1" :value="editRating" @input="onEditRating" />
        <div class="helper" style="text-align:right;">{{ (editReview || '').length }}/{{ maxReviewChars }}</div>
        <div style="margin-top:10px; display:flex; gap:8px;">
          <button class="button" :disabled="isSaving" @click="onSave">Guardar</button>
          <button class="button secondary" type="button" @click="onCancel">Cancelar</button>
        </div>
        <div v-if="errorMessage" class="helper" style="color:#ff5252; margin-top:8px;">{{ errorMessage }}</div>
        <div v-if="successMessage" class="helper" style="color:#8bc34a; margin-top:8px;">{{ successMessage }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * LibraryItemCard component
 *
 * Presentational card for a library item with optional inline edit section.
 * It is controlled by the parent via props/v-model and emits user actions.
 */
import type { LibraryItem } from '@/stores/library';

const props = defineProps<{
  item: LibraryItem;
  editId: string | null;
  editReview: string;
  editRating: number;
  isSaving: boolean;
  maxReviewChars: number;
  errorMessage?: string;
  successMessage?: string;
}>();

const emit = defineEmits<{
  (e: 'startEdit', item: LibraryItem): void;
  (e: 'cancelEdit'): void;
  (e: 'save', id: string): void;
  (e: 'remove', item: LibraryItem): void;
  (e: 'update:editReview', value: string): void;
  (e: 'update:editRating', value: number): void;
}>();

function onStartEdit() {
  emit('startEdit', props.item);
}

function onCancel() {
  emit('cancelEdit');
}

function onSave() {
  emit('save', props.item.id);
}

function onRemove() {
  emit('remove', props.item);
}

function onEditReview(ev: Event) {
  emit('update:editReview', (ev.target as HTMLTextAreaElement).value);
}

function onEditRating(ev: Event) {
  const val = Number((ev.target as HTMLInputElement).value);
  emit('update:editRating', Number.isFinite(val) ? val : 3);
}
</script>
