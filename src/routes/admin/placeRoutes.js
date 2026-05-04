import express from 'express';
import {
  createPlace,
  getPlaces,
  getPlaceById,
  getPlacesByCategory,
  updatePlace,
  deletePlace,
} from '../../controllers/admin/placeController.js';

const router = express.Router();

router.post('/', createPlace);
router.get('/', getPlaces);
router.get('/category/:category_id', getPlacesByCategory);
router.get('/:id', getPlaceById);
router.put('/:id', updatePlace);
router.delete('/:id', deletePlace);

export default router;
