import React from "react";

function MainScreen({ user }) {
  return (
    <div className="main-screen">
      <h2>Welcome, {user?.username || "User"}!</h2>
      <p>This is your main screen after login or registration.</p>
    </div>
  );
}

export default MainScreen;
