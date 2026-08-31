
const http = require('http');
try{


http.createServer((request, response)=> {
    console.log('server runs smmooothly');
    response.end("hellow");
}).listen(8087);


}
catch(err){
    console.log(err);
}


