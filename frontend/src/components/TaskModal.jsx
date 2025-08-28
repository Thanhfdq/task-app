import React from "react";
import { useTaskModal } from "../contexts/TaskModalContext";
import TaskForm from "./TaskForm";
import "../styles/TaskModal.css";
import {BiX} from "react-icons/bi";

function TaskModal() {
  const { showTaskModal, closeModal, selectedTask } = useTaskModal();
  if (!showTaskModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button onClick={closeModal} className="close-btn">
          <BiX size={24} />
        </button>
        <TaskForm task={selectedTask} />
      </div>
    </div>
  );
}

export default TaskModal;
