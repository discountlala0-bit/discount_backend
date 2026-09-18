import express from 'express';
import {
  getTermsAndConditions,
  updateTermsAndConditions,
  getPrivacyPolicy,
  updatePrivacyPolicy,
} from '../../controllers/admin/legalController.js';

const router = express.Router();

router.get('/terms-and-conditions', getTermsAndConditions);
router.put('/terms-and-conditions', updateTermsAndConditions);
router.get('/privacy-policy', getPrivacyPolicy);
router.put('/privacy-policy', updatePrivacyPolicy);

export default router;
