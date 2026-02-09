import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../config/database.js';
import { createAdminSchema, updateAdminSchema } from '../models/schemas.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response.js';
import { NotFoundError } from '../middleware/error.middleware.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

// Get all admins
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      'SELECT id, email, department, created_at, updated_at FROM admins ORDER BY created_at DESC'
    );
    sendSuccess(res, result.rows);
  } catch (error) {
    next(error);
  }
});

// Get admin by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      'SELECT id, email, department, created_at, updated_at FROM admins WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Admin');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Create admin
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = createAdminSchema.parse(req.body);
    const password_hash = await bcrypt.hash(data.password, 12);

    const result = await query(
      `INSERT INTO admins (email, password_hash, department)
       VALUES ($1, $2, $3)
       RETURNING id, email, department, created_at`,
      [data.email, password_hash, data.department]
    );

    sendCreated(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Update admin
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = updateAdminSchema.parse(req.body);

    const result = await query(
      `UPDATE admins
       SET email = COALESCE($1, email),
           department = COALESCE($2, department)
       WHERE id = $3
       RETURNING id, email, department, created_at, updated_at`,
      [data.email, data.department, id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Admin');
    }

    sendSuccess(res, result.rows[0]);
  } catch (error) {
    next(error);
  }
});

// Delete admin
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM admins WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      throw NotFoundError('Admin');
    }

    sendNoContent(res);
  } catch (error) {
    next(error);
  }
});

export default router;
