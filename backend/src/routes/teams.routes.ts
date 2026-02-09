import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { createTeamSchema, updateTeamSchema } from '../models/schemas.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { NotFoundError } from '../middleware/error.middleware.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

// Get all teams (with optional department filter)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { department_id } = req.query;

    let sql = `
      SELECT t.*, d.name as department_name
      FROM teams t
      JOIN departments d ON t.department_id = d.id
    `;
    const params: (string | number)[] = [];

    if (department_id) {
      sql += ' WHERE t.department_id = $1';
      params.push(department_id as string);
    }

    sql += ' ORDER BY d.name, t.name ASC';

    const result = await query(sql, params);
    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// Get team by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT t.*, d.name as department_name
       FROM teams t
       JOIN departments d ON t.department_id = d.id
       WHERE t.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Team');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Create team
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createTeamSchema.parse(req.body);

    const result = await query(
      `INSERT INTO teams (department_id, name)
       VALUES ($1, $2)
       RETURNING *`,
      [data.department_id, data.name]
    );

    sendCreated(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update team
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateTeamSchema.parse(req.body);

    const result = await query(
      `UPDATE teams
       SET department_id = COALESCE($1, department_id),
           name = COALESCE($2, name)
       WHERE id = $3
       RETURNING *`,
      [data.department_id, data.name, id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Team');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete team
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM teams WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Team');
    }

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

export default router;
