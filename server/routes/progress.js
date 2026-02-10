import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  enrollInCourse,
  updateLessonProgress,
  completeLesson,
  getCourseProgress,
  getDashboardStats,
  checkCourseAccess,
  getDeadlines,
  getLessonRequirements
} from '../controllers/progressController.js';

const router = Router();

router.use(authenticate);

router.get('/dashboard', getDashboardStats);

router.get('/deadlines', getDeadlines);

router.post('/enroll/:courseId', enrollInCourse);
router.get('/access/:courseId', checkCourseAccess);

router.get('/course/:courseId', getCourseProgress);

router.get('/lesson/:lessonId/requirements', getLessonRequirements);
router.put('/lesson/:lessonId', updateLessonProgress);
router.post('/lesson/:lessonId/complete', completeLesson);

export default router;
