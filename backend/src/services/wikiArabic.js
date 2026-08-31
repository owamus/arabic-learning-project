
async function grabArabic(){
    const response = await fetch("https://ar.wikipedia.org/w/api.php?action=query&prop=extracts&titles=%D8%AA%D8%A7%D8%B1%D9%8A%D8%AE&format=json&explaintext=true"); // need to get individual sentences

    if(!response.ok){
        throw new error("could not find resource");
    }
    const arabic = response.json();
    console.log(arabic);

}
grabArabic();