const LEVELS = [
  { id: "A1", name: "A1 · Beginner", desc: "Simple everyday phrases" },
  { id: "A2", name: "A2 · Elementary", desc: "Short, common sentences" },
  { id: "B1", name: "B1 · Intermediate", desc: "Longer sentences, more ideas" },
  { id: "B2", name: "B2 · Upper intermediate", desc: "Complex, natural Arabic" },
  { id: "MIXED", name: "Mixed", desc: "Random sentences from every level" },
];
const GOAL = 10; // correct answers needed to fill a level's bar

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

const stats = read("levelStats");
const grid = document.getElementById("level-grid");
let total = 0;

LEVELS.forEach((lvl) => {
  const s = stats[lvl.id] || { correct: 0, attempts: 0 };
  total += s.correct;

  const card = document.createElement("a");
  card.className = "level-card" + (lvl.id === "MIXED" ? " mixed" : "");
  card.href = "practice.html" + (lvl.id === "MIXED" ? "" : "?level=" + lvl.id);

  const name = document.createElement("div");
  name.className = "level-name";
  name.textContent = lvl.name;

  const desc = document.createElement("div");
  desc.className = "level-desc";
  desc.textContent = lvl.desc;

  const bar = document.createElement("div");
  bar.className = "level-bar";
  const fill = document.createElement("div");
  fill.className = "level-bar-fill";
  fill.style.width = Math.min(100, ((s.correct % GOAL) / GOAL) * 100) + "%";
  bar.appendChild(fill);

  const meta = document.createElement("div");
  meta.className = "level-meta";
  meta.textContent = `${s.correct} correct · ${s.attempts} attempts · ${s.correct % GOAL}/${GOAL} to next star (${Math.floor(s.correct / GOAL)}★)`;

  card.append(name, desc, bar, meta);
  grid.appendChild(card);
});

document.getElementById("total-correct").textContent = total;
document.getElementById("weak-count").textContent = Object.keys(
  read("weakWords"),
).length;
