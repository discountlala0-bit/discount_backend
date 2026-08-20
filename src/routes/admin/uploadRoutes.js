import express from 'express';
import multer from 'multer';
import path from 'path';
import { uploadToCloudinary } from '../../lib/cloudinary.js';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
    ok ? cb(null, true) : cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file provided' });
    }

    const result = await uploadToCloudinary(req.file.buffer, 'discountLala');
    res.json({ success: true, url: result.secure_url });
  } catch (error) {
    console.error('Admin image upload failed:', error);
    res.status(500).json({ success: false, error: 'Failed to upload image to Cloudinary' });
  }
});

export default router;
