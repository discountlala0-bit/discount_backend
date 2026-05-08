import express from 'express';
import {
  getBookletsByCity,
  getBookletById,
  filterBooklets,
} from '../controllers/bookletController.js';

const router = express.Router();

router.get('/city/:city_id', getBookletsByCity);
router.get('/filter', filterBooklets);
router.get('/:id', getBookletById);

export default router;
