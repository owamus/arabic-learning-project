-- Schema for the Arabic sentence builder.
-- Run once:  psql "$DATABASE_URL" -f schema.sql
-- Safe to re-run (everything is IF NOT EXISTS).

CREATE TABLE IF NOT EXISTS sentences (
    id            SERIAL PRIMARY KEY,
    arabic        TEXT    NOT NULL,                 -- full tashkeel, for display
    arabic_plain  TEXT    NOT NULL UNIQUE,          -- no diacritics, for search + dedupe
    english       TEXT    NOT NULL,
    level         TEXT    NOT NULL CHECK (level IN ('A1', 'A2', 'B1', 'B2')),
    topic         TEXT,
    word_count    INTEGER NOT NULL,
    source        TEXT    NOT NULL DEFAULT 'ai_generated'
);

CREATE TABLE IF NOT EXISTS words (
    id    SERIAL PRIMARY KEY,
    word  TEXT NOT NULL UNIQUE                      -- plain (undiacritized) surface form
);

-- Junction table: a sentence has many words, a word appears in many sentences.
CREATE TABLE IF NOT EXISTS sentence_words (
    sentence_id  INTEGER NOT NULL REFERENCES sentences(id) ON DELETE CASCADE,
    word_id      INTEGER NOT NULL REFERENCES words(id),
    position     INTEGER NOT NULL,                  -- 1-based position in the sentence
    PRIMARY KEY (sentence_id, position)
);

CREATE INDEX IF NOT EXISTS idx_sentence_words_word_id ON sentence_words (word_id);
CREATE INDEX IF NOT EXISTS idx_sentences_level        ON sentences (level);
