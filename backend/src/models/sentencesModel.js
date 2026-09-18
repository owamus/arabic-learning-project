import express from 'express';
import client from "../db.js";


async function getRandomSentence(category){
    const query = {
        text: 'SELECT * FROM articles WHERE category = $1 ORDER BY RANDOM() LIMIT 1',
        values: [category],
    };
    const res = await client.query(query);
    return res.rows[0];
}

