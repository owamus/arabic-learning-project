
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

async function splitJSONData(){

   let resp = await getArabicData();

   console.log(resp);





}

splitJSONData();
