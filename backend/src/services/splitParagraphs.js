import { Client } from "pg";

const client = new client({
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "",
  database: "myproject",
  connectionTimeoutMillis: 5000,
});

function splitSentences(text) {
  return text
    .split(/(?<=[.!?؟])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

async function main() {
  const { rows } = await client.query("SELECT * FROM sentences"); // use your real table name

  for (const row of rows) {
    const ar = splitSentences(row.arabic_content);
    const en = splitSentences(row.english_content);

    if (ar.length == en.length && ar.length > 1) {
      for (let i = 0; i < ar.length; i++) {
        await client.query(
          "INSERT INTO sentences (arabic_content, english_content, category) VALUES ($1, $2, $3)",
          [ar[i], en[i], row.category],
        );
      }
      // only after the new rows are in, remove the original paragraph
      // await pool.query("DELETE FROM sentences WHERE id = $1", [row.id]);
    } else if (ar.length !== en.length) {
      console.log("Needs manual check:", row.id);
    }
  }
  await pool.end();
}

main();
