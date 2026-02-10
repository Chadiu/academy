import { api, setAuthToken, getAuthToken, Course, LearningPath, Lesson } from './api';
import { MOCK_COURSES, MOCK_USER, MINISTRY_STATS, MOCK_PATHS } from '../constants';
import { Course as LocalCourse, User, AnalyticData, LearningPath as LocalPath } from '../types';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true' || !import.meta.env.VITE_API_URL;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const transformCourse = (course: Course): LocalCourse => ({
  id: course.id,
  title: course.title,
  description: course.description,
  thumbnail: course.thumbnail,
  level: course.level,
  totalDuration: course.totalDuration,
  orderIndex: (course as any).orderIndex,
  progress: course.progress,
  status: course.status as any,
  enrolledCount: course.enrolledCount,
  lessons: course.lessons.map(l => ({
    id: l.id,
    title: l.title,
    type: l.type as any,
    durationMin: l.durationMin,
    videoUrl: l.videoUrl,
    fileUrl: l.fileUrl,
    fileName: l.fileName,
    pageCount: l.pageCount,
    content: l.content,
    quiz: l.quiz?.map(q => ({
      id: q.id,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
    })),
    isCompleted: l.isCompleted,
  })),
});

const transformPath = (path: LearningPath): LocalPath => ({
  id: path.id,
  title: path.title,
  description: path.description,
  courseIds: path.courseIds,
  role: path.role,
});

export const dataService = {

  login: async (email: string, password: string): Promise<User | null> => {
    if (USE_MOCK) {
      await delay(500);
      
      if (email.includes('.gov') || email.includes('gov.')) {
        return {
          ...MOCK_USER,
          email,
          name: email.split('@')[0].replace('.', ' '),
        };
      }
      throw new Error('Invalid credentials');
    }

    try {
      const response = await api.auth.login({ email, password });
      setAuthToken(response.token);
      return {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as any,
        ministry: response.user.ministry,
        enrolledCourses: [],
        completedPaths: [],
      };
    } catch (error) {
      throw error;
    }
  },

  register: async (data: { email: string; password: string; name: string; ministry: string; role?: string }): Promise<User> => {
    if (USE_MOCK) {
      await delay(500);
      return {
        id: `u-${Date.now()}`,
        ...data,
        role: (data.role || 'LEARNER') as any,
        enrolledCourses: [],
        completedPaths: [],
      };
    }

    const response = await api.auth.register({
      email: data.email,
      password: data.password,
      name: data.name,
      ministry: data.ministry,
      role: data.role as any,
    });
    setAuthToken(response.token);
    return {
      id: response.user.id,
      name: response.user.name,
      email: response.user.email,
      role: response.user.role as any,
      ministry: response.user.ministry,
      enrolledCourses: [],
      completedPaths: [],
    };
  },

  logout: () => {
    setAuthToken(null);
  },

  getUser: async (): Promise<User> => {
    if (USE_MOCK) {
      await delay(300);
      return MOCK_USER;
    }

    if (!getAuthToken()) {
      throw new Error('Not authenticated');
    }

    const response = await api.auth.getMe();
    return {
      id: response.user.id,
      name: response.user.name,
      email: response.user.email,
      role: response.user.role as any,
      ministry: response.user.ministry,
      enrolledCourses: [],
      completedPaths: [],
    };
  },

  isAuthenticated: () => {
    return USE_MOCK ? true : !!getAuthToken();
  },

  getCourses: async (): Promise<LocalCourse[]> => {
    if (USE_MOCK) {
      await delay(500);
      return MOCK_COURSES;
    }

    const response = await api.courses.getAll();
    return response.courses.map(transformCourse);
  },

  getCourseById: async (id: string): Promise<LocalCourse | undefined> => {
    if (USE_MOCK) {
      await delay(200);
      return MOCK_COURSES.find(c => c.id === id);
    }

    try {
      const response = await api.courses.getById(id);
      return transformCourse(response.course);
    } catch {
      return undefined;
    }
  },

  getPaths: async (): Promise<LocalPath[]> => {
    if (USE_MOCK) {
      await delay(400);
      return MOCK_PATHS;
    }

    const response = await api.paths.getAll();
    return response.paths.map(transformPath);
  },

  enrollInCourse: async (courseId: string): Promise<void> => {
    if (USE_MOCK) {
      await delay(300);
      console.log(`Enrolled in course ${courseId}`);
      return;
    }

    await api.progress.enrollInCourse(courseId);
  },

  updateProgress: async (courseId: string, lessonId: string): Promise<void> => {
    if (USE_MOCK) {
      console.log(`Updating progress for course ${courseId}, lesson ${lessonId}`);
      await delay(300);
      return;
    }

    await api.progress.updateLessonProgress(lessonId, { status: 'IN_PROGRESS' });
  },

  updateVideoProgress: async (lessonId: string, progressPercent: number): Promise<void> => {
    if (USE_MOCK) {
      console.log(`Updating video progress for lesson ${lessonId}: ${progressPercent}%`);
      await delay(100);
      return;
    }

    await api.progress.updateLessonProgress(lessonId, {
      status: progressPercent >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
      progressPercent
    });
  },

  completeLesson: async (lessonId: string, quizScore?: number, totalQuestions?: number): Promise<{ courseProgress: number; passed: boolean; quizResult?: any }> => {
    if (USE_MOCK) {
      await delay(300);
      const passed = quizScore && totalQuestions ? (quizScore / totalQuestions * 100) >= 70 : true;
      return { courseProgress: 100, passed, quizResult: { passed, percentage: quizScore ? quizScore / (totalQuestions || 1) * 100 : 100, passingScore: 70 } };
    }

    const response = await api.progress.completeLesson(lessonId, quizScore, totalQuestions);
    return {
      courseProgress: response.courseProgress,
      passed: response.passed,
      quizResult: response.quizResult
    };
  },

  checkCourseAccess: async (courseId: string): Promise<{ canAccess: boolean; reason?: string; prerequisiteCourseId?: string }> => {
    if (USE_MOCK) {
      await delay(200);
      return { canAccess: true };
    }

    return api.progress.checkCourseAccess(courseId);
  },

  getDeadlines: async () => {
    if (USE_MOCK) {
      await delay(300);
      return { deadlines: [] };
    }

    return api.progress.getDeadlines();
  },

  getLessonRequirements: async (lessonId: string) => {
    if (USE_MOCK) {
      await delay(200);
      return { lessonId, passingScore: 70, attempts: 0, passed: false, status: 'NOT_STARTED' };
    }

    return api.progress.getLessonRequirements(lessonId);
  },

  getDashboardStats: async () => {
    if (USE_MOCK) {
      await delay(400);
      return {
        stats: {
          enrolledCourses: 2,
          completedCourses: 0,
          lessonsCompleted: 3,
          averageQuizScore: 85,
        },
        currentCourses: MOCK_COURSES.slice(0, 2).map(c => ({
          id: c.id,
          title: c.title,
          thumbnail_url: c.thumbnail,
          progress: c.progress,
        })),
      };
    }

    return api.progress.getDashboard();
  },

  getAdminStats: async (): Promise<AnalyticData[]> => {
    if (USE_MOCK) {
      await delay(400);
      return MINISTRY_STATS;
    }

    const response = await api.admin.getMinistryStats();
    return response.ministryStats.map(s => ({
      name: s.name.split(' ').slice(-1)[0], 
      value: s.totalLearners,
    }));
  },

  getFullAdminStats: async () => {
    if (USE_MOCK) {
      await delay(400);
      return {
        stats: {
          totalLearners: 2405,
          totalCourses: 4,
          totalLessons: 24,
          totalEnrollments: 3200,
          completionRate: 68,
          totalStudyHours: 12500,
        },
      };
    }

    return api.admin.getStats();
  },

  getMinistryStats: async () => {
    if (USE_MOCK) {
      await delay(400);
      return { ministryStats: MINISTRY_STATS.map(s => ({ ...s, totalLearners: s.value, activeLearners: Math.floor(s.value * 0.7), coursesCompleted: Math.floor(s.value * 0.3), overdueCount: Math.floor(s.value * 0.1), avgQuizScore: 75 })) };
    }

    return api.admin.getMinistryStats();
  },

  getMinistryCourseStats: async (ministry?: string) => {
    if (USE_MOCK) {
      await delay(400);
      return {
        ministryCourseStats: MOCK_COURSES.slice(0, 3).map(c => ({
          ministry: ministry || 'Finance Ministry',
          courseId: c.id,
          courseTitle: c.title,
          enrolledCount: Math.floor(Math.random() * 50) + 10,
          completedCount: Math.floor(Math.random() * 30),
          overdueCount: Math.floor(Math.random() * 5),
          avgScore: Math.floor(Math.random() * 30) + 70,
          completionRate: Math.floor(Math.random() * 40) + 50
        }))
      };
    }

    return api.admin.getMinistryCourseStats(ministry);
  },

  getOverdueLearners: async () => {
    if (USE_MOCK) {
      await delay(400);
      return { overdueLearners: [] };
    }

    return api.admin.getOverdueLearners();
  },

  getContentStats: async () => {
    if (USE_MOCK) {
      await delay(300);
      return {
        contentStats: [
          { name: 'Video', value: 45, count: 18 },
          { name: 'Reading', value: 30, count: 12 },
          { name: 'Quizzes', value: 25, count: 10 },
        ],
      };
    }

    return api.admin.getContentStats();
  },

  createCourse: async (course: Partial<LocalCourse>): Promise<LocalCourse> => {
    if (USE_MOCK) {
      await delay(800);
      const newCourse: LocalCourse = {
        id: `c${Date.now()}`,
        title: course.title || 'Untitled',
        description: course.description || '',
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
        level: course.level || 'Beginner',
        totalDuration: '0h',
        lessons: [],
        progress: 0,
        status: 'NOT_STARTED' as any,
      };
      return newCourse;
    }

    const response = await api.courses.create({
      title: course.title,
      description: course.description,
      level: course.level,
      thumbnail: course.thumbnail,
      totalDuration: course.totalDuration,
    } as any);

    return transformCourse(response.course);
  },

  updateCourse: async (id: string, updates: Partial<LocalCourse>): Promise<LocalCourse> => {
    if (USE_MOCK) {
      await delay(500);
      const course = MOCK_COURSES.find(c => c.id === id);
      if (!course) throw new Error('Course not found');
      return { ...course, ...updates };
    }

    const response = await api.courses.update(id, updates as any);
    return transformCourse(response.course);
  },

  deleteCourse: async (id: string): Promise<void> => {
    if (USE_MOCK) {
      await delay(500);
      return;
    }

    await api.courses.delete(id);
  },

  reorderCourses: async (level: string, orderedIds: string[]): Promise<void> => {
    if (USE_MOCK) {
      await delay(300);
      console.log(`Reordered courses in ${level} level:`, orderedIds);
      return;
    }

    await api.courses.reorderCourses(level, orderedIds);
  },

  addLesson: async (courseId: string, lesson: Partial<Lesson>): Promise<Lesson> => {
    if (USE_MOCK) {
      await delay(500);
      return {
        id: `l-${Date.now()}`,
        title: lesson.title || 'New Lesson',
        type: lesson.type || 'video',
        durationMin: lesson.durationMin || 10,
        ...lesson,
      } as Lesson;
    }

    const response = await api.courses.addLesson(courseId, lesson);
    return response.lesson;
  },

  updateLesson: async (lessonId: string, updates: Partial<Lesson>): Promise<Lesson> => {
    if (USE_MOCK) {
      await delay(300);
      return { id: lessonId, ...updates } as Lesson;
    }

    const response = await api.courses.updateLesson(lessonId, updates);
    return response.lesson;
  },

  deleteLesson: async (lessonId: string): Promise<void> => {
    if (USE_MOCK) {
      await delay(300);
      return;
    }

    await api.courses.deleteLesson(lessonId);
  },

  setCourseDeadline: async (courseId: string, data: { deadline?: string | null; isMandatory?: boolean; prerequisiteCourseId?: string | null }) => {
    if (USE_MOCK) {
      await delay(500);
      return { message: 'Course deadline updated', course: { id: courseId, ...data } };
    }

    return api.admin.setCourseDeadline(courseId, data);
  },

  setEnrollmentDeadline: async (enrollmentId: string, deadline: string) => {
    if (USE_MOCK) {
      await delay(300);
      return { message: 'Enrollment deadline updated', enrollment: { id: enrollmentId, deadline } };
    }

    return api.admin.setEnrollmentDeadline(enrollmentId, deadline);
  },

  setLessonPassingScore: async (lessonId: string, passingScore: number) => {
    if (USE_MOCK) {
      await delay(300);
      return { message: 'Passing score updated', lesson: { id: lessonId, passingScore } };
    }

    return api.admin.setLessonPassingScore(lessonId, passingScore);
  },

  uploadFile: async (file: File, onProgress?: (progress: number) => void) => {
    if (USE_MOCK) {
      
      for (let i = 0; i <= 100; i += 10) {
        await delay(100);
        onProgress?.(i);
      }
      return {
        file: {
          originalName: file.name,
          fileName: `mock-${Date.now()}-${file.name}`,
          fileUrl: URL.createObjectURL(file),
          mimeType: file.type,
          size: file.size,
        },
      };
    }

    return api.upload.uploadFile(file, onProgress);
  },
};

export default dataService;
