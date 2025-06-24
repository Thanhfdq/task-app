import React from 'react';
import '../styles/Drawer.css';

export default function Drawer({ isOpen, onClose, children }) {
  return (
    <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="drawer-content" onClick={e => e.stopPropagation()}>
        <button className="drawer-close" onClick={onClose}>×</button>
        {children}
      </div>
    </div>
  );
}
