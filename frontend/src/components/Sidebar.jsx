import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTaskModal } from '../contexts/TaskModalContext';
import { useUser } from '../contexts/UserContext';
import AccountInfoForm from './AccountInfoForm';
import ChangePassword from './ChangePassword.jsx';
import axios from '../services/api';
import {
  FaTasks,
  FaProjectDiagram,
  FaUserCircle,
  FaUser,
  FaPlus,
  FaSignOutAlt
} from 'react-icons/fa';
import {
  TbLayoutSidebarRightCollapse,
  TbLayoutSidebarRightExpand,
  TbLockPassword,
  TbReload
} from 'react-icons/tb'
import '../styles/Sidebar.css';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const toggleSidebar = () => setCollapsed(!collapsed);
  const { openModalForNewTask } = useTaskModal();
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { user, logout } = useUser();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();
  const [error, setError] = useState('');
  const [projects, setProjects] = useState([]);


  const reloadSideBarList = () => {
    axios.get('/projects').then(res => setProjects(res.data));
  };

  useEffect(() => {
    // Fetch projects when the component mounts
    reloadSideBarList();
  }, []);

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

      {showChangePassword && (
        <ChangePassword
          onSave={(passwordData) => {
            axios.post('/users/change-password', { userId: user.id, ...passwordData })
              .then(response => {
                window.alert('Mật khẩu đã được thay đổi thành công.');
                setShowChangePassword(false); // close after save
              })
              .catch(error => {
                setError('Mật khẩu hiện tại không đúng hoặc có lỗi xảy ra.');
              });
          }}
          onClose={() => setShowChangePassword(false)}
          setError={setError}
          error={error}
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
        <div className="sidebar-list">
          <span>
            <div className="sidebar-list-title">Các danh sách</div>
            <button className="btn-secondary" onClick={() => reloadSideBarList()}>
              <TbReload></TbReload>
            </button>
          </span>
          <ul className="sidebar-list-items">
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
      <div className="account-menu-wrapper" ref={menuRef}>
        <button className="btn-secondary" onClick={() => setMenuOpen(!menuOpen)} ref={menuRef}>
          <FaUser />
          {!collapsed && (
            <span>{user.fullname}</span>
          )}
          {menuOpen && (
            <ul className="dropdown">
              <li onClick={() => setShowAccountForm(true)}><FaUser /> Hồ sơ</li>
              <li onClick={() => setShowChangePassword(true)}><TbLockPassword /> Đổi mật khẩu</li>
              <li onClick={logout}><FaSignOutAlt /> Đăng xuất</li>
            </ul>
          )}
        </button>
      </div>
    </aside>
  );
}
