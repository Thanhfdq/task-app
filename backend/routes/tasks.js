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
            Projects.project_name FROM Tasks

            LEFT JOIN Users ON Tasks.PERFORMER_ID = Users.ID
            LEFT JOIN Projects ON Tasks.PROJECT_ID = Projects.ID
            WHERE (PERFORMER_ID = ? OR Projects.MANAGER_ID = ?)`;
        const params = [];
        params.push(userId);
        params.push(userId);

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

        // Xử lý complete_date tuỳ theo trạng thái mới
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
    label, progress, performer_id, project_id, group_id, parent_task_id 
  } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO Tasks (
        task_name, task_description, start_date, end_date,
        label, progress, performer_id, project_id, group_id, parent_task_id,
        task_state, is_archive
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
      [
        task_name, task_description, start_date || null, end_date || null,
        label, progress, performer_id, project_id || null, group_id, parent_task_id || null
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
  const {
    task_name, task_description, start_date, end_date,
    label, progress, PROJECT_ID, GROUP_ID, PERFORMER_ID
  } = req.body;

  try {
    await db.query(
      `UPDATE Tasks SET
        task_name = ?, task_description = ?, start_date = ?, end_date = ?,
        label = ?, progress = ?, performer_id = ?, project_id = ?, group_id = ?
      WHERE ID = ?`,
      [
        task_name, task_description, start_date, end_date,
        label, progress, PERFORMER_ID, PROJECT_ID, GROUP_ID, taskId
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;
