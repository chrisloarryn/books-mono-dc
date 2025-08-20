import { defineStore } from 'pinia';
import { useApi } from '@/composables/useApi';

export interface LibraryItem {
  id: string;
  workKey?: string;
  title: string;
  authors: string[];
  year?: number;
  review?: string;
  rating?: number;
  coverUrl: string;
}

export const useLibraryStore = defineStore('library', {
  state: () => ({
    items: [] as LibraryItem[],
    q: '' as string,
    sortRating: '' as 'asc' | 'desc' | '',
    excludeNoReview: false,
    loading: false,
    error: '' as string,
  }),
  actions: {
    async fetch() {
      this.loading = true;
      this.error = '';
      const { apiFetch } = useApi();
      try {
        const params = new URLSearchParams();
        if (this.q) params.set('q', this.q);
        if (this.sortRating) params.set('sortRating', this.sortRating);
        if (this.excludeNoReview) params.set('excludeNoReview', 'true');
        const data = await apiFetch<{ items: LibraryItem[] }>(`/books/my-library${params.toString() ? `?${params.toString()}` : ''}`);
        this.items = data.items || [];
      } catch (e) {
        this.error = 'No se pudo cargar la biblioteca';
        console.error('Library fetch error', e);
      } finally {
        this.loading = false;
      }
    },
    async update(id: string, review?: string, rating?: number) {
      const { apiFetch } = useApi();
      await apiFetch(`/books/my-library/${id}`, {
        method: 'PUT',
        body: { review, rating },
      });
      // Refresh
      await this.fetch();
    },
    async remove(id: string) {
      const { apiFetch } = useApi();
      await apiFetch(`/books/my-library/${id}`, { method: 'DELETE' });
      this.items = this.items.filter((i) => i.id !== id);
    }
  }
});
