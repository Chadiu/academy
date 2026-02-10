import { Router } from 'express';
import { authenticate, requireRole, optionalAuth } from '../middleware/auth.js';
import {
  getPaths,
  getPathById,
  createPath,
  updatePath,
  deletePath,
  addCourseToPath,
  removeCourseFromPath
} from '../controllers/pathController.js';

const router = Router();

router.get('/', optionalAuth, getPaths);
router.get('/:id', optionalAuth, getPathById);

router.post('/', authenticate, requireRole('ADMIN'), createPath);
router.put('/:id', authenticate, requireRole('ADMIN'), updatePath);
router.delete('/:id', authenticate, requireRole('ADMIN'), deletePath);

router.post('/:pathId/courses', authenticate, requireRole('ADMIN'), addCourseToPath);
router.delete('/:pathId/courses/:courseId', authenticate, requireRole('ADMIN'), removeCourseFromPath);

export default router;
