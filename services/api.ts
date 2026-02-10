const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

let authToken: string | null = localStorage.getItem('token');

export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('token', token);
  } else {
    localStorage.removeItem('token');
  }
};

export const getAuthToken = () => authToken;

async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    
    if (data.errors && Array.isArray(data.errors)) {
      const errorMessages = data.errors.map((err: any) => err.msg).join('. ');
      throw new Error(errorMessages || 'Validation failed');
    }
    
    throw new Error(data.error || 'API request failed');
  }

  return data;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  ministry: string;
  role?: 'LEARNER' | 'SUPERUSER' | 'ADMIN';
}

export interface AuthResponse {
  message: string;
  status?: 'PENDING_APPROVAL';
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    ministry: string;
    avatarUrl?: string;
    isApproved?: boolean;
  };
  token?: string; 
}

export interface PendingUser {
  id: string;
  email: string;
  name: string;
  role: string;
  ministry: string;
  created_at: string;
}

export const authAPI = {
  login: (data: LoginRequest) =>
    fetchAPI<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  register: (data: RegisterRequest) =>
    fetchAPI<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () => fetchAPI<{ user: AuthResponse['user'] }>('/auth/me'),

  updateProfile: (data: { name?: string; ministry?: string }) =>
    fetchAPI<{ message: string; user: AuthResponse['user'] }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    fetchAPI<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getPendingUsers: () =>
    fetchAPI<{ pendingUsers: PendingUser[]; count: number }>('/auth/pending'),

  approveUser: (userId: string) =>
    fetchAPI<{ message: string; user: any }>(`/auth/approve/${userId}`, {
      method: 'POST',
    }),

  rejectUser: (userId: string, reason?: string) =>
    fetchAPI<{ message: string; userId: string }>(`/auth/reject/${userId}`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  logout: () => {
    setAuthToken(null);
    return Promise.resolve({ message: 'Logged out successfully' });
  },
};

export interface Lesson {
  id: string;
  title: string;
  description?: string;
  type: 'video' | 'pdf' | 'presentation' | 'quiz' | 'text';
  durationMin: number;
  videoUrl?: string;
  fileUrl?: string;
  fileName?: string;
  pageCount?: number;
  content?: string;
  quiz?: QuizQuestion[];
  isCompleted?: boolean;
  quizScore?: number;
  passingScore?: number;
  passed?: boolean;
  orderIndex?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  totalDuration: string;
  enrolledCount: number;
  progress: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  lessons: Lesson[];
  deadline?: string;
  isMandatory?: boolean;
  isOverdue?: boolean;
  daysRemaining?: number;
  prerequisiteCourseId?: string;
  isLocked?: boolean;
  isPublished?: boolean;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  role: 'ALL' | 'SUPERUSER';
  courseIds: string[];
  courses?: Partial<Course>[];
}

const transformCourseForBackend = (data: Partial<Course>, isPublishing: boolean = true) => {
  const transformed: Record<string, any> = {};
  if (data.title !== undefined) transformed.title = data.title;
  if (data.description !== undefined) transformed.description = data.description;
  if (data.level !== undefined) transformed.level = data.level;
  if (data.thumbnail !== undefined) transformed.thumbnailUrl = data.thumbnail;
  if (data.totalDuration !== undefined) transformed.totalDuration = data.totalDuration;
  
  transformed.isPublished = isPublishing;
  return transformed;
};

export const coursesAPI = {
  getAll: () => fetchAPI<{ courses: Course[] }>('/courses'),

  getById: (id: string) => fetchAPI<{ course: Course }>(`/courses/${id}`),

  create: (data: Partial<Course>) =>
    fetchAPI<{ message: string; course: Course }>('/courses', {
      method: 'POST',
      body: JSON.stringify(transformCourseForBackend(data)),
    }),

  update: (id: string, data: Partial<Course>) =>
    fetchAPI<{ message: string; course: Course }>(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transformCourseForBackend(data)),
    }),

  delete: (id: string) =>
    fetchAPI<{ message: string }>(`/courses/${id}`, { method: 'DELETE' }),

  reorderCourses: (level: string, orderedIds: string[]) =>
    fetchAPI<{ message: string }>('/courses/reorder', {
      method: 'POST',
      body: JSON.stringify({ level, orderedIds }),
    }),

  addLesson: (courseId: string, data: Partial<Lesson>) =>
    fetchAPI<{ message: string; lesson: Lesson }>(`/courses/${courseId}/lessons`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateLesson: (lessonId: string, data: Partial<Lesson>) =>
    fetchAPI<{ message: string; lesson: Lesson }>(`/courses/lessons/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteLesson: (lessonId: string) =>
    fetchAPI<{ message: string }>(`/courses/lessons/${lessonId}`, { method: 'DELETE' }),

  addQuizQuestion: (lessonId: string, data: Partial<QuizQuestion>) =>
    fetchAPI<{ message: string; question: QuizQuestion }>(`/courses/lessons/${lessonId}/quiz`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateQuizQuestion: (questionId: string, data: Partial<QuizQuestion>) =>
    fetchAPI<{ message: string; question: QuizQuestion }>(`/courses/quiz/${questionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteQuizQuestion: (questionId: string) =>
    fetchAPI<{ message: string }>(`/courses/quiz/${questionId}`, { method: 'DELETE' }),
};

export const pathsAPI = {
  getAll: () => fetchAPI<{ paths: LearningPath[] }>('/paths'),

  getById: (id: string) => fetchAPI<{ path: LearningPath }>(`/paths/${id}`),

  create: (data: Partial<LearningPath>) =>
    fetchAPI<{ message: string; path: LearningPath }>('/paths', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (id: string, data: Partial<LearningPath>) =>
    fetchAPI<{ message: string; path: LearningPath }>(`/paths/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchAPI<{ message: string }>(`/paths/${id}`, { method: 'DELETE' }),

  addCourse: (pathId: string, courseId: string, orderIndex?: number) =>
    fetchAPI<{ message: string }>(`/paths/${pathId}/courses`, {
      method: 'POST',
      body: JSON.stringify({ courseId, orderIndex }),
    }),

  removeCourse: (pathId: string, courseId: string) =>
    fetchAPI<{ message: string }>(`/paths/${pathId}/courses/${courseId}`, {
      method: 'DELETE',
    }),
};

export interface DashboardStats {
  stats: {
    enrolledCourses: number;
    completedCourses: number;
    lessonsCompleted: number;
    averageQuizScore: number;
  };
  currentCourses: Array<{
    id: string;
    title: string;
    thumbnail_url: string;
    progress: number;
  }>;
}

export interface QuizResult {
  passed: boolean;
  percentage: number;
  passingScore: number;
}

export interface DeadlineInfo {
  enrollmentId: string;
  courseId: string;
  title: string;
  isMandatory: boolean;
  deadline: string | null;
  completedAt: string | null;
  enrolledAt: string;
  status: 'completed' | 'no_deadline' | 'overdue' | 'urgent' | 'upcoming' | 'on_track';
  daysRemaining: number | null;
}

export interface LessonRequirements {
  lessonId: string;
  title: string;
  type: string;
  passingScore: number;
  currentScore: number | null;
  attempts: number;
  passed: boolean;
  status: string;
}

export const progressAPI = {
  getDashboard: () => fetchAPI<DashboardStats>('/progress/dashboard'),

  enrollInCourse: (courseId: string) =>
    fetchAPI<{ message: string } | { error: string; prerequisiteCourseId?: string }>(`/progress/enroll/${courseId}`, { method: 'POST' }),

  getCourseProgress: (courseId: string) =>
    fetchAPI<{ courseProgress: number; lessons: any[] }>(`/progress/course/${courseId}`),

  updateLessonProgress: (lessonId: string, data: { status?: string; progressPercent?: number; quizScore?: number }) =>
    fetchAPI<{ message: string; progress: any; courseProgress: number }>(`/progress/lesson/${lessonId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  completeLesson: (lessonId: string, quizScore?: number, totalQuestions?: number) =>
    fetchAPI<{ message: string; passed: boolean; quizResult?: QuizResult; courseProgress: number }>(`/progress/lesson/${lessonId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ quizScore, totalQuestions }),
    }),

  checkCourseAccess: (courseId: string) =>
    fetchAPI<{ canAccess: boolean; reason?: string; prerequisiteCourseId?: string }>(`/progress/access/${courseId}`),

  getDeadlines: () =>
    fetchAPI<{ deadlines: DeadlineInfo[] }>('/progress/deadlines'),

  getLessonRequirements: (lessonId: string) =>
    fetchAPI<LessonRequirements>(`/progress/lesson/${lessonId}/requirements`),
};

export interface AdminStats {
  stats: {
    totalLearners: number;
    totalCourses: number;
    totalLessons: number;
    totalEnrollments: number;
    completionRate: number;
    totalStudyHours: number;
    overdueEnrollments: number;
    averageQuizScore: number;
    quizPassRate: number;
  };
}

export interface MinistryStats {
  ministryStats: Array<{
    name: string;
    totalLearners: number;
    activeLearners: number;
    coursesCompleted: number;
    overdueCount: number;
    avgQuizScore: number;
    value: number;
  }>;
}

export interface MinistryCourseStats {
  ministryCourseStats: Array<{
    ministry: string;
    courseId: string;
    courseTitle: string;
    enrolledCount: number;
    completedCount: number;
    overdueCount: number;
    avgScore: number;
    completionRate: number;
  }>;
}

export interface OverdueLearner {
  userId: string;
  name: string;
  email: string;
  ministry: string;
  courseId: string;
  courseTitle: string;
  isMandatory: boolean;
  deadline: string;
  enrolledAt: string;
  daysOverdue: number;
}

export const adminAPI = {
  getStats: () => fetchAPI<AdminStats>('/admin/stats'),

  getMinistryStats: () => fetchAPI<MinistryStats>('/admin/ministry-stats'),

  getMinistryCourseStats: (ministry?: string) =>
    fetchAPI<MinistryCourseStats>(`/admin/ministry-course-stats${ministry ? `?ministry=${encodeURIComponent(ministry)}` : ''}`),

  getContentStats: () =>
    fetchAPI<{ contentStats: Array<{ name: string; value: number; count: number }> }>('/admin/content-stats'),

  getActivity: (limit = 20) =>
    fetchAPI<{ activity: any[] }>(`/admin/activity?limit=${limit}`),

  getOverdueLearners: () =>
    fetchAPI<{ overdueLearners: OverdueLearner[] }>('/admin/overdue'),

  getUsers: (params?: { page?: number; limit?: number; search?: string; role?: string; ministry?: string }) => {
    const query = new URLSearchParams(params as any).toString();
    return fetchAPI<{ users: any[]; pagination: any }>(`/admin/users?${query}`);
  },

  updateUser: (userId: string, data: { role?: string; isActive?: boolean }) =>
    fetchAPI<{ message: string; user: any }>(`/admin/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  createUser: (data: { email: string; password: string; name: string; ministry?: string; role?: string }) =>
    fetchAPI<{ message: string; user: any }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  resetUserPassword: (userId: string, newPassword: string) =>
    fetchAPI<{ message: string; userId: string }>(`/admin/users/${userId}/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ newPassword }),
    }),

  getUserPassword: (userId: string) =>
    fetchAPI<{ userId: string; email?: string; name?: string; password: string | null; message?: string }>(`/admin/users/${userId}/password`),

  getCoursesWithStats: () =>
    fetchAPI<{ courses: any[] }>('/admin/courses'),

  setCourseDeadline: (courseId: string, data: { deadline?: string | null; isMandatory?: boolean; prerequisiteCourseId?: string | null }) =>
    fetchAPI<{ message: string; course: any }>(`/admin/courses/${courseId}/deadline`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  setEnrollmentDeadline: (enrollmentId: string, deadline: string) =>
    fetchAPI<{ message: string; enrollment: any }>(`/admin/enrollments/${enrollmentId}/deadline`, {
      method: 'PUT',
      body: JSON.stringify({ deadline }),
    }),

  setLessonPassingScore: (lessonId: string, passingScore: number) =>
    fetchAPI<{ message: string; lesson: any }>(`/admin/lessons/${lessonId}/passing-score`, {
      method: 'PUT',
      body: JSON.stringify({ passingScore }),
    }),
};

export const uploadAPI = {
  uploadFile: async (
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ message: string; file: { originalName: string; fileName: string; fileUrl: string; mimeType: string; size: number } }> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            reject(new Error(data.error || 'Upload failed'));
          }
        } catch {
          reject(new Error('Invalid server response'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error during upload'));
      });

      xhr.addEventListener('timeout', () => {
        reject(new Error('Upload timed out'));
      });

      xhr.open('POST', `${API_BASE_URL}/upload/single`);
      xhr.setRequestHeader('Authorization', `Bearer ${authToken}`);
      xhr.timeout = 600000; 
      xhr.send(formData);
    });
  },

  uploadMultiple: async (files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await fetch(`${API_BASE_URL}/upload/multiple`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    return data;
  },

  deleteFile: (fileName: string, folder: string) =>
    fetchAPI<{ message: string }>('/upload/file', {
      method: 'DELETE',
      body: JSON.stringify({ fileName, folder }),
    }),

  getStats: () => fetchAPI<{ stats: any; total: any }>('/upload/stats'),
};

export const api = {
  auth: authAPI,
  courses: coursesAPI,
  paths: pathsAPI,
  progress: progressAPI,
  admin: adminAPI,
  upload: uploadAPI,
};

export default api;
