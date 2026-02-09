import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { createDepartmentSchema, updateDepartmentSchema } from '../models/schemas.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { NotFoundError } from '../middleware/error.middleware.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

// Get all departments
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      'SELECT * FROM departments ORDER BY name ASC'
    );
    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// Get department by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM departments WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Department');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Create department
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createDepartmentSchema.parse(req.body);

    const result = await query(
      `INSERT INTO departments (name)
       VALUES ($1)
       RETURNING *`,
      [data.name]
    );

    // Create teams if provided
    if (data.teams && data.teams.length > 0) {
      for (const teamName of data.teams) {
        await query(
          'INSERT INTO teams (department_id, name) VALUES ($1, $2)',
          [result.rows[0].id, teamName]
        );
      }
    }

    sendCreated(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update department
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateDepartmentSchema.parse(req.body);

    const result = await query(
      `UPDATE departments
       SET name = COALESCE($1, name)
       WHERE id = $2
       RETURNING *`,
      [data.name, id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Department');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete department
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM departments WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Department');
    }

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

// Get teams for a department
router.get('/:id/teams', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM teams WHERE department_id = $1 ORDER BY name ASC',
      [id]
    );

    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
