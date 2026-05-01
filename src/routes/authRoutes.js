import express from 'express';
import { sendOtp, verifyOTP, verifyIdToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOTP);
router.post('/verify-id-token', verifyIdToken);

export default router;
