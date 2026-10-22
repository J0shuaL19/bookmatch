import { Router } from 'express';
import { ObjectId } from 'mongodb';
import { getDb } from '../db/connection.js';

const router = Router();

const STATUSES = ['Want to read', 'Reading', 'Did not finish', 'Finished'];

const FIELDS = ['name', 'description'];

function pickFields(body) {
  const list = {};
  for (const field of FIELDS) {
    if (typeof body[field] === 'string') list[field] = body[field].trim();
  }
  return list;
}

// CREATE (list)
router.post('/', async (req, res) => {
  try {
    const list = pickFields(req.body);
    if (!list.name || !list.description) {
      return res
        .status(400)
        .json({ error: 'Name and description are required' });
    }
    list.books = [];
    list.createdAt = new Date();
    list.lastModified = new Date();

    const db = await getDb();
    const result = await db.collection('readingLists').insertOne(list);
    res.status(201).json({ _id: result.insertedId, ...list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ (lists)
router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const lists = await db
      .collection('readingLists')
      .find()
      .sort({ lastModified: -1 })
      .toArray();
    res.json(lists);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE (list)
router.delete('/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid list id' });
    }
    const db = await getDb();
    const deletionResult = await db
      .collection('readingLists')
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (deletionResult.deletedCount == 0) {
      return res.status(404).json({ error: 'List not found' });
    }
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// READ (one list)
router.get('/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid list id' });
    }

    const db = await getDb();
    const list = await db
      .collection('readingLists')
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!list) {
      return res.status(404).json({ error: 'List not found' });
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE (list)
router.put('/:id', async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid list id' });
    }

    const updates = pickFields(req.body);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    if (
      ('name' in updates && !updates.name) ||
      ('description' in updates && !updates.description)
    ) {
      return res
        .status(400)
        .json({ error: 'Name and description cannot be empty' });
    }

    const db = await getDb();
    const result = await db
      .collection('readingLists')
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { ...updates, lastModified: new Date() } },
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'List not found' });
    }

    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE (add book to list)
router.post('/:id/books', async (req, res) => {
  try {
    const { bookId } = req.body;//“Nice touch preventing duplicate books in a single database update.”
    if (!ObjectId.isValid(req.params.id) || !ObjectId.isValid(bookId)) {
      return res.status(400).json({ error: 'Invalid list or book id' });
    }
    const listId = new ObjectId(req.params.id);
    const bookObjectId = new ObjectId(bookId);

    const db = await getDb();
    const lists = db.collection('readingLists');
    const result = await lists.updateOne(
      { _id: listId, 'books.bookId': { $ne: bookObjectId } },
      {
        $push: {
          books: {
            bookId: bookObjectId,
            status: 'Want to read',
            addedAt: new Date(),
          },
        },
        $set: { lastModified: new Date() },
      },
    );

    if (result.matchedCount === 0) {
      const exists = await lists.findOne({ _id: listId });
      if (!exists) {
        return res.status(404).json({ error: 'List not found' });
      }
      return res.status(409).json({ error: 'Book is already in this list' });
    }

    res.status(201).json({ added: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE (book status)
router.put('/:id/books/:bookId', async (req, res) => {
  try {
    const { id, bookId } = req.params;
    if (!ObjectId.isValid(id) || !ObjectId.isValid(bookId)) {
      return res.status(400).json({ error: 'Invalid list or book id' });
    }
    if (!STATUSES.includes(req.body.status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const db = await getDb();
    const result = await db
      .collection('readingLists')
      .updateOne(
        { _id: new ObjectId(id), 'books.bookId': new ObjectId(bookId) },
        {
          $set: { 'books.$.status': req.body.status, lastModified: new Date() },
        },
      );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'List or book not found' });
    }

    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE (remove book from list)
router.delete('/:id/books/:bookId', async (req, res) => {
  try {
    const { id, bookId } = req.params;
    if (!ObjectId.isValid(id) || !ObjectId.isValid(bookId)) {
      return res.status(400).json({ error: 'Invalid list or book id' });
    }
    const bookObjectId = new ObjectId(bookId);

    const db = await getDb();
    const result = await db.collection('readingLists').updateOne(
      { _id: new ObjectId(id), 'books.bookId': bookObjectId },
      {
        $pull: { books: { bookId: bookObjectId } },
        $set: { lastModified: new Date() },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'List or book not found' });
    }

    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
