import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { Routes, Route } from 'react-router-dom';
import TasksPage from './TasksPage.jsx';
import ProjectsPage from './ProjectsPage.jsx';
import ProjectDetailPage from './ProjectDetailPage.jsx';
import axios from '../services/api.js';
import '../styles/MainPage.css';

export default function MainPage({ user }) {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    axios.get('/projects').then(res => setProjects(res.data));
  }, []);

  return (
    <div className="layout">
      <Sidebar projects={projects} />
      <div className="main">
        <main className="content">
          <Routes>
            <Route path="/tasks" element={<TasksPage user={user} />} />
            <Route path="/projects" element={<ProjectsPage user={user} />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/tasks/my-tasks" element={<TasksPage onlyMine={true} user={user} />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
