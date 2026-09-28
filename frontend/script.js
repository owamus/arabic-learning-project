
//fetching the arabic sentence object from db
async function getSentence(){

    const response = await fetch('http://localhost:8080/api/?category=تاريخ');
    const data = await response.json();
    return data
}
//adding english words into buttons
//ADDING ANSWER BUTTONS
function add(EnglishWord) {
    const newSelection = document.createElement("button");

    const container = document.querySelector('.centered-div');

    newSelection.innerText = EnglishWord;
    newSelection.className= 'answer-btns';

    container.appendChild(newSelection);

}

//splitting the translation into words array, and removing punctuation and empty elements.
async function splitEnglish(sentence){
    const arrayWords = sentence.split(" ");
    arrayWords.sort(()=> Math.random()-0.5);

    await arrayWords.forEach(element =>{
        element = element.replace(/[!"“”#$%&'’‘()*+,-./:;<=>?@[\]^_`{|}~]/g, '').toLowerCase().trim()
        if (element.length > 0){
            add(element);
        }
    });

}



//adding arabic sentence and answer buttons to the page
async function addSentence(){
    const obj = await getSentence();
    const arabic = obj.arabic_content;

    document.getElementById('sentence').innerText = arabic;
    await splitEnglish(obj.english_content);

    const ans_btn = document.querySelectorAll('.answer-btns');

    ans_btn.forEach((btn)=> btn.addEventListener("click",(event)=>{
        flyTo(btn,'translation','.sentence-builder-space');

    }));
}


//Skip button logic
document.querySelector(".skip-btn").addEventListener("click", (event) =>{
        document.querySelectorAll('.answer-btns').forEach(btn => btn.remove());
        document.querySelectorAll('.translation').forEach(btn => btn.remove());
        addSentence();
    });

addSentence();

//animating movement of the answer buttons to the sentence build space

async function flyTo(clicked,targetclassname,targetdiv){

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

    if(targetclassname=='translation'){
        newNode.addEventListener("click",()=>flyTo(newNode,'answer-btns',".centered-div"));

    }
    else{
        newNode.addEventListener("click",()=>flyTo(newNode,'translation',".sentence-builder-space"));

    }
    if(document.querySelectorAll(".translation").length==0){
        descripText.hidden = false;
    }
    else{
        descripText.hidden = true;
    }

}


