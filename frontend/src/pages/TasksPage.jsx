import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import { useTaskModal } from '../contexts/TaskModalContext';
import { useNavigate, useLocation } from 'react-router-dom';
import TaskList from '../components/TaskList';
import '../styles/TasksPage.css';

function TasksPage({ user, onlyMine = false }) {
    const { taskRefreshToken, openModalForNewTask } = useTaskModal();
    const [tasks, setTasks] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [labels, setLabels] = useState([]);
    const [allLabels, setAllLabels] = useState(['Quan trọng', 'Bàn giao', 'Bug', 'UI']);

    const navigate = useNavigate();
    const location = useLocation();

    const goToTab = (mine) => {
        navigate(mine ? '/tasks/my-tasks' : '/tasks');
    };

    useEffect(() => {
        fetchTasks();
    }, [keyword, labels, taskRefreshToken, onlyMine]);

    const fetchTasks = async () => {
        try {
            const params = {
                keyword,
                labels: labels.join(','),
                ...(onlyMine ? { assigneeId: user.id } : {})
            };

            const res = await axios.get('/tasks', { params });
            console.log("parameters for fetching tasks:", params);
            console.log("Fetched tasks:", res.data);
            setTasks(res.data);
        } catch (err) {
            console.error("Lỗi khi tải công việc:", err);
        }
    };


    const toggleLabel = (label) => {
        setLabels((prev) =>
            prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
        );
    };

    return (
        <div className="tasks-page">
            <div className="task-toolbar">
                <div className="task-toolbar-tabs">
                    <span
                        className={`tab ${!onlyMine ? 'active' : ''}`}
                        onClick={() => goToTab(false)}
                    >
                        Tất cả công việc
                    </span>
                    <span
                        className={`tab ${onlyMine ? 'active' : ''}`}
                        onClick={() => goToTab(true)}
                    >
                        Công việc của tôi
                    </span>
                    <button onClick={() => openModalForNewTask({
                        start_date: new Date().toISOString().substring(0, 10),
                        end_date: new Date().toISOString().substring(0, 10)
                    })}>
                        + Tạo công việc mới
                    </button>
                </div>

                <div className="task-toolbar-filters">
                    <input
                        type="text"
                        className="task-search"
                        placeholder="Tìm kiếm theo tên công việc, theo username"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />
                </div>
            </div>

            <TaskList tasks={tasks} />
        </div>
    );
}

export default TasksPage;
