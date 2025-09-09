#!/usr/bin/env node

import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import authRoutes from './routes/auth.js';
import projectsRoutes from './routes/projects.js';
import tasksRoutes from './routes/tasks.js';
import userRoutes from './routes/user.js';
import reportRoutes from './routes/report.js';
import cors from 'cors';

const app = express();
// ✅ Cấu hình session
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // nếu dùng HTTPS thì set true
};

// ✅ Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session(sessionConfig));
app.use(express.json());
app.use(cors({
  origin: ['http://localhost:5173','tauri://localhost'],
  credentials: true
}));

// Make 'uploads' folder publicly accessible
app.use('/uploads', express.static('uploads'));

// ✅ Router
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);

// ✅ Khởi động server
const PORT = process.env.BACKEND_PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
