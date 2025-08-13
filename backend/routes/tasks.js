import express from 'express';
import db from '../middlewares/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Recreate __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.resolve(__filename, '..', '..'); // Go up two levels to reach the root of the project

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
    'task_name', 'task_description', 'task_state', 'start_date', 'end_date',
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
    await db.query('UPDATE Tasks SET is_archive = 1 WHERE ID = ?', [taskId]);
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
    await db.query('UPDATE Tasks SET is_archive = 0 WHERE ID = ?', [taskId]);
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
    await db.query('DELETE FROM Tasks WHERE ID = ?', [taskId]);
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
    await db.query('UPDATE Tasks SET GROUP_ID = ? WHERE ID = ?', [new_GROUP_ID, id]);
    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to move task' });
  }
});

// GET /tasks/:taskId/comments
router.get('/:taskId/comments', async (req, res) => {
  const [comments] = await db.query(`
        SELECT Comments.*, Users.username FROM Comments
        JOIN Users ON Users.ID = Comments.user_id
        WHERE task_id = ?
        ORDER BY created_at ASC
    `, [req.params.taskId]);
  res.json(comments);
});

// POST /tasks/:taskId/comments
router.post('/:taskId/comments', async (req, res) => {
  const { content, user_id } = req.body;
  await db.query(`
        INSERT INTO Comments (task_id, user_id, content)
        VALUES (?, ?, ?)
    `, [req.params.taskId, user_id, content]);
  res.sendStatus(201);
});

// Multer setup: save files into "uploads/tasks/<taskId>"
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const taskId = req.params.taskId;
    const dir = `uploads/tasks/${taskId}`;

    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // avoid name conflicts
  }
});

const upload = multer({ storage });

// POST /upload-files/:taskId
router.post('/upload-files/:taskId', upload.array('files'), async (req, res) => {
  const taskId = req.params.taskId;
  console.log("Files received for task upload:", req.files);
  const files = req.files || (req.files ? [req.files] : []);
  console.log(`Uploading files for task ${taskId}:`, files);

  if (files.length === 0) {
    return res.status(400).json({ error: "No files uploaded." });
  }

  try {
    for (const file of files) {
      await db.query(`
        INSERT INTO Task_files (task_id, file_name, file_path, file_size, mime_type)
        VALUES (?, ?, ?, ?, ?)`,
        [taskId, file.originalname, file.path, file.size, file.mimetype]
      );
    }

    res.status(200).json({ success: true, message: "Files uploaded." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong while saving file metadata." });
  }
});

// GET /tasks/:taskId/files
router.get('/:taskId/files', async (req, res) => {
  const taskId = req.params.taskId;

  try {
    const [rows] = await db.query(`
      SELECT * 
      FROM Task_files
      WHERE task_id = ?
      ORDER BY uploaded_at DESC
    `, [taskId]);

    res.status(200).json({
      success: true,
      files: rows
    });
  } catch (err) {
    console.error('Error fetching task files:', err);
    res.status(500).json({
      success: false,
      message: 'Could not fetch task files.'
    });
  }
});

// GET /tasks/files/:fileId/download
router.get('/files/:fileId/download', async (req, res) => {
  const fileId = req.params.fileId;

  try {
    const [rows] = await db.query(
      'SELECT file_name, file_path, task_id FROM Task_files WHERE ID = ?',
      [fileId]
    );

    if (!rows.length) return res.status(404).json({ error: 'File not found' });

    const fileRow = rows[0];

    // file_path in DB should be relative to backend, e.g. "uploads/tasks/1/xxx.jpg"
    const filePath = path.resolve(__dirname, '..', fileRow.file_path);

    // Security check: enforce that filePath is inside uploads directory
    const uploadsDir = path.resolve(__dirname, '..', 'uploads');

    // Ensure the file path is within the uploads directory
    if (!filePath.startsWith(uploadsDir)) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

    // This sets headers and streams file; filename will be used by the browser
    res.download(filePath, fileRow.file_name, (err) => {
      if (err) {
        console.error('Download failed:', err);
        if (!res.headersSent) res.status(500).send('Server error while downloading');
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /tasks/files/:taskId/:fileName
router.delete('/files/:taskId/:fileName', async (req, res) => {
  const { taskId, fileName } = req.params;
  console.log(`Deleting file ${fileName} for task ${taskId}`);
  try {
    // 1️⃣ Path to file on server
    const filePath = path.join(__dirname, 'uploads', 'tasks', taskId, fileName);
    console.log(`File path: ${filePath}`);
    // 2️⃣ Delete from server
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    } else {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // 3️⃣ Delete from database
    await db.query('DELETE FROM Task_files WHERE task_id = ? AND file_name = ?', [taskId, fileName]);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({ error: "Server error" });
  }
});


export default router;
