import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  getCartDetails,
} from '../controllers/cartController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/', getCart);
router.post('/add', addToCart);
router.delete('/remove/:item_id', removeFromCart);
router.delete('/clear', clearCart);
router.get('/details', getCartDetails);

export default router;
