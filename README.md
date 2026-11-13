# Arabic Sentence Builder

A web app for practising Arabic by translating whole sentences. You read an Arabic sentence, then build the English translation by tapping word tiles in order. The app tells you what kind of mistake you made, lets you save the words you struggle with, and shows the grammar behind each sentence.

## Features

- **Levels:** pick A1, A2, B1, B2 or Mixed on the home page. Only sentences from that level are served. Each level card tracks your correct answers and awards a star for every 10 correct.
- **Sentence builder:** tap English word tiles to build the translation. The word bank also contains a few decoy words taken from other sentences of the same level, so you can't build the answer blindly.
- **Feedback:** after you submit, each word is marked right or wrong by position, and the correct answer is shown if you got it wrong.
- **Mistake type:** a wrong answer is labelled as a **grammar mistake** (word order, or a missing or extra small word such as *is* or *the*), a **word mistake** (a wrong or missing content word), or both.
- **Weak words:** for the words you missed, rate your confidence (easy, medium, hard). The words are saved in your browser, together with the Arabic word and the sentence they came from, and shown on the "Review my weak words" page.
- **Hover to save Arabic words:** after answering, hover any Arabic word and add it to your weak words list.
- **Word-by-word Arabic:** each missed English word is shown with the Arabic word it matches in that sentence.
- **Grammar highlighter:** after answering, toggle a colour-coded view that labels each Arabic word with its role (subject, predicate, verb, doer, object, adjective, and so on) and explains the sentence type (nominal, verbal, question or conditional).
- **GIFs:** a funny, relevant GIF appears after you answer. It can be switched on and off, and the choice is remembered.

## Tech stack

- **Backend:** Node.js and Express (ES modules)
- **Database:** PostgreSQL (`pg`)
- **Frontend:** plain HTML, CSS and JavaScript, served by the Express server
- **GIFs:** Giphy API, called from the backend so the key stays private

## Project structure

```
backend/
  src/
    index.js               server: serves the frontend and the /api routes
    db.js                  Postgres connection (reads DATABASE_URL)
    routes/ controllers/ models/
    services/              earlier experiments for pulling Wikipedia text (not used by the running app)
  csv/
    arabic_sentences.csv   the sentences
    word_glosses.csv       word-by-word English, grammar role, sentence type and GIF keyword
    schema.sql             creates the tables
    load.js                loads sentences into the database
    load_glosses.js        loads the glosses and grammar data
    make-neon-seed.mjs     builds one SQL file for hosted databases
    load-neon.sh           loads everything into a hosted (Neon) database
frontend/
  index.html               home page (choose a level)
  practice.html            the sentence builder
  weak.html                saved weak words
```

## Running locally

You need Node.js 20 or newer and PostgreSQL.

1. Create the database and load the data:
   ```bash
   createdb arabic
   psql -d arabic -f backend/csv/schema.sql
   cd backend/csv
   npm install
   DATABASE_URL="postgres://localhost:5432/arabic" npm run load
   DATABASE_URL="postgres://localhost:5432/arabic" npm run load-glosses
   ```
2. Create `backend/.env` (see `backend/.env.example`):
   ```
   DATABASE_URL=postgres://localhost:5432/arabic
   GIPHY_API_KEY=your_giphy_api_key
   ```
   A free Giphy key is available at developers.giphy.com. Without one the app works, just without GIFs.
3. Start the server:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
4. Open <http://localhost:3000>.

## Adding sentences

Add rows to `backend/csv/arabic_sentences.csv`, then add matching rows to `backend/csv/word_glosses.csv`: one row per Arabic word, with the English it covers, its grammar role, the sentence type and a GIF search keyword. Load both files with `npm run load` and `npm run load-glosses` from `backend/csv`.

## Deploying

The server also serves the website, so one service does everything.

- **Database:** a hosted Postgres such as [Neon](https://neon.com). Create the tables and load the data with `node make-neon-seed.mjs` and paste the generated `neon_seed.sql` into the SQL editor, or run `npm run load:neon` if your network allows direct connections.
- **Server:** a Node host such as [Render](https://render.com). Set Root Directory to `backend`, Build Command to `npm install` and Start Command to `npm start`.
- **Environment variables:** `DATABASE_URL` (use the pooled connection string) and `GIPHY_API_KEY`. `CORS_ORIGIN` is only needed if the frontend is hosted on a different address.
- The API is rate limited, and `/health` returns `ok` for health checks.

## API

| Route | Description |
|---|---|
| `GET /api/` | A random sentence with its decoy words and word-by-word glosses. Optional `?level=A1` (A1, A2, B1 or B2). |
| `GET /api/gif?q=...` | A random GIF for a search phrase. |
| `GET /health` | Returns `ok`. |

## Notes

- Weak words, level progress and the GIF setting are stored in each visitor's own browser (`localStorage`). There are no accounts, so they don't sync between devices.
- GIFs are provided by [GIPHY](https://giphy.com).
