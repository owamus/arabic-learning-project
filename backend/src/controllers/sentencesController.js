import getRandomSentence from "../models/sentencesModel.js";

const LEVELS = ["A1", "A2", "B1", "B2"];

async function getSentence(req, res) {
  // optional ?level=A1 — omitted means any level
  let level;
  if (req.query.level) {
    level = String(req.query.level).toUpperCase();
    if (!LEVELS.includes(level)) {
      return res.status(400).json({ error: "Invalid level" });
    }
  }

  const sentenceObj = await getRandomSentence(level);
  if (!sentenceObj) return res.status(404).json({ error: "No sentences found" });
  res.json(sentenceObj);
}

export default getSentence;
