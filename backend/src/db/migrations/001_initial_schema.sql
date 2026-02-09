-- Conference Management System - Schema
-- PostgreSQL Migration (Integer Serial IDs)

-- =====================================================
-- DROP EXISTING TABLES (in correct dependency order)
-- =====================================================
DROP VIEW IF EXISTS v_sessions_full CASCADE;
DROP TABLE IF EXISTS user_favourite_sessions CASCADE;
DROP TABLE IF EXISTS session_topic_attendee CASCADE;
DROP TABLE IF EXISTS session_speaker CASCADE;
DROP TABLE IF EXISTS session_speakers CASCADE;
DROP TABLE IF EXISTS session_tag_assignments CASCADE;
DROP TABLE IF EXISTS session_topics CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS important_updates CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS speakers CASCADE;
DROP TABLE IF EXISTS session_tags CASCADE;
DROP TABLE IF EXISTS session_types CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP TABLE IF EXISTS attendees CASCADE;

-- =====================================================
-- 1. ATTENDEES TABLE
-- =====================================================
CREATE TABLE attendees (
    id SERIAL PRIMARY KEY,
    email CHARACTER VARYING NOT NULL UNIQUE,
    password_hash CHARACTER VARYING NOT NULL,
    department CHARACTER VARYING,
    team CHARACTER VARYING,
    last_login TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 2. ADMINS TABLE
-- =====================================================
CREATE TABLE admins (
    id SERIAL PRIMARY KEY,
    email CHARACTER VARYING NOT NULL UNIQUE,
    password_hash CHARACTER VARYING NOT NULL,
    department CHARACTER VARYING,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 3. DEPARTMENTS TABLE
-- =====================================================
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name CHARACTER VARYING NOT NULL
);

-- =====================================================
-- 4. TEAMS TABLE
-- =====================================================
CREATE TABLE teams (
    id SERIAL PRIMARY KEY,
    department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    name CHARACTER VARYING NOT NULL
);

CREATE INDEX idx_teams_department_id ON teams(department_id);

-- =====================================================
-- 5. SESSION TAGS TABLE
-- =====================================================
CREATE TABLE session_tags (
    id SERIAL PRIMARY KEY,
    name CHARACTER VARYING NOT NULL
);

-- =====================================================
-- 6. SESSION TYPES TABLE
-- =====================================================
CREATE TABLE session_types (
    id SERIAL PRIMARY KEY,
    name CHARACTER VARYING NOT NULL
);

-- =====================================================
-- 7. SPEAKERS TABLE
-- =====================================================
CREATE TABLE speakers (
    id SERIAL PRIMARY KEY,
    speaker_name CHARACTER VARYING NOT NULL,
    speaker_designation CHARACTER VARYING,
    speaker_about TEXT,
    speaker_image_url TEXT,
    speaker_occupation CHARACTER VARYING,
    department CHARACTER VARYING,
    teams CHARACTER VARYING,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. EVENTS TABLE
-- =====================================================
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    event_slug CHARACTER VARYING,
    pwa_name CHARACTER VARYING NOT NULL,
    pwa_logo_url TEXT,
    event_name CHARACTER VARYING NOT NULL,
    event_banner_url TEXT,
    event_description TEXT,
    department CHARACTER VARYING,
    event_location CHARACTER VARYING,
    event_location_map_url TEXT,
    event_start_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    event_end_date TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    event_venue_map_url TEXT,
    event_app_url CHARACTER VARYING,
    wifi JSONB NOT NULL DEFAULT '[]'::jsonb,
    helpdesk JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_draft BOOLEAN DEFAULT TRUE,
    manifest_url TEXT,
    created_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 9. SESSIONS TABLE
-- =====================================================
CREATE TABLE sessions (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    session_name CHARACTER VARYING NOT NULL,
    session_description TEXT,
    session_date DATE NOT NULL,
    session_start_time TIME WITHOUT TIME ZONE NOT NULL,
    session_end_time TIME WITHOUT TIME ZONE,
    session_tag CHARACTER VARYING,
    session_location CHARACTER VARYING,
    session_location_map_url TEXT,
    session_venue_map_url TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_generic BOOLEAN NOT NULL DEFAULT TRUE,
    department TEXT,
    is_dept_generic BOOLEAN NOT NULL DEFAULT TRUE,
    team TEXT,
    timezone TEXT,
    has_topics BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX idx_sessions_event_id ON sessions(event_id);
CREATE INDEX idx_sessions_date ON sessions(session_date, session_start_time);

-- =====================================================
-- 10. SESSION TOPICS TABLE
-- =====================================================
CREATE TABLE session_topics (
    id SERIAL PRIMARY KEY,
    name CHARACTER VARYING NOT NULL,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    location CHARACTER VARYING,
    session_type CHARACTER VARYING
);

CREATE INDEX idx_session_topics_session ON session_topics(session_id);

-- =====================================================
-- 11. SESSION TOPIC ATTENDEE TABLE
-- =====================================================
CREATE TABLE session_topic_attendee (
    id SERIAL PRIMARY KEY,
    attendee_id INTEGER NOT NULL REFERENCES attendees(id) ON DELETE CASCADE,
    session_topic_id INTEGER REFERENCES session_topics(id) ON DELETE CASCADE
);

CREATE INDEX idx_session_topic_attendee_topic ON session_topic_attendee(session_topic_id);

-- =====================================================
-- 12. SESSION SPEAKER TABLE (Many-to-Many)
-- =====================================================
CREATE TABLE session_speaker (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    speaker_id INTEGER NOT NULL REFERENCES speakers(id) ON DELETE CASCADE
);

CREATE INDEX idx_session_speaker_session ON session_speaker(session_id);
CREATE INDEX idx_session_speaker_speaker ON session_speaker(speaker_id);

-- =====================================================
-- 13. USER FAVOURITE SESSIONS TABLE
-- =====================================================
CREATE TABLE user_favourite_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    session_id INTEGER NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE
);

CREATE INDEX idx_favourites_user ON user_favourite_sessions(user_id);
CREATE INDEX idx_favourites_session ON user_favourite_sessions(session_id);
CREATE INDEX idx_favourites_event ON user_favourite_sessions(event_id);

-- =====================================================
-- 14. IMPORTANT UPDATES TABLE
-- =====================================================
CREATE TABLE important_updates (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
    title CHARACTER VARYING NOT NULL,
    description TEXT,
    links TEXT[],
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    update_date_time TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

CREATE INDEX idx_updates_event ON important_updates(event_id);

-- =====================================================
-- UTILITY: Auto-update updated_at trigger
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
DROP TRIGGER IF EXISTS update_attendees_updated_at ON attendees;
CREATE TRIGGER update_attendees_updated_at BEFORE UPDATE ON attendees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admins_updated_at ON admins;
CREATE TRIGGER update_admins_updated_at BEFORE UPDATE ON admins
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_speakers_updated_at ON speakers;
CREATE TRIGGER update_speakers_updated_at BEFORE UPDATE ON speakers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INSERT DEFAULT SESSION TYPES
-- =====================================================
INSERT INTO session_types (name) VALUES
    ('GENERAL'),
    ('DEPARTMENT'),
    ('TEAM'),
    ('ATTENDEE');
