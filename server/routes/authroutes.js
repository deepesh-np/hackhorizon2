/** @format */

const express = require('express');
const { body } = require('express-validator');
const {
  register,
  login,
  getMe,
  logout,
  changePassword,
  updateProfile,
} = require('../controllers/authcontroller');
const { protect } = require('../middleware/authmiddleware');

const router = express.Router();

// ─── Validation Rules ────────────────────────────────────────────────────────
const registerValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 100 }),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('role')
    .optional()
    .isIn(['user', 'vendor', 'admin'])
    .withMessage('Role must be user, vendor, or admin'),
  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone must be 10 digits'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters'),
];

// ─── Routes ──────────────────────────────────────────────────────────────────
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put(
  '/change-password',
  protect,
  changePasswordValidation,
  changePassword,
);
router.put('/update-profile', protect, updateProfile);

module.exports = router;
