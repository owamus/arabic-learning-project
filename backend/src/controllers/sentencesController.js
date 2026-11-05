import getRandomSentence from "../models/sentencesModel.js";

async function getSentence(req, res) {
  const sentenceObj = await getRandomSentence();
  if (!sentenceObj) return res.status(404).json({ error: "No sentences found" });
  res.json(sentenceObj);
}

export default getSentence;
