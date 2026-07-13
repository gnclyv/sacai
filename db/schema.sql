-- Hairstyle AI - Neon Postgres schema
-- Bu faylı Neon SQL Editor-də və ya `npm run db:init` ilə işə salın

CREATE TABLE IF NOT EXISTS analyses (
    id SERIAL PRIMARY KEY,
    session_id UUID NOT NULL,
    face_shape TEXT NOT NULL,
    hair_type TEXT,
    length_preference TEXT,
    suggestions JSONB NOT NULL,
    thumbnail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analyses_session_id ON analyses (session_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON analyses (created_at DESC);
