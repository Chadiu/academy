import pool from './database.js';
import dotenv from 'dotenv';

dotenv.config();

const runMigrationV2 = async () => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('Running migration v2...');

    await client.query(`
      ALTER TABLE lessons
      ADD COLUMN IF NOT EXISTS passing_score INTEGER DEFAULT 70;
    `);
    console.log('Added passing_score to lessons table');

    await client.query(`
      ALTER TABLE courses
      ADD COLUMN IF NOT EXISTS deadline TIMESTAMP,
      ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT false;
    `);
    console.log('Added deadline and is_mandatory to courses table');

    await client.query(`
      ALTER TABLE enrollments
      ADD COLUMN IF NOT EXISTS deadline TIMESTAMP,
      ADD COLUMN IF NOT EXISTS is_overdue BOOLEAN DEFAULT false;
    `);
    console.log('Added deadline and is_overdue to enrollments table');

    await client.query(`
      ALTER TABLE lesson_progress
      ADD COLUMN IF NOT EXISTS passed BOOLEAN DEFAULT false;
    `);
    console.log('Added passed flag to lesson_progress table');

    await client.query(`
      CREATE TABLE IF NOT EXISTS ministry_course_stats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        ministry VARCHAR(255) NOT NULL,
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        enrolled_count INTEGER DEFAULT 0,
        completed_count INTEGER DEFAULT 0,
        avg_score DECIMAL(5,2) DEFAULT 0,
        overdue_count INTEGER DEFAULT 0,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(ministry, course_id)
      );
    `);
    console.log('Created ministry_course_stats table');

    await client.query(`
      ALTER TABLE courses
      ADD COLUMN IF NOT EXISTS prerequisite_course_id UUID REFERENCES courses(id);
    `);
    console.log('Added prerequisite_course_id to courses table');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_enrollments_deadline ON enrollments(deadline);
      CREATE INDEX IF NOT EXISTS idx_courses_deadline ON courses(deadline);
      CREATE INDEX IF NOT EXISTS idx_ministry_course_stats ON ministry_course_stats(ministry, course_id);
    `);
    console.log('Created performance indexes');

    await client.query('COMMIT');
    console.log('Migration v2 completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Migration v2 failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

runMigrationV2()
  .then(() => {
    console.log('Migration v2 completed');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration v2 failed:', err);
    process.exit(1);
  });
