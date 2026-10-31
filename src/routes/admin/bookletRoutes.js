import express from 'express';
import {
  createBooklet,
  getBooklets,
  getBookletByIdAdmin,
  getBookletsByCity,
  updateBooklet,
  deleteBooklet,
  getBookletPlaces,
  updateBookletPlacesSequence,
} from '../../controllers/bookletController.js';

const router = express.Router();

router.post('/', createBooklet);
router.get('/', getBooklets);
router.get('/:id/places', getBookletPlaces);
router.put('/:id/places', updateBookletPlacesSequence);
router.get('/:id', getBookletByIdAdmin);
router.get('/:city_id', getBookletsByCity);
router.put('/:id', updateBooklet);
router.delete('/:id', deleteBooklet);

export default router;
