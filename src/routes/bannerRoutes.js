import express from 'express';
import {
  getBanners,
  getBannerById,
  getUserBanners,
  getLandscapeBanners,
  trackBannerDismiss,
} from '../controllers/bannerController.js';

const router = express.Router();

router.get('/user-banners', getUserBanners);
router.get('/landscape', getLandscapeBanners);
router.post('/:id/dismiss', trackBannerDismiss);
router.get('/', getBanners);
router.get('/:id', getBannerById);

export default router;
