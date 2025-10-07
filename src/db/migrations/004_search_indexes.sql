CREATE INDEX IF NOT EXISTS idx_users_username_lower ON users (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_posts_caption_lower ON posts (LOWER(caption));
-- Optional (enable pg_trgm first):
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_posts_caption_trgm ON posts USING GIN (caption gin_trgm_ops);
