import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTaskModal } from '../contexts/TaskModalContext';
import { UserProvider, useUser } from '../contexts/UserContext';
import {
  FaTasks,
  FaProjectDiagram,
  FaChevronLeft,
  FaChevronRight,
  FaUserCircle,
  FaPlus,
  FaSearch,
} from 'react-icons/fa';
import {
  TbLayoutSidebarRightCollapse,
  TbLayoutSidebarRightExpand,
} from 'react-icons/tb'
import '../styles/Sidebar.css';

export default function Sidebar({ projects = [] }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed(!collapsed);
  const { openModalForNewTask } = useTaskModal();
  const {user} = useUser();

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <h3 className="app-title">{user.fullname}</h3>}
        <button className="toggle-button" onClick={toggleSidebar}>
          {collapsed ? <TbLayoutSidebarRightCollapse /> : <TbLayoutSidebarRightExpand />}
        </button>
      </div>

      <nav className="sidebar-nav">
        <button className="btn-primary" onClick={() => openModalForNewTask({
          start_date: new Date().toISOString().substring(0, 10),
          end_date: new Date().toISOString().substring(0, 10)
        })}>
          <FaPlus />
          {!collapsed && <span>Tạo công việc mới</span>}
        </button>
        <Link to="/projects" className="nav-item">
          <FaProjectDiagram />
          {!collapsed && <span>Tất cả danh sách</span>}
        </Link>
        <Link to="/tasks" className="nav-item">
          <FaTasks />
          {!collapsed && <span>Tất cả công việc</span>}
        </Link>
      </nav>

      <div className="sidebar-actions">
        <Link to="/tasks/my-tasks" className="btn-secondary nav-item">
          <FaUserCircle />
          {!collapsed && <span>Công việc của tôi</span>}
        </Link>
      </div>

      {!collapsed && (
        <div className="sidebar-recent">
          <div className="sidebar-recent-title">Các danh sách</div>
          <ul className="sidebar-recent-list">
            {projects.map((p) => (
              <li key={p.ID}>
                <Link to={`/projects/${p.ID}`}>
                  {p.manager_username}/{p.project_name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
