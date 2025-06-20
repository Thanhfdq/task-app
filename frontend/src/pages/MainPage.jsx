import React, { useEffect, useState } from 'react';
import Sidebar from '../components/sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import TasksPage from './TasksPage.jsx';
import axios from '../services/api.js';
import '../styles/MainPage.css';

export default function MainPage({ user }) {
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    axios.get('/projects/recent').then(res => setRecentProjects(res.data));
  }, []);

  return (
    <div className="layout">
      <Sidebar recentProjects={recentProjects} />
      <div className="main">
        <Topbar />
        <main className="content">
          <TasksPage user={user} />
        </main>
      </div>
    </div>
  );
}
