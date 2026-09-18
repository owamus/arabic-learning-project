import express from 'express';
import sentenceRoutes from 'sentenceRoutes.js'
const app = express();
const port = 8087;

app.use(express.json());

app.use('/api', sentenceRoutes);


app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});