
async function getSentence(){

    const response = await fetch('http://localhost:3000/api/?category=تاريخ');
    const data = await response.json();
    return data
}
//adding english words into buttons
function add(EnglishWord) {
    const newSelection = document.createElement("button");
    const container = document.querySelector('.centered-div');

    newSelection.innerText = EnglishWord;
    newSelection.className = "btn";

    container.appendChild(newSelection);
}

async function splitEnglish(sentence){
    const arrayWords = sentence.split(" ");
    arrayWords.sort(()=> Math.random()-0.5);
    arrayWords.forEach(element => {
        add(element);
    });
}

async function addSentence(){
    const obj = await getSentence();
    const arabic = obj.arabic_content;

    document.getElementById('sentence').innerText = arabic;
    await splitEnglish(obj.english_content);

}

addSentence();





