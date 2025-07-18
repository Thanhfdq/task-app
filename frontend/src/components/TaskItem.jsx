import React from "react";
import { useTaskModal } from '../contexts/TaskModalContext';
import COLORS from "../constants/colors";
import axios from '../services/api';
import '../styles/TaskItem.css';

function TaskItem({ task }) {
    const { openModalForEditTask, triggerTaskRefresh } = useTaskModal();
    const today = new Date();
    const dueDate = new Date(task.end_date);
    const diffTime = dueDate.getTime() - today.getTime();

    let backgroundColor = COLORS.normal;
    let dueMessage = "";
    if (task.task_state === 0) {
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
            backgroundColor = COLORS.overdue;
            dueMessage = `Quá hạn ${Math.abs(diffDays)} ngày.`;
        } else if (diffDays <= 7) {
            backgroundColor = COLORS.nearDue;
            dueMessage = `Còn ${diffDays} ngày đến hạn.`;
        }
    }

    const formatDate = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleDateString("vi-VN");
    };

    const handleToggleTaskState = async (taskId) => {
        try {
            await axios.patch(`/tasks/${taskId}/toggle-state`);
            triggerTaskRefresh();
        } catch (err) {
            console.error('Lỗi khi cập nhật trạng thái công việc:', err);
        }
    };

    return (
        <div key={task.ID} className="task-card" style={{ backgroundColor }}>
            <div className="task-header">
                <input type="checkbox"
                    checked={task.task_state}
                    onChange={() => handleToggleTaskState(task.ID)} />
                <strong style={{ cursor: 'pointer' }}>
                    {task.task_name}
                </strong>
            </div>

            <div className="task-labels">
                {task.label?.split(",").map((label) => (
                    <span key={label} className="label-pill">
                        {label}
                    </span>
                ))}
            </div>


            <div className="task-meta">
                <span>
                    {task.performer_username} / {task.project_name}
                </span>
                <b>Ngày đến hạn: {formatDate(task.end_date)}</b>
                {dueMessage && <b className="due-alert">{dueMessage}</b>}
                <span>Người thực hiện: {task.performer_username || 'Chưa gán'}</span>
            </div>
            <div className="task-progress">
                <label>Tiến độ: {task.progress}%</label>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${task.progress}%` }} />
                </div>
            </div>
        </div>
    );
}

export default TaskItem;
