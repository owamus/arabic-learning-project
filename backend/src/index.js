import express from 'express';
import sentenceRoutes from './routes/sentenceRoutes.js'
import cors from 'cors';

const app = express();
const port = 3000;
app.use(express.json());
app.use(cors());
const options = {

    origin: ['http://127.0.0.1:5500/frontend/']

};

app.use(cors(options));

app.use('/api', sentenceRoutes);

app.get('/', (req, res) => {
    console.log('ROOT ROUTE HIT');
    res.send('working');
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

//