import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getBookletsByCity,
  getBookletById,
  filterBooklets,
  getPurchasedBooklets,
} from '../controllers/bookletController.js';

const router = express.Router();

// /purchased must be before /:id to avoid being matched as a booklet ID
router.get('/purchased', authMiddleware, getPurchasedBooklets);
router.get('/city/:city_id', getBookletsByCity);
router.get('/filter', filterBooklets);
router.get('/:id', getBookletById);

export default router;
