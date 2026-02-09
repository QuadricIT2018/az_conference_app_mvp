import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { adminMiddleware } from '../middleware/admin.middleware.js';
import { upload, uploadBanner, uploadLogo, uploadVenueMap } from '../middleware/upload.middleware.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.use(authMiddleware, adminMiddleware);

function buildFileResponse(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded' });
      return;
    }

    const fileUrl = `/${req.file.destination}/${req.file.filename}`;
    sendSuccess(res, {
      file_url: fileUrl,
      original_name: req.file.originalname,
      size: req.file.size,
    });
  } catch (error) {
    next(error);
  }
}

// Generic upload (backward compat)
router.post('/file', upload.single('file'), buildFileResponse);

// Typed uploads
router.post('/banner', uploadBanner.single('file'), buildFileResponse);
router.post('/logo', uploadLogo.single('file'), buildFileResponse);
router.post('/venue-map', uploadVenueMap.single('file'), buildFileResponse);

export default router;
