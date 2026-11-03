import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadToCloudinary } from '../../lib/cloudinary.js';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|mov|avi|webm|mkv|m4v/;
    const ok =
      allowed.test(path.extname(file.originalname).toLowerCase()) ||
      file.mimetype.startsWith('video/') ||
      file.mimetype.startsWith('image/');
    ok ? cb(null, true) : cb(new Error('Only image or video files are allowed'));
  },
  limits: { fileSize: 50 * 1024 * 1024 },
});

const router = express.Router();

router.post(
  '/',
  (req, res, next) => {
    upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'file', maxCount: 1 },
      { name: 'media', maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        return res.status(400).json({ success: false, error: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const file =
        req.files?.image?.[0] ||
        req.files?.file?.[0] ||
        req.files?.media?.[0] ||
        (req.files && Object.values(req.files)[0]?.[0]) ||
        req.file;
      if (!file) {
        return res.status(400).json({ success: false, error: 'No media file provided' });
      }

      const result = await uploadToCloudinary(file.buffer, 'discountLala');
      const isVideo = result.resource_type === 'video' || file.mimetype.startsWith('video/');
      res.json({
        success: true,
        url: result.secure_url,
        mediaType: isVideo ? 'video' : 'image',
      });
    } catch (error) {
      console.error('Admin media upload failed:', error);
      res.status(500).json({ success: false, error: 'Failed to upload media to Cloudinary' });
    }
  }
);

export default router;
