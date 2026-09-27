
async function getSentence(){

    const response = await fetch('http://localhost:3000/api/?category=تاريخ');
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

async function splitEnglish(sentence){
    const arrayWords = sentence.split(" ");
    arrayWords.sort(()=> Math.random()-0.5);

    arrayWords.forEach(element =>{
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

}

//Skip button logic
document.querySelector(".skip-btn").addEventListener("click", (event) =>{
        document.querySelectorAll('.answer-btns').forEach(btn => btn.remove());
        addSentence();
    });

addSentence();



