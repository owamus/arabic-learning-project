import express from 'express';
import getSentence from '../controllers/sentencesController.js';
const router = express.Router();


router.get('/', getSentence);

export default router;