import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import sentenceRoutes from './routes/sentenceRoutes.js';

const app = express();
const port = process.env.PORT || 3000; // hosts set PORT themselves

// Hosts (Render, Railway...) sit behind a proxy; this lets rate limiting see the real visitor IP.
app.set('trust proxy', 1);
app.use(express.json());

// The site is served by this same server, so normal visitors need no CORS at all.
// Only these origins may call the API from elsewhere (local Live Server + anything in CORS_ORIGIN).
const allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    ...(process.env.CORS_ORIGIN || '').split(',').map(o => o.trim()).filter(Boolean)
];
app.use(cors({ origin: allowedOrigins }));

// Basic abuse protection. The GIF route is tighter because it spends the Giphy quota.
app.use('/api', rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }));
app.use('/api/gif', rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: true, legacyHeaders: false }));

app.use('/api', sentenceRoutes);

app.get('/health', (req, res) => res.send('ok'));

// Serve the website itself (frontend folder) so one deployment does everything.
const frontendDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../../frontend');
app.use(express.static(frontendDir));

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
