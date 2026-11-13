import client from "../db.js";

// Returns one random sentence from the `arabic` database.
// If a level (A1/A2/B1/B2) is given, only sentences of that level are considered.
async function getRandomSentence(level) {
  const cols = "id, arabic, arabic_plain, english, level, topic, word_count";
  const res = level
    ? await client.query(
        `SELECT ${cols} FROM sentences WHERE level = $1 ORDER BY RANDOM() LIMIT 1`,
        [level],
      )
    : await client.query(
        `SELECT ${cols} FROM sentences ORDER BY RANDOM() LIMIT 1`,
      );
  return res.rows[0];
}

export default getRandomSentence;
