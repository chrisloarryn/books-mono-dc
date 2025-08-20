<template>
  <div>
    <div class="card" style="display:flex; gap:16px;">
      <ImgWithLoader :src="coverUrl" class="cover" alt="Portada" width="120" height="168" />
      <div style="flex:1;">
        <h2>{{ title }}</h2>
        <div class="helper">{{ authors.join(', ') }}</div>
        <div class="helper" v-if="year">Año: {{ year }}</div>
      </div>
    </div>

    <div class="grid cols-2" style="margin-top:16px;">
      <div class="card">
        <label for="review">Tu review (máx. {{ MAX_REVIEW_CHARS }} caracteres)</label>
        <textarea id="review" v-model="review" class="input" rows="8" :maxlength="MAX_REVIEW_CHARS" placeholder="Escribe tu review..." />
        <div class="helper" style="text-align:right;">{{ review.length }}/{{ MAX_REVIEW_CHARS }}</div>
      </div>

      <div class="card">
        <label for="rating">Calificación: {{ rating }}</label>
        <input id="rating" type="range" min="1" max="5" step="1" v-model.number="rating" />
        <div style="margin-top:12px;">
          <button class="button" :disabled="isSaving" @click="save">Guardar en mi biblioteca</button>
        </div>
        <div v-if="message" class="helper" style="margin-top:10px; color:#8bc34a;">{{ message }}</div>
        <div v-if="error" class="helper" style="margin-top:10px; color:#ff5252;">{{ error }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router';
import { useApi } from '@/composables/useApi';
import { MAX_REVIEW_CHARS } from '@/constants';

const route = useRoute();
const { apiFetch } = useApi();

const workKey = computed(() => String(route.query.workKey || ''));
const title = computed(() => String(route.query.title || ''));
const authors = computed(() => String(route.query.authors || '').split('|').filter(Boolean));
const year = computed(() => {
  const y = Number(route.query.year || '');
  return Number.isFinite(y) && y > 0 ? y : undefined;
});
const coverUrl = computed(() => String(route.query.coverUrl || ''));

const review = ref('');
const rating = ref(3);
const isSaving = ref(false);
const message = ref('');
const error = ref('');

async function save() {
  message.value = '';
  error.value = '';
  if (review.value.length > MAX_REVIEW_CHARS) {
    error.value = `La review no puede superar ${MAX_REVIEW_CHARS} caracteres`;
    return;
  }
  isSaving.value = true;
  try {
    const body = {
      workKey: workKey.value || undefined,
      title: title.value,
      authors: authors.value,
      year: year.value,
      review: review.value,
      rating: rating.value,
      coverUrl: coverUrl.value || undefined,
    };
    const res = await apiFetch<{ id: string; message: string }>(`/books/my-library`, {
      method: 'POST',
      body,
    });
    message.value = res?.message || 'Libro guardado con éxito';
    // Optionally navigate to library
    // await navigateTo('/library');
  } catch (e: unknown) {
    const maybe = e as { data?: { error?: string } };
    error.value = maybe?.data?.error || 'No se pudo guardar el libro';
    console.error('Save book error', e);
  } finally {
    isSaving.value = false;
  }
}
</script>
