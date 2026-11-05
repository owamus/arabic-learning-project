//fetching the arabic sentence object from db
async function getSentence() {
  const response = await fetch("http://localhost:3000/api/?category=تاريخ");
  const data = await response.json();
  return data;
}
let currentSentence = null; // the sentence on screen right now

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

//adding arabic sentence and answer buttons to the page
async function addSentence() {
  currentSentence = await getSentence(); // saved for the check later
  document.getElementById("sentence").innerText =
    currentSentence.arabic_content;

  addEnglishBtns(splitEnglish(currentSentence.english_content));

  document
    .querySelectorAll(".answer-btns")
    .forEach((btn) =>
      btn.addEventListener("click", () =>
        flyTo(btn, "translation", ".sentence-builder-space"),
      ),
    );
}

//need to combine the words selected, into array, then check array against the actual english translation
//need to combine words of english translation into array.
//then we check the order and items match, if so we say correct, if false, we can keep track of the words that were red, and store them as weak words
//we need to also lock the buttons once, the submit button clicked
function CheckTranslation() {
  const built = document.querySelectorAll(".translation");
  const expected = splitEnglish(currentSentence.english_content);
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

  const feedback = document.getElementById("feedback");
  feedback.textContent = allCorrect ? "✓ Correct!" : "✗ Not quite";
  feedback.classList.remove("correct", "incorrect");
  feedback.classList.add(allCorrect ? "correct" : "incorrect");

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
