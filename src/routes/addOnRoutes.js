import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getAddOnsByCity,
  filterAddOns,
  getPurchasedAddOns,
} from '../controllers/addOnController.js';

const router = express.Router();

// /purchased must be before /city/:city_id to avoid route conflicts
router.get('/purchased', authMiddleware, getPurchasedAddOns);
router.get('/city/:city_id', getAddOnsByCity);
router.get('/filter', filterAddOns);

export default router;
