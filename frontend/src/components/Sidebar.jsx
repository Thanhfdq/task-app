import React from 'react';
import '../styles/sidebar.css';

export default function Sidebar({ recentProjects }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-section">Công việc</div>
      <div className="sidebar-section">Dự án</div>
      <div className="sidebar-recent">
        <div className="sidebar-recent-title">Dự án gần đây</div>
        <ul className="sidebar-recent-list">
          {recentProjects.map((p) => (
            <li key={p.project_id} className="sidebar-recent-item">
              ● {p.manager_username}/{p.project_name}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}