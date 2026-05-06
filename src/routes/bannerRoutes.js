import express from 'express';
import { getBanners, getBannerById } from '../controllers/bannerController.js';

const router = express.Router();

router.get('/', getBanners);
router.get('/:id', getBannerById);

export default router;
