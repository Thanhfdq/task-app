import React, { useState, useEffect } from "react";
import axios from "../services/api";
import { useTaskModal } from "../contexts/TaskModalContext";
import { useNavigate, useLocation } from "react-router-dom";
import TaskList from "../components/TaskList";
import "../styles/TasksPage.css";
import { BiTask } from "react-icons/bi";

function TasksPage({ user, onlyMine = false }) {
  const { taskRefreshToken, openModalForNewTask } = useTaskModal();
  const [tasks, setTasks] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [labels, setLabels] = useState([]);

  const navigate = useNavigate();

  const goToTab = (mine) => {
    navigate(mine ? "/tasks/my-tasks" : "/tasks");
  };

  useEffect(() => {
    fetchTasks();
  }, [keyword, labels, taskRefreshToken, onlyMine]);

  const fetchTasks = async () => {
    try {
      const params = {
        keyword,
        ...(onlyMine ? { assigneeId: user.id } : {}),
      };

      const res = await axios.get("/tasks", { params });
      setTasks(res.data);
    } catch (err) {
      console.error("Lỗi khi tải công việc:", err);
    }
  };

  return (
    <div className="tasks-page">
      <h2>
        <BiTask size={30} /> Tất cả công việc
      </h2>
      <div className="task-toolbar">
        <div className="task-toolbar-filters">
          <input
            type="text"
            className="task-search"
            placeholder="Tìm kiếm theo tên công việc, theo username"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="task-toolbar-tabs">
          <span
            className={`tab ${!onlyMine ? "active" : ""}`}
            onClick={() => goToTab(false)}
          >
            Tất cả
          </span>
          <span
            className={`tab ${onlyMine ? "active" : ""}`}
            onClick={() => goToTab(true)}
          >
            Công việc của tôi
          </span>
        </div>
      </div>

      <TaskList tasks={tasks} />
    </div>
  );
}

export default TasksPage;
