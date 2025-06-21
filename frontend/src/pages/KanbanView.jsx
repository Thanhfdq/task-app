import React, { useState, useEffect, useRef } from 'react';
import axios from '../services/api';
import '../styles/KanbanView.css';
import { useTaskModal } from '../contexts/TaskModalContext';

export default function KanbanView({ project }) {
    const [columns, setColumns] = useState([]);
    const [tasksByColumn, setTasksByColumn] = useState({});
    const [isAddingColumn, setIsAddingColumn] = useState(false);
    const [newColumnName, setNewColumnName] = useState('');
    const inputRef = useRef(null);
    const { openModalForNewTask, openModalForEditTask, taskRefreshToken, triggerTaskRefresh } = useTaskModal();

    useEffect(() => {
        loadColumnsAndTasks();
    }, [taskRefreshToken]);

    const handleAddCard = (groupId, projectId) => {
        openModalForNewTask({
            project_id: projectId,
            group_id: groupId,
            performer_id: null,
            task_name: '',
            task_description: '',
            progress: 0,
            label: '',
            start_date: '',
            end_date: ''
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
                    new_group_id: targetGroupId
                });
                triggerTaskRefresh();
            } catch (err) {
                console.error("Failed to move task", err);
            }
        }
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
            {columns.map((col) => (
                <div key={col.ID} className="kanban-column"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, col.ID)}>
                    <div className="kanban-column-header">
                        <h4>{col.group_name}</h4>
                        <span>{tasksByColumn[col.ID]?.length || 0}</span>
                    </div>
                    <div className="kanban-cards">
                        {(tasksByColumn[col.ID] || []).map(task => (
                            <div
                                key={task.ID}
                                className="kanban-card"
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
                        <button className="add-card" onClick={() => handleAddCard(col.ID, project.ID)}>+ Add a Card</button>
                    </div>
                </div>
            ))}
            <div className="kanban-column add-column">
                {!isAddingColumn ? (
                    <button onClick={() => setIsAddingColumn(true)}>+ Thêm cột</button>
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
