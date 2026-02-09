-- Create event_days table to store generated days for each event
CREATE TABLE IF NOT EXISTS event_days (
    id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    day_date DATE NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_event_days_event ON event_days(event_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_event_days_unique ON event_days(event_id, day_date);
