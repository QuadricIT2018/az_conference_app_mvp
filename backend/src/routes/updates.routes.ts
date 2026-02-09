import { Router, Request, Response, NextFunction } from 'express';
import { query } from '../config/database.js';
import { createUpdateSchema, updateUpdateSchema } from '../models/schemas.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { NotFoundError } from '../middleware/error.middleware.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

// Get updates for an event
router.get('/event/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;

    const result = await query(
      `SELECT * FROM important_updates
       WHERE event_id = $1
       ORDER BY update_date_time DESC`,
      [eventId]
    );

    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// Get update by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT * FROM important_updates WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Update');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Create update
router.post('/event/:eventId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { eventId } = req.params;
    const data = createUpdateSchema.parse(req.body);

    const result = await query(
      `INSERT INTO important_updates (event_id, title, description, links, update_date_time)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [eventId, data.title, data.description, data.links, data.update_date_time]
    );

    sendCreated(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update update
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateUpdateSchema.parse(req.body);

    const result = await query(
      `UPDATE important_updates
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           links = COALESCE($3, links),
           update_date_time = COALESCE($4, update_date_time)
       WHERE id = $5
       RETURNING *`,
      [data.title, data.description, data.links, data.update_date_time, id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Update');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete update
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM important_updates WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Update');
    }

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

export default router;
