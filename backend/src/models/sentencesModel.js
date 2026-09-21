import express from 'express';
import client from "../db.js";


async function getRandomSentence(category){
    console.log('Query starting with category:', category);
    const query = {
        text: 'SELECT * FROM sentences WHERE category = $1 ORDER BY RANDOM() LIMIT 1',
        values: [category],
    };
    const res = await client.query(query);
    console.log('Query finished, got rows:', res.rows.length);
    return res.rows[0];
}

export default getRandomSentence;
