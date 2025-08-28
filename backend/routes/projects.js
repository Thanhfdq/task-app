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
          p.ID, p.project_name, p.manager_id, p.project_description, p.is_archive,
          DATE_FORMAT(p.start_date, '%Y-%m-%d') AS start_date,
          DATE_FORMAT(p.end_date, '%Y-%m-%d') AS end_date,
          u.username as manager_username, u.user_fullname as manager_fullname
        FROM Projects p
        JOIN Users u ON p.MANAGER_ID = u.ID
        WHERE p.ID = ? AND 
        (p.MANAGER_ID = ? OR EXISTS 
          (
            SELECT 1 FROM Project_members WHERE PROJECT_ID = p.ID AND member_id = ?
          )
        )`,
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
      SELECT 
          p.ID AS PROJECT_ID, 
          p.project_name, 
          u.username AS manager_username,
          DATE_FORMAT(p.start_date, '%Y-%m-%d') AS start_date,
          DATE_FORMAT(p.end_date, '%Y-%m-%d') AS end_date
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
      SELECT 
          p.*,
          DATE_FORMAT(p.start_date, '%Y-%m-%y') AS start_date,
          DATE_FORMAT(p.end_date, '%Y-%m-%d') AS end_date,
          u.username AS manager_username,
          COUNT(DISTINCT t.ID) AS task_count,
          COUNT(DISTINCT pm.MEMBER_ID) AS member_count
      FROM
          Projects p
              JOIN
          Users u ON p.MANAGER_ID = u.ID
              LEFT JOIN
          Project_members pm ON pm.PROJECT_ID = p.ID
          LEFT JOIN
        Tasks t ON t.PROJECT_ID = p.ID
      WHERE
          p.MANAGER_ID = ? OR pm.MEMBER_ID = ?
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

// GET /projects/owner/:userId - Get all projects owned by a user
router.get('/owner/:userId', async (req, res) => {
  const { userId } = req.params;
  const { isArchived } = req.query;
  if (!checkAuth(req)) return res.status(401).json({ message: 'Not authenticated' });
  let sql = `
      SELECT 
          p.ID AS PROJECT_ID, 
          p.project_name, 
          p.project_description,
          p.label,
          p.is_archive,
          p.project_state,
          p.MANAGER_ID,
          u.username AS manager_username,
          DATE_FORMAT(p.start_date, '%Y-%m-%d') AS start_date,
          DATE_FORMAT(p.end_date, '%Y-%m-%d') AS end_date,
          DATE_FORMAT(p.complete_date, '%Y-%m-%d') AS complete_date
      FROM Projects p
      JOIN Users u ON p.MANAGER_ID = u.ID
      WHERE p.MANAGER_ID = ?
      `;
  const params = [userId];
  if (typeof isArchived !== 'undefined') {
    console.log('isArchived:', isArchived);
    sql += ` AND p.is_archive = ?`;
    params.push(isArchived);
  }

  try {
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', error: err });
  }
});

// GET /projects/:projectId/tasks - Lấy danh sách task thuộc danh sách (Không lưu trữ)
router.get('/:projectId/tasks', async (req, res) => {
  if (!checkAuth(req)) return res.status(401).json({ message: 'Not authenticated' });

  const projectId = req.params.projectId;

  try {
    const [tasks] = await db.query(
      `SELECT 
         Tasks.*,
         DATE_FORMAT(Tasks.start_date, '%Y-%m-%d') AS start_date,
         DATE_FORMAT(Tasks.end_date, '%Y-%m-%d') AS end_date,
         DATE_FORMAT(Tasks.complete_date, '%Y-%m-%d') AS complete_date,
         Users.username AS performer_username 
       FROM Tasks 
       LEFT JOIN Users ON Tasks.PERFORMER_ID = Users.ID
       WHERE Tasks.PROJECT_ID = ? AND Tasks.is_archive = 0`,
      [projectId]
    );

    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks of project:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /projects/:projectId/tasks - Lấy danh sách task thuộc danh sách (đã lưu trữ)
router.get('/:projectId/tasks/archived', async (req, res) => {
  if (!checkAuth(req)) return res.status(401).json({ message: 'Not authenticated' });

  const projectId = req.params.projectId;

  try {
    const [tasks] = await db.query(
      `SELECT 
         Tasks.*,
         Projects.project_name,
         DATE_FORMAT(Tasks.start_date, '%Y-%m-%d') AS start_date,
         DATE_FORMAT(Tasks.end_date, '%Y-%m-%d') AS end_date,
         DATE_FORMAT(Tasks.complete_date, '%Y-%m-%d') AS complete_date,
         Users.username AS performer_username 
       FROM Tasks 
       LEFT JOIN Users ON Tasks.PERFORMER_ID = Users.ID
       LEFT JOIN Projects ON Tasks.PROJECT_ID = Projects.ID
       WHERE Tasks.PROJECT_ID = ? AND Tasks.is_archive = 1`,
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
      `SELECT Users.ID, Users.username, Users.user_fullname
             FROM Users
             JOIN Project_members ON Users.ID = Project_members.member_id
             WHERE Project_members.PROJECT_ID = ?`,
      [projectId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Lỗi khi lấy thành viên danh sách:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /projects/:projectId/groups - Get all task groups in a project
router.get('/:projectId/groups', async (req, res) => {
  if (!checkAuth(req)) return res.status(401).json({ message: 'Not authenticated' });

  const { projectId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT ID, group_name
             FROM Task_groups
             WHERE PROJECT_ID = ?`,
      [projectId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Lỗi khi lấy các nhóm:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /projects/:projectId/groups/:groupId - Rename a task group
router.patch('/:projectId/groups/:groupId', async (req, res) => {
  if (!checkAuth(req)) return res.status(401).json({ message: 'Not authenticated' });
  const { name } = req.body;
  const { projectId, groupId } = req.params;
  try {
    await db.query('UPDATE Task_groups SET group_name = ? WHERE ID = ? AND PROJECT_ID = ?', [name, groupId, projectId]);
    res.sendStatus(200);
  } catch (err) {
    console.error('Rename group error:', err);
    res.status(500).json({ message: 'Rename failed' });
  }
});


// POST /projects/:projectId/groups - Create a new task group in a project
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
      `SELECT COUNT(*) AS taskCount FROM Tasks WHERE GROUP_ID = ? AND PROJECT_ID = ? AND is_archive = 0`,
      [groupId, projectId]
    );
    if (tasks[0].taskCount > 0) {
      return res.status(400).json({ message: 'Cannot delete group with tasks' });
    }

    // Delete the group
    await db.query(
      `DELETE FROM Task_groups WHERE ID = ? AND PROJECT_ID = ?`,
      [groupId, projectId]
    );

    res.json({ message: 'Group deleted' });
  } catch (err) {
    console.error('Error deleting group:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  const {
    project_name,
    project_description,
    project_state = false,      // Mặc định là đang mở
    is_archive = false,         // Mặc định chưa lưu trữ
    label,
    start_date,
    end_date,
    complete_date
  } = req.body;

  if (!project_name) {
    return res.status(400).json({ message: 'project_name is required' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO Projects 
        (project_name, project_description, project_state, is_archive, label, start_date, end_date, complete_date, MANAGER_ID)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [project_name, project_description, project_state, is_archive, label, start_date, end_date, complete_date, userId]
    );

    const [newProject] = await db.query(`SELECT * FROM Projects WHERE ID = ?`, [result.insertId]);
    res.status(201).json(newProject[0]);
  } catch (err) {
    console.error('Error creating project:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /projects/:id - Update project details
router.put('/:id', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  const projectId = req.params.id;

  const {
    project_name,
    project_description,
    project_state,
    is_archive,
    label,
    start_date,
    end_date,
    complete_date = null
  } = req.body;

  try {
    // Kiểm tra quyền
    const [check] = await db.query(
      `SELECT ID FROM Projects WHERE ID = ? AND MANAGER_ID = ?`,
      [projectId, userId]
    );
    if (check.length === 0) {
      return res.status(403).json({ message: 'Permission denied' });
    }

    // Cập nhật
    await db.query(
      `UPDATE Projects SET 
        project_name = ?, 
        project_description = ?, 
        project_state = ?, 
        is_archive = ?, 
        label = ?, 
        start_date = ?, 
        end_date = ?, 
        complete_date = ?
       WHERE ID = ?`,
      [project_name, project_description, project_state, is_archive, label, start_date, end_date, complete_date, projectId]
    );

    const [updated] = await db.query(`SELECT * FROM Projects WHERE ID = ?`, [projectId]);
    res.json(updated[0]);
  } catch (err) {
    console.error('Error updating project:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /projects/archived - Get all archived projects of the logged-in user
router.get('/archived', async (req, res) => {
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const [rows] = await db.query(
      `SELECT 
         p.ID, p.project_name, p.project_description, p.label, 
         DATE_FORMAT(p.start_date, '%Y-%m-%d') AS start_date,
         DATE_FORMAT(p.end_date, '%Y-%m-%d') AS end_date,
         u.username AS manager_username
       FROM Projects p
       JOIN Users u ON p.MANAGER_ID = u.ID
       LEFT JOIN Project_members pm ON pm.PROJECT_ID = p.ID
       WHERE (p.MANAGER_ID = ? OR pm.MEMBER_ID = ?) AND p.is_archive = 1
       GROUP BY p.ID
       ORDER BY p.start_date DESC`,
      [userId, userId]
    );

    res.json(rows);
  } catch (err) {
    console.error('Error fetching archived projects:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /projects/:id/restore
router.patch('/:id/restore', async (req, res) => {
  const userId = req.session.userId;
  const projectId = req.params.id;

  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const [result] = await db.query(
      `UPDATE Projects SET is_archive = 0 WHERE ID = ? AND MANAGER_ID = ?`,
      [projectId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Project not found or no permission' });
    }

    res.json({ message: 'Project restored' });
  } catch (err) {
    console.error('Restore error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /projects/:projectId/members
router.post('/:projectId/members', async (req, res) => {
  const { projectId } = req.params;
  const { userIdToAdd } = req.body;
  if (!checkAuth(req)) return res.status(401).json({ message: 'Not authenticated' });

  try {
    await db.query(
      `INSERT INTO Project_members (PROJECT_ID, MEMBER_ID) VALUES (?, ?)`,
      [projectId, userIdToAdd]
    );
    res.status(201).json({ message: 'Member added' });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /projects/:projectId/leave
router.delete('/:projectId/leave', async (req, res) => {
  const { projectId } = req.params;
  const userId = req.session.userId;
  if (!userId) return res.status(401).json({ message: 'Not authenticated' });

  try {
    const [check] = await db.query(
      `SELECT COUNT(*) AS taskCount FROM Tasks WHERE PROJECT_ID = ? AND PERFORMER_ID = ? AND is_archive = 0`,
      [projectId, userId]
    );

    if (check[0].taskCount > 0) {
      return res.status(400).json({ message: 'Bạn không thể rời danh sách vì vẫn còn task được giao.' });
    }

    await db.query(
      `DELETE FROM Project_members WHERE PROJECT_ID = ? AND MEMBER_ID = ?`,
      [projectId, userId]
    );

    res.json({ message: 'Đã rời khỏi danh sách' });
  } catch (err) {
    console.error('Leave error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /projects/:projectId/members-with-task-count
router.get('/:projectId/members-with-task-count', async (req, res) => {
  if (!checkAuth(req)) return res.status(401).json({ message: 'Not authenticated' });

  const { projectId } = req.params;

  try {
    const [rows] = await db.query(`
      SELECT 
        u.ID, u.username, u.user_fullname, 
        COUNT(t.ID) AS task_count
      FROM Project_members pm
      JOIN Users u ON u.ID = pm.MEMBER_ID
      LEFT JOIN Tasks t ON t.PERFORMER_ID = u.ID AND t.PROJECT_ID = ?
      WHERE pm.PROJECT_ID = ?
      GROUP BY u.ID
    `, [projectId, projectId]);

    res.json(rows);
  } catch (err) {
    console.error('Lỗi lấy thành viên + task:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /projects/:projectId/members/:memberId
router.delete('/:projectId/members/:memberId', async (req, res) => {
  if (!checkAuth(req)) return res.status(401).json({ message: 'Not authenticated' });

  const { projectId, memberId } = req.params;

  try {
    const [[{ taskCount }]] = await db.query(`
      SELECT COUNT(*) AS taskCount 
      FROM Tasks 
      WHERE PERFORMER_ID = ? AND PROJECT_ID = ?
    `, [memberId, projectId]);

    if (taskCount > 0) {
      return res.status(400).json({ message: 'Không thể xóa. Người này vẫn còn công việc.' });
    }

    await db.query(`
      DELETE FROM Project_members 
      WHERE PROJECT_ID = ? AND MEMBER_ID = ?
    `, [projectId, memberId]);

    res.json({ message: 'Đã xóa thành viên.' });
  } catch (err) {
    console.error('Lỗi xóa thành viên:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


export default router;
