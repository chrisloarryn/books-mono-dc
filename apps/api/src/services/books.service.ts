import { Errors as MoleculerErrors, Context } from 'moleculer';
import dotenv from 'dotenv';
import { LibraryBook } from '../models/LibraryBook';
import { LastSearch } from '../models/LastSearch';
import { fetchImageAsBase64 } from '../utils/image';
import { mapDocsToItems, searchBooksRaw } from '../utils/openLibrary';
import { loadEnv } from '../utils/env';
import { normalizeRating } from '../utils/validation';

dotenv.config();
const env = loadEnv();

/**
 * Books service.
 *
 * Encapsulates actions for searching OpenLibrary and managing the user's library.
 */
const BooksService = {
  name: 'books',
  actions: {
    /**
     * Search books in OpenLibrary and annotate with local library info.
     */
    async search(this: any, ctx: Context<{ q?: string }>) {
      const q = String(ctx.params.q || '').trim();
      this.logger.info(`[GET] /api/books/search q="${q}"`);
      if (!q) return { q, results: [], saved: [] };
      try {
        await LastSearch.create({ term: q });
        const docs = await searchBooksRaw(q);
        const items = mapDocsToItems(docs);
        const workKeys = items.map((i) => i.workKey).filter(Boolean);
        const saved = await LibraryBook.find({ workKey: { $in: workKeys } }).select('_id workKey').lean();
        const savedMap = new Map<string, string>();
        for (const s of saved) {
          if ((s as any).workKey) savedMap.set((s as any).workKey, String((s as any)._id));
        }
        const results = items.map((it) => {
          const coverFromLibraryId = savedMap.get(it.workKey);
          const coverUrl = coverFromLibraryId
            ? `${env.API_BASE_URL}/api/books/library/front-cover/${coverFromLibraryId}`
            : it.openLibraryCoverUrl;
          return {
            workKey: it.workKey,
            title: it.title,
            authors: it.authors,
            year: it.year,
            coverUrl,
            inLibrary: Boolean(coverFromLibraryId),
            libraryId: coverFromLibraryId || null,
          };
        });
        return { q, results };
      } catch (err: any) {
        this.logger.error('Error in /books/search:', err?.message || err);
        throw new MoleculerErrors.MoleculerError('Failed to search books', 500, 'SEARCH_ERROR');
      }
    },

    /**
     * Returns last 5 search terms.
     */
    async lastSearch(this: any) {
      this.logger.info(`[GET] /api/books/last-search`);
      try {
        const terms = await LastSearch.find({}).sort({ createdAt: -1 }).limit(5).lean();
        return { last5: terms.map((t: any) => t.term) };
      } catch (err: any) {
        this.logger.error('Error in /books/last-search:', err?.message || err);
        throw new MoleculerErrors.MoleculerError('Failed to fetch last searches', 500, 'LAST_SEARCH_ERROR');
      }
    },

    /**
     * Create a new library entry.
     */
    async create(this: any, ctx: Context<any>) {
      this.logger.info(`[POST] /api/books/my-library body keys: ${Object.keys(ctx.params || {}).join(',')}`);
      try {
        const { workKey, title, authors, year, review, rating, coverBase64, coverUrl } = ctx.params || {};
        if (!title) throw new MoleculerErrors.MoleculerClientError('title is required', 400, 'VALIDATION_ERROR');
        if (review && String(review).length > 500) {
          throw new MoleculerErrors.MoleculerClientError('review must be <= 500 characters', 400, 'VALIDATION_ERROR');
        }
        const normRating = normalizeRating(rating);
        let base64 = String(coverBase64 || '');
        let mimeType = 'image/jpeg';
        if (!base64 && coverUrl) {
          const img = await fetchImageAsBase64(coverUrl);
          base64 = img.base64;
          mimeType = img.mimeType || mimeType;
        }
        if (!base64) throw new MoleculerErrors.MoleculerClientError('coverBase64 or coverUrl is required', 400, 'VALIDATION_ERROR');
        const doc = await LibraryBook.create({
          workKey,
          title,
          authors: Array.isArray(authors) ? authors : [],
          year,
          review: review ? String(review) : '',
          rating: normRating,
          coverBase64: base64,
          coverMimeType: mimeType,
        });
        this.logger.info(`[POST] saved book ${doc._id} (${doc.title})`);
        return { id: (doc as any)._id, message: 'Libro guardado con éxito' };
      } catch (err: any) {
        const msg = err?.message || 'Failed to save book';
        this.logger.error('Error in POST /books/my-library:', msg);
        if (msg.includes('Rating must be between')) {
          throw new MoleculerErrors.MoleculerClientError(msg, 400, 'VALIDATION_ERROR');
        }
        if (err instanceof MoleculerErrors.MoleculerError) throw err;
        throw new MoleculerErrors.MoleculerError('Failed to save book', 500, 'SAVE_ERROR');
      }
    },

    /**
     * List library items with optional filters.
     */
    async list(this: any, ctx: Context<{ q?: string; sortRating?: string; excludeNoReview?: string }>) {
      this.logger.info(`[GET] /api/books/my-library query:`, ctx.params);
      try {
        const q = String(ctx.params.q || '').trim().toLowerCase();
        const sortRating = String(ctx.params.sortRating || '').toLowerCase();
        const excludeNoReview = String(ctx.params.excludeNoReview || '').toLowerCase() === 'true';
        const filter: any = {};
        if (q) {
          filter.$or = [
            { title: { $regex: q, $options: 'i' } },
            { authors: { $elemMatch: { $regex: q, $options: 'i' } } },
          ];
        }
        if (excludeNoReview) {
          filter.review = { $exists: true, $ne: '' };
        }
        const sort: any = {};
        if (sortRating === 'asc') sort.rating = 1;
        if (sortRating === 'desc') sort.rating = -1;
        const books = await LibraryBook.find(filter)
          .select('workKey title authors year review rating')
          .sort(sort)
          .lean();
        const items = books.map((b: any) => ({
          id: b._id,
          workKey: b.workKey,
          title: b.title,
          authors: b.authors,
          year: b.year,
          review: b.review,
          rating: b.rating,
          coverUrl: `${env.API_BASE_URL}/api/books/library/front-cover/${b._id}`,
        }));
        return { items };
      } catch (err: any) {
        this.logger.error('Error in GET /books/my-library:', err?.message || err);
        throw new MoleculerErrors.MoleculerError('Failed to list library', 500, 'LIST_ERROR');
      }
    },

    /**
     * Get a single library item by ID.
     */
    async get(this: any, ctx: Context<{ id: string }>) {
      const { id } = ctx.params;
      this.logger.info(`[GET] /api/books/my-library/${id}`);
      try {
        const b = await LibraryBook.findById(id)
          .select('workKey title authors year review rating')
          .lean();
        if (!b) throw new MoleculerErrors.MoleculerClientError('Not found', 404, 'NOT_FOUND');
        return {
          id: (b as any)._id,
          workKey: (b as any).workKey,
          title: (b as any).title,
          authors: (b as any).authors,
          year: (b as any).year,
          review: (b as any).review,
          rating: (b as any).rating,
          coverUrl: `${env.API_BASE_URL}/api/books/library/front-cover/${(b as any)._id}`,
        };
      } catch (err: any) {
        if (err instanceof MoleculerErrors.MoleculerError) throw err;
        this.logger.error('Error in GET /books/my-library/:id', err?.message || err);
        throw new MoleculerErrors.MoleculerError('Failed to get book', 500, 'GET_ERROR');
      }
    },

    /**
     * Update a library item.
     */
    async update(this: any, ctx: Context<{ id: string; review?: string; rating?: number }>) {
      const { id } = ctx.params;
      this.logger.info(`[PUT] /api/books/my-library/${id}`);
      try {
        const { review, rating } = (ctx.params || ({} as any)) as any;
        if (review && String(review).length > 500) {
          throw new MoleculerErrors.MoleculerClientError('review must be <= 500 characters', 400, 'VALIDATION_ERROR');
        }
        const update: any = {};
        if (review !== undefined) update.review = String(review);
        if (rating !== undefined) update.rating = normalizeRating(rating as any);
        const b = await LibraryBook.findByIdAndUpdate(id, update, { new: true });
        if (!b) throw new MoleculerErrors.MoleculerClientError('Not found', 404, 'NOT_FOUND');
        return { message: 'Actualizado con éxito' };
      } catch (err: any) {
        const msg = err?.message || 'Failed to update book';
        this.logger.error('Error in PUT /books/my-library/:id', msg);
        if (msg.includes('Rating must be between')) {
          throw new MoleculerErrors.MoleculerClientError(msg, 400, 'VALIDATION_ERROR');
        }
        if (err instanceof MoleculerErrors.MoleculerError) throw err;
        throw new MoleculerErrors.MoleculerError('Failed to update book', 500, 'UPDATE_ERROR');
      }
    },

    /**
     * Remove a library item.
     */
    async remove(this: any, ctx: Context<{ id: string }>) {
      const { id } = ctx.params;
      this.logger.info(`[DELETE] /api/books/my-library/${id}`);
      try {
        const b = await LibraryBook.findByIdAndDelete(id);
        if (!b) throw new MoleculerErrors.MoleculerClientError('Not found', 404, 'NOT_FOUND');
        return { message: 'Eliminado con éxito' };
      } catch (err: any) {
        if (err instanceof MoleculerErrors.MoleculerError) throw err;
        this.logger.error('Error in DELETE /books/my-library/:id', err?.message || err);
        throw new MoleculerErrors.MoleculerError('Failed to delete book', 500, 'DELETE_ERROR');
      }
    },

    /**
     * Serve front cover image by book ID.
     */
    async frontCover(this: any, ctx: Context<{ id: string }, { $responseType?: string; $responseHeaders?: Record<string, string> }>) {
      const { id } = ctx.params;
      this.logger.info(`[GET] /api/books/library/front-cover/${id}`);
      try {
        const b: any = await LibraryBook.findById(id)
          .select('coverBase64 coverMimeType')
          .lean();
        if (!b) throw new MoleculerErrors.MoleculerClientError('Not found', 404, 'NOT_FOUND');
        const img = Buffer.from((b as any).coverBase64, 'base64');
        ctx.meta.$responseType = (b as any).coverMimeType || 'image/jpeg';
        ctx.meta.$responseHeaders = { 'Cache-Control': 'public, max-age=604800, immutable' };
        return img;
      } catch (err: any) {
        if (err instanceof MoleculerErrors.MoleculerError) throw err;
        this.logger.error('Error in GET /books/library/front-cover/:id', err?.message || err);
        throw new MoleculerErrors.MoleculerError('Failed to serve image', 500, 'IMAGE_ERROR');
      }
    },
  },
};

export default BooksService;
