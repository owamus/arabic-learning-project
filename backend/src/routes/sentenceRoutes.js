import express from 'express';
import getSentence from '../controllers/sentencesController.js';
import getGif from '../controllers/gifController.js';
const router = express.Router();


router.get('/', getSentence);
router.get('/gif', getGif);

export default router;