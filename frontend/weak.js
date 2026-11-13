const WEAK_KEY = "weakWords";
const ORDER = { hard: 0, medium: 1, easy: 2 }; // least confident first

function loadWeakWords() {
  try {
    return JSON.parse(localStorage.getItem(WEAK_KEY)) || {};
  } catch {
    return {};
  }
}

function render() {
  const list = document.getElementById("weak-list");
  list.innerHTML = "";

  const entries = Object.values(loadWeakWords()).sort(
    (a, b) => ORDER[a.confidence] - ORDER[b.confidence] || b.updated - a.updated,
  );

  if (entries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "weak-empty";
    empty.textContent = "No weak words saved yet.";
    list.appendChild(empty);
    return;
  }

  entries.forEach((entry) => {
    const card = document.createElement("div");
    card.className = "weak-card";

    const head = document.createElement("div");
    head.className = "weak-card-head";

    const word = document.createElement("span");
    word.className = "confidence-word";
    word.textContent = entry.word;

    const badge = document.createElement("span");
    badge.className = "confidence-badge " + entry.confidence;
    badge.textContent = entry.confidence;

    const remove = document.createElement("button");
    remove.className = "weak-remove";
    remove.textContent = "remove";
    remove.addEventListener("click", () => {
      const all = loadWeakWords();
      delete all[entry.word];
      localStorage.setItem(WEAK_KEY, JSON.stringify(all));
      render();
    });

    head.append(word);

    // english words show their arabic; arabic words show their english meaning
    const extra = entry.arabicWord || entry.translation;
    if (extra) {
      const ex = document.createElement("span");
      ex.className = entry.arabicWord ? "weak-extra-arabic" : "weak-extra";
      if (entry.arabicWord) ex.dir = "rtl";
      ex.textContent = extra;
      head.append(ex);
    }

    head.append(badge, remove);

    const arabic = document.createElement("p");
    arabic.className = "weak-arabic";
    arabic.textContent = entry.arabic;

    const english = document.createElement("p");
    english.className = "weak-english";
    english.textContent = entry.english;

    card.append(head, arabic, english);
    list.appendChild(card);
  });
}

render();
