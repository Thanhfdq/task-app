import express from 'express';
import db from '../middlewares/db.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

// GET /users/search?keyword=abc
router.get('/search-users', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ message: 'Missing keyword' });

  try {
    const [users] = await db.query(
      `SELECT ID, username, user_fullname FROM Users 
       WHERE LOWER(username) LIKE CONCAT('%', LOWER(?), '%')
       OR LOWER(user_fullname) LIKE CONCAT('%', LOWER(?), '%')
       LIMIT 10`,
      [keyword, keyword]
    );
    res.json(users);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

//PUT /users/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { username, fullname, description } = req.body;

  if (!username || !fullname || !description) {
    return res.status(400).json({ message: 'Missing fields' });
  }

  try {
    const [result] = await db.query(
      `UPDATE Users SET username = ?, user_fullname = ?, user_description = ? WHERE ID = ?`,
      [username, fullname, description, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /users/change-password
router.post('/change-password', async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!userId || !currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  console.log('Change password request:', { userId, currentPassword, newPassword });

  try {
    // Verify current password
    const [users] = await db.query(`SELECT * FROM Users WHERE ID = ?`, [userId]);
    const user = users[0];
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!user || !match) {
      return res.status(401).json({ message: 'Invalid current password' });
    }

    // Update password
    await db.query(`UPDATE Users SET password_hash = ? WHERE ID = ?`, [await bcrypt.hash(newPassword, 10), userId]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;