import express from 'express';
import { getDeactivatedUsers, reactivateUser } from '../../controllers/admin/userController.js';

const router = express.Router();

router.get('/deactivated', getDeactivatedUsers);
router.put('/:id/reactivate', reactivateUser);

export default router;