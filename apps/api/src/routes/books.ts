import { Router, Request, Response } from 'express';
import { LibraryBook } from '../models/LibraryBook';
import { LastSearch } from '../models/LastSearch';
import { fetchImageAsBase64 } from '../utils/image';
import { loadEnv } from '../utils/env';
import { mapDocsToItems, searchBooksRaw } from '../utils/openLibrary';

const router = Router();
const env = loadEnv();

// Helper: validate rating
function normalizeRating(r?: any) {
  if (r === undefined || r === null || r === '') return undefined;
  const n = Number(r);
  if (!Number.isFinite(n)) return undefined;
  if (n < 1 || n > 5) throw new Error('Rating must be between 1 and 5');
  return Math.round(n);
}

// GET /api/books/search?q=term
router.get('/books/search', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  console.log(`[GET] /api/books/search q="${q}"`);
  if (!q) {
    return res.json({ q, results: [], saved: [] });
  }
  try {
    // Save last search term
    await LastSearch.create({ term: q });

    const docs = await searchBooksRaw(q);
    const items = mapDocsToItems(docs);

    // Check which items are already in library (by workKey)
    const workKeys = items.map((i) => i.workKey).filter(Boolean);
    const saved = await LibraryBook.find({ workKey: { $in: workKeys } }).select('_id workKey').lean();
    const savedMap = new Map<string, string>();
    for (const s of saved) {
      if (s.workKey) savedMap.set(s.workKey, String(s._id));
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

    res.json({ q, results });
  } catch (err: any) {
    console.error('Error in /books/search:', err?.message || err);
    res.status(500).json({ error: 'Failed to search books' });
  }
});

// GET /api/books/last-search
router.get('/books/last-search', async (_req: Request, res: Response) => {
  console.log(`[GET] /api/books/last-search`);
  try {
    const terms = await LastSearch.find({}).sort({ createdAt: -1 }).limit(5).lean();
    res.json({ last5: terms.map((t) => t.term) });
  } catch (err: any) {
    console.error('Error in /books/last-search:', err?.message || err);
    res.status(500).json({ error: 'Failed to fetch last searches' });
  }
});

// POST /api/books/my-library
router.post('/books/my-library', async (req: Request, res: Response) => {
  console.log(`[POST] /api/books/my-library body keys: ${Object.keys(req.body || {}).join(',')}`);
  try {
    const { workKey, title, authors, year, review, rating, coverBase64, coverUrl } = req.body || {};
    if (!title) return res.status(400).json({ error: 'title is required' });

    if (review && String(review).length > 500) {
      return res.status(400).json({ error: 'review must be <= 500 characters' });
    }

    const normRating = normalizeRating(rating);

    let base64 = String(coverBase64 || '');
    let mimeType = 'image/jpeg';

    if (!base64 && coverUrl) {
      const img = await fetchImageAsBase64(coverUrl);
      base64 = img.base64;
      mimeType = img.mimeType || mimeType;
    }
    if (!base64) return res.status(400).json({ error: 'coverBase64 or coverUrl is required' });

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

    console.log(`[POST] saved book ${doc._id} (${doc.title})`);
    res.status(201).json({ id: doc._id, message: 'Libro guardado con éxito' });
  } catch (err: any) {
    const msg = err?.message || 'Failed to save book';
    console.error('Error in POST /books/my-library:', msg);
    if (msg.includes('Rating must be between')) return res.status(400).json({ error: msg });
    res.status(500).json({ error: 'Failed to save book' });
  }
});

// GET /api/books/my-library
router.get('/books/my-library', async (req: Request, res: Response) => {
  console.log(`[GET] /api/books/my-library query:`, req.query);
  try {
    const q = String(req.query.q || '').trim().toLowerCase();
    const sortRating = String(req.query.sortRating || '').toLowerCase(); // 'asc' | 'desc'
    const excludeNoReview = String(req.query.excludeNoReview || '').toLowerCase() === 'true';

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

    const books = await LibraryBook.find(filter).sort(sort).lean();

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

    res.json({ items });
  } catch (err: any) {
    console.error('Error in GET /books/my-library:', err?.message || err);
    res.status(500).json({ error: 'Failed to list library' });
  }
});

// GET /api/books/my-library/:id
router.get('/books/my-library/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`[GET] /api/books/my-library/${id}`);
  try {
    const b = await LibraryBook.findById(id);
    if (!b) return res.status(404).json({ error: 'Not found' });
    res.json({
      id: b._id,
      workKey: b.workKey,
      title: b.title,
      authors: b.authors,
      year: b.year,
      review: b.review,
      rating: b.rating,
      coverUrl: `${env.API_BASE_URL}/api/books/library/front-cover/${b._id}`,
    });
  } catch (err: any) {
    console.error('Error in GET /books/my-library/:id', err?.message || err);
    res.status(500).json({ error: 'Failed to get book' });
  }
});

// PUT /api/books/my-library/:id
router.put('/books/my-library/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`[PUT] /api/books/my-library/${id}`);
  try {
    const { review, rating } = req.body || {};
    if (review && String(review).length > 500) {
      return res.status(400).json({ error: 'review must be <= 500 characters' });
    }
    const update: any = {};
    if (review !== undefined) update.review = String(review);
    if (rating !== undefined) update.rating = normalizeRating(rating);

    const b = await LibraryBook.findByIdAndUpdate(id, update, { new: true });
    if (!b) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Actualizado con éxito' });
  } catch (err: any) {
    const msg = err?.message || 'Failed to update book';
    console.error('Error in PUT /books/my-library/:id', msg);
    if (msg.includes('Rating must be between')) return res.status(400).json({ error: msg });
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// DELETE /api/books/my-library/:id
router.delete('/books/my-library/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`[DELETE] /api/books/my-library/${id}`);
  try {
    const b = await LibraryBook.findByIdAndDelete(id);
    if (!b) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Eliminado con éxito' });
  } catch (err: any) {
    console.error('Error in DELETE /books/my-library/:id', err?.message || err);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

// GET /api/books/library/front-cover/:id
router.get('/books/library/front-cover/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  console.log(`[GET] /api/books/library/front-cover/${id}`);
  try {
    const b = await LibraryBook.findById(id);
    if (!b) return res.status(404).send('Not found');
    const img = Buffer.from(b.coverBase64, 'base64');
    res.setHeader('Content-Type', b.coverMimeType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.send(img);
  } catch (err: any) {
    console.error('Error in GET /books/library/front-cover/:id', err?.message || err);
    res.status(500).send('Failed to serve image');
  }
});

export default router;
