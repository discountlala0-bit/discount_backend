import express from 'express';
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  handleFailedPayment,
  handleRazorpayWebhook,
  createPayment,
  updatePaymentStatus,
  getPaymentsByOrder,
  createNormalOrder,
  processNormalPayment,
} from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Razorpay Webhook endpoint (MUST be public so Razorpay server can deliver events)
router.post('/razorpay/webhook', handleRazorpayWebhook);

// All subsequent payment routes require authentication
router.use(authMiddleware);

// Razorpay endpoints
router.post('/razorpay/create-order', createRazorpayOrder);
router.post('/razorpay/verify', verifyRazorpayPayment);
router.post('/razorpay/failed', handleFailedPayment);

// Normal (non-Razorpay) flow endpoints
router.post('/normal/create-order', createNormalOrder);
router.post('/normal/pay', processNormalPayment);

// Legacy endpoints
router.post('/', createPayment);
router.put('/:id/status', updatePaymentStatus);
router.get('/order/:order_id', getPaymentsByOrder);

export default router;
