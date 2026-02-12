import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { NotFoundError } from '../middleware/error.middleware.js';
import {
  getVisibleSessions,
  getSessionWithVisibilityCheck,
  getSessionDates,
} from '../services/visibility.service.js';

const router = Router();

// ============== PUBLIC EVENT INFO ==============

// List published events (public)
router.get('/events', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT id, event_slug, pwa_name, event_name, event_start_date, event_end_date,
              event_location
       FROM events
       WHERE is_draft = false
       ORDER BY event_start_date DESC`
    );

    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// Get event by slug (public)
router.get('/events/:slug', optionalAuthMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const result = await query(
      `SELECT id, event_slug, pwa_name, pwa_logo_url, event_name, event_banner_url,
              event_description, department, event_location, event_location_map_url,
              event_start_date, event_end_date, event_venue_map_url, event_app_url,
              manifest_url, event_banners, venue_maps, quick_links
       FROM events
       WHERE event_slug = $1 AND is_draft = false`,
      [slug]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Event');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get event days (public)
router.get('/events/:slug/days', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const result = await query(
      `SELECT ed.id, ed.day_number, ed.day_date
       FROM event_days ed
       JOIN events e ON ed.event_id = e.id
       WHERE e.event_slug = $1 AND e.is_draft = false
       ORDER BY ed.day_number`,
      [slug]
    );

    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// Get WiFi info for event
router.get('/events/:slug/wifi', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const result = await query(
      'SELECT wifi FROM events WHERE event_slug = $1 AND is_draft = false',
      [slug]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Event');
    }

    sendSuccess(res, result.rows[0].wifi);
  } catch (error) {
    next(error);
  }
});

// Get Helpdesk info for event
router.get('/events/:slug/helpdesk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const result = await query(
      'SELECT helpdesk FROM events WHERE event_slug = $1 AND is_draft = false',
      [slug]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Event');
    }

    sendSuccess(res, result.rows[0].helpdesk);
  } catch (error) {
    next(error);
  }
});

// ============== AUTHENTICATED ROUTES ==============

// Get personalized sessions for event
router.get('/events/:slug/sessions', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;
    const { date, favourites } = req.query;

    // Fetch current department/team from DB (JWT may be stale after profile update)
    const userResult = await query(
      'SELECT department, team FROM attendees WHERE id = $1',
      [req.user!.userId]
    );
    const currentDept = userResult.rows[0]?.department || req.user!.department;
    const currentTeam = userResult.rows[0]?.team || req.user!.team;

    const sessions = await getVisibleSessions({
      eventSlug: slug as string,
      userId: req.user!.userId,
      department: currentDept,
      team: currentTeam,
      date: date as string,
      favouritesOnly: favourites === 'true',
    });

    sendSuccess(res, sessions);
  } catch (error) {
    next(error);
  }
});

// Get session dates for event (for date picker)
router.get('/events/:slug/dates', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const dates = await getSessionDates(
      slug as string,
      req.user!.userId,
      req.user!.department,
      req.user!.team
    );

    sendSuccess(res, dates);
  } catch (error) {
    next(error);
  }
});

// Get session detail
router.get('/sessions/:id', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const session = await getSessionWithVisibilityCheck(
      parseInt(id as string),
      req.user!.userId,
      req.user!.department,
      req.user!.team
    );

    if (!session) {
      throw NotFoundError('Session');
    }

    sendSuccess(res, session);
  } catch (error) {
    next(error);
  }
});

// Get speakers for event
router.get('/events/:slug/speakers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const result = await query(
      `SELECT DISTINCT sp.id, sp.speaker_name, sp.speaker_designation,
              sp.speaker_about, sp.speaker_image_url, sp.speaker_occupation
       FROM speakers sp
       JOIN session_speaker ss ON sp.id = ss.speaker_id
       JOIN sessions se ON ss.session_id = se.id
       JOIN events e ON se.event_id = e.id
       WHERE e.event_slug = $1 AND e.is_draft = false
       ORDER BY sp.speaker_name`,
      [slug]
    );

    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// Get speaker detail
router.get('/speakers/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM speakers WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Speaker');
    }

    // Get sessions for this speaker
    const sessionsResult = await query(
      `SELECT s.id, s.session_name, s.session_date, s.session_start_time,
              s.session_end_time, s.session_location
       FROM sessions s
       JOIN session_speaker ss ON s.id = ss.session_id
       WHERE ss.speaker_id = $1
       ORDER BY s.session_date, s.session_start_time`,
      [id]
    );

    sendSuccess(res, {
      ...result.rows[0],
      sessions: sessionsResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

// Get updates for event
router.get('/events/:slug/updates', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { slug } = req.params;

    const result = await query(
      `SELECT u.id, u.title, u.description, u.links, u.update_date_time, u.created_at
       FROM important_updates u
       JOIN events e ON u.event_id = e.id
       WHERE e.event_slug = $1 AND e.is_draft = false
       ORDER BY u.update_date_time DESC`,
      [slug]
    );

    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// ============== FAVOURITES ==============

// Get user's favourite sessions
router.get('/favourites', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT s.id, s.session_name, s.session_description, s.session_date,
              s.session_start_time, s.session_end_time, s.session_tag,
              s.session_location, s.timezone, s.department,
              e.event_slug, e.event_name
       FROM user_favourite_sessions f
       JOIN sessions s ON f.session_id = s.id
       JOIN events e ON f.event_id = e.id
       WHERE f.user_id = $1
       ORDER BY s.session_date, s.session_start_time`,
      [req.user!.userId]
    );

    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// Add to favourites
router.post('/favourites/:sessionId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    // Check if session exists and is accessible
    const session = await getSessionWithVisibilityCheck(
      parseInt(sessionId as string),
      req.user!.userId,
      req.user!.department,
      req.user!.team
    );

    if (!session) {
      throw NotFoundError('Session');
    }

    await query(
      `INSERT INTO user_favourite_sessions (user_id, session_id, event_id)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [req.user!.userId, sessionId, session.event_id]
    );

    sendCreated(res, { session_id: parseInt(sessionId as string), favourited: true });
  } catch (error) {
    next(error);
  }
});

// Remove from favourites
router.delete('/favourites/:sessionId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sessionId } = req.params;

    await query(
      'DELETE FROM user_favourite_sessions WHERE user_id = $1 AND session_id = $2',
      [req.user!.userId, sessionId]
    );

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

// ============== MY TEAM ==============

// Get team members
router.get('/my-team', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user!.team) {
      sendSuccess(res, []);
      return;
    }

    const result = await query(
      `SELECT id, email, department, team
       FROM attendees
       WHERE team = $1 AND id != $2
       ORDER BY email`,
      [req.user!.team, req.user!.userId]
    );

    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// ============== DEPARTMENTS (public list) ==============

router.get('/departments', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query('SELECT id, name FROM departments ORDER BY name');
    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// ============== PROFILE ==============

// Get user profile
router.get('/profile', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      'SELECT id, email, department, team, last_login, created_at FROM attendees WHERE id = $1',
      [req.user!.userId]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('User');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update user profile (department)
router.patch('/profile', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { department } = req.body;

    const result = await query(
      'UPDATE attendees SET department = $1, updated_at = NOW() WHERE id = $2 RETURNING id, email, department, team, last_login, created_at',
      [department || null, req.user!.userId]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('User');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
