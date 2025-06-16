import React from 'react';
import '../styles/taskitem.css';

export default function TaskItem({ task }) {
  return (
    <div className="task-item">
      <div className="task-title">{task.task_name}</div>
      <div className="task-tags">
        <span className="task-tag">{task.label}</span>
        <span className="task-tag">{task.task_state ? 'Đang làm' : 'Bàn giao'}</span>
      </div>
      <div className="task-meta">
        {task.username}/{task.project_name} - Due {task.end_date}
      </div>
    </div>
  );
}