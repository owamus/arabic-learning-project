import {Pool} from 'pg'

const pool = new Pool ({ //using pool allows for multiple db connections
    host:'localhost',
    port: 5432,
    user:'postgres',
    password:'',
    database:'myproject',
    connectionTimeoutMillis: 5000
});

pool.connect()
  .then(() => {console.log('✅ Connected!');
    return client.query('SELECT * FROM words');
    })
    .then(result => {
    console.log(result.rows);})
    .catch(err => console.error('❌ Failed:', err.message));

export default pool;