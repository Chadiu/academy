import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  BookOpen,
  Layout,
  Trophy,
  Settings,
  CheckCircle,
  LogOut,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Users,
  Menu,
  X,
  Plus,
  Save,
  ArrowLeft,
  ArrowRight,
  Lock,
  FileText,
  Video,
  HelpCircle,
  Trash2,
  MonitorPlay,
  List,
  Download,
  PlayCircle,
  RefreshCw,
  Award,
  Clock,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  XCircle,
  Calendar,
  AlertTriangle,
  Target,
  GripVertical,
  Pencil,
  Maximize2,
  Minimize2,
  ExternalLink,
  FileSpreadsheet,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Building2,
  Key,
  UserPlus,
  Search,
  Map,
  LogIn,
  LayoutDashboard,
  Route,
  MessageCircle,
  GraduationCap,
  PhoneCall
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { LiquidBackground } from './components/LiquidBackground';
import { LandingBackground } from './components/LandingBackground';
import { GlassCard, PrimaryButton, SecondaryButton, ProgressBar, Badge, FileDropZone, IconButton, ToastProvider, useToast, LiquidVideoFrame, LiquidGlass, LiquidGlassCard, LiquidGlassInput, LiquidGlassSelect, LiquidGlassButton } from './components/UIComponents';
import { AnimatePresence, Reorder, motion, LayoutGroup } from 'framer-motion';
import { PageTransition } from './components/PageTransition';
import { dataService } from './services/dataService';
import { authAPI, setAuthToken, getAuthToken, PendingUser, adminAPI } from './services/api';
import api from './services/api';
import { MINISTRIES } from './constants';
import { Course, User, UserRole, Lesson, AnalyticData, LearningPath, ContentType } from './types';

type View = 'LANDING' | 'AUTH' | 'DASHBOARD' | 'COURSE_PLAYER' | 'ADMIN' | 'WALKTHROUGH' | 'OFFICE_HOURS' | 'INFO_BAJANX' | 'INFO_BRIDGE' | 'INFO_CHATBB' | 'INFO_API_PUBLISHING' | 'INFO_CERTIFICATION' | 'INFO_FAQS';
type AdminSection = 'OVERVIEW' | 'USERS' | 'COURSES' | 'ANALYTICS';

const LEVEL_PRIORITY: Record<string, number> = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2 };
const sortCourses = (coursesToSort: Course[]): Course[] => {
  return [...coursesToSort].sort((a, b) => {
    
    const levelDiff = (LEVEL_PRIORITY[a.level] || 0) - (LEVEL_PRIORITY[b.level] || 0);
    if (levelDiff !== 0) return levelDiff;
    
    return (a.orderIndex ?? 999) - (b.orderIndex ?? 999);
  });
};

const isYouTubeUrl = (url: string) => {
  return url.includes('youtube.com') || url.includes('youtu.be');
};

const getYouTubeVideoId = (url: string) => {
  if (url.includes('youtu.be')) {
    return url.split('/').pop();
  }
  const urlParams = new URLSearchParams(new URL(url).search);
  return urlParams.get('v');
};

interface LiquidProgressTimelineProps {
  courses: Course[];
  totalProgress: number;
  onCourseClick: (course: Course) => void;
  isCourseUnlocked: (course: Course) => boolean;
}

const LiquidProgressTimeline: React.FC<LiquidProgressTimelineProps> = ({ courses, totalProgress, onCourseClick, isCourseUnlocked }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const checkScrollability = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const hasOverflow = container.scrollWidth > container.clientWidth;
      setCanScrollLeft(container.scrollLeft > 1);
      setCanScrollRight(hasOverflow && container.scrollLeft < container.scrollWidth - container.clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(checkScrollability, 100);
    const handleResize = () => checkScrollability();
    window.addEventListener('resize', handleResize);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', handleResize);
    };
  }, [courses.length, checkScrollability]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  const getTimelineProgress = () => {
    if (courses.length === 0) return 0;
    if (courses.length === 1) return courses[0].progress;

    let lastCompletedIdx = -1;
    let currentInProgressIdx = -1;
    let currentProgress = 0;

    courses.forEach((course, idx) => {
      if (course.progress === 100) {
        lastCompletedIdx = idx;
      } else if (course.progress > 0 && currentInProgressIdx === -1) {
        currentInProgressIdx = idx;
        currentProgress = course.progress;
      }
    });

    const totalNodes = courses.length;
    const nodeSpacing = 100 / (totalNodes - 1);

    if (lastCompletedIdx === totalNodes - 1) {
      return 100;
    } else if (currentInProgressIdx >= 0) {
      const baseProgress = currentInProgressIdx * nodeSpacing;
      const partialNodeProgress = (currentProgress / 100) * nodeSpacing;
      return baseProgress + partialNodeProgress;
    } else if (lastCompletedIdx >= 0) {
      return (lastCompletedIdx + 1) * nodeSpacing;
    }
    return 0;
  };

  const timelineProgress = getTimelineProgress();
  const needsScroll = courses.length > 12;
  const nodeWidth = 90; 

  return (
    <div className="relative">
      {}
      {needsScroll && (
        <>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); scroll('left'); }}
            className={`absolute -left-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/90 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/60 transition-all shadow-xl backdrop-blur-sm ${!canScrollLeft ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); scroll('right'); }}
            className={`absolute -right-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/90 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] hover:bg-[#D4AF37]/10 hover:border-[#D4AF37]/60 transition-all shadow-xl backdrop-blur-sm ${!canScrollRight ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <ChevronRight size={20} />
          </button>
        </>
      )}

      {}
      {needsScroll && (
        <>
          <div className={`absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[#111113] via-[#111113]/80 to-transparent z-20 pointer-events-none transition-opacity ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`} />
          <div className={`absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[#111113] via-[#111113]/80 to-transparent z-20 pointer-events-none transition-opacity ${canScrollRight ? 'opacity-100' : 'opacity-0'}`} />
        </>
      )}

      {}
      <div
        ref={scrollContainerRef}
        onScroll={checkScrollability}
        className={`px-6 py-8 ${needsScroll ? 'overflow-x-auto' : 'overflow-visible'}`}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className={`flex flex-col items-center justify-center mx-auto ${needsScroll ? 'w-fit' : 'w-full'}`}>

          {}
          <div className={`flex items-center justify-center`}>
            {courses.map((course, idx) => {
              const isCompleted = course.progress === 100;
              const isInProgress = course.progress > 0 && course.progress < 100;
              const isUnlocked = isCourseUnlocked(course);
              const isLocked = !isUnlocked;
              const moduleCode = course.code || `BX${idx + 1}`;
              const isHovered = hoveredIndex === idx;

              const circumference = 2 * Math.PI * 24;
              const progressOffset = circumference - (course.progress / 100) * circumference;

              return (
                <div
                  key={course.id}
                  className="flex flex-col items-center"
                  style={{ width: `${nodeWidth}px` }}
                >
                  {}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!isLocked) {
                        onCourseClick(course);
                      }
                    }}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`
                      relative w-[60px] h-[60px] rounded-full
                      flex items-center justify-center
                      transition-all duration-300 ease-out
                      ${isCompleted ? 'cursor-pointer' : isLocked ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                      ${!isLocked ? 'hover:scale-110 active:scale-95' : ''}
                    `}
                    disabled={isLocked}
                    title={course.title}
                  >
                    {}
                    {(isCompleted || isInProgress) && (
                      <motion.div
                        className="absolute -inset-2 rounded-full"
                        style={{
                          background: isCompleted
                            ? 'radial-gradient(circle, rgba(212,175,55,0.5) 0%, transparent 70%)'
                            : 'radial-gradient(circle, rgba(212,175,55,0.3) 0%, transparent 70%)',
                        }}
                        animate={isInProgress ? { scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] } : {}}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}

                    {}
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 60 60">
                      <circle
                        cx="30" cy="30" r="24" fill="none"
                        stroke={isLocked ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}
                        strokeWidth="3"
                      />
                      {!isLocked && (
                        <motion.circle
                          cx="30" cy="30" r="24" fill="none"
                          stroke="url(#goldGradientRing)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeDasharray={circumference}
                          initial={{ strokeDashoffset: circumference }}
                          animate={{ strokeDashoffset: progressOffset }}
                          transition={{ duration: 1, ease: [0.4, 0, 0.2, 1], delay: idx * 0.08 }}
                          style={{ filter: 'drop-shadow(0 0 8px rgba(212,175,55,0.8))' }}
                        />
                      )}
                      <defs>
                        <linearGradient id="goldGradientRing" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#F5D76E" />
                          <stop offset="50%" stopColor="#D4AF37" />
                          <stop offset="100%" stopColor="#B8962E" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {}
                    <div className={`
                      relative z-10 w-10 h-10 rounded-full flex items-center justify-center
                      font-bold text-sm transition-all duration-300
                      ${isCompleted
                        ? 'bg-gradient-to-br from-[#F5D76E] via-[#D4AF37] to-[#B8962E] text-black shadow-lg shadow-[#D4AF37]/30'
                        : isInProgress
                          ? 'bg-[#0a0a0b] text-[#D4AF37] ring-2 ring-[#D4AF37]/50'
                          : isLocked
                            ? 'bg-zinc-900 text-zinc-600 ring-1 ring-zinc-800'
                            : 'bg-[#0a0a0b] text-zinc-400 ring-1 ring-white/15'
                      }
                    `}>
                      {isCompleted ? (
                        <CheckCircle size={20} strokeWidth={2.5} />
                      ) : isLocked ? (
                        <Lock size={14} />
                      ) : isInProgress ? (
                        <span>{course.progress}%</span>
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    {}
                    {isInProgress && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-[#D4AF37]"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                  </button>

                  {}
                  <motion.span
                    className={`mt-3 text-xs font-semibold tracking-wide transition-colors
                      ${isCompleted ? 'text-[#D4AF37]' : isInProgress ? 'text-[#D4AF37]' : isLocked ? 'text-zinc-600' : 'text-zinc-500'}
                    `}
                    animate={isHovered && !isLocked ? { scale: 1.1 } : { scale: 1 }}
                  >
                    {moduleCode}
                  </motion.span>

                  {}
                  <AnimatePresence>
                    {isHovered && !isLocked && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 5 }}
                        className="absolute -top-16 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                      >
                        <div className="bg-black/95 backdrop-blur-xl border border-[#D4AF37]/40 rounded-lg px-3 py-2 shadow-2xl whitespace-nowrap">
                          <p className="text-xs text-white font-medium">{course.title}</p>
                          <p className="text-[10px] text-[#D4AF37] mt-0.5">{course.progress}% complete</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {}
          <div
            className="relative mt-8 flex justify-center"
            style={{ width: `${courses.length * nodeWidth}px` }}
          >
            {}
            <div className="relative h-2.5 w-full rounded-full bg-white/[0.04] border border-white/[0.08] overflow-hidden">
              {}
              <div className="absolute inset-0 rounded-full shadow-inner" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)' }} />

              {}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #B8962E 0%, #D4AF37 25%, #F5D76E 50%, #D4AF37 75%, #B8962E 100%)',
                  boxShadow: '0 0 14px rgba(212,175,55,0.6), 0 0 28px rgba(212,175,55,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                }}
                initial={{ width: '0%' }}
                animate={{ width: `${timelineProgress}%` }}
                transition={{ duration: 1.2, ease: [0.4, 0, 0.2, 1] }}
              />

              {}
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
                style={{ width: `${timelineProgress}%` }}
              >
                <motion.div
                  className="absolute inset-0 w-[200%]"
                  style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)' }}
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
                />
              </motion.div>
            </div>

            {}
            <div className="absolute inset-0 flex">
              {courses.map((course, idx) => {
                const isCompleted = course.progress === 100;
                const isInProgress = course.progress > 0 && course.progress < 100;
                const isUnlocked = isCourseUnlocked(course);
                const isLocked = !isUnlocked;

                return (
                  <div key={course.id} className="flex-1 flex justify-center">
                    <motion.div
                      className={`w-3.5 h-3.5 rounded-full -mt-0.5 border-2 transition-all
                        ${isCompleted
                          ? 'bg-[#D4AF37] border-[#F5D76E] shadow-[0_0_10px_rgba(212,175,55,0.8)]'
                          : isInProgress
                            ? 'bg-[#D4AF37]/70 border-[#D4AF37] shadow-[0_0_8px_rgba(212,175,55,0.5)]'
                            : isLocked
                              ? 'bg-zinc-800 border-zinc-700'
                              : 'bg-zinc-700 border-zinc-600'
                        }
                      `}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 + 0.3 }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('LANDING');
  const [user, setUser] = useState<User | null>(null);
  const [quizPassed, setQuizPassed] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [adminStats, setAdminStats] = useState<AnalyticData[]>([]);
  const [isLoading, setIsLoading] = useState(() => dataService.isAuthenticated());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [adminSection, setAdminSection] = useState<AdminSection>('OVERVIEW');
  const [draggedCourseId, setDraggedCourseId] = useState<string | null>(null);
  const [playerSidebarCollapsed, setPlayerSidebarCollapsed] = useState(false); 
  const [isAdminPreviewMode, setIsAdminPreviewMode] = useState(false); 
  const [userDashboardStats, setUserDashboardStats] = useState<{
    totalCourses: number;
    enrolledCourses: number;
    completedCourses: number;
    lessonsCompleted: number;
    averageQuizScore: number;
    completionPercentage: number;
  } | null>(null);

  useEffect(() => {
    const restoreSession = async () => {
      
      if (!dataService.isAuthenticated()) {
        return; 
      }

      setIsLoading(true);
      try {
        
        const fetchedUser = await dataService.getUser();
        setUser(fetchedUser);

        const savedView = localStorage.getItem('amini_active_view') as View | null;
        const savedCourseId = localStorage.getItem('amini_active_course_id');
        const savedLessonId = localStorage.getItem('amini_active_lesson_id');

        if (savedView) {
          if (savedView === 'COURSE_PLAYER' && savedCourseId) {
            
            const fetchedCourses = await dataService.getCourses();
            setCourses(sortCourses(fetchedCourses));
            setDataLoaded(true); 

            const targetCourse = fetchedCourses.find(c => c.id === savedCourseId);
            if (targetCourse) {
              setActiveCourse(targetCourse);
              const targetLesson = targetCourse.lessons.find(l => l.id === savedLessonId);
              setActiveLesson(targetLesson || targetCourse.lessons[0]);
              setCurrentView('COURSE_PLAYER');
            } else {
              setCurrentView('DASHBOARD');
            }
          } else if (savedView === 'ADMIN' && (fetchedUser.role === 'ADMIN' || fetchedUser.role === 'SUBADMIN')) {
            setCurrentView('ADMIN');
          } else if (savedView === 'DASHBOARD') {
            setCurrentView('DASHBOARD');
          } else {
            
            setCurrentView(fetchedUser.role === 'ADMIN' || fetchedUser.role === 'SUBADMIN' ? 'ADMIN' : 'DASHBOARD');
          }
        } else {
          
          setCurrentView(fetchedUser.role === 'ADMIN' || fetchedUser.role === 'SUBADMIN' ? 'ADMIN' : 'DASHBOARD');
        }
      } catch (error) {
        
        console.error('Session restoration failed:', error);
        setAuthToken(null);
        setCurrentView('LANDING');
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []); 

  useEffect(() => {
    if (user && currentView !== 'LANDING' && currentView !== 'AUTH') {
      localStorage.setItem('amini_active_view', currentView);
      if (activeCourse) {
        localStorage.setItem('amini_active_course_id', activeCourse.id);
      }
      if (activeLesson) {
        localStorage.setItem('amini_active_lesson_id', activeLesson.id);
      }
    }
  }, [currentView, activeCourse, activeLesson, user]);

  useEffect(() => {
    if (user?.role === UserRole.SUBADMIN && currentView === 'ADMIN') {
      if (adminSection === 'USERS' || adminSection === 'ANALYTICS') {
        setAdminSection('COURSES');
      }
    }
  }, [user, currentView, adminSection]);

  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      
      if (currentView !== 'DASHBOARD' && currentView !== 'ADMIN') return;
      if (dataLoaded) return; 

      setIsLoading(true);
      try {
        
        const [fetchedCourses, fetchedPaths] = await Promise.all([
          dataService.getCourses(),
          dataService.getPaths(),
        ]);
        
        setCourses(sortCourses(fetchedCourses));
        setPaths(fetchedPaths);
        setDataLoaded(true);

        if (!user) {
          try {
            const fetchedUser = await dataService.getUser();
            setUser(fetchedUser);
          } catch (err) {
            console.error('Failed to load user:', err);
          }
        }
      } catch (error) {
        console.error("Failed to load data", error);
      } finally {
        
        setTimeout(() => setIsLoading(false), 50);
      }
    };
    loadData();
  }, [currentView, dataLoaded]); 

  const [adminStatsLoaded, setAdminStatsLoaded] = useState(false);
  const [dashboardStatsLoaded, setDashboardStatsLoaded] = useState(false);

  useEffect(() => {
    if (currentView !== 'ADMIN' || adminStatsLoaded) return;
    const loadAdminStats = async () => {
      try {
        const stats = await dataService.getAdminStats();
        setAdminStats(stats);
        setAdminStatsLoaded(true);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      }
    };
    loadAdminStats();
  }, [currentView, adminStatsLoaded]);

  const refreshDashboardStats = async () => {
    try {
      const dashboardData = await dataService.getDashboardStats();
      setUserDashboardStats(dashboardData.stats);
    } catch (err) {
      console.error('Failed to refresh dashboard stats:', err);
    }
  };

  useEffect(() => {
    if (currentView !== 'DASHBOARD' || dashboardStatsLoaded) return;
    const loadDashboardStats = async () => {
      try {
        const dashboardData = await dataService.getDashboardStats();
        setUserDashboardStats(dashboardData.stats);
        setDashboardStatsLoaded(true);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      }
    };
    loadDashboardStats();
  }, [currentView, dashboardStatsLoaded]);

  useEffect(() => {
    if (!user) {
      
      setUserDashboardStats({
        totalCourses: 0,
        enrolledCourses: 0,
        completedCourses: 0,
        lessonsCompleted: 0,
        averageQuizScore: 0,
        completionPercentage: 0
      });
      setDashboardStatsLoaded(false);
      setAdminStatsLoaded(false);
      setDataLoaded(false);
      setCourses([]);
      setPaths([]);
      setActiveCourse(null);
      setActiveLesson(null);
      setAdminStats([]);
    }
  }, [user]);

  const canAccessCourse = (course: Course): { allowed: boolean; reason?: string; progressInfo?: string } => {
    const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
    const levelIndex = LEVELS.indexOf(course.level);

    const getCoursesInLevel = (level: string) => {
      return courses
        .filter(c => c.level === level)
        .sort((a, b) => (a.orderIndex ?? 999) - (b.orderIndex ?? 999));
    };

    const getCompletedCountInLevel = (level: string) => {
      return getCoursesInLevel(level).filter(c => c.progress === 100).length;
    };

    const isLevelFullyComplete = (level: string) => {
      const levelCourses = getCoursesInLevel(level);
      return levelCourses.length > 0 && levelCourses.every(c => c.progress === 100);
    };

    const levelCourses = getCoursesInLevel(course.level);
    const courseIndexInLevel = levelCourses.findIndex(c => c.id === course.id);
    const completedInLevel = getCompletedCountInLevel(course.level);

    if (levelIndex > 0) {
      const previousLevel = LEVELS[levelIndex - 1];
      if (!isLevelFullyComplete(previousLevel)) {
        const prevLevelCourses = getCoursesInLevel(previousLevel);
        const completedPrevious = getCompletedCountInLevel(previousLevel);
        return {
          allowed: false,
          reason: `Complete all ${previousLevel} courses to unlock ${course.level} courses.`,
          progressInfo: `${completedPrevious}/${prevLevelCourses.length} ${previousLevel} courses completed`
        };
      }
    }

    if (completedInLevel >= 2) {
      return { allowed: true };
    }

    if (courseIndexInLevel === 0) {
      return { allowed: true };
    }

    const previousCourse = levelCourses[courseIndexInLevel - 1];
    if (previousCourse && previousCourse.progress < 100) {
      return {
        allowed: false,
        reason: `Complete "${previousCourse.title}" first to unlock this course.`,
        progressInfo: `Complete ${2 - completedInLevel} more course(s) to unlock all ${course.level} courses`
      };
    }

    return { allowed: true };
  };

  const handleStartCourse = async (course: Course) => {
    
    const accessCheck = canAccessCourse(course);
    if (!accessCheck.allowed) {
      alert(accessCheck.reason);
      return;
    }

    if (!isAdminPreviewMode) {
      
      try {
        await dataService.enrollInCourse(course.id);
      } catch (error) {
        
        console.log('Enrollment:', error);
      }
    }

    setActiveCourse(course);
    
    const firstUncompleted = course.lessons.find(l => !l.isCompleted) || course.lessons[0];
    setActiveLesson(firstUncompleted || null);
    setCurrentView('COURSE_PLAYER');
  };

  const handleCourseDrop = async (level: 'Beginner' | 'Intermediate' | 'Advanced', fromIndex: number, toIndex: number): Promise<boolean> => {
    if (fromIndex === toIndex) return true;

    const levelCourses = courses.filter(c => c.level === level);
    const otherCourses = courses.filter(c => c.level !== level);
    const reordered = [...levelCourses];
    const [movedCourse] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movedCourse);

    const reorderedWithIndex = reordered.map((course, idx) => ({
      ...course,
      orderIndex: idx
    }));

    setCourses(sortCourses([...otherCourses, ...reorderedWithIndex]));

    try {
      const orderedIds = reorderedWithIndex.map(c => c.id);
      await dataService.reorderCourses(level, orderedIds);
      return true; 
    } catch (err) {
      console.error('Failed to reorder courses:', err);
      return false; 
    }
  };

  const handleLessonComplete = async (quizScore?: number, totalQuestions?: number) => {
    if (!activeCourse || !activeLesson) return;

    if (isAdminPreviewMode) {
      alert('Preview Mode: Progress is not saved. Exit preview mode to interact as yourself.');
      return;
    }

    try {
      const result = await dataService.completeLesson(activeLesson.id, quizScore, totalQuestions);
      console.log('Lesson completed, course progress:', result.courseProgress, 'passed:', result.passed);

      if (activeLesson.type === 'quiz' && !result.passed) {
        
        setQuizPassed(false);
        return; 
      }

      setQuizPassed(true);
    } catch (error) {
      console.error('Failed to save progress to backend:', error);
    }

    const updatedLessons = activeCourse.lessons.map(l =>
      l.id === activeLesson.id ? { ...l, isCompleted: true, passed: true } : l
    );

    const completedCount = updatedLessons.filter(l => l.isCompleted).length;
    const newProgress = Math.round((completedCount / updatedLessons.length) * 100);

    const newStatus = newProgress === 100 ? 'COMPLETED' : newProgress > 0 ? 'IN_PROGRESS' : 'NOT_STARTED';

    const updatedCourse = { ...activeCourse, lessons: updatedLessons, progress: newProgress, status: newStatus };
    setActiveCourse(updatedCourse);

    setCourses(prev => prev.map(c => c.id === updatedCourse.id ? updatedCourse : c));

    if (newProgress === 100) {
      refreshDashboardStats();
    }

    const currentIndex = updatedLessons.findIndex(l => l.id === activeLesson.id);
    if (currentIndex < updatedLessons.length - 1) {
      
      setActiveLesson(updatedLessons[currentIndex + 1]);
    } else if (newProgress === 100) {
      
      const levelOrder = ['Beginner', 'Intermediate', 'Advanced'];
      const currentLevelIdx = levelOrder.indexOf(activeCourse.level);

      const sameLevelCourses = courses.filter(c =>
        c.level === activeCourse.level &&
        c.id !== activeCourse.id &&
        c.progress < 100
      );

      if (sameLevelCourses.length > 0) {
        
        const nextCourse = sameLevelCourses[0];
        setActiveCourse(nextCourse);
        setActiveLesson(nextCourse.lessons.find(l => !l.isCompleted) || nextCourse.lessons[0]);
        return;
      }

      if (currentLevelIdx < levelOrder.length - 1) {
        const nextLevel = levelOrder[currentLevelIdx + 1];
        const nextLevelCourses = courses.filter(c => c.level === nextLevel);

        const canUnlockNextLevel = () => {
          for (let i = 0; i <= currentLevelIdx; i++) {
            const levelCourses = courses.filter(c => c.level === levelOrder[i]);
            const enrolledCourses = levelCourses.filter(c => c.progress > 0 || c.id === activeCourse.id);
            
            const allCompleted = enrolledCourses.every(c =>
              c.id === activeCourse.id ? true : c.progress === 100
            );
            if (enrolledCourses.length > 0 && !allCompleted) {
              return false;
            }
          }
          return true;
        };

        if (canUnlockNextLevel() && nextLevelCourses.length > 0) {
          
          const nextCourse = nextLevelCourses[0];
          setActiveCourse(nextCourse);
          setActiveLesson(nextCourse.lessons[0] || null);
          return;
        }
      }

      setCurrentView('DASHBOARD');
    }
  };

  const Sidebar = () => {
    const { showToast } = useToast();

    return (
    <div className={`fixed inset-y-0 left-0 z-50 w-64 transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 ease-in-out ${draggedCourseId ? 'opacity-20 blur-sm pointer-events-none' : 'opacity-100'} transition-opacity`}>
      {}
      <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-yellow-400/10 to-transparent" />

      <div className="h-full flex flex-col bg-[#0a0a0b] border-r border-white/[0.06]">
        {}
        <div className="p-8 relative">

          <div
            className="cursor-pointer group flex items-center gap-3"
            onClick={() => setCurrentView('LANDING')}
          >
            <svg width="193" height="40" viewBox="0 0 1926 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-auto group-hover:brightness-110 transition-all">
              <path d="M1925.41 400H1825.38V0H1925.41V400Z" fill="white"/>
              <path d="M1400.29 400H1312.78V0H1368.25L1639.82 244.8H1650.35V0H1737.87V400H1682.39L1410.82 155.2H1400.29V400Z" fill="white"/>
              <path d="M1225.26 400H1125.24V0H1225.26V400Z" fill="white"/>
              <path d="M625.132 400H537.613V0H674.577L787.666 244.8H790.179L903.268 0H1037.72V400H950.2V175L955.854 104H947.247L804.001 400H773.216L629.969 105.067H621.99L625.132 175V400Z" fill="white"/>
              <path d="M450.095 0V400H350.505V110.4H349.211L113.17 400H0V390.4L329.164 0H450.095Z" fill="white"/>
            </svg>
            <span className="font-helvetica-light text-white/70 group-hover:text-white transition-colors text-base tracking-[0.25em]">ACADEMY</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 py-2">
          {}
          {user?.role !== UserRole.ADMIN && user?.role !== UserRole.SUBADMIN && (
            <>
              <SidebarItem icon={<Layout size={20} />} label="Dashboard" active={currentView === 'DASHBOARD'} onClick={() => setCurrentView('DASHBOARD')} />
              <SidebarItem icon={<Calendar size={20} />} label="Office Hours" active={currentView === 'OFFICE_HOURS'} onClick={() => setCurrentView('OFFICE_HOURS')} />
            </>
          )}

          {}
          {(user?.role === UserRole.ADMIN || user?.role === UserRole.SUBADMIN) && (
            <>
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-helvetica-bold px-4 pt-4 pb-2">
                {user?.role === UserRole.ADMIN ? 'Admin Portal' : 'Course Management'}
              </div>

              <SidebarItem
                icon={<Layout size={20} />}
                label="Overview"
                active={currentView === 'ADMIN' && adminSection === 'OVERVIEW'}
                onClick={() => { if (currentView !== 'ADMIN') setCurrentView('ADMIN'); setAdminSection('OVERVIEW'); }}
              />

              {}
              {user?.role === UserRole.ADMIN && (
                <SidebarItem
                  icon={<UserCheck size={20} />}
                  label="User Approvals"
                  active={currentView === 'ADMIN' && adminSection === 'USERS'}
                  onClick={() => { if (currentView !== 'ADMIN') setCurrentView('ADMIN'); setAdminSection('USERS'); }}
                />
              )}

              <SidebarItem
                icon={<BookOpen size={20} />}
                label="Course Manager"
                active={currentView === 'ADMIN' && adminSection === 'COURSES'}
                onClick={() => { if (currentView !== 'ADMIN') setCurrentView('ADMIN'); setAdminSection('COURSES'); }}
              />

              {}
              {user?.role === UserRole.ADMIN && (
                <SidebarItem
                  icon={<Trophy size={20} />}
                  label="Analytics"
                  active={currentView === 'ADMIN' && adminSection === 'ANALYTICS'}
                  onClick={() => { if (currentView !== 'ADMIN') setCurrentView('ADMIN'); setAdminSection('ANALYTICS'); }}
                />
              )}

              {isAdminPreviewMode ? (
                <SidebarItem
                  icon={<EyeOff size={20} />}
                  label="Exit Preview"
                  active={false}
                  onClick={() => { setIsAdminPreviewMode(false); setCurrentView('ADMIN'); }}
                />
              ) : (
                <SidebarItem
                  icon={<Eye size={20} />}
                  label="Preview Mode"
                  active={false}
                  onClick={() => { setIsAdminPreviewMode(true); setCurrentView('DASHBOARD'); }}
                />
              )}
            </>
          )}
        </nav>

        {}
        <div className="p-6 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/5 flex items-center justify-center font-helvetica-bold text-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                {user?.name?.charAt(0) || 'U'}
              </div>
            </div>
            <div>
              <p className="text-xs font-helvetica-bold text-white">{user?.name || 'User'}</p>
              <p className="text-[10px] text-zinc-500 truncate w-32">{user?.ministry || 'Ministry'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              
              setAuthToken(null);
              setUser(null);

              setUserDashboardStats({
                totalCourses: 0,
                enrolledCourses: 0,
                completedCourses: 0,
                lessonsCompleted: 0,
                averageQuizScore: 0,
                completionPercentage: 0
              });

              setDashboardStatsLoaded(false);
              setAdminStatsLoaded(false);
              setDataLoaded(false);

              setCourses([]);
              setPaths([]);
              setActiveCourse(null);
              setActiveLesson(null);
              setAdminStats([]);

              setIsAdminPreviewMode(false);
              setCurrentView('LANDING');
            }}
            className="flex items-center gap-2.5 text-sm text-zinc-500 hover:text-red-400 transition-all w-full group py-2 px-3 rounded-xl hover:bg-red-500/10"
          >
            <LogOut size={16} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
  };

  const SidebarItem = ({ icon, label, active, onClick, badge }: any) => {
    const [isRadiating, setIsRadiating] = useState(false);
    const [clickPos, setClickPos] = useState({ x: 0, y: 0 });

    const handleClick = (e: React.MouseEvent) => {
      if (active) {
        onClick();
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      setClickPos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });

      setIsRadiating(true);

      setTimeout(() => {
        onClick();
      }, 250); 

      setTimeout(() => {
        setIsRadiating(false);
      }, 600); 
    };

    return (
      <button
        type="button"
        onClick={handleClick}
        className={`
        relative w-full flex items-center gap-3 px-4 py-2 rounded-xl transition-all duration-300 overflow-hidden
        ${active
            ? 'text-[#D4AF37] border border-[#D4AF37]/40 bg-[#D4AF37]/5'
            : 'text-zinc-500 hover:text-white hover:bg-white/[0.03]'
          }
        ${isRadiating ? 'scale-95 brightness-125' : 'scale-100'}
        active:scale-[0.96] active:duration-75
      `}
      >
        {}
        {isRadiating && (
          <div
            className="absolute pointer-events-none rounded-full border-2 border-[#D4AF37] animate-radiant z-20"
            style={{
              left: clickPos.x,
              top: clickPos.y,
              width: '10px',
              height: '10px',
              marginLeft: '-5px',
              marginTop: '-5px'
            }}
          />
        )}

        {}
        {isRadiating && (
          <div className="absolute inset-0 bg-[#D4AF37]/20 animate-gold-flood z-0" />
        )}

        <span className="relative z-10 scale-90">{icon}</span>
        <span className={`relative z-10 font-helvetica text-[13px] tracking-wide ${active || isRadiating ? 'font-helvetica-bold' : ''}`}>{label}</span>
        {badge && <span className="relative z-10 ml-auto">{badge}</span>}
      </button>
    );
  };

  const LandingView = () => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollTo = (id: string) => {
      const el = document.getElementById(id);
      const container = scrollContainerRef.current;
      if (el && container) {
        const offsetTop = el.offsetTop - 80;
        container.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
    };

    const fadeInUp = {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    };

    const staggerContainer = {
      animate: { transition: { staggerChildren: 0.1 } }
    };

    return (
      <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto overflow-x-hidden z-10 scroll-smooth">
        {}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          {}
          <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[12px] border-b border-white/[0.05]" />
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/15 to-transparent" />
          <div className="relative max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg width="193" height="40" viewBox="0 0 1926 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-auto">
                <path d="M1925.41 400H1825.38V0H1925.41V400Z" fill="white"/>
                <path d="M1400.29 400H1312.78V0H1368.25L1639.82 244.8H1650.35V0H1737.87V400H1682.39L1410.82 155.2H1400.29V400Z" fill="white"/>
                <path d="M1225.26 400H1125.24V0H1225.26V400Z" fill="white"/>
                <path d="M625.132 400H537.613V0H674.577L787.666 244.8H790.179L903.268 0H1037.72V400H950.2V175L955.854 104H947.247L804.001 400H773.216L629.969 105.067H621.99L625.132 175V400Z" fill="white"/>
                <path d="M450.095 0V400H350.505V110.4H349.211L113.17 400H0V390.4L329.164 0H450.095Z" fill="white"/>
              </svg>
              <span className="text-white/40 font-helvetica-light tracking-[0.25em] text-base">ACADEMY</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <button type="button" onClick={() => scrollTo('paths')} className="text-sm text-zinc-400 hover:text-white transition-colors duration-300">Paths</button>
              <button type="button" onClick={() => scrollTo('certification')} className="text-sm text-zinc-400 hover:text-white transition-colors duration-300">Certification</button>
              <button type="button" onClick={() => scrollTo('support')} className="text-sm text-zinc-400 hover:text-white transition-colors duration-300">Support</button>
              <button type="button" onClick={() => setCurrentView('WALKTHROUGH')} className="text-sm text-zinc-400 hover:text-white transition-colors duration-300">Walkthrough</button>
              <button
                type="button"
                onClick={() => setCurrentView('AUTH')}
                className="relative px-6 py-2.5 text-sm font-medium rounded-full overflow-hidden group/nav bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/[0.05] transition-all duration-300"
              >
                <span className="relative text-white group-hover/nav:text-[#D4AF37] transition-colors duration-300">Sign In</span>
              </button>
            </div>
            <button type="button" className="md:hidden text-white/80" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.05] px-8 py-6 space-y-4"
            >
              <button type="button" onClick={() => { scrollTo('paths'); setMobileMenuOpen(false); }} className="block text-zinc-300 hover:text-white py-2 w-full text-left">Paths</button>
              <button type="button" onClick={() => { scrollTo('certification'); setMobileMenuOpen(false); }} className="block text-zinc-300 hover:text-white py-2 w-full text-left">Certification</button>
              <button type="button" onClick={() => { scrollTo('support'); setMobileMenuOpen(false); }} className="block text-zinc-300 hover:text-white py-2 w-full text-left">Support</button>
              <button type="button" onClick={() => { setCurrentView('WALKTHROUGH'); setMobileMenuOpen(false); }} className="block text-zinc-300 hover:text-white py-2 w-full text-left">Walkthrough</button>
              <LiquidGlassButton onClick={() => setCurrentView('AUTH')} className="w-full mt-4">Sign In</LiquidGlassButton>
            </motion.div>
          )}
        </motion.nav>

        {}
        <section className="min-h-screen flex flex-col items-center justify-center px-8 pt-20 pb-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="max-w-5xl mx-auto text-center relative"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-helvetica-bold leading-[1.2] mb-8 tracking-tight liquid-glass-text uppercase">
              <span className="mercury-blob" aria-hidden="true" />
              <span className="mercury-sheen" aria-hidden="true" />
              <span className="relative z-[1] text-white whitespace-nowrap">NATIONAL AI INFRASTRUCTURE</span>
              <br />
              <span className="relative z-[1] text-transparent bg-clip-text bg-gradient-to-r from-[#F5D76E] via-[#D4AF37] to-[#B8962E] whitespace-nowrap">
                REQUIRES NATIONAL EXPERTISE.
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-14 leading-relaxed font-light"
            >
              Master the tools powering Barbados' digital transformation.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-5 justify-center"
            >
              <button
                type="button"
                onClick={() => setCurrentView('AUTH')}
                className="group relative px-10 py-4 rounded-xl overflow-hidden bg-gradient-to-r from-[#B8962E] via-[#D4AF37] to-[#F5D76E] text-black font-bold text-lg hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all duration-500"
              >
                <span className="relative z-10">Start Learning</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700" />
              </button>

              <button
                type="button"
                onClick={() => scrollTo('paths')}
                className="group relative px-10 py-4 rounded-xl overflow-hidden bg-white/[0.02] backdrop-blur-[8px] border border-white/[0.08] text-white font-semibold text-lg hover:bg-white/[0.04] hover:border-white/15 transition-all duration-300"
              >
                <span className="relative z-10">Explore Paths</span>
                {/* Liquid light effect on hover */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_70%)]" />
              </button>
            </motion.div>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            type="button"
            onClick={() => scrollTo('value')}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-zinc-500 hover:text-[#D4AF37] transition-colors duration-300 cursor-pointer"
          >
            <span className="text-xs uppercase tracking-[0.3em] font-medium">Discover</span>
            <ChevronDown size={24} className="animate-bounce" />
          </motion.button>
        </section>

        {/* ===== VALUE PROPOSITION ===== */}
        <section id="value" className="py-28 px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <LiquidGlass hover={false}>
              <div className="p-12 md:p-16 text-center">
                <h2 className="text-3xl md:text-4xl font-helvetica-bold mb-8 leading-tight text-white">
                  Build the skills to transform<br />government services
                </h2>
                <p className="text-lg text-zinc-400 leading-relaxed max-w-3xl mx-auto">
                  Amini Academy provides structured, hands-on training in the tools powering Barbados' digital transformation.
                  Whether you're connecting government data, enabling citizen services, or publishing APIs, we'll guide you from fundamentals to mastery.
                </p>
              </div>
            </LiquidGlass>
          </motion.div>
        </section>

        {}
        <section id="paths" className="py-28 px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">Choose Your Path</h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">Select the path that matches your role. Build comprehensive expertise across all platforms.</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <LiquidGlass>
                  <div className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-blue-400/[0.08] backdrop-blur-sm border border-blue-400/[0.15] flex items-center justify-center mb-6">
                      <Layout size={28} className="text-blue-400" />
                    </div>
                    <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/[0.03] backdrop-blur-sm text-zinc-500 border border-white/[0.08] mb-5">Coming Soon</div>
                    <h3 className="text-xl font-bold text-white mb-3">Bridge</h3>
                    <p className="text-zinc-400 mb-6 text-sm leading-relaxed">Learn to navigate Barbados' private knowledge graph, from querying cabinet records to authoring papers.</p>
                    <ul className="space-y-3 text-sm text-zinc-400">
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Query structured government data</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Surface policy precedents</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Connect islands of information</li>
                    </ul>
                  </div>
                </LiquidGlass>
              </motion.div>

              {/* ChatBB */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <LiquidGlass>
                  <div className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-emerald-400/[0.08] backdrop-blur-sm border border-emerald-400/[0.15] flex items-center justify-center mb-6">
                      <HelpCircle size={28} className="text-emerald-400" />
                    </div>
                    <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/[0.03] backdrop-blur-sm text-zinc-500 border border-white/[0.08] mb-5">Coming Soon</div>
                    <h3 className="text-xl font-bold text-white mb-3">ChatBB</h3>
                    <p className="text-zinc-400 mb-6 text-sm leading-relaxed">AI-powered citizen service tools via WhatsApp</p>
                    <ul className="space-y-3 text-sm text-zinc-400">
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Citizen query monitoring & handling</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Data Stewardship</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Data privacy & classification</li>
                    </ul>
                  </div>
                </LiquidGlass>
              </motion.div>

              {/* Bajan-X - Gold Featured */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <LiquidGlass gold>
                  <div className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-[#D4AF37]/[0.1] backdrop-blur-sm border border-[#D4AF37]/[0.2] flex items-center justify-center mb-6">
                      <Settings size={28} className="text-[#D4AF37]" />
                    </div>
                    <div className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#D4AF37]/[0.08] backdrop-blur-sm text-[#D4AF37] border border-[#D4AF37]/[0.2] mb-5">Available Now</div>
                    <h3 className="text-xl font-bold text-white mb-3">Bajan-X</h3>
                    <p className="text-zinc-300 mb-6 text-sm leading-relaxed">Build, publish, and manage APIs to connect government systems and data</p>
                    <ul className="space-y-3 text-sm text-zinc-300 mb-8">
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />API fundamentals and development</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Publishing and documenting APIs</li>
                      <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />Monitoring, maintenance, and governance</li>
                    </ul>
                    <LiquidGlassButton onClick={() => setCurrentView('AUTH')} className="w-full">
                      Start Training
                    </LiquidGlassButton>
                  </div>
                </LiquidGlass>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== CERTIFICATION ===== */}
        <section id="certification" className="py-28 px-8">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">Certification</h2>
              <p className="text-lg text-zinc-400">Start your journey. Earn badges. Lead the transformation.</p>
            </motion.div>

            <div className="space-y-6">
              {/* Champion */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <LiquidGlass gold>
                  <div className="p-8 md:p-10 flex flex-col md:flex-row items-start gap-6">
                    <div className="w-16 h-16 rounded-xl bg-[#D4AF37]/[0.08] backdrop-blur-sm border border-[#D4AF37]/[0.15] flex items-center justify-center shrink-0">
                      <Award size={32} className="text-[#D4AF37]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-3">Bajan-X Champion</h3>
                      <p className="text-zinc-400 mb-5 text-sm leading-relaxed">Complete all 8 Bajan-X courses, submit a capstone project, and pass the final assessment with 80%+</p>
                      <div className="flex flex-wrap gap-2 mb-5">
                        <span className="px-3 py-1.5 rounded-lg text-xs bg-[#D4AF37]/[0.05] backdrop-blur-sm text-[#D4AF37] border border-[#D4AF37]/[0.12]">BX1-BX8 Courses</span>
                        <span className="px-3 py-1.5 rounded-lg text-xs bg-[#D4AF37]/[0.05] backdrop-blur-sm text-[#D4AF37] border border-[#D4AF37]/[0.12]">Capstone Project</span>
                        <span className="px-3 py-1.5 rounded-lg text-xs bg-[#D4AF37]/[0.05] backdrop-blur-sm text-[#D4AF37] border border-[#D4AF37]/[0.12]">80%+ Assessment</span>
                      </div>
                      <button type="button" onClick={() => setCurrentView('AUTH')} className="text-[#D4AF37] hover:text-[#F5D76E] transition-colors text-sm font-medium">Start your journey</button>
                    </div>
                  </div>
                </LiquidGlass>
              </motion.div>

              {/* Superuser */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <LiquidGlass>
                  <div className="p-8 md:p-10 flex flex-col md:flex-row items-start gap-6">
                    <div className="w-16 h-16 rounded-xl bg-purple-400/[0.08] backdrop-blur-sm border border-purple-400/[0.15] flex items-center justify-center shrink-0">
                      <Trophy size={32} className="text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-3">Certified Superuser</h3>
                      <p className="text-zinc-400 mb-5 text-sm leading-relaxed">Complete all three learning paths (Bridge, ChatBB, Bajan-X) to lead digital transformation in your ministry</p>
                      <div className="flex flex-wrap gap-2 mb-5">
                        <span className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.02] backdrop-blur-sm text-zinc-400 border border-white/[0.08]">Advanced Training</span>
                        <span className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.02] backdrop-blur-sm text-zinc-400 border border-white/[0.08]">Priority Support</span>
                        <span className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.02] backdrop-blur-sm text-zinc-400 border border-white/[0.08]">Exclusive Network</span>
                      </div>
                      <button type="button" onClick={() => setCurrentView('AUTH')} className="text-[#D4AF37] hover:text-[#F5D76E] transition-colors text-sm font-medium">Learn more</button>
                    </div>
                  </div>
                </LiquidGlass>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== SUPPORT ===== */}
        <section id="support" className="py-28 px-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">Get Help When You Need It</h2>
              <p className="text-lg text-zinc-400">Multiple support channels to ensure your success</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <LiquidGlass>
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-xl bg-[#D4AF37]/[0.08] backdrop-blur-sm border border-[#D4AF37]/[0.15] flex items-center justify-center mx-auto mb-6">
                      <Calendar size={32} className="text-[#D4AF37]" />
                    </div>
                    <h3 className="font-bold text-white text-lg mb-3">Office Hours</h3>
                    <p className="text-zinc-400 mb-2 text-sm">Join weekly 3-hour sessions with instructors</p>
                    <p className="text-[#D4AF37] font-medium mb-1">Every Thursday, 2-5 PM</p>
                    <p className="text-xs text-zinc-500">Book 15-minute slots to troubleshoot and connect</p>
                  </div>
                </LiquidGlass>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <LiquidGlass>
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-xl bg-blue-400/[0.08] backdrop-blur-sm border border-blue-400/[0.15] flex items-center justify-center mx-auto mb-6">
                      <FileText size={32} className="text-blue-400" />
                    </div>
                    <h3 className="font-bold text-white text-lg mb-3">Documentation</h3>
                    <p className="text-zinc-400 mb-2 text-sm">Access reference guides and quick-starts</p>
                    <p className="text-[#D4AF37] font-medium mb-1">Step-by-step tutorials</p>
                    <p className="text-xs text-zinc-500">Searchable knowledge base available 24/7</p>
                  </div>
                </LiquidGlass>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== FOOTER ===== */}
        <footer className="relative py-16 px-8 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
              <div>
                <h4 className="text-[#D4AF37] font-bold uppercase tracking-wider text-xs mb-5">Products</h4>
                <ul className="space-y-3 text-sm">
                  <li><button type="button" onClick={() => setCurrentView('INFO_BRIDGE')} className="text-zinc-500 hover:text-white transition-colors">Bridge Platform</button></li>
                  <li><button type="button" onClick={() => setCurrentView('INFO_CHATBB')} className="text-zinc-500 hover:text-white transition-colors">ChatBB</button></li>
                  <li><button type="button" onClick={() => setCurrentView('INFO_BAJANX')} className="text-zinc-500 hover:text-white transition-colors">Bajan-X</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[#D4AF37] font-bold uppercase tracking-wider text-xs mb-5">Learning</h4>
                <ul className="space-y-3 text-sm">
                  <li><button type="button" onClick={() => setCurrentView('INFO_BAJANX')} className="text-zinc-500 hover:text-white transition-colors">Foundations</button></li>
                  <li><button type="button" onClick={() => setCurrentView('INFO_API_PUBLISHING')} className="text-zinc-500 hover:text-white transition-colors">API Publishing</button></li>
                  <li><button type="button" onClick={() => setCurrentView('INFO_CERTIFICATION')} className="text-zinc-500 hover:text-white transition-colors">Certification</button></li>
                  <li><button type="button" onClick={() => setCurrentView('WALKTHROUGH')} className="text-zinc-500 hover:text-white transition-colors">Platform Walkthrough</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[#D4AF37] font-bold uppercase tracking-wider text-xs mb-5">Resources</h4>
                <ul className="space-y-3 text-sm">
                  <li><button type="button" onClick={() => setCurrentView('WALKTHROUGH')} className="text-zinc-500 hover:text-white transition-colors">Documentation</button></li>
                  <li><a href="https://calendly.com/chadi-lgs/1-1-call-with-amini" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">Office Hours</a></li>
                  <li><button type="button" onClick={() => setCurrentView('INFO_FAQS')} className="text-zinc-500 hover:text-white transition-colors">FAQs</button></li>
                  <li><a href="https://form.typeform.com/to/hmKfwlfB" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">Report a Problem</a></li>
                  <li><a href="https://form.typeform.com/to/Btyf6iJf" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">Contact Us</a></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[#D4AF37] font-bold uppercase tracking-wider text-xs mb-5">About</h4>
                <ul className="space-y-3 text-sm">
                  <li><a href="https://www.amini.ai/" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">Amini HQ</a></li>
                  <li><a href="https://www.amini.ai/legal-pages/%20data-privacy-policy" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="https://www.amini.ai/legal-pages/terms-of-service" target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">Terms of Use</a></li>
                </ul>
              </div>
            </div>

            <div className="h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent mb-8" />

            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <svg width="193" height="40" viewBox="0 0 1926 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-auto opacity-20">
                  <path d="M1925.41 400H1825.38V0H1925.41V400Z" fill="white"/>
                  <path d="M1400.29 400H1312.78V0H1368.25L1639.82 244.8H1650.35V0H1737.87V400H1682.39L1410.82 155.2H1400.29V400Z" fill="white"/>
                  <path d="M1225.26 400H1125.24V0H1225.26V400Z" fill="white"/>
                  <path d="M625.132 400H537.613V0H674.577L787.666 244.8H790.179L903.268 0H1037.72V400H950.2V175L955.854 104H947.247L804.001 400H773.216L629.969 105.067H621.99L625.132 175V400Z" fill="white"/>
                  <path d="M450.095 0V400H350.505V110.4H349.211L113.17 400H0V390.4L329.164 0H450.095Z" fill="white"/>
                </svg>
                <span className="text-white/20 font-helvetica-light tracking-[0.25em] text-base">ACADEMY</span>
              </div>
              <p className="text-xs text-zinc-600">
                2026 Amini Academy | Powering Barbados' Digital Transformation
              </p>
            </div>
          </div>
        </footer>
      </div>
    );
  };

  const WalkthroughView = () => {
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollTo = (id: string) => {
      const el = document.getElementById(id);
      const container = scrollContainerRef.current;
      if (el && container) {
        const offsetTop = el.offsetTop - 80;
        container.scrollTo({ top: offsetTop, behavior: 'smooth' });
      }
    };

    const fadeInUp = {
      initial: { opacity: 0, y: 30 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    };

    return (
      <div ref={scrollContainerRef} className="absolute inset-0 overflow-y-auto overflow-x-hidden z-10 scroll-smooth">
        {}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="fixed top-0 left-0 right-0 z-50"
        >
          <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[12px] border-b border-white/[0.05]" />
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/15 to-transparent" />
          <div className="relative max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg width="193" height="40" viewBox="0 0 1926 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-auto">
                <path d="M1925.41 400H1825.38V0H1925.41V400Z" fill="white"/>
                <path d="M1400.29 400H1312.78V0H1368.25L1639.82 244.8H1650.35V0H1737.87V400H1682.39L1410.82 155.2H1400.29V400Z" fill="white"/>
                <path d="M1225.26 400H1125.24V0H1225.26V400Z" fill="white"/>
                <path d="M625.132 400H537.613V0H674.577L787.666 244.8H790.179L903.268 0H1037.72V400H950.2V175L955.854 104H947.247L804.001 400H773.216L629.969 105.067H621.99L625.132 175V400Z" fill="white"/>
                <path d="M450.095 0V400H350.505V110.4H349.211L113.17 400H0V390.4L329.164 0H450.095Z" fill="white"/>
              </svg>
              <span className="text-white/40 font-helvetica-light tracking-[0.25em] text-base">ACADEMY</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <button type="button" onClick={() => scrollTo('getting-started')} className="text-sm text-zinc-400 hover:text-white transition-colors duration-300">Getting Started</button>
              <button type="button" onClick={() => scrollTo('dashboard')} className="text-sm text-zinc-400 hover:text-white transition-colors duration-300">Dashboard</button>
              <button type="button" onClick={() => scrollTo('learning-tracks')} className="text-sm text-zinc-400 hover:text-white transition-colors duration-300">Learning Tracks</button>
              <button type="button" onClick={() => scrollTo('support')} className="text-sm text-zinc-400 hover:text-white transition-colors duration-300">Support</button>
              <button
                type="button"
                onClick={() => setCurrentView('LANDING')}
                className="relative px-6 py-2.5 text-sm font-medium rounded-full overflow-hidden group/nav bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/[0.05] transition-all duration-300"
              >
                <span className="relative text-white group-hover/nav:text-[#D4AF37] transition-colors duration-300">Back to Home</span>
              </button>
            </div>
            <button type="button" className="md:hidden text-white/80" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white/[0.02] backdrop-blur-xl border-b border-white/[0.05] px-8 py-6 space-y-4"
            >
              <button type="button" onClick={() => { scrollTo('getting-started'); setMobileMenuOpen(false); }} className="block text-zinc-300 hover:text-white py-2 w-full text-left">Getting Started</button>
              <button type="button" onClick={() => { scrollTo('dashboard'); setMobileMenuOpen(false); }} className="block text-zinc-300 hover:text-white py-2 w-full text-left">Dashboard</button>
              <button type="button" onClick={() => { scrollTo('learning-tracks'); setMobileMenuOpen(false); }} className="block text-zinc-300 hover:text-white py-2 w-full text-left">Learning Tracks</button>
              <button type="button" onClick={() => { scrollTo('support'); setMobileMenuOpen(false); }} className="block text-zinc-300 hover:text-white py-2 w-full text-left">Support</button>
              <LiquidGlassButton onClick={() => setCurrentView('LANDING')} className="w-full mt-4">Back to Home</LiquidGlassButton>
            </motion.div>
          )}
        </motion.nav>

        {}
        <section className="min-h-screen flex flex-col items-center justify-center px-8 pt-20 pb-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="max-w-5xl mx-auto text-center relative"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-helvetica-bold leading-[1.2] mb-8 tracking-tight liquid-glass-text uppercase">
              <span className="mercury-blob" aria-hidden="true" />
              <span className="mercury-sheen" aria-hidden="true" />
              <span className="relative z-[1] text-white whitespace-nowrap">ACADEMY</span>
              <br />
              <span className="relative z-[1] text-transparent bg-clip-text bg-gradient-to-r from-[#F5D76E] via-[#D4AF37] to-[#B8962E] whitespace-nowrap">
                WALKTHROUGH
              </span>
            </h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-14 leading-relaxed font-light"
            >
              Your complete guide to mastering the Amini Academy platform
            </motion.p>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              type="button"
              onClick={() => scrollTo('getting-started')}
              className="group relative px-10 py-4 rounded-xl overflow-hidden bg-gradient-to-r from-[#B8962E] via-[#D4AF37] to-[#F5D76E] text-black font-bold text-lg hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all duration-500"
            >
              <span className="relative z-10">Begin Guide</span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700" />
            </motion.button>
          </motion.div>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            type="button"
            onClick={() => scrollTo('getting-started')}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-zinc-500 hover:text-[#D4AF37] transition-colors duration-300 cursor-pointer"
          >
            <span className="text-xs uppercase tracking-[0.3em] font-medium">Scroll</span>
            <ChevronDown size={24} className="animate-bounce" />
          </motion.button>
        </section>

        {}
        <section id="getting-started" className="py-28 px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">Getting Started</h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">Everything you need to begin your learning journey</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <LiquidGlass>
                  <div className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-blue-400/[0.08] backdrop-blur-sm border border-blue-400/[0.15] flex items-center justify-center mb-6">
                      <Map size={28} className="text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">Visit Academy</h3>
                    <p className="text-zinc-400 mb-5 text-sm leading-relaxed">
                      Navigate to <span className="text-[#D4AF37] font-mono">academy.amini.ai</span> to access the platform
                    </p>
                    <ul className="space-y-3 text-sm text-zinc-400">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2" />
                        <span>Explore the learning paths available</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2" />
                        <span>Review certification requirements</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2" />
                        <span>Understand the course structure</span>
                      </li>
                    </ul>
                  </div>
                </LiquidGlass>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <LiquidGlass gold>
                  <div className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-[#D4AF37]/[0.1] backdrop-blur-sm border border-[#D4AF37]/[0.2] flex items-center justify-center mb-6">
                      <UserPlus size={28} className="text-[#D4AF37]" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">Create Account</h3>
                    <p className="text-zinc-300 mb-5 text-sm leading-relaxed">
                      Register with your government email to request access
                    </p>
                    <ul className="space-y-3 text-sm text-zinc-300">
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2" />
                        <span>Use your official government email address</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2" />
                        <span>Provide your ministry and role information</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-2" />
                        <span>Submit your access request for admin approval</span>
                      </li>
                    </ul>
                  </div>
                </LiquidGlass>
              </motion.div>
            </div>
          </div>
        </section>

        {}
        <section id="sign-in" className="py-28 px-8 bg-white/[0.01]">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <LiquidGlass>
                <div className="p-12">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 rounded-xl bg-emerald-400/[0.08] backdrop-blur-sm border border-emerald-400/[0.15] flex items-center justify-center shrink-0">
                      <LogIn size={32} className="text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-3xl font-helvetica-bold mb-6 text-white">Sign In Process</h2>
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-lg font-bold text-white mb-3">Login & Approval</h4>
                          <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                            After your account is created, an administrator must approve your access before you can begin learning.
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.03] text-zinc-400 border border-white/[0.08]">Account verification</span>
                            <span className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.03] text-zinc-400 border border-white/[0.08]">Admin approval required</span>
                            <span className="px-3 py-1.5 rounded-lg text-xs bg-white/[0.03] text-zinc-400 border border-white/[0.08]">Email notification</span>
                          </div>
                        </div>
                        <div className="h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent" />
                        <div>
                          <h4 className="text-lg font-bold text-white mb-3">First Login</h4>
                          <p className="text-zinc-400 text-sm leading-relaxed">
                            Once approved, sign in with your credentials to access your personalized dashboard and begin your learning journey.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </LiquidGlass>
            </motion.div>
          </div>
        </section>

        {}
        <section id="dashboard" className="py-28 px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">Your Dashboard</h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">Track your progress and access all learning materials</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <LiquidGlass>
                  <div className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-purple-400/[0.08] backdrop-blur-sm border border-purple-400/[0.15] flex items-center justify-center mb-6">
                      <BarChart3 size={28} className="text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Learning Metrics</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      View your course completion stats, quiz scores, and overall progress at a glance.
                    </p>
                  </div>
                </LiquidGlass>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <LiquidGlass>
                  <div className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-orange-400/[0.08] backdrop-blur-sm border border-orange-400/[0.15] flex items-center justify-center mb-6">
                      <Route size={28} className="text-orange-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Learning Journey</h3>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      Follow your path through BX1-BX8 modules with visual progress tracking and milestones.
                    </p>
                  </div>
                </LiquidGlass>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <LiquidGlass gold>
                  <div className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-[#D4AF37]/[0.1] backdrop-blur-sm border border-[#D4AF37]/[0.2] flex items-center justify-center mb-6">
                      <Target size={28} className="text-[#D4AF37]" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Course Access</h3>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      Quick access to all your enrolled courses and upcoming lessons in one place.
                    </p>
                  </div>
                </LiquidGlass>
              </motion.div>
            </div>
          </div>
        </section>

        {}
        <section id="learning-tracks" className="py-28 px-8 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">Learning Tracks</h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">Structured paths from fundamentals to advanced mastery</p>
            </motion.div>

            <div className="space-y-6">
              {}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <LiquidGlass>
                  <div className="p-8 md:p-10">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-xl bg-green-400/[0.08] backdrop-blur-sm border border-green-400/[0.15] flex items-center justify-center shrink-0">
                        <BookOpen size={32} className="text-green-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-2xl font-bold text-white">Beginner Track</h3>
                          <span className="px-3 py-1 rounded-full text-xs bg-green-400/[0.08] text-green-400 border border-green-400/[0.15]">Weeks 1-2</span>
                        </div>
                        <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
                          Build foundational knowledge of APIs, Bajan-X platform basics, and core concepts needed for government digital services.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle size={20} className="text-green-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-white font-medium text-sm">BX1: API Fundamentals</p>
                              <p className="text-zinc-500 text-xs">Understanding REST APIs</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle size={20} className="text-green-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-white font-medium text-sm">BX2: Platform Basics</p>
                              <p className="text-zinc-500 text-xs">Navigating Bajan-X</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </LiquidGlass>
              </motion.div>

              {}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <LiquidGlass>
                  <div className="p-8 md:p-10">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-xl bg-blue-400/[0.08] backdrop-blur-sm border border-blue-400/[0.15] flex items-center justify-center shrink-0">
                        <Settings size={32} className="text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-2xl font-bold text-white">Intermediate Track</h3>
                          <span className="px-3 py-1 rounded-full text-xs bg-blue-400/[0.08] text-blue-400 border border-blue-400/[0.15]">Week 3</span>
                        </div>
                        <p className="text-zinc-400 mb-6 text-sm leading-relaxed">
                          Develop hands-on skills in API development, documentation, and integration with government systems.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle size={20} className="text-blue-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-white font-medium text-sm">BX3-BX5: Development</p>
                              <p className="text-zinc-500 text-xs">Building & testing APIs</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle size={20} className="text-blue-400 shrink-0 mt-0.5" />
                            <div>
                              <p className="text-white font-medium text-sm">Documentation</p>
                              <p className="text-zinc-500 text-xs">Publishing API specs</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </LiquidGlass>
              </motion.div>

              {}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <LiquidGlass gold>
                  <div className="p-8 md:p-10">
                    <div className="flex items-start gap-6">
                      <div className="w-16 h-16 rounded-xl bg-[#D4AF37]/[0.1] backdrop-blur-sm border border-[#D4AF37]/[0.2] flex items-center justify-center shrink-0">
                        <Trophy size={32} className="text-[#D4AF37]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-2xl font-bold text-white">Advanced Track</h3>
                          <span className="px-3 py-1 rounded-full text-xs bg-[#D4AF37]/[0.08] text-[#D4AF37] border border-[#D4AF37]/[0.15]">Week 4</span>
                        </div>
                        <p className="text-zinc-300 mb-6 text-sm leading-relaxed">
                          Master advanced topics including monitoring, governance, security, and maintenance of production APIs.
                        </p>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="flex items-start gap-3">
                            <CheckCircle size={20} className="text-[#D4AF37] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-white font-medium text-sm">BX6-BX8: Advanced</p>
                              <p className="text-zinc-500 text-xs">Monitoring & governance</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <CheckCircle size={20} className="text-[#D4AF37] shrink-0 mt-0.5" />
                            <div>
                              <p className="text-white font-medium text-sm">Production Ready</p>
                              <p className="text-zinc-500 text-xs">Security & best practices</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </LiquidGlass>
              </motion.div>
            </div>
          </div>
        </section>

        {}
        <section id="support" className="py-28 px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">Getting Help</h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">Multiple support channels to keep you moving forward</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <LiquidGlass>
                  <div className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-indigo-400/[0.08] backdrop-blur-sm border border-indigo-400/[0.15] flex items-center justify-center mb-6">
                      <Clock size={28} className="text-indigo-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">Office Hours</h3>
                    <p className="text-zinc-400 mb-5 text-sm leading-relaxed">
                      Join scheduled office hours to get live help from instructors and discuss challenges with peers.
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-500">Available for real-time support</p>
                    </div>
                  </div>
                </LiquidGlass>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <LiquidGlass>
                  <div className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-pink-400/[0.08] backdrop-blur-sm border border-pink-400/[0.15] flex items-center justify-center mb-6">
                      <MessageCircle size={28} className="text-pink-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">Contact Form</h3>
                    <p className="text-zinc-400 mb-5 text-sm leading-relaxed">
                      Submit detailed questions or issues through the contact form for personalized assistance.
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-500">Get responses within 24-48 hours</p>
                    </div>
                  </div>
                </LiquidGlass>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <LiquidGlass>
                  <div className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-cyan-400/[0.08] backdrop-blur-sm border border-cyan-400/[0.15] flex items-center justify-center mb-6">
                      <Users size={28} className="text-cyan-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">Live Cohort Sessions</h3>
                    <p className="text-zinc-400 mb-5 text-sm leading-relaxed">
                      Participate in live sessions with your cohort to collaborate, learn together, and share experiences.
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-500">Interactive group learning</p>
                    </div>
                  </div>
                </LiquidGlass>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <LiquidGlass>
                  <div className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-red-400/[0.08] backdrop-blur-sm border border-red-400/[0.15] flex items-center justify-center mb-6">
                      <AlertTriangle size={28} className="text-red-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-4">Report a Problem</h3>
                    <p className="text-zinc-400 mb-5 text-sm leading-relaxed">
                      Encountered a technical issue or bug? Report it directly to help us improve the platform.
                    </p>
                    <div className="space-y-2">
                      <p className="text-xs text-zinc-500">Quick issue reporting</p>
                    </div>
                  </div>
                </LiquidGlass>
              </motion.div>
            </div>
          </div>
        </section>

        {}
        <section id="certification" className="py-28 px-8 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">Earning Certification</h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">Two paths to demonstrate your mastery</p>
            </motion.div>

            <div className="space-y-8">
              {}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <LiquidGlass gold>
                  <div className="p-10 md:p-12">
                    <div className="flex flex-col md:flex-row items-start gap-8">
                      <div className="w-20 h-20 rounded-xl bg-[#D4AF37]/[0.1] backdrop-blur-sm border border-[#D4AF37]/[0.2] flex items-center justify-center shrink-0">
                        <Award size={40} className="text-[#D4AF37]" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-3xl font-bold text-white mb-4">Bajan-X Champion</h3>
                        <p className="text-zinc-300 mb-6 text-base leading-relaxed">
                          The premier certification demonstrating comprehensive mastery of the Bajan-X platform and API development for government services.
                        </p>
                        <div className="space-y-4 mb-6">
                          <div className="flex items-start gap-4">
                            <CheckCircle size={24} className="text-[#D4AF37] shrink-0 mt-1" />
                            <div>
                              <p className="text-white font-semibold mb-1">Complete All 8 Courses</p>
                              <p className="text-zinc-400 text-sm">Finish BX1 through BX8 with all lessons and quizzes</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <CheckCircle size={24} className="text-[#D4AF37] shrink-0 mt-1" />
                            <div>
                              <p className="text-white font-semibold mb-1">Capstone Project</p>
                              <p className="text-zinc-400 text-sm">Build a production-ready API demonstrating all learned concepts</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <CheckCircle size={24} className="text-[#D4AF37] shrink-0 mt-1" />
                            <div>
                              <p className="text-white font-semibold mb-1">Final Assessment</p>
                              <p className="text-zinc-400 text-sm">Achieve 80% or higher on the comprehensive final exam</p>
                            </div>
                          </div>
                        </div>
                        <div className="inline-block px-4 py-2 rounded-lg text-sm bg-[#D4AF37]/[0.08] text-[#D4AF37] border border-[#D4AF37]/[0.15]">
                          Estimated completion: 4 weeks
                        </div>
                      </div>
                    </div>
                  </div>
                </LiquidGlass>
              </motion.div>

              {}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <LiquidGlass>
                  <div className="p-10 md:p-12">
                    <div className="flex flex-col md:flex-row items-start gap-8">
                      <div className="w-20 h-20 rounded-xl bg-blue-400/[0.08] backdrop-blur-sm border border-blue-400/[0.15] flex items-center justify-center shrink-0">
                        <GraduationCap size={40} className="text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-3xl font-bold text-white mb-4">Certified Superuser</h3>
                        <p className="text-zinc-400 mb-6 text-base leading-relaxed">
                          Advanced certification for platform experts who can train others and provide technical leadership.
                        </p>
                        <div className="space-y-4 mb-6">
                          <div className="flex items-start gap-4">
                            <CheckCircle size={24} className="text-blue-400 shrink-0 mt-1" />
                            <div>
                              <p className="text-white font-semibold mb-1">Champion Prerequisite</p>
                              <p className="text-zinc-400 text-sm">First earn your Bajan-X Champion certification</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <CheckCircle size={24} className="text-blue-400 shrink-0 mt-1" />
                            <div>
                              <p className="text-white font-semibold mb-1">Advanced Training</p>
                              <p className="text-zinc-400 text-sm">Complete specialized modules on platform administration and best practices</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-4">
                            <CheckCircle size={24} className="text-blue-400 shrink-0 mt-1" />
                            <div>
                              <p className="text-white font-semibold mb-1">Peer Mentorship</p>
                              <p className="text-zinc-400 text-sm">Assist in training and mentoring other learners</p>
                            </div>
                          </div>
                        </div>
                        <div className="inline-block px-4 py-2 rounded-lg text-sm bg-blue-400/[0.05] text-blue-400 border border-blue-400/[0.15]">
                          Leadership & expertise recognition
                        </div>
                      </div>
                    </div>
                  </div>
                </LiquidGlass>
              </motion.div>
            </div>
          </div>
        </section>

        {}
        <footer className="py-16 px-8 border-t border-white/[0.05]">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col items-center justify-center gap-6 text-center">
              <div className="flex items-center gap-3">
                <svg width="193" height="40" viewBox="0 0 1926 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-auto opacity-30">
                  <path d="M1925.41 400H1825.38V0H1925.41V400Z" fill="white"/>
                  <path d="M1400.29 400H1312.78V0H1368.25L1639.82 244.8H1650.35V0H1737.87V400H1682.39L1410.82 155.2H1400.29V400Z" fill="white"/>
                  <path d="M1225.26 400H1125.24V0H1225.26V400Z" fill="white"/>
                  <path d="M625.132 400H537.613V0H674.577L787.666 244.8H790.179L903.268 0H1037.72V400H950.2V175L955.854 104H947.247L804.001 400H773.216L629.969 105.067H621.99L625.132 175V400Z" fill="white"/>
                  <path d="M450.095 0V400H350.505V110.4H349.211L113.17 400H0V390.4L329.164 0H450.095Z" fill="white"/>
                </svg>
                <span className="text-white/20 font-helvetica-light tracking-[0.25em] text-base">ACADEMY</span>
              </div>
              <p className="text-xs text-zinc-600">
                2026 Amini Academy | Powering Barbados' Digital Transformation
              </p>
              <LiquidGlassButton onClick={() => setCurrentView('LANDING')} className="mt-4">
                Return to Home
              </LiquidGlassButton>
            </div>
          </div>
        </footer>
      </div>
    );
  };

  const AuthView = () => {
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [registerStep, setRegisterStep] = useState(1);
    const [formData, setFormData] = useState({
      email: '',
      password: '',
      name: '',
      ministry: MINISTRIES[0],
      role: UserRole.LEARNER
    });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [pendingApproval, setPendingApproval] = useState(false);

    const validateStep1 = () => {
      if (!formData.name.trim()) {
        setError('Please enter your full name');
        return false;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setError('Please enter a valid email');
        return false;
      }
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
      if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
        setError('Password must contain uppercase, lowercase, and number');
        return false;
      }
      return true;
    };

    const handleNextStep = () => {
      setError('');
      if (validateStep1()) {
        setRegisterStep(2);
      }
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setIsSubmitting(true);

      try {
        if (authMode === 'login') {
          const response = await authAPI.login({
            email: formData.email,
            password: formData.password
          });

          if (response.token) {
            setAuthToken(response.token);
            const newUser: User = {
              id: response.user.id,
              name: response.user.name,
              email: response.user.email,
              ministry: response.user.ministry,
              role: response.user.role as UserRole,
              enrolledCourses: [],
              completedPaths: []
            };
            setUser(newUser);
            setCurrentView(response.user.role === 'ADMIN' || response.user.role === 'SUBADMIN' ? 'ADMIN' : 'DASHBOARD');
          }
        } else {
          const response = await authAPI.register({
            email: formData.email,
            password: formData.password,
            name: formData.name,
            ministry: formData.ministry,
            role: formData.role === UserRole.SUPERUSER ? 'SUPERUSER' : 'LEARNER'
          });

          if (response.status === 'PENDING_APPROVAL') {
            setPendingApproval(true);
          }
        }
      } catch (err: any) {
        if (err.message.includes('pending')) {
          setPendingApproval(true);
        } else {
          setError(err.message || 'Authentication failed. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    // Pending Approval Screen
    if (pendingApproval) {
      return (
        <div className="min-h-screen flex items-center justify-center relative z-10 p-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <LiquidGlass hover={false}>
              <div className="p-10 text-center">
                <div className="w-16 h-16 rounded-xl bg-[#D4AF37]/[0.08] backdrop-blur-sm border border-[#D4AF37]/[0.15] flex items-center justify-center mx-auto mb-6">
                  <Clock size={32} className="text-[#D4AF37]" />
                </div>
                <h2 className="text-2xl font-helvetica-bold mb-4 text-white">Registration Submitted</h2>
                <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
                  Your account is pending approval from an administrator.
                  You will be able to log in once your account has been approved.
                </p>
                <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-4 mb-8 text-left border border-white/[0.06]">
                  <p className="text-xs text-zinc-500 mb-1">Email</p>
                  <p className="text-white font-medium">{formData.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPendingApproval(false);
                    setAuthMode('login');
                    setRegisterStep(1);
                    setFormData({ ...formData, password: '' });
                  }}
                  className="w-full px-6 py-4 rounded-xl bg-white/[0.02] backdrop-blur-[8px] border border-white/[0.08] text-white font-semibold hover:bg-white/[0.04] hover:border-white/15 transition-all duration-300"
                >
                  Back to Login
                </button>
              </div>
            </LiquidGlass>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center relative z-10 p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <LiquidGlass hover={false}>
            <div className="p-8 md:p-10">
              {/* Back Button */}
              <button
                type="button"
                onClick={() => {
                  if (authMode === 'register' && registerStep === 2) {
                    setRegisterStep(1);
                    setError('');
                  } else {
                    setCurrentView('LANDING');
                  }
                }}
                className="text-zinc-500 hover:text-white flex items-center gap-2 text-sm transition-colors duration-300 mb-6"
              >
                <ArrowLeft size={16} /> {authMode === 'register' && registerStep === 2 ? 'Back' : 'Back'}
              </button>

              {/* Tab Switcher - only show on step 1 or login */}
              {(authMode === 'login' || registerStep === 1) && (
                <div className="flex mb-6 bg-white/[0.03] backdrop-blur-sm rounded-xl p-1 border border-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => { setAuthMode('login'); setError(''); setRegisterStep(1); }}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      authMode === 'login'
                        ? 'bg-gradient-to-r from-[#B8962E] via-[#D4AF37] to-[#F5D76E] text-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setError(''); }}
                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-semibold transition-all duration-300 ${
                      authMode === 'register'
                        ? 'bg-gradient-to-r from-[#B8962E] via-[#D4AF37] to-[#F5D76E] text-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Register
                  </button>
                </div>
              )}

              {/* Step Indicator for Register */}
              {authMode === 'register' && (
                <div className="flex items-center justify-center gap-3 mb-6">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
                    registerStep >= 1 ? 'bg-[#D4AF37] text-black' : 'bg-white/10 text-zinc-500'
                  }`}>
                    1
                  </div>
                  <div className={`w-12 h-0.5 transition-all ${registerStep >= 2 ? 'bg-[#D4AF37]' : 'bg-white/10'}`} />
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold transition-all ${
                    registerStep >= 2 ? 'bg-[#D4AF37] text-black' : 'bg-white/10 text-zinc-500'
                  }`}>
                    2
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-helvetica-bold mb-2 text-white">
                  {authMode === 'login'
                    ? 'Welcome Back'
                    : registerStep === 1
                      ? 'Create Account'
                      : 'Professional Info'}
                </h2>
                <p className="text-zinc-400 text-sm">
                  {authMode === 'login'
                    ? 'Sign in to continue your learning'
                    : registerStep === 1
                      ? 'Enter your personal details'
                      : 'Select your ministry and role'}
                </p>
              </div>

              {/* LOGIN FORM */}
              {authMode === 'login' && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
                    <LiquidGlassInput
                      required
                      type="email"
                      placeholder="jane.doe@gov.bb"
                      value={formData.email}
                      onChange={e => {
                        setFormData({ ...formData, email: e.target.value });
                        setError('');
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
                    <LiquidGlassInput
                      required
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Your password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-zinc-500 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 text-red-400 text-sm bg-red-400/10 p-4 rounded-xl border border-red-400/20"
                      >
                        <AlertCircle size={18} />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative w-full px-6 py-4 rounded-xl overflow-hidden bg-gradient-to-r from-[#B8962E] via-[#D4AF37] to-[#F5D76E] text-black font-bold hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700" />
                  </button>
                </form>
              )}

              {/* REGISTER STEP 1: Personal Info */}
              {authMode === 'register' && registerStep === 1 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Full Name</label>
                    <LiquidGlassInput
                      type="text"
                      placeholder="Jane Doe"
                      value={formData.name}
                      onChange={e => { setFormData({ ...formData, name: e.target.value }); setError(''); }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
                    <LiquidGlassInput
                      type="email"
                      placeholder="jane.doe@gov.bb"
                      value={formData.email}
                      onChange={e => { setFormData({ ...formData, email: e.target.value }); setError(''); }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
                    <LiquidGlassInput
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 8 chars, uppercase, number"
                      value={formData.password}
                      onChange={e => { setFormData({ ...formData, password: e.target.value }); setError(''); }}
                      rightElement={
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-zinc-500 hover:text-white transition-colors"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />
                    <p className="text-xs text-zinc-500 mt-2">Must contain uppercase, lowercase, and number</p>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 text-red-400 text-sm bg-red-400/10 p-4 rounded-xl border border-red-400/20"
                      >
                        <AlertCircle size={18} />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="group relative w-full px-6 py-4 rounded-xl overflow-hidden bg-gradient-to-r from-[#B8962E] via-[#D4AF37] to-[#F5D76E] text-black font-bold hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all duration-500"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      Continue
                      <ArrowRight size={18} />
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700" />
                  </button>
                </div>
              )}

              {/* REGISTER STEP 2: Professional Info */}
              {authMode === 'register' && registerStep === 2 && (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Ministry</label>
                    <LiquidGlassSelect
                      value={formData.ministry}
                      onChange={e => setFormData({ ...formData, ministry: e.target.value })}
                      options={MINISTRIES.map(m => ({ value: m, label: m }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-3">Select Role</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: UserRole.LEARNER })}
                        className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                          formData.role === UserRole.LEARNER
                            ? 'bg-[#D4AF37]/[0.08] border-[#D4AF37]/30 text-[#D4AF37]'
                            : 'bg-white/[0.02] border-white/[0.08] hover:border-white/15 text-zinc-400'
                        }`}
                      >
                        <p className="text-sm font-semibold">Learner</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Learn at your pace</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, role: UserRole.SUPERUSER })}
                        className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                          formData.role === UserRole.SUPERUSER
                            ? 'bg-white/10 border-white/30 text-white'
                            : 'bg-white/[0.02] border-white/[0.08] hover:border-white/15 text-zinc-400'
                        }`}
                      >
                        <p className="text-sm font-semibold">Superuser</p>
                        <p className="text-xs text-zinc-500 mt-0.5">Extended access</p>
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 text-red-400 text-sm bg-red-400/10 p-4 rounded-xl border border-red-400/20"
                      >
                        <AlertCircle size={18} />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="group relative w-full px-6 py-4 rounded-xl overflow-hidden bg-gradient-to-r from-[#B8962E] via-[#D4AF37] to-[#F5D76E] text-black font-bold hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Creating account...
                        </>
                      ) : (
                        'Create Account'
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700" />
                  </button>

                  <p className="text-xs text-zinc-500 text-center">
                    Your account will require admin approval before you can sign in.
                  </p>
                </form>
              )}
            </div>
          </LiquidGlass>
        </motion.div>
      </div>
    );
  };

  // ===== INFO PAGE VIEWS =====

  // Shared Info Page Navigation Component
  const InfoPageNav = ({ title, onBack }: { title: string; onBack: () => void }) => (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="fixed top-0 left-0 right-0 z-50"
    >
      <div className="absolute inset-0 bg-white/[0.02] backdrop-blur-[12px] border-b border-white/[0.05]" />
      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/15 to-transparent" />
      <div className="relative max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg width="193" height="40" viewBox="0 0 1926 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-16 h-auto">
            <path d="M1925.41 400H1825.38V0H1925.41V400Z" fill="white"/>
            <path d="M1400.29 400H1312.78V0H1368.25L1639.82 244.8H1650.35V0H1737.87V400H1682.39L1410.82 155.2H1400.29V400Z" fill="white"/>
            <path d="M1225.26 400H1125.24V0H1225.26V400Z" fill="white"/>
            <path d="M625.132 400H537.613V0H674.577L787.666 244.8H790.179L903.268 0H1037.72V400H950.2V175L955.854 104H947.247L804.001 400H773.216L629.969 105.067H621.99L625.132 175V400Z" fill="white"/>
            <path d="M450.095 0V400H350.505V110.4H349.211L113.17 400H0V390.4L329.164 0H450.095Z" fill="white"/>
          </svg>
          <span className="text-white/40 font-helvetica-light tracking-[0.25em] text-base">ACADEMY</span>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="relative px-6 py-2.5 text-sm font-medium rounded-full overflow-hidden group/nav bg-white/[0.02] backdrop-blur-sm border border-white/[0.08] hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/[0.05] transition-all duration-300 flex items-center gap-2"
        >
          <ArrowLeft size={16} className="text-white group-hover/nav:text-[#D4AF37] transition-colors duration-300" />
          <span className="relative text-white group-hover/nav:text-[#D4AF37] transition-colors duration-300">Back to Home</span>
        </button>
      </div>
    </motion.nav>
  );

  // Bajan-X Info View
  const BajanXInfoView = () => {
    const ministries = [
      'Ministry of Industry, Innovation, Science and Technology (MIST)',
      'Ministry of Educational Transformation',
      'Business Barbados',
      'Trident ID',
      'Ministry of Energy',
      'Lands and Survey'
    ];

    return (
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden z-10 scroll-smooth">
        <InfoPageNav title="Bajan-X" onBack={() => setCurrentView('LANDING')} />

        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-8 pt-20 pb-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="max-w-5xl mx-auto text-center relative"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-400/10 border border-emerald-400/20 text-emerald-400 text-sm font-medium mb-8">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              AVAILABLE NOW
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-helvetica-bold leading-[1.2] mb-8 tracking-tight">
              <span className="text-white">BAJAN-X</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-8 leading-relaxed font-light">
              Barbados' secure API platform
            </p>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
              Bajan-X is Barbados' national platform for sharing data across government. It replaces email attachments and manual processes with secure, automated data exchange.
            </p>
          </motion.div>
        </section>

        {/* What Bajan-X Does */}
        <section className="py-28 px-8 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">What Bajan-X Does</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Search, title: 'Browse APIs', desc: 'Browse available APIs across government' },
                { icon: Lock, title: 'Secure Publishing', desc: 'Publish APIs with built-in security and logging' },
                { icon: PlayCircle, title: 'Test Safely', desc: 'Test APIs safely before using them' },
                { icon: UserCheck, title: 'Access Control', desc: 'Control who can access what' },
                { icon: BarChart3, title: 'Monitor Health', desc: 'Monitor API health and usage' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <LiquidGlass>
                    <div className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/[0.1] border border-[#D4AF37]/20 flex items-center justify-center mb-4">
                        <item.icon size={24} className="text-[#D4AF37]" />
                      </div>
                      <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-zinc-400 text-sm">{item.desc}</p>
                    </div>
                  </LiquidGlass>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Who It's For */}
        <section className="py-28 px-8">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <LiquidGlass gold>
                <div className="p-12">
                  <h2 className="text-3xl font-helvetica-bold mb-6 text-white">Who It's For</h2>
                  <p className="text-zinc-300 text-lg leading-relaxed">
                    IT professionals, database administrators, data stewards, and ministry champions who manage and share government data.
                  </p>
                </div>
              </LiquidGlass>
            </motion.div>
          </div>
        </section>

        {/* Training */}
        <section className="py-28 px-8 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">Training Programme</h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                An 8-module course that takes you from "What's an API?" to publishing your ministry's first API.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { week: 'Week 1', title: 'Foundations', desc: 'What Bajan-X is, why APIs matter' },
                { week: 'Week 2', title: 'Working with APIs', desc: 'Reading documentation, running tests' },
                { week: 'Week 3', title: 'Publishing', desc: 'Classification, access rules, the publishing workflow' },
                { week: 'Week 4', title: 'Monitoring & Capstone', desc: 'Keeping APIs healthy, presenting your work' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <LiquidGlass>
                    <div className="p-6">
                      <span className="text-[#D4AF37] text-sm font-bold uppercase tracking-wider">{item.week}</span>
                      <h3 className="text-lg font-bold text-white mt-2 mb-2">{item.title}</h3>
                      <p className="text-zinc-400 text-sm">{item.desc}</p>
                    </div>
                  </LiquidGlass>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <p className="text-zinc-400 mb-8">Complete all modules to earn <span className="text-[#D4AF37] font-bold">Bajan-X Champion</span> certification.</p>
              <button
                type="button"
                onClick={() => setCurrentView('AUTH')}
                className="group relative px-10 py-4 rounded-xl overflow-hidden bg-gradient-to-r from-[#B8962E] via-[#D4AF37] to-[#F5D76E] text-black font-bold text-lg hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all duration-500"
              >
                <span className="relative z-10">Start Training</span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700" />
              </button>
            </motion.div>
          </div>
        </section>

        {/* The Ecosystem */}
        <section className="py-28 px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">The Ecosystem</h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">Bajan-X is one of three platforms</p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
                <LiquidGlass gold>
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#D4AF37]/[0.15] border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4">
                      <Key size={32} className="text-[#D4AF37]" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Bajan-X</h3>
                    <p className="text-zinc-300 text-sm">Structured data exchange (APIs)</p>
                  </div>
                </LiquidGlass>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
                <LiquidGlass>
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-purple-400/[0.1] border border-purple-400/20 flex items-center justify-center mx-auto mb-4">
                      <FileText size={32} className="text-purple-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Bridge</h3>
                    <p className="text-zinc-400 text-sm">Government knowledge (documents and records)</p>
                  </div>
                </LiquidGlass>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
                <LiquidGlass>
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-blue-400/[0.1] border border-blue-400/20 flex items-center justify-center mx-auto mb-4">
                      <MessageCircle size={32} className="text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">ChatBB</h3>
                    <p className="text-zinc-400 text-sm">Citizen services</p>
                  </div>
                </LiquidGlass>
              </motion.div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center text-zinc-400 mt-12"
            >
              Staff who complete training across all three become <span className="text-[#D4AF37] font-bold">Certified Superusers</span>, recognized leaders in Barbados' digital transformation.
            </motion.p>
          </div>
        </section>

        {/* Participating Ministries */}
        <section className="py-28 px-8 bg-white/[0.01]">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">Participating Ministries</h2>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-4">
              {ministries.map((ministry, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="px-6 py-3 rounded-full bg-white/[0.03] border border-white/[0.08] text-zinc-300 text-sm"
                >
                  {ministry}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-28 px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-helvetica-bold mb-8 text-white">Ready to Get Started?</h2>
              <button
                type="button"
                onClick={() => setCurrentView('AUTH')}
                className="group relative px-12 py-5 rounded-xl overflow-hidden bg-gradient-to-r from-[#B8962E] via-[#D4AF37] to-[#F5D76E] text-black font-bold text-lg hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all duration-500"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Start Training <ChevronRight size={20} />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700" />
              </button>
            </motion.div>
          </div>
        </section>
      </div>
    );
  };

  // Bridge Info View
  const BridgeInfoView = () => {
    return (
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden z-10 scroll-smooth">
        <InfoPageNav title="Bridge" onBack={() => setCurrentView('LANDING')} />

        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-8 pt-20 pb-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="max-w-5xl mx-auto text-center relative"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-400/10 border border-purple-400/20 text-purple-400 text-sm font-medium mb-8">
              <Clock size={14} />
              COMING SOON
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-helvetica-bold leading-[1.2] mb-8 tracking-tight">
              <span className="text-white">BRIDGE</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-8 leading-relaxed font-light">
              Barbados' private knowledge graph platform
            </p>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
              Bridge connects government knowledge — policy documents, cabinet records, historical decisions — into one searchable system.
            </p>
          </motion.div>
        </section>

        {/* What Bridge Does */}
        <section className="py-28 px-8 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">What Bridge Does</h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                Instead of hunting through folders and archives, you query Bridge and it finds relevant information across all connected sources.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                { icon: Search, title: 'Search Documents', desc: 'Search across government documents and records' },
                { icon: FileText, title: 'Surface Precedents', desc: 'Surface relevant precedents when preparing policy recommendations' },
                { icon: Building2, title: 'Connect Information', desc: 'Connect related information across ministries' },
                { icon: BookOpen, title: 'Provide Context', desc: 'Provide context when authoring briefs and papers' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <LiquidGlass>
                    <div className="p-6 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-400/[0.1] border border-purple-400/20 flex items-center justify-center shrink-0">
                        <item.icon size={24} className="text-purple-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-zinc-400 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  </LiquidGlass>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Training */}
        <section className="py-28 px-8">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <LiquidGlass>
                <div className="p-12 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-purple-400/[0.1] border border-purple-400/20 flex items-center justify-center mx-auto mb-6">
                    <GraduationCap size={40} className="text-purple-400" />
                  </div>
                  <h2 className="text-3xl font-helvetica-bold mb-4 text-white">Training</h2>
                  <p className="text-zinc-400 text-lg leading-relaxed mb-6">
                    Bridge training is in development. When it launches, you'll learn to query Bridge effectively and contribute to the knowledge graph.
                  </p>
                  <p className="text-[#D4AF37] font-medium">
                    Champions get early access to new training paths.
                  </p>
                </div>
              </LiquidGlass>
            </motion.div>
          </div>
        </section>

        {/* How Bridge Relates to Bajan-X */}
        <section className="py-28 px-8 bg-white/[0.01]">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <LiquidGlass gold>
                <div className="p-12">
                  <h2 className="text-3xl font-helvetica-bold mb-6 text-white">How Bridge Relates to Bajan-X</h2>
                  <p className="text-zinc-300 text-lg leading-relaxed mb-8">
                    <span className="text-[#D4AF37] font-bold">Bajan-X</span> handles structured data (APIs). <span className="text-purple-400 font-bold">Bridge</span> handles unstructured knowledge (documents and records). Together, they form the backbone of Barbados' information infrastructure.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentView('INFO_BAJANX')}
                    className="inline-flex items-center gap-2 text-[#D4AF37] font-medium hover:underline"
                  >
                    Learn more about Bajan-X <ChevronRight size={18} />
                  </button>
                </div>
              </LiquidGlass>
            </motion.div>
          </div>
        </section>
      </div>
    );
  };

  // ChatBB Info View
  const ChatBBInfoView = () => {
    return (
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden z-10 scroll-smooth">
        <InfoPageNav title="ChatBB" onBack={() => setCurrentView('LANDING')} />

        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-8 pt-20 pb-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="max-w-5xl mx-auto text-center relative"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-400/10 border border-blue-400/20 text-blue-400 text-sm font-medium mb-8">
              <Clock size={14} />
              COMING SOON
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-helvetica-bold leading-[1.2] mb-8 tracking-tight">
              <span className="text-white">CHATBB</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-8 leading-relaxed font-light">
              Citizen services via WhatsApp
            </p>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
              ChatBB brings government services to WhatsApp — the app Barbadians and non-Barbadians use every day. Citizens can ask questions and get answers instantly, without needing to know which ministry to contact or which form to fill.
            </p>
          </motion.div>
        </section>

        {/* What ChatBB Does */}
        <section className="py-28 px-8 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">What ChatBB Does</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                { icon: HelpCircle, title: 'Answer Questions', desc: 'Answer common questions about government services' },
                { icon: Route, title: 'Smart Routing', desc: 'Route complex queries to the right department' },
                { icon: Clock, title: '24/7 Availability', desc: 'Provide information 24/7 in plain language' },
                { icon: Users, title: 'Human Support', desc: 'Connect citizens to human support when needed' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <LiquidGlass>
                    <div className="p-6 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-400/[0.1] border border-blue-400/20 flex items-center justify-center shrink-0">
                        <item.icon size={24} className="text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-zinc-400 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  </LiquidGlass>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Training */}
        <section className="py-28 px-8">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <LiquidGlass>
                <div className="p-12 text-center">
                  <div className="w-20 h-20 rounded-2xl bg-blue-400/[0.1] border border-blue-400/20 flex items-center justify-center mx-auto mb-6">
                    <GraduationCap size={40} className="text-blue-400" />
                  </div>
                  <h2 className="text-3xl font-helvetica-bold mb-4 text-white">Training</h2>
                  <p className="text-zinc-400 text-lg leading-relaxed mb-6">
                    ChatBB training is in development. When it launches, you'll learn to monitor conversations, maintain response quality, and handle escalations.
                  </p>
                  <p className="text-[#D4AF37] font-medium">
                    Champions get early access to new training paths.
                  </p>
                </div>
              </LiquidGlass>
            </motion.div>
          </div>
        </section>

        {/* How ChatBB Relates to Bajan-X */}
        <section className="py-28 px-8 bg-white/[0.01]">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <LiquidGlass gold>
                <div className="p-12">
                  <h2 className="text-3xl font-helvetica-bold mb-6 text-white">How ChatBB Relates to Bajan-X</h2>
                  <p className="text-zinc-300 text-lg leading-relaxed mb-4">
                    ChatBB uses <span className="text-[#D4AF37] font-bold">Bajan-X APIs</span> to get accurate, up-to-date information. When a citizen asks a question, ChatBB queries the relevant API to provide the right answer.
                  </p>
                  <p className="text-zinc-300 text-lg leading-relaxed mb-8">
                    The APIs you publish through Bajan-X can power citizen services through ChatBB.
                  </p>
                  <button
                    type="button"
                    onClick={() => setCurrentView('INFO_BAJANX')}
                    className="inline-flex items-center gap-2 text-[#D4AF37] font-medium hover:underline"
                  >
                    Learn more about Bajan-X <ChevronRight size={18} />
                  </button>
                </div>
              </LiquidGlass>
            </motion.div>
          </div>
        </section>
      </div>
    );
  };

  // API Publishing Info View
  const APIPublishingInfoView = () => {
    const modules = [
      { code: 'BX4', title: 'Reading Documentation', desc: 'Learn to understand API documentation — what inputs are needed, what outputs to expect.' },
      { code: 'BX5', title: 'Testing in the Playground', desc: 'Run your first API tests in a safe environment. Learn to interpret results.' },
      { code: 'BX6', title: 'Classification & Access Rules', desc: "Apply Barbados' data classification framework. Define who can access what." },
      { code: 'BX7', title: 'Publishing on Bajan-X', desc: "Walk through the publishing workflow. Prepare your ministry's first API candidate." },
    ];

    return (
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden z-10 scroll-smooth">
        <InfoPageNav title="API Publishing" onBack={() => setCurrentView('LANDING')} />

        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-8 pt-20 pb-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="max-w-5xl mx-auto text-center relative"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-sm font-medium mb-8">
              <BookOpen size={14} />
              LEARNING TRACK
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-helvetica-bold leading-[1.2] mb-8 tracking-tight">
              <span className="text-white">API PUBLISHING</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-8 leading-relaxed font-light">
              Learn the complete workflow, from finding data to publishing APIs
            </p>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
              This track takes you from understanding APIs to actually working with them. You'll learn to read documentation, run tests, classify data, and prepare APIs for publishing.
            </p>
          </motion.div>
        </section>

        {/* What You'll Gain */}
        <section className="py-28 px-8 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">What You'll Gain</h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                By the end of this track, you'll be able to:
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {[
                { icon: FileText, title: 'Read API Documentation', desc: 'Read and interpret API documentation with confidence' },
                { icon: PlayCircle, title: 'Run Tests', desc: 'Run tests safely in the playground environment' },
                { icon: Lock, title: 'Classify Data', desc: 'Classify data appropriately (Public, Internal, Restricted)' },
                { icon: Award, title: 'Prepare API Packages', desc: 'Prepare a complete API candidate package for your ministry' },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <LiquidGlass>
                    <div className="p-6 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/[0.1] border border-[#D4AF37]/20 flex items-center justify-center shrink-0">
                        <item.icon size={24} className="text-[#D4AF37]" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                        <p className="text-zinc-400 text-sm">{item.desc}</p>
                      </div>
                    </div>
                  </LiquidGlass>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* The Modules */}
        <section className="py-28 px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">The Modules</h2>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              {modules.map((module, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <LiquidGlass gold={idx === modules.length - 1}>
                    <div className="p-6">
                      <span className="text-[#D4AF37] text-sm font-bold uppercase tracking-wider">{module.code}</span>
                      <h3 className="text-lg font-bold text-white mt-2 mb-2">{module.title}</h3>
                      <p className="text-zinc-400 text-sm">{module.desc}</p>
                    </div>
                  </LiquidGlass>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Time & Prerequisites */}
        <section className="py-28 px-8 bg-white/[0.01]">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <LiquidGlass>
                  <div className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-blue-400/[0.1] border border-blue-400/20 flex items-center justify-center mb-6">
                      <Clock size={28} className="text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Time Commitment</h3>
                    <p className="text-zinc-400">
                      About 5–6 hours total, including documentation work.
                    </p>
                  </div>
                </LiquidGlass>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <LiquidGlass>
                  <div className="p-8">
                    <div className="w-14 h-14 rounded-xl bg-orange-400/[0.1] border border-orange-400/20 flex items-center justify-center mb-6">
                      <Route size={28} className="text-orange-400" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3">Prerequisites</h3>
                    <p className="text-zinc-400">
                      Complete the Foundations track first.
                    </p>
                  </div>
                </LiquidGlass>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-28 px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <p className="text-zinc-400 mb-4 text-lg">
                Whether you'll be publishing APIs yourself or requesting access to others' APIs, this track gives you the skills to participate fully in Barbados' data ecosystem.
              </p>
              <button
                type="button"
                onClick={() => setCurrentView('AUTH')}
                className="group relative px-12 py-5 rounded-xl overflow-hidden bg-gradient-to-r from-[#B8962E] via-[#D4AF37] to-[#F5D76E] text-black font-bold text-lg hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all duration-500 mt-8"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Continue to API Publishing <ChevronRight size={20} />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700" />
              </button>
            </motion.div>
          </div>
        </section>
      </div>
    );
  };

  // Certification Info View
  const CertificationInfoView = () => {
    return (
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden z-10 scroll-smooth">
        <InfoPageNav title="Certification" onBack={() => setCurrentView('LANDING')} />

        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-8 pt-20 pb-32 relative">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="max-w-5xl mx-auto text-center relative"
          >
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-8 shadow-[0_0_60px_rgba(212,175,55,0.2)]">
              <Award size={48} className="text-[#D4AF37]" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-helvetica-bold leading-[1.2] mb-8 tracking-tight">
              <span className="text-white">CERTIFICATION</span>
            </h1>
            <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-8 leading-relaxed font-light">
              Validate your skills. Get recognized.
            </p>
            <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
              Certification shows your ministry — and yourself — that you've mastered the skills to participate in Barbados' digital transformation. It's recognition that lasts.
            </p>
          </motion.div>
        </section>

        {/* Bajan-X Champion */}
        <section className="py-28 px-8 bg-white/[0.01]">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">Bajan-X Champion</h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                The certification for completing the Bajan-X programme.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <LiquidGlass>
                  <div className="p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Target size={20} className="text-[#D4AF37]" />
                      How to Earn It
                    </h3>
                    <ol className="space-y-4">
                      {[
                        'Complete all 8 modules (BX1–BX8)',
                        'Pass all quizzes (70% or higher)',
                        'Submit your capstone project',
                        'Pass the final assessment (80% or higher)',
                      ].map((step, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-sm font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                          <span className="text-zinc-300">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </LiquidGlass>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <LiquidGlass gold>
                  <div className="p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Award size={20} className="text-[#D4AF37]" />
                      What You Receive
                    </h3>
                    <ul className="space-y-3">
                      {[
                        'Digital certificate (PDF)',
                        'Bajan-X Champion badge',
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-3">
                          <CheckCircle size={18} className="text-[#D4AF37]" />
                          <span className="text-zinc-300">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </LiquidGlass>
              </motion.div>
            </div>

            {/* Perks */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-8 max-w-5xl mx-auto"
            >
              <LiquidGlass>
                <div className="p-8">
                  <h3 className="text-xl font-bold text-white mb-6">Perks of Being a Champion</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      "Recognized as your ministry's go-to expert on APIs",
                      'Priority consideration for digital transformation projects',
                      'Opportunity to mentor new learners',
                      'Access to Champion-only resources and updates',
                    ].map((perk, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#D4AF37] mt-2 shrink-0" />
                        <span className="text-zinc-400 text-sm">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </LiquidGlass>
            </motion.div>
          </div>
        </section>

        {/* Certified Superuser */}
        <section className="py-28 px-8">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-helvetica-bold mb-6 text-white">Certified Superuser</h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                For those who want to lead across the entire Amini ecosystem. Superusers are the advanced practitioners — staff who've demonstrated expertise across multiple platforms, not just Bajan-X.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
              >
                <LiquidGlass>
                  <div className="p-8">
                    <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                      <Route size={20} className="text-purple-400" />
                      How to Become a Superuser
                    </h3>
                    <ol className="space-y-4">
                      {[
                        'Earn Bajan-X Champion certification',
                        'Complete Bridge training (when available)',
                        'Complete ChatBB training (when available)',
                        "Demonstrate leadership in your ministry's digital initiatives",
                      ].map((step, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-purple-400/20 text-purple-400 text-sm font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                          <span className="text-zinc-300">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </LiquidGlass>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
              >
                <LiquidGlass>
                  <div className="p-8">
                    <h3 className="text-xl font-bold text-white mb-6">Perks of Being a Superuser</h3>
                    <ul className="space-y-3">
                      {[
                        'Recognized transformation leader in your ministry',
                        'Priority access to new training and features',
                        'Invitation to strategy sessions with the Amini team',
                        'Exclusive Superuser community and support channels',
                        'Early access to platform updates and pilots',
                        'Opportunity to shape future training content',
                      ].map((perk, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <CheckCircle size={16} className="text-purple-400 mt-0.5 shrink-0" />
                          <span className="text-zinc-400 text-sm">{perk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </LiquidGlass>
              </motion.div>
            </div>
          </div>
        </section>

        {}
        <section className="py-28 px-8 bg-white/[0.01]">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl font-helvetica-bold mb-6 text-white">Frequently Asked Questions</h2>
            </motion.div>

            <div className="space-y-4">
              {[
                { q: 'Does certification expire?', a: "No. Once you earn your certification, it's yours to keep." },
                { q: 'Can I retake quizzes?', a: 'Yes. You can retake quizzes as many times as you need. Your highest score counts.' },
              ].map((faq, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <LiquidGlass>
                    <div className="p-6">
                      <h4 className="text-white font-bold mb-2">{faq.q}</h4>
                      <p className="text-zinc-400 text-sm">{faq.a}</p>
                    </div>
                  </LiquidGlass>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {}
        <section className="py-28 px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-helvetica-bold mb-8 text-white">Start Your Certification Journey</h2>
              <button
                type="button"
                onClick={() => setCurrentView('AUTH')}
                className="group relative px-12 py-5 rounded-xl overflow-hidden bg-gradient-to-r from-[#B8962E] via-[#D4AF37] to-[#F5D76E] text-black font-bold text-lg hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all duration-500"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Begin Training <ChevronRight size={20} />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700" />
              </button>
            </motion.div>
          </div>
        </section>
      </div>
    );
  };

  const FAQsInfoView = () => {
    const faqSections = [
      {
        title: 'About the Programme',
        icon: BookOpen,
        color: 'blue',
        faqs: [
          { q: 'Who is this for?', a: 'Government staff from participating ministries who will work with APIs. All skill levels welcome — no technical background required.' },
          { q: 'How long does it take?', a: '4 weeks, with about 3–4 hours per week.' },
          { q: 'What if I miss a live session?', a: 'All sessions are recorded and available within 24 hours.' },
          { q: 'What equipment do I need?', a: 'A computer with internet and a modern browser. Chrome works best.' },
        ]
      },
      {
        title: 'About the Academy',
        icon: GraduationCap,
        color: 'purple',
        faqs: [
          { q: 'How do I log in?', a: "Use the credentials you registered with. If you haven't registered, click Register and follow the steps. If you still have questions please visit our Welcome Guide to learn more." },
          { q: 'Why is my next module locked?', a: 'Modules unlock in sequence. Complete the current module and pass its quiz (70%+) to continue.' },
          { q: 'Can I review completed modules?', a: 'Yes. Everything stays accessible.' },
          { q: 'What if I score below 70%?', a: 'Retake the quiz as many times as you need. Your highest score counts.' },
        ]
      },
      {
        title: 'About Certification',
        icon: Award,
        color: 'gold',
        faqs: [
          { q: 'What do I need to earn certification?', a: 'Complete all 8 modules, pass all quizzes (70%+), submit your capstone, and pass the final assessment (80%+).' },
          { q: 'Does certification expire?', a: "No. Once earned, it's yours to keep." },
          { q: "What's the difference between Champion and Superuser?", a: "Champion means you've completed the Bajan-X programme. Superuser means you've completed training across all three platforms (Bajan-X, Bridge, ChatBB)." },
        ]
      },
      {
        title: 'Technical Questions',
        icon: Key,
        color: 'emerald',
        faqs: [
          { q: "What's an API?", a: 'A secure way for systems to share data automatically. Think of it as a "data tap" — turn it on, and authorized data flows.' },
          { q: 'Do I need to code?', a: "No. You'll learn to work with APIs at a practical level — understanding documentation, running tests, interpreting results." },
        ]
      },
      {
        title: 'Getting Help',
        icon: HelpCircle,
        color: 'orange',
        faqs: [
          { q: 'How do I get help?', a: 'If you need more support, book Office Hours or submit a contact us form.' },
          { q: 'How fast will I get a response?', a: 'Support channel responses typically come within 4 hours during business hours.' },
        ]
      },
    ];

    const getColorClasses = (color: string) => {
      const colors: Record<string, { bg: string; border: string; text: string }> = {
        blue: { bg: 'bg-blue-400/[0.1]', border: 'border-blue-400/20', text: 'text-blue-400' },
        purple: { bg: 'bg-purple-400/[0.1]', border: 'border-purple-400/20', text: 'text-purple-400' },
        gold: { bg: 'bg-[#D4AF37]/[0.1]', border: 'border-[#D4AF37]/20', text: 'text-[#D4AF37]' },
        emerald: { bg: 'bg-emerald-400/[0.1]', border: 'border-emerald-400/20', text: 'text-emerald-400' },
        orange: { bg: 'bg-orange-400/[0.1]', border: 'border-orange-400/20', text: 'text-orange-400' },
      };
      return colors[color] || colors.blue;
    };

    return (
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden z-10 scroll-smooth">
        <InfoPageNav title="FAQs" onBack={() => setCurrentView('LANDING')} />

        {}
        <section className="pt-32 pb-20 px-8">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            className="max-w-5xl mx-auto text-center"
          >
            <div className="w-20 h-20 rounded-2xl bg-[#D4AF37]/[0.1] border border-[#D4AF37]/20 flex items-center justify-center mx-auto mb-8">
              <HelpCircle size={40} className="text-[#D4AF37]" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-helvetica-bold leading-[1.2] mb-6 tracking-tight text-white">
              FAQs
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
              Quick answers to common questions
            </p>
          </motion.div>
        </section>

        {}
        {faqSections.map((section, sectionIdx) => {
          const colorClasses = getColorClasses(section.color);
          return (
            <section key={sectionIdx} className={`py-16 px-8 ${sectionIdx % 2 === 1 ? 'bg-white/[0.01]' : ''}`}>
              <div className="max-w-5xl mx-auto">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="flex items-center gap-4 mb-8"
                >
                  <div className={`w-12 h-12 rounded-xl ${colorClasses.bg} ${colorClasses.border} border flex items-center justify-center`}>
                    <section.icon size={24} className={colorClasses.text} />
                  </div>
                  <h2 className="text-2xl font-helvetica-bold text-white">{section.title}</h2>
                </motion.div>

                <div className="space-y-4">
                  {section.faqs.map((faq, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <LiquidGlass>
                        <div className="p-6">
                          <h4 className="text-white font-bold mb-3">{faq.q}</h4>
                          <p className="text-zinc-400 text-sm leading-relaxed">{faq.a}</p>
                        </div>
                      </LiquidGlass>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        {}
        <section className="py-28 px-8">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl md:text-3xl font-helvetica-bold mb-4 text-white">Still Have Questions?</h2>
              <p className="text-zinc-400 mb-8">Book a 1-on-1 session with our team</p>
              <a
                href="https://calendly.com/chadi-lgs/1-1-call-with-amini"
                target="_blank"
                rel="noopener noreferrer"
                className="group relative inline-flex items-center gap-2 px-10 py-4 rounded-xl overflow-hidden bg-gradient-to-r from-[#B8962E] via-[#D4AF37] to-[#F5D76E] text-black font-bold text-lg hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all duration-500"
              >
                <span className="relative z-10">Book Office Hours</span>
                <ChevronRight size={20} className="relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700" />
              </a>
            </motion.div>
          </div>
        </section>
      </div>
    );
  };

  const OfficeHoursView = () => {
    return (
      <div className="md:ml-64 h-screen overflow-hidden relative z-10 flex flex-col">
        {}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-6 py-16">
            {}
            <div className="text-center mb-12">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(212,175,55,0.15)]">
                <Calendar size={36} className="text-[#D4AF37]" />
              </div>
              <h1 className="text-3xl font-helvetica-bold text-white mb-3">Office Hours</h1>
              <p className="text-zinc-400 text-lg">Book a 1-on-1 session with the Amini team</p>
            </div>

            {}
            <div className="bg-white/[0.02] border border-white/[0.08] rounded-2xl p-8 mb-8">
              <h3 className="text-white font-helvetica-bold text-lg mb-4">What to expect</h3>
              <ul className="space-y-3 text-zinc-400">
                <li className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
                  <span>30-minute personalized session with our team</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
                  <span>Get answers to your questions about the platform</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
                  <span>Receive guidance on your learning path</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle size={18} className="text-[#D4AF37] mt-0.5 flex-shrink-0" />
                  <span>Discuss API integration and technical support</span>
                </li>
              </ul>
            </div>

            {}
            <a
              href="https://calendly.com/chadi-lgs/1-1-call-with-amini"
              target="_blank"
              rel="noopener noreferrer"
              className="group relative w-full flex items-center justify-center gap-3 px-8 py-4 rounded-xl overflow-hidden bg-gradient-to-r from-[#B8962E] via-[#D4AF37] to-[#F5D76E] text-black font-bold text-lg hover:shadow-[0_0_50px_rgba(212,175,55,0.4)] transition-all duration-500"
            >
              <Calendar size={22} />
              <span>Schedule a Session</span>
              <ExternalLink size={18} className="opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700" />
            </a>

            {}
            <button
              type="button"
              onClick={() => setCurrentView('DASHBOARD')}
              className="w-full mt-6 flex items-center justify-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft size={16} />
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  };

  const DashboardView = () => {
    
    const isCourseCompleted = (course: Course) => course.progress === 100;

    const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

    const getCoursesInLevel = (level: string) => {
      return courses
        .filter(c => c.level === level)
        .sort((a, b) => (a.orderIndex ?? 999) - (b.orderIndex ?? 999));
    };

    const getCompletedCountInLevel = (level: string) => {
      return getCoursesInLevel(level).filter(c => c.progress === 100).length;
    };

    const isLevelFullyComplete = (level: string) => {
      const levelCourses = getCoursesInLevel(level);
      return levelCourses.length > 0 && levelCourses.every(c => c.progress === 100);
    };

    const isPreviousLevelComplete = (level: string) => {
      const levelIndex = LEVELS.indexOf(level);
      if (levelIndex <= 0) return true; 
      return isLevelFullyComplete(LEVELS[levelIndex - 1]);
    };

    const isCourseUnlocked = (course: Course) => {
      const levelCourses = getCoursesInLevel(course.level);
      const courseIndexInLevel = levelCourses.findIndex(c => c.id === course.id);
      const completedInLevel = getCompletedCountInLevel(course.level);

      if (!isPreviousLevelComplete(course.level)) {
        return false;
      }

      if (completedInLevel >= 2) {
        return true;
      }

      if (courseIndexInLevel === 0) {
        return true;
      }

      const previousCourse = levelCourses[courseIndexInLevel - 1];
      return previousCourse && previousCourse.progress === 100;
    };

    const getLockedMessage = (course: Course) => {
      const levelCourses = getCoursesInLevel(course.level);
      const courseIndexInLevel = levelCourses.findIndex(c => c.id === course.id);
      const completedInLevel = getCompletedCountInLevel(course.level);

      if (!isPreviousLevelComplete(course.level)) {
        const levelIndex = LEVELS.indexOf(course.level);
        const previousLevel = LEVELS[levelIndex - 1];
        const previousLevelCourses = getCoursesInLevel(previousLevel);
        const completedPrevious = getCompletedCountInLevel(previousLevel);
        return `Complete all ${previousLevel} courses (${completedPrevious}/${previousLevelCourses.length}) to unlock`;
      }

      if (completedInLevel < 2 && courseIndexInLevel > 0) {
        const previousCourse = levelCourses[courseIndexInLevel - 1];
        if (previousCourse && previousCourse.progress < 100) {
          return `Complete "${previousCourse.title}" first`;
        }
        if (completedInLevel < 2) {
          return `Complete ${2 - completedInLevel} more course(s) to unlock all ${course.level} courses`;
        }
      }

      return '';
    };

    const isLevelUnlocked = (level: string) => {
      return isPreviousLevelComplete(level);
    };

    const getLockedMessageForLevel = (level: string) => {
      if (!isPreviousLevelComplete(level)) {
        const levelIndex = LEVELS.indexOf(level);
        const previousLevel = LEVELS[levelIndex - 1];
        const previousLevelCourses = getCoursesInLevel(previousLevel);
        const completedPrevious = getCompletedCountInLevel(previousLevel);
        return `Complete all ${previousLevel} courses (${completedPrevious}/${previousLevelCourses.length}) to unlock`;
      }
      return '';
    };

    const totalProgress = userDashboardStats?.completionPercentage !== undefined
      ? userDashboardStats.completionPercentage
      : courses.length > 0
        ? Math.round((courses.filter(c => c.progress === 100).length / courses.length) * 100)
        : 0;

    const completedCourses = userDashboardStats?.completedCourses || courses.filter(isCourseCompleted).length;
    const totalCoursesCount = userDashboardStats?.totalCourses || courses.length;
    const lessonsCompleted = userDashboardStats?.lessonsCompleted || 0;
    const avgQuizScore = userDashboardStats?.averageQuizScore || 0;

    return (
      <div className="md:ml-64 h-screen overflow-y-auto relative z-10 liquid-scroll">
        {}
        <div className="md:hidden p-4 flex justify-between items-center bg-[#0c0c0e] border-b border-white/[0.04] sticky top-0 z-40">
          <span className="font-helvetica-bold">Amini Academy</span>
          <button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {}
        {isAdminPreviewMode && (
          <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-500/90 to-yellow-500/90 backdrop-blur-sm border-b border-yellow-400/50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-black" />
              <span className="font-helvetica-bold text-black">Preview Mode</span>
              <span className="text-black/70 text-sm">You are viewing as a learner. Actions are disabled.</span>
            </div>
            <button
              type="button"
              onClick={() => { setIsAdminPreviewMode(false); setCurrentView('ADMIN'); }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-black font-medium text-sm transition-colors"
            >
              <X size={16} /> Exit Preview
            </button>
          </div>
        )}

        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-10">
          {}
          <div className="flex flex-col md:flex-row justify-between items-end gap-6 animate-fade-in">
            <div>
              <h2 className="text-4xl font-helvetica-bold mb-2">Welcome, {user?.name?.split(' ')[0]}</h2>
              <div className="flex gap-2">
                {user?.role === UserRole.SUPERUSER && <Badge type="warning">Ministry Champion</Badge>}
                <span className="text-zinc-400">Ready to upskill?</span>
              </div>
            </div>

            {}
            <div className="flex gap-3">
              {}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400/20 to-yellow-500/10 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center min-w-[80px]">
                  <div className="text-3xl font-helvetica-bold text-[#D4AF37]">{lessonsCompleted}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Lessons</div>
                </div>
              </div>

              <div className="w-px bg-white/10 h-16 hidden md:block self-center"></div>

              {}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-white/20 to-white/5 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center min-w-[80px]">
                  <div className="text-3xl font-helvetica-bold text-white">{completedCourses}<span className="text-lg text-zinc-500">/{totalCoursesCount}</span></div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Courses</div>
                </div>
              </div>

              <div className="w-px bg-white/10 h-16 hidden md:block self-center"></div>

              {}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-400/20 to-green-500/10 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center min-w-[80px]">
                  <div className="text-3xl font-helvetica-bold text-green-400">{avgQuizScore}%</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Quiz Avg</div>
                </div>
              </div>

              <div className="w-px bg-white/10 h-16 hidden md:block self-center"></div>

              {}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-yellow-400/20 to-green-400/10 rounded-2xl blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-3 flex items-center justify-center">
                  <div className="relative w-14 h-14">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="url(#dashboardGradient)"
                        strokeWidth="3"
                        strokeDasharray={`${totalProgress}, 100`}
                        strokeLinecap="round"
                        className="drop-shadow-[0_0_8px_rgba(250,204,21,0.5)] transition-all duration-1000"
                      />
                      <defs>
                        <linearGradient id="dashboardGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#FACC15" />
                          <stop offset="100%" stopColor="#22c55e" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-sm font-helvetica-bold text-white">{totalProgress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="relative group">
            {}
            <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/20 via-transparent to-[#D4AF37]/20 rounded-[28px] blur-2xl opacity-50 group-hover:opacity-70 transition-opacity duration-700" />

            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#111113] to-[#0c0c0e] border border-white/[0.08]">
              {}
              <div className="px-6 pt-6 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-helvetica-bold text-white flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.8)]" />
                      Bajan-X Program
                    </h3>
                    <p className="text-sm text-zinc-500 mt-1">Complete all {courses.length} modules to earn your certification</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-helvetica-bold text-[#D4AF37]">{totalProgress}</span>
                      <span className="text-lg text-[#D4AF37]/60">%</span>
                    </div>
                    <span className="text-xs text-zinc-600 uppercase tracking-wider">Complete</span>
                  </div>
                </div>
              </div>

              {}
              <LiquidProgressTimeline
                courses={courses}
                totalProgress={totalProgress}
                onCourseClick={handleStartCourse}
                isCourseUnlocked={isCourseUnlocked}
              />

              {}
              <div className="px-6 pb-4 pt-2 flex justify-center">
                <p className="text-[11px] text-zinc-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  Click any module to continue learning
                </p>
              </div>
            </div>
          </div>

          {}
          {user?.role === UserRole.SUPERUSER && (
            <GlassCard className="bg-gradient-to-br from-zinc-800/30 to-black border-yellow-500/30">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-helvetica-bold text-white flex items-center gap-2"><Users size={18} className="text-[#D4AF37]" /> Ministry Insights</h3>
                  <p className="text-sm text-zinc-400">Track your team's progress in {user.ministry}</p>
                </div>
                <PrimaryButton className="py-1 px-4 text-xs h-8">Invite Colleagues</PrimaryButton>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                  <div className="text-xs text-zinc-500">Active Learners</div>
                  <div className="text-xl font-helvetica-bold">24</div>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                  <div className="text-xs text-zinc-500">Certified</div>
                  <div className="text-xl font-helvetica-bold text-[#D4AF37]">8</div>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5">
                  <div className="text-xs text-zinc-500">Completion Rate</div>
                  <div className="text-xl font-helvetica-bold text-white">33%</div>
                </div>
              </div>
            </GlassCard>
          )}

          {/* Learning Paths & Courses - Grouped by Level */}
          <div className="space-y-12">
            {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => {
              const levelCourses = courses.filter(c => c.level === level);
              if (levelCourses.length === 0) return null;

              const isPathUnlocked = isLevelUnlocked(level);
              const levelTitle = level === 'Beginner' ? 'Beginner Track (Week 1-2)'
                : level === 'Intermediate' ? 'Intermediate Track (Week 3)'
                  : 'Advanced Track (Week 4)';
              const levelDescription = level === 'Beginner' ? 'Foundation modules for all learners.'
                : level === 'Intermediate' ? 'Security and platform integration.'
                  : 'Data workflows and certification.';

              return (
                <div key={level} className="animate-fade-in">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-lg ${isPathUnlocked ? 'bg-yellow-400/20 text-[#D4AF37]' : 'bg-zinc-800/50 text-zinc-600'}`}>
                      {isPathUnlocked ? <BookOpen size={20} /> : <Lock size={20} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className={`text-2xl font-helvetica-bold ${!isPathUnlocked && 'text-zinc-600'}`}>{levelTitle}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${level === 'Beginner' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                          level === 'Intermediate' ? 'bg-yellow-500/20 text-[#D4AF37] border border-yellow-500/30' :
                            'bg-purple-500/20 border-purple-400/30 text-purple-400'
                          }`}>{levelCourses.length} course{levelCourses.length !== 1 ? 's' : ''}</span>
                        {!isPathUnlocked && (
                          <span className="text-xs px-3 py-1 rounded-full bg-zinc-800 text-zinc-500 border border-zinc-700">
                            LOCKED
                          </span>
                        )}
                      </div>
                      <p className={`text-sm ${isPathUnlocked ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {isPathUnlocked ? levelDescription : getLockedMessageForLevel(level)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {levelCourses.map((course, courseIndex) => {
                      const courseUnlocked = isCourseUnlocked(course);
                      const lessonCount = course.lessons?.length || 0;
                      const completedLessons = course.lessons?.filter(l => l.isCompleted).length || 0;

                      return (
                        <div
                          key={course.id}
                          className={`group relative rounded-3xl overflow-hidden transition-all duration-500 ${courseUnlocked
                            ? 'hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(250,204,21,0.3)]'
                            : 'opacity-60'
                            }`}
                        >
                          {/* Card Background with Glassmorphism */}
                          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-black/90 backdrop-blur-xl border border-white/10 rounded-3xl group-hover:border-[#D4AF37]/50 transition-colors duration-500 pointer-events-none" />

                          {/* Ambient Glow Effect */}
                          <div className="absolute -inset-px bg-gradient-to-br from-yellow-400/0 via-transparent to-yellow-400/0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl pointer-events-none" />

                          <div className="relative">
                            {/* Image Container with Aspect Ratio - Clickable area for navigation */}
                            <div
                              className={`relative aspect-[16/10] overflow-hidden ${courseUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                              onClick={() => courseUnlocked && handleStartCourse(course)}
                            >
                              {/* Background Image */}
                              <img
                                src={course.thumbnail}
                                alt={course.title}
                                className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${courseUnlocked
                                  ? 'group-hover:scale-110 saturate-75 group-hover:saturate-100'
                                  : 'grayscale saturate-0'
                                  }`}
                              />

                              {/* Gradient Overlays */}
                              <div className={`absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent transition-opacity duration-500 ${courseUnlocked ? 'opacity-80 group-hover:opacity-60' : 'opacity-90'
                                }`} />
                              <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-yellow-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                              {/* Course Order Badge */}
                              {courseUnlocked && (
                                <div className="absolute top-3 left-3">
                                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-sm font-helvetica-bold">
                                    {courseIndex + 1}
                                  </div>
                                </div>
                              )}

                              {/* Level Badge */}
                              <div className="absolute top-3 right-3">
                                <div className={`px-3 py-1.5 rounded-full text-xs font-helvetica-bold backdrop-blur-md border ${course.level === 'Beginner'
                                  ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400'
                                  : course.level === 'Intermediate'
                                    ? 'bg-yellow-500/20 border-[#D4AF37]/50 text-[#D4AF37]'
                                    : 'bg-purple-500/20 border-purple-400/30 text-purple-400'
                                  }`}>
                                  {course.level}
                                </div>
                              </div>

                              {/* Lock Overlay */}
                              {!courseUnlocked && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                  <div className="w-16 h-16 rounded-full bg-zinc-900/90 border-2 border-zinc-700 flex items-center justify-center shadow-2xl">
                                    <Lock size={24} className="text-zinc-500" />
                                  </div>
                                </div>
                              )}

                              {/* Progress Ring - Bottom Right */}
                              {course.progress > 0 && courseUnlocked && (
                                <div className="absolute bottom-3 right-3">
                                  <div className="relative w-12 h-12">
                                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                                      <circle
                                        cx="18" cy="18" r="15.5"
                                        fill="none"
                                        stroke="rgba(255,255,255,0.1)"
                                        strokeWidth="3"
                                      />
                                      <circle
                                        cx="18" cy="18" r="15.5"
                                        fill="none"
                                        stroke="url(#progressGradient)"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeDasharray={`${course.progress * 0.97} 100`}
                                      />
                                      <defs>
                                        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                          <stop offset="0%" stopColor="#facc15" />
                                          <stop offset="100%" stopColor="#fef08a" />
                                        </linearGradient>
                                      </defs>
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span className="text-xs font-helvetica-bold text-white">{Math.round(course.progress)}%</span>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Content Section */}
                            <div className="relative p-5">
                              {/* Title */}
                              <h4 className={`text-lg font-helvetica-bold mb-2 leading-tight transition-colors duration-300 ${courseUnlocked
                                ? 'text-white group-hover:text-[#D4AF37]'
                                : 'text-zinc-500'
                                }`}>
                                {course.title}
                              </h4>

                              {/* Description */}
                              <p className={`text-sm leading-relaxed mb-4 ${courseUnlocked ? 'text-zinc-400' : 'text-zinc-600'
                                } ${expandedDescriptions.has(course.id) ? '' : 'line-clamp-2'}`}>
                                {course.description}
                              </p>
                              {course.description && course.description.length > 80 && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setExpandedDescriptions(prev => {
                                      const newSet = new Set(prev);
                                      if (newSet.has(course.id)) {
                                        newSet.delete(course.id);
                                      } else {
                                        newSet.add(course.id);
                                      }
                                      return newSet;
                                    });
                                  }}
                                  className={`text-xs font-medium mb-3 ${courseUnlocked
                                    ? 'text-[#D4AF37]/80 hover:text-[#D4AF37]'
                                    : 'text-zinc-600'
                                    } transition-colors cursor-pointer`}
                                >
                                  {expandedDescriptions.has(course.id) ? '← Show less' : 'Read more →'}
                                </button>
                              )}

                              {/* Stats Row */}
                              <div className={`flex items-center gap-4 text-xs ${courseUnlocked ? 'text-zinc-500' : 'text-zinc-700'
                                }`}>
                                <span className="flex items-center gap-1.5">
                                  <Clock size={14} className={courseUnlocked ? 'text-zinc-400' : ''} />
                                  {course.totalDuration}
                                </span>
                                <span className="flex items-center gap-1.5">
                                  <BookOpen size={14} className={courseUnlocked ? 'text-zinc-400' : ''} />
                                  {lessonCount} lessons
                                </span>
                                {course.progress > 0 && courseUnlocked && (
                                  <span className="flex items-center gap-1.5 text-[#D4AF37]">
                                    <CheckCircle size={14} />
                                    {completedLessons}/{lessonCount}
                                  </span>
                                )}
                              </div>

                              {/* Action Footer */}
                              <div className={`mt-4 pt-4 border-t border-white/5 flex justify-between items-center`}>
                                {courseUnlocked ? (
                                  <>
                                    <div className="flex items-center gap-2">
                                      {course.progress > 0 ? (
                                        <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                          <div
                                            className="h-full bg-gradient-to-r from-yellow-400 to-yellow-300 rounded-full transition-all duration-500"
                                            style={{ width: `${course.progress}%` }}
                                          />
                                        </div>
                                      ) : (
                                        <span className="text-xs text-zinc-500">Ready to start</span>
                                      )}
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleStartCourse(course)}
                                      className={`flex items-center gap-1 text-sm font-helvetica-bold transition-all duration-300 cursor-pointer ${course.progress > 0
                                        ? 'text-[#D4AF37] group-hover:text-yellow-300'
                                        : 'text-white group-hover:text-[#D4AF37]'
                                        } group-hover:translate-x-1`}
                                    >
                                      {course.progress > 0 ? 'Continue' : 'Start Course'}
                                      <ChevronRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                                    </button>
                                  </>
                                ) : (
                                  <span className="flex items-center gap-2 text-sm text-zinc-600">
                                    <Lock size={14} />
                                    Complete previous level to unlock
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const PlayerView = () => {
    // Quiz State
    const [quizState, setQuizState] = useState<'INTRO' | 'QUESTION' | 'RESULT'>('INTRO');
    const [currentQIdx, setCurrentQIdx] = useState(0);
    const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
    const [quizScore, setQuizScore] = useState(0);
    const [quizPassed, setQuizPassed] = useState<boolean | null>(null);
    const PASSING_SCORE = activeLesson?.passingScore || 70;

    // Download State
    const [isDownloaded, setIsDownloaded] = useState(false);

    // Sidebar collapse state
    // Sidebar collapse state moved to App level (playerSidebarCollapsed) for persistence

    // Video Progress Tracking State
    const [videoWatchedPercent, setVideoWatchedPercent] = useState(0);
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [ytPlayer, setYtPlayer] = useState<any>(null);
    const html5VideoRef = React.useRef<HTMLVideoElement>(null);
    const ytPlayerContainerRef = React.useRef<HTMLDivElement>(null);

    // Helper: Check if URL is YouTube
    const isYouTubeUrl = (url: string) => {
      return url?.includes('youtube.com') || url?.includes('youtu.be');
    };

    // Helper: Extract YouTube video ID
    const getYouTubeVideoId = (url: string) => {
      if (!url) return null;
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };

    // Reset local state when active lesson changes
    useEffect(() => {
      setQuizState('INTRO');
      setCurrentQIdx(0);
      setQuizAnswers([]);
      setQuizScore(0);
      setIsDownloaded(false);
      setVideoWatchedPercent(0);
      setIsVideoPlaying(false);
      if (ytPlayer) {
        ytPlayer.destroy();
        setYtPlayer(null);
      }
    }, [activeLesson?.id]);

    // Load YouTube IFrame API
    useEffect(() => {
      if (activeLesson?.type !== 'video' || !activeLesson.videoUrl) return;
      if (!isYouTubeUrl(activeLesson.videoUrl)) return;

      // Load YouTube API script if not already loaded
      if (!(window as any).YT) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const initPlayer = () => {
        const videoId = getYouTubeVideoId(activeLesson.videoUrl!);
        if (!videoId || !ytPlayerContainerRef.current) return;

        const player = new (window as any).YT.Player(ytPlayerContainerRef.current, {
          videoId,
          width: '100%',
          height: '100%',
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            enablejsapi: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event: any) => {
              console.log('YouTube player ready');
            },
            onStateChange: (event: any) => {
              
              setIsVideoPlaying(event.data === 1);
            }
          }
        });
        setYtPlayer(player);
      };

      if ((window as any).YT && (window as any).YT.Player) {
        initPlayer();
      } else {
        (window as any).onYouTubeIframeAPIReady = initPlayer;
      }

      return () => {
        if (ytPlayer) {
          ytPlayer.destroy();
        }
      };
    }, [activeLesson?.id, activeLesson?.videoUrl]);

    useEffect(() => {
      if (!ytPlayer || !isVideoPlaying) return;

      const progressInterval = setInterval(() => {
        try {
          const currentTime = ytPlayer.getCurrentTime();
          const duration = ytPlayer.getDuration();
          if (duration > 0) {
            const percent = Math.round((currentTime / duration) * 100);
            setVideoWatchedPercent(prev => Math.max(prev, percent)); 
          }
        } catch (e) {
          
        }
      }, 1000);

      return () => clearInterval(progressInterval);
    }, [ytPlayer, isVideoPlaying]);

    const handleHTML5VideoTimeUpdate = () => {
      const video = html5VideoRef.current;
      if (video && video.duration > 0) {
        const percent = Math.round((video.currentTime / video.duration) * 100);
        setVideoWatchedPercent(prev => Math.max(prev, percent));
      }
    };

    const handleHTML5VideoPlay = () => setIsVideoPlaying(true);
    const handleHTML5VideoPause = () => setIsVideoPlaying(false);

    useEffect(() => {
      if (activeLesson?.type !== 'video' || videoWatchedPercent === 0) return;

      const saveInterval = setInterval(async () => {
        if (videoWatchedPercent > 0) {
          try {
            await dataService.updateVideoProgress(activeLesson.id, videoWatchedPercent);
            console.log(`Progress saved: ${videoWatchedPercent}%`);
          } catch (error) {
            console.error('Failed to save video progress:', error);
          }
        }
      }, 10000);

      return () => clearInterval(saveInterval);
    }, [activeLesson?.id, activeLesson?.type, videoWatchedPercent]);

    const handleQuizAnswer = (optionIndex: number) => {
      const newAnswers = [...quizAnswers];
      newAnswers[currentQIdx] = optionIndex;
      setQuizAnswers(newAnswers);
    };

    const handleNextQuestion = () => {
      if (!activeLesson?.quiz) return;
      if (currentQIdx < activeLesson.quiz.length - 1) {
        setCurrentQIdx(currentQIdx + 1);
      } else {
        let score = 0;
        activeLesson.quiz.forEach((q, idx) => {
          if (quizAnswers[idx] === q.correctAnswer) score++;
        });
        setQuizScore(score);
        setQuizState('RESULT');
      }
    };

    const downloadResource = () => {
      if (!activeLesson?.fileUrl) {
        console.error('No file URL available for download');
        return;
      }
      const link = document.createElement('a');
      link.href = activeLesson.fileUrl;
      link.download = activeLesson.fileName || 'resource';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setIsDownloaded(true);
    };

    const completedCount = activeCourse?.lessons.filter(l => l.isCompleted).length || 0;
    const totalCount = activeCourse?.lessons.length || 0;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    const CurriculumItem = ({ lesson, idx, isActive, isLocked, isCompleted, onClick }: any) => (
      <button
        type="button"
        onClick={onClick}
        disabled={isLocked}
        className={`
          group/item w-full relative overflow-hidden rounded-2xl p-4 text-left transition-all duration-500
          ${isActive
            ? 'bg-gradient-to-r from-yellow-400/20 via-yellow-500/10 to-transparent border border-yellow-400/40 shadow-[0_0_30px_rgba(250,204,21,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]'
            : isLocked
              ? 'bg-white/[0.02] border border-white/5 opacity-50 cursor-not-allowed'
              : 'bg-white/[0.03] border border-white/10 hover:bg-white/[0.06] hover:border-white/20 hover:shadow-[0_4px_20px_rgba(0,0,0,0.3)]'
          }
        `}
      >
        {}
        {isActive && (
          <>
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#D4AF37] shadow-[0_0_10px_rgba(250,204,21,0.5)]" />
            <div className="absolute inset-0 bg-[#D4AF37]/5" />
          </>
        )}

        {}
        {isLocked && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-8 rounded-full bg-zinc-800/80 border border-zinc-700 flex items-center justify-center">
                <Lock size={14} className="text-zinc-500" />
              </div>
              <span className="text-[10px] text-zinc-500 font-medium">Complete previous</span>
            </div>
          </div>
        )}

        <div className="flex items-start gap-4 relative z-[1]">
          {}
          <div className={`
            relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
            ${isCompleted
              ? 'bg-[#D4AF37] shadow-[0_0_20px_rgba(250,204,21,0.4)]'
              : isActive
                ? 'bg-yellow-400/20 border-2 border-yellow-400/50'
                : 'bg-white/5 border border-white/10'
            }
          `}>
            {isCompleted ? (
              <CheckCircle size={18} className="text-black" />
            ) : (
              <span className={`text-sm font-helvetica-bold ${isActive ? 'text-[#D4AF37]' : 'text-zinc-500'}`}>
                {String(idx + 1).padStart(2, '0')}
              </span>
            )}

            {}
            {isActive && !isCompleted && (
              <div className="absolute inset-0 rounded-xl border-2 border-yellow-400/50 animate-ping opacity-30" />
            )}
          </div>

          {}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {lesson.type === 'video' && <Video size={12} className={isActive ? 'text-[#D4AF37]' : 'text-zinc-500'} />}
              {lesson.type === 'quiz' && <HelpCircle size={12} className={isActive ? 'text-[#D4AF37]' : 'text-zinc-500'} />}
              {(lesson.type === 'pdf' || lesson.type === 'presentation') && <FileText size={12} className={isActive ? 'text-[#D4AF37]' : 'text-zinc-500'} />}
              <span className={`text-[10px] uppercase tracking-wider font-medium ${isActive ? 'text-[#D4AF37]/80' : 'text-zinc-600'}`}>
                {lesson.type}
              </span>
            </div>

            <h4 className={`font-helvetica-bold text-sm leading-tight mb-1 transition-colors ${isActive ? 'text-white' : isCompleted ? 'text-zinc-300' : 'text-zinc-400'
              } ${!isLocked && 'group-hover/item:text-white'}`}>
              {lesson.title}
            </h4>

            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-zinc-500">{lesson.durationMin} min</span>
              {isCompleted && (
                <span className="text-[#D4AF37]/80 flex items-center gap-1">
                  <CheckCircle size={10} /> Done
                </span>
              )}
            </div>
          </div>

          {}
          {!isLocked && !isCompleted && (
            <ChevronRight size={16} className={`flex-shrink-0 transition-all duration-300 ${isActive ? 'text-[#D4AF37] translate-x-0 opacity-100' : 'text-zinc-600 -translate-x-2 opacity-0 group-hover/item:translate-x-0 group-hover/item:opacity-100'
              }`} />
          )}
        </div>
      </button>
    );

    return (
      <div className="h-screen flex flex-col relative z-20 overflow-hidden">
        {}
        {isAdminPreviewMode && (
          <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-500/90 to-yellow-500/90 backdrop-blur-sm border-b border-yellow-400/50 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye size={20} className="text-black" />
              <span className="font-helvetica-bold text-black">Preview Mode</span>
              <span className="text-black/70 text-sm hidden sm:inline">Progress will not be saved.</span>
            </div>
            <button
              type="button"
              onClick={() => { setIsAdminPreviewMode(false); setCurrentView('ADMIN'); }}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-black font-medium text-sm transition-colors"
            >
              <X size={16} /> Exit Preview
            </button>
          </div>
        )}

        {}
        <div className="relative z-30 sticky top-0">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-transparent" />
          <div className="relative h-20 flex items-center justify-between px-6 border-b border-white/[0.06] bg-[#0a0a0b]">
            <div className="flex items-center gap-5">
              <button
                type="button"
                onClick={() => setCurrentView('DASHBOARD')}
                className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
              >
                <ChevronRight className="rotate-180 text-zinc-400 group-hover:text-white transition-colors" size={18} />
                <span className="text-sm text-zinc-400 group-hover:text-white transition-colors hidden sm:inline">Exit</span>
              </button>

              <div className="hidden md:block">
                <Badge type="success">{activeCourse?.level}</Badge>
              </div>

              <div className="hidden md:block">
                <h1 className="font-helvetica-bold text-lg text-white truncate max-w-md">{activeCourse?.title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-6">
              {}
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-helvetica-bold text-white">{completedCount}/{totalCount}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Lessons</div>
                </div>
                <div className="relative w-14 h-14">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="2.5"
                      strokeDasharray={`${progressPercent}, 100`}
                      strokeLinecap="round"
                      className="drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]"
                    />
                    <defs>
                      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#FACC15" />
                        <stop offset="100%" stopColor="#FEF08A" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-helvetica-bold text-[#D4AF37]">{progressPercent}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10">
          {}
          <div className={`
            transition-[width,transform] duration-200 hidden md:flex flex-col
            ${playerSidebarCollapsed ? 'w-20' : 'w-96'}
          `} style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="h-full relative">
              {}
              <div className="absolute inset-0 bg-[#0a0a0b] border-r border-white/[0.05]" />

              {}
              <div className="relative h-full flex flex-col">
                {}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`transition-all duration-200 ${playerSidebarCollapsed ? 'opacity-0 -translate-x-10 scale-90' : 'opacity-100 translate-x-0 scale-100'} overflow-hidden`} style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>
                      <h2 className="text-sm font-helvetica-bold text-white uppercase tracking-wider">Curriculum</h2>
                      <p className="text-[11px] text-zinc-500 mt-1">{totalCount} lessons • {activeCourse?.totalDuration}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPlayerSidebarCollapsed(!playerSidebarCollapsed)}
                      className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                    >
                      <List size={16} className="text-zinc-400" />
                    </button>
                  </div>

                  {}
                  {!playerSidebarCollapsed && (
                    <div className="relative h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="absolute inset-y-0 left-0 bg-[#D4AF37] rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)] transition-all duration-700"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  )}
                </div>

                {}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent liquid-scroll">
                  {activeCourse?.lessons.map((lesson, idx) => {
                    const isLocked = idx > 0 && !activeCourse.lessons[idx - 1].isCompleted;
                    const isActive = activeLesson?.id === lesson.id;

                    if (playerSidebarCollapsed) {
                      return (
                        <button
                          type="button"
                          key={lesson.id}
                          onClick={() => !isLocked && setActiveLesson(lesson)}
                          disabled={isLocked}
                          className={`
                            w-12 h-12 rounded-xl flex items-center justify-center mx-auto transition-all
                            ${isActive
                              ? 'bg-yellow-400/20 border border-yellow-400/40 text-[#D4AF37]'
                              : isLocked
                                ? 'bg-white/5 border border-white/5 opacity-40'
                                : lesson.isCompleted
                                  ? 'bg-yellow-400/10 text-[#D4AF37]'
                                  : 'bg-white/5 border border-white/10 text-zinc-500 hover:bg-white/10'
                            }
                          `}
                        >
                          {lesson.isCompleted ? <CheckCircle size={16} /> : isLocked ? <Lock size={14} /> : idx + 1}
                        </button>
                      );
                    }

                    return (
                      <CurriculumItem
                        key={lesson.id}
                        lesson={lesson}
                        idx={idx}
                        isActive={isActive}
                        isLocked={isLocked}
                        isCompleted={lesson.isCompleted}
                        onClick={() => !isLocked && setActiveLesson(lesson)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="flex-1 overflow-y-auto liquid-scroll">
            <div className="min-h-full p-6 md:p-10 flex flex-col items-center">
              {activeLesson ? (
                <div className={`
                    ${playerSidebarCollapsed ? 'max-w-screen-xl lg:px-12' : 'max-w-5xl'}
                    w-full space-y-10 transition-all duration-200
                  `} style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}>

                  {}
                  <div className="text-center mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-4">
                      {activeLesson.type === 'video' && <Video size={14} className="text-[#D4AF37]" />}
                      {activeLesson.type === 'quiz' && <HelpCircle size={14} className="text-[#D4AF37]" />}
                      {(activeLesson.type === 'pdf' || activeLesson.type === 'presentation') && <FileText size={14} className="text-[#D4AF37]" />}
                      <span className="text-xs uppercase tracking-wider text-zinc-400">{activeLesson.type} Lesson</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-xs text-zinc-500">{activeLesson.durationMin} min</span>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-helvetica-bold text-white mb-2">{activeLesson.title}</h2>
                  </div>

                  {}
                  {activeLesson.type === 'video' && (
                    <div className="space-y-4">
                      <LiquidVideoFrame>
                        <div className="aspect-video w-full bg-black relative">
                          {}
                          {isYouTubeUrl(activeLesson.videoUrl || '') ? (
                            <div
                              ref={ytPlayerContainerRef}
                              className="w-full h-full"
                              key={activeLesson.id} 
                            />
                          ) : (
                            
                            <video
                              ref={html5VideoRef}
                              className="w-full h-full"
                              controls
                              playsInline
                              crossOrigin="anonymous"
                              onTimeUpdate={handleHTML5VideoTimeUpdate}
                              onPlay={handleHTML5VideoPlay}
                              onPause={handleHTML5VideoPause}
                            >
                              <source src={activeLesson.fileUrl || activeLesson.videoUrl || ''} type="video/mp4" />
                              <source src={activeLesson.fileUrl || activeLesson.videoUrl || ''} type="video/webm" />
                              Your browser does not support the video tag.
                            </video>
                          )}
                        </div>
                      </LiquidVideoFrame>
                    </div>
                  )}

                  {}
                  {(activeLesson.type === 'pdf' || activeLesson.type === 'presentation') && (
                    <LiquidVideoFrame>
                      {activeLesson.fileUrl ? (
                        <div className="flex flex-col">
                          {}
                          <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gradient-to-r from-[#D4AF37]/10 to-transparent">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center">
                                {activeLesson.type === 'presentation' ? (
                                  <FileSpreadsheet size={20} className="text-[#D4AF37]" />
                                ) : (
                                  <FileText size={20} className="text-[#D4AF37]" />
                                )}
                              </div>
                              <div>
                                <h3 className="text-sm font-helvetica-bold text-white truncate max-w-[300px]">
                                  {activeLesson.fileName || activeLesson.title}
                                </h3>
                                <p className="text-xs text-zinc-500">
                                  {activeLesson.type === 'presentation' ? 'PowerPoint' : 'PDF'} • {activeLesson.durationMin} min
                                </p>
                              </div>
                            </div>
                            {}
                            <button
                              type="button"
                              onClick={() => {
                                downloadResource();
                                setIsDownloaded(true);
                              }}
                              className="group relative px-5 py-2.5 rounded-xl font-helvetica-bold text-sm transition-all duration-300 overflow-hidden
                                bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] text-black
                                hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] active:scale-95"
                            >
                              <span className="relative z-10 flex items-center gap-2">
                                <Download size={16} />
                                Download
                              </span>
                              {}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            </button>
                          </div>

                          {}
                          <div className="relative bg-white">
                            {activeLesson.type === 'presentation' ? (
                              
                              <iframe
                                src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(activeLesson.fileUrl)}`}
                                className="w-full h-[650px] border-0"
                                title={activeLesson.title}
                                onLoad={() => setIsDownloaded(true)}
                                allowFullScreen
                              />
                            ) : (
                              
                              <iframe
                                src={`https://docs.google.com/viewer?url=${encodeURIComponent(activeLesson.fileUrl)}&embedded=true`}
                                className="w-full h-[650px] border-0"
                                title={activeLesson.title}
                                onLoad={() => setIsDownloaded(true)}
                                allowFullScreen
                              />
                            )}
                          </div>

                          {}
                          <div className="p-4 border-t border-white/10 bg-black/30 flex items-center justify-between">
                            <p className="text-xs text-zinc-500 flex items-center gap-2">
                              <CheckCircle size={14} className="text-green-400" />
                              Document loaded - ready to continue
                            </p>
                            <div className="flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => window.open(activeLesson.fileUrl, '_blank')}
                                className="text-xs text-[#D4AF37] hover:text-yellow-400 flex items-center gap-1.5 transition-colors"
                              >
                                <ExternalLink size={12} />
                                Open original
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        
                        <div className="aspect-video flex flex-col items-center justify-center text-center p-10 relative">
                          <div className="absolute inset-0 opacity-30">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(250,204,21,0.1),transparent_50%)]" />
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.05),transparent_50%)]" />
                          </div>
                          <div className="relative z-10">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-yellow-500/10 border border-[#D4AF37]/50 flex items-center justify-center mb-8 mx-auto shadow-[0_0_40px_rgba(250,204,21,0.2)]">
                              <FileText size={48} className="text-[#D4AF37] drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                            </div>
                            <h3 className="text-2xl font-helvetica-bold text-white mb-3">Document Not Available</h3>
                            <p className="text-zinc-400 max-w-md">
                              This document hasn't been uploaded yet. Please check back later.
                            </p>
                          </div>
                        </div>
                      )}
                    </LiquidVideoFrame>
                  )}

                  {/* 3. Quiz Runner - Hyper Liquid Glass */}
                  {activeLesson.type === 'quiz' && activeLesson.quiz && (
                    <LiquidVideoFrame>
                      <div className="min-h-[500px] flex flex-col justify-center p-10">
                        {quizState === 'INTRO' && (
                          <div className="text-center space-y-8">
                            <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-yellow-400/20 to-yellow-500/10 border border-[#D4AF37]/50 mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(250,204,21,0.2)]">
                              <HelpCircle size={56} className="text-[#D4AF37] drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]" />
                            </div>
                            <div>
                              <h2 className="text-3xl font-helvetica-bold text-white mb-3">Knowledge Check</h2>
                              <p className="text-zinc-400 text-lg">Test your understanding with {activeLesson.quiz.length} questions</p>
                            </div>
                            <PrimaryButton onClick={() => setQuizState('QUESTION')} className="px-10 py-4 text-lg">
                              Begin Quiz
                            </PrimaryButton>
                          </div>
                        )}

                        {quizState === 'QUESTION' && (
                          <div className="max-w-2xl mx-auto w-full animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                              <span className="text-sm text-zinc-400 font-mono">
                                Question {currentQIdx + 1} of {activeLesson.quiz.length}
                              </span>
                              <div className="flex items-center gap-2">
                                {activeLesson.quiz.map((_, i) => (
                                  <div key={i} className={`w-2 h-2 rounded-full transition-all ${i < currentQIdx ? 'bg-yellow-400'
                                    : i === currentQIdx ? 'bg-yellow-400 w-4'
                                      : 'bg-white/20'
                                    }`} />
                                ))}
                              </div>
                            </div>

                            <h3 className="text-2xl font-helvetica-bold text-white mb-8 leading-relaxed">
                              {activeLesson.quiz[currentQIdx].question}
                            </h3>

                            <div className="space-y-3 mb-10">
                              {activeLesson.quiz[currentQIdx].options.map((opt, idx) => (
                                <button
                                  type="button"
                                  key={idx}
                                  onClick={() => handleQuizAnswer(idx)}
                                  className={`
                                    w-full p-5 rounded-2xl text-left border transition-all duration-300 group/opt
                                    ${quizAnswers[currentQIdx] === idx
                                      ? 'bg-yellow-400/20 border-yellow-400/50 shadow-[0_0_25px_rgba(250,204,21,0.15),inset_0_1px_0_rgba(255,255,255,0.1)]'
                                      : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-white/20'
                                    }
                                  `}
                                >
                                  <div className="flex items-center gap-4">
                                    <div className={`
                                      w-10 h-10 rounded-xl flex items-center justify-center text-sm font-helvetica-bold transition-all
                                      ${quizAnswers[currentQIdx] === idx
                                        ? 'bg-yellow-400 text-black shadow-[0_0_15px_rgba(250,204,21,0.4)]'
                                        : 'bg-white/10 text-zinc-400 group-hover/opt:bg-white/20'
                                      }
                                    `}>
                                      {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className={`text-lg ${quizAnswers[currentQIdx] === idx ? 'text-white' : 'text-zinc-300'}`}>
                                      {opt}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>

                            <div className="flex justify-end">
                              <PrimaryButton
                                onClick={handleNextQuestion}
                                disabled={quizAnswers[currentQIdx] === undefined}
                                className="px-8"
                              >
                                {currentQIdx === activeLesson.quiz.length - 1 ? 'See Results' : 'Next Question'}
                                <ChevronRight size={18} className="ml-1" />
                              </PrimaryButton>
                            </div>
                          </div>
                        )}

                        {quizState === 'RESULT' && (() => {
                          const scorePercent = Math.round((quizScore / activeLesson.quiz.length) * 100);
                          const passed = scorePercent >= PASSING_SCORE;
                          return (
                            <div className="text-center space-y-8 animate-fade-in">
                              <div className={`w-32 h-32 rounded-3xl mx-auto flex items-center justify-center shadow-[0_0_60px_${passed ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}] ${passed
                                ? 'bg-gradient-to-br from-green-400/30 to-green-500/10 border border-green-400/40'
                                : 'bg-gradient-to-br from-red-400/30 to-red-500/10 border border-red-400/40'
                                }`}>
                                {passed ? (
                                  <Trophy size={64} className="text-green-400 drop-shadow-[0_0_25px_rgba(34,197,94,0.6)]" />
                                ) : (
                                  <XCircle size={64} className="text-red-400 drop-shadow-[0_0_25px_rgba(239,68,68,0.6)]" />
                                )}
                              </div>
                              <div>
                                <h2 className={`text-3xl font-helvetica-bold mb-4 ${passed ? 'text-green-400' : 'text-red-400'}`}>
                                  {passed ? 'Quiz Passed!' : 'Quiz Not Passed'}
                                </h2>
                                <div className={`text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r mb-3 ${passed
                                  ? 'from-green-400 via-green-300 to-white'
                                  : 'from-red-400 via-red-300 to-white'
                                  }`}>
                                  {scorePercent}%
                                </div>
                                <p className="text-zinc-400 text-lg">
                                  You answered <span className={passed ? 'text-green-400' : 'text-red-400'} style={{ fontWeight: 'bold' }}>{quizScore}</span> out of <span className="text-white font-helvetica-bold">{activeLesson.quiz.length}</span> correctly
                                </p>
                                <p className="text-zinc-500 text-sm mt-2">
                                  Passing score: {PASSING_SCORE}%
                                </p>
                                {!passed && (
                                  <p className="text-[#D4AF37]/80 text-sm mt-4 px-4 py-2 rounded-lg bg-yellow-400/10 border border-yellow-400/20 inline-block">
                                    You need to score at least {PASSING_SCORE}% to complete this lesson
                                  </p>
                                )}
                              </div>
                              <div className="flex gap-4 justify-center pt-4">
                                <button
                                  type="button"
                                  onClick={() => { setQuizState('INTRO'); setCurrentQIdx(0); setQuizAnswers([]); setQuizPassed(null); }}
                                  className="px-8 py-3 rounded-xl font-helvetica-bold text-sm text-zinc-400 border border-white/20 bg-white/5 hover:bg-white/10 hover:text-white transition-all"
                                >
                                  <span className="flex items-center gap-2">
                                    <RefreshCw size={16} /> {passed ? 'Retry' : 'Try Again'}
                                  </span>
                                </button>
                                {passed && (
                                  <button
                                    type="button"
                                    onClick={() => handleLessonComplete(quizScore, activeLesson?.quiz?.length)}
                                    className="group relative px-8 py-3 rounded-xl font-helvetica-bold text-sm overflow-hidden
                                      bg-gradient-to-r from-[#D4AF37] via-[#F5D76E] to-[#D4AF37] border-2 border-[#F5D76E] text-black
                                      shadow-[0_0_30px_rgba(212,175,55,0.4),inset_0_1px_0_rgba(255,255,255,0.3)]
                                      hover:shadow-[0_0_50px_rgba(212,175,55,0.6)] active:scale-95 transition-all duration-300"
                                  >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                                    <span className="relative z-10 flex items-center gap-2">
                                      <Award size={16} /> Continue
                                      <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                    </span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </LiquidVideoFrame>
                  )}

                  {/* Lesson Footer Controls - Hyper Glass with Progress Requirements */}
                  {activeLesson.type !== 'quiz' && (
                    <div className="relative rounded-2xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.05] to-white/[0.02] backdrop-blur-xl border border-white/10" />
                      <div className="relative p-6 flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${activeLesson.isCompleted || (activeLesson.type === 'video' && videoWatchedPercent >= 80)
                            ? 'bg-green-500/20 border border-green-500/30'
                            : 'bg-white/5 border border-white/10'
                            }`}>
                            {activeLesson.isCompleted ? (
                              <CheckCircle size={28} className="text-green-400" />
                            ) : activeLesson.type === 'video' ? (
                              <div className="relative">
                                <PlayCircle size={28} className={videoWatchedPercent >= 80 ? 'text-green-400' : 'text-[#D4AF37]'} />
                                {videoWatchedPercent > 0 && videoWatchedPercent < 80 && (
                                  <span className="absolute -top-1 -right-1 text-[10px] bg-yellow-400 text-black px-1 rounded font-helvetica-bold">{videoWatchedPercent}%</span>
                                )}
                              </div>
                            ) : (
                              <FileText size={28} className="text-[#D4AF37]" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-helvetica-bold text-white text-lg">{activeLesson.title}</h4>
                            <p className="text-sm text-zinc-400">
                              {activeLesson.durationMin} min • {activeLesson.isCompleted ? (
                                <span className="text-green-400 flex items-center gap-1"><CheckCircle size={12} /> Completed</span>
                              ) : activeLesson.type === 'video' ? (
                                <span className={videoWatchedPercent >= 80 ? 'text-green-400' : 'text-[#D4AF37]'}>
                                  {videoWatchedPercent >= 80 ? 'Ready to complete' : `${videoWatchedPercent}% watched (80% required)`}
                                </span>
                              ) : 'In Progress'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          {/* Document download requirement */}
                          {(activeLesson.type === 'pdf' || activeLesson.type === 'presentation') && !activeLesson.isCompleted && !isDownloaded && (
                            <div className="text-sm text-[#D4AF37]/80 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400/15 to-yellow-400/5 border border-yellow-400/30 backdrop-blur-sm">
                              <Download size={14} /> View document first
                            </div>
                          )}

                          {/* Video progress requirement */}
                          {activeLesson.type === 'video' && !activeLesson.isCompleted && videoWatchedPercent < 80 && (
                            <div className="text-sm text-[#D4AF37]/80 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400/15 to-yellow-400/5 border border-yellow-400/30 backdrop-blur-sm">
                              <PlayCircle size={14} /> Watch 80% to complete
                            </div>
                          )}

                          {/* Liquid Yellow Bezel Continue Button */}
                          <button
                            type="button"
                            onClick={() => handleLessonComplete()}
                            disabled={
                              activeLesson.isCompleted ||
                              ((activeLesson.type === 'pdf' || activeLesson.type === 'presentation') && !isDownloaded) ||
                              (activeLesson.type === 'video' && videoWatchedPercent < 80)
                            }
                            className={`
                              group relative px-8 py-3.5 rounded-2xl font-helvetica-bold text-sm transition-all duration-300 overflow-hidden
                              ${activeLesson.isCompleted
                                ? 'bg-gradient-to-r from-green-500/20 to-green-500/10 border-2 border-green-500/50 text-green-400 cursor-default'
                                : activeLesson.type === 'video' && videoWatchedPercent >= 80
                                  ? 'bg-gradient-to-r from-green-500 to-green-400 border-2 border-green-300 text-black shadow-[0_0_30px_rgba(34,197,94,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] active:scale-95'
                                  : (activeLesson.isCompleted || ((activeLesson.type === 'pdf' || activeLesson.type === 'presentation') && !isDownloaded) || (activeLesson.type === 'video' && videoWatchedPercent < 80))
                                    ? 'bg-zinc-900/50 border-2 border-zinc-700 text-zinc-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-[#D4AF37] via-[#F5D76E] to-[#D4AF37] border-2 border-[#F5D76E] text-black shadow-[0_0_30px_rgba(212,175,55,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(212,175,55,0.6)] active:scale-95'
                              }
                            `}
                          >
                            {/* Liquid shine animation */}
                            {!activeLesson.isCompleted && (
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                            )}
                            {/* Button content */}
                            <span className="relative z-10 flex items-center gap-2.5">
                              {activeLesson.isCompleted ? (
                                <>
                                  <CheckCircle size={18} />
                                  <span>Completed</span>
                                </>
                              ) : (
                                <>
                                  <span>Continue</span>
                                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </>
                              )}
                            </span>
                            {/* Glow effect behind button */}
                            {!activeLesson.isCompleted && !((activeLesson.type === 'pdf' || activeLesson.type === 'presentation') && !isDownloaded) && !(activeLesson.type === 'video' && videoWatchedPercent < 80) && (
                              <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37] to-[#F5D76E] rounded-2xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity -z-10" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="w-32 h-32 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8">
                    <BookOpen size={64} className="text-zinc-600" />
                  </div>
                  <h3 className="text-2xl font-helvetica-bold text-zinc-300 mb-3">Select a Lesson</h3>
                  <p className="text-zinc-500 max-w-sm">Choose a lesson from the curriculum to begin your learning journey.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile lesson selector */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40">
          <div className="bg-[#0a0a0b] border-t border-white/[0.05] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/20 flex items-center justify-center text-[#D4AF37] font-helvetica-bold">
                  {(activeCourse?.lessons.findIndex(l => l.id === activeLesson?.id) || 0) + 1}
                </div>
                <div>
                  <p className="text-sm font-medium text-white truncate max-w-[300px]" title={activeLesson?.title}>{activeLesson?.title}</p>
                  <p className="text-xs text-zinc-500">{completedCount}/{totalCount} completed</p>
                </div>
              </div>
              <button type="button" className="p-3 rounded-xl bg-white/5 border border-white/10">
                <Menu size={20} className="text-zinc-400" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AdminView = () => {
    // Toast notifications
    const { showToast } = useToast();

    // Admin State
    const [viewMode, setViewMode] = useState<'DASHBOARD' | 'EDITOR'>('DASHBOARD');
    const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
    const [editorTab, setEditorTab] = useState<'DETAILS' | 'CURRICULUM'>('DETAILS');
    const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
    const [newLessonType, setNewLessonType] = useState<ContentType>('video');
    const [isSaving, setIsSaving] = useState(false);
    // Track which item is uploading: null = none, 'thumbnail' = course thumbnail, lessonId = specific lesson
    const [uploadingId, setUploadingId] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

    // Inline Editing State for Course Manager
    const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
    const [editingCourseTitle, setEditingCourseTitle] = useState<string>('');

    // Pending Users State
    const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [loadingPending, setLoadingPending] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [processingUser, setProcessingUser] = useState<string | null>(null);
    const [userSearchQuery, setUserSearchQuery] = useState('');
    const [userFilterRole, setUserFilterRole] = useState<string>('ALL');

    // Create User Modal State
    const [showCreateUserModal, setShowCreateUserModal] = useState(false);
    const [createUserData, setCreateUserData] = useState({ email: '', password: '', name: '', ministry: '', role: 'LEARNER' });
    const [creatingUser, setCreatingUser] = useState(false);

    // Password Viewing State
    const [viewingPasswordUserId, setViewingPasswordUserId] = useState<string | null>(null);
    const [viewedPasswords, setViewedPasswords] = useState<Record<string, string | null>>({});
    const [loadingPassword, setLoadingPassword] = useState(false);

    // Reset Password Modal State
    const [resetPasswordUserId, setResetPasswordUserId] = useState<string | null>(null);
    const [newPasswordValue, setNewPasswordValue] = useState('');
    const [resettingPassword, setResettingPassword] = useState(false);

    // Track deleted lessons for backend sync
    const [deletedLessonIds, setDeletedLessonIds] = useState<string[]>([]);

    // Real Analytics State
    const [fullStats, setFullStats] = useState<{
      totalLearners: number;
      totalCourses: number;
      totalLessons: number;
      totalEnrollments: number;
      completionRate: number;
      totalStudyHours: number;
      overdueEnrollments?: number;
      averageQuizScore?: number;
      quizPassRate?: number;
    } | null>(null);
    const [ministryStats, setMinistryStats] = useState<any[]>([]);
    const [contentStats, setContentStats] = useState<any[]>([]);
    const [overdueLearners, setOverdueLearners] = useState<any[]>([]);
    const [selectedMinistry, setSelectedMinistry] = useState<string | null>(null);
    const [ministryCourseStats, setMinistryCourseStats] = useState<any[]>([]);

    // Track if data has been loaded (to prevent re-fetching)
    const [pendingUsersLoaded, setPendingUsersLoaded] = useState(false);
    const [allUsersLoaded, setAllUsersLoaded] = useState(false);
    const [statsLoaded, setStatsLoaded] = useState(false);

    // Load pending users only once
    useEffect(() => {
      if (pendingUsersLoaded) return;
      const loadPendingUsers = async () => {
        setLoadingPending(true);
        try {
          const response = await authAPI.getPendingUsers();
          setPendingUsers(response.pendingUsers);
          setPendingUsersLoaded(true);
        } catch (err) {
          console.error('Failed to load pending users:', err);
        } finally {
          setLoadingPending(false);
        }
      };
      loadPendingUsers();
    }, [pendingUsersLoaded]);

    // Load real analytics data
    useEffect(() => {
      if (statsLoaded) return;
      const loadStats = async () => {
        try {
          const [statsRes, ministryRes, contentRes, overdueRes] = await Promise.all([
            dataService.getFullAdminStats(),
            dataService.getMinistryStats(),
            dataService.getContentStats(),
            dataService.getOverdueLearners()
          ]);
          setFullStats(statsRes.stats);
          setMinistryStats(ministryRes.ministryStats || []);
          setContentStats(contentRes.contentStats || []);
          setOverdueLearners(overdueRes.overdueLearners || []);
          setStatsLoaded(true);
        } catch (err) {
          console.error('Failed to load admin stats:', err);
        }
      };
      loadStats();
    }, [statsLoaded]);

    // Load ministry course breakdown when a ministry is selected
    useEffect(() => {
      if (!selectedMinistry) {
        setMinistryCourseStats([]);
        return;
      }
      const loadMinistryCourseStats = async () => {
        try {
          const res = await dataService.getMinistryCourseStats(selectedMinistry);
          setMinistryCourseStats(res.ministryCourseStats || []);
        } catch (err) {
          console.error('Failed to load ministry course stats:', err);
        }
      };
      loadMinistryCourseStats();
    }, [selectedMinistry]);

    // Load all users when USERS section is active (only once)
    useEffect(() => {
      if (adminSection !== 'USERS' || allUsersLoaded) return;
      const loadAllUsers = async () => {
        setLoadingUsers(true);
        try {
          const response = await api.admin.getUsers({ limit: 100 });
          setAllUsers(response.users || []);
          setAllUsersLoaded(true);
        } catch (err) {
          console.error('Failed to load users:', err);
        } finally {
          setLoadingUsers(false);
        }
      };
      loadAllUsers();
    }, [adminSection, allUsersLoaded]);

    const handleApproveUser = async (userId: string) => {
      setProcessingUser(userId);
      try {
        await authAPI.approveUser(userId);
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
      } catch (err) {
        console.error('Failed to approve user:', err);
      } finally {
        setProcessingUser(null);
      }
    };

    const handleRejectUser = async (userId: string) => {
      setProcessingUser(userId);
      try {
        await authAPI.rejectUser(userId);
        setPendingUsers(prev => prev.filter(u => u.id !== userId));
      } catch (err) {
        console.error('Failed to reject user:', err);
      } finally {
        setProcessingUser(null);
      }
    };

    // Create new user handler
    const handleCreateUser = async () => {
      if (!createUserData.email || !createUserData.password || !createUserData.name) {
        showToast('error', 'Missing Fields', 'Please fill in all required fields.');
        return;
      }
      setCreatingUser(true);
      try {
        const result = await api.admin.createUser(createUserData);
        setAllUsers(prev => [result.user, ...prev]);
        setShowCreateUserModal(false);
        setCreateUserData({ email: '', password: '', name: '', ministry: '', role: 'LEARNER' });
        showToast('success', 'User Created', `${result.user.name} has been created successfully.`);
      } catch (err: any) {
        console.error('Failed to create user:', err);
        showToast('error', 'Creation Failed', err.message || 'Failed to create user. Please try again.');
      } finally {
        setCreatingUser(false);
      }
    };

    // View user password handler
    const handleViewPassword = async (userId: string) => {
      if (viewedPasswords[userId] !== undefined) {
        // Already loaded, just toggle visibility
        setViewingPasswordUserId(viewingPasswordUserId === userId ? null : userId);
        return;
      }
      setLoadingPassword(true);
      setViewingPasswordUserId(userId);
      try {
        const result = await api.admin.getUserPassword(userId);
        setViewedPasswords(prev => ({ ...prev, [userId]: result.password }));
      } catch (err) {
        console.error('Failed to get password:', err);
        setViewedPasswords(prev => ({ ...prev, [userId]: null }));
      } finally {
        setLoadingPassword(false);
      }
    };

    // Reset user password handler
    const handleResetPassword = async () => {
      if (!resetPasswordUserId || !newPasswordValue || newPasswordValue.length < 6) {
        showToast('error', 'Invalid Password', 'Password must be at least 6 characters.');
        return;
      }
      setResettingPassword(true);
      try {
        await api.admin.resetUserPassword(resetPasswordUserId, newPasswordValue);
        // Update the cached password
        setViewedPasswords(prev => ({ ...prev, [resetPasswordUserId]: newPasswordValue }));
        setResetPasswordUserId(null);
        setNewPasswordValue('');
        showToast('success', 'Password Reset', 'User password has been reset successfully.');
      } catch (err: any) {
        console.error('Failed to reset password:', err);
        showToast('error', 'Reset Failed', err.message || 'Failed to reset password. Please try again.');
      } finally {
        setResettingPassword(false);
      }
    };

    // Update user role handler
    const handleUpdateUserRole = async (userId: string, newRole: string) => {
      try {
        await api.admin.updateUser(userId, { role: newRole });
        setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        showToast('success', 'Role Updated', `User role has been updated to ${newRole}.`);
      } catch (err: any) {
        console.error('Failed to update user role:', err);
        showToast('error', 'Update Failed', err.message || 'Failed to update user role.');
      }
    };

    // Inline editing handlers for Course Manager
    const startEditingCourseTitle = (course: Course) => {
      setEditingCourseId(course.id);
      setEditingCourseTitle(course.title);
    };

    const saveEditingCourseTitle = async () => {
      if (!editingCourseId || !editingCourseTitle.trim()) {
        cancelEditingCourseTitle();
        return;
      }
      try {
        const updatedCourse = await dataService.updateCourse(editingCourseId, { title: editingCourseTitle.trim() });
        setCourses(prev => prev.map(c => c.id === editingCourseId ? { ...c, title: editingCourseTitle.trim() } : c));
        showToast('success', 'Title Updated', 'Course title has been updated successfully.');
      } catch (err) {
        console.error('Failed to update course title:', err);
        showToast('error', 'Update Failed', 'Failed to update course title. Please try again.');
      }
      cancelEditingCourseTitle();
    };

    const cancelEditingCourseTitle = () => {
      setEditingCourseId(null);
      setEditingCourseTitle('');
    };

    const handleQuickUpdateCourse = async (courseId: string, updates: { title?: string; level?: 'Beginner' | 'Intermediate' | 'Advanced' }) => {
      try {
        await dataService.updateCourse(courseId, updates);
        setCourses(prev => prev.map(c => c.id === courseId ? { ...c, ...updates } : c));
        showToast('success', 'Course Updated', 'Course has been updated successfully.');
      } catch (err) {
        console.error('Failed to update course:', err);
        showToast('error', 'Update Failed', 'Failed to update course. Please try again.');
      }
    };

    const handleCreateCourse = () => {
      setEditingCourse({
        id: `new-${Date.now()}`, // Temporary ID to identify as new course
        title: '',
        description: '',
        level: 'Beginner',
        lessons: [],
        thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070',
        totalDuration: '60 min',
        progress: 0,
        status: 'NOT_STARTED' as any
      });
      setViewMode('EDITOR');
      setEditorTab('DETAILS');
    };

    const handleEditCourse = (course: Course) => {
      setEditingCourse({ ...course });
      setViewMode('EDITOR');
      setEditorTab('CURRICULUM');
    };

    const addLesson = () => {
      if (!editingCourse) return;
      const lesson: Lesson = {
        id: `l-${Date.now()}`,
        title: 'New Lesson',
        type: newLessonType,
        durationMin: 10,
        content: '',
        quiz: []
      };
      setEditingCourse({
        ...editingCourse,
        lessons: [...(editingCourse.lessons || []), lesson]
      });
      setActiveLessonId(lesson.id);
    };

    const updateLesson = (id: string, updates: Partial<Lesson>) => {
      if (!editingCourse || !editingCourse.lessons) return;
      const updatedLessons = editingCourse.lessons.map(l => l.id === id ? { ...l, ...updates } : l);
      setEditingCourse({ ...editingCourse, lessons: updatedLessons });
    };

    const deleteLesson = (id: string) => {
      if (!editingCourse || !editingCourse.lessons) return;
      if (!confirm('Are you sure you want to delete this lesson?')) return;
      const updatedLessons = editingCourse.lessons.filter(l => l.id !== id);
      setEditingCourse({ ...editingCourse, lessons: updatedLessons });
      
      if (!id.startsWith('l-')) {
        setDeletedLessonIds(prev => [...prev, id]);
      }
      if (activeLessonId === id) {
        setActiveLessonId(updatedLessons[0]?.id || null);
      }
    };

    const moveLessonUp = (index: number) => {
      if (!editingCourse || !editingCourse.lessons || index === 0) return;
      const lessons = [...editingCourse.lessons];
      [lessons[index - 1], lessons[index]] = [lessons[index], lessons[index - 1]];
      setEditingCourse({ ...editingCourse, lessons });
    };

    const moveLessonDown = (index: number) => {
      if (!editingCourse || !editingCourse.lessons || index === editingCourse.lessons.length - 1) return;
      const lessons = [...editingCourse.lessons];
      [lessons[index], lessons[index + 1]] = [lessons[index + 1], lessons[index]];
      setEditingCourse({ ...editingCourse, lessons });
    };

    const deleteCourse = async (courseId: string) => {
      if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;
      try {
        await dataService.deleteCourse(courseId);
        const freshCourses = await dataService.getCourses();
        setCourses(sortCourses(freshCourses));
        showToast('success', 'Course Deleted', 'The course has been successfully removed.');
      } catch (error) {
        console.error('Failed to delete course:', error);
        showToast('error', 'Delete Failed', 'Failed to delete course. Please try again.');
      }
    };

    const handleSaveCourse = async () => {
      if (!editingCourse) return;
      setIsSaving(true);
      try {
        let courseId = editingCourse.id;
        const isNewCourse = !courseId || courseId.startsWith('new-');

        if (isNewCourse) {
          const savedCourse = await dataService.createCourse(editingCourse);
          courseId = savedCourse.id;
        } else {
          await dataService.updateCourse(courseId, editingCourse);
        }

        let deletionWarning = false;
        for (const deletedId of deletedLessonIds) {
          try {
            await dataService.deleteLesson(deletedId);
          } catch (err) {
            console.error(`Failed to delete lesson ${deletedId}:`, err);
            deletionWarning = true;
          }
        }
        setDeletedLessonIds([]); 

        const lessons = editingCourse.lessons || [];
        for (let i = 0; i < lessons.length; i++) {
          const lesson = lessons[i];
          const isNewLesson = lesson.id.startsWith('l-');

          if (isNewLesson) {
            
            await dataService.addLesson(courseId, {
              title: lesson.title,
              type: lesson.type,
              durationMin: lesson.durationMin,
              videoUrl: lesson.videoUrl,
              fileUrl: lesson.fileUrl,
              fileName: lesson.fileName,
              pageCount: lesson.pageCount,
              content: lesson.content,
              quiz: lesson.quiz,
              orderIndex: i
            });
          } else {
            
            await dataService.updateLesson(lesson.id, {
              title: lesson.title,
              type: lesson.type,
              durationMin: lesson.durationMin,
              videoUrl: lesson.videoUrl,
              fileUrl: lesson.fileUrl,
              fileName: lesson.fileName,
              pageCount: lesson.pageCount,
              content: lesson.content,
              quiz: lesson.quiz,
              orderIndex: i
            });
          }
        }

        const freshCourses = await dataService.getCourses();
        setCourses(sortCourses(freshCourses));
        setViewMode('DASHBOARD');
        setEditingCourse(null);
        setActiveLessonId(null);

        if (deletionWarning) {
          showToast('warning', 'Partial Save', 'Course saved but some lessons could not be deleted. Please review and retry.');
        } else {
          showToast('success', isNewCourse ? 'Course Created' : 'Course Updated', 'Your changes have been saved and published successfully.');
        }
      } catch (error) {
        console.error('Failed to save course:', error);
        showToast('error', 'Update Failed', 'Something went wrong. Please try again or contact support.');
      } finally {
        setIsSaving(false);
      }
    };

    const totalLessons = courses.reduce((acc, c) => acc + c.lessons.length, 0);

    if (viewMode === 'EDITOR' && editingCourse) {
      const activeLesson = editingCourse.lessons?.find(l => l.id === activeLessonId);

      return (
        <div className="md:ml-64 h-screen overflow-hidden relative z-10 flex flex-col">
          {}
          <div className="h-16 flex-shrink-0 bg-[linear-gradient(180deg,#121214_0%,#0a0a0b_100%)] border-b border-white/[0.05] flex items-center justify-between px-6 z-30">
            <div className="flex items-center gap-4">
              <IconButton icon={<ArrowLeft size={20} />} onClick={() => setViewMode('DASHBOARD')} />
              <h2 className="font-helvetica-bold text-lg text-white">Course Editor</h2>
              <div className="h-4 w-px bg-white/10"></div>
              <span className="text-zinc-400 text-sm">{editingCourse.title}</span>
            </div>
            <div className="flex gap-3">
              <SecondaryButton className="px-4 py-2 text-sm h-9 flex items-center" onClick={() => setViewMode('DASHBOARD')}>Cancel</SecondaryButton>
              <PrimaryButton
                className="px-4 py-2 text-sm h-9 flex items-center gap-2"
                onClick={handleSaveCourse}
                disabled={isSaving}
              >
                {isSaving ? (
                  <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Saving...</>
                ) : (
                  <><Save size={16} /> Publish Changes</>
                )}
              </PrimaryButton>
            </div>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {}
            <div className="w-80 bg-[linear-gradient(180deg,#131315_0%,#0a0a0b_100%)] border-r border-white/[0.05] flex flex-col">
              <div className="flex border-b border-white/5">
                <button
                  type="button"
                  onClick={() => setEditorTab('DETAILS')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors ${editorTab === 'DETAILS' ? 'text-[#D4AF37] border-b-2 border-yellow-400 bg-yellow-400/5' : 'text-zinc-400 hover:text-white'}`}
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('CURRICULUM')}
                  className={`flex-1 py-4 text-sm font-medium transition-colors ${editorTab === 'CURRICULUM' ? 'text-[#D4AF37] border-b-2 border-yellow-400 bg-yellow-400/5' : 'text-zinc-400 hover:text-white'}`}
                >
                  Curriculum
                </button>
              </div>

              {editorTab === 'DETAILS' ? (
                <div className="p-6 space-y-6 overflow-y-auto">
                  <div>
                    <label className="text-xs text-zinc-500 font-helvetica-bold uppercase mb-2 block">Course Thumbnail</label>
                    {}
                    {editingCourse.thumbnail && (
                      <div className="aspect-video rounded-xl bg-zinc-800 overflow-hidden mb-3 relative group border border-white/10">
                        <img src={editingCourse.thumbnail} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditingCourse({ ...editingCourse, thumbnail: '' })}
                          className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    {}
                    <div className="mb-3">
                      <FileDropZone
                        label="Upload Thumbnail Image"
                        accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                        currentFile={undefined}
                        isUploading={uploadingId === 'thumbnail'}
                        uploadProgress={uploadingId === 'thumbnail' ? uploadProgress : 0}
                        onFileSelect={async (file) => {
                          try {
                            setUploadingId('thumbnail');
                            setUploadProgress(0);
                            const result = await dataService.uploadFile(file, (progress) => {
                              setUploadProgress(progress);
                            });
                            setEditingCourse({ ...editingCourse, thumbnail: result.file.fileUrl });
                            showToast('success', 'Thumbnail Uploaded', 'Image uploaded successfully.');
                          } catch (error) {
                            console.error('Failed to upload thumbnail:', error);
                            showToast('error', 'Upload Failed', 'Failed to upload thumbnail. Please try again.');
                          } finally {
                            setUploadingId(null);
                            setUploadProgress(0);
                          }
                        }}
                      />
                    </div>
                    {}
                    <div className="relative mb-3">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                      <div className="relative flex justify-center"><span className="px-2 bg-zinc-900 text-xs text-zinc-500">OR use URL</span></div>
                    </div>
                    <input
                      value={editingCourse.thumbnail || ''}
                      onChange={e => setEditingCourse({ ...editingCourse, thumbnail: e.target.value })}
                      placeholder="Enter image URL..."
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-2 text-xs text-white focus:border-yellow-400 outline-none mb-3"
                    />
                    {}
                    <div className="text-xs text-zinc-500 mb-2">Quick select:</div>
                    <div className="grid grid-cols-4 gap-1">
                      {[
                        'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=400',
                        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=400',
                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=400',
                        'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=400',
                      ].map((url, idx) => (
                        <button
                          key={idx}
                          onClick={() => setEditingCourse({ ...editingCourse, thumbnail: url.replace('w=400', 'w=2070') })}
                          className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${editingCourse.thumbnail?.includes(url.split('?')[0].split('/').pop() || '') ? 'border-yellow-400' : 'border-transparent hover:border-white/30'}`}
                        >
                          <img src={url} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-helvetica-bold uppercase mb-2 block">Title</label>
                    <input
                      value={editingCourse.title}
                      onChange={e => setEditingCourse({ ...editingCourse, title: e.target.value })}
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-white focus:border-yellow-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-helvetica-bold uppercase mb-2 block">Description</label>
                    <textarea
                      value={editingCourse.description}
                      onChange={e => setEditingCourse({ ...editingCourse, description: e.target.value })}
                      className="w-full h-32 bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-white focus:border-yellow-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-helvetica-bold uppercase mb-2 block">Course Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Beginner', 'Intermediate', 'Advanced'] as const).map(level => (
                        <button
                          key={level}
                          onClick={() => setEditingCourse({ ...editingCourse, level })}
                          className={`py-3 px-2 rounded-xl text-sm font-medium transition-all border flex items-center justify-center text-center whitespace-nowrap min-h-[48px] ${editingCourse.level === level
                            ? 'bg-yellow-400 text-black border-yellow-400 shadow-lg shadow-yellow-400/20'
                            : 'bg-zinc-900/50 text-zinc-400 border-white/10 hover:border-yellow-400/50'
                            }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-2">
                      {editingCourse.level === 'Beginner' && 'Available to all learners from the start'}
                      {editingCourse.level === 'Intermediate' && 'Unlocked after completing all Beginner courses'}
                      {editingCourse.level === 'Advanced' && 'Unlocked after completing Beginner & Intermediate courses'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs text-zinc-500 font-helvetica-bold uppercase mb-2 block">Estimated Duration</label>
                    <input
                      value={editingCourse.totalDuration || ''}
                      onChange={e => setEditingCourse({ ...editingCourse, totalDuration: e.target.value })}
                      placeholder="e.g., 60 min or 1h 30min"
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-white focus:border-yellow-400 outline-none"
                    />
                  </div>

                  {}
                  <div className="pt-4 border-t border-white/10">
                    <h4 className="text-sm font-helvetica-bold text-white mb-3 flex items-center gap-2">
                      <Calendar size={16} className="text-[#D4AF37]" />
                      Deadline & Requirements
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-zinc-500 font-helvetica-bold uppercase mb-2 block">Completion Deadline</label>
                        <input
                          type="datetime-local"
                          value={editingCourse.deadline ? new Date(editingCourse.deadline).toISOString().slice(0, 16) : ''}
                          onChange={e => setEditingCourse({ ...editingCourse, deadline: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                          className="w-full bg-zinc-900/50 border border-white/10 rounded-xl p-3 text-white focus:border-yellow-400 outline-none"
                        />
                        <p className="text-[10px] text-zinc-500 mt-1">Leave empty for no deadline</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => setEditingCourse({ ...editingCourse, isMandatory: !editingCourse.isMandatory })}
                          className={`w-12 h-6 rounded-full transition-colors relative ${editingCourse.isMandatory ? 'bg-yellow-400' : 'bg-zinc-700'
                            }`}
                        >
                          <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${editingCourse.isMandatory ? 'translate-x-6' : 'translate-x-0.5'
                            }`} />
                        </button>
                        <div>
                          <span className="text-sm text-white">Mandatory Training</span>
                          <p className="text-[10px] text-zinc-500">Mark as required for all learners</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  <div className="p-4 space-y-2 overflow-y-auto flex-1">
                    {editingCourse.lessons?.map((lesson, idx) => (
                      <div
                        key={lesson.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', idx.toString());
                          e.dataTransfer.effectAllowed = 'move';
                          (e.target as HTMLElement).classList.add('dragging');
                        }}
                        onDragEnd={(e) => {
                          (e.target as HTMLElement).classList.remove('dragging');
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                          (e.currentTarget as HTMLElement).classList.add('drag-over');
                        }}
                        onDragLeave={(e) => {
                          (e.currentTarget as HTMLElement).classList.remove('drag-over');
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          (e.currentTarget as HTMLElement).classList.remove('drag-over');
                          const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                          const toIndex = idx;
                          if (fromIndex !== toIndex && editingCourse?.lessons) {
                            const lessons = [...editingCourse.lessons];
                            const [movedLesson] = lessons.splice(fromIndex, 1);
                            lessons.splice(toIndex, 0, movedLesson);
                            setEditingCourse({ ...editingCourse, lessons });
                          }
                        }}
                        onClick={() => setActiveLessonId(lesson.id)}
                        className={`group p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-2 ${activeLessonId === lesson.id
                          ? 'bg-yellow-400/10 border-[#D4AF37]/50 shadow-[0_0_15px_rgba(250,204,21,0.1)]'
                          : 'bg-white/5 border-transparent hover:border-white/10'
                          }`}
                      >
                        {}
                        <div
                          className="drag-handle p-1 rounded hover:bg-white/10 text-zinc-500 hover:text-zinc-300 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <GripVertical size={14} />
                        </div>
                        {}
                        <div className="flex flex-col gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); moveLessonUp(idx); }}
                            disabled={idx === 0}
                            className={`p-0.5 rounded hover:bg-white/10 ${idx === 0 ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-400 hover:text-white'}`}
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); moveLessonDown(idx); }}
                            disabled={idx === (editingCourse.lessons?.length || 0) - 1}
                            className={`p-0.5 rounded hover:bg-white/10 ${idx === (editingCourse.lessons?.length || 0) - 1 ? 'text-zinc-700 cursor-not-allowed' : 'text-zinc-400 hover:text-white'}`}
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>
                        <div className="h-6 w-6 rounded flex items-center justify-center bg-zinc-800 text-zinc-400 text-xs font-mono">{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate text-white" title={lesson.title}>{lesson.title}</div>
                          <div className="text-[10px] text-zinc-500 uppercase flex items-center gap-1">
                            {lesson.type === 'video' && <Video size={10} />}
                            {lesson.type === 'quiz' && <HelpCircle size={10} />}
                            {(lesson.type === 'pdf' || lesson.type === 'presentation') && <FileText size={10} />}
                            {lesson.type}
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteLesson(lesson.id); }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-white/10 bg-zinc-900/50">
                    <div className="flex gap-2 mb-2">
                      {(['video', 'pdf', 'presentation', 'quiz'] as ContentType[]).map(type => (
                        <button
                          key={type}
                          onClick={() => setNewLessonType(type)}
                          className={`flex-1 py-1 rounded text-[10px] uppercase font-helvetica-bold transition-all ${newLessonType === type ? 'bg-yellow-400 text-black' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
                        >
                          {type === 'presentation' ? 'PPT' : type}
                        </button>
                      ))}
                    </div>
                    <PrimaryButton onClick={addLesson} className="w-full py-2 text-sm">Add Lesson</PrimaryButton>
                  </div>
                </div>
              )}
            </div>

            {}
            <div className="flex-1 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-8 overflow-y-auto">
              {editorTab === 'CURRICULUM' && activeLesson ? (
                <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
                  {}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${
                        activeLesson.type === 'video' ? 'bg-gradient-to-br from-red-500/20 to-red-600/10 border border-red-500/30' :
                        activeLesson.type === 'quiz' ? 'bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-500/30' :
                        'bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30'
                      }`}>
                        {activeLesson.type === 'video' && <Video size={22} className="text-red-400" />}
                        {activeLesson.type === 'quiz' && <HelpCircle size={22} className="text-purple-400" />}
                        {(activeLesson.type === 'pdf' || activeLesson.type === 'presentation') && <FileText size={22} className="text-blue-400" />}
                      </div>
                      <div>
                        <span className={`text-[10px] font-helvetica-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          activeLesson.type === 'video' ? 'bg-red-500/20 text-red-400' :
                          activeLesson.type === 'quiz' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {activeLesson.type === 'presentation' ? 'PPT' : activeLesson.type.toUpperCase()}
                        </span>
                        <p className="text-[10px] text-zinc-600 font-mono mt-1">{activeLesson.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="relative group">
                    <input
                      className="text-3xl font-helvetica-bold bg-transparent border-none outline-none text-white placeholder-zinc-700 w-full pb-3 border-b-2 border-transparent focus:border-b-[#D4AF37]/50 transition-colors"
                      placeholder="Lesson Title"
                      value={activeLesson.title}
                      onChange={(e) => updateLesson(activeLesson.id, { title: e.target.value })}
                    />
                    <Pencil size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {}

                  {}
                  {activeLesson.type === 'video' && (
                    <div className="space-y-6">
                      {}
                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                          <div className="flex items-center gap-2">
                            <Video size={16} className="text-[#D4AF37]" />
                            <h3 className="text-sm font-helvetica-bold text-white">Video Source</h3>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1">Choose how to add your video content</p>
                        </div>

                        <div className="p-5">
                          <div className="grid grid-cols-2 gap-4">
                            {}
                            <div className={`rounded-xl border-2 transition-all ${activeLesson.videoUrl && !activeLesson.fileUrl ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5' : 'border-white/[0.08] hover:border-white/20'}`}>
                              <div className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                                    <PlayCircle size={16} className="text-zinc-400" />
                                  </div>
                                  <span className="text-xs font-helvetica-bold text-zinc-300 uppercase">URL</span>
                                </div>
                                <input
                                  className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2.5 outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/20 text-sm text-white placeholder-zinc-600 transition-all"
                                  placeholder="youtube.com/watch?v=..."
                                  value={activeLesson.videoUrl || ''}
                                  onChange={(e) => updateLesson(activeLesson.id, { videoUrl: e.target.value, fileUrl: undefined, fileName: undefined })}
                                />
                                <p className="text-[10px] text-zinc-600 mt-2">YouTube, Vimeo, or direct link</p>
                              </div>
                            </div>

                            {}
                            <div className={`rounded-xl border-2 transition-all ${activeLesson.fileUrl ? 'border-[#D4AF37]/50 bg-[#D4AF37]/5' : 'border-white/[0.08] hover:border-white/20'}`}>
                              <div className="p-4">
                                <div className="flex items-center gap-2 mb-3">
                                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                                    <MonitorPlay size={16} className="text-zinc-400" />
                                  </div>
                                  <span className="text-xs font-helvetica-bold text-zinc-300 uppercase">Upload</span>
                                </div>
                                <FileDropZone
                                  label="Upload Video"
                                  accept="video/mp4,video/webm,video/ogg,.mp4,.webm,.ogg"
                                  currentFile={activeLesson.fileName}
                                  isUploading={uploadingId === activeLesson.id}
                                  uploadProgress={uploadingId === activeLesson.id ? uploadProgress : 0}
                                  onFileSelect={async (file) => {
                                    const lessonId = activeLesson.id;
                                    try {
                                      setUploadingId(lessonId);
                                      setUploadProgress(0);
                                      const result = await dataService.uploadFile(file, (progress) => {
                                        setUploadProgress(progress);
                                      });
                                      updateLesson(lessonId, {
                                        fileUrl: result.file.fileUrl,
                                        fileName: result.file.originalName,
                                        videoUrl: undefined
                                      });
                                      showToast('success', 'Video Uploaded', 'Your video has been uploaded successfully.');
                                    } catch (error) {
                                      console.error('Failed to upload video:', error);
                                      showToast('error', 'Upload Failed', 'Failed to upload video. Please try again.');
                                    } finally {
                                      setUploadingId(null);
                                      setUploadProgress(0);
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {}
                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-[#D4AF37]" />
                            <h3 className="text-sm font-helvetica-bold text-white">Settings</h3>
                          </div>
                        </div>
                        <div className="p-5">
                          <div className="flex items-center gap-4">
                            <div className="flex-1 max-w-[200px]">
                              <label className="block text-xs text-zinc-500 mb-2 font-helvetica-bold uppercase">Duration</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2.5 pr-12 outline-none focus:border-[#D4AF37]/50 text-white"
                                  value={activeLesson.durationMin}
                                  onChange={(e) => updateLesson(activeLesson.id, { durationMin: parseInt(e.target.value) })}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">min</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {}
                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                          <div className="flex items-center gap-2">
                            <Eye size={16} className="text-[#D4AF37]" />
                            <h3 className="text-sm font-helvetica-bold text-white">Preview</h3>
                          </div>
                        </div>
                        <div className="aspect-video bg-black flex items-center justify-center text-zinc-500 overflow-hidden">
                          {activeLesson.fileUrl && activeLesson.type === 'video' ? (
                            <video
                              key={activeLesson.fileUrl}
                              controls
                              playsInline
                              crossOrigin="anonymous"
                              className="w-full h-full"
                            >
                              <source src={activeLesson.fileUrl} type="video/mp4" />
                              <source src={activeLesson.fileUrl} type="video/webm" />
                              Your browser does not support the video tag.
                            </video>
                          ) : activeLesson.videoUrl ? (
                            isYouTubeUrl(activeLesson.videoUrl) ? (
                              <iframe
                                key={activeLesson.videoUrl}
                                src={`https://www.youtube.com/embed/${getYouTubeVideoId(activeLesson.videoUrl)}`}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            ) : (
                              <iframe
                                key={activeLesson.videoUrl}
                                src={activeLesson.videoUrl}
                                className="w-full h-full border-0"
                                allowFullScreen
                              />
                            )
                          ) : (
                            <div className="text-center py-16">
                              <div className="w-20 h-20 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center mx-auto mb-4">
                                <PlayCircle size={32} className="text-zinc-600" />
                              </div>
                              <p className="text-zinc-500 text-sm">Add a video URL or upload a file</p>
                              <p className="text-zinc-600 text-xs mt-1">Preview will appear here</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {}
                  {(activeLesson.type === 'pdf' || activeLesson.type === 'presentation') && (
                    <div className="space-y-6">
                      {}
                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                          <div className="flex items-center gap-2">
                            {activeLesson.type === 'presentation' ? (
                              <FileSpreadsheet size={16} className="text-[#D4AF37]" />
                            ) : (
                              <FileText size={16} className="text-[#D4AF37]" />
                            )}
                            <h3 className="text-sm font-helvetica-bold text-white">
                              {activeLesson.type === 'pdf' ? 'PDF Document' : 'PowerPoint Presentation'}
                            </h3>
                          </div>
                          <p className="text-xs text-zinc-500 mt-1">Upload your document file</p>
                        </div>
                        <div className="p-5">
                          <FileDropZone
                            label={`Upload ${activeLesson.type === 'pdf' ? 'PDF' : 'PPT'}`}
                            accept={activeLesson.type === 'pdf' ? '.pdf,application/pdf' : '.ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation'}
                            currentFile={activeLesson.fileName}
                            isUploading={uploadingId === activeLesson.id}
                            uploadProgress={uploadingId === activeLesson.id ? uploadProgress : 0}
                            onFileSelect={async (file) => {
                              const lessonId = activeLesson.id;
                              try {
                                setUploadingId(lessonId);
                                setUploadProgress(0);
                                const result = await dataService.uploadFile(file, (progress) => {
                                  setUploadProgress(progress);
                                });
                                updateLesson(lessonId, {
                                  fileUrl: result.file.fileUrl,
                                  fileName: result.file.originalName
                                });
                                showToast('success', 'File Uploaded', `${activeLesson.type === 'pdf' ? 'PDF document' : 'Presentation'} uploaded successfully.`);
                              } catch (error) {
                                console.error('Failed to upload file:', error);
                                showToast('error', 'Upload Failed', 'Failed to upload file. Please try again.');
                              } finally {
                                setUploadingId(null);
                                setUploadProgress(0);
                              }
                            }}
                          />
                        </div>
                      </div>

                      {}
                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                          <div className="flex items-center gap-2">
                            <Clock size={16} className="text-[#D4AF37]" />
                            <h3 className="text-sm font-helvetica-bold text-white">Settings</h3>
                          </div>
                        </div>
                        <div className="p-5">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs text-zinc-500 mb-2 font-helvetica-bold uppercase">
                                Total {activeLesson.type === 'pdf' ? 'Pages' : 'Slides'}
                              </label>
                              <input
                                type="number"
                                className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2.5 outline-none focus:border-[#D4AF37]/50 text-white"
                                value={activeLesson.pageCount || 0}
                                onChange={(e) => updateLesson(activeLesson.id, { pageCount: parseInt(e.target.value) })}
                              />
                              <p className="text-[10px] text-zinc-600 mt-2">For estimated reading time</p>
                            </div>
                            <div>
                              <label className="block text-xs text-zinc-500 mb-2 font-helvetica-bold uppercase">Est. Time</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  className="w-full bg-zinc-900/80 border border-white/10 rounded-lg px-3 py-2.5 pr-12 outline-none text-white opacity-60"
                                  value={activeLesson.durationMin}
                                  readOnly
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500">min</span>
                              </div>
                              <p className="text-[10px] text-[#D4AF37] mt-2">Auto: 2 min / page</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {}
                      {activeLesson.fileUrl && (
                        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
                          <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                            <div className="flex items-center gap-2">
                              <Eye size={16} className="text-[#D4AF37]" />
                              <h3 className="text-sm font-helvetica-bold text-white">Uploaded File</h3>
                            </div>
                          </div>
                          <div className="p-5">
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-zinc-900/50 border border-white/[0.06]">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
                                {activeLesson.type === 'presentation' ? (
                                  <FileSpreadsheet size={28} className="text-blue-400" />
                                ) : (
                                  <FileText size={28} className="text-blue-400" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-helvetica-bold text-white truncate">{activeLesson.fileName}</p>
                                <p className="text-xs text-zinc-500 mt-1">
                                  {activeLesson.type === 'presentation' ? 'PowerPoint Presentation' : 'PDF Document'}
                                  {activeLesson.pageCount ? ` • ${activeLesson.pageCount} ${activeLesson.type === 'pdf' ? 'pages' : 'slides'}` : ''}
                                </p>
                              </div>
                              <button
                                onClick={() => window.open(activeLesson.fileUrl, '_blank')}
                                className="px-4 py-2.5 rounded-xl bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#D4AF37] text-sm font-helvetica-bold transition-all flex items-center gap-2"
                              >
                                <ExternalLink size={16} />
                                Open
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {}
                  {activeLesson.type === 'quiz' && (
                    <div className="space-y-6">
                      {}
                      <div className="rounded-2xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 backdrop-blur-sm overflow-hidden">
                        <div className="px-5 py-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center">
                              <Target size={20} className="text-[#D4AF37]" />
                            </div>
                            <div>
                              <label className="text-sm font-helvetica-bold text-white block">Passing Score</label>
                              <p className="text-xs text-zinc-500">Minimum % to pass this quiz</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-zinc-900/50 rounded-xl px-3 py-2 border border-white/10">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={activeLesson.passingScore || 70}
                              onChange={(e) => updateLesson(activeLesson.id, { passingScore: parseInt(e.target.value) || 70 })}
                              className="w-16 bg-transparent text-white text-center text-lg font-helvetica-bold focus:outline-none"
                            />
                            <span className="text-[#D4AF37] font-helvetica-bold">%</span>
                          </div>
                        </div>
                      </div>

                      {}
                      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] backdrop-blur-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-white/[0.06] bg-white/[0.02]">
                          <div className="flex items-center gap-2">
                            <HelpCircle size={16} className="text-[#D4AF37]" />
                            <h3 className="text-sm font-helvetica-bold text-white">Questions</h3>
                            <span className="ml-auto text-xs text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">
                              {activeLesson.quiz?.length || 0} / 15
                            </span>
                          </div>
                        </div>

                        <div className="p-5 space-y-4">
                          {activeLesson.quiz?.map((q, qIdx) => (
                            <div key={q.id} className="rounded-xl border border-white/[0.08] bg-zinc-900/30 overflow-hidden group">
                              {}
                              <div className="px-4 py-3 bg-zinc-900/50 border-b border-white/[0.06] flex items-center justify-between">
                                <span className="text-xs font-helvetica-bold text-purple-400 uppercase tracking-wide">
                                  Question {qIdx + 1}
                                </span>
                                <button
                                  onClick={() => {
                                    if (!confirm('Delete this question?')) return;
                                    const newQuiz = activeLesson.quiz?.filter((_, idx) => idx !== qIdx) || [];
                                    updateLesson(activeLesson.id, { quiz: newQuiz });
                                  }}
                                  className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-400/10 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              {}
                              <div className="p-4 space-y-4">
                                <input
                                  className="w-full bg-zinc-900/50 border border-white/10 rounded-lg px-3 py-2.5 outline-none focus:border-[#D4AF37]/50 text-white placeholder-zinc-600"
                                  value={q.question}
                                  placeholder="Enter your question..."
                                  onChange={(e) => {
                                    const newQuiz = [...(activeLesson.quiz || [])];
                                    newQuiz[qIdx].question = e.target.value;
                                    updateLesson(activeLesson.id, { quiz: newQuiz });
                                  }}
                                />

                                <div className="space-y-2">
                                  {q.options.map((opt, oIdx) => (
                                    <div
                                      key={oIdx}
                                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                                        q.correctAnswer === oIdx
                                          ? 'border-green-500/40 bg-green-500/10'
                                          : 'border-white/[0.06] hover:border-white/20 bg-zinc-900/30'
                                      }`}
                                      onClick={() => {
                                        const newQuiz = [...(activeLesson.quiz || [])];
                                        newQuiz[qIdx].correctAnswer = oIdx;
                                        updateLesson(activeLesson.id, { quiz: newQuiz });
                                      }}
                                    >
                                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                        q.correctAnswer === oIdx
                                          ? 'border-green-500 bg-green-500'
                                          : 'border-zinc-600'
                                      }`}>
                                        {q.correctAnswer === oIdx && (
                                          <CheckCircle size={12} className="text-white" />
                                        )}
                                      </div>
                                      <span className="text-xs text-zinc-500 font-medium w-5">{String.fromCharCode(65 + oIdx)}.</span>
                                      <input
                                        className="flex-1 bg-transparent text-sm text-white placeholder-zinc-600 outline-none"
                                        value={opt}
                                        placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={(e) => {
                                          const newQuiz = [...(activeLesson.quiz || [])];
                                          newQuiz[qIdx].options[oIdx] = e.target.value;
                                          updateLesson(activeLesson.id, { quiz: newQuiz });
                                        }}
                                      />
                                      {q.correctAnswer === oIdx && (
                                        <span className="text-[10px] text-green-400 font-helvetica-bold uppercase">Correct</span>
                                      )}
                                      {}
                                      {q.options.length > 2 && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newQuiz = [...(activeLesson.quiz || [])];
                                            
                                            newQuiz[qIdx].options.splice(oIdx, 1);
                                            
                                            if (newQuiz[qIdx].correctAnswer === oIdx) {
                                              
                                              newQuiz[qIdx].correctAnswer = 0;
                                            } else if (newQuiz[qIdx].correctAnswer > oIdx) {
                                              
                                              newQuiz[qIdx].correctAnswer = newQuiz[qIdx].correctAnswer - 1;
                                            }
                                            updateLesson(activeLesson.id, { quiz: newQuiz });
                                          }}
                                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded transition-all"
                                          title="Remove option"
                                        >
                                          <X size={14} />
                                        </button>
                                      )}
                                    </div>
                                  ))}

                                  {}
                                  {q.options.length < 6 && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newQuiz = [...(activeLesson.quiz || [])];
                                        const newOptionLetter = String.fromCharCode(65 + newQuiz[qIdx].options.length);
                                        newQuiz[qIdx].options.push(`Option ${newOptionLetter}`);
                                        updateLesson(activeLesson.id, { quiz: newQuiz });
                                      }}
                                      className="w-full py-2.5 border border-dashed border-white/10 rounded-lg text-zinc-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-all flex items-center justify-center gap-2 text-sm"
                                    >
                                      <Plus size={14} />
                                      Add Option ({q.options.length}/6)
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}

                          {}
                          {(activeLesson.quiz?.length || 0) < 15 ? (
                            <button
                              onClick={() => {
                                const newQuiz = [...(activeLesson.quiz || []), { id: `q-${Date.now()}`, question: '', options: ['Option A', 'Option B'], correctAnswer: 0 }];
                                updateLesson(activeLesson.id, { quiz: newQuiz });
                              }}
                              className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-[#D4AF37] hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/5 transition-all flex items-center justify-center gap-2 group"
                            >
                              <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                              <span className="font-helvetica-bold text-sm">Add Question</span>
                            </button>
                          ) : (
                            <div className="text-center py-4 text-zinc-500 text-sm bg-zinc-900/30 rounded-xl border border-white/[0.06]">
                              Maximum 15 questions reached
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500">
                  <Layout size={64} className="mb-6 opacity-20" />
                  <h3 className="text-xl font-medium text-zinc-400">Select a lesson to edit content</h3>
                  <p className="max-w-xs text-center mt-2 opacity-60">Choose from the curriculum on the left or create a new lesson.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    const filteredUsers = allUsers.filter(u => {
        const matchesSearch = userSearchQuery === '' ||
          u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
          u.email?.toLowerCase().includes(userSearchQuery.toLowerCase());
        const matchesRole = userFilterRole === 'ALL' || u.role === userFilterRole;
        return matchesSearch && matchesRole;
      });

      const activeUsers = allUsers.filter(u => u.is_approved && u.is_active).length;
      const adminCount = allUsers.filter(u => u.role === 'ADMIN' || u.role === 'SUBADMIN').length;

      const userManagementContent = (
        <div className="space-y-8">
          {}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#D4AF37]/10 via-transparent to-[#D4AF37]/10 rounded-[32px] blur-2xl opacity-50" />
            <div className="relative rounded-3xl overflow-hidden">
              {}
              <div className="absolute inset-0 backdrop-blur-xl bg-white/[0.02] border border-white/[0.06]" />
              {}
              <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/[0.03] via-transparent to-purple-500/[0.02]" />
              {}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

              <div className="relative p-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#D4AF37]/5 border border-[#D4AF37]/30 flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.15)]">
                        <Users size={24} className="text-[#D4AF37]" />
                      </div>
                      <div>
                        <h2 className="text-3xl font-helvetica-bold text-white">User Management</h2>
                        <p className="text-zinc-500 text-sm">Control access and permissions across your organization</p>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="flex flex-wrap gap-3">
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      <div className="relative px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-emerald-500/30 transition-all">
                        <div className="text-2xl font-helvetica-bold text-white">{activeUsers}</div>
                        <div className="text-xs text-emerald-400/80 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active Users
                        </div>
                      </div>
                    </div>
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/20 to-yellow-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      <div className="relative px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-[#D4AF37]/30 transition-all">
                        <div className="text-2xl font-helvetica-bold text-white">{pendingUsers.length}</div>
                        <div className="text-xs text-[#D4AF37]/80 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                          Pending
                        </div>
                      </div>
                    </div>
                    <div className="group relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-purple-600/10 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      <div className="relative px-5 py-3 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/30 transition-all">
                        <div className="text-2xl font-helvetica-bold text-white">{adminCount}</div>
                        <div className="text-xs text-purple-400/80 flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                          Administrators
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {}
          {pendingUsers.length > 0 && (
            <div className="relative group/pending">
              {}
              <div className="absolute -inset-2 bg-gradient-to-r from-[#D4AF37]/30 via-orange-500/20 to-[#D4AF37]/30 rounded-[32px] blur-2xl opacity-40 group-hover/pending:opacity-70 transition-all duration-1000 animate-pulse" />

              <div className="relative rounded-3xl overflow-hidden">
                {}
                <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-br from-[#D4AF37]/[0.08] via-black/40 to-black/60" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.15),transparent_50%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(212,175,55,0.08),transparent_50%)]" />
                <div className="absolute inset-0 border border-[#D4AF37]/30 rounded-3xl" />
                {}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" />

                <div className="relative p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-[#D4AF37]/30 rounded-2xl blur-xl animate-pulse" />
                        <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37]/40 to-[#D4AF37]/10 border border-[#D4AF37]/50 flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.3)]">
                          <Clock size={28} className="text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.5)]" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-helvetica-bold text-white">Pending Approvals</h3>
                        <p className="text-sm text-[#D4AF37]/70">{pendingUsers.length} user{pendingUsers.length > 1 ? 's' : ''} awaiting your review</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {pendingUsers.map((pendingUser, idx) => (
                      <div
                        key={pendingUser.id}
                        className="group/card relative overflow-hidden rounded-2xl transition-all duration-500"
                        style={{ animationDelay: `${idx * 100}ms` }}
                      >
                        {}
                        <div className="absolute inset-0 backdrop-blur-md bg-white/[0.04]" />
                        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.06] to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-500" />
                        <div className="absolute inset-0 border border-white/[0.08] group-hover/card:border-[#D4AF37]/40 rounded-2xl transition-colors duration-500" />

                        <div className="relative p-5 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="relative">
                              <div className="absolute inset-0 bg-zinc-500/20 rounded-xl blur-md group-hover/card:bg-[#D4AF37]/20 transition-colors duration-500" />
                              <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10 group-hover/card:border-[#D4AF37]/30 flex items-center justify-center font-helvetica-bold text-lg text-white shadow-lg transition-all duration-500">
                                {pendingUser.name.charAt(0).toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <div className="font-helvetica-bold text-white text-lg group-hover/card:text-[#D4AF37] transition-colors duration-300">{pendingUser.name}</div>
                              <div className="text-sm text-zinc-400">{pendingUser.email}</div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-zinc-500">{pendingUser.ministry}</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                                <span className="text-xs px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-zinc-400">{pendingUser.role}</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-600" />
                                <span className="text-xs text-zinc-500">{new Date(pendingUser.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleApproveUser(pendingUser.id)}
                              disabled={processingUser === pendingUser.id}
                              className="group/btn relative px-5 py-2.5 rounded-xl overflow-hidden transition-all duration-300 disabled:opacity-50"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-emerald-600/10" />
                              <div className="absolute inset-0 bg-emerald-500/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                              <div className="absolute inset-0 border border-emerald-500/30 group-hover/btn:border-emerald-400/60 rounded-xl transition-colors duration-300" />
                              <div className="absolute inset-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]" />
                              <div className="relative flex items-center gap-2 text-emerald-400 font-medium">
                                {processingUser === pendingUser.id ? (
                                  <Loader2 size={16} className="animate-spin" />
                                ) : (
                                  <UserCheck size={16} />
                                )}
                                <span className="hidden sm:inline">Approve</span>
                              </div>
                            </button>

                            <button
                              onClick={() => handleRejectUser(pendingUser.id)}
                              disabled={processingUser === pendingUser.id}
                              className="group/btn relative px-5 py-2.5 rounded-xl overflow-hidden transition-all duration-300 disabled:opacity-50"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/10" />
                              <div className="absolute inset-0 bg-red-500/20 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                              <div className="absolute inset-0 border border-red-500/30 group-hover/btn:border-red-400/60 rounded-xl transition-colors duration-300" />
                              <div className="relative flex items-center gap-2 text-red-400 font-medium">
                                <UserX size={16} />
                                <span className="hidden sm:inline">Reject</span>
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {}
          {pendingUsers.length === 0 && !loadingPending && (
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 rounded-[28px] blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
              <div className="relative rounded-3xl overflow-hidden">
                <div className="absolute inset-0 backdrop-blur-xl bg-white/[0.02] border border-white/[0.06]" />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.03] via-transparent to-transparent" />
                <div className="relative text-center py-16 px-8">
                  <div className="relative inline-block mb-6">
                    <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-xl" />
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 flex items-center justify-center">
                      <CheckCircle size={40} className="text-emerald-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-helvetica-bold text-white mb-2">All Caught Up!</h3>
                  <p className="text-zinc-500 max-w-md mx-auto">No pending user approvals at this time. New registration requests will appear here.</p>
                </div>
              </div>
            </div>
          )}

          {}
          <div className="relative">
            <div className="absolute inset-0 backdrop-blur-lg bg-white/[0.01] rounded-2xl border border-white/[0.04]" />
            <div className="relative p-4 flex flex-col lg:flex-row gap-4">
              {}
              <div className="flex-1 relative group/search">
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent rounded-2xl opacity-0 group-focus-within/search:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 border border-white/[0.06] group-focus-within/search:border-[#D4AF37]/30 rounded-2xl transition-colors duration-300" />
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="relative w-full bg-transparent rounded-2xl p-4 pl-12 text-white focus:outline-none placeholder-zinc-600"
                />
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              </div>

              {}
              <div className="flex gap-2 flex-wrap">
                {['ALL', 'LEARNER', 'SUPERUSER', 'SUBADMIN', 'ADMIN'].map(role => (
                  <button
                    key={role}
                    onClick={() => setUserFilterRole(role)}
                    className={`relative px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden ${
                      userFilterRole === role
                        ? 'text-black'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {userFilterRole === role && (
                      <>
                        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-yellow-500" />
                        <div className="absolute inset-0 shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
                      </>
                    )}
                    {userFilterRole !== role && (
                      <div className="absolute inset-0 bg-white/[0.03] border border-white/[0.06] hover:border-white/[0.12] rounded-xl transition-colors duration-300" />
                    )}
                    <span className="relative">{role === 'ALL' ? 'All' : role}</span>
                  </button>
                ))}
              </div>

              {}
              <button
                onClick={() => setShowCreateUserModal(true)}
                className="relative px-6 py-3 rounded-xl overflow-hidden group/create transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-yellow-500" />
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-[#D4AF37] opacity-0 group-hover/create:opacity-100 transition-opacity duration-300" />
                <div className="absolute inset-0 shadow-[0_0_25px_rgba(212,175,55,0.3)] group-hover/create:shadow-[0_0_35px_rgba(212,175,55,0.5)] transition-shadow duration-300" />
                <div className="relative flex items-center gap-2 text-black font-medium">
                  <UserPlus size={18} />
                  Create User
                </div>
              </button>
            </div>
          </div>

          {}
          <div className="relative group/list">
            <div className="absolute -inset-1 bg-gradient-to-r from-white/[0.03] via-transparent to-white/[0.03] rounded-[32px] blur-xl opacity-0 group-hover/list:opacity-100 transition-all duration-700" />

            <div className="relative rounded-3xl overflow-hidden">
              {}
              <div className="absolute inset-0 backdrop-blur-xl bg-white/[0.015]" />
              <div className="absolute inset-0 border border-white/[0.06]" />
              {}
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent" />

              {}
              <div className="relative p-6 border-b border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-helvetica-bold text-white">All Users</h3>
                    <span className="px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-zinc-400">{filteredUsers.length}</span>
                  </div>
                  <div className="text-xs text-zinc-600">Manage roles, passwords & permissions</div>
                </div>
              </div>

              {loadingUsers ? (
                <div className="relative p-16 text-center">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-[#D4AF37]/20 rounded-full blur-xl animate-pulse" />
                    <Loader2 size={40} className="relative animate-spin text-[#D4AF37]" />
                  </div>
                  <p className="text-zinc-500 mt-6">Loading users...</p>
                </div>
              ) : (
                <div className="relative divide-y divide-white/[0.03]">
                  {filteredUsers.map((u, idx) => (
                    <div key={u.id} className="group/user relative">
                      {}
                      <div className="relative p-5 transition-all duration-300">
                        {}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] via-white/[0.01] to-transparent opacity-0 group-hover/user:opacity-100 transition-opacity duration-300" />
                        {}
                        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#D4AF37] to-yellow-600 opacity-0 group-hover/user:opacity-100 transition-opacity duration-300" />

                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            {}
                            <div className="relative">
                              <div className={`absolute inset-0 rounded-xl blur-md transition-all duration-300 ${
                                u.role === 'ADMIN' ? 'bg-[#D4AF37]/30 group-hover/user:bg-[#D4AF37]/50' :
                                u.role === 'SUBADMIN' ? 'bg-purple-500/30 group-hover/user:bg-purple-500/50' :
                                u.role === 'SUPERUSER' ? 'bg-blue-500/30 group-hover/user:bg-blue-500/50' :
                                'bg-zinc-500/20 group-hover/user:bg-zinc-500/30'
                              }`} />
                              <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center font-helvetica-bold text-lg transition-all duration-300 ${
                                u.role === 'ADMIN' ? 'bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 border border-[#D4AF37]/40 text-[#D4AF37]' :
                                u.role === 'SUBADMIN' ? 'bg-gradient-to-br from-purple-500/30 to-purple-500/10 border border-purple-500/40 text-purple-400' :
                                u.role === 'SUPERUSER' ? 'bg-gradient-to-br from-blue-500/30 to-blue-500/10 border border-blue-500/40 text-blue-400' :
                                u.is_approved ? 'bg-gradient-to-br from-zinc-700 to-zinc-800 border border-white/10 text-white' :
                                'bg-zinc-800/50 border border-zinc-700/50 text-zinc-500'
                              }`}>
                                {u.name?.charAt(0).toUpperCase() || '?'}
                              </div>
                            </div>

                            <div>
                              <div className="font-medium text-white flex items-center gap-2 group-hover/user:text-[#D4AF37] transition-colors duration-300">
                                {u.name}
                                {!u.is_approved && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20">PENDING</span>
                                )}
                                {!u.is_active && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">INACTIVE</span>
                                )}
                              </div>
                              <div className="text-sm text-zinc-500">{u.email}</div>
                              <div className="text-xs text-zinc-600 mt-0.5">{u.ministry}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {}
                            <div className="relative">
                              <select
                                value={u.role}
                                onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                                className="appearance-none bg-white/[0.03] border border-white/[0.08] hover:border-white/[0.15] rounded-xl px-4 py-2 pr-8 text-sm text-white focus:ring-1 focus:ring-[#D4AF37]/30 focus:border-[#D4AF37]/30 outline-none cursor-pointer transition-all duration-300"
                              >
                                <option value="LEARNER" className="bg-zinc-900">LEARNER</option>
                                <option value="SUPERUSER" className="bg-zinc-900">SUPERUSER</option>
                                <option value="SUBADMIN" className="bg-zinc-900">SUBADMIN</option>
                                <option value="ADMIN" className="bg-zinc-900">ADMIN</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                            </div>

                            {}
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleViewPassword(u.id)}
                                className="relative p-2.5 rounded-xl overflow-hidden group/btn transition-all duration-300"
                                title="View Password"
                              >
                                <div className="absolute inset-0 bg-white/[0.03] border border-white/[0.06] group-hover/btn:border-white/[0.15] rounded-xl transition-colors duration-300" />
                                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                                <div className="relative text-zinc-400 group-hover/btn:text-white transition-colors duration-300">
                                  {viewingPasswordUserId === u.id && loadingPassword ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : viewingPasswordUserId === u.id ? (
                                    <EyeOff size={16} />
                                  ) : (
                                    <Eye size={16} />
                                  )}
                                </div>
                              </button>

                              <button
                                onClick={() => setResetPasswordUserId(u.id)}
                                className="relative p-2.5 rounded-xl overflow-hidden group/btn transition-all duration-300"
                                title="Reset Password"
                              >
                                <div className="absolute inset-0 bg-white/[0.03] border border-white/[0.06] group-hover/btn:border-[#D4AF37]/30 rounded-xl transition-colors duration-300" />
                                <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                                <div className="relative text-zinc-400 group-hover/btn:text-[#D4AF37] transition-colors duration-300">
                                  <Key size={16} />
                                </div>
                              </button>
                            </div>

                            {}
                            <div className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-300 ${
                              u.is_approved
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/20'
                            }`}>
                              {u.is_approved ? 'Active' : 'Pending'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {}
                      {viewingPasswordUserId === u.id && !loadingPassword && (
                        <div className="relative px-5 pb-5 -mt-1">
                          <div className="relative rounded-xl overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/[0.03] to-transparent" />
                            <div className="absolute inset-0 border border-[#D4AF37]/10 rounded-xl" />
                            <div className="relative p-4 flex items-center gap-4">
                              <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                                <Lock size={14} className="text-[#D4AF37]" />
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-sm text-zinc-500">Password:</span>
                                {viewedPasswords[u.id] ? (
                                  <code className="text-sm text-[#D4AF37] font-mono bg-black/40 px-3 py-1 rounded-lg border border-[#D4AF37]/20">{viewedPasswords[u.id]}</code>
                                ) : (
                                  <span className="text-sm text-zinc-600 italic">Not available (user set their own password)</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {filteredUsers.length === 0 && (
                    <div className="relative p-16 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center mx-auto mb-4">
                        <Users size={32} className="text-zinc-600" />
                      </div>
                      <p className="text-zinc-500">No users found matching your criteria.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {}
          {showCreateUserModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowCreateUserModal(false)} />

              <div className="relative w-full max-w-lg">
                {}
                <div className="absolute -inset-4 bg-gradient-to-r from-[#D4AF37]/20 via-yellow-500/10 to-[#D4AF37]/20 rounded-[40px] blur-2xl opacity-60" />

                <div className="relative rounded-3xl overflow-hidden">
                  {}
                  <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-br from-zinc-900/98 via-black/98 to-zinc-900/98" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08),transparent_50%)]" />
                  <div className="absolute inset-0 border border-[#D4AF37]/20 rounded-3xl" />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" />

                  <div className="relative p-8">
                    {}
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="absolute inset-0 bg-[#D4AF37]/30 rounded-xl blur-lg" />
                          <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-[#D4AF37]/30 to-[#D4AF37]/10 border border-[#D4AF37]/40 flex items-center justify-center">
                            <UserPlus size={28} className="text-[#D4AF37]" />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-2xl font-helvetica-bold text-white">Create New User</h3>
                          <p className="text-sm text-zinc-500">User will be auto-approved</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowCreateUserModal(false)}
                        className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
                      >
                        <X size={20} className="text-zinc-400" />
                      </button>
                    </div>

                    {}
                    <div className="space-y-5">
                      <div>
                        <label className="block text-sm text-zinc-400 mb-2 font-medium">Full Name *</label>
                        <div className="relative group/input">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent rounded-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300" />
                          <div className="absolute inset-0 border border-white/[0.06] group-focus-within/input:border-[#D4AF37]/30 rounded-xl transition-colors duration-300" />
                          <input
                            type="text"
                            value={createUserData.name}
                            onChange={(e) => setCreateUserData(prev => ({ ...prev, name: e.target.value }))}
                            className="relative w-full bg-transparent rounded-xl p-4 text-white focus:outline-none placeholder-zinc-600"
                            placeholder="John Doe"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-zinc-400 mb-2 font-medium">Email Address *</label>
                        <div className="relative group/input">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent rounded-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300" />
                          <div className="absolute inset-0 border border-white/[0.06] group-focus-within/input:border-[#D4AF37]/30 rounded-xl transition-colors duration-300" />
                          <input
                            type="email"
                            value={createUserData.email}
                            onChange={(e) => setCreateUserData(prev => ({ ...prev, email: e.target.value }))}
                            className="relative w-full bg-transparent rounded-xl p-4 text-white focus:outline-none placeholder-zinc-600"
                            placeholder="john@ministry.gov"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-zinc-400 mb-2 font-medium">Password *</label>
                        <div className="relative group/input">
                          <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent rounded-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300" />
                          <div className="absolute inset-0 border border-white/[0.06] group-focus-within/input:border-[#D4AF37]/30 rounded-xl transition-colors duration-300" />
                          <input
                            type="text"
                            value={createUserData.password}
                            onChange={(e) => setCreateUserData(prev => ({ ...prev, password: e.target.value }))}
                            className="relative w-full bg-transparent rounded-xl p-4 text-white focus:outline-none placeholder-zinc-600 font-mono"
                            placeholder="Initial password"
                          />
                        </div>
                        <p className="text-xs text-zinc-600 mt-2 flex items-center gap-1.5">
                          <Eye size={12} />
                          This password will be viewable by admins
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-zinc-400 mb-2 font-medium">Ministry</label>
                          <div className="relative group/input">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37]/5 to-transparent rounded-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300" />
                            <div className="absolute inset-0 border border-white/[0.06] group-focus-within/input:border-[#D4AF37]/30 rounded-xl transition-colors duration-300" />
                            <input
                              type="text"
                              value={createUserData.ministry}
                              onChange={(e) => setCreateUserData(prev => ({ ...prev, ministry: e.target.value }))}
                              className="relative w-full bg-transparent rounded-xl p-4 text-white focus:outline-none placeholder-zinc-600"
                              placeholder="Finance Ministry"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-zinc-400 mb-2 font-medium">Role</label>
                          <div className="relative group/input">
                            <div className="absolute inset-0 border border-white/[0.06] group-focus-within/input:border-[#D4AF37]/30 rounded-xl transition-colors duration-300" />
                            <select
                              value={createUserData.role}
                              onChange={(e) => setCreateUserData(prev => ({ ...prev, role: e.target.value }))}
                              className="relative w-full bg-transparent rounded-xl p-4 text-white focus:outline-none cursor-pointer appearance-none"
                            >
                              <option value="LEARNER" className="bg-zinc-900">LEARNER</option>
                              <option value="SUPERUSER" className="bg-zinc-900">SUPERUSER</option>
                              <option value="SUBADMIN" className="bg-zinc-900">SUBADMIN</option>
                              <option value="ADMIN" className="bg-zinc-900">ADMIN</option>
                            </select>
                            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {}
                    <div className="flex gap-4 mt-8">
                      <button
                        onClick={() => setShowCreateUserModal(false)}
                        className="flex-1 relative px-6 py-4 rounded-xl overflow-hidden group/btn transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-white/[0.03] border border-white/[0.06] group-hover/btn:border-white/[0.12] rounded-xl transition-colors duration-300" />
                        <span className="relative text-zinc-400 group-hover/btn:text-white font-medium transition-colors duration-300">Cancel</span>
                      </button>
                      <button
                        onClick={handleCreateUser}
                        disabled={creatingUser || !createUserData.email || !createUserData.password || !createUserData.name}
                        className="flex-1 relative px-6 py-4 rounded-xl overflow-hidden group/btn transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#D4AF37] to-yellow-500" />
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-[#D4AF37] opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-0 shadow-[0_0_30px_rgba(212,175,55,0.4)] group-hover/btn:shadow-[0_0_40px_rgba(212,175,55,0.6)] transition-shadow duration-300" />
                        <span className="relative flex items-center justify-center gap-2 text-black font-medium">
                          {creatingUser ? <Loader2 size={18} className="animate-spin" /> : <UserPlus size={18} />}
                          Create User
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {}
          {resetPasswordUserId && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => { setResetPasswordUserId(null); setNewPasswordValue(''); }} />

              <div className="relative w-full max-w-md">
                {}
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-500/20 via-orange-500/15 to-yellow-500/20 rounded-[40px] blur-2xl opacity-60" />

                <div className="relative rounded-3xl overflow-hidden">
                  {}
                  <div className="absolute inset-0 backdrop-blur-2xl bg-gradient-to-br from-zinc-900/98 via-black/98 to-zinc-900/98" />
                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(250,204,21,0.08),transparent_50%)]" />
                  <div className="absolute inset-0 border border-yellow-500/20 rounded-3xl" />
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-yellow-400/40 to-transparent" />

                  <div className="relative p-8">
                    <div className="flex items-center gap-4 mb-8">
                      <div className="relative">
                        <div className="absolute inset-0 bg-yellow-500/30 rounded-xl blur-lg" />
                        <div className="relative w-14 h-14 rounded-xl bg-gradient-to-br from-yellow-400/30 to-orange-500/10 border border-yellow-400/40 flex items-center justify-center">
                          <Key size={28} className="text-yellow-400" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-2xl font-helvetica-bold text-white">Reset Password</h3>
                        <p className="text-sm text-zinc-500">Set a new password for this user</p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm text-zinc-400 mb-2 font-medium">New Password</label>
                      <div className="relative group/input">
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent rounded-xl opacity-0 group-focus-within/input:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-0 border border-white/[0.06] group-focus-within/input:border-yellow-400/30 rounded-xl transition-colors duration-300" />
                        <input
                          type="text"
                          value={newPasswordValue}
                          onChange={(e) => setNewPasswordValue(e.target.value)}
                          className="relative w-full bg-transparent rounded-xl p-4 text-white focus:outline-none placeholder-zinc-600 font-mono"
                          placeholder="Enter new password (min 6 characters)"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                      <button
                        onClick={() => { setResetPasswordUserId(null); setNewPasswordValue(''); }}
                        className="flex-1 relative px-6 py-4 rounded-xl overflow-hidden group/btn transition-all duration-300"
                      >
                        <div className="absolute inset-0 bg-white/[0.03] border border-white/[0.06] group-hover/btn:border-white/[0.12] rounded-xl transition-colors duration-300" />
                        <span className="relative text-zinc-400 group-hover/btn:text-white font-medium transition-colors duration-300">Cancel</span>
                      </button>
                      <button
                        onClick={handleResetPassword}
                        disabled={resettingPassword || newPasswordValue.length < 6}
                        className="flex-1 relative px-6 py-4 rounded-xl overflow-hidden group/btn transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500" />
                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-yellow-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
                        <div className="absolute inset-0 shadow-[0_0_30px_rgba(250,204,21,0.4)] group-hover/btn:shadow-[0_0_40px_rgba(250,204,21,0.6)] transition-shadow duration-300" />
                        <span className="relative flex items-center justify-center gap-2 text-black font-medium">
                          {resettingPassword ? <Loader2 size={18} className="animate-spin" /> : <Key size={18} />}
                          Reset Password
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      );

    return (
      <div className={`md:ml-64 h-screen overflow-y-auto relative z-10 liquid-scroll transition-colors duration-700 bg-transparent`}>
        <div className={`p-6 md:p-10 max-w-7xl mx-auto space-y-8 pb-20 relative z-[60]`}>

          <PageTransition viewKey={adminSection}>
            {adminSection === 'USERS' && userManagementContent}

            {adminSection === 'OVERVIEW' && (
              <div className="space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h2 className="text-3xl font-helvetica-bold">Admin Command Center</h2>
                    <p className="text-zinc-400 mt-1">Overview of academy performance and content</p>
                  </div>
                  <PrimaryButton onClick={handleCreateCourse} className="text-sm shadow-lg shadow-yellow-400/20">
                    <Plus size={18} /> New Course
                  </PrimaryButton>
                </div>

                {}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <GlassCard className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Users size={64} /></div>
                    <div className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Total Learners</div>
                    <div className="text-4xl font-helvetica-bold text-white mb-1">{fullStats?.totalLearners?.toLocaleString() || '—'}</div>
                    <div className="text-[#D4AF37] text-xs flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-yellow-400"></div> {fullStats?.totalEnrollments || 0} enrollments</div>
                  </GlassCard>
                  <GlassCard className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><BookOpen size={64} /></div>
                    <div className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Content Library</div>
                    <div className="text-4xl font-helvetica-bold text-white mb-1">{fullStats?.totalLessons || totalLessons}</div>
                    <div className="text-zinc-400 text-xs">Across {fullStats?.totalCourses || courses.length} courses</div>
                  </GlassCard>
                  <GlassCard className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><CheckCircle size={64} /></div>
                    <div className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Completion Rate</div>
                    <div className="text-4xl font-helvetica-bold text-white mb-1">{fullStats?.completionRate ?? '—'}%</div>
                    <div className="text-[#D4AF37] text-xs">Avg. per enrollment</div>
                  </GlassCard>
                  <GlassCard className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Target size={64} /></div>
                    <div className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Quiz Pass Rate</div>
                    <div className="text-4xl font-helvetica-bold text-white mb-1">{fullStats?.quizPassRate ?? '—'}%</div>
                    <div className="text-zinc-400 text-xs">Avg score: {fullStats?.averageQuizScore ?? '—'}%</div>
                  </GlassCard>
                </div>

                {}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <GlassCard className="relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><MonitorPlay size={64} /></div>
                    <div className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Total Study Hours</div>
                    <div className="text-4xl font-helvetica-bold text-white mb-1">{fullStats?.totalStudyHours ? (fullStats.totalStudyHours >= 1000 ? `${(fullStats.totalStudyHours / 1000).toFixed(1)}k` : fullStats.totalStudyHours) : '—'}</div>
                    <div className="text-white text-xs">Total learning time logged</div>
                  </GlassCard>
                  <GlassCard className={`relative overflow-hidden group ${(fullStats?.overdueEnrollments || 0) > 0 ? 'border-red-500/30' : ''}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><AlertTriangle size={64} /></div>
                    <div className="text-zinc-400 text-sm font-medium uppercase tracking-wider mb-2">Overdue Enrollments</div>
                    <div className={`text-4xl font-helvetica-bold mb-1 ${(fullStats?.overdueEnrollments || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {fullStats?.overdueEnrollments ?? 0}
                    </div>
                    <div className={`text-xs ${(fullStats?.overdueEnrollments || 0) > 0 ? 'text-red-400/80' : 'text-green-400/80'}`}>
                      {(fullStats?.overdueEnrollments || 0) > 0 ? 'Learners past deadline' : 'All on track'}
                    </div>
                  </GlassCard>
                </div>

                {}
                {pendingUsers.length > 0 && (
                  <div className="relative group cursor-pointer" onClick={() => setAdminSection('USERS')}>
                    {}
                    <div className="absolute -inset-1 bg-gradient-to-r from-red-500/40 via-yellow-500/30 to-red-500/40 rounded-[28px] blur-xl opacity-80 animate-pulse" />
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-red-400/20 via-transparent to-yellow-400/20 rounded-[26px] blur-md" />

                    <div className="relative rounded-3xl overflow-hidden backdrop-blur-2xl bg-gradient-to-br from-red-900/30 via-black/60 to-yellow-900/20 border-2 border-red-500/50 shadow-[0_8px_32px_rgba(239,68,68,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] p-6 hover:border-yellow-400/60 transition-all duration-500">
                      {}
                      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-transparent pointer-events-none" />

                      {}
                      <div className="absolute top-4 right-4">
                        <span className="relative flex h-4 w-4">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                        </span>
                      </div>

                      <div className="relative z-10 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/30 to-yellow-500/20 border border-red-400/50 flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                            <UserCheck size={32} className="text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/30 text-red-400 font-helvetica-bold uppercase tracking-wider animate-pulse">Action Required</span>
                            </div>
                            <h3 className="text-2xl font-helvetica-bold text-white">{pendingUsers.length} Pending User{pendingUsers.length > 1 ? 's' : ''}</h3>
                            <p className="text-sm text-zinc-400 mt-1">Click here to approve or reject registration requests</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="hidden md:flex flex-col items-end text-right">
                            <span className="text-xs text-zinc-500">Oldest</span>
                            <span className="text-sm text-white font-medium">{pendingUsers.length > 0 ? new Date(pendingUsers[0].created_at).toLocaleDateString('fr-FR') : '-'}</span>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-yellow-400/20 border border-[#D4AF37]/50 flex items-center justify-center group-hover:bg-yellow-400/30 transition-all">
                            <ChevronRight size={24} className="text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {}
                {overdueLearners.length > 0 && (
                  <div className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 via-red-500/20 to-orange-500/20 rounded-[26px] blur-md opacity-60" />
                    <div className="relative rounded-2xl overflow-hidden backdrop-blur-xl bg-gradient-to-br from-orange-900/20 via-black/40 to-red-900/10 border border-orange-500/30 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500/30 to-orange-500/20 border border-red-400/40 flex items-center justify-center">
                            <AlertTriangle size={24} className="text-red-400" />
                          </div>
                          <div>
                            <h3 className="text-lg font-helvetica-bold text-white">{overdueLearners.length} Overdue Enrollment{overdueLearners.length > 1 ? 's' : ''}</h3>
                            <p className="text-sm text-zinc-400">Learners past their training deadline</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 text-xs rounded-full bg-red-500/20 text-red-400 font-medium border border-red-500/30">
                          Requires Attention
                        </span>
                      </div>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {overdueLearners.slice(0, 5).map((learner, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/10 flex items-center justify-center text-xs font-helvetica-bold text-red-400">
                                {learner.daysOverdue}d
                              </div>
                              <div>
                                <p className="text-sm font-medium text-white">{learner.name}</p>
                                <p className="text-xs text-zinc-500">{learner.courseTitle}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-zinc-400">{learner.ministry}</p>
                              {learner.isMandatory && (
                                <span className="text-xs text-red-400">Mandatory</span>
                              )}
                            </div>
                          </div>
                        ))}
                        {overdueLearners.length > 5 && (
                          <p className="text-center text-sm text-zinc-500 pt-2">
                            + {overdueLearners.length - 5} more overdue
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {}
                  <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.1] p-6">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-helvetica-bold flex items-center gap-2">
                        <BarChart3 size={20} className="text-[#D4AF37]" />
                        Ministry Learner Distribution
                      </h3>
                      <button
                        type="button"
                        onClick={() => setAdminSection('ANALYTICS')}
                        className="text-xs text-[#D4AF37] hover:text-yellow-300 flex items-center gap-1"
                      >
                        View Full Analytics <ChevronRight size={14} />
                      </button>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={ministryStats.length > 0 ? ministryStats.map((m, i) => ({
                            name: m.name?.length > 15 ? m.name.split(' ').map((w: string) => w[0]).join('').substring(0, 6) : m.name?.substring(0, 12) || `M${i + 1}`,
                            fullName: m.name,
                            total: m.totalLearners,
                            active: m.activeLearners || 0
                          })) : []}
                          barSize={20}
                          barGap={4}
                        >
                          <defs>
                            <linearGradient id="barGoldGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F5D76E" stopOpacity={1} />
                              <stop offset="50%" stopColor="#D4AF37" stopOpacity={1} />
                              <stop offset="100%" stopColor="#B8962E" stopOpacity={0.9} />
                            </linearGradient>
                            <linearGradient id="barGreenGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4ADE80" stopOpacity={1} />
                              <stop offset="50%" stopColor="#22C55E" stopOpacity={1} />
                              <stop offset="100%" stopColor="#16A34A" stopOpacity={0.9} />
                            </linearGradient>
                            <filter id="barGlow">
                              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                              <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis
                            dataKey="name"
                            stroke="#52525b"
                            tick={{ fontSize: 10, fill: '#71717a' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                            tickLine={false}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis
                            stroke="#52525b"
                            tick={{ fontSize: 10, fill: '#71717a' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                            tickLine={false}
                            width={35}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(212, 175, 55, 0.08)', radius: 8 }}
                            contentStyle={{
                              backgroundColor: 'rgba(9, 9, 11, 0.98)',
                              border: '1px solid rgba(212, 175, 55, 0.4)',
                              borderRadius: '16px',
                              boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(212, 175, 55, 0.15)',
                              backdropFilter: 'blur(20px)',
                              padding: '12px 16px'
                            }}
                            labelStyle={{ color: '#D4AF37', fontWeight: '700', marginBottom: '8px', fontSize: '13px' }}
                            itemStyle={{ color: '#e4e4e7', fontSize: '12px', padding: '2px 0' }}
                            formatter={(value: number, name: string) => [value.toLocaleString(), name === 'total' ? 'Total Learners' : 'Active Now']}
                            labelFormatter={(label: string, payload: any[]) => payload[0]?.payload?.fullName || label}
                          />
                          <Bar dataKey="total" name="Total" radius={[6, 6, 0, 0]} fill="url(#barGoldGradient)" filter="url(#barGlow)" />
                          <Bar dataKey="active" name="Active" radius={[6, 6, 0, 0]} fill="url(#barGreenGradient)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-8 mt-5 text-xs">
                      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                        <div className="w-3 h-3 rounded-md bg-gradient-to-b from-[#F5D76E] to-[#B8962E] shadow-sm shadow-[#D4AF37]/30" />
                        <span className="text-zinc-300 font-medium">Total Learners</span>
                      </div>
                      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="w-3 h-3 rounded-md bg-gradient-to-b from-[#4ADE80] to-[#16A34A] shadow-sm shadow-green-500/30" />
                        <span className="text-zinc-300 font-medium">Active Learners</span>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.1] p-6">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                    <h3 className="text-xl font-helvetica-bold flex items-center gap-2 mb-6">
                      <PieChartIcon size={20} className="text-purple-400" />
                      Content Library
                    </h3>
                    <div className="h-48 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            <linearGradient id="pieGold" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#F5D76E" />
                              <stop offset="100%" stopColor="#B8962E" />
                            </linearGradient>
                            <linearGradient id="pieBlue" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#60A5FA" />
                              <stop offset="100%" stopColor="#2563EB" />
                            </linearGradient>
                            <linearGradient id="piePurple" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#A78BFA" />
                              <stop offset="100%" stopColor="#7C3AED" />
                            </linearGradient>
                            <linearGradient id="pieGreen" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#4ADE80" />
                              <stop offset="100%" stopColor="#16A34A" />
                            </linearGradient>
                            <filter id="pieGlow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="blur"/>
                              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                            </filter>
                          </defs>
                          <Pie
                            data={contentStats.length > 0 ? contentStats : [
                              { name: 'Video', value: 45 },
                              { name: 'PDF', value: 30 },
                              { name: 'Quiz', value: 25 },
                            ]}
                            innerRadius={48}
                            outerRadius={76}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="rgba(9, 9, 11, 0.9)"
                            strokeWidth={3}
                          >
                            {(contentStats.length > 0 ? contentStats : [1, 2, 3, 4]).map((_, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={['url(#pieGold)', 'url(#pieBlue)', 'url(#piePurple)', 'url(#pieGreen)'][index % 4]}
                                filter="url(#pieGlow)"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(9, 9, 11, 0.98)',
                              border: '1px solid rgba(168, 85, 247, 0.4)',
                              borderRadius: '16px',
                              padding: '12px 16px',
                              boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(168, 85, 247, 0.15)',
                              backdropFilter: 'blur(20px)'
                            }}
                            itemStyle={{ color: '#e4e4e7', fontWeight: '600', fontSize: '13px' }}
                            labelStyle={{ color: '#A78BFA', marginBottom: '6px', fontWeight: '700', fontSize: '14px' }}
                            formatter={(value: number, name: string) => [`${value} lessons`, '']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-3xl font-helvetica-bold text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">{fullStats?.totalLessons || '—'}</span>
                        <span className="text-xs text-zinc-400 font-medium tracking-wide">Total Lessons</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 mt-5">
                      {(contentStats.length > 0 ? contentStats : [
                        { name: 'Video', count: '—' },
                        { name: 'PDF', count: '—' },
                        { name: 'Quiz', count: '—' },
                        { name: 'Text', count: '—' },
                      ]).slice(0, 4).map((c, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.1] transition-all duration-200">
                          <div
                            className="w-2.5 h-2.5 rounded-md shadow-lg"
                            style={{
                              background: ['linear-gradient(135deg, #F5D76E, #B8962E)', 'linear-gradient(135deg, #60A5FA, #2563EB)', 'linear-gradient(135deg, #A78BFA, #7C3AED)', 'linear-gradient(135deg, #4ADE80, #16A34A)'][idx % 4],
                              boxShadow: [`0 0 8px rgba(212, 175, 55, 0.4)`, `0 0 8px rgba(59, 130, 246, 0.4)`, `0 0 8px rgba(139, 92, 246, 0.4)`, `0 0 8px rgba(34, 197, 94, 0.4)`][idx % 4]
                            }}
                          />
                          <span className="text-xs text-zinc-400 truncate">{c.name}</span>
                          <span className="text-xs font-bold text-white ml-auto">{c.count || c.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.1] p-6">
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-xl font-helvetica-bold flex items-center gap-2">
                      <Trophy size={20} className="text-[#D4AF37]" />
                      Top Performing Ministries
                    </h3>
                    <button
                      type="button"
                      onClick={() => setAdminSection('ANALYTICS')}
                      className="text-xs text-[#D4AF37] hover:text-yellow-300 flex items-center gap-1"
                    >
                      View All <ChevronRight size={14} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {ministryStats.length > 0 ? [...ministryStats]
                      .sort((a, b) => {
                        const rateA = a.totalLearners > 0 ? (a.coursesCompleted / a.totalLearners) * 100 : 0;
                        const rateB = b.totalLearners > 0 ? (b.coursesCompleted / b.totalLearners) * 100 : 0;
                        return rateB - rateA;
                      })
                      .slice(0, 5)
                      .map((ministry, idx) => {
                        const completionRate = ministry.totalLearners > 0 ? Math.round((ministry.coursesCompleted / ministry.totalLearners) * 100) : 0;
                        return (
                          <div key={idx} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-helvetica-bold ${
                              idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' :
                              idx === 1 ? 'bg-gradient-to-br from-zinc-300 to-zinc-500 text-black' :
                              idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                              'bg-white/10 text-zinc-400'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white truncate">{ministry.name}</div>
                              <div className="text-xs text-zinc-500">{ministry.totalLearners} learners • {ministry.activeLearners || 0} active</div>
                            </div>
                            <div className="text-right">
                              <div className={`text-lg font-helvetica-bold ${completionRate >= 70 ? 'text-green-400' : completionRate >= 40 ? 'text-[#D4AF37]' : 'text-zinc-400'}`}>
                                {completionRate}%
                              </div>
                              <div className="text-xs text-zinc-500">completion</div>
                            </div>
                          </div>
                        );
                      }) : (
                      <div className="text-center text-zinc-500 py-8">No ministry data available yet</div>
                    )}
                  </div>
                </div>

                {}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-helvetica-bold">Manage Courses</h3>
                    <span className="text-sm text-zinc-400">
                      {courses.length} course{courses.length !== 1 ? 's' : ''} total
                    </span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {courses.map(course => {
                      const levelColor = course.level === 'Beginner' ? 'green' : course.level === 'Intermediate' ? 'yellow' : 'purple';
                      return (
                        <div key={course.id} className="group relative rounded-2xl transition-all duration-500 hover:scale-[1.01] hover:-translate-y-1">
                          {}
                          <div className={`absolute -inset-1 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl ${course.level === 'Beginner' ? 'bg-green-500/20' :
                            course.level === 'Intermediate' ? 'bg-yellow-500/20' :
                              'bg-purple-500/20'
                            }`}></div>

                          <div className="relative glass-panel rounded-2xl border border-white/10 group-hover:border-white/20 overflow-hidden backdrop-blur-xl bg-zinc-900/80 flex flex-col sm:flex-row h-full">
                            {}
                            <div className="w-full sm:w-48 h-32 sm:h-auto relative overflow-hidden shrink-0">
                              <img
                                src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800'}
                                alt={course.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/80 via-transparent to-transparent"></div>
                              <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-helvetica-bold backdrop-blur-md ${course.level === 'Beginner' ? 'bg-green-500/30 text-green-300 border border-green-500/50' :
                                course.level === 'Intermediate' ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-500/50' :
                                  'bg-purple-500/30 text-purple-300 border border-purple-500/50'
                                }`}>{course.level}</div>
                            </div>

                            {}
                            <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                              <div>
                                <h4 className="text-base font-helvetica-bold text-white mb-1 group-hover:text-[#D4AF37] transition-colors line-clamp-1">{course.title}</h4>
                                <p className="text-[11px] text-zinc-500 line-clamp-2 leading-relaxed mb-3">{course.description || 'No description provided for this module.'}</p>
                                <div className="flex gap-3 text-[10px]">
                                  <span className="flex items-center gap-1.5 text-zinc-400"><List size={12} className="text-zinc-600" /> {course.lessons.length} Modules</span>
                                  <span className="flex items-center gap-1.5 text-zinc-400"><Users size={12} className="text-zinc-600" /> {course.enrolledCount} Enrolled</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/5">
                                <PrimaryButton
                                  onClick={() => handleEditCourse(course)}
                                  className="flex-1 h-8 !py-0 !px-3 !text-[11px] !rounded-xl shadow-lg shadow-yellow-400/10"
                                >
                                  <Pencil size={12} /> Edit Module
                                </PrimaryButton>
                                <button
                                  onClick={() => deleteCourse(course.id)}
                                  className="h-8 w-8 flex items-center justify-center rounded-xl border border-red-500/20 text-red-500/60 hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all shrink-0"
                                  title="Delete Course"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {adminSection === 'COURSES' && (
              <div className="space-y-8">
                <div className={`flex justify-between items-end mb-8 transition-all duration-700 ${draggedCourseId ? 'opacity-20 blur-sm pointer-events-none' : 'opacity-100'}`}>
                  <div>
                    <h2 className="text-3xl font-helvetica-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Course Manager</h2>
                    <p className="text-zinc-400 mt-2 flex items-center gap-4">
                      <span>{courses.length} course{courses.length !== 1 ? 's' : ''}</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-400"></span><span className="text-green-400">{courses.filter(c => c.level === 'Beginner').length}</span> Beginner</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400"></span><span className="text-[#D4AF37]">{courses.filter(c => c.level === 'Intermediate').length}</span> Intermediate</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400"></span><span className="text-purple-400">{courses.filter(c => c.level === 'Advanced').length}</span> Advanced</span>
                    </p>
                  </div>
                  <PrimaryButton onClick={handleCreateCourse} className="text-sm shadow-lg shadow-yellow-400/20">
                    <Plus size={18} /> New Course
                  </PrimaryButton>
                </div>

                <div className="space-y-12">
                  {(['Beginner', 'Intermediate', 'Advanced'] as const).map(level => {
                    const levelCourses = courses.filter(c => c.level === level).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
                    if (levelCourses.length === 0) return null;

                    return (
                      <div key={level} className="space-y-6">
                        <div className="flex items-center gap-4">
                          <div className={`px-4 py-1.5 rounded-full text-sm font-helvetica-bold ${
                            level === 'Beginner' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                            level === 'Intermediate' ? 'bg-yellow-500/20 text-[#D4AF37] border border-yellow-500/30' :
                            'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          }`}>{level}</div>
                          <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
                          <span className="text-sm text-zinc-500 font-medium">{levelCourses.length} course{levelCourses.length > 1 ? 's' : ''} • Drag to reorder</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {levelCourses.map((course, index) => (
                            <div
                              key={course.id}
                              draggable
                              onDragStart={(e) => {
                                e.dataTransfer.setData('courseId', course.id);
                                e.dataTransfer.setData('level', level);
                                e.dataTransfer.effectAllowed = 'move';
                              }}
                              onDragOver={(e) => {
                                e.preventDefault();
                                e.currentTarget.style.outline = '2px solid #D4AF37';
                              }}
                              onDragLeave={(e) => {
                                e.currentTarget.style.outline = 'none';
                              }}
                              onDrop={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                e.currentTarget.style.outline = 'none';

                                if (document.activeElement instanceof HTMLElement) {
                                  document.activeElement.blur();
                                }

                                const draggedId = e.dataTransfer.getData('courseId');
                                const draggedLevel = e.dataTransfer.getData('level');

                                if (!draggedId || draggedId === course.id || draggedLevel !== level) return;

                                const currentLevelCourses = courses.filter(c => c.level === level).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
                                const fromIndex = currentLevelCourses.findIndex(c => c.id === draggedId);
                                const toIndex = currentLevelCourses.findIndex(c => c.id === course.id);

                                if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return;

                                const scrollY = window.scrollY;
                                const scrollX = window.scrollX;

                                const reordered = [...currentLevelCourses];
                                const [moved] = reordered.splice(fromIndex, 1);
                                reordered.splice(toIndex, 0, moved);

                                const updated = reordered.map((c, i) => ({ ...c, orderIndex: i }));
                                const otherCourses = courses.filter(c => c.level !== level);
                                setCourses(sortCourses([...otherCourses, ...updated]));

                                const restoreScroll = () => window.scrollTo(scrollX, scrollY);
                                restoreScroll();
                                requestAnimationFrame(restoreScroll);
                                setTimeout(restoreScroll, 0);
                                setTimeout(restoreScroll, 50);

                                dataService.reorderCourses(level, updated.map(c => c.id)).catch(err => {
                                  console.error('Reorder failed:', err);
                                });
                              }}
                              className="group relative rounded-2xl cursor-grab active:cursor-grabbing"
                            >
                              {}
                              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.12] hover:border-[#D4AF37]/40 transition-all duration-300 shadow-[0_8px_32px_rgba(0,0,0,0.4)]">
                                {}
                                <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                                <div className="relative aspect-video overflow-hidden">
                                  <img
                                    src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800'}
                                    alt={course.title}
                                    className="w-full h-full object-cover pointer-events-none"
                                    draggable={false}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
                                  <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-sm font-helvetica-bold text-white shadow-lg">
                                    {index + 1}
                                  </div>
                                  <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-helvetica-bold backdrop-blur-md ${
                                    level === 'Beginner' ? 'bg-green-500/20 text-green-300 border border-green-400/40' :
                                    level === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40' :
                                    'bg-purple-500/20 text-purple-300 border border-purple-400/40'
                                  }`}>{level}</div>
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="p-4 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8962E] text-black shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                                      <GripVertical size={28} />
                                    </div>
                                  </div>
                                </div>
                                <div className="p-5 bg-gradient-to-b from-transparent to-black/20">
                                  <h4 className="text-lg font-helvetica-bold text-white mb-2 line-clamp-1">{course.title}</h4>
                                  <p className="text-sm text-zinc-400 mb-4 line-clamp-2">{course.description || 'No description'}</p>
                                  <div className="flex gap-3">
                                    {}
                                    <button
                                      onClick={() => handleEditCourse(course)}
                                      draggable={false}
                                      className="relative flex-1 py-2.5 px-4 rounded-xl overflow-hidden bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] text-black text-sm font-helvetica-bold transition-all duration-300 flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(212,175,55,0.3)] hover:shadow-[0_6px_24px_rgba(212,175,55,0.5)] hover:scale-[1.02] active:scale-[0.98]"
                                    >
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />
                                      <Pencil size={14} /> Edit
                                    </button>
                                    {}
                                    <button
                                      onClick={() => deleteCourse(course.id)}
                                      draggable={false}
                                      className="relative p-2.5 rounded-xl overflow-hidden bg-gradient-to-br from-red-500/10 to-red-600/5 backdrop-blur-sm border border-red-500/30 text-red-400 hover:border-red-400/60 hover:bg-red-500/20 hover:text-red-300 transition-all duration-300 hover:shadow-[0_0_16px_rgba(239,68,68,0.3)] hover:scale-[1.05] active:scale-[0.95]"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>

                                {}
                                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {adminSection === 'ANALYTICS' && user?.role === UserRole.ADMIN && (
              <div className="space-y-6">
                {}
                <div className="relative">
                  <div className="absolute -top-4 -left-4 w-32 h-32 bg-[#D4AF37]/10 rounded-full blur-3xl" />
                  <h2 className="text-3xl font-helvetica-bold relative">Analytics Dashboard</h2>
                  <p className="text-zinc-400 mt-1 relative">Real-time insights into ministry training performance</p>
                </div>

                {}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {}
                  <div className="relative group rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.1] hover:border-[#D4AF37]/40 transition-all duration-300 p-5">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#D4AF37]/10 rounded-full blur-2xl group-hover:bg-[#D4AF37]/20 transition-colors" />
                    <div className="relative">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                        <Users size={14} className="text-[#D4AF37]" />
                        Total Learners
                      </div>
                      <div className="text-3xl font-helvetica-bold text-white">{fullStats?.totalLearners?.toLocaleString() || '—'}</div>
                      <div className="text-[#D4AF37] text-xs mt-1 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        {ministryStats.reduce((sum, m) => sum + (m.activeLearners || 0), 0)} active now
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="relative group rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.1] hover:border-green-500/40 transition-all duration-300 p-5">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-colors" />
                    <div className="relative">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                        <CheckCircle size={14} className="text-green-400" />
                        Completion Rate
                      </div>
                      <div className="text-3xl font-helvetica-bold text-white">{fullStats?.completionRate ?? '—'}%</div>
                      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-2">
                        <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-1000" style={{ width: `${fullStats?.completionRate || 0}%` }} />
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="relative group rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.1] hover:border-blue-500/40 transition-all duration-300 p-5">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
                    <div className="relative">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                        <Award size={14} className="text-blue-400" />
                        Quiz Pass Rate
                      </div>
                      <div className="text-3xl font-helvetica-bold text-white">{fullStats?.quizPassRate ?? '—'}%</div>
                      <div className="text-zinc-500 text-xs mt-1">Avg: {fullStats?.averageQuizScore ?? '—'}%</div>
                    </div>
                  </div>

                  {}
                  <div className="relative group rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.1] hover:border-purple-500/40 transition-all duration-300 p-5">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors" />
                    <div className="relative">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                        <Clock size={14} className="text-purple-400" />
                        Study Hours
                      </div>
                      <div className="text-3xl font-helvetica-bold text-white">
                        {fullStats?.totalStudyHours ? (fullStats.totalStudyHours >= 1000 ? `${(fullStats.totalStudyHours / 1000).toFixed(1)}k` : fullStats.totalStudyHours) : '—'}
                      </div>
                      <div className="text-zinc-500 text-xs mt-1">Total platform hours</div>
                    </div>
                  </div>

                  {}
                  <div className="relative group rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.1] hover:border-[#D4AF37]/40 transition-all duration-300 p-5">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-[#D4AF37]/10 rounded-full blur-2xl group-hover:bg-[#D4AF37]/20 transition-colors" />
                    <div className="relative">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                        <BookOpen size={14} className="text-[#D4AF37]" />
                        Enrollments
                      </div>
                      <div className="text-3xl font-helvetica-bold text-white">{fullStats?.totalEnrollments?.toLocaleString() || '—'}</div>
                      <div className="text-zinc-500 text-xs mt-1">{fullStats?.totalCourses || '—'} courses</div>
                    </div>
                  </div>

                  {}
                  <div className={`relative group rounded-2xl overflow-hidden bg-gradient-to-br ${(fullStats?.overdueEnrollments || 0) > 0 ? 'from-red-500/[0.15] to-red-500/[0.05] border-red-500/30 hover:border-red-400/50' : 'from-green-500/[0.1] to-green-500/[0.02] border-green-500/20 hover:border-green-400/40'} backdrop-blur-xl border transition-all duration-300 p-5`}>
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                    <div className={`absolute -top-10 -right-10 w-24 h-24 ${(fullStats?.overdueEnrollments || 0) > 0 ? 'bg-red-500/20' : 'bg-green-500/10'} rounded-full blur-2xl`} />
                    <div className="relative">
                      <div className="flex items-center gap-2 text-zinc-400 text-xs mb-2">
                        <AlertTriangle size={14} className={(fullStats?.overdueEnrollments || 0) > 0 ? 'text-red-400' : 'text-green-400'} />
                        Overdue
                      </div>
                      <div className={`text-3xl font-helvetica-bold ${(fullStats?.overdueEnrollments || 0) > 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {fullStats?.overdueEnrollments ?? 0}
                      </div>
                      <div className={`text-xs mt-1 ${(fullStats?.overdueEnrollments || 0) > 0 ? 'text-red-400/70' : 'text-green-400/70'}`}>
                        {(fullStats?.overdueEnrollments || 0) > 0 ? 'Need attention' : 'All on track'}
                      </div>
                    </div>
                  </div>
                </div>

                {}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {}
                  <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.1] p-6">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
                    <div className="flex justify-between items-center mb-5">
                      <div>
                        <h3 className="text-xl font-helvetica-bold flex items-center gap-2">
                          <Trophy size={20} className="text-[#D4AF37]" />
                          Ministry Performance
                        </h3>
                        <p className="text-zinc-500 text-xs mt-1">Ranked by completion rate</p>
                      </div>
                      {selectedMinistry && (
                        <button
                          type="button"
                          onClick={() => setSelectedMinistry(null)}
                          className="text-sm text-[#D4AF37] hover:text-yellow-300 flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 transition-all"
                        >
                          <ArrowLeft size={14} /> All Ministries
                        </button>
                      )}
                    </div>

                    {!selectedMinistry ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {ministryStats.length > 0 ? [...ministryStats]
                          .sort((a, b) => {
                            const rateA = a.totalLearners > 0 ? (a.coursesCompleted / a.totalLearners) * 100 : 0;
                            const rateB = b.totalLearners > 0 ? (b.coursesCompleted / b.totalLearners) * 100 : 0;
                            return rateB - rateA;
                          })
                          .map((ministry, idx) => {
                            const completionRate = ministry.totalLearners > 0 ? Math.round((ministry.coursesCompleted / ministry.totalLearners) * 100) : 0;
                            const isTop3 = idx < 3;
                            return (
                              <button
                                type="button"
                                key={idx}
                                onClick={() => setSelectedMinistry(ministry.name)}
                                className={`w-full p-4 rounded-xl bg-gradient-to-r ${isTop3 ? 'from-[#D4AF37]/10 to-transparent border-[#D4AF37]/20' : 'from-white/5 to-transparent border-white/10'} border hover:border-[#D4AF37]/40 hover:from-[#D4AF37]/15 transition-all text-left group`}
                              >
                                <div className="flex items-center gap-4">
                                  {}
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-helvetica-bold ${
                                    idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black' :
                                    idx === 1 ? 'bg-gradient-to-br from-zinc-300 to-zinc-500 text-black' :
                                    idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white' :
                                    'bg-white/10 text-zinc-400'
                                  }`}>
                                    {idx + 1}
                                  </div>

                                  {}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-white truncate group-hover:text-[#D4AF37] transition-colors">{ministry.name}</span>
                                      {ministry.overdueCount > 0 && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500/20 text-red-400 border border-red-500/30">
                                          {ministry.overdueCount} overdue
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-zinc-500">
                                      <span>{ministry.totalLearners} learners</span>
                                      <span>{ministry.activeLearners || 0} active</span>
                                      <span>Avg: {ministry.avgQuizScore || 0}%</span>
                                    </div>
                                  </div>

                                  {}
                                  <div className="text-right">
                                    <div className={`text-2xl font-helvetica-bold ${completionRate >= 70 ? 'text-green-400' : completionRate >= 40 ? 'text-[#D4AF37]' : 'text-zinc-400'}`}>
                                      {completionRate}%
                                    </div>
                                    <div className="text-xs text-zinc-500">{ministry.coursesCompleted} completed</div>
                                  </div>

                                  <ChevronRight size={16} className="text-zinc-600 group-hover:text-[#D4AF37] transition-colors" />
                                </div>

                                {}
                                <div className="h-1 bg-white/10 rounded-full overflow-hidden mt-3">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${completionRate >= 70 ? 'bg-gradient-to-r from-green-500 to-green-400' : completionRate >= 40 ? 'bg-gradient-to-r from-[#D4AF37] to-yellow-400' : 'bg-zinc-600'}`}
                                    style={{ width: `${completionRate}%` }}
                                  />
                                </div>
                              </button>
                            );
                          }) : (
                          <div className="text-center text-zinc-500 py-8">No ministry data available yet</div>
                        )}
                      </div>
                    ) : (
                      
                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                        <div className="text-sm text-zinc-400 mb-4 flex items-center gap-2">
                          <Building2 size={16} className="text-[#D4AF37]" />
                          {selectedMinistry} — Per-Course Performance
                        </div>
                        {ministryCourseStats.length > 0 ? ministryCourseStats.map((stat, idx) => (
                          <div key={idx} className="p-4 rounded-xl bg-gradient-to-r from-white/5 to-transparent border border-white/10 hover:border-white/20 transition-all">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <div className="font-medium text-white">{stat.courseTitle}</div>
                                <div className="text-xs text-zinc-500 mt-0.5">{stat.enrolledCount} enrolled from this ministry</div>
                              </div>
                              <div className="flex gap-2">
                                {stat.overdueCount > 0 && (
                                  <span className="px-2 py-1 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
                                    {stat.overdueCount} overdue
                                  </span>
                                )}
                                <span className={`px-2 py-1 rounded-full text-xs ${stat.completionRate >= 70 ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-[#D4AF37]/20 text-[#D4AF37] border border-[#D4AF37]/30'}`}>
                                  {stat.completionRate}% complete
                                </span>
                              </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-center bg-black/20 rounded-lg p-3">
                              <div>
                                <div className="text-xl font-helvetica-bold text-green-400">{stat.completedCount}</div>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Completed</div>
                              </div>
                              <div>
                                <div className="text-xl font-helvetica-bold text-[#D4AF37]">{stat.enrolledCount - stat.completedCount}</div>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">In Progress</div>
                              </div>
                              <div>
                                <div className="text-xl font-helvetica-bold text-white">{stat.avgScore}%</div>
                                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Avg Score</div>
                              </div>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-3">
                              <div
                                className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                                style={{ width: `${stat.completionRate}%` }}
                              />
                            </div>
                          </div>
                        )) : (
                          <div className="text-center text-zinc-500 py-8">No course data available for this ministry</div>
                        )}
                      </div>
                    )}
                  </div>

                  {}
                  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.1] p-6">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                    <h3 className="text-xl font-helvetica-bold flex items-center gap-2 mb-5">
                      <Target size={20} className="text-blue-400" />
                      Quiz Analytics
                    </h3>

                    {}
                    <div className="relative h-44 flex items-center justify-center mb-6">
                      <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 180 180">
                        {}
                        <circle
                          cx="90" cy="90" r="70"
                          stroke="rgba(255,255,255,0.06)"
                          strokeWidth="14"
                          fill="none"
                        />
                        {}
                        {[0, 25, 50, 75, 100].map((tick) => (
                          <circle
                            key={tick}
                            cx="90" cy="90" r="70"
                            stroke="rgba(255,255,255,0.12)"
                            strokeWidth="14"
                            fill="none"
                            strokeDasharray={`1 ${4.4 * 100 - 1}`}
                            strokeDashoffset={-tick * 4.4}
                          />
                        ))}
                        {}
                        <circle
                          cx="90" cy="90" r="70"
                          stroke="url(#enhancedGaugeGradient)"
                          strokeWidth="14"
                          fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${(fullStats?.quizPassRate || 0) * 4.4} 440`}
                          className="transition-all duration-1000 ease-out"
                          style={{ filter: 'drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))' }}
                        />
                        <defs>
                          <linearGradient id="enhancedGaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#2563EB" />
                            <stop offset="50%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#60A5FA" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-5xl font-helvetica-bold text-white drop-shadow-[0_2px_10px_rgba(59,130,246,0.3)]">
                          {fullStats?.quizPassRate ?? '—'}%
                        </span>
                        <span className="text-xs text-blue-400 font-medium tracking-wider uppercase mt-1">Pass Rate</span>
                      </div>
                    </div>

                    {}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                            <Award size={16} className="text-blue-400" />
                          </div>
                          <span className="text-sm text-zinc-300">Average Score</span>
                        </div>
                        <span className="text-lg font-helvetica-bold text-white">{fullStats?.averageQuizScore ?? '—'}%</span>
                      </div>
                      <div className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                            <TrendingUp size={16} className="text-green-400" />
                          </div>
                          <span className="text-sm text-zinc-300">Top Ministry Avg</span>
                        </div>
                        <span className="text-lg font-helvetica-bold text-green-400">
                          {(() => {
                            const scores = ministryStats.filter(m => m.avgQuizScore > 0).map(m => m.avgQuizScore);
                            return scores.length > 0 ? Math.max(...scores) : '—';
                          })()}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center">
                            <AlertTriangle size={16} className="text-red-400" />
                          </div>
                          <span className="text-sm text-zinc-300">Lowest Ministry Avg</span>
                        </div>
                        <span className="text-lg font-helvetica-bold text-red-400">
                          {(() => {
                            const scores = ministryStats.filter(m => m.avgQuizScore > 0).map(m => m.avgQuizScore);
                            return scores.length > 0 ? Math.min(...scores) : '—';
                          })()}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {}
                  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.1] p-6">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#D4AF37]/30 to-transparent" />
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-helvetica-bold flex items-center gap-2">
                        <BarChart3 size={20} className="text-[#D4AF37]" />
                        Learner Distribution
                      </h3>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={ministryStats.length > 0 ? ministryStats.map((m, i) => ({
                            name: m.name?.length > 15 ? m.name.split(' ').map((w: string) => w[0]).join('').substring(0, 6) : m.name?.substring(0, 12) || `M${i + 1}`,
                            fullName: m.name,
                            total: m.totalLearners,
                            active: m.activeLearners || 0,
                            completed: m.coursesCompleted
                          })) : []}
                          barSize={20}
                          barGap={4}
                        >
                          <defs>
                            <linearGradient id="analyticsBarGold" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#F5D76E" stopOpacity={1} />
                              <stop offset="50%" stopColor="#D4AF37" stopOpacity={1} />
                              <stop offset="100%" stopColor="#B8962E" stopOpacity={0.9} />
                            </linearGradient>
                            <linearGradient id="analyticsBarGreen" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#4ADE80" stopOpacity={1} />
                              <stop offset="50%" stopColor="#22C55E" stopOpacity={1} />
                              <stop offset="100%" stopColor="#16A34A" stopOpacity={0.9} />
                            </linearGradient>
                            <filter id="analyticsBarGlow">
                              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                              <feMerge>
                                <feMergeNode in="coloredBlur"/>
                                <feMergeNode in="SourceGraphic"/>
                              </feMerge>
                            </filter>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                          <XAxis
                            dataKey="name"
                            stroke="#52525b"
                            tick={{ fontSize: 10, fill: '#71717a' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                            tickLine={false}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis
                            stroke="#52525b"
                            tick={{ fontSize: 10, fill: '#71717a' }}
                            axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                            tickLine={false}
                            width={35}
                          />
                          <Tooltip
                            cursor={{ fill: 'rgba(212, 175, 55, 0.08)', radius: 8 }}
                            contentStyle={{
                              backgroundColor: 'rgba(9, 9, 11, 0.98)',
                              border: '1px solid rgba(212, 175, 55, 0.4)',
                              borderRadius: '16px',
                              boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(212, 175, 55, 0.15)',
                              backdropFilter: 'blur(20px)',
                              padding: '12px 16px'
                            }}
                            labelStyle={{ color: '#D4AF37', fontWeight: '700', marginBottom: '8px', fontSize: '13px' }}
                            itemStyle={{ color: '#e4e4e7', fontSize: '12px', padding: '2px 0' }}
                            formatter={(value: number, name: string) => [value.toLocaleString(), name === 'total' ? 'Total Learners' : name === 'active' ? 'Active Now' : 'Completed']}
                            labelFormatter={(label: string, payload: any[]) => payload[0]?.payload?.fullName || label}
                          />
                          <Bar dataKey="total" name="Total" radius={[6, 6, 0, 0]} fill="url(#analyticsBarGold)" filter="url(#analyticsBarGlow)" />
                          <Bar dataKey="active" name="Active" radius={[6, 6, 0, 0]} fill="url(#analyticsBarGreen)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-8 mt-5 text-xs">
                      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                        <div className="w-3 h-3 rounded-md bg-gradient-to-b from-[#F5D76E] to-[#B8962E] shadow-sm shadow-[#D4AF37]/30" />
                        <span className="text-zinc-300 font-medium">Total Learners</span>
                      </div>
                      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="w-3 h-3 rounded-md bg-gradient-to-b from-[#4ADE80] to-[#16A34A] shadow-sm shadow-green-500/30" />
                        <span className="text-zinc-300 font-medium">Active Learners</span>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.1] p-6">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
                    <h3 className="text-xl font-helvetica-bold flex items-center gap-2 mb-6">
                      <PieChartIcon size={20} className="text-purple-400" />
                      Content Library
                    </h3>
                    <div className="h-56 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <defs>
                            <linearGradient id="analyticsPieGold" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#F5D76E" />
                              <stop offset="100%" stopColor="#B8962E" />
                            </linearGradient>
                            <linearGradient id="analyticsPieBlue" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#60A5FA" />
                              <stop offset="100%" stopColor="#2563EB" />
                            </linearGradient>
                            <linearGradient id="analyticsPiePurple" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#A78BFA" />
                              <stop offset="100%" stopColor="#7C3AED" />
                            </linearGradient>
                            <linearGradient id="analyticsPieGreen" x1="0" y1="0" x2="1" y2="1">
                              <stop offset="0%" stopColor="#4ADE80" />
                              <stop offset="100%" stopColor="#16A34A" />
                            </linearGradient>
                            <filter id="analyticsPieGlow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="blur"/>
                              <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                            </filter>
                          </defs>
                          <Pie
                            data={contentStats.length > 0 ? contentStats : [
                              { name: 'Video', value: 45 },
                              { name: 'PDF', value: 30 },
                              { name: 'Quiz', value: 25 },
                            ]}
                            innerRadius={60}
                            outerRadius={88}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="rgba(9, 9, 11, 0.9)"
                            strokeWidth={3}
                          >
                            {(contentStats.length > 0 ? contentStats : [1, 2, 3, 4]).map((_, index) => (
                              <Cell
                                key={`analytics-cell-${index}`}
                                fill={['url(#analyticsPieGold)', 'url(#analyticsPieBlue)', 'url(#analyticsPiePurple)', 'url(#analyticsPieGreen)'][index % 4]}
                                filter="url(#analyticsPieGlow)"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(9, 9, 11, 0.98)',
                              border: '1px solid rgba(168, 85, 247, 0.4)',
                              borderRadius: '16px',
                              padding: '12px 16px',
                              boxShadow: '0 20px 60px rgba(0,0,0,0.7), 0 0 40px rgba(168, 85, 247, 0.15)',
                              backdropFilter: 'blur(20px)'
                            }}
                            itemStyle={{ color: '#e4e4e7', fontWeight: '600', fontSize: '13px' }}
                            labelStyle={{ color: '#A78BFA', marginBottom: '6px', fontWeight: '700', fontSize: '14px' }}
                            formatter={(value: number, name: string) => [`${value} lessons`, '']}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-4xl font-helvetica-bold text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]">{fullStats?.totalLessons || '—'}</span>
                        <span className="text-xs text-zinc-400 font-medium tracking-wide">Total Lessons</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5 mt-5">
                      {(contentStats.length > 0 ? contentStats : [
                        { name: 'Video', count: '—' },
                        { name: 'PDF', count: '—' },
                        { name: 'Quiz', count: '—' },
                        { name: 'Text', count: '—' },
                      ]).map((c, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.1] transition-all duration-200">
                          <div
                            className="w-2.5 h-2.5 rounded-md shadow-lg"
                            style={{
                              background: ['linear-gradient(135deg, #F5D76E, #B8962E)', 'linear-gradient(135deg, #60A5FA, #2563EB)', 'linear-gradient(135deg, #A78BFA, #7C3AED)', 'linear-gradient(135deg, #4ADE80, #16A34A)'][idx % 4],
                              boxShadow: [`0 0 8px rgba(212, 175, 55, 0.4)`, `0 0 8px rgba(59, 130, 246, 0.4)`, `0 0 8px rgba(139, 92, 246, 0.4)`, `0 0 8px rgba(34, 197, 94, 0.4)`][idx % 4]
                            }}
                          />
                          <span className="text-xs text-zinc-400">{c.name}</span>
                          <span className="text-xs font-bold text-white ml-auto">{c.count || c.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {}
                {(fullStats?.overdueEnrollments || 0) > 0 && overdueLearners.length > 0 && (
                  <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-red-500/[0.1] to-red-500/[0.02] backdrop-blur-xl border border-red-500/20 p-6">
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
                    <div className="flex justify-between items-center mb-5">
                      <h3 className="text-xl font-helvetica-bold flex items-center gap-2 text-red-400">
                        <AlertTriangle size={20} />
                        Compliance Alert — Overdue Learners
                      </h3>
                      <span className="px-3 py-1 rounded-full text-sm bg-red-500/20 text-red-400 border border-red-500/30">
                        {overdueLearners.length} learners need attention
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {overdueLearners.slice(0, 6).map((learner, idx) => (
                        <div key={idx} className="p-4 rounded-xl bg-black/30 border border-red-500/20 hover:border-red-500/40 transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-medium text-white">{learner.name}</div>
                              <div className="text-xs text-zinc-500">{learner.ministry}</div>
                            </div>
                            <span className="px-2 py-1 rounded-full text-xs bg-red-500/30 text-red-400">
                              {learner.daysOverdue}d overdue
                            </span>
                          </div>
                          <div className="text-sm text-zinc-400 truncate">{learner.course}</div>
                        </div>
                      ))}
                    </div>
                    {overdueLearners.length > 6 && (
                      <div className="text-center mt-4">
                        <span className="text-sm text-zinc-500">+{overdueLearners.length - 6} more overdue learners</span>
                      </div>
                    )}
                  </div>
                )}

                {}
                <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-xl border border-white/[0.1] p-6">
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-green-500/30 to-transparent" />
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-helvetica-bold flex items-center gap-2">
                      <TrendingUp size={20} className="text-green-400" />
                      Ministry Quiz Performance
                    </h3>
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-green-500 to-green-400 shadow-sm shadow-green-500/40" />
                        <span className="text-zinc-500">≥80%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-yellow-400 shadow-sm shadow-[#D4AF37]/40" />
                        <span className="text-zinc-500">60-79%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-red-500 to-red-400 shadow-sm shadow-red-500/40" />
                        <span className="text-zinc-500">&lt;60%</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {ministryStats.length > 0 ? [...ministryStats]
                      .sort((a, b) => (b.avgQuizScore || 0) - (a.avgQuizScore || 0))
                      .map((ministry, idx) => {
                        const score = ministry.avgQuizScore || 0;
                        const isTop3 = idx < 3;
                        return (
                          <div
                            key={idx}
                            className={`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${isTop3 ? 'bg-white/[0.04] border border-white/[0.06]' : 'hover:bg-white/[0.02]'}`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                              idx === 0 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-black shadow-lg shadow-yellow-500/30' :
                              idx === 1 ? 'bg-gradient-to-br from-zinc-300 to-zinc-500 text-black shadow-lg shadow-zinc-400/20' :
                              idx === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-800 text-white shadow-lg shadow-amber-600/20' :
                              'bg-white/10 text-zinc-500'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="w-44 truncate text-sm text-zinc-300 font-medium">{ministry.name}</div>
                            <div className="flex-1 h-7 bg-white/[0.04] rounded-lg overflow-hidden relative border border-white/[0.06]">
                              <div
                                className={`h-full rounded-lg transition-all duration-1000 ease-out ${
                                  score >= 80 ? 'bg-gradient-to-r from-green-600 via-green-500 to-green-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]' :
                                  score >= 60 ? 'bg-gradient-to-r from-[#B8962E] via-[#D4AF37] to-yellow-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]' :
                                  'bg-gradient-to-r from-red-700 via-red-500 to-red-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]'
                                }`}
                                style={{ width: `${Math.max(score, 5)}%` }}
                              />
                              <div className="absolute inset-0 flex items-center justify-between px-3">
                                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                                  {score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : 'Needs Work'}
                                </span>
                                <span className={`text-sm font-bold ${score >= 80 ? 'text-green-400' : score >= 60 ? 'text-[#D4AF37]' : 'text-red-400'}`}>
                                  {score}%
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      }) : (
                      <div className="text-center text-zinc-500 py-8">No quiz data available yet</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </PageTransition>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="font-helvetica text-slate-50 min-h-screen flex items-center justify-center bg-[#0a0a0b]">
        <Loader2 className="animate-spin text-[#D4AF37]" size={48} />
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="font-helvetica text-slate-50 selection:bg-yellow-400/30 h-screen overflow-hidden animate-page-entrance">
        {}
        {(currentView === 'LANDING' || currentView === 'AUTH' || currentView === 'WALKTHROUGH' || currentView === 'INFO_BAJANX' || currentView === 'INFO_BRIDGE' || currentView === 'INFO_CHATBB' || currentView === 'INFO_API_PUBLISHING' || currentView === 'INFO_CERTIFICATION' || currentView === 'INFO_FAQS') ? <LandingBackground /> : <LiquidBackground />}

        {}
        {(currentView === 'DASHBOARD' || currentView === 'ADMIN' || currentView === 'OFFICE_HOURS') && <Sidebar />}

        {}
        <main className="h-screen overflow-hidden relative">
          <AnimatePresence mode="wait">
            {currentView === 'LANDING' && (
              <PageTransition key="landing">
                <LandingView />
              </PageTransition>
            )}
            {currentView === 'AUTH' && (
              <PageTransition key="auth">
                <AuthView />
              </PageTransition>
            )}
            {currentView === 'DASHBOARD' && (
              <PageTransition key="dashboard">
                <DashboardView />
              </PageTransition>
            )}
            {currentView === 'COURSE_PLAYER' && (
              <PageTransition key="player">
                <PlayerView />
              </PageTransition>
            )}
            {currentView === 'ADMIN' && (
              <PageTransition key="admin">
                <AdminView />
              </PageTransition>
            )}
            {currentView === 'WALKTHROUGH' && (
              <PageTransition key="walkthrough">
                <WalkthroughView />
              </PageTransition>
            )}
            {currentView === 'OFFICE_HOURS' && (
              <PageTransition key="office-hours">
                <OfficeHoursView />
              </PageTransition>
            )}
            {currentView === 'INFO_BAJANX' && (
              <PageTransition key="info-bajanx">
                <BajanXInfoView />
              </PageTransition>
            )}
            {currentView === 'INFO_BRIDGE' && (
              <PageTransition key="info-bridge">
                <BridgeInfoView />
              </PageTransition>
            )}
            {currentView === 'INFO_CHATBB' && (
              <PageTransition key="info-chatbb">
                <ChatBBInfoView />
              </PageTransition>
            )}
            {currentView === 'INFO_API_PUBLISHING' && (
              <PageTransition key="info-api-publishing">
                <APIPublishingInfoView />
              </PageTransition>
            )}
            {currentView === 'INFO_CERTIFICATION' && (
              <PageTransition key="info-certification">
                <CertificationInfoView />
              </PageTransition>
            )}
            {currentView === 'INFO_FAQS' && (
              <PageTransition key="info-faqs">
                <FAQsInfoView />
              </PageTransition>
            )}
          </AnimatePresence>
        </main>
      </div>
    </ToastProvider>
  );
};

export default App;