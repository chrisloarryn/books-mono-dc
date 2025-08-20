<template>
  <div>
    <library-library-filters
      :q="store.q"
      :sort-rating="store.sortRating"
      :exclude-no-review="store.excludeNoReview"
      @update:q="(v) => (store.q = v)"
      @update:sortRating="(v) => (store.sortRating = v)"
      @update:excludeNoReview="(v) => (store.excludeNoReview = v)"
      @apply="applyFilters"
      @reset="resetFilters"
    />

    <div v-if="store.loading" class="helper">Cargando...</div>
    <div v-if="!store.loading && !store.items.length" class="helper">No hay libros en tu biblioteca.</div>

    <div class="grid cols-3" v-if="!store.loading && store.items.length">
      <library-library-item-card
        v-for="b in store.items"
        :key="b.id"
        :item="b"
        :edit-id="editId"
        :edit-review="editReview"
        :edit-rating="editRating"
        :is-saving="isSaving"
        :max-review-chars="MAX_REVIEW_CHARS"
        :error-message="error"
        :success-message="message"
        @startEdit="startEdit"
        @cancelEdit="cancelEdit"
        @save="saveEdit"
        @remove="remove"
        @update:editReview="(v) => (editReview = v)"
        @update:editRating="(v) => (editRating = v)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLibraryStore } from '@/stores/library';
import type { LibraryItem } from '@/stores/library';
import { MAX_REVIEW_CHARS } from '@/constants';

const store = useLibraryStore();
const editId = ref<string | null>(null);
const editReview = ref<string>('');
const editRating = ref<number>(3);
const isSaving = ref(false);
const error = ref('');
const message = ref('');

onMounted(() => {
  store.fetch();
});

function applyFilters() {
  store.fetch();
}

function resetFilters() {
  store.q = '';
  store.sortRating = '';
  store.excludeNoReview = false;
  store.fetch();
}

function startEdit(b: LibraryItem) {
  editId.value = b.id;
  editReview.value = b.review || '';
  editRating.value = b.rating || 3;
  error.value = '';
  message.value = '';
}

function cancelEdit() {
  editId.value = null;
}

async function saveEdit(id: string) {
  error.value = '';
  message.value = '';
  if ((editReview.value || '').length > MAX_REVIEW_CHARS) {
    error.value = `La review no puede superar ${MAX_REVIEW_CHARS} caracteres`;
    return;
  }
  isSaving.value = true;
  try {
    await store.update(id, editReview.value, editRating.value);
    message.value = 'Guardado con éxito';
    editId.value = null;
  } catch (e: unknown) {
    const maybe = e as { data?: { error?: string } };
    error.value = maybe?.data?.error || 'No se pudo actualizar';
  } finally {
    isSaving.value = false;
  }
}

async function remove(b: LibraryItem) {
  const ok = confirm(`¿Eliminar "${b.title}" de forma permanente?`);
  if (!ok) return;
  await store.remove(b.id);
}
</script>
