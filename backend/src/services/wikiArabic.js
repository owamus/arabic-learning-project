
async function grabArabic(){
    const resp = await fetch("https://ar.wikipedia.org/w/api.php?action=query&prop=extracts&titles=%D8%AA%D8%A7%D8%B1%D9%8A%D8%AE&format=json&explaintext=true")
        .then((response)=> {
            return response.json();
        })
    console.log(await resp);
}

grabArabic();