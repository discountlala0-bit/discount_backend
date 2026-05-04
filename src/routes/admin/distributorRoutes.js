import express from 'express';
import {
  createDistributor,
  getDistributors,
  getDistributorById,
  updateDistributor,
  getCommissions,
} from '../../controllers/admin/distributorController.js';

const router = express.Router();

router.post('/', createDistributor);
router.get('/', getDistributors);
router.get('/:id', getDistributorById);
router.put('/:id', updateDistributor);
router.get('/commissions', getCommissions);

export default router;
