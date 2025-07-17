import express from 'express';
import db from '../middlewares/db.js';

const router = express.Router();

// GET tasks for search by logged-in user
router.get('/', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  const {
    projectId,
    assigneeId,
    state,
    startDate,
    endDate,
    keyword,
    labels // comma-separated string
  } = req.query;

  try {
    let sql = `SELECT Tasks.*, 
            Users.username AS performer_username, 
            Projects.project_name,
            DATE_FORMAT(Tasks.start_date, '%Y-%m-%d') AS start_date,
            DATE_FORMAT(Tasks.end_date, '%Y-%m-%d') AS end_date,
            DATE_FORMAT(Tasks.complete_date, '%Y-%m-%d') AS complete_date
          FROM Tasks
          LEFT JOIN Users ON Tasks.PERFORMER_ID = Users.ID
          LEFT JOIN Projects ON Tasks.PROJECT_ID = Projects.ID
          WHERE (PERFORMER_ID = ? OR Projects.MANAGER_ID = ?)`;

    const params = [userId, userId];

    if (projectId) {
      sql += ` AND PROJECT_ID = ?`;
      params.push(projectId);
    }

    if (assigneeId) {
      sql += ` AND PERFORMER_ID = ?`;
      params.push(assigneeId);
    }

    if (state !== undefined) {
      sql += ` AND task_state = ?`;
      params.push(state);
    }

    if (startDate) {
      sql += ` AND start_date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND end_date <= ?`;
      params.push(endDate);
    }

    if (keyword) {
      sql += ` AND (task_name LIKE ? OR task_description LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }

    if (labels) {
      const labelList = labels.split(',').map(label => label.trim());
      const labelConditions = labelList.map(() => `label = ?`).join(' OR ');
      sql += ` AND (${labelConditions})`;
      params.push(...labelList);
    }

    const [tasks] = await db.query(sql, params);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle state of a task
router.patch('/:id/toggle-state', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  const taskId = req.params.id;

  try {
    const [rows] = await db.query('SELECT task_state FROM Tasks WHERE ID = ?', [taskId]);
    const task = rows[0];

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const newState = !task.task_state;
    const completeDate = newState ? new Date() : null;

    await db.query(
      'UPDATE Tasks SET task_state = ?, complete_date = ? WHERE ID = ?',
      [newState, completeDate, taskId]
    );

    res.json({ success: true, task_state: newState, complete_date: completeDate });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a task
router.post('/', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  const {
    task_name, task_description, start_date, end_date,
    label, progress, PERFORMER_ID, PROJECT_ID, GROUP_ID, parent_task_id
  } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO Tasks (
        task_name, task_description, start_date, end_date,
        label, progress, PERFORMER_ID, PROJECT_ID, GROUP_ID, parent_task_id,
        task_state, is_archive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [
        task_name, task_description, start_date || null, end_date || null,
        label, progress, PERFORMER_ID, PROJECT_ID || null, GROUP_ID, parent_task_id || null
      ]
    );

    res.status(201).json({ success: true, taskId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update info a task
router.put('/:id', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  const taskId = req.params.id;
  const allowedFields = [
    'task_name', 'task_description', 'start_date', 'end_date',
    'label', 'progress', 'PERFORMER_ID', 'PROJECT_ID', 'GROUP_ID'
  ];

  const fields = [];
  const values = [];

  for (const key of allowedFields) {
    if (req.body[key] !== undefined) {
      fields.push(`${key} = ?`);
      values.push(req.body[key]);
    }
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
  }

  values.push(taskId);

  const sql = `UPDATE Tasks SET ${fields.join(', ')} WHERE ID = ?`;

  try {
    await db.query(sql, values);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Archive a task
router.patch('/:id/archive', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  const taskId = req.params.id;
  try {
    await db.query('UPDATE tasks SET is_archive = 1 WHERE ID = ?', [taskId]);
    res.json({ message: 'Task archived successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to archive task' });
  }
});

// PATCH /tasks/:id/restore Restore a task
router.patch('/:id/restore', async (req, res) => {
  const userId = req.session.userId;
  const taskId = req.params.id;

  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  try {
    await db.query('UPDATE tasks SET is_archive = 0 WHERE ID = ?', [taskId]);
    res.json({ message: 'Task restored successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to restore task' });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  const taskId = req.params.id;
  try {
    await db.query('DELETE FROM tasks WHERE ID = ?', [taskId]);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to delete task' });
  }
});

// PATCH /tasks/:id/move
router.patch('/:id/move', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  const { id } = req.params;
  const { new_GROUP_ID } = req.body;
  try {
    await db.query('UPDATE tasks SET GROUP_ID = ? WHERE ID = ?', [new_GROUP_ID, id]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to move task' });
  }
});

export default router;
