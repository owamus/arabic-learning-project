import { Client } from "pg";

const client = new Client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "",
  database: "myproject",
  connectionTimeoutMillis: 5000,
});

function splitSentences(text) {
  return text
    .split(/(?<=[.!،,?؟])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  await client.connect();
  console.log("Connected");

  const { rows } = await client.query("SELECT * FROM sentences");
  console.log("Rows found:", rows.length);

  let inserted = 0;
  for (const row of rows) {
    const ar = splitSentences(row.arabic_content);
    const en = splitSentences(row.english_content);
    console.log(
      `id ${row.id}: Arabic ${ar.length} parts, English ${en.length} parts`,
    );

    if (ar.length === en.length && ar.length > 1) {
      for (let i = 0; i < ar.length; i++) {
        await client.query(
          "INSERT INTO sentences (arabic_content, english_content, category) VALUES ($1, $2, $3)",
          [ar[i], en[i], row.category],
        );
        inserted++;
      }
    } else {
      console.log(`  skipped id ${row.id}`);
    }
  }

  console.log("Inserted:", inserted);
  await client.end();
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
