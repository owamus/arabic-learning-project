import translate from "translate"
import 'dotenv/config';
import * as deepl from 'deepl-node';
import client from "./db.js";

async function fetchWikiArabic(){
    const resp = await fetch("https://ar.wikipedia.org/w/api.php?action=query&prop=extracts&titles=%D8%AA%D8%A7%D8%B1%D9%8A%D8%AE&format=json&explaintext=true");
    return await resp.json();
}

async function getJSONObject(){
    let resp = await fetchWikiArabic();

    let obj = Object.keys(resp.query.pages);//

    return resp.query.pages[obj[0].toString()];

}

async function getArticleTitle(){
    let obj = getJSONObject();
    return obj.title;
}

async function splittingData(){

    let resp = await getArabicData();
    console.log(resp.extract);

    //Splitting article into sentences, removing irrelevancies
    var sentences = resp.extract.split(".");

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


    const result = await deeplClient.translateText(content[0].toString(), null, 'en-GB');
    console.log(result.text);
    var title = getArticleTitle();

    for(var sentence of content){

        var text = await translate(sentence, "en");
        console.log(text)
        const query = {
        text: 'INSERT INTO articles(article_content, article_english,category) VALUES($1, $2, $3) RETURNING *',
        values: [sentence, text, title],
        }

        const res = await client.query(query)
        console.log(res.rows[0])
    }


}

getArabicData();

