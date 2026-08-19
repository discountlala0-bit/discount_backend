import express from 'express';
import {
  createDistributor,
  getDistributors,
  getDistributorById,
  updateDistributor,
  getRedemptions,
} from '../../controllers/admin/distributorController.js';

const router = express.Router();

router.post('/', createDistributor);
router.get('/', getDistributors);

router.get('/redemptions', getRedemptions);

router.get('/:id', getDistributorById);
router.put('/:id', updateDistributor);

export default router;
