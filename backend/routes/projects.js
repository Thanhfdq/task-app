// /routes/projects.js
import express from 'express';
import db from '../middlewares/db.js';

const router = express.Router();

const checkAuth = function (req) {
  const userId = req.session.userId;
  if (!userId) return false;
  return true;
}

// GET /projects/:id - Get project detail
router.get('/:id', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });
  const projectId = req.params.id;

  try {
    const [rows] = await db.query(
      `SELECT 
          p.*,
          u.username as manager_username, u.user_fullname as manager_fullname
        FROM Projects p
        JOIN Users u ON p.MANAGER_ID = u.ID
        WHERE p.ID = ? AND (p.MANAGER_ID = ? OR EXISTS (
          SELECT 1 FROM Project_members WHERE project_id = p.ID AND member_id = ?
        )) AND p.is_archive = 0`,
      [projectId, userId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Project not found or no permission' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching project detail:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//Get 5 recent projects
router.get('/me/recent', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const [rows] = await db.query(
      `
      SELECT p.ID AS project_id, p.project_name, u.username AS manager_username
      FROM Projects p
      JOIN Users u ON p.MANAGER_ID = u.ID
      LEFT JOIN Project_members pm ON pm.PROJECT_ID = p.ID
      WHERE (p.MANAGER_ID = ? OR pm.MEMBER_ID = ?) AND p.is_archive = 0
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
      WHERE (p.MANAGER_ID = ? OR pm.MEMBER_ID = ?) AND p.is_archive = 0
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

// GET /projects/:projectId/tasks - Lấy danh sách task thuộc dự án
router.get('/:projectId/tasks', async (req, res) => {
  if (!checkAuth(req)) return res.status(401).json({ message: 'Not authenticated' });

  const projectId = req.params.projectId;

  try {
    const [tasks] = await db.query(
      `SELECT Tasks.*, Users.username AS performer_username 
       FROM Tasks 
       LEFT JOIN Users ON Tasks.performer_id = Users.ID
       WHERE Tasks.project_id = ? AND Tasks.is_archive = 0`,
      [projectId]
    );

    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks of project:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all members in a project
router.get('/:projectId/members', async (req, res) => {
  if (!checkAuth(req)) return res.status(401).json({ message: 'Not authenticated' });

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
  if (!checkAuth(req)) return res.status(401).json({ message: 'Not authenticated' });

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

router.post('/:projectId/groups', async (req, res) => {
  if (!checkAuth(req)) return res.status(401).json({ message: 'Not authenticated' });

  const { name } = req.body;
  const projectId = req.params.projectId;

  try {
    const [result] = await db.query(
      `INSERT INTO Task_groups (group_name, PROJECT_ID) VALUES (?, ?)`,
      [name, projectId]
    );

    const [group] = await db.query(`SELECT * FROM Task_groups WHERE ID = ?`, [result.insertId]);
    res.status(201).json(group[0]);
  } catch (err) {
    console.error("Error creating group:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /projects/:projectId/groups/:groupId - Remove a group if it has no tasks
router.delete('/:projectId/groups/:groupId', async (req, res) => {
  if (!checkAuth(req)) return res.status(401).json({ message: 'Not authenticated' });

  const { projectId, groupId } = req.params;

  try {
    // Check if the group has any tasks
    const [tasks] = await db.query(
      `SELECT COUNT(*) AS taskCount FROM Tasks WHERE group_id = ? AND project_id = ? AND is_archive = 0`,
      [groupId, projectId]
    );
    if (tasks[0].taskCount > 0) {
      return res.status(400).json({ message: 'Cannot delete group with tasks' });
    }

    // Delete the group
    await db.query(
      `DELETE FROM Task_groups WHERE ID = ? AND project_id = ?`,
      [groupId, projectId]
    );

    res.json({ message: 'Group deleted' });
  } catch (err) {
    console.error('Error deleting group:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;
