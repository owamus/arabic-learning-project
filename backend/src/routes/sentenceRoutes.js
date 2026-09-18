import express from 'express';
import sentencesController from 'sentencesController.js';
const router = express.Router();


router.get('/', sentencesController.getSentence());

