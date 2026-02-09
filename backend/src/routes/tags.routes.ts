import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { createSessionTagSchema, updateSessionTagSchema } from '../models/schemas.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { NotFoundError } from '../middleware/error.middleware.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

// Get all session tags
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      'SELECT * FROM session_tags ORDER BY name ASC'
    );
    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// Get tag by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM session_tags WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Session tag');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Create tag
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createSessionTagSchema.parse(req.body);

    const result = await query(
      `INSERT INTO session_tags (name)
       VALUES ($1)
       RETURNING *`,
      [data.name]
    );

    sendCreated(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update tag
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateSessionTagSchema.parse(req.body);

    const result = await query(
      `UPDATE session_tags
       SET name = COALESCE($1, name)
       WHERE id = $2
       RETURNING *`,
      [data.name, id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Session tag');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete tag
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM session_tags WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Session tag');
    }

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

export default router;
