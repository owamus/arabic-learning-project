const pool = require('./db');

async function fetchWikiArabic(){
    const resp = await fetch("https://ar.wikipedia.org/w/api.php?action=query&prop=extracts&titles=%D8%AA%D8%A7%D8%B1%D9%8A%D8%AE&format=json&explaintext=true")
        .then((response)=> {
            return response.json(); //this tears open the envelope so we can get the content info
        })// and not the envelope info with headers and status
    console.log(await resp);
    return await resp;
}

async function getArabicData(){
    let resp = await fetchWikiArabic();

    let obj = Object.keys(resp.query.pages);

    return resp.query.pages[obj[0].toString()].extract;

}


async function splittingData(){

    let resp = await getArabicData();
    console.log(resp);

    //Splitting article into sentences, removing irrelevancies
    var sentences = resp.split(".");

    //getting rid of the newline and format string
    for (var i=0;i<sentences.length;i++){
        sentences[i] = sentences[i].replace(/\n/g,'').replace(/==/g,'').replace(/==\n/g,''); //removing crap
    }
    //getting rid of sentences that are not greater than 6 characters
    sentences = sentences.filter((sentence)=> sentence.length>6);
    console.log(sentences.length);

    return(sentences);
}
async function translateArabic(){
    const sentences = splittingData();
    let length = sentences.length;
    let quarterlen = (length*0.25);
    sentences.splice(quarterlen);
    console.log(sentences);
    // const req = await fetch('https://libretranslate.com/translate', {
    // method:'POST',
    // body: JSON.stringify({
    //     q: sentences.json(),
    //     source: "ar",
    //     target: "en",
    // }),
    // headers:{"Content-Type": "application/json"},
    // });
    // console.log(await req.json());


}

splittingData();
