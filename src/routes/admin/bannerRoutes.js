import express from 'express';
import {
  createBanner,
  getBanners,
  getBannerById,
  updateBanner,
  deleteBanner,
} from '../../controllers/admin/bannerController.js';

const router = express.Router();

router.post('/', createBanner);
router.get('/', getBanners);
router.get('/:id', getBannerById);
router.put('/:id', updateBanner);
router.delete('/:id', deleteBanner);

export default router;
