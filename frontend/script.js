//fetching the arabic sentence object from db
// level comes from the home page via ?level=A1 (missing = mixed)
const LEVEL = (new URLSearchParams(location.search).get("level") || "").toUpperCase();

// When the site is served by the backend (deployed, or http://localhost:3000) the API is on the same
// address, so the base is empty. Only when the page is opened from Live Server (port 5500) or as a
// file do we point at the local backend.
const API =
  location.protocol === "file:" || location.port === "5500"
    ? "http://localhost:3000"
    : "";

async function getSentence() {
  const url = API + "/api/" + (LEVEL ? "?level=" + LEVEL : "");
  const response = await fetch(url);
  const data = await response.json();
  return data;
}
let currentSentence = null; // the sentence on screen right now

document.getElementById("level-label").textContent = LEVEL
  ? "Level " + LEVEL
  : "Mixed levels";

//---- progress stats (localStorage), shown on the home page ----
function recordResult(correct) {
  const key = LEVEL || "MIXED";
  let stats;
  try {
    stats = JSON.parse(localStorage.getItem("levelStats")) || {};
  } catch {
    stats = {};
  }
  const s = stats[key] || { correct: 0, attempts: 0 };
  s.attempts++;
  if (correct) s.correct++;
  stats[key] = s;
  localStorage.setItem("levelStats", JSON.stringify(stats));
}

//adding english words into buttons
//ADDING ANSWER BUTTONS
function add(EnglishWord) {
  const newSelection = document.createElement("button");

  const container = document.querySelector(".centered-div");

  newSelection.innerText = EnglishWord;
  newSelection.className = "answer-btns";

  container.appendChild(newSelection);
}

function normalise(word) {
  return word
    .replace(/[!"“”#$%&'’‘()*+,\-./:;<=>?@[\]^_`{|}~]/g, "")
    .toLowerCase()
    .trim();
}

//splitting the translation into words array, and removing punctuation.
function splitEnglish(sentence) {
  return sentence
    .split(" ")
    .map(normalise)
    .filter((w) => w.length > 0);
}

//adding translation buttons for selection on the page
async function addEnglishBtns(eng_btns) {
  eng_btns.sort(() => Math.random() - 0.5); //sorting the buttons randomly

  await eng_btns.forEach((btn) => {
    if (btn.length > 0) {
      add(btn);
    }
  });
}

//---- GIFs (a funny GIF for the sentence, shown after answering) ----
const GIF_KEY = "gifsOn";

function gifsEnabled() {
  try {
    return localStorage.getItem(GIF_KEY) !== "off";
  } catch {
    return true;
  }
}

function updateGifBtn() {
  const btn = document.getElementById("gif-btn");
  btn.textContent = "GIFs: " + (gifsEnabled() ? "on" : "off");
  btn.classList.toggle("off", !gifsEnabled());
}

function hideGif() {
  document.getElementById("gif-box").hidden = true;
  document.getElementById("gif-img").removeAttribute("src");
}

// search phrase: the sentence's gif_keyword, else its english subject word, else its topic
function gifQuery() {
  if (currentSentence.gif_keyword) return currentSentence.gif_keyword;
  const subject = (currentSentence.glosses || []).find((g) => g.role === "subject");
  const word = subject?.english
    .split(" ")
    .find((w) => w && !FUNCTION_WORDS.has(w));
  return word || (currentSentence.topic || "").replace(/_/g, " ");
}

async function showGif() {
  if (!gifsEnabled()) return;
  const forSentence = currentSentence; // ignore the result if the user has moved on
  const q = gifQuery();
  if (!q) return;
  try {
    const res = await fetch(API + "/api/gif?q=" + encodeURIComponent(q));
    if (!res.ok) return; // no GIF found / key missing: just show nothing
    const gif = await res.json();
    if (forSentence !== currentSentence || !gifsEnabled()) return;
    const img = document.getElementById("gif-img");
    img.src = gif.url;
    img.alt = gif.title || "";
    document.getElementById("gif-box").hidden = false;
  } catch {
    // offline etc: the page works fine without a GIF
  }
}

document.getElementById("gif-btn").addEventListener("click", () => {
  const turnOn = !gifsEnabled();
  try {
    localStorage.setItem(GIF_KEY, turnOn ? "on" : "off");
  } catch {}
  updateGifBtn();
  if (!turnOn) hideGif();
  else if (document.getElementById("sentence").classList.contains("answered"))
    showGif();
});
updateGifBtn();

//---- grammar highlighter ----
// role id -> [label shown under the word, arabic term + meaning, colour]
const ROLE_INFO = {
  subject: ["subject", "مبتدأ – what the sentence is about", "#60a5fa"],
  predicate: ["predicate", "خبر – what is said about the subject", "#34d399"],
  verb: ["verb", "فعل", "#f87171"],
  doer: ["doer", "فاعل – who does the verb", "#38bdf8"],
  object: ["object", "مفعول به – receives the verb", "#fbbf24"],
  adjective: ["adjective", "صفة – describes a noun", "#f472b6"],
  possessor: ["of / owner", "مضاف إليه – the 'of' noun", "#fb923c"],
  preposition: ["preposition", "حرف جر", "#9ca3af"],
  prep_object: ["after prep.", "مجرور – noun after a preposition", "#2dd4bf"],
  linker: ["linker", "رابط – and / but / because / when", "#c4b5fd"],
  particle: ["particle", "حرف – small grammar word", "#9ca3af"],
  adverb: ["time / how", "ظرف – time, place or manner", "#a3e635"],
  question_word: ["question", "أداة استفهام", "#fde047"],
  demonstrative: ["this / that", "اسم إشارة", "#e879f9"],
};

const TYPE_INFO = {
  nominal: [
    "Nominal sentence · جملة اسمية",
    "Starts with a noun. Pattern: subject + predicate. A predicate with no ال after a subject with ال means “is”: البيت كبير = the house is big. With ال on both (البيت الكبير) it is only “the big house”, not a sentence.",
  ],
  verbal: [
    "Verbal sentence · جملة فعلية",
    "Starts with a verb. Pattern: verb + doer + object.",
  ],
  question: [
    "Question · جملة استفهامية",
    "Starts with a question word (هل, أين, كم, ماذا, كيف).",
  ],
  conditional: [
    "Conditional sentence · جملة شرطية",
    "An “if … then …” sentence, started by a word like لو, إذا or لولا.",
  ],
};

function resetGrammarToggle() {
  document.getElementById("sentence").classList.remove("grammar-on");
  const btn = document.getElementById("grammar-btn");
  btn.textContent = "Show grammar";
  btn.disabled = true;
  const legend = document.getElementById("grammar-legend");
  legend.innerHTML = "";
  legend.hidden = true;
}

// builds the legend (sentence type + only the roles used in this sentence)
function buildGrammarLegend(roles) {
  const legend = document.getElementById("grammar-legend");
  legend.innerHTML = "";

  const type = TYPE_INFO[currentSentence.sentence_type];
  if (type) {
    const t = document.createElement("p");
    t.className = "legend-type";
    const strong = document.createElement("b");
    strong.textContent = type[0];
    t.append(strong, " — " + type[1]);
    legend.appendChild(t);
  }

  const chips = document.createElement("div");
  chips.className = "legend-chips";
  [...new Set(roles)].forEach((role) => {
    const info = ROLE_INFO[role];
    if (!info) return;
    const chip = document.createElement("span");
    chip.className = "legend-chip";
    chip.style.setProperty("--role-colour", info[2]);
    chip.textContent = info[0] + " · " + info[1];
    chips.appendChild(chip);
  });
  legend.appendChild(chips);
}

// colours each arabic word by its role and unlocks the toggle button
function enableGrammarHighlighter() {
  const glosses = currentSentence.glosses || [];
  const used = [];

  document.querySelectorAll("#sentence .arabic-word").forEach((span, i) => {
    const g = glosses.find((x) => x.position === i + 1);
    const info = g && ROLE_INFO[g.role];
    if (!info) return;
    span.dataset.label = info[0];
    span.style.setProperty("--role-colour", info[2]);
    used.push(g.role);
  });

  const btn = document.getElementById("grammar-btn");
  if (used.length === 0) {
    btn.title = "No grammar data for this sentence yet";
    return;
  }
  buildGrammarLegend(used);
  btn.title = "";
  btn.disabled = false;
}

document.getElementById("grammar-btn").addEventListener("click", () => {
  const on = document
    .getElementById("sentence")
    .classList.toggle("grammar-on");
  document.getElementById("grammar-btn").textContent = on
    ? "Hide grammar"
    : "Show grammar";
  document.getElementById("grammar-legend").hidden = !on;
});

//puts the arabic sentence on screen as one span per word (hover tooltips are added after answering)
function renderArabicSentence(text) {
  const sentenceEl = document.getElementById("sentence");
  sentenceEl.classList.remove("answered");
  hideGif();
  resetGrammarToggle();
  sentenceEl.innerHTML = "";

  const wrapper = document.createElement("span");
  wrapper.dir = "rtl";
  text
    .split(" ")
    .filter((w) => w.length > 0)
    .forEach((w, i) => {
      if (i > 0) wrapper.appendChild(document.createTextNode(" "));
      const span = document.createElement("span");
      span.className = "arabic-word";
      span.textContent = w;
      wrapper.appendChild(span);
    });
  sentenceEl.appendChild(wrapper);
}

//after answering: hovering an arabic word shows an "add to weak words" popup above it
function enableArabicWordPopups() {
  const sentenceEl = document.getElementById("sentence");
  sentenceEl.classList.add("answered");
  const saved = loadWeakWords();

  sentenceEl.querySelectorAll(".arabic-word").forEach((span) => {
    // drop punctuation (. ، ؟ etc) but keep the diacritics
    const clean = span.textContent.replace(/[.,،؟?!؛:"“”()«»]/g, "").trim();
    if (!clean) return;

    const tip = document.createElement("span");
    tip.className = "arabic-tip";
    tip.setAttribute("role", "button");
    tip.textContent = saved[clean] ? "In weak words ✓" : "Add to weak words";
    if (saved[clean]) tip.classList.add("added");

    tip.addEventListener("click", () => {
      if (tip.classList.contains("added")) return;
      // flagged by the user, so it starts as "hard"; add the English meaning if we know it
      saveWeakWord(clean, "hard", { translation: englishForArabic(clean) });
      tip.textContent = "Added ✓";
      tip.classList.add("added");
    });

    span.appendChild(tip);
  });

  enableGrammarHighlighter();
  showGif();
  document.getElementById("arabic-hint").classList.add("show");
}

//adding arabic sentence and answer buttons to the page
async function addSentence() {
  currentSentence = await getSentence(); // saved for the check later
  renderArabicSentence(currentSentence.arabic);

  // correct words + decoy words from the backend, shuffled together
  addEnglishBtns([
    ...splitEnglish(currentSentence.english),
    ...(currentSentence.distractors || []),
  ]);

  document
    .querySelectorAll(".answer-btns")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        flyTo(btn, "translation", ".sentence-builder-space"),
      ),
    );
}

//---- weak words storage (localStorage) ----
const WEAK_KEY = "weakWords";
const LEVELS = ["easy", "medium", "hard"];

function loadWeakWords() {
  try {
    return JSON.parse(localStorage.getItem(WEAK_KEY)) || {};
  } catch {
    return {};
  }
}

// saves (or overwrites) a word with its perceived confidence + the sentence it came from
function saveWeakWord(word, confidence, extra = {}) {
  const all = loadWeakWords();
  all[word] = {
    ...extra, // arabicWord (for english words) or translation (for arabic words)
    word,
    confidence,
    arabic: currentSentence.arabic,
    english: currentSentence.english,
    updated: Date.now(),
  };
  localStorage.setItem(WEAK_KEY, JSON.stringify(all));
}

//---- word glosses (from the backend): which arabic word matches which english word ----
function normaliseArabic(w) {
  return w.replace(/[.,،؟?!؛:"“”()«»]/g, "").trim();
}

// arabic word(s) in the current sentence that mean this english word
function arabicForEnglish(word) {
  const forms = (currentSentence.glosses || [])
    .filter((g) => g.english && g.english.split(" ").includes(word))
    .map((g) => g.arabic_form);
  return [...new Set(forms)].join(" ");
}

// english meaning of an arabic word in the current sentence
function englishForArabic(arabicWord) {
  const g = (currentSentence.glosses || []).find(
    (g) => g.arabic_form && normaliseArabic(g.arabic_form) === arabicWord,
  );
  return g ? g.english || "" : "";
}

//shows each missed word with easy / medium / hard buttons
function showConfidencePicker(words) {
  const panel = document.getElementById("confidence-panel");
  panel.innerHTML = "";
  if (words.length === 0) return;

  const title = document.createElement("p");
  title.className = "confidence-title";
  title.textContent = "How confident are you with these words?";
  panel.appendChild(title);

  words.forEach((word) => {
    const row = document.createElement("div");
    row.className = "confidence-row";

    const label = document.createElement("span");
    label.className = "confidence-word";
    label.textContent = word;
    row.appendChild(label);

    const arabic = arabicForEnglish(word);
    if (arabic) {
      const ar = document.createElement("span");
      ar.className = "confidence-arabic";
      ar.dir = "rtl";
      ar.textContent = arabic;
      row.appendChild(ar);
    }

    LEVELS.forEach((level) => {
      const btn = document.createElement("button");
      btn.className = "confidence-btn " + level;
      btn.textContent = level;
      btn.addEventListener("click", () => {
        saveWeakWord(word, level, { arabicWord: arabic });
        row
          .querySelectorAll(".confidence-btn")
          .forEach((b) => b.classList.remove("selected"));
        btn.classList.add("selected");
      });
      row.appendChild(btn);
    });

    panel.appendChild(row);
  });

  panel.hidden = false;
}

//need to combine the words selected, into array, then check array against the actual english translation
//need to combine words of english translation into array.
//then we check the order and items match, if so we say correct, if false, we can keep track of the words that were red, and store them as weak words
//we need to also lock the buttons once, the submit button clicked
//---- working out WHAT kind of mistake was made ----
// small "grammar" words: if these are wrong/missing it is a grammar mistake, not a vocabulary one
const FUNCTION_WORDS = new Set(
  (
    "a an the is are am was were be been being do does did will would shall should can could may might must " +
    "has have had not dont doesnt didnt isnt arent wasnt werent cant couldnt wouldnt wont hasnt havent hadnt " +
    "i you he she it we they me him her us them my your his its our their " +
    "of to in on at by for from with about into and or but so that this these those as if"
  ).split(" "),
);

// counts how many times each word appears
function countWords(words) {
  const counts = new Map();
  words.forEach((w) => counts.set(w, (counts.get(w) || 0) + 1));
  return counts;
}

// compares what the user built with the answer.
// vocab   = content words (house, big...) that were wrong or missing
// grammar = small words (is, the...) wrong/missing/extra, or the words are in the wrong order
function diagnoseMistakes(builtWords, expected) {
  const have = countWords(builtWords);
  const want = countWords(expected);

  const missing = []; // in the answer but not built enough times
  const extra = []; // built but not in the answer (or built too many times)
  want.forEach((n, w) => {
    for (let i = have.get(w) || 0; i < n; i++) missing.push(w);
  });
  have.forEach((n, w) => {
    for (let i = want.get(w) || 0; i < n; i++) extra.push(w);
  });

  const missingContent = missing.filter((w) => !FUNCTION_WORDS.has(w));
  const missingSmall = missing.filter((w) => FUNCTION_WORDS.has(w));
  const extraContent = extra.filter((w) => !FUNCTION_WORDS.has(w));
  const extraSmall = extra.filter((w) => FUNCTION_WORDS.has(w));

  // order: look only at words the user got right, ignoring missing/extra ones
  const common = new Map();
  want.forEach((n, w) => {
    if (have.has(w)) common.set(w, Math.min(n, have.get(w)));
  });
  const keep = (words) => {
    const left = new Map(common);
    return words.filter((w) => {
      const n = left.get(w) || 0;
      if (n > 0) left.set(w, n - 1);
      return n > 0;
    });
  };
  const orderWrong = keep(builtWords).join(" ") !== keep(expected).join(" ");

  return {
    vocab: missingContent.length > 0 || extraContent.length > 0,
    grammar: missingSmall.length > 0 || extraSmall.length > 0 || orderWrong,
    missingContent,
    extraContent,
    missingSmall,
    extraSmall,
    orderWrong,
  };
}

// turns the diagnosis into a short headline + detail line
function describeMistakes(d) {
  let headline = "✗ Not quite";
  if (d.vocab && d.grammar) headline = "✗ Grammar and word mistakes";
  else if (d.grammar) headline = "✗ Grammar mistake";
  else if (d.vocab) headline = "✗ Word mistake";

  const details = [];
  if (d.orderWrong) details.push("Your word order is different from the answer.");
  if (d.missingSmall.length)
    details.push("Small words missing: " + [...new Set(d.missingSmall)].join(", ") + ".");
  if (d.extraSmall.length)
    details.push("Small words you did not need: " + [...new Set(d.extraSmall)].join(", ") + ".");
  if (d.missingContent.length)
    details.push("Words you missed: " + [...new Set(d.missingContent)].join(", ") + ".");
  if (d.extraContent.length)
    details.push("Wrong words used: " + [...new Set(d.extraContent)].join(", ") + ".");

  return { headline, detail: details.join(" ") };
}

function CheckTranslation() {
  const built = document.querySelectorAll(".translation");
  const expected = splitEnglish(currentSentence.english);
  const weakWords = [];

  built.forEach((btn, i) => {
    const right = normalise(btn.innerText) === expected[i];
    btn.classList.add(right ? "correct" : "incorrect");
    if (!right && expected[i]) weakWords.push(expected[i]);
  });

  // words they never placed at all
  for (let i = built.length; i < expected.length; i++) {
    weakWords.push(expected[i]);
  }

  const allCorrect = weakWords.length == 0 && built.length == expected.length;

  recordResult(allCorrect);
  enableArabicWordPopups();

  const feedback = document.getElementById("feedback");
  const diagnosis = diagnoseMistakes(
    [...built].map((b) => normalise(b.innerText)),
    expected,
  );
  const mistake = describeMistakes(diagnosis);
  feedback.textContent = allCorrect ? "✓ Correct!" : mistake.headline;
  feedback.classList.remove("correct", "incorrect");
  feedback.classList.add(allCorrect ? "correct" : "incorrect");
  document.querySelector(".skip-btn").textContent = "next question";

  // show the correct answer when the user got it wrong
  const answerEl = document.getElementById("correct-answer");
  if (!allCorrect) {
    answerEl.textContent = "Correct answer: " + currentSentence.english;
    answerEl.hidden = false;
  }

  // say what kind of mistake it was (grammar vs word)
  const detailEl = document.getElementById("mistake-detail");
  detailEl.textContent = allCorrect ? "" : mistake.detail;
  detailEl.hidden = allCorrect || !mistake.detail;

  // only word (vocabulary) mistakes go to the confidence picker; grammar mistakes do not
  if (!allCorrect) showConfidencePicker([...new Set(diagnosis.missingContent)]);

  // lock everything (disabled buttons can't be clicked, so no listeners to remove)
  document
    .querySelectorAll(".translation, .answer-btns, .submitBtn")
    .forEach((b) => (b.disabled = true));

  return weakWords; // store these for your weak-words feature
}

//Skip button logic
document.querySelector(".skip-btn").addEventListener("click", (event) => {
  document.querySelectorAll(".answer-btns").forEach((btn) => btn.remove());
  document.querySelectorAll(".translation").forEach((btn) => btn.remove());
  const feedback = document.getElementById("feedback");
  feedback.textContent = "";
  feedback.classList.remove("correct", "incorrect");
  const answerEl = document.getElementById("correct-answer");
  answerEl.textContent = "";
  answerEl.hidden = true;
  const detailEl = document.getElementById("mistake-detail");
  detailEl.textContent = "";
  detailEl.hidden = true;
  const panel = document.getElementById("confidence-panel");
  panel.innerHTML = "";
  panel.hidden = true;
  document.getElementById("arabic-hint").classList.remove("show");
  document.querySelector(".skip-btn").textContent = "skip";
  document.querySelector(".submitBtn").disabled = false;
  addSentence();
});

//event listener for submit button
document.querySelector(".submitBtn").addEventListener("click", () => {
  if (document.querySelectorAll(".translation").length === 0) return; // nothing built yet
  CheckTranslation();
});

addSentence();

//animating movement of the answer buttons to the sentence build space

async function flyTo(clicked, targetclassname, targetdiv) {
  //targetclass, then targetdiv!!!!!
  const text = clicked.innerText;
  clicked.remove();
  const movingbtn = document.createElement("button");
  const sentence = document.querySelector(targetdiv); //div
  //'.sentence-builder-space'
  //'.centered-div'

  movingbtn.innerText = text;
  //movingbtn.className = 'translation';
  //'answer-btns'
  movingbtn.className = targetclassname;

  const newNode = await sentence.appendChild(movingbtn);

  const descripText = document.querySelector(".description-sentence");

  if (targetclassname == "translation") {
    // when we moving from an sentence builder to the answer key (class called translation)
    newNode.addEventListener("click", () =>
      flyTo(newNode, "answer-btns", ".centered-div"),
    );
  } else {
    // moving from answer key to builder space, remember translation is the target class, sentence-bilder-space is the target div!
    newNode.addEventListener("click", () =>
      flyTo(newNode, "translation", ".sentence-builder-space"),
    );
  }

  if (document.querySelectorAll(".translation").length == 0) {
    //when the sentence we are building has no words, we show instruction on sentence build space
    descripText.hidden = false;
  } else {
    descripText.hidden = true;
  }
}
