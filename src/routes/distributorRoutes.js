import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { validateDistributorCode } from '../controllers/distributorController.js';

const router = express.Router();

router.use(authMiddleware);

router.get('/validate/:code', validateDistributorCode);

export default router;
