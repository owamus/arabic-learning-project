import fs from "fs";
import path from "path";
import pg from "pg";
import { parse } from "csv-parse/sync";

// Loads word_glosses.csv into sentence_words (arabic_form + english columns).
// Run schema.sql first so the columns exist, and load the sentences with load.js.
// Usage:  DATABASE_URL=... node load_glosses.js [word_glosses.csv]
const { Client } = pg;
const csvPath = path.resolve(process.argv[2] || "word_glosses.csv");

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

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  let updated = 0;
  const notFound = [];

  try {
    await client.query("BEGIN");
    for (const row of rows) {
      // sentence is found by its plain Arabic text, position picks the word
      const res = await client.query(
        `UPDATE sentence_words sw
         SET arabic_form = $3, english = $4
         FROM sentences s
         WHERE sw.sentence_id = s.id
           AND s.arabic_plain = $1
           AND sw.position = $2`,
        [row.arabic_plain, Number(row.position), row.arabic_word, row.english],
      );
      if (res.rowCount === 0) notFound.push(`${row.arabic_plain} #${row.position}`);
      else updated += res.rowCount;
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    await client.end();
  }

  console.log(`Loaded from ${csvPath}`);
  console.log(`  words updated: ${updated}`);
  console.log(`  rows with no matching sentence word: ${notFound.length}`);
  notFound.slice(0, 10).forEach((n) => console.log(`    ${n}`));
}

main().catch((err) => {
  console.error("Load failed:", err.message);
  process.exit(1);
});
