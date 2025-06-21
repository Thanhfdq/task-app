import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/sidebar.css';
import { FaTasks, FaProjectDiagram, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function Sidebar({ recentProjects }) {
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => setCollapsed(prev => !prev);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="toggle-button" onClick={toggleSidebar}>
        {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </div>

      <Link to="/tasks" className="sidebar-section">
        <FaTasks />
        {!collapsed && 'Công việc'}
      </Link>

      <Link to="/projects" className="sidebar-section">
        <FaProjectDiagram />
        {!collapsed && 'Dự án'}
      </Link>

      {!collapsed && (
        <div className="sidebar-recent">
          <div className="sidebar-recent-title">Dự án gần đây</div>
          <ul className="sidebar-recent-list">
            {recentProjects.map((p) => (
              <li key={p.project_id} className="sidebar-recent-item">
                <Link to={`/projects/${p.project_id}`}>
                  ● {p.manager_username}/{p.project_name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
