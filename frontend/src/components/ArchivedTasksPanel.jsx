import React, { useEffect, useState } from "react";
import axios from "../services/api";
import TaskItem from "../components/TaskItem.jsx";
import { useTaskModal } from "../contexts/TaskModalContext";
import "../styles/ArchivedTasksPanel.css"; // You can create this if needed
import { BiX, BiBox, BiArchiveOut, BiSearch } from "react-icons/bi";

export default function ArchivedTasksPanel({ isOpen, onClose, projectId }) {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filteredTasks, setFilteredTasks] = useState([]);

  const { triggerTaskRefresh } = useTaskModal();

  useEffect(() => {
    if (isOpen) {
      fetchArchivedTasks();
    }
  }, [isOpen]);

  const fetchArchivedTasks = async () => {
    try {
      const res = await axios.get(`/projects/${projectId}/tasks/archived`);
      setTasks(res.data);
      setFilteredTasks(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách task đã lưu trữ:", err);
    }
  };

  const handleSearch = () => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return setFilteredTasks(tasks);
    const results = tasks.filter(
      (task) =>
        task.task_name.toLowerCase().includes(keyword) ||
        (task.performer_username &&
          task.performer_username.toLowerCase().includes(keyword)) ||
        (task.project_name && task.project_name.toLowerCase().includes(keyword))
    );
    setFilteredTasks(results);
  };

  const restoreTask = async (taskId) => {
    try {
      await axios.patch(`/tasks/${taskId}/restore`);
      fetchArchivedTasks();
      triggerTaskRefresh();
    } catch (err) {
      alert("Không thể khôi phục công việc.");
    }
  };

  return isOpen ? (
    <div className="archived-panel-overlay">
      <div className="archived-panel">
        <button onClick={onClose} className="close-btn">
          <BiX size={24} />
        </button>
        <div className="archived-list">
          <h2><BiBox/> {filteredTasks.length} Công việc được lưu trữ </h2>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, người thực hiện, dự án..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button className="search-btn" onClick={handleSearch}>
              <BiSearch/> Tìm
            </button>
          </div>

          <div className="task-list">
            {filteredTasks.map((task) => (
              <div key={task.ID} style={{ position: "relative" }}>
                <TaskItem task={task} />
                <button
                  className="restore-btn"
                  onClick={() => restoreTask(task.ID)}
                >
                  <BiArchiveOut/> Khôi phục
                </button>
              </div>
            ))}
            {filteredTasks.length === 0 && (
              <p>Không có công việc nào phù hợp.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null;
}
