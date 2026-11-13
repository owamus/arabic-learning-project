// Looks up a GIF on Giphy. The API key stays on the server (backend/.env),
// the browser only calls /api/gif?q=...
const cache = new Map(); // search phrase -> list of results

async function getGif(req, res) {
  const q = String(req.query.q || "").trim().slice(0, 100);
  if (!q) return res.status(400).json({ error: "Missing q" });

  const key = process.env.GIPHY_API_KEY;
  if (!key) return res.status(503).json({ error: "GIPHY_API_KEY is not set" });

  try {
    let results = cache.get(q.toLowerCase());
    if (!results) {
      const url =
        "https://api.giphy.com/v1/gifs/search?" +
        new URLSearchParams({
          api_key: key,
          q,
          limit: "10",
          rating: "g", // keep it clean
          lang: "en",
        });
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Giphy returned ${response.status}`);
      const body = await response.json();
      results = (body.data || [])
        .map((g) => ({
          url: g.images?.fixed_height?.url,
          title: g.title,
          link: g.url,
        }))
        .filter((g) => g.url);
      cache.set(q.toLowerCase(), results);
    }

    if (results.length === 0) return res.status(404).json({ error: "No GIF found" });
    // a different GIF each time, from the top results
    res.json(results[Math.floor(Math.random() * results.length)]);
  } catch (err) {
    console.error("GIF lookup failed:", err.message);
    res.status(502).json({ error: "GIF lookup failed" });
  }
}

export default getGif;
