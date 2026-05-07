import express from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleFailedPayment,
  createPayment,
  updatePaymentStatus,
  getPaymentsByOrder,
} from '../controllers/paymentController.js';

const router = express.Router();

// Razorpay endpoints
router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);
router.post('/razorpay/failed', handleFailedPayment);

// Legacy endpoints
router.post('/', createPayment);
router.put('/:id/status', updatePaymentStatus);
router.get('/order/:order_id', getPaymentsByOrder);

export default router;
