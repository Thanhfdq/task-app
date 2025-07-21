import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTaskModal } from '../contexts/TaskModalContext';
import { UserProvider, useUser } from '../contexts/UserContext';
import AccountInfoForm from './AccountInfoForm';
import axios from '../services/api';
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
  const [showAccountForm, setShowAccountForm] = useState(false);
  const { user } = useUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter out archived projects
  const notActiveProjects = projects.filter((p) => !p.is_archive);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && (
          <div className="account-menu-wrapper" ref={menuRef}>
            <button className="account-button" onClick={() => setMenuOpen(!menuOpen)}>
              {user.fullname} ⏷
            </button>
            {menuOpen && (
              <ul className="account-dropdown">
                <li onClick={() => setShowAccountForm(true)}>👤 Hồ sơ</li>
                <li onClick={() => console.log('Go to settings')}>⚙️ Cài đặt</li>
                <li onClick={() => console.log('Log out')}>🚪 Đăng xuất</li>
              </ul>
            )}
          </div>
        )}
        <button className="toggle-button" onClick={toggleSidebar}>
          {collapsed ? <TbLayoutSidebarRightCollapse /> : <TbLayoutSidebarRightExpand />}
        </button>
      </div>

      {showAccountForm && (
        <AccountInfoForm
          user={user}
          onSave={(updatedUser) => {
            // call your update API here or update state
            axios.put(`/users/${user.id}`, updatedUser)
              .then(response => {
                console.log('User updated:', response.data);
                // Optionally update user context or state here
              })
              .catch(error => {
                console.error('Error updating user:', error);
              });
            setShowAccountForm(false); // close after save
          }}
          onClose={() => setShowAccountForm(false)}
        />
      )}

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
            {notActiveProjects.map((p) => (
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
