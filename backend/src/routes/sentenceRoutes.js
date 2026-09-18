import express from 'express';
import sentencesController from 'sentencesController.js';
const router = express.Router();


router.get('/sentence', (req,res)=>{
    const sentence = sentencesController.getSentence(req,res);
    res.json(sentence);
});

router.get()