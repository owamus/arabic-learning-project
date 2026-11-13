//fetching the arabic sentence object from db
// level comes from the home page via ?level=A1 (missing = mixed)
const LEVEL = (new URLSearchParams(location.search).get("level") || "").toUpperCase();

async function getSentence() {
  const url = "http://localhost:3000/api/" + (LEVEL ? "?level=" + LEVEL : "");
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

//puts the arabic sentence on screen as one span per word (hover tooltips are added after answering)
function renderArabicSentence(text) {
  const sentenceEl = document.getElementById("sentence");
  sentenceEl.classList.remove("answered");
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
      saveWeakWord(clean, "hard"); // flagged by the user, so it starts as "hard"
      tip.textContent = "Added ✓";
      tip.classList.add("added");
    });

    span.appendChild(tip);
  });

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
function saveWeakWord(word, confidence) {
  const all = loadWeakWords();
  all[word] = {
    word,
    confidence,
    arabic: currentSentence.arabic,
    english: currentSentence.english,
    updated: Date.now(),
  };
  localStorage.setItem(WEAK_KEY, JSON.stringify(all));
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

    LEVELS.forEach((level) => {
      const btn = document.createElement("button");
      btn.className = "confidence-btn " + level;
      btn.textContent = level;
      btn.addEventListener("click", () => {
        saveWeakWord(word, level);
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
  feedback.textContent = allCorrect ? "✓ Correct!" : "✗ Not quite";
  feedback.classList.remove("correct", "incorrect");
  feedback.classList.add(allCorrect ? "correct" : "incorrect");
  document.querySelector(".skip-btn").textContent = "next question";

  // show the correct answer when the user got it wrong
  const answerEl = document.getElementById("correct-answer");
  if (!allCorrect) {
    answerEl.textContent = "Correct answer: " + currentSentence.english;
    answerEl.hidden = false;
  }

  // let the user rate how confident they are with each missed word
  if (!allCorrect) showConfidencePicker([...new Set(weakWords)]);

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
