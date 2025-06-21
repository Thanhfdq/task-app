import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage.jsx';
import AuthPage from './pages/AuthPage';
import TaskModal from './components/TaskModal.jsx';
import { UserProvider, useUser } from './contexts/UserContext.jsx';
import { TaskModalProvider, useTaskModal } from './contexts/TaskModalContext.jsx';

function AppContent() {
  const { showTaskModal } = useTaskModal();
  const { user, setUser } = useUser();

  return (
    <>
      <Routes>
        {!user ? (
          <Route path="/*" element={<AuthPage onAuthSuccess={setUser} />} />
        ) : (
          <Route path="/*" element={<MainPage user={user} />} />
        )}
      </Routes>

      {showTaskModal && <TaskModal />}
    </>
  );
}

function App() {

  return (
    <Router>
      <UserProvider>
        <TaskModalProvider>
          <AppContent />
        </TaskModalProvider>
      </UserProvider>
    </Router>
  );
}

export default App;
