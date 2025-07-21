import express from 'express';
import db from '../middlewares/db.js';

const router = express.Router();

// GET /users/search?keyword=abc
router.get('/search-users', async (req, res) => {
  const { keyword } = req.query;
  if (!keyword) return res.status(400).json({ message: 'Missing keyword' });

  try {
    const [users] = await db.query(
      `SELECT ID, username, user_fullname FROM Users 
       WHERE LOWER(username) LIKE CONCAT('%', LOWER(?), '%') LIMIT 10`,
      [keyword]
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

export default router;