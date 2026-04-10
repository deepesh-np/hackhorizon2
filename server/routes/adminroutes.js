/** @format */

const express = require('express');
const { protect, authorize } = require('../middleware/authmiddleware');
const {
  getAllUsers,
  getPendingVendors,
  verifyVendor,
  toggleUserStatus,
  deleteUser,
} = require('../controllers/admincontroller');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, authorize('admin'));

router.get('/users', getAllUsers);
router.get('/vendors/pending', getPendingVendors);
router.put('/vendors/:id/verify', verifyVendor);
router.put('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

module.exports = router;
