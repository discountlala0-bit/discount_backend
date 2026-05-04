import express from 'express';
import {
  getAddOnsByCity,
  filterAddOns,
} from '../controllers/addOnController.js';

const router = express.Router();

router.get('/city/:city_id', getAddOnsByCity);
router.get('/filter', filterAddOns);

export default router;
