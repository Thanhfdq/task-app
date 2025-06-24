import express from 'express';
import bodyParser from 'body-parser';
import session from 'express-session';
import authRoutes from './routes/auth.js';
import projectsRoutes from './routes/projects.js';
import tasksRoutes from './routes/tasks.js';
import userRoutes from './routes/user.js';
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
  origin: 'http://localhost:5173',  // Frontend URL
  credentials: true
}));

// ✅ Router
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/users', userRoutes);

// ✅ Khởi động server
const PORT = process.env.BACKEND_PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
