import React, { useState, useEffect, useRef } from 'react';
import axios from '../services/api';
import '../styles/KanbanView.css';
import { useTaskModal } from '../contexts/TaskModalContext';
import { useClickAway } from 'react-use';

export default function KanbanView({ project }) {
    const [columns, setColumns] = useState([]);
    const [tasksByColumn, setTasksByColumn] = useState({});
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColumnName, setNewColumnName] = useState('');
    const [openMenuColId, setOpenMenuColId] = useState(null);
    const inputRef = useRef(null);
    const menuRef = useRef(null);

    const [editingGroupId, setEditingGroupId] = useState(null);
    const [editingGroupName, setEditingGroupName] = useState('');

    const { openModalForNewTask, openModalForEditTask, taskRefreshToken, triggerTaskRefresh } = useTaskModal();

    // Optional: close menu when clicking outside
    useClickAway(menuRef, () => setOpenMenuColId(null));

    useEffect(() => {
        loadColumnsAndTasks();
    }, [taskRefreshToken]);

    const handleAddCard = (groupId, projectId) => {
        openModalForNewTask({
            PROJECT_ID: projectId,
            GROUP_ID: groupId,
        });
    };

    const handleEditTask = (task) => {
        const taskWithProjectName = {
            ...task,
            project_name: project.project_name
        };

        openModalForEditTask(taskWithProjectName);
    };

    const handleCheckboxChange = async (task) => {
        try {
            await axios.patch(`/tasks/${task.ID}/toggle-state`);
            loadColumnsAndTasks();
        } catch (err) {
            console.error("Failed to toggle state", err);
        }
    };

    const handleDragStart = (e, task) => {
        e.dataTransfer.setData('taskId', task.ID);
        e.dataTransfer.setData('sourceGroupId', task.GROUP_ID);
    };

    const handleDrop = async (e, targetGroupId) => {
        const taskId = e.dataTransfer.getData('taskId');
        const sourceGroupId = e.dataTransfer.getData('sourceGroupId');

        if (sourceGroupId !== targetGroupId) {
            try {
                await axios.patch(`/tasks/${taskId}/move`, {
                    new_GROUP_ID: targetGroupId
                });
                triggerTaskRefresh();
            } catch (err) {
                console.error("Failed to move task", err);
            }
        }
    };

    const getColorByDueDate = (task_state, startDateStr, endDateStr) => {
        if (!task_state) {
            const todayStr = new Date().toISOString().split('T')[0];
            const dueStr = endDateStr || startDateStr;
            if (!dueStr) return '#fff';

            if (dueStr < todayStr) return '#dc3545'; // ❌ overdue - red
            const diffDays = Math.floor(
                (new Date(dueStr) - new Date(todayStr)) / (1000 * 60 * 60 * 24)
            );

            if (diffDays <= 7) return '#ffc107'; // ⚠️ due soon - yellow
        }
        return '#fff'; // ✅ ok - white
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    useEffect(() => {
        axios.get(`/projects/${project.ID}/groups`).then(res => {
            setColumns(res.data);
        });
    }, [project.ID, taskRefreshToken]);

    useEffect(() => {
        axios.get(`/projects/${project.ID}/tasks`).then(res => {
            const grouped = {};
            res.data.forEach(task => {
                if (!grouped[task.GROUP_ID]) grouped[task.GROUP_ID] = [];
                grouped[task.GROUP_ID].push(task);
            });
            setTasksByColumn(grouped);
        });
    }, [project.ID, taskRefreshToken]);

    useEffect(() => {
        loadColumnsAndTasks();
    }, [project.ID]);

    useEffect(() => {
        if (isAddingColumn && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isAddingColumn]);


    const handleAddColumn = async () => {
        if (!newColumnName.trim()) return;

        try {
            const res = await axios.post(`/projects/${project.ID}/groups`, {
                name: newColumnName
            });
            setIsAddingColumn(false);
            setNewColumnName('');
            loadColumnsAndTasks();
            triggerTaskRefresh();
        } catch (err) {
            console.error("Error adding column:", err);
        }
    };

    const handleRenameGroup = async (groupId) => {
        if (!editingGroupName.trim()) return;

        try {
            await axios.patch(`/projects/${project.ID}/groups/${groupId}`, {
                name: editingGroupName.trim()
            });
            setEditingGroupId(null);
            setEditingGroupName('');
            loadColumnsAndTasks();
            triggerTaskRefresh();
        } catch (err) {
            console.error("Failed to rename group:", err);
        }
    };

    const handleRemoveColumn = async (colId) => {
        try {
            await axios.delete(`/projects/${project.ID}/groups/${colId}`);
            setOpenMenuColId(null);
            loadColumnsAndTasks();
            triggerTaskRefresh();
        } catch (err) {
            console.error("Error removing column:", err);
        }
    };

    const loadColumnsAndTasks = async () => {
        try {
            const [colRes, taskRes] = await Promise.all([
                axios.get(`/projects/${project.ID}/groups`),
                axios.get(`/projects/${project.ID}/tasks`)
            ]);

            setColumns(colRes.data);

            const grouped = {};
            taskRes.data.forEach(task => {
                if (!grouped[task.GROUP_ID]) grouped[task.GROUP_ID] = [];
                grouped[task.GROUP_ID].push(task);
            });
            setTasksByColumn(grouped);
        } catch (err) {
            console.error("Error loading Kanban data:", err);
        }
    };


    return (
        <div className="kanban-view">
            {columns.map((col) => {
                const isEmpty = !tasksByColumn[col.ID] || tasksByColumn[col.ID].length === 0;
                return (
                    <div key={col.ID} className="kanban-column"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, col.ID)}>
                        <div className="kanban-column-header" style={{ position: 'relative' }}>
                            {/* Editable column name */}
                            {editingGroupId === col.ID ? (
                                <input
                                    value={editingGroupName}
                                    onChange={(e) => setEditingGroupName(e.target.value)}
                                    onBlur={() => handleRenameGroup(col.ID)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleRenameGroup(col.ID);
                                        } else if (e.key === 'Escape') {
                                            setEditingGroupId(null);
                                            setEditingGroupName('');
                                        }
                                    }}
                                    autoFocus
                                    style={{ fontSize: '1rem', fontWeight: 'bold', padding: '2px 4px' }}
                                />
                            ) : (
                                <h4
                                    onClick={() => {
                                        setEditingGroupId(col.ID);
                                        setEditingGroupName(col.group_name);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                    title="Click để đổi tên"
                                >
                                    {col.group_name}
                                </h4>
                            )}
                            <span>{tasksByColumn[col.ID]?.length || 0}</span>
                            <button
                                className="kanban-more-btn"
                                onClick={() => setOpenMenuColId(openMenuColId === col.ID ? null : col.ID)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 8 }}
                                aria-label="More"
                            >⋮</button>
                            {openMenuColId === col.ID && (
                                <div
                                    className="kanban-more-menu"
                                    ref={menuRef}
                                    style={{
                                        position: 'absolute',
                                        top: 30,
                                        right: 0,
                                        background: '#fff',
                                        border: '1px solid #ccc',
                                        borderRadius: 4,
                                        zIndex: 10,
                                        minWidth: 120,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    <button
                                        onClick={() => handleRemoveColumn(col.ID)}
                                        disabled={!isEmpty}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            background: 'none',
                                            border: 'none',
                                            color: isEmpty ? '#d00' : '#aaa',
                                            cursor: isEmpty ? 'pointer' : 'not-allowed',
                                            textAlign: 'left'
                                        }}
                                    >
                                        Remove
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="kanban-cards">
                            {(tasksByColumn[col.ID] || []).map(task => (
                                <div
                                    key={task.ID}
                                    className="kanban-card"
                                    style={{
                                        backgroundColor: getColorByDueDate(task.task_state, task.start_date, task.end_date)
                                    }}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, task)}
                                    onClick={() => openModalForEditTask(task)}
                                >
                                    <label>
                                        <input
                                            type="checkbox"
                                            checked={!!task.task_state}
                                            onChange={() => handleCheckboxChange(task)}
                                        />
                                        {task.task_state ? 'Hoàn thành' : 'Chưa xong'}
                                    </label>
                                    <h5 onClick={() => handleEditTask(task)} style={{ cursor: 'pointer' }}>{task.task_name}</h5>
                                    <p>{task.task_description}</p>
                                    <div className="task-meta">
                                        <span>⏱ {task.end_date || 'Unknown'}</span>
                                        <span>👤 {task.performer_username || 'Unassigned'}</span>
                                    </div>
                                </div>
                            ))}
                            <button className="add-card" onClick={() => handleAddCard(col.ID, project.ID)}>+ Thêm công việc</button>
                        </div>
                    </div>
                );
            })}
            <div className="kanban-column">
                {!isAddingColumn ? (
                    <button className='add-column' onClick={() => setIsAddingColumn(true)}>+ Thêm cột</button>
                ) : (
                    <div className="add-column-form">
                        <input
                            ref={inputRef}
                            value={newColumnName}
                            onChange={e => setNewColumnName(e.target.value)}
                            onBlur={handleAddColumn}
                            placeholder="Nhập tên cột..."
                        />
                        <button onMouseDown={() => setIsAddingColumn(false)}>✖</button>
                    </div>
                )}
            </div>
        </div>
    );
}
