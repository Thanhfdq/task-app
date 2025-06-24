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

export default router;