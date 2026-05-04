import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getMyReferrals,
  recordReferral,
  processReferralReward,
  getAllReferrals,
} from '../controllers/referralController.js';

const router = express.Router();

router.get('/my', authMiddleware, getMyReferrals);

router.post('/record', recordReferral);
router.put('/reward', processReferralReward);
router.get('/admin/all', getAllReferrals);

export default router;
