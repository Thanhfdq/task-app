import React from 'react';
import '../styles/topbar.css';

export default function Topbar() {
  return (
    <header className="topbar">
      <h1 className="topbar-title">Công việc</h1>
      <div className="topbar-actions">
        <input className="topbar-search" placeholder="Tìm kiếm" />
        <button className="topbar-button">+ Công việc mới</button>
        <button className="topbar-button-outline">Công việc của tôi</button>
        <div className="topbar-avatar"></div>
      </div>
    </header>
  );
}