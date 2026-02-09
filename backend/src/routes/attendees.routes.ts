import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { createAttendeeSchema, updateAttendeeSchema } from '../models/schemas.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { sendSuccess, sendCreated, sendPaginated, sendNoContent } from '../utils/response.js';
import { NotFoundError } from '../middleware/error.middleware.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

// Get all attendees (paginated with filters)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search as string;
    const department = req.query.department as string;

    let sql = 'SELECT id, email, department, team, last_login, created_at, updated_at FROM attendees WHERE 1=1';
    const params: (string | number)[] = [];
    let paramIndex = 1;

    if (search) {
      sql += ` AND (email ILIKE $${paramIndex} OR department ILIKE $${paramIndex} OR team ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (department) {
      sql += ` AND department = $${paramIndex}`;
      params.push(department);
      paramIndex++;
    }

    // Get total count
    const countSql = sql.replace(/SELECT .* FROM/, 'SELECT COUNT(*) FROM');
    const countResult = await query(countSql, params);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    sql += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);
    sendPaginated(res, result.rows, page, limit, total);
  } catch (error) {
    next(error);
  }
});

// Get attendee stats
router.get('/stats', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const totalResult = await query('SELECT COUNT(*) FROM attendees');
    const total = parseInt(totalResult.rows[0].count);

    const activeResult = await query(
      `SELECT COUNT(*) FROM attendees
       WHERE last_login > NOW() - INTERVAL '7 days'`
    );
    const activeLastWeek = parseInt(activeResult.rows[0].count);

    const byDepartmentResult = await query(`
      SELECT department, COUNT(*) as count
      FROM attendees
      WHERE department IS NOT NULL
      GROUP BY department
      ORDER BY count DESC
    `);

    sendSuccess(res, {
      total,
      activeLastWeek,
      byDepartment: byDepartmentResult.rows,
    });
  } catch (error) {
    next(error);
  }
});

// Get attendee by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT id, email, department, team, last_login, created_at, updated_at FROM attendees WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Attendee');
    }

    // Get favourite sessions count
    const favouritesResult = await query(
      'SELECT COUNT(*) FROM user_favourite_sessions WHERE user_id = $1',
      [id]
    );

    sendSuccess(res, {
      ...result.rows[0],
      favourite_count: parseInt(favouritesResult.rows[0].count),
    });
  } catch (error) {
    next(error);
  }
});

// Create attendee
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createAttendeeSchema.parse(req.body);
    const password_hash = await bcrypt.hash(data.password, 12);

    const result = await query(
      `INSERT INTO attendees (email, password_hash, department, team)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, department, team, created_at`,
      [data.email, password_hash, data.department, data.team]
    );

    sendCreated(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update attendee
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateAttendeeSchema.parse(req.body);

    const result = await query(
      `UPDATE attendees
       SET email = COALESCE($1, email),
           department = COALESCE($2, department),
           team = COALESCE($3, team)
       WHERE id = $4
       RETURNING id, email, department, team, created_at, updated_at`,
      [data.email, data.department, data.team, id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Attendee');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete attendee
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM attendees WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Attendee');
    }

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

export default router;
