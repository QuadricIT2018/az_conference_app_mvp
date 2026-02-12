import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { createEventSchema, updateEventSchema, wifiInfoSchema, helpdeskInfoSchema, venueMapInfoSchema, eventBannersSchema, quickLinkSchema } from '../models/schemas.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/response.js';
import { NotFoundError } from '../middleware/error.middleware.js';
import { z } from 'zod';

const router = Router();

router.use(authMiddleware, adminMiddleware);

// Helper: generate event_days rows from start/end dates
async function generateEventDays(eventId: number, startDate: string, endDate: string): Promise<void> {
  // Remove existing days for this event
  await query('DELETE FROM event_days WHERE event_id = $1', [eventId]);

  // Extract YYYY-MM-DD from any format: "2026-03-16", "2026-03-16 00:00:00", "2026-03-16T00:00:00Z"
  const startStr = startDate.substring(0, 10);
  const endStr = endDate.substring(0, 10);
  const start = new Date(startStr + 'T12:00:00Z');
  const end = new Date(endStr + 'T12:00:00Z');

  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return;

  let dayNum = 1;
  const d = new Date(start);
  while (d <= end) {
    const dateStr = d.toISOString().split('T')[0];
    await query(
      'INSERT INTO event_days (event_id, day_number, day_date) VALUES ($1, $2, $3) ON CONFLICT (event_id, day_date) DO NOTHING',
      [eventId, dayNum, dateStr]
    );
    dayNum++;
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

// Get all events (paginated)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = req.query.status as string;

    let sql = 'SELECT * FROM events WHERE 1=1';
    const params: (string | boolean | number)[] = [];
    let paramIndex = 1;

    if (status === 'draft') {
      sql += ` AND is_draft = true`;
    } else if (status === 'published') {
      sql += ` AND is_draft = false`;
    }

    const countResult = await query(
      sql.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    sql += ` ORDER BY event_start_date DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    sendPaginated(res, result.rows, page, limit, total);
  } catch (error) {
    next(error);
  }
});

// Get event by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM events WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      throw NotFoundError('Event');
    }

    const sessionCount = await query(
      'SELECT COUNT(*) FROM sessions WHERE event_id = $1',
      [id]
    );

    const updateCount = await query(
      'SELECT COUNT(*) FROM important_updates WHERE event_id = $1',
      [id]
    );

    sendSuccess(res, {
      ...result.rows[0],
      session_count: parseInt(sessionCount.rows[0].count),
      update_count: parseInt(updateCount.rows[0].count),
    });
  } catch (error) {
    next(error);
  }
});

// Create event
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createEventSchema.parse(req.body);

    const result = await query(
      `INSERT INTO events (
        event_slug, pwa_name, pwa_logo_url, event_name, event_banner_url,
        event_description, department, event_location, event_location_map_url,
        event_start_date, event_end_date, event_venue_map_url, event_app_url,
        wifi, helpdesk, is_draft, manifest_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        data.event_slug,
        data.pwa_name,
        data.pwa_logo_url,
        data.event_name,
        data.event_banner_url,
        data.event_description,
        data.department,
        data.event_location,
        data.event_location_map_url,
        data.event_start_date,
        data.event_end_date,
        data.event_venue_map_url,
        data.event_app_url,
        JSON.stringify(data.wifi),
        JSON.stringify(data.helpdesk),
        data.is_draft,
        data.manifest_url,
      ]
    );

    const created = result.rows[0];

    // Auto-generate event days from date range
    await generateEventDays(created.id, data.event_start_date, data.event_end_date);

    sendCreated(res, created);
  } catch (error) {
    next(error);
  }
});

// Update event
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateEventSchema.parse(req.body);

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fields = [
      'event_slug', 'pwa_name', 'pwa_logo_url', 'event_name', 'event_banner_url',
      'event_description', 'department', 'event_location', 'event_location_map_url',
      'event_start_date', 'event_end_date', 'event_venue_map_url', 'event_app_url',
      'is_draft', 'manifest_url'
    ];

    for (const field of fields) {
      if (data[field as keyof typeof data] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(data[field as keyof typeof data]);
        paramIndex++;
      }
    }

    if (data.wifi !== undefined) {
      updates.push(`wifi = $${paramIndex}`);
      values.push(JSON.stringify(data.wifi));
      paramIndex++;
    }
    if (data.helpdesk !== undefined) {
      updates.push(`helpdesk = $${paramIndex}`);
      values.push(JSON.stringify(data.helpdesk));
      paramIndex++;
    }
    if (data.venue_maps !== undefined) {
      updates.push(`venue_maps = $${paramIndex}`);
      values.push(JSON.stringify(data.venue_maps));
      paramIndex++;
    }
    if (data.event_banners !== undefined) {
      updates.push(`event_banners = $${paramIndex}`);
      values.push(JSON.stringify(data.event_banners));
      paramIndex++;
    }
    if (data.quick_links !== undefined) {
      updates.push(`quick_links = $${paramIndex}`);
      values.push(JSON.stringify(data.quick_links));
      paramIndex++;
    }

    if (updates.length === 0) {
      const existing = await query('SELECT * FROM events WHERE id = $1', [id]);
      if (existing.rows.length === 0) throw NotFoundError('Event');
      sendSuccess(res, existing.rows[0]);
      return;
    }

    values.push(id);
    const result = await query(
      `UPDATE events SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Event');
    }

    const updated = result.rows[0];

    // Regenerate event days if dates were changed
    if (data.event_start_date !== undefined || data.event_end_date !== undefined) {
      // pg type parser returns "2026-03-16" or "2026-03-16 00:00:00" — always grab first 10 chars
      const startDate = String(updated.event_start_date).substring(0, 10);
      const endDate = String(updated.event_end_date).substring(0, 10);
      await generateEventDays(updated.id, startDate, endDate);
    }

    sendSuccess(res, updated);
  } catch (error) {
    next(error);
  }
});

// Update WiFi info
router.patch('/:id/wifi', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const wifi = z.array(wifiInfoSchema).parse(req.body.wifi);

    const result = await query(
      'UPDATE events SET wifi = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(wifi), id]
    );

    if (result.rows.length === 0) throw NotFoundError('Event');
    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update Helpdesk info
router.patch('/:id/helpdesk', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const helpdesk = z.array(helpdeskInfoSchema).parse(req.body.helpdesk);

    const result = await query(
      'UPDATE events SET helpdesk = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(helpdesk), id]
    );

    if (result.rows.length === 0) throw NotFoundError('Event');
    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update Venue Maps info
router.patch('/:id/venue-maps', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const venue_maps = z.array(venueMapInfoSchema).parse(req.body.venue_maps);

    const result = await query(
      'UPDATE events SET venue_maps = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(venue_maps), id]
    );

    if (result.rows.length === 0) throw NotFoundError('Event');
    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update Event Banners
router.patch('/:id/banners', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const event_banners = eventBannersSchema.parse(req.body.event_banners);

    const result = await query(
      'UPDATE events SET event_banners = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(event_banners), id]
    );

    if (result.rows.length === 0) throw NotFoundError('Event');
    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update PWA Logo URL
router.patch('/:id/logo', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { pwa_logo_url } = req.body;

    const result = await query(
      'UPDATE events SET pwa_logo_url = $1 WHERE id = $2 RETURNING *',
      [pwa_logo_url || null, id]
    );

    if (result.rows.length === 0) throw NotFoundError('Event');
    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update Quick Links
router.patch('/:id/quick-links', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const quick_links = z.array(quickLinkSchema).parse(req.body.quick_links);

    const result = await query(
      'UPDATE events SET quick_links = $1 WHERE id = $2 RETURNING *',
      [JSON.stringify(quick_links), id]
    );

    if (result.rows.length === 0) throw NotFoundError('Event');
    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete event
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM events WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) throw NotFoundError('Event');
    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

// Get event days
router.get('/:id/days', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM event_days WHERE event_id = $1 ORDER BY day_number',
      [id]
    );

    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// Get sessions for an event
router.get('/:id/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    let sql = `SELECT * FROM sessions WHERE event_id = $1`;
    const params: (string | number)[] = [id as string];

    if (date) {
      sql += ` AND session_date = $2`;
      params.push(date as string);
    }

    sql += ` ORDER BY session_date, session_start_time`;

    const result = await query(sql, params);
    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
