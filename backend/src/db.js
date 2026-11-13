import pg from 'pg';

// The connection string comes from the environment (backend/.env locally,
// the hosting dashboard when deployed), so no password lives in the code.
if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set. Add it to backend/.env (see .env.example).');
}

// A pool (not a single client) reconnects by itself if the hosted database drops an idle connection.
// For hosted databases the URL should end with ?sslmode=require.
const client = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000
});

client.query('SELECT 1')
    .then(() => console.log('✅ Connected!'))
    .catch(err => console.error('❌ Failed:', err.message));

export default client;
