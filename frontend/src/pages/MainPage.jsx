import React, { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import { Routes, Route } from "react-router-dom";
import ReportPage from "./ReportPage.jsx";
import TasksPage from "./TasksPage.jsx";
import ProjectsPage from "./ProjectsPage.jsx";
import ProjectDetailPage from "./ProjectDetailPage.jsx";
import "../styles/MainPage.css";

export default function MainPage({ user }) {
  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <main className="content">
          <Routes>
            <Route path="/report" element={<ReportPage user={user} />} />
            <Route path="/tasks" element={<TasksPage user={user} />} />
            <Route path="/projects" element={<ProjectsPage user={user} />} />
            <Route
              path="/projects/:projectId"
              element={<ProjectDetailPage />}
            />
            <Route
              path="/tasks/my-tasks"
              element={<TasksPage onlyMine={true} user={user} />}
            />
          </Routes>
        </main>
      </div>
    </div>
  );
}
