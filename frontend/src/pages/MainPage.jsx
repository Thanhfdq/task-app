import React, { useEffect, useState } from 'react';
import Sidebar from '../components/sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import { Routes, Route } from 'react-router-dom';
import TasksPage from './TasksPage.jsx';
import ProjectsPage from './ProjectsPage.jsx';
import ProjectDetailPage from './ProjectDetailPage.jsx';
import axios from '../services/api.js';
import '../styles/MainPage.css';

export default function MainPage({ user }) {
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    axios.get('/projects/me/recent').then(res => setRecentProjects(res.data));
  }, []);

  return (
    <div className="layout">
      <Sidebar recentProjects={recentProjects} />
      <div className="main">
        <Topbar />
        <main className="content">
          <Routes>
            <Route path="/tasks" element={<TasksPage user={user} />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
