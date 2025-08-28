// src/components/TaskList.jsx
import React, { useState, useMemo, useEffect } from 'react';
import '../styles/TaskList.css';
import TaskItem from '../components/TaskItem.jsx';
import {BiSort,BiCalendar, BiAt} from 'react-icons/bi';

function TaskList({ tasks }) {
  const [currentPage, setCurrentPage] = useState(1);
  const tasksPerPage = 5;

  const [sortField, setSortField] = useState('complete_date');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when task list changes
  }, [tasks]);

  const sortedTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      const fieldA = a[sortField]?.toString().toLowerCase() ?? '';
      const fieldB = b[sortField]?.toString().toLowerCase() ?? '';

      if (fieldA < fieldB) return sortOrder === 'asc' ? -1 : 1;
      if (fieldA > fieldB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [tasks, sortField, sortOrder]);

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * tasksPerPage;
    return sortedTasks.slice(start, start + tasksPerPage);
  }, [sortedTasks, currentPage]);

  const totalPages = Math.ceil(tasks.length / tasksPerPage);

  const changeSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="task-list-container">
      <div className="sort-bar">
        <span>Sắp xếp theo: </span>
        <button onClick={() => changeSort('task_name')}>
          <BiAt/>Tên công việc {sortField === 'task_name' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
        <button onClick={() => changeSort('complete_date')}>
          <BiCalendar/>Ngày đến hạn {sortField === 'complete_date' && (sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      <div className="task-list">
        {paginatedTasks.map((task) => (
          <TaskItem key={task.ID} task={task} />
        ))}

        {paginatedTasks.length === 0 && <p>Không có công việc nào.</p>}
      </div>

      <div className="pagination">
        <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>⏮</button>
        <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}>◀</button>
        <span>Trang {currentPage} / {totalPages}</span>
        <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>▶</button>
        <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>⏭</button>
      </div>
    </div>
  );
}

export default TaskList;
