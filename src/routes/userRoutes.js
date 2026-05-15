import express from 'express';
import multer from 'multer';
import path from 'path';
import { getMe, updateMe, uploadImage, deactivateAccount } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
  },
});
const upload = multer({ storage });
const router = express.Router();

router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateMe);
router.delete('/me', authMiddleware, deactivateAccount);
router.post('/me/image', authMiddleware, upload.single('image'), uploadImage);

export default router;
