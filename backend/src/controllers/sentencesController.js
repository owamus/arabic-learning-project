import express from 'express';
import getRandomSentence from '../models/sentencesModel.js';

async function getSentence(req,res){
    console.log('CONTROLLER HIT')
    const category = req.query.category; //e.g 'History'
    const sentenceObj = await getRandomSentence(category);
    res.json(sentenceObj);
}

export default getSentence;