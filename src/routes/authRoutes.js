import express from 'express';
import { verifyIdToken, register } from '../controllers/authController.js';

const router = express.Router();

router.post('/verify-id-token', verifyIdToken);
router.post('/register', register);

export default router;
