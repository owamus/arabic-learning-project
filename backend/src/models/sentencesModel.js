import client from "../db.js";

// Returns one random sentence from the `arabic` database.
async function getRandomSentence() {
  const res = await client.query(
    "SELECT id, arabic, arabic_plain, english, level, topic, word_count FROM sentences ORDER BY RANDOM() LIMIT 1",
  );
  return res.rows[0];
}

export default getRandomSentence;
