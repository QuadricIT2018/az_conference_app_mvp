// Static hardcoded data — standalone Vercel deployment (demo)

export const STATIC_USER = {
  id: 1,
  email: 'john.doe@company.com',
  department: 'ALL',
  team: '',
  isAdmin: false,
}

export const STATIC_TOKEN = 'static-demo-token'

export const STATIC_PROFILE = {
  id: 1,
  email: 'john.doe@company.com',
  department: 'ALL',
  team: '',
  last_login: '2026-02-12 13:55:18.03678',
  created_at: '2026-02-06 10:18:13.035073',
}

export const STATIC_PUBLISHED_EVENTS = [
  {
    id: 1,
    event_slug: 'demo-conf-2026',
    pwa_name: 'Demo Conference 2026',
    event_name: 'Demo Conference 2026',
    event_start_date: '2026-02-16',
    event_end_date: '2026-02-19',
    event_location: 'Grand Convention Center, San Diego',
  },
]

export const STATIC_EVENT = {
  id: 1,
  event_slug: 'demo-conf-2026',
  pwa_name: 'Demo Conference 2026',
  pwa_logo_url: null,
  event_name: 'Demo Conference 2026',
  event_banner_url: null,
  event_description: null,
  department: 'ALL',
  event_location: 'Grand Convention Center, San Diego',
  event_location_map_url: 'https://maps.app.goo.gl/wNGRCnWTKjAoCiFbA',
  event_start_date: '2026-02-16',
  event_end_date: '2026-02-19',
  event_venue_map_url: 'https://www.aao.org/Assets/a4fee755-2a34-4c6b-8c29-053e35e15335/638864534243270000/aao-2025-official-academy-hotel-map-and-list-pdf?inline=1',
  event_app_url: null,
  manifest_url: null,
  event_banners: {
    mobile: { file_url: '', original_name: '' },
    tablet: { file_url: '', original_name: '' },
    desktop: { file_url: '', original_name: '' },
  },
  venue_maps: [
    {
      title: 'Venue Map',
      file_url: 'https://www.aao.org/Assets/a4fee755-2a34-4c6b-8c29-053e35e15335/638864534243270000/aao-2025-official-academy-hotel-map-and-list-pdf?inline=1',
    },
  ],
  quick_links: [],
}

export const STATIC_DAYS = [
  { id: 1, day_number: 1, day_date: '2026-02-16' },
  { id: 2, day_number: 2, day_date: '2026-02-17' },
  { id: 3, day_number: 3, day_date: '2026-02-18' },
  { id: 4, day_number: 4, day_date: '2026-02-19' },
]

export const STATIC_DEPARTMENTS: { id: number; name: string }[] = []

export const STATIC_UPDATES: unknown[] = []

export const INITIAL_FAVOURITE_IDS = new Set([2, 8, 15, 22])

// Helper
function s(
  id: number,
  date: string,
  start: string,
  end: string,
  name: string,
  tag: string,
  location: string | null,
  description: string | null = null,
  isGeneric = true,
) {
  return {
    id,
    event_id: 1,
    session_name: name,
    session_description: description,
    session_date: date,
    session_start_time: start,
    session_end_time: end,
    session_tag: tag,
    session_location: location,
    session_location_map_url: null,
    session_venue_map_url: null,
    created_at: '2026-02-01 00:00:00',
    updated_at: '2026-02-01 00:00:00',
    is_generic: isGeneric,
    department: null,
    is_dept_generic: true,
    team: null,
    timezone: null,
    has_topics: false,
    survey_url: null,
    supporting_material_url: null,
    event_slug: 'demo-conf-2026',
    event_name: 'Demo Conference 2026',
    is_favourite: false,
  }
}

export const STATIC_SESSIONS = [
  // ── Day 1: Feb 16 (Mon) — Arrivals & Opening ──
  s(1, '2026-02-16', '08:00:00', '09:30:00', 'Registration & Check-In', 'Registration', 'Main Lobby', 'Badge pickup and welcome kits'),
  s(2, '2026-02-16', '09:30:00', '10:00:00', 'Welcome Coffee & Networking', 'Break/Open/Travel', 'Exhibit Hall A'),
  s(3, '2026-02-16', '10:00:00', '11:30:00', 'Opening Keynote: The Future of Innovation', 'Keynote', 'Grand Ballroom', 'Join our CEO for an inspiring look at what lies ahead'),
  s(4, '2026-02-16', '11:30:00', '12:00:00', 'Break', 'Break/Open/Travel', null),
  s(5, '2026-02-16', '12:00:00', '13:00:00', 'Lunch', 'Meals', 'California Terrace'),
  s(6, '2026-02-16', '13:00:00', '14:30:00', 'Workshop: Design Thinking in Practice', 'Workshop', 'Room 201', 'Hands-on design sprint with real-world scenarios'),
  s(7, '2026-02-16', '13:00:00', '14:30:00', 'Panel: Building Resilient Teams', 'Panel Discussion', 'Room 302', 'Industry leaders share strategies for high-performing teams'),
  s(8, '2026-02-16', '14:30:00', '15:00:00', 'Afternoon Break & Refreshments', 'Break/Open/Travel', 'Exhibit Hall A'),
  s(9, '2026-02-16', '15:00:00', '16:30:00', 'Fireside Chat: Leadership in Uncertain Times', 'Keynote', 'Grand Ballroom', 'An intimate conversation on adaptive leadership'),
  s(10, '2026-02-16', '16:30:00', '17:00:00', 'Break', 'Break/Open/Travel', null),
  s(11, '2026-02-16', '17:00:00', '18:00:00', 'Networking Happy Hour', 'Networking', 'Rooftop Lounge', 'Drinks and appetizers with fellow attendees'),
  s(12, '2026-02-16', '18:30:00', '21:00:00', 'Welcome Dinner', 'Meals', 'Harbor Ballroom', 'Three-course dinner with live entertainment'),

  // ── Day 2: Feb 17 (Tue) — Deep Dives ──
  s(13, '2026-02-17', '06:30:00', '07:15:00', 'Morning Yoga & Wellness', 'Wellness', 'Garden Courtyard'),
  s(14, '2026-02-17', '07:00:00', '08:30:00', 'Breakfast', 'Meals', 'California Terrace'),
  s(15, '2026-02-17', '08:30:00', '10:00:00', 'Keynote: AI & the Next Decade', 'Keynote', 'Grand Ballroom', 'How artificial intelligence is reshaping industries'),
  s(16, '2026-02-17', '10:00:00', '10:30:00', 'Coffee Break', 'Break/Open/Travel', 'Exhibit Hall A'),
  s(17, '2026-02-17', '10:30:00', '12:00:00', 'Workshop: Data-Driven Decision Making', 'Workshop', 'Room 201', 'From raw data to actionable insights'),
  s(18, '2026-02-17', '10:30:00', '12:00:00', 'Panel: Sustainability in Business', 'Panel Discussion', 'Room 302', 'Balancing profit and planet'),
  s(19, '2026-02-17', '12:00:00', '13:15:00', 'Lunch & Headshots', 'Meals', 'California Terrace'),
  s(20, '2026-02-17', '13:15:00', '14:45:00', 'Workshop: Effective Communication Strategies', 'Workshop', 'Room 201', 'Master the art of persuasive communication'),
  s(21, '2026-02-17', '13:15:00', '14:45:00', 'Roundtable: Remote Work Best Practices', 'Panel Discussion', 'Room 105', 'Lessons learned from distributed teams worldwide'),
  s(22, '2026-02-17', '14:45:00', '15:15:00', 'Afternoon Break', 'Break/Open/Travel', 'Exhibit Hall A'),
  s(23, '2026-02-17', '15:15:00', '16:45:00', 'Workshop: Product Strategy Masterclass', 'Workshop', 'Room 302', 'Build products customers love'),
  s(24, '2026-02-17', '15:15:00', '16:45:00', 'Tech Talk: Cloud Architecture Patterns', 'Development Sessions', 'Room 201', 'Scalable and resilient cloud solutions'),
  s(25, '2026-02-17', '17:00:00', '18:00:00', 'Lightning Talks', 'Development Sessions', 'Grand Ballroom', 'Six speakers, six minutes each — rapid-fire insights'),
  s(26, '2026-02-17', '18:30:00', '21:00:00', 'Gala Dinner & Awards', 'Meals', 'Harbor Ballroom', 'Celebrating excellence and innovation'),

  // ── Day 3: Feb 18 (Wed) — Workshops & Collaboration ──
  s(27, '2026-02-18', '06:30:00', '07:15:00', 'Fitness Activities', 'Wellness', 'Hotel Gym'),
  s(28, '2026-02-18', '07:00:00', '08:30:00', 'Breakfast', 'Meals', 'California Terrace'),
  s(29, '2026-02-18', '08:30:00', '10:00:00', 'Keynote: The Human Side of Technology', 'Keynote', 'Grand Ballroom', 'Putting people first in a digital world'),
  s(30, '2026-02-18', '10:00:00', '10:30:00', 'Coffee Break', 'Break/Open/Travel', 'Exhibit Hall A'),
  s(31, '2026-02-18', '10:30:00', '12:00:00', 'Workshop: Agile at Scale', 'Workshop', 'Room 201', 'Scaling agile practices across large organizations'),
  s(32, '2026-02-18', '10:30:00', '12:00:00', 'Panel: Cybersecurity Trends 2026', 'Panel Discussion', 'Room 302', 'Protecting your organization in the modern threat landscape'),
  s(33, '2026-02-18', '12:00:00', '13:15:00', 'Lunch', 'Meals', 'California Terrace'),
  s(34, '2026-02-18', '13:15:00', '14:45:00', 'Workshop: Customer Experience Design', 'Workshop', 'Room 105', 'Map and optimize your customer journey'),
  s(35, '2026-02-18', '13:15:00', '14:45:00', 'Tech Talk: Microservices vs Monoliths', 'Development Sessions', 'Room 201', 'Choosing the right architecture for your scale'),
  s(36, '2026-02-18', '14:45:00', '15:15:00', 'Afternoon Break', 'Break/Open/Travel', 'Exhibit Hall A'),
  s(37, '2026-02-18', '15:15:00', '16:30:00', 'Interactive Session: Innovation Lab', 'Workshop', 'Room 302', 'Prototype and pitch your ideas in teams'),
  s(38, '2026-02-18', '16:30:00', '17:00:00', 'Break', 'Break/Open/Travel', null),
  s(39, '2026-02-18', '17:00:00', '18:00:00', 'Closing Keynote: What We Learned', 'Keynote', 'Grand Ballroom', 'Key takeaways and the road ahead'),
  s(40, '2026-02-18', '18:00:00', '18:30:00', 'Transport to Gaslamp District', 'Break/Open/Travel', null),
  s(41, '2026-02-18', '18:30:00', '21:00:00', 'Farewell Dinner & Entertainment', 'Meals', 'Gaslamp Quarter Restaurant'),

  // ── Day 4: Feb 19 (Thu) — Departures ──
  s(42, '2026-02-19', '07:00:00', '09:00:00', 'Breakfast', 'Meals', 'California Terrace'),
  s(43, '2026-02-19', '09:00:00', '10:00:00', 'Wrap-Up & Feedback Session', 'Development Sessions', 'Room 201', 'Share your thoughts and help us improve'),
  s(44, '2026-02-19', '10:00:00', '23:59:00', 'Departures at Your Leisure', 'Break/Open/Travel', null, 'Safe travels! See you next year.'),
]
