
const http = require('http');

http.createServer((request, response)=> {
    response.console.log('server runs smmooothly');
}).listen(8080);

console.log('Hello world');

let message = "ok dude, what the flip";
var words = message.split(" ");
let word = 'crazi';
var chars = word.split('');

for (let i=0; i<words.length;i++){
    console.log(words[i]);
    console.log(chars[i]);
}
