import express from 'express';
import { sendOtp, verifyOTP, verifyIdToken, register } from '../controllers/authController.js';

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOTP);
router.post('/verify-id-token', verifyIdToken);
router.post('/register', register);

export default router;
