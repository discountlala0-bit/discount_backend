import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getUserCoupons,
  redeemCoupon,
  getAllCoupons,
  createCoupon,
  updateCoupon,
} from '../controllers/couponController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getUserCoupons);
router.post('/:coupon_id/redeem', redeemCoupon);

router.get('/admin/all', getAllCoupons);
router.post('/admin/create', createCoupon);
router.put('/admin/:id', updateCoupon);

export default router;
