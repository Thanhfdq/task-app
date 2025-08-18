import React from "react";
import { useTaskModal } from "../contexts/TaskModalContext";
import TaskForm from "./TaskForm";
import "../styles/TaskModal.css";

function TaskModal() {
  const { showTaskModal, closeModal, selectedTask } = useTaskModal();
  if (!showTaskModal) return null;
  console.log(selectedTask);

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={closeModal} className="close-btn">
          ✖
        </button>
        <TaskForm task={selectedTask} />
      </div>
    </div>
  );
}

export default TaskModal;
