import express from 'express';
import {
  getAllOrders,
  updateOrderStatus,
} from '../../controllers/orderController.js';

const router = express.Router();

router.get('/', getAllOrders);
router.put('/:id/status', updateOrderStatus);

export default router;
