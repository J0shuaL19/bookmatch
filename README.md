# BookMatch: Find Your Next Read

**Authors:** Anthony Minichillo and Alex Dat Huynh
**Class:** (https://johnguerra.co/classes/webDevelopment_online_fall_2026/)
**Live site:** https://bookmatch-s30r.onrender.com
**Demo video:** "A small error. Forgot to add video link."
**Design document:** (https://docs.google.com/document/d/1ZpYkkq1hIhD9Z7agO7sLHxjBgsseo7N8Hi_Clo_r4_k/edit?usp=sharing)
**Slides:** https://docs.google.com/presentation/d/1ZRIAHeM5Lm_vzOaH-8-nujYVmJbhMreVqTZZnM36LCs/edit?usp=sharing

> The live site is hosted on Render's free tier. The first load after a period
> of inactivity can take up to a minute while the server wakes up.

## Project Objective

BookMatch is a book discovery website that helps readers find their next book
based on what they are in the mood for. Readers can search and filter a catalog
of about 2,700 books by genre, length, reading difficulty, themes, season,
setting, and point of view. Each book has a detail page, and readers can save
books to personal reading lists and track their progress.

## Screenshot

![BookMatch search page](docs/sc4.png)

## Features

- Search by title or author, and filter by genre, season, difficulty, point of
  view, setting, themes, and page count
- Book detail pages with full create, read, update, and delete support
- Add new books to the catalog through a form
- Personal reading lists with custom names, plus reading status tracking (plan
  to read, reading, finished)
- Two MongoDB collections, `books` and `readingLists`, each with full CRUD

## How to Use

1. On the **Books** page, choose any filters, leave the rest blank, and press
   **Search**. Press **Clear** to reset the filters.
2. Select a book title to open its details. From there you can **Edit** or
   **Delete** the book.
3. Use **Add a Book** to add a new title to the catalog.
4. Use **My Lists** to create reading lists, add books to them, and mark each
   book as plan to read, reading, or finished.

## Instructions to Build

**Requirements:** Node.js (LTS) and a MongoDB Atlas cluster.

1. Clone the repository and install dependencies:

```bash
   git clone https://github.com/Anthonyminichillo/bookmatch.git
   cd bookmatch
   npm install
```

2. Create a `.env` file in the project root (see `.env.example`):

```
   MONGO_URI=your-mongodb-atlas-connection-string
   PORT=3000
```

3. Optional: load about 2,700 sample books from Open Library into your
   database. This replaces any previously seeded books.

```bash
   npm run seed
```

4. Start the app and open http://localhost:3000:

```bash
   npm start
```

Other scripts: `npm run lint` runs ESLint and `npm run format` runs Prettier.

## Project Structure

```
db/            MongoDB connection module
routes/        Express routers (books.js, readingLists.js)
seed/          Script that loads books from Open Library
public/        Frontend pages
  css/         One stylesheet per page, plus shared base.css
  js/          Client-side JavaScript modules, one per page
docs/          Screenshots
```

## Notes

- Titles, authors, page counts, and subjects come from Open Library. Season,
  setting, and point of view are not available there, so the seed script assigns
  sample values to them. They can be edited on each book's page.
- The database connection string is stored in `.env`, which is not committed.

## Tech Stack

HTML5, CSS3, vanilla JavaScript (ES modules, client-side rendering), Node.js,
Express, MongoDB Atlas (native driver). No Mongoose and no template engines.

## License

MIT
