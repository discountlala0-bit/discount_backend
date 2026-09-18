import express from 'express';
import { getTermsAndConditions, getPrivacyPolicy } from '../controllers/legalController.js';

const router = express.Router();

router.get('/terms-and-conditions', getTermsAndConditions);
router.get('/privacy-policy', getPrivacyPolicy);

export default router;
