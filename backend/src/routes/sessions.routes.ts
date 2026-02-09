import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import {
  createSessionSchema,
  updateSessionSchema,
  createSessionTopicSchema,
  updateSessionTopicSchema,
  assignSpeakerSchema,
} from '../models/schemas.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { NotFoundError } from '../middleware/error.middleware.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

// Create session (for event)
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSessionSchema.parse(req.body);

    const result = await query(
      `INSERT INTO sessions (
        event_id, session_name, session_description, session_date,
        session_start_time, session_end_time, session_tag, session_location,
        session_location_map_url, session_venue_map_url,
        is_generic, department, is_dept_generic, team, timezone, has_topics,
        survey_url, supporting_material_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        data.event_id,
        data.session_name,
        data.session_description,
        data.session_date,
        data.session_start_time,
        data.session_end_time,
        data.session_tag,
        data.session_location,
        data.session_location_map_url,
        data.session_venue_map_url,
        data.is_generic,
        data.department,
        data.is_dept_generic,
        data.team,
        data.timezone,
        data.has_topics,
        data.survey_url,
        data.supporting_material_url,
      ]
    );

    sendCreated(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Get session by ID with full details
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM sessions WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Session');
    }

    // Get speakers for this session
    const speakersResult = await query(
      `SELECT sp.* FROM speakers sp
       JOIN session_speaker ss ON sp.id = ss.speaker_id
       WHERE ss.session_id = $1`,
      [id]
    );

    // Get topics for this session
    const topicsResult = await query(
      'SELECT * FROM session_topics WHERE session_id = $1 ORDER BY id',
      [id]
    );

    sendSuccess(res, {
      ...result.rows[0],
      speakers: speakersResult.rows,
      topics: topicsResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

// Update session
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateSessionSchema.parse(req.body);

    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    const fields = [
      'session_name', 'session_description', 'session_date',
      'session_start_time', 'session_end_time', 'session_tag',
      'session_location', 'session_location_map_url', 'session_venue_map_url',
      'is_generic', 'department', 'is_dept_generic', 'team',
      'timezone', 'has_topics', 'survey_url', 'supporting_material_url'
    ];

    for (const field of fields) {
      if (data[field as keyof typeof data] !== undefined) {
        updates.push(`${field} = $${paramIndex}`);
        values.push(data[field as keyof typeof data]);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      const existing = await query('SELECT * FROM sessions WHERE id = $1', [id]);
      if (existing.rows.length === 0) throw NotFoundError('Session');
      sendSuccess(res, existing.rows[0]);
      return;
    }

    values.push(id);
    const result = await query(
      `UPDATE sessions SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Session');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete session
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM sessions WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Session');
    }

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

// ============== TOPICS ==============

// Get session topics
router.get('/:id/topics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM session_topics WHERE session_id = $1 ORDER BY id',
      [id]
    );

    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// Add topic to session
router.post('/:id/topics', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = createSessionTopicSchema.parse(req.body);

    const result = await query(
      `INSERT INTO session_topics (session_id, name, location, session_type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [id, data.name, data.location, data.session_type]
    );

    // Update session has_topics flag
    await query('UPDATE sessions SET has_topics = true WHERE id = $1', [id]);

    sendCreated(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update topic
router.put('/:id/topics/:topicId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { topicId } = req.params;
    const data = updateSessionTopicSchema.parse(req.body);

    const result = await query(
      `UPDATE session_topics
       SET name = COALESCE($1, name),
           location = COALESCE($2, location),
           session_type = COALESCE($3, session_type)
       WHERE id = $4
       RETURNING *`,
      [data.name, data.location, data.session_type, topicId]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Topic');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete topic
router.delete('/:id/topics/:topicId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, topicId } = req.params;

    const result = await query(
      'DELETE FROM session_topics WHERE id = $1 RETURNING id',
      [topicId]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Topic');
    }

    // Check if any topics remain
    const remaining = await query(
      'SELECT COUNT(*) FROM session_topics WHERE session_id = $1',
      [id]
    );

    if (parseInt(remaining.rows[0].count) === 0) {
      await query('UPDATE sessions SET has_topics = false WHERE id = $1', [id]);
    }

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

// ============== SPEAKERS ==============

// Assign speaker to session
router.post('/:id/speakers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = assignSpeakerSchema.parse(req.body);

    const result = await query(
      `INSERT INTO session_speaker (session_id, speaker_id)
       VALUES ($1, $2)
       RETURNING *`,
      [id, data.speaker_id]
    );

    sendCreated(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Remove speaker from session
router.delete('/:id/speakers/:speakerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id, speakerId } = req.params;

    const result = await query(
      'DELETE FROM session_speaker WHERE session_id = $1 AND speaker_id = $2 RETURNING id',
      [id, speakerId]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Session speaker assignment');
    }

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

export default router;
