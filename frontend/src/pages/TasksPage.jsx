import React, { useState, useEffect } from 'react';
import axios from '../services/api';
import { useTaskModal } from '../contexts/TaskModalContext';
import TaskList from '../components/TaskList';
import '../styles/TasksPage.css';

function TasksPage({ user }) {
    const { taskRefreshToken, openModalForNewTask } = useTaskModal();

    const [tasks, setTasks] = useState([]);
    const [keyword, setKeyword] = useState('');
    const [labels, setLabels] = useState([]);
    const [allLabels, setAllLabels] = useState(['Quan trọng', 'Bàn giao', 'Bug', 'UI']);

    useEffect(() => {
        fetchTasks();
    }, [keyword, labels, taskRefreshToken]);

    const fetchTasks = async () => {
        try {
            const params = {
                keyword,
                labels: labels.join(',')
            };
            const res = await axios.get('/tasks', { params });
            setTasks(res.data);
            console.log("This is Tasks after fetch:::");
            console.log(res.data);
        } catch (err) {
            console.log("Error when fetch task!!!");
            console.error(err);
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
                    <span className="tab active">Tất cả công việc</span>
                    <span className="tab">Công việc của tôi</span>
                    <button onClick={openModalForNewTask}>+ Tạo công việc mới</button>
                </div>

                <div className="task-toolbar-filters">
                    <input
                        type="text"
                        className="task-search"
                        placeholder="Tìm kiếm theo tên công việc, theo username"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                    />

                    <div className="label-filter">
                        {allLabels.map((label) => (
                            <button
                                key={label}
                                className={`label-pill ${labels.includes(label) ? 'selected' : ''}`}
                                onClick={() => toggleLabel(label)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <TaskList tasks={tasks} />
        </div>
    );
}

export default TasksPage;
