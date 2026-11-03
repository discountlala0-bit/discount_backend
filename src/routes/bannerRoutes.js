import express from 'express';
import {
  getBanners,
  getBannerById,
  getUserBanners,
  trackBannerDismiss,
} from '../controllers/bannerController.js';

const router = express.Router();

router.get('/user-banners', getUserBanners);
router.post('/:id/dismiss', trackBannerDismiss);
router.get('/', getBanners);
router.get('/:id', getBannerById);

export default router;
