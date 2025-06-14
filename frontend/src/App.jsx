import React, { useState } from "react";
import AuthPage from "./pages/AuthPage";
import MainScreen from "./components/MainScreen";

function App() {
  const [user, setUser] = useState(null);

  return user ? (
    <MainScreen user={user} />
  ) : (
    <AuthPage onAuthSuccess={setUser} />
  );
}

export default App;
