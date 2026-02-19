-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

CREATE TABLE IF NOT EXISTS comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id     uuid NOT NULL,
  user_name   text NOT NULL,
  user_avatar text,
  provider    text NOT NULL CHECK (provider IN ('google', 'github')),
  content     text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at  timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments (post_id, created_at);

-- RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_public_read"
  ON comments FOR SELECT
  USING (true);
