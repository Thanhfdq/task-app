import express from 'express';
import db from '../middlewares/db.js';

const router = express.Router();

// GET /api/tasks - get tasks for logged-in user
router.get('/', async (req, res) => {
  const userId = req.session.userId;

  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const [tasks] = await db.query(
      `SELECT Tasks.*, Projects.project_name
       FROM Tasks
       JOIN Projects ON Tasks.PROJECT_ID = Projects.ID
       WHERE Tasks.PERFORMER_ID = ? AND Tasks.is_archive = FALSE`,
      [userId]
    );

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

export default router;
