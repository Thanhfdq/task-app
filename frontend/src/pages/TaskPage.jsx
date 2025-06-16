import React, { useEffect, useState } from 'react';
import Sidebar from '../components/sidebar.jsx';
import Topbar from '../components/Topbar.jsx';
import TaskItem from '../components/Taskitem.jsx';
import axios from '../services/api.js';
import '../styles/TaskPage.css';

export default function TasksPage() {
  const [recentProjects, setRecentProjects] = useState([]);
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    axios.get('/projects/recent').then(res => setRecentProjects(res.data));
    axios.get('/tasks').then(res => setTasks(res.data)).catch(err => console.error('Failed to load tasks:', err));
  }, []);

  return (
    <div className="layout">
      <Sidebar recentProjects={recentProjects} />
      <div className="main">
        <Topbar />
        <main className="content">
          {tasks.map(task => <TaskItem key={task.ID} task={task} />)}
        </main>
      </div>
    </div>
  );
}
