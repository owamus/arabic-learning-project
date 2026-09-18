import express from 'express';
import sentencesModels from 'sentencesModels.js';

async function getSentence(req,res){
    const category = req.query.category; //e.g 'History'
    const sentenceObj = sentencesModels.getRandomSentence(category);
    const sentence  = sentenceObj.arabic_content;


}