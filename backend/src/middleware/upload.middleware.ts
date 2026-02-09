import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';

type AssetType = 'banners' | 'logos' | 'venue-maps' | 'general';

const folderMap: Record<AssetType, string> = {
  banners: 'uploads/banners',
  logos: 'uploads/logos',
  'venue-maps': 'uploads/venue-maps',
  general: 'uploads',
};

// Ensure all upload directories exist
for (const folder of Object.values(folderMap)) {
  fs.mkdirSync(folder, { recursive: true });
}

const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
const allExtensions = [...imageExtensions, '.pdf'];

function createStorage(assetType: AssetType) {
  return multer.diskStorage({
    destination: (_req: Request, _file: Express.Multer.File, cb) => {
      cb(null, folderMap[assetType]);
    },
    filename: (_req: Request, file: Express.Multer.File, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(2, 10);
      cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s+/g, '_'));
    },
  });
}

function createFileFilter(allowPdf: boolean) {
  return (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const allowed = allowPdf ? allExtensions : imageExtensions;
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(allowPdf ? 'Only PDF and image files are allowed' : 'Only image files are allowed'));
    }
  };
}

const limits = { fileSize: 10 * 1024 * 1024 }; // 10MB

function createUpload(assetType: AssetType, allowPdf: boolean) {
  return multer({
    storage: createStorage(assetType),
    fileFilter: createFileFilter(allowPdf),
    limits,
  });
}

// Typed exports
export const uploadBanner = createUpload('banners', false);
export const uploadLogo = createUpload('logos', false);
export const uploadVenueMap = createUpload('venue-maps', true);

// Backward-compatible generic upload
export const upload = createUpload('general', true);
