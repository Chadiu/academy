import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  getPendingUsers,
  approveUser,
  rejectUser
} from '../controllers/authController.js';

const router = Router();

const registerValidation = [
  body('email')
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email too long'),
  body('password')
    .isLength({ min: 8, max: 128 }).withMessage('Password must be 8-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number'),
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 255 }).withMessage('Name too long'),
  body('ministry')
    .trim()
    .notEmpty().withMessage('Ministry is required')
    .isLength({ max: 255 }).withMessage('Ministry too long'),
  body('role')
    .optional()
    .isIn(['LEARNER', 'SUPERUSER']).withMessage('Invalid role') 
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', authLimiter, registerValidation, register);
router.post('/login', authLimiter, loginValidation, login);
router.get('/me', authenticate, getMe);
router.put('/profile', authenticate, updateProfile);
router.put('/password', authenticate, [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8, max: 128 }).withMessage('New password must be 8-128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain uppercase, lowercase and number')
], changePassword);

router.get('/pending', authenticate, requireRole('ADMIN'), getPendingUsers);
router.post('/approve/:userId', authenticate, requireRole('ADMIN'), approveUser);
router.post('/reject/:userId', authenticate, requireRole('ADMIN'), rejectUser);

export default router;
