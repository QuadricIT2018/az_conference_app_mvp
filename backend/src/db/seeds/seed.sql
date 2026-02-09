-- Conference Management System - Seed Data
-- Run this after the migration to populate sample data

-- =====================================================
-- SAMPLE ADMINS
-- password for all sample users: password123
-- bcrypt hash: $2a$12$h2fZMWA6IUDiXfKShcSGcuq6/vxs.uUHO8aKMIsc/6JBI3FkTT0a2
-- =====================================================
INSERT INTO admins (email, password_hash, department) VALUES
('admin@conference.com', '$2a$12$h2fZMWA6IUDiXfKShcSGcuq6/vxs.uUHO8aKMIsc/6JBI3FkTT0a2', 'ALL'),
('admin.eng@conference.com', '$2a$12$h2fZMWA6IUDiXfKShcSGcuq6/vxs.uUHO8aKMIsc/6JBI3FkTT0a2', 'Engineering')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE DEPARTMENTS
-- =====================================================
INSERT INTO departments (name) VALUES
('ALL'),
('Engineering'),
('Marketing'),
('Sales'),
('Human Resources'),
('BREAST'),
('G1')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE TEAMS
-- =====================================================
INSERT INTO teams (department_id, name) VALUES
((SELECT id FROM departments WHERE name = 'BREAST'), 'Team Alpha'),
((SELECT id FROM departments WHERE name = 'BREAST'), 'Team Beta'),
((SELECT id FROM departments WHERE name = 'BREAST'), 'Team Gamma'),
((SELECT id FROM departments WHERE name = 'Engineering'), 'Frontend'),
((SELECT id FROM departments WHERE name = 'Engineering'), 'Backend'),
((SELECT id FROM departments WHERE name = 'Marketing'), 'Digital Marketing')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE SESSION TAGS
-- =====================================================
INSERT INTO session_tags (name) VALUES
('Keynote'),
('Workshop'),
('Panel'),
('Networking'),
('Technical'),
('Business')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE SPEAKERS
-- =====================================================
INSERT INTO speakers (speaker_name, speaker_designation, speaker_about, speaker_occupation, department) VALUES
('Dr. Emily Chen', 'Chief Technology Officer', 'Dr. Emily Chen is a renowned technology leader with over 20 years of experience.', 'CTO', 'Engineering'),
('Marcus Johnson', 'VP of Engineering', 'Marcus is a passionate engineering leader focused on building high-performing teams.', 'VP Engineering', 'Engineering'),
('Dr. Sarah Williams', 'AI Research Director', 'Dr. Williams leads cutting-edge AI research.', 'Research Director', 'Engineering'),
('David Park', 'Product Director', 'David has launched over 50 successful products.', 'Product Director', 'Marketing'),
('Rachel Torres', 'Marketing Executive', 'Rachel is a marketing visionary.', 'Marketing Exec', 'Marketing')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE EVENT
-- =====================================================
INSERT INTO events (event_slug, pwa_name, event_name, event_description, event_location, event_start_date, event_end_date, wifi, helpdesk, is_draft) VALUES
('tech-summit-2026', 'Tech Summit', 'Tech Summit 2026', 'Annual technology conference bringing together industry leaders.', 'Grand Convention Center', '2026-03-15 09:00:00', '2026-03-17 18:00:00',
'[{"title": "Guest WiFi", "desc": "Available in all conference areas", "wifi_name": "TechSummit_Guest", "wifi_password": "Welcome2026!"}]',
'[{"title": "Main Help Desk", "desc": "Lobby Level 1", "start_time": "08:00", "end_time": "19:00", "contact_numbers": ["+1-555-0100"], "contact_emails": ["help@techsummit.com"]}]',
false)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE ATTENDEES
-- password for all sample users: password123
-- =====================================================
INSERT INTO attendees (email, password_hash, department, team) VALUES
('john.doe@company.com', '$2a$12$h2fZMWA6IUDiXfKShcSGcuq6/vxs.uUHO8aKMIsc/6JBI3FkTT0a2', 'Engineering', 'Frontend'),
('jane.smith@company.com', '$2a$12$h2fZMWA6IUDiXfKShcSGcuq6/vxs.uUHO8aKMIsc/6JBI3FkTT0a2', 'Engineering', 'Backend'),
('mike.wilson@company.com', '$2a$12$h2fZMWA6IUDiXfKShcSGcuq6/vxs.uUHO8aKMIsc/6JBI3FkTT0a2', 'Marketing', 'Digital Marketing'),
('sarah.jones@company.com', '$2a$12$h2fZMWA6IUDiXfKShcSGcuq6/vxs.uUHO8aKMIsc/6JBI3FkTT0a2', 'Sales', NULL),
('tom.brown@company.com', '$2a$12$h2fZMWA6IUDiXfKShcSGcuq6/vxs.uUHO8aKMIsc/6JBI3FkTT0a2', 'Human Resources', NULL)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE SESSIONS
-- =====================================================
INSERT INTO sessions (event_id, session_name, session_description, session_date, session_start_time, session_end_time, session_tag, session_location, is_generic, is_dept_generic, has_topics, timezone) VALUES
-- Generic sessions (visible to all)
((SELECT id FROM events WHERE event_slug = 'tech-summit-2026'), 'Opening Keynote: The Future of Technology', 'Join us for an inspiring opening keynote.', '2026-03-15', '09:00', '10:00', 'Keynote', 'Main Hall', true, true, false, 'Asia/Kolkata'),
((SELECT id FROM events WHERE event_slug = 'tech-summit-2026'), 'Networking Lunch', 'Connect with fellow attendees.', '2026-03-15', '12:00', '13:30', 'Networking', 'Dining Hall', true, true, false, 'Asia/Kolkata'),
((SELECT id FROM events WHERE event_slug = 'tech-summit-2026'), 'Panel: AI in Enterprise', 'Industry experts discuss AI applications.', '2026-03-15', '14:00', '15:30', 'Panel', 'Room A', true, true, false, 'Asia/Kolkata'),
-- Department specific
((SELECT id FROM events WHERE event_slug = 'tech-summit-2026'), 'Engineering Deep Dive', 'Technical session on microservices.', '2026-03-15', '10:30', '12:00', 'Workshop', 'Room B', false, true, true, 'Asia/Kolkata'),
-- Team specific
((SELECT id FROM events WHERE event_slug = 'tech-summit-2026'), 'Frontend Team: React Best Practices', 'Internal session for frontend team.', '2026-03-15', '16:00', '17:30', 'Workshop', 'Room C', false, false, false, 'Asia/Kolkata')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE IMPORTANT UPDATES
-- =====================================================
INSERT INTO important_updates (event_id, title, description, update_date_time) VALUES
((SELECT id FROM events WHERE event_slug = 'tech-summit-2026'), 'Welcome to Tech Summit 2026!', 'We are excited to have you join us. Please check in at the registration desk.', '2026-03-15 08:00:00'),
((SELECT id FROM events WHERE event_slug = 'tech-summit-2026'), 'Room Change: AI Panel', 'The AI panel has been moved from Room B to Room A.', '2026-03-15 09:30:00')
ON CONFLICT DO NOTHING;
