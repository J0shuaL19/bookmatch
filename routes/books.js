import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db/connection.js';

const router = Router();

const FIELDS = [
  'title',
  'author',
  'genre',
  'pageCount',
  'difficulty',
  'themes',
  'season',
  'setting',
  'pov',
  'description',
];

function pickFields(body) {
  const book = {};
  for (const field of FIELDS) {
    if (body[field] !== undefined) book[field] = body[field];
  }
  if (book.pageCount !== undefined) book.pageCount = Number(book.pageCount);
  if (typeof book.themes === 'string') {
    book.themes = book.themes
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return book;
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');//“Nice job handling special characters in search text. That makes search more reliable.”
}

// READ (list + search + filters)
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const { q, genre, season, difficulty, setting, pov, themes } = req.query;
    const { minPages, maxPages } = req.query;
    const filter = {};

    if (q) {
      const regex = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ title: regex }, { author: regex }];
    }
    if (genre) filter.genre = genre;
    if (season) filter.season = season;
    if (difficulty) filter.difficulty = difficulty;
    if (setting) filter.setting = setting;
    if (pov) filter.pov = pov;
    if (themes) {
      filter.themes = { $in: themes.split(',').map((t) => t.trim()) };
    }
    if (minPages || maxPages) {
      filter.pageCount = {};
      if (minPages) filter.pageCount.$gte = Number(minPages);
      if (maxPages) filter.pageCount.$lte = Number(maxPages);
    }

    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const page = Math.max(Number(req.query.page) || 1, 1);

    const books = await db
      .collection('books')
      .find(filter)
      .sort({ title: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ (one book)
router.get('/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid book id' });
    }
    const db = await getDb();
    const book = await db
      .collection('books')
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.json(book);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const book = pickFields(req.body);
    if (!book.title || !book.author) {
      return res.status(400).json({ error: 'Title and author are required' });
    }
    const db = await getDb();
    const result = await db.collection('books').insertOne(book);
    res.status(201).json({ _id: result.insertedId, ...book });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid book id' });
    }
    const updates = pickFields(req.body);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    const db = await getDb();
    const result = await db
      .collection('books')
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates });
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid book id' });
    }
    const db = await getDb();
    const result = await db
      .collection('books')
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
