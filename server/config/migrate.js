import pool from './database.js';
import dotenv from 'dotenv';

dotenv.config();

const createTables = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'LEARNER',
        ministry VARCHAR(255),
        avatar_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        is_active BOOLEAN DEFAULT true,
        -- Approval system fields
        is_approved BOOLEAN DEFAULT false,
        approved_by UUID,
        approved_at TIMESTAMP,
        rejection_reason TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS learning_paths (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        role_required VARCHAR(50) DEFAULT 'ALL',
        order_index INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title VARCHAR(255) NOT NULL,
        description TEXT,
        thumbnail_url VARCHAR(500),
        level VARCHAR(50) DEFAULT 'Beginner',
        total_duration VARCHAR(50),
        order_index INTEGER DEFAULT 0,
        is_published BOOLEAN DEFAULT false,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS learning_path_courses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        learning_path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        order_index INTEGER DEFAULT 0,
        UNIQUE(learning_path_id, course_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS lessons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        type VARCHAR(50) NOT NULL,
        duration_min INTEGER DEFAULT 0,
        order_index INTEGER DEFAULT 0,

        -- Video specific
        video_url VARCHAR(500),
        video_source VARCHAR(50),

        -- Document specific (PDF/PPT)
        file_url VARCHAR(500),
        file_name VARCHAR(255),
        file_size INTEGER,
        page_count INTEGER,
        is_external_link BOOLEAN DEFAULT false,

        -- Content
        content TEXT,

        is_published BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
        question TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_answer INTEGER NOT NULL,
        explanation TEXT,
        order_index INTEGER DEFAULT 0
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        UNIQUE(user_id, course_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        status VARCHAR(50) DEFAULT 'NOT_STARTED',
        progress_percent INTEGER DEFAULT 0,
        quiz_score INTEGER,
        quiz_attempts INTEGER DEFAULT 0,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        last_accessed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, lesson_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS path_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        learning_path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
        progress_percent INTEGER DEFAULT 0,
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP,
        UNIQUE(user_id, learning_path_id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS certificates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        course_id UUID REFERENCES courses(id),
        learning_path_id UUID REFERENCES learning_paths(id),
        certificate_type VARCHAR(50) NOT NULL,
        issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        certificate_url VARCHAR(500)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ministry_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ministry VARCHAR(255) NOT NULL,
        total_learners INTEGER DEFAULT 0,
        active_learners INTEGER DEFAULT 0,
        certified_learners INTEGER DEFAULT 0,
        avg_completion_rate DECIMAL(5,2) DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_ministry ON users(ministry);
      CREATE INDEX IF NOT EXISTS idx_lessons_course ON lessons(course_id);
      CREATE INDEX IF NOT EXISTS idx_progress_user ON lesson_progress(user_id);
      CREATE INDEX IF NOT EXISTS idx_progress_lesson ON lesson_progress(lesson_id);
      CREATE INDEX IF NOT EXISTS idx_enrollments_user ON enrollments(user_id);
    `);

    console.log('Checking for schema upgrades...');

    try {
      await client.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS deadline TIMESTAMP');
      await client.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT false');
      await client.query('ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisite_course_id UUID REFERENCES courses(id)');
    } catch (e) { console.log('Courses columns already exist or failed to add'); }

    try {
      await client.query('ALTER TABLE lessons ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 70');
    } catch (e) { console.log('Lessons columns already exist or failed to add'); }

    try {
      await client.query('ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS deadline TIMESTAMP');
      await client.query('ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT false');
    } catch (e) { console.log('Enrollments columns already exist or failed to add'); }

    try {
      await client.query('ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS passed BOOLEAN DEFAULT false');
    } catch (e) { console.log('Lesson progress columns already exist or failed to add'); }

    await client.query('COMMIT');
    console.log('All tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

createTables()
  .then(() => {
    console.log('Migration completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
  });
