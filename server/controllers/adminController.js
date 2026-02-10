import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

export const getDashboardStats = async (req, res) => {
  try {
    
    const learnersResult = await pool.query(
      `SELECT COUNT(*) as count FROM users WHERE role IN ('LEARNER', 'SUPERUSER')`
    );

    const coursesResult = await pool.query('SELECT COUNT(*) as count FROM courses');

    const lessonsResult = await pool.query('SELECT COUNT(*) as count FROM lessons');

    const enrollmentsResult = await pool.query('SELECT COUNT(*) as count FROM enrollments');

    const completedResult = await pool.query(
      'SELECT COUNT(*) as count FROM enrollments WHERE completed_at IS NOT NULL'
    );

    let overdueCount = 0;
    try {
      const overdueResult = await pool.query(`
        SELECT COUNT(*) as count FROM enrollments e
        LEFT JOIN courses c ON c.id = e.course_id
        WHERE e.completed_at IS NULL
          AND (e.deadline < NOW() OR (e.deadline IS NULL AND c.deadline < NOW()))
      `);
      overdueCount = parseInt(overdueResult.rows[0].count) || 0;
    } catch (e) {
      
      console.log('Deadline columns not available yet');
    }

    const totalEnrollments = parseInt(enrollmentsResult.rows[0].count);
    const completedEnrollments = parseInt(completedResult.rows[0].count);
    const completionRate = totalEnrollments > 0
      ? Math.round((completedEnrollments / totalEnrollments) * 100)
      : 0;

    const studyHoursResult = await pool.query(`
      SELECT COALESCE(SUM(l.duration_min), 0) / 60 as total_hours
      FROM lesson_progress lp
      JOIN lessons l ON l.id = lp.lesson_id
      WHERE lp.status = 'COMPLETED'
    `);

    const avgQuizResult = await pool.query(`
      SELECT AVG(quiz_score) as avg_score
      FROM lesson_progress
      WHERE quiz_score IS NOT NULL
    `);

    let quizPassRate = 0;
    try {
      const quizPassResult = await pool.query(`
        SELECT
          COUNT(CASE WHEN passed = true THEN 1 END) as passed,
          COUNT(*) as total
        FROM lesson_progress
        WHERE quiz_score IS NOT NULL
      `);

      quizPassRate = parseInt(quizPassResult.rows[0].total) > 0
        ? Math.round((parseInt(quizPassResult.rows[0].passed) / parseInt(quizPassResult.rows[0].total)) * 100)
        : 0;
    } catch (e) {
      console.log('Passed column not available yet, using score-based estimation');
      try {
        const fallbackResult = await pool.query(`
          SELECT
            COUNT(CASE WHEN quiz_score >= 70 THEN 1 END) as passed,
            COUNT(*) as total
          FROM lesson_progress
          WHERE quiz_score IS NOT NULL
        `);
        quizPassRate = parseInt(fallbackResult.rows[0].total) > 0
          ? Math.round((parseInt(fallbackResult.rows[0].passed) / parseInt(fallbackResult.rows[0].total)) * 100)
          : 0;
      } catch (innerError) {
        console.log('Fallback quiz pass calculation failed');
      }
    }

    res.json({
      stats: {
        totalLearners: parseInt(learnersResult.rows[0].count),
        totalCourses: parseInt(coursesResult.rows[0].count),
        totalLessons: parseInt(lessonsResult.rows[0].count),
        totalEnrollments: totalEnrollments,
        completionRate: completionRate,
        totalStudyHours: Math.round(parseFloat(studyHoursResult.rows[0].total_hours) || 0),
        overdueEnrollments: overdueCount,
        averageQuizScore: Math.round(parseFloat(avgQuizResult.rows[0].avg_score) || 0),
        quizPassRate: quizPassRate
      }
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({ error: 'Failed to get admin stats.' });
  }
};

export const getMinistryStats = async (req, res) => {
  try {
    
    const result = await pool.query(`
      SELECT
        u.ministry,
        COUNT(DISTINCT u.id) as total_learners,
        COUNT(DISTINCT CASE WHEN u.last_login > NOW() - INTERVAL '30 days' THEN u.id END) as active_learners,
        COUNT(DISTINCT CASE WHEN e.completed_at IS NOT NULL THEN e.id END) as courses_completed,
        0 as overdue_count,
        COALESCE(AVG(
          CASE WHEN lp.quiz_score IS NOT NULL THEN lp.quiz_score END
        ), 0) as avg_quiz_score
      FROM users u
      LEFT JOIN enrollments e ON e.user_id = u.id
      LEFT JOIN courses c ON c.id = e.course_id
      LEFT JOIN lesson_progress lp ON lp.user_id = u.id
      WHERE u.ministry IS NOT NULL AND u.role IN ('LEARNER', 'SUPERUSER')
      GROUP BY u.ministry
      ORDER BY total_learners DESC
    `);

    res.json({
      ministryStats: result.rows.map(row => ({
        name: row.ministry,
        totalLearners: parseInt(row.total_learners),
        activeLearners: parseInt(row.active_learners),
        coursesCompleted: parseInt(row.courses_completed),
        overdueCount: parseInt(row.overdue_count) || 0,
        avgQuizScore: Math.round(parseFloat(row.avg_quiz_score) || 0),
        value: parseInt(row.total_learners) 
      }))
    });
  } catch (error) {
    console.error('Get ministry stats error:', error);
    res.status(500).json({ error: 'Failed to get ministry stats.' });
  }
};

export const getMinistryCourseStats = async (req, res) => {
  try {
    const { ministry } = req.query;

    let whereClause = '';
    const params = [];

    if (ministry) {
      whereClause = 'WHERE u.ministry = $1';
      params.push(ministry);
    }

    const result = await pool.query(`
      SELECT
        u.ministry,
        c.id as course_id,
        c.title as course_title,
        COUNT(DISTINCT e.user_id) as enrolled_count,
        COUNT(DISTINCT CASE WHEN e.completed_at IS NOT NULL THEN e.user_id END) as completed_count,
        0 as overdue_count,
        COALESCE(AVG(lp.quiz_score), 0) as avg_score
      FROM users u
      JOIN enrollments e ON e.user_id = u.id
      JOIN courses c ON c.id = e.course_id
      LEFT JOIN lesson_progress lp ON lp.user_id = u.id AND lp.course_id = c.id
      ${whereClause || 'WHERE u.ministry IS NOT NULL'}
      GROUP BY u.ministry, c.id, c.title
      ORDER BY u.ministry, enrolled_count DESC
    `, params);

    res.json({
      ministryCourseStats: result.rows.map(row => ({
        ministry: row.ministry,
        courseId: row.course_id,
        courseTitle: row.course_title,
        enrolledCount: parseInt(row.enrolled_count),
        completedCount: parseInt(row.completed_count),
        overdueCount: parseInt(row.overdue_count) || 0,
        avgScore: Math.round(parseFloat(row.avg_score) || 0),
        completionRate: parseInt(row.enrolled_count) > 0
          ? Math.round((parseInt(row.completed_count) / parseInt(row.enrolled_count)) * 100)
          : 0
      }))
    });
  } catch (error) {
    console.error('Get ministry course stats error:', error);
    res.status(500).json({ error: 'Failed to get ministry course stats.' });
  }
};

export const getOverdueLearners = async (req, res) => {
  try {

    res.json({
      overdueLearners: []
    });
  } catch (error) {
    console.error('Get overdue learners error:', error);
    res.status(500).json({ error: 'Failed to get overdue learners.' });
  }
};

export const getContentStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        type,
        COUNT(*) as count
      FROM lessons
      GROUP BY type
    `);

    const total = result.rows.reduce((acc, row) => acc + parseInt(row.count), 0);

    res.json({
      contentStats: result.rows.map(row => ({
        name: row.type.charAt(0).toUpperCase() + row.type.slice(1),
        value: Math.round((parseInt(row.count) / total) * 100),
        count: parseInt(row.count)
      }))
    });
  } catch (error) {
    console.error('Get content stats error:', error);
    res.status(500).json({ error: 'Failed to get content stats.' });
  }
};

export const getUsers = async (req, res) => {
  try {
    
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { search, role, ministry } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (search) {
      whereClause += ` AND (name ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (role) {
      whereClause += ` AND role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    if (ministry) {
      whereClause += ` AND ministry = $${paramCount}`;
      params.push(ministry);
      paramCount++;
    }

    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );

    params.push(limit, offset);

    const usersResult = await pool.query(`
      SELECT id, email, name, role, ministry, created_at, last_login, is_active, is_approved
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `, params);

    res.json({
      users: usersResult.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(parseInt(countResult.rows[0].total) / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users.' });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, isActive } = req.body;

    const result = await pool.query(`
      UPDATE users
      SET role = COALESCE($1, role),
          is_active = COALESCE($2, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING id, email, name, role, ministry, is_active
    `, [role, isActive, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user.' });
  }
};

export const getRecentActivity = async (req, res) => {
  try {
    
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));

    const result = await pool.query(`
      SELECT
        lp.id,
        u.name as user_name,
        u.ministry,
        l.title as lesson_title,
        c.title as course_title,
        lp.status,
        lp.last_accessed
      FROM lesson_progress lp
      JOIN users u ON u.id = lp.user_id
      JOIN lessons l ON l.id = lp.lesson_id
      JOIN courses c ON c.id = lp.course_id
      ORDER BY lp.last_accessed DESC
      LIMIT $1
    `, [limit]);

    res.json({ activity: result.rows });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({ error: 'Failed to get recent activity.' });
  }
};

export const getCoursesWithStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        c.*,
        COUNT(DISTINCT e.user_id) as enrolled_count,
        COUNT(DISTINCT CASE WHEN e.completed_at IS NOT NULL THEN e.id END) as completed_count,
        0 as overdue_count,
        COUNT(DISTINCT l.id) as lesson_count,
        u.name as created_by_name
      FROM courses c
      LEFT JOIN enrollments e ON e.course_id = c.id
      LEFT JOIN lessons l ON l.course_id = c.id
      LEFT JOIN users u ON u.id = c.created_by
      GROUP BY c.id, u.name
      ORDER BY c.order_index ASC, c.created_at DESC
    `);

    res.json({
      courses: result.rows.map(c => ({
        id: c.id,
        title: c.title,
        description: c.description,
        thumbnail: c.thumbnail_url,
        level: c.level,
        totalDuration: c.total_duration,
        isPublished: c.is_published,
        isMandatory: c.is_mandatory,
        deadline: c.deadline,
        prerequisiteCourseId: c.prerequisite_course_id,
        enrolledCount: parseInt(c.enrolled_count),
        completedCount: parseInt(c.completed_count),
        overdueCount: parseInt(c.overdue_count) || 0,
        lessonCount: parseInt(c.lesson_count),
        createdBy: c.created_by_name,
        createdAt: c.created_at
      }))
    });
  } catch (error) {
    console.error('Get courses with stats error:', error);
    res.status(500).json({ error: 'Failed to get courses.' });
  }
};

export const setCourseDeadline = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { deadline, isMandatory, prerequisiteCourseId } = req.body;

    try {
      const result = await pool.query(`
        UPDATE courses
        SET deadline = $1,
            is_mandatory = COALESCE($2, is_mandatory),
            prerequisite_course_id = $3,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $4
        RETURNING id, title, deadline, is_mandatory, prerequisite_course_id
      `, [deadline || null, isMandatory, prerequisiteCourseId || null, courseId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Course not found.' });
      }

      if (deadline) {
        try {
          await pool.query(`
            UPDATE enrollments
            SET deadline = $1
            WHERE course_id = $2 AND deadline IS NULL AND completed_at IS NULL
          `, [deadline, courseId]);
        } catch (enrollErr) {
          console.log('Enrollment deadline column missing, skipping enrollment update');
        }
      }

      return res.json({
        message: 'Course deadline updated successfully',
        course: result.rows[0]
      });
    } catch (dbErr) {
      console.error('Database error while setting course deadline:', dbErr);
      if (dbErr.code === '42703') { 
        return res.status(400).json({ error: 'This feature (deadlines/mandatory status) is not supported by the current database schema.' });
      }
      throw dbErr;
    }
  } catch (error) {
    console.error('Set course deadline error:', error);
    res.status(500).json({ error: 'Failed to set course deadline.' });
  }
};

export const setEnrollmentDeadline = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const { deadline } = req.body;

    try {
      const result = await pool.query(`
        UPDATE enrollments
        SET deadline = $1,
            is_overdue = CASE WHEN $1 < NOW() THEN true ELSE false END
        WHERE id = $2
        RETURNING id, user_id, course_id, deadline, is_overdue
      `, [deadline, enrollmentId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Enrollment not found.' });
      }

      res.json({
        message: 'Enrollment deadline updated',
        enrollment: result.rows[0]
      });
    } catch (dbErr) {
      console.error('Database error while setting enrollment deadline:', dbErr);
      if (dbErr.code === '42703') {
        return res.status(400).json({ error: 'Direct enrollment deadlines are not supported by the current database schema.' });
      }
      throw dbErr;
    }
  } catch (error) {
    console.error('Set enrollment deadline error:', error);
    res.status(500).json({ error: 'Failed to set enrollment deadline.' });
  }
};

export const setLessonPassingScore = async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { passingScore } = req.body;

    if (passingScore < 0 || passingScore > 100) {
      return res.status(400).json({ error: 'Passing score must be between 0 and 100.' });
    }

    try {
      const result = await pool.query(`
        UPDATE lessons
        SET passing_score = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, title, type, passing_score
      `, [passingScore, lessonId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Lesson not found.' });
      }

      res.json({
        message: 'Lesson passing score updated',
        lesson: result.rows[0]
      });
    } catch (dbErr) {
      console.error('Database error while setting passing score:', dbErr);
      if (dbErr.code === '42703') {
        return res.status(400).json({ error: 'Custom passing scores are not supported by the current database schema.' });
      }
      throw dbErr;
    }
  } catch (error) {
    console.error('Set lesson passing score error:', error);
    res.status(500).json({ error: 'Failed to set passing score.' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { email, password, name, ministry, role = 'LEARNER' } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required.' });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered.' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const result = await pool.query(
      `INSERT INTO users (email, password_hash, password_plain, name, ministry, role, is_approved, approved_by, approved_at)
       VALUES ($1, $2, $3, $4, $5, $6, true, $7, CURRENT_TIMESTAMP)
       RETURNING id, email, name, role, ministry, created_at, is_approved`,
      [email.toLowerCase(), passwordHash, password, name, ministry || 'Unassigned', role, req.user.id]
    );

    const user = result.rows[0];

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        ministry: user.ministry,
        isApproved: user.is_approved
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.code === '42703') {
      
      try {
        const { email, password, name, ministry, role = 'LEARNER' } = req.body;
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        const result = await pool.query(
          `INSERT INTO users (email, password_hash, name, ministry, role, is_approved, approved_by, approved_at)
           VALUES ($1, $2, $3, $4, $5, true, $6, CURRENT_TIMESTAMP)
           RETURNING id, email, name, role, ministry, created_at, is_approved`,
          [email.toLowerCase(), passwordHash, name, ministry || 'Unassigned', role, req.user.id]
        );

        const user = result.rows[0];
        return res.status(201).json({
          message: 'User created successfully (password viewing not available - database migration needed)',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            ministry: user.ministry,
            isApproved: user.is_approved
          }
        });
      } catch (innerError) {
        console.error('Fallback create user error:', innerError);
        return res.status(500).json({ error: 'Failed to create user.' });
      }
    }
    res.status(500).json({ error: 'Failed to create user.' });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const userCheck = await pool.query('SELECT id, email FROM users WHERE id = $1', [userId]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    try {
      await pool.query(
        `UPDATE users SET password_hash = $1, password_plain = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
        [passwordHash, newPassword, userId]
      );
    } catch (dbErr) {
      
      if (dbErr.code === '42703') {
        await pool.query(
          `UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [passwordHash, userId]
        );
      } else {
        throw dbErr;
      }
    }

    res.json({
      message: 'Password reset successfully',
      userId: userId
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
};

export const getUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'SELECT id, email, name, password_plain FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const user = result.rows[0];

    if (!user.password_plain) {
      return res.json({
        userId: user.id,
        email: user.email,
        name: user.name,
        password: null,
        message: 'Password not available. User may have set their own password or database migration needed.'
      });
    }

    res.json({
      userId: user.id,
      email: user.email,
      name: user.name,
      password: user.password_plain
    });
  } catch (error) {
    console.error('Get user password error:', error);
    
    if (error.code === '42703') {
      return res.json({
        userId: req.params.userId,
        password: null,
        message: 'Password viewing not available. Database migration needed to add password_plain column.'
      });
    }
    res.status(500).json({ error: 'Failed to get password.' });
  }
};
