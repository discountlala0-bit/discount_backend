import express from 'express';
import multer from 'multer';
import path from 'path';
import { getMe, updateMe, uploadImage, deleteAccount } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const storage = multer.memoryStorage();
const upload = multer({ storage });
const router = express.Router();

router.get('/me', authMiddleware, getMe);
router.put('/me', authMiddleware, updateMe);
router.delete('/me', authMiddleware, deleteAccount);
router.post('/me/image', authMiddleware, upload.single('image'), uploadImage);

export default router;
