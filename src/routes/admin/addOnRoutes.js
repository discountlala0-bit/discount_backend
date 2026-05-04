import express from 'express';
import {
  createAddOn,
  getAddOns,
  getAddOnById,
  updateAddOn,
  deleteAddOn,
  addOfferToAddOn,
  removeOfferFromAddOn,
} from '../../controllers/admin/addOnController.js';

const router = express.Router();

router.post('/', createAddOn);
router.get('/', getAddOns);
router.get('/:id', getAddOnById);
router.put('/:id', updateAddOn);
router.delete('/:id', deleteAddOn);
router.post('/add-offer', addOfferToAddOn);
router.delete('/:add_on_id/offer/:offer_id', removeOfferFromAddOn);

export default router;
