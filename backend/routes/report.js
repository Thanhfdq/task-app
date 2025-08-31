import express from "express";
import db from "../middlewares/db.js";

const router = express.Router();

// GET /reports/overview Overview stats
router.get("/overview", async (req, res) => {
  const userId = req.session.userId; // current user

  try {
    // Projects where this user is manager
    const [[projects]] = await db.query(
      `
      SELECT 
        COUNT(*) as totalProjects,
        SUM(CASE WHEN is_archive=0 THEN 1 ELSE 0 END) as activeProjects,
        SUM(CASE WHEN is_archive=1 THEN 1 ELSE 0 END) as archivedProjects
      FROM Projects
      WHERE MANAGER_ID = ?
    `,
      [userId]
    );

    // Tasks where this user is performer
    const [[tasks]] = await db.query(
      `
      SELECT 
        COUNT(*) as totalTasks,
        SUM(CASE WHEN task_state=0 THEN 1 ELSE 0 END) as openTasks,
        SUM(CASE WHEN task_state=1 THEN 1 ELSE 0 END) as completedTasks
      FROM Tasks
      WHERE PERFORMER_ID = ?
    `,
      [userId]
    );

    res.json({ ...projects, ...tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /reports/tasks-by-project Tasks by project
router.get("/tasks-by-project", async (req, res) => {
  const userId = req.session.userId;
  try {
    const [rows] = await db.query(
      `
      SELECT p.project_name, COUNT(t.ID) as task_count
      FROM Projects p
      LEFT JOIN Tasks t ON p.ID = t.PROJECT_ID
      WHERE p.MANAGER_ID = ?
      GROUP BY p.ID
    `,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /reports/completion-trend Completion trend (tasks finished per day)
router.get("/completion-trend", async (req, res) => {
  const userId = req.session.userId;
  try {
    const [rows] = await db.query(
      `
      SELECT DATE(complete_date) as date, COUNT(*) as completed_count
      FROM Tasks
      WHERE PERFORMER_ID = ? AND task_state = 1 AND complete_date IS NOT NULL
      GROUP BY DATE(complete_date)
      ORDER BY date ASC
    `,
      [userId]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
