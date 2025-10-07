ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS mood_enabled BOOLEAN DEFAULT false;
