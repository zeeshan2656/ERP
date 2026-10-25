import { Router } from 'express';
import multer from 'multer';
import { mediaController } from './media.controller.js';
import { authenticate } from '../../middlewares/auth.middleware.js';
import { env } from '../../config/env.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
  },
});

// Protected upload endpoint
router.post(
  '/upload',
  authenticate,
  upload.single('file'),
  (req, res, next) => mediaController.upload(req, res, next)
);

export default router;
