import { createContext, useContext, useState } from 'react';

const TaskModalContext = createContext();

export const TaskModalProvider = ({ children }) => {
  const [showTaskModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskRefreshToken, setTaskRefreshToken] = useState(0);

  const openModalForNewTask = (initialData = {}) => {
    setSelectedTask({ ...initialData });
    setShowModal(true);
  };

  const openModalForEditTask = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedTask(null);
    setShowModal(false);
  };

  const triggerTaskRefresh = () => {
    setTaskRefreshToken(prev => prev + 1);
  };

  return (
    <TaskModalContext.Provider value={{
      showTaskModal,
      selectedTask,
      openModalForNewTask,
      openModalForEditTask,
      closeModal,
      triggerTaskRefresh,
      taskRefreshToken,
    }}>
      {children}
    </TaskModalContext.Provider>
  );
};

export const useTaskModal = () => useContext(TaskModalContext);
