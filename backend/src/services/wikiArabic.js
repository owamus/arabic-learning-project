import translate from "translate"
import Pool from './db.js'
import 'dotenv/config';
import * as deepl from 'deepl-node';

async function fetchWikiArabic(){
    const resp = await fetch("https://ar.wikipedia.org/w/api.php?action=query&prop=extracts&titles=%D8%AA%D8%A7%D8%B1%D9%8A%D8%AE&format=json&explaintext=true")
        .then((response)=> {
            return response.json(); //this tears open the envelope so we can get the content info
        })// and not the envelope info with headers and status

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

    return sentences;
}

async function translateData(){
    var content = await splittingData();
    console.log(content.length);

    let halflen = content.length/2;
    content.splice(halflen,halflen) //only adding half of the articles content, deleting the other half

    const authKey = process.env.DEEPL_KEY;
    const deeplClient = new deepl.DeepLClient(authKey);

    (async () => {
        const result = await deeplClient.translateText(content[0].toString(), null, 'en-GB');
        console.log(result.text);
    })();

    // for(var sentence of content){

    //     var text = await translate(sentence, "en");
    //     console.log(text)

    // }




}



translateData();
