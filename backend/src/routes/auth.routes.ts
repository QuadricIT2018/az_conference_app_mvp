import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { loginSchema } from '../models/schemas.js';
import { JWTPayload } from '../models/types.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';

// Validate JWT_SECRET at startup
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be defined in environment variables');
}

const router = Router();

// Helper function to generate JWT token
const generateToken = (payload: JWTPayload): string => {
  // @ts-ignore - Type definition issue with jwt.sign
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Login for attendees
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const result = await query(
      'SELECT * FROM attendees WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const attendee = result.rows[0];
    const validPassword = await bcrypt.compare(password, attendee.password_hash);

    if (!validPassword) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    // Check if user is also an admin
    const adminResult = await query(
      'SELECT * FROM admins WHERE email = $1',
      [email]
    );
    const isAdmin = adminResult.rows.length > 0;

    // Update last login
    await query(
      'UPDATE attendees SET last_login = NOW() WHERE id = $1',
      [attendee.id]
    );

    const payload: JWTPayload = {
      userId: attendee.id,
      email: attendee.email,
      department: attendee.department,
      team: attendee.team,
      isAdmin,
    };

    const token = generateToken(payload);

    sendSuccess(res, {
      token,
      user: {
        id: attendee.id,
        email: attendee.email,
        department: attendee.department,
        team: attendee.team,
        isAdmin,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Admin login
router.post('/admin/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const result = await query(
      'SELECT * FROM admins WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const admin = result.rows[0];
    const validPassword = await bcrypt.compare(password, admin.password_hash);

    if (!validPassword) {
      sendError(res, 'Invalid email or password', 401);
      return;
    }

    const payload: JWTPayload = {
      userId: admin.id,
      email: admin.email,
      department: admin.department,
      team: null,
      isAdmin: true,
    };

    const token = generateToken(payload);

    sendSuccess(res, {
      token,
      user: {
        id: admin.id,
        email: admin.email,
        department: admin.department,
        isAdmin: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get current user
router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Try attendees first
    const attendeeResult = await query(
      'SELECT id, email, department, team, last_login, created_at FROM attendees WHERE id = $1',
      [req.user!.userId]
    );

    if (attendeeResult.rows.length > 0) {
      sendSuccess(res, {
        ...attendeeResult.rows[0],
        isAdmin: req.user!.isAdmin,
      });
      return;
    }

    // Try admins
    const adminResult = await query(
      'SELECT id, email, department, created_at FROM admins WHERE id = $1',
      [req.user!.userId]
    );

    if (adminResult.rows.length > 0) {
      sendSuccess(res, {
        ...adminResult.rows[0],
        isAdmin: true,
      });
      return;
    }

    sendError(res, 'User not found', 404);
  } catch (error) {
    next(error);
  }
});

// Refresh token
router.post('/refresh', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const payload: JWTPayload = {
      userId: req.user!.userId,
      email: req.user!.email,
      department: req.user!.department,
      team: req.user!.team,
      isAdmin: req.user!.isAdmin,
    };

    const token = generateToken(payload);

    sendSuccess(res, { token });
  } catch (error) {
    next(error);
  }
});

export default router;
