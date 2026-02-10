export enum UserRole {
  LEARNER = 'LEARNER',
  SUPERUSER = 'SUPERUSER',
  SUBADMIN = 'SUBADMIN',
  ADMIN = 'ADMIN'
}

export enum CourseStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED'
}

export type ContentType = 'video' | 'text' | 'quiz' | 'pdf' | 'presentation';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; 
  explanation?: string;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
}

export interface Lesson {
  id: string;
  title: string;
  type: ContentType;
  durationMin: number; 
  videoUrl?: string;
  content?: string;

  fileUrl?: string;
  fileName?: string;
  pageCount?: number; 

  orderIndex?: number;

  quiz?: QuizQuestion[];
  isCompleted?: boolean;

  progressPercent?: number; 
  quizScore?: number; 
  lastAccessedAt?: string; 

  passingScore?: number; 
  passed?: boolean; 
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  totalDuration: string;
  lessons: Lesson[];
  progress: number; 
  status: CourseStatus;

  orderIndex?: number;

  isPublished?: boolean; 

  enrolledCount?: number;
  avgCompletionTime?: number; 
  rating?: number;

  deadline?: string; 
  isMandatory?: boolean; 
  isOverdue?: boolean; 
  daysRemaining?: number; 

  prerequisiteCourseId?: string; 
  isLocked?: boolean; 
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  courseIds: string[];
  role: 'ALL' | 'SUPERUSER'; 
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  ministry: string;
  enrolledCourses: string[]; 
  completedPaths: string[];
}

export interface AnalyticData {
  name: string;
  value: number;
}

export interface MinistryCourseStat {
  ministry: string;
  courseId: string;
  courseTitle: string;
  enrolledCount: number;
  completedCount: number;
  avgScore: number;
  overdueCount: number;
}

export interface MinistryProgressData {
  name: string;
  totalLearners: number;
  activeLearners: number;
  coursesCompleted: number;
  overdueCount: number;
  avgCompletionRate: number;
  courseBreakdown?: MinistryCourseStat[];
}

export interface AdminDashboardStats {
  totalLearners: number;
  totalCourses: number;
  totalLessons: number;
  totalEnrollments: number;
  completionRate: number;
  totalStudyHours: number;
  overdueEnrollments: number;
  averageQuizScore: number;
}

export interface DeadlineInfo {
  deadline: string;
  daysRemaining: number;
  isOverdue: boolean;
  urgency: 'none' | 'low' | 'medium' | 'high' | 'overdue';
}