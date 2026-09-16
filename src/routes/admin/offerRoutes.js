import express from 'express';
import {
  createOffer,
  getOffers,
  getOfferById,
  updateOffer,
  deleteOffer,
  addOfferToBooklet,
  removeOfferFromBooklet,
  setBookletOfferVisibility,
} from '../../controllers/admin/offerController.js';

const router = express.Router();

router.post('/', createOffer);
router.get('/', getOffers);
router.get('/:id', getOfferById);
router.put('/:id', updateOffer);
router.delete('/:id', deleteOffer);
router.post('/booklet/add', addOfferToBooklet);
router.delete('/booklet/:booklet_id/offer/:offer_id', removeOfferFromBooklet);
router.patch('/booklet/:booklet_id/offer/:offer_id/visibility', setBookletOfferVisibility);

export default router;
