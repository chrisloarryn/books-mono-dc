import { defineStore } from 'pinia';
import { useApi } from '@/composables/useApi';

export interface SearchItem {
  workKey: string;
  title: string;
  authors: string[];
  year?: number;
  coverUrl?: string;
  inLibrary?: boolean;
  libraryId?: string | null;
}

export const useSearchStore = defineStore('search', {
  state: () => ({
    q: '' as string,
    results: [] as SearchItem[],
    lastSearches: [] as string[],
    selected: null as SearchItem | null,
    loading: false as boolean,
    error: '' as string,
  }),
  actions: {
    async loadLastSearches() {
      const { apiFetch } = useApi();
      try {
        const data = await apiFetch<{ last5: string[] }>(`/books/last-search`);
        this.lastSearches = data.last5 || [];
      } catch (e) {
        console.error('Failed to load last searches', e);
      }
    },
    async search(q: string) {
      this.q = q;
      this.loading = true;
      this.error = '';
      const { apiFetch } = useApi();
      try {
        const data = await apiFetch<{ q: string; results: SearchItem[] }>(`/books/search?q=${encodeURIComponent(q)}`);
        this.results = data.results || [];
        if (q && !this.lastSearches.includes(q)) {
          // Refresh last searches after querying to include latest saved term
          await this.loadLastSearches();
        }
      } catch (e: unknown) {
        this.error = 'Ocurrió un error al buscar libros';
        console.error('Search error', e);
      } finally {
        this.loading = false;
      }
    },
    select(item: SearchItem) {
      this.selected = item;
    },
    clearSelection() {
      this.selected = null;
    }
  }
});
