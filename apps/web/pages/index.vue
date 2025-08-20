<template>
  <div>
    <section class="center" v-if="!hasSearched">
      <div style="width:min(640px, 100%);">
        <h1 style="text-align:center; margin-bottom:18px;">Busca un libro</h1>
        <div class="card" style="padding:18px;">
          <form @submit.prevent="onSearch">
            <input v-model="q" class="input" :placeholder="placeholder" />
            <div style="display:flex; gap:10px; justify-content:center; margin-top:14px;">
              <button class="button" type="submit">Buscar</button>
            </div>
          </form>
          <div v-if="lastSearches.length" style="margin-top:16px;">
            <div class="helper" style="margin-bottom:6px;">Últimas búsquedas</div>
            <div style="display:flex; gap:8px; flex-wrap:wrap;">
              <button v-for="term in lastSearches" :key="term" class="button secondary" @click="useTerm(term)">{{ term }}</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section v-else>
      <div class="card" style="margin-bottom:16px;">
        <form @submit.prevent="onSearch" style="display:flex; gap:10px;">
          <input v-model="q" class="input" :placeholder="placeholder" />
          <button class="button" type="submit">Buscar</button>
          <button class="button secondary" type="button" @click="resetSearch">Nueva búsqueda</button>
        </form>
      </div>

      <div v-if="loading" class="helper">Buscando...</div>
      <div v-if="!loading && results.length === 0" class="helper">no encontramos libros con el título ingresado</div>

      <div class="grid cols-3" v-if="!loading && results.length">
        <search-search-result-card
          v-for="r in results"
          :key="r.workKey"
          :item="r"
          @select="select"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useSearchStore, type SearchItem } from '@/stores/search';

const placeholder = 'Escribe el nombre de un Libro para continuar';
const store = useSearchStore();
const { results, lastSearches, loading } = storeToRefs(store);
const q = ref('');
const hasSearched = computed(() => store.q.length > 0);

onMounted(() => {
  store.loadLastSearches();
});

function useTerm(term: string) {
  q.value = term;
  onSearch();
}

function resetSearch() {
  store.q = '';
  store.results = [];
}

async function onSearch() {
  if (!q.value.trim()) return;
  await store.search(q.value.trim());
}

function select(item: SearchItem) {
  store.select(item);
  const query: Record<string, string> = {
    workKey: item.workKey,
    title: item.title,
    authors: (item.authors || []).join('|'),
    year: item.year ? String(item.year) : '',
    coverUrl: item.coverUrl ?? '',
  };
  navigateTo({ path: '/book', query });
}
</script>
