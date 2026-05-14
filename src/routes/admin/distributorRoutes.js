import express from 'express';
import {
  createDistributor,
  getDistributors,
  getDistributorById,
  updateDistributor,
  getCommissions,
  updateCommissionStatus,
} from '../../controllers/admin/distributorController.js';

const router = express.Router();

router.post('/', createDistributor);
router.get('/', getDistributors);

router.get('/commissions', getCommissions);
router.put('/commissions/:id', updateCommissionStatus);

router.get('/:id', getDistributorById);
router.put('/:id', updateDistributor);

export default router;
