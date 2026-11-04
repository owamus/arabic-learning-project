//fetching the arabic sentence object from db
async function getSentence() {
  const response = await fetch("http://localhost:3000/api/?category=تاريخ");
  const data = await response.json();
  return data;
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

//splitting the translation into words array, and removing punctuation.
async function splitEnglish(sentence) {
  const arrayWords = sentence.split(" ");

  await arrayWords.forEach((element) => {
    element = element
      .replace(/[!"“”#$%&'’‘()*+,-./:;<=>?@[\]^_`{|}~]/g, "")
      .toLowerCase()
      .trim();
  });
  return arrayWords;
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
  const obj = await getSentence();
  const arabic = obj.arabic_content;

  document.getElementById("sentence").innerText = arabic;

  const array_eng_btns = await splitEnglish(obj.english_content); //get the english buttons
  await addEnglishBtns(array_eng_btns); //add the buttons to the page

  const ans_btn = document.querySelectorAll(".answer-btns");

  ans_btn.forEach((btn) =>
    btn.addEventListener("click", (event) => {
      flyTo(btn, "translation", ".sentence-builder-space");
    }),
  );
}
//need to combine the words selected, into array, then check array against the actual english translation
//need to combine words of english translation into array.
//then we check the order and items match, if so we say correct, if false, we can keep track of the words that were red, and store them as weak words
//we need to also lock the buttons once, the submit button clicked
async function CheckTranslation() {
  // function runs when submit clicked

  const submitted_answer_btns = document.querySelectorAll(".translation");
  const obj = await getSentence();
  const array_eng_btns = await splitEnglish(obj.english_content);
  const array_submit_btns = Arrays.from(submitted_answer_btns);

  if (Arrays.equals(array_eng_btns, array_submit_btns)) {
  }

  // submitted_answer_btns.forEach((btn) => //html,css elements that sit in horizontal line sit sequencially in order in HTML Markup

  // );
}

//Skip button logic
document.querySelector(".skip-btn").addEventListener("click", (event) => {
  document.querySelectorAll(".answer-btns").forEach((btn) => btn.remove());
  document.querySelectorAll(".translation").forEach((btn) => btn.remove());
  addSentence();
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
