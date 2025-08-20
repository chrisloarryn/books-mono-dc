"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const moleculer_1 = require("moleculer");
const dotenv_1 = __importDefault(require("dotenv"));
const LibraryBook_1 = require("../models/LibraryBook");
const LastSearch_1 = require("../models/LastSearch");
const image_1 = require("../utils/image");
const openLibrary_1 = require("../utils/openLibrary");
const env_1 = require("../utils/env");
const validation_1 = require("../utils/validation");
dotenv_1.default.config();
const env = (0, env_1.loadEnv)();
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
        async search(ctx) {
            const q = String(ctx.params.q || '').trim();
            this.logger.info(`[GET] /api/books/search q="${q}"`);
            if (!q)
                return { q, results: [], saved: [] };
            try {
                await LastSearch_1.LastSearch.create({ term: q });
                const docs = await (0, openLibrary_1.searchBooksRaw)(q);
                const items = (0, openLibrary_1.mapDocsToItems)(docs);
                const workKeys = items.map((i) => i.workKey).filter(Boolean);
                const saved = await LibraryBook_1.LibraryBook.find({ workKey: { $in: workKeys } }).select('_id workKey').lean();
                const savedMap = new Map();
                for (const s of saved) {
                    if (s.workKey)
                        savedMap.set(s.workKey, String(s._id));
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
            }
            catch (err) {
                this.logger.error('Error in /books/search:', err?.message || err);
                throw new moleculer_1.Errors.MoleculerError('Failed to search books', 500, 'SEARCH_ERROR');
            }
        },
        /**
         * Returns last 5 search terms.
         */
        async lastSearch() {
            this.logger.info(`[GET] /api/books/last-search`);
            try {
                const terms = await LastSearch_1.LastSearch.find({}).sort({ createdAt: -1 }).limit(5).lean();
                return { last5: terms.map((t) => t.term) };
            }
            catch (err) {
                this.logger.error('Error in /books/last-search:', err?.message || err);
                throw new moleculer_1.Errors.MoleculerError('Failed to fetch last searches', 500, 'LAST_SEARCH_ERROR');
            }
        },
        /**
         * Create a new library entry.
         */
        async create(ctx) {
            this.logger.info(`[POST] /api/books/my-library body keys: ${Object.keys(ctx.params || {}).join(',')}`);
            try {
                const { workKey, title, authors, year, review, rating, coverBase64, coverUrl } = ctx.params || {};
                if (!title)
                    throw new moleculer_1.Errors.MoleculerClientError('title is required', 400, 'VALIDATION_ERROR');
                if (review && String(review).length > 500) {
                    throw new moleculer_1.Errors.MoleculerClientError('review must be <= 500 characters', 400, 'VALIDATION_ERROR');
                }
                const normRating = (0, validation_1.normalizeRating)(rating);
                let base64 = String(coverBase64 || '');
                let mimeType = 'image/jpeg';
                if (!base64 && coverUrl) {
                    const img = await (0, image_1.fetchImageAsBase64)(coverUrl);
                    base64 = img.base64;
                    mimeType = img.mimeType || mimeType;
                }
                if (!base64)
                    throw new moleculer_1.Errors.MoleculerClientError('coverBase64 or coverUrl is required', 400, 'VALIDATION_ERROR');
                const doc = await LibraryBook_1.LibraryBook.create({
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
                return { id: doc._id, message: 'Libro guardado con éxito' };
            }
            catch (err) {
                const msg = err?.message || 'Failed to save book';
                this.logger.error('Error in POST /books/my-library:', msg);
                if (msg.includes('Rating must be between')) {
                    throw new moleculer_1.Errors.MoleculerClientError(msg, 400, 'VALIDATION_ERROR');
                }
                if (err instanceof moleculer_1.Errors.MoleculerError)
                    throw err;
                throw new moleculer_1.Errors.MoleculerError('Failed to save book', 500, 'SAVE_ERROR');
            }
        },
        /**
         * List library items with optional filters.
         */
        async list(ctx) {
            this.logger.info(`[GET] /api/books/my-library query:`, ctx.params);
            try {
                const q = String(ctx.params.q || '').trim().toLowerCase();
                const sortRating = String(ctx.params.sortRating || '').toLowerCase();
                const excludeNoReview = String(ctx.params.excludeNoReview || '').toLowerCase() === 'true';
                const filter = {};
                if (q) {
                    filter.$or = [
                        { title: { $regex: q, $options: 'i' } },
                        { authors: { $elemMatch: { $regex: q, $options: 'i' } } },
                    ];
                }
                if (excludeNoReview) {
                    filter.review = { $exists: true, $ne: '' };
                }
                const sort = {};
                if (sortRating === 'asc')
                    sort.rating = 1;
                if (sortRating === 'desc')
                    sort.rating = -1;
                const books = await LibraryBook_1.LibraryBook.find(filter)
                    .select('workKey title authors year review rating')
                    .sort(sort)
                    .lean();
                const items = books.map((b) => ({
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
            }
            catch (err) {
                this.logger.error('Error in GET /books/my-library:', err?.message || err);
                throw new moleculer_1.Errors.MoleculerError('Failed to list library', 500, 'LIST_ERROR');
            }
        },
        /**
         * Get a single library item by ID.
         */
        async get(ctx) {
            const { id } = ctx.params;
            this.logger.info(`[GET] /api/books/my-library/${id}`);
            try {
                const b = await LibraryBook_1.LibraryBook.findById(id)
                    .select('workKey title authors year review rating')
                    .lean();
                if (!b)
                    throw new moleculer_1.Errors.MoleculerClientError('Not found', 404, 'NOT_FOUND');
                return {
                    id: b._id,
                    workKey: b.workKey,
                    title: b.title,
                    authors: b.authors,
                    year: b.year,
                    review: b.review,
                    rating: b.rating,
                    coverUrl: `${env.API_BASE_URL}/api/books/library/front-cover/${b._id}`,
                };
            }
            catch (err) {
                if (err instanceof moleculer_1.Errors.MoleculerError)
                    throw err;
                this.logger.error('Error in GET /books/my-library/:id', err?.message || err);
                throw new moleculer_1.Errors.MoleculerError('Failed to get book', 500, 'GET_ERROR');
            }
        },
        /**
         * Update a library item.
         */
        async update(ctx) {
            const { id } = ctx.params;
            this.logger.info(`[PUT] /api/books/my-library/${id}`);
            try {
                const { review, rating } = (ctx.params || {});
                if (review && String(review).length > 500) {
                    throw new moleculer_1.Errors.MoleculerClientError('review must be <= 500 characters', 400, 'VALIDATION_ERROR');
                }
                const update = {};
                if (review !== undefined)
                    update.review = String(review);
                if (rating !== undefined)
                    update.rating = (0, validation_1.normalizeRating)(rating);
                const b = await LibraryBook_1.LibraryBook.findByIdAndUpdate(id, update, { new: true });
                if (!b)
                    throw new moleculer_1.Errors.MoleculerClientError('Not found', 404, 'NOT_FOUND');
                return { message: 'Actualizado con éxito' };
            }
            catch (err) {
                const msg = err?.message || 'Failed to update book';
                this.logger.error('Error in PUT /books/my-library/:id', msg);
                if (msg.includes('Rating must be between')) {
                    throw new moleculer_1.Errors.MoleculerClientError(msg, 400, 'VALIDATION_ERROR');
                }
                if (err instanceof moleculer_1.Errors.MoleculerError)
                    throw err;
                throw new moleculer_1.Errors.MoleculerError('Failed to update book', 500, 'UPDATE_ERROR');
            }
        },
        /**
         * Remove a library item.
         */
        async remove(ctx) {
            const { id } = ctx.params;
            this.logger.info(`[DELETE] /api/books/my-library/${id}`);
            try {
                const b = await LibraryBook_1.LibraryBook.findByIdAndDelete(id);
                if (!b)
                    throw new moleculer_1.Errors.MoleculerClientError('Not found', 404, 'NOT_FOUND');
                return { message: 'Eliminado con éxito' };
            }
            catch (err) {
                if (err instanceof moleculer_1.Errors.MoleculerError)
                    throw err;
                this.logger.error('Error in DELETE /books/my-library/:id', err?.message || err);
                throw new moleculer_1.Errors.MoleculerError('Failed to delete book', 500, 'DELETE_ERROR');
            }
        },
        /**
         * Serve front cover image by book ID.
         */
        async frontCover(ctx) {
            const { id } = ctx.params;
            this.logger.info(`[GET] /api/books/library/front-cover/${id}`);
            try {
                const b = await LibraryBook_1.LibraryBook.findById(id)
                    .select('coverBase64 coverMimeType')
                    .lean();
                if (!b)
                    throw new moleculer_1.Errors.MoleculerClientError('Not found', 404, 'NOT_FOUND');
                const img = Buffer.from(b.coverBase64, 'base64');
                ctx.meta.$responseType = b.coverMimeType || 'image/jpeg';
                ctx.meta.$responseHeaders = { 'Cache-Control': 'public, max-age=604800, immutable' };
                return img;
            }
            catch (err) {
                if (err instanceof moleculer_1.Errors.MoleculerError)
                    throw err;
                this.logger.error('Error in GET /books/library/front-cover/:id', err?.message || err);
                throw new moleculer_1.Errors.MoleculerError('Failed to serve image', 500, 'IMAGE_ERROR');
            }
        },
    },
};
exports.default = BooksService;
