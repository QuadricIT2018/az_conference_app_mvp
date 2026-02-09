import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { createSessionTypeSchema, updateSessionTypeSchema } from '../models/schemas.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { NotFoundError } from '../middleware/error.middleware.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

// Get all session types
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      'SELECT * FROM session_types ORDER BY name ASC'
    );
    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// Get session type by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM session_types WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Session type');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Create session type
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSessionTypeSchema.parse(req.body);

    const result = await query(
      `INSERT INTO session_types (name)
       VALUES ($1)
       RETURNING *`,
      [data.name]
    );

    sendCreated(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update session type
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateSessionTypeSchema.parse(req.body);

    const result = await query(
      `UPDATE session_types
       SET name = COALESCE($1, name)
       WHERE id = $2
       RETURNING *`,
      [data.name, id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Session type');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete session type
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM session_types WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Session type');
    }

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

export default router;
