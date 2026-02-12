import dotenv from 'dotenv';
dotenv.config();

import pool from '../config/database.js';

async function replaceData() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const eventId = 1;

    // 1. Update event record
    await client.query(`
      UPDATE events SET
        event_name = 'Demo Conference 2026',
        pwa_name = 'Demo Conference 2026',
        event_slug = 'demo-conf-2026',
        event_location = 'Grand Convention Center, San Diego',
        event_start_date = '2026-02-16',
        event_end_date = '2026-02-19',
        event_venue_map_url = 'https://www.aao.org/Assets/a4fee755-2a34-4c6b-8c29-053e35e15335/638864534243270000/aao-2025-official-academy-hotel-map-and-list-pdf?inline=1',
        venue_maps = $1::jsonb,
        updated_at = NOW()
      WHERE id = $2
    `, [
      JSON.stringify([{
        title: 'Venue Map',
        file_url: 'https://www.aao.org/Assets/a4fee755-2a34-4c6b-8c29-053e35e15335/638864534243270000/aao-2025-official-academy-hotel-map-and-list-pdf?inline=1',
      }]),
      eventId,
    ]);
    console.log('Updated event record');

    // 2. Delete old event_days and recreate
    await client.query('DELETE FROM event_days WHERE event_id = $1', [eventId]);
    const days = [
      { day_number: 1, day_date: '2026-02-16' },
      { day_number: 2, day_date: '2026-02-17' },
      { day_number: 3, day_date: '2026-02-18' },
      { day_number: 4, day_date: '2026-02-19' },
    ];
    for (const day of days) {
      await client.query(
        'INSERT INTO event_days (event_id, day_number, day_date) VALUES ($1, $2, $3)',
        [eventId, day.day_number, day.day_date]
      );
    }
    console.log('Replaced event days');

    // 3. Delete old sessions (cascades to favourites, session_topics, etc.)
    await client.query('DELETE FROM sessions WHERE event_id = $1', [eventId]);
    console.log('Deleted old sessions');

    // 4. Insert new sessions
    const sessions = [
      // Day 1: Feb 16
      { date: '2026-02-16', start: '08:00', end: '09:30', name: 'Registration & Check-In', tag: 'Registration', location: 'Main Lobby', desc: 'Badge pickup and welcome kits' },
      { date: '2026-02-16', start: '09:30', end: '10:00', name: 'Welcome Coffee & Networking', tag: 'Break/Open/Travel', location: 'Exhibit Hall A', desc: null },
      { date: '2026-02-16', start: '10:00', end: '11:30', name: 'Opening Keynote: The Future of Innovation', tag: 'Keynote', location: 'Grand Ballroom', desc: 'Join our CEO for an inspiring look at what lies ahead' },
      { date: '2026-02-16', start: '11:30', end: '12:00', name: 'Break', tag: 'Break/Open/Travel', location: null, desc: null },
      { date: '2026-02-16', start: '12:00', end: '13:00', name: 'Lunch', tag: 'Meals', location: 'California Terrace', desc: null },
      { date: '2026-02-16', start: '13:00', end: '14:30', name: 'Workshop: Design Thinking in Practice', tag: 'Workshop', location: 'Room 201', desc: 'Hands-on design sprint with real-world scenarios' },
      { date: '2026-02-16', start: '13:00', end: '14:30', name: 'Panel: Building Resilient Teams', tag: 'Panel Discussion', location: 'Room 302', desc: 'Industry leaders share strategies for high-performing teams' },
      { date: '2026-02-16', start: '14:30', end: '15:00', name: 'Afternoon Break & Refreshments', tag: 'Break/Open/Travel', location: 'Exhibit Hall A', desc: null },
      { date: '2026-02-16', start: '15:00', end: '16:30', name: 'Fireside Chat: Leadership in Uncertain Times', tag: 'Keynote', location: 'Grand Ballroom', desc: 'An intimate conversation on adaptive leadership' },
      { date: '2026-02-16', start: '16:30', end: '17:00', name: 'Break', tag: 'Break/Open/Travel', location: null, desc: null },
      { date: '2026-02-16', start: '17:00', end: '18:00', name: 'Networking Happy Hour', tag: 'Networking', location: 'Rooftop Lounge', desc: 'Drinks and appetizers with fellow attendees' },
      { date: '2026-02-16', start: '18:30', end: '21:00', name: 'Welcome Dinner', tag: 'Meals', location: 'Harbor Ballroom', desc: 'Three-course dinner with live entertainment' },

      // Day 2: Feb 17
      { date: '2026-02-17', start: '06:30', end: '07:15', name: 'Morning Yoga & Wellness', tag: 'Wellness', location: 'Garden Courtyard', desc: null },
      { date: '2026-02-17', start: '07:00', end: '08:30', name: 'Breakfast', tag: 'Meals', location: 'California Terrace', desc: null },
      { date: '2026-02-17', start: '08:30', end: '10:00', name: 'Keynote: AI & the Next Decade', tag: 'Keynote', location: 'Grand Ballroom', desc: 'How artificial intelligence is reshaping industries' },
      { date: '2026-02-17', start: '10:00', end: '10:30', name: 'Coffee Break', tag: 'Break/Open/Travel', location: 'Exhibit Hall A', desc: null },
      { date: '2026-02-17', start: '10:30', end: '12:00', name: 'Workshop: Data-Driven Decision Making', tag: 'Workshop', location: 'Room 201', desc: 'From raw data to actionable insights' },
      { date: '2026-02-17', start: '10:30', end: '12:00', name: 'Panel: Sustainability in Business', tag: 'Panel Discussion', location: 'Room 302', desc: 'Balancing profit and planet' },
      { date: '2026-02-17', start: '12:00', end: '13:15', name: 'Lunch & Headshots', tag: 'Meals', location: 'California Terrace', desc: null },
      { date: '2026-02-17', start: '13:15', end: '14:45', name: 'Workshop: Effective Communication Strategies', tag: 'Workshop', location: 'Room 201', desc: 'Master the art of persuasive communication' },
      { date: '2026-02-17', start: '13:15', end: '14:45', name: 'Roundtable: Remote Work Best Practices', tag: 'Panel Discussion', location: 'Room 105', desc: 'Lessons learned from distributed teams worldwide' },
      { date: '2026-02-17', start: '14:45', end: '15:15', name: 'Afternoon Break', tag: 'Break/Open/Travel', location: 'Exhibit Hall A', desc: null },
      { date: '2026-02-17', start: '15:15', end: '16:45', name: 'Workshop: Product Strategy Masterclass', tag: 'Workshop', location: 'Room 302', desc: 'Build products customers love' },
      { date: '2026-02-17', start: '15:15', end: '16:45', name: 'Tech Talk: Cloud Architecture Patterns', tag: 'Development Sessions', location: 'Room 201', desc: 'Scalable and resilient cloud solutions' },
      { date: '2026-02-17', start: '17:00', end: '18:00', name: 'Lightning Talks', tag: 'Development Sessions', location: 'Grand Ballroom', desc: 'Six speakers, six minutes each — rapid-fire insights' },
      { date: '2026-02-17', start: '18:30', end: '21:00', name: 'Gala Dinner & Awards', tag: 'Meals', location: 'Harbor Ballroom', desc: 'Celebrating excellence and innovation' },

      // Day 3: Feb 18
      { date: '2026-02-18', start: '06:30', end: '07:15', name: 'Fitness Activities', tag: 'Wellness', location: 'Hotel Gym', desc: null },
      { date: '2026-02-18', start: '07:00', end: '08:30', name: 'Breakfast', tag: 'Meals', location: 'California Terrace', desc: null },
      { date: '2026-02-18', start: '08:30', end: '10:00', name: 'Keynote: The Human Side of Technology', tag: 'Keynote', location: 'Grand Ballroom', desc: 'Putting people first in a digital world' },
      { date: '2026-02-18', start: '10:00', end: '10:30', name: 'Coffee Break', tag: 'Break/Open/Travel', location: 'Exhibit Hall A', desc: null },
      { date: '2026-02-18', start: '10:30', end: '12:00', name: 'Workshop: Agile at Scale', tag: 'Workshop', location: 'Room 201', desc: 'Scaling agile practices across large organizations' },
      { date: '2026-02-18', start: '10:30', end: '12:00', name: 'Panel: Cybersecurity Trends 2026', tag: 'Panel Discussion', location: 'Room 302', desc: 'Protecting your organization in the modern threat landscape' },
      { date: '2026-02-18', start: '12:00', end: '13:15', name: 'Lunch', tag: 'Meals', location: 'California Terrace', desc: null },
      { date: '2026-02-18', start: '13:15', end: '14:45', name: 'Workshop: Customer Experience Design', tag: 'Workshop', location: 'Room 105', desc: 'Map and optimize your customer journey' },
      { date: '2026-02-18', start: '13:15', end: '14:45', name: 'Tech Talk: Microservices vs Monoliths', tag: 'Development Sessions', location: 'Room 201', desc: 'Choosing the right architecture for your scale' },
      { date: '2026-02-18', start: '14:45', end: '15:15', name: 'Afternoon Break', tag: 'Break/Open/Travel', location: 'Exhibit Hall A', desc: null },
      { date: '2026-02-18', start: '15:15', end: '16:30', name: 'Interactive Session: Innovation Lab', tag: 'Workshop', location: 'Room 302', desc: 'Prototype and pitch your ideas in teams' },
      { date: '2026-02-18', start: '16:30', end: '17:00', name: 'Break', tag: 'Break/Open/Travel', location: null, desc: null },
      { date: '2026-02-18', start: '17:00', end: '18:00', name: 'Closing Keynote: What We Learned', tag: 'Keynote', location: 'Grand Ballroom', desc: 'Key takeaways and the road ahead' },
      { date: '2026-02-18', start: '18:00', end: '18:30', name: 'Transport to Gaslamp District', tag: 'Break/Open/Travel', location: null, desc: null },
      { date: '2026-02-18', start: '18:30', end: '21:00', name: 'Farewell Dinner & Entertainment', tag: 'Meals', location: 'Gaslamp Quarter Restaurant', desc: null },

      // Day 4: Feb 19
      { date: '2026-02-19', start: '07:00', end: '09:00', name: 'Breakfast', tag: 'Meals', location: 'California Terrace', desc: null },
      { date: '2026-02-19', start: '09:00', end: '10:00', name: 'Wrap-Up & Feedback Session', tag: 'Development Sessions', location: 'Room 201', desc: 'Share your thoughts and help us improve' },
      { date: '2026-02-19', start: '10:00', end: '23:59', name: 'Departures at Your Leisure', tag: 'Break/Open/Travel', location: null, desc: 'Safe travels! See you next year.' },
    ];

    for (const sess of sessions) {
      await client.query(`
        INSERT INTO sessions (
          event_id, session_name, session_description, session_date,
          session_start_time, session_end_time, session_tag, session_location,
          is_generic, department, is_dept_generic, team
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true, null, true, null)
      `, [
        eventId,
        sess.name,
        sess.desc,
        sess.date,
        sess.start,
        sess.end,
        sess.tag,
        sess.location,
      ]);
    }
    console.log(`Inserted ${sessions.length} new sessions`);

    // 5. Clear favourites (old session IDs no longer exist)
    await client.query('DELETE FROM user_favourite_sessions');
    console.log('Cleared old favourites');

    await client.query('COMMIT');
    console.log('All done! Backend data replaced successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error replacing data:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

replaceData();
