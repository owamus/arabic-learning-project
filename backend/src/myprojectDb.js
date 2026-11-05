import {Client} from 'pg'

const client = new Client ({
    host:'localhost',
    port: 5432,
    user:'postgres',
    password:'',
    database:'myproject',
    connectionTimeoutMillis: 5000
});

client.connect()
  .then(() => {console.log('✅ Connected!');
    })
    .catch(err => console.error('❌ Failed:', err.message));

export default client;