import { useTaskModal } from "../contexts/TaskModalContext";
import COLORS from "../constants/colors";
import axios from "../services/api";
import "../styles/TaskItem.css";
import {BiBook, BiUser, BiTime} from 'react-icons/bi';

function TaskItem({ task }) {
  const { openModalForEditTask, triggerTaskRefresh } = useTaskModal();
  const today = new Date();
  const dueDate = new Date(task.end_date);
  const diffTime = dueDate.getTime() - today.getTime();

  let backgroundColor = COLORS.done;
  let dueMessage = "";
  if (task.task_state === 0) {
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      backgroundColor = COLORS.overdue;
      dueMessage = `Quá hạn ${Math.abs(diffDays)} ngày.`;
    } else if (diffDays <= 7) {
      backgroundColor = COLORS.nearDue;
      dueMessage = `Còn ${diffDays} ngày đến hạn.`;
    } else {
      backgroundColor = COLORS.normal;
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
      console.error("Lỗi khi cập nhật trạng thái công việc:", err);
    }
  };

  return (
    <div key={task.ID} className="task-card" style={{ backgroundColor }}>
      <div className="task-header">
        <input
          type="checkbox"
          checked={task.task_state}
          onChange={() => handleToggleTaskState(task.ID)}
        />
        <h2
          onClick={() => openModalForEditTask(task)}
          style={{ cursor: "pointer" }}
        >
          {task.task_name}
        </h2>
      </div>

      <div className="task-meta">
        <p>
          <strong><BiBook/> Dự án:</strong> {task.project_name}
        </p>
        <p>
          <strong><BiUser/> Người thực hiện:</strong>{" "}
          {task.performer_username || "Chưa gán"}
        </p>
        <p>
          <strong><BiTime/> Ngày đến hạn:</strong> {formatDate(task.end_date)}
          {dueMessage && <span className="due-alert"> – {dueMessage}</span>}
        </p>
      </div>

      <div className="task-progress">
        <label>📊 Tiến độ: {task.progress}%</label>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${task.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export default TaskItem;
