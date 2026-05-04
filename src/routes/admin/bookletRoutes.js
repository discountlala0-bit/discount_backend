import express from 'express';
import {
  createBooklet,
  getBooklets,
  getBookletById,
  getBookletsByCity,
  updateBooklet,
  deleteBooklet,
} from '../../controllers/bookletController.js';

const router = express.Router();

router.post('/', createBooklet);
router.get('/', getBooklets);
router.get('/:id', getBookletById);
router.get('/:city_id', getBookletsByCity);
router.put('/:id', updateBooklet);
router.delete('/:id', deleteBooklet);

export default router;
