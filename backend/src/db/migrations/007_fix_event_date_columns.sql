-- Fix timezone offset: change event date columns from TIMESTAMP to DATE
-- TIMESTAMP WITHOUT TIME ZONE causes timezone shifts when pg driver serializes to JSON
ALTER TABLE events ALTER COLUMN event_start_date TYPE DATE USING event_start_date::date;
ALTER TABLE events ALTER COLUMN event_end_date TYPE DATE USING event_end_date::date;
