import express from 'express';
import sentenceRoutes from './routes/sentenceRoutes.js'
import cors from 'cors';

const app = express();
const port = 3000;

app.use(express.json());
app.use(cors({origin: 'file:///Users/owaismustafa/Arabic%20Learning%20Project/frontend/index.html'}))
app.use('/api', sentenceRoutes);

app.get('/', (req, res) => {
    console.log('ROOT ROUTE HIT');
    res.send('working');
});

app.listen(port, () => {
    console.log(`Server running athttp://localhost:${port}`);
});

//