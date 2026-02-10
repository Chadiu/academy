import { Course, CourseStatus, UserRole, User, LearningPath } from './types';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Sarah Jenkins',
  email: 'sarah.j@gov.bb',
  role: UserRole.LEARNER,
  ministry: 'Ministry of Innovation',
  enrolledCourses: ['c1'],
  completedPaths: []
};

export const MOCK_COURSES: Course[] = [
  
  {
    id: 'bx1',
    title: 'BX1: Introduction to APIs',
    description: 'What is an API? Why do we use APIs? Real-world examples of APIs in government services.',
    thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop',
    level: 'Beginner',
    totalDuration: '45-60 min',
    status: CourseStatus.NOT_STARTED,
    progress: 0,
    enrolledCount: 1240,
    rating: 4.8,
    lessons: [
      { id: 'bx1-l1', title: 'What is an API?', type: 'video', durationMin: 10, isCompleted: false },
      { id: 'bx1-l2', title: 'Real-World API Examples', type: 'pdf', durationMin: 15, isCompleted: false },
      { id: 'bx1-l3', title: 'APIs in Government Services', type: 'video', durationMin: 15, isCompleted: false },
      { id: 'bx1-l4', title: 'Module Quiz', type: 'quiz', durationMin: 10, quiz: [
        { id: 'bx1-q1', question: 'What does API stand for?', options: ['Application Programming Interface', 'Automated Protocol Interface', 'Application Process Integration'], correctAnswer: 0 }
      ], isCompleted: false }
    ]
  },
  {
    id: 'bx2',
    title: 'BX2: Understanding RESTful APIs',
    description: 'HTTP methods (GET, POST, PUT, DELETE), status codes, request/response structure.',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop',
    level: 'Beginner',
    totalDuration: '60-90 min',
    status: CourseStatus.NOT_STARTED,
    progress: 0,
    enrolledCount: 1100,
    rating: 4.7,
    lessons: [
      { id: 'bx2-l1', title: 'Introduction to REST', type: 'video', durationMin: 15, isCompleted: false },
      { id: 'bx2-l2', title: 'HTTP Methods Deep Dive', type: 'pdf', durationMin: 20, isCompleted: false },
      { id: 'bx2-l3', title: 'Status Codes Explained', type: 'video', durationMin: 15, isCompleted: false },
      { id: 'bx2-l4', title: 'Request/Response Structure', type: 'presentation', durationMin: 20, isCompleted: false },
      { id: 'bx2-l5', title: 'Module Quiz', type: 'quiz', durationMin: 10, quiz: [
        { id: 'bx2-q1', question: 'Which HTTP method is used to retrieve data?', options: ['GET', 'POST', 'DELETE'], correctAnswer: 0 }
      ], isCompleted: false }
    ]
  },
  {
    id: 'bx3',
    title: 'BX3: Hands-On with Postman',
    description: 'Setting up Postman, making your first API call, testing endpoints practically.',
    thumbnail: 'https://images.unsplash.com/photo-1531746790731-6c087fecd65a?q=80&w=2006&auto=format&fit=crop',
    level: 'Beginner',
    totalDuration: '60-90 min',
    status: CourseStatus.NOT_STARTED,
    progress: 0,
    enrolledCount: 980,
    rating: 4.9,
    lessons: [
      { id: 'bx3-l1', title: 'Installing Postman', type: 'video', durationMin: 10, isCompleted: false },
      { id: 'bx3-l2', title: 'Making Your First API Call', type: 'video', durationMin: 20, isCompleted: false },
      { id: 'bx3-l3', title: 'Testing Different Endpoints', type: 'pdf', durationMin: 25, isCompleted: false },
      { id: 'bx3-l4', title: 'Hands-On Exercise', type: 'quiz', durationMin: 20, quiz: [
        { id: 'bx3-q1', question: 'What is Postman primarily used for?', options: ['Testing APIs', 'Writing code', 'Database management'], correctAnswer: 0 }
      ], isCompleted: false }
    ]
  },
  {
    id: 'bx4',
    title: 'BX4: Reading API Documentation',
    description: 'Understanding API docs, field definitions, response formats, and error handling.',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2070&auto=format&fit=crop',
    level: 'Beginner',
    totalDuration: '60-90 min',
    status: CourseStatus.NOT_STARTED,
    progress: 0,
    enrolledCount: 850,
    rating: 4.6,
    lessons: [
      { id: 'bx4-l1', title: 'Anatomy of API Documentation', type: 'video', durationMin: 15, isCompleted: false },
      { id: 'bx4-l2', title: 'Understanding Field Definitions', type: 'pdf', durationMin: 20, isCompleted: false },
      { id: 'bx4-l3', title: 'Response Formats (JSON/XML)', type: 'video', durationMin: 20, isCompleted: false },
      { id: 'bx4-l4', title: 'Error Handling Best Practices', type: 'presentation', durationMin: 15, isCompleted: false },
      { id: 'bx4-l5', title: 'Module Quiz', type: 'quiz', durationMin: 10, quiz: [
        { id: 'bx4-q1', question: 'What format is most commonly used for API responses?', options: ['JSON', 'CSV', 'TXT'], correctAnswer: 0 }
      ], isCompleted: false }
    ]
  },

  {
    id: 'bx5',
    title: 'BX5: Authentication & Security',
    description: 'API keys, OAuth basics, securing your API requests, best practices for government data.',
    thumbnail: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=2070&auto=format&fit=crop',
    level: 'Intermediate',
    totalDuration: '90-120 min',
    status: CourseStatus.NOT_STARTED,
    progress: 0,
    enrolledCount: 720,
    rating: 4.8,
    lessons: [
      { id: 'bx5-l1', title: 'API Keys Explained', type: 'video', durationMin: 15, isCompleted: false },
      { id: 'bx5-l2', title: 'Introduction to OAuth', type: 'video', durationMin: 25, isCompleted: false },
      { id: 'bx5-l3', title: 'Securing API Requests', type: 'pdf', durationMin: 20, isCompleted: false },
      { id: 'bx5-l4', title: 'Government Data Security Standards', type: 'presentation', durationMin: 25, isCompleted: false },
      { id: 'bx5-l5', title: 'Security Quiz', type: 'quiz', durationMin: 15, quiz: [
        { id: 'bx5-q1', question: 'What is OAuth used for?', options: ['Authorization', 'Database queries', 'File storage'], correctAnswer: 0 }
      ], isCompleted: false }
    ]
  },
  {
    id: 'bx6',
    title: 'BX6: Connecting to Bajan-X APIs',
    description: 'Overview of Bajan-X platform, available endpoints, making authenticated calls.',
    thumbnail: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2034&auto=format&fit=crop',
    level: 'Intermediate',
    totalDuration: '90-120 min',
    status: CourseStatus.NOT_STARTED,
    progress: 0,
    enrolledCount: 680,
    rating: 4.7,
    lessons: [
      { id: 'bx6-l1', title: 'Bajan-X Platform Overview', type: 'video', durationMin: 20, isCompleted: false },
      { id: 'bx6-l2', title: 'Available API Endpoints', type: 'pdf', durationMin: 25, isCompleted: false },
      { id: 'bx6-l3', title: 'Getting Your API Credentials', type: 'video', durationMin: 15, isCompleted: false },
      { id: 'bx6-l4', title: 'Making Authenticated Calls', type: 'video', durationMin: 25, isCompleted: false },
      { id: 'bx6-l5', title: 'Hands-On: Your First Bajan-X Call', type: 'quiz', durationMin: 20, quiz: [
        { id: 'bx6-q1', question: 'What do you need to make authenticated API calls?', options: ['API credentials', 'Admin access', 'Physical token'], correctAnswer: 0 }
      ], isCompleted: false }
    ]
  },

  {
    id: 'bx7',
    title: 'BX7: Data Integration Workflows',
    description: 'Combining multiple API calls, data transformation, building automated workflows.',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop',
    level: 'Advanced',
    totalDuration: '120-150 min',
    status: CourseStatus.NOT_STARTED,
    progress: 0,
    enrolledCount: 450,
    rating: 4.9,
    lessons: [
      { id: 'bx7-l1', title: 'Multi-API Workflow Design', type: 'video', durationMin: 25, isCompleted: false },
      { id: 'bx7-l2', title: 'Data Transformation Techniques', type: 'pdf', durationMin: 30, isCompleted: false },
      { id: 'bx7-l3', title: 'Building Automated Pipelines', type: 'video', durationMin: 30, isCompleted: false },
      { id: 'bx7-l4', title: 'Error Handling in Workflows', type: 'presentation', durationMin: 20, isCompleted: false },
      { id: 'bx7-l5', title: 'Capstone Project: Integration Workflow', type: 'quiz', durationMin: 30, quiz: [
        { id: 'bx7-q1', question: 'What is data transformation?', options: ['Converting data format/structure', 'Deleting data', 'Copying data'], correctAnswer: 0 }
      ], isCompleted: false }
    ]
  },
  {
    id: 'bx8',
    title: 'BX8: Capstone & Certification',
    description: 'Final project applying all skills, certification exam, becoming a Bajan-X champion.',
    thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=2070&auto=format&fit=crop',
    level: 'Advanced',
    totalDuration: '150-180 min',
    status: CourseStatus.NOT_STARTED,
    progress: 0,
    enrolledCount: 320,
    rating: 5.0,
    lessons: [
      { id: 'bx8-l1', title: 'Capstone Project Brief', type: 'pdf', durationMin: 15, isCompleted: false },
      { id: 'bx8-l2', title: 'Project Implementation Guide', type: 'video', durationMin: 45, isCompleted: false },
      { id: 'bx8-l3', title: 'Best Practices Review', type: 'presentation', durationMin: 30, isCompleted: false },
      { id: 'bx8-l4', title: 'Final Certification Exam', type: 'quiz', durationMin: 45, quiz: [
        { id: 'bx8-q1', question: 'Which HTTP status code indicates success?', options: ['200', '404', '500'], correctAnswer: 0 },
        { id: 'bx8-q2', question: 'What is the main purpose of API authentication?', options: ['Security', 'Speed', 'Storage'], correctAnswer: 0 }
      ], isCompleted: false },
      { id: 'bx8-l5', title: 'Certification & Next Steps', type: 'video', durationMin: 15, isCompleted: false }
    ]
  }
];

export const MOCK_PATHS: LearningPath[] = [
  {
    id: 'beginner',
    title: 'Beginner Track (Week 1-2)',
    description: 'Foundation modules for all learners. Complete all 4 courses to unlock Intermediate.',
    courseIds: ['bx1', 'bx2', 'bx3', 'bx4'],
    role: 'ALL'
  },
  {
    id: 'intermediate',
    title: 'Intermediate Track (Week 3)',
    description: 'Security and platform integration. Complete all Beginner courses first.',
    courseIds: ['bx5', 'bx6'],
    role: 'ALL'
  },
  {
    id: 'advanced',
    title: 'Advanced Track (Week 4)',
    description: 'Data workflows and certification. Complete all Intermediate courses first.',
    courseIds: ['bx7', 'bx8'],
    role: 'ALL'
  }
];

export const MINISTRY_STATS = [
  { name: 'Innovation', value: 85 },
  { name: 'Finance', value: 62 },
  { name: 'Education', value: 45 },
  { name: 'Health', value: 78 },
];

export const MINISTRIES = [
  'Ministry of Industry, Innovation, Science and Technology',
  'Ministry of Education and Science',
  'Business Barbados',
  'Trident ID',
  'Ministry of Energy',
  'Lands and Survey',
  'Ministry of Finance',
  'Ministry of Health',
  'Ministry of Transport',
  'Office of the Prime Minister'
];