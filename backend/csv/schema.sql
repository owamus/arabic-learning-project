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
    arabic_form  TEXT,                              -- the word as written in the sentence (with diacritics)
    english      TEXT,                              -- English word(s) this Arabic word covers, e.g. "the university"
    role         TEXT,                              -- grammar role: subject, predicate, verb, doer, object, ...
    PRIMARY KEY (sentence_id, position)
);

-- For databases created before the gloss columns existed (safe to re-run):
ALTER TABLE sentence_words ADD COLUMN IF NOT EXISTS arabic_form TEXT;
ALTER TABLE sentence_words ADD COLUMN IF NOT EXISTS english     TEXT;
ALTER TABLE sentence_words ADD COLUMN IF NOT EXISTS role        TEXT;
ALTER TABLE sentences      ADD COLUMN IF NOT EXISTS sentence_type TEXT;  -- nominal / verbal / question / conditional
ALTER TABLE sentences      ADD COLUMN IF NOT EXISTS gif_keyword   TEXT;  -- search phrase for the GIF shown after answering

CREATE INDEX IF NOT EXISTS idx_sentence_words_word_id ON sentence_words (word_id);
CREATE INDEX IF NOT EXISTS idx_sentences_level        ON sentences (level);
