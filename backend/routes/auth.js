import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../middlewares/db.js';
const router = express.Router();

// 🔐 REGISTER
router.post('/register', async (req, res) => {
    const { username, password, user_fullname, user_description } = req.body;

    try {
        const [existing] = await db.query('SELECT * FROM Users WHERE username = ?', [username]);
        if (existing.length > 0) return res.status(400).json({ message: 'Username already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.query(
            'INSERT INTO Users (username, password_hash, user_fullname, user_description) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, user_fullname, user_description]
        );

        const [users] = await db.query('SELECT * FROM Users WHERE username = ?', [username]);
        const user = users[0];
        // Save session
        req.session.userId = user.ID;
        res.status(201).json({ success: true, message: 'User registered successfully', user: { id: user.ID, username: user.username, fullname: user.user_fullname, description: user.user_description } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err });
    }
});

// 🔐 LOGIN
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [users] = await db.query('SELECT * FROM Users WHERE username = ?', [username]);
        if (users.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

        const user = users[0];
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });

        // Save session
        req.session.userId = user.ID;
        res.status(200).json({ success: true, message: 'Login successful', user: { id: user.ID, username: user.username, fullname: user.user_fullname, description: user.user_description } });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server error', error: err });
    }
});

export default router;
