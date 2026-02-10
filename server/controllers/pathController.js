import pool from '../config/database.js';

export const getPaths = async (req, res) => {
  try {
    const userRole = req.user?.role || 'LEARNER';

    const pathsResult = await pool.query(`
      SELECT lp.*
      FROM learning_paths lp
      WHERE lp.is_active = true
        AND (lp.role_required = 'ALL' OR lp.role_required = $1)
      ORDER BY lp.order_index ASC
    `, [userRole]);

    const paths = [];

    for (const path of pathsResult.rows) {
      
      const coursesResult = await pool.query(`
        SELECT c.id, c.title, c.description, c.thumbnail_url, c.level, c.total_duration
        FROM learning_path_courses lpc
        JOIN courses c ON c.id = lpc.course_id
        WHERE lpc.learning_path_id = $1 AND c.is_published = true
        ORDER BY lpc.order_index ASC
      `, [path.id]);

      paths.push({
        id: path.id,
        title: path.title,
        description: path.description,
        role: path.role_required,
        courseIds: coursesResult.rows.map(c => c.id),
        courses: coursesResult.rows
      });
    }

    res.json({ paths });
  } catch (error) {
    console.error('Get paths error:', error);
    res.status(500).json({ error: 'Failed to fetch learning paths.' });
  }
};

export const getPathById = async (req, res) => {
  try {
    const { id } = req.params;

    const pathResult = await pool.query(
      'SELECT * FROM learning_paths WHERE id = $1',
      [id]
    );

    if (pathResult.rows.length === 0) {
      return res.status(404).json({ error: 'Learning path not found.' });
    }

    const path = pathResult.rows[0];

    const coursesResult = await pool.query(`
      SELECT c.*, lpc.order_index as path_order
      FROM learning_path_courses lpc
      JOIN courses c ON c.id = lpc.course_id
      WHERE lpc.learning_path_id = $1
      ORDER BY lpc.order_index ASC
    `, [id]);

    res.json({
      path: {
        ...path,
        courses: coursesResult.rows
      }
    });
  } catch (error) {
    console.error('Get path error:', error);
    res.status(500).json({ error: 'Failed to fetch learning path.' });
  }
};

export const createPath = async (req, res) => {
  try {
    const { title, description, roleRequired, orderIndex } = req.body;

    const result = await pool.query(`
      INSERT INTO learning_paths (title, description, role_required, order_index)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [title, description, roleRequired || 'ALL', orderIndex || 0]);

    res.status(201).json({
      message: 'Learning path created successfully',
      path: result.rows[0]
    });
  } catch (error) {
    console.error('Create path error:', error);
    res.status(500).json({ error: 'Failed to create learning path.' });
  }
};

export const updatePath = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, roleRequired, orderIndex, isActive } = req.body;

    const result = await pool.query(`
      UPDATE learning_paths
      SET title = COALESCE($1, title),
          description = COALESCE($2, description),
          role_required = COALESCE($3, role_required),
          order_index = COALESCE($4, order_index),
          is_active = COALESCE($5, is_active),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `, [title, description, roleRequired, orderIndex, isActive, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Learning path not found.' });
    }

    res.json({
      message: 'Learning path updated successfully',
      path: result.rows[0]
    });
  } catch (error) {
    console.error('Update path error:', error);
    res.status(500).json({ error: 'Failed to update learning path.' });
  }
};

export const deletePath = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM learning_paths WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Learning path not found.' });
    }

    res.json({ message: 'Learning path deleted successfully.' });
  } catch (error) {
    console.error('Delete path error:', error);
    res.status(500).json({ error: 'Failed to delete learning path.' });
  }
};

export const addCourseToPath = async (req, res) => {
  try {
    const { pathId } = req.params;
    const { courseId, orderIndex } = req.body;

    let finalOrderIndex = orderIndex;
    if (finalOrderIndex === undefined) {
      const maxOrder = await pool.query(
        'SELECT COALESCE(MAX(order_index), -1) + 1 as next_order FROM learning_path_courses WHERE learning_path_id = $1',
        [pathId]
      );
      finalOrderIndex = maxOrder.rows[0].next_order;
    }

    await pool.query(`
      INSERT INTO learning_path_courses (learning_path_id, course_id, order_index)
      VALUES ($1, $2, $3)
      ON CONFLICT (learning_path_id, course_id) DO UPDATE SET order_index = $3
    `, [pathId, courseId, finalOrderIndex]);

    res.json({ message: 'Course added to learning path successfully.' });
  } catch (error) {
    console.error('Add course to path error:', error);
    res.status(500).json({ error: 'Failed to add course to learning path.' });
  }
};

export const removeCourseFromPath = async (req, res) => {
  try {
    const { pathId, courseId } = req.params;

    await pool.query(
      'DELETE FROM learning_path_courses WHERE learning_path_id = $1 AND course_id = $2',
      [pathId, courseId]
    );

    res.json({ message: 'Course removed from learning path successfully.' });
  } catch (error) {
    console.error('Remove course from path error:', error);
    res.status(500).json({ error: 'Failed to remove course from learning path.' });
  }
};
