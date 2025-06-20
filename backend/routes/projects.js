// /routes/projects.js
import express from 'express';
import db from '../middlewares/db.js';

const router = express.Router();

//Get 5 recent projects
router.get('/recent', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const [rows] = await db.query(
      `
      SELECT p.ID AS project_id, p.project_name, u.username AS manager_username
      FROM Projects p
      JOIN Users u ON p.MANAGER_ID = u.ID
      LEFT JOIN Project_members pm ON pm.PROJECT_ID = p.ID
      WHERE p.MANAGER_ID = ? OR pm.MEMBER_ID = ?
      GROUP BY p.ID
      ORDER BY p.start_date DESC
      LIMIT 5
      `,
      [userId, userId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err });
  }
});

//Get all projects of logged-in user
router.get('/', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const [rows] = await db.query(
      `
      SELECT p.*, u.username AS manager_username
      FROM Projects p
      JOIN Users u ON p.MANAGER_ID = u.ID
      LEFT JOIN Project_members pm ON pm.PROJECT_ID = p.ID
      WHERE p.MANAGER_ID = ? OR pm.MEMBER_ID = ?
      GROUP BY p.ID
      `,
      [userId, userId]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// Get all members in a project
router.get('/:projectId/members', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  const { projectId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT Users.ID, Users.username
             FROM Users
             JOIN Project_members ON Users.ID = Project_members.member_id
             WHERE Project_members.project_id = ?`,
      [projectId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Lỗi khi lấy thành viên dự án:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:projectId/groups', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  const { projectId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT ID, group_name
             FROM Task_groups
             WHERE project_id = ?`,
      [projectId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Lỗi khi lấy các nhóm:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
