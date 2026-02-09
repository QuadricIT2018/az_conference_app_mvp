-- Add venue_maps JSONB column to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_maps JSONB NOT NULL DEFAULT '[]'::jsonb;
