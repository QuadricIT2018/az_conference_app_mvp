import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { corsOptions } from './config/cors.js';
import { errorMiddleware } from './middleware/error.middleware.js';
import pool from './config/database.js';
import uploadRoutes from './routes/upload.routes.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import departmentRoutes from './routes/departments.routes.js';
import teamRoutes from './routes/teams.routes.js';
import speakerRoutes from './routes/speakers.routes.js';
import tagRoutes from './routes/tags.routes.js';
import sessionTypeRoutes from './routes/session-types.routes.js';
import eventRoutes from './routes/events.routes.js';
import sessionRoutes from './routes/sessions.routes.js';
import updateRoutes from './routes/updates.routes.js';
import attendeeRoutes from './routes/attendees.routes.js';
import adminRoutes from './routes/admin.routes.js';
import appRoutes from './routes/app.routes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Health check
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'healthy', database: 'connected' });
  } catch {
    res.status(500).json({ status: 'unhealthy', database: 'disconnected' });
  }
});

// API Routes
app.use('/api/v1/auth', authRoutes);

// Admin routes
app.use('/api/v1/admin/departments', departmentRoutes);
app.use('/api/v1/admin/teams', teamRoutes);
app.use('/api/v1/admin/speakers', speakerRoutes);
app.use('/api/v1/admin/tags', tagRoutes);
app.use('/api/v1/admin/session-types', sessionTypeRoutes);
app.use('/api/v1/admin/events', eventRoutes);
app.use('/api/v1/admin/sessions', sessionRoutes);
app.use('/api/v1/admin/updates', updateRoutes);
app.use('/api/v1/admin/attendees', attendeeRoutes);
app.use('/api/v1/admin/admins', adminRoutes);
app.use('/api/v1/admin/upload', uploadRoutes);

// PWA/App routes
app.use('/api/v1/app', appRoutes);

// Error handling middleware
app.use(errorMiddleware);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
  });
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);

  // Test database connectivity
  try {
    console.log('Testing database connection...');
    await pool.query('SELECT 1');
    console.log('Database connected successfully!');
  } catch (error: any) {
    console.error('Database connectivity test failed:', error.message);
  }
});

export default app;
