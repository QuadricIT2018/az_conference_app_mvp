-- Regenerate all event_days from events table using pure SQL
-- This fixes any timezone-shifted dates from previous JS-based generation
DELETE FROM event_days;

INSERT INTO event_days (event_id, day_number, day_date)
SELECT
  e.id,
  ROW_NUMBER() OVER (PARTITION BY e.id ORDER BY gs.d)::int,
  gs.d::date
FROM events e
CROSS JOIN LATERAL generate_series(
  e.event_start_date::date,
  e.event_end_date::date,
  '1 day'::interval
) AS gs(d)
WHERE e.event_start_date IS NOT NULL
  AND e.event_end_date IS NOT NULL;
