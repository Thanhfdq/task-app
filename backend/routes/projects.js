// /routes/projects.js
import express from 'express';
import db from '../middlewares/db.js';

const router = express.Router();

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

export default router;
