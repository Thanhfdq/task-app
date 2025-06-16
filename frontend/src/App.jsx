import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import TasksPage from './pages/TaskPage.jsx';
import AuthPage from './pages/AuthPage';

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        {!user ? (
          <Route path="/*" element={<AuthPage onAuthSuccess={setUser} />} />
        ) : (
          <Route path="/*" element={<TasksPage user={user} />} />
        )}
      </Routes>
    </Router>
  );
}

export default App;
