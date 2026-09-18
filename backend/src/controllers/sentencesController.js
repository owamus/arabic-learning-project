import express from 'express';
import sentencesModels from 'sentencesModels.js';

async function getSentence(req,res){
    const category = req.query.category; //e.g 'History'
    const sentenceObj = await sentencesModels.getRandomSentence(category);
    res.json(sentenceObj);
}

