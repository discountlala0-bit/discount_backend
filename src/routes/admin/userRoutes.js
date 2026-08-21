import express from 'express';
import {
  getAllUsers,
  getDeactivatedUsers,
  getUserDetails,
  toggleUserStatus,
  reactivateUser,
} from '../../controllers/admin/userController.js';

const router = express.Router();

router.get('/', getAllUsers);
router.get('/deactivated', getDeactivatedUsers);
router.get('/:id', getUserDetails);
router.put('/:id/toggle-status', toggleUserStatus);
router.put('/:id/reactivate', reactivateUser);

export default router;