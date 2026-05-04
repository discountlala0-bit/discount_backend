import express from 'express';
import {
  createPayment,
  updatePaymentStatus,
  getPaymentsByOrder,
} from '../controllers/paymentController.js';

const router = express.Router();

router.post('/', createPayment);
router.put('/:id/status', updatePaymentStatus);
router.get('/order/:order_id', getPaymentsByOrder);

export default router;
