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
  const sentence = res.rows[0];
  if (sentence) {
    sentence.distractors = await getDistractors(sentence);
    sentence.glosses = await getGlosses(sentence.id);
    sentence.sentence_type = await getSentenceType(sentence.id);
  }
  return sentence;
}

// Word-by-word glosses: which Arabic word covers which English word(s).
// Words with no English (like هل) are still returned so their grammar role is kept.
// Returns [] if the glosses have not been loaded yet.
async function getGlosses(sentenceId) {
  try {
    const res = await client.query(
      `SELECT position, arabic_form, english, role FROM sentence_words
       WHERE sentence_id = $1
       ORDER BY position`,
      [sentenceId],
    );
    return res.rows;
  } catch (err) {
    console.error("Could not read glosses:", err.message);
    return [];
  }
}

// Grammar type of the sentence (nominal / verbal / question / conditional), or null if not loaded yet.
async function getSentenceType(sentenceId) {
  try {
    const res = await client.query(
      "SELECT sentence_type FROM sentences WHERE id = $1",
      [sentenceId],
    );
    return res.rows[0]?.sentence_type || null;
  } catch (err) {
    console.error("Could not read sentence type:", err.message);
    return null;
  }
}

// same cleanup the frontend uses: strip punctuation, lowercase
function normalise(word) {
  return word
    .replace(/[!"“”#$%&'’‘()*+,\-./:;<=>?@[\]^_`{|}~]/g, "")
    .toLowerCase()
    .trim();
}

// Picks a few extra English words (taken from other sentences of the same level)
// that are NOT in the correct answer, to sit in the word bank as decoys.
async function getDistractors(sentence) {
  const res = await client.query(
    "SELECT english FROM sentences WHERE id <> $1 AND level = $2 ORDER BY RANDOM() LIMIT 6",
    [sentence.id, sentence.level],
  );

  const correct = new Set(sentence.english.split(" ").map(normalise));
  const pool = new Set();
  for (const row of res.rows) {
    for (const w of row.english.split(" ").map(normalise)) {
      if (w.length > 0 && !correct.has(w)) pool.add(w);
    }
  }

  const count = Math.min(4, Math.max(2, Math.round(correct.size * 0.3)));
  return [...pool].sort(() => Math.random() - 0.5).slice(0, count);
}

export default getRandomSentence;
