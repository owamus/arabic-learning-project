// Loads arabic_sentences.csv into Postgres (sentences, words, sentence_words).
//
// Usage:
//   DATABASE_URL=postgres://user:pass@localhost:5432/arabic node load.js [path/to/file.csv]
//
// Safe to re-run: sentences are deduplicated on arabic_plain, words on word.
// Everything runs in one transaction, so a failure leaves the database untouched.

import fs from "fs";
import path from "path";
import pg from "pg";
import { parse } from "csv-parse/sync";

const { Client } = pg;

const csvPath = path.resolve(process.argv[2] || "arabic_sentences.csv");

const REQUIRED_COLUMNS = [
  "arabic",
  "arabic_plain",
  "english",
  "level",
  "topic",
  "word_count",
  "source",
];

// Split a plain Arabic sentence into word tokens, dropping punctuation
// (including Arabic ، ؟ ؛). Anything that isn't a letter or digit is removed.
function tokenize(plain) {
  return plain
    .split(/\s+/)
    .map((t) => t.replace(/[^\p{L}\p{N}]/gu, ""))
    .filter(Boolean);
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "Set DATABASE_URL, e.g. postgres://user:pass@localhost:5432/arabic",
    );
  }

  const rows = parse(fs.readFileSync(csvPath, "utf8"), {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });

  if (rows.length === 0) throw new Error(`No rows found in ${csvPath}`);
  const missing = REQUIRED_COLUMNS.filter((c) => !(c in rows[0]));
  if (missing.length)
    throw new Error(`CSV is missing columns: ${missing.join(", ")}`);

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const stats = { sentencesInserted: 0, sentencesSkipped: 0, wordLinks: 0 };
  const wordIdCache = new Map(); // word -> id, avoids repeat round-trips

  async function getWordId(word) {
    if (wordIdCache.has(word)) return wordIdCache.get(word);
    // DO UPDATE (a no-op) so RETURNING gives the id for both new and existing words.
    const { rows: r } = await client.query(
      `INSERT INTO words (word) VALUES ($1)
       ON CONFLICT (word) DO UPDATE SET word = EXCLUDED.word
       RETURNING id`,
      [word],
    );
    wordIdCache.set(word, r[0].id);
    return r[0].id;
  }

  try {
    await client.query("BEGIN");

    for (const row of rows) {
      const tokens = tokenize(row.arabic_plain);

      const { rows: inserted } = await client.query(
        `INSERT INTO sentences (arabic, arabic_plain, english, level, topic, word_count, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (arabic_plain) DO NOTHING
         RETURNING id`,
        [
          row.arabic,
          row.arabic_plain,
          row.english,
          row.level,
          row.topic || null,
          tokens.length,
          row.source || "ai_generated",
        ],
      );

      if (inserted.length === 0) {
        stats.sentencesSkipped += 1; // already loaded on a previous run
        continue;
      }

      const sentenceId = inserted[0].id;
      stats.sentencesInserted += 1;

      for (let i = 0; i < tokens.length; i += 1) {
        const wordId = await getWordId(tokens[i]);
        await client.query(
          `INSERT INTO sentence_words (sentence_id, word_id, position) VALUES ($1, $2, $3)`,
          [sentenceId, wordId, i + 1],
        );
        stats.wordLinks += 1;
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }

  console.log(`Loaded from ${csvPath}`);
  console.log(`  sentences inserted: ${stats.sentencesInserted}`);
  console.log(
    `  sentences skipped (already present): ${stats.sentencesSkipped}`,
  );
  console.log(`  sentence-word links created: ${stats.wordLinks}`);
  console.log(`  distinct words seen this run: ${wordIdCache.size}`);
}

main().catch((err) => {
  console.error("Load failed:", err.message);
  process.exit(1);
});
