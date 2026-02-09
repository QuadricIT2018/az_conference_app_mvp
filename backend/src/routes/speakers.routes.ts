import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { createSpeakerSchema, updateSpeakerSchema } from '../models/schemas.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { sendSuccess, sendCreated, sendNoContent, sendPaginated } from '../utils/response.js';
import { NotFoundError } from '../middleware/error.middleware.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

// Get all speakers (paginated)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;

    let sql = 'SELECT * FROM speakers WHERE 1=1';
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (speaker_name ILIKE $${paramIndex} OR speaker_designation ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    // Get total count
    const countResult = await query(
      sql.replace('SELECT *', 'SELECT COUNT(*)'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    sql += ` ORDER BY speaker_name ASC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    sendPaginated(res, result.rows, page, limit, total);
  } catch (error) {
    next(error);
  }
});

// Get speaker by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
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
              s.session_end_time, s.session_location, e.event_name, e.event_slug
       FROM sessions s
       JOIN session_speaker ss ON s.id = ss.session_id
       JOIN events e ON s.event_id = e.id
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

// Create speaker
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSpeakerSchema.parse(req.body);

    const result = await query(
      `INSERT INTO speakers (speaker_name, speaker_designation, speaker_about, speaker_image_url, speaker_occupation, department, teams)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.speaker_name,
        data.speaker_designation,
        data.speaker_about,
        data.speaker_image_url,
        data.speaker_occupation,
        data.department,
        data.teams,
      ]
    );

    sendCreated(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update speaker
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateSpeakerSchema.parse(req.body);

    const result = await query(
      `UPDATE speakers
       SET speaker_name = COALESCE($1, speaker_name),
           speaker_designation = COALESCE($2, speaker_designation),
           speaker_about = COALESCE($3, speaker_about),
           speaker_image_url = COALESCE($4, speaker_image_url),
           speaker_occupation = COALESCE($5, speaker_occupation),
           department = COALESCE($6, department),
           teams = COALESCE($7, teams)
       WHERE id = $8
       RETURNING *`,
      [
        data.speaker_name,
        data.speaker_designation,
        data.speaker_about,
        data.speaker_image_url,
        data.speaker_occupation,
        data.department,
        data.teams,
        id,
      ]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Speaker');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete speaker
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM speakers WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Speaker');
    }

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

export default router;
